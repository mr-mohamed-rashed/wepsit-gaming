import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 font-sans p-6 md:p-12" dir="rtl">
      <div className="max-w-4xl mx-auto bg-slate-900/70 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-md space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              شروط الاستخدام (Terms of Service)
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
              <span className="text-indigo-400">1.</span> قبول الشروط
            </h2>
            <p>
              باستخدامك لمنصة <strong>Mythic Games</strong> أو تسجيل الدخول إليها عبر أي من بوابات الدخول المتاحة، فإنك توافق التام على الالتزام بشروط الخدمة هذه وجميع القوانين المعمول بها. إذا كنت لا توافق على هذه الشروط، يرجى التوقف عن استخدام المنصة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">2.</span> حسابات اللاعبين وقواعد اللعب النظيف (Fair Play)
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pr-2">
              <li>يلتزم اللاعب باستخدام حساب واحد حقيقي وعدم انتحال هوية أي لاعب آخر.</li>
              <li>يحظر تماماً استخدام برامج الروبوت التلقائية (Bots) أو أدوات الغش أو استغلال أي ثغرات برمجية للتلاعب بنتائج المباريات.</li>
              <li>يحظر استخدام الشات الداخلي للمنصة في أي مضايقات أو توجيه إساءات عنصرية أو غير لائقة للاعبين الآخرين.</li>
              <li>تحتفظ إدارة المنصة بحق حظر أو تقييد وصول أي حساب ينتهك معايير اللعب النظيف.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">3.</span> العملات الافتراضية واقتصاد اللعبة (Virtual Coins)
            </h2>
            <p>
              العملات الذهبية والنقاط المكتسبة داخل المنصة هي <strong>عملات ترفيهية افتراضية بحتة</strong> مخصصة للمنافسة داخل الألعاب فقط:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pr-2">
              <li>ليس لهذه العملات أي قيمة مالية نقدية في العالم الحقيقي ولا يمكن استبدالها بأموال حقيقية.</li>
              <li>العملات تُكتسب عبر الفوز في المباريات أو المطالبة بالمكافآت اليومية أو إنجاز المهام.</li>
              <li>المنصة لا تمارس ولا تدعم أي نوع من أنواع المراهنات المالية الحقيقية.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">4.</span> الملكية الفكرية
            </h2>
            <p>
              جميع التصاميم، الأكواد، الواجهات، الرسومات التفاعلية، والرموز المعروضة في المنصة هي ملك حصري لمطوري Mythic Games وتخضع لحماية حقوق الملكية الفكرية وقوانين النشر.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">5.</span> إخلاء المسؤولية
            </h2>
            <p>
              يتم تقديم الألعاب والخدمات "كما هي" دون أي ضمانات صريحة أو ضمنية باستمرار الخدمة دون انقطاع، رغم بذل أقصى جهد ممكن لضمان استقرار الخوادم وجودة الاتصال السحابي.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">6.</span> التعديل على الشروط
            </h2>
            <p>
              يحق لإدارة المنصة تحديث شروط الخدمة هذه عند الحاجة لتعزيز أمان المنصة أو إضافة ميزات جديدة، وسيكون استمرارك في استخدام الموقع بمثابة موافقة على التحديثات.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>© 2026 Mythic Games Platform. جميع الحقوق محفوظة.</span>
          <Link href="/privacy" className="text-indigo-400 hover:underline">
            سياسة الخصوصية (Privacy Policy)
          </Link>
        </div>

      </div>
    </div>
  );
}
