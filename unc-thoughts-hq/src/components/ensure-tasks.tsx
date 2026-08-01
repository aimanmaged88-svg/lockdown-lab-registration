"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureDayTasks } from "@/lib/actions";

export function EnsureTasksButton({ contentId }: { contentId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      className="btn btn-primary"
      disabled={pending}
      onClick={() => start(async () => { await ensureDayTasks(contentId); router.refresh(); })}
    >
      Generate production checklist
    </button>
  );
}
