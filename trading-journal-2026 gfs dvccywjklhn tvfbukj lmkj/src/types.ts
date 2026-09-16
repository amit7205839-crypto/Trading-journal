export interface Trade {
  id?: number | string;
  user_id?: string;
  date: string | null;
  time: string | null;
  asset: string;
  info?: string;
  external_id?: string;
  type: string; // 'Up' | 'Down'
  direction: string; // 'CALL' | 'PUT'
  amount: number;
  stake?: number;
  payout: number;
  profit_percent?: number;
  income: number;
  profit: number;
  open_price: number;
  close_price: number;
  expiry: string;
  open_time: string;
  close_time: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  strategy: string;
  strategy_note: string;
  mistake_note: string;
  notes: string;
  photo_path?: string | null;
  photo_url?: string | null;
  created_at?: string;
}

export type PeriodType = 'month' | 'day' | 'week' | 'custom' | 'all';
export type HistoryTab = 'all' | 'profit' | 'loss';

export interface AppConfig {
  projectName: string;
  projectId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  photoBucket: string;
}
