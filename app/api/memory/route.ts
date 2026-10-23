import { NextRequest, NextResponse } from 'next/server';
import { getMemoryFromDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const trainee = url.searchParams.get('trainee') || '';

  try {
    const data = getMemoryFromDb(trainee);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching memory:', err);
    return NextResponse.json(
      { error: err.message || 'Database error' },
      { status: 500 }
    );
  }
}
