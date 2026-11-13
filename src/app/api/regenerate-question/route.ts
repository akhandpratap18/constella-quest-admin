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
    } = await req.json();

    const { data: objects } = await supabase
      .from('CelestialObjects')
      .select('name')
      .in('id', selectedObjectIds || []);

    const objectNames = (objects || []).map((o) => o.name);

    const { data: topics } = await supabase
      .from('Topics')
      .select('id')
      .in('objectId', selectedObjectIds || []);

    const topicIds = (topics || []).map((t) => t.id);

    let discoveries: any[] = [];
    if (topicIds.length > 0) {
      const { data: discs } = await supabase
        .from('Discoveries')
        .select('title, body, subtitle, curiosityTitle, curiositySubtitle')
        .in('topicId', topicIds)
        .limit(40);
      discoveries = discs || [];
    }

    const question = await regenerateSingleQuestion({
      category: category || 'Astronomy',
      selectedObjectNames: objectNames.length ? objectNames : ['Deep Space'],
      discoveries,
      existingQuestionTexts,
      orderIndex,
      difficulty,
    });

    return NextResponse.json({ question });
  } catch (error: any) {
    console.error('Question refresh error:', error);
    return NextResponse.json({ error: error.message || 'Failed to refresh question' }, { status: 500 });
  }
}
