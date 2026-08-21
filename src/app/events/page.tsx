import { CompanyBrainLayout } from "@/components/company-brain-layout";

const eventGroups = [
  {
    title: "Weather",
    details: ["Forecast update for regional delivery conditions", "Storm warning review for transport shifts"],
  },
  {
    title: "Sports",
    details: ["Local football fixtures and attendance impact", "Regional tournament schedule for event planning"],
  },
  {
    title: "Concerts",
    details: ["Nearby venues and ticketing trends", "Community event calendars and promotions"],
  },
  {
    title: "Local Events",
    details: ["Town festivals and family activity notices", "Neighbourhood events affecting customer traffic"],
  },
  {
    title: "Other Events",
    details: ["Community initiatives and sponsorship updates", "Public holiday planning notes and operations impacts"],
  },
];

export default function EventsPage() {
  return (
    <CompanyBrainLayout >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            External watchlist
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Events</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {eventGroups.map((group) => (
            <section
              key={group.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-slate-900">{group.title}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {group.details.map((detail) => (
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
