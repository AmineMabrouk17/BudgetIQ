"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PiggyBank, Shield } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export default function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/salary-planner",
      label: "Salary Planner",
      icon: PiggyBank,
    },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <aside className="hidden lg:block lg:w-60 lg:shrink-0">
      <nav className="sticky top-16 flex max-h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto border-r border-base-300/60 bg-base-100/60 p-3">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-base-content/50">
          Finance
        </p>
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`btn btn-sm justify-start gap-2 ${
                active
                  ? "btn-active bg-base-300/80"
                  : "btn-ghost font-normal text-base-content/70 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}