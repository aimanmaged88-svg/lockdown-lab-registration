"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navItems } from "@/config/navigation";
import { canSee } from "@/lib/roles";
import { useRole } from "@/providers/role-provider";
import { participants } from "@/data/participants";
import { PersonAvatar } from "@/components/shared/person-avatar";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ⌘K everywhere — navigate the whole platform without leaving the keyboard. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { role } = useRole();

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search people, pages and actions…" />
      <CommandList>
        <CommandEmpty>Nothing found — try a participant's name or a page.</CommandEmpty>
        <CommandGroup heading="Participants">
          {participants.map((p) => (
            <CommandItem key={p.id} value={`${p.name} ${p.preferredName}`} onSelect={() => go(`/participants/${p.id}`)}>
              <PersonAvatar initials={p.initials} gradient={p.gradient} size="sm" />
              <div className="flex flex-col">
                <span>{p.preferredName}</span>
                <span className="text-xs text-muted-foreground">{p.tagline}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {navItems
            .filter((item) => canSee(role, item.key))
            .map((item) => (
              <CommandItem key={item.key} value={item.label} onSelect={() => go(item.href)}>
                <item.icon aria-hidden="true" />
                {item.label}
              </CommandItem>
            ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem value="start shift" onSelect={() => go("/shift")}>
            <Users aria-hidden="true" />
            Start today's shift
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
