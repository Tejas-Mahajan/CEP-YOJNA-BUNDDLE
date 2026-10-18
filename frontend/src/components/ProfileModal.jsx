import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ShieldCheck, X, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TRANSLATIONS } from '../data/translations';

export default function ProfileModal({ isOpen, onClose, lang = 'en' }) {
  const { user, logout } = useAuth();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  if (!isOpen || !user) return null;

  const attrs = user.profileAttributes || {};

  const formatIncome = (income) => {
    if (income === undefined || income === null || income === 0) return '₹0';
    if (income >= 1000000) return '₹10,00,000+';
    return `₹${Number(income).toLocaleString('en-IN')}`;
  };

  const formatLand = (acres) => {
    const val = Number(acres) || 0;
    if (val >= 25) return '25+ Acres';
    return `${val} Acres`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{user.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{t.storedAttributes || 'Stored Profile Attributes'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Attributes Matrix */}
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-2xs uppercase font-bold tracking-wider mb-0.5">Name</span>
                <strong className="text-slate-800 text-sm font-bold truncate block">{user.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase font-bold tracking-wider mb-0.5">Role</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                  {user.role || 'Farmer'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase font-bold tracking-wider mb-0.5">Annual Income</span>
                <strong className="text-emerald-800 text-sm font-extrabold block">
                  {formatIncome(attrs.annual_income)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase font-bold tracking-wider mb-0.5">State</span>
                <strong className="text-slate-800 text-sm font-bold block">{attrs.state || 'Maharashtra'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase font-bold tracking-wider mb-0.5">Category</span>
                <strong className="text-slate-800 text-sm font-bold block">{attrs.category || 'General'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs uppercase font-bold tracking-wider mb-0.5">Land Holding</span>
                <strong className="text-emerald-900 text-sm font-extrabold block">
                  {formatLand(attrs.land_acres)}
                </strong>
              </div>
            </div>

            {/* Registered Documents */}
            <div>
              <div className="font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Owned Documents ({attrs.owned_documents?.length || 0})</span>
              </div>
              {attrs.owned_documents && attrs.owned_documents.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {attrs.owned_documents.map((doc, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-2xs border border-emerald-300 flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                      <span>{doc}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-2xs text-slate-400 italic">No master documents registered yet.</p>
              )}
            </div>

            <p className="text-2xs text-slate-400 italic pt-1 border-t border-slate-100">
              * These attributes are automatically synced with your form inputs and scheme eligibility calculations.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.logOut || 'Log Out'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
