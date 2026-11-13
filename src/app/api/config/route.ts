import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const envKey = process.env.OPENAI_API_KEY;
  const isConfigured = Boolean(envKey && envKey.trim() !== '' && !envKey.includes('your-openai-api-key'));

  // Masked key preview (e.g. sk-proj-...abcd)
  const maskedKey = isConfigured
    ? `${envKey!.slice(0, 7)}...${envKey!.slice(-4)}`
    : null;

  return NextResponse.json({
    isConfigured,
    maskedKey,
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return NextResponse.json({ error: 'Valid OpenAI API Key is required' }, { status: 400 });
    }

    const trimmedKey = apiKey.trim();

    // Set in running runtime memory
    process.env.OPENAI_API_KEY = trimmedKey;

    // Persist to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let existingContent = '';
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, 'utf8');
    }

    let newContent = '';
    if (existingContent.includes('OPENAI_API_KEY=')) {
      newContent = existingContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${trimmedKey}`);
    } else {
      newContent = existingContent + `\nOPENAI_API_KEY=${trimmedKey}\n`;
    }

    fs.writeFileSync(envPath, newContent.trim() + '\n', 'utf8');

    return NextResponse.json({
      success: true,
      isConfigured: true,
      maskedKey: `${trimmedKey.slice(0, 7)}...${trimmedKey.slice(-4)}`,
    });
  } catch (error: any) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: error.message || 'Failed to save API key' }, { status: 500 });
  }
}
