import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Sparkles } from 'lucide-react';

export default function IntroAnimation({ onAnimationComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onAnimationComplete) onAnimationComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950">
      
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 space-y-6">
        
        {/* Pulsing Sprout Logo Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
          animate={{ scale: 1.1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-900 via-emerald-600 to-teal-400 p-0.5 shadow-2xl shadow-emerald-500/30 flex items-center justify-center"
        >
          <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
            <Sprout className="w-12 h-12 text-emerald-400 animate-pulse" />
          </div>
        </motion.div>

        {/* Dynamic Typing Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-3 max-w-xl"
        >
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Yojana<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Bundle</span>
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              2026 SaaS Edition
            </span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-emerald-200/90 leading-relaxed">
            Smart Eligibility Matching & Multi-Scheme Optimization
          </p>
        </motion.div>

        {/* Progress Micro-indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center space-x-2 text-2xs text-slate-400 font-bold uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Starting Optimization Engine...</span>
        </motion.div>

      </div>

    </div>
  );
}
