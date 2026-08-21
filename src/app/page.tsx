import Link from "next/link";
import { CompanyBrainLayout } from "@/components/company-brain-layout";

// Static demonstration data — not stored in Convex yet.

const needsAttention = [
  {
    id: 1,
    title: "Limerick branch missed revenue target",
    detail: "Three consecutive weeks below weekly target. No action recorded.",
    severity: "high",
  },
  {
    id: 2,
    title: "Coffee bean stock below safety threshold",
    detail: "4 of 12 branches have less than 2 weeks of specialty stock remaining.",
    severity: "high",
  },
  {
    id: 3,
    title: "Q3 delivery schedule unconfirmed",
    detail: "Primary bean supplier has not responded to the Q3 schedule request.",
    severity: "medium",
  },
];

const risks = [
  "Single-supplier dependency for specialty beans creates a fragile supply chain.",
  "Staff turnover in Cork branches is 3\xd7 the company average.",
  "Seasonal demand spikes are not matched by current branch staffing models.",
];

const opportunities = [
  {
    title: "Expand cold brew product line",
    detail: "Cold brew demand is up 34% YoY across all branches. No new SKUs introduced yet.",
  },
  {
    title: "Grow loyalty programme coverage",
    detail: "Only 22% of regular customers are currently enrolled in the loyalty programme.",
  },
];

const questionsForYou = [
  {
    question: "Is the Galway branch expansion still planned for Q4?",
    context: "The last recorded decision deferred it. No update has been captured since March.",
  },
];

const recentDecisions = [
  { title: "Switch to single-origin bean supplier", date: "Jan 2025", outcome: "Implemented" },
  { title: "Expand to Galway branch", date: "Mar 2025", outcome: "Implemented" },
  { title: "Pause loyalty programme rebrand", date: "Nov 2024", outcome: "Paused" },
];

const knowledgeSummary = [
  { label: "Facts", count: 142 },
  { label: "Rules", count: 89 },
  { label: "Processes", count: 67 },
  { label: "Decisions", count: 234 },
  { label: "Lessons", count: 53 },
  { label: "Risks", count: 28 },
];

const connectedSystems = [
  "monday.com", "Asana", "Jira", "ClickUp", "Trello",
  "Google Drive", "Google Calendar", "Slack", "Salesforce",
];

const outcomeColor: Record<string, string> = {
  Implemented: "text-emerald-700",
  Paused: "text-amber-700",
  "Rolled back": "text-red-600",
};

export default function DashboardPage() {
  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                DublinBrew \xb7 Dashboard
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Here&apos;s what needs your attention.
              </h2>
            </div>
            <Link
              href="/ai-interview"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start AI Interview
            </Link>
          </div>
        </div>

        {/* Needs Attention + Risks */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Needs Attention
            </p>
            <div className="mt-4 space-y-3">
              {needsAttention.map((item) => (
                <div
                  key={item.id}
                  className={[
                    "rounded-xl border p-4",
                    item.severity === "high"
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50",
                  ].join(" ")}
                >
                  <p className={["text-sm font-semibold", item.severity === "high" ? "text-red-800" : "text-amber-800"].join(" ")}>
                    {item.title}
                  </p>
                  <p className={["mt-1 text-xs leading-5", item.severity === "high" ? "text-red-700" : "text-amber-700"].join(" ")}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Risks
            </p>
            <ul className="mt-4 space-y-3">
              {risks.map((risk) => (
                <li key={risk} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  {risk}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Opportunities + Questions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Opportunities
            </p>
            <div className="mt-4 space-y-3">
              {opportunities.map((opp) => (
                <div key={opp.title} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">{opp.title}</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-700">{opp.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Questions for You
            </p>
            <div className="mt-4 space-y-3">
              {questionsForYou.map((q) => (
                <div key={q.question} className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-sky-800">{q.question}</p>
                  <p className="mt-1 text-xs leading-5 text-sky-700">{q.context}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Decisions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recent Decisions
            </p>
            <Link href="/decisions" className="text-xs font-medium text-slate-500 hover:text-slate-800">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {recentDecisions.map((d) => (
              <div
                key={d.title}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.date}</p>
                </div>
                <span className={["text-xs font-semibold", outcomeColor[d.outcome] ?? "text-slate-500"].join(" ")}>
                  {d.outcome}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Knowledge + Connected Systems */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Company Knowledge
              </p>
              <Link href="/knowledge" className="text-xs font-medium text-slate-500 hover:text-slate-800">
                View all
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {knowledgeSummary.map((k) => (
                <div key={k.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{k.count}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{k.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Connected Systems
              </p>
              <Link href="/connections" className="text-xs font-medium text-slate-500 hover:text-slate-800">
                Manage
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {connectedSystems.map((sys) => (
                <span
                  key={sys}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500"
                >
                  {sys}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">All systems — Not connected</p>
          </section>
        </div>
      </div>
    </CompanyBrainLayout>
  );
}
