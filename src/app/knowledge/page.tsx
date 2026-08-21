import { CompanyBrainLayout } from "@/components/company-brain-layout";

const categories = [
  {
    title: "Products & Pricing",
    count: 214,
    description: "Menu composition, pricing tiers, seasonal offerings, and margin notes.",
  },
  {
    title: "Supplier Relationships",
    count: 87,
    description: "Key contacts, contract terms, delivery schedules, and quality ratings.",
  },
  {
    title: "Customer Insights",
    count: 163,
    description: "Segment profiles, purchase patterns, satisfaction trends, and loyalty data.",
  },
  {
    title: "Operations & Processes",
    count: 341,
    description: "Branch SOPs, equipment maintenance logs, and quality control checklists.",
  },
  {
    title: "Lessons Learned",
    count: 98,
    description: "Post-mortems, successful pivots, and documented business experiments.",
  },
  {
    title: "Brand & Culture",
    count: 56,
    description: "Brand guidelines, tone of voice, founding story, and cultural norms.",
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
            Structured business knowledge captured through AI interviews and manual input.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => (
            <section
              key={cat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">{cat.title}</h3>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {cat.count}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{cat.description}</p>
            </section>
          ))}
        </div>
      </div>
    </CompanyBrainLayout>
  );
}
