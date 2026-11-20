-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    gold_coins INTEGER DEFAULT 100 NOT NULL, -- Starts with 100 welcome coins
    wins INTEGER DEFAULT 0 NOT NULL,
    losses INTEGER DEFAULT 0 NOT NULL,
    unlocked_emotes TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles read policy
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- Profiles update policy (metadata only, economy managed by Server Actions)
CREATE POLICY "Allow users to update their own profile metadata" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create daily_quests table
CREATE TABLE IF NOT EXISTS public.daily_quests (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    last_login_claim TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() - INTERVAL '24 hours') NOT NULL,
    matches_played_today INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS on daily_quests
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

-- Daily quests read policy
CREATE POLICY "Allow users to read their own daily quests" 
ON public.daily_quests FOR SELECT 
USING (auth.uid() = user_id);

-- Trigger to automatically create a profile and quest record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, gold_coins, wins, losses)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'Player_' || substring(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text),
    100,
    0,
    0
  );
  
  -- Pre-populate quests with ready to claim daily login
  INSERT INTO public.daily_quests (user_id, last_login_claim, matches_played_today)
  VALUES (new.id, now() - INTERVAL '24 hours', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
