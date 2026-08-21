import { CompanyBrainLayout } from "@/components/company-brain-layout";

// Static demonstration data — not stored in Convex yet.

const categories = [
  {
    label: "Facts",
    count: 142,
    color: "bg-sky-100 text-sky-800",
    description:
      "Verified facts about the business: market position, product specs, customer demographics, and operational figures.",
    examples: ["12 active branches", "320 employees", "Founded 2011", "Primary market: Leinster"],
  },
  {
    label: "Rules",
    count: 89,
    color: "bg-violet-100 text-violet-800",
    description:
      "Business rules that guide day-to-day decisions: pricing floors, supplier terms, and service standards.",
    examples: ["Minimum order margin 38%", "No single supplier > 60% of volume", "Branch targets set quarterly"],
  },
  {
    label: "Processes",
    count: 67,
    color: "bg-amber-100 text-amber-800",
    description:
      "Documented processes covering branch operations, onboarding, supply chain management, and quality control.",
    examples: ["New branch onboarding", "Weekly stock reconciliation", "Customer complaint escalation"],
  },
  {
    label: "Decisions",
    count: 234,
    color: "bg-emerald-100 text-emerald-800",
    description:
      "Recorded business decisions with rationale, evidence, and observed outcomes over time.",
    examples: ["Galway expansion", "Single-origin supplier switch", "Scheduling tool adoption"],
  },
  {
    label: "Lessons",
    count: 53,
    color: "bg-orange-100 text-orange-800",
    description:
      "Lessons distilled from decisions that did not go as planned, or from experiments that produced unexpected results.",
    examples: ["Take-home bottle pilot failure", "Loyalty rebrand timing issues", "Peak demand staffing gaps"],
  },
  {
    label: "Risks",
    count: 28,
    color: "bg-red-100 text-red-800",
    description:
      "Identified risks flagged from AI interviews, decision logs, and supply chain analysis.",
    examples: ["Single-supplier dependency", "Cork branch staff turnover", "Seasonal staffing mismatch"],
  },
];

export default function KnowledgePage() {
  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Company Intelligence
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Knowledge</h2>
          <p className="mt-2 text-sm text-slate-600">
            613 items across 6 categories — captured through AI interviews and manual input.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => (
            <section
              key={cat.label}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">{cat.label}</h3>
                <span className={["shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", cat.color].join(" ")}>
                  {cat.count}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{cat.description}</p>
              <ul className="mt-4 space-y-1.5">
                {cat.examples.map((ex) => (
                  <li key={ex} className="flex gap-2 text-xs text-slate-500">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    {ex}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </CompanyBrainLayout>
  );
}
