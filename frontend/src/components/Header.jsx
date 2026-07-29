import React from 'react';
import { Sprout, Sparkles, Languages, User, LogIn, Menu } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Header({ lang, setLang, onOpenMobileDrawer, onGoHome }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const { user, isAuthenticated, setIsAuthModalOpen } = useAuth();

  const handleLanguageChange = (e) => {
    setLang(e.target.value);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Logo & Branding */}
          <div
            onClick={onGoHome}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-900 via-emerald-700 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-700/30 ring-2 ring-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-7 h-7 animate-pulse text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-600 bg-clip-text text-transparent">
                  {t.appTitle}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-600" /> {t.smartPlanner}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Right: Controls (Language Selector, Notifications Bell, User Profile) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Notification Bell Center */}
            <NotificationBell />

            {/* Language Selector Dropdown (English 🇬🇧 / Marathi 🚩 / Hindi 🇮🇳) */}
            <div className="relative">
              <select
                value={lang}
                onChange={handleLanguageChange}
                className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-900 shadow-2xs appearance-none pr-8 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="en">🇬🇧 English</option>
                <option value="mr">🚩 मराठी</option>
                <option value="hi">🇮🇳 हिंदी</option>
              </select>
              <Languages className="w-4 h-4 text-emerald-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Auth Login Button */}
            {!isAuthenticated ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-white text-xs font-extrabold shadow-md shadow-emerald-800/20 flex items-center space-x-1.5 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Log In / Sign Up</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="p-2 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-950 text-xs font-bold flex items-center space-x-1.5 hover:bg-emerald-100 transition-colors"
                title="Account Settings"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="hidden lg:inline max-w-[100px] truncate">{user.name}</span>
              </button>
            )}

            {/* Mobile Navigation Drawer Button */}
            {onOpenMobileDrawer && (
              <button
                onClick={onOpenMobileDrawer}
                className="lg:hidden p-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-emerald-900" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
