'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Profile, DailyQuest } from '@/lib/supabase';
import { logoutCurrentUser } from '@/app/actions/authActions';
import { processEstimationBuyIn, processEstimationResult } from '@/app/actions/gameActions';
import CoinCounter from './CoinCounter';
import DailyQuests from './DailyQuests';
import InteractionPanel from './InteractionPanel';
import StakeSelectorModal, { GameTableOption, GHOST_BOTS } from './StakeSelectorModal';
import LudoRoomModal, { LudoRoomConfig } from './LudoRoomModal';
import CafeRoomModal, { CafeGameKey, CafeRoomConfig } from './CafeRoomModal';
import { MythicSplashScreenIntro } from '@/app/games/ludo/ludoSplashIntro';
import { GAMES_CONFIG } from '@/config/gamesConfig';

interface DashboardProps {
  profile: Profile;
  dailyQuest: DailyQuest;
  onUpdate: (updatedProfile: Profile, updatedQuest: DailyQuest) => void;
  onLogout: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  lang?: 'ar' | 'en';
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  blocked: boolean;
  chatHistory: { sender: 'you' | 'friend'; text: string; time: string }[];
}

interface GameSession {
  id: string;
  gameId: string;
  gameTitle: string;
  hostName: string;
  hostAvatar: string;
  createdAt: string;
}

interface LobbyMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  time: string;
  session?: GameSession;
}

export default function Dashboard({ profile, dailyQuest, onUpdate, onLogout, addToast, lang = 'ar' }: DashboardProps) {
  const [activeGame, setActiveGame] = useState<'chess' | 'estimation' | 'uno' | 'cyber-arena' | 'domino' | 'backgammon' | 'fighter' | 'ludo' | 'billiards'>('domino');
  const [showGameModal, setShowGameModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showLudoRoomModal, setShowLudoRoomModal] = useState(false);
  const [ludoRoomConfig, setLudoRoomConfig] = useState<LudoRoomConfig | null>(null);
  const [showCafeRoomModal, setShowCafeRoomModal] = useState(false);
  const [showCinematicIntro, setShowCinematicIntro] = useState(false);
  const [selectedCafeGameKey, setSelectedCafeGameKey] = useState<CafeGameKey>('ludo');
  const [cafeRoomConfig, setCafeRoomConfig] = useState<CafeRoomConfig | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'level' | 'quests' | 'chat' | null>(null);
  const [chatPopupView, setChatPopupView] = useState<'lobby' | 'friends'>('lobby');
  const [pendingGameTitle, setPendingGameTitle] = useState('');
  const [pendingGameMode, setPendingGameMode] = useState<'chess' | 'estimation' | 'uno' | 'cyber-arena' | 'domino' | 'backgammon' | 'fighter' | 'ludo' | 'billiards'>('ludo');
  const [selectedStakeConfig, setSelectedStakeConfig] = useState<{
    table: GameTableOption;
    mode: '8-ball' | 'snooker';
    playerCount: number;
    opponent: typeof GHOST_BOTS[0];
  } | null>(null);

  // --- PWA INSTALL & SESSION PERSISTENCE ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Close Game helper that clears active game from localStorage
  const handleCloseGame = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_game_session');
    }
    setShowGameModal(false);
  };

  // Restore active game session if page was refreshed or phone tab reloaded
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('active_game_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.game && (Date.now() - (parsed.timestamp || 0) < 3 * 60 * 60 * 1000)) {
            setActiveGame(parsed.game);
            if (parsed.stakeConfig) {
              setSelectedStakeConfig(parsed.stakeConfig);
            }
            if (parsed.ludoConfig) {
              setLudoRoomConfig(parsed.ludoConfig);
            }
            if (parsed.cafeConfig) {
              setCafeRoomConfig(parsed.cafeConfig);
              setSelectedCafeGameKey(parsed.cafeConfig.gameKey);
            }
            setShowGameModal(true);
          } else {
            localStorage.removeItem('active_game_session');
          }
        }
      } catch (err) {
        console.error('Error restoring game session:', err);
      }
    }
  }, []);

  // Prevent accidental page reload or back gesture when inside active game
  useEffect(() => {
    if (!showGameModal) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showGameModal]);

  // Handle PWA BeforeInstallPrompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      addToast(
        lang === 'ar'
          ? 'لتثبيت التطبيق على الهاتف: اضغط على خيارات المتصفح (⋮) ثم اختر "إضافة إلى الشاشة الرئيسية" 📲'
          : 'To install: Open browser menu (⋮) and tap "Add to Home Screen" 📲',
        'warning'
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      addToast(lang === 'ar' ? '🎉 تم تثبيت التطبيق بنجاح على هاتفك!' : '🎉 App installed successfully!', 'success');
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // --- XP & LEVEL SYSTEM STATE ---
  const [gameXp, setGameXp] = useState<Record<string, number>>({
    chess: 0,
    estimation: 0,
    uno: 0,
    'cyber-arena': 0,
    domino: 0,
    backgammon: 0,
  });

  // Load XP from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedXp = localStorage.getItem(`xp_data_${profile.id}`);
      if (savedXp) {
        try {
          setGameXp(JSON.parse(savedXp));
        } catch (e) {
          console.error('Error parsing XP data:', e);
        }
      }
    }
  }, [profile.id]);

  // Listen for messages from embedded game iframes (e.g. Ludo victory, close game)
  useEffect(() => {
    const handleGameMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const currentProfile = latestProfileRef.current;
      if (event.data.type === 'CLOSE_GAME') {
        handleCloseGame();
      } else if (event.data.type === 'LUDO_COINS_SYNC') {
        const syncedCoins = typeof event.data.newCoins === 'number' ? Math.max(0, event.data.newCoins) : currentProfile.gold_coins;
        const mr = event.data.matchResult;
        onUpdate(
          {
            ...currentProfile,
            gold_coins: syncedCoins,
            wins: mr?.isWinner ? currentProfile.wins + 1 : currentProfile.wins,
            losses: mr && !mr.isWinner ? currentProfile.losses + 1 : currentProfile.losses,
          },
          dailyQuest
        );
      } else if (event.data.type === 'LUDO_GAME_OVER') {
        if (event.data.isHuman && event.data.coins > 0) {
          addToast(
            lang === 'ar'
              ? `🎉 مبروك! حققت الفوز وحصلت على ${event.data.coins} عملة ذهبية!`
              : `🎉 Congratulations! You won and earned ${event.data.coins} gold coins!`,
            'success'
          );
        }
      }
    };
    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [dailyQuest, onUpdate, addToast, lang]);

  // Save XP to localStorage helper
  const saveXpData = (updatedXp: Record<string, number>) => {
    setGameXp(updatedXp);
    localStorage.setItem(`xp_data_${profile.id}`, JSON.stringify(updatedXp));
  };

  // Helper to calculate Level and XP progress based on the 1.5x formula
  const calculateLevel = (xp: number) => {
    let level = 1;
    let required = 100;
    let tempXp = xp;
    while (tempXp >= required) {
      tempXp -= required;
      level++;
      required = Math.round(required * 1.5);
    }
    return { level, currentXp: tempXp, nextXpRequired: required };
  };

  // Individual game levels
  const chessLevelInfo = calculateLevel(gameXp.chess || 0);
  const estimationLevelInfo = calculateLevel(gameXp.estimation || 0);
  const unoLevelInfo = calculateLevel(gameXp.uno || 0);
  const cyberArenaLevelInfo = calculateLevel(gameXp['cyber-arena'] || 0);
  const dominoLevelInfo = calculateLevel(gameXp.domino || 0);
  const backgammonLevelInfo = calculateLevel(gameXp.backgammon || 0);

  // General Level = Sum of all game levels
  const generalLevel =
    chessLevelInfo.level +
    estimationLevelInfo.level +
    unoLevelInfo.level +
    cyberArenaLevelInfo.level +
    dominoLevelInfo.level +
    backgammonLevelInfo.level;

  // --- FRIENDS & PRIVATE CHAT STATE ---
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeChatFriendId, setActiveChatFriendId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchFriendName, setSearchFriendName] = useState('');

  // Suggested users online to add
  const suggestedPlayers = [
    { name: lang === 'ar' ? 'البرنس طاولة' : 'Table Prince', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=prince' },
    { name: lang === 'ar' ? 'معلم كوتشينة' : 'Card Master', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=card' },
    { name: lang === 'ar' ? 'الملكة ياسمين' : 'Queen Yasmin', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=yasmin' },
    { name: lang === 'ar' ? 'حريف السيجة' : 'Sega Pro', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sega' },
  ];

  // Load and seed friends list on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFriends = localStorage.getItem(`friends_list_${profile.id}`);
      if (savedFriends) {
        try {
          setFriends(JSON.parse(savedFriends));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Seed default friends
        const defaultFriends: Friend[] = [
          {
            id: 'friend-ezzo',
            name: lang === 'ar' ? 'عزت الدومينو 🤖' : 'Ezzo Domino 🤖',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ezzo',
            status: 'online',
            blocked: false,
            chatHistory: [
              { sender: 'friend', text: lang === 'ar' ? 'يا هلا بالمعلم! جاهز لدور دومينو؟ ☕🀄' : 'Welcome boss! Ready for dominoes? ☕🀄', time: '12:00 PM' }
            ],
          },
          {
            id: 'friend-fared',
            name: lang === 'ar' ? 'فريد البوت 🎲' : 'Fared Bot 🎲',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=fared',
            status: 'online',
            blocked: false,
            chatHistory: [],
          },
        ];
        setFriends(defaultFriends);
        localStorage.setItem(`friends_list_${profile.id}`, JSON.stringify(defaultFriends));
      }
    }
  }, [profile.id, lang]);

  const saveFriendsList = (updatedFriends: Friend[]) => {
    setFriends(updatedFriends);
    localStorage.setItem(`friends_list_${profile.id}`, JSON.stringify(updatedFriends));
  };

  // Add friend helper
  const handleAddFriend = (name: string, avatarUrl?: string) => {
    if (!name.trim()) return;
    const exists = friends.some((f) => f.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      addToast(lang === 'ar' ? 'هذا اللاعب موجود بالفعل في قائمة أصدقائك!' : 'This player is already your friend!', 'warning');
      return;
    }

    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      name: name.trim(),
      avatar: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      status: 'online',
      blocked: false,
      chatHistory: [],
    };

    const nextList = [...friends, newFriend];
    saveFriendsList(nextList);
    setSearchFriendName('');
    addToast(lang === 'ar' ? `تمت إضافة ${name} لصديقك بنجاح! 🤝` : `Added ${name} to friends! 🤝`, 'success');
  };

  // Remove Friend
  const handleRemoveFriend = (id: string) => {
    const nextList = friends.filter((f) => f.id !== id);
    saveFriendsList(nextList);
    if (activeChatFriendId === id) setActiveChatFriendId(null);
    addToast(lang === 'ar' ? 'تم إلغاء الصداقة بنجاح.' : 'Removed friend successfully.', 'success');
  };

  // Block Friend
  const handleBlockFriend = (id: string) => {
    const nextList = friends.map((f) => (f.id === id ? { ...f, blocked: true } : f));
    saveFriendsList(nextList);
    addToast(lang === 'ar' ? 'تم حظر الصديق بنجاح. 🚫' : 'Blocked friend successfully. 🚫', 'warning');
  };

  // Unblock Friend
  const handleUnblockFriend = (id: string) => {
    const nextList = friends.map((f) => (f.id === id ? { ...f, blocked: false } : f));
    saveFriendsList(nextList);
    addToast(lang === 'ar' ? 'تم إلغاء الحظر بنجاح.' : 'Unblocked friend successfully.', 'success');
  };

  // Send message
  const handleSendMessage = () => {
    if (!typedMessage.trim() || !activeChatFriendId) return;

    const friend = friends.find((f) => f.id === activeChatFriendId);
    if (!friend) return;
    if (friend.blocked) {
      addToast(lang === 'ar' ? 'لا يمكنك مراسلة صديق محظور!' : 'Cannot message a blocked user!', 'error');
      return;
    }

    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'you' as const, text: typedMessage.trim(), time };

    const updatedFriends = friends.map((f) => {
      if (f.id === activeChatFriendId) {
        return { ...f, chatHistory: [...f.chatHistory, userMsg] };
      }
      return f;
    });

    saveFriendsList(updatedFriends);
    setTypedMessage('');

    // Trigger auto replies from bots for funny banter!
    setTimeout(() => {
      const responsesAr = [
        'تسلم يا غالي! بكرة نتقابل ونلعب جيم دومينو 151 ☕🎲',
        'ههههه حبيب قلبي، بتحداني في أونو ولا إيه؟ 🔴',
        'شيش بيش! الحظ معايا المرة دي يا صديقي.',
        'العب قيم الاستميشن معايا وريك اللعب الأصلي 🎰',
        'موجود يا معلم! دقيقة وأدخل معاك في معركة السايبر 🤖',
      ];
      const responsesEn = [
        'Awesome boss! Let’s match in Dominoes 151 tomorrow ☕🎲',
        'Haha, are you challenging me in UNO? 🔴',
        'Always ready! Let’s play Chess RPG next.',
        'Wait a minute, playing cyber battles right now! 🤖',
      ];
      const botResponseText =
        lang === 'ar'
          ? responsesAr[Math.floor(Math.random() * responsesAr.length)]
          : responsesEn[Math.floor(Math.random() * responsesEn.length)];

      const botMsg = { sender: 'friend' as const, text: botResponseText, time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) };

      setFriends((prevFriends) => {
        const next = prevFriends.map((f) => {
          if (f.id === activeChatFriendId) {
            return { ...f, chatHistory: [...f.chatHistory, botMsg] };
          }
          return f;
        });
        localStorage.setItem(`friends_list_${profile.id}`, JSON.stringify(next));
        return next;
      });
    }, 1200);
  };

  // --- MATCHMAKING & GROUP CHAT LOBBY STATE ---
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([
    {
      id: 'session-1',
      gameId: 'domino-game',
      gameTitle: lang === 'ar' ? 'لعبة الدومينو' : 'Dominoes',
      hostName: lang === 'ar' ? 'عزت الدومينو' : 'Ezzo Domino',
      hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ezzo',
      createdAt: '12:05 PM',
    },
    {
      id: 'session-2',
      gameId: 'uno-game',
      gameTitle: lang === 'ar' ? 'كازينو أونو' : 'UNO Casino',
      hostName: lang === 'ar' ? 'الملكة ياسمين' : 'Queen Yasmin',
      hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=yasmin',
      createdAt: '12:10 PM',
    },
  ]);

  const [lobbyMessages, setLobbyMessages] = useState<LobbyMessage[]>([
    {
      id: 'lobby-1',
      senderName: lang === 'ar' ? 'البرنس طاولة' : 'Table Prince',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=prince',
      text: lang === 'ar' ? 'السلام عليكم يا شباب! مين جاهز لتحدي دومينو سريع؟' : 'Hello everyone! Who is up for a quick Dominoes match?',
      time: '12:01 PM',
    },
    {
      id: 'lobby-2',
      senderName: lang === 'ar' ? 'عزت الدومينو' : 'Ezzo Domino',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ezzo',
      text: lang === 'ar' ? 'أنا أنشأت جلسة دومينو مستني لاعب يدخل!' : 'I created a Dominoes session, waiting for someone to join!',
      time: '12:05 PM',
      session: {
        id: 'session-1',
        gameId: 'domino-game',
        gameTitle: lang === 'ar' ? 'لعبة الدومينو' : 'Dominoes',
        hostName: lang === 'ar' ? 'عزت الدومينو' : 'Ezzo Domino',
        hostAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ezzo',
        createdAt: '12:05 PM',
      },
    },
  ]);

  const [lobbyText, setLobbyText] = useState('');
  const [selectedGameForSession, setSelectedGameForSession] = useState<string>('domino-game');

  // Choose game session popup list
  const [showSessionSelectorModal, setShowSessionSelectorModal] = useState(false);
  const [selectorSessions, setSelectorSessions] = useState<GameSession[]>([]);
  const [selectorGameId, setSelectorGameId] = useState('');

  // Handle Play Game Trigger (The Lobby Matchmaking Logic!)
  const handlePlayGame = (gameId: string) => {
    const targetGame = gamesList.find((g) => g.id === gameId);
    if (!targetGame?.isReady) {
      addToast(
        lang === 'ar'
          ? `🚀 لعبة [${targetGame?.title || ''}] قيد التجهيز وستنطلق قريباً جداً!`
          : `🚀 [${targetGame?.title || ''}] is in development and coming soon!`,
        'warning'
      );
      return;
    }

    // Open game rooms / create room modal directly
    launchGameMode(gameId);
  };

  const launchGameMode = (gameId: string) => {
    setActiveDrawerTab(null);
    // 6 Cafe Social Games (القهوة البلدي: لودو، دومينو، طاولة، شطرنج، أونو، استميشن)
    const cafeMap: Record<string, CafeGameKey> = {
      'ludo-game': 'ludo',
      'domino-game': 'domino',
      'backgammon-game': 'backgammon',
      'rpg-chess': 'chess',
      'uno-game': 'uno',
      'estimation-game': 'estimation',
    };

    if (cafeMap[gameId]) {
      setSelectedCafeGameKey(cafeMap[gameId]);
      // Play cinematic game intro ("الدخلة") first before opening rooms lobby
      setShowCinematicIntro(true);
      return;
    }

    if (gameId === 'billiards-game') {
      setSelectedStakeConfig(null);
      setPendingGameMode('billiards');
      setActiveGame('billiards');
      setShowGameModal(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_game_session', JSON.stringify({
          game: 'billiards',
          timestamp: Date.now(),
        }));
      }
      return;
    }

    // Arcade Games use standard stake / arcade modal
    let resolvedMode: 'chess' | 'estimation' | 'uno' | 'cyber-arena' | 'domino' | 'backgammon' | 'fighter' | 'ludo' | 'billiards' = 'cyber-arena';
    if (gameId === 'cyber-arena') resolvedMode = 'cyber-arena';
    else if (gameId === 'fighter-game') resolvedMode = 'fighter';

    const matched = GAMES_CONFIG.find((g) => g.id === gameId);
    setPendingGameTitle(lang === 'ar' ? (matched?.titleAr || 'طاولة الرهان') : (matched?.titleEn || 'Stake Table'));
    setPendingGameMode(resolvedMode);
    setShowStakeModal(true);
  };

  const handleStartCafeGame = (config: CafeRoomConfig) => {
    setCafeRoomConfig(config);
    setShowCafeRoomModal(false);
    setActiveGame(config.gameKey);
    setShowGameModal(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_game_session', JSON.stringify({
        game: config.gameKey,
        cafeConfig: config,
        timestamp: Date.now(),
      }));
    }
  };

  const handleStartLudo = (config: LudoRoomConfig) => {
    setLudoRoomConfig(config);
    setShowLudoRoomModal(false);
    setActiveGame('ludo');
    setShowGameModal(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_game_session', JSON.stringify({
        game: 'ludo',
        ludoConfig: config,
        timestamp: Date.now(),
      }));
    }
  };

  const handleStartGameFromStakeModal = (config: {
    table: GameTableOption;
    mode: '8-ball' | 'snooker';
    playerCount: number;
    opponent: typeof GHOST_BOTS[0];
  }) => {
    setSelectedStakeConfig(config);
    setShowStakeModal(false);
    setActiveGame(pendingGameMode);
    setShowGameModal(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_game_session', JSON.stringify({
        game: pendingGameMode,
        stakeConfig: config,
        timestamp: Date.now(),
      }));
    }
  };

  // Create Game Session manually
  const handleCreateSession = (gameId: string) => {
    const game = gamesList.find((g) => g.id === gameId);
    if (!game) return;

    const newSession: GameSession = {
      id: `session-${Date.now()}`,
      gameId: game.id,
      gameTitle: game.title,
      hostName: profile.username,
      hostAvatar: profile.avatar_url,
      createdAt: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveSessions((prev) => [newSession, ...prev]);

    const newMsg: LobbyMessage = {
      id: `lobby-${Date.now()}`,
      senderName: profile.username,
      senderAvatar: profile.avatar_url,
      text: lang === 'ar' ? `لقد أنشأت دور لعب جديد في لعبة [${game.title}]! انضموا إليّ.` : `Created a new game room in [${game.title}]! Join me.`,
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      session: newSession,
    };

    setLobbyMessages((prev) => [...prev, newMsg]);
    addToast(lang === 'ar' ? 'تم نشر دور اللعب الخاص بك في الشات الجماعي!' : 'Game room invitation posted to global chat!', 'success');
  };

  // Send message in global lobby chat
  const handleSendLobbyMessage = () => {
    if (!lobbyText.trim()) return;

    const newMsg: LobbyMessage = {
      id: `lobby-${Date.now()}`,
      senderName: profile.username,
      senderAvatar: profile.avatar_url,
      text: lobbyText.trim(),
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };

    setLobbyMessages((prev) => [...prev, newMsg]);
    setLobbyText('');

    // Trigger mock bot chatter in group chat
    setTimeout(() => {
      const chatReplies = [
        lang === 'ar' ? 'يا مرحب بالمعلمين! منورين الصالة.' : 'Welcome players! Nice to see you.',
        lang === 'ar' ? 'أنا جاهز لأي تحدي في لعبة الدومينو!' : 'I am ready for a 4-player Domino match!',
        lang === 'ar' ? 'مين كريت دور أونو؟ كروت حظي مستعدة اليوم.' : 'Who created the UNO room? My cards are ready.',
        lang === 'ar' ? 'عاش يا شباب، بالتوفيق للجميع.' : 'Good luck to everyone playing!',
      ];
      const replyText = chatReplies[Math.floor(Math.random() * chatReplies.length)];

      const botMsg: LobbyMessage = {
        id: `lobby-bot-${Date.now()}`,
        senderName: suggestedPlayers[Math.floor(Math.random() * suggestedPlayers.length)].name,
        senderAvatar: suggestedPlayers[Math.floor(Math.random() * suggestedPlayers.length)].avatar,
        text: replyText,
        time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      };

      setLobbyMessages((prev) => [...prev, botMsg]);
    }, 1500);
  };

  // --- Supabase postMessage listeners ---
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'BUY_IN') {
        const res = await processEstimationBuyIn(profile.id);
        if (res.success && res.data) {
          addToast(res.message, 'success');
          onUpdate(res.data, dailyQuest);
        } else {
          addToast(res.message || 'فشل الدخول في المباراة 🪙', 'error');
        }
      }

      if (data.type === 'GAME_OVER') {
        const res = await processEstimationResult(profile.id, data.outcome);
        if (res.success && res.data) {
          addToast(res.message, 'success');
          onUpdate(res.data, dailyQuest);

          // AWARD XP
          const gainedXp = data.outcome === 'win' ? 100 : 40;
          const nextXp = { ...gameXp };
          const previousLevel = calculateLevel(nextXp[activeGame] || 0).level;
          nextXp[activeGame] = (nextXp[activeGame] || 0) + gainedXp;
          saveXpData(nextXp);

          const currentLevelInfo = calculateLevel(nextXp[activeGame]);
          if (currentLevelInfo.level > previousLevel) {
            addToast(
              lang === 'ar'
                ? `🎖️ مستوى جديد! ارتفع مستواك في ${activeGame} إلى ليفل ${currentLevelInfo.level}! (+${gainedXp} XP)`
                : `🎖️ Level Up! Your level in ${activeGame} increased to Level ${currentLevelInfo.level}! (+${gainedXp} XP)`,
              'success'
            );
          } else {
            addToast(
              lang === 'ar'
                ? `✨ كسبت +${gainedXp} XP في لعبة ${activeGame}`
                : `✨ Gained +${gainedXp} XP in ${activeGame}`,
              'success'
            );
          }
        } else {
          addToast(res.message || 'حدث خطأ أثناء معالجة النتيجة 🎰', 'error');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [profile.id, dailyQuest, onUpdate, gameXp, activeGame]);

  const handleLogout = async () => {
    const res = await logoutCurrentUser();
    if (res.success) {
      addToast(res.message, 'success');
      onLogout();
    } else {
      addToast(res.message, 'error');
    }
  };

  const activeChatFriend = friends.find((f) => f.id === activeChatFriendId);

  const t = {
    ar: {
      selectGame: 'اختر اللعبة النشطة:',
      chessGame: '⚔️ شطرنج آر بي جي (Chess)',
      estimationGame: '🎰 كازينو الاستميشن (Estimation)',
      unoGame: '🔴 كازينو أونو (UNO)',
      dominoGame: '🎲 لعبة الدومينو (Domino)',
      estimationTitle: '🎰 كازينو الاستميشن المفتوح',
      estimationDesc: 'استمتع بلعب الكوتشينة والمراهنة الهزلية بعملات المنصة مع بطل الطائفة.',
      unoTitle: '🔴 كازينو أونو الملون',
      unoDesc: 'تحدي الأونو الممتع مع البوتات وتصفية الكروت لكسب الذهب.',
      dominoTitle: '🎲 طاولة الدومينو البلدية',
      dominoDesc: 'تحدي الدومينو الكلاسيكي مع البوت عزت وقفل اللعبة الحماسية.',
      logout: 'تسجيل الخروج',
      playerBadge: 'لاعب ميثك',
      winsLabel: 'انتصارات',
      lossesLabel: 'هزائم',
      activeChessSession: '⚔️ مباراة الشطرنج النشطة (Active Chess Session)',
      activeChessDesc: 'تصفح رقعة الشطرنج وتفاعل مع الخصم باستخدام لوحة التفاعل التكتيكية الجانبية.',
      hostedGames: '🎮 مكتبة الألعاب وتحديات الصالة',
      hostedGamesDesc: 'جميع هذه الألعاب مستضافة وتتصل ببوابة الألعاب لمزامنة العملات والإنجازات.',
      playGame: 'تشغيل اللعبة',
      chessTitle: '3D RPG Chess',
      chessDesc: 'لعبة الشطرنج الاستراتيجية ثلاثية الأبعاد بأسلوب تقمص الأدوار ومكافآت يومية.',
      cyberTitle: 'Cyber Arena Battles',
      cyberDesc: 'قتال وتحدي استراتيجي في حلبة مستقبلية مع دعم مباشر لعملات المنصة.',
      statusComing: 'قريباً (Coming Soon)',
      badgeMain: 'الراية الرئيسية',
      badgeNew: 'جديد',
      generalLevel: 'المستوى العام للموقع',
      gameLevels: 'مستويات الألعاب الحالية',
      friendsTitle: '👥 ديوان الأصدقاء (Friends List)',
      addFriendBtn: 'إضافة صديق',
      addFriendPlaceholder: 'اكتب اسم اللاعب...',
      chatOpenBtn: 'دردشة 💬',
      blockBtn: 'حظر 🚫',
      unblockBtn: 'إلغاء الحظر',
      unfriendBtn: 'إزالة ❌',
      blockedTitle: '🚫 قائمة المحظورين',
      privateChatWith: 'الدردشة الخاصة مع: {name}',
      chatPlaceholder: 'اكتب رسالتك هنا واضغط إرسال...',
      sendBtn: 'إرسال 🚀',
      suggestedTitle: '💡 لاعبون متصلون الآن (اضغط للإضافة)'
    },
    en: {
      selectGame: 'Select Active Game:',
      chessGame: '⚔️ 3D RPG Chess',
      estimationGame: '🎰 Estimation Casino',
      unoGame: '🔴 UNO Casino',
      dominoGame: '🎲 Domino Game',
      estimationTitle: '🎰 High-Stakes Estimation Casino',
      estimationDesc: 'Play card bidding games against AI bots and earn gold coins.',
      unoTitle: '🔴 Royal UNO Casino',
      unoDesc: 'Discard all your UNO cards against funny bots and win coins.',
      dominoTitle: '🎲 Royal Domino Cafe',
      dominoDesc: 'Classic dominoes block game against Ezzo Bot.',
      logout: 'Log Out',
      playerBadge: 'Mythic Player',
      winsLabel: 'Wins',
      lossesLabel: 'Losses',
      activeChessSession: '⚔️ Active Chess Session',
      activeChessDesc: 'Browse the chessboard and interact with the opponent using the quick tactical panel.',
      hostedGames: '🎮 Game Library & Matchmaking Lobby',
      hostedGamesDesc: 'All games connect to this portal to sync coins, levels, and chat invitations.',
      playGame: 'Play Game',
      chessTitle: '3D RPG Chess',
      chessDesc: '3D strategy chess game with roleplay elements and daily rewards.',
      cyberTitle: 'Cyber Arena Battles',
      cyberDesc: 'Strategic battle arena in a futuristic setting with portal coin support.',
      statusComing: 'Coming Soon',
      badgeMain: 'Main Flag',
      badgeNew: 'New',
      generalLevel: 'General Portal Level',
      gameLevels: 'Individual Game Levels',
      friendsTitle: '👥 Friends & Chat Hub',
      addFriendBtn: 'Add Friend',
      addFriendPlaceholder: 'Enter username...',
      chatOpenBtn: 'Chat 💬',
      blockBtn: 'Block 🚫',
      unblockBtn: 'Unblock',
      unfriendBtn: 'Remove ❌',
      blockedTitle: '🚫 Blocked Users',
      privateChatWith: 'Private Chat with: {name}',
      chatPlaceholder: 'Type message here...',
      sendBtn: 'Send 🚀',
      suggestedTitle: '💡 Online Players (Click to Add)'
    }
  }[lang];

  // Dynamic list of games configured via gamesConfig.ts
  const gamesList = GAMES_CONFIG.map((g) => ({
    id: g.id,
    key: g.key,
    title: lang === 'ar' ? g.titleAr : g.titleEn,
    description: lang === 'ar' ? g.descAr : g.descEn,
    status: g.status === 'ready'
      ? (lang === 'ar' ? 'جاهز للعب (Ready)' : 'Ready to Play')
      : (lang === 'ar' ? 'قريباً (Coming Soon)' : 'Coming Soon'),
    isReady: g.status === 'ready',
    image: g.image,
    badge: lang === 'ar' ? g.badgeAr : g.badgeEn,
    embedUrl: g.embedUrl,
  }));
  const gameCardsMap: Record<string, string> = {
    chess: '/chess_card.png',
    ludo: '/mythical_ludo_card.png',
    estimation: '/estimation_card.jpg',
    uno: '/uno_card.png',
    'cyber-arena': '/cyber_card.png',
    backgammon: '/backgammon_card.jpg',
    fighter: '/arcade_mode_card.png',
    domino: '/domino_card_v2.png',
  };
  const activeCard = gameCardsMap[activeGame || 'domino'];
  const latestProfileRef = useRef(profile);
  latestProfileRef.current = profile;

  // Lock iframe URL while modal stays open so coin syncs / profile updates never force-reload the active game!
  const activeIframeSrc = useMemo(() => {
    if (!showGameModal) return '';
    const p = latestProfileRef.current;

    if (activeGame === 'ludo') {
      const role = cafeRoomConfig?.role || ludoRoomConfig?.role || 'player';
      const players = cafeRoomConfig?.playerCount || ludoRoomConfig?.playerCount || 4;
      const pieces = ludoRoomConfig?.pieceCount || 4;
      const winRule = ludoRoomConfig?.winRule || 'all';
      const stake = cafeRoomConfig?.entryFee || ludoRoomConfig?.entryFee || 50;
      const roomIdParam = encodeURIComponent(cafeRoomConfig?.roomId || ludoRoomConfig?.roomId || `ludo-${p.id.slice(0, 6)}`);
      const roomName = encodeURIComponent(cafeRoomConfig?.roomName || ludoRoomConfig?.roomName || 'Ludo Room');
      const isHost = cafeRoomConfig?.isHost !== undefined ? cafeRoomConfig.isHost : true;
      const hostId = encodeURIComponent(cafeRoomConfig?.hostId || p.id);
      const hostName = encodeURIComponent(cafeRoomConfig?.hostName || p.username);
      const hostAvatar = encodeURIComponent(cafeRoomConfig?.hostAvatar || p.avatar_url || '');
      const skinParam = cafeRoomConfig?.backgroundId ? `&skin=${encodeURIComponent(cafeRoomConfig.backgroundId)}&theme=${encodeURIComponent(cafeRoomConfig.backgroundId)}` : '';
      const announceParam = cafeRoomConfig?.announcement ? `&announcement=${encodeURIComponent(cafeRoomConfig.announcement)}` : '';
      return `/games/ludo?userId=${p.id}&username=${encodeURIComponent(p.username)}&avatar=${encodeURIComponent(p.avatar_url || '')}&lang=${lang}&autoStart=true&role=${role}&players=${players}&pieces=${pieces}&winRule=${winRule}&stake=${stake}&roomId=${roomIdParam}&roomName=${roomName}&isHost=${isHost}&hostId=${hostId}&hostName=${hostName}&hostAvatar=${hostAvatar}&goldCoins=${p.gold_coins}${skinParam}${announceParam}`;
    }

    if (['domino', 'backgammon', 'chess', 'uno', 'estimation'].includes(activeGame)) {
      const role = cafeRoomConfig?.role || 'player';
      const players = cafeRoomConfig?.playerCount || 4;
      const stake = cafeRoomConfig?.entryFee || 50;
      const prize = cafeRoomConfig?.prizeAmount || (stake * (players === 2 ? 1.9 : 3.8));
      const roomName = encodeURIComponent(cafeRoomConfig?.roomName || 'Cafe Table');
      const matched = GAMES_CONFIG.find(g => g.key === activeGame);
      const base = matched?.embedUrl || `/games/${activeGame}`;
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}userId=${p.id}&username=${encodeURIComponent(p.username)}&avatar=${encodeURIComponent(p.avatar_url || '')}&lang=${lang}&role=${role}&stake=${stake}&prize=${prize}&roomName=${roomName}&players=${players}&autoStart=true`;
    }

    const matched = GAMES_CONFIG.find(g => g.key === activeGame);
    const base = matched?.embedUrl || `/games/${activeGame}`;
    const sep = base.includes('?') ? '&' : '?';
    const stakeParams = selectedStakeConfig
      ? `&stake=${selectedStakeConfig.table.entryFee}&prize=${selectedStakeConfig.table.prizeAmount}&table=${selectedStakeConfig.table.id}&mode=${selectedStakeConfig.mode}&opponentName=${encodeURIComponent(selectedStakeConfig.opponent.name)}&opponentAvatar=${encodeURIComponent(selectedStakeConfig.opponent.avatar)}&opponentFlag=${encodeURIComponent(selectedStakeConfig.opponent.flag)}`
      : '';
    return `${base}${sep}userId=${p.id}&username=${encodeURIComponent(p.username)}&avatar=${encodeURIComponent(p.avatar_url || '')}&lang=${lang}${stakeParams}`;
  }, [
    showGameModal,
    activeGame,
    lang,
    cafeRoomConfig?.roomId,
    cafeRoomConfig?.role,
    cafeRoomConfig?.playerCount,
    cafeRoomConfig?.entryFee,
    ludoRoomConfig?.roomId,
    ludoRoomConfig?.role,
    ludoRoomConfig?.playerCount,
    ludoRoomConfig?.entryFee,
    selectedStakeConfig?.table?.id,
  ]);

  return (
    <div
      className="min-h-screen text-slate-100 pb-12 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: showGameModal ? 'none' : 'url(/assets/cosmic-bg.png)' }}
    >
      {!showGameModal && (
        <>
      {/* Cyber-Neon Header */}
      <header className="border-b border-indigo-500/20 bg-[#090c15]/60 backdrop-blur-xl sticky top-0 z-30 shadow-[0_4px_30px_rgba(99,102,241,0.1)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-indigo-500 bg-clip-text text-transparent tracking-wider">
              MYTHIC GAMES PORTAL
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={handleInstallApp}
              className="text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
              title={lang === 'ar' ? 'تثبيت المنصة كتطبيق على هاتفك' : 'Install App'}
            >
              <span>📲</span>
              <span className="hidden sm:inline">{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}</span>
            </button>

            <CoinCounter coins={profile.gold_coins} />

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-all cursor-pointer bg-rose-950/20 hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/30"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Floating Page Tabs (ليفيل | المهام اليومية | الدردشة) */}
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="border-b border-indigo-500/20 bg-[#070a12]/80 backdrop-blur-md sticky top-[65px] z-20"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-center sm:justify-start gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveDrawerTab(prev => prev === 'level' ? null : 'level')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
              activeDrawerTab === 'level'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.45)]'
                : 'bg-slate-900/80 hover:bg-slate-800 text-indigo-200 border-indigo-500/35'
            }`}
          >
            <span>🎖️</span>
            <span>{lang === 'ar' ? 'ليفيل' : 'Level'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px]">
              Lv.{generalLevel}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawerTab(prev => prev === 'quests' ? null : 'quests')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
              activeDrawerTab === 'quests'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.45)]'
                : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-amber-500/35'
            }`}
          >
            <span>🎯</span>
            <span>{lang === 'ar' ? 'المهام اليومية' : 'Daily Quests'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawerTab(prev => prev === 'chat' ? null : 'chat')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
              activeDrawerTab === 'chat'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.45)]'
                : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border-cyan-500/35'
            }`}
          >
            <span>💬</span>
            <span>{lang === 'ar' ? 'الدردشة' : 'Chat'}</span>
          </button>
        </div>
      </div>

      {/* Main Content: Games Library Directly Front & Center */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-gradient-to-tr from-blue-900/30 via-slate-900/40 to-purple-900/20 backdrop-blur-lg rounded-2xl p-5 sm:p-6 border border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.2)] space-y-6 relative overflow-hidden">
          {/* Subtle glow orb in background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{t.hostedGames}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">{t.hostedGamesDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamesList.map((game) => (
              <div
                key={game.id}
                onClick={() => {
                  if (game.isReady) handlePlayGame(game.id);
                }}
                className={`bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col group hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:-translate-y-1 transition-all duration-300 relative z-10 ${
                  game.isReady ? 'cursor-pointer' : 'opacity-70'
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-80"
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded">
                    {game.badge}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-base">{game.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{game.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className={`text-xs font-semibold ${game.isReady ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {game.status}
                    </span>
                    <button
                      disabled={!game.isReady}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (game.isReady) handlePlayGame(game.id);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${game.isReady
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white border-transparent cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-black/50 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-60'
                        }`}
                    >
                      {game.isReady ? t.playGame : (lang === 'ar' ? 'قريباً' : 'Coming Soon')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- FLOATING TAB MODAL (صفحات طايرة: ليفيل / المهام اليومية / الدردشة) --- */}
      {activeDrawerTab && (
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          onClick={() => setActiveDrawerTab(null)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${activeDrawerTab === 'chat' ? 'max-w-2xl' : 'max-w-md'} bg-[#0b0f19] border border-indigo-500/40 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.3)] flex flex-col max-h-[88dvh] overflow-hidden`}
          >
            {/* Floating Modal Top Bar with Quick Switch Tabs & Close */}
            <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'level' as const, icon: '🎖️', label: lang === 'ar' ? 'ليفيل' : 'Level' },
                  { id: 'quests' as const, icon: '🎯', label: lang === 'ar' ? 'المهام اليومية' : 'Quests' },
                  { id: 'chat' as const, icon: '💬', label: lang === 'ar' ? 'الدردشة' : 'Chat' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveDrawerTab(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeDrawerTab === item.id
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveDrawerTab(null)}
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white flex items-center justify-center text-xs font-black cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* TAB 1: ليفيل (Image 1) */}
              {activeDrawerTab === 'level' && (
                <section className="bg-gradient-to-b from-indigo-900/30 to-black/30 rounded-2xl p-5 border border-indigo-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] space-y-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full bg-slate-950 p-1 border-2 border-indigo-500 shadow-xl shadow-indigo-950/50"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                        {profile.username}
                        <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                          {t.playerBadge}
                        </span>
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950/40 border border-amber-900/30 px-2 py-0.5 rounded-md">
                          {t.generalLevel}: Level {generalLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Wins/Losses Ratio */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-center">
                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3">
                      <span className="block text-2xl font-black text-emerald-400">{profile.wins}</span>
                      <span className="text-xs text-slate-400 font-medium">{t.winsLabel}</span>
                    </div>
                    <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3">
                      <span className="block text-2xl font-black text-rose-400">{profile.losses}</span>
                      <span className="text-xs text-slate-400 font-medium">{t.lossesLabel}</span>
                    </div>
                  </div>

                  {/* PROGRESS SYSTEM DETAILS PANEL */}
                  <div className="space-y-4 pt-4 border-t border-slate-800/80">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <span>🎖️</span> {t.gameLevels}
                    </h4>

                    <div className="space-y-3.5">
                      {[
                        { name: lang === 'ar' ? '🎲 لعبة الدومينو' : 'Dominoes', info: dominoLevelInfo },
                        { name: lang === 'ar' ? '🔴 كازينو أونو' : 'UNO Casino', info: unoLevelInfo },
                        { name: lang === 'ar' ? '🎰 استميشن الملوك' : 'Estimation Casino', info: estimationLevelInfo },
                        { name: lang === 'ar' ? '⚔️ شطرنج القتال 3D' : '3D Combat Chess', info: chessLevelInfo },
                        { name: lang === 'ar' ? '🤖 معارك السايبر' : 'Cyber Arena Battles', info: cyberArenaLevelInfo },
                        { name: lang === 'ar' ? '🎲 لعبة الطاولة (الشيش)' : 'Backgammon', info: backgammonLevelInfo },
                      ].map((g, idx) => {
                        const pct = Math.min(100, Math.round((g.info.currentXp / g.info.nextXpRequired) * 100));
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-300">{g.name}</span>
                              <span className="text-indigo-300">Level {g.info.level}</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/80 relative">
                              <div
                                className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                              <span>XP: {g.info.currentXp}</span>
                              <span>Next: {g.info.nextXpRequired} XP (+50% req)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 2: المهام اليومية (Image 2) */}
              {activeDrawerTab === 'quests' && (
                <DailyQuests
                  profile={profile}
                  dailyQuest={dailyQuest}
                  onUpdate={onUpdate}
                  addToast={addToast}
                  lang={lang}
                />
              )}

              {/* TAB 3: الدردشة (Image 3 + Friends Messenger Switcher) */}
              {activeDrawerTab === 'chat' && (
                <div className="space-y-3">
                  {/* Switcher between Challenge Rooms Chat & Friends Messenger */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-black">
                    <button
                      type="button"
                      onClick={() => setChatPopupView('lobby')}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        chatPopupView === 'lobby'
                          ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-400/50'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🎮 {lang === 'ar' ? 'الشات العام وغرف التحدي' : 'Lobby & Challenge Chat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatPopupView('friends')}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        chatPopupView === 'friends'
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-400/50'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      👻 {lang === 'ar' ? 'ماسنجر الأصدقاء' : 'Friends Messenger'}
                    </button>
                  </div>

                  {chatPopupView === 'lobby' ? (
                    <div className="bg-gradient-to-br from-cyan-900/30 via-slate-900/40 to-blue-900/20 rounded-2xl p-4 sm:p-5 border border-cyan-400/30 space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-3 gap-3">
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
                            <span className="text-cyan-400">🎮</span> {lang === 'ar' ? 'مكتبة الألعاب وغرف التحدي' : 'Game Library & Matchmaking Lobby'}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {lang === 'ar' ? 'أنشئ دور لعب أو ابحث عن التحديات النشطة للانضمام واللعب فوراً!' : 'Create rooms or join active match sessions directly from the chat feed!'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <select
                            value={selectedGameForSession}
                            onChange={(e) => setSelectedGameForSession(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="domino-game">🎲 {lang === 'ar' ? 'لعبة الدومينو' : 'Dominoes'}</option>
                            <option value="uno-game">🔴 {lang === 'ar' ? 'كازينو أونو' : 'UNO'}</option>
                            <option value="estimation-game">🎰 {lang === 'ar' ? 'كازينو الاستميشن' : 'Estimation'}</option>
                            <option value="cyber-arena">🤖 {lang === 'ar' ? 'معارك السايبر' : 'Cyber Arena'}</option>
                            <option value="backgammon-game">🎲 {lang === 'ar' ? 'لعبة الطاولة' : 'Backgammon'}</option>
                          </select>

                          <button
                            onClick={() => handleCreateSession(selectedGameForSession)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer shadow-lg shadow-indigo-900/20 whitespace-nowrap"
                          >
                            {lang === 'ar' ? '➕ إنشاء دور لعب' : '➕ Create Room'}
                          </button>
                        </div>
                      </div>

                      <div className="h-[300px] bg-slate-950 border border-slate-850 rounded-2xl p-4 overflow-y-auto space-y-4 scrollbar-thin">
                        {lobbyMessages.map((msg) => (
                          <div key={msg.id} className="flex gap-3 text-xs items-start">
                            <img src={msg.senderAvatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-300">{msg.senderName}</span>
                                <span className="text-[9px] text-slate-500 font-mono">{msg.time}</span>
                              </div>

                              <p className="text-slate-300 text-xs">{msg.text}</p>

                              {msg.session && (
                                <div className="mt-2 p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-4 max-w-sm">
                                  <div>
                                    <p className="font-bold text-white text-[11px]">{msg.session.gameTitle}</p>
                                    <p className="text-[9px] text-indigo-400 mt-0.5">{lang === 'ar' ? `المستضيف: ${msg.session.hostName}` : `Hosted by: ${msg.session.hostName}`}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setActiveDrawerTab(null);
                                      handlePlayGame(msg.session!.gameId);
                                    }}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 text-[10px] font-black rounded-lg hover:from-amber-500 hover:to-amber-400 active:scale-95 transition-all cursor-pointer border border-amber-400"
                                  >
                                    {lang === 'ar' ? '🕹️ انضم الآن' : '🕹️ Join now'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={lobbyText}
                          onChange={(e) => setLobbyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendLobbyMessage()}
                          placeholder={lang === 'ar' ? 'اكتب رسالة للدردشة والمشاكسة مع الموجودين باللوبي...' : 'Broadcast message to portal lobby chat...'}
                          className="flex-1 bg-black/50 border border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-purple-100 focus:outline-none focus:border-purple-400 placeholder-purple-400/40"
                        />
                        <button
                          onClick={handleSendLobbyMessage}
                          className="px-5 py-2.5 bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/40 text-purple-300 text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer"
                        >
                          {t.sendBtn}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-fuchsia-900/30 via-slate-900/40 to-indigo-900/20 border border-fuchsia-400/30 rounded-2xl flex flex-col h-[480px] overflow-hidden">
                      {/* Chat Window Panel */}
                      <div className="flex-1 flex flex-col justify-between bg-black/20 p-4 overflow-hidden">
                        {activeChatFriend ? (
                          <>
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
                              <div className="flex items-center gap-2.5">
                                <img src={activeChatFriend.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800" />
                                <div>
                                  <span className="text-xs font-black text-amber-400 block">{activeChatFriend.name}</span>
                                  <p className="text-[9px] text-slate-500">
                                    {activeChatFriend.blocked
                                      ? (lang === 'ar' ? 'الصديق محظور - قم بإلغاء الحظر للمراسلة' : 'Friend Blocked - Unblock to chat')
                                      : (lang === 'ar' ? 'دردشة نشطة' : 'Active Chat')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-thin pr-1">
                              {activeChatFriend.chatHistory.map((h, i) => (
                                <div
                                  key={i}
                                  className={`flex flex-col ${h.sender === 'you' ? 'items-end' : 'items-start'} space-y-1`}
                                >
                                  <div
                                    className={`px-3 py-2 rounded-2xl border text-[10.5px] max-w-[85%] leading-relaxed ${h.sender === 'you'
                                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-200 rounded-tr-none'
                                        : 'bg-slate-950/60 border-slate-800 text-slate-300 rounded-tl-none'
                                      }`}
                                  >
                                    {h.text}
                                  </div>
                                  <span className="text-[7px] text-slate-600 font-mono px-1.5">{h.time}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-slate-800/80 shrink-0">
                              <input
                                type="text"
                                value={typedMessage}
                                onChange={(e) => setTypedMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={activeChatFriend.blocked ? (lang === 'ar' ? 'قم بإلغاء حظر الصديق أولاً لإرسال الرسائل!' : 'Unblock first to chat!') : t.chatPlaceholder}
                                disabled={activeChatFriend.blocked}
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed min-w-0"
                              />
                              <button
                                onClick={handleSendMessage}
                                disabled={activeChatFriend.blocked}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                              >
                                {t.sendBtn}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <span className="text-4xl animate-bounce mb-2">👻</span>
                            <p className="text-xs text-slate-400 leading-relaxed italic max-w-xs">
                              {lang === 'ar'
                                ? 'اختر صديقاً من القائمة بالأسفل لبدء المحادثة، أو أضف صديقاً جديداً!'
                                : 'Select a friend below to start chatting, or add new friends.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Friends List Panel */}
                      <div className="bg-black/40 p-3.5 border-t border-purple-500/20 flex flex-col gap-3 shrink-0 max-h-[52%]">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={searchFriendName}
                            onChange={(e) => setSearchFriendName(e.target.value)}
                            placeholder={t.addFriendPlaceholder}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 min-w-0"
                          />
                          <button
                            onClick={() => handleAddFriend(searchFriendName)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                          >
                            {t.addFriendBtn}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {suggestedPlayers.map((player, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAddFriend(player.name, player.avatar)}
                              className="flex items-center gap-1.5 p-1 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 rounded-xl transition-all text-left text-[9px] font-bold cursor-pointer min-w-0"
                            >
                              <img src={player.avatar} alt={player.name} className="w-4 h-4 rounded-full bg-slate-900 shrink-0" />
                              <span className="truncate text-slate-300">{player.name}</span>
                            </button>
                          ))}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                          {friends.map((friend) => {
                            const isActive = activeChatFriendId === friend.id;
                            return (
                              <div
                                key={friend.id}
                                onClick={() => setActiveChatFriendId(friend.id)}
                                className={`flex items-center justify-between p-2 rounded-xl text-xs gap-3 transition-all cursor-pointer border ${isActive
                                    ? 'bg-indigo-950/30 border-indigo-500/40'
                                    : 'bg-slate-950/40 border-transparent hover:bg-slate-950/60'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img src={friend.avatar} alt="Avatar" className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800" />
                                  <div className="min-w-0">
                                    <p className={`font-bold truncate ${friend.blocked ? 'text-slate-500 line-through font-normal' : 'text-slate-200'}`}>
                                      {friend.name}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  {!friend.blocked ? (
                                    <button
                                      onClick={() => handleBlockFriend(friend.id)}
                                      className="p-1 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-900/40 text-rose-400 rounded-lg cursor-pointer text-[10px]"
                                      title={t.blockBtn}
                                    >
                                      🚫
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUnblockFriend(friend.id)}
                                      className="p-1 bg-emerald-950/20 border border-emerald-900/30 hover:bg-emerald-900/40 text-emerald-400 rounded-lg cursor-pointer text-[10px]"
                                      title={t.unblockBtn}
                                    >
                                      🔓
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveFriend(friend.id)}
                                    className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer text-[10px]"
                                    title={t.unfriendBtn}
                                  >
                                    ❌
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* --- CHOOSE GAME SESSION MODAL --- */}
      {showSessionSelectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 w-full max-w-md relative shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">
              {lang === 'ar' ? 'جلسات اللعب المتاحة بانتظار لاعب' : 'Active Game Sessions Waiting'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? 'تم العثور على أكثر من جلسة واحدة لهذه اللعبة. اختر مع من تريد اللعب:' : 'Multiple active sessions found. Select a host to play with:'}
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {selectorSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={session.hostAvatar} alt="Avatar" className="w-6 h-6 rounded-full bg-slate-900" />
                    <div>
                      <p className="font-bold text-white leading-tight">{session.hostName}</p>
                      <p className="text-[9px] text-slate-555 font-mono mt-0.5">{session.createdAt}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSessionSelectorModal(false);
                      addToast(lang === 'ar' ? `تم الانضمام لجلسة [${session.hostName}] بنجاح! 🎮` : `Joined session hosted by [${session.hostName}]! 🎮`, 'success');
                      setActiveSessions((prev) => prev.filter((s) => s.id !== session.id));
                      launchGameMode(selectorGameId);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-[10px] font-black rounded-lg border border-amber-400 active:scale-95 transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? '🕹️ انضم والعب' : '🕹️ Join & Play'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSessionSelectorModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 text-xs font-bold cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Modal Popup Overlay */}
      {showGameModal && (
        <div className={`fixed inset-0 z-50 w-screen h-[100dvh] overflow-hidden flex items-center justify-center ${activeGame === 'ludo' ? 'bg-[#0a3526]' : 'bg-slate-950/95 backdrop-blur-md'} no-pull-refresh overscroll-none select-none`}>
          <div className="w-full h-full flex flex-col overflow-hidden relative shadow-2xl no-pull-refresh overscroll-none">

            {/* Dynamic Blurred Game Card Background (Skipped for Ludo to prevent mobile GPU blur lag) */}
            {activeGame !== 'ludo' && (
              <>
                <div
                  className="absolute inset-0 bg-cover -z-20 pointer-events-none"
                  style={{
                    backgroundImage: `url('${activeCard}')`,
                    backgroundPosition: 'center top',
                    filter: 'brightness(0.35) saturate(1.1)'
                  }}
                />
                <div className="absolute inset-0 bg-black/40 -z-10 pointer-events-none" />
              </>
            )}

            {/* Modal header - Hidden for Ludo since Ludo has its own full top bar with Exit (⏻) */}
            {activeGame !== 'ludo' && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>🎰</span>
                  {activeGame === 'billiards' ? (lang === 'ar' ? '🎱 كيو ماستر (Cue Master) بلياردو & سنوكر' : '🎱 Cue Master Pool & Snooker') : activeGame === 'chess' ? t.chessTitle : (activeGame === 'estimation' ? t.estimationTitle : (activeGame === 'uno' ? t.unoTitle : (activeGame === 'cyber-arena' ? t.cyberTitle : (activeGame === 'backgammon' ? (lang === 'ar' ? '🎲 لعبة الطاولة (الشيش)' : 'Backgammon') : t.dominoTitle))))}
                </h3>
                <button
                  onClick={handleCloseGame}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-bold bg-slate-800/40 hover:bg-rose-950/50 px-3 py-1 rounded-lg border border-slate-700/50 hover:border-rose-700/50"
                >
                  ❌ {lang === 'ar' ? 'إغلاق اللعبة' : 'Close Game'}
                </button>
              </div>
            )}

            {/* Modal body */}
            <div className={`flex-1 flex flex-col md:flex-row ${activeGame === 'ludo' ? 'p-0' : 'p-0.5 sm:p-2'} gap-2 sm:gap-4 overflow-hidden bg-transparent no-pull-refresh overscroll-none`}>
              <div className="flex-1 bg-transparent overflow-hidden h-full shadow-inner relative z-10 w-full no-pull-refresh overscroll-none">
                <iframe
                  src={activeIframeSrc}
                  className="w-full h-full border-none"
                  title="Game Iframe Inside Modal"
                />
              </div>

              {/* Sidebar Panel - Hidden for Ludo because Ludo has its own embedded spectator bar, chat & gifts */}
              {activeGame !== 'ludo' && (
                <div className="hidden md:block md:w-[350px] shrink-0 h-full overflow-y-auto z-20">
                  <InteractionPanel profile={profile} onUpdate={onUpdate} addToast={addToast} lang={lang} activeGame={activeGame} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stake & Table Selector Modal (Billiards & General Stakes) */}
      {showStakeModal && (
        <StakeSelectorModal
          gameTitle={pendingGameTitle}
          gameKey={pendingGameMode}
          profile={profile}
          onClose={() => setShowStakeModal(false)}
          onStartGame={handleStartGameFromStakeModal}
          addToast={addToast}
        />
      )}

      {/* Cinematic Game Splash Intro ("الدخلة") */}
      {showCinematicIntro && (
        <MythicSplashScreenIntro
          lang={lang}
          isMuted={false}
          onComplete={() => {
            setShowCinematicIntro(false);
            setShowCafeRoomModal(true);
          }}
        />
      )}

      {/* Cafe Games Unified Table & Room Selector Modal (Ludo, Domino, Backgammon, Chess, Uno, Estimation) */}
      {showCafeRoomModal && (
        <CafeRoomModal
          gameKey={selectedCafeGameKey}
          profile={profile}
          onClose={() => setShowCafeRoomModal(false)}
          onStartGame={handleStartCafeGame}
          onOpenIntro={() => {
            setShowCafeRoomModal(false);
            setShowCinematicIntro(true);
          }}
          addToast={addToast}
          lang={lang}
        />
      )}

      {/* Ludo Dedicated Room & Spectator System Modal */}
      {showLudoRoomModal && (
        <LudoRoomModal
          profile={profile}
          onClose={() => setShowLudoRoomModal(false)}
          onStartLudo={handleStartLudo}
          addToast={addToast}
          lang={lang}
        />
      )}
    </div>
  );
}
