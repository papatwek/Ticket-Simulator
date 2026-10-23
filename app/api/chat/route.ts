import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Get the message data the trainee typed in the chat UI
    const body = await req.json();

    // 2. Build the URL to your Render server
    const backendUrl = `${process.env.NEXT_PUBLIC_AI_BACKEND_URL}/generate-reply`;

    // 3. Forward the exact same data to your new Render brain
    const renderResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!renderResponse.ok) {
      throw new Error('Render backend failed to respond');
    }

    // 4. Return success to the frontend (The UI will update automatically via Supabase websockets)
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Chat routing error:", error);
    return NextResponse.json({ error: 'Failed to reach AI backend' }, { status: 500 });
  }
}
