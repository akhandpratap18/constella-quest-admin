'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Compass,
  Search,
  X,
  Shuffle
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
  const [activeFilterTab, setActiveFilterTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
          // Default selection if available
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

  // Flatten all items across all categories
  const allObjects = useMemo(() => {
    return categories.flatMap((c) => c.items);
  }, [categories]);

  // Selected items with full object details
  const selectedItems = useMemo(() => {
    return allObjects.filter((o) => selectedObjectIds.includes(o.id));
  }, [allObjects, selectedObjectIds]);

  // Compute distinct categories in the current mix
  const distinctSelectedCategories = useMemo(() => {
    return Array.from(new Set(selectedItems.map((i) => i.category)));
  }, [selectedItems]);

  const effectiveCategory = useMemo(() => {
    if (distinctSelectedCategories.length > 1) {
      return `Mixed (${distinctSelectedCategories.join(' & ')})`;
    }
    return distinctSelectedCategories[0] || 'Planetary Science';
  }, [distinctSelectedCategories]);

  // Filter objects based on active tab and search query
  const filteredObjects = useMemo(() => {
    let list = allObjects;

    if (activeFilterTab === 'SELECTED') {
      list = allObjects.filter((o) => selectedObjectIds.includes(o.id));
    } else if (activeFilterTab !== 'ALL') {
      list = allObjects.filter((o) => o.category === activeFilterTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          (o.subtitle && o.subtitle.toLowerCase().includes(q)) ||
          o.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allObjects, activeFilterTab, selectedObjectIds, searchQuery]);

  // Toggle selection for a single object without wiping other selections
  const handleToggleObject = (id: string) => {
    if (selectedObjectIds.includes(id)) {
      setSelectedObjectIds(selectedObjectIds.filter((item) => item !== id));
    } else {
      setSelectedObjectIds([...selectedObjectIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredObjects.map((o) => o.id);
    const merged = Array.from(new Set([...selectedObjectIds, ...idsToAdd]));
    setSelectedObjectIds(merged);
  };

  const handleClearSelection = () => {
    setSelectedObjectIds([]);
  };

  // Quick preset: Pick popular mix (e.g. Mars, Andromeda, Triangulum)
  const handlePickPopularMix = () => {
    const targetMixIds = ['mars', 'andromeda-galaxy', 'triangulum-galaxy'];
    const matched = allObjects.filter((o) => 
      targetMixIds.includes(o.id) || 
      o.id.includes('mars') || 
      o.id.includes('andromeda') || 
      o.id.includes('triangulum')
    ).slice(0, 3).map((o) => o.id);

    if (matched.length > 0) {
      setSelectedObjectIds(matched);
    }
  };

  // Step: AI Generation
  const handleGenerate = async () => {
    if (selectedObjectIds.length === 0) {
      setErrorMessage('Please select at least one celestial entity for the quest.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: effectiveCategory,
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

  // Artwork fallback from selected objects
  const defaultArtworkUrl = selectedItems.find((i) => i.imageUrl)?.imageUrl;

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
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/40 text-blue-300 text-xs font-mono font-medium shadow-[0_0_15px_rgba(37,99,235,0.25)]">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                <span>Deterministic Multi-Topic Synthesis</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Synthesize Weekly Quest
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl">
                Choose any mix of celestial entities across Planets, Galaxies, Constellations, and Phenomena (e.g. Mars + Andromeda + Triangulum). The AI will synthesize unique questions spanning your selected mix.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-mono">
                {errorMessage}
              </div>
            )}

            {/* Scope Card */}
            <div className="rounded-3xl bg-[#040816]/90 backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 shadow-glass-card hover:border-blue-500/30 transition-all space-y-6">
              
              {/* Category Filter Pills & Search Bar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                    1. Filter & Search Celestial Entities
                  </label>
                  
                  {/* Preset quick button */}
                  <button
                    type="button"
                    onClick={handlePickPopularMix}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-200 text-xs font-mono transition-colors self-start sm:self-auto shadow-sm"
                    title="Pre-select Mars, Andromeda, and Triangulum"
                  >
                    <Shuffle className="w-3 h-3 text-blue-400" />
                    <span>Preset: Mars + Andromeda + Triangulum</span>
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => setActiveFilterTab('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 font-mono ${
                        activeFilterTab === 'ALL'
                          ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.45)]'
                          : 'bg-black/50 text-slate-400 hover:text-white border border-white/[0.08] hover:border-blue-500/40'
                      }`}
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>All Entities</span>
                      <span className="opacity-75">({allObjects.length})</span>
                    </button>

                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setActiveFilterTab(cat.name)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 font-mono ${
                          activeFilterTab === cat.name
                            ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.45)]'
                            : 'bg-black/50 text-slate-400 hover:text-white border border-white/[0.08] hover:border-blue-500/40'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="opacity-75">({cat.items.length})</span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setActiveFilterTab('SELECTED')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 font-mono ${
                        activeFilterTab === 'SELECTED'
                          ? 'bg-blue-600 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.55)]'
                          : 'bg-blue-950/60 text-blue-300 border border-blue-500/40 hover:border-blue-400'
                      }`}
                    >
                      <span>Selected Mix</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                        {selectedObjectIds.length}
                      </span>
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Mars, Andromeda..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/60 border border-white/[0.08] focus:border-blue-500 text-white text-xs outline-none transition-all placeholder-slate-500 font-mono"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Mix Chips Drawer */}
              <div className="p-4 rounded-2xl bg-[#030612]/95 border border-blue-500/30 space-y-2.5 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                      Selected Mix ({selectedItems.length})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[10px] font-mono shadow-sm">
                      {effectiveCategory}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Select All in View
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {selectedItems.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-mono py-1">
                    No celestial objects selected yet. Click any entity card below to add it to the quest mix.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedItems.map((obj) => (
                      <div
                        key={obj.id}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/50 text-white text-xs font-medium shadow-[0_0_12px_rgba(37,99,235,0.25)] transition-all"
                      >
                        <span className="font-semibold">{obj.name}</span>
                        <span className="text-[10px] font-mono text-blue-300 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/40">
                          {obj.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleObject(obj.id)}
                          className="hover:text-rose-300 transition-colors pl-0.5"
                          title={`Remove ${obj.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Entity Multi-Select Grid */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Available Entities ({filteredObjects.length})</span>
                  <span>Click any card to select / unselect</span>
                </div>

                {isLoadingCategories ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <p className="text-xs text-slate-400 font-mono">Loading celestial database...</p>
                  </div>
                ) : filteredObjects.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 font-mono">
                    No celestial entities found matching &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {filteredObjects.map((obj) => {
                      const isSelected = selectedObjectIds.includes(obj.id);
                      return (
                        <div
                          key={obj.id}
                          onClick={() => handleToggleObject(obj.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-2.5 ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_18px_rgba(37,99,235,0.3)]'
                              : 'bg-black/50 border-white/[0.06] text-slate-400 hover:border-blue-500/30 hover:text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                                : 'border-slate-700 bg-black/50'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold truncate text-white">{obj.name}</p>
                              <span className="text-[9px] font-mono text-blue-400 px-1 py-0.2 rounded bg-black/60 border border-blue-900/40 shrink-0">
                                {obj.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono truncate">
                              {obj.topicsCount} topics
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-white text-sm focus:border-blue-500 outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-white text-sm focus:border-blue-500 outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/[0.08] text-white text-sm focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Generate CTA Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={isGenerating || selectedObjectIds.length === 0}
                  onClick={handleGenerate}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:shadow-[0_0_40px_rgba(37,99,235,0.7)] transition-all flex items-center justify-center space-x-2.5 active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Synthesizing Quest Across {selectedItems.length} Entities...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Synthesize Quest for {selectedItems.length} Entities</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#040816]/90 backdrop-blur-xl border border-white/[0.08] shadow-glass-card hover:border-blue-500/40 transition-all">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-600/15 text-blue-200 font-mono text-xs border border-blue-500/40 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>AI Quest Generated · Multi-Topic Synthesis Ready</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Review & Customize Quest
                </h2>
                <p className="text-xs text-slate-400">
                  Featuring: {generatedQuest.selectedObjectIds?.join(', ') || 'Mixed Selection'}. You can edit any question or click &quot;Refresh Question&quot; to change individual items.
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
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
              <div className="lg:col-span-1 rounded-3xl bg-[#040816]/90 backdrop-blur-xl border border-white/[0.08] p-5 shadow-glass-card hover:border-blue-500/40 transition-all">
                <ImageUploader
                  currentImageUrl={generatedQuest.imageUrl}
                  defaultFallbackUrl={defaultArtworkUrl}
                  onImageChange={(url) => setGeneratedQuest({ ...generatedQuest, imageUrl: url })}
                />
              </div>

              {/* Right Column: Title, Description, Dates */}
              <div className="lg:col-span-2 rounded-3xl bg-[#040816]/90 backdrop-blur-xl border border-white/[0.08] p-6 shadow-glass-card hover:border-blue-500/40 transition-all space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
                    Quest Title (AI Synthesized)
                  </label>
                  <input
                    type="text"
                    value={generatedQuest.title}
                    onChange={(e) => setGeneratedQuest({ ...generatedQuest, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] focus:border-blue-500 text-white font-bold text-base outline-none"
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
                    className="w-full px-4 py-2 rounded-xl bg-black/60 border border-white/[0.08] focus:border-blue-500 text-slate-300 text-xs outline-none resize-none leading-relaxed"
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
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-white text-xs font-mono"
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
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-white text-xs font-mono"
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
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-white text-xs font-mono"
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
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-white text-xs font-mono outline-none"
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
                  <span className="px-3 py-0.5 rounded-full bg-blue-600/20 text-blue-300 font-mono text-xs border border-blue-500/40 shadow-sm">
                    {generatedQuest.questions.length} Items · Distinct Archetypes
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddBlankQuestion}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.1] hover:border-blue-500/50 text-blue-300 hover:text-white text-xs font-medium transition-colors"
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
            <div className="sticky bottom-6 z-40 p-4 rounded-2xl bg-[#030612]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(37,99,235,0.35)] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>
                  All {generatedQuest.questions.length} questions are verified and ready for publication.
                </span>
              </div>

              <button
                type="button"
                disabled={isPublishing || publishSuccess}
                onClick={handlePublish}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.55)] transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
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
