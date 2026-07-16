"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, BellOff, Check, HeartHandshake, PartyPopper, Settings2, Sparkles, TriangleAlert, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { notifications as seedNotifications } from "@/data/notifications";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types";

const kindConfig: Record<NotificationItem["kind"], { icon: React.ComponentType<{ className?: string }>; className: string; label: string }> = {
  milestone: { icon: PartyPopper, className: "bg-warning-soft text-warning", label: "Milestone" },
  family: { icon: HeartHandshake, className: "bg-secondary-soft text-secondary", label: "Family" },
  shift: { icon: CalendarClock, className: "bg-primary-soft text-primary", label: "Shift" },
  alert: { icon: TriangleAlert, className: "bg-destructive-soft text-destructive", label: "Alert" },
  ai: { icon: Sparkles, className: "bg-primary-soft text-primary", label: "AI insight" },
  system: { icon: Settings2, className: "bg-muted text-muted-foreground", label: "System" },
};

/** Every notification has purpose — celebration, information or action. Never noise. */
export default function NotificationsPage() {
  const [items, setItems] = React.useState(seedNotifications);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const visible = filter === "all" ? items : items.filter((n) => !n.read);
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title={unreadCount > 0 ? `${unreadCount} things worth knowing` : "You're all caught up"}
        description="Milestones to celebrate, notes from families, and the occasional thing that needs you. Nothing here is noise."
      >
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")} aria-pressed={filter === "all"}>
            All
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")} aria-pressed={filter === "unread"}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0}
            onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Mark all read
          </Button>
        </div>
      </PageHeader>

      {visible.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nothing unread"
          description="When something matters — a milestone, a family note, an alert — it will arrive here with context, not clutter."
          action={{ label: "Back to dashboard", href: "/dashboard" }}
        />
      ) : (
        <motion.ol variants={staggerContainer} initial="initial" animate="animate" className="space-y-2.5" aria-label="Notifications">
          {visible.map((n) => {
            const config = kindConfig[n.kind];
            const Icon = config.icon;
            return (
              <motion.li key={n.id} variants={fadeUp}>
                <Link
                  href={n.href ?? "#"}
                  onClick={() => setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                  className={cn(
                    "flex items-start gap-3.5 rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    n.read ? "bg-card/60" : "border-primary/20 bg-card shadow-soft"
                  )}
                >
                  <span className={cn("mt-0.5 rounded-xl p-2.5", config.className)}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("text-sm", n.read ? "font-medium text-muted-foreground" : "font-semibold")}>{n.title}</p>
                      <Badge variant="muted" className="font-normal">{config.label}</Badge>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">{n.time}</time>
                </Link>
              </motion.li>
            );
          })}
        </motion.ol>
      )}

      <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          CareOS batches non-urgent notifications into calm digests and reserves push alerts for things that genuinely need you.
          Tune per-channel preferences in <Link href="/settings" className="font-medium text-primary hover:underline">Settings</Link>.
        </p>
      </motion.div>
    </motion.div>
  );
}
