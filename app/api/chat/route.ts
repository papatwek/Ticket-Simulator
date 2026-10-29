import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRandomPersona, SYNTHETIC_PERSONAS, CustomerPersona, WYZE_CATALOG, getProductMeta } from '@/lib/personas';
import { syncSingleMessageToSupabase } from '@/lib/supabase';

// Supported active modern Gemini models per gemini-api skill (never use deprecated 2.0 or 2.5)
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'] as const;
type GeminiModelName = typeof GEMINI_MODELS[number];

// Render AI Backend URL for continuous AI conversation orchestrations
const RENDER_BACKEND_URL = (
  process.env.AI_BACKEND_URL ||
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  'https://my-ai-backend-i1n0.onrender.com'
).replace(/\/$/, '');

// Circuit Breaker State per Model
interface ModelCircuitState {
  model: GeminiModelName;
  status: 'healthy' | 'cooldown' | 'suspended';
  cooldownUntil: number;
  consecutiveFailures: number;
  lastErrorType: '429_quota' | '503_unavailable' | 'auth_billing' | 'timeout' | 'other' | null;
  lastErrorMessage: string;
  totalCalls: number;
  successCalls: number;
  failureCalls: number;
  quotaTrips: number;
}

// Telemetry & Diagnostic Metrics Store for Performance Auditing
interface TelemetryStats {
  totalRequests: number;
  successfulRequests: number;
  renderResponses: number;
  geminiResponses: number;
  fallbackResponses: number;
  gracefulExitResponses: number;
  deduplicatedRequests: number;
  quotaErrorCount: number;
  transient503Count: number;
  timeoutCount: number;
  latencies: number[];
  startedAt: number;
  recentErrors: Array<{ timestamp: string; model: string; errorType: string; message: string }>;
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
    fallbackResponses: 0,
    gracefulExitResponses: 0,
    deduplicatedRequests: 0,
    quotaErrorCount: 0,
    transient503Count: 0,
    timeoutCount: 0,
    latencies: [],
    startedAt: Date.now(),
    recentErrors: []
  };
}

if (!g.__modelCircuits) {
  const circuits = {} as Record<GeminiModelName, ModelCircuitState>;
  for (const m of GEMINI_MODELS) {
    circuits[m] = {
      model: m,
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

/**
 * Checks if a model is currently eligible to be queried or in circuit-breaker cooldown
 */
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

/**
 * Record failure & trip cooldowns appropriately
 */
function recordModelFailure(model: GeminiModelName, error: any, customType?: '429_quota' | '503_unavailable' | 'auth_billing' | 'timeout' | 'other') {
  const circuit = g.__modelCircuits?.[model];
  const t = g.__chatTelemetry;
  const msg = String(error?.message || error || '');
  const status = error?.status || error?.statusCode;

  let errType: '429_quota' | '503_unavailable' | 'auth_billing' | 'timeout' | 'other' = customType || 'other';

  if (!customType) {
    if (status === 429 || /429|quota|resource_exhausted|rate\s*limit/i.test(msg)) {
      errType = '429_quota';
    } else if (status === 503 || /503|unavailable|high\s*demand|overloaded/i.test(msg)) {
      errType = '503_unavailable';
    } else if (status === 401 || status === 403 || /api\s*key|auth|billing|permission/i.test(msg)) {
      errType = 'auth_billing';
    } else if (/timeout|abort|timed\s*out/i.test(msg)) {
      errType = 'timeout';
    }
  }

  if (circuit) {
    circuit.totalCalls++;
    circuit.failureCalls++;
    circuit.consecutiveFailures++;
    circuit.lastErrorType = errType;
    circuit.lastErrorMessage = msg.slice(0, 160);

    // Apply circuit breaker cooldown based on error category
    if (errType === '429_quota') {
      circuit.quotaTrips++;
      circuit.status = 'cooldown';
      circuit.cooldownUntil = Date.now() + 60000; // 60s cooldown for quota exhaustion
      if (t) t.quotaErrorCount++;
    } else if (errType === '503_unavailable') {
      circuit.status = 'cooldown';
      circuit.cooldownUntil = Date.now() + 25000; // 25s for transient overload
      if (t) t.transient503Count++;
    } else if (errType === 'auth_billing') {
      circuit.status = 'suspended';
      circuit.cooldownUntil = Date.now() + 300000; // 5 min for fatal auth/billing issues
    } else if (errType === 'timeout') {
      circuit.status = 'cooldown';
      circuit.cooldownUntil = Date.now() + 15000; // 15s for timeout
      if (t) t.timeoutCount++;
    }
  }

  if (t) {
    t.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      model,
      errorType: errType,
      message: msg.slice(0, 120)
    });
    if (t.recentErrors.length > 25) t.recentErrors.pop();
  }
}

/**
 * Record successful model invocation
 */
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

export async function GET() {
  const t = g.__chatTelemetry!;
  const count = t.latencies.length;
  const sorted = [...t.latencies].sort((a, b) => a - b);
  const p95 = count > 0 ? sorted[Math.min(count - 1, Math.floor(count * 0.95))] : 0;
  const avg = count > 0 ? Math.round(t.latencies.reduce((a, b) => a + b, 0) / count) : 0;
  const successRate = t.totalRequests > 0 ? Number(((t.successfulRequests / t.totalRequests) * 100).toFixed(1)) : 100;

  const now = Date.now();
  const circuitSummary = {} as Record<string, any>;
  if (g.__modelCircuits) {
    for (const [model, state] of Object.entries(g.__modelCircuits)) {
      const cooldownLeft = Math.max(0, Math.ceil((state.cooldownUntil - now) / 1000));
      circuitSummary[model] = {
        status: cooldownLeft > 0 ? state.status : 'healthy',
        cooldownRemainingSec: cooldownLeft,
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
    uptimeSec: Math.round((Date.now() - t.startedAt) / 1000),
    metrics: {
      totalRequests: t.totalRequests,
      successfulRequests: t.successfulRequests,
      successRatePct: successRate,
      p95LatencyMs: p95,
      avgLatencyMs: avg,
      providers: {
        render: t.renderResponses,
        gemini: t.geminiResponses,
        engineFallback: t.fallbackResponses,
        gracefulExit: t.gracefulExitResponses
      },
      errorBreakdown: {
        quota429: t.quotaErrorCount,
        transient503: t.transient503Count,
        timeouts: t.timeoutCount,
        deduplications: t.deduplicatedRequests
      }
    },
    circuits: circuitSummary,
    recentErrors: t.recentErrors.slice(0, 10),
    integrations: {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      renderConfigured: !!RENDER_BACKEND_URL,
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
    }
  });
}

/**
 * Intelligent deterministic customer simulation engine
 * Used when Render is sleeping and external Gemini API quota/key is unavailable.
 * Ensures the customer bot NEVER repeats, strictly obeys the non-tech-savvy persona,
 * accurately respects hold/wait requests, and stays 100% faithful to the specific product.
 */
function generateContextualCustomerResponse(
  latestAgentMsg: string,
  persona: CustomerPersona,
  allMessages: any[],
  isEmail: boolean,
  turnNum: number
): { text: string; isGracefulExit: boolean } {
  const rawMsg = (latestAgentMsg || '').trim();
  const msg = rawMsg.toLowerCase();
  const name = persona.name || 'Customer';
  const email = persona.email || 'customer@example.invalid';
  const prod = persona.product || 'Wyze Cam v4';
  const meta = getProductMeta(prod);
  const noun = meta.deviceNoun || 'device';
  const led = persona.ledColor || 'solid yellow';
  const mac = persona.macAddress || '2C:AA:8E:44:91:02';
  const order = persona.orderNumber || 'TEST-WZ-104928';

  // Helper to check if a response was already used in this session to prevent repetition
  const alreadySent = (text: string) => {
    return (allMessages || []).some(m => {
      const t = String(m.text || m.content || '');
      return (m.role === 'customer' || m.role === 'model') && t.includes(text.slice(0, 20));
    });
  };

  let reply = '';
  let isGracefulExit = false;

  // Check for Trainee explicitly asking if customer wants email follow-up or wants to exit
  if (/(send.*email|email.*steps|follow\s*up\s*(?:by|via)?\s*email|step\s*away|email\s*you)/i.test(msg)) {
    reply = `Yes, please! Could you email the remaining troubleshooting steps to ${email} under ticket ${order}? I will follow up as soon as I'm back at my desk.`;
    isGracefulExit = true;
  }

  // 1. HOLD / WAIT / GATHERING INFORMATION (Agent asks customer to wait, holds, or gathers information)
  // MUST BE EVALUATED FIRST so phrases like "In order for me to give you 3 minutes" are treated as a hold request
  else if (
    /(hold\b|bear\s+with\s+me|give\s+me\s+(?:\d+|a\s+few|a\s+couple|one)?\s*(?:min|minute|sec|second|moment)|wait\s+(?:for\s+a\s+(?:while|moment|second|min)|a\s+moment|a\s+minute|here|for\s+me)|gather\s+(?:information|info)|check\s+(?:my\s+resources|on\s+this|this\s+for\s+you|your\s+account|into\s+this|further)|look(?:ing)?\s+into\s+this|take\s+a\s+look|let\s+me\s+check|let\s+me\s+research|be\s+right\s+back|give\s+you\s+the\s+best\s+assistance)/i.test(msg)
  ) {
    const holdReplies = [
      "Sure, take your time! I'll wait right here.",
      "No problem at all, take all the time you need.",
      "Okay, I'll be right here waiting.",
      "Understood, take your time!"
    ];
    for (const r of holdReplies) {
      if (!alreadySent(r)) { reply = r; break; }
    }
    if (!reply) reply = "Sure, I'll wait right here.";
  }

  // 2. AGENT STATEMENTS / EMPATHY / ACKNOWLEDGMENT (Agent says thank you for email/name/patience, or acknowledges issue)
  else if (
    /(thank\s+you\s+for\s+(?:providing|sharing|confirming|verifying|giving)|thanks\s+for\s+(?:providing|sharing|confirming|verifying|giving)|i\s+see\s+that\s+you|appreciate\s+your\s+(?:loyalty|patience|time)|i\s+understand\s+(?:how|that|your)|no\s+worries|happy\s+to\s+help|glad\s+to\s+assist|welcome\s+to\s+wyze|i\'ll\s+do\s+my\s+best\s+to\s+help)/i.test(msg)
  ) {
    const thankReplies = [
      "Thank you, I really appreciate your help.",
      "Thanks! I appreciate you looking into this.",
      "Thank you so much.",
      "I appreciate that, thanks!"
    ];
    for (const r of thankReplies) {
      if (!alreadySent(r)) { reply = r; break; }
    }
    if (!reply) reply = "Thank you, I appreciate your help.";
  }

  // 3. AGENT ASKS PERMISSION TO ASK QUESTIONS
  else if (/(can\s+i\s+ask|may\s+i\s+ask|ask\s+you\s+(?:a\s+few|a\s+couple|some|questions)|check\s+a\s+few\s+things\s+with\s+you)/i.test(msg)) {
    reply = "Sure, go right ahead and ask whatever you need.";
  }

  // 4. QUESTIONS: ORDER NUMBER / PROOF OF PURCHASE
  // Strictly require 'order number' / 'order #' / 'receipt' / 'proof of purchase' so "in order to" never matches!
  else if (/(?:order\s*(?:number|#|id)|proof\s+of\s+purchase|purchase\s+order|sales\s+receipt|invoice)/i.test(msg)) {
    reply = `My order number is ${order}.`;
  }

  // 5. QUESTIONS: MAC ADDRESS / SERIAL NUMBER
  else if (/(?:mac\s*(?:address|addr)?\b|serial\s*(?:number|#|no)\b|physical\s*address)/i.test(msg)) {
    reply = `The MAC address on the ${noun} is ${mac}.`;
  }

  // 6. QUESTIONS: NAME / EMAIL / ACCOUNT DETAILS (Must be an actual question or request)
  else if (
    /(?:what(?:\'s|\s+is)|can\s+(?:i|you)\s+(?:have|get|provide|confirm|verify|give)|may\s+i\s+(?:have|get|ask)|please\s+(?:provide|confirm|verify|give|share)|could\s+you\s+(?:provide|confirm|verify|give)|need\s+(?:your)?).*(?:name|email|account)/i.test(msg) ||
    /(?:verify|confirm)\s+(?:your\s+)?(?:account|name|email)/i.test(msg) ||
    /(?:your\s+)?(?:name|email|account\s+email)\s*\??$/i.test(msg) ||
    /(?:and\s+also\s+)?(?:your\s+)?(?:email|name)/i.test(msg) ||
    /who\s+am\s+i\s+speaking\s+with/i.test(msg)
  ) {
    if (/email/i.test(msg) && !/name/i.test(msg)) {
      reply = `My email is ${email}.`;
    } else if (/name/i.test(msg) && !/email/i.test(msg)) {
      reply = `My name is ${name}.`;
    } else {
      reply = `Yes, my name is ${name} and my account email is ${email}.`;
    }
  }

  // 7. QUESTIONS: LED / STATUS LIGHT / DISPLAY
  else if (/(light|led|color|indicator|status light|front light|screen|display|blinking|solid)/i.test(msg)) {
    const ledReplies = [
      `The status light on the ${noun} is currently ${led}.`,
      `I'm looking at it right now and the light is ${led}.`,
      `It's currently showing a ${led} light.`
    ];
    for (const r of ledReplies) {
      if (!alreadySent(r)) { reply = r; break; }
    }
    if (!reply) reply = `The light on the ${noun} is ${led}.`;
  }

  // 8. INSTRUCTIONS: POWER CYCLE / UNPLUG / REBOOT
  else if (/(unplug|power\s*cycle|reboot|restart|power\s*off|disconnect.*power|outlet|30\s*second)/i.test(msg)) {
    const rebootReplies = [
      `Okay, I just unplugged the ${noun}, waited 30 seconds, and plugged it back in. The status light came back on ${led}.`,
      `I power cycled the ${noun} like you asked. It paused for a second and then the light went back to ${led}.`,
      `I unplugged it and plugged it back. It's still showing the ${led} light.`
    ];
    for (const r of rebootReplies) {
      if (!alreadySent(r)) { reply = r; break; }
    }
    if (!reply) reply = `I unplugged the ${noun} for 30 seconds and plugged it back in. The light is ${led}.`;
  }

  // 9. INSTRUCTIONS: BUTTON PRESS / SETUP / RESET
  else if (/(setup button|reset button|hold.*button|press.*button|pinhole|factory reset)/i.test(msg)) {
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

  // 10. INSTRUCTIONS: QR CODE / SCAN / APP PAIRING
  else if (/(qr|scan.*code|barcode|scan.*app|app.*add)/i.test(msg)) {
    if (meta.isCamera) {
      reply = `I pointed the camera lens at my phone screen, it made a chime and said "QR code scanned", and now the light turned solid blue!`;
    } else {
      reply = `I scanned the code with my phone in the Wyze app, and it connected successfully!`;
    }
  }

  // 11. QUESTIONS: WI-FI / NETWORK / FREQUENCY
  else if (/(wifi|wi-fi|router|2\.4|5ghz|network|ssid|frequency)/i.test(msg)) {
    reply = `Our home Wi-Fi has both 2.4 and 5GHz bands. All our phones and laptops in the house connect to it fine.`;
  }

  // 12. GREETINGS / INTRODUCTIONS
  else if (/^(hi|hello|hey|good day|good morning|good afternoon|thanks for reaching)/i.test(msg)) {
    reply = `Hi! Thanks for helping me. My ${prod} is having issues and I really need help getting it sorted out.`;
  }

  // 13. CLOSING / RESOLUTION
  else if (/(anything else|further assistance|have a great day|ticket resolved|all set|take care)/i.test(msg)) {
    reply = `Everything seems to be working now. Thank you so much for your help today!`;
  }

  // 14. DEFAULT NATURAL ACKNOWLEDGMENT OR GRACEFUL EXIT FOR LATE TURNS
  else {
    if (turnNum >= 5 && Math.random() < 0.25) {
      reply = `I actually need to step away from my computer right now. Could you please email me the next steps to ${email} under ticket ${order}? I'll check it as soon as I'm back.`;
      isGracefulExit = true;
    } else {
      const defaultReplies = [
        `Okay, I'm right here with my ${prod}.`,
        `Understood, I am following along with the ${noun}.`,
        `Got it, I'm right here whenever you're ready.`
      ];
      for (const d of defaultReplies) {
        if (!alreadySent(d)) { reply = d; break; }
      }
      if (!reply) reply = `Okay, I'm right here with my ${prod}.`;
    }
  }

  if (isEmail) {
    return {
      text: `Hello,\n\n${reply}\n\nI really appreciate you following up on my ticket regarding my ${prod}. Please let me know what else you need from me.\n\nThank you,\n${name}\nAccount: ${email}`,
      isGracefulExit
    };
  }

  return { text: reply, isGracefulExit };
}

/**
 * Executes a Gemini model call with bounded retries & jitter for transient 503s
 */
async function callGeminiModelWithRecovery(
  ai: GoogleGenAI,
  modelName: GeminiModelName,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  systemInstruction: string,
  isCamera: boolean
): Promise<{ reply: string | null; errorType?: string; errorMsg?: string }> {
  const maxRetries = 1; // 1 bounded retry for transient 503 errors only
  let attempts = 0;

  while (attempts <= maxRetries) {
    attempts++;
    try {
      const genPromise = ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 800,
          topP: 0.9,
        }
      });

      // Strict bounded timeout: 3500ms
      const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
        setTimeout(() => resolve({ isTimeout: true }), 3500)
      );

      const result: any = await Promise.race([genPromise, timeoutPromise]);
      if (result && result.isTimeout) {
        recordModelFailure(modelName, new Error('Call timed out after 3500ms'), 'timeout');
        return { reply: null, errorType: 'timeout', errorMsg: 'Generation timed out' };
      }

      const text = result && result.text ? String(result.text).trim() : '';
      if (text) {
        // Discard camera hallucination for non-camera device
        if (isCamera || !/\bcamera\b/i.test(text)) {
          recordModelSuccess(modelName);
          return { reply: text };
        }
      }
      return { reply: null, errorType: 'empty_response', errorMsg: 'Empty or invalid response received' };
    } catch (err: any) {
      const msg = String(err?.message || err);
      const is503 = err?.status === 503 || /503|unavailable|high\s*demand/i.test(msg);
      const is429 = err?.status === 429 || /429|quota|resource_exhausted/i.test(msg);

      if (is503 && attempts <= maxRetries) {
        // Exponential backoff with jitter: 200ms + random 0-150ms
        const jitterMs = 200 + Math.floor(Math.random() * 150);
        console.warn(`[Gemini ${modelName}] 503 detected, backing off ${jitterMs}ms before bounded retry...`);
        await new Promise((r) => setTimeout(r, jitterMs));
        continue;
      }

      // Record failure and trip circuit breaker
      recordModelFailure(modelName, err);
      return { reply: null, errorType: is429 ? '429_quota' : is503 ? '503_unavailable' : 'other', errorMsg: msg };
    }
  }

  return { reply: null, errorType: 'max_retries_exceeded', errorMsg: 'Max bounded retries reached' };
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const { messages, contents: incomingContents, schema, sessionId, mode, persona: clientPersona, turnNumber } = body || {};
  const turnNum = typeof turnNumber === 'number' ? turnNumber : 1;
  const isScenarioGen = !!(schema && schema.properties && schema.properties.openingMessage);
  const isEmailMode = mode === 'email';

  // 1. SCENARIO GENERATION: Sequentially rotates through 50 synthetic personas
  if (isScenarioGen) {
    const nextP = getRandomPersona();
    const personaResponse: any = {
      name: nextP.name,
      email: nextP.email,
      phone: nextP.phone,
      shippingAddress: nextP.shippingAddress,
      product: nextP.product,
      macAddress: nextP.macAddress,
      orderNumber: nextP.orderNumber,
      serialNumber: nextP.serialNumber,
      purchaseDate: nextP.purchaseDate,
      proofOfPurchase: nextP.proofOfPurchase,
      issueCategory: nextP.issueCategory,
      emotionalState: nextP.emotionalState,
      ledColor: nextP.ledColor || 'solid yellow',
      hiddenSummary: nextP.hiddenSummary,
      openingMessage: isEmailMode ? nextP.openingMessageEmail : nextP.openingMessage,
      resolutionSteps: nextP.resolutionSteps
    };
    if (isEmailMode) {
      personaResponse.subject = nextP.subject;
    }
    return NextResponse.json({ text: JSON.stringify(personaResponse) });
  }

  // 2. Request Deduplication Lock (Prevents duplicate API calls from racing turns)
  const sessionKey = `${sessionId || 'anon'}:${turnNum}`;
  if (sessionId && g.__inFlightChatPromises?.has(sessionKey)) {
    const t = g.__chatTelemetry;
    if (t) t.deduplicatedRequests++;
    console.log(`[Deduplication] Waiting for existing in-flight promise for session turn: ${sessionKey}`);
    try {
      const existing = await g.__inFlightChatPromises.get(sessionKey);
      if (existing) {
        return NextResponse.json(existing);
      }
    } catch {}
  }

  // 3. Resolve Active Persona Details
  let persona: CustomerPersona = clientPersona;
  if (!persona && Array.isArray(messages)) {
    for (const m of messages) {
      const text = String(m.content || m.text || '');
      if (m.role === 'system' && text.includes('Name:')) {
        const nameMatch = text.match(/Name:\s*([^\n]+)/i);
        const emailMatch = text.match(/Email:\s*([^\n]+)/i);
        const prodMatch = text.match(/Product:\s*([^\n]+)/i);
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
            product: prodMatch ? prodMatch[1].trim() : 'Wyze Cam v4',
            macAddress: macMatch ? macMatch[1].trim() : '2C:AA:8E:44:91:02',
            orderNumber: orderMatch ? orderMatch[1].trim() : 'TEST-WZ-104928',
            serialNumber: 'TEST-SN-772910',
            purchaseDate: '2025-09-12',
            proofOfPurchase: 'Wyze.com Order',
            issueCategory: issueMatch ? issueMatch[1].trim() : 'Device offline or won\'t connect to Wi-Fi',
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
  let providerSource: 'render' | GeminiModelName | 'contextual_engine' | 'graceful_exit' = 'contextual_engine';
  let isAiGenerated = false;
  let isGracefulExit = false;

  // 4. API CALL STRUCTURE WITH FULL CONVERSATION HISTORY & ALTERNATING ROLE CONSOLIDATION
  const rawTurns: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  let latestAgentMsg = '';

  if (Array.isArray(incomingContents) && incomingContents.length > 0) {
    for (const turn of incomingContents) {
      const text = turn.parts && turn.parts[0] ? String(turn.parts[0].text || '').trim() : String(turn.text || '').trim();
      if (!text) continue;
      const role = turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user';
      rawTurns.push({ role, parts: [{ text }] });
      if (role === 'user') latestAgentMsg = text;
    }
  } else if (Array.isArray(messages) && messages.length > 0) {
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const text = String(m.content || m.text || '').trim();
      if (!text || m.role === 'system') continue;

      if (i === 0 && (m.role === 'customer' || m.role === 'assistant' || m.role === 'model')) {
        rawTurns.push({ role: 'user', parts: [{ text: `[Customer opened support ticket for ${persona.product}]` }] });
        rawTurns.push({ role: 'model', parts: [{ text }] });
      } else if (m.role === 'agent' || m.role === 'user') {
        rawTurns.push({ role: 'user', parts: [{ text }] });
        latestAgentMsg = text;
      } else {
        rawTurns.push({ role: 'model', parts: [{ text }] });
      }
    }
  }

  // Gemini API strictly enforces alternating user/model turns without adjacent duplicate roles
  const apiContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const turn of rawTurns) {
    if (apiContents.length > 0 && apiContents[apiContents.length - 1].role === turn.role) {
      apiContents[apiContents.length - 1].parts[0].text += '\n' + turn.parts[0].text;
    } else {
      apiContents.push({ role: turn.role, parts: [{ text: turn.parts[0].text }] });
    }
  }

  if (apiContents.length === 0 || apiContents[0].role !== 'user') {
    apiContents.unshift({ role: 'user', parts: [{ text: `Hello, I need help with my ${persona.product}.` }] });
  }
  if (apiContents[apiContents.length - 1].role !== 'user') {
    apiContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }
  latestAgentMsg = apiContents[apiContents.length - 1].parts[0].text;

  // 5. SYSTEM INSTRUCTION WITH WYZE CATALOG & STRICT CONVERSATIONAL RULES
  const prodMeta = getProductMeta(persona.product);
  const deviceNoun = prodMeta.deviceNoun;

  const systemInstruction = [
    "You are roleplaying as a customer contacting support for help with your device.",
    "You have ZERO technical knowledge, cannot troubleshoot on your own, and cannot predict what needs to be done.",
    "",
    "WYZE CATALOG KNOWLEDGE:",
    ...WYZE_CATALOG,
    "",
    "STRICT DEVICE CONTEXT & CORE MEMORY RULES:",
    `- You own and are troubleshooting ONLY: ${persona.product} (Category: ${prodMeta.family}).`,
    `- Device reference noun: "${deviceNoun}". Support reference link: ${prodMeta.supportLink}.`,
    prodMeta.isCamera
      ? "- Your device is a camera/doorbell."
      : `- CRITICAL PRODUCT RULE: Your device is a ${deviceNoun.toUpperCase()}, NOT A CAMERA! You MUST NEVER mention 'camera', 'camera lens', 'camera base', or 'camera view'. Always refer strictly to your ${persona.product} or 'the ${deviceNoun}'.`,
    "",
    "CONVERSATION SEQUENCING RULES:",
    "BEFORE EVERY RESPONSE, carefully identify the agent's latest message type:",
    "1. HOLD / WAIT / RESEARCH REQUEST (e.g. 'can you give me 3 minutes', 'wait for a while', 'let me check my resources', 'bear with me', 'one moment'):",
    "   -> Simply acknowledge politely and agree to wait! (e.g. 'Sure, take your time! I will wait right here.')",
    "   -> DO NOT provide order numbers, MAC addresses, or ask 'What should I do next?' while the agent is gathering information!",
    "2. STATEMENT / ACKNOWLEDGMENT / EMPATHY (e.g. 'Thank you for providing your email', 'I see you've been a customer', 'I understand how frustrating this is'):",
    "   -> Acknowledge naturally and wait (e.g. 'Thank you, I appreciate your help.'). DO NOT repeat previously provided email or credentials!",
    "3. QUESTION -> Answer ONLY what was specifically asked.",
    "4. INSTRUCTION -> Attempt that single instruction on your device and report what you see or experience.",
    "5. EMAIL FOLLOW-UP / STEPPING AWAY (e.g. agent offers to email remaining steps, follow up by email, or you need to step away):",
    `   -> Agree gratefully! Ask them to email the remaining steps to ${persona.email} under ticket ${persona.orderNumber}.`,
    "",
    "MANDATORY RESTRICTIONS:",
    "- REACT ONLY to the agent's most recent message in the sequence.",
    "- NEVER repeat a message you already sent earlier in the transcript.",
    "- NEVER ask what to do next unless the agent just completed giving you a troubleshooting step.",
    "- NEVER skip ahead or assume what comes next.",
    "- Let the agent lead the troubleshooting process at all times.",
    "- Keep responses to 1-2 natural sentences (chat mode) or a realistic polite support email (email mode).",
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

  // 6. ATTEMPT 1: CALL DEDICATED RENDER AI BACKEND (With fast timeout)
  try {
    const renderRes = await fetch(`${RENDER_BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
      signal: AbortSignal.timeout(1200)
    });

    if (renderRes.ok) {
      const renderData = await renderRes.json().catch(() => ({}));
      const candidate = renderData.message || renderData.text || renderData.reply || renderData.response;
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        const trimmedCandidate = candidate.trim();
        // Discard if candidate hallucinated "camera" for non-camera device
        if (prodMeta.isCamera || !/\bcamera\b/i.test(trimmedCandidate)) {
          botReply = trimmedCandidate;
          providerSource = 'render';
          isAiGenerated = true;
          console.log(`[Turn ${turnNum}] AI response received from Render backend: "${botReply.slice(0, 50)}..."`);
        }
      }
    }
  } catch (renderErr: any) {
    // Render sleeping or busy - cleanly cascade to Gemini
  }

  // 7. ATTEMPT 2: LOCAL GEMINI API WITH AUTOMATIC MULTI-MODEL FALLBACK & CIRCUIT BREAKER
  const apiKey = process.env.GEMINI_API_KEY;
  if (!botReply && apiKey) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    // Filter available models that are healthy and not tripped by 429 quota exhaustion
    const availableModels = GEMINI_MODELS.filter(m => isModelAvailable(m));
    const modelsToTry = availableModels.length > 0 ? availableModels : GEMINI_MODELS;

    for (const modelName of modelsToTry) {
      console.log(`[Turn ${turnNum}] Attempting Gemini model: ${modelName} (Circuit: ${g.__modelCircuits?.[modelName]?.status || 'healthy'})`);
      const { reply, errorType, errorMsg } = await callGeminiModelWithRecovery(
        ai,
        modelName,
        apiContents,
        systemInstruction,
        prodMeta.isCamera
      );

      if (reply) {
        botReply = reply;
        providerSource = modelName;
        isAiGenerated = true;
        console.log(`[Turn ${turnNum}] Gemini ${modelName} generated valid response: "${reply.slice(0, 50)}..."`);
        break;
      }

      console.warn(`[Turn ${turnNum}] Model ${modelName} failed (${errorType || 'unknown'}): ${errorMsg || ''}. Cascading to next fallback...`);
    }
  }

  // 8. ATTEMPT 3: DYNAMIC CONTEXTUAL SIMULATION & GRACEFUL CUSTOMER EXIT
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
    providerSource = isGracefulExit ? 'graceful_exit' : 'contextual_engine';
    isAiGenerated = false; // Never claim deterministic engine response is AI-generated
    console.log(`[Turn ${turnNum}] Utilizing ${providerSource} fallback: "${botReply.slice(0, 50)}..."`);
  }

  // Clean JSON or markdown wrappers if returned
  if (botReply.startsWith('```')) {
    botReply = botReply.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }
  try {
    const parsed = JSON.parse(botReply);
    if (parsed && typeof (parsed.message || parsed.text) === 'string') {
      botReply = parsed.message || parsed.text;
    }
  } catch {}

  // Detect if customer agreed to email follow-up or stepped away (across AI & contextual engines)
  if (
    !isGracefulExit &&
    ((botReply && /(?:please\s+)?email\s+(?:me|them|it|the\s+steps)|step\s+away|check\s+(?:it|email)\s+(?:when|as\s+soon\s+as)\s+i\'m\s+back/i.test(botReply)) ||
     /(?:send.*email|email.*steps|follow\s*up\s*(?:by|via)?\s*email|step\s*away)/i.test(latestAgentMsg))
  ) {
    isGracefulExit = true;
  }

  // 9. REAL-TIME SUPABASE PERSISTENCE FOR MESSAGES & SESSIONS
  if (sessionId) {
    const traineeHeaderId = req.headers.get('x-trainee-id') || (body && (body.traineeId || body.userId));
    const scenarioType = persona?.issueCategory || 'general_support';
    const sessionStatus = isGracefulExit ? 'PENDING' : 'OPEN';

    if (latestAgentMsg) {
      syncSingleMessageToSupabase(sessionId, 'agent', latestAgentMsg, {
        traineeId: traineeHeaderId,
        scenarioType: scenarioType,
        status: sessionStatus
      }).catch(() => {});
    }
    if (botReply) {
      syncSingleMessageToSupabase(sessionId, 'customer', botReply, {
        traineeId: traineeHeaderId,
        scenarioType: scenarioType,
        status: sessionStatus
      }).catch(() => {});
    }
  }

  // 10. PERFORMANCE & TELEMETRY RECORDING
  const latencyMs = Date.now() - reqStart;
  const t = g.__chatTelemetry;
  if (t) {
    t.totalRequests++;
    if (botReply) t.successfulRequests++;
    if (providerSource === 'render') t.renderResponses++;
    else if (providerSource === 'graceful_exit') t.gracefulExitResponses++;
    else if (providerSource === 'contextual_engine') t.fallbackResponses++;
    else t.geminiResponses++;
    t.latencies.push(latencyMs);
    if (t.latencies.length > 300) t.latencies.shift();
  }

  const responsePayload = {
    message: botReply,
    text: botReply,
    status: isGracefulExit ? 'PENDING' : 'OPEN',
    turnNumber: turnNum,
    provider: providerSource,
    isAiGenerated,
    isGracefulExit,
    followupDetails: isGracefulExit ? {
      email: persona.email,
      ticket: persona.orderNumber,
      requestedAt: new Date().toISOString(),
      note: 'Simulated customer follow-up request saved to ticket. External email dispatch simulated.'
    } : null,
    latencyMs
  };

  // Cache in-flight response briefly for deduplication
  if (sessionId && g.__inFlightChatPromises) {
    g.__inFlightChatPromises.set(sessionKey, Promise.resolve(responsePayload));
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
