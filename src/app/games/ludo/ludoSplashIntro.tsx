'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface CinematicIntroProps {
  onComplete: () => void;
  lang: string;
  isMuted: boolean;
}

export function MythicSplashScreenIntro({ onComplete, lang, isMuted }: CinematicIntroProps) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const splashAudioCtxRef = useRef<AudioContext | null>(null);

  const playSoundEffect = (type: 'portal' | 'underwater' | 'pharaoh' | 'space' | 'finale') => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      if (!splashAudioCtxRef.current || splashAudioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        splashAudioCtxRef.current = new AudioCtx();
      }
      const ctx = splashAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      if (type === 'portal') {
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
    } catch {}
  };

  useEffect(() => {
    playSoundEffect('portal');
    const t1 = setTimeout(() => { setStage(1); playSoundEffect('underwater'); }, 1000);
    const t2 = setTimeout(() => { setStage(2); playSoundEffect('pharaoh'); }, 2000);
    const t3 = setTimeout(() => { setStage(3); playSoundEffect('space'); }, 3000);
    const t4 = setTimeout(() => { setStage(4); playSoundEffect('finale'); }, 4000);
    const t5 = setTimeout(() => { setIsFadingOut(true); }, 4700);
    const t6 = setTimeout(() => { onComplete(); }, 5000);

    const startTime = Date.now();
    const pInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(100, (elapsed / 5000) * 100));
    }, 50);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
      clearInterval(pInterval);
    };
  }, []);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  const bgStyles = [
    'from-slate-950 via-slate-900 to-black',
    'from-[#021B35] via-[#052e4f] to-[#011424]',
    'from-[#2d1804] via-[#451a03] to-[#1a0a02]',
    'from-[#1e0836] via-[#0f172a] to-[#020617]',
    'from-slate-950 via-[#271302] to-slate-950',
  ];

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b ${bgStyles[stage]} overflow-hidden select-none transition-colors duration-700 ease-in-out cursor-pointer ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-300`}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-50 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-cyan-400 shadow-[0_0_12px_#f59e0b] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
      >
        <span>{lang === 'ar' ? 'تخطي' : 'Skip'}</span>
        <span className="text-sm">⏭️</span>
      </button>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.12),transparent_60%)] pointer-events-none animate-pulse" />

      {stage === 0 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-lg w-full animate-fadeIn">
          <div className="relative mb-5 sm:mb-6 flex items-center justify-center">
            <div className="absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full border-2 border-dashed border-amber-400/40 animate-[spin_8s_linear_infinite]" />
            <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-cyan-400/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute inset-0 m-auto w-24 h-24 sm:w-32 sm:h-32 bg-amber-400/25 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/60 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.6),inset_0_0_20px_rgba(245,158,11,0.3)] flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl text-amber-400 filter drop-shadow mb-[-4px]">👑</span>
              <span className="text-3xl sm:text-5xl font-black tracking-tighter bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-transparent">
                GPM
              </span>
            </div>
          </div>
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
        </div>
      )}

      {stage === 1 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-2xl w-full animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-400/50 text-cyan-300 text-xs sm:text-sm font-black mb-3.5">
            <span>🔱</span>
            <span>{lang === 'ar' ? 'العالم الأول: أطلانطس أعماق البحار' : 'WORLD 1: UNDERWATER ATLANTIS'}</span>
          </div>
          <div className="relative w-full max-w-[260px] sm:max-w-[320px] aspect-square rounded-3xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_60px_rgba(6,182,212,0.6)] transform -rotate-2 bg-slate-950">
            <img src="/board_skin_underwater.jpg" alt="Underwater Atlantis Board" className="w-full h-full object-cover scale-105" />
            <div className="absolute bottom-2.5 inset-x-2.5 p-2 rounded-xl bg-slate-950/85 border border-cyan-400/40 text-center">
              <span className="text-[11px] sm:text-xs font-black text-cyan-300">
                {lang === 'ar' ? '🌊 رقعة أعماق المحيط والغواصات 🌊' : '🌊 Oceanic Deep Abyss & Submarines 🌊'}
              </span>
            </div>
          </div>
        </div>
      )}

      {stage === 2 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-2xl w-full animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-black mb-3.5">
            <span>🏺</span>
            <span>{lang === 'ar' ? 'العالم الثاني: أساطير الفراعنة والآثار' : 'WORLD 2: ANCIENT PHARAONIC DYNASTY'}</span>
          </div>
          <div className="relative w-full max-w-[260px] sm:max-w-[320px] aspect-square rounded-3xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.6)] transform rotate-2 bg-slate-950">
            <img src="/board_skin_pharaonic.jpg" alt="Ancient Pharaonic Board" className="w-full h-full object-cover scale-105" />
            <div className="absolute bottom-2.5 inset-x-2.5 p-2 rounded-xl bg-slate-950/85 border border-amber-400/40 text-center">
              <span className="text-[11px] sm:text-xs font-black text-amber-300">
                {lang === 'ar' ? '☥ أهرامات الجيزة، مفتاح الحياة، ونهر النيل ☥' : '☥ Pyramids of Giza, Sacred Ankh & The Nile ☥'}
              </span>
            </div>
          </div>
        </div>
      )}

      {stage === 3 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-2xl w-full animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/70 border border-purple-400/50 text-purple-300 text-xs sm:text-sm font-black mb-3.5">
            <span>🪐</span>
            <span>{lang === 'ar' ? 'العالم الثالث: مجرة الكواكب وحرب النجوم' : 'WORLD 3: COSMIC GALAXY & NEBULA'}</span>
          </div>
          <div className="relative w-full max-w-[260px] sm:max-w-[320px] aspect-square rounded-3xl overflow-hidden border-2 border-purple-400/80 shadow-[0_0_60px_rgba(168,85,247,0.7)] transform -rotate-2 bg-slate-950">
            <img src="/board_skin_cosmic.jpg" alt="Cosmic Galaxy Board" className="w-full h-full object-cover scale-105" />
            <div className="absolute bottom-2.5 inset-x-2.5 p-2 rounded-xl bg-slate-950/85 border border-purple-400/40 text-center">
              <span className="text-[11px] sm:text-xs font-black text-purple-300">
                {lang === 'ar' ? '🚀 كواكب بركانية، نيازك، وبوابات ثقب دودي 🚀' : '🚀 Orbital Rings, Solar Flares & Cyber Grid 🚀'}
              </span>
            </div>
          </div>
        </div>
      )}

      {stage === 4 && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 max-w-3xl w-full animate-fadeIn">
          <div className="relative mb-4 sm:mb-5 flex flex-col items-center">
            <div className="relative p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 border-2 sm:border-4 border-amber-200 shadow-[0_0_60px_rgba(251,191,36,0.9)] animate-[bounce_0.8s_ease-out]">
              <span className="text-5xl sm:text-7xl filter drop-shadow">🎲</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white tracking-wider">Ludo: Mythic Kingdoms</h1>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              لودو: الممالك الأسطورية
            </h2>
          </div>
          <div className="mt-2 px-4 sm:px-6 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center gap-2">
            <span className="text-sm sm:text-lg">👑</span>
            <span className="font-black text-xs sm:text-sm text-amber-300 tracking-[0.2em] uppercase">GAMES PORTAL MYTHIC</span>
            <span className="text-sm sm:text-lg">👑</span>
          </div>
        </div>
      )}
    </div>
  );
}
