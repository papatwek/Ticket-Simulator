import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, schema } = body;

    // 1. If Render backend URL is configured and active, attempt forwarding
    const backendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL;
    if (backendUrl && !backendUrl.includes('placeholder')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const renderResponse = await fetch(`${backendUrl.replace(/\/$/, '')}/generate-reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (renderResponse.ok) {
          const renderData = await renderResponse.json();
          // Normalize content if returned in different formats
          const content =
            renderData.content ||
            renderData.reply ||
            (renderData.message ? JSON.stringify(renderData) : null);

          if (content) {
            return NextResponse.json({ content, source: 'render' });
          }
        }
      } catch (renderErr) {
        console.warn('Render backend attempt bypassed, falling back to server-side Gemini:', renderErr);
      }
    }

    // 2. Server-side Gemini API fallback via @google/genai
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format messages for Gemini API
    const systemInstruction = messages
      ?.filter((m: any) => m.role === 'system')
      ?.map((m: any) => m.content)
      ?.join('\n\n');

    const contents = (messages || [])
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || m.text || '' }],
      }));

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Please begin the scenario.' }],
      });
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (schema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = schema;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config,
    });

    const replyText = response.text || '';
    return NextResponse.json({ content: replyText, source: 'gemini' });
  } catch (error: any) {
    console.error('Chat routing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate simulation response' },
      { status: 500 }
    );
  }
}
