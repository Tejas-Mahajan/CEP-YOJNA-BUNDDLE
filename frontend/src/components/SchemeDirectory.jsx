import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ExternalLink, Sparkles, Clock, FileText, Building2, CheckCircle2, Bookmark, RefreshCw, Lightbulb, Scale, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDeadlineText } from '../utils/validation';

export default function SchemeDirectory({ onOpenDetail, onOpenCompare, lang }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [compareIds, setCompareIds] = useState([]);

  const { isSchemeSaved, toggleSaveScheme, isAuthenticated, setIsAuthModalOpen } = useAuth();

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch('/api/schemes');
        if (res.ok) {
          const data = await res.json();
          setSchemes(data.schemes || []);
        } else {
          fallbackSchemes();
        }
      } catch (err) {
        fallbackSchemes();
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const fallbackSchemes = () => {
    setSchemes([
      {
        id: "PM_KISAN",
        name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        shortName: "PM-KISAN",
        department: "Ministry of Agriculture & Farmers Welfare",
        quota_type: "Central Sector Scheme (100% Central)",
        benefit_display: "₹6,000 / year in 3 installments",
        benefit_amount: 6000,
        deadline_days: 15,
        required_documents: ["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"],
        official_url: "https://pmkisan.gov.in",
        description: "Financial support to all landholding farmer families across the country."
      },
      {
        id: "PMFBY",
        name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        shortName: "PM Fasal Bima",
        department: "Ministry of Agriculture & Farmers Welfare",
        quota_type: "Central & State Sponsored (50:50)",
        benefit_display: "Comprehensive Crop Insurance Support",
        benefit_amount: 25000,
        deadline_days: 20,
        required_documents: ["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"],
        official_url: "https://pmfby.gov.in",
        description: "Financial support to farmers suffering crop loss/damage arising out of unforeseen events."
      }
    ]);
  };

  const filteredSchemes = schemes.filter(s => {
    const matchesCategory = selectedCategory === 'all' || (s.category_target && s.category_target.includes(selectedCategory));
    const matchesQuery = searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.shortName && s.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleSaveToggle = (schemeId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    toggleSaveScheme(schemeId);
  };

  const toggleCompare = (schemeId, e) => {
    e.stopPropagation();
    if (compareIds.includes(schemeId)) {
      setCompareIds(compareIds.filter(id => id !== schemeId));
    } else {
      if (compareIds.length >= 2) {
        setCompareIds([compareIds[1], schemeId]);
      } else {
        setCompareIds([...compareIds, schemeId]);
      }
    }
  };

  const handleTriggerCompare = () => {
    if (compareIds.length < 2) return;
    const s1 = schemes.find(s => s.id === compareIds[0]);
    const s2 = schemes.find(s => s.id === compareIds[1]);
    if (s1 && s2 && onOpenCompare) {
      onOpenCompare(s1, s2);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Agriculture & Farming Schemes Directory
            </div>
            <h2 className="text-2xl font-black">All Agriculture Welfare & Grant Schemes ({schemes.length})</h2>
            <p className="text-xs text-emerald-200 mt-1 max-w-xl">
              Browse, filter, and compare central and state government agricultural schemes, crop insurance, and solar pump subsidies.
            </p>
          </div>

          {/* Scheme Comparison Floating CTA Bar */}
          {compareIds.length > 0 && (
            <div className="bg-amber-400 text-slate-950 p-3 px-4 rounded-2xl shadow-lg border border-amber-300 flex items-center space-x-3">
              <Scale className="w-5 h-5 text-slate-950" />
              <div>
                <div className="text-xs font-black">Selected {compareIds.length}/2 for Comparison</div>
                <div className="text-2xs font-bold text-slate-800">
                  {compareIds.length === 2 ? 'Ready to compare side-by-side!' : 'Select 1 more scheme'}
                </div>
              </div>
              {compareIds.length === 2 && (
                <button
                  onClick={handleTriggerCompare}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 text-white font-extrabold text-xs hover:bg-slate-900 transition-all shadow-md"
                >
                  Compare Now 📊
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar & Filter Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agriculture scheme name, benefit or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900 bg-slate-50/50 outline-none"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Category:</span>
          {['all', 'General', 'OBC', 'SC', 'ST', 'EWS'].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase ${
                selectedCategory === c
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

      </div>

      {/* Grid of Schemes */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <div className="text-xs font-semibold">Loading Directory Schemes...</div>
        </div>
      ) : filteredSchemes.length === 0 ? (
        /* Friendly Search No-Match Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-md">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300 shadow-sm">
            <Lightbulb className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-xl font-bold text-slate-900">No Schemes Match "{searchQuery}"</h4>
            <p className="text-xs text-slate-500">
              We couldn't find any scheme matching your current search terms or filter selection.
            </p>
          </div>

          <div className="max-w-md mx-auto flex flex-wrap gap-2 justify-center">
            <span className="text-xs font-semibold text-slate-500 self-center">Try searching for:</span>
            {['PM-KISAN', 'Scholarship', 'Solar Pump', 'Insurance', 'Grant'].map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all"
              >
                {term}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-800/20 inline-flex items-center space-x-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Search & Reset All Filters</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchemes.map((s) => {
            const saved = isSchemeSaved(s.id);
            const isCompared = compareIds.includes(s.id);
            const isUrgent = s.deadline_days > 0 && s.deadline_days <= 7;

            return (
              <motion.div
                key={s.id}
                whileHover={{ y: -3 }}
                onClick={() => onOpenDetail(s)}
                className={`bg-white rounded-3xl border shadow-md p-6 flex flex-col justify-between space-y-4 cursor-pointer transition-all ${
                  isCompared
                    ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-50/10'
                    : 'border-slate-200/80 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 uppercase">
                        Agriculture
                      </span>
                      {isUrgent && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-0.5" /> 7 Days Left
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Compare Checkbox */}
                      <button
                        onClick={(e) => toggleCompare(s.id, e)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-all flex items-center space-x-1 ${
                          isCompared
                            ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                        }`}
                        title="Compare Side-by-Side"
                      >
                        <Scale className="w-3 h-3" />
                        <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                      </button>

                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => handleSaveToggle(s.id, e)}
                        className="p-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-colors"
                        title={saved ? "Saved to Profile" : "Save Scheme"}
                      >
                        <Bookmark className={`w-4 h-4 ${saved ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 hover:text-emerald-700 transition-colors">
                    {s.name}
                  </h3>

                  <div className="text-2xs text-slate-500 font-semibold flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{s.department || "Government of India"}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                    {s.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Financial Benefit</div>
                      <div className="text-sm font-black text-emerald-800">{s.benefit_display}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-medium">Window</div>
                      <div className={`text-xs font-bold flex items-center ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                        <Clock className="w-3 h-3 mr-1" /> {formatDeadlineText(s.deadline_days, lang)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenDetail(s)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1 transition-all"
                  >
                    <span>View Deep-Dive Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}
