import React from 'react';
import { Sparkles, IndianRupee, Award, FileCheck2, Loader2 } from 'lucide-react';
import { ActionPlanSkeleton } from './ActionPlan';

export default function DashboardSkeleton({ lang }) {
  const isMr = lang === 'mr';
  const isHi = lang === 'hi';

  const headingText = isMr
    ? 'प्रोफाइल डेटा लोड होत आहे आणि योजना लाभ मोजले जात आहेत...'
    : isHi
    ? 'प्रोफ़ाइल डेटा लोड हो रहा है और योजना लाभों की गणना की जा रही है...'
    : 'Synchronizing saved profile & evaluating eligible schemes...';

  const subText = isMr
    ? 'तुमच्या जमिनीचा तपशील व कागदपत्रांच्या आधारे केंद्रीय व महाराष्ट्र शासन योजनांची पडताळणी सुरू आहे'
    : isHi
    ? 'आपके भूमि विवरण और दस्तावेज़ों के आधार पर केंद्रीय और महाराष्ट्र सरकार की योजनाओं का मिलान हो रहा है'
    : 'Matching 15+ Central & Maharashtra state government schemes with your land records and documents';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hydration Banner with Spinner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-700/60 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 backdrop-blur-md">
            <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isMr ? 'स्वयंचलित गणना चालू आहे' : isHi ? 'स्वचालित गणना जारी है' : 'Automated Evaluation in Progress'}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">{headingText}</h3>
            <p className="text-xs text-emerald-200/90 mt-0.5 max-w-xl">{subText}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-xs font-bold text-emerald-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>{isMr ? 'पडताळणी चालू' : isHi ? 'मूल्यांकन जारी' : 'Computing'}</span>
        </div>
      </div>

      {/* Summary Metrics Cards Skeleton (3 Cards Matching SummaryCards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        
        {/* Card 1: Total Benefit Skeleton */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/70 via-emerald-800/60 to-teal-950/70 p-7 shadow-lg border border-emerald-700/30 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-32 bg-emerald-700/50 rounded-lg"></div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-amber-400/50" />
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <div className="h-9 w-44 bg-emerald-700/60 rounded-xl"></div>
            <div className="h-3 w-56 bg-emerald-700/40 rounded-lg"></div>
          </div>
        </div>

        {/* Card 2: Eligible Schemes Count Skeleton */}
        <div className="rounded-3xl bg-white p-7 shadow-md border border-slate-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-28 bg-slate-200 rounded-lg"></div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-slate-300" />
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <div className="h-9 w-20 bg-slate-200 rounded-xl"></div>
            <div className="h-3 w-40 bg-slate-100 rounded-lg"></div>
          </div>
        </div>

        {/* Card 3: Document Readiness Skeleton */}
        <div className="rounded-3xl bg-white p-7 shadow-md border border-slate-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-32 bg-slate-200 rounded-lg"></div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-slate-300" />
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <div className="h-9 w-24 bg-slate-200 rounded-xl"></div>
            <div className="h-3 w-48 bg-slate-100 rounded-lg"></div>
          </div>
        </div>

      </div>

      {/* Action Plan Scheme Rows Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="h-5 w-48 bg-slate-200 rounded-lg animate-pulse mb-3"></div>
        <ActionPlanSkeleton />
      </div>

    </div>
  );
}
