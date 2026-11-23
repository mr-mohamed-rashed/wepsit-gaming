'use client';

import { useState } from 'react';
import { Profile } from '@/lib/supabase';

export interface GameTableOption {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  flag: string;
  entryFee: number;
  prizeAmount: number;
  badge: string;
  bgGradient: string;
  cueReward?: string;
}

export const GAME_TABLES: GameTableOption[] = [
  {
    id: 'cairo',
    nameAr: 'طاولة القاهرة (مبتدئين)',
    nameEn: 'Cairo Arena',
    city: 'القاهرة',
    flag: '🇪🇬',
    entryFee: 50,
    prizeAmount: 95,
    badge: '🥉',
    bgGradient: 'from-amber-600/30 to-yellow-950/60 border-amber-500/40',
    cueReward: 'عصا خشبية قياسية'
  },
  {
    id: 'alex',
    nameAr: 'طاولة الإسكندرية (هواة)',
    nameEn: 'Alexandria Shore',
    city: 'الإسكندرية',
    flag: '🇪🇬',
    entryFee: 100,
    prizeAmount: 190,
    badge: '🥈',
    bgGradient: 'from-blue-600/30 to-cyan-950/60 border-cyan-500/40',
    cueReward: 'عصا البحر الأزرق'
  },
  {
    id: 'dubai',
    nameAr: 'طاولة دبي (محترفين)',
    nameEn: 'Dubai Towers',
    city: 'دبي',
    flag: '🇦🇪',
    entryFee: 50,
    prizeAmount: 950,
    badge: '🥇',
    bgGradient: 'from-emerald-600/30 to-teal-950/60 border-emerald-500/40',
    cueReward: 'عصا البرج الذهبي'
  },
  {
    id: 'london',
    nameAr: 'طاولة لندن (ماسترز)',
    nameEn: 'London Royal Club',
    city: 'لندن',
    flag: '🇬🇧',
    entryFee: 2500,
    prizeAmount: 4750,
    badge: '👑',
    bgGradient: 'from-indigo-600/30 to-purple-950/60 border-indigo-500/40',
    cueReward: 'عصا السفير الملكية'
  },
  {
    id: 'las_vegas',
    nameAr: 'طاولة لاس فيجاس (الملوك VIP)',
    nameEn: 'Las Vegas Strip',
    city: 'لاس فيجاس',
    flag: '🇺🇸',
    entryFee: 10000,
    prizeAmount: 19000,
    badge: '💎',
    bgGradient: 'from-rose-600/30 to-pink-950/60 border-rose-500/40',
    cueReward: 'عصا النيون الأسطورية'
  }
];

export const GHOST_BOTS = [
  { name: 'أحمد_البرنس', flag: '🇪🇬', country: 'مصر', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AhmedEG', wins: 84 },
  { name: 'سلطان_الرياض_VIP', flag: '🇸🇦', country: 'السعودية', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SultanKSA', wins: 112 },
  { name: 'صقر_دبي_99', flag: '🇦🇪', country: 'الإمارات', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SaqrUAE', wins: 140 },
  { name: 'Capo_Alexandria', flag: '🇪🇬', country: 'مصر', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CapoAlex', wins: 45 },
  { name: 'Shadow_Striker_Q8', flag: '🇰🇼', country: 'الكويت', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowKW', wins: 62 },
  { name: 'نور_الهدى_العربي', flag: '🇲🇦', country: 'المغرب', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NourMA', wins: 38 },
  { name: 'جوكر_القاهرة', flag: '🇪🇬', country: 'مصر', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=JokerCairo', wins: 53 },
  { name: 'اسد_الأطلس_Pro', flag: '🇲🇦', country: 'المغرب', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AtlasLion', wins: 125 }
];

interface StakeSelectorModalProps {
  gameTitle: string;
  gameKey: string;
  profile: Profile;
  onClose: () => void;
  onStartGame: (config: {
    table: GameTableOption;
    mode: '8-ball' | 'snooker';
    playerCount: number;
    opponent: typeof GHOST_BOTS[0];
  }) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export default function StakeSelectorModal({
  gameTitle,
  gameKey,
  profile,
  onClose,
  onStartGame,
  addToast
}: StakeSelectorModalProps) {
  const [selectedTable, setSelectedTable] = useState<GameTableOption>(GAME_TABLES[0]);
  const [subMode, setSubMode] = useState<'8-ball' | 'snooker'>('8-ball');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [tab, setTab] = useState<'tables' | 'tournament'>('tables');
  
  // Matchmaking State
  const [isSearching, setIsSearching] = useState(false);
  const [matchedOpponent, setMatchedOpponent] = useState<typeof GHOST_BOTS[0] | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const isBilliards = gameKey === 'billiards';

  const handleStartMatchmaking = () => {
    if (profile.gold_coins < selectedTable.entryFee) {
      addToast(`رصيدك غير كافٍ! تحتاج إلى ${selectedTable.entryFee} عملة ذهبية لدخول ${selectedTable.nameAr}.`, 'warning');
      return;
    }

    setIsSearching(true);
    setMatchedOpponent(null);

    // Human-like matchmaking search: Wait 3.5 seconds
    setTimeout(() => {
      // Pick random realistic opponent
      const randomBot = GHOST_BOTS[Math.floor(Math.random() * GHOST_BOTS.length)];
      setMatchedOpponent(randomBot);
      setIsSearching(false);

      // Countdown 3, 2, 1
      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          onStartGame({
            table: selectedTable,
            mode: subMode,
            playerCount,
            opponent: randomBot
          });
        }
      }, 900);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4" dir="rtl">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div>
            <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
              {gameTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              اختر طاولة الرهان أو شارك في بطولة خروج المغلوب 🏆
            </p>
          </div>

          {/* User Balance */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-sm">🪙</span>
              <span className="text-xs font-black text-amber-300">{profile.gold_coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 transition-all cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Matchmaking Screen View */}
        {isSearching || matchedOpponent ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 min-h-[380px]">
            {isSearching ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                  <div className="absolute w-20 h-20 rounded-full border-2 border-indigo-400/40 animate-ping"></div>
                  <span className="text-3xl animate-bounce">{isBilliards ? '🎱' : '🎯'}</span>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-white">جاري البحث عن منافس متكافئ...</h3>
                  <p className="text-xs text-slate-400">
                    طاولة: <span className="text-amber-400 font-bold">{selectedTable.nameAr}</span> • الرهان: {selectedTable.entryFee} 🪙
                  </p>
                </div>
              </div>
            ) : matchedOpponent ? (
              <div className="flex flex-col items-center space-y-6 animate-fade-in">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-1 rounded-full">
                  تم العثور على منافس! 🎯
                </span>

                {/* VS Banner */}
                <div className="flex items-center gap-6 md:gap-12">
                  {/* Player */}
                  <div className="flex flex-col items-center space-y-2">
                    <img src={profile.avatar_url} alt={profile.username} className="w-16 h-16 rounded-full border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-slate-800" />
                    <span className="text-sm font-bold text-white">{profile.username}</span>
                    <span className="text-[10px] text-slate-400">فوز: {profile.wins}</span>
                  </div>

                  {/* VS Emblem */}
                  <div className="flex flex-col items-center">
                    <span className="text-3xl md:text-4xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]">VS</span>
                    {countdown !== null && (
                      <span className="text-2xl font-black text-amber-400 animate-ping mt-2">{countdown}</span>
                    )}
                  </div>

                  {/* Opponent */}
                  <div className="flex flex-col items-center space-y-2">
                    <img src={matchedOpponent.avatar} alt={matchedOpponent.name} className="w-16 h-16 rounded-full border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] bg-slate-800" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{matchedOpponent.flag}</span>
                      <span className="text-sm font-bold text-white">{matchedOpponent.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">فوز: {matchedOpponent.wins}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">تبدأ المواجهة خلال ثوانٍ معدودة...</p>
              </div>
            ) : null}
          </div>
        ) : (
          /* Normal Table & Mode Selection Screen */
          <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Mode & Table Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setTab('tables')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tab === 'tables' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  طاولات الرهان الحر (Stakes) 💰
                </button>
                <button
                  onClick={() => setTab('tournament')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tab === 'tournament' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  بطولات خروج المغلوب (8 Players) 🏆
                </button>
              </div>

              {/* Billiards Specific: Table Style (8-Ball vs Snooker) */}
              {isBilliards && (
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setSubMode('8-ball')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      subMode === '8-ball' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🎱 8-Ball أمريكي
                  </button>
                  <button
                    onClick={() => setSubMode('snooker')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      subMode === 'snooker' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🟢 ترابيزة سنوكر إنجليزي
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: STAKE TABLES CAROUSEL */}
            {tab === 'tables' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GAME_TABLES.map((table) => {
                    const isSelected = selectedTable.id === table.id;
                    const canAfford = profile.gold_coins >= table.entryFee;

                    return (
                      <div
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 bg-gradient-to-br ${table.bgGradient} ${
                          isSelected
                            ? 'scale-[1.02] shadow-[0_0_20px_rgba(99,102,241,0.5)] ring-2 ring-indigo-400'
                            : 'opacity-85 hover:opacity-100 hover:scale-[1.01]'
                        } ${!canAfford ? 'opacity-60' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-2xl">{table.badge}</span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-black/40 text-slate-300">
                            {table.flag} {table.city}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white mb-2">{table.nameAr}</h3>

                        <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-black/30 p-2.5 rounded-xl">
                          <div className="flex justify-between">
                            <span className="text-slate-400">رسوم الدخول:</span>
                            <span className="font-bold text-amber-300">{table.entryFee} 🪙</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">جائزة الفائز:</span>
                            <span className="font-bold text-emerald-400">{table.prizeAmount} 🪙</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="text-center">
                            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                              ✓ الطاولة المحددة حالياً
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: TOURNAMENT BRACKET PREVIEW */}
            {tab === 'tournament' && (
              <div className="space-y-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800 text-center">
                <span className="text-3xl">🏆</span>
                <h3 className="text-lg font-black text-white">بطولة خروج المغلوب الكبرى (8 لاعبين)</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  تحدي ربع النهائي ← نصف النهائي ← النهائي الكبير! الفائز بالمركز الأول يحصل على 80% من إجمالي الجوائز + كأس البطولة.
                </p>

                {/* Tournament Tree Visualization */}
                <div className="flex items-center justify-center gap-4 py-4 text-xs font-bold text-slate-300">
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                    <span>ربع النهائي</span>
                    <span className="block text-[10px] text-slate-500">8 لاعبين</span>
                  </div>
                  <span>➔</span>
                  <div className="bg-indigo-950/50 border border-indigo-500/40 p-2.5 rounded-xl">
                    <span>نصف النهائي</span>
                    <span className="block text-[10px] text-indigo-300">4 لاعبين</span>
                  </div>
                  <span>➔</span>
                  <div className="bg-amber-950/50 border border-amber-500/40 p-2.5 rounded-xl">
                    <span>النهائي الكبير 👑</span>
                    <span className="block text-[10px] text-amber-300">2 لاعبين</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  رسوم الاشتراك: <span className="text-amber-400 font-bold">250 🪙</span> • الجائزة الكبرى: <span className="text-emerald-400 font-bold">1,800 🪙</span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Modal Bottom Bar */}
        {!isSearching && !matchedOpponent && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-xs text-slate-400 text-center md:text-right">
              الطاولة المحددة: <span className="text-white font-bold">{selectedTable.nameAr}</span> • الرهان: <span className="text-amber-400 font-bold">{selectedTable.entryFee} 🪙</span>
            </div>

            <button
              onClick={handleStartMatchmaking}
              className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white font-black text-sm transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>بدء البحث واللعب 🚀</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
