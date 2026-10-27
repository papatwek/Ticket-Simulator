import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getNextPersona, SYNTHETIC_PERSONAS } from '@/lib/personas';

// Supported model fallback cascade for high availability
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

// Clean JSON schema to prevent Gemini INVALID_ARGUMENT (Schema does not support additionalProperties: false)
function sanitizeSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(sanitizeSchema);
  const copy: any = {};
  for (const [key, val] of Object.entries(schema)) {
    if (key === 'additionalProperties') continue; // Strip additionalProperties
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

  const { messages, schema, sessionId, mode } = body || {};
  const rawMessages: Array<{ role: string; content?: string; text?: string }> = Array.isArray(messages) ? messages : [];

  // Determine if this is a scenario generation request
  const isScenarioGen = !!(schema && schema.properties && schema.properties.openingMessage);

  // Extract transcript and last agent message
  let lastAgentMsg = '';
  let fullTranscript = '';
  let customerPersonaInfo: any = null;

  for (const m of rawMessages) {
    const text = String(m.content || m.text || '');
    if (m.role === 'system') {
      fullTranscript += `\nSystem: ${text}`;
      // Extract persona details from system prompt if provided
      const nameMatch = text.match(/Name:\s*([^\n]+)/i);
      const emailMatch = text.match(/Email:\s*([^\n]+)/i);
      const prodMatch = text.match(/Product:\s*([^\n]+)/i);
      const macMatch = text.match(/MAC Address:\s*([^\n]+)/i);
      const orderMatch = text.match(/Order Number:\s*([^\n]+)/i);
      const snMatch = text.match(/Serial Number:\s*([^\n]+)/i);
      const issueMatch = text.match(/Issue:\s*([^\n]+)/i);
      const moodMatch = text.match(/Emotional state:\s*([^\n]+)/i);
      if (nameMatch) {
        customerPersonaInfo = {
          name: nameMatch[1].trim(),
          email: emailMatch ? emailMatch[1].trim() : '',
          product: prodMatch ? prodMatch[1].trim() : 'Wyze Cam v4',
          macAddress: macMatch ? macMatch[1].trim() : '',
          orderNumber: orderMatch ? orderMatch[1].trim() : '',
          serialNumber: snMatch ? snMatch[1].trim() : '',
          issueCategory: issueMatch ? issueMatch[1].trim() : '',
          emotionalState: moodMatch ? moodMatch[1].trim() : 'Frustrated'
        };
      }
    } else if (m.role === 'user' || m.role === 'agent') {
      fullTranscript += `\nUser/Agent: ${text}`;
      if (text.includes('Transcript so far:')) {
        const lines = text.split('\n');
        for (let j = lines.length - 1; j >= 0; j--) {
          if (lines[j].startsWith('Agent:')) {
            lastAgentMsg = lines[j].replace('Agent:', '').trim();
            break;
          }
        }
      } else {
        lastAgentMsg = text.trim();
      }
    } else {
      fullTranscript += `\nCustomer: ${text}`;
    }
  }

  // Explicit mode from request body takes highest precedence.
  // In Live Chat mode, isEmailMode MUST be false so messages remain brief and instant.
  const isEmailMode = mode === 'email' || (
    mode !== 'chat' && (
      fullTranscript.toLowerCase().includes('email thread') ||
      fullTranscript.toLowerCase().includes('support email') ||
      fullTranscript.toLowerCase().includes('zendesk email')
    )
  );

  // If scenario generation is requested, ALWAYS rotate through the 50 unique personas!
  if (isScenarioGen) {
    const nextP = getNextPersona();
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
      hiddenSummary: nextP.hiddenSummary,
      // Chat mode: strictly short, 1-2 sentence instant opening.
      // Email mode: substantive 2-3 paragraph background email with order/device details.
      openingMessage: isEmailMode ? nextP.openingMessageEmail : nextP.openingMessage,
      resolutionSteps: nextP.resolutionSteps
    };
    if (isEmailMode) {
      personaResponse.subject = nextP.subject;
    }
    return NextResponse.json({ text: JSON.stringify(personaResponse) });
  }

  // 1. Try Gemini API with strict Non-Technical Consumer Persona Instructions
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      let baseSystemPrompt = [
        "You are roleplaying as a REGULAR, NON-TECHNICAL customer contacting Wyze support.",
        "CRITICAL ROLEPLAY CONSTRAINTS:",
        "1. You are an ordinary customer who bought a Wyze smart device. You are NOT tech-savvy.",
        "2. You DO NOT know what the technical cause of your problem is.",
        "3. You DO NOT know how to troubleshoot or what steps to take in advance.",
        "4. You NEVER predict what the agent will do next or suggest troubleshooting steps.",
        "5. You NEVER jump ahead or perform future SOP steps (such as power cycling, holding setup buttons, splitting Wi-Fi, or scanning QR codes) until the agent explicitly tells you to do so right now.",
        "6. If asked for account or device details (name, email, serial number, MAC address, order number), check your records and give only what was asked.",
        "7. If asked a question (e.g. 'What color is the light?'), look at the device and answer simply what you see.",
        "8. If given a single instruction (e.g. 'Please unplug the power cord for 30 seconds'), take that step, state what happened, and ask what to do next.",
        "9. If the agent uses unfamiliar technical jargon (like 2.4GHz vs 5GHz SSID, subnet, baud rate), ask what that means like an ordinary person.",
        "10. Maintain your assigned emotional tone (calm, annoyed, frustrated, anxious, confused) consistently.",
        isEmailMode
          ? "11. For Email support: Write a realistic, substantive customer email with full sentences and paragraphs describing what happened and questions."
          : "11. For Live Chat: Keep messages strictly brief, conversational, and instant (1 to 2 short sentences max). NEVER write multiple paragraphs or email-style greetings/sign-offs. Reply casually like you are typing in a live chat window."
      ].join('\n');

      const chatContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      for (const msg of rawMessages) {
        const text = String(msg.content || msg.text || '').trim();
        if (!text) continue;

        if (msg.role === 'system') {
          baseSystemPrompt += '\n\n' + text;
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
        systemInstruction: baseSystemPrompt
      };

      if (schema && typeof schema === 'object') {
        config.responseMimeType = 'application/json';
        config.responseSchema = sanitizeSchema(schema);
      }

      for (const modelName of GEMINI_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: chatContents,
            config,
          });

          if (response && response.text) {
            return NextResponse.json({ text: response.text });
          }
        } catch (modelErr: any) {
          console.warn(`Gemini model ${modelName} error handled:`, modelErr?.message || modelErr);
        }
      }
    } catch (geminiError: any) {
      console.warn('Google GenAI pipeline error handled:', geminiError?.message || geminiError);
    }
  }

  // 2. Intelligent, Non-Technical Customer Conversational Fallback Engine
  // Comprehends the agent's message logically and relies 100% on the trainee's step-by-step guidance
  const persona = customerPersonaInfo || SYNTHETIC_PERSONAS[0];
  const lowerMsg = (lastAgentMsg || '').toLowerCase();

  let replyText = "";
  let ticketStatus = "OPEN";

  // Check what the agent is actually asking or instructing:
  if (/name|email|verify|account|who am i|who is this|confirm.*identity/i.test(lowerMsg)) {
    replyText = `Sure thing. My name is ${persona.name}, and the email on my Wyze account is ${persona.email}.`;
  } else if (/order|receipt|proof of purchase|pop|where.*buy|when.*purchase|bought/i.test(lowerMsg)) {
    replyText = `I have my order details right here. My order number was ${persona.orderNumber || 'TEST-WZ-104928'}, purchased under ${persona.proofOfPurchase || 'Wyze.com'}.`;
  } else if (/mac|serial|sn|sticker|hardware|model|barcode/i.test(lowerMsg)) {
    replyText = `Let me turn the device over to look at the small sticker on the bottom... The MAC address is ${persona.macAddress || '2C:AA:8E:44:91:02'} and the serial number is ${persona.serialNumber || 'TEST-SN-772910'}.`;
  } else if (/phone|shipping|address|send.*replacement|ship/i.test(lowerMsg)) {
    replyText = `My shipping address is ${persona.shippingAddress || '742 Evergreen Terrace, Seattle, WA 98101'} and my phone number is ${persona.phone || '+1 (206) 555-0148'}.`;
  } else if (/light|led|color|indicator|status light|front|blinking|solid/i.test(lowerMsg)) {
    replyText = `I'm looking directly at the small light on the front right now. It is currently ${persona.ledColor || 'solid yellow'} and not flashing.`;
  } else if (/unplug|power cycle|reboot|restart|power cord|wall outlet|disconnect.*power/i.test(lowerMsg)) {
    replyText = `Okay, I just reached behind and unplugged the power cable from the wall. Let me count to 30 seconds... Okay, plugging it back in now. The light went off, and now it just started flashing yellow. What should I do next?`;
  } else if (/2\.4|5ghz|router|dual|band|wifi|wi-fi|network|ssid|frequency/i.test(lowerMsg)) {
    replyText = `I have home Wi-Fi from my cable company, but I'm not really sure about 2.4GHz or 5GHz. I just see one network name in my phone. How do I check if my phone is on 2.4GHz?`;
  } else if (/connect.*phone|choose.*2g|select.*2\.4|wifi settings/i.test(lowerMsg)) {
    replyText = `Okay, I opened my phone settings like you said and I see one called Home_2G! I just tapped it and connected my phone to it.`;
  } else if (/setup button|hold.*button|press.*button|rubber flap|button on/i.test(lowerMsg)) {
    replyText = `Where is the setup button? Oh, under the little rubber flap on the bottom! Okay, I held it down for a few seconds... and the camera speaker just chimed and said 'Ready to connect'!`;
  } else if (/qr|code|scan|screen|hold.*camera|camera.*lens/i.test(lowerMsg)) {
    replyText = `I'm holding my phone screen with the QR code about 6 inches from the camera lens... It just made a ding sound and announced 'QR code scanned, please wait'! The status light just turned solid blue!`;
  } else if (/work|live|stream|feed|picture|see.*video|app.*showing/i.test(lowerMsg)) {
    replyText = `Let me check the Wyze app... Oh, wow! The live video stream just opened right up in full color! It shows my room clearly and says 'Live'. It looks like that fixed it!`;
    ticketStatus = isEmailMode ? "SOLVED" : "RESOLVED";
  } else if (/anything else|further|wrap|all set|recap|summary/i.test(lowerMsg)) {
    replyText = `That was everything I needed help with today! Thank you so much for being patient and guiding me step by step. Have a wonderful rest of your day!`;
    ticketStatus = isEmailMode ? "SOLVED" : "RESOLVED";
  } else if (/hello|hi|good morning|good afternoon|how can i help|thank you for contacting/i.test(lowerMsg)) {
    replyText = `Hi! Thanks for taking my case. My ${persona.product || 'Wyze device'} has an issue: ${persona.issueCategory || 'it stopped connecting'}. Please let me know what I should do.`;
  } else {
    replyText = `I'm standing right here with the ${persona.product || 'device'} following your instructions. What is the next step you'd like me to try?`;
  }

  // In Email mode, format the customer response as a detailed, substantive email
  if (isEmailMode) {
    replyText = `Hello,\n\nThank you for getting back to me regarding my ${persona.product}.\n\n${replyText}\n\nCould you please let me know what our next step is?\n\nSincerely,\n${persona.name}`;
  }

  const fallbackReply = {
    message: replyText,
    status: ticketStatus
  };

  return NextResponse.json({ text: JSON.stringify(fallbackReply) });
}
