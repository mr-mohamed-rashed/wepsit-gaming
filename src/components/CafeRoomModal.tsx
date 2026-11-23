'use client';

import { useState } from 'react';
import { Profile } from '@/lib/supabase';

export type CafeGameKey = 'ludo' | 'domino' | 'backgammon' | 'chess' | 'uno' | 'estimation';

export interface CafeRoomConfig {
  roomId: string;
  gameKey: CafeGameKey;
  roomName: string;
  role: 'player' | 'spectator';
  playerCount: number;
  entryFee: number;
  prizeAmount: number;
  subType?: string; // e.g. classic/blitz, single/partnership
}

interface CafeRoomModalProps {
  gameKey: CafeGameKey;
  profile: Profile;
  onClose: () => void;
  onStartGame: (config: CafeRoomConfig) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
  lang?: 'ar' | 'en';
}

interface ActiveTableItem {
  id: string;
  nameAr: string;
  nameEn: string;
  hostName: string;
  hostAvatar: string;
  flag: string;
  playerCount: number;
  currentPlayers: number;
  spectatorsCount: number;
  entryFee: number;
  prizeAmount: number;
  status: 'waiting' | 'in_game';
  subType?: string;
}

interface GameCafeMeta {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  icon: string;
  themeColor: string; // Tailwind gradient / border
  borderGlow: string;
  supportedPlayers: number[];
  defaultPlayers: number;
  activeTables: ActiveTableItem[];
}

const CAFE_GAMES_META: Record<CafeGameKey, GameCafeMeta> = {
  ludo: {
    titleAr: '🎲 لودو الممالك (طاولات القهوة)',
    titleEn: '🎲 Mythical Ludo Cafe',
    subtitleAr: 'طاولات اللودو الشعبية - ادخل كلاعب نرد أو استمتع بالفرجة والتشجيع على المايك 🎙️',
    subtitleEn: 'Ludo Cafe Tables - Join as a player or spectate from the voice chairs 🎙️',
    icon: '🎲',
    themeColor: 'from-emerald-500/20 to-teal-500/20',
    borderGlow: 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.25)]',
    supportedPlayers: [2, 4],
    defaultPlayers: 4,
    activeTables: [
      {
        id: 'ludo-room-1',
        nameAr: '🏰 قاعة الملوك الكبرى (VIP)',
        nameEn: 'Grand Kings Hall (VIP)',
        hostName: 'الساحر الملكي',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sahir',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 3,
        spectatorsCount: 5,
        entryFee: 100,
        prizeAmount: 380,
        status: 'waiting',
      },
      {
        id: 'ludo-room-2',
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
      },
      {
        id: 'ludo-room-3',
        nameAr: '🎲 مجلس أبطال لودو العربي',
        nameEn: 'Arab Ludo Champions Majlis',
        hostName: 'حنين نورتي',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Haneen',
        flag: '🇦🇪',
        playerCount: 4,
        currentPlayers: 4,
        spectatorsCount: 8,
        entryFee: 500,
        prizeAmount: 1900,
        status: 'in_game',
      },
      {
        id: 'ludo-room-4',
        nameAr: '🌊 ملتقى الإسكندرية الدولي',
        nameEn: 'Alexandria Shore Arena',
        hostName: 'البرنس المصري',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AhmedEG',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 2,
        spectatorsCount: 4,
        entryFee: 50,
        prizeAmount: 190,
        status: 'waiting',
      },
    ],
  },
  domino: {
    titleAr: '🀄 دومينو 151 (طاولات القهوة البلدي)',
    titleEn: '🀄 Dominoes 151 Cafe',
    subtitleAr: 'جلسة دومينو على أصولها - العب شراكة 151 أو فردي، أو اقعد اتفرج واطلب شاي بالنعناع ☕🀄',
    subtitleEn: 'Authentic Dominoes - Play 151 partnership or singles, or pull up a chair with tea ☕🀄',
    icon: '🀄',
    themeColor: 'from-amber-500/20 to-orange-500/20',
    borderGlow: 'border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.25)]',
    supportedPlayers: [2, 4],
    defaultPlayers: 4,
    activeTables: [
      {
        id: 'domino-room-1',
        nameAr: '☕ قهوة الفيشاوي - شراكة 151',
        nameEn: 'Fishawy Cafe - Partnership 151',
        hostName: 'المعلم عزت',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ezzo',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 3,
        spectatorsCount: 6,
        entryFee: 100,
        prizeAmount: 380,
        status: 'waiting',
      },
      {
        id: 'domino-room-2',
        nameAr: '🀄 تحدي الدومينو الفردي السريع',
        nameEn: 'Fast 1v1 Domino Duel',
        hostName: 'حريف الدومينو',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Hareef',
        flag: '🇪🇬',
        playerCount: 2,
        currentPlayers: 1,
        spectatorsCount: 3,
        entryFee: 50,
        prizeAmount: 95,
        status: 'waiting',
      },
      {
        id: 'domino-room-3',
        nameAr: '👑 حرافيش السيدة زينب (VIP)',
        nameEn: 'Sayeda VIP Domino Lounge',
        hostName: 'أبو علي الجدع',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AboAli',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 4,
        spectatorsCount: 9,
        entryFee: 250,
        prizeAmount: 950,
        status: 'in_game',
      },
      {
        id: 'domino-room-4',
        nameAr: '🌟 روقان المنشية ومحطة الرمل',
        nameEn: 'Alexandria Manshiya Breeze',
        hostName: 'كابتن ماجد',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Maged',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 2,
        spectatorsCount: 4,
        entryFee: 50,
        prizeAmount: 190,
        status: 'waiting',
      },
    ],
  },
  backgammon: {
    titleAr: '🎲 لعبة الطاولة والشيش (مجلس القهوة)',
    titleEn: '🎲 Classic Backgammon Majlis',
    subtitleAr: 'طاولة الزهر المصرية الأصيلة - رمي نرد وتكتيك وحبس، ادخل العب أو اتفرج وعلق على الرميات 🎲',
    subtitleEn: 'Classic Backgammon Majlis - Roll dice, bear off checkers, or cheer from spectator seats 🎲',
    icon: '🎲',
    themeColor: 'from-cyan-500/20 to-blue-500/20',
    borderGlow: 'border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)]',
    supportedPlayers: [2],
    defaultPlayers: 2,
    activeTables: [
      {
        id: 'bg-room-1',
        nameAr: '🎲 شيش خان الخليلي العتيق',
        nameEn: 'Khan El-Khalili Antique Sheesh',
        hostName: 'البرنس حامد',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Hamed',
        flag: '🇪🇬',
        playerCount: 2,
        currentPlayers: 1,
        spectatorsCount: 5,
        entryFee: 100,
        prizeAmount: 190,
        status: 'waiting',
      },
      {
        id: 'bg-room-2',
        nameAr: '⚡ طاولة 31 السريعة (خاطف)',
        nameEn: 'Speed 31 Backgammon',
        hostName: 'داهية النرد',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dahia',
        flag: '🇸🇦',
        playerCount: 2,
        currentPlayers: 1,
        spectatorsCount: 3,
        entryFee: 50,
        prizeAmount: 95,
        status: 'waiting',
      },
      {
        id: 'bg-room-3',
        nameAr: '🏆 نهائي طاولة الزهر الملكية (VIP)',
        nameEn: 'Royal Backgammon Grand Finals',
        hostName: 'الباشا سامح',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sameh',
        flag: '🇪🇬',
        playerCount: 2,
        currentPlayers: 2,
        spectatorsCount: 12,
        entryFee: 500,
        prizeAmount: 950,
        status: 'in_game',
      },
      {
        id: 'bg-room-4',
        nameAr: '☕ قعدة قهوة بلدي رايقة',
        nameEn: 'Cozy Egyptian Cafe Match',
        hostName: 'الشيخ رضوان',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Radwan',
        flag: '🇪🇬',
        playerCount: 2,
        currentPlayers: 1,
        spectatorsCount: 4,
        entryFee: 50,
        prizeAmount: 95,
        status: 'waiting',
      },
    ],
  },
  chess: {
    titleAr: '♟️ شطرنج الأساطير 3D (صراع العقول)',
    titleEn: '♟️ Grandmaster 3D Chess Arena',
    subtitleAr: 'معارك الشطرنج الملكية ثلاثية الأبعاد - نافس عمالقة التكتيك أو تابع المباراة السينمائية كمتفرج ♟️✨',
    subtitleEn: 'Grandmaster 3D Chess Battles - Duel brilliant minds or spectate epic cinematic kills ♟️✨',
    icon: '♟️',
    themeColor: 'from-indigo-500/20 to-purple-500/20',
    borderGlow: 'border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.25)]',
    supportedPlayers: [2],
    defaultPlayers: 2,
    activeTables: [
      {
        id: 'chess-room-1',
        nameAr: '♟️ معركة الأساتذة الكبار (Grandmaster)',
        nameEn: 'Grandmaster Arena',
        hostName: 'كاسباروف الشرق',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kasparov',
        flag: '🇪🇬',
        playerCount: 2,
        currentPlayers: 1,
        spectatorsCount: 7,
        entryFee: 100,
        prizeAmount: 190,
        status: 'waiting',
      },
      {
        id: 'chess-room-2',
        nameAr: '⚡ شطرنج خاطف 5 دقائق (Blitz)',
        nameEn: '5-Minute Blitz Chess',
        hostName: 'الفارس الصامت',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Knight',
        flag: '🇸🇦',
        playerCount: 2,
        currentPlayers: 1,
        spectatorsCount: 4,
        entryFee: 50,
        prizeAmount: 95,
        status: 'waiting',
      },
      {
        id: 'chess-room-3',
        nameAr: '🏰 قلعة الأساطير الذهبية (VIP)',
        nameEn: 'Golden Castle VIP Match',
        hostName: 'ملك الرقعة',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KingBoard',
        flag: '🇦🇪',
        playerCount: 2,
        currentPlayers: 2,
        spectatorsCount: 15,
        entryFee: 500,
        prizeAmount: 950,
        status: 'in_game',
      },
      {
        id: 'chess-room-4',
        nameAr: '⚔️ صراع العقول والافتتاحيات',
        nameEn: 'Tactical Minds Showdown',
        hostName: 'دكتور شطرنج',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DocChess',
        flag: '🇪🇬',
        playerCount: 2,
        currentPlayers: 1,
        spectatorsCount: 6,
        entryFee: 100,
        prizeAmount: 190,
        status: 'waiting',
      },
    ],
  },
  uno: {
    titleAr: '🔴 كازينو أونو (صالة الكروت السريعة)',
    titleEn: '🔴 UNO Casino Lounge',
    subtitleAr: 'أسرع ألعاب الكروت الشعبية - ارمي كروت الأكشن، اسحب 4، أو قضيها تشجيع وهدايا في مقاعد المتفرجين 🔴🃏',
    subtitleEn: 'High-speed Uno Card Games - Draw 4, play wildcards, or cheer from spectator seats 🔴🃏',
    icon: '🔴',
    themeColor: 'from-rose-500/20 to-pink-500/20',
    borderGlow: 'border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.25)]',
    supportedPlayers: [2, 4],
    defaultPlayers: 4,
    activeTables: [
      {
        id: 'uno-room-1',
        nameAr: '🔴 صالة كازينو أونو الملكية (VIP)',
        nameEn: 'Royal Uno Casino Lounge',
        hostName: 'لونا السريعة',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 3,
        spectatorsCount: 6,
        entryFee: 100,
        prizeAmount: 380,
        status: 'waiting',
      },
      {
        id: 'uno-room-2',
        nameAr: '⚡ سحب 4 وتحدي الكروت النارية',
        nameEn: 'Draw 4 Fire Cards Challenge',
        hostName: 'كرت الذهب',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoldCard',
        flag: '🇸🇦',
        playerCount: 4,
        currentPlayers: 2,
        spectatorsCount: 3,
        entryFee: 50,
        prizeAmount: 190,
        status: 'waiting',
      },
      {
        id: 'uno-room-3',
        nameAr: '🃏 تحدي أونو الثنائي السريع',
        nameEn: 'Speed 1v1 Uno Duel',
        hostName: 'ماستر أونو',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=UnoMaster',
        flag: '🇦🇪',
        playerCount: 2,
        currentPlayers: 1,
        spectatorsCount: 4,
        entryFee: 50,
        prizeAmount: 95,
        status: 'waiting',
      },
      {
        id: 'uno-room-4',
        nameAr: '💎 طاولة النيون الاحترافية',
        nameEn: 'Pro Neon Cards Lounge',
        hostName: 'الأسطورة ياسمين',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=YasminUno',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 4,
        spectatorsCount: 10,
        entryFee: 250,
        prizeAmount: 950,
        status: 'in_game',
      },
    ],
  },
  estimation: {
    titleAr: '🎰 استميشن الملوك (صالون الكوتشينة)',
    titleEn: '🎰 Royal Estimation Salon',
    subtitleAr: 'لعبة استميشن الكوتشينة المصرية - احسب الكول بدقة، العب مع شريكك، أو ادخل كمتفرج واستمتع بحسابات المعلمين 🎰🃏',
    subtitleEn: 'Egyptian Estimation Card Salon - Accurate bids, smart partnership, or watch masters bid 🎰🃏',
    icon: '🎰',
    themeColor: 'from-violet-500/20 to-purple-500/20',
    borderGlow: 'border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.25)]',
    supportedPlayers: [4],
    defaultPlayers: 4,
    activeTables: [
      {
        id: 'est-room-1',
        nameAr: '👑 صالون استميشن الباشوات (VIP)',
        nameEn: 'Pashas Estimation Salon',
        hostName: 'ملك الكول',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KingCall',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 3,
        spectatorsCount: 8,
        entryFee: 250,
        prizeAmount: 950,
        status: 'waiting',
      },
      {
        id: 'est-room-2',
        nameAr: '♠️ طاولة الروقان والتقدير الذكي',
        nameEn: 'Smart Call & Bids Table',
        hostName: 'حريف كوتشينة',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HareefCards',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 2,
        spectatorsCount: 5,
        entryFee: 100,
        prizeAmount: 380,
        status: 'waiting',
      },
      {
        id: 'est-room-3',
        nameAr: '💎 استميشن الملوك الكبرى (VIP)',
        nameEn: 'Grand Royal Estimation',
        hostName: 'كازينو البرنس',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CasinoPrince',
        flag: '🇦🇪',
        playerCount: 4,
        currentPlayers: 4,
        spectatorsCount: 14,
        entryFee: 500,
        prizeAmount: 1900,
        status: 'in_game',
      },
      {
        id: 'est-room-4',
        nameAr: '🃏 تحدي اللمة البلدي المصري',
        nameEn: 'Traditional Egyptian Gathering',
        hostName: 'سليم أبو الدهب',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Saleem',
        flag: '🇪🇬',
        playerCount: 4,
        currentPlayers: 1,
        spectatorsCount: 4,
        entryFee: 50,
        prizeAmount: 190,
        status: 'waiting',
      },
    ],
  },
};

export default function CafeRoomModal({
  gameKey,
  profile,
  onClose,
  onStartGame,
  addToast,
  lang = 'ar',
}: CafeRoomModalProps) {
  const meta = CAFE_GAMES_META[gameKey] || CAFE_GAMES_META.ludo;
  const [tab, setTab] = useState<'create' | 'browse'>('create');
  const [role, setRole] = useState<'player' | 'spectator'>('player');
  const [playerCount, setPlayerCount] = useState<number>(meta.defaultPlayers);
  const [entryFee, setEntryFee] = useState<number>(50);
  const [roomNameInput, setRoomNameInput] = useState<string>(
    lang === 'ar' ? `طاولة ${profile.username} بالقهوة ☕` : `${profile.username}'s Cafe Table ☕`
  );

  // Matchmaking animation state
  const [isSearching, setIsSearching] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  const startEntryFlow = (targetConfig: CafeRoomConfig) => {
    if (targetConfig.role === 'player' && profile.gold_coins < targetConfig.entryFee) {
      addToast(
        lang === 'ar'
          ? `رصيدك غير كافٍ! تحتاج إلى ${targetConfig.entryFee} 🪙 للجلوس على هذه الطاولة.`
          : `Insufficient coins! You need ${targetConfig.entryFee} 🪙 to join as a player.`,
        'warning'
      );
      return;
    }

    setIsSearching(true);
    setSearchTitle(
      targetConfig.role === 'spectator'
        ? (lang === 'ar' ? `جاري حجز مقعدك في صالة المتفرجين الصوتية 🎙️👁️...` : `Reserving voice spectator seat 🎙️👁️...`)
        : (lang === 'ar' ? `جاري تجهيز طاولة اللعب ومقاعد المواجهة ⚔️...` : `Preparing table and player seats ⚔️...`)
    );

    // Realistic transition: 1.5s with themed animation
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
          onStartGame(targetConfig);
        }
      }, 600);
    }, 1000);
  };

  const handleCreateRoom = () => {
    const config: CafeRoomConfig = {
      roomId: `table-${Date.now().toString().slice(-4)}`,
      gameKey,
      roomName: roomNameInput || (lang === 'ar' ? 'طاولة القهوة' : 'Cafe Table'),
      role,
      playerCount,
      entryFee,
      prizeAmount: role === 'spectator' ? 0 : entryFee * (playerCount === 2 ? 1.9 : 3.8),
    };
    startEntryFlow(config);
  };

  const handleJoinActiveRoom = (room: ActiveTableItem, chosenRole: 'player' | 'spectator') => {
    if (chosenRole === 'player' && room.currentPlayers >= room.playerCount) {
      addToast(
        lang === 'ar'
          ? 'مقاعد اللاعبين ممتلئة على هذه الطاولة! يمكنك الدخول كمتفرج في مقاعد المايك 🎙️'
          : 'Player seats are full! You can enter as a spectator 🎙️',
        'warning'
      );
      return;
    }

    const config: CafeRoomConfig = {
      roomId: room.id,
      gameKey,
      roomName: lang === 'ar' ? room.nameAr : room.nameEn,
      role: chosenRole,
      playerCount: room.playerCount,
      entryFee: chosenRole === 'spectator' ? 0 : room.entryFee,
      prizeAmount: chosenRole === 'spectator' ? 0 : room.prizeAmount,
      subType: room.subType,
    };
    startEntryFlow(config);
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 select-none font-sans"
    >
      <div className={`w-full max-w-3xl bg-slate-900/95 border ${meta.borderGlow} rounded-3xl overflow-hidden flex flex-col max-h-[92vh]`}>

        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.themeColor} border border-white/20 flex items-center justify-center text-2xl shadow-md`}>
              {meta.icon}
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 bg-clip-text text-transparent">
                {lang === 'ar' ? meta.titleAr : meta.titleEn}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                {lang === 'ar' ? meta.subtitleAr : meta.subtitleEn}
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

        {/* Searching / Loading Overlay - Themed Animation (NO 🎱) */}
        {isSearching ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 min-h-[360px] bg-gradient-to-b from-slate-900 to-slate-950">
            {/* Themed Rotating Icon */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
              <div className="absolute w-20 h-20 rounded-full border-2 border-amber-400/30 animate-ping" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 border-2 border-white shadow-[0_0_30px_rgba(251,191,36,0.8)] flex items-center justify-center text-3xl animate-bounce">
                {meta.icon}
              </div>
            </div>

            <div className="text-center space-y-2 max-w-sm">
              <h3 className="text-base sm:text-lg font-black text-white">{searchTitle}</h3>
              <p className="text-xs text-amber-400 font-bold">
                {lang === 'ar' ? 'أهلاً بك في جلسة القهوة البلدي!' : 'Welcome to the Cafe Table!'}
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
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

            {/* Main Tabs: Create Room vs Active Live Rooms */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    tab === 'create'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-lg shadow-amber-950/50 border border-amber-400'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <span>☕</span>
                  <span>{lang === 'ar' ? 'إنشاء طاولة قهوة جديدة' : 'Create New Table'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('browse')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    tab === 'browse'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-lg shadow-amber-950/50 border border-amber-400'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <span>👥</span>
                  <span>{lang === 'ar' ? 'طاولات القهوة المفتوحة' : 'Active Cafe Tables'}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    {meta.activeTables.length}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <span>🎙️</span>
                <span>{lang === 'ar' ? 'متاح دخول لاعبين ومتفرجين' : 'Players & Spectators'}</span>
              </div>
            </div>

            {/* TAB 1: CREATE TABLE - SINGLE-SCREEN COMPACT FORM */}
            {tab === 'create' && (
              <div className="space-y-4">
                {/* 1. Room Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>☕</span>
                    <span>{lang === 'ar' ? 'اسم الطاولة / الجلسة:' : 'Table Name:'}</span>
                  </label>
                  <input
                    type="text"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    maxLength={40}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-all font-medium"
                    placeholder={lang === 'ar' ? 'اكتب اسم الطاولة...' : 'Enter table name...'}
                  />
                </div>

                {/* 2. Choose Role: Player vs Spectator */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🎭</span>
                    <span>{lang === 'ar' ? 'دورك في الطاولة:' : 'Your Role:'}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('player')}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                        role === 'player'
                          ? 'bg-amber-500/15 border-amber-400 text-white shadow-md shadow-amber-950/40'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">⚔️</span>
                      <div>
                        <div className="text-xs font-bold text-amber-300">
                          {lang === 'ar' ? 'دخول كلاعب أساسي' : 'Active Player'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {lang === 'ar' ? 'تجلس على الطاولة وتلعب بالرهان' : 'Sit at table & play for stakes'}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('spectator')}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                        role === 'spectator'
                          ? 'bg-purple-500/15 border-purple-400 text-white shadow-md shadow-purple-950/40'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">🎙️</span>
                      <div>
                        <div className="text-xs font-bold text-purple-300">
                          {lang === 'ar' ? 'دخول كمتفرج (مايك وتفاعل)' : 'Spectator (Voice & Cheer)'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {lang === 'ar' ? 'مقاعد المتفرجين وتشجيع وهدايا' : 'Voice seats, cheer & send gifts'}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Number of Players (respects game rules) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>👥</span>
                    <span>{lang === 'ar' ? 'عدد اللاعبين على الطاولة:' : 'Number of Players:'}</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {meta.supportedPlayers.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setPlayerCount(count)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          playerCount === count
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white text-xs'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          {count === 2
                            ? (lang === 'ar' ? 'لاعبين 2 (وجهاً لوجه)' : '2 Players (1v1)')
                            : (lang === 'ar' ? '4 لاعبين (شراكة / لمة)' : '4 Players (Full Table)')}
                        </div>
                      </button>
                    ))}
                    {meta.supportedPlayers.length === 1 && (
                      <div className="text-[11px] text-slate-400 flex items-center px-2 py-1 bg-slate-950/40 rounded-xl border border-slate-800 col-span-2 sm:col-span-3">
                        ℹ️ {lang === 'ar' ? 'هذه اللعبة مخصصة لـ 2 لاعبين وفق القواعد الرسمية' : 'This game strictly supports 2 players'}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Stake / Entry Fee (Free for spectators, gold for players) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>🪙</span>
                      <span>{lang === 'ar' ? 'رسوم الدخول والرهان:' : 'Entry Fee & Stakes:'}</span>
                    </label>
                    {role === 'spectator' && (
                      <span className="text-emerald-400 text-[11px] font-bold">
                        🎉 {lang === 'ar' ? 'دخول المتفرجين مجاني 100%' : 'Free Spectator Entry'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map((fee) => {
                      const isDisabled = role === 'player' && profile.gold_coins < fee;
                      const isSelected = entryFee === fee;
                      return (
                        <button
                          key={fee}
                          type="button"
                          disabled={role === 'player' && isDisabled}
                          onClick={() => setEntryFee(fee)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-gradient-to-br from-amber-500/30 to-yellow-600/30 border-amber-400 text-amber-300 shadow-md'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="text-xs font-black flex items-center justify-center gap-1">
                            <span>🪙</span>
                            <span>{fee}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            {fee === 50 ? (lang === 'ar' ? 'مبتدئين' : 'Casual') : fee === 100 ? (lang === 'ar' ? 'هواة' : 'Amateur') : fee === 250 ? (lang === 'ar' ? 'محترفين' : 'Pro') : (lang === 'ar' ? 'ملوكي VIP' : 'VIP')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🚀</span>
                    <span>
                      {role === 'player'
                        ? (lang === 'ar' ? `فتح الطاولة وبدء اللعب (${entryFee} 🪙)` : `Open Table & Play (${entryFee} 🪙)`)
                        : (lang === 'ar' ? 'فتح الطاولة والدخول كمتفرج (مجاناً)' : 'Open Table as Spectator (Free)')}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ACTIVE LIVE ROOMS LIST */}
            {tab === 'browse' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {meta.activeTables.map((room) => {
                    const isFull = room.currentPlayers >= room.playerCount;
                    return (
                      <div
                        key={room.id}
                        className="bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl p-3.5 space-y-3 transition-all shadow-md group relative overflow-hidden"
                      >
                        {/* Header: Host & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={room.hostAvatar}
                              alt={room.hostName}
                              className="w-8 h-8 rounded-full border border-amber-400/40 bg-slate-900 object-cover"
                            />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <span>{lang === 'ar' ? room.nameAr : room.nameEn}</span>
                                <span>{room.flag}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {lang === 'ar' ? `المضيف: ${room.hostName}` : `Host: ${room.hostName}`}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              room.status === 'waiting'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {room.status === 'waiting'
                              ? (lang === 'ar' ? 'في انتظار لاعبين' : 'Waiting')
                              : (lang === 'ar' ? 'المباراة جارية' : 'In Game')}
                          </span>
                        </div>

                        {/* Room Stats: Stake, Players, Spectators */}
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-900/60 p-2 rounded-xl text-center border border-slate-800/50 text-[11px]">
                          <div>
                            <div className="text-slate-400 text-[9px]">{lang === 'ar' ? 'الرهان' : 'Stake'}</div>
                            <div className="font-black text-amber-300">🪙 {room.entryFee}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[9px]">{lang === 'ar' ? 'اللاعبين' : 'Players'}</div>
                            <div className={`font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {room.currentPlayers}/{room.playerCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[9px]">{lang === 'ar' ? 'المتفرجين' : 'Spectators'}</div>
                            <div className="font-bold text-purple-400">👁️ {room.spectatorsCount}</div>
                          </div>
                        </div>

                        {/* Two Clear Action Buttons: Play vs Spectate */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isFull}
                            onClick={() => handleJoinActiveRoom(room, 'player')}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isFull
                                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-md font-black'
                            }`}
                          >
                            <span>⚔️</span>
                            <span>{isFull ? (lang === 'ar' ? 'مكتمل' : 'Full') : (lang === 'ar' ? 'دخول كلاعب' : 'Join as Player')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleJoinActiveRoom(room, 'spectator')}
                            className="py-2 px-2.5 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>🎙️</span>
                            <span>{lang === 'ar' ? 'دخول كمتفرج' : 'Spectate'}</span>
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
