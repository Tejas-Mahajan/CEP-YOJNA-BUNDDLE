import React from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, ClipboardList, FolderCheck, Search, MapPin, Sparkles, ChevronRight, Bookmark, Layers, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TRANSLATIONS } from '../data/translations';

export default function Sidebar({ activeNav, setActiveNav, activeTab, setActiveTab, resultsCount, lang, onGoHome, isFirstTimeSetup }) {
  const { savedSchemesCount } = useAuth();
  const [totalSchemes, setTotalSchemes] = React.useState(8);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/schemes');
        if (res.ok) {
          const data = await res.json();
          if (data.schemes) {
            setTotalSchemes(data.schemes.length);
          }
        }
      } catch (e) {
        // Fallback default
      }
    };
    fetchCount();
  }, []);

  const navGroups = [
    {
      groupTitle: t.navPortalDashboard || "PORTAL & DASHBOARD",
      items: [
        {
          id: 'matcher',
          label: t.eligibilityEngine || 'Eligibility Engine',
          subtitle: t.eligibilityEngineSub || 'Tailored profile form & calculation',
          icon: Compass,
          badge: null
        }
      ]
    },
    {
      groupTitle: t.navActionPlanOptimization || "ACTION PLAN & OPTIMIZATION",
      items: [
        {
          id: 'plan',
          label: t.actionPlanNav || "'Apply First' Action Plan",
          subtitle: t.actionPlanNavSub || 'Weighted priority checklist',
          icon: ClipboardList,
          badge: resultsCount > 0 ? `${resultsCount} ${t.schemesMatchedUnit || 'Matched'}` : null,
          badgeColor: 'bg-emerald-600 text-white'
        },
        {
          id: 'vault',
          label: t.documentVaultNav || 'Document Vault & Overlap',
          subtitle: t.documentVaultNavSub || 'Reusable master document matrix',
          icon: FolderCheck,
          badge: null
        }
      ]
    },
    {
      groupTitle: t.navDirectoryAssistance || "DIRECTORY & ASSISTANCE",
      items: [
        {
          id: 'directory',
          label: t.allSchemesDirectoryNav || 'All Schemes Directory',
          subtitle: t.allSchemesDirectoryNavSub || 'Agri Schemes & Side-by-Side Compare',
          icon: Search,
          badge: `${lang === 'mr' ? 'सर्व' : lang === 'hi' ? 'सभी' : 'All'} ${totalSchemes}`,
          badgeColor: 'bg-slate-200 text-slate-800'
        },
        {
          id: 'csc',
          label: t.cscLocatorNav || 'CSC / Offline Help Locator',
          subtitle: t.cscLocatorNavSub || 'Maha e-Seva helpdesks & map links',
          icon: MapPin,
          badge: lang === 'mr' ? 'प्रमाणित' : lang === 'hi' ? 'सत्यापित' : 'Verified',
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
              const isLocked = isFirstTimeSetup && item.id !== 'matcher';

              return (
                <motion.button
                  key={item.id}
                  whileHover={isLocked ? {} : { x: 2 }}
                  whileTap={isLocked ? {} : { scale: 0.98 }}
                  disabled={isLocked}
                  onClick={() => {
                    if (isLocked) return;
                    if (item.action) {
                      item.action();
                    } else {
                      setActiveNav(item.id);
                    }
                  }}
                  title={isLocked ? (lang === 'mr' ? "अनलॉक करण्यासाठी आधी प्रोफाईल भरा" : lang === 'hi' ? "अनलॉक करने के लिए पहले प्रोफाइल भरें" : "Complete initial profile to unlock") : ""}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between group ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100 text-slate-400'
                      : isActive
                      ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-md shadow-emerald-950/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isLocked
                        ? 'bg-slate-200 text-slate-400'
                        : isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-900'
                    }`}>
                      {isLocked ? <Lock className="w-4 h-4 text-slate-400" /> : <Icon className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isLocked ? 'text-slate-400' : isActive ? 'text-white' : 'text-slate-900'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate ${isLocked ? 'text-slate-400' : isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {isLocked ? (lang === 'mr' ? '🔒 लॉक केलेले' : lang === 'hi' ? '🔒 लॉक है' : '🔒 Fill profile to unlock') : item.subtitle}
                      </div>
                    </div>
                  </div>

                  {isLocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1 flex-shrink-0 bg-slate-200 text-slate-500 flex items-center space-x-1">
                      <span>{lang === 'mr' ? '🔒 लॉक' : lang === 'hi' ? '🔒 लॉक' : '🔒 Locked'}</span>
                    </span>
                  ) : item.badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1 flex-shrink-0 ${item.badgeColor || 'bg-emerald-100 text-emerald-900'}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        ))}


        {/* Saved Schemes Summary Box / Interactive Button in Sidebar */}
        <button
          type="button"
          onClick={() => {
            if (setActiveTab) setActiveTab('SAVED');
            if (setActiveNav) setActiveNav('SAVED');
          }}
          className={`w-full pt-3 px-3 py-2.5 rounded-2xl flex items-center justify-between text-xs transition-all cursor-pointer hover:bg-amber-100 border ${
            (activeTab === 'SAVED' || activeNav === 'SAVED')
              ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white border-emerald-700 font-bold shadow-md shadow-emerald-950/20'
              : 'bg-amber-50/60 border-amber-200/60 text-amber-950 font-bold'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold">
            <Bookmark className={`w-4 h-4 ${(activeTab === 'SAVED' || activeNav === 'SAVED') ? 'text-amber-300 fill-amber-400' : 'text-amber-500 fill-amber-400'}`} />
            <span>{t.savedSchemesNav || "Saved Schemes"}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${(activeTab === 'SAVED' || activeNav === 'SAVED') ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
            {savedSchemesCount}
          </span>
        </button>

      </div>

    </aside>
  );
}
