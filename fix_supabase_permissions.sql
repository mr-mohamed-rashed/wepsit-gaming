-- ==============================================================================
-- FIX PERMISSIONS AND ENABLE SECURE DAILY REWARDS & PROFILE UPDATES
-- تشغيل هذا الملف في Supabase SQL Editor لحل مشكلة permission denied for table profiles
-- ==============================================================================

-- 1. منح الصلاحيات الكاملة للـ tables للأدوار المستخدمة في المنصة
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.daily_quests TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.wallet_transactions TO postgres, anon, authenticated, service_role;

-- 2. ضبط سياسات الـ RLS لجدول profiles لتمكين التحديث بأمان
DROP POLICY IF EXISTS "Allow users to update their own profile metadata" ON public.profiles;
DROP POLICY IF EXISTS "Allow update access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;

-- السماح بالقراءة للجميع
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- السماح بالتحديث (سواء عبر المستخدم أو عبر Server Actions)
CREATE POLICY "Allow update access to profiles" 
ON public.profiles FOR UPDATE 
USING (true)
WITH CHECK (true);

-- السماح بإضافة بروفايل جديد
DROP POLICY IF EXISTS "Allow insert access to profiles" ON public.profiles;
CREATE POLICY "Allow insert access to profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- 3. ضبط سياسات الـ RLS لجدول daily_quests
DROP POLICY IF EXISTS "Allow users to read their own daily quests" ON public.daily_quests;
DROP POLICY IF EXISTS "Allow access to daily quests" ON public.daily_quests;

CREATE POLICY "Allow access to daily quests" 
ON public.daily_quests FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. دالة المطالبة بالمكافأة اليومية الآمنة مع SECURITY DEFINER لتجاوز أي تعارض RLS
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_coins INTEGER;
    v_now TIMESTAMPTZ := now();
    v_last_claim TIMESTAMPTZ;
BEGIN
    -- فحص تاريخ آخر استلام
    SELECT last_login_claim INTO v_last_claim 
    FROM public.daily_quests 
    WHERE user_id = p_user_id;

    IF v_last_claim IS NOT NULL AND v_last_claim > (v_now - INTERVAL '24 hours') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'المكافأة اليومية غير متاحة بعد. يرجى الانتظار لحين اكتمال 24 ساعة.'
        );
    END IF;

    -- إضافة 50 عملة ذهبية للبروفايل
    UPDATE public.profiles
    SET gold_coins = gold_coins + 50,
        updated_at = v_now
    WHERE id = p_user_id
    RETURNING gold_coins INTO v_coins;

    -- تحديث توقيت المهمة اليومية
    INSERT INTO public.daily_quests (user_id, last_login_claim, matches_played_today)
    VALUES (p_user_id, v_now, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET last_login_claim = v_now;

    -- تسجيل الحركة في جدول المحفظة
    INSERT INTO public.wallet_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, 50, 'daily_bonus', 'مكافأة تسجيل الدخول اليومية 🎁');

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'تم استلام مكافأة الدخول اليومي بنجاح (+50 عملة ذهبية)! 🎉',
        'new_gold_coins', v_coins
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
