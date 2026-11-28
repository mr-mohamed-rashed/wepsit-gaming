'use client';

import { useState, useEffect, useRef } from 'react';
import { Profile } from '@/lib/supabase';
import {
  subscribeLudoLobby,
  LiveLobbyRoom,
  PersistentOwnerRoom,
  getOwnerRoomId,
  loadOwnerRoomLocal,
  fetchRoomMetaFromServer,
  saveRoomMetaToServer,
} from '@/app/games/ludo/ludoRealtime';

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
  isHost?: boolean;
  hostId?: string;
  hostName?: string;
  hostAvatar?: string;
  backgroundId?: string;
  announcement?: string;
}

interface CafeRoomModalProps {
  gameKey: CafeGameKey;
  profile: Profile;
  onClose: () => void;
  onStartGame: (config: CafeRoomConfig) => void;
  onOpenIntro?: () => void;
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
  isOpen?: boolean;
  roomLevel?: number;
  bannedIds?: string[];
  hostId?: string;
  backgroundId?: string;
  announcement?: string;
}

export interface RoomWallpaper {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  image: string;
  icon: string;
  tagAr: string;
  tagEn: string;
  themeGradient: string;
  borderGlow: string;
  textColor: string;
}

export const ROOM_WALLPAPERS: RoomWallpaper[] = [
  {
    id: 'royal_gold',
    nameAr: '🏰 قصر السلاطين والمجلس الملكي (VIP)',
    nameEn: 'Royal Sultan Palace & Majlis',
    descAr: 'فخامة المخمل الأحمر والزخارف الذهبية الملكية مع كراسي الشيوخ والقهوة العربية',
    descEn: 'Luxury crimson velvet with golden royal borders and authentic majlis seating',
    image: '/board_skin_pharaonic.jpg',
    icon: '👑',
    tagAr: 'VIP ملكي',
    tagEn: 'Royal VIP',
    themeGradient: 'from-amber-950/90 via-red-950/80 to-slate-950',
    borderGlow: 'border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.4)]',
    textColor: 'text-amber-300',
  },
  {
    id: 'pharaonic',
    nameAr: '🏺 معبد الفراعنة والكنوز الذهبية',
    nameEn: 'Pharaonic Dynasty & Golden Treasures',
    descAr: 'نقوش الأهرامات ومفتاح الحياة ونهر النيل الخالد تحت بريق الذهب المصري القديم',
    descEn: 'Pyramids, hieroglyphics, sacred ankh, and eternal gold of ancient Egypt',
    image: '/board_skin_pharaonic.jpg',
    icon: '🏺',
    tagAr: 'أساطير فرعونية',
    tagEn: 'Pharaonic',
    themeGradient: 'from-amber-900/90 via-yellow-950/80 to-slate-950',
    borderGlow: 'border-yellow-400/80 shadow-[0_0_35px_rgba(234,179,8,0.4)]',
    textColor: 'text-yellow-300',
  },
  {
    id: 'cosmic',
    nameAr: '🌌 مجرة الكواكب والنيون السيبراني',
    nameEn: 'Cosmic Galaxy & Cyber Nebula',
    descAr: 'سماء الفضاء المظلمة مع سدم النجوم وكواكب بركانية وأضواء النيون الساحرة',
    descEn: 'Deep outer space, cosmic nebulae, glowing celestial rings and neon pulses',
    image: '/board_skin_cosmic.jpg',
    icon: '🪐',
    tagAr: 'خيال علمي وفضاء',
    tagEn: 'Cosmic Cyber',
    themeGradient: 'from-purple-950/90 via-indigo-950/80 to-slate-950',
    borderGlow: 'border-purple-400/80 shadow-[0_0_35px_rgba(168,85,247,0.4)]',
    textColor: 'text-purple-300',
  },
  {
    id: 'underwater',
    nameAr: '🌊 أعماق أطلانطس والمحيط الغارق',
    nameEn: 'Deep Atlantis Oceanic Abyss',
    descAr: 'عالم الشعب المرجانية والغواصات والبلورات المائية مع هدوء أمواج البحر',
    descEn: 'Coral reefs, ancient submerged palaces, glowing aquatic orbs and serene deep blues',
    image: '/board_skin_underwater.jpg',
    icon: '🔱',
    tagAr: 'أعماق البحار',
    tagEn: 'Deep Atlantis',
    themeGradient: 'from-cyan-950/90 via-blue-950/80 to-slate-950',
    borderGlow: 'border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.4)]',
    textColor: 'text-cyan-300',
  },
  {
    id: 'traditional_cafe',
    nameAr: '☕ مقهى الحارة والقهوة البلدي',
    nameEn: 'Authentic Oriental Ahwa Cafe',
    descAr: 'أجواء الشاي بالنعناع وشيشة العجمي وطاولات الزهر الخشبية وصوت أم كلثوم',
    descEn: 'Warm lanterns, mint tea, wooden backgammon tables and vintage oriental melodies',
    image: '/iron_strike_ahwa.png',
    icon: '☕',
    tagAr: 'أجواء القهوة الشعبية',
    tagEn: 'Oriental Ahwa',
    themeGradient: 'from-amber-950/90 via-stone-900/80 to-slate-950',
    borderGlow: 'border-orange-400/80 shadow-[0_0_35px_rgba(249,115,22,0.4)]',
    textColor: 'text-orange-300',
  },
  {
    id: 'ice_kingdom',
    nameAr: '❄️ مملكة الجليد والبلورات الزرقاء',
    nameEn: 'Frost Crystal Ice Citadel',
    descAr: 'قلعة الصقيع والرياح القطبية مع أحجار الياقوت الأزرق وجليد لا يذوب',
    descEn: 'Glacial sapphire throne, frostbound runes, and sparkling eternal icicles',
    image: '/board_skin_ice.jpg',
    icon: '❄️',
    tagAr: 'صقيع وجليد',
    tagEn: 'Frozen Realm',
    themeGradient: 'from-sky-950/90 via-blue-950/80 to-slate-950',
    borderGlow: 'border-sky-400/80 shadow-[0_0_35px_rgba(56,189,248,0.4)]',
    textColor: 'text-sky-300',
  },
  {
    id: 'ancient_temple',
    nameAr: '🏛️ حلبة أساطير التاريخ والفرسان',
    nameEn: 'Ancient Chronicles Arena',
    descAr: 'أعمدة المرمر الرومانية ودروع الفرسان ومدرجات التشجيع الحماسية',
    descEn: 'Colosseum marble pillars, champion shields, and legendary warrior spirits',
    image: '/board_skin_ancient.jpg',
    icon: '⚔️',
    tagAr: 'معارك وبطولات',
    tagEn: 'Historical Arena',
    themeGradient: 'from-stone-900/90 via-zinc-950/80 to-slate-950',
    borderGlow: 'border-amber-300/80 shadow-[0_0_35px_rgba(252,211,77,0.4)]',
    textColor: 'text-amber-200',
  },
  {
    id: 'cyber_arena',
    nameAr: '⚡ صالة النيون والسايبر المستقبلية',
    nameEn: 'Cyberpunk Neon Battleground',
    descAr: 'أضواء الليزر المتوهجة وشاشات الهولوجرام وأصوات التحدي الإلكترونية السريعة',
    descEn: 'Holographic interfaces, laser grids, synthwave pulses and hyper-speed action',
    image: '/iron_strike_cyber_stage.png',
    icon: '⚡',
    tagAr: 'نيون وسايبر',
    tagEn: 'Cyber Arena',
    themeGradient: 'from-emerald-950/90 via-slate-950/80 to-black',
    borderGlow: 'border-emerald-400/80 shadow-[0_0_35px_rgba(52,211,153,0.4)]',
    textColor: 'text-emerald-300',
  },
];

export function getRoomWallpaper(id?: string): RoomWallpaper {
  return ROOM_WALLPAPERS.find((w) => w.id === id) || ROOM_WALLPAPERS[0];
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
        backgroundId: 'royal_gold',
        announcement: 'أهلاً بكم في قاعة كبار الشخصيات.. اللعب برهان عالي وبحضور المتفرجين على المايك 👑🎙️',
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
        backgroundId: 'cosmic',
        announcement: 'سرعة البرق ونرد حاسم.. مواجهة ثنائية مباشرة بدون تردد! ⚡🎲',
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
        backgroundId: 'underwater',
        announcement: 'مجلس الأخوة والدردشة الطيبة واللعب النظيف.. مرحباً بالجميع 🎙️🤝',
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
        backgroundId: 'traditional_cafe',
        announcement: 'شاي بنعناع وضحك للصبح على شاطئ البحر.. تفضلوا على الطاولة 🌊☕',
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
  onOpenIntro,
  addToast,
  lang = 'ar',
}: CafeRoomModalProps) {
  const meta = CAFE_GAMES_META[gameKey] || CAFE_GAMES_META.ludo;
  const [tab, setTab] = useState<'create' | 'browse'>(meta.activeTables && meta.activeTables.length > 0 ? 'browse' : 'create');
  const [role, setRole] = useState<'player' | 'spectator'>('player');
  const [playerCount, setPlayerCount] = useState<number>(meta.defaultPlayers);
  const [entryFee, setEntryFee] = useState<number>(50);
  const [roomNameInput, setRoomNameInput] = useState<string>(
    lang === 'ar' ? `غرفة ${profile.username} 👑` : `${profile.username}'s Room 👑`
  );
  const [roomAnnouncementInput, setRoomAnnouncementInput] = useState<string>(
    lang === 'ar' ? 'أهلاً بكم في مجلسنا المتواضع.. متعة اللعب والدردشة الطيبة! 🎙️👑' : 'Welcome to our room! Enjoy the games and voice banter 🎙️👑'
  );
  const [selectedWallpaperId, setSelectedWallpaperId] = useState<string>('royal_gold');

  // Room Settings Modal State
  const [showRoomSettingsModal, setShowRoomSettingsModal] = useState<boolean>(false);
  const [editRoomName, setEditRoomName] = useState<string>('');
  const [editWallpaperId, setEditWallpaperId] = useState<string>('royal_gold');
  const [editAnnouncement, setEditAnnouncement] = useState<string>('');
  const [editStake, setEditStake] = useState<number>(50);
  const [editMaxPlayers, setEditMaxPlayers] = useState<number>(4);
  const [editIsOpen, setEditIsOpen] = useState<boolean>(true);

  // Live Supabase Realtime Lobby Rooms + Owner Permanent Room
  const [liveLudoRooms, setLiveLudoRooms] = useState<ActiveTableItem[]>([]);
  const [myPermanentRoom, setMyPermanentRoom] = useState<ActiveTableItem | null>(null);
  const lobbyPubRef = useRef<((room: LiveLobbyRoom | null) => Promise<void>) | null>(null);

  useEffect(() => {
    if (gameKey !== 'ludo') return;
    const ownerRoomId = getOwnerRoomId(profile.id);
    const savedOwner = loadOwnerRoomLocal(profile.id);
    if (savedOwner) {
      setMyPermanentRoom({
        id: savedOwner.id,
        nameAr: savedOwner.name,
        nameEn: savedOwner.name,
        hostName: savedOwner.hostName,
        hostAvatar: savedOwner.hostAvatar || profile.avatar_url || '',
        flag: '👑',
        playerCount: savedOwner.maxPlayers || 4,
        currentPlayers: 1,
        spectatorsCount: 0,
        entryFee: savedOwner.stake || 50,
        prizeAmount: (savedOwner.stake || 50) * (savedOwner.maxPlayers === 2 ? 1.9 : 3.8),
        status: 'waiting',
        isOpen: savedOwner.isOpen,
        roomLevel: savedOwner.roomLevel,
        bannedIds: savedOwner.bannedIds,
        hostId: profile.id,
        backgroundId: savedOwner.backgroundId || 'royal_gold',
        announcement: savedOwner.announcement || (lang === 'ar' ? 'أهلاً بكم في مجلسنا المتواضع.. نورتونا جميعاً! 👑🎙️' : 'Welcome to our room! 👑🎙️'),
      });
      setSelectedWallpaperId(savedOwner.backgroundId || 'royal_gold');
    }
    void fetchRoomMetaFromServer(ownerRoomId).then((remote) => {
      if (remote && remote.id) {
        setMyPermanentRoom({
          id: remote.id,
          nameAr: remote.name || (lang === 'ar' ? `غرفة ${profile.username} 👑` : `${profile.username}'s Room 👑`),
          nameEn: remote.name || `${profile.username}'s Room 👑`,
          hostName: remote.hostName || profile.username,
          hostAvatar: remote.hostAvatar || profile.avatar_url || '',
          flag: '👑',
          playerCount: remote.maxPlayers || 4,
          currentPlayers: 1,
          spectatorsCount: 0,
          entryFee: remote.stake || 50,
          prizeAmount: (remote.stake || 50) * ((remote.maxPlayers || 4) === 2 ? 1.9 : 3.8),
          status: 'waiting',
          isOpen: remote.isOpen !== false,
          roomLevel: remote.roomLevel || 1,
          bannedIds: remote.bannedIds || [],
          hostId: profile.id,
          backgroundId: remote.backgroundId || 'royal_gold',
          announcement: remote.announcement || (lang === 'ar' ? 'أهلاً بكم في مجلسنا المتواضع.. نورتونا جميعاً! 👑🎙️' : 'Welcome to our room! 👑🎙️'),
        });
        if (remote.backgroundId) {
          setSelectedWallpaperId(remote.backgroundId);
        }
      }
    });
    const sub = subscribeLudoLobby(
      {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar_url || '',
      },
      (rooms) => {
        setLiveLudoRooms(
          rooms.map((r) => ({
            id: r.id,
            nameAr: r.name,
            nameEn: r.name,
            hostName: r.hostName,
            hostAvatar: r.hostAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.hostName)}`,
            flag: '🌐',
            playerCount: r.maxPlayers || 4,
            currentPlayers: r.currentPlayers || 1,
            spectatorsCount: 0,
            entryFee: r.stake || 50,
            prizeAmount: (r.stake || 50) * (r.maxPlayers === 2 ? 1.9 : 3.8),
            status: r.status,
            subType: r.piecesCount === 2 ? 'blitz' : 'classic',
            isOpen: r.isOpen !== false,
            roomLevel: r.roomLevel || 1,
            bannedIds: r.bannedIds || [],
            hostId: r.hostId,
            backgroundId: r.backgroundId || 'royal_gold',
            announcement: r.announcement,
          }))
        );
      }
    );
    lobbyPubRef.current = sub.publishHostedRoom;
    return () => {
      sub.unsubscribe();
      lobbyPubRef.current = null;
    };
  }, [gameKey, profile.id, profile.username, profile.avatar_url]);

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
    const persistentId = gameKey === 'ludo' ? getOwnerRoomId(profile.id) : `room-${Date.now().toString().slice(-4)}`;
    const existingOwner = gameKey === 'ludo' ? loadOwnerRoomLocal(profile.id) : null;
    const finalName = roomNameInput || (lang === 'ar' ? `غرفة ${profile.username} 👑` : `${profile.username}'s Room 👑`);
    const finalBackground = selectedWallpaperId || 'royal_gold';
    const finalAnnouncement = roomAnnouncementInput || (lang === 'ar' ? 'أهلاً بكم في مجلسنا.. نورتونا جميعاً! 🎙️👑' : 'Welcome to our room! 🎙️👑');

    const config: CafeRoomConfig = {
      roomId: persistentId,
      gameKey,
      roomName: finalName,
      role,
      playerCount,
      entryFee,
      prizeAmount: role === 'spectator' ? 0 : entryFee * (playerCount === 2 ? 1.9 : 3.8),
      isHost: true,
      hostId: profile.id,
      hostName: profile.username,
      hostAvatar: profile.avatar_url || '',
      backgroundId: finalBackground,
      announcement: finalAnnouncement,
    };
    if (gameKey === 'ludo') {
      void saveRoomMetaToServer({
        id: persistentId,
        name: finalName,
        hostId: profile.id,
        hostName: profile.username,
        hostAvatar: profile.avatar_url || '',
        stake: entryFee,
        maxPlayers: playerCount,
        isOpen: true,
        roomLevel: existingOwner?.roomLevel || 1,
        roomXp: existingOwner?.roomXp || 0,
        roomMatches: existingOwner?.roomMatches || 0,
        bannedIds: existingOwner?.bannedIds || [],
        backgroundId: finalBackground,
        announcement: finalAnnouncement,
        updatedAt: Date.now(),
      });
      if (lobbyPubRef.current) {
        void lobbyPubRef.current({
          id: config.roomId,
          name: config.roomName,
          hostId: profile.id,
          hostName: profile.username,
          hostAvatar: profile.avatar_url || '',
          stake: entryFee,
          maxPlayers: playerCount,
          piecesCount: 4,
          winRule: 'all',
          status: 'waiting',
          currentPlayers: 1,
          isOpen: true,
          roomLevel: existingOwner?.roomLevel || 1,
          roomXp: existingOwner?.roomXp || 0,
          roomMatches: existingOwner?.roomMatches || 0,
          bannedIds: existingOwner?.bannedIds || [],
          backgroundId: finalBackground,
          announcement: finalAnnouncement,
        });
      }
    }
    startEntryFlow(config);
  };

  const handleJoinActiveRoom = (room: ActiveTableItem) => {
    const amIOwner = room.hostId === profile.id || (gameKey === 'ludo' && room.id === getOwnerRoomId(profile.id));
    if (room.bannedIds?.includes(profile.id) && !amIOwner) {
      addToast(lang === 'ar' ? '⛔ أنت محظور من دخول هذه الغرفة!' : '⛔ You are banned from this room!', 'error');
      return;
    }
    if (room.isOpen === false && !amIOwner) {
      addToast(lang === 'ar' ? '🔒 هذه الغرفة مقفلة مؤقتاً من صاحبها!' : '🔒 This room is temporarily locked!', 'warning');
      return;
    }

    const isMatchPlaying = room.status === 'in_game';
    const isFull = room.currentPlayers >= room.playerCount;
    const canAfford = profile.gold_coins >= room.entryFee;

    // Guests enter Ludo rooms without mic/player seat until Host approves mic
    const roleToAssign: 'player' | 'spectator' =
      gameKey === 'ludo' && !amIOwner
        ? 'spectator'
        : isMatchPlaying || isFull || !canAfford
        ? 'spectator'
        : 'player';

    const config: CafeRoomConfig = {
      roomId: room.id,
      gameKey,
      roomName: lang === 'ar' ? room.nameAr : room.nameEn,
      role: roleToAssign,
      playerCount: room.playerCount,
      entryFee: roleToAssign === 'spectator' ? 0 : room.entryFee,
      prizeAmount: roleToAssign === 'spectator' ? 0 : room.prizeAmount,
      subType: room.subType,
      isHost: amIOwner,
      hostId: room.hostId || room.id,
      hostName: room.hostName,
      hostAvatar: room.hostAvatar,
      backgroundId: room.backgroundId || 'royal_gold',
      announcement: room.announcement,
    };

    if (roleToAssign === 'spectator') {
      if (isMatchPlaying) {
        addToast(
          lang === 'ar'
            ? 'المباراة جارية حالياً! تم دخولك كمتفرج على المايك حتى تبدأ الجولة القادمة 🎙️'
            : 'Match in progress! Entering as spectator until next game starts 🎙️',
          'warning'
        );
      } else if (isFull) {
        addToast(
          lang === 'ar'
            ? 'مقاعد اللاعبين ممتلئة! تم دخولك كمتفرج للاستمتاع بالصوتيات والتشجيع 🎙️'
            : 'Player seats are full! Entering as spectator on mic 🎙️',
          'warning'
        );
      }
    }

    startEntryFlow(config);
  };

  // Open Room Settings Dialog (Host & Background Customization)
  const openRoomSettings = (room?: ActiveTableItem) => {
    const target = room || myPermanentRoom;
    const currentBg = target?.backgroundId || selectedWallpaperId || 'royal_gold';
    const currentName = target?.nameAr || roomNameInput || (lang === 'ar' ? `غرفة ${profile.username} 👑` : `${profile.username}'s Room 👑`);
    const currentAnnounce = target?.announcement || roomAnnouncementInput || (lang === 'ar' ? 'أهلاً بكم في مجلسنا المتواضع.. متعة اللعب والدردشة الطيبة! 🎙️👑' : 'Welcome to our room! Enjoy the games and voice banter 🎙️👑');
    const currentStake = target?.entryFee || entryFee || 50;
    const currentCount = target?.playerCount || playerCount || 4;
    const currentOpen = target ? target.isOpen !== false : true;

    setEditRoomName(currentName);
    setEditWallpaperId(currentBg);
    setEditAnnouncement(currentAnnounce);
    setEditStake(currentStake);
    setEditMaxPlayers(currentCount);
    setEditIsOpen(currentOpen);
    setShowRoomSettingsModal(true);
  };

  const handleSaveRoomSettings = () => {
    const persistentId = gameKey === 'ludo' ? getOwnerRoomId(profile.id) : `room-${profile.id.slice(0, 8)}`;
    const existingOwner = gameKey === 'ludo' ? loadOwnerRoomLocal(profile.id) : null;
    const finalName = editRoomName.trim() || (lang === 'ar' ? `غرفة ${profile.username} 👑` : `${profile.username}'s Room 👑`);

    const updatedRoom: PersistentOwnerRoom = {
      id: persistentId,
      name: finalName,
      hostId: profile.id,
      hostName: profile.username,
      hostAvatar: profile.avatar_url || '',
      stake: editStake,
      maxPlayers: editMaxPlayers,
      isOpen: editIsOpen,
      roomLevel: existingOwner?.roomLevel || 1,
      roomXp: existingOwner?.roomXp || 0,
      roomMatches: existingOwner?.roomMatches || 0,
      bannedIds: existingOwner?.bannedIds || [],
      backgroundId: editWallpaperId,
      announcement: editAnnouncement,
      updatedAt: Date.now(),
    };

    if (gameKey === 'ludo') {
      void saveRoomMetaToServer(updatedRoom);
    }

    setMyPermanentRoom({
      id: persistentId,
      nameAr: finalName,
      nameEn: finalName,
      hostName: profile.username,
      hostAvatar: profile.avatar_url || '',
      flag: '👑',
      playerCount: editMaxPlayers,
      currentPlayers: 1,
      spectatorsCount: 0,
      entryFee: editStake,
      prizeAmount: editStake * (editMaxPlayers === 2 ? 1.9 : 3.8),
      status: 'waiting',
      isOpen: editIsOpen,
      roomLevel: updatedRoom.roomLevel,
      bannedIds: updatedRoom.bannedIds,
      hostId: profile.id,
      backgroundId: editWallpaperId,
      announcement: editAnnouncement,
    });

    setSelectedWallpaperId(editWallpaperId);
    setRoomNameInput(finalName);
    setRoomAnnouncementInput(editAnnouncement);
    setEntryFee(editStake);
    setPlayerCount(editMaxPlayers);

    if (lobbyPubRef.current) {
      void lobbyPubRef.current({
        id: updatedRoom.id,
        name: updatedRoom.name,
        hostId: updatedRoom.hostId,
        hostName: updatedRoom.hostName,
        hostAvatar: updatedRoom.hostAvatar,
        stake: updatedRoom.stake,
        maxPlayers: updatedRoom.maxPlayers,
        piecesCount: 4,
        winRule: 'all',
        status: 'waiting',
        currentPlayers: 1,
        isOpen: updatedRoom.isOpen,
        roomLevel: updatedRoom.roomLevel,
        roomXp: updatedRoom.roomXp,
        roomMatches: updatedRoom.roomMatches,
        bannedIds: updatedRoom.bannedIds,
        backgroundId: updatedRoom.backgroundId,
        announcement: updatedRoom.announcement,
      });
    }

    addToast(
      lang === 'ar' ? '🎉 تم حفظ خلفية وإعدادات الروم بنجاح!' : '🎉 Room wallpaper & settings saved successfully!',
      'success'
    );
    setShowRoomSettingsModal(false);
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 select-none font-sans"
    >
      <div className={`w-full max-w-4xl bg-slate-900/95 border ${meta.borderGlow} rounded-3xl overflow-hidden flex flex-col max-h-[94vh] shadow-2xl relative`}>

        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
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

          {/* User Balance, Replay Intro & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play Intro Button ("الدخلة الأسطورية") */}
            {onOpenIntro && (
              <button
                type="button"
                onClick={onOpenIntro}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title={lang === 'ar' ? 'مشاهدة الدخلة الأسطورية للعبة 🎬' : 'Watch Cinematic Intro 🎬'}
              >
                <span>🎬</span>
                <span className="hidden sm:inline">{lang === 'ar' ? 'عرض الدخلة' : 'Play Intro'}</span>
              </button>
            )}

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

        {/* Searching / Loading Overlay */}
        {isSearching ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 min-h-[380px] bg-gradient-to-b from-slate-900 to-slate-950">
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
                {lang === 'ar' ? 'أهلاً بك في طاولة اللودو والمجلس الصوتي!' : 'Welcome to the Table & Voice Majlis!'}
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
          <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1">

            {/* Main Tabs: Active Live Rooms vs Create Room */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex gap-2">
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
                  <span>{lang === 'ar' ? 'الغرف المتاحة حالياً' : 'Available Rooms'}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    {(gameKey === 'ludo' ? (myPermanentRoom ? 1 : 0) + liveLudoRooms.length + meta.activeTables.length : meta.activeTables.length)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    tab === 'create'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-lg shadow-amber-950/50 border border-amber-400'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <span>👑</span>
                  <span>{lang === 'ar' ? 'إنشاء غرفة باسمك' : 'Create Room In Your Name'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Host Quick Settings Button if Player has a Permanent Room */}
                {myPermanentRoom && (
                  <button
                    type="button"
                    onClick={() => openRoomSettings(myPermanentRoom)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-600 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>⚙️</span>
                    <span>{lang === 'ar' ? 'خلفيات وإعدادات غرفتي' : 'Room Settings & Wallpaper'}</span>
                  </button>
                )}

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span>🎙️</span>
                  <span>{lang === 'ar' ? 'متاح دخول لاعبين ومتفرجين' : 'Players & Spectators'}</span>
                </div>
              </div>
            </div>

            {/* TAB 1: CREATE TABLE - WITH FULL WALLPAPERS GALLERY */}
            {tab === 'create' && (
              <div className="space-y-4">
                {/* 1. Room Name & Announcement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>👑</span>
                      <span>{lang === 'ar' ? 'اسم الغرفة / المجلس:' : 'Room Name:'}</span>
                    </label>
                    <input
                      type="text"
                      value={roomNameInput}
                      onChange={(e) => setRoomNameInput(e.target.value)}
                      maxLength={40}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-all font-medium"
                      placeholder={lang === 'ar' ? 'اكتب اسم الغرفة...' : 'Enter room name...'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>🎙️</span>
                      <span>{lang === 'ar' ? 'رسالة الترحيب وإعلان الغرفة:' : 'Welcome Announcement:'}</span>
                    </label>
                    <input
                      type="text"
                      value={roomAnnouncementInput}
                      onChange={(e) => setRoomAnnouncementInput(e.target.value)}
                      maxLength={80}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-all font-medium"
                      placeholder={lang === 'ar' ? 'اكتب رسالة لرواد الغرفة والمتفرجين...' : 'Welcome message for players and spectators...'}
                    />
                  </div>
                </div>

                {/* 2. Room Wallpaper / Theme Selector (خلفيات رومات الدردشة) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>🎨</span>
                      <span>{lang === 'ar' ? 'اختر خلفية وثيم الروم (مثل برامج الدردشة والقهوة):' : 'Choose Room Wallpaper & Theme:'}</span>
                    </label>
                    <span className="text-[11px] text-amber-400 font-bold">
                      {getRoomWallpaper(selectedWallpaperId).nameAr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto p-1 border border-slate-800/80 rounded-2xl bg-slate-950/60">
                    {ROOM_WALLPAPERS.map((wp) => {
                      const isSelected = selectedWallpaperId === wp.id;
                      return (
                        <div
                          key={wp.id}
                          onClick={() => setSelectedWallpaperId(wp.id)}
                          className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-2 flex flex-col justify-between aspect-[16/10] bg-slate-900 ${
                            isSelected
                              ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                              : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={wp.image}
                            alt={wp.nameAr}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-t ${wp.themeGradient} opacity-85 group-hover:opacity-75 transition-opacity`} />

                          {/* Wallpaper Card Header */}
                          <div className="relative z-10 flex justify-between items-start">
                            <span className="text-sm sm:text-base filter drop-shadow">{wp.icon}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-950/80 border border-white/20 text-white">
                              {wp.tagAr}
                            </span>
                          </div>

                          {/* Wallpaper Card Footer */}
                          <div className="relative z-10">
                            <div className="text-[11px] font-black text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                              {wp.nameAr}
                            </div>
                            {isSelected && (
                              <div className="text-[9px] text-amber-300 font-bold flex items-center gap-1 mt-0.5">
                                <span>✓</span>
                                <span>{lang === 'ar' ? 'الخلفية المختارة' : 'Selected'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Table Stake / Entry Fee */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>🪙</span>
                      <span>{lang === 'ar' ? 'رسوم الدخول والرهان على الطاولة:' : 'Table Entry Fee & Stakes:'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map((fee) => {
                      const isDisabled = profile.gold_coins < fee;
                      const isSelected = entryFee === fee;
                      return (
                        <button
                          key={fee}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setEntryFee(fee)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-center ${
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

                {/* 4. Table Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>👥</span>
                    <span>{lang === 'ar' ? 'عدد مقاعد طاولة اللعب:' : 'Table Player Count:'}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlayerCount(2)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer text-xs font-black flex items-center justify-center gap-2 ${
                        playerCount === 2
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>⚡</span>
                      <span>{lang === 'ar' ? 'لاعبان (مواجهة ثنائية سريعة)' : '2 Players (1v1 Duel)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayerCount(4)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer text-xs font-black flex items-center justify-center gap-2 ${
                        playerCount === 4
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🎲</span>
                      <span>{lang === 'ar' ? '4 لاعبين (طاولة لودو كاملة)' : '4 Players (Full Table)'}</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>👑</span>
                    <span>
                      {lang === 'ar' ? `فتح الغرفة وبدء المجلس (الرهان: ${entryFee} 🪙)` : `Open Room & Start Table (${entryFee} 🪙)`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: GAME-THEMED ROOM CARDS (كروت على شكل اللعبة وصور البروفايل) */}
            {tab === 'browse' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(gameKey === 'ludo'
                    ? [
                        ...(myPermanentRoom ? [myPermanentRoom] : []),
                        ...liveLudoRooms.filter((lr) => lr.id !== myPermanentRoom?.id),
                        ...meta.activeTables.filter(
                          (t) => t.id !== myPermanentRoom?.id && !liveLudoRooms.some((lr) => lr.id === t.id)
                        ),
                      ]
                    : meta.activeTables
                  ).map((room) => {
                    const amIOwnerCard =
                      gameKey === 'ludo' && (room.hostId === profile.id || room.id === getOwnerRoomId(profile.id));
                    const isFull = room.currentPlayers >= room.playerCount;
                    const isInGame = room.status === 'in_game';
                    const wp = getRoomWallpaper(room.backgroundId);

                    return (
                      <div
                        key={room.id}
                        className={`rounded-3xl overflow-hidden transition-all duration-300 shadow-xl group relative border flex flex-col justify-between ${
                          amIOwnerCard
                            ? 'bg-slate-900/90 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:border-amber-300 ring-1 ring-amber-400/50'
                            : isInGame
                            ? 'bg-slate-900/90 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:border-purple-400'
                            : 'bg-slate-900/90 border-slate-700/80 hover:border-amber-400/70 shadow-lg'
                        }`}
                      >
                        {/* 1. Game Themed Header Banner (خلفية اللعبة وثيم الروم) */}
                        <div className="relative h-20 sm:h-22 w-full overflow-hidden bg-slate-950 flex items-start justify-between p-3">
                          <img
                            src={wp.image}
                            alt={wp.nameAr}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-b ${wp.themeGradient} opacity-85`} />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                          {/* Top-Right: Game Category Tag */}
                          <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-[10px] font-black text-amber-300 shadow">
                            <span>{wp.icon}</span>
                            <span>{wp.tagAr}</span>
                          </div>

                          {/* Top-Left: Status & Settings Button */}
                          <div className="relative z-10 flex items-center gap-1.5">
                            {amIOwnerCard && (
                              <button
                                type="button"
                                onClick={() => openRoomSettings(room)}
                                className="px-2 py-1 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md cursor-pointer transition-all active:scale-95"
                                title="اضغط لتغيير خلفية وإعدادات الروم"
                              >
                                <span>⚙️</span>
                                <span>{lang === 'ar' ? 'الخلفيات' : 'Wallpaper'}</span>
                              </button>
                            )}

                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1 ${
                                isInGame
                                  ? 'bg-purple-950/80 border-purple-400/60 text-purple-200 animate-pulse'
                                  : 'bg-emerald-950/80 border-emerald-400/60 text-emerald-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isInGame ? 'bg-purple-400 animate-ping' : 'bg-emerald-400 animate-ping'}`} />
                              <span>{isInGame ? (lang === 'ar' ? 'المباراة جارية ⚔️' : 'Live Match') : (lang === 'ar' ? 'في انتظار لاعبين' : 'Waiting')}</span>
                            </span>
                          </div>
                        </div>

                        {/* 2. Host Profile Section (صورة البروفايل اللى اختاره اللاعب) */}
                        <div className="px-4 pt-1 pb-3 space-y-3 relative z-10">
                          <div className="flex items-center gap-3">
                            {/* Host Avatar with Golden VIP Ring */}
                            <div
                              onClick={() => {
                                if (amIOwnerCard) openRoomSettings(room);
                              }}
                              className={`relative cursor-pointer transition-transform group-hover:scale-105 ${
                                amIOwnerCard ? 'ring-2 ring-amber-400 rounded-full' : ''
                              }`}
                              title={amIOwnerCard ? 'اضغط لتغيير خلفيات وإعدادات الروم 🎨' : room.hostName}
                            >
                              <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                <img
                                  src={room.hostAvatar}
                                  alt={room.hostName}
                                  className="w-full h-full rounded-full object-cover bg-slate-950 border border-slate-900"
                                />
                              </div>
                              <span className="absolute -bottom-1 -right-1 text-xs filter drop-shadow">
                                {room.flag}
                              </span>
                              {amIOwnerCard && (
                                <span className="absolute -top-1 -left-1 bg-amber-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                                  👑
                                </span>
                              )}
                            </div>

                            {/* Host Name, Room Title & Level */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-xs sm:text-sm font-black text-white truncate">
                                  {lang === 'ar' ? room.nameAr : room.nameEn}
                                </h3>
                                {amIOwnerCard && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black text-[9px] border border-amber-400/40">
                                    👑 {lang === 'ar' ? 'غرفتك الدائمة' : 'Your Room'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="font-bold text-amber-200">
                                  {lang === 'ar' ? `المضيف: ${room.hostName}` : `Host: ${room.hostName}`}
                                </span>
                                {room.roomLevel && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-black text-[9px] border border-amber-400/30">
                                    ⭐ Lv.{room.roomLevel}
                                  </span>
                                )}
                                {room.isOpen === false && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-black text-[9px] border border-rose-400/40">
                                    🔒 مقفلة مؤقتاً
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Room Announcement Speech Bubble */}
                          {room.announcement && (
                            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-1.5 line-clamp-1 italic">
                              <span className="text-amber-400">🎙️</span>
                              <span>&ldquo;{room.announcement}&rdquo;</span>
                            </div>
                          )}

                          {/* 3. Visual Game Table & Seats (مقاعد اللعب المرئية والمتفرجين) */}
                          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/70 flex items-center justify-between gap-2">
                            {/* Visual Seats representation */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-bold ml-1">
                                {lang === 'ar' ? 'طاولة النرد:' : 'Table:'}
                              </span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: room.playerCount }).map((_, seatIdx) => {
                                  const isOccupied = seatIdx < room.currentPlayers;
                                  const seatColors = ['text-emerald-400', 'text-sky-400', 'text-amber-400', 'text-rose-400'];
                                  return (
                                    <div
                                      key={seatIdx}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border transition-all ${
                                        isOccupied
                                          ? `bg-slate-900 border-amber-400/70 shadow-sm ${seatColors[seatIdx % 4]}`
                                          : 'bg-slate-950/80 border-dashed border-slate-700 text-slate-600'
                                      }`}
                                      title={isOccupied ? `لاعب ${seatIdx + 1}` : 'مقعد شاغر'}
                                    >
                                      {isOccupied ? '🎲' : '+'}
                                    </div>
                                  );
                                })}
                              </div>
                              <span className={`text-[11px] font-bold mr-1 ${isInGame ? 'text-purple-300' : isFull ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {room.currentPlayers}/{room.playerCount}
                              </span>
                            </div>

                            {/* Voice Spectators Count */}
                            <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded-xl border border-cyan-800/40">
                              <span>🎙️</span>
                              <span>{room.spectatorsCount + (room.currentPlayers > 1 ? room.currentPlayers : 1)}</span>
                              <span className="text-[9px] text-slate-400 hidden sm:inline">{lang === 'ar' ? 'متفرج' : 'watching'}</span>
                            </div>

                            {/* Stake & Prize Info */}
                            <div className="text-right">
                              <div className="text-[9px] text-slate-400">{lang === 'ar' ? 'رسوم الدخول' : 'Entry'}</div>
                              <div className="font-black text-amber-300 text-xs">🪙 {room.entryFee}</div>
                            </div>
                          </div>

                          {/* 4. Action Button */}
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleJoinActiveRoom(room)}
                              className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 ${
                                amIOwnerCard
                                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 border border-amber-200 shadow-amber-950/50'
                                  : isInGame || isFull
                                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/50 shadow-purple-950/40'
                                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border border-emerald-300 shadow-emerald-950/40'
                              }`}
                            >
                              <span>{amIOwnerCard ? '👑' : isInGame || isFull ? '🎙️' : '🚪'}</span>
                              <span>
                                {amIOwnerCard
                                  ? (lang === 'ar' ? 'ادخل غرفتك الآن (أنت صاحب الغرفة)' : 'Enter Your Room (Owner)')
                                  : isInGame
                                  ? (lang === 'ar' ? 'دخول الغرفة (المباراة جارية - استمع بالمايك 🎙️)' : 'Enter Room (In Game - Spectate)')
                                  : isFull
                                  ? (lang === 'ar' ? 'دخول الغرفة (طاولة اللعب ممتلئة - استمع بالمايك 🎙️)' : 'Enter Room (Seats Full - Spectate)')
                                  : (lang === 'ar' ? `دخول الغرفة للعب (الرهان: ${room.entryFee} 🪙)` : `Enter Room To Play (${room.entryFee} 🪙)`)}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 5. ROOM SETTINGS & WALLPAPERS MODAL (إعدادات وخلفيات الروم مثل برامج الدردشة) */}
        {showRoomSettingsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
            <div className="w-full max-w-2xl bg-slate-900 border border-amber-400/70 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              {/* Settings Header */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/90">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-amber-300">
                      {lang === 'ar' ? 'إعدادات وخلفيات الروم' : 'Room Settings & Wallpaper'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ar' ? 'تخصيص ثيم وخلفية الغرفة والاسم والرسالة الترحيبية' : 'Customize room theme, wallpaper, name & welcome message'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoomSettingsModal(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/60 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Settings Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {/* Live Preview Card */}
                <div className="relative rounded-2xl overflow-hidden border border-amber-400/50 shadow-lg h-28 flex flex-col justify-end p-3">
                  <img
                    src={getRoomWallpaper(editWallpaperId).image}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${getRoomWallpaper(editWallpaperId).themeGradient} opacity-85`} />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden shadow">
                        <img src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Host'} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1">
                          <span>{editRoomName || profile.username}</span>
                          <span className="text-xs">👑</span>
                        </div>
                        <div className="text-[10px] text-amber-300 font-bold">
                          {getRoomWallpaper(editWallpaperId).nameAr}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/20 text-white">
                      معاينة حية للمجلس 👁️
                    </span>
                  </div>
                </div>

                {/* Wallpapers Gallery */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>🎨</span>
                      <span>{lang === 'ar' ? 'اختر خلفية الروم (اضغط لتغيير الخلفية):' : 'Select Room Wallpaper:'}</span>
                    </span>
                    <span className="text-amber-400 font-bold text-[11px]">
                      {getRoomWallpaper(editWallpaperId).nameAr}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[190px] overflow-y-auto p-1 border border-slate-800 rounded-xl bg-slate-950/60">
                    {ROOM_WALLPAPERS.map((wp) => {
                      const isSel = editWallpaperId === wp.id;
                      return (
                        <div
                          key={wp.id}
                          onClick={() => setEditWallpaperId(wp.id)}
                          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-2 flex flex-col justify-between aspect-[16/10] ${
                            isSel
                              ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                              : 'border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-600'
                          }`}
                        >
                          <img src={wp.image} alt={wp.nameAr} className="absolute inset-0 w-full h-full object-cover" />
                          <div className={`absolute inset-0 bg-gradient-to-t ${wp.themeGradient} opacity-85`} />
                          <div className="relative z-10 flex justify-between items-start">
                            <span className="text-sm">{wp.icon}</span>
                            {isSel && <span className="text-amber-300 text-xs font-black">✓</span>}
                          </div>
                          <div className="relative z-10 text-[10px] font-bold text-white line-clamp-1">
                            {wp.nameAr}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Edit Room Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>✏️</span>
                    <span>{lang === 'ar' ? 'اسم الغرفة:' : 'Room Name:'}</span>
                  </label>
                  <input
                    type="text"
                    value={editRoomName}
                    onChange={(e) => setEditRoomName(e.target.value)}
                    maxLength={40}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                {/* Edit Announcement */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🎙️</span>
                    <span>{lang === 'ar' ? 'رسالة ترحيبية / إعلان الغرفة:' : 'Room Announcement:'}</span>
                  </label>
                  <input
                    type="text"
                    value={editAnnouncement}
                    onChange={(e) => setEditAnnouncement(e.target.value)}
                    maxLength={90}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                    placeholder={lang === 'ar' ? 'أهلاً بكم في مجلسنا.. نورتونا!' : 'Welcome everyone!'}
                  />
                </div>

                {/* Edit Stake & Table Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'رسوم الدخول:' : 'Stake:'}</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[50, 100, 250, 500].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditStake(s)}
                          className={`py-1.5 rounded-lg border text-xs font-black transition-all ${
                            editStake === s
                              ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          🪙 {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'المقاعد والخصوصية:' : 'Seats & Privacy:'}</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditMaxPlayers(2)}
                        className={`py-1.5 rounded-lg border text-xs font-black ${
                          editMaxPlayers === 2
                            ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        ⚡ 2 لاعبين
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMaxPlayers(4)}
                        className={`py-1.5 rounded-lg border text-xs font-black ${
                          editMaxPlayers === 4
                            ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        🎲 4 لاعبين
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditIsOpen(!editIsOpen)}
                      className={`w-full py-1.5 mt-1 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 ${
                        editIsOpen
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      }`}
                    >
                      <span>{editIsOpen ? '🌐' : '🔒'}</span>
                      <span>{editIsOpen ? (lang === 'ar' ? 'الغرفة عامة ومفتوحة للجميع' : 'Room is Public') : (lang === 'ar' ? 'الغرفة مقفلة مؤقتاً' : 'Room is Locked')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Footer */}
              <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoomSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoomSettings}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span>💾</span>
                  <span>{lang === 'ar' ? 'حفظ وتطبيق التغييرات' : 'Save & Apply'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
