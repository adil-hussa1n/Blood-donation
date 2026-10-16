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
                  {language === 'bn' ? 'সেবার নিয়মাবলী ও ব্যবহারের শর্তসমূহ' : 'Terms and Conditions of Service'}
                </h2>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {language === 'bn' ? 'সর্বশেষ সংস্করণ: অক্টোবর ২০২৬ | দারুন ডোনার্স (daruntech.com)' : 'Last Updated: October 2026 | Darun Donors (daruntech.com)'}
                </span>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                {language === 'bn' ? '১. অলাভজনক, মানবিক ও স্বেচ্ছাসেবী উদ্দেশ্য' : '1. Non-Profit, Voluntary & Humanitarian Mandate'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'দারুণ ডোনার্স (Darun Donors) একটি সম্পূর্ণ অলাভজনক, মানবিক ও প্রযুক্তিভিত্তিক স্বেচ্ছাসেবী নেটওয়ার্ক। এই প্ল্যাটফর্মের একমাত্র উদ্দেশ্য হলো জরুরি রক্তের প্রয়োজনে রোগী এবং আগ্রহী রক্তদাতার মাঝে দ্রুত যোগাযোগ স্থাপন করিয়ে দেওয়া। রক্ত কেনাবেচা, কোনো প্রকার পারিশ্রমিক দাবি করা, মধ্যস্বত্বভোগী বা দালালি কার্যক্রম বাংলাদেশ আইন ও আমাদের নীতি অনুযায়ী কঠোরভাবে নিষিদ্ধ এবং দণ্ডনীয় অপরাধ।'
                  : 'Darun Donors operates strictly as an autonomous, non-profit humanitarian communication network. Its sole purpose is facilitating rapid, direct contact between hospital patients in critical need and voluntary, non-remunerated blood donors. The commercial sale, solicitation, purchase, brokerage, or monetary exchange of human blood or blood components is strictly prohibited and constitutes a criminal offense under applicable laws.'}
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {language === 'bn' ? '২. রক্তদাতার যোগ্যতা, সত্যতা ও সম্মতি' : '2. Donor Eligibility, Accuracy & Voluntary Consent'}
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400 text-sm">
                <li>
                  {language === 'bn'
                    ? 'রক্তদাতা হিসেবে নিবন্ধিত হতে হলে বয়স ন্যূনতম ১৮ বছর এবং শারীরিক ও মানসিকভাবে সুস্থ হতে হবে।'
                    : 'Donors must be at least 18 years of age and in sound physical and mental health to register.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'নিবন্ধনের সময় নাম, মোবাইল নম্বর, রক্তের গ্রুপ এবং অবস্থান (বিভাগ/উপজেলা) সংক্রান্ত শতভাগ নির্ভুল তথ্য প্রদান করতে হবে। কোনো অসত্য বা বিভ্রান্তিকর তথ্য প্রদান করা যাবে না।'
                    : 'All registration data including legal name, contact telephone, certified blood group, and location must be completely true, accurate, and kept up to date.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'চিকিৎসা বিজ্ঞান অনুযায়ী রক্তদানের ন্যূনতম ৯০ দিনের বিরতিকাল (Cooldown Period) মানা আবশ্যক। রক্তদানের পর ড্যাশবোর্ডে শেষ রক্তদানের তারিখ আপডেট করা রক্তদাতার দায়িত্ব।'
                    : 'Donors agree to honor the standard clinical cooldown interval (minimum 90 days between donations). Updating last donation dates in your profile ensures safe health intervals.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'প্ল্যাটফর্মে নিবন্ধনের মাধ্যমে রক্তদাতা নিশ্চিত করছেন যে তিনি স্বেচ্ছায় ও নিজের ইচ্ছায় যোগাযোগযোগ্য তালিকায় অন্তর্ভুক্ত হয়েছেন।'
                    : 'By registering, donors freely consent to be listed in our voluntary directory and understand that verified users in emergency need may contact them for blood donation.'}
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                {language === 'bn' ? '৩. জরুরি রক্তের অনুরোধ ও প্ল্যাটফর্মের ব্যবহারবিধি' : '3. Emergency Requests & Community Code of Conduct'}
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400 text-sm">
                <li>
                  {language === 'bn'
                    ? 'জরুরি রক্তের অনুরোধ শুধুমাত্র প্রকৃত চিকিৎসাজনিত ও হাসপাতালে ভর্তি রোগীর জন্যই পোস্ট করা যাবে।'
                    : 'Emergency blood broadcast requests must strictly correspond to genuine medical emergencies and hospitalized patient needs.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'ভুয়া অনুরোধ, প্র্যাঙ্ক কল, কোনো রক্তদাতাকে অযথা বা অসময়ে হয়রানি করা, অশালীন আচরণ অথবা কমার্শিয়াল বা রাজনৈতিক উদ্দেশ্যে প্ল্যাটফর্মের ব্যবহার সম্পূর্ণ নিষিদ্ধ।'
                    : 'Fraudulent requests, harassment, commercial solicitation, repeated inappropriate calls, or bad-faith behavior will result in instant account ban, blacklisting, and potential legal referral.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'রক্তের প্রয়োজন পূরণ হয়ে গেলে অথবা বিকল্প ব্যবস্থা হয়ে গেলে অনুগ্রহ করে রক্তের অনুরোধটি বন্ধ বা মার্ক করুন, যাতে ডোনারদের অহেতুক ব্যস্ত রাখা না হয়।'
                    : 'Attendants must close or resolve blood requests once requirements have been met to avoid placing unnecessary communication strain on volunteers.'}
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                {language === 'bn' ? '৪. মেডিকেল স্ক্রিনিং, ল্যাবরেটরি টেস্ট ও আইনি দায়মুক্তি' : '4. Medical Screening, Laboratory Testing & Limitation of Liability'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'দারুণ ডোনার্স কোনো হাসপাতাল, ক্লিনিক, ব্লাড ব্যাংক কিংবা রক্ত প্রক্রিয়াকরণ ল্যাবরেটরি নয়। এটি শুধুমাত্র রক্তদাতা ও গ্রহীতার মাঝে একটি যোগাযোগ সেতু। রক্ত গ্রহণ ও সঞ্চালনের পূর্বে নিবন্ধিত হাসপাতাল বা উপযুক্ত প্যাথলজি ল্যাবরেটরিতে ক্রস-ম্যাচিং (Cross-matching) এবং বাধ্যতামূলক রক্তবাহিত রোগ স্ক্রিনিং (যেমন: HIV, Hepatitis B & C, Syphilis, Malaria ইত্যাদি) নিশ্চিত করা সম্পূর্ণভাবে রোগী, রোগীর পরিবার এবং সংশ্লিষ্ট হাসপাতালের নিজস্ব দায়িত্ব। কোনো শারীরিক জটিলতা, চিকিৎসাগত অসঙ্গতি বা ব্যক্তিগত মতবিরোধের জন্য দারুণ ডোনার্স বা এর পরিচালনাকারী কর্তৃপক্ষ কোনো অবস্থাতেই আইনি বা আর্থিকভাবে দায়ী থাকবে না।'
                  : 'Darun Donors is exclusively a technological communication medium and NOT a hospital, blood bank, clinical laboratory, or blood storage facility. We do not inspect donor health, perform phlebotomy, or physically screen blood. The patient, attending physicians, and hospital are solely responsible for conducting mandatory medical screenings, HIV/HBV/HCV/Syphilis/Malaria testing, and laboratory cross-matching prior to transfusion. Darun Donors and its operators disclaim all liability for any medical outcomes, physical injuries, transfusion-related reactions, or disputes arising between users.'}
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                {language === 'bn' ? '৫. প্ল্যাটফর্মের নিরাপত্তা, অপব্যবহার প্রতিরোধ ও রেট লিমিটিং' : '5. Platform Security, Anti-Abuse & Rate Limiting'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'প্ল্যাটফর্মের স্বাভাবিক কার্যকারিতা বজায় রাখতে এবং ডোনারদের ব্যক্তিগত নম্বর ও তথ্য সুরক্ষিত রাখতে আমরা স্বয়ংক্রিয় অ্যান্টি-স্ক্র্যাপিং, রেট লিমিটিং (DDoS প্রতিরোধক ব্যবস্থা) এবং কড়া এক্সেস কন্ট্রোল বজায় রাখি। স্ক্রিপ্ট বা স্বয়ংক্রিয় বট চালিয়ে কোনো তথ্য হাতিয়ে নেওয়ার অপচেষ্টা শনাক্ত হওয়া মাত্রই আইপি ব্লক করা হবে।'
                  : 'To safeguard user security and system availability, automated rate limiters, anti-bot protections, and request throttling are actively enforced across our API endpoints. Unauthorized automated crawling, scraping, vulnerability scanning, or abuse of donor directory endpoints is strictly prohibited and subject to immediate IP blacklisting.'}
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                {language === 'bn' ? '৬. অ্যাকাউন্ট নিয়ন্ত্রণ, তথ্য হালনাগাদ ও মুছে ফেলার অধিকার' : '6. Account Sovereignty, Modification & Termination'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'নিবন্ধিত ডোনারদের তাদের নিজস্ব প্রোফাইলের ওপর পূর্ণ নিয়ন্ত্রণ রয়েছে। আপনি যেকোনো সময় নিজের প্রাপ্যতা (Available/Unavailable) পরিবর্তন করতে পারেন এবং প্রয়োজন মনে করলে যেকোনো সময় প্রোফাইল থেকে অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার আবেদন করতে পারেন।'
                  : 'Users maintain autonomous control over their personal accounts. You may toggle availability status, update contact data, or trigger permanent account deletion at any time through your dashboard.'}
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
                  {language === 'bn' ? 'আপনার ব্যক্তিগত তথ্যের নিরাপত্তা ও সুরক্ষায় আমাদের স্পষ্ট অঙ্গীকার' : 'Our Comprehensive Commitment to Data Safety, Transparency & User Privacy'}
                </span>
              </div>
            </div>

            {/* Privacy Section 1 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-red-500" />
                {language === 'bn' ? '১. সংগৃহীত তথ্যাবলী (Information We Collect)' : '1. Information We Collect'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'স্বেচ্ছাসেবী রক্তদান সেবা নির্বিঘ্নে পরিচালনা করতে আমরা ন্যূনতম প্রয়োজনীয় তথ্য সংগ্রহ করি:'
                  : 'To coordinate emergency lifesaving blood donations effectively, we collect only necessary and proportionate information:'}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400 text-sm">
                <li>
                  {language === 'bn'
                    ? 'নাম, রক্তের গ্রুপ, বিভাগ, জেলা ও উপজেলা (রোগীর নিকটস্থ সামঞ্জস্যপূর্ণ ডোনার খুঁজে বের করতে)।'
                    : 'Full Name, Blood Group, Division, District, and Upazila (to identify geographically compatible donors).'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'মোবাইল ফোন নম্বর (শুধুমাত্র যাচাইকৃত ও নিবন্ধিত ব্যবহারকারীদের জরুরি মুহূর্তে যোগাযোগের জন্য সংরক্ষিত থাকে)।'
                    : 'Mobile Phone Number (gated strictly behind authenticated access to prevent scrapers and public spam).'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'সর্বশেষ রক্তদানের তারিখ ও মোট রক্তদানের সংখ্যা (চিকিৎসাগত কুলডাউন বিরতি ট্র্যাকিং ও স্বীকৃতি প্রদানের জন্য)।'
                    : 'Last Donation Date & Counts (to automatically manage the 90-day clinical rest cooldown).'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'অ্যাকাউন্ট ভেরিফিকেশন তথ্য (গুগল সাইন-ইন বা ফোন ওটিপি আইডি যা পাসওয়ার্ডবিহীন নিরাপদ লগইনের জন্য ব্যবহৃত হয়)।'
                    : 'Authentication Identity (Google OAuth ID / Phone credentials for secure, authenticated access).'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'ওয়েব পুশ সাবস্ক্রিপশন ডাটা (জরুরি রক্তের আবেদনের নোটিফিকেশন পৌঁছে দেওয়ার জন্য ক্রিপ্টোগ্রাফিক পুশ টোকেন)।'
                    : 'Push Notification Subscriptions (cryptographic endpoint tokens to deliver instant emergency requests to your device).'}
                </li>
              </ul>
            </div>

            {/* Privacy Section 2 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {language === 'bn' ? '২. যোগাযোগ তথ্যের সুরক্ষা ও বাধ্যতামূলক সাইন-ইন' : '2. Contact Privacy: Mandatory Authentication Protection'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'রক্তদাতাদের ফোন নম্বর কোনো বহিরাগত বা পাবলিক সার্চ ইঞ্জিনে উন্মুক্ত থাকে না। রক্তদাতার ফোন নম্বর দেখতে হলে একজন ব্যবহারকারীকে অবশ্যই লগইন করতে হবে। এর ফলে স্বয়ংক্রিয় বট, টেলি-মার্কেটিং কোম্পানি বা অবাঞ্ছিত ব্যক্তিদের স্প্যামিং থেকে ডোনারদের ফোন নম্বর শতভাগ সুরক্ষিত থাকে।'
                  : 'Volunteer phone numbers are strictly concealed from public guests, automated search engines, and web scrapers. A user must sign in securely before phone numbers can be revealed for genuine patient communication. This architecture eliminates unwanted telemarketing, automated voice blasts, and mass harvesting of donor contact lists.'}
              </p>
            </div>

            {/* Privacy Section 3 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                {language === 'bn' ? '৩. তথ্য কোনো অবস্থাতেই বিক্রয় বা বাণিজ্যিক ব্যবহার নয়' : '3. Absolute Zero Commercialization of Personal Data'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'আমরা ব্যবহারকারীদের কোনো ব্যক্তিগত বা যোগাযোগের তথ্য কোনো বিজ্ঞাপনদাতা, মার্কেটিং কোম্পানি বা তৃতীয় পক্ষের কাছে কখনোই বিক্রি, ভাড়া বা শেয়ার করি না। আপনার রক্তদানের তথ্য কেবল মুমূর্ষু রোগীর জীবন বাঁচানোর পবিত্র উদ্দেশ্যেই সংরক্ষিত থাকে।'
                  : 'We maintain a strict zero-commercialization guarantee. We never sell, rent, monetize, broker, or license donor contact directories, personal records, or usage metrics to any commercial advertisers or data brokers.'}
              </p>
            </div>

            {/* Privacy Section 4 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500" />
                {language === 'bn' ? '৪. অ্যানালিটিক্স, বিজ্ঞাপন ও কুকিজ নীতি (Cookies & Analytics)' : '4. Third-Party Services, Cookies & Digital Analytics'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'প্ল্যাটফর্মের কার্যক্ষমতা পর্যালোচনা ও সার্ভার পরিচালনার ব্যয় নির্বাহে সহায়তার জন্য আমরা বিশ্বস্ত থার্ড-পার্টি সেবা যেমন Google AdSense ও Meta Pixel ব্যবহার করতে পারি। এসব সেবা ব্রাউজারে স্ট্যান্ডার্ড কুকিজ (Cookies) ও অ্যানোনিমাস ট্র্যাকার ব্যবহার করে প্ল্যাটফর্মের ভিজিটর পরিসংখ্যান এবং প্রাসঙ্গিক বিজ্ঞাপন প্রদর্শন করতে পারে। আপনি চাইলে আপনার ব্রাউজার সেটিংস থেকে যেকোনো সময় কুকিজ নিষ্ক্রিয় করতে পারেন।'
                  : 'To monitor platform reliability and offset non-profit hosting and infrastructure costs, our website may integrate certified third-party services such as Google AdSense and Meta Pixel. These services utilize standard browser cookies and non-personally identifiable analytical identifiers to display contextual information and measure web traffic. Users may freely adjust their browser preferences to control, decline, or purge cookies at any time.'}
              </p>
            </div>

            {/* Privacy Section 5 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-500" />
                {language === 'bn' ? '৫. জরুরি পুশ নোটিফিকেশন সুবিধা' : '5. Web Push Notification Handling'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'যদি আপনি পুশ নোটিফিকেশন গ্রহণ করার অনুমতি প্রদান করেন, তবে আমরা আপনার ব্রাউজারের স্ট্যান্ডার্ড এনক্রিপ্টেড সাবস্ক্রিপশন টোকেন সংরক্ষণ করি। এটি কেবল আপনার এলাকার জরুরি রক্তের রিকোয়েস্ট আপনাকে দ্রুত পৌঁছাতে ব্যবহৃত হয়। আপনি যেকোনো সময় আপনার ব্রাউজার সেটিংস থেকে এই অনুমতি প্রত্যাহার করতে পারেন।'
                  : 'If you opt in to receive emergency blood broadcast notifications, our servers securely store an encrypted web push subscription endpoint for your browser. This token is used solely to deliver real-time emergency requests for your blood group and region. You may revoke push notification permissions anytime via your browser settings.'}
              </p>
            </div>

            {/* Privacy Section 6 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-rose-500" />
                {language === 'bn' ? '৬. তথ্য মুছে ফেলা ও অধিকার (Right to Erasure)' : '6. Right to Erasure & Data Deletion'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'আপনার তথ্যের ওপর আপনার পূর্ণ অধিকার রয়েছে। আপনি যেকোনো সময় প্রোফাইল ড্যাশবোর্ড থেকে আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার মাধ্যমে ডাটাবেজ থেকে আপনার নাম, ফোন নম্বর ও সকল ব্যক্তিগত বিবরণ চিরতরে মুছে ফেলতে পারেন।'
                  : 'Under the standard principle of user data sovereignty, you have the right to inspect, update, or completely erase your profile. Triggering account deletion from your dashboard permanently wipes your contact details, active listings, and associated data from our production databases.'}
              </p>
            </div>

            {/* Privacy Section 7 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                {language === 'bn' ? '৭. যোগাযোগ, অভিযোগ ও নিরাপত্তা সংক্রান্ত জিজ্ঞাসা' : '7. Privacy Inquiries, Security Notices & Contact'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn' ? (
                  <>
                    আমাদের গোপনীয়তা ও শর্তাবলী সংক্রান্ত যেকোনো প্রশ্ন, পরামর্শ বা অভিযোগ জানাতে আমাদের{' '}
                    <Link to="/support" className="text-red-500 font-bold hover:underline">
                      সাপোর্ট পেজ
                    </Link>{' '}
                    থেকে যোগাযোগ করুন। আমাদের টেকনিক্যাল টিম বিষয়টি সর্বোচ্চ গুরুত্বের সাথে সমাধান করবে।
                  </>
                ) : (
                  <>
                    For any inquiries, data protection requests, or security notices regarding this policy, please reach out directly through our{' '}
                    <Link to="/support" className="text-red-500 font-bold hover:underline">
                      Help & Support Center
                    </Link>
                    . Our administrative team will address your concern promptly.
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
