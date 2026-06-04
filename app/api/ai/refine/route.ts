import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

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

    return NextResponse.json({ result: refinedText });
  } catch (error) {
    console.error('AI Refine error:', error);
    return NextResponse.json(
      { error: 'Failed to refine text. Please check your API key.' },
      { status: 500 }
    );
  }
}
