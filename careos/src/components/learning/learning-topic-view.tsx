"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, ExternalLink, Lightbulb, MessagesSquare, Compass } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LearningTopic } from "@/types";

export function LearningTopicView({ topic }: { topic: LearningTopic }) {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp}>
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/learning">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Learning Hub
          </Link>
        </Button>
      </motion.div>

      {/* Topic hero */}
      <motion.section variants={fadeUp} className="overflow-hidden rounded-3xl border bg-card shadow-card">
        <div className={cn("flex h-32 items-center justify-center bg-gradient-to-br text-7xl md:h-36", topic.gradient)} aria-hidden="true">
          <span className="drop-shadow">{topic.emoji}</span>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{topic.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{topic.lessons} lessons · about {topic.minutes} minutes · practical from lesson one</p>
            </div>
            <div className="w-full sm:w-56">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">Your progress</span>
                <span className="font-semibold">{topic.progress}%</span>
              </div>
              <Progress value={topic.progress} aria-label={`Topic progress: ${topic.progress}%`} />
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">{topic.overview}</p>
          <Button
            className="mt-5"
            onClick={() => toast.success("Lesson started", { description: "Interactive lessons with video and quizzes ship in the production Learning Hub." })}
          >
            {topic.progress > 0 ? "Continue learning" : "Start the first lesson"}
          </Button>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
                Practical guidance
              </CardTitle>
              <CardDescription>What great support looks like, day to day.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {topic.practicalGuidance.map((g, i) => (
                  <li key={g} className="flex gap-3 text-sm leading-relaxed">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{g}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-warning" aria-hidden="true" />
                Learning cards
              </CardTitle>
              <CardDescription>The ideas worth keeping in your pocket.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {topic.learningCards.map((card) => (
                <div key={card.title} className="rounded-2xl border bg-gradient-to-br from-card to-muted/40 p-4">
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Scenarios */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessagesSquare className="h-4 w-4 text-secondary" aria-hidden="true" />
              Real-world scenarios
            </CardTitle>
            <CardDescription>Because the real skill is knowing what to do on a Tuesday afternoon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topic.scenarios.map((s) => (
              <div key={s.situation} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2 md:gap-5">
                <div>
                  <Badge variant="muted" className="mb-2">The situation</Badge>
                  <p className="text-sm leading-relaxed">{s.situation}</p>
                </div>
                <div className="rounded-xl bg-success-soft/50 p-3.5">
                  <Badge variant="success" className="mb-2">A great response</Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.approach}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* References */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Trusted references
            </CardTitle>
            <CardDescription>Placeholder in the demo — production links to vetted national bodies and clinical guidelines.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topic.references.map((ref) => (
              <div key={ref} className="flex items-center gap-2.5 rounded-xl border border-dashed bg-muted/40 p-3.5 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                {ref}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
