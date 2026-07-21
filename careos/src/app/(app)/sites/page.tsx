"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, Home, MapPin, Send, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { careHomes, sitesStats, sitesDifference } from "@/data/sites";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const checkTone = {
  ok: { color: "text-success", label: "OK", variant: "success" as const },
  due: { color: "text-warning", label: "Due", variant: "warning" as const },
  overdue: { color: "text-destructive", label: "Overdue", variant: "destructive" as const },
};

export default function SitesPage() {
  const [active, setActive] = React.useState(careHomes[1].id);
  const home = careHomes.find((h) => h.id === active)!;

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Homes & Sites"
        title="Every SIL and SDA home — compliant, and connected to the people in it."
        description="Compliance-only tools track a property's paperwork in a silo. CareOS ties each home to its residents, the workers rostered there, and the incidents and checks that happen inside it. Property compliance becomes a by-product of everyday care, per-home audit readiness is always live, and an auditor gets a one-time, read-only pack in a click."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Homes managed" value={String(sitesStats.homes)} icon={Home} detail="SIL, SDA & respite" />
        <StatCard label="Residents supported" value={String(sitesStats.residents)} icon={Users} detail="linked to Care DNA" />
        <StatCard label="Avg audit-readiness" value={`${sitesStats.avgReadiness}%`} icon={ShieldCheck} detail="live, per property" />
        <StatCard label="Homes needing action" value={String(sitesStats.inspectionsDue)} icon={CheckCircle2} detail="flagged in advance" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Homes list */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Your homes</CardTitle>
              <CardDescription>Select a home to see its property compliance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {careHomes.map((h) => {
                const isActive = h.id === active;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setActive(h.id)}
                    className={cn(
                      "w-full rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "border-primary/30 bg-primary-soft/40" : "bg-background/60 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                          <Building2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{h.name}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {h.address}
                          </p>
                        </div>
                      </div>
                      <Badge variant="muted" className="shrink-0">{h.type}</Badge>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", h.auditReadiness >= 95 ? "bg-success" : h.auditReadiness >= 90 ? "bg-primary" : "bg-warning")}
                          style={{ width: `${h.auditReadiness}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums">{h.auditReadiness}%</span>
                      {h.openIssues > 0 ? (
                        <Badge variant="warning" className="font-normal">{h.openIssues} to action</Badge>
                      ) : (
                        <Badge variant="success" className="font-normal">Clear</Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected home detail */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{home.name} · property compliance</CardTitle>
                <CardDescription>{home.address} · {home.type} · next inspection {home.nextInspection}</CardDescription>
              </div>
              <Button
                variant="secondary"
                onClick={() => toast.success("Audit pack shared", { description: `${home.name}: one-time read-only auditor link created. Scoped to certification evidence; every access is logged.` })}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Share auditor pack
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* residents */}
              <div className="flex items-center gap-2 rounded-2xl border bg-background/60 p-3">
                <span className="text-xs font-medium text-muted-foreground">Residents</span>
                <div className="flex -space-x-2">
                  {home.residentInitials.map((ini, i) => (
                    <PersonAvatar key={i} initials={ini} gradient="from-primary to-secondary" size="sm" className="h-7 w-7 border-2 border-card text-[10px]" />
                  ))}
                </div>
                <span className="ml-auto text-xs text-muted-foreground">
                  {home.residentInitials.length} people · care plans &amp; incidents linked to this home
                </span>
              </div>
              {/* checklist */}
              <div className="space-y-2">
                {home.checks.map((c) => {
                  const tone = checkTone[c.status];
                  return (
                    <div key={c.label} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                      <ShieldCheck className={cn("h-4 w-4 shrink-0", tone.color)} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{c.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.detail}</p>
                      </div>
                      <Badge variant={tone.variant} className="shrink-0 font-normal">{tone.label}</Badge>
                    </div>
                  );
                })}
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
              The Homes & Sites difference
            </CardTitle>
            <CardDescription>Others track a property's documents. CareOS runs the home as part of the same source of truth as the care inside it.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {sitesDifference.map((d) => (
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
