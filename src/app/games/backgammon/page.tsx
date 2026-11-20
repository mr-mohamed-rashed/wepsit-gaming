'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

// Checker representation
interface Checker {
  color: 'white' | 'red';
}

// Backgammon game state
// 24 points: 0 to 23
// white moves from 0 to 23 (bears off past 23)
// red moves from 23 to 0 (bears off past 0)
type BoardState = Checker[][];

class BackgammonSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playDice() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Simulate dice rolling sound
    for (let i = 0; i < 5; i++) {
      const time = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 + Math.random() * 200, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      osc.start(time);
      osc.stop(time + 0.06);
    }
  }

  playMove() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playError() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start();
    osc.stop(now + 0.3);
  }

  playHit() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start();
    osc.stop(now + 0.15);
  }
}

const synth = new BackgammonSynth();

function BackgammonGameContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'ar';
  const userId = searchParams.get('userId') || 'mock-user-developer-admin';

  // Game Phases: 'init', 'playing', 'roundover', 'gameover'
  const [phase, setPhase] = useState<'init' | 'playing' | 'roundover' | 'gameover'>('init');
  
  // Board setup: index 0 to 23
  const [board, setBoard] = useState<BoardState>([]);
  const [bar, setBar] = useState<{ white: number; red: number }>({ white: 0, red: 0 });
  const [off, setOff] = useState<{ white: number; red: number }>({ white: 0, red: 0 });

  const [dice, setDice] = useState<number[]>([1, 1]);
  const [originalRoll, setOriginalRoll] = useState<number[]>([1, 1]); // Stores the visual roll for the 3D dice
  const [movesLeft, setMovesLeft] = useState<number[]>([]); // Array of moves we can make this turn (e.g. [3, 5])
  const [turn, setTurn] = useState<'white' | 'red'>('white'); // 'white' (player), 'red' (bot)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [selectedBar, setSelectedBar] = useState<boolean>(false);

  // Custom dice interactive states
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'31' | 'mahbousa'>('31');
  const [showDiceVisual, setShowDiceVisual] = useState<boolean>(true);
  
  const [matchScore, setMatchScore] = useState<{ white: number; red: number }>({ white: 0, red: 0 });
  const [startRollResult, setStartRollResult] = useState<{ white: number; red: number } | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'red'>('white'); // 'white' or 'red' (Black)
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [dismissStartRoll, setDismissStartRoll] = useState<boolean>(true);

  const [profile, setProfile] = useState<any>(null);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['default']);
  const [activeSkin, setActiveSkin] = useState<string>('default');

  useEffect(() => {
    const saved = localStorage.getItem('gaming_portal_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    const savedSkins = localStorage.getItem('backgammon_unlocked_skins');
    if (savedSkins) {
      setUnlockedSkins(JSON.parse(savedSkins));
    }
    const savedActive = localStorage.getItem('backgammon_active_skin');
    if (savedActive) {
      setActiveSkin(savedActive);
    } else {
      setActiveSkin('default');
    }
  }, []);

  const skinsList = [
    { id: 'default', nameAr: 'طاولة الشيش الكلاسيكية', nameEn: 'Classic Wooden Board', path: '/backgammon_board.jpg', price: 0 },
    { id: 'ancient', nameAr: 'طاولة القوى المخفية الأثرية', nameEn: 'Ancient Hidden Powers', path: '/board_skin_ancient.jpg', price: 100 },
    { id: 'ice', nameAr: 'طاولة الجليد الأسطورية', nameEn: 'Ancient Ice Board', path: '/board_skin_ice.jpg', price: 150 },
    { id: 'chronicle', nameAr: 'طاولة التاريخ الذهبية', nameEn: 'Golden Chronicle Board', path: '/board_skin_chronicle.jpg', price: 200 },
  ];

  const buySkin = (skinId: string, price: number) => {
    const saved = localStorage.getItem('gaming_portal_profile');
    if (!saved) return;
    const prof = JSON.parse(saved);
    if (prof.gold_coins < price) {
      alert(lang === 'ar' ? '⚠️ عذراً، لا تمتلك عملات كافية للشراء!' : '⚠️ Sorry, not enough coins!');
      return;
    }

    prof.gold_coins -= price;
    localStorage.setItem('gaming_portal_profile', JSON.stringify(prof));
    setProfile(prof);

    const nextSkins = [...unlockedSkins, skinId];
    setUnlockedSkins(nextSkins);
    localStorage.setItem('backgammon_unlocked_skins', JSON.stringify(nextSkins));

    window.parent.postMessage({ type: 'UPDATE_PROFILE', profile: prof }, '*');
    alert(lang === 'ar' ? '🎉 تم الشراء بنجاح! يمكنك الآن تطبيق المظهر.' : '🎉 Purchase successful! You can now apply the skin.');
  };

  const applySkin = (skinId: string) => {
    setActiveSkin(skinId);
    localStorage.setItem('backgammon_active_skin', skinId);
  };

  const activeSkinPath = skinsList.find(s => s.id === activeSkin)?.path || '/backgammon_board.jpg';

  // Timeouts safety refs to prevent concurrent rolling loops
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const turnRef = useRef(turn);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  const clearGameTimeouts = () => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
  };

  // Chat feed logs
  const [logs, setLogs] = useState<{ id: string; text: string; time: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, text, time }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const opponentColor = playerColor === 'white' ? 'red' : 'white';
  
  const checkSixPrime = (b: BoardState, col: 'white' | 'red') => {
    let currentConsecutive = 0;
    for (let i = 0; i < 24; i++) {
      if (b[i] && b[i].length > 0 && b[i][b[i].length - 1].color === col) {
        currentConsecutive++;
        if (currentConsecutive >= 6) return true;
      } else {
        currentConsecutive = 0;
      }
    }
    return false;
  };

  const isPlayerTrapped = phase === 'playing' && checkSixPrime(board, opponentColor);
  const isBotTrapped = phase === 'playing' && checkSixPrime(board, playerColor);

  // Stacking Backgammon Initial Board Setup
  const initializeBoard = () => {
    const newBoard: BoardState = Array.from({ length: 24 }, () => []);
    
    // 15 checkers for Player on point 0 (Top-Left)
    newBoard[0] = Array(15).fill({ color: playerColor });
    // 15 checkers for Opponent on point 23 (Bottom-Left)
    newBoard[23] = Array(15).fill({ color: playerColor === 'white' ? 'red' : 'white' });

    clearGameTimeouts();

    setBoard(newBoard);
    setBar({ white: 0, red: 0 });
    setOff({ white: 0, red: 0 });
    setPhase('playing');
    setHasRolled(false);
    setIsRolling(false);
    setShowDiceVisual(true);
    setStartRollResult(null);
    setDismissStartRoll(true);
    setSelectedPoint(null);
    setSelectedBar(false);
    setLogs([]);
    const sideText = playerColor === 'white' ? (lang === 'ar' ? 'الأبيض' : 'White') : (lang === 'ar' ? 'الأسود' : 'Black');
    addLog(lang === 'ar' ? `بدأت لعبة الطاولة الكلاسيكية 🎲! تلعب باللون [${sideText}].` : `Backgammon started 🎲! You play as [${sideText}].`);
  };

  const handleBuyIn = () => {
    window.parent.postMessage({ type: 'BUY_IN', amount: 50 }, '*');
    setMatchScore({ white: 0, red: 0 });
    initializeBoard();
  };

  // Bot continuous turn handler
  useEffect(() => {
    const botRole = playerColor === 'white' ? 'red' : 'white';
    if (phase === 'playing' && turn === botRole && movesLeft.length > 0 && hasRolled && !isRolling) {
      const timer = setTimeout(() => {
        handleBotMove(movesLeft);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, turn, movesLeft, hasRolled, isRolling, board, bar, playerColor]);

  const handleBotMove = (currentRolls: number[]) => {
    const botRole = playerColor === 'white' ? 'red' : 'white';
    const pBar = botRole === 'white' ? bar.white : bar.red;
    
    let madeMove = false;
    
    if (pBar > 0) {
      const moves = getValidMoves('bar', botRole);
      if (moves.length > 0) {
        // Prefer moves that hit an opponent
        moves.sort((a, b) => {
          const aHit = typeof a.toIdx === 'number' && board[a.toIdx]?.length === 1 && board[a.toIdx][0].color !== botRole ? 1 : 0;
          const bHit = typeof b.toIdx === 'number' && board[b.toIdx]?.length === 1 && board[b.toIdx][0].color !== botRole ? 1 : 0;
          return bHit - aHit;
        });
        const move = moves[0];
        executeMove('bar', move.toIdx, move.diceUsed);
        madeMove = true;
      }
    } else {
      // Find a valid move from the board
      const searchOrder = botRole === 'white' ? 
        Array.from({ length: 24 }, (_, i) => i) : 
        Array.from({ length: 24 }, (_, i) => 23 - i);

      const allPossibleMoves: { fromIdx: number, toIdx: number | 'off', diceUsed: number[] }[] = [];

      for (const i of searchOrder) {
        if (board[i] && board[i].length > 0 && board[i][board[i].length - 1].color === botRole) {
          const moves = getValidMoves(i, botRole);
          moves.forEach(m => {
            allPossibleMoves.push({ fromIdx: i, toIdx: m.toIdx, diceUsed: m.diceUsed });
          });
        }
      }

      if (allPossibleMoves.length > 0) {
        if (botDifficulty === 'easy') {
          // Easy: Random move
          allPossibleMoves.sort(() => Math.random() - 0.5);
        } else {
          // Medium & Hard: Sort moves strategically by evaluating the resulting board
          allPossibleMoves.sort((a, b) => {
            if (a.toIdx === 'off' && b.toIdx !== 'off') return -1;
            if (b.toIdx === 'off' && a.toIdx !== 'off') return 1;

            const evaluateMove = (move: { fromIdx: number, toIdx: number | 'off' }) => {
               const bState = board.map(s => [...s]);
               const f = move.fromIdx;
               const t = move.toIdx;
               
               bState[f].pop();
               if (t !== 'off') {
                 bState[t as number].push({ color: botRole });
               }

               let score = 0;
               const tIdx = t as number;

               if (t !== 'off') {
                 // 1. Trapping opponent (Mahbousa)
                 if (bState[tIdx].length === 2 && bState[tIdx][0].color !== botRole) {
                    score += 500; // huge bonus for trapping
                 }
                 // 2. Sadda / Building blocks
                 if (bState[tIdx].length >= 2 && bState[tIdx][bState[tIdx].length-1].color === botRole) {
                    score += 20; 
                 }
               }

               let primeCount = 0;
               let maxPrime = 0;
               for(let i=0; i<24; i++) {
                  if (bState[i].length > 0 && bState[i][bState[i].length-1].color === botRole) {
                     // Give bonus for controlling points close to opponent's home (which is bot's start)
                     if (botRole === 'white' && i < 12) score += (12 - i) * 2;
                     if (botRole === 'red' && i > 11) score += (i - 11) * 2;
                     
                     primeCount++;
                     maxPrime = Math.max(maxPrime, primeCount);
                  } else {
                     primeCount = 0;
                  }
               }
               // Prime bonuses (الاستحواذ على 6 خانات متصلة)
               if (maxPrime === 2) score += 30;
               if (maxPrime === 3) score += 70;
               if (maxPrime === 4) score += 150;
               if (maxPrime >= 5) score += 300;
               
               // 3. Spread (سرعة الانتشار)
               const occupiedPoints = bState.filter(s => s.length > 0 && s[s.length-1].color === botRole).length;
               score += occupiedPoints * 15;
               
               // 4. Advancing checkers
               if (t !== 'off' && botDifficulty === 'hard') {
                  const adv = botRole === 'white' ? tIdx : 23 - tIdx;
                  score += adv * 3;
                  
                  // Prioritize moving from the start point to spread quickly
                  if (botRole === 'white' && f === 0) score += 50;
                  if (botRole === 'red' && f === 23) score += 50;
               }
               
               return score;
            };

            const scoreA = evaluateMove(a);
            const scoreB = evaluateMove(b);
            return scoreB - scoreA;
          });
        }
        
        const move = allPossibleMoves[0];
        executeMove(move.fromIdx, move.toIdx, move.diceUsed);
        madeMove = true;
      }
    }
    
    if (!madeMove) {
      // Small delay before passing turn if completely stuck
      setTimeout(() => endTurn(playerColor), 600);
    }
  };

  const rollDiceForTurn = (playerColorRole: 'white' | 'red') => {
    let d1 = Math.floor(Math.random() * 6) + 1;
    let d2 = Math.floor(Math.random() * 6) + 1;
    setOriginalRoll([d1, d2]);
    setDice([d1, d2]);

    let rolls = [d1, d2];
    if (d1 === d2) {
      // Doubles get 4 moves
      rolls = [d1, d1, d1, d1];
    }
    setMovesLeft(rolls);
    setSelectedPoint(null);
    setSelectedBar(false);

    const isBot = playerColorRole !== playerColor;
    const playerName = !isBot ? (lang === 'ar' ? 'أنت' : 'You') : (lang === 'ar' ? 'عزت' : 'Ezzo');
    addLog(lang === 'ar' 
      ? `🎲 ${playerName} رمى النرد: [${d1} | ${d2}] ${d1 === d2 ? 'شيش دبل!' : ''}` 
      : `🎲 ${playerName} rolled: [${d1} | ${d2}] ${d1 === d2 ? 'Double!' : ''}`);

    // Show big dice visual in center permanently in sandbox mode
    setShowDiceVisual(true);

    const botRole = playerColor === 'white' ? 'red' : 'white';
    
    // Validate if the player has any moves with this roll
    const hasMoves = hasAnyValidMoves(board, bar, rolls, playerColorRole, off);
    
    if (!hasMoves) {
      setTimeout(() => {
        synth.playError();
        addLog(lang === 'ar' ? `❌ لا يوجد حركات متاحة لـ ${playerName}. ينتقل الدور.` : `❌ No valid moves for ${playerName}. Turn passes.`);
        endTurn(playerColorRole === 'white' ? 'red' : 'white');
      }, 1000);
    }
    // If it has moves and it's the bot, bot logic is handled by the useEffect bot continuous turn handler
  };

  const triggerManualRoll = () => {
    if (turn !== playerColor || hasRolled || isRolling) return;
    setIsRolling(true);
    synth.playDice();
    setTimeout(() => {
      setIsRolling(false);
      setHasRolled(true);
      rollDiceForTurn(playerColor);
    }, 1200);
  };

  const startNextRound = () => {
    initializeBoard();
  };

  const triggerStartRoll = () => {
    setIsRolling(true);
    synth.playDice();
    setTimeout(() => {
      setIsRolling(false);
      const w = Math.floor(Math.random() * 6) + 1;
      const r = Math.floor(Math.random() * 6) + 1;
      if (w === r) {
        addLog(lang === 'ar' ? `🎲 تعادل في نرد البداية [${w} | ${r}]. أعد المحاولة!` : `🎲 Tie in start roll [${w} | ${r}]. Roll again!`);
        setStartRollResult(null);
        return;
      }
      const winner = w > r ? 'white' : 'red';
      setStartRollResult({ white: w, red: r });
      setTurn(winner);
      const winnerText = winner === playerColor ? (lang === 'ar' ? 'أنت' : 'You') : (lang === 'ar' ? 'عزت' : 'Ezzo');
      addLog(lang === 'ar' 
        ? `🎲 نرد البداية: الأبيض [${w}] - الأسود [${r}]. البداية لـ ${w > r ? 'الأبيض' : 'الأسود'} (${winnerText})`
        : `🎲 Start Roll: White [${w}] - Black [${r}]. ${w > r ? 'White' : 'Black'} starts (${winnerText})`);
      
      const botRole = playerColor === 'white' ? 'red' : 'white';
      if (winner === botRole) {
        setTimeout(() => {
          setIsRolling(true);
          synth.playDice();
          setTimeout(() => {
            setIsRolling(false);
            setHasRolled(true);
            rollDiceForTurn(botRole);
          }, 1200);
        }, 1200);
      }
    }, 1200);
  };

  // Check if player has all checkers in their home board
  const isHomeBoardReady = (color: 'white' | 'red', b = board, currentBar = bar) => {
    if (color === playerColor) {
      if (currentBar[playerColor] > 0) return false;
      for (let i = 0; i < 18; i++) {
        if (b[i]?.some((c) => c.color === playerColor)) return false;
      }
    } else {
      const oppColor = playerColor === 'white' ? 'red' : 'white';
      if (currentBar[oppColor] > 0) return false;
      for (let i = 6; i < 24; i++) {
        if (b[i]?.some((c) => c.color === oppColor)) return false;
      }
    }
    return true;
  };

  // Helper to check if a point can be landed on by a color
  const canLandOn = (pointIdx: number, color: 'white' | 'red', b = board) => {
    if (pointIdx < 0 || pointIdx > 23) return false;
    const targetStack = b[pointIdx];
    if (targetStack.length === 0) return true;
    
    // Mahbousa rule: whoever is on TOP of the stack controls it
    if (targetStack[targetStack.length - 1].color === color) return true; 
    
    if (gameMode === '31') return false; // Any opponent checker blocks
    
    // Mahbousa: can land on exactly 1 opponent checker to trap it
    if (targetStack.length === 1) return true; 
    return false;
  };

  // Get all valid moves for a selected checker (including combined dice moves)
  const getValidMoves = (fromIdx: number | 'bar', color: 'white' | 'red', b = board, currentBar = bar, currentMoves = movesLeft, currentOff = off) => {
    const list: { toIdx: number | 'off'; diceUsed: number[] }[] = [];
    if (currentMoves.length === 0) return list;

    // Leader checker entering quadrant rule for 31 mode
    if (gameMode === '31') {
      if (color === playerColor) {
        const hasLeaderEntered = b.slice(18, 24).some((pts) => pts.some((c) => c.color === playerColor)) || currentOff[playerColor] > 0;
        if (!hasLeaderEntered) {
          let maxIdx = 0;
          for (let i = 23; i >= 0; i--) {
            if (b[i]?.some((c) => c.color === playerColor)) { maxIdx = i; break; }
          }
          if (fromIdx !== maxIdx) return list;
        }
      } else {
        const oppColor = playerColor === 'white' ? 'red' : 'white';
        const hasLeaderEnteredOpp = b.slice(0, 6).some((pts) => pts.some((c) => c.color === oppColor)) || currentOff[oppColor] > 0;
        if (!hasLeaderEnteredOpp) {
          let minIdx = 23;
          for (let i = 0; i < 24; i++) {
            if (b[i]?.some((c) => c.color === oppColor)) { minIdx = i; break; }
          }
          if (fromIdx !== minIdx) return list;
        }
      }
    }

    if (color === 'white' && currentBar.white > 0 && fromIdx !== 'bar') return list;
    if (color === 'red' && currentBar.red > 0 && fromIdx !== 'bar') return list;

    const isHome = isHomeBoardReady(color, b, currentBar);
    const direction = color === playerColor ? 1 : -1;

    // DFS to find all combinations of dice usage
    const explore = (currentIdx: number | 'bar', availableDice: number[], pathUsed: number[]) => {
      const uniqueDice = Array.from(new Set(availableDice));
      uniqueDice.forEach((d) => {
        let toIdx: number | 'off';
        let isOff = false;

        if (currentIdx === 'bar') {
          toIdx = color === playerColor ? d - 1 : 24 - d;
        } else {
          const nextPos = currentIdx + d * direction;
          if (color === playerColor && nextPos > 23) {
            if (isHome) {
              const isExact = nextPos === 24;
              const hasLowerCheckers = b.slice(18, currentIdx).some((pts) => pts.some((c) => c.color === playerColor));
              if (isExact || (nextPos > 24 && !hasLowerCheckers)) isOff = true;
            }
          } else if (color !== playerColor && nextPos < 0) {
            if (isHome) {
              const isExact = nextPos === -1;
              const hasLowerCheckers = b.slice(currentIdx + 1, 6).some((pts) => pts.some((c) => c.color === color));
              if (isExact || (nextPos < -1 && !hasLowerCheckers)) isOff = true;
            }
          }
          toIdx = isOff ? 'off' : nextPos;
        }

        if (toIdx === 'off' || canLandOn(toIdx as number, color, b)) {
          const newPath = [...pathUsed, d];
          // Check if this exact destination with these EXACT dice is already recorded
          if (!list.some(m => m.toIdx === toIdx && m.diceUsed.sort().join() === newPath.sort().join())) {
            list.push({ toIdx, diceUsed: newPath });
          }
          // If we landed safely and not off, we can continue exploring from here
          if (toIdx !== 'off') {
            const nextAvailable = [...availableDice];
            nextAvailable.splice(nextAvailable.indexOf(d), 1);
            if (nextAvailable.length > 0) {
              explore(toIdx, nextAvailable, newPath);
            }
          }
        }
      });
    };

    explore(fromIdx, currentMoves, []);
    
    // Sort so shorter paths are preferred if same destination
    list.sort((a, b) => a.diceUsed.length - b.diceUsed.length);
    // Deduplicate destinations to only keep the shortest path version
    const deduped: { toIdx: number | 'off'; diceUsed: number[] }[] = [];
    list.forEach(m => {
      if (!deduped.some(d => d.toIdx === m.toIdx)) deduped.push(m);
    });

    return deduped;
  };

  // Perform a move
  const executeMove = (from: number | 'bar', to: number | 'off', diceUsed: number[]) => {
    let nextBoard = [...board];
    let nextBar = { ...bar };
    let nextOff = { ...off };

    // Remove checker from source
    if (from === 'bar') {
      if (turn === 'white') nextBar.white--;
      else nextBar.red--;
    } else {
      const currentStack = [...nextBoard[from]];
      currentStack.pop();
      nextBoard[from] = currentStack;
    }

    // Place checker on destination
    if (to === 'off') {
      if (turn === 'white') nextOff.white++;
      else nextOff.red++;
      synth.playMove();
      addLog(lang === 'ar' ? `📥 تم تجميع حجر خارج اللوحة.` : `📥 Beared off checker.`);
    } else {
      const targetStack = [...nextBoard[to]];
      if (targetStack.length === 1 && targetStack[0].color !== turn) {
        // MAHBOUSA (TRAP)
        synth.playHit();
        addLog(lang === 'ar' ? `🔒 تم حبس حجر الخصم!` : `🔒 Trapped opponent checker!`);
        nextBoard[to] = [...targetStack, { color: turn }];
      } else {
        // Normal land
        synth.playMove();
        nextBoard[to] = [...targetStack, { color: turn }];
      }
    }

    setBoard(nextBoard);
    setBar(nextBar);
    setOff(nextOff);

    // Consume dice
    let nextMoves = [...movesLeft];
    diceUsed.forEach(d => {
      const index = nextMoves.indexOf(d);
      if (index > -1) {
        nextMoves.splice(index, 1);
      }
    });
    setMovesLeft(nextMoves);
    setSelectedPoint(null);
    setSelectedBar(false);

    // Check 6-point block (Sadda / Prime) victory in 31 mode
    if (gameMode === '31') {
      const oppColor = playerColor === 'white' ? 'red' : 'white';
      
      const playerControlsAll6 = [18, 19, 20, 21, 22, 23].every(
        (i) => nextBoard[i]?.some((c) => c.color === playerColor)
      );
      const oppHasCheckersPastBlock = Array.from({ length: 18 }, (_, i) => i).some(
        (i) => nextBoard[i]?.some((c) => c.color === oppColor)
      );
      const oppTrappedCount = nextBoard.reduce((acc, stack) => acc + stack.filter((c) => c.color === oppColor).length, 0);

      if (playerControlsAll6 && !oppHasCheckersPastBlock && oppTrappedCount > 10) {
        handleGameOver('win', 15);
        return;
      }

      const oppControlsAll6 = [0, 1, 2, 3, 4, 5].every(
        (i) => nextBoard[i]?.some((c) => c.color === oppColor)
      );
      const playerHasCheckersPastBlock = Array.from({ length: 18 }, (_, i) => i + 6).some(
        (i) => nextBoard[i]?.some((c) => c.color === playerColor)
      );
      const playerTrappedCount = nextBoard.reduce((acc, stack) => acc + stack.filter((c) => c.color === playerColor).length, 0);
      
      if (oppControlsAll6 && !playerHasCheckersPastBlock && playerTrappedCount > 10) {
        handleGameOver('loss', 15);
        return;
      }
    }

    // Check Win
    if (nextOff.white === 15) {
      handleGameOver('win');
      return;
    }
    if (nextOff.red === 15) {
      handleGameOver('loss');
      return;
    }

    // Check if turn ends
    if (nextMoves.length === 0 || !hasAnyValidMoves(nextBoard, nextBar, nextMoves, turn, nextOff)) {
      endTurn(turn === 'white' ? 'red' : 'white');
    }
  };

  // Check if player has ANY playable moves with current dice
  const hasAnyValidMoves = (b: BoardState, rBar: { white: number; red: number }, rolls: number[], color: 'white' | 'red', currentOff: { white: number; red: number }) => {
    if (rolls.length === 0) return false;
    
    if (color === 'white' && rBar.white > 0) {
      return getValidMoves('bar', 'white', b, rBar, rolls, currentOff).length > 0;
    }
    if (color === 'red' && rBar.red > 0) {
      return getValidMoves('bar', 'red', b, rBar, rolls, currentOff).length > 0;
    }

    // Check every point
    for (let i = 0; i < 24; i++) {
      if (b[i] && b[i].length > 0 && b[i][b[i].length - 1].color === color) {
        if (getValidMoves(i, color, b, rBar, rolls, currentOff).length > 0) return true;
      }
    }
    return false;
  };

  const endTurn = (nextPlayer: 'white' | 'red') => {
    clearGameTimeouts();
    setTurn(nextPlayer);
    setMovesLeft([]);
    setHasRolled(false);
    setIsRolling(false);

    const botRole = playerColor === 'white' ? 'red' : 'white';
    if (nextPlayer === botRole) {
      // Bot rolls automatically after a short delay
      botTimeoutRef.current = setTimeout(() => {
        setIsRolling(true);
        synth.playDice();
        rollTimeoutRef.current = setTimeout(() => {
          setIsRolling(false);
          setHasRolled(true);
          rollDiceForTurn(botRole);
        }, 1200);
      }, 800);
    }
  };

  const handlePointClick = (pointIdx: number) => {
    if (phase !== 'playing') return;
    
    // Strict Game Rules Mode
    if (turn !== playerColor || !hasRolled || isRolling) return;
    
    if (selectedPoint === null && !selectedBar) {
      // Select source
      const stack = board[pointIdx];
      if (stack && stack.length > 0 && stack[stack.length - 1].color === playerColor) {
        const moves = getValidMoves(pointIdx, playerColor);
        if (moves.length > 0) {
          setSelectedPoint(pointIdx);
        } else {
          synth.playError();
        }
      }
    } else {
      // Move checker
      const from = selectedBar ? 'bar' : selectedPoint!;
      
      const moves = getValidMoves(from, playerColor);
      const matchedMove = moves.find(m => m.toIdx === pointIdx);
      
      if (matchedMove) {
        executeMove(from, pointIdx, matchedMove.diceUsed);
      } else {
        // Deselect or try selecting another of own color
        const stack = board[pointIdx];
        if (stack && stack.length > 0 && stack[stack.length - 1].color === playerColor) {
           const newMoves = getValidMoves(pointIdx, playerColor);
           if (newMoves.length > 0) {
             setSelectedPoint(pointIdx);
           } else {
             synth.playError();
             setSelectedPoint(null);
           }
        } else {
           setSelectedPoint(null);
        }
      }
      setSelectedBar(false);
    }
  };

  const handleBarClick = () => {
    const pBar = playerColor === 'white' ? bar.white : bar.red;
    if (phase !== 'playing' || turn !== playerColor || pBar === 0) return;
    setSelectedBar(true);
    setSelectedPoint(null);
  };

  const handleBearOffClick = () => {
    if (phase !== 'playing' || turn !== playerColor || selectedPoint === null) return;
    const moves = getValidMoves(selectedPoint, playerColor);
    const matched = moves.find((m) => m.toIdx === 'off');

    if (matched) {
      executeMove(selectedPoint, 'off', matched.diceUsed);
    }
  };



  const handleGameOver = (outcome: 'win' | 'loss', customPoints?: number) => {
    let pointsGained = 0;
    
    const winnerColor = outcome === 'win' ? playerColor : (playerColor === 'white' ? 'red' : 'white');
    const loserColor = winnerColor === 'white' ? 'red' : 'white';
    
    if (customPoints) {
      pointsGained = customPoints;
    } else {
      const loserOff = off[loserColor];
      if (loserOff >= 1) {
        pointsGained = 1;
      } else {
        const loserStartPoint = loserColor === 'white' ? 0 : 23;
        const loserHasCheckerOnStart = board[loserStartPoint]?.some(c => c.color === loserColor);
        if (loserHasCheckerOnStart) {
          pointsGained = 3;
        } else {
          pointsGained = 2;
        }
      }
    }

    const nextScore = { ...matchScore };
    if (outcome === 'win') {
      nextScore.white += pointsGained;
      setMatchScore(nextScore);
      
      let winType = 'فوز عادي';
      if (pointsGained === 2) winType = 'مارس';
      if (pointsGained === 3) winType = 'محبوسة';
      if (lang !== 'ar') {
        winType = pointsGained === 3 ? 'Mahbousa' : pointsGained === 2 ? 'Mars' : 'Normal Win';
      }

      addLog(lang === 'ar' ? `🏆 فزت بالجولة (${winType})! كسبت +${pointsGained} نقطة. المجموع: ${nextScore.white} / 7` : `🏆 Won round (${winType})! Gained +${pointsGained} pts. Total: ${nextScore.white} / 7`);
      
      if (nextScore.white >= 7) {
        setPhase('gameover');
        window.parent.postMessage({ type: 'GAME_OVER', outcome: 'win', reward: 150 }, '*');
      } else {
        setPhase('roundover');
      }
    } else {
      nextScore.red += pointsGained;
      setMatchScore(nextScore);
      
      let winType = 'فوز عادي';
      if (pointsGained === 2) winType = 'مارس';
      if (pointsGained === 3) winType = 'محبوسة';
      if (lang !== 'ar') {
        winType = pointsGained === 3 ? 'Mahbousa' : pointsGained === 2 ? 'Mars' : 'Normal Win';
      }

      addLog(lang === 'ar' ? `💥 خسرت الجولة (${winType})! الخصم كسب +${pointsGained} نقطة. المجموع: ${nextScore.red} / 7` : `💥 Lost round (${winType})! Opponent gained +${pointsGained} pts. Total: ${nextScore.red} / 7`);
      
      if (nextScore.red >= 7) {
        setPhase('gameover');
        window.parent.postMessage({ type: 'GAME_OVER', outcome: 'loss', penalty: 50 }, '*');
      } else {
        setPhase('roundover');
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-amber-100 flex flex-col font-sans select-none overflow-hidden relative">
      
      {/* Blurred Game Card Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center -z-20 scale-105"
        style={{
          backgroundImage: "url('/backgammon_card.jpg')",
          filter: 'brightness(0.35) saturate(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 -z-10" />

      <header className="p-4 border-b border-amber-900/30 bg-slate-950/40 flex justify-between items-center z-10">
        <div>
          <h2 className="text-sm font-black text-amber-400 tracking-wider">
            🎲 {lang === 'ar' ? 'لعبة الطاولة الشرقية الكلاسيكية' : 'Classic Backgammon Table'}
          </h2>
          <p className="text-[10px] text-amber-600/70">
            {lang === 'ar' ? 'لاعب ضد البوت عزت - بطولة الطاولة 150 عملة ذهبية' : 'Player vs Ezzo Bot - 150 Gold Coins Table'}
          </p>
        </div>

        {phase === 'playing' && (
          <div className="flex gap-4 items-center bg-slate-950/60 px-4 py-1.5 rounded-xl border border-amber-900/30">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">{lang === 'ar' ? 'فورة الجيم' : 'Game Target'}</span>
            <div className="text-xl font-black bg-gradient-to-br from-amber-400 to-amber-600 text-transparent bg-clip-text">
              7 <span className="text-xs text-amber-500/50">pts</span>
            </div>
          </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${
              turn === playerColor ? 'text-amber-400 animate-pulse' : 'text-slate-400'
            }`}>
              {turn === playerColor
                ? (lang === 'ar' ? `دورك (${playerColor === 'white' ? 'أبيض' : 'أسود'})` : `Your Turn (${playerColor === 'white' ? 'White' : 'Black'})`)
                : (lang === 'ar' ? `دور عزت (${playerColor === 'white' ? 'أسود' : 'أبيض'})` : `Ezzo's Turn (${playerColor === 'white' ? 'Black' : 'White'})`)}
            </span>
            <span className="text-[10px] text-amber-500/70 border-l border-amber-900/30 pl-4 flex items-center gap-2">
              <span>{lang === 'ar' 
                ? `النقاط: الأبيض [${matchScore.white}] - الأسود [${matchScore.red}] (الهدف: 31)` 
                : `Score: White [${matchScore.white}] - Black [${matchScore.red}] (Target: 31)`}</span>
              {hasRolled && (
                <span className="bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-bold ml-2">
                  🎲 {dice[0]} - {dice[1]}
                </span>
              )}
            </span>
          </div>
        )}
      </header>

      {phase === 'init' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-md mx-auto my-auto z-10 p-6 bg-slate-950/30 rounded-3xl border border-amber-900/10">
          <h3 className="text-base font-bold text-amber-400 text-center uppercase tracking-wider">
            {lang === 'ar' ? 'صالة طاولة الشيش والنرد البلدية' : 'Backgammon Sheesh Room'}
          </h3>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            {lang === 'ar' ? 'تحدى البوت عزت في جولة طاولة تقليدية حاسمة برهان 50 عملة ذهبية!' : 'Challenge Ezzo Bot in a classic backgammon match with 50 gold coins buy-in!'}
          </p>

          <div className="w-full space-y-2">
            <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest block text-center">
              {lang === 'ar' ? 'اختر نظام اللعب:' : 'Select Game System:'}
            </label>
            <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-1.5 rounded-2xl border border-amber-900/10">
              <button
                onClick={() => setGameMode('31')}
                className={`py-2 px-3 rounded-xl text-[10.5px] font-black transition-all cursor-pointer border ${
                  gameMode === '31'
                    ? 'bg-amber-600 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/10'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? '🎲 لعبة 31' : '🎲 Game 31'}
              </button>
              <button
                onClick={() => setGameMode('mahbousa')}
                className={`py-2 px-3 rounded-xl text-[10.5px] font-black transition-all cursor-pointer border ${
                  gameMode === 'mahbousa'
                    ? 'bg-amber-600 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/10'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? '🔒 المحبوسة' : '🔒 Mahbousa'}
              </button>
            </div>
          </div>

          <div className="w-full space-y-2">
            <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest block text-center">
              {lang === 'ar' ? 'اختر لونك المفضّل:' : 'Choose your Color:'}
            </label>
            <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-1.5 rounded-2xl border border-amber-900/10">
              <button
                onClick={() => setPlayerColor('white')}
                className={`py-2 px-3 rounded-xl text-[10.5px] font-black transition-all cursor-pointer border ${
                  playerColor === 'white'
                    ? 'bg-amber-600 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/10'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? '⚪ الأبيض' : '⚪ White'}
              </button>
              <button
                onClick={() => setPlayerColor('red')}
                className={`py-2 px-3 rounded-xl text-[10.5px] font-black transition-all cursor-pointer border ${
                  playerColor === 'red'
                    ? 'bg-amber-600 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/10'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? '⚫ الأسود' : '⚫ Black'}
              </button>
            </div>
          </div>

          <div className="w-full space-y-2">
            <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest block text-center">
              {lang === 'ar' ? 'مستوى البوت عزت:' : 'Ezzo Bot Difficulty:'}
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-amber-900/10">
              <button
                onClick={() => setBotDifficulty('easy')}
                className={`py-2 px-2 rounded-xl text-[9px] font-black transition-all cursor-pointer border ${
                  botDifficulty === 'easy'
                    ? 'bg-amber-600 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/10'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? '🟢 سهل' : '🟢 Easy'}
              </button>
              <button
                onClick={() => setBotDifficulty('medium')}
                className={`py-2 px-2 rounded-xl text-[9px] font-black transition-all cursor-pointer border ${
                  botDifficulty === 'medium'
                    ? 'bg-amber-600 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/10'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? '🟡 متوسط' : '🟡 Medium'}
              </button>
              <button
                onClick={() => setBotDifficulty('hard')}
                className={`py-2 px-2 rounded-xl text-[9px] font-black transition-all cursor-pointer border ${
                  botDifficulty === 'hard'
                    ? 'bg-red-600 border-red-500 text-slate-950 font-black shadow-lg shadow-red-900/10'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? '🔴 صعب' : '🔴 Hard'}
              </button>
            </div>
          </div>

          <div className="w-full space-y-2 border-t border-amber-900/20 pt-4">
            <label className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest block text-center">
              {lang === 'ar' ? '🎨 متجر مظاهر الطاولة الأسطورية (اضغط للمعاينة):' : '🎨 Board Skins Shop (Click to Preview):'}
            </label>
            
            <div className="grid grid-cols-4 gap-2">
              {skinsList.map((s) => {
                const isUnlocked = unlockedSkins.includes(s.id);
                const isActive = activeSkin === s.id;
                
                return (
                  <div 
                    key={s.id}
                    onClick={() => applySkin(s.id)}
                    className={`relative rounded-xl border p-1 bg-slate-950/80 flex flex-col justify-between items-center transition-all cursor-pointer hover:border-amber-500/40 ${
                      isActive ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-amber-900/20'
                    }`}
                  >
                    {/* Mini board image preview */}
                    <div 
                      className="w-full h-10 rounded-lg bg-cover bg-center shadow-inner"
                      style={{ backgroundImage: `url(${s.path})` }}
                    />
                    
                    <span className="text-[7.5px] font-extrabold text-amber-100/90 text-center truncate w-full mt-1">
                      {lang === 'ar' ? s.nameAr.split(' ').slice(-2).join(' ') : s.nameEn.split(' ').slice(-2).join(' ')}
                    </span>

                    {/* Action button */}
                    {isUnlocked ? (
                      <span className={`text-[7px] font-black uppercase mt-1 px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-500'
                      }`}>
                        {isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'تطبيق' : 'Apply')}
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          buySkin(s.id, s.price);
                        }}
                        className="w-full mt-1 py-0.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-slate-950 font-black rounded text-[7.5px] border border-amber-400 active:scale-95 transition-all cursor-pointer"
                      >
                        🪙 {s.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleBuyIn}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border border-amber-400"
          >
            {lang === 'ar' ? `🪙 دفع 50 والبدء بنظام [${gameMode === '31' ? 'لعبة 31' : 'المحبوسة'}]` : `🪙 Pay 50 & Start [${gameMode === '31' ? 'Game 31' : 'Mahbousa'}]`}
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden relative">
          
          {/* Main Wooden Board Grid */}
          <div
            className="flex-1 w-full max-w-[900px] aspect-[4/3] mx-auto border-8 border-[#3d1e12] rounded-3xl flex flex-col justify-between shadow-2xl relative select-none"
            style={{
              backgroundImage: `url(${activeSkinPath})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            
            {/* Contextual Bear Off Button */}
            {selectedPoint !== null && getValidMoves(selectedPoint, 'white').some((m) => m.toIdx === 'off') && (
              <button
                onClick={handleBearOffClick}
                className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-45 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px] active:scale-95 transition-all cursor-pointer border border-emerald-400 shadow-2xl flex items-center gap-1.5 animate-pulse"
              >
                <span>📤</span>
                <span>{lang === 'ar' ? 'إخراج القشاط' : 'Bear Off Checker'}</span>
              </button>
            )}

            {/* Roll Dice Button */}
            {turn === playerColor && !hasRolled && !isRolling && phase === 'playing' && (
              <button
                onClick={triggerManualRoll}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-lg shadow-2xl animate-bounce border-2 border-amber-400 cursor-pointer"
              >
                🎲 {lang === 'ar' ? 'ارمِ النرد' : 'Roll Dice'}
              </button>
            )}
            
            {/* Rolling Animation Indicator */}
            {isRolling && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 bg-slate-900/80 text-amber-400 font-black rounded-xl text-lg shadow-2xl border-2 border-amber-900/50 flex items-center gap-2">
                <span className="animate-spin inline-block">🎲</span>
                <span>{lang === 'ar' ? 'جاري الرمي...' : 'Rolling...'}</span>
              </div>
            )}

            {/* Remaining playable moves UI removed per user request */}

            {/* Center Bar divider */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-black/40 backdrop-blur-sm shadow-inner flex flex-col justify-between py-8 items-center z-10">
              
              {/* Opponent checker bar (Top) */}
              <button
                disabled={true}
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${playerColor === 'white' ? 'from-neutral-700 via-neutral-900 to-black' : 'from-amber-50 via-slate-100 to-slate-300'} shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border ${playerColor === 'white' ? 'border-neutral-850' : 'border-slate-400'} flex items-center justify-center font-bold ${playerColor === 'white' ? 'text-white' : 'text-slate-900'} text-xs transition-all relative`}
              >
                {playerColor === 'white' ? '⚫' : '⚪'}
                {(playerColor === 'white' ? bar.red : bar.white) > 0 && <span className={`absolute -top-1 -right-1 ${playerColor === 'white' ? 'bg-amber-500 text-slate-950' : 'bg-indigo-600 text-white'} text-[8px] rounded-full w-4 h-4 flex items-center justify-center`}>{playerColor === 'white' ? bar.red : bar.white}</span>}
              </button>

              <span className="text-[9px] font-bold text-amber-700 tracking-widest uppercase vertical-text">
                {lang === 'ar' ? 'الحجز' : 'BAR'}
              </span>

              {/* Player checker bar (Bottom) */}
              <button
                onClick={handleBarClick}
                disabled={(playerColor === 'white' ? bar.white : bar.red) === 0 || turn !== playerColor}
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${playerColor === 'white' ? 'from-amber-50 via-slate-100 to-slate-300' : 'from-neutral-700 via-neutral-900 to-black'} shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border ${playerColor === 'white' ? 'border-slate-400' : 'border-neutral-850'} flex items-center justify-center font-bold ${playerColor === 'white' ? 'text-slate-900' : 'text-white'} text-xs transition-all relative ${
                  selectedBar ? 'ring-2 ring-amber-500 animate-pulse' : ''
                }`}
              >
                {playerColor === 'white' ? '⚪' : '⚫'}
                {(playerColor === 'white' ? bar.white : bar.red) > 0 && <span className={`absolute -top-1 -right-1 ${playerColor === 'white' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-slate-950'} text-[8px] rounded-full w-4 h-4 flex items-center justify-center`}>{playerColor === 'white' ? bar.white : bar.red}</span>}
              </button>
            </div>

          {/* Main Wooden Board Grid - NEON STYLE */}
          <div className="flex-1 w-full max-w-[900px] aspect-[4/3] mx-auto rounded-3xl flex shadow-[0_0_50px_rgba(0,0,0,0.8)] relative select-none bg-neutral-900 border-[12px] md:border-[16px] border-[#3c2a1a] ring-4 ring-[#2a1d12]">

            {/* Opponent Profile Card (Top Left - completely outside the board) */}
            <div className="hidden md:flex absolute top-4 right-full mr-12 min-w-[110px] p-3 bg-[#1a0c04]/90 backdrop-blur-sm rounded-2xl border-2 border-amber-900/50 shadow-2xl z-20 flex-col items-center justify-center gap-2">
              <div className={`w-14 h-14 rounded-xl border-2 border-amber-500 overflow-hidden flex items-center justify-center text-3xl shadow-inner ${playerColor === 'white' ? 'bg-neutral-800' : 'bg-slate-200'}`}>
                🤖
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-white font-bold text-xs leading-tight whitespace-nowrap">Ezzo (Bot)</span>
                <span className={`text-[9px] font-mono uppercase tracking-widest mt-1 whitespace-nowrap ${playerColor === 'white' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {playerColor === 'white' ? '⚫ BLACK' : '⚪ WHITE'}
                </span>
              </div>
              {isBotTrapped && (
                <div className="mt-1 w-full px-2 py-1 bg-red-900/50 text-red-400 font-bold rounded-lg text-[9px] border border-red-500/50 text-center animate-pulse">
                  {lang === 'ar' ? 'عزت مسجون 🏳️' : 'Ezzo Trapped 🏳️'}
                </div>
              )}
            </div>



            {/* Center Bar overlay */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[6%] z-0 bg-[#3c2a1a] border-l-4 border-r-4 border-[#2a1d12] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />

            {/* 3D Dice on the board during play */}
            {phase === 'playing' && (hasRolled || isRolling) && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center gap-12">
                <FlatDice value={originalRoll[0] || 1} isRolling={isRolling} throwDirection={turn === playerColor ? 'bottom' : 'top'} diceIndex={0} />
                <FlatDice value={originalRoll[1] || 1} isRolling={isRolling} throwDirection={turn === playerColor ? 'bottom' : 'top'} diceIndex={1} />
              </div>
            )}

            {/* UNIFIED BOARD GRID: 13 columns (6 left, 1 center gap, 6 right) */}
            <div className="absolute inset-0 grid grid-cols-[repeat(6,1fr)_6%_repeat(6,1fr)] w-full h-full px-[3%] py-[2%] gap-1">
              {(() => {
                const validMoves = (selectedPoint !== null || selectedBar) ? getValidMoves(selectedBar ? 'bar' : selectedPoint!, playerColor) : [];
                return (
                  [0, 1, 2, 3, 4, 5, -1, 6, 7, 8, 9, 10, 11]
                ).map((topIdx, colIndex) => {
                
                if (topIdx === -1) {
                  return <div key="bar" className="h-full flex flex-col items-center justify-center relative z-20"></div>;
                }

                // Calculate corresponding bottom index
                // Since topIdx goes 23->18 then 17->12, and we want bottom to go 0->5 then 6->11
                // The relationship is strictly bottomIdx = 23 - topIdx
                const bottomIdx = 23 - topIdx;

                // State
                const topStack = board[topIdx] || [];
                const bottomStack = board[bottomIdx] || [];

                // Move Highlight Logic
                const topValidMove = validMoves.find(m => m.toIdx === topIdx);
                const isTopBlue = topValidMove && topValidMove.diceUsed.length === 1;
                const isTopYellow = topValidMove && topValidMove.diceUsed.length > 1;

                const bottomValidMove = validMoves.find(m => m.toIdx === bottomIdx);
                const isBottomBlue = bottomValidMove && bottomValidMove.diceUsed.length === 1;
                const isBottomYellow = bottomValidMove && bottomValidMove.diceUsed.length > 1;

                // Colors for Top Triangle
                let topFill = colIndex % 2 === 0 ? '#1f130b' : '#2d1b10';
                let topStroke = colIndex % 2 === 0 ? '#382215' : '#4a2c1a';
                let topShadow = 'none';
                let topClass = '';
                if (isTopYellow) {
                  topFill = 'rgba(234, 179, 8, 0.4)';
                  topStroke = '#facc15';
                  topShadow = 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.9))';
                  topClass = 'animate-pulse z-20';
                } else if (isTopBlue) {
                  topFill = 'rgba(56, 189, 248, 0.4)';
                  topStroke = '#38bdf8';
                  topShadow = 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.9))';
                  topClass = 'animate-pulse z-20';
                }

                // Colors for Bottom Triangle
                let bottomFill = colIndex % 2 === 0 ? '#2d1b10' : '#1f130b';
                let bottomStroke = colIndex % 2 === 0 ? '#4a2c1a' : '#382215';
                let bottomShadow = 'none';
                let bottomClass = '';
                if (isBottomYellow) {
                  bottomFill = 'rgba(234, 179, 8, 0.4)';
                  bottomStroke = '#facc15';
                  bottomShadow = 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.9))';
                  bottomClass = 'animate-pulse z-20';
                } else if (isBottomBlue) {
                  bottomFill = 'rgba(56, 189, 248, 0.4)';
                  bottomStroke = '#38bdf8';
                  bottomShadow = 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.9))';
                  bottomClass = 'animate-pulse z-20';
                }

                return (
                  <div key={colIndex} className="h-full flex flex-col justify-between relative">
                    
                    {/* Top Point Area */}
                    <div 
                      className={`flex-1 w-full flex flex-col items-center justify-start relative pt-0 cursor-pointer transition-colors`}
                      onClick={() => handlePointClick(topIdx)}
                    >
                      
                      {/* Triangles (Top) */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[42%] pointer-events-none z-0 overflow-visible">
                        <svg className={`w-full h-full ${topClass}`} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ filter: topShadow, transition: 'all 0.3s ease' }}>
                          <polygon 
                            points="0,0 100,0 50,100" 
                            fill={topFill}
                            stroke={topStroke}
                            strokeWidth="3" 
                            style={{ transition: 'all 0.3s ease' }}
                          />
                        </svg>
                      </div>

                      {/* Checker Size Grid Overlay & Checkers */}
                      <div className="absolute inset-0 w-full z-10">
                        {topStack.map((checker, i) => {
                          const checkerSize = 16.5; // 16.5% of half-board height
                          const maxOffset = 100 - checkerSize;
                          const step = topStack.length > 5 ? maxOffset / (topStack.length - 1) : checkerSize;
                          
                          return (
                            <div 
                              key={i} 
                              className={`absolute left-1/2 -translate-x-1/2 w-[85%] aspect-square rounded-full flex items-center justify-center ${
                                checker.color === 'white' 
                                  ? 'bg-gradient-to-b from-slate-100 to-slate-300 shadow-[0_5px_8px_rgba(0,0,0,0.5),inset_0_-4px_5px_rgba(0,0,0,0.2),inset_0_4px_6px_rgba(255,255,255,0.9)] border border-slate-300' 
                                  : 'bg-gradient-to-b from-neutral-700 to-neutral-900 shadow-[0_5px_8px_rgba(0,0,0,0.6),inset_0_-4px_5px_rgba(0,0,0,0.8),inset_0_4px_5px_rgba(255,255,255,0.3)] border border-neutral-950'
                              } ${selectedPoint === topIdx && i === topStack.length - 1 ? 'ring-[3px] ring-cyan-400 z-40 brightness-125 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] scale-105 transition-all' : 'transition-all'}`}
                              style={{ 
                                top: `${i * step}%`,
                                zIndex: i
                              }}
                            >
                                <div className={`w-[45%] h-[45%] rounded-full ${
                                  checker.color === 'white'
                                    ? 'bg-gradient-to-b from-slate-300 to-slate-100 shadow-[inset_0_4px_6px_rgba(0,0,0,0.4),0_2px_3px_rgba(255,255,255,1)]'
                                    : 'bg-gradient-to-b from-neutral-900 to-neutral-700 shadow-[inset_0_4px_6px_rgba(0,0,0,0.8),0_1px_2px_rgba(255,255,255,0.1)]'
                                }`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Point Area */}
                    <div 
                      className={`flex-1 w-full flex flex-col items-center justify-end relative pb-0 cursor-pointer transition-colors`}
                      onClick={() => handlePointClick(bottomIdx)}
                    >
                      
                      {/* Triangles (Bottom) */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[42%] pointer-events-none z-0 overflow-visible">
                        <svg className={`w-full h-full ${bottomClass}`} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ filter: bottomShadow, transition: 'all 0.3s ease' }}>
                          <polygon 
                            points="0,100 100,100 50,0" 
                            fill={bottomFill}
                            stroke={bottomStroke}
                            strokeWidth="3" 
                            style={{ transition: 'all 0.3s ease' }}
                          />
                        </svg>
                      </div>

                      {/* Checker Size Grid Overlay & Checkers */}
                      <div className="absolute inset-0 w-full z-10">
                        {bottomStack.map((checker, i) => {
                          const checkerSize = 16.5; // 16.5% of half-board height
                          const maxOffset = 100 - checkerSize;
                          const step = bottomStack.length > 5 ? maxOffset / (bottomStack.length - 1) : checkerSize;
                          
                          return (
                            <div 
                              key={i} 
                              className={`absolute left-1/2 -translate-x-1/2 w-[85%] aspect-square rounded-full flex items-center justify-center ${
                                checker.color === 'white' 
                                  ? 'bg-gradient-to-b from-slate-100 to-slate-300 shadow-[0_5px_8px_rgba(0,0,0,0.5),inset_0_-4px_5px_rgba(0,0,0,0.2),inset_0_4px_6px_rgba(255,255,255,0.9)] border border-slate-300' 
                                  : 'bg-gradient-to-b from-neutral-700 to-neutral-900 shadow-[0_5px_8px_rgba(0,0,0,0.6),inset_0_-4px_5px_rgba(0,0,0,0.8),inset_0_4px_5px_rgba(255,255,255,0.3)] border border-neutral-950'
                              } ${selectedPoint === bottomIdx && i === bottomStack.length - 1 ? 'ring-[3px] ring-cyan-400 z-40 brightness-125 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] scale-105 transition-all' : 'transition-all'}`}
                              style={{ 
                                bottom: `${i * step}%`,
                                zIndex: i
                              }}
                            >
                                <div className={`w-[45%] h-[45%] rounded-full ${
                                  checker.color === 'white'
                                    ? 'bg-gradient-to-b from-slate-300 to-slate-100 shadow-[inset_0_4px_6px_rgba(0,0,0,0.4),0_2px_3px_rgba(255,255,255,1)]'
                                    : 'bg-gradient-to-b from-neutral-900 to-neutral-700 shadow-[inset_0_4px_6px_rgba(0,0,0,0.8),0_1px_2px_rgba(255,255,255,0.1)]'
                                }`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })})()}
            </div>

            {/* Player Profile Card (Bottom Right - completely outside the board) */}
            <div className="hidden md:flex absolute bottom-4 left-full ml-12 min-w-[110px] p-3 bg-[#1a0c04]/90 backdrop-blur-sm rounded-2xl border-2 border-emerald-900/50 shadow-2xl z-20 flex-col items-center justify-center gap-2">
              <div className={`w-14 h-14 rounded-xl border-2 border-emerald-500 overflow-hidden flex items-center justify-center text-3xl shadow-inner ${playerColor === 'white' ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                👤
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-white font-bold text-xs leading-tight whitespace-nowrap">{profile?.username || 'Player'}</span>
                <span className={`text-[9px] font-mono uppercase tracking-widest mt-1 whitespace-nowrap ${playerColor === 'white' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {playerColor === 'white' ? '⚪ WHITE' : '⚫ BLACK'}
                </span>
              </div>
              {isPlayerTrapped && (
                <button
                  onClick={() => {
                    addLog(lang === 'ar' ? '🚩 انسحبت من الدور لأن الطريق مسدود! (15)' : '🚩 Surrendered due to blocked path! (15)');
                    handleGameOver('loss');
                  }}
                  className="mt-1 w-full px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] animate-pulse border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)] cursor-pointer active:scale-95 transition-all"
                >
                  {lang === 'ar' ? 'انسحاب (15) 🏳️' : 'Surrender (15) 🏳️'}
                </button>
              )}
            </div>

          </div>

          {/* Roll for Start overlay */}
            {!dismissStartRoll && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center p-4">
                {(!startRollResult || isRolling) ? (
                  <div className="bg-[#1e0d04]/95 p-6 rounded-3xl border border-amber-500/40 text-center space-y-4 max-w-xs shadow-2xl">
                    <div className="h-16 flex items-center justify-center">
                       {isRolling ? <FlatDice value={1} isRolling={true} throwDirection="bottom" diceIndex={0} /> : <FlatDice value={6} isRolling={false} throwDirection="bottom" diceIndex={0} />}
                    </div>
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest">
                      {lang === 'ar' ? 'تحديد بداية اللعب' : 'Roll for Start'}
                    </h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      {lang === 'ar' ? 'يرمي كل لاعب نرد واحد لتحديد من يبدأ اللعبة وصاحب الرقم الأكبر يبدأ!' : 'Each player rolls 1 die. The higher roll takes the first turn!'}
                    </p>
                    <button
                      onClick={triggerStartRoll}
                      disabled={isRolling}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer border border-amber-400"
                    >
                      {lang === 'ar' ? (isRolling ? 'جاري الرمي...' : '🎲 ارمِ نرد البداية') : (isRolling ? 'Rolling...' : '🎲 Roll for Start')}
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#1e0d04]/95 p-6 rounded-3xl border border-amber-500/40 text-center space-y-5 max-w-xs shadow-2xl">
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest">
                      {lang === 'ar' ? 'نتيجة قرعة البداية' : 'Start Roll Result'}
                    </h4>

                    <div className="flex justify-center gap-8 my-4">
                      <div className="text-center">
                        <div className="text-[10px] text-amber-400 font-bold mb-3">
                          {playerColor === 'white' ? (lang === 'ar' ? 'نردك ⚪' : 'Your Die ⚪') : (lang === 'ar' ? 'نردك ⚫' : 'Your Die ⚫')}
                        </div>
                        <div className="h-16 flex items-center justify-center transform scale-90">
                          <FlatDice value={startRollResult.white} isRolling={false} throwDirection="bottom" diceIndex={0} />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-400 font-bold mb-3">
                          {playerColor === 'white' ? (lang === 'ar' ? 'عزت ⚫' : 'Ezzo ⚫') : (lang === 'ar' ? 'عزت ⚪' : 'Ezzo ⚪')}
                        </div>
                        <div className="h-16 flex items-center justify-center transform scale-90">
                          <FlatDice value={startRollResult.red} isRolling={false} throwDirection="bottom" diceIndex={0} />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-amber-200/90 font-bold leading-relaxed">
                      {turn === playerColor 
                        ? (lang === 'ar' ? '🎉 البداية عندك! اضغط ابدأ للعب.' : '🎉 You start! Click Start Game to play.') 
                        : (lang === 'ar' ? 'عزت هيبدأ اللعب!' : 'Ezzo starts the game!')}
                    </p>

                    <button
                      onClick={() => setDismissStartRoll(true)}
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer border border-emerald-400 shadow-md"
                    >
                      {lang === 'ar' ? '🎮 ابدأ اللعب' : '🎮 Start Game'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {phase === 'roundover' && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <span className="text-6xl animate-bounce">🏁🪵</span>
          <h3 className="text-xl font-black text-amber-400">
            {lang === 'ar' ? 'نهاية الجولة!' : 'Round Over!'}
          </h3>
          <div className="bg-[#1a0c04] p-5 rounded-2xl border border-amber-900/30 w-full max-w-xs space-y-3">
            <div className="flex justify-between text-xs font-mono font-bold text-amber-100">
              <span>⚪ {lang === 'ar' ? 'الأبيض (أنت)' : 'White (You)'}:</span>
              <span className="text-amber-400">{matchScore.white} / 31</span>
            </div>
            <div className="flex justify-between text-xs font-mono font-bold text-slate-400">
              <span>⚫ {lang === 'ar' ? 'الأسود (عزت)' : 'Black (Ezzo)'}:</span>
              <span className="text-amber-400">{matchScore.red} / 31</span>
            </div>
          </div>
          <button
            onClick={startNextRound}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-full text-xs active:scale-95 transition-all cursor-pointer border border-amber-400"
          >
            {lang === 'ar' ? '⏭️ الجولة التالية' : '⏭️ Next Round'}
          </button>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <span className="text-7xl animate-bounce">👑🏆🪵</span>
          <h3 className="text-2xl font-black text-amber-400">
            {matchScore.white >= 31 ? (lang === 'ar' ? 'تهانينا! فزت بالبطولة كاملة 🏆!' : 'Victory!') : (lang === 'ar' ? 'هارد لك! فاز عزت بالبطولة 💥.' : 'Defeat!')}
          </h3>
          <div className="bg-[#1a0c04] p-5 rounded-2xl border border-amber-900/30 w-full max-w-xs space-y-3">
            <div className="flex justify-between text-xs font-mono font-bold text-amber-100">
              <span>⚪ {lang === 'ar' ? 'الأبيض' : 'White'}:</span>
              <span className="text-amber-400">{matchScore.white} / 31</span>
            </div>
            <div className="flex justify-between text-xs font-mono font-bold text-slate-400">
              <span>⚫ {lang === 'ar' ? 'الأسود' : 'Black'}:</span>
              <span className="text-amber-400">{matchScore.red} / 31</span>
            </div>
          </div>
          <button
            onClick={() => setPhase('init')}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-full text-xs active:scale-95 transition-all cursor-pointer border border-amber-400"
          >
            {lang === 'ar' ? 'العودة للقائمة الرئيسية 🏠' : 'Main Menu 🏠'}
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        /* 3D Dice Styles */
        .dice-scene {
          width: 60px;
          height: 60px;
          perspective: 600px;
        }
        .dice-cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.5s ease-out;
        }
        .dice-face {
          position: absolute;
          width: 60px;
          height: 60px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          display: grid;
          padding: 8px;
          box-shadow: inset 0 0 10px rgba(255,255,255,1), 0 0 5px rgba(0,0,0,0.5);
          backface-visibility: hidden;
        }
        .dice-dot {
          background: #312e81;
          border-radius: 50%;
          width: 12px;
          height: 12px;
          justify-self: center;
          align-self: center;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }
        .dice-face-1 .dice-dot {
          background: #f43f5e;
        }
        
        @keyframes dice-tumble-spin {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg); }
        }
        .animate-dice-tumble-spin {
          animation: dice-tumble-spin 0.4s linear infinite;
        }
        
        .dice-face-1 { transform: rotateY(  0deg) translateZ(30px); }
        .dice-face-2 { transform: rotateY( 90deg) translateZ(30px); }
        .dice-face-3 { transform: rotateX( 90deg) translateZ(30px); }
        .dice-face-4 { transform: rotateX(-90deg) translateZ(30px); }
        .dice-face-5 { transform: rotateY(-90deg) translateZ(30px); }
        .dice-face-6 { transform: rotateY(180deg) translateZ(30px); }

        /* Dot Grid Layouts */
        .dice-face-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; }
        .dice-face-2 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .dice-face-3 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
        .dice-face-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .dice-face-5 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
        .dice-face-6 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }

        /* Face Rotations to show correct value */
        .show-1 { transform: rotateX(  0deg) rotateY(  0deg); }
        .show-2 { transform: rotateX(  0deg) rotateY(-90deg); }
        .show-3 { transform: rotateX(-90deg) rotateY(  0deg); }
        .show-4 { transform: rotateX( 90deg) rotateY(  0deg); }
        .show-5 { transform: rotateX(  0deg) rotateY( 90deg); }
        .show-6 { transform: rotateX(  0deg) rotateY(180deg); }

        /* The Throw Animations - Toss into the air, bounce, and spin like a top */
        @keyframes dice-throw-1 {
          0% { transform: translate(0, 0) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          25% { transform: translate(40px, -150px) scale(1.5) rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
          50% { transform: translate(120px, 0) scale(1) rotateX(720deg) rotateY(360deg) rotateZ(270deg); }
          75% { transform: translate(150px, -40px) scale(1.1) rotateX(810deg) rotateY(450deg) rotateZ(540deg); }
          100% { transform: translate(180px, 0) scale(1) rotateX(1080deg) rotateY(720deg) rotateZ(1080deg); }
        }
        
        @keyframes dice-throw-2 {
          0% { transform: translate(0, 0) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          30% { transform: translate(-60px, -180px) scale(1.4) rotateX(-270deg) rotateY(360deg) rotateZ(-180deg); }
          60% { transform: translate(-150px, 20px) scale(1) rotateX(-720deg) rotateY(540deg) rotateZ(-360deg); }
          80% { transform: translate(-180px, -30px) scale(1.05) rotateX(-900deg) rotateY(720deg) rotateZ(-540deg); }
          100% { transform: translate(-200px, 0) scale(1) rotateX(-1080deg) rotateY(1080deg) rotateZ(-720deg); }
        }

        .animate-dice-throw-1 {
          animation: dice-throw-1 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .animate-dice-throw-2 {
          animation: dice-throw-2 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes dice-settle-1 {
          0% { transform: translate(180px, 0) scale(1) rotateZ(1080deg); }
          100% { transform: translate(180px, 0) scale(1.2) rotateZ(1095deg); }
        }
        @keyframes dice-settle-2 {
          0% { transform: translate(-200px, 0) scale(1) rotateZ(-720deg); }
          100% { transform: translate(-200px, 0) scale(1.2) rotateZ(-730deg); }
        }

        .animate-dice-settle-1 {
          animation: dice-settle-1 3s ease-out forwards;
        }
        .animate-dice-settle-2 {
          animation: dice-settle-2 3s ease-out forwards;
        }
      `}} />
    </div>
  );
}

const FlatDice = ({ value, isRolling, throwDirection, diceIndex = 0 }: { value: number; isRolling: boolean; throwDirection: 'top' | 'bottom'; diceIndex?: number }) => {
  const conf = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 3, 6, 2, 5, 8]
  };
  const dots = conf[value as keyof typeof conf] || [4];

  const [finalRot, setFinalRot] = useState(0);

  useEffect(() => {
    if (!isRolling) {
      // Settle perfectly flat (orthogonally aligned)
      setFinalRot(Math.floor(Math.random() * 4) * 90);
    }
  }, [isRolling]);

  return (
    <>
      <style>{`
        @keyframes dice-throw-bottom-0 {
          0% { transform: translate(-100px, 300px) rotate(0deg) scale(1.5); }
          30% { transform: translate(-30px, 80px) rotate(360deg) scale(1.2); }
          60% { transform: translate(10px, -30px) rotate(720deg) scale(1.1); }
          80% { transform: translate(5px, 10px) rotate(900deg) scale(1.05); }
          100% { transform: translate(0, 0) rotate(1080deg) scale(1); }
        }
        @keyframes dice-throw-top-0 {
          0% { transform: translate(-100px, -300px) rotate(0deg) scale(1.5); }
          30% { transform: translate(-30px, -80px) rotate(-360deg) scale(1.2); }
          60% { transform: translate(10px, 30px) rotate(-720deg) scale(1.1); }
          80% { transform: translate(5px, -10px) rotate(-900deg) scale(1.05); }
          100% { transform: translate(0, 0) rotate(-1080deg) scale(1); }
        }
        @keyframes dice-throw-bottom-1 {
          0% { transform: translate(100px, 300px) rotate(0deg) scale(1.5); }
          30% { transform: translate(30px, 80px) rotate(360deg) scale(1.2); }
          60% { transform: translate(-10px, -30px) rotate(720deg) scale(1.1); }
          80% { transform: translate(-5px, 10px) rotate(900deg) scale(1.05); }
          100% { transform: translate(0, 0) rotate(1080deg) scale(1); }
        }
        @keyframes dice-throw-top-1 {
          0% { transform: translate(100px, -300px) rotate(0deg) scale(1.5); }
          30% { transform: translate(30px, -80px) rotate(-360deg) scale(1.2); }
          60% { transform: translate(-10px, 30px) rotate(-720deg) scale(1.1); }
          80% { transform: translate(-5px, -10px) rotate(-900deg) scale(1.05); }
          100% { transform: translate(0, 0) rotate(-1080deg) scale(1); }
        }
      `}</style>
      <div 
        className="relative w-12 h-12 bg-gradient-to-br from-white to-slate-200 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.6),inset_0_-3px_0_rgba(0,0,0,0.1)] border border-slate-300 transition-transform duration-500 ease-out"
        style={{
          transform: isRolling 
            ? undefined 
            : `rotate(${finalRot}deg)`,
          animation: isRolling 
            ? `dice-throw-${throwDirection}-${diceIndex} 1s cubic-bezier(0.25, 1, 0.5, 1) forwards`
            : 'none'
        }}
      >
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-2 gap-0.5">
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex items-center justify-center">
              {dots.includes(i) && (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default function BackgammonGame() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Game...</div>}>
      <BackgammonGameContent />
    </Suspense>
  );
}
