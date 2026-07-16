"use client";

import { motion } from "framer-motion";
import { Download, FileBarChart, FileText, Lock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { reports } from "@/data/reports";
import { staggerContainer, fadeUp } from "@/lib/motion";

const categories = Array.from(new Set(reports.map((r) => r.category)));

export default function ReportsPage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Reports people actually want to read"
        description="Written for humans, formatted beautifully, shared securely. Every export is watermarked, permission-checked and audit-logged."
      />

      {categories.map((category) => (
        <motion.section key={category} variants={fadeUp} aria-label={`${category} reports`}>
          <h2 className="mb-4 font-display text-lg font-semibold">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports
              .filter((r) => r.category === category)
              .map((report) => (
                <Card key={report.id} className="flex flex-col transition-shadow hover:shadow-lifted">
                  <CardContent className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-xl bg-primary-soft p-2.5 text-primary">
                        <FileBarChart className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="text-xs text-muted-foreground">{report.updated}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold leading-snug">{report.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{report.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {report.formats.map((f) => (
                        <Badge key={f} variant="muted" className="font-normal">{f}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 border-t pt-3.5">
                      <Button
                        size="sm"
                        variant="soft"
                        className="flex-1"
                        onClick={() => toast.success(`Generating “${report.title}”`, { description: "A beautifully formatted PDF lands in your exports in the full platform." })}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Generate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast("Secure sharing", { description: "Share with expiring, permission-checked links — every access is logged." })}
                        aria-label={`Share ${report.title} securely`}
                      >
                        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </motion.section>
      ))}

      <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Reports respect role-based access down to the field level: a family summary and a clinical export of the same fortnight contain different information by design.
          Generated documents carry a recipient watermark, and every generation and share event is written to the audit log.
        </p>
      </motion.div>
    </motion.div>
  );
}
