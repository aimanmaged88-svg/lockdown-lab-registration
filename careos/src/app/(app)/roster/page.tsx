"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Clock, Sparkles, TriangleAlert, UserPlus, Users, Wand2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { rosterWeek, rosterStats, rosterAiNotes, type RosterShift } from "@/data/roster";
import { getParticipant } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusStyles: Record<RosterShift["status"], { border: string; badge: "success" | "warning" | "destructive" | "muted"; label: string }> = {
  confirmed: { border: "border-l-success", badge: "success", label: "Confirmed" },
  open: { border: "border-l-destructive", badge: "destructive", label: "Open" },
  attention: { border: "border-l-warning", badge: "warning", label: "Check" },
};

export default function RosterPage() {
  const byDay = React.useMemo(() => {
    const map: Record<string, RosterShift[]> = {};
    for (const d of days) map[d] = rosterWeek.filter((s) => s.day === d);
    return map;
  }, []);

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Rostering · Week of 13–19 July 2026"
        title="Rostering that knows the participant, not just the hours"
        description="Every shift carries the person's goals, alerts and preferred workers. The AI fills gaps with the right match — and blocks award clashes before they reach the roster."
      >
        <Button onClick={() => toast.success("AI auto-fill", { description: "Both open shifts matched to credential-current core-team workers. Review and confirm with one tap." })}>
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          Auto-fill 2 open shifts
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Shifts this week" value={String(rosterStats.shiftsThisWeek)} icon={CalendarClock} detail="across 5 participants" />
        <StatCard label="Coverage" value={`${rosterStats.coverage}%`} icon={CheckCircle2} change="+4%" direction="up" detail="core-team first" />
        <StatCard label="Open shifts" value={String(rosterStats.openShifts)} icon={UserPlus} detail="AI has matches ready" positive={false} />
        <StatCard label="Clashes prevented" value={String(rosterStats.clashesPrevented)} icon={ShieldCheck} detail="blocked at draft time" />
      </div>

      {/* AI roster intelligence */}
      <motion.div variants={fadeUp}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Roster intelligence
            </CardTitle>
            <CardDescription>What the AI noticed about this week — you decide, it prepares.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {rosterAiNotes.map((note) => (
              <div key={note.title} className="rounded-2xl bg-card/70 p-4">
                <p className="text-sm font-semibold">{note.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{note.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly grid */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This week</CardTitle>
            <CardDescription>Colour-coded by status. Open shifts show the AI's suggested match.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto scrollbar-thin">
              <div className="grid min-w-[880px] grid-cols-7 gap-3">
                {days.map((day) => (
                  <div key={day} className="space-y-2.5">
                    <div className="flex items-baseline justify-between border-b pb-2">
                      <p className="text-sm font-semibold">{day}</p>
                      <p className="text-xs text-muted-foreground">{byDay[day][0]?.date.split(" ")[0]}</p>
                    </div>
                    {byDay[day].map((shift) => {
                      const p = getParticipant(shift.participantId)!;
                      const style = statusStyles[shift.status];
                      return (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() =>
                            toast(shift.worker ? `${p.preferredName} · ${shift.worker}` : `Open shift · ${p.preferredName}`, {
                              description: shift.note ?? `${shift.time} · ${style.label}`,
                            })
                          }
                          className={cn(
                            "w-full rounded-xl border border-l-4 bg-background/60 p-2.5 text-left transition-all hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            style.border
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <PersonAvatar initials={p.initials} gradient={p.gradient} size="sm" className="h-6 w-6 text-[10px]" />
                            <span className="truncate text-xs font-semibold">{p.preferredName}</span>
                          </div>
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {shift.time}
                          </p>
                          {shift.worker ? (
                            <p className="mt-1 truncate text-[11px] text-muted-foreground">{shift.worker}</p>
                          ) : (
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive">
                              <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                              Needs a worker
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Where others roster by availability, CareOS rosters by <span className="font-medium text-foreground">continuity and outcomes</span>: it protects each
          participant's core team, honours preferred-worker plans, checks credentials and award rules in real time, and every completed shift flows
          straight into progress notes, billing and audit evidence — no double entry, ever.
        </p>
      </motion.div>
    </motion.div>
  );
}
