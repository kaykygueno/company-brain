import { CompanyBrainLayout } from "@/components/company-brain-layout";

const settingsGroups = [
  {
    title: "Company Settings",
    details: ["Brand profile and trading name", "Operating hours and branch policies", "Business goals and growth targets"],
  },
  {
    title: "Users",
    details: ["Owner, manager, and regional staff access", "Team directory and communication settings", "User onboarding and offboarding notes"],
  },
  {
    title: "Permissions",
    details: ["Role-based permissions by team", "Decision approval thresholds", "Sensitive data access controls"],
  },
  {
    title: "Integrations",
    details: ["CRM and scheduling connections", "Supplier communication status", "Data sync and import workspace"],
  },
  {
    title: "Security",
    details: ["Password policy and MFA checklist", "Audit trail review schedule", "Incident reporting and access review"],
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
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {settingsGroups.map((group) => (
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
