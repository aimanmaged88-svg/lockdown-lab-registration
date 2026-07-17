"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  MessageCircleQuestion,
  Phone,
  Send,
  Sparkles,
  ThumbsUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { circleThreads, circleTopics, circleStats, type CircleThread, type CircleAnswer } from "@/data/support-circle";
import { getParticipant } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function AnswerBlock({ answer }: { answer: CircleAnswer }) {
  return (
    <div className={cn("rounded-2xl p-4", answer.aiAssist ? "bg-primary-soft/50" : "bg-background/60 border")}>
      <div className="flex items-center gap-2.5">
        {answer.aiAssist ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
        ) : (
          <PersonAvatar initials={initialsOf(answer.author)} gradient="from-primary to-secondary" size="sm" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold">{answer.author}</p>
            {answer.accepted && (
              <Badge variant="success"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />Most helpful</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{answer.role} · {answer.time}</p>
        </div>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{answer.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {answer.credentials.map((c) => (
          <Badge key={c} variant={answer.aiAssist ? "default" : "muted"} className="font-normal">
            {!answer.aiAssist && <BadgeCheck className="h-3 w-3" aria-hidden="true" />}
            {c}
          </Badge>
        ))}
        <button
          type="button"
          onClick={() => toast.success("Marked helpful")}
          className="ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ThumbsUp className="h-3 w-3" aria-hidden="true" />
          {answer.helpful}
        </button>
      </div>
    </div>
  );
}

function ThreadCard({ thread }: { thread: CircleThread }) {
  const [open, setOpen] = React.useState(thread.id === "sc1");
  const participant = thread.participantId ? getParticipant(thread.participantId) : undefined;

  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <PersonAvatar initials={initialsOf(thread.author)} gradient="from-slate-400 to-slate-600" size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{thread.author}</p>
                <Badge variant="muted" className="font-normal">{thread.authorRole}</Badge>
                <span className="text-xs text-muted-foreground">{thread.time}</span>
                {thread.resolved && <Badge variant="success" className="ml-auto">Resolved</Badge>}
              </div>
              <h3 className="mt-1.5 font-semibold leading-snug">{thread.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{thread.body}</p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal">{thread.topic}</Badge>
                {participant && (
                  <Link
                    href={`/participants/${participant.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-primary-soft/50 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PersonAvatar initials={participant.initials} gradient={participant.gradient} size="sm" className="h-4 w-4 text-[8px]" />
                    About {participant.preferredName}
                  </Link>
                )}
              </div>

              {/* Access model note */}
              {participant && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <Users className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  Qualified team members who support {participant.preferredName} can open their Care DNA and recent updates to answer accurately — access is permissioned and audit-logged.
                </p>
              )}

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
                {thread.answers.length} {thread.answers.length === 1 ? "reply" : "replies"}
              </button>
            </div>
          </div>

          {open && (
            <div className="mt-4 space-y-3 border-t pt-4">
              {thread.answers.map((a) => (
                <AnswerBlock key={a.id} answer={a} />
              ))}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => toast.success("Jump in", { description: "Your reply posts to the team and notifies the person who asked. Qualified colleagues can add to it too." })}
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  Jump in & answer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SupportCirclePage() {
  const [topic, setTopic] = React.useState("All");
  const [question, setQuestion] = React.useState("");

  const filtered = topic === "All" ? circleThreads : circleThreads.filter((t) => t.topic === topic);

  const ask = () => {
    if (!question.trim()) return;
    toast.success("Posted to Support Circle", {
      description: "CareOS Assist is drafting a first reply now, and qualified colleagues have been notified. Watch for answers here.",
    });
    setQuestion("");
  };

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        eyebrow="Support Circle"
        title="Ask the team. Someone always has an answer."
        description="A private community for your qualified team. Ask a question, get an instant AI first reply, then real advice from colleagues who know the person. Shared learning that makes everyone better."
      >
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-2.5 shadow-soft">
          <Users className="h-4 w-4 text-secondary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">{circleStats.activeMembers} qualified members</p>
            <p className="text-xs text-muted-foreground">avg first reply {circleStats.avgFirstReply}</p>
          </div>
        </div>
      </PageHeader>

      {/* NON-EMERGENCY banner — impossible to miss */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-destructive/30 bg-destructive-soft/50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-destructive">This is not an emergency channel.</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                Support Circle is for general advice and shared learning only. If someone is at risk of harm, call <span className="font-semibold text-foreground">000</span> now.
                For urgent participant matters, call the participant's provider on-call line.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-destructive/30 text-destructive sm:ml-auto"
            onClick={() => toast("On-call line", { description: "In the full platform this dials the participant's current provider on-call number." })}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            On-call line
          </Button>
        </div>
      </motion.div>

      {/* Ask composer */}
      <motion.div variants={fadeUp}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/30">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold">Ask the team a question</p>
            </div>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="e.g. What helps Milo transition off the trampoline calmly? (General advice — not emergencies)"
              aria-label="Ask the Support Circle a question"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                CareOS Assist replies instantly, then colleagues who know the person add real-world advice.
              </p>
              <Button onClick={ask} disabled={!question.trim()}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Post to Support Circle
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Topic filter */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        {circleTopics.map((t) => (
          <Button key={t} variant={topic === t ? "default" : "outline"} size="sm" onClick={() => setTopic(t)} aria-pressed={topic === t}>
            {t}
          </Button>
        ))}
      </motion.div>

      {/* Threads */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {filtered.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Everyone answering here is a qualified member of your team. When a question is about a specific participant, colleagues who support that person
          can view their Care DNA and recent updates to give accurate advice — that access is role-based, consented at onboarding, and audit-logged.
          The AI first-responder gives general guidance only and always defers to the people who know the person.
        </p>
      </motion.div>
    </motion.div>
  );
}
