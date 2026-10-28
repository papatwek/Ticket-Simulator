import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRandomPersona, SYNTHETIC_PERSONAS, CustomerPersona } from '@/lib/personas';
import { syncSingleMessageToSupabase } from '@/lib/supabase';

// Supported active modern Gemini models per gemini-api skill (never use deprecated 2.0 or 2.5)
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

// Render AI Backend URL for continuous AI conversation orchestrations
const RENDER_BACKEND_URL = (
  process.env.AI_BACKEND_URL ||
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  'https://my-ai-backend-i1n0.onrender.com'
).replace(/\/$/, '');

/**
 * Intelligent deterministic customer simulation engine
 * Used when Render is sleeping and external Gemini API quota/key is unavailable.
 * Ensures the customer bot NEVER repeats "Sorry, I didn't catch that",
 * strictly obeys the non-tech-savvy persona, and answers sequentially.
 */
function generateContextualCustomerResponse(
  latestAgentMsg: string,
  persona: CustomerPersona,
  allMessages: any[],
  isEmail: boolean,
  turnNum: number
): string {
  const msg = (latestAgentMsg || '').trim().toLowerCase();
  const name = persona.name || 'Marcus Vance';
  const email = persona.email || 'customer@example.invalid';
  const prod = persona.product || 'Wyze Cam v4';
  const led = persona.ledColor || 'solid yellow';
  const mac = persona.macAddress || '2C:AA:8E:44:91:02';
  const order = persona.orderNumber || 'TEST-WZ-104928';

  // Helper to check if a response was already used in this session to prevent repetition
  const alreadySent = (text: string) => {
    return allMessages.some(m => m.role === 'customer' && m.text && m.text.includes(text.slice(0, 25)));
  };

  // 1. Identity / Verification Questions (Name, Email, Account, Phone, Address)
  if (/(name|email|verify|account|who am i|spell|phone|address)/i.test(msg)) {
    if (/(email)/i.test(msg) && !/(name)/i.test(msg)) {
      return `My email is ${email}.`;
    }
    if (/(name)/i.test(msg) && !/(email)/i.test(msg)) {
      return `My name is ${name}.`;
    }
    return `Yes, my name is ${name} and my email associated with Wyze is ${email}.`;
  }

  // 2. Hardware Identifiers (MAC address, Serial number, Order number, Receipt)
  if (/(mac|serial|order|invoice|receipt|model)/i.test(msg)) {
    if (/(mac)/i.test(msg)) {
      return `The MAC address on the back label is ${mac}.`;
    }
    return `My order number is ${order} and the MAC address on the camera is ${mac}.`;
  }

  // 3. LED / Status Light Questions
  if (/(light|led|color|indicator|front|flash|blinking|solid)/i.test(msg)) {
    const responses = [
      `The small light on the front is ${led} and it isn't flashing.`,
      `It's currently sitting on a ${led} light right now.`,
      `I'm looking at it right now and the status light is still ${led}.`
    ];
    for (const r of responses) {
      if (!alreadySent(r)) return r;
    }
    return `The light is ${led}.`;
  }

  // 4. Instructions: Power cycle / Unplug / Restart / Reboot
  if (/(unplug|power cycle|reboot|restart|outlet|cord|adapter|power off|30 second)/i.test(msg)) {
    const responses = [
      `Okay, I just unplugged the power cable, waited 30 seconds, and plugged it back in. The light came back on ${led}.`,
      `I power cycled it like you asked. It paused for a second and then the light went back to ${led}.`,
      `I unplugged it from the wall outlet and plugged it back. It's still showing the same ${led} light.`
    ];
    for (const r of responses) {
      if (!alreadySent(r)) return r;
    }
    return `I unplugged it and plugged it back in. The light is still ${led}.`;
  }

  // 5. Instructions: Setup button / Pair / Factory reset / Hold
  if (/(setup button|press.*button|hold.*button|click.*button|pin|reset button)/i.test(msg)) {
    const responses = [
      `I pressed and held the setup button on the bottom. The camera said "Ready to connect" and now the yellow light is flashing!`,
      `I held down the button until it clicked. It just announced "Ready to connect" and the light started blinking.`
    ];
    for (const r of responses) {
      if (!alreadySent(r)) return r;
    }
    return `I held the setup button down and it said "Ready to connect".`;
  }

  // 6. Instructions: QR code / Scan / Wyze App
  if (/(qr|scan|barcode|code|app.*add|camera.*screen)/i.test(msg)) {
    return `I pointed the camera at my phone screen, it made a chime and said "QR code scanned", and now the light just turned solid blue!`;
  }

  // 7. Network / Wi-Fi Questions (2.4GHz vs 5GHz, Router distance)
  if (/(wifi|wi-fi|router|2\.4|5ghz|network|ssid|password|frequency)/i.test(msg)) {
    return `I think our home router has both 2.4 and 5GHz. All our phones and laptops are connected to the same Wi-Fi with no issues.`;
  }

  // 8. Agent Greetings / Introductions ("Hi I'm Patrick from Wyze", "Thanks for contacting Wyze")
  if (/^(hi|hello|hey|good day|thanks for contacting|my name is|thank you for reaching)/i.test(msg)) {
    const responses = [
      `Hi, thanks for taking my case. My ${prod} is having issues and I really need help getting it sorted out.`,
      `Hello! Thanks for answering. I'm having trouble with my ${prod} and don't know what to do next.`
    ];
    for (const r of responses) {
      if (!alreadySent(r)) return r;
    }
    return `Hi, thanks for helping me with my ${prod}.`;
  }

  // 9. Agent asks permission to ask questions ("Can I ask you a few questions?", "May I have a moment?")
  if (/(can i ask|may i ask|few questions|couple of questions|ask you|check a few things)/i.test(msg)) {
    return `Sure, go right ahead and ask whatever you need.`;
  }

  // 10. Agent asks to place on hold / wait
  if (/(hold|give me a moment|one moment|bear with me|check my resources|looking into)/i.test(msg)) {
    return `Okay, take your time. I'll wait right here.`;
  }

  // 11. Agent asks if anything else / closing
  if (/(anything else|further assistance|all set|resolved|good to go)/i.test(msg)) {
    return `Everything is working now, thank you so much for your help!`;
  }

  // 12. Default sequential acknowledgment
  const defaults = [
    `Okay, I'm following along with my ${prod}. What should I do next?`,
    `I understand. Please let me know what the next step is.`,
    `Got it. I'm right here with the device whenever you're ready.`
  ];
  for (const d of defaults) {
    if (!alreadySent(d)) return d;
  }
  return `Okay, what should I try next with my ${prod}?`;
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

  // 2. Resolve Active Persona Details
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

  // 3. API CALL STRUCTURE WITH FULL CONVERSATION HISTORY
  const apiContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  let latestAgentMsg = '';

  if (Array.isArray(incomingContents) && incomingContents.length > 0) {
    for (const turn of incomingContents) {
      const text = turn.parts && turn.parts[0] ? String(turn.parts[0].text || '').trim() : String(turn.text || '').trim();
      if (!text) continue;
      const role = turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user';
      apiContents.push({ role, parts: [{ text }] });
      if (role === 'user') latestAgentMsg = text;
    }
  } else if (Array.isArray(messages) && messages.length > 0) {
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const text = String(m.content || m.text || '').trim();
      if (!text || m.role === 'system') continue;

      if (i === 0 && (m.role === 'customer' || m.role === 'assistant' || m.role === 'model')) {
        apiContents.push({ role: 'user', parts: [{ text: '[Customer opened ticket]' }] });
        apiContents.push({ role: 'model', parts: [{ text }] });
      } else if (m.role === 'agent' || m.role === 'user') {
        apiContents.push({ role: 'user', parts: [{ text }] });
        latestAgentMsg = text;
      } else {
        apiContents.push({ role: 'model', parts: [{ text }] });
      }
    }
  }

  if (apiContents.length === 0) {
    apiContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    latestAgentMsg = 'Hello';
  } else if (apiContents[apiContents.length - 1].role !== 'user') {
    apiContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    latestAgentMsg = 'Hello';
  }

  // 4. SYSTEM INSTRUCTION
  const systemInstruction = [
    "You are a non-tech-savvy customer contacting support. You have ZERO technical knowledge.",
    "BEFORE every response, identify the agent's last message type:",
    "- Question → answer it directly only",
    "- Instruction → attempt it, report what you see or experience",
    "- Statement → acknowledge naturally and wait",
    "",
    "STRICT RULES:",
    "- React only to the agent's most recent message",
    "- Never repeat a message already sent",
    "- Never ask what to do next unless agent just gave a step",
    "- Never skip ahead or assume",
    "- Let agent lead at all times",
    "- 1-2 sentences max per response",
    "- Stay in role until issue is resolved or both parties agree to close",
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
    `- Status LED Light: ${persona.ledColor || 'solid yellow'}`,
    `- Issue: ${persona.issueCategory}`,
    isEmailMode
      ? "Format: Realistic support email body with paragraph details."
      : "Format: Live-chat format (1-2 sentences max). No email greetings or signatures."
  ].join('\n');

  let botReply: string | null = null;

  // 5. ATTEMPT 1: CALL DEDICATED RENDER AI BACKEND
  const renderEndpoints = [
    `${RENDER_BACKEND_URL}/api/chat`,
    `${RENDER_BACKEND_URL}/chat`,
    RENDER_BACKEND_URL,
    `${RENDER_BACKEND_URL}/api/generate`
  ];

  for (const endpoint of renderEndpoints) {
    try {
      console.log(`[Render AI Backend] Calling ${endpoint} for Turn ${turnNum}...`);
      const renderRes = await fetch(endpoint, {
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
        signal: AbortSignal.timeout(4000)
      });

      console.log(`[Render AI Backend] ${endpoint} returned status ${renderRes.status}`);
      if (renderRes.ok) {
        const renderData = await renderRes.json().catch(() => ({}));
        const candidate = renderData.message || renderData.text || renderData.reply || renderData.response;
        if (candidate && typeof candidate === 'string' && candidate.trim()) {
          botReply = candidate.trim();
          console.log(`[Turn ${turnNum}] AI response received from Render backend: "${botReply.slice(0, 50)}..."`);
          break;
        }
      }
    } catch (renderErr: any) {
      console.warn(`[Render AI Backend] Notice on ${endpoint}:`, renderErr?.message || renderErr);
      // Fast fallback to Gemini
      break;
    }
  }

  // 6. ATTEMPT 2: LOCAL GEMINI API (using validated modern models)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!botReply && apiKey) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[Turn ${turnNum}] Generating response via Gemini model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: apiContents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 800,
            topP: 0.9,
          }
        });

        if (response && response.text && response.text.trim()) {
          botReply = response.text.trim();
          console.log(`[Turn ${turnNum}] Gemini ${modelName} succeeded: "${botReply.slice(0, 50)}..."`);
          break;
        }
      } catch (err: any) {
        console.warn(`[Turn ${turnNum}] Gemini ${modelName} call exception:`, err?.message || err);
      }
    }
  }

  // 7. ATTEMPT 3: DYNAMIC CONTEXTUAL CUSTOMER ENGINE (Guaranteed Non-Repetitive Fallback)
  if (!botReply) {
    console.log(`[Turn ${turnNum}] Utilizing contextual customer engine for ${persona.name}`);
    botReply = generateContextualCustomerResponse(
      latestAgentMsg,
      persona,
      messages || [],
      isEmailMode,
      turnNum
    );
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

  // 8. REAL-TIME SUPABASE PERSISTENCE FOR MESSAGES
  if (sessionId) {
    const traineeHeaderId = req.headers.get('x-trainee-id') || (body && (body.traineeId || body.userId));
    const scenarioType = persona?.issueCategory || 'general_support';
    if (latestAgentMsg) {
      syncSingleMessageToSupabase(sessionId, 'agent', latestAgentMsg, {
        traineeId: traineeHeaderId,
        scenarioType: scenarioType,
        status: 'OPEN'
      }).catch(() => {});
    }
    if (botReply) {
      syncSingleMessageToSupabase(sessionId, 'customer', botReply, {
        traineeId: traineeHeaderId,
        scenarioType: scenarioType,
        status: 'OPEN'
      }).catch(() => {});
    }
  }

  const responsePayload = {
    message: botReply,
    text: botReply,
    status: 'OPEN',
    turnNumber: turnNum
  };

  return NextResponse.json({
    text: JSON.stringify(responsePayload),
    message: botReply,
    status: 'OPEN'
  });
}
