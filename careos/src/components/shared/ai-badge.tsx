import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marks anything AI-generated. AI output is always labelled, always
 * explainable, and always subject to human review before it becomes a record.
 */
export function AiBadge({ label = "AI draft — review before saving", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-soft to-secondary-soft px-2.5 py-1 text-xs font-medium text-primary",
        className
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
