'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function BilliardsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#020b14] text-slate-400">جاري تحميل طاولة البلياردو والسنوكر...</div>}>
      <BilliardsGameApp />
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

function BilliardsGameApp() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || 'guest';
  const username = searchParams.get('username') || 'لاعب 1';
  const avatar = searchParams.get('avatar') || 'https://api.dicebear.com/7.x/bottts/svg?seed=Gamer1';
  const stake = parseInt(searchParams.get('stake') || '100');
  const prize = parseInt(searchParams.get('prize') || '190');
  const initialMode = (searchParams.get('mode') as '8-ball' | 'snooker') || '8-ball';
  const opponentName = searchParams.get('opponentName') || 'أحمد_البرنس';
  const opponentAvatar = searchParams.get('opponentAvatar') || 'https://api.dicebear.com/7.x/bottts/svg?seed=AhmedEG';
  const opponentFlag = searchParams.get('opponentFlag') || '🇪🇬';

  const [mode, setMode] = useState<'8-ball' | 'snooker'>(initialMode);
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
  const isDraggingCueRef = useRef<boolean>(false);

  // Table Dimensions
  const TABLE_WIDTH = 900;
  const TABLE_HEIGHT = 450;
  const CUSHION = 30;
  const BALL_RADIUS = 12;

  // Initialize Balls
  const initBalls = (currentMode: '8-ball' | 'snooker') => {
    const balls: Ball[] = [];
    const tableLeft = CUSHION;
    const tableRight = TABLE_WIDTH - CUSHION;
    const tableTop = CUSHION;
    const tableBottom = TABLE_HEIGHT - CUSHION;
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
      // 8-Ball Triangle Rack
      const startX = tableLeft + (tableRight - tableLeft) * 0.7;
      const ballColors = [
        '#facc15', '#2563eb', '#dc2626', '#7c3aed', '#ea580c', '#16a34a', '#991b1b', // Solids 1-7
        '#0f172a', // 8 Ball Black
        '#fef08a', '#93c5fd', '#fca5a5', '#c4b5fd', '#fed7aa', '#86efac', '#fecaca'  // Stripes 9-15
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
      // Red balls pack
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

      // Snooker Colors on their designated spots
      const colors = [
        { name: 'Yellow', color: '#eab308', val: 2, x: tableLeft + 150, y: centerY - 60 },
        { name: 'Green', color: '#16a34a', val: 3, x: tableLeft + 150, y: centerY + 60 },
        { name: 'Brown', color: '#78350f', val: 4, x: tableLeft + 150, y: centerY },
        { name: 'Blue', color: '#2563eb', val: 5, x: TABLE_WIDTH / 2, y: centerY },
        { name: 'Pink', color: '#ec4899', val: 6, x: startX - 25, y: centerY },
        { name: 'Black', color: '#09090b', val: 7, x: tableRight - 60, y: centerY }
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

  // Main Physics Engine & Renderer Loop
  useEffect(() => {
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

        if (ball.x < minX) { ball.x = minX; ball.vx = -ball.vx * 0.85; }
        if (ball.x > maxX) { ball.x = maxX; ball.vx = -ball.vx * 0.85; }
        if (ball.y < minY) { ball.y = minY; ball.vy = -ball.vy * 0.85; }
        if (ball.y > maxY) { ball.y = maxY; ball.vy = -ball.vy * 0.85; }

        // Pocket Detection
        pockets.forEach((p) => {
          const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
          if (dist < POCKET_RADIUS) {
            ball.isPotted = true;
            ball.vx = 0;
            ball.vy = 0;

            if (ball.type === 'cue') {
              // Scratch penalty: reset cue ball
              setTimeout(() => {
                ball.isPotted = false;
                ball.x = CUSHION + (TABLE_WIDTH - 2 * CUSHION) * 0.25;
                ball.y = TABLE_HEIGHT / 2;
                ball.vx = 0;
                ball.vy = 0;
              }, 1000);
            } else if (ball.type === 'black') {
              // 8-ball in
              if (turn === 'human') {
                setGameOver('🎉 فزت بالمباراة! أحرزت الكرة السوداء رقم 8!');
              } else {
                setGameOver('خسرت المباراة! الخصم أحرز الكرة رقم 8.');
              }
            } else {
              // Score increment
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

            // Separate overlapping balls
            const overlap = b1.radius + b2.radius - dist;
            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            // Elastic Collision impulse
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            b1.vx -= p * nx * 0.92;
            b1.vy -= p * ny * 0.92;
            b2.vx += p * nx * 0.92;
            b2.vy += p * ny * 0.92;
            anyMoving = true;
          }
        }
      }

      // Check if shot has settled
      if (isShooting && !anyMoving) {
        setIsShooting(false);
        // Switch turn
        setTurn((prev) => (prev === 'human' ? 'bot' : 'human'));
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      // 1. Table Border Wood Frame
      ctx.fillStyle = '#2b1810';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      // Gold metallic table inlays
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, TABLE_WIDTH - 16, TABLE_HEIGHT - 16);

      // 2. Cloth Felt
      const feltGradient = ctx.createRadialGradient(
        TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 80,
        TABLE_WIDTH / 2, TABLE_HEIGHT / 2, TABLE_WIDTH / 1.5
      );
      if (mode === '8-ball') {
        // Deep Royal Blue or Classic Emerald
        feltGradient.addColorStop(0, '#0284c7');
        feltGradient.addColorStop(1, '#034575');
      } else {
        // Snooker Classic Deep Forest Baize
        feltGradient.addColorStop(0, '#059669');
        feltGradient.addColorStop(1, '#064e3b');
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
        ctx.fillStyle = '#09090b';
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
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
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
          ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 1,
          ball.x, ball.y, ball.radius
        );
        grad.addColorStop(0, 'rgba(255,255,255,0.85)');
        grad.addColorStop(0.3, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');

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

      // 5. Aiming Line & Cue Stick (When human's turn and not shooting)
      const cueBall = balls[0];
      if (turn === 'human' && !isShooting && cueBall && !cueBall.isPotted) {
        // Aiming Guideline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        ctx.lineTo(
          cueBall.x + Math.cos(aimAngle) * 220,
          cueBall.y + Math.sin(aimAngle) * 220
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Cue Stick
        const cueLength = 260;
        const cueOffset = 25 + (power / 100) * 35; // moves back with power
        const cueStartX = cueBall.x - Math.cos(aimAngle) * cueOffset;
        const cueStartY = cueBall.y - Math.sin(aimAngle) * cueOffset;
        const cueEndX = cueBall.x - Math.cos(aimAngle) * (cueOffset + cueLength);
        const cueEndY = cueBall.y - Math.sin(aimAngle) * (cueOffset + cueLength);

        // Cue Stick Line
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cueStartX, cueStartY);
        ctx.lineTo(cueEndX, cueEndY);
        ctx.stroke();

        // Cue Tip
        ctx.strokeStyle = '#38bdf8';
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
  }, [mode, turn, aimAngle, power, isShooting]);

  // Handle Mouse/Touch Drag for Aiming
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (turn !== 'human' || isShooting) return;
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

  // Human Shoot Trigger
  const handleShoot = () => {
    if (turn !== 'human' || isShooting) return;
    const cueBall = ballsRef.current[0];
    if (!cueBall || cueBall.isPotted) return;

    setIsShooting(true);
    const speed = (power / 100) * 26;
    cueBall.vx = Math.cos(aimAngle) * speed;
    cueBall.vy = Math.sin(aimAngle) * speed;
  };

  // Ghost Bot AI Turn Automation
  useEffect(() => {
    if (turn === 'bot' && !isShooting && !gameOver) {
      // Human-like hesitation delay: 2.2 seconds
      const botTimer = setTimeout(() => {
        const cueBall = ballsRef.current[0];
        const targetBalls = ballsRef.current.filter(b => !b.isPotted && b.type !== 'cue');

        if (cueBall && targetBalls.length > 0) {
          // Select closest target ball
          let closest = targetBalls[0];
          let minDist = 9999;
          targetBalls.forEach(b => {
            const d = Math.hypot(b.x - cueBall.x, b.y - cueBall.y);
            if (d < minDist) {
              minDist = d;
              closest = b;
            }
          });

          // Aim at closest ball with human inaccuracy variance
          const variance = (Math.random() - 0.5) * 0.15;
          const targetAngle = Math.atan2(closest.y - cueBall.y, closest.x - cueBall.x) + variance;
          setAimAngle(targetAngle);

          // Shoot
          setIsShooting(true);
          const botSpeed = 14 + Math.random() * 8;
          cueBall.vx = Math.cos(targetAngle) * botSpeed;
          cueBall.vy = Math.sin(targetAngle) * botSpeed;
        }
      }, 2400);

      return () => clearTimeout(botTimer);
    }
  }, [turn, isShooting, gameOver]);

  return (
    <div className="w-full h-full min-h-screen bg-[#020912] text-slate-200 flex flex-col font-sans select-none overflow-x-hidden" dir="rtl">
      
      {/* Top HUD: Players, Stakes & Turn */}
      <div className="bg-slate-950/80 border-b border-slate-800 p-3 md:p-4 flex flex-wrap justify-between items-center gap-4">
        
        {/* Human Player */}
        <div className={`flex items-center gap-3 p-2 rounded-xl transition-all ${turn === 'human' ? 'bg-indigo-950/60 border border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'opacity-70'}`}>
          <img src={avatar} alt={username} className="w-11 h-11 rounded-full border border-indigo-400 bg-slate-900" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">{username}</span>
              {turn === 'human' && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">دورك!</span>}
            </div>
            <div className="text-[11px] text-amber-300 font-bold">النقاط: {humanScore}</div>
          </div>
        </div>

        {/* Center: Table & Stake Info */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              الرهان: {stake} 🪙 • الجائزة: {prize} 🪙
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {mode === '8-ball' ? '🎱 طاولة 8-Ball الأمريكية' : '🟢 ترابيزة السنوكر الملكية'}
          </div>
        </div>

        {/* Opponent (Ghost Bot or Human) */}
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

      </div>

      {/* Main Canvas Table Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-6 overflow-hidden">
        <div className="w-full max-w-[960px] aspect-[2/1] relative rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] border-4 border-amber-950/80">
          <canvas
            ref={canvasRef}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            onMouseMove={handleCanvasMouseMove}
            onClick={handleShoot}
            className="w-full h-full cursor-crosshair"
          />

          {/* Victory Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-fade-in">
              <span className="text-5xl">🏆</span>
              <h2 className="text-2xl font-black text-amber-400">{gameOver}</h2>
              <button
                onClick={() => {
                  setGameOver(null);
                  initBalls(mode);
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg cursor-pointer"
              >
                جولة جديدة 🔄
              </button>
            </div>
          )}
        </div>

        {/* Bottom Cue Power Slider & Controls */}
        <div className="w-full max-w-[960px] mt-4 bg-slate-950/70 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          
          {/* Table Switcher */}
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

          {/* Power Meter Slider */}
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <span className="text-xs font-bold text-slate-400">قوة الضربة:</span>
            <input
              type="range"
              min="20"
              max="100"
              value={power}
              onChange={(e) => setPower(parseInt(e.target.value))}
              disabled={turn !== 'human' || isShooting}
              className="flex-1 accent-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-black text-indigo-400 w-8">{power}%</span>
          </div>

          {/* Shoot Button */}
          <button
            onClick={handleShoot}
            disabled={turn !== 'human' || isShooting}
            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg cursor-pointer ${
              turn === 'human' && !isShooting
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white active:scale-95'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isShooting ? 'الكرات تتحرك... 🎱' : turn === 'human' ? 'اضرب الكرة! 🚀' : 'انتظر دور الخصم...'}
          </button>

        </div>
      </div>

    </div>
  );
}
