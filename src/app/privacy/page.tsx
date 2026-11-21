import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans p-6 md:p-12" dir="rtl">
      <div className="max-w-4xl mx-auto bg-slate-900/70 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-md space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              سياسة الخصوصية (Privacy Policy)
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              منصة Mythic Games للألعاب أونلاين • آخر تحديث: نوفمبر 2026
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/30 shrink-0"
          >
            ← العودة للموقع الرئيسي
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm md:text-base leading-relaxed text-slate-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">1.</span> مقدمة عامة
            </h2>
            <p>
              نحن في <strong>Mythic Games</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع بياناتك واستخدامها وحمايتها عند استخدامك لمنصتنا وألعابنا الإلكترونية عبر الإنترنت.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">2.</span> البيانات التي نقوم بجمعها
            </h2>
            <p>
              عند تسجيلك للدخول عبر حساب <strong>Google</strong> أو البريد الإلكتروني، نقوم بجمع الحد الأدنى والضروري فقط من المعلومات لتشغيل حسابك باللعبة:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pr-2">
              <li><strong>الاسم واسم المستخدم:</strong> لعرض اسمك في لوحة المتصدرين وتخصيص هويتك داخل غرف اللعب.</li>
              <li><strong>البريد الإلكتروني:</strong> لتوثيق ملكية الحساب وحمايته من الاختراق وتأمين الدخول.</li>
              <li><strong>صورة البروفايل (الصورة الرمزية):</strong> لعرضها كمظهر للاعب داخل الرقعة أو طاولة اللعب.</li>
              <li><strong>إحصائيات وبيانات اللعب:</strong> عدد مرات الفوز، الخسارة، رصيد العملات الذهبية الافتراضية، والرموز التعبيرية المفتوحة.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">3.</span> كيف نستخدم بياناتك
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pr-2">
              <li>تمكينك من حفظ تقدمك ورصيدك وسجل مبارياتك عبر السيرفرات السحابية.</li>
              <li>نظام التوفيق بين اللاعبين (Matchmaking) واللعب الجماعي المباشر.</li>
              <li>توزيع مكافآت تسجيل الدخول اليومية وتحديث لوحة الشرف.</li>
              <li>ضمان أمان المنصة والحد من أي محاولات غش أو تلاعب بالنقاط.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">4.</span> حماية البيانات وعدم المشاركة مع أطراف ثالثة
            </h2>
            <p>
              نحن <strong>لا نقوم على الإطلاق ببيع أو تأجير أو مشاركة بياناتك الشخصية</strong> مع أي جهات خارجية أو معلنين. يتم تخزين البيانات بشكل مشفر عبر قاعدة بيانات سحابية مؤمنة بنظام (Row-Level Security) تابعة لشركة Supabase المتوافقة مع معايير الأمان العالمية.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">5.</span> حذف البيانات وحقوق المستخدم
            </h2>
            <p>
              يحق لك في أي وقت:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pr-2">
              <li>إلغاء ربط حساب Google الخاص بك عبر إعدادات الأمان في حساب Google.</li>
              <li>طلب حذف بياناتك أو حسابك بالكامل من خوادمنا بمجرد التواصل معنا، وسيتم مسح كافة سجلاتك نهائياً.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">6.</span> التواصل معنا
            </h2>
            <p>
              إذا كان لديك أي استفسار أو طلب بخصوص سياسة الخصوصية أو بياناتك، يمكنك التواصل معنا عبر الدعم الفني للموقع أو البريد الإلكتروني المخصص لإدارة المنصة.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>© 2026 Mythic Games Platform. جميع الحقوق محفوظة.</span>
          <Link href="/terms" className="text-indigo-400 hover:underline">
            شروط الاستخدام (Terms of Service)
          </Link>
        </div>

      </div>
    </div>
  );
}
