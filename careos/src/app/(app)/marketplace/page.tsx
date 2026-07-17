"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin, Search, Sparkles, Star, Target } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { marketplaceListings, marketplaceTabs, type ListingKind, type Listing } from "@/data/marketplace";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

function MatchRing({ score }: { score: number }) {
  const tone = score >= 95 ? "text-success" : score >= 88 ? "text-primary" : "text-secondary";
  return (
    <div className="flex flex-col items-center">
      <div className={cn("relative flex h-12 w-12 items-center justify-center", tone)} aria-hidden="true">
        <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 18}
            strokeDashoffset={2 * Math.PI * 18 * (1 - score / 100)}
          />
        </svg>
        <span className="absolute text-xs font-bold">{score}</span>
      </div>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">match</span>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full transition-shadow hover:shadow-lifted">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start gap-3">
            <PersonAvatar initials={listing.initials} gradient={listing.gradient} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1.5">
                <p className="font-semibold leading-snug">{listing.name}</p>
                {listing.verified && <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-label="Verified" />}
              </div>
              <p className="text-xs text-muted-foreground">{listing.category}</p>
            </div>
            <MatchRing score={listing.matchScore} />
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{listing.headline}</p>

          {/* Why it matches — the Care DNA edge */}
          <div className="rounded-xl bg-primary-soft/50 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              Why this fits
            </p>
            <ul className="space-y-1">
              {listing.matchReasons.map((r) => (
                <li key={r} className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {listing.specialties.slice(0, 4).map((s) => (
              <Badge key={s} variant="muted" className="font-normal">{s}</Badge>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
              <span className="font-semibold text-foreground">{listing.rating}</span> ({listing.reviews})
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {listing.distanceKm} km
            </span>
            <span className="truncate">{listing.availability}</span>
          </div>

          <Button
            variant="soft"
            size="sm"
            className="w-full"
            onClick={() => toast.success(`Request sent to ${listing.name}`, { description: "They receive the fit summary (not private records) and respond in the platform. You approve what's shared." })}
          >
            Connect
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const [tab, setTab] = React.useState<ListingKind>("provider");
  const [query, setQuery] = React.useState("");

  const activeTab = marketplaceTabs.find((t) => t.key === tab)!;
  const results = marketplaceListings
    .filter((l) => l.kind === tab)
    .filter((l) => {
      const q = query.toLowerCase();
      return !q || l.name.toLowerCase().includes(q) || l.headline.toLowerCase().includes(q) || l.specialties.some((s) => s.toLowerCase().includes(q));
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Marketplace · Matched to Zayd & Idris"
        title="Find the right support — not just the nearest"
        description="Providers, workers, accommodation and activities, ranked by how well they fit the person's real needs. Because CareOS knows the Care DNA, it matches on outcomes — never just a keyword and a postcode."
      >
        <Badge variant="secondary" className="px-3 py-1.5 text-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Care DNA matching
        </Badge>
      </PageHeader>

      {/* Search + tabs */}
      <motion.div variants={fadeUp} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search therapy, support workers, SIL, activities…"
            className="h-12 pl-11"
            aria-label="Search the marketplace"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Marketplace categories">
          {marketplaceTabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{activeTab.blurb}</p>
      </motion.div>

      {/* Results */}
      <motion.div
        key={tab}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        {results.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Other marketplaces match on category and postcode. CareOS ranks every listing against the participant's Care DNA —
          communication method, sensory needs, safety plans, goals and preferences — so the top result is the <span className="font-medium text-foreground">best fit</span>, not
          just the closest. Connecting shares a fit summary only; private records never leave without your consent.
        </p>
      </motion.div>
    </motion.div>
  );
}
