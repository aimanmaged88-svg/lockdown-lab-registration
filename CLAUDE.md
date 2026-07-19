# Lockdown Lab Live — project notes

Invite-only basketball coaching PWA for Sydney coach Aiman ("UNC"). App lives at
lockdown-lab-registration.netlify.app (app.html = the app, index.html = cryptic
landing). Backend: Supabase project `ymuwuhvqqftgpxwhzoub`, edge function
`app-api` (frontend must send the public anon key as Bearer + apikey).
Master frontend source: scratchpad `app2-base.html` — app.html is built from it
by injecting fonts.css into `/*FONTS*/` and the IG pic into `IGPIC`.
Deploys: BOTH direct-to-Netlify (site 7f6a47a4-d4fd-4f14-b757-f1c9a4a99330) AND
git-driven from GitHub `main` — a merge to main AUTO-DEPLOYS and will clobber
the live site with main's state (this happened 2026-07-19 via PR #9; fixed by
merging main into the working branch, keeping current Lab files, then
redeploying). Before deploying, make sure your branch contains main's extras
(pokemon-trade/, athlete-os/, academy.html, access.html) so they stay live.
Keeping main in sync with the live state is the only durable protection.
Instagram: @lockdownlablive. NEVER automate or bypass Instagram login/posting.

## Parked ideas (Aiman asked to save these)

- **"A.I. MAN" Instagram post** — saved 2026-07-18, for a few weeks out.
  Wordplay on his name: AIMAN = A·I·MAN, "the AI man". Perfect drop for when
  the Ask The Coaches AI answers go live ("the Lab's AI was named after me the
  whole time" energy). He spelled it out explicitly: A-I-M-A-N.
- Foundation-member vs new-joiner tiers — he picks who's founding (founding ⭐
  toggle already shipped; tier perks/design still open).
- True closed-app push notifications (needs VAPID web-push server).
- Optional: email alerts to coach on new knocks (needs an email service).
- Zoom API auto-create for sessions (coach currently pastes links into the
  Sessions board — ll_sessions; board shipped 2026-07-19).
- Test-data sweep of ZZ* + Demo Kid bot accounts — only with his explicit go-ahead.
- **White-label fitness template** — saved 2026-07-18. Aiman wants the app to
  double as a sellable template for fitness coaches/gyms ("people say let's
  invest money into it"). The bones already support it: single-file app,
  10-theme + custom-colour system, generic check-in/mind/fuel/squad/coach
  structure. To productise: swap logo + copy strings + coach personas per
  vertical, new Supabase project per client. Pitch angle: invite-only
  community app for any coach, not just hoops.
