'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, User, Loader2, Lock, ArrowRight } from 'lucide-react';

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
      <div className="w-full max-w-md animate-fade-up">
        {/* Glassmorphic Login Card matching Section 5 */}
        <div className="glass-panel p-8 sm:p-10 relative space-y-6">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2F5BFF] to-[#10265C] border border-white/[0.14] flex items-center justify-center shadow-[0_0_24px_rgba(47,91,255,0.4)]">
              <Compass className="w-6 h-6 text-white" />
            </div>

            <div className="space-y-1">
              <div className="pill-badge inline-flex items-center space-x-2 px-3 py-0.5">
                <span className="status-dot bg-[#5B8CFF] text-[#5B8CFF]" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#5B8CFF]">
                  ASTROPHYSICS COMMAND
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Constella Portal</h1>
              <p className="text-xs text-[#9CA3AF]">
                Sign in to architect and calibrate weekly space quests
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="glass-card-sm p-3 border-rose-500/30 text-rose-300 text-xs font-mono text-center">
                {errorMessage}
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#5B8CFF]" />
                <span>Admin Username</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] focus:ring-1 focus:ring-[#2F5BFF]/30 text-white text-xs outline-none font-mono placeholder-[#6B7280] transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280] flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-[#5B8CFF]" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] focus:border-[#5B8CFF] focus:ring-1 focus:ring-[#2F5BFF]/30 text-white text-xs outline-none font-mono placeholder-[#6B7280] transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-cta w-full py-3 text-xs font-mono font-semibold flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Enter Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div className="pt-4 border-t border-white/[0.08] text-center">
            <div className="formula-pill inline-flex px-3 py-1 text-[11px]">
              <span>DEFAULT: admin / constella2026!</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
