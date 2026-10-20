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
  // Core Identity & Land Records
  'Aadhaar Card',
  '7/12 Land Record Extract',
  'Bank Passbook',
  'Income Certificate',
  'Caste Certificate',
  'Caste Validity Certificate',
  'Domicile Certificate',
  'Non-Creamy Layer Certificate',
  'Sowing Certificate',
  'Mobile Number linked with Aadhaar',

  // Water, Energy & Equipment Documents
  'Water Source / Well / Borewell Certificate',
  'Electricity Bill / Agricultural Pump Connection Proof',
  'Soil Health Card / Soil Testing Report',
  'Organic Farming Group Membership Proof',
  'Tractor RC (if applying for tractor-driven implements)',
  'Quotation / Invoice for Machinery/Equipment',
  'GST Invoice from Registered Micro-Irrigation Dealer',
  'Drip Irrigation Installation Proof (mandatory for fruit orchard)',

  // Scheme Clearances & Approvals
  'Active PM-KISAN Registration ID',
  'Gram Panchayat NOC / Self Declaration Certificate',
  'Gram Sabha Recommendation',
  'Gram Sabha / VCRMC Resolution in PoKRA project village',
  'Self-Declaration / Undertaking of not having availed prior farm pond subsidy',
  'No-Objection Certificate (if joint ownership)',

  // Welfare, Disability & Insurance Claims
  'Disability Certificate',
  'Death Certificate (for accident/insurance schemes)',
  'FIR / Police Spot Panchnama / Inquest Panchnama',
  'Post-Mortem Report / Death or Disability Certificate'
];
