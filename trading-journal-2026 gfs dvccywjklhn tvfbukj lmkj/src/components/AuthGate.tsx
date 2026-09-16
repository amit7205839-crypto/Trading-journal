import { useState, FormEvent } from 'react';
import { Lock, Mail, TrendingUp, ShieldCheck, Database, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase, SUPABASE_CONFIG } from '../lib/supabase';

interface AuthGateProps {
  onDemoLogin: () => void;
  onOpenSqlModal: () => void;
}

export function AuthGate({ onDemoLogin, onOpenSqlModal }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      setStatus({ type: 'error', message: 'Enter a valid email and password (minimum 6 characters).' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'info', message: 'Authenticating with Supabase...' });

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success', message: 'Login successful! Loading your journal...' });
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || password.length < 6) {
      setStatus({ type: 'error', message: 'Enter a valid email and password (minimum 6 characters).' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'info', message: 'Creating account in Supabase...' });

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else if (data?.user && !data.session) {
      setStatus({
        type: 'success',
        message: 'Account created! If email confirmation is enabled in Supabase, check your inbox to confirm.',
      });
    } else {
      setStatus({ type: 'success', message: 'Account created & logged in!' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-[#0d1b2d] to-[#091524] border border-[#20334c] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/20 mb-1">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Trading Journal 2026</h1>
          <p className="text-xs text-slate-400">
            Cloud synced Binary Options & Quotex Trading Journal
          </p>
        </div>

        {/* Supabase backend status banner */}
        <div className="bg-[#07111f] border border-[#1e2f47] p-3 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <Database className="w-3.5 h-3.5 text-cyan-400" /> Backend:
            </span>
            <span className="font-mono text-cyan-400 font-semibold">{SUPABASE_CONFIG.projectName}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Project ID:</span>
            <span className="font-mono text-slate-400">{SUPABASE_CONFIG.projectId}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Status:</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3" /> Supabase Client Connected
            </span>
          </div>
        </div>

        {/* Status alert */}
        {status && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold ${
              status.type === 'error'
                ? 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                : status.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                : 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-300'
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-10 py-2.5 bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-lg shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSignUp}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>

        {/* Demo / Guest mode & DB Schema helper */}
        <div className="pt-2 border-t border-[#1e2f47] space-y-2 text-center">
          <button
            type="button"
            onClick={onDemoLogin}
            className="text-xs text-slate-400 hover:text-cyan-300 underline font-medium transition-colors"
          >
            Or explore app in Guest / Demo Mode
          </button>
          <div>
            <button
              type="button"
              onClick={onOpenSqlModal}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium transition-colors"
            >
              <Database className="w-3 h-3" /> View Supabase SQL Table Setup Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
