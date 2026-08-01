"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import {
  CalendarDays, Home, Film, Video, BarChart3, Users, Mic, FlaskConical,
  BookOpen, ClipboardCheck, Settings, Menu, X,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Today", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/content", label: "Content", icon: Film },
  { href: "/studio", label: "Recording Studio", icon: Video },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/community", label: "Community", icon: Users },
  { href: "/talks", label: "Talks", icon: Mic },
  { href: "/growth", label: "Growth Lab", icon: FlaskConical },
  { href: "/practice", label: "Practice Library", icon: BookOpen },
  { href: "/review", label: "Weekly Review", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              active ? "bg-ink-line text-paper" : "text-paper-dim hover:bg-ink-soft hover:text-paper",
            )}
          >
            <Icon size={17} className="shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-6 border-r border-ink-line px-4 py-6 sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2 px-1">
        <Logo size={30} />
      </Link>
      <NavList />
      <div className="mt-auto text-[11px] text-grey px-2 leading-relaxed">
        <p>One useful idea in under 20 seconds, followed by one real question.</p>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-ink-line bg-ink/95 backdrop-blur px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
        </Link>
        <button className="btn btn-ghost p-2" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu size={20} />
        </button>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-ink border-r border-ink-line p-4 flex flex-col gap-6 animate-fadein">
            <div className="flex items-center justify-between">
              <Logo size={26} />
              <button className="btn btn-ghost p-2" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
