import { CompanyBrainLayout } from "@/components/company-brain-layout";

const knowledgeItems = [
  {
    type: "Supplier Rule",
    title: "Two-step supplier approval process",
    description:
      "All new suppliers must receive operational approval from the purchasing manager and a written quality check before being listed for recurring orders.",
    source: "Procurement Manual",
    status: "Verified",
  },
  {
    type: "Operational Procedure",
    title: "Branch opening checklist",
    description:
      "Each opening shift includes equipment checks, cash reconciliation, and customer health and safety walkthroughs to reduce operational errors.",
    source: "Operations Guide",
    status: "Verified",
  },
  {
    type: "Historical Decision",
    title: "Decision to standardize local product pricing",
    description:
      "The business standardized product pricing across sites after duplicate pricing caused confusion in customer experience and poor staff communication.",
    source: "Leadership Notes",
    status: "Pending review",
  },
  {
    type: "Business Lesson",
    title: "Customer retention follows consistency",
    description:
      "Teams learned that small experience differences at multiple locations reduce repeat bookings and lower trust in the brand.",
    source: "Customer Feedback Summary",
    status: "Verified",
  },
];

export default function CompanyKnowledgePage() {
  return (
    <CompanyBrainLayout >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Institutional memory
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Company Knowledge</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {knowledgeItems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                  {item.type}
                </span>
                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                    item.status === "Verified"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700",
                  ].join(" ")}
                >
                  {item.status}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>

              <dl className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Source</dt>
                  <dd className="font-medium text-slate-700">{item.source}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Verification</dt>
                  <dd className="font-medium text-slate-700">{item.status}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </CompanyBrainLayout>
  );
}
