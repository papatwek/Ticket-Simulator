import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { CUSTOMER_POOL, getCustomerByIdx } from '@/lib/customerPool';

// Supported model fallback cascade using valid, active Gemini models
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

let globalPersonaSeq = 0;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const { messages, schema, sessionId, identityIndex, isEmail } = body || {};
  const rawMessages: Array<{ role: string; content?: string; text?: string }> = Array.isArray(messages) ? messages : [];

  // Determine rotated identity for consistent, non-repeating personas
  let chosenIdx = typeof identityIndex === 'number' ? identityIndex : globalPersonaSeq++;
  const activeIdentity = getCustomerByIdx(chosenIdx);

  // Extract last agent message for conversational intelligence fallback
  let lastAgentMsg = '';
  for (let i = rawMessages.length - 1; i >= 0; i--) {
    const m = rawMessages[i];
    if (m.role === 'user' || m.role === 'agent') {
      const content = String(m.content || m.text || '');
      if (content.includes('Transcript so far:')) {
        const lines = content.split('\n');
        for (let j = lines.length - 1; j >= 0; j--) {
          if (lines[j].startsWith('Agent:')) {
            lastAgentMsg = lines[j].replace('Agent:', '').trim();
            break;
          }
        }
      } else {
        lastAgentMsg = content.trim();
      }
      if (lastAgentMsg) break;
    }
  }

  // 1. Try Render Dedicated AI Backend if configured and reachable
  const backendBase = process.env.NEXT_PUBLIC_AI_BACKEND_URL;
  if (backendBase && backendBase.startsWith('http')) {
    try {
      const backendUrl = `${backendBase.replace(/\/$/, '')}/generate-reply`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const renderResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (renderResponse.ok) {
        const renderData = await renderResponse.json();
        if (renderData && (renderData.text || renderData.message || typeof renderData === 'string')) {
          return NextResponse.json(renderData);
        }
      }
    } catch {
      // Gracefully continue to native server-side Gemini
    }
  }

  // 2. Primary / Resilient Server-Side Google GenAI Execution
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      let systemInstruction = [
        `You are roleplaying strictly as an everyday retail customer named ${activeIdentity.name}.`,
        `Product: ${activeIdentity.product}. Emotional Tone: ${activeIdentity.emotionalState}.`,
        `STRICT PERSONA RULES:`,
        `1. YOU ARE A REGULAR CONSUMER WITH ZERO TECHNICAL KNOWLEDGE.`,
        `2. NEVER suggest what to do next, do NOT predict troubleshooting solutions, and do NOT offer technical theories.`,
        `3. You rely completely on the trainee agent to guide you.`,
        `4. Answer the agent's questions directly and truthfully based on your details:`,
        `   - Name: ${activeIdentity.name}, Email: ${activeIdentity.email}, Phone: ${activeIdentity.phone}`,
        `   - Order/POP: ${activeIdentity.orderNumber} (purchased from ${activeIdentity.retailer} on ${activeIdentity.purchaseDate})`,
        `   - MAC Address: ${activeIdentity.macAddress}, Serial Number: ${activeIdentity.serialNumber}`,
        `5. If the agent gives you a single troubleshooting instruction (e.g. unplug device, look at the LED, press setup button, switch Wi-Fi network):`,
        `   - Carry out only that single step.`,
        `   - Report what you physically observe in everyday layman words.`,
        `   - Ask: "What should I do next?" or "Does that look right?"`,
        isEmail
          ? `6. For EMAIL simulation: write a realistic, detailed email response (1 to 3 paragraphs) including purchase context and symptom details.`
          : `6. For LIVE CHAT: keep responses conversational, concise, and focused on the agent's exact message.`,
        `7. Never break character. Never state that you are an AI or simulation.`
      ].join('\n');

      const chatContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      for (const msg of rawMessages) {
        const text = String(msg.content || msg.text || '').trim();
        if (!text) continue;

        if (msg.role === 'system') {
          systemInstruction += '\n\n' + text;
        } else if (msg.role === 'assistant' || msg.role === 'model' || msg.role === 'agent') {
          chatContents.push({ role: 'model', parts: [{ text }] });
        } else {
          chatContents.push({ role: 'user', parts: [{ text }] });
        }
      }

      if (chatContents.length === 0) {
        chatContents.push({ role: 'user', parts: [{ text: 'Please proceed with the support roleplay scenario.' }] });
      }

      const config: any = {
        systemInstruction: systemInstruction,
      };

      if (schema && typeof schema === 'object') {
        config.responseMimeType = 'application/json';
        config.responseSchema = schema;
      }

      // Try model fallback cascade
      for (const modelName of GEMINI_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: chatContents,
            config: Object.keys(config).length > 0 ? config : undefined,
          });

          if (response && response.text) {
            return NextResponse.json({ text: response.text });
          }
        } catch (modelErr: any) {
          const isNotFound = modelErr?.message?.includes('404') || modelErr?.status === 404;
          if (!isNotFound) {
            console.warn(`Model ${modelName} error:`, modelErr?.message || modelErr);
          }
        }
      }
    } catch (geminiError: any) {
      console.warn('Google GenAI pipeline error handled:', geminiError?.message || geminiError);
    }
  }

  // 3. Intelligent Deterministic Simulation Engine
  // Rotates through the 60+ unique customer identities and behaves as a non-technical customer
  if (schema && schema.properties && schema.properties.openingMessage) {
    const isEmailScenario = isEmail || (schema.properties.subject !== undefined);
    const persona = {
      name: activeIdentity.name,
      email: activeIdentity.email,
      phone: activeIdentity.phone,
      shippingAddress: activeIdentity.shippingAddress,
      product: activeIdentity.product,
      macAddress: activeIdentity.macAddress,
      orderNumber: activeIdentity.orderNumber,
      serialNumber: activeIdentity.serialNumber,
      purchaseDate: activeIdentity.purchaseDate,
      retailer: activeIdentity.retailer,
      issueCategory: activeIdentity.issueCategory,
      emotionalState: activeIdentity.emotionalState,
      hiddenSummary: `Customer is experiencing ${activeIdentity.symptomDetails}. They have zero technical background and will follow instructions one at a time. Ideal SOP: verify account/POP, check status LED, power-cycle/reset, confirm 2.4 GHz network, and re-pair.`,
      openingMessage: isEmailScenario ? activeIdentity.emailBody : activeIdentity.chatOpening,
      subject: activeIdentity.emailSubject,
      resolutionSteps: [
        "Acknowledge customer concerns with empathy and confirm customer name & email.",
        "Verify Proof of Purchase (Order # or retailer receipt) and product model.",
        "Check device status indicator or current LED color.",
        "Guide customer through simple power-cycle or reset step without technical jargon.",
        "Ensure smartphone is on a 2.4 GHz Wi-Fi network and guide setup.",
        "Confirm live stream or device function is restored and summarize case resolution."
      ]
    };
    return NextResponse.json({ text: JSON.stringify(persona) });
  }

  // Conversational response logic: innocent non-tech customer reacting to agent
  const lowerMsg = (lastAgentMsg || '').toLowerCase();
  let replyText = "";
  let ticketStatus = "OPEN";

  if (/name|who are you|who am i/i.test(lowerMsg) && /email/i.test(lowerMsg)) {
    replyText = `My name is ${activeIdentity.name}, and my email address linked to the order is ${activeIdentity.email}.`;
  } else if (/name/i.test(lowerMsg) && !/product|device/i.test(lowerMsg)) {
    replyText = `My name is ${activeIdentity.name}.`;
  } else if (/email/i.test(lowerMsg)) {
    replyText = `The email address on my Wyze account is ${activeIdentity.email}.`;
  } else if (/order|pop|proof of purchase|receipt|bought|where did you purchase/i.test(lowerMsg)) {
    replyText = `I bought it from ${activeIdentity.retailer} on ${activeIdentity.purchaseDate}. My order number is ${activeIdentity.orderNumber}.`;
  } else if (/mac|serial|sticker|barcode/i.test(lowerMsg)) {
    replyText = `I looked at the small sticker on the bottom of the device. The MAC address is ${activeIdentity.macAddress} and the Serial Number says ${activeIdentity.serialNumber}.`;
  } else if (/light|led|color|indicator|front/i.test(lowerMsg)) {
    replyText = `Looking at the front of the ${activeIdentity.product} right now, the little light is sitting solid yellow. It's not blinking or changing color.`;
  } else if (/unplug|power cycle|reboot|restart|power cord|wall outlet/i.test(lowerMsg)) {
    replyText = `Okay, I unplugged the power adapter from the wall, waited about 30 seconds, and plugged it back in. Now the yellow light is blinking slowly. What should I do next?`;
  } else if (/setup button|bottom button|pin|hold down|press and hold/i.test(lowerMsg)) {
    replyText = `I found the button and held it down for a few seconds. The device just made a chime sound and announced 'Ready to connect'. What's the next step?`;
  } else if (/qr|code|scan|camera lens|screen/i.test(lowerMsg)) {
    replyText = `I held up the QR code on my phone in front of the lens like you said... and it just beeped and said 'QR code scanned, please wait'! Now the light changed to solid blue!`;
  } else if (/2\.4|5ghz|router|wifi|wi-fi|network name|ssid/i.test(lowerMsg)) {
    replyText = `I checked my phone's Wi-Fi list. I see two names for my home internet: one ends in '5G' and the other one doesn't. I just connected my phone to the regular one without 5G. Is that right?`;
  } else if (/app|open|live|stream|feed|picture|see/i.test(lowerMsg)) {
    replyText = `Yes! I just opened the live view in the Wyze app and the video feed came right up in clear 2.5K! The camera is working completely now. Thank you so much for walking me through that!`;
    ticketStatus = "RESOLVED";
  } else if (/anything else|further questions|all set|wrap up|case recap/i.test(lowerMsg)) {
    replyText = `That's everything I needed help with! You were so patient and helpful. Thank you again, have a wonderful day!`;
    ticketStatus = "RESOLVED";
  } else {
    replyText = `I'm here and ready. What is the next step you would like me to try with the ${activeIdentity.product}?`;
  }

  // Format email response if requested
  if (isEmail) {
    replyText = `Hello,\n\n${replyText}\n\nThank you,\n${activeIdentity.name}`;
  }

  const fallbackReply = {
    message: replyText,
    status: ticketStatus
  };

  return NextResponse.json({ text: JSON.stringify(fallbackReply) });
}
