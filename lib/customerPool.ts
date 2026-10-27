// Pool of 55+ realistic, distinct synthetic customer personas and support cases for Wyze Ticket Simulator
export interface CustomerIdentity {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
  product: string;
  macAddress: string;
  serialNumber: string;
  orderNumber: string; // Proof of purchase (POP)
  retailer: string;
  purchaseDate: string;
  emotionalState: string;
  issueCategory: string;
  symptomDetails: string;
  chatOpening: string;
  emailSubject: string;
  emailBody: string;
}

export const CUSTOMER_POOL: CustomerIdentity[] = [
  {
    name: "Marcus Vance",
    email: "marcus.vance82@example.invalid",
    phone: "+1 (312) 555-0184",
    shippingAddress: "742 Evergreen Terrace, Chicago, IL 60614",
    product: "Wyze Cam v4",
    macAddress: "2C:AA:8E:55:12:F4",
    serialNumber: "WZC4-88410294",
    orderNumber: "WYZE-ORD-991204",
    retailer: "Wyze.com Official Store",
    purchaseDate: "2025-10-18",
    emotionalState: "Frustrated",
    issueCategory: "Device offline or won't connect to Wi-Fi",
    symptomDetails: "The camera stopped streaming after the home router rebooted. Front light sits solid yellow and phone app says 'Device Offline (Error code 90)'.",
    chatOpening: "Hi, my new Wyze Cam v4 mounted in my driveway suddenly went offline yesterday. The little light on the front is just sitting on solid yellow and won't reconnect no matter what I do.",
    emailSubject: "Wyze Cam v4 offline since router restart - Solid yellow LED light",
    emailBody: "Hello Wyze Support Team,\n\nI purchased a brand new Wyze Cam v4 from your official website about two weeks ago (Order #WYZE-ORD-991204) and had it installed above my driveway. It was working wonderfully in 2.5K until yesterday morning when our home internet briefly restarted.\n\nNow, the camera refuses to connect back to the app. When I look outside at the camera, the status light on the front is stuck on solid yellow and does not blink. In my Wyze app, it just says 'Device Offline - Error Code 90'. I tried closing the app on my iPhone but nothing changed. Can someone please guide me on how to get this back online? I really need this driveway camera functioning for security.\n\nThank you,\nMarcus Vance\nOrder #WYZE-ORD-991204"
  },
  {
    name: "Elena Rostova",
    email: "elena.rostova@example.invalid",
    phone: "+1 (206) 555-0193",
    shippingAddress: "1208 Pine Ridge Way, Seattle, WA 98101",
    product: "Wyze Battery Cam Pro",
    macAddress: "7C:78:B2:11:44:90",
    serialNumber: "BCP-77291048",
    orderNumber: "AMZ-114-8839201-441",
    retailer: "Amazon.com (Wyze Authorized)",
    purchaseDate: "2025-09-05",
    emotionalState: "Anxious",
    issueCategory: "Wireless camera battery draining too fast or not charging",
    symptomDetails: "Battery drops from 100% to 12% in 48 hours without high traffic.",
    chatOpening: "Hello. My Battery Cam Pro used to last nearly two months on a charge, but this past week it dropped from 100% down to 12% in less than 2 days. Is my battery defective?",
    emailSubject: "Severe battery drain on Battery Cam Pro after recent update",
    emailBody: "Dear Wyze Support,\n\nI am writing because my Wyze Battery Cam Pro that I ordered through Amazon has started draining its battery at an alarming rate. When I first installed it two months ago, the battery easily lasted 6 to 7 weeks between charges. However, over the past few days, I charged it fully to 100%, and within 48 hours the battery was already down to 12%.\n\nThere hasn't been any unusual traffic or construction in my front yard, so I don't know why it is recording so much or staying awake. I checked to make sure the weather seals on the battery door are tight. Could this be caused by the recent firmware, or do I need a replacement battery pack under warranty?\n\nPlease advise what settings or tests I need to perform.\n\nSincerely,\nElena Rostova"
  },
  {
    name: "Derrick Washington",
    email: "derrick.w.consult@example.invalid",
    phone: "+1 (404) 555-0131",
    shippingAddress: "550 Peachtree Street NE, Apt 14B, Atlanta, GA 30308",
    product: "Wyze Video Doorbell v2",
    macAddress: "A4:DA:22:98:33:1C",
    retailer: "Home Depot",
    serialNumber: "WDB2-99214488",
    orderNumber: "HD-88421948",
    purchaseDate: "2025-08-22",
    emotionalState: "Annoyed",
    issueCategory: "Two-way audio — the speaker or microphone isn't working",
    symptomDetails: "Visitor can hear Derrick, but doorbell audio back to phone is silent or severely distorted.",
    chatOpening: "Hi there. When someone rings my Video Doorbell v2, I can hear them through my phone, but when I try to speak back through the app, nothing comes out of the doorbell speaker.",
    emailSubject: "Audio issue on Doorbell v2 - Two-way talk speaker silent",
    emailBody: "Hello Support,\n\nI installed a Wyze Video Doorbell v2 about three months ago that I bought at Home Depot. Everything has been great until last week when delivery drivers tried talking to me. While I can clearly hear what they are saying on my phone, when I tap the microphone button in the Wyze app and speak, absolutely no sound comes out of the doorbell unit outside.\n\nI checked my iPhone permissions and the Wyze app does have access to my phone microphone. I even turned up the volume on my phone, but the person at my door told me the speaker outside is completely silent. Please let me know what troubleshooting steps I need to take to fix this.\n\nBest regards,\nDerrick Washington"
  },
  {
    name: "Samantha Chang",
    email: "sam.chang90@example.invalid",
    phone: "+1 (415) 555-0176",
    shippingAddress: "320 Market St, Suite 400, San Francisco, CA 94111",
    product: "Wyze Lock Bolt",
    macAddress: "90:9A:4A:23:FE:67",
    serialNumber: "WLB-55192837",
    orderNumber: "WYZE-ORD-771829",
    retailer: "Wyze.com",
    purchaseDate: "2025-11-02",
    emotionalState: "Confused",
    issueCategory: "App or account login trouble",
    symptomDetails: "Fingerprint scanner unlocks the deadbolt, but Wyze app says 'Device Disconnected via Bluetooth' and cannot add new codes.",
    chatOpening: "Good morning! My Lock Bolt unlocks when I touch the fingerprint sensor, but inside the Wyze app it keeps saying 'Bluetooth Disconnected' whenever I stand next to it.",
    emailSubject: "Cannot connect to Wyze Lock Bolt via Bluetooth in app",
    emailBody: "Hello Wyze Team,\n\nI recently purchased the Wyze Lock Bolt with fingerprint keypad from Wyze.com (Order #WYZE-ORD-771829). The lock itself is physically working fine—my thumbprint unlocks the door without any issue. However, I am trying to add a temporary access code for my sister who is visiting tomorrow, and the Wyze app refuses to connect.\n\nEvery time I stand right by the door and tap on the Lock Bolt in the app, it spins for about 15 seconds and then displays 'Bluetooth connection failed. Please ensure you are within range.' I have toggled my phone's Bluetooth off and on, but it still won't connect. How can I get the app to talk to the lock again?\n\nThank you,\nSamantha Chang"
  },
  {
    name: "Robert MacIntyre",
    email: "bob.macintyre@example.invalid",
    phone: "+1 (617) 555-0158",
    shippingAddress: "88 Commonwealth Ave, Boston, MA 02116",
    product: "Wyze Cam Floodlight Pro",
    macAddress: "38:2C:4A:88:99:AA",
    serialNumber: "WCFP-11928471",
    orderNumber: "WYZE-ORD-662910",
    retailer: "Wyze.com Official Store",
    purchaseDate: "2025-07-15",
    emotionalState: "Frustrated",
    issueCategory: "Motion detection or event clips not triggering when they should",
    symptomDetails: "Floodlight lights illuminate on motion at night, but no video events appear in the events tab in the app.",
    chatOpening: "Hi. My Floodlight Pro lights turn on when a car pulls into the driveway at night, but the camera isn't recording any event clips to my app. What is going on?",
    emailSubject: "Floodlight Pro turning on lights but zero event clips recorded",
    emailBody: "To Wyze Customer Support,\n\nI have had the Wyze Cam Floodlight Pro installed on my garage for about four months now. In the last few days, I noticed that although the powerful 3000-lumen floodlights turn on properly whenever a car or person enters my driveway, my Wyze app shows zero event recordings under the Events tab.\n\nI have an active Cam Plus subscription on this camera, so it should be recording full video clips with vehicle and person tags. Right now, there is nothing recorded since Tuesday. I rely on this camera to monitor my vehicles overnight. Can you please check my account or tell me what settings I need to adjust?\n\nRobert MacIntyre\nOrder #WYZE-ORD-662910"
  },
  {
    name: "Chloe Bennett",
    email: "chloe.b.designs@example.invalid",
    phone: "+1 (512) 555-0129",
    shippingAddress: "1404 South Congress Ave, Austin, TX 78704",
    product: "Wyze Cam Plus Unlimited",
    macAddress: "N/A (Account Subscription)",
    serialNumber: "SUB-WYZE-99182",
    orderNumber: "SUB-ANNUAL-441029",
    retailer: "Wyze.com In-App Subscription",
    purchaseDate: "2025-10-24",
    emotionalState: "Very upset, ready to escalate",
    issueCategory: "Billing or Cam Plus subscription dispute",
    symptomDetails: "Charged twice on credit card for annual renewal ($99 x 2).",
    chatOpening: "Hello, I was just billed twice on my credit card statement for my annual Cam Plus Unlimited plan ($99.99 each). Can someone please reverse the duplicate charge?",
    emailSubject: "URGENT: Billed twice for annual Cam Plus Unlimited renewal",
    emailBody: "Dear Wyze Billing Department,\n\nI am writing to dispute an erroneous duplicate charge on my credit card. My annual Cam Plus Unlimited subscription renewed on October 24th, but when I reviewed my online banking statement this morning, Wyze charged my card $99.99 twice on the exact same date (two identical line items for $99.99 with different authorization codes).\n\nI have been a loyal customer with 8 cameras for three years, and this is unacceptable. Please immediately refund the second charge of $99.99 back to my Visa card ending in 4018 and confirm that my account still has active coverage for all my cameras.\n\nAccount Email: chloe.b.designs@example.invalid\nDate of Charge: October 24, 2025\n\nI look forward to your prompt confirmation of this refund.\n\nChloe Bennett"
  },
  {
    name: "Hannah Morales",
    email: "hannah.morales@example.invalid",
    phone: "+1 (303) 555-0162",
    shippingAddress: "2201 Boulder Valley Dr, Boulder, CO 80302",
    product: "Wyze Mesh Router Pro 6E",
    macAddress: "40:8D:5C:99:22:11",
    serialNumber: "WMR6E-3391028",
    orderNumber: "BESTBUY-992144",
    retailer: "Best Buy",
    purchaseDate: "2025-09-30",
    emotionalState: "Mildly annoyed",
    issueCategory: "Smart-home integration issue — routines, Alexa, or Google Assistant won't work",
    symptomDetails: "2.4GHz smart plugs and bulbs disconnect frequently after installing the 6E mesh system.",
    chatOpening: "Hi! Ever since I set up my new Wyze Mesh Router Pro 6E, my Wyze Bulbs and smart plugs in the living room keep disconnecting every few hours.",
    emailSubject: "Smart bulbs and plugs disconnecting on Mesh Router Pro 6E",
    emailBody: "Hello Wyze Technical Team,\n\nI recently upgraded my home network to the Wyze Mesh Router Pro 6E 2-pack that I purchased from Best Buy. While my laptop and iPad get blazing fast speeds, I am having serious connectivity issues with all my 2.4 GHz smart home devices.\n\nMy 4 Wyze Color Bulbs and 2 Wyze Plugs in the living room keep dropping offline several times a day. When I open the Wyze app, half the bulbs have a cloud with a slash through them. I heard that Wi-Fi 6 routers sometimes combine 5 GHz and 2.4 GHz under one SSID which confuses IoT devices. Is there a way in the Wyze app to enable an IoT network or separate the bands so my plugs stay connected?\n\nThanks for your help,\nHannah Morales"
  },
  {
    name: "Arthur Pendelton",
    email: "arthur.pendelton@example.invalid",
    phone: "+1 (602) 555-0144",
    shippingAddress: "4410 E Camelback Rd, Phoenix, AZ 85018",
    product: "Wyze Thermostat",
    macAddress: "5C:AA:FD:10:99:32",
    serialNumber: "WT-88219481",
    orderNumber: "WYZE-ORD-551029",
    retailer: "Wyze.com",
    purchaseDate: "2025-10-01",
    emotionalState: "Confused, low technical confidence",
    issueCategory: "Feature confusion — customer isn't sure how to do something",
    symptomDetails: "Thermostat blows cold air when heat is called because O/B reversing valve wire is set to default instead of heat pump.",
    chatOpening: "Hello. It got chilly here last night so I turned the heat on my Wyze Thermostat, but the vents are blowing cool air instead of warm air. Can you help me?",
    emailSubject: "Wyze Thermostat blowing cold air when heat is turned on",
    emailBody: "Dear Wyze Support,\n\nI am not very handy with electrical equipment, but I followed the instructions in the app to install the Wyze Thermostat on my wall last month. It cooled my house fine during the tail end of summer, but last night temperatures dropped into the 40s and when I set the thermostat to Heat at 72 degrees, the vents started blowing cold AC air!\n\nI have a heat pump unit on my roof. A friend told me that heat pumps have something called a reversing valve or O/B wire setting. I looked in the Wyze app settings but I am afraid to touch the wiring settings without someone walking me through it safely. Could someone please guide me on what setting needs to be adjusted so my heat works?\n\nArthur Pendelton\nPhoenix, AZ"
  },
  {
    name: "Brianna Foster",
    email: "brianna.foster@example.invalid",
    phone: "+1 (919) 555-0187",
    shippingAddress: "512 Chapel Hill St, Durham, NC 27701",
    product: "Wyze Cam Pan v3",
    macAddress: "A0:92:48:DE:AD:01",
    serialNumber: "PAN3-44102938",
    orderNumber: "WYZE-ORD-881920",
    retailer: "Wyze.com",
    purchaseDate: "2025-08-11",
    emotionalState: "Annoyed",
    issueCategory: "Hardware malfunction (battery, audio, video quality)",
    symptomDetails: "Pan v3 makes clicking / grinding noise when rotating and stops halfway through motion tracking.",
    chatOpening: "Hi there. My Wyze Cam Pan v3 on my bookshelf has started making a loud clicking/grinding noise whenever it tries to rotate, and then it gets stuck facing the wall.",
    emailSubject: "Wyze Cam Pan v3 mechanical grinding noise and stuck rotation",
    emailBody: "Hello Support,\n\nI am reaching out regarding my Wyze Cam Pan v3 that I purchased directly from Wyze.com. For the past couple of weeks, the motorized pan and tilt function has been having issues. Whenever motion tracking triggers, the camera makes an audible grinding and clicking sound from the base, and then it stops rotating halfway and points directly at my wall.\n\nI have visually inspected the base and there are no cables or obstructions blocking the camera head. I even tried unplugging it and plugging it back in, and during the startup calibration it clicks and jerks before giving up. I believe the internal rotation gears might be stripped. Since this is well within the 1-year warranty period, how do I initiate a replacement?\n\nOrder #: WYZE-ORD-881920\nSerial #: PAN3-44102938\n\nThanks,\nBrianna Foster"
  },
  {
    name: "Kevin O'Connor",
    email: "kevin.oconnor@example.invalid",
    phone: "+1 (215) 555-0112",
    shippingAddress: "1900 Market St, Philadelphia, PA 19103",
    product: "Wyze Cam OG Telephoto",
    macAddress: "64:16:66:33:AA:91",
    serialNumber: "OGT-10294817",
    orderNumber: "AMZ-112-9918274-101",
    retailer: "Amazon",
    purchaseDate: "2025-09-12",
    emotionalState: "Calm and neutral",
    issueCategory: "SD card won't be recognized, or recorded video won't play back",
    symptomDetails: "32GB MicroSD card shows 'No SD Card Installed' after firmware update.",
    chatOpening: "Hello. I put a brand new Samsung 32GB microSD card into my Wyze Cam OG Telephoto, but the app says 'No MicroSD Card detected in camera'.",
    emailSubject: "MicroSD Card not recognized in Wyze Cam OG Telephoto",
    emailBody: "Hi Wyze Customer Support,\n\nI bought a Wyze Cam OG Telephoto on Amazon along with a brand new 32GB Class 10 microSD card to record continuous footage of my bird feeder in the backyard. I inserted the card into the slot under the rubber seal until it clicked into place.\n\nHowever, when I go into the camera settings under Advanced Settings > Manage MicroSD Card, the app displays 'No MicroSD Card installed'. I tried taking it out and re-inserting it, and I also checked the card on my computer where it shows up as FAT32 format without issues. Is there a specific way I need to format it or a reset I should perform on the camera to get it to read the card?\n\nAppreciate any guidance you can provide.\n\nKevin O'Connor"
  },
  {
    name: "Teresa Huang",
    email: "teresa.huang@example.invalid",
    phone: "+1 (619) 555-0138",
    shippingAddress: "880 Harbor Drive, San Diego, CA 92101",
    product: "Wyze Robot Vacuum",
    macAddress: "00:23:AA:77:88:99",
    serialNumber: "WRV-55102948",
    orderNumber: "WYZE-ORD-339102",
    retailer: "Wyze.com Official Store",
    purchaseDate: "2025-06-18",
    emotionalState: "Frustrated",
    issueCategory: "Missing footage or cloud storage confusion",
    symptomDetails: "Vacuum LiDAR sensor says 'Radar blocked' even after cleaning sensor with microfiber cloth.",
    chatOpening: "Hi, my Wyze Robot Vacuum keeps giving an error saying 'LiDAR sensor is blocked. Please gently tap the radar cover' right after leaving the dock.",
    emailSubject: "Robot Vacuum LiDAR sensor blocked error - won't start cleaning",
    emailBody: "Dear Wyze Support,\n\nOur Wyze Robot Vacuum has suddenly stopped working this week. Every time I press the Clean button in the app or on the vacuum itself, it backs off the charging dock by a few inches, spins slightly, and then an audio voice says 'LiDAR sensor is blocked, please check for obstructions'. In the app, it throws Error Code 1.\n\nI have thoroughly inspected the orange top turret. There are no hair, dust, or stickers blocking the laser diodes. I even blew clean compressed air into the sensor housing and gently tapped the bumper as suggested in the online help forums, but it continues to give the exact same error every single time.\n\nCan someone please help me get this resolved? Our household has two dogs and we rely on this vacuum daily.\n\nTeresa Huang\nOrder #WYZE-ORD-339102"
  },
  {
    name: "Jamal Crawford",
    email: "jamal.crawford@example.invalid",
    phone: "+1 (313) 555-0199",
    shippingAddress: "1420 Woodward Ave, Detroit, MI 48226",
    product: "Wyze Bulb Color (4-Pack)",
    macAddress: "D8:97:BA:44:22:01",
    serialNumber: "WBC4-99102837",
    orderNumber: "HD-55192847",
    retailer: "Home Depot",
    purchaseDate: "2025-10-10",
    emotionalState: "Confused, low technical confidence",
    issueCategory: "Smart-home integration issue — routines, Alexa, or Google Assistant won't work",
    symptomDetails: "Cannot pair 3rd and 4th bulbs in the living room; lights blink once and fail pairing.",
    chatOpening: "Hello! I bought a 4-pack of Wyze Color Bulbs. Two of them paired easily, but the other two won't pulse during setup and won't connect.",
    emailSubject: "Trouble pairing 2 bulbs from 4-pack of Wyze Bulb Color",
    emailBody: "Hello Wyze Support,\n\nI purchased the Wyze Bulb Color 4-pack from Home Depot last weekend. I installed two of the bulbs in my hallway and they paired up immediately through the Wyze app without any trouble. However, when I put the remaining two bulbs into my ceiling fan fixtures in the bedroom, I cannot get them into pairing mode.\n\nI tried turning the wall switch on and off three times as described in the quick start guide, but instead of pulsing softly like the first two did, these two bulbs just stay at a solid bright white light. The app searches for 2 minutes and then tells me 'No device found'. Am I doing the switch timing wrong, or could these two bulbs be stuck on an old profile?\n\nPlease let me know how to reset them.\n\nJamal Crawford"
  },
  {
    name: "Megan O'Reilly",
    email: "megan.oreilly@example.invalid",
    phone: "+1 (612) 555-0149",
    shippingAddress: "701 Hennepin Ave, Minneapolis, MN 55403",
    product: "Wyze Cam v3 Pro",
    macAddress: "44:48:C1:22:90:3A",
    serialNumber: "W3P-99201948",
    orderNumber: "WYZE-ORD-119284",
    retailer: "Wyze.com",
    purchaseDate: "2025-07-29",
    emotionalState: "Anxious or worried",
    issueCategory: "Night vision or overall image quality looks dark, grainy, or washed out",
    symptomDetails: "Night vision IR reflections against window glass cause glare and blinding white reflection.",
    chatOpening: "Hi, I have my Wyze Cam v3 Pro set up on my window sill pointed outside, but at night the picture is completely white glare and I can't see the yard.",
    emailSubject: "Night vision reflection glare through window on Cam v3 Pro",
    emailBody: "Hello Support,\n\nI recently moved my Wyze Cam v3 Pro to sit on my living room windowsill pointed out at our front walkway. During daylight hours, the 2K image is crystal clear. But as soon as night falls and the camera switches to Night Vision, the entire screen becomes a blinding white haze and reflection of the camera itself in the glass.\n\nI am not able to mount the camera outside on the siding because our HOA does not allow drilling into the exterior facade. Is there a setting in the camera or a special accessory that allows shooting through a glass window at night without the infrared lights reflecting back into the lens?\n\nThank you,\nMegan O'Reilly"
  },
  {
    name: "Carlos Santana-Reyes",
    email: "carlos.santana.reyes@example.invalid",
    phone: "+1 (702) 555-0177",
    shippingAddress: "3700 S Las Vegas Blvd, Las Vegas, NV 89109",
    product: "Wyze Sprinkler Controller",
    macAddress: "8C:AA:B5:19:28:34",
    serialNumber: "WSC-88192847",
    orderNumber: "WYZE-ORD-449102",
    retailer: "Wyze.com Official Store",
    purchaseDate: "2025-05-14",
    emotionalState: "Calm and neutral",
    issueCategory: "Feature confusion — customer isn't sure how to do something",
    symptomDetails: "Needs guidance on wiring master valve / pump start relay into the controller terminal.",
    chatOpening: "Hello! I am replacing my old Hunter sprinkler timer with the Wyze Sprinkler Controller. My old system has a wire labeled 'MV/P' and I'm not sure which slot it goes into.",
    emailSubject: "Wiring question: Where to connect MV/P wire on Wyze Sprinkler",
    emailBody: "Good morning Wyze Tech Support,\n\nI am currently in the middle of installing the Wyze Sprinkler Controller (8-zone) that I ordered back in May. I took a photo of my old Hunter sprinkler timer wiring before removing it. I have 6 zone wires connected to 1-6, and one white Common wire connected to C. However, there is an extra wire labeled 'P/MV' that was connected to a terminal called Master Valve on the old box.\n\nOn the Wyze Sprinkler controller, I see terminals 1 through 8 and two 'C' slots, but I don't see a slot specifically marked MV. Does the Wyze controller support a master valve or pump start relay, and if so, which terminal should I plug this wire into and what setting in the app enables it?\n\nBest,\nCarlos Santana-Reyes"
  },
  {
    name: "Danielle Brooks",
    email: "danielle.brooks@example.invalid",
    phone: "+1 (305) 555-0181",
    shippingAddress: "1100 Biscayne Blvd, Miami, FL 33132",
    product: "Wyze Air Purifier",
    macAddress: "9C:8E:99:11:44:33",
    serialNumber: "WAP-33910294",
    orderNumber: "AMZ-113-4410293-881",
    retailer: "Amazon",
    purchaseDate: "2025-09-18",
    emotionalState: "Mildly annoyed",
    issueCategory: "Hardware malfunction (battery, audio, video quality)",
    symptomDetails: "Air Purifier filter replacement light stays red after putting in a genuine Wyze replacement filter.",
    chatOpening: "Hi. I just installed a brand new genuine Wyze HEPA filter into my Wyze Air Purifier, but the red filter light on top won't turn off.",
    emailSubject: "Red filter light won't reset on Wyze Air Purifier after new filter",
    emailBody: "Hello Support,\n\nI ordered a genuine Wyze replacement filter from Amazon for my Wyze Air Purifier. I unplugged the purifier, removed the plastic packaging from the new filter, inserted it into the drum, and closed the back panel.\n\nHowever, when I turned the machine back on, the filter icon indicator on the top touch display remains illuminated solid red, and in the Wyze app it still says 'Filter Life: 0% - Replace Filter'. I tried holding the power button for 3 seconds but it just turned the unit off. How do I reset the filter life counter so it knows a fresh filter has been installed?\n\nDanielle Brooks\nMiami, FL"
  },
  {
    name: "Victor Stone",
    email: "victor.stone88@example.invalid",
    phone: "+1 (214) 555-0155",
    shippingAddress: "2100 Ross Ave, Dallas, TX 75201",
    product: "Wyze Cam v4 (2-Pack)",
    macAddress: "2C:AA:8E:77:88:99",
    serialNumber: "WZC4-99102938",
    orderNumber: "WYZE-ORD-882194",
    retailer: "Wyze.com Official Store",
    purchaseDate: "2025-10-20",
    emotionalState: "Frustrated",
    issueCategory: "Shipping or delivery delay",
    symptomDetails: "Package tracking shows 'Delivered to front porch' 3 days ago but no package arrived.",
    chatOpening: "Hi, my order for the Wyze Cam v4 2-pack says delivered on FedEx tracking three days ago, but I have checked everywhere and there is no package on my porch.",
    emailSubject: "Order WYZE-ORD-882194 marked delivered by FedEx but never received",
    emailBody: "Dear Wyze Customer Support,\n\nI placed an order for the Wyze Cam v4 2-Pack on October 20th under Order #WYZE-ORD-882194. According to the FedEx tracking link provided in your shipment email (Tracking #781920491823), the status says 'Delivered - Left at Front Door' this past Thursday at 2:15 PM.\n\nI was home all afternoon, and nobody approached our front door. I checked with our neighbors on both sides, as well as our building leasing office, and nobody has seen the package. It has now been over 72 hours since the delivery scan, and the carrier told me I must contact the merchant to open a lost in transit claim. Could you please either initiate a replacement shipment or issue a refund?\n\nThank you,\nVictor Stone"
  },
  {
    name: "Grace Kim",
    email: "grace.kim.design@example.invalid",
    phone: "+1 (503) 555-0164",
    shippingAddress: "1000 SW Broadway, Portland, OR 97205",
    product: "Wyze Video Doorbell Pro",
    macAddress: "68:C6:3A:44:11:88",
    serialNumber: "WDBP-44102938",
    orderNumber: "WYZE-ORD-772910",
    retailer: "Wyze.com",
    purchaseDate: "2025-08-04",
    emotionalState: "Very upset, ready to escalate",
    issueCategory: "Damaged or defective item — replacement / RMA request",
    symptomDetails: "Doorbell chime won't ring when physical button is pressed; only sends silent push notification.",
    chatOpening: "Hello. When people press the button on my Video Doorbell Pro outside, the wireless chime in my hallway stays silent. People have been missing deliveries.",
    emailSubject: "Wireless chime not sounding when Doorbell Pro button pressed",
    emailBody: "Wyze Support,\n\nI am experiencing a very frustrating issue with my Wyze Video Doorbell Pro. Whenever a guest or delivery courier presses the doorbell button on my front porch, the chime box that is plugged into the wall in our hallway does not make any sound at all.\n\nMy phone receives a push notification, but my elderly mother who does not carry a smartphone has missed three package deliveries and a doctor's visit this week because the house chime did not ring. I tried pressing the sync button on the side of the chime box, but it only flashes yellow. I need this chime working immediately or I need an RMA replacement.\n\nGrace Kim\nPortland, OR"
  },
  {
    name: "Brandon Lee",
    email: "brandon.lee93@example.invalid",
    phone: "+1 (808) 555-0122",
    shippingAddress: "2201 Kalakaua Ave, Honolulu, HI 96815",
    product: "Wyze Cam OG",
    macAddress: "A4:DA:22:11:00:FE",
    serialNumber: "WOG-99201948",
    orderNumber: "AMZ-111-9920184-771",
    retailer: "Amazon",
    purchaseDate: "2025-09-15",
    emotionalState: "Confused, low technical confidence",
    issueCategory: "The live view is black, frozen, or keeps buffering",
    symptomDetails: "Live stream gets stuck at '3/3 Getting video data' then buffers indefinitely on 5G cellular.",
    chatOpening: "Aloha. When I open the live stream for my Wyze Cam OG while I am away from home on my cellular data, it gets stuck on 'Step 3/3 Getting video data' and never loads.",
    emailSubject: "Live view buffering at step 3/3 when outside home Wi-Fi",
    emailBody: "Hello Wyze Team,\n\nI have a Wyze Cam OG installed in my backyard that works fine when my phone is connected to my home Wi-Fi network. But whenever I leave the house and try to view the camera over my T-Mobile 5G cellular connection, the app gets stuck loading at '3/3 Getting video data' with a spinning circle and eventually displays 'Connection failed (Error code 27)'.\n\nI can still see recorded event clips in the Events tab, but the real-time live view will not connect unless I am standing in my house on the same Wi-Fi network. What setting on my camera or phone do I need to change so I can see my yard while at work?\n\nMahalo,\nBrandon Lee"
  },
  {
    name: "Natalie Portwood",
    email: "natalie.p.homes@example.invalid",
    phone: "+1 (615) 555-0167",
    shippingAddress: "401 Union St, Nashville, TN 37219",
    product: "Wyze Sense v2 Kit",
    macAddress: "5C:AA:FD:88:12:00",
    serialNumber: "WS2-99102837",
    orderNumber: "WYZE-ORD-661928",
    retailer: "Wyze.com Official Store",
    purchaseDate: "2025-06-20",
    emotionalState: "Anxious or worried",
    issueCategory: "Privacy or security concern (unexpected access, odd notifications)",
    symptomDetails: "Entry sensor on back door reporting 'Open' when the door is physically latched and closed.",
    chatOpening: "Hello! My Wyze entry sensor on my back sliding door is showing 'Open' in the app right now, but I am standing right next to it and the door is completely closed and locked.",
    emailSubject: "Entry sensor false 'Open' status causing home monitoring alarms",
    emailBody: "Dear Wyze Support Team,\n\nI have the Wyze Home Monitoring system with entry sensors on all ground floor doors. Starting yesterday afternoon, the entry sensor on our rear sliding glass door keeps falsely reporting as 'Open' even though the door is completely closed and deadbolted.\n\nBecause of this false reading, I cannot arm the system in 'Away' mode without bypassing the back door, which leaves our house vulnerable. I checked the alignment between the sensor and the small magnet, and they are less than a quarter inch apart with both notches aligned. Could the battery be low, or has the sensor sensor fallen out of calibration?\n\nPlease help me resolve this so we can arm our security system before the weekend.\n\nNatalie Portwood\nNashville, TN"
  },
  {
    name: "Oliver Quinn",
    email: "oliver.quinn@example.invalid",
    phone: "+1 (312) 555-0145",
    shippingAddress: "100 N Michigan Ave, Chicago, IL 60601",
    product: "Wyze Cam v4",
    macAddress: "2C:AA:8E:11:44:88",
    serialNumber: "WZC4-77192847",
    orderNumber: "WYZE-ORD-992019",
    retailer: "Wyze.com",
    purchaseDate: "2025-10-25",
    emotionalState: "Calm and neutral",
    issueCategory: "Device offline or won't connect to Wi-Fi",
    symptomDetails: "New out of box camera won't scan QR code on smartphone screen during initial setup.",
    chatOpening: "Hi there. I just opened my new Wyze Cam v4 and I am stuck on setup. The camera keeps repeating 'Ready to connect' but won't scan the QR code on my phone.",
    emailSubject: "Wyze Cam v4 will not scan QR code on iPhone during setup",
    emailBody: "Hello Support,\n\nI just received my new Wyze Cam v4 that I purchased during your recent promotion (Order #WYZE-ORD-992019). I plugged the camera in with the included cable and power adapter. After pressing the setup button on the bottom, the voice announces 'Ready to connect'.\n\nHowever, when I hold the QR code on my iPhone screen 6 to 10 inches in front of the lens as directed in the app, nothing happens. It never beeps or says 'QR code scanned'. I tried adjusting the brightness on my screen to maximum, moving closer and further away, and cleaning the lens protective film. Am I missing a step to complete this setup?\n\nThanks,\nOliver Quinn"
  }
];

// Dynamically generate remaining distinct personas up to 60 total
const FIRST_NAMES = ["Mason", "Sophia", "Liam", "Isabella", "Lucas", "Mia", "Ethan", "Harper", "Aiden", "Evelyn", "Jackson", "Abigail", "Logan", "Emily", "Noah", "Charlotte", "Oliver", "Amelia", "Elijah", "Ava", "James", "Emma", "Benjamin", "Olivia", "Lucas", "Ella", "Henry", "Scarlett", "Alexander", "Grace", "Sebastian", "Chloe", "Jack", "Victoria", "Samuel", "Riley", "Owen", "Aria", "Matthew", "Lily"];
const LAST_NAMES = ["Sterling", "Mercer", "Sinclair", "Montgomery", "Callahan", "Donovan", "Gallagher", "Kensington", "Barrington", "Vanderbilt", "Blackwood", "Whitmore", "Hawthorne", "Covington", "Bradford", "Lancaster", "Prescott", "Winslow", "Fairchild", "Carrington", "Somerset", "Pemberton", "Harrington", "Ellington", "Ashford", "Kingsley", "Waverly", "Thornton", "St. Clair", "Lockwood"];
const PRODUCTS = [
  "Wyze Cam v4", "Wyze Battery Cam Pro", "Wyze Cam Pan v3", "Wyze Video Doorbell v2",
  "Wyze Lock Bolt", "Wyze Mesh Router Pro 6E", "Wyze Thermostat", "Wyze Cam Floodlight Pro",
  "Wyze Cam OG", "Wyze Robot Vacuum", "Wyze Bulb Color", "Wyze Sprinkler Controller",
  "Wyze Cam Plus Unlimited", "Wyze Cam Outdoor v2", "Wyze Air Purifier"
];
const ISSUES = [
  "Device offline or won't connect to Wi-Fi",
  "App or account login trouble",
  "Missing footage or cloud storage confusion",
  "Hardware malfunction (battery, audio, video quality)",
  "Shipping or delivery delay",
  "Damaged or defective item — replacement / RMA request",
  "Billing or Cam Plus subscription dispute",
  "Motion detection or event clips not triggering when they should",
  "SD card won't be recognized, or recorded video won't play back",
  "Wireless camera battery draining too fast or not charging",
  "The live view is black, frozen, or keeps buffering",
  "Two-way audio — the speaker or microphone isn't working",
  "Push notifications for events aren't arriving (or are showing too many)",
  "Night vision or overall image quality looks dark, grainy, or washed out",
  "Smart-home integration issue — routines, Alexa, or Google Assistant won't work"
];
const MOODS = ["Frustrated", "Confused, low technical confidence", "Annoyed", "Anxious or worried", "Calm and neutral", "Very upset, ready to escalate"];
const RETAILERS = ["Wyze.com Official Store", "Amazon Prime (Wyze Authorized)", "Home Depot", "Best Buy", "Target"];

// Populate remaining to reach 60+ unique customers
while (CUSTOMER_POOL.length < 60) {
  const idx = CUSTOMER_POOL.length;
  const fName = FIRST_NAMES[idx % FIRST_NAMES.length];
  const lName = LAST_NAMES[(idx * 3) % LAST_NAMES.length];
  const prod = PRODUCTS[idx % PRODUCTS.length];
  const issue = ISSUES[idx % ISSUES.length];
  const mood = MOODS[idx % MOODS.length];
  const ret = RETAILERS[idx % RETAILERS.length];
  const mac = `2C:AA:${(idx * 7 % 90 + 10).toString(16).toUpperCase()}:${(idx * 13 % 90 + 10).toString(16).toUpperCase()}:${(idx * 17 % 90 + 10).toString(16).toUpperCase()}:${(idx * 23 % 90 + 10).toString(16).toUpperCase()}`;
  const sn = `WZ-${prod.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase()}-${Math.floor(10000000 + Math.random() * 89999999)}`;
  const ord = `ORD-WZ-${Math.floor(100000 + Math.random() * 899999)}`;
  const phone = `+1 (${Math.floor(200 + Math.random() * 700)}) 555-01${String(idx).padStart(2, '0')}`;
  const addr = `${100 + idx * 14} Maplewood Ave, Cityville, ST ${10000 + idx * 11}`;

  CUSTOMER_POOL.push({
    name: `${fName} ${lName}`,
    email: `${fName.toLowerCase()}.${lName.toLowerCase()}@example.invalid`,
    phone: phone,
    shippingAddress: addr,
    product: prod,
    macAddress: mac,
    serialNumber: sn,
    orderNumber: ord,
    retailer: ret,
    purchaseDate: `2025-${String(1 + (idx % 11)).padStart(2, '0')}-${String(1 + (idx % 27)).padStart(2, '0')}`,
    emotionalState: mood,
    issueCategory: issue,
    symptomDetails: `Customer noticed ${prod} is having ${issue.toLowerCase()}. Needs clear, patient guidance.`,
    chatOpening: `Hi, I am reaching out because my ${prod} is having an issue with ${issue.toLowerCase()}. What should I do to fix this?`,
    emailSubject: `Need assistance with ${prod} - ${issue}`,
    emailBody: `Hello Wyze Support Team,\n\nI purchased my ${prod} from ${ret} (Order #${ord}) and have been having trouble with it recently. Specifically, I am experiencing: ${issue.toLowerCase()}.\n\nI am not very technical with smart home hardware, so I wanted to reach out to official support before trying anything that might make it worse. Could someone please get back to me with step-by-step instructions on how to resolve this?\n\nCustomer Name: ${fName} ${lName}\nOrder: ${ord}\nProduct: ${prod}\n\nThank you for your time and assistance.`
  });
}

export function getCustomerByIdx(idx: number): CustomerIdentity {
  const safeIdx = Math.abs(idx) % CUSTOMER_POOL.length;
  return CUSTOMER_POOL[safeIdx];
}
