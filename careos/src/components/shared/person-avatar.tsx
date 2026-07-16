import { cn } from "@/lib/utils";

interface PersonAvatarProps {
  initials: string;
  gradient: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

/**
 * Demo avatar — initials on a soft gradient. The demo never uses photographs
 * of real people; every face in CareOS demo data is intentionally abstract.
 */
export function PersonAvatar({ initials, gradient, size = "md", className }: PersonAvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-soft",
        gradient,
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
