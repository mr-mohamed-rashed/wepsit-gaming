'use client';

import { useState } from 'react';
import { signUpUser, loginUser, loginAsDevAdmin, AuthResponse } from '@/app/actions/authActions';
import { isRealSupabaseConfigured, supabaseClient } from '@/lib/supabase';

interface AuthFormProps {
  onAuthSuccess: (response: AuthResponse) => void;
  lang?: 'ar' | 'en';
}

export default function AuthForm({ onAuthSuccess, lang = 'ar' }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const t = {
    ar: {
      subtitleLogin: 'سجل دخولك للوصول إلى لوحة التحكم وألعابك المفضلة',
      subtitleSignup: 'أنشئ حساباً جديداً لبدء مغامرتك وربح العملات',
      continueWithGoogle: 'المتابعة باستخدام Google (Gmail)',
      googleRedirecting: 'جاري التحويل إلى Google...',
      orDivider: 'أو بالبريد الإلكتروني',
      usernameLabel: 'اسم المستخدم (Username)',
      usernamePlaceholder: 'مثال: GamerPro_99',
      emailOrUserLabel: 'البريد الإلكتروني أو اسم المستخدم',
      emailLabel: 'البريد الإلكتروني (Email)',
      emailPlaceholder: 'ادخل اسم المستخدم أو البريد',
      emailPlaceholderSignup: 'example@domain.com',
      submitLogin: 'تسجيل الدخول',
      submitSignup: 'إنشاء حساب جديد',
      quickBypass: 'تجربة سريعة',
      adminBypass: '🛠️ تسجيل دخول كمسؤول (فتح كل شيء + ذهب غير محدود)',
      toggleToSignup: 'ليس لديك حساب؟ سجل الآن',
      toggleToLogin: 'لديك حساب بالفعل؟ سجل دخولك',
      offlineActive: 'وضع التطوير النشط: يدعم تسجيل الدخول التجريبي التلقائي (Offline-First)',
      successMsg: 'تمت العملية بنجاح!',
      errorFallback: 'حدث خطأ ما.',
      errorUnexpected: 'حدث خطأ غير متوقع.',
      googleMockSuccess: 'تم تسجيل الدخول التجريبي بحساب Google بنجاح!'
    },
    en: {
      subtitleLogin: 'Sign in to access your dashboard and play your favorite games',
      subtitleSignup: 'Create a new account to start your adventure and earn coins',
      continueWithGoogle: 'Continue with Google (Gmail)',
      googleRedirecting: 'Redirecting to Google...',
      orDivider: 'OR WITH EMAIL',
      usernameLabel: 'Username',
      usernamePlaceholder: 'e.g. GamerPro_99',
      emailOrUserLabel: 'Email or Username',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter username or email',
      emailPlaceholderSignup: 'example@domain.com',
      submitLogin: 'Sign In',
      submitSignup: 'Sign Up',
      quickBypass: 'Quick Bypass',
      adminBypass: '🛠️ Login as Admin (Unlock All + Infinite Gold)',
      toggleToSignup: "Don't have an account? Sign up now",
      toggleToLogin: 'Already have an account? Log in',
      offlineActive: 'Developer Mode active: supports local mock authentication (Offline-First)',
      successMsg: 'Successful!',
      errorFallback: 'An error occurred.',
      errorUnexpected: 'An unexpected error occurred.',
      googleMockSuccess: 'Mock Google login successful!'
    }
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let res: AuthResponse;
      if (isLogin) {
        res = await loginUser(email || username);
      } else {
        res = await signUpUser(username, email);
      }

      if (res.success) {
        setMessage({ text: res.message || t.successMsg, type: 'success' });
        if (res.profile) {
          setTimeout(() => {
            onAuthSuccess(res);
          }, 1000);
        }
      } else {
        setMessage({ text: res.message || t.errorFallback, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || t.errorUnexpected, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await loginAsDevAdmin();
      if (res.success) {
        setMessage({ text: res.message || t.successMsg, type: 'success' });
        setTimeout(() => {
          onAuthSuccess(res);
        }, 1000);
      } else {
        setMessage({ text: res.message || t.errorFallback, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || t.errorUnexpected, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setMessage(null);

    try {
      if (isRealSupabaseConfigured && supabaseClient) {
        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        if (error) throw new Error(error.message);
      } else {
        // Mock Google Login fallback for offline mode
        const res = await loginUser('google_player@gmail.com');
        if (res.success) {
          setMessage({ text: t.googleMockSuccess, type: 'success' });
          if (res.profile) {
            setTimeout(() => {
              onAuthSuccess(res);
            }, 800);
          }
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || t.errorUnexpected, type: 'error' });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent tracking-wide">
          MYTHIC GAMES
        </h1>
        <p className="text-sm text-slate-400">
          {isLogin ? t.subtitleLogin : t.subtitleSignup}
        </p>
      </div>

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-800 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer border border-slate-200"
      >
        {googleLoading ? (
          <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{googleLoading ? t.googleRedirecting : t.continueWithGoogle}</span>
      </button>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t.orDivider}</span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t.usernameLabel}</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.usernamePlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            {isLogin ? t.emailOrUserLabel : t.emailLabel}
          </label>
          <input
            type={isLogin ? 'text' : 'email'}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isLogin ? t.emailPlaceholder : t.emailPlaceholderSignup}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center space-x-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>{isLogin ? t.submitLogin : t.submitSignup}</span>
          )}
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t.quickBypass}</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          type="button"
          onClick={handleDevLogin}
          disabled={loading}
          className="w-full py-3 bg-emerald-600/10 hover:bg-emerald-600/20 active:scale-[0.98] text-emerald-400 border border-emerald-500/20 font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>{t.adminBypass}</span>
          )}
        </button>
      </form>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold text-center border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="text-center pt-2">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage(null);
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all underline cursor-pointer"
        >
          {isLogin ? t.toggleToSignup : t.toggleToLogin}
        </button>
      </div>

      <div className="border-t border-slate-800/80 pt-4 text-center">
        <p className="text-[10px] text-slate-500 font-mono">
          {t.offlineActive}
        </p>
      </div>
    </div>
  );
}
