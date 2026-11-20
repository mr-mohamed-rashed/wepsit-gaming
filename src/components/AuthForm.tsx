'use client';

import { useState } from 'react';
import { signUpUser, loginUser, loginAsDevAdmin, AuthResponse } from '@/app/actions/authActions';

interface AuthFormProps {
  onAuthSuccess: (response: AuthResponse) => void;
  lang?: 'ar' | 'en';
}

export default function AuthForm({ onAuthSuccess, lang = 'ar' }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const t = {
    ar: {
      subtitleLogin: 'سجل دخولك للوصول إلى لوحة التحكم وألعابك المفضلة',
      subtitleSignup: 'أنشئ حساباً جديداً لبدء مغامرتك وربح العملات',
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
      errorUnexpected: 'حدث خطأ غير متوقع.'
    },
    en: {
      subtitleLogin: 'Sign in to access your dashboard and play your favorite games',
      subtitleSignup: 'Create a new account to start your adventure and earn coins',
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
      errorUnexpected: 'An unexpected error occurred.'
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
