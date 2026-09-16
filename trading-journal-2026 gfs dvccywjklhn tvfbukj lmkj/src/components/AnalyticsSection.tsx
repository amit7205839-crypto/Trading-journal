import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Trade } from '../types';

interface AnalyticsSectionProps {
  trades: Trade[];
}

export function AnalyticsSection({ trades }: AnalyticsSectionProps) {
  const topPieRef = useRef<HTMLCanvasElement | null>(null);
  const trendRef = useRef<HTMLCanvasElement | null>(null);
  const winBarsRef = useRef<HTMLCanvasElement | null>(null);
  const instrumentBarsRef = useRef<HTMLCanvasElement | null>(null);
  const distRef = useRef<HTMLCanvasElement | null>(null);

  const chartInstances = useRef<{ [key: string]: Chart }>({});

  const destroyChart = (key: string) => {
    if (chartInstances.current[key]) {
      chartInstances.current[key].destroy();
      delete chartInstances.current[key];
    }
  };

  // Calculations for insights
  const total = trades.length;
  const wins = trades.filter((t) => t.result === 'WIN').length;
  const winRate = total ? (wins / total) * 100 : 0;

  // Instrument grouping
  const instrumentMap: { [key: string]: { count: number; wins: number; profit: number } } = {};
  trades.forEach((t) => {
    const asset = t.info || t.asset || 'Unknown';
    if (!instrumentMap[asset]) {
      instrumentMap[asset] = { count: 0, wins: 0, profit: 0 };
    }
    instrumentMap[asset].count += 1;
    if (t.result === 'WIN') instrumentMap[asset].wins += 1;
    instrumentMap[asset].profit += Number(t.profit || 0);
  });

  const bestInstrumentEntry = Object.entries(instrumentMap).sort(
    (a, b) => b[1].profit - a[1].profit
  )[0];

  const sortedTrades = [...trades].sort((a, b) => Number(a.profit || 0) - Number(b.profit || 0));
  const worstTrade = sortedTrades[0];

  useEffect(() => {
    // 1. Top 5 Most Profitable Instruments (Doughnut)
    if (topPieRef.current) {
      destroyChart('topPie');
      const profitablePairs = Object.entries(instrumentMap)
        .filter(([, v]) => v.profit > 0)
        .sort((a, b) => b[1].profit - a[1].profit)
        .slice(0, 5);

      const labels = profitablePairs.length ? profitablePairs.map((x) => x[0]) : ['No profitable trades'];
      const data = profitablePairs.length ? profitablePairs.map((x) => x[1].profit) : [1];

      const ctx = topPieRef.current.getContext('2d');
      if (ctx) {
        chartInstances.current.topPie = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'right',
                labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 12 },
              },
            },
          },
        });
      }
    }

    // 2. Trend Line Chart
    if (trendRef.current) {
      destroyChart('trend');
      const sortedChronological = [...trades].sort((a, b) => {
        const timeA = String(a.open_time || a.date || '');
        const timeB = String(b.open_time || b.date || '');
        return timeA.localeCompare(timeB);
      });

      let cum = 0;
      const labels: string[] = [];
      const values: number[] = [];

      sortedChronological.forEach((t) => {
        cum += Number(t.profit || 0);
        labels.push((t.open_time || t.date || '').slice(5, 16));
        values.push(cum);
      });

      const ctx = trendRef.current.getContext('2d');
      if (ctx) {
        chartInstances.current.trend = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels.length ? labels : ['No trades'],
            datasets: [
              {
                label: 'Cumulative P/L (₹)',
                data: values.length ? values : [0],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                fill: true,
                tension: 0.3,
                pointRadius: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#cbd5e1', font: { size: 11 } } },
            },
            scales: {
              x: { ticks: { color: '#64748b', maxTicksLimit: 6 }, grid: { color: 'rgba(51, 65, 85, 0.3)' } },
              y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } },
            },
          },
        });
      }
    }

    // 3. Percentage % of profitable trades by instrument (Bar)
    if (winBarsRef.current) {
      destroyChart('winBars');
      const winRateList = Object.entries(instrumentMap)
        .map(([name, stat]) => ({
          name,
          rate: stat.count ? (stat.wins / stat.count) * 100 : 0,
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 7);

      const ctx = winBarsRef.current.getContext('2d');
      if (ctx) {
        chartInstances.current.winBars = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: winRateList.length ? winRateList.map((x) => x.name) : ['None'],
            datasets: [
              {
                label: 'Win Rate %',
                data: winRateList.length ? winRateList.map((x) => x.rate) : [0],
                backgroundColor: '#06b6d4',
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
              y: {
                min: 0,
                max: 100,
                ticks: { color: '#64748b', callback: (v) => `${v}%` },
                grid: { color: 'rgba(51, 65, 85, 0.3)' },
              },
            },
          },
        });
      }
    }

    // 4. Statistics P/L by Instruments (Bar)
    if (instrumentBarsRef.current) {
      destroyChart('instrumentBars');
      const plList = Object.entries(instrumentMap)
        .map(([name, stat]) => ({ name, profit: stat.profit }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 7);

      const ctx = instrumentBarsRef.current.getContext('2d');
      if (ctx) {
        chartInstances.current.instrumentBars = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: plList.length ? plList.map((x) => x.name) : ['None'],
            datasets: [
              {
                label: 'Net P/L (₹)',
                data: plList.length ? plList.map((x) => x.profit) : [0],
                backgroundColor: plList.map((x) => (x.profit >= 0 ? '#10b981' : '#f43f5e')),
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
              y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } },
            },
          },
        });
      }
    }

    // 5. Distribution of trades by instruments (Doughnut)
    if (distRef.current) {
      destroyChart('dist');
      const distList = Object.entries(instrumentMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      const ctx = distRef.current.getContext('2d');
      if (ctx) {
        chartInstances.current.dist = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: distList.length ? distList.map((x) => x[0]) : ['None'],
            datasets: [
              {
                data: distList.length ? distList.map((x) => x[1].count) : [1],
                backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'right',
                labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 12 },
              },
            },
          },
        });
      }
    }

    return () => {
      Object.keys(chartInstances.current).forEach((key) => destroyChart(key));
    };
  }, [trades]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Most Profitable */}
        <div className="bg-[#0d1b2d] border border-[#20334c] rounded-xl p-4 sm:p-5 shadow-xl">
          <h2 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
            <span>🏆 Top Most Profitable Instruments</span>
          </h2>
          <div className="h-[260px] relative">
            <canvas ref={topPieRef} id="analyticsTopPie"></canvas>
          </div>
        </div>

        {/* Profit & Loss Trend */}
        <div className="bg-[#0d1b2d] border border-[#20334c] rounded-xl p-4 sm:p-5 shadow-xl">
          <h2 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
            <span>📈 Profit & Loss Trend</span>
          </h2>
          <div className="h-[260px] relative">
            <canvas ref={trendRef} id="analyticsTrend"></canvas>
          </div>
        </div>

        {/* Win Rate by Instrument */}
        <div className="bg-[#0d1b2d] border border-[#20334c] rounded-xl p-4 sm:p-5 shadow-xl">
          <h2 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
            <span>🎯 Win Rate % by Instrument</span>
          </h2>
          <div className="h-[260px] relative">
            <canvas ref={winBarsRef} id="analyticsWinBars"></canvas>
          </div>
        </div>

        {/* P/L by Instrument */}
        <div className="bg-[#0d1b2d] border border-[#20334c] rounded-xl p-4 sm:p-5 shadow-xl">
          <h2 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
            <span>📊 Net P/L by Instruments (₹)</span>
          </h2>
          <div className="h-[260px] relative">
            <canvas ref={instrumentBarsRef} id="analyticsInstrumentBars"></canvas>
          </div>
        </div>

        {/* Trade Distribution */}
        <div className="bg-[#0d1b2d] border border-[#20334c] rounded-xl p-4 sm:p-5 shadow-xl">
          <h2 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
            <span>🥧 Distribution of Trades by Instruments</span>
          </h2>
          <div className="h-[260px] relative">
            <canvas ref={distRef} id="analyticsDistribution"></canvas>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-[#0d1b2d] border border-[#20334c] rounded-xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
            <span>💡 Performance Insights</span>
          </h2>

          <div className="space-y-3.5 text-xs text-slate-300">
            {/* Win Rate */}
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#07111f] border border-[#1e2f47]">
              <div className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center justify-center font-bold flex-shrink-0">
                %
              </div>
              <div>
                <span className="font-semibold text-white block">Win Rate Accuracy</span>
                <span>
                  {total > 0
                    ? `Your win rate is ${winRate.toFixed(1)}% across ${total} recorded trades.`
                    : 'Log trades to calculate your win-rate metrics.'}
                </span>
              </div>
            </div>

            {/* Best Instrument */}
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#07111f] border border-[#1e2f47]">
              <div className="w-7 h-7 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/50 flex items-center justify-center font-bold flex-shrink-0">
                ↑
              </div>
              <div>
                <span className="font-semibold text-white block">Best Performing Asset</span>
                <span>
                  {bestInstrumentEntry
                    ? `${bestInstrumentEntry[0]} (Profit: ₹${bestInstrumentEntry[1].profit.toFixed(2)}, ${bestInstrumentEntry[1].wins}/${bestInstrumentEntry[1].count} wins)`
                    : 'Your best instrument will appear here.'}
                </span>
              </div>
            </div>

            {/* Highest Loss */}
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#07111f] border border-[#1e2f47]">
              <div className="w-7 h-7 rounded-full bg-rose-950 text-rose-400 border border-rose-700/50 flex items-center justify-center font-bold flex-shrink-0">
                ↓
              </div>
              <div>
                <span className="font-semibold text-white block">Highest Single Loss</span>
                <span>
                  {worstTrade && Number(worstTrade.profit) < 0
                    ? `₹${Math.abs(Number(worstTrade.profit)).toFixed(2)} on ${worstTrade.info || worstTrade.asset}`
                    : 'No loss trades recorded yet.'}
                </span>
              </div>
            </div>

            {/* Strategy Discipline */}
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#07111f] border border-[#1e2f47]">
              <div className="w-7 h-7 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-700/50 flex items-center justify-center font-bold flex-shrink-0">
                i
              </div>
              <div>
                <span className="font-semibold text-white block">Discipline & Notes</span>
                <span>
                  Always record your mistake note and screenshot on losses to spot emotional or OTC volatility patterns.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
