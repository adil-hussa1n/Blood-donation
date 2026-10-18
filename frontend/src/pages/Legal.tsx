import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  Heart,
  Lock,
  AlertCircle,
  Eye,
  RefreshCw,
  Mail,
  Smartphone,
  Apple,
  Monitor,
  Laptop,
  Download,
  Share2,
  MoreVertical,
  PlusSquare,
  Sparkles,
  ArrowRight,
  Shield,
  PhoneOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';

type LegalTab = 'terms' | 'privacy' | 'install';

export default function Legal() {
  const { language, t } = useApp();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<LegalTab>('terms');
  const [activeDevicePlatform, setActiveDevicePlatform] = useState<'android' | 'ios' | 'windows' | 'mac'>('android');

  // Automatically activate the correct tab based on current URL path
  useEffect(() => {
    if (location.pathname === '/privacy') {
      setActiveTab('privacy');
    } else if (location.pathname === '/terms') {
      setActiveTab('terms');
    } else if (location.pathname === '/install' || location.pathname === '/manual' || location.pathname === '/pwa') {
      setActiveTab('install');
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const handleTabChange = (tab: LegalTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
          {activeTab === 'install' ? (
            <Download className="w-8 h-8" />
          ) : (
            <ShieldCheck className="w-8 h-8" />
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {activeTab === 'install'
            ? language === 'bn'
              ? 'ওয়েব অ্যাপ ইনস্টল ও ব্যবহার ম্যানুয়াল'
              : 'Web App User Installation Manual'
            : language === 'bn'
            ? 'শর্তাবলী, গোপনীয়তা ও ব্যবহার নির্দেশিকা'
            : 'Terms, Privacy & User Manual'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-xl mx-auto">
          {activeTab === 'install'
            ? language === 'bn'
              ? 'অ্যান্ড্রয়েড, আইওএস (iPhone/iPad), উইন্ডোজ এবং ম্যাক ডিভাইসে দারুণ ডোনার্স ইনস্টল করে একটি স্বয়ংসম্পূর্ণ অ্যাপের মতো ব্যবহারের ধাপে ধাপে নির্দেশিকা।'
              : 'Step-by-step instructions for installing and running Darun Donors as a fast, native-like Progressive Web App on Android, iOS, Windows, and macOS.'
            : language === 'bn'
            ? 'দারুণ ডোনার্স প্ল্যাটফর্ম ব্যবহারের নিয়মাবলী, রক্তদাতার তথ্যের সুরক্ষা ও দায়িত্বশীল ব্যবহারের স্পষ্ট অঙ্গীকার।'
            : 'Comprehensive operational guidelines, voluntary donor protection, and our steadfast commitment to privacy.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 max-w-lg mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => handleTabChange('terms')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'terms'
              ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>{language === 'bn' ? 'শর্তাবলী' : 'Terms'}</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('privacy')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Lock className="w-4 h-4 shrink-0" />
          <span>{language === 'bn' ? 'গোপনীয়তা' : 'Privacy'}</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('install')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'install'
              ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{language === 'bn' ? 'অ্যাপ গাইড' : 'App Guide'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden border border-slate-200/60 dark:border-zinc-800/60 shadow-xl">
        {activeTab === 'terms' && (
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
                <PhoneOff className="w-4 h-4 text-red-500" />
                {language === 'bn' ? '৫. অপ্রাপ্য (Unavailable) ডোনারদের অধিকার ও যোগাযোগ তথ্য গোপনীয়তা' : '5. Unavailable Donor Rights & Phone Number Masking'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'রক্তদাতাদের মানসিক শান্তি ও বিশ্রাম নিশ্চিত করতে আমরা কঠোর অনুপলব্ধতা নীতি মেনে চলি। কোনো রক্তদাতা যখন তার প্রাপ্যতা "Unavailable" বা অপ্রাপ্য হিসেবে সেট করেন, তখন প্ল্যাটফর্ম তার ফোন নম্বর ও ডিরেক্ট কল বোতাম স্বয়ংক্রিয়ভাবে লুকিয়ে রাখে। অপ্রাপ্য থাকাকালীন কোনো ডোনারকে কল করার চেষ্টা করা বা ব্যক্তিগত পর্যায়ে বিরক্ত করা নীতিমালার স্পষ্ট লঙ্ঘন।'
                  : 'To respect volunteer rest and recovery, donors marked as "Unavailable" have their phone numbers and direct call capabilities completely masked across the platform. Calling, pressuring, or harvesting contacts of inactive or resting donors violates our terms and will lead to an immediate ban.'}
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                {language === 'bn' ? '৬. প্ল্যাটফর্মের নিরাপত্তা, অপব্যবহার প্রতিরোধ ও রেট লিমিটিং' : '6. Platform Security, Anti-Abuse & Rate Limiting'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'প্ল্যাটফর্মের স্বাভাবিক কার্যকারিতা বজায় রাখতে এবং ডোনারদের ব্যক্তিগত নম্বর ও তথ্য সুরক্ষিত রাখতে আমরা স্বয়ংক্রিয় অ্যান্টি-স্ক্র্যাপিং, রেট লিমিটিং (DDoS প্রতিরোধক ব্যবস্থা) এবং কড়া এক্সেস কন্ট্রোল বজায় রাখি। স্ক্রিপ্ট বা স্বয়ংক্রিয় বট চালিয়ে কোনো তথ্য হাতিয়ে নেওয়ার অপচেষ্টা শনাক্ত হওয়া মাত্রই আইপি ব্লক করা হবে।'
                  : 'To safeguard user security and system availability, automated rate limiters, anti-bot protections, and request throttling are actively enforced across our API endpoints. Unauthorized automated crawling, scraping, vulnerability scanning, or abuse of donor directory endpoints is strictly prohibited and subject to immediate IP blacklisting.'}
              </p>
            </div>

            {/* Section 7 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                {language === 'bn' ? '৭. অ্যাকাউন্ট নিয়ন্ত্রণ, তথ্য হালনাগাদ ও মুছে ফেলার অধিকার' : '7. Account Sovereignty, Modification & Termination'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'নিবন্ধিত ডোনারদের তাদের নিজস্ব প্রোফাইলের ওপর পূর্ণ নিয়ন্ত্রণ রয়েছে। আপনি যেকোনো সময় নিজের প্রাপ্যতা (Available/Unavailable) পরিবর্তন করতে পারেন এবং প্রয়োজন মনে করলে যেকোনো সময় প্রোফাইল থেকে অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার আবেদন করতে পারেন।'
                  : 'Users maintain autonomous control over their personal accounts. You may toggle availability status, update contact data, or trigger permanent account deletion at any time through your dashboard.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
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
                    ? 'পেশা / পদবী এবং শিক্ষা প্রতিষ্ঠান বা কর্মস্থলের তথ্য (স্বেচ্ছাসেবী নেটওয়ার্কের বিশ্বাসযোগ্যতা বৃদ্ধি করতে)।'
                    : 'Designation / Profession and Educational Institution or Workplace (to enhance network trust and community relevance).'}
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
                <PhoneOff className="w-4 h-4 text-amber-500" />
                {language === 'bn' ? '৩. অপ্রাপ্য ডোনারদের নম্বর মাস্কিং ও প্রাইভেসি গার্ড' : '3. Privacy Guard & Contact Masking for Resting Donors'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'কোনো ডোনার তার স্ট্যাটাস যখন অপ্রাপ্য (Unavailable) রাখেন, তখন সিস্টেমে তার যোগাযোগের নম্বর প্রদর্শন পুরোপুরি বন্ধ থাকে। রক্তদানের বিরতিকালে অথবা ব্যক্তিগত বিশ্রামের সময় ডোনারকে অযথা কল পাওয়া থেকে বাঁচাতে এই নিরাপত্তা স্তরটি স্বয়ংক্রিয়ভাবে সক্রিয় থাকে।'
                  : 'Whenever a volunteer donor marks their availability status as "Unavailable", our user interface automatically conceals the telephone number and disables call buttons. This guarantees uninterrupted personal rest during the mandatory 90-day biological donation cooldown.'}
              </p>
            </div>

            {/* Privacy Section 4 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                {language === 'bn' ? '৪. তথ্য কোনো অবস্থাতেই বিক্রয় বা বাণিজ্যিক ব্যবহার নয়' : '4. Absolute Zero Commercialization of Personal Data'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'আমরা ব্যবহারকারীদের কোনো ব্যক্তিগত বা যোগাযোগের তথ্য কোনো বিজ্ঞাপনদাতা, মার্কেটিং কোম্পানি বা তৃতীয় পক্ষের কাছে কখনোই বিক্রি, ভাড়া বা শেয়ার করি না। আপনার রক্তদানের তথ্য কেবল মুমূর্ষু রোগীর জীবন বাঁচানোর পবিত্র উদ্দেশ্যেই সংরক্ষিত থাকে।'
                  : 'We maintain a strict zero-commercialization guarantee. We never sell, rent, monetize, broker, or license donor contact directories, personal records, or usage metrics to any commercial advertisers or data brokers.'}
              </p>
            </div>

            {/* Privacy Section 5 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500" />
                {language === 'bn' ? '৫. অ্যানালিটিক্স, বিজ্ঞাপন ও কুকিজ নীতি (Cookies & Analytics)' : '5. Third-Party Services, Cookies & Digital Analytics'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'প্ল্যাটফর্মের কার্যক্ষমতা পর্যালোচনা ও সার্ভার পরিচালনার ব্যয় নির্বাহে সহায়তার জন্য আমরা বিশ্বস্ত থার্ড-পার্টি সেবা যেমন Google AdSense ও Meta Pixel ব্যবহার করতে পারি। এসব সেবা ব্রাউজারে স্ট্যান্ডার্ড কুকিজ (Cookies) ও অ্যানোনিমাস ট্র্যাকার ব্যবহার করে প্ল্যাটফর্মের ভিজিটর পরিসংখ্যান এবং প্রাসঙ্গিক বিজ্ঞাপন প্রদর্শন করতে পারে। আপনি চাইলে আপনার ব্রাউজার সেটিংস থেকে যেকোনো সময় কুকিজ নিষ্ক্রিয় করতে পারেন।'
                  : 'To monitor platform reliability and offset non-profit hosting and infrastructure costs, our website may integrate certified third-party services such as Google AdSense and Meta Pixel. These services utilize standard browser cookies and non-personally identifiable analytical identifiers to display contextual information and measure web traffic. Users may freely adjust their browser preferences to control, decline, or purge cookies at any time.'}
              </p>
            </div>

            {/* Privacy Section 6 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-500" />
                {language === 'bn' ? '৬. জরুরি পুশ নোটিফিকেশন সুবিধা' : '6. Web Push Notification Handling'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'যদি আপনি পুশ নোটিফিকেশন গ্রহণ করার অনুমতি প্রদান করেন, তবে আমরা আপনার ব্রাউজারের স্ট্যান্ডার্ড এনক্রিপ্টেড সাবস্ক্রিপশন টোকেন সংরক্ষণ করি। এটি কেবল আপনার এলাকার জরুরি রক্তের রিকোয়েস্ট আপনাকে দ্রুত পৌঁছাতে ব্যবহৃত হয়। আপনি যেকোনো সময় আপনার ব্রাউজার সেটিংস থেকে এই অনুমতি প্রত্যাহার করতে পারেন।'
                  : 'If you opt in to receive emergency blood broadcast notifications, our servers securely store an encrypted web push subscription endpoint for your browser. This token is used solely to deliver real-time emergency requests for your blood group and region. You may revoke push notification permissions anytime via your browser settings.'}
              </p>
            </div>

            {/* Privacy Section 7 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-rose-500" />
                {language === 'bn' ? '৭. তথ্য মুছে ফেলা ও অধিকার (Right to Erasure)' : '7. Right to Erasure & Data Deletion'}
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm">
                {language === 'bn'
                  ? 'আপনার তথ্যের ওপর আপনার পূর্ণ অধিকার রয়েছে। আপনি যেকোনো সময় প্রোফাইল ড্যাশবোর্ড থেকে আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার মাধ্যমে ডাটাবেজ থেকে আপনার নাম, ফোন নম্বর ও সকল ব্যক্তিগত বিবরণ চিরতরে মুছে ফেলতে পারেন।'
                  : 'Under the standard principle of user data sovereignty, you have the right to inspect, update, or completely erase your profile. Triggering account deletion from your dashboard permanently wipes your contact details, active listings, and associated data from our production databases.'}
              </p>
            </div>

            {/* Privacy Section 8 */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                {language === 'bn' ? '৮. যোগাযোগ, অভিযোগ ও নিরাপত্তা সংক্রান্ত জিজ্ঞাসা' : '8. Privacy Inquiries, Security Notices & Contact'}
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

        {activeTab === 'install' && (
          /* ================= PWA / WEB APP INSTALLATION MANUAL ================= */
          <div className="space-y-8 text-slate-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
              <Download className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ওয়েব অ্যাপ ইনস্টলেশন ও ব্যবহার নির্দেশিকা' : 'Progressive Web App (PWA) Installation Manual'}
                </h2>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {language === 'bn'
                    ? 'প্লেস্টোর বা অ্যাপ স্টোর ছাড়া সরাসরি যেকোনো ডিভাইসে দ্রুত ইনস্টল করুন'
                    : 'Install directly on any device without Play Store or App Store'}
                </span>
              </div>
            </div>

            {/* Benefit Highlight banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-500/10 via-rose-500/10 to-amber-500/10 border border-red-500/20 text-slate-800 dark:text-zinc-200 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 p-1.5 shadow-md shrink-0 border border-red-500/20 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Darun Donors App"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {language === 'bn' ? 'কেন ওয়েব অ্যাপ ইনস্টল করবেন?' : 'Why Install the Darun Donors Web App?'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  {language === 'bn'
                    ? '১ সেকেন্ডেরও কম সময়ে ওপেন হয়, কোনো স্টোরেজ খরচ হয় না, অফলাইনেও চালু থাকে এবং ব্যাকগ্রাউন্ডে জরুরি রক্তের লাইভ পুশ নোটিফিকেশন পাওয়া যায়।'
                    : 'Lightning-fast 1-click launch from your home screen, zero phone storage consumed, offline-ready caching, and instant emergency blood push alerts.'}
                </p>
              </div>
            </div>

            {/* Platform Selector Buttons */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {language === 'bn' ? 'আপনার অপারেটিং সিস্টেম নির্বাচন করুন:' : 'Select Your Device / Operating System:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Android */}
                <button
                  type="button"
                  onClick={() => setActiveDevicePlatform('android')}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeDevicePlatform === 'android'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="text-xs sm:text-sm font-black">Android</span>
                  <span className="text-[10px] font-semibold opacity-75">Chrome / Edge</span>
                </button>

                {/* iOS */}
                <button
                  type="button"
                  onClick={() => setActiveDevicePlatform('ios')}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeDevicePlatform === 'ios'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Apple className="w-6 h-6" />
                  <span className="text-xs sm:text-sm font-black">iPhone / iPad</span>
                  <span className="text-[10px] font-semibold opacity-75">Safari (iOS)</span>
                </button>

                {/* Windows */}
                <button
                  type="button"
                  onClick={() => setActiveDevicePlatform('windows')}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeDevicePlatform === 'windows'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Monitor className="w-6 h-6" />
                  <span className="text-xs sm:text-sm font-black">Windows</span>
                  <span className="text-[10px] font-semibold opacity-75">Chrome / Edge</span>
                </button>

                {/* macOS */}
                <button
                  type="button"
                  onClick={() => setActiveDevicePlatform('mac')}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeDevicePlatform === 'mac'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-md ring-2 ring-purple-500/20'
                      : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Laptop className="w-6 h-6" />
                  <span className="text-xs sm:text-sm font-black">macOS</span>
                  <span className="text-[10px] font-semibold opacity-75">Safari / Chrome</span>
                </button>
              </div>
            </div>

            {/* Platform Guides */}
            <div className="pt-2">
              {/* --- ANDROID INSTRUCTIONS --- */}
              {activeDevicePlatform === 'android' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <Smartphone className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {language === 'bn'
                        ? 'অ্যান্ড্রয়েড ফোন বা ট্যাবলেটে ইনস্টল করার নিয়ম (Google Chrome / Samsung Internet)'
                        : 'Android Phone & Tablet Instructions (Google Chrome or Samsung Internet)'}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {/* Step 1 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn' ? 'ওয়েবসাইটে প্রবেশ করুন' : 'Open in Google Chrome'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'আপনার অ্যান্ড্রয়েড ফোনের গুগল ক্রোম (Google Chrome) ব্রাউজারে darun-donors বা আমাদের ওয়েবসাইট লিঙ্কটি ওপেন করুন।'
                            : 'Open our platform link inside Google Chrome or Samsung Internet on your Android device.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        2
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{language === 'bn' ? 'মেনু বাটনে ট্যাপ করুন' : 'Tap the Three Dots Menu'}</span>
                          <span className="p-1 rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 inline-flex">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </span>
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'ব্রাউজারের ওপরের ডান কোণায় থাকা তিনটি ডট (Three dots: ⋮) মেনু আইকনে ট্যাপ করুন।'
                            : 'Tap the three-dot overflow menu (⋮) located at the top-right corner of Chrome.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        3
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>
                            {language === 'bn'
                              ? '"Install app" অথবা "Add to Home screen" নির্বাচন করুন'
                              : 'Select "Install App" or "Add to Home screen"'}
                          </span>
                          <Download className="w-4 h-4 text-emerald-500" />
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'মেনু থেকে "Install app" (অথবা কিছু ডিভাইসে "Add to Home screen") অপশনে ট্যাপ করুন এবং "Install" বাটনে নিশ্চিত করুন।'
                            : 'From the dropdown menu, select "Install app" (or "Add to Home screen"), then confirm by tapping "Install".'}
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        4
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn' ? 'হোম স্ক্রিন থেকে সরাসরি ব্যবহার করুন' : 'Done! Launch from Your App Drawer'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'কয়েক সেকেন্ডের মধ্যে দারুণ ডোনার্স আইকন আপনার ফোনের হোম স্ক্রিন ও অ্যাপ ড্রয়ারে যুক্ত হয়ে যাবে। সেখান থেকে ট্যাপ করে ফুল-স্ক্রিন মোডে সাধারণ অ্যাপের মতো ব্যবহার করুন।'
                            : 'Within seconds, the Darun Donors red icon will appear on your Home Screen and App Drawer. Tap it to launch full-screen without URL bars.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- IOS (IPHONE / IPAD) INSTRUCTIONS --- */}
              {activeDevicePlatform === 'ios' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 font-bold text-sm">
                    <Apple className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      {language === 'bn'
                        ? 'আইফোন ও আইপ্যাডে ইনস্টল করার নিয়ম (Apple Safari ব্রাউজার)'
                        : 'iPhone & iPad Instructions (Apple Safari Browser)'}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {/* Step 1 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn' ? 'Safari ব্রাউজারে ওপেন করুন' : 'Open in Apple Safari'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'অ্যাপল আইওএস সিস্টেমে পিডব্লিউএ ইনস্টলের জন্য Safari ব্রাউজার ব্যবহার করা আবশ্যক। Safari-তে ওয়েবসাইটটি লোড করুন।'
                            : 'Apple requires Safari for PWA installation on iOS. Open Safari on your iPhone/iPad and navigate to the site.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        2
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{language === 'bn' ? 'Share (শেয়ার) বাটনে চাপ দিন' : 'Tap the Share Button'}</span>
                          <span className="p-1 rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 inline-flex">
                            <Share2 className="w-3.5 h-3.5" />
                          </span>
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'স্ক্রিনের নিচের বারে থাকা Share আইকন (একটি বক্স যার ওপরের দিকে তীর চিহ্ন রয়েছে) চাপ দিন।'
                            : 'Tap the Share button (square icon with an upward-pointing arrow) at the bottom toolbar of Safari.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        3
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>
                            {language === 'bn'
                              ? 'স্ক্রোল করে "Add to Home Screen" এ ট্যাপ করুন'
                              : 'Tap "Add to Home Screen"'}
                          </span>
                          <PlusSquare className="w-4 h-4 text-blue-500" />
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'শেয়ার মেনুর নিচে কিছুটা স্ক্রোল করে "Add to Home Screen" অপশনে ট্যাপ করুন এবং ওপরের ডান কোণায় "Add" বাটনে চাপ দিন।'
                            : 'Scroll down through the share sheet options and tap "Add to Home Screen" (➕), then tap "Add" in the top right.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        4
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn' ? 'আইওএস পুশ নোটিফিকেশন সুবিধা' : 'Native Experience & iOS Web Push'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'আইওএস ১৬.৪+ ভার্সনে হোম স্ক্রিন অ্যাপ হিসেবে ইনস্টল করার পর অ্যাপের ভেতর থেকে নোটিফিকেশন অন করলে সরাসরি লক স্ক্রিনে রক্তের জরুরি নোটিফিকেশন আসবে।'
                            : 'On iOS 16.4+, running Darun Donors as a Home Screen web app enables full lock-screen emergency push notifications.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- WINDOWS INSTRUCTIONS --- */}
              {activeDevicePlatform === 'windows' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-bold text-sm">
                    <Monitor className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {language === 'bn'
                        ? 'উইন্ডোজ পিসি ও ল্যাপটপে ইনস্টল করার নিয়ম (Google Chrome / Microsoft Edge)'
                        : 'Windows PC & Laptop Instructions (Google Chrome or Microsoft Edge)'}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {/* Step 1 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn' ? 'ক্রোম বা এজ ব্রাউজারে প্রবেশ করুন' : 'Open in Chrome or Microsoft Edge'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'আপনার উইন্ডোজ কম্পিউটারে Google Chrome অথবা Microsoft Edge ব্রাউজারে ওয়েবসাইটটি লোড করুন।'
                            : 'Open our platform link in either Google Chrome or Microsoft Edge on your Windows 10/11 desktop or laptop.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        2
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>
                            {language === 'bn'
                              ? 'অ্যাড্রেস বারের ইনস্টল আইকনে ক্লিক করুন'
                              : 'Click the Install Icon in the URL Address Bar'}
                          </span>
                          <Download className="w-4 h-4 text-indigo-500" />
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'ব্রাউজারের অ্যাড্রেস বার (URL bar)-এর একদম ডান পাশে একটি ছোট কম্পিউটার বা ডাউনলোড আইকন ("Install Darun Donors") দেখতে পাবেন, সেখানে ক্লিক করুন।'
                            : 'In the right-hand corner of your browser address bar (URL omnibox), look for the "Install Darun Donors" icon.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        3
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn' ? 'Install বাটনে ক্লিক করুন' : 'Confirm Installation'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'পপ-আপে আসা "Install" বাটনে ক্লিক করুন। আপনি চাইলে উইন্ডোজ টাস্কবারে (Taskbar) বা স্টার্ট মেনুতে পিন করে রাখতে পারেন।'
                            : 'Click "Install" in the modal prompt. You can check "Pin to taskbar" and "Pin to Start" for convenient desktop access.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        4
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn' ? 'স্বতন্ত্র উইন্ডো ও নোটিফিকেশন' : 'Standalone Window with Windows Action Center'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'অ্যাপটি একটি স্বতন্ত্র ডেস্কটপ সফটওয়্যারের মতো চালু হবে এবং উইন্ডোজ নোটিফিকেশন সেন্টারে সরাসরি রক্তের এলার্ট পাঠাতে সক্ষম হবে।'
                            : 'The app launches into its own borderless window and directly pipes emergency donor notifications into your Windows Action Center.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- MACOS INSTRUCTIONS --- */}
              {activeDevicePlatform === 'mac' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 font-bold text-sm">
                    <Laptop className="w-5 h-5 shrink-0 text-purple-600 dark:text-purple-400" />
                    <span>
                      {language === 'bn'
                        ? 'ম্যাক (macOS) এ ইনস্টল করার নিয়ম (Safari / Google Chrome)'
                        : 'Apple macOS Instructions (Safari Sonoma+ or Google Chrome)'}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {/* Method A: Safari Sonoma */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn'
                            ? 'পদ্ধতি ১: Safari-তে "Add to Dock" (macOS Sonoma বা তার পরবর্তী)'
                            : 'Method 1: Apple Safari "Add to Dock" (macOS Sonoma+)'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'Safari ব্রাউজারে সাইটটি ওপেন করে ওপরের মেনু বার থেকে File > "Add to Dock..." সিলেক্ট করুন এবং "Add" বাটনে ক্লিক করুন। এটি আপনার ম্যাক ডকে একটি আইকন যুক্ত করবে।'
                            : 'In Apple Safari, navigate to the site. Click the top macOS menu bar: File > "Add to Dock...", customize the title, and click "Add". The app will appear in your Mac Dock.'}
                        </p>
                      </div>
                    </div>

                    {/* Method B: Chrome for Mac */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        2
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn'
                            ? 'পদ্ধতি ২: Google Chrome / Edge ব্যবহার করে ইনস্টল'
                            : 'Method 2: Google Chrome / Microsoft Edge on macOS'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'Chrome ব্রাউজারে অ্যাড্রেস বারের ডান পাশে ইনস্টল আইকনে ক্লিক করুন অথবা মেনু থেকে Cast, save, and share > "Install Darun Donors" অপশনে ক্লিক করুন।'
                            : 'In Chrome for Mac, click the Install icon in the URL bar, or select Chrome menu (⋮) > "Cast, save, and share" > "Install Darun Donors".'}
                        </p>
                      </div>
                    </div>

                    {/* Benefit */}
                    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800">
                      <div className="w-8 h-8 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        3
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn' ? 'Spotlight সার্চ ও নোটিফিকেশন সেন্টার' : 'Spotlight & macOS Notification Center Integration'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                          {language === 'bn'
                            ? 'ইনস্টল করার পর Command (⌘) + Space চেপে Spotlight দিয়ে তাৎক্ষণিক Darun Donors ওপেন করতে পারবেন এবং সরাসরি ম্যাকের নোটিফিকেশন সেন্টারে এলার্ট পাবেন।'
                            : 'Once added, launch Darun Donors directly from Spotlight Search (⌘ + Space) or Launchpad with full native macOS Notification Center alerts.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick troubleshooting tips */}
            <div className="p-5 rounded-2xl bg-slate-100 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/60 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                {language === 'bn' ? 'জরুরি টিপস ও ট্রাবলশুটিং' : 'Troubleshooting & Notification Tips'}
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                <li>
                  {language === 'bn'
                    ? 'ইনস্টল করার পর প্ল্যাটফর্মের ওপরের বেল (Bell) আইকনে ক্লিক করে "Allow Notifications" অনুমোদন দিন, যাতে জরুরি রক্তের প্রয়োজনে আপনি রিয়েল-টাইম নোটিফিকেশন পান।'
                    : 'After installing, click the Bell notification icon in the header or menu and allow notification permissions so you receive emergency blood alerts.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'যদি অ্যাড্রেস বারে ইনস্টল আইকন দেখতে না পান, তবে নিশ্চিত করুন যে আপনি কোনো ইনকগনিটো (Incognito / Private) ট্যাবে নেই।'
                    : 'If the install button does not appear in your address bar, ensure you are browsing in standard mode rather than Incognito / Private browsing.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'অ্যাপটি যেকোনো সময় আনইনস্টল করতে ব্রাউজারের সেটিংসে গিয়ে Apps ম্যানেজমেন্ট থেকে এক ক্লিকেই মুছে ফেলতে পারবেন।'
                    : 'To uninstall, simply navigate to your browser\'s Settings > Apps or right-click the app icon to remove it.'}
                </li>
              </ul>
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
