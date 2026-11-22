'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function BilliardsStandalonePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#020b14] text-amber-400 font-bold">جاري تحميل كيو ماستر (Cue Master)...</div>}>
      <CueMasterApp />
    </Suspense>
  );
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  number: number;
  type: 'cue' | 'solid' | 'stripe' | 'black' | 'red' | 'color';
  isPotted: boolean;
  value?: number; // For Snooker points
}

// Sound FX helper using Web Audio API
function playSound(type: 'hit' | 'pocket' | 'cue') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'cue') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'hit') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'pocket') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio errors on autoplay restrictions
  }
}

function CueMasterApp() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || 'guest';
  const username = searchParams.get('username') || 'لاعب 1';
  const avatar = searchParams.get('avatar') || 'https://api.dicebear.com/7.x/bottts/svg?seed=CueMaster';
  const initialStake = parseInt(searchParams.get('stake') || '100');
  const initialPrize = parseInt(searchParams.get('prize') || '190');
  const initialMode = (searchParams.get('mode') as '8-ball' | 'snooker') || '8-ball';
  const opponentName = searchParams.get('opponentName') || 'أحمد_البرنس';
  const opponentAvatar = searchParams.get('opponentAvatar') || 'https://api.dicebear.com/7.x/bottts/svg?seed=AhmedEG';
  const opponentFlag = searchParams.get('opponentFlag') || '🇪🇬';

  // App Navigation Views
  const [currentView, setCurrentView] = useState<'menu' | 'table'>('menu');
  const [activeModal, setActiveModal] = useState<'settings' | 'shop' | 'leaderboard' | 'tournaments' | 'stake_select' | null>(null);

  // Gameplay Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aimAssistLong, setAimAssistLong] = useState(true);
  const [feltColor, setFeltColor] = useState<'green' | 'blue' | 'snooker'>('green');
  const [selectedCue, setSelectedCue] = useState('classic');

  // Match State
  const [mode, setMode] = useState<'8-ball' | 'snooker'>(initialMode);
  const [isPractice, setIsPractice] = useState(false);
  const [stake, setStake] = useState(initialStake);
  const [prize, setPrize] = useState(initialPrize);
  const [coins, setCoins] = useState(10500);
  const [gems, setGems] = useState(150);

  // Table Engine State
  const [turn, setTurn] = useState<'human' | 'bot'>('human');
  const [humanScore, setHumanScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [power, setPower] = useState(60); // 10 to 100
  const [aimAngle, setAimAngle] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Table Dimensions
  const TABLE_WIDTH = 900;
  const TABLE_HEIGHT = 450;
  const CUSHION = 30;
  const BALL_RADIUS = 12;

  // Initialize Table Balls
  const initBalls = (currentMode: '8-ball' | 'snooker') => {
    const balls: Ball[] = [];
    const tableLeft = CUSHION;
    const tableRight = TABLE_WIDTH - CUSHION;
    const centerY = TABLE_HEIGHT / 2;

    // 1. Cue Ball
    balls.push({
      id: 0,
      x: tableLeft + (tableRight - tableLeft) * 0.25,
      y: centerY,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: '#ffffff',
      number: 0,
      type: 'cue',
      isPotted: false
    });

    if (currentMode === '8-ball') {
      const startX = tableLeft + (tableRight - tableLeft) * 0.7;
      const ballColors = [
        '#facc15', '#2563eb', '#dc2626', '#7c3aed', '#ea580c', '#16a34a', '#991b1b',
        '#0f172a',
        '#fef08a', '#93c5fd', '#fca5a5', '#c4b5fd', '#fed7aa', '#86efac', '#fecaca'
      ];

      let ballIndex = 1;
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= r; c++) {
          if (ballIndex > 15) break;
          const x = startX + r * (BALL_RADIUS * 1.85);
          const y = centerY + (c - r / 2) * (BALL_RADIUS * 2.1);
          const is8Ball = (r === 2 && c === 1);
          
          balls.push({
            id: ballIndex,
            x,
            y,
            vx: 0,
            vy: 0,
            radius: BALL_RADIUS,
            color: is8Ball ? '#09090b' : ballColors[(ballIndex - 1) % ballColors.length],
            number: is8Ball ? 8 : ballIndex,
            type: is8Ball ? 'black' : ballIndex <= 7 ? 'solid' : 'stripe',
            isPotted: false
          });
          ballIndex++;
        }
      }
    } else {
      // Snooker Setup
      const startX = tableLeft + (tableRight - tableLeft) * 0.72;
      let redId = 1;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c <= r; c++) {
          balls.push({
            id: redId,
            x: startX + r * (BALL_RADIUS * 1.8),
            y: centerY + (c - r / 2) * (BALL_RADIUS * 2.05),
            vx: 0,
            vy: 0,
            radius: BALL_RADIUS * 0.95,
            color: '#ef4444',
            number: 1,
            type: 'red',
            value: 1,
            isPotted: false
          });
          redId++;
        }
      }

      const colors = [
        { name: 'Yellow', color: '#eab308', val: 2, x: tableLeft + 150, y: centerY - 60 },
        { name: 'Green', color: '#16a34a', val: 3, x: tableLeft + 150, y: centerY + 60 },
        { name: 'Brown', color: '#78350f', val: 4, x: tableLeft + 150, y: centerY },
        { name: 'Blue', color: '#2563eb', val: 5, x: TABLE_WIDTH / 2, y: centerY },
        { name: 'Pink', color: '#f43f5e', val: 6, x: startX - 35, y: centerY },
        { name: 'Black', color: '#09090b', val: 7, x: tableRight - 60, y: centerY },
      ];

      colors.forEach((c, idx) => {
        balls.push({
          id: 50 + idx,
          x: c.x,
          y: c.y,
          vx: 0,
          vy: 0,
          radius: BALL_RADIUS * 0.95,
          color: c.color,
          number: c.val,
          type: 'color',
          value: c.val,
          isPotted: false
        });
      });
    }

    ballsRef.current = balls;
  };

  useEffect(() => {
    initBalls(mode);
  }, [mode]);

  // Handle Game Over & postMessage to Parent portal
  const triggerGameOver = (winner: 'human' | 'bot', message: string) => {
    setGameOver(message);
    if (winner === 'human') {
      setCoins(c => c + prize);
    }
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'GAME_OVER',
        game: 'billiards',
        winner,
        coins: winner === 'human' ? prize : 0,
        isHuman: winner === 'human'
      }, '*');
    }
  };

  const handleCloseToParent = () => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'CLOSE_GAME' }, '*');
    }
  };

  // Main Physics Engine & Renderer Loop for Canvas
  useEffect(() => {
    if (currentView !== 'table') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pockets = [
      { x: CUSHION + 10, y: CUSHION + 10 },
      { x: TABLE_WIDTH / 2, y: CUSHION + 5 },
      { x: TABLE_WIDTH - CUSHION - 10, y: CUSHION + 10 },
      { x: CUSHION + 10, y: TABLE_HEIGHT - CUSHION - 10 },
      { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - CUSHION - 5 },
      { x: TABLE_WIDTH - CUSHION - 10, y: TABLE_HEIGHT - CUSHION - 10 }
    ];

    const FRICTION = 0.985;
    const POCKET_RADIUS = 24;

    const updatePhysics = () => {
      const balls = ballsRef.current;
      let anyMoving = false;

      // Update positions & friction
      balls.forEach((ball) => {
        if (ball.isPotted) return;

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;

        if (Math.hypot(ball.vx, ball.vy) < 0.05) {
          ball.vx = 0;
          ball.vy = 0;
        } else {
          anyMoving = true;
        }

        // Cushion Bounces
        const minX = CUSHION + ball.radius;
        const maxX = TABLE_WIDTH - CUSHION - ball.radius;
        const minY = CUSHION + ball.radius;
        const maxY = TABLE_HEIGHT - CUSHION - ball.radius;

        if (ball.x < minX) { ball.x = minX; ball.vx = -ball.vx * 0.85; if (soundEnabled) playSound('hit'); }
        if (ball.x > maxX) { ball.x = maxX; ball.vx = -ball.vx * 0.85; if (soundEnabled) playSound('hit'); }
        if (ball.y < minY) { ball.y = minY; ball.vy = -ball.vy * 0.85; if (soundEnabled) playSound('hit'); }
        if (ball.y > maxY) { ball.y = maxY; ball.vy = -ball.vy * 0.85; if (soundEnabled) playSound('hit'); }

        // Pocket Detection
        pockets.forEach((p) => {
          const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
          if (dist < POCKET_RADIUS) {
            ball.isPotted = true;
            ball.vx = 0;
            ball.vy = 0;
            if (soundEnabled) playSound('pocket');

            if (ball.type === 'cue') {
              setTimeout(() => {
                ball.isPotted = false;
                ball.x = CUSHION + (TABLE_WIDTH - 2 * CUSHION) * 0.25;
                ball.y = TABLE_HEIGHT / 2;
                ball.vx = 0;
                ball.vy = 0;
              }, 1000);
            } else if (ball.type === 'black') {
              if (turn === 'human' || isPractice) {
                triggerGameOver('human', '🎉 مبروك الفوز! أحرزت الكرة السوداء رقم 8!');
              } else {
                triggerGameOver('bot', 'خسرت المباراة! الخصم أحرز الكرة رقم 8.');
              }
            } else {
              if (turn === 'human') setHumanScore((s) => s + (ball.value || 1));
              else setBotScore((s) => s + (ball.value || 1));
            }
          }
        });
      });

      // Ball-to-Ball Collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];
          if (b1.isPotted || b2.isPotted) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);

          if (dist < b1.radius + b2.radius && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = b1.radius + b2.radius - dist;
            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            b1.vx -= p * nx * 0.92;
            b1.vy -= p * ny * 0.92;
            b2.vx += p * nx * 0.92;
            b2.vy += p * ny * 0.92;
            anyMoving = true;
            if (soundEnabled && Math.hypot(kx, ky) > 1.5) playSound('hit');
          }
        }
      }

      if (isShooting && !anyMoving) {
        setIsShooting(false);
        if (!isPractice) {
          setTurn((prev) => (prev === 'human' ? 'bot' : 'human'));
        }
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      // 1. Table Border Wood Frame
      ctx.fillStyle = '#1c100b';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, TABLE_WIDTH - 16, TABLE_HEIGHT - 16);

      // 2. Cloth Felt
      const feltGradient = ctx.createRadialGradient(
        TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 80,
        TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 450
      );

      if (feltColor === 'blue') {
        feltGradient.addColorStop(0, '#1e40af');
        feltGradient.addColorStop(1, '#172554');
      } else if (feltColor === 'snooker' || mode === 'snooker') {
        feltGradient.addColorStop(0, '#047857');
        feltGradient.addColorStop(1, '#064e3b');
      } else {
        feltGradient.addColorStop(0, '#15803d');
        feltGradient.addColorStop(1, '#052e16');
      }

      ctx.fillStyle = feltGradient;
      ctx.fillRect(CUSHION, CUSHION, TABLE_WIDTH - 2 * CUSHION, TABLE_HEIGHT - 2 * CUSHION);

      // Snooker Baulk Line & "D" Zone
      if (mode === 'snooker') {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        const baulkX = CUSHION + 150;
        ctx.beginPath();
        ctx.moveTo(baulkX, CUSHION);
        ctx.lineTo(baulkX, TABLE_HEIGHT - CUSHION);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(baulkX, TABLE_HEIGHT / 2, 60, -Math.PI / 2, Math.PI / 2, true);
        ctx.stroke();
      }

      // 3. Pockets
      pockets.forEach((p) => {
        ctx.fillStyle = '#05070a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 4. Balls
      const balls = ballsRef.current;
      balls.forEach((ball) => {
        if (ball.isPotted) return;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(ball.x + 3, ball.y + 4, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ball Base
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight sheen
        const grad = ctx.createRadialGradient(
          ball.x - 3, ball.y - 3, 1,
          ball.x, ball.y, ball.radius
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Number Circle for 8-ball
        if (mode === '8-ball' && ball.number > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ball.number.toString(), ball.x, ball.y);
        }
      });

      // 5. Aiming Line & Cue Stick
      const cueBall = balls[0];
      if ((turn === 'human' || isPractice) && !isShooting && cueBall && !cueBall.isPotted) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        ctx.lineTo(
          cueBall.x + Math.cos(aimAngle) * (aimAssistLong ? 320 : 180),
          cueBall.y + Math.sin(aimAngle) * (aimAssistLong ? 320 : 180)
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Cue Stick
        const cueLength = 260;
        const cueOffset = 25 + (power / 100) * 35;
        const cueStartX = cueBall.x - Math.cos(aimAngle) * cueOffset;
        const cueStartY = cueBall.y - Math.sin(aimAngle) * cueOffset;
        const cueEndX = cueBall.x - Math.cos(aimAngle) * (cueOffset + cueLength);
        const cueEndY = cueBall.y - Math.sin(aimAngle) * (cueOffset + cueLength);

        // Cue Stick Color based on Selected Cue in Shop
        let cueColor = '#d97706';
        if (selectedCue === 'dragon') cueColor = '#dc2626';
        else if (selectedCue === 'neon') cueColor = '#06b6d4';
        else if (selectedCue === 'gold') cueColor = '#fbbf24';

        ctx.strokeStyle = cueColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cueStartX, cueStartY);
        ctx.lineTo(cueEndX, cueEndY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cueStartX, cueStartY);
        ctx.lineTo(cueStartX - Math.cos(aimAngle) * 8, cueStartY - Math.sin(aimAngle) * 8);
        ctx.stroke();
      }

      updatePhysics();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentView, mode, turn, aimAngle, power, isShooting, soundEnabled, aimAssistLong, feltColor, selectedCue, isPractice]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if ((turn !== 'human' && !isPractice) || isShooting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = TABLE_WIDTH / rect.width;
    const scaleY = TABLE_HEIGHT / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const cueBall = ballsRef.current[0];
    if (cueBall) {
      const angle = Math.atan2(mouseY - cueBall.y, mouseX - cueBall.x);
      setAimAngle(angle);
    }
  };

  const handleShoot = () => {
    if ((turn !== 'human' && !isPractice) || isShooting) return;
    const cueBall = ballsRef.current[0];
    if (!cueBall || cueBall.isPotted) return;

    setIsShooting(true);
    if (soundEnabled) playSound('cue');
    const speed = (power / 100) * 26;
    cueBall.vx = Math.cos(aimAngle) * speed;
    cueBall.vy = Math.sin(aimAngle) * speed;
  };

  // Bot Turn Automation with Human Delay
  useEffect(() => {
    if (currentView === 'table' && turn === 'bot' && !isShooting && !gameOver && !isPractice) {
      const botTimer = setTimeout(() => {
        const cueBall = ballsRef.current[0];
        const targetBalls = ballsRef.current.filter(b => !b.isPotted && b.type !== 'cue');

        if (cueBall && targetBalls.length > 0) {
          let closest = targetBalls[0];
          let minDist = 9999;
          targetBalls.forEach(b => {
            const d = Math.hypot(b.x - cueBall.x, b.y - cueBall.y);
            if (d < minDist) {
              minDist = d;
              closest = b;
            }
          });

          const variance = (Math.random() - 0.5) * 0.15;
          const targetAngle = Math.atan2(closest.y - cueBall.y, closest.x - cueBall.x) + variance;
          setAimAngle(targetAngle);

          setIsShooting(true);
          if (soundEnabled) playSound('cue');
          const botSpeed = 14 + Math.random() * 8;
          cueBall.vx = Math.cos(targetAngle) * botSpeed;
          cueBall.vy = Math.sin(targetAngle) * botSpeed;
        }
      }, 2400);

      return () => clearTimeout(botTimer);
    }
  }, [currentView, turn, isShooting, gameOver, isPractice, soundEnabled]);

  // Launch Table
  const startMatch = (targetMode: '8-ball' | 'snooker', practice = false, tableStake = 100) => {
    setMode(targetMode);
    setIsPractice(practice);
    setStake(tableStake);
    setPrize(Math.round(tableStake * 1.9));
    setHumanScore(0);
    setBotScore(0);
    setGameOver(null);
    setTurn('human');
    setActiveModal(null);
    initBalls(targetMode);
    setCurrentView('table');
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#02070f] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative" dir="rtl">

      {/* ======================================================== */}
      {/* 1. CUE MASTER LOBBY / MAIN MENU (MATCHES USER DESIGN)   */}
      {/* ======================================================== */}
      {currentView === 'menu' && (
        <div
          className="relative flex-1 flex flex-col justify-between p-4 md:p-8 bg-cover bg-center overflow-hidden min-h-screen"
          style={{
            backgroundImage: `linear-gradient(rgba(2, 7, 15, 0.45), rgba(2, 7, 15, 0.7)), url('/cue_master_bg.jpg')`,
            backgroundPosition: 'center 45%'
          }}
        >
          {/* Top Bar: Profile & Currencies */}
          <div className="flex justify-between items-center z-10 w-full max-w-6xl mx-auto">
            
            {/* Player Info (Top Left in Arabic RTL) */}
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/60 shadow-xl">
              <div className="relative">
                <img
                  src={avatar}
                  alt={username}
                  className="w-12 h-12 rounded-full border-2 border-amber-400 bg-slate-900 shadow-md"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{username}</span>
                  <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-slate-700">
                    Level 1
                  </span>
                </div>
                {/* XP Progress Bar */}
                <div className="w-24 h-2 bg-slate-800 rounded-full mt-1.5 overflow-hidden border border-slate-700">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 w-3/5 rounded-full" />
                </div>
              </div>
            </div>

            {/* Currencies: Coins & Gems (Top Right in Arabic RTL) */}
            <div className="flex items-center gap-3">
              {/* Coins Pill */}
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-lg">
                <button
                  onClick={() => setCoins(c => c + 1000)}
                  className="w-5 h-5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center cursor-pointer shadow"
                  title="شحن عملات"
                >
                  +
                </button>
                <span className="text-[11px] font-black text-amber-300 font-mono">
                  {coins.toLocaleString()}
                </span>
                <span className="text-sm">🪙</span>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider">COINS</span>
              </div>

              {/* Gems Pill */}
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-fuchsia-500/40 shadow-lg">
                <button
                  onClick={() => setGems(g => g + 50)}
                  className="w-5 h-5 rounded-md bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black text-xs flex items-center justify-center cursor-pointer shadow"
                  title="شحن جواهر"
                >
                  +
                </button>
                <span className="text-[11px] font-black text-fuchsia-300 font-mono">
                  {gems.toLocaleString()}
                </span>
                <span className="text-sm">💎</span>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider">GEMS</span>
              </div>
            </div>

          </div>

          {/* Center Area: Cue Master Logo & Crossed Cues */}
          <div className="flex flex-col items-center justify-center my-auto z-10 text-center animate-fade-in py-6">
            
            <div className="relative flex flex-col items-center">
              
              {/* 3D Golden Logo */}
              <div className="relative select-none">
                <h1 className="text-6xl md:text-8xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] stroke-black">
                  CUE
                </h1>
                <div className="text-4xl md:text-6xl font-black tracking-widest text-cyan-300 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)] -mt-3 md:-mt-5">
                  MASTER
                </div>
              </div>

              {/* Tagline */}
              <p className="text-xs md:text-sm font-bold text-amber-200/90 mt-2 bg-black/50 px-4 py-1 rounded-full border border-amber-500/30 backdrop-blur-sm">
                🎱 البلياردو والسنوكر الاحترافي • تحدي الأساطير
              </p>

            </div>

            {/* 4 Main Action Buttons Grid (Matches the 4 Bevelled Buttons in User Design) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-8">
              
              {/* 1. PLAY NOW (Green Glossy 3D Button) */}
              <button
                onClick={() => setActiveModal('stake_select')}
                className="group relative flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-b from-emerald-500 via-green-600 to-emerald-800 hover:from-emerald-400 hover:to-green-700 border-2 border-emerald-300/80 shadow-[0_6px_0_#064e3b,0_10px_20px_rgba(16,185,129,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#064e3b] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center shadow-inner">
                  <span className="text-white text-base">▶</span>
                </div>
                <span className="text-lg md:text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider">
                  PLAY NOW
                </span>
              </button>

              {/* 2. MULTIPLAYER (Blue Glossy 3D Button) */}
              <button
                onClick={() => setActiveModal('stake_select')}
                className="group relative flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-b from-blue-500 via-sky-600 to-blue-800 hover:from-blue-400 hover:to-sky-700 border-2 border-sky-300/80 shadow-[0_6px_0_#1e3a8a,0_10px_20px_rgba(14,165,233,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#1e3a8a] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center shadow-inner">
                  <span className="text-white text-base">👥</span>
                </div>
                <span className="text-lg md:text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider">
                  MULTIPLAYER
                </span>
              </button>

              {/* 3. TOURNAMENTS (Amber/Gold Glossy 3D Button) */}
              <button
                onClick={() => setActiveModal('tournaments')}
                className="group relative flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-500 via-orange-600 to-amber-800 hover:from-amber-400 hover:to-orange-700 border-2 border-amber-300/80 shadow-[0_6px_0_#7c2d12,0_10px_20px_rgba(245,158,11,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#7c2d12] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center shadow-inner">
                  <span className="text-amber-200 text-base">🏆</span>
                </div>
                <span className="text-lg md:text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider">
                  TOURNAMENTS
                </span>
              </button>

              {/* 4. PRACTICE (Metallic Silver Glossy 3D Button) */}
              <button
                onClick={() => startMatch('8-ball', true, 0)}
                className="group relative flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 hover:from-slate-300 hover:to-slate-700 border-2 border-slate-300/80 shadow-[0_6px_0_#1e293b,0_10px_20px_rgba(100,116,139,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#1e293b] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center shadow-inner">
                  <span className="text-white text-base">🎯</span>
                </div>
                <span className="text-lg md:text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider">
                  PRACTICE
                </span>
              </button>

            </div>

          </div>

          {/* Bottom Bar: Settings, Shop Tab, Leaderboard */}
          <div className="flex justify-between items-end z-10 w-full max-w-5xl mx-auto pt-4">
            
            {/* Settings (Left) */}
            <button
              onClick={() => setActiveModal('settings')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-black shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <span>⚙️</span>
              <span>SETTINGS</span>
            </button>

            {/* Shop (Center Tab with Golden Pointer) */}
            <div className="flex flex-col items-center -mb-2">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-amber-500 mb-0.5" />
              <button
                onClick={() => setActiveModal('shop')}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-t from-black via-slate-950 to-slate-900 text-amber-300 border-2 border-amber-500/80 rounded-t-2xl text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:text-white cursor-pointer transition-all"
              >
                <span>🛒</span>
                <span>SHOP</span>
              </button>
            </div>

            {/* Leaderboard (Right) */}
            <button
              onClick={() => setActiveModal('leaderboard')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-black shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <span>LEADERBOARD</span>
              <span>🏆</span>
            </button>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PLAYABLE BILLIARDS & SNOOKER CANVAS TABLE SCREEN      */}
      {/* ======================================================== */}
      {currentView === 'table' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Top Bar inside Table */}
          <div className="bg-slate-950/90 border-b border-slate-800 p-3 md:p-4 flex flex-wrap justify-between items-center gap-4 z-20">
            
            {/* Human Player */}
            <div className={`flex items-center gap-3 p-2 rounded-xl transition-all ${turn === 'human' || isPractice ? 'bg-indigo-950/60 border border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'opacity-70'}`}>
              <img src={avatar} alt={username} className="w-11 h-11 rounded-full border border-indigo-400 bg-slate-900" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">{username}</span>
                  {(turn === 'human' || isPractice) && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">دورك!</span>}
                </div>
                <div className="text-[11px] text-amber-300 font-bold">النقاط: {humanScore}</div>
              </div>
            </div>

            {/* Center: Table & Mode Details */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isPractice ? '🎯 وضع التدريب الحر (Practice)' : `الرهان: ${stake} 🪙 • الجائزة: ${prize} 🪙`}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {mode === '8-ball' ? '🎱 كيو ماستر: طاولة 8-Ball الأمريكية' : '🟢 كيو ماستر: ترابيزة السنوكر الملكية'}
              </div>
            </div>

            {/* Opponent or Solo Info */}
            <div className="flex items-center gap-3">
              {!isPractice ? (
                <div className={`flex items-center gap-3 p-2 rounded-xl transition-all ${turn === 'bot' ? 'bg-rose-950/60 border border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'opacity-70'}`}>
                  <div className="text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      {turn === 'bot' && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">يفكر...</span>}
                      <span className="text-xs font-black text-white">{opponentName}</span>
                      <span className="text-xs">{opponentFlag}</span>
                    </div>
                    <div className="text-[11px] text-amber-300 font-bold text-left">النقاط: {botScore}</div>
                  </div>
                  <img src={opponentAvatar} alt={opponentName} className="w-11 h-11 rounded-full border border-rose-400 bg-slate-900" />
                </div>
              ) : (
                <div className="px-3 py-2 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 font-bold">
                  تدريب فردي بدون خصم
                </div>
              )}

              {/* Back to Cue Master Menu */}
              <button
                onClick={() => setCurrentView('menu')}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-black transition-all cursor-pointer shadow"
              >
                🏠 قائمة كيو ماستر
              </button>

              {/* Close iframe */}
              <button
                onClick={handleCloseToParent}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                title="إغلاق"
              >
                ✕
              </button>
            </div>

          </div>

          {/* Canvas Table Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-6 overflow-hidden">
            <div className="w-full max-w-[960px] aspect-[2/1] relative rounded-3xl overflow-hidden shadow-[0_0_70px_rgba(0,0,0,0.95)] border-4 border-amber-950">
              <canvas
                ref={canvasRef}
                width={TABLE_WIDTH}
                height={TABLE_HEIGHT}
                onMouseMove={handleCanvasMouseMove}
                onClick={handleShoot}
                className="w-full h-full cursor-crosshair"
              />

              {gameOver && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-fade-in z-30">
                  <span className="text-5xl">🏆</span>
                  <h2 className="text-2xl font-black text-amber-400">{gameOver}</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setGameOver(null);
                        initBalls(mode);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg cursor-pointer"
                    >
                      جولة جديدة 🔄
                    </button>
                    <button
                      onClick={() => setCurrentView('menu')}
                      className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer"
                    >
                      القائمة الرئيسية 🏠
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom In-Game Controls */}
            <div className="w-full max-w-[960px] mt-4 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('8-ball')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mode === '8-ball' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  🎱 8-Ball Pool
                </button>
                <button
                  onClick={() => setMode('snooker')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mode === 'snooker' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  🟢 ترابيزة سنوكر
                </button>
              </div>

              <div className="flex items-center gap-3 flex-1 max-w-xs">
                <span className="text-xs font-bold text-slate-400">قوة الضربة:</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={power}
                  onChange={(e) => setPower(parseInt(e.target.value))}
                  disabled={(!isPractice && turn !== 'human') || isShooting}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-black text-indigo-400 w-8">{power}%</span>
              </div>

              <button
                onClick={handleShoot}
                disabled={(!isPractice && turn !== 'human') || isShooting}
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg cursor-pointer ${
                  (isPractice || turn === 'human') && !isShooting
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white active:scale-95'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {isShooting ? 'الكرات تتحرك... 🎱' : (isPractice || turn === 'human') ? 'اضرب الكرة! 🚀' : 'انتظر دور الخصم...'}
              </button>

            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODALS (STAKE SELECT, SETTINGS, SHOP, LEADERBOARD...)  */}
      {/* ======================================================== */}

      {/* Stake Selector Modal (Play Now & Multiplayer) */}
      {activeModal === 'stake_select' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b121e] border border-amber-500/40 rounded-3xl p-6 w-full max-w-lg relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                <span>🎱</span> اختيار طاولة ومبلغ الرهان
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-900 rounded-2xl border border-slate-800">
              <button
                onClick={() => setMode('8-ball')}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${mode === '8-ball' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'}`}
              >
                🎱 8-Ball Pool (أمريكي)
              </button>
              <button
                onClick={() => setMode('snooker')}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${mode === 'snooker' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400'}`}
              >
                🟢 Royal Snooker (سنوكر)
              </button>
            </div>

            {/* Tables Options */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {[
                { name: 'طاولة القاهرة (Cairo)', fee: 100, win: 190, icon: '🇪🇬' },
                { name: 'طاولة الإسكندرية (Alexandria)', fee: 500, win: 950, icon: '🌊' },
                { name: 'طاولة دبي الذهبية (Dubai)', fee: 2500, win: 4750, icon: '🇦🇪' },
                { name: 'طاولة لندن الملكية (London)', fee: 10000, win: 19000, icon: '🇬🇧' },
              ].map((tbl) => (
                <div
                  key={tbl.fee}
                  className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-2xl hover:border-amber-500/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tbl.icon}</span>
                    <div>
                      <div className="text-xs font-black text-white">{tbl.name}</div>
                      <div className="text-[10px] text-amber-300 font-mono">الرهان: {tbl.fee} 🪙 • الجائزة: {tbl.win} 🪙</div>
                    </div>
                  </div>
                  <button
                    onClick={() => startMatch(mode, false, tbl.fee)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer active:scale-95"
                  >
                    العب الآن ▶
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tournaments Modal */}
      {activeModal === 'tournaments' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b121e] border border-amber-500/40 rounded-3xl p-6 w-full max-w-xl relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                <span>🏆</span> بطولات كيو ماستر الإقصائية (8 Players)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200">
              نظام خروج المغلوب من 3 أدوار (ربع النهائي ⬅️ نصف النهائي ⬅️ النهائي الكبير).
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'كأس القاهرة المفتوح', fee: 500, prize: 3500, badge: 'جاهز' },
                { title: 'بطولة دبي الدولية', fee: 2000, prize: 14000, badge: 'قريباً' },
              ].map((tourn) => (
                <div key={tourn.title} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="font-black text-sm text-white">{tourn.title}</h4>
                    <p className="text-[11px] text-amber-300 mt-1">الدخول: {tourn.fee} 🪙 • الجائزة الكبرى: {tourn.prize} 🪙</p>
                  </div>
                  <button
                    onClick={() => startMatch('8-ball', false, tourn.fee)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer"
                  >
                    دخول البطولة ⚔️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {activeModal === 'shop' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b121e] border border-amber-500/40 rounded-3xl p-6 w-full max-w-md relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                <span>🛒</span> متجر عصي البلياردو (Cue Sticks)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              {[
                { id: 'classic', name: 'عصا الخشب الكلاسيكية', color: '#d97706', cost: 'مملوكة' },
                { id: 'dragon', name: 'عصا التنين الناري', color: '#dc2626', cost: '5,000 🪙' },
                { id: 'neon', name: 'عصا النيون السيبرانية', color: '#06b6d4', cost: '15,000 🪙' },
                { id: 'gold', name: 'عصا الفراعنة الذهبية', color: '#fbbf24', cost: '50,000 🪙' },
              ].map((c) => (
                <div key={c.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedCue === c.id ? 'bg-amber-500/10 border-amber-400' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-xs font-black text-white">{c.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedCue(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${selectedCue === c.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                  >
                    {selectedCue === c.id ? 'مجهزة ✓' : c.cost}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b121e] border border-slate-700 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">⚙️ الإعدادات (Settings)</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="flex items-center justify-between">
                <span>المؤثرات الصوتية:</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  {soundEnabled ? 'مفعل 🔊' : 'مكتوم 🔇'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span>خط التوجيه المساعد:</span>
                <button
                  onClick={() => setAimAssistLong(!aimAssistLong)}
                  className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${aimAssistLong ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  {aimAssistLong ? 'طويل (Pro)' : 'قصير'}
                </button>
              </div>

              <div>
                <span className="block mb-2">لون قماش الطاولة:</span>
                <div className="flex gap-2">
                  <button onClick={() => setFeltColor('green')} className={`flex-1 py-1.5 rounded-xl text-[11px] ${feltColor === 'green' ? 'bg-green-700 text-white' : 'bg-slate-800'}`}>أخضر</button>
                  <button onClick={() => setFeltColor('blue')} className={`flex-1 py-1.5 rounded-xl text-[11px] ${feltColor === 'blue' ? 'bg-blue-700 text-white' : 'bg-slate-800'}`}>أزرق</button>
                  <button onClick={() => setFeltColor('snooker')} className={`flex-1 py-1.5 rounded-xl text-[11px] ${feltColor === 'snooker' ? 'bg-emerald-800 text-white' : 'bg-slate-800'}`}>سنوكر</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {activeModal === 'leaderboard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b121e] border border-amber-500/40 rounded-3xl p-6 w-full max-w-md relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-amber-300">🏆 صدارة ملوك كيو ماستر</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-2">
              {[
                { rank: 1, name: 'فخر_العرب_8BP', coins: '1,450,000 🪙', badge: '🥇' },
                { rank: 2, name: 'سلطان_السنوكر', coins: '980,000 🪙', badge: '🥈' },
                { rank: 3, name: 'كايزن_بلياردو', coins: '720,000 🪙', badge: '🥉' },
                { rank: 4, name: username, coins: `${coins.toLocaleString()} 🪙`, badge: '⭐ أنت' },
              ].map((p) => (
                <div key={p.rank} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-400">{p.badge}</span>
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                  <span className="text-amber-300 font-mono font-bold">{p.coins}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
