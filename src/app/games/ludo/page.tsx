'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Token, PlayerColor, getAbsolutePosition, SAFE_CELLS, START_INDICES } from './ludoUtils';

export default function LudoPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#031020] text-slate-400 font-sans">جاري تشغيل لودو الممالك...</div>}>
      <LudoApp />
    </Suspense>
  );
}

export type BoardTheme = 'classic' | 'underwater' | 'space' | 'ancient';

export interface BoardSkinData {
  id: BoardTheme;
  nameAr: string;
  nameEn: string;
  image: string;
  icon: string;
}

const BOARD_SKINS: Record<BoardTheme, BoardSkinData> = {
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
  // Friendly / تحيات ومودة
  {
    id: 'handshake',
    nameAr: 'مرحبا ومصافحة',
    nameEn: 'Handshake',
    icon: '🤝',
    cost: 10,
    category: 'friendly',
    descAr: 'تحية ترحيب ومصافحة ودية من القلب',
    sound: 'chime'
  },
  {
    id: 'highfive',
    nameAr: '5 هاند (كف)',
    nameEn: 'High Five',
    icon: '✋',
    cost: 15,
    category: 'friendly',
    descAr: 'كف حماسي خمسة وخميسة للمنافس',
    sound: 'chime'
  },
  {
    id: 'flowers',
    nameAr: 'باقة ورد ملكية',
    nameEn: 'Royal Flowers',
    icon: '🌸',
    cost: 20,
    category: 'friendly',
    descAr: 'باقة زهور للتعبير عن الروح الرياضية',
    sound: 'chime'
  },
  {
    id: 'coffee',
    nameAr: 'فنجان قهوة',
    nameEn: 'Arabic Coffee',
    icon: '☕',
    cost: 15,
    category: 'friendly',
    descAr: 'قهوة عربية أصيلة وكرم ضيافة',
    sound: 'chime'
  },
  {
    id: 'crown',
    nameAr: 'تاج الملوك',
    nameEn: 'King Crown',
    icon: '👑',
    cost: 50,
    category: 'friendly',
    descAr: 'تتويج المنافس بتاج الفخامة والملوك',
    sound: 'chime'
  },
  {
    id: 'diamond',
    nameAr: 'ألماسة النصر',
    nameEn: 'Victory Diamond',
    icon: '💎',
    cost: 100,
    category: 'friendly',
    descAr: 'جوهرة أسطورية نادرة للمحترفين',
    sound: 'chime'
  },
  {
    id: 'love',
    nameAr: 'قلوب ومحبة',
    nameEn: 'Hearts Shower',
    icon: '💖',
    cost: 20,
    category: 'friendly',
    descAr: 'أمطار من القلوب والمودة بين الأصدقاء',
    sound: 'chime'
  },

  // Pranks / مقالب وضرب
  {
    id: 'egg',
    nameAr: 'ضرب بالبيض',
    nameEn: 'Throw Egg',
    icon: '🥚',
    cost: 15,
    category: 'prank',
    descAr: 'بيضة طائرة تفقس وتلطخ الوجه بصفار البيض!',
    sound: 'splat'
  },
  {
    id: 'slipper',
    nameAr: 'ضرب بالشبشب',
    nameEn: 'Slipper Slap',
    icon: '🩴',
    cost: 20,
    category: 'prank',
    descAr: 'لسعة شبشب أسطورية تهز الشاشة مع صوت رنان!',
    sound: 'slap'
  },
  {
    id: 'tomato',
    nameAr: 'طماطم مفعصة',
    nameEn: 'Squash Tomato',
    icon: '🍅',
    cost: 15,
    category: 'prank',
    descAr: 'طماطم طائرة تنفجر وتتفغص على وجه الخصم!',
    sound: 'splat'
  },
  {
    id: 'bomb',
    nameAr: 'قنبلة متفجرة',
    nameEn: 'Explosive Bomb',
    icon: '💣',
    cost: 30,
    category: 'prank',
    descAr: 'قنبلة موقوتة تنفجر بدخان وصوت انفجار قوي!',
    sound: 'boom'
  },
  {
    id: 'ice',
    nameAr: 'تجميد بالثلج',
    nameEn: 'Ice Freeze',
    icon: '🧊',
    cost: 20,
    category: 'prank',
    descAr: 'كتلة جليدية تجمد الخصم في مكانه مؤقتاً!',
    sound: 'chime'
  },
  {
    id: 'chicken',
    nameAr: 'فرخة تصرخ',
    nameEn: 'Screaming Chicken',
    icon: '🐔',
    cost: 25,
    category: 'prank',
    descAr: 'دجاجة مقالب تصرخ في وجه الخصم بشكل كوميدي!',
    sound: 'funny'
  },
  {
    id: 'fart',
    nameAr: 'ريح محرجة',
    nameEn: 'Poof Wind',
    icon: '💨',
    cost: 10,
    category: 'prank',
    descAr: 'مقلب هواء محرج يثير الضحك!',
    sound: 'funny'
  },
  {
    id: 'boxing',
    nameAr: 'لكمة ملاكمة',
    nameEn: 'Boxing Punch',
    icon: '🥊',
    cost: 25,
    category: 'prank',
    descAr: 'قفاز ملاكمة يطير ويسدد بوكس سريع للمنافس!',
    sound: 'slap'
  }
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
    winner: PlayerColor;
    winnerName: string;
    playersCount: number;
  }>;
}


// ==========================================
// 🌟 5-SECOND HIGH-PERFORMANCE MYTHIC SPLASH SCREEN / INTRO COMPONENT
// ====================================================================
// Pure code animation (CSS3 + Web Audio + SVG) - ZERO heavy video files!
interface CinematicIntroProps {
  onComplete: () => void;
  lang: string;
  isMuted: boolean;
}

function MythicSplashScreenIntro({ onComplete, lang, isMuted }: CinematicIntroProps) {
  // Stage 0: 0.0s - 1.0s -> Portal Brand Hook (GAMES PORTAL MYTHIC & GPM)
  // Stage 1: 1.0s - 2.0s -> Underwater Atlantis Theme
  // Stage 2: 2.0s - 3.0s -> Ancient Egyptian Pharaonic Theme
  // Stage 3: 3.0s - 4.0s -> Outer Space Sci-Fi Theme
  // Stage 4: 4.0s - 5.0s -> Grand Finale (Bilingual Title + GPM Badge + Nurex)
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Web Audio procedural sound synthesizer (100% lightweight & offline)
  const playSoundEffect = (type: 'portal' | 'underwater' | 'pharaoh' | 'space' | 'finale') => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      if (type === 'portal') {
        // Deep sub-bass sweep + golden bell chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);

        [880, 1320, 1760].forEach((freq, idx) => {
          const bOsc = ctx.createOscillator();
          const bGain = ctx.createGain();
          bOsc.type = 'triangle';
          bOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
          bGain.gain.setValueAtTime(0.15, now + idx * 0.08);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
          bOsc.connect(bGain);
          bGain.connect(ctx.destination);
          bOsc.start(now + idx * 0.08);
          bOsc.stop(now + idx * 0.08 + 0.5);
        });
      } else if (type === 'underwater') {
        // Hydro whoosh & bubbling water stream
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);

        [440, 587, 659, 880].forEach((f, i) => {
          const bOsc = ctx.createOscillator();
          const bGain = ctx.createGain();
          bOsc.type = 'sine';
          bOsc.frequency.setValueAtTime(f, now + 0.08 + i * 0.1);
          bOsc.frequency.exponentialRampToValueAtTime(f * 1.4, now + 0.08 + i * 0.1 + 0.08);
          bGain.gain.setValueAtTime(0.12, now + 0.08 + i * 0.1);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08 + i * 0.1 + 0.1);
          bOsc.connect(bGain);
          bGain.connect(ctx.destination);
          bOsc.start(now + 0.08 + i * 0.1);
          bOsc.stop(now + 0.08 + i * 0.1 + 0.1);
        });
      } else if (type === 'pharaoh') {
        // Ancient ceremonial brass trumpet fan
        [293.66, 370, 440, 587.33].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.01, now + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.06 + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.6);
        });
      } else if (type === 'space') {
        // Sci-Fi laser warp sweep & synth pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1900, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(523.25, now + 0.08);
        gain2.gain.setValueAtTime(0.1, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.4);
      } else if (type === 'finale') {
        // Slam impact + Royal victory chords
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);
        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);

        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const fOsc = ctx.createOscillator();
          const fGain = ctx.createGain();
          fOsc.type = 'sawtooth';
          fOsc.frequency.setValueAtTime(freq, now + 0.04 + idx * 0.05);
          fGain.gain.setValueAtTime(0.01, now + 0.04 + idx * 0.05);
          fGain.gain.linearRampToValueAtTime(0.18, now + 0.04 + idx * 0.05 + 0.08);
          fGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04 + idx * 0.05 + 0.7);
          fOsc.connect(fGain);
          fGain.connect(ctx.destination);
          fOsc.start(now + 0.04 + idx * 0.05);
          fOsc.stop(now + 0.04 + idx * 0.05 + 0.7);
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    // 0.0s -> Portal Hook
    playSoundEffect('portal');

    // 1.0s -> Underwater Atlantis
    const t1 = setTimeout(() => {
      setStage(1);
      playSoundEffect('underwater');
    }, 1000);

    // 2.0s -> Ancient Egyptian Pharaonic
    const t2 = setTimeout(() => {
      setStage(2);
      playSoundEffect('pharaoh');
    }, 2000);

    // 3.0s -> Outer Space Sci-Fi
    const t3 = setTimeout(() => {
      setStage(3);
      playSoundEffect('space');
    }, 3000);

    // 4.0s -> Grand Finale
    const t4 = setTimeout(() => {
      setStage(4);
      playSoundEffect('finale');
    }, 4000);

    // 4.7s -> Smooth fade out
    const t5 = setTimeout(() => {
      setIsFadingOut(true);
    }, 4700);

    // 5.0s -> Strictly 5 seconds transition to Main Menu!
    const t6 = setTimeout(() => {
      onComplete();
    }, 5000);

    // Top progress bar update
    const startTime = Date.now();
    const pInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / 5000) * 100);
      setProgress(pct);
    }, 50);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearInterval(pInterval);
    };
  }, []);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  // Dynamic background themes for the 5 stages
  const bgStyles = [
    'from-slate-950 via-slate-900 to-black', // Stage 0: Portal void
    'from-[#021B35] via-[#052e4f] to-[#011424]', // Stage 1: Underwater ocean
    'from-[#2d1804] via-[#451a03] to-[#1a0a02]', // Stage 2: Pharaonic golden desert
    'from-[#1e0836] via-[#0f172a] to-[#020617]', // Stage 3: Space nebula
    'from-slate-950 via-[#271302] to-slate-950', // Stage 4: Grand Finale
  ];

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b ${bgStyles[stage]} overflow-hidden select-none transition-colors duration-700 ease-in-out cursor-pointer ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-300`}
    >
      {/* 5-Second Slim Top Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-50 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-cyan-400 shadow-[0_0_12px_#f59e0b] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtle Responsive Skip / تخطي Button */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
      >
        <span>{lang === 'ar' ? 'تخطي' : 'Skip'}</span>
        <span className="text-sm">⏭️</span>
      </button>

      {/* Ambient Moving Particles & Light Rays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.12),transparent_60%)] pointer-events-none animate-pulse" />

      {/* ======================================================== */}
      {/* 1. STAGE 0 (0.0s - 1.0s): Portal Brand Hook (GPM & Banner) */}
      {/* ======================================================== */}
      {stage === 0 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-lg w-full animate-fadeIn">
          {/* Glowing GPM Shield Emblem */}
          <div className="relative mb-5 sm:mb-6 flex items-center justify-center">
            {/* Rotating dashed aura */}
            <div className="absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full border-2 border-dashed border-amber-400/40 animate-[spin_8s_linear_infinite]" />
            <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-cyan-400/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute inset-0 m-auto w-24 h-24 sm:w-32 sm:h-32 bg-amber-400/25 rounded-full blur-2xl" />

            {/* Emblem Crest */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/60 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.6),inset_0_0_20px_rgba(245,158,11,0.3)] flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl text-amber-400 filter drop-shadow mb-[-4px]">👑</span>
              <span className="text-3xl sm:text-5xl font-black tracking-tighter bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]">
                GPM
              </span>
            </div>
          </div>

          {/* Primary Portal Brand Banner */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-amber-300 tracking-[0.2em] sm:tracking-[0.25em] uppercase drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]">
              GAMES PORTAL MYTHIC
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-300 tracking-widest flex items-center justify-center gap-2">
              <span className="text-amber-400">⚡</span>
              <span>{lang === 'ar' ? 'بوابة الألعاب الأسطورية الكبرى' : 'PORTAL OF LEGENDARY BATTLES'}</span>
              <span className="text-amber-400">⚡</span>
            </p>
          </div>

          {/* Developer Credit Footer */}
          <div className="absolute bottom-[-90px] sm:bottom-[-110px] text-[11px] sm:text-xs text-slate-400 tracking-wider">
            Powered by <span className="font-extrabold text-slate-200">Nurex</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STAGE 1 (1.0s - 2.0s): Underwater Atlantis Theme     */}
      {/* ======================================================== */}
      {stage === 1 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-2xl w-full animate-fadeIn">
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-400/50 text-cyan-300 text-xs sm:text-sm font-black mb-3.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <span>🔱</span>
            <span>{lang === 'ar' ? 'العالم الأول: أطلانطس أعماق البحار' : 'WORLD 1: UNDERWATER ATLANTIS'}</span>
          </div>

          {/* Underwater 3D Board Showcase */}
          <div className="relative w-full max-w-[260px] sm:max-w-[320px] md:max-w-[360px] aspect-square rounded-3xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_60px_rgba(6,182,212,0.6)] transform -rotate-2 hover:rotate-0 transition-transform duration-500 bg-slate-950">
            <img
              src="/board_skin_underwater.jpg"
              alt="Underwater Atlantis Board"
              className="w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/80 via-transparent to-cyan-500/15 pointer-events-none" />
            <div className="absolute bottom-2.5 inset-x-2.5 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-400/40 text-center">
              <span className="text-[11px] sm:text-xs md:text-sm font-black text-cyan-300">
                {lang === 'ar' ? '🌊 رقعة أعماق المحيط والغواصات 🌊' : '🌊 Oceanic Deep Abyss & Submarines 🌊'}
              </span>
            </div>
          </div>

          <p className="mt-3.5 text-xs sm:text-sm font-bold text-cyan-200/90 tracking-wide">
            {lang === 'ar' ? 'شعاب مرجانية، كائنات بحرية، ومسارات مائية ساحرة' : 'Sunken kingdoms, coral reefs & aquatic warpaths'}
          </p>

          <div className="absolute bottom-[-60px] text-[11px] text-slate-400">
            GAMES PORTAL MYTHIC • Powered by Nurex
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. STAGE 2 (2.0s - 3.0s): Ancient Egyptian Pharaonic     */}
      {/* ======================================================== */}
      {stage === 2 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-2xl w-full animate-fadeIn">
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-black mb-3.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <span>🏺</span>
            <span>{lang === 'ar' ? 'العالم الثاني: أساطير الفراعنة والآثار' : 'WORLD 2: ANCIENT PHARAONIC DYNASTY'}</span>
          </div>

          {/* Pharaonic 3D Board Showcase */}
          <div className="relative w-full max-w-[260px] sm:max-w-[320px] md:max-w-[360px] aspect-square rounded-3xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.6)] transform rotate-2 hover:rotate-0 transition-transform duration-500 bg-slate-950">
            <img
              src="/board_skin_pharaonic.jpg"
              alt="Ancient Pharaonic Board"
              className="w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-transparent to-yellow-500/15 pointer-events-none" />
            <div className="absolute bottom-2.5 inset-x-2.5 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-400/40 text-center">
              <span className="text-[11px] sm:text-xs md:text-sm font-black text-amber-300">
                {lang === 'ar' ? '☥ أهرامات الجيزة، مفتاح الحياة، ونهر النيل ☥' : '☥ Pyramids of Giza, Sacred Ankh & The Nile ☥'}
              </span>
            </div>
          </div>

          <p className="mt-3.5 text-xs sm:text-sm font-bold text-amber-200/90 tracking-wide">
            {lang === 'ar' ? 'نقوش هيروغليفية حجرية وحماية الآلهة القديمة' : 'Sacred scarabs, golden sands & ancient hieroglyphs'}
          </p>

          <div className="absolute bottom-[-60px] text-[11px] text-slate-400">
            GAMES PORTAL MYTHIC • Powered by Nurex
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. STAGE 3 (3.0s - 4.0s): Outer Space Sci-Fi Theme       */}
      {/* ======================================================== */}
      {stage === 3 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-2xl w-full animate-fadeIn">
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/70 border border-purple-400/50 text-purple-300 text-xs sm:text-sm font-black mb-3.5 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <span>🪐</span>
            <span>{lang === 'ar' ? 'العالم الثالث: مجرة الكواكب وحرب النجوم' : 'WORLD 3: COSMIC GALAXY & NEBULA'}</span>
          </div>

          {/* Cosmic 3D Board Showcase */}
          <div className="relative w-full max-w-[260px] sm:max-w-[320px] md:max-w-[360px] aspect-square rounded-3xl overflow-hidden border-2 border-purple-400/80 shadow-[0_0_60px_rgba(168,85,247,0.7)] transform -rotate-2 hover:rotate-0 transition-transform duration-500 bg-slate-950">
            <img
              src="/board_skin_cosmic.jpg"
              alt="Cosmic Galaxy Board"
              className="w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-transparent to-cyan-500/15 pointer-events-none" />
            <div className="absolute bottom-2.5 inset-x-2.5 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-purple-400/40 text-center">
              <span className="text-[11px] sm:text-xs md:text-sm font-black text-purple-300">
                {lang === 'ar' ? '🚀 كواكب بركانية، نيازك، وبوابات ثقب دودي 🚀' : '🚀 Orbital Rings, Solar Flares & Cyber Grid 🚀'}
              </span>
            </div>
          </div>

          <p className="mt-3.5 text-xs sm:text-sm font-bold text-purple-200/90 tracking-wide">
            {lang === 'ar' ? 'معارك نرد بين المجرات وفضاء لا نهائي من التحدي' : 'Interstellar dice duels across galaxies & wormholes'}
          </p>

          <div className="absolute bottom-[-60px] text-[11px] text-slate-400">
            GAMES PORTAL MYTHIC • Powered by Nurex
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. STAGE 4 (4.0s - 5.0s): Grand Finale                   */}
      {/* ======================================================== */}
      {stage === 4 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-3xl w-full animate-fadeIn">
          {/* Rolling Golden Dice Impact Animation */}
          <div className="relative mb-4 sm:mb-5 flex flex-col items-center">
            {/* Expanding Shockwave Blast */}
            <div className="absolute inset-0 m-auto w-28 h-28 sm:w-44 sm:h-44 rounded-full border-4 border-amber-400/80 animate-ping pointer-events-none" />
            <div className="absolute inset-0 m-auto w-36 h-36 sm:w-52 sm:h-52 bg-gradient-to-r from-amber-400/30 to-cyan-400/30 rounded-full blur-2xl pointer-events-none" />

            {/* The 3D Golden Dice */}
            <div className="relative p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 border-2 sm:border-4 border-amber-200 shadow-[0_0_60px_rgba(251,191,36,0.9),inset_0_0_20px_rgba(255,255,255,0.9)] animate-[bounce_0.8s_ease-out]">
              <span className="text-5xl sm:text-7xl filter drop-shadow">🎲</span>
            </div>
          </div>

          {/* Bilingual Game Title */}
          <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white tracking-wider drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">
              Ludo: Mythic Kingdoms
            </h1>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(245,158,11,0.9)]">
              لودو: الممالك الأسطورية
            </h2>
          </div>

          {/* Primary Portal Brand (Prominent Badge) */}
          <div className="mt-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 border border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.4)] backdrop-blur-md flex items-center gap-2">
            <span className="text-sm sm:text-lg">👑</span>
            <span className="font-black text-xs sm:text-sm md:text-base text-amber-300 tracking-[0.2em] uppercase">
              GAMES PORTAL MYTHIC
            </span>
            <span className="text-sm sm:text-lg">👑</span>
          </div>

          {/* Developer Credit Footer (Subtle Bottom Edge) */}
          <div className="mt-6 sm:mt-8 text-[11px] sm:text-xs text-slate-400 tracking-wider">
            A <span className="font-black text-slate-200">Nurex</span> Production • Powered by Nurex
          </div>
        </div>
      )}
    </div>
  );
}

interface PublicLudoRoom {
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

const LUDO_PUBLIC_ROOMS: PublicLudoRoom[] = [
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

function LudoApp() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'ar';
  const queryUserId = searchParams.get('userId');
  const queryUsername = searchParams.get('username');
  const queryAvatar = searchParams.get('avatar');
  const queryAutoStart = searchParams.get('autoStart') === 'true';
  const queryRole = (searchParams.get('role') as 'player' | 'spectator') || 'player';
  const queryPlayers = searchParams.get('players');
  const queryPieces = searchParams.get('pieces');
  const queryWinRule = searchParams.get('winRule');
  const queryStake = searchParams.get('stake');
  const queryRoomName = searchParams.get('roomName');
  const querySkin = (searchParams.get('skin') || searchParams.get('mode') || searchParams.get('theme')) as BoardTheme | null;
  const queryIsHost = searchParams.get('isHost') !== 'false';
  const queryHostId = searchParams.get('hostId') || (queryIsHost ? (queryUserId || '12842582') : 'host-1');
  const queryHostName = searchParams.get('hostName') || (queryIsHost ? (queryUsername || 'Ali') : (lang === 'ar' ? 'صاحب الغرفة' : 'Room Host'));
  const queryHostAvatar = searchParams.get('hostAvatar') || (queryIsHost ? (queryAvatar || '/laugh_emote.png') : 'https://api.dicebear.com/7.x/bottts/svg?seed=Host');

  const initialPlayerCount = (queryPlayers === '2' ? 2 : 4) as 2 | 3 | 4;
  const initialPieceCount = queryPieces === '2' ? 2 : 4;
  const initialWinRule = (queryWinRule === 'first' ? 'first' : 'all') as 'first' | 'all';

  // --- Room & Role Architecture (فصل إنشاء الغرفة عن الجيم) ---
  const [lobbyView, setLobbyView] = useState<'rooms' | 'create_room' | 'active_room'>('active_room');
  const [userRole, setUserRole] = useState<'player' | 'spectator'>(queryRole);
  const [gameStarted, setGameStarted] = useState<boolean>(false); // Starts from inside the room
  const [showCinematicIntro, setShowCinematicIntro] = useState<boolean>(false);
  const [selectedBoardSkin, setSelectedBoardSkin] = useState<BoardTheme>(() => {
    if (querySkin && ['classic', 'space', 'underwater', 'ancient'].includes(querySkin)) {
      return querySkin;
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ludo_board_theme') as BoardTheme;
        if (saved && ['classic', 'space', 'underwater', 'ancient'].includes(saved)) {
          return saved;
        }
      } catch (e) {}
    }
    return 'classic';
  });

  const handleSelectTheme = (themeKey: BoardTheme) => {
    setSelectedBoardSkin(themeKey);
    try {
      localStorage.setItem('ludo_board_theme', themeKey);
    } catch (e) {}
  };

  // Drag-to-scroll refs and handlers for the Top Mic Seats bar (الاسكرول بالسحب بدون شريط رمادي)
  const micSeatsScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingMicRef = useRef(false);
  const startXMicRef = useRef(0);
  const scrollLeftMicRef = useRef(0);

  const handleMicMouseDown = (e: React.MouseEvent) => {
    isDraggingMicRef.current = true;
    startXMicRef.current = e.pageX - (micSeatsScrollRef.current?.offsetLeft || 0);
    scrollLeftMicRef.current = micSeatsScrollRef.current?.scrollLeft || 0;
  };
  const handleMicMouseLeaveOrUp = () => {
    isDraggingMicRef.current = false;
  };
  const handleMicMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingMicRef.current || !micSeatsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (micSeatsScrollRef.current.offsetLeft || 0);
    const walk = (x - startXMicRef.current) * 1.5;
    micSeatsScrollRef.current.scrollLeft = scrollLeftMicRef.current - walk;
  };
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(initialPlayerCount);
  const [pieceCount, setPieceCount] = useState<number>(initialPieceCount);
  const [winRule, setWinRule] = useState<'first' | 'all'>(initialWinRule);
  const [roomStake, setRoomStake] = useState<number>(queryStake ? parseInt(queryStake, 10) : 50);
  const [roomTitle, setRoomTitle] = useState<string>(
    queryRoomName || (lang === 'ar' ? 'غرفة لودو الملكية 👑' : 'Royal Ludo Room 👑')
  );
  const [roomId, setRoomId] = useState<string>(() => `R-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [winReward, setWinReward] = useState<number>(0);

  // --- Voice Mic & Local Device Music Player State (تشغيل أغاني من جهازه) ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);
  const musicModalRef = useRef<HTMLDivElement | null>(null);
  const [musicTrackName, setMusicTrackName] = useState<string | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.7);
  const [musicCurrentTime, setMusicCurrentTime] = useState<number>(0);
  const [musicDuration, setMusicDuration] = useState<number>(0);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState<boolean>(false);
  const [isMusicMinimized, setIsMusicMinimized] = useState<boolean>(false);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);

  // --- Room Authority, Moderation & Permissions (Host & Deputy) ---
  const [roomHostId, setRoomHostId] = useState<string>(queryHostId);
  const [roomHostName, setRoomHostName] = useState<string>(queryHostName);
  const [roomHostAvatar, setRoomHostAvatar] = useState<string>(queryHostAvatar);
  const [roomDeputyId, setRoomDeputyId] = useState<string | null>(null);
  const [moderatorIds, setModeratorIds] = useState<string[]>([]);
  const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);
  const [bannedUserIds, setBannedUserIds] = useState<string[]>([]);
  const [roomMicMode, setRoomMicMode] = useState<'all' | 'admins_only'>('all');
  const [selectedUserForModeration, setSelectedUserForModeration] = useState<{
    id: string;
    name: string;
    avatar: string;
    seatColor?: PlayerColor;
    isSpectator?: boolean;
    isBot?: boolean;
    isHost?: boolean;
    isDeputy?: boolean;
    isMuted?: boolean;
  } | null>(null);

  // 4 Table Seats (Blue, Green, Red, Yellow)
  interface RoomSeatUser {
    id: string;
    name: string;
    avatar: string;
    isBot: boolean;
    isHost?: boolean;
    isDeputy?: boolean;
    isMuted?: boolean;
  }

  const [tableSeats, setTableSeats] = useState<{ [key in PlayerColor]: RoomSeatUser | null }>({
    blue: {
      id: queryUserId || '12842582',
      name: queryUsername || 'Ali',
      avatar: queryAvatar || '/laugh_emote.png',
      isBot: false,
      isHost: queryIsHost,
      isDeputy: false,
      isMuted: false,
    },
    green: null,
    red: null,
    yellow: null,
  });

  const MicIcon = ({ muted = false, className = 'w-3.5 h-3.5' }: { muted?: boolean; className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      {muted && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );

  // Spectator Voice Seats (6 seats)
  const [spectatorSeats, setSpectatorSeats] = useState<Array<{ id: string; name: string; avatar: string; isMicOn: boolean; isDeputy?: boolean; isMuted?: boolean }>>([
    { id: 'spec-1', name: 'البرنس حامد', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Hamed', isMicOn: true, isMuted: false },
    { id: 'spec-2', name: 'حنين نورتي', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Haneen', isMicOn: false, isMuted: false },
    { id: 'spec-3', name: 'صقر دبي', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Saqr', isMicOn: true, isMuted: false },
  ]);

  // Interactive 6 Top Voice Mic Seats (التنقل بين مقاعد المايك بحرية)
  type VoiceMicSlot = {
    id: string;
    name: string;
    avatar: string;
    isHost?: boolean;
    isDeputy?: boolean;
  } | null;

  const [voiceMicSlots, setVoiceMicSlots] = useState<VoiceMicSlot[]>(() => [
    null,
    null,
    null,
    { id: 'spec-sahir', name: 'الساحر', avatar: '/laugh_emote.png' },
    { id: queryHostId, name: queryHostName, avatar: queryHostAvatar || '/laugh_emote.png', isHost: true },
    { id: 'spec-mahmoud', name: 'محمود', avatar: '/kaizen_emoji_pack.png' },
  ]);

  const handleTakeVoiceSeat = (slotIndex: number) => {
    if (roomMicMode === 'admins_only' && !canAccessSettings) {
      setStatusMessage(lang === 'ar' ? '👑 المايك مقتصر على المشرفين حالياً!' : '👑 Mic is currently admins-only!');
      return;
    }
    const myId = userProfile?.id || '12842582';
    const myName = userProfile?.username || 'Ali';
    const myAvatar = userProfile?.avatar_url || '/laugh_emote.png';

    setVoiceMicSlots(prev => {
      const next = prev.map(s => (s && s.id === myId ? null : s));
      next[slotIndex] = {
        id: myId,
        name: myName,
        avatar: myAvatar,
        isHost,
        isDeputy,
      };
      return next;
    });
    setStatusMessage(
      lang === 'ar'
        ? `🎤 تم انتقالك إلى مقعد المايك رقم ${slotIndex + 1}`
        : `🎤 Moved to voice mic seat #${slotIndex + 1}`
    );
    addChatMessage(
      lang === 'ar' ? `🎤 صعد ${myName} إلى مقعد المايك رقم ${slotIndex + 1}` : `🎤 ${myName} moved to mic seat #${slotIndex + 1}`,
      'system'
    );
  };

  const handleLeaveVoiceSeat = () => {
    const myId = userProfile?.id || '12842582';
    setVoiceMicSlots(prev => prev.map(s => (s && s.id === myId ? null : s)));
    setStatusMessage(lang === 'ar' ? '⬇️ نزلت من مقعد المايك' : '⬇️ Left voice mic seat');
  };

  // 👥 Friend Requests State (إضافة الأصدقاء)
  const [sentFriendRequests, setSentFriendRequests] = useState<string[]>([]);

  const handleSendFriendRequest = (targetUserId: string, targetUserName: string) => {
    if (sentFriendRequests.includes(targetUserId)) {
      setStatusMessage(
        lang === 'ar'
          ? `🤝 تم إرسال طلب الصداقة إلى ${targetUserName} مسبقاً`
          : `Friend request already sent to ${targetUserName}`
      );
      return;
    }
    setSentFriendRequests(prev => [...prev, targetUserId]);
    playGiftSound('chime');
    setStatusMessage(
      lang === 'ar'
        ? `🤝 تم إرسال طلب صداقة إلى ${targetUserName}`
        : `Sent friend request to ${targetUserName}`
    );
    addChatMessage(
      lang === 'ar'
        ? `🤝 أرسلت طلب صداقة إلى ${targetUserName}.`
        : `Sent friend request to ${targetUserName}.`,
      'system'
    );
  };

  // Anti-Refresh & Anti-Swipe-Down Protection inside the game
  useEffect(() => {
    // 1. Prevent beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Prevent F5 & Ctrl+R
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F5' ||
        (e.ctrlKey && (e.key === 'r' || e.key === 'R')) ||
        (e.metaKey && (e.key === 'r' || e.key === 'R'))
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 3. Block mobile browser pull-to-refresh swipe down
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        const touchY = e.touches[0].clientY;
        const diff = touchY - touchStartY;
        if (diff > 0 && window.scrollY <= 1) {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const formatMusicTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMusicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.[^/.]+$/, '');
        setMusicTrackName(name);
        setIsMusicMinimized(true);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.volume = musicVolume;
          audioRef.current.play()
            .then(() => {
              setIsPlayingMusic(true);
              setIsMusicModalOpen(true);
            })
            .catch(err => {
              console.log('Audio autoplay prevented:', err);
              setIsPlayingMusic(false);
              setIsMusicModalOpen(true);
            });
        }
      } catch (err) {
        console.error('Failed to load music file:', err);
      }
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current || !audioRef.current.src) {
      musicFileInputRef.current?.click();
      return;
    }
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlayingMusic(true))
        .catch(console.error);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setMusicVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const toggleMic = () => {
    setIsMicOn(prev => !prev);
  };

  // Listen to audio element timeupdate and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setMusicCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setMusicDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlayingMusic(false);
      setMusicCurrentTime(0);
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Auto-minimize music player when clicking outside anywhere on screen
  useEffect(() => {
    if (!isMusicModalOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (musicModalRef.current && !musicModalRef.current.contains(e.target as Node)) {
        setIsMusicModalOpen(false);
        setIsMusicMinimized(true);
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('touchstart', handleClickOutside);
    }, 150);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMusicModalOpen]);

  // User Click Handler (Opens Moderation for Admins, Profile for users)
  const handleUserClick = (target: {
    id: string;
    name: string;
    avatar: string;
    seatColor?: PlayerColor;
    isSpectator?: boolean;
    isBot?: boolean;
    isHost?: boolean;
    isDeputy?: boolean;
    isMuted?: boolean;
    isMicOn?: boolean;
  }) => {
    if (target.id === userProfile?.id) {
      toggleMic();
      return;
    }
    const isTargetDeputy = moderatorIds.includes(target.id) || target.id === roomDeputyId || target.isDeputy;
    const isTargetMuted = mutedUserIds.includes(target.id) || target.isMuted;
    setSelectedUserForModeration({
      ...target,
      isDeputy: isTargetDeputy,
      isMuted: isTargetMuted,
      isHost: target.id === roomHostId || target.isHost,
    });
  };

  const handleToggleMuteUser = (userId: string) => {
    setMutedUserIds(prev => {
      const isAlreadyMuted = prev.includes(userId);
      const next = isAlreadyMuted ? prev.filter(id => id !== userId) : [...prev, userId];
      const targetName = selectedUserForModeration?.name || 'المستخدم';
      addChatMessage(
        isAlreadyMuted
          ? (lang === 'ar' ? `🎙️ تم إلغاء كتم صوت ${targetName}` : `Unmuted ${targetName}`)
          : (lang === 'ar' ? `🔇 تم كتم صوت ${targetName} بواسطة المشرف` : `Muted ${targetName} by admin`),
        'system'
      );
      return next;
    });
    setSelectedUserForModeration(null);
  };

  const handleToggleAdminUser = (userId: string) => {
    setModeratorIds(prev => {
      const isAlreadyAdmin = prev.includes(userId);
      const next = isAlreadyAdmin ? prev.filter(id => id !== userId) : [...prev, userId];
      const targetName = selectedUserForModeration?.name || 'المستخدم';
      addChatMessage(
        isAlreadyAdmin
          ? (lang === 'ar' ? `تم سحب رتبة الإشراف من ${targetName}` : `Revoked admin from ${targetName}`)
          : (lang === 'ar' ? `👑 تم منح رتبة مشرف لـ ${targetName}!` : `Granted admin to ${targetName}!`),
        'system'
      );
      return next;
    });
    setSelectedUserForModeration(null);
  };

  const handleKickUser = (userId: string) => {
    const targetName = selectedUserForModeration?.name || 'المستخدم';
    if (selectedUserForModeration?.seatColor) {
      setTableSeats(prev => ({
        ...prev,
        [selectedUserForModeration.seatColor!]: null,
      }));
    }
    setSpectatorSeats(prev => prev.filter(s => s.id !== userId));
    addChatMessage(lang === 'ar' ? `🚪 تم طرد ${targetName} من الغرفة بواسطة المشرف` : `Kicked ${targetName} from room`, 'system');
    setSelectedUserForModeration(null);
  };

  const handleBlockUser = (userId: string) => {
    const targetName = selectedUserForModeration?.name || 'المستخدم';
    setBannedUserIds(prev => [...prev, userId]);
    handleKickUser(userId);
    addChatMessage(lang === 'ar' ? `⛔ تم حظر ${targetName} ومنعه من الغرفة` : `Banned ${targetName} from room`, 'system');
  };

  // --- Persistent Head-to-Head & Coins ---
  const [playerCoins, setPlayerCoins] = useState<number>(500);
  const [floatingCoinText, setFloatingCoinText] = useState<{ player: PlayerColor; text: string } | null>(null);

  const [h2hRecord, setH2hRecord] = useState<H2HRecord>({
    totalMatches: 0,
    playerWins: 0,
    opponentWins: 0,
    byColor: { red: 0, green: 0, yellow: 0 },
    streak: 0,
    history: []
  });

  const [showH2HModal, setShowH2HModal] = useState<boolean>(false);

  // --- Gift Box & Reactions State ---
  const [selectedGiftTarget, setSelectedGiftTarget] = useState<PlayerColor | null>(null);
  const [giftCategoryTab, setGiftCategoryTab] = useState<'prank' | 'friendly'>('prank');
  const [flyingGift, setFlyingGift] = useState<{
    id: string;
    from: PlayerColor;
    to: PlayerColor;
    icon: string;
    name: string;
  } | null>(null);

  const [activeImpacts, setActiveImpacts] = useState<{
    [key in PlayerColor]?: {
      icon: string;
      title: string;
      fromName: string;
      effect: string;
      id: number;
    };
  }>({});

  const [playerConfig, setPlayerConfig] = useState<{ [key in PlayerColor]: 'human' | 'bot' | 'none' }>(() => {
    if (queryRole === 'spectator') {
      if (initialPlayerCount === 2) {
        return { blue: 'bot', green: 'bot', red: 'none', yellow: 'none' };
      }
      return { blue: 'bot', green: 'bot', red: 'bot', yellow: 'bot' };
    }
    if (initialPlayerCount === 2) {
      return { blue: 'human', green: 'bot', red: 'none', yellow: 'none' };
    }
    return { blue: 'human', green: 'bot', red: 'bot', yellow: 'bot' };
  });

  const [userProfile, setUserProfile] = useState<any>(() => {
    return {
      id: queryUserId || '12842582',
      username: queryUsername || (lang === 'ar' ? 'Ali' : 'Ali'),
      avatar_url: queryAvatar || null,
    };
  });

  // Load Coins & H2H from localStorage
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem('ludo_coins_balance');
      if (savedCoins) {
        setPlayerCoins(parseInt(savedCoins, 10) || 500);
      } else {
        localStorage.setItem('ludo_coins_balance', '500');
      }

      const savedH2H = localStorage.getItem('ludo_h2h_record');
      if (savedH2H) {
        const parsed = JSON.parse(savedH2H);
        if (parsed && typeof parsed.totalMatches === 'number') {
          setH2hRecord(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading ludo persistent data:', e);
    }
  }, []);

  // Listen for host postMessage (embed integration)
  useEffect(() => {
    const handleHostMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'SET_USER') {
          setUserProfile({
            id: event.data.userId || 'guest',
            username: event.data.username || 'Champion',
            avatar_url: event.data.avatarUrl || null,
          });
        } else if (event.data.type === 'RESET_GAME') {
          resetGame();
        }
      }
    };
    window.addEventListener('message', handleHostMessage);
    return () => window.removeEventListener('message', handleHostMessage);
  }, []);

  const [tokens, setTokens] = useState<Token[]>(() => {
    const initial: Token[] = [];
    const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
    for (const color of colors) {
      for (let i = 0; i < 4; i++) {
        initial.push({ id: `${color}-${i}`, color, position: -1 });
      }
    }
    return initial;
  });

  const [diceValues, setDiceValues] = useState<{ [key in PlayerColor]: number }>({
    red: 6,
    green: 6,
    blue: 6,
    yellow: 6,
  });
  const [rollingDicePlayer, setRollingDicePlayer] = useState<PlayerColor | null>(null);
  const [turn, setTurn] = useState<PlayerColor>('blue'); // You (blue) start first

  const handleTokenClickRef = useRef<(token: Token) => void>(() => { });

  const [playerEmotes, setPlayerEmotes] = useState<{
    [key in PlayerColor]: {
      character: 'wizard' | 'iron_hero' | 'ranger' | null;
      message: string;
      active: boolean;
    }
  }>({
    red: { character: null, message: '', active: false },
    green: { character: null, message: '', active: false },
    blue: { character: null, message: '', active: false },
    yellow: { character: null, message: '', active: false },
  });

  const triggerPlayerEmote = (player: PlayerColor, character: 'wizard' | 'iron_hero' | 'ranger') => {
    const messages = {
      wizard: lang === 'ar' ? 'سحر أسطوري! 🧙‍♂️✨' : 'Mythical Magic! 🧙‍♂️✨',
      iron_hero: lang === 'ar' ? 'دفاع حديدي لا يُقهر! 🛡️⚡' : 'Invincible Iron Defense! 🛡️⚡',
      ranger: lang === 'ar' ? 'سهم في الصميم! 🏹🎯' : 'Bullseye strike! 🏹🎯',
    };

    setPlayerEmotes(prev => ({
      ...prev,
      [player]: {
        character,
        message: messages[character],
        active: true
      }
    }));

    setTimeout(() => {
      setPlayerEmotes(prev => ({
        ...prev,
        [player]: {
          ...prev[player],
          active: false,
          character: null
        }
      }));
    }, 3000);
  };

  const [extraRolls, setExtraRolls] = useState<number>(0);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    lang === 'ar' ? '🎲 دورك الآن! اضغط على النرد للعب.' : '🎲 Your turn! Click your dice to roll.'
  );

  // Live Room Ticker & Bottom Interaction States (Yalla Ludo Style)
  const [chatTab, setChatTab] = useState<'all' | 'gift' | 'news'>('all');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; user?: string; text: string; type: 'chat' | 'gift' | 'system' | 'news' }>>([
    { id: '1', text: '🎮 مرحباً بكم في غرفة لودو الممالك الرسمية!', type: 'system' },
    { id: '2', user: 'حنين', text: 'نورتى الغرفة يا علي ✨', type: 'chat' },
    { id: '3', text: '🏆 البطولة بدأت، نرد الحظ في الميدان!', type: 'news' }
  ]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [showEmotesBar, setShowEmotesBar] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [quickInputText, setQuickInputText] = useState('');

  const addChatMessage = (text: string, type: 'chat' | 'gift' | 'system' | 'news' = 'system', user?: string) => {
    setChatMessages(prev => [{ id: Date.now().toString(), text, type: type as any, user }, ...prev.slice(0, 19)]);
  };

  const getPlayerName = (color: PlayerColor) => {
    if (playerConfig[color] === 'human') {
      if (color === 'blue') return userProfile?.username || (lang === 'ar' ? 'أنت (الأزرق)' : 'You (Blue)');
      if (color === 'red') return lang === 'ar' ? 'اللاعب 2 (الأحمر)' : 'Player 2 (Red)';
      if (color === 'green') return lang === 'ar' ? 'اللاعب 3 (الأخضر)' : 'Player 3 (Green)';
      return lang === 'ar' ? 'اللاعب 4 (الأصفر)' : 'Player 4 (Yellow)';
    } else if (playerConfig[color] === 'bot') {
      if (color === 'red') return lang === 'ar' ? 'الأحمر (روبوت)' : 'Red (Bot)';
      if (color === 'green') return lang === 'ar' ? 'الأخضر (روبوت)' : 'Green (Bot)';
      if (color === 'yellow') return lang === 'ar' ? 'الأصفر (روبوت)' : 'Yellow (Bot)';
      return lang === 'ar' ? 'الأزرق (روبوت)' : 'Blue (Bot)';
    }
    return '';
  };

  const getNextActivePlayer = (current: PlayerColor): PlayerColor => {
    const sequence: PlayerColor[] = ['blue', 'red', 'green', 'yellow'];
    let idx = sequence.indexOf(current);
    for (let i = 1; i <= 4; i++) {
      const nextColor = sequence[(idx + i) % 4];
      if (playerConfig[nextColor] !== 'none') {
        return nextColor;
      }
    }
    return current;
  };

  const startGame = () => {
    try {
      setGameStarted(true);
      const isSpectator = userRole === 'spectator';
      const config: { [key in PlayerColor]: 'human' | 'bot' | 'none' } = {
        blue: isSpectator ? 'bot' : 'human',
        green: 'none',
        red: 'none',
        yellow: 'none',
      };

      if (playerCount === 2) {
        config.green = 'bot'; // Opposite player
      } else if (playerCount === 3) {
        config.green = 'bot';
        config.red = 'bot';
      } else {
        config.green = 'bot';
        config.red = 'bot';
        config.yellow = 'bot';
      }

      setPlayerConfig(config);
      setTurn('blue');
      setConsecutiveSixes(0);
      setExtraRolls(0);
      setWinner(null);
      setWinReward(0);
      setRollingDicePlayer(null);
      setGameState('waiting_roll');
      isAnimatingRef.current = false;
      setIsAnimating(false);
      setFootprints([]);

      // Reset tokens
      setTokens(() => {
        const initial: Token[] = [];
        const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
        for (const color of colors) {
          for (let i = 0; i < 4; i++) {
            initial.push({ id: `${color}-${i}`, color, position: -1 });
          }
        }
        return initial;
      });

      setGameStarted(true);
      setStatusMessage(
        isSpectator
          ? (lang === 'ar' ? '🎙️ أنت في مقاعد المتفرجين على المايك! يمكنك إرسال الهدايا وتشجيع اللاعبين.' : '🎙️ You are spectating from the mic seats! Send gifts & cheer!')
          : (lang === 'ar' ? '⚔️ بدأت المعركة! دورك الآن، ارمِ النرد لتحريك مقاتليك.' : '⚔️ Match started! Your turn, roll dice to move.')
      );
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const returnToRoom = () => {
    try {
      localStorage.removeItem('ludo_active_match_session');
    } catch (e) {}
    setWinner(null);
    setWinReward(0);
    setGameStarted(false);
    setLobbyView('active_room');
    setGameState('waiting_roll');
    setTurn('blue');
    setRollingDicePlayer(null);
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setFootprints([]);
  };

  const resetGame = () => {
    try {
      localStorage.removeItem('ludo_active_match_session');
    } catch (e) {}
    returnToRoom();
  };

  const handleExitGame = () => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'CLOSE_GAME' }, '*');
    } else {
      resetGame();
    }
  };

  const isHost = userProfile?.id === roomHostId;
  const isDeputy = userProfile?.id === roomDeputyId || (userProfile?.id ? moderatorIds.includes(userProfile.id) : false);
  const canAccessSettings = isHost || isDeputy;
  const canControlMatch = isHost || isDeputy;

  const joinRoomFromList = (room: PublicLudoRoom, role: 'player' | 'spectator') => {
    setRoomTitle(lang === 'ar' ? room.nameAr : room.nameEn);
    setRoomStake(room.entryFee);
    setRoomHostId(room.id);
    setRoomHostName(room.hostName);
    setRoomHostAvatar(room.hostAvatar);
    setUserRole(role);
    setPlayerCount(room.playerCount);
    setPieceCount(room.modeType === 'blitz' ? 2 : 4);
    setRoomDeputyId(null);

    if (role === 'player') {
      setTableSeats({
        blue: { id: room.id, name: room.hostName, avatar: room.hostAvatar, isBot: false, isHost: true, isDeputy: false },
        green: { id: userProfile.id, name: userProfile.username, avatar: userProfile.avatar_url || '/laugh_emote.png', isBot: false, isHost: false, isDeputy: false },
        red: null,
        yellow: null,
      });
    } else {
      setTableSeats({
        blue: { id: room.id, name: room.hostName, avatar: room.hostAvatar, isBot: false, isHost: true, isDeputy: false },
        green: null,
        red: null,
        yellow: null,
      });
      setSpectatorSeats(prev => [
        { id: userProfile.id, name: userProfile.username, avatar: userProfile.avatar_url || '/laugh_emote.png', isMicOn: true },
        ...prev.filter(s => s.id !== userProfile.id)
      ]);
    }
    setLobbyView('active_room');
  };

  const handleCreateCustomRoom = (role: 'player' | 'spectator') => {
    setRoomHostId(userProfile.id);
    setRoomHostName(userProfile.username);
    setRoomHostAvatar(userProfile.avatar_url || '/laugh_emote.png');
    setUserRole(role);
    setRoomDeputyId(null);

    if (role === 'player') {
      setTableSeats({
        blue: { id: userProfile.id, name: userProfile.username, avatar: userProfile.avatar_url || '/laugh_emote.png', isBot: false, isHost: true, isDeputy: false },
        green: null,
        red: null,
        yellow: null,
      });
    } else {
      setTableSeats({
        blue: null,
        green: null,
        red: null,
        yellow: null,
      });
      setSpectatorSeats(prev => [
        { id: userProfile.id, name: userProfile.username, avatar: userProfile.avatar_url || '/laugh_emote.png', isMicOn: true },
        ...prev.filter(s => s.id !== userProfile.id)
      ]);
    }
    setLobbyView('active_room');
  };

  const handleTakePlayerSeat = (color: PlayerColor) => {
    setTableSeats(prev => {
      const next = { ...prev };
      (Object.keys(next) as PlayerColor[]).forEach(k => {
        if (next[k]?.id === userProfile.id) {
          next[k] = null;
        }
      });
      next[color] = {
        id: userProfile.id,
        name: userProfile.username,
        avatar: userProfile.avatar_url || '/laugh_emote.png',
        isBot: false,
        isHost: userProfile.id === roomHostId,
        isDeputy: userProfile.id === roomDeputyId,
      };
      return next;
    });
    setUserRole('player');
  };

  const handleToggleBotOnSeat = (color: PlayerColor) => {
    setTableSeats(prev => {
      const current = prev[color];
      if (current && current.isBot) {
        return { ...prev, [color]: null };
      }
      return {
        ...prev,
        [color]: {
          id: `bot-${color}`,
          name: color === 'green' ? 'محمود (بوت)' : color === 'red' ? 'الساحر (بوت)' : 'صقر (بوت)',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Bot${color}`,
          isBot: true,
          isHost: false,
          isDeputy: false,
        }
      };
    });
  };

  const handleAssignDeputy = (occupantId: string) => {
    if (!isHost) return;
    if (occupantId === roomHostId) return;
    setRoomDeputyId(occupantId);
    setTableSeats(prev => {
      const next = { ...prev };
      (Object.keys(next) as PlayerColor[]).forEach(k => {
        if (next[k]) {
          next[k] = { ...next[k]!, isDeputy: next[k]!.id === occupantId };
        }
      });
      return next;
    });
  };

  const handleJoinSpectatorSeats = () => {
    setTableSeats(prev => {
      const next = { ...prev };
      (Object.keys(next) as PlayerColor[]).forEach(k => {
        if (next[k]?.id === userProfile.id) {
          next[k] = null;
        }
      });
      return next;
    });
    setUserRole('spectator');
    setSpectatorSeats(prev => {
      if (prev.some(s => s.id === userProfile.id)) return prev;
      return [
        { id: userProfile.id, name: userProfile.username, avatar: userProfile.avatar_url || '/laugh_emote.png', isMicOn: true },
        ...prev
      ];
    });
  };

  const startMatchFromRoom = () => {
    const isSpectator = userRole === 'spectator';
    const config: { [key in PlayerColor]: 'human' | 'bot' | 'none' } = {
      blue: 'none',
      green: 'none',
      red: 'none',
      yellow: 'none',
    };

    if (playerCount === 2) {
      config.blue = tableSeats.blue ? (tableSeats.blue.isBot ? 'bot' : (tableSeats.blue.id === userProfile.id && !isSpectator ? 'human' : 'bot')) : 'bot';
      config.green = tableSeats.green ? (tableSeats.green.isBot ? 'bot' : (tableSeats.green.id === userProfile.id && !isSpectator ? 'human' : 'bot')) : 'bot';
      config.red = 'none';
      config.yellow = 'none';
    } else {
      config.blue = tableSeats.blue ? (tableSeats.blue.isBot ? 'bot' : (tableSeats.blue.id === userProfile.id && !isSpectator ? 'human' : 'bot')) : 'bot';
      config.green = tableSeats.green ? (tableSeats.green.isBot ? 'bot' : (tableSeats.green.id === userProfile.id && !isSpectator ? 'human' : 'bot')) : 'bot';
      config.red = tableSeats.red ? (tableSeats.red.isBot ? 'bot' : (tableSeats.red.id === userProfile.id && !isSpectator ? 'human' : 'bot')) : 'bot';
      config.yellow = tableSeats.yellow ? (tableSeats.yellow.isBot ? 'bot' : (tableSeats.yellow.id === userProfile.id && !isSpectator ? 'human' : 'bot')) : 'bot';
    }

    setPlayerConfig(config);
    setGameStarted(true);
    setTurn('blue');
    setConsecutiveSixes(0);
    setExtraRolls(0);
    setWinner(null);
    setWinReward(0);
    setRollingDicePlayer(null);
    setGameState('waiting_roll');
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setFootprints([]);

    setTokens(() => {
      const initial: Token[] = [];
      const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
      for (const color of colors) {
        for (let i = 0; i < 4; i++) {
          initial.push({ id: `${color}-${i}`, color, position: -1 });
        }
      }
      return initial;
    });

    setStatusMessage(
      isSpectator
        ? (lang === 'ar' ? '🎙️ أنت في مقاعد المتفرجين على المايك! يمكنك إرسال الهدايا وتشجيع اللاعبين.' : '🎙️ You are spectating from the mic seats! Send gifts & cheer!')
        : (lang === 'ar' ? '⚔️ بدأت المعركة! دورك الآن، ارمِ النرد لتحريك مقاتليك.' : '⚔️ Match started! Your turn, roll dice to move.')
    );
  };

  // Auto start match when entering room directly with autoStart=true
  useEffect(() => {
    if (queryAutoStart) {
      startMatchFromRoom();
    }
  }, []);

  // Sound Synthesizers (Web Audio API)
  const getAudioContext = () => {
    if (isMuted || typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
  };

  const playGiftSound = (soundType: 'splat' | 'slap' | 'boom' | 'chime' | 'funny') => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (soundType === 'splat') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (soundType === 'slap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (soundType === 'boom') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (soundType === 'chime') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.12, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.28);
        });
      } else if (soundType === 'funny') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(420, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  };

  const playCoinChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  };

  const playDiceRollSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const time = now + i * 0.08 + Math.random() * 0.02;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 - i * 12, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.04);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
        osc.start(time);
        osc.stop(time + 0.05);

        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(1300 + Math.random() * 200, time);
        clickGain.gain.setValueAtTime(0.07, time);
        clickGain.gain.exponentialRampToValueAtTime(0.004, time + 0.025);
        clickOsc.start(time);
        clickOsc.stop(time + 0.03);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const playStepSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
  };

  const playSafeSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) { }
  };

  const playSuccessSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.22);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const playFailSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.32);
    } catch (e) { }
  };

  const playVictorySound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const [gameState, setGameState] = useState<'waiting_roll' | 'waiting_move'>('waiting_roll');
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const [footprints, setFootprints] = useState<{ r: number, c: number, color: PlayerColor, key: string }[]>([]);
  const [showDiceArrow, setShowDiceArrow] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'waiting_roll' && playerConfig[turn] === 'human' && rollingDicePlayer === null && !winner) {
      timer = setTimeout(() => setShowDiceArrow(true), 100);
    } else {
      setShowDiceArrow(false);
    }
    return () => clearTimeout(timer);
  }, [turn, gameState, playerConfig, rollingDicePlayer, winner]);

  // 💾 Restore Active Match Session on Mount (استئناف اللعبة عند الخروج أو التحديث)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('ludo_active_match_session');
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.gameStarted && !data.winner && (Date.now() - (data.timestamp || 0) < 4 * 60 * 60 * 1000)) {
          if (data.tokens && data.tokens.length > 0) setTokens(data.tokens);
          if (data.turn) setTurn(data.turn);
          if (data.gameState) setGameState(data.gameState);
          if (data.diceValues) setDiceValues(data.diceValues);
          if (data.playerConfig) setPlayerConfig(data.playerConfig);
          if (data.playerCount) setPlayerCount(data.playerCount);
          if (data.pieceCount) setPieceCount(data.pieceCount);
          if (data.selectedBoardSkin) setSelectedBoardSkin(data.selectedBoardSkin);
          if (data.tableSeats) setTableSeats(data.tableSeats);
          if (data.roomHostId) setRoomHostId(data.roomHostId);
          if (data.roomHostName) setRoomHostName(data.roomHostName);
          setGameStarted(true);
          setLobbyView('active_room');
          setStatusMessage(
            lang === 'ar'
              ? '🔄 تم استئناف اللعبة السابقة بنجاح من حيث توقفت!'
              : '🔄 Resumed your active match where you left off!'
          );
        }
      }
    } catch (e) {
      console.warn('Could not restore ludo match session', e);
    }
  }, []);

  // 💾 Auto-save Active Match Session on state updates (skip intermediate step animations)
  useEffect(() => {
    if (!gameStarted || winner || isAnimating) {
      if (winner) {
        try { localStorage.removeItem('ludo_active_match_session'); } catch (e) {}
      }
      return;
    }
    try {
      const session = {
        gameStarted: true,
        turn,
        gameState,
        tokens,
        diceValues,
        playerConfig,
        playerCount,
        pieceCount,
        selectedBoardSkin,
        tableSeats,
        roomHostId,
        roomHostName,
        timestamp: Date.now(),
      };
      localStorage.setItem('ludo_active_match_session', JSON.stringify(session));
    } catch (e) {
      console.warn('Could not save ludo match session', e);
    }
  }, [gameStarted, winner, isAnimating, turn, gameState, tokens, diceValues, playerConfig, playerCount, pieceCount, selectedBoardSkin, tableSeats, roomHostId, roomHostName]);

  const getValidMoves = (playerColor: PlayerColor, diceVal: number) => {
    const validTokens: Token[] = [];
    const playerTokens = tokens.filter(t => t.color === playerColor);
    const activeTokens = playerTokens.slice(0, pieceCount);

    activeTokens.forEach(t => {
      if (t.position === -1) {
        if (diceVal === 6) validTokens.push(t);
      } else if (t.position >= 0 && t.position <= 55) {
        const targetPos = t.position + diceVal;
        if (targetPos <= 56) {
          let isBlocked = false;
          if (targetPos <= 50) {
            const absPos = getAbsolutePosition(playerColor, targetPos);
            if (absPos) {
              const pathIndex = (START_INDICES[playerColor] + targetPos) % 52;
              const isSafeCell = SAFE_CELLS.includes(pathIndex);

              if (!isSafeCell) {
                const oppColors: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];
                for (const c of oppColors) {
                  if (c === playerColor) continue;
                  const oppCount = tokens.filter(opp =>
                    opp.color === c &&
                    opp.position >= 0 && opp.position <= 50 &&
                    getAbsolutePosition(opp.color, opp.position)?.r === absPos.r &&
                    getAbsolutePosition(opp.color, opp.position)?.c === absPos.c
                  ).length;
                  if (oppCount >= 2) {
                    isBlocked = true;
                    break;
                  }
                }
              }
            }
          }
          if (!isBlocked) validTokens.push(t);
        }
      }
    });

    return validTokens;
  };

  const finalizeTurnAfterMove = (token: Token, finalPos: number, diceVal: number) => {
    setFootprints([]);
    let ateOpponent = false;
    let justFinished = false;
    let landedOnSafe = false;
    let isGameWon = false;
    let winnerColor: PlayerColor | null = null;

    setTokens(prev => {
      const newTokens = prev.map(t => ({ ...t }));
      const targetToken = newTokens.find(t => t.id === token.id)!;

      if (finalPos >= 0 && finalPos <= 50) {
        const absPos = getAbsolutePosition(targetToken.color, finalPos);
        if (absPos) {
          const pathIndex = (START_INDICES[targetToken.color] + finalPos) % 52;
          const isSafe = SAFE_CELLS.includes(pathIndex);
          if (isSafe) {
            landedOnSafe = true;
          } else {
            const oppGroups: Record<string, Token[]> = {};
            newTokens.forEach(t => {
              if (t.color !== targetToken.color && t.position >= 0 && t.position <= 50) {
                const oPos = getAbsolutePosition(t.color, t.position);
                if (oPos?.r === absPos.r && oPos?.c === absPos.c) {
                  if (!oppGroups[t.color]) oppGroups[t.color] = [];
                  oppGroups[t.color].push(t);
                }
              }
            });

            Object.values(oppGroups).forEach(group => {
              if (group.length === 1) {
                ateOpponent = true;
                group[0].position = -1;
              }
            });
          }
        }
      }

      if (finalPos === 56) {
        justFinished = true;
        const finishedCount = newTokens.filter(t => t.color === targetToken.color && t.position === 56).length;
        if (winRule === 'first' ? finishedCount >= 1 : finishedCount >= pieceCount) {
          isGameWon = true;
          winnerColor = targetToken.color;
        }
      }

      return newTokens;
    });

    setTimeout(() => {
      if (isGameWon && winnerColor) {
        playVictorySound();
        setWinner(winnerColor);
        const isHumanWinner = playerConfig[winnerColor] === 'human';
        const reward = isHumanWinner ? 150 : 50;
        setWinReward(reward);

        // Update Coins in state & localStorage
        setPlayerCoins(prev => {
          const nextCoins = prev + reward;
          try { localStorage.setItem('ludo_coins_balance', nextCoins.toString()); } catch (e) {}
          return nextCoins;
        });

        // Update Persistent Head-to-Head record
        setH2hRecord(prev => {
          const isPlayer = winnerColor === 'blue';
          const newRecord: H2HRecord = {
            totalMatches: prev.totalMatches + 1,
            playerWins: prev.playerWins + (isPlayer ? 1 : 0),
            opponentWins: prev.opponentWins + (isPlayer ? 0 : 1),
            byColor: {
              red: (prev.byColor?.red || 0) + (winnerColor === 'red' ? 1 : 0),
              green: (prev.byColor?.green || 0) + (winnerColor === 'green' ? 1 : 0),
              yellow: (prev.byColor?.yellow || 0) + (winnerColor === 'yellow' ? 1 : 0),
            },
            streak: isPlayer ? (prev.streak || 0) + 1 : 0,
            history: [
              {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                winner: winnerColor as PlayerColor,
                winnerName: getPlayerName(winnerColor as PlayerColor),
                playersCount: playerCount
              },
              ...(prev.history || []).slice(0, 29)
            ]
          };
          try {
            localStorage.setItem('ludo_h2h_record', JSON.stringify(newRecord));
          } catch (e) {}
          return newRecord;
        });
        setStatusMessage(
          lang === 'ar'
            ? `🏆 مبروك! فاز اللاعب ${getPlayerName(winnerColor as PlayerColor)} بالبطولة!`
            : `🏆 Congratulations! ${getPlayerName(winnerColor as PlayerColor)} won the match!`
        );

        // Notify parent iframe host
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'LUDO_GAME_OVER',
            winner: winnerColor,
            winnerName: getPlayerName(winnerColor),
            isHuman: playerConfig[winnerColor] === 'human',
            coins: reward,
          }, '*');
        }

        isAnimatingRef.current = false;
        setIsAnimating(false);
        return;
      }

      let earnedExtraRolls = 0;
      if (ateOpponent) earnedExtraRolls++;
      if (justFinished) earnedExtraRolls++;
      if (diceVal === 6) earnedExtraRolls++;

      const newExtraRolls = extraRolls + earnedExtraRolls;

      if (ateOpponent) {
        playSuccessSound();
        setStatusMessage(lang === 'ar' ? `⚔️ تم أكل الخصم! رمية إضافية!` : `⚔️ Ate opponent! Extra roll!`);
      } else if (justFinished) {
        playSuccessSound();
        setStatusMessage(lang === 'ar' ? `🎉 عسكري وصل النهاية! رمية إضافية!` : `🎉 Piece finished! Extra roll!`);
      } else {
        if (landedOnSafe) playSafeSound();
        if (diceVal === 6) {
          setStatusMessage(lang === 'ar' ? `🔥 رمى 6! العب مرة أخرى!` : `🔥 Rolled a 6! Play again!`);
        }
      }

      if (newExtraRolls > 0) {
        setExtraRolls(newExtraRolls - 1);
        if (ateOpponent || justFinished) setConsecutiveSixes(0);
        setGameState('waiting_roll');
      } else {
        const nextPlayer = getNextActivePlayer(turn);
        setTurn(nextPlayer);
        setConsecutiveSixes(0);
        setExtraRolls(0);
        setStatusMessage(lang === 'ar' ? `دور اللاعب التالي...` : `Next player's turn...`);
        setGameState('waiting_roll');
      }

      isAnimatingRef.current = false;
      setIsAnimating(false);
    }, 200);
  };

  const handleTokenClick = (token: Token) => {
    if (gameState !== 'waiting_move' || token.color !== turn || isAnimatingRef.current || winner) return;

    const diceVal = diceValues[turn];
    const validMoves = getValidMoves(turn, diceVal);
    if (!validMoves.find(t => t.id === token.id)) return;

    isAnimatingRef.current = true;
    setIsAnimating(true);
    setFootprints([]);

    if (token.position === -1 && diceVal === 6) {
      setTokens(prev => {
        const newTokens = prev.map(t => ({ ...t }));
        const targetToken = newTokens.find(t => t.id === token.id)!;
        targetToken.position = 0;
        return newTokens;
      });
      playSuccessSound();

      setTimeout(() => {
        finalizeTurnAfterMove(token, 0, diceVal);
      }, 500);
      return;
    }

    let stepsLeft = diceVal;
    let currentPos = token.position;

    const performStep = () => {
      if (stepsLeft === 0) {
        finalizeTurnAfterMove(token, currentPos, diceVal);
        return;
      }

      currentPos++;
      stepsLeft--;

      setTokens(prev => {
        const newTokens = prev.map(t => ({ ...t }));
        const targetToken = newTokens.find(t => t.id === token.id)!;
        targetToken.position = currentPos;
        return newTokens;
      });

      const absPos = getAbsolutePosition(token.color, currentPos);
      if (absPos) {
        setFootprints(prev => [...prev.slice(-1), { ...absPos, color: token.color, key: `${absPos.r}-${absPos.c}-${currentPos}` }]);
      }

      playStepSound();
      setTimeout(performStep, 260);
    };

    performStep();
  };

  handleTokenClickRef.current = handleTokenClick;

  const rollDice = () => {
    if (rollingDicePlayer !== null || gameState !== 'waiting_roll' || isAnimatingRef.current || winner) return;
    setRollingDicePlayer(turn);
    playDiceRollSound();

    setTimeout(() => {
      let finalVal = Math.floor(Math.random() * 6) + 1;

      if (consecutiveSixes === 0) {
        if (finalVal !== 6 && Math.random() < 0.35) finalVal = 6;
      } else if (consecutiveSixes > 0 && finalVal === 6) {
        if (Math.random() < 0.6) finalVal = Math.floor(Math.random() * 5) + 1;
      }
      setDiceValues(prev => ({ ...prev, [turn]: finalVal }));

      if (finalVal === 6) {
        const nextSixes = consecutiveSixes + 1;
        if (nextSixes === 3) {
          setConsecutiveSixes(0);
          setExtraRolls(0);
          setRollingDicePlayer(null);
          playFailSound();
          setStatusMessage(
            lang === 'ar'
              ? `❌ 3 مرات 6 متتالية! حصل ${getPlayerName(turn)} على عقوبة ومُرِّر الدور!`
              : `❌ 3 consecutive sixes! ${getPlayerName(turn)} penalized, turn passed!`
          );

          setTimeout(() => {
            const nextPlayer = getNextActivePlayer(turn);
            setTurn(nextPlayer);
            setConsecutiveSixes(0);
            setExtraRolls(0);
            setGameState('waiting_roll');
          }, 1800);
          return;
        } else {
          setConsecutiveSixes(nextSixes);
        }
      } else {
        setConsecutiveSixes(0);
      }

      setStatusMessage(
        lang === 'ar'
          ? `🎲 حصل ${getPlayerName(turn)} على الرقم ${finalVal}.`
          : `🎲 ${getPlayerName(turn)} rolled a ${finalVal}.`
      );

      const validMoves = getValidMoves(turn, finalVal);
      const allSamePosition = validMoves.length > 0 && validMoves.every(t => t.position === validMoves[0].position);

      if (validMoves.length === 0) {
        setTimeout(() => {
          setRollingDicePlayer(null);
          const newExtraRolls = extraRolls + (finalVal === 6 ? 1 : 0);
          if (newExtraRolls > 0) {
            setExtraRolls(newExtraRolls - 1);
            setStatusMessage(lang === 'ar' ? '🔥 لا يوجد حركة متاحة، العب مرة أخرى!' : '🔥 No valid moves, play again!');
            setGameState('waiting_roll');
          } else {
            const nextPlayer = getNextActivePlayer(turn);
            setTurn(nextPlayer);
            setConsecutiveSixes(0);
            setExtraRolls(0);
            setStatusMessage(lang === 'ar' ? 'دور اللاعب التالي...' : 'Next player turn...');
            setGameState('waiting_roll');
          }
        }, 1500);
      } else if (allSamePosition) {
        setRollingDicePlayer(null);
        setGameState('waiting_move');
        setTimeout(() => {
          handleTokenClickRef.current(validMoves[0]);
        }, 600);
      } else {
        setRollingDicePlayer(null);
        setGameState('waiting_move');
      }
    }, 600);
  };

  // Bot autoplay logic
  useEffect(() => {
    if (gameStarted && playerConfig[turn] === 'bot' && rollingDicePlayer === null && !winner) {
      if (gameState === 'waiting_roll') {
        const timer = setTimeout(() => {
          rollDice();
        }, 1500);
        return () => clearTimeout(timer);
      } else if (gameState === 'waiting_move') {
        const timer = setTimeout(() => {
          const validMoves = getValidMoves(turn, diceValues[turn]);
          if (validMoves.length > 0) {
            const moveOut = validMoves.find(t => t.position === -1);
            handleTokenClick(moveOut || validMoves[Math.floor(Math.random() * validMoves.length)]);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [turn, rollingDicePlayer, gameStarted, playerConfig, gameState, diceValues, winner]);

  // ⏱️ Fast Turn Countdown Timer (10 seconds total, CSS-driven 60fps ring + single timeout for zero React re-renders)
  const TURN_TIMEOUT_SECONDS = 10;

  useEffect(() => {
    if (!gameStarted || winner || isAnimating) return;

    const timeout = setTimeout(() => {
      // Auto-roll if waiting for roll
      if (gameState === 'waiting_roll' && rollingDicePlayer === null) {
        rollDice();
      } else if (gameState === 'waiting_move') {
        // Auto-move best token
        const validMoves = getValidMoves(turn, diceValues[turn]);
        if (validMoves.length > 0) {
          const moveOut = validMoves.find(t => t.position === -1);
          handleTokenClick(moveOut || validMoves[0]);
        } else {
          // Pass turn if no moves
          const nextPlayer = getNextActivePlayer(turn);
          setTurn(nextPlayer);
          setConsecutiveSixes(0);
          setExtraRolls(0);
          setGameState('waiting_roll');
        }
      }
    }, TURN_TIMEOUT_SECONDS * 1000);

    return () => clearTimeout(timeout);
  }, [gameStarted, winner, isAnimating, gameState, rollingDicePlayer, turn, diceValues]);

  const ThemedLudoToken = ({ color, isSelectable = false, isAtHome = false }: { color: string; isSelectable?: boolean; isAtHome?: boolean }) => {
    const theme = selectedBoardSkin || 'classic';
    const tokenSizeClass = isAtHome ? 'w-[86%] h-[88%] translate-y-0' : 'w-[100%] h-[106%] translate-y-0';

    // 1. CLASSIC THEME (Traditional 3D Royal Ludo Pawn - Identical to User's Reference Photo)
    if (theme === 'classic') {
      const cfg = ({
        blue: {
          sLight: '#93c5fd', sMid: '#2563eb', sDark: '#1e3a8a', sDeep: '#0f172a',
          cLight: '#60a5fa', cDark: '#1d4ed8', cDeep: '#0f172a',
          bLight: '#93c5fd', bDark: '#1e40af'
        },
        red: {
          sLight: '#fca5a5', sMid: '#dc2626', sDark: '#991b1b', sDeep: '#450a0a',
          cLight: '#f87171', cDark: '#b91c1c', cDeep: '#450a0a',
          bLight: '#fca5a5', bDark: '#991b1b'
        },
        green: {
          sLight: '#86efac', sMid: '#16a34a', sDark: '#15803d', sDeep: '#052e16',
          cLight: '#4ade80', cDark: '#166534', cDeep: '#052e16',
          bLight: '#86efac', bDark: '#14532d'
        },
        yellow: {
          sLight: '#fef08a', sMid: '#eab308', sDark: '#ca8a04', sDeep: '#451a03',
          cLight: '#facc15', cDark: '#a16207', cDeep: '#451a03',
          bLight: '#fef08a', bDark: '#854d0e'
        }
      } as Record<string, any>)[color] || {
        sLight: '#93c5fd', sMid: '#2563eb', sDark: '#1e3a8a', sDeep: '#0f172a',
        cLight: '#60a5fa', cDark: '#1d4ed8', cDeep: '#0f172a',
        bLight: '#93c5fd', bDark: '#1e40af'
      };

      const uid = 'cls_' + color;

      return (
        <div
          className={`relative ${tokenSizeClass} flex items-center justify-center transition-transform duration-200 select-none overflow-visible pointer-events-auto ${
            isSelectable ? 'animate-bounce z-30 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]' : ''
          }`}
        >
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id={`${uid}-gnd`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.7)" />
                <stop offset="60%" stopColor="rgba(0,0,0,0.35)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <radialGradient id={`${uid}-head`} cx="35%" cy="28%" r="65%" fx="32%" fy="24%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="18%" stopColor={cfg.sLight} />
                <stop offset="55%" stopColor={cfg.sMid} />
                <stop offset="85%" stopColor={cfg.sDark} />
                <stop offset="100%" stopColor={cfg.sDeep} />
              </radialGradient>
              <linearGradient id={`${uid}-collar`} x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="30%" stopColor={cfg.sLight} />
                <stop offset="70%" stopColor={cfg.cDark} />
                <stop offset="100%" stopColor={cfg.sDeep} />
              </linearGradient>
              <linearGradient id={`${uid}-cone`} x1="15%" y1="30%" x2="85%" y2="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="15%" stopColor={cfg.cLight} />
                <stop offset="55%" stopColor={cfg.sMid} />
                <stop offset="85%" stopColor={cfg.cDark} />
                <stop offset="100%" stopColor={cfg.cDeep} />
              </linearGradient>
              <linearGradient id={`${uid}-base`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={cfg.bLight} />
                <stop offset="40%" stopColor={cfg.sMid} />
                <stop offset="80%" stopColor={cfg.bDark} />
                <stop offset="100%" stopColor={cfg.cDeep} />
              </linearGradient>
              <radialGradient id={`${uid}-rim`} cx="45%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="40%" stopColor={cfg.sLight} />
                <stop offset="85%" stopColor={cfg.cDark} />
                <stop offset="100%" stopColor={cfg.cDeep} />
              </radialGradient>
            </defs>

            {/* Selectable Pulsing Base Aura */}
            {isSelectable && (
              <ellipse cx="50" cy="133" rx="42" ry="9" fill="rgba(250,204,21,0.3)" stroke="#facc15" strokeWidth="2.5" />
            )}

            {/* Floor Drop Shadow */}
            <ellipse cx="50" cy="133" rx="38" ry="7.5" fill={`url(#${uid}-gnd)`} />

            {/* Flared Base Rim (Thick Pedestal Edge) */}
            <path d="M 12 121 C 12 116, 88 116, 88 121 L 86 128 C 86 133, 14 133, 14 128 Z" fill={`url(#${uid}-base)`} />
            <ellipse cx="50" cy="121" rx="38" ry="8" fill={`url(#${uid}-rim)`} />
            <ellipse cx="50" cy="119" rx="34" ry="6.5" fill={`url(#${uid}-cone)`} opacity="0.8" />

            {/* Flared Conical Body (Tapered from Neck to Base) */}
            <path d="M 38 52 C 38 75, 16 108, 16 120 C 35 125, 65 125, 84 120 C 84 108, 62 75, 62 52 Z" fill={`url(#${uid}-cone)`} />

            {/* 3D Surface Curved Gloss Sheen */}
            <path d="M 40 54 C 39 72, 23 100, 21 118 C 27 120, 37 120, 35 117 C 37 98, 48 72, 47 54 Z" fill="white" opacity="0.38" />
            <path d="M 41 55 C 40 70, 27 95, 26 114 C 28 115, 32 115, 33 113 C 35 96, 44 70, 44 55 Z" fill="white" opacity="0.55" />

            {/* Subtle Royal Gold Crown Crest on Chest */}
            <g transform="translate(42, 86) scale(0.68)">
              <path d="M 2 12 L 0 3 L 4.5 7 L 12 0 L 19.5 7 L 24 3 L 22 12 Z" fill="#fbbf24" opacity="0.9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
              <circle cx="12" cy="14.5" r="1.8" fill="#fde047" />
            </g>

            {/* Sculpted Torus Collar Ring */}
            <ellipse cx="50" cy="53" rx="16" ry="5" fill={`url(#${uid}-collar)`} />
            <ellipse cx="50" cy="51.5" rx="14" ry="3.5" fill={`url(#${uid}-head)`} opacity="0.65" />
            <path d="M 36 52 C 38 50, 48 49, 52 49 C 48 51, 38 52, 36 52 Z" fill="white" opacity="0.75" />

            {/* Large 3D Spherical Head (مطابق تماماً لصورة المستخدم) */}
            <circle cx="50" cy="28" r="23" fill={`url(#${uid}-head)`} />

            {/* Specular Highlights on Sphere */}
            <ellipse cx="42" cy="19" rx="8.5" ry="5.5" transform="rotate(-32 42 19)" fill="white" opacity="0.88" />
            <circle cx="38" cy="16" r="3" fill="white" opacity="0.95" />
            <path d="M 58 43 C 65 38, 70 30, 68 20 C 72 26, 70 36, 62 45 Z" fill="white" opacity="0.22" />

            {/* Selectable Floating Indicator Arrow on top */}
            {isSelectable && (
              <polygon points="50,0 44,-7 56,-7" fill="#facc15" filter="drop-shadow(0 0 4px #facc15)" />
            )}
          </svg>
        </div>
      );
    }

    // 2. UNDERWATER ATLANTEAN PAWN
    if (theme === 'underwater') {
      const cfg = ({
        blue: { light: '#67e8f9', dark: '#0891b2', deep: '#083344', glow: '#06b6d4', gem: '#a5f3fc' },
        red: { light: '#fda4af', dark: '#e11d48', deep: '#4c0519', glow: '#f43f5e', gem: '#ffe4e6' },
        green: { light: '#6ee7b7', dark: '#059669', deep: '#022c22', glow: '#10b981', gem: '#a7f3d0' },
        yellow: { light: '#fde047', dark: '#d97706', deep: '#451a03', glow: '#f59e0b', gem: '#fef08a' }
      } as Record<string, any>)[color] || {
        light: '#67e8f9', dark: '#0891b2', deep: '#083344', glow: '#06b6d4', gem: '#a5f3fc'
      };

      const uid = 'und_' + color;

      return (
        <div
          className={`relative ${tokenSizeClass} flex items-center justify-center select-none overflow-visible pointer-events-auto ${
            isSelectable ? 'animate-bounce z-30 drop-shadow-[0_0_6px_rgba(250,204,21,0.9)]' : ''
          }`}
        >
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id={`${uid}-gnd`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.7)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <radialGradient id={`${uid}-pearl`} cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor={cfg.gem} />
                <stop offset="60%" stopColor={cfg.light} />
                <stop offset="85%" stopColor={cfg.dark} />
                <stop offset="100%" stopColor={cfg.deep} />
              </radialGradient>
              <linearGradient id={`${uid}-body`} x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor={cfg.light} />
                <stop offset="50%" stopColor={cfg.dark} />
                <stop offset="100%" stopColor={cfg.deep} />
              </linearGradient>
              <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="80%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {isSelectable && (
              <ellipse cx="50" cy="134" rx="42" ry="9" fill="rgba(6,182,212,0.3)" stroke="#22d3ee" strokeWidth="2.5" />
            )}

            {/* Ocean Floor Shadow */}
            <ellipse cx="50" cy="134" rx="38" ry="7.5" fill={`url(#${uid}-gnd)`} />

            {/* Scalloped Ocean Pedestal Base */}
            <path d="M 12 122 C 16 115, 84 115, 88 122 L 86 129 C 80 134, 20 134, 14 129 Z" fill={`url(#${uid}-body)`} />
            <ellipse cx="50" cy="122" rx="38" ry="8" fill={cfg.dark} stroke={cfg.light} strokeWidth="1.5" />

            {/* Fluted Marine Armor Torso */}
            <path d="M 36 54 C 36 78, 15 106, 15 122 C 34 126, 66 126, 85 122 C 85 106, 64 78, 64 54 Z" fill={`url(#${uid}-body)`} />

            {/* Hydrodynamic Wave Flutes & Shell Ridges */}
            <path d="M 44 56 C 44 80, 31 108, 29 123" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.4" />
            <path d="M 56 56 C 56 80, 69 108, 71 123" stroke={cfg.deep} strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
            <path d="M 23 95 C 17 108, 16 118, 16 122" stroke={cfg.gem} strokeWidth="2.2" opacity="0.65" />
            <path d="M 77 95 C 83 108, 84 118, 84 122" stroke={cfg.deep} strokeWidth="2.2" opacity="0.65" />

            {/* Center Golden Neptune Trident Embossed on Breastplate */}
            <g transform="translate(38, 72) scale(1)">
              <path d="M 12 2 L 12 30" stroke={`url(#${uid}-gold)`} strokeWidth="3" strokeLinecap="round" />
              <path d="M 4 8 C 4 18, 20 18, 20 8" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="2.8" strokeLinecap="round" />
              <path d="M 4 4 L 4 8 M 20 4 L 20 8" stroke={`url(#${uid}-gold)`} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="2" r="2" fill="#fef08a" />
            </g>

            {/* Pearl Collar Ring with Wave Crest */}
            <ellipse cx="50" cy="53" rx="16" ry="5.5" fill={cfg.light} stroke={cfg.gem} strokeWidth="1.2" filter={`drop-shadow(0 0 6px ${cfg.glow})`} />
            <ellipse cx="50" cy="52" rx="13" ry="3.5" fill={cfg.deep} />

            {/* Glowing Mystic Pearl Sphere Head */}
            <circle cx="50" cy="28" r="23" fill={`url(#${uid}-pearl)`} filter={`drop-shadow(0 0 10px ${cfg.glow})`} />

            {/* Golden Neptune Sea Crown on Top of Pearl */}
            <path d="M 38 12 L 44 4 L 50 8 L 56 4 L 62 12 C 54 9, 46 9, 38 12 Z" fill={`url(#${uid}-gold)`} filter="drop-shadow(0 1px 3px rgba(0,0,0,0.8))" />
            <circle cx="50" cy="8" r="1.5" fill="#ffffff" />

            {/* Shimmering Water Specular Reflection & Bubbles */}
            <ellipse cx="42" cy="19" rx="8" ry="5" transform="rotate(-30 42 19)" fill="white" opacity="0.9" />
            <circle cx="37" cy="16" r="2.5" fill="white" opacity="0.95" />
            <circle cx="60" cy="34" r="3.5" fill="white" opacity="0.35" stroke="white" strokeWidth="0.8" />
            <circle cx="44" cy="38" r="2" fill="white" opacity="0.45" />

            {isSelectable && (
              <polygon points="50,0 44,-7 56,-7" fill="#22d3ee" filter="drop-shadow(0 0 4px #06b6d4)" />
            )}
          </svg>
        </div>
      );
    }

    // 3. ANCIENT EGYPTIAN PHARAONIC PAWN
    if (theme === 'ancient') {
      const cfg = ({
        blue: { light: '#60a5fa', mid: '#2563eb', dark: '#1e3a8a', deep: '#0f172a' },
        red: { light: '#f87171', mid: '#dc2626', dark: '#991b1b', deep: '#450a0a' },
        green: { light: '#4ade80', mid: '#16a34a', dark: '#166534', deep: '#052e16' },
        yellow: { light: '#fde047', mid: '#eab308', dark: '#a16207', deep: '#451a03' }
      } as Record<string, any>)[color] || {
        light: '#60a5fa', mid: '#2563eb', dark: '#1e3a8a', deep: '#0f172a'
      };

      const uid = 'anc_' + color;

      return (
        <div
          className={`relative ${tokenSizeClass} flex items-center justify-center select-none overflow-visible pointer-events-auto ${
            isSelectable ? 'animate-bounce z-30 drop-shadow-[0_0_6px_#f59e0b]' : ''
          }`}
        >
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id={`${uid}-gnd`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.75)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="75%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id={`${uid}-body`} x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor={cfg.light} />
                <stop offset="45%" stopColor={cfg.mid} />
                <stop offset="80%" stopColor={cfg.dark} />
                <stop offset="100%" stopColor={cfg.deep} />
              </linearGradient>
              <radialGradient id={`${uid}-mask`} cx="38%" cy="28%" r="65%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="30%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </radialGradient>
            </defs>

            {isSelectable && (
              <ellipse cx="50" cy="134" rx="42" ry="9" fill="rgba(245,158,11,0.3)" stroke="#f59e0b" strokeWidth="2.5" />
            )}

            {/* Floor Shadow */}
            <ellipse cx="50" cy="134" rx="38" ry="7.5" fill={`url(#${uid}-gnd)`} />

            {/* Sandstone Plinth with Gold Trim */}
            <rect x="14" y="121" width="72" height="11" rx="3" fill={`url(#${uid}-gold)`} stroke="#78350f" strokeWidth="1.2" />
            <ellipse cx="50" cy="121" rx="36" ry="6.5" fill={cfg.dark} />

            {/* Sarcophagus Obelisk Guardian Body */}
            <path d="M 36 55 C 36 76, 17 106, 17 121 C 36 125, 64 125, 83 121 C 83 106, 64 76, 64 55 Z" fill={`url(#${uid}-body)`} />

            {/* Sacred Golden Ankh (☥ مفتاح الحياة) in Center Chest */}
            <g transform="translate(39, 78) scale(0.92)">
              <ellipse cx="12" cy="9" rx="5.5" ry="6.5" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))" />
              <line x1="3" y1="17" x2="21" y2="17" stroke={`url(#${uid}-gold)`} strokeWidth="3" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12" y2="34" stroke={`url(#${uid}-gold)`} strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="12" cy="9" r="2" fill="#ffffff" />
            </g>

            {/* Multi-tier Royal Wesekh Collar (قلادة الويسخ الملكية العريضة) */}
            <path d="M 32 54 C 32 72, 68 72, 68 54 Z" fill={`url(#${uid}-gold)`} />
            <path d="M 36 56 C 36 68, 64 68, 64 56 Z" fill={cfg.dark} />

            {/* Royal Pharaonic Nemes Headdress (خمار النمس الفرعوني الملكي المنسدل على الكتفين) */}
            <path d="M 26 24 C 26 10, 74 10, 74 24 L 78 36 L 68 62 L 60 62 L 64 36 L 36 36 L 40 62 L 32 62 L 22 36 Z" fill={`url(#${uid}-gold)`} filter="drop-shadow(0 3px 5px rgba(0,0,0,0.6))" />
            
            {/* Nemes Shoulder Wings */}
            <polygon points="22,36 32,62 40,62 33,36" fill={`url(#${uid}-gold)`} />
            <line x1="25" y1="42" x2="35" y2="42" stroke={cfg.dark} strokeWidth="2.5" />
            <line x1="28" y1="50" x2="37" y2="50" stroke={cfg.dark} strokeWidth="2.5" />
            <line x1="30" y1="57" x2="39" y2="57" stroke={cfg.dark} strokeWidth="2.5" />

            <polygon points="78,36 68,62 60,62 67,36" fill={`url(#${uid}-gold)`} />
            <line x1="75" y1="42" x2="65" y2="42" stroke={cfg.dark} strokeWidth="2.5" />
            <line x1="72" y1="50" x2="63" y2="50" stroke={cfg.dark} strokeWidth="2.5" />
            <line x1="70" y1="57" x2="61" y2="57" stroke={cfg.dark} strokeWidth="2.5" />

            {/* Golden Royal Mask / Face Oval */}
            <ellipse cx="50" cy="30" rx="17" ry="20" fill={`url(#${uid}-mask)`} filter="drop-shadow(0 3px 5px rgba(0,0,0,0.5))" />

            {/* Eyes of Horus (عيون حورس الملكية بالكحل الأسود) */}
            <path d="M 39 27 Q 44 24 47 27 Q 44 30 39 27 Z" fill="#0f172a" />
            <circle cx="43.5" cy="27" r="1.3" fill="white" />
            <path d="M 47 27 L 49 30" stroke="#0f172a" strokeWidth="1.2" />

            <path d="M 61 27 Q 56 24 53 27 Q 56 30 61 27 Z" fill="#0f172a" />
            <circle cx="56.5" cy="27" r="1.3" fill="white" />
            <path d="M 53 27 L 51 30" stroke="#0f172a" strokeWidth="1.2" />

            {/* Golden Braided Royal Beard (اللحية الفرعونية الملكية) */}
            <rect x="47.5" y="47" width="5" height="11" rx="1.5" fill={`url(#${uid}-gold)`} stroke="#78350f" strokeWidth="0.8" />
            <line x1="47.5" y1="50" x2="52.5" y2="50" stroke="#78350f" strokeWidth="1" />
            <line x1="47.5" y1="53" x2="52.5" y2="53" stroke="#78350f" strokeWidth="1" />
            <line x1="47.5" y1="56" x2="52.5" y2="56" stroke="#78350f" strokeWidth="1" />

            {/* Golden Royal Uraeus Cobra on Forehead */}
            <path d="M 48 10 C 47 4, 53 4, 52 10 L 51 14 L 49 14 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="0.9" />
            <circle cx="50" cy="6" r="1.7" fill="#ef4444" />

            {/* Golden Nemes Brow Band */}
            <path d="M 33 17 C 43 13, 57 13, 67 17" stroke={`url(#${uid}-gold)`} strokeWidth="3.5" strokeLinecap="round" />

            {/* Specular Face Highlight */}
            <ellipse cx="44" cy="22" rx="6" ry="3.5" transform="rotate(-20 44 22)" fill="white" opacity="0.75" />

            {isSelectable && (
              <polygon points="50,0 44,-7 56,-7" fill="#f59e0b" filter="drop-shadow(0 0 4px #d97706)" />
            )}
          </svg>
        </div>
      );
    }

    // 4. SPACE COSMIC PAWN
    const cfg = ({
      blue: { neon: '#00e5ff', neon2: '#0088ff', dark: '#030712' },
      red: { neon: '#ff1744', neon2: '#d50000', dark: '#030712' },
      green: { neon: '#00e676', neon2: '#00c853', dark: '#030712' },
      yellow: { neon: '#ffea00', neon2: '#ffab00', dark: '#030712' }
    } as Record<string, any>)[color] || {
      neon: '#00e5ff', neon2: '#0088ff', dark: '#030712'
    };

    const uid = 'spc_' + color;

    return (
      <div
        className={`relative ${tokenSizeClass} flex items-center justify-center select-none overflow-visible pointer-events-auto ${
          isSelectable ? 'animate-bounce z-30 drop-shadow-[0_0_6px_#22d3ee]' : ''
        }`}
      >
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={`${uid}-gnd`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={cfg.neon} stopOpacity="0.6" />
              <stop offset="40%" stopColor="rgba(0,0,0,0.8)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <radialGradient id={`${uid}-core`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor={cfg.neon} />
              <stop offset="70%" stopColor={cfg.neon2} />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>
            <linearGradient id={`${uid}-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="35%" stopColor="#334155" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
          </defs>

          {isSelectable && (
            <ellipse cx="50" cy="134" rx="42" ry="9" fill="rgba(0,229,255,0.3)" stroke={cfg.neon} strokeWidth="2.5" />
          )}

          {/* Neon Plasma Floor Shadow */}
          <ellipse cx="50" cy="134" rx="38" ry="7.5" fill={`url(#${uid}-gnd)`} />
          <ellipse cx="50" cy="131" rx="34" ry="5.5" fill="none" stroke={cfg.neon} strokeWidth="2" filter={`drop-shadow(0 0 7px ${cfg.neon})`} />

          {/* Anti-Gravity Hex Thruster Base */}
          <path d="M 16 122 L 28 115 L 72 115 L 84 122 L 78 130 L 22 130 Z" fill={`url(#${uid}-metal)`} stroke="#94a3b8" strokeWidth="1.2" />
          <ellipse cx="50" cy="122" rx="32" ry="5" fill="#090d16" stroke={cfg.neon} strokeWidth="1.8" />

          {/* Stealth Armor Chassis with Stabilizer Wings */}
          <path d="M 36 54 L 64 54 L 76 95 L 84 120 L 16 120 L 24 95 Z" fill={`url(#${uid}-metal)`} stroke="#64748b" strokeWidth="1.2" />

          {/* Armor Plates (Left & Right Flanks) */}
          <path d="M 24 95 L 8 114 L 18 121 Z" fill="#1e293b" stroke={cfg.neon} strokeWidth="1.5" />
          <path d="M 76 95 L 92 114 L 82 121 Z" fill="#1e293b" stroke={cfg.neon} strokeWidth="1.5" />

          {/* Central Armored Conduit Trench */}
          <rect x="42" y="56" width="16" height="60" rx="3" fill="#090d16" stroke="#475569" strokeWidth="1" />

          {/* Glowing Neon Plasma Conduit & Core Reactor Line */}
          <line x1="50" y1="58" x2="50" y2="114" stroke={cfg.neon} strokeWidth="4.5" strokeLinecap="round" filter={`drop-shadow(0 0 8px ${cfg.neon})`} />
          <line x1="50" y1="62" x2="50" y2="110" stroke="white" strokeWidth="1.8" strokeLinecap="round" />

          {/* Cyber Hex Reactor Node */}
          <polygon points="50,79 56,82.5 56,89.5 50,93 44,89.5 44,82.5" fill="#090d16" stroke={cfg.neon} strokeWidth="2.2" filter={`drop-shadow(0 0 6px ${cfg.neon})`} />
          <circle cx="50" cy="86" r="2.2" fill="white" />

          {/* Titanium Neck Hex Coupling */}
          <polygon points="34,54 42,47 58,47 66,54 58,58 42,58" fill="#334155" stroke={cfg.neon} strokeWidth="1.8" />

          {/* Plasma Core Energy Sphere Head */}
          <circle cx="50" cy="27" r="22" fill={`url(#${uid}-core)`} filter={`drop-shadow(0 0 15px ${cfg.neon})`} />

          {/* Floating Orbital Holographic Plasma Ring (حلقة المدار الفضائي) */}
          <ellipse cx="50" cy="27" rx="35" ry="10" transform="rotate(-18 50 27)" fill="none" stroke={cfg.neon2} strokeWidth="2.8" strokeDasharray="10 6" opacity="0.6" />
          <path d="M 17 33 C 27 44, 73 44, 83 21" fill="none" stroke={cfg.neon} strokeWidth="3.5" strokeLinecap="round" filter={`drop-shadow(0 0 10px ${cfg.neon})`} />
          <path d="M 23 32 C 33 42, 67 42, 77 23" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />

          {/* Specular Highlight */}
          <ellipse cx="42" cy="18" rx="7" ry="4" transform="rotate(-25 42 18)" fill="white" opacity="0.95" />
          <circle cx="38" cy="15" r="2.5" fill="white" />

          {isSelectable && (
            <polygon points="50,0 44,-7 56,-7" fill={cfg.neon} filter={`drop-shadow(0 0 4px ${cfg.neon})`} />
          )}
        </svg>
      </div>
    );
  };

    const SpaceToken = ThemedLudoToken;

  const renderBoard = () => {
    const isClassic = selectedBoardSkin === 'classic';
    const isIllustrated = selectedBoardSkin === 'underwater' || selectedBoardSkin === 'space' || selectedBoardSkin === 'ancient';
    const cells = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Skip corner 6x6 Bases: rendered as dedicated inside-the-color base containers!
        if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8)) {
          continue;
        }

        // Center 3x3 (rows 6..8, cols 6..8) is skipped and rendered as the 4 colored bases
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
          continue;
        }

        // PATH CELL STYLING (Unified clean 15x15 bottom board layer with crisp separation)
        let cellStyle = isClassic
          ? 'border border-slate-300 bg-white rounded-[4px] shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]'
          : isIllustrated
          ? 'border border-slate-700/35 bg-slate-900/15 rounded-[4px]'
          : 'border border-cyan-500/30 bg-slate-950/45 rounded-[4px] shadow-[inset_0_0_4px_rgba(0,0,0,0.7)]';
        let cellIndicator: React.ReactNode = null;

        const isSafeCell = (r === 6 && c === 12) || (r === 8 && c === 2) || (r === 2 && c === 6) || (r === 12 && c === 8);
        if (isSafeCell) {
          cellStyle = isClassic
            ? 'border border-amber-400 bg-amber-50 rounded-[4px] shadow-[inset_0_0_8px_rgba(245,158,11,0.22)]'
            : 'border border-amber-400/80 bg-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.4),inset_0_0_6px_rgba(251,191,36,0.3)] rounded-[4px]';
          cellIndicator = <span className={`${isClassic ? 'text-amber-500' : 'text-amber-300'} text-xs font-black select-none leading-none`}>⭐</span>;
        }

        // Green Home Stretch (row 7, cols 1-5) & Start (r=6, c=1)
        if (r === 7 && c >= 1 && c <= 5) {
          cellStyle = isClassic
            ? 'border border-emerald-600/80 bg-emerald-500 rounded-[4px] shadow-[inset_0_0_8px_rgba(0,0,0,0.12)]'
            : 'border border-emerald-400/60 bg-emerald-500/30 shadow-[inset_0_0_8px_rgba(16,185,129,0.5)] rounded-[4px]';
          cellIndicator = <span className={`${isClassic ? 'text-white/85' : 'text-emerald-300 opacity-70'} text-[10px] font-black select-none`}>➔</span>;
        } else if (r === 6 && c === 1) {
          cellStyle = isClassic
            ? 'border border-emerald-700 bg-emerald-500 rounded-[4px] shadow-[inset_0_0_10px_rgba(255,255,255,0.25)]'
            : 'border border-emerald-400 bg-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.6)] rounded-[4px]';
          cellIndicator = <span className="text-emerald-50 text-xs font-black select-none leading-none">🚀</span>;
        }

        // Yellow Home Stretch (col 7, rows 1-5) & Start (r=1, c=8)
        if (c === 7 && r >= 1 && r <= 5) {
          cellStyle = isClassic
            ? 'border border-amber-500/80 bg-amber-400 rounded-[4px] shadow-[inset_0_0_8px_rgba(0,0,0,0.1)]'
            : 'border border-amber-400/60 bg-amber-500/30 shadow-[inset_0_0_8px_rgba(245,158,11,0.5)] rounded-[4px]';
          cellIndicator = <span className={`${isClassic ? 'text-amber-950/80' : 'text-amber-300 opacity-70'} text-[10px] font-black transform rotate-90 inline-block select-none`}>➔</span>;
        } else if (r === 1 && c === 8) {
          cellStyle = isClassic
            ? 'border border-amber-600 bg-amber-400 rounded-[4px] shadow-[inset_0_0_10px_rgba(255,255,255,0.28)]'
            : 'border border-amber-400 bg-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.6)] rounded-[4px]';
          cellIndicator = <span className="text-amber-50 text-xs font-black select-none leading-none">🚀</span>;
        }

        // Red Home Stretch (col 7, rows 9-13) & Start (r=13, c=6)
        if (c === 7 && r >= 9 && r <= 13) {
          cellStyle = isClassic
            ? 'border border-rose-600/80 bg-rose-500 rounded-[4px] shadow-[inset_0_0_8px_rgba(0,0,0,0.12)]'
            : 'border border-rose-400/60 bg-rose-500/30 shadow-[inset_0_0_8px_rgba(244,63,94,0.5)] rounded-[4px]';
          cellIndicator = <span className={`${isClassic ? 'text-white/85' : 'text-rose-300 opacity-70'} text-[10px] font-black transform -rotate-90 inline-block select-none`}>➔</span>;
        } else if (r === 13 && c === 6) {
          cellStyle = isClassic
            ? 'border border-rose-700 bg-rose-500 rounded-[4px] shadow-[inset_0_0_10px_rgba(255,255,255,0.25)]'
            : 'border border-rose-400 bg-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.6)] rounded-[4px]';
          cellIndicator = <span className="text-rose-50 text-xs font-black select-none leading-none">🚀</span>;
        }

        // Blue Home Stretch (row 7, cols 9-13) & Start (r=8, c=13)
        if (r === 7 && c >= 9 && c <= 13) {
          cellStyle = isClassic
            ? 'border border-blue-600/80 bg-blue-500 rounded-[4px] shadow-[inset_0_0_8px_rgba(0,0,0,0.12)]'
            : 'border border-cyan-400/60 bg-cyan-500/30 shadow-[inset_0_0_8px_rgba(6,182,212,0.5)] rounded-[4px]';
          cellIndicator = <span className={`${isClassic ? 'text-white/85' : 'text-cyan-300 opacity-70'} text-[10px] font-black transform rotate-180 inline-block select-none`}>➔</span>;
        } else if (r === 8 && c === 13) {
          cellStyle = isClassic
            ? 'border border-blue-700 bg-blue-500 rounded-[4px] shadow-[inset_0_0_10px_rgba(255,255,255,0.25)]'
            : 'border border-cyan-400 bg-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.6)] rounded-[4px]';
          cellIndicator = <span className="text-blue-50 text-xs font-black select-none leading-none">🚀</span>;
        }

        cells.push(
          <div key={`${r}-${c}`} style={{ gridRow: r + 1, gridColumn: c + 1 }} className={`w-full h-full ${cellStyle} relative flex items-center justify-center p-0.5`}>
            {cellIndicator}

            {/* Footprint trail */}
            {footprints.filter(f => f.r === r && f.c === c).map(f => (
              <div key={f.key} className={`absolute w-[40%] h-[40%] rounded-full opacity-35 pointer-events-none ${f.color === 'red' ? 'bg-rose-500' :
                f.color === 'green' ? 'bg-emerald-500' :
                  f.color === 'blue' ? 'bg-cyan-500' :
                    'bg-amber-500'
                }`} />
            ))}
          </div>
        );
      }
    }

    return (
      <>
        {/* 4 Inside-The-Color Corner Bases (Yalla Ludo Style) */}
        {renderCornerBase('green')}
        {renderCornerBase('yellow')}
        {renderCornerBase('red')}
        {renderCornerBase('blue')}

        {cells}

        {/* Center Home: 4 Distinct Color Quadrants (بيت القطع المنتهية) */}
        <div
          style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}
          className={`w-full h-full grid grid-cols-2 grid-rows-2 p-1 gap-1 relative z-10 rounded-xl overflow-hidden ${isClassic ? 'bg-slate-900 border border-slate-700/80' : ''}`}
        >
          {/* Green Home Base (Top-Left) */}
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-1 gap-1 rounded-xl bg-emerald-950/90 border-2 border-emerald-500/70 shadow-[inset_0_0_15px_rgba(16,185,129,0.4)]">
            {Array.from({ length: 4 }).map((_, idx) => {
              const token = tokens.filter(t => t.color === 'green' && t.position === 56)[idx];
              return (
                <div key={`green-home-${idx}`} className="w-full h-full rounded-lg bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center p-0.5">
                  {token ? (
                    <SpaceToken color="green" isAtHome={true} />
                  ) : (
                    <span className="text-[10px] opacity-40 select-none">🟢</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Yellow Home Base (Top-Right) */}
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-1 gap-1 rounded-xl bg-amber-950/90 border-2 border-amber-500/70 shadow-[inset_0_0_15px_rgba(245,158,11,0.4)]">
            {Array.from({ length: 4 }).map((_, idx) => {
              const token = tokens.filter(t => t.color === 'yellow' && t.position === 56)[idx];
              return (
                <div key={`yellow-home-${idx}`} className="w-full h-full rounded-lg bg-amber-900/40 border border-amber-500/40 flex items-center justify-center p-0.5">
                  {token ? (
                    <SpaceToken color="yellow" isAtHome={true} />
                  ) : (
                    <span className="text-[10px] opacity-40 select-none">🟡</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Red Home Base (Bottom-Left) */}
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-1 gap-1 rounded-xl bg-rose-950/90 border-2 border-rose-500/70 shadow-[inset_0_0_15px_rgba(244,63,94,0.4)]">
            {Array.from({ length: 4 }).map((_, idx) => {
              const token = tokens.filter(t => t.color === 'red' && t.position === 56)[idx];
              return (
                <div key={`red-home-${idx}`} className="w-full h-full rounded-lg bg-rose-900/40 border border-rose-500/40 flex items-center justify-center p-0.5">
                  {token ? (
                    <SpaceToken color="red" isAtHome={true} />
                  ) : (
                    <span className="text-[10px] opacity-40 select-none">🔴</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Blue Home Base (Bottom-Right) */}
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-1 gap-1 rounded-xl bg-cyan-950/90 border-2 border-cyan-500/70 shadow-[inset_0_0_15px_rgba(6,182,212,0.4)]">
            {Array.from({ length: 4 }).map((_, idx) => {
              const token = tokens.filter(t => t.color === 'blue' && t.position === 56)[idx];
              return (
                <div key={`blue-home-${idx}`} className="w-full h-full rounded-lg bg-cyan-900/40 border border-cyan-500/40 flex items-center justify-center p-0.5">
                  {token ? (
                    <SpaceToken color="blue" isAtHome={true} />
                  ) : (
                    <span className="text-[10px] opacity-40 select-none">🔵</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tiny center crown emblem - fits cleanly in the intersection without covering any base */}
          <div className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-slate-950/90 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] flex items-center justify-center pointer-events-none select-none z-20">
            <span className="text-[11px] font-black text-amber-300">👑</span>
          </div>
        </div>
      </>
    );
  };

  // Dedicated Top Overlay Layer for Active Track Pawns (always above all bases, cells, and center finish home)
  const renderTokensLayer = () => {
    const grouped: Record<string, { r: number; c: number; tokens: Token[] }> = {};

    tokens.forEach((t) => {
      const tIndex = parseInt(t.id.split('-')[1]);
      if (tIndex >= pieceCount) return;
      if (playerConfig[t.color] === 'none') return;
      if (t.position === -1 || t.position === 56) return;

      const absPos = getAbsolutePosition(t.color, t.position);
      if (!absPos) return;

      const key = `${absPos.r}-${absPos.c}`;
      if (!grouped[key]) {
        grouped[key] = { r: absPos.r, c: absPos.c, tokens: [] };
      }
      grouped[key].tokens.push(t);
    });

    return Object.entries(grouped).map(([key, cell]) => {
      const count = cell.tokens.length;
      const hasSelectable = cell.tokens.some(
        (token) =>
          turn === token.color &&
          gameState === 'waiting_move' &&
          getValidMoves(turn, diceValues[turn]).some((t) => t.id === token.id)
      );

      return (
        <div
          key={`tokens-${key}`}
          style={{ gridRow: cell.r + 1, gridColumn: cell.c + 1 }}
          className={`relative w-full h-full flex items-center justify-center p-0 pointer-events-none ${
            hasSelectable ? 'z-40' : 'z-30'
          }`}
        >
          <div
            className={
              count === 1
                ? 'w-full h-full flex items-center justify-center'
                : count === 2
                ? 'w-full h-full grid grid-cols-2 grid-rows-1 items-center justify-items-center'
                : 'w-full h-full grid grid-cols-2 grid-rows-2 items-center justify-items-center'
            }
          >
            {cell.tokens.map((token) => {
              const isTurn = turn === token.color;
              const isValidMove =
                isTurn &&
                gameState === 'waiting_move' &&
                getValidMoves(turn, diceValues[turn]).some((t) => t.id === token.id);

              return (
                <div
                  key={token.id}
                  onClick={() => {
                    if (isValidMove) handleTokenClick(token);
                  }}
                  className={`w-full h-full relative flex items-center justify-center pointer-events-auto ${
                    isValidMove ? 'cursor-pointer z-40' : 'cursor-default'
                  }`}
                >
                  <SpaceToken color={token.color} isSelectable={isValidMove} />
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };


  const handleSendGift = (gift: GiftItem, targetColor: PlayerColor) => {
    if (playerCoins < gift.cost) {
      setStatusMessage(
        lang === 'ar'
          ? `⚠️ رصيدك غير كافٍ! تحتاج إلى ${gift.cost} 🪙 (رصيدك الحالي: ${playerCoins} 🪙)`
          : `⚠️ Not enough coins! Need ${gift.cost} 🪙 (Current: ${playerCoins} 🪙)`
      );
      return;
    }

    // Deduct coins
    const updatedCoins = playerCoins - gift.cost;
    setPlayerCoins(updatedCoins);
    try {
      localStorage.setItem('ludo_coins_balance', updatedCoins.toString());
    } catch (e) {}

    // Close modal
    setSelectedGiftTarget(null);

    // Floating deduction text on blue player
    setFloatingCoinText({
      player: 'blue',
      text: `-${gift.cost} 🪙`
    });
    setTimeout(() => setFloatingCoinText(null), 1200);

    // Trigger Flying Projectile
    setFlyingGift({
      id: Date.now().toString(),
      from: 'blue',
      to: targetColor,
      icon: gift.icon,
      name: lang === 'ar' ? gift.nameAr : gift.nameEn,
    });

    // Impact after 600ms
    setTimeout(() => {
      setFlyingGift(null);
      playGiftSound(gift.sound);

      // Apply Impact to Target
      setActiveImpacts(prev => ({
        ...prev,
        [targetColor]: {
          icon: gift.icon,
          title: lang === 'ar' ? gift.nameAr : gift.nameEn,
          fromName: getPlayerName('blue'),
          effect: gift.id,
          id: Date.now()
        }
      }));

      // Status announcement
      setStatusMessage(
        lang === 'ar'
          ? `🎁 أرسلت [${gift.icon} ${gift.nameAr}] إلى ${getPlayerName(targetColor)}!`
          : `🎁 You sent [${gift.icon} ${gift.nameEn}] to ${getPlayerName(targetColor)}!`
      );

      // Clear impact after 3.5s
      setTimeout(() => {
        setActiveImpacts(prev => {
          const next = { ...prev };
          delete next[targetColor];
          return next;
        });
      }, 3500);

      // If target is bot, bot can counter-attack after 2.2s with 60% probability!
      if (playerConfig[targetColor] === 'bot') {
        setTimeout(() => {
          const botReplies = GIFTS_LIST.filter(g => ['egg', 'slipper', 'tomato', 'highfive'].includes(g.id));
          const replyGift = botReplies[Math.floor(Math.random() * botReplies.length)];
          
          setFlyingGift({
            id: Date.now().toString(),
            from: targetColor,
            to: 'blue',
            icon: replyGift.icon,
            name: lang === 'ar' ? replyGift.nameAr : replyGift.nameEn,
          });

          setTimeout(() => {
            setFlyingGift(null);
            playGiftSound(replyGift.sound);

            setActiveImpacts(prev => ({
              ...prev,
              blue: {
                icon: replyGift.icon,
                title: lang === 'ar' ? replyGift.nameAr : replyGift.nameEn,
                fromName: getPlayerName(targetColor),
                effect: replyGift.id,
                id: Date.now()
              }
            }));

            const botMsgs = [
              `"خُد دي وماتنساش! ${replyGift.icon}😂"`,
              `"مردودة لك على الطاير! ${replyGift.icon}⚔️"`,
              `"فاكرني هسكتلك؟ خد دي! ${replyGift.icon}🤣"`
            ];
            setStatusMessage(
              lang === 'ar'
                ? `🤖 ${getPlayerName(targetColor)} رد عليك: ${botMsgs[Math.floor(Math.random() * botMsgs.length)]}`
                : `🤖 ${getPlayerName(targetColor)} countered with ${replyGift.icon}!`
            );

            setTimeout(() => {
              setActiveImpacts(prev => {
                const next = { ...prev };
                delete next.blue;
                return next;
              });
            }, 3500);
          }, 600);
        }, 2200);
      }
    }, 600);
  };

  const handleResetH2H = () => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من تصفير سجل المواجهات والبطولات بالكامل؟' : 'Are you sure you want to reset your match history?')) {
      const resetData: H2HRecord = {
        totalMatches: 0,
        playerWins: 0,
        opponentWins: 0,
        byColor: { red: 0, green: 0, yellow: 0 },
        streak: 0,
        history: []
      };
      setH2hRecord(resetData);
      try {
        localStorage.setItem('ludo_h2h_record', JSON.stringify(resetData));
      } catch (e) {}
    }
  };

  // 1. TRUE 3D LUXURY DICE WIDGET (نرد ثلاثي الأبعاد حقيقي مكعب مع 6 أوجه وظلال وفيزياء دحرجة)
  const renderDiceWidget = (playerColor: PlayerColor) => {
    const isTurn = turn === playerColor;
    const isBlue = playerColor === 'blue';
    const isRolling = rollingDicePlayer === playerColor;
    const val = diceValues[playerColor] || 1;
    const canClick = isTurn && isBlue && gameState === 'waiting_roll' && rollingDicePlayer === null && !winner;

    // 3D Cube Rotation map to orient the active face with subtle isometric depth
    const faceRotations: Record<number, string> = {
      1: 'rotateX(-10deg) rotateY(15deg)',
      2: 'rotateX(-100deg) rotateY(15deg)',
      3: 'rotateX(-10deg) rotateY(-75deg)',
      4: 'rotateX(-10deg) rotateY(105deg)',
      5: 'rotateX(80deg) rotateY(15deg)',
      6: 'rotateX(-10deg) rotateY(195deg)',
    };
    const restTransform = faceRotations[val] || faceRotations[1];

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (canClick) {
            rollDice();
          }
        }}
        className={`relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center select-none scale-[0.78] sm:scale-95 origin-center ${
          canClick ? 'cursor-pointer hover:scale-90 sm:hover:scale-105 active:scale-75' : 'cursor-default'
        }`}
        title={canClick ? (lang === 'ar' ? 'انقر لرمي النرد ثلاثي الأبعاد!' : 'Click to roll 3D dice!') : ''}
        style={{ perspective: '350px' }}
      >
        {/* Turn pointer arrow ▼ above the dice */}
        {isTurn && !winner && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-emerald-300 text-xs sm:text-sm font-black animate-bounce pointer-events-none z-30 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            ▼
          </div>
        )}

        {/* Ambient Floor Shadow under 3D Cube */}
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 sm:w-8 h-2 rounded-full bg-black/45 blur-[2px] pointer-events-none transition-all duration-300 ${
            isRolling ? 'scale-50 opacity-25' : 'scale-100 opacity-60'
          }`}
        />

        {/* 3D CUBE (32px x 32px with 16px translateZ) */}
        <div
          className={`w-[32px] h-[32px] relative transition-transform duration-500 ease-out ${
            isRolling ? 'animate-dice-3d-roll' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isRolling ? undefined : restTransform,
          }}
        >
          {/* FACE 1 (Front: 1 Large Red Sunken Pip) */}
          <div
            className="absolute inset-0 rounded-[6px] bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_1.5px_rgba(0,0,0,0.15)] flex items-center justify-center"
            style={{ transform: 'rotateY(0deg) translateZ(16px)' }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_0.5px_1px_rgba(255,255,255,0.7)]" />
          </div>

          {/* FACE 6 (Back: 6 Dark Pips) */}
          <div
            className="absolute inset-0 rounded-[6px] bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_1.5px_rgba(0,0,0,0.15)] p-1 grid grid-cols-2 grid-rows-3 justify-items-center items-center"
            style={{ transform: 'rotateY(180deg) translateZ(16px)', filter: 'brightness(0.92)' }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)]" />
            ))}
          </div>

          {/* FACE 2 (Top: 2 Diagonal Pips) */}
          <div
            className="absolute inset-0 rounded-[6px] bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_1.5px_rgba(0,0,0,0.15)] p-1.5 flex flex-col justify-between"
            style={{ transform: 'rotateX(90deg) translateZ(16px)', filter: 'brightness(1.05)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)] self-start" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)] self-end" />
          </div>

          {/* FACE 5 (Bottom: 5 Pips) */}
          <div
            className="absolute inset-0 rounded-[6px] bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 border border-slate-300/90 shadow-inner p-1 grid grid-cols-3 grid-rows-3 justify-items-center items-center"
            style={{ transform: 'rotateX(-90deg) translateZ(16px)', filter: 'brightness(0.85)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 col-start-1 row-start-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 col-start-3 row-start-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 col-start-2 row-start-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 col-start-1 row-start-3" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 col-start-3 row-start-3" />
          </div>

          {/* FACE 3 (Right: 3 Diagonal Pips) */}
          <div
            className="absolute inset-0 rounded-[6px] bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_1.5px_rgba(0,0,0,0.15)] p-1.5 flex flex-col justify-between"
            style={{ transform: 'rotateY(90deg) translateZ(16px)', filter: 'brightness(0.92)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)] self-start" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)] self-center" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)] self-end" />
          </div>

          {/* FACE 4 (Left: 4 Corner Pips) */}
          <div
            className="absolute inset-0 rounded-[6px] bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 border border-slate-300/90 shadow-inner p-1.5 grid grid-cols-2 grid-rows-2 justify-items-center items-center"
            style={{ transform: 'rotateY(-90deg) translateZ(16px)', filter: 'brightness(0.88)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.8),0_0.5px_0.5px_rgba(255,255,255,0.7)]" />
          </div>
        </div>

        {/* Turn Active Aura Glow */}
        {isTurn && (
          <div className="absolute -inset-1 rounded-xl border-2 border-amber-400 pointer-events-none" />
        )}
      </div>
    );
  };

  // 2. Token Home Slot inside the Base
  const renderTokenHomeSlot = (baseColor: PlayerColor, slotIndex: number) => {
    const isTokenActive = pieceCount === 4 || slotIndex === 0 || slotIndex === 1;
    const token = tokens.find(t => t.id === `${baseColor}-${slotIndex}`);
    const isAtHome = token && token.position === -1;
    const isTurn = turn === baseColor;
    const isValidMove = isTurn && gameState === 'waiting_move' && diceValues[turn] === 6 && isAtHome;

    return (
      <div
        key={`slot-${baseColor}-${slotIndex}`}
        className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/40 border border-white/25 shadow-inner flex items-center justify-center overflow-visible shrink-0"
      >
        {isTokenActive && isAtHome && token ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (isValidMove) {
                handleTokenClick(token);
              }
            }}
            className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
              isValidMove ? 'cursor-pointer animate-bounce ring-2 ring-amber-300 z-30' : ''
            }`}
          >
            <ThemedLudoToken color={baseColor} isSelectable={isValidMove} isAtHome={true} />
          </div>
        ) : !isTokenActive ? (
          <span className="text-[8px] opacity-20">🔒</span>
        ) : null}
      </div>
    );
  };

  // 3. Inside-The-Color 6x6 Corner Base (Matching Image 1)
  const renderCornerBase = (baseColor: PlayerColor) => {
    const isPresent = playerConfig[baseColor] !== 'none';
    const isTurn = turn === baseColor;
    const isBlue = baseColor === 'blue';
    const isBot = playerConfig[baseColor] === 'bot';

    let gridStyle = { gridRow: '1 / 7', gridColumn: '1 / 7' };
    let alignCornerClass = 'self-start justify-self-start';
    if (baseColor === 'yellow') {
      gridStyle = { gridRow: '1 / 7', gridColumn: '10 / 16' };
      alignCornerClass = 'self-start justify-self-end';
    } else if (baseColor === 'red') {
      gridStyle = { gridRow: '10 / 16', gridColumn: '1 / 7' };
      alignCornerClass = 'self-end justify-self-start';
    } else if (baseColor === 'blue') {
      gridStyle = { gridRow: '10 / 16', gridColumn: '10 / 16' };
      alignCornerClass = 'self-end justify-self-end';
    }

    const isSpace = selectedBoardSkin === 'space';
    const colorConfig = {
      green: {
        bg: isSpace ? 'bg-emerald-950/45' : 'bg-emerald-600',
        border: isSpace ? 'border-emerald-400/80' : 'border-emerald-500/90',
        glow: 'shadow-md',
        avatarBorder: 'border-emerald-300',
        defaultName: 'Ali Ali',
        botName: lang === 'ar' ? 'الأخضر (روبوت)' : 'Green (Bot)',
        avatarUrl: '/dragon_emote.png',
        fallbackAvatar: '🟢',
      },
      yellow: {
        bg: isSpace ? 'bg-amber-950/45' : 'bg-amber-500',
        border: isSpace ? 'border-amber-400/80' : 'border-amber-400/90',
        glow: 'shadow-md',
        avatarBorder: 'border-amber-200',
        defaultName: 'محمود',
        botName: lang === 'ar' ? 'الأصفر (روبوت)' : 'Yellow (Bot)',
        avatarUrl: '/kaizen_emoji_pack.png',
        fallbackAvatar: '🟡',
      },
      red: {
        bg: isSpace ? 'bg-rose-950/45' : 'bg-rose-600',
        border: isSpace ? 'border-rose-400/80' : 'border-rose-400/90',
        glow: 'shadow-md',
        avatarBorder: 'border-rose-300',
        defaultName: 'الساحر',
        botName: lang === 'ar' ? 'الأحمر (روبوت)' : 'Red (Bot)',
        avatarUrl: '/laugh_emote.png',
        fallbackAvatar: '🔴',
      },
      blue: {
        bg: isSpace ? 'bg-blue-950/45' : 'bg-blue-600',
        border: isSpace ? 'border-blue-400/80' : 'border-blue-400/90',
        glow: 'shadow-md',
        avatarBorder: 'border-cyan-300',
        defaultName: userProfile?.username || (lang === 'ar' ? 'أنت (الأزرق)' : 'You (Blue)'),
        botName: lang === 'ar' ? 'الأزرق (روبوت)' : 'Blue (Bot)',
        avatarUrl: userProfile?.avatar_url || '/Ali.jpg',
        fallbackAvatar: '🔵',
      },
    }[baseColor];

    const isSpectator = userRole === 'spectator';
    const dispName = isBlue
      ? (isSpectator ? (lang === 'ar' ? 'البرنس (الأزرق)' : 'Prince (Blue)') : (userProfile?.username || colorConfig.defaultName))
      : colorConfig.defaultName;
    const avatarImg = isBlue ? (userProfile?.avatar_url || colorConfig.avatarUrl) : colorConfig.avatarUrl;
    const impact = activeImpacts[baseColor];
    const isTop = baseColor === 'green' || baseColor === 'yellow';
    const slotIndices = [0, 1, 2, 3];

    return (
      <div
        key={`corner-${baseColor}`}
        style={gridStyle}
        className={`w-[88%] h-[88%] ${alignCornerClass} min-w-0 min-h-0 box-border relative rounded-xl sm:rounded-2xl ${colorConfig.bg} border-2 ${colorConfig.border} ${colorConfig.glow} p-1 sm:p-1.5 flex flex-col justify-between overflow-hidden select-none ${
          isTurn ? 'ring-2 ring-inset ring-amber-300 z-20' : 'z-10'
        }`}
      >
        {/* Active Impact (Gift animation) */}
        {impact && (
          <div className="absolute inset-0 z-40 bg-black/85 rounded-2xl flex flex-col items-center justify-center p-1 backdrop-blur-[2px] animate-fadeIn pointer-events-none">
            <span className="text-2xl animate-bounce">{impact.icon}</span>
            <span className="text-[9px] font-black text-amber-300 text-center leading-tight mt-0.5">
              {impact.title}
            </span>
          </div>
        )}

        {/* Floating Coin Text */}
        {floatingCoinText && floatingCoinText.player === baseColor && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-50 text-amber-300 font-black text-[10px] animate-bounce whitespace-nowrap bg-slate-950/90 px-2 py-0.5 rounded-full border border-amber-500/40">
            {floatingCoinText.text}
          </div>
        )}

        {!isPresent ? (
          <div className="w-full h-full" />
        ) : (
          <>
            {(() => {
              const playerId = tableSeats[baseColor]?.id || `user-${baseColor}`;
              const isMutedSeat = mutedUserIds.includes(playerId);
              const isModSeat = moderatorIds.includes(playerId) || tableSeats[baseColor]?.isDeputy;

              const profileBlock = (
                <div className="w-full flex flex-col gap-0.5">
                  <div className="w-full flex items-center justify-between gap-1">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const seatUser = tableSeats[baseColor];
                        handleUserClick({
                          id: seatUser?.id || (isBlue ? (userProfile?.id || '12842582') : `user-${baseColor}`),
                          name: seatUser?.name || dispName,
                          avatar: seatUser?.avatar || avatarImg,
                          seatColor: baseColor,
                          isBot,
                          isDeputy: seatUser?.isDeputy,
                        });
                      }}
                      className="relative shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95"
                      title={lang === 'ar' ? 'انقر للملف الشخصي / الإشراف' : 'Click for profile / moderation'}
                    >
                      {isTurn && gameStarted && !winner && (
                        <svg key={`ring-${baseColor}-${turn}-${gameState}`} className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none z-20 overflow-visible">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="44%"
                            fill="none"
                            stroke="rgba(255,255,255,0.22)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="50%"
                            cy="50%"
                            r="44%"
                            fill="none"
                            strokeWidth="3.5"
                            strokeDasharray="100"
                            strokeLinecap="round"
                            className="animate-turn-countdown"
                            pathLength="100"
                          />
                        </svg>
                      )}
                      <div className={`relative w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 ${colorConfig.avatarBorder} overflow-hidden shadow bg-slate-950/40 flex items-center justify-center text-xs sm:text-sm ${
                        isTurn && gameStarted && !winner ? 'ring-2 ring-amber-300' : ''
                      }`}>
                        <span className="select-none pointer-events-none">{colorConfig.fallbackAvatar}</span>
                        {avatarImg && (
                          <img
                            src={avatarImg}
                            alt={dispName}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${isMutedSeat ? 'bg-rose-600' : 'bg-emerald-600'} flex items-center justify-center shadow z-10 text-white`}>
                          <MicIcon muted={isMutedSeat} className="w-2 h-2" />
                        </div>
                        {isModSeat && (
                          <div className="absolute -top-1 -right-1 text-[8px] z-10">⭐</div>
                        )}
                      </div>
                    </div>

                    {!isBlue && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGiftTarget(baseColor);
                        }}
                        className="px-1.5 py-0.5 rounded-full bg-black/40 hover:bg-black/65 border border-amber-300/60 text-[10px] sm:text-xs leading-none shadow active:scale-90 transition-transform cursor-pointer shrink-0"
                        title={lang === 'ar' ? 'سلام وحرب (هدايا ومقالب)' : 'Peace & War Gifts'}
                      >
                        🕊️⚔️
                      </button>
                    )}

                    <div className="shrink-0">
                      {renderDiceWidget(baseColor)}
                    </div>
                  </div>

                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      const seatUser = tableSeats[baseColor];
                      handleUserClick({
                        id: seatUser?.id || (isBlue ? (userProfile?.id || '12842582') : `user-${baseColor}`),
                        name: seatUser?.name || dispName,
                        avatar: seatUser?.avatar || avatarImg,
                        seatColor: baseColor,
                        isBot,
                        isDeputy: seatUser?.isDeputy,
                      });
                    }}
                    className="w-full text-[9px] sm:text-[11px] font-black text-white truncate block leading-tight text-center drop-shadow-sm cursor-pointer"
                  >
                    {dispName}
                  </span>
                </div>
              );

              const padsBlock = (
                <div className="w-full flex items-center justify-around py-0.5 px-0.5">
                  {slotIndices.map(idx => renderTokenHomeSlot(baseColor, idx))}
                </div>
              );

              return isTop ? (
                <>
                  {profileBlock}
                  {padsBlock}
                </>
              ) : (
                <>
                  {padsBlock}
                  {profileBlock}
                </>
              );
            })()}
          </>
        )}
      </div>
    );
  };

  const renderEmoteSelector = () => {
    return (
      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/90 border border-slate-700/60 px-3 py-1.5 rounded-full shadow-2xl z-40 backdrop-blur-md">
        <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">{lang === 'ar' ? 'تفاعل:' : 'Emote:'}</span>
        <button
          onClick={() => triggerPlayerEmote('blue', 'wizard')}
          className="text-lg hover:scale-125 transition-transform active:scale-95"
          title="سحر أسطوري"
        >
          🧙‍♂️
        </button>
        <button
          onClick={() => triggerPlayerEmote('blue', 'iron_hero')}
          className="text-lg hover:scale-125 transition-transform active:scale-95"
          title="دفاع حديدي"
        >
          🛡️
        </button>
        <button
          onClick={() => triggerPlayerEmote('blue', 'ranger')}
          className="text-lg hover:scale-125 transition-transform active:scale-95"
          title="سهم دقيق"
        >
          🏹
        </button>
      </div>
    );
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`${gameStarted ? 'h-[100dvh] w-full max-w-[100vw] overflow-hidden' : 'min-h-[100dvh] w-full overflow-x-hidden'} bg-[#031020] text-slate-100 flex flex-col relative select-none font-sans no-pull-refresh overscroll-none touch-manipulation`}>

      {/* Persistent HTML5 Audio for Local Music */}
      <audio ref={audioRef} loop className="hidden" />
      <input
        type="file"
        ref={musicFileInputRef}
        accept="audio/*"
        onChange={handleMusicFileChange}
        className="hidden"
      />

      {/* 5-Second Animated Splash Screen / Intro Scene */}
      {showCinematicIntro && (
        <MythicSplashScreenIntro
          onComplete={() => {
            setShowCinematicIntro(false);
          }}
          lang={lang}
          isMuted={isMuted}
        />
      )}

      {/* Floating Side Settings Button in Lobby Screens */}
      {!gameStarted && (
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="fixed top-2 left-2 z-40 w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-400/75 text-amber-300 flex items-center justify-center text-base shadow-lg active:scale-90 transition-transform cursor-pointer"
          title={lang === 'ar' ? 'الإعدادات والتحكم السريع ⚙️' : 'Settings & Quick Controls ⚙️'}
        >
          ⚙️
        </button>
      )}

      {/* Main Content Area */}
      {!gameStarted ? (
        lobbyView === 'rooms' ? (
          /* VIEW 1: ACTIVE ROOMS LOBBY (كروت الغرف المباشرة + زر إنشاء غرفة) */
          <div className="flex-1 flex items-center justify-center p-3 sm:p-5 relative overflow-y-auto w-full">
            <div
              className="absolute inset-0 bg-cover bg-center -z-10 opacity-20 filter blur-md scale-105 pointer-events-none select-none"
              style={{ backgroundImage: `url('/classic_ludo_board.svg')` }}
            />

            <div className="w-full max-w-4xl bg-slate-950/95 border border-emerald-500/30 rounded-3xl p-4 sm:p-6 shadow-[0_0_60px_rgba(16,185,129,0.25)] backdrop-blur-xl relative z-20 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
              {/* Header with Title and Create Room Hero Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="text-center sm:text-right">
                  <h2 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent flex items-center gap-2 justify-center sm:justify-start">
                    <span>🎲</span>
                    <span>{lang === 'ar' ? 'صالة غرف لودو الممالك' : 'Mythical Ludo Rooms Hall'}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'انضم إلى أي غرفة مباشرة كلاعب أو متفرج، أو أنشئ غرفتك الخاصة 🏰' : 'Join any live room as player or spectator, or create your room 🏰'}
                  </p>
                </div>

                {/* Create Room Button */}
                <button
                  type="button"
                  onClick={() => setLobbyView('create_room')}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.5)] active:scale-95 transition-all cursor-pointer flex items-center gap-2 shrink-0 border border-amber-300"
                >
                  <span className="text-base">➕</span>
                  <span>{lang === 'ar' ? 'إنشاء غرفة جديدة' : 'Create New Room'}</span>
                </button>
              </div>

              {/* Active Live Rooms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {LUDO_PUBLIC_ROOMS.map((room) => {
                  const isFull = room.currentPlayers >= room.playerCount;
                  const isInGame = room.status === 'in_game';
                  return (
                    <div
                      key={room.id}
                      className={`p-4 rounded-2xl flex flex-col justify-between gap-3 transition-all shadow-md border ${
                        isInGame
                          ? 'bg-purple-950/30 border-purple-500/50 hover:border-purple-400/80'
                          : 'bg-slate-900/85 border-amber-500/35 hover:border-amber-400/70'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={room.hostAvatar}
                            alt={room.hostName}
                            className={`w-10 h-10 rounded-full border bg-slate-900 object-cover ${
                              isInGame ? 'border-purple-400/50' : 'border-amber-400/50'
                            }`}
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
                            isInGame
                              ? 'bg-purple-500/15 border-purple-400/40 text-purple-300'
                              : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                          }`}
                        >
                          {isInGame
                            ? (lang === 'ar' ? 'المباراة جارية 🔥' : 'In Game 🔥')
                            : (lang === 'ar' ? 'بانتظار لاعبين ⏳' : 'Waiting ⏳')}
                        </span>
                      </div>

                      {/* Room Stats */}
                      <div className="grid grid-cols-3 gap-2 bg-black/40 p-2 rounded-xl text-center text-[10px]">
                        <div>
                          <span className="text-slate-500 block">{lang === 'ar' ? 'اللاعبين' : 'Players'}</span>
                          <span className={`font-black ${isInGame ? 'text-purple-300' : 'text-emerald-400'}`}>
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

                      {/* Unified Single Action Button: Purple when In Game, Gold when Waiting */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const isMatchPlaying = room.status === 'in_game';
                            const roleToAssign = (isMatchPlaying || isFull) ? 'spectator' : 'player';
                            joinRoomFromList(room, roleToAssign);
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow active:scale-98 ${
                            isInGame || isFull
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/50 shadow-purple-950/40'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 border border-amber-300 shadow-amber-950/40'
                          }`}
                        >
                          <span>{isInGame || isFull ? '🎙️' : '🚪'}</span>
                          <span>
                            {isInGame
                              ? (lang === 'ar' ? 'دخول الغرفة (المباراة جارية - متفرج حتى الجيم الجديد)' : 'Enter Room (In Game - Spectate)')
                              : isFull
                              ? (lang === 'ar' ? 'دخول الغرفة (المقاعد ممتلئة - متفرج)' : 'Enter Room (Seats Full - Spectate)')
                              : (lang === 'ar' ? `دخول الغرفة (الرهان: ${room.entryFee} 🪙)` : `Enter Room (${room.entryFee} 🪙)`)}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : lobbyView === 'create_room' ? (
          /* VIEW 2: COMPACT SETUP SCREEN IN A SINGLE SCREEN (NO SUMMARY BOX!) */
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative overflow-y-auto w-full">
            <div
              className="absolute inset-0 bg-cover bg-center -z-10 opacity-20 filter blur-md scale-105 pointer-events-none select-none"
              style={{ backgroundImage: `url('${BOARD_SKINS[selectedBoardSkin]?.image || '/classic_ludo_board.svg'}')` }}
            />

            <div className="w-full max-w-xl bg-slate-950/95 border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_0_50px_rgba(6,182,212,0.25)] backdrop-blur-xl relative z-20 flex flex-col gap-3">
              {/* Header with Back Button */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏰</span>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white">
                      {lang === 'ar' ? 'إنشاء وتجهيز غرفة اللودو' : 'Create & Setup Ludo Room'}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'ar' ? 'حدد الرقعة والقواعد والرهان قبل بدء المعركة' : 'Set board skin, rules, and stakes'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLobbyView('rooms')}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? '← الغرف المباشرة' : '← Active Rooms'}
                </button>
              </div>

              {/* 1. Board Theme Selector (Compact) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
                  <span>🎨 {lang === 'ar' ? 'شكل البورد (الرقعة):' : 'Board Skin:'}</span>
                  <span className="text-[10px] text-amber-400 font-extrabold">
                    {BOARD_SKINS[selectedBoardSkin][lang === 'ar' ? 'nameAr' : 'nameEn']}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(BOARD_SKINS) as BoardTheme[]).map((themeKey) => {
                    const skin = BOARD_SKINS[themeKey];
                    const isSelected = selectedBoardSkin === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => handleSelectTheme(themeKey)}
                        className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-lg">{skin.icon}</div>
                        <div className="text-[9px] font-bold truncate mt-0.5">
                          {lang === 'ar' ? skin.nameAr : skin.nameEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Grid Settings: Players, Tokens, Rules, Stake */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Player Count */}
                <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    👥 {lang === 'ar' ? 'عدد اللاعبين:' : 'Players:'}
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setPlayerCount(2)}
                      className={`py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                        playerCount === 2 ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'ar' ? '2 لاعبين (1v1)' : '2 Players'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayerCount(4)}
                      className={`py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                        playerCount === 4 ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'ar' ? '4 لاعبين (كامل)' : '4 Players'}
                    </button>
                  </div>
                </div>

                {/* Tokens Count */}
                <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    ♟️ {lang === 'ar' ? 'عدد العساكر:' : 'Tokens:'}
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setPieceCount(2)}
                      className={`py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                        pieceCount === 2 ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'ar' ? '2 عساكر (خاطفة)' : '2 Tokens'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPieceCount(4)}
                      className={`py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                        pieceCount === 4 ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'ar' ? '4 عساكر (كلاسيك)' : '4 Tokens'}
                    </button>
                  </div>
                </div>

                {/* Win Rule */}
                <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    🏆 {lang === 'ar' ? 'شرط الفوز:' : 'Win Rule:'}
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setWinRule('first')}
                      className={`py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                        winRule === 'first' ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'ar' ? 'أول عسكري ⚡' : 'First token'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWinRule('all')}
                      className={`py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                        winRule === 'all' ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'ar' ? 'جميع العساكر 🏁' : 'All tokens'}
                    </button>
                  </div>
                </div>

                {/* Stake Amount */}
                <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    💰 {lang === 'ar' ? 'الرهان بالذهب:' : 'Entry Stake:'}
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[50, 100, 500, 1000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setRoomStake(fee)}
                        className={`py-1 rounded-lg border text-[9px] font-black transition-all cursor-pointer ${
                          roomStake === fee ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {fee} 🪙
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS: Enter Room Lounge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleCreateCustomRoom('player')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.5)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🏰</span>
                  <span>{lang === 'ar' ? 'إنشاء ودخول الغرفة كلاعب ⚔️' : 'Create & Enter Room as Player'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateCustomRoom('spectator')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-400/50"
                >
                  <span>🎙️</span>
                  <span>{lang === 'ar' ? 'إنشاء ودخول الغرفة كمتفرج 🎙️' : 'Create & Enter Room as Spectator'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 3: ACTIVE ROOM LOUNGE (شاشة الغرفة ومجلس الطاولة - فصل إنشاء الغرفة عن الجيم) */
          <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 relative overflow-y-auto w-full select-none font-sans no-pull-refresh overscroll-none">
            {/* Ambient Background */}
            <div
              className="absolute inset-0 bg-cover bg-center -z-10 opacity-25 filter blur-sm scale-105 pointer-events-none select-none"
              style={{ backgroundImage: `url('/classic_ludo_board.svg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#02140e]/95 via-[#06241a]/90 to-slate-950/98 -z-10" />

            <div className="w-full max-w-2xl flex flex-col gap-3 z-10 pb-4">

              {/* 1. ROOM TOP BANNER & HEADER */}
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-xl shadow">
                    🏰
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs sm:text-sm font-black text-white">{roomTitle}</h2>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
                        #{roomId}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-amber-300">
                        <span>👑 المضيف:</span>
                        <span className="font-bold">{roomHostName}</span>
                      </span>
                      {roomDeputyId && (
                        <span className="flex items-center gap-1 text-cyan-300">
                          <span>⭐ النائب معين</span>
                        </span>
                      )}
                      <span className="text-amber-400 font-bold">🪙 رهان: {roomStake}</span>
                    </div>
                  </div>
                </div>

                {/* Back to Rooms Hall */}
                <button
                  type="button"
                  onClick={() => setLobbyView('rooms')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>←</span>
                  <span>{lang === 'ar' ? 'صالة الغرف' : 'Rooms Hall'}</span>
                </button>
              </div>

              {/* 2. AUDIO STATION: LOCAL MUSIC FROM DEVICE + VOICE MIC */}
              <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-md">
                {/* Local Music Controller */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!musicTrackName) {
                        musicFileInputRef.current?.click();
                      } else {
                        setIsMusicModalOpen(true);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow ${
                      isPlayingMusic
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse border border-emerald-400'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40'
                    }`}
                    title={lang === 'ar' ? 'تشغيل أو فتح مشغل الموسيقى' : 'Play / Open music player'}
                  >
                    <span>{isPlayingMusic ? '💿' : '🎵'}</span>
                    <span className="truncate max-w-[130px]">
                      {musicTrackName || (lang === 'ar' ? 'أغاني من جهازي' : 'Local Music')}
                    </span>
                  </button>

                  {/* Pick Audio File */}
                  <button
                    type="button"
                    onClick={() => musicFileInputRef.current?.click()}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                    title={lang === 'ar' ? 'اختيار أغنية من هاتفك أو جهازك' : 'Choose audio file from device'}
                  >
                    📂
                  </button>

                  {/* Volume Slider */}
                  <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
                    <span>🔈</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={musicVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 accent-amber-400 cursor-pointer h-1"
                    />
                  </div>
                </div>

                {/* Voice Mic Toggle */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isMicOn
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <span>{isMicOn ? '🎙️' : '🔇'}</span>
                  <span>{isMicOn ? (lang === 'ar' ? 'المايك نشط' : 'Mic On') : (lang === 'ar' ? 'مكتوم' : 'Muted')}</span>
                </button>
              </div>

              {/* 3. THE 4 TABLE PLAYER SEATS */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-3.5 shadow-xl">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 text-xs font-bold">
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <span>🎲</span>
                    <span>{lang === 'ar' ? 'مقاعد الطاولة (اللاعبين الأساسيين):' : 'Table Player Seats:'}</span>
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {lang === 'ar' ? `المقاعد: ${playerCount} لاعبين` : `${playerCount} Players`}
                  </span>
                </div>

                {/* 4 Corner Seats Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2.5">
                  {(['blue', 'green', 'red', 'yellow'] as PlayerColor[]).map((color) => {
                    const seat = tableSeats[color];
                    const isBlue = color === 'blue';
                    const isGreen = color === 'green';
                    const isRed = color === 'red';

                    const colorBg = isBlue
                      ? 'border-blue-500/40 bg-blue-950/20'
                      : isGreen
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : isRed
                      ? 'border-rose-500/40 bg-rose-950/20'
                      : 'border-amber-500/40 bg-amber-950/20';

                    const colorLabel = isBlue
                      ? (lang === 'ar' ? 'المقعد الأزرق (المضيف)' : 'Blue (Host)')
                      : isGreen
                      ? (lang === 'ar' ? 'المقعد الأخضر' : 'Green')
                      : isRed
                      ? (lang === 'ar' ? 'المقعد الأحمر' : 'Red')
                      : (lang === 'ar' ? 'المقعد الأصفر' : 'Yellow');

                    return (
                      <div
                        key={color}
                        className={`p-2.5 rounded-2xl border ${colorBg} flex flex-col justify-between gap-2 transition-all relative overflow-hidden`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">{colorLabel}</span>
                          {seat?.isHost && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-400/40">
                              👑 صاحب الغرفة
                            </span>
                          )}
                          {seat?.isDeputy && (
                            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-black border border-cyan-400/40">
                              ⭐ نائب
                            </span>
                          )}
                        </div>

                        {seat ? (
                          /* Occupied Seat */
                          <div
                            onClick={() => handleUserClick({
                              id: seat.id,
                              name: seat.name,
                              avatar: seat.avatar,
                              seatColor: color,
                              isBot: seat.isBot,
                              isHost: seat.isHost,
                              isDeputy: seat.isDeputy,
                            })}
                            className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-slate-800/50 rounded-xl p-1 transition-all"
                            title="إدارة العضو أو كتمه/ترقيته"
                          >
                            <div className="relative">
                              <img
                                src={seat.avatar}
                                alt={seat.name}
                                className="w-9 h-9 rounded-full border-2 border-white/30 bg-slate-900 object-cover"
                              />
                              <span className="absolute -bottom-1 -right-1 text-[9px] bg-slate-900 rounded-full px-0.5 border border-slate-700">
                                {mutedUserIds.includes(seat.id) ? '🔇' : '🎙️'}
                              </span>
                              {(moderatorIds.includes(seat.id) || seat.isDeputy) && (
                                <span className="absolute -top-1 -right-1 text-[9px]">⭐</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-black text-white truncate flex items-center gap-1">
                                <span>{seat.name}</span>
                              </div>
                              <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                                <span>●</span>
                                <span>{seat.isBot ? 'روبوت ذكي 🤖' : 'لاعب جاهز ⚔️'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Empty Seat */
                          <div className="py-1.5 flex flex-col items-center justify-center text-center gap-1">
                            <div className="w-8 h-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-sm">
                              🪑
                            </div>
                            <span className="text-[9px] text-slate-500">{lang === 'ar' ? 'مقعد شاغر' : 'Empty Seat'}</span>
                          </div>
                        )}

                        {/* Seat Action Buttons */}
                        <div className="flex items-center gap-1 pt-1 border-t border-slate-800/60">
                          {!seat ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTakePlayerSeat(color)}
                                className="flex-1 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-slate-950 text-[10px] font-black cursor-pointer transition-all"
                              >
                                {lang === 'ar' ? 'اجلس كلاعب ⚔️' : 'Sit Here ⚔️'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleBotOnSeat(color)}
                                className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-all"
                                title="إضافة روبوت"
                              >
                                🤖
                              </button>
                            </>
                          ) : (
                            <>
                              {isHost && !seat.isHost && !seat.isBot && !seat.isDeputy && (
                                <button
                                  type="button"
                                  onClick={() => handleAssignDeputy(seat.id)}
                                  className="flex-1 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-[9px] font-black cursor-pointer transition-all"
                                >
                                  {lang === 'ar' ? 'تعيين كنائب ⭐' : 'Make Deputy ⭐'}
                                </button>
                              )}
                              {seat.isBot && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleBotOnSeat(color)}
                                  className="flex-1 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[9px] font-bold cursor-pointer transition-all"
                                >
                                  {lang === 'ar' ? 'إزالة البوت ✕' : 'Remove Bot ✕'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. SPECTATOR VOICE SEATS (مقاعد المتفرجين الصوتية) */}
              <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-2.5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-300 flex items-center gap-1.5">
                    <span>🎙️</span>
                    <span>{lang === 'ar' ? 'مقاعد المتفرجين الصوتية (تشجيع ومايك):' : 'Spectator Voice Seats:'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleJoinSpectatorSeats}
                    className="text-[10px] text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-0.5 rounded-lg border border-purple-500/30 cursor-pointer transition-all font-bold"
                  >
                    {lang === 'ar' ? '+ اصعد لمقاعد المتفرجين' : '+ Join Spectators'}
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                  {spectatorSeats.map((spec) => (
                    <div
                      key={spec.id}
                      onClick={() => handleUserClick({
                        id: spec.id,
                        name: spec.name,
                        avatar: spec.avatar,
                        isSpectator: true,
                        isDeputy: moderatorIds.includes(spec.id),
                        isMuted: mutedUserIds.includes(spec.id),
                      })}
                      className="flex flex-col items-center gap-1 shrink-0 p-1.5 bg-slate-900/60 border border-purple-500/20 rounded-xl min-w-[70px] cursor-pointer hover:border-purple-400/50 hover:bg-purple-950/20 transition-all"
                      title="إدارة العضو أو كتمه/ترقيته"
                    >
                      <div className="relative">
                        <img
                          src={spec.avatar}
                          alt={spec.name}
                          className="w-8 h-8 rounded-full border border-purple-400/50 bg-slate-950"
                        />
                        <span className="absolute -bottom-1 -right-1 text-[10px]">
                          {mutedUserIds.includes(spec.id) ? '🔇' : (spec.isMicOn ? '🎙️' : '🔇')}
                        </span>
                        {moderatorIds.includes(spec.id) && (
                          <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-300 font-bold truncate max-w-[65px]">
                        {spec.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. MATCH LAUNCHER & HOST CONTROLLER (من داخل الغرفة فقط) */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-3.5 shadow-2xl space-y-3">
                {canControlMatch ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>{lang === 'ar' ? 'لوحة تحكم صاحب الغرفة والنائب:' : 'Room Host Controls:'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {lang === 'ar' ? 'أنت تتحكم ببدء الجيم والقواعد 👑' : 'You control match launch 👑'}
                      </span>
                    </div>

                    {/* Mode selection: 2 Players vs 4 Players */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPlayerCount(2)}
                        className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                          playerCount === 2
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        ⚔️ {lang === 'ar' ? 'نمط زوجي (2 لاعبين 1v1)' : '2 Players (1v1)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerCount(4)}
                        className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                          playerCount === 4
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        👑 {lang === 'ar' ? 'نمط رباعي (4 لاعبين كامل)' : '4 Players (Full)'}
                      </button>
                    </div>

                    {/* Board Theme / Skin Selector (اختيار ثيم الرقعة ومجرة الكواكب مباشرة) */}
                    <div className="space-y-1.5 p-2 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <span>🎨</span>
                          <span>{lang === 'ar' ? 'تصميم وثيم الرقعة (المود):' : 'Board Skin / Theme:'}</span>
                        </span>
                        <span className="text-[10px] text-amber-300 font-black">
                          {BOARD_SKINS[selectedBoardSkin][lang === 'ar' ? 'nameAr' : 'nameEn']}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                        {(Object.keys(BOARD_SKINS) as BoardTheme[]).map((themeKey) => {
                          const skin = BOARD_SKINS[themeKey];
                          const isSelected = selectedBoardSkin === themeKey;
                          return (
                            <button
                              key={themeKey}
                              type="button"
                              onClick={() => handleSelectTheme(themeKey)}
                              className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <div className="text-base">{skin.icon}</div>
                              <div className="text-[9px] font-bold truncate mt-0.5">
                                {lang === 'ar' ? skin.nameAr : skin.nameEn}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Solo / Bot Notice */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-[10px] text-amber-300/90 flex items-center gap-2">
                      <span className="text-base">💡</span>
                      <span>
                        {lang === 'ar'
                          ? 'لو جالس وحدك في الغرفة أو لم يكتمل باقي اللاعبين، سيتم تشغيل البوتات الذكية 🤖 تلقائياً لملء المقاعد واللعب معك فوراً!'
                          : 'If you are alone or seats are empty, smart AI bots 🤖 will fill in and play immediately!'}
                      </span>
                    </div>

                    {/* Hero Launch Button */}
                    <button
                      type="button"
                      onClick={startMatchFromRoom}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.6)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
                    >
                      <span>🚀</span>
                      <span>{lang === 'ar' ? 'بدء الجيم الآن داخل الغرفة (Start Match)' : 'Launch Match in Room'}</span>
                    </button>
                  </>
                ) : (
                  /* Not host/deputy */
                  <div className="p-3 text-center space-y-1">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
                      <span>⏳</span>
                      <span>{lang === 'ar' ? `بانتظار صاحب الغرفة (${roomHostName}) أو نائبه لبدء المباراة...` : 'Waiting for host to launch match...'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {lang === 'ar' ? 'استمتع بالدردشة وسماع الأغاني والتفاعل مع الحاضرين حتى تبدأ المعركة ☕' : 'Chat, enjoy local music & get ready!'}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      ) : (
        /* Active Game Board - Single-Screen Mobile Fit (Zero X/Y Scroll, Exact 1:1 Square Board) */
        <div
          className="h-[100dvh] w-full max-w-[100vw] flex flex-col justify-between items-center relative overflow-hidden py-1.5 px-1.5 sm:p-2"
          style={{
            backgroundColor: '#0a3526',
            backgroundImage: `
              linear-gradient(135deg, rgba(255,255,255,0.03) 25%, transparent 25%),
              linear-gradient(225deg, rgba(255,255,255,0.03) 25%, transparent 25%),
              linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
              linear-gradient(315deg, rgba(255,255,255,0.03) 25%, transparent 25%)
            `,
            backgroundPosition: '20px 0, 20px 0, 0 0, 0 0',
            backgroundSize: '40px 40px',
            backgroundRepeat: 'repeat'
          }}
        >
          {/* 1. CLEAN 3-ROW TOP BAR (Matching Reference Screenshot) */}
          <div className="w-full max-w-lg flex flex-col gap-1 z-20 shrink-0 overflow-hidden">
            {/* Row 1: Power + Trophy on left | User Profile Chip on right */}
            <div dir="ltr" className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleExitGame}
                  className="w-8 h-8 rounded-full bg-black/35 hover:bg-rose-950/80 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer active:scale-90"
                  title={lang === 'ar' ? 'خروج من اللعبة' : 'Exit Game'}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v10" />
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setShowH2HModal(true)}
                  className="w-8 h-8 rounded-full bg-black/35 hover:bg-amber-500/20 border border-white/20 flex items-center justify-center text-sm text-amber-300 transition-colors cursor-pointer active:scale-90"
                  title={lang === 'ar' ? 'سجل المواجهات والبطولات' : 'H2H & Leaderboard'}
                >
                  🏆
                </button>
              </div>

              {/* User Profile Chip */}
              <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/35 border border-white/15 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage(lang === 'ar' ? '🤝 تم نسخ رابط دعوة الأصدقاء للغرفة!' : 'Copied room invite link!');
                    try { navigator.clipboard.writeText(window.location.href); } catch (e) {}
                  }}
                  className="w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shadow cursor-pointer active:scale-90"
                  title={lang === 'ar' ? 'إضافة أصدقاء للغرفة' : 'Invite Friends'}
                >
                  👤+
                </button>
                <div className="w-7 h-7 rounded-full overflow-hidden border border-amber-400 bg-slate-800 shrink-0 relative flex items-center justify-center text-[10px]">
                  <span>👑</span>
                  {userProfile?.avatar_url && (
                    <img
                      src={userProfile.avatar_url}
                      alt="User"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="text-right leading-none">
                  <span className="text-[10px] font-black text-white flex items-center gap-0.5">
                    <span>{userProfile?.username || 'Ali'}</span>
                    <span>🇪🇬</span>
                  </span>
                  <span className="text-[8px] text-slate-300 font-sans block mt-0.5">
                    {userProfile?.id ? `${String(userProfile.id).slice(0, 7)} ID` : '12842582 ID'}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Full-Width Mic / Spectator Seats Bar */}
            <div
              dir="ltr"
              ref={micSeatsScrollRef}
              onMouseDown={handleMicMouseDown}
              onMouseLeave={handleMicMouseLeaveOrUp}
              onMouseUp={handleMicMouseLeaveOrUp}
              onMouseMove={handleMicMouseMove}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="w-full flex items-center justify-between gap-1.5 overflow-x-auto overflow-y-hidden select-none cursor-grab active:cursor-grabbing py-0.5 px-1 no-scrollbar [&::-webkit-scrollbar]:hidden"
            >
              {/* Level / Room Rank Badge */}
              <div className="w-8 h-8 rounded-full bg-black/35 border border-emerald-400/50 flex flex-col items-center justify-center text-[9px] font-black text-amber-300 shrink-0 leading-none">
                <span>⭐</span>
                <span>2</span>
              </div>

              {/* 6 Interactive Switchable Voice Mic Seats */}
              {voiceMicSlots.map((slot, slotIdx) => {
                if (!slot) {
                  return (
                    <button
                      key={`mic-slot-${slotIdx}`}
                      type="button"
                      onClick={() => handleTakeVoiceSeat(slotIdx)}
                      className="w-8 h-8 rounded-full bg-black/30 border border-white/25 hover:border-amber-400 hover:bg-amber-400/20 flex items-center justify-center text-xs text-slate-200 transition-transform shrink-0 cursor-pointer active:scale-90"
                      title={lang === 'ar' ? `اصعد على المايك رقم ${slotIdx + 1}` : `Sit on mic seat #${slotIdx + 1}`}
                    >
                      +
                    </button>
                  );
                }

                const isMySeat = slot.id === (userProfile?.id || '12842582');
                const isSlotMuted = isMySeat ? isMicMuted : mutedUserIds.includes(slot.id);
                const isSlotMod = moderatorIds.includes(slot.id) || slot.isDeputy;

                return (
                  <div
                    key={`mic-slot-${slotIdx}`}
                    onClick={() => {
                      if (isMySeat) {
                        setIsMicMuted(prev => !prev);
                        setStatusMessage(!isMicMuted ? (lang === 'ar' ? 'تم كتم المايكروفون' : 'Mic muted') : (lang === 'ar' ? 'تم تشغيل المايكروفون' : 'Mic active'));
                      } else {
                        handleUserClick({
                          id: slot.id,
                          name: slot.name,
                          avatar: slot.avatar,
                          isSpectator: true,
                          isBot: false,
                          isHost: slot.isHost,
                          isDeputy: slot.isDeputy,
                        });
                      }
                    }}
                    className={`relative w-8 h-8 rounded-full border-2 ${isMySeat ? 'border-emerald-400 ring-2 ring-emerald-400/40' : slot.isHost ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-amber-300'} p-0.5 shrink-0 bg-slate-900 cursor-pointer hover:scale-105 transition-transform`}
                    title={isMySeat ? (lang === 'ar' ? 'مقعدك (اضغط لكتم/تشغيل المايك)' : 'Your seat (click to mute/unmute)') : `${slot.name}`}
                  >
                    <img src={slot.avatar} alt={slot.name} className="w-full h-full object-cover rounded-full" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${isSlotMuted ? 'bg-rose-600' : 'bg-emerald-600'} border border-white flex items-center justify-center text-white`}>
                      <MicIcon muted={isSlotMuted} className="w-2 h-2" />
                    </div>
                    {isMySeat && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveVoiceSeat();
                        }}
                        className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-slate-950 border border-white/50 text-[7px] text-white flex items-center justify-center cursor-pointer hover:bg-rose-600"
                        title={lang === 'ar' ? 'انزل من المايك' : 'Leave mic seat'}
                      >
                        ✕
                      </button>
                    )}
                    {slot.isHost ? (
                      <div className="absolute -top-1.5 -right-1 text-[9px] z-10">👑</div>
                    ) : isSlotMod ? (
                      <div className="absolute -top-1 -right-1 text-[8px] z-10">⭐</div>
                    ) : null}
                  </div>
                );
              })}

              {/* Locked VIP Seat */}
              <div className="w-8 h-8 rounded-full bg-black/30 border border-white/15 flex items-center justify-center text-xs text-slate-400 shrink-0">
                🔒
              </div>
            </div>

            {/* Row 3: Treasure Chest + Compact Status + Floating-Style Settings Gear */}
            <div dir="ltr" className="w-full flex items-center justify-between gap-2 px-0.5">
              {/* Coin Chest Button */}
              <button
                type="button"
                onClick={() => {
                  setPlayerCoins(prev => {
                    const next = prev + 50;
                    try { localStorage.setItem('ludo_coins_balance', next.toString()); } catch (e) {}
                    return next;
                  });
                  playCoinChime();
                  setStatusMessage(lang === 'ar' ? '🎁 تم جمع مكافأة الصندوق اليومي (+50 🪙)!' : '🎁 Collected daily bonus (+50 🪙)!');
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/35 border border-amber-400/50 text-amber-300 text-[11px] font-black cursor-pointer active:scale-95 transition-transform shrink-0"
                title={lang === 'ar' ? 'صندوق المكافآت الذهبية' : 'Coins Chest'}
              >
                <span>🎁</span>
                <span>{playerCoins}</span>
                <span>🪙</span>
              </button>

              {/* Turn / Game Status Pill */}
              <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/15 text-[10px] font-bold text-amber-200 truncate flex-1 text-center">
                {statusMessage}
              </div>

              {/* Side Settings Gear (ترتيب باقي الأدوات بداخله) */}
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="w-8 h-8 rounded-full bg-black/35 hover:bg-slate-800 border border-white/25 text-white flex items-center justify-center text-base shadow cursor-pointer active:scale-90 transition-transform shrink-0"
                title={lang === 'ar' ? 'الإعدادات والتحكم السريع ⚙️' : 'Settings & Quick Controls ⚙️'}
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* 2. CENTER LUDO BOARD: Maximized 1:1 Square Board for Bigger Track Cells & Pawns */}
          <div
            dir="ltr"
            className="rounded-2xl shadow-lg border-2 border-emerald-800/80 relative shrink-0 z-10 mx-auto"
            style={{
              width: 'min(98vw, 470px, calc(100dvh - 196px))',
              height: 'min(98vw, 470px, calc(100dvh - 196px))',
            }}
          >
            {/* Bottom Layer: Unified 15x15 Board Grid with tight gaps so track squares stay huge */}
            <div
              className={`w-full h-full grid gap-[1px] sm:gap-[2px] p-[2px] rounded-[14px] overflow-hidden ${
                selectedBoardSkin === 'classic' ? 'bg-slate-200' : 'bg-slate-950'
              }`}
              style={{
                gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
                gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
                ...(selectedBoardSkin !== 'classic' && BOARD_SKINS[selectedBoardSkin]?.image
                  ? {
                      backgroundImage: `url('${BOARD_SKINS[selectedBoardSkin].image}')`,
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }
                  : {}),
              }}
            >
              {renderBoard()}
            </div>

            {/* Top Layer: Active Pawns organized squarely in their 15x15 cells above all board layers */}
            <div
              className="absolute inset-0 w-full h-full grid gap-[1px] sm:gap-[2px] p-[2px] pointer-events-none z-30"
              style={{
                gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
                gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
              }}
            >
              {renderTokensLayer()}
            </div>
          </div>

          {/* 3. CLEAN OPEN CHAT TICKER & BOTTOM TOOLBAR (Matching Reference Layout) */}
          <div className="w-full max-w-lg flex flex-col gap-0.5 z-20 shrink-0">
            {/* Chat Tabs & Translucent Feed */}
            <div className="w-full px-1.5 flex flex-col gap-0.5">
              {/* Category Pills: جميع, هدية, خبر */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black">
                  {[
                    { id: 'all', labelAr: 'جميع', labelEn: 'All' },
                    { id: 'gift', labelAr: 'هدية', labelEn: 'Gifts' },
                    { id: 'news', labelAr: 'خبر', labelEn: 'News' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setChatTab(tab.id as any)}
                      className={`px-2 py-0.2 rounded-full transition-colors cursor-pointer ${
                        chatTab === tab.id
                          ? 'text-white bg-white/15'
                          : 'text-slate-300/70 hover:text-white'
                      }`}
                    >
                      {lang === 'ar' ? tab.labelAr : tab.labelEn}
                    </button>
                  ))}
                </div>
                <span className="text-[9px] text-slate-300/70">
                  {lang === 'ar' ? 'غرفة #4082' : 'Room #4082'}
                </span>
              </div>

              {/* Ticker Feed Messages */}
              <div className="h-5 overflow-y-auto no-scrollbar flex flex-col justify-end text-[10px] leading-tight">
                {chatMessages
                  .filter(m => chatTab === 'all' || m.type === chatTab)
                  .slice(0, 1)
                  .map(msg => (
                    <div key={msg.id} className="flex items-center gap-1.5 text-slate-100 truncate">
                      {msg.user && (
                        <span className="text-amber-300 font-bold shrink-0">
                          @{msg.user}:
                        </span>
                      )}
                      <span className="truncate">{msg.text}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 4. BOTTOM ACTION TOOLBAR (Gift, Menu, Mail, Mic, Smileys, Chat Input - Matching Image 1 & 3) */}
            <div className="w-full flex items-center justify-between gap-1.5 px-1 py-0.5 relative">
              {/* EMOJI & STICKERS POPUP DRAWER (أعلى زر الإيموجي مباشرةً مع ملصقاتنا الخاصة) */}
              {showEmotesBar && (
                <div
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  className="absolute bottom-12 right-2 sm:right-16 z-50 bg-slate-950/95 border-2 border-amber-400/80 rounded-2xl p-3 shadow-[0_0_35px_rgba(0,0,0,0.95)] backdrop-blur-xl animate-fadeIn flex flex-col gap-2.5 min-w-[270px] max-w-[320px]"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs font-black text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <span>🎭</span>
                      <span>{lang === 'ar' ? 'إيموجي وملصقات اللعبة' : 'Game Stickers & Emotes'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmotesBar(false)}
                      className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[10px] font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Our Custom Image Emotes / Stickers */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1 font-bold">
                      {lang === 'ar' ? 'ملصقاتنا المميزة:' : 'Featured Stickers:'}
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'laugh', img: '/laugh_emote.png', name: 'ضحكة أسطورية' },
                        { id: 'kaizen', img: '/kaizen_emoji_pack.png', name: 'كايزن إيموجي' },
                        { id: 'dragon', img: '/dragon_emote.png', name: 'التنين المقاتل' },
                      ].map(stk => (
                        <button
                          key={stk.id}
                          type="button"
                          onClick={() => {
                            addChatMessage(`${userProfile?.username || 'Ali'}: أرسل ملصق ${stk.name} ✨`, 'chat', userProfile?.username || 'Ali');
                            triggerPlayerEmote('blue', 'wizard');
                            setShowEmotesBar(false);
                            playGiftSound('chime');
                          }}
                          className="p-1 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-700/80 hover:border-amber-400 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title={stk.name}
                        >
                          <img src={stk.img} alt={stk.name} className="w-8 h-8 rounded-lg object-contain" />
                          <span className="text-[8px] text-slate-300 font-bold truncate max-w-full">{stk.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Reaction Emojis */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1 font-bold">
                      {lang === 'ar' ? 'إيموجي التفاعل السريع:' : 'Quick Reactions:'}
                    </span>
                    <div className="grid grid-cols-6 gap-1 text-center">
                      {['😂', '🤣', '🔥', '👑', '👏', '🧙‍♂️', '🛡️', '🏹', '💀', '❤️', '🤝', '☕'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            addChatMessage(`${userProfile?.username || 'Ali'}: ${emoji}`, 'chat', userProfile?.username || 'Ali');
                            setShowEmotesBar(false);
                            playGiftSound('chime');
                          }}
                          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-amber-400/20 text-lg hover:scale-125 transition-transform active:scale-90 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div dir="ltr" className="w-full flex items-center justify-between gap-2">
                {/* Left Cluster: Peace & War, Menu, History */}
                <div className="flex items-center gap-2">
                  {/* Peace & War Trigger 🕊️⚔️ */}
                  <button
                    type="button"
                    onClick={() => setSelectedGiftTarget('red')}
                    className="h-9 px-2.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-sm shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-amber-300"
                    title={lang === 'ar' ? 'السلام والحرب (هدايا ومقالب) 🕊️⚔️' : 'Peace & War 🕊️⚔️'}
                  >
                    🕊️⚔️
                  </button>

                  {/* Grid Menu Button ⊞ */}
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className="w-9 h-9 rounded-full bg-black/45 border border-white/20 text-slate-200 flex items-center justify-center text-sm shadow hover:text-white active:scale-95 transition-transform cursor-pointer"
                    title={lang === 'ar' ? 'القائمة والإعدادات' : 'Menu & Settings'}
                  >
                    ⊞
                  </button>

                  {/* Mail / History Button ✉️ */}
                  <button
                    type="button"
                    onClick={() => setShowH2HModal(true)}
                    className="w-9 h-9 rounded-full bg-black/45 border border-white/20 text-slate-200 flex items-center justify-center text-sm shadow hover:text-white active:scale-95 transition-transform cursor-pointer"
                    title={lang === 'ar' ? 'سجل المواجهات' : 'History'}
                  >
                    ✉️
                  </button>
                </div>

                {/* Right Cluster: Mic, Smileys, Quick Chat */}
                <div className="flex items-center gap-2">
                  {/* Mic Toggle Button (Microphone SVG icon, NOT speaker) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMicMuted(prev => !prev);
                      setStatusMessage(!isMicMuted ? (lang === 'ar' ? 'تم كتم المايكروفون' : 'Mic muted') : (lang === 'ar' ? 'تم تشغيل المايكروفون' : 'Mic unmuted'));
                    }}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center shadow active:scale-95 transition-transform cursor-pointer ${
                      isMicMuted
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                        : 'bg-black/45 border-emerald-400/70 text-emerald-300'
                    }`}
                    title={isMicMuted ? 'تفعيل المايكروفون' : 'كتم المايكروفون'}
                  >
                    <MicIcon muted={isMicMuted} className="w-4 h-4" />
                  </button>

                  {/* Smileys / Emotes Picker Button 😄 */}
                  <button
                    type="button"
                    onClick={() => setShowEmotesBar(prev => !prev)}
                    className="w-9 h-9 rounded-full bg-black/45 border border-white/20 text-slate-200 flex items-center justify-center text-lg shadow hover:text-white active:scale-95 transition-transform cursor-pointer"
                    title={lang === 'ar' ? 'تفاعلات وإيموجي' : 'Emotes'}
                  >
                    😄
                  </button>

                  {/* Quick Chat Button 💬 */}
                  <button
                    type="button"
                    onClick={() => setShowQuickChat(true)}
                    className="h-9 px-3 rounded-full bg-black/45 border border-white/20 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-transform cursor-pointer"
                    title={lang === 'ar' ? 'دردشة سريعة' : 'Quick Chat'}
                  >
                    <span>💬</span>
                    <span className="hidden sm:inline">{lang === 'ar' ? 'دردشة' : 'Chat'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLYING PROJECTILE ANIMATION OVERLAY */}
      {flyingGift && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-5xl sm:text-6xl animate-[fly-projectile_0.6s_cubic-bezier(0.2,0.8,0.2,1)_forwards] filter drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">
            {flyingGift.icon}
          </div>
        </div>
      )}

      {/* 🕊️⚔️ PEACE & WAR GIFT / PRANK SELECTION MODAL */}
      {selectedGiftTarget && (
        <div
          onClick={() => setSelectedGiftTarget(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl relative flex flex-col gap-3"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🕊️⚔️</span>
                <div>
                  <h3 className="text-sm font-black text-amber-400">
                    {lang === 'ar' ? 'السلام والحرب (الهدايا والمقالب)' : 'Peace & War (Gifts & Pranks)'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'ar' ? 'إرسال إلى: ' : 'Send to: '}
                    <span className="text-amber-300 font-bold">{getPlayerName(selectedGiftTarget)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                  🪙 {playerCoins}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGiftTarget(null)}
                  className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Target Player Selector */}
            <div className="flex items-center gap-1.5">
              {(['green', 'yellow', 'red'] as PlayerColor[])
                .filter(c => playerConfig[c] !== 'none')
                .map(c => (
                  <button
                    key={`target-${c}`}
                    type="button"
                    onClick={() => setSelectedGiftTarget(c)}
                    className={`flex-1 py-1 px-2 rounded-xl text-[10px] font-black border transition-colors cursor-pointer truncate ${
                      selectedGiftTarget === c
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c === 'green' ? '🟢 ' : c === 'yellow' ? '🟡 ' : '🔴 '}
                    {getPlayerName(c)}
                  </button>
                ))}
            </div>

            {/* Category Switcher: War vs Peace */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGiftCategoryTab('prank')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  giftCategoryTab === 'prank'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚔️ {lang === 'ar' ? 'حرب (مقالب وضرب)' : 'War (Pranks)'}
              </button>
              <button
                type="button"
                onClick={() => setGiftCategoryTab('friendly')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  giftCategoryTab === 'friendly'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🕊️ {lang === 'ar' ? 'سلام (تحيات وود)' : 'Peace (Greetings)'}
              </button>
            </div>

            {/* Gifts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto p-1">
              {GIFTS_LIST.filter(g => g.category === giftCategoryTab).map((gift) => {
                const canAfford = playerCoins >= gift.cost;
                return (
                  <button
                    key={gift.id}
                    type="button"
                    onClick={() => handleSendGift(gift, selectedGiftTarget)}
                    className={`flex flex-col items-center justify-between p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/60 hover:border-amber-400/80 hover:scale-[1.03] shadow-md active:scale-95'
                        : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-3xl mb-1 filter drop-shadow">{gift.icon}</span>
                    <span className="text-[11px] font-black text-slate-200 leading-tight">
                      {lang === 'ar' ? gift.nameAr : gift.nameEn}
                    </span>
                    <p className="text-[9px] text-slate-400 line-clamp-1 my-0.5">
                      {gift.descAr}
                    </p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${
                      canAfford
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      🪙 {gift.cost}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 📊 HEAD-TO-HEAD MATCH LOG MODAL */}
      {showH2HModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl relative flex flex-col gap-4 max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                  <span>🏆</span>
                  <span>{lang === 'ar' ? 'سجل المواجهات التاريخي الدائم' : 'Historical Head-to-Head Record'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'ar' ? 'يتم حفظ وتحديث نتائجك باستمرار مع كل مباراة' : 'Your records are persistently tracked across all matches'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowH2HModal(false)}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'إجمالي المباريات' : 'Matches'}</span>
                <span className="text-lg font-black text-white">{h2hRecord.totalMatches}</span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-center">
                <span className="text-[10px] text-cyan-400 block">{lang === 'ar' ? 'انتصاراتك' : 'Your Wins'}</span>
                <span className="text-lg font-black text-cyan-300">
                  {h2hRecord.playerWins}
                  <span className="text-[10px] text-slate-400 font-normal mr-1">
                    ({h2hRecord.totalMatches > 0 ? Math.round((h2hRecord.playerWins / h2hRecord.totalMatches) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center">
                <span className="text-[10px] text-rose-400 block">{lang === 'ar' ? 'انتصارات الخصوم' : 'Opponent Wins'}</span>
                <span className="text-lg font-black text-rose-300">{h2hRecord.opponentWins}</span>
              </div>
            </div>

            {/* Breakdown by Opponent Color */}
            <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 block mb-2">
                {lang === 'ar' ? '🎯 تفصيل انتصارات الخصوم حسب اللون:' : 'Wins by Opponent Color:'}
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <span className="text-emerald-400 font-bold block">🟢 الأخضر</span>
                  <span className="font-black text-white text-sm">{h2hRecord.byColor?.green || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/30">
                  <span className="text-rose-400 font-bold block">🔴 الأحمر</span>
                  <span className="font-black text-white text-sm">{h2hRecord.byColor?.red || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
                  <span className="text-amber-400 font-bold block">🟡 الأصفر</span>
                  <span className="font-black text-white text-sm">{h2hRecord.byColor?.yellow || 0}</span>
                </div>
              </div>
            </div>

            {/* Match History Log */}
            <div className="flex-1 overflow-y-auto max-h-[30vh] border border-slate-800/80 rounded-2xl p-2 bg-slate-950/50">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 px-1">
                {lang === 'ar' ? '📜 سجل آخر المباريات:' : 'Recent Matches:'}
              </span>
              {(!h2hRecord.history || h2hRecord.history.length === 0) ? (
                <div className="py-6 text-center text-xs text-slate-500 font-bold">
                  {lang === 'ar' ? 'لا توجد مباريات مسجلة بعد. العب الآن لبدء تسجيل تاريخك!' : 'No recorded matches yet. Play to start logging history!'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {h2hRecord.history.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/70 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">#{h2hRecord.history.length - idx}</span>
                        <span className="font-black text-slate-200">
                          {m.winner === 'blue' ? '👑 ' : '💀 '}
                          {m.winnerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{m.playersCount} {lang === 'ar' ? 'لاعبين' : 'players'}</span>
                        <span>•</span>
                        <span>{m.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <button
                type="button"
                onClick={handleResetH2H}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                🗑️ {lang === 'ar' ? 'تصفير السجل' : 'Reset Record'}
              </button>
              <button
                type="button"
                onClick={() => setShowH2HModal(false)}
                className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'تم' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / GAME OVER MODAL */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-950 border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.3)] relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />

            <div className="relative z-10">
              <span className="text-6xl inline-block mb-3 animate-bounce">
                {winner === 'blue' ? '🏆' : '👑'}
              </span>

              <h3 className="text-2xl font-black text-amber-400 mb-1">
                {winner === 'blue'
                  ? (lang === 'ar' ? 'نصر أسطوري ساحق!' : 'Epic Victory!')
                  : (lang === 'ar' ? 'انتهت المعركة!' : 'Match Ended!')}
              </h3>

              <p className="text-xs text-slate-300 font-semibold mb-4">
                {lang === 'ar' ? `الفائز بالبطولة هو: ` : `Tournament Winner: `}
                <span className="text-amber-300 font-black">{getPlayerName(winner)}</span>
              </p>

              {winner === 'blue' && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 mb-5 flex items-center justify-center gap-3">
                  <span className="text-2xl">🪙</span>
                  <div className="text-right">
                    <p className="text-xs font-black text-amber-300">+150 عملة ذهبية</p>
                    <p className="text-[10px] text-slate-400">مكافأة الفوز في بطولة اللودو</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={resetGame}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-98 transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'لعب جولة جديدة 🔁' : 'Play Again 🔁'}
                </button>

                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'CLOSE_GAME' }, '*');
                    }
                    resetGame();
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'العودة للرئيسية 🚪' : 'Exit to Hub 🚪'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💬 QUICK CHAT MODAL */}
      {showQuickChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-950 border border-amber-500/50 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-black text-amber-300">💬 {lang === 'ar' ? 'الدردشة والتعليقات السريعة' : 'Quick Chat'}</span>
              <button
                type="button"
                onClick={() => setShowQuickChat(false)}
                className="w-6 h-6 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Phrases */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'لعبة ممتعة يا أبطال! 🔥',
                'عاش يا وحش! 👏',
                'ركز معايا بقى! 🎯',
                'حظ أوفر يا صديقي! 🤝',
                'يلا العب سريع ⚡',
                'كفو والله! 👑',
              ].map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    addChatMessage(phrase, 'chat', userProfile?.username || 'Ali');
                    setShowQuickChat(false);
                    playGiftSound('chime');
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-400/50 text-[11px] text-slate-200 font-bold text-center active:scale-95 transition-all cursor-pointer"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={quickInputText}
                onChange={(e) => setQuickInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickInputText.trim()) {
                    addChatMessage(quickInputText.trim(), 'chat', userProfile?.username || 'Ali');
                    setQuickInputText('');
                    setShowQuickChat(false);
                  }
                }}
                placeholder={lang === 'ar' ? 'اكتب رسالة للغرفة...' : 'Type message...'}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (quickInputText.trim()) {
                    addChatMessage(quickInputText.trim(), 'chat', userProfile?.username || 'Ali');
                    setQuickInputText('');
                    setShowQuickChat(false);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs active:scale-95 transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إرسال' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👑 USER MODERATION & PROFILE MODAL */}
      {selectedUserForModeration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/50 rounded-3xl p-5 shadow-[0_0_50px_rgba(251,191,36,0.3)] flex flex-col gap-4 text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>{canAccessSettings ? '👑 لوحة تحكم المشرف' : '👤 الملف الشخصي'}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedUserForModeration(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target User Info */}
            <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-slate-800 shrink-0">
                <img
                  src={selectedUserForModeration.avatar}
                  alt={selectedUserForModeration.name}
                  className="w-full h-full object-cover"
                />
                {selectedUserForModeration.isMuted && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs">
                    🔇
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-white truncate flex items-center gap-1">
                  <span>{selectedUserForModeration.name}</span>
                  {selectedUserForModeration.isHost && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-400/40">
                      👑 المالك
                    </span>
                  )}
                  {selectedUserForModeration.isDeputy && (
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-black border border-cyan-400/40">
                      ⭐ مشرف
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>
                    {selectedUserForModeration.isSpectator ? '🎙️ متفرج على المايك' : '⚔️ لاعب على الطاولة'}
                  </span>
                  <span>●</span>
                  <span className={`flex items-center gap-1 ${selectedUserForModeration.isMuted ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                    <MicIcon muted={!!selectedUserForModeration.isMuted} className="w-3 h-3" />
                    <span>{selectedUserForModeration.isMuted ? 'مكتوم المايك' : 'المايك نشط'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 🕊️⚔️ Peace & War Gift Box Action on Profile */}
            {selectedUserForModeration.seatColor && selectedUserForModeration.seatColor !== 'blue' && (
              <button
                type="button"
                onClick={() => {
                  const seatCol = selectedUserForModeration.seatColor!;
                  setSelectedUserForModeration(null);
                  setSelectedGiftTarget(seatCol);
                }}
                className="w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 border border-amber-300 shadow cursor-pointer active:scale-98"
              >
                <span>🕊️⚔️</span>
                <span>{lang === 'ar' ? `سلام أو حرب مع ${selectedUserForModeration.name}` : `Peace or War with ${selectedUserForModeration.name}`}</span>
              </button>
            )}

            {/* 👤 Add Friend Action Button (إضافة صديق) */}
            {selectedUserForModeration.id !== userProfile?.id && (
              <button
                type="button"
                onClick={() => handleSendFriendRequest(selectedUserForModeration.id, selectedUserForModeration.name)}
                className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow cursor-pointer active:scale-98 ${
                  sentFriendRequests.includes(selectedUserForModeration.id)
                    ? 'bg-emerald-600/90 text-white border border-emerald-400'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                }`}
              >
                <span>{sentFriendRequests.includes(selectedUserForModeration.id) ? '✓' : '👤➕'}</span>
                <span>
                  {sentFriendRequests.includes(selectedUserForModeration.id)
                    ? (lang === 'ar' ? 'تم إرسال طلب الصداقة بنجاح' : 'Friend Request Sent')
                    : (lang === 'ar' ? `إضافة ${selectedUserForModeration.name} كصديق` : `Add ${selectedUserForModeration.name} as Friend`)}
                </span>
              </button>
            )}

            {/* If Host or Admin: Moderation Actions! */}
            {canAccessSettings ? (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <span>⚡</span>
                  <span>{lang === 'ar' ? 'إجراءات الإشراف على العضو:' : 'Moderator Actions:'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* 1. Mute / Unmute */}
                  <button
                    type="button"
                    onClick={() => handleToggleMuteUser(selectedUserForModeration.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-black transition-all cursor-pointer ${
                      selectedUserForModeration.isMuted
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300 hover:bg-emerald-900/80'
                        : 'bg-rose-950/60 border-rose-600 text-rose-300 hover:bg-rose-900/80'
                    }`}
                  >
                    <MicIcon muted={!selectedUserForModeration.isMuted} className="w-4 h-4" />
                    <span>{selectedUserForModeration.isMuted ? 'إلغاء الكتم' : 'كتم المايك'}</span>
                  </button>

                  {/* 2. Promote to Admin / Revoke */}
                  {!selectedUserForModeration.isHost && (
                    <button
                      type="button"
                      onClick={() => handleToggleAdminUser(selectedUserForModeration.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-black transition-all cursor-pointer ${
                        selectedUserForModeration.isDeputy
                          ? 'bg-amber-950/60 border-amber-600 text-amber-300 hover:bg-amber-900/80'
                          : 'bg-cyan-950/60 border-cyan-600 text-cyan-300 hover:bg-cyan-900/80'
                      }`}
                    >
                      <span className="text-base">{selectedUserForModeration.isDeputy ? '⭐' : '👑'}</span>
                      <span>{selectedUserForModeration.isDeputy ? 'سحب الإشراف' : 'منح إشراف'}</span>
                    </button>
                  )}

                  {/* 3. Kick from Room */}
                  {!selectedUserForModeration.isHost && (
                    <button
                      type="button"
                      onClick={() => handleKickUser(selectedUserForModeration.id)}
                      className="p-2.5 rounded-xl border border-orange-600/70 bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 flex flex-col items-center justify-center gap-1 text-xs font-black transition-all cursor-pointer"
                    >
                      <span className="text-base">🚪</span>
                      <span>طرد من الغرفة</span>
                    </button>
                  )}

                  {/* 4. Block / Ban */}
                  {!selectedUserForModeration.isHost && (
                    <button
                      type="button"
                      onClick={() => handleBlockUser(selectedUserForModeration.id)}
                      className="p-2.5 rounded-xl border border-red-700 bg-red-950/70 hover:bg-red-900/90 text-red-300 flex flex-col items-center justify-center gap-1 text-xs font-black transition-all cursor-pointer"
                    >
                      <span className="text-base">⛔</span>
                      <span>حظر (بلوك)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Regular user view: Send Gift / Cheer */
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-slate-300">
                  {lang === 'ar' ? 'التفاعل وإرسال الهدايا:' : 'Send Gift & Cheer:'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addChatMessage(`${userProfile?.username || 'Ali'}: أرسل وردة 🌹 إلى ${selectedUserForModeration.name}`, 'gift');
                      setSelectedUserForModeration(null);
                      playGiftSound('chime');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex flex-col items-center text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="text-xl">🌹</span>
                    <span className="text-[10px] text-slate-400 mt-1">وردة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addChatMessage(`${userProfile?.username || 'Ali'}: أرسل فنجان قهوة ☕ إلى ${selectedUserForModeration.name}`, 'gift');
                      setSelectedUserForModeration(null);
                      playGiftSound('chime');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex flex-col items-center text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="text-xl">☕</span>
                    <span className="text-[10px] text-slate-400 mt-1">قهوة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addChatMessage(`${userProfile?.username || 'Ali'}: أرسل تاج الملوك 👑 إلى ${selectedUserForModeration.name}`, 'gift');
                      setSelectedUserForModeration(null);
                      playGiftSound('chime');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex flex-col items-center text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="text-xl">👑</span>
                    <span className="text-[10px] text-slate-400 mt-1">تاج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎵 FULL MUSIC PLAYER MODAL */}
      {isMusicModalOpen && (
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn"
        >
          <div
            ref={musicModalRef}
            className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/50 rounded-3xl p-5 shadow-[0_0_50px_rgba(251,191,36,0.35)] flex flex-col items-center gap-4 relative overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎶</span>
                <span className="text-sm font-black text-amber-300">
                  {lang === 'ar' ? 'مشغل الأغاني الأسطواني' : 'Vinyl Music Player'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMusicModalOpen(false);
                    setIsMusicMinimized(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700"
                  title={lang === 'ar' ? 'تصغير إلى أسطوانة عائمة' : 'Minimize to vinyl'}
                >
                  ↙️ {lang === 'ar' ? 'تصغير' : 'Min'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMusicModalOpen(false);
                    setIsMusicMinimized(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 hover:border-rose-600 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Rotating Large Vinyl Display */}
            <div className="relative my-1">
              <div
                className={`w-36 h-36 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.95)] border-4 border-slate-800 p-2 flex items-center justify-center transition-all ${
                  isPlayingMusic ? 'animate-[spin_3.5s_linear_infinite]' : ''
                }`}
                style={{
                  background: 'radial-gradient(circle, #25252d 15%, #050505 45%, #18181f 70%, #000000 100%)',
                }}
              >
                <div className="w-28 h-28 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg relative border-2 border-white/30">
                      <span className="text-lg">🎵</span>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-white/40 absolute" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="text-center w-full px-2">
              <h4 className="text-sm font-black text-amber-300 truncate max-w-full">
                {musicTrackName || (lang === 'ar' ? 'لم يتم اختيار أغنية بعد' : 'No song selected')}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {lang === 'ar' ? 'تشغيل من هاتفك وجهازك 🎧' : 'Playing local device audio 🎧'}
              </p>
            </div>

            {/* Progress Bar & Timing */}
            <div className="w-full space-y-1">
              <input
                type="range"
                min="0"
                max={musicDuration || 100}
                value={musicCurrentTime || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMusicCurrentTime(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-slate-800"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatMusicTime(musicCurrentTime)}</span>
                <span>{formatMusicTime(musicDuration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="w-full flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 accent-amber-400 cursor-pointer h-1"
                />
              </div>

              <button
                type="button"
                onClick={toggleMusic}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 flex items-center justify-center text-lg font-black shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95 transition-all cursor-pointer"
              >
                {isPlayingMusic ? '⏸️' : '▶️'}
              </button>

              <button
                type="button"
                onClick={() => musicFileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                title={lang === 'ar' ? 'تغيير الأغنية واختيار ملف آخر' : 'Change song'}
              >
                <span>📂</span>
                <span>{lang === 'ar' ? 'تغيير' : 'Pick'}</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              {lang === 'ar'
                ? '💡 اضغط في أي مكان بالشاشة لتصغير المشغل لأسطوانة عائمة تدور أثناء اللعب!'
                : '💡 Click outside to minimize to a spinning vinyl record!'}
            </p>
          </div>
        </div>
      )}

      {/* 💽 FLOATING MINIMIZED VINYL RECORD WIDGET */}
      {isMusicMinimized && !isMusicModalOpen && (
        <div
          onClick={() => setIsMusicModalOpen(true)}
          className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2 cursor-pointer group select-none active:scale-95 transition-transform"
          title={lang === 'ar' ? 'انقر لفتح مشغل الأغاني' : 'Click to open music player'}
        >
          {musicTrackName && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-950/90 border border-amber-400/50 rounded-full text-[11px] text-amber-300 font-bold shadow-2xl backdrop-blur-md max-w-[170px] truncate animate-fadeIn">
              <span className={isPlayingMusic ? 'animate-bounce' : ''}>🎶</span>
              <span className="truncate">{musicTrackName}</span>
            </div>
          )}

          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            {isPlayingMusic && (
              <>
                <span className="absolute inset-0 rounded-full bg-amber-400/25 animate-ping" />
                <span className="absolute -inset-1 rounded-full border border-amber-400/40 animate-pulse" />
              </>
            )}

            <div
              className={`w-full h-full rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.9)] border-2 border-slate-700/80 p-1 flex items-center justify-center transition-all ${
                isPlayingMusic ? 'animate-[spin_3s_linear_infinite]' : ''
              }`}
              style={{
                background: 'radial-gradient(circle, #25252c 15%, #070709 45%, #16161c 70%, #000000 100%)',
              }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/5 flex items-center justify-center">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-inner relative border border-white/30">
                    <span className="text-[9px]">🎵</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-white/40 absolute" />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center text-[7px] font-black shadow ${
                isPlayingMusic ? 'bg-emerald-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
              }`}
            >
              {isPlayingMusic ? '▶' : '⏸'}
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ FLOATING SETTINGS & QUICK CONTROLS MODAL */}
      {showSettingsModal && (
        <div
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-950 border-2 border-amber-500/50 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-slate-100 max-h-[88dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>⚙️</span>
                <span>{lang === 'ar' ? 'الإعدادات والتحكم السريع' : 'Settings & Quick Controls'}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-300">
                  🪙 {playerCoins}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-6 h-6 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {/* Quick Control Buttons Grid (نُقلت من الهيدر العلوي) */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMuted(prev => !prev)}
                  className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    isMuted ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  }`}
                >
                  <span>{isMuted ? '🔇' : '🔊'}</span>
                  <span>{isMuted ? (lang === 'ar' ? 'الصوت مكتوم' : 'Muted') : (lang === 'ar' ? 'المؤثرات شغالة' : 'Sound On')}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    isMicOn ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' : 'bg-rose-950/80 text-rose-300 border-rose-800'
                  }`}
                >
                  <MicIcon muted={!isMicOn} className="w-4 h-4" />
                  <span>{isMicOn ? (lang === 'ar' ? 'المايك نشط' : 'Mic Active') : (lang === 'ar' ? 'المايك مكتوم' : 'Mic Off')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    if (!musicTrackName) {
                      musicFileInputRef.current?.click();
                    } else {
                      setIsMusicModalOpen(true);
                    }
                  }}
                  className="p-2 rounded-xl border border-amber-500/35 bg-slate-900/80 hover:bg-slate-800 text-amber-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{isPlayingMusic ? '⏸️' : '🎵'}</span>
                  <span className="truncate">{musicTrackName || (lang === 'ar' ? 'مشغل الأغاني' : 'Music')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowCinematicIntro(true);
                  }}
                  className="p-2 rounded-xl border border-amber-500/35 bg-slate-900/80 hover:bg-slate-800 text-amber-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🎬</span>
                  <span>{lang === 'ar' ? 'الدخلة السينمائية' : 'Intro'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowH2HModal(true);
                  }}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🏆</span>
                  <span>{lang === 'ar' ? 'سجل المواجهات' : 'H2H Stats'}</span>
                </button>

                {gameStarted && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      returnToRoom();
                    }}
                    className="p-2 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🏰</span>
                    <span>{lang === 'ar' ? 'مجلس الغرفة' : 'Room Lounge'}</span>
                  </button>
                )}
              </div>

              {/* Admin / Host Settings Section */}
              {canAccessSettings && (
                <>
                  {/* Theme Selection */}
                  <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300 font-bold block">{lang === 'ar' ? 'تصميم الرقعة (الثيم):' : 'Board Theme:'}</span>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {(['classic', 'space', 'underwater', 'ancient'] as BoardTheme[]).map((themeKey) => (
                        <button
                          key={themeKey}
                          type="button"
                          onClick={() => handleSelectTheme(themeKey)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            selectedBoardSkin === themeKey
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800'
                          }`}
                        >
                          {BOARD_SKINS[themeKey].icon} {lang === 'ar' ? BOARD_SKINS[themeKey].nameAr : BOARD_SKINS[themeKey].nameEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mic Permission Mode */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-300 font-bold block">{lang === 'ar' ? 'صلاحيات المايك:' : 'Mic Mode:'}</span>
                      <span className="text-[9px] text-slate-500">
                        {roomMicMode === 'all' ? (lang === 'ar' ? 'متاح للجميع' : 'Open for all') : (lang === 'ar' ? 'للمشرفين فقط' : 'Admins only')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRoomMicMode(prev => prev === 'all' ? 'admins_only' : 'all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                        roomMicMode === 'all'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {roomMicMode === 'all' ? '🎙️ للجميع' : '👑 للمشرفين'}
                    </button>
                  </div>

                  {/* Reset Game */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300 font-bold">{lang === 'ar' ? 'إعادة ضبط المعركة:' : 'Reset Match:'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        resetGame();
                      }}
                      className="px-3 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs font-black cursor-pointer"
                    >
                      🔄 إعادة
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes clash-left {
          0% { transform: translateX(-150px) rotate(-45deg); opacity: 0; }
          70% { transform: translateX(10px) rotate(15deg); opacity: 1; }
          100% { transform: translateX(0) rotate(0deg); opacity: 1; }
        }
        @keyframes clash-right {
          0% { transform: translateX(150px) rotate(45deg); opacity: 0; }
          70% { transform: translateX(-10px) rotate(-15deg); opacity: 1; }
          100% { transform: translateX(0) rotate(0deg); opacity: 1; }
        }
        @keyframes slam-dice {
          0% { transform: translateY(-300px) scale(2.5) rotate(-180deg); opacity: 0; }
          65% { transform: translateY(15px) scale(0.85) rotate(20deg); opacity: 1; }
          85% { transform: translateY(-10px) scale(1.08) rotate(-10deg); }
          100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes crown-drop {
          0% { transform: translateY(-80px) scale(0.3); opacity: 0; }
          60% { transform: translateY(8px) scale(1.2); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes reveal-left-to-right {
          0% {
            clip-path: inset(0 100% 0 0);
            filter: brightness(3.5) drop-shadow(0 0 40px #f59e0b);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            clip-path: inset(0 0% 0 0);
            filter: brightness(1) drop-shadow(0 0 25px rgba(251,191,36,0.9));
            opacity: 1;
          }
        }
        @keyframes beam-sweep {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        @keyframes slap-shake-avatar {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-10px, -4px) rotate(-18deg) scale(1.15); }
          30% { transform: translate(10px, 4px) rotate(14deg) scale(1.15); }
          50% { transform: translate(-6px, 2px) rotate(-10deg); }
          70% { transform: translate(6px, -2px) rotate(8deg); }
          85% { transform: translate(-2px, 1px) rotate(-3deg); }
        }

        @keyframes fly-projectile {
          0% { transform: scale(0.6) translate(-50%, -50%); opacity: 0; }
          20% { opacity: 1; transform: scale(1.3) translate(-50%, -50%) rotate(45deg); }
          80% { opacity: 1; transform: scale(1.1) translate(-50%, -50%) rotate(360deg); }
          100% { opacity: 0; transform: scale(1.8) translate(-50%, -50%) rotate(540deg); }
        }

        @keyframes dice-3d-roll {
          0% {
            transform: translateY(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
          }
          20% {
            transform: translateY(-24px) rotateX(240deg) rotateY(180deg) rotateZ(90deg) scale(1.2);
          }
          45% {
            transform: translateY(-15px) rotateX(540deg) rotateY(360deg) rotateZ(180deg) scale(1.12);
          }
          70% {
            transform: translateY(-5px) rotateX(840deg) rotateY(540deg) rotateZ(270deg) scale(1.04);
          }
          88% {
            transform: translateY(2px) rotateX(1020deg) rotateY(700deg) rotateZ(340deg) scale(0.97);
          }
          100% {
            transform: translateY(0) rotateX(1080deg) rotateY(720deg) rotateZ(360deg) scale(1);
          }
        }
        .animate-dice-3d-roll {
          animation: dice-3d-roll 0.75s cubic-bezier(0.2, 0.8, 0.25, 1) both;
          transform-style: preserve-3d;
        }
        .animate-dice-natural-roll {
          animation: dice-3d-roll 0.75s cubic-bezier(0.2, 0.8, 0.25, 1) both;
          transform-style: preserve-3d;
        }
        @keyframes poke-left {
          0%, 100% { transform: translate(0, -50%); }
          50% { transform: translate(-12px, -50%); }
        }
        @keyframes poke-right {
          0%, 100% { transform: translate(0, -50%); }
          50% { transform: translate(12px, -50%); }
        }
        .animate-poke-left {
          animation: poke-left 0.6s ease-in-out infinite;
        }
        .animate-poke-right {
          animation: poke-right 0.6s ease-in-out infinite;
        }

        @keyframes ludo-dice-spin {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .ludo-dice-face {
          backface-visibility: hidden;
        }
        @keyframes turn-ring-countdown {
          0% {
            stroke-dashoffset: 0;
            stroke: #10b981;
          }
          60% {
            stroke: #f59e0b;
          }
          82% {
            stroke: #ef4444;
          }
          100% {
            stroke-dashoffset: 100;
            stroke: #ef4444;
          }
        }
        .animate-turn-countdown {
          animation: turn-ring-countdown 10s linear forwards;
        }
      `}} />
    </div>
  );
}
