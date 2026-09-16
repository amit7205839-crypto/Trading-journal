import { useState } from 'react';
import { Copy, Check, X, Database, ExternalLink, ShieldCheck } from 'lucide-react';
import { SUPABASE_CONFIG, SUPABASE_SQL_SCHEMA } from '../lib/supabase';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SqlSetupModal({ isOpen, onClose }: SqlSetupModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b1728] border border-[#20334c] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#20334c] bg-[#0d1b2d]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Supabase Backend Schema & Setup</h3>
              <p className="text-xs text-slate-400">Project: {SUPABASE_CONFIG.projectName} ({SUPABASE_CONFIG.projectId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a2d45] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-300">
          <div className="bg-[#07111f] border border-[#1e2f47] p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Connected Supabase URL:</span>
              <span className="font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {SUPABASE_CONFIG.supabaseUrl}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Key Type:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Publishable Anon Key (Configured)
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1.5">Quick Setup in Supabase Dashboard (1 minute):</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 pl-1">
              <li>Open your Supabase project dashboard: <a href="https://supabase.com/dashboard/project/zsabrwibbgooyapighje" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">zsabrwibbgooyapighje <ExternalLink className="w-3 h-3" /></a></li>
              <li>Go to <b className="text-slate-200">SQL Editor</b> in the left sidebar</li>
              <li>Click <b className="text-slate-200">New Query</b>, paste the SQL below, and click <b className="text-emerald-400">Run</b></li>
              <li>This creates the <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">trades</code> table, Row Level Security, Realtime sync, and the <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">trade-photos</code> storage bucket.</li>
            </ol>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-300">PostgreSQL Schema & Security Rules:</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy SQL
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-[#060c16] border border-[#1e2f47] rounded-lg text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-56 leading-relaxed select-all">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#20334c] bg-[#0d1b2d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#20334c] hover:bg-[#2b4465] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
