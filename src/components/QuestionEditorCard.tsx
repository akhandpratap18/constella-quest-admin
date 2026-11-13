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

  // Helper for difficulty styling
  const getDifficultyBadge = (diff: QuestionDifficulty) => {
    switch (diff) {
      case 'Easy':
        return {
          icon: <Sprout className="w-3 h-3 text-emerald-400" />,
          classes: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
          label: 'Easy (Warm-up)',
        };
      case 'Medium':
        return {
          icon: <Zap className="w-3 h-3 text-amber-400" />,
          classes: 'bg-amber-950/60 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
          label: 'Medium (Core)',
        };
      case 'Hard':
        return {
          icon: <Flame className="w-3 h-3 text-violet-400" />,
          classes: 'bg-violet-950/60 border-violet-500/40 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]',
          label: 'Hard (Analytical)',
        };
      case 'Very Difficult':
        return {
          icon: <Skull className="w-3 h-3 text-rose-400" />,
          classes: 'bg-rose-950/60 border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]',
          label: 'Very Difficult (Mastery)',
        };
      default:
        return {
          icon: <Gauge className="w-3 h-3 text-blue-400" />,
          classes: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
          label: diff,
        };
    }
  };

  const badge = getDifficultyBadge(currentDifficulty);

  return (
    <div className="relative rounded-2xl bg-[#040816]/90 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/50 p-5 sm:p-6 shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300 group">
      {/* Question Header: Number, Archetype, Difficulty & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08] mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Order number */}
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-mono font-bold text-xs text-blue-300 shadow-[0_0_12px_rgba(37,99,235,0.3)]">
            {index + 1}
          </div>
          
          {/* Question Archetype Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-[11px] font-medium tracking-wide shadow-sm">
            <Compass className="w-3 h-3 text-blue-400" />
            <span>{currentArchetype}</span>
          </div>

          {/* Difficulty Badge with interactive switcher */}
          <div className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${badge.classes}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>

          {/* Difficulty Dropdown Selector */}
          <select
            value={currentDifficulty}
            onChange={(e) => handleTextChange('difficulty', e.target.value as QuestionDifficulty)}
            className="px-2 py-0.5 rounded-lg bg-black/60 border border-white/[0.1] hover:border-blue-500/40 text-slate-300 hover:text-white text-[11px] font-mono outline-none cursor-pointer transition-colors"
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
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 hover:border-blue-400 text-blue-200 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title={`Regenerate this question specifically as a ${currentDifficulty} challenge`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Synthesizing...' : `Refresh (${currentDifficulty})`}</span>
            <Sparkles className="w-3 h-3 text-blue-400 opacity-80" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete this question"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Textarea */}
      <div className="space-y-1.5 mb-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300 font-mono flex items-center space-x-1">
            <span>Question Inquiry Prompt</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {currentDifficulty} · 100% Supabase Grounded
          </span>
        </div>
        <textarea
          rows={2}
          value={question.text}
          onChange={(e) => handleTextChange('text', e.target.value)}
          placeholder="Enter question text..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-white text-sm font-medium transition-all placeholder-zinc-600 resize-none outline-none leading-relaxed"
        />
      </div>

      {/* 4 MCQ Options */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300 font-mono">
            Answer Choices (Click radio to set verified answer)
          </label>
          <span className="text-[10px] text-slate-500 font-mono">Randomized placement</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {question.options.map((opt, optIdx) => (
            <div
              key={opt.id || optIdx}
              onClick={() => handleSelectCorrectOption(optIdx)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                opt.isCorrect
                  ? 'bg-blue-600/20 border-blue-500/70 shadow-[0_0_20px_rgba(37,99,235,0.35)] text-white'
                  : 'bg-black/50 border-white/[0.06] hover:border-blue-500/30 text-slate-300'
              }`}
            >
              {opt.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
              )}
              <span className="font-mono text-xs font-bold text-blue-400 shrink-0">
                {opt.prefix}.
              </span>
              <input
                type="text"
                value={opt.text}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                placeholder={`Option ${opt.prefix}...`}
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-zinc-600 font-medium"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Explanation & Fact Drawer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/[0.08]">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-blue-300/90 flex items-center space-x-1.5 font-mono">
            <HelpCircle className="w-3 h-3 text-blue-400" />
            <span>Astrophysical Explanation (Post-Quiz Review)</span>
          </label>
          <textarea
            rows={2}
            value={question.explanation}
            onChange={(e) => handleTextChange('explanation', e.target.value)}
            placeholder="Scientific reason why this answer is correct..."
            className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] focus:border-blue-500 text-xs text-slate-300 placeholder-zinc-600 resize-none outline-none leading-relaxed"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-blue-300/90 flex items-center space-x-1.5 font-mono">
            <Lightbulb className="w-3 h-3 text-blue-400" />
            <span>Curiosity / Trivia Fact</span>
          </label>
          <textarea
            rows={2}
            value={question.interestingFact}
            onChange={(e) => handleTextChange('interestingFact', e.target.value)}
            placeholder="Fascinating cosmic trivia..."
            className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] focus:border-blue-500 text-xs text-slate-300 placeholder-zinc-600 resize-none outline-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
