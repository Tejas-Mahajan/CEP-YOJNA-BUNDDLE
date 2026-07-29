export const PRESET_PROFILES = [
  {
    id: 'farmer_small_mh',
    label: '🚜 Small Farmer (Maharashtra)',
    subtitle: '2.5 Acres Land | ₹1.8 L Income | OBC',
    data: {
      domain: 'agriculture',
      annual_income: 180000,
      category: 'OBC',
      state: 'Maharashtra',
      age: 42,
      land_acres: 2.5,
      occupation: 'Small Farmer',
      course_level: 'Undergraduate',
      marks_percentage: 60,
      owned_documents: [
        'Aadhaar Card',
        '7/12 Land Record Extract',
        'Bank Passbook',
        'Income Certificate'
      ]
    }
  },
  {
    id: 'student_engineering_female',
    label: '🎓 Female Engg Student (General)',
    subtitle: '78% Marks | ₹2.2 L Income | Pragati Scheme Match',
    data: {
      domain: 'education',
      annual_income: 220000,
      category: 'General',
      state: 'Maharashtra',
      age: 20,
      land_acres: 0,
      occupation: 'Student',
      course_level: 'Engineering',
      marks_percentage: 78.5,
      owned_documents: [
        'Aadhaar Card',
        'Income Certificate',
        'Mark Sheet (10th/12th)',
        'College Fee Receipt',
        'Domicile Certificate',
        'Bank Passbook',
        'Bonafide Student Certificate'
      ]
    }
  },
  {
    id: 'student_sc_topclass',
    label: '📚 SC Student Top-Class Higher Ed',
    subtitle: '85% Marks | ₹1.5 L Income | Full Tuition Match',
    data: {
      domain: 'education',
      annual_income: 150000,
      category: 'SC',
      state: 'All',
      age: 21,
      land_acres: 0,
      occupation: 'Student',
      course_level: 'Engineering',
      marks_percentage: 85.0,
      owned_documents: [
        'Aadhaar Card',
        'Caste Certificate',
        'Income Certificate',
        'Mark Sheet (10th/12th)',
        'College Fee Receipt',
        'Bank Passbook'
      ]
    }
  },
  {
    id: 'farmer_marginal_kusum',
    label: '☀️ Marginal Farmer (Solar Pump Focus)',
    subtitle: '1.2 Acres Land | ₹95k Income | General Category',
    data: {
      domain: 'agriculture',
      annual_income: 95000,
      category: 'General',
      state: 'Maharashtra',
      age: 50,
      land_acres: 1.2,
      occupation: 'Marginal Farmer',
      course_level: 'Undergraduate',
      marks_percentage: 50,
      owned_documents: [
        'Aadhaar Card',
        '7/12 Land Record Extract',
        'Bank Passbook'
      ]
    }
  }
];

export const AVAILABLE_DOCUMENTS = [
  'Aadhaar Card',
  '7/12 Land Record Extract',
  'Income Certificate',
  'Caste Certificate',
  'Domicile Certificate',
  'Bank Passbook',
  'Mark Sheet (10th/12th)',
  'College Fee Receipt',
  'Bonafide Student Certificate',
  'Non-Creamy Layer Certificate',
  'Sowing Certificate',
  'Water Source Availability Certificate',
  'Disability Certificate (40%+)',
  'Organic Cluster Membership Proof',
  'Electricity Bill / NOC'
];
