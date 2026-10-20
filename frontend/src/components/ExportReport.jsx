import React from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import {
  TRANSLATIONS,
  getLocalizedDocumentName,
  getSchemeName,
  getSchemeBenefit,
  getPriorityTierLabel,
  getLocalizedCategory,
  getLocalizedState,
  getLocalizedConflictReason
} from '../data/translations';
import { formatDeadlineText } from '../utils/validation';

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
          <span>{t.exportBackBtn || "Back to Dashboard"}</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>{t.exportPrintBtn || "Print / Save PDF Report"}</span>
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
            <div>{t.exportDateGenerated || "Date Generated:"} {new Date().toLocaleDateString(lang === 'mr' ? 'mr-IN' : (lang === 'hi' ? 'hi-IN' : 'en-IN'), { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div>{t.exportSector || "Beneficiary Sector: AGRICULTURE & FARMING"}</div>
          </div>
        </div>

        {/* Profile Snapshot Box */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{t.exportProfileSummary || "Beneficiary Profile Summary"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div><span className="text-slate-500">{t.annualIncome || "Annual Income"}:</span> <strong className="text-slate-900">₹{profile.annual_income?.toLocaleString(lang === 'mr' ? 'mr-IN' : 'en-IN')}</strong></div>
            <div><span className="text-slate-500">{t.casteCategory || "Category"}:</span> <strong className="text-slate-900">{getLocalizedCategory(profile.category, lang)}</strong></div>
            <div><span className="text-slate-500">{t.domicileState || "State"}:</span> <strong className="text-slate-900">{getLocalizedState(profile.state, lang)}</strong></div>
            <div><span className="text-slate-500">{t.ageYears || "Age"}:</span> <strong className="text-slate-900">{profile.age} {lang === 'mr' ? 'वर्षे' : (lang === 'hi' ? 'वर्ष' : 'Years')}</strong></div>
          </div>
        </div>

        {/* Total Financial Summary Banner */}
        <div className="p-6 rounded-2xl bg-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-300">{t.totalBenefitLabel}</div>
            <div className="text-3xl font-extrabold text-amber-400">{results.formatted_potential_benefit || `₹${(results.total_benefits?.direct || results.total_potential_benefit || 0).toLocaleString('en-IN')}`}</div>
            {results.total_benefits && (results.total_benefits.credit > 0 || results.total_benefits.insurance > 0) && (
              <div className="mt-1.5 space-y-0.5 text-xs text-emerald-200 font-medium">
                {results.total_benefits.credit > 0 && (
                  <div>
                    {lang === 'mr'
                      ? `+ ₹${results.total_benefits.credit.toLocaleString('mr-IN')} उपलब्ध कृषी कर्ज व पतपुरवठा`
                      : (lang === 'hi'
                        ? `+ ₹${results.total_benefits.credit.toLocaleString('en-IN')} उपलब्ध कृषि ऋण एवं साख`
                        : `+ ₹${results.total_benefits.credit.toLocaleString('en-IN')} Accessible Credit & Loans`)}
                  </div>
                )}
                {results.total_benefits.insurance > 0 && (
                  <div>
                    {lang === 'mr'
                      ? `+ ₹${results.total_benefits.insurance.toLocaleString('mr-IN')} जोखीम संरक्षण कवच`
                      : (lang === 'hi'
                        ? `+ ₹${results.total_benefits.insurance.toLocaleString('en-IN')} जोखिम सुरक्षा कवर`
                        : `+ ₹${results.total_benefits.insurance.toLocaleString('en-IN')} Risk Protection Cover`)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-right text-xs">
            <div><strong className="text-lg">{results.total_eligible_schemes}</strong> {t.schemesMatchedUnit || t.schemesUnit || "Eligible Schemes"}</div>
            <div className="text-emerald-200">{t.docReadinessLabel}: {results.document_readiness_pct}%</div>
          </div>
        </div>

        {/* Mutually Exclusive Conflicts Section (if present) */}
        {results.conflicts_detected && results.conflicts_detected.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs space-y-2">
            <div className="font-bold text-amber-900">⚡ {t.conflictTitle}</div>
            {results.conflicts_detected.map((c, i) => (
              <div key={i} className="text-amber-800 font-medium">
                • {getLocalizedConflictReason(c, lang)}
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
                <th className="py-2.5 px-3">{t.tableNameHeader || "Scheme Name"}</th>
                <th className="py-2.5 px-3">{t.tablePriorityHeader || "Priority"}</th>
                <th className="py-2.5 px-3">{t.tableBenefitHeader || "Benefit Amount"}</th>
                <th className="py-2.5 px-3">{t.tableDeadlineHeader || "Deadline"}</th>
                <th className="py-2.5 px-3">{t.tableDocsHeader || "Required Documents"}</th>
              </tr>
            </thead>
            <tbody>
              {results.ranked_schemes.map((r, i) => (
                <tr key={i} className={`border-b border-slate-200 ${r.is_mutually_exclusive_secondary ? 'bg-amber-50/40' : ''}`}>
                  <td className="py-3 px-3 font-bold">{i + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {getSchemeName(r.scheme, lang)}
                    {r.is_mutually_exclusive_secondary && <span className="block text-[10px] text-amber-700 font-semibold">({t.mutuallyExclusiveOption || "Mutually Exclusive Alt"})</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      r.priority_tier === 'High Priority' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {getPriorityTierLabel(r.priority_tier, lang)}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-emerald-800">{getSchemeBenefit(r.scheme, lang)}</td>
                  <td className="py-3 px-3">{formatDeadlineText(r.scheme.closing_date, lang)}</td>
                  <td className="py-3 px-3 text-[11px]">{r.scheme.required_documents.map(d => getLocalizedDocumentName(d, lang)).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Master Document Checklist */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">{t.exportMasterDocsTitle || "Master Document Checklist (Attach with Applications)"}</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {results.document_insights.map((doc, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{getLocalizedDocumentName(doc.document_name, lang)}</div>
                  <div className="text-[10px] text-slate-500">
                    {lang === 'mr' ? `${doc.unlocked_schemes_count} योजनांसाठी आवश्यक` : (lang === 'hi' ? `${doc.unlocked_schemes_count} योजनाओं के लिए आवश्यक` : `Required for ${doc.unlocked_schemes_count} schemes`)}
                  </div>
                </div>
                <div className="w-5 h-5 border-2 border-slate-400 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-500 text-center">
          {t.exportFooterNotice || "Generated automatically by YojanaBundle Smart Planner. Please verify guidelines on official portals before final submission."}
        </div>

      </div>
    </div>
  );
}
