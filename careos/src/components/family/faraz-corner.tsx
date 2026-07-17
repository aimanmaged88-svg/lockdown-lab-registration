"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarRange, FileCheck2, Heart, MessageSquareHeart, Send, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A personal corner of the Family Portal, written for Faraz by the person
 * who built this for him. The feedback form posts to Netlify Forms, so what
 * he types here genuinely lands with the builder — no screenshots required.
 */

const journey = [
  {
    icon: Heart,
    horizon: "In the first weeks",
    text: "Daily reassurance. Every session ends with the team's notes flowing straight here — wins, mood, photos, how the boys really went. You stop wondering and start knowing.",
  },
  {
    icon: TrendingUp,
    horizon: "Over the months",
    text: "Patterns you can act on. The AI starts connecting what the workers log — which mornings work for Idris, what actually helps Zayd sleep — with the evidence shown, so plan reviews run on data instead of memory.",
  },
  {
    icon: CalendarRange,
    horizon: "Over the years",
    text: "An unbroken story. Workers change, agencies change — the boys' record doesn't. Every milestone, every strategy that worked, every first: kept, searchable, theirs.",
  },
  {
    icon: FileCheck2,
    horizon: "When reports are due",
    text: "The end-of-year NDIS scramble becomes a button. Support workers already write notes in other systems — here, every note feeds the boys' goals and evidence as they type. Progress reports and plan-review packs assemble themselves. Other systems store the data. This one evolves with it.",
  },
];

const feelings = ["🤯 Blown away", "👍 I'd use this", "🤔 Questions", "🛠 Needs work"];

export function FarazCorner() {
  const [message, setMessage] = React.useState("");
  const [feeling, setFeeling] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const body = new URLSearchParams({
        "form-name": "faraz-feedback",
        name: "Faraz Normani",
        feeling: feeling ?? "not chosen",
        message: message.trim(),
      });
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSent(true);
      setMessage("");
      toast.success("Sent, bro 🤝", { description: "Your words just landed with me directly — no screenshots needed." });
    } catch {
      toast.error("Couldn't send from here", {
        description: "No stress — WhatsApp me instead and I'll take it from there.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.section variants={fadeUp} aria-labelledby="faraz-corner">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary-soft/50">
        <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" aria-hidden="true" />
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-primary text-primary-foreground px-3 py-1">Just for you</Badge>
            <h2 id="faraz-corner" className="font-display text-xl font-semibold md:text-2xl">
              Faraz — this bit's yours, bro.
            </h2>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            You've just seen the boys' portal. Everything above updates itself from the notes support workers
            already write — the same notes they type into other systems today that disappear into filing cabinets.
            Here's what that means for you as their dad, over time:
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {journey.map((stage) => (
              <div key={stage.horizon} className="flex gap-3.5 rounded-2xl border bg-card/70 p-4">
                <div className="mt-0.5 h-fit rounded-xl bg-primary-soft p-2.5 text-primary">
                  <stage.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{stage.horizon}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stage.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback — wired straight back to the builder */}
          <div className="mt-8 rounded-2xl border border-secondary/25 bg-secondary-soft/40 p-5">
            <div className="flex items-center gap-2">
              <MessageSquareHeart className="h-4 w-4 text-secondary" aria-hidden="true" />
              <h3 className="font-semibold">Tell me what you think — right here</h3>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              You can WhatsApp me, but if you type it here it comes straight through to me, tagged and saved —
              I coded this box to do exactly that. Be honest. The rough edges are why I'm asking you first.
            </p>

            {sent ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-card p-4">
                <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">Got it — it's with me now.</span>{" "}
                  <span className="text-muted-foreground">Send as many thoughts as you like; every one lands.</span>
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2" role="group" aria-label="How did it land?">
                  {feelings.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFeeling(feeling === f ? null : f)}
                      aria-pressed={feeling === f}
                      className={cn(
                        "inline-flex min-h-[38px] items-center rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        feeling === f
                          ? "border-secondary/40 bg-secondary text-secondary-foreground"
                          : "bg-card text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Bro, honestly? …"
                  aria-label="Your feedback for the builder"
                />
                <Button type="submit" disabled={!message.trim() || sending} className="w-full sm:w-auto">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {sending ? "Sending…" : "Send it straight to me"}
                </Button>
              </form>
            )}
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            — your bro. (Everything in this demo is fictional except this box: what you write here is real and comes to me.)
          </p>
        </CardContent>
      </Card>
    </motion.section>
  );
}
