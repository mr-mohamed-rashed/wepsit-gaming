'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Hero class definition
interface HeroClass {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  maxHp: number;
  maxShield: number;
  baseDmg: number;
  desc: string;
  descEn: string;
}

// Enemy Boss definition
interface Boss {
  name: string;
  nameEn: string;
  icon: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  dmg: number;
}

// Chat message interface
interface ChatMessage {
  id: string;
  sender: 'you' | 'boss' | 'system';
  senderName: string;
  text: string;
  time: string;
}

// Web Audio API sound synthesizers for cyber effects
class CyberSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playLaser() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playShield() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playHack() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const time = now + i * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200 - i * 200, time);
      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      osc.start(time);
      osc.stop(time + 0.04);
    }
  }

  playOverload() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.45);
    
    const noise = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();
    noise.type = 'triangle';
    noise.frequency.setValueAtTime(50, now);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.start();
    noise.start();
    osc.stop(now + 0.5);
    noise.stop(now + 0.5);
  }

  playShuffle() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Cyber synth sweep shuffle
    for (let i = 0; i < 8; i++) {
      const time = now + i * 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600 - i * 40, time);
      osc.frequency.linearRampToValueAtTime(200 - i * 20, time + 0.12);
      gain.gain.setValueAtTime(0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.start(time);
      osc.stop(time + 0.12);
    }
  }

  playDeal() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playWin() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const time = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.005, time + 0.25);
      osc.start(time);
      osc.stop(time + 0.25);
    });
  }

  playLose() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }
}

const synth = new CyberSynth();

function CyberArenaContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'ar';
  const userId = searchParams.get('userId') || 'mock-user-developer-admin';

  // Game phases: 'init' | 'class_select' | 'shuffling' | 'dealing' | 'battle' | 'gameover'
  const [phase, setPhase] = useState<'init' | 'class_select' | 'shuffling' | 'dealing' | 'battle' | 'gameover'>('init');
  
  // Hero and Enemy Stats
  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerShield, setPlayerShield] = useState<number>(30);
  const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
  const [bossStage, setBossStage] = useState<number>(1);
  const [overloadCd, setOverloadCd] = useState<number>(0);
  const [turn, setTurn] = useState<number>(0); // 0: Player, 1: Boss
  
  // Chat console
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [dealtCount, setDealtCount] = useState<number>(0);

  const t = {
    ar: {
      title: '🎰 حلبة معارك السايبر (Cyber Arena Battles) 🎰',
      subtitle: 'حرب تكتيكية مستقبلية • الذكاء الاصطناعي ضد محترفي الاختراق',
      startBtn: '🪙 دفع 50 عملة وبدء تفنيط البطاقات (Buy-in 50)',
      shufflingText: '⚙️ جاري تفنيط مصفوفة البطاقات الرقمية المشفرة...',
      dealingText: '🔌 جاري شحن وتوزيع بروتوكولات القتال على الأجهزة...',
      selectClassTitle: 'اختر فئة مقاتل السايبر الخاص بك:',
      yourTurn: 'دورك! اختر أمراً تكتيكياً لتنفيذه.',
      botTurn: 'جاري تشغيل خوارزميات هجوم الزعيم {name}...',
      playAgain: 'تحدي جديد 🔄',
      chatTitle: '📟 شاشة وحدة التحكم والدردشة (Cyber Chat Console)',
      laserBtn: 'ليزر هجومي ⚔️',
      shieldBtn: 'شحن الدروع 🛡️',
      hackBtn: 'اختراق رقمي 💻',
      overloadBtn: 'حمل زائد ⚡',
      hpLabel: 'النقاط الحيوية (HP)',
      shieldLabel: 'الدروع الكونية (Shield)',
      youLabel: 'مخترق السايبر (أنت)',
      systemName: 'النظام الأمني 🖥️',
      gameOverWin: '🎉 مبروك! قمت بتصفية كافة الزعماء وحصدت +150 عملة 🪙',
      gameOverLoss: '💥 تم تدمير نظامك الأمني بالكامل! خصم 50 عملة 🪙',
      stageLabel: 'المرحلة',
      rogueDesc: 'هجوم خاطف وسريع. هجوم أساسي أقوى ولكن نقاط حياة متوسطة.',
      mageDesc: 'مخترق التعاويذ. دروع قوية ويزيد الدروع بنسبة هائلة.',
      tankDesc: 'الروبوت المدرع. صحة عملاقة ودروع حديدية تمتص الضربات.'
    },
    en: {
      title: '🎰 Cyber Arena Battles 🎰',
      subtitle: 'Futuristic Card Battle • Hackers vs Security AI Bosses',
      startBtn: '🪙 Pay 50 Coins Buy-in to Compile',
      shufflingText: '⚙️ Shuffling the encrypted card matrix...',
      dealingText: '🔌 Distributing combat protocols to nodes...',
      selectClassTitle: 'Select your Cyber Fighter Class:',
      yourTurn: 'Your turn! Select a tactical command.',
      botTurn: "Compiling {name}'s attack vector...",
      playAgain: 'New Challenge 🔄',
      chatTitle: '📟 Cyber Chat Console & Combat Log',
      laserBtn: 'Laser Strike ⚔️',
      shieldBtn: 'Charge Shields 🛡️',
      hackBtn: 'System Hack 💻',
      overloadBtn: 'Overload Core ⚡',
      hpLabel: 'Structural HP',
      shieldLabel: 'Active Shield',
      youLabel: 'Cyber Hacker (You)',
      systemName: 'System Core 🖥️',
      gameOverWin: '🎉 Victory! You defeated the glitched core! Earned +150 Gold 🪙',
      gameOverLoss: '💥 System Crash! Core melted down. Penalty -50 Gold 🪙',
      stageLabel: 'Stage',
      rogueDesc: 'Swift laser strikes. High damage output, moderate HP.',
      mageDesc: 'Techno Wizard. Massive shields and recovery programs.',
      tankDesc: 'Titan Mech. Giant health bar and solid defensive armor.'
    }
  }[lang];

  const heroClasses: HeroClass[] = [
    { id: 'rogue', name: 'المخادع التكتيكي 🗡️', nameEn: 'Techno Rogue 🗡️', icon: '🗡️', maxHp: 90, maxShield: 30, baseDmg: 24, desc: t.rogueDesc, descEn: t.rogueDesc },
    { id: 'mage', name: 'ساحر السايبر 🔮', nameEn: 'Cyber Mage 🔮', icon: '🔮', maxHp: 80, maxShield: 60, baseDmg: 16, desc: t.mageDesc, descEn: t.mageDesc },
    { id: 'tank', name: 'الروبوت الفولاذي 🤖', nameEn: 'Robo Tank 🤖', icon: '🤖', maxHp: 120, maxShield: 40, baseDmg: 14, desc: t.tankDesc, descEn: t.tankDesc }
  ];

  const bossList: Boss[] = [
    { name: 'بوت الفرم Byte Crusher 🤖', nameEn: 'Byte Crusher 🤖', icon: '🤖', hp: 90, maxHp: 90, shield: 20, maxShield: 20, dmg: 14 },
    { name: 'امبراطور النيون Neon Overlord 👑', nameEn: 'Neon Overlord 👑', icon: '👑', hp: 130, maxHp: 130, shield: 30, maxShield: 30, dmg: 18 },
    { name: 'الفيروس Glitch System 👾', nameEn: 'Glitch System 👾', icon: '👾', hp: 170, maxHp: 170, shield: 40, maxShield: 40, dmg: 24 }
  ];

  // Scroll console to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addChatMessage = (sender: ChatMessage['sender'], senderName: string, text: string) => {
    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChatMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, sender, senderName, text, time }]);
  };

  const startShuffle = () => {
    synth.playShuffle();
    setPhase('shuffling');
    setChatMessages([]);
    addChatMessage('system', t.systemName, lang === 'ar' ? 'تم الدخول للحلبة. جاري تنزيل ملفات اللعب...' : 'Entered the arena. Compiling game decks...');

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
      if (count >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('class_select');
          addChatMessage('system', t.systemName, lang === 'ar' ? 'تم تحميل البروتوكول. الرجاء اختيار نوع المقاتل!' : 'Protocol compiled. Please choose your fighter class!');
        }, 300);
      }
    }, 1500 / 5);
  };

  const selectHeroClass = (hc: HeroClass) => {
    setSelectedClass(hc);
    setPlayerHp(hc.maxHp);
    setPlayerShield(hc.maxShield);
    setBossStage(1);
    
    const firstBoss = { ...bossList[0] };
    setActiveBoss(firstBoss);
    setOverloadCd(0);
    setPhase('battle');
    setTurn(0); // Player goes first

    addChatMessage('system', t.systemName, lang === 'ar' 
      ? 'اخترت فئة ' + hc.name + '. تبدأ المواجهة مع الزعيم الأول: ' + firstBoss.name + '!'
      : 'You chose ' + hc.nameEn + '. Combat started with first boss: ' + firstBoss.nameEn + '!');
  };

  // Combat Mechanics
  const handlePlayerAction = (action: 'attack' | 'shield' | 'hack' | 'overload') => {
    if (phase !== 'battle' || turn !== 0 || !activeBoss || !selectedClass) return;

    let dmgDealt = 0;
    let shieldGained = 0;
    let actionText = '';

    if (action === 'attack') {
      synth.playLaser();
      dmgDealt = selectedClass.baseDmg;
      actionText = lang === 'ar' 
        ? 'أطلقت شعاع ليزر مدمراً تسبب في ضرر ' + dmgDealt + ' للخصم! ⚔️'
        : 'Fired laser blast dealing ' + dmgDealt + ' damage to boss! ⚔️';
    } else if (action === 'shield') {
      synth.playShield();
      shieldGained = Math.floor(selectedClass.maxShield * 0.45);
      actionText = lang === 'ar' 
        ? 'شحنت دروع السايبر واستعدت +' + shieldGained + ' درع حماية! 🛡️'
        : 'Recharged energy barriers by +' + shieldGained + ' shields! 🛡️';
    } else if (action === 'hack') {
      synth.playHack();
      dmgDealt = Math.floor(selectedClass.baseDmg * 0.7);
      // Extra shield bypass
      actionText = lang === 'ar' 
        ? 'اخترقت نظام الزعيم الأمني متجاوزاً الدروع بضرر حتمي ' + dmgDealt + '! 💻'
        : 'Hacked boss core bypass shield for direct ' + dmgDealt + ' damage! 💻';
    } else if (action === 'overload') {
      if (overloadCd > 0) return;
      synth.playOverload();
      dmgDealt = Math.floor(selectedClass.baseDmg * 1.8);
      setOverloadCd(3); // 3 turns cooldown
      actionText = lang === 'ar' 
        ? 'حمل زائد على النواة! تفجير حراري عنيف بقيمة ' + dmgDealt + ' ضرر! ⚡'
        : 'Initiated core overload! Exploded system for ' + dmgDealt + ' damage! ⚡';
    }

    addChatMessage('you', t.youLabel, actionText);

    // Apply damage to boss
    let bossDmgApplied = dmgDealt;
    let nextBossShield = activeBoss.shield;
    let nextBossHp = activeBoss.hp;

    if (action === 'hack') {
      // Hack bypasses shield
      nextBossHp = Math.max(0, activeBoss.hp - bossDmgApplied);
    } else {
      // Normal attack/overload deals to shield first
      if (nextBossShield > 0) {
        if (bossDmgApplied <= nextBossShield) {
          nextBossShield -= bossDmgApplied;
          bossDmgApplied = 0;
        } else {
          bossDmgApplied -= nextBossShield;
          nextBossShield = 0;
        }
      }
      nextBossHp = Math.max(0, nextBossHp - bossDmgApplied);
    }

    // Apply shield recharge
    const nextPlayerShield = Math.min(selectedClass.maxShield, playerShield + shieldGained);
    setPlayerShield(nextPlayerShield);

    // Update Boss state
    const updatedBoss = {
      ...activeBoss,
      shield: nextBossShield,
      hp: nextBossHp
    };

    setActiveBoss(updatedBoss);

    // Check if boss died
    if (nextBossHp <= 0) {
      if (bossStage < 3) {
        const nextStage = bossStage + 1;
        const nextBoss = { ...bossList[nextStage - 1] };
        setBossStage(nextStage);
        setActiveBoss(nextBoss);
        setOverloadCd(0);
        addChatMessage('system', t.systemName, lang === 'ar' 
          ? 'تم القضاء على الزعيم! يظهر الزعيم الأقوى للمرحلة ' + nextStage + ': ' + nextBoss.name + '!'
          : 'Defeated boss! Next tier boss for Stage ' + nextStage + ' has spawned: ' + nextBoss.nameEn + '!');
      } else {
        // Human Wins!
        setPhase('gameover');
        synth.playWin();
        addChatMessage('system', t.systemName, t.gameOverWin);
        window.parent.postMessage({ type: 'GAME_OVER', outcome: 'win', reward: 150 }, '*');
        return;
      }
    } else {
      // Advance turn to Boss
      setTurn(1);
    }

    // Reduce cooldown
    setOverloadCd((prev) => Math.max(0, prev - 1));
  };

  // Boss simulated turn
  useEffect(() => {
    if (phase !== 'battle' || turn !== 1 || !activeBoss || !selectedClass) return;

    const timer = setTimeout(() => {
      // Random boss actions
      const rand = Math.random();
      let bossActionText = '';
      let bossDmg = activeBoss.dmg;

      if (rand > 0.65) {
        // Special Boss Overload
        bossDmg = Math.floor(activeBoss.dmg * 1.5);
        bossActionText = lang === 'ar'
          ? 'أطلق الزعيم ' + activeBoss.name + ' موجة مشفرة عملاقة بقوة ' + bossDmg + ' ضرر! 👾'
          : 'Boss ' + activeBoss.nameEn + ' unleashed critical payload for ' + bossDmg + ' damage! 👾';
      } else if (rand > 0.35) {
        // Normal attack
        bossActionText = lang === 'ar'
          ? 'قام الزعيم ' + activeBoss.name + ' بإلقاء فيروسات هجومية بقيمة ' + bossDmg + ' ضرر. ⚔️'
          : 'Boss ' + activeBoss.nameEn + ' launched Trojan files for ' + bossDmg + ' damage. ⚔️';
      } else {
        // Recharge shield
        const bossShieldGain = Math.floor(activeBoss.maxShield * 0.4);
        setActiveBoss((prev) => prev ? { ...prev, shield: Math.min(prev.maxShield, prev.shield + bossShieldGain) } : null);
        bossActionText = lang === 'ar'
          ? 'قام الزعيم ' + activeBoss.name + ' بتحديث جدار الحماية وشحن دروعه بقيمة +' + bossShieldGain + '! 🛡️'
          : 'Boss ' + activeBoss.nameEn + ' updated firewalls recharging +' + bossShieldGain + ' shields! 🛡️';
        bossDmg = 0;
      }

      addChatMessage('boss', activeBoss.name, bossActionText);

      if (bossDmg > 0) {
        let playerDmgApplied = bossDmg;
        let nextPlayerShield = playerShield;
        let nextPlayerHp = playerHp;

        if (nextPlayerShield > 0) {
          if (playerDmgApplied <= nextPlayerShield) {
            nextPlayerShield -= playerDmgApplied;
            playerDmgApplied = 0;
          } else {
            playerDmgApplied -= nextPlayerShield;
            nextPlayerShield = 0;
          }
        }
        nextPlayerHp = Math.max(0, nextPlayerHp - playerDmgApplied);

        setPlayerHp(nextPlayerHp);
        setPlayerShield(nextPlayerShield);

        // Check if player died
        if (nextPlayerHp <= 0) {
          setPhase('gameover');
          synth.playLose();
          addChatMessage('system', t.systemName, t.gameOverLoss);
          window.parent.postMessage({ type: 'GAME_OVER', outcome: 'loss', penalty: 50 }, '*');
          return;
        }
      }

      // Return turn to player
      setTurn(0);
    }, 1200);

    return () => clearTimeout(timer);
  }, [turn, phase, activeBoss, playerHp, playerShield, selectedClass]);

  const handleBuyIn = () => {
    window.parent.postMessage({ type: 'BUY_IN', amount: 50 }, '*');
    startShuffle();
  };

  return (
    <div className="min-h-screen bg-transparent text-purple-100 flex flex-col md:flex-row font-sans select-none overflow-hidden relative">
      
      {/* Blurred Game Card Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center -z-20 scale-105"
        style={{
          backgroundImage: "url('/cyber_card.png')",
          filter: 'brightness(0.35) saturate(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 -z-10" />
      
      {/* LEFT SIDE: Combat Felt Arena Space (3/4 width) */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 relative border-r border-[#1e0f2d]">
        
        {/* Cyber style neon header */}
        <header className="text-center py-2.5 border-b border-purple-900/30 w-full z-10 bg-slate-950/40 rounded-xl shadow-lg shadow-purple-950/20">
          <h2 className="text-base font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent tracking-widest uppercase">
            {t.title}
          </h2>
          <p className="text-[9px] text-purple-500 font-mono mt-0.5">{t.subtitle}</p>
        </header>

        {/* Shuffling Loading Matrix Screen */}
        {phase === 'shuffling' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-20">
            <div className="relative w-40 h-40 border border-purple-500/30 rounded-2xl flex items-center justify-center bg-slate-950/80 shadow-2xl shadow-purple-950/40">
              <span className="text-5xl animate-[spin_4s_linear_infinite]">⚙️</span>
              <span className="absolute text-purple-400 font-mono text-[9px] bottom-3 animate-pulse">COMPILING...</span>
            </div>
            <h3 className="text-xs font-mono text-purple-300 animate-pulse">{t.shufflingText}</h3>
          </div>
        )}

        {/* Dealing Screen */}
        {phase === 'dealing' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-20">
            <div className="relative w-48 h-48 border border-dashed border-purple-800/40 rounded-full flex items-center justify-center bg-slate-950/40">
              <div className="absolute w-10 h-14 bg-gradient-to-br from-purple-700 to-pink-700 border border-pink-400 rounded-lg animate-[deal-fly_0.15s_infinite] shadow-lg flex items-center justify-center text-xs">
                🔌
              </div>
              <div className="text-center text-xs font-mono text-pink-400">
                <span>PORTAL CHIP</span>
                <span className="block text-lg font-black">{dealtCount} / 5</span>
              </div>
            </div>
            <h3 className="text-xs font-mono text-pink-300 animate-pulse">{t.dealingText}</h3>
            
            <style jsx global>{`
              @keyframes deal-fly {
                0% { transform: scale(0.1) rotate(0deg); opacity: 0.1; }
                100% { transform: scale(1) translateY(-50px) rotate(360deg); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {phase === 'init' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <span className="text-6xl animate-bounce">⚡🤖👾</span>
            <button
              onClick={handleBuyIn}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-full text-xs shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all cursor-pointer border border-pink-400"
            >
              {t.startBtn}
            </button>
          </div>
        )}

        {phase === 'class_select' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-20 max-w-lg w-full">
            <h3 className="text-sm font-bold text-purple-300">{t.selectClassTitle}</h3>
            <div className="grid grid-cols-1 gap-4 w-full">
              {heroClasses.map((hc) => (
                <button
                  key={hc.id}
                  onClick={() => selectHeroClass(hc)}
                  className="bg-slate-950/80 hover:bg-[#1a0e28]/80 border-2 border-purple-900/50 hover:border-pink-500/80 p-4 rounded-2xl text-right flex flex-row-reverse items-center justify-between transition-all cursor-pointer shadow-lg active:scale-98 group"
                >
                  <span className="text-2xl">{hc.icon}</span>
                  <div className="flex-1 mr-4 text-right">
                    <h4 className="font-black text-white text-xs group-hover:text-pink-400">{lang === 'ar' ? hc.name : hc.nameEn}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{lang === 'ar' ? hc.desc : hc.descEn}</p>
                    <div className="flex justify-end gap-3 mt-2 text-[9px] font-mono text-purple-400">
                      <span>HP: {hc.maxHp}</span>
                      <span>SHIELD: {hc.maxShield}</span>
                      <span>DMG: {hc.baseDmg}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {(phase === 'battle' || phase === 'gameover') && activeBoss && selectedClass && (
          <div className="flex-1 w-full max-w-xl flex flex-col justify-between relative h-full my-4">
            
            {/* Top Boss Panel */}
            <div className="bg-slate-950/60 border border-[#2b1641] rounded-2xl p-3.5 space-y-2.5 shadow-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="animate-pulse">👾</span> {lang === 'ar' ? activeBoss.name : activeBoss.nameEn}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {t.stageLabel} {bossStage} / 3
                </span>
              </div>

              {/* Boss health & shield bars */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-rose-600 transition-all duration-300"
                    style={{ width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>{t.hpLabel}: {activeBoss.hp} / {activeBoss.maxHp}</span>
                  <span>{t.shieldLabel}: {activeBoss.shield} / {activeBoss.maxShield}</span>
                </div>
              </div>
            </div>

            {/* Battle Field Animation Grid */}
            <div className="flex justify-between items-center my-auto px-6 relative h-48">
              {/* Grid backgrounds */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/10 via-transparent to-transparent -z-10"></div>
              
              {/* Player side sprite */}
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(168,85,247,0.25)] animate-bounce">
                  {selectedClass.icon}
                </div>
                <span className="text-[9px] bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30 text-purple-300 font-mono block">
                  {selectedClass.nameEn}
                </span>
              </div>

              {/* Clash FX */}
              <div className="text-2xl animate-ping text-pink-500">⚡</div>

              {/* Boss side sprite */}
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-pulse">
                  {activeBoss.icon}
                </div>
                <span className="text-[9px] bg-rose-950 px-2 py-0.5 rounded border border-rose-500/30 text-rose-300 font-mono block">
                  {activeBoss.nameEn}
                </span>
              </div>
            </div>

            {/* Bottom Player Panel */}
            <div className="space-y-3">
              {/* Player stats indicators */}
              <div className="bg-slate-950/60 border border-purple-950/40 rounded-xl p-3 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-purple-400">
                    <span>{t.hpLabel}</span>
                    <span>{playerHp} / {selectedClass.maxHp}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(playerHp / selectedClass.maxHp) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-indigo-400">
                    <span>{t.shieldLabel}</span>
                    <span>{playerShield} / {selectedClass.maxShield}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${(playerShield / selectedClass.maxShield) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Combat Buttons Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
                <button
                  onClick={() => handlePlayerAction('attack')}
                  disabled={turn !== 0 || phase !== 'battle'}
                  className="py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl border border-purple-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  {t.laserBtn}
                </button>
                <button
                  onClick={() => handlePlayerAction('shield')}
                  disabled={turn !== 0 || phase !== 'battle'}
                  className="py-2.5 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl border border-blue-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  {t.shieldBtn}
                </button>
                <button
                  onClick={() => handlePlayerAction('hack')}
                  disabled={turn !== 0 || phase !== 'battle'}
                  className="py-2.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl border border-emerald-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  {t.hackBtn}
                </button>
                <button
                  onClick={() => handlePlayerAction('overload')}
                  disabled={turn !== 0 || phase !== 'battle' || overloadCd > 0}
                  className={`py-2.5 bg-gradient-to-r from-rose-700 to-pink-700 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl border border-rose-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md ${
                    overloadCd > 0 ? 'relative' : ''
                  }`}
                >
                  {t.overloadBtn} {overloadCd > 0 ? `(${overloadCd})` : ''}
                </button>
              </div>
            </div>

          </div>
        )}

        {phase === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
            {playerHp > 0 ? (
              <>
                <span className="text-6xl animate-bounce">👑🏆🎖️</span>
                <h3 className="text-2xl font-black text-amber-400">{t.gameOverWin}</h3>
              </>
            ) : (
              <>
                <span className="text-6xl">💥😭💾</span>
                <h3 className="text-xl font-bold text-rose-500">{t.gameOverLoss}</h3>
              </>
            )}

            <button
              onClick={startShuffle}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-full text-xs active:scale-95 transition-all cursor-pointer border border-purple-400"
            >
              {t.playAgain}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

export default function CyberArena() {
  return (
    <Suspense fallback={<div>Loading Cyber Arena...</div>}>
      <CyberArenaContent />
    </Suspense>
  );
}
