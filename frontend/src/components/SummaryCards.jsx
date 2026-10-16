import React from 'react';
import { IndianRupee, Award, FileCheck2, TrendingUp } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function SummaryCards({ results, lang }) {
  if (!results) return null;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const {
    total_eligible_schemes,
    formatted_potential_benefit,
    document_readiness_pct,
    ranked_schemes
  } = results;

  const highPriorityCount = (ranked_schemes || []).filter(r => r.priority_tier === 'High Priority').length;

  // Derive categorized benefits (use backend total_benefits or local fallback reducer)
  const total_benefits = results.total_benefits || (() => {
    const list = ranked_schemes || [];
    return list
      .filter(r => !r.is_mutually_exclusive_secondary)
      .reduce((acc, curr) => {
        const s = curr.scheme || {};
        const amt = Number(s.benefit_amount) || 0;
        const bType = String(s.benefit_type || '');

        if (['Credit Line', 'Interest Subvention', 'Credit-Linked'].some(term => bType.includes(term))) {
          acc.credit += amt;
        } else if (bType.includes('Insurance')) {
          acc.insurance += amt;
        } else if (
          ['Direct Cash Transfer', 'Free Service', 'Pension', 'Capital Subsidy'].some(term => bType.includes(term)) ||
          (bType.includes('Subsidy') && !bType.includes('Credit-Linked'))
        ) {
          acc.direct += amt;
        } else {
          acc.direct += amt;
        }
        return acc;
      }, { direct: 0.0, credit: 0.0, insurance: 0.0 });
  })();

  const directBenefit = Number(total_benefits.direct ?? (results.total_potential_benefit || 0));
  const creditBenefit = Number(total_benefits.credit || 0);
  const insuranceBenefit = Number(total_benefits.insurance || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Total Benefit Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white p-7 shadow-xl shadow-emerald-900/20 border border-emerald-700/30 flex flex-col justify-between">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">{t.totalBenefitLabel}</span>
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
            <IndianRupee className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            ₹{directBenefit.toLocaleString('en-IN')}
          </div>
          {creditBenefit > 0 && (
            <div className="text-sm mt-1 text-emerald-100 font-medium leading-snug">
              + ₹{creditBenefit.toLocaleString('en-IN')} Accessible Credit & Loans
            </div>
          )}
          {insuranceBenefit > 0 && (
            <div className="text-sm text-emerald-100 font-medium leading-snug">
              + ₹{insuranceBenefit.toLocaleString('en-IN')} Risk Protection Cover
            </div>
          )}
        </div>
      </div>

      {/* Eligible Schemes Count Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-7 shadow-xl border border-slate-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.matchedSchemesLabel}</span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {total_eligible_schemes} <span className="text-lg font-semibold text-slate-500">{t.schemesUnit || 'Schemes'}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold mt-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              ⚡ {highPriorityCount} {t.highPriority}
            </span>
            <span className="text-slate-500">{t.readyToApply}</span>
          </div>
        </div>
      </div>

      {/* Document Readiness Score Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-7 shadow-xl border border-slate-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.docReadinessLabel}</span>
          <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-800">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{document_readiness_pct}%</span>
            <span className="text-xs font-bold text-emerald-600">{t.readiness}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${document_readiness_pct}%` }}
            ></div>
          </div>
        </div>
      </div>

    </div>
  );
}
