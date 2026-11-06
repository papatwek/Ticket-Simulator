import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  getRandomPersona,
  SYNTHETIC_PERSONAS,
  CustomerPersona
} from '@/lib/personas';
import { syncSingleMessageToSupabase } from '@/lib/supabase';
import { getWyzeKnowledgeContext } from '@/lib/wyzeKnowledge';

// ============================================================
// WYZE PRODUCT CATALOG
// ============================================================

const WYZE_CATALOG = [
  "STOCK KNOWLEDGE & DIVERSITY RULES:",
  "- Generate scenarios across the ENTIRE catalog below. Do not repeatedly default to basic indoor cameras.",
  "- If an agent asks for documentation, reference the specific support link provided for that product family.",
  "",
  "1. CAMERAS (Reference: https://support.wyze.com/hc/en-us/categories/360004553112)",
  "   - Plug-in Indoor/Outdoor: Wyze Cam v1, v2, v3, v3 Pro, v4, Wyze Cam Pan v1, v2, v3, Wyze Cam OG (Standard & Telephoto)",
  "   - Wireless/Battery: Wyze Cam Outdoor (v1 & v2), Wyze Battery Cam Pro, Wyze Solar Cam, Wyze Solar Cam Pan / 2K",
  "   - Lighting Cameras: Wyze Cam Floodlight, Floodlight Pro, Floodlight v2, Bulb Cam, Bulb Cam Pan Color",
  "   - Video Doorbells: Wyze Video Doorbell, Doorbell Pro, Doorbell v2, Battery Video Doorbell",
  "",
  "2. CONNECTED HOME (Reference: https://support.wyze.com/hc/en-us/categories/360004553132)",
  "   - Power: Wyze Plug, Wyze Plug Outdoor",
  "   - Climate: Wyze Thermostat",
  "   - Access: Wyze Lock, Wyze Lock Bolt, Wyze Gun Safe",
  "   - Cleaning: Wyze Robot Vacuum, Wyze Cordless Vacuum, Wyze Handheld Vacuum",
  "   - Network: Wyze Mesh Router, Wyze Mesh Router Pro 6E",
  "   - Kitchen: Wyze Scale, Wyze Scale S, Wyze Scale X",
  "",
  "3. POWER & LIGHTING (Reference: https://support.wyze.com/hc/en-us/categories/360004553132)",
  "   - Bulbs: Wyze Bulb, Wyze Bulb Color, Wyze Bulb Color BR30, Wyze Bulb White",
  "   - Light Strips: Wyze Light Strip, Wyze Light Strip Pro",
  "   - Switches: Wyze Switch",
  "   - Solar: Wyze Solar Panel",
  "",
  "4. LIFESTYLE & AUDIO (Reference: https://support.wyze.com/hc/en-us/categories/360004553132)",
  "   - Audio: Wyze Headphones, Wyze Buds, Wyze Buds Pro",
  "   - Wearables: Wyze Watch 44mm, Wyze Watch 47mm, Wyze Band",
  "",
  "5. SENSORS & HOME MONITORING (Reference: https://support.wyze.com/hc/en-us/categories/360004553152)",
  "   - Home Monitoring: Wyze Sense Hub, Wyze Keypad",
  "   - Sensors: Wyze Entry Sensor v2, Wyze Motion Sensor v2, Wyze Climate Sensor, Wyze Leak Sensor",
  "",
  "6. SUBSCRIPTIONS & SERVICES (Reference: https://support.wyze.com/hc/en-us/categories/360004553172)",
  "   - Plans: Cam Plus, Cam Plus Lite, Cam Protect, Wyze Home Monitoring"
];

interface WyzeProductMeta {
  family:
    | 'CAMERAS'
    | 'CONNECTED HOME'
    | 'POWER & LIGHTING'
    | 'LIFESTYLE & AUDIO'
    | 'SENSORS & HOME MONITORING'
    | 'SUBSCRIPTIONS & SERVICES';
  deviceNoun: string;
  supportLink: string;
  isCamera: boolean;
}

function getProductMeta(productName: string = ''): WyzeProductMeta {
  const p = (productName || '').toLowerCase();

  if (p.includes('vacuum')) {
    return {
      family: 'CONNECTED HOME',
      deviceNoun: 'vacuum',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (p.includes('router') || p.includes('mesh')) {
    return {
      family: 'CONNECTED HOME',
      deviceNoun: 'router',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (p.includes('lock') || p.includes('safe')) {
    return {
      family: 'CONNECTED HOME',
      deviceNoun: 'lock',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (p.includes('thermostat')) {
    return {
      family: 'CONNECTED HOME',
      deviceNoun: 'thermostat',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (p.includes('scale')) {
    return {
      family: 'CONNECTED HOME',
      deviceNoun: 'scale',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (p.includes('plug')) {
    return {
      family: 'CONNECTED HOME',
      deviceNoun: 'plug',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (
    p.includes('bulb') ||
    p.includes('strip') ||
    p.includes('switch') ||
    p.includes('solar panel')
  ) {
    return {
      family: 'POWER & LIGHTING',
      deviceNoun: p.includes('bulb')
        ? 'bulb'
        : p.includes('strip')
          ? 'light strip'
          : 'switch',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (p.includes('headphone') || p.includes('buds')) {
    return {
      family: 'LIFESTYLE & AUDIO',
      deviceNoun: 'headphones',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (p.includes('watch') || p.includes('band')) {
    return {
      family: 'LIFESTYLE & AUDIO',
      deviceNoun: 'watch',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553132',
      isCamera: false
    };
  }

  if (
    p.includes('sensor') ||
    p.includes('sense') ||
    p.includes('keypad') ||
    p.includes('leak') ||
    p.includes('entry')
  ) {
    return {
      family: 'SENSORS & HOME MONITORING',
      deviceNoun: 'sensor',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553152',
      isCamera: false
    };
  }

  if (
    p.includes('cam plus') ||
    p.includes('protect') ||
    p.includes('monitoring') ||
    p.includes('subscription')
  ) {
    return {
      family: 'SUBSCRIPTIONS & SERVICES',
      deviceNoun: 'subscription',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553172',
      isCamera: false
    };
  }

  if (p.includes('doorbell')) {
    return {
      family: 'CAMERAS',
      deviceNoun: 'doorbell',
      supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553112',
      isCamera: true
    };
  }

  return {
    family: 'CAMERAS',
    deviceNoun: p.includes('cam') ? 'camera' : 'device',
    supportLink: 'https://support.wyze.com/hc/en-us/categories/360004553112',
    isCamera: p.includes('cam') || !p
  };
}

// ============================================================
// GEMINI MODEL CONFIGURATION
// ============================================================

// Verify these model IDs against the models enabled for your
// Gemini API key. The route falls back if a model is unavailable.
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
] as const;

type GeminiModelName = typeof GEMINI_MODELS[number];

const RENDER_BACKEND_URL = (
  process.env.AI_BACKEND_URL ||
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  'https://my-ai-backend-i1n0.onrender.com'
).replace(/\/$/, '');

// ============================================================
// CIRCUIT BREAKER AND TELEMETRY
// ============================================================

interface ModelCircuitState {
  model: GeminiModelName;
  status: 'healthy' | 'cooldown' | 'suspended';
  cooldownUntil: number;
  consecutiveFailures: number;
  lastErrorType:
    | '429_quota'
    | '503_unavailable'
    | 'auth_billing'
    | 'timeout'
    | 'other'
    | null;
  lastErrorMessage: string;
  totalCalls: number;
  successCalls: number;
  failureCalls: number;
  quotaTrips: number;
}

interface TelemetryStats {
  totalRequests: number;
  successfulRequests: number;
  renderResponses: number;
  geminiResponses: number;
  gemmaResponses: number;
  fallbackResponses: number;
  gracefulExitResponses: number;
  deduplicatedRequests: number;
  quotaErrorCount: number;
  transient503Count: number;
  timeoutCount: number;
  latencies: number[];
  startedAt: number;
  lastUsedAt: string | null;
  lastUsedTimestamp: number | null;
  recentErrors: Array<{
    timestamp: string;
    model: string;
    errorType: string;
    message: string;
  }>;
}

const g = globalThis as unknown as {
  __chatTelemetry?: TelemetryStats;
  __modelCircuits?: Record<GeminiModelName, ModelCircuitState>;
  __inFlightChatPromises?: Map<string, Promise<any>>;
};

if (!g.__chatTelemetry) {
  g.__chatTelemetry = {
    totalRequests: 0,
    successfulRequests: 0,
    renderResponses: 0,
    geminiResponses: 0,
    gemmaResponses: 0,
    fallbackResponses: 0,
    gracefulExitResponses: 0,
    deduplicatedRequests: 0,
    quotaErrorCount: 0,
    transient503Count: 0,
    timeoutCount: 0,
    latencies: [],
    startedAt: Date.now(),
    lastUsedAt: null,
    lastUsedTimestamp: null,
    recentErrors: []
  };
}

if (!g.__modelCircuits) {
  const circuits = {} as Record<GeminiModelName, ModelCircuitState>;

  for (const model of GEMINI_MODELS) {
    circuits[model] = {
      model,
      status: 'healthy',
      cooldownUntil: 0,
      consecutiveFailures: 0,
      lastErrorType: null,
      lastErrorMessage: '',
      totalCalls: 0,
      successCalls: 0,
      failureCalls: 0,
      quotaTrips: 0
    };
  }

  g.__modelCircuits = circuits;
}

if (!g.__inFlightChatPromises) {
  g.__inFlightChatPromises = new Map();
}

function isModelAvailable(model: GeminiModelName): boolean {
  const circuit = g.__modelCircuits?.[model];

  if (!circuit) return true;
  if (circuit.status === 'healthy') return true;

  if (Date.now() >= circuit.cooldownUntil) {
    circuit.status = 'healthy';
    return true;
  }

  return false;
}

function recordModelFailure(
  model: GeminiModelName,
  error: any,
  customType?:
    | '429_quota'
    | '503_unavailable'
    | 'auth_billing'
    | 'timeout'
    | 'other'
) {
  const circuit = g.__modelCircuits?.[model];
  const telemetry = g.__chatTelemetry;
  const message = String(error?.message || error || '');
  const status = error?.status || error?.statusCode;

  let errorType:
    | '429_quota'
    | '503_unavailable'
    | 'auth_billing'
    | 'timeout'
    | 'other' = customType || 'other';

  if (!customType) {
    if (
      status === 429 ||
      /429|quota|resource_exhausted|rate\s*limit/i.test(message)
    ) {
      errorType = '429_quota';
    } else if (
      status === 503 ||
      /503|unavailable|high\s*demand|overloaded/i.test(message)
    ) {
      errorType = '503_unavailable';
    } else if (
      status === 401 ||
      status === 403 ||
      /api\s*key|auth|billing|permission/i.test(message)
    ) {
      errorType = 'auth_billing';
    } else if (/timeout|abort|timed\s*out/i.test(message)) {
      errorType = 'timeout';
    }
  }

  if (circuit) {
    circuit.totalCalls++;
    circuit.failureCalls++;
    circuit.consecutiveFailures++;
    circuit.lastErrorType = errorType;
    circuit.lastErrorMessage = message.slice(0, 160);

    if (errorType === '429_quota') {
      circuit.quotaTrips++;
      circuit.status = 'cooldown';
      circuit.cooldownUntil = Date.now() + 60000;
      if (telemetry) telemetry.quotaErrorCount++;
    } else if (errorType === '503_unavailable') {
      circuit.status = 'cooldown';
      circuit.cooldownUntil = Date.now() + 25000;
      if (telemetry) telemetry.transient503Count++;
    } else if (errorType === 'auth_billing') {
      circuit.status = 'suspended';
      circuit.cooldownUntil = Date.now() + 300000;
    } else if (errorType === 'timeout') {
      circuit.status = 'cooldown';
      circuit.cooldownUntil = Date.now() + 15000;
      if (telemetry) telemetry.timeoutCount++;
    }
  }

  if (telemetry) {
    telemetry.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      model,
      errorType,
      message: message.slice(0, 120)
    });

    if (telemetry.recentErrors.length > 25) {
      telemetry.recentErrors.pop();
    }
  }
}

function recordModelSuccess(model: GeminiModelName) {
  const circuit = g.__modelCircuits?.[model];

  if (circuit) {
    circuit.totalCalls++;
    circuit.successCalls++;
    circuit.consecutiveFailures = 0;
    circuit.status = 'healthy';
    circuit.cooldownUntil = 0;
  }
}

// ============================================================
// HEALTH AND DIAGNOSTICS ENDPOINT
// ============================================================

export async function GET() {
  const telemetry = g.__chatTelemetry!;
  const count = telemetry.latencies.length;
  const sorted = [...telemetry.latencies].sort((a, b) => a - b);

  const p95 = count > 0
    ? sorted[Math.min(count - 1, Math.floor(count * 0.95))]
    : 0;

  const averageLatency = count > 0
    ? Math.round(
        telemetry.latencies.reduce((a, b) => a + b, 0) / count
      )
    : 0;

  const successRate = telemetry.totalRequests > 0
    ? Number(
        (
          (telemetry.successfulRequests / telemetry.totalRequests) *
          100
        ).toFixed(1)
      )
    : 100;

  const now = Date.now();
  const circuitSummary: Record<string, any> = {};

  if (g.__modelCircuits) {
    for (const [model, state] of Object.entries(g.__modelCircuits)) {
      const cooldownRemaining = Math.max(
        0,
        Math.ceil((state.cooldownUntil - now) / 1000)
      );

      circuitSummary[model] = {
        status: cooldownRemaining > 0 ? state.status : 'healthy',
        cooldownRemainingSec: cooldownRemaining,
        consecutiveFailures: state.consecutiveFailures,
        totalCalls: state.totalCalls,
        successCalls: state.successCalls,
        quotaTrips: state.quotaTrips,
        lastErrorType: state.lastErrorType
      };
    }
  }

  return NextResponse.json({
    status: 'ok',
    service: 'Wyze ECE AI Bot Core & Diagnostics',
    uptimeSec: Math.round((Date.now() - telemetry.startedAt) / 1000),
    lastUsedAt: telemetry.lastUsedAt,
    lastUsedTimestamp: telemetry.lastUsedTimestamp,
    metrics: {
      totalRequests: telemetry.totalRequests,
      successfulRequests: telemetry.successfulRequests,
      successRatePct: successRate,
      p95LatencyMs: p95,
      avgLatencyMs: averageLatency,
      providers: {
        render: telemetry.renderResponses,
        gemini: telemetry.geminiResponses,
        gemma: telemetry.gemmaResponses,
        engineFallback: telemetry.fallbackResponses,
        gracefulExit: telemetry.gracefulExitResponses
      },
      errorBreakdown: {
        quota429: telemetry.quotaErrorCount,
        transient503: telemetry.transient503Count,
        timeouts: telemetry.timeoutCount,
        deduplications: telemetry.deduplicatedRequests
      }
    },
    circuits: circuitSummary,
    recentErrors: telemetry.recentErrors.slice(0, 10),
    integrations: {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      renderConfigured: !!RENDER_BACKEND_URL,
      supabaseConfigured: !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL
      )
    }
  });
}

// ============================================================
// LOCAL CONTEXTUAL CUSTOMER ENGINE
// ============================================================

function generateContextualCustomerResponse(
  latestAgentMsg: string,
  persona: CustomerPersona,
  allMessages: any[],
  isEmail: boolean,
  turnNum: number
): { text: string; isGracefulExit: boolean } {
  const rawMessage = (latestAgentMsg || '').trim();
  const message = rawMessage.toLowerCase();

  const name = persona.name || 'Customer';
  const email = persona.email || 'customer@example.invalid';
  const product = persona.product || 'Wyze Cam v4';
  const meta = getProductMeta(product);
  const noun = meta.deviceNoun || 'device';
  const led = persona.ledColor || 'solid yellow';
  const mac = persona.macAddress || '2C:AA:8E:44:91:02';
  const order = persona.orderNumber || 'TEST-WZ-104928';

  const alreadySent = (reply: string) => {
    return (allMessages || []).some((item) => {
      const existing = String(item.text || item.content || '');

      return (
        (item.role === 'customer' || item.role === 'model') &&
        existing.includes(reply.slice(0, 20))
      );
    });
  };

  let reply = '';
  let isGracefulExit = false;

  // Email follow-up or customer stepping away
  if (
    /(send.*email|email.*steps|follow\s*up\s*(?:by|via)?\s*email|step\s*away|email\s*you)/i.test(
      message
    )
  ) {
    reply = `Yes, please! Could you email the remaining troubleshooting steps to ${email} under ticket ${order}? I will follow up as soon as I'm back at my desk.`;
    isGracefulExit = true;
  }

  // Hold, wait, or information-gathering request
  else if (
    /(hold\b|bear\s+with\s+me|give\s+me\s+(?:\d+|a\s+few|a\s+couple|one)?\s*(?:min|minute|sec|second|moment)|wait\s+(?:for\s+a\s+(?:while|moment|second|min)|a\s+moment|a\s+minute|here|for\s+me)|gather\s+(?:information|info)|check\s+(?:my\s+resources|on\s+this|this\s+for\s+you|your\s+account|into\s+this|further)|look(?:ing)?\s+into\s+this|take\s+a\s+look|let\s+me\s+check|let\s+me\s+research|be\s+right\s+back|give\s+you\s+the\s+best\s+assistance)/i.test(
      message
    )
  ) {
    const replies = [
      "Sure, take your time! I'll wait right here.",
      "No problem at all, take all the time you need.",
      "Okay, I'll be right here waiting.",
      "Understood, take your time!"
    ];

    for (const candidate of replies) {
      if (!alreadySent(candidate)) {
        reply = candidate;
        break;
      }
    }

    if (!reply) reply = "Sure, I'll wait right here.";
  }

  // Empathy and acknowledgment
  else if (
    /(thank\s+you\s+for\s+(?:providing|sharing|confirming|verifying|giving)|thanks\s+for\s+(?:providing|sharing|confirming|verifying|giving)|i\s+see\s+that\s+you|appreciate\s+your\s+(?:loyalty|patience|time)|i\s+understand\s+(?:how|that|your)|no\s+worries|happy\s+to\s+help|glad\s+to\s+assist|welcome\s+to\s+wyze|i'll\s+do\s+my\s+best\s+to\s+help)/i.test(
      message
    )
  ) {
    const replies = [
      "Thank you, I really appreciate your help.",
      "Thanks! I appreciate you looking into this.",
      "Thank you so much.",
      "I appreciate that, thanks!"
    ];

    for (const candidate of replies) {
      if (!alreadySent(candidate)) {
        reply = candidate;
        break;
      }
    }

    if (!reply) reply = "Thank you, I appreciate your help.";
  }

  // Permission to ask questions
  else if (
    /(can\s+i\s+ask|may\s+i\s+ask|ask\s+you\s+(?:a\s+few|a\s+couple|some|questions)|check\s+a\s+few\s+things\s+with\s+you)/i.test(
      message
    )
  ) {
    reply = "Sure, go right ahead and ask whatever you need.";
  }

  // Order number or proof of purchase
  else if (
    /(?:order\s*(?:number|#|id)|proof\s+of\s+purchase|purchase\s+order|sales\s+receipt|invoice)/i.test(
      message
    )
  ) {
    reply = `My order number is ${order}.`;
  }

  // MAC address or serial number
  else if (
    /(?:mac\s*(?:address|addr)?\b|serial\s*(?:number|#|no)\b|physical\s*address)/i.test(
      message
    )
  ) {
    reply = `The MAC address on the ${noun} is ${mac}.`;
  }

  // Name, email, or account details
  else if (
    /(?:what(?:'s|\s+is)|can\s+(?:i|you)\s+(?:have|get|provide|confirm|verify|give)|may\s+i\s+(?:have|get|ask)|please\s+(?:provide|confirm|verify|give|share)|could\s+you\s+(?:provide|confirm|verify|give)|need\s+(?:your)?).*(?:name|email|account)/i.test(
      message
    ) ||
    /(?:verify|confirm)\s+(?:your\s+)?(?:account|name|email)/i.test(message) ||
    /(?:your\s+)?(?:name|email|account\s+email)\s*\??$/i.test(message) ||
    /(?:and\s+also\s+)?(?:your\s+)?(?:email|name)/i.test(message) ||
    /who\s+am\s+i\s+speaking\s+with/i.test(message)
  ) {
    if (/email/i.test(message) && !/name/i.test(message)) {
      reply = `My email is ${email}.`;
    } else if (/name/i.test(message) && !/email/i.test(message)) {
      reply = `My name is ${name}.`;
    } else {
      reply = `Yes, my name is ${name} and my account email is ${email}.`;
    }
  }

  // Status light or display
  else if (
    /(light|led|color|indicator|status light|front light|screen|display|blinking|solid)/i.test(
      message
    )
  ) {
    const replies = [
      `The status light on the ${noun} is currently ${led}.`,
      `I'm looking at it right now and the light is ${led}.`,
      `It's currently showing a ${led} light.`
    ];

    for (const candidate of replies) {
      if (!alreadySent(candidate)) {
        reply = candidate;
        break;
      }
    }

    if (!reply) reply = `The light on the ${noun} is ${led}.`;
  }

  // Power cycle or restart
  else if (
    /(unplug|power\s*cycle|reboot|restart|power\s*off|disconnect.*power|outlet|30\s*second)/i.test(
      message
    )
  ) {
    const replies = [
      `Okay, I just unplugged the ${noun}, waited 30 seconds, and plugged it back in. The status light came back on ${led}.`,
      `I power cycled the ${noun} like you asked. It paused for a second and then the light went back to ${led}.`,
      `I unplugged it and plugged it back. It's still showing the ${led} light.`
    ];

    for (const candidate of replies) {
      if (!alreadySent(candidate)) {
        reply = candidate;
        break;
      }
    }

    if (!reply) {
      reply = `I unplugged the ${noun} for 30 seconds and plugged it back in. The light is ${led}.`;
    }
  }

  // Setup or reset button
  else if (
    /(setup button|reset button|hold.*button|press.*button|pinhole|factory reset)/i.test(
      message
    )
  ) {
    if (meta.isCamera) {
      reply = `I pressed and held the setup button on the camera until it clicked. It announced "Ready to connect" and now the light is flashing!`;
    } else if (noun === 'router') {
      reply = `I held down the reset button on the router for 10 seconds. The front light started pulsing white.`;
    } else if (noun === 'vacuum') {
      reply = `I pressed and held the power and home buttons together on the vacuum. It announced "Resetting Wi-Fi" and the light is flashing.`;
    } else if (noun === 'lock') {
      reply = `I pressed the setup button behind the lock battery cover. The lock beeped and the light flashed.`;
    } else {
      reply = `I held down the button on the ${noun} like you asked. It clicked and the status light started blinking.`;
    }
  }

  // QR code, scan, or app pairing
  else if (/(qr|scan.*code|barcode|scan.*app|app.*add)/i.test(message)) {
    if (meta.isCamera) {
      reply = `I pointed the camera lens at my phone screen, it made a chime and said "QR code scanned", and now the light turned solid blue!`;
    } else {
      reply = `I scanned the code with my phone in the Wyze app, and it connected successfully!`;
    }
  }

  // Wi-Fi and network
  else if (
    /(wifi|wi-fi|router|2\.4|5ghz|network|ssid|frequency)/i.test(message)
  ) {
    reply = "Our home Wi-Fi has both 2.4 and 5GHz bands. All our phones and laptops in the house connect to it fine.";
  }

  // Greeting
  else if (
    /^(hi|hello|hey|good day|good morning|good afternoon|thanks for reaching)/i.test(
      message
    )
  ) {
    reply = `Hi! Thanks for helping me. My ${product} is having issues and I really need help getting it sorted out.`;
  }

  // Resolution or closing
  else if (
    /(anything else|further assistance|have a great day|ticket resolved|all set|take care)/i.test(
      message
    )
  ) {
    reply = "Everything seems to be working now. Thank you so much for your help today!";
  }

  // Default acknowledgment
  else {
    if (turnNum >= 5 && Math.random() < 0.25) {
      reply = `I actually need to step away from my computer right now. Could you please email me the next steps to ${email} under ticket ${order}? I'll check it as soon as I'm back.`;
      isGracefulExit = true;
    } else {
      const replies = [
        `Okay, I'm right here with my ${product}.`,
        `Understood, I am following along with the ${noun}.`,
        `Got it, I'm right here whenever you're ready.`
      ];

      for (const candidate of replies) {
        if (!alreadySent(candidate)) {
          reply = candidate;
          break;
        }
      }

      if (!reply) reply = `Okay, I'm right here with my ${product}.`;
    }
  }

  if (isEmail) {
    return {
      text: `Hello,\n\n${reply}\n\nI really appreciate you following up on my ticket regarding my ${product}. Please let me know what else you need from me.\n\nThank you,\n${name}\nAccount: ${email}`,
      isGracefulExit
    };
  }

  return { text: reply, isGracefulExit };
}

// ============================================================
// GEMINI API CALL WITH BOUNDED RETRIES
// ============================================================

async function callGeminiModelWithRecovery(
  ai: GoogleGenAI,
  modelName: GeminiModelName,
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>,
  systemInstruction: string,
  isCamera: boolean
): Promise<{
  reply: string | null;
  errorType?: string;
  errorMsg?: string;
}> {
  const maxRetries = 1;
  let attempts = 0;

  while (attempts <= maxRetries) {
    attempts++;

    try {
      const generationPromise = ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.65,
          maxOutputTokens: 600,
          topP: 0.95
        }
      });

      const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) => {
        setTimeout(() => resolve({ isTimeout: true }), 4500);
      });

      const result: any = await Promise.race([
        generationPromise,
        timeoutPromise
      ]);

      if (result?.isTimeout) {
        recordModelFailure(
          modelName,
          new Error('Call timed out after 4500ms'),
          'timeout'
        );

        return {
          reply: null,
          errorType: 'timeout',
          errorMsg: 'Generation timed out'
        };
      }

      const text = result?.text ? String(result.text).trim() : '';

      if (text) {
        if (isCamera || !/\bcamera\b/i.test(text)) {
          recordModelSuccess(modelName);
          return { reply: text };
        }
      }

      return {
        reply: null,
        errorType: 'empty_response',
        errorMsg: 'Empty or invalid response received'
      };
    } catch (error: any) {
      const message = String(error?.message || error);
      const is503 =
        error?.status === 503 ||
        /503|unavailable|high\s*demand/i.test(message);
      const is429 =
        error?.status === 429 ||
        /429|quota|resource_exhausted/i.test(message);

      if (is503 && attempts <= maxRetries) {
        const jitterMs = 200 + Math.floor(Math.random() * 150);

        console.warn(
          `[Gemini ${modelName}] 503 detected, retrying after ${jitterMs}ms`
        );

        await new Promise((resolve) => setTimeout(resolve, jitterMs));
        continue;
      }

      recordModelFailure(modelName, error);

      return {
        reply: null,
        errorType: is429
          ? '429_quota'
          : is503
            ? '503_unavailable'
            : 'other',
        errorMsg: message
      };
    }
  }

  return {
    reply: null,
    errorType: 'max_retries_exceeded',
    errorMsg: 'Max bounded retries reached'
  };
}

// ============================================================
// OPENROUTER FREE MODEL BACKUP (EXPLICITLY FREE GEMMA VARIANT)
// ============================================================

async function callOpenRouterFreeModel(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemInstruction: string,
  isCamera: boolean
): Promise<{
  reply: string | null;
  errorType?: string;
  errorMsg?: string;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { reply: null, errorType: 'no_key', errorMsg: 'OPENROUTER_API_KEY not configured in environment' };
  }

  // Strictly enforce a free-tier model variant ending in :free to prevent any surprise billing
  let model = process.env.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free';
  if (!model.endsWith(':free')) {
    console.warn(`[OpenRouter] Configured model "${model}" does not end with :free. Forcing google/gemma-2-9b-it:free to protect free tier.`);
    model = 'google/gemma-2-9b-it:free';
  }

  try {
    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://wyze-ece-training.app',
        'X-Title': 'Wyze ECE Support Training Simulator'
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        temperature: 0.65,
        max_tokens: 600
      }),
      signal: AbortSignal.timeout(4500)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        reply: null,
        errorType: `http_${response.status}`,
        errorMsg: errText.slice(0, 160)
      };
    }

    const data = await response.json().catch(() => null);
    const candidate = data?.choices?.[0]?.message?.content?.trim();

    if (candidate) {
      if (isCamera || !/\bcamera\b/i.test(candidate)) {
        return { reply: candidate };
      }
    }

    return {
      reply: null,
      errorType: 'empty_response',
      errorMsg: 'Empty or invalid response from OpenRouter'
    };
  } catch (error: any) {
    const isTimeout = error?.name === 'TimeoutError' || /timeout|abort/i.test(error?.message || '');
    return {
      reply: null,
      errorType: isTimeout ? 'timeout' : 'other',
      errorMsg: String(error?.message || error)
    };
  }
}

// ============================================================
// MAIN CHAT ENDPOINT
// ============================================================

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request payload' },
      { status: 400 }
    );
  }

  const {
    messages,
    contents: incomingContents,
    schema,
    sessionId,
    mode,
    persona: clientPersona,
    turnNumber
  } = body || {};

  const turnNum =
    typeof turnNumber === 'number' && Number.isFinite(turnNumber)
      ? turnNumber
      : 1;

  const isScenarioGen = !!(
    schema &&
    schema.properties &&
    schema.properties.openingMessage
  );

  const isEmailMode = mode === 'email';

  // 1. Scenario generation
  if (isScenarioGen) {
    const nextPersona = getRandomPersona();

    const personaResponse: any = {
      name: nextPersona.name,
      email: nextPersona.email,
      phone: nextPersona.phone,
      shippingAddress: nextPersona.shippingAddress,
      product: nextPersona.product,
      macAddress: nextPersona.macAddress,
      orderNumber: nextPersona.orderNumber,
      serialNumber: nextPersona.serialNumber,
      purchaseDate: nextPersona.purchaseDate,
      proofOfPurchase: nextPersona.proofOfPurchase,
      issueCategory: nextPersona.issueCategory,
      emotionalState: nextPersona.emotionalState,
      ledColor: nextPersona.ledColor || 'solid yellow',
      hiddenSummary: nextPersona.hiddenSummary,
      openingMessage: isEmailMode
        ? nextPersona.openingMessageEmail
        : nextPersona.openingMessage,
      resolutionSteps: nextPersona.resolutionSteps
    };

    if (isEmailMode) {
      personaResponse.subject = nextPersona.subject;
    }

    return NextResponse.json({
      text: JSON.stringify(personaResponse)
    });
  }

  // 2. Deduplicate concurrent requests for the same session turn
  const sessionKey = `${sessionId || 'anon'}:${turnNum}`;

  if (sessionId && g.__inFlightChatPromises?.has(sessionKey)) {
    const telemetry = g.__chatTelemetry;

    if (telemetry) telemetry.deduplicatedRequests++;

    try {
      const existing = await g.__inFlightChatPromises.get(sessionKey);

      if (existing) {
        return NextResponse.json(existing);
      }
    } catch {
      // Continue processing if the cached promise failed.
    }
  }

  // 3. Resolve the active persona
  let persona: CustomerPersona = clientPersona;

  if (!persona && Array.isArray(messages)) {
    for (const item of messages) {
      const text = String(item.content || item.text || '');

      if (item.role === 'system' && text.includes('Name:')) {
        const nameMatch = text.match(/Name:\s*([^\n]+)/i);
        const emailMatch = text.match(/Email:\s*([^\n]+)/i);
        const productMatch = text.match(/Product:\s*([^\n]+)/i);
        const macMatch = text.match(/MAC Address:\s*([^\n]+)/i);
        const orderMatch = text.match(/Order Number:\s*([^\n]+)/i);
        const ledMatch = text.match(/Status LED Light:\s*([^\n]+)/i);
        const issueMatch = text.match(/Issue:\s*([^\n]+)/i);

        if (nameMatch) {
          persona = {
            name: nameMatch[1].trim(),
            email: emailMatch ? emailMatch[1].trim() : '',
            phone: '+1 (206) 555-0148',
            shippingAddress: '742 Evergreen Terrace, Seattle, WA 98101',
            product: productMatch
              ? productMatch[1].trim()
              : 'Wyze Cam v4',
            macAddress: macMatch
              ? macMatch[1].trim()
              : '2C:AA:8E:44:91:02',
            orderNumber: orderMatch
              ? orderMatch[1].trim()
              : 'TEST-WZ-104928',
            serialNumber: 'TEST-SN-772910',
            purchaseDate: '2025-09-12',
            proofOfPurchase: 'Wyze.com Order',
            issueCategory: issueMatch
              ? issueMatch[1].trim()
              : "Device offline or won't connect to Wi-Fi",
            emotionalState: 'Frustrated',
            ledColor: ledMatch ? ledMatch[1].trim() : 'solid yellow',
            hiddenSummary: '',
            openingMessage: '',
            openingMessageEmail: '',
            subject: '',
            resolutionSteps: []
          };

          break;
        }
      }
    }
  }

  if (!persona) {
    persona = SYNTHETIC_PERSONAS[0];
  }

  const reqStart = Date.now();

  let providerSource:
    | 'render'
    | 'gemini'
    | 'gemma'
    | GeminiModelName
    | 'contextual_engine'
    | 'graceful_exit' = 'contextual_engine';

  let isAiGenerated = false;
  let isGracefulExit = false;

  // ==========================================================
  // 4. NORMALIZE CONVERSATION HISTORY
  // ==========================================================

  const rawTurns: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }> = [];

  let latestAgentMsg = '';

  if (Array.isArray(incomingContents) && incomingContents.length > 0) {
    for (const turn of incomingContents) {
      const text =
        turn.parts && turn.parts[0]
          ? String(turn.parts[0].text || '').trim()
          : String(turn.text || '').trim();

      if (!text) continue;

      const role =
        turn.role === 'model' || turn.role === 'assistant'
          ? 'model'
          : 'user';

      rawTurns.push({
        role,
        parts: [{ text }]
      });

      if (role === 'user') {
        latestAgentMsg = text;
      }
    }
  } else if (Array.isArray(messages) && messages.length > 0) {
    for (let index = 0; index < messages.length; index++) {
      const item = messages[index];
      const text = String(item.content || item.text || '').trim();

      if (!text || item.role === 'system') continue;

      if (
        index === 0 &&
        (
          item.role === 'customer' ||
          item.role === 'assistant' ||
          item.role === 'model'
        )
      ) {
        rawTurns.push({
          role: 'user',
          parts: [{
            text: `[Customer opened support ticket for ${persona.product}]`
          }]
        });

        rawTurns.push({
          role: 'model',
          parts: [{ text }]
        });
      } else if (item.role === 'agent' || item.role === 'user') {
        rawTurns.push({
          role: 'user',
          parts: [{ text }]
        });

        latestAgentMsg = text;
      } else {
        rawTurns.push({
          role: 'model',
          parts: [{ text }]
        });
      }
    }
  }

  // Consolidate adjacent roles because Gemini expects alternating turns.
  const apiContents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }> = [];

  for (const turn of rawTurns) {
    const previous = apiContents[apiContents.length - 1];

    if (previous && previous.role === turn.role) {
      previous.parts[0].text += '\n' + turn.parts[0].text;
    } else {
      apiContents.push({
        role: turn.role,
        parts: [{ text: turn.parts[0].text }]
      });
    }
  }

  if (apiContents.length === 0 || apiContents[0].role !== 'user') {
    apiContents.unshift({
      role: 'user',
      parts: [{
        text: `Hello, I need help with my ${persona.product}.`
      }]
    });
  }

  // Gemini must end with a user turn for the next generation.
  // Do not overwrite latestAgentMsg with this synthetic placeholder.
  if (apiContents[apiContents.length - 1].role !== 'user') {
    apiContents.push({
      role: 'user',
      parts: [{ text: 'Hello' }]
    });
  }

  // ==========================================================
  // 5. BUILD CUSTOMER ROLE INSTRUCTIONS
  // ==========================================================

  // Retrieve relevant official Wyze Support excerpts as private background knowledge.
  // Retrieval failure is non-fatal: the conversation continues with the existing persona logic.
  const wyzeKnowledgeContext = await getWyzeKnowledgeContext(
    persona.product || '',
    persona.issueCategory || '',
    latestAgentMsg || ''
  );

  const productMeta = getProductMeta(persona.product);
  const deviceNoun = productMeta.deviceNoun;

  const systemInstruction = [
    "You are roleplaying as a customer contacting support for help with your device.",
    "You are an ordinary product owner, not a technician or support representative. You have basic everyday familiarity with your Wyze product and may recognize common product terms, app features, lights, parts, and symptoms, but you are not expected to know the correct diagnosis or resolution.",
    "",
    "WYZE PRODUCT AND SUPPORT KNOWLEDGE:",
    ...WYZE_CATALOG,
    "",
    "OFFICIAL SUPPORT ARTICLE EXCERPTS (PRIVATE BACKGROUND REFERENCE ONLY):",
    wyzeKnowledgeContext || "No matching article excerpts were retrieved for this turn. Do not pretend that you read an article.",
    "",
    "HOW TO USE THIS KNOWLEDGE — CRITICAL ROLEPLAY BOUNDARY:",
    "- This reference is only to help you understand product names, terminology, features, symptoms, and what a customer may observe.",
    "- You are ALWAYS the customer seeking help. You are NEVER Wyze Support, a technician, a trainer, or a troubleshooting coach.",
    "- NEVER instruct the trainee what they should do, list the correct troubleshooting steps, recommend a diagnosis, or reveal the expected resolution.",
    "- NEVER take control of the support interaction or turn an article procedure into a script for the trainee.",
    "- Let the trainee lead. Respond to their latest question or instruction as a real customer would: answer what they asked, attempt only the single requested action when reasonable, then describe what you personally observed.",
    "- Maintain partnership, trust, and collaboration: be cooperative, appreciative, honest, patient when appropriate, and willing to work through the issue together.",
    "- You may use familiar terms naturally (for example, Wi-Fi, firmware, microSD, status light, motion detection, event recording, or device sharing), but do not pretend to understand technical details you would not reasonably know.",
    "- Do not quote or announce the support articles, mention that you are using a knowledge base, or expose internal reference text.",
    "- If an article describes a procedure but the trainee has not asked you to perform it, do not volunteer or perform it.",
    "- If the trainee proposes a step that differs from the article, do not correct or coach them. Stay in character, ask a natural clarification if needed, and report only your own observed result.",
    "- The support excerpts do not override the customer's fictional profile, scenario symptoms, prior conversation, or observed results. If details conflict, preserve the established scenario and express uncertainty naturally rather than inventing facts.",
    "",
    "STRICT DEVICE CONTEXT & CORE MEMORY RULES:",
    `- You own and are troubleshooting ONLY: ${persona.product} (Category: ${productMeta.family}).`,
    `- Device reference noun: "${deviceNoun}". Support reference link: ${productMeta.supportLink}.`,
    productMeta.isCamera
      ? "- Your device is a camera/doorbell."
      : `- CRITICAL PRODUCT RULE: Your device is a ${deviceNoun.toUpperCase()}, NOT A CAMERA! You MUST NEVER mention 'camera', 'camera lens', 'camera base', or 'camera view'. Always refer strictly to your ${persona.product} or 'the ${deviceNoun}'.`,
    "",
    "CONVERSATION SEQUENCING RULES:",
    "BEFORE EVERY RESPONSE, carefully identify the agent's latest message type:",
    "1. HOLD / WAIT / RESEARCH REQUEST:",
    "   -> Simply acknowledge politely and agree to wait.",
    "   -> DO NOT provide order numbers, MAC addresses, or ask what to do next while the agent is gathering information.",
    "2. STATEMENT / ACKNOWLEDGMENT / EMPATHY:",
    "   -> Acknowledge naturally and wait. DO NOT repeat previously provided email or credentials.",
    "3. QUESTION -> Answer ONLY what was specifically asked.",
    "4. INSTRUCTION -> Attempt that single instruction on your device and report what you see or experience.",
    "5. EMAIL FOLLOW-UP / STEPPING AWAY:",
    `   -> Agree gratefully. Ask them to email the remaining steps to ${persona.email} under ticket ${persona.orderNumber}.`,
    "",
    "MANDATORY RESTRICTIONS:",
    "- REACT ONLY to the agent's most recent message in the sequence.",
    "- NEVER repeat a message you already sent earlier in the transcript.",
    "- NEVER ask what to do next unless the agent just completed giving you a troubleshooting step.",
    "- NEVER skip ahead or assume what comes next.",
    "- Let the agent lead the troubleshooting process at all times.",
    "- Keep responses to 1-2 natural sentences in chat mode.",
    "- Use a realistic polite support email in email mode.",
    "- Stay fully in role until the issue is resolved.",
    "",
    "Customer Profile:",
    `- Name: ${persona.name}`,
    `- Email: ${persona.email}`,
    `- Phone: ${persona.phone}`,
    `- Address: ${persona.shippingAddress}`,
    `- Product: ${persona.product}`,
    `- Order Number: ${persona.orderNumber}`,
    `- MAC Address: ${persona.macAddress}`,
    `- Serial Number: ${persona.serialNumber}`,
    `- Purchase Date: ${persona.purchaseDate}`,
    `- Status LED / Display: ${persona.ledColor || 'solid yellow'}`,
    `- Issue: ${persona.issueCategory}`,
    isEmailMode
      ? "Format: Realistic support email body with paragraph details."
      : "Format: Live-chat format (1-2 sentences max). No email greetings or signatures."
  ].join('\n');

  let botReply: string | null = null;

  // ==========================================================
  // 6. ATTEMPT 1: DIRECT GEMINI API (PRIMARY PROVIDER)
  // ==========================================================

  const apiKey = process.env.GEMINI_API_KEY;

  if (!botReply && apiKey) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'wyze-ece-training'
        }
      }
    });

    const availableModels = GEMINI_MODELS.filter(
      (model) => isModelAvailable(model)
    );

    const modelsToTry =
      availableModels.length > 0
        ? availableModels
        : GEMINI_MODELS;

    for (const modelName of modelsToTry) {
      console.log(
        `[Turn ${turnNum}] Attempting primary Gemini model: ${modelName}`
      );

      const {
        reply,
        errorType,
        errorMsg
      } = await callGeminiModelWithRecovery(
        ai,
        modelName,
        apiContents,
        systemInstruction,
        productMeta.isCamera
      );

      if (reply) {
        botReply = reply;
        providerSource = modelName;
        isAiGenerated = true;

        console.log(
          `[Turn ${turnNum}] Gemini ${modelName} generated a response.`
        );

        break;
      }

      console.warn(
        `[Turn ${turnNum}] ${modelName} failed (${errorType || 'unknown'}): ${errorMsg || ''}`
      );
    }
  }

  // ==========================================================
  // 7. ATTEMPT 2: OPENROUTER (EXPLICITLY FREE GEMMA BACKUP)
  // ==========================================================

  if (!botReply && process.env.OPENROUTER_API_KEY) {
    console.log(
      `[Turn ${turnNum}] Attempting secondary OpenRouter free Gemma model backup...`
    );

    const openRouterMessages = apiContents.map((c) => ({
      role: (c.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: c.parts[0]?.text || ''
    }));

    const orResult = await callOpenRouterFreeModel(
      openRouterMessages,
      systemInstruction,
      productMeta.isCamera
    );

    if (orResult.reply) {
      botReply = orResult.reply;
      providerSource = 'gemma';
      isAiGenerated = true;

      console.log(
        `[Turn ${turnNum}] OpenRouter free Gemma model generated a response.`
      );
    } else {
      console.warn(
        `[Turn ${turnNum}] OpenRouter free backup failed (${orResult.errorType || 'unknown'}): ${orResult.errorMsg || ''}`
      );
    }
  }

  // ==========================================================
  // 8. ATTEMPT 3: RENDER AUXILIARY BACKEND (NON-BLOCKING)
  // ==========================================================

  if (!botReply && RENDER_BACKEND_URL) {
    try {
      const renderResponse = await fetch(
        `${RENDER_BACKEND_URL}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            contents: apiContents,
            messages: messages || [],
            message: latestAgentMsg,
            prompt: latestAgentMsg,
            persona,
            turnNumber: turnNum,
            mode: isEmailMode ? 'email' : 'chat',
            systemInstruction,
            sessionId: sessionId || ''
          }),
          signal: AbortSignal.timeout(2500)
        }
      );

      if (renderResponse.ok) {
        const renderData = await renderResponse.json().catch(() => ({}));

        const candidate =
          renderData.message ||
          renderData.text ||
          renderData.reply ||
          renderData.response;

        if (
          candidate &&
          typeof candidate === 'string' &&
          candidate.trim()
        ) {
          const trimmedCandidate = candidate.trim();

          // Reject camera-related replies for non-camera products.
          if (
            productMeta.isCamera ||
            !/\bcamera\b/i.test(trimmedCandidate)
          ) {
            botReply = trimmedCandidate;

            const renderProvider = String(
              renderData.provider || ''
            ).toLowerCase();

            if (
              renderProvider.includes('gemma') ||
              renderProvider.includes('openrouter')
            ) {
              providerSource = 'gemma';
            } else if (renderProvider === 'gemini') {
              providerSource = 'gemini';
            } else if (renderProvider === 'contextual_engine') {
              providerSource = 'contextual_engine';
            } else {
              providerSource = 'render';
            }

            isAiGenerated = ![
              'contextual_engine',
              'graceful_exit'
            ].includes(renderProvider);

            console.log(
              `[Turn ${turnNum}] Render response from ${renderProvider || 'unreported provider'}`
            );
          }
        }
      }
    } catch {
      // Non-fatal: Render may be asleep; proceed directly to local contextual engine
    }
  }

  // ==========================================================
  // 9. ATTEMPT 4: LOCAL CONTEXTUAL ENGINE (ZERO-COST, 0ms FALLBACK)
  // ==========================================================

  if (!botReply) {
    const simulationResult = generateContextualCustomerResponse(
      latestAgentMsg,
      persona,
      messages || [],
      isEmailMode,
      turnNum
    );

    botReply = simulationResult.text;
    isGracefulExit = simulationResult.isGracefulExit;

    providerSource = isGracefulExit
      ? 'graceful_exit'
      : 'contextual_engine';

    isAiGenerated = false;

    console.log(
      `[Turn ${turnNum}] Using ${providerSource} fallback.`
    );
  }

  // ==========================================================
  // 10. NORMALIZE AI RESPONSE
  // ==========================================================

  if (botReply.startsWith('```')) {
    botReply = botReply
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();
  }

  try {
    const parsed = JSON.parse(botReply);

    if (
      parsed &&
      typeof (parsed.message || parsed.text) === 'string'
    ) {
      botReply = parsed.message || parsed.text;
    }
  } catch {
    // Normal plain-text response; no JSON parsing required.
  }

  // Detect email follow-up or customer stepping away.
  if (
    !isGracefulExit &&
    (
      (
        botReply &&
        /(?:please\s+)?email\s+(?:me|them|it|the\s+steps)|step\s+away|check\s+(?:it|email)\s+(?:when|as\s+soon\s+as)\s+i'm\s+back/i.test(
          botReply
        )
      ) ||
      /(?:send.*email|email.*steps|follow\s*up\s*(?:by|via)?\s*email|step\s*away)/i.test(
        latestAgentMsg
      )
    )
  ) {
    isGracefulExit = true;
  }

  // ==========================================================
  // 11. SUPABASE MESSAGE PERSISTENCE (PARALLELIZED & BOUNDED)
  // ==========================================================

  if (sessionId) {
    const traineeHeaderId =
      req.headers.get('x-trainee-id') ||
      body?.traineeId ||
      body?.userId;

    const traineeEmail =
      req.headers.get('x-trainee-email') ||
      body?.traineeEmail ||
      body?.email;

    const rawTraineeName =
      req.headers.get('x-trainee-name') ||
      body?.traineeName;
    const traineeName = rawTraineeName ? decodeURIComponent(rawTraineeName) : undefined;

    const scenarioType =
      persona?.issueCategory || 'general_support';

    const sessionStatus = isGracefulExit
      ? 'PENDING'
      : 'OPEN';

    const syncPromises: Promise<any>[] = [];

    if (latestAgentMsg) {
      syncPromises.push(
        syncSingleMessageToSupabase(
          sessionId,
          'agent',
          latestAgentMsg,
          {
            traineeId: traineeHeaderId,
            traineeEmail,
            traineeName,
            scenarioType,
            status: sessionStatus
          }
        ).catch((agentSyncErr) =>
          console.warn('[Supabase Agent Message Sync] Handled defensively:', agentSyncErr)
        )
      );
    }

    if (botReply) {
      syncPromises.push(
        syncSingleMessageToSupabase(
          sessionId,
          'customer',
          botReply,
          {
            traineeId: traineeHeaderId,
            traineeEmail,
            traineeName,
            scenarioType,
            status: sessionStatus
          }
        ).catch((custSyncErr) =>
          console.warn('[Supabase Customer Message Sync] Handled defensively:', custSyncErr)
        )
      );
    }

    // Parallel execution bounded by 1200ms so database latency never holds up user response
    if (syncPromises.length > 0) {
      try {
        await Promise.race([
          Promise.allSettled(syncPromises),
          new Promise((resolve) => setTimeout(resolve, 1200))
        ]);
      } catch {
        // Non-fatal defensive catch
      }
    }
  }

  // ==========================================================
  // 11. TELEMETRY
  // ==========================================================

  const latencyMs = Date.now() - reqStart;
  const telemetry = g.__chatTelemetry;

  if (telemetry) {
    telemetry.totalRequests++;
    telemetry.lastUsedAt = new Date().toISOString();
    telemetry.lastUsedTimestamp = Date.now();

    if (botReply) {
      telemetry.successfulRequests++;
    }

    if (
      providerSource === 'render' ||
      providerSource === 'gemini' ||
      providerSource === 'gemma'
    ) {
      telemetry.renderResponses++;
    }

    if (providerSource === 'gemma') {
      telemetry.gemmaResponses++;
    }

    if (
      providerSource === 'gemini' ||
      (
        typeof providerSource === 'string' &&
        providerSource.startsWith('gemini-')
      )
    ) {
      telemetry.geminiResponses++;
    }

    if (providerSource === 'graceful_exit') {
      telemetry.gracefulExitResponses++;
    } else if (providerSource === 'contextual_engine') {
      telemetry.fallbackResponses++;
    }

    telemetry.latencies.push(latencyMs);

    if (telemetry.latencies.length > 300) {
      telemetry.latencies.shift();
    }
  }

  // ==========================================================
  // 12. FINAL RESPONSE
  // ==========================================================

  const responsePayload = {
    message: botReply,
    text: botReply,
    status: isGracefulExit ? 'PENDING' : 'OPEN',
    turnNumber: turnNum,
    provider: providerSource,
    isAiGenerated,
    isGracefulExit,
    followupDetails: isGracefulExit
      ? {
          email: persona.email,
          ticket: persona.orderNumber,
          requestedAt: new Date().toISOString(),
          note: 'Simulated customer follow-up request saved to ticket. External email dispatch simulated.'
        }
      : null,
    latencyMs
  };

  // Brief in-memory cache to reduce duplicate concurrent requests.
  if (sessionId && g.__inFlightChatPromises) {
    g.__inFlightChatPromises.set(
      sessionKey,
      Promise.resolve(responsePayload)
    );

    setTimeout(() => {
      g.__inFlightChatPromises?.delete(sessionKey);
    }, 2000);
  }

  return NextResponse.json({
    text: JSON.stringify(responsePayload),
    message: botReply,
    status: isGracefulExit ? 'PENDING' : 'OPEN',
    provider: providerSource,
    isAiGenerated,
    isGracefulExit,
    followupDetails: responsePayload.followupDetails,
    latencyMs
  });
}
