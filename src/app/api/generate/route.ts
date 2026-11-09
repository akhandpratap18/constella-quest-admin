import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { generateFullQuest } from '@/lib/openai';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      category,
      selectedObjectIds,
      questionCount = 5,
      durationMinutes = 10,
      targetDate = new Date().toISOString().split('T')[0],
    } = await req.json();

    if (!selectedObjectIds || selectedObjectIds.length === 0) {
      return NextResponse.json({ error: 'At least one celestial object must be selected' }, { status: 400 });
    }

    // 1. Fetch object names and image URLs
    const { data: objects, error: objErr } = await supabase
      .from('CelestialObjects')
      .select('id, name, imageUrl')
      .in('id', selectedObjectIds);

    if (objErr) throw objErr;

    const objectNames = (objects || []).map((o) => o.name);
    const primaryImage = objects?.[0]?.imageUrl || '';

    // 2. Fetch Topics for these objects
    const { data: topics, error: topErr } = await supabase
      .from('Topics')
      .select('id, objectId, title')
      .in('objectId', selectedObjectIds);

    if (topErr) throw topErr;
    const topicIds = (topics || []).map((t) => t.id);

    // 3. Fetch Discoveries for these topics
    let discoveries: any[] = [];
    if (topicIds.length > 0) {
      const { data: discs, error: discErr } = await supabase
        .from('Discoveries')
        .select('id, topicId, title, subtitle, body, caption, curiosityTitle, curiositySubtitle')
        .in('topicId', topicIds)
        .limit(20);

      if (discErr) throw discErr;
      discoveries = discs || [];
    }

    // 4. Calculate next weekNumber from existing Quests
    const { data: existingQuests } = await supabase
      .from('Quests')
      .select('weekNumber')
      .order('weekNumber', { ascending: false })
      .limit(1);

    const nextWeekNumber = (existingQuests?.[0]?.weekNumber ?? 4) + 1;

    // 5. Generate Quest via OpenAI
    const generated = await generateFullQuest({
      category,
      selectedObjectNames: objectNames,
      discoveries,
      questionCount: Number(questionCount),
      durationMinutes: Number(durationMinutes),
      targetDate,
    });

    generated.weekNumber = nextWeekNumber;
    generated.imageUrl = primaryImage;
    generated.selectedObjectIds = selectedObjectIds;
    generated.selectedCategory = category;

    return NextResponse.json({ quest: generated });
  } catch (error: any) {
    console.error('Quest generation API error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
