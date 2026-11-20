'use client';

import { useState } from 'react';
import { claimDailyLogin, completeDailyMatchQuest, resetDailyQuestTime } from '@/app/actions/economyActions';
import { Profile, DailyQuest } from '@/lib/supabase';

interface DailyQuestsProps {
  profile: Profile;
  dailyQuest: DailyQuest;
  onUpdate: (updatedProfile: Profile, updatedQuest: DailyQuest) => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  lang?: 'ar' | 'en';
}

export default function DailyQuests({ profile, dailyQuest, onUpdate, addToast, lang = 'ar' }: DailyQuestsProps) {
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingQuest, setLoadingQuest] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // Helper to check if 24 hours passed since last claim
  const isLoginRewardAvailable = () => {
    const diff = Date.now() - new Date(dailyQuest.last_login_claim).getTime();
    return diff >= 24 * 60 * 60 * 1000;
  };

  const t = {
    ar: {
      questsTitle: '🎯 المهام اليومية للاقتصاد (Daily Quests)',
      loginRewardTitle: 'مكافأة تسجيل الدخول اليومي',
      loginRewardDesc: 'المطالبة بـ +50 عملة ذهبية مجاناً',
      claimLoginBtn: '🎁 استلام مكافأة تسجيل الدخول',
      claimedLoginBtn: '⏱️ تم الاستلام (متاحة كل 24 ساعة)',
      matchQuestTitle: 'مهمة لعب مباراة يومية',
      matchQuestDesc: 'العب مباراة للحصول على +30 عملة',
      progressLabel: 'التقدم',
      claimMatchBtn: '⚔️ محاكاة لعب مباراة واستلام المكافأة',
      claimedMatchBtn: '✅ تم إكمال المهمة واستلام الجائزة',
      devResetBtn: '🔄 إعادة تعيين المهام للتجربة مجدداً',
      resetting: 'جاري التعيين...',
      claimFailed: 'فشلت عملية المطالبة.',
      questFailed: 'فشل إكمال المهمة.',
      resetFailed: 'فشل التعيين.'
    },
    en: {
      questsTitle: '🎯 Economy Daily Quests',
      loginRewardTitle: 'Daily Login Reward',
      loginRewardDesc: 'Claim +50 gold coins for free',
      claimLoginBtn: '🎁 Claim Login Reward',
      claimedLoginBtn: '⏱️ Claimed (Available in 24h)',
      matchQuestTitle: 'Daily Match Quest',
      matchQuestDesc: 'Play a match to get +30 coins',
      progressLabel: 'Progress',
      claimMatchBtn: '⚔️ Simulate Match & Claim Reward',
      claimedMatchBtn: '✅ Quest Completed & Claimed',
      devResetBtn: '🔄 Reset Quests for Re-Testing',
      resetting: 'Resetting...',
      claimFailed: 'Claim failed.',
      questFailed: 'Failed to complete quest.',
      resetFailed: 'Reset failed.'
    }
  }[lang];

  const handleClaimLogin = async () => {
    setLoadingLogin(true);
    try {
      const res = await claimDailyLogin(profile.id);
      if (res.success && res.data) {
        addToast(res.message, 'success');
        const nextQuest = {
          ...dailyQuest,
          last_login_claim: new Date().toISOString(),
        };
        onUpdate(res.data, nextQuest);
      } else {
        addToast(res.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message || t.claimFailed, 'error');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleCompleteMatchQuest = async () => {
    setLoadingQuest(true);
    try {
      const res = await completeDailyMatchQuest(profile.id);
      if (res.success && res.data) {
        addToast(res.message, 'success');
        const nextQuest = {
          ...dailyQuest,
          matches_played_today: dailyQuest.matches_played_today + 1,
        };
        onUpdate(res.data, nextQuest);
      } else {
        addToast(res.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message || t.questFailed, 'error');
    } finally {
      setLoadingQuest(false);
    }
  };

  const handleForceReset = async () => {
    setLoadingReset(true);
    try {
      const res = await resetDailyQuestTime(profile.id);
      if (res.success) {
        addToast(res.message, 'success');
        const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
        const nextQuest = {
          user_id: profile.id,
          last_login_claim: yesterday,
          matches_played_today: 0,
        };
        onUpdate(profile, nextQuest);
      } else {
        addToast(res.message, 'error');
      }
    } catch (err: any) {
      addToast(err.message || t.resetFailed, 'error');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <section className="bg-white/[0.02] backdrop-blur-lg rounded-2xl p-6 border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.15)] space-y-6 relative overflow-hidden">
      {/* Subtle gold glow orb in background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] relative z-10">
        <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">🎯</span> {t.questsTitle}
      </h3>

      {/* Quest 1: Daily Login Claim */}
      <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.1)] relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-bold text-slate-200 text-sm">{t.loginRewardTitle}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{t.loginRewardDesc}</p>
          </div>
          <span className="text-xs text-amber-500 font-mono font-bold">50 🪙</span>
        </div>

        <button
          onClick={handleClaimLogin}
          disabled={!isLoginRewardAvailable() || loadingLogin}
          className={`w-full py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
            isLoginRewardAvailable()
              ? 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 active:scale-95 text-slate-950 border-transparent shadow-[0_0_15px_rgba(251,191,36,0.4)]'
              : 'bg-black/50 text-slate-500 border border-slate-700/50 cursor-not-allowed'
          }`}
        >
          {loadingLogin ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          ) : isLoginRewardAvailable() ? (
            t.claimLoginBtn
          ) : (
            t.claimedLoginBtn
          )}
        </button>
      </div>

      {/* Quest 2: Play 1 Match Quest */}
      <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.1)] relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-bold text-slate-200 text-sm">{t.matchQuestTitle}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{t.matchQuestDesc}</p>
          </div>
          <span className="text-xs text-amber-500 font-mono font-bold">30 🪙</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mt-3 mb-4">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{t.progressLabel}</span>
            <span>{dailyQuest.matches_played_today >= 1 ? '1 / 1' : '0 / 1'}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                dailyQuest.matches_played_today >= 1 ? 'w-full bg-emerald-500' : 'w-0'
              }`}
            ></div>
          </div>
        </div>

        <button
          onClick={handleCompleteMatchQuest}
          disabled={dailyQuest.matches_played_today >= 1 || loadingQuest}
          className={`w-full py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
            dailyQuest.matches_played_today < 1
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]'
              : 'bg-black/50 text-emerald-500 border border-emerald-500/30 cursor-not-allowed shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]'
          }`}
        >
          {loadingQuest ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : dailyQuest.matches_played_today >= 1 ? (
            t.claimedMatchBtn
          ) : (
            t.claimMatchBtn
          )}
        </button>
      </div>

      {/* Dev helper resets */}
      <div className="pt-2">
        <button
          onClick={handleForceReset}
          disabled={loadingReset}
          className="w-full py-2 bg-slate-800/40 hover:bg-slate-800 transition-all text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 flex items-center justify-center cursor-pointer"
        >
          {loadingReset ? t.resetting : t.devResetBtn}
        </button>
      </div>
    </section>
  );
}
