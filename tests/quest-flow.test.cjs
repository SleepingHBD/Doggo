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
    this.listeners = {};
    this.classList = { add() {}, remove() {}, contains() { return false; } };
  }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  click() { for (const callback of this.listeners.click || []) callback({ preventDefault() {} }); }
  focus() {}
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
const checkpointButtons = ["market", "tennis", "aquarium", "pool", "cats", "bell", "cinema", "leap", "final", "ending"]
  .map((checkpoint) => {
    const button = new FakeElement();
    button.dataset.checkpoint = checkpoint;
    return button;
  });
const document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, new FakeElement());
    return elements.get(selector);
  },
  querySelectorAll(selector) {
    if (selector === "[data-dog]") return dogButtons;
    if (selector === "[data-checkpoint]") return checkpointButtons;
    return [];
  },
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
const bellDialogue = vm.runInContext(`(() => {
  const quest = questDefinitions.find((candidate) => candidate.id === "bell");
  return [
    ...quest.trigger(flowers[0]),
    ...quest.arrival(),
    ...quest.steps.flatMap((step) => step.lines()),
    ...quest.solved()
  ].map((entry) => entry.text).join(" ");
})()`, sandbox);
const leapDialogue = vm.runInContext(`(() => {
  const quest = questDefinitions.find((candidate) => candidate.id === "leap");
  return [
    ...quest.trigger(flowers[0]),
    ...quest.arrival(),
    ...quest.steps.flatMap((step) => step.lines()),
    ...quest.solved()
  ].map((entry) => entry.text).join(" ");
})()`, sandbox);
const poolDialogue = vm.runInContext(`(() => {
  const quest = questDefinitions.find((candidate) => candidate.id === "pool");
  return [
    ...quest.trigger(flowers[0]),
    ...quest.arrival(),
    ...quest.steps.flatMap((step) => step.lines()),
    ...quest.solved()
  ].map((entry) => entry.text).join(" ");
})()`, sandbox);
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
assert.match(bellDialogue, /\bhe\b|\bhim\b|\bhis\b/i, "Bell should be referred to with male pronouns");
assert.doesNotMatch(bellDialogue, /\bshe\b|\bher\b|\bhers\b/i, "Bell's dialogue should not use female pronouns");
assert.match(leapDialogue, /hot tub/i, "the rooftop should visibly and narratively reference the neighboring hot-tub patio");
assert.match(leapDialogue, /Marshall runs first/i, "Marshall should lead the recognizable one-by-one rooftop leap");
assert.doesNotMatch(leapDialogue, /cushion|landing pad|signal lamp/i, "the rebuilt rooftop should not restore the invented cushion-and-signal-lamp version");
assert.match(poolDialogue, /missing 8-ball|8-ball vanished/i, "the pool obstacle should be a clear missing 8-ball search");
assert.match(poolDialogue, /tray|track|beneath the chair|rolls out|nudge/i, "the pool search should have physical clues, discovery and return beats");
assert.doesNotMatch(poolDialogue, /guard|protect the hanging lamp|one safe shot/i, "the old lamp-guard obstacle should be fully removed");
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
assert.equal((markup.match(/data-checkpoint=/g) || []).length, 10, "the title menu should expose all ten scene checkpoints");
for (const label of ["Flower Market", "Tennis Court", "Aquarium", "Pool Hall", "Cat Cafe", "Bell's Home", "Cinema", "The Leap", "Final Flower", "Ending Bench"]) {
  assert.match(markup, new RegExp(`>${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<`), `the checkpoint menu should include ${label}`);
}

vm.runInContext(`state = "select"; menuIndex = 0;`, sandbox);
vm.runInContext(`handleMenuKeydown({ key: "ArrowRight", repeat: false, preventDefault() {} });`, sandbox);
assert.equal(vm.runInContext("menuIndex", sandbox), 1, "right arrow should select the next menu option");
vm.runInContext(`handleMenuKeydown({ key: "ArrowLeft", repeat: false, preventDefault() {} });`, sandbox);
assert.equal(vm.runInContext("menuIndex", sandbox), 0, "left arrow should select the previous menu option");

vm.runInContext(`state = "title"; menuIndex = 0; audioMuted = true;`, sandbox);
vm.runInContext(`handleMenuKeydown({ key: "ArrowDown", repeat: false, preventDefault() {} });`, sandbox);
assert.equal(vm.runInContext("menuIndex", sandbox), 1, "down from Begin should select the first scene checkpoint");
vm.runInContext(`handleMenuKeydown({ key: "Enter", repeat: false, preventDefault() {} });`, sandbox);
assert.equal(vm.runInContext("currentScene", sandbox), "market", "the first keyboard checkpoint should open the flower market");
assert.equal(vm.runInContext("state", sandbox), "playing", "a checkpoint should enter playable state immediately");

vm.runInContext(`jumpToCheckpoint("cinema");`, sandbox);
assert.deepEqual(
  JSON.parse(vm.runInContext(`JSON.stringify({ scene: currentScene, quest: activeQuest.id, stage: activeQuest.stage, step: activeQuest.step, resolved: scene.resolved, dog: player.type })`, sandbox)),
  { scene: "cinemaInside", quest: "cinema", stage: "solve", step: 0, resolved: 4, dog: "maltipoo" },
  "a mission checkpoint should restore its interior, NPC quest and preceding sell-outs"
);
vm.runInContext(`jumpToCheckpoint("tennis");`, sandbox);
assert.deepEqual(
  JSON.parse(vm.runInContext(`JSON.stringify({ scene: currentScene, stage: tennisEncounter.stage, resolved: scene.resolved, dog: player.type })`, sandbox)),
  { scene: "tennisCourt", stage: "rally", resolved: 0, dog: "maltipoo" },
  "the tennis checkpoint should open the optional pre-market vignette without consuming an obstacle"
);
vm.runInContext(`jumpToCheckpoint("final");`, sandbox);
assert.equal(vm.runInContext(`flowers.filter((flower) => flower.active).length`, sandbox), 1, "the final-flower checkpoint should leave exactly one bloom");
assert.equal(vm.runInContext(`scene.resolved`, sandbox), 6, "the final-flower checkpoint should mark all six obstacles resolved");
vm.runInContext(`jumpToCheckpoint("ending");`, sandbox);
assert.deepEqual(
  JSON.parse(vm.runInContext(`JSON.stringify({ scene: currentScene, returning: journey.returning, flower: endingFlower.id, activeFlowers: flowers.filter((flower) => flower.active).length })`, sandbox)),
  { scene: "bench", returning: true, flower: "jasmine", activeFlowers: 0 },
  "the ending checkpoint should place Momo at the bench carrying the final flower"
);
vm.runInContext(`resetGame(); audioContext = null; audioMuted = false;`, sandbox);

vm.runInContext(`
  state = "playing"; currentScene = "bench"; player.x = SCENES.bench.maxX; keys.right = true;
  checkJourneyTransitions();
`, sandbox);
assert.equal(vm.runInContext("currentScene", sandbox), "tennisCourt", "the familiar bench should lead into the new tennis-court street");
vm.runInContext(`
  state = "playing"; player.x = SCENES.tennisCourt.maxX; keys.right = true;
  checkJourneyTransitions();
`, sandbox);
assert.equal(vm.runInContext("currentScene", sandbox), "aquarium", "the tennis court should connect forward to the aquarium street");
vm.runInContext(`
  state = "playing"; player.x = SCENES.aquarium.minX; keys.right = false; keys.left = true;
  checkJourneyTransitions(); keys.left = false;
`, sandbox);
assert.equal(vm.runInContext("currentScene", sandbox), "tennisCourt", "the aquarium should connect back through the tennis-court street");

vm.runInContext(`
  state = "playing"; currentScene = "catStories"; player.x = SCENES.catStories.maxX; keys.right = true;
  checkJourneyTransitions();
`, sandbox);
assert.equal(vm.runInContext("currentScene", sandbox), "cinemaStreet", "the evening route should pass the cinema before the market");
vm.runInContext(`
  state = "playing"; player.x = SCENES.cinemaStreet.maxX; keys.right = true;
  checkJourneyTransitions();
`, sandbox);
assert.equal(vm.runInContext("currentScene", sandbox), "entrance", "the cinema street should connect forward to the market entrance");
vm.runInContext(`
  state = "playing"; player.x = SCENES.entrance.minX; keys.right = false; keys.left = true;
  checkJourneyTransitions(); keys.left = false;
`, sandbox);
assert.equal(vm.runInContext("currentScene", sandbox), "cinemaStreet", "the market route should remain reversible through the cinema street");

assert.equal(questSummary.length, 6, "the game should have six obstacle quests");
assert.equal(vm.runInContext("TOTAL_QUESTS", sandbox), questSummary.length, "the declared obstacle count should match the quest list");
assert.equal(vm.runInContext("flowers.length", sandbox), 7, "six detours should still leave one final flower");
for (const quest of questSummary) {
  assert.equal(quest.steps.length, 3, `${quest.id} should have three interactions`);
  assert.ok(quest.steps.every((x, index) => index === 0 || x > quest.steps[index - 1]), `${quest.id} steps should run left to right`);
  assert.ok(
    quest.steps.every((x) => vm.runInContext(`SCENES.${quest.interior}.minX <= ${x} && ${x} <= SCENES.${quest.interior}.maxX`, sandbox)),
    `${quest.id} interactions should all remain inside the playable interior bounds`
  );
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
    assert.match(guidance.text, /check|secure|set up|move|ring|bring|sit|carry|switch|turn|repeat|press|light|inspect|search|nudge|return|signal/i, `${quest.id} step ${stepIndex + 1} should clearly cue what comes next`);
  }
  assert.ok(quest.closureSpeakers.includes(quest.issuer.name), `${quest.id} visitor should close their obstacle at its location`);
  assert.match(quest.closureText, /stay|finish|pack/i, `${quest.id} closure should establish that the visitor remains behind`);
  assert.ok(!quest.triggerSpeakers.includes("The Florist"), `${quest.id} should not be dispatched by the florist`);
  assert.ok(quest.marketReturnSpeakers.includes("The Florist"), `${quest.id} market return should let the florist report the sale`);
  assert.ok(!quest.marketReturnSpeakers.includes(quest.issuer.name), `${quest.id} visitor should not follow the dog back to the market`);
  assert.ok(quest.sellout?.tag && quest.sellout?.accent && Number.isFinite(quest.sellout?.tilt), `${quest.id} needs a visible sell-out treatment`);
  assert.match(quest.marketReturnText, /last|closing|paid for/i, `${quest.id} return should establish that the flower sold while the dog was away`);
}
assert.equal(new Set(questSummary.map((quest) => quest.issuer.sprite)).size, 6, "each obstacle should have a distinct visitor sprite");
assert.equal(new Set(questSummary.map((quest) => quest.sellout.tag)).size, 6, "each sold flower should receive a distinct market tag");
for (const quest of questSummary) {
  vm.runInContext(`activeQuest = questDefinitions.find((candidate) => candidate.id === "${quest.id}"); activeQuest.stage = "travel"; updateHUD();`, sandbox);
  assert.equal(vm.runInContext("ui.quest.textContent", sandbox), quest.travelObjective, `${quest.id} HUD should repeat the visitor's request`);
}
vm.runInContext("activeQuest = null", sandbox);
assert.equal(vm.runInContext("SCENES.entrance.groundY", sandbox), 452, "the market entrance baseline should place paws on the pavement edge, not the curb face");
assert.equal(vm.runInContext("SCENES.poolInside.maxX", sandbox), 535, "the rebuilt pool table should preserve a complete dog-width buffer at its visible near corner");
assert.ok(
  vm.runInContext(`questDefinitions.find((quest) => quest.id === "pool").steps.at(-1).x <= SCENES.poolInside.maxX`, sandbox),
  "the last pool interaction should remain reachable from the table's near corner"
);
const poolLayoutSummary = vm.runInContext(`({
  tableLeft: POOL_LAYOUT.table.left,
  surface: { ...POOL_LAYOUT.table.surface },
  foregroundBody: POOL_LAYOUT.table.foreground.body.map((point) => [...point]),
  foregroundLegs: POOL_LAYOUT.table.foreground.legs.map((leg) => ({ ...leg })),
  playerMaxX: POOL_LAYOUT.playerMaxX,
  helperX: POOL_LAYOUT.helper.x,
  helperPickupX: POOL_LAYOUT.helper.pickupX,
  helperTableX: POOL_LAYOUT.helper.tableX,
  helperHeight: POOL_LAYOUT.helper.height,
  missingBall: { ...POOL_LAYOUT.missingBall },
  searchActionDuration: questActionStyles.pool.durations[1],
  returnActionDuration: questActionStyles.pool.durations[2],
  interactions: { ...POOL_LAYOUT.interactions }
})`, sandbox);
const widestPoolRunHalfWidth = vm.runInContext(`Math.max(
  ...dogMasterFrameRects.maltipoo.run.map((rect) => 85 * DOG_ART_SCALE * (rect.width / rect.height) / 2),
  ...dogMasterFrameRects.maltese.run.map((rect) => 85 * DOG_ART_SCALE * (rect.width / rect.height) / 2)
)`, sandbox);
assert.ok(
  poolLayoutSummary.playerMaxX + widestPoolRunHalfWidth < poolLayoutSummary.tableLeft,
  "even the widest sprint frame should remain visibly clear of the pool table"
);
assert.ok(
  poolLayoutSummary.helperX > poolLayoutSummary.tableLeft,
  "the pool player should begin behind the regulation-height table rather than floating in the dog's lane"
);
assert.ok(poolLayoutSummary.helperHeight >= 190, "the pool player should be clearly human-sized beside the playable dog");
const poolHelperLeft = poolLayoutSummary.helperX - poolLayoutSummary.helperHeight * 0.2;
assert.ok(
  poolLayoutSummary.playerMaxX + widestPoolRunHalfWidth < poolHelperLeft,
  "the dog should stop before its widest sprint frame can overlap the enlarged pool player"
);
assert.ok(
  poolLayoutSummary.helperPickupX < poolLayoutSummary.tableLeft &&
    poolLayoutSummary.helperPickupX < poolLayoutSummary.helperX &&
    poolLayoutSummary.helperTableX > poolLayoutSummary.tableLeft,
  "the pool player should walk around the table's visible corner to collect the ball and return behind its apron"
);
assert.ok(poolLayoutSummary.returnActionDuration >= 8000, "the approach, pickup, carrying walk and table return should have enough screen time to read as separate actions");
assert.ok(
  458 - poolLayoutSummary.surface.y < poolLayoutSummary.helperHeight * 0.6,
  "the pool-table surface should sit near an adult character's hip rather than their chest or shoulders"
);
assert.ok(
  poolLayoutSummary.foregroundBody.length >= 6 && poolLayoutSummary.foregroundLegs.length >= 2,
  "the table should use a shaped apron and separate leg masks instead of a rectangular character eraser"
);
assert.ok(
  poolLayoutSummary.foregroundBody[0][1] <= poolLayoutSummary.surface.y &&
    poolLayoutSummary.foregroundBody[1][1] <= poolLayoutSummary.surface.y,
  "the table depth mask should include the felt surface so a character's legs cannot render inside the table"
);
assert.ok(
  Object.values(poolLayoutSummary.interactions).every((x) => x <= poolLayoutSummary.playerMaxX),
  "every pool interaction anchor should remain reachable without entering the table"
);
assert.ok(
  poolLayoutSummary.missingBall.hidingX < poolLayoutSummary.missingBall.foundX &&
    poolLayoutSummary.missingBall.foundX < poolLayoutSummary.missingBall.returnX,
  "the missing 8-ball should roll out past the dog before returning to the pool player"
);
for (const dogX of [poolLayoutSummary.interactions.hidingPlace - 70, poolLayoutSummary.interactions.hidingPlace + 60]) {
  const rollStartX = dogX + poolLayoutSummary.missingBall.dogOffsetX;
  const dogCoverEdge = dogX + poolLayoutSummary.missingBall.dogCoverHalfWidth;
  const discoveredX = Math.max(
    poolLayoutSummary.missingBall.foundX,
    Math.min(dogX + poolLayoutSummary.missingBall.rollClearance, poolLayoutSummary.missingBall.returnX - 28)
  );
  assert.ok(rollStartX < dogCoverEdge, "the 8-ball should begin behind the dog's visible silhouette");
  assert.ok(discoveredX > dogCoverEdge + 6.5, "the 8-ball should finish clearly beyond the dog's paws and muzzle");
}
assert.ok(poolLayoutSummary.missingBall.dogCoverHalfWidth <= 32, "the ball reveal edge should sit beneath the dog's front-leg silhouette rather than beyond its nose");
const poolBallEmergenceMs =
  (poolLayoutSummary.missingBall.emergenceEnd - poolLayoutSummary.missingBall.emergenceStart) *
  (poolLayoutSummary.missingBall.rollEnd - poolLayoutSummary.missingBall.rollStart) *
  poolLayoutSummary.searchActionDuration;
assert.ok(poolBallEmergenceMs >= 600, "the ball should take long enough to visibly emerge past the dog's silhouette");
assert.ok(
  poolLayoutSummary.missingBall.rackX >= poolLayoutSummary.surface.x &&
    poolLayoutSummary.missingBall.rackX <= poolLayoutSummary.surface.x + poolLayoutSummary.surface.width &&
    poolLayoutSummary.missingBall.rackY >= poolLayoutSummary.surface.y &&
    poolLayoutSummary.missingBall.rackY <= poolLayoutSummary.surface.y + poolLayoutSummary.surface.height,
  "the returned 8-ball should finish inside the authored felt surface"
);
assert.doesNotMatch(gameSource, /drawCueSafetyTag|drawCueMeasureTicks|drawPocketTicks/, "the obsolete safe-shot effects should not return");
assert.doesNotMatch(gameSource, /qaPool|qaScene|qaBell|applyLocalVisualQA/, "temporary visual QA controls must not ship in the production build");

const bellHomeLayout = vm.runInContext(`({
  helperHeight: BELL_HOME_LAYOUT.helper.height,
  bellHeight: BELL_HOME_LAYOUT.bell.height,
  chairY: BELL_HOME_LAYOUT.bell.chairY,
  floorY: BELL_HOME_LAYOUT.bell.floorY,
  playerGroundY: SCENES.bellHome.groundY
})`, sandbox);
assert.ok(bellHomeLayout.helperHeight >= 190, "Bell's caretaker should read at adult scale in the closer room perspective");
assert.ok(bellHomeLayout.helperHeight > 93 * 2, "Bell's caretaker should be clearly taller than the playable dog");
assert.ok(bellHomeLayout.bellHeight < 93, "Bell should remain smaller than the playable dog");
assert.ok(bellHomeLayout.chairY < bellHomeLayout.floorY, "Bell's chair pose should begin above the floor landing");
assert.equal(bellHomeLayout.floorY, bellHomeLayout.playerGroundY + 1, "Bell's landing paws should share the room floor line");

assert.match(gameSource, /function drawPoolPlayerSequenceFrame\(/, "the pool player should use one normalized atlas for gestures, walking and retrieval");
assert.doesNotMatch(gameSource, /function drawPoolPlayerWalkFrame\(|function drawPoolPlayerActionFrame\(/, "the pool player should not switch between mismatched scale and baseline renderers");
assert.match(gameSource, /function drawPoolQuestDog\(/, "both playable dogs should use a dedicated sniff-and-paw performance");

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
  player.x = 490;
  keys.right = true;
  keys.sprint = true;
  update(0.2, 250);
`, sandbox);
assert.equal(vm.runInContext("player.x", sandbox), 535, "the dog's complete sprint silhouette should stop at the visible pool-table boundary");
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
assert.equal(assetSummary.tennisCourt, "assets/exterior-tennis-court-benchmark-v6.png", "the tennis vignette should use an accurately divided authored court with uninterrupted foreground paving");
assert.equal(assetSummary.tennisPlayers, "assets/character-tennis-players-v1.png", "the court players should use a dedicated multi-pose rally atlas");
assert.equal(assetSummary.dogMaltipoo, "assets/dog-maltipoo-authored-v2.png", "the brown Maltipoo should use the low-resolution authored animation atlas");
assert.equal(assetSummary.dogMaltese, "assets/dog-maltese-authored-v2.png", "the white Maltese should use the low-resolution authored animation atlas");
assert.equal(assetSummary.visitors, "assets/character-visitors-authored-v2.png", "market visitors should share the restrained low-resolution character bible");
assert.equal(assetSummary.visitorWalk, "assets/character-visitors-walk-v2.png", "market visitors should use restrained walk cycles");
assert.equal(assetSummary.traveller, "assets/character-traveller-authored-v2.png", "the traveller should use the restrained low-resolution character bible");
assert.equal(assetSummary.benchCompanion, "assets/character-companion-authored-v2.png", "the ending companion should use the restrained low-resolution character atlas");
assert.equal(assetSummary.supportingCast, "assets/character-supporting-cast-v2.png", "the rooftop cast and Bell's portraits should use the restrained supporting-character atlas");
assert.equal(assetSummary.bellJump, "assets/character-bell-jump-v1.png", "Bell's chair jump should use a dedicated multi-pose animation atlas");
assert.equal(assetSummary.rooftopJumps, "assets/character-rooftop-jumps-v1.png", "the rooftop cast should use dedicated airborne poses instead of sliding standing sprites");
assert.equal(assetSummary.rooftopCart, "assets/rooftop-market-cart-v1.png", "the rooftop run-up should contain an authored movable market cart");
assert.equal(assetSummary.cinemaProjection, "assets/cinema-projection-hail-mary-v1.png", "the cinema should use an authored diegetic space projection");
assert.equal(assetSummary.projectionist, "assets/character-projectionist-v1.png", "the cinema should use its authored projectionist atlas");
assert.equal(assetSummary.cafeCats, "assets/character-cafe-cats-v1.png", "the cat cafe should use three authored quest cats");
assert.equal(assetSummary.poolEightBall, "assets/pool-eight-ball-v1.png", "the pool quest should use an authored 8-ball sprite matched to the rebuilt table");
assert.equal(assetSummary.poolPlayerSequence, "assets/character-pool-player-sequence-v2.png", "the pool player should use one normalized gesture, walk and recovery atlas");
assert.equal("poolPlayerActions" in assetSummary, false, "the mismatched legacy action atlas should no longer be loaded");
assert.equal("poolPlayerWalk" in assetSummary, false, "the mismatched legacy walk atlas should no longer be loaded");
assert.equal(assetSummary.poolDogActions, "assets/dog-pool-search-actions-v1.png", "both dogs should use a dedicated search-and-paw atlas");
assert.equal(assetSummary.questEffects, "assets/quest-effects-atlas-v2.png", "quest actions should use the cleaned authored pixel-art effects atlas");
assert.equal(assetSummary.bellHome, "assets/interior-bell-home-benchmark-v5.png", "Bell's room should use the human-scale Norwegian-flag interior");
assert.equal("portraits" in assetSummary, false, "portraits should be cropped from the same world-character artwork instead of a mismatched atlas");
const benchmarkBackgrounds = {
  tennisCourt: "assets/exterior-tennis-court-benchmark-v6.png",
  aquarium: "assets/exterior-aquarium-benchmark-v1.png",
  dateNight: "assets/exterior-date-night-benchmark-v1.png",
  catStories: "assets/exterior-cat-stories-benchmark-v1.png",
  cinemaStreet: "assets/exterior-cinema-benchmark-v1.png",
  entrance: "assets/market-entrance-benchmark-v1.png",
  market: "assets/market-interior-benchmark-v2.png",
  aquariumInside: "assets/interior-aquarium-benchmark-v4.png",
  poolInside: "assets/interior-pool-benchmark-v9.png",
  catInside: "assets/interior-cat-cafe-benchmark-v3.png",
  bellHome: "assets/interior-bell-home-benchmark-v5.png",
  rooftop: "assets/rooftop-benchmark-v5.png",
  cinemaInside: "assets/interior-cinema-benchmark-v2.png"
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
  "the rooftop gap should remain part of the authored environment instead of a flat rectangular platform"
);
assert.match(gameSource, /function drawQuestEffectSprite\(/, "quest props should render from the authored effects atlas");
assert.match(gameSource, /withWorldClip\(aquariumTankWindows\.deep/, "the discovered shark should remain clipped inside the deep tank");
assert.match(gameSource, /withWorldClip\(aquariumTankWindows\.reef/, "the tropical fish should remain clipped inside the reef tank");
assert.match(gameSource, /function drawPoolSearchTrail\(/, "the missing ball should leave a restrained floor-level search trail");
assert.match(gameSource, /function drawMissingEightBall\(/, "the discovered 8-ball should have a dedicated readable foreground sprite");
assert.match(gameSource, /drawAuthoredPoolEightBall\(ball\.rackX, ball\.rackY, 11, 1, true\)/, "the recovered authored 8-ball should visibly return to the rack");
assert.match(gameSource, /const rollOutProgress = clamp\(/, "the hidden 8-ball should use a linear clock for readable reveal phases");
assert.match(gameSource, /returnActionProgress < 0\.18/, "the dog should visibly roll the 8-ball to the pool player's collection point");
assert.match(gameSource, /returnActionProgress >= 0\.98/, "the retrieved 8-ball should receive a separate felt-roll phase into the rack");
assert.match(gameSource, /ctx\.rotate\(rotation\)/, "the authored 8-ball sprite should rotate according to its travelled distance");
assert.match(gameSource, /activeQuest\.poolBallStartX = player\.x \+ ball\.dogOffsetX/, "the discovered ball should begin at the dog's far side rather than at a fixed empty-floor coordinate");
assert.match(gameSource, /const dogCoverEdge = .* \+ dogActionShift \+ ball\.dogCoverHalfWidth/, "the ball reveal should track the dog's moving silhouette");
assert.match(gameSource, /withWorldClip\(\{ x: dogCoverEdge/, "the dog's body should occlude the ball until it physically rolls clear");
assert.match(gameSource, /const emergenceProgress = smoothstep\(clamp\(/, "the ball should have a dedicated slow silhouette-emergence phase");
assert.match(gameSource, /function drawPoolForegroundOcclusion\(/, "the rebuilt table apron should naturally occlude characters walking behind it");
assert.match(gameSource, /foreground\.body\.forEach/, "the pool-table occlusion should follow the authored rail silhouette");
assert.match(gameSource, /foreground\.legs\.forEach/, "the pool-table legs should occlude independently while leaving the space beneath the apron visible");
assert.doesNotMatch(gameSource, /function drawPoolBall\(/, "the rebuilt table should not overlay primitive code-drawn coloured balls");
assert.doesNotMatch(gameSource, /drawQuestEffectSprite\("guard"/, "the removed lamp-guard objective should not leave visual effects behind");
assert.match(gameSource, /function drawCinemaQuestVisuals\(/, "the cinema should have scene-native mission choreography");
assert.match(gameSource, /function drawCinemaProjection\(/, "the final cinema picture should render from an authored projected image");
assert.doesNotMatch(gameSource, /function drawCinemaSignal\(|function drawCinemaTestFrame\(/, "the cinema should not rebuild its screen from UI-like primitive rectangles");
const cinemaLayout = vm.runInContext(`({ screen: { ...CINEMA_LAYOUT.screen }, aisleLights: [...CINEMA_LAYOUT.aisleLights] })`, sandbox);
assert.ok(cinemaLayout.screen.width > cinemaLayout.screen.height, "the cinema screen must read as landscape rather than a portrait UI panel");
assert.ok(cinemaLayout.aisleLights.every((x, index) => index === 0 || x > cinemaLayout.aisleLights[index - 1]), "cinema aisle lights should progress toward the right-facing screen");
assert.match(gameSource, /function drawCafeCatSprite\(/, "the cat cafe should animate authored cats instead of relying on dialogue alone");
assert.doesNotMatch(gameSource, /function drawSharkSilhouette\(/, "the aquarium should not fall back to a flat polygon shark");
assert.doesNotMatch(gameSource, /function drawPoolLampGuard\(/, "the pool hall should not fall back to programmer-drawn lamp geometry");
const questEffectSummary = vm.runInContext(`Object.fromEntries(Object.entries(questEffectRects).map(([kind, rect]) => [kind, ({ ...rect })]))`, sandbox);
assert.deepEqual(
  Object.keys(questEffectSummary).sort(),
  ["ball", "bell", "bowls", "cushions", "fish", "guard", "mouse", "shark"],
  "all eight recurring quest effects should come from the cohesive atlas"
);
const cafeCatSummary = vm.runInContext(`({
  eating: cafeCatRects.eating.map((rect) => ({ ...rect })),
  walking: cafeCatRects.walking.map((rect) => ({ ...rect }))
})`, sandbox);
assert.equal(cafeCatSummary.eating.length, 3, "all three cafe cats should have a feeding pose");
assert.equal(cafeCatSummary.walking.length, 3, "all three cafe cats should have a movement pose");
const projectionistFrames = vm.runInContext(`projectionistWalkFrameRects.map((rect) => ({ ...rect }))`, sandbox);
assert.equal(projectionistFrames.length, 4, "the projectionist should use a four-phase walk cycle");
for (let index = 1; index < projectionistFrames.length; index += 1) {
  assert.ok(
    projectionistFrames[index - 1].x + projectionistFrames[index - 1].width < projectionistFrames[index].x,
    "projectionist walk crops should not capture pixels from adjacent frames"
  );
}
const reefWindow = vm.runInContext(`({ ...aquariumTankWindows.reef })`, sandbox);
const fishStartWidth = 42 * (questEffectSummary.fish.width / questEffectSummary.fish.height);
assert.ok(208 - fishStartWidth / 2 >= reefWindow.x, "the animated fish school should begin fully inside the reef tank glass");
assert.ok(257 + fishStartWidth / 2 <= reefWindow.x + reefWindow.width, "the animated fish school should not clip through the reef tank's right edge");
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

vm.runInContext(`
  resetGame();
  currentScene = "tennisCourt";
  state = "playing";
  player.x = TENNIS_LAYOUT.triggerX;
  player.y = SCENES.tennisCourt.groundY;
  tennisEncounter.rallyEpoch = 1;
  update(0.01, 1000);
`, sandbox);
assert.equal(vm.runInContext("tennisEncounter.stage", sandbox), "escaping", "passing the court should send one rally ball visibly over the fence");
vm.runInContext(`updateTennisEncounter(1000 + TENNIS_LAYOUT.escapeDuration + 1);`, sandbox);
assert.equal(vm.runInContext("tennisEncounter.stage", sandbox), "loose", "the escaped ball should finish on the playable pavement");
vm.runInContext(`
  state = "playing";
  player.x = tennisEncounter.ballX;
  update(0.01, 3100);
`, sandbox);
assert.equal(vm.runInContext("nearbyTennisBall", sandbox), true, "the loose tennis ball should expose a clear interaction");
vm.runInContext(`interact();`, sandbox);
assert.equal(vm.runInContext("state", sandbox), "tennisAction", "the first tennis interaction should animate before changing position");
assert.equal(vm.runInContext("tennisEncounter.stage", sandbox), "returning", "one deliberate nudge should send the ball back onto the court");
vm.runInContext(`updateTennisEncounter(TENNIS_LAYOUT.returnDuration + 1);`, sandbox);
assert.equal(vm.runInContext("tennisEncounter.stage", sandbox), "celebrating", "the court player should acknowledge the completed return");
assert.equal(vm.runInContext("tennisEncounter.completed", sandbox), true, "the optional tennis vignette should remember completion");
assert.equal(vm.runInContext("scene.resolved", sandbox), 0, "the tennis vignette must not consume a flower obstacle");
const tennisGeometry = JSON.parse(vm.runInContext("JSON.stringify(TENNIS_LAYOUT)", sandbox));
assert.ok(tennisGeometry.court.playerAX < tennisGeometry.court.netX, "the first player should be grounded on the left half of the court");
assert.ok(tennisGeometry.court.playerBX > tennisGeometry.court.netX, "the second player should be grounded on the right half of the court");
assert.equal(tennisGeometry.court.playerAY, tennisGeometry.court.playerBY, "both court players should share one coherent ground plane");
assert.equal(tennisGeometry.court.playerAHeight, tennisGeometry.court.playerBHeight, "both court players should use the same human scale");
assert.ok(tennisGeometry.court.netX - tennisGeometry.court.playerAX > tennisGeometry.court.playerAHeight * 2, "the left player should have a believable baseline-to-net separation");
assert.ok(tennisGeometry.court.playerBX - tennisGeometry.court.netX > tennisGeometry.court.playerBHeight * 2, "the right player should have a believable baseline-to-net separation");
assert.ok(tennisGeometry.ball.landingY < tennisGeometry.ball.looseY, "the ball should visibly travel from the foreground pavement over the low court edge");
assert.doesNotThrow(() => vm.runInContext(`
  assets.tennisCourt = { width: 1672, height: 941 };
  assets.tennisPlayers = { width: 2172, height: 724 };
  for (const stage of ["rally", "escaping", "loose", "returning", "celebrating", "complete"]) {
    tennisEncounter.stage = stage;
    tennisEncounter.startedAt = 0;
    tennisEncounter.speechUntil = 9999;
    drawTennisVignette(900);
  }
`, sandbox), "the court, rally, escaped ball, return and wave should render as one layered vignette");
vm.runInContext(`resetGame();`, sandbox);

assert.doesNotThrow(() => vm.runInContext(`
  assets.visitors = { width: 1536, height: 1024 };
  assets.supportingCast = { width: 1774, height: 887 };
  assets.rooftopJumps = { width: 1983, height: 793 };
  assets.rooftopCart = { width: 1536, height: 1024 };
  assets.bellJump = { width: 1983, height: 793 };
  currentScene = "rooftop";
  activeQuest = questDefinitions.find((quest) => quest.id === "leap");
  activeQuest.stage = "solve";
  drawNPCs(1200);
  for (const kind of ["marshall", "lily", "robin", "barney", "bell", "narrator"]) drawPortrait(kind);
`, sandbox), "the rooftop cast, Bell, and narrator portraits should render from the unified character system");
const leapPortraitFrames = JSON.parse(vm.runInContext(`JSON.stringify(
  ["ted", "marshall", "lily", "robin", "barney"].map((kind) => {
    const config = kind === "ted" ? visitorPortraitRects[kind] : supportingPortraitRects[kind];
    const source = portraitSourceRect(config);
    return { kind, config, source, eyeLine: (config.eyeY - source.y) / source.size };
  })
)`, sandbox));
for (const portrait of leapPortraitFrames) {
  assert.ok(Number.isFinite(portrait.config.centerX) && Number.isFinite(portrait.config.eyeY), `${portrait.kind} should use an authored face centre and eye anchor`);
  assert.ok(Math.abs(portrait.eyeLine - 0.46) < 0.006, `${portrait.kind}'s eyes should share the leap cast portrait eye-line`);
  assert.ok(Math.abs(portrait.source.x + portrait.source.size / 2 - portrait.config.centerX) <= 0.5, `${portrait.kind}'s face should remain horizontally centred`);
  const atlasWidth = portrait.kind === "ted" ? 1536 : 1774;
  const atlasHeight = portrait.kind === "ted" ? 1024 : 887;
  assert.ok(portrait.source.x >= 0 && portrait.source.y >= 0 && portrait.source.x + portrait.source.size <= atlasWidth && portrait.source.y + portrait.source.size <= atlasHeight, `${portrait.kind}'s portrait crop should remain inside its character atlas`);
}
const rooftopLayoutSummary = JSON.parse(vm.runInContext(`JSON.stringify({
  playerMaxX: ROOFTOP_LAYOUT.playerMaxX,
  castFootY: ROOFTOP_LAYOUT.castFootY,
  cartFootY: ROOFTOP_LAYOUT.runUpCart.footY,
  gap: ROOFTOP_LAYOUT.gap,
  jump: ROOFTOP_LAYOUT.jump,
  interactions: ROOFTOP_LAYOUT.interactions,
  cast: rooftopCastPlan,
  runFrames: rooftopRunFrameRects,
  runAsset: assetSources.rooftopRuns,
  leapTiming: ROOFTOP_LEAP_TIMING,
  actionDuration: questActionStyles.leap.durations[2]
})`, sandbox));
assert.equal(vm.runInContext("SCENES.rooftop.maxX", sandbox), rooftopLayoutSummary.playerMaxX, "rooftop collision should stop the dog on the near roof");
assert.equal(vm.runInContext("SCENES.rooftop.groundY", sandbox), rooftopLayoutSummary.castFootY, "the dog and rooftop cast should share one paving baseline");
assert.equal(rooftopLayoutSummary.cartFootY, rooftopLayoutSummary.castFootY, "the cart wheels and character feet should share one paving baseline");
assert.equal(vm.runInContext("SCENES.rooftop.backgroundMode", sandbox), "width", "the rooftop should preserve its authored horizontal ledge coordinates");
assert.equal(rooftopLayoutSummary.actionDuration, rooftopLayoutSummary.leapTiming.duration, "the final rooftop action should use the authored cast timing duration");
assert.ok(rooftopLayoutSummary.actionDuration >= 13000, "the five-person leap should leave enough time for visible run-ups and landings");
assert.ok(rooftopLayoutSummary.cast.every((actor) => actor.runDuration >= 800), "every rooftop character should receive a deliberately paced run-up");
assert.ok(rooftopLayoutSummary.cast.every((actor) => {
  const runSpeed = Math.abs(rooftopLayoutSummary.jump.takeoffX - actor.start) / actor.runDuration;
  return runSpeed >= 0.075 && runSpeed <= 0.17;
}), "the cast run-ups should stay within a restrained, readable speed range");
assert.ok(rooftopLayoutSummary.cast.slice(1).every((actor, index) => {
  const previous = rooftopLayoutSummary.cast[index];
  const scheduledStart = previous.startMs + previous.runDuration + rooftopLayoutSummary.leapTiming.jumpDuration + rooftopLayoutSummary.leapTiming.landingPause;
  return actor.startMs === scheduledStart;
}), "the next run-up should begin only after the previous landing pause");
assert.ok(rooftopLayoutSummary.leapTiming.landingPause >= 500, "each landing should receive a clearly visible pause before the next run-up");
assert.ok(rooftopLayoutSummary.cast.at(-1).startMs + rooftopLayoutSummary.cast.at(-1).runDuration + rooftopLayoutSummary.leapTiming.jumpDuration + rooftopLayoutSummary.cast.at(-1).exitDuration < rooftopLayoutSummary.actionDuration, "Ted's final landing walk should settle before the action closes");
assert.equal(rooftopLayoutSummary.runAsset, "assets/character-rooftop-runs-v1.png", "the rooftop sequence should load its authored run-cycle atlas");
assert.ok(Object.values(rooftopLayoutSummary.runFrames).every((frames) => frames.length === 4), "every rooftop character should have a four-frame run cycle");
const rooftopRunRowOrder = ["ted", "marshall", "robin", "lily", "barney"];
assert.ok(rooftopRunRowOrder.slice(0, -1).every((kind, index) => {
  const rowBottom = Math.max(...rooftopLayoutSummary.runFrames[kind].map((frame) => frame.y + frame.height));
  const nextRowTop = Math.min(...rooftopLayoutSummary.runFrames[rooftopRunRowOrder[index + 1]].map((frame) => frame.y));
  return rowBottom < nextRowTop;
}), "run-cycle crop rows should never borrow heads or feet from an adjacent character");
assert.ok(rooftopLayoutSummary.runFrames.barney.every((frame) => frame.y < 1000 && frame.height >= 190), "Barney's run frames should retain his full head and body");
assert.match(gameSource, /drawRooftopRunSprite\(actor\.kind, x, y, runTime\)/, "the run-up should render animated frames instead of sliding the jump pose");
assert.match(gameSource, /questAction\.progress\s*\n\s*: questVisualProgress\(2\)/, "active rooftop leaps should use a linear clock rather than globally eased timing");
assert.equal(vm.runInContext("SCENES.rooftop.backgroundY", sandbox), 40, "the rooftop background should align its paving surface to the gameplay baseline");
assert.ok(rooftopLayoutSummary.gap.rightEdge - rooftopLayoutSummary.gap.leftEdge >= 140, "the two rooftops should have a substantial visible gap");
assert.ok(
  rooftopLayoutSummary.playerMaxX + widestPoolRunHalfWidth < rooftopLayoutSummary.gap.leftEdge,
  "the dog's widest sprint silhouette should remain completely clear of the rooftop edge"
);
assert.ok(
  Object.values(rooftopLayoutSummary.interactions).every((x) => x <= rooftopLayoutSummary.playerMaxX),
  "every dog interaction should remain safely reachable on the near rooftop"
);
assert.ok(
  rooftopLayoutSummary.jump.takeoffX <= rooftopLayoutSummary.gap.leftEdge &&
    rooftopLayoutSummary.jump.landingX >= rooftopLayoutSummary.gap.rightEdge,
  "the authored jump arc should begin and end on opposite sides of the real gap"
);
assert.ok(
  rooftopLayoutSummary.cast.every((actor) => actor.start < rooftopLayoutSummary.gap.leftEdge && actor.end > rooftopLayoutSummary.gap.rightEdge),
  "every rooftop character should move from the left building to the right building"
);
const rooftopJumpFrames = vm.runInContext(`Object.values(rooftopJumpFrameRects).map((rect) => ({ ...rect }))`, sandbox);
assert.equal(rooftopJumpFrames.length, 5, "Ted, Marshall, Lily, Robin and Barney should each have an airborne rooftop pose");
for (let index = 1; index < rooftopJumpFrames.length; index += 1) {
  assert.ok(
    rooftopJumpFrames[index - 1].x + rooftopJumpFrames[index - 1].width < rooftopJumpFrames[index].x,
    `rooftop jump frame ${index - 1} must not capture pixels from frame ${index}`
  );
}
assert.doesNotThrow(() => vm.runInContext(`
  currentScene = "rooftop";
  activeQuest = questDefinitions.find((quest) => quest.id === "leap");
  activeQuest.stage = "solve";
  activeQuest.visualStep = 2;
  assets.rooftopJumps = { width: 1983, height: 793 };
  assets.rooftopCart = { width: 1536, height: 1024 };
  for (const progress of [0, 0.2, 0.45, 0.7, 1]) {
    questAction = { questId: "leap", stepIndex: 2, progress };
    drawRooftopQuestVisuals(1200);
    drawRooftopCast(1200);
  }
`, sandbox), "the market cart, patio lights and one-by-one rooftop leap should render through the full sequence");
assert.doesNotThrow(() => vm.runInContext(`
  currentScene = "cinemaInside";
  activeQuest = questDefinitions.find((quest) => quest.id === "cinema");
  activeQuest.stage = "solve";
  activeQuest.visualStep = 2;
  assets.cinemaProjection = { width: 1456, height: 1086 };
  for (const progress of [0, 0.5, 1]) {
    questAction = { questId: "cinema", stepIndex: 2, progress };
    drawCinemaQuestVisuals(1500);
  }
`, sandbox), "the authored cinema projection should focus and illuminate without UI-like screen primitives");
const bellJumpFrames = vm.runInContext(`bellJumpFrameRects.map((rect) => ({ ...rect }))`, sandbox);
assert.equal(bellJumpFrames.length, 4, "Bell's jump should have gather, launch, flight and landing poses");
for (let index = 1; index < bellJumpFrames.length; index += 1) {
  assert.ok(
    bellJumpFrames[index - 1].x + bellJumpFrames[index - 1].width < bellJumpFrames[index].x,
    `Bell jump frame ${index - 1} must not capture pixels from frame ${index}`
  );
}
assert.doesNotThrow(() => vm.runInContext(`
  currentScene = "bellHome";
  activeQuest = questDefinitions.find((quest) => quest.id === "bell");
  activeQuest.stage = "solve";
  activeQuest.visualStep = 2;
  assets.bellJump = { width: 1983, height: 793 };
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    questAction = { questId: "bell", stepIndex: 2, progress };
    drawBellQuestSprite(1200);
  }
  questAction = null;
  activeQuest.visualStep = 3;
  drawBellQuestSprite(1600);
`, sandbox), "Bell's complete four-pose jump and settled landing should render without errors");
const rooftopCastLayout = vm.runInContext(`Object.fromEntries(Object.entries(supportingCastLayout).map(([kind, layout]) => [kind, ({ ...layout })]))`, sandbox);
const rooftopPlayerScale = vm.runInContext("SCENES.rooftop.playerScale", sandbox);
const dogArtScale = vm.runInContext("DOG_ART_SCALE", sandbox);
assert.equal(dogArtScale, 0.92, "all dog renderings should use the slightly reduced authored scale");
assert.equal(rooftopPlayerScale, 0.83, "the rooftop should use its wider environmental character scale");
assert.ok(
  Object.values(rooftopCastLayout).every(({ height, footOffset }) => height >= 126 && height <= 131 && footOffset >= 1),
  "every rooftop guest should fit beneath the service-door lintel and remain anchored at the paving line"
);
assert.ok(
  Object.values(rooftopCastLayout).every(({ height }) => height > 93 * rooftopPlayerScale * dogArtScale * 1.7),
  "the reduced rooftop guests should remain clearly taller than the proportionally reduced dog"
);

vm.runInContext(`state = "playing"; currentScene = "market"; journey.market = true;`, sandbox);
for (let questIndex = 0; questIndex < 6; questIndex += 1) {
  vm.runInContext(`
    currentScene = "market";
    state = "playing";
    var questFlowerId = flowers.find((flower) => flower.active).id;
    startObstacle(flowers.find((flower) => flower.id === questFlowerId));
    assets.visitors = { width: 1536, height: 1024 };
    assets.visitorWalk = { width: 1254, height: 1254 };
    assets.projectionist = { width: 1536, height: 1024 };
    assets.cafeCats = { width: 1536, height: 1024 };
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
assert.equal(vm.runInContext("flowers.filter((flower) => flower.sale).length", sandbox), 6, "six flowers should be visibly marked as sold");
console.log("Quest flow smoke test passed: six locations resolved, one final flower remains.");
