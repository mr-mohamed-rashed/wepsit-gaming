import React, { useEffect, useState } from 'react';
import { PlayerColor } from './ludoUtils';

export interface ActiveGiftImpact {
  icon: string;
  title: string;
  fromName: string;
  effect: string;
  id: number;
}

export interface FlyingGiftProjectile {
  id: string;
  from: PlayerColor;
  to: PlayerColor;
  icon: string;
  name: string;
  effectId: string;
}

const CORNER_COORDS: Record<PlayerColor, { x: number; y: number }> = {
  green: { x: 22, y: 26 },
  yellow: { x: 78, y: 26 },
  red: { x: 22, y: 74 },
  blue: { x: 78, y: 74 },
};

/**
 * Animates a targeted projectile smoothly from the sender's board corner to the recipient's corner.
 */
export const GiftProjectileOverlay: React.FC<{ projectile: FlyingGiftProjectile | null }> = ({ projectile }) => {
  const [inFlight, setInFlight] = useState(false);

  useEffect(() => {
    if (!projectile) {
      setInFlight(false);
      return;
    }
    setInFlight(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setInFlight(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [projectile?.id]);

  if (!projectile) return null;

  const start = CORNER_COORDS[projectile.from];
  const end = CORNER_COORDS[projectile.to];
  const spin = projectile.effectId === 'slipper' || projectile.effectId === 'egg' || projectile.effectId === 'tomato';

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div
        style={{
          left: `${inFlight ? end.x : start.x}%`,
          top: `${inFlight ? end.y : start.y}%`,
          transform: `translate(-50%, -50%) scale(${inFlight ? 1.55 : 0.85}) rotate(${inFlight ? (spin ? '540deg' : '15deg') : '0deg'})`,
        }}
        className="absolute transition-all duration-500 ease-[cubic-bezier(0.22,0.8,0.36,1)] text-4xl sm:text-5xl filter drop-shadow-[0_10px_18px_rgba(0,0,0,0.75)]"
      >
        {projectile.icon}
      </div>
    </div>
  );
};

/**
 * Custom per-gift physical reaction rendered on the recipient's corner card on contact:
 * - Egg: cracks into dripping golden yolk + shell shards
 * - Tomato: squashes into crimson pulp splatter + seeds + juice drips
 * - Slipper: whacks sideways with shockwaves & violent shake
 * - Bomb: fireball explosion + soot smoke + scorched flash
 * - Ice: frost crystals + snowflakes + cracked freeze glass
 * - Chicken: panicked squawking + flying feathers
 * - Fart: wobbling green stink gas cloud
 * - Boxing: KO punch glove + impact stars
 * - Peace gifts (Flowers, Crown, Coffee, Diamond, Love, Handshake, Highfive): custom celebratory particle animations
 */
export const CornerGiftImpactOverlay: React.FC<{ impact: ActiveGiftImpact }> = ({ impact }) => {
  const effect = impact.effect;

  if (effect === 'egg') {
    return (
      <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden pointer-events-none bg-amber-950/35 animate-fadeIn">
        {/* Sticky egg white + dripping golden yolk SVG */}
        <svg viewBox="0 0 120 120" className="w-full h-full animate-gift-splat">
          {/* Egg albumen white blob */}
          <path
            d="M25,42 C18,24 38,14 58,20 C76,12 102,22 95,45 C106,62 96,86 78,84 C74,98 66,112 61,100 C56,88 46,92 43,108 C39,116 32,96 30,84 C15,80 12,58 25,42 Z"
            fill="#fefce8"
            fillOpacity="0.93"
            stroke="#fde047"
            strokeWidth="2"
          />
          {/* Dripping golden yolk with runny trails */}
          <ellipse cx="60" cy="48" rx="18" ry="16" fill="#facc15" />
          <ellipse cx="55" cy="43" rx="6" ry="4" fill="#fef9c3" fillOpacity="0.85" />
          <path
            d="M52,58 C52,75 49,95 54,104 C59,108 61,90 61,60 Z"
            fill="#eab308"
            className="animate-gift-drip"
          />
          <path
            d="M68,54 C69,70 67,85 71,92 C74,94 75,78 73,55 Z"
            fill="#f59e0b"
            className="animate-gift-drip"
          />
          {/* Cracked eggshell shards */}
          <polygon points="22,22 36,16 32,30" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
          <polygon points="84,18 98,28 82,34" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
          <polygon points="40,78 52,88 35,92" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
        <div className="absolute bottom-1 inset-x-1 text-center">
          <span className="inline-block px-1.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-400/60 text-[8px] font-black text-amber-200">
            🍳 فقشت!
          </span>
        </div>
      </div>
    );
  }

  if (effect === 'tomato') {
    return (
      <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden pointer-events-none bg-rose-950/40 animate-fadeIn">
        {/* Squashed juicy crimson tomato splatter */}
        <svg viewBox="0 0 120 120" className="w-full h-full animate-gift-splat">
          <path
            d="M20,38 L36,26 L44,14 L60,24 L82,12 L78,30 L102,38 L88,54 L106,70 L84,76 L92,98 L68,84 L62,110 L54,84 L38,106 L34,82 L12,78 L28,58 Z"
            fill="#ef4444"
            fillOpacity="0.92"
          />
          <circle cx="60" cy="54" r="22" fill="#dc2626" />
          {/* Squashed skin crease & green stem */}
          <path d="M52,42 L60,36 L68,42 L62,48 L56,48 Z" fill="#15803d" />
          {/* Tomato seeds */}
          <ellipse cx="48" cy="54" rx="2.5" ry="1.4" transform="rotate(-25 48 54)" fill="#fef08a" />
          <ellipse cx="70" cy="52" rx="2.5" ry="1.4" transform="rotate(30 70 52)" fill="#fef08a" />
          <ellipse cx="58" cy="66" rx="2.5" ry="1.4" fill="#fef08a" />
          <ellipse cx="45" cy="65" rx="2" ry="1.2" transform="rotate(20 45 65)" fill="#fef08a" />
          {/* Juice drips */}
          <path d="M44,72 C44,88 41,105 46,112 C50,114 50,92 49,73 Z" fill="#b91c1c" className="animate-gift-drip" />
          <path d="M74,70 C75,86 73,98 77,104 C81,105 80,86 78,70 Z" fill="#b91c1c" className="animate-gift-drip" />
        </svg>
        <div className="absolute bottom-1 inset-x-1 text-center">
          <span className="inline-block px-1.5 py-0.5 rounded-full bg-rose-950/90 border border-rose-400/60 text-[8px] font-black text-rose-200">
            🍅 اتفعصت!
          </span>
        </div>
      </div>
    );
  }

  if (effect === 'slipper' || effect === 'boxing') {
    return (
      <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden pointer-events-none bg-orange-950/45 flex flex-col items-center justify-center animate-gift-whack">
        <div className="relative flex items-center justify-center">
          <span className="text-4xl sm:text-5xl animate-gift-splat filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
            {effect === 'slipper' ? '🩴' : '🥊'}
          </span>
          <span className="absolute -top-3 -right-4 text-xl animate-ping">💥</span>
          <span className="absolute -bottom-2 -left-4 text-base font-black text-amber-300">💢</span>
        </div>
        <span className="mt-1 px-2 py-0.5 rounded-full bg-black/85 text-[9px] font-black text-orange-300 border border-orange-400/60">
          {effect === 'slipper' ? 'طرااااخ!' : 'ضربة قاضية!'}
        </span>
      </div>
    );
  }

  if (effect === 'bomb') {
    return (
      <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden pointer-events-none bg-black/80 flex flex-col items-center justify-center animate-gift-whack">
        <div className="absolute inset-2 rounded-full bg-gradient-radial from-amber-400 via-orange-600 to-transparent opacity-75 animate-ping" />
        <div className="relative flex flex-col items-center">
          <span className="text-4xl sm:text-5xl animate-gift-splat">💥</span>
          <span className="text-[9px] font-black text-amber-200 bg-rose-950/90 px-2 py-0.5 rounded-full border border-orange-400 mt-0.5">
            بوووم! 💣
          </span>
        </div>
      </div>
    );
  }

  if (effect === 'ice') {
    return (
      <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden pointer-events-none bg-cyan-400/30 backdrop-blur-[2px] border-2 border-cyan-200 shadow-[inset_0_0_24px_rgba(165,243,252,0.85)] flex flex-col items-center justify-center animate-fadeIn">
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full opacity-65">
          <polyline points="10,15 45,45 30,85" fill="none" stroke="#e0f2fe" strokeWidth="2.5" />
          <polyline points="110,20 70,55 95,100" fill="none" stroke="#bae6fd" strokeWidth="2" />
          <polyline points="20,105 60,60 105,65" fill="none" stroke="#ffffff" strokeWidth="1.8" />
        </svg>
        <span className="text-3xl sm:text-4xl animate-pulse relative z-10">❄️</span>
        <span className="relative z-10 mt-0.5 px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-300/70 text-[8px] font-black text-cyan-200">
          تجميد 🧊
        </span>
      </div>
    );
  }

  if (effect === 'chicken') {
    return (
      <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden pointer-events-none bg-amber-950/45 flex flex-col items-center justify-center">
        <span className="absolute top-1 left-2 text-xs animate-bounce">🪶</span>
        <span className="absolute top-2 right-2 text-xs animate-ping">🪶</span>
        <span className="text-4xl animate-bounce">🐔</span>
        <span className="mt-0.5 px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-[8px] font-black text-amber-200">
          كاك كاااك!
        </span>
      </div>
    );
  }

  if (effect === 'fart') {
    return (
      <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden pointer-events-none bg-lime-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center animate-pulse">
        <span className="text-4xl animate-bounce">💨</span>
        <span className="mt-0.5 px-2 py-0.5 rounded-full bg-lime-950/95 border border-lime-400/60 text-[8px] font-black text-lime-300">
          بوووف 🤢
        </span>
      </div>
    );
  }

  // Peace & Friendly Gifts (Custom per item!)
  return (
    <div className="absolute inset-0 z-40 rounded-2xl overflow-hidden pointer-events-none bg-gradient-to-b from-amber-500/20 via-emerald-950/40 to-black/75 flex flex-col items-center justify-center p-1 backdrop-blur-[1px] animate-fadeIn">
      <div className="relative flex items-center justify-center">
        <span className="text-3xl sm:text-4xl animate-gift-splat filter drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
          {impact.icon}
        </span>
        <span className="absolute -top-2 -right-3 text-xs animate-ping">✨</span>
        <span className="absolute -bottom-1 -left-3 text-xs animate-bounce">
          {effect === 'flowers' ? '🌸' : effect === 'love' ? '💕' : effect === 'coffee' ? '♨️' : '⭐'}
        </span>
      </div>
      <span className="text-[9px] font-black text-amber-200 text-center leading-tight mt-0.5 px-1.5 py-0.5 rounded-full bg-black/70 border border-amber-400/40">
        {impact.title}
      </span>
    </div>
  );
};
