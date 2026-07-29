import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, ShieldCheck, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WelcomeScreen({ onComplete, isGuest }) {
  const { user } = useAuth();
  const userName = isGuest ? "Guest User" : (user?.name || "Beneficiary");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -15 }}
        className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-8 sm:p-10 rounded-3xl border border-emerald-500/30 shadow-2xl max-w-md w-full text-center text-white space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <Sprout className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2 relative z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500 text-slate-950 uppercase tracking-wider">
            Portal Initializing
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            🎉 Welcome, {userName}!
          </h2>
          <p className="text-xs text-emerald-200 font-medium">
            Setting up your personalized scheme bundling portal & document readiness engine...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 relative z-10 pt-2">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300 rounded-full"
            />
          </div>
          <div className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider pt-1">
            Loading Scheme Rules 2026...
          </div>
        </div>

      </motion.div>
    </div>
  );
}
