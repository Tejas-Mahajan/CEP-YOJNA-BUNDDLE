import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Bookmark, ShieldCheck, LogOut, ChevronDown, CheckCircle, Sparkles, X, Heart, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WelcomeBar({ onSelectScheme, allSchemes = [] }) {
  const { user, logout, savedSchemes, savedSchemesCount, isAuthenticated } = useAuth();
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  if (!isAuthenticated || !user) return null;

  const roleColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  const attrs = user.profileAttributes || {};

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md border-b border-emerald-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          
          {/* Main Personalized Welcome Message */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
            <span className="flex items-center space-x-1.5 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Welcome back, <strong className="text-emerald-300">{user.name}</strong> 👋</span>
            </span>

            <span className="text-emerald-600 hidden sm:inline">|</span>

            {/* Profile Badge */}
            <button
              onClick={() => setShowProfileDrawer(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-800/80 hover:bg-emerald-700/90 text-emerald-100 border border-emerald-600/50 transition-all"
            >
              <span>Profile: <strong>{user.role || 'Farmer'}</strong></span>
              <ChevronDown className="w-3 h-3 text-emerald-300" />
            </button>

            <span className="text-emerald-600 hidden sm:inline">|</span>

            {/* Saved Schemes Badge */}
            <button
              onClick={() => setShowSavedModal(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 transition-all"
            >
              <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Saved Schemes: <strong>{savedSchemesCount}</strong></span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setShowProfileDrawer(true)}
              className="text-slate-300 hover:text-white underline underline-offset-2 flex items-center space-x-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stored Attributes</span>
            </button>

            <button
              onClick={logout}
              className="px-2.5 py-1 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-700/40 flex items-center space-x-1 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </div>

      {/* Saved Schemes Drawer / Modal */}
      <AnimatePresence>
        {showSavedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSavedModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <h3 className="text-lg font-bold text-slate-900">Your Saved Schemes ({savedSchemesCount})</h3>
                </div>
                <button
                  onClick={() => setShowSavedModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {savedSchemes.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">No saved schemes yet</p>
                  <p className="text-xs text-slate-400">Click the bookmark icon on any scheme card to save it to your account bundle.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {savedSchemes.map((schemeId) => (
                    <div
                      key={schemeId}
                      className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-emerald-950">{schemeId.replace('_', ' ')}</div>
                        <div className="text-2xs text-emerald-700 font-medium">Saved in user profile</div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 bg-emerald-700 text-white rounded-lg">Saved</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Drawer / Modal */}
      <AnimatePresence>
        {showProfileDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileDrawer(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">Stored Profile Attributes</h3>
                </div>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                  <div><span className="text-slate-400">Name:</span> <strong className="text-slate-800">{user.name}</strong></div>
                  <div><span className="text-slate-400">Role:</span> <strong className="text-slate-800">{user.role}</strong></div>
                  <div><span className="text-slate-400">Income:</span> <strong className="text-slate-800">₹{(attrs.annual_income || 0).toLocaleString('en-IN')}</strong></div>
                  <div><span className="text-slate-400">State:</span> <strong className="text-slate-800">{attrs.state || 'Maharashtra'}</strong></div>
                  <div><span className="text-slate-400">Category:</span> <strong className="text-slate-800">{attrs.category || 'General'}</strong></div>
                  <div><span className="text-slate-400">Land Holding:</span> <strong className="text-slate-800">{attrs.land_acres || 0} Acres</strong></div>
                </div>

                <div>
                  <div className="font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Owned Documents ({attrs.owned_documents?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(attrs.owned_documents || []).map((doc, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-2xs border border-emerald-300">
                        ✓ {doc}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-2xs text-slate-400 italic pt-2">
                  * These attributes are automatically synced with your form inputs so you don't need to re-enter them repeatedly.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
