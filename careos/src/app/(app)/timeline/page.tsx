"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { CareTimeline } from "@/components/timeline/care-timeline";
import { participants } from "@/data/participants";
import { getTimeline } from "@/data/timeline";
import { demoFamily } from "@/data/family";
import { useRole } from "@/providers/role-provider";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** The Care Timeline — CareOS's hero feature, one story per person. */
export default function TimelinePage() {
  const { role } = useRole();
  // Families see their own children's stories — nobody else's.
  const visibleParticipants =
    role === "parent"
      ? participants.filter((p) => (demoFamily.childrenIds as readonly string[]).includes(p.id))
      : participants;
  const [selectedId, setSelectedId] = React.useState(visibleParticipants[0].id);
  const participant = visibleParticipants.find((p) => p.id === selectedId) ?? visibleParticipants[0];
  const events = getTimeline(selectedId);
  const highlights = events.filter((e) => e.highlight).length;

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        eyebrow="Care Timeline"
        title="A story, not a case file"
        description="Years of milestones, achievements and everyday wins — the moments that make a life, kept safe in one place."
      />

      <motion.div variants={fadeUp} className="flex flex-wrap gap-3" role="group" aria-label="Choose whose story to open">
        {visibleParticipants.map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 pr-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary/40 bg-primary-soft shadow-glow" : "bg-card shadow-soft hover:shadow-card"
              )}
            >
              <PersonAvatar initials={p.initials} gradient={p.gradient} size="sm" />
              <div>
                <p className="text-sm font-semibold">{p.preferredName}</p>
                <p className="text-xs text-muted-foreground">{p.yearsSupported} years of story</p>
              </div>
            </button>
          );
        })}
      </motion.div>

      <motion.div
        key={selectedId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-6 overflow-hidden rounded-3xl border bg-card shadow-card">
          <div className={cn("h-1.5 bg-gradient-to-r", participant.gradient)} aria-hidden="true" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <PersonAvatar initials={participant.initials} gradient={participant.gradient} size="lg" />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold">{participant.preferredName}'s journey</h2>
                <p className="text-sm text-muted-foreground">{participant.tagline}</p>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="font-display text-2xl font-semibold">{events.length}</p>
                <p className="text-xs text-muted-foreground">moments</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">{highlights}</p>
                <p className="text-xs text-muted-foreground">highlights</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">{participant.yearsSupported}</p>
                <p className="text-xs text-muted-foreground">years</p>
              </div>
            </div>
          </div>
        </div>

        <CareTimeline events={events} />
      </motion.div>
    </motion.div>
  );
}
