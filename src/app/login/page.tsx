'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, KeyRound, User, Sparkles, Loader2, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('constella2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md">
        {/* Glow Orb under card */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[90px] pointer-events-none" />

        {/* Glassmorphic Login Card */}
        <div className="relative rounded-3xl bg-[#07130b]/80 backdrop-blur-2xl border border-emerald-500/25 p-7 sm:p-9 shadow-glass-card hover:border-emerald-500/40 transition-all duration-500">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.5)]">
              <Compass className="w-8 h-8 text-black" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Quest Command Center</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Constella Admin</h1>
              <p className="text-xs text-zinc-400">
                Sign in to manage and synthesize weekly space quests
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono text-center">
                {errorMessage}
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-300/90 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Username</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-emerald-500/25 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-white text-sm outline-none transition-all placeholder-zinc-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-300/90 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-emerald-500/25 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-white text-sm outline-none transition-all placeholder-zinc-600"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-semibold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Enter Portal</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div className="mt-6 pt-5 border-t border-emerald-500/10 text-center">
            <p className="text-[11px] text-zinc-500 font-mono">
              Predecided access: <span className="text-emerald-400">admin</span> / <span className="text-emerald-400">constella2026!</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
