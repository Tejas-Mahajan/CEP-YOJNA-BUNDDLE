import React, { useState, useEffect, useRef } from 'react';
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
import { PRESET_PROFILES } from './data/presets';

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

  const { user, isAuthenticated, isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  // Initialize profile with Small Farmer preset
  const [profile, setProfile] = useState(PRESET_PROFILES[0].data);

  // Ref to track active evaluate debounce timer
  const debounceTimerRef = useRef(null);

  // Synchronize profile state when logged in user changes
  useEffect(() => {
    if (user && user.profileAttributes) {
      setProfile((prev) => ({
        ...prev,
        ...user.profileAttributes
      }));
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
      setApiError("Using local evaluation mode (Backend server disconnected)");
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    evaluateProfile(profile);
  };

  const handleReset = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setProfile(PRESET_PROFILES[0].data);
    evaluateProfile(PRESET_PROFILES[0].data);
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
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
            <span>⚠️ {apiError}</span>
            <button onClick={() => evaluateProfile(profile)} className="underline hover:text-amber-950">Retry Connection</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Dashboard Sidebar Navigation */}
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            resultsCount={resultsCount}
            lang={lang}
            onGoHome={() => setActiveNav('matcher')}
          />

          {/* Dashboard Main Content Panel */}
          <div className="flex-1 w-full min-w-0">
            
            {/* TAB 1: Dashboard & Eligibility Matcher */}
            {activeNav === 'matcher' && (
              <div className="space-y-6">
                <ErrorBoundary fallbackMessage="An error occurred inside the Profile Form component.">
                  <ProfileForm
                    profile={profile}
                    setProfile={setProfile}
                    onSubmit={handleFormSubmit}
                    isEvaluating={isEvaluating}
                    lang={lang}
                  />
                </ErrorBoundary>

                {results && (
                  <ErrorBoundary fallbackMessage="Unable to render summary metrics cards.">
                    <SummaryCards results={results} lang={lang} />
                  </ErrorBoundary>
                )}
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

          </div>

        </div>

      </main>

      {/* Sticky Bottom Floating Smart Summary Bar */}
      {results && activeNav !== 'home' && (
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
