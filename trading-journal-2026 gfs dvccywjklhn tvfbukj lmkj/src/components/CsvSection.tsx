import { useState, ChangeEvent } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { Trade } from '../types';

interface CsvSectionProps {
  trades: Trade[];
  onImportTrades: (batch: Partial<Trade>[]) => Promise<{ success: boolean; count: number; error?: string }>;
}

export function CsvSection({ trades, onImportTrades }: CsvSectionProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCsvFile(file);
    setStatusMessage(null);
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"' && inQuote && next === '"') {
        cell += '"';
        i++;
        continue;
      }
      if (c === '"') {
        inQuote = !inQuote;
        continue;
      }
      if (c === ',' && !inQuote) {
        row.push(cell);
        cell = '';
        continue;
      }
      if ((c === '\n' || c === '\r') && !inQuote) {
        if (c === '\r' && next === '\n') i++;
        row.push(cell);
        cell = '';
        if (row.some((x) => x.trim() !== '')) {
          rows.push(row);
        }
        row = [];
        continue;
      }
      cell += c;
    }
    if (cell !== '' || row.length > 0) {
      row.push(cell);
      if (row.some((x) => x.trim() !== '')) {
        rows.push(row);
      }
    }
    return rows;
  };

  const normalizeHeader = (s: string) =>
    String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

  const parseNumber = (val: unknown): number => {
    const clean = String(val ?? '')
      .replace(/[₹,%\s]/g, '')
      .replace(/,/g, '');
    const num = parseFloat(clean);
    return Number.isFinite(num) ? num : 0;
  };

  const handleImport = async () => {
    if (!csvFile) {
      setStatusMessage({ type: 'error', text: 'Please select a CSV file first.' });
      return;
    }

    setIsImporting(true);
    setStatusMessage({ type: 'info', text: 'Reading and validating CSV rows...' });

    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        setStatusMessage({ type: 'error', text: 'CSV file contains no data rows.' });
        setIsImporting(false);
        return;
      }

      const headers = rows[0].map(normalizeHeader);

      const findCol = (...aliases: string[]) => {
        for (const name of aliases) {
          const idx = headers.indexOf(normalizeHeader(name));
          if (idx >= 0) return idx;
        }
        return -1;
      };

      const I = {
        info: findCol('Info', 'Asset', 'Symbol', 'Pair'),
        profitpct: findCol('Profit', 'Profit %', 'Payout', 'Payout %'),
        id: findCol('ID', 'Trade ID', 'Ticket'),
        open: findCol('Open time', 'Open Time', 'Date', 'Time'),
        openp: findCol('Open Price', 'Open price', 'Strike Price'),
        close: findCol('Close Time', 'Close time'),
        closep: findCol('Close Price', 'Close price'),
        type: findCol('Type', 'Direction', 'Action'),
        amount: findCol('Amount', 'Stake', 'Investment'),
        income: findCol('Income', 'Payout Amount', 'Return'),
      };

      if (I.open < 0) {
        setStatusMessage({
          type: 'error',
          text: 'CSV header missing "Open time" column (required for trade date & time).',
        });
        setIsImporting(false);
        return;
      }

      const batch: Partial<Trade>[] = [];

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row.length) continue;

        const openTimeRaw = (row[I.open] || '').trim();
        const dateMatch = openTimeRaw.match(/(\d{4}-\d{2}-\d{2})/);
        const dateStr = dateMatch ? dateMatch[1] : '';

        const amount = parseNumber(row[I.amount]);
        const income = parseNumber(row[I.income]);
        const profit = income - amount;
        const profitPercent = parseNumber(row[I.profitpct]);

        let result: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
        if (profit > 0) result = 'WIN';
        else if (profit < 0) result = 'LOSS';

        const asset = (row[I.info] || '').trim() || 'Unknown Asset';
        const typeStr = (row[I.type] || '').trim();

        batch.push({
          date: dateStr || null,
          time: openTimeRaw.length >= 16 ? openTimeRaw.slice(11, 16) : null,
          asset,
          info: asset,
          external_id: (row[I.id] || '').trim(),
          open_time: openTimeRaw,
          open_price: parseNumber(row[I.openp]),
          close_time: (row[I.close] || '').trim(),
          close_price: parseNumber(row[I.closep]),
          type: typeStr,
          direction: typeStr.toUpperCase().includes('CALL') ? 'CALL' : typeStr.toUpperCase().includes('PUT') ? 'PUT' : typeStr,
          amount,
          stake: amount,
          income,
          profit,
          profit_percent: profitPercent,
          payout: profitPercent,
          result,
          expiry: '',
          strategy: 'CSV Import',
          strategy_note: '',
          mistake_note: '',
          notes: '',
        });
      }

      if (batch.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No valid trade rows found. Verify Open time contains dates formatted like YYYY-MM-DD.',
        });
        setIsImporting(false);
        return;
      }

      setStatusMessage({ type: 'info', text: `Syncing ${batch.length} trades with Supabase database...` });
      const res = await onImportTrades(batch);
      setIsImporting(false);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${res.count} trades into Supabase!`,
        });
        setCsvFile(null);
      } else {
        setStatusMessage({
          type: 'error',
          text: `Import failed: ${res.error || 'Check Supabase table schema or permissions.'}`,
        });
      }
    } catch (err: unknown) {
      setIsImporting(false);
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: `CSV Parse Error: ${msg}` });
    }
  };

  const escapeCsvCell = (v: unknown): string => {
    const s = String(v ?? '');
    return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    if (trades.length === 0) {
      alert('No trades available to export.');
      return;
    }

    const headers = [
      'Info',
      'Profit',
      'ID',
      'Open time',
      'Open Price',
      'Close Time',
      'Close Price',
      'Type',
      'Amount',
      'Income',
    ];

    let csvContent = headers.join(',') + '\n';

    trades.forEach((t) => {
      const row = [
        t.info || t.asset,
        t.profit_percent || t.payout || 0,
        t.external_id || '',
        t.open_time || `${t.date} ${t.time || ''}`,
        t.open_price || '',
        t.close_time || '',
        t.close_price || '',
        t.type || t.direction || '',
        t.amount || t.stake || 0,
        t.income || 0,
      ];
      csvContent += row.map(escapeCsvCell).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quotex-trading-journal-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto bg-[#0d1b2d] border border-[#20334c] rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-[#20334c] pb-4">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Quotex CSV Import & Export</h2>
          <p className="text-xs text-slate-400">
            Import your official Quotex trade export or download backup records for spreadsheet analysis
          </p>
        </div>
      </div>

      {/* Column specs */}
      <div className="bg-[#07111f] border border-[#1e2f47] p-4 rounded-lg text-xs space-y-2">
        <div className="font-semibold text-cyan-300">Supported Quotex Headers:</div>
        <div className="font-mono text-slate-300 text-[11px] flex flex-wrap gap-1.5">
          {['Info', 'Profit', 'ID', 'Open time', 'Open Price', 'Close Time', 'Close Price', 'Type', 'Amount', 'Income'].map(
            (h) => (
              <span key={h} className="bg-[#122339] border border-[#233852] px-2 py-0.5 rounded text-slate-200">
                {h}
              </span>
            )
          )}
        </div>
        <p className="text-slate-400 text-[11px] pt-1">
          • <b className="text-slate-300">Open time</b> is parsed as the primary timestamp for journal analysis and period filtering.
        </p>
      </div>

      {/* File Upload Box */}
      <div className="border-2 border-dashed border-[#283f5e] hover:border-cyan-500/80 rounded-xl p-6 text-center transition-colors bg-[#081424]">
        <input
          type="file"
          id="csvFileInput"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="csvFileInput"
          className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-slate-400 hover:text-white"
        >
          <Upload className="w-8 h-8 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">
            {csvFile ? csvFile.name : 'Click to select or drag & drop your Quotex .csv file'}
          </span>
          <span className="text-xs text-slate-500">Only .csv files up to 10MB</span>
        </label>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border border-rose-700/60 text-rose-300'
              : 'bg-cyan-950/60 border border-cyan-700/60 text-cyan-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleImport}
          disabled={!csvFile || isImporting}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-lg shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>{isImporting ? 'Importing...' : 'Import Quotex CSV into Supabase'}</span>
        </button>

        <button
          onClick={handleExport}
          className="px-5 py-2.5 bg-[#1b2b3f] hover:bg-[#253a54] text-slate-200 font-semibold text-xs sm:text-sm rounded-lg border border-[#2e4768] transition-all flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export All Trades ({trades.length}) as CSV</span>
        </button>
      </div>
    </div>
  );
}
