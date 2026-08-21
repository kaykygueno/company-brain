import { CompanyBrainLayout } from "@/components/company-brain-layout";

const decisions = [
  {
    title: "Expand to Galway branch",
    date: "March 2025",
    status: "Implemented",
    rationale: "Demand signals from online orders suggested an underserved urban market segment.",
  },
  {
    title: "Switch to single-origin bean supplier",
    date: "January 2025",
    status: "Implemented",
    rationale: "Improved product differentiation and customer satisfaction scores by 14%.",
  },
  {
    title: "Pause loyalty programme rebrand",
    date: "November 2024",
    status: "Paused",
    rationale: "Resources redirected to branch expansion; review scheduled for Q3 2025.",
  },
  {
    title: "Introduce 500ml take-home bottles",
    date: "September 2024",
    status: "Rolled back",
    rationale: "Packaging costs exceeded projected margin; reverted after 6-week trial.",
  },
  {
    title: "Adopt centralised scheduling tool",
    date: "June 2024",
    status: "Implemented",
    rationale: "Reduced rota disputes by standardising shifts across all branches.",
  },
];

const statusColor: Record<string, string> = {
  Implemented: "bg-emerald-100 text-emerald-800",
  Paused: "bg-amber-100 text-amber-800",
  "Rolled back": "bg-red-100 text-red-800",
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
            A log of significant business decisions, their rationale, and outcomes.
          </p>
        </div>

        <div className="space-y-4">
          {decisions.map((d) => (
            <section
              key={d.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{d.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{d.date}</p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    statusColor[d.status] ?? "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  {d.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{d.rationale}</p>
            </section>
          ))}
        </div>
      </div>
    </CompanyBrainLayout>
  );
}
