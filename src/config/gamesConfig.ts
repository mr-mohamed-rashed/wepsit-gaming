export interface GameConfig {
  id: string;
  key: 'ludo' | 'chess' | 'backgammon' | 'domino' | 'uno' | 'estimation' | 'fighter' | 'cyber-arena' | 'billiards';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  status: 'ready' | 'coming_soon';
  badgeAr: string;
  badgeEn: string;
  image: string;
  // External deployed URL or local route
  embedUrl: string;
}

export const GAMES_CONFIG: GameConfig[] = [
  {
    id: 'billiards-game',
    key: 'billiards',
    titleAr: '🎱 بلياردو 8 Ball Pool & سنوكر',
    titleEn: '🎱 8-Ball Pool & Royal Snooker',
    descAr: 'تحدي بلياردو 8 Ball Pool الكلاسيكي الاحترافي مع خيار ترابيزة السنوكر الإنجليزية، تحديد الرهانات، ومنافسات أونلاين.',
    descEn: 'Classic 8-Ball American Pool and British Snooker tables with physics, cue spin, stakes, and online tournament mode.',
    status: 'ready',
    badgeAr: 'جديد 🔥',
    badgeEn: 'New 🔥',
    image: '/iron_strike_card.png',
    embedUrl: '/games/billiards',
  },
  {
    id: 'ludo-game',
    key: 'ludo',
    titleAr: '🎲 لودو الممالك الأسطورية',
    titleEn: '🎲 Ludo: Mythical Kingdoms',
    descAr: 'لعبة اللودو الكلاسيكية بتصميم فلكي أسطوري، رمي نرد ذكي، مؤثرات صوتية وتحدي الروبوتات.',
    descEn: 'Classic Mythical Ludo board with space themes, smart dice RNG, and bot AI.',
    status: 'ready',
    badgeAr: 'جاهزة للعب 🚀',
    badgeEn: 'Ready to Play 🚀',
    image: '/mythical_ludo_card.png',
    embedUrl: '/games/ludo', // Embedded local route or standalone server (e.g. http://localhost:5001)
  },
  {
    id: 'rpg-chess',
    key: 'chess',
    titleAr: '♟️ شطرنج الأساطير 3D',
    titleEn: '♟️ Grandmaster 3D Chess',
    descAr: 'معارك شطرنج ملحمية بمحرك ثلاثي الأبعاد ومشاهد سينمائية قتالية خارقة.',
    descEn: 'Epic 3D chess battles with cinematic kills and RPG character abilities.',
    status: 'coming_soon',
    badgeAr: 'قريباً 🔥',
    badgeEn: 'Coming Soon 🔥',
    image: '/chess_card.png',
    embedUrl: '/games/chess',
  },
  {
    id: 'backgammon-game',
    key: 'backgammon',
    titleAr: '🎲 لعبة الطاولة (الشيش)',
    titleEn: '🎲 Classic Backgammon',
    descAr: 'تحدي لعبة الطاولة الكلاسيكية رمي النرد وأكل القطع وتجميعها للفوز بالرهان.',
    descEn: 'Classic Backgammon board game against smart bot opponents.',
    status: 'coming_soon',
    badgeAr: 'قريباً',
    badgeEn: 'Coming Soon',
    image: '/backgammon_card.jpg',
    embedUrl: '/games/backgammon',
  },
  {
    id: 'domino-game',
    key: 'domino',
    titleAr: '🎲 لعبة الدومينو 151',
    titleEn: '🎲 Dominoes 151',
    descAr: 'تحدي الدومينو الكلاسيكي شراكة 4 لاعبين حتى 151 نقطة والعد التنازلي التكتيكي.',
    descEn: 'Classic dominoes 4-players partnership to 151 points.',
    status: 'coming_soon',
    badgeAr: 'قريباً',
    badgeEn: 'Coming Soon',
    image: '/domino_card_v2.png',
    embedUrl: '/games/domino',
  },
  {
    id: 'uno-game',
    key: 'uno',
    titleAr: '🔴 كازينو أونو',
    titleEn: '🔴 UNO Casino',
    descAr: 'تحدي الأونو الممتع مع البوتات وتصفية الكروت لكسب الذهب.',
    descEn: 'Discard all your UNO cards against bots and win gold.',
    status: 'coming_soon',
    badgeAr: 'قريباً',
    badgeEn: 'Coming Soon',
    image: '/uno_card.png',
    embedUrl: '/games/uno',
  },
  {
    id: 'estimation-game',
    key: 'estimation',
    titleAr: '🎰 استميشن الملوك',
    titleEn: '🎰 Royal Estimation',
    descAr: 'تحدي استميشن الكوتشينة بنمط كازينو نيون وحساب تقدير ذكي.',
    descEn: 'High-stakes card bidding with AI bots.',
    status: 'coming_soon',
    badgeAr: 'قريباً',
    badgeEn: 'Coming Soon',
    image: '/estimation_card.jpg',
    embedUrl: '/games/estimation',
  },
  {
    id: 'fighter-game',
    key: 'fighter',
    titleAr: '⚡ ضربة الحديد (Iron Strike)',
    titleEn: '⚡ Iron Strike',
    descAr: 'تولى قيادة شخصية "كايزن" في قتال ثنائي الأبعاد مستوحى من الأركيد الكلاسيكي.',
    descEn: 'Take control of Kaizen in this arcade-style 2D fighting game.',
    status: 'coming_soon',
    badgeAr: 'قريباً',
    badgeEn: 'Coming Soon',
    image: '/arcade_mode_card.png',
    embedUrl: '/games/fighter',
  },
  {
    id: 'cyber-arena',
    key: 'cyber-arena',
    titleAr: '🌌 الحلبة السيبرانية',
    titleEn: '🌌 Cyber Arena',
    descAr: 'ساحة قتال تفاعلية بالأسلحة والمؤثرات النيون المتقدمة.',
    descEn: 'Interactive cyberpunk arena with neon visual effects.',
    status: 'coming_soon',
    badgeAr: 'قريباً',
    badgeEn: 'Coming Soon',
    image: '/cyber_card.png',
    embedUrl: '/games/cyber-arena',
  },
];
