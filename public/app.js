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

  var TRAINER_PASSCODE = 'wyzeleadership';
  var loginProfile = null;
  var workspaceInitialized = false;
  var simMode = 'chat'; // 'chat' or 'email'
  var activeComposerTab = 'public'; // 'public' or 'internal'

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
    "Indoor cameras: Wyze Cam v3, Wyze Cam v3 Pro, Wyze Cam v2, Wyze Cam OG, Wyze Cam Pan v2, Wyze Cam Indoor",
    "Battery / outdoor cameras: Wyze Cam Outdoor v2, Wyze Cam Outdoor v1, Wyze Battery Cam Pro, Wyze Cam Floodlight",
    "Video doorbells: Wyze Video Doorbell v2, Wyze Video Doorbell Pro, Wyze Video Doorbell v1",
    "Home security & locks: Wyze Sense v2 kit, Wyze Lock, Wyze Lock Bolt, Wyze Smart Lock, Wyze Siren",
    "Smart home & lighting: Wyze Bulb Color, Wyze Bulb White, Wyze Light Strip, Wyze Plug, Wyze Plug Outdoor",
    "Climate & sensors: Wyze Thermostat, Wyze Sense Thermostat, Wyze Temp/Humidity Sensor, Wyze Leak sensor",
    "Robotics & wellness: Wyze Robot Vacuum, Wyze Scale, Wyze Buds, Wyze Headphones"
  ].join('\n');

  var CUSTOMER_FIRST_NAMES = ['Avery','Bailey','Casey','Drew','Ellis','Emery','Finley','Harper','Jamie','Jordan','Kai','Logan','Micah','Morgan','Parker','Quinn','Reese','Riley','Rowan','Sage','Taylor','Alex','Amari','Blake','Cameron','Dakota','Eden','Frankie','Kendall','Marley','Remy','Shiloh'];
  var CUSTOMER_LAST_NAMES = ['Alden','Arbor','Ashby','Bennett','Briar','Calloway','Cedar','Chen','Cortez','Dawson','Ellison','Foster','Garcia','Hayes','Imani','Jensen','Kim','Lennox','Marin','Mori','Navarro','Oakley','Park','Reed','Rivera','Sawyer','Sato','Shah','Solano','Tanaka','Valdez','Vega','Wells','Whitaker'];

  function makeFictionalName(){
    var first = CUSTOMER_FIRST_NAMES[Math.floor(Math.random() * CUSTOMER_FIRST_NAMES.length)];
    var last = CUSTOMER_LAST_NAMES[Math.floor(Math.random() * CUSTOMER_LAST_NAMES.length)];
    return first + ' ' + last;
  }

  function makeFakeCustomerDetails(persona){
    function token(len){
      return Math.random().toString(16).slice(2).toUpperCase().padEnd(len, '0').slice(0, len);
    }
    var twoDigit = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    var month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    var day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    persona.email = 'customer-' + token(8).toLowerCase() + '@example.invalid';
    persona.phone = '+1 (202) 555-01' + twoDigit;
    persona.shippingAddress = (100 + Math.floor(Math.random() * 900)) + ' Example Lane, Sampleville, ZZ 00000';
    persona.macAddress = '02:' + token(2) + ':' + token(2) + ':' + token(2) + ':' + token(2) + ':' + token(2);
    persona.orderNumber = 'TEST-WZ-' + token(8);
    persona.serialNumber = 'TEST-SN-' + token(8);
    persona.purchaseDate = '2025-' + month + '-' + day;
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
  var categorySelect = $('categorySelect');
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
  var historyRefreshTimer = null;

  /* ---------- Storage Helpers ---------- */
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
        sessionId: opts.sessionId
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
    updateZdViewsCounter();
  }

  var saveTimer = null;
  function scheduleSave(s){
    s = (s && s.sessionId) ? s : state;
    if(s === state) saveIndicator.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ doSave(s); }, 500);
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
    clearChatBtn.disabled = state.busy || !hasCust || state.ended;
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
      var who = isAgent ? 'Agent' : state.persona.name;
      timeDiv.textContent = who + ' · ' + fmtTime(m.ts) + meta;

      row.appendChild(contentDiv);
      row.appendChild(timeDiv);
      chatLog.appendChild(row);
    });
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function renderFeedback(){
    if(state.feedback){
      feedbackBox.hidden = false;
      feedbackContent.textContent = state.feedback;
    } else {
      feedbackBox.hidden = true;
    }
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
    var rows = [
      ['Name', p.name, false],
      ['Email', p.email, false],
      ['Phone', p.phone, false],
      ['Shipping address', p.shippingAddress, false],
      ['Product', p.product, false],
      ['MAC address', p.macAddress, true],
      ['Order / RMA #', p.orderNumber, true],
      ['Serial number', p.serialNumber, true],
      ['Purchase date', p.purchaseDate, false],
      ['Real root cause & ideal resolution', p.hiddenSummary, false]
    ];
    answerKeyContent.innerHTML = rows.map(function(r){
      return '<dt>' + escapeHtml(r[0]) + '</dt><dd' + (r[2] ? ' class="mono"' : '') + '>' + escapeHtml(r[1] || '—') + '</dd>';
    }).join('');
  }

  function updateCaseLabel(){
    if(!caseOpen) return;
    var modeLabel = simMode === 'email' ? 'Email Ticket ' : 'Chat ';
    caseTabLabel.textContent = ' • ' + modeLabel + (activeIndex + 1) + (state.persona ? (' — ' + state.persona.name) : ' (idle)');
  }

  function openCase(){
    caseOpen = true;
    casePane.hidden = false;
    updateCaseLabel();
  }
  function closeCaseFn(){
    caseOpen = false;
    casePane.hidden = true;
  }

  /* ---------- Mode Switching: Live Chat vs Email Ticket ---------- */
  function switchMode(newMode){
    if(simMode === newMode) return;
    captureNotes();
    doSave(state);
    simMode = newMode;
    if(simMode === 'email'){
      modeEmailBtn.classList.add('active');
      modeChatBtn.classList.remove('active');
      twoChatsToggleWrap.hidden = true;
      timerToggleWrap.hidden = true;
      replyTimer.hidden = true;
      speedBar.hidden = true;
      zdComposerNav.hidden = false;
      zdSubmitBar.hidden = false;
      emailTicketHeader.hidden = false;
      sessions = emailSessions;
      activeIndex = activeEmailIdx;
    } else {
      modeChatBtn.classList.add('active');
      modeEmailBtn.classList.remove('active');
      twoChatsToggleWrap.hidden = false;
      timerToggleWrap.hidden = false;
      replyTimer.hidden = !timerOn;
      speedBar.hidden = false;
      zdComposerNav.hidden = true;
      zdSubmitBar.hidden = true;
      emailTicketHeader.hidden = true;
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
  }

  /* ---------- Zendesk Ticket Journey & Pending Intervals ---------- */
  function setLinearState(newStatus){
    state.status = newStatus;
    if(newStatus === 'PENDING'){
      scheduleEmailReply();
    } else {
      state.emailNextReplyTs = null;
    }
    renderPersonaBar();
    renderTabs();
    updatePendingBanner();
    scheduleSave(state);
  }

  function scheduleEmailReply(){
    var minM = parseInt(emailMinMins.value, 10) || 30;
    var maxM = parseInt(emailMaxMins.value, 10) || 120;
    if(minM > maxM) maxM = minM + 30;
    var randM = Math.floor(minM + Math.random() * (maxM - minM));
    state.emailNextReplyTs = Date.now() + randM * 60 * 1000;
    updatePendingBanner();
  }

  function updatePendingBanner(){
    if(!emailPendingBanner) return;
    if(simMode !== 'email' || state.status !== 'PENDING' || !state.emailNextReplyTs || state.ended){
      emailPendingBanner.hidden = true;
      return;
    }
    emailPendingBanner.hidden = false;
    var diffMs = state.emailNextReplyTs - Date.now();
    var minsRemaining = Math.max(1, Math.round(diffMs / 60000));
    emailPendingMins.textContent = minsRemaining + ' minutes';
    emailClockStamp.textContent = new Date(state.emailNextReplyTs).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  }

  async function triggerCustomerReply(s){
    if(s.busy || s.ended || !s.persona) return;
    setBusy(true, s);
    try {
      var systemPrompt = buildSystemPrompt(s);
      var transcript = s.messages.filter(function(m){ return !m.internalNote; }).map(function(m){
        return (m.role === 'agent' ? 'Agent: ' : 'Customer: ') + m.text;
      }).join('\n');

      var userPrompt = "Transcript so far:\n" + transcript + "\n\nReply directly as the customer. Keep your reply natural and conversational.";
      var schema = {
        type: "object",
        properties: {
          message: { type: "string" },
          status: { type: "string", enum: simMode === 'email' ? ["OPEN", "PENDING", "ON_HOLD", "SOLVED"] : ["OPEN", "ESCALATED", "RESOLVED"] }
        },
        required: ["message", "status"],
        additionalProperties: false
      };

      var raw = await runModel([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], { schema: schema, sessionId: s.sessionId });

      var parsed;
      try { parsed = JSON.parse(raw); } catch(e){
        parsed = { message: "Thank you for the update. I verified and the issue is progressing.", status: simMode === 'email' ? 'OPEN' : 'OPEN' };
      }

      var now = Date.now();
      s.messages.push({
        role: 'customer',
        text: parsed.message,
        ts: now,
        gapSec: null
      });

      // Customer reply reopens a Pending or Solved ticket back to OPEN in Zendesk
      if(simMode === 'email'){
        s.status = 'OPEN';
        s.emailNextReplyTs = null;
      } else {
        if(parsed.status) s.status = parsed.status;
      }

      if(s === state){
        renderMessages();
        renderPersonaBar();
        renderTabs();
        updatePendingBanner();
      }
      scheduleSave(s);
    } catch(err){
      console.error('Customer reply error:', err);
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
      }
    });
  }

  /* ---------- Prompt Builders ---------- */
  function buildSystemPrompt(s){
    var p = s.persona;
    return [
      "You are roleplaying as a customer named " + p.name + " in a " + (simMode === 'email' ? 'support email thread' : 'live chat') + " with a support agent for Wyze.",
      "Stay strictly in character. Do not say you are an AI or virtual assistant.",
      "Persona facts (reveal only when asked):",
      "- Name: " + p.name,
      "- Email: " + p.email,
      "- Phone: " + p.phone,
      "- Address: " + p.shippingAddress,
      "- Product: " + p.product,
      "- MAC Address: " + p.macAddress,
      "- Order Number: " + p.orderNumber,
      "- Serial Number: " + p.serialNumber,
      "- Issue: " + p.issueCategory,
      "- Emotional state: " + (p.emotionalState || 'Normal'),
      simMode === 'email' ? "For emails: you can freely write your response in however way you want without requiring strict email formatting." : "For live chat: keep messages concise and natural.",
      "The underlying issue details: " + p.hiddenSummary
    ].join('\n');
  }

  /* ---------- Start Scenario ---------- */
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

    var category = CATEGORY_LABELS[categorySelect.value] || CATEGORY_LABELS.random;
    var emotion = EMOTION_LABELS[emotionSelect.value] || EMOTION_LABELS.random;

    var system = [
      "You generate one fictional customer persona and an opening " + (simMode === 'email' ? 'support email' : 'live-chat message') + " for a Wyze customer support simulator.",
      "Hard rules:",
      "- All personal details must be completely synthetic (e.g. @example.invalid, 202-555-01xx).",
      "- Pick ONE specific, real-sounding Wyze product from this catalog: " + WYZE_CATALOG,
      "- Scenario type: " + category,
      "- Emotional mood: " + emotion,
      "- hiddenSummary: 2-3 sentences on the real root cause and ideal SOP troubleshooting steps.",
      "- openingMessage: Opening inquiry written naturally as a regular customer."
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
        subject: { type: "string" },
        resolutionSteps: { type: "array", items: { type: "string" } }
      },
      required: ["name","email","phone","shippingAddress","product","macAddress","orderNumber","serialNumber","purchaseDate","issueCategory","emotionalState","hiddenSummary","openingMessage"],
      additionalProperties: false
    };

    try {
      s.sessionId = genId('sess');
      s.ticketId = genTicketId();
      var raw = await runModel([
        { role: "system", content: system },
        { role: "user", content: "Generate the fictional persona and opening inquiry now." }
      ], { schema: schema, sessionId: s.sessionId });

      var persona = JSON.parse(raw);
      persona.name = persona.name || makeFictionalName();
      makeFakeCustomerDetails(persona);

      s.persona = persona;
      s.createdAt = Date.now();
      s.status = simMode === 'email' ? 'NEW' : 'OPEN';
      s.emailSubject = persona.subject || ('Help with ' + persona.product + ' - ' + persona.issueCategory);
      s.messages = [{ role: 'customer', text: persona.openingMessage, ts: Date.now(), gapSec: null }];
      s.traineeName = loginProfile ? loginProfile.name : '';
      s.avatarId = loginProfile ? loginProfile.avatarId : 'pip';

      clearCaseFields();
      renderPersonaBar();
      renderMessages();
      renderTabs();
      renderAnswerKey();
      renderFeedback();
      updatePendingBanner();
      updateCaseLabel();
      scheduleSave(s);
    } catch(e){
      chatLog.innerHTML = '';
      chatLog.appendChild(emptyState);
      showError(e.message || 'Could not start customer scenario.', startScenario);
    } finally {
      setBusy(false, s);
    }
  }

  /* ---------- Send Agent Message ---------- */
  async function sendAgentMessage(text, wpm){
    var s = state;
    if(!text || s.busy || !s.persona) return;
    clearError();

    // Check if Internal Note in Email mode
    if(simMode === 'email' && activeComposerTab === 'internal'){
      s.messages.push({
        role: 'agent',
        text: text,
        ts: Date.now(),
        internalNote: true
      });
      renderMessages();
      scheduleSave(s);
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

    // Email Mode: update status based on submit action selector
    if(simMode === 'email'){
      var submitState = zdSubmitActionSelect.value || 'PENDING';
      setLinearState(submitState);
      scheduleSave(s);
      return;
    }

    // Live Chat Mode: trigger immediate customer reply
    setBusy(true, s);
    try {
      await triggerCustomerReply(s);
    } catch(e){
      showError(e.message || "Customer failed to respond. Please try sending again.", function(){ sendAgentMessage(text, wpm); });
    } finally {
      setBusy(false, s);
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
      var k = (data.analytics && data.analytics.kpis) || {};

      $('paKpiWpm').textContent = k.avgWpm ? k.avgWpm + ' WPM' : '—';
      $('paKpiResp').textContent = k.avgResponseTimeSec ? k.avgResponseTimeSec + 's' : '—';
      $('paKpiResRate').textContent = (k.resolvedRate ?? 0) + '%';
      $('paKpiResCount').textContent = (k.resolvedCount || 0) + ' resolved';
      $('paKpiAbandonRate').textContent = (k.abandonmentRate ?? 0) + '%';
      $('paKpiAbandonCount').textContent = (k.abandonedCount || 0) + ' breaches';
      $('paKpiChurnRate').textContent = (k.frustrationRecoveryRate ?? 100) + '%';
      $('paKpiDocRate').textContent = (k.caseDocCompletionRate ?? 0) + '%';

      // Speed Distribution Bars
      var sDist = (data.analytics && data.analytics.speedDistribution) || { fast:0, standard:0, slow:0 };
      var sTotal = (sDist.fast + sDist.standard + sDist.slow) || 1;
      $('paSpeedDistBars').innerHTML = [
        '<div class="dist-row"><span>Fast (≥60 WPM)</span><div class="dist-bar"><div class="bar-fill teal" style="width:' + Math.round((sDist.fast / sTotal)*100) + '%"></div></div><span>' + sDist.fast + '</span></div>',
        '<div class="dist-row"><span>Standard (40-59 WPM)</span><div class="dist-bar"><div class="bar-fill blue" style="width:' + Math.round((sDist.standard / sTotal)*100) + '%"></div></div><span>' + sDist.standard + '</span></div>',
        '<div class="dist-row"><span>Slow (&lt;40 WPM)</span><div class="dist-bar"><div class="bar-fill coral" style="width:' + Math.round((sDist.slow / sTotal)*100) + '%"></div></div><span>' + sDist.slow + '</span></div>'
      ].join('');

      // Response Time Distribution Bars
      var rDist = (data.analytics && data.analytics.responseTimeDistribution) || { under30s:0, s30to60:0, s60to120:0, over120s:0 };
      var rTotal = (rDist.under30s + rDist.s30to60 + rDist.s60to120 + rDist.over120s) || 1;
      $('paRespDistBars').innerHTML = [
        '<div class="dist-row"><span>Under 30s</span><div class="dist-bar"><div class="bar-fill teal" style="width:' + Math.round((rDist.under30s / rTotal)*100) + '%"></div></div><span>' + rDist.under30s + '</span></div>',
        '<div class="dist-row"><span>30s - 60s</span><div class="dist-bar"><div class="bar-fill blue" style="width:' + Math.round((rDist.s30to60 / rTotal)*100) + '%"></div></div><span>' + rDist.s30to60 + '</span></div>',
        '<div class="dist-row"><span>60s - 120s (Warning)</span><div class="dist-bar"><div class="bar-fill amber" style="width:' + Math.round((rDist.s60to120 / rTotal)*100) + '%"></div></div><span>' + rDist.s60to120 + '</span></div>',
        '<div class="dist-row"><span>Over 120s (Critical)</span><div class="dist-bar"><div class="bar-fill coral" style="width:' + Math.round((rDist.over120s / rTotal)*100) + '%"></div></div><span>' + rDist.over120s + '</span></div>'
      ].join('');

      // Abandoned Sessions Table
      var abRows = (data.analytics && data.analytics.abandonedSessions) || [];
      if(abRows.length === 0){
        $('paAbandonedTableBody').innerHTML = '<tr><td colspan="4" class="muted text-center" style="padding:16px;">No 7-minute breaches recorded! Excellent chat hold management.</td></tr>';
      } else {
        $('paAbandonedTableBody').innerHTML = abRows.map(function(item){
          return '<tr><td><b>' + escapeHtml(item.ticketId) + '</b></td><td>' + escapeHtml(item.category) + '</td><td>' + Math.round((item.idleSec || 420) / 60) + ' mins idle</td><td><span class="text-coral">' + escapeHtml(item.text) + '</span></td></tr>';
        }).join('');
      }

      // Recent Transcripts List
      renderRecentTranscripts(data.analytics.recentSessions || []);

    } catch(err){
      console.error('Failed to load trainee analytics:', err);
    }
  }

  function renderRecentTranscripts(sessionsList){
    var container = $('paSessionsList');
    if(!container) return;
    if(sessionsList.length === 0){
      container.innerHTML = '<div class="muted text-center" style="padding:20px;">No recorded practice sessions yet.</div>';
      return;
    }
    container.innerHTML = sessionsList.map(function(s){
      return '<div class="pa-session-item" data-id="' + s.id + '">' +
        '<div class="pa-si-header"><strong>' + escapeHtml(s.ticketId || s.id) + '</strong><span class="zd-badge zd-badge-' + (s.status||'open').toLowerCase() + '">' + s.status + '</span></div>' +
        '<div class="pa-si-sub">' + escapeHtml(s.product || 'Wyze Product') + ' · ' + (s.avgWpm ? s.avgWpm + ' WPM' : 'Untimed') + '</div>' +
        '<div class="pa-si-date">' + new Date(s.createdAt).toLocaleDateString() + ' ' + fmtTime(s.createdAt) + '</div>' +
        '</div>';
    }).join('');

    container.querySelectorAll('.pa-session-item').forEach(function(el){
      el.addEventListener('click', async function(){
        container.querySelectorAll('.pa-session-item').forEach(function(i){ i.classList.remove('selected'); });
        el.classList.add('selected');
        var sId = el.getAttribute('data-id');
        var res = await fetch('/api/session?id=' + encodeURIComponent(sId));
        if(res.ok){
          var resData = await res.json();
          renderTranscriptDetail(resData.data);
        }
      });
    });
  }

  function renderTranscriptDetail(sData){
    var view = $('paTranscriptView');
    if(!view || !sData) return;
    var msgs = sData.messages || [];
    var html = '<div class="pa-detail-header"><h3>Transcript: ' + escapeHtml(sData.ticketId || sData.id) + '</h3><p class="muted">' + (sData.persona ? escapeHtml(sData.persona.name + ' · ' + sData.persona.product) : '') + '</p></div>';
    html += '<div class="pa-transcript-msgs">';
    msgs.forEach(function(m){
      var isAgent = m.role === 'agent';
      html += '<div class="msg-row ' + (isAgent ? 'from-agent' : 'from-customer') + '">' +
        '<div class="msg-content"><div class="bubble">' + escapeHtml(m.text) + '</div></div>' +
        '<div class="msg-time">' + (isAgent ? 'Agent' : 'Customer') + ' · ' + fmtTime(m.ts) + '</div></div>';
    });
    html += '</div>';
    view.innerHTML = html;
  }

  async function triggerAiInsights(){
    $('paExecutiveSummary').textContent = 'AI Coach synthesizing your performance metrics across all Wyze scenarios…';
    $('refreshAiBtn').disabled = true;
    try {
      var aRes = await fetch('/api/agent/analytics?user=' + encodeURIComponent(loginProfile.id));
      var aData = await aRes.json();
      var kpis = (aData.analytics && aData.analytics.kpis) || {};

      var res = await fetch('/api/agent/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: loginProfile.name,
          kpis: kpis,
          categoryBreakdown: aData.analytics.categoryBreakdown || []
        })
      });
      if(res.ok){
        var data = await res.json();
        var ins = data.insights || {};
        $('paOverallGrade').textContent = ins.overallGrade || 'Solid';
        $('paExecutiveSummary').textContent = ins.executiveSummary || 'Good progress across support drills.';
        $('paStrengthsList').innerHTML = (ins.strengths || []).map(function(s){ return '<li>' + escapeHtml(s) + '</li>'; }).join('');
        $('paGrowthList').innerHTML = (ins.growthAreas || []).map(function(s){ return '<li>' + escapeHtml(s) + '</li>'; }).join('');
        $('paChurnAdvice').textContent = ins.churnPreventionAdvice || '';
        $('paSpeedAdvice').textContent = ins.slaSpeedAdvice || '';
        $('paNextGoal').textContent = ins.nextDrillGoal || '';
      }
    } catch(e){
      console.error('AI Insights error:', e);
    } finally {
      $('refreshAiBtn').disabled = false;
    }
  }

  /* ---------- Leadership Admin Console ---------- */
  var adminUnlocked = false;
  var currentTrainees = [];

  function openAdminConsole(){
    adminConsoleModal.hidden = false;
    if(!adminUnlocked){
      $('adminPasscodeGate').hidden = false;
      $('adminDashboardView').hidden = true;
      $('adminGatePasscode').value = '';
      $('adminGateStatus').textContent = '';
      $('adminGatePasscode').focus();
    } else {
      loadAdminTrainees();
    }
  }

  async function unlockAdminGate(){
    var code = $('adminGatePasscode').value.trim();
    if(code.toLowerCase() === TRAINER_PASSCODE){
      adminUnlocked = true;
      $('adminPasscodeGate').hidden = true;
      $('adminDashboardView').hidden = false;
      loadAdminTrainees();
    } else {
      $('adminGateStatus').textContent = 'Incorrect leadership passcode.';
    }
  }

  async function loadAdminTrainees(){
    try {
      var res = await fetch('/api/admin/trainees?key=' + encodeURIComponent(TRAINER_PASSCODE));
      if(!res.ok) return;
      var data = await res.json();
      currentTrainees = data.trainees || [];
      renderAdminTrainees();
    } catch(e){
      console.error('Admin trainees fetch error:', e);
    }
  }

  function renderAdminTrainees(){
    var query = $('adminSearchInput').value.trim().toLowerCase();
    var filter = $('adminStatusFilter').value;

    var filtered = currentTrainees.filter(function(t){
      var matchQ = !query || t.name.toLowerCase().includes(query) || t.email.toLowerCase().includes(query);
      var matchF = filter === 'all' || (filter === 'active' && t.isActive) || (filter === 'deactivated' && !t.isActive);
      return matchQ && matchF;
    });

    $('adminTotalTraineesCount').textContent = currentTrainees.length;
    $('adminActiveCount').textContent = currentTrainees.filter(function(t){ return t.isActive; }).length;

    var tbody = $('adminTraineesTableBody');
    if(filtered.length === 0){
      tbody.innerHTML = '<tr><td colspan="9" class="muted text-center py-4">No matching trainees found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function(t){
      return '<tr>' +
        '<td><b>' + escapeHtml(t.name) + '</b><br><small class="muted">' + escapeHtml(t.email) + '</small></td>' +
        '<td><span class="zd-badge ' + (t.isActive ? 'zd-badge-solved' : 'zd-badge-onhold') + '">' + (t.isActive ? 'ACTIVE' : 'DEACTIVATED') + '</span></td>' +
        '<td>' + (t.lastActiveAt ? fmtTime(t.lastActiveAt) + '<br><small class="muted">' + (t.lastTicketId || '') + '</small>' : 'Never') + '</td>' +
        '<td>' + t.totalDrills + '</td>' +
        '<td>' + t.resolvedRate + '%</td>' +
        '<td>' + (t.avgWpm ? t.avgWpm + ' WPM' : '—') + '</td>' +
        '<td>' + t.frustrationRecoveryRate + '%</td>' +
        '<td>' + t.caseDocScore + '%</td>' +
        '<td style="text-align:right;">' +
          '<button type="button" class="btn btn-sm btn-ghost admin-drill-btn" data-id="' + t.id + '" title="View Dedicated Analytics">📊 Drill Down</button> ' +
          '<button type="button" class="btn btn-sm btn-ghost admin-reset-btn" data-id="' + t.id + '" title="Generate Password Reset">🔑 Reset PW</button> ' +
          '<button type="button" class="btn btn-sm ' + (t.isActive ? 'btn-ghost' : 'btn-primary') + ' admin-toggle-btn" data-id="' + t.id + '" data-active="' + (t.isActive ? '0':'1') + '">' + (t.isActive ? 'Deactivate' : 'Activate') + '</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    // Attach actions
    tbody.querySelectorAll('.admin-drill-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var uId = btn.getAttribute('data-id');
        var trainee = currentTrainees.find(function(x){ return x.id === uId; });
        if(trainee){
          loginProfile = { id: trainee.id, name: trainee.name, email: trainee.email, avatarId: trainee.avatarId };
          loadTraineeAnalytics();
          profileAnalyticsModal.hidden = false;
        }
      });
    });

    tbody.querySelectorAll('.admin-reset-btn').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var uId = btn.getAttribute('data-id');
        var res = await fetch('/api/admin/trainees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: TRAINER_PASSCODE, action: 'trigger-reset', userId: uId })
        });
        if(res.ok){
          var resData = await res.json();
          $('adminResetBody').innerHTML = '<p>A 6-digit password reset code has been issued for <b>' + escapeHtml(resData.name) + '</b> (' + escapeHtml(resData.email) + '):</p>' +
            '<div class="admin-code-box"><code>' + resData.code + '</code></div>' +
            '<p class="muted">Provide this verification code directly to the trainee agent to allow them to reset their credentials.</p>';
          adminResetModal.hidden = false;
        }
      });
    });

    tbody.querySelectorAll('.admin-toggle-btn').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var uId = btn.getAttribute('data-id');
        var wantActive = btn.getAttribute('data-active') === '1';
        await fetch('/api/admin/trainees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: TRAINER_PASSCODE, action: 'toggle-status', userId: uId, active: wantActive })
        });
        loadAdminTrainees();
      });
    });
  }

  /* ---------- Zendesk Views Modal ---------- */
  function openZdViews(){
    zdViewsModal.hidden = false;
    renderZdViewsTable('all');
  }

  function updateZdViewsCounter(){
    var count = emailSessions.filter(function(s){ return !!s.persona; }).length;
    if(zdViewsCounter) zdViewsCounter.textContent = count;
  }

  function renderZdViewsTable(filter){
    var tbody = $('zdViewsTableBody');
    if(!tbody) return;
    var allTickets = [];

    // Include all active email sessions
    emailSessions.forEach(function(s, idx){
      if(s.persona){
        allTickets.push({ session: s, index: idx, id: s.sessionId, ticketId: s.ticketId, status: s.status, subject: s.emailSubject || s.persona.issueCategory, name: s.persona.name, updated: s.createdAt });
      }
    });

    var filtered = allTickets.filter(function(t){
      return filter === 'all' || t.status === filter;
    });

    $('zdFilterAllCount').textContent = allTickets.length;
    ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'SOLVED'].forEach(function(st){
      var el = $('zdFilter' + st.replace('_', '') + 'Count');
      if(el) el.textContent = allTickets.filter(function(x){ return x.status === st; }).length;
    });

    if(filtered.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" class="muted text-center" style="padding:28px;text-align:center;">No tickets in this view yet.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function(t){
      return '<tr>' +
        '<td><span class="zd-badge zd-badge-' + t.status.toLowerCase().replace('_', '') + '">' + t.status + '</span></td>' +
        '<td><b>' + escapeHtml(t.ticketId) + '</b></td>' +
        '<td>' + escapeHtml(t.subject) + '</td>' +
        '<td>' + escapeHtml(t.name) + '</td>' +
        '<td>' + fmtTime(t.updated) + '</td>' +
        '<td style="text-align:right;"><button type="button" class="btn btn-sm btn-primary zd-open-ticket-btn" data-idx="' + t.index + '">Open Ticket</button></td>' +
        '</tr>';
    }).join('');

    tbody.querySelectorAll('.zd-open-ticket-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        activateSlot(idx);
        zdViewsModal.hidden = true;
      });
    });
  }

  /* ---------- Authentication Flows ---------- */
  function setupAuthHandlers(){
    // Tabs
    tabSignIn.addEventListener('click', function(){
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      signInView.hidden = false;
      signUpView.hidden = true;
      forgotPasswordView.hidden = true;
      signInSwitchRow.hidden = false;
      signUpSwitchRow.hidden = true;
      forgotSwitchRow.hidden = true;
      setStatus('Sign in with your registered ECE credentials.');
    });

    tabSignUp.addEventListener('click', function(){
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      signUpView.hidden = false;
      signInView.hidden = true;
      forgotPasswordView.hidden = true;
      signUpSwitchRow.hidden = false;
      signInSwitchRow.hidden = true;
      forgotSwitchRow.hidden = true;
      setStatus('Register your unique trainee account with your ECE email.');
    });

    forgotPassLink.addEventListener('click', function(){
      forgotPasswordView.hidden = false;
      signInView.hidden = true;
      signUpView.hidden = true;
      forgotSwitchRow.hidden = false;
      signInSwitchRow.hidden = true;
      signUpSwitchRow.hidden = true;
      forgotStep1.hidden = false;
      forgotStep2.hidden = true;
      setStatus('Enter your ECE email to reset your credentials.');
    });

    switchToSignUp.addEventListener('click', function(){ tabSignUp.click(); });
    switchToSignIn.addEventListener('click', function(){ tabSignIn.click(); });
    backToSignInFromForgot.addEventListener('click', function(){ tabSignIn.click(); });
    cancelForgotBtn.addEventListener('click', function(){ tabSignIn.click(); });

    // Multi-step signup
    continueSignUpBtn.addEventListener('click', function(){
      var email = $('signUpEmail').value.trim();
      var name = $('signUpName').value.trim();
      var p1 = $('signUpPassword').value;
      var p2 = $('signUpRepeatPassword').value;

      if(!email || !name || !p1){
        setStatus('Please fill out all required account fields.', true);
        return;
      }
      if(p1.length < 6){
        setStatus('Password must be at least 6 characters.', true);
        return;
      }
      if(p1 !== p2){
        setStatus('Passwords do not match. Please re-enter.', true);
        return;
      }
      signUpDetailsStep.hidden = true;
      signUpAvatarStep.hidden = false;
      setStatus('Choose your mascot avatar to finalize account setup.');
    });

    backToSignUpDetailsBtn.addEventListener('click', function(){
      signUpAvatarStep.hidden = true;
      signUpDetailsStep.hidden = false;
    });

    // Sign In Submit
    signInForm.addEventListener('submit', async function(ev){
      ev.preventDefault();
      var email = $('signInEmail').value.trim();
      var password = $('signInPassword').value;
      setStatus('Authenticating with ECE directory…');

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
    signUpForm.addEventListener('submit', async function(ev){
      ev.preventDefault();
      var email = $('signUpEmail').value.trim();
      var name = $('signUpName').value.trim();
      var password = $('signUpPassword').value;
      var selectedAvatar = signUpForm.querySelector('input[name="signUpAvatar"]:checked');
      var avatarId = selectedAvatar ? selectedAvatar.value : 'pip';

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
    sendResetCodeBtn.addEventListener('click', async function(){
      var email = $('forgotEmail').value.trim();
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
        forgotStep1.hidden = true;
        forgotStep2.hidden = false;
        dispatchBody.innerHTML = '<p>Verification code issued: <strong>' + data.code + '</strong></p><small class="muted">Expires in 15 minutes.</small>';
        setStatus('Code dispatched. Enter your code and new password.');
      } catch(err){
        setStatus('Password reset service unavailable.', true);
      }
    });

    backToForgotStep1Btn.addEventListener('click', function(){
      forgotStep2.hidden = true;
      forgotStep1.hidden = false;
    });

    forgotPasswordForm.addEventListener('submit', async function(ev){
      ev.preventDefault();
      var email = $('forgotEmail').value.trim();
      var code = $('resetCode').value.trim();
      var newPw = $('newPassword').value;
      var repeatPw = $('repeatNewPassword').value;

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

    agentIdentity.hidden = false;
    agentIdentity.innerHTML = avatarMarkup(user.avatarId || 'pip', 'identity-avatar') + '<span>' + escapeHtml(user.name) + '</span>';
    fTraineeName.value = user.name;

    initializeWorkspace();
  }

  function initializeWorkspace(){
    if(workspaceInitialized) return;
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
    modeChatBtn.addEventListener('click', function(){ switchMode('chat'); });
    modeEmailBtn.addEventListener('click', function(){ switchMode('email'); });

    // Scenario & Controls
    newScenarioBtn.addEventListener('click', startScenario);
    feedbackBtn.addEventListener('click', getFeedback);
    endBtn.addEventListener('click', endConversation);
    caseBtn.addEventListener('click', openCase);
    closeCase.addEventListener('click', closeCaseFn);

    trainerModeToggle.addEventListener('change', function(){
      trainerMode = trainerModeToggle.checked;
      renderAnswerKey();
    });

    twoChatsToggle.addEventListener('change', function(){
      twoChats = twoChatsToggle.checked;
      if(twoChats && chatSessions.length < 2){
        chatSessions.push(newSession('chat'));
      }
      renderTabs();
    });

    timerToggle.addEventListener('change', function(){
      timerOn = timerToggle.checked;
      replyTimer.hidden = !timerOn;
    });

    // Theme Switcher with smooth transition
    themeSelect.addEventListener('change', function(){
      document.documentElement.setAttribute('data-theme', themeSelect.value);
    });

    // Zendesk Composer Navigation
    zdNavPublicReply.addEventListener('click', function(){
      activeComposerTab = 'public';
      zdNavPublicReply.classList.add('active');
      zdNavInternalNote.classList.remove('active');
      agentInput.placeholder = 'Type your public email reply to the customer… (Enter to send)';
    });

    zdNavInternalNote.addEventListener('click', function(){
      activeComposerTab = 'internal';
      zdNavInternalNote.classList.add('active');
      zdNavPublicReply.classList.remove('active');
      agentInput.placeholder = 'Type an internal note (only visible to team members)… (Enter to save note)';
    });

    // Zendesk Linear Status Select in Header
    zdStatusSelect.addEventListener('change', function(){
      setLinearState(zdStatusSelect.value);
    });

    // Zendesk Fast Forward & Advance Time Button
    emailFastForwardBtn.addEventListener('click', async function(){
      if(state.busy || state.ended || !state.persona) return;
      emailPendingBanner.hidden = true;
      await triggerCustomerReply(state);
    });

    // Zendesk Views Modal
    openZdViewsBtn.addEventListener('click', openZdViews);
    closeZdViewsBtn.addEventListener('click', function(){ zdViewsModal.hidden = true; });
    dismissZdViewsBtn.addEventListener('click', function(){ zdViewsModal.hidden = true; });

    document.querySelectorAll('.zd-filter-pill').forEach(function(pill){
      pill.addEventListener('click', function(){
        document.querySelectorAll('.zd-filter-pill').forEach(function(p){ p.classList.remove('active'); });
        pill.classList.add('active');
        var f = pill.getAttribute('data-filter');
        renderZdViewsTable(f);
      });
    });

    zdNewEmailBtn.addEventListener('click', startScenario);

    // Chat form submit
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

    // Case Fields
    Object.keys(caseFields).forEach(function(k){
      caseFields[k].addEventListener('input', scheduleSave);
    });

    // Quick Chips
    document.querySelectorAll('.quick-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        categorySelect.value = chip.dataset.category || 'random';
        emotionSelect.value = chip.dataset.emotion || 'random';
        startScenario();
      });
    });

    // Trainee Analytics Cockpit Modal
    myAnalyticsBtn.addEventListener('click', function(){
      profileAnalyticsModal.hidden = false;
      loadTraineeAnalytics();
    });
    agentIdentity.addEventListener('click', function(){
      profileAnalyticsModal.hidden = false;
      loadTraineeAnalytics();
    });
    closeProfileAnalytics.addEventListener('click', function(){ profileAnalyticsModal.hidden = true; });
    refreshAnalyticsBtn.addEventListener('click', loadTraineeAnalytics);
    $('refreshAiBtn').addEventListener('click', triggerAiInsights);

    // Analytics Sub-tabs
    var paTabs = [
      { btn: $('paTabAi'), panel: $('paPanelAi') },
      { btn: $('paTabSpeed'), panel: $('paPanelSpeed') },
      { btn: $('paTabRes'), panel: $('paPanelRes') },
      { btn: $('paTabChurn'), panel: $('paPanelChurn') },
      { btn: $('paTabTranscripts'), panel: $('paPanelTranscripts') }
    ];
    paTabs.forEach(function(tab){
      if(!tab.btn) return;
      tab.btn.addEventListener('click', function(){
        paTabs.forEach(function(t){
          t.btn.classList.remove('active');
          t.btn.setAttribute('aria-selected', 'false');
          t.panel.hidden = true;
        });
        tab.btn.classList.add('active');
        tab.btn.setAttribute('aria-selected', 'true');
        tab.panel.hidden = false;
      });
    });

    // Leadership Admin Console
    adminConsoleBtn.addEventListener('click', openAdminConsole);
    closeAdminConsole.addEventListener('click', function(){ adminConsoleModal.hidden = true; });
    $('adminGateUnlockBtn').addEventListener('click', unlockAdminGate);
    $('adminGatePasscode').addEventListener('keydown', function(ev){
      if(ev.key === 'Enter') unlockAdminGate();
    });
    $('adminSearchInput').addEventListener('input', renderAdminTrainees);
    $('adminStatusFilter').addEventListener('change', renderAdminTrainees);

    // Admin Invite Modal
    $('adminInviteBtn').addEventListener('click', function(){
      adminInviteModal.hidden = false;
      $('inviteSuccessCard').hidden = true;
      $('adminInviteForm').hidden = false;
    });
    closeAdminInvite.addEventListener('click', function(){ adminInviteModal.hidden = true; });
    cancelAdminInvite.addEventListener('click', function(){ adminInviteModal.hidden = true; });
    $('adminInviteForm').addEventListener('submit', async function(ev){
      ev.preventDefault();
      var email = $('inviteEmail').value.trim();
      var name = $('inviteName').value.trim();
      var pw = $('inviteTempPassword').value.trim();
      var res = await fetch('/api/admin/trainees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: TRAINER_PASSCODE, action: 'invite', email: email, name: name, tempPassword: pw })
      });
      if(res.ok){
        var resData = await res.json();
        $('adminInviteForm').hidden = true;
        $('inviteSuccessCard').hidden = false;
        $('inviteSuccessBody').innerHTML = '<p>Trainee account created for <b>' + escapeHtml(name) + '</b> (' + escapeHtml(email) + ').</p>' +
          '<div class="admin-code-box">Temporary Password: <code>' + (resData.tempPassword || 'Wyze2026!') + '</code></div>';
        loadAdminTrainees();
      }
    });

    closeAdminResetModal.addEventListener('click', function(){ adminResetModal.hidden = true; });
    dismissAdminResetModal.addEventListener('click', function(){ adminResetModal.hidden = true; });

    // History Modal
    historyBtn.addEventListener('click', openHistory);
    $('closeHistory').addEventListener('click', function(){ historyModal.hidden = true; });
    trainerPassBtn.addEventListener('click', function(){
      if(trainerPassInput.value.trim().toLowerCase() === TRAINER_PASSCODE){
        trainerAccess = true;
        trainerPassStatus.textContent = 'Unlocked (Leadership access active)';
        openHistory();
      } else {
        trainerPassStatus.textContent = 'Invalid passcode.';
      }
    });

    // Info Modal
    infoBtn.addEventListener('click', function(){ infoModal.hidden = false; });
    $('closeInfo').addEventListener('click', function(){ infoModal.hidden = true; });

    // Sign out
    signOutBtn.addEventListener('click', function(){
      loginProfile = null;
      try { localStorage.removeItem('ecewise:auth_user'); } catch(e){}
      appRoot.hidden = true;
      loginScreen.hidden = false;
      setStatus('Signed out. Please sign in to resume your training sessions.');
    });

    // Copy notes
    copyBtn.addEventListener('click', async function(){
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

    // Periodic timers
    setInterval(function(){
      checkChatAbandonment();
      updatePendingBanner();
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
