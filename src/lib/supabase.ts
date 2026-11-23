import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

function sanitizeUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  let url = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!url || url === 'YOUR_SUPABASE_URL') return null;

  // If user pasted a JWT anon key into the URL field by mistake
  if (url.startsWith('eyJ')) return null;

  // If missing https:// prefix
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('supabase.co')) {
      url = `https://${url}`;
    } else {
      return null;
    }
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
  } catch {
    return null;
  }
  return null;
}

function sanitizeKey(rawKey: string | undefined): string | null {
  if (!rawKey) return null;
  const key = rawKey.trim().replace(/^["']|["']$/g, '');
  if (!key || key === 'YOUR_SUPABASE_ANON_KEY') return null;
  return key;
}

const cleanedUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const cleanedKey = sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const cleanedServiceRoleKey = sanitizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const isRealSupabaseConfigured = Boolean(cleanedUrl && cleanedKey);

export const supabaseClient: SupabaseClient | null = (() => {
  if (!cleanedUrl || !cleanedKey) return null;
  try {
    return createClient(cleanedUrl, cleanedKey);
  } catch (err) {
    console.warn('[Supabase] Initialization error:', err);
    return null;
  }
})();

export const supabaseAdmin: SupabaseClient | null = (() => {
  if (!cleanedUrl) return null;
  const keyToUse = cleanedServiceRoleKey || cleanedKey;
  if (!keyToUse) return null;
  try {
    return createClient(cleanedUrl, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('[Supabase Admin] Initialization error:', err);
    return null;
  }
})();
