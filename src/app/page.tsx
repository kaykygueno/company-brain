import Link from "next/link";
import { CompanyBrainLayout } from "@/components/company-brain-layout";

const overviewItems = [
  { label: "Industry", value: "Beverage Manufacturing" },
  { label: "Locations", value: "12 branches" },
  { label: "Employees", value: "320 people" },
  { label: "Founded", value: "2011" },
];

const knowledgeStatus = [
  { label: "Knowledge items", value: "1,284" },
  { label: "Verified", value: "921" },
  { label: "Pending", value: "363" },
];

const recentActivities = [
  "Manager interview completed",
  "Supplier rule added",
  "Business decision recorded",
];

export default function DashboardPage() {
  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Welcome
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
                Company Brain
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Company Brain helps a company preserve knowledge, capture lessons,
                and make better decisions using a clear, connected view of the business.
              </p>
            </div>

            <Link
              href="/ai-interview"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start AI Interview
            </Link>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Company Overview
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">DublinBrew</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {overviewItems.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Knowledge Status
            </p>
            <div className="mt-5 space-y-4">
              {knowledgeStatus.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-xl font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Recent Activity
          </p>

          <div className="mt-5 space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={activity}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm text-slate-700">{activity}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CompanyBrainLayout>
  );
}
