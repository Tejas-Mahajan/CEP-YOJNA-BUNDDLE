import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle, FileText, Zap, Layers, Filter, Check } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function OverlapSection({ insights, callouts, lang, onSelectDocumentFilter }) {
  const [activeDoc, setActiveDoc] = useState(null);

  if (!insights || insights.length === 0) return null;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleDocClick = (docName) => {
    const newActive = activeDoc === docName ? null : docName;
    setActiveDoc(newActive);
    if (onSelectDocumentFilter) {
      onSelectDocumentFilter(newActive);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">{t.overlapTitle}</h3>
            <p className="text-xs text-slate-500">{t.overlapDesc} — Click any master document to highlight connected schemes.</p>
          </div>
        </div>
        
        {activeDoc && (
          <button
            onClick={() => handleDocClick(null)}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-all self-start sm:self-auto"
          >
            <span>Reset Matrix Filter: <strong>{activeDoc}</strong></span>
            <span className="ml-1 text-amber-700 font-bold">✕</span>
          </button>
        )}
      </div>

      {/* High Leverage Callout Banners */}
      {callouts && callouts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {callouts.map((c, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -1 }}
              className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-emerald-50/60 to-teal-50/60 border border-amber-200/80 flex items-start space-x-3 text-xs font-semibold text-slate-800 shadow-2xs"
            >
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{c}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Interactive Document Overlap Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {insights.map((item, idx) => {
          const isSelected = activeDoc === item.document_name;

          return (
            <motion.div
              key={idx}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDocClick(item.document_name)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-tr from-emerald-950 via-emerald-900 to-teal-900 text-white border-emerald-400 shadow-xl ring-4 ring-emerald-500/20'
                  : item.is_owned
                  ? 'bg-emerald-50/60 border-emerald-300 shadow-sm hover:border-emerald-400'
                  : item.unlocked_schemes_count >= 3
                  ? 'bg-amber-50/60 border-amber-300 shadow-sm hover:border-amber-400'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className={`w-4 h-4 ${isSelected ? 'text-amber-400' : item.is_owned ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className={`font-extrabold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {item.document_name}
                    </span>
                  </div>

                  {item.is_owned ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-600 text-white'}`}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {t.ready}
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      <AlertCircle className="w-3 h-3 mr-1" /> {t.missing}
                    </span>
                  )}
                </div>

                <div className={`text-[11px] font-semibold mt-2 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                  {item.efficiency_tag}
                </div>
              </div>

              {/* Connected Schemes Count */}
              <div className={`pt-3 border-t flex items-center justify-between ${isSelected ? 'border-emerald-700/50' : 'border-slate-200/60'}`}>
                <span className={`text-xs font-medium ${isSelected ? 'text-emerald-200' : 'text-slate-600'}`}>Unlocks Schemes:</span>
                <span className={`px-2.5 py-1 rounded-xl font-black text-xs ${isSelected ? 'bg-amber-400 text-slate-950' : 'bg-white border border-slate-200 text-emerald-900 shadow-2xs'}`}>
                  ⚡ {item.unlocked_schemes_count} Schemes
                </span>
              </div>
              
              {/* Connected Schemes Badges */}
              <div className="flex flex-wrap gap-1 pt-1">
                {item.scheme_names.map((sName, sIdx) => (
                  <span
                    key={sIdx}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold truncate max-w-[120px] ${
                      isSelected
                        ? 'bg-white/15 text-emerald-100 border border-white/20'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {sName}
                  </span>
                ))}
              </div>

              {/* Active Selection Badge Overlay */}
              {isSelected && (
                <div className="absolute top-2 right-2 p-1 rounded-full bg-amber-400 text-slate-950 shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
