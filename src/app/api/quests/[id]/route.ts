import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { QuestDraft } from '@/lib/types';
import { QUESTION_ARCHETYPES, getDifficultyForIndex } from '@/lib/openai';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    const { data: quest, error: qErr } = await supabase
      .from('Quests')
      .select('*')
      .eq('id', id)
      .single();

    if (qErr || !quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    const { data: qSet } = await supabase
      .from('QuestionSets')
      .select('*')
      .eq('id', quest.questSetId)
      .single();

    const { data: questions } = await supabase
      .from('Questions')
      .select('*')
      .eq('setId', quest.questSetId)
      .order('orderIndex', { ascending: true });

    const qIds = (questions || []).map((q) => q.id);

    let options: any[] = [];
    if (qIds.length > 0) {
      const { data: opts } = await supabase
        .from('QuestionOptions')
        .select('*')
        .in('questionId', qIds);
      options = opts || [];
    }

    const assembledQuestions = (questions || []).map((q) => {
      const qOptions = options
        .filter((o) => o.questionId === q.id)
        .sort((a, b) => a.prefix.localeCompare(b.prefix))
        .map((o) => ({
          id: o.id,
          prefix: o.prefix,
          text: o.text,
          isCorrect: Boolean(o.isCorrect),
        }));

      return {
        id: q.id,
        orderIndex: q.orderIndex,
        text: q.text,
        explanation: q.explanation,
        interestingFact: q.interestingFact || '',
        archetype: QUESTION_ARCHETYPES[(q.orderIndex - 1) % QUESTION_ARCHETYPES.length],
        difficulty: getDifficultyForIndex(q.orderIndex, (questions || []).length),
        options: qOptions,
      };
    });

    const fullQuest: QuestDraft = {
      id: quest.id,
      questSetId: quest.questSetId,
      title: quest.title,
      description: quest.description,
      category: qSet?.category || 'Planetary Science',
      difficulty: (qSet?.difficulty as any) || 'Intermediate',
      weekNumber: quest.weekNumber,
      durationString: quest.durationString,
      dateRangeString: quest.dateRangeString,
      imageUrl: quest.imageUrl,
      status: quest.status,
      selectedCategory: qSet?.category || 'Planets',
      selectedObjectIds: [],
      questions: assembledQuestions,
    };

    return NextResponse.json({ quest: fullQuest });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve quest' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const draft: QuestDraft = await req.json();

    // 1. Update Quests table
    const { error: questUpdateErr } = await supabase
      .from('Quests')
      .update({
        title: draft.title,
        description: draft.description,
        weekNumber: Number(draft.weekNumber),
        status: draft.status,
        imageUrl: draft.imageUrl,
        durationString: draft.durationString,
        dateRangeString: draft.dateRangeString,
      })
      .eq('id', id);

    if (questUpdateErr) throw questUpdateErr;

    // 2. Update QuestionSets table
    if (draft.questSetId) {
      await supabase
        .from('QuestionSets')
        .update({
          title: `${draft.title} Question Bank`,
          description: draft.description,
          category: draft.category,
          difficulty: draft.difficulty,
        })
        .eq('id', draft.questSetId);

      // 3. Upsert questions & options
      for (const [idx, q] of draft.questions.entries()) {
        const qId = q.id || `q_${Date.now()}_${idx + 1}`;
        await supabase
          .from('Questions')
          .upsert({
            id: qId,
            setId: draft.questSetId,
            orderIndex: idx + 1,
            text: q.text,
            explanation: q.explanation,
            interestingFact: q.interestingFact,
          });

        for (const [optIdx, opt] of q.options.entries()) {
          const optId = opt.id || `opt_${Date.now()}_${idx + 1}_${optIdx + 1}`;
          await supabase
            .from('QuestionOptions')
            .upsert({
              id: optId,
              questionId: qId,
              prefix: opt.prefix,
              text: opt.text,
              isCorrect: Boolean(opt.isCorrect),
            });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update quest error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update quest' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    const { data: quest } = await supabase.from('Quests').select('questSetId').eq('id', id).single();

    if (quest?.questSetId) {
      const { data: questions } = await supabase
        .from('Questions')
        .select('id')
        .eq('setId', quest.questSetId);

      const qIds = (questions || []).map((q) => q.id);
      if (qIds.length > 0) {
        await supabase.from('QuestionOptions').delete().in('questionId', qIds);
      }
      await supabase.from('Questions').delete().eq('setId', quest.questSetId);
      await supabase.from('QuestionSets').delete().eq('id', quest.questSetId);
    }

    await supabase.from('Quests').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete quest' }, { status: 500 });
  }
}
