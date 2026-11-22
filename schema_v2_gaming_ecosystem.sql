-- =====================================================================
-- MYTHIC GAMES - ADVANCED GAMING ECOSYSTEM SCHEMA (v2)
-- Includes: Wallets, Ghost Bots Pool, Game Stakes, Tournaments, and Settlement
-- =====================================================================

-- 1. جدول المعاملات المالية (سجل المحفظة لمنع التلاعب)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'match_entry', 'match_win', 'tournament_entry', 'tournament_win', 'daily_bonus'
    match_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" 
ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- 2. جدول هويات الريبوتات الخفية (Ghost Bots Pool)
-- يحتوي على بيانات واقعية من أسماء وأعلام وصور وإحصائيات طبيعية
CREATE TABLE IF NOT EXISTS public.bot_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    country_code TEXT NOT NULL, -- 'EG', 'SA', 'AE', 'MA', 'KW'
    country_name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    wins INTEGER DEFAULT 35 NOT NULL,
    losses INTEGER DEFAULT 28 NOT NULL,
    skill_level TEXT DEFAULT 'medium' NOT NULL -- 'easy', 'medium', 'pro'
);

ALTER TABLE public.bot_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read bot profiles" 
ON public.bot_profiles FOR SELECT USING (true);

-- إدخال هويات واقعية جاهزة للريبوتات الخفية
INSERT INTO public.bot_profiles (username, country_code, country_name, avatar_url, wins, losses, skill_level)
VALUES
('أحمد_البرنس_EG', 'EG', 'مصر 🇪🇬', 'https://api.dicebear.com/7.x/bottts/svg?seed=AhmedEG', 84, 52, 'pro'),
('سلطان_الرياض_KSA', 'SA', 'السعودية 🇸🇦', 'https://api.dicebear.com/7.x/bottts/svg?seed=SultanKSA', 112, 89, 'pro'),
('Capo_Alexandria', 'EG', 'مصر 🇪🇬', 'https://api.dicebear.com/7.x/bottts/svg?seed=CapoAlex', 45, 39, 'medium'),
('صقر_دبي_VIP', 'AE', 'الإمارات 🇦🇪', 'https://api.dicebear.com/7.x/bottts/svg?seed=SaqrUAE', 140, 95, 'pro'),
('Shadow_Striker_99', 'KW', 'الكويت 🇰🇼', 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowKW', 62, 50, 'medium'),
('نور_الهدى_العربي', 'MA', 'المغرب 🇲🇦', 'https://api.dicebear.com/7.x/bottts/svg?seed=NourMA', 38, 29, 'easy'),
('طارق_كينج_88', 'EG', 'مصر 🇪🇬', 'https://api.dicebear.com/7.x/bottts/svg?seed=TariqEG', 78, 64, 'medium'),
('Al_Zaeem_Fahad', 'SA', 'السعودية 🇸🇦', 'https://api.dicebear.com/7.x/bottts/svg?seed=FahadKSA', 95, 71, 'pro'),
('جوكر_القاهرة', 'EG', 'مصر 🇪🇬', 'https://api.dicebear.com/7.x/bottts/svg?seed=JokerCairo', 53, 44, 'medium'),
('Ghost_Sniper_Q8', 'KW', 'الكويت 🇰🇼', 'https://api.dicebear.com/7.x/bottts/svg?seed=GhostQ8', 41, 35, 'easy'),
('أسد_الأطلس_2026', 'MA', 'المغرب 🇲🇦', 'https://api.dicebear.com/7.x/bottts/svg?seed=AtlasLion', 125, 88, 'pro'),
('Omar_Master_Pool', 'EG', 'مصر 🇪🇬', 'https://api.dicebear.com/7.x/bottts/svg?seed=OmarPool', 99, 65, 'pro')
ON CONFLICT (username) DO NOTHING;

-- 3. جدول طاولات الرهان (Game Tables / Stakes)
CREATE TABLE IF NOT EXISTS public.game_tables (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    city TEXT NOT NULL,
    entry_fee INTEGER NOT NULL,
    prize_amount INTEGER NOT NULL,
    min_level INTEGER DEFAULT 1 NOT NULL,
    badge_icon TEXT NOT NULL,
    bg_gradient TEXT NOT NULL
);

ALTER TABLE public.game_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read game tables" 
ON public.game_tables FOR SELECT USING (true);

INSERT INTO public.game_tables (id, name_ar, name_en, city, entry_fee, prize_amount, min_level, badge_icon, bg_gradient)
VALUES
('cairo', 'طاولة القاهرة (مبتدئين)', 'Cairo Arena', 'القاهرة', 50, 95, 1, '🥉', 'from-amber-700/60 to-yellow-950/80'),
('alex', 'طاولة الإسكندرية (هواة)', 'Alexandria Sea', 'الإسكندرية', 100, 190, 1, '🥈', 'from-blue-700/60 to-cyan-950/80'),
('dubai', 'طاولة دبي (محترفين)', 'Dubai Towers', 'دبي', 500, 950, 2, '🥇', 'from-emerald-600/60 to-teal-950/80'),
('london', 'طاولة لندن (ماسترز)', 'London Royal', 'لندن', 2500, 4750, 3, '👑', 'from-indigo-600/60 to-purple-950/80'),
('las_vegas', 'طاولة لاس فيجاس (الملوك VIP)', 'Las Vegas Strip', 'لاس فيجاس', 10000, 19000, 5, '💎', 'from-rose-600/60 to-pink-950/80')
ON CONFLICT (id) DO NOTHING;

-- 4. جدول البطولات الإقصائية (Knockout Tournaments)
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    game_key TEXT NOT NULL, -- '8-ball-pool', 'ludo', 'chess'
    entry_fee INTEGER NOT NULL,
    first_prize INTEGER NOT NULL,
    second_prize INTEGER NOT NULL,
    total_slots INTEGER DEFAULT 8 NOT NULL, -- بطولة 8 لاعبين
    status TEXT DEFAULT 'open' NOT NULL, -- 'open', 'in_progress', 'completed'
    winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tournaments" 
ON public.tournaments FOR SELECT USING (true);

-- 5. الدالة البنكية الآمنة لتسوية أي مباراة (Settlement RPC)
CREATE OR REPLACE FUNCTION public.settle_match_result(
    p_room_id UUID,
    p_winner_id UUID,
    p_bet_amount INTEGER,
    p_player_ids UUID[]
)
RETURNS jsonb AS $$
DECLARE
    v_total_pot INTEGER;
    v_platform_cut INTEGER;
    v_net_win INTEGER;
    v_player_id UUID;
BEGIN
    v_total_pot := p_bet_amount * array_length(p_player_ids, 1);
    v_platform_cut := CAST(v_total_pot * 0.05 AS INTEGER); -- عمولة 5% رمزية للمنصة
    v_net_win := v_total_pot - v_platform_cut;

    -- خصم الرهان من جميع الخاسرين
    FOREACH v_player_id IN ARRAY p_player_ids
    LOOP
        IF v_player_id != p_winner_id THEN
            UPDATE public.profiles 
            SET gold_coins = GREATEST(0, gold_coins - p_bet_amount),
                losses = losses + 1,
                updated_at = now()
            WHERE id = v_player_id;

            INSERT INTO public.wallet_transactions (user_id, amount, transaction_type, match_id, description)
            VALUES (v_player_id, -p_bet_amount, 'match_entry', p_room_id, 'رسوم اشتراك مباراة');
        END IF;
    END LOOP;

    -- إضافة الجائزة للفائز
    IF p_winner_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET gold_coins = gold_coins + (v_net_win - p_bet_amount),
            wins = wins + 1,
            updated_at = now()
        WHERE id = p_winner_id;

        INSERT INTO public.wallet_transactions (user_id, amount, transaction_type, match_id, description)
        VALUES (p_winner_id, (v_net_win - p_bet_amount), 'match_win', p_room_id, 'جائزة الفوز بالمركز الأول 🏆');
    END IF;

    RETURN jsonb_build_object('success', true, 'net_prize', v_net_win);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
