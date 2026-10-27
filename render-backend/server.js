/**
 * Render Dedicated Backend Server for Wyze ECE Simulator
 * 
 * Host: Render (https://my-ai-backend-i1n0.onrender.com)
 * Handles continuous conversation orchestration, persona guidance,
 * and detailed live logging of every incoming agent turn.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Enable JSON parsing and CORS for all origins (Vercel frontend, local dev)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware - ensures Render web logs capture every interaction
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [RENDER INCOMING] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const turn = req.body.turnNumber ? `Turn: ${req.body.turnNumber}` : '';
    const name = req.body.persona?.name ? `Customer: ${req.body.persona.name}` : '';
    console.log(`[${timestamp}] [PAYLOAD PREVIEW] ${turn} ${name}`);
  }
  next();
});

// Health check endpoint
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Wyze ECE AI Simulator Render Backend',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Primary Chat & Simulation Route
async function handleChat(req, res) {
  const body = req.body || {};
  const { contents, messages, persona, turnNumber, mode, systemInstruction } = body;
  const isEmail = mode === 'email';

  console.log(`[RENDER AI] Processing Turn ${turnNumber || 1} for ${persona?.name || 'Customer'}`);

  let replyText = null;

  // 1. Try Gemini API via @google/genai if GEMINI_API_KEY is configured on Render
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Prepare API contents array
      let formattedContents = contents;
      if (!Array.isArray(formattedContents) || formattedContents.length === 0) {
        formattedContents = [];
        if (Array.isArray(messages)) {
          for (const m of messages) {
            const role = (m.role === 'customer' || m.role === 'model') ? 'model' : 'user';
            formattedContents.push({ role, parts: [{ text: m.text || m.content || '' }] });
          }
        }
        if (formattedContents.length === 0) {
          formattedContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction || 'You are a non-tech-savvy customer contacting Wyze support. 1-2 sentences max.',
          temperature: 0.3,
          maxOutputTokens: 800,
          topP: 0.9,
        }
      });

      if (response && response.text && response.text.trim()) {
        replyText = response.text.trim();
        console.log(`[RENDER AI SUCCESS] Gemini generated response: "${replyText.slice(0, 60)}..."`);
      }
    } catch (aiErr) {
      console.error('[RENDER AI ERROR] Gemini generation error on Render:', aiErr.message);
    }
  }

  // 2. High-Fidelity Persona Contextual Response if Gemini key is unset or rate limited
  if (!replyText) {
    console.log('[RENDER AI FALLBACK] Generating contextual persona response on Render');
    const custName = persona?.name || 'Marcus Vance';
    const prod = persona?.product || 'Wyze Cam v4';
    const led = persona?.ledColor || 'solid yellow';
    const email = persona?.email || 'customer@example.invalid';

    // Find the latest trainee message
    let latestAgent = '';
    if (Array.isArray(contents) && contents.length > 0) {
      const last = contents[contents.length - 1];
      latestAgent = last.parts?.[0]?.text || '';
    } else if (Array.isArray(messages) && messages.length > 0) {
      const last = messages[messages.length - 1];
      latestAgent = last.text || last.content || '';
    }
    const lower = latestAgent.toLowerCase();

    if (/name|email|verify|account|who am i/i.test(lower)) {
      replyText = `Yes, my name is ${custName} and my email is ${email}.`;
    } else if (/light|led|color|indicator/i.test(lower)) {
      replyText = `The status light on the front is ${led} and it isn't flashing or changing.`;
    } else if (/unplug|power cycle|reboot|restart|outlet|cord/i.test(lower)) {
      replyText = `Okay, I unplugged it for 30 seconds and plugged it back in. The light is still ${led}.`;
    } else if (/button|press|hold|click/i.test(lower)) {
      replyText = `I pressed and held the button. It said "Ready to connect" and now the light is flashing yellow.`;
    } else if (/qr|scan|code|app/i.test(lower)) {
      replyText = `I held my phone up to the lens, the camera said "QR code scanned", and the light just turned solid blue!`;
    } else if (/mac|serial|order|receipt/i.test(lower)) {
      replyText = `My MAC address on the bottom sticker is ${persona?.macAddress || '2C:AA:8E:44:91:02'} and order is ${persona?.orderNumber || 'TEST-WZ-104928'}.`;
    } else if (/hi|hello|welcome|thank|glad/i.test(lower)) {
      replyText = `Hi, thanks for answering! My ${prod} has been acting up and I really need help getting it back online.`;
    } else if (/question|ask|details|happen/i.test(lower)) {
      replyText = `Sure, go ahead and ask whatever you need.`;
    } else {
      replyText = `I'm standing right here with my ${prod}. Let me know what step you'd like me to try next.`;
    }
  }

  // Return consistent payload structure
  return res.json({
    message: replyText,
    text: replyText,
    status: 'OPEN',
    source: 'render-backend',
    turnNumber: turnNumber || 1
  });
}

// Register all endpoints that frontends might invoke
app.post('/api/chat', handleChat);
app.post('/chat', handleChat);
app.post('/', handleChat);
app.post('/api/generate', handleChat);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`======================================================`);
  console.log(`Wyze ECE AI Simulator Render Backend running on port ${PORT}`);
  console.log(`Available endpoints: POST /api/chat, POST /chat, GET /health`);
  console.log(`======================================================`);
});
