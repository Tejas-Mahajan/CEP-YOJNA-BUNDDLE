import { formatNumberByLang } from '../data/translations';



export function validateProfile(profile, lang = 'en') {
  if (!profile) return { isValid: true, errors: {} };

  const errors = {};

  const errorMessages = {
    en: {
      incomeRequired: "Annual Income is required",
      incomeMin: "Annual income must be at least ₹10,000",
      incomeNegative: "Annual Income cannot be negative",
      incomeMax: "Annual Income exceeds maximum limit of ₹50,00,000",
      ageRequired: "Age is required",
      ageRange: "Age must be between 14 and 100 years",
      landRequired: "Land Holding size is required",
      landNegative: "Land Holding size cannot be negative",
      landMax: "Land Holding size cannot exceed 100 Acres"
    },
    mr: {
      incomeRequired: "वार्षिक उत्पन्न आवश्यक आहे",
      incomeMin: "वार्षिक उत्पन्न किमान ₹10,000 असणे आवश्यक आहे",
      incomeNegative: "वार्षिक उत्पन्न ऋण असू शकत नाही",
      incomeMax: "वार्षिक उत्पन्न कमाल मर्यादा ₹५०,००,००० पेक्षा जास्त आहे",
      ageRequired: "वय आवश्यक आहे",
      ageRange: "वय १४ ते १०० वर्षांच्या दरम्यान असावे",
      landRequired: "जमीन धारणा आकार आवश्यक आहे",
      landNegative: "जमीन धारणा आकार ऋण असू शकत नाही",
      landMax: "जमीन धारणा १०० एकरापेक्षा जास्त असू शकत नाही"
    },
    hi: {
      incomeRequired: "वार्षिक आय आवश्यक है",
      incomeMin: "वार्षिक आय कम से कम ₹10,000 होनी चाहिए",
      incomeNegative: "वार्षिक आय नकारात्मक नहीं हो सकती",
      incomeMax: "वार्षिक आय अधिकतम सीमा ₹50,00,000 से अधिक है",
      ageRequired: "आयु आवश्यक है",
      ageRange: "आयु 14 से 100 वर्ष के बीच होनी चाहिए",
      landRequired: "भूमि जोत का आकार आवश्यक है",
      landNegative: "भूमि जोत का आकार नकारात्मक नहीं हो सकता",
      landMax: "भूमि जोत का आकार 100 एकड़ से अधिक नहीं हो सकता"
    }
  };

  const msgs = errorMessages[lang] || errorMessages.en;

  // 1. Annual Income Validation - Minimum Limit ₹10,000
  if (profile.annual_income === undefined || profile.annual_income === null || profile.annual_income === '' || isNaN(profile.annual_income)) {
    errors.annual_income = msgs.incomeRequired;
  } else if (Number(profile.annual_income) < 10000) {
    errors.annual_income = msgs.incomeMin;
  } else if (Number(profile.annual_income) > 5000000) {
    errors.annual_income = msgs.incomeMax;
  }

  // 2. Age Validation
  if (profile.age === undefined || profile.age === null || profile.age === '' || isNaN(profile.age)) {
    errors.age = msgs.ageRequired;
  } else if (Number(profile.age) < 14 || Number(profile.age) > 100) {
    errors.age = msgs.ageRange;
  }

  // 3. Land Acres Validation - 0 Acres is explicitly allowed for landless farmers / agricultural laborers
  if (profile.land_acres === undefined || profile.land_acres === null || profile.land_acres === '' || isNaN(profile.land_acres)) {
    errors.land_acres = msgs.landRequired;
  } else if (Number(profile.land_acres) < 0) {
    errors.land_acres = msgs.landNegative;
  } else if (Number(profile.land_acres) > 100) {
    errors.land_acres = msgs.landMax;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Calculates days remaining from today to an ISO closing date string.
 * Returns null for year-round schemes (no closing_date).
 * Returns 0 for expired deadlines.
 */
export function daysUntilClose(closingDateStr) {
  if (!closingDateStr) return null; // year-round / FCFS

  try {
    // Parse as YYYY-MM-DD at local midnight to avoid UTC-shift issues
    const [year, month, day] = closingDateStr.split('-').map(Number);
    const closing = new Date(year, month - 1, day); // local midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.floor((closing - today) / msPerDay);
    return Math.max(0, diff);
  } catch {
    return null; // malformed — treat as year-round
  }
}

/**
 * Formats a scheme's closing_date into a human-readable deadline chip text.
 * Accepts an ISO date string (YYYY-MM-DD) or null/undefined for year-round schemes.
 */
export function formatDeadlineText(closingDateStr, lang = 'en') {
  const days = daysUntilClose(closingDateStr);

  // null → year-round scheme (no closing_date)
  if (days === null) {
    if (lang === 'mr') return 'वर्षभर खुले';
    if (lang === 'hi') return 'वर्ष भर खुला';
    return 'Open Year-Round';
  }

  // 0 → expired
  if (days === 0) {
    if (lang === 'mr') return 'मुदत संपली';
    if (lang === 'hi') return 'विंडो बंद';
    return 'Window Closed';
  }

  // > 0 → active countdown
  if (lang === 'mr') return `मुदत: ${formatNumberByLang(days, lang)} दिवस`;
  if (lang === 'hi') return `समय सीमा: ${formatNumberByLang(days, lang)} दिन`;
  return `Closes in ${days} Days`;
}
