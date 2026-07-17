"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Clock3, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { learningTopics } from "@/data/learning";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function LearningHubPage() {
  const inProgress = learningTopics.filter((t) => t.progress > 0 && t.progress < 100);
  const completedLessons = learningTopics.reduce((sum, t) => sum + Math.round((t.progress / 100) * t.lessons), 0);

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Learning Hub"
        title="Better support starts with understanding"
        description="Practical, human, judgement-free learning — five minutes at a time, grounded in real scenarios."
      >
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft">
          <div className="rounded-xl bg-success-soft p-2 text-success">
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">{completedLessons} lessons completed</p>
            <p className="text-xs text-muted-foreground">{inProgress.length} topics in progress</p>
          </div>
        </div>
      </PageHeader>

      {/* Continue learning */}
      {inProgress.length > 0 && (
        <motion.section variants={fadeUp} aria-labelledby="continue-learning">
          <h2 id="continue-learning" className="mb-4 font-display text-xl font-semibold">Pick up where you left off</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {inProgress.slice(0, 3).map((topic) => (
              <Link
                key={topic.slug}
                href={`/learning/${topic.slug}`}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl", topic.gradient)} aria-hidden="true">
                  {topic.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{topic.title}</p>
                  <Progress value={topic.progress} className="mt-2 h-1.5" aria-label={`${topic.title}: ${topic.progress}% complete`} />
                  <p className="mt-1.5 text-xs text-muted-foreground">{topic.progress}% complete</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* All topics */}
      <motion.section variants={fadeUp} aria-labelledby="all-topics">
        <h2 id="all-topics" className="mb-4 font-display text-xl font-semibold">All topics</h2>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {learningTopics.map((topic) => (
            <motion.div key={topic.slug} variants={fadeUp}>
              <Link
                href={`/learning/${topic.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className={cn("flex h-24 items-center justify-center bg-gradient-to-br text-5xl", topic.gradient)} aria-hidden="true">
                  <span className="drop-shadow-sm transition-transform duration-300 group-hover:scale-110">{topic.emoji}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{topic.title}</h3>
                    {topic.progress === 100 ? (
                      <Badge variant="success" className="shrink-0">Done</Badge>
                    ) : topic.progress > 0 ? (
                      <Badge variant="secondary" className="shrink-0">{topic.progress}%</Badge>
                    ) : (
                      <Badge variant="muted" className="shrink-0">New</Badge>
                    )}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{topic.summary}</p>
                  <div className="flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                      {topic.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {topic.minutes} min
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
