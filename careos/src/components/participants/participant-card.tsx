"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { MoodPill } from "@/components/shared/mood-pill";
import { MoodSparkline } from "@/components/charts/mood-sparkline";
import { fadeUp, cardHover } from "@/lib/motion";
import type { Participant } from "@/types";

export function ParticipantCard({ participant }: { participant: Participant }) {
  const activeGoals = participant.goals.filter((g) => g.status !== "achieved");
  const avgProgress = Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / Math.max(activeGoals.length, 1));
  const nextAppointment = participant.appointments[0];
  const importantAlerts = participant.riskAlerts.filter((r) => r.level === "important");

  return (
    <motion.div variants={fadeUp} {...cardHover}>
      <Link
        href={`/participants/${participant.id}`}
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
        aria-label={`Open ${participant.preferredName}'s profile`}
      >
        <Card className="group h-full transition-shadow duration-300 hover:shadow-lifted">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <PersonAvatar initials={participant.initials} gradient={participant.gradient} size="lg" />
                <div>
                  <p className="font-display text-lg font-semibold leading-tight">{participant.preferredName}</p>
                  <p className="text-xs text-muted-foreground">{participant.pronouns} · {participant.age}</p>
                </div>
              </div>
              <MoodPill mood={participant.mood} />
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{participant.tagline}</p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Target className="h-3.5 w-3.5" aria-hidden="true" />
                  {activeGoals.length} active goals
                </span>
                <span className="font-semibold text-foreground">{avgProgress}%</span>
              </div>
              <Progress value={avgProgress} aria-label={`Average goal progress ${avgProgress}%`} />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Mood — last 8 days</p>
              <MoodSparkline data={participant.moodTrend} id={participant.id} />
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3.5">
              <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {nextAppointment ? `${nextAppointment.title} · ${nextAppointment.time}` : "No upcoming appointments"}
                </span>
              </div>
              {importantAlerts.length > 0 && (
                <Badge variant="warning" className="shrink-0">{importantAlerts.length} alert{importantAlerts.length > 1 ? "s" : ""}</Badge>
              )}
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
