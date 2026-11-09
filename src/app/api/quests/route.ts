import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { QuestDraft } from '@/lib/types';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: quests, error: qErr } = await supabase
      .from('Quests')
      .select('*')
      .order('weekNumber', { ascending: false });

    if (qErr) throw qErr;

    const { data: questions, error: questErr } = await supabase
      .from('Questions')
      .select('id, setId');

    if (questErr) throw questErr;

    // Map question count to each quest
    const enriched = (quests || []).map((q) => {
      const qCount = (questions || []).filter((item) => item.setId === q.questSetId).length;
      return {
        ...q,
        questionsCount: qCount,
      };
    });

    return NextResponse.json({ quests: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const draft: QuestDraft = await req.json();

    if (!draft.title || !draft.questions || draft.questions.length === 0) {
      return NextResponse.json({ error: 'Title and questions are required' }, { status: 400 });
    }

    const timestamp = Date.now();
    const slug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 15);

    const setId = `set_${slug}_${timestamp}`;
    const questId = `q_${slug}_${timestamp}`;
    const nowIso = new Date().toISOString();

    // 1. Insert QuestionSets
    const { error: setErr } = await supabase.from('QuestionSets').insert([
      {
        id: setId,
        title: `${draft.title} Question Bank`,
        description: draft.description || `Astrophysics quiz bank for ${draft.title}.`,
        category: draft.category || 'Planetary Science',
        difficulty: draft.difficulty || 'Intermediate',
        createdAt: nowIso,
      },
    ]);

    if (setErr) {
      console.error('Error inserting QuestionSets:', setErr);
      throw setErr;
    }

    // 2. Insert Questions and Options
    const questionsToInsert: any[] = [];
    const optionsToInsert: any[] = [];

    draft.questions.forEach((q, idx) => {
      const qId = `q_${timestamp}_${idx + 1}`;
      questionsToInsert.push({
        id: qId,
        setId: setId,
        orderIndex: idx + 1,
        text: q.text,
        explanation: q.explanation || '',
        interestingFact: q.interestingFact || null,
        createdAt: nowIso,
      });

      (q.options || []).forEach((opt, optIdx) => {
        optionsToInsert.push({
          id: `opt_${timestamp}_${idx + 1}_${optIdx + 1}`,
          questionId: qId,
          prefix: opt.prefix || ['A', 'B', 'C', 'D'][optIdx],
          text: opt.text,
          isCorrect: Boolean(opt.isCorrect),
        });
      });
    });

    const { error: qInsertErr } = await supabase.from('Questions').insert(questionsToInsert);
    if (qInsertErr) {
      console.error('Error inserting Questions:', qInsertErr);
      throw qInsertErr;
    }

    const { error: optInsertErr } = await supabase.from('QuestionOptions').insert(optionsToInsert);
    if (optInsertErr) {
      console.error('Error inserting QuestionOptions:', optInsertErr);
      throw optInsertErr;
    }

    // 3. Insert Quests
    const { error: questInsertErr } = await supabase.from('Quests').insert([
      {
        id: questId,
        questSetId: setId,
        title: draft.title,
        description: draft.description,
        weekNumber: Number(draft.weekNumber) || 1,
        status: draft.status || 'Upcoming',
        imageUrl: draft.imageUrl || 'https://cdrydgtnzlujciwgefmb.supabase.co/storage/v1/object/public/constella-media/planets/mars/home_mars.png',
        durationString: draft.durationString || '~ 10 min',
        dateRangeString: draft.dateRangeString || 'Nov 16 – Nov 22',
        createdAt: nowIso,
      },
    ]);

    if (questInsertErr) {
      console.error('Error inserting Quests:', questInsertErr);
      throw questInsertErr;
    }

    return NextResponse.json({ success: true, questId, setId });
  } catch (error: any) {
    console.error('Publish quest error:', error);
    return NextResponse.json({ error: error.message || 'Failed to publish quest' }, { status: 500 });
  }
}
