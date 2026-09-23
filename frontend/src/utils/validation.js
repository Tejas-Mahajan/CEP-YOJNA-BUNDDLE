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
 * Helper to format deadline days into human readable text with Year-Round fallback
 */
export function formatDeadlineText(deadlineDays, lang = 'en') {
  if (!deadlineDays || deadlineDays >= 300 || deadlineDays <= 0) {
    if (lang === 'mr') return 'वर्षभर खुले';
    if (lang === 'hi') return 'वर्ष भर खुला';
    return 'Open Year-Round';
  }
  if (lang === 'mr') return `मुदत: ${deadlineDays} दिवस`;
  if (lang === 'hi') return `समय सीमा: ${deadlineDays} दिन`;
  return `Closes in ${deadlineDays} Days`;
}
