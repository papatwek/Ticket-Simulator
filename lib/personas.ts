// 50+ Diverse Synthetic Customer Personas for ECE Wyze Ticket Simulator
// Rotates sequentially so that all 50 unique customer identities are cycled through before repeating.

export interface CustomerPersona {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
  product: string;
  macAddress: string;
  orderNumber: string;
  serialNumber: string;
  purchaseDate: string;
  proofOfPurchase: string;
  issueCategory: string;
  emotionalState: string;
  ledColor: string;
  hiddenSummary: string;
  openingMessage: string;
  openingMessageEmail: string;
  subject: string;
  resolutionSteps: string[];
}

export const SYNTHETIC_PERSONAS: CustomerPersona[] = [
  {
    name: "Marcus Vance",
    email: "marcus.vance82@example.invalid",
    phone: "+1 (206) 555-0148",
    shippingAddress: "742 Evergreen Terrace, Seattle, WA 98101",
    product: "Wyze Cam v4",
    macAddress: "2C:AA:8E:44:91:02",
    orderNumber: "TEST-WZ-104928",
    serialNumber: "TEST-SN-772910",
    purchaseDate: "2025-09-12",
    proofOfPurchase: "Wyze.com Order #WZ-104928, delivered Sept 15, 2025",
    issueCategory: "Device offline or won't connect to Wi-Fi",
    emotionalState: "Frustrated",
    ledColor: "solid yellow",
    hiddenSummary: "Customer's Wyze Cam v4 dropped connection after a home router reboot. Device is stuck on 2.4GHz network handshake. SOP: power cycle 30 seconds, re-pair via setup button if solid yellow persists.",
    openingMessage: "Hi. My backyard camera stopped working yesterday out of nowhere. I checked the camera outside and the small light on the front is stuck on solid yellow.",
    openingMessageEmail: "Hello Wyze Support,\n\nI am writing regarding my Wyze Cam v4 that I have mounted above my garage. It was working fine until yesterday morning, but now the Wyze app says 'Device Offline (Error code -90)'. When I brought my step ladder out to inspect the camera, I noticed the front status light is sitting on a solid yellow color and won't reconnect. I checked my home Wi-Fi and all my other devices (phone, laptop, TV) are connected fine. I ordered this directly from Wyze.com under order #TEST-WZ-104928 in September.\n\nPlease let me know how to get this camera back online as soon as possible, as my garage faces an alleyway.\n\nThank you,\nMarcus Vance",
    subject: "Wyze Cam v4 Offline - Solid Yellow Light - Order #TEST-WZ-104928",
    resolutionSteps: [
      "Acknowledge the customer's frustration with empathy and verify name and email.",
      "Check status LED indicator (solid yellow confirms camera is powered but disconnected).",
      "Instruct customer to perform a 30-second power cycle by unplugging power adapter.",
      "Verify home Wi-Fi is broadcasting on 2.4 GHz band and phone is connected to 2.4 GHz.",
      "If light stays solid yellow, guide customer to press and hold setup button until 'Ready to connect'.",
      "Re-scan QR code from the app and confirm solid blue LED live stream."
    ]
  },
  {
    name: "Priya Patel",
    email: "priya.patel.iot@example.invalid",
    phone: "+1 (408) 555-0193",
    shippingAddress: "1250 Blossom Hill Rd, San Jose, CA 95123",
    product: "Wyze Battery Cam Pro",
    macAddress: "7C:78:B2:1A:3F:88",
    orderNumber: "TEST-AMZ-991204",
    serialNumber: "TEST-SN-441920",
    purchaseDate: "2025-07-28",
    proofOfPurchase: "Amazon.com Invoice #114-8928192-38192, delivered Aug 01, 2025",
    issueCategory: "Wireless camera battery draining too fast or not charging",
    emotionalState: "Anxious / worried",
    ledColor: "pulsing red",
    hiddenSummary: "Battery Cam Pro discharging rapidly because radar motion sensitivity is at 100% and recording continuous event video of moving tree branches. SOP: verify charge level, adjust radar detection zone, lower sensitivity.",
    openingMessage: "Hello. My Battery Cam Pro used to last over a month, but since last week the battery is dropping from 100% down to 10% in just two days.",
    openingMessageEmail: "Dear Wyze Support Team,\n\nI purchased a Wyze Battery Cam Pro from Amazon back in late July (Invoice #114-8928192-38192) to keep an eye on my front driveway. It used to hold a charge for 4 to 6 weeks easily. However, over the past week, the battery has drained completely twice within 48 hours! I took it down, charged it for 6 hours until the battery pack LED turned solid green, put it back up, and this morning the app is already warning me that the battery is at 14% with a pulsing red icon.\n\nI am really anxious about missing deliveries or having no security while I am at work. Is my battery pack defective or is there a setting I need to adjust?\n\nWarm regards,\nPriya Patel",
    subject: "Battery Cam Pro battery draining in 48 hours - Invoice #114-8928192",
    resolutionSteps: [
      "Empathize with battery anxiety and verify customer name and email.",
      "Inquire how many events are being recorded per day in the Events tab.",
      "Check detection settings: radar distance, detection zone grid, and cool-down period.",
      "Advise setting detection zone away from swaying tree foliage and adjusting motion sensitivity.",
      "Verify battery pack firmware is up to date."
    ]
  },
  {
    name: "Elena Rostova",
    email: "elena.rostova@example.invalid",
    phone: "+1 (312) 555-0177",
    shippingAddress: "520 N Michigan Ave, Chicago, IL 60611",
    product: "Wyze Video Doorbell v2",
    macAddress: "D4:3D:7E:88:2C:19",
    orderNumber: "TEST-HD-448102",
    serialNumber: "TEST-SN-581903",
    purchaseDate: "2025-10-04",
    proofOfPurchase: "Home Depot Store #0412 In-Store Receipt, scanned Oct 04, 2025",
    issueCategory: "Two-way audio — the speaker or microphone isn't working",
    emotionalState: "Confused",
    ledColor: "solid white",
    hiddenSummary: "Doorbell v2 two-way audio issue caused by iOS microphone app permission being revoked after phone OS update. Doorbell chime and speaker hardware are functional. SOP: verify app permissions and volume.",
    openingMessage: "Hi there. When someone rings my Video Doorbell v2, I can hear them talking outside on my phone, but when I press the talk button they can't hear me at all.",
    openingMessageEmail: "Wyze Customer Support,\n\nI am having an issue with my Wyze Video Doorbell v2 which was installed at my front entrance about a month ago (purchased at Home Depot, receipt #TEST-HD-448102). When visitors press the chime button, my phone rings and I can hear their voice loud and clear through the phone speaker. However, when I tap the microphone icon in the Wyze app and speak, the visitor outside tells me nothing is coming out of the doorbell speaker.\n\nI tried talking louder and standing closer to my phone, but no sound comes through on their end. I'm not very technical, so could you please walk me through how to fix this?\n\nSincerely,\nElena Rostova",
    subject: "Video Doorbell v2 - Two-way talk not broadcasting to outside speaker",
    resolutionSteps: [
      "Welcome customer, acknowledge issue with friendly tone, verify account email.",
      "Check phone OS permissions: Settings -> Wyze App -> Microphone (ensure toggled ON).",
      "Test in-app speaker volume slider under Device Settings -> Advanced -> Camera Sound.",
      "Have customer press and hold the 'Speak' button (or tap once if two-way talk mode is enabled).",
      "Confirm visitor hears voice test clearly outside."
    ]
  },
  {
    name: "Devon Washington",
    email: "devon.wash.dc@example.invalid",
    phone: "+1 (202) 555-0164",
    shippingAddress: "1600 Pennsylvania Ave NW Apt 4B, Washington, DC 20006",
    product: "Wyze Cam Floodlight Pro",
    macAddress: "3C:E9:0E:62:45:11",
    orderNumber: "TEST-WZ-992144",
    serialNumber: "TEST-SN-829104",
    purchaseDate: "2025-06-15",
    proofOfPurchase: "Wyze.com Order #WZ-992144, delivered June 19, 2025",
    issueCategory: "Motion detection or event clips not triggering",
    emotionalState: "Mildly annoyed",
    ledColor: "solid blue",
    hiddenSummary: "Floodlight Pro lights turn on when motion is detected at night, but no cloud event videos are generated because Event Recording toggle was switched off during schedule edit. SOP: verify Event Recording toggle and Cam Plus license binding.",
    openingMessage: "Hello. My floodlight lights turn on whenever a car pulls up at night, but no video clips are showing up in my events tab anymore.",
    openingMessageEmail: "Hello Support,\n\nI noticed over the weekend that my Wyze Cam Floodlight Pro is no longer saving any event video clips. When someone walks into my driveway at night, the big LED floodlights switch on brightly as expected, but when I open the Wyze app to see who it was, the Events tab has zero recordings for the whole day. This used to record person and vehicle clips consistently.\n\nMy order number is #TEST-WZ-992144 from June. Can you check why the camera isn't triggering recordings even though the floodlight sensor clearly sees the motion?\n\nThanks,\nDevon Washington",
    subject: "Floodlight Pro lights trigger but no Event video clips recording",
    resolutionSteps: [
      "Acknowledge the customer's time and verify account email and name.",
      "Navigate to Device Settings -> Event Recording -> Ensure 'Motion' is toggled ON.",
      "Verify 'Customize Detection' grid covers the driveway area.",
      "Check Account -> Services -> Cam Plus -> Ensure license is assigned to Floodlight Pro.",
      "Conduct a walking motion test and verify new clip appears in Events tab."
    ]
  },
  {
    name: "Chloe Bennett",
    email: "chloe.bennett@example.invalid",
    phone: "+1 (512) 555-0182",
    shippingAddress: "300 S Congress Ave, Austin, TX 78704",
    product: "Wyze Lock Bolt",
    macAddress: "E0:98:06:55:71:3B",
    orderNumber: "TEST-BB-661902",
    serialNumber: "TEST-SN-391024",
    purchaseDate: "2025-08-03",
    proofOfPurchase: "Best Buy Invoice #BBY-661902, purchased in-store Aug 03, 2025",
    issueCategory: "App or account login trouble",
    emotionalState: "Calm",
    ledColor: "green flash",
    hiddenSummary: "Lock Bolt keypad and fingerprint unlock door locally, but Wyze app displays 'Bluetooth Disconnected' because phone Bluetooth cache requires toggle or location permission is restricted. SOP: toggle Bluetooth, check location permissions.",
    openingMessage: "Hi! My fingerprint unlocks my Lock Bolt fine, but the Wyze app keeps saying 'Bluetooth Disconnected' whenever I stand next to the door.",
    openingMessageEmail: "Hi Wyze Support,\n\nMy Lock Bolt has been installed on my side door since August (Best Buy receipt #TEST-BB-661902). The keypad and fingerprint sensor both work great to unlock the deadbolt mechanically. However, whenever I try to use the Wyze app on my phone to check access history or add a new temporary PIN code for my dog sitter, the app just says 'Device Bluetooth Disconnected' even when I am standing 2 feet away from the lock.\n\nWhat do I need to do on my phone so the app can communicate with the lock again?\n\nBest,\nChloe Bennett",
    subject: "Wyze Lock Bolt - Bluetooth Disconnected error in app",
    resolutionSteps: [
      "Greet customer politely and verify name and email address.",
      "Explain that Lock Bolt uses local Bluetooth Low Energy (BLE) to sync with phone.",
      "Instruct customer to toggle phone Bluetooth OFF for 10 seconds, then back ON.",
      "Verify phone OS location permissions (required by Android/iOS for Bluetooth device scanning).",
      "Confirm app establishes handshake and lock history synchronizes."
    ]
  },
  {
    name: "Liam O'Connor",
    email: "liam.oconnor.boston@example.invalid",
    phone: "+1 (617) 555-0131",
    shippingAddress: "88 Commonwealth Ave, Boston, MA 02116",
    product: "Wyze Mesh Router Pro 6E",
    macAddress: "94:83:C4:22:10:FA",
    orderNumber: "TEST-WZ-331089",
    serialNumber: "TEST-SN-129034",
    purchaseDate: "2025-05-20",
    proofOfPurchase: "Wyze.com Order #WZ-331089, delivered May 24, 2025",
    issueCategory: "Smart-home integration issue — routines, Alexa, or Google Assistant won't work",
    emotionalState: "Confused",
    ledColor: "solid white",
    hiddenSummary: "2.4GHz smart plugs and bulbs losing connection because Mesh Router Pro 6E band steering combines 2.4/5/6 GHz under single SSID without legacy compatibility. SOP: enable IoT Network or 2.4GHz guest network.",
    openingMessage: "Hello. Since setting up the Wyze Mesh Router 6E, my older smart plugs and light bulbs keep dropping offline every few hours.",
    openingMessageEmail: "Dear Support,\n\nI upgraded my home network to the Wyze Mesh Router Pro 6E two weeks ago (order #TEST-WZ-331089). High-speed internet on our laptops and phones has been blazing fast, but our older 2.4 GHz smart plugs and smart light bulbs keep dropping connection and showing as offline in their apps. I read online that some older smart home devices struggle when 5GHz and 2.4GHz share the exact same Wi-Fi name.\n\nDoes the Wyze Mesh Router have an option to create a dedicated 2.4GHz network for smart home gadgets? Please guide me through setting that up.\n\nRegards,\nLiam O'Connor",
    subject: "Mesh Router Pro 6E - 2.4GHz smart plugs dropping off combined Wi-Fi",
    resolutionSteps: [
      "Thank customer for reaching out and verify Wyze account email.",
      "Explain band steering and how IoT devices require a stable 2.4GHz band.",
      "Guide customer in Wyze app: Router Settings -> Wi-Fi Settings -> IoT Network.",
      "Enable the dedicated 2.4GHz IoT Network with a distinct password.",
      "Confirm smart plugs connect to the IoT network and remain stable."
    ]
  },
  {
    name: "Sofia Reyes",
    email: "sofia.reyes.miami@example.invalid",
    phone: "+1 (305) 555-0155",
    shippingAddress: "1420 Brickell Ave, Miami, FL 33131",
    product: "Wyze Cam Plus Unlimited",
    macAddress: "AA:11:BB:22:CC:33",
    orderNumber: "TEST-SUB-778102",
    serialNumber: "TEST-SN-998811",
    purchaseDate: "2025-10-15",
    proofOfPurchase: "Wyze Services Renewal Invoice #WZ-SUB-778102, billed Oct 15, 2025",
    issueCategory: "Billing or Cam Plus subscription dispute",
    emotionalState: "Very upset, ready to escalate",
    ledColor: "N/A",
    hiddenSummary: "Customer was billed twice because an older individual Cam Plus renewal overlapped with a newly purchased Cam Plus Unlimited annual subscription. SOP: verify account subscriptions, locate duplicate charge, guide cancellation and refund request.",
    openingMessage: "I was charged twice on my credit card last Friday for Cam Plus. I need someone to fix this duplicate charge immediately.",
    openingMessageEmail: "To Billing Support Manager,\n\nI am extremely frustrated. On October 15, I noticed two separate charges from Wyze Labs on my Chase credit card statement: one charge for $99.99 for Cam Plus Unlimited, and another charge for $19.99 for a single camera plan renewal. I already upgraded my account to the Unlimited plan so that I wouldn't be billed for single cameras anymore!\n\nI want the $19.99 duplicate charge refunded back to my credit card immediately, and I want confirmation that the individual camera subscription is fully canceled so this never happens again. My billing email is sofia.reyes.miami@example.invalid.\n\nSofia Reyes",
    subject: "URGENT: Duplicate Billing Charge on Credit Card - Cam Plus",
    resolutionSteps: [
      "Validate customer frustration with genuine empathy, assure immediate review.",
      "Verify billing email and last 4 digits of card / transaction dates.",
      "Check Account -> Services in Wyze portal to identify overlapping single-camera plan.",
      "Process cancellation of the redundant single camera license.",
      "Submit billing refund ticket request to Finance and provide reference confirmation number."
    ]
  },
  {
    name: "Tariq Mansoor",
    email: "tariq.mansoor@example.invalid",
    phone: "+1 (713) 555-0128",
    shippingAddress: "2500 Westheimer Rd, Houston, TX 77098",
    product: "Wyze Thermostat",
    macAddress: "50:8A:06:91:DE:30",
    orderNumber: "TEST-WZ-884102",
    serialNumber: "TEST-SN-610294",
    purchaseDate: "2025-04-10",
    proofOfPurchase: "Wyze.com Order #WZ-884102, delivered April 14, 2025",
    issueCategory: "Hardware malfunction (battery drain, purple video tint, clicking sound, lens moisture)",
    emotionalState: "Anxious / worried",
    ledColor: "orange flame icon",
    hiddenSummary: "Thermostat blowing cold air when calling for heat because heat pump O/B reversing valve orientation is set to 'Energized on Cool' instead of 'Energized on Heat'. SOP: adjust O/B reversing valve setting in app.",
    openingMessage: "Hi. It's 45 degrees tonight and my Wyze Thermostat is blowing cold air through the vents even though the screen says Heating.",
    openingMessageEmail: "Wyze Technical Support,\n\nI need urgent assistance with our Wyze Thermostat (order #TEST-WZ-884102). With the cold front hitting Texas tonight, the temperature inside our house dropped to 60 degrees. I set the thermostat to Heat at 72 degrees. The display shows the orange heating icon, and the blower fan turned on, but when I put my hand by the air vents, cold air is blowing out! The house is getting colder by the hour.\n\nWe have a heat pump system with an O/B wire connected. Could the wiring settings in the software be reversed? Please help us get heat back on tonight.\n\nTariq Mansoor",
    subject: "URGENT: Wyze Thermostat blowing cold air during Heat mode",
    resolutionSteps: [
      "Acknowledge the urgency with empathy regarding home heating, verify account email.",
      "Ask if customer has a conventional furnace (gas/electric) or Heat Pump system.",
      "Instruct customer to open Wyze app -> Thermostat Settings -> Advanced -> Heat Pump.",
      "Change O/B Reversing Valve setting (toggle from 'O' to 'B' or vice versa).",
      "Wait 3 minutes for compressor lockout delay and verify warm air begins blowing."
    ]
  },
  {
    name: "Hannah Goldberg",
    email: "hannah.goldberg.philly@example.invalid",
    phone: "+1 (215) 555-0169",
    shippingAddress: "1800 JFK Blvd, Philadelphia, PA 19103",
    product: "Wyze Cam Pan v3",
    macAddress: "A4:DA:22:98:51:7A",
    orderNumber: "TEST-TGT-551029",
    serialNumber: "TEST-SN-304918",
    purchaseDate: "2025-06-28",
    proofOfPurchase: "Target Store Receipt #TGT-551029, purchased June 28, 2025",
    issueCategory: "Missing footage or cloud storage confusion",
    emotionalState: "Frustrated",
    ledColor: "solid blue",
    hiddenSummary: "Customer inserted a 128GB microSD card expecting continuous 24/7 recording, but card was formatted in exFAT and requires in-app FAT32 format, plus Continuous Recording was not enabled. SOP: format SD card in app, toggle Continuous Recording.",
    openingMessage: "Hi. I put a 128GB memory card in my Pan v3 camera, but when I scroll back in the timeline there is no recorded video at all.",
    openingMessageEmail: "Hello,\n\nI purchased a Wyze Cam Pan v3 at Target (Receipt #TGT-551029) and installed a brand new 128GB microSD card into the slot underneath the camera head. The camera works for live viewing, but yesterday when our package was moved, I tapped 'View Playback' to check the timeline and the entire bar is empty gray. It says 'No video at the selected time'.\n\nI bought the memory card specifically so I wouldn't have to rely solely on cloud clips. Why isn't it recording to the card?\n\nHannah Goldberg",
    subject: "Pan v3 - No video recorded on 128GB microSD card playback timeline",
    resolutionSteps: [
      "Acknowledge the customer's frustration and verify account email.",
      "Instruct customer to check: Settings -> Advanced Settings -> Manage MicroSD Card.",
      "Guide customer to tap 'Format' to ensure proper filesystem compatibility.",
      "Set Recording Schedule to 'Continuous' rather than 'Events Only'.",
      "Verify timeline green bars populate after 5 minutes of continuous recording."
    ]
  },
  {
    name: "Derek Miller",
    email: "derek.miller.denver@example.invalid",
    phone: "+1 (303) 555-0112",
    shippingAddress: "1401 Lawrence St, Denver, CO 80202",
    product: "Wyze Cam OG",
    macAddress: "80:EA:CA:41:88:5C",
    orderNumber: "TEST-WZ-993821",
    serialNumber: "TEST-SN-884012",
    purchaseDate: "2025-08-19",
    proofOfPurchase: "Wyze.com Order #WZ-993821, delivered Aug 23, 2025",
    issueCategory: "Night vision or overall image quality looks dark, grainy, or washed out",
    emotionalState: "Confused",
    ledColor: "solid blue",
    hiddenSummary: "Night vision is washed out with bright white glare because the camera is placed on an indoor windowsill pointing through window glass, causing infrared IR illuminators to reflect back into lens. SOP: turn off IR lights in settings.",
    openingMessage: "Hi. At night my camera's picture becomes completely white and foggy like there's a big glare on the screen.",
    openingMessageEmail: "Hi Wyze Support,\n\nI have a Wyze Cam OG mounted on the inside windowsill of my 2nd floor bedroom looking out at the front yard (Order #TEST-WZ-993821). During daytime the picture is crisp and vibrant. But as soon as it gets dark outside, the entire screen turns into a blinding white glare and I cannot see anything outside in the yard at all.\n\nIs the night vision sensor broken on my camera, or is there a way to fix the glare?\n\nDerek Miller",
    subject: "Wyze Cam OG - Blinding white glare on night vision through window",
    resolutionSteps: [
      "Greet customer, identify the common window reflection phenomenon, verify email.",
      "Explain that infrared (IR) LEDs reflect off glass surfaces like a mirror.",
      "Guide customer: Settings -> Advanced Settings -> Night Vision IR Lights -> set to 'OFF'.",
      "Keep Night Vision Mode set to 'Auto' or use Color Night Vision if streetlights are present.",
      "Confirm glare disappears immediately and outside view is visible in dark."
    ]
  }
];

// Generate procedural synthetic personas for indices 10 through 49 to complete the 50-persona sequence
const FIRST_NAMES = [
  "Aaliyah", "Oliver", "Samantha", "Carlos", "Zoe", "Ethan", "Maya", "Gabriel", "Harper", "Noah",
  "Lucas", "Layla", "Benjamin", "Victoria", "Jackson", "Emily", "Aiden", "Natalie", "Elijah", "Savannah",
  "Caleb", "Aubrey", "Henry", "Grace", "Ryan", "Hazel", "Leo", "Brooke", "Nathan", "Stella",
  "Christian", "Scarlett", "Dominic", "Violet", "Isaiah", "Claire", "Julian", "Autumn", "Jordan", "Alex"
];

const LAST_NAMES = [
  "Brooks", "Chen", "Johnson", "Schmidt", "Wright", "Mendez", "Nakamura", "Davis", "Lin", "Torres",
  "Scott", "Campbell", "Silva", "Al-Mansoor", "Hayes", "Sterling", "Reed", "Zhao", "Murphy", "Cox",
  "Foster", "King", "Ross", "Diaz", "Powell", "Morgan", "Jenkins", "Ramirez", "Kim", "Sullivan",
  "Ortiz", "Hall", "Adams", "Flores", "Watson", "Price", "Henderson", "Cruz", "Ward", "Alvarez"
];

const CITIES = [
  ["Atlanta", "GA", "30303", "404"],
  ["Phoenix", "AZ", "85001", "602"],
  ["Portland", "OR", "97201", "503"],
  ["Raleigh", "NC", "27601", "919"],
  ["San Diego", "CA", "92101", "619"],
  ["Minneapolis", "MN", "55401", "612"],
  ["Nashville", "TN", "37201", "615"],
  ["Detroit", "MI", "48201", "313"],
  ["Indianapolis", "IN", "46201", "317"],
  ["Columbus", "OH", "43201", "614"],
  ["Charlotte", "NC", "28201", "704"],
  ["Kansas City", "MO", "64101", "816"],
  ["Las Vegas", "NV", "89101", "702"],
  ["Salt Lake City", "UT", "84101", "801"],
  ["Tampa", "FL", "33601", "813"],
  ["Orlando", "FL", "32801", "407"],
  ["Pittsburgh", "PA", "15201", "412"],
  ["Cincinnati", "OH", "45201", "513"],
  ["St. Louis", "MO", "63101", "314"],
  ["Baltimore", "MD", "21201", "410"]
];

const PRODUCTS = [
  { name: "Wyze Cam v4", issue: "Device offline or won't connect to Wi-Fi", led: "solid yellow" },
  { name: "Wyze Battery Cam Pro", issue: "Wireless camera battery draining too fast or not charging", led: "flashing red" },
  { name: "Wyze Video Doorbell v2", issue: "Two-way audio — the speaker or microphone isn't working", led: "solid white" },
  { name: "Wyze Cam Floodlight Pro", issue: "Motion detection or event clips not triggering", led: "solid blue" },
  { name: "Wyze Lock Bolt", issue: "App or account login trouble", led: "flashing red" },
  { name: "Wyze Mesh Router Pro 6E", issue: "Smart-home integration issue — routines, Alexa, or Google Assistant won't sync", led: "solid white" },
  { name: "Wyze Robot Vacuum", issue: "Hardware malfunction (battery drain, purple video tint, clicking sound)", led: "yellow pulse" },
  { name: "Wyze Bulb Color", issue: "Feature confusion — customer isn't sure how to configure rules or schedules", led: "dim white" },
  { name: "Wyze Plug Outdoor", issue: "Device offline or won't connect to Wi-Fi", led: "flashing blue" },
  { name: "Wyze Cam Pan v3", issue: "The live view is black, frozen, or keeps buffering", led: "solid blue" }
];

const EMOTIONS = [
  "Mildly annoyed", "Frustrated", "Very upset, ready to escalate", "Anxious or worried", "Confused, low technical confidence", "Calm and neutral"
];

// Populate up to 50 personas
for (let i = 10; i < 50; i++) {
  const fName = FIRST_NAMES[i % FIRST_NAMES.length];
  const lName = LAST_NAMES[i % LAST_NAMES.length];
  const fullName = `${fName} ${lName}`;
  const cityData = CITIES[i % CITIES.length];
  const prodData = PRODUCTS[i % PRODUCTS.length];
  const emotion = EMOTIONS[i % EMOTIONS.length];
  const hexPart = (i * 137 + 1049).toString(16).toUpperCase().padStart(4, '0');
  const mac = `2C:${(i + 10).toString(16).toUpperCase().padStart(2, '0')}:9A:${(i + 30).toString(16).toUpperCase().padStart(2, '0')}:7E:${hexPart.slice(0, 2)}`;
  const orderNum = `TEST-WZ-${100000 + i * 1827}`;
  const sn = `TEST-SN-${400000 + i * 2913}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.invalid`;
  const streetNum = 100 + (i * 37) % 890;
  const address = `${streetNum} Oak Ridge Pkwy, ${cityData[0]}, ${cityData[1]} ${cityData[2]}`;
  const phone = `+1 (${cityData[3]}) 555-01${(i + 10).toString().padStart(2, '0')}`;
  const pop = `Wyze.com Order #${orderNum}, shipped 2025-0${(i % 8) + 1}-15`;

  SYNTHETIC_PERSONAS.push({
    name: fullName,
    email: email,
    phone: phone,
    shippingAddress: address,
    product: prodData.name,
    macAddress: mac,
    orderNumber: orderNum,
    serialNumber: sn,
    purchaseDate: `2025-0${(i % 8) + 1}-10`,
    proofOfPurchase: pop,
    issueCategory: prodData.issue,
    emotionalState: emotion,
    ledColor: prodData.led,
    hiddenSummary: `Customer's ${prodData.name} has a standard ${prodData.issue.toLowerCase()} problem. Customer is non-technical and cooperative when guided step by step. SOP: verify account, verify device status LED (${prodData.led}), apply standard diagnostic, confirm resolution.`,
    openingMessage: `Hi there, I need some help with my ${prodData.name}. It was working fine previously, but now it has an issue with: ${prodData.issue.toLowerCase()}. The light on it is currently ${prodData.led}.`,
    openingMessageEmail: `Hello Wyze Customer Support,\n\nI am contacting you regarding my ${prodData.name} which I purchased under order #${orderNum}. Over the past couple of days, it has stopped operating properly. Specifically, ${prodData.issue.toLowerCase()}.\n\nWhen I look at the device, the status indicator light is ${prodData.led}. I have tried power cycling my Wi-Fi router once, but that didn't resolve the situation. I am not particularly tech-savvy and I don't want to mess anything up without proper instructions.\n\nCould you please review my account and let me know the correct steps to resolve this?\n\nSincerely,\n${fullName}\n${phone}`,
    subject: `${prodData.name} Assistance - Order #${orderNum}`,
    resolutionSteps: [
      `Acknowledge customer's situation with empathy and confirm customer name and email.`,
      `Verify device status LED indicator (reported as ${prodData.led}).`,
      `Guide customer through single-action diagnostic step suitable for ${prodData.name}.`,
      `Wait for customer to report back what happens before providing next step.`,
      `Confirm normal live operation in the Wyze app and summarize case.`
    ]
  });
}

// Global rotation tracker
let globalRotationIndex = 0;

export function getNextPersona(): CustomerPersona {
  const p = SYNTHETIC_PERSONAS[globalRotationIndex % SYNTHETIC_PERSONAS.length];
  globalRotationIndex = (globalRotationIndex + 1) % SYNTHETIC_PERSONAS.length;
  return p;
}

export function getPersonaByIndex(idx: number): CustomerPersona {
  return SYNTHETIC_PERSONAS[Math.abs(idx) % SYNTHETIC_PERSONAS.length];
}
