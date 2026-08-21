import { CompanyBrainLayout } from "@/components/company-brain-layout";

// Static demonstration data — not stored in Convex yet.

const decisions = [
  {
    decision: "Expand to Galway branch",
    date: "March 2025",
    status: "Implemented",
    reason: "Online order data showed consistent demand from the Galway region with no physical presence.",
    evidence: "6-month delivery heat-map showed 18% of online orders originating from Galway and surrounding areas.",
    outcome: "Branch opened on schedule. Revenue tracking began April 2025.",
    source: "AI Interview — Regional Manager",
  },
  {
    decision: "Switch to single-origin bean supplier",
    date: "January 2025",
    status: "Implemented",
    reason: "Customer feedback consistently cited product consistency as a key differentiator in premium segments.",
    evidence: "Survey of 340 loyalty members showed 67% preference for ethically-sourced single-origin beans.",
    outcome: "NPS increased 14 points over two quarters. Average order value up 0.60.",
    source: "AI Interview — Head Barista + Operations Lead",
  },
  {
    decision: "Pause loyalty programme rebrand",
    date: "November 2024",
    status: "Paused",
    reason: "Design and development resources were redirected to support the Galway branch expansion.",
    evidence: "Resource availability assessment showed 60% of product team capacity committed to expansion.",
    outcome: "Rebrand deferred. Current programme still active. Review scheduled Q3 2025.",
    source: "Management Meeting Notes",
  },
  {
    decision: "Introduce 500ml take-home bottles",
    date: "September 2024",
    status: "Rolled back",
    reason: "Expand revenue opportunity from existing foot traffic by introducing a retail SKU.",
    evidence: "Pilot at 3 branches showed 11% of customers showed interest when prompted.",
    outcome: "Packaging costs exceeded projected margin by 22%. Product withdrawn after 6-week trial.",
    source: "AI Interview — Finance Lead",
  },
  {
    decision: "Adopt centralised scheduling tool",
    date: "June 2024",
    status: "Implemented",
    reason: "Branch managers reported 4-6 hours per week wasted on rota disputes and scheduling conflicts.",
    evidence: "Operational audit across 8 branches confirmed inconsistent shift patterns and frequent swap requests.",
    outcome: "Rota disputes reduced by 71%. Manager-reported scheduling time down to under 1 hour per week.",
    source: "AI Interview — Branch Manager (Cork)",
  },
];

const statusStyle: Record<string, string> = {
  Implemented: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Paused: "bg-amber-100 text-amber-800 border-amber-200",
  "Rolled back": "bg-red-100 text-red-800 border-red-200",
};

export default function DecisionsPage() {
  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business Intelligence
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Decisions</h2>
          <p className="mt-2 text-sm text-slate-600">
            Significant business decisions recorded with context, evidence, and outcomes.
          </p>
        </div>

        <div className="space-y-4">
          {decisions.map((d) => (
            <section
              key={d.decision}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{d.decision}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{d.date} · {d.source}</p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    statusStyle[d.status] ?? "bg-slate-100 text-slate-700 border-slate-200",
                  ].join(" ")}
                >
                  {d.status}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Reason", value: d.reason },
                  { label: "Evidence", value: d.evidence },
                  { label: "Outcome", value: d.outcome },
                ].map((field) => (
                  <div key={field.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {field.label}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-6 text-slate-700">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </CompanyBrainLayout>
  );
}
