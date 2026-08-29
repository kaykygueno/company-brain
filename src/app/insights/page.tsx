"use client";

import { useQuery } from "convex/react";
import { CompanyBrainLayout } from "@/components/company-brain-layout";
import { api } from "../../../convex/_generated/api";

const severityStyle: Record<string, string> = {
  High: "border-red-200 bg-red-50 text-red-800",
  Medium: "border-amber-200 bg-amber-50 text-amber-800",
  Low: "border-slate-200 bg-slate-50 text-slate-700",
};

// Confidence maps to a severity band so risk cards can still show a High/Medium/Low
// badge without a dedicated severity field on knowledgeItems.
function severityForConfidence(confidence: number): string {
  if (confidence >= 70) return "High";
  if (confidence >= 40) return "Medium";
  return "Low";
}

export default function InsightsPage() {
  const risks = useQuery(api.knowledge.list, { type: "RISK", status: "active" });
  const opportunities = useQuery(api.knowledge.list, { type: "GOAL", status: "active" });

  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Performance Intelligence
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Insights</h2>
          <p className="mt-2 text-sm text-slate-600">
            Risks and opportunities drawn from knowledge captured through AI interviews and manual input.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risks</p>
          {risks === undefined ? (
            <p className="mt-4 text-sm text-slate-500">Loading...</p>
          ) : risks.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No risks recorded yet. Capture some through the AI Interview or add knowledge directly.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {risks.map((r) => {
                const severity = severityForConfidence(r.confidence);
                return (
                  <div key={r._id} className={["rounded-xl border p-4", severityStyle[severity]].join(" ")}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{r.title}</p>
                      <span className="shrink-0 text-xs font-bold opacity-70">{severity}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 opacity-80">{r.statement}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Opportunities</p>
          {opportunities === undefined ? (
            <p className="mt-4 text-sm text-slate-500">Loading...</p>
          ) : opportunities.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No opportunities recorded yet. Capture some through the AI Interview or add knowledge directly.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {opportunities.map((opp) => (
                <div key={opp._id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">{opp.title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-emerald-700">{opp.statement}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trends &amp; Anomalies</p>
          <p className="mt-4 text-sm text-slate-500">
            Trend and anomaly detection isn&apos;t implemented yet — it needs analysis over knowledge captured across
            time, not just a snapshot. Coming in a future update.
          </p>
        </section>
      </div>
    </CompanyBrainLayout>
  );
}
