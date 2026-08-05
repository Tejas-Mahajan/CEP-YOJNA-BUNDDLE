import React, { useState } from 'react';
import { ExternalLink, Clock, FileCheck, AlertTriangle, ThumbsUp, ThumbsDown, Info, ChevronDown, ChevronUp, CheckCircle, Search, Sparkles, Bookmark, Filter, RefreshCw, Lightbulb } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { useAuth } from '../context/AuthContext';
import { formatDeadlineText } from '../utils/validation';

// Skeleton Shimmer Loader Component
export function ActionPlanSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-200 rounded-2xl"></div>
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
                <div className="h-3 w-32 bg-slate-100 rounded"></div>
              </div>
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export default function ActionPlan({ results, onOpenDetail, onOpenFeedback, onPrintReport, lang, isEvaluating, matrixDocFilter, onResetFilters }) {
  const [filterTier, setFilterTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const { toggleSaveScheme, isSchemeSaved, isAuthenticated, setIsAuthModalOpen } = useAuth();

  if (isEvaluating) {
    return <ActionPlanSkeleton />;
  }

  if (!results || !results.ranked_schemes) return null;

  const { ranked_schemes, ineligible_schemes, conflicts_detected } = results;

  // Filter schemes
  const filteredRanked = (ranked_schemes || []).filter(r => {
    if (!r || !r.scheme) return false;
    const s = r.scheme;
    const matchesTier = filterTier === 'all' || r.priority_tier === filterTier;
    const matchesQuery = searchQuery === '' || 
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (s.shortName && s.shortName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Matrix document filter
    const matchesMatrixDoc = !matrixDocFilter || (s.required_documents && s.required_documents.includes(matrixDocFilter));

    return matchesTier && matchesQuery && matchesMatrixDoc;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSaveClick = (schemeId) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    toggleSaveScheme(schemeId);
  };

  return (
    <div className="space-y-6">
      
      {/* Mutually Exclusive Conflicts Warning Callout Card */}
      {conflicts_detected && conflicts_detected.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <AlertTriangle className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h4 className="text-lg font-bold">{t.conflictTitle}</h4>
              <p className="text-xs text-amber-100">{t.conflictDesc}</p>
            </div>
          </div>

          <div className="space-y-2">
            {conflicts_detected.map((c, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-xs space-y-1">
                <div className="font-semibold text-amber-100">
                  {lang === 'mr' ? c.reason_mr : c.reason_en}
                </div>
                <div className="flex items-center space-x-4 pt-1 font-bold">
                  <span className="text-amber-200">🏆 {t.recommendedClaim}: {c.primary_scheme_name}</span>
                  <span className="text-amber-100/70 line-through">⚠️ {t.secondaryClaim}: {c.secondary_scheme_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'mr' ? "पात्र योजनांमध्ये शोधा..." : "Search eligible schemes..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900 bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {matrixDocFilter && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Doc Filter: {matrixDocFilter}</span>
            </div>
          )}



          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
          >
            <option value="all">{lang === 'mr' ? "सर्व प्राधान्यक्रम" : "All Priorities"}</option>
            <option value="High Priority">{lang === 'mr' ? "उच्च प्राधान्य" : "High Priority (Apply First)"}</option>
            <option value="Medium Priority">{lang === 'mr' ? "मध्यम प्राधान्य" : "Medium Priority"}</option>
            <option value="Low Priority">{lang === 'mr' ? "सामान्य प्राधान्य" : "Low Priority"}</option>
          </select>

          <button
            onClick={onPrintReport}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
          >
            {t.exportPlan}
          </button>
        </div>

      </div>

      {/* Actionable Ranked Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-extrabold text-slate-900">
            {t.actionPlanTitle} ({filteredRanked.length})
          </h3>
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            {t.actionPlanDesc}
          </span>
        </div>

        {filteredRanked.length === 0 ? (
          /* Friendly Empty State UI Card */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-md">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300 shadow-sm">
              <Lightbulb className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-xl font-bold text-slate-900">No Eligible Schemes Found for Current Filters</h4>
              <p className="text-xs text-slate-500">
                Don't worry! Your profile criteria or active filters might be restricting results. Try these quick optimization tips:
              </p>
            </div>

            <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <span>🌐 Domicile State</span>
                </div>
                <div className="text-2xs text-slate-500">Set state to <strong>"Pan-India / All"</strong> to unlock national schemes.</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <span>💰 Annual Income</span>
                </div>
                <div className="text-2xs text-slate-500">Ensure income slider is within state scheme thresholds (e.g. ₹8.0 Lakh).</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <span>📄 Master Documents</span>
                </div>
                <div className="text-2xs text-slate-500">Select key documents like <strong>Aadhaar Card</strong> or <strong>Income Certificate</strong>.</div>
              </div>

            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setFilterTier('all');
                  setSearchQuery('');
                  if (onResetFilters) onResetFilters();
                }}
                className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-800/20 inline-flex items-center space-x-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset All Filters & View All Schemes</span>
              </button>
            </div>
          </div>
        ) : (
          filteredRanked.map((item, index) => {
            const s = item.scheme;
            const isExpanded = expandedId === s.id;
            const isHighPriority = item.priority_tier === 'High Priority';
            const isMediumPriority = item.priority_tier === 'Medium Priority';
            const isSecondary = item.is_mutually_exclusive_secondary;
            const saved = isSchemeSaved(s.id);

            const benefitText = (lang === 'mr' && s.benefit_display_mr) ? s.benefit_display_mr : s.benefit_display;
            const descText = (lang === 'mr' && s.description_mr) ? s.description_mr : s.description;

            return (
              <div
                key={s.id}
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-lg ${
                  isSecondary
                    ? 'border-amber-400 bg-amber-50/20'
                    : isHighPriority
                    ? 'border-emerald-300 ring-1 ring-emerald-500/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Main Row */}
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left: Step number, Priority badge, Scheme title */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-base flex-shrink-0 ${
                      isSecondary
                        ? 'bg-amber-500 text-white'
                        : isHighPriority
                        ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/30'
                        : isMediumPriority
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      #{index + 1}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase ${
                          isSecondary
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isHighPriority
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : isMediumPriority
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {isSecondary ? '⚠️ Mutually Exclusive Option' : item.priority_tier}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 uppercase">
                          Agriculture
                        </span>

                        <span className="text-xs font-semibold text-slate-500">
                          Score: <span className="text-emerald-800 font-extrabold">{item.composite_score}/100</span>
                        </span>
                      </div>

                      <h4
                        onClick={() => onOpenDetail(s)}
                        className="text-lg font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors"
                      >
                        {s.name}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2">{descText}</p>

                      {isSecondary && (
                        <div className="text-[11px] text-amber-800 font-bold bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                          ⚠️ {t.secondaryClaim}: {item.conflict_warning}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Financial Benefit & Urgency Badge */}
                  <div className="flex flex-wrap lg:flex-col items-start lg:items-end justify-between gap-2 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-semibold">{t.totalBenefitLabel}</div>
                      <div className="text-lg font-extrabold text-emerald-800">{benefitText}</div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-semibold">
                      <div className={`px-3 py-1 rounded-xl flex items-center space-x-1 ${
                        (s.deadline_days > 0 && s.deadline_days <= 10)
                          ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDeadlineText(s.deadline_days, lang)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions (Save Scheme, Apply Now, Expand) */}
                  <div className="flex items-center space-x-2 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                    
                    {/* Bookmark / Save Scheme Button */}
                    <button
                      onClick={() => handleSaveClick(s.id)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center space-x-1 ${
                        saved
                          ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={saved ? "Saved to Profile Bundle" : "Save Scheme to Profile"}
                    >
                      <Bookmark className={`w-4 h-4 ${saved ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span className="text-xs font-semibold hidden md:inline">
                        {saved ? 'Saved' : 'Save'}
                      </span>
                    </button>

                    <a
                      href={s.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center space-x-1"
                    >
                      <span>{t.applyNow}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => toggleExpand(s.id)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-slate-600"
                      title="View Details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-6 space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Document Readiness Breakdown */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                          <FileCheck className="w-4 h-4 mr-1.5 text-emerald-600" /> {t.requiredDocs} ({item.owned_documents_count}/{item.total_documents_count} {t.ready})
                        </h5>
                        <div className="space-y-1.5">
                          {(s.required_documents || []).map((doc, dIdx) => {
                            const isOwned = !(item.missing_documents || []).includes(doc);
                            return (
                              <div key={dIdx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200">
                                <span>{doc}</span>
                                {isOwned ? (
                                  <span className="text-emerald-600 font-bold flex items-center">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> {t.ready}
                                  </span>
                                ) : (
                                  <span className="text-red-500 font-semibold flex items-center">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {t.missing}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Application Steps */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Application Procedure</h5>
                        <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside">
                          {((lang === 'mr' && s.application_steps_mr && s.application_steps_mr.length > 0) ? s.application_steps_mr : (s.application_steps || [])).map((step, stIdx) => (
                            <li key={stIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                    </div>

                    {/* Feedback Rating Section */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">Was this scheme recommendation helpful?</div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpenFeedback(s.id, 'up')}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold text-slate-700 flex items-center space-x-1"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Helpful</span>
                        </button>
                        <button
                          onClick={() => onOpenFeedback(s.id, 'down')}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:border-red-300 text-xs font-bold text-slate-700 flex items-center space-x-1"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
                          <span>Needs Improvement</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
