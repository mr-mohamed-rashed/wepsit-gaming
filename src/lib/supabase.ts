import { createClient } from '@supabase/supabase-js';

// Types corresponding to our PostgreSQL schema
export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  gold_coins: number;
  wins: number;
  losses: number;
  unlocked_emotes: string[];
}

export interface DailyQuest {
  user_id: string;
  last_login_claim: string; // ISO Date String
  matches_played_today: number;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Determine if we have real Supabase config
export const isRealSupabaseConfigured = 
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL !== 'YOUR_SUPABASE_URL';

export const supabaseClient = isRealSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
