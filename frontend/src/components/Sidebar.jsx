import React from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, ClipboardList, FolderCheck, Search, MapPin, Sparkles, ChevronRight, Bookmark, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TRANSLATIONS } from '../data/translations';

export default function Sidebar({ activeNav, setActiveNav, resultsCount, lang, onGoHome }) {
  const { savedSchemesCount } = useAuth();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const navGroups = [
    {
      groupTitle: "PORTAL & DASHBOARD",
      items: [
        {
          id: 'home',
          label: 'Home & Portal Hub',
          subtitle: 'Landing zone & 2026 updates',
          icon: Home,
          action: onGoHome
        },
        {
          id: 'matcher',
          label: 'Eligibility Engine',
          subtitle: 'Tailored profile form & calculation',
          icon: Compass,
          badge: null
        }
      ]
    },
    {
      groupTitle: "ACTION PLAN & OPTIMIZATION",
      items: [
        {
          id: 'plan',
          label: "'Apply First' Action Plan",
          subtitle: 'Weighted priority checklist',
          icon: ClipboardList,
          badge: resultsCount > 0 ? `${resultsCount} Matched` : null,
          badgeColor: 'bg-emerald-600 text-white'
        },
        {
          id: 'vault',
          label: 'Document Vault & Overlap',
          subtitle: 'Reusable master document matrix',
          icon: FolderCheck,
          badge: null
        }
      ]
    },
    {
      groupTitle: "DIRECTORY & ASSISTANCE",
      items: [
        {
          id: 'directory',
          label: 'All Schemes Directory',
          subtitle: '20+ Schemes & Side-by-Side Compare',
          icon: Search,
          badge: 'All 18',
          badgeColor: 'bg-slate-200 text-slate-800'
        },
        {
          id: 'csc',
          label: 'CSC / Offline Help Locator',
          subtitle: 'Maha e-Seva helpdesks & map links',
          icon: MapPin,
          badge: 'Verified',
          badgeColor: 'bg-amber-400 text-slate-950'
        }
      ]
    }
  ];

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
      
      {/* Sidebar Nav Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-3 space-y-4 sticky top-24">
        
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {group.groupTitle}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setActiveNav(item.id);
                    }
                  }}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-md shadow-emerald-950/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-900'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1 flex-shrink-0 ${item.badgeColor || 'bg-emerald-100 text-emerald-900'}`}>
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}

        {/* Saved Schemes Summary Box in Sidebar */}
        <div className="pt-3 border-t border-slate-100 px-3 py-2 rounded-2xl bg-amber-50/60 border-amber-200/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-amber-950">
            <Bookmark className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Saved Schemes</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
            {savedSchemesCount}
          </span>
        </div>

      </div>

    </aside>
  );
}
