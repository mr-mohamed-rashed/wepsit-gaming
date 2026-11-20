import { isRealSupabaseConfigured, supabaseClient, Profile } from '@/lib/supabase';
import { getProfile, saveMockDb, getActiveUserId, setActiveUserId, clearActiveUserId } from '@/lib/supabaseServer';

export interface AuthResponse {
  success: boolean;
  message?: string;
  userId?: string;
  profile?: Profile;
}

/**
 * Signs up a new user. 
 * If Supabase is configured, registers them in Supabase Auth.
 * Otherwise, registers them in the mock cookie-based database.
 */
export async function signUpUser(username: string, email: string): Promise<AuthResponse> {
  try {
    if (!username || !email) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم والبريد الإلكتروني.' };
    }

    if (isRealSupabaseConfigured && supabaseClient) {
      // Real Supabase Auth signUp
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password: 'TemporaryPassword123!', // Simple demo password
        options: {
          data: {
            username,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          }
        }
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('فشلت عملية إنشاء الحساب.');

      return {
        success: true,
        message: 'تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.',
        userId: data.user.id,
      };
    } else {
      // Mock Auth Registration
      const mockId = `mock-user-${Date.now()}`;
      
      const newProfile: Profile = {
        id: mockId,
        username,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        gold_coins: 100, // 100 Welcome coins
        wins: 0,
        losses: 0,
        unlocked_emotes: [],
      };

      const newDailyQuest = {
        user_id: mockId,
        last_login_claim: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // Able to claim instantly
        matches_played_today: 0,
      };

      // Save user to mock database cookies
      await saveMockDb(newProfile, newDailyQuest);
      await setActiveUserId(mockId);

      return {
        success: true,
        message: 'تم التسجيل التجريبي بنجاح! تم تسجيل دخولك تلقائياً وبدء رصيدك بـ 100 عملة ترحيبية. 🎉',
        userId: mockId,
        profile: newProfile,
      };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'حدث خطأ أثناء التسجيل.' };
  }
}

/**
 * Logs in an existing user.
 * If Supabase is configured, performs sign in.
 * Otherwise, performs mock login based on username or email.
 */
export async function loginUser(emailOrUsername: string): Promise<AuthResponse> {
  try {
    if (!emailOrUsername) {
      return { success: false, message: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم.' };
    }

    if (isRealSupabaseConfigured && supabaseClient) {
      // Real Supabase Auth login
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: emailOrUsername,
        password: 'TemporaryPassword123!',
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('اسم المستخدم أو كلمة المرور غير صالحة.');

      const profile = await getProfile(data.user.id);

      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح! 🚀',
        userId: data.user.id,
        profile,
      };
    } else {
      // Mock Login
      // For mock login, we retrieve from cookie store if exists.
      // If we don't find it, we can create one dynamically to make testing easy
      const formattedName = emailOrUsername.split('@')[0];
      const mockId = `mock-user-${formattedName.toLowerCase()}`;
      
      const profile = await getProfile(mockId);
      await setActiveUserId(mockId);

      return {
        success: true,
        message: `مرحباً بعودتك يا ${profile.username}! 👋`,
        userId: mockId,
        profile,
      };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'فشل تسجيل الدخول.' };
  }
}

/**
 * Retrieves the currently logged-in user session profile.
 */
export async function getCurrentUserSession(): Promise<AuthResponse> {
  try {
    if (isRealSupabaseConfigured && supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return { success: false, message: 'لا توجد جلسة نشطة.' };

      const profile = await getProfile(user.id);
      return { success: true, userId: user.id, profile };
    } else {
      const activeId = await getActiveUserId();
      const profile = await getProfile(activeId);
      return { success: true, userId: activeId, profile };
    }
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Developer Bypass: Login as Admin with unlimited resources
 */
export async function loginAsDevAdmin(): Promise<AuthResponse> {
  try {
    const mockId = 'mock-user-developer-admin';
    const devProfile: Profile = {
      id: mockId,
      username: 'Developer_Admin 🛠️',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=DeveloperAdmin`,
      gold_coins: 99999, // Unlimited coins
      wins: 150,
      losses: 5,
      unlocked_emotes: ['robot-laugh', 'dragon-knight', 'wizard-cat'], // All unlocked!
    };

    const newDailyQuest = {
      user_id: mockId,
      last_login_claim: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      matches_played_today: 0,
    };

    await saveMockDb(devProfile, newDailyQuest);
    await setActiveUserId(mockId);

    return {
      success: true,
      message: 'تم تسجيل دخولك بنجاح كمسؤول التطوير! جميع العملات والرموز المميزة مفتوحة الآن. 🛠️',
      userId: mockId,
      profile: devProfile,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
    };
  }
}

/**
 * Logs out the current user.
 */
export async function logoutCurrentUser(): Promise<{ success: boolean; message: string }> {
  try {
    await clearActiveUserId();

    if (isRealSupabaseConfigured && supabaseClient) {
      await supabaseClient.auth.signOut();
    }

    return { success: true, message: 'تم تسجيل الخروج بنجاح.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'حدث خطأ أثناء تسجيل الخروج.' };
  }
}
