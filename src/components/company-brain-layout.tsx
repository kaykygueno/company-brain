"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <div className="flex h-full flex-col p-5">
            {/* Brand */}
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Company Brain
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">DublinBrew</p>
            </div>

            {/* Nav */}
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
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
