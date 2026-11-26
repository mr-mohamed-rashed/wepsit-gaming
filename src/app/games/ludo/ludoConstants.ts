export type BoardTheme = 'classic' | 'underwater' | 'space' | 'ancient';

export interface BoardSkinData {
  id: BoardTheme;
  nameAr: string;
  nameEn: string;
  image: string;
  icon: string;
}

export const BOARD_SKINS: Record<BoardTheme, BoardSkinData> = {
  classic: {
    id: 'classic',
    nameAr: 'الكلاسيكي التقليدي',
    nameEn: 'Classic Traditional',
    image: '/classic_ludo_board.svg',
    icon: '🎨',
  },
  space: {
    id: 'space',
    nameAr: 'مجرة الكواكب والفضاء',
    nameEn: 'Cosmic Galaxy & Planets',
    image: '/space_board.png',
    icon: '🪐',
  },
  underwater: {
    id: 'underwater',
    nameAr: 'عالم تحت الماء (المحيط)',
    nameEn: 'Underwater Ocean',
    image: '/board_skin_underwater.jpg',
    icon: '🌊',
  },
  ancient: {
    id: 'ancient',
    nameAr: 'أساطير الفراعنة والآثار',
    nameEn: 'Ancient Pharaonic Egypt',
    image: '/board_skin_pharaonic.jpg',
    icon: '🏺',
  },
};

export interface GiftItem {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  cost: number;
  category: 'friendly' | 'prank';
  descAr: string;
  sound: 'splat' | 'slap' | 'boom' | 'chime' | 'funny';
}

export const GIFTS_LIST: GiftItem[] = [
  {
    id: 'handshake',
    nameAr: 'مرحبا ومصافحة',
    nameEn: 'Handshake',
    icon: '🤝',
    cost: 10,
    category: 'friendly',
    descAr: 'تحية ترحيب ومصافحة ودية من القلب',
    sound: 'chime',
  },
  {
    id: 'highfive',
    nameAr: '5 هاند (كف)',
    nameEn: 'High Five',
    icon: '✋',
    cost: 15,
    category: 'friendly',
    descAr: 'كف حماسي خمسة وخميسة للمنافس',
    sound: 'chime',
  },
  {
    id: 'flowers',
    nameAr: 'باقة ورد ملكية',
    nameEn: 'Royal Flowers',
    icon: '🌸',
    cost: 20,
    category: 'friendly',
    descAr: 'باقة زهور للتعبير عن الروح الرياضية',
    sound: 'chime',
  },
  {
    id: 'coffee',
    nameAr: 'فنجان قهوة',
    nameEn: 'Arabic Coffee',
    icon: '☕',
    cost: 15,
    category: 'friendly',
    descAr: 'قهوة عربية أصيلة وكرم ضيافة',
    sound: 'chime',
  },
  {
    id: 'crown',
    nameAr: 'تاج الملوك',
    nameEn: 'King Crown',
    icon: '👑',
    cost: 50,
    category: 'friendly',
    descAr: 'تتويج المنافس بتاج الفخامة والملوك',
    sound: 'chime',
  },
  {
    id: 'diamond',
    nameAr: 'ألماسة النصر',
    nameEn: 'Victory Diamond',
    icon: '💎',
    cost: 100,
    category: 'friendly',
    descAr: 'جوهرة أسطورية نادرة للمحترفين',
    sound: 'chime',
  },
  {
    id: 'love',
    nameAr: 'قلوب ومحبة',
    nameEn: 'Hearts Shower',
    icon: '💖',
    cost: 20,
    category: 'friendly',
    descAr: 'أمطار من القلوب والمودة بين الأصدقاء',
    sound: 'chime',
  },
  {
    id: 'egg',
    nameAr: 'ضرب بالبيض',
    nameEn: 'Throw Egg',
    icon: '🥚',
    cost: 15,
    category: 'prank',
    descAr: 'بيضة طائرة تفقس وتلطخ الوجه بصفار البيض!',
    sound: 'splat',
  },
  {
    id: 'slipper',
    nameAr: 'ضرب بالشبشب',
    nameEn: 'Slipper Slap',
    icon: '🩴',
    cost: 20,
    category: 'prank',
    descAr: 'لسعة شبشب أسطورية تهز الشاشة مع صوت رنان!',
    sound: 'slap',
  },
  {
    id: 'tomato',
    nameAr: 'طماطم مفعصة',
    nameEn: 'Squash Tomato',
    icon: '🍅',
    cost: 15,
    category: 'prank',
    descAr: 'طماطم طائرة تنفجر وتتفغص على وجه الخصم!',
    sound: 'splat',
  },
  {
    id: 'bomb',
    nameAr: 'قنبلة متفجرة',
    nameEn: 'Explosive Bomb',
    icon: '💣',
    cost: 30,
    category: 'prank',
    descAr: 'قنبلة موقوتة تنفجر بدخان وصوت انفجار قوي!',
    sound: 'boom',
  },
  {
    id: 'ice',
    nameAr: 'تجميد بالثلج',
    nameEn: 'Ice Freeze',
    icon: '🧊',
    cost: 20,
    category: 'prank',
    descAr: 'كتلة جليدية تجمد الخصم في مكانه مؤقتاً!',
    sound: 'chime',
  },
  {
    id: 'chicken',
    nameAr: 'فرخة تصرخ',
    nameEn: 'Screaming Chicken',
    icon: '🐔',
    cost: 25,
    category: 'prank',
    descAr: 'دجاجة مقالب تصرخ في وجه الخصم بشكل كوميدي!',
    sound: 'funny',
  },
  {
    id: 'fart',
    nameAr: 'ريح محرجة',
    nameEn: 'Poof Wind',
    icon: '💨',
    cost: 10,
    category: 'prank',
    descAr: 'مقلب هواء محرج يثير الضحك!',
    sound: 'funny',
  },
  {
    id: 'boxing',
    nameAr: 'لكمة ملاكمة',
    nameEn: 'Boxing Punch',
    icon: '🥊',
    cost: 25,
    category: 'prank',
    descAr: 'قفاز ملاكمة يطير ويسدد بوكس سريع للمنافس!',
    sound: 'slap',
  },
];

export interface H2HRecord {
  totalMatches: number;
  playerWins: number;
  opponentWins: number;
  byColor: { red: number; green: number; yellow: number };
  streak: number;
  history: Array<{
    id: string;
    date: string;
    winner: 'red' | 'green' | 'blue' | 'yellow';
    winnerName: string;
    playersCount: number;
  }>;
}

export interface PublicLudoRoom {
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

export const LUDO_PUBLIC_ROOMS: PublicLudoRoom[] = [
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
