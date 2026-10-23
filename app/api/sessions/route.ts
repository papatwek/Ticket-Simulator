import { NextRequest, NextResponse } from 'next/server';
import { listSessionsFromDb, isTrainerPasscode } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const isTrainerReq =
    url.searchParams.get('trainer') === '1' &&
    isTrainerPasscode(url.searchParams.get('key'));

  try {
    const data = listSessionsFromDb(isTrainerReq);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error listing sessions:', err);
    return NextResponse.json(
      { error: err.message || 'Database error' },
      { status: 500 }
    );
  }
}
