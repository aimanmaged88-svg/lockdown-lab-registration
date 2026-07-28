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

## Badge economy + Money desk (2026-07-19)

- **Money desk** — SHIPPED in admin.html (sidebar 💰 Money). Live calc:
  price/seat × seats × sessions/week → per-session/week/month/block, plus
  fill-the-seats scenarios (5/10/20 + whole squad from R.players). AUD.
  Master: scratchpad/admin-base.html.
- **Scout section** — SHIPPED as a PRIVATE coming-soon skeleton (sidebar 🔭
  Scout, disabled mock: name/years/areas/who-they-scout-for/players-they-rate/
  intention). Coach-only, never public. Vets scouts vs trolls later.
- **Badge Vault (55 badges) — SHIPPED into app.html (2026-07-20).** Full-screen
  `#vault` overlay opened from the Home Starter card button `#openVault`
  (label live-updates "N/55 · LB"). VCATS[12 categories]→VFLAT[55]; each badge
  `[id,name,ico,tier,how,earnFn]` (earnFn null = coach/manual). Client-computed
  from PST (xp/streak/sessions/founding/messages/invites) + localStorage action
  counters `ll_bstat_<pid>` (mind/diary/fuel/post/ask/run) bumped at the single
  `api()` choke point (`bumpStat`), plus flags (install/notif/theme/profile).
  Earned map persisted `ll_vault_<pid>` (never re-locks); `evalVault()` runs in
  renderPlayer + after each action, 2 passes so Hall of Fame settles, fires the
  `#badgeUp` overlay (now shows tier chip) for new earns — SILENT for the 4
  Starter-Five dupes. **Gate enforced:** founding ⭐ earn all 55; non-founding
  earn only the 10-badge bronze TASTER shelf, the other 45 render ⭐"Founding
  only" (look-don't-touch). 5 coach/manual badges (On Camera, OG, Player of
  Week, Most Improved, The Lockdown) show "Coach awards this" (Phase 2). Lab
  Bucks tally shown (earned/505); wallet+redeem still Phase 2. Verified E2E
  (founding→12 earned/65 LB; non-founding→4 earned/8 LB, 39 founding-locked).
  Design artifact: https://claude.ai/code/artifact/84185e58-5b8a-44b5-a493-c4f883b7dc70
- **Coach-award badges — SHIPPED (edge v24, 2026-07-21).** ll_players gained
  `awards jsonb`. Edge: admin `badge_award`/`badge_unaward` {pid,badge}
  (coach code) append/remove + pushPlayer; playerState + cdetail + roster
  return `awards`. app.html: evalVault earns+celebrates any id in PST.awards
  (overlay "Coach awarded you this"), so the 5 manual badges (potw/
  most-improved/the-lockdown/on-camera/og) light in the vault. admin.html:
  the per-squad-row button opens a panel of AWARDABLE[5] chips toggling
  award/unaward (buzzes their phone). VAPID re-verified byte-for-byte.
  Verified E2E (award to Unlocked, unaward removes).
- **Program 01 LOCKED (2026-07-21):** name **Winter Arc**, first session
  **Mon 17 Aug 2026**, **20 founding seats** (25-use launch code). Filled into
  every teaser caption (teasers-base.html) + the Week 3 reveal tile rebuilt
  (assets/teaser-05-w3-mon-reveal.png, template removed, zip refreshed).
  Trivial to change — swap the 3 values.
  Master: scratchpad/badges-base.html (fonts injected → badges.html).
  6 tiers (Bronze/Silver/Gold/Elite/Founding/Legend) across 12 categories,
  all client-computable from existing metrics EXCEPT 3 coach-picks
  (Player of Week / Most Improved / The Lockdown) which need a small backend.
- **Lab Bucks (money layer)** — badges pay players back: Bronze 2, Silver 5,
  Gold 10, Elite 20, Founding 15, Legend 25 LB (vault total = 505 LB).
  1 LB = $1 off a session, with a coach-set per-session cap (default $5).
  Phase 1 = badges + trophy wall live; Phase 2 = wallet per player + redeem
  step at booking + rate/cap control on the Money desk. Not built yet.
- **Badge gate (Aiman's tier rule, 2026-07-19)** — when the vault ships:
  Founding ⭐ members earn the FULL 55-badge vault (+ founding-only badges).
  Non-founding members get the Starter Five free, can SEE the whole vault
  (look-don't-touch), but can only EARN a 10-badge bronze "taster shelf".
  Wanting the other 45 = the psychological hook to chase founding status.
- **IG teaser run (4 weeks → Program 01)** — playbook artifact:
  https://claude.ai/code/artifact/c2cfc2d6-f3c6-4a70-9abc-7f08324cdc49
  16 drops, Mon 20 Jul → Sun 16 Aug 2026: W1 mystery, W2 vault look-don't-
  touch, W3 Program 01 reveal (placeholders: program name, first-session
  date, seat counts), W4 seats countdown + Friday batch-code story drop.
  He posts manually — never automate IG.
- **Wallpaper** — delivered a personal S26 Ultra 1440×3120 AMOLED-black
  motivation wallpaper (caged LIVE + "Build It. Every Day."). Master:
  scratchpad/wall-base.html → wall.html → wallpaper-s26.png.

## Session studio + Next-Up trailer (2026-07-19)

- **Edge fn now v18.** ll_sessions gained `descr text`, `chapters jsonb
  default '[]'` (array of {t,d}), `deck text`. session_add/program_add store
  them (deck must be http(s); chapters capped 14); upcomingSessions() +
  player state + roster all return them. VAPID keys unchanged (re-verified).
- **Dashboard authoring** (admin Sessions): description box (#sDescr),
  add/remove **Chapters** builder (#sChapT/#sChapD/#sChapAdd → sChapters[]),
  deck link (#sDeck). Board rows flag 🎬 count / 📑 deck / 📝 described.
- **Player app**: rotating **Next Up trailer** (#sessTrailer) above the board
  — countdown, description, chapter pills, Join + Open the deck, auto-advance
  5.2s with dots. Every session card is expandable (.sess.rich → .open) to
  reveal full agenda + deck. sw cache bumped lll-v2 → lll-v3.

## Guide tab — What's New + Feature phone (2026-07-19)

- SHIPPED in admin (sidebar 🎓 Guide, section #sec-guide). Two cards:
  **What's New** (#newsList, from NEWS[] — dated changelog, newest first,
  NEW tag on recent) and **Feature phone** (#vscreen) — a virtual-phone
  panel that tap-explains every feature. FEAT{coach[9],player[11]} data;
  vSide toggle (Your desk / Player app), tile → detail (what/how steps/
  where), back. renderNews()+paintPhone() run at load. Master admin-base.html.
- **Intro tour** tile is a placeholder for Aiman's PowerPoint intro — when he
  hands over the .pptx, wire the walkthrough into that tile (he flagged this).

## Starter Five + welcome + squad DMs (2026-07-19)

- **Starter Five badge journey** — LIVE in app.html. STARTER[5]: door 🔓
  (join, instant) → light 🌅 (first check-in) → mind 🧠 → fuel 🍎 → ice 👋
  (first squad post). Client-computed from PST, persisted per player in
  localStorage `ll_start_<pid>` (never re-locks; veterans sync quietly with
  only the door hero moment). Full-screen #badgeUp overlay (queue via
  badgeUpShow/pumpBu, confetti+haptic+S.checkin), branching path card
  #startCard on Home (nodes un/nx/lk + filling connectors + #startNext rule).
  These 5 reuse Badge Vault names; vault v1 gains "Through the Door" (56th)
  when it ships.
- **Welcome moment** — #welcome overlay on first player entry (flag
  `ll_wel_<pid>`): long-term AI companion framing, "be honest with it —
  especially on the rough days", rookie reassurance. Badges wait for it
  (pumpBu gated on welcome). Existing players see it once too.
- **Squad DMs** — Door Desk Squad rows got 💬 (data-dm): inline .editbox
  thread (loadDm via cdetail, sendDm via cmsg — pushes the player's phone),
  Enter to send, survives refresh poll via .editbox.open guard.
- sw cache lll-v4. NEWS ids 8-9 announce both (Aiman gets the ping).

## Street Vol. 2 flavour pack (2026-07-19)

- LIVE in app.html, player side only (desk untouched). Keyframes slapIn /
  impactRing / stShake / gbFlash / fireFlick / styleUp / toastSlap.
  Level-up = Gamebreaker (luk letterized in levelUpShow, skip when RM);
  #badgeUp .bu slaps in + .imp white impact ring + halftone crest bg;
  .chip.live.fire at streak≥3 (toggle in renderPlayer); #runCard chain-link
  ::after band + .spray header, run rows .runrow.st stamp only when count
  changes (prevRunN guard); stylePop('+40 XP',btn) on check-in success;
  toasts slap w/ sticker tilt; #startCard tape corners + spray title.
  All under the global prefers-reduced-motion kill. sw lll-v5. NEWS id:10.
- Test-junk note: Aiman DENIED the SQL sweep of my ZZ Street artifacts —
  a few "ZZ Street just joined" Lab posts + 2 spent test invites remain in
  DB. Do not delete without his explicit go-ahead.

## The Target + Deck Bench (2026-07-19)

- **Edge fn now v19.** New table ll_deckreq (topic/status pending|ready/url).
  Coach actions deckreq_add (cap 5 pending) / deckreq_done (sets ready+url,
  pushCoach) / deckreq_del; roster returns deckreqs (latest 12).
- **Money tab additions** (admin): 🎯 The Target (#gAmt + #gWeeks pills incl.
  custom → seats to fill / classes / sessions-per-week vs current cadence);
  ⚡ Topic → Deck (TOPICS[32] youth-mindset bank, #topicGen/#topicBuild/
  #topicCustom → deckreq_add); 🎬 Deck bench list (#deckBench pending/ready,
  Open + Copy link, ✕ delete). Desk toasts when a deck flips ready
  (prevDeck diff in refresh). NEWS id:11.
- **Hourly Routine "Deck Bench — hourly check"** (trig_01TMZrhZnf5CwSUk2vtD5DJH,
  fires :18, self-binds to this session). Runs have NO MCP connectors —
  flow is curl-only: roster→pending rows→pptx skill deck (brand black/orange,
  10-14 slides)→commit assets/decks/<slug>.pptx→push branch→public link via
  raw.githubusercontent.com (repo is PUBLIC)→deckreq_done (buzzes his phone).
  Routine must never touch app/admin/index/sw/edge or push main.
- Optional later: mirror decks into Netlify assets for prettier URLs.

## Coach platform V1 (2026-07-20)

- **Edge fn now v21.** New tables: ll_coaches (display_name, username,
  pin_hash [sha username:pin:lockdownlabcoach], profile fields, session_rate,
  status, permissions jsonb, completed_sessions), ll_coach_codes
  (COACH-xxxx, 14-day, one signup), ll_coach_reqs (access requests).
  ll_sessions gained coach_id/player_count/status — coach-assigned sessions
  have coach_id set and upcomingSessions() filters coach_id=is.null so they
  NEVER hit the player board. DEFAULT_COACH_PERMS = 14 toggles.
- **Public actions:** coach_login, coach_register (needs a code), coach_request
  (no-code access request → pushCoach), coach_state, coach_profile_edit,
  coach_session_complete. **Admin actions** (coach code): coach_list (returns
  coaches+requests+codes), coach_add, coach_edit, coach_set_status,
  coach_set_perms, coach_delete, coach_assign_session, coach_unassign_session,
  coach_code_mint, coach_code_del, coach_req_approve (mints a code),
  coach_req_deny. VAPID keys unchanged (re-verified).
- **coach.html** (NEW, master coach-base.html) — staff coach portal. Onboard
  chooser (I've got a code / Log in / Need a code), coach_register + welcome
  overlay #cwelcome ("Everyone's Accountable" — AI reads their honesty,
  players rate them). Permission-gated OS dashboard: dash/schedule/perf/
  profile/earnings(gated canViewEarnings, calc inputs gated
  canUseEarningsCalculator)/players/resources/notifs/coming-soon. Test mode
  (canUseTestMode) with fake data. Session storage ll_coach_sess; welcome
  once per cid (ll_coach_wel_<cid>).
- **admin.html** — new 🧑‍🏫 Coaches sidebar section: access requests
  (approve→mint code), coach codes (mint/copy/del), add coach, and per-coach
  cards with live permission toggles (PERM_DEFS[14]), assign/unassign
  sessions, edit (bio/rate/specialties/PIN/notes), pause/activate, delete.
  loadCoaches() on section show. NEWS id:12.
- **First coach "Dre"** seeded as editable template (username dre, PIN 1234
  — Aiman resets). index.html: coaching-staff + admin entry links. sw
  unchanged (network-first serves coach.html fine).
- **Edge fn now v22 + admin notify (2026-07-20).** Coach codes are now
  one-time and live **6 hours** (COACH_CODE_TTL_MS = 6h, was 14 days);
  register expiry error says "they only live 6 hours". roster now returns
  `coach_reqs` (pending, oldest first) so the admin's 15s poll catches new
  requests off-tab. admin.html: 🧑‍🏫 Coaches sidebar badge `#bCoaches`
  (lit from coach_reqs count), and refresh() pings+toasts (+ desktop
  notification when hidden) on a new request via `prevCReq` — mirrors the
  door-knock `#bDoor`/prevK pattern. Coach-codes card copy now "6 hours".
  Need-a-code flow: coach submits IG in coach.html → coach_request →
  lands in admin Coaches tab + buzzes. Have-a-code: enter code → profile.

## Loud notifications push (2026-07-20)

- **Goal (Aiman):** make sure everyone knows about + turns on notifications,
  and that they land LOUD — otherwise the app looks dead.
- **Player app** (app2-base.html): replaced the subtle one-shot nudge with a
  LOUD full-width primer overlay `#ntfLoud` (pulsing bell, value rows: coach
  replies / new sessions / badges / squad, big "Yes — ping me"). Re-offers
  every session until enabled unless "Don't ask again" (`ll_ntfnever`);
  "Not now" snoozes 18h (`ll_ntfsnooze`). Persistent ringing header bell
  `#ntfBell` (`.ntfoff` shake + dot) shows whenever pings are off — tap to
  open the primer. Shared `enableNotifs()` used by primer, bell AND the
  settings switch; fires a loud confirm via SW showNotification (vibrate).
  `refreshBell()` on login + in renderNP. iOS non-standalone routes to
  install first. notifNudge now fires 11s post-login (was 16s).
- **Coach portal** (coach-base.html): previously had NO service worker / no
  permission ask at all. Now registers /sw.js, stamps ll-role=coach, has the
  same loud primer `#cNtf` + sidebar bell `#cBell`, `enableCoachNtf()`
  (localStorage `ll_coach_ntf`), and a 30s `coachPoll()` that buzzes a loud
  local notification on a newly assigned session (compares session ids).
  NOTE: staff-coach *server* push (closed-app) still needs an edge endpoint
  (coach_state auth is cid/pin; push_sub is coach-CODE only) — local pings
  work while the portal runs; true closed push is the follow-up.
- **Service worker** bumped lll-v5 → **lll-v6**: push handler now
  `vibrate:[260,90,260,90,420]` + `requireInteraction:true` so delivered
  pushes buzz hard and stay on screen until tapped.
- **Closed-app coach push — SHIPPED (edge v23, sw lll-v7, 2026-07-20).**
  ll_push reuses its `player_id` column (no FK) to hold the coach id under a
  new role `staffcoach`. Edge: `push_sub_coach` (cid/pin auth) stores the
  device sub; `pushStaffCoach(cid)` sends to that coach; `coach_assign_session`
  now calls it so the assigned coach is buzzed even with the app fully closed.
  VAPID keys re-verified byte-for-byte after deploy (exact-match check).
  coach.html: `pushSubCoach()` subscribes via VAPID on enable + on load when
  already granted; SW role stamp changed 'coach' → **'staffcoach'**. sw.js
  push handler branches by role: player→Lab, staffcoach→"new session/update →
  portal" (tag ll-coach → click opens /coach.html), else admin door. Verified
  end-to-end (temp coach → subscribe → assign → staffcoach row stored → push
  fired; all test data deleted).

## Google Drive structure (2026-07-20)

- Master folder **🔒 Lockdown Lab Live** (15V20Gh_e1Oh9Ldsd3wmjpkDIxJvXa6T7)
  with subfolders: 01 Social Media, 02 Brand & Wallpaper, 03 Docs & Guides,
  04 Launch Grid. Native docs copied in (Handbook, Master Sheet → Docs;
  Teaser Run → Social). Each folder has a tap-to-download index doc pointing
  at the Netlify-hosted /assets/ PNGs (binaries not uploaded — base64-inline
  only, so links instead). ⭐ START HERE doc at master root.

## Aiman's own coach account + mobile coach menu (2026-07-25)

- **Edge fn now v26.** `coach_login` gained a **claim-on-first-login** path: a
  coach row seeded with an empty `pin_hash` ('') sets its master PIN from the
  FIRST 4-digit PIN entered at login (returns fresh:true). Login prompt copy →
  "username or email". Nothing else changed; deploy verified byte-for-byte,
  VAPID keys re-checked identical.
- **Aiman seeded as an owner coach** (SQL insert): username =
  **aimanmaged88@gmail.com** (login uses username match, so his email IS the
  login), display_name 'Aiman (UNC)', pin_hash '' (awaiting first PIN),
  status active, ALL 14 permissions true. He logs into coach.html with his
  email; first PIN he types becomes his. Separate from the admin coach CODE.
  NOTE: until he claims it, anyone hitting coach_login with that exact email +
  any 4-digit PIN could claim it — told him to log in soon to lock it.
- **Coach portal mobile menu redesigned** (coach-base.html): the old fiddly
  horizontal top strip is replaced by a fixed top bar with a ☰ hamburger →
  **left slide-out vertical drawer** (`.sb` fixed, translateX(-100%)→0 on
  `.open`, `#sbScrim` scrim, `drawer()` fn; closes on nav-item or scrim tap).
  Opaque in BOTH themes (`.sb{background:#0a0a0c}` + `.lightmode .sb{#fff}`
  inside the media query — the desktop translucent `.lightmode .sb` rule would
  otherwise make the drawer see-through). Verified mobile E2E via
  scratchpad/coach-mobile.mjs (temp coach, dark+light, closed/open/after-nav).
  NEWS id:23. Admin desk mobile still uses its own top strip (not asked yet).

## Hoops Haven — pickup basketball network (2026-07-28, codename OpenCourt)

- **NEW standalone product** (Aiman: own brand, "starting fresh", nothing to do
  with the Lab). Named **Hoops Haven** (Aiman renamed it from OpenCourt same
  day; internals — edge fn `opencourt-api`, `oc_` tables, branch — keep the
  codename). **hoopshaven.html** — Sydney-wide pickup: public runs board,
  call a run at any of the 971 courts (courts.json = the picker), tap in/out,
  shareable run links (?run=id). NO accounts: device uuid + name + **Instagram
  handle as the jersey** — rosters link to instagram.com/handle (that's how
  people connect; never automate IG). Court pages: meta chips, runs here,
  **🔥 Play of the Week** (one clip link per player per court per ISO week,
  fires toggle, no self-fire, top clip crowned) and **👑 King of the Court**
  = coming-soon teaser, but tap-ins per court already accrue (court action
  returns 90-day leaders) so the throne has data when it ships.
- **Backend: edge fn `opencourt-api` (v2, verify_jwt on — anon key as Bearer
  + apikey, same as app-api).** Tables oc_runs / oc_run_players / oc_plays /
  oc_play_fires (RLS on, no policies, service-role only). Actions: board,
  run_get, run_create (host auto-joins, ≤6 runs/device/day, +14d window,
  past-time rejected), run_join (cap-checked), run_leave, court, play_submit
  (upsert per court+player+week), play_fire (toggle). Source committed at
  supabase/functions/opencourt-api/index.ts. app-api UNTOUCHED.
- **House rules + enforced sign-in (edge v3, 2026-07-28, Aiman asked).**
  Full-screen House Rules overlay `#shTerms` gates first open (`oc_terms`
  localStorage, TERMS_V bump re-prompts): runs NOT confirmed/guaranteed
  (community tool), play at own risk, community grows on the people, ZERO
  tolerance → indefinite ban, real accounts only, bans stick. Footer "House
  rules" link reopens it. Sign-in: IG handle REQUIRED, or a real email
  (Gmail/Apple ID) via the `#idSwap` toggle for the IG-less. Server-side:
  `register` action (name + ig|email + accept:true) writes **oc_players**
  (device id pk, accepted_at, banned flag); ALL writes (run_create/join,
  play_submit/fire) pass `guard()` — must be registered+clean — and use the
  REGISTERED name/ig (client-sent identity ignored → no impersonation).
  **oc_bans** blocklist matches handle/email/device, blocks writes AND
  re-registration from new devices; banning = insert lowercased value into
  oc_bans (no admin UI yet — Aiman asks, we SQL it). run_leave stays
  unguarded (banned can only remove themselves). Emails never exposed in
  rosters. True Google/Apple OAuth parked — needs Aiman's GCP/Apple dev
  credentials (Supabase Auth ready when he wants it).
- Brand: volt (#D8FF3E) on asphalt black, italic 900 display, court-line bg,
  bottom sheets. Dark only for now. No SW registration (root sw.js is the
  Lab's). E2E-verified via scratchpad oc-e2e.mjs + oc-e2e2.mjs (Playwright;
  NOTE: sandbox Chromium has no network — API calls bridged through Node
  undici proxy fetch; edge calls take 1-2s cold so pad test waits). All oc_
  test rows deleted after each run.
- v2 ideas discussed: KOTC proper, court check-ins ("I'm here now"), run
  chat, POTW weekly archive/all-time wall, PWA manifest + install.

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

## Athlete Command Center — coach squad drawer (2026-07-21)

- **SHIPPED in admin.html.** Every Squad row got a **📂 Open** button →
  `#athlete` right-side drawer (Athlete-OS style), loaded via existing
  `cdetail` (no backend change). Header: name, pos/age/founding, snapshot
  chips (XP / 🔥streak / sessions / in-today) + action rail (＋Log a session
  =`attend`, ⭐founding toggle). 7 tabs: Overview (last-5 avg bars +
  wants-to-work-on + badge chips + reach), Check-ins (energy/conf/mins/focus/
  note), Mind (shared_mind), Fuel (pills+water), Homework (list + `hw_add`),
  Scouting (private `intel_add` notes), Comms (DM thread + `cmsg`). Wires the
  previously-unused intel_add/hw_add/attend actions. Master admin-base.html.
  Verified E2E (open → 7 tabs render real data, actions fire). NBA-Street vibe.
- **NEXT (asked, not built):** structured **injuries** (area/severity/status/
  dates — needs edge + migration) + player **Tip of the Day** card (~5
  cyclable tips from their metrics + coach homework).

## What's New pop-up + update log convention (2026-07-21)

- **SHIPPED in admin.html.** `#whatsnew` overlay pops on desk open
  (`showWhatsNew()` in openDesk) showing every `NEWS[]` item with id >
  `lll_news_seen`; "Got it" → `markNewsSeen()` (seen=NEWS_LATEST) + clears the
  🎓 Guide badge. Fresh browser (seen 0) shows the latest 6, not full history.
- **CONVENTION (Aiman asked):** whenever ANY user-facing update ships, ADD a
  new entry to `NEWS[]` in admin-base.html (increment the id, newest first,
  short punchy title + body) so it pops up for him next time he opens the
  desk. NEWS is currently at id:18. Keep doing this every ship.
- Aiman explicitly said to SKIP the "all passwords in one spot / same
  password" idea — do not build a password manager.
- NEWS now at id:21 (light mode toggle). Keep incrementing every ship.

## Light / Dark theme toggle (2026-07-24)

- **SHIPPED in app.html** ("TOGGLE ME" — the dark theme was hurting his eyes;
  wanted his KOS + Athlete-OS light feel as an OPTION, dark kept as default).
  Master: scratchpad/app2-base.html.
- `applyMode(m)` toggles `.lightmode` on `<html>`, persisted `ll_mode`
  (default 'dark'). Two controls: header `#modeBtn` (☀️/🌙, `[data-modeico]`
  auto-swaps) + Settings → Fine-Tune → **Look** pills (`#modePills`
  dark/light). `setMode`/`toggleMode` near the THEME init (applied on load).
- CSS: `:root.lightmode{}` flips surface vars (--bg #EDEFF3, --glass #fff,
  --glass2 #F5F7FA, --line/--line2 dark-alpha, --text #0C0D12, --muted/--dim).
  Light overrides for header (frosted white), inputs, and the ~10 faint-white
  fills (.pill/.qbtn/.sw/.wcup/.ossrow/.ob-tabs, xpbar/jbar/swtch tracks,
  jdots, av ring, skel, igcard border). Immersive overlays stay DARK by
  re-restoring dark vars incl. --bg on #welcome,#badgeUp,#ntfLoud,#levelup,
  #vault (Vault body was going light until --bg restored). Bottom nav stays a
  dark floating pill (deliberate). Verified E2E in light across Home/Mind/
  Fuel/Squad/Coach/Settings/Vault via scratchpad/light-shot.mjs.
- **Extended to admin.html + coach.html (2026-07-24).** Same `:root.lightmode`
  variable flip + `applyMode`/`setMode`/`toggleMode` + `ll_mode` (SHARED key
  across all three surfaces — same origin). Toggle button lives in each
  sidebar `.sb-foot` (next to Lock up / Log out). Light overrides: `.sb`
  sidebar, `.row` rows (were rgba(0,0,0,.25) → light), `.editbox`, and the
  admin athlete drawer panel `#athlete .adr` (was #08080a → #fff; adcard/
  adtabs/adbody already use --glass2 so they auto-adapt). Coach notif primer
  #cNtf + welcome #cwelcome stay dark (own bg). NEWS id:22 announces it.
  Verified E2E via scratchpad/deskcoach-light.mjs + coach-light2.mjs (temp
  coach minted → dashboard shot → deleted). Masters: admin-base.html,
  coach-base.html.
