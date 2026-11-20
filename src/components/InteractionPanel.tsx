'use client';

import { useState, useEffect, useRef } from 'react';
import { buyEmote } from '@/app/actions/economyActions';
import { Profile } from '@/lib/supabase';

// Web Audio API Synthesizer helper for premium retro game sound effects
class SoundSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playPop() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playOminous() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playMagicSpell() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const playFreq = (freq: number, start: number, dur: number, type: OscillatorType) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.005, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };

    playFreq(440, now, 0.15, 'sine');
    playFreq(554, now + 0.06, 0.15, 'triangle');
    playFreq(659, now + 0.12, 0.15, 'sine');
    playFreq(880, now + 0.18, 0.25, 'triangle');
  }

  playMagic() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.4);
    
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.1);
    osc.frequency.linearRampToValueAtTime(600, now + 0.2);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.3);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playArpeggio() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.1);       // C5
    playNote(659.25, now + 0.08, 0.1);  // E5
    playNote(783.99, now + 0.16, 0.1);  // G5
    playNote(1046.50, now + 0.24, 0.2); // C6
  }

  playError() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.setValueAtTime(120, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const synth = new SoundSynth();

interface FloatingEmote {
  id: number;
  emoji?: string;
  imageUrl?: string;
  leftOffset: number;
  isBurst: boolean;
}

interface FloatingParticle {
  id: number;
  emoji?: string;
  imageUrl?: string;
  startX: number;
  startY: number;
  tx: number;
  ty: number;
  tr: number;
}

interface PremiumEmoteData {
  id: string;
  name: string;
  cost: number;
  imageUrl?: string;
  emoji?: string;
}

interface ActiveMagicSpeech {
  id: number;
  avatar: string;
  text: string;
  sender: 'you' | 'opponent';
  emotion: string;
}

interface ChatEntry {
  id: string;
  sender: 'you' | 'opponent' | 'system';
  senderName: string;
  text: string;
  time: string;
}

interface InteractionPanelProps {
  profile: Profile;
  onUpdate: (profile: Profile, quest: any) => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  lang?: 'ar' | 'en';
  activeGame?: string;
}

export default function InteractionPanel({ profile, onUpdate, addToast, lang = 'ar', activeGame }: InteractionPanelProps) {
  const [panelMode, setPanelMode] = useState<'emotes' | 'magic' | 'fighter' | 'ranger'>('emotes');
  const [emotes, setEmotes] = useState<FloatingEmote[]>([]);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [activeMagic, setActiveMagic] = useState<ActiveMagicSpeech | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Unified Chat states
  const [chatLog, setChatLog] = useState<ChatEntry[]>([
    {
      id: 'chat-1',
      sender: 'system',
      senderName: lang === 'ar' ? 'المنصة' : 'System',
      text: lang === 'ar' ? 'مرحبًا بك في لوحة التفاعل الموحدة! جاهز للتحدي؟ 🕹️' : 'Welcome to the tactical interaction panel! Ready? 🕹️',
      time: '12:00 PM',
    },
  ]);
  const [typedMsg, setTypedMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const t = {
    ar: {
      normalTab: 'النمط العادي',
      magicTab: '✨ نمط ماجيك',
      emotesTab: '😀 الإيموجي',
      fighterTab: '⚡ المقاتل كايزن',
      rangerTab: '🏹 الرينجر (Ranger)',
      wizSpeakTitle: '🔮 دردشة السحرة (Wizard Speak)',
      reactionsTitle: '💬 شات اللعب التكتيكي والرموز',
      goldLabel: 'الذهب',
      opponentBtn: '🤖 محاكاة الخصم',
      chatPlaceholderNormal: 'اكتب رسالة للدردشة التكتيكية...',
      wizardHeadline: activeGame === 'fighter' ? '⚡ المقاتل الحديدي:' : '🔮 السحرة:',
      wizardTip: activeGame === 'fighter' ? '(انقر للتفاعل بهجوم المقاتل)' : '(عند النقر، يظهر الساحر متكلماً بصوت تعويذة)',
      emotesTitle: '😊 اختر رمزاً لإرساله:',
      tacticalTitle: '💬 عبارات تكتيكية جاهزة:',
      shopTitle: '🛍️ متجر الرموز المميزة (3D Shop)',
      unlockedLabel: 'مفتوح',
      buyLabel: 'شراء',
      senderYou: activeGame === 'fighter' ? 'المقاتل (أنت)' : 'أنت الساحر',
      senderOpponent: activeGame === 'fighter' ? 'الخصم الحديدي' : 'عزت الساحر',
      robotName: 'روبوت ضاحك 3D',
      dragonName: 'تنين محارب 3D',
      catName: 'قط ساحر 3D',
      wizHappy: activeGame === 'fighter' ? 'أحسنت صنعاً يا بطل! ضربة قاضية 🌟' : 'أحسنت صنعاً يا ساحر! ضربة عبقرية 🌟',
      wizAngry: activeGame === 'fighter' ? 'اشعر بغضب قبضتي الحديدية الفتاكة! ⚡' : 'اشعر بغضب صاعقتي السحرية الفتاكة! ⚡',
      wizShocked: activeGame === 'fighter' ? 'بحق الحلبة! هجوم خارق لا يصدق! ⚔️' : 'بحق النجوم! سحر خارق لا يصدق! 🔮',
      wizLike: activeGame === 'fighter' ? 'أوافق على هذه الضربة الممتازة! 👍' : 'أوافق على هذه التعويذة الممتازة! 👍',
      wizCrying: activeGame === 'fighter' ? 'درعي يتحطم وقوتي تنهار... 😢' : 'طاقتي السحرية تتلاشى وتنهار تدريجياً... 😢',
    },
    en: {
      normalTab: 'Default Mode',
      magicTab: '✨ Magic Mode',
      emotesTab: '😀 Emojis',
      fighterTab: '⚡ Kaizen Fighter',
      rangerTab: '🏹 Ranger',
      wizSpeakTitle: '🔮 Wizard Talk',
      reactionsTitle: '💬 In-Game Chat & Emotes',
      goldLabel: 'Gold',
      opponentBtn: '🤖 Simulate Bot',
      chatPlaceholderNormal: 'Type tactical message...',
      wizardHeadline: activeGame === 'fighter' ? '⚡ Iron Fighter:' : '🔮 Wizard Emotion:',
      wizardTip: activeGame === 'fighter' ? '(On click, performs fighter attack)' : '(On click, talks with voice spell effect)',
      emotesTitle: '😊 Select Emoji:',
      tacticalTitle: '💬 Tactical Phrases:',
      shopTitle: '🛍️ Premium 3D Shop',
      unlockedLabel: 'Opened',
      buyLabel: 'Buy',
      senderYou: activeGame === 'fighter' ? 'Iron Fighter (You)' : 'Grand Wizard (You)',
      senderOpponent: activeGame === 'fighter' ? 'Rival Fighter' : 'Rival Wizard (Opponent)',
      robotName: '3D Laughing Robot',
      dragonName: '3D Knight Dragon',
      catName: '3D Mage Cat',
      wizHappy: activeGame === 'fighter' ? 'Superb combo, fighter! A stroke of genius! 🌟' : 'Superb move, wizard! A stroke of absolute genius! 🌟',
      wizAngry: activeGame === 'fighter' ? 'Feel the wrath of my iron fists! ⚡' : 'Feel the wrath of my magic lightning storm! ⚡',
      wizShocked: activeGame === 'fighter' ? 'By the arena! An unbelievable attack! ⚔️' : 'By the stars! An unbelievable display of magic! 🔮',
      wizLike: activeGame === 'fighter' ? 'I highly approve of this excellent strike! 👍' : 'I highly approve of this excellent spellcasting! 👍',
      wizCrying: activeGame === 'fighter' ? 'My armor is cracking and fading... 😢' : 'My mystical magic energy is slowly fading... 😢',
    }
  }[lang];

  const freeEmotes = [
    { emoji: '😂', label: 'Laugh' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😢', label: 'Cry' },
    { emoji: '😲', label: 'Shocked' },
    { emoji: '👍', label: 'ThumbsUp' }
  ];

  const premiumEmotes: PremiumEmoteData[] = [
    {
      id: 'premium-wizard',
      name: lang === 'ar' ? 'الساحر الأسطوري' : 'Legendary Wizard',
      cost: 150,
      emoji: '🧙‍♂️'
    },
    {
      id: 'premium-fighter',
      name: lang === 'ar' ? 'المقاتل الحديدي' : 'Iron Hero',
      cost: 250,
      emoji: '🦸‍♂️'
    },
    {
      id: 'premium-ranger',
      name: lang === 'ar' ? 'رامي السهام' : 'Ranger',
      cost: 350,
      emoji: '🧝‍♂️'
    }
  ];

  const wizardEmotes = [
    { id: 'happy', name: lang === 'ar' ? 'سعيد' : 'Happy', image: '/wizard_happy.png', text: t.wizHappy },
    { id: 'angry', name: lang === 'ar' ? 'غاضب' : 'Angry', image: '/wizard_angry.png', text: t.wizAngry },
    { id: 'shocked', name: lang === 'ar' ? 'منذهل' : 'Shocked', image: '/wizard_shocked.png', text: t.wizShocked },
    { id: 'like', name: lang === 'ar' ? 'لايك' : 'Like', image: '/wizard_like.png', text: t.wizLike },
    { id: 'crying', name: lang === 'ar' ? 'باكي' : 'Crying', image: '/wizard_crying.png', text: t.wizCrying }
  ];

  const fighterEmotesList = [
    { id: 'happy', name: lang === 'ar' ? 'ضحك' : 'Laugh', image: '/fighter_happy.png', text: t.wizHappy },
    { id: 'angry', name: lang === 'ar' ? 'غضب' : 'Angry', image: '/fighter_angry.png', text: t.wizAngry },
    { id: 'shocked', name: lang === 'ar' ? 'متعجب' : 'Shocked', image: '/fighter_shocked.png', text: t.wizShocked },
    { id: 'like', name: lang === 'ar' ? 'لايك' : 'Like', image: '/fighter_like.png', text: t.wizLike },
    { id: 'crying', name: lang === 'ar' ? 'باكي' : 'Crying', image: '/fighter_crying.png', text: t.wizCrying }
  ];

  const rangerEmotesList = [
    { id: 'happy', name: lang === 'ar' ? 'ضحك' : 'Laugh', image: '/ranger_happy.png', text: lang === 'ar' ? 'رمية ممتازة يا بطل! 🎯' : 'Excellent shot, hero! 🎯' },
    { id: 'angry', name: lang === 'ar' ? 'غضب' : 'Angry', image: '/ranger_angry.png', text: lang === 'ar' ? 'سهامي لن تخطئ هدفها أبداً! 🏹' : 'My arrows never miss their mark! 🏹' },
    { id: 'shocked', name: lang === 'ar' ? 'متعجب' : 'Shocked', image: '/ranger_shocked.png', text: lang === 'ar' ? 'يا لها من مناورة سريعة! 💨' : 'What a swift maneuver! 💨' },
    { id: 'like', name: lang === 'ar' ? 'لايك' : 'Like', image: '/ranger_like.png', text: lang === 'ar' ? 'أعجبتني تكتيكاتك في الغابة! 🌲' : 'I like your forest tactics! 🌲' },
    { id: 'crying', name: lang === 'ar' ? 'باكي' : 'Crying', image: '/ranger_crying.png', text: lang === 'ar' ? 'نفدت سهامي وأنا في ورطة... 🥀' : 'I am out of arrows and in trouble... 🥀' }
  ];

  const currentEmotes = activeGame === 'fighter' ? fighterEmotesList : wizardEmotes;

  const strategicPhrases = [
    { text: "Checkmate is Coming! 👑", sound: () => synth.playOminous() },
    { text: "Excellent Move... ⚔️", sound: () => synth.playArpeggio() },
    { text: "Taste my Magic! 🧙‍♂️", sound: () => synth.playMagic() },
    { text: "Your Strategy is Flawed 🧠", sound: () => synth.playError() },
    { text: "Good Game! 🤝", sound: () => synth.playArpeggio() },
    { text: "Oops! Mistake 💥", sound: () => synth.playError() }
  ];

  // Send message in unified chat log
  const handleSendChatMessage = (text: string, sender: 'you' | 'opponent' = 'you', senderName?: string) => {
    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const name = sender === 'you' ? profile.username : (senderName || (lang === 'ar' ? 'عزت' : 'Ezzo'));

    const entry: ChatEntry = {
      id: `chat-${Date.now()}-${Math.random()}`,
      sender,
      senderName: name,
      text,
      time,
    };

    setChatLog((prev) => [...prev, entry]);

    if (sender === 'you') {
      setTypedMsg('');
      // Bot auto-banter reaction
      setTimeout(() => {
        const botReplies = [
          lang === 'ar' ? 'ماشي يا معلم، وريني هتلعب إزاي! 🎲' : 'Okay boss, show me your moves! 🎲',
          lang === 'ar' ? 'الزهر بتاعي صاحي ومصحصح النهاردة 💥' : 'My dice is hot and awake today 💥',
          lang === 'ar' ? 'سحر الشيش والنرد معايا يا صديقي.' : 'The spell of sheesh is on my side.',
          lang === 'ar' ? 'الملعب مفتوح والنهاية معروفة!' : 'The table is open and the end is known!',
        ];
        const botReply = botReplies[Math.floor(Math.random() * botReplies.length)];
        handleSendChatMessage(botReply, 'opponent');
      }, 1500);
    }
  };

  const spawnExplosionParticles = (emoji?: string, imageUrl?: string, leftOffset = 100) => {
    const particleCount = 8;
    const newParticles: FloatingParticle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i * 2 * Math.PI) / particleCount + (Math.random() * 0.4 - 0.2);
      const distance = Math.floor(Math.random() * 50) + 40;
      const tx = Math.round(Math.cos(angle) * distance);
      const ty = Math.round(Math.sin(angle) * distance);
      const tr = Math.floor(Math.random() * 360) - 180;
      const id = Date.now() + Math.random();

      newParticles.push({
        id,
        emoji,
        imageUrl,
        startX: leftOffset,
        startY: 230,
        tx,
        ty,
        tr
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      const particleIds = newParticles.map(p => p.id);
      setParticles((prev) => prev.filter(p => !particleIds.includes(p.id)));
    }, 800);
  };

  const triggerFreeEmote = (emoji: string) => {
    synth.playPop();
    const id = Date.now() + Math.random();
    const leftOffset = Math.floor(Math.random() * 220) + 30;
    setEmotes((prev) => [...prev, { id, emoji, leftOffset, isBurst: false }]);
    
    setTimeout(() => {
      spawnExplosionParticles(emoji, undefined, leftOffset);
      setEmotes((prev) => prev.map(e => e.id === id ? { ...e, isBurst: true } : e));
    }, 1100);

    setTimeout(() => {
      setEmotes((prev) => prev.filter((e) => e.id !== id));
    }, 1500);

    handleSendChatMessage(emoji);
  };

  const triggerPremiumEmote = (imageUrl: string, name: string) => {
    synth.playPop();
    const id = Date.now() + Math.random();
    const leftOffset = Math.floor(Math.random() * 220) + 30;
    setEmotes((prev) => [...prev, { id, imageUrl, leftOffset, isBurst: false }]);

    setTimeout(() => {
      spawnExplosionParticles(undefined, imageUrl, leftOffset);
      setEmotes((prev) => prev.map(e => e.id === id ? { ...e, isBurst: true } : e));
    }, 1100);

    setTimeout(() => {
      setEmotes((prev) => prev.filter((e) => e.id !== id));
    }, 1500);

    handleSendChatMessage(`[Emote: ${name}]`);
  };

  const triggerMagicWizard = (wiz: typeof currentEmotes[0]) => {
    if (activeGame === 'fighter') {
      synth.playPop(); // Fighter sound
    } else {
      synth.playMagicSpell();
    }
    const id = Date.now();
    setActiveMagic({
      id,
      avatar: wiz.image,
      text: wiz.text,
      sender: 'you',
      emotion: wiz.name
    });

    setTimeout(() => {
      setActiveMagic((prev) => prev?.id === id ? null : prev);
    }, 3000);

    handleSendChatMessage(wiz.text);
  };

  const handleBuyEmote = async (emote: PremiumEmoteData) => {
    setBuyingId(emote.id);
    try {
      const res = await buyEmote(profile.id, emote.id, emote.cost);
      if (res.success && res.data) {
        addToast(res.message, 'success');
        const cookieStoreVal = document.cookie;
        const mockQuestMatch = cookieStoreVal.match(new RegExp(`(?:^|; )mock_quest_${profile.id}=([^;]*)`));
        let questVal = null;
        if (mockQuestMatch) {
          questVal = JSON.parse(decodeURIComponent(mockQuestMatch[1]));
        }
        onUpdate(res.data, questVal);
      } else {
        addToast(res.message || 'حدث خطأ ما', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'فشلت عملية الشراء', 'error');
    } finally {
      setBuyingId(null);
    }
  };

  const simulateOpponentReaction = () => {
    if (panelMode === 'magic') {
      const randomWiz = currentEmotes[Math.floor(Math.random() * currentEmotes.length)];
      const id = Date.now();
      if (activeGame === 'fighter') {
        synth.playPop();
      } else {
        synth.playMagicSpell();
      }
      setActiveMagic({
        id,
        avatar: randomWiz.image,
        text: randomWiz.text,
        sender: 'opponent',
        emotion: randomWiz.name
      });
      setTimeout(() => {
        setActiveMagic((prev) => prev?.id === id ? null : prev);
      }, 3000);
      handleSendChatMessage(randomWiz.text, 'opponent', lang === 'ar' ? (activeGame === 'fighter' ? 'المقاتل' : 'عزت الساحر') : (activeGame === 'fighter' ? 'Fighter' : 'Ezzo Wizard'));
    } else {
      const isEmote = Math.random() > 0.5;
      if (isEmote) {
        const unlocked = profile.unlocked_emotes || [];
        const hasPremium = unlocked.length > 0;
        if (hasPremium && Math.random() > 0.6) {
          const randomEmoteId = unlocked[Math.floor(Math.random() * unlocked.length)];
          const emoteObj = premiumEmotes.find((pe) => pe.id === randomEmoteId);
          if (emoteObj) {
            if (emoteObj.imageUrl) triggerPremiumEmote(emoteObj.imageUrl, emoteObj.name);
            else triggerFreeEmote(emoteObj.emoji!);
          }
        } else {
          const randomFree = freeEmotes[Math.floor(Math.random() * freeEmotes.length)].emoji;
          triggerFreeEmote(randomFree);
        }
      } else {
        const randomPhraseObj = strategicPhrases[Math.floor(Math.random() * strategicPhrases.length)];
        randomPhraseObj.sound();
        handleSendChatMessage(randomPhraseObj.text, 'opponent');
      }
    }
  };

  return (
    <div className="w-[350px] bg-slate-950/30 border border-slate-800/40 rounded-2xl p-5 shadow-2xl flex flex-col relative h-full min-h-[650px] overflow-visible backdrop-blur-md justify-between">
      
      {/* Floating emotes rendering container */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {emotes.map((e) => {
          if (e.isBurst) return null;
          
          if (e.imageUrl) {
            const isKaizen = e.imageUrl.includes('kaizen');
            return isKaizen ? (
              <div
                key={e.id}
                className="absolute bottom-16 w-14 h-14 animate-float-burst select-none filter drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] rounded-2xl"
                style={{ left: `${e.leftOffset}px`, backgroundImage: `url(${e.imageUrl})`, backgroundSize: '300% 200%', backgroundPosition: '100% 100%' }}
              />
            ) : (
              <img
                key={e.id}
                src={e.imageUrl}
                alt="floating premium emote"
                className="absolute bottom-16 w-14 h-14 animate-float-burst select-none object-contain filter drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                style={{ left: `${e.leftOffset}px` }}
              />
            );
          }
          return (
            <div
              key={e.id}
              className="absolute bottom-16 text-4xl animate-float-burst select-none"
              style={{ left: `${e.leftOffset}px` }}
            >
              {e.emoji}
            </div>
          );
        })}

        {particles.map((p) => {
          const style = {
            left: `${p.startX}px`,
            bottom: `${p.startY}px`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--tr': `${p.tr}deg`,
          } as React.CSSProperties;

          if (p.imageUrl) {
            const isKaizen = p.imageUrl.includes('kaizen');
            return isKaizen ? (
              <div
                key={p.id}
                className="absolute w-6 h-6 animate-particle-explode select-none filter drop-shadow-[0_0_4px_rgba(129,140,248,0.3)] rounded-lg"
                style={{ ...style, backgroundImage: `url(${p.imageUrl})`, backgroundSize: '300% 200%', backgroundPosition: '100% 100%' }}
              />
            ) : (
              <img
                key={p.id}
                src={p.imageUrl}
                alt="particle premium"
                className="absolute w-6 h-6 animate-particle-explode select-none object-contain filter drop-shadow-[0_0_4px_rgba(129,140,248,0.3)]"
                style={style}
              />
            );
          }
          return (
            <div
              key={p.id}
              className="absolute text-lg animate-particle-explode select-none"
              style={style}
            >
              {p.emoji}
            </div>
          );
        })}
      </div>

      {/* Header Info */}
      <div className="border-b border-slate-800 pb-2 mb-2 flex justify-between items-center shrink-0">
        <div>
          <h4 className="text-[11px] font-black text-white flex items-center gap-1">
            {t.reactionsTitle}
          </h4>
          <p className="text-[9px] text-slate-450 font-mono">{t.goldLabel}: {profile.gold_coins} 🪙</p>
        </div>
        <button
          onClick={simulateOpponentReaction}
          className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-[9px] font-bold text-indigo-400 rounded border border-indigo-500/20 active:scale-95 transition-all cursor-pointer"
        >
          {t.opponentBtn}
        </button>
      </div>

      {/* Magic/Fighter/Ranger Mode Floating overlay bubble */}
      {(panelMode === 'magic' || panelMode === 'fighter' || panelMode === 'ranger') && activeMagic && (
        <div className={`absolute top-16 left-4 right-4 z-50 bg-[#0d1220]/95 border-2 ${
          panelMode === 'fighter' ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.4)]' : 
          panelMode === 'ranger' ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 
          'border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.4)]'
        } rounded-3xl p-4 backdrop-blur-2xl animate-fade-in flex items-center gap-6 overflow-visible ${
          activeMagic.sender === 'you' ? 'flex-row' : 'flex-row-reverse'
        }`}>
          {/* Avatar (Circular) */}
          <div className="shrink-0 relative z-50 animate-wizard-popout">
            <img 
              src={activeMagic.avatar} 
              alt="talking avatar" 
              className={`w-28 h-28 object-cover rounded-full border-[4px] shadow-2xl ${
                activeMagic.sender === 'you' && panelMode === 'fighter' 
                  ? 'border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.5)]' 
                  : activeMagic.sender === 'you' && panelMode === 'ranger'
                  ? 'border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)]'
                  : 'border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.5)]'
              }`}
            />
          </div>

          {/* Speech Bubble */}
          <div className={`relative p-4 rounded-[2rem] border-2 text-sm font-bold text-slate-100 flex-1 shadow-lg ${
            activeMagic.sender === 'you'
              ? (panelMode === 'fighter' ? 'bg-[#0f2133] border-cyan-500/50' : panelMode === 'ranger' ? 'bg-[#06291a] border-emerald-500/50' : 'bg-[#221033] border-purple-500/50')
              : (panelMode === 'fighter' ? 'bg-slate-900 border-slate-700/50' : panelMode === 'ranger' ? 'bg-slate-900 border-slate-700/50' : 'bg-[#1a1c3b] border-indigo-500/50')
          }`}>
            {/* Speech Bubble Tail (Triangle) */}
            <div className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rotate-45 border-2 ${
               activeMagic.sender === 'you'
                 ? (panelMode === 'fighter' ? 'bg-[#0f2133] border-cyan-500/50 border-r-0 border-t-0 -left-[11px]' : panelMode === 'ranger' ? 'bg-[#06291a] border-emerald-500/50 border-r-0 border-t-0 -left-[11px]' : 'bg-[#221033] border-purple-500/50 border-r-0 border-t-0 -left-[11px]')
                 : (panelMode === 'fighter' ? 'bg-slate-900 border-slate-700/50 border-l-0 border-b-0 -right-[11px]' : panelMode === 'ranger' ? 'bg-slate-900 border-slate-700/50 border-l-0 border-b-0 -right-[11px]' : 'bg-[#1a1c3b] border-indigo-500/50 border-l-0 border-b-0 -right-[11px]')
            }`} />
            
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 relative z-10 ${panelMode === 'fighter' ? 'text-cyan-400' : panelMode === 'ranger' ? 'text-emerald-400' : 'text-purple-400'}`}>
              {activeMagic.sender === 'you' ? t.senderYou : t.senderOpponent} ({activeMagic.emotion})
            </div>
            <p className="leading-relaxed font-sans text-xs relative z-10">{activeMagic.text}</p>
          </div>
        </div>
      )}

      {/* 💬 UNIFIED CHAT LOG FEED */}
      <div className="flex-1 bg-slate-950/20 border border-slate-850/40 rounded-xl p-3 overflow-y-auto space-y-2 mb-3 scrollbar-thin min-h-[300px] max-h-[350px]">
        {chatLog.map((log) => {
          const isYou = log.sender === 'you';
          const isSys = log.sender === 'system';
          return (
            <div key={log.id} className={`flex flex-col ${isYou ? 'items-end' : 'items-start'} space-y-0.5`}>
              <div className="flex items-center gap-1 text-[7.5px] text-slate-500 font-mono">
                <span className={isYou ? 'text-indigo-400' : (isSys ? 'text-slate-400' : 'text-amber-500')}>{log.senderName}</span>
                <span>•</span>
                <span>{log.time}</span>
              </div>
              <div className={`p-2 rounded-xl text-[10px] leading-relaxed max-w-[85%] border ${
                isYou
                  ? 'bg-indigo-950/25 border-indigo-500/25 text-indigo-100 rounded-tr-none'
                  : isSys
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 text-[9px] text-center w-full'
                  : 'bg-slate-900 border-slate-800 text-amber-200 rounded-tl-none'
              }`}>
                {log.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Text Chat input bar */}
      <div className="flex gap-2 mb-3 shrink-0">
        <input
          type="text"
          value={typedMsg}
          onChange={(e) => setTypedMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage(typedMsg)}
          placeholder={t.chatPlaceholderNormal}
          className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-[10.5px] text-slate-200 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => handleSendChatMessage(typedMsg)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-black rounded-xl active:scale-95 transition-all cursor-pointer"
        >
          🚀
        </button>
      </div>

      {/* Removed normal dropdowns */}

        {/* EMOJIS GRID PANEL */}
        {panelMode === 'emotes' && (
          <div className="space-y-2">
            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{t.emotesTitle}</label>
            <div className="grid grid-cols-5 gap-2 pb-2">
              {freeEmotes.map((em) => (
                <button
                  key={em.emoji}
                  onClick={() => triggerFreeEmote(em.emoji)}
                  className="h-10 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-slate-800 flex items-center justify-center text-lg active:scale-90 transition-all cursor-pointer"
                  title={em.label}
                >
                  {em.emoji}
                </button>
              ))}
              {premiumEmotes
                .filter((pe) => (profile.unlocked_emotes || []).includes(pe.id))
                .map((pe) => (
                  <button
                    key={pe.id}
                    onClick={() => {
                      if (pe.imageUrl) triggerPremiumEmote(pe.imageUrl, pe.name);
                      else triggerFreeEmote(pe.emoji!);
                    }}
                    className="h-10 rounded-xl bg-indigo-950/40 border border-indigo-500/50 hover:border-amber-400 flex items-center justify-center active:scale-90 transition-all cursor-pointer overflow-hidden relative group"
                    title={pe.name}
                  >
                    {pe.imageUrl ? (
                      pe.imageUrl.includes('kaizen') ? (
                        <div 
                          className="w-8 h-8 rounded-full group-hover:scale-110 transition-transform"
                          style={{ 
                            backgroundImage: `url(${pe.imageUrl})`, 
                            backgroundSize: '300% 200%', 
                            backgroundPosition: '100% 100%' 
                          }} 
                        />
                      ) : (
                        <img src={pe.imageUrl} alt={pe.name} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                      )
                    ) : (
                      <div className="text-2xl group-hover:scale-125 transition-transform">{pe.emoji}</div>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Wizard Emotes Select inside Magic Mode */}
        {panelMode === 'magic' && (
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-purple-400 uppercase tracking-widest block">{t.wizardHeadline}</label>
            <div className="flex items-center justify-center gap-4 py-2">
              {wizardEmotes.map((wiz) => (
                <button
                  key={wiz.id}
                  onClick={() => triggerMagicWizard(wiz)}
                  className="group relative cursor-pointer active:scale-90 transition-transform hover:scale-105 transition-all cursor-pointer p-0.5"
                  title={wiz.name}
                >
                  <img src={wiz.image} alt={wiz.name} className="w-10 h-10 object-cover rounded-full border-2 border-slate-800 group-hover:border-purple-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fighter Emotes Select inside Fighter Mode */}
        {panelMode === 'fighter' && (
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest block">{lang === 'ar' ? '⚡ تعبيرات المقاتل الحديدي:' : '⚡ Iron Fighter Emotion:'}</label>
            <div className="flex items-center justify-center gap-4 py-2">
              {fighterEmotesList.map((f) => (
                <button
                  key={f.id}
                  onClick={() => triggerMagicWizard(f)}
                  className="group relative cursor-pointer active:scale-90 transition-transform hover:scale-105 transition-all p-0.5"
                  title={f.name}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-slate-800 group-hover:border-cyan-500 bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img src={f.image} alt={f.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40/090d16/22d3ee?text=⚡')} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ranger Emotes Select inside Ranger Mode */}
        {panelMode === 'ranger' && (
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block">{lang === 'ar' ? '🏹 تعبيرات حارس الغابة:' : '🏹 Ranger Emotion:'}</label>
            <div className="flex items-center justify-center gap-4 py-2">
              {rangerEmotesList.map((r) => (
                <button
                  key={r.id}
                  onClick={() => triggerMagicWizard(r)}
                  className="group relative cursor-pointer active:scale-90 transition-transform hover:scale-105 transition-all p-0.5"
                  title={r.name}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-slate-800 group-hover:border-emerald-500 bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40/090d16/10b981?text=🏹')} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}


      {/* 🛍️ EMOTE SHOP COLLAPSED PANEL */}
      {panelMode === 'emotes' && (
        <div className="border-t border-slate-800/80 pt-2 mb-3 max-h-[90px] overflow-y-auto scrollbar-none shrink-0">
          <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.shopTitle}</label>
          <div className="grid grid-cols-1 gap-1">
            {premiumEmotes.map((emote) => {
              const isUnlocked = (profile.unlocked_emotes || []).includes(emote.id);
              return (
                <div
                  key={emote.id}
                  className="flex items-center justify-between p-1 bg-slate-950/50 border border-slate-850 rounded-lg text-[9px] gap-2"
                >
                  {emote.imageUrl ? (
                    emote.imageUrl.includes('kaizen') ? (
                      <div 
                        className="w-5 h-5 bg-slate-900 rounded shrink-0"
                        style={{ 
                          backgroundImage: `url(${emote.imageUrl})`, 
                          backgroundSize: '300% 200%', 
                          backgroundPosition: '100% 100%' 
                        }} 
                      />
                    ) : (
                      <img src={emote.imageUrl} alt={emote.name} className="w-5 h-5 object-contain bg-slate-900 rounded shrink-0" />
                    )
                  ) : (
                    <div className="w-5 h-5 bg-slate-900 rounded shrink-0 flex items-center justify-center text-sm">{emote.emoji}</div>
                  )}
                  <span className="flex-1 font-bold text-slate-350 truncate">{emote.name}</span>
                  <span className="text-amber-500 font-mono text-[8px] mr-1">{emote.cost} 🪙</span>
                  {isUnlocked ? (
                    <span className="text-[7.5px] font-bold text-emerald-450 bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-900/30">{t.unlockedLabel}</span>
                  ) : (
                    <button
                      onClick={() => handleBuyEmote(emote)}
                      disabled={buyingId === emote.id || profile.gold_coins < emote.cost}
                      className={`px-1.5 py-0.5 font-bold rounded text-[8px] cursor-pointer ${
                        profile.gold_coins >= emote.cost
                          ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {buyingId === emote.id ? '...' : t.buyLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🔽 BOTTOM SECTION: SWITCH TAB BUTTONS & WIZARD TIPS */}
      <div className="border-t border-slate-800/80 pt-2 shrink-0">
        
        {/* Switch tab panel */}
        <div className="flex bg-slate-950/60 p-0.5 rounded-xl border border-slate-800/80 mb-1 justify-between items-center text-[10px]">
          <button
            onClick={() => setPanelMode('emotes')}
            className={`flex-1 py-1 rounded-lg text-center font-black transition-all cursor-pointer ${
              panelMode === 'emotes'
                ? 'bg-amber-600 text-slate-950 shadow shadow-amber-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.emotesTab}
          </button>
          <button
            onClick={() => setPanelMode('magic')}
            className={`flex-1 py-1 rounded-lg text-center font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
              panelMode === 'magic'
                ? 'bg-purple-600 text-white shadow shadow-purple-900/30 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.magicTab}
          </button>
          <button
            onClick={() => setPanelMode('fighter')}
            className={`flex-1 py-1 rounded-lg text-center font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
              panelMode === 'fighter'
                ? 'bg-cyan-600 text-white shadow shadow-cyan-900/30 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.fighterTab}
          </button>
          <button
            onClick={() => setPanelMode('ranger')}
            className={`flex-1 py-1 rounded-lg text-center font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
              panelMode === 'ranger'
                ? 'bg-emerald-600 text-white shadow shadow-emerald-900/30 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.rangerTab}
          </button>
        </div>
        
        {panelMode === 'magic' && (
          <div className="text-[7.5px] text-slate-500 text-center font-mono leading-none">
            {t.wizardTip}
          </div>
        )}
      </div>

    </div>
  );
}
