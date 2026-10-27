(function(){
  'use strict';

  var CATEGORY_LABELS = {
    random: "Random — pick a realistic Wyze support scenario",
    connectivity: "Device offline or won't connect to Wi-Fi (Wyze Cam v4 / Pan v3 / Battery Cam Pro)",
    account: "App or account login trouble (2FA verification, password reset, account lock)",
    footage: "Missing footage or cloud storage confusion (Cam Plus event clip playback vs microSD continuous)",
    hardware: "Hardware malfunction (battery drain, purple video tint, clicking sound, lens moisture)",
    shipping: "Shipping or delivery delay (order tracking, FedEx/USPS transit stall, package marked delivered but missing)",
    rma: "Damaged or defective item — replacement / RMA warranty request (under 1-year Wyze limited warranty)",
    billing: "Billing or Cam Plus subscription dispute (duplicate charge, auto-renewal cancellation, coupon discount missing)",
    privacy: "Privacy or security concern (unexpected access notification, sharing camera permission, IP address verification)",
    howto: "Feature confusion — customer isn't sure how to configure rules, schedules, or sensitivity",
    motion: "Motion detection or event clips not triggering (AI detection filters, detection zone grid configuration)",
    sd: "MicroSD card not recognized or recorded video won't play back (FAT32/exFAT format, continuous recording)",
    battery: "Wireless camera battery draining too fast or not charging (solar panel connection, cold weather impact)",
    view: "The live view is black, frozen, or keeps buffering (network bandwidth, bitrate drop, router channel congestion)",
    audio: "Two-way audio — the speaker or microphone isn't working (Wyze app microphone permission, chime volume)",
    notify: "Push notifications for events aren't arriving or are showing too many (iOS background refresh, Android notification channel)",
    night: "Night vision or overall image quality looks dark, grainy, or washed out (IR lights reflection on window glass, spotlight toggle)",
    home: "Smart-home integration issue — routines, Alexa, or Google Assistant won't sync devices",
    lock: "Wyze Lock Bolt fingerprint or keypad code failing (fingerprint sensor calibration, auto-lock timer)",
    thermostat: "Wyze Thermostat blowing cold air when calling for heat (O/B reversing valve, C-wire adapter wiring)"
  };

  var EMOTION_LABELS = {
    random: "Random — pick a fitting emotional tone",
    calm: "Calm and neutral",
    annoyed: "Mildly annoyed",
    frustrated: "Frustrated",
    upset: "Very upset, ready to escalate",
    anxious: "Anxious or worried",
    confused: "Confused, low technical confidence"
  };

  var TRAINER_PASSCODE = 'wyzeleadership';
  var loginProfile = null;
  var workspaceInitialized = false;
  var simMode = 'chat'; // 'chat' or 'email'
  var activeComposerTab = 'public'; // 'public' or 'internal'

  var AVATARS = [
    {
      id: 'alex',
      name: 'Alex (Support Specialist)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#0D9488"/><circle cx="36" cy="36" r="32" fill="#14B8A6" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#1E293B"/><circle cx="36" cy="33" r="14" fill="#FBD5B5"/><path d="M22 28c0-8 6-14 14-14s14 6 14 14c0 2-1 4-2 4h-26c-1 0-2-2-2-4z" fill="#1F2937"/><ellipse cx="31" cy="33" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="33" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 39q3 2 6 0" stroke="#B45309" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M21 30q15-18 30 0" stroke="#CBD5E1" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="18" y="27" width="5" height="12" rx="2.5" fill="#0F766E"/><rect x="49" y="27" width="5" height="12" rx="2.5" fill="#0F766E"/><path d="M22 36l9 6" stroke="#0F766E" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="43" r="2.2" fill="#14B8A6"/></svg>'
    },
    {
      id: 'jordan',
      name: 'Jordan (Senior Lead)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#2563EB"/><circle cx="36" cy="36" r="32" fill="#3B82F6" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#0F766E"/><circle cx="36" cy="33" r="14" fill="#D4A373"/><path d="M21 27c1-9 7-14 15-14s14 5 15 14c-4-3-8-4-15-4s-11 1-15 4z" fill="#3E2723"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 40q3 2 6 0" stroke="#854D0E" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M20 29q16-16 32 0" stroke="#475569" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="18" y="26" width="5" height="12" rx="2.5" fill="#1E293B"/><rect x="49" y="26" width="5" height="12" rx="2.5" fill="#1E293B"/><path d="M50 36l-8 6" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="43" r="2.2" fill="#3B82F6"/></svg>'
    },
    {
      id: 'maria',
      name: 'Maria (Customer Advocate)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#E11D48"/><circle cx="36" cy="36" r="32" fill="#FB7185" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#881337"/><circle cx="36" cy="33" r="14" fill="#F0C097"/><path d="M19 36c-2-8 3-18 17-18s19 10 17 18c-3-2-7-3-17-3s-14 1-17 3z" fill="#18181B"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 40q3 2.5 6 0" stroke="#BE123C" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M21 30q15-18 30 0" stroke="#F1F5F9" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="18" y="27" width="5" height="12" rx="2.5" fill="#E11D48"/><rect x="49" y="27" width="5" height="12" rx="2.5" fill="#E11D48"/><path d="M22 36l9 6" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="43" r="2.2" fill="#FB7185"/></svg>'
    },
    {
      id: 'devon',
      name: 'Devon (Senior IoT Advisor)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#4F46E5"/><circle cx="36" cy="36" r="32" fill="#818CF8" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#312E81"/><circle cx="36" cy="33" r="14" fill="#8D5B4C"/><path d="M22 25c1-7 6-12 14-12s13 5 14 12c-3-1-7-2-14-2s-11 1-14 2z" fill="#1C1917"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1C1917"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1C1917"/><path d="M33 40q3 2 6 0" stroke="#451A03" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M20 29q16-16 32 0" stroke="#E2E8F0" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="18" y="26" width="5" height="12" rx="2.5" fill="#1E1B4B"/><rect x="49" y="26" width="5" height="12" rx="2.5" fill="#1E1B4B"/><path d="M50 36l-8 6" stroke="#4F46E5" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="43" r="2.2" fill="#A5B4FC"/></svg>'
    },
    {
      id: 'priya',
      name: 'Priya (Connectivity Expert)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#D97706"/><circle cx="36" cy="36" r="32" fill="#FBBF24" opacity=".35"/><circle cx="36" cy="17" r="7" fill="#111827"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#065F46"/><circle cx="36" cy="34" r="13.5" fill="#C68642"/><path d="M22 29c1-7 6-11 14-11s13 4 14 11c-3-2-7-3-14-3s-11 1-14 3z" fill="#111827"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 40q3 2.5 6 0" stroke="#92400E" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M21 30q15-17 30 0" stroke="#CBD5E1" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="18" y="27" width="5" height="12" rx="2.5" fill="#0F766E"/><rect x="49" y="27" width="5" height="12" rx="2.5" fill="#0F766E"/><path d="M22 36l9 6" stroke="#0F766E" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="43" r="2.2" fill="#34D399"/></svg>'
    },
    {
      id: 'sam',
      name: 'Sam (Smart Home Guide)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#059669"/><circle cx="36" cy="36" r="32" fill="#34D399" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#1E3A8A"/><circle cx="36" cy="33" r="14" fill="#FDDCB5"/><path d="M21 26c2-8 7-13 15-13s13 5 15 13c-4-2-8-3-15-3s-11 1-15 3z" fill="#B45309"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 40q3 2 6 0" stroke="#B45309" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M20 29q16-16 32 0" stroke="#64748B" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="18" y="26" width="5" height="12" rx="2.5" fill="#0F172A"/><rect x="49" y="26" width="5" height="12" rx="2.5" fill="#0F172A"/><path d="M50 36l-8 6" stroke="#059669" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="43" r="2.2" fill="#10B981"/></svg>'
    },
    {
      id: 'marcus',
      name: 'Marcus (Hardware Specialist)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#3B82F6"/><circle cx="36" cy="36" r="32" fill="#60A5FA" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#0D9488"/><circle cx="36" cy="33" r="14" fill="#714B36"/><path d="M22 24c1-6 6-10 14-10s13 4 14 10c-3-1-7-2-14-2s-11 1-14 2z" fill="#18181B"/><ellipse cx="31" cy="33" rx="2" ry="2.5" fill="#18181B"/><ellipse cx="41" cy="33" rx="2" ry="2.5" fill="#18181B"/><path d="M31 38c1 3 3 4 5 4s4-1 5-4" stroke="#18181B" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 29q16-16 32 0" stroke="#CBD5E1" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="18" y="26" width="5" height="12" rx="2.5" fill="#1E293B"/><rect x="49" y="26" width="5" height="12" rx="2.5" fill="#1E293B"/><path d="M22 36l9 6" stroke="#0D9488" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="43" r="2.2" fill="#14B8A6"/></svg>'
    },
    {
      id: 'elena',
      name: 'Elena (Device Care Lead)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#7C3AED"/><circle cx="36" cy="36" r="32" fill="#A78BFA" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#1E293B"/><circle cx="36" cy="33" r="14" fill="#FEE3D2"/><path d="M20 32c-1-10 5-18 16-18s17 8 16 18c-3-2-7-3-16-3s-13 1-16 3z" fill="#D97706"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 40q3 2 6 0" stroke="#B45309" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M21 30q15-18 30 0" stroke="#F8FAFC" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="18" y="27" width="5" height="12" rx="2.5" fill="#7C3AED"/><rect x="49" y="27" width="5" height="12" rx="2.5" fill="#7C3AED"/><path d="M50 36l-8 6" stroke="#7C3AED" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="43" r="2.2" fill="#C4B5FD"/></svg>'
    },
    {
      id: 'taylor',
      name: 'Taylor (Customer Care)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#0891B2"/><circle cx="36" cy="36" r="32" fill="#22D3EE" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#334155"/><circle cx="36" cy="33" r="14" fill="#E8BE9B"/><path d="M21 26c1-8 7-13 15-13s14 5 15 13c-4-2-8-3-15-3s-11 1-15 3z" fill="#4A3525"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 40q3 2 6 0" stroke="#78350F" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M20 29q16-16 32 0" stroke="#94A3B8" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="18" y="26" width="5" height="12" rx="2.5" fill="#0E7490"/><rect x="49" y="26" width="5" height="12" rx="2.5" fill="#0E7490"/><path d="M22 36l9 6" stroke="#0891B2" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="43" r="2.2" fill="#06B6D4"/></svg>'
    },
    {
      id: 'kai',
      name: 'Kai (Firmware & Camera Tech)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#0284C7"/><circle cx="36" cy="36" r="32" fill="#38BDF8" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#1E293B"/><circle cx="36" cy="33" r="14" fill="#FCDCC4"/><path d="M21 27c2-8 7-14 15-14s13 6 15 14c-4-3-8-4-15-4s-11 1-15 4z" fill="#0F172A"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 40q3 2 6 0" stroke="#9A3412" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M20 29q16-16 32 0" stroke="#CBD5E1" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="18" y="26" width="5" height="12" rx="2.5" fill="#0369A1"/><rect x="49" y="26" width="5" height="12" rx="2.5" fill="#0369A1"/><path d="M50 36l-8 6" stroke="#0284C7" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="43" r="2.2" fill="#38BDF8"/></svg>'
    },
    {
      id: 'zoe',
      name: 'Zoe (Resolution Specialist)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#C026D3"/><circle cx="36" cy="36" r="32" fill="#E879F9" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#92400E"/><circle cx="36" cy="33" r="14" fill="#93583C"/><path d="M19 32c-2-9 4-17 17-17s19 8 17 17c-3-2-7-3-17-3s-14 1-17 3z" fill="#171717"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#171717"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#171717"/><path d="M33 40q3 2.5 6 0" stroke="#78350F" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M21 30q15-18 30 0" stroke="#FDF4FF" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="18" y="27" width="5" height="12" rx="2.5" fill="#C026D3"/><rect x="49" y="27" width="5" height="12" rx="2.5" fill="#C026D3"/><path d="M22 36l9 6" stroke="#C026D3" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="43" r="2.2" fill="#F0ABFC"/></svg>'
    },
    {
      id: 'chris',
      name: 'Chris (Tier 1 Support)',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#16A34A"/><circle cx="36" cy="36" r="32" fill="#4ADE80" opacity=".35"/><path d="M18 64c0-10 8-18 18-18s18 8 18 18" fill="#1D4ED8"/><circle cx="36" cy="33" r="14" fill="#F5D0B0"/><path d="M22 25c1-7 6-12 14-12s13 5 14 12c-3-1-7-2-14-2s-11 1-14 2z" fill="#52525B"/><ellipse cx="31" cy="34" rx="2" ry="2.5" fill="#1E293B"/><ellipse cx="41" cy="34" rx="2" ry="2.5" fill="#1E293B"/><path d="M33 40q3 2 6 0" stroke="#B45309" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M20 29q16-16 32 0" stroke="#E2E8F0" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="18" y="26" width="5" height="12" rx="2.5" fill="#15803D"/><rect x="49" y="26" width="5" height="12" rx="2.5" fill="#15803D"/><path d="M50 36l-8 6" stroke="#16A34A" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="43" r="2.2" fill="#86EFAC"/></svg>'
    }
  ];

  var WYZE_CATALOG = [
    "Cameras & Indoor/Outdoor: Wyze Cam v4 (2.5K QHD, Color Night Vision, Wi-Fi 6), Wyze Cam Pan v3 (360 Pan/Tilt, IP65 Weatherproof), Wyze Battery Cam Pro (2K Wire-Free, radar detection), Wyze Cam OG & OG Telephoto (3x zoom, PIP), Wyze Cam Floodlight Pro (3000 lumens, 180 FOV, ambient sensor), Wyze Cam Floodlight v2, Wyze Cam v3, Wyze Cam v3 Pro, Wyze Cam Outdoor v2",
    "Video Doorbells: Wyze Video Doorbell v2 (2K, head-to-toe view, microSD local chime recording, chime controller), Wyze Video Doorbell Pro (wire-free, 1:1 aspect ratio), Wyze Video Doorbell v1",
    "Smart Locks & Access: Wyze Lock Bolt (fingerprint keypad, Bluetooth auto-unlock, 50 user capacity), Wyze Lock (auto-lock/unlock with door sensor), Wyze Keypad v2",
    "Home Networking: Wyze Mesh Router Pro 6E (Tri-band, up to 3000 sq ft, 2.5 Gbps Ethernet), Wyze Mesh Router 6, Wyze Mesh Satellite nodes",
    "Climate & HVAC: Wyze Thermostat (7-day scheduling, C-wire adapter included, furnace/heat pump compatible), Wyze Room Sensor (remote temperature/humidity averaging)",
    "Home Automation & Lighting: Wyze Bulb Color (16 million colors, Tunable White, Sun Match circadian), Wyze Light Strip Pro (individually addressable color segments, music sync), Wyze Plug, Wyze Plug Outdoor (dual grounded outlets, IP64)",
    "Robotics & Floor Care: Wyze Robot Vacuum (LiDAR room mapping, virtual boundary walls, multi-floor maps), Wyze Cordless Vacuum S",
    "Wellness & Air Quality: Wyze Air Purifier (HEPA H13 CADR 350, laser PM2.5 particle sensor), Wyze Smart Scale X (body composition, heart rate), Wyze Buds Pro (active noise cancellation), Wyze Watch 47c",
    "Lawn & Garden: Wyze Sprinkler Controller (8-zone smart watering, weather skipping, EPA WaterSense certified)",
    "Services & Subscriptions: Cam Plus (AI person/vehicle/pet/package detection, unlimited event video length), Cam Plus Unlimited (unlimited cameras on one plan), Wyze Home Monitoring (24/7 professional dispatch), Wyze Care warranty extensions",
    "Promotions & Orders: Official Wyze seasonal bundles, holiday discount codes, order tracking delays (FedEx/USPS/UPS), and 1-year limited warranty RMA replacements."
  ].join('\n');

  // 50-Persona Sequential Rotation Pool for Rich, Diverse Synthetic Customers
  var CLIENT_50_NAMES = [
    'Marcus Vance','Priya Patel','Elena Rostova','Devon Washington','Chloe Bennett',
    'Liam O\'Connor','Sofia Reyes','Tariq Mansoor','Hannah Goldberg','Derek Miller',
    'Aaliyah Johnson','Oliver Schmidt','Samantha Wright','Carlos Mendez','Zoe Nakamura',
    'Ethan Davis','Maya Lin','Gabriel Torres','Harper Scott','Noah Campbell',
    'Lucas Silva','Layla Al-Mansoor','Benjamin Hayes','Victoria Sterling','Jackson Reed',
    'Emily Zhao','Aiden Murphy','Natalie Cox','Elijah Foster','Savannah King',
    'Caleb Ross','Aubrey Diaz','Henry Powell','Grace Morgan','Ryan Jenkins',
    'Hazel Ramirez','Leo Kim','Brooke Sullivan','Nathan Ortiz','Stella Brooks',
    'Christian Hall','Scarlett Adams','Dominic Flores','Violet Watson','Isaiah Price',
    'Claire Henderson','Julian Cruz','Autumn Ward','Jordan Alvarez','Alex Mitchell'
  ];

  var CLIENT_50_CITIES = [
    ['Seattle','WA','98101','206'],['San Jose','CA','95123','408'],['Chicago','IL','60611','312'],
    ['Washington','DC','20006','202'],['Austin','TX','78704','512'],['Boston','MA','02116','617'],
    ['Miami','FL','33131','305'],['Houston','TX','77098','713'],['Philadelphia','PA','19103','215'],
    ['Denver','CO','80202','303'],['Atlanta','GA','30303','404'],['Phoenix','AZ','85001','602'],
    ['Portland','OR','97201','503'],['Raleigh','NC','27601','919'],['San Diego','CA','92101','619'],
    ['Minneapolis','MN','55401','612'],['Nashville','TN','37201','615'],['Detroit','MI','48201','313'],
    ['Indianapolis','IN','46201','317'],['Columbus','OH','43201','614'],['Charlotte','NC','28201','704'],
    ['Kansas City','MO','64101','816'],['Las Vegas','NV','89101','702'],['Salt Lake City','UT','84101','801'],
    ['Tampa','FL','33601','813'],['Orlando','FL','32801','407'],['Pittsburgh','PA','15201','412'],
    ['Cincinnati','OH','45201','513'],['St. Louis','MO','63101','314'],['Baltimore','MD','21201','410']
  ];

  function getRandomClientIndex(){
    var used = [];
    try {
      used = JSON.parse(localStorage.getItem('ece_used_persona_indices') || '[]');
    } catch(e){}
    if(!Array.isArray(used) || used.length >= CLIENT_50_NAMES.length){
      used = [];
    }
    var available = [];
    for(var i = 0; i < CLIENT_50_NAMES.length; i++){
      if(used.indexOf(i) === -1) available.push(i);
    }
    var chosen = available[Math.floor(Math.random() * available.length)];
    used.push(chosen);
    try {
      localStorage.setItem('ece_used_persona_indices', JSON.stringify(used));
    } catch(e){}
    return chosen;
  }

  function makeFictionalName(){
    var idx = getRandomClientIndex();
    return CLIENT_50_NAMES[idx];
  }

  function makeFakeCustomerDetails(persona){
    var idx = getRandomClientIndex();
    var name = CLIENT_50_NAMES[idx];
    if(!persona.name || persona.name === 'Jordan Alvarez' || persona.name.toLowerCase().includes('customer')){
      persona.name = name;
    }

    var safeSlug = persona.name.toLowerCase().replace(/[^a-z0-9]/g, '.');
    var city = CLIENT_50_CITIES[idx % CLIENT_50_CITIES.length];
    var areaCode = city[3];

    persona.email = persona.email || (safeSlug + (10 + idx) + '@example.invalid');
    persona.phone = persona.phone || ('+1 (' + areaCode + ') 555-01' + String(10 + (idx % 89)).padStart(2, '0'));
    persona.shippingAddress = persona.shippingAddress || ((100 + (idx * 37) % 880) + ' Oak Ridge Pkwy, ' + city[0] + ', ' + city[1] + ' ' + city[2]);
    persona.macAddress = persona.macAddress || ('2C:' + (10 + idx).toString(16).toUpperCase().padStart(2, '0') + ':9A:' + (30 + idx).toString(16).toUpperCase().padStart(2, '0') + ':7E:' + (idx * 17 % 256).toString(16).toUpperCase().padStart(2, '0'));
    persona.orderNumber = persona.orderNumber || ('TEST-WZ-' + (100000 + idx * 1827));
    persona.serialNumber = persona.serialNumber || ('TEST-SN-' + (400000 + idx * 2913));
    persona.purchaseDate = persona.purchaseDate || ('2025-0' + ((idx % 8) + 1) + '-' + (10 + (idx % 18)));
    persona.proofOfPurchase = persona.proofOfPurchase || ('Wyze.com Order #' + persona.orderNumber + ' on ' + persona.purchaseDate);
    return persona;
  }

  function newSession(type){
    type = type || 'chat';
    return {
      type: type, // 'chat' or 'email'
      sessionId: null,
      ticketId: null,
      createdAt: null,
      persona: null,
      messages: [],
      status: type === 'email' ? 'NEW' : 'OPEN', // Zendesk linear journey: NEW, OPEN, PENDING, ON_HOLD, SOLVED
      busy: false,
      holdDeadline: null,
      holdMinutes: null,
      feedback: null,
      typeStart: null,
      ended: false,
      cleared: false,
      abandoned: false,
      avgWpm: null,
      coachingPoints: null,
      traineeName: '',
      avatarId: 'pip',
      lob: '',
      // Email simulation specific fields
      emailSubject: '',
      emailNextReplyTs: null,
      emailMinMins: 30,
      emailMaxMins: 120,
      notes: { fCustomerName:'', fEmail:'', fProduct:'', fRecap:'', fResources:'', fNextSteps:'', fEscalation:'' }
    };
  }

  // Live Chat Sessions (1 or 2 slots)
  var chatSessions = [newSession('chat')];
  var activeChatIdx = 0;

  // Zendesk Email Ticket Sessions (3 concurrent slots)
  var emailSessions = [newSession('email'), newSession('email'), newSession('email')];
  var activeEmailIdx = 0;

  var sessions = chatSessions;
  var activeIndex = 0;
  var state = sessions[0];

  var trainerMode = false;
  var twoChats = false;
  var timerOn = false;
  var caseOpen = false;
  var trainerAccess = false;
  var serverSaveQueues = Object.create(null);

  function $(id){ return document.getElementById(id); }

  function on(target, event, handler){
    var el = typeof target === 'string' ? $(target) : target;
    if(el && typeof el.addEventListener === 'function'){
      el.addEventListener(event, handler);
    }
  }

  function escapeHtml(str){
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function genId(prefix){
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function genTicketId(){
    return 'WZ-' + Math.floor(100000 + Math.random() * 899999);
  }

  function fmtTime(ts){
    return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }

  function avatarMarkup(id, extraClass){
    var avatar = AVATARS.find(function(item){ return item.id === id; }) || AVATARS[0];
    var phase = AVATARS.indexOf(avatar) * -0.19;
    return '<span class="avatar-art avatar-' + avatar.id + ' ' + (extraClass || '') + '" style="--avatar-delay:' + phase + 's">' + avatar.art + '</span>';
  }

  function renderAvatarChoices(){
    var choices = $('avatarChoices');
    if(!choices) return;
    choices.innerHTML = AVATARS.map(function(avatar, index){
      return '<label class="avatar-choice">' +
        '<input type="radio" name="signUpAvatar" value="' + avatar.id + '"' + (index === 0 ? ' checked' : '') + ' required>' +
        '<span class="avatar-choice-card">' + avatarMarkup(avatar.id, 'avatar-choice-art') +
        '<span class="avatar-choice-name">' + escapeHtml(avatar.name) + '</span></span></label>';
    }).join('');
  }

  function renderAvatarModalChoices(currentSelectedId){
    var choices = $('avatarModalChoices');
    if(!choices) return;
    var activeId = currentSelectedId || (loginProfile ? loginProfile.avatarId : 'alex');
    choices.innerHTML = AVATARS.map(function(avatar){
      var isChecked = avatar.id === activeId;
      return '<label class="avatar-choice">' +
        '<input type="radio" name="modalAvatarChoice" value="' + avatar.id + '"' + (isChecked ? ' checked' : '') + '>' +
        '<span class="avatar-choice-card">' + avatarMarkup(avatar.id, 'avatar-choice-art') +
        '<span class="avatar-choice-name">' + escapeHtml(avatar.name) + '</span></span></label>';
    }).join('');
  }

  /* ---------- DOM References ---------- */
  var loginScreen = $('loginScreen');
  var appRoot = $('appRoot');
  var loginStatus = $('loginStatus');
  var loginStatusBanner = $('loginStatusBanner');
  var loginStatusDot = $('loginStatusDot');

  // Auth elements
  var tabSignIn = $('tabSignIn');
  var tabSignUp = $('tabSignUp');
  var signInView = $('signInView');
  var signUpView = $('signUpView');
  var forgotPasswordView = $('forgotPasswordView');
  var signInForm = $('signInForm');
  var signUpForm = $('signUpForm');
  var forgotPasswordForm = $('forgotPasswordForm');
  var continueSignUpBtn = $('continueSignUpBtn');
  var backToSignUpDetailsBtn = $('backToSignUpDetailsBtn');
  var signUpDetailsStep = $('signUpDetailsStep');
  var signUpAvatarStep = $('signUpAvatarStep');
  var forgotPassLink = $('forgotPassLink');
  var cancelForgotBtn = $('cancelForgotBtn');
  var sendResetCodeBtn = $('sendResetCodeBtn');
  var backToForgotStep1Btn = $('backToForgotStep1Btn');
  var forgotStep1 = $('forgotStep1');
  var forgotStep2 = $('forgotStep2');
  var securityDispatchCard = $('securityDispatchCard');
  var dispatchBody = $('dispatchBody');
  var switchToSignUp = $('switchToSignUp');
  var switchToSignIn = $('switchToSignIn');
  var backToSignInFromForgot = $('backToSignInFromForgot');
  var signInSwitchRow = $('signInSwitchRow');
  var signUpSwitchRow = $('signUpSwitchRow');
  var forgotSwitchRow = $('forgotSwitchRow');

  // Simulation Mode elements
  var modeChatBtn = $('modeChatBtn');
  var modeEmailBtn = $('modeEmailBtn');

  // Zendesk Email elements
  var zdTabsStrip = $('zdTabsStrip');
  var zdTabsGroup = $('zdTabsGroup');
  var zdNewEmailBtn = $('zdNewEmailBtn');
  var openZdViewsBtn = $('openZdViewsBtn');
  var zdViewsCounter = $('zdViewsCounter');
  var emailTicketHeader = $('emailTicketHeader');
  var zdStatusBadge = $('zdStatusBadge');
  var emailSubjectText = $('emailSubjectText');
  var emailCustomerFrom = $('emailCustomerFrom');
  var emailAssigneeVal = $('emailAssigneeVal');
  var zdStatusSelect = $('zdStatusSelect');
  var emailMinMins = $('emailMinMins');
  var emailMaxMins = $('emailMaxMins');
  var emailPendingBanner = $('emailPendingBanner');
  var emailPendingMins = $('emailPendingMins');
  var emailClockStamp = $('emailClockStamp');
  var emailFastForwardBtn = $('emailFastForwardBtn');
  var zdComposerNav = $('zdComposerNav');
  var zdNavPublicReply = $('zdNavPublicReply');
  var zdNavInternalNote = $('zdNavInternalNote');
  var zdSubmitBar = $('zdSubmitBar');
  var zdSubmitActionSelect = $('zdSubmitActionSelect');

  // Workspace controls
  var agentIdentity = $('agentIdentity');
  var chatLog = $('chatLog');
  var emptyState = $('emptyState');
  var agentInput = $('agentInput');
  var sendBtn = $('sendBtn');
  var clearChatBtn = $('clearChatBtn');
  var chatForm = $('chatForm');
  var typingIndicator = $('typingIndicator');
  var ticketIdEl = $('ticketId');
  var statusPill = $('statusPill');
  var chatMeta = $('chatMeta');
  var speedBar = $('speedBar');
  var speedLive = $('speedLive');
  var speedAvg = $('speedAvg');
  var newScenarioBtn = $('newScenarioBtn');
  var feedbackBtn = $('feedbackBtn');
  var trainerModeToggle = $('trainerModeToggle');
  var twoChatsToggle = $('twoChatsToggle');
  var twoChatsToggleWrap = $('twoChatsToggleWrap');
  var timerToggle = $('timerToggle');
  var timerToggleWrap = $('timerToggleWrap');
  var answerKey = $('answerKey');
  var answerKeyContent = $('answerKeyContent');
  var feedbackBox = $('feedbackBox');
  var feedbackContent = $('feedbackContent');
  var saveIndicator = $('saveIndicator');
  var categorySelect = $('categorySelect'); // may be null if removed from UI
  var emotionSelect = $('emotionSelect');
  var themeSelect = $('themeSelect');
  var historyBtn = $('historyBtn');
  var historyModal = $('historyModal');
  var historyExpandBtn = $('historyExpandBtn');
  var historyList = $('historyList');
  var trainerPassInput = $('trainerPassInput');
  var trainerPassBtn = $('trainerPassBtn');
  var trainerPassStatus = $('trainerPassStatus');
  var infoBtn = $('infoBtn');
  var infoModal = $('infoModal');
  var errorBanner = $('errorBanner');
  var errorText = $('errorText');
  var retryBtn = $('retryBtn');
  var copyBtn = $('copyBtn');
  var caseBtn = $('caseBtn');
  var casePane = $('casePane');
  var closeCase = $('closeCase');
  var caseTabLabel = $('caseTabLabel');
  var chatTabs = $('chatTabs');
  var replyTimer = $('replyTimer');
  var replyTimerClock = $('replyTimerClock');
  var fTraineeName = $('fTraineeName');
  var fLob = $('fLob');
  var endBtn = $('endBtn');
  var avgWpmBox = $('avgWpmBox');
  var avgWpmVal = $('avgWpmVal');
  var coachingBox = $('coachingBox');
  var coachingContent = $('coachingContent');
  var signOutBtn = $('signOutBtn');
  var myAnalyticsBtn = $('myAnalyticsBtn');
  var adminConsoleBtn = $('adminConsoleBtn');
  var welcomeModal = $('welcomeModal');

  // Modals
  var profileAnalyticsModal = $('profileAnalyticsModal');
  var closeProfileAnalytics = $('closeProfileAnalytics');
  var refreshAnalyticsBtn = $('refreshAnalyticsBtn');
  var adminConsoleModal = $('adminConsoleModal');
  var closeAdminConsole = $('closeAdminConsole');
  var zdViewsModal = $('zdViewsModal');
  var closeZdViewsBtn = $('closeZdViewsBtn');
  var dismissZdViewsBtn = $('dismissZdViewsBtn');
  var adminInviteModal = $('adminInviteModal');
  var closeAdminInvite = $('closeAdminInvite');
  var cancelAdminInvite = $('cancelAdminInvite');
  var adminResetModal = $('adminResetModal');
  var closeAdminResetModal = $('closeAdminResetModal');
  var dismissAdminResetModal = $('dismissAdminResetModal');

  var caseFields = {
    fCustomerName: $('fCustomerName'),
    fEmail: $('fEmail'),
    fProduct: $('fProduct'),
    fRecap: $('fRecap'),
    fResources: $('fResources'),
    fNextSteps: $('fNextSteps'),
    fEscalation: $('fEscalation')
  };

  var lastFailedAction = null;
  var historyDetail = null;

  /* ---------- Storage & Persistence Helpers ---------- */
  function storageKey(key){
    var identity = loginProfile && loginProfile.id ? loginProfile.id : 'anon';
    return 'ecewise:' + identity + ':' + key;
  }
  function readLS(key){
    try { return JSON.parse(localStorage.getItem(storageKey(key))); } catch(e){ return null; }
  }
  function writeLS(key, val){
    try { localStorage.setItem(storageKey(key), JSON.stringify(val)); } catch(e){}
  }

  // Complete Active Workspace Persistence across Browser Refreshes
  function saveWorkspaceState(){
    try {
      var snapshot = {
        simMode: simMode,
        activeIndex: activeIndex,
        chatSessions: chatSessions.map(serializeSession),
        emailSessions: emailSessions.map(serializeSession),
        twoChats: twoChats,
        timerOn: timerOn,
        profile: loginProfile
      };
      var payload = JSON.stringify(snapshot);
      if(loginProfile && loginProfile.id){
        localStorage.setItem('ecewise:' + loginProfile.id + ':active_workspace_v2', payload);
      }
      localStorage.setItem('ecewise:last_workspace_snapshot', payload);
    } catch(e){}
  }

  // Ensure immediate sync when user refreshes or closes window
  window.addEventListener('beforeunload', function(){
    saveWorkspaceState();
  });

  function deserializeSession(data, type){
    if(!data) return newSession(type);
    return {
      type: data.type || type,
      sessionId: data.id || data.sessionId || genId('sess'),
      ticketId: data.ticketId || genTicketId(),
      createdAt: data.createdAt || Date.now(),
      persona: data.persona || null,
      messages: Array.isArray(data.messages) ? data.messages : [],
      status: data.status || (type === 'email' ? 'NEW' : 'OPEN'),
      busy: false,
      holdDeadline: data.holdDeadline || null,
      holdMinutes: data.holdMinutes || null,
      feedback: data.feedback || null,
      typeStart: null,
      ended: !!data.ended,
      cleared: !!data.cleared,
      abandoned: !!data.abandoned,
      avgWpm: data.avgWpm || null,
      coachingPoints: data.coachingPoints || null,
      traineeName: data.traineeName || (loginProfile ? loginProfile.name : ''),
      avatarId: data.avatarId || (loginProfile ? loginProfile.avatarId : 'pip'),
      lob: data.lob || '',
      emailSubject: data.emailSubject || '',
      emailNextReplyTs: data.emailNextReplyTs || null,
      emailMinMins: data.emailMinMins || 30,
      emailMaxMins: data.emailMaxMins || 120,
      notes: data.notes ? {
        fCustomerName: data.notes.customerName || data.notes.fCustomerName || '',
        fEmail: data.notes.email || data.notes.fEmail || '',
        fProduct: data.notes.product || data.notes.fProduct || '',
        fRecap: data.notes.recap || data.notes.fRecap || '',
        fResources: data.notes.resources || data.notes.fResources || '',
        fNextSteps: data.notes.nextSteps || data.notes.fNextSteps || '',
        fEscalation: data.notes.escalation || data.notes.fEscalation || ''
      } : { fCustomerName:'', fEmail:'', fProduct:'', fRecap:'', fResources:'', fNextSteps:'', fEscalation:'' }
    };
  }

  function restoreWorkspaceState(){
    try {
      var raw = null;
      if(loginProfile && loginProfile.id){
        raw = localStorage.getItem('ecewise:' + loginProfile.id + ':active_workspace_v2');
      }
      if(!raw){
        raw = localStorage.getItem('ecewise:last_workspace_snapshot');
      }
      if(!raw) return false;
      var snapshot = JSON.parse(raw);
      if(!snapshot) return false;

      if(Array.isArray(snapshot.chatSessions) && snapshot.chatSessions.length > 0){
        chatSessions = snapshot.chatSessions.map(function(s){ return deserializeSession(s, 'chat'); });
      }
      if(Array.isArray(snapshot.emailSessions) && snapshot.emailSessions.length > 0){
        emailSessions = snapshot.emailSessions.map(function(s){ return deserializeSession(s, 'email'); });
      }

      simMode = snapshot.simMode === 'email' ? 'email' : 'chat';
      if(modeChatBtn && modeEmailBtn){
        modeChatBtn.classList.toggle('active', simMode === 'chat');
        modeEmailBtn.classList.toggle('active', simMode === 'email');
      }

      twoChats = !!snapshot.twoChats;
      if(twoChatsToggle) twoChatsToggle.checked = twoChats;
      if(twoChats && chatSessions.length === 1){
        chatSessions.push(newSession('chat'));
      }

      timerOn = !!snapshot.timerOn;
      if(timerToggle) timerToggle.checked = timerOn;
      if(replyTimer) replyTimer.hidden = !timerOn;

      sessions = simMode === 'email' ? emailSessions : chatSessions;
      activeIndex = (typeof snapshot.activeIndex === 'number' && snapshot.activeIndex < sessions.length) ? snapshot.activeIndex : 0;
      state = sessions[activeIndex];

      applyNotes(state);
      return true;
    } catch(e){
      console.warn('Could not restore workspace state:', e);
      return false;
    }
  }

  /* ---------- WPM Calculation ---------- */
  function wpmFrom(charCount, startTs){
    var minutes = (Date.now() - startTs) / 60000;
    if(minutes <= 0.02) return null;
    var w = (charCount / 5) / minutes;
    if(w < 1 || w > 200) return null;
    return Math.round(w);
  }
  function uiSpeedWpm(){
    return state.typeStart && agentInput.value ? wpmFrom(agentInput.value.length, state.typeStart) : null;
  }
  function avgReplyWpm(){
    var wpms = (state.messages || []).filter(function(m){ return m.role === 'agent' && m.wpm; }).map(function(m){ return m.wpm; });
    if(wpms.length === 0) return null;
    return {
      avg: Math.round(wpms.reduce(function(a,b){ return a+b; }, 0) / wpms.length),
      count: wpms.length
    };
  }
  function updateSpeedUI(){
    if(simMode === 'email'){
      speedBar.hidden = true;
      return;
    }
    speedBar.hidden = false;
    var a = avgReplyWpm();
    var cur = uiSpeedWpm();
    if(cur){
      speedLive.innerHTML = 'Typing at <b>' + cur + ' WPM</b> right now';
    } else if(a){
      speedLive.innerHTML = 'Type a reply to measure another speed';
    } else if(state.persona){
      speedLive.textContent = 'Start typing your reply to measure your speed';
    } else {
      speedLive.textContent = 'Start a customer to begin';
    }
    speedAvg.textContent = a ? 'Session avg <b>' + a.avg + ' WPM</b> across ' + a.count + ' reply' + (a.count > 1 ? 's' : '') : '';
  }

  /* ---------- Model Invocation ---------- */
  async function runModel(messages, opts){
    opts = opts || {};
    var response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages,
        schema: opts.schema,
        sessionId: opts.sessionId,
        mode: opts.mode || simMode
      })
    });
    if(!response.ok){
      var errData = await response.json().catch(function(){ return {}; });
      throw new Error(errData.error || 'Server error ' + response.status);
    }
    var data = await response.json();
    return data.text || (typeof data === 'string' ? data : JSON.stringify(data));
  }

  /* ---------- Session Serialization & Save ---------- */
  function serializeSession(s){
    return {
      id: s.sessionId,
      type: s.type || 'chat',
      ticketId: s.ticketId,
      createdAt: s.createdAt,
      persona: s.persona,
      messages: s.messages,
      status: s.status,
      holdDeadline: s.holdDeadline,
      holdMinutes: s.holdMinutes,
      feedback: s.feedback,
      emailSubject: s.emailSubject || '',
      emailNextReplyTs: s.emailNextReplyTs || null,
      emailMinMins: s.emailMinMins || 30,
      emailMaxMins: s.emailMaxMins || 120,
      notes: {
        customerName: s.notes.fCustomerName,
        email: s.notes.fEmail,
        product: s.notes.fProduct,
        recap: s.notes.fRecap,
        resources: s.notes.fResources,
        nextSteps: s.notes.fNextSteps,
        escalation: s.notes.fEscalation
      },
      traineeName: s.traineeName || (loginProfile ? loginProfile.name : ''),
      avatarId: s.avatarId || (loginProfile ? loginProfile.avatarId : 'pip'),
      lob: s.lob,
      avgWpm: s.avgWpm,
      coachingPoints: s.coachingPoints,
      ended: s.ended,
      cleared: !!s.cleared,
      abandoned: !!s.abandoned
    };
  }

  function pushServerSession(s){
    if(!s || !s.sessionId) return;
    if(s === state) captureNotes();
    var payload = JSON.stringify(serializeSession(s));
    var previous = serverSaveQueues[s.sessionId] || Promise.resolve();
    var next = previous.catch(function(){}).then(function(){
      return fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-trainee-id': loginProfile ? loginProfile.id : 'anon'
        },
        body: payload
      });
    }).then(function(res){
      if(s === state){
        if(res.ok) saveIndicator.textContent = 'Saved to team history';
        else saveIndicator.textContent = 'Saved locally';
      }
    }).catch(function(){
      if(s === state) saveIndicator.textContent = 'Saved locally';
    });
    serverSaveQueues[s.sessionId] = next;
    return next;
  }

  function saveLocalSession(s){
    if(!s.sessionId) return;
    try {
      localStorage.setItem(storageKey('session:' + s.sessionId), JSON.stringify(serializeSession(s)));
    } catch(e){}
  }

  function doSave(s){
    if(!s) s = state;
    if(s === state && s.sessionId) captureNotes();
    saveLocalSession(s);
    pushServerSession(s);
    saveWorkspaceState();
    updateZdViewsCounter();
  }

  var saveTimer = null;
  function scheduleSave(s){
    s = (s && s.sessionId) ? s : state;
    if(s === state) saveIndicator.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ doSave(s); }, 400);
  }

  function captureNotes(){
    var n = state.notes;
    n.fCustomerName = caseFields.fCustomerName.value;
    n.fEmail = caseFields.fEmail.value;
    n.fProduct = caseFields.fProduct.value;
    n.fRecap = caseFields.fRecap.value;
    n.fResources = caseFields.fResources.value;
    n.fNextSteps = caseFields.fNextSteps.value;
    n.fEscalation = caseFields.fEscalation.value;
    state.traineeName = loginProfile ? loginProfile.name : fTraineeName.value;
    state.lob = fLob.value;
  }

  function applyNotes(s){
    caseFields.fCustomerName.value = s.notes.fCustomerName || '';
    caseFields.fEmail.value = s.notes.fEmail || '';
    caseFields.fProduct.value = s.notes.fProduct || '';
    caseFields.fRecap.value = s.notes.fRecap || '';
    caseFields.fResources.value = s.notes.fResources || '';
    caseFields.fNextSteps.value = s.notes.fNextSteps || '';
    caseFields.fEscalation.value = s.notes.fEscalation || '';
    fTraineeName.value = loginProfile ? loginProfile.name : (s.traineeName || '');
    fLob.value = s.lob || '';
  }

  function clearCaseFields(){
    Object.keys(caseFields).forEach(function(k){ caseFields[k].value = ''; });
    Object.keys(state.notes).forEach(function(k){ state.notes[k] = ''; });
    state.traineeName = loginProfile ? loginProfile.name : '';
    state.avatarId = loginProfile ? loginProfile.avatarId : 'pip';
    state.lob = '';
    fTraineeName.value = loginProfile ? loginProfile.name : '';
    fLob.value = '';
  }

  /* ---------- UI Rendering & Tabs ---------- */
  function setStatus(msg, isError){
    if(!loginStatus) return;
    loginStatus.textContent = msg;
    if(loginStatusBanner){
      loginStatusBanner.classList.toggle('error', !!isError);
      loginStatusBanner.classList.toggle('success', !isError && !!msg);
    }
  }

  function clearError(){
    if(errorBanner) errorBanner.hidden = true;
    lastFailedAction = null;
  }

  function showError(msg, retryFn){
    if(errorText) errorText.textContent = msg;
    if(errorBanner) errorBanner.hidden = false;
    lastFailedAction = retryFn;
  }

  function setBusy(busy, s){
    s = s || state;
    s.busy = busy;
    if(s === state){
      agentInput.disabled = busy || s.ended || !s.persona;
      sendBtn.disabled = busy || s.ended || !s.persona;
      if(simMode === 'chat') typingIndicator.hidden = !busy;
      refreshControls();
    }
  }

  function refreshControls(){
    var hasCust = !!state.persona;
    newScenarioBtn.disabled = state.busy;
    feedbackBtn.disabled = state.busy || !hasCust || state.messages.length < 2;
    if(clearChatBtn) clearChatBtn.disabled = state.busy || !hasCust || state.ended;
    endBtn.disabled = state.busy || !hasCust || state.ended;
  }

  function renderPersonaBar(){
    if(!state.persona){
      ticketIdEl.textContent = simMode === 'email' ? 'No active email ticket' : 'No active case';
      statusPill.hidden = true;
      chatMeta.textContent = '';
      if(emailTicketHeader) emailTicketHeader.hidden = simMode !== 'email';
      return;
    }
    ticketIdEl.textContent = 'Ticket ' + state.ticketId;
    statusPill.hidden = false;
    statusPill.textContent = state.status;
    statusPill.className = 'status-pill status-' + (state.status || 'OPEN').toLowerCase().replace('_', '-');

    if(simMode === 'email'){
      emailTicketHeader.hidden = false;
      zdStatusSelect.value = state.status || 'NEW';
      updateZdBadge(state.status || 'NEW');
      emailSubjectText.textContent = state.emailSubject || ('Wyze Support Request: ' + state.persona.issueCategory);
      emailCustomerFrom.textContent = state.persona.name + ' <' + state.persona.email + '>';
      emailAssigneeVal.textContent = loginProfile ? loginProfile.name : 'Trainee Agent';
    } else {
      if(emailTicketHeader) emailTicketHeader.hidden = true;
      chatMeta.textContent = state.persona.name + ' · ' + state.persona.product + ' · ' + (state.persona.emotionalState || 'Normal');
    }
  }

  function updateZdBadge(status){
    if(!zdStatusBadge) return;
    zdStatusBadge.className = 'zd-badge';
    var text = 'NEW';
    switch(status){
      case 'NEW':
        zdStatusBadge.classList.add('zd-badge-new');
        text = 'NEW';
        break;
      case 'OPEN':
        zdStatusBadge.classList.add('zd-badge-open');
        text = 'OPEN';
        break;
      case 'PENDING':
        zdStatusBadge.classList.add('zd-badge-pending');
        text = 'PENDING';
        break;
      case 'ON_HOLD':
        zdStatusBadge.classList.add('zd-badge-onhold');
        text = 'ON-HOLD';
        break;
      case 'SOLVED':
        zdStatusBadge.classList.add('zd-badge-solved');
        text = 'SOLVED';
        break;
      default:
        zdStatusBadge.classList.add('zd-badge-open');
        text = status;
    }
    zdStatusBadge.textContent = text;
  }

  function renderTabs(){
    if(simMode === 'email'){
      chatTabs.innerHTML = '';
      chatTabs.hidden = true;
      zdTabsStrip.hidden = false;
      renderZdTabs();
      return;
    }
    chatTabs.hidden = false;
    zdTabsStrip.hidden = true;
    chatTabs.innerHTML = '';
    sessions.forEach(function(s, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-tab' + (i === activeIndex ? ' active' : '');
      var label = 'Chat ' + (i + 1);
      if(s.persona) label += ' · ' + (s.persona.name || '');
      b.textContent = label;
      b.title = s.persona ? (s.persona.name + ' — ' + s.persona.issueCategory) : 'No customer yet in this chat';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
      b.addEventListener('click', (function(idx){ return function(){ activateSlot(idx); }; })(i));
      chatTabs.appendChild(b);
    });
  }

  function renderZdTabs(){
    if(!zdTabsGroup) return;
    zdTabsGroup.innerHTML = '';
    emailSessions.forEach(function(s, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zd-tab' + (i === activeIndex ? ' active' : '');
      var label = 'Email ' + (i + 1);
      if(s.ticketId) label = s.ticketId;
      var statusClass = 'zd-badge-' + (s.status || 'NEW').toLowerCase().replace('_', '');
      b.innerHTML = '<span class="zd-badge ' + statusClass + '">' + (s.status || 'NEW') + '</span> ' +
        '<span>' + (s.persona ? escapeHtml(s.persona.name) : 'Slot ' + (i + 1)) + '</span>';
      b.addEventListener('click', (function(idx){ return function(){ activateSlot(idx); }; })(i));
      zdTabsGroup.appendChild(b);
    });
  }

  function activateSlot(idx){
    if(idx === activeIndex) return;
    captureNotes();
    doSave(state);
    activeIndex = idx;
    state = sessions[activeIndex];
    applyNotes(state);
    state.typeStart = null;
    renderTabs();
    renderPersonaBar();
    renderMessages();
    renderFeedback();
    renderAnswerKey();
    updatePendingBanner();
    refreshControls();
    updateSpeedUI();
    updateCaseLabel();
    saveWorkspaceState();
  }

  function renderMessages(){
    chatLog.innerHTML = '';
    if(!state.persona || state.messages.length === 0){
      chatLog.appendChild(emptyState);
      return;
    }
    state.messages.forEach(function(m){
      if(m.role === 'audit'){
        var auditDiv = document.createElement('div');
        auditDiv.className = 'chat-audit';
        auditDiv.textContent = m.text + ' · ' + fmtTime(m.ts);
        chatLog.appendChild(auditDiv);
        return;
      }
      if(m.internalNote){
        var noteDiv = document.createElement('div');
        noteDiv.className = 'zd-internal-note-row';
        noteDiv.innerHTML = '<div class="zd-note-badge">🔒 Internal Note • Trainee Agent · ' + fmtTime(m.ts) + '</div>' +
          '<div class="zd-note-body">' + escapeHtml(m.text) + '</div>';
        chatLog.appendChild(noteDiv);
        return;
      }
      var isAgent = m.role === 'agent';
      var row = document.createElement('div');
      row.className = 'msg-row ' + (isAgent ? 'from-agent' : 'from-customer');
      var meta = (m.gapSec != null ? ' · +' + m.gapSec + 's wait' : '') +
                 (isAgent && m.wpm ? ' · ' + m.wpm + ' WPM' : '');

      var contentDiv = document.createElement('div');
      contentDiv.className = 'msg-content';
      if(isAgent){
        contentDiv.innerHTML = avatarMarkup(state.avatarId || 'pip', 'message-avatar');
      }
      var bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = m.text;
      contentDiv.appendChild(bubble);

      var timeDiv = document.createElement('div');
      timeDiv.className = 'msg-time';
      timeDiv.textContent = (isAgent ? 'Agent · ' : (state.persona ? state.persona.name + ' · ' : 'Customer · ')) + fmtTime(m.ts) + meta;

      row.appendChild(contentDiv);
      row.appendChild(timeDiv);
      chatLog.appendChild(row);
    });
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function renderFeedback(){
    if(!feedbackBox) return;
    if(state.feedback){
      feedbackBox.hidden = false;
      feedbackContent.textContent = state.feedback;
    } else {
      feedbackBox.hidden = true;
      feedbackContent.textContent = '';
    }
  }

  function renderAnswerKey(){
    if(!answerKey) return;
    if(!trainerMode || !state.persona){
      answerKey.hidden = true;
      return;
    }
    answerKey.hidden = false;
    var p = state.persona;
    var steps = (p.resolutionSteps || []).map(function(s, i){
      return '<li>' + escapeHtml(s) + '</li>';
    }).join('');

    answerKeyContent.innerHTML =
      '<div class="ak-item"><strong>Customer Ground Truth:</strong> ' + escapeHtml(p.name) + ' (' + escapeHtml(p.email) + ')</div>' +
      '<div class="ak-item"><strong>Product &amp; Issue:</strong> ' + escapeHtml(p.product) + ' — ' + escapeHtml(p.issueCategory) + '</div>' +
      '<div class="ak-item"><strong>Hardware Specs:</strong> MAC: ' + escapeHtml(p.macAddress) + ' · S/N: ' + escapeHtml(p.serialNumber) + '</div>' +
      '<div class="ak-item"><strong>Root Cause Diagnosis:</strong> ' + escapeHtml(p.hiddenSummary) + '</div>' +
      '<div class="ak-item"><strong>Ideal SOP Resolution Steps:</strong><ol class="ak-steps">' + (steps || '<li>Verify issue details and follow standard Wyze troubleshooting guide.</li>') + '</ol></div>';
  }

  function updateCaseLabel(){
    if(!caseTabLabel) return;
    caseTabLabel.textContent = state.persona ? ('Case File: ' + (state.persona.name || 'Active Case')) : 'Case File';
  }

  function switchMode(newMode){
    if(newMode === simMode) return;
    captureNotes();
    doSave(state);

    simMode = newMode;
    modeChatBtn.classList.toggle('active', simMode === 'chat');
    modeEmailBtn.classList.toggle('active', simMode === 'email');

    if(simMode === 'email'){
      twoChatsToggleWrap.style.display = 'none';
      speedBar.hidden = true;
      zdTabsStrip.hidden = false;
      zdComposerNav.hidden = false;
      zdSubmitBar.hidden = false;
      sendBtn.textContent = 'Submit';
      agentInput.placeholder = 'Type your public email reply to the customer… (Enter to submit)';
      sessions = emailSessions;
      activeIndex = activeEmailIdx;
    } else {
      twoChatsToggleWrap.style.display = '';
      speedBar.hidden = false;
      zdTabsStrip.hidden = true;
      zdComposerNav.hidden = true;
      zdSubmitBar.hidden = true;
      emailTicketHeader.hidden = true;
      if(emailPendingBanner) emailPendingBanner.hidden = true;
      sendBtn.textContent = 'Send';
      agentInput.placeholder = 'Type a message to the customer… (Enter to send)';
      sessions = chatSessions;
      activeIndex = activeChatIdx;
    }

    state = sessions[activeIndex];
    applyNotes(state);
    renderTabs();
    renderPersonaBar();
    renderMessages();
    renderFeedback();
    renderAnswerKey();
    updatePendingBanner();
    refreshControls();
    updateSpeedUI();
    updateCaseLabel();
    updateZdViewsCounter();
    saveWorkspaceState();
  }

  /* ---------- Zendesk Ticket Journey & Pending Intervals ---------- */
  function setLinearState(newStatus){
    state.status = newStatus;
    if(newStatus === 'PENDING' || newStatus === 'SOLVED'){
      scheduleEmailReply();
    } else {
      state.emailNextReplyTs = null;
    }
    renderPersonaBar();
    renderTabs();
    updatePendingBanner();
    scheduleSave(state);
    saveWorkspaceState();
  }

  function scheduleEmailReply(){
    var minH = parseFloat(emailMinMins ? emailMinMins.value : 1) || 1;
    var maxH = parseFloat(emailMaxMins ? emailMaxMins.value : 48) || 48;
    if(minH > maxH) maxH = minH + 1;
    // Calculate random simulated wait time up to 48 hours
    var randHours = minH + Math.random() * (maxH - minH);
    state.emailNextReplyTs = Date.now() + Math.round(randHours * 3600 * 1000);
    updatePendingBanner();
  }

  function updatePendingBanner(){
    if(!emailPendingBanner) return;
    if(simMode !== 'email' || (state.status !== 'PENDING' && state.status !== 'SOLVED') || !state.emailNextReplyTs || state.ended){
      emailPendingBanner.hidden = true;
      return;
    }
    var diffMs = state.emailNextReplyTs - Date.now();
    if(diffMs <= 0){
      emailPendingBanner.hidden = true;
      return;
    }
    emailPendingBanner.hidden = false;
    var totalMins = Math.max(1, Math.round(diffMs / 60000));
    var hours = Math.floor(totalMins / 60);
    var mins = totalMins % 60;
    var formattedTime = hours > 0 ? (hours + 'h ' + (mins > 0 ? mins + 'm' : '')) : (mins + ' minutes');
    
    if(emailPendingMins) emailPendingMins.textContent = formattedTime;
    if(emailClockStamp){
      var replyDate = new Date(state.emailNextReplyTs);
      var isToday = replyDate.toDateString() === new Date().toDateString();
      emailClockStamp.textContent = (isToday ? 'Today ' : (replyDate.toLocaleDateString([], {month:'short', day:'numeric'}) + ' ')) +
        replyDate.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    }
  }

  function checkPendingEmailReplies(){
    if(simMode !== 'email') return;
    var now = Date.now();
    emailSessions.forEach(function(s){
      if((s.status === 'PENDING' || s.status === 'SOLVED') && s.emailNextReplyTs && now >= s.emailNextReplyTs && !s.busy && !s.ended && s.persona){
        triggerCustomerReply(s);
      }
    });
  }

  // Robust, Self-Contained Customer Reply Trigger
  async function triggerCustomerReply(s){
    if(!s || s.ended || !s.persona) return;
    setBusy(true, s);
    var turnNumber = Math.ceil(s.messages.length / 2);

    try {
      var isEmail = (s.type || simMode) === 'email';

      // 1. API CALL STRUCTURE
      // Filter out internal notes (internal notes are agent-only in Zendesk)
      var publicMsgs = s.messages.filter(function(m){ return !m.internalNote; });

      // Format:
      // contents: [
      //   { role: "user", parts: [{ text: "" }] },
      //   { role: "model", parts: [{ text: "" }] },
      //   ... all previous turns in order ...
      //   { role: "user", parts: [{ text: "LATEST MESSAGE" }] }
      // ]
      var contents = [];
      for(var i = 0; i < publicMsgs.length; i++){
        var m = publicMsgs[i];
        if(i === 0 && m.role === 'customer'){
          contents.push({ role: "user", parts: [{ text: "[Customer opened support ticket with issue: " + s.persona.issueCategory + "]" }] });
          contents.push({ role: "model", parts: [{ text: m.text }] });
        } else if(m.role === 'agent'){
          contents.push({ role: "user", parts: [{ text: m.text }] });
        } else {
          contents.push({ role: "model", parts: [{ text: m.text }] });
        }
      }

      // Ensure contents is non-empty and has user as the last message
      if(contents.length === 0){
        contents.push({ role: "user", parts: [{ text: "Hello" }] });
      } else if(contents[contents.length - 1].role !== 'user'){
        contents.push({ role: "user", parts: [{ text: "Hello" }] });
      }

      function getCustomerInCharacterReply(s, lastAgentText){
        var p = s.persona || {};
        var name = p.name || 'Customer';
        var email = p.email || 'customer@example.invalid';
        var prod = p.product || 'Wyze Cam v4';
        var led = p.ledColor || 'solid yellow';
        var mac = p.macAddress || '2C:AA:8E:44:91:02';
        var order = p.orderNumber || 'TEST-WZ-104928';
        var lower = (lastAgentText || '').toLowerCase();

        var alreadyUsed = function(txt){
          return (s.messages || []).some(function(m){ return m.role === 'customer' && m.text && m.text.indexOf(txt.slice(0, 20)) !== -1; });
        };

        if(/name|email|verify|account|who am i/i.test(lower)){
          return 'Yes, my name is ' + name + ' and my email associated with Wyze is ' + email + '.';
        }
        if(/mac|serial|order|invoice/i.test(lower)){
          return 'The MAC address on the device is ' + mac + ' and order is ' + order + '.';
        }
        if(/light|led|color|indicator|front/i.test(lower)){
          var ledOpts = [
            'The small light on the front is ' + led + ' and it isn\'t flashing.',
            'It\'s currently sitting on a ' + led + ' light right now.'
          ];
          for(var i=0; i<ledOpts.length; i++) if(!alreadyUsed(ledOpts[i])) return ledOpts[i];
          return 'The light is ' + led + '.';
        }
        if(/unplug|power cycle|reboot|restart|outlet|cord|30 second/i.test(lower)){
          var rebootOpts = [
            'Okay, I just unplugged it for 30 seconds and plugged it back in. The light came back on ' + led + '.',
            'I unplugged the power adapter and plugged it back. It\'s still showing the same ' + led + ' light.'
          ];
          for(var j=0; j<rebootOpts.length; j++) if(!alreadyUsed(rebootOpts[j])) return rebootOpts[j];
          return 'I unplugged it and plugged it back in. The light is still ' + led + '.';
        }
        if(/button|setup|hold|press/i.test(lower)){
          return 'I pressed and held the setup button on the camera until it clicked. It said "Ready to connect" and now the yellow light is flashing!';
        }
        if(/qr|scan|code|app/i.test(lower)){
          return 'I pointed the camera at my phone screen, it made a chime and said "QR code scanned", and now the light just turned solid blue!';
        }
        if(/wifi|wi-fi|router|2\.4|5ghz|network/i.test(lower)){
          return 'Our home Wi-Fi has both 2.4 and 5GHz bands. All our other devices in the house connect to it fine.';
        }
        if(/can i ask|may i ask|few questions|couple of questions/i.test(lower)){
          return 'Sure, go right ahead and ask whatever you need.';
        }
        if(/hold|give me a moment|one moment|bear with me/i.test(lower)){
          return 'Okay, take your time. I\'ll wait right here.';
        }
        if(/^hi|hello|hey|my name is/i.test(lower)){
          return 'Hi, thanks for taking my case. My ' + prod + ' has been acting up and I need help getting it back online.';
        }
        return 'I\'m right here with the ' + prod + '. What is the next step you\'d like me to try?';
      }

      // 4. ERROR HANDLING & RETRY
      var replyText = null;
      var attempt = 0;
      var maxAttempts = 2; // Initial try + 1 automatic retry
      var latestUserMsg = (contents[contents.length - 1] && contents[contents.length - 1].parts && contents[contents.length - 1].parts[0])
        ? contents[contents.length - 1].parts[0].text
        : '';

      while(attempt < maxAttempts && !replyText){
        attempt++;
        try {
          var res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contents,
              persona: s.persona,
              turnNumber: turnNumber,
              mode: isEmail ? 'email' : 'chat',
              sessionId: s.sessionId || ''
            })
          });

          if(res.ok){
            var data = await res.json();
            var candidate = (data && (data.message || data.text)) ? String(data.message || data.text).trim() : '';
            if(candidate){
              replyText = candidate;
            } else {
              console.warn('[Turn ' + turnNumber + '] API returned empty response on attempt ' + attempt);
            }
          } else {
            console.error('[Turn ' + turnNumber + '] API error ' + res.status + ' on attempt ' + attempt);
          }
        } catch(apiErr){
          console.error('[Turn ' + turnNumber + '] API error on attempt ' + attempt + ':', apiErr);
        }
      }

      // If retry fails, dynamically generate in-character customer response
      if(!replyText){
        console.warn('[Turn ' + turnNumber + '] Using in-character customer simulation engine.');
        replyText = getCustomerInCharacterReply(s, latestUserMsg);
      }

      // Clean JSON wrappers if returned
      try {
        var parsedObj = JSON.parse(replyText);
        if(parsedObj && typeof (parsedObj.message || parsedObj.text) === 'string'){
          replyText = parsedObj.message || parsedObj.text;
        }
      } catch(e){}

      // 5. CONVERSATION STATE:
      // Store full conversation history in array after every exchange
      // Append bot reply to history before next call
      var now = Date.now();
      s.messages.push({
        role: 'customer',
        text: replyText,
        ts: now,
        gapSec: null
      });

      if(isEmail){
        s.status = 'OPEN';
        s.emailNextReplyTs = null;
      }

      if(s === state){
        renderMessages();
        renderPersonaBar();
        renderTabs();
        updatePendingBanner();
      }

      scheduleSave(s);
      saveWorkspaceState();
    } catch(err){
      console.error('[Turn ' + turnNumber + '] Customer reply error:', err);
      var fallbackMsg = getCustomerInCharacterReply(s, 'What should I do?');
      s.messages.push({
        role: 'customer',
        text: fallbackMsg,
        ts: Date.now(),
        gapSec: null
      });
      if(s === state) renderMessages();
      scheduleSave(s);
      saveWorkspaceState();
    } finally {
      setBusy(false, s);
    }
  }

  /* ---------- 7-Minute Inactivity Abandonment Check (Chat Mode) ---------- */
  function checkChatAbandonment(){
    if(simMode !== 'chat') return;
    var now = Date.now();
    var ABANDON_THRESHOLD_MS = 7 * 60 * 1000; // 7 minutes without agent update

    sessions.forEach(function(s){
      if(!s.persona || s.ended || s.busy || s.messages.length === 0) return;
      var lastMsg = s.messages[s.messages.length - 1];
      if(lastMsg.role !== 'customer') return; // Wait only when customer is waiting for agent

      var idleTime = now - lastMsg.ts;
      if(idleTime >= ABANDON_THRESHOLD_MS && !s.abandoned){
        s.abandoned = true;
        s.ended = true;
        s.status = 'ABANDONED';

        var burstMessage = "I've been sitting here waiting for over 7 minutes with zero updates or responses from you! This is completely unacceptable customer service. I am closing this chat right now and disputing my charge with my bank!";
        s.messages.push({
          role: 'customer',
          text: burstMessage,
          ts: now,
          gapSec: Math.round(idleTime / 1000),
          abandonment: true
        });

        s.messages.push({
          role: 'audit',
          text: 'Customer abandoned chat due to 7 minutes of agent silence. Conversation terminated automatically.',
          ts: now
        });

        if(s === state){
          renderMessages();
          renderPersonaBar();
          renderTabs();
          endBtn.textContent = 'Ended (Abandoned)';
          endBtn.dataset.ended = 'true';
          setBusy(false, s);
        }
        scheduleSave(s);
        saveWorkspaceState();
      }
    });
  }

  /* ---------- Live Response Timer Ticker ---------- */
  function updateReplyTimerTicker(){
    if(!replyTimer || !replyTimerClock) return;
    if(!timerOn || !state.persona || state.ended){
      replyTimerClock.textContent = '00:00';
      replyTimer.classList.remove('warning', 'danger');
      return;
    }
    var lastCustTs = null;
    var lastAgentTs = null;
    for(var i = state.messages.length - 1; i >= 0; i--){
      var m = state.messages[i];
      if(!lastCustTs && m.role === 'customer') lastCustTs = m.ts;
      if(!lastAgentTs && m.role === 'agent' && !m.internalNote) lastAgentTs = m.ts;
      if(lastCustTs) break;
    }

    var targetTs = lastCustTs;
    if(!targetTs || (lastAgentTs && lastAgentTs > targetTs)){
      replyTimerClock.textContent = '00:00';
      replyTimer.classList.remove('warning', 'danger');
      return;
    }

    var elapsedSec = Math.max(0, Math.floor((Date.now() - targetTs) / 1000));
    var mins = Math.floor(elapsedSec / 60);
    var secs = elapsedSec % 60;
    var str = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    replyTimerClock.textContent = str;

    if(elapsedSec >= 120){
      replyTimer.classList.remove('warning');
      replyTimer.classList.add('danger');
    } else if(elapsedSec >= 60){
      replyTimer.classList.remove('danger');
      replyTimer.classList.add('warning');
    } else {
      replyTimer.classList.remove('warning', 'danger');
    }
  }

  /* ---------- Prompt Builders ---------- */
  function buildSystemPrompt(s){
    var p = s.persona;
    var isEmail = (s.type || simMode) === 'email';
    return [
      "Goal: You are a customer contacting Wyze support.",
      "Customer name: " + p.name + ".",
      "Product: " + p.product + ".",
      "Emotional state: " + (p.emotionalState || 'Normal') + ".",
      "LED Status Light: " + (p.ledColor || 'solid yellow') + ".",
      "",
      "STRICT RULES:",
      "- Before responding, identify what the agent's last message is:",
      "  - Question -> answer it only (do NOT ask what to do next)",
      "  - Instruction -> attempt it, report what you see or experience, and ask what to do next",
      "  - Statement -> acknowledge it naturally (do NOT ask what to do next)",
      "- NEVER repeat a message you already sent",
      "- NEVER ask what to do next unless the agent just completed giving you a step",
      "- NEVER skip ahead or assume what comes next",
      "- You have ZERO technical knowledge and zero troubleshooting skills.",
      "- Always wait for the agent to lead the conversation",
      "- Stay fully in sequence with the conversation flow",
      isEmail
        ? "- Email Mode: Write in a realistic, substantive customer email with full sentences and paragraph details."
        : "- Live Chat Mode: Keep messages strictly brief (1 to 2 short sentences max), conversational, and instant. Do NOT write email greetings or sign-offs.",
      "",
      "Persona details (reveal only when asked):",
      "- Name: " + p.name,
      "- Email: " + p.email,
      "- Phone: " + p.phone,
      "- Address: " + p.shippingAddress,
      "- Product: " + p.product,
      "- MAC Address: " + p.macAddress,
      "- Order Number: " + p.orderNumber,
      "- Serial Number: " + p.serialNumber,
      "- Purchase Date: " + p.purchaseDate,
      "- Proof of Purchase: " + p.proofOfPurchase,
      "- Issue: " + p.issueCategory,
      "- Status LED Light: " + (p.ledColor || 'solid yellow'),
      "- Hidden ground truth (FOR CONTEXT ONLY - DO NOT REVEAL DIRECTLY): " + p.hiddenSummary
    ].join('\n');
  }

  /* ---------- Start Scenario (Standard Random Selection) ---------- */
  async function startScenario(){
    var s = state;
    clearError();
    setBusy(true, s);
    chatLog.innerHTML = '<div class="loading-state">Connecting simulated Wyze customer…</div>';
    s.feedback = null;
    s.typeStart = null;
    s.ended = false;
    s.abandoned = false;
    s.holdDeadline = null;
    s.holdMinutes = null;

    // Standard Random Selection from the Expanded Wyze Catalog
    var categoryKeys = Object.keys(CATEGORY_LABELS).filter(function(k){ return k !== 'random'; });
    var randomKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
    var category = CATEGORY_LABELS[randomKey];

    var emotion = (emotionSelect && EMOTION_LABELS[emotionSelect.value]) || EMOTION_LABELS.random;
    var isEmail = simMode === 'email';

    var system = [
      "You generate one fictional customer persona and an opening " + (isEmail ? 'support email' : 'live-chat message') + " for a Wyze customer support simulator.",
      "Hard rules:",
      "- All personal details must be completely synthetic (e.g. @example.invalid, 202-555-01xx).",
      "- Pick ONE specific, real Wyze product from this catalog: " + WYZE_CATALOG,
      "- Scenario type: " + category,
      "- Emotional mood: " + emotion,
      "- hiddenSummary: 2-3 sentences on the real root cause and ideal SOP troubleshooting steps.",
      isEmail
        ? "- openingMessage: Opening inquiry written as a realistic, substantive customer email (2-3 paragraphs) explaining background context, device setup history, order details, and the specific symptom.\n- subject: Professional email subject line."
        : "- openingMessage: Opening inquiry for LIVE CHAT. MUST be short, direct, casual, and brief (1 to 2 sentences max), exactly how a regular customer initiates a live chat. Do NOT write paragraphs, formal letters, or greetings."
    ].join('\n');

    var schemaProps = {
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      shippingAddress: { type: "string" },
      product: { type: "string" },
      macAddress: { type: "string" },
      orderNumber: { type: "string" },
      serialNumber: { type: "string" },
      purchaseDate: { type: "string" },
      issueCategory: { type: "string" },
      emotionalState: { type: "string" },
      hiddenSummary: { type: "string" },
      openingMessage: { type: "string" },
      resolutionSteps: { type: "array", items: { type: "string" } }
    };
    if (isEmail) {
      schemaProps.subject = { type: "string" };
    }

    var schema = {
      type: "object",
      properties: schemaProps,
      required: ["name","email","phone","shippingAddress","product","macAddress","orderNumber","serialNumber","purchaseDate","issueCategory","emotionalState","hiddenSummary","openingMessage"],
      additionalProperties: false
    };

    try {
      s.sessionId = genId('sess');
      s.ticketId = genTicketId();
      var raw = await runModel([
        { role: "system", content: system },
        { role: "user", content: "Generate the fictional persona and opening inquiry now." }
      ], { schema: schema, sessionId: s.sessionId, mode: simMode });

      var persona = JSON.parse(raw);
      persona.name = persona.name || makeFictionalName();
      makeFakeCustomerDetails(persona);

      s.persona = persona;
      s.createdAt = Date.now();
      s.status = isEmail ? 'NEW' : 'OPEN';
      s.emailSubject = persona.subject || ('Help with ' + persona.product + ' - ' + persona.issueCategory);
      s.messages = [{ role: 'customer', text: persona.openingMessage, ts: Date.now(), gapSec: null }];
      s.traineeName = loginProfile ? loginProfile.name : '';
      s.avatarId = loginProfile ? loginProfile.avatarId : 'alex';

      // Automatically turn Timer ON when conversation starts
      timerOn = true;
      if(timerToggle) timerToggle.checked = true;
      if(replyTimer) replyTimer.hidden = false;
      updateReplyTimerTicker();

      clearCaseFields();
      renderPersonaBar();
      renderMessages();
      renderTabs();
      renderAnswerKey();
      renderFeedback();
      updatePendingBanner();
      updateCaseLabel();
      scheduleSave(s);
      saveWorkspaceState();
    } catch(err){
      console.error('Failed to start scenario:', err);
      showError("Could not connect simulated customer. Please click retry.", startScenario);
      chatLog.innerHTML = '';
      chatLog.appendChild(emptyState);
    } finally {
      setBusy(false, s);
    }
  }

  /* ---------- Send Agent Message & Customer Response Cycle ---------- */
  async function sendAgentMessage(text, wpm){
    var s = state;
    if(!s.persona || s.ended || !text) return;
    clearError();

    // Internal Note handling in Zendesk Email mode
    if(simMode === 'email' && activeComposerTab === 'internal'){
      s.messages.push({
        role: 'agent',
        text: text,
        ts: Date.now(),
        internalNote: true
      });
      renderMessages();
      scheduleSave(s);
      saveWorkspaceState();
      return;
    }

    var now = Date.now();
    var lastCustTs = null;
    for(var i = s.messages.length - 1; i >= 0; i--){
      if(s.messages[i].role === 'customer'){ lastCustTs = s.messages[i].ts; break; }
    }
    var gapSec = lastCustTs ? Math.max(0, Math.round((now - lastCustTs) / 1000)) : null;

    s.messages.push({
      role: 'agent',
      text: text,
      ts: now,
      gapSec: gapSec,
      wpm: wpm || null
    });

    renderMessages();
    saveWorkspaceState();

    // Email Mode: update status based on submit action selector
    if(simMode === 'email'){
      var submitState = zdSubmitActionSelect.value || 'PENDING';
      setLinearState(submitState);
      scheduleSave(s);
      saveWorkspaceState();
      return;
    }

    // Live Chat Mode: trigger immediate customer reply directly
    try {
      await triggerCustomerReply(s);
    } catch(e){
      showError(e.message || "Customer failed to respond. Please try sending again.", function(){ sendAgentMessage(text, wpm); });
    }
  }

  /* ---------- Coaching Feedback & End Drill ---------- */
  async function getFeedback(){
    var s = state;
    if(!s.persona || s.busy) return;
    clearError();
    setBusy(true, s);

    var transcript = s.messages.map(function(m){
      return (m.role === 'agent' ? 'Agent: ' : 'Customer: ') + m.text;
    }).join('\n');

    var system = [
      "You are the QA Coach for a Wyze customer support contact center.",
      "Review this practice conversation against ground-truth SOPs and product details:",
      JSON.stringify(s.persona),
      "Provide constructive, plain-text feedback in under 160 words:",
      "- Strengths demonstrated",
      "- Missed troubleshooting or verification steps",
      "- Overall rating: Needs Work / Developing / Solid / Excellent"
    ].join('\n');

    try {
      var raw = await runModel([
        { role: "system", content: system },
        { role: "user", content: "Transcript:\n" + transcript }
      ], { sessionId: s.sessionId });
      s.feedback = raw;
      renderFeedback();
      scheduleSave(s);
      saveWorkspaceState();
    } catch(e){
      showError(e.message || 'Could not generate feedback.', getFeedback);
    } finally {
      setBusy(false, s);
    }
  }

  async function endConversation(){
    var s = state;
    if(s.ended || s.busy || !s.persona) return;
    s.ended = true;
    setBusy(true, s);
    endBtn.textContent = 'Ended';
    endBtn.dataset.ended = 'true';

    var avg = avgReplyWpm();
    s.avgWpm = avg ? avg.avg : null;
    avgWpmBox.hidden = false;
    avgWpmVal.textContent = s.avgWpm ? s.avgWpm + ' WPM' : '— (no timed replies)';

    var transcript = s.messages.map(function(m){
      return (m.role === 'agent' ? 'Agent: ' : 'Customer: ') + m.text;
    }).join('\n');

    var system = [
      "You are the QA Director for Wyze customer support.",
      "Generate a final post-drill coaching review in plain text (under 180 words):",
      "Include: Strengths, Areas to improve, SOP adherence, and Overall rating (Needs Work / Developing / Solid / Excellent)."
    ].join('\n');

    try {
      var raw = await runModel([
        { role: "system", content: system },
        { role: "user", content: "Final Transcript:\n" + transcript }
      ], { sessionId: s.sessionId });
      s.coachingPoints = raw;
      coachingContent.textContent = raw;
      coachingBox.hidden = false;
      scheduleSave(s);
      saveWorkspaceState();
    } catch(e){
      showError(e.message || 'Could not generate post-drill review.', endConversation);
      s.ended = false;
      endBtn.textContent = 'End conversation';
      delete endBtn.dataset.ended;
    } finally {
      setBusy(false, s);
    }
  }

  /* ---------- Trainee Performance & Analytics Cockpit ---------- */
  async function loadTraineeAnalytics(){
    if(!loginProfile) return;
    try {
      $('paAgentName').textContent = loginProfile.name;
      $('paAgentEmail').textContent = loginProfile.email;
      $('paAvatarWrap').innerHTML = avatarMarkup(loginProfile.avatarId || 'pip', 'pa-avatar-art');

      var res = await fetch('/api/agent/analytics?user=' + encodeURIComponent(loginProfile.id));
      if(!res.ok) return;
      var data = await res.json();
      var analytics = data.analytics || {};

      renderAnalyticsKpis(analytics.kpis || {});
      renderSpeedDistribution(analytics.speedDistribution || {});
      renderResponseDistribution(analytics.responseTimeDistribution || {});
      renderCategoryBreakdown(analytics.categoryBreakdown || []);
      renderWpmChart(analytics.wpmHistory || []);
      renderAbandonedList(analytics.abandonedSessions || []);
      renderResolvedList(analytics.resolvedSessions || []);
      renderTranscriptsList(analytics.recentSessions || []);
    } catch(err){
      console.error('Failed to load trainee analytics:', err);
    }
  }

  function renderAnalyticsKpis(k){
    $('kpiTotalDrills').textContent = k.totalSessions || 0;
    $('kpiResolvedRate').textContent = (k.resolvedRate || 0) + '%';
    $('kpiAvgWpm').textContent = k.avgWpm ? (k.avgWpm + ' WPM') : '—';
    $('kpiAvgResponse').textContent = k.avgResponseTimeSec != null ? (k.avgResponseTimeSec + 's') : '—';
    $('kpiAbandonmentRate').textContent = (k.abandonmentRate || 0) + '%';
    $('kpiFrustrationRate').textContent = (k.frustrationRecoveryRate != null ? k.frustrationRecoveryRate : 100) + '%';
  }

  function renderSpeedDistribution(s){
    var total = (s.fast || 0) + (s.standard || 0) + (s.slow || 0) || 1;
    var fastPct = Math.round(((s.fast || 0) / total) * 100);
    var stdPct = Math.round(((s.standard || 0) / total) * 100);
    var slowPct = Math.round(((s.slow || 0) / total) * 100);

    $('barFast').style.width = fastPct + '%';
    $('barStd').style.width = stdPct + '%';
    $('barSlow').style.width = slowPct + '%';

    $('cntFast').textContent = (s.fast || 0) + ' (' + fastPct + '%)';
    $('cntStd').textContent = (s.standard || 0) + ' (' + stdPct + '%)';
    $('cntSlow').textContent = (s.slow || 0) + ' (' + slowPct + '%)';
  }

  function renderResponseDistribution(r){
    var total = (r.under30s || 0) + (r.s30to60 || 0) + (r.s60to120 || 0) + (r.over120s || 0) || 1;
    var u30 = Math.round(((r.under30s || 0) / total) * 100);
    var s60 = Math.round(((r.s30to60 || 0) / total) * 100);
    var s120 = Math.round(((r.s60to120 || 0) / total) * 100);
    var o120 = Math.round(((r.over120s || 0) / total) * 100);

    $('barU30').style.width = u30 + '%';
    $('barS60').style.width = s60 + '%';
    $('barS120').style.width = s120 + '%';
    $('barO120').style.width = o120 + '%';

    $('cntU30').textContent = (r.under30s || 0) + ' (' + u30 + '%)';
    $('cntS60').textContent = (r.s30to60 || 0) + ' (' + s60 + '%)';
    $('cntS120').textContent = (r.s60to120 || 0) + ' (' + s120 + '%)';
    $('cntO120').textContent = (r.over120s || 0) + ' (' + o120 + '%)';
  }

  function renderCategoryBreakdown(categories){
    var wrap = $('categoryBreakdownWrap');
    if(!wrap) return;
    if(categories.length === 0){
      wrap.innerHTML = '<div class="muted text-center" style="padding: 20px;">No scenario data recorded yet.</div>';
      return;
    }
    wrap.innerHTML = categories.map(function(c){
      var resRate = Math.round((c.resolved / (c.total || 1)) * 100);
      return '<div class="cat-stat-card">' +
        '<div class="cat-stat-header"><strong>' + escapeHtml(c.category) + '</strong><span>' + c.total + ' drills</span></div>' +
        '<div class="cat-stat-meta">' +
          '<span>Resolution: <b>' + resRate + '%</b></span>' +
          '<span>Abandoned: <b>' + c.abandoned + '</b></span>' +
          '<span>Avg Speed: <b>' + (c.avgWpm ? c.avgWpm + ' WPM' : '—') + '</b></span>' +
        '</div></div>';
    }).join('');
  }

  function renderWpmChart(history){
    var chart = $('wpmSparkline');
    if(!chart) return;
    if(history.length === 0){
      chart.innerHTML = '<div class="muted text-center" style="padding: 20px;">Complete timed chats to see your speed trajectory.</div>';
      return;
    }
    var maxWpm = Math.max.apply(null, history.map(function(h){ return h.wpm; }).concat([80]));
    chart.innerHTML = history.slice(0, 15).reverse().map(function(h){
      var hPct = Math.round((h.wpm / maxWpm) * 100);
      return '<div class="spark-col" title="' + h.ticketId + ': ' + h.wpm + ' WPM">' +
        '<div class="spark-bar" style="height:' + hPct + '%"></div>' +
        '<span class="spark-lbl">' + h.wpm + '</span></div>';
    }).join('');
  }

  function renderAbandonedList(abandoned){
    var list = $('abandonedChatList');
    if(!list) return;
    if(abandoned.length === 0){
      list.innerHTML = '<div class="success-callout">🎉 Zero abandoned chats! Outstanding responsiveness and customer engagement.</div>';
      return;
    }
    list.innerHTML = abandoned.map(function(a){
      return '<div class="drill-session-item border-abandoned">' +
        '<div class="ds-head"><strong>' + a.ticketId + '</strong> · ' + escapeHtml(a.category) + ' · <span class="text-danger">' + fmtTime(a.date) + '</span></div>' +
        '<div class="ds-body">Customer outburst: <em>"' + escapeHtml(a.text) + '"</em></div>' +
        '<div class="ds-foot">Inactive idle duration: <b>' + a.idleSec + ' seconds</b> (> 7 min threshold)</div>' +
        '</div>';
    }).join('');
  }

  function renderResolvedList(resolved){
    var list = $('resolvedChatList');
    if(!list) return;
    if(resolved.length === 0){
      list.innerHTML = '<div class="muted text-center" style="padding: 20px;">No resolved conversations logged yet.</div>';
      return;
    }
    list.innerHTML = resolved.map(function(r){
      return '<div class="drill-session-item border-resolved">' +
        '<div class="ds-head"><strong>' + r.ticketId + '</strong> · ' + escapeHtml(r.category) + ' · <span class="text-success">' + fmtTime(r.date) + '</span></div>' +
        '<div class="ds-foot">Handled in <b>' + r.durationMin + ' min</b>' + (r.wpm ? ' · Session Speed: <b>' + r.wpm + ' WPM</b>' : '') + '</div>' +
        '</div>';
    }).join('');
  }

  function renderTranscriptsList(sessions){
    var list = $('transcriptsList');
    if(!list) return;
    if(sessions.length === 0){
      list.innerHTML = '<div class="muted text-center" style="padding: 20px;">No session transcripts recorded yet.</div>';
      return;
    }
    list.innerHTML = sessions.map(function(s){
      return '<div class="transcript-row">' +
        '<div><strong>' + escapeHtml(s.ticketId || s.id) + '</strong> · ' + escapeHtml(s.customerName) + ' (' + escapeHtml(s.product) + ')' +
        '<div class="muted">' + escapeHtml(s.category) + ' · ' + fmtTime(s.createdAt) + '</div></div>' +
        '<div class="transcript-actions">' +
          '<span class="zd-badge zd-badge-' + (s.status||'open').toLowerCase() + '">' + s.status + '</span>' +
        '</div></div>';
    }).join('');
  }

  async function triggerAiInsights(){
    var aiBox = $('aiInsightsContent');
    var aiSpinner = $('aiInsightsSpinner');
    aiBox.textContent = '';
    aiSpinner.hidden = false;

    try {
      var res = await fetch('/api/agent/analytics?user=' + encodeURIComponent(loginProfile.id));
      var data = await res.json();
      var k = (data.analytics && data.analytics.kpis) || {};

      var prompt = [
        "You are an Elite Contact Center QA Director analyzing a trainee agent's metric report for Wyze Support:",
        "- Total Drills: " + (k.totalSessions || 0),
        "- Resolution Rate: " + (k.resolvedRate || 0) + "%",
        "- Abandonment Rate: " + (k.abandonmentRate || 0) + "%",
        "- Average Typing Speed: " + (k.avgWpm || 0) + " WPM",
        "- Average Response Time: " + (k.avgResponseTimeSec || 0) + "s",
        "- Frustration Recovery Rate: " + (k.frustrationRecoveryRate || 100) + "%",
        "Generate a structured, actionable coaching analysis in under 180 words with 3 distinct bullets:",
        "1. Core Superpower",
        "2. High-Impact Blindspot",
        "3. Concrete Action Drill for next shift"
      ].join('\n');

      var raw = await runModel([{ role: 'user', content: prompt }]);
      aiSpinner.hidden = true;
      aiBox.textContent = raw;
    } catch(e){
      aiSpinner.hidden = true;
      aiBox.textContent = "Insights temporarily offline. Continue your practice drills!";
    }
  }

  /* ---------- Leadership Admin Console ---------- */
  async function loadAdminTrainees(){
    var body = $('adminTraineesTableBody') || $('adminTraineeTableBody');
    if(!body) return;
    body.innerHTML = '<tr><td colspan="8" class="text-center muted" style="padding: 24px;">Loading trainee records from database…</td></tr>';
    try {
      var res = await fetch('/api/admin/trainees?key=' + encodeURIComponent(TRAINER_PASSCODE));
      if(!res.ok){
        body.innerHTML = '<tr><td colspan="8" class="text-center text-danger" style="padding: 24px;">Access denied or database error.</td></tr>';
        return;
      }
      var data = await res.json();
      var trainees = data.trainees || [];
      renderAdminTraineesTable(trainees);
    } catch(err){
      body.innerHTML = '<tr><td colspan="8" class="text-center text-danger" style="padding: 24px;">Failed to load trainees.</td></tr>';
    }
  }

  function renderAdminTraineesTable(trainees){
    var body = $('adminTraineesTableBody') || $('adminTraineeTableBody');
    if(!body) return;
    if(trainees.length === 0){
      body.innerHTML = '<tr><td colspan="8" class="text-center muted" style="padding: 24px;">No trainee accounts registered yet. Use "Invite Trainee" above.</td></tr>';
      return;
    }
    body.innerHTML = trainees.map(function(t){
      return '<tr>' +
        '<td><div class="trainee-cell">' + avatarMarkup(t.avatarId || 'pip', 'trainee-avatar') +
          '<div><strong class="clickable-trainee" data-id="' + t.id + '">' + escapeHtml(t.name) + '</strong>' +
          '<div class="muted">' + escapeHtml(t.email) + '</div></div></div></td>' +
        '<td>' + (t.isActive ? '<span class="status-badge badge-active">Active</span>' : '<span class="status-badge badge-inactive">Deactivated</span>') + '</td>' +
        '<td><b>' + t.totalDrills + '</b></td>' +
        '<td>' + t.resolvedRate + '%</td>' +
        '<td>' + (t.avgWpm ? t.avgWpm + ' WPM' : '—') + '</td>' +
        '<td>' + (t.abandonedCount > 0 ? '<span class="text-danger font-bold">' + t.abandonedCount + '</span>' : '0') + '</td>' +
        '<td>' + (t.lastTicketId ? '<code>' + t.lastTicketId + '</code>' : '—') + '</td>' +
        '<td><div class="admin-actions-cell">' +
          '<button type="button" class="btn btn-xs btn-ghost btn-drill" data-id="' + t.id + '" title="View complete performance drill-down">Drill-Down</button>' +
          '<button type="button" class="btn btn-xs btn-ghost btn-reset" data-id="' + t.id + '" title="Trigger password reset verification code">Reset PW</button>' +
          '<button type="button" class="btn btn-xs ' + (t.isActive ? 'btn-danger-ghost' : 'btn-success-ghost') + ' btn-toggle" data-id="' + t.id + '" data-active="' + (t.isActive ? '1' : '0') + '">' +
          (t.isActive ? 'Deactivate' : 'Activate') + '</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    // Attach row events
    body.querySelectorAll('.clickable-trainee, .btn-drill').forEach(function(el){
      el.addEventListener('click', function(){
        var id = el.getAttribute('data-id');
        openAdminDrillDown(id);
      });
    });

    body.querySelectorAll('.btn-reset').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-id');
        adminTriggerForgotPw(id);
      });
    });

    body.querySelectorAll('.btn-toggle').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-id');
        var cur = btn.getAttribute('data-active') === '1';
        adminToggleAccount(id, !cur);
      });
    });
  }

  async function openAdminDrillDown(traineeId){
    try {
      var res = await fetch('/api/agent/analytics?user=' + encodeURIComponent(traineeId));
      if(!res.ok) return;
      var data = await res.json();
      var analytics = data.analytics || {};

      $('paAgentName').textContent = 'Trainee: ' + traineeId;
      $('paAgentEmail').textContent = 'Supervisory Leadership Drill-Down View';
      $('paAvatarWrap').innerHTML = avatarMarkup('pip', 'pa-avatar-art');

      profileAnalyticsModal.hidden = false;
      renderAnalyticsKpis(analytics.kpis || {});
      renderSpeedDistribution(analytics.speedDistribution || {});
      renderResponseDistribution(analytics.responseTimeDistribution || {});
      renderCategoryBreakdown(analytics.categoryBreakdown || []);
      renderWpmChart(analytics.wpmHistory || []);
      renderAbandonedList(analytics.abandonedSessions || []);
      renderResolvedList(analytics.resolvedSessions || []);
      renderTranscriptsList(analytics.recentSessions || []);
    } catch(e){
      console.error('Error opening drill down:', e);
    }
  }

  async function adminTriggerForgotPw(identifier){
    try {
      var res = await fetch('/api/admin/trainees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: TRAINER_PASSCODE, action: 'trigger_reset', identifier: identifier })
      });
      var data = await res.json();
      if(res.ok){
        if(adminResetModal) adminResetModal.hidden = false;
        var rTarget = $('adminResetBody') || $('adminResetContent');
        if(rTarget){
          rTarget.innerHTML = '<p>A password reset code was successfully dispatched for <b>' + escapeHtml(data.name || data.email) + '</b> (' + escapeHtml(data.email) + ').</p>' +
            '<div class="admin-code-box">Verification Code: <code>' + data.code + '</code></div>' +
            '<small class="muted">Expires in 60 minutes. Provide this code to the trainee to reset their password on the login screen.</small>';
        }
      }
    } catch(e){}
  }

  async function adminToggleAccount(userId, newActive){
    try {
      await fetch('/api/admin/trainees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: TRAINER_PASSCODE, action: 'toggle_status', userId: userId, isActive: newActive })
      });
      loadAdminTrainees();
    } catch(e){}
  }

  /* ---------- Zendesk Views Modal ---------- */
  function openZdViews(){
    zdViewsModal.hidden = false;
    renderZdViewsTable('ALL');
  }

  function renderZdViewsTable(filter){
    var body = $('zdViewsTableBody');
    if(!body) return;
    var list = emailSessions.filter(function(s){
      if(!s.ticketId && !s.persona) return false;
      if(filter === 'ALL') return true;
      return (s.status || 'NEW') === filter;
    });

    if(list.length === 0){
      body.innerHTML = '<tr><td colspan="7" class="text-center muted" style="padding: 24px;">No email tickets matching filter: ' + filter + '</td></tr>';
      return;
    }

    body.innerHTML = list.map(function(s, idx){
      var statusClass = 'zd-badge-' + (s.status || 'NEW').toLowerCase().replace('_', '');
      var waitStr = '—';
      if(s.status === 'PENDING' && s.emailNextReplyTs){
        var rem = Math.max(1, Math.round((s.emailNextReplyTs - Date.now()) / 60000));
        waitStr = rem + ' min wait';
      }
      return '<tr>' +
        '<td><strong>' + s.ticketId + '</strong></td>' +
        '<td>' + escapeHtml(s.emailSubject || (s.persona ? s.persona.issueCategory : 'Email Inquiry')) + '</td>' +
        '<td>' + (s.persona ? escapeHtml(s.persona.name) : 'Customer') + '</td>' +
        '<td><span class="zd-badge ' + statusClass + '">' + (s.status || 'NEW') + '</span></td>' +
        '<td>' + (s.createdAt ? fmtTime(s.createdAt) : '—') + '</td>' +
        '<td>' + waitStr + '</td>' +
        '<td><button type="button" class="btn btn-xs btn-primary btn-zd-open" data-slot="' + idx + '">Open Ticket</button></td>' +
      '</tr>';
    }).join('');

    body.querySelectorAll('.btn-zd-open').forEach(function(b){
      b.addEventListener('click', function(){
        var slot = parseInt(b.getAttribute('data-slot'), 10) || 0;
        zdViewsModal.hidden = true;
        activateSlot(slot);
      });
    });
  }

  function updateZdViewsCounter(){
    if(!zdViewsCounter) return;
    var count = emailSessions.filter(function(s){ return s.ticketId || s.persona; }).length;
    zdViewsCounter.textContent = count;
  }

  /* ---------- Case Pane Drawer & Details ---------- */
  function openCase(){
    caseOpen = true;
    casePane.hidden = false;
    casePane.setAttribute('aria-hidden', 'false');
    casePane.classList.add('open');
    applyNotes(state);
  }

  function closeCaseFn(){
    captureNotes();
    doSave(state);
    caseOpen = false;
    casePane.classList.remove('open');
    casePane.hidden = true;
    casePane.setAttribute('aria-hidden', 'true');
  }

  /* ---------- Authentication Flows ---------- */
  function setupAuthHandlers(){
    // Tab switching
    on(tabSignIn, 'click', function(){
      if(tabSignIn){
        tabSignIn.classList.add('active');
        tabSignIn.setAttribute('aria-selected', 'true');
      }
      if(tabSignUp){
        tabSignUp.classList.remove('active');
        tabSignUp.setAttribute('aria-selected', 'false');
      }
      if(signInView) signInView.hidden = false;
      if(signUpView) signUpView.hidden = true;
      if(forgotPasswordView) forgotPasswordView.hidden = true;
      if(signInSwitchRow) signInSwitchRow.hidden = false;
      if(signUpSwitchRow) signUpSwitchRow.hidden = true;
      if(forgotSwitchRow) forgotSwitchRow.hidden = true;
      setStatus('Sign in with your registered ECE credentials.');
    });

    on(tabSignUp, 'click', function(){
      if(tabSignUp){
        tabSignUp.classList.add('active');
        tabSignUp.setAttribute('aria-selected', 'true');
      }
      if(tabSignIn){
        tabSignIn.classList.remove('active');
        tabSignIn.setAttribute('aria-selected', 'false');
      }
      if(signUpView) signUpView.hidden = false;
      if(signInView) signInView.hidden = true;
      if(forgotPasswordView) forgotPasswordView.hidden = true;
      if(signUpDetailsStep) signUpDetailsStep.hidden = false;
      if(signUpAvatarStep) signUpAvatarStep.hidden = true;
      if(signInSwitchRow) signInSwitchRow.hidden = true;
      if(signUpSwitchRow) signUpSwitchRow.hidden = false;
      if(forgotSwitchRow) forgotSwitchRow.hidden = true;
      setStatus('Create your unique account for progress tracking.');
    });

    on(switchToSignUp, 'click', function(){ if(tabSignUp) tabSignUp.click(); });
    on(switchToSignIn, 'click', function(){ if(tabSignIn) tabSignIn.click(); });
    on(backToSignInFromForgot, 'click', function(){ if(tabSignIn) tabSignIn.click(); });

    on(forgotPassLink, 'click', function(){
      if(signInView) signInView.hidden = true;
      if(signUpView) signUpView.hidden = true;
      if(forgotPasswordView) forgotPasswordView.hidden = false;
      if(forgotStep1) forgotStep1.hidden = false;
      if(forgotStep2) forgotStep2.hidden = true;
      if(signInSwitchRow) signInSwitchRow.hidden = true;
      if(signUpSwitchRow) signUpSwitchRow.hidden = true;
      if(forgotSwitchRow) forgotSwitchRow.hidden = false;
      setStatus('Verify your corporate ECE address to reset password.');
    });

    on(cancelForgotBtn, 'click', function(){ if(tabSignIn) tabSignIn.click(); });

    // Multi-step sign up
    on(continueSignUpBtn, 'click', function(){
      var emailEl = $('signUpEmail');
      var nameEl = $('signUpName');
      var pwEl = $('signUpPassword');
      var rpwEl = $('signUpRepeatPassword');

      var email = emailEl ? emailEl.value.trim() : '';
      var name = nameEl ? nameEl.value.trim() : '';
      var pw = pwEl ? pwEl.value : '';
      var rpw = rpwEl ? rpwEl.value : '';

      if(!email || !name || !pw || !rpw){
        setStatus('Please complete all required fields.', true);
        return;
      }
      if(pw !== rpw){
        setStatus('Passwords do not match. Please verify.', true);
        return;
      }
      if(pw.length < 6){
        setStatus('Password must be at least 6 characters long.', true);
        return;
      }

      if(signUpDetailsStep) signUpDetailsStep.hidden = true;
      if(signUpAvatarStep) signUpAvatarStep.hidden = false;
      setStatus('Select your representative support avatar.');
    });

    on(backToSignUpDetailsBtn, 'click', function(){
      if(signUpAvatarStep) signUpAvatarStep.hidden = true;
      if(signUpDetailsStep) signUpDetailsStep.hidden = false;
    });

    // Sign In Submit
    on(signInForm, 'submit', async function(ev){
      ev.preventDefault();
      var emailEl = $('signInEmail');
      var pwEl = $('signInPassword');
      var email = emailEl ? emailEl.value.trim() : '';
      var password = pwEl ? pwEl.value : '';

      setStatus('Authenticating credentials…');
      try {
        var res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        var data = await res.json();
        if(!res.ok){
          setStatus(data.error || 'Invalid credentials.', true);
          return;
        }
        completeLogin(data.user);
      } catch(err){
        setStatus('Sign-in service temporarily unavailable.', true);
      }
    });

    // Sign Up Submit
    on(signUpForm, 'submit', async function(ev){
      ev.preventDefault();
      var emailEl = $('signUpEmail');
      var nameEl = $('signUpName');
      var pwEl = $('signUpPassword');
      var email = emailEl ? emailEl.value.trim() : '';
      var name = nameEl ? nameEl.value.trim() : '';
      var password = pwEl ? pwEl.value : '';
      var selectedAvatar = signUpForm ? signUpForm.querySelector('input[name="signUpAvatar"]:checked') : null;
      var avatarId = selectedAvatar ? selectedAvatar.value : 'alex';

      setStatus('Creating your ECE trainee account…');
      try {
        var res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, name: name, password: password, avatarId: avatarId })
        });
        var data = await res.json();
        if(!res.ok){
          setStatus(data.error || 'Account creation failed.', true);
          return;
        }
        completeLogin(data.user);
      } catch(err){
        setStatus('Registration service temporarily unavailable.', true);
      }
    });

    // Forgot Password Flow
    on(sendResetCodeBtn, 'click', async function(){
      var emailEl = $('forgotEmail');
      var email = emailEl ? emailEl.value.trim() : '';
      if(!email){
        setStatus('Please enter your ECE email address.', true);
        return;
      }
      setStatus('Dispatching verification code…');
      try {
        var res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request', email: email })
        });
        var data = await res.json();
        if(!res.ok){
          setStatus(data.error || 'Could not verify account.', true);
          return;
        }
        if(forgotStep1) forgotStep1.hidden = true;
        if(forgotStep2) forgotStep2.hidden = false;
        if(dispatchBody) dispatchBody.innerHTML = '<p>Verification code issued: <strong>' + data.code + '</strong></p><small class="muted">Expires in 15 minutes.</small>';
        setStatus('Code dispatched. Enter your code and new password.');
      } catch(err){
        setStatus('Password reset service unavailable.', true);
      }
    });

    on(backToForgotStep1Btn, 'click', function(){
      if(forgotStep2) forgotStep2.hidden = true;
      if(forgotStep1) forgotStep1.hidden = false;
    });

    on(forgotPasswordForm, 'submit', async function(ev){
      ev.preventDefault();
      var emailEl = $('forgotEmail');
      var codeEl = $('resetCode');
      var pwEl = $('newPassword');
      var rpwEl = $('repeatNewPassword');

      var email = emailEl ? emailEl.value.trim() : '';
      var code = codeEl ? codeEl.value.trim() : '';
      var newPw = pwEl ? pwEl.value : '';
      var repeatPw = rpwEl ? rpwEl.value : '';

      try {
        var res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset',
            email: email,
            code: code,
            newPassword: newPw,
            repeatPassword: repeatPw
          })
        });
        var data = await res.json();
        if(!res.ok){
          setStatus(data.error || 'Password reset failed.', true);
          return;
        }
        setStatus('Password successfully updated! Please sign in with your new credentials.');
        tabSignIn.click();
      } catch(err){
        setStatus('Reset verification failed.', true);
      }
    });
  }

  function completeLogin(user){
    loginProfile = user;
    try { localStorage.setItem('ecewise:auth_user', JSON.stringify(user)); } catch(e){}
    loginScreen.hidden = true;
    appRoot.hidden = false;
    appRoot.setAttribute('aria-hidden', 'false');

    // Populate Left Sidebar profile
    var leftUserName = $('leftUserName');
    var leftUserEmail = $('leftUserEmail');
    var leftAvatarArt = $('leftAvatarArt');
    if(leftUserName) leftUserName.textContent = user.name;
    if(leftUserEmail) leftUserEmail.textContent = user.email;
    if(leftAvatarArt) leftAvatarArt.innerHTML = avatarMarkup(user.avatarId || 'alex', 'left-profile-avatar-svg');

    agentIdentity.hidden = false;
    agentIdentity.innerHTML = avatarMarkup(user.avatarId || 'alex', 'identity-avatar') + '<span>' + escapeHtml(user.name) + '</span>';
    fTraineeName.value = user.name;

    initializeWorkspace();

    // Check if walkthrough was already seen by this user; if new, execute walkthrough
    var walkthroughKey = 'ecewise:' + user.id + ':walkthrough_seen';
    var walkthroughSeen = localStorage.getItem(walkthroughKey);
    if(!walkthroughSeen){
      if(welcomeModal) welcomeModal.hidden = false;
    }
  }

  function initializeWorkspace(){
    // Restore persistent session from local storage so refreshing preserves the conversation
    var restored = restoreWorkspaceState();
    if(workspaceInitialized){
      renderTabs();
      renderPersonaBar();
      renderMessages();
      refreshControls();
      return;
    }
    workspaceInitialized = true;
    renderAvatarChoices();
    renderTabs();
    renderPersonaBar();
    renderMessages();
    renderAnswerKey();
    renderFeedback();
    refreshControls();
    updateSpeedUI();
    updateCaseLabel();
    updateZdViewsCounter();
  }

  /* ---------- Event Listeners Setup ---------- */
  function attachAppListeners(){
    // Mode toggles
    on(modeChatBtn, 'click', function(){ switchMode('chat'); });
    on(modeEmailBtn, 'click', function(){ switchMode('email'); });

    // Scenario & Controls
    on(newScenarioBtn, 'click', startScenario);
    on(feedbackBtn, 'click', getFeedback);
    on(endBtn, 'click', endConversation);
    on(caseBtn, 'click', openCase);
    on(closeCase, 'click', closeCaseFn);

    on(trainerModeToggle, 'change', function(){
      if(trainerModeToggle){
        trainerMode = trainerModeToggle.checked;
        renderAnswerKey();
      }
    });

    on(twoChatsToggle, 'change', function(){
      if(twoChatsToggle){
        twoChats = twoChatsToggle.checked;
        if(twoChats && chatSessions.length === 1){
          chatSessions.push(newSession('chat'));
        }
        renderTabs();
        saveWorkspaceState();
      }
    });

    on(timerToggle, 'change', function(){
      if(timerToggle){
        timerOn = timerToggle.checked;
        if(replyTimer) replyTimer.hidden = !timerOn;
        saveWorkspaceState();
      }
    });

    on(themeSelect, 'change', function(){
      if(themeSelect){
        document.documentElement.setAttribute('data-theme', themeSelect.value);
        try { localStorage.setItem('ecewise:theme', themeSelect.value); } catch(e){}
      }
    });
    try {
      var savedTheme = localStorage.getItem('ecewise:theme');
      if(savedTheme && themeSelect){
        themeSelect.value = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch(e){}

    // Collapsing Left Sidebar Navigation
    var leftPanel = $('leftPanel');
    var panelCollapseTrigger = $('panelCollapseTrigger');
    var sidebarToggleBtn = $('sidebarToggleBtn');

    function toggleSidebar(){
      if(!leftPanel) return;
      leftPanel.classList.toggle('collapsed');
      var isCollapsed = leftPanel.classList.contains('collapsed');
      try {
        localStorage.setItem('ecewise:left_panel_collapsed', isCollapsed ? 'true' : 'false');
      } catch(e){}
    }

    if(panelCollapseTrigger) panelCollapseTrigger.addEventListener('click', toggleSidebar);
    if(sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', toggleSidebar);

    try {
      if(localStorage.getItem('ecewise:left_panel_collapsed') === 'true' && leftPanel){
        leftPanel.classList.add('collapsed');
      }
    } catch(e){}

    // Avatar Selection Modal & Independent User Profile Saving
    var leftAvatarBtn = $('leftAvatarBtn');
    var leftProfileCard = $('leftProfileCard');
    var avatarChangeModal = $('avatarChangeModal');
    var closeAvatarModal = $('closeAvatarModal');
    var cancelAvatarModal = $('cancelAvatarModal');
    var saveAvatarModalBtn = $('saveAvatarModalBtn');

    function openAvatarModal(){
      if(!avatarChangeModal) return;
      renderAvatarModalChoices(loginProfile ? loginProfile.avatarId : 'alex');
      avatarChangeModal.hidden = false;
    }

    if(leftAvatarBtn) leftAvatarBtn.addEventListener('click', function(ev){
      ev.stopPropagation();
      openAvatarModal();
    });
    if(closeAvatarModal) closeAvatarModal.addEventListener('click', function(){ avatarChangeModal.hidden = true; });
    if(cancelAvatarModal) cancelAvatarModal.addEventListener('click', function(){ avatarChangeModal.hidden = true; });

    if(saveAvatarModalBtn){
      saveAvatarModalBtn.addEventListener('click', function(){
        var selected = document.querySelector('input[name="modalAvatarChoice"]:checked');
        if(!selected || !loginProfile) return;
        var newAvatarId = selected.value;
        loginProfile.avatarId = newAvatarId;

        // Save independently to user profile in storage
        try {
          localStorage.setItem('ecewise:auth_user', JSON.stringify(loginProfile));
          localStorage.setItem('ecewise:' + loginProfile.id + ':avatarId', newAvatarId);
        } catch(e){}

        state.avatarId = newAvatarId;

        var leftAvatarArt = $('leftAvatarArt');
        if(leftAvatarArt) leftAvatarArt.innerHTML = avatarMarkup(newAvatarId, 'left-profile-avatar-svg');
        if(agentIdentity) agentIdentity.innerHTML = avatarMarkup(newAvatarId, 'identity-avatar') + '<span>' + escapeHtml(loginProfile.name) + '</span>';

        renderMessages();
        doSave(state);

        if(avatarChangeModal) avatarChangeModal.hidden = true;
      });
    }

    // Retry Button
    on(retryBtn, 'click', function(){
      clearError();
      if(typeof lastFailedAction === 'function') lastFailedAction();
    });

    // Zendesk Composer Navigation
    on(zdNavPublicReply, 'click', function(){
      activeComposerTab = 'public';
      if(zdNavPublicReply) zdNavPublicReply.classList.add('active');
      if(zdNavInternalNote) zdNavInternalNote.classList.remove('active');
      if(agentInput) agentInput.placeholder = 'Type your public email reply to the customer… (Enter to send)';
    });

    on(zdNavInternalNote, 'click', function(){
      activeComposerTab = 'internal';
      if(zdNavInternalNote) zdNavInternalNote.classList.add('active');
      if(zdNavPublicReply) zdNavPublicReply.classList.remove('active');
      if(agentInput) agentInput.placeholder = 'Type an internal note (only visible to team members)… (Enter to save note)';
    });

    // Zendesk Linear Status Select in Header
    on(zdStatusSelect, 'change', function(){
      if(zdStatusSelect) setLinearState(zdStatusSelect.value);
    });

    // Zendesk Fast Forward & Advance Time Button
    on(emailFastForwardBtn, 'click', async function(){
      if(state.busy || state.ended || !state.persona) return;
      if(emailPendingBanner) emailPendingBanner.hidden = true;
      await triggerCustomerReply(state);
    });

    // Zendesk Views Modal
    on(openZdViewsBtn, 'click', openZdViews);
    on(closeZdViewsBtn, 'click', function(){ if(zdViewsModal) zdViewsModal.hidden = true; });
    on(dismissZdViewsBtn, 'click', function(){ if(zdViewsModal) zdViewsModal.hidden = true; });

    document.querySelectorAll('.zd-filter-pill').forEach(function(pill){
      pill.addEventListener('click', function(){
        document.querySelectorAll('.zd-filter-pill').forEach(function(p){ p.classList.remove('active'); });
        pill.classList.add('active');
        var f = pill.getAttribute('data-filter');
        renderZdViewsTable(f);
      });
    });

    on(zdNewEmailBtn, 'click', startScenario);

    // Chat form submit
    on(chatForm, 'submit', function(ev){
      ev.preventDefault();
      var text = agentInput ? agentInput.value.trim() : '';
      if(!text || state.busy || !state.persona) return;
      var sentWpm = (agentInput && state.typeStart) ? wpmFrom(agentInput.value.length, state.typeStart) : null;
      if(agentInput) agentInput.value = '';
      state.typeStart = null;
      updateSpeedUI();
      sendAgentMessage(text, sentWpm);
    });

    on(agentInput, 'input', function(){
      if(agentInput && !state.typeStart && agentInput.value) state.typeStart = Date.now();
      updateSpeedUI();
    });

    on(agentInput, 'keydown', function(ev){
      if(ev.key === 'Enter' && !ev.shiftKey){
        ev.preventDefault();
        if(chatForm) chatForm.requestSubmit();
      }
    });

    // Case Fields
    Object.keys(caseFields).forEach(function(k){
      on(caseFields[k], 'input', function(){
        scheduleSave();
        saveWorkspaceState();
      });
    });

    // Quick Chips
    document.querySelectorAll('.quick-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        if(emotionSelect) emotionSelect.value = chip.dataset.emotion || 'random';
        startScenario();
      });
    });

    // Trainee Analytics Cockpit Modal
    on(myAnalyticsBtn, 'click', function(){
      if(profileAnalyticsModal) profileAnalyticsModal.hidden = false;
      loadTraineeAnalytics();
    });
    on(agentIdentity, 'click', function(){
      if(profileAnalyticsModal) profileAnalyticsModal.hidden = false;
      loadTraineeAnalytics();
    });
    on(closeProfileAnalytics, 'click', function(){ if(profileAnalyticsModal) profileAnalyticsModal.hidden = true; });
    on(refreshAnalyticsBtn, 'click', loadTraineeAnalytics);
    on('refreshAiBtn', 'click', triggerAiInsights);

    // Analytics Sub-tabs
    var paTabs = [
      { btn: $('paTabAi'), panel: $('paPanelAi') },
      { btn: $('paTabSpeed'), panel: $('paPanelSpeed') },
      { btn: $('paTabRes'), panel: $('paPanelRes') },
      { btn: $('paTabChurn'), panel: $('paPanelChurn') },
      { btn: $('paTabTranscripts'), panel: $('paPanelTranscripts') }
    ];
    paTabs.forEach(function(tab){
      if(tab.btn && tab.panel){
        tab.btn.addEventListener('click', function(){
          paTabs.forEach(function(t){
            if(t.btn) t.btn.classList.remove('active');
            if(t.panel) t.panel.hidden = true;
          });
          tab.btn.classList.add('active');
          tab.panel.hidden = false;
        });
      }
    });

    // Leadership Admin Console Modal
    on(adminConsoleBtn, 'click', function(){
      if(adminConsoleModal) adminConsoleModal.hidden = false;
      if(trainerAccess){
        if($('adminPasscodeGate')) $('adminPasscodeGate').hidden = true;
        if($('adminDashboardView')) $('adminDashboardView').hidden = false;
        loadAdminTrainees();
      } else {
        if($('adminPasscodeGate')) $('adminPasscodeGate').hidden = false;
        if($('adminDashboardView')) $('adminDashboardView').hidden = true;
      }
    });

    on(closeAdminConsole, 'click', function(){
      if(adminConsoleModal) adminConsoleModal.hidden = true;
    });

    on('adminGateUnlockBtn', 'click', function(){
      var val = ($('adminGatePasscode') ? $('adminGatePasscode').value : '').trim().toLowerCase();
      if(val === TRAINER_PASSCODE){
        trainerAccess = true;
        if($('adminPasscodeGate')) $('adminPasscodeGate').hidden = true;
        if($('adminDashboardView')) $('adminDashboardView').hidden = false;
        loadAdminTrainees();
      } else {
        if($('adminGateStatus')) $('adminGateStatus').textContent = 'Invalid passcode.';
      }
    });

    on('refreshAdminTraineesBtn', 'click', loadAdminTrainees);

    // Admin Invite Trainee Modal
    on('adminInviteBtn', 'click', function(){
      if(adminInviteModal) adminInviteModal.hidden = false;
      if($('adminInviteForm')) $('adminInviteForm').hidden = false;
      if($('inviteSuccessCard')) $('inviteSuccessCard').hidden = true;
      if($('inviteEmail')) $('inviteEmail').value = '';
      if($('inviteName')) $('inviteName').value = '';
      if($('inviteTempPassword')) $('inviteTempPassword').value = '';
    });
    on('openInviteModalBtn', 'click', function(){
      if(adminInviteModal) adminInviteModal.hidden = false;
      if($('adminInviteForm')) $('adminInviteForm').hidden = false;
      if($('inviteSuccessCard')) $('inviteSuccessCard').hidden = true;
      if($('inviteEmail')) $('inviteEmail').value = '';
      if($('inviteName')) $('inviteName').value = '';
      if($('inviteTempPassword')) $('inviteTempPassword').value = '';
    });

    on(closeAdminInvite, 'click', function(){ if(adminInviteModal) adminInviteModal.hidden = true; });
    on(cancelAdminInvite, 'click', function(){ if(adminInviteModal) adminInviteModal.hidden = true; });

    on('adminInviteForm', 'submit', async function(ev){
      ev.preventDefault();
      var email = $('inviteEmail') ? $('inviteEmail').value.trim() : '';
      var name = $('inviteName') ? $('inviteName').value.trim() : '';
      var pw = $('inviteTempPassword') ? $('inviteTempPassword').value.trim() : '';
      try {
        var res = await fetch('/api/admin/trainees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: TRAINER_PASSCODE, action: 'invite', email: email, name: name, tempPassword: pw })
        });
        if(res.ok){
          var resData = await res.json();
          if($('adminInviteForm')) $('adminInviteForm').hidden = true;
          if($('inviteSuccessCard')) $('inviteSuccessCard').hidden = false;
          if($('inviteSuccessBody')){
            $('inviteSuccessBody').innerHTML = '<p>Trainee account created for <b>' + escapeHtml(name) + '</b> (' + escapeHtml(email) + ').</p>' +
              '<div class="admin-code-box">Temporary Password: <code>' + (resData.tempPassword || 'Wyze2026!') + '</code></div>';
          }
          loadAdminTrainees();
        }
      } catch(e){}
    });

    on(closeAdminResetModal, 'click', function(){ if(adminResetModal) adminResetModal.hidden = true; });
    on(dismissAdminResetModal, 'click', function(){ if(adminResetModal) adminResetModal.hidden = true; });
    on('dismissAdminResetModal', 'click', function(){ if(adminResetModal) adminResetModal.hidden = true; });


    // History Modal
    on(historyBtn, 'click', openHistory);
    on('closeHistory', 'click', function(){ if(historyModal) historyModal.hidden = true; });
    on(trainerPassBtn, 'click', function(){
      if(trainerPassInput && trainerPassInput.value.trim().toLowerCase() === TRAINER_PASSCODE){
        trainerAccess = true;
        if(trainerPassStatus) trainerPassStatus.textContent = 'Unlocked (Leadership access active)';
        openHistory();
      } else {
        if(trainerPassStatus) trainerPassStatus.textContent = 'Invalid passcode.';
      }
    });

    // Walkthrough Guide & How to Use Modal
    on(infoBtn, 'click', function(){
      if(welcomeModal) welcomeModal.hidden = false;
      else if(infoModal) infoModal.hidden = false;
    });
    on('finishWelcome', 'click', function(){
      if(welcomeModal) welcomeModal.hidden = true;
      if(loginProfile && loginProfile.id){
        try { localStorage.setItem('ecewise:' + loginProfile.id + ':walkthrough_seen', 'true'); } catch(e){}
      }
    });
    on('closeInfo', 'click', function(){ if(infoModal) infoModal.hidden = true; });

    // Sign out
    on(signOutBtn, 'click', function(){
      loginProfile = null;
      try {
        localStorage.removeItem('ecewise:auth_user');
      } catch(e){}
      if(appRoot) appRoot.hidden = true;
      if(loginScreen) loginScreen.hidden = false;
      setStatus('Signed out. Please sign in to resume your training sessions.');
    });

    // Copy notes
    on(copyBtn, 'click', async function(){
      var lines = ['Ticket: ' + (state.ticketId || '')];
      state.messages.forEach(function(m){
        lines.push((m.role === 'agent' ? 'Agent: ' : 'Customer: ') + m.text);
      });
      lines.push('');
      Object.keys(caseFields).forEach(function(k){
        lines.push(k + ': ' + (caseFields[k].value || ''));
      });
      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        copyBtn.textContent = 'Copied!';
      } catch(e){
        copyBtn.textContent = 'Could not copy';
      }
      setTimeout(function(){ copyBtn.textContent = 'Copy transcript & notes'; }, 1500);
    });

    // Periodic timers & live reply clock ticker
    setInterval(function(){
      updateReplyTimerTicker();
      checkChatAbandonment();
      updatePendingBanner();
      checkPendingEmailReplies();
    }, 1000);
  }

  async function openHistory(){
    historyModal.hidden = false;
    historyList.innerHTML = '<div class="muted text-center" style="padding:20px;">Loading session history…</div>';
    try {
      var url = '/api/sessions' + (trainerAccess ? '?trainer=1&key=' + encodeURIComponent(TRAINER_PASSCODE) : '');
      var res = await fetch(url);
      if(!res.ok) return;
      var data = await res.json();
      var results = data.results || [];
      if(results.length === 0){
        historyList.innerHTML = '<div class="muted text-center" style="padding:20px;">No past sessions recorded yet.</div>';
        return;
      }
      historyList.innerHTML = '<div class="history-list-view">' + results.map(function(item){
        return '<div class="history-item">' +
          '<div><strong>' + escapeHtml(item.ticket_id || item.id) + '</strong> · ' + escapeHtml(item.trainee_name || 'Agent') +
          '<div class="muted">' + escapeHtml(item.category || 'General Wyze') + ' · ' + fmtTime(item.created_at) + '</div></div>' +
          '<span class="zd-badge zd-badge-' + (item.status||'open').toLowerCase() + '">' + item.status + '</span>' +
          '</div>';
      }).join('') + '</div>';
    } catch(err){
      historyList.innerHTML = '<div class="muted text-center" style="padding:20px;">Could not load history.</div>';
    }
  }

  /* ---------- Startup Initialization ---------- */
  function startApp(){
    renderAvatarChoices();
    setupAuthHandlers();
    attachAppListeners();

    // Check existing stored auth
    try {
      var saved = JSON.parse(localStorage.getItem('ecewise:auth_user'));
      if(saved && saved.id && saved.email){
        completeLogin(saved);
        return;
      }
    } catch(e){}

    // Default focus
    var emailInput = $('signInEmail');
    if(emailInput) emailInput.focus();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }

})();
