# CareOS — The Participant Outcomes Platform

> Every person has a story. CareOS helps you tell it.

CareOS is an AI-powered participant outcomes platform that helps participants, families, support workers, therapists and providers work together to improve a person's quality of life. It is **not** another NDIS management system — it measures lives improved, not hours logged.

This repository contains the **Phase One clickable prototype**: a complete, production-quality, fully navigable application running entirely on realistic fictional demo data. Every screen exists, every menu works, every interaction is intentional.

---

## Quick start

```bash
cd careos
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # strict TypeScript
```

Open the app and choose any role on the welcome screen — the demo lets you walk every experience (parent, support worker, participant, team leader, therapist, provider admin, CEO, system admin). Use the role switcher in the top bar to move between perspectives live, and **⌘K** to jump anywhere.

> **All demo data is fictional.** Milo, Ava, Jordan, their families, staff and “Sunrise Support Collective” exist only to demonstrate the platform. Avatars are initials on gradients — no photographs of real people are used.

## Product principles (the constitution)

1. **The participant always comes first.** Profiles celebrate strengths before anything else; nobody is reduced to a diagnosis.
2. **Every feature must solve a real problem** — reduce stress, save time, or improve care. Otherwise it doesn't ship.
3. **AI is never the hero.** It drafts, summarises and spots patterns; it always explains its reasoning; humans review everything before it becomes a record. It never diagnoses.
4. **Calm is a feature.** Soft colour, purposeful animation (250–350 ms), whitespace, no noise. Notifications exist to help someone.
5. **Trust is the product.** Role-based access, explicit family sharing, audit logging on every view and edit.

## Signature experiences

| Experience | Route | What it proves |
|---|---|---|
| Care Timeline | `/timeline` | 8 years of milestones per person, rendered as a story — the hero feature |
| Care DNA™ | `/participants/[id]` | A living profile: communication, sensory, strategies, favourites — knowledge belongs to the person |
| Smart Shift | `/shift` | Briefing, adaptive checklist, AI-drafted notes with human review |
| Family Portal | `/family` | A parent knows how the day went in ten seconds |
| AI Assistant | `/assistant` | Explainable drafts and pattern-spotting, review-first by design |
| Executive view | `/executive` | “Are we genuinely improving lives?” answered on one screen |
| Learning Hub | `/learning` | Ten practice topics with scenarios, cards and guidance |
| Community Planner | `/community` | Outings planned around access, sensory load and favourites |

## Architecture

```
careos/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── welcome/          # Role-select entry (sign-in surface in production)
│   │   └── (app)/            # Authenticated shell: sidebar + topbar + pages
│   ├── components/
│   │   ├── ui/               # Design-system primitives (shadcn-style, token-driven)
│   │   ├── shared/           # StatCard, EmptyState, PageHeader, avatars, AI badge…
│   │   ├── layout/           # Sidebar, Topbar, MobileNav, CommandPalette, RoleSwitcher
│   │   ├── charts/           # Recharts wrappers speaking the design language
│   │   ├── participants/     # ParticipantCard, GoalCard, Care DNA profile, AI insights
│   │   ├── timeline/         # The Care Timeline
│   │   └── learning/         # Learning Hub views
│   ├── data/                 # Fictional demo fixtures (3 participants × 8 years)
│   ├── types/                # Domain model — participant-centred by design
│   ├── lib/                  # utils, roles + permission matrix, motion presets
│   ├── config/               # Navigation config (single source for all nav surfaces)
│   ├── providers/            # Theme, React Query, demo Role context
│   ├── hooks/                # React Query server-state hooks
│   └── services/             # Supabase factory + AI provider abstraction
└── public/                   # PWA manifest + icon
```

**Key decisions**

- **Design tokens as CSS variables** (`globals.css`) — light/dark themes from one source; no hex values in components.
- **Role model in one place** (`lib/roles.ts`) — navigation, command palette and settings all derive from the same permission matrix that Supabase RLS will enforce server-side.
- **Data behind hooks** (`hooks/use-participants.ts`) — components consume React Query; swapping fixtures for Supabase touches zero components.
- **AI behind an interface** (`services/ai`) — vendors are adapters; grounding, explainability and human-review are enforced at the layer, not left to prompts.
- **Accessibility as default** — visible focus rings, reduced-motion support, ARIA on interactive patterns, colour never the only signal, WCAG-conscious contrast in both themes.

## Implementation roadmap → production

**Phase 2 — Foundations (6–8 weeks).**
Supabase auth with the eight roles; PostgreSQL schema mirroring `src/types` with Row Level Security implementing the permission matrix; audit-log table written from a database trigger on every read/write of participant data; replace fixtures behind the existing React Query hooks; real medication sign-off (double-signature) and incident flows.

**Phase 3 — The living record (6–8 weeks).**
Timeline events written from real shift activity; document storage with per-item family-sharing flags; consent-aware photo handling; realtime channels for shifts, notifications and family updates; offline-first shift documentation (local persistence + background sync — the queue design already sits behind React Query).

**Phase 4 — AI in production (4–6 weeks).**
Server-side AI endpoints (Supabase Edge Functions) behind the `AiProvider` interface; grounded drafting from role-scoped records only; insight jobs that attach evidence and sample sizes; human-review workflow with approval trail; evaluation harness before any model change ships.

**Phase 5 — Scale & compliance (ongoing).**
Provider onboarding/branding; reporting exports with watermarking; NDIS practice-standard alignment and safeguarding workflows; penetration testing; SOC 2 path; multi-region data residency; native mobile wrapper (the PWA shell ships in Phase 1).

**Testing strategy.** Unit tests on lib/services; integration tests on hooks against a Supabase test instance; Playwright end-to-end journeys per role; axe-core accessibility runs and Lighthouse performance budgets in CI.

---

Built as if Apple, Linear, Stripe and Notion collaborated on a healthcare platform — because the people this serves deserve nothing less.
