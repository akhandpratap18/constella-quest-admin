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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#040816]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.45)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] transition-all">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-white">CONSTELLA</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                Admin AI
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Cosmic Quest Engine</span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === '/dashboard'
                ? 'bg-blue-500/15 text-blue-200 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            All Quests
          </Link>

          <Link
            href="/dashboard/new"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all font-semibold"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Generate Quest</span>
          </Link>

          <div className="h-5 w-px bg-white/10" />

          {/* Admin Tag & Logout */}
          <div className="flex items-center space-x-2 pl-1">
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Mode</span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out of Admin Portal"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
