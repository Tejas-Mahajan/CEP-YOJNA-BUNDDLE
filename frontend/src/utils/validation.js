/**
 * Frontend Validation Module for YojanaBundle Profile Data
 * Scoped dynamically based on active domain (Agriculture / Education / Both)
 */

export function validateProfile(profile) {
  if (!profile) return { isValid: true, errors: {} };

  const errors = {};
  const domain = profile.domain || 'both';

  // 1. Annual Income Validation (Applies to all domains)
  if (profile.annual_income === undefined || profile.annual_income === null || isNaN(profile.annual_income)) {
    errors.annual_income = "Annual Income is required";
  } else if (profile.annual_income < 0) {
    errors.annual_income = "Annual Income cannot be negative";
  } else if (profile.annual_income > 5000000) {
    errors.annual_income = "Annual Income exceeds maximum limit of ₹50,00,000";
  }

  // 2. Age Validation (Applies to all domains)
  if (profile.age === undefined || profile.age === null || isNaN(profile.age)) {
    errors.age = "Age is required";
  } else if (profile.age < 14 || profile.age > 100) {
    errors.age = "Age must be between 14 and 100 years";
  }

  // 3. Land Acres Validation (Only for Agriculture or Both)
  if (domain === 'agriculture' || domain === 'both') {
    if (profile.land_acres === undefined || profile.land_acres === null || isNaN(profile.land_acres)) {
      errors.land_acres = "Land Holding size is required";
    } else if (profile.land_acres < 0) {
      errors.land_acres = "Land Holding size cannot be negative";
    } else if (profile.land_acres > 100) {
      errors.land_acres = "Land Holding size cannot exceed 100 Acres";
    }
  }

  // 4. Marks Percentage Validation (Only for Education or Both)
  if (domain === 'education' || domain === 'both') {
    if (profile.marks_percentage === undefined || profile.marks_percentage === null || isNaN(profile.marks_percentage)) {
      errors.marks_percentage = "Marks percentage is required";
    } else if (profile.marks_percentage < 0 || profile.marks_percentage > 100) {
      errors.marks_percentage = "Marks percentage must be between 0% and 100%";
    }
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
