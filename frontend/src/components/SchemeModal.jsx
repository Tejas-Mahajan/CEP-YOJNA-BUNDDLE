import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, Clock, FileText, CheckCircle2, Building2, Sparkles, Layers, ArrowRight, Bookmark, BookmarkCheck, Calendar, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SchemeModal({ scheme, onClose, allInsights = [] }) {
  const [activeModalTab, setActiveModalTab] = useState('overview'); // 'overview', 'documents', 'deadlines', 'steps'
  const { toggleSaveScheme, isSchemeSaved, isAuthenticated, setIsAuthModalOpen } = useAuth();

  if (!scheme) return null;

  const saved = isSchemeSaved(scheme.id);
  const reqDocs = scheme.documents_required || scheme.required_documents || [];
  const appSteps = scheme.application_steps || [];
  const department = scheme.department || 'Ministry of Agriculture & Farmers Welfare';
  const quotaType = scheme.quota_type || 'Central Sector Scheme (100% Central Fund)';
  
  // Calculate deadline date display
  const deadlineDays = scheme.deadline_days || 15;
  const deadlineDateObj = new Date();
  deadlineDateObj.setDate(deadlineDateObj.getDate() + deadlineDays);
  const deadlineDateStr = scheme.deadline_date || deadlineDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Document reusability map
  const getDocumentInsight = (docName) => {
    return allInsights.find(i => i.document_name?.toLowerCase() === docName?.toLowerCase());
  };

  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    toggleSaveScheme(scheme.id);
  };

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

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 my-6"
        >
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-slate-950 uppercase tracking-wide">
                Agriculture
              </span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-emerald-200 border border-white/20">
                <Building2 className="w-3 h-3 inline mr-1" /> {department}
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white mb-1">
              {scheme.name}
            </h2>
            <p className="text-xs text-emerald-200 font-medium">
              {quotaType}
            </p>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex space-x-2 overflow-x-auto custom-scrollbar">
            {[
              { id: 'overview', label: '1. Overview & Benefit', icon: Sparkles },
              { id: 'documents', label: `2. Documents (${reqDocs.length})`, icon: FileText },
              { id: 'deadlines', label: '3. Deadlines & Timelines', icon: Clock },
              { id: 'steps', label: '4. Step-by-Step Guide', icon: Layers }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeModalTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-emerald-950 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* TAB 1: OVERVIEW & BENEFIT */}
            {activeModalTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Financial Benefit Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800/40">
                  <div>
                    <div className="text-2xs text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Financial Benefit Structure
                    </div>
                    <div className="text-2xl font-black bg-gradient-to-r from-amber-300 via-emerald-200 to-white bg-clip-text text-transparent">
                      {scheme.benefit_display}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-left sm:text-right">
                    <div className="text-2xs text-emerald-200">Benefit Type</div>
                    <div className="text-xs font-bold text-white">{scheme.benefit_type || "Direct Cash Transfer"}</div>
                  </div>
                </div>

                {/* Scheme Objective & Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheme Objective</h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {scheme.description}
                  </p>
                </div>

                {/* Target Categories & Eligibility Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Eligible Social Categories</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(scheme.category_target || ["General", "OBC", "SC", "ST", "EWS"]).map((cat, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Administrative Quota</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {quotaType}
                    </div>
                    <div className="text-2xs text-slate-500">
                      Nodal Department: {department}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB 2: REQUIRED DOCUMENTS CHECKLIST */}
            {activeModalTab === 'documents' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <FileText className="w-4 h-4 mr-1.5 text-emerald-600" /> Mandatory Documents ({reqDocs.length})
                  </h4>
                  <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ⚡ Reusable Across Matched Schemes
                  </span>
                </div>

                <div className="space-y-3">
                  {reqDocs.map((docName, idx) => {
                    const insight = getDocumentInsight(docName);
                    const isShared = insight && insight.unlocked_schemes_count > 1;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isShared
                            ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border-emerald-300 shadow-2xs'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isShared ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{docName}</div>
                            <div className="text-2xs text-slate-500 font-medium">Standard verified identity document</div>
                          </div>
                        </div>

                        {isShared && (
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-2xs font-extrabold bg-amber-400 text-slate-950 shadow-2xs self-start sm:self-auto">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Shared Master (Unlocks {insight.unlocked_schemes_count} Schemes)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB 3: DEADLINES & TIMELINES */}
            {activeModalTab === 'deadlines' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Deadline Countdown Banner */}
                <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                      <h4 className="text-sm font-bold">Application Deadline Countdown</h4>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950">
                      {deadlineDays} Days Left
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs text-slate-400 font-semibold">
                      <span>Window Opening</span>
                      <span>Closing Date: <strong>{deadlineDateStr}</strong></span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, Math.min(100, (deadlineDays / 30) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-2xs text-slate-400 italic">
                    * Applications close automatically on portal servers at 11:59 PM IST on the deadline date. Apply early to avoid server load.
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB 4: STEP-BY-STEP APPLICATION PROCEDURE */}
            {activeModalTab === 'steps' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Numbered Application Guide</h4>
                <div className="space-y-3">
                  {appSteps.map((stepText, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                      <span className="w-7 h-7 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                        {stepText}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>

          {/* Footer Action Bar */}
          <div className="bg-slate-50 p-4 sm:px-8 sm:py-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            
            {/* Save Scheme Button */}
            <button
              onClick={handleSaveToggle}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center space-x-1.5 ${
                saved
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-amber-500 text-amber-600' : ''}`} />
              <span>{saved ? 'Saved in Profile Bundle' : 'Add to My Saved Schemes'}</span>
            </button>

            {/* External Portal Link */}
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-800/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Apply on Official Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
