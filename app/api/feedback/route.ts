import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'node:crypto';

export interface BugFeedbackReport {
  id: string;
  category: string;
  description: string;
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  currentTicketId?: string | null;
  userAgent?: string;
  createdAt: string;
  timestamp: number;
}

const g = globalThis as unknown as {
  __feedbackReports?: BugFeedbackReport[];
};

if (!g.__feedbackReports) {
  g.__feedbackReports = [];
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin leadership session required.' },
      { status: 401 }
    );
  }

  try {
    const memoryReports = g.__feedbackReports || [];

    // Optionally fetch from Supabase if table exists
    const supabase = getSupabaseAdmin();
    let supabaseReports: BugFeedbackReport[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('feedback_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(data)) {
          supabaseReports = data.map((r: any) => ({
            id: r.id,
            category: r.category || 'other',
            description: r.description || '',
            traineeId: r.trainee_id || '',
            traineeName: r.trainee_name || 'Trainee Agent',
            traineeEmail: r.trainee_email || '',
            currentTicketId: r.ticket_id || null,
            userAgent: r.user_agent || '',
            createdAt: r.created_at || new Date().toISOString(),
            timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
          }));
        }
      } catch {
        // Fall back gracefully to memoryReports
      }
    }

    // Merge and deduplicate by ID
    const map = new Map<string, BugFeedbackReport>();
    for (const r of memoryReports) {
      map.set(r.id, r);
    }
    for (const r of supabaseReports) {
      map.set(r.id, r);
    }

    const reports = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
    return NextResponse.json({ ok: true, reports });
  } catch (err: any) {
    console.error('Failed to get feedback reports:', err);
    return NextResponse.json({ error: 'Failed to retrieve feedback reports.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, description, traineeId, traineeName, traineeEmail, ticketId } = body || {};

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Feedback description is required.' }, { status: 400 });
    }

    const now = new Date();
    const reportId = 'bug_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const newReport: BugFeedbackReport = {
      id: reportId,
      category: category || 'general',
      description: description.trim(),
      traineeId: traineeId || req.headers.get('x-trainee-id') || 'anon',
      traineeName: traineeName || req.headers.get('x-trainee-name') || 'Trainee Agent',
      traineeEmail: traineeEmail || req.headers.get('x-trainee-email') || '',
      currentTicketId: ticketId || null,
      userAgent: req.headers.get('user-agent') || '',
      createdAt: now.toISOString(),
      timestamp: now.getTime(),
    };

    if (!g.__feedbackReports) {
      g.__feedbackReports = [];
    }
    g.__feedbackReports.unshift(newReport);
    if (g.__feedbackReports.length > 200) {
      g.__feedbackReports.pop();
    }

    // Try saving to Supabase if table exists
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase.from('feedback_reports').insert({
          id: crypto.randomUUID(),
          category: newReport.category,
          description: newReport.description,
          trainee_id: newReport.traineeId,
          trainee_name: newReport.traineeName,
          trainee_email: newReport.traineeEmail,
          ticket_id: newReport.currentTicketId,
          user_agent: newReport.userAgent,
          created_at: newReport.createdAt,
        });
      } catch (sErr) {
        // Non-fatal if table not created
        console.warn('[Feedback] Supabase feedback_reports insert non-fatal:', sErr);
      }
    }

    return NextResponse.json({ ok: true, report: newReport });
  } catch (err: any) {
    console.error('Failed to save feedback report:', err);
    return NextResponse.json({ error: 'Failed to record feedback.' }, { status: 500 });
  }
}
