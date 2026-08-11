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
const DOG_RENDER_HEIGHTS = Object.freeze({ static: 93, walk: 90, run: 85 });
const POOL_BALL_STANDARD_INTERACT_BEAT = 0.1;
const ROOFTOP_CHARACTER_SCALE = 0.83;
const POOL_LAYOUT = {
  table: {
    left: 618,
    surface: { x: 625, y: 360, width: 468, height: 48 },
    foreground: {
      body: [[618, 360], [1092, 360], [1100, 375], [1100, 468], [650, 468], [650, 402]],
      legs: [
        { x: 651, y: 431, width: 34, height: 62 },
        { x: 1027, y: 431, width: 38, height: 62 }
      ]
    }
  },
  playerMaxX: 440,
  // The scene has no vertical movement lane. Keep every human pose fully left
  // of the table so a walking frame can never straddle front/back depth layers.
  helper: { x: 560, pickupX: 535, tableX: 560, height: 190 },
  missingBall: {
    hidingX: 446, foundX: 500, returnX: 570, floorY: 457,
    dogOffsetX: 8, dogCoverHalfWidth: 30, rollClearance: 70,
    rollStart: 0.08, rollEnd: 0.76,
    emergenceStart: 0.22, emergenceEnd: 0.78, clearPadding: 4,
    tableDropX: 630, tableDropY: 384,
    rackX: 850, rackY: 384
  },
  interactions: { wallTray: 315, hidingPlace: 430, returnBall: 440 }
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
const ROOFTOP_LEAP_TIMING = {
  duration: 13650,
  jumpDuration: 720,
  landingPause: 520,
  runFrameDuration: 165
};
const CINEMA_LAYOUT = {
  helper: { x: 118, height: 154 },
  aisleLights: [126, 378, 638, 898],
  projector: { x: 535, y: 216, lensX: 602, lensY: 245 },
  screen: { x: 750, y: 94, width: 302, height: 252 },
  interactions: { aisle: 330, projector: 560, signal: 900 }
};
const TENNIS_LAYOUT = {
  triggerX: 430,
  court: {
    netX: 550,
    playerAX: 270, playerAY: 360, playerAHeight: 118,
    playerBX: 830, playerBY: 360, playerBHeight: 118
  },
  ball: {
    looseX: 612, looseY: 455,
    landingX: 758, landingY: 365,
    receiveX: 792, receiveY: 290
  },
  interactionRadius: 66,
  escapeDuration: 1900,
  returnDuration: 1450,
  celebrationDuration: 2400
};
const SCENES = {
  bench: { asset: "bench", width: 1100, minX: 105, maxX: 995, groundY: 430,
    doors: [{ x: 210, radius: 68, target: "bellHome", spawnX: 155, label: "Enter Bell's home", quest: "bell" }] },
  tennisCourt: { asset: "tennisCourt", width: 1100, minX: 105, maxX: 995, groundY: 458 },
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
  tennisCourt: "assets/exterior-tennis-court-benchmark-v6.png",
  tennisPlayers: "assets/character-tennis-players-v1.png",
  aquarium: "assets/exterior-aquarium-benchmark-v1.png",
  dateNight: "assets/exterior-date-night-benchmark-v1.png",
  catStories: "assets/exterior-cat-stories-benchmark-v1.png",
  cinemaStreet: "assets/exterior-cinema-benchmark-v1.png",
  entrance: "assets/market-entrance-benchmark-v1.png",
  market: "assets/market-interior-benchmark-v2.png",
  aquariumInside: "assets/interior-aquarium-benchmark-v4.png",
  poolInside: "assets/interior-pool-benchmark-v9.png",
  poolEightBall: "assets/pool-eight-ball-v1.png",
  poolPlayerSequence: "assets/character-pool-player-sequence-v2.png",
  poolPlayerCarry: "assets/character-pool-player-carry-walk-v1.png",
  poolDogActions: "assets/dog-pool-search-actions-v1.png",
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
  rooftopRuns: "assets/character-rooftop-runs-v1.png",
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
  tennisCourt: { rate: 0.16, palette: ["#788574", "#967b55", "#586d77"], width: 2, height: 2, vx: [-3, 4], vy: [3, 7] },
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
const tennisEncounter = {
  stage: "rally",
  startedAt: 0,
  rallyEpoch: 0,
  ballX: TENNIS_LAYOUT.ball.looseX,
  ballY: TENNIS_LAYOUT.ball.looseY,
  ballSpin: 0,
  speechUntil: 0,
  completed: false
};

let state = "loading";
let currentScene = "bench";
let nearbyFlower = null;
let nearbyMemory = null;
let nearbyQuestStep = null;
let nearbyReunion = false;
let nearbyTraveller = false;
let nearbyTravelTag = false;
let nearbyTennisBall = false;
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
      line("Pool Player", "I checked all six pockets twice. Start with the shallow tray beneath the cues; that is where the spare balls usually sit.", "poolplayer")
    ],
    steps: [
      { x: POOL_LAYOUT.interactions.wallTray, cameraFocus: 365, kicker: "The empty wall tray", label: "Check beside the cue rack", objective: "Inspect the spare-ball tray", lines: () => [
        line("Narrator", "The tray is empty, but a clean round mark interrupts the dust. A faint track continues across the floor.", "narrator"),
        dogLine("It rolled right.", "There is a trail."),
        line("Pool Player", "The track ends beneath the low bench. Check under it before I move anything and send the ball farther away.", "poolplayer")
      ] },
      { x: POOL_LAYOUT.interactions.hidingPlace, cameraFocus: 500, kicker: "A shadow beneath the bench", label: "Look for the missing ball", objective: "Search beneath the low bench", lines: () => [
        line("Narrator", "A nose lowers, one paw reaches in, and the 8-ball rolls cleanly out of the shadow.", "narrator"),
        dogLine("Found it.", "Black ball, found."),
        line("Pool Player", "Perfect. Give it one careful nudge into the open floor. I'll collect it from there.", "poolplayer")
      ] },
      { x: POOL_LAYOUT.interactions.returnBall, cameraFocus: 570, kicker: "A clear line across the floor", label: "Nudge the 8-ball back", objective: "Return the 8-ball to the pool player", lines: () => [
        line("Narrator", "The 8-ball slows beside his shoe. He crouches, collects it, walks it back to the table, and closes the space in the rack.", "narrator"),
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
      line("Narrator", "The market is a few streets away. The walk begins.", "narrator")
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
  Object.assign(tennisEncounter, {
    stage: "rally", startedAt: 0, rallyEpoch: 0,
    ballX: TENNIS_LAYOUT.ball.looseX, ballY: TENNIS_LAYOUT.ball.looseY,
    ballSpin: 0, speechUntil: 0, completed: false
  });
  currentScene = "bench";
  Object.assign(player, { x: 145, y: SCENES.bench.groundY, direction: "right", moving: false, sprinting: false, walkFrame: 0, pose: "idle" });
  Object.assign(keys, { left: false, right: false, sprint: false });
  Object.assign(camera, { x: 0, target: 0 });
  currentFlower = null; endingFlower = null; activeQuest = null; questAction = null;
  nearbyFlower = null; nearbyMemory = null; nearbyQuestStep = null; nearbyReunion = false;
  nearbyTraveller = false; nearbyTravelTag = false; nearbyTennisBall = false; dialogue = null;
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
  if (checkpointId === "tennis") {
    applyCheckpointProgress(0);
    journey.market = false;
    journey.entrance = false;
    currentScene = "tennisCourt";
    spawnX = 555;
    checkpointLabel = "TENNIS COURT";
    tennisEncounter.rallyEpoch = performance.now();
  } else if (questIndex >= 0) {
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
      : quest.id === "pool"
        ? 380
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
    switchScene("tennisCourt", 125, () => {
      journey.leftBench = true;
      tennisEncounter.rallyEpoch ||= performance.now();
      ui.status.textContent = "Floodlights warm the courts after the rain";
      showLocation("THE EVENING ROUTE", "The Neighbourhood Courts", "A late rally carries over the fence");
      updateHUD(); resumePlay();
    }, "right");
    return;
  }
  if (currentScene === "tennisCourt" && player.x <= SCENES.tennisCourt.minX + 2 && keys.left) {
    switchScene("bench", SCENES.bench.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
    return;
  }
  if (currentScene === "tennisCourt" && player.x >= SCENES.tennisCourt.maxX - 2 && keys.right) {
    switchScene("aquarium", 125, () => {
      ui.status.textContent = "The aquarium lights colour the road";
      showLocation("THE EVENING ROUTE", "Aquarium & School", "The shark is easier to find from the pavement");
      updateHUD(); resumePlay();
    }, "right");
    return;
  }
  if (currentScene === "aquarium" && player.x <= SCENES.aquarium.minX + 2 && keys.left) {
    switchScene("tennisCourt", SCENES.tennisCourt.maxX - 25, () => { updateHUD(); resumePlay(); }, "left");
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
  if (nearbyTennisBall) { interactTennisBall(); return; }
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

function interactTennisBall() {
  if (currentScene !== "tennisCourt") return;
  if (tennisEncounter.stage !== "loose") return;
  tennisEncounter.stage = "returning";
  tennisEncounter.startedAt = performance.now();
  nearbyTennisBall = false;
  Object.assign(keys, { left: false, right: false, sprint: false });
  player.direction = "right";
  player.pose = "interact";
  player.moving = false;
  state = "tennisAction";
  ui.prompt.hidden = true;
  ui.touch.classList.remove("is-active");
  ui.status.textContent = `${player.name} lines up the gentlest nudge`;
  tone(430, 0.09, 0.026);
}

function updateTennisEncounter(time) {
  if (!tennisEncounter.rallyEpoch) tennisEncounter.rallyEpoch = time;
  if (
    tennisEncounter.stage === "rally" && currentScene === "tennisCourt" &&
    state === "playing" && !journey.returning && !activeQuest && player.x >= TENNIS_LAYOUT.triggerX
  ) {
    tennisEncounter.stage = "escaping";
    tennisEncounter.startedAt = time;
    ui.status.textContent = "One return carries a little too far";
    tone(660, 0.055, 0.014);
    updateHUD();
  }

  if (tennisEncounter.stage === "escaping") {
    const progress = clamp((time - tennisEncounter.startedAt) / TENNIS_LAYOUT.escapeDuration, 0, 1);
    const start = {
      x: TENNIS_LAYOUT.court.playerBX - 31,
      y: TENNIS_LAYOUT.court.playerBY - 70
    };
    const control = { x: 690, y: 82 };
    const end = { x: TENNIS_LAYOUT.ball.looseX, y: TENNIS_LAYOUT.ball.looseY };
    tennisEncounter.ballX = quadraticBezier(start.x, control.x, end.x, progress);
    tennisEncounter.ballY = quadraticBezier(start.y, control.y, end.y, progress);
    tennisEncounter.ballSpin = progress * Math.PI * 7;
    if (progress >= 1) {
      tennisEncounter.stage = "loose";
      tennisEncounter.ballX = TENNIS_LAYOUT.ball.looseX;
      tennisEncounter.ballY = TENNIS_LAYOUT.ball.looseY;
      ui.status.textContent = "A tennis ball has rolled onto the pavement";
      tone(248, 0.045, 0.015);
      setTimeout(() => tone(205, 0.055, 0.012), 75);
      updateHUD();
    }
    return;
  }

  if (tennisEncounter.stage === "returning") {
    const progress = clamp((time - tennisEncounter.startedAt) / TENNIS_LAYOUT.returnDuration, 0, 1);
    if (progress < 0.72) {
      const local = smoothstep(progress / 0.72);
      tennisEncounter.ballX = TENNIS_LAYOUT.ball.looseX + (TENNIS_LAYOUT.ball.landingX - TENNIS_LAYOUT.ball.looseX) * local;
      tennisEncounter.ballY = quadraticBezier(TENNIS_LAYOUT.ball.looseY, 330, TENNIS_LAYOUT.ball.landingY, local);
    } else {
      const local = smoothstep((progress - 0.72) / 0.28);
      tennisEncounter.ballX = TENNIS_LAYOUT.ball.landingX + (TENNIS_LAYOUT.ball.receiveX - TENNIS_LAYOUT.ball.landingX) * local;
      tennisEncounter.ballY = quadraticBezier(TENNIS_LAYOUT.ball.landingY, 315, TENNIS_LAYOUT.ball.receiveY, local);
    }
    tennisEncounter.ballSpin = progress * Math.PI * 8;
    player.walkFrame = progress * 2;
    if (progress >= 1) {
      tennisEncounter.stage = "celebrating";
      tennisEncounter.startedAt = time;
      tennisEncounter.speechUntil = time + TENNIS_LAYOUT.celebrationDuration;
      tennisEncounter.completed = true;
      state = "playing";
      player.pose = "idle";
      ui.touch.classList.add("is-active");
      ui.status.textContent = "The rally is still in";
      tone(659, 0.09, 0.024);
      setTimeout(() => tone(880, 0.12, 0.018), 90);
      updateHUD();
    }
    return;
  }

  if (tennisEncounter.stage === "celebrating" && time - tennisEncounter.startedAt >= TENNIS_LAYOUT.celebrationDuration) {
    tennisEncounter.stage = "complete";
    tennisEncounter.rallyEpoch = time;
    updateHUD();
  }
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
  pool: { color: "#e0b268", durations: [1700, 2400, 8200], poses: ["sniff", "sniff", "interact"], directions: ["left", "right", "right"] },
  cats: { color: "#db9b75", durations: [1350, 1750, 1500], poses: ["emotional", "walk", "emotional"], directions: ["left", "right", "right"] },
  bell: { color: "#b79ac2", durations: [1300, 1700, 2100], poses: ["sit", "emotional", "sit"], directions: ["right", "right", "left"] },
  cinema: { color: "#c6a86b", durations: [1800, 1950, 2350], poses: ["emotional", "emotional", "sit"], directions: ["right", "right", "right"] },
  leap: { color: "#e5bb68", durations: [1750, 1850, ROOFTOP_LEAP_TIMING.duration], poses: ["emotional", "emotional", "idle"], directions: ["right", "right", "left"] }
};

function beginQuestAction(step) {
  const style = questActionStyles[activeQuest.id];
  const stepIndex = activeQuest.step;
  const cameraFocus = Number.isFinite(step.cameraFocus) ? step.cameraFocus : step.x;
  if (activeQuest.id === "pool" && stepIndex === 1) {
    const ball = POOL_LAYOUT.missingBall;
    activeQuest.poolBallStartX = player.x + ball.dogOffsetX;
    activeQuest.poolBallFoundX = clamp(
      player.x + ball.rollClearance,
      ball.foundX,
      ball.returnX - 28
    );
    activeQuest.poolBallDogX = player.x;
  }
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
  if (currentScene === "tennisCourt" && ["escaping", "loose", "returning", "celebrating"].includes(tennisEncounter.stage)) {
    if (tennisEncounter.stage === "escaping") ui.quest.textContent = "Watch where the stray tennis ball lands";
    else if (["loose", "returning"].includes(tennisEncounter.stage)) ui.quest.textContent = "Nudge the tennis ball back onto the court";
    else ui.quest.textContent = "The late rally can continue";
    ui.count.textContent = "A small detour";
    appendPips(1, tennisEncounter.stage === "celebrating" ? 0 : 1); return;
  }
  if (!journey.market || currentScene !== "market") {
    const found = memorySpots.filter((spot) => spot.seen).length;
    ui.quest.textContent = currentScene === "entrance" ? "Stand in the doorway and press Up" : "Follow the evening road to the market";
    ui.count.textContent = found ? `${found} small ${found === 1 ? "moment" : "moments"} noticed` : "The market is ahead";
    const route = ["bench", "tennisCourt", "aquarium", "dateNight", "catStories", "cinemaStreet", "entrance"];
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
  updateTennisEncounter(time);
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
    nearbyTraveller = false; nearbyTravelTag = false; nearbyTennisBall = false;
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
    if (!journey.returning && !activeQuest && currentScene === "tennisCourt" && tennisEncounter.stage === "loose") {
      nearbyTennisBall = Math.abs(player.x - tennisEncounter.ballX) < TENNIS_LAYOUT.interactionRadius;
    }
    if (activeQuest && activeQuest.stage === "solve" && currentScene === activeQuest.interior) {
      const step = activeQuest.steps[activeQuest.step];
      if (step && Math.abs(player.x - step.x) < 70) nearbyQuestStep = step;
    }
    if (journey.returning && currentScene === "bench" && Math.abs(player.x - 820) < 88) nearbyReunion = true;

    const door = getActiveDoor();
    ui.prompt.hidden = !door && !nearbyQuestStep && !nearbyReunion && !nearbyTravelTag && !nearbyTraveller && !nearbyTennisBall && !nearbyMemory && !nearbyFlower;
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
    } else if (nearbyTennisBall) {
      ui.promptKey.textContent = "E";
      ui.promptKicker.textContent = "A stray ball on the pavement";
      ui.promptLabel.textContent = "Nudge it back onto the court";
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
  drawSceneBackground(); drawTennisVignette(time); drawQuestSetPieces(time); drawSoldOutDisplays(time); drawDoorHints(time); drawMemoryProps(time); drawTravellerHints(time); drawQuestHint(time); drawFlowerMarkers(time); drawNPCs(time);
  if (!['title', 'select', 'loading'].includes(state)) {
    const actionArc = questAction ? Math.sin(questAction.progress * Math.PI) : 0;
    const tennisProgress = state === "tennisAction" ? clamp((time - tennisEncounter.startedAt) / TENNIS_LAYOUT.returnDuration, 0, 1) : 0;
    const tennisArc = Math.sin(tennisProgress * Math.PI);
    const actionShift = (questAction && !["sit", "idle"].includes(player.pose) ? actionArc * 7 : 0) + tennisArc * 5;
    const actionLift = (questAction && player.pose !== "sit" ? actionArc * 3 : 0) + tennisArc * 1.5;
    const playerScale = SCENES[currentScene].playerScale || 1;
    const poolDogDrawn = drawPoolQuestDog(time, player.x + actionShift, player.y - actionLift);
    if (!poolDogDrawn) drawDogSprite(ctx, player.x + actionShift, player.y - actionLift, player.type, player.pose, player.direction, player.walkFrame, playerScale);
    if (journey.returning && currentScene === "bench" && endingFlower) drawCarriedFlower(player.x, player.y, player.direction, endingFlower, time);
  }
  drawPoolForegroundOcclusion();
  drawWorldParticles(); ctx.restore();
  drawLighting(time);
}

function drawPoolQuestDog(time, x, footY) {
  if (
    currentScene !== "poolInside" || activeQuest?.id !== "pool" ||
    questAction?.questId !== "pool" || !assets.poolDogActions ||
    ![1, 2].includes(questAction.stepIndex)
  ) return false;

  const progress = questAction.progress;
  const stepIndex = questAction.stepIndex;

  // The exposed-ball interaction must begin on the same authored interaction
  // pose used everywhere else. Returning false lets the normal dog renderer
  // draw that exact frame, avoiding a scale or silhouette swap on the click.
  if (stepIndex === 2 && progress < POOL_BALL_STANDARD_INTERACT_BEAT) return false;

  let frame;
  if (stepIndex === 1) {
    frame = progress < 0.12 ? 0
      : progress < 0.28 ? 1
      : progress < 0.48 ? 2
      : progress < 0.66 ? 3
      : progress < 0.86 ? 4
      : 5;
  } else {
    frame = progress < 0.22 ? 4 : 5;
  }

  const reachShift = stepIndex === 1
    ? Math.sin(clamp((progress - 0.42) / 0.48, 0, 1) * Math.PI) * 4
    : Math.sin(clamp(progress / 0.24, 0, 1) * Math.PI) * 3;
  const atlas = assets.poolDogActions;
  const row = player.type === "maltese" ? 1 : 0;
  const sourceWidth = atlas.width / 6;
  const sourceHeight = atlas.height / 2;
  // The source poses occupy different amounts of their cells. Use the normal
  // authored static height as the single body-scale reference, and ground each
  // frame from its own paw line. Extended poses may become wider naturally,
  // but the dog's head, torso and legs never inflate or shrink.
  const standingSourceHeights = [190.5, 193.5];
  const frameBaselines = [
    [343, 343, 349, 348, 352, 348],
    [297, 297, 303, 301, 305, 302]
  ];
  const sceneScale = SCENES[currentScene].playerScale || 1;
  const interactionTargetHeight = DOG_RENDER_HEIGHTS.static * DOG_ART_SCALE * sceneScale;
  const scale = interactionTargetHeight / standingSourceHeights[row];
  const baseline = frameBaselines[row][frame];
  const drawX = x + reachShift;

  const shadowWidth = (frame === 4 ? 40 : 36) * DOG_ART_SCALE * sceneScale;
  drawPixelContactShadow(drawX, footY - 1, shadowWidth, 0.29);
  ctx.save();
  ctx.translate(Math.round(drawX), Math.round(footY));
  ctx.filter = dogSceneFilter();
  ctx.drawImage(
    atlas,
    frame * sourceWidth, row * sourceHeight, sourceWidth, sourceHeight,
    -sourceWidth * scale / 2, -baseline * scale, sourceWidth * scale, sourceHeight * scale
  );
  ctx.restore();
  return true;
}

function drawPoolForegroundOcclusion() {
  if (currentScene !== "poolInside" || !assets.poolInside) return;
  const foreground = POOL_LAYOUT.table.foreground;
  ctx.save();
  ctx.beginPath();
  foreground.body.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  foreground.legs.forEach((leg) => ctx.rect(leg.x, leg.y, leg.width, leg.height));
  ctx.clip();
  drawImageCover(assets.poolInside, SCENES.poolInside.width, 540);
  ctx.restore();
}

function drawTennisVignette(time) {
  if (currentScene !== "tennisCourt" || journey.returning || activeQuest || !assets.tennisPlayers) return;
  const layout = TENNIS_LAYOUT.court;
  let playerAFrame = 0;
  let playerBFrame = 0;
  let rallyBall = null;

  if (["rally", "complete"].includes(tennisEncounter.stage)) {
    const phase = ((time - tennisEncounter.rallyEpoch) % 2800 + 2800) % 2800 / 2800;
    const firstHalf = phase < 0.5;
    const local = firstHalf ? phase / 0.5 : (phase - 0.5) / 0.5;
    if (firstHalf) {
      playerAFrame = local < 0.1 ? 2 : local < 0.3 ? 3 : 0;
      playerBFrame = local > 0.7 ? 1 : 0;
      rallyBall = local < 0.1 ? null : tennisRallyBall(layout.playerAX + 31, layout.playerAY - 69, layout.playerBX - 31, layout.playerBY - 70, local);
    } else {
      playerBFrame = local < 0.1 ? 2 : local < 0.3 ? 3 : 0;
      playerAFrame = local > 0.7 ? 1 : 0;
      rallyBall = local < 0.1 ? null : tennisRallyBall(layout.playerBX - 31, layout.playerBY - 70, layout.playerAX + 31, layout.playerAY - 69, local);
    }
  } else if (tennisEncounter.stage === "escaping") {
    const progress = clamp((time - tennisEncounter.startedAt) / TENNIS_LAYOUT.escapeDuration, 0, 1);
    playerBFrame = progress < 0.1 ? 1 : progress < 0.23 ? 2 : progress < 0.48 ? 3 : 4;
    playerAFrame = progress > 0.58 ? 4 : 0;
  } else if (tennisEncounter.stage === "celebrating") {
    playerAFrame = 0;
    playerBFrame = 5;
  } else {
    playerAFrame = 4;
    playerBFrame = 4;
  }

  drawTennisPlayer(0, playerAFrame, layout.playerAX, layout.playerAY, layout.playerAHeight);
  drawTennisPlayer(1, playerBFrame, layout.playerBX, layout.playerBY, layout.playerBHeight);
  if (rallyBall) drawTennisBall(rallyBall.x, rallyBall.y, 4, time / 80, false);

  const escapingProgress = tennisEncounter.stage === "escaping"
    ? clamp((time - tennisEncounter.startedAt) / TENNIS_LAYOUT.escapeDuration, 0, 1)
    : 1;
  if (["escaping", "loose", "returning"].includes(tennisEncounter.stage) && escapingProgress >= 0.12) {
    const receding = tennisEncounter.stage === "returning";
    const returnProgress = receding ? clamp((time - tennisEncounter.startedAt) / TENNIS_LAYOUT.returnDuration, 0, 1) : 0;
    const radius = receding ? 6 - returnProgress * 2.5 : 6;
    const onPavement = !receding || returnProgress < 0.6;
    drawTennisBall(tennisEncounter.ballX, tennisEncounter.ballY, radius, tennisEncounter.ballSpin, onPavement);
  }

  if (tennisEncounter.stage === "celebrating" && time < tennisEncounter.speechUntil) {
    drawTennisSpeech(layout.playerBX - 18, layout.playerBY - layout.playerBHeight - 14, "Still in.");
  }

  if (state === "playing" && tennisEncounter.stage === "loose") {
    const distance = Math.abs(player.x - tennisEncounter.ballX);
    if (distance < 185) drawWorldIndicator(tennisEncounter.ballX, tennisEncounter.ballY - 78, "E", time, distance < TENNIS_LAYOUT.interactionRadius);
  }
}

function drawTennisPlayer(row, frame, x, footY, height) {
  const image = assets.tennisPlayers;
  const cell = 362;
  const drawWidth = height;
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#0b1021";
  ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(footY + 1), drawWidth * 0.22, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.96;
  ctx.drawImage(image, frame * cell, row * cell, cell, cell, Math.round(x - drawWidth / 2), Math.round(footY - height), drawWidth, height);
  ctx.restore();
}

function tennisRallyBall(startX, startY, endX, endY, progress) {
  return {
    x: startX + (endX - startX) * progress,
    y: startY + (endY - startY) * progress - Math.sin(progress * Math.PI) * 72
  };
}

function drawTennisBall(x, y, radius, rotation, onPavement) {
  ctx.save();
  if (onPavement) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#0a0c18";
    ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y + radius * 0.78), radius * 1.25, radius * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(rotation);
  ctx.fillStyle = "#d9d562";
  ctx.strokeStyle = "#55552f";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "rgba(255,250,184,.72)";
  ctx.beginPath();
  ctx.arc(-radius * 0.48, 0, radius * 0.72, -Math.PI * 0.58, Math.PI * 0.58);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,247,173,.62)";
  ctx.fillRect(-radius * 0.35, -radius * 0.55, Math.max(1, radius * 0.45), Math.max(1, radius * 0.3));
  ctx.restore();
}

function drawTennisSpeech(x, y, text) {
  ctx.save();
  ctx.font = "600 11px DM Mono, monospace";
  const width = text.length * 7 + 20;
  ctx.fillStyle = "rgba(18,17,31,.93)";
  ctx.strokeStyle = "rgba(237,204,132,.88)";
  ctx.lineWidth = 1.5;
  ctx.fillRect(Math.round(x - width / 2), Math.round(y - 22), width, 24);
  ctx.strokeRect(Math.round(x - width / 2) + 0.5, Math.round(y - 22) + 0.5, width - 1, 23);
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 1); ctx.lineTo(x + 1, y + 8); ctx.lineTo(x + 5, y + 1);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f4e9d3";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, Math.round(x), Math.round(y - 10));
  ctx.restore();
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
  const ballSize = 15;
  const ballRadius = ballSize / 2;

  // The coloured balls and their triangle belong to the room artwork. The
  // missing eight is the only separately animated ball, allowing it to retain
  // one scale, one contact shadow and continuous rotation through the search.
  withWorldClip(POOL_LAYOUT.table.surface, () => {
    if (returnProgress >= 1) drawAuthoredPoolEightBall(ball.rackX, ball.rackY, 11, 1, true);
  });

  if (trayProgress > 0) drawPoolSearchTrail(trayProgress);

  const searchingNow = questAction?.questId === "pool" && questAction.stepIndex === 1;
  const returningNow = questAction?.questId === "pool" && questAction.stepIndex === 2;
  if (returnProgress < 1) {
    const searchActionProgress = searchingNow ? questAction.progress : 0;
    const returnActionProgress = returningNow ? questAction.progress : 0;
    const rollOutProgress = clamp(
      (searchActionProgress - ball.rollStart) / (ball.rollEnd - ball.rollStart),
      0,
      1
    );
    const hasBeenFound = (activeQuest.visualStep || 0) > 1 || searchProgress >= 1;
    const rollStartX = activeQuest.poolBallStartX ?? ball.hidingX;
    const discoveredX = activeQuest.poolBallFoundX ?? ball.foundX;

    if (returningNow) {
      if (returnActionProgress < 0.18) {
        const roll = smoothstep(returnActionProgress / 0.18);
        const x = discoveredX + (ball.returnX - discoveredX) * roll;
        const rotation = (discoveredX - rollStartX + x - discoveredX) / ballRadius;
        const rumble = Math.sin(roll * Math.PI * 7) * (1 - roll) * 0.8;
        drawMissingEightBall(x, ball.floorY - Math.abs(rumble), time, 1, rotation);
      } else if (returnActionProgress < 0.53) {
        const rotation = (ball.returnX - rollStartX) / ballRadius;
        drawMissingEightBall(ball.returnX, ball.floorY, time, 1, rotation);
      } else if (returnActionProgress >= 0.95 && returnActionProgress < 0.98) {
        const lower = smoothstep((returnActionProgress - 0.95) / 0.03);
        const x = POOL_LAYOUT.helper.tableX + 34 + (ball.tableDropX - (POOL_LAYOUT.helper.tableX + 34)) * lower;
        const heldBallY = SCENES.poolInside.groundY - 100;
        const y = heldBallY + (ball.tableDropY - heldBallY) * lower;
        drawMissingEightBall(x, y, time, 1, (ball.returnX - rollStartX) / ballRadius + lower * Math.PI);
      } else if (returnActionProgress >= 0.98) {
        const settle = smoothstep((returnActionProgress - 0.98) / 0.02);
        const x = ball.tableDropX + (ball.rackX - ball.tableDropX) * settle;
        const y = ball.tableDropY + (ball.rackY - ball.tableDropY) * settle - Math.sin(settle * Math.PI) * 2;
        const rotation = (ball.returnX - rollStartX + x - ball.tableDropX) / ballRadius;
        drawAuthoredPoolEightBall(x, y, 11, 1, true, rotation);
      }
    } else if (searchingNow && searchActionProgress >= ball.rollStart) {
      const dogActionShift = Math.sin(searchActionProgress * Math.PI) * 3;
      const dogCoverEdge = (activeQuest.poolBallDogX ?? player.x) + dogActionShift + ball.dogCoverHalfWidth;
      const coveredX = dogCoverEdge - ballRadius - 1;
      const clearedX = dogCoverEdge + ballRadius + ball.clearPadding;
      const approachProgress = smoothstep(clamp(rollOutProgress / ball.emergenceStart, 0, 1));
      const emergenceProgress = smoothstep(clamp(
        (rollOutProgress - ball.emergenceStart) / (ball.emergenceEnd - ball.emergenceStart),
        0,
        1
      ));
      const rollAwayProgress = smoothstep(clamp(
        (rollOutProgress - ball.emergenceEnd) / (1 - ball.emergenceEnd),
        0,
        1
      ));
      let x;
      if (rollOutProgress < ball.emergenceStart) {
        x = rollStartX + (coveredX - rollStartX) * approachProgress;
      } else if (rollOutProgress < ball.emergenceEnd) {
        x = coveredX + (clearedX - coveredX) * emergenceProgress;
      } else {
        x = clearedX + (discoveredX - clearedX) * rollAwayProgress;
      }
      const rotation = (x - rollStartX) / ballRadius;
      const dislodgeLift = Math.sin(rollOutProgress * Math.PI) * (1 - rollOutProgress) * 1.8;
      // Quest set pieces render before the dog. The reveal clip keeps the ball
      // behind the reaching paw until its complete silhouette clears the dog.
      withWorldClip({ x: dogCoverEdge, y: ball.floorY - 18, width: ball.returnX - dogCoverEdge + 24, height: 22 }, () => {
        drawMissingEightBall(x, ball.floorY - dislodgeLift, time, 1, rotation);
      });
    } else if (hasBeenFound) {
      const settledRotation = (discoveredX - rollStartX) / ballRadius;
      drawMissingEightBall(discoveredX, ball.floorY, time, 1, settledRotation);
    }
  }

  if (questAction?.questId === "pool" && questAction.stepIndex === 0) {
    drawPixelGlint(POOL_LAYOUT.interactions.wallTray, 319, Math.sin(trayProgress * Math.PI) * 0.45, "#c8a76b");
  }
}

function drawMissingEightBall(x, y, time, alpha = 1, rotation = 0) {
  drawAuthoredPoolEightBall(x, y, 13, alpha, false, rotation);
}

const poolEightBallRect = { x: 298, y: 285, width: 658, height: 655 };

function drawAuthoredPoolEightBall(x, y, size, alpha = 1, onFelt = false, rotation = 0) {
  if (!assets.poolEightBall) return;
  ctx.save();
  ctx.globalAlpha = alpha * (onFelt ? 0.16 : 0.28);
  ctx.fillStyle = onFelt ? "#14271d" : "#18130f";
  ctx.fillRect(Math.round(x - size * 0.42), Math.round(y), Math.max(2, Math.round(size * 0.84)), onFelt ? 1 : 2);
  ctx.globalAlpha = alpha;
  ctx.filter = onFelt
    ? "saturate(.52) brightness(.62) contrast(1.04)"
    : "saturate(.58) brightness(.7) contrast(1.05)";
  ctx.translate(Math.round(x), Math.round(y - size / 2));
  ctx.rotate(rotation);
  ctx.drawImage(
    assets.poolEightBall,
    poolEightBallRect.x, poolEightBallRect.y, poolEightBallRect.width, poolEightBallRect.height,
    Math.round(-size / 2), Math.round(-size / 2), size, size
  );
  ctx.restore();
}

function drawPoolSearchTrail(progress) {
  const reveal = clamp(progress * 1.6, 0, 1);
  const points = [[372, 430], [401, 438], [430, 442], [454, 447], [476, 449]];
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
    drawDogSprite(ctx, 918, 426, otherType, "sit", "left", 0, 1);
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
  if (activeQuest.id === "pool") {
    drawPoolQuestPlayer(time);
    return;
  }
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

function drawPoolQuestPlayer(time) {
  if (!assets.poolPlayerSequence) return;
  const layout = POOL_LAYOUT.helper;
  const footY = SCENES.poolInside.groundY + 1;
  let x = layout.x;
  let row = 0;
  let frame = 0;
  let direction = "left";
  let bob = 0;
  let carryFrame = -1;
  const poolAction = questAction?.questId === "pool" ? questAction : null;

  if (poolAction?.stepIndex === 0) {
    const progress = poolAction.progress;
    frame = progress < 0.22 ? 2 : progress < 0.72 ? 3 : 4;
  } else if (poolAction?.stepIndex === 1) {
    frame = poolAction.progress < 0.5 ? 2 : 4;
  } else if (poolAction?.stepIndex === 2) {
    const progress = poolAction.progress;
    if (progress < 0.18) {
      frame = 2;
    } else if (progress < 0.28) {
      frame = 0;
    } else if (progress < 0.42) {
      const travel = smoothstep((progress - 0.28) / 0.14);
      x = layout.x + (layout.pickupX - layout.x) * travel;
      row = 1;
      frame = Math.floor(travel * 5) % 8;
      direction = "left";
      bob = [0, 1, 2, 1, 0, 1, 2, 1][frame];
    } else if (progress < 0.68) {
      x = layout.pickupX;
      row = 2;
      frame = Math.min(6, Math.floor(((progress - 0.42) / 0.26) * 7));
      direction = progress < 0.61 ? "left" : "right";
    } else if (progress < 0.91) {
      const travel = smoothstep((progress - 0.68) / 0.23);
      x = layout.pickupX + (layout.tableX - layout.pickupX) * travel;
      carryFrame = Math.min(7, Math.floor(travel * 8));
      direction = "right";
      bob = [0, 1, 2, 1, 0, 1, 2, 1][carryFrame];
    } else if (progress < 0.95) {
      x = layout.tableX;
      row = 2;
      frame = 6;
      direction = "right";
    } else {
      x = layout.tableX;
      frame = 7;
      direction = "left";
    }
  } else if ((activeQuest.visualStep || 0) >= 3) {
    x = layout.tableX;
    frame = 7;
    direction = "left";
  } else if ((activeQuest.visualStep || 0) >= 1) {
    frame = 2;
  }

  drawPixelContactShadow(x, footY + 1, carryFrame >= 0 || row === 1 ? 35 : 31, 0.25);
  if (carryFrame >= 0) drawPoolPlayerCarryFrame(carryFrame, x, footY - bob);
  else drawPoolPlayerSequenceFrame(row, frame, x, footY - bob, direction);
}

function drawPoolPlayerCarryFrame(frame, x, footY) {
  const image = assets.poolPlayerCarry;
  if (!image) {
    // Loading failures should not hide the actor; the normalized walk atlas is
    // a safe visual fallback, while the loose ball remains suppressed.
    drawPoolPlayerSequenceFrame(1, frame, x, footY, "right");
    return;
  }
  const columns = 8;
  const sourceWidth = image.width / columns;
  const sourceHeight = image.height;
  const authoredVisibleHeight = 345;
  const authoredBaseline = 392;
  const scale = POOL_LAYOUT.helper.height / authoredVisibleHeight;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY));
  ctx.filter = "saturate(.9) brightness(.93) contrast(1.05)";
  ctx.drawImage(
    image,
    frame * sourceWidth, 0, sourceWidth, sourceHeight,
    -sourceWidth * scale / 2, -authoredBaseline * scale, sourceWidth * scale, sourceHeight * scale
  );
  ctx.restore();
}

function drawPoolPlayerSequenceFrame(row, frame, x, footY, direction) {
  const image = assets.poolPlayerSequence;
  if (!image) return;
  const columns = 8;
  const rows = 3;
  const sourceWidth = image.width / columns;
  const sourceHeight = image.height / rows;
  const scale = POOL_LAYOUT.helper.height / 250;
  const baseline = 298;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY));
  if (direction === "left") ctx.scale(-1, 1);
  ctx.filter = "saturate(.9) brightness(.93) contrast(1.05)";
  ctx.drawImage(
    image,
    frame * sourceWidth, row * sourceHeight, sourceWidth, sourceHeight,
    -sourceWidth * scale / 2, -baseline * scale, sourceWidth * scale, sourceHeight * scale
  );
  ctx.restore();
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
  { kind: "marshall", start: 448, end: 705, startMs: 0, runDuration: 800, exitDuration: 420 },
  { kind: "robin", start: 332, end: 765, startMs: 2040, runDuration: 1200, exitDuration: 520 },
  { kind: "barney", start: 272, end: 825, startMs: 4480, runDuration: 1500, exitDuration: 850 },
  { kind: "lily", start: 390, end: 885, startMs: 7220, runDuration: 900, exitDuration: 1180 },
  { kind: "ted", start: 208, end: 945, startMs: 9360, runDuration: 1850, exitDuration: 1520 }
];

function drawRooftopCast(time) {
  if (currentScene !== "rooftop" || activeQuest?.id !== "leap") return;
  const footY = ROOFTOP_LAYOUT.castFootY;
  // Use the action's linear clock with an authored schedule. Different starting
  // distances receive different run-up lengths, keeping the cast at a believable
  // pace while preserving a clear pause between landings and the next takeoff.
  const crossing = questAction?.questId === "leap" && questAction.stepIndex === 2
    ? questAction.progress
    : questVisualProgress(2);
  const elapsed = crossing * ROOFTOP_LEAP_TIMING.duration;
  rooftopCastPlan.forEach((actor, index) => {
    drawRooftopLeapActor(actor, elapsed - actor.startMs, footY, time, index);
  });
}

const rooftopRunFrameRects = {
  ted: [
    { x: 120, y: 33, width: 148, height: 196 },
    { x: 374, y: 33, width: 159, height: 196 },
    { x: 652, y: 36, width: 161, height: 193 },
    { x: 916, y: 35, width: 172, height: 193 }
  ],
  marshall: [
    { x: 112, y: 246, width: 167, height: 213 },
    { x: 388, y: 248, width: 156, height: 211 },
    { x: 654, y: 253, width: 172, height: 202 },
    { x: 934, y: 251, width: 167, height: 208 }
  ],
  robin: [
    { x: 115, y: 486, width: 155, height: 213 },
    { x: 384, y: 488, width: 153, height: 211 },
    { x: 647, y: 489, width: 171, height: 207 },
    { x: 943, y: 489, width: 150, height: 207 }
  ],
  lily: [
    { x: 127, y: 708, width: 134, height: 229 },
    { x: 392, y: 710, width: 131, height: 227 },
    { x: 669, y: 715, width: 142, height: 216 },
    { x: 947, y: 717, width: 132, height: 222 }
  ],
  barney: [
    { x: 117, y: 966, width: 144, height: 206 },
    { x: 384, y: 966, width: 141, height: 206 },
    { x: 664, y: 960, width: 156, height: 198 },
    { x: 935, y: 965, width: 158, height: 196 }
  ]
};

const rooftopRunDrawHeights = { ted: 122, marshall: 124, robin: 123, lily: 127, barney: 116 };

const rooftopJumpFrameRects = {
  ted: { x: 58, y: 233, width: 307, height: 325 },
  marshall: { x: 456, y: 162, width: 333, height: 373 },
  lily: { x: 899, y: 233, width: 168, height: 296 },
  robin: { x: 1136, y: 190, width: 340, height: 337 },
  barney: { x: 1540, y: 234, width: 368, height: 285 }
};

const rooftopJumpDrawHeights = { ted: 110, marshall: 116, lily: 101, robin: 113, barney: 105 };

function drawRooftopLeapActor(actor, elapsed, footY, time, index) {
  if (elapsed <= 0) {
    drawRooftopStandingActor(actor.kind, actor.start, footY, time, index);
    return;
  }

  const jumpStart = actor.runDuration;
  const landingTime = jumpStart + ROOFTOP_LEAP_TIMING.jumpDuration;
  const finishTime = landingTime + actor.exitDuration;
  if (elapsed >= finishTime) {
    drawRooftopStandingActor(actor.kind, actor.end, footY, time, index);
    return;
  }

  const takeoffX = ROOFTOP_LAYOUT.jump.takeoffX;
  const landingX = ROOFTOP_LAYOUT.jump.landingX;
  let x; let y = footY;
  if (elapsed < jumpStart) {
    const runTime = elapsed;
    const runProgress = clamp(runTime / actor.runDuration, 0, 1);
    // A shallow acceleration avoids both the old slide and an abrupt sprint.
    const run = runProgress * (0.35 + 0.65 * runProgress);
    x = actor.start + (takeoffX - actor.start) * run;
    drawPixelContactShadow(x, footY + 1, actor.kind === "marshall" ? 46 : 34, 0.24);
    drawRooftopRunSprite(actor.kind, x, y, runTime);
    return;
  } else if (elapsed < landingTime) {
    const leap = smoothstep((elapsed - jumpStart) / ROOFTOP_LEAP_TIMING.jumpDuration);
    x = takeoffX + (landingX - takeoffX) * leap;
    y = footY - Math.sin(leap * Math.PI) * ROOFTOP_LAYOUT.jump.apex;
    if (leap < 0.14) drawPixelContactShadow(takeoffX, footY + 1, 30 * (1 - leap / 0.14), 0.14);
    if (leap > 0.82) drawPixelContactShadow(landingX, footY + 1, 30 * ((leap - 0.82) / 0.18), 0.16);
    drawRooftopJumpSprite(actor.kind, x, y);
  } else {
    const exitTime = elapsed - landingTime;
    const settle = smoothstep(exitTime / actor.exitDuration);
    x = landingX + (actor.end - landingX) * settle;
    drawPixelContactShadow(x, footY + 1, actor.kind === "marshall" ? 44 : 32, 0.24);
    drawRooftopRunSprite(actor.kind, x, y, jumpStart + exitTime);
  }

  const timeSinceLanding = elapsed - landingTime;
  if (timeSinceLanding > 0 && timeSinceLanding < 260) {
    const impact = Math.sin((timeSinceLanding / 260) * Math.PI);
    ctx.save(); ctx.globalAlpha = impact * 0.34; ctx.fillStyle = "#9b8b76";
    ctx.fillRect(Math.round(landingX - 25), Math.round(footY - 5 - impact * 3), 3, 2);
    ctx.fillRect(Math.round(landingX + 20), Math.round(footY - 3 - impact * 2), 2, 2);
    ctx.restore();
  }
}

function drawRooftopRunSprite(kind, x, footY, elapsed) {
  const frames = rooftopRunFrameRects[kind];
  if (!assets.rooftopRuns || !frames) {
    drawRooftopStandingActor(kind, x, footY, elapsed, 0);
    return;
  }
  const frame = frames[Math.floor(elapsed / ROOFTOP_LEAP_TIMING.runFrameDuration) % frames.length];
  const tallestFrame = Math.max(...frames.map((candidate) => candidate.height));
  const sourceScale = rooftopRunDrawHeights[kind] / tallestFrame;
  const drawWidth = frame.width * sourceScale;
  const drawHeight = frame.height * sourceScale;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY));
  ctx.filter = "saturate(.88) brightness(.92) contrast(1.05)";
  ctx.drawImage(
    assets.rooftopRuns,
    frame.x, frame.y, frame.width, frame.height,
    -drawWidth / 2, -drawHeight, drawWidth, drawHeight
  );
  ctx.restore();
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
  const drawHeight = (running ? DOG_RENDER_HEIGHTS.run : walking ? DOG_RENDER_HEIGHTS.walk : DOG_RENDER_HEIGHTS.static) * scale;
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
    const profile = dogSelectionPortraitProfiles[preview.dataset.dogPreview] || dogSelectionPortraitProfiles.maltipoo;
    drawDogSprite(previewCtx, profile.x, profile.footY, preview.dataset.dogPreview, "idle", "right", 0, profile.scale);
  });
}

const dogSelectionPortraitProfiles = Object.freeze({
  maltipoo: { x: 120, footY: 150, scale: 1.4 },
  maltese: { x: 120, footY: 150, scale: 1.44 }
});

const visitorPortraitRects = {
  tankkeeper: { x: 300, y: 77, size: 128 },
  poolplayer: { x: 710, y: 80, size: 126 },
  catkeeper: { x: 1085, y: 84, size: 128 },
  bellkeeper: { x: 306, y: 542, size: 126 },
  // The leap portraits share an authored eye-line. Ted's previous crop began
  // too far left, leaving the fox muzzle pressed against the right edge.
  ted: { centerX: 770, eyeY: 606, size: 144 },
  florist: { x: 1080, y: 533, size: 134 }
};

const supportingPortraitRects = {
  marshall: { centerX: 234, eyeY: 220, size: 180 },
  // Lily's ears may leave the top of the portrait naturally; keeping her eyes
  // on the cast eye-line prevents the face and muzzle being crushed at bottom.
  lily: { centerX: 574, eyeY: 260, size: 190 },
  robin: { centerX: 894, eyeY: 262, size: 180 },
  barney: { centerX: 1230, eyeY: 302, size: 180 },
  bell: { x: 1435, y: 443, size: 165 }
};

const PORTRAIT_EYE_LINE = 0.46;
const PORTRAIT_CANVAS_SIZE = 112;
const PORTRAIT_CONTENT_PADDING = 8;
const dogDialoguePortraitProfiles = Object.freeze({
  maltipoo: { x: 56, footY: 104, scale: 1 },
  maltese: { x: 56, footY: 104, scale: 1.03 }
});
const visitorPortraitPadding = Object.freeze({
  tankkeeper: 10,
  poolplayer: 8,
  catkeeper: 8,
  bellkeeper: 8,
  ted: 8,
  florist: 10
});
const supportingPortraitPadding = Object.freeze({
  marshall: 10,
  lily: 8,
  robin: 8,
  barney: 8,
  bell: 13
});

function portraitSourceRect(portrait) {
  if (!Number.isFinite(portrait.centerX) || !Number.isFinite(portrait.eyeY)) return portrait;
  return {
    x: Math.round(portrait.centerX - portrait.size / 2),
    y: Math.round(portrait.eyeY - portrait.size * PORTRAIT_EYE_LINE),
    size: portrait.size
  };
}

function fillPortraitBackground(start, end) {
  const gradient = portraitCtx.createLinearGradient(0, 0, PORTRAIT_CANVAS_SIZE, PORTRAIT_CANVAS_SIZE);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  portraitCtx.fillStyle = gradient;
  portraitCtx.fillRect(0, 0, PORTRAIT_CANVAS_SIZE, PORTRAIT_CANVAS_SIZE);
}

function drawContainedPortrait(image, source, filter, padding = PORTRAIT_CONTENT_PADDING) {
  if (!image) return;
  const sourceWidth = source.width || source.size;
  const sourceHeight = source.height || source.size;
  const available = PORTRAIT_CANVAS_SIZE - padding * 2;
  const scale = Math.min(available / sourceWidth, available / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = (PORTRAIT_CANVAS_SIZE - drawWidth) / 2;
  const drawY = (PORTRAIT_CANVAS_SIZE - drawHeight) / 2;
  portraitCtx.save();
  portraitCtx.filter = filter;
  portraitCtx.drawImage(
    image,
    source.x, source.y, sourceWidth, sourceHeight,
    drawX, drawY, drawWidth, drawHeight
  );
  portraitCtx.restore();
}

function drawPortrait(kind) {
  portraitCtx.clearRect(0, 0, PORTRAIT_CANVAS_SIZE, PORTRAIT_CANVAS_SIZE);
  if (kind === "player") {
    fillPortraitBackground("#705366", "#352b45");
    const profile = dogDialoguePortraitProfiles[player.type] || dogDialoguePortraitProfiles.maltipoo;
    drawDogSprite(portraitCtx, profile.x, profile.footY, player.type, "emotional", "right", 0, profile.scale);
    return;
  }
  if (kind === "traveller" && assets.traveller) {
    fillPortraitBackground("#496f78", "#30283f");
    drawContainedPortrait(assets.traveller, { x: 100, y: 660, width: 122, height: 122 }, "saturate(.94) brightness(.98)", 10);
    return;
  }
  if (kind === "her" && assets.benchCompanion) {
    fillPortraitBackground("#49526a", "#28283d");
    drawContainedPortrait(assets.benchCompanion, { x: 160, y: 219, width: 150, height: 150 }, "saturate(.94) brightness(.98) contrast(1.03)");
    return;
  }
  if (kind === "projectionist" && assets.projectionist) {
    fillPortraitBackground("#684d5b", "#28283d");
    drawContainedPortrait(assets.projectionist, { x: 271, y: 70, width: 128, height: 160 }, "saturate(.9) brightness(.96) contrast(1.03)");
    return;
  }
  const visitorPortrait = visitorPortraitRects[kind];
  if (visitorPortrait && assets.visitors) {
    const source = portraitSourceRect(visitorPortrait);
    fillPortraitBackground("#685066", "#30283e");
    drawContainedPortrait(assets.visitors, source, "saturate(.94) brightness(.98)", visitorPortraitPadding[kind]);
    return;
  }
  const supportingPortrait = supportingPortraitRects[kind];
  if (supportingPortrait && assets.supportingCast) {
    const source = portraitSourceRect(supportingPortrait);
    fillPortraitBackground("#5d536c", "#29283d");
    drawContainedPortrait(assets.supportingCast, source, "saturate(.94) brightness(.98) contrast(1.03)", supportingPortraitPadding[kind]);
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
    tennisCourt: [[198,132,42,.06],[548,130,42,.07],[906,125,48,.08]],
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
function quadraticBezier(start, control, end, progress) {
  const t = clamp(progress, 0, 1);
  const inverse = 1 - t;
  return inverse * inverse * start + 2 * inverse * t * control + t * t * end;
}
function initAudio() { if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === "suspended") audioContext.resume(); }
function tone(frequency,duration,volume) { if (audioMuted || !audioContext) return; const oscillator=audioContext.createOscillator(); const gain=audioContext.createGain(); oscillator.type="sine"; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(volume,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001,audioContext.currentTime+duration); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime+duration); }
function toggleSound() { audioMuted=!audioMuted; ui.soundButton.textContent=audioMuted?"×":"♪"; ui.soundButton.setAttribute("aria-label",audioMuted?"Enable sound":"Mute sound"); if(!audioMuted){initAudio();tone(659,0.1,0.025);} }
function loop(time) { const delta=Math.min((time-lastTime)/1000,0.04)||0; lastTime=time; update(delta,time); draw(time); requestAnimationFrame(loop); }

updateHUD(); requestAnimationFrame(loop);
