import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/ai-interview", label: "AI Interview" },
  { href: "/company-knowledge", label: "Company Knowledge" },
  { href: "/business-data", label: "Business Data" },
  { href: "/events", label: "Events" },
  { href: "/settings", label: "Settings" },
];

export function CompanyBrainLayout({
  children,
  activePage,
}: {
  children: ReactNode;
  activePage: string;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-200 bg-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col p-5">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Company Brain
              </h1>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Company
                </label>
                <select
                  defaultValue="DublinBrew"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-slate-400"
                  aria-label="Select company"
                >
                  <option value="DublinBrew">DublinBrew</option>
                </select>
              </div>
            </div>

            <nav aria-label="Sidebar navigation" className="space-y-2">
              {navItems.map((item) => {
                const isActive = item.label === activePage;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
