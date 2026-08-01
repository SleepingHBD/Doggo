"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const portraitCanvas = document.querySelector("#portrait-canvas");
const portraitCtx = portraitCanvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
portraitCtx.imageSmoothingEnabled = false;

const ui = {
  frame: document.querySelector("#game-frame"), loading: document.querySelector("#loading-screen"),
  title: document.querySelector("#title-screen"), select: document.querySelector("#select-screen"),
  ending: document.querySelector("#ending-screen"), hud: document.querySelector("#hud"),
  location: document.querySelector("#location-card"), tutorial: document.querySelector("#tutorial"),
  dialogue: document.querySelector("#dialogue"), speaker: document.querySelector("#speaker"),
  text: document.querySelector("#dialogue-text"), choices: document.querySelector("#dialogue-choices"),
  continueButton: document.querySelector("#continue-button"), portraitMark: document.querySelector("#portrait-mark"),
  prompt: document.querySelector("#interact-prompt"), promptKey: document.querySelector("#interact-key"),
  promptLabel: document.querySelector("#interact-label"), promptKicker: document.querySelector("#interact-kicker"),
  count: document.querySelector("#flower-count"), pips: document.querySelector("#bloom-pips"),
  quest: document.querySelector("#quest-text"), touch: document.querySelector("#touch-controls"),
  fade: document.querySelector("#fade"), chapter: document.querySelector("#chapter-label"),
  status: document.querySelector("#status-text"), endingTitle: document.querySelector("#ending-title"),
  endingCopy: document.querySelector("#ending-copy"), endingMemory: document.querySelector("#ending-memory"),
  endingFlower: document.querySelector("#ending-flower-symbol"), soundButton: document.querySelector("#sound-button")
};

const VIEW_WIDTH = 960;
const SCENES = {
  bench: { asset: "bench", width: 1100, minX: 105, maxX: 995, groundY: 430,
    doors: [{ x: 210, radius: 68, target: "bellHome", spawnX: 155, label: "Enter Bell's home", quest: "bell" }] },
  aquarium: { asset: "aquarium", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 425, radius: 76, target: "aquariumInside", spawnX: 155, label: "Enter the aquarium", quest: "aquarium" }] },
  dateNight: { asset: "dateNight", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 300, radius: 78, target: "poolInside", spawnX: 155, label: "Enter the pool hall", quest: "pool" }] },
  catStories: { asset: "catStories", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 185, radius: 76, target: "catInside", spawnX: 155, label: "Enter the cat cafe", quest: "cats" }] },
  entrance: {
    asset: "entrance", width: 960, minX: 120, maxX: 850, groundY: 464,
    doors: [
      { x: 620, radius: 110, target: "market", spawnX: 220, label: "Enter the flower market", kind: "marketEnter" },
      { x: 825, radius: 62, target: "rooftop", spawnX: 155, label: "Take the service stairs", quest: "leap" }
    ]
  },
  market: {
    asset: "market", width: 1100, minX: 65, maxX: 1035, groundY: 466,
    doors: [{ x: 98, radius: 92, target: "entrance", spawnX: 735, label: "Leave the flower market", kind: "marketExit" }]
  },
  aquariumInside: { asset: "aquariumInside", width: 1100, minX: 70, maxX: 1030, groundY: 458,
    doors: [{ x: 88, radius: 72, target: "aquarium", spawnX: 425, label: "Leave the aquarium" }] },
  poolInside: { asset: "poolInside", width: 1100, minX: 70, maxX: 1030, groundY: 458,
    doors: [{ x: 92, radius: 72, target: "dateNight", spawnX: 300, label: "Leave the pool hall" }] },
  catInside: { asset: "catInside", width: 1100, minX: 70, maxX: 1030, groundY: 458,
    doors: [{ x: 90, radius: 72, target: "catStories", spawnX: 185, label: "Leave the cat cafe" }] },
  bellHome: { asset: "bellHome", width: 1100, minX: 70, maxX: 1030, groundY: 456,
    doors: [{ x: 92, radius: 72, target: "bench", spawnX: 210, label: "Step back outside" }] },
  rooftop: { asset: "rooftop", width: 1100, minX: 70, maxX: 1030, groundY: 430,
    doors: [{ x: 92, radius: 72, target: "entrance", spawnX: 825, label: "Return downstairs" }] }
};

const assetSources = {
  bench: "assets/bench-blue-hour.png",
  benchEnding: "assets/bench-ending.png",
  aquarium: "assets/memory-aquarium-school.png",
  dateNight: "assets/memory-pool-gaming.png",
  catStories: "assets/memory-cat-stories.png",
  entrance: "assets/market-entrance.png",
  market: "assets/market-sideview.png",
  aquariumInside: "assets/aquarium-interior-v2.png",
  poolInside: "assets/pool-interior.png",
  catInside: "assets/cat-cafe-interior.png",
  bellHome: "assets/bell-home.png",
  rooftop: "assets/market-rooftop.png",
  dogs: "assets/dog-sprites-normalized.png",
  locomotion: "assets/dog-locomotion-v3.png",
  portraits: "assets/portrait-atlas-v2.png"
};
const assets = {};

const player = {
  x: 145, y: SCENES.bench.groundY, direction: "right", moving: false,
  walkFrame: 0, speed: 176, sprintSpeed: 350, sprinting: false,
  type: "maltipoo", name: "Momo", pose: "idle"
};
const camera = { x: 0, target: 0 };
const keys = { left: false, right: false, sprint: false };
const choiceMemories = [];
const particles = [];
const scene = {
  resolved: 0, darkness: 0,
  aquarium: false, pool: false, cats: false, bell: false, leap: false
};
const journey = {
  leftBench: false, routeBeat: false, entrance: false, market: false,
  returning: false, reunion: false
};

let state = "loading";
let currentScene = "bench";
let nearbyFlower = null;
let nearbyMemory = null;
let nearbyQuestStep = null;
let nearbyReunion = false;
let currentFlower = null;
let endingFlower = null;
let activeQuest = null;
let dialogue = null;
let lastTime = 0;
let audioMuted = false;
let audioContext = null;

const flowerData = {
  peony: { name: "Coral Peony", short: "Peony", color: "#ef8c83", symbol: "✿", anchor: [230, 340], stand: 230 },
  tulip: { name: "Apricot Tulip", short: "Tulip", color: "#f1a062", symbol: "♦", anchor: [385, 318], stand: 385 },
  anemone: { name: "Blue Anemone", short: "Anemone", color: "#8492cc", symbol: "✤", anchor: [535, 308], stand: 535 },
  ranunculus: { name: "Rose Ranunculus", short: "Ranunculus", color: "#d982a4", symbol: "❀", anchor: [685, 325], stand: 685 },
  sunflower: { name: "Little Sunflower", short: "Sunflower", color: "#f2c24e", symbol: "☀", anchor: [835, 314], stand: 835 },
  daisy: { name: "Moon Daisy", short: "Daisy", color: "#fff1db", symbol: "✽", anchor: [990, 334], stand: 990 }
};
const flowers = Object.entries(flowerData).map(([id, data]) => ({ id, ...data, active: true }));

const memorySpots = [
  {
    id: "bench", scene: "bench", x: 744, kind: "bench", label: "Pause by the familiar bench", seen: false,
    lines: () => [
      line("Narrator", "A familiar bench waits beneath the streetlamp.", "narrator"),
      line("Narrator", "Some evenings ended here slowly: one more story, then another, until an hour became two.", "narrator"),
      line(player.name, "This bench feels important.", "player")
    ]
  },
  {
    id: "aquarium", scene: "aquarium", x: 275, kind: "aquarium", label: "Look for the shark", seen: false,
    lines: () => [
      line("Narrator", "The aquarium glass turns the whole pavement blue. Colourful fish flicker between the coral.", "narrator"),
      line(player.name, "There you are.", "player"),
      line("Narrator", "Finding it still feels like winning something.", "narrator")
    ]
  },
  {
    id: "football", scene: "aquarium", x: 840, kind: "football", label: "Pause by the school pitch", seen: false,
    lines: () => [
      line("Narrator", "A scuffed football rests beside a school fence.", "narrator"),
      line("Narrator", "The worn grass remembers someone who once ran this field often.", "narrator"),
      line(player.name, "The ball has been waiting.", "player")
    ]
  },
  {
    id: "pool", scene: "dateNight", x: 285, kind: "pool", label: "Look into the pool hall", seen: false,
    lines: () => [
      line("Narrator", "A pool cue leans in a cafe window. Tiny scuffs mark the ceiling above it.", "narrator"),
      line("Narrator", "Some memories leave very small marks in very high places.", "narrator"),
      line(player.name, "That is a high place for a cue.", "player")
    ]
  },
  {
    id: "gaming", scene: "dateNight", x: 755, kind: "gaming", label: "Look into the gaming cafe", seen: false,
    lines: () => [
      line("Narrator", "Two screens glow behind the glass, each showing half of the same impossible world.", "narrator"),
      line(player.name, "They fit.", "player")
    ]
  },
  {
    id: "catcafe", scene: "catStories", x: 175, kind: "catcafe", label: "Watch the cafe cats", seen: false,
    lines: () => [
      line("Narrator", "Every cat in the cafe is still completely occupied with dinner.", "narrator"),
      line(player.name, "No one looks ready to play.", "player")
    ]
  },
  {
    id: "chess", scene: "catStories", x: 345, kind: "chess", label: "Look over the chessboard", seen: false,
    lines: () => [
      line("Narrator", "An untouched chessboard waits on a cafe table.", "narrator"),
      line("Narrator", "A passing comment has somehow left a whole board behind.", "narrator"),
      line(player.name, "The next move can wait.", "player")
    ]
  },
  {
    id: "stories", scene: "catStories", x: 570, kind: "stories", label: "Inspect the story window", seen: false,
    lines: () => [
      line("Narrator", "A wrapped copy of The Hunger Games sits beside a sun-faded straw-hat adventure poster.", "narrator"),
      line("Narrator", "One story was wrapped for a birthday. The other has clearly travelled here many times.", "narrator"),
      line(player.name, "Both look carefully chosen.", "player")
    ]
  },
  {
    id: "agency", scene: "catStories", x: 860, kind: "agency", label: "Look into the creative studio", seen: false,
    lines: () => [
      line("Narrator", "Layered campaign posters cover the wall: sharp headlines, careful colours, three rounds of revisions.", "narrator"),
      line(player.name, "A lot of thinking lives on that wall.", "player")
    ]
  }
];

const questDefinitions = [
  {
    id: "aquarium", exterior: "aquarium", interior: "aquariumInside", place: "aquarium", title: "THE MISSING SHARK",
    trigger: (flower) => [
      line("Narrator", `A delivery tag is tucked beneath the ${flower.name}. Its little blue aquarium stamp is still wet.`, "narrator"),
      line("The Florist", "The evening headcount is missing one shark. They cannot close the reef display until it is found.", "florist"),
      line(player.name, "The blue windows.", "player")
    ],
    arrival: () => [
      line("Tank Keeper", "Start with the colourful fish. They noticed something before I did.", "tankkeeper"),
      line("Narrator", "Beyond the glass, every small fish turns at once.", "narrator")
    ],
    steps: [
      { x: 260, kicker: "The small reef tank", label: "Watch the colourful fish", objective: "Follow the colourful fish", lines: () => [
        line("Narrator", "The school of colour circles once, then points itself toward the tunnel.", "narrator"),
        line(player.name, "They keep looking right.", "player")
      ] },
      { x: 555, kicker: "A trail of bubbles", label: "Inspect the coral tunnel", objective: "Trace the bubbles through the coral", lines: () => [
        line("Narrator", "A patient line of bubbles slips behind the coral and continues toward the largest tank.", "narrator")
      ] },
      { x: 860, kicker: "The deep blue tank", label: "Find the hidden shark", objective: "Check the shadow in the deep tank", lines: () => [
        line("Narrator", "A fin separates itself from the blue. The missing shark was cruising along the darkest pane.", "narrator"),
        line("Tank Keeper", "There you are. The reef can open after all.", "tankkeeper")
      ] }
    ],
    solved: () => [line("Tank Keeper", "Please tell the florist the display is ready. I should collect its flowers before closing.", "tankkeeper")],
    returned: (flower) => [
      line("The Florist", "The keeper came by just ahead of you.", "florist"),
      line("Narrator", `The ${flower.short} now sits at the centre of the reopened reef display.`, "narrator")
    ]
  },
  {
    id: "pool", exterior: "dateNight", interior: "poolInside", place: "pool hall", title: "ONE CLEAN SHOT",
    trigger: (flower) => [
      line("Narrator", `A chalk-blue note is pinned to the ${flower.name}: final frame delayed.`, "narrator"),
      line("The Florist", "The pool hall promised a closing-night winner. Something about the ceiling has made everyone cautious.", "florist"),
      line(player.name, "The lamp hangs low.", "player")
    ],
    arrival: () => [
      line("Pool Player", "One shot left. First, I would like the room to survive it.", "poolplayer"),
      line("Narrator", "A cue waits beneath a constellation of tiny ceiling scuffs.", "narrator")
    ],
    steps: [
      { x: 440, kicker: "Marks above the cue rack", label: "Inspect the longest cue", objective: "Check the longest cue beneath the ceiling marks", lines: () => [
        line("Narrator", "The highest marks begin exactly where the longest cue is stored.", "narrator"),
        line(player.name, "Too tall.", "player")
      ] },
      { x: 555, kicker: "The hanging table lamp", label: "Lower the lamp guard", objective: "Secure the hanging lamp", lines: () => [
        line("Narrator", "The brass guard clicks into place. The light stops trembling.", "narrator")
      ] },
      { x: 855, kicker: "The final frame", label: "Set up the last shot", objective: "Line up the final shot", lines: () => [
        line("Narrator", "Four paws make a steady bridge. The cue stays low; the ball rolls cleanly into the corner.", "narrator"),
        line("Pool Player", "Table safe. Ceiling safe. We have a winner.", "poolplayer")
      ] }
    ],
    solved: () => [line("Pool Player", "I promised the market a small winner's bouquet. Tell them the frame is finished.", "poolplayer")],
    returned: (flower) => [
      line("Narrator", `A departing player carries the ${flower.short} like a very small trophy.`, "narrator"),
      line("The Florist", "A clean ending deserves something bright.", "florist")
    ]
  },
  {
    id: "cats", exterior: "catStories", interior: "catInside", place: "cat cafe", title: "DINNER FIRST",
    trigger: (flower) => [
      line("Narrator", `A cafe delivery card has caught in the paper sleeve of the ${flower.name}.`, "narrator"),
      line("The Florist", "The cafe keeper cannot reach the counter. Dinner has become an occupation.", "florist"),
      line(player.name, "Dinner first.", "player")
    ],
    arrival: () => [
      line("Cafe Keeper", "They were meant to greet the guests. They have unionised around the food bowls.", "catkeeper"),
      line("Narrator", "Several tails block the narrow path to the delivery bell.", "narrator")
    ],
    steps: [
      { x: 245, kicker: "A crowded feeding corner", label: "Count the dinner bowls", objective: "Count the bowls at the feeding corner", lines: () => [
        line("Narrator", "Three cats. Three bowls. One bowl is simply facing the wrong way.", "narrator"),
        line(player.name, "Three and three.", "player")
      ] },
      { x: 555, kicker: "The cafe counter", label: "Arrange the bowls in a row", objective: "Make a clear dinner row", lines: () => [
        line("Narrator", "The bowls slide into a neat row. The cats follow with absolute seriousness.", "narrator")
      ] },
      { x: 850, kicker: "A little brass bell", label: "Ring the delivery bell", objective: "Ring the bell by the cat tree", lines: () => [
        line("Narrator", "The bell rings once. The counter is clear for almost three whole seconds.", "narrator"),
        line("Cafe Keeper", "That is more than enough. Delivery rescued.", "catkeeper")
      ] }
    ],
    solved: () => [line("Cafe Keeper", "I will run to the market while they are still chewing.", "catkeeper")],
    returned: (flower) => [
      line("The Florist", "The cafe delivery made it back. Mostly.", "florist"),
      line("Narrator", `One satisfied cat is asleep on the ${flower.short}'s paper sleeve. The reservation appears final.`, "narrator")
    ]
  },
  {
    id: "bell", exterior: "bench", interior: "bellHome", place: "Bell's home", title: "A QUIET INTRODUCTION",
    trigger: (flower) => [
      line("Narrator", `A silver ribbon loops around the ${flower.name}. One handwritten name appears on the tag: Bell.`, "narrator"),
      line("The Florist", "The delivery cannot be left until Bell decides the visitor is acceptable.", "florist"),
      line(player.name, "Bell.", "player")
    ],
    arrival: () => [
      line("Narrator", "A cloud-soft Siberian watches from the chair, close enough to see and far enough to choose.", "narrator"),
      line("Bell", "Mrrp.", "bell")
    ],
    steps: [
      { x: 210, kicker: "The entry mat", label: "Wait on the mat", objective: "Give Bell some space", lines: () => [
        line("Narrator", "Nothing is rushed. Bell's tail makes one thoughtful sweep.", "narrator"),
        line(player.name, "Mm.", "player")
      ] },
      { x: 555, kicker: "A basket of cat toys", label: "Bring the cloth mouse closer", objective: "Find Bell's cloth mouse", lines: () => [
        line("Narrator", "A well-loved cloth mouse is placed halfway between visitor and chair.", "narrator")
      ] },
      { x: 845, kicker: "Bell's armchair", label: "Sit quietly with Bell", objective: "Let Bell choose the distance", lines: () => [
        line("Narrator", "Bell steps down, inspects one unfamiliar nose, then settles beside it.", "narrator"),
        line("Bell", "Prrrp.", "bell")
      ] }
    ],
    solved: () => [line("Narrator", "The silver delivery ribbon is accepted without further objection.", "narrator")],
    returned: (flower) => [
      line("The Florist", "Bell's delivery has gone home.", "florist"),
      line("Narrator", `The ${flower.short} went with the silver ribbon. A careful introduction has claimed another bloom.`, "narrator")
    ]
  },
  {
    id: "leap", exterior: "entrance", interior: "rooftop", place: "market rooftop", title: "THE ROOFTOP GAP",
    trigger: (flower) => [
      line("Narrator", `Five tiny name cards tumble from beneath the ${flower.name}: Ted, Marshall, Lily, Robin and Barney.`, "narrator"),
      line("The Florist", "The rooftop cast will not cross until the landing is ready. The service stairs are outside.", "florist"),
      line(player.name, "Upstairs.", "player")
    ],
    arrival: () => [
      line("Ted", "The gap is small enough to regret and large enough to discuss for too long.", "ted"),
      line("Marshall", "I measured it with my shoe. Emotionally, the result was excellent.", "marshall"),
      line("Lily", "We are going to need a better unit of measurement.", "lily")
    ],
    steps: [
      { x: 250, kicker: "A pile of market cushions", label: "Gather the soft cushions", objective: "Collect cushions for the landing", lines: () => [
        line("Narrator", "Cushions, flower sacks and one folded awning make a surprisingly respectable pile.", "narrator"),
        line("Robin", "That already looks less terrible.", "robin")
      ] },
      { x: 555, kicker: "The little rooftop gap", label: "Build the landing", objective: "Place the soft landing", lines: () => [
        line("Narrator", "The gap stays exactly as wide, but the landing becomes considerably kinder.", "narrator"),
        line("Barney", "Safety, but with presentation. Acceptable.", "barney")
      ] },
      { x: 725, kicker: "The market signal lamp", label: "Switch on the landing light", objective: "Light the far side", lines: () => [
        line("Narrator", "A warm signal appears on the far side. Ted, Marshall, Lily, Robin and Barney cross one after another.", "narrator"),
        line("Ted", "Sometimes the way across only needs someone to prepare the other side.", "ted")
      ] }
    ],
    solved: () => [line("Lily", "The landing needs a few flowers. Then it will look intentional.", "lily")],
    returned: (flower) => [
      line("Narrator", `The ${flower.short} has become the centre of a very soft rooftop landing.`, "narrator"),
      line("The Florist", "Five safe arrivals. One fewer bloom.", "florist")
    ]
  }
];

Promise.all(Object.entries(assetSources).map(([key, source]) => loadImage(source).then((image) => { assets[key] = image; })))
  .then(() => {
    drawSelectionPreviews();
    ui.frame.classList.remove("is-loading");
    ui.loading.style.opacity = "0";
    setTimeout(() => { ui.loading.hidden = true; ui.title.hidden = false; state = "title"; }, 550);
  })
  .catch(() => { ui.loading.innerHTML = "<p>The evening could not be opened. Please refresh the page.</p>"; });

document.querySelector("#start-button").addEventListener("click", () => {
  initAudio(); tone(523, 0.08, 0.035);
  transition(() => { ui.title.hidden = true; ui.select.hidden = false; state = "select"; drawSelectionPreviews(); });
});
document.querySelectorAll("[data-dog]").forEach((button) => button.addEventListener("click", () => chooseDog(button.dataset.dog)));
document.querySelector("#restart-button").addEventListener("click", resetGame);
ui.continueButton.addEventListener("click", advanceDialogue);
ui.prompt.addEventListener("click", () => { if (getActiveDoor()) handleUp(); else interact(); });
ui.soundButton.addEventListener("click", toggleSound);

window.addEventListener("keydown", (event) => {
  const map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  if (map[event.key]) { keys[map[event.key]] = true; event.preventDefault(); }
  if (event.key === "Shift") { keys.sprint = true; event.preventDefault(); }
  if (["ArrowUp", "w", "W"].includes(event.key) && !event.repeat) { event.preventDefault(); handleUp(); }
  if (["e", "E", " "].includes(event.key) && !event.repeat) {
    event.preventDefault();
    if (state === "dialogue") advanceDialogue();
    else if (state === "playing") interact();
  }
});
window.addEventListener("keyup", (event) => {
  const map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  if (map[event.key]) keys[map[event.key]] = false;
  if (event.key === "Shift") keys.sprint = false;
});
document.querySelectorAll("[data-key]").forEach((button) => {
  const key = button.dataset.key;
  const press = (event) => {
    event.preventDefault();
    if (key === "action") state === "dialogue" ? advanceDialogue() : interact();
    else if (key === "up") handleUp();
    else keys[key] = true;
  };
    const release = (event) => { event.preventDefault(); if (["left", "right", "sprint"].includes(key)) keys[key] = false; };
  button.addEventListener("pointerdown", press); button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release); button.addEventListener("pointerleave", release);
});

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = source;
  });
}

function chooseDog(type) {
  player.type = type;
  player.name = type === "maltipoo" ? "Momo" : "Mallow";
  currentScene = "bench";
  Object.assign(player, { x: 145, y: SCENES.bench.groundY, direction: "right", moving: false, sprinting: false, pose: "idle" });
  Object.assign(keys, { left: false, right: false, sprint: false });
  Object.assign(camera, { x: 0, target: 0 });
  tone(659, 0.12, 0.045);
  transition(() => {
    ui.select.hidden = true; ui.hud.hidden = false; ui.tutorial.hidden = false;
    ui.touch.hidden = false; ui.touch.classList.add("is-active");
    ui.chapter.textContent = "CHAPTER 1 · ON THE WAY";
    ui.status.textContent = `${player.name} set out for the flower market`;
    updateHUD();
    showDialogue([
      line("Narrator", "Blue hour settles over the road. The flower market will close with the last light.", "narrator"),
      line(player.name, "One flower. I can choose one flower.", "player"),
      line("Narrator", "The familiar bench stays behind as the market lights glow ahead.", "narrator")
    ], resumePlay);
  });
}

function resetGame() {
  flowers.forEach((flower) => { flower.active = true; });
  memorySpots.forEach((spot) => { spot.seen = false; });
  choiceMemories.length = 0; particles.length = 0;
  Object.assign(scene, { resolved: 0, darkness: 0, aquarium: false, pool: false, cats: false, bell: false, leap: false });
  Object.assign(journey, { leftBench: false, routeBeat: false, entrance: false, market: false, returning: false, reunion: false });
  currentScene = "bench";
  Object.assign(player, { x: 145, y: SCENES.bench.groundY, direction: "right", moving: false, sprinting: false, walkFrame: 0, pose: "idle" });
  Object.assign(keys, { left: false, right: false, sprint: false });
  Object.assign(camera, { x: 0, target: 0 });
  currentFlower = null; endingFlower = null; activeQuest = null;
  nearbyFlower = null; nearbyMemory = null; nearbyQuestStep = null; nearbyReunion = false; dialogue = null;
  ui.ending.hidden = true; ui.hud.hidden = true; ui.location.hidden = true;
  ui.touch.hidden = true; ui.touch.classList.remove("is-active");
  ui.frame.classList.remove("is-cinematic");
  updateHUD();
  transition(() => { ui.select.hidden = false; state = "select"; ui.chapter.textContent = "PROLOGUE · 6:42 PM"; drawSelectionPreviews(); });
}

function resumePlay() {
  state = "playing"; player.pose = "idle";
  ui.frame.classList.remove("is-cinematic");
  ui.touch.hidden = false; ui.touch.classList.add("is-active");
}

function checkJourneyTransitions() {
  if (currentScene === "bench" && !journey.returning && player.x >= SCENES.bench.maxX - 2 && keys.right) {
    switchScene("aquarium", 125, () => {
      journey.leftBench = true;
      ui.status.textContent = "The aquarium lights colour the road";
      showLocation("THE EVENING ROUTE", "Aquarium & School", "The shark is easier to find from the pavement");
      updateHUD(); resumePlay();
    }, "right");
    return;
  }
  if (currentScene === "aquarium" && player.x <= SCENES.aquarium.minX + 2 && keys.left) {
    switchScene("bench", SCENES.bench.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
    return;
  }
  if (currentScene === "aquarium" && player.x >= SCENES.aquarium.maxX - 2 && keys.right) {
    switchScene("dateNight", 125, () => {
      ui.status.textContent = "Warm windows hold two familiar games";
      showLocation("THE EVENING ROUTE", "Pool Hall & Gaming Cafe", "A first date on one side; a split world on the other");
      updateHUD(); resumePlay();
    }, "right");
    return;
  }
  if (currentScene === "dateNight" && player.x <= SCENES.dateNight.minX + 2 && keys.left) {
    switchScene("aquarium", SCENES.aquarium.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
    return;
  }
  if (currentScene === "dateNight" && !journey.routeBeat && player.x > 540) {
    journey.routeBeat = true;
    showDialogue([
      line("Narrator", "The rain has stopped, but every window still holds a piece of sunset.", "narrator"),
      line(player.name, "Plenty of road left.", "player")
    ], resumePlay);
    return;
  }
  if (currentScene === "dateNight" && player.x >= SCENES.dateNight.maxX - 2 && keys.right) {
    switchScene("catStories", 125, () => {
      ui.status.textContent = "The covered arcade is still awake";
      showLocation("THE EVENING ROUTE", "Cafe, Stories & Studio", "Small things wait behind warm glass");
      updateHUD(); resumePlay();
    }, "right");
    return;
  }
  if (currentScene === "catStories" && player.x <= SCENES.catStories.minX + 2 && keys.left) {
    switchScene("dateNight", SCENES.dateNight.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
    return;
  }
  if (currentScene === "catStories" && player.x >= SCENES.catStories.maxX - 2 && keys.right) {
    switchScene("entrance", 130, () => {
      journey.entrance = true;
      ui.chapter.textContent = "CHAPTER 1 · THE THRESHOLD";
      ui.status.textContent = "The flower market is just ahead";
      showLocation("THE OLD ARCADE", "The Flower Market", "Stand in the doorway and press Up");
      updateHUD(); resumePlay();
    }, "right");
    return;
  }
  if (currentScene === "entrance" && player.x <= SCENES.entrance.minX + 2 && keys.left) {
    switchScene("catStories", SCENES.catStories.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
  }
}

function getActiveDoor() {
  return getAvailableDoors().find((door) => Math.abs(player.x - door.x) <= door.radius) || null;
}

function getAvailableDoors() {
  return (SCENES[currentScene].doors || []).filter((door) => !door.quest || (activeQuest && activeQuest.id === door.quest));
}

function handleUp() {
  if (state !== "playing") return;
  const door = getActiveDoor();
  if (!door) return;
  tone(659, 0.12, 0.035);
  if (door.kind === "marketEnter") {
    const firstEntry = !journey.market;
    switchScene("market", 220, () => {
      journey.market = true;
      ui.chapter.textContent = "CHAPTER 2 · SIX BLOOMS";
      ui.status.textContent = `${player.name} entered the market`;
      showLocation("INSIDE THE OLD ARCADE", "The Flower Market", "Six blooms wait beneath the lights");
      updateHUD();
      if (activeQuest && activeQuest.stage === "return") {
        completeQuestAtMarket();
      } else if (firstEntry) {
        showDialogue([
          line("The Florist", `Good evening, ${player.name}. Six blooms are still looking for a home.`, "florist"),
          line("The Florist", "Choose whichever feels right. The market has a habit of complicating simple errands.", "florist")
        ], resumePlay);
      } else resumePlay();
    }, "right");
  } else if (!door.kind) {
    switchScene(door.target, door.spawnX, () => {
      if (activeQuest && door.target === activeQuest.interior && activeQuest.stage === "travel") {
        activeQuest.stage = "solve";
        ui.chapter.textContent = `SIDE QUEST - ${activeQuest.title}`;
        ui.status.textContent = `${player.name} reached the ${activeQuest.place}`;
        showLocation("A MEMORY MADE SOLID", activeQuest.place.toUpperCase(), "Follow the small clues from left to right");
        updateHUD();
        showDialogue(activeQuest.arrival(), resumePlay);
      } else {
        updateHUD(); resumePlay();
      }
    }, door.target === activeQuest?.interior ? "right" : "left");
  } else {
    switchScene("entrance", 735, () => {
      ui.chapter.textContent = "CHAPTER 1 · THE THRESHOLD";
      ui.status.textContent = `${player.name} stepped outside`;
      updateHUD(); resumePlay();
    }, "right");
  }
}

function switchScene(target, spawnX, onArrive, direction = "right") {
  if (state === "transitioning") return;
  state = "transitioning"; player.moving = false; player.pose = "idle";
  ui.prompt.hidden = true; ui.touch.classList.remove("is-active");
  transition(() => {
    currentScene = target; player.x = spawnX; player.y = SCENES[target].groundY; player.direction = direction;
    camera.x = clamp(player.x - 380, 0, Math.max(0, SCENES[target].width - VIEW_WIDTH));
    camera.target = camera.x;
    onArrive();
  });
}

function showLocation(kicker, title, copy) {
  ui.location.querySelector("span").textContent = kicker;
  ui.location.querySelector("strong").textContent = title;
  ui.location.querySelector("small").textContent = copy;
  ui.location.hidden = false;
  ui.location.style.animation = "none"; void ui.location.offsetWidth; ui.location.style.animation = "";
}

function interact() {
  if (state !== "playing") return;
  if (nearbyQuestStep) { interactQuestStep(); return; }
  if (nearbyReunion) { meetAtBench(); return; }
  if (nearbyMemory) {
    const spot = nearbyMemory;
    tone(610, 0.08, 0.025);
    showDialogue(spot.lines(), () => { spot.seen = true; nearbyMemory = null; updateHUD(); resumePlay(); });
    return;
  }
  if (!nearbyFlower) return;
  currentFlower = nearbyFlower;
  const remaining = flowers.filter((flower) => flower.active).length;
  tone(784, 0.12, 0.04); setTimeout(() => tone(988, 0.16, 0.025), 90);
  if (remaining === 1) finalEncounter(currentFlower);
  else startObstacle(currentFlower);
}

function startObstacle(flower) {
  const quest = questDefinitions[scene.resolved];
  activeQuest = { ...quest, flower, stage: "travel", step: 0 };
  currentFlower = null;
  updateHUD();
  showDialogue(activeQuest.trigger(flower), () => {
    ui.status.textContent = `Return to the ${activeQuest.place}`;
    resumePlay();
  });
}

function interactQuestStep() {
  if (!activeQuest || activeQuest.stage !== "solve") return;
  const step = activeQuest.steps[activeQuest.step];
  if (!step) return;
  const isLastStep = activeQuest.step === activeQuest.steps.length - 1;
  const lines = [...step.lines(), ...(isLastStep ? activeQuest.solved() : [])];
  tone(698, 0.09, 0.025);
  showDialogue(lines, () => {
    activeQuest.step += 1;
    nearbyQuestStep = null;
    if (isLastStep) {
      activeQuest.stage = "return";
      ui.status.textContent = "The obstacle is cleared";
    }
    updateHUD(); resumePlay();
  });
}

function completeQuestAtMarket() {
  const quest = activeQuest;
  if (!quest || quest.stage !== "return") { resumePlay(); return; }
  currentFlower = quest.flower;
  showDialogue(quest.returned(quest.flower), () => {
    activeQuest = null;
    resolveEncounter();
  });
}

function resolveEncounter() {
  currentFlower.active = false;
  const flag = ["aquarium", "pool", "cats", "bell", "leap"][scene.resolved];
  if (flag) scene[flag] = true;
  scene.resolved += 1; scene.darkness = scene.resolved * 0.033;
  spawnPetals(player.x, player.y - 46, 18);
  currentFlower = null; updateHUD();
  ui.status.textContent = scene.resolved === 5 ? "Only one bloom remains" : "Another story crossed the aisle";
  resumePlay();
}

function finalEncounter(flower) {
  showDialogue([
    line("Narrator", `At the quiet edge of the market, the ${flower.name} leans toward you.`, "narrator"),
    line(player.name, "This one waited.", "player"),
    line("The Florist", "Or perhaps it was patient enough to wait for the right pair of paws.", "florist"),
    line("Narrator", "The last bloom slips carefully into its paper sleeve.", "narrator")
  ], () => beginHomecoming(flower));
}

function beginHomecoming(flower) {
  flower.active = false; endingFlower = flower; currentFlower = null;
  journey.returning = true; scene.darkness = 0.12;
  updateHUD();
  switchScene("bench", 155, () => {
    ui.chapter.textContent = "EPILOGUE · THE FAMILIAR BENCH";
    ui.status.textContent = `${player.name} is almost home`;
    showLocation("NEAR HOME", "The Familiar Bench", "Someone is waiting beneath the streetlamp");
    updateHUD();
    showDialogue([
      line("Narrator", "The market folds away behind you. One flower travels carefully between small teeth.", "narrator"),
      line("Narrator", "Ahead, the familiar bench is no longer empty.", "narrator")
    ], resumePlay);
  }, "right");
}

function meetAtBench() {
  if (journey.reunion) return;
  journey.reunion = true; player.direction = "right";
  showDialogue([
    line("Narrator", "The other dog has already claimed the warmest place beside the bench.", "narrator"),
    line("Her", "You made it.", "her"),
    line(player.name, "Mmph.", "player"),
    line("Narrator", "A slightly crumpled flower is set down with great care.", "narrator"),
    line("Her", "Come on. There is room here.", "her"),
    line("Narrator", "For a little while, the road, the market and every interruption become one more story for the bench.", "narrator")
  ], () => showEnding(endingFlower));
}

function showEnding(flower) {
  state = "ending"; player.pose = "sit";
  ui.dialogue.hidden = true; ui.hud.hidden = true; ui.touch.hidden = true;
  ui.endingFlower.textContent = flower.symbol; ui.endingFlower.style.color = flower.color;
  ui.endingTitle.textContent = `${player.name} brought the ${flower.name} home.`;
  ui.endingCopy.textContent = "The flower found its way home. Some plans change; the care behind them does not.";
  ui.endingMemory.textContent = "A familiar bench, both dogs, and one flower";
  ui.ending.hidden = false; ui.chapter.textContent = "EPILOGUE · BLUE HOUR"; scene.darkness = 0.19;
  tone(523, 0.4, 0.035); setTimeout(() => tone(659, 0.45, 0.028), 240); setTimeout(() => tone(784, 0.7, 0.02), 480);
}

function line(speaker, text, portrait, choices = null) { return { speaker, text, portrait, choices }; }
function choice(label, memory, followup) { return { label, memory, followup }; }

function showDialogue(lines, onComplete) {
  dialogue = { lines: [...lines], index: 0, typed: 0, complete: false, onComplete, lastType: 0 };
  state = "dialogue"; player.pose = "sit";
  ui.dialogue.hidden = false; ui.prompt.hidden = true; ui.touch.classList.remove("is-active");
  ui.frame.classList.add("is-cinematic"); presentLine();
}

function presentLine() {
  const item = dialogue.lines[dialogue.index];
  dialogue.typed = 0; dialogue.complete = false; dialogue.lastType = performance.now();
  ui.speaker.textContent = item.speaker; ui.text.textContent = "";
  ui.choices.hidden = true; ui.choices.innerHTML = ""; ui.continueButton.hidden = true;
  ui.portraitMark.textContent = item.portrait === "narrator" ? "✦" : "◆";
  player.pose = item.portrait === "player" ? "emotional" : "sit";
  drawPortrait(item.portrait);
}

function advanceDialogue() {
  if (state !== "dialogue" || !dialogue) return;
  const item = dialogue.lines[dialogue.index];
  if (!dialogue.complete) {
    dialogue.typed = item.text.length; dialogue.complete = true; ui.text.textContent = item.text;
    revealLineActions(item); return;
  }
  if (item.choices) return;
  tone(430, 0.025, 0.012); dialogue.index += 1;
  if (dialogue.index >= dialogue.lines.length) {
    const done = dialogue.onComplete; dialogue = null; ui.dialogue.hidden = true; if (done) done(); return;
  }
  presentLine();
}

function revealLineActions(item) {
  if (item.choices) {
    ui.choices.innerHTML = "";
    item.choices.forEach((option) => {
      const button = document.createElement("button"); button.type = "button"; button.textContent = option.label;
      button.addEventListener("click", () => selectChoice(option)); ui.choices.appendChild(button);
    });
    ui.choices.hidden = false;
  } else ui.continueButton.hidden = false;
}

function selectChoice(option) {
  choiceMemories.push(option.memory);
  dialogue.lines.splice(dialogue.index + 1, 0, ...option.followup);
  dialogue.lines[dialogue.index].choices = null; ui.choices.hidden = true;
  tone(660, 0.08, 0.025); advanceDialogue();
}

function updateDialogueTyping(time) {
  if (state !== "dialogue" || !dialogue || dialogue.complete) return;
  const item = dialogue.lines[dialogue.index];
  const target = Math.min(item.text.length, Math.floor((time - dialogue.lastType) / 20));
  if (target !== dialogue.typed) {
    dialogue.typed = target; ui.text.textContent = item.text.slice(0, target);
    if (target % 5 === 0) tone(245 + (target % 4) * 14, 0.012, 0.0025);
  }
  if (target >= item.text.length) { dialogue.complete = true; revealLineActions(item); }
}

function updateHUD() {
  ui.pips.innerHTML = "";
  if (activeQuest) {
    if (activeQuest.stage === "travel") ui.quest.textContent = `Find the ${activeQuest.place} and press Up at its entrance`;
    else if (activeQuest.stage === "solve") ui.quest.textContent = activeQuest.steps[activeQuest.step]?.objective || "Finish the errand";
    else ui.quest.textContent = "Return to the flower market";
    ui.count.textContent = `Obstacle ${scene.resolved + 1} of 5`;
    appendPips(5, 5 - scene.resolved); return;
  }
  if (journey.returning) {
    ui.quest.textContent = "Bring the last flower to the familiar bench";
    ui.count.textContent = "Almost home";
    appendPips(1, 1); return;
  }
  if (!journey.market || currentScene !== "market") {
    const found = memorySpots.filter((spot) => spot.seen).length;
    ui.quest.textContent = currentScene === "entrance" ? "Stand in the doorway and press Up" : "Follow the evening road to the market";
    ui.count.textContent = found ? `${found} small ${found === 1 ? "moment" : "moments"} noticed` : "The market is ahead";
    const route = ["bench", "aquarium", "dateNight", "catStories", "entrance"];
    const routeProgress = Math.max(0, route.indexOf(currentScene));
    appendPips(route.length, route.length - routeProgress); return;
  }
  const count = flowers.filter((flower) => flower.active).length;
  ui.count.textContent = count === 1 ? "The last bloom remains" : `${count} blooms remain`;
  ui.quest.textContent = count === 1 ? "Choose the flower that waited" : "Choose one flower to take home";
  appendPips(6, count);
}

function appendPips(total, active) {
  for (let i = 0; i < total; i++) {
    const pip = document.createElement("i"); if (i >= active) pip.className = "is-gone"; ui.pips.appendChild(pip);
  }
}

function update(delta, time) {
  updateDialogueTyping(time);
  if (state === "playing") {
    const config = SCENES[currentScene];
    const dx = Number(keys.right) - Number(keys.left);
    player.moving = dx !== 0;
    if (player.moving) {
      player.sprinting = keys.sprint;
      const movementSpeed = player.sprinting ? player.sprintSpeed : player.speed;
      player.x = clamp(player.x + dx * movementSpeed * delta, config.minX, config.maxX);
      player.y = config.groundY;
      player.walkFrame += delta * (player.sprinting ? 12.8 : 7.5);
      player.pose = player.sprinting ? "run" : "walk";
      player.direction = dx > 0 ? "right" : "left";
    } else { player.sprinting = false; player.pose = "idle"; }
    checkJourneyTransitions();
    if (state !== "playing") return;

    nearbyFlower = null; nearbyMemory = null; nearbyQuestStep = null; nearbyReunion = false;
    if (currentScene === "market" && !activeQuest) {
      let nearest = 85;
      flowers.forEach((flower) => {
        if (!flower.active) return;
        const distance = Math.abs(player.x - flower.stand);
        if (distance < nearest) { nearest = distance; nearbyFlower = flower; }
      });
    }
    if (!journey.returning && !activeQuest) {
      let nearest = 64;
      memorySpots.forEach((spot) => {
        if (spot.seen || spot.scene !== currentScene) return;
        const distance = Math.abs(player.x - spot.x);
        if (distance < nearest) { nearest = distance; nearbyMemory = spot; }
      });
    }
    if (activeQuest && activeQuest.stage === "solve" && currentScene === activeQuest.interior) {
      const step = activeQuest.steps[activeQuest.step];
      if (step && Math.abs(player.x - step.x) < 70) nearbyQuestStep = step;
    }
    if (journey.returning && currentScene === "bench" && Math.abs(player.x - 735) < 88) nearbyReunion = true;

    const door = getActiveDoor();
    ui.prompt.hidden = !door && !nearbyQuestStep && !nearbyReunion && !nearbyMemory && !nearbyFlower;
    if (door) {
      ui.promptKey.textContent = "↑";
      if (door.kind === "marketExit") ui.promptKicker.textContent = "Return to the evening street";
      else if (door.kind === "marketEnter") ui.promptKicker.textContent = "The market doorway";
      else if (activeQuest && currentScene === activeQuest.interior) ui.promptKicker.textContent = "Back to the evening road";
      else ui.promptKicker.textContent = "A place from the road";
      ui.promptLabel.textContent = door.label;
    } else if (nearbyQuestStep) {
      ui.promptKey.textContent = "E";
      ui.promptKicker.textContent = nearbyQuestStep.kicker;
      ui.promptLabel.textContent = nearbyQuestStep.label;
    } else if (nearbyReunion) {
      ui.promptKey.textContent = "E";
      ui.promptKicker.textContent = "The familiar bench";
      ui.promptLabel.textContent = "Bring her the flower";
    } else if (nearbyMemory) {
      ui.promptKey.textContent = "E";
      ui.promptKicker.textContent = "Something familiar";
      ui.promptLabel.textContent = nearbyMemory.label;
    } else if (nearbyFlower) {
      ui.promptKey.textContent = "E";
      const count = flowers.filter((flower) => flower.active).length;
      ui.promptKicker.textContent = count === 1 ? "The market has gone quiet" : "A flower catches your eye";
      ui.promptLabel.textContent = count === 1 ? `Choose the ${nearbyFlower.name}` : `Inspect the ${nearbyFlower.name}`;
    }
  } else { player.moving = false; player.sprinting = false; ui.prompt.hidden = true; }

  camera.target = clamp(player.x - 380, 0, Math.max(0, SCENES[currentScene].width - VIEW_WIDTH));
  if (["title", "select", "loading"].includes(state)) camera.target = 0;
  camera.x += (camera.target - camera.x) * Math.min(1, delta * 4.5);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.x += p.vx * delta; p.y += p.vy * delta; p.life -= delta; p.rotation += delta * p.spin;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (Math.random() < delta * (currentScene === "market" ? 3 : 1.15)) {
    particles.push({
      x: camera.x + Math.random() * 960, y: 90 + Math.random() * 310,
      vx: -4 + Math.random() * 10, vy: 5 + Math.random() * 9, life: 8,
      rotation: Math.random() * 6, spin: -1 + Math.random() * 2,
      color: ["#eb9a91", "#f0c66d", "#d9b4c3"][Math.floor(Math.random() * 3)]
    });
  }
}

function draw(time) {
  ctx.clearRect(0, 0, 960, 540);
  ctx.save(); ctx.translate(-Math.floor(camera.x), 0);
  drawSceneBackground(); drawDoorHints(time); drawMemoryProps(time); drawQuestHint(time); drawFlowerMarkers(time); drawNPCs(time);
  if (!['title', 'select', 'loading'].includes(state)) {
    drawDogSprite(ctx, player.x, player.y, player.type, player.pose, player.direction, player.walkFrame, 1);
    if (journey.returning && currentScene === "bench" && endingFlower) drawCarriedFlower(player.x, player.y, player.direction, endingFlower, time);
  }
  drawWorldParticles(); ctx.restore();
  drawLighting(time);
}

function drawSceneBackground() {
  const config = SCENES[currentScene];
  const image = currentScene === "bench" && journey.returning ? assets.benchEnding : assets[config.asset];
  if (!image) { ctx.fillStyle = "#251d36"; ctx.fillRect(0, 0, config.width, 540); return; }
  ctx.drawImage(image, 0, 0, config.width, 540);
}

function drawMemoryProps(time) {
  if (journey.returning || activeQuest) return;
  memorySpots.filter((spot) => spot.scene === currentScene).forEach((spot, index) => {
    const distance = Math.abs(player.x - spot.x);
    if (!spot.seen && state === "playing" && distance < 175) {
      drawWorldIndicator(spot.x, SCENES[currentScene].groundY - 116, "E", time + index * 230, distance < 64);
    }
  });
}

function drawDoorHints(time) {
  if (state !== "playing") return;
  getAvailableDoors().forEach((door, index) => {
    const distance = Math.abs(player.x - door.x);
    if (distance < door.radius + 115) {
      drawWorldIndicator(door.x, SCENES[currentScene].groundY - 132, "↑", time + index * 190, distance <= door.radius);
    }
  });
}

function drawQuestHint(time) {
  if (!activeQuest || activeQuest.stage !== "solve" || currentScene !== activeQuest.interior) return;
  const step = activeQuest.steps[activeQuest.step];
  if (!step) return;
  drawWorldIndicator(step.x, SCENES[currentScene].groundY - 116, "E", time, Math.abs(player.x - step.x) < 70);
}

function propTop(kind) {
  return { bench: 337, aquarium: 306, football: 408, pool: 320, chess: 391, gaming: 315, catcafe: 398, stories: 360, agency: 310 }[kind] || 360;
}

function drawMemoryProp(spot, time) {
  const x = spot.x; ctx.save(); ctx.globalAlpha = spot.seen ? 0.58 : 0.95;
  if (spot.kind === "bench") {
    ctx.strokeStyle = "rgba(240,198,109,.42)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, 342, 38 + Math.sin(time / 600) * 2, 0, Math.PI * 2); ctx.stroke();
  } else if (spot.kind === "aquarium") {
    ctx.fillStyle = "#263858"; ctx.fillRect(x - 32, 305, 64, 66); ctx.strokeStyle = "#81a7bd"; ctx.strokeRect(x - 29, 308, 58, 55);
    ctx.fillStyle = "#df9d64"; ctx.fillRect(x - 17, 330, 8, 4); ctx.fillRect(x + 7, 348, 6, 4);
    ctx.fillStyle = "#7fb6bd"; ctx.beginPath(); ctx.moveTo(x + 4, 320); ctx.lineTo(x + 18, 325); ctx.lineTo(x + 4, 330); ctx.fill();
    ctx.fillStyle = "#19283e"; ctx.beginPath(); ctx.moveTo(x - 2, 356); ctx.lineTo(x + 17, 350); ctx.lineTo(x + 26, 357); ctx.lineTo(x + 15, 360); ctx.fill();
  } else if (spot.kind === "football") {
    ctx.fillStyle = "rgba(19,13,25,.35)"; ctx.beginPath(); ctx.ellipse(x, 447, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d6c7ad"; ctx.beginPath(); ctx.arc(x, 426, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#453947"; ctx.fillRect(x - 5, 418, 9, 8); ctx.fillRect(x + 5, 430, 6, 5); ctx.fillRect(x - 12, 432, 6, 5);
  } else if (spot.kind === "pool") {
    ctx.fillStyle = "#2a744f"; ctx.fillRect(x - 35, 382, 70, 32); ctx.fillStyle = "#352634"; ctx.fillRect(x - 38, 377, 76, 7); ctx.fillRect(x - 31, 414, 6, 28); ctx.fillRect(x + 25, 414, 6, 28);
    ctx.strokeStyle = "#d2a46b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 30, 382); ctx.lineTo(x - 5, 313); ctx.stroke();
    ctx.fillStyle = "#efe1c8"; ctx.fillRect(x - 11, 342, 5, 3); ctx.fillRect(x + 2, 333, 4, 3);
  } else if (spot.kind === "chess") {
    ctx.fillStyle = "#4a2f32"; ctx.fillRect(x - 27, 406, 54, 7); ctx.fillRect(x - 23, 413, 5, 27); ctx.fillRect(x + 18, 413, 5, 27);
    for (let row = 0; row < 6; row++) for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 ? "#d6ad72" : "#6d493d"; ctx.fillRect(x - 24 + col * 6, 370 + row * 6, 6, 6);
    }
    ctx.fillStyle = "#eee0c5"; ctx.fillRect(x - 12, 363, 5, 8); ctx.fillRect(x + 7, 366, 5, 5); ctx.fillStyle = "#302937"; ctx.fillRect(x, 361, 5, 10);
  } else if (spot.kind === "gaming") {
    ctx.fillStyle = "#211b32"; ctx.fillRect(x - 38, 313, 76, 72); ctx.strokeStyle = "#8d77b0"; ctx.strokeRect(x - 34, 317, 68, 54);
    ctx.fillStyle = "#c76f8c"; ctx.fillRect(x - 29, 322, 27, 43); ctx.fillStyle = "#5d86b4"; ctx.fillRect(x + 2, 322, 27, 43);
    ctx.fillStyle = "#e8d7bd"; ctx.fillRect(x - 23, 375, 18, 7); ctx.fillRect(x + 7, 375, 18, 7); ctx.fillStyle = "#2c2536"; ctx.fillRect(x - 18, 372, 8, 4); ctx.fillRect(x + 12, 372, 8, 4);
  } else if (spot.kind === "catcafe") {
    [-22, 0, 22].forEach((offset, i) => { drawTinyCat(x + offset, 419 + (i % 2) * 3, i === 1 ? "#b98b69" : "#756978"); drawBowl(x + offset + 7, 441); });
  } else if (spot.kind === "stories") {
    ctx.fillStyle = "#62424f"; ctx.fillRect(x - 28, 383, 23, 34); ctx.fillStyle = "#e7c36f"; ctx.fillRect(x - 30, 391, 27, 5); ctx.fillRect(x - 18, 381, 3, 38);
    ctx.fillStyle = "#d2aa5f"; ctx.beginPath(); ctx.ellipse(x + 17, 403, 26, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#c55554"; ctx.fillRect(x + 2, 398, 30, 5);
  } else if (spot.kind === "agency") {
    const colors = ["#bf6e79", "#5d7e9c", "#d0a45c"];
    [-28, 0, 28].forEach((offset, i) => { ctx.fillStyle = "#e6d6bd"; ctx.fillRect(x + offset - 12, 319 + i * 7, 24, 48); ctx.fillStyle = colors[i]; ctx.fillRect(x + offset - 8, 325 + i * 7, 16, 19); ctx.fillStyle = "#65525c"; ctx.fillRect(x + offset - 8, 349 + i * 7, 13, 2); ctx.fillRect(x + offset - 8, 355 + i * 7, 16, 2); });
  }
  ctx.restore();
}

function drawWorldIndicator(x, y, key, time, active) {
  const bob = Math.sin(time / 330) * 4;
  const pulse = 0.5 + Math.sin(time / 260) * 0.5;
  const radius = active ? 17 : 14;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 33 + pulse * 5);
  glow.addColorStop(0, active ? "rgba(255,226,142,.62)" : "rgba(255,218,135,.34)");
  glow.addColorStop(1, "rgba(255,186,76,0)");
  ctx.fillStyle = glow; ctx.fillRect(-42, -42, 84, 84);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = active ? "rgba(245,202,103,.98)" : "rgba(27,19,35,.9)";
  ctx.strokeStyle = active ? "#fff2c6" : "rgba(244,207,122,.92)";
  ctx.lineWidth = active ? 3 : 2;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = active ? "#211729" : "#f4cf7a";
  ctx.font = `700 ${key === "↑" ? 16 : 12}px monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(key, 0, key === "↑" ? -1 : 0);
  ctx.fillStyle = active ? "#fff2c6" : "#f4cf7a";
  ctx.beginPath(); ctx.moveTo(-5, radius + 5); ctx.lineTo(5, radius + 5); ctx.lineTo(0, radius + 11); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawSceneChanges(time) {
  if (currentScene !== "market") return;
  if (scene.aquarium) drawMiniTank(248, 405, time);
  if (scene.pool) drawPoolRemnant(405, 434);
  if (scene.cats) { drawTinyCat(548, 438, "#7b6c7c"); drawTinyCat(570, 440, "#b88765"); drawBowl(558, 455); }
  if (scene.bell) drawBellWorld(708, 440, time);
  if (scene.leap) drawLeapCast(875, 439, time);
}

function drawMiniTank(x, y, time) {
  ctx.save(); ctx.fillStyle = "rgba(35,71,92,.75)"; ctx.fillRect(x - 35, y - 46, 70, 42); ctx.strokeStyle = "#8ab2bb"; ctx.strokeRect(x - 35, y - 46, 70, 42);
  ctx.fillStyle = "#e99a68"; ctx.fillRect(x - 18 + Math.sin(time / 600) * 3, y - 31, 9, 4); ctx.fillStyle = "#8ec0b6"; ctx.fillRect(x + 10, y - 21, 7, 4);
  ctx.fillStyle = "#384458"; ctx.beginPath(); ctx.moveTo(x - 2, y - 39); ctx.lineTo(x + 18, y - 33); ctx.lineTo(x - 2, y - 27); ctx.fill(); ctx.restore();
}

function drawPoolRemnant(x, y) {
  ctx.save(); ctx.fillStyle = "#2f684a"; ctx.fillRect(x - 34, y - 27, 68, 24); ctx.fillStyle = "#4a3134"; ctx.fillRect(x - 37, y - 31, 74, 5); ctx.strokeStyle = "#d5a771"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 30, y - 30); ctx.lineTo(x - 4, y - 83); ctx.stroke(); ctx.restore();
}

function drawTinyCat(x, y, color) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = "rgba(20,15,24,.28)"; ctx.fillRect(-10, 5, 22, 4); ctx.fillStyle = color; ctx.fillRect(-7, -6, 15, 13); ctx.fillRect(-6, -14, 12, 9);
  ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-5, -20); ctx.lineTo(-1, -13); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(5, -20); ctx.lineTo(1, -13); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(9, -5, 8, -1.1, 1.4); ctx.stroke(); ctx.restore();
}

function drawBowl(x, y) { ctx.fillStyle = "#b75e62"; ctx.fillRect(x - 7, y - 4, 14, 5); ctx.fillStyle = "#e1b967"; ctx.fillRect(x - 5, y - 6, 10, 3); }

function drawBellWorld(x, y, time) {
  ctx.save(); ctx.translate(x, y + Math.sin(time / 700)); ctx.fillStyle = "rgba(25,18,27,.3)"; ctx.beginPath(); ctx.ellipse(0, 4, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#a79aaa"; ctx.fillRect(-18, -20, 38, 25); ctx.fillRect(2, -36, 26, 23); ctx.fillStyle = "#d8cbd2"; ctx.fillRect(-13, -17, 28, 7); ctx.fillRect(8, -32, 13, 6);
  ctx.beginPath(); ctx.moveTo(4, -34); ctx.lineTo(8, -46); ctx.lineTo(13, -35); ctx.fill(); ctx.beginPath(); ctx.moveTo(27, -34); ctx.lineTo(24, -46); ctx.lineTo(19, -35); ctx.fill();
  ctx.strokeStyle = "#9b8d9e"; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(-20, -11, 20, 1.2, 4.5); ctx.stroke(); ctx.fillStyle = "#e6c96f"; ctx.fillRect(12, -26, 4, 4); ctx.fillRect(21, -26, 4, 4); ctx.restore();
}

function drawLeapCast(x, y, time) {
  const cast = ["ted", "marshall", "lily", "robin", "barney"];
  cast.forEach((kind, index) => {
    const px = x + (index - 2) * 22; const hop = Math.abs(Math.sin(time / 520 + index)) * 8;
    drawTinyCastAnimal(px, y - hop, kind);
  });
  ctx.fillStyle = "#624b44"; ctx.fillRect(x - 72, y - 6, 42, 9); ctx.fillRect(x + 31, y - 6, 42, 9);
}

function drawTinyCastAnimal(x, y, kind) {
  const color = { ted:"#9f6c55", marshall:"#7d6c85", lily:"#b76570", robin:"#617d9a", barney:"#c49a59" }[kind];
  ctx.fillStyle = "rgba(20,15,24,.25)"; ctx.fillRect(x - 7, y + 4, 14, 3);
  ctx.fillStyle = color; ctx.fillRect(x - 7, y - 14, 14, 17); ctx.fillRect(x - 5, y - 23, 10, 9);
  if (kind === "marshall") { ctx.beginPath(); ctx.arc(x - 5, y - 22, 4, 0, Math.PI * 2); ctx.arc(x + 5, y - 22, 4, 0, Math.PI * 2); ctx.fill(); }
  else if (kind === "lily") { ctx.fillRect(x - 5, y - 34, 3, 12); ctx.fillRect(x + 2, y - 34, 3, 12); }
  else if (kind === "barney") { ctx.fillStyle = "#e5bd69"; ctx.beginPath(); ctx.moveTo(x + 5, y - 19); ctx.lineTo(x + 12, y - 16); ctx.lineTo(x + 5, y - 14); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(x - 5, y - 22); ctx.lineTo(x - 4, y - 30); ctx.lineTo(x, y - 22); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 5, y - 22); ctx.lineTo(x + 4, y - 30); ctx.lineTo(x, y - 22); ctx.fill(); }
}

function drawFlowerMarkers(time) {
  if (currentScene !== "market" || !["playing", "dialogue"].includes(state)) return;
  let flower = currentFlower || nearbyFlower;
  if (!flower && state === "playing") {
    let nearest = 165;
    flowers.forEach((candidate) => {
      if (!candidate.active) return;
      const distance = Math.abs(player.x - candidate.stand);
      if (distance < nearest) { nearest = distance; flower = candidate; }
    });
  }
  if (!flower || !flower.active) return;
  const pulse = 0.5 + Math.sin(time / 380) * 0.5;
  const [x, y] = flower.anchor;
  ctx.save(); ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 18 + pulse * 4);
  glow.addColorStop(0, `${flower.color}66`); glow.addColorStop(1, `${flower.color}00`);
  ctx.fillStyle = glow; ctx.fillRect(x - 24, y - 24, 48, 48);
  ctx.fillStyle = "rgba(255,244,196,.82)"; ctx.fillRect(x - 1, y - 14 - pulse * 3, 2, 2); ctx.restore();
  if (state === "playing") drawWorldIndicator(flower.stand, SCENES.market.groundY - 116, "E", time, nearbyFlower === flower);
}

function drawNPCs(time) {
  if (currentScene === "bench" && journey.returning) {
    const otherType = player.type === "maltipoo" ? "maltese" : "maltipoo";
    drawDogSprite(ctx, 835, 421, otherType, "sit", "left", 0, 0.82);
  }
}

function drawFlorist(x, y) {
  ctx.save(); ctx.translate(x, y); const s = 2;
  ctx.fillStyle = "rgba(30,20,30,.3)"; ctx.fillRect(-8*s, 10*s, 16*s, 3*s);
  ctx.fillStyle = "#496b5a"; ctx.fillRect(-6*s, -2*s, 12*s, 14*s);
  ctx.fillStyle = "#d9a078"; ctx.fillRect(-4*s, -10*s, 8*s, 9*s);
  ctx.fillStyle = "#4a3040"; ctx.fillRect(-5*s, -12*s, 10*s, 4*s); ctx.fillRect(-6*s, -9*s, 3*s, 7*s);
  ctx.fillStyle = "#f0c66d"; ctx.fillRect(-3*s, 1*s, 6*s, 2*s); ctx.restore();
}

function drawGirlSeated(x, footY) {
  ctx.save(); ctx.translate(x, footY); const s = 2;
  ctx.fillStyle = "rgba(22,15,27,.34)"; ctx.fillRect(-15*s, 2*s, 32*s, 4*s);
  ctx.fillStyle = "#33283a"; ctx.fillRect(-8*s, -18*s, 15*s, 18*s); ctx.fillRect(5*s, -7*s, 15*s, 7*s);
  ctx.fillStyle = "#bf7880"; ctx.fillRect(-10*s, -40*s, 20*s, 23*s); ctx.fillStyle = "#e1b08c"; ctx.fillRect(-7*s, -53*s, 14*s, 14*s);
  ctx.fillStyle = "#302738"; ctx.fillRect(-10*s, -58*s, 20*s, 9*s); ctx.fillRect(-11*s, -52*s, 5*s, 16*s); ctx.fillRect(7*s, -53*s, 5*s, 13*s);
  ctx.fillStyle = "#261f2d"; ctx.fillRect(-4*s, -48*s, 2*s, 2*s); ctx.fillRect(3*s, -48*s, 2*s, 2*s);
  ctx.fillStyle = "#8f5364"; ctx.fillRect(-9*s, -19*s, 18*s, 4*s); ctx.fillStyle = "#d6a681"; ctx.fillRect(8*s, -34*s, 5*s, 14*s);
  ctx.fillStyle = "#d8c4ad"; ctx.fillRect(17*s, -2*s, 7*s, 3*s); ctx.restore();
}

function drawCarriedFlower(x, y, direction, flower, time) {
  const side = direction === "right" ? 1 : -1; const sway = Math.sin(time / 300) * 2;
  ctx.save(); ctx.translate(x + side * 51, y - 56 + sway); if (side < 0) ctx.scale(-1, 1);
  ctx.strokeStyle = "#64865f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-18, 12); ctx.lineTo(1, 0); ctx.stroke();
  ctx.fillStyle = flower.color;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * 7, Math.sin(a) * 7, 5, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#f0c66d"; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawDogSprite(target, x, y, type, pose, direction, walkFrame, scale = 1) {
  if ((pose === "walk" || pose === "run") && assets.locomotion) {
    drawLocomotionSprite(target, x, y, type, pose, direction, walkFrame, scale);
    return;
  }
  if (!assets.dogs) { drawFallbackDog(target, x, y, type, pose, direction, walkFrame, 2.5 * scale); return; }
  const row = type === "maltese" ? 1 : 0;
  const running = pose === "run";
  let column = 0;
  if (pose === "walk" || running) column = Math.floor(walkFrame) % 2 ? 1 : 2;
  else if (pose === "sniff") column = 3;
  else if (pose === "sit") column = 4;
  else if (pose === "emotional") column = 5;
  const cellWidth = 256; const cellHeight = 192;
  const drawWidth = 160 * scale; const drawHeight = 120 * scale; const baselineOffset = 109 * scale;
  if (target === ctx) {
    if (running) drawSprintTrail(target, x, y, direction, walkFrame, scale);
    target.save(); target.globalAlpha = 0.34; target.fillStyle = "#17101f";
    const shadowPulse = running ? Math.abs(Math.sin(walkFrame * Math.PI / 2)) : 0;
    target.beginPath(); target.ellipse(x, y - 3, (running ? 44 - shadowPulse * 4 : 38) * scale, (running ? 5 : 6) * scale, 0, 0, Math.PI * 2); target.fill(); target.restore();
  }
  const runLift = running ? Math.abs(Math.sin(walkFrame * Math.PI / 2)) * 5 * scale : 0;
  const runStretch = running ? 1 + Math.sin(walkFrame * Math.PI) * 0.035 : 1;
  target.save(); target.translate(Math.floor(x), Math.floor(y - runLift)); if (direction === "left") target.scale(-1, 1);
  if (running) { target.rotate(0.045); target.scale(1.08 * runStretch, 0.94 / runStretch); }
  if (target === ctx) target.filter = "saturate(.88) brightness(.92)";
  target.drawImage(assets.dogs, column*cellWidth, row*cellHeight, cellWidth, cellHeight, -drawWidth/2, -baselineOffset, drawWidth, drawHeight);
  target.restore();
}

function drawLocomotionSprite(target, x, y, type, pose, direction, frame, scale) {
  const running = pose === "run";
  const row = running ? (type === "maltese" ? 3 : 2) : (type === "maltese" ? 1 : 0);
  const column = Math.floor(frame) % 4;
  const cellWidth = assets.locomotion.width / 4;
  const cellHeight = assets.locomotion.height / 4;
  const drawSize = 164 * scale;
  const baselineOffset = [138, 112, 103, 85][row] * scale;
  const phase = (frame - Math.floor(frame)) * Math.PI;
  const microLift = running ? Math.sin(phase) * 1.4 * scale : Math.sin(phase) * 0.65 * scale;

  if (target === ctx) {
    if (running) drawSprintTrail(target, x, y, direction, frame, scale);
    target.save();
    target.globalAlpha = running ? 0.28 : 0.34;
    target.fillStyle = "#17101f";
    const airborne = running && column === 1;
    target.beginPath();
    target.ellipse(x, y - 3, (airborne ? 36 : running ? 43 : 38) * scale, (airborne ? 4 : 6) * scale, 0, 0, Math.PI * 2);
    target.fill();
    target.restore();
  }

  target.save();
  target.translate(Math.floor(x), Math.floor(y - microLift));
  if (direction === "left") target.scale(-1, 1);
  if (target === ctx) target.filter = "saturate(.88) brightness(.92)";
  target.drawImage(
    assets.locomotion,
    column * cellWidth, row * cellHeight, cellWidth, cellHeight,
    -drawSize / 2, -baselineOffset, drawSize, drawSize
  );
  target.restore();
}

function drawSprintTrail(target, x, y, direction, frame, scale) {
  const side = direction === "right" ? -1 : 1;
  const pulse = Math.abs(Math.sin(frame * Math.PI));
  target.save();
  target.strokeStyle = "rgba(236, 214, 178, .24)"; target.lineWidth = 2 * scale;
  for (let i = 0; i < 3; i++) {
    const trailX = x + side * (47 + i * 14 + pulse * 5) * scale;
    const trailY = y - (25 + i * 10) * scale;
    target.beginPath(); target.moveTo(trailX, trailY); target.lineTo(trailX + side * 12 * scale, trailY); target.stroke();
  }
  target.fillStyle = "rgba(214, 180, 142, .28)";
  for (let i = 0; i < 3; i++) {
    const dustX = x + side * (35 + i * 13 + pulse * 7) * scale;
    const dustY = y - (4 + (i % 2) * 4) * scale;
    target.beginPath(); target.arc(dustX, dustY, (3 - i * 0.55) * scale, 0, Math.PI * 2); target.fill();
  }
  target.restore();
}

function drawFallbackDog(target, x, y, type, pose, direction, frame, scale) {
  const running = pose === "run";
  const lift = running ? Math.abs(Math.sin(frame * Math.PI / 2)) * 2.2 * scale : Math.sin(frame * Math.PI);
  target.save(); target.translate(Math.floor(x), Math.floor(y - lift)); if (direction === "left") target.scale(-1, 1);
  if (running) { target.rotate(0.05); target.scale(1.1, 0.92); }
  const palette = type === "maltese" ? { fur: "#eee8da", light: "#fffaf0", shade: "#b9aaa5", deep: "#42383e" } : { fur: "#a86d4c", light: "#c68b63", shade: "#704332", deep: "#422d2d" };
  const s = scale; const px = (a,b,w,h,c) => { target.fillStyle = c; target.fillRect(a*s,b*s,w*s,h*s); };
  px(-9,7,20,3,"rgba(38,25,35,.3)"); px(-7,-3,16,10,palette.fur); px(2,-10,11,10,palette.fur); px(3,-11,4,3,palette.light);
  px(10,-8,5,8,palette.shade); px(11,-6,2,2,palette.deep); px(13,-3,3,2,palette.deep); px(-5,5,4,5,palette.shade); px(5,5,4,5,palette.shade);
  px(-10,-5,5,3,palette.shade); px(-12,-8,3,5,palette.fur); px(-6,0,13,2,"#cb5268"); target.restore();
}

function drawSelectionPreviews() {
  if (!assets.dogs) return;
  document.querySelectorAll("[data-dog-preview]").forEach((preview) => {
    const previewCtx = preview.getContext("2d"); previewCtx.clearRect(0, 0, preview.width, preview.height); previewCtx.imageSmoothingEnabled = false;
    drawDogSprite(previewCtx, 120, 148, preview.dataset.dogPreview, "idle", "right", 0, 1.18);
  });
}

const portraitCells = {
  florist: [0, 0], tankkeeper: [1, 0], poolplayer: [2, 0], catkeeper: [3, 0],
  bell: [0, 1], ted: [1, 1], marshall: [2, 1], lily: [3, 1],
  robin: [0, 2], barney: [1, 2], her: [2, 2], narrator: [3, 2]
};

function drawPortrait(kind) {
  portraitCtx.clearRect(0, 0, 112, 112);
  if (kind === "player") {
    const gradient = portraitCtx.createLinearGradient(0, 0, 112, 112);
    gradient.addColorStop(0, "#705366"); gradient.addColorStop(1, "#352b45");
    portraitCtx.fillStyle = gradient; portraitCtx.fillRect(0, 0, 112, 112);
    drawDogSprite(portraitCtx, 56, 105, player.type, "emotional", "right", 0, 0.69);
    return;
  }
  const cell = portraitCells[kind] || portraitCells.narrator;
  if (assets.portraits) {
    const cellWidth = assets.portraits.width / 4;
    const cellHeight = assets.portraits.height / 3;
    const cropSize = Math.min(cellWidth, cellHeight);
    const sourceX = cell[0] * cellWidth + (cellWidth - cropSize) / 2;
    const sourceY = cell[1] * cellHeight + (cellHeight - cropSize) / 2;
    portraitCtx.drawImage(assets.portraits, sourceX, sourceY, cropSize, cropSize, 0, 0, 112, 112);
    return;
  }
  portraitCtx.fillStyle = "#3b2a45"; portraitCtx.fillRect(0, 0, 112, 112);
  portraitCtx.fillStyle = "#f0c66d"; portraitCtx.font = "56px Georgia"; portraitCtx.textAlign = "center"; portraitCtx.fillText("✦", 56, 75);
}

function drawFloristPortrait() {
  portraitCtx.fillStyle="#d49a74"; portraitCtx.fillRect(32,29,50,56); portraitCtx.fillStyle="#49303e"; portraitCtx.fillRect(27,20,60,22); portraitCtx.fillRect(27,36,12,46);
  portraitCtx.fillStyle="#292431"; portraitCtx.fillRect(43,48,5,5); portraitCtx.fillRect(68,48,5,5); portraitCtx.fillStyle="#87505a"; portraitCtx.fillRect(51,67,16,4);
  portraitCtx.fillStyle="#4f725d"; portraitCtx.fillRect(24,82,64,30); portraitCtx.fillStyle="#e1b75e"; portraitCtx.fillRect(50,82,14,5);
}

function drawHumanPortrait(clothes, skin, longHair = false) {
  portraitCtx.fillStyle = skin; portraitCtx.fillRect(34, 30, 45, 53); portraitCtx.fillStyle = "#30283a"; portraitCtx.fillRect(28, 20, 57, 20); portraitCtx.fillRect(28, 32, longHair ? 13 : 9, longHair ? 58 : 42); portraitCtx.fillRect(76, 33, longHair ? 12 : 8, longHair ? 55 : 35);
  portraitCtx.fillStyle = "#292431"; portraitCtx.fillRect(44, 49, 5, 5); portraitCtx.fillRect(65, 49, 5, 5); portraitCtx.fillStyle = "#8f5364"; portraitCtx.fillRect(51, 68, 14, 4);
  portraitCtx.fillStyle = clothes; portraitCtx.fillRect(24, 82, 65, 30);
}

function drawCatPortrait(fur, light) {
  portraitCtx.fillStyle = fur; portraitCtx.fillRect(28, 34, 57, 54); portraitCtx.beginPath(); portraitCtx.moveTo(29,39); portraitCtx.lineTo(36,16); portraitCtx.lineTo(50,37); portraitCtx.fill(); portraitCtx.beginPath(); portraitCtx.moveTo(84,39); portraitCtx.lineTo(76,16); portraitCtx.lineTo(63,37); portraitCtx.fill();
  portraitCtx.fillStyle = light; portraitCtx.fillRect(37, 43, 39, 11); portraitCtx.fillStyle = "#e4c66d"; portraitCtx.fillRect(42, 57, 6, 7); portraitCtx.fillRect(68, 57, 6, 7); portraitCtx.fillStyle = "#39303e"; portraitCtx.fillRect(54, 70, 8, 5);
  portraitCtx.strokeStyle = "#d8c9bf"; portraitCtx.lineWidth = 2; for (const y of [68,75]) { portraitCtx.beginPath(); portraitCtx.moveTo(14,y); portraitCtx.lineTo(44,y+3); portraitCtx.moveTo(71,y+3); portraitCtx.lineTo(101,y); portraitCtx.stroke(); }
}

function drawCastPortrait(kind) {
  const palette = {
    ted: ["#9f6c55", "#d4a07a"], marshall: ["#6e6683", "#d0a784"], lily: ["#b76570", "#e0a386"],
    robin: ["#557a98", "#d4a17d"], barney: ["#c49a59", "#ddb38c"]
  }[kind];
  portraitCtx.fillStyle = palette[0]; portraitCtx.fillRect(27, 36, 59, 50); portraitCtx.fillRect(34, 25, 45, 18);
  if (kind === "marshall") { portraitCtx.beginPath(); portraitCtx.arc(34, 28, 11, 0, Math.PI*2); portraitCtx.arc(79, 28, 11, 0, Math.PI*2); portraitCtx.fill(); }
  else if (kind === "lily") { portraitCtx.fillRect(37, 4, 12, 29); portraitCtx.fillRect(65, 4, 12, 29); }
  else if (kind === "barney") { portraitCtx.fillStyle = "#e5bd69"; portraitCtx.beginPath(); portraitCtx.moveTo(78,46); portraitCtx.lineTo(102,56); portraitCtx.lineTo(78,64); portraitCtx.fill(); }
  else { portraitCtx.beginPath(); portraitCtx.moveTo(34,32); portraitCtx.lineTo(37,8); portraitCtx.lineTo(51,29); portraitCtx.fill(); portraitCtx.beginPath(); portraitCtx.moveTo(79,32); portraitCtx.lineTo(75,8); portraitCtx.lineTo(62,29); portraitCtx.fill(); }
  portraitCtx.fillStyle = palette[1]; portraitCtx.fillRect(37, 47, 39, 32); portraitCtx.fillStyle = "#30283a"; portraitCtx.fillRect(43, 56, 5, 5); portraitCtx.fillRect(66, 56, 5, 5);
  portraitCtx.fillStyle = palette[0]; portraitCtx.fillRect(20, 83, 72, 29);
}

function drawWorldParticles() { particles.forEach((p) => { ctx.save(); ctx.globalAlpha = Math.min(1,p.life); ctx.translate(p.x,p.y); ctx.rotate(p.rotation); ctx.fillStyle=p.color; ctx.fillRect(-2,-1,5,3); ctx.restore(); }); }
function spawnPetals(x,y,count) { for (let i=0;i<count;i++) particles.push({ x,y,vx:-45+Math.random()*90,vy:-55+Math.random()*20,life:1.5+Math.random()*1.2,rotation:Math.random()*6,spin:-4+Math.random()*8,color:["#ed8f8a","#f3c46d","#d39fb5"][i%3] }); }

function drawLighting(time) {
  ctx.save(); ctx.globalCompositeOperation = "screen";
  const lights = currentScene === "market" ? [[274,184],[502,166],[748,178],[888,168]] : currentScene === "bench" ? [[750,113]] : [[115,130],[430,182],[760,145]];
  for (const [worldX,y] of lights) { const x = worldX - camera.x; const g=ctx.createRadialGradient(x,y,0,x,y,34+Math.sin(time/600+worldX)*3); g.addColorStop(0,"rgba(255,213,128,.14)"); g.addColorStop(1,"rgba(255,173,83,0)"); ctx.fillStyle=g; ctx.fillRect(x-45,y-45,90,90); }
  ctx.restore(); if (scene.darkness) { ctx.fillStyle=`rgba(19,17,46,${scene.darkness})`; ctx.fillRect(0,0,960,540); }
}

function transition(callback) { ui.fade.classList.add("is-active"); setTimeout(() => { callback(); setTimeout(() => ui.fade.classList.remove("is-active"), 80); }, 560); }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
function initAudio() { if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === "suspended") audioContext.resume(); }
function tone(frequency,duration,volume) { if (audioMuted || !audioContext) return; const oscillator=audioContext.createOscillator(); const gain=audioContext.createGain(); oscillator.type="sine"; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(volume,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001,audioContext.currentTime+duration); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime+duration); }
function toggleSound() { audioMuted=!audioMuted; ui.soundButton.textContent=audioMuted?"×":"♪"; ui.soundButton.setAttribute("aria-label",audioMuted?"Enable sound":"Mute sound"); if(!audioMuted){initAudio();tone(659,0.1,0.025);} }
function loop(time) { const delta=Math.min((time-lastTime)/1000,0.04)||0; lastTime=time; update(delta,time); draw(time); requestAnimationFrame(loop); }

updateHUD(); requestAnimationFrame(loop);
