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
      bandwidthMode = 'mixed',
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

    // Build lookup maps to guarantee 100% authentic object and topic attribution
    const objMap = new Map((objects || []).map((o) => [o.id, o]));
    const topicMap = new Map(
      (topics || []).map((t) => [
        t.id,
        {
          id: t.id,
          title: t.title,
          objectId: t.objectId,
          objectName: objMap.get(t.objectId)?.name || 'Deep Space',
          objectCategory: objMap.get(t.objectId)?.category || 'Cosmos',
        },
      ])
    );

    // 3. Fetch Discoveries for all topics (higher limit for multi-object mix)
    let discoveries: any[] = [];
    if (topicIds.length > 0) {
      const { data: discs, error: discErr } = await supabase
        .from('Discoveries')
        .select('id, topicId, title, subtitle, body, caption, curiosityTitle, curiositySubtitle')
        .in('topicId', topicIds)
        .limit(80);

      if (discErr) throw discErr;
      discoveries = (discs || []).map((d) => {
        const top = topicMap.get(d.topicId);
        return {
          id: d.id,
          topicId: d.topicId,
          topicTitle: top?.title || 'Astrophysics',
          objectId: top?.objectId || '',
          objectName: top?.objectName || (objectNames[0] || 'Cosmos'),
          objectCategory: top?.objectCategory || 'Space',
          title: d.title,
          subtitle: d.subtitle,
          body: d.body,
          caption: d.caption,
          curiosityTitle: d.curiosityTitle,
          curiositySubtitle: d.curiositySubtitle,
        };
      });
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
      bandwidthMode: bandwidthMode as any,
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
