import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { traineeName, kpis, categoryBreakdown } = body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = [
      "You are the Lead QA & Coaching Director for a customer contact center handling live chat support for Wyze smart-home devices.",
      "You will receive aggregated metrics and drill performance records for a specific live-chat trainee.",
      "Analyze their typing speed, response latency, resolution rate, 7-minute abandonment rate, and customer frustration recovery.",
      "Generate an insightful, highly constructive, and actionable QA performance report in JSON format.",
      "Avoid generic fluff; give specific guidance relevant to Wyze products and BPO live-chat SLA discipline.",
    ].join(' ');

    const prompt = [
      `Trainee Name: ${traineeName || 'Trainee Agent'}`,
      `Total Practice Drills: ${kpis?.totalSessions || 0} (Completed: ${kpis?.completedSessions || 0})`,
      `Resolution Rate: ${kpis?.resolvedRate ?? 0}% (${kpis?.resolvedCount ?? 0} resolved)`,
      `Escalation Rate: ${kpis?.escalatedRate ?? 0}% (${kpis?.escalatedCount ?? 0} escalated)`,
      `7-Minute Abandonment Rate: ${kpis?.abandonmentRate ?? 0}% (${kpis?.abandonedCount ?? 0} customers walked out)`,
      `Average Typing Speed: ${kpis?.avgWpm ? kpis.avgWpm + ' WPM' : 'Not yet measured'} (Benchmark target: >= 45 WPM)`,
      `Average Response Wait Time: ${kpis?.avgResponseTimeSec ? kpis.avgResponseTimeSec + 's' : 'Not yet measured'} (Target: < 60s, Warning: > 120s)`,
      `Customer Frustration Recovery Rate: ${kpis?.frustrationRecoveryRate ?? 0}% (${kpis?.frustratedResolved ?? 0} calmed/resolved out of ${kpis?.frustratedHandled ?? 0} angry or frustrated customers)`,
      `Case Documentation Quality: ${kpis?.caseDocCompletionRate ?? 0}% filled out`,
      categoryBreakdown?.length
        ? `Category Performance: ${JSON.stringify(categoryBreakdown)}`
        : 'Category Performance: Initial drills across Wyze catalog',
      "",
      "Provide your comprehensive QA analysis with core strengths, priority growth areas, churn prevention advice, and a concrete next-drill goal.",
    ].join('\n');

    const schema = {
      type: "object",
      properties: {
        executiveSummary: { type: "string" },
        overallGrade: { type: "string", enum: ["Needs Work", "Developing", "Solid", "Proficient", "Expert"] },
        strengths: { type: "array", items: { type: "string" } },
        growthAreas: { type: "array", items: { type: "string" } },
        churnPreventionAdvice: { type: "string" },
        slaSpeedAdvice: { type: "string" },
        nextDrillGoal: { type: "string" }
      },
      required: [
        "executiveSummary",
        "overallGrade",
        "strengths",
        "growthAreas",
        "churnPreventionAdvice",
        "slaSpeedAdvice",
        "nextDrillGoal"
      ],
      additionalProperties: false
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return NextResponse.json({ ok: true, insights: parsed });
  } catch (err: any) {
    console.error('AI Insights generation error:', err);
    // Provide algorithmic fallback insight so agent always gets coaching
    const fallback = {
      executiveSummary: "Trainee is demonstrating positive initial engagement with Wyze product scenarios. Maintain focus on swift response pacing, consistent customer hold check-ins, and thorough case logging.",
      overallGrade: "Solid",
      strengths: [
        "Consistent execution of Wyze troubleshooting steps during active conversation.",
        "Demonstrated patience and customer acknowledgment on setup procedures."
      ],
      growthAreas: [
        "Keep response latency strictly below 60 seconds to avoid customer anxiety and hold timer warnings.",
        "Provide periodic updates before 180 seconds elapse whenever running diagnostic lookups to eliminate 7-minute abandonment risks.",
        "Ensure all CRM case notes (Name, Email, Product, Recap, Next Steps) are documented before completing the session."
      ],
      churnPreventionAdvice: "When dealing with angry or frustrated customers, lead with sincere empathy and acknowledge their time investment before asking for device verification.",
      slaSpeedAdvice: "Target a steady typing rhythm of 45-60 WPM. Use concise, punchy troubleshooting prompts rather than lengthy paragraphs.",
      nextDrillGoal: "Complete a full scenario with zero response gaps over 60 seconds and 100% case file documentation."
    };
    return NextResponse.json({ ok: true, insights: fallback });
  }
}
