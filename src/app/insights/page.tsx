import { CompanyBrainLayout } from "@/components/company-brain-layout";

const highlights = [
  {
    label: "Top revenue branch",
    value: "Dublin City Centre",
    delta: "+12% vs last quarter",
    positive: true,
  },
  {
    label: "Customer satisfaction",
    value: "4.7 / 5",
    delta: "+0.3 vs same period last year",
    positive: true,
  },
  {
    label: "Repeat visit rate",
    value: "68%",
    delta: "-2% vs last quarter",
    positive: false,
  },
  {
    label: "Average order value",
    value: "€9.40",
    delta: "+€0.60 vs last quarter",
    positive: true,
  },
];

const trends = [
  "Cold brew is growing fastest in the 25–34 age bracket across all branches.",
  "Saturday mornings account for 31% of weekly revenue in suburban locations.",
  "Loyalty programme members spend an average of 22% more per visit.",
  "Menu items introduced in the last 6 months contribute 18% of total revenue.",
  "Staff retention improved by 9% following the centralised scheduling rollout.",
];

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
            AI-generated patterns and observations drawn from business knowledge and activity.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
              <p
                className={[
                  "mt-1 text-xs font-medium",
                  item.positive ? "text-emerald-600" : "text-red-500",
                ].join(" ")}
              >
                {item.delta}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Observed Trends
          </p>
          <ul className="mt-5 space-y-3">
            {trends.map((trend) => (
              <li key={trend} className="flex gap-3 text-sm leading-6 text-slate-700">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                {trend}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </CompanyBrainLayout>
  );
}
