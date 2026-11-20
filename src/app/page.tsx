'use client';

import { useState, useEffect } from 'react';
import { Profile, DailyQuest } from '@/lib/supabase';
import { getCurrentUserSession, AuthResponse } from './actions/authActions';
import { fetchDailyCheck } from './actions/gameActions'; // Load standard daily check helper
import AuthForm from '@/components/AuthForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyQuest, setDailyQuest] = useState<DailyQuest | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'warning' }[]>([]);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'ar' | 'en';
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    localStorage.setItem('lang', nextLang);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const loadSession = async () => {
    try {
      setSessionLoading(true);
      const res = await getCurrentUserSession();
      if (res.success && res.profile) {
        setProfile(res.profile);
        const quest = await fetchDailyCheck(res.profile.id);
        // Cast standard daily check to daily quest shape
        setDailyQuest({
          user_id: quest.user_id,
          last_login_claim: quest.last_check_in,
          matches_played_today: (quest as any).matches_played_today ?? 0,
        });
      } else {
        setProfile(null);
        setDailyQuest(null);
      }
    } catch (err: any) {
      console.error('Failed to load user session:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleAuthSuccess = async (response: AuthResponse) => {
    if (response.profile) {
      setProfile(response.profile);
      const quest = await fetchDailyCheck(response.profile.id);
      setDailyQuest({
        user_id: quest.user_id,
        last_login_claim: quest.last_check_in,
        matches_played_today: (quest as any).matches_played_today ?? 0,
      });
      addToast(response.message || 'تمت العملية بنجاح!', 'success');
    }
  };

  const handleLogout = () => {
    setProfile(null);
    setDailyQuest(null);
  };

  const handleUpdate = (updatedProfile: Profile, updatedQuest: DailyQuest) => {
    setProfile(updatedProfile);
    setDailyQuest(updatedQuest);
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19] text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">جاري تحميل البوابة البرمجية...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between relative transition-all duration-300">
      
      {/* Floating Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleLanguage}
          className="px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 active:scale-95 text-xs font-bold text-slate-300 rounded-xl transition-all cursor-pointer shadow-lg backdrop-blur flex items-center gap-1.5"
        >
          <span>{lang === 'ar' ? '🇬🇧 English' : '🇸🇦 العربية'}</span>
        </button>
      </div>

      {/* Toast notifications container */}
      <div className={`fixed bottom-5 z-50 flex flex-col gap-2 max-w-md ${lang === 'ar' ? 'right-5' : 'left-5'}`}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl shadow-2xl border text-sm font-semibold flex items-center gap-3 animate-slide-in ${
              t.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' 
                : t.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
                : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
            }`}
          >
            <span>{t.type === 'success' ? '🚀' : t.type === 'error' ? '🛡️' : '⚠️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {profile && dailyQuest ? (
        <Dashboard
          profile={profile}
          dailyQuest={dailyQuest}
          onUpdate={handleUpdate}
          onLogout={handleLogout}
          addToast={addToast}
          lang={lang}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <AuthForm onAuthSuccess={handleAuthSuccess} lang={lang} />
        </div>
      )}
      
      <footer className="py-6 border-t border-slate-900 bg-slate-950/30 text-center text-xs text-slate-500 font-mono">
        {lang === 'ar' 
          ? '© 2026 بوابة ألعاب ميثك • معمارية آمنة لحالة اللعبة' 
          : '© 2026 Mythic Games Portal • Secure Game-State Architecture'}
      </footer>
    </div>
  );
}
