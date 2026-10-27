import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getNextPersona, SYNTHETIC_PERSONAS, CustomerPersona } from '@/lib/personas';

// Supported model fallback cascade using active, supported Gemini models
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

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

  const { messages, schema, sessionId, mode } = body || {};
  const rawMessages: Array<{ role: string; content?: string; text?: string }> = Array.isArray(messages) ? messages : [];

  // Determine if this is a scenario generation request
  const isScenarioGen = !!(schema && schema.properties && schema.properties.openingMessage);

  // Extract transcript, agent messages, and previous customer messages
  let lastAgentMsg = '';
  let fullTranscript = '';
  let customerPersonaInfo: any = null;
  const previousCustomerMessages: string[] = [];
  const agentMessages: string[] = [];

  for (const m of rawMessages) {
    const text = String(m.content || m.text || '').trim();
    if (!text) continue;

    if (m.role === 'system') {
      fullTranscript += `\nSystem: ${text}`;
      const nameMatch = text.match(/Name:\s*([^\n]+)/i);
      const emailMatch = text.match(/Email:\s*([^\n]+)/i);
      const prodMatch = text.match(/Product:\s*([^\n]+)/i);
      const macMatch = text.match(/MAC Address:\s*([^\n]+)/i);
      const orderMatch = text.match(/Order Number:\s*([^\n]+)/i);
      const snMatch = text.match(/Serial Number:\s*([^\n]+)/i);
      const purchaseDateMatch = text.match(/Purchase Date:\s*([^\n]+)/i);
      const popMatch = text.match(/Proof of Purchase:\s*([^\n]+)/i);
      const issueMatch = text.match(/Issue:\s*([^\n]+)/i);
      const moodMatch = text.match(/Emotional state:\s*([^\n]+)/i);
      const ledMatch = text.match(/Status LED Light:\s*([^\n]+)/i);
      const addressMatch = text.match(/Address:\s*([^\n]+)/i);
      const phoneMatch = text.match(/Phone:\s*([^\n]+)/i);

      if (nameMatch) {
        customerPersonaInfo = {
          name: nameMatch[1].trim(),
          email: emailMatch ? emailMatch[1].trim() : '',
          phone: phoneMatch ? phoneMatch[1].trim() : '',
          shippingAddress: addressMatch ? addressMatch[1].trim() : '',
          product: prodMatch ? prodMatch[1].trim() : 'Wyze Cam v4',
          macAddress: macMatch ? macMatch[1].trim() : '',
          orderNumber: orderMatch ? orderMatch[1].trim() : '',
          serialNumber: snMatch ? snMatch[1].trim() : '',
          purchaseDate: purchaseDateMatch ? purchaseDateMatch[1].trim() : '2025-09-12',
          proofOfPurchase: popMatch ? popMatch[1].trim() : 'Wyze.com Order',
          issueCategory: issueMatch ? issueMatch[1].trim() : 'Device offline or won\'t connect to Wi-Fi',
          emotionalState: moodMatch ? moodMatch[1].trim() : 'Frustrated',
          ledColor: ledMatch ? ledMatch[1].trim() : 'solid yellow'
        };
      }
    } else if (m.role === 'user' || m.role === 'agent') {
      fullTranscript += `\nUser/Agent: ${text}`;
      if (text.includes('Transcript so far:')) {
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('Agent:')) {
            const content = trimmed.replace(/^Agent:\s*/, '').trim();
            if (content) {
              agentMessages.push(content);
              lastAgentMsg = content;
            }
          } else if (trimmed.startsWith('Customer:')) {
            const content = trimmed.replace(/^Customer:\s*/, '').trim();
            if (content) previousCustomerMessages.push(content);
          }
        }
      } else {
        lastAgentMsg = text.trim();
        agentMessages.push(lastAgentMsg);
      }
    } else if (m.role === 'customer' || m.role === 'assistant' || m.role === 'model') {
      fullTranscript += `\nCustomer: ${text}`;
      previousCustomerMessages.push(text.trim());
    }
  }

  // Detect Agent Name if they introduced themselves (e.g. "I'm Patrick", "My name is Patrick")
  let agentName = '';
  for (const aMsg of agentMessages) {
    const introMatch = aMsg.match(/(?:i'?m|my name is|this is)\s+([A-Z][a-z]+)/i);
    if (introMatch && !/wyze|support|agent|here/i.test(introMatch[1])) {
      agentName = introMatch[1].trim();
      break;
    }
  }

  // Determine email vs live-chat mode
  const isEmailMode = mode === 'email' || (
    mode !== 'chat' && (
      fullTranscript.toLowerCase().includes('email thread') ||
      fullTranscript.toLowerCase().includes('support email') ||
      fullTranscript.toLowerCase().includes('zendesk email')
    )
  );

  // If scenario generation is requested, ALWAYS rotate sequentially through the 50 unique personas!
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

  // Determine active persona
  let persona: CustomerPersona = customerPersonaInfo;
  if (!persona) {
    persona = SYNTHETIC_PERSONAS[0];
  } else if (!persona.ledColor) {
    const matched = SYNTHETIC_PERSONAS.find(p => p.name === persona.name);
    persona.ledColor = matched ? matched.ledColor : 'solid yellow';
  }

  // 1. Try Gemini API with the USER'S EXACT STRICT ROLEPLAY CONSTRAINTS
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const baseSystemPrompt = [
        `Goal: You are a regular customer named ${persona.name} contacting Wyze support.`,
        `Product: ${persona.product}. Emotional State: ${persona.emotionalState || 'Normal'}.`,
        `Status LED light: ${persona.ledColor || 'solid yellow'}.`,
        "",
        "STRICT CONVERSATIONAL RULES:",
        "- Before responding, identify what the agent's last message is:",
        "  - Question -> answer it only. Be direct and concise.",
        "  - Instruction -> simulate attempting the step, describe what you see or experience in everyday layman words, and ask what to do next.",
        "  - Statement / Empathy -> acknowledge it naturally (e.g. 'Thank you, I appreciate that' or 'Sure, take your time'). Do NOT ask what to do next.",
        "- NEVER repeat a message you already sent in this conversation.",
        "- NEVER ask what to do next unless the agent just gave you an instruction step that you just performed.",
        "- NEVER skip ahead or assume what comes next.",
        "- You have ZERO technical knowledge. You do not know how to troubleshoot or what the problem is.",
        "- Always wait for the agent to lead the conversation.",
        "- Stay fully in sequence with the conversation flow.",
        isEmailMode
          ? "- Email Mode: Write in a realistic, substantive customer email format with clear paragraphs."
          : "- Live Chat Mode: Keep messages strictly brief (1 to 2 short sentences max), instant, and conversational. Do not write email greetings or signatures.",
        "",
        "Customer Facts (reveal only when asked):",
        `- Name: ${persona.name}`,
        `- Email: ${persona.email}`,
        `- Phone: ${persona.phone}`,
        `- Address: ${persona.shippingAddress}`,
        `- Product: ${persona.product}`,
        `- MAC Address: ${persona.macAddress}`,
        `- Serial Number: ${persona.serialNumber}`,
        `- Order Number: ${persona.orderNumber}`,
        `- Purchase Date: ${persona.purchaseDate}`,
        `- Proof of Purchase: ${persona.proofOfPurchase}`,
        `- Light Color: ${persona.ledColor || 'solid yellow'}`
      ].join('\n');

      const chatContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      for (const msg of rawMessages) {
        const text = String(msg.content || msg.text || '').trim();
        if (!text) continue;
        if (msg.role === 'system') continue;

        if (msg.role === 'assistant' || msg.role === 'model') {
          chatContents.push({ role: 'model', parts: [{ text }] });
        } else {
          chatContents.push({ role: 'user', parts: [{ text }] });
        }
      }

      if (chatContents.length === 0) {
        chatContents.push({ role: 'user', parts: [{ text: `Agent's message: "${lastAgentMsg || 'Hello'}"` }] });
      }

      const config: any = {
        systemInstruction: baseSystemPrompt,
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
            let candidateText = response.text;
            let parsedMessage = '';
            try {
              const parsed = JSON.parse(candidateText);
              parsedMessage = parsed.message || parsed.text || '';
            } catch {
              parsedMessage = candidateText;
            }

            // Quality Check: Ensure Gemini did not repeat a previous customer message
            const isDuplicate = previousCustomerMessages.some(prev =>
              prev.toLowerCase().trim() === parsedMessage.toLowerCase().trim()
            );

            if (!isDuplicate && parsedMessage.trim()) {
              return NextResponse.json({ text: candidateText });
            }
          }
        } catch (modelErr: any) {
          console.warn(`Gemini model ${modelName} error handled:`, modelErr?.message || modelErr);
        }
      }
    } catch (geminiError: any) {
      console.warn('Google GenAI pipeline error handled:', geminiError?.message || geminiError);
    }
  }

  // 2. Comprehensive, Intelligent Non-Technical Conversational Simulation Engine
  // Comprehends the agent's exact message intent (Question vs Instruction vs Statement)
  // and enforces ZERO repetition, zero unprompted questions, and strict sequence fidelity.
  const lowerMsg = (lastAgentMsg || '').toLowerCase().trim();
  let replyText = "";
  let ticketStatus = "OPEN";

  // Helper to pick a non-repeating variation
  function pickFresh(options: string[]): string {
    for (const opt of options) {
      const alreadyUsed = previousCustomerMessages.some(prev =>
        prev.toLowerCase().includes(opt.toLowerCase().slice(0, 20))
      );
      if (!alreadyUsed) return opt;
    }
    return options[0];
  }

  // --------------------------------------------------------------------------
  // STEP A: IDENTIFY MESSAGE TYPE (Question, Instruction, or Statement)
  // --------------------------------------------------------------------------

  // 1. GREETING & SELF-INTRO (Turn 1 or when agent introduces themselves)
  // e.g., "Thanks for reaching out! I'm Patrick and I'll do my best to help"
  const isGreetingIntro = /^(hi|hello|hey|good\s+(morning|afternoon|evening)|thanks\s+for\s+(reaching|contacting)|welcome\s+to\s+wyze)/i.test(lowerMsg) ||
    (/(?:i'?m|my name is|this is)\s+[a-z]+/i.test(lowerMsg) && /(help|assist|support|wyze)/i.test(lowerMsg));

  // 2. PERMISSION / INTRODUCTORY QUESTIONS
  // e.g., "Can I ask you few questions regarding the issue you're having with your device?"
  const isPermissionQuestion = /(can|may|could)\s+i\s+(ask|have|take|get|start).*questions?/i.test(lowerMsg) ||
    /do\s+you\s+mind\s+if\s+i\s+ask/i.test(lowerMsg) ||
    /ready\s+to\s+(start|begin|answer)/i.test(lowerMsg) ||
    /can\s+we\s+start/i.test(lowerMsg);

  // 3. ACCOUNT & PERSONAL IDENTITY QUESTIONS
  const asksNameAndEmail = /(name.*email|email.*name|verify.*(account|details)|confirm.*(identity|account|details))/i.test(lowerMsg);
  const asksNameOnly = !asksNameAndEmail && /(your\s+name|who\s+am\s+i\s+speaking|who\s+is\s+this|may\s+i\s+have\s+your\s+name)/i.test(lowerMsg);
  const asksEmailOnly = !asksNameAndEmail && /(your\s+email|email\s+address|email\s+linked|email\s+on\s+file)/i.test(lowerMsg);
  const asksPhone = /(phone\s*#|phone\s+number|contact\s+number|callback\s+number)/i.test(lowerMsg);
  const asksAddress = /(shipping\s+address|mailing\s+address|home\s+address|where\s+should\s+we\s+ship)/i.test(lowerMsg);

  // 4. DEVICE IDENTIFIERS
  const asksProofOfPurchase = /(order\s*#|order\s+number|proof\s+of\s+purchase|pop|receipt|where\s+did\s+you\s+(buy|purchase)|when\s+did\s+you\s+(buy|purchase)|bought\s+from|retailer)/i.test(lowerMsg);
  const asksMacOrSerial = /(mac\s+address|serial\s+number|s\/?n\b|sticker\s+on\s+the\s+bottom|barcode|hardware\s+id)/i.test(lowerMsg);
  const asksDeviceModel = /(which\s+(camera|device|product|model)|what\s+model|what\s+device\s+do\s+you\s+have)/i.test(lowerMsg);

  // 5. DIAGNOSTIC / OBSERVATION QUESTIONS (Answering what the customer sees or experiences)
  const asksLightColor = /(what\s+color|status\s+light|front\s+light|led(\s+light)?|color\s+is\s+(it|the\s+light)|is\s+the\s+light\s+(blinking|flashing|solid)|indicator\s+light)/i.test(lowerMsg);
  const asksErrorCode = /(error\s+code|error\s+message|what\s+does\s+the\s+app\s+say|what\s+do\s+you\s+see\s+in\s+the\s+app)/i.test(lowerMsg);
  const asksWifiDetails = /(2\.4|5g|5ghz|router|dual\s+band|frequency|how\s+far|distance\s+from|same\s+room|network\s+name|ssid)/i.test(lowerMsg);
  const asksWhenStarted = /(when\s+did\s+this|did\s+anything\s+happen|power\s+outage|storm|dropped|recent\s+changes|how\s+long\s+has)/i.test(lowerMsg);

  // 6. ACTIONABLE TROUBLESHOOTING INSTRUCTIONS (Customer attempts step, reports what happened, and asks what's next)
  const instructsPowerCycle = /(unplug|power\s+cycle|reboot|restart|disconnect.*power|remove\s+the\s+plug|wall\s+outlet|plug\s+it\s+back)/i.test(lowerMsg);
  const instructsSetupButton = /(setup\s+button|reset\s+button|press\s+and\s+hold|hold\s+(down\s+)?the\s+button|rubber\s+flap|pinhole|factory\s+reset)/i.test(lowerMsg);
  const instructsWifiSwitch = /(connect.*phone|choose.*2g|select.*2\.4|switch.*wi-?fi|phone\s+settings|forget\s+network)/i.test(lowerMsg);
  const instructsQrScan = /(qr(\s+code)?|scan|camera\s+lens|hold.*phone|screen.*front|show\s+the\s+code)/i.test(lowerMsg);
  const instructsAppCheck = /(check\s+(the\s+)?(app|live|stream|view|feed)|open\s+(the\s+)?(wyze\s+)?app|can\s+you\s+see|is\s+it\s+working|try\s+viewing|test\s+it\s+now)/i.test(lowerMsg);

  // 7. EMPATHY & STATEMENTS (No question, no instruction)
  // e.g., "I understand that you're having issues with your Wyze Cam v4 going offline. No worries, I'll do my best to help."
  const isEmpathyStatement = /(i\s+understand|i\s+see|i\s+hear\s+you|no\s+worries|i'?ll\s+do\s+my\s+best|happy\s+to\s+help|glad\s+to\s+assist|i\s+can\s+(certainly|definitely)\s+help|sorry\s+(to\s+hear|for\s+the\s+trouble|for\s+the\s+inconvenience))/i.test(lowerMsg) &&
    !lowerMsg.includes('?') && !instructsPowerCycle && !instructsSetupButton && !instructsWifiSwitch && !instructsQrScan && !instructsAppCheck;

  // 8. HOLD / REVIEW STATEMENTS
  // e.g., "One moment please while I look into this", "Let me check your account"
  const isHoldStatement = /(one\s+moment|give\s+me\s+a\s+(moment|second|min)|bear\s+with\s+me|checking\s+(your\s+account|into\s+this)|looking\s+into\s+this|pulling\s+up\s+your\s+details)/i.test(lowerMsg) && !lowerMsg.includes('?');

  // 9. RESOLUTION & CLOSING CONFIRMATION
  const isClosing = /(anything\s+else|further\s+(questions|assistance|help)|wrap\s*up|all\s+set|have\s+a\s+(great|wonderful)\s+day|goodbye|take\s+care)/i.test(lowerMsg);

  // --------------------------------------------------------------------------
  // STEP B: GENERATE DIRECT, LOGICAL, SEQUENTIAL RESPONSES
  // --------------------------------------------------------------------------

  if (isClosing) {
    replyText = pickFresh([
      "That was everything I needed help with today! Thank you so much for being so patient and walking me through it. Have a wonderful rest of your day!",
      "I'm all set! Everything is working great now. Thank you so much for your help!",
      "Nope, that covers everything! Thank you again, have a great day!"
    ]);
    ticketStatus = isEmailMode ? "SOLVED" : "RESOLVED";

  } else if (isPermissionQuestion) {
    // Answer permission question directly without asking what to do next
    replyText = pickFresh([
      "Sure, go right ahead.",
      "Yes, of course, ask whatever you need.",
      "Sure thing, what would you like to know?",
      "Yes, absolutely. What do you need to know?"
    ]);

  } else if (asksNameAndEmail) {
    replyText = `Sure thing. My name is ${persona.name}, and the email on my Wyze account is ${persona.email}.`;

  } else if (asksNameOnly) {
    replyText = `My name is ${persona.name}.`;

  } else if (asksEmailOnly) {
    replyText = `The email address associated with my Wyze account is ${persona.email}.`;

  } else if (asksPhone || asksAddress) {
    replyText = `My phone number is ${persona.phone || '+1 (206) 555-0148'} and my shipping address is ${persona.shippingAddress || '742 Evergreen Terrace, Seattle, WA 98101'}.`;

  } else if (asksProofOfPurchase) {
    replyText = `I have the order details right here. My order number was ${persona.orderNumber || 'TEST-WZ-104928'}, purchased under ${persona.proofOfPurchase || 'Wyze.com'} on ${persona.purchaseDate || 'September 12, 2025'}.`;

  } else if (asksMacOrSerial) {
    replyText = `Let me turn the device over to check the small sticker on the bottom... The MAC address is ${persona.macAddress || '2C:AA:8E:44:91:02'} and the serial number says ${persona.serialNumber || 'TEST-SN-772910'}.`;

  } else if (asksDeviceModel) {
    replyText = `It is a ${persona.product || 'Wyze Cam v4'}.`;

  } else if (asksLightColor) {
    // Answer light color directly. DO NOT ask what to do next!
    replyText = pickFresh([
      `Looking directly at the front of the ${persona.product || 'camera'} right now, the light is sitting on ${persona.ledColor || 'solid yellow'} and not blinking.`,
      `The little status light on the front is ${persona.ledColor || 'solid yellow'}. It isn't flashing or changing color.`,
      `I'm looking at it now and the light is ${persona.ledColor || 'solid yellow'}.`
    ]);

  } else if (asksErrorCode) {
    replyText = "In the Wyze app, it shows 'Device Offline (Error code -90)' whenever I tap on the camera tile.";

  } else if (asksWifiDetails) {
    replyText = "My home Wi-Fi router is in the next room, maybe 15 feet away. I'm not really sure if it's on 2.4GHz or 5GHz though. How do I check that on my phone?";

  } else if (asksWhenStarted) {
    replyText = "It just happened yesterday morning out of the blue. There were no power cuts or storms, and none of our other devices had any problems.";

  } else if (instructsPowerCycle) {
    // Attempt instruction, report what happened, and ask what to do next
    replyText = "Okay, I reached behind and unplugged the power cable from the wall. Let me count to 30 seconds... Okay, plugging it back in now. The light went off, and now it just started flashing yellow. What should I do next?";

  } else if (instructsSetupButton) {
    replyText = "I found the setup button under the little rubber flap and held it down for a few seconds. The camera speaker just chimed and said 'Ready to connect'. What's the next step?";

  } else if (instructsWifiSwitch) {
    replyText = "Okay, I opened my phone settings and connected my phone to our regular 2.4G network name. What should I do next?";

  } else if (instructsQrScan) {
    replyText = "I held up my phone screen with the QR code about 6 inches from the camera lens... It just made a ding sound and announced 'QR code scanned, please wait'! The status light just turned solid blue!";

  } else if (instructsAppCheck) {
    replyText = "Let me check the Wyze app... Oh, wow! The live video stream just opened right up in full color! It shows my room clearly and says 'Live'. It looks like that fixed it completely! Thank you so much!";
    ticketStatus = isEmailMode ? "SOLVED" : "RESOLVED";

  } else if (isHoldStatement) {
    replyText = pickFresh([
      "No problem, take your time.",
      "Sounds good, standing by.",
      `Sure thing${agentName ? ', thanks ' + agentName : ''}, I'll be right here.`,
      "Take your time, no rush."
    ]);

  } else if (isEmpathyStatement) {
    // Natural statement acknowledgment. DO NOT ask what to do next!
    replyText = pickFresh([
      `Thank you${agentName ? ' ' + agentName : ''}, I really appreciate your help with this.`,
      "Thank you, I appreciate that.",
      "Thanks, I appreciate you looking into it.",
      "Thank you, hopefully we can get it back up and running."
    ]);

  } else if (isGreetingIntro) {
    replyText = pickFresh([
      `Hi${agentName ? ' ' + agentName : ''}, thanks for taking my case. I appreciate your help.`,
      `Hello${agentName ? ' ' + agentName : ''}! Thanks for helping me out today.`,
      `Hi${agentName ? ' ' + agentName : ''}, thanks for reaching back out to me.`
    ]);

  } else if (lowerMsg.includes('?')) {
    // Agent asked an open question that didn't match standard keywords
    replyText = pickFresh([
      "I'm not completely sure about that, but let me know what you'd like me to check on the device.",
      "No, nothing like that has happened.",
      "Yes, that's correct.",
      "I haven't noticed anything like that."
    ]);

  } else {
    // Agent made a general statement
    replyText = pickFresh([
      "Understood, thank you.",
      "Got it.",
      "I see, thanks for letting me know.",
      "Okay, sounds good."
    ]);
  }

  // --------------------------------------------------------------------------
  // STEP C: HARDCODE ANTI-REPETITION GUARANTEE
  // --------------------------------------------------------------------------
  if (previousCustomerMessages.some(prev => prev.trim().toLowerCase() === replyText.trim().toLowerCase())) {
    const freshAlternates = [
      "Understood, thanks for letting me know.",
      "Thank you, I appreciate your help.",
      "Sure thing, standing by.",
      "Got it, thank you.",
      "Okay, let me know what we should do next."
    ];
    for (const alt of freshAlternates) {
      if (!previousCustomerMessages.some(prev => prev.trim().toLowerCase() === alt.trim().toLowerCase())) {
        replyText = alt;
        break;
      }
    }
  }

  // In Email mode, format the customer response as a detailed, substantive email
  if (isEmailMode) {
    replyText = `Hello${agentName ? ' ' + agentName : ''},\n\n${replyText}\n\nSincerely,\n${persona.name}`;
  }

  const fallbackReply = {
    message: replyText,
    status: ticketStatus
  };

  return NextResponse.json({ text: JSON.stringify(fallbackReply) });
}
