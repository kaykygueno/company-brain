import { CompanyBrainLayout } from "@/components/company-brain-layout";

const sections = [
  {
    title: "Sales",
    details: [
      "Monthly revenue trend: steady upward movement",
      "Top product categories: coffee, ready-to-drink beverages, seasonal specials",
      "Store performance: strong performance in commuter-heavy locations",
    ],
  },
  {
    title: "Inventory",
    details: [
      "Stock coverage: balanced across all stores",
      "High-risk items: packaging, seasonal ingredients, cold storage supply",
      "Supplier lead times: monitored weekly",
    ],
  },
  {
    title: "Customers",
    details: [
      "Repeat purchase rate: above target in top locations",
      "Priority segments: commuters, office staff, local families",
      "Feedback themes: speed, consistency, and convenience",
    ],
  },
  {
    title: "Suppliers",
    details: [
      "Primary suppliers: regional producers and packaging partners",
      "Risk review: active monitoring for service disruptions",
      "Contracts: standard terms under annual review",
    ],
  },
];

export default function BusinessDataPage() {
  return (
    <CompanyBrainLayout >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Performance snapshot
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Business Data</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {section.details.map((detail) => (
                  <li key={detail} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-slate-900" />
                    <span>{detail}</span>
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
