import { CompanyBrainLayout } from "@/components/company-brain-layout";

// Static demonstration data — not stored in Convex yet.

const sections = [
  {
    id: "company",
    title: "Company",
    description: "Profile, trading name, operating details, and business goals.",
    fields: [
      { label: "Company name", value: "DublinBrew Ltd." },
      { label: "Trading name", value: "DublinBrew" },
      { label: "Founded", value: "2011" },
      { label: "Industry", value: "Beverage Manufacturing" },
      { label: "Locations", value: "12 branches" },
    ],
  },
  {
    id: "users",
    title: "Users",
    description: "Manage who can access Company Brain and at what level.",
    fields: [
      { label: "Owner", value: "Ciara Brien" },
      { label: "Admin users", value: "3" },
      { label: "Read-only users", value: "8" },
      { label: "Pending invites", value: "2" },
    ],
  },
  {
    id: "permissions",
    title: "Permissions",
    description: "Role-based access control for decisions, knowledge, and settings.",
    fields: [
      { label: "Decision approval", value: "Admin only" },
      { label: "Knowledge editing", value: "Admin + Managers" },
      { label: "AI Interview access", value: "All users" },
      { label: "Settings access", value: "Admin only" },
    ],
  },
  {
    id: "connections",
    title: "Connections",
    description: "Manage OAuth connections and API credentials for external services.",
    fields: [
      { label: "Connected services", value: "None" },
      { label: "OAuth provider", value: "Not configured" },
    ],
  },
  {
    id: "security",
    title: "Security",
    description: "Authentication, audit logs, and access policy settings.",
    fields: [
      { label: "Authentication", value: "Not configured" },
      { label: "MFA", value: "Not enabled" },
      { label: "Audit log", value: "Inactive" },
      { label: "Data retention", value: "Indefinite" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Administration
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Settings</h2>
          <p className="mt-2 text-sm text-slate-600">
            Application configuration. Authentication and permissions are placeholders for now.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
              <dl className="mt-4 space-y-2">
                {section.fields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
                    <dd className="text-sm font-medium text-slate-900">{field.value}</dd>
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
