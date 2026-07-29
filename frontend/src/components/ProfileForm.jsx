import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, GraduationCap, Layers, Sparkles, ArrowRight, ArrowLeft, Check, FileCheck, User, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { PRESET_PROFILES, AVAILABLE_DOCUMENTS } from '../data/presets';
import { TRANSLATIONS } from '../data/translations';
import { validateProfile } from '../utils/validation';

export default function ProfileForm({ profile, setProfile, onSubmit, isEvaluating, lang }) {
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3
  const [validationErrors, setValidationErrors] = useState({});
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleDomainChange = (newDomain) => {
    setProfile(prev => {
      const updated = { ...prev, domain: newDomain };
      
      // Clear domain-specific fields when switching
      if (newDomain === 'education') {
        updated.land_acres = 0;
      } else if (newDomain === 'agriculture') {
        updated.marks_percentage = 60;
        updated.course_level = 'Undergraduate';
      }

      // Re-validate updated profile
      const validation = validateProfile(updated);
      setValidationErrors(validation.errors);

      return updated;
    });
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
      const validation = validateProfile(updated);
      setValidationErrors(validation.errors);
      return updated;
    });
  };

  const toggleDocument = (doc) => {
    setProfile(prev => {
      const owned = prev.owned_documents || [];
      const updatedDocs = owned.includes(doc)
        ? owned.filter(d => d !== doc)
        : [...owned, doc];
      return { ...prev, owned_documents: updatedDocs };
    });
  };

  const handleSelectAllDocs = () => {
    setProfile(prev => ({ ...prev, owned_documents: [...AVAILABLE_DOCUMENTS] }));
  };

  const handleClearAllDocs = () => {
    setProfile(prev => ({ ...prev, owned_documents: [] }));
  };

  const loadPreset = (presetData) => {
    setProfile({ ...presetData });
    setValidationErrors({});
  };

  const handleFormSubmitWithValidation = (e) => {
    e.preventDefault();
    const validation = validateProfile(profile);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    onSubmit(e);
  };

  const steps = [
    { number: 1, title: t.step1Title || "Sector & Domicile", subtitle: "Select Domain & Domicile State" },
    { number: 2, title: t.step2Title || "Income & Criteria", subtitle: "Set Income, Land & Academic Details" },
    { number: 3, title: t.step3Title || "Document Checklist", subtitle: "Select Possessed Master Documents" }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      
      {/* Preset Quick Fill Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> {t.demoTesterTitle}
            </div>
            <h2 className="text-xl font-bold">{t.demoTesterTitle}</h2>
            <p className="text-xs text-emerald-200">{t.demoTesterDesc}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESET_PROFILES.map(p => (
              <motion.button
                key={p.id}
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => loadPreset(p.data)}
                className="text-left px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-xs font-medium backdrop-blur-md group shadow-sm"
              >
                <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">{p.label}</div>
                <div className="text-[10px] text-emerald-200 truncate">{p.subtitle}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual 1-2-3 Progress Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setCurrentStep(step.number)}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 ${
                  isActive
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-300 hover:bg-slate-100'
                    : 'bg-slate-50/40 border-slate-200 text-slate-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : isCompleted
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>

                <div className="text-center sm:text-left hidden sm:block">
                  <div className={`text-xs font-extrabold ${isActive ? 'text-emerald-950' : 'text-slate-700'}`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {step.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Profile Form Card */}
      <form onSubmit={handleFormSubmitWithValidation} className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-8">
        
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Domain & Personal Domicile */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Domain Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center border border-emerald-300">1</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t.step1Title}</h3>
                    <p className="text-xs text-slate-500">Select target sector for scheme bundling</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDomainChange('agriculture')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between space-y-3 ${
                      profile.domain === 'agriculture'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.domain === 'agriculture' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Sprout className="w-5 h-5" />
                      </div>
                      {profile.domain === 'agriculture' && <Check className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{t.agriTitle}</div>
                      <div className="text-xs text-slate-500 mt-1">{t.agriDesc}</div>
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDomainChange('education')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between space-y-3 ${
                      profile.domain === 'education'
                        ? 'border-teal-600 bg-teal-50/80 shadow-md ring-2 ring-teal-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.domain === 'education' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      {profile.domain === 'education' && <Check className="w-5 h-5 text-teal-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{t.eduTitle}</div>
                      <div className="text-xs text-slate-500 mt-1">{t.eduDesc}</div>
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDomainChange('both')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between space-y-3 ${
                      profile.domain === 'both'
                        ? 'border-slate-800 bg-slate-100/80 shadow-md ring-2 ring-slate-800/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.domain === 'both' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Layers className="w-5 h-5" />
                      </div>
                      {profile.domain === 'both' && <Check className="w-5 h-5 text-slate-900" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{t.bothTitle}</div>
                      <div className="text-xs text-slate-500 mt-1">{t.bothDesc}</div>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Domicile State & Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t.domicileStateLabel}</label>
                  <select
                    value={profile.state || 'Maharashtra'}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="All">Pan-India / All States</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t.categoryLabel}</label>
                  <select
                    value={profile.category || 'General'}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="General">General (खुला)</option>
                    <option value="OBC">OBC (इतर मागासवर्ग)</option>
                    <option value="SC">SC (अनुसूचित जाती)</option>
                    <option value="ST">ST (अनुसूचित जमाती)</option>
                    <option value="EWS">EWS (आर्थिकदृष्ट्या दुर्बल)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t.ageLabel}</label>
                  <input
                    type="number"
                    min="14"
                    max="100"
                    value={profile.age ?? 25}
                    onChange={(e) => handleInputChange('age', Number(e.target.value))}
                    className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold text-slate-900 focus:ring-2 outline-none ${
                      validationErrors.age ? 'border-red-400 bg-red-50/50 focus:ring-red-500' : 'border-slate-200 bg-slate-50/50 focus:ring-emerald-500'
                    }`}
                  />
                  {validationErrors.age && (
                    <div className="text-red-600 text-2xs font-bold mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" /> {validationErrors.age}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Financial & Eligibility Parameters */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center border border-emerald-300">2</span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t.step2Title}</h3>
                  <p className="text-xs text-slate-500">Provide family income, landholding, and academic metrics</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Annual Income */}
                <div className="space-y-2 p-5 rounded-2xl bg-slate-50/60 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.incomeLabel}</label>
                    <span className="text-sm font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300">
                      ₹{(profile.annual_income || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1500000"
                    step="25000"
                    value={profile.annual_income || 0}
                    onChange={(e) => handleInputChange('annual_income', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>₹0</span>
                    <span>₹8.0 Lakh (EWS Limit)</span>
                    <span>₹15 Lakhs</span>
                  </div>
                  {validationErrors.annual_income && (
                    <div className="text-red-600 text-2xs font-bold mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" /> {validationErrors.annual_income}
                    </div>
                  )}
                </div>

                {/* Land Holding for Farmers */}
                {(profile.domain === 'agriculture' || profile.domain === 'both') && (
                  <div className="space-y-2 p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider">{t.landAcresLabel}</label>
                      <span className="text-sm font-black text-emerald-900 bg-white px-3 py-1 rounded-xl border border-emerald-300">
                        {profile.land_acres || 0} Acres
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="0.5"
                      value={profile.land_acres || 0}
                      onChange={(e) => handleInputChange('land_acres', Number(e.target.value))}
                      className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-emerald-700 font-medium">
                      <span>0 Acres</span>
                      <span>5 Acres (Small Farmer)</span>
                      <span>25 Acres</span>
                    </div>
                    {validationErrors.land_acres && (
                      <div className="text-red-600 text-2xs font-bold mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> {validationErrors.land_acres}
                      </div>
                    )}
                  </div>
                )}

                {/* Academic Metrics for Students */}
                {(profile.domain === 'education' || profile.domain === 'both') && (
                  <>
                    <div className="space-y-2 p-5 rounded-2xl bg-teal-50/40 border border-teal-200">
                      <label className="block text-xs font-bold text-teal-950 uppercase tracking-wider mb-2">{t.courseLevelLabel}</label>
                      <select
                        value={profile.course_level || 'Undergraduate'}
                        onChange={(e) => handleInputChange('course_level', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-teal-300 bg-white text-xs font-bold text-teal-950 focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="High School">High School (10th/12th)</option>
                        <option value="Diploma">Diploma Technical</option>
                        <option value="Undergraduate">Undergraduate (B.Sc, B.A, B.Com)</option>
                        <option value="Engineering">Engineering / Technology</option>
                        <option value="Medical">Medical / Pharmacy</option>
                      </select>
                    </div>

                    <div className="space-y-2 p-5 rounded-2xl bg-teal-50/40 border border-teal-200">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-teal-950 uppercase tracking-wider">{t.marksLabel}</label>
                        <span className="text-sm font-black text-teal-950 bg-white px-3 py-1 rounded-xl border border-teal-300">
                          {profile.marks_percentage || 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="100"
                        step="1"
                        value={profile.marks_percentage || 60}
                        onChange={(e) => handleInputChange('marks_percentage', Number(e.target.value))}
                        className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                      {validationErrors.marks_percentage && (
                        <div className="text-red-600 text-2xs font-bold mt-1 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" /> {validationErrors.marks_percentage}
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            </motion.div>
          )}

          {/* STEP 3: Master Document Readiness Checklist */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center border border-emerald-300">3</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t.step3Title}</h3>
                    <p className="text-xs text-slate-500">Select all documents you currently possess</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAllDocs}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold transition-all"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllDocs}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Master Document Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_DOCUMENTS.map((doc, idx) => {
                  const isOwned = (profile.owned_documents || []).includes(doc);
                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleDocument(doc)}
                      className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                        isOwned
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <FileCheck className={`w-4 h-4 ${isOwned ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{doc}</span>
                      </span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isOwned ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                        {isOwned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Selected {profile.owned_documents?.length || 0} master documents. Ready to generate optimized scheme bundle!</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
          ) : <div />}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-800/20 flex items-center space-x-1.5 transition-all"
            >
              <span>Next: {currentStep === 1 ? 'Income & Criteria' : 'Document Checklist'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isEvaluating || Object.keys(validationErrors).length > 0}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-white font-black text-sm shadow-xl shadow-emerald-800/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEvaluating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.evaluateBtn}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}

        </div>

      </form>
    </div>
  );
}
