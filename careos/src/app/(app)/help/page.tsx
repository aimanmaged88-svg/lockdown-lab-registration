"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, LifeBuoy, MessageCircleQuestion, PhoneCall, PlayCircle, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { staggerContainer, fadeUp } from "@/lib/motion";

const guides = [
  { icon: PlayCircle, title: "Your first shift with CareOS", detail: "Five minutes from opening the app to a finished, beautiful shift note.", tag: "3 min video" },
  { icon: BookOpen, title: "Understanding the Care Timeline", detail: "How moments, milestones and AI summaries become one continuous story.", tag: "Guide" },
  { icon: Sparkles, title: "Working with the AI assistant", detail: "What it can draft, how it explains itself, and why you always review.", tag: "Guide" },
  { icon: GraduationCap, title: "The Family Portal, explained for families", detail: "A plain-language walkthrough you can share with parents and guardians.", tag: "Shareable" },
];

const faqs = [
  { q: "Who can see what I write in a shift note?", a: "Your care team and clinicians see the full note. Families see only the agreed summary — the sharing plan on each profile controls this, and every view is audit-logged." },
  { q: "What happens if I lose internet mid-shift?", a: "Keep working. Notes, checklists and observations save locally and sync automatically the moment you're back online. You'll never lose documentation." },
  { q: "Can the AI change a participant's record?", a: "No. The AI only drafts and suggests. Nothing enters a record until a person reviews and saves it — that's a platform rule, not a setting." },
  { q: "How do I report something urgent?", a: "Use the incident button on any shift screen. Your team leader is notified instantly, and the guided flow takes under two minutes." },
];

export default function HelpCentrePage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Help Centre"
        title="How can we help?"
        description="Plain answers, short videos, and real humans when you need one."
      />

      <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search help — try ‘shift notes’ or ‘family sharing’…"
          className="h-12 pl-11 text-base"
          aria-label="Search the help centre"
          onKeyDown={(e) => {
            if (e.key === "Enter") toast("Help search", { description: "Full-text help search ships with the production knowledge base." });
          }}
        />
      </motion.div>

      <motion.section variants={fadeUp} aria-labelledby="popular-guides">
        <h2 id="popular-guides" className="mb-4 font-display text-xl font-semibold">Popular guides</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <button
              key={guide.title}
              type="button"
              onClick={() => toast(guide.title, { description: "Guides open in the interactive help viewer in the full platform." })}
              className="flex items-start gap-4 rounded-2xl border bg-card p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="rounded-xl bg-primary-soft p-2.5 text-primary">
                <guide.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">{guide.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{guide.detail}</p>
                <p className="mt-2 text-xs font-medium text-primary">{guide.tag}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} aria-labelledby="faqs">
        <h2 id="faqs" className="mb-4 font-display text-xl font-semibold">Asked all the time</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border bg-card shadow-soft open:shadow-card">
              <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-medium marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
                <MessageCircleQuestion className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {faq.q}
              </summary>
              <p className="px-4 pb-4 pl-11 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </motion.section>

      <motion.section variants={fadeUp}>
        <Card className="border-primary/15 bg-gradient-to-br from-card to-primary-soft/40">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-primary-soft p-3 text-primary">
                <LifeBuoy className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Still stuck? Talk to a person.</p>
                <p className="text-sm text-muted-foreground">Our support team includes former support workers — they get it. Average response: under 4 minutes.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => toast.success("Chat opening", { description: "Live chat connects here in the production platform." })}>
                Start a chat
              </Button>
              <Button variant="outline" onClick={() => toast("Call us", { description: "1800-CAREOS (demo) · 24/7 for urgent platform issues." })}>
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                Call
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.p variants={fadeUp} className="text-center text-xs text-muted-foreground">
        Looking for disability practice knowledge instead? Visit the{" "}
        <Link href="/learning" className="font-medium text-primary hover:underline">Learning Hub</Link>.
      </motion.p>
    </motion.div>
  );
}
