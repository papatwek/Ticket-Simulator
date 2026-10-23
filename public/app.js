(function(){
  'use strict';

  var CATEGORY_LABELS = {
    random: "Random — pick a realistic Wyze support scenario",
    connectivity: "Device offline or won't connect to Wi-Fi",
    account: "App or account login trouble",
    footage: "Missing footage or cloud storage confusion",
    hardware: "Hardware malfunction (battery, audio, video quality)",
    shipping: "Shipping or delivery delay",
    rma: "Damaged or defective item — replacement / RMA request",
    billing: "Billing or Cam Plus subscription dispute",
    privacy: "Privacy or security concern (unexpected access, odd notifications)",
    howto: "Feature confusion — customer isn't sure how to do something",
    motion: "Motion detection or event clips not triggering when they should",
    sd: "SD card won't be recognized, or recorded video won't play back",
    battery: "Wireless camera battery draining too fast or not charging with a setup issue",
    view: "The live view is black, frozen, or keeps buffering",
    audio: "Two-way audio — the speaker or microphone isn't working",
    notify: "Push notifications for events aren't arriving (or are showing too many)",
    night: "Night vision or overall image quality looks dark, grainy, or washed out",
    home: "Smart-home integration issue — routines, Alexa, or Google Assistant won't work"
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
  var SIMULATOR_USERNAME = 'wyze_agent2026';
  var SIMULATOR_PASSCODE = 'wyzewizard2026';
  var loginProfile = null;
  var workspaceInitialized = false;
  var currentTheme = 'wyze';

  var AVATARS = [
    {
      id: 'pip',
      name: 'Pip the fox',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M13 29 18 6l17 15L52 7l7 24" fill="#F29B58" stroke="#B95637" stroke-width="3" stroke-linejoin="round"/><path d="m19 22 3-9 8 8m20 0 8-9 2 12" fill="#FFD3A3"/><circle cx="36" cy="38" r="25" fill="#F29B58" stroke="#B95637" stroke-width="3"/><path d="M22 43c1-7 7-10 14-10s13 3 14 10c0 9-7 14-14 14s-14-5-14-14Z" fill="#FFF1D9"/><ellipse cx="28" cy="36" rx="2.2" ry="3.2" fill="#293542"/><ellipse cx="44" cy="36" rx="2.2" ry="3.2" fill="#293542"/><path d="m33 44 3-2 3 2-3 3z" fill="#A94B43"/><path d="M31 49q5 4 10 0" fill="none" stroke="#8C4638" stroke-width="2" stroke-linecap="round"/><path d="M12 34v8m48-8v8" stroke="#46AFA5" stroke-width="5" stroke-linecap="round"/></svg>'
    },
    {
      id: 'momo',
      name: 'Momo the cat',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><path d="m13 30 3-22 18 13L53 8l6 24" fill="#9E91E8" stroke="#655BB5" stroke-width="3" stroke-linejoin="round"/><path d="m20 22 1-8 8 6m21 1 8-7 2 12" fill="#F6C0D8"/><path d="M11 39c0-15 10-25 25-25s25 10 25 25-10 26-25 26S11 54 11 39Z" fill="#B8ADF6" stroke="#655BB5" stroke-width="3"/><ellipse cx="27" cy="38" rx="2.2" ry="3" fill="#293542"/><ellipse cx="45" cy="38" rx="2.2" ry="3" fill="#293542"/><path d="m33 45 3-2 3 2-3 3z" fill="#DB7D9D"/><path d="M32 50q4 3 8 0" fill="none" stroke="#655BB5" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="46" r="3" fill="#F39BB7" opacity=".8"/><circle cx="52" cy="46" r="3" fill="#F39BB7" opacity=".8"/><path d="M16 30q20-22 40 0" fill="none" stroke="#FFD86A" stroke-width="4" stroke-linecap="round"/><path d="M10 36v9m52-9v9" stroke="#FFD86A" stroke-width="5" stroke-linecap="round"/></svg>'
    },
    {
      id: 'bibi',
      name: 'Bibi the axolotl',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M17 31 5 23l3 18 10 1m37-11 12-8-3 18-10 1" fill="#F58BA9" stroke="#C14F78" stroke-width="3" stroke-linejoin="round"/><path d="M20 19q16-12 32 0v7H20z" fill="#FFB1C4"/><path d="M12 40c0-15 10-23 24-23s24 8 24 23-10 23-24 23-24-8-24-23Z" fill="#70D2BE" stroke="#32998F" stroke-width="3"/><ellipse cx="27" cy="39" rx="2.2" ry="3" fill="#293542"/><ellipse cx="45" cy="39" rx="2.2" ry="3" fill="#293542"/><path d="M32 48q4 4 8 0" fill="none" stroke="#287E79" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="46" r="3" fill="#F58BA9"/><circle cx="52" cy="46" r="3" fill="#F58BA9"/><path d="M16 30q20-20 40 0" fill="none" stroke="#FFD86A" stroke-width="4" stroke-linecap="round"/><path d="M10 36v10m52-10v10" stroke="#FFD86A" stroke-width="5" stroke-linecap="round"/></svg>'
    },
    {
      id: 'toto',
      name: 'Toto the turtle',
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M16 45q-9 1-10 9 8 4 15-2m35-7q10 1 11 9-8 4-15-2" fill="#73BD79" stroke="#3B875E" stroke-width="3"/><path d="M19 45c0-15 7-23 17-23s17 8 17 23c0 11-8 17-17 17s-17-6-17-17Z" fill="#79CE8A" stroke="#3B875E" stroke-width="3"/><path d="M16 45q0-23 20-23t20 23q-8 9-20 9t-20-9Z" fill="#40A789" stroke="#287C70" stroke-width="3"/><path d="M24 36q12-11 24 0m-24 8q12-11 24 0" fill="none" stroke="#9BE0A4" stroke-width="2"/><ellipse cx="30" cy="43" rx="2.2" ry="3" fill="#293542"/><ellipse cx="42" cy="43" rx="2.2" ry="3" fill="#293542"/><path d="M32 51q4 3 8 0" fill="none" stroke="#287C70" stroke-width="2" stroke-linecap="round"/><path d="M18 33q18-17 36 0" fill="none" stroke="#FFD86A" stroke-width="4" stroke-linecap="round"/><path d="M13 38v8m46-8v8" stroke="#FFD86A" stroke-width="5" stroke-linecap="round"/></svg>'
    }
  ].concat([
    ['red-panda','Rumi the red panda','🐼','#F8D8C8','#D9754F'],
    ['owl','Olive the owl','🦉','#D8D2F4','#8876C7'],
    ['frog','Fern the frog','🐸','#D6F0D2','#55A66C'],
    ['penguin','Pip the penguin','🐧','#D8EAF5','#5987AA'],
    ['rabbit','Clover the bunny','🐰','#F7DCE8','#D987AA'],
    ['bear','Bramble the bear','🐻','#F1DEC8','#A8754C'],
    ['dog','Scout the dog','🐶','#F6E7C7','#D69A45'],
    ['dino','Dew the dinosaur','🦖','#D5EDC9','#65A35A'],
    ['bee','Bumble the bee','🐝','#F9E9AE','#D6A928'],
    ['raccoon','Rascal the raccoon','🦝','#D9DDE2','#7C8794'],
    ['whale','Wally the whale','🐳','#CDEAF4','#4D9FC0'],
    ['unicorn','Nova the unicorn','🦄','#EEDCF8','#A47BC0']
  ].map(function(item){
    return {
      id: item[0],
      name: item[1],
      art: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="' + item[3] + '"/><circle cx="36" cy="36" r="29" fill="' + item[4] + '" opacity=".18"/><text x="36" y="51" text-anchor="middle" font-size="48" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">' + item[2] + '</text></svg>'
    };
  }));

  var WYZE_CATALOG = [
    "Indoor cameras: Wyze Cam v3, Wyze Cam v3 Pro, Wyze Cam v2, Wyze Cam OG (incl. Telephoto), Wyze Cam Pan v2, Wyze Cam Indoor",
    "Battery / outdoor cameras: Wyze Cam Outdoor v2, Wyze Cam Outdoor v1, Wyze Battery Cam Pro, Wyze Cam Floodlight",
    "Video doorbells: Wyze Video Doorbell v2, Wyze Video Doorbell Pro, Wyze Video Doorbell v1 (battery/wired)",
    "Home security & locks: Wyze Sense v2 kit (entry/motion sensors + hub), Wyze Lock, Wyze Lock Bolt, Wyze Smart Lock, Wyze Siren",
    "Smart home & lighting: Wyze Bulb Color, Wyze Bulb White, Wyze Light Strip, Wyze Plug, Wyze Plug Outdoor",
    "Climate & sensors: Wyze Thermostat, Wyze Sense Thermostat, Wyze Temp/Humidity Sensor, Wyze Leak/Water sensor",
    "Robotics & wellness: Wyze Robot Vacuum, Wyze Robot Vacuum v2, Wyze Scale, Wyze Buds, Wyze Headphones",
    "Smartphones & accessories: Wyze Cam cases/mounts, Wyze rechargeable batteries, Wyze Power Adapter (make sure each is plausibly connected to the scenario)"
  ].join('\n');

  function usedProductsLabel(){
    var used = readLS('used-products') || [];
    if(used.length === 0) return 'None yet in this practice session.';
    return used.map(function(u){ return u.product + ' (category: ' + u.category + ')'; }).join('; ');
  }
  var CUSTOMER_NAME_KEY = 'ecewise:used-fictional-customer-names';
  var CUSTOMER_FIRST_NAMES = [
    'Avery','Bailey','Casey','Drew','Ellis','Emery','Finley','Harper','Jamie','Jordan',
    'Kai','Logan','Micah','Morgan','Parker','Quinn','Reese','Riley','Rowan','Sage',
    'Skyler','Taylor','Alex','Amari','Blake','Cameron','Dakota','Eden','Frankie','Jules',
    'Kendall','Lane','Marley','Noel','Remy','Shiloh','Tatum','Val','Wren','Zion'
  ];
  var CUSTOMER_LAST_NAMES = [
    'Alden','Arbor','Ashby','Bennett','Briar','Calloway','Cedar','Chen','Cortez','Dawson',
    'Ellison','Foster','Garcia','Hayes','Imani','Jensen','Kim','Lennox','Marin','Mori',
    'Navarro','Oakley','Park','Quincy','Reed','Rivera','Sawyer','Sato','Shah','Solano',
    'Tanaka','Valdez','Vega','Wells','Whitaker','Wilder','Yoon','Zeller'
  ];
  function usedCustomerNames(){
    try {
      var stored = JSON.parse(localStorage.getItem(CUSTOMER_NAME_KEY) || '[]');
      var names = Array.isArray(stored) ? stored : [];
      var seen = Object.create(null);
      names.forEach(function(name){ seen[String(name).trim().toLowerCase()] = true; });
      function addName(name){
        var normalized = String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
        if(normalized && !seen[normalized]){
          seen[normalized] = true;
          names.push(normalized);
        }
      }
      function collect(value){
        if(Array.isArray(value)){
          value.forEach(function(item){
            if(item && item.persona) addName(item.persona.name);
            else if(item && item.name) addName(item.name);
          });
        } else if(value && value.persona){
          addName(value.persona.name);
        }
      }
      for(var i = 0; i < localStorage.length; i++){
        var key = localStorage.key(i) || '';
        if(key.indexOf('ecewise:') !== 0 ||
           (!key.includes(':session-index') && !key.includes(':live-sessions') && !key.includes(':session:'))) continue;
        try { collect(JSON.parse(localStorage.getItem(key) || 'null')); } catch(e){}
      }
      if(names.length !== stored.length){
        try { localStorage.setItem(CUSTOMER_NAME_KEY, JSON.stringify(names)); } catch(e){}
      }
      return names;
    } catch(e){ return []; }
  }
  function recordUniqueCustomerName(name){
    var names = usedCustomerNames();
    var normalized = String(name || '').trim().toLowerCase();
    if(normalized && names.indexOf(normalized) === -1){
      names.push(normalized);
      try { localStorage.setItem(CUSTOMER_NAME_KEY, JSON.stringify(names)); } catch(e){}
    }
  }
  function makeUnusedCustomerName(){
    var used = usedCustomerNames();
    var blocked = Object.create(null);
    used.forEach(function(name){ blocked[String(name).trim().toLowerCase()] = true; });
    var choices = CUSTOMER_FIRST_NAMES.length * CUSTOMER_LAST_NAMES.length;
    var offset = Math.floor(Math.random() * choices);
    for(var i = 0; i < choices; i++){
      var choice = (offset + i) % choices;
      var first = CUSTOMER_FIRST_NAMES[Math.floor(choice / CUSTOMER_LAST_NAMES.length)];
      var last = CUSTOMER_LAST_NAMES[choice % CUSTOMER_LAST_NAMES.length];
      var candidate = first + ' ' + last;
      if(!blocked[candidate.toLowerCase()]) return candidate;
    }
    var base = CUSTOMER_FIRST_NAMES[Math.floor(Math.random() * CUSTOMER_FIRST_NAMES.length)] + ' ' +
      CUSTOMER_LAST_NAMES[Math.floor(Math.random() * CUSTOMER_LAST_NAMES.length)];
    var suffix = 2;
    while(blocked[(base + ' ' + suffix).toLowerCase()]) suffix++;
    return base + ' ' + suffix;
  }
  function makeFakeCustomerDetails(persona){
    function token(length){
      return Math.random().toString(16).slice(2).toUpperCase().padEnd(length, '0').slice(0, length);
    }
    var twoDigit = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    var month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    var day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    persona.email = 'customer-' + token(8).toLowerCase() + '@example.invalid';
    persona.phone = '+1 (202) 555-01' + twoDigit;
    persona.shippingAddress = (100 + Math.floor(Math.random() * 900)) +
      ' Example Lane, Sampleville, ZZ 00000';
    persona.macAddress = '02:' + token(2) + ':' + token(2) + ':' + token(2) + ':' + token(2) + ':' + token(2);
    persona.orderNumber = 'TEST-WZ-' + token(8);
    persona.serialNumber = 'TEST-SN-' + token(8);
    persona.purchaseDate = '2025-' + month + '-' + day;
    return persona;
  }
  function usedCustomerNamesLabel(){
    var names = usedCustomerNames();
    return names.length ? names.slice(-100).join(', ') : 'None yet.';
  }
  function recordUsedProduct(persona){
    var used = readLS('used-products') || [];
    if(!persona || !persona.product) return;
    used = used.filter(function(u){ return u.product.toLowerCase() !== persona.product.toLowerCase(); });
    used.unshift({ product: persona.product, category: persona.issueCategory || '' });
    used = used.slice(0, 12);
    writeLS('used-products', used);
  }

  /* ---------- Session factory ---------- */
  function newSession(){
    return {
      sessionId: null,
      ticketId: null,
      createdAt: null,
      persona: null,
      messages: [],
      status: 'OPEN',
      busy: false,
      holdDeadline: null,
      holdMinutes: null,
      gentleCheckInSent: false,
      abandoned: false,
      feedback: null,
      typeStart: null,
      ended: false,
      cleared: false,
      avgWpm: null,
      coachingPoints: null,
      traineeName: '',
      avatarId: 'pip',
      lob: '',
      notes: { fCustomerName:'', fEmail:'', fProduct:'', fRecap:'', fResources:'', fNextSteps:'', fEscalation:'' }
    };
  }

  var sessions = [newSession()];
  var activeIndex = 0;
  var state = sessions[0];
  var trainerMode = false;
  var twoChats = false;
  var timerOn = false;
  var caseOpen = false;
  var trainerAccess = false;
  var TRAINER_PASSCODE = 'wyzeleadership';
  var currentSimMode = 'chat'; // 'chat' or 'email'
  var emailPendingTimeout = null;
  var emailPendingArrival = null;
  var adminTraineesData = [];
  var currentAdminView = 'table';
  var analyticsTargetUser = null;

  function $(id){ return document.getElementById(id); }
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

  /* DOM elements */
  var loginScreen = $('loginScreen');
  var loginStatus = $('loginStatus');
  var authTabs = $('authTabs');
  var tabSignIn = $('tabSignIn');
  var tabSignUp = $('tabSignUp');
  var signInView = $('signInView');
  var signUpView = $('signUpView');
  var forgotPasswordView = $('forgotPasswordView');
  var signInForm = $('signInForm');
  var signUpForm = $('signUpForm');
  var forgotPasswordForm = $('forgotPasswordForm');
  var signOutBtn = $('signOutBtn');

  var appRoot = $('appRoot');
  var agentIdentity = $('agentIdentity');
  var welcomeModal = $('welcomeModal');
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
  var timerToggle = $('timerToggle');
  var themeSelect = $('themeSelect');
  var answerKey = $('answerKey');
  var answerKeyContent = $('answerKeyContent');
  var feedbackBox = $('feedbackBox');
  var feedbackContent = $('feedbackContent');
  var saveIndicator = $('saveIndicator');
  var categorySelect = $('categorySelect');
  var emotionSelect = $('emotionSelect');
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

  var modeChatBtn = $('modeChatBtn');
  var modeEmailBtn = $('modeEmailBtn');
  var emailTicketHeader = $('emailTicketHeader');
  var emailSubjectText = $('emailSubjectText');
  var emailCustomerFrom = $('emailCustomerFrom');
  var emailMinMins = $('emailMinMins');
  var emailMaxMins = $('emailMaxMins');
  var emailPendingBanner = $('emailPendingBanner');
  var emailPendingMins = $('emailPendingMins');
  var emailClockStamp = $('emailClockStamp');
  var emailFastForwardBtn = $('emailFastForwardBtn');
  var adminConsoleBtn = $('adminConsoleBtn');
  var adminConsoleModal = $('adminConsoleModal');
  var closeAdminConsole = $('closeAdminConsole');
  var adminPasscodeGate = $('adminPasscodeGate');
  var adminGatePasscode = $('adminGatePasscode');
  var adminGateUnlockBtn = $('adminGateUnlockBtn');
  var adminGateStatus = $('adminGateStatus');
  var adminDashboardView = $('adminDashboardView');
  var adminSearchInput = $('adminSearchInput');
  var adminStatusFilter = $('adminStatusFilter');
  var adminViewTableBtn = $('adminViewTableBtn');
  var adminViewCardsBtn = $('adminViewCardsBtn');
  var adminInviteBtn = $('adminInviteBtn');
  var adminTraineesTableBody = $('adminTraineesTableBody');
  var adminCardsView = $('adminCardsView');
  var adminInviteModal = $('adminInviteModal');
  var closeAdminInvite = $('closeAdminInvite');
  var cancelAdminInvite = $('cancelAdminInvite');
  var adminInviteForm = $('adminInviteForm');
  var inviteSuccessCard = $('inviteSuccessCard');
  var inviteSuccessBody = $('inviteSuccessBody');
  var adminResetModal = $('adminResetModal');
  var closeAdminResetModal = $('closeAdminResetModal');
  var dismissAdminResetModal = $('dismissAdminResetModal');
  var adminResetBody = $('adminResetBody');

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
  var historyRefreshTimer = null;
  var historyFetchVersion = 0;
  var serverSaveQueues = Object.create(null);

  var TIMER_WARN = 60;    // seconds in the yellow zone
  var TIMER_DANGER = 120; // seconds before it turns red
  var HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
  var ABANDON_TIMEOUT_MS = 7 * 60 * 1000; // 7 minutes of total silence triggers customer abandonment

  var ABANDON_OUTBURSTS = [
    "Seven minutes of complete silence?! No one is answering, no updates, nothing. Wyze customer support has completely wasted my time today. I am closing this chat, disconnecting my devices, and taking my business elsewhere!",
    "I have been waiting here for over 7 minutes with zero response or acknowledgment. This is absolutely terrible support. I cannot waste any more time staring at a blank screen. I'm leaving this chat and escalating this complaint directly to corporate customer relations.",
    "Hello?! 7 whole minutes with no reply at all. It's obvious nobody cares to assist or even check in. What an unacceptable support experience. I am leaving this chat right now.",
    "Still nothing after 7 minutes? This is ridiculous. I asked for help with my Wyze setup and was completely ignored. I am closing this session and disputing my Cam Plus subscription with my bank.",
    "I've been sitting here for 7 minutes waiting for any kind of update. Clearly no agent is actively working on this. I'm ending this chat and posting about this awful support experience on the Wyze community forum."
  ];

  function setLoginStatus(msg, isError, isSuccess){
    if(!loginStatus) return;
    loginStatus.textContent = msg;
    loginStatus.classList.remove('error', 'success');
    if(isError) loginStatus.classList.add('error');
    if(isSuccess) loginStatus.classList.add('success');
    var banner = $('loginStatusBanner');
    if(banner){
      banner.classList.remove('error', 'success');
      if(isError) banner.classList.add('error');
      if(isSuccess) banner.classList.add('success');
    }
    var dot = $('loginStatusDot');
    if(dot){
      dot.className = 'status-dot ' + (isError ? 'dot-error' : (isSuccess ? 'dot-success' : 'dot-normal'));
    }
  }

  function setAuthTab(mode){
    var signInRow = $('signInSwitchRow');
    var signUpRow = $('signUpSwitchRow');
    var forgotRow = $('forgotSwitchRow');
    if(mode === 'signIn'){
      if(tabSignIn) { tabSignIn.classList.add('active'); tabSignIn.setAttribute('aria-selected', 'true'); }
      if(tabSignUp) { tabSignUp.classList.remove('active'); tabSignUp.setAttribute('aria-selected', 'false'); }
      if(signInView) signInView.hidden = false;
      if(signUpView) signUpView.hidden = true;
      if(forgotPasswordView) forgotPasswordView.hidden = true;
      if(authTabs) authTabs.hidden = false;
      if(signInRow) signInRow.hidden = false;
      if(signUpRow) signUpRow.hidden = true;
      if(forgotRow) forgotRow.hidden = true;
      setLoginStatus('Sign in with your registered ECE credentials.', false);
      if($('signInEmail')) $('signInEmail').focus();
    } else if(mode === 'signUp'){
      if(tabSignUp) { tabSignUp.classList.add('active'); tabSignUp.setAttribute('aria-selected', 'true'); }
      if(tabSignIn) { tabSignIn.classList.remove('active'); tabSignIn.setAttribute('aria-selected', 'false'); }
      if(signUpView) signUpView.hidden = false;
      if(signInView) signInView.hidden = true;
      if(forgotPasswordView) forgotPasswordView.hidden = true;
      if(authTabs) authTabs.hidden = false;
      if(signInRow) signInRow.hidden = true;
      if(signUpRow) signUpRow.hidden = false;
      if(forgotRow) forgotRow.hidden = true;
      if($('signUpDetailsStep')) $('signUpDetailsStep').hidden = false;
      if($('signUpAvatarStep')) $('signUpAvatarStep').hidden = true;
      setLoginStatus('Create your unique trainee account with your ECE corporate email.', false);
      if($('signUpEmail')) $('signUpEmail').focus();
    } else if(mode === 'forgot'){
      if(forgotPasswordView) forgotPasswordView.hidden = false;
      if(signInView) signInView.hidden = true;
      if(signUpView) signUpView.hidden = true;
      if(authTabs) authTabs.hidden = true;
      if(signInRow) signInRow.hidden = true;
      if(signUpRow) signUpRow.hidden = true;
      if(forgotRow) forgotRow.hidden = false;
      if($('forgotStep1')) $('forgotStep1').hidden = false;
      if($('forgotStep2')) $('forgotStep2').hidden = true;
      if($('securityDispatchCard')) $('securityDispatchCard').hidden = true;
      setLoginStatus('Enter your ECE email to receive a password reset code.', false);
      if($('forgotEmail')) $('forgotEmail').focus();
    }
  }

  function applyTheme(themeName){
    currentTheme = themeName || 'wyze';
    document.documentElement.setAttribute('data-theme', currentTheme);
    if(themeSelect) themeSelect.value = currentTheme;
  }

  function setSimulationMode(mode){
    currentSimMode = mode === 'email' ? 'email' : 'chat';
    if(modeChatBtn) modeChatBtn.classList.toggle('active', currentSimMode === 'chat');
    if(modeEmailBtn) modeEmailBtn.classList.toggle('active', currentSimMode === 'email');
    if(emailTicketHeader) emailTicketHeader.hidden = currentSimMode !== 'email';
    if(speedBar) speedBar.hidden = currentSimMode === 'email';
    if(replyTimer) replyTimer.hidden = currentSimMode === 'email' || !timerOn;
    if(agentInput){
      agentInput.placeholder = currentSimMode === 'email' ?
        'Draft your customer email response… (Click Send Email to transmit)' :
        'Type your reply as the agent… (Enter to send, Shift+Enter for a new line)';
    }
    if(sendBtn){
      sendBtn.textContent = currentSimMode === 'email' ? 'Send Email' : 'Send';
    }
    updateEmailHeaderInfo();
    renderMessages();
  }

  function updateEmailHeaderInfo(){
    if(currentSimMode !== 'email') return;
    if(!state || !state.persona){
      if(emailSubjectText) emailSubjectText.textContent = 'No active email ticket';
      if(emailCustomerFrom) emailCustomerFrom.textContent = 'Customer <pending>';
      return;
    }
    if(emailSubjectText){
      emailSubjectText.textContent = 'Re: [' + (state.ticketId || 'WZ-NEW') + '] Wyze ' + (state.persona.product || 'Device') + ' - ' + (state.persona.issueCategory || 'Inquiry');
    }
    if(emailCustomerFrom){
      emailCustomerFrom.textContent = state.persona.name + ' <' + state.persona.email + '>';
    }
  }

  function genId(prefix){
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }
  function genTicketId(){
    return 'WZ-' + Math.floor(100000 + Math.random()*899999);
  }
  function fmtTime(ts){
    return new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  }
  function escapeHtml(str){
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
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
  function guessEmotionColor(str){
    var s = (str || '').toLowerCase();
    if(/upset|angry|escalat|furious/.test(s)) return 'coral';
    if(/frustrat|annoy|impatient/.test(s)) return 'amber';
    if(/anxious|worried|confus|nervous/.test(s)) return 'blue';
    if(/calm|neutral|patient/.test(s)) return 'teal';
    return 'muted';
  }

  async function runModel(messages, opts){
    opts = opts || {};
    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          schema: opts.schema,
          json: opts.json
        })
      });
      if(!res.ok){
        var errData = await res.json().catch(function(){ return {}; });
        throw new Error(errData.error || "Couldn't reach the simulator model — try again.");
      }
      var data = await res.json();
      return data.content;
    } catch(e){
      throw new Error(e.message || "Couldn't reach the simulator model — try again.");
    }
  }

  function anyBusy(){
    return sessions.some(function(s){ return s.busy; });
  }
  function refreshControls(){
    newScenarioBtn.disabled = state.busy;
    categorySelect.disabled = state.busy;
    emotionSelect.disabled = state.busy;
    sendBtn.disabled = state.busy || !state.persona || state.ended;
    clearChatBtn.disabled = state.busy || !state.persona || state.ended;
    agentInput.disabled = state.busy || !state.persona || state.ended;
    feedbackBtn.disabled = state.busy || !state.persona || state.messages.length < 2;
    endBtn.disabled = state.busy || !state.persona || state.ended || state.messages.length < 2;
    typingIndicator.hidden = !(state.busy && state.persona && !state.ended);
  }
  function setBusy(isBusy, s){
    s = s || state;
    s.busy = isBusy;
    if(s === state) refreshControls();
  }

  function showError(message, retryFn){
    errorText.textContent = message;
    errorBanner.hidden = false;
    lastFailedAction = retryFn || null;
    retryBtn.hidden = !retryFn;
  }
  function clearError(){
    errorBanner.hidden = true;
    lastFailedAction = null;
  }

  function renderMessages(){
    chatLog.innerHTML = '';
    if(state.messages.length === 0){
      chatLog.appendChild(emptyState);
      return;
    }
    var frag = document.createDocumentFragment();
    state.messages.forEach(function(m){
      if(m.role === 'audit'){
        var auditRow = document.createElement('div');
        auditRow.className = 'chat-audit';
        auditRow.textContent = m.text + ' · ' + fmtTime(m.ts);
        frag.appendChild(auditRow);
        return;
      }

      if(currentSimMode === 'email'){
        var emailItem = document.createElement('div');
        emailItem.className = 'email-thread-item ' + (m.role === 'agent' ? 'email-from-agent' : 'email-from-customer');
        var senderLabel = m.role === 'agent'
          ? (loginProfile ? loginProfile.name : 'Support Agent') + ' <support@wyze.com>'
          : (state.persona ? (state.persona.name + ' <' + state.persona.email + '>') : 'Customer');
        var delayTag = '';
        if(m.gapSec != null && m.gapSec > 0){
          var mins = Math.round(m.gapSec / 60);
          delayTag = '<span class="email-delay-tag">⏱️ +' + (mins >= 60 ? (Math.floor(mins/60) + 'h ' + (mins%60) + 'm') : (mins + 'm')) + ' wait</span>';
        }
        emailItem.innerHTML = '<div class="email-thread-head">' +
          '<div class="email-thread-sender">' +
            (m.role === 'agent' ? avatarMarkup(state.avatarId || (loginProfile && loginProfile.avatarId) || 'pip', 'email-sender-avatar') : '<span class="email-customer-avatar">👤</span>') +
            '<div><div class="email-sender-name">' + escapeHtml(senderLabel) + '</div>' +
            '<div class="email-sender-role">' + (m.role === 'agent' ? 'Wyze Customer Support Tier 1' : 'Verified Customer') + '</div></div>' +
          '</div>' +
          '<div class="email-thread-time">' + fmtTime(m.ts) + delayTag + '</div>' +
        '</div>' +
        '<div class="email-thread-body">' + escapeHtml(m.text) + '</div>';
        frag.appendChild(emailItem);
        return;
      }

      var row = document.createElement('div');
      row.className = 'msg-row ' + (m.role === 'agent' ? 'from-agent' : 'from-customer');
      var content = document.createElement('div');
      content.className = 'msg-content';
      if(m.role === 'agent' && loginProfile){
        var avatarHolder = document.createElement('span');
        avatarHolder.innerHTML = avatarMarkup(state.avatarId || loginProfile.avatarId, 'message-avatar');
        content.appendChild(avatarHolder.firstElementChild);
      }
      var bubble = document.createElement('div');
      bubble.className = 'bubble' + (m.abandonment ? ' bubble-abandonment' : '');
      bubble.textContent = m.text;
      var metaEl = document.createElement('div');
      metaEl.className = 'msg-time';
      var parts = [(m.role === 'agent' ? 'You' : (state.persona ? state.persona.name : 'Customer')), fmtTime(m.ts)];
      if(m.gapSec != null) parts.push('+' + m.gapSec + 's wait');
      if(m.role === 'agent' && m.wpm) parts.push(m.wpm + ' WPM');
      metaEl.textContent = parts.join(' · ');
      content.appendChild(bubble);
      row.appendChild(content);
      row.appendChild(metaEl);
      frag.appendChild(row);
    });
    chatLog.appendChild(frag);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function renderPersonaBar(){
    renderAgentIdentity();
    updateEmailHeaderInfo();
    if(!state.persona){
      ticketIdEl.textContent = 'No active case';
      statusPill.hidden = true;
      chatMeta.textContent = '';
      return;
    }
    ticketIdEl.textContent = state.ticketId + ' · ' + state.persona.product;
    statusPill.hidden = false;
    statusPill.dataset.status = state.status.toLowerCase();
    statusPill.textContent = state.status === 'OPEN' ? 'Open' : (state.status === 'ESCALATED' ? 'Escalated' : (state.status === 'ABANDONED' ? 'Abandoned' : (state.status === 'CLEARED' ? 'Cleared' : 'Resolved')));
    var color = guessEmotionColor(state.persona.emotionalState);
    chatMeta.innerHTML = '<span class="dot dot-' + color + '"></span>' +
      escapeHtml(state.persona.emotionalState) + ' · ' + escapeHtml(state.persona.issueCategory);
  }
  function renderAgentIdentity(){
    if(!loginProfile){
      agentIdentity.hidden = true;
      return;
    }
    var avatarId = state.persona ? state.avatarId : loginProfile.avatarId;
    var avatar = AVATARS.find(function(item){ return item.id === avatarId; }) || AVATARS[0];
    agentIdentity.hidden = false;
    agentIdentity.innerHTML = avatarMarkup(avatar.id, 'identity-avatar') + '<span>' + escapeHtml(loginProfile.name) + '</span>';
  }

  function renderTabs(){
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
      b.addEventListener('click', (function(idx){ return function(){ activateChat(idx); }; })(i));
      chatTabs.appendChild(b);
    });
  }

  function updateCaseLabel(){
    if(!caseOpen) return;
    caseTabLabel.textContent = ' • Chat ' + (activeIndex + 1) + (state.persona ? (' — ' + state.persona.name) : ' (idle)');
  }

  function renderAnswerKey(){
    if(!trainerMode){
      answerKey.hidden = true;
      return;
    }
    answerKey.hidden = false;
    if(!state.persona){
      answerKeyContent.innerHTML = '<p class="muted" style="grid-column:1/-1;margin:0;">Start a scenario to reveal the answer key.</p>';
      return;
    }
    var p = state.persona;
    var keys = ['name','email','phone','shippingAddress','product','macAddress','orderNumber','serialNumber'];
    var labels = ['Name','Email','Phone','Shipping address','Product','MAC address','Order / RMA #','Serial number'];
    var rows = keys.map(function(k, i){ return [labels[i], p[k], (k==='macAddress'||k==='orderNumber')]; })
      .concat([['Purchase date', p.purchaseDate, false], ['Real issue & ideal resolution', p.hiddenSummary, false]]);
    answerKeyContent.innerHTML = rows.map(function(r){
      return '<dt>' + escapeHtml(r[0]) + '</dt><dd' + (r[2] ? ' class="mono"' : '') + '>' + escapeHtml(r[1] || '—') + '</dd>';
    }).join('');
  }

  function renderFeedback(){
    if(state.feedback){
      feedbackBox.hidden = false;
      feedbackContent.textContent = state.feedback;
    } else {
      feedbackBox.hidden = true;
    }
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

  /* ---------- per-session case fields swap ---------- */
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
    caseFields.fCustomerName.value = s.notes.fCustomerName;
    caseFields.fEmail.value = s.notes.fEmail;
    caseFields.fProduct.value = s.notes.fProduct;
    caseFields.fRecap.value = s.notes.fRecap;
    caseFields.fResources.value = s.notes.fResources;
    caseFields.fNextSteps.value = s.notes.fNextSteps;
    caseFields.fEscalation.value = s.notes.fEscalation;
    fTraineeName.value = loginProfile ? loginProfile.name : s.traineeName;
    fLob.value = s.lob;
  }
  function activateChat(idx){
    if(idx === activeIndex) return;
    captureNotes();
    quietSave(state);
    state = sessions[idx];
    activeIndex = idx;
    applyNotes(state);
    state.typeStart = null;
    renderTabs();
    renderPersonaBar();
    renderMessages();
    renderFeedback();
    renderAnswerKey();
    coachingBox.hidden = true;
    avgWpmBox.hidden = true;
    if(state.status === 'ABANDONED'){
      endBtn.textContent = 'Ended (Abandoned)';
      endBtn.dataset.ended = 'true';
    } else if(state.ended){
      endBtn.textContent = 'Ended';
      endBtn.dataset.ended = 'true';
    } else {
      endBtn.textContent = 'End conversation';
      delete endBtn.dataset.ended;
    }
    updateCaseLabel();
    refreshControls();
    updateSpeedUI();
    updateReplyTimer();
  }

  function ensureSlots(){
    var want = twoChats ? 2 : 1;
    if(sessions.length < want){
      sessions.push(newSession());
    } else if(sessions.length > want){
      if(activeIndex >= want) activeIndex = want - 1;
      sessions = sessions.slice(0, want);
      state = sessions[activeIndex];
    }
    if(activeIndex >= sessions.length) activeIndex = sessions.length - 1;
    state = sessions[activeIndex];
  }

  /* ---------- local persistence ---------- */
  function readLS(key){
    try { return JSON.parse(localStorage.getItem(storageKey(key))); } catch(e){ return null; }
  }
  function writeLS(key, value){
    try { localStorage.setItem(storageKey(key), JSON.stringify(value)); } catch(e){}
  }
  function storageKey(key){
    var name = loginProfile && loginProfile.name ? loginProfile.name.trim().toLowerCase() : 'locked';
    var identity = loginProfile && loginProfile.userId ? loginProfile.userId : 'local';
    return 'ecewise:' + encodeURIComponent(identity + ':' + name) + ':' + key;
  }

  var saveTimer = null;
  function scheduleSave(s){
    s = (s && s.sessionId) ? s : state;
    if(s === state) saveIndicator.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ doSave(s); }, 500);
  }
  function serializeSession(s){
    return {
      id: s.sessionId,
      ticketId: s.ticketId,
      createdAt: s.createdAt,
      persona: s.persona,
      messages: s.messages,
      status: s.status,
      holdDeadline: s.holdDeadline,
      holdMinutes: s.holdMinutes,
      gentleCheckInSent: !!s.gentleCheckInSent,
      abandoned: !!s.abandoned,
      feedback: s.feedback,
      notes: {
        customerName: s.notes.fCustomerName,
        email: s.notes.fEmail,
        product: s.notes.fProduct,
        recap: s.notes.fRecap,
        resources: s.notes.fResources,
        nextSteps: s.notes.fNextSteps,
        escalation: s.notes.fEscalation
      },
      traineeName: s.traineeName,
      avatarId: s.avatarId,
      lob: s.lob,
      avgWpm: s.avgWpm,
      coachingPoints: s.coachingPoints,
      ended: s.ended,
      cleared: !!s.cleared
    };
  }
  function unserializeSession(p){
    if(!p || !p.messages) return null;
    var s = newSession();
    s.sessionId = p.id || null;
    s.ticketId = p.ticketId || null;
    s.createdAt = p.createdAt || null;
    s.persona = p.persona || null;
    s.messages = p.messages || [];
    s.status = p.status || 'OPEN';
    s.holdDeadline = p.holdDeadline || null;
    s.holdMinutes = p.holdMinutes || null;
    s.gentleCheckInSent = !!p.gentleCheckInSent;
    s.abandoned = !!p.abandoned;
    s.feedback = p.feedback || null;
    s.avgWpm = p.avgWpm || null;
    s.coachingPoints = p.coachingPoints || null;
    s.traineeName = p.traineeName || '';
    s.avatarId = p.avatarId || 'pip';
    s.lob = p.lob || '';
    s.ended = !!p.ended;
    s.cleared = !!p.cleared;
    if(p.notes){
      s.notes.fCustomerName = p.notes.customerName || '';
      s.notes.fEmail = p.notes.email || '';
      s.notes.fProduct = p.notes.product || '';
      s.notes.fRecap = p.notes.recap || '';
      s.notes.fResources = p.notes.resources || '';
      s.notes.fNextSteps = p.notes.nextSteps || '';
      s.notes.fEscalation = p.notes.escalation || '';
    }
    return s;
  }
  function saveLocalSession(s){
    if(!s.sessionId) return;
    var payload = serializeSession(s);
    try { localStorage.setItem(storageKey('session:' + s.sessionId), JSON.stringify(payload)); updateIndex(payload); } catch(e){}
  }
  function saveLiveSessions(){
    try { localStorage.setItem(storageKey('live-sessions'), JSON.stringify(sessions.map(serializeSession))); } catch(e){}
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
          'content-type': 'application/json',
          'x-websim-user-id': (loginProfile && loginProfile.userId) || 'trainee_local',
          'x-websim-username': (loginProfile && loginProfile.name) || 'trainee'
        },
        body: payload
      });
    }).then(function(response){
      if(s === state){
        if(response.ok) saveIndicator.textContent = 'Saved to team history';
        else if(response.status === 401) saveIndicator.textContent = 'Saved locally · sign in to share';
        else saveIndicator.textContent = 'Saved locally';
      }
    }).catch(function(){
      if(s === state) saveIndicator.textContent = 'Saved locally';
    });
    serverSaveQueues[s.sessionId] = next;
    return next;
  }
  function saveAllLocal(){
    sessions.forEach(function(s){ saveLocalSession(s); });
    saveLiveSessions();
  }
  function doSave(s){
    if(s === state && s.sessionId) captureNotes();
    saveAllLocal();
    pushServerSession(s);
  }
  function quietSave(s){
    if(s === state && s.sessionId) captureNotes();
    saveLocalSession(s);
    saveLiveSessions();
    pushServerSession(s);
  }
  function updateIndex(payload){
    var index = readLS('session-index') || [];
    index = index.filter(function(i){ return i.id !== payload.id; });
    index.unshift({
      id: payload.id,
      ticketId: payload.ticketId,
      createdAt: payload.createdAt,
      updatedAt: Date.now(),
      name: payload.persona ? payload.persona.name : 'Unknown',
      category: payload.persona ? payload.persona.issueCategory : '',
      status: payload.status
    });
    index = index.slice(0, 50);
    writeLS('session-index', index);
  }
  function loadSettings(){
    var s = readLS('settings') || {};
    trainerMode = !!s.trainerMode;
    trainerModeToggle.checked = trainerMode;
    twoChats = !!s.twoChats;
    twoChatsToggle.checked = twoChats;
    timerOn = !!s.timerOn;
    timerToggle.checked = timerOn;
    replyTimer.hidden = !timerOn;
    fTraineeName.value = loginProfile ? loginProfile.name : (s.traineeName || '');
    fLob.value = s.lob || '';
    if(s.theme) applyTheme(s.theme);
    ensureSlots();
  }
  function restoreLive(){
    var saved = readLS('live-sessions');
    if(Array.isArray(saved) && saved.length){
      var restored = saved.map(unserializeSession).filter(Boolean);
      if(restored.length){
        sessions = restored;
        sessions.forEach(function(session){
          if(loginProfile){
            session.traineeName = loginProfile.name;
            if(!session.persona) session.avatarId = loginProfile.avatarId;
          }
        });
      }
    }
  }
  function saveSettings(){
    var s = readLS('settings') || {};
    s.trainerMode = trainerMode;
    s.twoChats = twoChats;
    s.timerOn = timerOn;
    s.theme = currentTheme;
    writeLS('settings', s);
  }
  function recordTraineeSummary(){
    var s = readLS('settings') || {};
    s.traineeName = loginProfile ? loginProfile.name : fTraineeName.value;
    s.lob = fLob.value;
    writeLS('settings', s);
    quietSave(state);
  }

  function initializeWorkspaceForLogin(){
    if(workspaceInitialized) return;
    workspaceInitialized = true;
    loadSettings();
    restoreLive();
    ensureSlots();
    sessions.forEach(function(session){
      session.traineeName = loginProfile.name;
      if(!session.persona) session.avatarId = loginProfile.avatarId;
    });
    state = sessions[activeIndex];
    applyNotes(state);
    renderTabs();
    renderPersonaBar();
    renderAnswerKey();
    renderMessages();
    renderFeedback();
    refreshControls();
    updateSpeedUI();
    updateCaseLabel();
    updateReplyTimer();
  }

  function completeLogin(welcomeMsg){
    loginScreen.hidden = true;
    appRoot.hidden = false;
    appRoot.setAttribute('aria-hidden', 'false');
    var accountStatus = $('accountStatus');
    if(accountStatus){
      accountStatus.textContent = 'Signed in as ' + loginProfile.name + ' (' + (loginProfile.email || 'ECE') + ')';
      accountStatus.className = 'sync-status is-synced';
    }
    initializeWorkspaceForLogin();
    if(!readLS('walkthrough-seen')) welcomeModal.hidden = false;
    if(welcomeMsg) setLoginStatus(welcomeMsg, false, true);
  }

  function checkExistingAuth(){
    try {
      var saved = JSON.parse(localStorage.getItem('ecewise:auth-profile') || 'null');
      if(saved && saved.userId && saved.name){
        loginProfile = saved;
        completeLogin('Welcome back, ' + loginProfile.name);
        return true;
      }
    } catch(e){}
    return false;
  }

  function handleSignOut(){
    loginProfile = null;
    try {
      localStorage.removeItem('ecewise:auth-profile');
    } catch(e){}
    appRoot.hidden = true;
    appRoot.setAttribute('aria-hidden', 'true');
    loginScreen.hidden = false;
    setAuthTab('signIn');
    setLoginStatus('Signed out successfully.', false);
    if($('signInPassword')) $('signInPassword').value = '';
  }

  /* --- Sign In Handler --- */
  async function handleSignIn(ev){
    ev.preventDefault();
    var email = $('signInEmail').value.trim();
    var password = $('signInPassword').value;

    if(!email || !password){
      setLoginStatus('Please enter both your ECE email and password.', true);
      return;
    }

    setLoginStatus('Verifying credentials…', false);
    try {
      var res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
      var data = await res.json();
      if(!res.ok){
        // Backward-compatibility: allow legacy credentials if used
        if((email === SIMULATOR_USERNAME || email === 'admin') && password === SIMULATOR_PASSCODE){
          loginProfile = {
            name: 'Wyze Agent',
            email: 'agent@ececontactcenters.com',
            avatarId: 'pip',
            userId: 'trainee_wyze_agent'
          };
          try { localStorage.setItem('ecewise:auth-profile', JSON.stringify(loginProfile)); } catch(e){}
          completeLogin('Signed in with shared credentials.');
          return;
        }
        setLoginStatus(data.error || 'Invalid ECE email or password.', true);
        return;
      }

      loginProfile = {
        name: data.user.name,
        email: data.user.email,
        avatarId: data.user.avatarId || 'pip',
        userId: data.user.id
      };
      try {
        localStorage.setItem('ecewise:auth-profile', JSON.stringify(loginProfile));
      } catch(e){}

      completeLogin('Signed in successfully.');
    } catch(e){
      setLoginStatus(e.message || 'Network error during sign in.', true);
    }
  }

  /* --- Sign Up Continue Handler --- */
  function handleSignUpContinue(){
    var fields = [$('signUpEmail'), $('signUpName'), $('signUpPassword'), $('signUpRepeatPassword')];
    for(var i = 0; i < fields.length; i++){
      if(!fields[i].reportValidity()) return;
    }

    var email = $('signUpEmail').value.trim().toLowerCase();
    var name = $('signUpName').value.trim();
    var password = $('signUpPassword').value;
    var repeatPassword = $('signUpRepeatPassword').value;

    if(!email.includes('@') || (!email.includes('ece') && !email.endsWith('ececontactcenters.com'))){
      setLoginStatus('Please enter a valid corporate ECE email (e.g. name@ececontactcenters.com).', true);
      $('signUpEmail').focus();
      return;
    }
    if(password.length < 6){
      setLoginStatus('Password must be at least 6 characters long.', true);
      $('signUpPassword').focus();
      return;
    }
    if(password !== repeatPassword){
      setLoginStatus('Passwords do not match. Please verify and re-enter.', true);
      $('signUpRepeatPassword').focus();
      return;
    }

    setLoginStatus('Choose your support mascot below.', false);
    $('signUpDetailsStep').hidden = true;
    $('signUpAvatarStep').hidden = false;
    var selected = $('avatarChoices').querySelector('input[name="signUpAvatar"]:checked');
    if(selected) selected.focus();
  }

  /* --- Sign Up Submit Handler --- */
  async function handleSignUp(ev){
    ev.preventDefault();
    var email = $('signUpEmail').value.trim().toLowerCase();
    var name = $('signUpName').value.trim();
    var password = $('signUpPassword').value;
    var repeatPassword = $('signUpRepeatPassword').value;
    var selectedAvatar = $('signUpForm').querySelector('input[name="signUpAvatar"]:checked');
    var avatarId = selectedAvatar ? selectedAvatar.value : 'pip';

    if(!email || !name || !password || !repeatPassword){
      setLoginStatus('Please fill in all registration fields.', true);
      return;
    }
    if(password !== repeatPassword){
      setLoginStatus('Passwords do not match. Please verify and re-enter.', true);
      return;
    }

    setLoginStatus('Creating your ECE trainee account…', false);
    try {
      var res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name,
          password: password,
          repeatPassword: repeatPassword,
          avatarId: avatarId
        })
      });
      var data = await res.json();
      if(!res.ok){
        setLoginStatus(data.error || 'Failed to create account.', true);
        return;
      }

      loginProfile = {
        name: data.user.name,
        email: data.user.email,
        avatarId: data.user.avatarId || avatarId,
        userId: data.user.id
      };
      try {
        localStorage.setItem('ecewise:auth-profile', JSON.stringify(loginProfile));
      } catch(e){}

      completeLogin('Account registered! Welcome to the simulator.');
    } catch(e){
      setLoginStatus(e.message || 'Network error during signup.', true);
    }
  }

  /* --- Forgot Password Handlers --- */
  async function handleForgotRequest(){
    var email = $('forgotEmail').value.trim().toLowerCase();
    if(!email){
      setLoginStatus('Please enter your ECE email address.', true);
      $('forgotEmail').focus();
      return;
    }

    setLoginStatus('Generating verification code…', false);
    try {
      var res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email: email })
      });
      var data = await res.json();
      if(!res.ok){
        setLoginStatus(data.error || 'Could not find that ECE account.', true);
        return;
      }

      $('forgotStep1').hidden = true;
      $('forgotStep2').hidden = false;
      $('securityDispatchCard').hidden = false;
      $('dispatchBody').innerHTML =
        'A password reset verification code has been dispatched for <b>' + escapeHtml(email) + '</b>:<br/>' +
        'Security Code: <strong>' + escapeHtml(data.code) + '</strong> (Valid for 15 minutes)';
      $('resetCode').value = data.code;
      setLoginStatus('Verification code generated. Set your new password below.', false, true);
      $('newPassword').focus();
    } catch(e){
      setLoginStatus(e.message || 'Network error requesting reset code.', true);
    }
  }

  async function handleForgotReset(ev){
    ev.preventDefault();
    var email = $('forgotEmail').value.trim().toLowerCase();
    var code = $('resetCode').value.trim();
    var newPassword = $('newPassword').value;
    var repeatPassword = $('repeatNewPassword').value;

    if(!code || !newPassword || !repeatPassword){
      setLoginStatus('Please complete all verification and password fields.', true);
      return;
    }
    if(newPassword !== repeatPassword){
      setLoginStatus('New passwords do not match. Please verify and re-enter.', true);
      return;
    }
    if(newPassword.length < 6){
      setLoginStatus('New password must be at least 6 characters.', true);
      return;
    }

    setLoginStatus('Updating password…', false);
    try {
      var res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          email: email,
          code: code,
          newPassword: newPassword,
          repeatPassword: repeatPassword
        })
      });
      var data = await res.json();
      if(!res.ok){
        setLoginStatus(data.error || 'Failed to reset password.', true);
        return;
      }

      setAuthTab('signIn');
      $('signInEmail').value = email;
      $('signInPassword').value = '';
      $('signInPassword').focus();
      setLoginStatus('Password reset successfully! Please sign in with your new credentials.', false, true);
    } catch(e){
      setLoginStatus(e.message || 'Network error resetting password.', true);
    }
  }

  async function openHistory(silent){
    if(!silent){
      historyModal.hidden = false;
      historyDetail = null;
    }
    renderTrainerAccess();
    var cutoff = Date.now() - HISTORY_RETENTION_MS;
    var index = (readLS('session-index') || []).filter(function(item){
      return (item.updatedAt || item.createdAt || 0) >= cutoff;
    });
    writeLS('session-index', index);
    var remote = null;
    try {
      var api = '/api/sessions' + (trainerAccess ? ('?trainer=1&key=' + encodeURIComponent(TRAINER_PASSCODE)) : '');
      var res = await fetch(api);
      if(res.ok){ remote = await res.json(); }
    } catch(e){}
    var remoteArr = (remote && remote.results) ? remote.results : null;
    if(index.length === 0 && (!remoteArr || remoteArr.length === 0)){
      historyList.innerHTML = '<p class="muted">No past sessions yet.</p>';
      return;
    }
    var byId = {};
    (index || []).forEach(function(i){
      byId[i.id] = { id: i.id, ticket_id: i.ticketId, category: i.category, status: i.status, created_at: i.createdAt, updated_at: i.updatedAt, local: true, name: i.name, any: true };
    });
    (remoteArr || []).forEach(function(r){
      byId[r.id] = r;
    });
    var ids = Object.keys(byId);
    var rows = ids.map(function(k){ return byId[k]; });
    rows.sort(function(a,b){
      return ((b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0));
    });
    historyList.innerHTML = rows.length ? '' : '<p class="muted">No past sessions yet.</p>';
    rows.forEach(function(row){
      var b = document.createElement('button');
      b.className = 'history-item';
      b.type = 'button';
      var trainee = row.trainee_name || row.name || '';
      var owner = row.username ? ' <span class="hist-owner">@' + escapeHtml(row.username) + '</span>' : '';
      var meta = row.category || '';
      var isLive = row.ended === 0;
      var statusHtml = isLive
        ? '<span class="live-tag">LIVE</span>'
        : (row.status === 'ABANDONED'
          ? '<span class="status-pill" data-status="abandoned" style="font-size:10.5px;padding:1px 6px;">ABANDONED</span>'
          : '<span class="hist-status-ok">' + escapeHtml(row.status || '') + '</span>');
      b.innerHTML =
        '<strong>' + escapeHtml(row.ticket_id || row.ticketId || '') + '</strong>' +
        (trainee ? ' · <b>' + escapeHtml(trainee) + '</b>' : '') + owner +
        (isLive ? ' ' + statusHtml : '') +
        '<br><span class="muted">' + escapeHtml(meta) + ' · ' +
        new Date(row.created_at || row.createdAt).toLocaleString() + ' · ' +
        (isLive ? 'in progress' : statusHtml) + (row.local ? ' · <em>this browser</em>' : '') + '</span>';
      (function(id, isLocal, live){
        b.addEventListener('click', function(){
          viewSession(id, !isLocal, live);
        });
      })(row.id, !!row.local, isLive);
      historyList.appendChild(b);
    });
  }
  function renderTrainerAccess(){
    if(trainerAccess){
      trainerPassInput.value = '';
      trainerPassInput.placeholder = 'Trainer access is on';
      trainerPassInput.disabled = true;
      trainerPassBtn.textContent = 'Lock';
      trainerPassStatus.textContent = 'Viewing live chats from all trainees';
      trainerPassStatus.className = 'trainer-status ok';
    } else {
      trainerPassInput.disabled = false;
      trainerPassBtn.textContent = 'Unlock';
      trainerPassStatus.textContent = '';
      trainerPassStatus.className = 'trainer-status';
    }
  }
  function applyTrainerPasscode(){
    var wasUnlocked = trainerAccess;
    var entered = (trainerPassInput.value || '').trim().toLowerCase();
    if(entered === TRAINER_PASSCODE){
      trainerAccess = true;
      trainerPassStatus.textContent = 'Live chats unlocked';
      trainerPassStatus.className = 'trainer-status ok';
      openHistory();
    } else {
      trainerAccess = false;
      trainerPassStatus.textContent = entryHint(entered);
      trainerPassStatus.className = 'trainer-status';
      if(wasUnlocked) openHistory();
    }
  }
  function entryHint(v){
    if(v === '') return 'Enter the trainer passcode to view live chats.';
    return 'That passcode is not recognized.';
  }
  async function viewSession(id, preferRemote, isLive, silent){
    var requestVersion = ++historyFetchVersion;
    var data = null;
    if(preferRemote){
      try {
        var suffix = trainerAccess ? ('&trainer=1&key=' + encodeURIComponent(TRAINER_PASSCODE)) : '';
        var r = await fetch('/api/session?id=' + encodeURIComponent(id) + suffix);
        if(requestVersion !== historyFetchVersion) return;
        if(r.ok) data = await r.json();
        else if(r.status === 403 && !trainerAccess){
          trainerPassStatus.textContent = 'That chat is live — unlock with the trainer passcode to view it.';
          trainerPassStatus.className = 'trainer-status';
        }
      } catch(e){}
    }
    if(!data) data = readLS('session:' + id);
    if(!data) return;
    var snapshot = JSON.stringify(data);
    if(silent && historyDetail && historyDetail.id === id && historyDetail.snapshot === snapshot) return;
    var previousTranscript = silent ? historyList.querySelector('.history-transcript') : null;
    var previousScrollTop = previousTranscript ? previousTranscript.scrollTop : 0;
    var wasFollowingLatest = previousTranscript
      ? previousTranscript.scrollHeight - previousTranscript.scrollTop - previousTranscript.clientHeight < 40
      : false;
    historyDetail = { id: id, live: !!isLive && !data.ended, snapshot: snapshot };
    renderSessionDetail(data);
    if(silent && previousTranscript){
      var updatedTranscript = historyList.querySelector('.history-transcript');
      if(updatedTranscript){
        updatedTranscript.scrollTop = wasFollowingLatest
          ? updatedTranscript.scrollHeight
          : previousScrollTop;
      }
    }
  }
  function renderSessionDetail(data){
    var html = '<div class="history-actions">' +
      '<button class="btn btn-ghost back-btn" id="backToList">← Back</button>' +
      '<button class="btn btn-primary" id="exportBtn">Export locally</button>' +
      '</div>';
    html += '<h3>' + escapeHtml(data.ticketId || data.id || '') + '</h3>';
    if(!data.ended) html += '<p class="history-live-status"><span class="live-tag">LIVE</span> Updating automatically</p>';
    if(trainerAccess && data.traineeName){
      html += '<p class="muted trainee-contact">' +
        '<strong>Trainee:</strong> ' + escapeHtml(data.traineeName) +
        '</p>';
    }
    if(data.persona){
      html += '<p class="muted">' + escapeHtml(data.persona.issueCategory) + ' · ' + escapeHtml(data.persona.emotionalState) + '</p>';
    }
    html += '<div class="history-transcript">';
    (data.messages || []).forEach(function(m){
      if(m.role === 'audit'){
        html += '<div class="chat-audit">' + escapeHtml(m.text + ' · ' + fmtTime(m.ts)) + '</div>';
        return;
      }
      var who = (m.role === 'agent' ? 'Agent' : (data.persona ? data.persona.name : 'Customer'));
      var meta = (m.gapSec != null ? ' · +' + m.gapSec + 's wait' : '') + (m.role === 'agent' && m.wpm ? ' · ' + m.wpm + ' WPM' : '');
      html += '<div class="msg-row ' + (m.role === 'agent' ? 'from-agent' : 'from-customer') +
        '"><div class="msg-content">' + (m.role === 'agent' ? avatarMarkup(data.avatarId, 'message-avatar') : '') +
        '<div class="bubble' + (m.abandonment ? ' bubble-abandonment' : '') + '">' + escapeHtml(m.text) + '</div></div>' +
        '<div class="msg-time">' + escapeHtml(who + ' · ' + fmtTime(m.ts) + meta) + '</div></div>';
    });
    html += '</div>';
    if(data.notes){
      var n = data.notes;
      var noteParts = [
        ['Name', n.customerName], ['Email', n.email], ['Product', n.product],
        ['Recap / TS', n.recap], ['Resources', n.resources],
        ['Next Steps', n.nextSteps], ['Escalation POC', n.escalation]
      ];
      var printed = noteParts.filter(function(p){ return p[1]; })
        .map(function(p){ return '<strong>' + escapeHtml(p[0]) + ':</strong> ' + escapeHtml(p[1]); })
        .join('<br>');
      if(printed) html += '<h4>Case documentation</h4><p>' + printed + '</p>';
    }
    if(data.feedback){
      html += '<h4>Coaching notes</h4><p>' + escapeHtml(data.feedback) + '</p>';
    }
    if(data.coachingPoints){
      html += '<h4>Post-drill coaching points</h4><p>' + escapeHtml(data.coachingPoints) + '</p>';
    }
    if(data.avgWpm){
      html += '<p class="muted">Average typing speed: ' + data.avgWpm + ' WPM</p>';
    }
    historyList.innerHTML = html;
    var transcriptView = historyList.querySelector('.history-transcript');
    if(transcriptView && !data.ended) transcriptView.scrollTop = transcriptView.scrollHeight;
    $('backToList').addEventListener('click', function(){ historyDetail = null; openHistory(); });
    $('exportBtn').addEventListener('click', function(){ downloadSession(data); });
  }
  function downloadSession(data){
    var lines = [];
    lines.push('ECEWise — training session export');
    lines.push('Ticket: ' + (data.ticketId || data.id || ''));
    if(data.createdAt) lines.push('Started: ' + new Date(data.createdAt).toLocaleString());
    lines.push('Status: ' + (data.status || ''));
    if(data.traineeName) lines.push('Trainee: ' + data.traineeName);
    if(data.lob) lines.push('LOB: ' + data.lob);
    if(data.persona){
      lines.push('Category: ' + data.persona.issueCategory);
      lines.push('Customer mood: ' + data.persona.emotionalState);
      lines.push('Fictional customer: ' + data.persona.name + ' · Email: ' + (data.persona.email || '') +
        ' · Phone: ' + (data.persona.phone || '') + ' · Address: ' + (data.persona.shippingAddress || ''));
      lines.push('Product: ' + data.persona.product + ' · MAC: ' + (data.persona.macAddress || '') +
        ' · Order: ' + (data.persona.orderNumber || '') + ' · Serial: ' + (data.persona.serialNumber || ''));
    }
    lines.push('');
    lines.push('=== Transcript ===');
    (data.messages || []).forEach(function(m){
      if(m.role === 'audit'){
        lines.push('[History] [' + fmtTime(m.ts) + ']: ' + m.text);
        return;
      }
      var who = (m.role === 'agent' ? 'Agent' : (data.persona ? data.persona.name : 'Customer'));
      var meta = ' [' + fmtTime(m.ts) + ']' + (m.gapSec != null ? ' (+' + m.gapSec + 's wait)' : '') + (m.role === 'agent' && m.wpm ? ' [' + m.wpm + ' WPM]' : '');
      lines.push(who + meta + ': ' + m.text);
    });
    if(data.notes){
      lines.push('');
      lines.push('=== Case documentation ===');
      [['Name', data.notes.customerName], ['Email', data.notes.email], ['Product', data.notes.product],
       ['Recap / TS', data.notes.recap], ['Resources', data.notes.resources],
       ['Next Steps', data.notes.nextSteps], ['Escalation POC', data.notes.escalation]].forEach(function(p){
        if(p[1]) lines.push(p[0] + ': ' + p[1]);
      });
    }
    if(data.feedback){
      lines.push('');
      lines.push('=== Coaching notes ===');
      lines.push(data.feedback);
    }
    if(data.coachingPoints){
      lines.push('');
      lines.push('=== Post-drill coaching points ===');
      lines.push(data.coachingPoints);
    }
    if(data.avgWpm){
      lines.push('');
      lines.push('Average typing speed: ' + data.avgWpm + ' WPM');
    }
    var text = lines.join('\n');
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ecewise-' + (data.ticketId || data.id || 'session') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  /* ---------- Toggle popups / tabs ---------- */
  function setTwoChats(on){
    twoChats = on;
    ensureSlots();
    renderTabs();
    renderPersonaBar();
    renderMessages();
    refreshControls();
    updateCaseLabel();
    saveSettings();
  }
  function setCaseOpen(open){
    caseOpen = open;
    casePane.hidden = !open;
    if(open) updateCaseLabel();
  }
  function openCase(){ setCaseOpen(true); }
  function closeCaseFn(){ setCaseOpen(false); }

  /* ---------- Reply timer & Abandonment ---------- */
  function promisedHoldSeconds(text){
    var value = String(text || '');
    var lower = value.toLowerCase();
    var holdIntent = /\b(?:please\s+)?hold(?:\s+on|\s+tight|\s+for)?\b|\bwait(?:\s+here|\s+for|\s+a\s+moment)?\b|\bbear\s+with\s+me\b|\b(?:i'll|i will)\s+be\s+(?:right\s+)?back\b|\bback\s+in\b/i.test(value);
    var durationMatch = lower.match(/\b((?:a\s+)?(?:couple|few|several)|\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:(?:of|more)\s+)?(seconds?|secs?|minutes?|mins?|hours?|hrs?|moments?)\b/);
    var timedCommitment = durationMatch && /\b(?:i'll|i will|it'll|it will|this will|let me|give me|allow(?: me)?|need|take|may i|can i|please|should)\b/i.test(value);
    if(!holdIntent && !timedCommitment) return null;
    if(!durationMatch) return 180;
    var amountText = durationMatch[1];
    var amounts = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, 'a couple':2, couple:2, 'a few':3, few:3, 'a several':5, several:5 };
    var amount = amounts[amountText] || Number(amountText) || 1;
    var unit = durationMatch[2];
    var seconds = /hour|hr/.test(unit) ? amount * 3600 :
      (/second|sec/.test(unit) ? amount : (/moment/.test(unit) ? amount * 60 : amount * 60));
    return Math.min(86400, Math.max(1, seconds));
  }

  function lastAgentActivityTs(s){
    for(var i = s.messages.length - 1; i >= 0; i--){
      if(s.messages[i].role === 'agent') return s.messages[i].ts;
    }
    if(s.messages.length > 0 && s.messages[0].ts) return s.messages[0].ts;
    return s.createdAt || null;
  }

  function customerAbandonOutburst(s, now, waitedSeconds){
    var outburst = ABANDON_OUTBURSTS[Math.floor(Math.random() * ABANDON_OUTBURSTS.length)];
    s.holdDeadline = null;
    s.holdMinutes = null;
    s.abandoned = true;
    s.status = 'ABANDONED';
    s.ended = true;

    // 1. Customer bursts negative impression and leaves
    s.messages.push({
      role: 'customer',
      text: outburst,
      ts: now,
      gapSec: waitedSeconds,
      abandonment: true
    });

    // 2. Chat is automatically queued to end (audit entry appended)
    s.messages.push({
      role: 'audit',
      text: 'Chat closed: Customer abandoned the chat due to 7 minutes of agent inactivity.',
      ts: now + 50
    });

    if(s === state){
      endBtn.textContent = 'Ended (Abandoned)';
      endBtn.dataset.ended = 'true';
      refreshControls();
      renderMessages();
      renderPersonaBar();
    }

    scheduleSave(s);
    pushServerSession(s);

    // Trigger auto QA review evaluating inactivity and abandonment
    triggerAutoAbandonmentReview(s);
  }

  async function triggerAutoAbandonmentReview(s){
    var avg = avgWpmValue(s);
    s.avgWpm = avg;
    if(s === state){
      avgWpmBox.hidden = false;
      avgWpmVal.textContent = avg ? avg + ' WPM' : '— (abandoned before completion)';
    }

    var p = s.persona;
    if(!p) return;
    var memory = await memoryNote((s.traineeName || fTraineeName.value || '').trim());
    var transcript = s.messages.map(function(m){
      return (m.role === 'audit' ? '[History]' : (m.role === 'agent' ? 'Agent' : 'Customer')) + ': ' + m.text;
    }).join('\n');

    var system = [
      "You are a QA coach for a BPO contact-center team that handles live chat support for Wyze.",
      memory ? memory : '',
      "A customer just abandoned the chat after 7 minutes of total silence / no response from the trainee.",
      "Produce a concise, constructive post-conversation review in plain text (no markdown headers, no asterisks).",
      "Structure the response with these short sections, each 1-3 sentences:",
      "Strengths: (note any earlier positives if present, or acknowledge the drill attempt)",
      "Areas to improve: (focus on responsiveness, hold management, and customer empathy)",
      "SOP / verification gaps: (call out the 7-minute inactivity threshold breach and lack of check-in/updates)",
      "Overall rating (select from: Needs work / Developing / Solid / Excellent — note that 7-minute customer abandonment is typically Needs work):",
      "Keep the whole thing under 220 words."
    ].filter(function(x){ return x !== ''; }).join('\n');

    var userMsg = [
      "Trainee Name: " + (s.traineeName || fTraineeName.value.trim() || 'Not provided'),
      "LOB: " + (s.lob || fLob.value.trim() || 'Not provided'),
      "Average typing speed: " + (avg === null ? 'not measured' : avg + ' WPM'),
      "Final conversation status: ABANDONED (Customer left after 7 minutes without an agent reply)",
      "",
      "Ground truth persona: " + JSON.stringify({ name:p.name, product:p.product, issueCategory:p.issueCategory, macAddress:p.macAddress, hiddenSummary:p.hiddenSummary }),
      "",
      "Full transcript:",
      transcript,
      "",
      "Provide the abandonment QA coaching review now."
    ].join('\n');

    try {
      var raw = await runModel(
        [{ role: "system", content: system }, { role: "user", content: userMsg }]
      );
      s.coachingPoints = raw;
      if(s === state){
        coachingContent.textContent = raw;
        coachingBox.hidden = false;
      }
      scheduleSave(s);
      pushServerSession(s);
    } catch(e){
      // Non-fatal background review
    }
  }

  function customerWaitFollowUp(s, now){
    if(currentSimMode === 'email') return; // Email simulation is asynchronous; 7m live outburst applies only to live chat
    if(!s.persona || s.ended || s.busy || s.status === 'RESOLVED' || s.status === 'ABANDONED' || !s.messages.length) return;
    var last = s.messages[s.messages.length - 1];

    // Check 7-minute total inactivity outburst first
    var waitStart = lastAgentActivityTs(s);
    if(waitStart != null && (now - waitStart) >= ABANDON_TIMEOUT_MS && !s.abandoned && !s.ended){
      customerAbandonOutburst(s, now, Math.round((now - waitStart) / 1000));
      return;
    }

    // If agent already responded, customer isn't waiting for a gentle check-in
    if(last.role !== 'customer' || last.autoFollowUp || s.gentleCheckInSent) return;

    var promised = s.holdDeadline != null;
    var deadline = promised ? s.holdDeadline : last.ts + 180000;
    if(now < deadline) return;

    var waitStartedAt = promised
      ? deadline - Math.round((s.holdMinutes || 3) * 60000)
      : last.ts;
    var waitedSeconds = Math.max(0, Math.floor((now - waitStartedAt) / 1000));
    var text;
    if(promised){
      var minutes = s.holdMinutes || 3;
      var duration = minutes < 1 ? 'a moment' : (minutes < 1.5 ? 'about a minute' : 'about ' + Math.round(minutes) + ' minutes');
      var promisedReplies = [
        'Hi, I was expecting to hear back after ' + duration + '. I am still waiting—could you let me know what is happening?',
        'I am still here. You mentioned ' + duration + ', and I do need help getting this sorted. Is there an update?',
        'Just checking back in. It has been longer than ' + duration + '. Could you tell me if you are still checking on this?'
      ];
      text = promisedReplies[Math.floor(Math.random() * promisedReplies.length)];
    } else {
      var idleReplies = [
        'Hi, I am still here. Could you let me know if you are still working on this? I would really like to get it resolved.',
        'Just checking that the chat did not disconnect. I am still waiting for help with this.',
        'Hello? It has been a few minutes—are you still there? I would appreciate an update.'
      ];
      text = idleReplies[Math.floor(Math.random() * idleReplies.length)];
    }

    s.holdDeadline = null;
    s.holdMinutes = null;
    s.gentleCheckInSent = true;
    s.messages.push({
      role: 'customer',
      text: text,
      ts: now,
      gapSec: waitedSeconds,
      autoFollowUp: true
    });
    if(s === state) renderMessages();
    scheduleSave(s);
    pushServerSession(s);
  }

  function updateCustomerFollowUps(){
    var now = Date.now();
    sessions.forEach(function(session){ customerWaitFollowUp(session, now); });
  }

  function updateReplyTimer(){
    if(!timerOn){
      replyTimer.hidden = true;
      return;
    }
    replyTimer.hidden = false;
    var pending = state.persona && !state.ended &&
      state.messages.length > 0 && state.messages[state.messages.length - 1].role === 'customer';
    if(!pending){
      replyTimer.classList.remove('timer-warn','timer-danger');
      replyTimerClock.textContent = '—';
      return;
    }
    var lastTs = state.holdDeadline != null
      ? state.holdDeadline - Math.round((state.holdMinutes || 3) * 60000)
      : state.messages[state.messages.length - 1].ts;
    var sec = Math.max(0, Math.floor((Date.now() - lastTs) / 1000));
    var mm = Math.floor(sec / 60);
    var ss = sec % 60;
    replyTimerClock.textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
    replyTimer.classList.remove('timer-warn','timer-danger');
    if(state.holdDeadline == null || Date.now() >= state.holdDeadline){
      if(sec > TIMER_DANGER) replyTimer.classList.add('timer-danger');
      else if(sec > TIMER_WARN) replyTimer.classList.add('timer-warn');
    }
  }

  /* ---------- Scenario start ---------- */
  async function startScenario(){
    var s = state;
    clearError();
    setBusy(true, s);
    chatLog.innerHTML = '<div class="loading-state">Connecting a new customer…</div>';
    statusPill.hidden = true;
    feedbackBox.hidden = true;
    s.feedback = null;
    s.typeStart = null;
    speedBar.hidden = false;
    updateSpeedUI();
    var category = CATEGORY_LABELS[categorySelect.value];
    var emotion = EMOTION_LABELS[emotionSelect.value];

    s.ended = false;
    s.abandoned = false;
    s.gentleCheckInSent = false;
    s.holdDeadline = null;
    s.holdMinutes = null;
    s.avgWpm = null;
    s.coachingPoints = null;
    if(s === state){
      endBtn.textContent = 'End conversation';
      delete endBtn.dataset.ended;
      coachingBox.hidden = true;
      avgWpmBox.hidden = true;
    }

    var system = [
      "You generate one fictional customer persona and an opening live-chat message for a customer-support training simulator.",
      "The simulator is used by an outsourced (BPO) support team that handles live chat for Wyze, a smart-home device brand (cameras, video doorbells, sensors, locks, plugs, robot vacuums, etc.).",
      "",
      "Hard rules:",
      "- Every personal detail you invent (name, email, phone, MAC address, order number) must be fictional. Never use a real person's information.",
      "- Make the whole persona unmistakably synthetic. Use an email at example.invalid, a fictional phone in the reserved 202-555-01xx range, and a locally administered MAC beginning 02:.",
      "- Use a deliberately fictional shipping address such as a numbered Example Lane in Sampleville, ZZ 00000. Do not use an existing street or real postal address.",
      "- Use a clearly marked test order number and serial number (for example, prefix with TEST-).",
      "- Names should vary broadly. Do not reuse any name in this list, and do not default to common repeated names:",
      usedCustomerNamesLabel(),
      "",
      "Scenario type to use: " + category,
      "Emotional tone to use: " + emotion,
      "",
      "Pick ONE specific, real-sounding Wyze product that fits the scenario, from this full product catalog. Spread across ALL of these families broadly over time — do not keep defaulting to the same family (e.g. don't always reach for indoor video cameras):",
      WYZE_CATALOG,
      "",
      "Products already used earlier in this practice session — AVOID reusing the exact same model/version of any of these, and prefer a different family where another product fits the scenario just as well:",
      usedProductsLabel(),
      "",
      "Diversity rules:",
      "- If the customer's issue could involve any one of several products, vary which one you pick so repeats don't happen.",
      "- Never return the exact same model + version (e.g. Wyze Cam v3, Wyze Thermostat) that the used list shows, unless literally no other product fits the scenario.",
      "- Invent a specific, concrete issue for that specific product rather than a vague one, and choose the version that plausibly matches the issue (e.g. a battery-drain concern on a battery cam, a Cam Plus feature on a subscription product).",
      "Write the opening message the way a real person types into a live chat: natural, not overly formal, length and tone matching the emotional state. Describe only the issue; do not put the customer's name, email, phone, address, MAC, order or serial number in the opening message.",
      "",
      "hiddenSummary is for the trainer only: 2-4 sentences on the real root cause and the ideal resolution / verification steps an agent should follow.",
      "resolutionSteps is an ordered array of the EXACT steps, in the right order, that a Wyze agent must perform to resolve this issue (account verification, the specific troubleshooting steps, confirmation of the fix). These are the ground truth for judging whether the trainee actually resolves the case.",
      "Respond ONLY with JSON matching the requested schema. Do not use markdown."
    ].join('\n');

    var schema = {
      type: "object",
      properties: {
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
      },
      required: ["name","email","phone","shippingAddress","product","macAddress","orderNumber","serialNumber","purchaseDate","issueCategory","emotionalState","hiddenSummary","openingMessage","resolutionSteps"],
      additionalProperties: false
    };

    try {
      var raw = await runModel(
        [{ role: "system", content: system }, { role: "user", content: "Generate the persona and opening message now." }],
        { schema: schema }
      );
      var persona = JSON.parse(raw);
      persona.name = makeUnusedCustomerName();
      makeFakeCustomerDetails(persona);
      recordUniqueCustomerName(persona.name);
      s.persona = persona;
      recordUsedProduct(persona);
      s.sessionId = genId('sess');
      s.ticketId = genTicketId();
      s.createdAt = Date.now();
      s.status = 'OPEN';
      s.messages = [{ role: 'customer', text: persona.openingMessage, ts: Date.now(), gapSec: null }];
      s.feedback = null;
      s.avgWpm = null;
      s.coachingPoints = null;
      Object.keys(s.notes).forEach(function(k){ s.notes[k] = ''; });
      s.traineeName = loginProfile ? loginProfile.name : '';
      s.lob = '';
      if(s === state){
        if(emailPendingBanner) emailPendingBanner.hidden = true;
        clearCaseFields();
        updateEmailHeaderInfo();
        renderPersonaBar();
        renderMessages();
        renderTabs();
        renderAnswerKey();
        renderFeedback();
        updateCaseLabel();
      }
      scheduleSave(s);
      pushServerSession(s);
    } catch(e){
      if(s === state){
        chatLog.innerHTML = '';
        chatLog.appendChild(emptyState);
      }
      showError(e.message || 'Something went wrong starting the scenario.', startScenario);
    } finally {
      setBusy(false, s);
    }
  }

  /* ---------- Chat turn ---------- */
  function buildChatSystemPrompt(s){
    var p = s.persona;
    var isEmail = currentSimMode === 'email';
    return [
      "You are roleplaying as a customer named " + p.name + " reaching out to support for Wyze, a smart-home device brand.",
      "Stay fully in character. Never mention you are an AI, a model, or a simulation, and never write the agent's lines.",
      "",
      "CRITICAL PERSONA INSTRUCTION - ZERO TECHNICAL KNOWLEDGE:",
      "- You are an ordinary everyday customer who bought a Wyze product for home use. You have ZERO technical, networking, or engineering knowledge.",
      "- You do NOT understand network subnets, IP protocols, DNS, 2.4GHz vs 5.0GHz frequency bands (unless the agent explains it in plain child-simple terms), hardware registers, or firmware partitions.",
      "- You only describe plain visual and sensory symptoms: what color a light is blinking (e.g. 'the light on front is solid yellow', 'it flashes blue twice then stops'), sounds, physical camera location, or error messages directly shown in the Wyze app (e.g. 'it says Error code -90 connection timed out').",
      "- If the agent gives you complicated technical instructions without explaining them simply, act confused and ask for clarification like a regular person ('I am not very good with tech, where do I find that?' or 'What does that mean?').",
      "",
      "SIMULATION CHANNEL & FORMAT: " + (isEmail ? "EMAIL SUPPORT TICKET" : "LIVE CHAT SUPPORT") + ".",
      (isEmail ?
        "- When replying by email, you do NOT need a formal letter format or corporate email greeting/signature. Real customers write emails casually, quickly from their phone ('Still not working. Sent from my iPhone'), or in short unstructured paragraphs. Write naturally however a customer would." :
        "- When in live chat, reply concisely and directly like someone typing in a live chat window."),
      "",
      "Your full persona is fictional practice data. Reveal a specific fact only if the agent asks for that fact; otherwise do not volunteer personal details:",
      "Name: " + p.name,
      "Email: " + p.email,
      "Phone: " + p.phone,
      "Shipping address: " + p.shippingAddress,
      "Product: " + p.product,
      "MAC address: " + p.macAddress,
      "Order number: " + p.orderNumber,
      "Serial number: " + p.serialNumber,
      "Purchase date: " + p.purchaseDate,
      "Underlying issue: " + p.issueCategory,
      "",
      "You already opened the inquiry with this message: \"" + p.openingMessage + "\"",
      "",
      "Starting emotional state: " + p.emotionalState + ".",
      "Let your tone shift naturally: become more frustrated if the agent is dismissive or makes no progress; calm down as they listen and help. Show strong frustration only when warranted, with occasional CAPS or an exclamation point. Do not use profanity, insults, or explicit language.",
      "",
      "The real cause and an ideal resolution are included for your consistency, not as a checklist to enforce mechanically:",
      p.resolutionSteps ? p.resolutionSteps.map(function(st, i){ return (i + 1) + ". " + st; }).join('\n') : ('(expected idea): ' + p.hiddenSummary),
      "",
      "Conversation behavior:",
      "- Respond to what the agent just said. Recognize their question or instruction and answer it directly; use all earlier messages so you never ask again for information already given.",
      "- Be a cooperative customer. Follow safe, reasonable troubleshooting instructions one at a time and describe what you see or what happened. If an instruction fixes the issue, acknowledge the fix and let the conversation resolve naturally.",
      "- If the agent asks for a name, email, phone, address, order number, MAC, serial number, or another reasonable verification detail, promptly provide the matching fictional practice detail. Never claim you are uncomfortable sharing it in chat, refuse, stall, or ask to use another channel.",
      "- If the agent broadly asks you to verify your account, give your fictional name and email without asking which field they need. For device verification, give the fictional MAC or serial; for a shipping case, give the fictional address or order number as relevant.",
      "- When the agent asks for a reasonable customer detail that is not listed in the persona, make up a clearly fictional TEST value that fits the request, remember it, and continue cooperating. Never use or imply real personal information.",
      "- Follow the trainee's lead. Answer their latest question or instruction directly, including when they change troubleshooting direction; don't insist on a fixed script.",
      "- Do not loop, repeat the opening complaint, demand that the agent discover a particular step, or create new obstacles after a reasonable resolution.",
      "- The ideal resolution steps are guidance for your understanding, not a required order. Do not claim a reasonable alternative failed or tell the agent a step was skipped when the issue is progressing.",
      "- Do not coach the agent, tell them what to do next, mention SOPs, or suggest troubleshooting steps. Ask for help or clarification only when a customer naturally would.",
      "- Share requested persona details accurately when asked. If a request is unclear, ask one brief customer-style clarification. If an action is impossible, explain that plainly and stay engaged.",
      "- Keep status OPEN while the issue remains, use ESCALATED only when the agent explicitly escalates, and use RESOLVED when the agent's actions plausibly fix the issue or the conversation naturally concludes.",
      "",
      "Respond ONLY with JSON: one field \"message\" with your reply, and one field \"status\" set to exactly one of OPEN, ESCALATED, or RESOLVED reflecting the issue's state after this exchange."
    ].join('\n');
  }

  function repairInfoRefusal(message, agentText, persona){
    if(!/(?:not comfortable|uncomfortable|prefer not to|prefer to keep|rather not|rather keep|privacy concern|(?:won't|will not|can't|cannot|don't|do not) (?:share|provide|give)|keep (?:that|my|this) (?:private|to myself))/i.test(message || '')) return message;
    var ask = String(agentText || '').toLowerCase();
    var details = [];
    if(/\b(name|who are you|account holder)\b/.test(ask)) details.push('my name is ' + persona.name);
    if(/\b(e-?mail)\b/.test(ask)) details.push('my email is ' + persona.email);
    if(/\b(phone|telephone|number to reach)\b/.test(ask)) details.push('my phone number is ' + persona.phone);
    if(/\b(address|shipping|mailing|billing|postal|zip)\b/.test(ask)) details.push('my shipping address is ' + persona.shippingAddress);
    if(/\b(mac|device id|hardware address)\b/.test(ask)) details.push('the device MAC is ' + persona.macAddress);
    if(/\b(order|tracking|rma|purchase number)\b/.test(ask)) details.push('the order number is ' + persona.orderNumber);
    if(/\b(serial|s\/n)\b/.test(ask)) details.push('the serial number is ' + persona.serialNumber);
    if(!details.length && /\b(account|information|details|verify|verification|confirm)\b/.test(ask)) {
      details.push('my name is ' + persona.name, 'my email is ' + persona.email);
    }
    if(!details.length) return message;
    return 'Sure — ' + details.join(', ') + '.';
  }

  function lastCustomerTs(s){
    for(var i = s.messages.length - 1; i >= 0; i--){
      if(s.messages[i].role === 'customer') return s.messages[i].ts;
    }
    return null;
  }

  var pendingEmailResolve = null;

  async function sendAgentMessage(text, wpm, s){
    s = s || state;
    clearError();
    var isEmail = currentSimMode === 'email';
    var prevTs = lastCustomerTs(s);
    var agentTs = Date.now();
    var gapSec = prevTs != null ? Math.max(0, Math.round((agentTs - prevTs) / 1000)) : null;
    var holdSeconds = promisedHoldSeconds(text);
    s.holdDeadline = holdSeconds == null ? null : agentTs + holdSeconds * 1000;
    s.holdMinutes = holdSeconds == null ? null : holdSeconds / 60;
    s.gentleCheckInSent = false;
    s.abandoned = false;
    s.messages.push({ role: 'agent', text: text, ts: agentTs, wpm: isEmail ? null : (wpm || null), gapSec: gapSec });
    if(s === state){ renderMessages(); if(!isEmail) updateSpeedUI(); }
    scheduleSave(s);
    pushServerSession(s);
    setBusy(true, s);

    // Email simulation: calculate random customer response time between Min and Max minutes
    var waitMins = 0;
    var simulatedArrivalTs = agentTs;
    if(isEmail){
      var minM = parseInt(emailMinMins ? emailMinMins.value : 30, 10) || 30;
      var maxM = parseInt(emailMaxMins ? emailMaxMins.value : 120, 10) || 120;
      if(minM > maxM){ var swap = minM; minM = maxM; maxM = swap; }
      minM = Math.max(15, minM);
      maxM = Math.min(240, maxM);
      waitMins = Math.floor(minM + Math.random() * (maxM - minM + 1));
      simulatedArrivalTs = agentTs + (waitMins * 60 * 1000);
      emailPendingArrival = simulatedArrivalTs;
      if(emailPendingBanner){
        emailPendingBanner.hidden = false;
        if(emailPendingMins) emailPendingMins.textContent = waitMins + ' minutes';
        if(emailClockStamp) emailClockStamp.textContent = fmtTime(simulatedArrivalTs);
      }
    }

    var history = s.messages.slice(1).filter(function(m){
      return m.role === 'agent' || m.role === 'customer';
    }).map(function(m){
      return { role: m.role === 'agent' ? 'user' : 'assistant', content: m.text };
    });

    var schema = {
      type: "object",
      properties: {
        message: { type: "string" },
        status: { type: "string", enum: ["OPEN","ESCALATED","RESOLVED"] }
      },
      required: ["message","status"],
      additionalProperties: false
    };

    try {
      var raw = await runModel(
        [{ role: "system", content: buildChatSystemPrompt(s) }].concat(history),
        { schema: schema }
      );
      var parsed = JSON.parse(raw);
      if(!parsed || typeof parsed.message !== 'string' || !parsed.message.trim()){
        throw new Error("The customer didn't respond — try sending again.");
      }
      parsed.message = repairInfoRefusal(parsed.message, text, s.persona);
      if(parsed && parsed.status) s.status = parsed.status;

      if(isEmail){
        if(emailPendingBanner) emailPendingBanner.hidden = true;
        var emailCustTs = simulatedArrivalTs;
        var emailGap = waitMins * 60;
        s.messages.push({
          role: 'audit',
          text: '⏩ Time advanced +' + waitMins + 'm · Customer email reply received',
          ts: emailCustTs - 1000
        });
        s.messages.push({ role: 'customer', text: parsed.message, ts: emailCustTs, gapSec: emailGap });
      } else {
        var custTs = Date.now();
        var agentPrevTs = null;
        for(var i = s.messages.length - 1; i >= 0; i--){ if(s.messages[i].role === 'agent'){ agentPrevTs = s.messages[i].ts; break; } }
        var custGap = agentPrevTs != null ? Math.max(0, Math.round((custTs - agentPrevTs) / 1000)) : null;
        s.messages.push({ role: 'customer', text: parsed.message, ts: custTs, gapSec: custGap });
      }

      if(s === state){ renderMessages(); renderPersonaBar(); }
      scheduleSave(s);
      pushServerSession(s);
    } catch(e){
      if(isEmail && emailPendingBanner) emailPendingBanner.hidden = true;
      s.messages.pop();
      if(s === state) renderMessages();
      showError(e.message || "The customer didn't respond — try sending again.", function(){ sendAgentMessage(text, wpm, s); });
    } finally {
      setBusy(false, s);
    }
  }

  /* ---------- AI memory ---------- */
  async function memoryNote(traineeName){
    var name = (traineeName || '').trim();
    if(!name) return '';
    try {
      var r = await fetch('/api/memory?trainee=' + encodeURIComponent(name));
      if(!r.ok) return '';
      var j = await r.json();
      var arr = (j && j.results) || [];
      if(arr.length === 0) return '';
      var lines = arr.map(function(m, i){
        var full = (m.coachingPoints || m.feedback || '');
        var snippet = full.toString();
        if(snippet.length > 260) snippet = snippet.slice(0, 260) + '…';
        return 'Session ' + (i + 1) + ' (' + (m.category || 'unknown category') + ', final outcome: ' + (m.finalStatus || m.status || '?') + '): ' + snippet;
      });
      return 'Memory of this trainee\'s previous completed sessions — use it to be consistent with past coaching, acknowledge genuine improvement, and call out repeated mistakes:\n' +
        lines.join('\n');
    } catch(e){ return ''; }
  }

  /* ---------- Coaching feedback ---------- */
  async function getFeedback(){
    var s = state;
    clearError();
    setBusy(true, s);
    var p = s.persona;
    var memory = await memoryNote(fTraineeName.value.trim());
    var transcript = s.messages.map(function(m){
      return (m.role === 'audit' ? '[History]' : (m.role === 'agent' ? 'Agent' : 'Customer')) + ': ' + m.text;
    }).join('\n');
    var system = [
      "You are a QA coach for a BPO contact-center team that handles live chat support for Wyze.",
      memory ? memory : '',
      "You will be shown a training transcript between a trainee agent and a simulated customer, plus the ground-truth persona info used to build the simulation.",
      "Give concise, constructive coaching feedback in plain text (no markdown headers, no asterisks): a short line on what the trainee did well, a short line on what to improve (verification steps, empathy, clarity, troubleshooting accuracy, SOP adherence), and a brief overall rating from: Needs work / Developing / Solid / Excellent.",
      "Keep the whole thing under 180 words."
    ].filter(function(x){ return x !== ''; }).join('\n');
    var userMsg = [
      "Ground truth persona: " + JSON.stringify({ name:p.name, product:p.product, issueCategory:p.issueCategory, macAddress:p.macAddress, hiddenSummary:p.hiddenSummary }),
      "",
      "Transcript:",
      transcript,
      "",
      "Please give your coaching feedback now."
    ].join('\n');
    try {
      var raw = await runModel(
        [{ role: "system", content: system }, { role: "user", content: userMsg }]
      );
      s.feedback = raw;
      if(s === state) renderFeedback();
      scheduleSave(s);
    } catch(e){
      showError(e.message || 'Could not generate feedback.', getFeedback);
    } finally {
      setBusy(false, s);
    }
  }

  function avgWpmValue(s){
    var wpms = (s.messages || []).filter(function(m){ return m.role === 'agent' && m.wpm; }).map(function(m){ return m.wpm; });
    if(wpms.length === 0) return null;
    return Math.round(wpms.reduce(function(a,b){ return a+b; }, 0) / wpms.length);
  }

  async function endConversation(){
    var s = state;
    if(s.ended || s.busy || !s.persona) return;
    clearError();
    s.ended = true;
    setBusy(true, s);
    if(s === state){
      endBtn.textContent = 'Ended';
      endBtn.dataset.ended = 'true';
    }

    var avg = avgWpmValue(s);
    s.avgWpm = avg;
    if(s === state){
      avgWpmBox.hidden = false;
      avgWpmVal.textContent = avg ? avg + ' WPM' : '— (no timed replies)';
    }

    var p = s.persona;
    var memory = await memoryNote(fTraineeName.value.trim());
    var transcript = s.messages.map(function(m){
      return (m.role === 'audit' ? '[History]' : (m.role === 'agent' ? 'Agent' : 'Customer')) + ': ' + m.text;
    }).join('\n');
    var system = [
      "You are a QA coach for a BPO contact-center team that handles live chat support for Wyze.",
      memory ? memory : '',
      "A trainee just finished a simulated support conversation. Produce a concise, constructive post-conversation review in plain text (no markdown headers, no asterisks).",
      "Structure the response with these short sections, each 1-3 sentences:",
      "Strengths:",
      "Areas to improve:",
      "SOP / verification gaps:",
      "Overall rating (one of Needs work / Developing / Solid / Excellent):",
      "Keep the whole thing under 220 words."
    ].filter(function(x){ return x !== ''; }).join('\n');
    var userMsg = [
      "Trainee Name: " + (fTraineeName.value.trim() || 'Not provided'),
      "LOB: " + (fLob.value.trim() || 'Not provided'),
      "Average typing speed: " + (avg === null ? 'not measured' : avg + ' WPM'),
      "Final conversation status: " + s.status,
      "",
      "Ground truth persona: " + JSON.stringify({ name:p.name, product:p.product, issueCategory:p.issueCategory, macAddress:p.macAddress, hiddenSummary:p.hiddenSummary }),
      "",
      "Full transcript:",
      transcript,
      "",
      "Provide the post-conversation coaching review now."
    ].join('\n');
    try {
      var raw = await runModel(
        [{ role: "system", content: system }, { role: "user", content: userMsg }]
      );
      s.coachingPoints = raw;
      if(s === state){
        coachingContent.textContent = raw;
        coachingBox.hidden = false;
      }
      scheduleSave(s);
      pushServerSession(s);
    } catch(e){
      showError(e.message || 'Could not generate coaching points.', endConversation);
      s.ended = false;
      if(s === state){
        endBtn.textContent = 'End conversation';
        delete endBtn.dataset.ended;
      }
    } finally {
      setBusy(false, s);
    }
  }

  async function clearConversation(){
    var archived = state;
    if(!archived.persona || archived.busy || archived.ended) return;
    captureNotes();
    archived.messages.push({
      role: 'audit',
      text: 'Trainee used Clear chat. The full conversation was archived; a new customer is required to continue.',
      ts: Date.now()
    });
    archived.ended = true;
    archived.cleared = true;
    archived.status = 'CLEARED';
    archived.avgWpm = avgWpmValue(archived);
    saveLocalSession(archived);
    saveLiveSessions();
    pushServerSession(archived);

    sessions[activeIndex] = newSession();
    state = sessions[activeIndex];
    saveLiveSessions();
    agentInput.value = '';
    clearCaseFields();
    renderTabs();
    renderPersonaBar();
    renderMessages();
    renderFeedback();
    renderAnswerKey();
    coachingBox.hidden = true;
    avgWpmBox.hidden = true;
    endBtn.textContent = 'End conversation';
    delete endBtn.dataset.ended;
    updateCaseLabel();
    refreshControls();
    updateSpeedUI();
    updateReplyTimer();
  }

  /* Toolbar and General Event Listeners */
  newScenarioBtn.addEventListener('click', startScenario);
  clearChatBtn.addEventListener('click', clearConversation);
  chatForm.addEventListener('submit', function(ev){
    ev.preventDefault();
    var text = agentInput.value.trim();
    if(!text || state.busy || !state.persona) return;
    var sentWpm = state.typeStart ? wpmFrom(agentInput.value.length, state.typeStart) : null;
    agentInput.value = '';
    state.typeStart = null;
    updateSpeedUI();
    sendAgentMessage(text, sentWpm);
  });
  agentInput.addEventListener('input', function(){
    if(!state.typeStart && agentInput.value) state.typeStart = Date.now();
    updateSpeedUI();
  });
  agentInput.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter' && !ev.shiftKey){
      ev.preventDefault();
      chatForm.requestSubmit();
    }
  });
  feedbackBtn.addEventListener('click', getFeedback);
  trainerModeToggle.addEventListener('change', function(){
    trainerMode = trainerModeToggle.checked;
    renderAnswerKey();
    saveSettings();
  });
  twoChatsToggle.addEventListener('change', function(){
    setTwoChats(twoChatsToggle.checked);
  });
  timerToggle.addEventListener('change', function(){
    timerOn = timerToggle.checked;
    replyTimer.hidden = !timerOn;
    updateReplyTimer();
    saveSettings();
  });
  if(themeSelect){
    themeSelect.addEventListener('change', function(){
      applyTheme(themeSelect.value);
      saveSettings();
    });
  }
  caseBtn.addEventListener('click', openCase);
  closeCase.addEventListener('click', closeCaseFn);
  Object.keys(caseFields).forEach(function(k){ caseFields[k].addEventListener('input', scheduleSave); });
  endBtn.addEventListener('click', endConversation);
  [fTraineeName, fLob].forEach(function(el){
    el.addEventListener('input', recordTraineeSummary);
  });
  retryBtn.addEventListener('click', function(){
    var fn = lastFailedAction;
    clearError();
    if(fn) fn();
  });
  historyBtn.addEventListener('click', function(){ openHistory(); });
  trainerPassBtn.addEventListener('click', applyTrainerPasscode);
  trainerPassInput.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter') applyTrainerPasscode();
  });
  $('closeHistory').addEventListener('click', function(){ historyModal.hidden = true; });
  historyExpandBtn.addEventListener('click', function(){
    var content = historyModal.querySelector('.modal-content');
    var expanded = content.classList.toggle('expanded');
    historyExpandBtn.setAttribute('aria-label', expanded ? 'Collapse history window' : 'Expand history window');
    historyExpandBtn.title = expanded ? 'Collapse history window' : 'Expand history window';
    historyExpandBtn.textContent = expanded ? '⤡' : '⤢';
  });
  infoBtn.addEventListener('click', function(){ infoModal.hidden = false; });
  $('closeInfo').addEventListener('click', function(){ infoModal.hidden = true; });
  $('finishWelcome').addEventListener('click', function(){
    writeLS('walkthrough-seen', true);
    welcomeModal.hidden = true;
  });
  [historyModal, infoModal].forEach(function(m){
    m.addEventListener('click', function(ev){ if(ev.target === m) m.hidden = true; });
  });
  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Escape'){
      historyModal.hidden = true;
      infoModal.hidden = true;
      if(profileAnalyticsModal) closeMyAnalytics();
      if(adminConsoleModal) adminConsoleModal.hidden = true;
      if(adminInviteModal) adminInviteModal.hidden = true;
      if(adminResetModal) adminResetModal.hidden = true;
      if(caseOpen) closeCaseFn();
    }
  });

  // Quick chip starters on empty state
  document.addEventListener('click', function(ev){
    var chip = ev.target.closest('.quick-chip');
    if(!chip || state.busy) return;
    var cat = chip.dataset.category || 'random';
    var emo = chip.dataset.emotion || 'random';
    categorySelect.value = cat;
    emotionSelect.value = emo;
    startScenario();
  });

  copyBtn.addEventListener('click', async function(){
    var lines = [];
    if(state.ticketId) lines.push('Case: ' + state.ticketId);
    state.messages.forEach(function(m){
      lines.push((m.role === 'audit' ? '[History]' : (m.role === 'agent' ? 'Agent' : 'Customer')) + ': ' + m.text);
    });
    lines.push('');
    lines.push('Name: ' + (caseFields.fCustomerName.value || '(none)'));
    lines.push('Email: ' + (caseFields.fEmail.value || '(none)'));
    lines.push('Product: ' + (caseFields.fProduct.value || '(none)'));
    lines.push('Recap / TS: ' + (caseFields.fRecap.value || '(none)'));
    lines.push('Resources: ' + (caseFields.fResources.value || '(none)'));
    lines.push('Next Steps: ' + (caseFields.fNextSteps.value || '(none)'));
    lines.push('Escalation POC: ' + (caseFields.fEscalation.value || '(none)'));
    var text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied!';
    } catch(e){
      copyBtn.textContent = 'Could not copy';
    }
    setTimeout(function(){ copyBtn.textContent = 'Copy transcript & notes'; }, 1600);
  });

  /* ========================================================================
     TRAINEE PERFORMANCE COCKPIT & ANALYTICS LOGIC
     ======================================================================== */
  var profileAnalyticsModal = $('profileAnalyticsModal');
  var myAnalyticsBtn = $('myAnalyticsBtn');
  var closeProfileAnalytics = $('closeProfileAnalytics');
  var refreshAiBtn = $('refreshAiBtn');

  var currentAnalyticsData = null;
  var currentAiInsights = null;
  var selectedSessionRecord = null;
  var currentTranscriptFilter = 'all';

  function formatDuration(sec){
    if(!sec || sec <= 0) return '0s';
    var m = Math.floor(sec / 60);
    var s = Math.round(sec % 60);
    if(m === 0) return s + 's';
    return m + 'm ' + s + 's';
  }

  async function openMyAnalytics(targetUser){
    analyticsTargetUser = targetUser || null;
    var profileToView = analyticsTargetUser || loginProfile;
    if(!profileToView){
      setLoginStatus('Please sign in with your ECE credentials to view performance analytics.', true);
      loginScreen.hidden = false;
      appRoot.hidden = true;
      return;
    }
    if(!profileAnalyticsModal) return;
    profileAnalyticsModal.hidden = false;

    // Header subtitle
    var subtitleEl = profileAnalyticsModal.querySelector('.pa-subtitle');
    if(subtitleEl){
      subtitleEl.textContent = analyticsTargetUser
        ? ('Leadership Drill-Down Analytics • Trainee: ' + (profileToView.name || 'Agent'))
        : 'ECE Live-Chat Agent Performance Cockpit • Wyze Support Division';
    }

    // Populate Agent Header Card
    var avatarWrap = $('paAvatarWrap');
    if(avatarWrap) avatarWrap.innerHTML = avatarMarkup(profileToView.avatarId || 'pip', 'pa-avatar-art');
    var agentNameEl = $('paAgentName');
    if(agentNameEl) agentNameEl.textContent = profileToView.name;
    var agentEmailEl = $('paAgentEmail');
    if(agentEmailEl) agentEmailEl.textContent = profileToView.email || 'ECE Trainee Account';

    currentAiInsights = null;
    await loadMyAnalyticsData(profileToView);
  }

  function closeMyAnalytics(){
    if(profileAnalyticsModal) profileAnalyticsModal.hidden = true;
    analyticsTargetUser = null;
  }

  async function loadMyAnalyticsData(profileToView){
    profileToView = profileToView || analyticsTargetUser || loginProfile;
    if(!profileToView) return;
    try {
      var userIdentifier = encodeURIComponent(profileToView.id || profileToView.userId || profileToView.name);
      var res = await fetch('/api/agent/analytics?user=' + userIdentifier);
      if(!res.ok){
        throw new Error('Could not retrieve agent analytics.');
      }
      var json = await res.json();
      currentAnalyticsData = json.analytics || json.data || {};
      renderAnalyticsData(currentAnalyticsData);

      // Auto-fetch AI insights if not loaded yet
      if(!currentAiInsights && currentAnalyticsData){
        loadAiInsights(currentAnalyticsData, false, profileToView);
      }
    } catch(err){
      console.error(err);
    }
  }

  function renderAnalyticsData(data){
    if(!data) return;
    var k = data.kpis || {};

    // Header total chats
    var totalBadge = $('paTotalChatsBadge');
    if(totalBadge) totalBadge.textContent = (k.totalSessions || 0) + ' Practice Chats (7 Days)';

    // KPI Cards
    var wpmEl = $('paKpiWpm');
    if(wpmEl) wpmEl.textContent = k.avgWpm ? (k.avgWpm + ' WPM') : '—';
    var respSec = k.avgResponseLatencySec != null ? k.avgResponseLatencySec : (k.avgResponseTimeSec != null ? k.avgResponseTimeSec : null);
    var respEl = $('paKpiResp');
    if(respEl) respEl.textContent = respSec != null ? (respSec + 's') : '—';
    var resRate = k.resolutionRate != null ? k.resolutionRate : (k.resolvedRate != null ? k.resolvedRate : 0);
    var resRateEl = $('paKpiResRate');
    if(resRateEl) resRateEl.textContent = resRate + '%';
    var abnRate = k.abandonmentRate != null ? k.abandonmentRate : (k.abandonedRate != null ? k.abandonedRate : 0);
    var abnRateEl = $('paKpiAbandonRate');
    if(abnRateEl) abnRateEl.textContent = abnRate + '%';
    var recRate = k.frustrationRecoveryRate != null ? k.frustrationRecoveryRate : 100;
    var churnRateEl = $('paKpiChurnRate');
    if(churnRateEl) churnRateEl.textContent = recRate + '%';
    var docRate = k.caseDocumentationAvgScore != null ? k.caseDocumentationAvgScore : (k.caseDocCompletionRate != null ? k.caseDocCompletionRate : 0);
    var docRateEl = $('paKpiDocRate');
    if(docRateEl) docRateEl.textContent = docRate + '/100';

    var churnCountEl = $('paKpiChurnCount');
    if(churnCountEl){
      churnCountEl.textContent = (k.customerFrustrationChurnRate != null ? (k.customerFrustrationChurnRate + '% churn rate') : 'De-escalation rate');
    }

    renderSpeedDistributions(data);
    renderResolutionsAndAbandonment(data);
    renderFrustrationAndChurn(data);
    renderPastSessionTranscripts(data);
  }

  function renderSpeedDistributions(data){
    var sDist = data.speedDistribution || {};
    var rDist = data.responseDistribution || data.responseTimeDistribution || {};
    var speedDist = {
      '<30 WPM': sDist['<30 WPM'] != null ? sDist['<30 WPM'] : (sDist.slow || 0),
      '30-45 WPM': sDist['30-45 WPM'] != null ? sDist['30-45 WPM'] : Math.round((sDist.standard || 0) * 0.6),
      '45-60 WPM': sDist['45-60 WPM'] != null ? sDist['45-60 WPM'] : Math.round((sDist.standard || 0) * 0.4),
      '60+ WPM': sDist['60+ WPM'] != null ? sDist['60+ WPM'] : (sDist.fast || 0)
    };
    var respDist = {
      '<30s': rDist['<30s'] != null ? rDist['<30s'] : (rDist.under30s || 0),
      '30-60s': rDist['30-60s'] != null ? rDist['30-60s'] : (rDist.s30to60 || 0),
      '60-120s': rDist['60-120s'] != null ? rDist['60-120s'] : (rDist.s60to120 || 0),
      '>120s': rDist['>120s'] != null ? rDist['>120s'] : (rDist.over120s || 0)
    };
    var totalSpeed = Math.max(1, (speedDist['<30 WPM'] || 0) + (speedDist['30-45 WPM'] || 0) + (speedDist['45-60 WPM'] || 0) + (speedDist['60+ WPM'] || 0));
    var totalResp = Math.max(1, (respDist['<30s'] || 0) + (respDist['30-60s'] || 0) + (respDist['60-120s'] || 0) + (respDist['>120s'] || 0));

    // Speed Distribution Bars
    var speedBarsEl = $('paSpeedDistBars');
    if(speedBarsEl){
      var sRows = [
        { key: '<30 WPM', label: '<30 WPM (Slow / Novice)', color: 'color-amber' },
        { key: '30-45 WPM', label: '30-45 WPM (Developing / Acceptable)', color: 'color-blue' },
        { key: '45-60 WPM', label: '45-60 WPM (Target Wyze SLA)', color: 'color-teal' },
        { key: '60+ WPM', label: '60+ WPM (Pro Fast)', color: 'color-emerald' }
      ];
      speedBarsEl.innerHTML = sRows.map(function(item){
        var count = speedDist[item.key] || 0;
        var pct = Math.round((count / totalSpeed) * 100);
        return '<div class="pa-dist-row">' +
          '<div class="pa-dist-label"><span>' + item.label + '</span><strong>' + count + ' chats (' + pct + '%)</strong></div>' +
          '<div class="pa-meter-track"><div class="pa-meter-fill ' + item.color + '" style="width:' + pct + '%;"></div></div>' +
        '</div>';
      }).join('');
    }

    // Response Wait Latency Bars
    var respBarsEl = $('paRespDistBars');
    if(respBarsEl){
      var rRows = [
        { key: '<30s', label: '<30s (Instant Acknowledgment)', color: 'color-emerald' },
        { key: '30-60s', label: '30-60s (Standard BPO Handling)', color: 'color-teal' },
        { key: '60-120s', label: '60-120s (Noticeable Lag)', color: 'color-amber' },
        { key: '>120s', label: '>120s (Critical Churn Risk)', color: 'color-coral' }
      ];
      respBarsEl.innerHTML = rRows.map(function(item){
        var count = respDist[item.key] || 0;
        var pct = Math.round((count / totalResp) * 100);
        return '<div class="pa-dist-row">' +
          '<div class="pa-dist-label"><span>' + item.label + '</span><strong>' + count + ' msgs (' + pct + '%)</strong></div>' +
          '<div class="pa-meter-track"><div class="pa-meter-fill ' + item.color + '" style="width:' + pct + '%;"></div></div>' +
        '</div>';
      }).join('');
    }

    // WPM Progression Table
    var tableBody = $('paWpmTableBody');
    if(tableBody){
      var sessions = (data.sessions || data.recentSessions || []).slice(0, 15);
      if(!sessions.length){
        tableBody.innerHTML = '<tr><td colspan="5" class="muted text-center py-4">No completed chat drills yet.</td></tr>';
      } else {
        tableBody.innerHTML = sessions.map(function(s){
          var dateVal = s.created_at || s.createdAt;
          var dateStr = dateVal ? new Date(dateVal).toLocaleDateString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
          var numWpm = s.avg_wpm || s.avgWpm;
          var wpmVal = numWpm ? (numWpm + ' WPM') : '—';
          var speedTier = !numWpm ? '<span class="status-badge">Unmeasured</span>' : (numWpm >= 50 ? '<span class="status-badge status-resolved">Fast (50+)</span>' : (numWpm >= 35 ? '<span class="status-badge" style="background:#e0f2fe;color:#0369a1;">Standard</span>' : '<span class="status-badge status-abandoned">Developing (<35)</span>'));
          var outcomeBadge = s.status === 'RESOLVED' ? '<span class="status-badge status-resolved">Resolved</span>' : (s.status === 'ABANDONED' ? '<span class="status-badge status-abandoned">Abandoned</span>' : '<span class="status-badge">' + escapeHtml(s.status) + '</span>');
          return '<tr>' +
            '<td class="mono font-semibold">' + escapeHtml(s.ticket_id || s.ticketId || '—') + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td><strong>' + wpmVal + '</strong></td>' +
            '<td>' + speedTier + '</td>' +
            '<td>' + outcomeBadge + '</td>' +
          '</tr>';
        }).join('');
      }
    }
  }

  function renderResolutionsAndAbandonment(data){
    var k = data.kpis || {};

    // 7-Minute Abandonment Summary Box
    var abnBox = $('paAbandonmentAnalysisContent');
    if(abnBox){
      var abnCount = k.abandonedSessions || k.abandonedCount || 0;
      var abnRate = k.abandonmentRate || 0;
      var statusColor = abnCount === 0 ? 'text-teal' : (abnCount <= 2 ? 'text-amber' : 'text-coral');
      abnBox.innerHTML =
        '<div class="pa-stat-highlight">' +
          '<span class="stat-number ' + statusColor + '">' + abnCount + '</span>' +
          '<span class="stat-desc">abandoned chats total (' + abnRate + '% of all sessions) caused by customer walkout after 7 minutes of silence.</span>' +
        '</div>' +
        '<p class="muted" style="margin-top:10px;font-size:0.875rem;">' +
          (abnCount === 0
            ? 'Excellent attendance! You have maintained proactive communication on every chat without letting customers disconnect.'
            : 'Remember: simulated Wyze customers burst with negative impressions and terminate the chat automatically after 7 minutes without an agent reply. Send check-ins every 2–3 minutes while researching.') +
        '</p>';
    }

    // Category Matrix
    var catList = $('paCategoryList');
    if(catList){
      var cats = data.categoryBreakdown || [];
      if(!cats.length){
        catList.innerHTML = '<p class="muted text-sm py-2">No category data recorded yet.</p>';
      } else {
        catList.innerHTML = cats.map(function(c){
          var resPercent = c.total > 0 ? Math.round((c.resolved / c.total) * 100) : 0;
          return '<div class="pa-category-row">' +
            '<div class="pa-category-meta">' +
              '<span class="pa-cat-name">' + escapeHtml(c.category) + '</span>' +
              '<span class="pa-cat-counts">' + c.total + ' chats · <span style="color:#0f766e;font-weight:600;">' + c.resolved + ' resolved</span> · <span style="color:#be123c;font-weight:600;">' + c.abandoned + ' abandoned</span></span>' +
            '</div>' +
            '<div class="pa-cat-rate"><span class="pa-rate-badge">' + resPercent + '% Res Rate</span></div>' +
          '</div>';
        }).join('');
      }
    }

    // Abandoned Chat Drilldown Table
    var abnTable = $('paAbandonedTableBody');
    if(abnTable){
      var abnSessions = (data.sessions || data.recentSessions || []).filter(function(s){ return s.abandoned || s.status === 'ABANDONED'; });
      if(!abnSessions.length){
        abnTable.innerHTML = '<tr><td colspan="4" class="text-teal text-center py-4 font-semibold">🎉 Zero abandoned chats recorded! Outstanding response SLA discipline.</td></tr>';
      } else {
        abnTable.innerHTML = abnSessions.map(function(s){
          return '<tr>' +
            '<td class="mono font-semibold">' + escapeHtml(s.ticket_id || s.ticketId || '—') + '</td>' +
            '<td>' + escapeHtml(s.product || s.category || 'General Wyze') + '</td>' +
            '<td class="text-coral font-semibold">≥ 7 min silence</td>' +
            '<td><span class="muted text-xs">Customer outburst walkout (inactivity threshold reached)</span></td>' +
          '</tr>';
        }).join('');
      }
    }
  }

  function renderFrustrationAndChurn(data){
    var k = data.kpis || {};
    var recRate = k.frustrationRecoveryRate != null ? k.frustrationRecoveryRate : 100;
    var churnRate = k.customerFrustrationChurnRate != null ? k.customerFrustrationChurnRate : 0;

    var pctEl = $('paChurnPercent');
    if(pctEl) pctEl.textContent = recRate + '%';
    var descEl = $('paChurnDesc');
    if(descEl){
      if(recRate >= 80){
        descEl.textContent = 'of frustrated or upset customers were successfully guided to positive resolution. Outstanding empathy!';
      } else if(recRate >= 50){
        descEl.textContent = 'of upset customers resolved. Moderate recovery rate; remember to validate frustration before troubleshooting.';
      } else {
        descEl.textContent = 'of upset customers resolved. High customer churn detected; avoid robotic canned replies and acknowledge delays.';
      }
    }
  }

  function renderPastSessionTranscripts(data){
    var listEl = $('paSessionsList');
    if(!listEl) return;
    var rawSessions = (data.sessions && data.sessions.length) ? data.sessions : (data.recentSessions || []);
    
    // Merge local completed sessions so freshly finished sessions show immediately
    var localIndex = readLS('session-index') || [];
    var allSessions = rawSessions.slice();
    localIndex.forEach(function(item){
      var exists = allSessions.some(function(s){
        return (s.id && s.id === item.id) || (s.ticket_id && s.ticket_id === item.ticketId) || (s.ticketId && s.ticketId === item.ticketId);
      });
      if(!exists){
        var localFull = readLS('session:' + item.id);
        allSessions.unshift({
          id: item.id,
          ticket_id: item.ticketId,
          ticketId: item.ticketId,
          customer_name: item.name,
          product: (localFull && localFull.persona && localFull.persona.product) || 'Wyze Device',
          category: item.category,
          status: item.status,
          created_at: item.createdAt || item.updatedAt,
          createdAt: item.createdAt || item.updatedAt,
          avg_wpm: (localFull && localFull.avgWpm) || null,
          avgWpm: (localFull && localFull.avgWpm) || null,
          messages: (localFull && localFull.messages) || [],
          notes: (localFull && localFull.notes) || {},
          coaching_points: (localFull && localFull.coachingPoints) || ''
        });
      }
    });

    var filtered = allSessions.filter(function(s){
      if(currentTranscriptFilter === 'all') return true;
      if(currentTranscriptFilter === 'resolved') return s.status === 'RESOLVED';
      if(currentTranscriptFilter === 'escalated') return s.status === 'ESCALATED';
      if(currentTranscriptFilter === 'abandoned') return s.status === 'ABANDONED' || s.abandoned;
      return true;
    });

    if(!filtered.length){
      listEl.innerHTML = '<div class="muted text-sm p-4 text-center">No past chats match the selected filter.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function(s){
      var isSelected = selectedSessionRecord && (selectedSessionRecord.id === s.id);
      var statusClass = s.status === 'RESOLVED' ? 'status-resolved' : (s.status === 'ABANDONED' ? 'status-abandoned' : 'status-open');
      var dateVal = s.created_at || s.createdAt;
      var dateStr = dateVal ? new Date(dateVal).toLocaleDateString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
      var wpm = s.avg_wpm || s.avgWpm;
      return '<div class="pa-session-card' + (isSelected ? ' selected' : '') + '" data-id="' + escapeHtml(s.id) + '">' +
        '<div class="pa-sc-header">' +
          '<span class="mono font-semibold">' + escapeHtml(s.ticket_id || s.ticketId || 'WZ-000000') + '</span>' +
          '<span class="status-badge ' + statusClass + '">' + escapeHtml(s.status) + '</span>' +
        '</div>' +
        '<div class="pa-sc-name">' + escapeHtml(s.customer_name || s.name || 'Customer') + ' · ' + escapeHtml(s.product || 'Wyze Device') + '</div>' +
        '<div class="pa-sc-meta">' +
          '<span>' + dateStr + '</span>' +
          '<span>' + (wpm ? (wpm + ' WPM') : 'No WPM') + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    listEl.querySelectorAll('.pa-session-card').forEach(function(card){
      card.addEventListener('click', function(){
        var id = card.getAttribute('data-id');
        selectTranscriptSession(id, allSessions);
      });
    });

    if(!selectedSessionRecord && filtered.length > 0){
      selectTranscriptSession(filtered[0].id, allSessions);
    }
  }

  function selectTranscriptSession(id, sessionPool){
    var pool = sessionPool || (currentAnalyticsData ? (currentAnalyticsData.sessions || currentAnalyticsData.recentSessions || []) : []);
    var found = pool.find(function(s){ return s.id === id; });
    if(!found){
      var localFull = readLS('session:' + id);
      if(localFull){
        found = {
          id: id,
          ticket_id: localFull.ticketId,
          ticketId: localFull.ticketId,
          customer_name: (localFull.persona && localFull.persona.name) || 'Customer',
          product: (localFull.persona && localFull.persona.product) || 'Wyze Device',
          category: (localFull.persona && localFull.persona.issueCategory) || 'General',
          status: localFull.status,
          created_at: localFull.createdAt,
          messages: localFull.messages || [],
          notes: localFull.notes || {},
          coaching_points: localFull.coachingPoints || '',
          avg_wpm: localFull.avgWpm
        };
      }
    }
    if(!found) return;

    if(!found.messages || !found.messages.length){
      var stored = readLS('session:' + found.id);
      if(stored && stored.messages){
        found.messages = stored.messages;
        found.notes = stored.notes || found.notes;
        found.coaching_points = stored.coachingPoints || found.coaching_points;
      }
    }

    selectedSessionRecord = found;

    var listEl = $('paSessionsList');
    if(listEl){
      listEl.querySelectorAll('.pa-session-card').forEach(function(c){
        c.classList.toggle('selected', c.getAttribute('data-id') === id);
      });
    }

    renderTranscriptDetail(found);
  }

  function renderTranscriptDetail(session){
    var view = $('paTranscriptView');
    if(!view) return;

    var messages = [];
    if(Array.isArray(session.messages)){
      messages = session.messages;
    } else if(session.transcript && Array.isArray(session.transcript)){
      messages = session.transcript;
    }

    var notes = session.notes || {};
    var coaching = session.coaching_points || session.coachingPoints || '';
    var duration = session.durationSec ? formatDuration(session.durationSec) : '—';
    var statusBadgeClass = session.status === 'RESOLVED' ? 'status-resolved' : (session.status === 'ABANDONED' ? 'status-abandoned' : 'status-open');

    var msgHtml = '';
    if(!messages.length){
      msgHtml = '<p class="muted p-4">No chat messages recorded in this session transcript.</p>';
    } else {
      msgHtml = messages.map(function(m){
        var isAgent = m.role === 'agent';
        var isAudit = m.role === 'audit';
        if(isAudit){
          return '<div class="pa-msg-audit">ℹ️ ' + escapeHtml(m.text) + '</div>';
        }
        var senderName = isAgent ? (loginProfile ? loginProfile.name : 'You') : (session.customer_name || 'Customer');
        var roleClass = isAgent ? 'pa-msg-agent' : 'pa-msg-customer';
        var metaItems = [senderName];
        if(m.ts) metaItems.push(fmtTime(m.ts));
        if(m.wpm) metaItems.push(m.wpm + ' WPM');
        if(m.gapSec) metaItems.push('+' + m.gapSec + 's wait');
        return '<div class="pa-msg-item ' + roleClass + '">' +
          '<div class="pa-msg-header">' + metaItems.join(' · ') + '</div>' +
          '<div class="pa-msg-bubble' + (m.abandonment ? ' pa-msg-abandonment' : '') + '">' + escapeHtml(m.text) + '</div>' +
        '</div>';
      }).join('');
    }

    view.innerHTML =
      '<div class="pa-detail-toolbar">' +
        '<div>' +
          '<h3 class="pa-detail-title mono">' + escapeHtml(session.ticket_id || 'WZ-000000') + ' <span class="status-badge ' + statusBadgeClass + '">' + escapeHtml(session.status) + '</span></h3>' +
          '<div class="text-sm muted">' + escapeHtml(session.customer_name || 'Customer') + ' · ' + escapeHtml(session.product || 'Wyze Device') + ' (' + escapeHtml(session.category || 'General') + ') · Duration: ' + duration + '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-sm btn-outline" id="paCopyTranscriptBtn">📋 Copy Full Transcript</button>' +
      '</div>' +
      '<div class="pa-messages-container">' + msgHtml + '</div>' +
      '<div class="pa-case-notes-card">' +
        '<h4>📑 Trainee Case Documentation Log</h4>' +
        '<div class="pa-notes-grid">' +
          '<div><span class="muted">Customer:</span> ' + escapeHtml(notes.customerName || notes.fCustomerName || '—') + '</div>' +
          '<div><span class="muted">Email:</span> ' + escapeHtml(notes.email || notes.fEmail || '—') + '</div>' +
          '<div><span class="muted">Product:</span> ' + escapeHtml(notes.product || notes.fProduct || '—') + '</div>' +
          '<div><span class="muted">Escalation POC:</span> ' + escapeHtml(notes.escalation || notes.fEscalation || '—') + '</div>' +
          '<div style="grid-column:1/-1;"><span class="muted">Recap / TS Performed:</span> ' + escapeHtml(notes.recap || notes.fRecap || '—') + '</div>' +
          '<div style="grid-column:1/-1;"><span class="muted">Help Center Resources:</span> ' + escapeHtml(notes.resources || notes.fResources || '—') + '</div>' +
          '<div style="grid-column:1/-1;"><span class="muted">Agreed Next Steps:</span> ' + escapeHtml(notes.nextSteps || notes.fNextSteps || '—') + '</div>' +
        '</div>' +
      '</div>' +
      (coaching ? ('<div class="pa-coaching-card"><h4>🎯 Session QA Coaching Notes</h4><pre class="pa-coaching-text">' + escapeHtml(coaching) + '</pre></div>') : '');

    var copyBtn = $('paCopyTranscriptBtn');
    if(copyBtn){
      copyBtn.addEventListener('click', async function(){
        var lines = ['--- ECEWISE WYZE SIMULATOR CHAT TRANSCRIPT ---'];
        lines.push('Ticket ID: ' + (session.ticket_id || 'WZ-000000'));
        lines.push('Trainee: ' + (loginProfile ? loginProfile.name : 'Wyze Agent'));
        lines.push('Customer: ' + (session.customer_name || 'Customer'));
        lines.push('Product: ' + (session.product || 'Wyze Device'));
        lines.push('Category: ' + (session.category || 'General'));
        lines.push('Status: ' + session.status);
        lines.push('Average WPM: ' + (session.avg_wpm || 'N/A'));
        lines.push('');
        messages.forEach(function(m){
          var role = m.role === 'agent' ? 'Agent' : (m.role === 'audit' ? '[System Audit]' : 'Customer');
          lines.push(role + ': ' + m.text);
        });
        if(notes.recap || notes.fRecap){
          lines.push('\n[Case Notes]');
          lines.push('Recap: ' + (notes.recap || notes.fRecap));
          lines.push('Resources: ' + (notes.resources || notes.fResources));
          lines.push('Next Steps: ' + (notes.nextSteps || notes.fNextSteps));
        }
        try {
          await navigator.clipboard.writeText(lines.join('\n'));
          copyBtn.textContent = 'Copied to Clipboard!';
          setTimeout(function(){ copyBtn.textContent = '📋 Copy Full Transcript'; }, 1800);
        } catch(e){
          copyBtn.textContent = 'Failed to Copy';
        }
      });
    }
  }

  async function loadAiInsights(analyticsData, forceRefresh, profileToView){
    if(!analyticsData) return;
    var target = profileToView || analyticsTargetUser || loginProfile;
    var summaryEl = $('paExecutiveSummary');
    var refreshBtn = $('refreshAiBtn');
    if(refreshBtn) refreshBtn.disabled = true;
    if(summaryEl) summaryEl.textContent = 'Synthesizing 7-day performance with Gemini QA coaching model…';

    try {
      var res = await fetch('/api/agent/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: target ? target.name : 'Wyze Agent',
          metrics: analyticsData.kpis,
          categoryBreakdown: analyticsData.categoryBreakdown,
          recentSessions: (analyticsData.sessions || []).slice(0, 5)
        })
      });
      if(!res.ok){
        throw new Error('AI Insights synthesis error.');
      }
      var json = await res.json();
      currentAiInsights = json.insights;
      renderAiInsights(currentAiInsights);
    } catch(err){
      console.error(err);
      if(summaryEl) summaryEl.textContent = 'AI insights temporarily unavailable. Continue practicing chat drills to generate metrics.';
    } finally {
      if(refreshBtn) refreshBtn.disabled = false;
    }
  }

  function renderAiInsights(insights){
    if(!insights) return;
    var gradeEl = $('paOverallGrade');
    if(gradeEl){
      gradeEl.textContent = insights.overallRating || 'Solid';
      gradeEl.className = 'pa-grade-pill ' + (insights.overallRating === 'Excellent' ? 'status-resolved' : (insights.overallRating === 'Needs work' ? 'status-abandoned' : 'status-open'));
    }
    var summaryEl = $('paExecutiveSummary');
    if(summaryEl) summaryEl.textContent = insights.summary || '';

    var strengthsEl = $('paStrengthsList');
    if(strengthsEl){
      var s = insights.strengths || [];
      strengthsEl.innerHTML = s.map(function(item){
        return '<li>' + escapeHtml(item) + '</li>';
      }).join('');
    }

    var growthEl = $('paGrowthList');
    if(growthEl){
      var g = insights.growthAreas || [];
      growthEl.innerHTML = g.map(function(item){
        return '<li>' + escapeHtml(item) + '</li>';
      }).join('');
    }

    var churnAdvEl = $('paChurnAdvice');
    if(churnAdvEl) churnAdvEl.textContent = insights.churnRiskAnalysis || 'Acknowledge customer frustration immediately upon joining.';
    var speedAdvEl = $('paSpeedAdvice');
    if(speedAdvEl) speedAdvEl.textContent = insights.slaAndSpeedAdvice || 'Aim for a steady pace of 45-60 WPM.';
    var nextGoalEl = $('paNextGoal');
    if(nextGoalEl) nextGoalEl.textContent = insights.nextDrillGoal || 'Complete a full scenario with zero response gaps over 60 seconds.';
  }

  function switchAnalyticsTab(tabId){
    var tabMap = [
      { id: 'ai', btn: $('paTabAi'), panel: $('paPanelAi') },
      { id: 'speed', btn: $('paTabSpeed'), panel: $('paPanelSpeed') },
      { id: 'res', btn: $('paTabRes'), panel: $('paPanelRes') },
      { id: 'churn', btn: $('paTabChurn'), panel: $('paPanelChurn') },
      { id: 'transcripts', btn: $('paTabTranscripts'), panel: $('paPanelTranscripts') }
    ];

    tabMap.forEach(function(item){
      var isTarget = item.id === tabId;
      if(item.btn){
        item.btn.classList.toggle('active', isTarget);
        item.btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      }
      if(item.panel){
        item.panel.hidden = !isTarget;
        item.panel.classList.toggle('active', isTarget);
      }
    });
  }

  /* Auth UI & Forms Listeners */
  if(tabSignIn) tabSignIn.addEventListener('click', function(){ setAuthTab('signIn'); });
  if(tabSignUp) tabSignUp.addEventListener('click', function(){ setAuthTab('signUp'); });
  if($('switchToSignUp')) $('switchToSignUp').addEventListener('click', function(){ setAuthTab('signUp'); });
  if($('switchToSignIn')) $('switchToSignIn').addEventListener('click', function(){ setAuthTab('signIn'); });
  if($('forgotPassLink')) $('forgotPassLink').addEventListener('click', function(){ setAuthTab('forgot'); });
  if($('cancelForgotBtn')) $('cancelForgotBtn').addEventListener('click', function(){ setAuthTab('signIn'); });
  if($('backToSignInFromForgot')) $('backToSignInFromForgot').addEventListener('click', function(){ setAuthTab('signIn'); });

  if($('continueSignUpBtn')) $('continueSignUpBtn').addEventListener('click', handleSignUpContinue);
  if($('backToSignUpDetailsBtn')) $('backToSignUpDetailsBtn').addEventListener('click', function(){
    $('signUpAvatarStep').hidden = true;
    $('signUpDetailsStep').hidden = false;
    $('signUpName').focus();
  });
  if($('sendResetCodeBtn')) $('sendResetCodeBtn').addEventListener('click', handleForgotRequest);
  if($('backToForgotStep1Btn')) $('backToForgotStep1Btn').addEventListener('click', function(){
    $('forgotStep2').hidden = true;
    $('forgotStep1').hidden = false;
    $('forgotEmail').focus();
  });

  if(signInForm) signInForm.addEventListener('submit', handleSignIn);
  if(signUpForm) signUpForm.addEventListener('submit', handleSignUp);
  if(forgotPasswordForm) forgotPasswordForm.addEventListener('submit', handleForgotReset);
  if(signOutBtn) signOutBtn.addEventListener('click', handleSignOut);

  // Performance Cockpit Listeners
  if(myAnalyticsBtn) myAnalyticsBtn.addEventListener('click', function(){ openMyAnalytics(); });
  if(agentIdentity) agentIdentity.addEventListener('click', function(){ openMyAnalytics(); });
  if(closeProfileAnalytics) closeProfileAnalytics.addEventListener('click', closeMyAnalytics);
  if(refreshAiBtn) refreshAiBtn.addEventListener('click', function(){
    if(currentAnalyticsData) loadAiInsights(currentAnalyticsData, true);
  });
  var refreshAnalyticsBtn = $('refreshAnalyticsBtn');
  if(refreshAnalyticsBtn) refreshAnalyticsBtn.addEventListener('click', function(){
    loadMyAnalyticsData();
  });

  if($('paTabAi')) $('paTabAi').addEventListener('click', function(){ switchAnalyticsTab('ai'); });
  if($('paTabSpeed')) $('paTabSpeed').addEventListener('click', function(){ switchAnalyticsTab('speed'); });
  if($('paTabRes')) $('paTabRes').addEventListener('click', function(){ switchAnalyticsTab('res'); });
  if($('paTabChurn')) $('paTabChurn').addEventListener('click', function(){ switchAnalyticsTab('churn'); });
  if($('paTabTranscripts')) $('paTabTranscripts').addEventListener('click', function(){ switchAnalyticsTab('transcripts'); });

  document.querySelectorAll('.pa-filter-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.pa-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      currentTranscriptFilter = btn.getAttribute('data-filter') || 'all';
      if(currentAnalyticsData) renderPastSessionTranscripts(currentAnalyticsData);
    });
  });

  if(profileAnalyticsModal){
    profileAnalyticsModal.addEventListener('click', function(ev){
      if(ev.target === profileAnalyticsModal) closeMyAnalytics();
    });
  }

  /* ========================================================================
     LEADERSHIP ADMIN CONSOLE & TRAINEE ROSTER MANAGEMENT
     ======================================================================== */
  function openAdminConsole(){
    if(!adminConsoleModal) return;
    adminConsoleModal.hidden = false;
    if(trainerAccess){
      if(adminPasscodeGate) adminPasscodeGate.hidden = true;
      if(adminDashboardView) adminDashboardView.hidden = false;
      loadAdminTrainees();
    } else {
      if(adminPasscodeGate) adminPasscodeGate.hidden = false;
      if(adminDashboardView) adminDashboardView.hidden = true;
      if(adminGatePasscode){
        adminGatePasscode.value = '';
        adminGatePasscode.focus();
      }
      if(adminGateStatus) adminGateStatus.textContent = '';
    }
  }

  function closeAdminConsoleModal(){
    if(adminConsoleModal) adminConsoleModal.hidden = true;
  }

  function unlockAdminConsole(){
    var code = (adminGatePasscode ? adminGatePasscode.value : '').trim();
    if(code === TRAINER_PASSCODE){
      trainerAccess = true;
      trainerMode = true;
      if(trainerModeToggle) trainerModeToggle.checked = true;
      if(adminGateStatus) adminGateStatus.textContent = '';
      if(adminPasscodeGate) adminPasscodeGate.hidden = true;
      if(adminDashboardView) adminDashboardView.hidden = false;
      loadAdminTrainees();
    } else {
      if(adminGateStatus){
        adminGateStatus.textContent = 'Invalid leadership passcode. Please try again.';
        adminGateStatus.className = 'status-msg is-error';
      }
      if(adminGatePasscode) adminGatePasscode.focus();
    }
  }

  async function loadAdminTrainees(){
    try {
      var res = await fetch('/api/admin/trainees?key=' + encodeURIComponent(TRAINER_PASSCODE));
      if(!res.ok){
        throw new Error('Could not retrieve trainees list.');
      }
      var json = await res.json();
      adminTraineesData = json.trainees || [];
      renderAdminSummaryChips(adminTraineesData);
      renderAdminTrainees();
    } catch(err){
      console.error(err);
      if(adminTraineesTableBody){
        adminTraineesTableBody.innerHTML = '<tr><td colspan="9" class="text-center p-4 muted">Unable to load trainees: ' + escapeHtml(err.message) + '</td></tr>';
      }
    }
  }

  function renderAdminSummaryChips(trainees){
    var total = trainees.length;
    var active = trainees.filter(function(t){ return t.isActive; }).length;
    var deactivated = total - active;
    var validWpm = trainees.filter(function(t){ return t.avgWpm != null && t.avgWpm > 0; });
    var avgWpm = validWpm.length ? Math.round(validWpm.reduce(function(a,b){ return a + b.avgWpm; }, 0) / validWpm.length) : 0;
    var totalResolved = trainees.reduce(function(a,b){ return a + (b.resolvedDrills || 0); }, 0);
    var totalDrills = trainees.reduce(function(a,b){ return a + (b.totalDrills || 0); }, 0);
    var avgResRate = totalDrills > 0 ? Math.round((totalResolved / totalDrills) * 100) : 0;

    var chipsEl = $('adminQuickSummary');
    if(chipsEl){
      chipsEl.innerHTML =
        '<div class="admin-chip"><strong>' + total + '</strong><span>Total Trainees</span></div>' +
        '<div class="admin-chip is-active"><strong>' + active + '</strong><span>Active</span></div>' +
        (deactivated > 0 ? ('<div class="admin-chip is-deactivated"><strong>' + deactivated + '</strong><span>Deactivated</span></div>') : '') +
        '<div class="admin-chip"><strong>' + (avgWpm ? (avgWpm + ' WPM') : '—') + '</strong><span>Team Avg Speed</span></div>' +
        '<div class="admin-chip"><strong>' + avgResRate + '%</strong><span>Overall Resolution Rate</span></div>';
    }
  }

  function renderAdminTrainees(){
    var q = (adminSearchInput ? adminSearchInput.value : '').toLowerCase().trim();
    var statusFilter = adminStatusFilter ? adminStatusFilter.value : 'all';

    var filtered = adminTraineesData.filter(function(t){
      if(statusFilter === 'active' && !t.isActive) return false;
      if(statusFilter === 'deactivated' && t.isActive) return false;
      if(q){
        var match = (t.name || '').toLowerCase().includes(q) ||
                    (t.email || '').toLowerCase().includes(q) ||
                    (t.id || '').toLowerCase().includes(q) ||
                    (t.lastTicketId || '').toLowerCase().includes(q);
        if(!match) return false;
      }
      return true;
    });

    if(currentAdminView === 'table'){
      if(adminTraineesTableBody){
        if(!filtered.length){
          adminTraineesTableBody.innerHTML = '<tr><td colspan="9" class="text-center p-4 muted">No trainees found matching query.</td></tr>';
          return;
        }
        adminTraineesTableBody.innerHTML = filtered.map(function(t){
          var lastActiveStr = t.lastActive ? new Date(t.lastActive).toLocaleDateString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Never';
          var statusPill = t.isActive
            ? '<span class="status-badge status-resolved">Active</span>'
            : '<span class="status-badge status-abandoned">Deactivated</span>';
          var resRateStr = t.resolutionRate != null ? (t.resolutionRate + '%') : (t.resolvedDrills != null ? (t.resolvedDrills + '/' + t.totalDrills) : '0%');
          var frustRateStr = t.frustrationRecoveryRate != null ? (t.frustrationRecoveryRate + '%') : '100%';
          var caseDocStr = t.caseDocumentationAvgScore != null ? (t.caseDocumentationAvgScore + '/100') : '—';

          return '<tr class="admin-trainee-row' + (t.isActive ? '' : ' is-deactivated') + '">' +
            '<td><div class="admin-trainee-cell">' + avatarMarkup(t.avatarId || 'pip', 'admin-avatar') + '<div><strong>' + escapeHtml(t.name) + '</strong><div class="text-xs muted">' + escapeHtml(t.id) + '</div></div></div></td>' +
            '<td><span class="mono text-xs">' + escapeHtml(t.email) + '</span></td>' +
            '<td>' + statusPill + '</td>' +
            '<td><strong>' + (t.totalDrills || 0) + '</strong>' + (t.lastTicketId ? ('<div class="mono text-xs muted">' + escapeHtml(t.lastTicketId) + '</div>') : '') + '</td>' +
            '<td><span class="highlight-val">' + resRateStr + '</span></td>' +
            '<td>' + (t.avgWpm ? ('<strong>' + t.avgWpm + '</strong> WPM') : '<span class="muted">—</span>') + '</td>' +
            '<td>' + frustRateStr + '</td>' +
            '<td>' + caseDocStr + '</td>' +
            '<td style="text-align:right;"><div class="admin-actions-cell" style="justify-content:flex-end;">' +
              '<button type="button" class="btn btn-xs btn-primary btn-drilldown" data-id="' + escapeHtml(t.id) + '" title="Open 5-tab performance analytics cockpit">🔍 Analytics</button>' +
              '<button type="button" class="btn btn-xs btn-outline btn-resetpw" data-id="' + escapeHtml(t.id) + '" data-name="' + escapeHtml(t.name) + '" data-email="' + escapeHtml(t.email) + '" title="Manually trigger password reset">🔑 Reset</button>' +
              (t.isActive
                ? '<button type="button" class="btn btn-xs btn-ghost btn-toggle-status" data-id="' + escapeHtml(t.id) + '" data-active="0" title="Deactivate trainee account">⏸️ Deactivate</button>'
                : '<button type="button" class="btn btn-xs btn-primary btn-toggle-status" data-id="' + escapeHtml(t.id) + '" data-active="1" title="Reactivate trainee account">▶️ Activate</button>') +
            '</div></td>' +
          '</tr>';
        }).join('');
      }
    } else {
      if(adminCardsView){
        if(!filtered.length){
          adminCardsView.innerHTML = '<div class="text-center p-8 muted">No trainees found matching query.</div>';
          return;
        }
        adminCardsView.innerHTML = filtered.map(function(t){
          var lastActiveStr = t.lastActive ? new Date(t.lastActive).toLocaleDateString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Never';
          return '<div class="admin-trainee-card' + (t.isActive ? '' : ' is-deactivated') + '">' +
            '<div class="admin-card-head">' +
              avatarMarkup(t.avatarId || 'pip', 'admin-card-avatar') +
              '<div>' +
                '<h4>' + escapeHtml(t.name) + '</h4>' +
                '<span class="mono text-xs muted">' + escapeHtml(t.email) + '</span>' +
              '</div>' +
              (t.isActive ? '<span class="status-badge status-resolved">Active</span>' : '<span class="status-badge status-abandoned">Deactivated</span>') +
            '</div>' +
            '<div class="admin-card-stats">' +
              '<div><span>Drills:</span> <strong>' + (t.totalDrills || 0) + '</strong></div>' +
              '<div><span>Resolution:</span> <strong>' + (t.resolutionRate != null ? t.resolutionRate + '%' : '0%') + '</strong></div>' +
              '<div><span>Avg Speed:</span> <strong>' + (t.avgWpm ? t.avgWpm + ' WPM' : '—') + '</strong></div>' +
              '<div><span>Last Active:</span> <strong>' + lastActiveStr + '</strong></div>' +
              (t.lastTicketId ? ('<div style="grid-column:1/-1;"><span>Last Ticket:</span> <span class="mono">' + escapeHtml(t.lastTicketId) + '</span></div>') : '') +
            '</div>' +
            '<div class="admin-card-actions">' +
              '<button type="button" class="btn btn-sm btn-primary btn-drilldown" data-id="' + escapeHtml(t.id) + '">🔍 View Analytics</button>' +
              '<button type="button" class="btn btn-sm btn-outline btn-resetpw" data-id="' + escapeHtml(t.id) + '" data-name="' + escapeHtml(t.name) + '" data-email="' + escapeHtml(t.email) + '">🔑 Reset PW</button>' +
              (t.isActive
                ? '<button type="button" class="btn btn-sm btn-ghost btn-toggle-status" data-id="' + escapeHtml(t.id) + '" data-active="0">⏸️ Deactivate</button>'
                : '<button type="button" class="btn btn-sm btn-outline btn-toggle-status" data-id="' + escapeHtml(t.id) + '" data-active="1">▶️ Activate</button>') +
            '</div>' +
          '</div>';
        }).join('');
      }
    }

    // Attach click events on dynamic buttons
    document.querySelectorAll('.btn-drilldown').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-id');
        var target = adminTraineesData.find(function(item){ return item.id === id; });
        if(target){
          openMyAnalytics(target);
        }
      });
    });

    document.querySelectorAll('.btn-resetpw').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-id');
        var name = btn.getAttribute('data-name');
        var email = btn.getAttribute('data-email');
        adminTriggerPasswordReset({ id: id, name: name, email: email });
      });
    });

    document.querySelectorAll('.btn-toggle-status').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-id');
        var newActive = parseInt(btn.getAttribute('data-active'), 10);
        adminToggleTraineeStatus(id, newActive);
      });
    });
  }

  async function adminTriggerPasswordReset(trainee){
    if(!confirm('Manually trigger a password reset for ' + trainee.name + ' (' + trainee.email + ')? A secure reset code will be generated immediately.')) return;
    try {
      var res = await fetch('/api/admin/trainees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger-reset',
          key: TRAINER_PASSCODE,
          userId: trainee.id,
          email: trainee.email
        })
      });
      var data = await res.json();
      if(!res.ok){
        alert(data.error || 'Failed to trigger reset code.');
        return;
      }
      if(adminResetModal){
        adminResetModal.hidden = false;
        if(adminResetBody){
          adminResetBody.innerHTML =
            '<div class="admin-dispatch-card">' +
              '<div class="dispatch-tag">🔐 SECURITY DISPATCH FOR LEADERSHIP</div>' +
              '<p>A fresh password reset code has been generated for <strong>' + escapeHtml(trainee.name) + '</strong> (' + escapeHtml(trainee.email) + '):</p>' +
              '<div class="dispatch-code-box mono">' + escapeHtml(data.resetCode) + '</div>' +
              '<p class="text-xs muted">Valid for 60 minutes. Provide this code to the trainee to reset their password via the login screen\'s "Forgot Password" tab.</p>' +
            '</div>';
        }
      }
    } catch(err){
      alert(err.message || 'Error triggering reset code.');
    }
  }

  async function adminToggleTraineeStatus(userId, newActive){
    var actionVerb = newActive ? 'reactivate' : 'deactivate';
    if(!confirm('Are you sure you want to ' + actionVerb + ' this trainee account?')) return;
    try {
      var res = await fetch('/api/admin/trainees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-status',
          key: TRAINER_PASSCODE,
          userId: userId,
          isActive: newActive === 1
        })
      });
      var data = await res.json();
      if(!res.ok){
        alert(data.error || 'Could not update status.');
        return;
      }
      await loadAdminTrainees();
    } catch(err){
      alert(err.message || 'Error updating trainee status.');
    }
  }

  async function handleAdminInviteSubmit(ev){
    ev.preventDefault();
    var email = $('inviteEmail') ? $('inviteEmail').value.trim() : '';
    var name = $('inviteName') ? $('inviteName').value.trim() : '';
    var tempPassword = $('inviteTempPassword') ? $('inviteTempPassword').value.trim() : '';

    if(!email || !name){
      alert('Please provide trainee email and name.');
      return;
    }

    try {
      var res = await fetch('/api/admin/trainees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          key: TRAINER_PASSCODE,
          email: email,
          name: name,
          tempPassword: tempPassword,
          avatarId: 'pip'
        })
      });
      var data = await res.json();
      if(!res.ok){
        alert(data.error || 'Could not create trainee account.');
        return;
      }

      if(adminInviteForm) adminInviteForm.hidden = true;
      if(inviteSuccessCard) inviteSuccessCard.hidden = false;
      if(inviteSuccessBody){
        inviteSuccessBody.innerHTML =
          '<p>Account provisioned successfully for <strong>' + escapeHtml(data.user.name) + '</strong>.</p>' +
          '<div class="admin-dispatch-card">' +
            '<div><strong>ECE Email:</strong> <span class="mono">' + escapeHtml(data.user.email) + '</span></div>' +
            '<div><strong>Initial Password:</strong> <span class="mono">' + escapeHtml(data.tempPassword || tempPassword) + '</span></div>' +
            '<div class="text-xs muted" style="margin-top:6px;">Trainee can now sign in at the ECE login screen using these credentials.</div>' +
          '</div>';
      }
      await loadAdminTrainees();
    } catch(err){
      alert(err.message || 'Error provisioning account.');
    }
  }

  /* Admin Console Toolbar & Modal Listeners */
  if(adminConsoleBtn) adminConsoleBtn.addEventListener('click', openAdminConsole);
  if(closeAdminConsole) closeAdminConsole.addEventListener('click', closeAdminConsoleModal);
  if(adminGateUnlockBtn) adminGateUnlockBtn.addEventListener('click', unlockAdminConsole);
  if(adminGatePasscode){
    adminGatePasscode.addEventListener('keydown', function(ev){
      if(ev.key === 'Enter') unlockAdminConsole();
    });
  }

  if(adminSearchInput) adminSearchInput.addEventListener('input', renderAdminTrainees);
  if(adminStatusFilter) adminStatusFilter.addEventListener('change', renderAdminTrainees);

  if(adminViewTableBtn){
    adminViewTableBtn.addEventListener('click', function(){
      currentAdminView = 'table';
      adminViewTableBtn.classList.add('active');
      if(adminViewCardsBtn) adminViewCardsBtn.classList.remove('active');
      var tw = $('adminTableWrapper');
      if(tw) tw.hidden = false;
      if(adminCardsView) adminCardsView.hidden = true;
      renderAdminTrainees();
    });
  }
  if(adminViewCardsBtn){
    adminViewCardsBtn.addEventListener('click', function(){
      currentAdminView = 'cards';
      adminViewCardsBtn.classList.add('active');
      if(adminViewTableBtn) adminViewTableBtn.classList.remove('active');
      var tw = $('adminTableWrapper');
      if(tw) tw.hidden = true;
      if(adminCardsView) adminCardsView.hidden = false;
      renderAdminTrainees();
    });
  }

  if(adminInviteBtn){
    adminInviteBtn.addEventListener('click', function(){
      if(adminInviteModal) adminInviteModal.hidden = false;
      if(adminInviteForm) adminInviteForm.hidden = false;
      if(inviteSuccessCard) inviteSuccessCard.hidden = true;
      if($('inviteEmail')){ $('inviteEmail').value = ''; $('inviteEmail').focus(); }
      if($('inviteName')) $('inviteName').value = '';
      if($('inviteTempPassword')) $('inviteTempPassword').value = '';
    });
  }
  if(closeAdminInvite) closeAdminInvite.addEventListener('click', function(){ if(adminInviteModal) adminInviteModal.hidden = true; });
  if(cancelAdminInvite) cancelAdminInvite.addEventListener('click', function(){ if(adminInviteModal) adminInviteModal.hidden = true; });
  if(adminInviteForm) adminInviteForm.addEventListener('submit', handleAdminInviteSubmit);

  if(closeAdminResetModal) closeAdminResetModal.addEventListener('click', function(){ if(adminResetModal) adminResetModal.hidden = true; });
  if(dismissAdminResetModal) dismissAdminResetModal.addEventListener('click', function(){ if(adminResetModal) adminResetModal.hidden = true; });

  if(adminConsoleModal){
    adminConsoleModal.addEventListener('click', function(ev){
      if(ev.target === adminConsoleModal) closeAdminConsoleModal();
    });
  }
  if(adminInviteModal){
    adminInviteModal.addEventListener('click', function(ev){
      if(ev.target === adminInviteModal) adminInviteModal.hidden = true;
    });
  }
  if(adminResetModal){
    adminResetModal.addEventListener('click', function(ev){
      if(ev.target === adminResetModal) adminResetModal.hidden = true;
    });
  }

  /* Simulation Mode Switcher Listeners */
  if(modeChatBtn) modeChatBtn.addEventListener('click', function(){ setSimulationMode('chat'); });
  if(modeEmailBtn) modeEmailBtn.addEventListener('click', function(){ setSimulationMode('email'); });
  if(emailFastForwardBtn){
    emailFastForwardBtn.addEventListener('click', function(){
      if(emailPendingBanner) emailPendingBanner.hidden = true;
    });
  }

  setInterval(function(){
    updateCustomerFollowUps();
    updateReplyTimer();
  }, 1000);
  historyRefreshTimer = setInterval(function(){
    if(historyModal.hidden) return;
    if(historyDetail && historyDetail.live){
      viewSession(historyDetail.id, true, true, true);
    } else if(trainerAccess){
      openHistory(true);
    }
  }, 3000);

  renderAvatarChoices();
  if(!checkExistingAuth()){
    setAuthTab('signIn');
  }
})();
