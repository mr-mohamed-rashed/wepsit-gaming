'use client';

import CafeRoomModal, { CafeRoomConfig } from './CafeRoomModal';
import { Profile } from '@/lib/supabase';

export interface LudoRoomConfig {
  roomId: string;
  roomName: string;
  role: 'player' | 'spectator';
  playerCount: 2 | 4;
  pieceCount: 2 | 4;
  winRule: 'first' | 'all';
  entryFee: number;
  prizeAmount: number;
}

interface LudoRoomModalProps {
  profile: Profile;
  onClose: () => void;
  onStartLudo: (config: LudoRoomConfig) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
  lang?: 'ar' | 'en';
}

export default function LudoRoomModal({
  profile,
  onClose,
  onStartLudo,
  addToast,
  lang = 'ar',
}: LudoRoomModalProps) {
  const handleStartGame = (config: CafeRoomConfig) => {
    onStartLudo({
      roomId: config.roomId,
      roomName: config.roomName,
      role: config.role,
      playerCount: (config.playerCount === 2 ? 2 : 4) as 2 | 4,
      pieceCount: 4,
      winRule: 'all',
      entryFee: config.entryFee,
      prizeAmount: config.prizeAmount,
    });
  };

  return (
    <CafeRoomModal
      gameKey="ludo"
      profile={profile}
      onClose={onClose}
      onStartGame={handleStartGame}
      addToast={addToast}
      lang={lang}
    />
  );
}
