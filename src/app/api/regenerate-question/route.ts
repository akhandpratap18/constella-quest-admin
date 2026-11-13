import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { regenerateSingleQuestion } from '@/lib/openai';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      category, 
      selectedObjectIds, 
      existingQuestionTexts = [], 
      orderIndex = 1,
      difficulty,
      apiKey,
    } = await req.json();

    const { data: objects } = await supabase
      .from('CelestialObjects')
      .select('id, name, category')
      .in('id', selectedObjectIds || []);

    const objectNames = (objects || []).map((o) => o.name);
    const objMap = new Map((objects || []).map((o) => [o.id, o]));

    const { data: topics } = await supabase
      .from('Topics')
      .select('id, objectId, title')
      .in('objectId', selectedObjectIds || []);

    const topicIds = (topics || []).map((t) => t.id);
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

    let discoveries: any[] = [];
    if (topicIds.length > 0) {
      const { data: discs } = await supabase
        .from('Discoveries')
        .select('id, topicId, title, body, subtitle, curiosityTitle, curiositySubtitle')
        .in('topicId', topicIds)
        .limit(40);

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
          curiosityTitle: d.curiosityTitle,
          curiositySubtitle: d.curiositySubtitle,
        };
      });
    }

    const question = await regenerateSingleQuestion({
      category: category || 'Astronomy',
      selectedObjectNames: objectNames.length ? objectNames : ['Deep Space'],
      discoveries,
      existingQuestionTexts,
      orderIndex,
      difficulty,
      apiKey,
    });

    return NextResponse.json({ question });
  } catch (error: any) {
    console.error('Question refresh error:', error);
    return NextResponse.json({ error: error.message || 'Failed to refresh question' }, { status: 500 });
  }
}
