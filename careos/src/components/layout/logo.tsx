import { cn } from "@/lib/utils";

/** CareOS wordmark. The heart-pulse mark stands for people, not paperwork. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-glow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" aria-hidden="true">
          <path
            d="M12 20.5C12 20.5 4 15.5 4 9.8C4 6.9 6.2 4.8 8.8 4.8C10.2 4.8 11.4 5.5 12 6.5C12.6 5.5 13.8 4.8 15.2 4.8C17.8 4.8 20 6.9 20 9.8C20 15.5 12 20.5 12 20.5Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path d="M6.5 11.5H9L10.5 8.5L13 14L14.5 11.5H17.5" stroke="hsl(222 63% 47%)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight">
          Care<span className="text-primary">OS</span>
        </span>
      )}
    </div>
  );
}
