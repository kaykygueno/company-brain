import { CompanyBrainLayout } from "@/components/company-brain-layout";

// Static demonstration data — not stored in Convex yet.

const risks = [
  {
    title: "Single-supplier dependency",
    detail: "Primary bean supplier accounts for 78% of specialty stock. No secondary supplier contracted.",
    severity: "High",
  },
  {
    title: "Cork branch staff turnover",
    detail: "Turnover in Cork branches is 3x the company average over the past 12 months.",
    severity: "High",
  },
  {
    title: "Seasonal staffing mismatch",
    detail: "Historical demand spikes in June-August are not reflected in current branch staffing models.",
    severity: "Medium",
  },
  {
    title: "Loyalty programme stagnation",
    detail: "Enrolment has been flat for 7 months. Only 22% of regular customers are enrolled.",
    severity: "Medium",
  },
];

const opportunities = [
  {
    title: "Cold brew product expansion",
    detail: "Cold brew is growing 34% YoY. The current product line was last updated 18 months ago.",
  },
  {
    title: "Loyalty programme growth",
    detail: "Members spend 22% more per visit. Growing enrolment from 22% to 40% could materially improve revenue.",
  },
  {
    title: "Corporate catering channel",
    detail: "Three branch managers reported untapped corporate catering demand in their areas.",
  },
];

const trends = [
  "Cold brew demand is growing fastest in the 25-34 age bracket across all branches.",
  "Saturday mornings account for 31% of weekly revenue in suburban locations.",
  "Loyalty programme members spend an average of 22% more per visit.",
  "Menu items introduced in the last 6 months contribute 18% of total revenue.",
  "Staff retention improved by 9% following the centralised scheduling rollout.",
];

const anomalies = [
  "Galway branch exceeded its first-month revenue target by 31% — significantly above forecast.",
  "Cork City branch saw a 14% drop in afternoon foot traffic in June with no recorded causal event.",
  "Online orders fell 8% in the two weeks following the take-home bottle pilot launch.",
];

const recommendations = [
  "Qualify and contract a secondary specialty bean supplier before the Q3 supply cycle.",
  "Investigate root causes of Cork staff turnover — consider manager interview and exit data review.",
  "Run a targeted loyalty enrolment campaign at the top 5 highest-footfall branches.",
  "Expand cold brew SKUs ahead of the summer peak, using Galway branch as a trial site.",
  "Review and update seasonal staffing models for branches with historical summer demand spikes.",
];

const severityStyle: Record<string, string> = {
  High: "border-red-200 bg-red-50 text-red-800",
  Medium: "border-amber-200 bg-amber-50 text-amber-800",
  Low: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function InsightsPage() {
  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Performance Intelligence
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Insights</h2>
          <p className="mt-2 text-sm text-slate-600">
            Patterns, anomalies, and recommendations drawn from business knowledge and activity.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risks</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {risks.map((r) => (
              <div key={r.title} className={["rounded-xl border p-4", severityStyle[r.severity] ?? "border-slate-200 bg-slate-50 text-slate-700"].join(" ")}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <span className="shrink-0 text-xs font-bold opacity-70">{r.severity}</span>
                </div>
                <p className="mt-1.5 text-xs leading-5 opacity-80">{r.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Opportunities</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((opp) => (
              <div key={opp.title} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">{opp.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-emerald-700">{opp.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trends</p>
          <ul className="mt-4 space-y-3">
            {trends.map((trend) => (
              <li key={trend} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                {trend}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Anomalies</p>
          <ul className="mt-4 space-y-3">
            {anomalies.map((a) => (
              <li key={a} className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {a}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recommendations</p>
          <ol className="mt-4 space-y-3">
            {recommendations.map((rec, i) => (
              <li key={rec} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </CompanyBrainLayout>
  );
}
