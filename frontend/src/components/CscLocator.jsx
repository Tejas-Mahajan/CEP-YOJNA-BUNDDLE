import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Search, ExternalLink, ShieldCheck, Sparkles, Navigation, UserCheck, CheckCircle2 } from 'lucide-react';
import { CSC_OFFICES } from '../data/csc_offices';
import { TRANSLATIONS } from '../data/translations';

export default function CscLocator({ lang }) {
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const districts = ['All', ...Array.from(new Set(CSC_OFFICES.map(c => c.district)))];

  const filteredOffices = CSC_OFFICES.filter(office => {
    const matchesDistrict = selectedDistrict === 'All' || office.district === selectedDistrict;
    const matchesQuery = searchQuery === '' || 
      office.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      office.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.pincode.includes(searchQuery);
    return matchesDistrict && matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4" /> Offline Assistance & Verification
            </div>
            <h2 className="text-2xl font-black">CSC & Aaple Sarkar Seva Kendra Locator</h2>
            <p className="text-xs text-emerald-200 mt-1 max-w-xl">
              Locate authorized Common Service Centers (CSC) for physical document verification, e-KYC authentication, 7/12 extraction, and offline scheme submission.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs space-y-1">
            <div className="font-semibold text-amber-300 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Government Verified Nodal Helpdesks</span>
            </div>
            <div className="text-2xs text-emerald-100">Free guidance & official biometric e-KYC services</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by area, office name, or pincode (e.g. 411005)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900 bg-slate-50/50 outline-none"
          />
        </div>

        {/* District Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 mr-1 flex-shrink-0">District:</span>
          {districts.map((dist) => (
            <button
              key={dist}
              onClick={() => setSelectedDistrict(dist)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedDistrict === dist
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dist}
            </button>
          ))}
        </div>

      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOffices.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">No CSC centers found for "{searchQuery}"</div>
            <div className="text-xs text-slate-400">Try changing district selection or clear search terms.</div>
          </div>
        ) : (
          filteredOffices.map((office) => (
            <motion.div
              key={office.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">{office.name}</h4>
                      <div className="text-2xs font-bold text-emerald-700">{office.district} District</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Verified CSC
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                  {office.address}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nodal: <strong>{office.officerName}</strong></span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{office.timing}</span>
                  </div>
                </div>

                {/* Services Pills */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Key Offline Services</div>
                  <div className="flex flex-wrap gap-1">
                    {office.servicesOffered.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 text-[10px] font-bold border border-emerald-200">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${office.contactPhone}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Call Nodal</span>
                </a>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.name + ' ' + office.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-800/20 flex items-center space-x-1.5 transition-all"
                >
                  <span>Directions on Google Maps</span>
                  <Navigation className="w-3.5 h-3.5" />
                </a>
              </div>

            </motion.div>
          ))
        )}
      </div>

    </div>
  );
}
