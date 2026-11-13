'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  HelpCircle, 
  Edit3, 
  Trash2, 
  Layers, 
  CheckCircle, 
  Loader2,
  Compass
} from 'lucide-react';

interface QuestItem {
  id: string;
  questSetId: string;
  title: string;
  description: string;
  weekNumber: number;
  status: 'Active' | 'Upcoming' | 'Completed';
  imageUrl: string;
  durationString: string;
  dateRangeString: string;
  questionsCount?: number;
}

export default function DashboardPage() {
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchQuests = async () => {
    try {
      const res = await fetch('/api/quests');
      if (res.ok) {
        const data = await res.json();
        setQuests(data.quests || []);
      }
    } catch (err) {
      console.error('Failed to load quests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete quest "${title}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/quests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuests((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (err) {
      console.error('Error deleting quest', err);
    } finally {
      setDeletingId(null);
    }
  };

  const activeQuest = quests.find((q) => q.status === 'Active');
  const maxWeek = quests.reduce((max, q) => Math.max(max, q.weekNumber || 0), 0);
  const totalQuestions = quests.reduce((sum, q) => sum + (q.questionsCount || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-medium">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Constella Mission Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Weekly Quests Management
            </h1>
            <p className="text-sm text-slate-400">
              Synthesize AI-powered space quests with deterministic precision grounded in verified discoveries.
            </p>
          </div>

          <Link
            href="/dashboard/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Generate New Quest</span>
          </Link>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#080e1c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/30 p-4 sm:p-5 shadow-glass-card transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-mono tracking-wider text-blue-400">Total Quests</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{quests.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Live in Supabase</p>
          </div>

          <div className="rounded-2xl bg-[#080e1c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/30 p-4 sm:p-5 shadow-glass-card transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-mono tracking-wider text-blue-400">Active Quest</span>
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
            </div>
            <div className="text-base sm:text-lg font-bold text-white truncate">
              {activeQuest ? activeQuest.title : 'None active'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {activeQuest ? `Week ${activeQuest.weekNumber} · ${activeQuest.dateRangeString}` : 'Schedule one'}
            </p>
          </div>

          <div className="rounded-2xl bg-[#080e1c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/30 p-4 sm:p-5 shadow-glass-card transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-mono tracking-wider text-blue-400">Latest Week</span>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">Week {maxWeek}</div>
            <p className="text-[11px] text-slate-500 mt-1">Next up: Week {maxWeek + 1}</p>
          </div>

          <div className="rounded-2xl bg-[#080e1c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/30 p-4 sm:p-5 shadow-glass-card transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-mono tracking-wider text-blue-400">Total Questions</span>
              <HelpCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{totalQuestions}</div>
            <p className="text-[11px] text-slate-500 mt-1">Across all question sets</p>
          </div>
        </div>

        {/* Quests Catalog Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h2 className="text-lg font-bold text-white tracking-tight">All Quests Catalog</h2>
            <span className="text-xs font-mono text-blue-300">Showing {quests.length} Quests</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-sm text-slate-400 font-mono">Fetching Quests from Supabase...</p>
            </div>
          ) : quests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center flex flex-col items-center justify-center space-y-3 bg-black/20">
              <Layers className="w-10 h-10 text-blue-400/40" />
              <h3 className="text-base font-medium text-white">No Quests Published Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Get started by clicking &quot;Generate New Quest&quot; to synthesize your next astronomy challenge.
              </p>
              <Link
                href="/dashboard/new"
                className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-md"
              >
                Create Week 1 Quest
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className="rounded-3xl bg-[#080e1c]/85 backdrop-blur-xl border border-white/[0.08] overflow-hidden shadow-glass-card hover:border-blue-500/50 hover:shadow-glass-card-hover transition-all duration-300 flex flex-col group"
                >
                  {/* Hero Image */}
                  <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
                    <img
                      src={quest.imageUrl || 'https://cdrydgtnzlujciwgefmb.supabase.co/storage/v1/object/public/constella-media/planets/mars/home_mars.png'}
                      alt={quest.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080e1c] via-transparent to-black/30" />

                    {/* Status Pill */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono tracking-wide backdrop-blur-md border ${
                          quest.status === 'Active'
                            ? 'bg-blue-600/25 text-blue-200 border-blue-400/50 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                            : quest.status === 'Upcoming'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                            : 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            quest.status === 'Active'
                              ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8] animate-pulse'
                              : quest.status === 'Upcoming'
                              ? 'bg-amber-400'
                              : 'bg-zinc-400'
                          }`}
                        />
                        <span>{quest.status}</span>
                      </span>
                    </div>

                    {/* Week Number Badge */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-blue-300 text-xs font-mono font-bold">
                      W{quest.weekNumber}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-base text-white group-hover:text-sky-300 transition-colors line-clamp-1">
                        {quest.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {quest.description}
                      </p>
                    </div>

                    {/* Meta Row */}
                    <div className="pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400/80" />
                        <span className="truncate">{quest.dateRangeString}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400/80" />
                        <span>{quest.durationString}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-400/80" />
                        <span>{quest.questionsCount || 0} Questions</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-blue-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>iOS Synced</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                      <Link
                        href={`/dashboard/edit/${quest.id}`}
                        className="flex items-center space-x-1 text-xs font-medium text-blue-400 hover:text-sky-300 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Quest & Questions</span>
                      </Link>

                      <button
                        onClick={() => handleDelete(quest.id, quest.title)}
                        disabled={deletingId === quest.id}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="Delete quest"
                      >
                        {deletingId === quest.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
