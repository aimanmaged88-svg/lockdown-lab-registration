"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BellRing,
  CheckCircle2,
  Footprints,
  HeartHandshake,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Timer,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { arrivalEvents, knockinStats, escalationLadder, knockinDifference } from "@/data/arrivals";
import { getParticipant } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "muted" }> = {
  confirmed: { label: "Confirmed", variant: "success" },
  awaiting: { label: "Awaiting confirm", variant: "warning" },
  escalated: { label: "Escalated", variant: "destructive" },
  upcoming: { label: "Upcoming", variant: "muted" },
};

export default function ArrivalsPage() {
  const [confirmed, setConfirmed] = React.useState(false);

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="KnockIn™ · Smart Arrivals"
        title="The moment you arrive, the shift knows."
        description="When a worker's phone crosses the geofence at a participant's home, KnockIn fires an alarm-grade, full-screen prompt: confirm you're starting your shift. It sounds through silent mode, it can't be turned off in the app, and it stamps the exact second of arrival — for payroll, for audit, and for families watching from the Family Portal."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Arrivals today" value={String(knockinStats.arrivalsToday)} icon={Footprints} detail="geofence-stamped to the second" />
        <StatCard label="Avg time to confirm" value={`${knockinStats.avgConfirmSeconds}s`} icon={Timer} detail="from doorstep to confirmed" />
        <StatCard label="On-time arrivals" value={`${knockinStats.onTimeRate}%`} icon={CheckCircle2} detail="this month, all teams" />
        <StatCard label="Escalations" value={String(knockinStats.escalationsThisMonth)} icon={PhoneCall} detail="this month — both resolved" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* The KnockIn alert — live demo */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
            <CardHeader>
              <CardTitle className="text-base">This is what the worker sees</CardTitle>
              <CardDescription>
                Full screen. Alarm-grade sound, even on silent. It cannot be swiped away — try it.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              {/* Phone-style alert mock */}
              <div className="w-full max-w-[300px] rounded-[2rem] border-2 border-foreground/10 bg-background p-4 shadow-lifted">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    {!confirmed && (
                      <>
                        <motion.span
                          className="absolute inset-0 rounded-full bg-primary/30"
                          animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                          aria-hidden="true"
                        />
                        <motion.span
                          className="absolute inset-0 rounded-full bg-primary/30"
                          animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: 0.8 }}
                          aria-hidden="true"
                        />
                      </>
                    )}
                    <span
                      className={cn(
                        "relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lifted",
                        confirmed ? "bg-gradient-to-br from-success to-emerald-600" : "bg-gradient-to-br from-primary to-secondary"
                      )}
                    >
                      {confirmed ? <CheckCircle2 className="h-8 w-8" aria-hidden="true" /> : <BellRing className="h-8 w-8" aria-hidden="true" />}
                    </span>
                  </div>

                  {confirmed ? (
                    <>
                      <p className="text-sm font-semibold">Shift confirmed — 1:29:02pm</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Arrived 1:28:47pm · confirmed in 15 seconds.
                        <br />
                        Idris's Smart Shift briefing is opening.
                      </p>
                      <button
                        type="button"
                        onClick={() => setConfirmed(false)}
                        className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Replay the alert
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold">You've arrived at Idris's home</p>
                      <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-success" aria-hidden="true" />
                        8 Wattlebird Ct, Fawkner · 1:28:47pm
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmed(true);
                          toast.success("Shift confirmed · 1:29:02pm", {
                            description:
                              "Arrival 1:28:47pm, confirmed in 15s. Timesheet started, Faraz's Family Portal shows \"Amira has arrived\".",
                          });
                        }}
                        className="mt-1 w-full rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-sm font-semibold text-white shadow-lifted transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                      >
                        Confirm shift start
                      </button>
                      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Volume2 className="h-3 w-3" aria-hidden="true" />
                        Sounds on silent · can't be dismissed or muted
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's arrivals */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Today's arrivals — exact to the second</CardTitle>
              <CardDescription>
                Geofence entry and confirmation are stamped separately. This is the record payroll, claims and audits use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {arrivalEvents.map((e) => {
                const p = getParticipant(e.participantId)!;
                const badge = statusBadge[e.status];
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                    <PersonAvatar initials={e.initials} gradient="from-primary to-secondary" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.worker}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        with {p.preferredName} · {e.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {e.status === "upcoming" ? `due ${e.scheduledStart}` : `arrived ${e.geofenceEntry}`}
                      </p>
                      <div className="mt-0.5 flex items-center justify-end gap-1.5">
                        {typeof e.secondsToConfirm === "number" && (
                          <span className="hidden text-[10px] tabular-nums text-success sm:inline">
                            confirmed in {e.secondsToConfirm}s
                          </span>
                        )}
                        <Badge variant={badge.variant} className="font-normal">
                          {badge.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <HeartHandshake className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Every confirmed arrival also appears instantly in the Family Portal — Faraz saw "Leila has arrived" at 8:26am.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Escalation ladder */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Why it can't be missed
            </CardTitle>
            <CardDescription>
              While a worker holds a rostered shift, KnockIn is alarm-class and non-negotiable. Ignoring it doesn't make it go away — it makes it louder.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {escalationLadder.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border bg-background/60 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <Badge variant="secondary" className="font-normal tabular-nums">{s.at}</Badge>
                </div>
                <p className="mt-2.5 text-sm font-semibold">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* The difference */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              The KnockIn difference
            </CardTitle>
            <CardDescription>
              Time clocks record when workers say they started. KnockIn records when they actually arrived — and turns that into trust.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {knockinDifference.map((d) => (
              <div key={d.title} className="rounded-2xl border bg-background/60 p-4">
                <p className="text-sm font-semibold">{d.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
