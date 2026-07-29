import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, GraduationCap, ArrowRight, Sparkles, ShieldCheck, Zap, Layers, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function LandingZone({ onSelectDomain, lang }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const marqueeNews = [
    "🔥 PM-KISAN 17th Installment: ₹2,000 Direct Cash Credit batch released for verified farmers",
    "⚡ Namo Shetkari Mahasanman Yojana: ₹6,000 annual state bonus active in Maharashtra",
    "🎓 NSP Post-Matric Scholarship 2026-27: 100% Tuition Fee Waivers for SC/ST/OBC students open",
    "🌾 PM-KUSUM Solar Pump Scheme: Up to 95% subsidy for off-grid agricultural solar pumps",
    "📚 AICTE Pragati Girl Student Scheme: ₹50,000 annual technical education grant closing soon"
  ];

  return (
    <div className="space-y-8 py-4">
      
      {/* 1. Top Live Marquee Ticker */}
      <div className="bg-slate-900 text-white rounded-2xl p-2.5 overflow-hidden border border-slate-800 shadow-md flex items-center">
        <div className="px-3 py-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-lg flex items-center space-x-1 flex-shrink-0 uppercase tracking-wider mr-3">
          <Sparkles className="w-3 h-3 animate-spin text-slate-950" />
          <span>Latest Updates 2026</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap flex-1 relative">
          <div className="inline-block animate-marquee text-xs font-semibold text-emerald-300 space-x-8">
            {marqueeNews.map((news, i) => (
              <span key={i} className="inline-flex items-center space-x-2">
                <span>{news}</span>
                <span className="text-slate-600 font-bold">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Hero Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
          <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-700" />
          Official Government Scheme Optimizer
        </span>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Smart Scheme Bundling & Eligibility Planner
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
          Select your beneficiary category to unlock tailored financial subsidies, scholarships, and reusable document matching.
        </p>
      </div>

      {/* 3. Two Large Category Hub Cards (Farmers vs Students) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto pt-4">
        
        {/* 🌾 KRISHI / FARMER HUB CARD */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          onClick={() => onSelectDomain('agriculture')}
          className="group relative bg-gradient-to-b from-white via-emerald-50/40 to-emerald-100/60 rounded-3xl border border-emerald-200/80 p-8 shadow-xl hover:shadow-2xl hover:border-emerald-400 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />

          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-900 via-emerald-700 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-800/30 ring-2 ring-emerald-500/20 group-hover:scale-110 transition-transform">
                <Sprout className="w-8 h-8 text-emerald-300" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-800 text-white shadow-2xs">
                🌾 Krishi Hub
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-900 transition-colors">
                Agriculture & Farmers Portal
              </h2>
              <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                Discover cash grants, crop insurance protection, solar pump subsidies, and low-interest crop credit loans.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-emerald-200/60">
              <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Included High-Yield Schemes</div>
              <div className="flex flex-wrap gap-1.5">
                {["PM-KISAN (₹6,000)", "PM Fasal Bima", "Kisan Credit Card", "Solar Pump (95%)"].map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl bg-white text-emerald-900 text-xs font-bold border border-emerald-300/80 shadow-2xs">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <button className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 transition-all group-hover:bg-emerald-950">
              <span>Enter Farmer Eligibility Portal</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* 🎓 VIDYARTHI / STUDENT HUB CARD */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          onClick={() => onSelectDomain('education')}
          className="group relative bg-gradient-to-b from-white via-teal-50/40 to-teal-100/60 rounded-3xl border border-teal-200/80 p-8 shadow-xl hover:shadow-2xl hover:border-teal-400 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />

          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-950 via-teal-800 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-900/30 ring-2 ring-teal-500/20 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8 text-teal-300" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-900 text-white shadow-2xs">
                🎓 Vidyarthi Hub
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">
                Education & Students Portal
              </h2>
              <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                Explore higher education fee waivers, Post-Matric scholarships, technical girl student grants, and hostel stipends.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-teal-200/60">
              <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Included High-Yield Schemes</div>
              <div className="flex flex-wrap gap-1.5">
                {["Post-Matric (100%)", "Pragati Girls (₹50k)", "Vidyasaarathi Grant", "PM-USP Merit"].map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl bg-white text-teal-950 text-xs font-bold border border-teal-300/80 shadow-2xs">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <button className="w-full py-3.5 rounded-2xl bg-teal-950 hover:bg-teal-900 text-white font-black text-xs shadow-lg shadow-teal-950/30 flex items-center justify-center space-x-2 transition-all group-hover:bg-slate-950">
              <span>Enter Student Eligibility Portal</span>
              <ArrowRight className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

      </div>

      {/* 4. Feature Value Additions Strip */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">Zero Duplicated Effort</div>
            <div className="text-2xs text-slate-500 font-medium">1 document unlocks 4+ schemes at once</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">Conflict Guard Engine</div>
            <div className="text-2xs text-slate-500 font-medium">Prevents mutual exclusivity rejections</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0 font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">Max Benefit Bundling</div>
            <div className="text-2xs text-slate-500 font-medium">Computes highest financial yield</div>
          </div>
        </div>

      </div>

    </div>
  );
}
