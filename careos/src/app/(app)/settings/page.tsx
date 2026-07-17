"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Fingerprint,
  Globe2,
  KeyRound,
  Palette,
  Plug,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { useRole } from "@/providers/role-provider";
import { rolePermissions, roles } from "@/lib/roles";
import { staggerContainer, fadeUp } from "@/lib/motion";

const auditTrail = [
  { time: "Today 2:04pm", actor: "Grace Whitfield", action: "Viewed Ava's mealtime plan (shift context)" },
  { time: "Today 11:32am", actor: "CareOS AI", action: "Drafted shift note for Ava — pending human review" },
  { time: "Today 9:15am", actor: "Sarah Andersson", action: "Viewed Milo's family portal summary" },
  { time: "Yesterday 6:40pm", actor: "Tess Nguyen-Park", action: "Updated Jordan's travel goal progress to 80%" },
  { time: "Yesterday 9:00am", actor: "Ray Kaur", action: "Quarterly permission review completed — 2 role changes" },
];

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const { role } = useRole();

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Your CareOS, your way"
        description="Appearance, notifications, privacy and platform administration — everything explained in plain language."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
                Appearance & accessibility
              </CardTitle>
              <CardDescription>The interface adapts to you — not the other way around.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="dark-mode">Dark mode</Label>
                  <p className="text-xs text-muted-foreground">Charcoal with soft contrast — easy on night-shift eyes.</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={resolvedTheme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
              <Separator />
              {[
                { id: "reduced-motion", label: "Respect reduced motion", detail: "Follows your system preference automatically.", defaultChecked: true },
                { id: "large-text", label: "Larger text", detail: "Scales typography across every screen.", defaultChecked: false },
                { id: "high-contrast", label: "High contrast mode", detail: "Stronger borders and text for low-vision users.", defaultChecked: false },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor={pref.id}>{pref.label}</Label>
                    <p className="text-xs text-muted-foreground">{pref.detail}</p>
                  </div>
                  <Switch id={pref.id} defaultChecked={pref.defaultChecked} onCheckedChange={() => toast("Preference saved")} />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
                Notifications
              </CardTitle>
              <CardDescription>Purposeful by default. You choose what interrupts you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "n-milestones", label: "Milestones & celebrations", detail: "The good stuff, as it happens.", defaultChecked: true },
                { id: "n-family", label: "Family notes", detail: "Before your next shift with that person.", defaultChecked: true },
                { id: "n-ai", label: "AI insights", detail: "Weekly digest unless something needs review sooner.", defaultChecked: true },
                { id: "n-alerts", label: "Care alerts", detail: "Always on for your participants — this one can't be disabled.", defaultChecked: true, locked: true },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor={pref.id}>{pref.label}</Label>
                    <p className="text-xs text-muted-foreground">{pref.detail}</p>
                  </div>
                  <Switch
                    id={pref.id}
                    defaultChecked={pref.defaultChecked}
                    disabled={pref.locked}
                    onCheckedChange={() => toast("Preference saved")}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI preferences */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                AI preferences
              </CardTitle>
              <CardDescription>People are the hero. The AI works within boundaries you set.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "ai-draft", label: "Draft notes and summaries", detail: "Always reviewed by a person before saving.", defaultChecked: true },
                { id: "ai-trends", label: "Pattern & trend detection", detail: "Insights always show their reasoning and sample size.", defaultChecked: true },
                { id: "ai-suggest", label: "Proactive suggestions", detail: "Gentle nudges like “worth mentioning at the review”.", defaultChecked: false },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor={pref.id}>{pref.label}</Label>
                    <p className="text-xs text-muted-foreground">{pref.detail}</p>
                  </div>
                  <Switch id={pref.id} defaultChecked={pref.defaultChecked} onCheckedChange={() => toast("Preference saved")} />
                </div>
              ))}
              <div className="rounded-xl bg-muted/50 p-3.5 text-xs leading-relaxed text-muted-foreground">
                Non-negotiables, built into the platform: the AI never diagnoses, never makes care decisions, and never writes to a record without human review.
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                Privacy & security
              </CardTitle>
              <CardDescription>Trust is the product. Security is how we keep it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: KeyRound, label: "Role-based access", detail: `You're signed in as ${roles.find((r) => r.id === role)?.label}. ${rolePermissions[role].length} areas visible to this role.` },
                { icon: Fingerprint, label: "Session security", detail: "Multi-factor authentication and automatic session timeouts." },
                { icon: Globe2, label: "Data residency", detail: "All data stored in-region with encryption at rest and in transit." },
                { icon: Plug, label: "Integrations", detail: "Connected services are permission-scoped and individually revocable." },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-xl border bg-background/60 p-3.5">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Audit log */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="h-4 w-4 text-primary" aria-hidden="true" />
                Audit log
              </CardTitle>
              <CardDescription>Every view, edit and AI action — recorded, attributable, immutable.</CardDescription>
            </div>
            <Badge variant="success">Live</Badge>
          </CardHeader>
          <CardContent>
            <ol className="divide-y">
              {auditTrail.map((entry) => (
                <li key={`${entry.time}-${entry.action}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 text-sm first:pt-0 last:pb-0">
                  <time className="w-36 shrink-0 text-xs text-muted-foreground">{entry.time}</time>
                  <span className="font-medium">{entry.actor}</span>
                  <span className="text-muted-foreground">{entry.action}</span>
                </li>
              ))}
            </ol>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => toast("Full audit explorer", { description: "Search, filter and export the complete log in the production platform." })}
            >
              Open full audit explorer
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team & permissions */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              Roles & permissions
            </CardTitle>
            <CardDescription>Eight roles, one principle: everyone sees exactly what helps them care — nothing more.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Table on wide screens; stacked cards on phones so nothing clips. */}
            <div className="hidden overflow-x-auto scrollbar-thin md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="pb-2.5 pr-4 font-medium">Role</th>
                    <th scope="col" className="pb-2.5 pr-4 font-medium">Demo user</th>
                    <th scope="col" className="pb-2.5 font-medium">Visible areas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {roles.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-4 font-medium align-top">{r.label}</td>
                      <td className="py-3 pr-4 align-top text-muted-foreground">{r.demoUser.name}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {rolePermissions[r.id].map((area) => (
                            <Badge key={area} variant="muted" className="font-normal capitalize">{area}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-3 md:hidden">
              {roles.map((r) => (
                <li key={r.id} className="rounded-2xl border bg-background/60 p-4">
                  <p className="font-medium">{r.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.demoUser.name}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {rolePermissions[r.id].map((area) => (
                      <Badge key={area} variant="muted" className="font-normal capitalize">{area}</Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
