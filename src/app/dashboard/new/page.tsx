'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import QuestionEditorCard from '@/components/QuestionEditorCard';
import ImageUploader from '@/components/ImageUploader';
import { 
  Sparkles, 
  Layers, 
  Calendar, 
  Clock, 
  HelpCircle, 
  Check, 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Save, 
  CheckCircle2,
  Globe2,
  Compass
} from 'lucide-react';
import { QuestDraft, QuestionDraft } from '@/lib/types';

interface CategoryItem {
  id: string;
  name: string;
  category: string;
  subtitle?: string;
  imageUrl?: string;
  topicsCount: number;
}

interface CategoryGroup {
  name: string;
  items: CategoryItem[];
}

export default function NewQuestPage() {
  const router = useRouter();

  // Wizard Configuration State
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Planets');
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>(['mars']);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );

  // Generation & Draft State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuest, setGeneratedQuest] = useState<QuestDraft | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Categories & Objects from Supabase on load
  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await fetch('/api/topics');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          // Default selection
          const planetsGroup = (data.categories || []).find((c: any) => c.name === 'Planets');
          if (planetsGroup && planetsGroup.items.length > 0) {
            setSelectedObjectIds([planetsGroup.items[0].id]);
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadTopics();
  }, []);

  const activeCategoryGroup = categories.find((c) => c.name === selectedCategory) || categories[0];

  const handleToggleObject = (id: string) => {
    if (selectedObjectIds.includes(id)) {
      if (selectedObjectIds.length > 1) {
        setSelectedObjectIds(selectedObjectIds.filter((item) => item !== id));
      }
    } else {
      setSelectedObjectIds([...selectedObjectIds, id]);
    }
  };

  const handleSelectAllInCat = () => {
    if (!activeCategoryGroup) return;
    const allIds = activeCategoryGroup.items.map((i) => i.id);
    setSelectedObjectIds(allIds);
  };

  // Step: AI Generation
  const handleGenerate = async () => {
    if (selectedObjectIds.length === 0) {
      setErrorMessage('Please select at least one celestial object.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          selectedObjectIds,
          questionCount,
          durationMinutes,
          targetDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quest');
      }

      setGeneratedQuest(data.quest);
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handlers for Question Updates
  const handleUpdateQuestion = (index: number, updated: QuestionDraft) => {
    if (!generatedQuest) return;
    const updatedQuestions = [...generatedQuest.questions];
    updatedQuestions[index] = updated;
    setGeneratedQuest({ ...generatedQuest, questions: updatedQuestions });
  };

  const handleDeleteQuestion = (index: number) => {
    if (!generatedQuest) return;
    const updated = generatedQuest.questions.filter((_, i) => i !== index);
    setGeneratedQuest({ ...generatedQuest, questions: updated });
  };

  const handleAddBlankQuestion = () => {
    if (!generatedQuest) return;
    const newIdx = generatedQuest.questions.length + 1;
    const blank: QuestionDraft = {
      id: `manual_q_${Date.now()}_${newIdx}`,
      orderIndex: newIdx,
      archetype: 'Custom Question',
      text: 'New Astronomy Question Prompt',
      explanation: 'Explanation for correct answer.',
      interestingFact: 'Fascinating space trivia.',
      options: [
        { id: `opt_${Date.now()}_A`, prefix: 'A', text: 'Verified Correct Option', isCorrect: true },
        { id: `opt_${Date.now()}_B`, prefix: 'B', text: 'Plausible Alternative B', isCorrect: false },
        { id: `opt_${Date.now()}_C`, prefix: 'C', text: 'Plausible Alternative C', isCorrect: false },
        { id: `opt_${Date.now()}_D`, prefix: 'D', text: 'Plausible Alternative D', isCorrect: false },
      ],
    };
    setGeneratedQuest({
      ...generatedQuest,
      questions: [...generatedQuest.questions, blank],
    });
  };

  // Publish Quest directly to Supabase
  const handlePublish = async () => {
    if (!generatedQuest) return;
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedQuest),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish');
      }

      setPublishSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Publishing failed');
    } finally {
      setIsPublishing(false);
    }
  };

  // Find artwork fallback from selected objects
  const defaultArtworkUrl = activeCategoryGroup?.items.find((i) =>
    selectedObjectIds.includes(i.id)
  )?.imageUrl;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link */}
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Quests</span>
        </button>

        {/* Wizard Step 1: Configuration Form */}
        {!generatedQuest ? (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-medium">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Deterministic Quest Synthesis</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Synthesize Weekly Quest
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl">
                Select target celestial entities. The AI Agent will inspect verified discoveries in Supabase and craft non-templated, unique questions covering distinct pedagogical angles.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-mono">
                {errorMessage}
              </div>
            )}

            {/* Scope Card */}
            <div className="rounded-3xl bg-[#080e1c]/85 backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 shadow-glass-card space-y-6">
              {/* Category Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                  1. Select Target Category
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {isLoadingCategories ? (
                    <div className="flex items-center space-x-2 text-slate-400 text-sm py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Loading database categories...</span>
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          if (cat.items.length > 0) {
                            setSelectedObjectIds([cat.items[0].id]);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 ${
                          selectedCategory === cat.name
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                            : 'bg-black/40 text-slate-400 hover:text-white border border-white/[0.08] hover:border-blue-500/30'
                        }`}
                      >
                        <Globe2 className="w-4 h-4" />
                        <span>{cat.name}</span>
                        <span className="text-xs opacity-75 font-mono">({cat.items.length})</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Entity Multi-Select Grid */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                    2. Select Target Celestial Entities (Single or Multiple)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllInCat}
                    className="text-xs text-blue-400 hover:text-sky-300 font-medium transition-colors font-mono"
                  >
                    Select All in {selectedCategory}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {activeCategoryGroup?.items.map((obj) => {
                    const isSelected = selectedObjectIds.includes(obj.id);
                    return (
                      <div
                        key={obj.id}
                        onClick={() => handleToggleObject(obj.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-2.5 ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                            : 'bg-black/40 border-white/[0.06] text-slate-400 hover:border-blue-500/30 hover:text-slate-200'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-blue-600 border-blue-400 text-white'
                              : 'border-slate-700 bg-black/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate text-white">{obj.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {obj.topicsCount} topics
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
                {/* Number of Questions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 font-mono">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>Number of Questions</span>
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-sm focus:border-blue-400 outline-none"
                  >
                    <option value={3}>3 Questions (Quick Quiz)</option>
                    <option value={5}>5 Questions (Standard Weekly)</option>
                    <option value={8}>8 Questions (Deep Dive)</option>
                    <option value={10}>10 Questions (Mastery Quest)</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Estimated Duration</span>
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-sm focus:border-blue-400 outline-none"
                  >
                    <option value={5}>~ 5 minutes</option>
                    <option value={8}>~ 8 minutes</option>
                    <option value={10}>~ 10 minutes (Recommended)</option>
                    <option value={12}>~ 12 minutes</option>
                    <option value={15}>~ 15 minutes</option>
                  </select>
                </div>

                {/* Target Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Publish Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-white text-sm focus:border-blue-400 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Generate CTA Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(37,99,235,0.45)] hover:shadow-[0_0_40px_rgba(37,99,235,0.65)] transition-all flex items-center justify-center space-x-2.5 active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Synthesizing Unique Questions & Verifying Corpus...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <span>Synthesize Quest with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Interactive Review & Single-Question Refresh Canvas */
          <div className="space-y-8">
            {/* Header with Publish Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#080e1c]/90 backdrop-blur-xl border border-white/[0.08] shadow-glass-card">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-200 font-mono text-xs border border-blue-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>AI Quest Generated · Unique Cognitive Archetypes Active</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Review & Customize Quest
                </h2>
                <p className="text-xs text-slate-400">
                  You can edit any text inline, replace the cover artwork, or click &quot;Refresh Question&quot; to change individual items.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setGeneratedQuest(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium transition-colors"
                >
                  Start Over
                </button>

                <button
                  type="button"
                  disabled={isPublishing || publishSuccess}
                  onClick={handlePublish}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(37,99,235,0.45)] transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Publishing to Supabase...</span>
                    </>
                  ) : publishSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                      <span>Published to Constella!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-white" />
                      <span>Publish Quest to Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-mono">
                {errorMessage}
              </div>
            )}

            {/* Quest Metadata & Hero Image Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Image Upload Card */}
              <div className="lg:col-span-1 rounded-3xl bg-[#080e1c]/85 backdrop-blur-xl border border-white/[0.08] p-5 shadow-glass-card">
                <ImageUploader
                  currentImageUrl={generatedQuest.imageUrl}
                  defaultFallbackUrl={defaultArtworkUrl}
                  onImageChange={(url) => setGeneratedQuest({ ...generatedQuest, imageUrl: url })}
                />
              </div>

              {/* Right Column: Title, Description, Dates */}
              <div className="lg:col-span-2 rounded-3xl bg-[#080e1c]/85 backdrop-blur-xl border border-white/[0.08] p-6 shadow-glass-card space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                    Quest Title (AI Synthesized)
                  </label>
                  <input
                    type="text"
                    value={generatedQuest.title}
                    onChange={(e) => setGeneratedQuest({ ...generatedQuest, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] focus:border-blue-400 text-white font-bold text-base outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                    Quest Description
                  </label>
                  <textarea
                    rows={2}
                    value={generatedQuest.description}
                    onChange={(e) =>
                      setGeneratedQuest({ ...generatedQuest, description: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/[0.08] focus:border-blue-400 text-slate-300 text-xs outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400">Week Number</label>
                    <input
                      type="number"
                      value={generatedQuest.weekNumber}
                      onChange={(e) =>
                        setGeneratedQuest({ ...generatedQuest, weekNumber: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-white text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400">Date Range</label>
                    <input
                      type="text"
                      value={generatedQuest.dateRangeString}
                      onChange={(e) =>
                        setGeneratedQuest({ ...generatedQuest, dateRangeString: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-white text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400">Duration</label>
                    <input
                      type="text"
                      value={generatedQuest.durationString}
                      onChange={(e) =>
                        setGeneratedQuest({ ...generatedQuest, durationString: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-white text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400">Status</label>
                    <select
                      value={generatedQuest.status}
                      onChange={(e) =>
                        setGeneratedQuest({
                          ...generatedQuest,
                          status: e.target.value as 'Active' | 'Upcoming' | 'Completed',
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-white text-xs font-mono outline-none"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Active">Active (Live in App)</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">Synthesized Quest Questions</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-mono text-xs border border-blue-500/30">
                    {generatedQuest.questions.length} Items · Distinct Archetypes
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddBlankQuestion}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.1] hover:border-blue-500/40 text-blue-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Manual Question</span>
                </button>
              </div>

              {/* Questions List with Inline Editing & Refresh Button */}
              <div className="space-y-5">
                {generatedQuest.questions.map((q, idx) => (
                  <QuestionEditorCard
                    key={q.id || idx}
                    question={q}
                    index={idx}
                    totalQuestions={generatedQuest.questions.length}
                    category={generatedQuest.category}
                    selectedObjectIds={generatedQuest.selectedObjectIds || selectedObjectIds}
                    existingQuestionTexts={generatedQuest.questions.map((item) => item.text)}
                    onUpdate={(updated) => handleUpdateQuestion(idx, updated)}
                    onDelete={() => handleDeleteQuestion(idx)}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Floating Publish Bar */}
            <div className="sticky bottom-6 z-40 p-4 rounded-2xl bg-[#040816]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(37,99,235,0.3)] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>
                  All {generatedQuest.questions.length} questions are verified and ready for publication.
                </span>
              </div>

              <button
                type="button"
                disabled={isPublishing || publishSuccess}
                onClick={handlePublish}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Writing to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    <span>Publish Quest Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
