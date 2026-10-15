import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle, Heart, Lock, AlertCircle, Eye, RefreshCw, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

export default function Legal() {
  const { language, t } = useApp();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {language === 'bn' ? 'শর্তাবলী ও গোপনীয়তা নীতি' : 'Terms & Privacy Policy'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-lg mx-auto">
          {language === 'bn'
            ? 'দারুণ ডোনার্স প্ল্যাটফর্ম ব্যবহারের নিয়মাবলী এবং আপনার তথ্যের সর্বোচ্চ সুরক্ষার প্রতিশ্রুতি।'
            : 'Operational guidelines and our steadfast commitment to protecting your personal data.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 max-w-md mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'terms'
              ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          {language === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          {language === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden border border-slate-200/60 dark:border-zinc-800/60 shadow-xl">
        {activeTab === 'terms' ? (
          /* ================= TERMS & CONDITIONS ================= */
          <div className="space-y-6 text-slate-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
              <FileText className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'সেবার নিয়মাবলী ও শর্তসমূহ' : 'Terms and Conditions'}
                </h2>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {language === 'bn' ? 'সর্বশেষ সংস্করণ: অক্টোবর ২০২৬ | দারুন ডোনার্স' : 'Last Updated: October 2026 | Darun Donors'}
                </span>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                {language === 'bn' ? '১. অলাভজনক ও মানবিক উদ্দেশ্য' : '1. Non-Profit & Humanitarian Purpose'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'দারুণ ডোনার্স একটি স্বেচ্ছাসেবী, সম্পূর্ণ অলাভজনক ও মানবিক রক্তদান সংযোগ প্ল্যাটফর্ম। রক্ত কেনাবেচা বা কোনো প্রকার আর্থিক লেনদেন কঠোরভাবে নিষিদ্ধ ও বেআইনি। এই প্ল্যাটফর্ম শুধুমাত্র রোগী ও রক্তদাতার মাঝে জরুরি যোগাযোগ স্থাপনের মাধ্যম।'
                  : 'Darun Donors operates strictly as a non-profit humanitarian matching portal connecting patients with voluntary donors. The sale, purchase, or brokering of blood or blood products for monetary reward is strictly illegal, unethical, and prohibited.'}
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {language === 'bn' ? '২. রক্তদাতার যোগ্যতা ও সত্যতা' : '2. Donor Eligibility & Truthfulness'}
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400 text-sm">
                <li>
                  {language === 'bn'
                    ? 'রক্তদাতা হিসেবে নিবন্ধিত হতে হলে বয়স ন্যূনতম ১৮ বছর হতে হবে।'
                    : 'Donors must be at least 18 years of age to register and participate.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'নিবন্ধনের সময় নাম, ফোন নম্বর, রক্তের গ্রুপ এবং এলাকার সঠিক ও নির্ভুল তথ্য প্রদান করতে হবে। ইচ্ছাকৃত ভুল বা মিথ্যা তথ্য দেওয়া শাস্তিযোগ্য অপরাধ।'
                    : 'All registration data including name, phone number, blood group, and location must be accurate, truthful, and verified.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'সর্বশেষ রক্তদানের পর মেডিকেল নির্দেশিকা অনুযায়ী ন্যূনতম ৯০ থেকে ১২০ দিনের বিরতি (কুলডাউন) বজায় রাখা আবশ্যক।'
                    : 'Standard clinical cool-down periods (90-120 days between whole blood donations) must be adhered to for donor wellness.'}
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                {language === 'bn' ? '৩. জরুরি রক্তের অনুরোধের আচরণবিধি' : '3. Emergency Requests Code of Conduct'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'জরুরি রক্তের অনুরোধ শুধুমাত্র প্রকৃত চিকিৎসাজনিত প্রয়োজনেই পোস্ট করা যাবে। ভুয়া অনুরোধ পোস্ট করা, স্প্যামিং বা রক্তদাতাদের অকারণে বিরক্ত করা সম্পূর্ণ নিষিদ্ধ। অপব্যবহারকারী অ্যাকাউন্ট তৎক্ষণাৎ আজীবনের জন্য ব্লক করা হবে।'
                  : 'Emergency broadcast requests must only be created for genuine medical emergencies. False calls, pranks, spamming, harassment of voluntary donors, or redundant requests result in instant account termination and blacklist enforcement.'}
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                {language === 'bn' ? '৪. মেডিকেল ও আইনি দায়মুক্তি' : '4. Medical & Legal Disclaimer'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'দারুণ ডোনার্স কোনো হাসপাতাল বা ব্লাড ব্যাংক নয়। রক্ত নেওয়ার আগে উপযুক্ত ডায়াগনস্টিক ল্যাবরেটরিতে ক্রস-ম্যাচিং ও স্ক্রিনিং টেস্ট (এইচআইভি, হেপাটাইটিস ইত্যাদি) নিশ্চিত করা রোগী ও পরিবারের নিজস্ব দায়িত্ব।'
                  : 'Darun Donors is a communication technology bridge, not a medical facility or testing laboratory. Receiving patients, hospitals, and caregivers are solely responsible for conducting certified medical screening, HIV/Hepatitis viral tests, and compatibility cross-matching before transfusion.'}
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                {language === 'bn' ? '৫. অ্যাকাউন্ট নিয়ন্ত্রণ ও মুছে ফেলার অধিকার' : '5. Account Control & Voluntary Deletion'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'যেকোনো নিবন্ধিত রক্তদাতা যেকোনো সময় ড্যাশবোর্ড থেকে নিজের প্রাপ্যতা (Availability) পরিবর্তন করতে পারবেন অথবা চাইলে নিজের অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে পারবেন।'
                  : 'Registered donors retain autonomous ownership of their account. You may toggle availability on/off at any time, edit details, or permanently delete your profile and donation logs whenever you choose.'}
              </p>
            </div>
          </div>
        ) : (
          /* ================= PRIVACY POLICY ================= */
          <div className="space-y-6 text-slate-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
              <Lock className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'গোপনীয়তা ও তথ্য সুরক্ষা নীতি' : 'Privacy & Data Protection Policy'}
                </h2>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {language === 'bn' ? 'আপনার তথ্যের শতভাগ সুরক্ষা নিশ্চিত করতে আমরা প্রতিশ্রুতিবদ্ধ' : 'Protecting donor privacy and patient safety across our network'}
                </span>
              </div>
            </div>

            {/* Privacy Section 1 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-red-500" />
                {language === 'bn' ? '১. আমরা কোন কোন তথ্য সংগ্রহ করি?' : '1. What Information We Collect'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'আমাদের সেবা সুষ্ঠুভাবে পরিচালনার জন্য আমরা সীমিত ও প্রয়োজনীয় তথ্য সংগ্রহ করি:'
                  : 'To facilitate lifesaving blood donations, we collect only strictly essential information:'}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400 text-sm">
                <li>
                  {language === 'bn'
                    ? 'নাম, রক্তের গ্রুপ, জেলা ও উপজেলা (জরুরি প্রয়োজনে রোগীকে নিকটবর্তী রক্তদাতা খুঁজে দিতে)।'
                    : 'Full Name, Blood Group, District, and Upazila (to geo-locate compatible nearby donors).'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'মোবাইল নম্বর (শুধুমাত্র ভেরিফাইড নিবন্ধিত ব্যবহারকারীদের জরুরি যোগাযোগের উদ্দেশ্যে সংরক্ষিত থাকে)।'
                    : 'Contact Phone Number (protected by mandatory authenticated access for patient emergency reach).'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'সর্বশেষ রক্তদানের তারিখ ও মোট রক্তদানের সংখ্যা (রক্তদাতার স্বাস্থ্য সচেতনতা ও কুলডাউন ট্র্যাকিংয়ের জন্য)।'
                    : 'Last donation date & total donation counts (for health cool-down tracking and recognition).'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'গুগল প্রোফাইল আইডি এবং ইমেইল (নিরাপদ পাসওয়ার্ডবিহীন লগইন ও পরিচয় নিশ্চিতকরণের জন্য)।'
                    : 'Google Identity & Email (for frictionless, secure passwordless OAuth authentication).'}
                </li>
              </ul>
            </div>

            {/* Privacy Section 2 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {language === 'bn' ? '২. যোগাযোগ তথ্য সুরক্ষায় বাধ্যতামূলক লগইন' : '2. Contact Protection: Mandatory Login'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'রক্তদাতাদের গোপনীয়তা রক্ষায় কোনো অননুমোদিত বট বা সাধারণ দর্শনার্থী সরাসরি কোনো রক্তদাতার ফোন নম্বর দেখতে পারেন না। শুধুমাত্র যাচাইকৃত নিবন্ধিত ব্যবহারকারীরা লগইন করার পরেই রোগীর জন্য রক্তদাতার ফোন নম্বরে কল করতে পারবেন।'
                  : 'To protect our voluntary donors from spam, telemarketing, and scraping, contact phone numbers are never exposed to public bots or guests. A user must sign in via Google to reveal donor contact channels for emergency requests.'}
              </p>
            </div>

            {/* Privacy Section 3 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                {language === 'bn' ? '৩. তথ্য কি তৃতীয় পক্ষের কাছে বিক্রি করা হয়?' : '3. Zero Data Commercialization'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'না, কখনোই নয়। আমরা ব্যবহারকারীদের কোনো ব্যক্তিগত বা যোগাযোগের তথ্য কোনো বিজ্ঞাপনদাতা, মার্কেটিং কোম্পানি বা তৃতীয় পক্ষের কাছে বিক্রি, ভাড়া বা শেয়ার করি না।'
                  : 'Absolute zero commercialization. We never sell, monetize, rent, or trade donor phone numbers or user metrics to third-party marketing firms, advertisers, or corporate entities.'}
              </p>
            </div>

            {/* Privacy Section 4 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                {language === 'bn' ? '৪. তথ্যের অধিকার ও ডাটা মুছে ফেলা (Right to be Forgotten)' : '4. Right to Erasure & Data Deletion'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'আপনি চাইলে যেকোনো মুহূর্তে আপনার অ্যাকাউন্ট মুছে ফেলে আমাদের ডাটাবেজ থেকে আপনার নাম, ফোন এবং সংশ্লিষ্ট সব তথ্য পুরোপুরি অপসারিত করতে পারেন।'
                  : 'You have full autonomy over your personal data. By accessing your profile dashboard, you can trigger permanent account deletion, wiping your phone number, logs, and profile from active databases instantly.'}
              </p>
            </div>

            {/* Privacy Section 5 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                {language === 'bn' ? '৫. যোগাযোগ ও অভিযোগ' : '5. Privacy Concerns & Inquiries'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn' ? (
                  <>
                    গোপনীয়তা নীতি সম্পর্কে যেকোনো জিজ্ঞাসা থাকলে বা তথ্য সংশোধনের জন্য আমাদের{' '}
                    <Link to="/support" className="text-red-500 font-bold hover:underline">
                      সাপোর্ট পেজ
                    </Link>{' '}
                    থেকে সরাসরি বার্তা পাঠাতে পারেন।
                  </>
                ) : (
                  <>
                    For any questions, security notices, or privacy grievances, please submit an inquiry via our{' '}
                    <Link to="/support" className="text-red-500 font-bold hover:underline">
                      Support Portal
                    </Link>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Footer attribution block */}
        <div className="pt-6 border-t border-slate-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-zinc-500">
          <span>
            {language === 'bn' ? 'দারুণ টেক লিমিটেড কর্তৃক পরিচালিত' : 'Governed by Darun Tech Private Limited'}
          </span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-red-500 font-semibold transition-colors">
              {language === 'bn' ? 'হোমপেজ' : 'Home'}
            </Link>
            <Link to="/support" className="hover:text-red-500 font-semibold transition-colors">
              {language === 'bn' ? 'সাহায্য ও যোগাযোগ' : 'Help & Support'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
