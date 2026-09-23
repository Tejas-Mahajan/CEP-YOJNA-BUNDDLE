import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles, CheckCircle2, Building2, Clock, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SchemeComparisonModal({ scheme1, scheme2, onClose }) {
  if (!scheme1 || !scheme2) return null;

  const docs1 = scheme1.documents_required || scheme1.required_documents || [];
  const docs2 = scheme2.documents_required || scheme2.required_documents || [];

  // Find shared documents between scheme1 and scheme2
  const sharedDocs = docs1.filter(d => docs2.some(d2 => d2.toLowerCase() === d.toLowerCase()));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Comparison Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 my-6"
        >
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Side-by-Side Scheme Comparison
            </div>
            <h3 className="text-xl font-black text-white">Compare Government Welfare Grants</h3>
          </div>

          {/* Shared Master Document Highlight Callout */}
          {sharedDocs.length > 0 && (
            <div className="bg-amber-50 border-b border-amber-200 p-4 px-6 text-xs text-amber-950 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>⚡ Shared Master Documents ({sharedDocs.length}):</strong> Uploading {sharedDocs.join(', ')} satisfies both schemes simultaneously!
                </span>
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Grid */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* SCHEME 1 CARD */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 uppercase">
                      Agriculture
                    </span>
                    <span className="text-2xs font-bold text-slate-500">{scheme1.department || "Govt of India"}</span>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 leading-snug">{scheme1.name}</h4>

                  {/* Benefit */}
                  <div className="p-3 rounded-2xl bg-emerald-900 text-white space-y-0.5">
                    <div className="text-[10px] text-emerald-300 font-semibold">Financial Benefit</div>
                    <div className="text-base font-extrabold text-amber-300">{scheme1.benefit_display}</div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{scheme1.description}</p>

                  {/* Documents Checklist */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-2xs font-bold text-slate-400 uppercase">Mandatory Documents ({docs1.length})</div>
                    <div className="space-y-1">
                      {docs1.map((doc, idx) => {
                        const isShared = sharedDocs.some(sd => sd.toLowerCase() === doc.toLowerCase());
                        return (
                          <div key={idx} className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                            isShared ? 'bg-amber-100/80 border border-amber-300 text-amber-950 font-bold' : 'bg-white border border-slate-200 text-slate-800'
                          }`}>
                            <span>{doc}</span>
                            {isShared && <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-extrabold">Shared</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <a
                    href={scheme1.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>Apply on Portal 1</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* SCHEME 2 CARD */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-950 uppercase">
                      Agriculture
                    </span>
                    <span className="text-2xs font-bold text-slate-500">{scheme2.department || "Govt of India"}</span>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 leading-snug">{scheme2.name}</h4>

                  {/* Benefit */}
                  <div className="p-3 rounded-2xl bg-teal-950 text-white space-y-0.5">
                    <div className="text-[10px] text-teal-300 font-semibold">Financial Benefit</div>
                    <div className="text-base font-extrabold text-amber-300">{scheme2.benefit_display}</div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{scheme2.description}</p>

                  {/* Documents Checklist */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-2xs font-bold text-slate-400 uppercase">Mandatory Documents ({docs2.length})</div>
                    <div className="space-y-1">
                      {docs2.map((doc, idx) => {
                        const isShared = sharedDocs.some(sd => sd.toLowerCase() === doc.toLowerCase());
                        return (
                          <div key={idx} className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                            isShared ? 'bg-amber-100/80 border border-amber-300 text-amber-950 font-bold' : 'bg-white border border-slate-200 text-slate-800'
                          }`}>
                            <span>{doc}</span>
                            {isShared && <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-extrabold">Shared</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <a
                    href={scheme2.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>Apply on Portal 2</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* Footer Close */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Close Comparison
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
