'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface CinematicIntroProps {
  onComplete: () => void;
  lang: string;
  isMuted: boolean;
}

export function MythicSplashScreenIntro({ onComplete, lang, isMuted }: CinematicIntroProps) {
  const [phase, setPhase] = useState<'intro' | 'impact' | 'reveal'>('intro');
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Web Audio Cinematic SFX Generator
  const playCinematicSound = (type: 'whoosh_slowmo' | 'slam_shockwave' | 'energy_swell' | 'spark_chime') => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      if (type === 'whoosh_slowmo') {
        // Dramatic slow-motion spinning whoosh with pitch rise and air noise
        const bufferSize = ctx.sampleRate * 2.2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(140, now);
        filter.frequency.exponentialRampToValueAtTime(750, now + 1.8);
        filter.Q.setValueAtTime(3.5, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.01, now);
        noiseGain.gain.linearRampToValueAtTime(0.4, now + 1.2);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        whiteNoise.start(now);
        whiteNoise.stop(now + 2.0);

        // Sub bass drone rise
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 1.8);

        oscGain.gain.setValueAtTime(0.05, now);
        oscGain.gain.linearRampToValueAtTime(0.35, now + 1.4);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.0);
      } else if (type === 'slam_shockwave') {
        // Massive forceful thud & sub-bass shockwave
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.6);

        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);

        // Electric laser impact crackle
        const crackle = ctx.createOscillator();
        const cGain = ctx.createGain();
        crackle.type = 'sawtooth';
        crackle.frequency.setValueAtTime(800, now);
        crackle.frequency.exponentialRampToValueAtTime(80, now + 0.3);

        cGain.gain.setValueAtTime(0.6, now);
        cGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        crackle.connect(cGain);
        cGain.connect(ctx.destination);
        crackle.start(now);
        crackle.stop(now + 0.35);
      } else if (type === 'energy_swell') {
        // Majestic triumphant chords & neon shockwave swell
        const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C Major epic triad
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          gain.gain.setValueAtTime(0.01, now + idx * 0.04);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.04 + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 1.5);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 1.5);
        });
      } else if (type === 'spark_chime') {
        // High sparkling magical dust chimes
        [1046.5, 1318.51, 1567.98, 2093.0].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          g.gain.setValueAtTime(0.12, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.6);
        });
      }
    } catch {}
  };

  // 3D Canvas rendering: Luxury Glowing Golden & Obsidian Dice with shockwave ripples & magical dust
  useEffect(() => {
    playCinematicSound('whoosh_slowmo');

    const tImpact = setTimeout(() => {
      setPhase('impact');
      playCinematicSound('slam_shockwave');
      playCinematicSound('energy_swell');
    }, 2000);

    const tReveal = setTimeout(() => {
      setPhase('reveal');
      playCinematicSound('spark_chime');
    }, 3200);

    const tFade = setTimeout(() => {
      setIsFadingOut(true);
    }, 5500);

    const tDone = setTimeout(() => {
      onComplete();
    }, 6000);

    const startTime = Date.now();
    const pInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(100, (elapsed / 6000) * 100));
    }, 40);

    // Canvas animation setup
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Sparks & magical dust particles
    interface Particle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
    }

    const particles: Particle[] = [];
    const colors = ['#f59e0b', '#fbbf24', '#38bdf8', '#818cf8', '#ffffff'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z: Math.random() * 400 + 50,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.8 + 0.2,
        decay: Math.random() * 0.005 + 0.002,
      });
    }

    // Shockwave ripples
    interface Shockwave {
      r: number;
      maxR: number;
      alpha: number;
      color: string;
      lineWidth: number;
    }
    const shockwaves: Shockwave[] = [];

    // 3D Cube vertices & faces for luxury golden obsidian dice
    const cubeVertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1],
    ];

    const cubeFaces = [
      { v: [0, 1, 2, 3], norm: [0, 0, -1], dots: 1 },
      { v: [5, 4, 7, 6], norm: [0, 0, 1], dots: 6 },
      { v: [4, 0, 3, 7], norm: [-1, 0, 0], dots: 2 },
      { v: [1, 5, 6, 2], norm: [1, 0, 0], dots: 5 },
      { v: [4, 5, 1, 0], norm: [0, -1, 0], dots: 3 },
      { v: [3, 2, 6, 7], norm: [0, 1, 0], dots: 4 },
    ];

    let animStartTime = performance.now();
    let shockwaveTriggered = false;

    const render = (nowMs: number) => {
      const elapsed = (nowMs - animStartTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Camera dynamic zoom & cinematic lighting
      let zoom = 1.0;
      let diceYOffset = 0;
      let rotX = elapsed * 3.5;
      let rotY = elapsed * 4.2;
      let rotZ = elapsed * 2.1;
      let diceScale = 65;

      if (elapsed < 2.0) {
        // Slow-motion aerial tumbling
        const t = elapsed / 2.0;
        diceYOffset = -120 + Math.sin(t * Math.PI) * 40;
        diceScale = 75 + Math.sin(t * Math.PI * 0.5) * 20;
        rotX = t * 7.5;
        rotY = t * 9.0;
        rotZ = t * 5.0;
      } else if (elapsed >= 2.0 && elapsed < 3.2) {
        // Forceful slam & ground landing
        if (!shockwaveTriggered) {
          shockwaveTriggered = true;
          for (let s = 0; s < 4; s++) {
            shockwaves.push({
              r: 10 + s * 15,
              maxR: Math.max(width, height) * 0.75,
              alpha: 0.95 - s * 0.15,
              color: s % 2 === 0 ? '#38bdf8' : '#fbbf24',
              lineWidth: 5 - s,
            });
          }
        }
        const slamT = Math.min(1, (elapsed - 2.0) / 0.3);
        diceYOffset = 30 + Math.sin(slamT * Math.PI * 4) * Math.exp(-slamT * 6) * 15;
        diceScale = 85;
        rotX = 0.45;
        rotY = -0.55;
        rotZ = 0.1;
        zoom = 1.0 + Math.sin(slamT * Math.PI) * 0.08;
      } else {
        // Reveal & smooth steady floating
        diceYOffset = 30 + Math.sin(elapsed * 2.0) * 8;
        rotX = 0.45 + Math.sin(elapsed) * 0.12;
        rotY = -0.55 + Math.cos(elapsed) * 0.15;
        rotZ = 0.1;
        diceScale = 80;
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);

      // 1. Draw High-Tech 3D Ludo Game Board Grid Ground (Perspective)
      ctx.save();
      ctx.translate(0, 140);
      const gridR = Math.min(width, height) * 0.42;

      // Glowing circular holographic ludo field
      const boardGlow = ctx.createRadialGradient(0, 0, gridR * 0.1, 0, 0, gridR);
      boardGlow.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      boardGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.18)');
      boardGlow.addColorStop(0.9, 'rgba(15, 23, 42, 0.4)');
      boardGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.ellipse(0, 0, gridR, gridR * 0.48, 0, 0, Math.PI * 2);
      ctx.fillStyle = boardGlow;
      ctx.fill();

      // Neon board rings & runes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, gridR * 0.85, gridR * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, gridR * 0.55, gridR * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Shockwave ripples animation
      shockwaves.forEach((sw) => {
        if (sw.alpha > 0.01) {
          ctx.save();
          ctx.strokeStyle = sw.color;
          ctx.globalAlpha = sw.alpha;
          ctx.lineWidth = sw.lineWidth;
          ctx.shadowColor = sw.color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.ellipse(0, 0, sw.r, sw.r * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          sw.r += 14;
          sw.alpha *= 0.94;
        }
      });
      ctx.restore();

      // 2. Rotate & Project 3D Luxury Dice
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

      const transformedVertices = cubeVertices.map(([vx, vy, vz]) => {
        // Rotate Y
        let x1 = vx * cosY - vz * sinY;
        let z1 = vx * sinY + vz * cosY;
        // Rotate X
        let y2 = vy * cosX - z1 * sinX;
        let z2 = vy * sinX + z1 * cosX;
        // Rotate Z
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        return {
          x: x3 * diceScale,
          y: y3 * diceScale + diceYOffset,
          z: z2 * diceScale,
        };
      });

      // Sort faces by average Z depth (painter's algorithm)
      const sortedFaces = cubeFaces
        .map((face) => {
          const avgZ = face.v.reduce((sum, idx) => sum + transformedVertices[idx].z, 0) / 4;
          return { ...face, avgZ };
        })
        .sort((a, b) => a.avgZ - b.avgZ);

      // Draw dice drop shadow
      if (diceYOffset < 110) {
        const shadowScale = Math.max(0.2, 1 - (120 - diceYOffset) / 300);
        ctx.save();
        ctx.translate(0, 140);
        ctx.beginPath();
        ctx.ellipse(0, 0, diceScale * 1.3 * shadowScale, diceScale * 0.6 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * shadowScale})`;
        ctx.fill();
        ctx.restore();
      }

      // Render Dice Faces (Obsidian & Luxury Gold Accents)
      sortedFaces.forEach((face) => {
        const [i0, i1, i2, i3] = face.v;
        const p0 = transformedVertices[i0];
        const p1 = transformedVertices[i1];
        const p2 = transformedVertices[i2];
        const p3 = transformedVertices[i3];

        // Normal check for backface culling
        const vAx = p1.x - p0.x;
        const vAy = p1.y - p0.y;
        const vBx = p2.x - p0.x;
        const vBy = p2.y - p0.y;
        const cross = vAx * vBy - vAy * vBx;

        if (cross > 0) {
          // Face base: Obsidian Dark Mirror with Gold Gradient
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();

          const faceGrad = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
          faceGrad.addColorStop(0, '#1c1917');
          faceGrad.addColorStop(0.5, '#09090b');
          faceGrad.addColorStop(1, '#020617');

          ctx.fillStyle = faceGrad;
          ctx.fill();

          // Ornate Beveled Gold Edge
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 15;
          ctx.stroke();

          // Inner Gold Trim
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#fef08a';
          ctx.stroke();

          // Face Center Golden Pips (Dots)
          const pipX = (p0.x + p1.x + p2.x + p3.x) / 4;
          const pipY = (p0.y + p1.y + p2.y + p3.y) / 4;

          ctx.beginPath();
          ctx.arc(pipX, pipY, diceScale * 0.12, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.restore();
        }
      });

      // 3. Floating Magical Sparks & Glowing Dust Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.z <= 10) {
          p.x = (Math.random() - 0.5) * width;
          p.y = (Math.random() - 0.5) * height;
          p.z = 300;
          p.alpha = Math.random() * 0.8 + 0.3;
        }

        const scale = 200 / p.z;
        const px = p.x * scale;
        const py = p.y * scale;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();

      if (elapsed < 6.5) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearTimeout(tImpact);
      clearTimeout(tReveal);
      clearTimeout(tFade);
      clearTimeout(tDone);
      clearInterval(pInterval);
    };
  }, []);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 overflow-hidden select-none transition-opacity duration-500 ease-in-out cursor-pointer ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 1. Top Cinematic Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-50 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-yellow-300 shadow-[0_0_15px_#38bdf8] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 2. Skip Button */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/50 text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
      >
        <span>{lang === 'ar' ? 'تخطي' : 'Skip'}</span>
        <span className="text-sm">⏭️</span>
      </button>

      {/* 3. Volumetric Dark Moody Lighting & Neon Blue Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(30,58,138,0.35)_0%,_rgba(15,23,42,0.8)_60%,_rgba(2,6,23,0.98)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18)_0%,_transparent_65%)] pointer-events-none animate-pulse" />

      {/* 4. Real-time 3D Canvas (Luxury Glowing Dice + Sparks + Shockwave) */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full pointer-events-none" />

      {/* 5. Mobile & Tablet & Desktop Responsive Splash Logo Overlay */}
      <div className="relative z-30 flex flex-col items-center justify-center text-center px-4 max-w-xl w-full pointer-events-none">
        {phase === 'reveal' && (
          <div className="flex flex-col items-center animate-zoomIn transition-all duration-700">
            {/* Ludo Sparks Official Logo Frame */}
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500/40 via-cyan-400/40 to-yellow-500/40 blur-xl animate-pulse" />
              <img
                src="/ludo_sparks_logo.jpg"
                alt="Ludo Sparks"
                className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-3xl object-cover border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.6)]"
              />
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-300 tracking-[0.15em] sm:tracking-[0.2em] uppercase drop-shadow-[0_0_30px_rgba(245,158,11,0.9)] flex items-center gap-2">
              <span>LUDO SPARKS</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-black tracking-widest text-cyan-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
              {lang === 'ar' ? '⚡ النرد الأسطوري والتحدي الملكي ⚡' : '⚡ EPIC 3D ROYAL SPLASH ⚡'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 inset-x-0 text-center z-30 pointer-events-none">
        <span className="text-[11px] sm:text-xs font-bold text-slate-400/80 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700/50">
          {lang === 'ar' ? 'اضغط في أي مكان لتخطي الدخلة' : 'Click anywhere to skip'}
        </span>
      </div>
    </div>
  );
}
