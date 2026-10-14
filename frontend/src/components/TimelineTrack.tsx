import React from 'react';
import { Flame, Clock, CheckCircle2 } from 'lucide-react';

interface TimelineTrackProps {
  status: 'needed' | 'responded' | 'fulfilled';
  language: 'en' | 'bn' | string;
}

export default function TimelineTrack({ status, language }: TimelineTrackProps) {
  if (status === 'responded') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5" />
        {language === 'bn' ? 'দাতা রওনা হয়েছেন' : 'Donors On Way'}
      </span>
    );
  }

  if (status === 'fulfilled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {language === 'bn' ? 'রক্তদান সম্পন্ন' : 'Life Saved!'}
      </span>
    );
  }

  // Default: 'needed'
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
      <Flame className="w-3.5 h-3.5 fill-current" />
      {language === 'bn' ? 'জরুরী প্রয়োজন' : 'Needed Urgent'}
    </span>
  );
}
