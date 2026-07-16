"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { useRole } from "@/providers/role-provider";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  from: "user" | "assistant";
  text: string;
  reasoning?: string;
}

const suggestions = [
  "Summarise Milo's week for his mum",
  "Draft a handover for Ava's afternoon shift",
  "What patterns are emerging for Jordan?",
  "Which goals need attention this fortnight?",
];

/**
 * Canned demo responses. In production these route through the AI service
 * layer (src/services/ai) with the same contract: grounded in this
 * participant's records, reasoning attached, human review before anything
 * becomes a record.
 */
const cannedResponses: { match: RegExp; text: string; reasoning: string }[] = [
  {
    match: /milo.*(week|mum|summar)/i,
    text: "Here's a family-friendly draft for Sarah:\n\n“Milo has had a wonderful week. He ordered his lunch at the café by himself three times using his talker, and he's now completed four independent mornings in a row — his best run yet. Swimming on Thursday was the highlight (40 minutes, huge smiles), and his animation project has 24 seconds of footage. One gentle note: Tuesday's bus ride home was a bit much, so we're trialling a quieter bus. He's proud of himself — and he should be.”\n\nWant me to shorten it, or add the photo from swimming (it's consented for family sharing)?",
    reasoning: "Drafted from 6 shift notes (8–14 Jul), goal records for the café and morning-routine goals, and the family-sharing consent settings. Excludes team-only clinical details per the sharing plan.",
  },
  {
    match: /ava.*(handover|afternoon|shift)/i,
    text: "Draft handover for Ava's 4pm team:\n\n“Morning went to plan — pain 2/10 at wake-up, writing block completed (conference talk closing section drafted). Repositioned 10am & 12pm; seating photographed for the AT review. STILL TO DO: 2pm rehearsal is the anchor — Sparky is charging and needs to be at 100%. Afternoon Baclofen due 2pm with MAR sign-off. She's in a good mood but protective of her talk content — ask before reading the screen. Mealtime plan as always: IDDSI 5, fluids level 2, her pace.”\n\nReview and edit before it sends — you know her better than I do.",
    reasoning: "Built from today's checklist state (5 of 9 complete), the medication schedule, this morning's shift notes and Ava's communication profile.",
  },
  {
    match: /jordan.*(pattern|trend|emerg)/i,
    text: "Three patterns worth your attention for Jordan:\n\n1. Morning exercise strongly predicts good days — the fatigue wall arrives ~90 minutes later on bike days (94 days of data).\n\n2. Supermarket trips under 20 minutes succeed every time; all four difficult trips exceeded 30 minutes. The online-ordering trial is removing that pressure entirely.\n\n3. Peer group Thursdays lift mood for about three days after — attendance is worth protecting during any schedule changes.\n\nNone of this is clinical advice — it's pattern-spotting for the team and Dr. Okonkwo to weigh up at the review on the 23rd.",
    reasoning: "Correlated 6 months of shift logs, fatigue check-ins, mood scores and outing records. Confidence levels and sample sizes are attached to each insight on Jordan's profile.",
  },
  {
    match: /goal.*(attention|fortnight|behind)/i,
    text: "Two goals could use attention this fortnight:\n\n• Milo — “Try one new food each fortnight” (55%). Paused after a tough mashed-potato experience; the restart plan with dry crackers (his choice) begins this week. Low pressure is the strategy.\n\n• Jordan — “Manage weekly budget and shopping solo” (45%). In-store trips remain the friction point; the online-ordering trial shows much lower decision fatigue. Consider formalising the 20-minute in-store cap at the next planning chat.\n\nEverything else is on track or ahead — Milo's morning routine (85%) may be achieved a month early.",
    reasoning: "Ranked all 11 active goals by progress velocity vs target date, weighted by notes flagged 'needs-attention' by workers in the last 14 days.",
  },
];

const fallbackResponse: Omit<Message, "id" | "from"> = {
  text: "I can help with drafting notes and summaries, spotting trends across shifts, preparing handovers, or finding anything in a participant's story. Try one of the suggestions below — or ask me about Milo, Ava or Jordan. Whatever I draft, you review before it becomes a record.",
  reasoning: "The assistant only answers from records your role can access. Every response can show its sources.",
};

export default function AssistantPage() {
  const { definition } = useRole();
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 0,
      from: "assistant",
      text: `Good morning ${definition.demoUser.name.split(" ")[0]} — I've read today's briefings. Three shifts, two medication windows, one big rehearsal at 2pm. What can I take off your plate?`,
    },
  ]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const nextId = React.useRef(1);
  const listRef = React.useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setMessages((prev) => [...prev, { id: nextId.current++, from: "user", text: trimmed }]);
    setInput("");
    setThinking(true);

    const response = cannedResponses.find((r) => r.match.test(trimmed)) ?? fallbackResponse;
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, from: "assistant", text: response.text, reasoning: response.reasoning },
      ]);
      setThinking(false);
    }, 1100);
  };

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-5">
      <PageHeader
        eyebrow="AI Assistant"
        title="Your quiet second pair of hands"
        description="Drafts, summaries and patterns — always explained, always yours to review. Never a replacement for your judgement."
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border bg-card shadow-card">
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin" role="log" aria-label="Conversation with the AI assistant" aria-live="polite">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={cn("flex gap-3", m.from === "user" && "flex-row-reverse")}
              >
                {m.from === "assistant" ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-soft">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </div>
                ) : (
                  <PersonAvatar initials={definition.demoUser.initials} gradient="from-primary to-secondary" size="sm" className="h-9 w-9" />
                )}
                <div
                  className={cn(
                    "max-w-[78%] space-y-2 rounded-3xl px-4 py-3",
                    m.from === "assistant"
                      ? "rounded-tl-lg bg-muted/70"
                      : "rounded-tr-lg bg-primary text-primary-foreground"
                  )}
                >
                  <p className="whitespace-pre-line text-sm leading-relaxed">{m.text}</p>
                  {m.reasoning && (
                    <p className="border-t border-foreground/10 pt-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold">How I got this: </span>
                      {m.reasoning}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {thinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-soft">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-lg bg-muted/70 px-4 py-3.5" aria-label="Assistant is thinking">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a participant, draft a note, find a pattern…"
              aria-label="Message the AI assistant"
              className="h-11"
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!input.trim() || thinking} aria-label="Send message">
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 shrink-0 text-success" aria-hidden="true" />
            The assistant sees only what your role can see. It drafts — people decide. Nothing becomes a record without human review.
          </p>
        </div>
      </div>
    </div>
  );
}
