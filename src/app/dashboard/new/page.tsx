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
  Cpu,
  Smartphone
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
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
            <span>PIPELINE: ACTIVE</span>
          </div>
        </div>

        {/* Hero Section matching Design Spec: Centered, clamp(3rem, 7vw, 5.5rem), gray gradient line 2, formula pill */}
        <section className="text-center flex flex-col items-center space-y-4 pt-2 animate-fade-up">
          <div className="pill-badge inline-flex items-center space-x-2 px-3 py-1">
            <span className="status-dot bg-[#5B8CFF] text-[#5B8CFF]" />
            <span className="text-[11px] font-mono tracking-widest uppercase">
              ASTROPHYSICS QUEST STUDIO
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.04em] leading-[1.05] max-w-4xl mx-auto">
            <span className="text-white block">Space Quest Studio</span>
            <span className="headline-gradient block">Curriculum Synthesis</span>
          </h1>

          <p className="text-base sm:text-lg text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            Select celestial entities across our planetary and deep space corpus to synthesize an authentic weekly quest with calibrated difficulty bandwidth.
          </p>

          <div className="formula-pill inline-flex items-center space-x-2 px-4 py-1.5 shadow-sm">
            <span>SUPABASE CORPUS</span>
            <span className="text-[#6B7280]">→</span>
            <span className="text-white">GPT-4o INFERENCE</span>
            <span className="text-[#6B7280]">→</span>
            <span className="text-[#5B8CFF]">VERIFIED QUEST SET</span>
          </div>
        </section>

        {errorMessage && (
          <div className="glass-card-sm p-4 border-rose-500/30 text-rose-300 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* Two-Column Split Layout matching Section 6:
            Left: Narrower Glass Control Panel
            Right: Wider Glass Canvas / Visualization Panel with Dotted Grid Interior & Legend Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Narrower Glass Control Panel (lg:col-span-5 xl:col-span-4) */}
          <div className="lg:col-span-5 xl:col-span-4 glass-panel p-6 sm:p-7 space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                Control Panel
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Curriculum Scope
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                Configure target mix, difficulty curve, and quest parameters.
              </p>
            </div>

            {/* Segmented Filter Tabs matching Section 5 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                  Target Scope
                </label>
                <button
                  type="button"
                  onClick={handlePickPopularMix}
                  className="btn-glass px-2.5 py-1 text-[11px] font-mono text-[#5B8CFF] hover:text-white flex items-center space-x-1"
                  title="Preset: Mars + Andromeda + Triangulum"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Popular Mix</span>
                </button>
              </div>

              {/* Segmented Container */}
              <div className="segmented-tabs-container grid grid-cols-3 gap-1 text-center">
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('ALL')}
                  className={`py-1.5 text-xs font-mono font-medium transition-all ${
                    activeFilterTab === 'ALL'
                      ? 'segmented-tab-active'
                      : 'segmented-tab-inactive'
                  }`}
                >
                  All ({allObjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('Planets')}
                  className={`py-1.5 text-xs font-mono font-medium transition-all ${
                    activeFilterTab === 'Planets'
                      ? 'segmented-tab-active'
                      : 'segmented-tab-inactive'
                  }`}
                >
                  Planets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('SELECTED')}
                  className={`py-1.5 text-xs font-mono font-medium transition-all ${
                    activeFilterTab === 'SELECTED'
                      ? 'segmented-tab-active text-[#5B8CFF]'
                      : 'segmented-tab-inactive'
                  }`}
                >
                  Mix ({selectedObjectIds.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
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

            {/* Selected Mix Chips Drawer */}
            <div className="glass-card-sm p-3.5 space-y-2 border-white/[0.08]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#6B7280] uppercase tracking-[0.12em] text-[10px]">Active Mix</span>
                <span className="pill-badge px-2 py-0.5 text-[10px] text-[#5B8CFF]">
                  {effectiveCategory}
                </span>
              </div>

              {selectedItems.length === 0 ? (
                <p className="text-[11px] text-[#6B7280] font-mono py-1">
                  Click celestial entities below to select.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedItems.map((obj) => (
                    <div
                      key={obj.id}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs font-mono"
                    >
                      <span className="text-xs">{obj.name}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleObject(obj.id)}
                        className="text-[#6B7280] hover:text-rose-400 pl-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Entity Selection List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-mono">
                <span>Select Objects ({filteredObjects.length})</span>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[#5B8CFF] hover:text-white"
                >
                  Select All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {isLoadingCategories ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#5B8CFF]" />
                    <p className="text-[11px] text-[#6B7280] font-mono">Loading entities...</p>
                  </div>
                ) : filteredObjects.length === 0 ? (
                  <p className="text-xs text-[#6B7280] font-mono py-4 text-center">
                    No entities found matching query.
                  </p>
                ) : (
                  filteredObjects.map((obj) => {
                    const isSelected = selectedObjectIds.includes(obj.id);
                    return (
                      <div
                        key={obj.id}
                        onClick={() => handleToggleObject(obj.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-[#2F5BFF]/10 border-[#5B8CFF] text-white shadow-[0_0_15px_rgba(47,91,255,0.25)]'
                            : 'bg-black/40 border-white/[0.06] text-[#9CA3AF] hover:border-white/[0.14] hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                            isSelected
                              ? 'bg-[#2F5BFF] border-[#5B8CFF] text-white'
                              : 'border-white/[0.14] bg-black/50'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between">
                          <p className="text-xs font-semibold truncate text-white">{obj.name}</p>
                          <span className="text-[10px] font-mono text-[#6B7280] uppercase">
                            {obj.category}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Parameters Settings */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              {/* Question Count */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
                  <HelpCircle className="w-3 h-3 text-[#5B8CFF]" />
                  <span>Question Count</span>
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs outline-none font-mono"
                >
                  <option value={3}>3 Questions (Quick Quiz)</option>
                  <option value={5}>5 Questions (Standard Weekly)</option>
                  <option value={8}>8 Questions (Deep Dive)</option>
                  <option value={10}>10 Questions (Mastery Quest)</option>
                </select>
              </div>

              {/* Difficulty Bandwidth */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
                  <Layers className="w-3 h-3 text-[#5B8CFF]" />
                  <span>Difficulty Bandwidth</span>
                </label>
                <select
                  value={bandwidthMode}
                  onChange={(e) => setBandwidthMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs outline-none font-mono"
                >
                  <option value="mixed">Dynamic Curve (Easy ➔ Very Hard)</option>
                  <option value="accessible">Accessible (Mostly Easy & Medium)</option>
                  <option value="challenging">Challenging (Hard ➔ Very Hard)</option>
                </select>
              </div>

              {/* Duration & Target Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#5B8CFF]" />
                    <span>Duration</span>
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs outline-none font-mono"
                  >
                    <option value={5}>~ 5 min</option>
                    <option value={10}>~ 10 min</option>
                    <option value={15}>~ 15 min</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-[#5B8CFF]" />
                    <span>Publish Date</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isGenerating || selectedObjectIds.length === 0}
                onClick={handleGenerate}
                className="btn-primary-cta w-full py-3.5 text-xs font-mono font-semibold flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Quest Across {selectedItems.length} Entities...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Synthesize Space Quest</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Wider Glass Canvas / Visualization Panel (lg:col-span-7 xl:col-span-8) */}
          <div className="lg:col-span-7 xl:col-span-8 glass-panel p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Dotted Grid Interior Background */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Legend Pill Bar at Top of Canvas matching Section 6 */}
            <div className="relative z-10 flex flex-wrap items-center gap-2 pb-4 border-b border-white/[0.08]">
              <span className="pill-badge px-3 py-1 text-[11px]">
                🔭 Observational Evidence
              </span>
              <span className="pill-badge px-3 py-1 text-[11px]">
                ⚡ Physical Mechanism
              </span>
              <span className="pill-badge px-3 py-1 text-[11px]">
                🪐 Planetary Dynamics
              </span>
              <span className="pill-badge px-3 py-1 text-[11px] border-emerald-500/30 text-emerald-400 bg-emerald-950/30">
                ✦ Supabase Grounded
              </span>
            </div>

            {/* Canvas State 1: Pipeline Readiness Checklist (Prior to Generation) */}
            {!generatedQuest ? (
              <div className="relative z-10 space-y-6 py-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                    Synthesis Canvas
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Curriculum Pipeline
                  </h3>
                  <p className="text-xs text-[#9CA3AF] max-w-xl">
                    Once initiated, verified discoveries from your selected celestial mix are mapped into genuine scientific inquiries with calibrated difficulty bandwidth.
                  </p>
                </div>

                {/* Step / Checklist Rows matching Section 5 */}
                <div className="space-y-3 pt-2">
                  <div className="glass-card-sm p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-6 h-6 rounded-full border border-white/[0.2] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Extract Supabase Discovery Corpus</h4>
                        <p className="text-xs text-[#9CA3AF]">
                          Pulls authentic research facts directly from verified database topics.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#5B8CFF] uppercase tracking-wider">
                      Ready
                    </span>
                  </div>

                  <div className="glass-card-sm p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-6 h-6 rounded-full border border-white/[0.2] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Calibrate Difficulty Bandwidth</h4>
                        <p className="text-xs text-[#9CA3AF]">
                          Configures progressive curve from Easy warm-up to Very Hard cosmic paradox.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#5B8CFF] uppercase tracking-wider">
                      {bandwidthMode}
                    </span>
                  </div>

                  <div className="glass-card-sm p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-6 h-6 rounded-full border border-white/[0.2] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Synthesize Publication-Grade Questions</h4>
                        <p className="text-xs text-[#9CA3AF]">
                          Strict object attribution with realistic astrophysical distractors and explanations.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#5B8CFF] uppercase tracking-wider">
                      {questionCount} items
                    </span>
                  </div>

                  <div className="glass-card-sm p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-6 h-6 rounded-full border border-white/[0.2] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Deploy to Constella iOS App</h4>
                        <p className="text-xs text-[#9CA3AF]">
                          Direct JSON write to Supabase QuestionSets & Questions schema.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#9CA3AF] uppercase tracking-wider">
                      Standby
                    </span>
                  </div>
                </div>

                {/* Scope Telemetry Preview */}
                <div className="glass-card-sm p-4 space-y-2 border-white/[0.08]">
                  <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                    Current Synthesis Scope
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#9CA3AF]">
                    <div className="flex items-center space-x-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-[#5B8CFF]" />
                      <span>{selectedItems.length} Celestial Objects</span>
                    </div>
                    <span className="text-[#6B7280]">·</span>
                    <div className="flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#5B8CFF]" />
                      <span>{questionCount} Questions</span>
                    </div>
                    <span className="text-[#6B7280]">·</span>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#5B8CFF]" />
                      <span>~ {durationMinutes} min</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Canvas State 2: Live Quest Review & Question Editor */
              <div className="relative z-10 space-y-8">
                {/* Review Header Card */}
                <div className="glass-card-sm p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="pill-badge inline-flex items-center space-x-1.5 px-2.5 py-0.5 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-[#5B8CFF]" />
                        <span>Curriculum Synthesized</span>
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        Review & Customize Quest
                      </h3>
                      <p className="text-xs text-[#9CA3AF]">
                        Featuring: {generatedQuest.selectedObjectIds?.join(', ') || 'Selected Mix'}.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setGeneratedQuest(null)}
                        className="btn-glass px-3.5 py-2 text-xs font-mono text-[#9CA3AF] hover:text-white"
                      >
                        Reset
                      </button>

                      <button
                        type="button"
                        disabled={isPublishing || publishSuccess}
                        onClick={handlePublish}
                        className="btn-primary-cta px-4 py-2 text-xs font-mono font-semibold flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Publishing...</span>
                          </>
                        ) : publishSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Published!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 text-white" />
                            <span>Publish to Supabase</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Editor Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/[0.08]">
                    <div className="md:col-span-2 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                          Quest Title
                        </label>
                        <input
                          type="text"
                          value={generatedQuest.title}
                          onChange={(e) => setGeneratedQuest({ ...generatedQuest, title: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] text-white text-sm font-semibold outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
                          Quest Description
                        </label>
                        <textarea
                          rows={2}
                          value={generatedQuest.description}
                          onChange={(e) => setGeneratedQuest({ ...generatedQuest, description: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] text-[#9CA3AF] text-xs outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <ImageUploader
                        currentImageUrl={generatedQuest.imageUrl}
                        defaultFallbackUrl={defaultArtworkUrl}
                        onImageChange={(url) => setGeneratedQuest({ ...generatedQuest, imageUrl: url })}
                      />
                    </div>
                  </div>
                </div>

                {/* Questions Section Header */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-white tracking-tight">
                        Synthesized Questions
                      </h4>
                      <span className="formula-pill px-2.5 py-0.5 text-[11px]">
                        {generatedQuest.questions.length} Items
                      </span>

                      {/* Difficulty Distribution Meter Chips */}
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

                  {/* Question Cards List */}
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
                      {generatedQuest.questions.length} questions calibrated and ready for Constella iOS deployment.
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
                        <span>Deploying to Supabase...</span>
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
          </div>
        </div>
      </main>
    </div>
  );
}
