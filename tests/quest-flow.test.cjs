"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const gradient = { addColorStop() {} };
const drawingContext = new Proxy({}, {
  get(target, property) {
    if (property === "createLinearGradient" || property === "createRadialGradient") return () => gradient;
    if (!(property in target)) target[property] = () => {};
    return target[property];
  },
  set(target, property, value) { target[property] = value; return true; }
});

class FakeElement {
  constructor() {
    this.hidden = false;
    this.style = {};
    this.dataset = {};
    this.classList = { add() {}, remove() {}, contains() { return false; } };
  }
  addEventListener() {}
  appendChild() {}
  setAttribute() {}
  getContext() { return drawingContext; }
  querySelector() { return new FakeElement(); }
}

class FakeImage {
  constructor() { this.listeners = {}; this.width = 1448; this.height = 1086; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  set src(value) { this.source = value; queueMicrotask(() => this.listeners.load?.()); }
}

const elements = new Map();
const document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, new FakeElement());
    return elements.get(selector);
  },
  querySelectorAll() { return []; },
  createElement() { return new FakeElement(); }
};

const sandbox = {
  console, document, Image: FakeImage, performance: { now: () => 0 },
  requestAnimationFrame() {},
  setTimeout(callback) { callback(); return 1; },
  window: { addEventListener() {}, AudioContext: class {}, webkitAudioContext: class {} }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), "game.js"), "utf8"), sandbox, { filename: "game.js" });

const questSummary = vm.runInContext(`questDefinitions.map((quest) => ({
  id: quest.id,
  exterior: quest.exterior,
  interior: quest.interior,
  issuer: quest.issuer,
  triggerSpeakers: quest.trigger(flowers[0]).map((entry) => entry.speaker),
  returnSpeakers: quest.returned(flowers[0]).map((entry) => entry.speaker),
  steps: quest.steps.map((step) => step.x)
}))`, sandbox);
const sceneSummary = vm.runInContext(`Object.fromEntries(Object.entries(SCENES).map(([id, config]) => [id, {
  asset: config.asset,
  doors: (config.doors || []).map((door) => ({ target: door.target, quest: door.quest || null }))
}]))`, sandbox);
const assetSummary = vm.runInContext(`({ ...assetSources })`, sandbox);

assert.equal(questSummary.length, 5, "the game should have five obstacle quests");
for (const quest of questSummary) {
  assert.equal(quest.steps.length, 3, `${quest.id} should have three interactions`);
  assert.ok(quest.steps.every((x, index) => index === 0 || x > quest.steps[index - 1]), `${quest.id} steps should run left to right`);
  assert.ok(sceneSummary[quest.exterior].doors.some((door) => door.target === quest.interior && door.quest === quest.id), `${quest.id} needs an exterior entrance`);
  assert.ok(sceneSummary[quest.interior].doors.some((door) => door.target === quest.exterior), `${quest.id} needs an interior exit`);
  assert.ok(quest.issuer?.name && quest.issuer?.portrait && quest.issuer?.sprite, `${quest.id} needs a visible market visitor`);
  assert.ok(quest.triggerSpeakers.includes(quest.issuer.name), `${quest.id} visitor should introduce their own obstacle`);
  assert.ok(quest.returnSpeakers.includes(quest.issuer.name), `${quest.id} visitor should close their own obstacle`);
  assert.ok(!quest.triggerSpeakers.includes("The Florist"), `${quest.id} should not be dispatched by the florist`);
  assert.ok(!quest.returnSpeakers.includes("The Florist"), `${quest.id} should not be closed by the florist`);
}
assert.equal(new Set(questSummary.map((quest) => quest.issuer.sprite)).size, 5, "each obstacle should have a distinct visitor sprite");

for (const source of Object.values(assetSummary)) {
  assert.ok(fs.existsSync(path.join(process.cwd(), source)), `missing asset: ${source}`);
}

vm.runInContext(`
  state = "playing";
  currentScene = "bench";
  player.x = 400;
  keys.right = true;
  keys.sprint = false;
  update(0.1, 100);
`, sandbox);
const walkingDistance = vm.runInContext("player.x - 400", sandbox);
vm.runInContext(`
  player.x = 400;
  player.walkFrame = 0;
  keys.sprint = true;
  update(0.1, 200);
`, sandbox);
const sprintingDistance = vm.runInContext("player.x - 400", sandbox);
assert.ok(sprintingDistance > walkingDistance * 1.5, "sprinting should be materially faster than walking");
assert.equal(vm.runInContext("player.pose", sandbox), "run", "sprinting should use the run pose");
assert.doesNotThrow(() => vm.runInContext(`
  assets.locomotion = { width: 1254, height: 1254 };
  drawDogSprite(ctx, 400, SCENES.bench.groundY, "maltipoo", "walk", "right", 0, 1);
  drawDogSprite(ctx, 400, SCENES.bench.groundY, "maltese", "run", "left", 3, 1);
  drawWorldIndicator(400, 320, "E", 100, true);
  drawWorldIndicator(500, 320, "↑", 200, false);
`, sandbox), "both locomotion cycles should render from the new atlas");
vm.runInContext(`keys.right = false; keys.sprint = false; update(0.1, 300);`, sandbox);
assert.equal(vm.runInContext("player.pose", sandbox), "idle", "releasing movement should stop the sprint pose");

vm.runInContext(`state = "playing"; currentScene = "market"; journey.market = true;`, sandbox);
for (let questIndex = 0; questIndex < 5; questIndex += 1) {
  vm.runInContext(`
    currentScene = "market";
    state = "playing";
    startObstacle(flowers.find((flower) => flower.active));
    assets.visitors = { width: 1536, height: 1024 };
    drawNPCs(360);
    dialogue.onComplete();
    currentScene = activeQuest.exterior;
    var questDoor = SCENES[currentScene].doors.find((door) => door.quest === activeQuest.id);
    player.x = questDoor.x;
    player.y = SCENES[currentScene].groundY;
    state = "playing";
    handleUp();
    dialogue.onComplete();
  `, sandbox);
  assert.equal(vm.runInContext("activeQuest.issuer.name", sandbox), questSummary[questIndex].issuer.name, "the correct visitor should arrive for the obstacle");
  assert.ok(vm.runInContext("Number.isFinite(activeQuest.visitorX)", sandbox), "the market visitor should receive a world position");
  assert.equal(vm.runInContext("activeQuest.stage", sandbox), "solve", "Up should enter the quest location");
  assert.equal(vm.runInContext("currentScene", sandbox), questSummary[questIndex].interior, "quest entrance should load its interior");

  for (let stepIndex = 0; stepIndex < 3; stepIndex += 1) {
    vm.runInContext(`
      state = "playing";
      nearbyQuestStep = activeQuest.steps[activeQuest.step];
      interactQuestStep();
      dialogue.onComplete();
    `, sandbox);
  }

  assert.equal(vm.runInContext("activeQuest.stage", sandbox), "return", "solved quest should require a market return");
  vm.runInContext(`
    var exitDoor = SCENES[currentScene].doors[0];
    player.x = exitDoor.x;
    state = "playing";
    handleUp();
  `, sandbox);
  assert.equal(vm.runInContext("currentScene", sandbox), questSummary[questIndex].exterior, "Up should leave the quest location");
  vm.runInContext(`
    currentScene = "entrance";
    player.x = 620;
    player.y = SCENES.entrance.groundY;
    state = "playing";
    handleUp();
  `, sandbox);
  assert.equal(vm.runInContext("currentScene", sandbox), "market", "Up should take the player back into the market");
  vm.runInContext("dialogue.onComplete();", sandbox);
  assert.equal(vm.runInContext("activeQuest", sandbox), null, "returning should close the active quest");
  assert.equal(vm.runInContext("scene.resolved", sandbox), questIndex + 1, "returning should resolve exactly one obstacle");
}

assert.equal(vm.runInContext("flowers.filter((flower) => flower.active).length", sandbox), 1, "one final flower should remain");
console.log("Quest flow smoke test passed: five locations resolved, one final flower remains.");
