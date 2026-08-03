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
    doors: [{ x: 400, radius: 76, target: "aquariumInside", spawnX: 155, label: "Enter the aquarium", quest: "aquarium" }] },
  dateNight: { asset: "dateNight", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 155, radius: 78, target: "poolInside", spawnX: 155, label: "Enter the pool hall", quest: "pool" }] },
  catStories: { asset: "catStories", width: 1100, minX: 105, maxX: 995, groundY: 458,
    doors: [{ x: 125, radius: 76, target: "catInside", spawnX: 155, label: "Enter the cat cafe", quest: "cats" }] },
  entrance: {
    asset: "entrance", width: 960, minX: 120, maxX: 850, groundY: 452,
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
    doors: [{ x: 88, radius: 72, target: "aquarium", spawnX: 400, label: "Leave the aquarium" }] },
  // The pool table occupies the rest of the one-dimensional walk line. Stopping
  // at its near corner keeps the dog beside it instead of drawing through it.
  poolInside: { asset: "poolInside", width: 1100, minX: 70, maxX: 720, groundY: 458,
    doors: [{ x: 150, radius: 78, target: "dateNight", spawnX: 155, label: "Leave the pool hall" }] },
  catInside: { asset: "catInside", width: 1100, minX: 70, maxX: 1030, groundY: 458,
    doors: [{ x: 90, radius: 72, target: "catStories", spawnX: 125, label: "Leave the cat cafe" }] },
  bellHome: { asset: "bellHome", width: 1100, minX: 70, maxX: 1030, groundY: 456,
    doors: [{ x: 92, radius: 72, target: "bench", spawnX: 210, label: "Step back outside" }] },
  rooftop: { asset: "rooftop", width: 1100, minX: 70, maxX: 1030, groundY: 430,
    doors: [{ x: 92, radius: 72, target: "entrance", spawnX: 825, label: "Return downstairs" }] }
};

const assetSources = {
  bench: "assets/bench-benchmark-v1.png",
  benchCompanion: "assets/character-companion-authored-v2.png",
  aquarium: "assets/exterior-aquarium-benchmark-v1.png",
  dateNight: "assets/exterior-date-night-benchmark-v1.png",
  catStories: "assets/exterior-cat-stories-benchmark-v1.png",
  entrance: "assets/market-entrance-benchmark-v1.png",
  market: "assets/market-interior-benchmark-v1.png",
  aquariumInside: "assets/interior-aquarium-benchmark-v1.png",
  poolInside: "assets/interior-pool-benchmark-v1.png",
  catInside: "assets/interior-cat-cafe-benchmark-v2.png",
  bellHome: "assets/interior-bell-home-benchmark-v2.png",
  rooftop: "assets/rooftop-benchmark-v1.png",
  dogMaltipoo: "assets/dog-maltipoo-authored-v2.png",
  dogMaltese: "assets/dog-maltese-authored-v2.png",
  visitors: "assets/character-visitors-authored-v2.png",
  visitorWalk: "assets/character-visitors-walk-v2.png",
  traveller: "assets/character-traveller-authored-v2.png",
  supportingCast: "assets/character-supporting-cast-v2.png"
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
  entrance: { rate: 0.28, palette: ["#8c7955", "#6f7954", "#b38b57"], width: 3, height: 2, vx: [-4, 6], vy: [5, 11] },
  market: { rate: 1.35, palette: ["#d982a4", "#ef8c83", "#f2c24e"], width: 4, height: 2, vx: [-4, 7], vy: [4, 10] },
  aquariumInside: { rate: 0.12, palette: ["#7895a4", "#607d8f"], width: 2, height: 2, vx: [-1, 2], vy: [2, 5] },
  poolInside: { rate: 0.08, palette: ["#8a765b"], width: 2, height: 1, vx: [-1, 2], vy: [2, 4] },
  catInside: { rate: 0.08, palette: ["#9a8065"], width: 2, height: 1, vx: [-1, 2], vy: [2, 4] },
  bellHome: { rate: 0.06, palette: ["#9b866d"], width: 2, height: 1, vx: [-1, 2], vy: [2, 4] },
  rooftop: { rate: 0.18, palette: ["#758099", "#8a866e"], width: 2, height: 2, vx: [-8, -2], vy: [1, 4] }
};
const scene = {
  resolved: 0, darkness: 0,
  aquarium: false, pool: false, cats: false, bell: false, leap: false
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
let dialogue = null;
let lastTime = 0;
let audioMuted = false;
let audioContext = null;
let menuIndex = 0;

const flowerData = {
  peony: { name: "Coral Peony", short: "Peony", color: "#ef8c83", symbol: "✿", anchor: [315, 320], stand: 315 },
  tulip: { name: "Apricot Tulip", short: "Tulip", color: "#f1a062", symbol: "♦", anchor: [445, 310], stand: 445 },
  anemone: { name: "Blue Anemone", short: "Anemone", color: "#8492cc", symbol: "✤", anchor: [575, 320], stand: 575 },
  ranunculus: { name: "Rose Ranunculus", short: "Ranunculus", color: "#d982a4", symbol: "❀", anchor: [710, 315], stand: 710 },
  sunflower: { name: "Little Sunflower", short: "Sunflower", color: "#f2c24e", symbol: "☀", anchor: [855, 300], stand: 855 },
  daisy: { name: "Moon Daisy", short: "Daisy", color: "#fff1db", symbol: "✽", anchor: [985, 320], stand: 985 }
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
      { x: 260, kicker: "The small reef tank", label: "Watch the colourful fish", objective: "Follow the colourful fish", lines: () => [
        line("Narrator", "Red, yellow and blue fish dart into the same tunnel, then double back.", "narrator"),
        dogLine("Not subtle.", "That way."),
        line("Tank Keeper", "They keep circling the coral tunnel. Check behind it for bubbles.", "tankkeeper")
      ] },
      { x: 555, kicker: "A trail of bubbles", label: "Inspect the coral tunnel", objective: "Trace the bubbles through the coral", lines: () => [
        line("Narrator", "Three bubbles rise behind the coral. Then three more. Something large is circling back.", "narrator"),
        line("Tank Keeper", "The trail is moving toward the deep blue tank. Check the far glass for a shadow.", "tankkeeper")
      ] },
      { x: 900, kicker: "The deep blue tank", label: "Find the hidden shark", objective: "Check the shadow in the deep tank", lines: () => [
        line("Narrator", "A dark fin crosses the glass, followed by the rest of the shark.", "narrator"),
        line("Tank Keeper", "Forty-three fish, six rays, one shark. Excellent.", "tankkeeper")
      ] }
    ],
    solved: () => [line("Tank Keeper", "Count fixed. I owe you one. Meet you back at the market.", "tankkeeper")],
    returned: (flower) => [
      line("Tank Keeper", "Shark accounted for. Reef open. I can finally stop counting everything in this aisle.", "tankkeeper"),
      line("The Florist", `You just missed the ${flower.short}. The last stem left with a family in yellow raincoats.`, "florist"),
      line("Tank Keeper", "My shark kept better time than we did.", "tankkeeper"),
      dogLine("Next flower.", "We'll try another.")
    ]
  },
  {
    id: "pool", exterior: "dateNight", interior: "poolInside", place: "pool hall", title: "ONE CLEAN SHOT",
    issuer: { name: "Pool Player", portrait: "poolplayer", sprite: "poolplayer" },
    travelObjective: "Go to the pool hall and help set up one safe shot",
    sellout: { tag: "PAID", accent: "#a66e5b", tilt: 0.035 },
    trigger: (flower) => [
      line("Narrator", `A pool player approaches the ${flower.name} with his cue held unusually close to the floor.`, "narrator"),
      line("Pool Player", "I can make the last shot. I just can't practise it without threatening the ceiling—and possibly the lamp. Could you come to the pool hall and help me set up one safe attempt?", "poolplayer"),
      dogLine("Keep the cue low.", "Show me the table."),
      line("Pool Player", "Exactly. The lamp has already retained counsel.", "poolplayer")
    ],
    arrival: () => [
      line("Pool Player", "House rule for tonight: cue below shoulder height. This rule is mostly about me.", "poolplayer"),
      line("Narrator", "Three pale dents sit directly above the cue rack.", "narrator"),
      line("Pool Player", "Start with the longest cue. Check whether it lines up with those marks.", "poolplayer")
    ],
    steps: [
      { x: 370, kicker: "Marks above the cue rack", label: "Inspect the longest cue", objective: "Check the longest cue beneath the ceiling marks", lines: () => [
        line("Narrator", "The longest cue lines up perfectly with the highest dent.", "narrator"),
        dogLine("Evidence.", "That matches."),
        line("Pool Player", "Next, secure the guard around the hanging lamp. It deserves the protection.", "poolplayer")
      ] },
      { x: 555, kicker: "The hanging table lamp", label: "Lower the lamp guard", objective: "Secure the hanging lamp", lines: () => [
        line("Narrator", "The brass guard locks around the lamp with a solid click.", "narrator"),
        line("Pool Player", "Good. Now set up the final shot and keep the cue below my shoulder.", "poolplayer")
      ] },
      { x: 715, kicker: "The final frame", label: "Set up the last shot", objective: "Line up the final shot", lines: () => [
        line("Narrator", "Four paws make a low bridge. The cue stays level; the ball drops into the corner pocket.", "narrator"),
        line("Pool Player", "Pocketed. Nothing overhead has filed a complaint.", "poolplayer")
      ] }
    ],
    solved: () => [line("Pool Player", "Let's get back before anything else files a complaint.", "poolplayer")],
    returned: (flower) => [
      line("Pool Player", "Ceiling intact. Lamp intact. Confidence completely restored.", "poolplayer"),
      line("The Florist", `The last ${flower.short} was paid for while you were gone. Pickup is at closing.`, "florist"),
      line("Pool Player", "I feel partly responsible for the timing.", "poolplayer"),
      dogLine("You should.", "Only partly.")
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
      { x: 325, kicker: "A crowded feeding corner", label: "Count the dinner bowls", objective: "Count the bowls at the feeding corner", lines: () => [
        line("Narrator", "Three cats. Three bowls. One cat has claimed two opinions.", "narrator"),
        dogLine("Complicated.", "One at a time."),
        line("Cafe Keeper", "Now move the bowls into one row along the counter. They'll follow dinner.", "catkeeper")
      ] },
      { x: 620, kicker: "The cafe counter", label: "Arrange the bowls in a row", objective: "Make a clear dinner row", lines: () => [
        line("Narrator", "The bowls slide into a neat row. All three cats move with them.", "narrator"),
        line("Cafe Keeper", "Efficient. Terrifying, but efficient. The path is clear—ring the brass bell by the cat tree.", "catkeeper")
      ] },
      { x: 965, kicker: "A little brass bell", label: "Ring the delivery bell", objective: "Ring the bell by the cat tree", lines: () => [
        line("Narrator", "The bell rings. The counter stays clear for three full seconds.", "narrator"),
        line("Cafe Keeper", "That's our opening. We train for moments like this.", "catkeeper")
      ] }
    ],
    solved: () => [line("Cafe Keeper", "I'm following you out while they're still chewing. If anyone asks, they approved my break.", "catkeeper")],
    returned: (flower) => [
      line("Cafe Keeper", "Made it. Nobody followed me. I checked twice.", "catkeeper"),
      line("Narrator", `A customer passes the doorway carrying the last ${flower.short}.`, "narrator"),
      line("The Florist", "That was the final bunch.", "florist"),
      line("Cafe Keeper", "Fast shopper. Respect.", "catkeeper"),
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
      line("Bell's Neighbour", "This parcel is for Bell, but she won't let me close enough to deliver it. Could you come to her home and help her get comfortable with a visitor?", "bellkeeper"),
      dogLine("I can wait.", "She can choose."),
      line("Bell's Neighbour", "Good. Bell appreciates patience, distance, and having the final say.", "bellkeeper")
    ],
    arrival: () => [
      line("Narrator", "Bell watches from the armchair. Ears forward. Tail still.", "narrator"),
      line("Bell", "Mrrp.", "bell"),
      line("Bell's Neighbour", "Start on the mat. Let Bell decide whether the distance gets smaller.", "bellkeeper")
    ],
    steps: [
      { x: 210, kicker: "The entry mat", label: "Wait on the mat", objective: "Give Bell some space", lines: () => [
        line("Narrator", `${player.name} sits on the mat. Bell blinks once.`, "narrator"),
        dogLine("No rush.", "I'll wait."),
        line("Bell's Neighbour", "Good. Bring the cloth mouse from the basket halfway toward her—no closer.", "bellkeeper")
      ] },
      { x: 555, kicker: "A basket of cat toys", label: "Bring the cloth mouse closer", objective: "Find Bell's cloth mouse", lines: () => [
        line("Narrator", "The cloth mouse stops halfway to the chair. Bell looks at the toy, then the dog, then the toy.", "narrator"),
        line("Bell's Neighbour", "That's enough. Sit beside the armchair and let Bell choose whether to approach.", "bellkeeper")
      ] },
      { x: 900, kicker: "Bell's armchair", label: "Sit quietly with Bell", objective: "Let Bell choose the distance", lines: () => [
        line("Narrator", "Bell steps down, sniffs one unfamiliar nose, and sits beside it.", "narrator"),
        line("Bell", "Prrrp.", "bell")
      ] }
    ],
    solved: () => [
      line("Bell's Neighbour", "That sound means yes. Or move six centimetres left. Either way, progress.", "bellkeeper"),
      dogLine("I'll take yes.", "That's enough.")
    ],
    returned: (flower) => [
      line("Bell's Neighbour", "Bell accepted the parcel, the ribbon, and half the box. I was allowed to keep the receipt.", "bellkeeper"),
      line("The Florist", `A delivery rider collected the last ${flower.short} five minutes ago.`, "florist"),
      line("Bell's Neighbour", "Bell would respect that schedule.", "bellkeeper"),
      dogLine("Another one, then.", "We still have time.")
    ]
  },
  {
    id: "leap", exterior: "entrance", interior: "rooftop", place: "market rooftop", title: "THE ROOFTOP GAP",
    issuer: { name: "Ted", portrait: "ted", sprite: "ted" },
    travelObjective: "Go to the market rooftop and help make the crossing safe",
    sellout: { tag: "SOLD OUT", accent: "#b5915d", tilt: -0.035 },
    trigger: (flower) => [
      line("Narrator", `Five name cards slide from beneath the ${flower.name}. An orange fox catches four.`, "narrator"),
      line("Ted", "My friends are stuck beside a gap on the market roof. Marshall wants to jump, Lily says absolutely not, and Barney has named the jump. Could you come upstairs and help us build a safe landing first?", "ted"),
      dogLine("Nobody jumps yet.", "Show me the gap.")
    ],
    arrival: () => [
      line("Ted", "For context, the gap looked much smaller from downstairs.", "ted"),
      line("Marshall", "I measured it with my shoe. Four shoes and one bad idea.", "marshall"),
      line("Lily", "Great. We're using the cushions. Start with the pile by the service door and gather anything soft.", "lily")
    ],
    steps: [
      { x: 315, kicker: "A pile of market cushions", label: "Gather the soft cushions", objective: "Collect cushions for the landing", lines: () => [
        line("Narrator", "Cushions, flower sacks and a folded awning make a landing pad.", "narrator"),
        line("Robin", "Now it looks like a bad idea with planning.", "robin"),
        line("Ted", "Carry the pile to the gap and wedge the landing in place.", "ted")
      ] },
      { x: 555, kicker: "The little rooftop gap", label: "Build the landing", objective: "Place the soft landing", lines: () => [
        line("Narrator", "The last cushion wedges into place. Nothing rolls off the roof.", "narrator"),
        line("Barney", "Soft landing, dramatic lighting. This is becoming an event.", "barney"),
        line("Ted", "One thing left: switch on the signal lamp so everyone can see the far edge.", "ted")
      ] },
      { x: 725, kicker: "The market signal lamp", label: "Switch on the landing light", objective: "Light the far side", lines: () => [
        line("Narrator", "The signal lamp comes on. Ted, Marshall, Lily, Robin and Barney cross one at a time.", "narrator"),
        line("Ted", "Okay. Nobody make this symbolic.", "ted")
      ] }
    ],
    solved: () => [
      line("Lily", "It looks planned now. Let's get off the roof before Barney adds a ribbon cutting.", "lily"),
      line("Ted", "Back downstairs.", "ted")
    ],
    returned: (flower) => [
      line("Ted", "Crossing complete. Marshall counted six people, which is impressive because there were five of us.", "ted"),
      line("The Florist", `The last ${flower.short} went into the closing bundle. It left about a minute ago.`, "florist"),
      line("Ted", "We took longer than a four-shoe gap should.", "ted"),
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
  if (state === "title") return [document.querySelector("#start-button")];
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

function resetGame() {
  flowers.forEach((flower) => { flower.active = true; flower.sale = null; });
  memorySpots.forEach((spot) => { spot.seen = false; });
  choiceMemories.length = 0; particles.length = 0;
  Object.assign(scene, { resolved: 0, darkness: 0, aquarium: false, pool: false, cats: false, bell: false, leap: false });
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
  currentFlower = null; endingFlower = null; activeQuest = null;
  nearbyFlower = null; nearbyMemory = null; nearbyQuestStep = null; nearbyReunion = false;
  nearbyTraveller = false; nearbyTravelTag = false; dialogue = null;
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
        activeQuest.visitorPhase = "returning";
        activeQuest.visitorDirection = "left";
        activeQuest.visitorX = clamp(player.x + 108, SCENES.market.minX + 80, SCENES.market.maxX - 80);
        completeQuestAtMarket();
      } else if (firstEntry) {
        showDialogue([
          line("The Florist", `Evening, ${player.name}. Six flowers left. Please choose with your eyes before your paws.`, "florist"),
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
    resolveEncounter(quest);
  });
}

function resolveEncounter(quest) {
  const soldFlower = currentFlower;
  soldFlower.active = false;
  soldFlower.sale = { ...quest.sellout, order: scene.resolved };
  const flag = ["aquarium", "pool", "cats", "bell", "leap"][scene.resolved];
  if (flag) scene[flag] = true;
  scene.resolved += 1; scene.darkness = scene.resolved * 0.033;
  spawnSaleSlips(player.x, player.y - 46, soldFlower.sale.accent, 12);
  currentFlower = null; updateHUD();
  ui.status.textContent = scene.resolved === 5 ? "Only one bloom remains" : `${soldFlower.short} sold out`;
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
    ui.count.textContent = `Obstacle ${scene.resolved + 1} of 5`;
    appendPips(5, 5 - scene.resolved); return;
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
    const route = ["bench", "aquarium", "dateNight", "catStories", "entrance"];
    const routeProgress = Math.max(0, route.indexOf(currentScene));
    appendPips(route.length, route.length - routeProgress); return;
  }
  const count = flowers.filter((flower) => flower.active).length;
  ui.count.textContent = count === 1 ? "The last bloom remains" : `${count} blooms remain`;
  ui.quest.textContent = count === 1 ? "Choose the last flower" : "Choose one flower to take home";
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

  camera.target = clamp(player.x - 380, 0, Math.max(0, SCENES[currentScene].width - VIEW_WIDTH));
  if (["title", "select", "loading"].includes(state)) camera.target = 0;
  if (activeQuest && currentScene === "market" && ["arriving", "speaking", "departing"].includes(activeQuest.visitorPhase)) {
    camera.target = activeQuest.visitorCameraX;
  }
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
  drawSceneBackground(); drawSoldOutDisplays(time); drawDoorHints(time); drawMemoryProps(time); drawTravellerHints(time); drawQuestHint(time); drawFlowerMarkers(time); drawNPCs(time);
  if (!['title', 'select', 'loading'].includes(state)) {
    drawDogSprite(ctx, player.x, player.y, player.type, player.pose, player.direction, player.walkFrame, 1);
    if (journey.returning && currentScene === "bench" && endingFlower) drawCarriedFlower(player.x, player.y, player.direction, endingFlower, time);
  }
  drawWorldParticles(); ctx.restore();
  drawLighting(time);
}

function drawSceneBackground() {
  const config = SCENES[currentScene];
  const image = assets[config.asset];
  if (!image) { ctx.fillStyle = "#251d36"; ctx.fillRect(0, 0, config.width, 540); return; }
  drawImageCover(image, config.width, 540);
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
  const bob = Math.sin(time / 300) * 1.4;
  const glint = 0.45 + Math.sin(time / 240) * 0.25;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(footY + bob));
  ctx.rotate(-0.18);
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#17101f";
  ctx.beginPath(); ctx.ellipse(0, 3, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#d9b466"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-10, -11, 6, Math.PI * 0.45, Math.PI * 1.7); ctx.stroke();
  ctx.fillStyle = "#2f6f91"; ctx.fillRect(-10, -15, 24, 15);
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
  drawRooftopCast(time);
  if (currentScene === "bench" && journey.returning) {
    drawBenchCompanion(time);
    const otherType = player.type === "maltipoo" ? "maltese" : "maltipoo";
    drawDogSprite(ctx, 918, 426, otherType, "sit", "left", 0, 0.78);
  }
}

const supportingCastRects = {
  marshall: { x: 89, y: 145, width: 369, height: 572 },
  lily: { x: 502, y: 127, width: 159, height: 589 },
  robin: { x: 808, y: 190, width: 182, height: 526 },
  barney: { x: 1060, y: 245, width: 275, height: 475 },
  bell: { x: 1420, y: 443, width: 263, height: 274 }
};

// Keep every rooftop guest clearly human-sized beside the playable dog. The
// foot offsets account for the characters' different shoes and keep the
// visible soles locked to the same paving line.
const supportingCastLayout = {
  marshall: { height: 154, footOffset: 1 },
  lily: { height: 158, footOffset: 1 },
  robin: { height: 154, footOffset: 1 },
  barney: { height: 152, footOffset: 2 }
};

function drawRooftopCast(time) {
  if (currentScene !== "rooftop" || activeQuest?.id !== "leap") return;
  const footY = SCENES.rooftop.groundY + 1;
  drawRooftopLeadSprite(780, footY, time);
  if (!assets.supportingCast) return;
  [
    ["marshall", 842],
    ["lily", 905],
    ["robin", 952],
    ["barney", 1012]
  ].forEach(([kind, x], index) => drawSupportingSprite(x, footY, kind, time, index));
}

function drawRooftopLeadSprite(x, footY, time) {
  const rect = visitorSpriteRects.ted;
  if (!assets.visitors || !rect) return;
  const drawHeight = 158;
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
  ctx.scale(1, breathe);
  ctx.filter = "saturate(.9) brightness(.94) contrast(1.04)";
  ctx.drawImage(
    assets.visitors,
    rect.x, rect.y, rect.width, rect.height,
    -drawWidth / 2, -drawHeight, drawWidth, drawHeight
  );
  ctx.restore();
}

function drawSupportingSprite(x, footY, kind, time, offset = 0) {
  const rect = supportingCastRects[kind];
  const layout = supportingCastLayout[kind];
  if (!rect || !layout) return;
  const drawHeight = layout.height;
  const drawWidth = drawHeight * (rect.width / rect.height);
  const groundedY = footY + layout.footOffset;
  const breathe = 1 + Math.sin(time / 720 + offset * 1.3) * 0.0025;

  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#111522";
  ctx.beginPath();
  ctx.ellipse(x, groundedY + 1, Math.min(27, drawWidth * 0.38), 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundedY));
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
  const frames = visitorWalkFrameRects[sprite];
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
  if (direction === "right") ctx.scale(-1, 1);
  ctx.filter = "saturate(.92) brightness(.96)";
  ctx.drawImage(
    assets.visitorWalk,
    rect.x, rect.y, rect.width, rect.height,
    -drawWidth / 2, -drawHeight, drawWidth, drawHeight
  );
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
  const side = direction === "right" ? 1 : -1; const sway = Math.sin(time / 300) * 2;
  ctx.save(); ctx.translate(x + side * 51, y - 56 + sway); if (side < 0) ctx.scale(-1, 1);
  ctx.strokeStyle = "#64865f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-18, 12); ctx.lineTo(1, 0); ctx.stroke();
  ctx.fillStyle = flower.color;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * 7, Math.sin(a) * 7, 5, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#f0c66d"; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function dogSceneFilter() {
  if (["aquarium", "aquariumInside", "rooftop"].includes(currentScene)) {
    return "saturate(.88) brightness(.94) contrast(1.04) drop-shadow(1px -1px 0 rgba(111,151,176,.18))";
  }
  if (currentScene === "bench") {
    return "saturate(.9) brightness(.96) contrast(1.04) drop-shadow(1px -1px 0 rgba(232,176,102,.16))";
  }
  if (["market", "entrance", "poolInside", "catInside", "bellHome"].includes(currentScene)) {
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
    entrance: [[610,205,52,.11],[825,200,34,.08]],
    market: [[360,190,38,.09],[510,188,38,.09],[695,190,38,.09],[895,190,38,.09],[1040,190,36,.08]],
    aquariumInside: [],
    poolInside: [[520,150,40,.07],[900,145,52,.06]],
    catInside: [[315,160,38,.06],[620,160,38,.06],[965,180,34,.07]],
    bellHome: [[980,190,58,.09]],
    rooftop: [[730,315,44,.1]]
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
function initAudio() { if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === "suspended") audioContext.resume(); }
function tone(frequency,duration,volume) { if (audioMuted || !audioContext) return; const oscillator=audioContext.createOscillator(); const gain=audioContext.createGain(); oscillator.type="sine"; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(volume,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001,audioContext.currentTime+duration); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime+duration); }
function toggleSound() { audioMuted=!audioMuted; ui.soundButton.textContent=audioMuted?"×":"♪"; ui.soundButton.setAttribute("aria-label",audioMuted?"Enable sound":"Mute sound"); if(!audioMuted){initAudio();tone(659,0.1,0.025);} }
function loop(time) { const delta=Math.min((time-lastTime)/1000,0.04)||0; lastTime=time; update(delta,time); draw(time); requestAnimationFrame(loop); }

updateHUD(); requestAnimationFrame(loop);
