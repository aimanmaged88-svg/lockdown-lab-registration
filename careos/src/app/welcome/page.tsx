"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { roles } from "@/lib/roles";
import { useRole } from "@/providers/role-provider";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { staggerContainer, fadeUp } from "@/lib/motion";

const roleGradients: Record<string, string> = {
  parent: "from-rose-400 to-orange-400",
  "support-worker": "from-sky-400 to-indigo-500",
  participant: "from-emerald-400 to-teal-500",
  "team-leader": "from-violet-400 to-purple-500",
  therapist: "from-cyan-400 to-blue-500",
  "provider-admin": "from-amber-400 to-orange-500",
  ceo: "from-indigo-400 to-violet-500",
  "system-admin": "from-slate-400 to-slate-600",
};

/**
 * The welcome experience. In production this is the sign-in screen; in the
 * demo it lets anyone step into any role and feel that person's morning.
 */
export default function WelcomePage() {
  const router = useRouter();
  const { setRole } = useRole();

  return (
    <main className="surface-gradient min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Logo />
        </motion.div>

        <div className="flex flex-1 flex-col justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
              Every person has a story.
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CareOS helps you tell it.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              The participant outcomes platform for people, families and the teams who support them.
              Choose a perspective to step inside.
            </p>
          </motion.div>

          <motion.ul
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mt-10 grid gap-3 sm:grid-cols-2"
          >
            {roles.map((r) => (
              <motion.li key={r.id} variants={fadeUp}>
                <button
                  type="button"
                  onClick={() => {
                    setRole(r.id);
                    router.push(r.homePath);
                  }}
                  className="group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  <PersonAvatar initials={r.demoUser.initials} gradient={roleGradients[r.id]} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{r.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row"
        >
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            Demonstration environment — every participant, family and staff member is fictional.
          </p>
          <p>Role-based access · Audit logged · Privacy by design</p>
        </motion.footer>
      </div>
    </main>
  );
}
