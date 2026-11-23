import { getProfile, getDailyQuest, updateProfile, updateDailyQuest } from '@/lib/supabaseServer';
import { Profile, DailyQuest, isRealSupabaseConfigured, supabaseAdmin, supabaseClient } from '@/lib/supabase';
import { ActionResponse } from './gameActions';

/**
 * Server Action: claimDailyLogin()
 * Checks if 24 hours have passed since 'last_login_claim'.
 * If yes, rewards user with +50 gold_coins and updates the timestamp.
 */
export async function claimDailyLogin(userId: string): Promise<ActionResponse> {
  try {
    const client = supabaseAdmin || supabaseClient;

    // 1. Try secure Postgres RPC function first (handles atomic update and bypasses RLS securely)
    if (isRealSupabaseConfigured && client) {
      try {
        const { data: rpcData, error: rpcError } = await client.rpc('claim_daily_bonus', {
          p_user_id: userId,
        });

        if (!rpcError && rpcData) {
          if (rpcData.success) {
            const updatedProfile = await getProfile(userId);
            return {
              success: true,
              message: rpcData.message || 'تم الحصول على مكافأة الدخول اليومي! حصلت على +50 عملة ذهبية! 🎉',
              data: updatedProfile,
            };
          } else {
            return {
              success: false,
              message: rpcData.message || 'المكافأة اليومية غير متاحة بعد.',
            };
          }
        }
      } catch (rpcErr) {
        // Fallback to standard flow if RPC is not installed in database yet
        console.warn('[claimDailyLogin] RPC fallback:', rpcErr);
      }
    }

    // 2. Standard server-action flow
    const dailyQuest = await getDailyQuest(userId);
    const lastClaimDate = new Date(dailyQuest.last_login_claim);
    const now = new Date();

    const diffMs = now.getTime() - lastClaimDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const remainingHours = Math.ceil(24 - diffHours);
      return {
        success: false,
        message: `المكافأة اليومية غير متاحة بعد. يرجى الانتظار ${remainingHours} ساعة.`,
      };
    }

    const profile = await getProfile(userId);

    const updatedProfile: Profile = {
      ...profile,
      gold_coins: profile.gold_coins + 50,
    };

    const updatedQuest: DailyQuest = {
      ...dailyQuest,
      last_login_claim: now.toISOString(),
    };

    await updateProfile(updatedProfile);
    await updateDailyQuest(updatedQuest);

    return {
      success: true,
      message: 'تم الحصول على مكافأة الدخول اليومي! حصلت على +50 عملة ذهبية! 🎉',
      data: updatedProfile,
    };
  } catch (err: any) {
    console.error('[claimDailyLogin Error]:', err);
    return {
      success: false,
      message: err.message || 'حدث خطأ أثناء معالجة المطالبة بمكافأة الدخول.',
    };
  }
}

/**
 * Server Action: completeDailyMatchQuest()
 * Rewards users with +30 gold_coins for completing the daily objective of playing a match.
 * Tracks and increments matches_played_today.
 */
export async function completeDailyMatchQuest(userId: string): Promise<ActionResponse> {
  try {
    const dailyQuest = await getDailyQuest(userId);
    
    if (dailyQuest.matches_played_today >= 1) {
      return {
        success: false,
        message: 'لقد أكملت بالفعل المهمة اليومية لهذا اليوم واستلمت مكافأتها! 🎯',
      };
    }

    const profile = await getProfile(userId);

    const updatedProfile: Profile = {
      ...profile,
      gold_coins: profile.gold_coins + 30,
    };

    const updatedQuest: DailyQuest = {
      ...dailyQuest,
      matches_played_today: dailyQuest.matches_played_today + 1,
    };

    await updateProfile(updatedProfile);
    await updateDailyQuest(updatedQuest);

    return {
      success: true,
      message: 'أحسنت! تم إكمال مهمة اللعب اليومية بنجاح وحصلت على +30 عملة ذهبية! 🏆',
      data: updatedProfile,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'حدث خطأ أثناء معالجة إكمال المهمة اليومية.',
    };
  }
}

/**
 * Test Helper Action: Reset economy and daily states
 */
export async function resetDailyQuestTime(userId: string): Promise<ActionResponse> {
  try {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    
    await updateDailyQuest({
      user_id: userId,
      last_login_claim: yesterday,
      matches_played_today: 0,
    });

    return {
      success: true,
      message: 'تمت إعادة تعيين المهام اليومية ومطالبة الدخول بنجاح! يمكنك التجربة الآن.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
    };
  }
}

/**
 * Server Action: buyEmote()
 * Deducts gold coins and adds the specified premium emote to the user's profile.
 */
export async function buyEmote(userId: string, emoteId: string, cost: number): Promise<ActionResponse> {
  try {
    const profile = await getProfile(userId);

    if (profile.gold_coins < cost) {
      return {
        success: false,
        message: `ليس لديك عملات كافية لشراء هذا الرمز! تحتاج إلى ${cost} عملة.`,
      };
    }

    const unlocked = profile.unlocked_emotes || [];
    if (unlocked.includes(emoteId)) {
      return {
        success: false,
        message: 'لقد قمت بإلغاء قفل هذا الرمز بالفعل!',
      };
    }

    const updatedProfile: Profile = {
      ...profile,
      gold_coins: profile.gold_coins - cost,
      unlocked_emotes: [...unlocked, emoteId],
    };

    await updateProfile(updatedProfile);

    return {
      success: true,
      message: '🎉 تم شراء الرمز التعبيري بنجاح وإلغاء قفله!',
      data: updatedProfile,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'حدث خطأ أثناء شراء الرمز التعبيري.',
    };
  }
}
