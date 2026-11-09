'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Circle, Sparkles, Trash2, HelpCircle, Lightbulb } from 'lucide-react';
import { QuestionDraft } from '@/lib/types';

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
  category,
  selectedObjectIds,
  existingQuestionTexts,
  onUpdate,
  onDelete,
}: QuestionEditorCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refresh');

      if (data.question) {
        onUpdate({
          ...data.question,
          id: question.id,
          orderIndex: question.orderIndex,
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

  return (
    <div className="relative rounded-2xl bg-[#09150e]/80 backdrop-blur-xl border border-emerald-500/20 p-5 sm:p-6 shadow-glass-card hover:border-emerald-500/40 transition-all duration-300 group">
      {/* Question Header & Refresh Action */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs text-emerald-300">
            {index + 1}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
            Multiple Choice Question
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh This Question Button */}
          <button
            type="button"
            disabled={isRefreshing}
            onClick={handleRefreshThisQuestion}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Use AI to generate a brand new question for this card"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'AI Refreshing...' : 'Refresh Question'}</span>
            <Sparkles className="w-3 h-3 text-emerald-400 opacity-70" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete this question"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Textarea */}
      <div className="space-y-1.5 mb-5">
        <label className="text-xs font-medium text-zinc-400 flex items-center space-x-1">
          <span>Question Prompt</span>
        </label>
        <textarea
          rows={2}
          value={question.text}
          onChange={(e) => handleTextChange('text', e.target.value)}
          placeholder="Enter question text..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-emerald-500/20 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-white text-sm font-medium transition-all placeholder-zinc-600 resize-none outline-none"
        />
      </div>

      {/* 4 MCQ Options */}
      <div className="space-y-2 mb-5">
        <label className="text-xs font-medium text-zinc-400">
          Options (Click radio to mark the correct answer)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {question.options.map((opt, optIdx) => (
            <div
              key={opt.id || optIdx}
              onClick={() => handleSelectCorrectOption(optIdx)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                opt.isCorrect
                  ? 'bg-emerald-500/15 border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-black/30 border-zinc-800/80 hover:border-emerald-500/30'
              }`}
            >
              {opt.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
              )}
              <span className="font-mono text-xs font-bold text-emerald-400/80 shrink-0">
                {opt.prefix}.
              </span>
              <input
                type="text"
                value={opt.text}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                placeholder={`Option ${opt.prefix}...`}
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-zinc-600"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Explanation & Fact Drawer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-500/10">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-emerald-400/80 flex items-center space-x-1">
            <HelpCircle className="w-3 h-3 text-emerald-400" />
            <span>Explanation (Shown after answering)</span>
          </label>
          <textarea
            rows={2}
            value={question.explanation}
            onChange={(e) => handleTextChange('explanation', e.target.value)}
            placeholder="Scientific reason why this answer is correct..."
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-emerald-500/15 focus:border-emerald-400 text-xs text-zinc-300 placeholder-zinc-600 resize-none outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-emerald-400/80 flex items-center space-x-1">
            <Lightbulb className="w-3 h-3 text-emerald-400" />
            <span>Did You Know? (Interesting Fact)</span>
          </label>
          <textarea
            rows={2}
            value={question.interestingFact}
            onChange={(e) => handleTextChange('interestingFact', e.target.value)}
            placeholder="Fascinating cosmic trivia..."
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-emerald-500/15 focus:border-emerald-400 text-xs text-zinc-300 placeholder-zinc-600 resize-none outline-none"
          />
        </div>
      </div>
    </div>
  );
}
