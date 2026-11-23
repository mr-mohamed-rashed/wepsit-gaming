'use client';

import { useState } from 'react';
import { Profile } from '@/lib/supabase';

export interface LudoRoomConfig {
  roomId: string;
  roomName: string;
  role: 'player' | 'spectator';
  playerCount: 2 | 4;
  pieceCount: 2 | 4;
  winRule: 'first' | 'all';
  entryFee: number;
  prizeAmount: number;
}

interface LudoRoomModalProps {
  profile: Profile;
  onClose: () => void;
  onStartLudo: (config: LudoRoomConfig) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
  lang?: 'ar' | 'en';
}

interface ActiveRoomItem {
  id: string;
  nameAr: string;
  nameEn: string;
  hostName: string;
  hostAvatar: string;
  flag: string;
  playerCount: 2 | 4;
  currentPlayers: number;
  spectatorsCount: number;
  entryFee: number;
  prizeAmount: number;
  status: 'waiting' | 'in_game';
  modeType: 'classic' | 'blitz';
}

const ACTIVE_LUDO_ROOMS: ActiveRoomItem[] = [
  {
    id: 'room-vip-1',
    nameAr: '🏰 قاعة الملوك الكبرى (VIP)',
    nameEn: 'Grand Kings Hall (VIP)',
    hostName: 'الساحر الملكي',
    hostAvatar: '/laugh_emote.png',
    flag: '🇪🇬',
    playerCount: 4,
    currentPlayers: 3,
    spectatorsCount: 4,
    entryFee: 100,
    prizeAmount: 380,
    status: 'waiting',
    modeType: 'classic',
  },
  {
    id: 'room-blitz-2',
    nameAr: '⚡ تحدي النرد السريع (خاطف)',
    nameEn: 'Blitz Dice Showdown',
    hostName: 'صقر الخليج',
    hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Saqr',
    flag: '🇸🇦',
    playerCount: 2,
    currentPlayers: 1,
    spectatorsCount: 2,
    entryFee: 50,
    prizeAmount: 95,
    status: 'waiting',
    modeType: 'blitz',
  },
  {
    id: 'room-classic-3',
    nameAr: '🎲 مجلس أبطال لودو العربي',
    nameEn: 'Arab Ludo Champions Majlis',
    hostName: 'حنين نورتي',
    hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Haneen',
    flag: '🇦🇪',
    playerCount: 4,
    currentPlayers: 4,
    spectatorsCount: 7,
    entryFee: 500,
    prizeAmount: 1900,
    status: 'in_game',
    modeType: 'classic',
  },
  {
    id: 'room-alex-4',
    nameAr: '🌊 ملتقى الإسكندرية الدولي',
    nameEn: 'Alexandria Shore Arena',
    hostName: 'البرنس المصري',
    hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AhmedEG',
    flag: '🇪🇬',
    playerCount: 4,
    currentPlayers: 2,
    spectatorsCount: 3,
    entryFee: 50,
    prizeAmount: 190,
    status: 'waiting',
    modeType: 'classic',
  },
];

export default function LudoRoomModal({
  profile,
  onClose,
  onStartLudo,
  addToast,
  lang = 'ar',
}: LudoRoomModalProps) {
  const [tab, setTab] = useState<'create' | 'browse'>('create');
  const [role, setRole] = useState<'player' | 'spectator'>('player');
  const [playerCount, setPlayerCount] = useState<2 | 4>(4);
  const [pieceCount, setPieceCount] = useState<2 | 4>(4);
  const [winRule, setWinRule] = useState<'first' | 'all'>('all');
  const [entryFee, setEntryFee] = useState<number>(50);
  const [roomNameInput, setRoomNameInput] = useState<string>(
    lang === 'ar' ? `غرفة ${profile.username} الملكية 🏰` : `${profile.username}'s Royal Room 🏰`
  );

  // Matchmaking animation state
  const [isSearching, setIsSearching] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  const startEntryFlow = (targetConfig: LudoRoomConfig) => {
    if (targetConfig.role === 'player' && profile.gold_coins < targetConfig.entryFee) {
      addToast(
        lang === 'ar'
          ? `رصيدك غير كافٍ! تحتاج إلى ${targetConfig.entryFee} 🪙 لدخول هذه الغرفة.`
          : `Insufficient coins! You need ${targetConfig.entryFee} 🪙 to enter.`,
        'warning'
      );
      return;
    }

    setIsSearching(true);
    setSearchTitle(
      targetConfig.role === 'spectator'
        ? (lang === 'ar' ? 'جاري الدخول إلى منصة ومقاعد المتفرجين الصوتية 🎙️👁️...' : 'Joining spectator voice seats 🎙️👁️...')
        : (lang === 'ar' ? 'جاري تجهيز رقعة النرد ومقاعد اللاعبين 🎲⚔️...' : 'Preparing Ludo board & player seats 🎲⚔️...')
    );

    // Realistic transition: 1.8 seconds with rolling dice
    setTimeout(() => {
      let count = 2;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          setIsSearching(false);
          onStartLudo(targetConfig);
        }
      }, 700);
    }, 1200);
  };

  const handleCreateRoom = () => {
    const config: LudoRoomConfig = {
      roomId: `room-${Date.now().toString().slice(-4)}`,
      roomName: roomNameInput || (lang === 'ar' ? 'غرفة لودو' : 'Ludo Room'),
      role,
      playerCount,
      pieceCount,
      winRule,
      entryFee,
      prizeAmount: role === 'spectator' ? 0 : entryFee * (playerCount === 2 ? 1.9 : 3.8),
    };
    startEntryFlow(config);
  };

  const handleJoinActiveRoom = (room: ActiveRoomItem, chosenRole: 'player' | 'spectator') => {
    if (chosenRole === 'player' && room.currentPlayers >= room.playerCount) {
      addToast(
        lang === 'ar'
          ? 'مقاعد اللاعبين ممتلئة! يمكنك الدخول كمتفرج في مقاعد المايك العلوية 🎙️'
          : 'Player seats are full! You can enter as a spectator 🎙️',
        'warning'
      );
      return;
    }

    const config: LudoRoomConfig = {
      roomId: room.id,
      roomName: lang === 'ar' ? room.nameAr : room.nameEn,
      role: chosenRole,
      playerCount: room.playerCount,
      pieceCount: room.modeType === 'blitz' ? 2 : 4,
      winRule: 'all',
      entryFee: chosenRole === 'spectator' ? 0 : room.entryFee,
      prizeAmount: chosenRole === 'spectator' ? 0 : room.prizeAmount,
    };
    startEntryFlow(config);
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 select-none font-sans"
    >
      <div className="w-full max-w-3xl bg-slate-900/95 border border-emerald-500/30 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden flex flex-col max-h-[92vh]">

        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shadow-md">
              🎲
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                {lang === 'ar' ? 'لودو الممالك الأسطورية - نظام الغرف' : 'Mythical Ludo: Rooms & Spectators'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {lang === 'ar'
                  ? 'أنشئ غرفتك الخاصة أو انضم كلاعب أساسي أو كمتفرج على المايك 🎙️'
                  : 'Create custom rooms or join as an active player or voice spectator 🎙️'}
              </p>
            </div>
          </div>

          {/* User Balance & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black text-amber-300 shadow-sm">
              <span className="text-sm">🪙</span>
              <span>{profile.gold_coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-rose-950/70 border border-slate-700/60 hover:border-rose-600 transition-all cursor-pointer text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Searching / Loading Overlay (Pure Ludo Rolling Dice - NO 🎱) */}
        {isSearching ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 min-h-[380px] bg-gradient-to-b from-[#0a3526]/50 to-slate-950">
            {/* 3D Rolling Dice Animation */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <div className="absolute w-20 h-20 rounded-full border-2 border-amber-400/30 animate-ping" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 border-2 border-white shadow-[0_0_30px_rgba(251,191,36,0.8)] flex items-center justify-center text-3xl animate-bounce">
                🎲
              </div>
            </div>

            <div className="text-center space-y-2 max-w-sm">
              <h3 className="text-base sm:text-lg font-black text-white">{searchTitle}</h3>
              <p className="text-xs text-emerald-400 font-bold">
                {lang === 'ar' ? 'طاولة النرد والمقاعد الصوتية جاهزة للمواجهة!' : 'Dice table and voice seats ready!'}
              </p>
              {countdown !== null && (
                <div className="text-3xl font-black text-amber-400 animate-pulse pt-2">
                  {countdown}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Normal Configuration & Tabs */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">

            {/* Main Tabs: Create Room vs Active Live Rooms */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    tab === 'create'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <span>🏰</span>
                  <span>{lang === 'ar' ? 'إنشاء غرفة لودو جديدة' : 'Create New Room'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('browse')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    tab === 'browse'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <span>📡</span>
                  <span>{lang === 'ar' ? 'الغرف النشطة والمباشرة' : 'Active Live Rooms'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                </button>
              </div>

              {/* Quick Summary Pill */}
              <div className="text-[11px] text-slate-400 font-bold bg-black/40 px-3 py-1 rounded-full border border-slate-800">
                {lang === 'ar' ? 'اختر دورك: لاعب ⚔️ أو متفرج 🎙️' : 'Choose role: Player ⚔️ or Spectator 🎙️'}
              </div>
            </div>

            {/* TAB 1: CREATE NEW ROOM */}
            {tab === 'create' && (
              <div className="space-y-4">

                {/* 1. ROLE SELECTION (The Core Requirement: Player vs Spectator) */}
                <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                  <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <span>👑</span>
                    <span>{lang === 'ar' ? 'حدد دورك عند الدخول إلى الغرفة:' : 'Choose your room entry role:'}</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Role: Active Player */}
                    <button
                      type="button"
                      onClick={() => setRole('player')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                        role === 'player'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl shrink-0">
                        ⚔️
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-300">
                          {lang === 'ar' ? 'دخول كلاعب أساسي (حجز مقعد)' : 'Join as Active Player'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {lang === 'ar' ? 'تلعب بنردك الخاص، تحرك العساكر وتنافس على الرهان والجوائز.' : 'Roll dice, move tokens, compete for the prize.'}
                        </div>
                      </div>
                    </button>

                    {/* Role: Spectator */}
                    <button
                      type="button"
                      onClick={() => setRole('spectator')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                        role === 'spectator'
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0">
                        🎙️
                      </div>
                      <div>
                        <div className="text-xs font-black text-amber-300">
                          {lang === 'ar' ? 'دخول كمتفرج (المقاعد الصوتية)' : 'Join as Spectator (Voice Seats)'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {lang === 'ar' ? 'الجلوس في مقاعد المايك العلوية، تشجيع اللاعبين وإرسال الهدايا مجاناً.' : 'Sit in top mic seats, cheer players & send gifts.'}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Room Name Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    {lang === 'ar' ? 'اسم الغرفة:' : 'Room Name:'}
                  </label>
                  <input
                    type="text"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب اسم الغرفة...' : 'Enter room name...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                {/* 3. Room Settings Grid: Player Count, Tokens, Win Rule, Stake */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Players Count */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>👥</span>
                      <span>{lang === 'ar' ? 'عدد اللاعبين على الطاولة:' : 'Players Count:'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPlayerCount(2)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                          playerCount === 2
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {lang === 'ar' ? '2 لاعبين (مواجهة 1v1)' : '2 Players (1v1)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerCount(4)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                          playerCount === 4
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {lang === 'ar' ? '4 لاعبين (طاولة كاملة)' : '4 Players (Full)'}
                      </button>
                    </div>
                  </div>

                  {/* Tokens Count */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>♟️</span>
                      <span>{lang === 'ar' ? 'نمط المباراة (عدد العساكر):' : 'Match Mode:'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPieceCount(2)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                          pieceCount === 2
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {lang === 'ar' ? '⚡ خاطفة (2 عساكر)' : '⚡ Blitz (2 Tokens)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPieceCount(4)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                          pieceCount === 4
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {lang === 'ar' ? '🛡️ كلاسيك (4 عساكر)' : '🛡️ Classic (4 Tokens)'}
                      </button>
                    </div>
                  </div>

                  {/* Win Condition */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>🏆</span>
                      <span>{lang === 'ar' ? 'شرط الانتصار:' : 'Win Condition:'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWinRule('first')}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                          winRule === 'first'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {lang === 'ar' ? 'أول عسكري يصل' : 'First to finish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setWinRule('all')}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                          winRule === 'all'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {lang === 'ar' ? 'جميع العساكر' : 'All tokens home'}
                      </button>
                    </div>
                  </div>

                  {/* Stake Entry Fee (Active only if player) */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span>💰</span>
                        <span>{lang === 'ar' ? 'رسوم الدخول (الرهان):' : 'Entry Stake:'}</span>
                      </span>
                      {role === 'spectator' && (
                        <span className="text-[10px] text-amber-400 font-extrabold">
                          {lang === 'ar' ? 'مجاني للمتفرجين' : 'Free for Spectators'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[50, 100, 500, 1000].map((fee) => (
                        <button
                          key={fee}
                          type="button"
                          disabled={role === 'spectator'}
                          onClick={() => setEntryFee(fee)}
                          className={`py-1.5 rounded-lg border text-xs font-black transition-all ${
                            role === 'spectator'
                              ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                              : entryFee === fee
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow cursor-pointer'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                          }`}
                        >
                          {fee} 🪙
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Create Room Button */}
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="text-base">{role === 'spectator' ? '🎙️' : '🎲'}</span>
                  <span>
                    {role === 'spectator'
                      ? (lang === 'ar' ? 'دخول الغرفة في مقاعد المتفرجين الصوتية' : 'Join Room in Spectator Voice Seats')
                      : (lang === 'ar' ? 'إنشاء الغرفة وحجز مقعد اللعب' : 'Create Room & Take Player Seat')}
                  </span>
                </button>
              </div>
            )}

            {/* TAB 2: ACTIVE LIVE ROOMS (BROWSE & ENTER) */}
            {tab === 'browse' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ACTIVE_LUDO_ROOMS.map((room) => {
                    const isFullPlayers = room.currentPlayers >= room.playerCount;
                    return (
                      <div
                        key={room.id}
                        className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl flex flex-col justify-between gap-3 transition-all shadow-md hover:shadow-emerald-950/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={room.hostAvatar}
                              alt={room.hostName}
                              className="w-10 h-10 rounded-full border border-emerald-400/40 bg-slate-900 object-cover"
                            />
                            <div>
                              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>{lang === 'ar' ? room.nameAr : room.nameEn}</span>
                                <span>{room.flag}</span>
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                {lang === 'ar' ? 'المضيف:' : 'Host:'} {room.hostName}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              room.status === 'in_game'
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            {room.status === 'in_game'
                              ? (lang === 'ar' ? 'المباراة جارية 🔥' : 'In Game 🔥')
                              : (lang === 'ar' ? 'بانتظار لاعبين ⏳' : 'Waiting ⏳')}
                          </span>
                        </div>

                        {/* Room Stats */}
                        <div className="grid grid-cols-3 gap-2 bg-black/40 p-2 rounded-xl text-center text-[10px]">
                          <div>
                            <span className="text-slate-500 block">{lang === 'ar' ? 'اللاعبين' : 'Players'}</span>
                            <span className="font-black text-emerald-400">
                              {room.currentPlayers}/{room.playerCount}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">{lang === 'ar' ? 'المتفرجين' : 'Spectators'}</span>
                            <span className="font-black text-amber-300">
                              🎙️ {room.spectatorsCount}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">{lang === 'ar' ? 'الجائزة' : 'Prize'}</span>
                            <span className="font-black text-yellow-400">
                              {room.prizeAmount} 🪙
                            </span>
                          </div>
                        </div>

                        {/* Dual Action Buttons: Join as Player OR Join as Spectator */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isFullPlayers}
                            onClick={() => handleJoinActiveRoom(room, 'player')}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                              isFullPlayers
                                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400 cursor-pointer shadow active:scale-95'
                            }`}
                          >
                            <span>⚔️</span>
                            <span>{isFullPlayers ? (lang === 'ar' ? 'ممتلئ' : 'Full') : (lang === 'ar' ? 'دخول كلاعب' : 'Join Player')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleJoinActiveRoom(room, 'spectator')}
                            className="py-2 px-2.5 rounded-xl text-xs font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 cursor-pointer shadow active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <span>🎙️</span>
                            <span>{lang === 'ar' ? 'دخول كمتفرج' : 'Join Spectator'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
