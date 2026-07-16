"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { CommandPalette } from "@/components/layout/command-palette";
import { MobileNav } from "@/components/layout/mobile-nav";
import { notifications } from "@/data/notifications";

/** Top navigation: search, theme, notifications and the demo role switcher. */
export function Topbar() {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden h-10 flex-1 items-center gap-2.5 rounded-xl border bg-card px-3.5 text-sm text-muted-foreground shadow-soft transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex md:max-w-md"
          aria-label="Search CareOS (Command K)"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>Search people, pages, actions…</span>
          <kbd className="ml-auto rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setPaletteOpen(true)}>
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notifications" aria-label={`Notifications — ${unread} unread`} className="relative">
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-destructive" />
                </span>
              )}
            </Link>
          </Button>
          <RoleSwitcher />
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  );
}
