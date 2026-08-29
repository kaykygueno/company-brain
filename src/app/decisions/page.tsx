"use client";

import { useQuery } from "convex/react";
import { CompanyBrainLayout } from "@/components/company-brain-layout";
import { api } from "../../../convex/_generated/api";

const statusStyle: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  superseded: "bg-amber-100 text-amber-800 border-amber-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  superseded: "Superseded",
  archived: "Archived",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

export default function DecisionsPage() {
  const decisions = useQuery(api.knowledge.list, { type: "DECISION" });

  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business Intelligence
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Decisions</h2>
          <p className="mt-2 text-sm text-slate-600">
            Significant business decisions recorded with context and confidence.
          </p>
        </div>

        {decisions === undefined ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : decisions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              No decisions recorded yet. Capture some through the AI Interview or add knowledge directly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map((d) => (
              <section
                key={d._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900">{d.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(d.learnedAt)} · {d.providedBy}
                    </p>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      statusStyle[d.status] ?? "bg-slate-100 text-slate-700 border-slate-200",
                    ].join(" ")}
                  >
                    {statusLabel[d.status] ?? d.status}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Statement
                    </dt>
                    <dd className="mt-1.5 text-sm leading-6 text-slate-700">{d.statement}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Confidence
                    </dt>
                    <dd className="mt-1.5 text-sm leading-6 text-slate-700">{d.confidence}%</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Source
                    </dt>
                    <dd className="mt-1.5 text-sm leading-6 text-slate-700">
                      {d.sourceType}
                      {d.sourceReference ? ` — ${d.sourceReference}` : ""}
                    </dd>
                  </div>
                </dl>
              </section>
            ))}
          </div>
        )}
      </div>
    </CompanyBrainLayout>
  );
}
