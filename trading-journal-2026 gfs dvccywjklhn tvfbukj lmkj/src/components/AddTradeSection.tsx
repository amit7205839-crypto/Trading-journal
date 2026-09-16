import { useState, ChangeEvent, FormEvent } from 'react';
import { PlusCircle, Image as ImageIcon, XCircle, CheckCircle, Calculator } from 'lucide-react';
import { Trade } from '../types';

interface AddTradeSectionProps {
  onSaveTrade: (trade: Partial<Trade>, photoFile: File | null) => Promise<boolean>;
  onCancel: () => void;
}

export function AddTradeSection({ onSaveTrade, onCancel }: AddTradeSectionProps) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  const openTimeFormatted = `${todayStr} ${now.toTimeString().slice(0, 8)}`;

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(timeStr);
  const [asset, setAsset] = useState('');
  const [externalId, setExternalId] = useState('');
  const [type, setType] = useState('Up');
  const [direction, setDirection] = useState('CALL');
  const [stake, setStake] = useState<string>('100');
  const [payout, setPayout] = useState<string>('93');
  const [income, setIncome] = useState<string>('193');
  const [openPrice, setOpenPrice] = useState<string>('');
  const [closePrice, setClosePrice] = useState<string>('');
  const [expiry, setExpiry] = useState('1 Minute');
  const [openTime, setOpenTime] = useState(openTimeFormatted);
  const [closeTime, setCloseTime] = useState('');
  const [result, setResult] = useState<'WIN' | 'LOSS' | 'DRAW'>('WIN');
  const [strategy, setStrategy] = useState('Price Action');
  const [strategyNote, setStrategyNote] = useState('');
  const [mistakeNote, setMistakeNote] = useState('');
  const [notes, setNotes] = useState('');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calculate Net P/L: Income - Stake
  const stakeNum = parseFloat(stake) || 0;
  const incomeNum = parseFloat(income) || 0;
  const netPL = incomeNum - stakeNum;

  // Auto calculate income when stake or payout changes if user hasn't typed manual income
  const handleStakeChange = (val: string) => {
    setStake(val);
    const s = parseFloat(val) || 0;
    const p = parseFloat(payout) || 0;
    if (result === 'WIN') {
      const inc = s + (s * p) / 100;
      setIncome(inc.toFixed(2));
    } else if (result === 'LOSS') {
      setIncome('0');
    }
  };

  const handlePayoutChange = (val: string) => {
    setPayout(val);
    const s = parseFloat(stake) || 0;
    const p = parseFloat(val) || 0;
    if (result === 'WIN') {
      const inc = s + (s * p) / 100;
      setIncome(inc.toFixed(2));
    }
  };

  const handleResultChange = (newResult: 'WIN' | 'LOSS' | 'DRAW') => {
    setResult(newResult);
    const s = parseFloat(stake) || 0;
    const p = parseFloat(payout) || 0;
    if (newResult === 'WIN') {
      const inc = s + (s * p) / 100;
      setIncome(inc.toFixed(2));
    } else if (newResult === 'LOSS') {
      setIncome('0');
    } else {
      setIncome(s.toString());
    }
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) {
      setFeedback({ type: 'error', message: 'Asset / Info is required (e.g., USD/BRL (OTC)).' });
      return;
    }
    const finalOpenTime = openTime.trim() || `${date} ${time}:00`;

    setIsSubmitting(true);
    setFeedback(null);

    const tradeData: Partial<Trade> = {
      date: date || null,
      time: time || null,
      asset: asset.trim(),
      info: asset.trim(),
      external_id: externalId.trim(),
      type,
      direction,
      amount: stakeNum,
      stake: stakeNum,
      payout: parseFloat(payout) || 0,
      profit_percent: parseFloat(payout) || 0,
      income: incomeNum,
      profit: netPL,
      open_price: parseFloat(openPrice) || 0,
      close_price: parseFloat(closePrice) || 0,
      expiry: expiry.trim(),
      open_time: finalOpenTime,
      close_time: closeTime.trim(),
      result,
      strategy,
      strategy_note: strategyNote.trim(),
      mistake_note: mistakeNote.trim(),
      notes: notes.trim(),
    };

    const success = await onSaveTrade(tradeData, photoFile);
    setIsSubmitting(false);

    if (success) {
      setFeedback({ type: 'success', message: 'Trade recorded successfully!' });
      // Reset form
      setAsset('');
      setExternalId('');
      setOpenPrice('');
      setClosePrice('');
      setCloseTime('');
      setStrategyNote('');
      setMistakeNote('');
      setNotes('');
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      setFeedback({ type: 'error', message: 'Failed to save trade. Check connection or schema.' });
    }
  };

  return (
    <div className="bg-[#0d1b2d] border border-[#20334c] rounded-xl p-4 sm:p-6 shadow-xl max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-[#20334c] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Add New Trade</h2>
            <p className="text-xs text-slate-400">Save binary option trades with full Quotex parameters and setup notes</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold mb-5 flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/50 border border-rose-800/50 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none"
            />
          </div>

          {/* Info / Asset */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Info / Asset <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. USD/BRL (OTC)"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              required
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-medium"
            />
          </div>

          {/* Trade ID */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Trade ID (Quotex)</label>
            <input
              type="text"
              placeholder="e.g. #9283719"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-mono"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none"
            >
              <option value="Up">Up</option>
              <option value="Down">Down</option>
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-bold"
            >
              <option value="CALL">CALL (Green)</option>
              <option value="PUT">PUT (Red)</option>
            </select>
          </div>

          {/* Amount / Stake */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Amount / Stake (₹)</label>
            <input
              type="number"
              step="any"
              value={stake}
              onChange={(e) => handleStakeChange(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-mono"
            />
          </div>

          {/* Profit (%) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Profit (%)</label>
            <input
              type="number"
              step="any"
              value={payout}
              onChange={(e) => handlePayoutChange(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-mono"
            />
          </div>

          {/* Income */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Income (₹)</label>
            <input
              type="number"
              step="any"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-mono"
            />
          </div>

          {/* Open Price */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Open Price</label>
            <input
              type="number"
              step="any"
              placeholder="0.18367"
              value={openPrice}
              onChange={(e) => setOpenPrice(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-mono"
            />
          </div>

          {/* Close Price */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Close Price</label>
            <input
              type="number"
              step="any"
              placeholder="0.18364"
              value={closePrice}
              onChange={(e) => setClosePrice(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-mono"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Expiry</label>
            <input
              type="text"
              placeholder="1 Minute / 5 Minutes"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none"
            />
          </div>

          {/* Open Time */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Open Time</label>
            <input
              type="text"
              placeholder="YYYY-MM-DD HH:MM:SS"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-mono"
            />
          </div>

          {/* Close Time */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Close Time</label>
            <input
              type="text"
              placeholder="YYYY-MM-DD HH:MM:SS"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none font-mono"
            />
          </div>

          {/* Result */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Result</label>
            <select
              value={result}
              onChange={(e) => handleResultChange(e.target.value as 'WIN' | 'LOSS' | 'DRAW')}
              className={`w-full bg-[#07111f] border text-xs sm:text-sm rounded-lg p-2.5 outline-none font-bold ${
                result === 'WIN'
                  ? 'text-emerald-400 border-emerald-600/60'
                  : result === 'LOSS'
                  ? 'text-rose-400 border-rose-600/60'
                  : 'text-amber-400 border-amber-600/60'
              }`}
            >
              <option value="WIN">WIN (Profit)</option>
              <option value="LOSS">LOSS (Loss)</option>
              <option value="DRAW">DRAW (Tie)</option>
            </select>
          </div>

          {/* Strategy */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none"
            >
              <option value="Price Action">Price Action</option>
              <option value="Support & Resistance">Support & Resistance</option>
              <option value="Trend">Trend Following</option>
              <option value="Breakout">Breakout</option>
              <option value="Indicators">Indicators (RSI/MACD)</option>
              <option value="Reversal">Candle Reversal</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Strategy Note & Mistake Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Strategy Note</label>
            <input
              type="text"
              placeholder="Setup details / reason for market entry"
              value={strategyNote}
              onChange={(e) => setStrategyNote(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Mistake / Lesson</label>
            <input
              type="text"
              placeholder="What went wrong or key lesson learned"
              value={mistakeNote}
              onChange={(e) => setMistakeNote(e.target.value)}
              className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none"
            />
          </div>
        </div>

        {/* Net P/L Display */}
        <div className="bg-[#07111f] border border-[#20334c] p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300">Net Calculated P/L (Income - Stake):</span>
          </div>
          <div className={`text-base font-extrabold font-mono ${netPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(netPL >= 0 ? '+' : '')}₹{netPL.toFixed(2)}
          </div>
        </div>

        {/* Screenshot Photo Upload */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Trade Screenshot / Chart Photo
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-[#07111f] hover:bg-[#122238] border border-[#30435c] hover:border-cyan-500 rounded-lg text-xs font-medium text-cyan-300 cursor-pointer transition-colors">
              <ImageIcon className="w-4 h-4" />
              <span>{photoFile ? 'Change Photo' : 'Select Chart Screenshot'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
            {photoFile && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-rose-400 hover:text-rose-300 underline"
              >
                Remove photo
              </button>
            )}
            <span className="text-xs text-slate-500">Stored in Supabase Storage (trade-photos)</span>
          </div>

          {photoPreview && (
            <div className="mt-3 relative inline-block rounded-lg overflow-hidden border border-[#20334c]">
              <img
                src={photoPreview}
                alt="Trade Preview"
                className="max-h-40 max-w-xs object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Additional Notes</label>
          <textarea
            rows={2}
            placeholder="Psychology, emotions, market conditions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#07111f] border border-[#30435c] focus:border-cyan-500 text-white text-xs sm:text-sm rounded-lg p-2.5 outline-none resize-y"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-[#20334c]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-lg shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving to Supabase...' : 'Save Trade'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-[#1e2f47] hover:bg-[#283e5c] text-slate-300 text-xs sm:text-sm font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
