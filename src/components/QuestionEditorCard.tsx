'use client';

import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Trash2, 
  HelpCircle, 
  Lightbulb, 
  Compass,
  Gauge,
  Flame,
  Zap,
  Sprout,
  Skull
} from 'lucide-react';
import { QuestionDraft, QuestionDifficulty } from '@/lib/types';
import { QUESTION_ARCHETYPES, getDifficultyForIndex } from '@/lib/openai';

interface QuestionEditorCardProps {
  question: QuestionDraft;
  index: number;
  totalQuestions: number;
  category: string;
  selectedObjectIds: string[];
  existingQuestionTexts: string[];
  onUpdate: (updated: QuestionDraft) => void;
  onDelete: () => void;
}

export default function QuestionEditorCard({
  question,
  index,
  totalQuestions,
  category,
  selectedObjectIds,
  existingQuestionTexts,
  onUpdate,
  onDelete,
}: QuestionEditorCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentArchetype = question.archetype || QUESTION_ARCHETYPES[index % QUESTION_ARCHETYPES.length];
  const currentDifficulty: QuestionDifficulty = question.difficulty || getDifficultyForIndex(index + 1, totalQuestions);

  const handleRefreshThisQuestion = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/regenerate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          selectedObjectIds,
          existingQuestionTexts: existingQuestionTexts.filter((t) => t !== question.text),
          orderIndex: question.orderIndex,
          difficulty: currentDifficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refresh');

      if (data.question) {
        onUpdate({
          ...data.question,
          id: question.id,
          orderIndex: question.orderIndex,
          difficulty: currentDifficulty,
        });
      }
    } catch (err) {
      console.error('Error refreshing question:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTextChange = (field: keyof QuestionDraft, value: any) => {
    onUpdate({
      ...question,
      [field]: value,
    });
  };

  const handleOptionTextChange = (optIdx: number, newText: string) => {
    const updatedOptions = [...question.options];
    updatedOptions[optIdx] = {
      ...updatedOptions[optIdx],
      text: newText,
    };
    onUpdate({ ...question, options: updatedOptions });
  };

  const handleSelectCorrectOption = (optIdx: number) => {
    const updatedOptions = question.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIdx,
    }));
    onUpdate({ ...question, options: updatedOptions });
  };

  // Status-dot styled difficulty badges (small badges with 8px glowing dots)
  const getDifficultyBadge = (diff: QuestionDifficulty) => {
    switch (diff) {
      case 'Easy':
        return {
          dotClass: 'bg-emerald-400 text-emerald-400',
          badgeClass: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
          label: 'Easy (Warm-up)',
        };
      case 'Medium':
        return {
          dotClass: 'bg-amber-400 text-amber-400',
          badgeClass: 'bg-amber-950/40 border-amber-500/30 text-amber-300',
          label: 'Medium (Core)',
        };
      case 'Hard':
        return {
          dotClass: 'bg-violet-400 text-violet-400',
          badgeClass: 'bg-violet-950/40 border-violet-500/30 text-violet-300',
          label: 'Hard (Analytical)',
        };
      case 'Very Difficult':
        return {
          dotClass: 'bg-rose-400 text-rose-400',
          badgeClass: 'bg-rose-950/40 border-rose-500/30 text-rose-300',
          label: 'Very Difficult (Mastery)',
        };
      default:
        return {
          dotClass: 'bg-[#5B8CFF] text-[#5B8CFF]',
          badgeClass: 'bg-blue-950/40 border-blue-500/30 text-[#5B8CFF]',
          label: diff,
        };
    }
  };

  const badge = getDifficultyBadge(currentDifficulty);

  return (
    <div className="glass-panel glass-panel-hover p-6 sm:p-7 relative transition-all duration-300 group">
      {/* Header: Number, Archetype, Difficulty & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08] mb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Order number */}
          <div className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center font-mono font-bold text-xs text-white">
            {index + 1}
          </div>
          
          {/* Question Archetype Badge */}
          <div className="pill-badge inline-flex items-center space-x-1.5 px-3 py-0.5 text-[11px]">
            <Compass className="w-3 h-3 text-[#5B8CFF]" />
            <span>{currentArchetype}</span>
          </div>

          {/* Difficulty Badge with 8px glowing status dot */}
          <div className={`inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${badge.badgeClass}`}>
            <span className={`status-dot ${badge.dotClass}`} />
            <span>{badge.label}</span>
          </div>

          {/* Difficulty Dropdown Selector */}
          <select
            value={currentDifficulty}
            onChange={(e) => handleTextChange('difficulty', e.target.value as QuestionDifficulty)}
            className="px-2.5 py-1 rounded-xl bg-black/60 border border-white/[0.08] hover:border-white/[0.16] text-[#9CA3AF] hover:text-white text-[11px] font-mono outline-none cursor-pointer transition-colors"
            title="Adjust difficulty level for this question"
          >
            <option value="Easy">Set: Easy</option>
            <option value="Medium">Set: Medium</option>
            <option value="Hard">Set: Hard</option>
            <option value="Very Difficult">Set: Very Difficult</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh This Question Button */}
          <button
            type="button"
            disabled={isRefreshing}
            onClick={handleRefreshThisQuestion}
            className="btn-glass inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white active:scale-95 disabled:opacity-50"
            title={`Regenerate this question specifically as a ${currentDifficulty} challenge`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#5B8CFF]' : 'text-[#6B7280]'}`} />
            <span className="font-mono text-[11px]">{isRefreshing ? 'Synthesizing...' : `Refresh (${currentDifficulty})`}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete this question"
            className="btn-glass p-2 text-[#6B7280] hover:text-rose-400 hover:border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question Textarea */}
      <div className="space-y-1.5 mb-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-[0.12em] text-[#6B7280]">
            Question Inquiry Prompt
          </label>
          <span className="text-[10px] text-[#6B7280] font-mono">
            {currentDifficulty} · Grounded in Supabase
          </span>
        </div>
        <textarea
          rows={2}
          value={question.text}
          onChange={(e) => handleTextChange('text', e.target.value)}
          placeholder="Enter question inquiry..."
          className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] focus:ring-1 focus:ring-[#2F5BFF]/30 text-white text-sm font-medium transition-all placeholder-[#6B7280] resize-none outline-none leading-relaxed"
        />
      </div>

      {/* 4 MCQ Options */}
      <div className="space-y-2.5 mb-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-[0.12em] text-[#6B7280]">
            Answer Choices (Click radio to select correct answer)
          </label>
          <span className="text-[10px] text-[#6B7280] font-mono">Randomized client placement</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {question.options.map((opt, optIdx) => (
            <div
              key={opt.id || optIdx}
              onClick={() => handleSelectCorrectOption(optIdx)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
                opt.isCorrect
                  ? 'bg-[#2F5BFF]/10 border-[#5B8CFF] shadow-[0_0_20px_rgba(47,91,255,0.25)] text-white'
                  : 'bg-black/40 border-white/[0.08] hover:border-white/[0.14] text-[#9CA3AF]'
              }`}
            >
              {opt.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-[#5B8CFF] shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[#6B7280] shrink-0" />
              )}
              <span className="font-mono text-xs font-bold text-[#5B8CFF] shrink-0">
                {opt.prefix}.
              </span>
              <input
                type="text"
                value={opt.text}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                placeholder={`Option ${opt.prefix}...`}
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-[#6B7280] font-medium"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Explanation & Fact Drawer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/[0.08]">
        <div className="glass-card-sm p-3.5 space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
            <HelpCircle className="w-3 h-3 text-[#5B8CFF]" />
            <span>Astrophysical Explanation (Post-Quiz Review)</span>
          </label>
          <textarea
            rows={2}
            value={question.explanation}
            onChange={(e) => handleTextChange('explanation', e.target.value)}
            placeholder="Verified scientific rationale..."
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] focus:border-[#5B8CFF] text-xs text-[#9CA3AF] placeholder-[#6B7280] resize-none outline-none leading-relaxed"
          />
        </div>

        <div className="glass-card-sm p-3.5 space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
            <Lightbulb className="w-3 h-3 text-[#5B8CFF]" />
            <span>Curiosity / Trivia Fact</span>
          </label>
          <textarea
            rows={2}
            value={question.interestingFact}
            onChange={(e) => handleTextChange('interestingFact', e.target.value)}
            placeholder="Fascinating space trivia..."
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] focus:border-[#5B8CFF] text-xs text-[#9CA3AF] placeholder-[#6B7280] resize-none outline-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
