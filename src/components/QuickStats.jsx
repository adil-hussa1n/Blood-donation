import React from 'react';
import { Heart, CheckCircle2, Trophy, Flame } from 'lucide-react';
import { calculateDaysSince, useApp } from '../context/AppContext';

export default function QuickStats({ donors, emergencyRequests }) {
  const { language } = useApp();
  const totalDonors = donors.length;

  const availableDonors = donors.filter(d => {
    const days = calculateDaysSince(d.last_donation_date);
    return d.is_available && days >= 90;
  }).length;

  const heroDonors = donors.filter(d => d.total_donations >= 6).length;

  const totalEmergencies = emergencyRequests.length;

  const stats = [
    {
      label: language === 'en' ? 'Registered Donors' : 'নিবন্ধিত রক্তদাতা',
      value: totalDonors,
      icon: Heart,
      color: 'text-red-500 bg-red-500/5 dark:bg-red-500/10 border-red-500/10',
      description: language === 'en' ? 'Total local community donors' : 'মোট রক্তদাতার সংখ্যা'
    },
    {
      label: language === 'en' ? 'Ready to Donate' : 'রক্তদানে প্রস্তুত',
      value: availableDonors,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10',
      description: language === 'en' ? 'Eligible & available right now' : 'বর্তমানে রক্তদানে প্রস্তুত দাতা'
    },
    {
      label: language === 'en' ? 'Hero Donors' : 'বীর রক্তদাতা',
      value: heroDonors,
      icon: Trophy,
      color: 'text-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10',
      description: language === 'en' ? 'Donors with 6+ donations' : '৬ বারের বেশি রক্তদান করেছেন'
    },
    {
      label: language === 'en' ? 'Active Requests' : 'সক্রিয় অনুরোধ',
      value: totalEmergencies,
      icon: Flame,
      color: 'text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10',
      description: language === 'en' ? 'Urgent blood requests active' : 'জরুরি রক্তের সক্রিয় অনুরোধ'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.label} 
            className="glass-panel rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 relative overflow-hidden group hover:border-red-500/20 dark:hover:border-red-500/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300"
          >
            {/* Hover background highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent dark:from-red-500/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10 text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                  {stat.label}
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-white block tracking-tight">
                  {stat.value}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${stat.color} flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-3 relative z-10 font-semibold text-left">
              {stat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
