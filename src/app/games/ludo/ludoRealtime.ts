import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export type LudoTurnColor = 'blue' | 'green' | 'yellow' | 'red';

export interface LiveLobbyRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  stake: number;
  maxPlayers: number;
  piecesCount: number;
  winRule: 'first' | 'all';
  status: 'waiting' | 'in_game';
  currentPlayers: number;
  isOpen?: boolean;
  roomLevel?: number;
  roomXp?: number;
  roomMatches?: number;
  bannedIds?: string[];
  playersJoined?: Array<{
    id: string;
    username: string;
    avatar: string;
    color?: LudoTurnColor;
  }>;
  updatedAt?: number;
}

export interface RoomPeerPresence {
  id: string;
  username: string;
  avatar: string;
  isHost?: boolean;
  preferredColor?: LudoTurnColor;
  micSeat?: number | null;
  isMuted?: boolean;
  joinedAt: number;
}

export type LudoRoomEvent =
  | { type: 'dice_roll'; senderId: string; color: LudoTurnColor; value: number; seq: number }
  | { type: 'token_move'; senderId: string; color: LudoTurnColor; tokenId: number; roll: number; seq: number }
  | { type: 'chat_msg'; senderId: string; senderName: string; text: string; ts: number }
  | {
      type: 'gift_sent';
      senderId: string;
      senderName: string;
      senderColor: LudoTurnColor;
      targetColor: LudoTurnColor;
      giftId?: string;
      emoji: string;
      label: string;
      price: number;
      mode: 'peace' | 'war';
    }
  | {
      type: 'voice_seat';
      senderId: string;
      username: string;
      avatar: string;
      color: LudoTurnColor;
      seatIndex: number;
      isMuted: boolean;
    }
  | {
      type: 'match_start';
      senderId: string;
      playerCount: number;
      piecesCount: number;
      winRule: 'first' | 'all';
      activeColors: LudoTurnColor[];
      seatAssignments: Partial<Record<LudoTurnColor, { id: string; username: string; avatar: string; isHuman: boolean }>>;
    }
  | {
      type: 'mic_request';
      senderId: string;
      username: string;
      avatar: string;
      slotIndex: number;
    }
  | {
      type: 'mic_response';
      senderId: string;
      targetId: string;
      targetName: string;
      targetAvatar: string;
      approved: boolean;
      slotIndex: number;
    }
  | {
      type: 'moderation_action';
      senderId: string;
      targetId: string;
      targetName?: string;
      action:
        | 'chat_mute'
        | 'chat_unmute'
        | 'mic_mute'
        | 'mic_unmute'
        | 'mic_kick'
        | 'grant_admin'
        | 'revoke_admin'
        | 'kick'
        | 'ban';
    }
  | {
      type: 'room_state';
      senderId: string;
      isLocked: boolean;
      micMode: 'approval' | 'all' | 'admins_only';
      roomLevel: number;
      roomXp: number;
      deputyIds: string[];
    };

type RtcSignalPayload =
  | { type: 'rtc_offer'; fromId: string; toId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'rtc_answer'; fromId: string; toId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'rtc_ice'; fromId: string; toId: string; candidate: RTCIceCandidateInit };

let cachedClient: SupabaseClient | null = null;
const REALTIME_INSTANCE_KEY =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

function sanitizeSupabaseUrl(rawUrl: string): string | null {
  let url = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!url || url === 'YOUR_SUPABASE_URL' || url.includes('placeholder') || url.startsWith('eyJ')) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('supabase.co')) url = `https://${url}`;
    else return null;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function getLudoSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const cleanedUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const envKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

  const isPlaceholder =
    !cleanedUrl ||
    !envKey ||
    envKey === 'YOUR_SUPABASE_ANON_KEY' ||
    envKey.includes('placeholder');

  if (isPlaceholder) return null;

  try {
    cachedClient = createClient(cleanedUrl, envKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: `ludo-rt-${REALTIME_INSTANCE_KEY}`,
      },
      realtime: {
        params: { eventsPerSecond: 15 },
      },
    });
  } catch {
    return null;
  }
  return cachedClient;
}

export function isLudoRealtimeConfigured(): boolean {
  return getLudoSupabaseClient() !== null;
}

/**
 * Subscribe to the global `ludo-lobby` channel so public/custom rooms sync in real time.
 * Works via Supabase Presence + Broadcast, and also reads `ludo_rooms` Postgres table if present.
 */
export function subscribeLudoLobby(
  myInfo: { id: string; username: string; avatar: string },
  onRoomsUpdated: (rooms: LiveLobbyRoom[]) => void
): {
  publishHostedRoom: (room: LiveLobbyRoom | null) => Promise<void>;
  unsubscribe: () => void;
} {
  const client = getLudoSupabaseClient();
  if (!client) {
    return {
      publishHostedRoom: async () => {},
      unsubscribe: () => {},
    };
  }

  let dbRooms: LiveLobbyRoom[] = [];
  let presenceRooms: LiveLobbyRoom[] = [];
  let hostedRoomRef: LiveLobbyRoom | null = null;

  const emitMerged = () => {
    const byId = new Map<string, LiveLobbyRoom>();
    for (const r of dbRooms) byId.set(r.id, r);
    for (const r of presenceRooms) {
      const prev = byId.get(r.id);
      if (!prev || (r.updatedAt || 0) >= (prev.updatedAt || 0)) {
        byId.set(r.id, r);
      }
    }
    onRoomsUpdated(Array.from(byId.values()));
  };

  const fetchDbRooms = async () => {
    try {
      const { data, error } = await client
        .from('ludo_rooms')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);
      if (!error && Array.isArray(data)) {
        dbRooms = data.map((row: any) => ({
          id: String(row.id),
          name: row.name || 'Ludo Room',
          hostId: String(row.host_id || ''),
          hostName: row.host_name || 'Host',
          hostAvatar: row.host_avatar || '',
          stake: Number(row.stake || 100),
          maxPlayers: Number(row.max_players || 4),
          piecesCount: Number(row.pieces_count || 4),
          winRule: row.win_rule === 'all' ? 'all' : 'first',
          status: row.status === 'in_game' ? 'in_game' : 'waiting',
          currentPlayers: Number(row.current_players || 1),
          isOpen: row.is_open !== false,
          roomLevel: Number(row.room_level || 1),
          roomXp: Number(row.room_xp || 0),
          roomMatches: Number(row.room_matches || 0),
          bannedIds: Array.isArray(row.banned_ids) ? row.banned_ids : [],
          updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
        }));
        emitMerged();
      }
    } catch {
      // Optional table `ludo_rooms` not installed yet — Presence still syncs live rooms!
    }
  };

  void fetchDbRooms();

  const channel: RealtimeChannel = client.channel('ludo-lobby', {
    config: { presence: { key: `${myInfo.id}-${REALTIME_INSTANCE_KEY}` } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const next: LiveLobbyRoom[] = [];
      for (const entries of Object.values(state)) {
        for (const item of entries as any[]) {
          if (item?.hostedRoom) {
            next.push(item.hostedRoom as LiveLobbyRoom);
          }
        }
      }
      presenceRooms = next;
      emitMerged();
    })
    .on('broadcast', { event: 'lobby_room_upsert' }, ({ payload }) => {
      if (payload?.room) {
        const incoming = payload.room as LiveLobbyRoom;
        presenceRooms = [incoming, ...presenceRooms.filter((r) => r.id !== incoming.id)];
        emitMerged();
      }
    })
    .on('broadcast', { event: 'lobby_room_remove' }, ({ payload }) => {
      if (payload?.roomId) {
        presenceRooms = presenceRooms.filter((r) => r.id !== payload.roomId);
        dbRooms = dbRooms.filter((r) => r.id !== payload.roomId);
        emitMerged();
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: myInfo.id,
          username: myInfo.username,
          hostedRoom: hostedRoomRef,
          ts: Date.now(),
        });
      }
    });

  return {
    publishHostedRoom: async (room: LiveLobbyRoom | null) => {
      const prevId = hostedRoomRef?.id;
      hostedRoomRef = room;
      try {
        await channel.track({
          userId: myInfo.id,
          username: myInfo.username,
          hostedRoom: room ? { ...room, updatedAt: Date.now() } : null,
          ts: Date.now(),
        });
        if (room) {
          await channel.send({
            type: 'broadcast',
            event: 'lobby_room_upsert',
            payload: { room: { ...room, updatedAt: Date.now() } },
          });
          await client.from('ludo_rooms').upsert({
            id: room.id,
            name: room.name,
            host_id: room.hostId,
            host_name: room.hostName,
            host_avatar: room.hostAvatar,
            stake: room.stake,
            max_players: room.maxPlayers,
            pieces_count: room.piecesCount,
            win_rule: room.winRule,
            status: room.status,
            current_players: room.currentPlayers,
            is_open: room.isOpen !== false,
            room_level: room.roomLevel || 1,
            room_xp: room.roomXp || 0,
            room_matches: room.roomMatches || 0,
            banned_ids: room.bannedIds || [],
            updated_at: new Date().toISOString(),
          });
        } else if (prevId) {
          await channel.send({
            type: 'broadcast',
            event: 'lobby_room_remove',
            payload: { roomId: prevId },
          });
          await client.from('ludo_rooms').delete().eq('id', prevId);
        }
      } catch {
        // Ignore optional DB table errors; realtime broadcast/presence still operates.
      }
    },
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}

/**
 * Manages live P2P microphone audio across players inside the same room
 * using WebRTC mesh signaling carried by the room's Supabase Realtime channel.
 */
export class LudoVoiceManager {
  private localStream: MediaStream | null = null;
  private peers = new Map<string, RTCPeerConnection>();
  private audioElements = new Map<string, HTMLAudioElement>();
  private isSpeakerMuted = false;
  private isMicMuted = true;
  private selfId: string;
  private sendSignal: (signal: RtcSignalPayload) => void;
  private onStatusChange?: (status: { micActive: boolean; peerCount: number; error?: string }) => void;

  constructor(
    selfId: string,
    sendSignal: (signal: RtcSignalPayload) => void,
    onStatusChange?: (status: { micActive: boolean; peerCount: number; error?: string }) => void
  ) {
    this.selfId = selfId;
    this.sendSignal = sendSignal;
    this.onStatusChange = onStatusChange;
  }

  public async setMicEnabled(enabled: boolean): Promise<boolean> {
    this.isMicMuted = !enabled;
    if (enabled && !this.localStream) {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        this.onStatusChange?.({ micActive: false, peerCount: this.peers.size, error: 'Microphone API unavailable' });
        return false;
      }
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        for (const pc of this.peers.values()) {
          for (const track of this.localStream.getTracks()) {
            const alreadyAdded = pc.getSenders().some((s) => s.track?.id === track.id);
            if (!alreadyAdded) pc.addTrack(track, this.localStream);
          }
        }
      } catch (err: any) {
        this.isMicMuted = true;
        this.onStatusChange?.({
          micActive: false,
          peerCount: this.peers.size,
          error: err?.message || 'Microphone permission denied',
        });
        return false;
      }
    }

    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = !this.isMicMuted;
      }
    }
    this.onStatusChange?.({ micActive: !this.isMicMuted, peerCount: this.peers.size });
    return !this.isMicMuted;
  }

  public setSpeakerMuted(muted: boolean) {
    this.isSpeakerMuted = muted;
    for (const audio of this.audioElements.values()) {
      audio.muted = muted;
    }
  }

  public syncPeers(peerIds: string[]) {
    const valid = new Set(peerIds.filter((id) => id && id !== this.selfId));

    for (const [peerId, pc] of this.peers.entries()) {
      if (!valid.has(peerId)) {
        pc.close();
        this.peers.delete(peerId);
        const audio = this.audioElements.get(peerId);
        if (audio) {
          audio.srcObject = null;
          audio.remove();
          this.audioElements.delete(peerId);
        }
      }
    }

    for (const peerId of valid) {
      if (!this.peers.has(peerId) && this.selfId < peerId) {
        void this.createPeerAndOffer(peerId);
      }
    }
    this.onStatusChange?.({ micActive: !this.isMicMuted && !!this.localStream, peerCount: this.peers.size });
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const existing = this.peers.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendSignal({
          type: 'rtc_ice',
          fromId: this.selfId,
          toId: peerId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (e) => {
      if (typeof document === 'undefined') return;
      let audio = this.audioElements.get(peerId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.style.display = 'none';
        document.body.appendChild(audio);
        this.audioElements.set(peerId, audio);
      }
      audio.srcObject = e.streams[0] || new MediaStream([e.track]);
      audio.muted = this.isSpeakerMuted;
      void audio.play().catch(() => {});
    };

    pc.onnegotiationneeded = async () => {
      if (this.selfId < peerId && pc.signalingState === 'stable') {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          this.sendSignal({ type: 'rtc_offer', fromId: this.selfId, toId: peerId, sdp: offer });
        } catch {
          // Ignore race during close
        }
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  private async createPeerAndOffer(peerId: string) {
    const pc = this.createPeerConnection(peerId);
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      this.sendSignal({ type: 'rtc_offer', fromId: this.selfId, toId: peerId, sdp: offer });
    } catch {
      // Ignore temporary SDP failure
    }
  }

  public async handleSignal(signal: RtcSignalPayload) {
    if (signal.toId !== this.selfId || signal.fromId === this.selfId) return;
    const pc = this.createPeerConnection(signal.fromId);
    try {
      if (signal.type === 'rtc_offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendSignal({ type: 'rtc_answer', fromId: this.selfId, toId: signal.fromId, sdp: answer });
      } else if (signal.type === 'rtc_answer') {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'rtc_ice') {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch {
      // Ignore late/stale WebRTC ICE packets
    }
  }

  public destroy() {
    for (const pc of this.peers.values()) {
      pc.close();
    }
    this.peers.clear();
    for (const audio of this.audioElements.values()) {
      audio.srcObject = null;
      audio.remove();
    }
    this.audioElements.clear();
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) track.stop();
      this.localStream = null;
    }
  }
}

export interface LudoRoomHandle {
  isConnected: boolean;
  sendEvent: (ev: LudoRoomEvent) => Promise<void>;
  updatePresence: (patch: Partial<RoomPeerPresence>) => Promise<void>;
  voice: LudoVoiceManager;
  leave: () => void;
}

export function joinLudoRoomRealtime(params: {
  roomId: string;
  self: RoomPeerPresence;
  onPresenceSync: (peers: RoomPeerPresence[]) => void;
  onEvent: (ev: LudoRoomEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
  onVoiceStatus?: (status: { micActive: boolean; peerCount: number; error?: string }) => void;
}): LudoRoomHandle {
  const client = getLudoSupabaseClient();
  let currentSelf: RoomPeerPresence = { ...params.self };

  let channel: RealtimeChannel | null = null;
  let connected = false;

  const voice = new LudoVoiceManager(
    params.self.id,
    (signal) => {
      if (!channel) return;
      void channel.send({
        type: 'broadcast',
        event: 'rtc_signal',
        payload: signal,
      });
    },
    params.onVoiceStatus
  );

  if (!client) {
    params.onConnectionChange?.(false);
    return {
      isConnected: false,
      sendEvent: async () => {},
      updatePresence: async () => {},
      voice,
      leave: () => voice.destroy(),
    };
  }

  channel = client.channel(`ludo-room:${params.roomId}`, {
    config: {
      presence: { key: params.self.id },
      broadcast: { self: false },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      if (!channel) return;
      const state = channel.presenceState();
      const peers: RoomPeerPresence[] = [];
      for (const list of Object.values(state)) {
        for (const raw of list as any[]) {
          if (raw?.id) peers.push(raw as RoomPeerPresence);
        }
      }
      peers.sort((a, b) => a.joinedAt - b.joinedAt);
      params.onPresenceSync(peers);
      voice.syncPeers(peers.map((p) => p.id));
    })
    .on('broadcast', { event: 'ludo_event' }, ({ payload }) => {
      if (payload) params.onEvent(payload as LudoRoomEvent);
    })
    .on('broadcast', { event: 'rtc_signal' }, ({ payload }) => {
      if (payload) void voice.handleSignal(payload as RtcSignalPayload);
    })
    .subscribe(async (status) => {
      connected = status === 'SUBSCRIBED';
      params.onConnectionChange?.(connected);
      if (connected && channel) {
        await channel.track(currentSelf);
      }
    });

  return {
    get isConnected() {
      return connected;
    },
    sendEvent: async (ev: LudoRoomEvent) => {
      if (!channel || !connected) return;
      await channel.send({
        type: 'broadcast',
        event: 'ludo_event',
        payload: ev,
      });
    },
    updatePresence: async (patch: Partial<RoomPeerPresence>) => {
      currentSelf = { ...currentSelf, ...patch };
      if (!channel || !connected) return;
      await channel.track(currentSelf);
    },
    voice,
    leave: () => {
      voice.destroy();
      if (channel) {
        client.removeChannel(channel);
        channel = null;
      }
    },
  };
}

/**
 * Syncs coin balance & match outcome directly with Supabase (if user has a real UUID session)
 * and notifies parent Dashboard iframe when embedded in wepsit-gaming.
 */
export async function syncLudoEconomyToServer(params: {
  userId?: string | null;
  newCoins: number;
  deltaCoins?: number;
  matchResult?: {
    roomId: string;
    isWinner: boolean;
    stake: number;
    reward: number;
  };
}) {
  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'LUDO_COINS_SYNC',
        newCoins: params.newCoins,
        deltaCoins: params.deltaCoins || 0,
        matchResult: params.matchResult || null,
      },
      '*'
    );
  }

  const client = getLudoSupabaseClient();
  const isUuid =
    params.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId);
  if (!client || !isUuid || !params.userId) return;

  try {
    if (params.matchResult) {
      await client.rpc('ludo_settle_match', {
        p_user_id: params.userId,
        p_room_id: params.matchResult.roomId,
        p_is_winner: params.matchResult.isWinner,
        p_delta_coins: params.deltaCoins ?? (params.matchResult.isWinner ? params.matchResult.reward : 0),
      });
    } else if (typeof params.deltaCoins === 'number' && params.deltaCoins !== 0) {
      await client.rpc('ludo_adjust_coins', {
        p_user_id: params.userId,
        p_delta: params.deltaCoins,
      });
    }
  } catch {
    // Fallback gracefully if RPC isn't installed yet or user plays offline
  }
}

export function calculateRoomLevel(totalXp: number): {
  level: number;
  currentXp: number;
  nextXpRequired: number;
} {
  let level = 1;
  let required = 100;
  let xp = Math.max(0, totalXp);
  while (xp >= required) {
    xp -= required;
    level += 1;
    required = Math.round(required * 1.5);
  }
  return { level, currentXp: xp, nextXpRequired: required };
}

export interface PersistentOwnerRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  stake: number;
  maxPlayers: number;
  isOpen: boolean;
  roomLevel: number;
  roomXp: number;
  roomMatches: number;
  bannedIds: string[];
  updatedAt: number;
}

export function getOwnerRoomId(ownerId: string): string {
  const safeId = (ownerId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'guest';
  return `room-owner-${safeId}`;
}

export function loadOwnerRoomLocal(ownerId: string): PersistentOwnerRoom | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`ludo_owner_room_${ownerId}`);
    return raw ? (JSON.parse(raw) as PersistentOwnerRoom) : null;
  } catch {
    return null;
  }
}

export function saveOwnerRoomLocal(room: PersistentOwnerRoom) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ludo_owner_room_${room.hostId}`, JSON.stringify(room));
    localStorage.setItem(
      `ludo_room_meta_${room.id}`,
      JSON.stringify({
        isOpen: room.isOpen,
        roomLevel: room.roomLevel,
        roomXp: room.roomXp,
        roomMatches: room.roomMatches,
        bannedIds: room.bannedIds,
      })
    );
  } catch {}
}

export async function fetchRoomMetaFromServer(roomId: string): Promise<Partial<PersistentOwnerRoom> | null> {
  const localRaw =
    typeof window !== 'undefined' ? (() => {
      try {
        const s = localStorage.getItem(`ludo_room_meta_${roomId}`);
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    })() : null;

  const client = getLudoSupabaseClient();
  if (!client) return localRaw;

  try {
    const { data, error } = await client.from('ludo_rooms').select('*').eq('id', roomId).maybeSingle();
    if (!error && data) {
      return {
        id: String(data.id),
        name: data.name,
        hostId: String(data.host_id),
        hostName: data.host_name,
        hostAvatar: data.host_avatar || '',
        stake: Number(data.stake || 50),
        maxPlayers: Number(data.max_players || 4),
        isOpen: data.is_open !== false,
        roomLevel: Number(data.room_level || 1),
        roomXp: Number(data.room_xp || 0),
        roomMatches: Number(data.room_matches || 0),
        bannedIds: Array.isArray(data.banned_ids) ? data.banned_ids : [],
      };
    }
  } catch {}
  return localRaw;
}

export async function saveRoomMetaToServer(room: PersistentOwnerRoom) {
  saveOwnerRoomLocal(room);
  const client = getLudoSupabaseClient();
  if (!client) return;
  try {
    await client.from('ludo_rooms').upsert({
      id: room.id,
      name: room.name,
      host_id: room.hostId,
      host_name: room.hostName,
      host_avatar: room.hostAvatar,
      stake: room.stake,
      max_players: room.maxPlayers,
      pieces_count: 4,
      win_rule: 'all',
      status: room.isOpen ? 'waiting' : 'in_game',
      current_players: 1,
      is_open: room.isOpen,
      room_level: room.roomLevel,
      room_xp: room.roomXp,
      room_matches: room.roomMatches,
      banned_ids: room.bannedIds,
      updated_at: new Date().toISOString(),
    });
  } catch {}
}

