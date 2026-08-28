"use client";

import { UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/decisions", label: "Decisions" },
  { href: "/insights", label: "Insights" },
  { href: "/connections", label: "Connections" },
  { href: "/ai-interview", label: "AI Interview" },
  { href: "/settings", label: "Settings" },
];

export function CompanyBrainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const viewer = useQuery(api.companies.viewer);
  const setActiveCompany = useMutation(api.companies.setActive);

  useEffect(() => {
    if (viewer && !viewer.activeCompany) {
      router.replace("/create-company");
    }
  }, [router, viewer]);

  if (viewer === undefined || !viewer?.activeCompany) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-500">Loading workspace...</main>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <div className="flex h-full flex-col p-5">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Company Brain
              </h1>
              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400" htmlFor="company-switcher">Active company</label>
              <select id="company-switcher" value={viewer.activeCompany._id} onChange={(event) => void setActiveCompany({ companyId: event.target.value as Id<"companies"> })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400">
                {viewer.companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}
              </select>
              <p className="mt-2 text-xs text-slate-500">{viewer.role}</p>
            </div>

            <nav aria-label="Sidebar navigation" className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href + "/");

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
            <div className="mt-6 border-t border-slate-200 pt-4">
              <Link href="/create-company" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Create company</Link>
              <div className="mt-3 px-3"><UserButton /></div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
