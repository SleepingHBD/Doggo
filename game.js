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
const TOTAL_QUESTS = 6;
const DOG_ART_SCALE = 0.92;
const ROOFTOP_CHARACTER_SCALE = 0.83;
const POOL_LAYOUT = {
  table: { left: 748, surface: { x: 770, y: 344, width: 326, height: 40 } },
  playerMaxX: 560,
  helper: { x: 696, height: 192 },
  missingBall: {
    hidingX: 548, foundX: 602, returnX: 681, floorY: 457,
    rackX: 874, rackY: 360
  },
  interactions: { wallTray: 330, hidingPlace: 480, returnBall: 555 }
};
const AQUARIUM_LAYOUT = {
  helper: { x: 112, height: 154 },
  interactions: { reef: 260, coral: 555, deep: 900 }
};
const CAT_CAFE_LAYOUT = {
  helper: { x: 790, height: 154 },
  cats: { starts: [270, 342, 414], ends: [360, 435, 510], footY: 429 },
  bowls: { starts: [306, 348, 390], ends: [375, 435, 495], y: 428 },
  bell: { x: 1000, y: 322 },
  interactions: { count: 300, bowls: 580, bell: 965 }
};
const BELL_HOME_LAYOUT = {
  playerMaxX: 720,
  // This room uses a closer interior perspective than the other quest spaces.
  // Give Bell's caretaker an appropriately adult silhouette beside the door.
  helper: { x: 620, height: 200 },
  mouse: { startX: 510, endX: 760, y: 431 },
  bell: { chairX: 900, chairY: 379, floorX: 820, floorY: 457, height: 58 },
  interactions: { mat: 210, mouse: 530, chair: 710 }
};
const ROOFTOP_LAYOUT = {
  playerMaxX: 425,
  castFootY: 430,
  gap: { leftEdge: 518, rightEdge: 668 },
  runUpCart: { startX: 390, parkedX: 125, footY: 430, width: 128 },
  jump: { takeoffX: 514, landingX: 672, apex: 78 },
  patioLights: [[753, 309], [779, 313], [804, 316], [829, 318], [855, 320], [881, 320], [907, 319], [933, 317], [960, 314], [988, 310], [1018, 304], [1048, 297]],
  interactions: { runway: 270, landing: 350, signal: 405 }
};
const CINEMA_LAYOUT = {
  helper: { x: 118, height: 154 },
  aisleLights: [126, 378, 638, 898],
  projector: { x: 535, y: 216, lensX: 602, lensY: 245 },
  screen: { x: 750, y: 94, width: 302, height: 252 },
  interactions: { aisle: 330, projector: 560, signal: 900 }
};
const SCENES = {
  bench: { asset: "bench", width: 1100, minX: 105, maxX: 995, groundY: 430,
    doors: [{ x: 210, radius: 68, target: "bellHome", spawnX: 155, label: "Enter Bell's home", quest: "bell" }] },
  aquarium: { asset: "aquarium", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 400, radius: 76, target: "aquariumInside", spawnX: 200, label: "Enter the aquarium", quest: "aquarium" }] },
  dateNight: { asset: "dateNight", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 155, radius: 78, target: "poolInside", spawnX: 155, label: "Enter the pool hall", quest: "pool" }] },
  catStories: { asset: "catStories", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 125, radius: 76, target: "catInside", spawnX: 155, label: "Enter the cat cafe", quest: "cats" }] },
  cinemaStreet: { asset: "cinemaStreet", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 710, radius: 88, target: "cinemaInside", spawnX: 210, label: "Enter the cinema", quest: "cinema" }] },
  entrance: {
    asset: "entrance", width: 960, minX: 120, maxX: 850, groundY: 452,
    doors: [
      { x: 620, radius: 110, target: "market", spawnX: 220, label: "Enter the flower market", kind: "marketEnter" },
      { x: 825, radius: 62, target: "rooftop", spawnX: 90, label: "Take the service stairs", quest: "leap" }
    ]
  },
  market: {
    asset: "market", width: 1100, minX: 65, maxX: 1035, groundY: 466,
    doors: [{ x: 98, radius: 92, target: "entrance", spawnX: 735, label: "Leave the flower market", kind: "marketExit" }]
  },
  aquariumInside: { asset: "aquariumInside", width: 1100, minX: 70, maxX: 1030, groundY: 458,
    doors: [{ x: 88, radius: 72, target: "aquarium", spawnX: 400, label: "Leave the aquarium" }] },
  // Reserve enough space for the widest sprint frame, not just the dog's centre.
  // This keeps every visible paw, ear and muzzle clear of the foreground table.
  poolInside: { asset: "poolInside", width: 1100, minX: 70, maxX: POOL_LAYOUT.playerMaxX, groundY: 458,
    doors: [{ x: 150, radius: 78, target: "dateNight", spawnX: 155, label: "Leave the pool hall" }] },
  catInside: { asset: "catInside", width: 1100, minX: 70, maxX: 1030, groundY: 458,
    doors: [{ x: 90, radius: 72, target: "catStories", spawnX: 125, label: "Leave the cat cafe" }] },
  bellHome: { asset: "bellHome", width: 1100, minX: 70, maxX: BELL_HOME_LAYOUT.playerMaxX, groundY: 456,
    doors: [{ x: 92, radius: 72, target: "bench", spawnX: 210, label: "Step back outside" }] },
  rooftop: { asset: "rooftop", width: 1100, minX: 70, maxX: ROOFTOP_LAYOUT.playerMaxX, groundY: 430, playerScale: ROOFTOP_CHARACTER_SCALE, backgroundMode: "width", backgroundY: 40,
    doors: [{ x: 92, radius: 72, target: "entrance", spawnX: 825, label: "Return downstairs" }] },
  cinemaInside: { asset: "cinemaInside", width: 1100, minX: 70, maxX: 1030, groundY: 458,
    doors: [{ x: 88, radius: 72, target: "cinemaStreet", spawnX: 710, label: "Leave the cinema" }] }
};

const assetSources = {
  bench: "assets/bench-benchmark-v1.png",
  benchCompanion: "assets/character-companion-authored-v2.png",
  aquarium: "assets/exterior-aquarium-benchmark-v1.png",
  dateNight: "assets/exterior-date-night-benchmark-v1.png",
  catStories: "assets/exterior-cat-stories-benchmark-v1.png",
  cinemaStreet: "assets/exterior-cinema-benchmark-v1.png",
  entrance: "assets/market-entrance-benchmark-v1.png",
  market: "assets/market-interior-benchmark-v2.png",
  aquariumInside: "assets/interior-aquarium-benchmark-v4.png",
  poolInside: "assets/interior-pool-benchmark-v5.png",
  catInside: "assets/interior-cat-cafe-benchmark-v3.png",
  bellHome: "assets/interior-bell-home-benchmark-v5.png",
  rooftop: "assets/rooftop-benchmark-v5.png",
  cinemaInside: "assets/interior-cinema-benchmark-v2.png",
  dogMaltipoo: "assets/dog-maltipoo-authored-v2.png",
  dogMaltese: "assets/dog-maltese-authored-v2.png",
  visitors: "assets/character-visitors-authored-v2.png",
  visitorWalk: "assets/character-visitors-walk-v2.png",
  traveller: "assets/character-traveller-authored-v2.png",
  supportingCast: "assets/character-supporting-cast-v2.png",
  bellJump: "assets/character-bell-jump-v1.png",
  rooftopJumps: "assets/character-rooftop-jumps-v1.png",
  rooftopCart: "assets/rooftop-market-cart-v1.png",
  cinemaProjection: "assets/cinema-projection-hail-mary-v1.png",
  projectionist: "assets/character-projectionist-v1.png",
  cafeCats: "assets/character-cafe-cats-v1.png",
  questEffects: "assets/quest-effects-atlas-v2.png"
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
const ambientProfiles = {
  bench: { rate: 0.35, palette: ["#8c7955", "#6f7954", "#b38b57"], width: 3, height: 2, vx: [-4, 6], vy: [5, 12] },
  aquarium: { rate: 0.18, palette: ["#6f8d95", "#849da0"], width: 2, height: 2, vx: [-2, 3], vy: [3, 7] },
  dateNight: { rate: 0.22, palette: ["#8b785d", "#786e58"], width: 3, height: 2, vx: [-3, 5], vy: [4, 9] },
  catStories: { rate: 0.22, palette: ["#8b785d", "#6e7757"], width: 3, height: 2, vx: [-3, 5], vy: [4, 9] },
  cinemaStreet: { rate: 0.2, palette: ["#88755e", "#676f74"], width: 3, height: 2, vx: [-3, 5], vy: [4, 9] },
  entrance: { rate: 0.28, palette: ["#8c7955", "#6f7954", "#b38b57"], width: 3, height: 2, vx: [-4, 6], vy: [5, 11] },
  market: { rate: 1.35, palette: ["#d982a4", "#ef8c83", "#f2c24e"], width: 4, height: 2, vx: [-4, 7], vy: [4, 10] },
  aquariumInside: { rate: 0.12, palette: ["#7895a4", "#607d8f"], width: 2, height: 2, vx: [-1, 2], vy: [2, 5] },
  poolInside: { rate: 0.08, palette: ["#8a765b"], width: 2, height: 1, vx: [-1, 2], vy: [2, 4] },
  catInside: { rate: 0.08, palette: ["#9a8065"], width: 2, height: 1, vx: [-1, 2], vy: [2, 4] },
  bellHome: { rate: 0.06, palette: ["#9b866d"], width: 2, height: 1, vx: [-1, 2], vy: [2, 4] },
  rooftop: { rate: 0.18, palette: ["#758099", "#8a866e"], width: 2, height: 2, vx: [-8, -2], vy: [1, 4] },
  cinemaInside: { rate: 0.055, palette: ["#8f785e", "#4f5969"], width: 2, height: 1, vx: [-1, 2], vy: [1, 3] }
};
const scene = {
  resolved: 0, darkness: 0,
  aquarium: false, pool: false, cats: false, bell: false, cinema: false, leap: false
};
const journey = {
  leftBench: false, routeBeat: false, entrance: false, market: false,
  returning: false, reunion: false
};
const travellerEncounter = {
  scene: "aquarium", x: 590, tagX: 710, stage: "waiting", hasTag: false,
  departureX: 590, departureTargetX: 1180, motionStartedAt: 0,
  motionDuration: 2500, farewellDuration: 620, walkFrame: 0, lastStep: -1,
  cameraX: 0
};

let state = "loading";
let currentScene = "bench";
let nearbyFlower = null;
let nearbyMemory = null;
let nearbyQuestStep = null;
let nearbyReunion = false;
let nearbyTraveller = false;
let nearbyTravelTag = false;
let currentFlower = null;
let endingFlower = null;
let activeQuest = null;
let questAction = null;
let dialogue = null;
let lastTime = 0;
let audioMuted = false;
let audioContext = null;
let menuIndex = 0;

const flowerData = {
  peony: { name: "Coral Peony", short: "Peony", color: "#ef8c83", symbol: "✿", anchor: [283, 318], stand: 283 },
  tulip: { name: "Apricot Tulip", short: "Tulip", color: "#f1a062", symbol: "♦", anchor: [408, 312], stand: 408 },
  anemone: { name: "Blue Anemone", short: "Anemone", color: "#8492cc", symbol: "✤", anchor: [516, 318], stand: 516 },
  ranunculus: { name: "Rose Ranunculus", short: "Ranunculus", color: "#d982a4", symbol: "❀", anchor: [635, 315], stand: 635 },
  sunflower: { name: "Little Sunflower", short: "Sunflower", color: "#f2c24e", symbol: "☀", anchor: [753, 304], stand: 753 },
  daisy: { name: "Moon Daisy", short: "Daisy", color: "#fff1db", symbol: "✽", anchor: [878, 318], stand: 878 },
  jasmine: { name: "Star Jasmine", short: "Jasmine", color: "#f2dfbd", symbol: "✧", anchor: [1007, 312], stand: 1007 }
};
const flowers = Object.entries(flowerData).map(([id, data]) => ({ id, ...data, active: true, sale: null }));

const memorySpots = [
  {
    id: "bench", scene: "bench", x: 825, kind: "bench", label: "Pause by the familiar bench", seen: false,
    lines: () => [
      line("Narrator", "The middle slat dips a little. One end is still dry from the rain.", "narrator"),
      dogLine("We'll stop on the way back.", "We can stop on the way back.")
    ]
  },
  {
    id: "aquarium", scene: "aquarium", x: 200, kind: "aquarium", label: "Look for the shark", seen: false,
    lines: () => [
      line("Narrator", "Six bright fish crowd the glass. A shark crosses behind them and disappears into the coral.", "narrator"),
      dogLine("Too slow. Again.", "Next lap.")
    ]
  },
  {
    id: "football", scene: "aquarium", x: 930, kind: "football", label: "Pause by the school pitch", seen: false,
    lines: () => [
      line("Narrator", "A scuffed football sits halfway between the penalty spot and the goal.", "narrator"),
      dogLine("Close enough.", "It could use a kick.")
    ]
  },
  {
    id: "pool", scene: "dateNight", x: 340, kind: "pool", label: "Look into the pool hall", seen: false,
    lines: () => [
      line("Narrator", "Inside the pool hall, a cue points directly at a cluster of white marks on the ceiling.", "narrator"),
      dogLine("Ambitious.", "That explains the ceiling.")
    ]
  },
  {
    id: "gaming", scene: "dateNight", x: 730, kind: "gaming", label: "Look into the gaming cafe", seen: false,
    lines: () => [
      line("Narrator", "Two controllers sit below a paused split-screen. Neither half makes much sense alone.", "narrator"),
      dogLine("Both controllers, then.", "It needs both.")
    ]
  },
  {
    id: "catcafe", scene: "catStories", x: 220, kind: "catcafe", label: "Watch the cafe cats", seen: false,
    lines: () => [
      line("Narrator", "Every toy is untouched. Every food bowl has an audience.", "narrator"),
      dogLine("Correct priorities.", "They look busy.")
    ]
  },
  {
    id: "chess", scene: "catStories", x: 450, kind: "chess", label: "Look over the chessboard", seen: false,
    lines: () => [
      line("Narrator", "A chessboard is set for a game. No one has committed to the first move.", "narrator"),
      dogLine("Too many pieces.", "Maybe one move.")
    ]
  },
  {
    id: "stories", scene: "catStories", x: 670, kind: "stories", label: "Inspect the story window", seen: false,
    lines: () => [
      line("Narrator", "A wrapped copy of The Hunger Games rests below a faded poster of a straw-hatted pirate.", "narrator"),
      dogLine("Different kinds of trouble.", "Both look dangerous.")
    ]
  },
  {
    id: "agency", scene: "catStories", x: 905, kind: "agency", label: "Look into the creative studio", seen: false,
    lines: () => [
      line("Narrator", "Three versions of the same advert cover the wall. A fourth is pinned above the bin.", "narrator"),
      dogLine("Still working.", "One more version.")
    ]
  },
  {
    id: "cinema", scene: "cinemaStreet", x: 493, kind: "cinema", label: "Look at the space poster", seen: false,
    lines: () => [
      line("Narrator", "A Project Hail Mary poster shows a tiny ship climbing toward a white star. Two used tickets sit behind the frame.", "narrator"),
      dogLine("Long way up.", "The space one.")
    ]
  }
];

const questDefinitions = [
  {
    id: "aquarium", exterior: "aquarium", interior: "aquariumInside", place: "aquarium", title: "THE MISSING SHARK",
    issuer: { name: "Tank Keeper", portrait: "tankkeeper", sprite: "tankkeeper" },
    travelObjective: "Go to the aquarium and help find the missing shark",
    sellout: { tag: "SOLD", accent: "#7194a8", tilt: -0.045 },
    trigger: (flower) => [
      line("Narrator", `A blue-jacketed keeper steps between one paw and the ${flower.name}, counting on a clipboard.`, "narrator"),
      line("Tank Keeper", "Our reef shark is missing, and the evening tour starts in ten minutes. Could you come to the aquarium and help me search the tanks?", "tankkeeper"),
      dogLine("Lead the way.", "I can help look.")
    ],
    arrival: () => [
      line("Tank Keeper", "Current count: forty-three small fish, six rays, zero cooperative sharks. Start at the small reef tank and watch where the colourful school keeps turning.", "tankkeeper"),
      dogLine("They're pointing.", "They want us to follow.")
    ],
    steps: [
      { x: AQUARIUM_LAYOUT.interactions.reef, kicker: "The small reef tank", label: "Watch the colourful fish", objective: "Follow the colourful fish", lines: () => [
        line("Narrator", "Red, yellow and blue fish dart into the same tunnel, then double back.", "narrator"),
        dogLine("Not subtle.", "That way."),
        line("Tank Keeper", "They keep circling the coral tunnel. Check behind it for bubbles.", "tankkeeper")
      ] },
      { x: AQUARIUM_LAYOUT.interactions.coral, kicker: "A trail of bubbles", label: "Inspect the coral tunnel", objective: "Trace the bubbles through the coral", lines: () => [
        line("Narrator", "Three bubbles rise behind the coral. Then three more. Something large is circling back.", "narrator"),
        line("Tank Keeper", "The trail is moving toward the deep blue tank. Check the far glass for a shadow.", "tankkeeper")
      ] },
      { x: AQUARIUM_LAYOUT.interactions.deep, kicker: "The deep blue tank", label: "Find the hidden shark", objective: "Check the shadow in the deep tank", lines: () => [
        line("Narrator", "A dark fin crosses the glass, followed by the rest of the shark.", "narrator"),
        line("Tank Keeper", "Forty-three fish, six rays, one shark. Excellent.", "tankkeeper")
      ] }
    ],
    solved: () => [
      line("Tank Keeper", "Shark accounted for. The reef can open on time. I'll stay here and update the tour board—thank you.", "tankkeeper"),
      dogLine("Keep the count at one.", "Glad we found it.")
    ],
    marketReturn: (flower) => [
      line("The Florist", `You just missed the ${flower.short}. A family in yellow raincoats bought the last stem after their aquarium tour.`, "florist"),
      dogLine("Next flower.", "We'll try another.")
    ]
  },
  {
    id: "pool", exterior: "dateNight", interior: "poolInside", place: "pool hall", title: "THE MISSING EIGHT",
    issuer: { name: "Pool Player", portrait: "poolplayer", sprite: "poolplayer" },
    travelObjective: "Go to the pool hall and help find the missing 8-ball",
    sellout: { tag: "PAID", accent: "#a66e5b", tilt: 0.035 },
    trigger: (flower) => [
      line("Narrator", `A pool player stops beside the ${flower.name}, carrying an empty wooden triangle.`, "narrator"),
      line("Pool Player", "The 8-ball vanished while I was setting up the table. Could you come to the pool hall and help me find it before the next game?", "poolplayer"),
      dogLine("Round. Black. Small.", "Show me where it rolled."),
      line("Pool Player", "And probably somewhere a cue cannot reach. That's why I asked the professional.", "poolplayer")
    ],
    arrival: () => [
      line("Narrator", "Every ball is gathered on the felt except the black one. A single space waits in the middle of the rack.", "narrator"),
      line("Pool Player", "I checked the pockets twice. Start with the wall tray beside the cues; that is where the spare balls usually sit.", "poolplayer")
    ],
    steps: [
      { x: POOL_LAYOUT.interactions.wallTray, cameraFocus: 365, kicker: "The empty wall tray", label: "Check beside the cue rack", objective: "Inspect the spare-ball tray", lines: () => [
        line("Narrator", "The tray is empty, but a clean round mark interrupts the dust. A faint track continues across the floor.", "narrator"),
        dogLine("It rolled right.", "There is a trail."),
        line("Pool Player", "The track ends beneath the chair. Check under it before I move anything and send the ball farther away.", "poolplayer")
      ] },
      { x: POOL_LAYOUT.interactions.hidingPlace, cameraFocus: 560, kicker: "A shadow beneath the chair", label: "Look for the missing ball", objective: "Search beneath the chair", lines: () => [
        line("Narrator", "One nose reaches beneath the lowest rung. The 8-ball rolls out and stops beside a front paw.", "narrator"),
        dogLine("Found it.", "Black ball, found."),
        line("Pool Player", "Perfect. Nudge it along the clear floor to me. Slowly—the table leg is a very convincing pocket.", "poolplayer")
      ] },
      { x: POOL_LAYOUT.interactions.returnBall, cameraFocus: 705, kicker: "A clear line to the table", label: "Nudge the 8-ball back", objective: "Return the 8-ball to the pool player", lines: () => [
        line("Narrator", "The 8-ball rolls to the pool player's shoe. He lifts it onto the felt and closes the waiting space in the rack.", "narrator"),
        line("Pool Player", "Complete set. And not a single ceiling tile involved.", "poolplayer")
      ] }
    ],
    solved: () => [
      line("Pool Player", "I'll stay and finish setting up the next game. The 8-ball is going directly in the middle where I can see it.", "poolplayer"),
      dogLine("Good spot.", "Keep an eye on it.")
    ],
    marketReturn: (flower) => [
      line("The Florist", `The last ${flower.short} was reserved and paid for while you were at the pool hall. Pickup is at closing.`, "florist"),
      dogLine("Next one.", "We'll keep looking.")
    ]
  },
  {
    id: "cats", exterior: "catStories", interior: "catInside", place: "cat cafe", title: "DINNER FIRST",
    issuer: { name: "Cafe Keeper", portrait: "catkeeper", sprite: "catkeeper" },
    travelObjective: "Go to the cat cafe and help clear the feeding area",
    sellout: { tag: "COLLECTED", accent: "#bd7a70", tilt: -0.025 },
    trigger: (flower) => [
      line("Narrator", `A cafe keeper stops beside the ${flower.name}, holding a delivery card covered in paw prints.`, "narrator"),
      line("Cafe Keeper", "Three cats have surrounded the dinner bowls, and I can't reach the delivery bell. Could you come to the cat cafe and help me clear a path under the tables?", "catkeeper"),
      dogLine("Dinner first.", "I'll stay low."),
      line("Cafe Keeper", "Perfect. The cats are winning, by the way. They count as one team.", "catkeeper")
    ],
    arrival: () => [
      line("Cafe Keeper", "Welcome. Tonight's special is apparently 'do not touch my bowl.'", "catkeeper"),
      line("Narrator", "Three tails block the route to the delivery bell.", "narrator"),
      line("Cafe Keeper", "Start at the feeding corner. Count the cats and make sure each one has a bowl.", "catkeeper")
    ],
    steps: [
      { x: CAT_CAFE_LAYOUT.interactions.count, kicker: "A crowded feeding corner", label: "Count the dinner bowls", objective: "Count the bowls at the feeding corner", lines: () => [
        line("Narrator", "Three cats. Three bowls. One cat has claimed two opinions.", "narrator"),
        dogLine("Complicated.", "One at a time."),
        line("Cafe Keeper", "Now move the bowls into one row along the counter. They'll follow dinner.", "catkeeper")
      ] },
      { x: CAT_CAFE_LAYOUT.interactions.bowls, kicker: "The cafe counter", label: "Arrange the bowls in a row", objective: "Make a clear dinner row", lines: () => [
        line("Narrator", "The bowls slide into a neat row. All three cats move with them.", "narrator"),
        line("Cafe Keeper", "Efficient. Terrifying, but efficient. The path is clear—ring the brass bell by the cat tree.", "catkeeper")
      ] },
      { x: CAT_CAFE_LAYOUT.interactions.bell, kicker: "A little brass bell", label: "Ring the delivery bell", objective: "Ring the bell by the cat tree", lines: () => [
        line("Narrator", "The bell rings. The counter stays clear for three full seconds.", "narrator"),
        line("Cafe Keeper", "That's our opening. We train for moments like this.", "catkeeper")
      ] }
    ],
    solved: () => [
      line("Cafe Keeper", "Delivery bell reached. I'll stay and reset the bowls before anyone invents a second dinner.", "catkeeper"),
      dogLine("Count them twice.", "Good luck.")
    ],
    marketReturn: (flower) => [
      line("Narrator", `A courier passes the doorway carrying the last ${flower.short}.`, "narrator"),
      line("The Florist", "It was collected with the cafe's evening order.", "florist"),
      dogLine("Next bucket.", "Let's keep looking.")
    ]
  },
  {
    id: "bell", exterior: "bench", interior: "bellHome", place: "Bell's home", title: "A QUIET INTRODUCTION",
    issuer: { name: "Bell's Neighbour", portrait: "bellkeeper", sprite: "bellkeeper" },
    travelObjective: "Go to Bell's home and help with a careful introduction",
    sellout: { tag: "DELIVERY", accent: "#856b91", tilt: 0.04 },
    trigger: (flower) => [
      line("Narrator", `A neighbour in a plum raincoat stops beside the ${flower.name} with a silver-ribboned parcel.`, "narrator"),
      line("Bell's Neighbour", "This parcel is for Bell, but he won't let me close enough to deliver it. Could you come to his home and help him get comfortable with a visitor?", "bellkeeper"),
      dogLine("I can wait.", "He can choose."),
      line("Bell's Neighbour", "Good. Bell appreciates patience, distance, and having the final say.", "bellkeeper")
    ],
    arrival: () => [
      line("Narrator", "Bell watches from the armchair. Ears forward. Tail still.", "narrator"),
      line("Bell", "Mrrp.", "bell"),
      line("Bell's Neighbour", "Start on the mat. Let Bell decide whether the distance gets smaller.", "bellkeeper")
    ],
    steps: [
      { x: BELL_HOME_LAYOUT.interactions.mat, kicker: "The entry mat", label: "Wait on the mat", objective: "Give Bell some space", lines: () => [
        line("Narrator", `${player.name} sits on the mat. Bell blinks once.`, "narrator"),
        dogLine("No rush.", "I'll wait."),
        line("Bell's Neighbour", "Good. Bring the cloth mouse from the basket halfway toward him—no closer.", "bellkeeper")
      ] },
      { x: BELL_HOME_LAYOUT.interactions.mouse, kicker: "A basket of cat toys", label: "Bring the cloth mouse closer", objective: "Find Bell's cloth mouse", lines: () => [
        line("Narrator", "The cloth mouse stops halfway to the chair. Bell looks at the toy, then the dog, then the toy.", "narrator"),
        line("Bell's Neighbour", "That's enough. Sit beside the armchair and let Bell choose whether to approach.", "bellkeeper")
      ] },
      { x: BELL_HOME_LAYOUT.interactions.chair, cameraFocus: 810, kicker: "Bell's armchair", label: "Sit quietly with Bell", objective: "Let Bell choose the distance", lines: () => [
        line("Narrator", "Bell steps down, sniffs one unfamiliar nose, and sits beside it.", "narrator"),
        line("Bell", "Prrrp.", "bell")
      ] }
    ],
    solved: () => [
      line("Bell's Neighbour", "That sound means yes. Or move six centimetres left. Either way, progress.", "bellkeeper"),
      line("Bell's Neighbour", "I'll stay here and finish the delivery. Bell can keep the ribbon and make the box his problem.", "bellkeeper"),
      dogLine("I'll take yes.", "That's enough.")
    ],
    marketReturn: (flower) => [
      line("The Florist", `A delivery rider collected the last ${flower.short} five minutes ago.`, "florist"),
      dogLine("Another one, then.", "We still have time.")
    ]
  },
  {
    id: "cinema", exterior: "cinemaStreet", interior: "cinemaInside", place: "cinema", title: "THE QUIET SIGNAL",
    issuer: { name: "The Projectionist", portrait: "projectionist", sprite: "projectionist" },
    travelObjective: "Go to the cinema and help restart the stalled projector",
    sellout: { tag: "HELD", accent: "#8b6474", tilt: 0.025 },
    trigger: (flower) => [
      line("Narrator", `A projectionist stops beside the ${flower.name}, carrying a brass flashlight and one loose reel.`, "narrator"),
      line("The Projectionist", "The late screening is ready, but the projector lost power halfway through its focus test. Could you come to the cinema and help me bring it back?", "projectionist"),
      dogLine("Show me the dark part.", "I can help with the lights."),
      line("The Projectionist", "Good. We will start low, then work toward the screen.", "projectionist")
    ],
    arrival: () => [
      line("The Projectionist", "The main circuit is holding. The aisle markers, projector and signal lamp are not.", "projectionist"),
      line("The Projectionist", "Start at the brass aisle markers. Press each one until the path reaches the projector.", "projectionist")
    ],
    steps: [
      { x: CINEMA_LAYOUT.interactions.aisle, cameraFocus: 310, kicker: "The dark aisle markers", label: "Light the aisle markers", objective: "Press the aisle markers from left to right", lines: () => [
        line("Narrator", "Four amber markers wake in a line, each one answering the last.", "narrator"),
        dogLine("Path is lit.", "All four."),
        line("The Projectionist", "Good. Now turn the projector's brass focus ring until the pale edges meet.", "projectionist")
      ] },
      { x: CINEMA_LAYOUT.interactions.projector, cameraFocus: 600, kicker: "The old projector", label: "Align the focus ring", objective: "Turn the brass ring until the test image is sharp", lines: () => [
        line("Narrator", "The blurred square tightens into a clean frame. The old projector settles into an even hum.", "narrator"),
        line("The Projectionist", "Focus is steady. Go to the screen and repeat the three-light signal: amber, blue, amber.", "projectionist")
      ] },
      { x: CINEMA_LAYOUT.interactions.signal, cameraFocus: 915, kicker: "The waiting screen", label: "Repeat the light signal", objective: "Press amber, blue, amber at the screen", lines: () => [
        line("Narrator", "Amber. Blue. Amber. A small ship appears beneath a white star, and the signal answers from the booth.", "narrator"),
        line("The Projectionist", "Picture, focus, signal. We have a screening.", "projectionist")
      ] }
    ],
    solved: () => [
      line("The Projectionist", "I'll stay to run the final reel check. Thank you for giving the room its light back.", "projectionist"),
      dogLine("Keep the signal on.", "Enjoy the screening.")
    ],
    marketReturn: (flower) => [
      line("The Florist", `The last ${flower.short} was wrapped for the late screening and collected while you were at the cinema.`, "florist"),
      dogLine("One more try.", "We'll try the next one.")
    ]
  },
  {
    id: "leap", exterior: "entrance", interior: "rooftop", place: "market rooftop", title: "THE LEAP",
    issuer: { name: "Ted", portrait: "ted", sprite: "ted" },
    travelObjective: "Go to the market rooftop and help make the crossing safe",
    sellout: { tag: "SOLD OUT", accent: "#b5915d", tilt: -0.035 },
    trigger: (flower) => [
      line("Narrator", `Five name cards slide from beneath the ${flower.name}. An orange fox catches four.`, "narrator"),
      line("Ted", "Marshall has spent all evening saying he can jump to the neighboring roof. It has a hot tub, which is not helping. Could you come upstairs and help us clear the run-up and check the landing first?", "ted"),
      dogLine("Nobody jumps yet.", "Show me both roofs.")
    ],
    arrival: () => [
      line("Ted", "For context, the gap looked much smaller from downstairs.", "ted"),
      line("Marshall", "I could totally make that.", "marshall"),
      line("Lily", "You can totally wait. Start by rolling that market cart out of the run-up.", "lily")
    ],
    steps: [
      { x: ROOFTOP_LAYOUT.interactions.runway, kicker: "The blocked run-up", label: "Roll the market cart aside", objective: "Clear Marshall's run-up", lines: () => [
        line("Narrator", "The cart rattles back beside the service door. The path to the ledge is clear.", "narrator"),
        line("Robin", "Excellent. It is now an unobstructed bad idea.", "robin"),
        line("Ted", "Check the neighboring patio next. Make sure the chairs are out of the landing path.", "ted")
      ] },
      { x: ROOFTOP_LAYOUT.interactions.landing, cameraFocus: 570, kicker: "The opposite rooftop", label: "Check the far landing", objective: "Make sure the patio is clear", lines: () => [
        line("Narrator", "The alley drops away between two separate rooftops. Across the gap, the tiles beside the hot tub are clear.", "narrator"),
        line("Barney", "A rooftop, a crowd, impossible odds. I am naming this The Leap.", "barney"),
        line("Lily", "The landing is clear. Come back from the edge and give us the signal.", "lily"),
        line("Ted", "Good. Nobody steps past this ledge until Marshall starts his run.", "ted")
      ] },
      { x: ROOFTOP_LAYOUT.interactions.signal, cameraFocus: 575, kicker: "The near rooftop ledge", label: "Give Marshall the signal", objective: "Signal that the landing is clear", lines: () => [
        line("Narrator", "The bulbs come on. Marshall runs first and clears the gap. Robin, Barney, Lily and Ted follow one at a time.", "narrator"),
        line("Ted", "Okay. Nobody make this symbolic.", "ted")
      ] }
    ],
    solved: () => [
      line("Marshall", "See? Totally makeable. I knew that the entire time.", "marshall"),
      line("Lily", "Your knees are shaking.", "lily"),
      line("Ted", "We'll stay on this side until Marshall stops pretending. You take the service stairs.", "ted"),
      dogLine("Good plan.", "Stairs work.")
    ],
    marketReturn: (flower) => [
      line("The Florist", `The last ${flower.short} went into the closing bundle. It left about a minute ago.`, "florist"),
      dogLine("One left.", "There's still one left.")
    ]
  }
];

Promise.all(Object.entries(assetSources).map(([key, source]) => loadImage(source).then((image) => { assets[key] = image; })))
  .then(() => {
    drawSelectionPreviews();
    ui.frame.classList.remove("is-loading");
    ui.loading.style.opacity = "0";
    setTimeout(() => {
      ui.loading.hidden = true; ui.title.hidden = false; state = "title";
      setMenuSelection(0);
    }, 550);
  })
  .catch(() => { ui.loading.innerHTML = "<p>The evening could not be opened. Please refresh the page.</p>"; });

document.querySelector("#start-button").addEventListener("click", () => {
  initAudio(); tone(523, 0.08, 0.035);
  transition(() => {
    ui.title.hidden = true; ui.select.hidden = false; state = "select";
    drawSelectionPreviews(); setMenuSelection(0);
  });
});
document.querySelectorAll("[data-dog]").forEach((button, index) => {
  button.addEventListener("click", () => chooseDog(button.dataset.dog));
  button.addEventListener("focus", () => setMenuSelection(index, false));
  button.addEventListener("mouseenter", () => setMenuSelection(index, false));
});
document.querySelectorAll("[data-checkpoint]").forEach((button, index) => {
  button.addEventListener("click", () => jumpToCheckpoint(button.dataset.checkpoint));
  button.addEventListener("focus", () => setMenuSelection(index + 1, false));
  button.addEventListener("mouseenter", () => setMenuSelection(index + 1, false));
});
document.querySelector("#restart-button").addEventListener("click", resetGame);
ui.continueButton.addEventListener("click", performAction);
ui.prompt.addEventListener("click", () => { if (getActiveDoor()) handleUp(); else interact(); });
ui.soundButton.addEventListener("click", toggleSound);

window.addEventListener("keydown", (event) => {
  if (handleMenuKeydown(event)) return;
  const map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  if (map[event.key]) { keys[map[event.key]] = true; event.preventDefault(); }
  if (event.key === "Shift") { keys.sprint = true; event.preventDefault(); }
  if (["ArrowUp", "w", "W"].includes(event.key) && !event.repeat) { event.preventDefault(); handleUp(); }
  if (["e", "E"].includes(event.key) && !event.repeat) { event.preventDefault(); performAction(); }
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
    if (key === "action") performAction();
    else if (key === "up") handleUp();
    else keys[key] = true;
  };
    const release = (event) => { event.preventDefault(); if (["left", "right", "sprint"].includes(key)) keys[key] = false; };
  button.addEventListener("pointerdown", press); button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release); button.addEventListener("pointerleave", release);
});

function performAction() {
  if (state === "dialogue") advanceDialogue();
  else if (state === "playing") interact();
}

function getMenuOptions() {
  if (state === "title") return [document.querySelector("#start-button"), ...document.querySelectorAll("[data-checkpoint]")];
  if (state === "select") return [...document.querySelectorAll("[data-dog]")];
  if (state === "ending") return [document.querySelector("#restart-button")];
  return [];
}

function setMenuSelection(index, focus = true) {
  const options = getMenuOptions().filter(Boolean);
  if (!options.length) return;
  menuIndex = (index + options.length) % options.length;
  options.forEach((button, optionIndex) => {
    const selected = optionIndex === menuIndex;
    button.classList[selected ? "add" : "remove"]("is-menu-selected");
    button.tabIndex = selected ? 0 : -1;
  });
  if (focus) options[menuIndex].focus?.({ preventScroll: true });
}

function handleMenuKeydown(event) {
  if (!["title", "select", "ending"].includes(state)) return false;
  if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
    event.preventDefault(); setMenuSelection(menuIndex - 1); return true;
  }
  if (["ArrowRight", "ArrowDown"].includes(event.key)) {
    event.preventDefault(); setMenuSelection(menuIndex + 1); return true;
  }
  if (["Enter", "e", "E", " "].includes(event.key) && !event.repeat) {
    event.preventDefault();
    const options = getMenuOptions().filter(Boolean);
    options[menuIndex]?.click();
    return true;
  }
  return false;
}

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
      line("Narrator", "6:42 p.m. The rain has stopped. The flower market closes at sunset.", "narrator"),
      dogLine("One flower. Easy.", "One flower. Carefully."),
      line("Narrator", "The market is four streets away. The walk begins.", "narrator")
    ], resumePlay);
  });
}

function clearStoryProgress() {
  flowers.forEach((flower) => { flower.active = true; flower.sale = null; });
  memorySpots.forEach((spot) => { spot.seen = false; });
  choiceMemories.length = 0; particles.length = 0;
  Object.assign(scene, { resolved: 0, darkness: 0, aquarium: false, pool: false, cats: false, bell: false, cinema: false, leap: false });
  Object.assign(journey, { leftBench: false, routeBeat: false, entrance: false, market: false, returning: false, reunion: false });
  Object.assign(travellerEncounter, {
    stage: "waiting", hasTag: false, departureX: travellerEncounter.x,
    departureTargetX: 1180, motionStartedAt: 0, motionDuration: 2500,
    farewellDuration: 620, walkFrame: 0, lastStep: -1, cameraX: 0
  });
  currentScene = "bench";
  Object.assign(player, { x: 145, y: SCENES.bench.groundY, direction: "right", moving: false, sprinting: false, walkFrame: 0, pose: "idle" });
  Object.assign(keys, { left: false, right: false, sprint: false });
  Object.assign(camera, { x: 0, target: 0 });
  currentFlower = null; endingFlower = null; activeQuest = null; questAction = null;
  nearbyFlower = null; nearbyMemory = null; nearbyQuestStep = null; nearbyReunion = false;
  nearbyTraveller = false; nearbyTravelTag = false; dialogue = null;
  ui.dialogue.hidden = true; ui.prompt.hidden = true; ui.tutorial.hidden = true;
}

function applyCheckpointProgress(resolvedCount) {
  scene.resolved = resolvedCount;
  scene.darkness = resolvedCount * 0.033;
  questDefinitions.forEach((quest, index) => {
    if (Object.prototype.hasOwnProperty.call(scene, quest.id)) scene[quest.id] = index < resolvedCount;
  });
  flowers.forEach((flower, index) => {
    const resolvedQuest = questDefinitions[index];
    if (index < resolvedCount && resolvedQuest) {
      flower.active = false;
      flower.sale = { ...resolvedQuest.sellout, order: index };
    } else {
      flower.active = true;
      flower.sale = null;
    }
  });
}

function jumpToCheckpoint(checkpointId) {
  clearStoryProgress();
  player.type = "maltipoo"; player.name = "Momo";
  Object.assign(journey, { leftBench: true, routeBeat: true, entrance: true, market: true, returning: false, reunion: false });
  travellerEncounter.stage = "complete";

  let checkpointLabel = "FLOWER MARKET";
  let spawnX = 220;
  currentScene = "market";

  const questIndex = questDefinitions.findIndex((quest) => quest.id === checkpointId);
  if (questIndex >= 0) {
    const quest = questDefinitions[questIndex];
    applyCheckpointProgress(questIndex);
    activeQuest = {
      ...quest,
      flower: flowers[questIndex],
      stage: "solve",
      step: 0,
      visualStep: 0,
      visitorPhase: "away"
    };
    currentScene = quest.interior;
    spawnX = quest.id === "leap"
      ? SCENES[currentScene].minX + 20
      : Math.max(SCENES[currentScene].minX + 45, quest.steps[0].x - 55);
    checkpointLabel = quest.place.toUpperCase();
  } else if (checkpointId === "final") {
    applyCheckpointProgress(questDefinitions.length);
    spawnX = 935;
    checkpointLabel = "THE FINAL FLOWER";
  } else if (checkpointId === "ending") {
    applyCheckpointProgress(questDefinitions.length);
    endingFlower = flowers.at(-1);
    endingFlower.active = false;
    journey.returning = true;
    scene.darkness = 0.12;
    currentScene = "bench";
    spawnX = 735;
    checkpointLabel = "THE FAMILIAR BENCH";
  } else {
    applyCheckpointProgress(0);
  }

  Object.assign(player, {
    x: clamp(spawnX, SCENES[currentScene].minX, SCENES[currentScene].maxX),
    y: SCENES[currentScene].groundY,
    direction: "right", moving: false, sprinting: false, walkFrame: 0, pose: "idle"
  });
  Object.assign(keys, { left: false, right: false, sprint: false });
  camera.x = clamp(player.x - 380, 0, Math.max(0, SCENES[currentScene].width - VIEW_WIDTH));
  camera.target = camera.x;

  ui.title.hidden = true; ui.select.hidden = true; ui.ending.hidden = true;
  ui.hud.hidden = false; ui.location.hidden = true;
  ui.touch.hidden = false; ui.touch.classList.add("is-active");
  ui.frame.classList.remove("is-cinematic");
  ui.chapter.textContent = `CHECKPOINT - ${checkpointLabel}`;
  ui.status.textContent = checkpointId === "ending"
    ? "Momo is carrying the final flower home"
    : `Testing ${checkpointLabel.toLowerCase()}`;
  state = "playing";
  updateHUD();
  initAudio(); tone(659, 0.08, 0.025);
}

function resetGame() {
  clearStoryProgress();
  ui.ending.hidden = true; ui.hud.hidden = true; ui.location.hidden = true;
  ui.touch.hidden = true; ui.touch.classList.remove("is-active");
  ui.frame.classList.remove("is-cinematic");
  updateHUD();
  transition(() => {
    ui.select.hidden = false; state = "select"; ui.chapter.textContent = "PROLOGUE · 6:42 PM";
    drawSelectionPreviews(); setMenuSelection(0);
  });
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
      line("Narrator", "A bus cuts through the last puddle. Four paws stop just outside the splash.", "narrator"),
      dogLine("Almost.", "That was close.")
    ], resumePlay);
    return;
  }
  if (currentScene === "dateNight" && player.x >= SCENES.dateNight.maxX - 2 && keys.right) {
    switchScene("catStories", 125, () => {
      ui.status.textContent = "The covered arcade is still awake";
      showLocation("THE EVENING ROUTE", "Cafe, Stories & Studio", "Cats, stories and one late revision");
      updateHUD(); resumePlay();
    }, "right");
    return;
  }
  if (currentScene === "catStories" && player.x <= SCENES.catStories.minX + 2 && keys.left) {
    switchScene("dateNight", SCENES.dateNight.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
    return;
  }
  if (currentScene === "catStories" && player.x >= SCENES.catStories.maxX - 2 && keys.right) {
    switchScene("cinemaStreet", 125, () => {
      ui.status.textContent = "The little cinema is between shows";
      showLocation("THE EVENING ROUTE", "The Little Cinema", "One small ship waits behind the glass");
      updateHUD(); resumePlay();
    }, "right");
    return;
  }
  if (currentScene === "cinemaStreet" && player.x <= SCENES.cinemaStreet.minX + 2 && keys.left) {
    switchScene("catStories", SCENES.catStories.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
    return;
  }
  if (currentScene === "cinemaStreet" && player.x >= SCENES.cinemaStreet.maxX - 2 && keys.right) {
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
    switchScene("cinemaStreet", SCENES.cinemaStreet.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
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
      ui.chapter.textContent = "CHAPTER 2 · SEVEN BLOOMS";
      ui.status.textContent = `${player.name} entered the market`;
      showLocation("INSIDE THE OLD ARCADE", "The Flower Market", "Seven blooms wait beneath the lights");
      updateHUD();
      if (activeQuest && activeQuest.stage === "return") {
        completeQuestAtMarket();
      } else if (firstEntry) {
        showDialogue([
          line("The Florist", `Evening, ${player.name}. Seven flowers left. Please choose with your eyes before your paws.`, "florist"),
          dogLine("One.", "Just one."),
          line("The Florist", "Good. A simple errand.", "florist")
        ], resumePlay);
      } else resumePlay();
    }, "right");
  } else if (!door.kind) {
    switchScene(door.target, door.spawnX, () => {
      if (activeQuest && door.target === activeQuest.interior && activeQuest.stage === "travel") {
        activeQuest.stage = "solve";
        ui.chapter.textContent = `SIDE QUEST - ${activeQuest.title}`;
        ui.status.textContent = `${player.name} reached the ${activeQuest.place}`;
        showLocation("A QUICK DETOUR", activeQuest.place.toUpperCase(), "Follow the clues from left to right");
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
  if (nearbyTravelTag) { collectTravelTag(); return; }
  if (nearbyTraveller) { interactTraveller(); return; }
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

function interactTraveller() {
  if (travellerEncounter.stage === "waiting") {
    tone(610, 0.08, 0.025);
    showDialogue([
      line("Narrator", "A traveller checks the same three pockets twice. A compact suitcase stands at her heel.", "narrator"),
      line("The Traveller", "Passport, charger, three snacks—and no luggage tag. Did a blue one go past?", "traveller"),
      dogLine("Fast. Toward the bus stop.", "It went toward the bus stop.")
    ], () => {
      travellerEncounter.stage = "searching";
      nearbyTraveller = false;
      ui.status.textContent = "A blue luggage tag skittered down the road";
      updateHUD(); resumePlay();
    });
    return;
  }
  if (travellerEncounter.stage !== "returning") return;
  travellerEncounter.stage = "receiving";
  tone(784, 0.11, 0.035);
  showDialogue([
    line("The Traveller", "There it is. The one item not on my checklist.", "traveller"),
    line("Narrator", "The blue tag clicks back onto the suitcase.", "narrator"),
    line("The Traveller", "Thank you. Next trip: two tags. Possibly three.", "traveller"),
    dogLine("Good plan.", "Two should be enough.")
  ], beginTravellerDeparture);
}

function collectTravelTag() {
  if (travellerEncounter.stage !== "searching") return;
  tone(880, 0.1, 0.03);
  showDialogue([
    line("Narrator", "The blue tag is wedged beneath a bus-stop timetable.", "narrator"),
    dogLine("Blue. Found.", "Found the blue one.")
  ], () => {
    travellerEncounter.stage = "returning";
    travellerEncounter.hasTag = true;
    nearbyTravelTag = false;
    ui.status.textContent = "Bring the blue tag back to the traveller";
    updateHUD(); resumePlay();
  });
}

function beginTravellerDeparture() {
  travellerEncounter.stage = "departing";
  travellerEncounter.hasTag = false;
  travellerEncounter.departureX = travellerEncounter.x;
  travellerEncounter.cameraX = camera.x;
  travellerEncounter.departureTargetX = camera.x + VIEW_WIDTH + 135;
  travellerEncounter.motionStartedAt = performance.now();
  travellerEncounter.motionDuration = clamp(((travellerEncounter.departureTargetX - travellerEncounter.x) / 205) * 1000, 1900, 3600);
  travellerEncounter.walkFrame = 0;
  travellerEncounter.lastStep = -1;
  Object.assign(keys, { left: false, right: false, sprint: false });
  player.direction = "right";
  player.pose = "idle";
  state = "travellerDeparture";
  ui.prompt.hidden = true;
  ui.touch.classList.remove("is-active");
  ui.frame.classList.add("is-cinematic");
  ui.status.textContent = "The traveller checks the road ahead";
  updateHUD();
}

function startObstacle(flower) {
  const quest = questDefinitions[scene.resolved];
  const visitorStartX = camera.x - 105;
  const visitorTargetX = clamp(player.x - 104, camera.x + 130, camera.x + VIEW_WIDTH - 145);
  const travelDistance = Math.abs(visitorTargetX - visitorStartX);
  activeQuest = {
    ...quest,
    flower,
    stage: "travel",
    step: 0,
    visualStep: 0,
    visitorPhase: "arriving",
    visitorDirection: "right",
    visitorStartX,
    visitorTargetX,
    visitorX: visitorStartX,
    visitorCameraX: camera.x,
    visitorMotionStartedAt: performance.now(),
    visitorMotionDuration: clamp((travelDistance / 230) * 1000, 1200, 3600),
    visitorWalkFrame: 0,
    visitorLastStep: -1
  };
  currentFlower = null;
  nearbyFlower = null;
  Object.assign(keys, { left: false, right: false, sprint: false });
  player.direction = "left";
  player.pose = "idle";
  state = "visitorArrival";
  ui.prompt.hidden = true;
  ui.touch.classList.remove("is-active");
  ui.frame.classList.add("is-cinematic");
  ui.status.textContent = "Footsteps approach from the left";
  updateHUD();
}

function finishVisitorArrival() {
  if (!activeQuest || activeQuest.visitorPhase !== "arriving") return;
  activeQuest.visitorX = activeQuest.visitorTargetX;
  activeQuest.visitorPhase = "speaking";
  activeQuest.visitorDirection = "right";
  showDialogue(activeQuest.trigger(activeQuest.flower), beginVisitorDeparture);
}

function beginVisitorDeparture() {
  if (!activeQuest) { resumePlay(); return; }
  activeQuest.visitorPhase = "departing";
  activeQuest.visitorDirection = "left";
  activeQuest.visitorStartX = activeQuest.visitorX;
  activeQuest.visitorTargetX = activeQuest.visitorCameraX - 110;
  activeQuest.visitorMotionStartedAt = performance.now();
  activeQuest.visitorMotionDuration = clamp((Math.abs(activeQuest.visitorTargetX - activeQuest.visitorStartX) / 250) * 1000, 1050, 3400);
  activeQuest.visitorWalkFrame = 0;
  activeQuest.visitorLastStep = -1;
  player.pose = "idle";
  state = "visitorDeparture";
}

function finishVisitorDeparture() {
  if (!activeQuest || activeQuest.visitorPhase !== "departing") return;
  activeQuest.visitorX = activeQuest.visitorTargetX;
  activeQuest.visitorPhase = "away";
  ui.status.textContent = activeQuest.travelObjective;
  resumePlay();
}

function interactQuestStep() {
  if (!activeQuest || activeQuest.stage !== "solve") return;
  const step = activeQuest.steps[activeQuest.step];
  if (!step) return;
  beginQuestAction(step);
}

const questActionStyles = {
  aquarium: { color: "#7fd3e7", durations: [1450, 1500, 1900], poses: ["emotional", "emotional", "idle"], directions: ["right", "right", "right"] },
  pool: { color: "#e0b268", durations: [1300, 1650, 2050], poses: ["emotional", "emotional", "walk"], directions: ["left", "right", "right"] },
  cats: { color: "#db9b75", durations: [1350, 1750, 1500], poses: ["emotional", "walk", "emotional"], directions: ["left", "right", "right"] },
  bell: { color: "#b79ac2", durations: [1300, 1700, 2100], poses: ["sit", "emotional", "sit"], directions: ["right", "right", "left"] },
  cinema: { color: "#c6a86b", durations: [1800, 1950, 2350], poses: ["emotional", "emotional", "sit"], directions: ["right", "right", "right"] },
  leap: { color: "#e5bb68", durations: [1750, 1850, 2600], poses: ["emotional", "emotional", "idle"], directions: ["right", "right", "left"] }
};

function beginQuestAction(step) {
  const style = questActionStyles[activeQuest.id];
  const stepIndex = activeQuest.step;
  const cameraFocus = Number.isFinite(step.cameraFocus) ? step.cameraFocus : step.x;
  Object.assign(keys, { left: false, right: false, sprint: false });
  player.moving = false;
  player.sprinting = false;
  player.pose = style.poses[stepIndex] || "emotional";
  player.direction = style.directions[stepIndex] || player.direction;
  questAction = {
    questId: activeQuest.id,
    stepIndex,
    startedAt: performance.now(),
    duration: style.durations[stepIndex] || 1500,
    progress: 0,
    midpointPlayed: false,
    color: style.color,
    cameraX: clamp(cameraFocus - VIEW_WIDTH * 0.5, 0, Math.max(0, SCENES[currentScene].width - VIEW_WIDTH))
  };
  state = "questAction";
  ui.prompt.hidden = true;
  ui.touch.classList.remove("is-active");
  ui.frame.classList.add("is-cinematic");
  ui.status.textContent = step.label;
  tone(392, 0.08, 0.025);
}

function updateQuestAction(time) {
  if (state !== "questAction" || !questAction || !activeQuest) return;
  questAction.progress = clamp((time - questAction.startedAt) / questAction.duration, 0, 1);
  if (player.pose === "walk") player.walkFrame = questAction.progress * 8;
  if (!questAction.midpointPlayed && questAction.progress >= 0.5) {
    questAction.midpointPlayed = true;
    tone(activeQuest.id === "aquarium" ? 660 : 523, 0.11, 0.025);
    spawnQuestActionBurst(player.x, player.y - 42, questAction.color, 9);
  }
  if (questAction.progress < 1) return;
  finishQuestAction();
}

function finishQuestAction() {
  if (!questAction || !activeQuest) return;
  const completedStep = questAction.stepIndex;
  const step = activeQuest.steps[completedStep];
  const isLastStep = completedStep === activeQuest.steps.length - 1;
  const lines = [...step.lines(), ...(isLastStep ? activeQuest.solved() : [])];
  activeQuest.visualStep = Math.max(activeQuest.visualStep, completedStep + 1);
  spawnQuestActionBurst(step.x, SCENES[currentScene].groundY - 56, questAction.color, isLastStep ? 18 : 12);
  questAction = null;
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

function spawnQuestActionBurst(x, y, color, count) {
  const moteCount = Math.min(7, Math.max(4, Math.round(count / 3)));
  for (let index = 0; index < moteCount; index += 1) {
    const spread = index - (moteCount - 1) / 2;
    particles.push({
      x: x + spread * 4, y: y + Math.abs(spread) * 2,
      vx: spread * 3,
      vy: -10 - (index % 3) * 4,
      life: 0.5 + (index % 3) * 0.1,
      rotation: 0,
      spin: 0,
      width: index % 3 === 0 ? 2 : 1,
      height: index % 3 === 0 ? 2 : 1,
      color
    });
  }
}

function completeQuestAtMarket() {
  const quest = activeQuest;
  if (!quest || quest.stage !== "return") { resumePlay(); return; }
  currentFlower = quest.flower;
  showDialogue(quest.marketReturn(quest.flower), () => {
    activeQuest = null;
    resolveEncounter(quest);
  });
}

function resolveEncounter(quest) {
  const soldFlower = currentFlower;
  soldFlower.active = false;
  soldFlower.sale = { ...quest.sellout, order: scene.resolved };
  if (Object.prototype.hasOwnProperty.call(scene, quest.id)) scene[quest.id] = true;
  scene.resolved += 1; scene.darkness = scene.resolved * 0.033;
  spawnSaleSlips(player.x, player.y - 46, soldFlower.sale.accent, 12);
  currentFlower = null; updateHUD();
  ui.status.textContent = scene.resolved === questDefinitions.length ? "Only one bloom remains" : `${soldFlower.short} sold out`;
  resumePlay();
}

function finalEncounter(flower) {
  showDialogue([
    line("Narrator", `Only the ${flower.name} remains. This time, nobody runs into the aisle.`, "narrator"),
    dogLine("Mine?", "May I?"),
    line("The Florist", "After all that? Definitely yours.", "florist"),
    line("Narrator", "The florist wraps the stem twice. One careful bite tests the paper sleeve.", "narrator")
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
      line("Narrator", "The paper sleeve rustles with every step. The flower survives.", "narrator"),
      line("Narrator", "At the familiar bench, someone lifts a hand.", "narrator")
    ], resumePlay);
  }, "right");
}

function meetAtBench() {
  if (journey.reunion) return;
  journey.reunion = true; player.direction = "right";
  showDialogue([
    line("Narrator", "The other dog has already claimed the warmest place beside the bench.", "narrator"),
    line("Her", "You took your time.", "her"),
    line(player.name, "Mmph.", "player"),
    line("Narrator", "The flower lands on the bench. One petal is bent; the paper is damp.", "narrator"),
    line("Her", "You carried that all the way?", "her"),
    line("Narrator", "A wagging tail gives the answer.", "narrator"),
    line("Her", "Okay. Sit. You can tell me the long version.", "her"),
    line("Narrator", "They stay until the streetlamp clicks off.", "narrator")
  ], () => showEnding(endingFlower));
}

function showEnding(flower) {
  state = "ending"; player.pose = "sit";
  ui.dialogue.hidden = true; ui.hud.hidden = true; ui.touch.hidden = true;
  ui.endingFlower.textContent = flower.symbol; ui.endingFlower.style.color = flower.color;
  ui.endingTitle.textContent = `${player.name} brought the ${flower.name} home.`;
  ui.endingCopy.textContent = "The flower arrived a little rumpled and very carefully carried.";
  ui.endingMemory.textContent = "A familiar bench, both dogs, and the long version";
  ui.ending.hidden = false; ui.chapter.textContent = "EPILOGUE · BLUE HOUR"; scene.darkness = 0.19;
  setMenuSelection(0);
  tone(523, 0.4, 0.035); setTimeout(() => tone(659, 0.45, 0.028), 240); setTimeout(() => tone(784, 0.7, 0.02), 480);
}

function line(speaker, text, portrait, choices = null) { return { speaker, text, portrait, choices }; }
function dogLine(maltipooText, malteseText = maltipooText) {
  return line(player.name, player.type === "maltese" ? malteseText : maltipooText, "player");
}
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
    if (activeQuest.stage === "travel") ui.quest.textContent = activeQuest.travelObjective;
    else if (activeQuest.stage === "solve") ui.quest.textContent = activeQuest.steps[activeQuest.step]?.objective || "Finish the errand";
    else ui.quest.textContent = "Return to the flower market";
    ui.count.textContent = `Obstacle ${scene.resolved + 1} of ${questDefinitions.length}`;
    appendPips(questDefinitions.length, questDefinitions.length - scene.resolved); return;
  }
  if (journey.returning) {
    ui.quest.textContent = "Bring the last flower to the familiar bench";
    ui.count.textContent = "Almost home";
    appendPips(1, 1); return;
  }
  if (["searching", "returning", "receiving", "departing"].includes(travellerEncounter.stage) && currentScene === travellerEncounter.scene) {
    if (travellerEncounter.stage === "searching") ui.quest.textContent = "Find the traveller's blue luggage tag farther along the road";
    else if (["returning", "receiving"].includes(travellerEncounter.stage)) ui.quest.textContent = "Return the blue luggage tag to the traveller";
    else ui.quest.textContent = "See the traveller safely on her way";
    ui.count.textContent = "A small detour";
    appendPips(2, travellerEncounter.stage === "searching" ? 2 : 1); return;
  }
  if (!journey.market || currentScene !== "market") {
    const found = memorySpots.filter((spot) => spot.seen).length;
    ui.quest.textContent = currentScene === "entrance" ? "Stand in the doorway and press Up" : "Follow the evening road to the market";
    ui.count.textContent = found ? `${found} small ${found === 1 ? "moment" : "moments"} noticed` : "The market is ahead";
    const route = ["bench", "aquarium", "dateNight", "catStories", "cinemaStreet", "entrance"];
    const routeProgress = Math.max(0, route.indexOf(currentScene));
    appendPips(route.length, route.length - routeProgress); return;
  }
  const count = flowers.filter((flower) => flower.active).length;
  ui.count.textContent = count === 1 ? "The last bloom remains" : `${count} blooms remain`;
  ui.quest.textContent = count === 1 ? "Choose the last flower" : "Choose one flower to take home";
  appendPips(flowers.length, count);
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
    nearbyTraveller = false; nearbyTravelTag = false;
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
    if (!journey.returning && !activeQuest && currentScene === travellerEncounter.scene) {
      if (["waiting", "returning"].includes(travellerEncounter.stage) && Math.abs(player.x - travellerEncounter.x) < 68) {
        nearbyTraveller = true;
      }
      if (travellerEncounter.stage === "searching" && Math.abs(player.x - travellerEncounter.tagX) < 58) {
        nearbyTravelTag = true;
      }
    }
    if (activeQuest && activeQuest.stage === "solve" && currentScene === activeQuest.interior) {
      const step = activeQuest.steps[activeQuest.step];
      if (step && Math.abs(player.x - step.x) < 70) nearbyQuestStep = step;
    }
    if (journey.returning && currentScene === "bench" && Math.abs(player.x - 820) < 88) nearbyReunion = true;

    const door = getActiveDoor();
    ui.prompt.hidden = !door && !nearbyQuestStep && !nearbyReunion && !nearbyTravelTag && !nearbyTraveller && !nearbyMemory && !nearbyFlower;
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
    } else if (nearbyTravelTag) {
      ui.promptKey.textContent = "E";
      ui.promptKicker.textContent = "Something caught at the kerb";
      ui.promptLabel.textContent = "Pick up the blue luggage tag";
    } else if (nearbyTraveller) {
      ui.promptKey.textContent = "E";
      ui.promptKicker.textContent = "A traveller between departures";
      ui.promptLabel.textContent = travellerEncounter.stage === "returning" ? "Return the luggage tag" : "Speak with the traveller";
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

  if (["visitorArrival", "visitorDeparture"].includes(state)) updateVisitorSequence(time);
  if (state === "travellerDeparture") updateTravellerSequence(time);
  if (state === "questAction") updateQuestAction(time);

  camera.target = clamp(player.x - 380, 0, Math.max(0, SCENES[currentScene].width - VIEW_WIDTH));
  if (["title", "select", "loading"].includes(state)) camera.target = 0;
  if (activeQuest && currentScene === "market" && ["arriving", "speaking", "departing"].includes(activeQuest.visitorPhase)) {
    camera.target = activeQuest.visitorCameraX;
  }
  if (questAction) camera.target = questAction.cameraX;
  if (state === "travellerDeparture") camera.target = travellerEncounter.cameraX;
  camera.x += (camera.target - camera.x) * Math.min(1, delta * 4.5);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.x += p.vx * delta; p.y += p.vy * delta; p.life -= delta; p.rotation += delta * p.spin;
    if (p.life <= 0) particles.splice(i, 1);
  }
  const ambient = ambientProfiles[currentScene] || ambientProfiles.bench;
  if (Math.random() < delta * ambient.rate) {
    particles.push({
      x: camera.x + Math.random() * 960, y: 90 + Math.random() * 310,
      vx: ambient.vx[0] + Math.random() * (ambient.vx[1] - ambient.vx[0]),
      vy: ambient.vy[0] + Math.random() * (ambient.vy[1] - ambient.vy[0]), life: 8,
      rotation: Math.random() * 6, spin: -1 + Math.random() * 2,
      width: ambient.width, height: ambient.height,
      color: ambient.palette[Math.floor(Math.random() * ambient.palette.length)]
    });
  }
}

function updateTravellerSequence(time) {
  if (travellerEncounter.stage !== "departing") return;
  const elapsed = Math.max(0, time - travellerEncounter.motionStartedAt);
  if (elapsed < travellerEncounter.farewellDuration) return;
  const walkingElapsed = elapsed - travellerEncounter.farewellDuration;
  const progress = clamp(walkingElapsed / travellerEncounter.motionDuration, 0, 1);
  travellerEncounter.departureX = travellerEncounter.x + (travellerEncounter.departureTargetX - travellerEncounter.x) * progress;
  travellerEncounter.walkFrame = walkingElapsed / 105;
  const step = Math.floor(walkingElapsed / 210);
  if (step !== travellerEncounter.lastStep) {
    travellerEncounter.lastStep = step;
    tone(112, 0.035, 0.004);
  }
  if (progress < 1) return;
  travellerEncounter.stage = "complete";
  ui.status.textContent = "The suitcase wheels fade into the evening";
  updateHUD(); resumePlay();
}

function updateVisitorSequence(time) {
  if (!activeQuest || !["arriving", "departing"].includes(activeQuest.visitorPhase)) return;
  const elapsed = Math.max(0, time - activeQuest.visitorMotionStartedAt);
  const progress = clamp(elapsed / activeQuest.visitorMotionDuration, 0, 1);
  const eased = progress * progress * (3 - 2 * progress);
  activeQuest.visitorX = activeQuest.visitorStartX + (activeQuest.visitorTargetX - activeQuest.visitorStartX) * eased;
  activeQuest.visitorWalkFrame = Math.floor(elapsed / 135) % 4;

  const step = Math.floor(elapsed / 270);
  if (step !== activeQuest.visitorLastStep) {
    activeQuest.visitorLastStep = step;
    tone(116, 0.035, 0.005);
  }

  if (progress < 1) return;
  if (activeQuest.visitorPhase === "arriving") finishVisitorArrival();
  else finishVisitorDeparture();
}

function draw(time) {
  ctx.clearRect(0, 0, 960, 540);
  ctx.save(); ctx.translate(-Math.floor(camera.x), 0);
  drawSceneBackground(); drawQuestSetPieces(time); drawSoldOutDisplays(time); drawDoorHints(time); drawMemoryProps(time); drawTravellerHints(time); drawQuestHint(time); drawFlowerMarkers(time); drawNPCs(time);
  if (!['title', 'select', 'loading'].includes(state)) {
    const actionArc = questAction ? Math.sin(questAction.progress * Math.PI) : 0;
    const actionShift = questAction && !["sit", "idle"].includes(player.pose) ? actionArc * 7 : 0;
    const actionLift = questAction && player.pose !== "sit" ? actionArc * 3 : 0;
    const playerScale = SCENES[currentScene].playerScale || 1;
    drawDogSprite(ctx, player.x + actionShift, player.y - actionLift, player.type, player.pose, player.direction, player.walkFrame, playerScale);
    if (journey.returning && currentScene === "bench" && endingFlower) drawCarriedFlower(player.x, player.y, player.direction, endingFlower, time);
  }
  drawWorldParticles(); ctx.restore();
  drawLighting(time);
}

function drawSceneBackground() {
  const config = SCENES[currentScene];
  const image = assets[config.asset];
  if (!image) { ctx.fillStyle = "#251d36"; ctx.fillRect(0, 0, config.width, 540); return; }
  if (config.backgroundMode === "width") {
    drawImageWidthAligned(image, config.width, 540, config.backgroundY || 0);
    return;
  }
  drawImageCover(image, config.width, 540);
}

function drawImageWidthAligned(image, targetWidth, targetHeight, y) {
  const drawHeight = image.height * (targetWidth / image.width);
  ctx.fillStyle = "#06183d";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, y, targetWidth, drawHeight);
}

function drawImageCover(image, targetWidth, targetHeight) {
  const sourceRatio = image.width / image.height;
  const targetRatio = targetWidth / targetHeight;
  let sourceX = 0; let sourceY = 0; let sourceWidth = image.width; let sourceHeight = image.height;
  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
}

function questVisualProgress(stepIndex) {
  if (!activeQuest) return 0;
  if ((activeQuest.visualStep || 0) > stepIndex) return 1;
  if (questAction?.questId === activeQuest.id && questAction.stepIndex === stepIndex) {
    const progress = questAction.progress;
    return progress * progress * (3 - 2 * progress);
  }
  return 0;
}

function drawQuestSetPieces(time) {
  if (!activeQuest || currentScene !== activeQuest.interior) return;
  if (activeQuest.id === "aquarium") drawAquariumQuestVisuals(time);
  else if (activeQuest.id === "pool") drawPoolQuestVisuals(time);
  else if (activeQuest.id === "cats") drawCatCafeQuestVisuals(time);
  else if (activeQuest.id === "bell") drawBellHomeQuestVisuals(time);
  else if (activeQuest.id === "cinema") drawCinemaQuestVisuals(time);
  else if (activeQuest.id === "leap") drawRooftopQuestVisuals(time);
}

const questEffectRects = {
  shark: { x: 44, y: 180, width: 405, height: 175 },
  fish: { x: 503, y: 192, width: 335, height: 188 },
  bowls: { x: 908, y: 232, width: 349, height: 152 },
  bell: { x: 1367, y: 212, width: 183, height: 168 },
  guard: { x: 53, y: 555, width: 431, height: 184 },
  ball: { x: 613, y: 615, width: 117, height: 120 },
  mouse: { x: 893, y: 615, width: 267, height: 129 },
  cushions: { x: 1287, y: 568, width: 309, height: 210 }
};

const aquariumTankWindows = {
  reef: { x: 170, y: 190, width: 170, height: 125 },
  coral: { x: 395, y: 195, width: 325, height: 132 },
  deep: { x: 772, y: 155, width: 300, height: 170 }
};

function drawQuestEffectSprite(kind, x, y, height, options = {}) {
  const atlas = assets.questEffects;
  const rect = questEffectRects[kind];
  if (!atlas || !rect) return;
  const drawWidth = height * (rect.width / rect.height) * (options.stretchX || 1);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.rotate(options.rotation || 0);
  ctx.scale(options.mirror ? -1 : 1, options.scaleY || 1);
  if (options.filter) ctx.filter = options.filter;
  ctx.drawImage(atlas, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -height, drawWidth, height);
  ctx.restore();
}

function withWorldClip(rect, callback) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  callback();
  ctx.restore();
}

function drawPixelContactShadow(x, y, width, alpha = 0.24) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#17101f";
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), Math.round(width), 2);
  ctx.fillRect(Math.round(x - width * 0.34), Math.round(y - 1), Math.round(width * 0.68), 1);
  ctx.restore();
}

function drawPixelGlint(x, y, alpha = 1, color = "#f2d58c") {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - 1), Math.round(y - 5), 2, 4);
  ctx.fillRect(Math.round(x - 1), Math.round(y + 2), 2, 4);
  ctx.fillRect(Math.round(x - 5), Math.round(y - 1), 4, 2);
  ctx.fillRect(Math.round(x + 2), Math.round(y - 1), 4, 2);
  ctx.fillStyle = "#fff0bd";
  ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 2, 2);
  ctx.restore();
}

function drawAquariumQuestVisuals(time) {
  const fishProgress = questVisualProgress(0);
  const bubbleProgress = questVisualProgress(1);
  const sharkProgress = questVisualProgress(2);

  if (fishProgress > 0) {
    withWorldClip(aquariumTankWindows.reef, () => {
      const x = fishProgress < 1 ? 208 + fishProgress * 49 : 257 + Math.sin(time / 760) * 6;
      const y = 287 + Math.sin(time / 360) * 2;
      drawQuestEffectSprite("fish", x, y, 42, {
        alpha: Math.min(0.76, fishProgress * 1.25),
        filter: "saturate(.78) brightness(.82) contrast(1.04)"
      });
    });
  }

  if (bubbleProgress > 0) {
    withWorldClip(aquariumTankWindows.coral, () => drawPixelBubbleTrail(time, bubbleProgress));
  }

  if (sharkProgress > 0) {
    const revealing = sharkProgress < 1;
    const x = revealing ? 810 + sharkProgress * 142 : 952 + Math.sin(time / 1700) * 9;
    const y = revealing ? 284 - Math.sin(sharkProgress * Math.PI) * 4 : 284 + Math.sin(time / 900) * 2;
    withWorldClip(aquariumTankWindows.deep, () => {
      drawQuestEffectSprite("shark", x, y, 58, {
        alpha: revealing ? Math.min(0.82, sharkProgress * 1.4) : 0.72,
        stretchX: 1 + Math.sin(time / 260) * 0.012,
        filter: "saturate(.58) brightness(.56) contrast(1.08) hue-rotate(4deg)"
      });
    });
  }
}

function drawPixelBubbleTrail(time, progress) {
  const bubbles = [
    { x: 574, offset: 4, drift: 5, size: 2 },
    { x: 594, offset: 31, drift: -7, size: 3 },
    { x: 621, offset: 61, drift: 6, size: 2 },
    { x: 605, offset: 88, drift: -4, size: 1 },
    { x: 642, offset: 117, drift: 7, size: 3 },
    { x: 558, offset: 143, drift: -5, size: 2 },
    { x: 628, offset: 171, drift: 4, size: 1 }
  ];
  ctx.save();
  bubbles.forEach(({ x: originX, offset, drift, size }, index) => {
    const travel = (time / 27 + offset) % 178;
    const reveal = clamp(progress * 1.75 - index * 0.08, 0, 1);
    const x = originX + Math.sin(time / (290 + index * 37) + index * 1.7) * drift;
    const y = 329 - travel;
    ctx.globalAlpha = reveal * (0.24 + (index % 3) * 0.06);
    ctx.fillStyle = index % 2 === 0 ? "#7da9bc" : "#9bc1ce";
    if (size === 3) {
      ctx.fillRect(Math.round(x), Math.round(y), 3, 1);
      ctx.fillRect(Math.round(x), Math.round(y + 3), 3, 1);
      ctx.fillRect(Math.round(x - 1), Math.round(y + 1), 1, 2);
      ctx.fillRect(Math.round(x + 3), Math.round(y + 1), 1, 2);
    } else {
      ctx.fillRect(Math.round(x), Math.round(y), size, size);
      if (size === 2) {
        ctx.fillStyle = "#c0dbe1";
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
  });
  ctx.restore();
}

function drawPoolQuestVisuals(time) {
  const trayProgress = questVisualProgress(0);
  const searchProgress = questVisualProgress(1);
  const returnProgress = questVisualProgress(2);
  const ball = POOL_LAYOUT.missingBall;

  // The nearly complete rack stays visible throughout the scene. Its open
  // centre makes the missing ball readable before a single line of dialogue.
  withWorldClip(POOL_LAYOUT.table.surface, () => {
    const rackedBalls = [
      [850, 360, "#a24443"],
      [862, 354, "#315b87"], [862, 366, "#d29b37"],
      [874, 348, "#76518e"], [874, 372, "#ba6941"],
      [886, 354, "#d4c8aa"], [886, 366, "#5e7b43"]
    ];
    rackedBalls.forEach(([x, y, color], index) => drawPoolBall(x, y, color, time + index * 140));
    if (returnProgress >= 1) drawPoolBall(ball.rackX, ball.rackY, "#131720", time, true);
  });

  if (trayProgress > 0) drawPoolSearchTrail(trayProgress);

  const searchingNow = questAction?.questId === "pool" && questAction.stepIndex === 1;
  const returningNow = questAction?.questId === "pool" && questAction.stepIndex === 2;
  if (returnProgress < 1) {
    let x = ball.hidingX;
    let alpha = trayProgress > 0 ? 0.48 : 0.22;
    if (searchProgress > 0) {
      x = ball.hidingX + (ball.foundX - ball.hidingX) * smoothstep(searchProgress);
      alpha = 0.48 + searchProgress * 0.52;
    }
    if (returningNow) {
      x = ball.foundX + (ball.returnX - ball.foundX) * smoothstep(returnProgress);
      alpha = 1;
    }
    drawMissingEightBall(x, ball.floorY - (returningNow ? Math.sin(returnProgress * Math.PI * 5) * 2 : 0), time, alpha);
    if (searchingNow && searchProgress > 0.38) {
      drawPixelGlint(x + 3, ball.floorY - 10, Math.sin(searchProgress * Math.PI) * 0.48, "#d8c99d");
    }
  }

  if (questAction?.questId === "pool" && questAction.stepIndex === 0) {
    drawPixelGlint(POOL_LAYOUT.interactions.wallTray, 319, Math.sin(trayProgress * Math.PI) * 0.45, "#c8a76b");
  }
}

function drawPoolBall(x, y, color, time, markEight = false, alpha = 1) {
  const glint = Math.sin(time / 430) > 0.86;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(13,16,20,.38)"; ctx.fillRect(Math.round(x - 5), Math.round(y), 10, 2);
  ctx.fillStyle = "#151923"; ctx.fillRect(Math.round(x - 5), Math.round(y - 7), 10, 6);
  ctx.fillStyle = color; ctx.fillRect(Math.round(x - 4), Math.round(y - 8), 8, 7);
  ctx.fillStyle = glint ? "#fff4cc" : "rgba(255,244,204,.72)";
  if (markEight) {
    ctx.fillRect(Math.round(x - 2), Math.round(y - 7), 4, 3);
    ctx.fillStyle = "#1b2029"; ctx.fillRect(Math.round(x), Math.round(y - 6), 1, 1);
  } else {
    ctx.fillRect(Math.round(x - 2), Math.round(y - 7), 2, 2);
  }
  ctx.restore();
}

function drawMissingEightBall(x, y, time, alpha = 1) {
  const bob = Math.sin(time / 360) > 0.92 ? -1 : 0;
  const px = Math.round(x); const py = Math.round(y + bob);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(10,10,15,.42)";
  ctx.fillRect(px - 10, py, 20, 3);
  ctx.fillStyle = "#3e4650";
  ctx.fillRect(px - 6, py - 15, 12, 2);
  ctx.fillRect(px - 9, py - 12, 2, 8);
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(px - 7, py - 14, 14, 14);
  ctx.fillRect(px - 9, py - 11, 18, 8);
  ctx.fillStyle = "#252c34";
  ctx.fillRect(px - 5, py - 13, 6, 2);
  ctx.fillRect(px - 8, py - 10, 2, 5);
  ctx.fillStyle = "#eee2c8";
  ctx.fillRect(px - 1, py - 10, 3, 1);
  ctx.fillRect(px - 2, py - 9, 5, 5);
  ctx.fillRect(px - 1, py - 4, 3, 1);
  ctx.fillStyle = "#1a2028";
  ctx.fillRect(px, py - 7, 1, 1);
  ctx.fillStyle = "#fff5db";
  ctx.fillRect(px - 5, py - 12, 2, 2);
  ctx.restore();
}

function drawPoolSearchTrail(progress) {
  const reveal = clamp(progress * 1.6, 0, 1);
  const points = [[372, 430], [410, 438], [451, 442], [493, 447], [528, 449]];
  ctx.save();
  ctx.globalAlpha = reveal * 0.34;
  ctx.fillStyle = "#8d795f";
  points.forEach(([x, y], index) => {
    const pointReveal = clamp(reveal * 1.6 - index * 0.13, 0, 1);
    ctx.globalAlpha = pointReveal * 0.34;
    ctx.fillRect(x - 4, y, 8, 1);
    ctx.fillRect(x - 2, y - 1, 4, 1);
  });
  ctx.restore();
}

const cafeCatRects = {
  eating: [
    { x: 86, y: 207, width: 352, height: 178 },
    { x: 557, y: 217, width: 343, height: 176 },
    { x: 1037, y: 211, width: 371, height: 183 }
  ],
  walking: [
    { x: 62, y: 579, width: 416, height: 223 },
    { x: 525, y: 582, width: 417, height: 220 },
    { x: 1006, y: 566, width: 450, height: 237 }
  ]
};

function drawCatCafeQuestVisuals(time) {
  const countProgress = questVisualProgress(0);
  const bowlsProgress = questVisualProgress(1);
  const bellProgress = questVisualProgress(2);
  const countIsActive = questAction?.questId === "cats" && questAction.stepIndex === 0;

  CAT_CAFE_LAYOUT.bowls.starts.forEach((startX, index) => {
    const delayed = clamp(bowlsProgress * 1.35 - index * 0.12, 0, 1);
    const x = startX + (CAT_CAFE_LAYOUT.bowls.ends[index] - startX) * delayed;
    const y = CAT_CAFE_LAYOUT.bowls.y - Math.sin(delayed * Math.PI) * 5;
    drawCafeBowl(x, y, index);
    if (countIsActive) {
      const stagger = clamp(countProgress * 1.7 - index * 0.22, 0, 1);
      if (stagger > 0) drawPixelGlint(x, y - 18, stagger * (0.58 + Math.sin(time / 260 + index) * 0.12), "#e4b75f");
    }
  });

  CAT_CAFE_LAYOUT.cats.starts.forEach((startX, index) => {
    const delayed = clamp(bowlsProgress * 1.35 - index * 0.12, 0, 1);
    const x = startX + (CAT_CAFE_LAYOUT.cats.ends[index] - startX) * delayed;
    const moving = delayed > 0.03 && delayed < 0.97;
    const step = moving ? Math.abs(Math.sin(delayed * Math.PI * 9 + index)) * 2 : 0;
    drawCafeCatSprite(index, moving ? "walking" : "eating", x, CAT_CAFE_LAYOUT.cats.footY - step, time);
  });

  const bellIsRinging = questAction?.questId === "cats" && questAction.stepIndex === 2;
  if (bellProgress > 0 && bellIsRinging) {
    const shake = Math.round(Math.sin(bellProgress * Math.PI * 10) * (1 - bellProgress) * 4);
    drawQuestEffectSprite("bell", CAT_CAFE_LAYOUT.bell.x + shake, CAT_CAFE_LAYOUT.bell.y, 27, {
      alpha: Math.min(1, bellProgress * 2),
      filter: "saturate(.82) brightness(.84) contrast(1.05)"
    });
    drawPixelSoundTicks(CAT_CAFE_LAYOUT.bell.x, CAT_CAFE_LAYOUT.bell.y - 20, bellProgress, time);
  }
}

function drawCafeBowl(x, y, index) {
  const colors = ["#76544a", "#47606a", "#8a6b42"];
  ctx.save();
  ctx.fillStyle = "rgba(28,19,20,.28)"; ctx.fillRect(Math.round(x - 12), Math.round(y), 24, 2);
  ctx.fillStyle = "#2b2630"; ctx.fillRect(Math.round(x - 10), Math.round(y - 8), 20, 7);
  ctx.fillStyle = colors[index]; ctx.fillRect(Math.round(x - 9), Math.round(y - 7), 18, 5);
  ctx.fillStyle = "#c3a774"; ctx.fillRect(Math.round(x - 7), Math.round(y - 6), 14, 2);
  ctx.restore();
}

function drawCafeCatSprite(index, pose, x, footY, time) {
  if (!assets.cafeCats) return;
  const rect = cafeCatRects[pose][index];
  const drawHeight = pose === "walking" ? 54 : 48;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const breathe = pose === "eating" ? Math.sin(time / 620 + index) : 0;
  drawPixelContactShadow(x, footY + 1, Math.min(46, drawWidth * 0.62), 0.2);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY + breathe));
  ctx.filter = "saturate(.88) brightness(.92) contrast(1.05)";
  ctx.drawImage(assets.cafeCats, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

function drawPixelSoundTicks(x, y, progress, time) {
  const pulse = 0.42 + Math.sin(time / 90) * 0.12;
  ctx.save();
  ctx.globalAlpha = Math.min(1, progress * 2) * pulse;
  ctx.fillStyle = "#e5bd65";
  ctx.fillRect(Math.round(x - 22), Math.round(y - 3), 6, 2);
  ctx.fillRect(Math.round(x - 27), Math.round(y - 10), 4, 2);
  ctx.fillRect(Math.round(x + 16), Math.round(y - 3), 6, 2);
  ctx.fillRect(Math.round(x + 23), Math.round(y - 10), 4, 2);
  ctx.fillStyle = "#f3d998";
  ctx.fillRect(Math.round(x - 17), Math.round(y - 8), 2, 3);
  ctx.fillRect(Math.round(x + 15), Math.round(y - 8), 2, 3);
  ctx.restore();
}

function drawBellHomeQuestVisuals(time) {
  const mouseProgress = questVisualProgress(1);

  if (mouseProgress > 0) {
    const x = BELL_HOME_LAYOUT.mouse.startX + mouseProgress * (BELL_HOME_LAYOUT.mouse.endX - BELL_HOME_LAYOUT.mouse.startX);
    const y = BELL_HOME_LAYOUT.mouse.y - Math.sin(mouseProgress * Math.PI) * 9;
    drawPixelContactShadow(x, BELL_HOME_LAYOUT.mouse.y + 1, 32, 0.18 * mouseProgress);
    drawQuestEffectSprite("mouse", x, y, 23, {
      rotation: -0.08 + mouseProgress * 0.14,
      alpha: 0.86,
      filter: "saturate(.68) brightness(.76) contrast(1.05)"
    });
  }
}

function drawCinemaQuestVisuals(time) {
  const aisleProgress = questVisualProgress(0);
  const focusProgress = questVisualProgress(1);
  const signalProgress = questVisualProgress(2);

  CINEMA_LAYOUT.aisleLights.forEach((x, index) => {
    const reveal = clamp(aisleProgress * 1.55 - index * 0.18, 0, 1);
    if (reveal <= 0) return;
    const flicker = reveal < 0.92 ? 0.65 + Math.sin(time / 54 + index * 2) * 0.25 : 0.92;
    drawCinemaAisleLight(x, 425, reveal * flicker);
  });

  if (focusProgress > 0) {
    drawProjectorActivity(focusProgress, time);
    drawCinemaProjection(focusProgress, signalProgress, time);
  }
}

function drawCinemaAisleLight(x, y, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * 0.18;
  const glow = ctx.createRadialGradient(x, y, 1, x, y, 28);
  glow.addColorStop(0, "#e3a94e"); glow.addColorStop(1, "rgba(227,169,78,0)");
  ctx.fillStyle = glow; ctx.fillRect(x - 30, y - 30, 60, 60);
  ctx.globalAlpha = alpha; ctx.fillStyle = "#d9a352";
  ctx.fillRect(Math.round(x - 4), Math.round(y - 2), 8, 3);
  ctx.fillStyle = "#f2d598"; ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 1);
  ctx.restore();
}

function drawProjectorActivity(progress, time) {
  const pulse = 0.72 + Math.sin(time / 150) * 0.08;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = progress * pulse * 0.42;
  ctx.fillStyle = "#d6b477"; ctx.fillRect(CINEMA_LAYOUT.projector.lensX - 2, CINEMA_LAYOUT.projector.lensY - 2, 6, 4);
  ctx.globalAlpha = progress * 0.055;
  ctx.fillStyle = "#d5c4a0";
  ctx.beginPath();
  ctx.moveTo(CINEMA_LAYOUT.projector.lensX + 4, CINEMA_LAYOUT.projector.lensY - 4);
  ctx.lineTo(CINEMA_LAYOUT.screen.x, CINEMA_LAYOUT.screen.y + 28);
  ctx.lineTo(CINEMA_LAYOUT.screen.x, CINEMA_LAYOUT.screen.y + CINEMA_LAYOUT.screen.height - 24);
  ctx.lineTo(CINEMA_LAYOUT.projector.lensX + 4, CINEMA_LAYOUT.projector.lensY + 5);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  const angle = time / 220;
  [[490, 232], [538, 204]].forEach(([x, y], index) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle * (index ? -1 : 1));
    ctx.globalAlpha = progress * 0.48; ctx.fillStyle = "#b8945f";
    ctx.fillRect(-1, -13, 2, 5); ctx.fillRect(-1, 8, 2, 5); ctx.fillRect(-13, -1, 5, 2); ctx.fillRect(8, -1, 5, 2);
    ctx.restore();
  });
}

function drawCinemaProjection(focusProgress, signalProgress, time) {
  if (!assets.cinemaProjection) return;
  const screen = CINEMA_LAYOUT.screen;
  withWorldClip(screen, () => {
    ctx.save();
    const gateFlicker = 0.97 + Math.sin(time / 71) * 0.012 + Math.sin(time / 193) * 0.008;
    const blur = Math.max(0, (1 - focusProgress) * 5.5 - signalProgress * 1.5);
    const imageAlpha = focusProgress * (0.24 + signalProgress * 0.7) * gateFlicker;
    ctx.globalAlpha = 0.18 + focusProgress * 0.12;
    ctx.fillStyle = "#8c9290";
    ctx.fillRect(screen.x, screen.y, screen.width, screen.height);
    ctx.globalAlpha = imageAlpha;
    ctx.filter = `blur(${blur.toFixed(2)}px) saturate(${0.48 + signalProgress * 0.38}) brightness(${0.72 + signalProgress * 0.28}) contrast(1.04)`;
    drawImageCoverInRect(assets.cinemaProjection, screen.x, screen.y, screen.width, screen.height);
    ctx.filter = "none";
    ctx.globalAlpha = focusProgress * 0.045;
    ctx.fillStyle = "#f0d9ad";
    for (let y = screen.y + 2; y < screen.y + screen.height; y += 4) ctx.fillRect(screen.x, y, screen.width, 1);
    ctx.restore();
  });

  if (signalProgress > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = signalProgress * (0.035 + Math.sin(time / 180) * 0.004);
    const glow = ctx.createRadialGradient(screen.x + screen.width * 0.5, screen.y + screen.height * 0.55, 12, screen.x + screen.width * 0.5, screen.y + screen.height * 0.55, 250);
    glow.addColorStop(0, "#b8c9cd");
    glow.addColorStop(1, "rgba(120,145,152,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(screen.x - 180, screen.y - 80, screen.width + 360, screen.height + 220);
    ctx.restore();
  }
}

function drawImageCoverInRect(image, x, y, width, height) {
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sourceX = 0; let sourceY = 0; let sourceWidth = image.width; let sourceHeight = image.height;
  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawRooftopQuestVisuals(time) {
  const landingProgress = questVisualProgress(1);
  const signalProgress = questVisualProgress(2);
  if (landingProgress > 0 || signalProgress > 0) {
    drawRooftopPatioLights(Math.max(landingProgress * 0.62, signalProgress), time);
  }
}

const rooftopCartRect = { x: 154, y: 299, width: 1226, height: 437 };

function drawRooftopMarketCart(progress, time) {
  if (!assets.rooftopCart) return;
  const layout = ROOFTOP_LAYOUT.runUpCart;
  const eased = smoothstep(progress);
  const x = layout.startX + (layout.parkedX - layout.startX) * eased;
  const roll = progress > 0 && progress < 1 ? Math.sin(progress * Math.PI * 9) * 1.5 : Math.sin(time / 880) * 0.25;
  const drawWidth = layout.width;
  const drawHeight = drawWidth * (rooftopCartRect.height / rooftopCartRect.width);
  drawPixelContactShadow(x, layout.footY + 1, drawWidth * 0.72, 0.2);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(layout.footY + roll));
  ctx.filter = "saturate(.78) brightness(.8) contrast(1.06)";
  ctx.drawImage(assets.rooftopCart, rooftopCartRect.x, rooftopCartRect.y, rooftopCartRect.width, rooftopCartRect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

function drawRooftopPatioLights(progress, time) {
  const flicker = 0.86 + Math.sin(time / 170) * 0.045;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ROOFTOP_LAYOUT.patioLights.forEach(([x, y], index) => {
    const reveal = clamp(progress * 1.45 - index * 0.04, 0, 1);
    if (reveal <= 0) return;
    ctx.globalAlpha = reveal * flicker * 0.1;
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 18);
    glow.addColorStop(0, "#ffd17a");
    glow.addColorStop(1, "rgba(255,175,70,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 18, y - 18, 36, 36);
    ctx.globalAlpha = reveal * flicker * 0.68;
    ctx.fillStyle = "#f4c267";
    ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 3, 3);
  });
  ctx.restore();
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

function drawTravellerHints(time) {
  if (currentScene !== travellerEncounter.scene || journey.returning || activeQuest) return;
  if (travellerEncounter.stage === "searching") {
    drawTravelTag(travellerEncounter.tagX, SCENES[currentScene].groundY - 5, time);
    const distance = Math.abs(player.x - travellerEncounter.tagX);
    if (state === "playing" && distance < 180) {
      drawWorldIndicator(travellerEncounter.tagX, SCENES[currentScene].groundY - 102, "E", time + 170, distance < 58);
    }
  }
  if (!["waiting", "returning"].includes(travellerEncounter.stage) || state !== "playing") return;
  const distance = Math.abs(player.x - travellerEncounter.x);
  if (distance < 185) drawWorldIndicator(travellerEncounter.x, SCENES[currentScene].groundY - 174, "E", time, distance < 68);
}

function drawTravelTag(x, footY, time) {
  const bob = Math.round(Math.sin(time / 300));
  const glint = 0.36 + Math.sin(time / 240) * 0.18;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY + bob));
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#17101f";
  ctx.fillRect(-13, 2, 28, 3);
  ctx.fillRect(-9, 1, 20, 1);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#a87943";
  ctx.fillRect(-13, -14, 2, 8); ctx.fillRect(-11, -16, 5, 2); ctx.fillRect(-7, -15, 2, 4);
  ctx.fillStyle = "#d9b466"; ctx.fillRect(-12, -14, 1, 7); ctx.fillRect(-10, -15, 3, 1);
  ctx.fillStyle = "#2f6f91"; ctx.fillRect(-10, -15, 24, 15);
  ctx.fillStyle = "#1e4b69"; ctx.fillRect(-10, -2, 24, 2); ctx.fillRect(12, -13, 2, 11);
  ctx.fillStyle = "#6aaac1"; ctx.fillRect(-7, -12, 18, 3);
  ctx.fillStyle = "#d8c7a7"; ctx.fillRect(-5, -6, 11, 2);
  ctx.fillStyle = `rgba(255,237,179,${glint})`; ctx.fillRect(10, -17, 2, 2);
  ctx.restore();
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
  if (state !== "playing" || !activeQuest || activeQuest.stage !== "solve" || currentScene !== activeQuest.interior) return;
  const step = activeQuest.steps[activeQuest.step];
  if (!step) return;
  drawWorldIndicator(step.x, SCENES[currentScene].groundY - 116, "E", time, Math.abs(player.x - step.x) < 70);
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

function drawSoldOutDisplays(time) {
  if (currentScene !== "market") return;
  flowers.forEach((flower, index) => {
    if (flower.active || !flower.sale) return;
    const [x, y] = flower.anchor;
    const sway = Math.sin(time / 850 + index * 1.7) * 0.012;

    ctx.save();
    ctx.fillStyle = "rgba(18, 15, 27, .42)";
    ctx.beginPath();
    ctx.ellipse(x, y + 13, 42, 54, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(Math.round(x), Math.round(y + 20));
    ctx.rotate(flower.sale.tilt + sway);
    ctx.strokeStyle = "rgba(224, 199, 145, .78)";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-31, -39); ctx.lineTo(31, 39); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(31, -39); ctx.lineTo(-31, 39); ctx.stroke();

    const cardWidth = flower.sale.tag.length > 7 ? 66 : 54;
    ctx.fillStyle = "#d9c39a";
    ctx.fillRect(-cardWidth / 2, -14, cardWidth, 29);
    ctx.fillStyle = "#b89b6f";
    ctx.fillRect(-cardWidth / 2, -14, cardWidth, 4);
    ctx.strokeStyle = "#5d473d";
    ctx.lineWidth = 2;
    ctx.strokeRect(-cardWidth / 2, -14, cardWidth, 29);
    ctx.fillStyle = flower.sale.accent;
    ctx.fillRect(-cardWidth / 2 + 5, -6, cardWidth - 10, 3);
    ctx.fillStyle = "#342735";
    ctx.font = `700 ${flower.sale.tag.length > 7 ? 7 : 8}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(flower.sale.tag, 0, 6);
    ctx.restore();
  });
}

const visitorSpriteRects = {
  tankkeeper: { x: 285, y: 77, width: 183, height: 385 },
  poolplayer: { x: 684, y: 80, width: 184, height: 382 },
  catkeeper: { x: 1065, y: 84, width: 181, height: 378 },
  bellkeeper: { x: 299, y: 542, width: 146, height: 386 },
  ted: { x: 660, y: 541, width: 177, height: 390 },
  florist: { x: 1058, y: 533, width: 199, height: 396 }
};
const projectionistStaticRect = { x: 271, y: 70, width: 128, height: 384 };
const projectionistWalkFrameRects = [
  { x: 234, y: 543, width: 209, height: 381 },
  { x: 569, y: 543, width: 104, height: 381 },
  { x: 816, y: 543, width: 209, height: 380 },
  { x: 1144, y: 543, width: 105, height: 381 }
];

const visitorWalkFrameRects = {
  tankkeeper: [
    { x: 194, y: 36, width: 92, height: 193 }, { x: 432, y: 37, width: 91, height: 192 },
    { x: 686, y: 37, width: 106, height: 192 }, { x: 945, y: 39, width: 104, height: 190 }
  ],
  poolplayer: [
    { x: 146, y: 261, width: 170, height: 195 }, { x: 384, y: 261, width: 171, height: 195 },
    { x: 644, y: 261, width: 168, height: 195 }, { x: 881, y: 261, width: 184, height: 195 }
  ],
  catkeeper: [
    { x: 171, y: 477, width: 113, height: 208 }, { x: 410, y: 476, width: 112, height: 209 },
    { x: 667, y: 478, width: 105, height: 208 }, { x: 914, y: 477, width: 108, height: 208 }
  ],
  bellkeeper: [
    { x: 184, y: 711, width: 101, height: 216 }, { x: 423, y: 711, width: 113, height: 215 },
    { x: 671, y: 711, width: 118, height: 214 }, { x: 921, y: 713, width: 114, height: 213 }
  ],
  ted: [
    { x: 171, y: 951, width: 115, height: 232 }, { x: 420, y: 951, width: 127, height: 232 },
    { x: 686, y: 951, width: 111, height: 232 }, { x: 914, y: 951, width: 137, height: 232 }
  ]
};

function drawNPCs(time) {
  drawTravellerEncounter(time);
  drawMarketVisitor(time);
  drawQuestLocationActors(time);
  drawRooftopCast(time);
  if (currentScene === "rooftop" && activeQuest?.id === "leap") {
    // The cart occupies the foreground run-up, so it sits in front of the
    // waiting group until the dog rolls it back beside the service door.
    drawRooftopMarketCart(questVisualProgress(0), time);
  }
  if (currentScene === "bench" && journey.returning) {
    drawBenchCompanion(time);
    const otherType = player.type === "maltipoo" ? "maltese" : "maltipoo";
    drawDogSprite(ctx, 918, 426, otherType, "sit", "left", 0, 0.78);
  }
}

const questHelperLayout = {
  aquarium: AQUARIUM_LAYOUT.helper,
  pool: { x: POOL_LAYOUT.helper.x, height: POOL_LAYOUT.helper.height },
  cats: CAT_CAFE_LAYOUT.helper,
  bell: BELL_HOME_LAYOUT.helper,
  cinema: CINEMA_LAYOUT.helper
};

function drawQuestLocationActors(time) {
  if (!activeQuest || currentScene !== activeQuest.interior || activeQuest.id === "leap") return;
  const layout = questHelperLayout[activeQuest.id];
  if (activeQuest.id === "cinema" && layout) {
    const direction = player.x < layout.x ? "left" : "right";
    drawProjectionistSprite(layout.x, SCENES[currentScene].groundY + 1, direction, time);
    return;
  }
  const rect = visitorSpriteRects[activeQuest.issuer.sprite];
  if (layout && rect) {
    const direction = player.x < layout.x ? "left" : "right";
    drawGroundedQuestVisitor(layout.x, SCENES[currentScene].groundY + 1, rect, direction, time, layout.height);
  }
  if (activeQuest.id === "bell") drawBellQuestSprite(time);
}

function drawGroundedQuestVisitor(x, footY, rect, direction, time, drawHeight) {
  if (!assets.visitors) return;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const breathe = 1 + Math.sin(time / 760 + rect.x) * 0.0025;
  const gesture = questAction ? Math.sin(questAction.progress * Math.PI * 4) * (1 - questAction.progress) * 0.018 : 0;
  ctx.save(); ctx.globalAlpha = 0.32; ctx.fillStyle = "#17101f";
  ctx.beginPath(); ctx.ellipse(x, footY + 1, Math.min(34, drawWidth * 0.34), 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(Math.round(x), Math.round(footY));
  if (direction === "left") ctx.scale(-1, breathe); else ctx.scale(1, breathe);
  ctx.rotate(gesture);
  ctx.filter = "saturate(.92) brightness(.96) contrast(1.03)";
  ctx.drawImage(assets.visitors, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

function drawBellQuestSprite(time) {
  if (!assets.bellJump && !assets.supportingCast) return;
  const approach = questVisualProgress(2);
  const onChairX = BELL_HOME_LAYOUT.bell.chairX;
  const onChairY = BELL_HOME_LAYOUT.bell.chairY;
  const floorX = BELL_HOME_LAYOUT.bell.floorX;
  const floorY = BELL_HOME_LAYOUT.bell.floorY;
  let frame = 0;
  let x = onChairX;
  let y = onChairY;

  // Four authored poses divide the leap into readable physical beats: gather,
  // push-off, flight and landing. Position easing is deliberately secondary to
  // the changing silhouette so Bell never looks like a static sprite sliding.
  if (approach < 0.16) {
    const gather = approach / 0.16;
    frame = 0;
    y = onChairY + Math.sin(gather * Math.PI) * 2;
  } else if (approach < 0.38) {
    const launch = smoothstep((approach - 0.16) / 0.22);
    frame = 1;
    x = onChairX - 38 * launch;
    y = onChairY - 35 * launch;
  } else if (approach < 0.74) {
    const flight = smoothstep((approach - 0.38) / 0.36);
    frame = 2;
    x = onChairX - 38 + (floorX + 18 - (onChairX - 38)) * flight;
    y = onChairY - 35 + (floorY - 20 - (onChairY - 35)) * flight - Math.sin(flight * Math.PI) * 27;
  } else {
    const landing = smoothstep((approach - 0.74) / 0.26);
    frame = 3;
    x = floorX + 18 * (1 - landing);
    y = floorY - 20 * (1 - landing) - Math.sin(landing * Math.PI) * 4;
  }

  if (approach < 0.16) {
    drawPixelContactShadow(onChairX, onChairY + 1, 30, 0.17);
  } else {
    const shadowProgress = clamp((approach - 0.32) / 0.68, 0, 1);
    const shadowX = onChairX - 30 + (floorX - (onChairX - 30)) * shadowProgress;
    const shadowWidth = 14 + shadowProgress * 18;
    drawPixelContactShadow(shadowX, floorY + 1, shadowWidth, 0.08 + shadowProgress * 0.14);
  }

  drawBellJumpFrame(frame, x, y, time);

  if (approach > 0.74 && approach < 0.96) {
    const impact = Math.sin(((approach - 0.74) / 0.22) * Math.PI);
    ctx.save();
    ctx.globalAlpha = impact * 0.42;
    ctx.fillStyle = "#9a846b";
    ctx.fillRect(Math.round(floorX - 29), Math.round(floorY - 3 - impact * 4), 4, 2);
    ctx.fillRect(Math.round(floorX + 23), Math.round(floorY - 2 - impact * 3), 3, 2);
    ctx.fillStyle = "#c1ab8f";
    ctx.fillRect(Math.round(floorX - 19), Math.round(floorY - 7 - impact * 5), 2, 2);
    ctx.restore();
  }
}

const bellJumpFrameRects = [
  { x: 122, y: 283, width: 335, height: 252 },
  { x: 548, y: 260, width: 371, height: 281 },
  { x: 1042, y: 283, width: 412, height: 179 },
  { x: 1516, y: 277, width: 304, height: 258 }
];

function drawBellJumpFrame(frame, x, footY, time) {
  const rect = bellJumpFrameRects[frame] || bellJumpFrameRects[0];
  if (!assets.bellJump) {
    const fallback = supportingCastRects.bell;
    const drawHeight = BELL_HOME_LAYOUT.bell.height;
    const drawWidth = drawHeight * (fallback.width / fallback.height);
    ctx.drawImage(assets.supportingCast, fallback.x, fallback.y, fallback.width, fallback.height, x - drawWidth / 2, footY - drawHeight, drawWidth, drawHeight);
    return;
  }
  // Use one source-pixel scale for all frames. Airborne poses have shallower
  // crop boxes, so scaling each frame to an identical height would make Bell
  // grow conspicuously in mid-air.
  const sourceScale = BELL_HOME_LAYOUT.bell.height / bellJumpFrameRects[0].height;
  const drawWidth = rect.width * sourceScale;
  const drawHeight = rect.height * sourceScale;
  const settledBreath = frame === 3 && questVisualProgress(2) >= 1 ? Math.sin(time / 720) * 0.35 : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY + settledBreath));
  ctx.filter = "saturate(.82) brightness(.86) contrast(1.08)";
  ctx.drawImage(assets.bellJump, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

const supportingCastRects = {
  marshall: { x: 89, y: 145, width: 369, height: 572 },
  lily: { x: 502, y: 127, width: 159, height: 589 },
  robin: { x: 808, y: 190, width: 182, height: 526 },
  barney: { x: 1060, y: 245, width: 275, height: 475 },
  bell: { x: 1420, y: 443, width: 263, height: 274 }
};

// The rooftop uses a wider architectural view than the interior scenes. Keep
// the cast comfortably below the service-door lintel while preserving their
// height relationship to the proportionally reduced dog.
const supportingCastLayout = {
  marshall: { height: 128, footOffset: 1 },
  lily: { height: 131, footOffset: 1 },
  robin: { height: 128, footOffset: 1 },
  barney: { height: 126, footOffset: 2 }
};

const rooftopCastPlan = [
  { kind: "marshall", start: 448, end: 705, delay: 0 },
  { kind: "robin", start: 332, end: 765, delay: 0.19 },
  { kind: "barney", start: 272, end: 825, delay: 0.38 },
  { kind: "lily", start: 390, end: 885, delay: 0.57 },
  { kind: "ted", start: 208, end: 945, delay: 0.76 }
];

function drawRooftopCast(time) {
  if (currentScene !== "rooftop" || activeQuest?.id !== "leap") return;
  const footY = ROOFTOP_LAYOUT.castFootY;
  const crossing = questVisualProgress(2);
  rooftopCastPlan.forEach((actor, index) => {
    const actorProgress = clamp((crossing - actor.delay) / 0.2, 0, 1);
    drawRooftopLeapActor(actor, actorProgress, footY, time, index);
  });
}

const rooftopJumpFrameRects = {
  ted: { x: 58, y: 233, width: 307, height: 325 },
  marshall: { x: 456, y: 162, width: 333, height: 373 },
  lily: { x: 899, y: 233, width: 168, height: 296 },
  robin: { x: 1136, y: 190, width: 340, height: 337 },
  barney: { x: 1540, y: 234, width: 368, height: 285 }
};

const rooftopJumpDrawHeights = { ted: 110, marshall: 116, lily: 101, robin: 113, barney: 105 };

function drawRooftopLeapActor(actor, progress, footY, time, index) {
  if (progress <= 0) {
    drawRooftopStandingActor(actor.kind, actor.start, footY, time, index);
    return;
  }
  if (progress >= 1) {
    drawRooftopStandingActor(actor.kind, actor.end, footY, time, index);
    return;
  }

  const takeoffX = ROOFTOP_LAYOUT.jump.takeoffX;
  const landingX = ROOFTOP_LAYOUT.jump.landingX;
  let x; let y = footY;
  if (progress < 0.22) {
    const run = smoothstep(progress / 0.22);
    x = actor.start + (takeoffX - actor.start) * run;
    y += Math.sin(run * Math.PI * 5) * -3;
    drawPixelContactShadow(x, footY + 1, actor.kind === "marshall" ? 46 : 34, 0.24);
  } else if (progress < 0.84) {
    const leap = smoothstep((progress - 0.22) / 0.62);
    x = takeoffX + (landingX - takeoffX) * leap;
    y = footY - Math.sin(leap * Math.PI) * ROOFTOP_LAYOUT.jump.apex;
    if (leap < 0.14) drawPixelContactShadow(takeoffX, footY + 1, 30 * (1 - leap / 0.14), 0.14);
    if (leap > 0.82) drawPixelContactShadow(landingX, footY + 1, 30 * ((leap - 0.82) / 0.18), 0.16);
  } else {
    const settle = smoothstep((progress - 0.84) / 0.16);
    x = landingX + (actor.end - landingX) * settle;
    y = footY - Math.sin(settle * Math.PI) * 4;
    drawPixelContactShadow(x, footY + 1, actor.kind === "marshall" ? 44 : 32, 0.24);
  }
  drawRooftopJumpSprite(actor.kind, x, y);

  if (progress > 0.8 && progress < 0.94) {
    const impact = Math.sin(((progress - 0.8) / 0.14) * Math.PI);
    ctx.save(); ctx.globalAlpha = impact * 0.34; ctx.fillStyle = "#9b8b76";
    ctx.fillRect(Math.round(landingX - 25), Math.round(footY - 5 - impact * 3), 3, 2);
    ctx.fillRect(Math.round(landingX + 20), Math.round(footY - 3 - impact * 2), 2, 2);
    ctx.restore();
  }
}

function drawRooftopStandingActor(kind, x, footY, time, index) {
  if (kind === "ted") drawRooftopLeadSprite(x, footY, time, "right");
  else drawSupportingSprite(x, footY, kind, time, index);
}

function drawRooftopJumpSprite(kind, x, footY) {
  const rect = rooftopJumpFrameRects[kind];
  if (!assets.rooftopJumps || !rect) {
    drawRooftopStandingActor(kind, x, footY, 0, 0);
    return;
  }
  const drawHeight = rooftopJumpDrawHeights[kind];
  const drawWidth = drawHeight * (rect.width / rect.height);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY));
  ctx.filter = "saturate(.88) brightness(.92) contrast(1.05)";
  ctx.drawImage(assets.rooftopJumps, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

function drawRooftopLeadSprite(x, footY, time, direction = "right") {
  const rect = visitorSpriteRects.ted;
  if (!assets.visitors || !rect) return;
  const drawHeight = 131;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const breathe = 1 + Math.sin(time / 760) * 0.0025;

  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#111522";
  ctx.beginPath();
  ctx.ellipse(x, footY + 1, Math.min(36, drawWidth * 0.34), 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY));
  ctx.scale(direction === "left" ? -1 : 1, breathe);
  ctx.filter = "saturate(.9) brightness(.94) contrast(1.04)";
  ctx.drawImage(
    assets.visitors,
    rect.x, rect.y, rect.width, rect.height,
    -drawWidth / 2, -drawHeight, drawWidth, drawHeight
  );
  ctx.restore();
}

function drawSupportingSprite(x, footY, kind, time, offset = 0, walkProgress = null) {
  const rect = supportingCastRects[kind];
  const layout = supportingCastLayout[kind];
  if (!rect || !layout) return;
  const drawHeight = layout.height;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const groundedY = footY + layout.footOffset;
  const breathe = 1 + Math.sin(time / 720 + offset * 1.3) * 0.0025;
  const step = walkProgress === null ? 0 : Math.abs(Math.sin(walkProgress * Math.PI * 12)) * -3;
  const lean = walkProgress === null ? 0 : Math.sin(walkProgress * Math.PI * 12) * 0.025;

  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#111522";
  ctx.beginPath();
  ctx.ellipse(x, groundedY + 1, Math.min(27, drawWidth * 0.38), 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundedY + step));
  ctx.rotate(lean);
  ctx.scale(1, breathe);
  ctx.filter = "saturate(.9) brightness(.94) contrast(1.04)";
  ctx.drawImage(
    assets.supportingCast,
    rect.x, rect.y, rect.width, rect.height,
    -drawWidth / 2, -drawHeight, drawWidth, drawHeight
  );
  ctx.restore();
}

const benchCompanionRects = [
  { x: 129, y: 219, width: 210, height: 451 },
  { x: 533, y: 219, width: 210, height: 451 },
  { x: 934, y: 222, width: 209, height: 450 },
  { x: 1298, y: 219, width: 279, height: 451 }
];

function drawBenchCompanion(time) {
  if (!assets.benchCompanion) return;
  let frameIndex = Math.floor(time / 850) % 7 === 0 ? 1 : 0;
  if (journey.reunion) {
    const activeSpeaker = state === "dialogue" && dialogue ? dialogue.lines[dialogue.index]?.speaker : "";
    frameIndex = activeSpeaker === "Her" ? 3 : 2;
  }
  const rect = benchCompanionRects[frameIndex];
  const drawHeight = 158;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const idle = frameIndex === 1 ? 1 : Math.sin(time / 900) * 0.45;

  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#131827";
  ctx.beginPath(); ctx.ellipse(820, 427, 24, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(820, Math.round(430 + idle));
  ctx.filter = "saturate(.9) brightness(.94) contrast(1.04)";
  ctx.drawImage(assets.benchCompanion, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

const travellerWalkFrameRects = [
  { x: 40, y: 226, width: 233, height: 310 },
  { x: 339, y: 226, width: 234, height: 310 },
  { x: 647, y: 226, width: 243, height: 310 },
  { x: 966, y: 226, width: 228, height: 310 }
];
const travellerPoseRects = [
  { x: 67, y: 660, width: 155, height: 322 },
  { x: 387, y: 665, width: 126, height: 322 },
  { x: 637, y: 733, width: 224, height: 255 },
  { x: 968, y: 664, width: 210, height: 327 }
];

function drawTravellerEncounter(time) {
  if (!assets.traveller || currentScene !== travellerEncounter.scene || journey.returning || activeQuest || travellerEncounter.stage === "complete") return;
  if (travellerEncounter.stage === "departing") {
    const elapsed = Math.max(0, time - travellerEncounter.motionStartedAt);
    if (elapsed < travellerEncounter.farewellDuration) {
      drawTravellerSprite(travellerEncounter.departureX, SCENES[currentScene].groundY - 2, travellerPoseRects[3], "left", time);
    } else {
      const frameIndex = Math.floor(travellerEncounter.walkFrame) % travellerWalkFrameRects.length;
      drawTravellerSprite(travellerEncounter.departureX, SCENES[currentScene].groundY - 2, travellerWalkFrameRects[frameIndex], "right", time, true);
    }
    return;
  }
  const poseIndex = travellerEncounter.stage === "waiting" ? 0 : travellerEncounter.stage === "receiving" ? 2 : 1;
  drawTravellerSprite(travellerEncounter.x, SCENES[currentScene].groundY - 2, travellerPoseRects[poseIndex], "left", time);
}

function drawTravellerSprite(x, footY, rect, direction, time, walking = false) {
  const drawHeight = 158;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const frameIndex = Math.floor(travellerEncounter.walkFrame) % 4;
  const stepLift = walking ? [0, 4, 0, -3][frameIndex] : Math.sin(time / 720) * 0.7;
  const strideLean = walking ? [-0.018, 0.014, 0.018, -0.012][frameIndex] : 0;
  ctx.save();
  ctx.globalAlpha = walking && [0, 2].includes(frameIndex) ? 0.24 : 0.31;
  ctx.fillStyle = "#17101f";
  ctx.beginPath(); ctx.ellipse(x, footY - 2, Math.min(38, drawWidth * 0.32), walking && frameIndex === 3 ? 4 : 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY + stepLift));
  if (direction === "right") ctx.scale(-1, 1);
  if (walking) ctx.rotate(strideLean);
  ctx.filter = "saturate(.92) brightness(.96)";
  ctx.drawImage(assets.traveller, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

function drawMarketVisitor(time) {
  if (currentScene !== "market" || !activeQuest || activeQuest.visitorPhase === "away") return;
  if (activeQuest.issuer.sprite === "projectionist") {
    if (["arriving", "departing"].includes(activeQuest.visitorPhase)) {
      drawVisitorWalkSprite(
        activeQuest.visitorX,
        SCENES.market.groundY - 2,
        "projectionist",
        activeQuest.visitorWalkFrame,
        activeQuest.visitorDirection
      );
    } else {
      drawProjectionistSprite(activeQuest.visitorX, SCENES.market.groundY - 2, activeQuest.visitorDirection, time);
    }
    return;
  }
  const rect = visitorSpriteRects[activeQuest.issuer.sprite];
  if (!assets.visitors || !rect) return;
  if (["arriving", "departing"].includes(activeQuest.visitorPhase) && assets.visitorWalk) {
    drawVisitorWalkSprite(
      activeQuest.visitorX,
      SCENES.market.groundY - 2,
      activeQuest.issuer.sprite,
      activeQuest.visitorWalkFrame,
      activeQuest.visitorDirection
    );
    return;
  }
  drawVisitorSprite(activeQuest.visitorX, SCENES.market.groundY - 2, rect, activeQuest.visitorDirection, time);
}

function drawVisitorWalkSprite(x, footY, sprite, frame, direction) {
  const isProjectionist = sprite === "projectionist";
  const frames = isProjectionist ? projectionistWalkFrameRects : visitorWalkFrameRects[sprite];
  const rect = frames?.[Math.floor(frame) % frames.length];
  if (!rect) return;
  const drawHeight = 154;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const frameIndex = Math.floor(frame) % frames.length;
  const stepLift = [0, 3, 0, -2][frameIndex];

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#17101f";
  ctx.beginPath();
  ctx.ellipse(x, footY - 2, 29, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY + stepLift));
  if (isProjectionist ? direction === "left" : direction === "right") ctx.scale(-1, 1);
  ctx.filter = "saturate(.92) brightness(.96)";
  ctx.drawImage(
    isProjectionist ? assets.projectionist : assets.visitorWalk,
    rect.x, rect.y, rect.width, rect.height,
    -drawWidth / 2, -drawHeight, drawWidth, drawHeight
  );
  ctx.restore();
}

function drawProjectionistSprite(x, footY, direction, time, alpha = 1) {
  if (!assets.projectionist) return;
  const rect = projectionistStaticRect;
  const drawHeight = 154;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const idle = Math.sin(time / 720) * 0.7;
  ctx.save();
  ctx.globalAlpha = alpha * 0.3; ctx.fillStyle = "#17101f";
  ctx.beginPath(); ctx.ellipse(x, footY - 2, Math.min(30, drawWidth * 0.4), 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha; ctx.translate(Math.round(x), Math.round(footY + idle));
  if (direction === "left") ctx.scale(-1, 1);
  ctx.filter = "saturate(.9) brightness(.94) contrast(1.04)";
  ctx.drawImage(assets.projectionist, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  ctx.restore();
}

function drawVisitorSprite(x, footY, rect, direction, time, alpha = 1) {
  const drawHeight = 154;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const idle = Math.sin(time / 720 + rect.x) * 0.8;

  ctx.save();
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = "#17101f";
  ctx.beginPath();
  ctx.ellipse(x, footY - 2, Math.min(34, drawWidth * 0.32), 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(footY + idle));
  // The stationary atlas faces right; the separate walk atlas faces left.
  if (direction === "left") ctx.scale(-1, 1);
  ctx.filter = "saturate(.92) brightness(.96)";
  ctx.drawImage(
    assets.visitors,
    rect.x, rect.y, rect.width, rect.height,
    -drawWidth / 2, -drawHeight, drawWidth, drawHeight
  );
  ctx.restore();
}

function drawCarriedFlower(x, y, direction, flower, time) {
  const side = direction === "right" ? 1 : -1;
  const sway = Math.round(Math.sin(time / 300) * 2);
  ctx.save();
  ctx.translate(Math.round(x + side * 51 * DOG_ART_SCALE), Math.round(y - 56 * DOG_ART_SCALE + sway));
  ctx.scale(side * DOG_ART_SCALE, DOG_ART_SCALE);
  ctx.fillStyle = "#486c50";
  for (let index = 0; index < 9; index += 1) ctx.fillRect(-18 + index * 2, 12 - index, 3, 2);
  ctx.fillStyle = "#769363"; ctx.fillRect(-11, 7, 6, 2); ctx.fillRect(-9, 4, 2, 5);
  ctx.fillStyle = "#3b3242";
  [[-7,-3],[3,-7],[8,1],[2,8],[-8,6],[-11,0]].forEach(([px, py]) => ctx.fillRect(px - 3, py - 3, 7, 7));
  ctx.fillStyle = flower.color;
  [[-7,-3],[3,-7],[8,1],[2,8],[-8,6],[-11,0]].forEach(([px, py]) => ctx.fillRect(px - 2, py - 2, 5, 5));
  ctx.fillStyle = "#f0c66d"; ctx.fillRect(-2, -2, 5, 5);
  ctx.fillStyle = "#fff0bd"; ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function dogSceneFilter() {
  if (["aquarium", "aquariumInside", "rooftop", "cinemaStreet"].includes(currentScene)) {
    return "saturate(.88) brightness(.94) contrast(1.04) drop-shadow(1px -1px 0 rgba(111,151,176,.18))";
  }
  if (currentScene === "bench") {
    return "saturate(.9) brightness(.96) contrast(1.04) drop-shadow(1px -1px 0 rgba(232,176,102,.16))";
  }
  if (["market", "entrance", "poolInside", "catInside", "bellHome", "cinemaInside"].includes(currentScene)) {
    return "saturate(.94) brightness(.98) contrast(1.03) drop-shadow(1px -1px 0 rgba(232,176,102,.12))";
  }
  return "saturate(.9) brightness(.96) contrast(1.04)";
}

const dogMasterFrameRects = {
  maltipoo: {
    static: [
      { x:68,y:161,width:190,height:166 }, { x:322,y:138,width:183,height:189 },
      { x:571,y:197,width:208,height:130 }, { x:828,y:151,width:147,height:175 },
      { x:1049,y:162,width:177,height:165 }, { x:1288,y:161,width:191,height:166 }
    ],
    walk: [
      { x:49,y:456,width:219,height:153 }, { x:314,y:457,width:213,height:152 },
      { x:571,y:460,width:199,height:149 }, { x:806,y:456,width:209,height:153 },
      { x:1052,y:461,width:206,height:149 }, { x:1291,y:460,width:208,height:149 }
    ],
    run: [
      { x:52,y:734,width:181,height:140 }, { x:274,y:723,width:214,height:152 },
      { x:516,y:724,width:245,height:129 }, { x:794,y:743,width:209,height:133 },
      { x:1057,y:743,width:188,height:132 }, { x:1283,y:737,width:215,height:138 }
    ]
  },
  maltese: {
    static: [
      { x:69,y:160,width:186,height:168 }, { x:324,y:144,width:186,height:184 },
      { x:571,y:201,width:200,height:127 }, { x:828,y:150,width:141,height:178 },
      { x:1047,y:157,width:173,height:171 }, { x:1289,y:157,width:184,height:171 }
    ],
    walk: [
      { x:50,y:453,width:213,height:156 }, { x:316,y:456,width:207,height:153 },
      { x:571,y:458,width:195,height:151 }, { x:807,y:456,width:203,height:153 },
      { x:1056,y:461,width:199,height:148 }, { x:1292,y:460,width:204,height:149 }
    ],
    run: [
      { x:53,y:731,width:177,height:144 }, { x:272,y:725,width:214,height:150 },
      { x:519,y:725,width:238,height:128 }, { x:795,y:742,width:203,height:134 },
      { x:1058,y:743,width:182,height:132 }, { x:1286,y:738,width:209,height:137 }
    ]
  }
};

function drawDogSprite(target, x, y, type, pose, direction, walkFrame, scale = 1) {
  scale *= DOG_ART_SCALE;
  const atlas = type === "maltese" ? assets.dogMaltese : assets.dogMaltipoo;
  const frames = dogMasterFrameRects[type];
  if (!atlas || !frames) { drawFallbackDog(target, x, y, type, pose, direction, walkFrame, 2.5 * scale); return; }

  const running = pose === "run";
  const walking = pose === "walk";
  const group = running ? "run" : walking ? "walk" : "static";
  const staticColumns = { idle: 0, attentive: 1, relaxed: 0, sniff: 2, sit: 3, emotional: 4, interact: 5 };
  const frameIndex = running || walking ? Math.floor(walkFrame) % 6 : (staticColumns[pose] ?? 0);
  const rect = frames[group][frameIndex];
  const drawHeight = (running ? 85 : walking ? 90 : 93) * scale;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const runLift = running ? [0, 3, 8, 12, 5, 1][frameIndex] * scale : 0;
  const walkLift = walking ? [0, 1, 0, 2, 0, 1][frameIndex] * scale : 0;

  if (target === ctx) {
    if (running) drawSprintTrail(target, x, y, direction, walkFrame, scale);
    target.save();
    target.globalAlpha = running ? 0.26 : 0.32;
    target.fillStyle = "#17101f";
    const shadowWidth = running ? [39, 43, 36, 31, 39, 41][frameIndex] : walking ? 38 : pose === "sit" ? 29 : 36;
    target.beginPath(); target.ellipse(x, y - 2, shadowWidth * scale, (running ? 4 : 5) * scale, 0, 0, Math.PI * 2); target.fill();
    target.restore();
  }

  target.save();
  target.translate(Math.floor(x), Math.floor(y - runLift - walkLift));
  if (direction === "left") target.scale(-1, 1);
  if (target === ctx) target.filter = dogSceneFilter();
  target.drawImage(atlas, rect.x, rect.y, rect.width, rect.height, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
  target.restore();
}

function drawSprintTrail(target, x, y, direction, frame, scale) {
  const side = direction === "right" ? -1 : 1;
  const pulse = Math.abs(Math.sin(frame * Math.PI));
  target.save();
  target.fillStyle = "rgba(236, 214, 178, .18)";
  for (let i = 0; i < 3; i++) {
    const trailX = Math.round(x + side * (47 + i * 14 + pulse * 5) * scale);
    const trailY = Math.round(y - (25 + i * 10) * scale);
    target.fillRect(trailX, trailY, Math.round(side * 9 * scale) || side, Math.max(1, Math.round(scale)));
    target.fillRect(trailX + side * 12 * scale, trailY + 2 * scale, Math.round(side * 4 * scale) || side, Math.max(1, Math.round(scale)));
  }
  target.fillStyle = "rgba(168, 139, 111, .22)";
  for (let i = 0; i < 3; i++) {
    const dustX = Math.round(x + side * (35 + i * 13 + pulse * 7) * scale);
    const dustY = Math.round(y - (4 + (i % 2) * 4) * scale);
    const size = Math.max(1, Math.round((2.2 - i * 0.4) * scale));
    target.fillRect(dustX, dustY, size, size);
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
  if (!assets.dogMaltipoo || !assets.dogMaltese) return;
  document.querySelectorAll("[data-dog-preview]").forEach((preview) => {
    const previewCtx = preview.getContext("2d"); previewCtx.clearRect(0, 0, preview.width, preview.height); previewCtx.imageSmoothingEnabled = false;
    drawDogSprite(previewCtx, 120, 148, preview.dataset.dogPreview, "idle", "right", 0, 1.18);
  });
}

const visitorPortraitRects = {
  tankkeeper: { x: 300, y: 77, size: 128 },
  poolplayer: { x: 710, y: 80, size: 126 },
  catkeeper: { x: 1085, y: 84, size: 128 },
  bellkeeper: { x: 306, y: 542, size: 126 },
  ted: { x: 674, y: 541, size: 132 },
  florist: { x: 1080, y: 533, size: 134 }
};

const supportingPortraitRects = {
  marshall: { x: 145, y: 145, size: 165 },
  lily: { x: 502, y: 127, size: 159 },
  robin: { x: 820, y: 190, size: 160 },
  barney: { x: 1160, y: 245, size: 155 },
  bell: { x: 1435, y: 443, size: 165 }
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
  if (kind === "traveller" && assets.traveller) {
    const gradient = portraitCtx.createLinearGradient(0, 0, 112, 112);
    gradient.addColorStop(0, "#496f78"); gradient.addColorStop(1, "#30283f");
    portraitCtx.fillStyle = gradient; portraitCtx.fillRect(0, 0, 112, 112);
    portraitCtx.save();
    portraitCtx.filter = "saturate(.94) brightness(.98)";
    portraitCtx.drawImage(assets.traveller, 100, 660, 122, 122, 0, 0, 112, 112);
    portraitCtx.restore();
    return;
  }
  if (kind === "her" && assets.benchCompanion) {
    const gradient = portraitCtx.createLinearGradient(0, 0, 112, 112);
    gradient.addColorStop(0, "#49526a"); gradient.addColorStop(1, "#28283d");
    portraitCtx.fillStyle = gradient; portraitCtx.fillRect(0, 0, 112, 112);
    portraitCtx.save();
    portraitCtx.filter = "saturate(.94) brightness(.98) contrast(1.03)";
    portraitCtx.drawImage(assets.benchCompanion, 160, 219, 150, 150, 0, 0, 112, 112);
    portraitCtx.restore();
    return;
  }
  if (kind === "projectionist" && assets.projectionist) {
    const gradient = portraitCtx.createLinearGradient(0, 0, 112, 112);
    gradient.addColorStop(0, "#684d5b"); gradient.addColorStop(1, "#28283d");
    portraitCtx.fillStyle = gradient; portraitCtx.fillRect(0, 0, 112, 112);
    portraitCtx.save();
    portraitCtx.filter = "saturate(.9) brightness(.96) contrast(1.03)";
    portraitCtx.drawImage(assets.projectionist, 271, 70, 128, 160, 0, 0, 112, 112);
    portraitCtx.restore();
    return;
  }
  const visitorPortrait = visitorPortraitRects[kind];
  if (visitorPortrait && assets.visitors) {
    const gradient = portraitCtx.createLinearGradient(0, 0, 112, 112);
    gradient.addColorStop(0, "#685066");
    gradient.addColorStop(1, "#30283e");
    portraitCtx.fillStyle = gradient;
    portraitCtx.fillRect(0, 0, 112, 112);
    portraitCtx.save();
    portraitCtx.filter = "saturate(.94) brightness(.98)";
    portraitCtx.drawImage(
      assets.visitors,
      visitorPortrait.x, visitorPortrait.y, visitorPortrait.size, visitorPortrait.size,
      0, 0, 112, 112
    );
    portraitCtx.restore();
    return;
  }
  const supportingPortrait = supportingPortraitRects[kind];
  if (supportingPortrait && assets.supportingCast) {
    const gradient = portraitCtx.createLinearGradient(0, 0, 112, 112);
    gradient.addColorStop(0, "#5d536c");
    gradient.addColorStop(1, "#29283d");
    portraitCtx.fillStyle = gradient;
    portraitCtx.fillRect(0, 0, 112, 112);
    portraitCtx.save();
    portraitCtx.filter = "saturate(.94) brightness(.98) contrast(1.03)";
    portraitCtx.drawImage(
      assets.supportingCast,
      supportingPortrait.x, supportingPortrait.y, supportingPortrait.size, supportingPortrait.size,
      0, 0, 112, 112
    );
    portraitCtx.restore();
    return;
  }
  drawNarratorPortrait();
}

function drawNarratorPortrait() {
  const gradient = portraitCtx.createLinearGradient(0, 0, 112, 112);
  gradient.addColorStop(0, "#4e3959");
  gradient.addColorStop(1, "#211f36");
  portraitCtx.fillStyle = gradient;
  portraitCtx.fillRect(0, 0, 112, 112);
  portraitCtx.save();
  portraitCtx.translate(56, 56);
  portraitCtx.fillStyle = "rgba(240,198,109,.18)";
  portraitCtx.beginPath();
  portraitCtx.arc(0, 0, 31, 0, Math.PI * 2);
  portraitCtx.fill();
  portraitCtx.fillStyle = "#f0c66d";
  for (let index = 0; index < 6; index += 1) {
    portraitCtx.save();
    portraitCtx.rotate((Math.PI * 2 * index) / 6);
    portraitCtx.beginPath();
    portraitCtx.ellipse(0, -19, 7, 13, 0, 0, Math.PI * 2);
    portraitCtx.fill();
    portraitCtx.restore();
  }
  portraitCtx.fillStyle = "#fff0bd";
  portraitCtx.beginPath();
  portraitCtx.arc(0, 0, 8, 0, Math.PI * 2);
  portraitCtx.fill();
  portraitCtx.restore();
}

function drawWorldParticles() { particles.forEach((p) => { ctx.save(); ctx.globalAlpha = Math.min(1,p.life); ctx.translate(p.x,p.y); ctx.rotate(p.rotation); ctx.fillStyle=p.color; ctx.fillRect(-(p.width || 5)/2,-(p.height || 3)/2,p.width || 5,p.height || 3); ctx.restore(); }); }
function spawnPetals(x,y,count) { for (let i=0;i<count;i++) particles.push({ x,y,vx:-45+Math.random()*90,vy:-55+Math.random()*20,life:1.5+Math.random()*1.2,rotation:Math.random()*6,spin:-4+Math.random()*8,color:["#ed8f8a","#f3c46d","#d39fb5"][i%3] }); }
function spawnSaleSlips(x, y, accent, count) {
  const colors = ["#d9c39a", "#b89b6f", accent];
  for (let index = 0; index < count; index += 1) {
    particles.push({
      x, y,
      vx: -34 + Math.random() * 68,
      vy: -48 + Math.random() * 24,
      life: 1.1 + Math.random() * 0.7,
      rotation: Math.random() * 6,
      spin: -5 + Math.random() * 10,
      width: index % 3 === 0 ? 8 : 6,
      height: index % 3 === 0 ? 4 : 3,
      color: colors[index % colors.length]
    });
  }
}

function drawLighting(time) {
  ctx.save(); ctx.globalCompositeOperation = "screen";
  const lightsByScene = {
    bench: [[872,133,48,.11]],
    aquarium: [[400,205,38,.07]],
    dateNight: [[155,195,42,.08],[730,210,40,.07]],
    catStories: [[155,190,40,.08],[670,190,34,.06],[905,190,34,.06]],
    cinemaStreet: [[705,195,46,.09]],
    entrance: [[610,205,52,.11],[825,200,34,.08]],
    market: [[360,190,38,.09],[510,188,38,.09],[695,190,38,.09],[895,190,38,.09],[1040,190,36,.08]],
    aquariumInside: [],
    poolInside: [[520,150,40,.07],[900,145,52,.06]],
    catInside: [[315,160,38,.06],[620,160,38,.06],[965,180,34,.07]],
    bellHome: [[980,190,58,.09]],
    rooftop: [[730,315,44,.1]],
    cinemaInside: []
  };
  const lights = lightsByScene[currentScene] || [];
  for (const [worldX,y,baseRadius,alpha] of lights) {
    const x = worldX - camera.x; const radius = baseRadius + Math.sin(time/700 + worldX) * 2;
    const g=ctx.createRadialGradient(x,y,0,x,y,radius); g.addColorStop(0,`rgba(255,213,128,${alpha})`); g.addColorStop(1,"rgba(255,173,83,0)");
    ctx.fillStyle=g; ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  ctx.restore(); if (scene.darkness) { ctx.fillStyle=`rgba(19,17,46,${scene.darkness})`; ctx.fillRect(0,0,960,540); }
}

function transition(callback) { ui.fade.classList.add("is-active"); setTimeout(() => { callback(); setTimeout(() => ui.fade.classList.remove("is-active"), 80); }, 560); }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
function smoothstep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}
function initAudio() { if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === "suspended") audioContext.resume(); }
function tone(frequency,duration,volume) { if (audioMuted || !audioContext) return; const oscillator=audioContext.createOscillator(); const gain=audioContext.createGain(); oscillator.type="sine"; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(volume,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001,audioContext.currentTime+duration); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime+duration); }
function toggleSound() { audioMuted=!audioMuted; ui.soundButton.textContent=audioMuted?"×":"♪"; ui.soundButton.setAttribute("aria-label",audioMuted?"Enable sound":"Mute sound"); if(!audioMuted){initAudio();tone(659,0.1,0.025);} }
function loop(time) { const delta=Math.min((time-lastTime)/1000,0.04)||0; lastTime=time; update(delta,time); draw(time); requestAnimationFrame(loop); }

updateHUD(); requestAnimationFrame(loop);
