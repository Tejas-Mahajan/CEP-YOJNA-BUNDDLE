/**
 * Frontend Validation Module for YojanaBundle Profile Data
 * Scoped to Agriculture and Farming Profile Inputs
 */

export function validateProfile(profile) {
  if (!profile) return { isValid: true, errors: {} };

  const errors = {};

  // 1. Annual Income Validation
  if (profile.annual_income === undefined || profile.annual_income === null || isNaN(profile.annual_income)) {
    errors.annual_income = "Annual Income is required";
  } else if (profile.annual_income < 0) {
    errors.annual_income = "Annual Income cannot be negative";
  } else if (profile.annual_income > 5000000) {
    errors.annual_income = "Annual Income exceeds maximum limit of ₹50,00,000";
  }

  // 2. Age Validation
  if (profile.age === undefined || profile.age === null || isNaN(profile.age)) {
    errors.age = "Age is required";
  } else if (profile.age < 14 || profile.age > 100) {
    errors.age = "Age must be between 14 and 100 years";
  }

  // 3. Land Acres Validation
  if (profile.land_acres === undefined || profile.land_acres === null || isNaN(profile.land_acres)) {
    errors.land_acres = "Land Holding size is required";
  } else if (profile.land_acres < 0) {
    errors.land_acres = "Land Holding size cannot be negative";
  } else if (profile.land_acres > 100) {
    errors.land_acres = "Land Holding size cannot exceed 100 Acres";
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
  if (lang === 'mr') return `मुदत: ${days} दिवस`;
  if (lang === 'hi') return `समय सीमा: ${days} दिन`;
  return `Closes in ${days} Days`;
}
