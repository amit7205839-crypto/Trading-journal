import { useState } from 'react';
import { Trash2, ExternalLink, Save, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { Trade, HistoryTab } from '../types';

interface HistorySectionProps {
  trades: Trade[];
  periodLabel: string;
  onUpdateNotes: (id: number | string, strategyNote: string, mistakeNote: string) => Promise<boolean>;
  onDeleteTrade: (id: number | string) => Promise<boolean>;
  onDeleteRange: () => Promise<void>;
  hasCustomFilter: boolean;
}

export function HistorySection({
  trades,
  periodLabel,
  onUpdateNotes,
  onDeleteTrade,
  onDeleteRange,
  hasCustomFilter,
}: HistorySectionProps) {
  const [tab, setTab] = useState<HistoryTab>('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editStrategy, setEditStrategy] = useState('');
  const [editMistake, setEditMistake] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  const totalPL = trades.reduce((acc, t) => acc + Number(t.profit || 0), 0);

  const formatMoney = (n: number) => {
    return (n >= 0 ? '+' : '') + '₹' + Number(n || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Find biggest profit and biggest loss trades
  const sortedByProfit = [...trades].sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0));
  const biggestProfitTrade = sortedByProfit[0] || null;
  const biggestLossTrade = sortedByProfit[sortedByProfit.length - 1] || null;

  const currentHighlight = tab === 'profit' ? biggestProfitTrade : tab === 'loss' ? biggestLossTrade : null;

  // Keep notes synchronized when tab or highlight trade changes
  const activeTradeForNotes = currentHighlight || selectedTrade;

  const handleTabChange = (newTab: HistoryTab) => {
    setTab(newTab);
    const target = newTab === 'profit' ? biggestProfitTrade : newTab === 'loss' ? biggestLossTrade : null;
    if (target) {
      setEditStrategy(target.strategy_note || '');
      setEditMistake(target.mistake_note || '');
    }
  };

  const handleSelectTradeForEdit = (t: Trade) => {
    setSelectedTrade(t);
    setEditStrategy(t.strategy_note || '');
    setEditMistake(t.mistake_note || '');
  };

  const handleSaveNotes = async () => {
    const targetId = activeTradeForNotes?.id;
    if (!targetId) return;
    setIsSavingNotes(true);
    const ok = await onUpdateNotes(targetId, editStrategy, editMistake);
    setIsSavingNotes(false);
    if (ok) {
      alert('Strategy notes updated in Supabase successfully.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Panel */}
      <div className="bg-[#0d1b2d] border border-[#20334c] rounded-xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Trade History & Audit</h2>
          </div>

          {/* Sub tabs */}
          <div className="flex items-center gap-1.5 bg-[#07111f] p-1 rounded-lg border border-[#20334c]">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === 'all'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-[#132338]'
              }`}
            >
              All Trades ({trades.length})
            </button>
            <button
              onClick={() => handleTabChange('profit')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                tab === 'profit'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-[#132338]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Biggest Profit
            </button>
            <button
              onClick={() => handleTabChange('loss')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                tab === 'loss'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-[#132338]'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Biggest Loss
            </button>
          </div>
        </div>

        {/* Tab 1: All Trades */}
        {tab === 'all' && (
          <div className="space-y-4">
            {/* Mini Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#091829] border border-[#20334c] p-3.5 rounded-lg">
                <div className="text-xs text-slate-400">Total Count</div>
                <div className="text-xl font-bold text-white mt-1">{trades.length} trades</div>
              </div>
              <div className="bg-[#091829] border border-[#20334c] p-3.5 rounded-lg">
                <div className="text-xs text-slate-400">Total Period P/L</div>
                <div className={`text-xl font-bold mt-1 ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatMoney(totalPL)}
                </div>
              </div>
              <div className="bg-[#091829] border border-[#20334c] p-3.5 rounded-lg">
                <div className="text-xs text-slate-400">Selected Filter Period</div>
                <div className="text-sm font-semibold text-cyan-300 mt-1">{periodLabel}</div>
              </div>
            </div>

            {/* Table */}
            {trades.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-[#07111f] rounded-lg border border-[#1e2f47]">
                No trades found for this period. Add a trade or import your Quotex CSV!
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#203047] rounded-lg">
                <table className="w-full text-left text-xs text-slate-300 min-w-[1100px]">
                  <thead className="bg-[#071424] text-slate-400 border-b border-[#203047] font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3">Asset / Info</th>
                      <th className="py-3 px-2">Payout %</th>
                      <th className="py-3 px-2">Trade ID</th>
                      <th className="py-3 px-3">Open Time</th>
                      <th className="py-3 px-2">Open Price</th>
                      <th className="py-3 px-2">Close Price</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Income</th>
                      <th className="py-3 px-3">Net P/L</th>
                      <th className="py-3 px-2">Result</th>
                      <th className="py-3 px-2">Photo</th>
                      <th className="py-3 px-3">Notes</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2f47] font-mono">
                    {trades.map((t, idx) => {
                      const net = Number(t.profit || 0);
                      const isWin = t.result === 'WIN';
                      const isLoss = t.result === 'LOSS';
                      return (
                        <tr
                          key={t.id || idx}
                          className="hover:bg-[#112338]/60 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-sans font-bold text-white whitespace-nowrap">
                            {t.info || t.asset}
                          </td>
                          <td className="py-2.5 px-2 text-slate-300">
                            {Number(t.profit_percent || t.payout || 0)}%
                          </td>
                          <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                            {t.external_id || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            {t.open_time || `${t.date} ${t.time || ''}`}
                          </td>
                          <td className="py-2.5 px-2 text-slate-400">
                            {t.open_price ? Number(t.open_price) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-slate-400">
                            {t.close_price ? Number(t.close_price) : '-'}
                          </td>
                          <td className="py-2.5 px-2 font-sans font-semibold">
                            <span className={t.type === 'Up' || t.direction === 'CALL' ? 'text-emerald-400' : 'text-rose-400'}>
                              {t.type || t.direction || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">
                            ₹{Number(t.amount || t.stake || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">
                            ₹{Number(t.income || 0).toFixed(2)}
                          </td>
                          <td className={`py-2.5 px-3 font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatMoney(net)}
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider ${
                                isWin
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                                  : isLoss
                                  ? 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                              }`}
                            >
                              {t.result}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            {t.photo_url || t.photo_path ? (
                              <button
                                onClick={() => setActivePhotoModal(t.photo_url || t.photo_path || null)}
                                className="text-cyan-400 hover:text-cyan-300 underline text-xs font-sans"
                              >
                                View
                              </button>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs truncate font-sans text-slate-400 text-xs" title={t.notes || t.strategy_note || ''}>
                            {t.strategy_note || t.notes || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => t.id && onDeleteTrade(t.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete trade"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Delete Range Action */}
            {hasCustomFilter && trades.length > 0 && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onDeleteRange}
                  className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Filtered Range Trades ({trades.length})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2 & 3: Biggest Profit or Biggest Loss Deep Dive */}
        {(tab === 'profit' || tab === 'loss') && (
          <div>
            {!currentHighlight ? (
              <div className="p-8 text-center text-slate-400">
                No trades available in the selected period.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#091829] border border-[#20334c] p-4 rounded-lg">
                    <div className="text-xs text-slate-400 font-semibold">
                      {tab === 'profit' ? 'Biggest Profit Trade' : 'Biggest Loss Trade'}
                    </div>
                    <div className={`text-2xl font-black mt-1 font-mono ${Number(currentHighlight.profit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatMoney(Number(currentHighlight.profit))}
                    </div>
                  </div>

                  <div className="bg-[#091829] border border-[#20334c] p-4 rounded-lg">
                    <div className="text-xs text-slate-400 font-semibold">Instrument / Asset</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {currentHighlight.info || currentHighlight.asset}
                    </div>
                  </div>

                  <div className="bg-[#091829] border border-[#20334c] p-4 rounded-lg">
                    <div className="text-xs text-slate-400 font-semibold">Open Time</div>
                    <div className="text-sm font-mono text-cyan-300 mt-1">
                      {currentHighlight.open_time || `${currentHighlight.date} ${currentHighlight.time || ''}`}
                    </div>
                  </div>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#091829] border border-[#20334c] p-3 rounded-lg">
                    <span className="text-slate-400 block">Result</span>
                    <b className={`font-bold text-sm ${currentHighlight.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currentHighlight.result}
                    </b>
                  </div>
                  <div className="bg-[#091829] border border-[#20334c] p-3 rounded-lg">
                    <span className="text-slate-400 block">Amount / Stake</span>
                    <b className="font-mono text-sm text-white">₹{Number(currentHighlight.amount || currentHighlight.stake || 0).toFixed(2)}</b>
                  </div>
                  <div className="bg-[#091829] border border-[#20334c] p-3 rounded-lg">
                    <span className="text-slate-400 block">Income</span>
                    <b className="font-mono text-sm text-white">₹{Number(currentHighlight.income || 0).toFixed(2)}</b>
                  </div>
                  <div className="bg-[#091829] border border-[#20334c] p-3 rounded-lg">
                    <span className="text-slate-400 block">Trade ID</span>
                    <b className="font-mono text-sm text-slate-300">{currentHighlight.external_id || '-'}</b>
                  </div>
                </div>

                {/* Strategy and Mistake Editor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Strategy / Setup Used</label>
                    <textarea
                      rows={4}
                      value={editStrategy}
                      onChange={(e) => setEditStrategy(e.target.value)}
                      placeholder="Write the entry reason, confluence, levels..."
                      className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 rounded-lg p-3 text-xs text-white outline-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mistake / Key Lesson</label>
                    <textarea
                      rows={4}
                      value={editMistake}
                      onChange={(e) => setEditMistake(e.target.value)}
                      placeholder="What caused the loss, early entry, greed, overtrading..."
                      className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 rounded-lg p-3 text-xs text-white outline-none"
                    ></textarea>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes to Supabase'}</span>
                  </button>

                  {(currentHighlight.photo_url || currentHighlight.photo_path) && (
                    <button
                      onClick={() => setActivePhotoModal(currentHighlight.photo_url || currentHighlight.photo_path || null)}
                      className="px-4 py-2 bg-[#1e2f47] hover:bg-[#283e5c] text-cyan-300 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Screenshot</span>
                    </button>
                  )}

                  <button
                    onClick={() => currentHighlight.id && onDeleteTrade(currentHighlight.id)}
                    className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Trade</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0b1728] border border-[#20334c] rounded-xl max-w-3xl w-full p-4 relative">
            <div className="flex justify-between items-center pb-2 border-b border-[#20334c] mb-3">
              <span className="text-xs font-semibold text-slate-300">Trade Screenshot</span>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-[#1c2e47]"
              >
                Close (ESC)
              </button>
            </div>
            <div className="flex items-center justify-center max-h-[70vh] overflow-hidden rounded-lg bg-black">
              <img
                src={activePhotoModal}
                alt="Trade Screenshot Full"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
