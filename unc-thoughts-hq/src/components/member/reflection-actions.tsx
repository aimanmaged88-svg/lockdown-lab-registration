"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReflection } from "@/lib/unk/actions";
import { Trash2 } from "lucide-react";

export function DeleteReflection({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-ghost text-xs"
      disabled={pending}
      aria-label="Delete this private answer"
      onClick={() => {
        if (window.confirm("Delete this private answer for good? This can't be undone.")) {
          start(async () => { await deleteReflection(id); router.refresh(); });
        }
      }}
    >
      <Trash2 size={13} /> Delete
    </button>
  );
}
