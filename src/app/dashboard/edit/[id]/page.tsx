'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import QuestionEditorCard from '@/components/QuestionEditorCard';
import ImageUploader from '@/components/ImageUploader';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Check, 
  Plus, 
  AlertCircle
} from 'lucide-react';
import { QuestDraft, QuestionDraft } from '@/lib/types';
import { QUESTION_ARCHETYPES, getDifficultyForIndex } from '@/lib/openai';

export default function EditQuestPage() {
  const router = useRouter();
  const params = useParams();
  const questId = params.id as string;

  const [quest, setQuest] = useState<QuestDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestData() {
      try {
        const res = await fetch(`/api/quests/${questId}`);
        if (!res.ok) throw new Error('Quest not found');
        const data = await res.json();
        if (data.quest && data.quest.questions) {
          data.quest.questions = data.quest.questions.map((q: QuestionDraft, idx: number) => ({
            ...q,
            archetype: q.archetype || QUESTION_ARCHETYPES[idx % QUESTION_ARCHETYPES.length],
            difficulty: q.difficulty || getDifficultyForIndex(q.orderIndex || idx + 1, data.quest.questions.length),
          }));
        }
        setQuest(data.quest);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to fetch quest');
      } finally {
        setLoading(false);
      }
    }

    if (questId) {
      fetchQuestData();
    }
  }, [questId]);

  const difficultyStats = useMemo(() => {
    if (!quest) return { easy: 0, medium: 0, hard: 0, veryHard: 0 };
    return {
      easy: quest.questions.filter((q) => q.difficulty === 'Easy').length,
      medium: quest.questions.filter((q) => q.difficulty === 'Medium').length,
      hard: quest.questions.filter((q) => q.difficulty === 'Hard').length,
      veryHard: quest.questions.filter((q) => q.difficulty === 'Very Difficult').length,
    };
  }, [quest]);

  const handleUpdateQuestion = (index: number, updated: QuestionDraft) => {
    if (!quest) return;
    const updatedQuestions = [...quest.questions];
    updatedQuestions[index] = updated;
    setQuest({ ...quest, questions: updatedQuestions });
  };

  const handleDeleteQuestion = (index: number) => {
    if (!quest) return;
    const updated = quest.questions.filter((_, i) => i !== index);
    setQuest({ ...quest, questions: updated });
  };

  const handleAddQuestion = () => {
    if (!quest) return;
    const newIdx = quest.questions.length + 1;
    const blank: QuestionDraft = {
      id: `manual_${Date.now()}_${newIdx}`,
      orderIndex: newIdx,
      archetype: QUESTION_ARCHETYPES[(newIdx - 1) % QUESTION_ARCHETYPES.length],
      difficulty: 'Easy',
      text: 'New Astronomy Question Inquiry',
      explanation: 'Explanation for why this is the correct answer.',
      interestingFact: 'Fascinating space fact.',
      options: [
        { id: `opt_${Date.now()}_A`, prefix: 'A', text: 'Verified Option A', isCorrect: true },
        { id: `opt_${Date.now()}_B`, prefix: 'B', text: 'Alternative Option B', isCorrect: false },
        { id: `opt_${Date.now()}_C`, prefix: 'C', text: 'Alternative Option C', isCorrect: false },
        { id: `opt_${Date.now()}_D`, prefix: 'D', text: 'Alternative Option D', isCorrect: false },
      ],
    };
    setQuest({ ...quest, questions: [...quest.questions, blank] });
  };

  const handleSave = async () => {
    if (!quest) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/quests/${questId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quest),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update quest');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-7 h-7 text-[#5B8CFF] animate-spin" />
          <p className="text-xs text-[#9CA3AF] font-mono">Loading Quest from Supabase...</p>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <h2 className="text-lg font-bold text-white">Quest Not Found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary-cta px-4 py-2 text-xs font-mono"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-up">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-glass inline-flex items-center space-x-2 px-3.5 py-1.5 text-xs text-[#9CA3AF] hover:text-white font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Quests</span>
          </button>

          <div className="formula-pill text-xs px-3 py-1">
            <span>WEEK {quest.weekNumber} · {quest.status.toUpperCase()}</span>
          </div>
        </div>

        {/* Top Header Card */}
        <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="pill-badge inline-flex items-center space-x-1.5 px-3 py-0.5 text-[11px]">
              <span className="status-dot bg-[#5B8CFF] text-[#5B8CFF]" />
              <span>Editing Quest #{quest.weekNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{quest.title}</h1>
            <p className="text-xs text-[#9CA3AF] max-w-xl">
              Make adjustments to quest timing, status, questions, or regenerate individual inquiries with AI.
            </p>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="btn-primary-cta px-6 py-2.5 text-xs font-mono font-semibold flex items-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Saving to Supabase...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Changes Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="glass-card-sm p-4 border-rose-500/30 text-rose-300 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* Quest Info & Image Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass-panel p-5">
            <ImageUploader
              currentImageUrl={quest.imageUrl}
              onImageChange={(url) => setQuest({ ...quest, imageUrl: url })}
            />
          </div>

          <div className="lg:col-span-2 glass-panel p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                Quest Title
              </label>
              <input
                type="text"
                value={quest.title}
                onChange={(e) => setQuest({ ...quest, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] text-white font-bold text-sm outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                Quest Description
              </label>
              <textarea
                rows={2}
                value={quest.description}
                onChange={(e) => setQuest({ ...quest, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] text-[#9CA3AF] text-xs outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">Week</label>
                <input
                  type="number"
                  value={quest.weekNumber}
                  onChange={(e) => setQuest({ ...quest, weekNumber: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">Dates</label>
                <input
                  type="text"
                  value={quest.dateRangeString}
                  onChange={(e) => setQuest({ ...quest, dateRangeString: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">Duration</label>
                <input
                  type="text"
                  value={quest.durationString}
                  onChange={(e) => setQuest({ ...quest, durationString: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">Status</label>
                <select
                  value={quest.status}
                  onChange={(e) =>
                    setQuest({
                      ...quest,
                      status: e.target.value as 'Active' | 'Upcoming' | 'Completed',
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-white text-xs font-mono outline-none"
                >
                  <option value="Active">Active (Live in App)</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Editor List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white tracking-tight">Questions Bank</h3>
              <span className="formula-pill px-2.5 py-0.5 text-[11px]">
                {quest.questions.length} Items
              </span>

              {/* Bandwidth Breakdown */}
              <div className="flex flex-wrap items-center gap-1.5 ml-1">
                {difficultyStats.easy > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                    <span className="status-dot bg-emerald-400 text-emerald-400" />
                    <span>{difficultyStats.easy} Easy</span>
                  </span>
                )}
                {difficultyStats.medium > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                    <span className="status-dot bg-amber-400 text-amber-400" />
                    <span>{difficultyStats.medium} Medium</span>
                  </span>
                )}
                {difficultyStats.hard > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-violet-950/40 border border-violet-500/30 text-violet-300 text-[10px] font-mono">
                    <span className="status-dot bg-violet-400 text-violet-400" />
                    <span>{difficultyStats.hard} Hard</span>
                  </span>
                )}
                {difficultyStats.veryHard > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-mono">
                    <span className="status-dot bg-rose-400 text-rose-400" />
                    <span>{difficultyStats.veryHard} Very Hard</span>
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn-glass inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white self-start sm:self-auto font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-6">
            {quest.questions.map((q, idx) => (
              <QuestionEditorCard
                key={q.id || idx}
                question={q}
                index={idx}
                totalQuestions={quest.questions.length}
                category={quest.category}
                selectedObjectIds={quest.selectedObjectIds || []}
                existingQuestionTexts={quest.questions.map((item) => item.text)}
                onUpdate={(updated) => handleUpdateQuestion(idx, updated)}
                onDelete={() => handleDeleteQuestion(idx)}
              />
            ))}
          </div>
        </div>

        {/* Sticky Save Bar */}
        <div className="sticky bottom-6 z-40 glass-panel p-4 flex items-center justify-between">
          <span className="text-xs text-[#9CA3AF] font-mono">
            {quest.questions.length} questions in this quest set.
          </span>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="btn-primary-cta px-6 py-2.5 text-xs font-mono font-semibold flex items-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Saving to Supabase...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
