'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Compass, 
  LogOut, 
  ShieldCheck, 
  KeyRound, 
  Check, 
  Loader2, 
  X,
  Cpu
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // OpenAI API Key configuration state
  const [isOpenAiModalOpen, setIsOpenAiModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Check key configuration on load
  useEffect(() => {
    async function checkKeyConfig() {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          setIsConfigured(Boolean(data.isConfigured));
          setMaskedKey(data.maskedKey || null);
        }
      } catch (err) {
        console.error('Failed to check OpenAI key status', err);
      }
    }
    checkKeyConfig();
  }, []);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setKeyError('Please enter a valid OpenAI API key');
      return;
    }

    setIsSavingKey(true);
    setKeyError(null);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save key');

      setIsConfigured(true);
      setMaskedKey(data.maskedKey);
      setKeySaveSuccess(true);
      setApiKeyInput('');
      setTimeout(() => {
        setKeySaveSuccess(false);
        setIsOpenAiModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setKeyError(err.message || 'Error saving key');
    } finally {
      setIsSavingKey(false);
    }
  };

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
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#040816]/90 backdrop-blur-xl">
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

            {/* Model / OpenAI Key Status Button */}
            <button
              type="button"
              onClick={() => setIsOpenAiModalOpen(true)}
              className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium transition-all active:scale-95 ${
                isConfigured
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:border-emerald-400'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-400'
              }`}
              title="Click to view or update OpenAI GPT-4o API Key"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <Cpu className="w-3.5 h-3.5 opacity-80" />
              <span>{isConfigured ? 'GPT-4o Model Active' : 'Connect OpenAI Key'}</span>
              {maskedKey && <span className="text-[10px] opacity-75">({maskedKey})</span>}
            </button>

            <div className="h-5 w-px bg-white/10" />

            {/* Admin Tag & Logout */}
            <div className="flex items-center space-x-2 pl-1">
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin</span>
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

      {/* OpenAI API Key Settings Modal */}
      {isOpenAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#040816] border border-blue-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(37,99,235,0.35)] space-y-6">
            <button
              onClick={() => setIsOpenAiModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/40 text-blue-300 text-xs font-mono font-medium">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>Model Intelligence Settings</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Connect OpenAI API Key
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your OpenAI key to have GPT-4o dynamically frame every astronomy quest question directly from your extracted Supabase discoveries, with brilliant writing and calibrated difficulty.
              </p>
            </div>

            {isConfigured && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Currently Active:</span>
                  <span className="font-bold text-white">{maskedKey}</span>
                </div>
                <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/50">
                  GPT-4o Ready
                </span>
              </div>
            )}

            {keyError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {keyError}
              </div>
            )}

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono flex items-center justify-between">
                  <span>OpenAI API Key (sk-...)</span>
                  <span className="text-[10px] text-slate-500">Stored securely in .env.local</span>
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/[0.1] focus:border-blue-500 text-white text-xs outline-none font-mono placeholder-zinc-600 transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors font-mono"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingKey || !apiKeyInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  {isSavingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Saving Key...</span>
                    </>
                  ) : keySaveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      <span>Connected!</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5 text-white" />
                      <span>Save & Activate GPT-4o</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
