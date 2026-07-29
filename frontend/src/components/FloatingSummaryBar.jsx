import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowDown, Download, CheckCircle2, IndianRupee } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function FloatingSummaryBar({ results, onScrollToPlan, onExportReport, lang }) {
  if (!results) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const benefitFormatted = results.formatted_potential_benefit || `₹${(results.total_potential_benefit || 0).toLocaleString('en-IN')}`;
  const totalSchemes = results.total_eligible_schemes || (results.ranked_schemes ? results.ranked_schemes.length : 0);
  const readinessPct = results.document_readiness_pct || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="fixed bottom-4 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pointer-events-none"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl border border-emerald-500/30 shadow-[0_10px_35px_rgba(6,78,59,0.3)] p-4 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto">
          
          {/* Left: Summary Metrics */}
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-start">
            
            {/* Benefit Amount Pill */}
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                  Total Financial Benefit Unlocked
                </div>
                <div className="text-lg sm:text-xl font-black bg-gradient-to-r from-amber-300 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                  {benefitFormatted}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700 hidden sm:block" />

            {/* Matched Schemes Badge */}
            <div className="hidden xs:flex items-center space-x-2">
              <span className="px-3 py-1.5 rounded-2xl bg-emerald-950 border border-emerald-600/50 text-emerald-300 text-xs font-extrabold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{totalSchemes} Schemes Matched</span>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-2xs font-semibold border border-slate-700">
                {readinessPct}% Ready
              </span>
            </div>

          </div>

          {/* Right: Quick Action CTAs */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            
            <button
              onClick={onScrollToPlan}
              className="flex-1 sm:flex-none px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Action Checklist</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>

            <button
              onClick={onExportReport}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center space-x-1 transition-all"
              title="Export Report PDF"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Export</span>
            </button>

          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
