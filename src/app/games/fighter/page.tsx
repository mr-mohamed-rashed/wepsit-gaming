'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FighterGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  // Game Phase & Mode
  const [phase, setPhase] = useState<'select' | 'stage_select' | 'fight'>('select');
  const [aiDifficulty, setAiDifficulty] = useState<'none' | 'easy' | 'medium' | 'hard'>('none');
  const [stageImage, setStageImage] = useState<string>('/iron_strike_cyber_stage.png');
  const [rouletteIndex, setRouletteIndex] = useState(0);

  const availableStages = [
    '/fighter-bg.png', 
    '/iron_strike_cyber_stage.png',
    '/iron_strike_industrial_zone.png',
    '/iron_strike_chinatown.png',
    '/iron_strike_subway.png',
    '/iron_strike_ahwa.png',
    '/iron_strike_cairo_alley.png',
    '/iron_strike_cairo_bridge.png'
  ];

  useEffect(() => {
    if (phase !== 'stage_select') return;

    let audioCtx: AudioContext | null = null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    } catch (e) {}

    const playBlip = () => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    };

    const playStartGong = () => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.5);
    };

    let iterations = 0;
    const maxIterations = 20 + Math.floor(Math.random() * 10);
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      playBlip();
      currentIndex = (currentIndex + 1) % availableStages.length;
      setRouletteIndex(currentIndex);
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(interval);
        playStartGong();
        
        setStageImage(availableStages[currentIndex]);
        
        setTimeout(() => {
          setPhase('fight');
        }, 1500);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [phase]);

  // Game State React mirror for UI
  const [p1Health, setP1Health] = useState(200);
  const [p2Health, setP2Health] = useState(200);
  const [p1Super, setP1Super] = useState(0);
  const [p2Super, setP2Super] = useState(0);
  const [timer, setTimer] = useState(150);

  // We use refs to allow the canvas loop to safely update the react state without closing over stale state.
  const setP1HealthRef = useRef(setP1Health);
  const setP2HealthRef = useRef(setP2Health);
  const setP1SuperRef = useRef(setP1Super);
  const setP2SuperRef = useRef(setP2Super);
  const setGameOverRef = useRef(setGameOver);
  const setWinnerRef = useRef(setWinner);
  const setTimerRef = useRef(setTimer);
  
  const keysRef = useRef({
    w: { pressed: false },
    a: { pressed: false },
    s: { pressed: false },
    d: { pressed: false },
    space: { pressed: false },
    t: { pressed: false },
    y: { pressed: false },
    u: { pressed: false },
    g: { pressed: false },
    h: { pressed: false },
    ArrowUp: { pressed: false },
    ArrowLeft: { pressed: false },
    ArrowDown: { pressed: false },
    ArrowRight: { pressed: false },
    Enter: { pressed: false },
    i: { pressed: false },
    o: { pressed: false },
    p: { pressed: false },
    k: { pressed: false },
    l: { pressed: false },
  });

  useEffect(() => {
    setP1HealthRef.current = setP1Health;
    setP2HealthRef.current = setP2Health;
    setP1SuperRef.current = setP1Super;
    setP2SuperRef.current = setP2Super;
    setGameOverRef.current = setGameOver;
    setWinnerRef.current = setWinner;
    setTimerRef.current = setTimer;
  }, [p1Health, p2Health, p1Super, p2Super, gameOver, winner, timer]);

  useEffect(() => {
    if (phase !== 'fight') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed canvas logical size for 16:9
    const CANVAS_WIDTH = 1024;
    const CANVAS_HEIGHT = 576;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Oversized stage dimensions (250% for 3D Camera boundaries)
    const BG_WIDTH = CANVAS_WIDTH * 2.5;
    const BG_HEIGHT = CANVAS_HEIGHT * 2.5;
    const bgOffsetX = -(BG_WIDTH - CANVAS_WIDTH) / 2;
    const bgOffsetY = -(BG_HEIGHT - CANVAS_HEIGHT); // Align bottoms so characters stand on the street

    const gravity = 0.7;
    const groundY = CANVAS_HEIGHT - 50;

    // Load Background Image
    const bgImage = new Image();
    bgImage.src = stageImage;

    const keys = keysRef.current;

    const aiKeys = {
      ArrowUp: { pressed: false },
      ArrowLeft: { pressed: false },
      ArrowDown: { pressed: false },
      ArrowRight: { pressed: false },
      i: { pressed: false },
      o: { pressed: false },
      k: { pressed: false },
      l: { pressed: false },
    };

    let aiFrameCount = 0;
    let aiState: 'idle' | 'defend' | 'attack' = 'idle';
    let aiStateTimer = 0;

    const camera = { 
      x: 0, 
      y: 0, 
      scale: 1, 
      rotation: 0, 
      cinematic: false, 
      cinematicDirection: 'right', 
      cinematicTarget: {x: 0, y: 0} 
    };
    const screenShake = { duration: 0, intensity: 0 };

    function trigger_cinematic_strike(attacker: Fighter, defender: Fighter) {
      camera.cinematic = true;
      camera.cinematicDirection = attacker.facing;
      camera.cinematicTarget = { x: defender.x + defender.width/2, y: defender.y + defender.height/2 };
      screenShake.duration = 15;
      screenShake.intensity = 20;
      
      setTimeout(() => {
        camera.cinematic = false;
      }, 500); // Cinematic lasts 500ms
    }

    class Particle {
      x: number;
      y: number;
      velocity: { x: number; y: number };
      radius: number;
      color: string;
      alpha: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.velocity = {
          x: (Math.random() - 0.5) * (Math.random() * 10),
          y: (Math.random() - 0.5) * (Math.random() * 10)
        };
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        this.alpha = 1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }

      update(ctx: CanvasRenderingContext2D) {
        this.draw(ctx);
        this.velocity.x *= 0.99; // friction
        this.velocity.y += 0.2; // gravity
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02; // fade out
      }
    }

    const particles: Particle[] = [];

    class Fighter {
      x: number;
      y: number;
      z: number;
      width: number;
      height: number;
      baseHeight: number;
      crouchHeight: number;
      color: string;
      velocity: { x: number; y: number };
      isJumping: boolean;
      isCrouching: boolean;
      speed: number;
      health: number;
      superMeter: number;
      isUltimate: boolean;
      facing: 'left' | 'right';
      
      // Combat properties
      attackBox: { position: { x: number; y: number }; width: number; height: number };
      isAttacking: boolean;
      attackType: 'lp' | 'rp' | 'lk' | 'rk' | 'combo' | null;
      attackCooldown: boolean;
      attackDamage: number;
      comboBuffer: { type: string; time: number }[];
      
      // Juggle properties
      isLaunched: boolean;
      juggleHits: number;
      jumpCount: number;

      lane: 'foreground' | 'background';
      targetZ: number;

      constructor(x: number, y: number, color: string, facing: 'left' | 'right') {
        this.x = x;
        this.y = y;
        this.z = 0;
        this.targetZ = 0;
        this.lane = 'foreground';
        this.width = 50;
        this.baseHeight = 150;
        this.crouchHeight = 80;
        this.height = this.baseHeight;
        this.color = color;
        this.velocity = { x: 0, y: 0 };
        this.isJumping = false;
        this.isCrouching = false;
        this.speed = 5;
        this.health = 200;
        this.superMeter = 0;
        this.isUltimate = false;
        this.facing = facing;
        
        this.attackBox = {
          position: { x: this.x, y: this.y },
          width: 100,
          height: 30
        };
        this.isAttacking = false;
        this.attackType = null;
        this.attackCooldown = false;
        this.attackDamage = 0;
        this.comboBuffer = [];
        this.isLaunched = false;
        this.juggleHits = 0;
        this.jumpCount = 0;
      }

      draw() {
        if (!ctx) return;
        
        ctx.save();
        
        // Z-axis scaling (0 is neutral, positive is background, negative is foreground)
        const zScale = 1 - (this.z / 600);
        
        // Scale around the feet (bottom center)
        ctx.translate(this.x + this.width / 2, this.y + this.height);
        ctx.scale(zScale, zScale);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height));

        
        // Ninja (Player 1)
        if (this.color === '#3b82f6') {
          // Body (Dark Navy)
          ctx.fillStyle = '#1e293b'; 
          ctx.fillRect(this.x, this.y, this.width, this.height);
          
          // Face slit
          ctx.fillStyle = '#fcd34d'; // Skin tone
          ctx.fillRect(this.x + (this.facing === 'right' ? 20 : 10), this.y + 15, 20, 10);
          
          // Headband (Red)
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(this.x, this.y + 10, this.width, 5);
          
          // Flowing ribbon
          if (this.facing === 'right') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 12);
            ctx.lineTo(this.x - 20, this.y + 15 + Math.sin(Date.now() / 100) * 5);
            ctx.lineTo(this.x - 15, this.y + 20 + Math.sin(Date.now() / 100) * 5);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width, this.y + 12);
            ctx.lineTo(this.x + this.width + 20, this.y + 15 + Math.sin(Date.now() / 100) * 5);
            ctx.lineTo(this.x + this.width + 15, this.y + 20 + Math.sin(Date.now() / 100) * 5);
            ctx.fill();
          }

          // Katana on back
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (this.facing === 'right') {
             ctx.moveTo(this.x - 10, this.y + 20);
             ctx.lineTo(this.x + 10, this.y + 80);
          } else {
             ctx.moveTo(this.x + this.width + 10, this.y + 20);
             ctx.lineTo(this.x + this.width - 10, this.y + 80);
          }
          ctx.stroke();

        } 
        // Samurai (Player 2)
        else {
          // Base Armor (Red)
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(this.x, this.y, this.width, this.height);
          
          // Armor Plates (Gold lines)
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(this.x - 5, this.y + 40, this.width + 10, 5);
          ctx.fillRect(this.x - 5, this.y + 60, this.width + 10, 5);
          ctx.fillRect(this.x - 5, this.y + 80, this.width + 10, 5);
          
          // Kabuto (Helmet horns)
          ctx.beginPath();
          if (this.facing === 'left') {
             ctx.moveTo(this.x + 10, this.y);
             ctx.lineTo(this.x - 10, this.y - 20);
             ctx.lineTo(this.x + 20, this.y - 10);
          } else {
             ctx.moveTo(this.x + this.width - 10, this.y);
             ctx.lineTo(this.x + this.width + 10, this.y - 20);
             ctx.lineTo(this.x + this.width - 20, this.y - 10);
          }
          ctx.fill();
          
          // Face mask
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(this.x + (this.facing === 'left' ? 5 : 25), this.y + 15, 20, 20);
        }

        // Draw Ultimate Aura
        if (this.isUltimate) {
           ctx.shadowColor = this.color === '#3b82f6' ? '#06b6d4' : '#f59e0b';
           ctx.shadowBlur = 20;
           ctx.strokeStyle = this.color === '#3b82f6' ? '#06b6d4' : '#f59e0b';
           ctx.lineWidth = 4;
           ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
        }
        
        ctx.restore();

        // Draw attack box if attacking
        if (this.isAttacking) {
          ctx.fillStyle = this.isUltimate ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 0, 0.5)';
          ctx.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
        }
      }

      update() {
        // Update attack box position based on facing direction
        this.attackBox.position.x = this.facing === 'right' ? this.x + this.width : this.x - this.attackBox.width;
        
        // Adjust attack height based on crouching
        let yOffset = 20;
        if (this.attackType === 'lk' || this.attackType === 'rk') {
           yOffset = this.height - 40; // Kicks are lower
        }
        this.attackBox.position.y = this.y + yOffset;

        this.draw();

        // Horizontal movement
        this.x += this.velocity.x;
        
        // Vertical movement (gravity)
        this.y += this.velocity.y;
        
        // Lerp Z to targetZ for smooth lane transitions
        this.z += (this.targetZ - this.z) * 0.2;
        
        // Dynamically shift groundY based on lane depth to make them walk into the background
        const currentGroundY = groundY - (this.z * 0.4);

        if (this.y + this.height >= currentGroundY) {
          if (this.isLaunched) {
            screenShake.duration = 5;
            screenShake.intensity = 10;
          }
          this.velocity.y = 0;
          this.y = currentGroundY - this.height;
          this.isJumping = false;
          this.isLaunched = false;
          this.juggleHits = 0;
          this.jumpCount = 0;
        } else {
          this.velocity.y += gravity;
        }

        // Ceiling Bound (Cannot jump higher than the large background)
        if (this.y < bgOffsetY + 50) {
           this.y = bgOffsetY + 50;
           if (this.velocity.y < 0) this.velocity.y = 0; // Bonk head!
        }

        // World Bounds X (Fighters clamped to the massive 250% background, not the screen)
        this.x = Math.max(bgOffsetX + 50, Math.min(this.x, bgOffsetX + BG_WIDTH - this.width - 50));
      }

      crouch(active: boolean) {
        if (active && !this.isJumping) {
          if (!this.isCrouching) {
            this.height = this.crouchHeight;
            this.y += (this.baseHeight - this.crouchHeight); // shift down
            this.isCrouching = true;
          }
        } else {
          if (this.isCrouching) {
            this.height = this.baseHeight;
            this.y -= (this.baseHeight - this.crouchHeight); // shift up
            this.isCrouching = false;
          }
        }
      }

      attack(type: 'lp' | 'rp' | 'lk' | 'rk') {
        if (this.attackCooldown) return;
        
        const now = Date.now();
        this.comboBuffer.push({ type, time: now });
        // Keep only attacks from the last 1500ms
        this.comboBuffer = this.comboBuffer.filter(c => now - c.time < 1500);

        // Check for specific combo: rp -> lp -> lk
        const sequence = this.comboBuffer.map(c => c.type).join('-');
        if (sequence.includes('rp-lp-lk')) {
          this.isAttacking = true;
          this.attackType = 'combo';
          this.attackBox.width = 160;
          this.attackBox.height = 60;
          this.attackDamage = 25; // Massive damage combo!
          this.attackCooldown = true;
          this.comboBuffer = []; // Reset buffer after combo

          setTimeout(() => {
            this.isAttacking = false;
            this.attackType = null;
          }, 250); // Longer active frames

          setTimeout(() => {
            this.attackCooldown = false;
          }, 800); // Longer recovery
          return;
        }

        this.isAttacking = true;
        this.attackType = type;
        
        if (type === 'lp' || type === 'rp') {
          this.attackBox.width = 120;
          this.attackBox.height = 30;
          this.attackDamage = type === 'lp' ? 5 : 8; // light punch vs heavy punch
        } else {
          this.attackBox.width = 140;
          this.attackBox.height = 40;
          this.attackDamage = type === 'lk' ? 7 : 12; // light kick vs heavy kick
        }

        this.attackCooldown = true;

        setTimeout(() => {
          this.isAttacking = false;
          this.attackType = null;
        }, 150);

        setTimeout(() => {
          this.attackCooldown = false;
        }, 400); // Attack cooldown (recovery frames)
      }
    }

    const player1 = new Fighter(350, 100, '#3b82f6', 'right'); // Blue
    const player2 = new Fighter(CANVAS_WIDTH - 400, 100, '#ef4444', 'left'); // Red

    let animationId: number;
    let matchEnded = false;

    // Helper for collision detection
    function rectangularCollision({ rectangle1, rectangle2 }: { rectangle1: Fighter, rectangle2: Fighter }) {
      // Must be in the same lane (Z proximity) to hit each other!
      if (Math.abs(rectangle1.z - rectangle2.z) > 40) return false;

      return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.x &&
        rectangle1.attackBox.position.x <= rectangle2.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.y &&
        rectangle1.attackBox.position.y <= rectangle2.y + rectangle2.height
      );
    }

    // Determine if a player is successfully blocking
    function isBlocking(defender: Fighter, attacker: Fighter) {
      if (defender === player1 && keys.a.pressed && attacker.facing === 'left') return true;
      if (defender === player2 && keys.ArrowRight.pressed && attacker.facing === 'right') return true;
      return false;
    }

    function animate() {
      if (!ctx || !canvas || matchEnded) return;
      animationId = requestAnimationFrame(animate);

      // Clear canvas with black to prevent smearing when zoomed out
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- Camera Logic ---
      const midX = (player1.x + player2.x) / 2;
      const dist = Math.abs(player1.x - player2.x);
      
      let targetScale = 1.0;
      let targetRotation = 0;
      
      const highestY = Math.min(player1.y, player2.y);
      const heightAboveGround = Math.max(0, (groundY - 100) - highestY);
      
      // Dynamic Zoom based on distance (Tekken style tight radius)
      if (dist < 300) targetScale = 1.25;
      else if (dist > 700) targetScale = 0.95;
      else targetScale = 1.25 - ((dist - 300) / 400) * 0.3; 
      
      // Zoom out smoothly if players jump high
      if (heightAboveGround > 50 && !camera.cinematic) {
         // Safe minimum scale is 0.4 to prevent exposing 250% background edges (1/2.5 = 0.4)
         const heightScale = Math.max(0.42, 1.25 - (heightAboveGround - 50) / 400);
         targetScale = Math.min(targetScale, heightScale);
      }
      
      if (camera.cinematic) {
         targetScale = 1.6;
         targetRotation = (camera.cinematicDirection === 'right' ? 10 : -10) * Math.PI / 180;
      }
      
      // Smooth interpolation (Lerp)
      camera.scale += (targetScale - camera.scale) * 0.15;
      camera.rotation += (targetRotation - camera.rotation) * 0.15;
      
      const scaledWidth = CANVAS_WIDTH / camera.scale;
      const scaledHeight = CANVAS_HEIGHT / camera.scale;
      
      let targetX = midX - scaledWidth / 2;
      let targetY = (groundY - 100) - scaledHeight / 2;
      
      // Pan camera up when jumping high
      if (heightAboveGround > 50 && !camera.cinematic) {
         targetY -= (heightAboveGround - 50) * 0.6;
      }
      
      if (camera.cinematic) {
         targetX = camera.cinematicTarget.x - scaledWidth / 2;
         targetY = camera.cinematicTarget.y - scaledHeight / 2;
      }

      // Strictly clamp camera to the oversized background boundaries to prevent black space
      targetX = Math.max(bgOffsetX, Math.min(targetX, bgOffsetX + BG_WIDTH - scaledWidth));
      targetY = Math.max(bgOffsetY, Math.min(targetY, bgOffsetY + BG_HEIGHT - scaledHeight));
      
      camera.x += (targetX - camera.x) * 0.15;
      camera.y += (targetY - camera.y) * 0.15;

      // --- Screen Shake Logic ---
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (screenShake.duration > 0) {
        shakeOffsetX = (Math.random() - 0.5) * screenShake.intensity * 2;
        shakeOffsetY = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.duration--;
      }

      // --- Rendering Pipeline ---
      ctx.save();
      
      // 1. Move to center of screen for rotation/scaling
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      
      // 2. Apply Scale & Rotation
      ctx.scale(camera.scale, camera.scale);
      ctx.rotate(camera.rotation);
      
      // 3. Translate back to camera position with shake
      ctx.translate(
        -(camera.x + scaledWidth / 2) + shakeOffsetX, 
        -(camera.y + scaledHeight / 2) + shakeOffsetY
      );

      // Background
      if (bgImage.complete) {
        ctx.drawImage(bgImage, bgOffsetX, bgOffsetY, BG_WIDTH, BG_HEIGHT);
      } else {
        ctx.fillStyle = '#0f172a'; // slate-900 fallback
        ctx.fillRect(bgOffsetX, bgOffsetY, BG_WIDTH, BG_HEIGHT);
        ctx.fillStyle = '#1e293b'; // slate-800 ground fallback
        ctx.fillRect(bgOffsetX, groundY, BG_WIDTH, BG_HEIGHT);
      }

      player1.update();
      player2.update();

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(ctx);
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }
      
      ctx.restore(); // End Camera bounds
      
      // Auto-face each other
      if (player1.x < player2.x) {
        player1.facing = 'right';
        player2.facing = 'left';
      } else {
        player1.facing = 'left';
        player2.facing = 'right';
      }

      // --- Sidestep (2-Lane System) and Movement Logic ---
      
      // P1 Movement
      player1.velocity.x = 0;
      if (!player1.isCrouching && !player1.isAttacking) {
        if (keys.a.pressed) player1.velocity.x = -player1.speed;
        if (keys.d.pressed) player1.velocity.x = player1.speed;
      }
      
      // P1 Lane Shift & Crouch
      if (keys.w.pressed && !player1.isAttacking && !player1.isJumping) {
         player1.lane = 'background';
         player1.targetZ = 150; // Deep background shift
         keys.w.pressed = false; // Require another press
      }
      if (keys.s.pressed) {
         if (player1.lane === 'background' && !player1.isAttacking && !player1.isJumping) {
            player1.lane = 'foreground';
            player1.targetZ = 0;
            keys.s.pressed = false;
         } else if (player1.lane === 'foreground') {
            player1.crouch(true);
         }
      } else if (!keys.s.pressed) {
         player1.crouch(false);
      }

      // P1 Jump (Spacebar)
      if (keys.space.pressed && !player1.isAttacking) {
        if (!player1.isJumping) {
          player1.velocity.y = -15;
          player1.isJumping = true;
          player1.jumpCount = 1;
        } else if (player1.jumpCount === 1 && player1.velocity.y > -5) { // Double jump at apex
          player1.velocity.y = -12;
          player1.jumpCount = 2;
          for (let i = 0; i < 10; i++) {
            particles.push(new Particle(player1.x + player1.width/2, player1.y + player1.height, '#fff'));
          }
        }
      }
      aiFrameCount++;
      if (aiDifficulty !== 'none' && !player2.isLaunched && !matchEnded) {
        // Reset AI keys
        aiKeys.ArrowLeft.pressed = false;
        aiKeys.ArrowRight.pressed = false;
        aiKeys.ArrowUp.pressed = false;
        aiKeys.ArrowDown.pressed = false;

        const dist = player1.x - player2.x;
        const absDist = Math.abs(dist);
        const isClose = absDist < 120;
        
        // Face player
        const dir = player1.x > player2.x ? 'right' : 'left';

        if (aiDifficulty === 'easy') {
          // Easy: Slow movement, random attacks
          if (aiFrameCount % 60 === 0) {
            if (!isClose) {
              if (dir === 'right') aiKeys.ArrowRight.pressed = true;
              else aiKeys.ArrowLeft.pressed = true;
            } else {
              if (Math.random() > 0.5) player2.attack('lp');
              else player2.attack('lk');
            }
          }
        } 
        else if (aiDifficulty === 'medium') {
          // Medium: Move in, 50% block chance when P1 attacks, basic attacks
          if (player1.isAttacking && isClose && Math.random() > 0.5) {
            // Block (walk away)
            if (dir === 'right') aiKeys.ArrowLeft.pressed = true;
            else aiKeys.ArrowRight.pressed = true;
          } else if (!isClose) {
            if (dir === 'right') aiKeys.ArrowRight.pressed = true;
            else aiKeys.ArrowLeft.pressed = true;
            // Occasional jump
            if (Math.random() < 0.01) aiKeys.ArrowUp.pressed = true;
          } else {
            // Attack if close
            if (aiFrameCount % 30 === 0) {
              const attacks = ['lp', 'rp', 'lk'];
              player2.attack(attacks[Math.floor(Math.random() * attacks.length)] as any);
            }
          }
        }
        else if (aiDifficulty === 'hard') {
          // --- Hard AI (Finite State Machine) ---
          aiStateTimer++;
          
          // State Transitions (Evaluate every 10 frames to simulate reaction time)
          if (aiStateTimer > 10) {
            if (player1.isAttacking && isClose) {
              aiState = 'defend';
            } else if (!player1.isAttacking && Math.random() > 0.3) {
              aiState = 'attack';
            } else {
              aiState = 'idle';
            }
            aiStateTimer = 0;
          }

          // State Behaviors
          switch (aiState) {
            case 'defend':
              // Block (Walk away from P1)
              if (dir === 'right') aiKeys.ArrowLeft.pressed = true;
              else aiKeys.ArrowRight.pressed = true;
              break;
              
            case 'attack':
              // Spacing and attacking
              if (player1.isLaunched) {
                if (aiFrameCount % 15 === 0) player2.attack('lp');
              } else if (player1.isJumping && isClose) {
                player2.attack('rk');
              } else if (!isClose && absDist >= 80) {
                // Bridge distance and use long-range kicks
                if (dir === 'right') aiKeys.ArrowRight.pressed = true;
                else aiKeys.ArrowLeft.pressed = true;
                
                if (aiFrameCount % 20 === 0 && absDist < 150) {
                  player2.attack(Math.random() > 0.5 ? 'lk' : 'rk');
                }
              } else {
                // Close range: Fast punches
                if (aiFrameCount % 15 === 0) {
                  player2.attack(Math.random() > 0.5 ? 'lp' : 'rp');
                }
              }
              break;
              
            case 'idle':
              // Small repositioning
              if (aiFrameCount % 30 === 0) {
                if (Math.random() > 0.5) aiKeys.ArrowLeft.pressed = true;
                else aiKeys.ArrowRight.pressed = true;
              }
              break;
          }
        }
      }

      // P2 Movement (AI or Local)
      player2.velocity.x = 0;
      const activeP2Keys = aiDifficulty === 'none' ? keys : aiKeys;
      
      if (!player2.isCrouching && !player2.isAttacking) {
        if (activeP2Keys.ArrowLeft.pressed) player2.velocity.x = -player2.speed;
        if (activeP2Keys.ArrowRight.pressed) player2.velocity.x = player2.speed;
      }
      
      // P2 Lane Shift & Crouch
      if (activeP2Keys.ArrowUp.pressed && !player2.isAttacking && !player2.isJumping) {
         player2.lane = 'background';
         player2.targetZ = 150;
         if (aiDifficulty === 'none') keys.ArrowUp.pressed = false;
         else aiKeys.ArrowUp.pressed = false;
      }
      if (activeP2Keys.ArrowDown.pressed) {
         if (player2.lane === 'background' && !player2.isAttacking && !player2.isJumping) {
            player2.lane = 'foreground';
            player2.targetZ = 0;
            if (aiDifficulty === 'none') keys.ArrowDown.pressed = false;
            else aiKeys.ArrowDown.pressed = false;
         } else if (player2.lane === 'foreground') {
            player2.crouch(true);
         }
      } else if (!activeP2Keys.ArrowDown.pressed) {
         player2.crouch(false);
      }

      // P2 Jump (Enter)
      if ((activeP2Keys as any).Enter?.pressed && !player2.isAttacking) {
        if (!player2.isJumping) {
          player2.velocity.y = -15;
          player2.isJumping = true;
          player2.jumpCount = 1;
        } else if (player2.jumpCount === 1 && player2.velocity.y > -5) {
          player2.velocity.y = -12;
          player2.jumpCount = 2;
          for (let i = 0; i < 10; i++) {
            particles.push(new Particle(player2.x + player2.width/2, player2.y + player2.height, '#fff'));
          }
        }
        if (aiDifficulty === 'none') (keys as any).Enter.pressed = false;
        else (aiKeys as any).Enter.pressed = false;
      }

      // Combat Collision & Damage Logic (P1 attacks P2)
      if (
        player1.isAttacking && 
        rectangularCollision({ rectangle1: player1, rectangle2: player2 })
      ) {
        player1.isAttacking = false; // Turn off hitbox after single hit
        const blocked = isBlocking(player2, player1) && !player2.isLaunched;
        
        let damage = player1.attackDamage;
        if (blocked) {
          damage = Math.floor(damage * 0.2);
        } else if (player2.isLaunched) {
          // Juggle damage scaling
          damage = Math.floor(damage / (1 + player2.juggleHits));
          player2.juggleHits += 1;
          player2.velocity.y = -6; // Juggle bump
        } else if (player1.attackType === 'rk') {
          // Launcher!
          player2.isLaunched = true;
          player2.juggleHits = 0;
          player2.velocity.y = -18; // Launch into air
          player2.isJumping = true; // Put in air state
        }

        if (!blocked && (damage >= 15 || player1.attackType === 'rp' || player1.attackType === 'rk')) {
          trigger_cinematic_strike(player1, player2);
        }

        // Spawn hit particles
        const impactX = player1.facing === 'right' ? player2.x : player2.x + player2.width;
        const impactY = player1.attackBox.position.y + 15;
        const sparkColor = (!blocked && damage >= 15) || player1.attackType === 'rk' ? '#ef4444' : '#fbbf24'; // Red or Yellow
        const sparkCount = sparkColor === '#ef4444' ? 15 : 8;
        
        for (let i = 0; i < sparkCount; i++) {
          particles.push(new Particle(impactX, impactY, sparkColor));
        }
        
        player2.health -= damage;
        setP2HealthRef.current(Math.max(0, player2.health));
        
        // Increase Super Meters
        if (!player1.isUltimate) {
          player1.superMeter = Math.min(100, player1.superMeter + 10);
          player2.superMeter = Math.min(100, player2.superMeter + 5);
          setP1SuperRef.current(player1.superMeter);
          setP2SuperRef.current(player2.superMeter);
        }
        
        // Pushback effect
        player2.x += (player1.facing === 'right' ? 10 : -10);
      }

      // Combat Collision & Damage Logic (P2 attacks P1)
      if (
        player2.isAttacking && 
        rectangularCollision({ rectangle1: player2, rectangle2: player1 })
      ) {
        player2.isAttacking = false; // Turn off hitbox after single hit
        const blocked = isBlocking(player1, player2) && !player1.isLaunched;
        
        let damage = player2.attackDamage;
        if (blocked) {
          damage = Math.floor(damage * 0.2);
        } else if (player1.isLaunched) {
          // Juggle damage scaling
          damage = Math.floor(damage / (1 + player1.juggleHits));
          player1.juggleHits += 1;
          player1.velocity.y = -6; // Juggle bump
        } else if (player2.attackType === 'rk') {
          // Launcher!
          player1.isLaunched = true;
          player1.juggleHits = 0;
          player1.velocity.y = -18; // Launch into air
          player1.isJumping = true; // Put in air state
        }

        if (!blocked && (damage >= 15 || player2.attackType === 'rp' || player2.attackType === 'rk')) {
          trigger_cinematic_strike(player2, player1);
        }

        // Spawn hit particles
        const impactX = player2.facing === 'right' ? player1.x : player1.x + player1.width;
        const impactY = player2.attackBox.position.y + 15;
        const sparkColor = (!blocked && damage >= 15) || player2.attackType === 'rk' ? '#ef4444' : '#fbbf24'; // Red or Yellow
        const sparkCount = sparkColor === '#ef4444' ? 15 : 8;
        
        for (let i = 0; i < sparkCount; i++) {
          particles.push(new Particle(impactX, impactY, sparkColor));
        }

        player1.health -= damage;
        setP1HealthRef.current(Math.max(0, player1.health));
        
        // Increase Super Meters
        if (!player2.isUltimate) {
          player2.superMeter = Math.min(100, player2.superMeter + 10);
          player1.superMeter = Math.min(100, player1.superMeter + 5);
          setP2SuperRef.current(player2.superMeter);
          setP1SuperRef.current(player1.superMeter);
        }
        
        // Pushback effect
        player1.x += (player2.facing === 'right' ? 10 : -10);
      }

      // Win Condition Check
      if (player1.health <= 0 || player2.health <= 0) {
        matchEnded = true;
        setGameOverRef.current(true);
        if (player1.health <= 0 && player2.health <= 0) setWinnerRef.current('Draw');
        else if (player1.health <= 0) setWinnerRef.current('Player 2');
        else if (player2.health <= 0) setWinnerRef.current('Player 1');
      }
    }

    animate();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchEnded) return;
      
      // Prevent browser default actions (like scrolling with Spacebar or Arrows)
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Use e.code to ignore keyboard layout (e.g., Arabic vs English)
      switch (e.code) {
        // Player 1 Movement
        case 'KeyW': keys.w.pressed = true; break;
        case 'KeyA': keys.a.pressed = true; break;
        case 'KeyS': keys.s.pressed = true; break;
        case 'KeyD': keys.d.pressed = true; break;
        case 'Space': keys.space.pressed = true; break;
        // Player 1 Attacks
        case 'KeyT': keys.t.pressed = true; player1.attack('lp'); break;
        case 'KeyY': keys.y.pressed = true; player1.attack('rp'); break;
        case 'KeyG': keys.g.pressed = true; player1.attack('lk'); break;
        case 'KeyH': keys.h.pressed = true; player1.attack('rk'); break;
        case 'KeyU': 
          keys.u.pressed = true; 
          if (player1.superMeter >= 100) {
            player1.superMeter = 0;
            setP1SuperRef.current(0);
            player1.isUltimate = true;
            setTimeout(() => { player1.isUltimate = false; }, 1000);
            player1.attack('rk'); 
            player1.attackDamage = 40; 
            screenShake.duration = 20;
            screenShake.intensity = 25;
            if (ctx) {
               ctx.fillStyle = 'white';
               ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
            }
          }
          break;

        // Player 2 Movement
        case 'ArrowUp': keys.ArrowUp.pressed = true; break;
        case 'ArrowLeft': keys.ArrowLeft.pressed = true; break;
        case 'ArrowDown': keys.ArrowDown.pressed = true; break;
        case 'ArrowRight': keys.ArrowRight.pressed = true; break;
        case 'Enter': 
        case 'Numpad0': keys.Enter.pressed = true; break;
        // Player 2 Attacks
        case 'KeyI': keys.i.pressed = true; player2.attack('lp'); break;
        case 'KeyO': keys.o.pressed = true; player2.attack('rp'); break;
        case 'KeyK': keys.k.pressed = true; player2.attack('lk'); break;
        case 'KeyL': keys.l.pressed = true; player2.attack('rk'); break;
        case 'KeyP': 
          keys.p.pressed = true; 
          if (player2.superMeter >= 100) {
            player2.superMeter = 0;
            setP2SuperRef.current(0);
            player2.isUltimate = true;
            setTimeout(() => { player2.isUltimate = false; }, 1000);
            player2.attack('rk'); 
            player2.attackDamage = 40; 
            screenShake.duration = 20;
            screenShake.intensity = 25;
            if (ctx) {
               ctx.fillStyle = 'white';
               ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
            }
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        // Player 1
        case 'KeyW': keys.w.pressed = false; break;
        case 'KeyA': keys.a.pressed = false; break;
        case 'KeyS': keys.s.pressed = false; break;
        case 'KeyD': keys.d.pressed = false; break;
        case 'Space': keys.space.pressed = false; break;
        case 'KeyT': keys.t.pressed = false; break;
        case 'KeyY': keys.y.pressed = false; break;
        case 'KeyU': keys.u.pressed = false; break;
        case 'KeyG': keys.g.pressed = false; break;
        case 'KeyH': keys.h.pressed = false; break;
        // Player 2
        case 'ArrowUp': keys.ArrowUp.pressed = false; break;
        case 'ArrowLeft': keys.ArrowLeft.pressed = false; break;
        case 'ArrowDown': keys.ArrowDown.pressed = false; break;
        case 'ArrowRight': keys.ArrowRight.pressed = false; break;
        case 'KeyI': keys.i.pressed = false; break;
        case 'KeyO': keys.o.pressed = false; break;
        case 'KeyP': keys.p.pressed = false; break;
        case 'KeyK': keys.k.pressed = false; break;
        case 'KeyL': keys.l.pressed = false; break;
        case 'Enter': 
        case 'Numpad0': keys.Enter.pressed = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Timer Logic
    let currentTimer = 150;
    const timerInterval = setInterval(() => {
      if (matchEnded || currentTimer <= 0) {
        clearInterval(timerInterval);
        if (currentTimer <= 0 && !matchEnded) {
          matchEnded = true;
          setGameOverRef.current(true);
          // Determine winner by health
          if (player1.health === player2.health) setWinnerRef.current('Draw');
          else if (player1.health > player2.health) setWinnerRef.current('Player 1');
          else setWinnerRef.current('Player 2');
        }
        return;
      }
      currentTimer -= 1;
      setTimerRef.current(currentTimer);
    }, 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
      clearInterval(timerInterval);
    };
  }, [phase, stageImage]);

  return (
    <div className="h-screen w-screen bg-transparent flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      {/* Blurred Game Card Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center -z-20 scale-105"
        style={{
          backgroundImage: "url('/arcade_mode_card.png')",
          filter: 'brightness(0.35) saturate(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 -z-10" />
      {/* Header UI */}
      <div className="w-full max-w-[1024px] flex justify-between items-center mb-6">
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm"
        >
          ⬅️ Back to Hub
        </button>
        <h1 className="text-2xl font-black text-white uppercase tracking-widest text-center">
          2D <span className="text-rose-500">Fighter</span> Arena
        </h1>
        <div className="w-[150px]"></div> {/* Spacer */}
      </div>

      {/* Game Container */}
      <div 
        className="relative aspect-video border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 select-none"
        style={{ width: '100%', maxWidth: 'min(1422px, 160vh)' }}
      >
        
        {/* Mobile Virtual Gamepad Overlay */}
        {phase === 'fight' && !gameOver && (
          <div className="absolute inset-0 z-20 pointer-events-none flex justify-between items-end p-4 md:p-8 pb-8 md:pb-12">
            {/* D-Pad (Left) */}
            <div className="relative w-36 h-36 md:w-48 md:h-48 pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
              <button 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-black border-2 border-white/10 active:bg-white/30 backdrop-blur-md"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }))}
              >⬆</button>
              <button 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-black border-2 border-white/10 active:bg-white/30 backdrop-blur-md"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }))}
              >⬇</button>
              <button 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-black border-2 border-white/10 active:bg-white/30 backdrop-blur-md"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }))}
              >⬅</button>
              <button 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-black border-2 border-white/10 active:bg-white/30 backdrop-blur-md"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }))}
              >➡</button>
              {/* Dedicated Jump Button on Left */}
              <button 
                className="absolute -right-4 -top-8 w-14 h-14 md:w-18 md:h-18 bg-cyan-500/30 rounded-full flex items-center justify-center text-white/90 font-black border-2 border-cyan-400/50 active:bg-cyan-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }))}
              >JMP</button>
            </div>

            {/* Ultimate Button (Center) */}
            <div className="absolute left-1/2 bottom-12 -translate-x-1/2 pointer-events-auto opacity-90">
               <button 
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-black text-xl md:text-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border-4 transition-all ${p1Super === 100 ? 'bg-cyan-500 text-white border-cyan-300 animate-pulse shadow-[0_0_30px_#22d3ee]' : 'bg-slate-800/80 text-slate-500 border-slate-700/80 backdrop-blur-md'}`}
                onTouchStart={(e) => { 
                  e.preventDefault(); 
                  const event = new KeyboardEvent('keydown', { code: 'KeyU' });
                  window.dispatchEvent(event);
                }}
                onMouseDown={() => {
                  const event = new KeyboardEvent('keydown', { code: 'KeyU' });
                  window.dispatchEvent(event);
                }}
              >⚡</button>
            </div>

            {/* Action Buttons (Right) */}
            <div className="relative w-36 h-36 md:w-48 md:h-48 pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
              <button 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-black border-2 border-white/10 active:bg-white/30 backdrop-blur-md"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyT' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyT' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyT' }))}
              >LP</button>
              <button 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-black border-2 border-white/10 active:bg-white/30 backdrop-blur-md"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyG' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyG' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyG' }))}
              >LK</button>
              <button 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-black border-2 border-white/10 active:bg-white/30 backdrop-blur-md"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyH' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyH' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyH' }))}
              >RK</button>
              <button 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-black border-2 border-white/10 active:bg-white/30 backdrop-blur-md"
                onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyY' })); }}
                onTouchEnd={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyY' })); }}
                onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyY' }))}
                onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyY' }))}
                onMouseLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyY' }))}
              >RP</button>
            </div>
          </div>
        )}
        
        {/* Character Selection Phase Overlay */}
        {phase === 'select' && (
          <div 
            className="absolute inset-0 z-50 flex items-end justify-center pb-12 bg-cover bg-center"
            style={{ backgroundImage: 'url("/character-select-bg.png")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
            <div className="relative z-10 flex flex-wrap justify-center gap-4 px-4 w-full max-w-4xl">
              <button
                onClick={() => { setAiDifficulty('none'); setPhase('stage_select'); }}
                className="flex-1 min-w-[200px] py-4 bg-cyan-600/80 hover:bg-cyan-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(8,145,178,0.5)] border border-cyan-400 transition-all hover:scale-105 active:scale-95"
              >
                PvP (Local)
              </button>
              <button
                onClick={() => { setAiDifficulty('easy'); setPhase('stage_select'); }}
                className="flex-1 min-w-[200px] py-4 bg-emerald-600/80 hover:bg-emerald-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400 transition-all hover:scale-105 active:scale-95"
              >
                vs AI (Easy)
              </button>
              <button
                onClick={() => { setAiDifficulty('medium'); setPhase('stage_select'); }}
                className="flex-1 min-w-[200px] py-4 bg-amber-600/80 hover:bg-amber-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-400 transition-all hover:scale-105 active:scale-95"
              >
                vs AI (Medium)
              </button>
              <button
                onClick={() => { setAiDifficulty('hard'); setPhase('stage_select'); }}
                className="flex-1 min-w-[200px] py-4 bg-rose-600/80 hover:bg-rose-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.5)] border border-rose-400 transition-all hover:scale-105 active:scale-95 animate-pulse"
              >
                vs AI (Hard)
              </button>
            </div>
          </div>
        )}

        {/* Stage Select Roulette Overlay */}
        {phase === 'stage_select' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950">
            <h2 className="text-4xl font-black text-cyan-400 mb-8 uppercase tracking-widest animate-pulse">
              Selecting Stage...
            </h2>
            <div className="relative w-3/4 max-w-2xl aspect-video border-8 border-cyan-500 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.5)]">
              <img 
                src={availableStages[rouletteIndex]} 
                alt="Stage" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay animate-pulse"></div>
            </div>
          </div>
        )}

        {/* HUD (Heads Up Display) */}
        <div className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start z-10 pointer-events-none gap-4 md:gap-8">
          {/* Player 1 Health & Super */}
          <div className="flex-1 max-w-[40%]">
            <div className="bg-rose-600 h-6 md:h-8 w-full rounded-tr-xl border-2 border-b-0 border-slate-900 relative flex justify-end overflow-hidden shadow-lg">
              <div 
                className="bg-blue-500 h-full transition-all duration-200" 
                style={{ width: `${(p1Health / 200) * 100}%` }}
              ></div>
            </div>
            <div className="bg-slate-800 h-3 md:h-4 w-full rounded-br-xl border-2 border-slate-900 relative flex justify-start overflow-hidden shadow-md">
              <div 
                className={`h-full transition-all duration-200 ${p1Super === 100 ? 'bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]' : 'bg-cyan-600'}`} 
                style={{ width: `${p1Super}%` }}
              ></div>
            </div>
            <p className="text-white font-bold text-xs md:text-sm mt-2 drop-shadow-md">Player 1 (Ninja)</p>
          </div>

          {/* Timer */}
          <div className="bg-slate-900/80 backdrop-blur-md border-2 border-slate-700 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black text-amber-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0">
            {timer}
          </div>

          {/* Player 2 Health & Super */}
          <div className="flex-1 max-w-[40%]">
            <div className="bg-rose-600 h-6 md:h-8 w-full rounded-tl-xl border-2 border-b-0 border-slate-900 relative overflow-hidden shadow-lg">
              <div 
                className="bg-red-500 h-full transition-all duration-200" 
                style={{ width: `${(p2Health / 200) * 100}%` }}
              ></div>
            </div>
            <div className="bg-slate-800 h-3 md:h-4 w-full rounded-bl-xl border-2 border-slate-900 relative flex justify-end overflow-hidden shadow-md">
              <div 
                className={`h-full transition-all duration-200 ${p2Super === 100 ? 'bg-amber-400 animate-pulse shadow-[0_0_10px_#fbbf24]' : 'bg-amber-600'}`} 
                style={{ width: `${p2Super}%` }}
              ></div>
            </div>
            <p className="text-white font-bold text-xs md:text-sm mt-2 text-right drop-shadow-md">Player 2 (Samurai)</p>
          </div>
        </div>

        {/* The Canvas Arena */}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block"
        />

        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur flex flex-col items-center justify-center z-20 pointer-events-auto">
            <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-widest animate-bounce">
              {winner === 'Draw' ? 'Draw!' : `${winner} Wins!`}
            </h2>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xl uppercase tracking-wider"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
