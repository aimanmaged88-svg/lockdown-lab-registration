"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ParticipantCard } from "@/components/participants/participant-card";
import { participants } from "@/data/participants";
import { staggerContainer } from "@/lib/motion";

export default function ParticipantsPage() {
  const [query, setQuery] = React.useState("");

  const filtered = participants.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.interests.some((i) => i.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Participants"
        title="The people at the centre of everything"
        description="Every profile is a living story — strengths first, always."
      >
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or interest…"
            className="pl-10"
            aria-label="Search participants"
          />
        </div>
      </PageHeader>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={`No one matches “${query}”`}
          description="Try a first name, or something they love — ‘trains’, ‘writing’, ‘cooking’."
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((p) => (
            <ParticipantCard key={p.id} participant={p} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
