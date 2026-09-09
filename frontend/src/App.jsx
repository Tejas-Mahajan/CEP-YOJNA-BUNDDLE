import React, { useState, useEffect, useRef } from 'react';
import { Home, User, FileText, Sparkles, Menu, X, ChevronDown, Download, Check, Copy, AlertCircle, Info, MapPin, Eye, EyeOff, Bookmark, Search, Building2, Clock, ExternalLink } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProfileForm from './components/ProfileForm';
import SummaryCards from './components/SummaryCards';
import OverlapSection from './components/OverlapSection';
import ActionPlan from './components/ActionPlan';
import SchemeDirectory from './components/SchemeDirectory';
import SchemeComparisonModal from './components/SchemeComparisonModal';
import CscLocator from './components/CscLocator';
import SchemeModal from './components/SchemeModal';
import FeedbackModal from './components/FeedbackModal';
import ExportReport from './components/ExportReport';
import IntroAnimation from './components/IntroAnimation';
import AuthModal from './components/AuthModal';
import WelcomeScreen from './components/WelcomeScreen';
import WelcomeBar from './components/WelcomeBar';
import FloatingSummaryBar from './components/FloatingSummaryBar';
import MobileDrawer from './components/MobileDrawer';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { formatDeadlineText } from './utils/validation';

function MainAppContent() {
  // App Flow State Machine: 'INTRO' -> 'AUTH' -> 'WELCOME' -> 'DASHBOARD'
  const [appFlowState, setAppFlowState] = useState('INTRO');
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [activeNav, setActiveNav] = useState('matcher'); // 'matcher', 'plan', 'vault', 'directory', 'csc', 'export'
  const [lang, setLang] = useState('en'); // 'en', 'mr', 'hi'
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState(null);
  const [detailScheme, setDetailScheme] = useState(null);
  const [comparePair, setComparePair] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Matrix Filter State
  const [matrixDocFilter, setMatrixDocFilter] = useState(null);

  const BLANK_PROFILE = {
    annual_income: 0,
    category: 'General',
    state: 'Maharashtra',
    age: 25,
    land_acres: 0,
    occupation: 'Farmer',
    owned_documents: []
  };

  const { user, isAuthenticated, isAuthModalOpen, setIsAuthModalOpen, updateUserProfileAttributes, savedSchemes: savedSchemeIds, toggleSaveScheme } = useAuth();

  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch('/api/schemes');
        if (res.ok) {
          const data = await res.json();
          setSchemes(data.schemes || []);
        }
      } catch (err) {
        console.warn("Failed to load schemes:", err);
      }
    };
    fetchSchemes();
  }, []);

  const savedSchemes = schemes.filter(scheme => (savedSchemeIds || []).includes(scheme.id));

  const hasSavedProfile = Boolean(user && user.profileAttributes && Object.keys(user.profileAttributes).length > 0);
  const isFirstTimeSetup = Boolean(isAuthenticated && !hasSavedProfile);

  // Initialize profile with blank structure by default
  const [profile, setProfile] = useState(BLANK_PROFILE);

  // Ref to track active evaluate debounce timer
  const debounceTimerRef = useRef(null);

  // Synchronize profile state when logged in user changes
  useEffect(() => {
    if (user && user.profileAttributes && Object.keys(user.profileAttributes).length > 0) {
      setProfile((prev) => ({
        ...prev,
        ...user.profileAttributes
      }));
    } else if (user) {
      // New user signup without saved attributes -> start blank & force matcher tab
      setProfile(BLANK_PROFILE);
      setActiveNav('matcher');
    }
  }, [user]);


  // Core profile evaluation function
  const evaluateProfile = async (profileData) => {
    setIsEvaluating(true);
    setApiError(null);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
      if (activeNav === 'matcher') {
        setActiveNav('plan');
      }
    } catch (err) {
      console.warn("Backend API call failed, using client-side fallback engine...", err);
      setApiError("Backend server disconnected");
      fallbackClientEvaluation(profileData);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Run initial evaluation on load
  useEffect(() => {
    evaluateProfile(profile);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (isAuthenticated && updateUserProfileAttributes) {
      const saveRes = await updateUserProfileAttributes(profile);
      if (saveRes && !saveRes.success) {
        console.error("Failed to save profile attributes to backend database:", saveRes.error);
      }
    }
    evaluateProfile(profile);
  };

  const handleReset = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setProfile(BLANK_PROFILE);
    evaluateProfile(BLANK_PROFILE);
  };


  const handleFeedbackSubmit = async (feedbackPayload) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload)
      });
    } catch (err) {
      console.error("Feedback logging error:", err);
    }
  };

  // Client side fallback evaluation
  const fallbackClientEvaluation = (p) => {
    const mockRanked = [];
    const conflicts = [];

    if ((p.annual_income || 0) <= 800000) {
      mockRanked.push({
        scheme: {
          id: "PM_KISAN",
          name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
          shortName: "PM-KISAN",
          department: "Ministry of Agriculture & Farmers Welfare",
          quota_type: "Central Sector Scheme (100% Central)",
          benefit_display: "₹6,000 / year in 3 installments",
          benefit_display_mr: "दरवर्षी ₹६,००० (३ हप्ते)",
          benefit_amount: 6000,
          deadline_days: 15,
          required_documents: ["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook", "Income Certificate"],
          documents_required: ["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook", "Income Certificate"],
          official_url: "https://pmkisan.gov.in",
          description: "Financial support to all landholding farmer families across the country.",
          description_mr: "देशातील सर्व भूधारक शेतकरी कुटुंबांना आर्थिक मदतीचा हात.",
          application_steps: ["Register on PM-KISAN portal", "Upload land records", "Complete e-KYC"]
        },
        composite_score: 92.5,
        priority_tier: "High Priority",
        owned_documents_count: (p.owned_documents || []).filter(d => ["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"].includes(d)).length,
        total_documents_count: 4,
        missing_documents: ["Income Certificate"].filter(d => !(p.owned_documents || []).includes(d)),
        is_mutually_exclusive_secondary: false
      });

      mockRanked.push({
        scheme: {
          id: "PMFBY",
          name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
          shortName: "PM Fasal Bima",
          department: "Ministry of Agriculture & Farmers Welfare",
          quota_type: "Central & State Sponsored (50:50)",
          benefit_display: "Comprehensive Crop Insurance Support",
          benefit_display_mr: "सर्वसमावेशक पीक विमा संरक्षण",
          benefit_amount: 25000,
          deadline_days: 20,
          required_documents: ["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"],
          documents_required: ["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"],
          official_url: "https://pmfby.gov.in",
          description: "Financial support to farmers suffering crop loss/damage arising out of unforeseen events.",
          description_mr: "नैसर्गिक आपत्तीमुळे पिकांचे नुकसान झाल्यास नुकसान भरपाई.",
          application_steps: ["Apply via PMFBY portal or CSC", "Submit Sowing Certificate", "Pay nominal premium"]
        },
        composite_score: 85.0,
        priority_tier: "High Priority",
        owned_documents_count: 3,
        total_documents_count: 3,
        missing_documents: [],
        is_mutually_exclusive_secondary: false
      });
    }

    const totalBenefit = mockRanked.reduce((acc, curr) => acc + curr.scheme.benefit_amount, 0);

    setResults({
      total_eligible_schemes: mockRanked.length,
      total_potential_benefit: totalBenefit,
      formatted_potential_benefit: `₹${totalBenefit.toLocaleString('en-IN')}`,
      document_readiness_pct: 80.0,
      ranked_schemes: mockRanked,
      ineligible_schemes: [],
      conflicts_detected: conflicts,
      document_insights: [
        {
          document_name: "Aadhaar Identity Card",
          canonical_group: "Aadhaar Identity Card",
          unlocked_schemes_count: 4,
          scheme_names: ["PM-KISAN", "PMFBY", "PM-KUSUM", "SMAM"],
          is_owned: (p.owned_documents || []).includes("Aadhaar Card"),
          efficiency_tag: "⚡ High Leverage (Key Master Document)"
        },
        {
          document_name: "7/12 Land Record Extract",
          canonical_group: "7/12 Land Record Extract",
          unlocked_schemes_count: 3,
          scheme_names: ["PM-KISAN", "PMFBY", "SMAM Machinery"],
          is_owned: (p.owned_documents || []).includes("7/12 Land Record Extract"),
          efficiency_tag: "⚡ High Leverage (Agri Master Document)"
        }
      ],
      high_leverage_callouts: [
        "🔥 Key Document Highlight: 'Aadhaar Identity Card' unlocks 4 agriculture schemes at once!",
        "🔥 Key Document Highlight: 'Land Ownership Proof (7/12 Extract)' unlocks 3 agriculture schemes!"
      ],
      action_checklist: mockRanked.map((r, i) => ({
        step: i + 1,
        scheme_name: r.scheme.name,
        priority_tier: r.priority_tier,
        benefit_display: r.scheme.benefit_display,
        deadline_days: r.scheme.deadline_days,
        missing_documents: r.missing_documents,
        official_url: r.scheme.official_url
      }))
    });
    if (activeNav === 'matcher') {
      setActiveNav('plan');
    }
  };

  const resultsCount = results ? (results.total_eligible_schemes || 0) : 0;

  // Render STEP 1: INTRO ANIMATION
  if (appFlowState === 'INTRO') {
    return (
      <IntroAnimation
        onAnimationComplete={() => setAppFlowState('AUTH')}
      />
    );
  }

  // Render STEP 2: LOGIN / SIGNUP MODAL OVER FULL-SCREEN CONTAINER
  if (appFlowState === 'AUTH') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <AuthModal
          isOpen={true}
          onClose={() => setAppFlowState('WELCOME')}
          lang={lang}
          setLang={setLang}
          onGuestContinue={() => {
            setIsGuestMode(true);
            setAppFlowState('WELCOME');
          }}
        />
      </div>
    );
  }

  // Render STEP 3: PERSONALIZED WELCOME SCREEN TRANSITION
  if (appFlowState === 'WELCOME') {
    return (
      <WelcomeScreen
        isGuest={isGuestMode}
        onComplete={() => setAppFlowState('DASHBOARD')}
      />
    );
  }

  // Render STEP 4: MAIN DASHBOARD & PORTAL LANDING ZONE
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative pb-24">

      {/* Top Navigation Header */}
      <Header
        lang={lang}
        setLang={setLang}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onGoHome={() => setActiveNav('matcher')}
      />

      {/* Personalized Welcome Bar (When Logged In) */}
      <WelcomeBar />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {apiError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-600 text-white shadow-xl border border-red-700 text-sm font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div>Backend unreachable — showing offline demo data, not your real results.</div>
                <div className="text-xs text-red-200 font-medium">Error details: {apiError}</div>
              </div>
            </div>
            <button
              onClick={() => evaluateProfile(profile)}
              className="ml-4 px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded-xl text-xs font-extrabold shadow transition-all whitespace-nowrap"
            >
              Retry Connection
            </button>
          </div>
        )}


        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Dashboard Sidebar Navigation */}
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            activeTab={activeNav}
            setActiveTab={setActiveNav}
            resultsCount={resultsCount}
            lang={lang}
            onGoHome={() => setActiveNav('matcher')}
            isFirstTimeSetup={isFirstTimeSetup}
          />

          {/* Dashboard Main Content Panel */}
          <div className="flex-1 w-full min-w-0">

            {/* TAB 1: Dashboard & Eligibility Matcher */}
            {activeNav === 'matcher' && (
              <div className="space-y-6">

                {/* First-Time Setup Welcome Banner */}
                {isFirstTimeSetup && (
                  <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/60 flex items-center space-x-4 animate-in fade-in duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300 flex-shrink-0 backdrop-blur-md">
                      <Sparkles className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white">👋 Welcome, {user?.name || 'Farmer'}! Let's find your scheme matches</h3>
                      <p className="text-xs text-emerald-200 mt-1">
                        Fill in your profile details below to see your personalized scheme action plan. All other portal sections will unlock immediately after submission.
                      </p>
                    </div>
                  </div>
                )}

                <ErrorBoundary fallbackMessage="An error occurred inside the Profile Form component.">
                  <ProfileForm
                    profile={profile}
                    setProfile={setProfile}
                    onSubmit={handleFormSubmit}
                    isEvaluating={isEvaluating}
                    lang={lang}
                  />
                </ErrorBoundary>
              </div>
            )}

            {/* TAB 2: 'Apply First' Ranked Action Plan */}
            {activeNav === 'plan' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {results && (
                  <ErrorBoundary fallbackMessage="Unable to render summary metrics cards.">
                    <SummaryCards results={results} lang={lang} />
                  </ErrorBoundary>
                )}

                <ErrorBoundary fallbackMessage="Unable to render Action Checklist component.">
                  <ActionPlan
                    results={results}
                    onOpenDetail={(scheme) => setDetailScheme(scheme)}
                    onOpenFeedback={(schemeId, defaultRating) => setFeedbackState({ schemeId, defaultRating })}
                    onPrintReport={() => setActiveNav('export')}
                    lang={lang}
                    isEvaluating={isEvaluating}
                    matrixDocFilter={matrixDocFilter}
                    onResetFilters={() => setMatrixDocFilter(null)}
                  />
                </ErrorBoundary>
              </div>
            )}

            {/* TAB 3: Document Vault & Overlap Detector */}
            {activeNav === 'vault' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {results && (
                  <ErrorBoundary fallbackMessage="Unable to render Document Overlap Matrix component.">
                    <OverlapSection
                      insights={results.document_insights}
                      callouts={results.high_leverage_callouts}
                      lang={lang}
                      onSelectDocumentFilter={(docName) => {
                        setMatrixDocFilter(docName);
                        setActiveNav('plan');
                      }}
                    />
                  </ErrorBoundary>
                )}
              </div>
            )}

            {/* TAB 4: Scheme Search & Directory */}
            {activeNav === 'directory' && (
              <ErrorBoundary fallbackMessage="Unable to render Scheme Directory.">
                <SchemeDirectory
                  onOpenDetail={(scheme) => setDetailScheme(scheme)}
                  onOpenCompare={(s1, s2) => setComparePair({ scheme1: s1, scheme2: s2 })}
                  lang={lang}
                />
              </ErrorBoundary>
            )}

            {/* TAB 5: CSC / Offline Help Locator */}
            {activeNav === 'csc' && (
              <ErrorBoundary fallbackMessage="Unable to render CSC Locator.">
                <CscLocator lang={lang} />
              </ErrorBoundary>
            )}

            {/* TAB 6: Export Report View */}
            {activeNav === 'export' && results && (
              <ErrorBoundary fallbackMessage="Unable to render Export Report component.">
                <ExportReport
                  results={results}
                  profile={profile}
                  onBack={() => setActiveNav('plan')}
                  lang={lang}
                />
              </ErrorBoundary>
            )}

            {/* TAB 7: Saved Schemes View */}
            {(activeNav === 'SAVED') && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div>
                      <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">
                        <Bookmark className="w-4 h-4 fill-amber-400" /> Bookmarked Schemes Vault
                      </div>
                      <h2 className="text-2xl font-black">Your Saved Schemes ({savedSchemes.length})</h2>
                      <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                        Quick access to your saved agriculture & welfare schemes. Compare benefits or view deep-dive details.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav('directory')}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition-all self-start sm:self-center cursor-pointer"
                    >
                      Explore All Schemes
                    </button>
                  </div>
                </div>

                {savedSchemes.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-md">
                    <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300 shadow-sm">
                      <Bookmark className="w-8 h-8 fill-amber-500 text-amber-600" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="text-xl font-bold text-slate-900">No Saved Schemes Yet</h4>
                      <p className="text-xs text-slate-500">
                        You haven't saved any schemes yet. Click the bookmark icon on any scheme card in the Directory or Action Plan to add it here.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => setActiveNav('directory')}
                        className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-800/20 inline-flex items-center space-x-2 transition-all cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                        <span>Browse All Schemes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedSchemes.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setDetailScheme(s)}
                        className="bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 shadow-md p-6 flex flex-col justify-between space-y-4 cursor-pointer transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 uppercase">
                              Agriculture
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveScheme(s.id);
                              }}
                              className="p-1.5 rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors"
                              title="Remove from Saved"
                            >
                              <Bookmark className="w-4 h-4 fill-amber-500 text-amber-500" />
                            </button>
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
                              <div className="text-xs font-bold text-amber-600 flex items-center justify-end">
                                <Clock className="w-3 h-3 mr-1" /> {formatDeadlineText(s.deadline_days, lang)}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setDetailScheme(s)}
                            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1 transition-all"
                          >
                            <span>View Deep-Dive Details</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Sticky Bottom Floating Smart Summary Bar */}
      {results && activeNav !== 'home' && activeNav !== 'matcher' && (
        <FloatingSummaryBar
          results={results}
          onScrollToPlan={() => setActiveNav('plan')}
          onExportReport={() => setActiveNav('export')}
          lang={lang}
        />
      )}


      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeNav}
        setActiveTab={setActiveNav}
        profile={profile}
        setProfile={setProfile}
        lang={lang}
        setLang={setLang}
        onReset={handleReset}
        isFirstTimeSetup={isFirstTimeSetup}
      />


      {/* Explicit Auth Modal Trigger when user clicks login from dashboard */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          lang={lang}
          setLang={setLang}
        />
      )}

      {/* Enhanced 5-Tab Scheme Detail Modal */}
      {detailScheme && (
        <SchemeModal
          scheme={detailScheme}
          onClose={() => setDetailScheme(null)}
          allInsights={results ? results.document_insights : []}
        />
      )}

      {/* Side-by-Side Scheme Comparison Modal */}
      {comparePair && (
        <SchemeComparisonModal
          scheme1={comparePair.scheme1}
          scheme2={comparePair.scheme2}
          onClose={() => setComparePair(null)}
        />
      )}

      {/* Feedback Modal */}
      {feedbackState && (
        <FeedbackModal
          schemeId={feedbackState.schemeId}
          defaultRating={feedbackState.defaultRating}
          onClose={() => setFeedbackState(null)}
          onSubmitFeedback={handleFeedbackSubmit}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-medium">
          YojanaBundle — Smart Scheme Bundling & Document Optimization Planner © 2026
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
