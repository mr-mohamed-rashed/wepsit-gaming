-- Real-Time Ludo Rooms, Match Settlement & Atomic Coin Sync
-- Run this in the Supabase SQL Editor to enable persistent live rooms & database coin sync.

CREATE TABLE IF NOT EXISTS public.ludo_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  host_avatar TEXT DEFAULT ''::TEXT,
  stake INTEGER NOT NULL DEFAULT 50,
  max_players INTEGER NOT NULL DEFAULT 4,
  pieces_count INTEGER NOT NULL DEFAULT 4,
  win_rule TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'waiting',
  current_players INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ludo_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ludo_rooms" ON public.ludo_rooms;
CREATE POLICY "Public read ludo_rooms"
  ON public.ludo_rooms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated manage ludo_rooms" ON public.ludo_rooms;
CREATE POLICY "Authenticated manage ludo_rooms"
  ON public.ludo_rooms FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ludo_rooms;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Atomic coin adjustment (gifts, daily chests, entry fee)
CREATE OR REPLACE FUNCTION public.ludo_adjust_coins(
  p_user_id UUID,
  p_delta INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET gold_coins = GREATEST(0, gold_coins + p_delta),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id
  RETURNING gold_coins INTO v_balance;

  RETURN COALESCE(v_balance, 0);
END;
$$;

-- Atomic match win/loss settlement
CREATE OR REPLACE FUNCTION public.ludo_settle_match(
  p_user_id UUID,
  p_room_id TEXT,
  p_is_winner BOOLEAN,
  p_delta_coins INTEGER DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  UPDATE public.profiles
  SET gold_coins = GREATEST(0, gold_coins + COALESCE(p_delta_coins, 0)),
      wins = wins + CASE WHEN p_is_winner THEN 1 ELSE 0 END,
      losses = losses + CASE WHEN p_is_winner THEN 0 ELSE 1 END,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id
  RETURNING gold_coins, wins, losses INTO v_profile;

  RETURN jsonb_build_object(
    'gold_coins', COALESCE(v_profile.gold_coins, 0),
    'wins', COALESCE(v_profile.wins, 0),
    'losses', COALESCE(v_profile.losses, 0)
  );
END;
$$;
