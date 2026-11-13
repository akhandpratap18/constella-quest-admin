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

    // 1. Fetch object names, categories, and image URLs
    const { data: objects, error: objErr } = await supabase
      .from('CelestialObjects')
      .select('id, name, category, imageUrl')
      .in('id', selectedObjectIds);

    if (objErr) throw objErr;

    const objectNames = (objects || []).map((o) => o.name);
    const primaryImage = objects?.[0]?.imageUrl || '';

    // Determine effective category if mixed
    const rawCategories = Array.from(new Set((objects || []).map((o) => o.category).filter(Boolean)));
    const uniqueCategories = rawCategories.map((c) => {
      const lower = c.toLowerCase();
      if (lower.includes('planet')) return 'Planets';
      if (lower.includes('galax')) return 'Galaxies';
      if (lower.includes('constellat')) return 'Constellations';
      if (lower.includes('phenomen')) return 'Phenomena';
      return c;
    });
    const distinctCategories = Array.from(new Set(uniqueCategories));
    
    const effectiveCategory = distinctCategories.length > 1
      ? `Mixed (${distinctCategories.join(' & ')})`
      : (distinctCategories[0] || category || 'Planetary Science');

    // 2. Fetch Topics for all selected objects
    const { data: topics, error: topErr } = await supabase
      .from('Topics')
      .select('id, objectId, title')
      .in('objectId', selectedObjectIds);

    if (topErr) throw topErr;
    const topicIds = (topics || []).map((t) => t.id);

    // 3. Fetch Discoveries for all topics (higher limit for multi-object mix)
    let discoveries: any[] = [];
    if (topicIds.length > 0) {
      const { data: discs, error: discErr } = await supabase
        .from('Discoveries')
        .select('id, topicId, title, subtitle, body, caption, curiosityTitle, curiositySubtitle')
        .in('topicId', topicIds)
        .limit(50);

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

    // 5. Generate Quest via OpenAI / Anti-template Synthesizer
    const generated = await generateFullQuest({
      category: effectiveCategory,
      selectedObjectNames: objectNames,
      discoveries,
      questionCount: Number(questionCount),
      durationMinutes: Number(durationMinutes),
      targetDate,
    });

    generated.weekNumber = nextWeekNumber;
    generated.imageUrl = primaryImage;
    generated.selectedObjectIds = selectedObjectIds;
    generated.selectedCategory = effectiveCategory;

    return NextResponse.json({ quest: generated });
  } catch (error: any) {
    console.error('Quest generation API error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
