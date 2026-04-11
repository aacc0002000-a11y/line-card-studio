"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { MemberPlanBadge } from "@/components/dashboard/MemberPlanBadge";
import type { MemberProfile } from "@/lib/auth/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-cards", label: "My Cards" },
  { href: "/account", label: "Account" },
];

export function DashboardShell({
  title,
  description,
  profile,
  children,
}: {
  title: string;
  description: string;
  profile: MemberProfile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[32px] border border-line bg-card px-6 py-7 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-accent">
                LINE CARD STUDIO
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
                {description}
              </p>
            </div>

            <div className="min-w-[220px] rounded-[24px] border border-line bg-[#f8fafc] px-4 py-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted">
                MEMBER
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {profile?.displayName || profile?.email || "Member"}
              </p>
              <p className="mt-1 text-sm text-muted">{profile?.email || ""}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <MemberPlanBadge planKey={profile?.planKey || "free"} />
                <LogoutButton />
              </div>
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold hover:-translate-y-0.5 ${
                    isActive
                      ? "bg-accent text-white shadow-sm"
                      : "border border-line text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/editor"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:-translate-y-0.5"
            >
              建立新名片
            </Link>
          </nav>
        </header>

        <section className="mt-6">{children}</section>
      </div>
    </main>
  );
}
