"use client";

import * as React from "react";
import type { Role } from "@/types";
import { getRole, type RoleDefinition } from "@/lib/roles";

/**
 * Demo role context.
 *
 * In production, role comes from the authenticated Supabase session and is
 * enforced by Row Level Security. In the clickable demo, the presenter can
 * switch roles live to show each experience.
 */

interface RoleContextValue {
  role: Role;
  definition: RoleDefinition;
  setRole: (role: Role) => void;
}

const RoleContext = React.createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "careos-demo-role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("support-worker");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored) setRoleState(stored);
  }, []);

  const setRole = React.useCallback((next: Role) => {
    setRoleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = React.useMemo(
    () => ({ role, definition: getRole(role), setRole }),
    [role, setRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
