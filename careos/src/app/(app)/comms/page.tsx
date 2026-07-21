"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Inbox, Mail, MessageSquare, Phone, Send, Sparkles, Timer, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { inboxThreads, commsStats, aiReception, commsDifference } from "@/data/comms";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const channelMeta = {
  sms: { icon: MessageSquare, label: "SMS", color: "text-primary" },
  call: { icon: Phone, label: "Call", color: "text-secondary" },
  email: { icon: Mail, label: "Email", color: "text-primary" },
  chat: { icon: MessageSquare, label: "Chat", color: "text-secondary" },
};

export default function CommsPage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Communications Hub"
        title="Every conversation in one place — and tied to the person it's about."
        description="SMS, calls, email and chat land in a single inbox, each linked to the participant or family it concerns. When no one can pick up, an AI receptionist answers 24/7, transcribes the call, pulls out the action items and drafts a reply for a person to approve. No family left on hold, nothing lost between the phone and the file."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Channels unified" value={String(commsStats.unified)} icon={Inbox} detail="SMS · calls · email · chat" />
        <StatCard label="First contacts handled by AI" value={`${commsStats.handledByAI}%`} icon={Zap} detail="answered, transcribed, actioned" />
        <StatCard label="Avg response time" value={commsStats.avgResponse} icon={Timer} detail="down from hours" />
        <StatCard label="Open threads" value={String(commsStats.openThreads)} icon={CheckCircle2} detail="all with an owner" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Unified inbox */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Unified inbox</CardTitle>
              <CardDescription>One thread list across every channel. Each is linked to the person it's about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {inboxThreads.map((t) => {
                const ch = channelMeta[t.channel];
                return (
                  <div key={t.id} className={cn("flex items-center gap-3 rounded-xl border p-3", t.unread ? "border-primary/20 bg-primary-soft/25" : "bg-background/60")}>
                    <PersonAvatar initials={t.initials} gradient="from-primary to-secondary" size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">· {t.about}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{t.preview}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", ch.color)}>
                        <ch.icon className="h-3 w-3" aria-hidden="true" />
                        {ch.label}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">{t.time}</span>
                    </div>
                    {t.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="unread" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI receptionist */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                AI receptionist
              </CardTitle>
              <CardDescription>Answered a call {aiReception.when}. Here's what it did.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl bg-card/70 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Transcript · {aiReception.caller} re {aiReception.about}</p>
                <p className="mt-1 text-xs italic leading-relaxed text-foreground">{aiReception.transcript}</p>
              </div>
              <div className="rounded-2xl bg-card/70 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Action items</p>
                <ul className="mt-1.5 space-y-1.5">
                  {aiReception.actions.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-xs text-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-card/70 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Drafted reply · you approve</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground">{aiReception.draftReply}</p>
                <Button size="sm" className="mt-2.5" onClick={() => toast.success("Reply sent", { description: "Sent to Faraz, logged to Zayd's record, and both action items added to the team's tasks." })}>
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  Approve & send
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* The difference */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              The Communications Hub difference
            </CardTitle>
            <CardDescription>Others bolt a shared inbox onto a CRM. CareOS makes every conversation part of the person's record.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {commsDifference.map((d) => (
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
