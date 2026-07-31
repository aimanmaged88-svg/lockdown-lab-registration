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

## Hoops Heaven — pickup basketball network (2026-07-28, codename OpenCourt)

- **NEW standalone product** (Aiman: own brand, "starting fresh", nothing to do
  with the Lab). Named **Hoops Heaven** (Aiman: OpenCourt → Hoops Haven → **Hoops Heaven**,
  all same day; internals — edge fn `opencourt-api`, `oc_` tables, branch — keep the
  codename). **hoopsheaven.html** (old /hoopshaven.html 301-redirects)  — Sydney-wide pickup: public runs board,
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
- **Account verification + Heaven desk (edge v6, 2026-07-29, Aiman asked).**
  oc_players += `verified bool`, `verify_code text` (5-digit, issued at
  register / backfilled by `me`). Verify = human loop, NO IG automation:
  player DMs their code to VERIFY_IG ('lockdownlablive' const in
  hoopsheaven.html — SWAP when the Heaven IG page exists) from their
  signed-up handle (email users → VERIFY_EMAIL aimanmaged88@gmail.com);
  Aiman confirms in **hoopsheaven-desk.html** (auth = ACTIVE ll_coaches
  creds, same sha256 scheme as coach_login; actions admin_players /
  admin_verify / admin_ban {pid,on,reason} — ban also writes oc_bans for
  handle+email+device, unban clears). Gates: run_create + play_submit
  require verified (error code 'verify' → app opens profile + #vfCard);
  join/checkin stay open to unverified. `me` action returns status; app
  refreshes on boot + "check my status" button; rosters/POTW rows carry
  `v` flag → volt ✓. Aiman's @lockdownlab3 verified via SQL.
- **Ratings + fonts + custom courts (edge v12, 2026-07-30, Aiman asked).**
  RATINGS: table `oc_ratings` (pk court_key+player_id, stars 1-5 + text≤300,
  resubmit updates). Actions: `rate_court` (guarded, registered only —
  verification NOT required); `court` returns `reviews[]` (incl pid for desk
  moderation — pids already public via rosters) + `rsum {avg,n}`;
  `courts_meta` returns `ratings` map for all courts → ★ badges on home
  cards/search/map preview; desk court editor lists reviews w/
  `admin_review_del`. NO fake ratings ever — all real player submissions.
  FONTS: assets/fonts/*.woff2 (Anton 400 = display 'HHDisplay', Barlow
  Condensed 600/800 = 'HHCond' labels, Permanent Marker = 'HHMarker'
  script accents; OFL/Apache licensed, self-hosted, latin subsets, 93KB).
  Applied across app + desk + QR posters — de-AI-ified the look per Aiman.
  CUSTOM COURTS: oc_courts += lat/lon/suburb/indoor/lit/custom. Desk ➕ Add
  a court (paste "lat, lon" from Google Maps, Sydney bounds enforced
  server-side); `admin_court_add` (key oc_c_<uuid8>) / `admin_court_del`
  (custom only). courts_meta customs merge into app dataset (picker, map,
  search) + QR poster page. Verified via ultracode workflow (4 E2E lenses +
  2 adversarial reviewers).
- **Security hardening (edge v13, 2026-07-30).** Review workflow caught a
  real PostgREST injection: client-chosen device ids interpolated into
  `in.(...)` filters unsanitized (rnames/verifiedSet/ratingsFor) → a `"`/`&`
  in an id 500s a court page + the board for everyone. Fixed: `sid()` helper
  strips ids/keys to `[a-zA-Z0-9._-]` everywhere they hit an in.() list;
  register rejects ids failing `^[a-zA-Z0-9._-]{8,64}$`. Also: `pid` in the
  court `reviews` payload is gated behind coachAuth (desk moderation only —
  public never sees device ids); `me` no longer returns email; rate_court
  validates court_key (`^oc_[...]+$`) + caps 30 distinct courts/device/day.
  Frontend: rate button restores label on error, desk review-delete awaits
  then reloads (no timer race), verify-gate routes to Profile tab, court
  counts dynamic. Re-verified by curl against live v13.
- **HH 2.0 redesign (edge v10, 2026-07-30, Aiman sent a mock: "make it look
  like this").** hoopsheaven.html rebuilt to the mock: orange default accent
  (#FF6A2B 'Blaze', onaccent threshold .62 → white-on-orange), stacked
  wordmark + hoop SVG, "Good courts. Real hoopers. Your game." (script via
  'Segoe Script'/cursive), bottom tab bar (Home/Map/Runs/Saved/Profile,
  view() router). Home: search-first (#hq), filter pills, NEARBY COURTS
  h-scroll photo cards w/ "N here" badges, Runs-tonight strip. MAP tab:
  Leaflet 1.9.4 INLINED (BSD-2) + CARTO dark_all tiles (external, attributed),
  971 canvas dots, activity courts get divIcon count pins, tap → preview
  card → court page. Court sheet: photo hero, FREE tag, 🔖 bookmark
  (localStorage oc_saved → Saved tab), amenity tiles, live-activity
  avatars, Directions + green I'm-Here. edge v10: courts_meta also returns
  {here,runs} per-court activity counts. Ratings/reviews + court condition
  from the mock SKIPPED deliberately (no review backend — no fake numbers).
  E2E: scratchpad/hh-v2.mjs. File ~240KB (leaflet inlined).
- **Heaven desk 2.0 + court manager (edge v9, 2026-07-30, Aiman: "more like
  KOS… manage all the courts, uploading photos").** Desk rebuilt OS-style:
  left sidebar (Overview / Players / Courts), request-count badge, Light/Dark
  toggle (CSS vars, shared `ll_mode` key). NEW table `oc_courts` (key pk,
  name/notes/photo_url/hidden overrides on courts.json) + storage bucket
  `heaven` (public read; writes via edge only). Edge: public `courts_meta`
  (all overrides) + `court` returns `info`; admin `admin_court_set` (full
  form upsert) + `admin_court_photo` (base64 jpeg/png/webp ≤3.5MB → storage
  `courts/<key>-<ts>` → photo_url; desk canvas-downscales to 1280px jpeg
  first). App: loadCourts merges meta (rename + hidden filter); court page
  shows #ctPhoto hero + #ctNotes "📌". NOTE: storage.objects can't be
  deleted via SQL (Supabase guard) — old photos accumulate, fine at this
  scale. E2E: scratchpad/hh-courts.mjs.
- **Desktop mode (2026-07-29, Aiman asked — "I'm doing a lot of admin").**
  hoopsheaven.html: `@media(min-width:1000px)` — wide wrap, hero side-by-side,
  board = auto-fill grid (`.daylbl` spans all columns), sheets become centred
  dialogs (panel relative, pop animation, gate override included). Desk:
  stats strip (players/verified/requests/banned/runs live/tapped in),
  2-col grid ≥1000px (inbox + LIVE BOARD | pending + everyone), board via
  public `board` action, 30s auto-refresh + visibilitychange reload.
- **Fresh slate + desk PIN claim (edge v8, 2026-07-29, Aiman asked).** ALL
  oc_* data wiped (accounts/runs/checkins/inbox/bans — his own test rows
  included, at his request). `coachAuth` now claims-on-first-PIN like
  coach_login: pin_hash '' → first 4-8 digit PIN entered becomes the PIN
  (PINs must be digits now). Aiman's ll_coaches pin_hash reset to '' —
  UNCLAIMED until he logs into the desk (told him to do it soon). Note:
  coachAuth accepts ANY active ll_coaches row (currently him + 'samk').
- **In-app verification requests (edge v7, 2026-07-29, Aiman: "DMs can go
  to admin in my Heaven Desk").** Table `oc_inbox` (pk player_id — one live
  request each, resubmit updates; row deleted on verify/dismiss). Actions:
  `verify_request` (guarded, {player, text≤300}, rejects already-verified);
  `me` returns `requested`; `admin_players` also returns `inbox`;
  `admin_verify` clears the row; `admin_inbox_done` dismisses. App #vfCard:
  unrequested → message box + "📨 Request verification"; requested → amber
  waiting state; IG DM code demoted to optional extra proof. Desk gained a
  top 📨 Inbox section (name, message, @ig tap-through, Verify/Dismiss/Ban
  per row); pending list excludes players with a live request.
- **Sign-up gate at the door (2026-07-29, Aiman asked).** First open now:
  house rules → full-screen non-dismissible sign-up page (#shProfile.gate —
  wordmark, "Create your account", scrim/✕ disabled via the gate class) →
  app. Boot opens the gate when terms ok but no `oc_profile`; #tAgree chains
  into it. openGate()/openEdit() swap the sheet's copy + dismissibility
  (profile-chip edit stays closable). Gate-mode CSS note: `.panel>*` forced
  `flex:0 0 auto` because .btn-v's row `flex:1.3` grows vertically in the
  gate's column layout. Existing devices with a profile skip the gate.
- **Colour schemes (2026-07-28, Aiman asked).** Header 🎨 → `#shTheme` sheet:
  THEMES[8] accent presets (Volt/Blaze/Ice/Grape/Cherry/Mint/Gold/Chalk) + a
  native Custom colour input. `applyAccent()` sets `--volt` + computed
  `--onaccent` (luminance-picked black/white text on accent); ALL hardcoded
  rgba(216,255,62,.x) were converted to `color-mix(in srgb, var(--volt) X%,
  transparent)` so everything follows. Persisted `oc_accent` per device;
  `brighten()` lifts too-dark custom picks (loop-capped) so they stay legible
  on asphalt. Fire orange + danger red stay fixed (semantic).
- Brand: volt (#D8FF3E) on asphalt black default, italic 900 display,
  court-line bg, bottom sheets. Dark only for now. No SW registration (root
  sw.js is the Lab's). E2E-verified via scratchpad oc-e2e.mjs + oc-e2e2.mjs (Playwright;
  NOTE: sandbox Chromium has no network — API calls bridged through Node
  undici proxy fetch; edge calls take 1-2s cold so pad test waits). All oc_
  test rows deleted after each run.
- **QR court check-ins — SHIPPED (edge v5, 2026-07-29, Aiman asked).** Table
  `oc_checkins` (one active row per player, unique player_id, new court
  replaces old; reads window to 2h; 48h purge on write). Actions: `checkin`
  (guarded, {court, player, verified}) / `checkout` (unguarded, self-remove);
  `court` returns `here[]` (id/name/ig/verified/at). App: court page "📍 Here
  right now" section (#ctHere rows w/ ✓ when geo-verified, since-time,
  #ciBtn check-in/tap-out). Geo policy: position at court (≤800m) → verified
  ✓; clearly away → REFUSED; denied/unavailable → allowed unverified.
  Deep link `?court=<key>&ci=1` = the QR payload → opens court page + auto
  check-in. `oc_checkin` localStorage + `autoCheckout()` on boot/visibility:
  if still marked here, geo permission already granted and >800m away →
  server checkout + toast. TRUE background walk-away detection impossible in
  a web app (native-only geofencing) — told Aiman, parked.
  **hoopsheaven-qr.html** = printable per-court poster generator (search →
  multi-select → print; QR = deep link; qrcode-generator 1.4.4 MIT inlined,
  no CDN). E2E: scratchpad/hh-ci.mjs (Playwright mocked geolocation).
- **Server-side geofenced check-in + off-app headcount — SHIPPED (edge v15,
  2026-07-30, Aiman asked "geolocation-tagged, can't check in from Bankstown
  claiming Sydenham").** The client no longer self-declares `verified`; the
  SERVER is ground truth. `checkin` now takes `via` (`manual`|`qr`|`auto`) +
  device `lat`/`lon`, looks up the court's REAL coords via `courtCoords()`
  (`loadGeo()` fetches courts.json once, caches 6h; custom courts from
  oc_courts) and haversine-compares to a per-court fence `courtRadius()`
  (oc_courts.radius_m, default 300m, clamp 80–2000). Enforcement:
  **manual + auto REQUIRE being inside the fence** (else `needloc` 400 /
  `toofar` 403); **qr** (physical poster) is allowed with flaky GPS but only
  gets ✓ when GPS also confirms. Stores the court's authoritative coords, not
  the client's. New migration `opencourt_geofence`: oc_checkins += `via`,
  `extra`; oc_courts += `radius_m` (oc_court_geo table created but unused —
  coords come from courts.json at runtime instead).
  **Off-app headcount** (`set_headcount`, guarded, must be checked in there):
  a number 0–40 stored on the reporter's checkin row — NO free text, per
  Aiman "don't give too much freedom". `hereFor()` now returns
  `{list,total,extra}` (per-row extra included so the stepper inits to the
  player's own count); `court`/`checkin`/`checkout` return `hereTotal`/
  `hereExtra`; courts_meta home-card counts include extras.
  Frontend hoopsheaven.html: `sendCheckin(c,via)` grabs GPS then lets the
  server decide; `#ciBtn`=manual, QR deep link `?court=&ci=1`=qr,
  `autoCheckin()` = if you're in a run at a court and you've arrived (GPS in
  fence, location already granted → never prompts) you're checked in silently
  on app open/visibility (web can't background-geofence). `#ctExtra` number
  stepper (−/+ only, shown when I'm checked in there) → `set_headcount`.
  "Not a booking system — times aren't guaranteed" disclaimer under the
  live-activity list. Verified E2E against live v15 (scratchpad/geo-e2e.mjs,
  10/10: needloc / toofar / at-court-verified / QR-unverified / QR-verified /
  headcount total / per-row extra / needci); all test rows deleted.
- **Official-only courts + rich details + suggestions + motion pass (edge v16,
  2026-07-30, Aiman asked).** BIG SHIFT: the app no longer shows the 971
  courts.json courts. The picker is now EXACTLY the courts the coach vets +
  adds at the desk. oc_courts gained `official bool` (true on add) + `info
  jsonb` (surface, hoops, rim, cost, best-times, water[bubbler|tap|none],
  toilets, parking, shade, seating, shop/drinks, `bring[]` what-to-carry,
  `tips`). New table `oc_court_reqs` — players SUGGEST courts (`court_suggest`,
  guarded, ≤5/day), coach reviews in the desk inbox. Nobody drops random pins.
  Migration `opencourt_court_details`.
  Edge: `admin_court_add` now stores official+info+radius; new
  `admin_court_edit` (all fields incl lat/lon+radius); `court_suggest` +
  `admin_court_req_done`; `admin_players` also returns `court_reqs`;
  `courts_meta` returns official/info/radius_m. courts.json still fetched by
  the EDGE (geofence coords) + the DESK (971-court quick-add prefill), just
  not by the app picker.
  App (hoopsheaven.html): loadCourts = official-only. Court page gained the
  full amenity grid, a **🎒 Before-you-leave checklist** (universal kit +
  amenity-derived items like "no water here → water bottle" + coach's bring[],
  ticks persist localStorage `oc_gear_<key>`), a **📋 Court tips** card, and
  dynamic cost. **Suggest-a-court** sheet `#shSuggest` (name/where/note →
  court_suggest) + empty-state CTAs (`data-suggest`) when no courts. Hero +
  map counts now dynamic ("Courts dropping soon" at 0).
  Desk (hoopsheaven-desk.html): court manager rebuilt — official-courts list,
  full editor (name/suburb/latlon, amenity toggles, water select, parking,
  surface/hoops/rim, best-times, what-to-bring chips, tips, quick note, **radius
  slider 80–800m**, hide), photo upload, quick-add prefilled from the 971 known
  courts, and a **📨 Court suggestions inbox** (Add it → prefills / Dismiss)
  with a Courts nav badge. NOTE: desk still uses the volt-green brand (not the
  app's orange) — pre-existing, not asked to change.
  Motion pass (de-AI-ify, Aiman: "make it Apple-fluid, not an AI app"): shared
  easing tokens (`--ease`/`--spring`/`--ease-out`), springier sheet enter +
  real slide-down/fade **exit** animations (closeSheet adds `.closing`),
  sharper card/button press + tab-icon pop, stronger scrim blur — all under
  `prefers-reduced-motion`. Verified E2E (13-check backend + app/desk
  Playwright, all test rows deleted; live-verified official-only empty state +
  desk known-court https prefill).
- **FONT → Chakra Petch (2026-07-30, Aiman's final pick = Option 8).**
  Showed an 8-option showcase (scratchpad/fontcompare2.html → fontcompare2.png:
  1 Bebas Neue, 2 Archivo Black, 3 Anton [old], 4 Saira Condensed, 5 Oswald,
  6 Teko, 7 Antonio, 8 Chakra Petch). Briefly shipped Option 1 (Bebas+Inter),
  then he switched to **8 Chakra Petch** — techy/street display + body.
  Self-hosted chakrapetch-400/600/700 in assets/fonts/; `@font-face` family
  names **HHDisplay(700)/HHCond(600·700)/HHBody(400·600·700) kept** so no other
  CSS changed (`--disp` fallback no longer 'Arial Narrow' — Chakra isn't
  condensed). Applied across hoopsheaven.html + -desk.html + -qr.html. Permanent
  Marker (HHMarker) accent unchanged. Old anton/barlow + bebas/inter woff2
  deleted. Verified live (chakrapetch 200, old refs gone). To change again:
  swap the 3 @font-face src blocks (same names) + drop new woff2 in assets/fonts.
- **NBA-style player profiles + peer ratings + coach moderation (edge v18,
  2026-07-31, Aiman asked — "NBA style profile… depending on check-ins…
  feedback from other players I approve… stars out of 10… under 6 doesn't
  register, just says 6−… not disheartening… good vibes as a rule").**
  Migrations `opencourt_profiles` (oc_players.checkins_total; oc_pfeedback
  [rater/ratee/stars 1-10/comment/approved, unique pair]) + `opencourt_checkin_bump`
  (oc_players.last_ci_court/last_ci_at + `oc_checkin_bump()` RPC).
  Edge: `profile` (tier from check-ins via tierOf[] Rookie→Rotation→Starter→
  All-Star→Franchise→Legend; box score check-ins/runs/clips/fires; community
  rating from APPROVED oc_pfeedback only; **anti-disheartening display** — avg
  <7 → "6−" soft, no ratings → "Unrated", never a low number; approved
  comments = scouting report; `mine` never echoes UN-approved content — a
  security fix so client-spoofed viewer_id can't harvest pending moderation
  text). `rate_player` (guarded, self-block, 1 per pair upsert→pending, 20
  new-ratees/day cap). `admin_feedback`/`_set`/`_del` (coach moderation
  queue). checkin now bumps checkins_total via the atomic+durable RPC (dedups
  tap-out/tap-in + GPS flap at the same court within 6h — no farming).
  admin_players returns feedback_pending.
  App (hoopsheaven.html): Profile tab = your NBA trading-card (tier-coloured
  foil/glow, holographic sheen, count-up box score, tier-progress bar, Legend
  confetti). `openHooper(id)` #shHooper sheet views ANY player — wired from
  run rosters / here-now / Play-of-the-Week (data-hooper + wireHoopers).
  `#shRate` 1-10 star picker (positive word per score) → rate_player. Community
  **good-vibes rules added to House Rules** (non-negotiable: hype not hurt,
  ratings celebrate not tear down, all levels welcome). All animations under
  prefers-reduced-motion.
  Desk (hoopsheaven-desk.html): ⭐ Feedback section (Pending/All tabs,
  Approve/Reject, nav badge).
  QUALITY: ran an adversarial 5-lens review workflow (13 agents) → 7 confirmed
  findings, ALL fixed incl. a CRITICAL stale `$('#pcard')` selector that
  halted app boot, the viewer_id pending-leak, and check-in inflation. Verified
  E2E (15-check profile flow + 6-check fixes flow, all live; app boots clean,
  live NBA card + desk moderation screenshotted; all demo/test rows deleted).
- **Maps-link courts + TikTok + verify redesign + in-depth desk (edge v20,
  2026-07-31, Aiman asked).** Migration `opencourt_socials_suggest_extras`
  (oc_players += `tiktok text`; oc_court_reqs += `photo_url`, `lat`, `lon`).
  Edge v19→v20: `parseCoords`/`resolveMapsUrl` (SSRF-safe — only follows
  google/goo.gl hosts, only ever returns coords) + `resolve_maps` action
  (Sydney-bounded); TikTok flows through register/me/profile/guard/
  admin_players/admin_ban; `court_suggest` resolves a pasted Maps link → stores
  lat/lon and uploads an optional base64 photo to `heaven/suggest/*`;
  `ownPhoto()` gate so `admin_court_add`/`_edit` accept a carried `photo_url`
  ONLY when it's our own `heaven` bucket URL (blocks arbitrary/SSRF URLs);
  `admin_players` returns `courts_total`. Stale "takes one DM" copy on the
  run/clip verify-gates rewritten to "Request the ✓".
  App (hoopsheaven.html): sign-up sheet now a 3-way **Instagram / TikTok /
  Email** picker (`#idPick`, replaces the old ig↔email `#idSwap` link;
  `#pfTiktok`); **verify card redesigned** — the old confusing DM-code flow is
  gone, replaced by a clear "🔵 Get the ✓ — show us you're real" card with 1-2-3
  steps that link the player's IG/TikTok page + a single "Request the ✓" button
  (`vfSocial()` picks IG or TikTok); NBA card + edit prefill now link TikTok;
  suggest sheet gained an optional **photo upload** (`#sgPhotoBox`,
  client-downscaled to 1280px jpeg → `court_suggest` photo). NOTE: the theme
  picker Aiman asked for ALREADY EXISTS (header 🎨 → `#shTheme` 8 presets +
  custom, and Profile → 🎨 Colours) — pointed him to it, nothing to build.
  Desk (hoopsheaven-desk.html): court editor location field takes a **Google
  Maps link OR "lat, lon"** with a **📍 Locate** button (`resolveLoc()` →
  `resolve_maps`, normalises the field + confirms the pin; save auto-resolves a
  link if Locate wasn't tapped); **suggestions inbox** shows the player's photo
  thumbnail + a "📍 Pinned from their link" chip, and **Add it** prefills
  name/coords/photo/note (`CPHOTO` carries the photo onto the new court via
  admin_court_add; `CFROMSUGG` auto-dismisses the suggestion once added);
  **verification inbox + player rows show tappable IG AND TikTok links**
  (`socialLinks()`, joined via player_id) with a "open their page — real
  hooper? verify" nudge; **in-depth Overview** — 9 stat tiles (players +this
  week / verified +% / requests / court ideas / courts live / runs live /
  tapped in / all-time check-ins / banned), a "🔔 Needs your call" action panel
  linking the request/suggestion/feedback queues, and a "🆕 Newest hoopers"
  list. **Multiple approvers already work** — coachAuth accepts ANY active
  ll_coaches row, so anyone Aiman adds as an active coach can approve
  everything (confirmed, no change needed). Verified: 10/10 backend E2E
  (photo carry-over + foreign-URL rejection + courts_total + resolve_maps +
  suggest→approve loop) + Playwright app (7/7: TikTok sign-up, verify card,
  TikTok link, suggest photo) + desk (7/7: 9-tile dashboard, needs-your-call,
  newest, Locate normalise). All test rows + temp coach deleted.
- **"Next level" pack (edge v21, 2026-07-31, Aiman: "make it amazing… really
  next level"). Four features shipped:**
  - **📲 Installable PWA.** The manifest + apple meta + icons were already in
    the head from a prior session (icons upgraded here to a glowing haloed
    basketball — assets/hh-icon-{180,192,512}.png, rendered from scratchpad/
    hh-icon.svg). NEW: a dismissible **install nudge** `#installBar`
    (`beforeinstallprompt` → one-tap install on Android; a "tap Share → Add to
    Home Screen" hint on iOS; `oc_install` localStorage; hidden when already
    standalone). NO service worker (root sw.js is the Lab's — avoided the scope
    clash; manifest-only install works on both platforms).
  - **📸 Shareable cards.** Canvas-drawn branded images (1080×1350) via the Web
    Share API (files) with a download fallback. `runShareCanvas(r)` = a run
    card (when/court/format/spots/roster + CTA); `cardShareCanvas(d)` = the NBA
    player card. Logo drawn with `drawMark()` canvas primitives (NOT an <img>)
    so the canvas is never tainted → always exports. `#rShare` now shares the
    image; Profile got a **"📤 Share my card"** row (`#pShare`, uses `MYCARD`).
  - **👑 King of the Court, live.** Court page KOTC teaser now shows the real
    king + top-5 (from the existing `kotc` 90-day tap-in data; header
    `#ctKingHead` goes live when there's a king). NEW **City Kings** city-wide
    leaderboard: edge `leaderboard` action (top 25 by `checkins_total`, tier +
    verified), Home **🏆 City Kings** section (`#homeKings`, top 3) + full
    `#shKings` sheet (`loadKings`/`openKings`/`kingRowHTML`, rows open the
    hooper card via data-hooper). Medals + colour-coded tier chips.
  - **💬 Run chat.** Migration `opencourt_run_chat` (table `oc_run_chat`, run_id
    uuid). Edge: `chat_get` (open read) + `chat_send` (guarded, **must be tapped
    into the run or be its host** → `notin` 403; 20 msgs/run/device/5min cap) +
    `chatFor()` helper. App: chat thread inside the run sheet (`#rChat` +
    `#rChatBox`/`#rChatHint`), `renderChat`/`loadChat`/`paintChat`, 7s poll
    while the sheet is open (`startChatPoll`/`stopChatPoll`), own messages
    highlighted, Enter-to-send. True closed-app PUSH is still the follow-up
    (needs a HH-scoped SW + VAPID) — chat updates live only while the app is
    open. Told Aiman.
  - Verified: 10/10 (v20) + 7/7 (v21 chat/leaderboard) backend E2E, share-card
    renders screenshotted, app 8/8 Playwright smoke (boots clean, City Kings +
    run chat + install bar + share row). All test rows + temp coaches deleted.
- v2 ideas discussed: KOTC proper, run chat, POTW weekly archive/all-time
  wall, PWA manifest + install, native app for background geofencing.

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
