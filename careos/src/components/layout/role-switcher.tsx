"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roles } from "@/lib/roles";
import { useRole } from "@/providers/role-provider";
import { cn } from "@/lib/utils";

/**
 * Demo role switcher. Lets a presenter walk through every experience live.
 * In production this control does not exist — roles come from authentication.
 */
export function RoleSwitcher() {
  const { role, definition, setRole } = useRole();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label={`Viewing as ${definition.label}. Switch demo role`}>
          <UserCog className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="hidden sm:inline">{definition.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Experience CareOS as…</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((r) => (
          <DropdownMenuItem
            key={r.id}
            onSelect={() => {
              setRole(r.id);
              router.push(r.homePath);
            }}
            className={cn("flex-col items-start gap-0.5 py-2.5", r.id === role && "bg-accent")}
          >
            <span className="text-sm font-medium">{r.label}</span>
            <span className="text-xs text-muted-foreground">{r.demoUser.name} · {r.demoUser.detail}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
