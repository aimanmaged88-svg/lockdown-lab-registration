"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { navItems } from "@/config/navigation";
import { canSee } from "@/lib/roles";
import { useRole } from "@/providers/role-provider";
import { Logo } from "@/components/layout/logo";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Slide-in navigation for phones and small tablets. */
export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { role, definition } = useRole();
  const visible = navItems.filter((item) => canSee(role, item.key));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b p-5 text-left">
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex h-[calc(100%-160px)] flex-col gap-0.5 overflow-y-auto p-3 scrollbar-thin" aria-label="Mobile navigation">
          {visible.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => onOpenChange(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                  active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t bg-card p-4">
          <div className="flex items-center gap-3">
            <PersonAvatar initials={definition.demoUser.initials} gradient="from-primary to-secondary" size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{definition.demoUser.name}</p>
              <p className="truncate text-xs text-muted-foreground">{definition.demoUser.detail}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
