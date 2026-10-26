import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const { messages, schema, sessionId } = body || {};

  // 1. Try Render Backend if configured and reachable
  const backendBase = process.env.NEXT_PUBLIC_AI_BACKEND_URL;
  if (backendBase && backendBase.startsWith('http')) {
    try {
      const backendUrl = `${backendBase.replace(/\/$/, '')}/generate-reply`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

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
    } catch (renderErr) {
      console.warn('Render AI backend unavailable or timed out, executing via local Gemini:', renderErr);
    }
  }

  // 2. Primary / Resilient Native Google GenAI Execution
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const rawMessages: Array<{ role: string; content?: string; text?: string }> = Array.isArray(messages) ? messages : [];
      let systemInstruction = '';
      const chatContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      for (const msg of rawMessages) {
        const text = String(msg.content || msg.text || '').trim();
        if (!text) continue;

        if (msg.role === 'system') {
          systemInstruction += (systemInstruction ? '\n\n' : '') + text;
        } else if (msg.role === 'assistant' || msg.role === 'model' || msg.role === 'agent') {
          chatContents.push({ role: 'model', parts: [{ text }] });
        } else {
          chatContents.push({ role: 'user', parts: [{ text }] });
        }
      }

      if (chatContents.length === 0) {
        chatContents.push({ role: 'user', parts: [{ text: 'Please proceed with the support roleplay scenario.' }] });
      }

      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (schema && typeof schema === 'object') {
        config.responseMimeType = 'application/json';
        config.responseSchema = schema;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: chatContents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const responseText = response.text || '';
      return NextResponse.json({ text: responseText });
    } catch (geminiError: any) {
      console.error('Google GenAI generation error:', geminiError);
    }
  }

  // 3. Resilient Fallback Engine for offline / simulated preview mode
  console.warn('Falling back to deterministic Wyze support engine response.');
  if (schema && schema.properties && schema.properties.openingMessage) {
    const fallbackPersona = {
      name: "Jordan Alvarez",
      email: "customer-jordan.a@example.invalid",
      phone: "+1 (202) 555-0142",
      shippingAddress: "418 Example Lane, Sampleville, ZZ 00000",
      product: "Wyze Cam v3",
      macAddress: "02:4B:9A:C3:7E:11",
      orderNumber: "TEST-WZ-882941",
      serialNumber: "TEST-SN-991204",
      purchaseDate: "2025-08-14",
      issueCategory: "Device offline or won't connect to Wi-Fi",
      emotionalState: "Frustrated",
      hiddenSummary: "Customer Wyze Cam v3 is showing solid yellow LED after a router change. The camera needs a 2.4 GHz network connection and a power-cycle factory reset to re-pair via QR code.",
      openingMessage: "Hi, my Wyze Cam v3 in my backyard suddenly went offline yesterday. The light on the front is just sitting on solid yellow and won't reconnect no matter what I do.",
      resolutionSteps: [
        "Acknowledge the customer's frustration and verify account info (name/email).",
        "Confirm the LED status (solid yellow indicates powering on or waiting for setup).",
        "Instruct customer to ensure their phone is connected to 2.4 GHz Wi-Fi (not 5 GHz).",
        "Have the customer power cycle the camera and press the setup button until 'Ready to connect'.",
        "Guide scanning the QR code in the Wyze app until 'QR code scanned' is heard.",
        "Confirm live view is restored and provide case recap."
      ]
    };
    return NextResponse.json({ text: JSON.stringify(fallbackPersona) });
  }

  // Fallback for chat reply
  const fallbackReply = {
    message: "Thank you for checking. The camera is plugged into the wall outlet with the original power brick, but the little LED light stays solid yellow.",
    status: "OPEN"
  };

  return NextResponse.json({ text: JSON.stringify(fallbackReply) });
}
