import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { getActiveWorkspacePlan } from '@/app/dashboard/workspaces/actions';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
);

const PROMPTS: Record<string, string> = {
  'Improve Grammar':
    'Improve the grammar and flow of the following text. Keep the original meaning intact. Return ONLY the improved text, no explanations.',
  'Rewrite':
    'Rewrite the following text to make it clearer and more engaging. Return ONLY the rewritten text, no explanations.',
  'Shorten':
    'Make the following text more concise without losing key information. Return ONLY the shortened text, no explanations.',
  'Expand':
    'Expand the following text with more details and context. Return ONLY the expanded text, no explanations.',
  'Professional':
    'Rewrite the following text in a formal, professional tone. Return ONLY the rewritten text, no explanations.',
  'Friendly':
    'Rewrite the following text in a warm, friendly tone. Return ONLY the rewritten text, no explanations.',
  'Summarize':
    'Provide a brief summary of the following text. Return ONLY the summary, no explanations.',
  'Bullet Points':
    'Convert the following text into a clear, concise bulleted list using bullet characters (•). Return ONLY the bullet points, no explanations or markdown formatting.',
};

export async function POST(req: Request) {
  try {
    const { text, option } = await req.json();

    if (!text || !option) {
      return NextResponse.json(
        { error: 'Text and option are required' },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await getActiveWorkspacePlan(userId);
    if (plan === "Free") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const counts = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.type, "ai_action"),
            gte(notifications.createdAt, today)
          )
        );

      if (counts.length >= 5) {
        return NextResponse.json(
          { error: 'Free plan is limited to 5 AI actions per day. Upgrade to Pro for unlimited AI access.' },
          { status: 429 }
        );
      }
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const instruction = PROMPTS[option] || `Refine the following text: ${option}. Return ONLY the refined text.`;
    const prompt = `${instruction}\n\n---\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const refinedText = response.text().trim();

    if (plan === "Free") {
      await db.insert(notifications).values({
        userId,
        type: 'ai_action',
        title: 'AI Action consumed',
        message: `Used AI Refine: ${option}`,
      });
    }

    return NextResponse.json({ result: refinedText });
  } catch (error) {
    console.error('AI Refine error:', error);
    return NextResponse.json(
      { error: 'Failed to refine text. Please check your API key.' },
      { status: 500 }
    );
  }
}
