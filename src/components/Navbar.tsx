'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Compass, PlusCircle, LogOut, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-500/20 bg-[#06100a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all">
            <Compass className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-white">CONSTELLA</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Admin AI
              </span>
            </div>
            <span className="text-[11px] text-emerald-400/70 font-mono">Cosmic Quest Engine</span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === '/dashboard'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Quests
          </Link>

          <Link
            href="/dashboard/new"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Quest</span>
          </Link>

          <div className="h-5 w-px bg-emerald-500/20" />

          {/* Admin Tag & Logout */}
          <div className="flex items-center space-x-2 pl-1">
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Mode</span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out of Admin Portal"
              className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
