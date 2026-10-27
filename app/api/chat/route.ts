import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRandomPersona, SYNTHETIC_PERSONAS, CustomerPersona } from '@/lib/personas';

// Supported model fallback cascade starting with gemini-2.0-flash as specified
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];

// Clean JSON schema to prevent Gemini INVALID_ARGUMENT (Schema does not support additionalProperties: false)
function sanitizeSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(sanitizeSchema);
  const copy: any = {};
  for (const [key, val] of Object.entries(schema)) {
    if (key === 'additionalProperties') continue;
    copy[key] = sanitizeSchema(val);
  }
  return copy;
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

  // Determine if this is a scenario generation request
  const isScenarioGen = !!(schema && schema.properties && schema.properties.openingMessage);
  const isEmailMode = mode === 'email';

  // 1. SCENARIO GENERATION: Randomly rotate through the 50 synthetic personas
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
        const snMatch = text.match(/Serial Number:\s*([^\n]+)/i);
        const ledMatch = text.match(/Status LED Light:\s*([^\n]+)/i);
        const issueMatch = text.match(/Issue:\s*([^\n]+)/i);
        if (nameMatch) {
          persona = {
            name: nameMatch[1].trim(),
            email: emailMatch ? emailMatch[1].trim() : '',
            phone: '+1 (206) 555-0148',
            shippingAddress: '742 Evergreen Terrace, Seattle, WA 98101',
            product: prodMatch ? prodMatch[1].trim() : 'Wyze Cam v4',
            macAddress: macMatch ? macMatch[1].trim() : '',
            orderNumber: orderMatch ? orderMatch[1].trim() : '',
            serialNumber: snMatch ? snMatch[1].trim() : '',
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

  // 3. BUILD API CALL STRUCTURE WITH FULL CONVERSATION HISTORY
  // Format required:
  // contents: [
  //   { role: "user", parts: [{ text: "" }] },
  //   { role: "model", parts: [{ text: "" }] },
  //   ... all previous turns in order ...
  //   { role: "user", parts: [{ text: "LATEST MESSAGE" }] }
  // ]
  const apiContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(incomingContents) && incomingContents.length > 0) {
    // Client passed the structured contents array directly
    for (const turn of incomingContents) {
      const text = turn.parts && turn.parts[0] ? String(turn.parts[0].text || '').trim() : String(turn.text || '').trim();
      if (!text) continue;
      const role = turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user';
      apiContents.push({ role, parts: [{ text }] });
    }
  } else if (Array.isArray(messages) && messages.length > 0) {
    // Map raw messages array to alternating user/model contents
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const text = String(m.content || m.text || '').trim();
      if (!text || m.role === 'system') continue;

      if (i === 0 && (m.role === 'customer' || m.role === 'assistant' || m.role === 'model')) {
        apiContents.push({ role: 'user', parts: [{ text: '[Customer opened ticket]' }] });
        apiContents.push({ role: 'model', parts: [{ text }] });
      } else if (m.role === 'agent' || m.role === 'user') {
        apiContents.push({ role: 'user', parts: [{ text }] });
      } else {
        apiContents.push({ role: 'model', parts: [{ text }] });
      }
    }
  }

  // Ensure apiContents is non-empty and has user as the last message
  if (apiContents.length === 0) {
    apiContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  } else if (apiContents[apiContents.length - 1].role !== 'user') {
    // If the last message was model, ensure user turn is appended
    apiContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  // 4. SYSTEM INSTRUCTION
  const systemInstruction = [
    "You are a non-tech-savvy customer contacting support.",
    "You have ZERO technical knowledge.",
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
    "Customer Profile (only reveal specifics when explicitly asked by the agent):",
    `- Name: ${persona.name}`,
    `- Email: ${persona.email}`,
    `- Phone: ${persona.phone}`,
    `- Address: ${persona.shippingAddress}`,
    `- Product: ${persona.product}`,
    `- Order Number: ${persona.orderNumber}`,
    `- MAC Address: ${persona.macAddress}`,
    `- Serial Number: ${persona.serialNumber}`,
    `- Purchase Date: ${persona.purchaseDate}`,
    `- Proof of Purchase: ${persona.proofOfPurchase}`,
    `- Status LED Light: ${persona.ledColor || 'solid yellow'}`,
    `- Issue: ${persona.issueCategory}`,
    isEmailMode
      ? "Format: Reply in a realistic, substantive support email format with full paragraph details."
      : "Format: Reply in live-chat format (1-2 sentences max). Do NOT use email greetings or signatures."
  ].join('\n');

  // 5. CALL GEMINI API WITH ERROR HANDLING & AUTOMATIC RETRY
  const apiKey = process.env.GEMINI_API_KEY;
  let botReply: string | null = null;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });

    // Settings as specified:
    // model: gemini-2.0-flash
    // temperature: 0.3
    // maxOutputTokens: 800
    // topP: 0.9
    const callModel = async (modelName: string): Promise<string | null> => {
      try {
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
          return response.text.trim();
        }
        return null;
      } catch (err: any) {
        console.error(`[Turn ${turnNum}] Error calling ${modelName}:`, err?.message || err);
        return null;
      }
    };

    // Attempt 1: Primary call to gemini-2.0-flash
    try {
      botReply = await callModel('gemini-2.0-flash');
    } catch (e1: any) {
      console.error(`[Turn ${turnNum}] Primary call exception:`, e1?.message || e1);
    }

    // Automatic retry once if empty or null response
    if (!botReply) {
      console.warn(`[Turn ${turnNum}] Bot response was empty or null. Retrying once automatically...`);
      try {
        // Try retry with gemini-2.0-flash or gemini-2.5-flash fallback
        botReply = await callModel('gemini-2.0-flash');
        if (!botReply) {
          botReply = await callModel('gemini-2.5-flash');
        }
      } catch (e2: any) {
        console.error(`[Turn ${turnNum}] Retry call exception:`, e2?.message || e2);
      }
    }
  }

  // If retry also fails, return fallback message as specified
  if (!botReply) {
    console.warn(`[Turn ${turnNum}] All Gemini attempts failed. Returning fallback message.`);
    botReply = "Sorry, I didn't catch that. Could you repeat?";
  }

  // Clean any stray markdown fences or JSON packaging if returned
  if (botReply.startsWith('```')) {
    botReply = botReply.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }
  try {
    const jsonParsed = JSON.parse(botReply);
    if (jsonParsed && typeof (jsonParsed.message || jsonParsed.text) === 'string') {
      botReply = jsonParsed.message || jsonParsed.text;
    }
  } catch {
    // plain text
  }

  const responsePayload = {
    message: botReply,
    text: botReply,
    status: isEmailMode ? 'OPEN' : 'OPEN'
  };

  return NextResponse.json({
    text: JSON.stringify(responsePayload),
    message: botReply,
    status: 'OPEN'
  });
}
