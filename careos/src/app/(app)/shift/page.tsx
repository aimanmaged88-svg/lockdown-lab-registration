"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlarmClock,
  Check,
  Ear,
  Heart,
  Lightbulb,
  MessageCircle,
  Mic,
  Pill,
  ShieldAlert,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { AiBadge } from "@/components/shared/ai-badge";
import { shifts } from "@/data/shifts";
import { participants } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/types";

const categoryConfig: Record<ChecklistItem["category"], { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  routine: { icon: AlarmClock, className: "bg-primary-soft text-primary" },
  medication: { icon: Pill, className: "bg-destructive-soft text-destructive" },
  goal: { icon: Target, className: "bg-secondary-soft text-secondary" },
  community: { icon: Users, className: "bg-warning-soft text-warning" },
  wellbeing: { icon: Heart, className: "bg-success-soft text-success" },
  handover: { icon: MessageCircle, className: "bg-muted text-muted-foreground" },
};

const aiDrafts: Record<string, string> = {
  "shift-milo-am":
    "Milo had a calm, confident morning and completed his entire routine independently for the fifth day running — a new personal best. He previewed tonight's dinner from the menu card without prompting, packed his school bag himself (iPad at 100%), and counted all four level crossings on the walk to the bus. Fluoxetine 20mg given at 8:02am with breakfast, double-signed. No signs of overwhelm at the crossing; platform rule followed independently. Suggested focus for the afternoon team: celebrate the streak quietly — big fuss tends to embarrass him.",
  "shift-ava-day":
    "Ava started the day at pain 2/10 and chose a hair-wash morning. Baclofen and Vitamin D given as charted at 9am. The protected writing block ran the full 90 minutes — she drafted the closing section of her conference talk and seemed very satisfied (head tilt + smirk deployed twice). Repositioned at 10am and 12pm per chart; seating photographed for next week's AT review. Afternoon plan: full rehearsal at 2pm with Sparky at 100%, afternoon Baclofen due at the same time. Mealtime plan followed exactly at lunch, no coughing observed.",
  "shift-jordan-pm":
    "Jordan reported a mid-range energy budget at check-in and chose to keep the laksa plan (chicken stock verified shellfish-free). They led the entire cook with timers running, and I assisted with plating only. Three wins named at dinner: solo morning, third city trip, organising Mo's lift for tomorrow. Tomorrow's whiteboard is done and photographed — peer group at 6pm, neuropsych review on the 23rd flagged. EpiPen backpack check due 1 Aug (flagged to team leader). Fatigue wall arrived around 7pm; wind-down started on time.",
};

export default function ShiftPage() {
  const [selectedId, setSelectedId] = React.useState(shifts.find((s) => s.status === "active")?.id ?? shifts[0].id);
  const [checked, setChecked] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(shifts.flatMap((s) => s.checklist.map((c) => [`${s.id}-${c.id}`, c.done])))
  );
  const [note, setNote] = React.useState("");
  const [drafting, setDrafting] = React.useState(false);

  const shift = shifts.find((s) => s.id === selectedId)!;
  const participant = participants.find((p) => p.id === shift.participantId)!;

  const items = shift.checklist;
  const doneCount = items.filter((c) => checked[`${shift.id}-${c.id}`]).length;
  const progress = Math.round((doneCount / items.length) * 100);

  const toggle = (itemId: string) => {
    const key = `${shift.id}-${itemId}`;
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) toast.success("Nice — checked off.", { duration: 1600 });
      return next;
    });
  };

  const draftWithAi = () => {
    setDrafting(true);
    setNote("");
    // Simulated AI draft — production calls the AI service layer with review-before-save enforced.
    window.setTimeout(() => {
      setNote(aiDrafts[shift.id]);
      setDrafting(false);
      toast("AI draft ready", { description: "Read it, make it yours, then save. Nothing is recorded without you." });
    }, 900);
  };

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        eyebrow="Smart Shift"
        title="Today's shifts"
        description="Everything you need before you knock on the door — briefing, goals, alerts and a checklist that adapts to the person."
      />

      {/* Shift selector */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3" role="group" aria-label="Choose a shift">
        {shifts.map((s) => {
          const sp = participants.find((p) => p.id === s.participantId)!;
          const active = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 pr-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary/40 bg-primary-soft shadow-glow" : "bg-card shadow-soft hover:shadow-card"
              )}
            >
              <PersonAvatar initials={sp.initials} gradient={sp.gradient} size="sm" />
              <div>
                <p className="text-sm font-semibold">{sp.preferredName}</p>
                <p className="text-xs text-muted-foreground">{s.start} – {s.end}</p>
              </div>
              <Badge
                variant={s.status === "active" ? "success" : s.status === "upcoming" ? "default" : "muted"}
                className="ml-1 capitalize"
              >
                {s.status}
              </Badge>
            </button>
          );
        })}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Briefing column */}
        <motion.div variants={fadeUp} className="space-y-5 xl:col-span-2">
          <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                Shift briefing — {participant.preferredName}
              </CardTitle>
              <CardDescription>{shift.focus}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-xl bg-card/80 p-4 text-sm font-medium leading-relaxed">{shift.briefing.headline}</p>

              <BriefingSection icon={Lightbulb} title="Remember" items={shift.briefing.remember} />
              <BriefingSection icon={MessageCircle} title="Communication" items={shift.briefing.communicationTips} />
              <BriefingSection icon={Ear} title="Sensory" items={shift.briefing.sensoryNotes} />

              <div className="rounded-xl border border-destructive/20 bg-destructive-soft/50 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  Alerts
                </p>
                <ul className="space-y-1.5">
                  {shift.briefing.alerts.map((a) => (
                    <li key={a} className="text-sm leading-relaxed">{a}</li>
                  ))}
                </ul>
              </div>

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/participants/${participant.id}`}>Open {participant.preferredName}'s full profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TriangleAlert className="h-4 w-4 text-warning" aria-hidden="true" />
                Something happened?
              </CardTitle>
              <CardDescription>
                Incidents are reported in under two minutes, with the participant's dignity front and centre. Your team leader is notified instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="soft"
                className="w-full"
                onClick={() =>
                  toast("Incident report started", {
                    description: "In the full platform this opens the guided incident flow with instant team-leader notification.",
                  })
                }
              >
                Start incident report
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Checklist + notes column */}
        <motion.div variants={fadeUp} className="space-y-5 xl:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Adaptive checklist</CardTitle>
                  <CardDescription>Built from {participant.preferredName}'s routines, goals and medication plan.</CardDescription>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-semibold">{doneCount}/{items.length}</p>
                  <p className="text-xs text-muted-foreground">complete</p>
                </div>
              </div>
              <Progress value={progress} className="mt-3" aria-label={`Shift checklist ${progress}% complete`} />
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const isDone = checked[`${shift.id}-${item.id}`];
                const config = categoryConfig[item.category];
                const Icon = config.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-pressed={isDone}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isDone ? "border-success/25 bg-success-soft/40" : "bg-background/60 hover:shadow-soft"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isDone ? "border-success bg-success text-white" : "border-input"
                      )}
                      aria-hidden="true"
                    >
                      {isDone && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{item.time}</span>
                        <p className={cn("text-sm font-medium", isDone && "text-muted-foreground line-through decoration-success/50")}>
                          {item.title}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className={cn("rounded-lg p-1.5", config.className)}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Shift notes</CardTitle>
                  <CardDescription>The AI drafts. You decide what becomes the record.</CardDescription>
                </div>
                <AiBadge />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={drafting ? "Reading today's checklist, goals and observations…" : note}
                onChange={(e) => setNote(e.target.value)}
                rows={7}
                placeholder={`How did ${participant.preferredName}'s shift really go? Write it yourself, dictate it, or let the AI draft from today's activity.`}
                aria-label="Shift notes"
                className={cn(drafting && "animate-pulse-soft text-muted-foreground")}
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={draftWithAi} disabled={drafting}>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {drafting ? "Drafting…" : "Draft with AI"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast("Voice dictation", { description: "Hold to speak in the full platform — notes transcribe as you talk." })}
                >
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  Dictate
                </Button>
                <Button
                  variant="secondary"
                  className="ml-auto"
                  disabled={!note || drafting}
                  onClick={() => {
                    toast.success("Note saved & handover sent", {
                      description: "Shared with the afternoon team — and the agreed summary is on its way to the family portal.",
                    });
                  }}
                >
                  Review & save
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function BriefingSection({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
