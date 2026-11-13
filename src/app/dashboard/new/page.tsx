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
  Shuffle,
  ShieldCheck,
  CheckCircle,
  Database,
  Smartphone,
  ChevronRight,
  Filter
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
  const [bandwidthMode, setBandwidthMode] = useState<'mixed' | 'accessible' | 'challenging'>('mixed');
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

  // Compute difficulty bandwidth distribution for review stage
  const difficultyStats = useMemo(() => {
    if (!generatedQuest) return { easy: 0, medium: 0, hard: 0, veryHard: 0 };
    return {
      easy: generatedQuest.questions.filter((q) => q.difficulty === 'Easy').length,
      medium: generatedQuest.questions.filter((q) => q.difficulty === 'Medium').length,
      hard: generatedQuest.questions.filter((q) => q.difficulty === 'Hard').length,
      veryHard: generatedQuest.questions.filter((q) => q.difficulty === 'Very Difficult').length,
    };
  }, [generatedQuest]);

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

  // Toggle selection for a single object
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
          bandwidthMode,
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
      difficulty: 'Easy',
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

  const defaultArtworkUrl = selectedItems.find((i) => i.imageUrl)?.imageUrl;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        
        {/* Top Control Bar with Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-glass inline-flex items-center space-x-2 px-3.5 py-1.5 text-xs text-[#9CA3AF] hover:text-white font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Quests</span>
          </button>

          <div className="formula-pill text-xs px-3 py-1">
            <span>PIPELINE: {generatedQuest ? 'STAGE 04 (REVIEW)' : 'STAGE 01 & 02 (CONFIG)'}</span>
          </div>
        </div>

        {/* TIMELINE THING AT THE VERY TOP matching User Request */}
        <section className="glass-panel p-4 sm:p-5 relative overflow-hidden animate-fade-up">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Timeline Stage Info */}
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#2F5BFF]/15 border border-[#5B8CFF]/30 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4 text-[#5B8CFF]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#6B7280]">
                    Synthesis Pipeline Timeline
                  </span>
                  <span className="status-dot bg-[#5B8CFF] text-[#5B8CFF]" />
                </div>
                <h2 className="text-sm font-semibold text-white">
                  {!generatedQuest 
                    ? 'Scope Selection & Bandwidth Calibration' 
                    : 'Editorial Review & Supabase Publication'}
                </h2>
              </div>
            </div>

            {/* Stepper Timeline Nodes */}
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto py-1">
              
              {/* Step 1: Target Mix */}
              <div className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition-all ${
                !generatedQuest
                  ? 'bg-[#2F5BFF]/15 border-[#5B8CFF] text-white shadow-[0_0_15px_rgba(47,91,255,0.25)]'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#9CA3AF]'
              }`}>
                <span className="w-5 h-5 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[10px] font-mono font-bold text-[#5B8CFF]">
                  01
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold">Target Mix</span>
                  <span className="text-[9px] font-mono text-[#6B7280]">
                    {selectedItems.length} selected
                  </span>
                </div>
              </div>

              <div className="w-4 h-px bg-white/[0.14] hidden sm:block shrink-0" />

              {/* Step 2: Bandwidth */}
              <div className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition-all ${
                !generatedQuest
                  ? 'bg-[#2F5BFF]/10 border-[#5B8CFF]/50 text-white'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#9CA3AF]'
              }`}>
                <span className="w-5 h-5 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[10px] font-mono font-bold text-[#5B8CFF]">
                  02
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold">Bandwidth</span>
                  <span className="text-[9px] font-mono text-[#6B7280]">
                    {questionCount} questions
                  </span>
                </div>
              </div>

              <div className="w-4 h-px bg-white/[0.14] hidden sm:block shrink-0" />

              {/* Step 3: Synthesis */}
              <div className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition-all ${
                isGenerating
                  ? 'bg-[#2F5BFF]/25 border-[#5B8CFF] text-white animate-pulse'
                  : generatedQuest
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#6B7280]'
              }`}>
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                  generatedQuest ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-[#6B7280]'
                }`}>
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin text-[#5B8CFF]" /> : generatedQuest ? '✓' : '03'}
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold">Synthesis</span>
                  <span className="text-[9px] font-mono text-[#6B7280]">
                    {isGenerating ? 'Synthesizing...' : generatedQuest ? 'Complete' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="w-4 h-px bg-white/[0.14] hidden sm:block shrink-0" />

              {/* Step 4: Publish */}
              <div className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition-all ${
                generatedQuest
                  ? 'bg-[#2F5BFF]/15 border-[#5B8CFF] text-white shadow-[0_0_15px_rgba(47,91,255,0.25)]'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#6B7280]'
              }`}>
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                  generatedQuest ? 'bg-[#2F5BFF] text-white' : 'bg-white/[0.06] text-[#6B7280]'
                }`}>
                  04
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold">Publish</span>
                  <span className="text-[9px] font-mono text-[#6B7280]">
                    {generatedQuest ? 'Ready' : 'Standby'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="glass-card-sm p-4 border-rose-500/30 text-rose-300 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* STEP 1 & 2: HORIZONTAL TARGET SCOPE & PARAMETERS (replacing the cramped vertical layout) */}
        {!generatedQuest ? (
          <div className="space-y-6 animate-fade-up">
            
            {/* Main Full-Width Horizontal Glass Panel */}
            <div className="glass-panel p-6 sm:p-8 space-y-6">
              
              {/* Header Row: Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="pill-badge inline-flex items-center space-x-1.5 px-3 py-0.5 text-[11px] mb-2">
                    <Sparkles className="w-3 h-3 text-[#5B8CFF]" />
                    <span>Multi-Topic Synthesis Studio</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Select Celestial Entities
                  </h1>
                  <p className="text-xs text-[#9CA3AF] mt-1 max-w-2xl">
                    Choose any combination of planets, galaxies, stars, constellations, or deep space phenomena. The AI will synthesize questions spanning your selected mix with zero cross-contamination.
                  </p>
                </div>

                {/* Popular Mix Preset Button */}
                <button
                  type="button"
                  onClick={handlePickPopularMix}
                  className="btn-glass px-4 py-2 text-xs font-mono text-[#5B8CFF] hover:text-white flex items-center space-x-2 self-start md:self-center"
                  title="Preset: Mars + Andromeda + Triangulum"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Preset: Mars · Andromeda · Triangulum</span>
                </button>
              </div>

              {/* HORIZONTAL CATEGORY TABS & SEARCH BAR (Spacious and effortless to access) */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Horizontal Category Tabs */}
                <div className="segmented-tabs-container flex items-center overflow-x-auto py-1">
                  <button
                    type="button"
                    onClick={() => setActiveFilterTab('ALL')}
                    className={`px-4 py-2 text-xs font-mono font-medium whitespace-nowrap transition-all ${
                      activeFilterTab === 'ALL'
                        ? 'segmented-tab-active'
                        : 'segmented-tab-inactive'
                    }`}
                  >
                    All Entities ({allObjects.length})
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setActiveFilterTab(cat.name)}
                      className={`px-4 py-2 text-xs font-mono font-medium whitespace-nowrap transition-all ${
                        activeFilterTab === cat.name
                          ? 'segmented-tab-active'
                          : 'segmented-tab-inactive'
                      }`}
                    >
                      {cat.name} ({cat.items.length})
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setActiveFilterTab('SELECTED')}
                    className={`px-4 py-2 text-xs font-mono font-medium whitespace-nowrap transition-all ${
                      activeFilterTab === 'SELECTED'
                        ? 'segmented-tab-active text-[#5B8CFF]'
                        : 'segmented-tab-inactive text-[#5B8CFF]'
                    }`}
                  >
                    Active Mix ({selectedObjectIds.length})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72 shrink-0">
                  <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Mars, Andromeda..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-white/[0.08] focus:border-[#5B8CFF] text-white text-xs outline-none font-mono placeholder-[#6B7280] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* HORIZONTAL ACTIVE MIX TRAY */}
              <div className="glass-card-sm p-4 space-y-2 border-white/[0.08]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                      Active Curriculum Mix ({selectedItems.length})
                    </span>
                    <span className="pill-badge px-2.5 py-0.5 text-[10px] text-[#5B8CFF]">
                      {effectiveCategory}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[#5B8CFF] hover:text-white transition-colors"
                    >
                      Select All in Tab
                    </button>
                    <span className="text-[#6B7280]">·</span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-[#6B7280] hover:text-rose-400 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                {selectedItems.length === 0 ? (
                  <p className="text-xs text-[#6B7280] font-mono py-1">
                    No celestial entities selected. Click any entity card below to add to this quest.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedItems.map((obj) => (
                      <div
                        key={obj.id}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs font-mono shadow-sm"
                      >
                        <span className="font-semibold">{obj.name}</span>
                        <span className="text-[10px] text-[#6B7280] uppercase px-1.5 py-0.2 rounded bg-black/50 border border-white/[0.08]">
                          {obj.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleObject(obj.id)}
                          className="text-[#6B7280] hover:text-rose-400 transition-colors pl-0.5"
                          title={`Remove ${obj.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HORIZONTAL MULTI-COLUMN ENTITY CARDS GRID (Spacious, 4 columns, easy to click) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#6B7280] font-mono">
                  <span>Available Entities ({filteredObjects.length})</span>
                  <span>Click any card to select or deselect</span>
                </div>

                {isLoadingCategories ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin text-[#5B8CFF]" />
                    <p className="text-xs text-[#9CA3AF] font-mono">Loading celestial database...</p>
                  </div>
                ) : filteredObjects.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#6B7280] font-mono glass-card-sm p-8">
                    No celestial entities found matching &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {filteredObjects.map((obj) => {
                      const isSelected = selectedObjectIds.includes(obj.id);
                      return (
                        <div
                          key={obj.id}
                          onClick={() => handleToggleObject(obj.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 group ${
                            isSelected
                              ? 'bg-[#2F5BFF]/10 border-[#5B8CFF] text-white shadow-[0_0_20px_rgba(47,91,255,0.22)]'
                              : 'bg-black/40 border-white/[0.08] hover:border-white/[0.16] text-[#9CA3AF] hover:text-white'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-[#2F5BFF] border-[#5B8CFF] text-white'
                                : 'border-white/[0.14] bg-black/50 group-hover:border-white/[0.25]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold truncate text-white">{obj.name}</p>
                              <span className="text-[9px] font-mono text-[#6B7280] uppercase px-1 py-0.2 rounded bg-black/60 border border-white/[0.06] shrink-0">
                                {obj.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#6B7280] font-mono truncate mt-0.5">
                              {obj.topicsCount} verified topics
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* HORIZONTAL SYNTHESIS PARAMETERS BAR */}
              <div className="pt-6 border-t border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                    Synthesis Parameters & Difficulty Bandwidth
                  </span>
                  <span className="text-[11px] font-mono text-[#9CA3AF]">
                    Estimated: ~{durationMinutes} min · {questionCount} Questions
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Question Count */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#5B8CFF]" />
                      <span>Question Count</span>
                    </label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs outline-none font-mono focus:border-[#5B8CFF]"
                    >
                      <option value={3}>3 Questions (Quick Warm-up)</option>
                      <option value={5}>5 Questions (Standard Weekly)</option>
                      <option value={8}>8 Questions (Deep Dive)</option>
                      <option value={10}>10 Questions (Mastery Quest)</option>
                    </select>
                  </div>

                  {/* Difficulty Bandwidth */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#5B8CFF]" />
                      <span>Difficulty Bandwidth</span>
                    </label>
                    <select
                      value={bandwidthMode}
                      onChange={(e) => setBandwidthMode(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs outline-none font-mono focus:border-[#5B8CFF]"
                    >
                      <option value="mixed">Dynamic Curve (Easy ➔ Very Hard)</option>
                      <option value="accessible">Accessible (Mostly Easy & Medium)</option>
                      <option value="challenging">Challenging (Hard ➔ Very Hard)</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#5B8CFF]" />
                      <span>Duration</span>
                    </label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs outline-none font-mono focus:border-[#5B8CFF]"
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
                    <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5B8CFF]" />
                      <span>Publish Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs outline-none font-mono focus:border-[#5B8CFF]"
                    />
                  </div>
                </div>

                {/* Generate Primary CTA Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isGenerating || selectedObjectIds.length === 0}
                    onClick={handleGenerate}
                    className="btn-primary-cta px-8 py-3.5 text-xs font-mono font-semibold flex items-center space-x-2.5 active:scale-95 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Synthesizing Quest Across {selectedItems.length} Entities...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Synthesize Space Quest ({selectedItems.length} Entities)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 4: REVIEW & EDITORIAL WORKBENCH */
          <div className="space-y-8 animate-fade-up">
            {/* Header with Publish Action */}
            <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="pill-badge inline-flex items-center space-x-1.5 px-3 py-0.5 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-[#5B8CFF]" />
                  <span>Curriculum Synthesized · Ready for Review</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Review & Customize Quest
                </h2>
                <p className="text-xs text-[#9CA3AF]">
                  Featuring: {generatedQuest.selectedObjectIds?.join(', ') || 'Selected Mix'}. You can fine-tune wording or regenerate individual questions.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setGeneratedQuest(null)}
                  className="btn-glass px-4 py-2 text-xs font-mono text-[#9CA3AF] hover:text-white"
                >
                  Configure Again
                </button>

                <button
                  type="button"
                  disabled={isPublishing || publishSuccess}
                  onClick={handlePublish}
                  className="btn-primary-cta px-6 py-2.5 text-xs font-mono font-semibold flex items-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Publishing to Supabase...</span>
                    </>
                  ) : publishSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Published to Constella!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-white" />
                      <span>Publish Quest to Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quest Metadata & Cover Image */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 glass-panel p-5">
                <ImageUploader
                  currentImageUrl={generatedQuest.imageUrl}
                  defaultFallbackUrl={defaultArtworkUrl}
                  onImageChange={(url) => setGeneratedQuest({ ...generatedQuest, imageUrl: url })}
                />
              </div>

              <div className="lg:col-span-2 glass-panel p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                    Quest Title
                  </label>
                  <input
                    type="text"
                    value={generatedQuest.title}
                    onChange={(e) => setGeneratedQuest({ ...generatedQuest, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] text-white font-bold text-sm outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                    Quest Description
                  </label>
                  <textarea
                    rows={2}
                    value={generatedQuest.description}
                    onChange={(e) =>
                      setGeneratedQuest({ ...generatedQuest, description: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] text-[#9CA3AF] text-xs outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-[#6B7280]">Week Number</label>
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
                    <label className="text-[11px] font-mono text-[#6B7280]">Date Range</label>
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
                    <label className="text-[11px] font-mono text-[#6B7280]">Duration</label>
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
                    <label className="text-[11px] font-mono text-[#6B7280]">Status</label>
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

            {/* Questions Bank List */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    Synthesized Questions
                  </h3>
                  <span className="formula-pill px-2.5 py-0.5 text-[11px]">
                    {generatedQuest.questions.length} Items
                  </span>

                  {/* Difficulty Distribution Chips */}
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
                  onClick={handleAddBlankQuestion}
                  className="btn-glass inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white self-start sm:self-auto font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {/* Questions List with Inline Editing & Live Refresh */}
              <div className="space-y-6">
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
            <div className="sticky bottom-6 z-40 glass-panel p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-[#9CA3AF] font-mono">
                <Sparkles className="w-4 h-4 text-[#5B8CFF]" />
                <span>
                  All {generatedQuest.questions.length} questions are verified and ready for publication.
                </span>
              </div>

              <button
                type="button"
                disabled={isPublishing || publishSuccess}
                onClick={handlePublish}
                className="btn-primary-cta px-6 py-2.5 text-xs font-mono font-semibold flex items-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Writing to Supabase...</span>
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
        )}
      </main>
    </div>
  );
}
