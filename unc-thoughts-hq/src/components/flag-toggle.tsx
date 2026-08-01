"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeatureFlag } from "@/lib/actions";

export function FlagToggle({ flagKey, enabled, label }: { flagKey: string; enabled: boolean; label: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        disabled={pending}
        onChange={(e) => start(async () => { await setFeatureFlag(flagKey, e.target.checked); router.refresh(); })}
        className="h-4 w-4"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
