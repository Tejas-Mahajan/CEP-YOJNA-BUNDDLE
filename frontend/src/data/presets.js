export const PRESET_PROFILES = [
  {
    id: 'farmer_small_mh',
    label: '🚜 Small Farmer (Maharashtra)',
    subtitle: '2.5 Acres Land | ₹1.8 L Income | OBC',
    data: {
      annual_income: 180000,
      category: 'OBC',
      state: 'Maharashtra',
      age: 42,
      land_acres: 2.5,
      occupation: 'Small Farmer',
      owned_documents: [
        'Aadhaar Card',
        '7/12 Land Record Extract',
        'Bank Passbook',
        'Income Certificate'
      ]
    }
  },
  {
    id: 'farmer_marginal_kusum',
    label: '☀️ Marginal Farmer (Solar Pump Focus)',
    subtitle: '1.2 Acres Land | ₹95k Income | General Category',
    data: {
      annual_income: 95000,
      category: 'General',
      state: 'Maharashtra',
      age: 50,
      land_acres: 1.2,
      occupation: 'Marginal Farmer',
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
  'Non-Creamy Layer Certificate',
  'Sowing Certificate',
  'Water Source Availability Certificate',
  'Disability Certificate (40%+)',
  'Organic Cluster Membership Proof',
  'Electricity Bill / NOC'
];
