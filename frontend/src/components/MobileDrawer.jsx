import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sprout, GraduationCap, Layers, Languages, RefreshCw, LogIn, UserCheck, Bookmark, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TRANSLATIONS } from '../data/translations';

export default function MobileDrawer({ isOpen, onClose, activeTab, setActiveTab, profile, setProfile, lang, setLang, onReset }) {
  const { user, isAuthenticated, setIsAuthModalOpen, savedSchemesCount } = useAuth();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  if (!isOpen) return null;



  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'mr' : 'en'));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between z-10"
        >
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-md">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base text-slate-900">YojanaBundle</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auth Profile Status Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white space-y-2">
              {!isAuthenticated ? (
                <div>
                  <div className="text-xs text-emerald-200 font-medium">Guest User</div>
                  <h4 className="text-sm font-bold">Log in to save profile & schemes</h4>
                  <button
                    onClick={() => { onClose(); setIsAuthModalOpen(true); }}
                    className="mt-2 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log In / Sign Up</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-emerald-300 font-bold uppercase tracking-wider">Active Account</span>
                    <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-400 text-slate-950">
                      {user.role}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{user.name}</h4>
                  <div className="text-xs text-emerald-200 mt-0.5 flex items-center space-x-1">
                    <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Saved Schemes: <strong>{savedSchemesCount}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Main Tabs Navigation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Navigation</label>
              <button
                onClick={() => { setActiveTab('form'); onClose(); }}
                className={`w-full p-3 rounded-2xl font-bold text-xs flex items-center justify-between border transition-all ${
                  activeTab === 'form'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{t.profileFormTab}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </button>

              <button
                onClick={() => { setActiveTab('results'); onClose(); }}
                className={`w-full p-3 rounded-2xl font-bold text-xs flex items-center justify-between border transition-all ${
                  activeTab === 'results'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{t.actionDashboardTab}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </button>
            </div>

            {/* Application Focus Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-950 flex items-center space-x-2">
              <Sprout className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <span>Agriculture & Farming Scheme Bundle Engine Active</span>
            </div>

          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              onClick={toggleLanguage}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center justify-center space-x-2"
            >
              <Languages className="w-4 h-4 text-emerald-700" />
              <span>Language: {lang === 'en' ? 'मराठी मध्ये पहा' : 'Switch to English'}</span>
            </button>

            <button
              onClick={() => { onReset(); onClose(); }}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Profile Form</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
