import { CompanyBrainLayout } from "@/components/company-brain-layout";

const connections = [
  {
    name: "Google Drive",
    category: "Document Storage",
    status: "Not connected",
    description: "Sync business documents, meeting notes, and reports into Company Brain.",
  },
  {
    name: "monday.com",
    category: "Project Management",
    status: "Not connected",
    description: "Link tasks, projects, and timelines to business decisions and knowledge.",
  },
  {
    name: "Asana",
    category: "Project Management",
    status: "Not connected",
    description: "Import Asana projects and cross-reference with knowledge and decisions.",
  },
  {
    name: "Jira",
    category: "Issue Tracking",
    status: "Not connected",
    description: "Connect product development cycles to business context and outcomes.",
  },
  {
    name: "HubSpot",
    category: "CRM",
    status: "Not connected",
    description: "Surface customer insight and deal history alongside business knowledge.",
  },
  {
    name: "Slack",
    category: "Communication",
    status: "Not connected",
    description: "Capture decisions and insights shared in team conversations.",
  },
];

export default function ConnectionsPage() {
  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Integrations
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Connections</h2>
          <p className="mt-2 text-sm text-slate-600">
            Connect your existing tools to bring business context into Company Brain.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {connections.map((conn) => (
            <section
              key={conn.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{conn.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{conn.category}</p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                  {conn.status}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{conn.description}</p>
              <button
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-400"
              >
                Connect — coming soon
              </button>
            </section>
          ))}
        </div>
      </div>
    </CompanyBrainLayout>
  );
}
