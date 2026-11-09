'use client';

import React, { useState, useEffect } from 'react';
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
  Calendar, 
  Clock, 
  Layers, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { QuestDraft, QuestionDraft } from '@/lib/types';

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
      text: 'New Astronomy Question',
      explanation: 'Explanation for why this is the correct answer.',
      interestingFact: 'Fascinating space fact.',
      options: [
        { id: `opt_${Date.now()}_A`, prefix: 'A', text: 'Option A', isCorrect: true },
        { id: `opt_${Date.now()}_B`, prefix: 'B', text: 'Option B', isCorrect: false },
        { id: `opt_${Date.now()}_C`, prefix: 'C', text: 'Option C', isCorrect: false },
        { id: `opt_${Date.now()}_D`, prefix: 'D', text: 'Option D', isCorrect: false },
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
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-zinc-400 font-mono">Loading Quest from Supabase...</p>
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
            className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs"
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link */}
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Quests</span>
        </button>

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#09150e]/90 backdrop-blur-xl border border-emerald-500/30 shadow-glass-card">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30">
              <span>Editing Quest #{quest.weekNumber} · {quest.status}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{quest.title}</h1>
            <p className="text-xs text-zinc-400">
              Make adjustments to quest timing, status, questions, or regenerate individual questions with AI.
            </p>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Saving to Supabase...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Changes Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-black" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-mono">
            {errorMessage}
          </div>
        )}

        {/* Quest Info & Image Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 rounded-3xl bg-[#09150e]/80 backdrop-blur-xl border border-emerald-500/20 p-5 shadow-glass-card">
            <ImageUploader
              currentImageUrl={quest.imageUrl}
              onImageChange={(url) => setQuest({ ...quest, imageUrl: url })}
            />
          </div>

          <div className="lg:col-span-2 rounded-3xl bg-[#09150e]/80 backdrop-blur-xl border border-emerald-500/20 p-6 shadow-glass-card space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                Quest Title
              </label>
              <input
                type="text"
                value={quest.title}
                onChange={(e) => setQuest({ ...quest, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-emerald-500/25 focus:border-emerald-400 text-white font-bold text-base outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                Quest Description
              </label>
              <textarea
                rows={2}
                value={quest.description}
                onChange={(e) => setQuest({ ...quest, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-emerald-500/25 focus:border-emerald-400 text-zinc-300 text-xs outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Week Number</label>
                <input
                  type="number"
                  value={quest.weekNumber}
                  onChange={(e) => setQuest({ ...quest, weekNumber: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-emerald-500/20 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Date Range</label>
                <input
                  type="text"
                  value={quest.dateRangeString}
                  onChange={(e) => setQuest({ ...quest, dateRangeString: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-emerald-500/20 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Duration</label>
                <input
                  type="text"
                  value={quest.durationString}
                  onChange={(e) => setQuest({ ...quest, durationString: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-emerald-500/20 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Status</label>
                <select
                  value={quest.status}
                  onChange={(e) =>
                    setQuest({
                      ...quest,
                      status: e.target.value as 'Active' | 'Upcoming' | 'Completed',
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-emerald-500/20 text-white text-xs font-mono outline-none"
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
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">Questions Bank</h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-mono text-xs border border-emerald-500/30">
                {quest.questions.length} Items
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-5">
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
        <div className="sticky bottom-6 z-40 p-4 rounded-2xl bg-[#06100a]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">
            {quest.questions.length} questions in this quest set.
          </span>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Saving to Supabase...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-black" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
