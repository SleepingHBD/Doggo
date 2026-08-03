"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const gradient = { addColorStop() {} };
const scaleCalls = [];
const drawingContext = new Proxy({}, {
  get(target, property) {
    if (property === "createLinearGradient" || property === "createRadialGradient") return () => gradient;
    if (property === "scale") return (x, y) => scaleCalls.push([x, y]);
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
const dogButtons = [new FakeElement(), new FakeElement()];
dogButtons[0].dataset.dog = "maltipoo";
dogButtons[1].dataset.dog = "maltese";
const document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, new FakeElement());
    return elements.get(selector);
  },
  querySelectorAll(selector) { return selector === "[data-dog]" ? dogButtons : []; },
  createElement() { return new FakeElement(); }
};

const sandbox = {
  console, document, Image: FakeImage, performance: { now: () => 0 },
  requestAnimationFrame() {},
  setTimeout(callback) { callback(); return 1; },
  window: { addEventListener() {}, AudioContext: class {}, webkitAudioContext: class {} }
};
vm.createContext(sandbox);
const gameSource = fs.readFileSync(path.join(process.cwd(), "game.js"), "utf8");
vm.runInContext(gameSource, sandbox, { filename: "game.js" });

const questSummary = vm.runInContext(`questDefinitions.map((quest) => ({
  id: quest.id,
  exterior: quest.exterior,
  interior: quest.interior,
  place: quest.place,
  issuer: quest.issuer,
  travelObjective: quest.travelObjective,
  sellout: quest.sellout,
  triggerSpeakers: quest.trigger(flowers[0]).map((entry) => entry.speaker),
  triggerText: quest.trigger(flowers[0]).map((entry) => entry.text).join(" "),
  arrivalSpeakers: quest.arrival().map((entry) => entry.speaker),
  arrivalText: quest.arrival().map((entry) => entry.text).join(" "),
  closureSpeakers: quest.solved().map((entry) => entry.speaker),
  closureText: quest.solved().map((entry) => entry.text).join(" "),
  marketReturnSpeakers: quest.marketReturn(flowers[0]).map((entry) => entry.speaker),
  marketReturnText: quest.marketReturn(flowers[0]).map((entry) => entry.text).join(" "),
  steps: quest.steps.map((step) => step.x),
  stepGuidance: quest.steps.slice(0, -1).map((step) => ({
    speakers: step.lines().map((entry) => entry.speaker),
    text: step.lines().map((entry) => entry.text).join(" ")
  }))
}))`, sandbox);
const sceneSummary = vm.runInContext(`Object.fromEntries(Object.entries(SCENES).map(([id, config]) => [id, {
  asset: config.asset,
  doors: (config.doors || []).map((door) => ({ target: door.target, quest: door.quest || null }))
}]))`, sandbox);
const assetSummary = vm.runInContext(`({ ...assetSources })`, sandbox);
const markup = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
const stylesheet = fs.readFileSync(path.join(process.cwd(), "styles.css"), "utf8");

assert.doesNotMatch(
  gameSource,
  /Some evenings ended here slowly|Some memories leave|habit of complicating simple errands|Some plans change|every interruption become/,
  "the dialogue pass should not restore the old self-consciously philosophical narration"
);
const dogVoiceComparison = vm.runInContext(`(() => {
  player.type = "maltipoo"; player.name = "Momo";
  const momo = [memorySpots[1].lines().at(-1).text, questDefinitions[1].trigger(flowers[0]).find((entry) => entry.portrait === "player").text];
  player.type = "maltese"; player.name = "Mallow";
  const mallow = [memorySpots[1].lines().at(-1).text, questDefinitions[1].trigger(flowers[0]).find((entry) => entry.portrait === "player").text];
  player.type = "maltipoo"; player.name = "Momo";
  return { momo, mallow };
})()`, sandbox);
assert.notDeepEqual(dogVoiceComparison.momo, dogVoiceComparison.mallow, "Momo and Mallow should have distinct dialogue voices");

assert.match(markup, /Continue\s*<kbd>E<\/kbd>/, "dialogue should advertise the same E action used for interaction");
assert.match(markup, /<kbd>E<\/kbd> Interact \/ continue/, "the control legend should expose one shared action key");
assert.match(stylesheet, /\.dialogue__body>p\{[^}]*font:500 clamp\(13px,1\.5vw,18px\)/, "dialogue copy should remain large and comfortably weighted across screen sizes");
assert.match(stylesheet, /\.dialogue__body>p\{[^}]*text-shadow:\.35px 0 0/, "dialogue copy should retain a subtle weight boost even when the web font falls back");
assert.match(stylesheet, /\.dialogue-choices button\{[^}]*font-size:12px[^}]*font-weight:500/, "emotional choices should use the heavier dialogue type scale");
assert.doesNotMatch(stylesheet, /font-size:(?:6|7)px|clamp\((?:6|7)px/, "functional interface text should not fall back to squint-sized type");
assert.match(stylesheet, /\.quest-card strong\{[^}]*clamp\(13px,1\.6vw,19px\)/, "the current objective should remain readable over detailed backgrounds");

vm.runInContext(`state = "select"; menuIndex = 0;`, sandbox);
vm.runInContext(`handleMenuKeydown({ key: "ArrowRight", repeat: false, preventDefault() {} });`, sandbox);
assert.equal(vm.runInContext("menuIndex", sandbox), 1, "right arrow should select the next menu option");
vm.runInContext(`handleMenuKeydown({ key: "ArrowLeft", repeat: false, preventDefault() {} });`, sandbox);
assert.equal(vm.runInContext("menuIndex", sandbox), 0, "left arrow should select the previous menu option");

assert.equal(questSummary.length, 5, "the game should have five obstacle quests");
for (const quest of questSummary) {
  assert.equal(quest.steps.length, 3, `${quest.id} should have three interactions`);
  assert.ok(quest.steps.every((x, index) => index === 0 || x > quest.steps[index - 1]), `${quest.id} steps should run left to right`);
  assert.ok(sceneSummary[quest.exterior].doors.some((door) => door.target === quest.interior && door.quest === quest.id), `${quest.id} needs an exterior entrance`);
  assert.ok(sceneSummary[quest.interior].doors.some((door) => door.target === quest.exterior), `${quest.id} needs an interior exit`);
  assert.ok(quest.issuer?.name && quest.issuer?.portrait && quest.issuer?.sprite, `${quest.id} needs a visible market visitor`);
  assert.ok(quest.triggerSpeakers.includes(quest.issuer.name), `${quest.id} visitor should introduce their own obstacle`);
  assert.match(quest.triggerText, /Could you .*help/i, `${quest.id} visitor should directly ask the dog for help`);
  assert.match(quest.travelObjective, /^Go to .+ and help /, `${quest.id} should restate the accepted request as a clear travel objective`);
  assert.ok(quest.travelObjective.toLowerCase().includes(quest.exterior === "entrance" ? "market rooftop" : quest.place.toLowerCase()), `${quest.id} objective should name its destination`);
  assert.ok(quest.arrivalSpeakers.includes(quest.issuer.name), `${quest.id} visitor should personally brief the dog on arrival`);
  assert.match(quest.arrivalText, /start/i, `${quest.id} arrival dialogue should state the first action`);
  for (const [stepIndex, guidance] of quest.stepGuidance.entries()) {
    assert.ok(guidance.speakers.includes(quest.issuer.name), `${quest.id} step ${stepIndex + 1} should have the visitor direct the next action`);
    assert.match(guidance.text, /check|secure|set up|move|ring|bring|sit|carry|switch/i, `${quest.id} step ${stepIndex + 1} should clearly cue what comes next`);
  }
  assert.ok(quest.closureSpeakers.includes(quest.issuer.name), `${quest.id} visitor should close their obstacle at its location`);
  assert.match(quest.closureText, /stay|finish|pack/i, `${quest.id} closure should establish that the visitor remains behind`);
  assert.ok(!quest.triggerSpeakers.includes("The Florist"), `${quest.id} should not be dispatched by the florist`);
  assert.ok(quest.marketReturnSpeakers.includes("The Florist"), `${quest.id} market return should let the florist report the sale`);
  assert.ok(!quest.marketReturnSpeakers.includes(quest.issuer.name), `${quest.id} visitor should not follow the dog back to the market`);
  assert.ok(quest.sellout?.tag && quest.sellout?.accent && Number.isFinite(quest.sellout?.tilt), `${quest.id} needs a visible sell-out treatment`);
  assert.match(quest.marketReturnText, /last|closing|paid for/i, `${quest.id} return should establish that the flower sold while the dog was away`);
}
assert.equal(new Set(questSummary.map((quest) => quest.issuer.sprite)).size, 5, "each obstacle should have a distinct visitor sprite");
assert.equal(new Set(questSummary.map((quest) => quest.sellout.tag)).size, 5, "each sold flower should receive a distinct market tag");
for (const quest of questSummary) {
  vm.runInContext(`activeQuest = questDefinitions.find((candidate) => candidate.id === "${quest.id}"); activeQuest.stage = "travel"; updateHUD();`, sandbox);
  assert.equal(vm.runInContext("ui.quest.textContent", sandbox), quest.travelObjective, `${quest.id} HUD should repeat the visitor's request`);
}
vm.runInContext("activeQuest = null", sandbox);
assert.equal(vm.runInContext("SCENES.entrance.groundY", sandbox), 452, "the market entrance baseline should place paws on the pavement edge, not the curb face");
assert.equal(vm.runInContext("SCENES.poolInside.maxX", sandbox), 720, "the pool table should block the one-dimensional walk line");
assert.ok(
  vm.runInContext(`questDefinitions.find((quest) => quest.id === "pool").steps.at(-1).x <= SCENES.poolInside.maxX`, sandbox),
  "the last pool interaction should remain reachable from the table's near corner"
);

const poolWalkFrames = vm.runInContext(`visitorWalkFrameRects.poolplayer.map(({ y, height }) => ({ y, height }))`, sandbox);
assert.ok(poolWalkFrames.every(({ y, height }) => y + height <= 456), "pool-player walk crops must end at his shoes and exclude the next row's heads");

const dogFrameSummary = vm.runInContext(`Object.fromEntries(Object.entries(dogMasterFrameRects).map(([breed, groups]) => [breed,
  Object.fromEntries(Object.entries(groups).map(([group, frames]) => [group, frames.map(({ x, width }) => ({ x, width }))]))
]))`, sandbox);
for (const [breed, groups] of Object.entries(dogFrameSummary)) {
  for (const [group, frames] of Object.entries(groups)) {
    for (let index = 1; index < frames.length; index += 1) {
      assert.ok(
        frames[index - 1].x + frames[index - 1].width < frames[index].x,
        `${breed} ${group} frame ${index - 1} must not capture pixels from frame ${index}`
      );
    }
  }
}

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
vm.runInContext(`
  currentScene = "poolInside";
  player.x = 710;
  keys.right = true;
  keys.sprint = true;
  update(0.2, 250);
`, sandbox);
assert.equal(vm.runInContext("player.x", sandbox), 720, "the dog should stop at the pool table instead of crossing through it");
assert.doesNotThrow(() => vm.runInContext(`
  assets.dogMaltipoo = { width: 1536, height: 1024 };
  assets.dogMaltese = { width: 1536, height: 1024 };
  assets.visitorWalk = { width: 1254, height: 1254 };
  drawDogSprite(ctx, 400, SCENES.bench.groundY, "maltipoo", "walk", "right", 0, 1);
  drawDogSprite(ctx, 400, SCENES.bench.groundY, "maltese", "run", "left", 3, 1);
  drawVisitorWalkSprite(400, SCENES.market.groundY, "tankkeeper", 0, "right");
  drawVisitorWalkSprite(400, SCENES.market.groundY, "ted", 3, "left");
  drawWorldIndicator(400, 320, "E", 100, true);
  drawWorldIndicator(500, 320, "↑", 200, false);
`, sandbox), "dog and visitor locomotion cycles should render from their atlases");
scaleCalls.length = 0;
vm.runInContext(`drawVisitorWalkSprite(400, SCENES.market.groundY, "tankkeeper", 0, "right");`, sandbox);
assert.deepEqual(scaleCalls.at(-1), [-1, 1], "a right-moving visitor should mirror the left-facing source art");
scaleCalls.length = 0;
vm.runInContext(`drawVisitorWalkSprite(400, SCENES.market.groundY, "tankkeeper", 0, "left");`, sandbox);
assert.equal(scaleCalls.length, 0, "a left-moving visitor should keep the source art orientation");
vm.runInContext(`assets.visitors = { width: 1536, height: 1024 };`, sandbox);
scaleCalls.length = 0;
vm.runInContext(`drawVisitorSprite(400, SCENES.market.groundY, visitorSpriteRects.tankkeeper, "right", 200);`, sandbox);
assert.equal(scaleCalls.length, 0, "a visitor standing left of the dog should face right toward the dog without mirroring");
scaleCalls.length = 0;
vm.runInContext(`drawVisitorSprite(400, SCENES.market.groundY, visitorSpriteRects.tankkeeper, "left", 200);`, sandbox);
assert.deepEqual(scaleCalls.at(-1), [-1, 1], "a returning visitor standing right of the dog should mirror to face left toward the dog");
vm.runInContext(`keys.right = false; keys.sprint = false; update(0.1, 300);`, sandbox);
assert.equal(vm.runInContext("player.pose", sandbox), "idle", "releasing movement should stop the sprint pose");

assert.equal(assetSummary.bench, "assets/bench-benchmark-v1.png", "the familiar bench should use the restrained benchmark environment");
assert.equal(assetSummary.dogMaltipoo, "assets/dog-maltipoo-authored-v2.png", "the brown Maltipoo should use the low-resolution authored animation atlas");
assert.equal(assetSummary.dogMaltese, "assets/dog-maltese-authored-v2.png", "the white Maltese should use the low-resolution authored animation atlas");
assert.equal(assetSummary.visitors, "assets/character-visitors-authored-v2.png", "market visitors should share the restrained low-resolution character bible");
assert.equal(assetSummary.visitorWalk, "assets/character-visitors-walk-v2.png", "market visitors should use restrained walk cycles");
assert.equal(assetSummary.traveller, "assets/character-traveller-authored-v2.png", "the traveller should use the restrained low-resolution character bible");
assert.equal(assetSummary.benchCompanion, "assets/character-companion-authored-v2.png", "the ending companion should use the restrained low-resolution character atlas");
assert.equal(assetSummary.supportingCast, "assets/character-supporting-cast-v2.png", "the rooftop cast and Bell should use the restrained supporting-character atlas");
assert.equal(assetSummary.questEffects, "assets/quest-effects-atlas-v1.png", "quest actions should share one authored pixel-art effects atlas");
assert.equal(assetSummary.bellHome, "assets/interior-bell-home-benchmark-v3.png", "Bell's room should use the empty-chair layered revision with the Norwegian flag");
assert.equal("portraits" in assetSummary, false, "portraits should be cropped from the same world-character artwork instead of a mismatched atlas");
const benchmarkBackgrounds = {
  aquarium: "assets/exterior-aquarium-benchmark-v1.png",
  dateNight: "assets/exterior-date-night-benchmark-v1.png",
  catStories: "assets/exterior-cat-stories-benchmark-v1.png",
  entrance: "assets/market-entrance-benchmark-v1.png",
  market: "assets/market-interior-benchmark-v1.png",
  aquariumInside: "assets/interior-aquarium-benchmark-v3.png",
  poolInside: "assets/interior-pool-benchmark-v2.png",
  catInside: "assets/interior-cat-cafe-benchmark-v2.png",
  bellHome: "assets/interior-bell-home-benchmark-v3.png",
  rooftop: "assets/rooftop-benchmark-v1.png"
};
for (const [asset, source] of Object.entries(benchmarkBackgrounds)) {
  assert.equal(assetSummary[asset], source, `${asset} should use its restrained benchmark background`);
}
assert.doesNotMatch(
  gameSource,
  /fillRect\(775,\s*182,\s*292,\s*151\)/,
  "the aquarium should use a shark-free background instead of a flat rectangular tank mask"
);
assert.doesNotMatch(
  gameSource,
  /fillRect\(500,\s*402,\s*width,\s*25\)/,
  "the rooftop landing should use grounded cushions instead of a flat rectangular platform"
);
assert.match(gameSource, /function drawQuestEffectSprite\(/, "quest props should render from the authored effects atlas");
assert.match(gameSource, /withWorldClip\(aquariumTankWindows\.deep/, "the discovered shark should remain clipped inside the deep tank");
assert.match(gameSource, /withWorldClip\(aquariumTankWindows\.reef/, "the tropical fish should remain clipped inside the reef tank");
assert.match(gameSource, /drawQuestEffectSprite\("guard"/, "the pool lamp guard should use the authored pixel-art treatment");
assert.doesNotMatch(gameSource, /function drawSharkSilhouette\(/, "the aquarium should not fall back to a flat polygon shark");
assert.doesNotMatch(gameSource, /function drawPoolLampGuard\(/, "the pool hall should not fall back to programmer-drawn lamp geometry");
const questEffectSummary = vm.runInContext(`Object.fromEntries(Object.entries(questEffectRects).map(([kind, rect]) => [kind, ({ ...rect })]))`, sandbox);
assert.deepEqual(
  Object.keys(questEffectSummary).sort(),
  ["ball", "bell", "bowls", "cushions", "fish", "guard", "mouse", "shark"],
  "all eight recurring quest effects should come from the cohesive atlas"
);
const reefWindow = vm.runInContext(`({ ...aquariumTankWindows.reef })`, sandbox);
const fishStartWidth = 42 * (questEffectSummary.fish.width / questEffectSummary.fish.height);
assert.ok(218 - fishStartWidth / 2 >= reefWindow.x, "the animated fish school should begin fully inside the reef tank glass");
assert.ok(218 + fishStartWidth / 2 <= reefWindow.x + reefWindow.width, "the animated fish school should not clip through the reef tank's right edge");
assert.doesNotThrow(() => vm.runInContext(`
  for (const config of Object.values(SCENES)) assets[config.asset] = { width: 1672, height: 941 };
  for (const sceneId of Object.keys(SCENES)) {
    currentScene = sceneId;
    drawSceneBackground();
  }
`, sandbox), "every environment should render through the shared aspect-preserving background pipeline");
assert.doesNotThrow(() => vm.runInContext(`
  assets.bench = { width: 1672, height: 941 };
  assets.benchCompanion = { width: 1774, height: 887 };
  assets.dogMaltipoo = { width: 1536, height: 1024 };
  assets.dogMaltese = { width: 1536, height: 1024 };
  currentScene = "bench";
  journey.returning = true;
  journey.reunion = false;
  drawSceneBackground();
  drawNPCs(800);
  drawPortrait("her");
`, sandbox), "the benchmark environment and layered ending companion should render together");
vm.runInContext(`
  state = "playing";
  player.x = 820;
  update(0.1, 850);
`, sandbox);
assert.equal(vm.runInContext("nearbyReunion", sandbox), true, "the reunion interaction should align with the rebuilt bench");

vm.runInContext(`
  resetGame();
  currentScene = travellerEncounter.scene;
  state = "playing";
  player.x = travellerEncounter.x;
  player.y = SCENES[currentScene].groundY;
  update(0.1, 400);
`, sandbox);
assert.equal(vm.runInContext("nearbyTraveller", sandbox), true, "the roadside traveller should be interactable");
vm.runInContext(`interact(); dialogue.onComplete();`, sandbox);
assert.equal(vm.runInContext("travellerEncounter.stage", sandbox), "searching", "the traveller should ask the dog to find the tag");
vm.runInContext(`
  state = "playing";
  player.x = travellerEncounter.tagX;
  update(0.1, 500);
`, sandbox);
assert.equal(vm.runInContext("nearbyTravelTag", sandbox), true, "the lost luggage tag should be interactable");
vm.runInContext(`interact(); dialogue.onComplete();`, sandbox);
assert.equal(vm.runInContext("travellerEncounter.stage", sandbox), "returning", "collecting the tag should send the dog back to the traveller");
vm.runInContext(`
  state = "playing";
  player.x = travellerEncounter.x;
  update(0.1, 600);
  interact();
`, sandbox);
assert.equal(vm.runInContext("travellerEncounter.stage", sandbox), "receiving", "the handoff should use the dedicated receiving pose");
vm.runInContext(`dialogue.onComplete(); update(0.1, 900); var travellerFrameA = Math.floor(travellerEncounter.walkFrame) % 4; var travellerXA = travellerEncounter.departureX;`, sandbox);
vm.runInContext(`update(0.1, 1100); var travellerFrameB = Math.floor(travellerEncounter.walkFrame) % 4;`, sandbox);
assert.notEqual(vm.runInContext("travellerFrameA", sandbox), vm.runInContext("travellerFrameB", sandbox), "the traveller should cycle through distinct walk frames while leaving");
assert.ok(vm.runInContext("travellerEncounter.departureX > travellerXA", sandbox), "the walk cycle should advance with the traveller's movement");
vm.runInContext(`update(0.1, 5000);`, sandbox);
assert.equal(vm.runInContext("travellerEncounter.stage", sandbox), "complete", "the traveller should wave and walk out of frame after the handoff");
assert.equal(vm.runInContext("scene.resolved", sandbox), 0, "the optional traveller vignette must not consume a flower obstacle");
assert.doesNotThrow(() => vm.runInContext(`
  assets.traveller = { width: 1254, height: 1254 };
  travellerEncounter.stage = "waiting";
  drawTravellerEncounter(700);
  travellerEncounter.stage = "departing";
  travellerEncounter.motionStartedAt = 0;
  travellerEncounter.walkFrame = 2;
  drawTravellerEncounter(2000);
  drawPortrait("traveller");
`, sandbox), "the traveller's story poses, walk cycle, and portrait should render from the atlas");

assert.doesNotThrow(() => vm.runInContext(`
  assets.visitors = { width: 1536, height: 1024 };
  assets.supportingCast = { width: 1774, height: 887 };
  currentScene = "rooftop";
  activeQuest = questDefinitions.find((quest) => quest.id === "leap");
  activeQuest.stage = "solve";
  drawNPCs(1200);
  for (const kind of ["marshall", "lily", "robin", "barney", "bell", "narrator"]) drawPortrait(kind);
`, sandbox), "the rooftop cast, Bell, and narrator portraits should render from the unified character system");
const rooftopCastLayout = vm.runInContext(`Object.fromEntries(Object.entries(supportingCastLayout).map(([kind, layout]) => [kind, ({ ...layout })]))`, sandbox);
assert.ok(
  Object.values(rooftopCastLayout).every(({ height, footOffset }) => height >= 150 && footOffset >= 1),
  "every rooftop guest should be clearly taller than the 93px idle dog and anchored at the paving line"
);

vm.runInContext(`state = "playing"; currentScene = "market"; journey.market = true;`, sandbox);
for (let questIndex = 0; questIndex < 5; questIndex += 1) {
  vm.runInContext(`
    currentScene = "market";
    state = "playing";
    var questFlowerId = flowers.find((flower) => flower.active).id;
    startObstacle(flowers.find((flower) => flower.id === questFlowerId));
    assets.visitors = { width: 1536, height: 1024 };
    assets.visitorWalk = { width: 1254, height: 1254 };
    drawNPCs(360);
  `, sandbox);
  assert.equal(vm.runInContext("state", sandbox), "visitorArrival", "a visitor should walk in before dialogue starts");
  assert.ok(vm.runInContext("activeQuest.visitorStartX < activeQuest.visitorCameraX", sandbox), "the visitor should begin beyond the visible left edge");
  assert.ok(vm.runInContext("activeQuest.visitorTargetX < player.x", sandbox), "the visitor should stop to the left of the dog");
  vm.runInContext(`
    update(0.1, 3000);
  `, sandbox);
  assert.equal(vm.runInContext("state", sandbox), "dialogue", "dialogue should wait for the walk-in to finish");
  vm.runInContext(`
    dialogue.onComplete();
    update(0.1, 6000);
    currentScene = activeQuest.exterior;
    var questDoor = SCENES[currentScene].doors.find((door) => door.quest === activeQuest.id);
    player.x = questDoor.x;
    player.y = SCENES[currentScene].groundY;
    state = "playing";
    handleUp();
    dialogue.onComplete();
  `, sandbox);
  assert.equal(vm.runInContext("activeQuest.visitorPhase", sandbox), "away", "the visitor should leave to the left before control returns");
  assert.equal(vm.runInContext("activeQuest.issuer.name", sandbox), questSummary[questIndex].issuer.name, "the correct visitor should arrive for the obstacle");
  assert.ok(vm.runInContext("Number.isFinite(activeQuest.visitorX)", sandbox), "the market visitor should receive a world position");
  assert.equal(vm.runInContext("activeQuest.stage", sandbox), "solve", "Up should enter the quest location");
  assert.equal(vm.runInContext("currentScene", sandbox), questSummary[questIndex].interior, "quest entrance should load its interior");
  assert.doesNotThrow(() => vm.runInContext("drawQuestSetPieces(900); drawNPCs(900);", sandbox), `${questSummary[questIndex].id} should render its helper and initial set-piece state`);

  for (let stepIndex = 0; stepIndex < 3; stepIndex += 1) {
    vm.runInContext(`
      state = "playing";
      nearbyQuestStep = activeQuest.steps[activeQuest.step];
      interactQuestStep();
    `, sandbox);
    assert.equal(vm.runInContext("state", sandbox), "questAction", `${questSummary[questIndex].id} step ${stepIndex + 1} should animate before dialogue`);
    assert.equal(vm.runInContext("questAction.stepIndex", sandbox), stepIndex, `${questSummary[questIndex].id} should animate the correct step`);
    assert.doesNotThrow(() => vm.runInContext("questAction.progress = 0.55; drawQuestSetPieces(1200); drawNPCs(1200);", sandbox), `${questSummary[questIndex].id} step ${stepIndex + 1} action should render mid-animation`);
    vm.runInContext(`
      updateQuestAction(questAction.startedAt + questAction.duration + 1);
    `, sandbox);
    assert.equal(vm.runInContext("state", sandbox), "dialogue", `${questSummary[questIndex].id} step ${stepIndex + 1} dialogue should follow the visual action`);
    assert.equal(vm.runInContext("activeQuest.visualStep", sandbox), stepIndex + 1, `${questSummary[questIndex].id} step ${stepIndex + 1} should leave a persistent visual change`);
    vm.runInContext(`
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
  assert.equal(vm.runInContext("activeQuest.visitorPhase", sandbox), "away", "the helped visitor should remain at their location instead of reappearing in the market");
  assert.equal(vm.runInContext("dialogue.lines.some((entry) => entry.speaker === activeQuest.issuer.name)", sandbox), false, "the market sell-out scene should not include the obstacle visitor");
  vm.runInContext("dialogue.onComplete();", sandbox);
  assert.equal(vm.runInContext("activeQuest", sandbox), null, "returning should close the active quest");
  assert.equal(vm.runInContext("scene.resolved", sandbox), questIndex + 1, "returning should resolve exactly one obstacle");
  assert.equal(vm.runInContext("flowers.find((flower) => flower.id === questFlowerId).active", sandbox), false, "the inspected flower should sell out during the detour");
  assert.equal(vm.runInContext("flowers.find((flower) => flower.id === questFlowerId).sale.tag", sandbox), questSummary[questIndex].sellout.tag, "the sold flower should retain its quest-specific market tag");
  assert.doesNotThrow(() => vm.runInContext("drawSoldOutDisplays(1200);", sandbox), "sold-out displays should render over unavailable buckets");
}

assert.equal(vm.runInContext("flowers.filter((flower) => flower.active).length", sandbox), 1, "one final flower should remain");
assert.equal(vm.runInContext("flowers.filter((flower) => flower.sale).length", sandbox), 5, "five flowers should be visibly marked as sold");
console.log("Quest flow smoke test passed: five locations resolved, one final flower remains.");
