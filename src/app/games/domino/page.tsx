'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Domino Tile representation
interface DominoTile {
  id: string;
  left: number;
  right: number;
}

// Player representation
interface DominoPlayer {
  name: string;
  isHuman: boolean;
  cards: DominoTile[];
}

// Chat message interface
interface ChatMessage {
  id: string;
  sender: 'you' | 'bot1' | 'bot2' | 'bot3' | 'dealer';
  senderName: string;
  text: string;
  time: string;
}

// Web Audio API Sound Synthesizer
class DominoSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playClack() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);
    
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.start();
    osc.stop(now + 0.05);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(450, now);
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.start();
    osc2.stop(now + 0.08);
  }

  playSlam() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Deep bass thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
    
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.start();
    osc.stop(now + 0.25);

    // High wood clack
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(550, now);
    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    
    osc2.start();
    osc2.stop(now + 0.09);
  }

  playShuffle() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    for (let s = 0; s < 10; s++) {
      const time = now + s * 0.15;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500 + Math.random() * 200, time);
      filter.Q.setValueAtTime(3.0, time);

      const gain = this.ctx.createGain();
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      noise.start(time);
      noise.stop(time + 0.13);
    }
  }

  playDeal() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  playDraw() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(420, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
}

const synth = new DominoSynth();

// Helper Component to render Pips/Dots
function DominoHalf({ val, large = false }: { val: number; large?: boolean }) {
  const pipMaps: Record<number, number[]> = {
    0: [],
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 3, 6, 2, 5, 8]
  };

  const activePips = pipMaps[val] || [];

  return (
    <div className={`grid grid-cols-3 gap-0.5 justify-items-center items-center ${large ? 'w-9 h-9 p-1' : 'w-6 h-6 p-0.5'}`}>
      {Array.from({ length: 9 }).map((_, idx) => {
        const isPip = activePips.includes(idx);
        return (
          <div
            key={idx}
            className={`${large ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full transition-all duration-300 ${
              isPip 
                ? 'bg-gradient-to-br from-[#18181b] to-[#27272a] shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.85),_0_0.5px_0.5px_rgba(255,255,255,0.4)]' 
                : 'bg-transparent'
            }`}
          />
        );
      })}
    </div>
  );
}

// Domino Tile component
interface RenderDominoProps {
  tile: DominoTile;
  vertical?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  compulsoryGlow?: boolean;
  ghost?: boolean;
  val1?: number;
  val2?: number;
  large?: boolean;
}

function RenderDomino({
  tile,
  vertical = false,
  onClick,
  disabled = false,
  highlighted = false,
  compulsoryGlow = false,
  ghost = false,
  val1,
  val2,
  large = false
}: RenderDominoProps) {
  const finalVertical = vertical;

  const displayLeft = val1 !== undefined ? val1 : tile.left;
  const displayRight = val2 !== undefined ? val2 : tile.right;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-sm flex items-center justify-center transition-all duration-150 cursor-pointer disabled:cursor-not-allowed select-none ${
        large 
          ? finalVertical ? 'flex-col w-12 h-24 py-2' : 'flex-row w-24 h-12 px-2'
          : finalVertical ? 'flex-col w-7 h-14 py-1' : 'flex-row w-14 h-7 px-1'
      } ${
        ghost
          ? 'opacity-40 border-2 border-dashed border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-400/50 animate-pulse shadow-none'
          : disabled
            ? 'bg-gradient-to-br from-[#f3eecd] to-[#d3ca9e] border-t border-l border-white/60 border-b border-r border-[#968d66] shadow-[0_1px_2px_rgba(0,0,0,0.2)] opacity-90'
            : highlighted
              ? `bg-gradient-to-br from-[#ffffff] via-[#fdfbf6] to-[#eae0be] border-t border-l border-white/95 border-b border-r border-[#968d66] -translate-y-1 z-10 shadow-[0_5px_0_#807750,0_8px_10px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.7)] ${compulsoryGlow ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#110803] animate-pulse' : ''}`
              : 'bg-gradient-to-br from-[#ffffff] via-[#fdfbf7] to-[#e7dec0] border-t border-l border-white/95 border-b border-r border-[#968d66] shadow-[0_3px_0_#807750,0_4px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)] hover:border-amber-400 hover:shadow-[0_4px_0_#807750,0_6px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.7)] hover:-translate-y-0.5'
      }`}
      style={{
        margin: '0',
      }}
    >
      <DominoHalf val={displayLeft} large={large} />
      <div
        className={`${
          finalVertical ? 'w-full h-[1.5px] my-0.5' : 'h-full w-[1.5px] mx-0.5'
        } bg-gradient-to-br from-[#807750]/60 to-[#fffefc]/80`}
      />
      <DominoHalf val={displayRight} large={large} />
      
      {!ghost && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ffe680] via-[#d4af37] to-[#8a6d0f] border border-[#d4af37]/50 shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] z-20 ${large ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
      )}
    </button>
  );
}

function RenderDominoBack({ onClick, disabled = false }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-10 h-20 rounded-sm bg-[#faf8f0] border border-[#d2caab] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:border-amber-500/70 hover:shadow-[0_5px_10px_rgba(245,158,11,0.15)] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 relative flex items-center justify-center overflow-hidden"
    >
      {/* Polished ivory inner bevel border */}
      <div className="absolute inset-1 border border-white/80 rounded-sm pointer-events-none" />
      
      {/* Soft polished reflection on the flat plain back */}
      <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
    </button>
  );
}

function DominoGameContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'ar';
  const userId = searchParams.get('userId') || 'mock-user-developer-admin';

  // Game Mode: 'single' (2 players, 101 target) vs 'partnership' (4 players, 151 target)
  const [gameMode, setGameMode] = useState<'single' | 'partnership'>('single');

  // Tournament Cumulative Partnership Scores
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);

  // Round states
  const [phase, setPhase] = useState<'init' | 'shuffling' | 'dealing' | 'playing' | 'roundover' | 'gameover'>('init');
  const [players, setPlayers] = useState<DominoPlayer[]>([]);
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
      wizard: lang === 'en' ? 'Mythical Magic! 🧙‍♂️✨' : 'سحر أسطوري! 🧙‍♂️✨',
      iron_hero: lang === 'en' ? 'Invincible Iron Defense! 🛡️⚡' : 'دفاع حديدي لا يُقهر! 🛡️⚡',
      ranger: lang === 'en' ? 'Bullseye strike! 🏹🎯' : 'سهم في الصميم! 🏹🎯',
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

  const [boneyard, setBoneyard] = useState<DominoTile[]>([]);
  const [boardTrain, setBoardTrain] = useState<DominoTile[]>([]);
  const [leftEnd, setLeftEnd] = useState<number | null>(null);
  const [rightEnd, setRightEnd] = useState<number | null>(null);
  const [turn, setTurn] = useState<number>(0); // 0: You, 1: Bot1, 2: Bot2, 3: Bot3
  const [lastRoundWinner, setLastRoundWinner] = useState<number | null>(null);
  const [dealtCount, setDealtCount] = useState<number>(0);
  const [selectedHandTile, setSelectedHandTile] = useState<DominoTile | null>(null);
  const [startingTileId, setStartingTileId] = useState<string | null>(null);
  const [layoutPattern, setLayoutPattern] = useState<'S-shape' | 'inverse-S'>('S-shape');

  // Pass Turn Countdown Timer (5 seconds)
  const [passTimer, setPassTimer] = useState<number | null>(null);
  const [shouldShake, setShouldShake] = useState<boolean>(false);
  const [joltActive, setJoltActive] = useState<boolean>(false);

  // Round summary state
  const [roundWinnerName, setRoundWinnerName] = useState<string>('');
  const [roundPointsGained, setRoundPointsGained] = useState<number>(0);

  // Chat feed logs
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const targetScore = gameMode === 'single' ? 101 : 151;

  const userHasMove = players[0] && (boardTrain.length === 0 || players[0].cards.some(
    (tile) => tile.left === leftEnd || tile.right === leftEnd || tile.left === rightEnd || tile.right === rightEnd
  ));

  const [profile, setProfile] = useState<any>(null);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['default']);
  const [activeSkin, setActiveSkin] = useState<string>('default');

  useEffect(() => {
    const saved = localStorage.getItem('gaming_portal_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    const savedSkins = localStorage.getItem('domino_unlocked_skins');
    if (savedSkins) {
      setUnlockedSkins(JSON.parse(savedSkins));
    } else {
      localStorage.setItem('domino_unlocked_skins', JSON.stringify(['default']));
    }
    const savedActive = localStorage.getItem('domino_active_skin');
    if (savedActive) {
      setActiveSkin(savedActive);
    }
  }, []);

  const skinsList = [
    { id: 'default', nameAr: 'طاولة العشب البلدية الخضراء', nameEn: 'Municipal Green Felt Table', path: 'default', price: 0 },
    { id: 'wood', nameAr: 'طاولة الخشب البني الفاخر', nameEn: 'Premium Mahogany Wood', path: '/domino_board_wood.jpg', price: 100 },
    { id: 'marble', nameAr: 'طاولة الرخام الأسود الأنيق', nameEn: 'Luxury Black Marble', path: '/domino_board_marble.png', price: 150 },
    { id: 'cyber', nameAr: 'طاولة السيبر نيون المستقبلية', nameEn: 'Neon Cyber Board', path: '/domino_board_cyber.png', price: 200 },
    { id: 'gray_gold', nameAr: 'طاولة الرمادي والخطوط الذهبية', nameEn: 'Modern Gray & Gold', path: '/domino_board_gray_gold.png', price: 300 },
    { id: 'arabesque', nameAr: 'طاولة الأرابيسك الشرقية الفاخرة', nameEn: 'Premium Oriental Arabesque', path: '/domino_board_arabesque.png', price: 400 },
    { id: 'cyber_neon', nameAr: 'طاولة السيبر نيون اللامعة', nameEn: 'Cyber Neon Glow', path: '/domino_board_cyber_neon.png', price: 500 },
    { id: 'royal_red', nameAr: 'طاولة المخمل الأحمر الملكية', nameEn: 'Royal Red Velvet', path: '/domino_board_royal_red.png', price: 600 },
    { id: 'royal_blue', nameAr: 'طاولة المخمل الأزرق الملكية', nameEn: 'Royal Blue Velvet', path: '/domino_board_royal_blue.png', price: 700 },
  ];

  const buySkin = (skinId: string, price: number) => {
    let currentProfile = profile;
    if (!currentProfile) {
      currentProfile = {
        id: 'guest',
        username: 'Legend',
        gold_coins: 1000,
        unlocked_emotes: []
      };
    }
    if (currentProfile.gold_coins < price) {
      alert(lang === 'ar' ? '⚠️ عذراً، لا تمتلك عملات كافية للشراء!' : '⚠️ Sorry, not enough coins!');
      return;
    }

    currentProfile.gold_coins -= price;
    localStorage.setItem('gaming_portal_profile', JSON.stringify(currentProfile));
    setProfile({ ...currentProfile });

    const nextSkins = [...unlockedSkins, skinId];
    setUnlockedSkins(nextSkins);
    localStorage.setItem('domino_unlocked_skins', JSON.stringify(nextSkins));

    window.parent.postMessage({ type: 'UPDATE_PROFILE', profile: currentProfile }, '*');
    alert(lang === 'ar' ? '🎉 تم الشراء بنجاح! يمكنك الآن تطبيق المظهر.' : '🎉 Purchase successful! You can now apply the skin.');
  };

  const applySkin = (skinId: string) => {
    setActiveSkin(skinId);
    localStorage.setItem('domino_active_skin', skinId);
  };

  const t = {
    ar: {
      title: '🎲 صالة الدومينو البلدية المتميزة 🎲',
      subtitle: `بطولة الدومينو البلدي (${gameMode === 'single' ? 'لاعب ضد لاعب إلى 101' : 'شراكة 4 لاعبين إلى 151'})`,
      modeLabel: 'اختر طريقة اللعب:',
      modeSingle: 'فردي (2 لاعبين - هدف 101) 👤 vs 🤖',
      modePartnership: 'زوجي (شراكة 4 لاعبين - هدف 151) 👥 vs 👥',
      startBtn: '🪙 دفع 50 عملة والبدء بتفنيط الدومينو',
      shufflingText: '🀄 جاري خلط وغسيل أحجار الدومينو على طاولة القهوة...',
      dealingText: '🀄 جاري سحب 7 بلاطات لكل لاعب...',
      yourTurn: 'دورك! اختر بلاطة مناسبة، أو اضغط على خيال الحجر على أطراف الطاولة لتحديد مكانه.',
      botTurn: 'عزت يدرس أطراف الطاولة ويخطط لحبس أوراقك...',
      playAgain: 'تحدي جديد 🔄',
      nextRoundBtn: 'الدور التالي ⏭️',
      dealerName: 'القهوجي عزت 🤵',
      chatTitle: '☕ شات مقهى الدومينو الحي (Domino Cafe Log)',
      endsLabel: 'الأطراف المفتوحة',
      gameOverWin: `🏆 مبروك! فزت ووصلت إلى ${targetScore} نقطة أولاً! حصلت على +150 عملة 🪙`,
      gameOverLoss: `💥 خسارة! لقد وصل الخصم إلى ${targetScore} نقطة أولاً. خصم 50 عملة 🪙`,
      youLabel: 'أنت',
      bot1Name: 'عزت أونو 🤖',
      bot2Name: 'شريكك البوت 🤝',
      bot3Name: 'فريد البوت 🎲',
      scoreLabel: 'النقاط التراكمية',
      roundOverTitle: 'نهاية الدور الحالي!',
      roundWinnerMsg: 'الفائز بالدور: {winner} (كسب +{points} نقطة لمجموع فريقه)',
      passWarning: 'مش معاك كروت! اضغط "مش معايا" خلال {time} ثواني لتمرير الدور ⏭️',
      passBtn: 'مش معايا ⏭️',
      drawBtn: 'سحب بلاطة ➕',
      boneyardLabel: 'السحب المتبقي'
    },
    en: {
      title: '🎲 Classic Dominoes Cafe 🎲',
      subtitle: `Dominoes Tournament (${gameMode === 'single' ? '1v1 target 101' : '4-players partnership target 151'})`,
      modeLabel: 'Choose Game Mode:',
      modeSingle: 'Single (1v1 - Target 101) 👤 vs 🤖',
      modePartnership: 'Partnership (4-Players - Target 151) 👥 vs 👥',
      startBtn: '🪙 Pay 50 Coins Buy-in to Shuffle',
      shufflingText: '🀄 Washing and shuffling the pips tiles...',
      dealingText: '🀄 Dealing 7 tiles to each player...',
      yourTurn: 'Your turn! Select a tile, then click its ghost preview on the board ends to place it.',
      botTurn: 'Ezzo is studying the table ends to block you...',
      playAgain: 'Play Again 🔄',
      nextRoundBtn: 'Next Round ⏭️',
      dealerName: 'Cafe Waiter Ezzo 🤵',
      chatTitle: '☕ Domino Cafe Chat & Log',
      endsLabel: 'Open Ends',
      gameOverWin: `🏆 Tournament Victory! Reached ${targetScore} points! Earned +150 Gold 🪙`,
      gameOverLoss: `💥 Defeat! Opponent reached ${targetScore} points first. Penalty -50 Gold 🪙`,
      youLabel: 'You',
      bot1Name: 'Ezzo Bot 🤖',
      bot2Name: 'Your Partner 🤝',
      bot3Name: 'Fared Bot 🎲',
      scoreLabel: 'Cumulative Score',
      roundOverTitle: 'Round Over!',
      roundWinnerMsg: 'Round Winner: {winner} (Gained +{points} points for Team)',
      passWarning: 'No moves! Click "Pass" in {time}s to skip ⏭️',
      passBtn: 'Pass ⏭️',
      drawBtn: 'Draw Tile ➕',
      boneyardLabel: 'Boneyard tiles'
    }
  }[lang];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addChatMessage = (sender: ChatMessage['sender'], senderName: string, text: string) => {
    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChatMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, sender, senderName, text, time }]);
  };

  const startShuffle = () => {
    setTeam1Score(0);
    setTeam2Score(0);
    synth.playShuffle();
    setPhase('shuffling');
    setChatMessages([]);
    addChatMessage('dealer', t.dealerName, lang === 'ar' 
      ? `يا هلا بالمعلمين! بدأت لعبة دومينو بنظام (${gameMode === 'single' ? 'فردي إلى 101' : 'زوجي شراكة إلى 151'})... ☕🀄` 
      : `Welcome! Game started in (${gameMode === 'single' ? 'Single 101' : 'Partnership 151'}) mode... ☕🀄`);

    setTimeout(() => {
      startDealing();
    }, 2500);
  };

  const startNextRound = () => {
    synth.playShuffle();
    setPhase('shuffling');
    addChatMessage('dealer', t.dealerName, lang === 'ar' ? 'جاري خلط الدومينو للجولة التالية...' : 'Shuffling for the next round...');

    setTimeout(() => {
      startDealing();
    }, 2500);
  };

  const startDealing = () => {
    setPhase('dealing');
    setDealtCount(0);

    let count = 0;
    const interval = setInterval(() => {
      synth.playDeal();
      count++;
      setDealtCount(count);
      if (count >= 7) {
        clearInterval(interval);
        setTimeout(() => {
          setupDominoes();
        }, 300);
      }
    }, 1500 / 7);
  };

  const setupDominoes = () => {
    const tiles: DominoTile[] = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        tiles.push({ id: `tile-${i}-${j}`, left: i, right: j });
      }
    }

    tiles.sort(() => Math.random() - 0.5);

    const player = tiles.slice(0, 7);
    const bot1 = tiles.slice(7, 14);

    let pCards: DominoTile[][] = [];

    if (gameMode === 'single') {
      // 2 Players: You & Bot 1. Rest go to boneyard.
      const bone = tiles.slice(14);
      pCards = [player, bot1];
      setPlayers([
        { name: t.youLabel, isHuman: true, cards: player },
        { name: t.bot1Name, isHuman: false, cards: bot1 }
      ]);
      setBoneyard(bone);
    } else {
      // 4 Players Partnership: You, Bot 1, Bot 2, Bot 3. No boneyard.
      const bot2 = tiles.slice(14, 21);
      const bot3 = tiles.slice(21, 28);
      pCards = [player, bot1, bot2, bot3];
      setPlayers([
        { name: t.youLabel, isHuman: true, cards: player },
        { name: t.bot1Name, isHuman: false, cards: bot1 },
        { name: t.bot2Name, isHuman: false, cards: bot2 },
        { name: t.bot3Name, isHuman: false, cards: bot3 }
      ]);
      setBoneyard([]);
    }

    setBoardTrain([]);
    setStartingTileId(null);
    const patterns: ('S-shape' | 'inverse-S')[] = ['S-shape', 'inverse-S'];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    setLayoutPattern(randomPattern);
    setLeftEnd(null);
    setRightEnd(null);
    
    let startingPlayer = 0;
    if (team1Score === 0 && team2Score === 0) {
      // First round: find highest double
      let found = false;
      for (let d = 6; d >= 0; d--) {
        for (let p = 0; p < pCards.length; p++) {
          if (pCards[p].some(t => t.left === d && t.right === d)) {
            startingPlayer = p;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    } else {
      // Subsequent rounds: previous winner starts
      startingPlayer = lastRoundWinner !== null ? lastRoundWinner : 0;
    }
    
    setTurn(startingPlayer);
    setPhase('playing');
    setSelectedHandTile(null);
    setPassTimer(null);

    addChatMessage('dealer', t.dealerName, lang === 'ar' ? 'البلاط توزع بالكامل. اللعب يبدأ عندك!' : 'All tiles distributed. You start!');
  };

  // Timer handling when user has no moves
  useEffect(() => {
    if (phase !== 'playing' || turn !== 0 || !players[0]) return;

    const hasMove = boardTrain.length === 0 || players[0].cards.some(
      (tile) => tile.left === leftEnd || tile.right === leftEnd || tile.left === rightEnd || tile.right === rightEnd
    );

    if (!hasMove) {
      if (gameMode === 'partnership') {
        setPassTimer(5);
      } else {
        // In 2-player mode, if no moves and boneyard is empty, they must pass
        if (boneyard.length === 0) {
          setPassTimer(5);
        } else {
          setPassTimer(null);
        }
      }
    } else {
      setPassTimer(null);
    }
  }, [turn, phase, boardTrain, leftEnd, rightEnd, players, gameMode, boneyard]);

  // Pass timer countdown
  useEffect(() => {
    if (passTimer === null || passTimer < 0) return;

    if (passTimer === 0) {
      handlePassTurn();
      return;
    }

    const interval = setTimeout(() => {
      setPassTimer((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(interval);
  }, [passTimer]);

  // Capture starting tile when first tile is played
  useEffect(() => {
    if (boardTrain.length === 1 && boardTrain[0] && !startingTileId) {
      setStartingTileId(boardTrain[0].id);
    }
  }, [boardTrain, startingTileId]);

  const handlePassTurn = () => {
    if (phase !== 'playing' || turn !== 0) return;

    synth.playDraw();
    setPassTimer(null);
    addChatMessage('you', t.youLabel, lang === 'ar' ? 'مش معايا! عدي الدور. ⏭️' : 'Pass turn! ⏭️');
    
    const nextTurn = gameMode === 'single' ? 1 : 1;
    checkBlockCondition(
      players[0].cards,
      players[1].cards,
      players[2]?.cards || [],
      players[3]?.cards || [],
      leftEnd!,
      rightEnd!,
      nextTurn
    );
  };

  const handleDrawTile = (idx?: number) => {
    if (phase !== 'playing' || turn !== 0 || gameMode !== 'single' || boneyard.length === 0 || userHasMove) return;

    synth.playDraw();
    const nextBoneyard = [...boneyard];
    let drawn: DominoTile;
    if (idx !== undefined && idx >= 0 && idx < nextBoneyard.length) {
      [drawn] = nextBoneyard.splice(idx, 1);
    } else {
      drawn = nextBoneyard.pop()!;
    }
    setBoneyard(nextBoneyard);

    setPlayers((prev) => {
      const next = [...prev];
      if (next[0]) {
        next[0] = { ...next[0], cards: [...next[0].cards, drawn] };
      }
      return next;
    });

    setSelectedHandTile(null);
    addChatMessage('you', t.youLabel, lang === 'ar' ? `سحبت بلاطة: [${drawn.left}|${drawn.right}].` : `Drew tile: [${drawn.left}|${drawn.right}].`);
  };

  const handleTileSelect = (tile: DominoTile) => {
    if (phase !== 'playing' || turn !== 0) return;

    if (boardTrain.length === 0) {
      if (team1Score === 0 && team2Score === 0) {
        let highestDouble = -1;
        players[0].cards.forEach(t => {
          if (t.left === t.right && t.left > highestDouble) highestDouble = t.left;
        });
        if (highestDouble !== -1 && (tile.left !== highestDouble || tile.right !== highestDouble)) {
           addChatMessage('dealer', t.dealerName, lang === 'ar' 
             ? `أول دور إجباري! يجب أن تلعب أكبر ورقة مزدوجة معاك [${highestDouble}|${highestDouble}].` 
             : `First round compulsory! You must start with your highest double [${highestDouble}|${highestDouble}].`);
           return;
        }
      }
      playTile(tile, 'right');
      return;
    }

    const fitsLeft = tile.left === leftEnd || tile.right === leftEnd;
    const fitsRight = tile.left === rightEnd || tile.right === rightEnd;

    if (fitsLeft && fitsRight) {
      if (leftEnd === rightEnd) {
        playTile(tile, 'right');
      } else {
        setSelectedHandTile(tile);
      }
    } else if (fitsLeft) {
      playTile(tile, 'left');
    } else if (fitsRight) {
      playTile(tile, 'right');
    }
  };

  const playTile = (tile: DominoTile, side: 'left' | 'right') => {
    let isValid = false;
    let newLeft = leftEnd;
    let newRight = rightEnd;
    let finalTile = { ...tile };

    if (boardTrain.length === 0) {
      isValid = true;
      newLeft = tile.left;
      newRight = tile.right;
      setStartingTileId(tile.id);
    } else {
      if (side === 'left' && leftEnd !== null) {
        if (tile.right === leftEnd) {
          isValid = true;
          newLeft = tile.left;
        } else if (tile.left === leftEnd) {
          isValid = true;
          newLeft = tile.right;
          finalTile = { id: tile.id, left: tile.right, right: tile.left };
        }
      } else if (side === 'right' && rightEnd !== null) {
        if (tile.left === rightEnd) {
          isValid = true;
          newRight = tile.right;
        } else if (tile.right === rightEnd) {
          isValid = true;
          newRight = tile.left;
          finalTile = { id: tile.id, left: tile.right, right: tile.left };
        }
      }
    }

    if (!isValid) return;

    const isSlam = (newLeft !== null && newRight !== null && newLeft === newRight) || (tile.left === tile.right);
    if (isSlam) {
      synth.playSlam();
      setShouldShake(true);
      setJoltActive(true);
      setTimeout(() => setShouldShake(false), 400);
      setTimeout(() => setJoltActive(false), 800);
    } else {
      synth.playClack();
    }
    
    setPlayers((prev) => {
      const next = [...prev];
      if (next[0]) {
        next[0] = { ...next[0], cards: next[0].cards.filter((t) => t.id !== tile.id) };
      }
      return next;
    });

    setBoardTrain((prev) => {
      if (side === 'left') {
        return [finalTile, ...prev];
      } else {
        return [...prev, finalTile];
      }
    });

    setLeftEnd(newLeft);
    setRightEnd(newRight);
    setSelectedHandTile(null);
    setPassTimer(null);

    addChatMessage('you', t.youLabel, lang === 'ar' ? `لعبت بلاطة [${finalTile.left}|${finalTile.right}] على جهة الـ ${side === 'left' ? 'يسار' : 'يمين'}.` : `Played [${finalTile.left}|${finalTile.right}] on the ${side} side.`);

    const nextPlayerHand = players[0].cards.filter((t) => t.id !== tile.id);
    if (nextPlayerHand.length === 0) {
      endRound(0);
      return;
    }

    checkBlockCondition(
      nextPlayerHand,
      players[1].cards,
      players[2]?.cards || [],
      players[3]?.cards || [],
      newLeft!,
      newRight!,
      1
    );
  };

  const checkBlockCondition = (p0: DominoTile[], p1: DominoTile[], p2: DominoTile[], p3: DominoTile[], l: number, r: number, nextTurn: number) => {
    const hasMove0 = p0.some((t) => t.left === l || t.right === l || t.left === r || t.right === r);
    const hasMove1 = p1.some((t) => t.left === l || t.right === l || t.left === r || t.right === r);
    
    if (gameMode === 'single') {
      // 2 Players check
      if (!hasMove0 && !hasMove1 && boneyard.length === 0) {
        const sum0 = p0.reduce((sum, tile) => sum + tile.left + tile.right, 0);
        const sum1 = p1.reduce((sum, tile) => sum + tile.left + tile.right, 0);
        if (sum0 < sum1) {
          endRound(0, true, sum1);
        } else {
          endRound(1, true, sum0);
        }
      } else {
        setTurn(nextTurn);
      }
    } else {
      // 4 Players check
      const hasMove2 = p2.some((t) => t.left === l || t.right === l || t.left === r || t.right === r);
      const hasMove3 = p3.some((t) => t.left === l || t.right === l || t.left === r || t.right === r);
      if (!hasMove0 && !hasMove1 && !hasMove2 && !hasMove3) {
        const team1Sum = p0.reduce((sum, tile) => sum + tile.left + tile.right, 0) + p2.reduce((sum, tile) => sum + tile.left + tile.right, 0);
        const team2Sum = p1.reduce((sum, tile) => sum + tile.left + tile.right, 0) + p3.reduce((sum, tile) => sum + tile.left + tile.right, 0);
        if (team1Sum < team2Sum) {
          endRound(0, true, team2Sum);
        } else {
          endRound(1, true, team1Sum);
        }
      } else {
        setTurn(nextTurn);
      }
    }
  };

  const endRound = (winnerIdx: number, isBlocked = false, blockedPoints = 0) => {
    let winnerName = '';
    let points = 0;

    if (gameMode === 'single') {
      winnerName = winnerIdx === 0 ? t.youLabel : t.bot1Name;
      if (isBlocked) {
        points = blockedPoints;
      } else {
        points = winnerIdx === 0
          ? players[1].cards.reduce((sum, tile) => sum + tile.left + tile.right, 0)
          : players[0].cards.reduce((sum, tile) => sum + tile.left + tile.right, 0);
      }
    } else {
      const isTeam1 = winnerIdx === 0 || winnerIdx === 2;
      winnerName = isTeam1 ? (lang === 'ar' ? 'فريقك (أنت والشريك)' : 'Your Team') : (lang === 'ar' ? 'الفريق المنافس' : 'Opposing Team');
      if (isBlocked) {
        points = blockedPoints;
      } else {
        points = isTeam1
          ? players[1].cards.reduce((sum, tile) => sum + tile.left + tile.right, 0) + players[3].cards.reduce((sum, tile) => sum + tile.left + tile.right, 0)
          : players[0].cards.reduce((sum, tile) => sum + tile.left + tile.right, 0) + players[2].cards.reduce((sum, tile) => sum + tile.left + tile.right, 0);
      }
    }

    let nextTeam1 = team1Score;
    let nextTeam2 = team2Score;

    if (gameMode === 'single') {
      if (winnerIdx === 0) {
        nextTeam1 += points;
        setTeam1Score(nextTeam1);
      } else {
        nextTeam2 += points;
        setTeam2Score(nextTeam2);
      }
    } else {
      if (winnerIdx === 0 || winnerIdx === 2) {
        nextTeam1 += points;
        setTeam1Score(nextTeam1);
      } else {
        nextTeam2 += points;
        setTeam2Score(nextTeam2);
      }
    }

    setRoundWinnerName(winnerName);
    setRoundPointsGained(points);
    setLastRoundWinner(winnerIdx);

    addChatMessage('dealer', t.dealerName, lang === 'ar' 
      ? `انتهى الدور! الفائز هو ${winnerName} وحصل على +${points} نقطة.` 
      : `Round Over! Winner is ${winnerName} gaining +${points} points.`);

    if (nextTeam1 >= targetScore) {
      setPhase('gameover');
      synth.playDraw();
      addChatMessage('dealer', t.dealerName, t.gameOverWin);
      window.parent.postMessage({ type: 'GAME_OVER', outcome: 'win', reward: 150 }, '*');
    } else if (nextTeam2 >= targetScore) {
      setPhase('gameover');
      synth.playDraw();
      addChatMessage('dealer', t.dealerName, t.gameOverLoss);
      window.parent.postMessage({ type: 'GAME_OVER', outcome: 'loss', penalty: 50 }, '*');
    } else {
      setPhase('roundover');
    }
  };

  // Bot turns loop (1v1 or 4-player)
  useEffect(() => {
    if (phase !== 'playing' || turn === 0) return;

    const timer = setTimeout(() => {
      const botIdx = turn;
      const bot = players[botIdx];
      if (!bot) return;

      const playable: { tile: DominoTile; side: 'left' | 'right' }[] = [];
      
      if (boardTrain.length === 0) {
        bot.cards.forEach((t) => playable.push({ tile: t, side: 'right' }));
      } else {
        bot.cards.forEach((t) => {
          if (t.left === leftEnd || t.right === leftEnd) playable.push({ tile: t, side: 'left' });
          if (t.left === rightEnd || t.right === rightEnd) playable.push({ tile: t, side: 'right' });
        });
      }

      const nextTurn = gameMode === 'single' ? 0 : (turn + 1) % 4;

      if (playable.length > 0) {
        playable.sort((a, b) => {
          const aDouble = a.tile.left === a.tile.right ? 1 : 0;
          const bDouble = b.tile.left === b.tile.right ? 1 : 0;
          if (aDouble && bDouble) {
            return b.tile.left - a.tile.left; // Highest double first
          }
          if (aDouble !== bDouble) return bDouble - aDouble;
          return (b.tile.left + b.tile.right) - (a.tile.left + a.tile.right); // Highest value first
        });

        const move = playable[0];
        const tile = move.tile;
        let newLeft = leftEnd;
        let newRight = rightEnd;
        let finalTile = { ...tile };

        if (boardTrain.length === 0) {
          newLeft = tile.left;
          newRight = tile.right;
        } else if (move.side === 'left' && leftEnd !== null) {
          if (tile.right === leftEnd) {
            newLeft = tile.left;
          } else {
            newLeft = tile.right;
            finalTile = { id: tile.id, left: tile.right, right: tile.left };
          }
        } else if (move.side === 'right' && rightEnd !== null) {
          if (tile.left === rightEnd) {
            newRight = tile.right;
          } else {
            newRight = tile.left;
            finalTile = { id: tile.id, left: tile.right, right: tile.left };
          }
        }

        const isSlam = (newLeft !== null && newRight !== null && newLeft === newRight) || (tile.left === tile.right);
        if (isSlam) {
          synth.playSlam();
          setShouldShake(true);
          setJoltActive(true);
          setTimeout(() => setShouldShake(false), 400);
          setTimeout(() => setJoltActive(false), 800);
        } else {
          synth.playClack();
        }
        
        setPlayers((prev) => {
          const next = [...prev];
          if (next[botIdx]) {
            next[botIdx] = { ...next[botIdx], cards: next[botIdx].cards.filter((t) => t.id !== tile.id) };
          }
          return next;
        });

        setBoardTrain((prev) => {
          if (move.side === 'left') {
            return [finalTile, ...prev];
          } else {
            return [...prev, finalTile];
          }
        });

        setLeftEnd(newLeft);
        setRightEnd(newRight);

        const senderId = botIdx === 1 ? 'bot1' : botIdx === 2 ? 'bot2' : 'bot3';
        addChatMessage(senderId, bot.name, lang === 'ar' 
          ? `لعبت بلاطة [${finalTile.left}|${finalTile.right}] على الأطراف.` 
          : `Played [${finalTile.left}|${finalTile.right}].`);

        if (Math.random() < 0.15) {
          const emotes: ('wizard' | 'iron_hero' | 'ranger')[] = ['wizard', 'iron_hero', 'ranger'];
          triggerPlayerEmote(botIdx, emotes[Math.floor(Math.random() * emotes.length)]);
        }

        const nextBotHand = bot.cards.filter((t) => t.id !== tile.id);
        if (nextBotHand.length === 0) {
          endRound(botIdx);
          return;
        }

        checkBlockCondition(
          players[0].cards,
          players[1].cards,
          players[2]?.cards || [],
          players[3]?.cards || [],
          newLeft!,
          newRight!,
          nextTurn
        );
      } else {
        // No moves for Bot
        if (gameMode === 'single') {
          if (boneyard.length > 0) {
            synth.playDraw();
            const nextBoneyard = [...boneyard];
            const drawn = nextBoneyard.pop()!;
            setBoneyard(nextBoneyard);
            setPlayers((prev) => {
              const next = [...prev];
              next[1].cards = [...next[1].cards, drawn];
              return next;
            });
            addChatMessage('bot1', bot.name, lang === 'ar' ? 'سحبت بلاطة من السحب.' : 'Drew tile from boneyard.');
            setTurn(1);
          } else {
            addChatMessage('bot1', bot.name, lang === 'ar' ? 'مش معايا وعّديت الدور!' : 'No moves left! Passing turn.');
            setTurn(0);
          }
        } else {
          // Partnership
          const senderId = botIdx === 1 ? 'bot1' : botIdx === 2 ? 'bot2' : 'bot3';
          addChatMessage(senderId, bot.name, lang === 'ar' ? 'مش معايا! عدي الدور.' : 'Pass turn.');
          checkBlockCondition(
            players[0].cards,
            players[1].cards,
            players[2].cards,
            players[3].cards,
            leftEnd!,
            rightEnd!,
            nextTurn
          );
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [turn, phase, players, boardTrain, leftEnd, rightEnd, boneyard, gameMode]);

  const getSnakeStyle = (idx: number, x: number, y: number) => {
    // Subtle random-looking translation/rotation offsets only active during slam jolts
    let rot = 0;
    let xOff = 0;
    let yOff = 0;
    if (joltActive) {
      const hash = idx * 987654;
      rot = (hash % 15) - 7;      // Shake rotation: -7 to +7 degrees
      xOff = (hash % 9) - 4;      // Shake translation: -4 to +4 px
      yOff = ((hash >> 2) % 9) - 4;
    }

    return {
      position: 'absolute' as const,
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      transform: `rotate(${rot}deg) translate(${xOff}px, ${yOff}px)`,
      transition: joltActive
        ? 'none'
        : 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), left 0.8s ease-out, top 0.8s ease-out',
      zIndex: 10 + idx,
    };
  };

  const handleBuyIn = () => {
    window.parent.postMessage({ type: 'BUY_IN', amount: 50 }, '*');
    startShuffle();
  };

  const renderDominoPlayerCard = (playerIdx: number, defaultAvatar: string, positionClasses: string, bubbleDir: 'top' | 'bottom' | 'left' | 'right') => {
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
      <div className={`flex flex-col items-center select-none relative ${positionClasses}`}>
        {/* Cartoon Speech Bubble popup */}
        {playerEmotes[playerIdx].active && (
          <div className={`absolute z-50 bg-slate-900 border border-amber-400 text-slate-100 px-2.5 py-1 rounded-lg shadow-xl text-[9px] font-sans font-bold whitespace-nowrap animate-bounce ${
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
        } rounded-2xl p-1.5 flex items-center gap-1.5 w-28 shadow-xl transition-all duration-300 relative`}>
          
          {/* Avatar Container */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base border border-slate-700 shadow-inner select-none pointer-events-none transition-all duration-300 ${avatarBg} ${avatarBorder}`}>
            <span>{avatarSymbol}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <span className="text-[8px] font-black text-amber-300 truncate leading-tight block">
              {playerIdx === 0 ? t.youLabel : player.name}
            </span>
            <span className="text-[7px] font-sans font-bold text-slate-500 block leading-none mb-0.5">
              {idMap[playerIdx as keyof typeof idMap]}
            </span>
            <span className="text-[7.5px] font-sans font-bold text-slate-400 block leading-none">
              {player.cards.length} 🀄
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-transparent text-amber-100 flex flex-row font-sans select-none overflow-hidden relative">
      
      {/* Blurred Game Card Background */}
      <div 
        className="absolute inset-0 bg-cover -z-20"
        style={{
          backgroundImage: "url('/domino_card_v2.png')",
          backgroundPosition: 'center top',
          filter: 'brightness(0.35) saturate(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 -z-10" />

      {/* LEFT SIDE: Wooden Domino Table Felt */}
      <div className="flex-1 flex flex-col items-center justify-between p-2 relative border-r border-[#2d1405]">
        
        {/* Header with tournament cumulative scores */}
        <header className="py-1.5 border-b border-amber-900/30 w-full z-10 bg-slate-950/40 rounded-xl px-4 flex justify-between items-center">
          <div className="text-right">
            <h2 className="text-sm font-black text-amber-400 tracking-wider">{t.title}</h2>
            <p className="text-[9px] text-amber-600/70 font-mono mt-0.5">{t.subtitle}</p>
          </div>

          {(phase === 'playing' || phase === 'roundover' || phase === 'gameover') && (
            <div className="bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-900/30 text-xs font-mono font-bold flex gap-4">
              <span className="text-amber-400">{gameMode === 'single' ? t.youLabel : (lang === 'ar' ? 'فريقك' : 'Team 1')}: {team1Score} / {targetScore}</span>
              <span className="text-amber-600">VS</span>
              <span className="text-red-400">{gameMode === 'single' ? t.bot1Name : (lang === 'ar' ? 'المنافس' : 'Team 2')}: {team2Score} / {targetScore}</span>
            </div>
          )}
        </header>

        {/* Shuffling animation */}
        {phase === 'shuffling' && (
          <div 
            className="absolute top-[48%] left-1/2 flex flex-col items-center justify-center space-y-6 z-20"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative w-44 h-32 flex items-center justify-center">
              <div className="absolute w-10 h-16 bg-[#faf8f0] border border-slate-950 rounded-lg shadow-lg rotate-12 animate-[shuffle-tile_0.4s_infinite_alternate] flex flex-col justify-between py-1 px-0.5">
                <DominoHalf val={6} />
                <div className="w-full h-0.5 bg-slate-400"></div>
                <DominoHalf val={6} />
              </div>
              <div className="absolute w-10 h-16 bg-[#faf8f0] border border-slate-950 rounded-lg shadow-lg -rotate-12 animate-[shuffle-tile-rev_0.4s_infinite_alternate] flex flex-col justify-between py-1 px-0.5">
                <DominoHalf val={5} />
                <div className="w-full h-0.5 bg-slate-400"></div>
                <DominoHalf val={4} />
              </div>
            </div>
            <h3 className="text-xs font-bold text-amber-400 animate-pulse">{t.shufflingText}</h3>
          </div>
        )}

        {/* Dealing Screen */}
        {phase === 'dealing' && (
          <div 
            className="absolute top-[48%] left-1/2 flex flex-col items-center justify-center space-y-6 z-20"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <style>{`
              @keyframes deal-tile-fly {
                0% { transform: translate(-45px, -45px) scale(0.4); opacity: 0; }
                30% { opacity: 1; }
                70% { opacity: 1; }
                100% { transform: translate(45px, 45px) scale(1.1) rotate(360deg); opacity: 0; }
              }
            `}</style>
            <div className="relative w-40 h-40 border border-dashed border-amber-900/40 rounded-full flex items-center justify-center bg-slate-950/20">
              <div className="absolute w-7 h-14 bg-amber-50 rounded border border-slate-950 animate-[deal-tile-fly_0.8s_infinite] shadow-md z-25"></div>
              <div className="text-center z-10 relative">
                <span className="text-[10px] text-amber-600 block font-bold mb-1">{lang === 'ar' ? 'سحب البلاط' : 'Dealing Tiles'}</span>
                <span className="text-sm font-bold text-amber-500 font-mono">{dealtCount} / 7</span>
              </div>
            </div>
            <h3 className="text-xs font-bold text-amber-400 animate-pulse">{t.dealingText}</h3>
          </div>
        )}

        {phase === 'init' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-slate-950/20 backdrop-blur-md border border-amber-900/20 rounded-3xl p-8 max-w-md w-full my-auto">
            <div className="flex gap-4 justify-center items-center py-4 animate-bounce">
              <div className="w-10 h-20 bg-amber-50 border border-slate-900 rounded-lg flex flex-col justify-between py-1.5 px-1 shadow-lg transform -rotate-12">
                <DominoHalf val={5} />
                <div className="w-full h-0.5 bg-slate-350"></div>
                <DominoHalf val={5} />
              </div>
              <div className="w-10 h-20 bg-amber-50 border border-slate-900 rounded-lg flex flex-col justify-between py-1.5 px-1 shadow-lg transform rotate-12">
                <DominoHalf val={6} />
                <div className="w-full h-0.5 bg-slate-350"></div>
                <DominoHalf val={4} />
              </div>
            </div>
            
            <div className="space-y-3 w-full">
              <label className="text-xs font-bold text-amber-400 block text-center uppercase tracking-widest">{t.modeLabel}</label>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setGameMode('single')}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all border text-right flex items-center justify-between cursor-pointer ${
                    gameMode === 'single'
                      ? 'bg-amber-650/30 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-black/20 backdrop-blur-sm border-slate-800/40 text-slate-450 hover:text-slate-200'
                  }`}
                >
                  <span>{t.modeSingle}</span>
                  <span>{gameMode === 'single' ? '🟢' : '⚪'}</span>
                </button>
 
                <button
                  onClick={() => setGameMode('partnership')}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all border text-right flex items-center justify-between cursor-pointer ${
                    gameMode === 'partnership'
                      ? 'bg-amber-650/30 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-black/20 backdrop-blur-sm border-slate-800/40 text-slate-450 hover:text-slate-200'
                  }`}
                >
                  <span>{t.modePartnership}</span>
                  <span>{gameMode === 'partnership' ? '🟢' : '⚪'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleBuyIn}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border border-amber-400 mt-4"
            >
              {t.startBtn}
            </button>

            {/* Skin Shop Section */}
            <div className="space-y-3 w-full pt-4 border-t border-amber-900/20">
              <div className="flex justify-between items-center text-xs font-bold text-amber-400 uppercase tracking-widest px-1">
                <span>{lang === 'ar' ? 'تخصيص طاولة اللعب 🎨' : 'Table Skins 🎨'}</span>
                <span className="text-[10px] text-amber-500 font-mono">
                  🪙 {profile ? profile.gold_coins : 1000}
                </span>
              </div>
              
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-900/40">
                {skinsList.map((skin) => {
                  const isUnlocked = unlockedSkins.includes(skin.id);
                  const isActive = activeSkin === skin.id;

                  return (
                    <div 
                      key={skin.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                        isActive
                          ? 'bg-amber-950/30 border-amber-500 text-white'
                          : 'bg-black/20 backdrop-blur-sm border-slate-900/30 text-slate-350 hover:bg-black/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Tiny skin preview */}
                        <div 
                          className="w-8 h-8 rounded-lg border border-amber-900/30"
                          style={
                            skin.id === 'default'
                              ? { background: 'radial-gradient(circle, #0f4022 0%, #082413 100%)' }
                              : { backgroundImage: `url(${skin.path})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          }
                        />
                        <div className="text-right">
                          <div className="font-bold text-[11px]">{lang === 'ar' ? skin.nameAr : skin.nameEn}</div>
                          <div className="text-[9px] text-slate-400">
                            {skin.price === 0 
                              ? (lang === 'ar' ? 'مجانية' : 'Free') 
                              : `${skin.price} 🪙`}
                          </div>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg border border-amber-500/30">
                          {lang === 'ar' ? 'نشط 🟢' : 'Active 🟢'}
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => applySkin(skin.id)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-bold rounded-lg cursor-pointer transition-all active:scale-95 border border-amber-500"
                        >
                          {lang === 'ar' ? 'تطبيق' : 'Apply'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buySkin(skin.id, skin.price)}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-[10px] font-bold rounded-lg cursor-pointer transition-all active:scale-95 border border-amber-400"
                        >
                          {lang === 'ar' ? 'شراء 🪙' : 'Buy 🪙'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(phase === 'playing' || phase === 'roundover' || phase === 'gameover') && (
          <div className="flex-1 w-full flex flex-col justify-between relative h-full my-4">
            
            {/* Seating Layout depending on mode */}
            {gameMode === 'single' ? (
              <div className="text-center">
                {renderDominoPlayerCard(1, '🤖', 'mx-auto', 'bottom')}
              </div>
            ) : (
              <div className="flex justify-between items-center px-6">
                {renderDominoPlayerCard(1, '🤖', '', 'right')}
                {renderDominoPlayerCard(2, '🎩', '', 'bottom')}
                {renderDominoPlayerCard(3, '🎲', '', 'left')}
              </div>
            )}

            {/* Middle Board Train Area */}
            <div 
              className="absolute top-[54%] left-1/2 w-full flex flex-col items-center justify-center z-10 px-4"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              
              <style>{`
                @keyframes board-shake {
                  0% { transform: translate(2px, 2px) rotate(0deg); }
                  10% { transform: translate(-2px, -3px) rotate(-1deg); }
                  20% { transform: translate(-4px, 0px) rotate(1deg); }
                  30% { transform: translate(0px, 3px) rotate(0deg); }
                  40% { transform: translate(2px, -2px) rotate(1deg); }
                  50% { transform: translate(-2px, 3px) rotate(-1deg); }
                  60% { transform: translate(-4px, 2px) rotate(0deg); }
                  70% { transform: translate(3px, 2px) rotate(-1deg); }
                  80% { transform: translate(-2px, -2px) rotate(1deg); }
                  90% { transform: translate(3px, 3px) rotate(0deg); }
                  100% { transform: translate(2px, -3px) rotate(-1deg); }
                }
                .board-shake-active {
                  animation: board-shake 0.3s ease-in-out infinite;
                }
              `}</style>

              <div 
                className={`w-full max-w-[850px] h-[440px] relative p-6 overflow-hidden flex items-center justify-center ${
                  shouldShake ? 'board-shake-active' : ''
                } ${
                  activeSkin === 'default' ? 'rounded-[32px]' : 'rounded-none'
                }`}
                style={
                  activeSkin === 'default'
                    ? {
                        background: 'radial-gradient(circle, #0f4022 0%, #082413 100%)',
                        border: '12px solid #2d1405',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.85), inset 0 8px 24px rgba(0,0,0,0.85), 0 2px 0 #4a220b, inset 0 2px 4px rgba(255,255,255,0.05)'
                      }
                    : {
                        backgroundImage: `url(${skinsList.find(s => s.id === activeSkin)?.path})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: 'none',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.85)'
                      }
                }
              >
                {/* Wood Bevel Overlay */}
                <div className={`absolute inset-0 border border-white/5 pointer-events-none ${activeSkin === 'default' ? 'rounded-2xl' : 'rounded-none'}`} />
                {/* Inner Gold Trim */}
                <div className={`absolute inset-1.5 border border-[#d4af37]/15 pointer-events-none ${activeSkin === 'default' ? 'rounded-xl' : 'rounded-none'}`} />

                {boardTrain.length === 0 ? (
                  <div className="text-center text-[11px] text-amber-100/40 italic border border-dashed border-amber-500/10 px-8 py-6 rounded-2xl bg-black/20 backdrop-blur-sm z-10">
                    {lang === 'ar' ? 'سيلعب اللاعب الأول بلاطته الأولى هنا...' : 'First tile will be placed here...'}
                  </div>
                ) : (
                  <>
                    {(() => {
                      let hasGhostLeft = false;
                      let hasGhostRight = false;
                      
                      let centerIdx = boardTrain.findIndex((t) => t.id === startingTileId);
                      if (centerIdx === -1) {
                        centerIdx = Math.floor(boardTrain.length / 2);
                      }
                      
                      const leftBranch = centerIdx !== -1 ? boardTrain.slice(0, centerIdx).reverse() : [];
                      const rightBranch = centerIdx !== -1 ? boardTrain.slice(centerIdx + 1) : [];

                      if (selectedHandTile) {
                        if (boardTrain.length > 0) {
                          leftBranch.push(selectedHandTile);
                          hasGhostLeft = true;
                          rightBranch.push(selectedHandTile);
                          hasGhostRight = true;
                        } else {
                          rightBranch.push(selectedHandTile);
                          hasGhostRight = true;
                        }
                      }

                      // S-shape (left turns UP, right turns DOWN) as requested by the user
                      const leftTurnY = -1;
                      const rightTurnY = 1;

                      // Compute layout for each branch starting from center tile coordinates (0, 0)
                      const centerIsDouble = startingTileId ? (boardTrain.find(t => t.id === startingTileId)?.left === boardTrain.find(t => t.id === startingTileId)?.right) : false;
                      const centerIsVertical = centerIsDouble;
                      const centerW = centerIsVertical ? 28 : 56;
                      const centerH = centerIsVertical ? 56 : 28;

                      const computeBranch = (branchItems: DominoTile[], startDir: 1 | -1, dirY: 1 | -1) => {
                        const res: { x: number; y: number; isVertical: boolean; dirX: number; isTurn?: boolean }[] = [];
                        let cx = 0;
                        let cy = 0;
                        let dirX = startDir;

                        for (let i = 0; i < branchItems.length; i++) {
                          const item = branchItems[i];
                          const isDouble = item.left === item.right;
                          let isDoubleVertical = false;
                          if (isDouble) {
                            if (i === 0) {
                              isDoubleVertical = !centerIsVertical;
                            } else {
                              isDoubleVertical = !res[i - 1].isVertical;
                            }
                          }

                          const wPredict = isDoubleVertical ? 28 : 56;

                          let nextXPredict = 0;
                          if (i === 0) {
                            nextXPredict = dirX === 1 ? centerW / 2 : -centerW / 2 - wPredict;
                          } else {
                            const prev = res[i - 1];
                            if (prev.isTurn) {
                              nextXPredict = dirX === 1 ? prev.x : prev.x + 28 - wPredict;
                            } else {
                              nextXPredict = dirX === 1 ? prev.x + (prev.isVertical ? 28 : 56) : prev.x - wPredict;
                            }
                          }

                          const outerBoundary = 220;
                          const innerBoundary = 40;
                          let isTurn = false;
                          
                          if (i > 0) {
                            if (startDir === 1) {
                              if (dirX === 1 && nextXPredict + wPredict > outerBoundary) isTurn = true;
                              if (dirX === -1 && nextXPredict < innerBoundary) isTurn = true;
                            } else {
                              if (dirX === -1 && nextXPredict < -outerBoundary) isTurn = true;
                              if (dirX === 1 && nextXPredict + wPredict > -innerBoundary) isTurn = true;
                            }
                          }

                          const isVertical = isTurn || isDoubleVertical;
                          const w = isVertical ? 28 : 56;
                          const h = isVertical ? 56 : 28;

                          if (i === 0) {
                            cx = dirX === 1 ? centerW / 2 : -centerW / 2 - w;
                            cy = (0 + centerH / 2) - h / 2;
                          } else {
                            const prev = res[i - 1];
                            if (isTurn) {
                              if (prev.isVertical) {
                                cx = prev.x;
                                cy = dirY === 1 ? prev.y + 56 : prev.y - 56;
                              } else {
                                cx = dirX === 1 ? prev.x + 56 : prev.x - 28;
                                cy = dirY === 1 ? prev.y : prev.y - 28;
                              }
                              dirX = dirX === 1 ? -1 : 1; 
                            } else {
                              if (prev.isTurn) {
                                cx = dirX === 1 ? prev.x : prev.x + 28 - w;
                                cy = dirY === 1 ? prev.y + 56 : prev.y - h;
                              } else {
                                cx = dirX === 1 ? prev.x + (prev.isVertical ? 28 : 56) : prev.x - w;
                                const prevCenterY = prev.y + (prev.isVertical ? 56 : 28) / 2;
                                cy = prevCenterY - h / 2;
                              }
                            }
                          }

                          res.push({ x: cx, y: cy, isVertical, dirX, isTurn });
                        }
                        return res;
                      };

                      const leftRes = computeBranch(leftBranch, -1, leftTurnY);
                      const rightRes = computeBranch(rightBranch, 1, rightTurnY);

                      const finalLayoutItems: { type: 'tile' | 'ghost-left' | 'ghost-right'; tile: DominoTile; lay: any }[] = [];
                      
                      if (boardTrain.length === 0 && selectedHandTile) {
                        finalLayoutItems.push({
                           type: 'ghost-right',
                           tile: selectedHandTile,
                           lay: rightRes[0]
                        });
                      } else if (centerIdx !== -1) {
                         const finalLeftLayout = leftRes.slice(0, hasGhostLeft ? -1 : undefined).reverse();
                         
                         for (let i = 0; i < centerIdx; i++) {
                            finalLayoutItems.push({ type: 'tile', tile: boardTrain[i], lay: finalLeftLayout[i] });
                         }
                         
                         finalLayoutItems.push({
                            type: 'tile', tile: boardTrain[centerIdx], lay: { x: -centerW / 2, y: 0, isVertical: centerIsVertical, dirX: 1 }
                         });
                         
                         for (let i = centerIdx + 1; i < boardTrain.length; i++) {
                            finalLayoutItems.push({ type: 'tile', tile: boardTrain[i], lay: rightRes[i - centerIdx - 1] });
                         }
                         
                         if (hasGhostLeft) {
                            finalLayoutItems.push({ type: 'ghost-left', tile: selectedHandTile!, lay: leftRes[leftRes.length - 1] });
                         }
                         if (hasGhostRight) {
                            finalLayoutItems.push({ type: 'ghost-right', tile: selectedHandTile!, lay: rightRes[rightRes.length - 1] });
                         }
                      }
                      
                      const layout = finalLayoutItems.map(item => item.lay);
                      const layoutTiles = finalLayoutItems.map(item => ({ type: item.type, tile: item.tile }));

                      // Center the entire calculated path relative to the board container
                      if (layout.length > 0) {
                        const xs = layout.map((l) => {
                          const w = l.isVertical ? 28 : 56;
                          return [l.x, l.x + w];
                        }).flat();
                        const ys = layout.map((l) => {
                          const h = l.isVertical ? 56 : 28;
                          return [l.y, l.y + h];
                        }).flat();

                        const minX = Math.min(...xs);
                        const maxX = Math.max(...xs);
                        const minY = Math.min(...ys);
                        const maxY = Math.max(...ys);

                        const midX = (minX + maxX) / 2;
                        const midY = (minY + maxY) / 2;

                        // Center point of the container relative to 0, 0
                        const offsetX = -midX;
                        const offsetY = -midY;

                        layout.forEach((l) => {
                          l.x += offsetX;
                          l.y += offsetY;
                        });
                      }

                      return layoutTiles.map((item, idx) => {
                        const lay = layout[idx] || { x: 0, y: 0, isVertical: false, dirX: 1 };
                        const style = getSnakeStyle(idx, lay.x, lay.y);

                        // Calculate render values order (val1 and val2) so touching numbers match!
                        let val1 = item.tile.left;
                        let val2 = item.tile.right;

                        if (idx !== centerIdx) {
                          const refIdx = idx < centerIdx ? idx + 1 : idx - 1;
                          const refTile = layoutTiles[refIdx].tile;
                          const currentTile = item.tile;

                          // Identify which value connects to the reference tile
                          const connectsToLeft = currentTile.left === refTile.left || currentTile.left === refTile.right;
                          const connectsToRight = currentTile.right === refTile.left || currentTile.right === refTile.right;

                          let connectingVal = currentTile.left;
                          let openVal = currentTile.right;

                          if (connectsToRight && !connectsToLeft) {
                            connectingVal = currentTile.right;
                            openVal = currentTile.left;
                          }

                          // Determine orientation rendering order based on flow direction
                          if (lay.isVertical) {
                            // Vertical flow: determine based on turn direction
                            const dirY = idx < centerIdx ? leftTurnY : rightTurnY;
                            if (dirY === 1) {
                              // Flowing down: connecting val on top (val1)
                              val1 = connectingVal;
                              val2 = openVal;
                            } else {
                              // Flowing up: connecting val on bottom (val2)
                              val1 = openVal;
                              val2 = connectingVal;
                            }
                          } else {
                            // Horizontal flow
                            if (lay.dirX === -1) {
                              // Flowing left: ref tile (closer to center) is on the right, so connectingVal must be on the right (val2)
                              val1 = openVal;
                              val2 = connectingVal;
                            } else {
                              // Flowing right: ref tile (closer to center) is on the left, so connectingVal must be on the left (val1)
                              val1 = connectingVal;
                              val2 = openVal;
                            }
                          }
                        }

                        return (
                          <div key={item.type + '-' + item.tile.id + '-' + idx} style={style} className="z-10">
                            <RenderDomino
                              tile={item.tile}
                              vertical={lay.isVertical}
                              val1={val1}
                              val2={val2}
                              ghost={item.type !== 'tile'}
                              onClick={
                                item.type === 'ghost-left' 
                                  ? () => playTile(item.tile, 'left')
                                  : item.type === 'ghost-right'
                                  ? () => playTile(item.tile, 'right')
                                  : undefined
                              }
                              disabled={item.type === 'tile'}
                            />
                          </div>
                        );
                      });
                    })()}
                  </>
                )}
              </div>

              {boardTrain.length > 0 && (
                <div className="absolute top-2 text-[8px] bg-slate-950 px-2 py-0.5 rounded border border-amber-900/40 text-amber-500 font-mono">
                  {t.endsLabel}: <span className="text-white font-bold">{leftEnd}</span> & <span className="text-white font-bold">{rightEnd}</span> | Pattern: <span className="text-amber-400 font-bold">{layoutPattern}</span> | Center: <span className="text-amber-400 font-bold">{startingTileId}</span>
                </div>
              )}

              {/* Countdown timer */}
              {passTimer !== null && (
                <div className="absolute bottom-2 bg-rose-950/80 border border-rose-600 rounded-xl px-4 py-1.5 text-center text-[10px] text-rose-300 font-bold animate-pulse">
                  {t.passWarning.replace('{time}', String(passTimer))}
                </div>
              )}
            </div>

            {/* Bottom Row Player Hands */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] px-2">
                {renderDominoPlayerCard(0, '👑', 'ml-2', 'top')}
                <div className="flex gap-2">
                  {passTimer !== null && (
                    <button
                      onClick={handlePassTurn}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[10px] font-black rounded-lg cursor-pointer transition-all border border-rose-500 animate-bounce"
                      style={{ cursor: 'pointer' }}
                    >
                      {t.passBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Domino Tiles in Hand */}
              <div className="flex gap-4 overflow-x-auto py-4 px-3 justify-center max-w-full scrollbar-none h-36 items-center bg-black/20 rounded-2xl border border-amber-950/10 relative">
                {/* Floating Emote Selector Panel for You */}
                <div className="absolute right-2 top-2 z-40 flex items-center gap-1 bg-slate-950/95 border border-amber-500/30 p-1 rounded-xl shadow-lg">
                  <button 
                    onClick={() => triggerPlayerEmote(0, 'wizard')}
                    className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={lang === 'en' ? 'Wizard 🧙' : 'الساحر 🧙‍♂️'}
                  >
                    🧙‍♂️
                  </button>
                  <button 
                    onClick={() => triggerPlayerEmote(0, 'iron_hero')}
                    className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={lang === 'en' ? 'Iron Hero 🤖' : 'البطل الحديدي 🤖'}
                  >
                    🤖
                  </button>
                  <button 
                    onClick={() => triggerPlayerEmote(0, 'ranger')}
                    className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={lang === 'en' ? 'Ranger 🏹' : 'الرينجر 🏹'}
                  >
                    🏹
                  </button>
                </div>
                {(() => {
                  let highestDouble = -1;
                  if (boardTrain.length === 0 && team1Score === 0 && team2Score === 0) {
                    players[0]?.cards.forEach(t => {
                      if (t.left === t.right && t.left > highestDouble) highestDouble = t.left;
                    });
                  }

                  return players[0]?.cards.map((tile) => {
                    let isPlayable = false;
                    let isCompulsory = false;

                    if (boardTrain.length === 0) {
                      if (team1Score === 0 && team2Score === 0 && highestDouble !== -1) {
                         // Must play the highest double
                         isCompulsory = (tile.left === highestDouble && tile.right === highestDouble);
                         isPlayable = isCompulsory;
                      } else {
                         isPlayable = true;
                      }
                    } else {
                       const matchesLeft = tile.left === leftEnd || tile.right === leftEnd;
                       const matchesRight = tile.left === rightEnd || tile.right === rightEnd;
                       isPlayable = matchesLeft || matchesRight;
                    }

                    const canPlayNow = turn === 0 && isPlayable;

                    return (
                      <RenderDomino
                        key={tile.id}
                        tile={tile}
                        vertical={true}
                        large={true}
                        onClick={() => handleTileSelect(tile)}
                        disabled={turn !== 0 || phase !== 'playing' || !canPlayNow}
                        highlighted={selectedHandTile?.id === tile.id || (canPlayNow && !selectedHandTile)}
                        compulsoryGlow={turn === 0 && isCompulsory}
                      />
                    );
                  });
                })()}
              </div>
            </div>

          </div>
        )}

        {/* Round Over Modal */}
        {phase === 'roundover' && (
          <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <span className="text-6xl animate-bounce">👏🏆✨</span>
            <h3 className="text-xl font-bold text-amber-400">{t.roundOverTitle}</h3>
            <p className="text-sm text-slate-300">
              {t.roundWinnerMsg.replace('{winner}', roundWinnerName).replace('{points}', String(roundPointsGained))}
            </p>
            <div className="bg-amber-950/30 px-6 py-3 rounded-2xl border border-amber-900/40 text-sm font-mono flex gap-8">
              <span>{gameMode === 'single' ? t.youLabel : (lang === 'ar' ? 'فريقك' : 'Team 1')}: {team1Score} / {targetScore}</span>
              <span>{gameMode === 'single' ? t.bot1Name : (lang === 'ar' ? 'المنافس' : 'Team 2')}: {team2Score} / {targetScore}</span>
            </div>

            <button
              onClick={startNextRound}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-full text-xs active:scale-95 transition-all cursor-pointer border border-amber-400"
            >
              {t.nextRoundBtn}
            </button>
          </div>
        )}

        {phase === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
            {team1Score >= targetScore ? (
              <>
                <span className="text-6xl animate-bounce">👑🏆🎖️</span>
                <h3 className="text-2xl font-black text-amber-400">{t.gameOverWin}</h3>
              </>
            ) : (
              <>
                <span className="text-6xl">💥😭💔</span>
                <h3 className="text-xl font-bold text-rose-500">{t.gameOverLoss}</h3>
              </>
            )}

            <button
              onClick={() => setPhase('init')}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-full text-xs active:scale-95 transition-all cursor-pointer border border-amber-400"
            >
              {lang === 'ar' ? 'العودة للقائمة الرئيسية 🏠' : 'Main Menu 🏠'}
            </button>
          </div>
        )}

      </div>

      {/* RIGHT SIDE: Vertical Boneyard Stack (Matches Mockup) */}
      {phase === 'playing' && gameMode === 'single' && (
        <div className="w-[120px] shrink-0 h-full py-4 pr-4 pl-2 flex flex-col items-center gap-4 relative z-10 overflow-hidden">
          
          {/* Header Box */}
          <div className="w-full bg-[#0a0502]/80 border border-amber-900/40 rounded-xl p-2.5 flex flex-col items-center gap-2 shadow-lg">
            <h3 className="text-[10px] font-black text-amber-500/90 tracking-widest uppercase text-center leading-tight drop-shadow-md">
              {lang === 'ar' ? 'السحّاب' : 'DRAW FACEDOWN TILE'}
            </h3>
            <span className="text-[14px] bg-amber-950/80 w-full text-center py-1 rounded-md border border-amber-800/50 text-amber-400 font-mono font-bold shadow-inner">
              {boneyard.length}
            </span>
          </div>

          {/* Vertical Stack of Horizontal Tiles */}
          {boneyard.length > 0 && (
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-none flex flex-col items-center gap-1.5 pb-4 pt-2">
              {boneyard.map((_, idx) => (
                <div 
                  key={`boneyard-tile-${idx}`} 
                  className="w-[64px] h-[32px] shrink-0 relative transition-transform hover:-translate-x-1 cursor-pointer opacity-90 hover:opacity-100"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 scale-[0.8]">
                    <RenderDominoBack
                      onClick={() => handleDrawTile(idx)}
                      disabled={turn !== 0 || !!userHasMove}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hint / Warning */}
          {userHasMove && boneyard.length > 0 && (
            <div className="w-full bg-[#150a05]/90 border border-amber-600/30 text-[#d4af37]/90 rounded-lg p-2 text-[9px] font-bold leading-relaxed text-center shadow-md">
              ⚠️ {lang === 'ar'
                ? 'لديك لعب متاح!'
                : 'Playable tiles in hand!'}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default function DominoGame() {
  return (
    <Suspense fallback={<div>Loading Dominoes...</div>}>
      <DominoGameContent />
    </Suspense>
  );
}
