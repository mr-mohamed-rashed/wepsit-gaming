'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// UNO Card interface
interface UnoCard {
  id: string;
  color: 'red' | 'yellow' | 'green' | 'blue' | 'wild';
  value: string; // '0'-'9', 'skip', 'reverse', 'draw2', 'wild', 'wild4'
  bgColor: string;
  textColor: string;
}

// Player state
interface Player {
  name: string;
  isHuman: boolean;
  cards: UnoCard[];
  tricksWon?: number; // Not used in Uno but keeps types clean
}

// Chat message interface
interface ChatMessage {
  id: string;
  sender: 'you' | 'bot1' | 'bot2' | 'bot3' | 'dealer';
  senderName: string;
  text: string;
  time: string;
}

// Web Audio API Sound Synth for UNO Casino Sound Effects
class UnoSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playShuffle() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Create short white noise buffer for card flicks
    const bufferSize = this.ctx.sampleRate * 0.12; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    // Play 16 card flicks in rapid succession
    for (let f = 0; f < 16; f++) {
      const time = now + f * 0.08;
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500 + f * 60, time);
      filter.Q.setValueAtTime(4.0, time);
      
      const gain = this.ctx.createGain();
      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
      
      noiseNode.start(time);
      noiseNode.stop(time + 0.08);
    }
  }

  playDealCard() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playCardPlay() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playDrawCard() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(350, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playUnoCall() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const playNote = (freq: number, start: number, dur: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };
    playNote(659.25, now, 0.15); // E5
    playNote(880.00, now + 0.12, 0.3); // A5
  }

  playJackpot() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const time = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.005, time + 0.3);
      osc.start(time);
      osc.stop(time + 0.3);
    });
  }

  playBuzzer() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }
}

const synth = new UnoSynth();

function UnoGameContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'ar';
  const userId = searchParams.get('userId') || 'mock-user-developer-admin';

  // Game Phases: 'init' | 'shuffling' | 'dealing' | 'playing' | 'gameover'
  const [phase, setPhase] = useState<'init' | 'shuffling' | 'dealing' | 'playing' | 'gameover'>('init');
  const [players, setPlayers] = useState<Player[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [drawPile, setDrawPile] = useState<UnoCard[]>([]);
  const [turn, setTurn] = useState<number>(0); // 0: You, 1: Bot1, 2: Bot2, 3: Bot3
  const [gameDirection, setGameDirection] = useState<number>(1); // 1: clockwise, -1: counter-clockwise
  const [currentColor, setCurrentColor] = useState<'red' | 'yellow' | 'green' | 'blue' | 'wild'>('red');
  const [dealtCardCount, setDealtCardCount] = useState<number>(0);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [activeWildCard, setActiveWildCard] = useState<UnoCard | null>(null);

  // Custom Chat Feed
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = {
    ar: {
      title: '🎰 كازينو أونو الملكي (Royal UNO Room) 🎰',
      subtitle: 'تحدي أونو كلاسيكي • 4 لاعبين • تصفية الكروت للفوز',
      startBtn: '🪙 دفع 50 عملة وبدء التوزيع (Buy-in 50)',
      shufflingText: '🃏 جاري تفنيط كروت الأونو بمرح كبير...',
      dealingText: '🎴 جاري توزيع 7 كروت لكل لاعب ورقة ورقة...',
      yourTurn: 'دورك! اختر كارت متوافق لتلعبه أو اسحب من السطح.',
      botTurn: 'دور {name} يخطط لرمي كارت فتاك...',
      playAgain: 'اللعب مجدداً 🔄',
      dealerName: 'الموزع الكازينو 🤵',
      chatRoomTitle: '🎰 دردشة طاولة الأونو الحية',
      currentPileLabel: 'الكارت النشط',
      currentColorLabel: 'اللون الحالي',
      drawBtn: 'سحب كارت ➕',
      chooseColor: 'اختر اللون الجديد للبطاقة العشوائية (Wild):',
      gameOverWin: '🎉 مبروك! تخلصت من كل أوراقك وحصلت على +150 عملة 🪙',
      gameOverLoss: '💥 خسارة! لقد أنهى أحد المنافسين أوراقه أولاً. خصم 50 عملة 🪙',
      youLabel: 'أنت',
      bot1Name: 'عزت أونو 🤖',
      bot2Name: 'الملك الملون 🎩',
      bot3Name: 'سيدة الكروت 🎲'
    },
    en: {
      title: '🎰 Royal UNO Room 🎰',
      subtitle: 'Classic UNO Challenge • 4 Players • Discard All to Win',
      startBtn: '🪙 Pay 50 Coins Buy-in to Deal',
      shufflingText: '🃏 Shuffling the colorful UNO deck...',
      dealingText: '🎴 Dealing 7 cards to everyone one-by-one...',
      yourTurn: 'Your turn! Choose a matching card or draw.',
      botTurn: "{name}'s turn... calculating color and number...",
      playAgain: 'Play Again 🔄',
      dealerName: 'Casino Dealer 🤵',
      chatRoomTitle: '🎰 UNO Table Live Chat',
      currentPileLabel: 'Active Pile',
      currentColorLabel: 'Current Color',
      drawBtn: 'Draw Card ➕',
      chooseColor: 'Choose color for Wild card:',
      gameOverWin: '🎉 Jackpot! Discarded all cards! Earned +150 Gold 🪙',
      gameOverLoss: '💥 Failed! A rival discarded all cards first. Penalty -50 Gold 🪙',
      youLabel: 'You',
      bot1Name: 'Ezzo UNO 🤖',
      bot2Name: 'Color King 🎩',
      bot3Name: 'Card Queen 🎲'
    }
  }[lang];

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addChatMessage = (sender: ChatMessage['sender'], senderName: string, text: string) => {
    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChatMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, sender, senderName, text, time }]);
  };

  // Step 1: Shuffle Animation
  const startShufflePhase = () => {
    synth.playShuffle();
    setPhase('shuffling');
    setChatMessages([]);
    addChatMessage('dealer', t.dealerName, lang === 'ar' ? 'أهلاً بكم في كازينو أونو! جاري تفنيط أوراق الأونو الملونة... 🤵🎴' : 'Welcome to the UNO Casino! Shuffling cards... 🤵🎴');

    setTimeout(() => {
      startDealingPhase();
    }, 2500);
  };

  // Step 2: Deal Cards (7 cards each)
  const startDealingPhase = () => {
    setPhase('dealing');
    setDealtCardCount(0);
    addChatMessage('dealer', t.dealerName, lang === 'ar' ? 'جاري توزيع 7 كروت لكل لاعب بالتساوي...' : 'Dealing 7 cards one-by-one to everyone...');

    let count = 0;
    const interval = setInterval(() => {
      synth.playDealCard();
      count++;
      setDealtCardCount(count);
      if (count >= 7) {
        clearInterval(interval);
        setTimeout(() => {
          setupUnoGame();
        }, 300);
      }
    }, 1500 / 7);
  };

  // Step 3: Setup game deck
  const setupUnoGame = () => {
    const colors: ('red' | 'yellow' | 'green' | 'blue')[] = ['red', 'yellow', 'green', 'blue'];
    const bgColors = {
      red: 'bg-rose-600',
      yellow: 'bg-amber-500',
      green: 'bg-emerald-600',
      blue: 'bg-blue-600',
      wild: 'bg-gradient-to-r from-rose-500 via-emerald-500 to-blue-500'
    };
    const textColors = {
      red: 'text-white',
      yellow: 'text-slate-950',
      green: 'text-white',
      blue: 'text-white',
      wild: 'text-white font-extrabold'
    };

    let tempDeck: UnoCard[] = [];

    // Create cards for each color
    colors.forEach((col) => {
      // 0 card
      tempDeck.push({ id: `${col}-0`, color: col, value: '0', bgColor: bgColors[col], textColor: textColors[col] });
      // 1-9 twice
      for (let i = 1; i <= 9; i++) {
        tempDeck.push({ id: `${col}-${i}-a`, color: col, value: String(i), bgColor: bgColors[col], textColor: textColors[col] });
        tempDeck.push({ id: `${col}-${i}-b`, color: col, value: String(i), bgColor: bgColors[col], textColor: textColors[col] });
      }
      // Action cards: Skip, Reverse, Draw Two
      ['Skip 🚫', 'Reverse 🔄', '+2 🎴'].forEach((action) => {
        tempDeck.push({ id: `${col}-${action}-a`, color: col, value: action, bgColor: bgColors[col], textColor: textColors[col] });
        tempDeck.push({ id: `${col}-${action}-b`, color: col, value: action, bgColor: bgColors[col], textColor: textColors[col] });
      });
    });

    // Wild cards (4 of each)
    for (let w = 1; w <= 4; w++) {
      tempDeck.push({ id: `wild-${w}`, color: 'wild', value: 'WILD 🎨', bgColor: bgColors.wild, textColor: textColors.wild });
      tempDeck.push({ id: `wild4-${w}`, color: 'wild', value: 'WILD +4 💥', bgColor: bgColors.wild, textColor: textColors.wild });
    }

    // Shuffle deck
    tempDeck.sort(() => Math.random() - 0.5);

    // Deal 7 cards
    const p1Hand = tempDeck.slice(0, 7);
    const p2Hand = tempDeck.slice(7, 14);
    const p3Hand = tempDeck.slice(14, 21);
    const p4Hand = tempDeck.slice(21, 28);

    let deck = tempDeck.slice(28);

    // Put first card in discard pile (ensure it is not a Wild card)
    let firstCard = deck.pop()!;
    while (firstCard.color === 'wild') {
      deck.unshift(firstCard);
      firstCard = deck.pop()!;
    }

    setPlayers([
      { name: t.youLabel, isHuman: true, cards: p1Hand },
      { name: t.bot1Name, isHuman: false, cards: p2Hand },
      { name: t.bot2Name, isHuman: false, cards: p3Hand },
      { name: t.bot3Name, isHuman: false, cards: p4Hand }
    ]);

    setDiscardPile([firstCard]);
    setDrawPile(deck);
    setCurrentColor(firstCard.color);
    setGameDirection(1);
    setTurn(0);
    setPhase('playing');

    addChatMessage('dealer', t.dealerName, lang === 'ar' ? `البطاقة الأولى هي ${firstCard.value} باللون ${firstCard.color}.` : `First card is ${firstCard.value} ${firstCard.color}.`);
  };

  const handleDrawCard = () => {
    if (phase !== 'playing' || turn !== 0) return;
    
    synth.playDrawCard();
    let currentDeck = [...drawPile];
    if (currentDeck.length === 0) {
      // Recopy discard pile
      currentDeck = [...discardPile].slice(0, discardPile.length - 1).sort(() => Math.random() - 0.5);
      setDiscardPile([discardPile[discardPile.length - 1]]);
    }

    const drawnCard = currentDeck.pop();
    if (!drawnCard) return;

    setDrawPile(currentDeck);
    setPlayers((prev) => {
      const next = [...prev];
      next[0].cards = [...next[0].cards, drawnCard];
      return next;
    });

    addChatMessage('you', t.youLabel, lang === 'ar' ? 'سحبت كارت من السطح.' : 'Drew a card from deck.');
    advanceTurn();
  };

  const playCard = (card: UnoCard) => {
    if (phase !== 'playing' || turn !== 0) return;

    // Check validity
    const topCard = discardPile[discardPile.length - 1];
    const isValid = card.color === 'wild' || card.color === currentColor || card.value === topCard.value;

    if (!isValid) return;

    synth.playCardPlay();
    setPlayers((prev) => {
      const next = [...prev];
      next[0].cards = next[0].cards.filter((c) => c.id !== card.id);
      return next;
    });

    setDiscardPile((prev) => [...prev, card]);

    if (card.color === 'wild') {
      setActiveWildCard(card);
      setShowColorPicker(true);
    } else {
      setCurrentColor(card.color);
      processCardEffect(card);
    }
  };

  const selectWildColor = (selectedCol: 'red' | 'yellow' | 'green' | 'blue') => {
    setShowColorPicker(false);
    setCurrentColor(selectedCol);
    addChatMessage('you', t.youLabel, lang === 'ar' ? `اخترت اللون ${selectedCol}! 🎨` : `Chose color ${selectedCol}! 🎨`);
    
    if (activeWildCard) {
      processCardEffect(activeWildCard, selectedCol);
      setActiveWildCard(null);
    }
  };

  const processCardEffect = (playedCard: UnoCard, wildColor?: string) => {
    let nextTurn = (turn + gameDirection + 4) % 4;
    let extraMsg = '';

    // UNO call check for human
    const humanHand = players[0].cards.filter((c) => c.id !== playedCard.id);
    if (humanHand.length === 1) {
      synth.playUnoCall();
      addChatMessage('you', t.youLabel, '💥 أونوووو! UNO! 💥');
    }

    if (playedCard.value === '+2 🎴') {
      // Draw 2 for next player
      drawCardsForPlayer(nextTurn, 2);
      extraMsg = lang === 'ar' ? `أُجبر اللاعب التالي على سحب كارتين! 🎴` : `Forced next player to draw 2 cards! 🎴`;
    } else if (playedCard.value === 'WILD +4 💥') {
      drawCardsForPlayer(nextTurn, 4);
      extraMsg = lang === 'ar' ? `أُجبر اللاعب التالي على سحب 4 كروت كولد! 💥` : `Forced next player to draw 4 cards! 💥`;
    } else if (playedCard.value === 'Skip 🚫') {
      // Skip next player
      nextTurn = (nextTurn + gameDirection + 4) % 4;
      extraMsg = lang === 'ar' ? `تم تخطي دور اللاعب التالي! 🚫` : `Skipped next player's turn! 🚫`;
    } else if (playedCard.value === 'Reverse 🔄') {
      const nextDir = gameDirection * -1;
      setGameDirection(nextDir);
      nextTurn = (turn + nextDir + 4) % 4;
      extraMsg = lang === 'ar' ? `تم عكس اتجاه اللعب! 🔄` : `Reversed game direction! 🔄`;
    }

    if (extraMsg) {
      addChatMessage('dealer', t.dealerName, extraMsg);
    }

    // Check game over
    if (humanHand.length === 0) {
      setPhase('gameover');
      synth.playJackpot();
      addChatMessage('dealer', t.dealerName, t.gameOverWin);
      window.parent.postMessage({ type: 'GAME_OVER', outcome: 'win', reward: 150 }, '*');
      return;
    }

    setTurn(nextTurn);
  };

  const drawCardsForPlayer = (playerIdx: number, count: number) => {
    let currentDeck = [...drawPile];
    const drawn: UnoCard[] = [];
    for (let i = 0; i < count; i++) {
      if (currentDeck.length === 0) {
        currentDeck = [...discardPile].slice(0, discardPile.length - 1).sort(() => Math.random() - 0.5);
      }
      const card = currentDeck.pop();
      if (card) drawn.push(card);
    }
    setDrawPile(currentDeck);
    setPlayers((prev) => {
      const next = [...prev];
      next[playerIdx].cards = [...next[playerIdx].cards, ...drawn];
      return next;
    });
  };

  const advanceTurn = () => {
    setTurn((prev) => (prev + gameDirection + 4) % 4);
  };

  // Bot logic loop
  useEffect(() => {
    if (phase !== 'playing' || turn === 0 || showColorPicker) return;

    const timer = setTimeout(() => {
      const botIdx = turn;
      const bot = players[botIdx];
      if (!bot || bot.cards.length === 0) return;

      const topCard = discardPile[discardPile.length - 1];
      
      // Find playable cards
      const playable = bot.cards.filter(
        (c) => c.color === 'wild' || c.color === currentColor || c.value === topCard.value
      );

      if (playable.length > 0) {
        // Pick one card to play
        const cardToPlay = playable[0];
        synth.playCardPlay();

        setPlayers((prev) => {
          const next = [...prev];
          next[botIdx].cards = next[botIdx].cards.filter((c) => c.id !== cardToPlay.id);
          return next;
        });

        setDiscardPile((prev) => [...prev, cardToPlay]);

        const senderId = botIdx === 1 ? 'bot1' : botIdx === 2 ? 'bot2' : 'bot3';
        addChatMessage(senderId, bot.name, lang === 'ar' ? `لعبت كارت الـ ${cardToPlay.value} ${cardToPlay.color}` : `Played ${cardToPlay.value} ${cardToPlay.color}`);

        // Handle Bot UNO call
        if (bot.cards.length - 1 === 1) {
          synth.playUnoCall();
          addChatMessage(senderId, bot.name, '💥 أونوووو! UNO! 💥');
        }

        // Handle Bot win
        if (bot.cards.length - 1 === 0) {
          setPhase('gameover');
          synth.playBuzzer();
          addChatMessage('dealer', t.dealerName, t.gameOverLoss);
          window.parent.postMessage({ type: 'GAME_OVER', outcome: 'loss', penalty: 50 }, '*');
          return;
        }

        // Card effects for bots
        if (cardToPlay.color === 'wild') {
          // Bots pick color of their most cards
          const colorsOnly = bot.cards.filter((c) => c.color !== 'wild');
          const pickedColor = colorsOnly.length > 0 ? colorsOnly[0].color : 'red';
          setCurrentColor(pickedColor);
          addChatMessage(senderId, bot.name, lang === 'ar' ? `اخترت اللون ${pickedColor}! 🎨` : `Chose color ${pickedColor}! 🎨`);
          processCardEffect(cardToPlay, pickedColor);
        } else {
          setCurrentColor(cardToPlay.color);
          processCardEffect(cardToPlay);
        }
      } else {
        // Draw card
        synth.playDrawCard();
        let currentDeck = [...drawPile];
        if (currentDeck.length === 0) {
          currentDeck = [...discardPile].slice(0, discardPile.length - 1).sort(() => Math.random() - 0.5);
        }
        const card = currentDeck.pop();
        if (card) {
          setDrawPile(currentDeck);
          setPlayers((prev) => {
            const next = [...prev];
            next[botIdx].cards = [...next[botIdx].cards, card];
            return next;
          });
        }
        const senderId = botIdx === 1 ? 'bot1' : botIdx === 2 ? 'bot2' : 'bot3';
        addChatMessage(senderId, bot.name, lang === 'ar' ? 'سحبت كارت من السطح لعدم وجود كارت متوافق.' : 'Drew card from deck.');
        advanceTurn();
      }

    }, 1000);

    return () => clearTimeout(timer);
  }, [turn, phase, players, discardPile, currentColor, gameDirection, showColorPicker]);

  return (
    <div className="min-h-screen bg-transparent text-emerald-100 flex flex-col md:flex-row font-sans select-none overflow-hidden relative">
      
      {/* Blurred Game Card Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center -z-20 scale-105"
        style={{
          backgroundImage: "url('/uno_card.png')",
          filter: 'brightness(0.35) saturate(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 -z-10" />
      
      {/* LEFT SIDE: Card Table felt space (3/4 width) */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 relative border-r border-[#191125]">
        
        {/* Satirical Casino felt style header */}
        <header className="text-center py-2 border-b border-purple-900/30 w-full z-10 bg-slate-950/40 rounded-xl">
          <h2 className="text-base font-black text-amber-400 tracking-widest">{t.title}</h2>
          <p className="text-[9px] text-purple-500 font-mono">{t.subtitle}</p>
        </header>

        {/* Shuffling Screen animation */}
        {phase === 'shuffling' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-20">
            <div className="relative w-44 h-32 flex items-center justify-center">
              <div className="absolute w-20 h-28 bg-gradient-to-br from-red-600 to-yellow-600 border-2 border-white rounded-xl shadow-lg animate-[shuffle-left_0.4s_infinite_alternate] flex items-center justify-center text-slate-100 font-bold text-lg select-none">
                🔴
              </div>
              <div className="absolute w-20 h-28 bg-gradient-to-br from-green-600 to-blue-600 border-2 border-white rounded-xl shadow-lg animate-[shuffle-right_0.4s_infinite_alternate] flex items-center justify-center text-slate-100 font-bold text-lg select-none">
                🔵
              </div>
            </div>
            <h3 className="text-sm font-bold text-amber-300 animate-pulse">{t.shufflingText}</h3>
            
            <style jsx global>{`
              @keyframes shuffle-left {
                0% { transform: translateX(-40px) rotate(-8deg); z-index: 10; }
                100% { transform: translateX(5px) rotate(2deg); z-index: 30; }
              }
              @keyframes shuffle-right {
                0% { transform: translateX(40px) rotate(8deg); z-index: 20; }
                100% { transform: translateX(-5px) rotate(-2deg); z-index: 10; }
              }
            `}</style>
          </div>
        )}

        {/* Dealing Screen Animation */}
        {phase === 'dealing' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-20 w-full max-w-md">
            <div className="relative w-64 h-64 border-2 border-dashed border-purple-800/40 rounded-full flex items-center justify-center">
              <div className="absolute w-12 h-16 bg-slate-900 border border-amber-400 rounded-lg animate-[deal-fly_0.1s_infinite] shadow-md flex items-center justify-center text-xs font-bold">
                🎴
              </div>

              {/* Player seat indicator */}
              <div className="absolute top-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">BOT 2</div>
              <div className="absolute left-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">BOT 1</div>
              <div className="absolute right-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">BOT 3</div>
              <div className="absolute bottom-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">YOU</div>

              <div className="text-center">
                <span className="text-[10px] text-purple-500 font-mono block">توزيع الكروت</span>
                <span className="text-xs text-amber-400 font-bold font-mono">{dealtCardCount} / 7</span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-amber-300 animate-pulse">{t.dealingText}</h3>

            <style jsx global>{`
              @keyframes deal-fly {
                0% { transform: scale(0.2) translate(0, 0) rotate(0deg); opacity: 0.2; }
                100% { transform: scale(1) translate(0, -60px) rotate(360deg); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {phase === 'init' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <span className="text-6xl animate-bounce">🎴</span>
            <button
              onClick={startShufflePhase}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-full text-xs shadow-lg hover:shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer border-2 border-yellow-300"
            >
              {t.startBtn}
            </button>
          </div>
        )}

        {(phase === 'playing' || phase === 'gameover') && (
          <div className="flex-1 w-full max-w-xl flex flex-col justify-between relative h-full my-4">
            
            {/* Top Bot 2 */}
            <div className="text-center">
              <span className="text-[10px] bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                {t.bot2Name} ({players[2]?.cards.length} {lang === 'ar' ? 'كروت' : 'cards'})
              </span>
            </div>

            {/* Middle row: Bot 1 (Left), Played Cards, Bot 3 (Right) */}
            <div className="flex justify-between items-center my-auto">
              <div className="w-20 text-left">
                <span className="text-[9px] bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800 block truncate">
                  {t.bot1Name}
                </span>
                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                  {players[1]?.cards.length} 🎴
                </span>
              </div>

              {/* Cards played zone */}
              <div className="w-40 h-40 bg-slate-950/40 rounded-full border-2 border-dashed border-purple-900/30 flex items-center justify-center relative shadow-inner">
                {discardPile.length > 0 && (
                  <div className={`p-2 border-2 border-white rounded-xl text-center font-bold text-sm shadow-xl w-14 h-20 flex flex-col justify-between ${discardPile[discardPile.length - 1].bgColor} ${discardPile[discardPile.length - 1].textColor}`}>
                    <span className="text-left text-xs">UNO</span>
                    <span className="text-xl my-auto font-black">{discardPile[discardPile.length - 1].value}</span>
                    <span className="text-right text-[8px]">UNO</span>
                  </div>
                )}

                <div className="absolute top-1 text-[8.5px] text-amber-500 font-bold bg-slate-950 px-2 py-0.5 rounded-full border border-purple-900/50">
                  {t.currentColorLabel}: {currentColor.toUpperCase()}
                </div>
              </div>

              <div className="w-20 text-right">
                <span className="text-[9px] bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800 block truncate">
                  {t.bot3Name}
                </span>
                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                  {players[3]?.cards.length} 🎴
                </span>
              </div>
            </div>

            {/* Bottom Row: Human Cards */}
            <div className="space-y-2">
              <div className="text-center flex justify-between items-center text-[10px] px-2">
                <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 text-amber-400 flex items-center gap-1.5">
                  <span>{t.youLabel}</span>
                  <span className="font-mono bg-purple-950/40 px-1.5 rounded">{players[0]?.cards.length} 🎴</span>
                </span>
                <button
                  onClick={handleDrawCard}
                  disabled={turn !== 0 || phase !== 'playing'}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 active:scale-90 text-slate-950 text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.drawBtn}
                </button>
              </div>

              {/* Hand cards deck */}
              <div className="flex gap-1 overflow-x-auto py-2 px-1 justify-center max-w-full scrollbar-none h-20">
                {players[0]?.cards.map((card) => {
                  const topCard = discardPile[discardPile.length - 1];
                  const isPlayable = card.color === 'wild' || card.color === currentColor || card.value === topCard?.value;
                  return (
                    <button
                      key={card.id}
                      onClick={() => playCard(card)}
                      disabled={turn !== 0 || phase !== 'playing' || !isPlayable}
                      className={`shrink-0 w-11 h-15 border border-white/60 hover:-translate-y-2 rounded-lg flex flex-col justify-between p-1.5 text-xs font-black shadow-md cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${card.bgColor} ${card.textColor}`}
                    >
                      <span className="text-left text-[8px]">UNO</span>
                      <span className="text-center text-sm font-black">{card.value}</span>
                      <span className="text-right text-[8px]">UNO</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Color picker overlay for Wild cards */}
        {showColorPicker && (
          <div className="absolute inset-0 bg-slate-950/90 z-40 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <h3 className="text-sm font-bold text-amber-400">{t.chooseColor}</h3>
            <div className="flex gap-4">
              <button onClick={() => selectWildColor('red')} className="w-14 h-14 bg-rose-600 rounded-xl border border-white cursor-pointer active:scale-90 transition-all"></button>
              <button onClick={() => selectWildColor('yellow')} className="w-14 h-14 bg-amber-500 rounded-xl border border-white cursor-pointer active:scale-90 transition-all"></button>
              <button onClick={() => selectWildColor('green')} className="w-14 h-14 bg-emerald-600 rounded-xl border border-white cursor-pointer active:scale-90 transition-all"></button>
              <button onClick={() => selectWildColor('blue')} className="w-14 h-14 bg-blue-600 rounded-xl border border-white cursor-pointer active:scale-90 transition-all"></button>
            </div>
          </div>
        )}

        {phase === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
            {players[0]?.cards.length === 0 ? (
              <>
                <span className="text-6xl animate-bounce">👑🏆🎰</span>
                <h3 className="text-2xl font-black text-amber-400">{t.gameOverWin}</h3>
              </>
            ) : (
              <>
                <span className="text-6xl">💥😭📢</span>
                <h3 className="text-xl font-bold text-rose-500">{t.gameOverLoss}</h3>
              </>
            )}

            <button
              onClick={startShufflePhase}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-full text-xs active:scale-95 transition-all cursor-pointer border border-indigo-400"
            >
              {t.playAgain}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function UnoGame() {
  return (
    <Suspense fallback={<div>Loading Casino UNO...</div>}>
      <UnoGameContent />
    </Suspense>
  );
}
