"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { navItems } from "@/config/navigation";
import { canSee } from "@/lib/roles";
import { useRole } from "@/providers/role-provider";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar for phones — the app should feel installed, not browsed.
 * Shows the role's four most important destinations plus a More sheet.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { role } = useRole();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const visible = navItems.filter((item) => canSee(role, item.key));
  const tabs = visible.slice(0, 4);

  // Short, self-contained labels for the tab bar (avoids dangling words like "Today's").
  const shortLabels: Record<string, string> = {
    shift: "Shift",
    participants: "People",
    dashboard: "Home",
    executive: "Exec",
    provider: "Org",
    family: "Family",
    timeline: "Timeline",
    roster: "Roster",
    compliance: "Comply",
    billing: "Billing",
    marketplace: "Find",
    "support-circle": "Circle",
    assistant: "Assistant",
    learning: "Learn",
    community: "Places",
    reports: "Reports",
    notifications: "Alerts",
    settings: "Settings",
    help: "Help",
  };

  return (
    <>
      <nav
        aria-label="Quick navigation"
        className="glass fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-safe shadow-[0_-8px_24px_-12px_rgb(16_24_40_/_0.16)] lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {tabs.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-active"
                    className="absolute inset-x-3 top-1.5 h-9 rounded-2xl bg-primary-soft"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <item.icon className="relative h-5 w-5" aria-hidden="true" />
                <span className="relative">{shortLabels[item.key] ?? item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="More navigation options"
          >
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>

      <MobileNav open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
