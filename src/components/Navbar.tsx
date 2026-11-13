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
  Cpu,
  Github
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
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#050608]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Product Name + Dot Separator + Muted Tagline */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#2F5BFF] to-[#10265C] border border-white/[0.14] flex items-center justify-center shadow-[0_0_20px_rgba(47,91,255,0.4)] group-hover:shadow-[0_0_28px_rgba(47,91,255,0.65)] transition-all">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="font-bold text-base tracking-tight text-white">CONSTELLA</span>
                <span className="text-xs text-[#6B7280]">·</span>
                <span className="hidden sm:inline text-xs text-[#9CA3AF] tracking-normal font-sans">
                  Cosmic Curriculum Architect
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links & Glass Header Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Segmented Nav Tabs */}
            <div className="segmented-tabs-container flex items-center">
              <Link
                href="/dashboard"
                className={`px-3 py-1 text-xs font-medium transition-all ${
                  pathname === '/dashboard'
                    ? 'segmented-tab-active'
                    : 'segmented-tab-inactive'
                }`}
              >
                All Quests
              </Link>
              <Link
                href="/dashboard/new"
                className={`px-3 py-1 text-xs font-medium transition-all ${
                  pathname.startsWith('/dashboard/new')
                    ? 'segmented-tab-active'
                    : 'segmented-tab-inactive'
                }`}
              >
                Quest Studio
              </Link>
            </div>

            {/* API Key Settings Button */}
            <button
              type="button"
              onClick={() => setIsOpenAiModalOpen(true)}
              className="btn-glass hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white"
              title="Configure OpenAI API Key"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#5B8CFF]" />
              <span className="font-mono text-[11px]">API Key</span>
            </button>

            {/* Glass Header Button: GitHub */}
            <a
              href="https://github.com/akhandpratap18/constella-quest-admin"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white"
            >
              <Github className="w-3.5 h-3.5 text-[#6B7280]" />
              <span className="font-mono text-[11px]">Repo</span>
            </a>

            {/* Primary CTA Button */}
            <Link
              href="/dashboard/new"
              className="btn-primary-cta inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white tracking-wide"
            >
              <Sparkles className="w-3.5 h-3.5 text-white/90" />
              <span>New Quest</span>
            </Link>

            <div className="h-4 w-px bg-white/[0.08]" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign out of Admin Portal"
              className="btn-glass p-2 text-[#9CA3AF] hover:text-rose-400 hover:border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* OpenAI API Key Settings Modal (Dark Glass Panel) */}
      {isOpenAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-panel p-6 sm:p-8 space-y-6">
            <button
              onClick={() => setIsOpenAiModalOpen(false)}
              className="absolute top-5 right-5 text-[#6B7280] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="pill-badge inline-flex items-center space-x-2 px-3 py-1">
                <KeyRound className="w-3 h-3 text-[#5B8CFF]" />
                <span className="text-[11px] uppercase tracking-wider font-mono">Model Configuration</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Connect OpenAI API Key
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Connect your OpenAI key to have GPT-4o dynamically frame every astronomy quest question directly from verified Supabase discoveries with calibrated difficulty curves.
              </p>
            </div>

            {isConfigured && (
              <div className="glass-card-sm p-3.5 flex items-center justify-between border-emerald-500/30">
                <div className="flex items-center space-x-2.5">
                  <span className="status-dot bg-emerald-400 text-emerald-400" />
                  <span className="text-xs text-[#9CA3AF] font-mono">Active Key:</span>
                  <span className="font-mono text-xs font-semibold text-white">{maskedKey}</span>
                </div>
                <span className="pill-badge px-2.5 py-0.5 text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-950/40">
                  Ready
                </span>
              </div>
            )}

            {keyError && (
              <div className="glass-card-sm p-3.5 border-rose-500/30 text-rose-300 text-xs font-mono">
                {keyError}
              </div>
            )}

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-[#6B7280] flex items-center justify-between">
                  <span>OpenAI API Key</span>
                  <span className="text-[10px] text-[#6B7280] normal-case">Stored in .env.local</span>
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] focus:border-[#5B8CFF] focus:ring-1 focus:ring-[#2F5BFF]/40 text-white text-xs outline-none font-mono placeholder-[#6B7280] transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenAiModalOpen(false)}
                  className="btn-glass px-4 py-2 text-xs text-[#9CA3AF] hover:text-white font-mono"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingKey || !apiKeyInput.trim()}
                  className="btn-primary-cta px-5 py-2 text-xs font-mono font-semibold flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSavingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Saving Key...</span>
                    </>
                  ) : keySaveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Connected!</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5 text-white" />
                      <span>Save & Activate</span>
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
