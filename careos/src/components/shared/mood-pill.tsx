import { cn } from "@/lib/utils";
import type { Mood } from "@/types";

const moods: Record<Mood, { label: string; emoji: string; className: string }> = {
  great: { label: "Great day", emoji: "😄", className: "bg-success-soft text-success" },
  good: { label: "Good day", emoji: "🙂", className: "bg-secondary-soft text-secondary" },
  okay: { label: "Okay day", emoji: "😐", className: "bg-muted text-muted-foreground" },
  low: { label: "Low day", emoji: "😕", className: "bg-warning-soft text-warning" },
  distressed: { label: "Hard day", emoji: "😣", className: "bg-destructive-soft text-destructive" },
};

export function MoodPill({ mood, className }: { mood: Mood; className?: string }) {
  const m = moods[mood];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        m.className,
        className
      )}
    >
      <span aria-hidden="true">{m.emoji}</span>
      {m.label}
    </span>
  );
}
