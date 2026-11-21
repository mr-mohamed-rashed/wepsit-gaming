'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (supabaseClient) {
          const { data } = await supabaseClient.auth.getSession();
          if (data?.session) {
            router.replace('/');
            return;
          }
        }
      } catch (err) {
        console.error('[OAuth Callback] Session error:', err);
      }
      router.replace('/');
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#031020] text-slate-300 font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">جاري إتمام تسجيل الدخول عبر Google...</p>
      </div>
    </div>
  );
}
