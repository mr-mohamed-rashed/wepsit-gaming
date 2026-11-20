import { isRealSupabaseConfigured, supabaseClient, Profile, DailyQuest } from './supabase';

const DEFAULT_PROFILE = (userId: string, username = 'GamerPro_99'): Profile => ({
  id: userId,
  username,
  avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
  gold_coins: 100,
  wins: 5,
  losses: 3,
  unlocked_emotes: [],
});

const DEFAULT_DAILY_QUEST = (userId: string): DailyQuest => ({
  user_id: userId,
  last_login_claim: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  matches_played_today: 0,
});

// In-memory fallback for server prerender
const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return memoryStore.get(key) || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  } else {
    memoryStore.set(key, value);
  }
}

function removeStorageItem(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

// Load current active user ID from session storage
export async function getActiveUserId(): Promise<string> {
  const session = getStorageItem('active_user_session');
  return session || 'mock-gamer-uuid-12345';
}

export async function setActiveUserId(userId: string): Promise<void> {
  setStorageItem('active_user_session', userId);
}

export async function clearActiveUserId(): Promise<void> {
  removeStorageItem('active_user_session');
}

export async function getMockDb(userId: string) {
  const profileKey = `mock_profile_${userId}`;
  const questKey = `mock_quest_${userId}`;

  const profileRaw = getStorageItem(profileKey);
  const questRaw = getStorageItem(questKey);

  const profile: Profile = profileRaw 
    ? JSON.parse(profileRaw) 
    : DEFAULT_PROFILE(userId);

  const dailyQuest: DailyQuest = questRaw 
    ? JSON.parse(questRaw) 
    : DEFAULT_DAILY_QUEST(userId);

  return { profile, dailyQuest };
}

export async function saveMockDb(profile: Profile, dailyQuest: DailyQuest) {
  const profileKey = `mock_profile_${profile.id}`;
  const questKey = `mock_quest_${profile.id}`;

  setStorageItem(profileKey, JSON.stringify(profile));
  setStorageItem(questKey, JSON.stringify(dailyQuest));
}

// Unified database methods
export async function getProfile(userId: string): Promise<Profile> {
  if (isRealSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  } else {
    const { profile } = await getMockDb(userId);
    return profile;
  }
}

export async function getDailyQuest(userId: string): Promise<DailyQuest> {
  if (isRealSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('daily_quests')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw new Error(error.message);
    return data as DailyQuest;
  } else {
    const { dailyQuest } = await getMockDb(userId);
    return dailyQuest;
  }
}

export async function updateProfile(profile: Profile): Promise<void> {
  if (isRealSupabaseConfigured && supabaseClient) {
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        gold_coins: profile.gold_coins,
        wins: profile.wins,
        losses: profile.losses,
        unlocked_emotes: profile.unlocked_emotes,
      })
      .eq('id', profile.id);
    if (error) throw new Error(error.message);
  } else {
    const db = await getMockDb(profile.id);
    await saveMockDb(profile, db.dailyQuest);
  }
}

export async function updateDailyQuest(dailyQuest: DailyQuest): Promise<void> {
  if (isRealSupabaseConfigured && supabaseClient) {
    const { error } = await supabaseClient
      .from('daily_quests')
      .upsert({
        user_id: dailyQuest.user_id,
        last_login_claim: dailyQuest.last_login_claim,
        matches_played_today: dailyQuest.matches_played_today,
      });
    if (error) throw new Error(error.message);
  } else {
    const db = await getMockDb(dailyQuest.user_id);
    await saveMockDb(db.profile, dailyQuest);
  }
}
