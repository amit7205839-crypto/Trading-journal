import { TrendingUp, Database, LogOut, SunMoon } from 'lucide-react';
import { PeriodType } from '../types';

interface NavbarProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  userEmail: string | null;
  onSignOut: () => void;
  onOpenSqlModal: () => void;
}

export function Navbar({
  period,
  onPeriodChange,
  userEmail,
  onSignOut,
  onOpenSqlModal,
}: NavbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#213047] pb-4 pt-1">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-xl">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
            Trading Journal
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-400">Quotex / Binary Options</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] text-slate-400 font-mono">Supabase Sync</span>
          </div>
        </div>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Period Selector */}
        <div className="relative">
          <select
            id="periodSelect"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as PeriodType)}
            className="bg-[#0c1b2e] border border-[#29415f] hover:border-cyan-500 text-white rounded-full px-4 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer shadow-sm"
          >
            <option value="month">This Month</option>
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="custom">Custom Date</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Database Config Modal Trigger */}
        <button
          onClick={onOpenSqlModal}
          title="Supabase Database Setup & Schema"
          className="flex items-center gap-1.5 bg-[#0c1b2e] border border-[#29415f] hover:border-emerald-500 text-emerald-400 rounded-full px-3 py-2 text-xs font-medium transition-all"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Supabase DB</span>
        </button>

        {/* Theme Toggle (subtle contrast toggle) */}
        <button
          onClick={() => document.body.classList.toggle('dim')}
          title="Toggle Screen Dim"
          className="w-9 h-9 rounded-full bg-[#0c1b2e] border border-[#29415f] hover:border-slate-400 text-slate-300 flex items-center justify-center transition-all"
        >
          <SunMoon className="w-4 h-4" />
        </button>

        {/* User profile & Logout */}
        {userEmail && (
          <div className="flex items-center gap-2 pl-1">
            <span className="hidden md:inline-block text-xs text-slate-400 max-w-[140px] truncate" title={userEmail}>
              {userEmail}
            </span>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 bg-[#1a293d] hover:bg-rose-950/40 hover:text-rose-400 border border-[#26364b] hover:border-rose-700/50 text-slate-300 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
