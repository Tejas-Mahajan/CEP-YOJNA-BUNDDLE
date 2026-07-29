import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Lock, User, ShieldCheck, Sparkles, Sprout, ArrowRight, CheckCircle2, Languages, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, lang = 'en', setLang, onGuestContinue }) {
  const { login, signup } = useAuth();

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authTab, setAuthTab] = useState('phone'); // 'phone' or 'email'
  
  // Form fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Farmer'); // 'Farmer', 'Student', 'Both'

  // Signup Profile Attributes
  const [income, setIncome] = useState(180000);
  const [landAcres, setLandAcres] = useState(2.5);
  const [stateName, setStateName] = useState('Maharashtra');
  const [category, setCategory] = useState('OBC');
  const [courseLevel, setCourseLevel] = useState('Undergraduate');

  // OTP flow simulation for phone auth
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit Mobile Number");
      return;
    }
    setErrorMsg('');
    setOtpSent(true);
    setOtpCode('123456'); // Pre-fill mock OTP for smooth demo experience
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const identifier = authTab === 'phone' ? phone : email;
        if (!identifier) {
          throw new Error(`Please enter your ${authTab === 'phone' ? 'mobile number' : 'email address'}`);
        }
        await login({ identifier, password, method: authTab });
      } else {
        if (!name.trim()) {
          throw new Error("Please enter your Full Name");
        }
        const identifier = authTab === 'phone' ? phone : email;
        if (!identifier) {
          throw new Error(`Please enter your ${authTab === 'phone' ? 'mobile number' : 'email address'}`);
        }
        await signup({
          name,
          identifier,
          password,
          method: authTab,
          role,
          profileAttributes: {
            domain: role === 'Student' ? 'education' : (role === 'Farmer' ? 'agriculture' : 'both'),
            annual_income: Number(income),
            land_acres: Number(landAcres),
            state: stateName,
            category: category,
            course_level: courseLevel,
            occupation: role,
            owned_documents: ['Aadhaar Card', 'Bank Passbook']
          }
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (presetType) => {
    login({ userPreset: presetType });
    onClose();
  };

  const handleGuestClick = () => {
    if (onGuestContinue) {
      onGuestContinue();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Dialog Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-8"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-6 text-white relative">
            
            {/* Top Bar with Language Selector & Close Button */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-800/60">
              <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-xl border border-white/15">
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <select
                  value={lang}
                  onChange={(e) => setLang && setLang(e.target.value)}
                  className="bg-transparent text-white font-extrabold text-xs outline-none cursor-pointer"
                >
                  <option value="en" className="bg-slate-900 text-white">🇬🇧 English</option>
                  <option value="mr" className="bg-slate-900 text-white">🚩 मराठी</option>
                  <option value="hi" className="bg-slate-900 text-white">🇮🇳 हिंदी</option>
                </select>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <Sprout className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {authMode === 'login' ? 'Welcome to YojanaBundle' : 'Create Your Profile'}
                </h2>
                <p className="text-xs text-emerald-200">
                  {authMode === 'login' ? 'Access saved schemes & personalized bundles' : 'Store your attributes for instant scheme eligibility'}
                </p>
              </div>
            </div>

            {/* Quick Demo Login Badges */}
            <div className="mt-4 pt-3 border-t border-emerald-700/50 flex flex-wrap gap-2">
              <span className="text-xs text-emerald-300 font-semibold self-center mr-1">Quick Demo Login:</span>
              <button
                type="button"
                onClick={() => handleDemoLogin('farmer')}
                className="px-3 py-1 rounded-full bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/50 text-xs font-semibold text-white flex items-center space-x-1 transition-all"
              >
                <span>🌾 Farmer (Ramesh)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="px-3 py-1 rounded-full bg-teal-700/80 hover:bg-teal-600 border border-teal-500/50 text-xs font-semibold text-white flex items-center space-x-1 transition-all"
              >
                <span>🎓 Student (Priya)</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Mode Switcher: Login / Signup */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-emerald-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  authMode === 'signup'
                    ? 'bg-white text-emerald-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign Up & Save Profile
              </button>
            </div>

            {/* Auth Tab Switcher: Phone Number / Email */}
            <div className="flex items-center space-x-4 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => { setAuthTab('phone'); setOtpSent(false); setErrorMsg(''); }}
                className={`flex items-center space-x-2 text-xs sm:text-sm font-bold pb-1 transition-all border-b-2 ${
                  authTab === 'phone'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthTab('email'); setErrorMsg(''); }}
                className={`flex items-center space-x-2 text-xs sm:text-sm font-bold pb-1 transition-all border-b-2 ${
                  authTab === 'email'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email + Password</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name in Signup Mode */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh V. Patil"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Role Selection in Signup Mode */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Occupation / Profile</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Farmer', 'Student', 'Both'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          role === r
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r === 'Farmer' ? '🌾 Farmer' : r === 'Student' ? '🎓 Student' : '🤝 Both'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone Tab Inputs */}
              {authTab === 'phone' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <div className="flex space-x-2">
                    <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex items-center">
                      +91
                    </div>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* OTP Step if clicked Send OTP */}
                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span>Enter 6-Digit OTP</span>
                        <span className="text-emerald-700 font-normal">Sent to +91 {phone}</span>
                      </div>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-emerald-300 text-sm tracking-widest font-mono font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Email Tab Inputs */}
              {authTab === 'email' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-12 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Action Button */}
              {authTab === 'phone' && !otpSent && authMode === 'login' ? (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 flex items-center justify-center space-x-2 transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === 'login' ? 'Log In & Continue' : 'Create Account & Save'}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

            </form>

            {/* Bottom CTA: Continue as Guest */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleGuestClick}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Continue as Guest ➔</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
