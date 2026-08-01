import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card p-4 md:p-5", className)}>{children}</div>;
}

export function Section({
  title,
  desc,
  action,
  children,
  className,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl">{title}</h2>
          {desc && <p className="text-sm text-grey mt-0.5">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "accent";
  className?: string;
}) {
  const tones = {
    default: "border-ink-line2 text-paper-dim",
    good: "border-good/50 text-good",
    warn: "border-warn/50 text-warn",
    bad: "border-bad/50 text-accent-soft",
    accent: "border-accent/50 text-accent-soft",
  };
  return <span className={cn("chip", tones[tone], className)}>{children}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="eyebrow">{label}</div>
      <div className="text-2xl md:text-3xl font-display font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-grey mt-1">{sub}</div>}
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-paper-dim">{title}</p>
      {hint && <p className="text-sm text-grey mt-1">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LinkButton({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <Link href={href} className={cn("btn", primary && "btn-primary")}>
      {children}
    </Link>
  );
}

export function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 rounded-full bg-ink-line overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="h-full bg-paper" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function pillarTone(pillar: string): "good" | "warn" | "accent" | "default" {
  return pillar === "Basketball" ? "accent" : pillar === "Nutrition" ? "good" : pillar === "Mindset" ? "warn" : "default";
}
