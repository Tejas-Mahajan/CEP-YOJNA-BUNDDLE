import React from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function ExportReport({ results, profile, onBack, lang }) {
  if (!results) return null;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 print:py-0 print:max-w-full">
      
      {/* Top Action Bar (Hidden on Print) */}
      <div className="flex items-center justify-between print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF Report</span>
          </button>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="bg-white rounded-3xl border border-slate-300 p-8 sm:p-12 space-y-8 shadow-xl print:shadow-none print:border-none print:p-0">
        
        {/* Report Header */}
        <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-950">{t.appTitle}</h1>
            <p className="text-xs text-slate-600 font-semibold mt-1">{t.appSubtitle}</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-medium">
            <div>Date Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div>Beneficiary Domain: <span className="font-bold uppercase">{profile.domain}</span></div>
          </div>
        </div>

        {/* Profile Snapshot Box */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Beneficiary Profile Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div><span className="text-slate-500">Annual Income:</span> <strong className="text-slate-900">₹{profile.annual_income?.toLocaleString('en-IN')}</strong></div>
            <div><span className="text-slate-500">Category:</span> <strong className="text-slate-900">{profile.category}</strong></div>
            <div><span className="text-slate-500">State:</span> <strong className="text-slate-900">{profile.state}</strong></div>
            <div><span className="text-slate-500">Age:</span> <strong className="text-slate-900">{profile.age} Years</strong></div>
          </div>
        </div>

        {/* Total Financial Summary Banner */}
        <div className="p-6 rounded-2xl bg-emerald-900 text-white flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-300">{t.totalBenefitLabel}</div>
            <div className="text-3xl font-extrabold text-amber-400">{results.formatted_potential_benefit}</div>
          </div>
          <div className="text-right text-xs">
            <div><strong className="text-lg">{results.total_eligible_schemes}</strong> Eligible Schemes</div>
            <div className="text-emerald-200">{t.docReadinessLabel}: {results.document_readiness_pct}%</div>
          </div>
        </div>

        {/* Mutually Exclusive Conflicts Section (if present) */}
        {results.conflicts_detected && results.conflicts_detected.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs space-y-2">
            <div className="font-bold text-amber-900">⚡ {t.conflictTitle}</div>
            {results.conflicts_detected.map((c, i) => (
              <div key={i} className="text-amber-800 font-medium">
                • {c.reason_en}
              </div>
            ))}
          </div>
        )}

        {/* Action Plan Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">{t.actionPlanTitle}</h3>
          
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Scheme Name</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Benefit Amount</th>
                <th className="py-2.5 px-3">Deadline</th>
                <th className="py-2.5 px-3">Required Documents</th>
              </tr>
            </thead>
            <tbody>
              {results.ranked_schemes.map((r, i) => (
                <tr key={i} className={`border-b border-slate-200 ${r.is_mutually_exclusive_secondary ? 'bg-amber-50/40' : ''}`}>
                  <td className="py-3 px-3 font-bold">{i + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {r.scheme.shortName}
                    {r.is_mutually_exclusive_secondary && <span className="block text-[10px] text-amber-700 font-semibold">(Mutually Exclusive Alt)</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      r.priority_tier === 'High Priority' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {r.priority_tier}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-emerald-800">{r.scheme.benefit_display}</td>
                  <td className="py-3 px-3">{r.scheme.deadline_days} Days</td>
                  <td className="py-3 px-3 text-[11px]">{r.scheme.required_documents.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Master Document Checklist */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Master Document Checklist (Attach with Applications)</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {results.document_insights.map((doc, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{doc.document_name}</div>
                  <div className="text-[10px] text-slate-500">Required for {doc.unlocked_schemes_count} schemes</div>
                </div>
                <div className="w-5 h-5 border-2 border-slate-400 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-500 text-center">
          Generated automatically by YojanaBundle Smart Planner. Please verify guidelines on official portals before final submission.
        </div>

      </div>
    </div>
  );
}
