import { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, PlusSquare, FileText, PieChart, FileSpreadsheet, AlertCircle, Database } from 'lucide-react';
import { Trade, PeriodType } from './types';
import { supabase, SUPABASE_CONFIG, getPhotoUrl } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { HomeSection } from './components/HomeSection';
import { AddTradeSection } from './components/AddTradeSection';
import { HistorySection } from './components/HistorySection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { CsvSection } from './components/CsvSection';
import { AuthGate } from './components/AuthGate';
import { SqlSetupModal } from './components/SqlSetupModal';

const DEMO_TRADES: Trade[] = [
  {
    id: 1,
    asset: 'USD/BRL (OTC)',
    info: 'USD/BRL (OTC)',
    external_id: '#9482103',
    date: '2026-09-14',
    time: '14:20',
    open_time: '2026-09-14 14:20:10',
    close_time: '2026-09-14 14:21:10',
    type: 'Up',
    direction: 'CALL',
    amount: 1000,
    stake: 1000,
    payout: 92,
    profit_percent: 92,
    income: 1920,
    profit: 920,
    open_price: 5.4821,
    close_price: 5.4839,
    expiry: '1 Minute',
    result: 'WIN',
    strategy: 'Price Action',
    strategy_note: 'Strong support rejection with bullish pin bar at key level.',
    mistake_note: 'Waited patiently for candle close confirmation.',
    notes: 'Good execution and discipline.',
  },
  {
    id: 2,
    asset: 'EUR/USD (OTC)',
    info: 'EUR/USD (OTC)',
    external_id: '#9482188',
    date: '2026-09-15',
    time: '16:05',
    open_time: '2026-09-15 16:05:00',
    close_time: '2026-09-15 16:06:00',
    type: 'Down',
    direction: 'PUT',
    amount: 500,
    stake: 500,
    payout: 90,
    profit_percent: 90,
    income: 950,
    profit: 450,
    open_price: 1.0845,
    close_price: 1.0831,
    expiry: '1 Minute',
    result: 'WIN',
    strategy: 'Trend',
    strategy_note: 'Lower high break in downward trend channel.',
    mistake_note: 'None, followed plan.',
    notes: 'Perfect entry on pullback.',
  },
  {
    id: 3,
    asset: 'GBP/USD (OTC)',
    info: 'GBP/USD (OTC)',
    external_id: '#9482250',
    date: '2026-09-16',
    time: '11:10',
    open_time: '2026-09-16 11:10:30',
    close_time: '2026-09-16 11:11:30',
    type: 'Up',
    direction: 'CALL',
    amount: 600,
    stake: 600,
    payout: 88,
    profit_percent: 88,
    income: 0,
    profit: -600,
    open_price: 1.293,
    close_price: 1.2924,
    expiry: '1 Minute',
    result: 'LOSS',
    strategy: 'Breakout',
    strategy_note: 'Attempted false breakout trade against heavy momentum.',
    mistake_note: 'Over-eager, entered before confirmation. Avoid entering OTC spikes.',
    notes: 'Need to strictly wait for candle closing confirmation next time.',
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeSection, setActiveSection] = useState<'home' | 'add' | 'history' | 'analytics' | 'csv'>('home');
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10));
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [tableWarning, setTableWarning] = useState<string | null>(null);

  // Check auth session
  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || 'Trader',
          });
          setIsDemoUser(false);
        }
      } catch (err) {
        console.error('Failed to get session:', err);
      }
    }

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email || 'Trader',
        });
        setIsDemoUser(false);
      } else if (!isDemoUser) {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isDemoUser]);

  // Load trades from Supabase or localStorage
  const loadTrades = useCallback(async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;

    if (isDemoUser) {
      const local = localStorage.getItem('demo_trades');
      if (local) {
        try {
          setTrades(JSON.parse(local));
          return;
        } catch {
          // fallback
        }
      }
      setTrades(DEMO_TRADES);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('open_time', { ascending: true });

      if (error) {
        console.warn('Supabase load error:', error);
        if (error.message.includes('relation "public.trades" does not exist') || error.code === '42P01') {
          setTableWarning(
            'The "trades" table has not been created yet in your Supabase project. Click the button to view and run the SQL setup script in Supabase SQL Editor.'
          );
        }
        // Fallback to local storage cache if available
        const cached = localStorage.getItem(`cached_trades_${uid}`);
        if (cached) {
          try {
            setTrades(JSON.parse(cached));
          } catch {
            setTrades([]);
          }
        }
        return;
      }

      setTableWarning(null);

      // Hydrate signed photo URLs for trades
      const list = data || [];
      const hydrated = await Promise.all(
        list.map(async (t) => {
          let photoUrl = t.photo_url || '';
          if (t.photo_path && !photoUrl) {
            photoUrl = await getPhotoUrl(t.photo_path);
          }
          return {
            ...t,
            photo_url: photoUrl,
          };
        })
      );

      setTrades(hydrated);
      localStorage.setItem(`cached_trades_${uid}`, JSON.stringify(hydrated));
    } catch (err: unknown) {
      console.error('Error fetching trades:', err);
    }
  }, [currentUser?.id, isDemoUser]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!currentUser || isDemoUser) return;

    loadTrades(currentUser.id);

    const channel = supabase
      .channel(`trades-sync-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          loadTrades(currentUser.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, isDemoUser, loadTrades]);

  // Date parsing helper
  const getTradeDate = (t: Trade): string => {
    const raw = String(t.open_time || '').trim();
    const m = raw.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = String(t.date || '').trim().match(/(\d{4}-\d{2}-\d{2})/);
    return d ? d[1] : '';
  };

  // Filtered trades by period
  const filteredTrades = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thisMonthPrefix = today.slice(0, 7);

    return trades.filter((t) => {
      const d = getTradeDate(t);
      if (!d) return false;

      if (period === 'all') return true;

      if (period === 'custom') {
        return (!customFrom || d >= customFrom) && (!customTo || d <= customTo);
      }

      if (period === 'day') {
        return d === today;
      }

      if (period === 'week') {
        const tradeDate = new Date(d + 'T00:00:00');
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(today + 'T23:59:59');
        return tradeDate >= start && tradeDate <= end;
      }

      // Default: 'month'
      return d.slice(0, 7) === thisMonthPrefix;
    });
  }, [trades, period, customFrom, customTo]);

  const periodLabel = useMemo(() => {
    if (period === 'custom') return `${customFrom} → ${customTo}`;
    if (period === 'all') return 'All Time';
    if (period === 'day') return 'Today';
    if (period === 'week') return 'This Week';
    return 'This Month';
  }, [period, customFrom, customTo]);

  // Actions
  const handleSaveTrade = async (tradeData: Partial<Trade>, photoFile: File | null): Promise<boolean> => {
    if (!currentUser) return false;

    let photoPath: string | null = null;
    let photoDataUrl: string | null = null;

    if (photoFile) {
      if (isDemoUser) {
        // In demo mode, convert to data URL
        photoDataUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(photoFile);
        });
      } else {
        try {
          const safeName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `${currentUser.id}/${Date.now()}-${safeName}`;
          const { error: uploadErr } = await supabase.storage
            .from(SUPABASE_CONFIG.photoBucket)
            .upload(path, photoFile, { upsert: false });

          if (!uploadErr) {
            photoPath = path;
          } else {
            console.warn('Storage upload error, using local fallback:', uploadErr);
            // Fallback to data URL so screenshot is retained
            photoDataUrl = await new Promise((res) => {
              const r = new FileReader();
              r.onload = () => res(r.result as string);
              r.readAsDataURL(photoFile);
            });
          }
        } catch (e) {
          console.warn('Photo processing exception:', e);
        }
      }
    }

    const newRow = {
      ...tradeData,
      user_id: currentUser.id,
      photo_path: photoPath,
      photo_url: photoDataUrl,
    };

    if (isDemoUser) {
      const updated = [...trades, { ...newRow, id: Date.now() } as Trade];
      setTrades(updated);
      localStorage.setItem('demo_trades', JSON.stringify(updated));
      return true;
    }

    const { data, error } = await supabase.from('trades').insert(newRow).select().single();

    if (error) {
      console.error('Error inserting trade into Supabase:', error);
      // If table doesn't exist, store in local cache
      const updated = [...trades, { ...newRow, id: Date.now() } as Trade];
      setTrades(updated);
      localStorage.setItem(`cached_trades_${currentUser.id}`, JSON.stringify(updated));
      if (error.message.includes('relation "public.trades" does not exist')) {
        setTableWarning(
          'Trade saved locally, but your Supabase table "trades" is not yet created. Run the SQL setup script to enable cloud sync!'
        );
      }
      return true;
    }

    if (data) {
      const withPhoto = {
        ...data,
        photo_url: photoDataUrl || (photoPath ? await getPhotoUrl(photoPath) : null),
      };
      setTrades((prev) => [...prev, withPhoto]);
    }
    return true;
  };

  const handleUpdateNotes = async (id: number | string, strategyNote: string, mistakeNote: string): Promise<boolean> => {
    if (isDemoUser) {
      const updated = trades.map((t) =>
        t.id === id ? { ...t, strategy_note: strategyNote, mistake_note: mistakeNote } : t
      );
      setTrades(updated);
      localStorage.setItem('demo_trades', JSON.stringify(updated));
      return true;
    }

    const { error } = await supabase
      .from('trades')
      .update({ strategy_note: strategyNote, mistake_note: mistakeNote })
      .eq('id', id)
      .eq('user_id', currentUser?.id);

    if (error) {
      console.error('Update error:', error);
      // optimistic update
      setTrades((prev) =>
        prev.map((t) => (t.id === id ? { ...t, strategy_note: strategyNote, mistake_note: mistakeNote } : t))
      );
      return true;
    }

    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, strategy_note: strategyNote, mistake_note: mistakeNote } : t))
    );
    return true;
  };

  const handleDeleteTrade = async (id: number | string): Promise<boolean> => {
    if (!confirm('Are you sure you want to delete this trade?')) return false;

    const target = trades.find((x) => x.id === id);

    if (isDemoUser) {
      const updated = trades.filter((t) => t.id !== id);
      setTrades(updated);
      localStorage.setItem('demo_trades', JSON.stringify(updated));
      return true;
    }

    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser?.id);

    if (error) {
      console.error('Delete error:', error);
      setTrades((prev) => prev.filter((t) => t.id !== id));
      return true;
    }

    if (target?.photo_path) {
      try {
        await supabase.storage.from(SUPABASE_CONFIG.photoBucket).remove([target.photo_path]);
      } catch (err) {
        console.warn('Could not remove photo from storage bucket:', err);
      }
    }

    setTrades((prev) => prev.filter((t) => t.id !== id));
    return true;
  };

  const handleDeleteRange = async () => {
    if (!confirm(`Delete all ${filteredTrades.length} trades in this period? This cannot be undone.`)) return;

    const ids = filteredTrades.map((t) => t.id).filter(Boolean);
    if (!ids.length) return;

    if (isDemoUser) {
      const updated = trades.filter((t) => !ids.includes(t.id));
      setTrades(updated);
      localStorage.setItem('demo_trades', JSON.stringify(updated));
      alert(`Deleted ${ids.length} trade(s).`);
      return;
    }

    const { error } = await supabase
      .from('trades')
      .delete()
      .in('id', ids)
      .eq('user_id', currentUser?.id);

    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }

    setTrades((prev) => prev.filter((t) => !ids.includes(t.id)));
    alert(`Deleted ${ids.length} trade(s) from Supabase.`);
  };

  const handleImportTrades = async (batch: Partial<Trade>[]) => {
    if (!currentUser) return { success: false, count: 0, error: 'User not authenticated' };

    const withUserId = batch.map((item) => ({
      ...item,
      user_id: currentUser.id,
    }));

    if (isDemoUser) {
      const updated = [
        ...trades,
        ...withUserId.map((item, i) => ({ ...item, id: Date.now() + i } as Trade)),
      ];
      setTrades(updated);
      localStorage.setItem('demo_trades', JSON.stringify(updated));
      return { success: true, count: batch.length };
    }

    const { error } = await supabase.from('trades').insert(withUserId);

    if (error) {
      console.error('Batch import error:', error);
      if (error.message.includes('relation "public.trades" does not exist')) {
        setTableWarning('Database table not created yet. Please run the SQL setup script.');
      }
      return { success: false, count: 0, error: error.message };
    }

    await loadTrades(currentUser.id);
    return { success: true, count: batch.length };
  };

  const handleDemoLogin = () => {
    setCurrentUser({
      id: 'demo-user-12345',
      email: 'demo-trader@trading-journal2026.com',
    });
    setIsDemoUser(true);
  };

  const handleSignOut = async () => {
    if (!isDemoUser) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setIsDemoUser(false);
    setTrades([]);
  };

  if (!currentUser) {
    return (
      <>
        <AuthGate
          onDemoLogin={handleDemoLogin}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
        />
        <SqlSetupModal
          isOpen={isSqlModalOpen}
          onClose={() => setIsSqlModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pt-3 pb-24 sm:pb-16 space-y-4">
        {/* Top Navbar */}
        <Navbar
          period={period}
          onPeriodChange={setPeriod}
          userEmail={currentUser.email}
          onSignOut={handleSignOut}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
        />

        {/* Missing Table / DB Notice */}
        {tableWarning && (
          <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>{tableWarning}</span>
            </div>
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Open SQL Setup Script</span>
            </button>
          </div>
        )}

        {/* Custom Period Drawer */}
        {period === 'custom' && (
          <div className="bg-[#0b1728] border border-[#20334c] p-3 sm:p-4 rounded-xl flex flex-wrap items-end gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">From Date</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-[#07111f] border border-[#30435c] text-white rounded-lg px-3 py-1.5 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">To Date</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-[#07111f] border border-[#30435c] text-white rounded-lg px-3 py-1.5 outline-none"
              />
            </div>
            <div className="text-[11px] text-slate-400 pb-1.5">
              Filtered trades: <b className="text-cyan-400">{filteredTrades.length}</b> matches between {customFrom} and {customTo}
            </div>
          </div>
        )}

        {/* Desktop Navigation Tabs */}
        <nav className="hidden sm:flex items-center gap-2 border-b border-[#213047] pb-2">
          <button
            onClick={() => setActiveSection('home')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSection === 'home'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1c2e]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveSection('add')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSection === 'add'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1c2e]'
            }`}
          >
            <PlusSquare className="w-4 h-4" />
            <span>Add Trade</span>
          </button>

          <button
            onClick={() => setActiveSection('history')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSection === 'history'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1c2e]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>History ({filteredTrades.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSection === 'analytics'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1c2e]'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveSection('csv')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSection === 'csv'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1c2e]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Quotex CSV</span>
          </button>
        </nav>

        {/* Main Content Areas */}
        <main className="transition-all">
          {activeSection === 'home' && (
            <HomeSection trades={filteredTrades} periodLabel={periodLabel} />
          )}

          {activeSection === 'add' && (
            <AddTradeSection
              onSaveTrade={handleSaveTrade}
              onCancel={() => setActiveSection('home')}
            />
          )}

          {activeSection === 'history' && (
            <HistorySection
              trades={filteredTrades}
              periodLabel={periodLabel}
              onUpdateNotes={handleUpdateNotes}
              onDeleteTrade={handleDeleteTrade}
              onDeleteRange={handleDeleteRange}
              hasCustomFilter={period === 'custom'}
            />
          )}

          {activeSection === 'analytics' && (
            <AnalyticsSection trades={filteredTrades} />
          )}

          {activeSection === 'csv' && (
            <CsvSection
              trades={filteredTrades}
              onImportTrades={handleImportTrades}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#071322] border-t border-[#1e2f47] px-2 py-2 flex items-center justify-around">
          <button
            onClick={() => setActiveSection('home')}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeSection === 'home' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveSection('add')}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeSection === 'add' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <PlusSquare className="w-4 h-4" />
            <span>Add</span>
          </button>

          <button
            onClick={() => setActiveSection('history')}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeSection === 'history' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeSection === 'analytics' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveSection('csv')}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
              activeSection === 'csv' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>

        {/* Supabase SQL Setup Modal */}
        <SqlSetupModal
          isOpen={isSqlModalOpen}
          onClose={() => setIsSqlModalOpen(false)}
        />
      </div>
    </div>
  );
}
