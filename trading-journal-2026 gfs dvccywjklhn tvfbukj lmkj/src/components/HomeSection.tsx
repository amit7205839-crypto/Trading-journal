import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Trade } from '../types';

interface HomeSectionProps {
  trades: Trade[];
  periodLabel: string;
}

export function HomeSection({ trades, periodLabel }: HomeSectionProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  const total = trades.length;
  const wins = trades.filter((t) => t.result === 'WIN').length;
  const losses = trades.filter((t) => t.result === 'LOSS').length;
  const winRate = total ? (wins / total) * 100 : 0;
  const lossRate = total ? (losses / total) * 100 : 0;
  const totalPL = trades.reduce((acc, t) => acc + Number(t.profit || 0), 0);

  const formatMoney = (n: number) => {
    return (n >= 0 ? '+' : '') + '₹' + Number(n || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    // Sort trades chronologically
    const sorted = [...trades].sort((a, b) => {
      const timeA = String(a.open_time || a.date || '');
      const timeB = String(b.open_time || b.date || '');
      return timeA.localeCompare(timeB);
    });

    let cumulative = 0;
    const labels: string[] = [];
    const values: number[] = [];

    sorted.forEach((t, i) => {
      cumulative += Number(t.profit || 0);
      const label = t.open_time
        ? t.open_time.slice(5, 16)
        : t.date || `Trade #${i + 1}`;
      labels.push(label);
      values.push(cumulative);
    });

    if (labels.length === 0) {
      labels.push('No trades');
      values.push(0);
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Cumulative P/L (₹)',
            data: values,
            borderColor: totalPL >= 0 ? '#10b981' : '#f43f5e',
            backgroundColor: totalPL >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.25,
            pointRadius: values.length > 30 ? 1 : 3,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#94a3b8',
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` Total P/L: ₹${Number(context.parsed.y).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#64748b', maxTicksLimit: 8 },
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
          },
          y: {
            ticks: {
              color: '#64748b',
              callback: (value) => `₹${value}`,
            },
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [trades, totalPL]);

  return (
    <div className="space-y-4">
      {/* 5 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Trades */}
        <div className="bg-gradient-to-br from-[#0d1b2d] to-[#0b1728] border border-[#20334c] rounded-xl p-4 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold text-slate-400">Total Trades</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{total}</div>
          <div className="text-[11px] text-cyan-400 mt-1 font-medium">{periodLabel}</div>
        </div>

        {/* Wins */}
        <div className="bg-gradient-to-br from-[#0d1b2d] to-[#0b1728] border border-[#20334c] rounded-xl p-4 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold text-slate-400">Wins</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">{wins}</div>
          <div className="text-[11px] text-emerald-500 mt-1 font-medium">{winRate.toFixed(1)}% win rate</div>
        </div>

        {/* Losses */}
        <div className="bg-gradient-to-br from-[#0d1b2d] to-[#0b1728] border border-[#20334c] rounded-xl p-4 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold text-slate-400">Losses</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">{losses}</div>
          <div className="text-[11px] text-rose-400/80 mt-1 font-medium">{lossRate.toFixed(1)}% loss rate</div>
        </div>

        {/* Win Rate */}
        <div className="bg-gradient-to-br from-[#0d1b2d] to-[#0b1728] border border-[#20334c] rounded-xl p-4 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold text-slate-400">Win Rate</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 mt-2">{winRate.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Selected period</div>
        </div>

        {/* Total P/L */}
        <div className="bg-gradient-to-br from-[#0d1b2d] to-[#0b1728] border border-[#20334c] rounded-xl p-4 shadow-lg shadow-black/20 col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-slate-400">Total P/L</div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-2 ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatMoney(totalPL)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Net profit / loss</div>
        </div>
      </div>

      {/* P/L Trend Chart */}
      <div className="bg-gradient-to-br from-[#0d1b2d] to-[#0b1728] border border-[#20334c] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white">📈 Total P/L Trend</h2>
            <span className="text-xs bg-[#17273d] text-slate-300 px-2 py-0.5 rounded border border-[#2a405c]">
              {periodLabel}
            </span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-300">
            Current P/L: <span className={totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatMoney(totalPL)}</span>
          </div>
        </div>

        <div className="h-[320px] sm:h-[380px] w-full relative">
          <canvas ref={chartRef} id="homeTrendChart"></canvas>
        </div>
      </div>
    </div>
  );
}
