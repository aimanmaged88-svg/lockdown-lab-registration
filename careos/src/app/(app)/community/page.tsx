"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Accessibility, Clock3, CloudSun, Ear, Heart, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { communityPlaces } from "@/data/community";
import { participants } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const categories = ["All", ...Array.from(new Set(communityPlaces.map((p) => p.category)))];

/**
 * Community Planner — plan outings that actually work for the person:
 * access, sensory load, travel time and their own favourite places.
 * The map panel is an abstraction; production swaps in Mapbox/Google.
 */
export default function CommunityPlannerPage() {
  const [category, setCategory] = React.useState("All");
  const [participantFilter, setParticipantFilter] = React.useState<string | null>(null);

  const filtered = communityPlaces.filter((place) => {
    const matchesCategory = category === "All" || place.category === category;
    const matchesParticipant = !participantFilter || place.favouriteOf.includes(participantFilter);
    return matchesCategory && matchesParticipant;
  });

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        eyebrow="Community Planner"
        title="Plan outings that feel safe and joyful"
        description="Accessibility, sensory notes and travel times for every place your participants love — no guesswork at the door."
      >
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-sm shadow-soft">
          <CloudSun className="h-4 w-4 text-warning" aria-hidden="true" />
          <span className="font-medium">14° clearing</span>
          <span className="text-muted-foreground">· great afternoon for the trail</span>
        </div>
      </PageHeader>

      {/* Filters */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <Button key={c} variant={category === c ? "default" : "outline"} size="sm" onClick={() => setCategory(c)} aria-pressed={category === c}>
              {c}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by participant favourites">
          <span className="text-xs font-medium text-muted-foreground">Favourites of:</span>
          {participants.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setParticipantFilter(participantFilter === p.id ? null : p.id)}
              aria-pressed={participantFilter === p.id}
              className={cn(
                "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                participantFilter === p.id ? "border-primary/40 bg-primary-soft text-primary" : "bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              <PersonAvatar initials={p.initials} gradient={p.gradient} size="sm" className="h-6 w-6 text-[10px]" />
              {p.preferredName}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Map abstraction */}
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="sticky top-20 overflow-hidden">
            <div
              className="relative flex h-72 items-center justify-center bg-gradient-to-br from-secondary-soft via-primary-soft/60 to-secondary-soft xl:h-[420px]"
              role="img"
              aria-label="Stylised map of nearby accessible places"
            >
              {/* Stylised map — production swaps this panel for the Mapbox/Google adapter */}
              <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
                <path d="M0 120 Q120 100 200 140 T400 120" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" />
                <path d="M60 0 Q80 150 40 400" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" strokeOpacity="0.25" />
                <path d="M0 260 L400 230" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeOpacity="0.3" />
                <path d="M180 0 L210 400" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeOpacity="0.3" />
              </svg>
              {filtered.slice(0, 6).map((place, i) => (
                <motion.div
                  key={place.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute"
                  style={{
                    left: `${18 + ((i * 37) % 64)}%`,
                    top: `${16 + ((i * 53) % 62)}%`,
                  }}
                  aria-hidden="true"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-lifted ring-2 ring-primary/30">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                </motion.div>
              ))}
              <div className="absolute bottom-3 left-3 rounded-lg bg-card/90 px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-soft backdrop-blur">
                Interactive map loads here · Mapbox / Google adapter
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> places
                {participantFilter && ` loved by ${participants.find((p) => p.id === participantFilter)?.preferredName}`}
                {category !== "All" && ` in ${category}`}. Every listing is verified by the team who actually visited.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Place cards */}
        <div className="space-y-4 xl:col-span-3">
          {filtered.map((place, i) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="transition-shadow hover:shadow-lifted">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{place.name}</h3>
                        {place.sensoryFriendly && (
                          <Badge variant="secondary">
                            <Ear className="h-3 w-3" aria-hidden="true" />
                            Sensory friendly
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{place.category}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                        {place.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {place.travelMinutes} min
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {place.accessibility.map((a) => (
                      <Badge key={a} variant="muted" className="font-normal">
                        <Accessibility className="h-3 w-3" aria-hidden="true" />
                        {a}
                      </Badge>
                    ))}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{place.notes}</p>

                  <div className="mt-4 flex flex-col items-start gap-3 border-t pt-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                      <div className="flex -space-x-1.5">
                        {place.favouriteOf.map((pid) => {
                          const p = participants.find((x) => x.id === pid)!;
                          return (
                            <PersonAvatar key={pid} initials={p.initials} gradient={p.gradient} size="sm" className="h-6 w-6 text-[10px] ring-2 ring-card" />
                          );
                        })}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {place.favouriteOf.map((pid) => participants.find((x) => x.id === pid)?.preferredName).join(" & ")}'s favourite
                      </span>
                    </div>
                    <Button
                      variant="soft"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        toast.success(`${place.name} added to the outing plan`, {
                          description: "Route, sensory kit reminders and risk notes attach automatically in the full platform.",
                        })
                      }
                    >
                      Plan an outing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
