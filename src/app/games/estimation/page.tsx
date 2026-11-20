'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Card interface
interface Card {
  id: string;
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  score: number; // For sorting and trick winning
  suitColor: string;
}

// Player state
interface Player {
  name: string;
  isHuman: boolean;
  cards: Card[];
  bid: number | null;
  tricksWon: number;
}

// Chat message interface
interface ChatMessage {
  id: string;
  sender: 'you' | 'bot1' | 'bot2' | 'bot3' | 'dealer';
  senderName: string;
  text: string;
  time: string;
}

// Web Audio API Sound Synth for Casino Sound Effects
class CasinoSynth {
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
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
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

const synth = new CasinoSynth();

function EstimationGameContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'ar';
  const userId = searchParams.get('userId') || 'mock-user-developer-admin';

  // Game Phases: 'init' | 'shuffling' | 'dealing' | 'bidding' | 'playing' | 'gameover'
  const [phase, setPhase] = useState<'init' | 'shuffling' | 'dealing' | 'bidding' | 'playing' | 'gameover'>('init');
  const [players, setPlayers] = useState<Player[]>([]);
  const [trumpSuit, setTrumpSuit] = useState<'♠' | '♥' | '♦' | '♣'>('♠'); // Spades is default trump
  const [playedCards, setPlayedCards] = useState<{ [playerIdx: number]: Card }>({});
  const [turn, setTurn] = useState<number>(0); 
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [dealerMsg, setDealerMsg] = useState<string>('');
  
  const [playerEmotes, setPlayerEmotes] = useState<{
    [playerIdx: number]: {
      character: 'wizard' | 'iron_hero' | 'ranger' | null;
      message: string;
      active: boolean;
    }
  }>({
    0: { character: null, message: '', active: false },
    1: { character: null, message: '', active: false },
    2: { character: null, message: '', active: false },
    3: { character: null, message: '', active: false },
  });

  const triggerPlayerEmote = (playerIdx: number, character: 'wizard' | 'iron_hero' | 'ranger') => {
    const messages = {
      wizard: lang === 'ar' ? 'سحر أسطوري! 🧙‍♂️✨' : 'Mythical Magic! 🧙‍♂️✨',
      iron_hero: lang === 'ar' ? 'دفاع حديدي لا يُقهر! 🛡️⚡' : 'Invincible Iron Defense! 🛡️⚡',
      ranger: lang === 'ar' ? 'سهم في الصميم! 🏹🎯' : 'Bullseye strike! 🏹🎯',
    };

    setPlayerEmotes(prev => ({
      ...prev,
      [playerIdx]: {
        character,
        message: messages[character],
        active: true
      }
    }));

    setTimeout(() => {
      setPlayerEmotes(prev => ({
        ...prev,
        [playerIdx]: {
          ...prev[playerIdx],
          active: false,
          character: null
        }
      }));
    }, 3000);
  };

  // Custom Chat Feed
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Animate dealing tick counter
  const [dealtCardCount, setDealtCardCount] = useState<number>(0);

  const [profile, setProfile] = useState<any>(null);
  const [activeSkin, setActiveSkin] = useState<string>('default');
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['default']);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'shop'>('chat');

  useEffect(() => {
    const savedProfile = localStorage.getItem('gaming_portal_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    const savedUnlocked = localStorage.getItem('estimation_unlocked_skins');
    if (savedUnlocked) {
      setUnlockedSkins(JSON.parse(savedUnlocked));
    }

    const savedActive = localStorage.getItem('estimation_active_skin');
    if (savedActive) {
      setActiveSkin(savedActive);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'PROFILE_UPDATED') {
        setProfile(e.data.profile);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const skinsList = [
    { id: 'default', nameAr: 'طاولة المخمل الأخضر الكلاسيكية', nameEn: 'Municipal Green Felt', path: 'default', price: 0 },
    { id: 'walnut', nameAr: 'طاولة خشب الجوز الكلاسيكية', nameEn: 'Classic Walnut Wood', path: '/estimation_board_walnut.png', price: 150 },
    { id: 'emerald', nameAr: 'طاولة الزمرد الخضراء الفاخرة', nameEn: 'Classic Emerald Felt', path: '/estimation_board_emerald.png', price: 250 },
    { id: 'sapphire', nameAr: 'طاولة بحار السافير الزرقاء', nameEn: 'Sapphire Seas Casino', path: '/estimation_board_sapphire.png', price: 400 },
    { id: 'red_velvet', nameAr: 'طاولة المخمل الأحمر الأرابيسك', nameEn: 'Royal Red Velvet', path: '/estimation_board_red_velvet.png', price: 550 },
    { id: 'marble', nameAr: 'طاولة الرخام الأسود الفاخرة', nameEn: 'Luxury Black Marble', path: '/estimation_board_marble.png', price: 700 },
    { id: 'cyber', nameAr: 'طاولة السيبر نيون المستقبلية', nameEn: 'Neon Cyber Board', path: '/estimation_board_cyber.png', price: 850 },
    { id: 'leather', nameAr: 'طاولة الجلد الأسود الفاخرة', nameEn: 'Luxury Black Leather', path: '/estimation_board_leather.png', price: 1000 },
  ];

  const buySkin = (skinId: string, price: number) => {
    let currentProfile = profile;
    if (!currentProfile) {
      currentProfile = {
        id: 'guest',
        username: 'Guest',
        gold_coins: 1000,
        level: 1,
        xp: 0
      };
    }
    if (currentProfile.gold_coins < price) {
      alert(lang === 'ar' ? 'عملاتك غير كافية لشراء هذا المظهر! 🪙' : 'Not enough coins to buy this skin! 🪙');
      return;
    }

    currentProfile.gold_coins -= price;
    localStorage.setItem('gaming_portal_profile', JSON.stringify(currentProfile));
    setProfile({ ...currentProfile });

    const newUnlocked = [...unlockedSkins, skinId];
    setUnlockedSkins(newUnlocked);
    localStorage.setItem('estimation_unlocked_skins', JSON.stringify(newUnlocked));

    window.parent.postMessage({ type: 'UPDATE_PROFILE', profile: currentProfile }, '*');
    alert(lang === 'ar' ? 'تم شراء الطاولة بنجاح! 🎉' : 'Table skin purchased successfully! 🎉');
  };

  const applySkin = (skinId: string) => {
    setActiveSkin(skinId);
    localStorage.setItem('estimation_active_skin', skinId);
  };

  const t = {
    ar: {
      title: '🎰 كازينو الضاهر الملوكي (Royal Casino) 🎰',
      subtitle: 'استميشن حامي الوطيس • 4 لاعبين • ترمب سبيت (♠️) دائم',
      startBtn: '🪙 دفع 50 عملة وبدء تفنيط الورق (Buy-in 50)',
      shufflingText: '🃏 جاري تفنيط الكوتشينة خلطاً حقيقياً...',
      dealingText: '🎴 جاري توزيع الأوراق ورقة ورقة للاعبين...',
      estimateTitle: 'أختر تخمينك للجولة (Bids):',
      estimateTip: 'مجموع التخمينات لا يمكن أن يساوي 13 ورقة!',
      dealerSum13: 'المجموع 13! تم تعديل تخمين البوت الموزع ليصبح عادلاً 🃏',
      trumpLabel: 'الترمب الحاكم (♠️)',
      roundLabel: 'اللمة',
      winsLabel: 'اللمّات',
      bidLabel: 'تخمينه',
      youLabel: 'أنت',
      bot1Name: 'بوت الضاهر الساخر 🤖',
      bot2Name: 'المعلم كوتشينة 🎩',
      bot3Name: 'سيد الحظ 🎲',
      yourTurn: 'دورك! اختر كارت لتلعبه.',
      botTurn: 'دور {name} يخطط للمكر...',
      roundWinner: 'الفائز باللمة هو {name} 🎉',
      gameOverWin: '🎉 مبروك! حققت تخمينك بالدقة المحددة! حصلت على +150 عملة 🪙',
      gameOverLoss: '💥 لقد سقطت في التخمين (كولد)! تم خصم 50 عملة 🪙',
      playAgain: 'اللعب مجدداً 🔄',
      chatRoomTitle: '🎰 دردشة طاولة الكازينو الحية (Casino Live Chat)',
      dealerName: 'الموزع الكازينو 🤵'
    },
    en: {
      title: '🎰 Royal El-Daher Casino 🎰',
      subtitle: 'High-Stakes Estimation • 4 Players • Spades (♠️) Trump',
      startBtn: '🪙 Pay 50 Coins Buy-in to Shuffle',
      shufflingText: '🃏 Shuffling the deck with authentic dealers...',
      dealingText: '🎴 Dealing cards one-by-one to all players...',
      estimateTitle: 'Select your Bid (Tricks estimate):',
      estimateTip: 'Total bids sum cannot equal 13 tricks!',
      dealerSum13: 'Bids sum is 13! Dealer bot adjusted its bid to force a loser 🃏',
      trumpLabel: 'Trump Suit (♠️)',
      roundLabel: 'Trick',
      winsLabel: 'Tricks',
      bidLabel: 'Bid',
      youLabel: 'You',
      bot1Name: 'Witty Bot 🤖',
      bot2Name: 'Card Master 🎩',
      bot3Name: 'Luck Lord 🎲',
      yourTurn: 'Your turn! Select a card to play.',
      botTurn: "{name}'s turn... plotting their trick...",
      roundWinner: 'Trick Winner: {name} 🎉',
      gameOverWin: '🎉 Jackpot! You met your bid exactly! Earned +150 Gold 🪙',
      gameOverLoss: '💥 Busted! You failed your bid. Penalty -50 Gold 🪙',
      playAgain: 'Play Again 🔄',
      chatRoomTitle: '🎰 Casino Table Live Chat',
      dealerName: 'Casino Dealer 🤵'
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
    addChatMessage('dealer', t.dealerName, lang === 'ar' ? 'أهلاً بكم في كازينو الضاهر! جاري تفنيط الورق... ممنوع الغش! 🤵🃏' : 'Welcome to the Royal Casino! Shuffling cards... no cheating! 🤵🃏');

    setTimeout(() => {
      startDealingPhase();
    }, 2500);
  };

  // Step 2: Deal cards Animation
  const startDealingPhase = () => {
    setPhase('dealing');
    setDealtCardCount(0);
    addChatMessage('dealer', t.dealerName, lang === 'ar' ? 'جاري توزيع الأوراق الآن ورقة ورقة... حظاً سعيداً للجميع!' : 'Dealing the cards one-by-one... Good luck to everyone!');

    // Play deal sound ticks
    let count = 0;
    const interval = setInterval(() => {
      synth.playDealCard();
      count++;
      setDealtCardCount(count);
      if (count >= 13) {
        clearInterval(interval);
        setTimeout(() => {
          setupBidding();
        }, 300);
      }
    }, 1200 / 13);
  };

  // Step 3: Setup Bidding
  const setupBidding = () => {
    setPhase('bidding');
    setPlayedCards({});
    setCurrentRound(1);

    // Generate Standard Deck
    const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const colors = { '♠': 'text-indigo-400', '♥': 'text-rose-500', '♦': 'text-orange-500', '♣': 'text-emerald-400' };
    
    let tempDeck: Card[] = [];
    suits.forEach((suit) => {
      values.forEach((val, idx) => {
        tempDeck.push({
          id: `${suit}-${val}`,
          suit,
          value: val,
          score: idx + 2, 
          suitColor: colors[suit]
        });
      });
    });

    tempDeck.sort(() => Math.random() - 0.5);

    const p1Cards = tempDeck.slice(0, 13).sort((a, b) => b.score - a.score);
    const p2Cards = tempDeck.slice(13, 26).sort((a, b) => b.score - a.score);
    const p3Cards = tempDeck.slice(26, 39).sort((a, b) => b.score - a.score);
    const p4Cards = tempDeck.slice(39, 52).sort((a, b) => b.score - a.score);

    setPlayers([
      { name: t.youLabel, isHuman: true, cards: p1Cards, bid: null, tricksWon: 0 },
      { name: t.bot1Name, isHuman: false, cards: p2Cards, bid: null, tricksWon: 0 },
      { name: t.bot2Name, isHuman: false, cards: p3Cards, bid: null, tricksWon: 0 },
      { name: t.bot3Name, isHuman: false, cards: p4Cards, bid: null, tricksWon: 0 }
    ]);
  };

  // Submit Bid for Human and automatically simulate Bots
  const handleBidSubmit = (bidVal: number) => {
    let bot1Bid = Math.floor(Math.random() * 4); // 0 to 3
    let bot2Bid = Math.floor(Math.random() * 4);
    let currentSum = bidVal + bot1Bid + bot2Bid;
    let bot3Bid = Math.floor(Math.random() * 4);
    
    if (currentSum + bot3Bid === 13) {
      bot3Bid = bot3Bid === 0 ? 1 : bot3Bid - 1;
      setDealerMsg(t.dealerSum13);
      addChatMessage('dealer', t.dealerName, t.dealerSum13);
    } else {
      setDealerMsg('');
    }

    setPlayers((prev) => {
      const next = [...prev];
      next[0].bid = bidVal;
      next[1].bid = bot1Bid;
      next[2].bid = bot2Bid;
      next[3].bid = bot3Bid;
      return next;
    });

    // Write bids to chat feed
    addChatMessage('you', t.youLabel, lang === 'ar' ? `أنا هقدر بـ ${bidVal} لمات! 👑` : `I bid ${bidVal} tricks! 👑`);
    
    setTimeout(() => {
      addChatMessage('bot1', t.bot1Name, lang === 'ar' ? `أنا مقدر ${bot1Bid} لمة، اللعبة دي سهلة!` : `I bid ${bot1Bid} tricks, easy game!`);
    }, 400);

    setTimeout(() => {
      addChatMessage('bot2', t.bot2Name, bot2Bid === 0 
        ? (lang === 'ar' ? 'أنا هقول داش (0) مش عايز ولا لمة! 🚫' : 'Dash call! (0) tricks for me! 🚫')
        : (lang === 'ar' ? `أنا هقول ${bot2Bid} لمّة.` : `I bid ${bot2Bid} tricks.`));
    }, 800);

    setTimeout(() => {
      addChatMessage('bot3', t.bot3Name, lang === 'ar' ? `تخميني هو ${bot3Bid} لمات، ربنا يستر!` : `My bid is ${bot3Bid} tricks!`);
    }, 1200);

    setPhase('playing');
    setTurn(0); 
  };

  // Play card for human
  const playHumanCard = (card: Card) => {
    if (phase !== 'playing' || turn !== 0) return;
    
    synth.playCardPlay();
    setPlayedCards((prev) => ({ ...prev, 0: card }));
    setPlayers((prev) => {
      const next = [...prev];
      next[0].cards = next[0].cards.filter((c) => c.id !== card.id);
      return next;
    });

    addChatMessage('you', t.youLabel, lang === 'ar' ? `لعبت كارت الـ ${card.value} ${card.suit}` : `Played ${card.value} of ${card.suit}`);

    // Advance turn to Bot 1
    setTurn(1);
  };

  // Simulate bot turns automatically
  useEffect(() => {
    if (phase !== 'playing' || turn === 0) return;

    const timer = setTimeout(() => {
      const botIdx = turn;
      const bot = players[botIdx];
      
      if (!bot || !bot.cards || bot.cards.length === 0) return;
      
      let selectedCard = bot.cards[0];
      const leadingCard = playedCards[0]; 
      
      if (leadingCard) {
        const sameSuitCards = bot.cards.filter((c) => c.suit === leadingCard.suit);
        if (sameSuitCards.length > 0) {
          selectedCard = (bot.bid ?? 0) > bot.tricksWon ? sameSuitCards[0] : sameSuitCards[sameSuitCards.length - 1];
        } else {
          const trumps = bot.cards.filter((c) => c.suit === trumpSuit);
          if (trumps.length > 0 && (bot.bid ?? 0) > bot.tricksWon) {
            selectedCard = trumps[0];
          } else {
            selectedCard = bot.cards[bot.cards.length - 1];
          }
        }
      }

      if (!selectedCard) return;

      synth.playCardPlay();
      setPlayedCards((prev) => ({ ...prev, [botIdx]: selectedCard }));
      setPlayers((prev) => {
        const next = [...prev];
        next[botIdx].cards = next[botIdx].cards.filter((c) => c.id !== selectedCard.id);
        return next;
      });

      const senderId = botIdx === 1 ? 'bot1' : botIdx === 2 ? 'bot2' : 'bot3';
      addChatMessage(senderId, bot.name, lang === 'ar' ? `رميت كارت الـ ${selectedCard.value} ${selectedCard.suit}` : `Played ${selectedCard.value} of ${selectedCard.suit}`);

      // Bot occasionally emotes (20% chance)
      if (Math.random() < 0.20) {
        const emotes: ('wizard' | 'iron_hero' | 'ranger')[] = ['wizard', 'iron_hero', 'ranger'];
        triggerPlayerEmote(botIdx, emotes[Math.floor(Math.random() * emotes.length)]);
      }

      // Move to next player
      setTurn((prev) => (prev + 1) % 4);
    }, 600);

    return () => clearTimeout(timer);
  }, [turn, phase, players, playedCards, trumpSuit, lang]);

  // Evaluate Trick when all 4 cards are played
  useEffect(() => {
    if (Object.keys(playedCards).length !== 4) return;

    const timer = setTimeout(() => {
      let winnerIdx = 0;
      let highestScore = -1;

      const pCards = Object.entries(playedCards);
      const leadingSuit = pCards[0][1].suit; 

      pCards.forEach(([pIdxStr, card]) => {
        const pIdx = Number(pIdxStr);
        let calcScore = card.score;
        
        if (card.suit === trumpSuit) {
          calcScore += 100;
        } else if (card.suit !== leadingSuit) {
          calcScore = 0;
        }

        if (calcScore > highestScore) {
          highestScore = calcScore;
          winnerIdx = pIdx;
        }
      });

      // Update tricks won
      setPlayers((prev) => {
        const next = [...prev];
        next[winnerIdx].tricksWon += 1;
        return next;
      });

      const winner = players[winnerIdx];
      if (!winner) return;

      addChatMessage('dealer', t.dealerName, t.roundWinner.replace('{name}', winner.name));

      // Trigger bot comments on trick outcome
      if (winnerIdx === 0) {
        // You won
        const botComments = [
          lang === 'ar' ? 'المعلم كوتشينة: لسة اللعب طويل يا بطل!' : 'Card Master: Game is still young, champion!',
          lang === 'ar' ? 'سيد الحظ: ضربة حظ موفقة! 🎲' : 'Luck Lord: Lucky roll! 🎲'
        ];
        addChatMessage('bot2', t.bot2Name, botComments[Math.floor(Math.random() * botComments.length)]);
      } else {
        const botSender = winnerIdx === 1 ? 'bot1' : winnerIdx === 2 ? 'bot2' : 'bot3';
        const botName = winnerIdx === 1 ? t.bot1Name : winnerIdx === 2 ? t.bot2Name : t.bot3Name;
        const winLines = [
          lang === 'ar' ? 'دي بتاعتي يا رجالة! 😂' : 'This one is mine, boys! 😂',
          lang === 'ar' ? 'ولا كلمة، كسبت اللمة دي 🏆' : 'No words, trick is secured 🏆',
          lang === 'ar' ? 'خطتي عبقرية، صح؟' : 'My plan is absolute genius, right?'
        ];
        addChatMessage(botSender, botName, winLines[Math.floor(Math.random() * winLines.length)]);
      }

      // Reset played cards for next round
      setPlayedCards({});

      if (currentRound === 13) {
        // End of match! Check if human matched their bid
        const humanPlayer = players[0];
        if (!humanPlayer) return;
        const metBid = humanPlayer.bid === humanPlayer.tricksWon;
        setPhase('gameover');
        
        if (metBid) {
          synth.playJackpot();
          addChatMessage('dealer', t.dealerName, lang === 'ar' ? '🎉 مبروك! حققت تخمينك بالدقة المحددة! حصلت على +150 عملة 🪙' : '🎉 Jackpot! You met your bid exactly! Earned +150 Gold 🪙');
          window.parent.postMessage({ type: 'GAME_OVER', outcome: 'win', reward: 150 }, '*');
        } else {
          synth.playBuzzer();
          addChatMessage('dealer', t.dealerName, lang === 'ar' ? '💥 لقد خسرت الاستميشن (كولد)! حاول مجدداً 🎰' : '💥 Busted! You failed your bid. Penalty -50 Gold 🪙');
          window.parent.postMessage({ type: 'GAME_OVER', outcome: 'loss', penalty: 50 }, '*');
        }
      } else {
        setCurrentRound((prev) => prev + 1);
        setTurn(winnerIdx); 
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [playedCards, players, currentRound, trumpSuit, lang]);

  const handleBuyIn = () => {
    window.parent.postMessage({ type: 'BUY_IN', amount: 50 }, '*');
    startShufflePhase();
  };

  const renderEstimationPlayerCard = (playerIdx: number, defaultAvatar: string, positionClasses: string, bubbleDir: 'top' | 'bottom' | 'left' | 'right') => {
    const player = players[playerIdx];
    if (!player) return null;

    const isActive = turn === playerIdx && phase === 'playing';
    const idMap = {
      0: '#U-7794',
      1: '#B-1102',
      2: '#B-8839',
      3: '#B-4412'
    };

    const hasEmote = playerEmotes[playerIdx].active && playerEmotes[playerIdx].character !== null;
    const activeChar = playerEmotes[playerIdx].character;

    let avatarSymbol = defaultAvatar;
    let avatarBorder = 'border-amber-400';
    let avatarBg = 'bg-slate-900';

    if (activeChar === 'wizard') {
      avatarSymbol = '🧙‍♂️';
      avatarBorder = 'border-violet-400 animate-pulse scale-110';
      avatarBg = 'bg-violet-950';
    } else if (activeChar === 'iron_hero') {
      avatarSymbol = '🤖';
      avatarBorder = 'border-cyan-400 animate-pulse scale-110';
      avatarBg = 'bg-cyan-950';
    } else if (activeChar === 'ranger') {
      avatarSymbol = '🏹';
      avatarBorder = 'border-emerald-400 animate-pulse scale-110';
      avatarBg = 'bg-emerald-950';
    }

    return (
      <div className={`absolute ${positionClasses} z-20 flex flex-col items-center select-none`}>
        {/* Cartoon Speech Bubble popup */}
        {playerEmotes[playerIdx].active && (
          <div className={`absolute z-30 bg-slate-900 border border-amber-400 text-slate-100 px-2.5 py-1 rounded-lg shadow-xl text-[9px] font-sans font-bold whitespace-nowrap animate-bounce ${
            bubbleDir === 'bottom' ? 'bottom-[-40px] left-1/2 -translate-x-1/2' :
            bubbleDir === 'top' ? 'top-[-45px] left-1/2 -translate-x-1/2' :
            bubbleDir === 'left' ? 'right-[95px] top-1/2 -translate-y-1/2' :
            'left-[95px] top-1/2 -translate-y-1/2'
          }`}>
            {playerEmotes[playerIdx].message}
            <div className={`absolute w-1.5 h-1.5 bg-slate-900 border-l border-b border-amber-400 rotate-45 ${
              bubbleDir === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 border-l-0 border-b-0 border-r border-t' :
              bubbleDir === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2 border-r-0 border-t-0 border-l border-b' :
              bubbleDir === 'left' ? '-left-1 top-1/2 -translate-y-1/2 border-r-0 border-t-0 border-l border-b rotate-[225deg]' :
              '-left-1 top-1/2 -translate-y-1/2 border-r-0 border-t-0 border-l border-b rotate-[45deg]'
            }`} />
          </div>
        )}

        {/* Cute Card Body */}
        <div className={`bg-slate-950/90 border-2 ${
          isActive ? 'border-amber-400 shadow-amber-500/20 scale-105' : 'border-slate-800'
        } rounded-2xl p-2 flex items-center gap-2 w-32 shadow-2xl transition-all duration-300 relative`}>
          
          {/* Avatar Container */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 shadow-inner select-none pointer-events-none transition-all duration-300 ${avatarBg} ${avatarBorder} relative`}>
            <span>{avatarSymbol}</span>
            <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-[8px] text-white w-4.5 h-4.5 rounded-full border border-slate-900 flex items-center justify-center font-mono font-bold">
              {player.bid !== undefined ? player.bid : '-'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-[9px] font-black text-amber-300 truncate leading-tight block">
              {playerIdx === 0 ? t.youLabel : player.name}
            </span>
            <span className="text-[7.5px] font-sans font-bold text-slate-500 block leading-none mb-1">
              {idMap[playerIdx as keyof typeof idMap]}
            </span>
            <span className="text-[8px] font-sans font-bold text-slate-400 block leading-none">
              {t.winsLabel}: {player.tricksWon}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-emerald-100 flex flex-col md:flex-row font-sans select-none overflow-hidden relative">
      
      {/* Blurred Game Card Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center -z-20 scale-105"
        style={{
          backgroundImage: "url('/estimation_card.jpg')",
          filter: 'brightness(0.35) saturate(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 -z-10" />
      
      {/* LEFT SIDE: Card Table felt space (3/4 width) */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 relative border-r border-emerald-950/60">
        
        {/* Satirical Casino felt style header */}
        <header className="text-center py-2 border-b border-emerald-900/30 w-full z-10 bg-slate-950/40 rounded-xl">
          <h2 className="text-base font-black text-amber-400 tracking-widest">{t.title}</h2>
          <p className="text-[9px] text-emerald-500 font-mono">{t.subtitle}</p>
        </header>

        {/* Shuffling Screen animation */}
        {phase === 'shuffling' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-20">
            {/* Real card shuffling simulator animation stack */}
            <div className="relative w-44 h-32 flex items-center justify-center">
              <div className="absolute w-20 h-28 bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-400 rounded-xl shadow-lg animate-[shuffle-left_0.4s_infinite_alternate] flex items-center justify-center text-slate-100 font-bold text-lg select-none">
                🃏
              </div>
              <div className="absolute w-20 h-28 bg-gradient-to-br from-indigo-700 to-indigo-900 border-2 border-indigo-400 rounded-xl shadow-lg animate-[shuffle-right_0.4s_infinite_alternate] flex items-center justify-center text-slate-100 font-bold text-lg select-none">
                ♠️
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
            <div className="relative w-64 h-64 border-2 border-dashed border-emerald-800/40 rounded-full flex items-center justify-center">
              {/* Fly card visual */}
              <div className="absolute w-12 h-16 bg-slate-900 border border-amber-400 rounded-lg animate-[deal-fly_0.1s_infinite] shadow-md flex items-center justify-center text-xs font-bold">
                🎴
              </div>

              {/* Player seat indicator */}
              <div className="absolute top-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">BOT 2</div>
              <div className="absolute left-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">BOT 1</div>
              <div className="absolute right-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">BOT 3</div>
              <div className="absolute bottom-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">YOU</div>

              <div className="text-center">
                <span className="text-[10px] text-emerald-500 font-mono block">توزيع الأوراق</span>
                <span className="text-xs text-amber-400 font-bold font-mono">{dealtCardCount} / 13</span>
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
            <span className="text-6xl animate-bounce">🃏</span>
            <button
              onClick={handleBuyIn}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-full text-xs shadow-lg hover:shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer border-2 border-yellow-300"
            >
              {t.startBtn}
            </button>
          </div>
        )}

        {phase === 'bidding' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-5">
            <span className="text-xl font-bold text-amber-300">{t.estimateTitle}</span>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {[0, 1, 2, 3, 4, 5, 6].map((bidVal) => (
                <button
                  key={bidVal}
                  onClick={() => handleBidSubmit(bidVal)}
                  className="w-12 h-12 bg-slate-950 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-600 hover:text-slate-950 rounded-xl font-black text-sm active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                >
                  {bidVal === 0 ? 'D' : bidVal}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-emerald-600 italic font-mono">{t.estimateTip}</p>
          </div>
        )}

        {(phase === 'playing' || phase === 'gameover') && (
          <div className="flex-1 w-full max-w-[700px] h-[520px] relative my-auto">
            {/* The Green Oval Gambling Table */}
            <div 
              className={`absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[560px] h-[310px] flex items-center justify-center transition-all duration-300 ${
                activeSkin === 'default' 
                  ? 'rounded-[180px] bg-gradient-to-b from-[#0a4622] via-[#062c15] to-[#03190c] border-[6px] border-[#d4af37] shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_10px_30px_rgba(0,0,0,0.8)]' 
                  : 'rounded-[24px] border-[4px] border-[#c3b996]/45 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden'
              }`}
              style={
                activeSkin === 'default'
                  ? {}
                  : {
                      backgroundImage: `url(${skinsList.find(s => s.id === activeSkin)?.path})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
              }
            >
              
              {/* Inner felt pattern */}
              <div className="absolute inset-4 rounded-[160px] border border-emerald-500/10 pointer-events-none" />

              {/* Cards played zone inside the table */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Played Card 0 (You - Bottom) */}
                {playedCards[0] && (
                  <div className={`absolute bottom-6 p-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-bold shadow-2xl w-14 h-20 flex flex-col justify-between z-10 ${playedCards[0].suitColor}`}>
                    <span className="text-sm">{playedCards[0].value}</span>
                    <span className="text-right text-lg">{playedCards[0].suit}</span>
                  </div>
                )}
                {/* Played Card 1 (Bot 1 - Left) */}
                {playedCards[1] && (
                  <div className={`absolute left-10 p-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-bold shadow-2xl w-14 h-20 flex flex-col justify-between z-10 ${playedCards[1].suitColor}`}>
                    <span className="text-sm">{playedCards[1].value}</span>
                    <span className="text-right text-lg">{playedCards[1].suit}</span>
                  </div>
                )}
                {/* Played Card 2 (Bot 2 - Top) */}
                {playedCards[2] && (
                  <div className={`absolute top-6 p-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-bold shadow-2xl w-14 h-20 flex flex-col justify-between z-10 ${playedCards[2].suitColor}`}>
                    <span className="text-sm">{playedCards[2].value}</span>
                    <span className="text-right text-lg">{playedCards[2].suit}</span>
                  </div>
                )}
                {/* Played Card 3 (Bot 3 - Right) */}
                {playedCards[3] && (
                  <div className={`absolute right-10 p-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-bold shadow-2xl w-14 h-20 flex flex-col justify-between z-10 ${playedCards[3].suitColor}`}>
                    <span className="text-sm">{playedCards[3].value}</span>
                    <span className="text-right text-lg">{playedCards[3].suit}</span>
                  </div>
                )}

                {/* Table Info Center */}
                <div className="text-[10px] text-emerald-600/70 font-mono flex flex-col items-center select-none pointer-events-none">
                  <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">{t.roundLabel} {currentRound} / 13</span>
                  <span className="text-[9px] mt-1 text-amber-500 font-bold">{t.trumpLabel}</span>
                </div>
              </div>
            </div>

            {/* Top Player: Bot 2 (Card Master) */}
            {renderEstimationPlayerCard(2, '🎩', 'top-[40px] left-1/2 -translate-x-1/2', 'bottom')}

            {/* Left Player: Bot 1 (Witty Bot) */}
            {renderEstimationPlayerCard(1, '🤖', 'left-[10px] top-[40%] -translate-y-1/2', 'right')}

            {/* Right Player: Bot 3 (Luck Lord) */}
            {renderEstimationPlayerCard(3, '🎲', 'right-[10px] top-[40%] -translate-y-1/2', 'left')}

            {/* Bottom Player: You */}
            {renderEstimationPlayerCard(0, '👑', 'bottom-[142px] left-1/2 -translate-x-1/2', 'top')}

            {/* Bottom Row: Human Cards & Actions */}
            <div className="absolute bottom-0 left-0 right-0 z-30 space-y-1 bg-slate-950/60 p-2 rounded-2xl border border-emerald-950/30 backdrop-blur-md">
              <div className="text-center text-[10px] text-amber-400 font-bold font-mono">
                {turn === 0 ? t.yourTurn : t.botTurn.replace('{name}', players[turn]?.name)}
              </div>

              {/* Hand cards deck - Scrollable and enlarged! */}
              <div className="flex gap-2 overflow-x-auto py-3 px-4 justify-start max-w-full h-[120px] scrollbar-thin scrollbar-thumb-amber-600/40 scrollbar-track-transparent relative">
                {/* Floating Emote Selector Panel for You */}
                <div className="absolute right-2 top-2 z-40 flex items-center gap-1 bg-slate-950/95 border border-amber-500/30 p-1 rounded-xl shadow-lg">
                  <button 
                    onClick={() => triggerPlayerEmote(0, 'wizard')}
                    className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={lang === 'ar' ? 'الساحر 🧙‍♂️' : 'Wizard 🧙‍♂️'}
                  >
                    🧙‍♂️
                  </button>
                  <button 
                    onClick={() => triggerPlayerEmote(0, 'iron_hero')}
                    className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={lang === 'ar' ? 'البطل الحديدي 🤖' : 'Iron Hero 🤖'}
                  >
                    🤖
                  </button>
                  <button 
                    onClick={() => triggerPlayerEmote(0, 'ranger')}
                    className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={lang === 'ar' ? 'الرينجر 🏹' : 'Ranger 🏹'}
                  >
                    🏹
                  </button>
                </div>

                {players[0]?.cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => playHumanCard(card)}
                    disabled={turn !== 0 || phase !== 'playing'}
                    className={`shrink-0 w-14 h-20 bg-slate-900 border border-slate-700/80 hover:border-amber-400 hover:-translate-y-3 rounded-lg flex flex-col justify-between p-2 text-sm font-black shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${card.suitColor}`}
                  >
                    <span>{card.value}</span>
                    <span className="text-right text-lg">{card.suit}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {phase === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
            {players[0].bid === players[0].tricksWon ? (
              <>
                <span className="text-6xl animate-bounce">👑🏆🎰</span>
                <h3 className="text-2xl font-black text-amber-400">{t.gameOverWin}</h3>
              </>
            ) : (
              <>
                <span className="text-6xl">💥😭📢</span>
                <h3 className="text-xl font-bold text-rose-500">{t.gameOverLoss}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {t.bidLabel}: {players[0].bid} | {t.winsLabel}: {players[0].tricksWon}
                </p>
              </>
            )}

            <button
              onClick={handleBuyIn}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-full text-xs active:scale-95 transition-all cursor-pointer border border-indigo-400"
            >
              {t.playAgain}
            </button>
          </div>
        )}

      </div>

      {/* RIGHT SIDE: Chat Feed / Table Shop Tabbed Sidebar */}
      <div className="w-full md:w-80 bg-slate-950/80 border-t md:border-t-0 md:border-l border-emerald-950/60 flex flex-col h-[35vh] md:h-screen z-40">
        {/* Tabs header */}
        <div className="border-b border-emerald-950/60 bg-slate-950 flex shrink-0">
          <button
            onClick={() => setSidebarTab('chat')}
            className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              sidebarTab === 'chat'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-emerald-600/70 hover:text-emerald-500 hover:bg-slate-900/20'
            }`}
          >
            {lang === 'ar' ? '💬 الدردشة' : '💬 Chat'}
          </button>
          <button
            onClick={() => setSidebarTab('shop')}
            className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              sidebarTab === 'shop'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-emerald-600/70 hover:text-emerald-500 hover:bg-slate-900/20'
            }`}
          >
            {lang === 'ar' ? '💎 المتجر' : '💎 Shop'}
          </button>
        </div>

        {/* Tab 1: Chat Feed */}
        {sidebarTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable feed messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <span className="text-[10px] text-slate-600 italic">
                    {lang === 'ar' ? 'انتظر تفنيط الكوتشينة لبدء الدردشة...' : 'Waiting for cards shuffle to talk...'}
                  </span>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isDealer = msg.sender === 'dealer';
                  const isYou = msg.sender === 'you';
                  
                  let bubbleClass = "bg-slate-900 border-slate-800 text-slate-300";
                  let nameClass = "text-emerald-500";
                  
                  if (isDealer) {
                    bubbleClass = "bg-amber-950/20 border-amber-900/30 text-amber-300/90";
                    nameClass = "text-amber-400 font-black";
                  } else if (isYou) {
                    bubbleClass = "bg-indigo-950/20 border-indigo-900/30 text-indigo-200";
                    nameClass = "text-indigo-400 font-bold";
                  } else {
                    nameClass = "text-purple-400 font-semibold";
                  }

                  return (
                    <div key={msg.id} className={`flex flex-col ${isYou ? 'items-end' : 'items-start'} space-y-1 animate-fade-in`}>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                        <span className={nameClass}>{msg.senderName}</span>
                        <span>•</span>
                        <span className="font-mono">{msg.time}</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border text-[11px] font-sans leading-relaxed max-w-[85%] ${bubbleClass} ${
                        isYou ? 'rounded-tr-none' : 'rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-emerald-950/60 bg-slate-950/80 flex items-center justify-between text-[9px] text-slate-500 font-mono shrink-0">
              <span>{lang === 'ar' ? 'البث: طاولة #412' : 'Broadcast: Table #412'}</span>
              <span>{lang === 'ar' ? 'رصيدك: 🪙 ' : 'Coins: 🪙 '}{profile ? profile.gold_coins : 1000}</span>
            </div>
          </div>
        )}

        {/* Tab 2: Table Shop */}
        {sidebarTab === 'shop' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-900/40 border-b border-emerald-950/40 text-center shrink-0">
              <span className="text-[10px] text-amber-400 font-bold block">
                {lang === 'ar' ? '🪙 رصيدك الحالي:' : '🪙 Current Balance:'}
              </span>
              <span className="text-sm font-black text-white font-mono">
                {profile ? profile.gold_coins : 1000} 🪙
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
              {skinsList.map((skin) => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isActive = activeSkin === skin.id;

                return (
                  <div 
                    key={skin.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col space-y-2.5 ${
                      isActive 
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5' 
                        : 'bg-slate-900/40 border-emerald-950/50 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Skin Preview Card */}
                    <div className="flex gap-2.5 items-center">
                      <div 
                        className="w-14 h-10 rounded border border-slate-700/60 bg-slate-950/50 shrink-0"
                        style={
                          skin.id === 'default'
                            ? { background: 'radial-gradient(circle, #0a4622 0%, #03190c 100%)' }
                            : { backgroundImage: `url(${skin.path})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-amber-400 block truncate">
                          {lang === 'ar' ? skin.nameAr : skin.nameEn}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                          {skin.price === 0 ? (lang === 'ar' ? 'مجانية' : 'Free') : `${skin.price} 🪙`}
                        </span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex justify-end">
                      {isActive ? (
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-black rounded-lg border border-amber-500/30 uppercase">
                          {lang === 'ar' ? 'نشطة 🟢' : 'Active 🟢'}
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => applySkin(skin.id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[9px] font-black rounded-lg cursor-pointer transition-all active:scale-95 border border-amber-400"
                        >
                          {lang === 'ar' ? 'تطبيق' : 'Apply'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buySkin(skin.id, skin.price)}
                          className="px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-[9px] font-black rounded-lg cursor-pointer transition-all active:scale-95 border border-amber-400"
                        >
                          {lang === 'ar' ? 'شراء' : 'Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function EstimationGame() {
  return (
    <Suspense fallback={<div>Loading Casino Room...</div>}>
      <EstimationGameContent />
    </Suspense>
  );
}
