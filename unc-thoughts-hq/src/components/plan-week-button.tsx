"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { planNextWeek } from "@/lib/planner";
import { CalendarPlus } from "lucide-react";

export function PlanWeekButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-good">{msg}</span>}
      <button
        className="btn btn-primary"
        disabled={pending}
        onClick={() => start(async () => {
          const r = await planNextWeek();
          setMsg(r.created ? `${r.created} day${r.created === 1 ? "" : "s"} planned from your teaching.` : "Week's already full — nothing to add.");
          router.refresh();
        })}
      >
        <CalendarPlus size={15} /> {pending ? "Planning…" : "Plan my week"}
      </button>
    </div>
  );
}
