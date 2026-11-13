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
  Compass,
  ArrowRight
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Hero Section matching Design Spec: Centered, clamp(3rem, 7vw, 5.5rem), gray gradient 2nd line, formula pill */}
        <section className="text-center flex flex-col items-center space-y-5 pt-4 pb-2 animate-fade-up">
          {/* Mono Label */}
          <div className="pill-badge inline-flex items-center space-x-2 px-3.5 py-1">
            <span className="status-dot bg-[#5B8CFF] text-[#5B8CFF]" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#5B8CFF]">
              CONSTELLA QUEST ARCHITECT
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.04em] leading-[1.05] max-w-4xl mx-auto">
            <span className="text-white block">Weekly Space Quests</span>
            <span className="headline-gradient block">Curriculum Architecture</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            Synthesize, curate, and deploy verified astronomy quests to the Constella iOS app with algorithmic difficulty calibration grounded in Supabase data.
          </p>

          {/* Formula Pill (Core Value Transformation) */}
          <div className="formula-pill inline-flex items-center space-x-2 px-4 py-1.5 shadow-sm">
            <span>SUPABASE DISCOVERIES</span>
            <span className="text-[#6B7280]">→</span>
            <span className="text-white">GPT-4o CURATION</span>
            <span className="text-[#6B7280]">→</span>
            <span className="text-[#5B8CFF]">CONSTELLA IOS APP</span>
          </div>

          {/* Hero CTA Action */}
          <div className="pt-2 flex items-center justify-center space-x-3">
            <Link
              href="/dashboard/new"
              className="btn-primary-cta inline-flex items-center space-x-2 px-6 py-3 text-sm font-semibold tracking-wide"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Synthesize New Quest</span>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </Link>
          </div>
        </section>

        {/* Info Mini-Cards matching Section 5 */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="glass-card-sm p-4 sm:p-5 flex flex-col justify-between space-y-2 hover:border-white/[0.14] transition-all">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em]">Total Quests</span>
              <Layers className="w-4 h-4 text-[#5B8CFF]" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">{quests.length}</span>
              <span className="text-[11px] text-[#6B7280] font-mono">Published</span>
            </div>
            <div className="text-[11px] text-[#6B7280] font-mono flex items-center space-x-1">
              <span>Supabase DB</span>
              <span>→</span>
              <span className="text-[#9CA3AF]">Synchronized</span>
            </div>
          </div>

          <div className="glass-card-sm p-4 sm:p-5 flex flex-col justify-between space-y-2 hover:border-white/[0.14] transition-all">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em]">Active Quest</span>
              <span className="status-dot bg-[#5B8CFF] text-[#5B8CFF]" />
            </div>
            <div className="text-base sm:text-lg font-bold text-white truncate font-sans">
              {activeQuest ? activeQuest.title : 'None active'}
            </div>
            <div className="text-[11px] text-[#6B7280] font-mono flex items-center space-x-1">
              <span>{activeQuest ? `Week ${activeQuest.weekNumber}` : 'Status'}</span>
              <span>→</span>
              <span className="text-[#9CA3AF] truncate">{activeQuest ? activeQuest.dateRangeString : 'Standby'}</span>
            </div>
          </div>

          <div className="glass-card-sm p-4 sm:p-5 flex flex-col justify-between space-y-2 hover:border-white/[0.14] transition-all">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em]">Latest Week</span>
              <Calendar className="w-4 h-4 text-[#5B8CFF]" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">W{maxWeek}</span>
              <span className="text-[11px] text-[#6B7280] font-mono">Cycle</span>
            </div>
            <div className="text-[11px] text-[#6B7280] font-mono flex items-center space-x-1">
              <span>Next deployment</span>
              <span>→</span>
              <span className="text-[#9CA3AF]">Week {maxWeek + 1}</span>
            </div>
          </div>

          <div className="glass-card-sm p-4 sm:p-5 flex flex-col justify-between space-y-2 hover:border-white/[0.14] transition-all">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em]">Questions Index</span>
              <HelpCircle className="w-4 h-4 text-[#5B8CFF]" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">{totalQuestions}</span>
              <span className="text-[11px] text-[#6B7280] font-mono">Items</span>
            </div>
            <div className="text-[11px] text-[#6B7280] font-mono flex items-center space-x-1">
              <span>Bandwidth</span>
              <span>→</span>
              <span className="text-[#9CA3AF]">Easy to Cosmic</span>
            </div>
          </div>
        </section>

        {/* Section Header: 28–32px, weight 600, white */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-2xl sm:text-[30px] font-semibold text-white tracking-tight">
                All Quests Catalog
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Active and scheduled weekly quests rendered directly in the Constella space explorer.
              </p>
            </div>
            <div className="formula-pill px-3 py-1 text-xs self-start sm:self-auto">
              <span>SHOWING {quests.length} QUESTS</span>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-7 h-7 text-[#5B8CFF] animate-spin" />
              <p className="text-xs text-[#9CA3AF] font-mono">Loading Quests from Supabase...</p>
            </div>
          ) : quests.length === 0 ? (
            <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4">
              <Layers className="w-10 h-10 text-[#6B7280]" />
              <h3 className="text-lg font-semibold text-white">No Quests Published Yet</h3>
              <p className="text-xs text-[#9CA3AF] max-w-md leading-relaxed">
                Click &quot;Synthesize New Quest&quot; to build an authentic question set from your Supabase discoveries.
              </p>
              <Link
                href="/dashboard/new"
                className="btn-primary-cta px-5 py-2.5 text-xs font-semibold"
              >
                Create Week 1 Quest
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className="glass-panel glass-panel-hover overflow-hidden flex flex-col group"
                >
                  {/* Hero Cover Image */}
                  <div className="relative aspect-[16/9] w-full bg-[#050608] overflow-hidden border-b border-white/[0.08]">
                    <img
                      src={quest.imageUrl || 'https://cdrydgtnzlujciwgefmb.supabase.co/storage/v1/object/public/constella-media/planets/mars/home_mars.png'}
                      alt={quest.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-black/40" />

                    {/* Status Pill with 8px glowing status dot */}
                    <div className="absolute top-3.5 left-3.5">
                      <span className="pill-badge inline-flex items-center space-x-1.5 px-2.5 py-0.5 text-[11px] backdrop-blur-md">
                        <span
                          className={`status-dot ${
                            quest.status === 'Active'
                              ? 'bg-[#5B8CFF] text-[#5B8CFF]'
                              : quest.status === 'Upcoming'
                              ? 'bg-amber-400 text-amber-400'
                              : 'bg-zinc-500 text-zinc-500'
                          }`}
                        />
                        <span>{quest.status}</span>
                      </span>
                    </div>

                    {/* Week Number Badge */}
                    <div className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/[0.1] text-white text-[11px] font-mono font-semibold">
                      W{quest.weekNumber}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-base text-white group-hover:text-[#5B8CFF] transition-colors line-clamp-1">
                        {quest.title}
                      </h3>
                      <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                        {quest.description}
                      </p>
                    </div>

                    {/* Meta Row */}
                    <div className="pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-[11px] text-[#9CA3AF] font-mono">
                      <div className="flex items-center space-x-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span className="truncate">{quest.dateRangeString}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span>{quest.durationString}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span>{quest.questionsCount || 0} Questions</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[#5B8CFF]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Supabase Live</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                      <Link
                        href={`/dashboard/edit/${quest.id}`}
                        className="btn-glass inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#5B8CFF]" />
                        <span>Edit Quest</span>
                      </Link>

                      <button
                        onClick={() => handleDelete(quest.id, quest.title)}
                        disabled={deletingId === quest.id}
                        className="btn-glass p-2 text-[#6B7280] hover:text-rose-400 hover:border-rose-500/30 transition-colors disabled:opacity-50"
                        title="Delete quest"
                      >
                        {deletingId === quest.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
