"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navItems } from "@/config/navigation";
import { canSee } from "@/lib/roles";
import { useRole } from "@/providers/role-provider";
import { Logo } from "@/components/layout/logo";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { cn } from "@/lib/utils";

const sectionLabels: Record<string, string> = {
  care: "Care",
  insight: "Insight",
  system: "System",
};

/** Desktop side navigation — calm, dark, always oriented around care. */
export function Sidebar() {
  const pathname = usePathname();
  const { role, definition } = useRole();

  const visible = navItems.filter((item) => canSee(role, item.key));
  const sections = ["care", "insight", "system"].filter((s) => visible.some((i) => i.section === s));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex" aria-label="Primary navigation">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
          <Logo className="text-white" />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
        {sections.map((section) => (
          <div key={section}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              {sectionLabels[section]}
            </p>
            <ul className="space-y-0.5">
              {visible
                .filter((item) => item.section === section)
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                          active
                            ? "text-white"
                            : "text-sidebar-foreground/65 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/10"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            aria-hidden="true"
                          />
                        )}
                        <item.icon className="relative h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        <span className="relative">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <PersonAvatar initials={definition.demoUser.initials} gradient="from-primary to-secondary" size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{definition.demoUser.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{definition.demoUser.detail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
