const pptxgen = require("pptxgenjs");
const W = 13.3, H = 7.5, LOGO = __dirname + "/logo.png", F = "Arial";
const BG = "0B0B0D", PANEL = "17171B", PANEL2 = "23232B";
const WHITE = "F4F4F2", MUTED = "9A9AA2", DIM = "6E6E76", ORANGE = "F0622A";

function build(cfg) {
  const p = new pptxgen();
  p.defineLayout({ name: "W", width: W, height: H }); p.layout = "W";
  const AC = cfg.accent; // topic secondary accent
  const sh = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 90, opacity: 0.45 });
  const base = (s) => s.background = { color: BG };
  const tag = (s) => s.addText(("UNC LIVE · " + cfg.short).toUpperCase(), { x: 8.6, y: 0.32, w: 4.4, h: 0.3, align: "right", fontFace: F, fontSize: 10, color: DIM, bold: true, charSpacing: 3, margin: 0 });
  const eyebrow = (s, t, c = ORANGE) => s.addText(t.toUpperCase(), { x: 0.7, y: 0.6, w: 9, h: 0.35, fontFace: F, fontSize: 13, color: c, bold: true, charSpacing: 4, margin: 0 });
  const title = (s, t, y = 1.0, size = 40, color = WHITE) => s.addText(t, { x: 0.7, y, w: 11.9, h: 1.1, fontFace: F, fontSize: size, color, bold: true, margin: 0, lineSpacing: size * 1.05 });
  const numCircle = (s, n, x, y, c = ORANGE, d = 0.62) => { s.addShape(p.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: c }, line: { type: "none" }, shadow: sh() }); s.addText(String(n), { x, y, w: d, h: d, align: "center", valign: "middle", fontFace: F, fontSize: d > 0.55 ? 22 : 18, color: BG, bold: true, margin: 0 }); };
  const card = (s, x, y, w, h, fill = PANEL) => s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, shadow: sh() });
  const pill = (s, t, c, x = 0.7, y = 0.55, w = 4.6) => { s.addShape(p.ShapeType.roundRect, { x, y, w, h: 0.5, rectRadius: 0.25, fill: { color: c }, line: { type: "none" }, shadow: sh() }); s.addText(t.toUpperCase(), { x, y, w, h: 0.5, align: "center", valign: "middle", fontFace: F, fontSize: 14, color: BG, bold: true, charSpacing: 2, margin: 0 }); };

  // ── Title ──
  let s = p.addSlide(); base(s);
  s.addImage({ path: LOGO, x: 4.9, y: 0.4, w: 3.5, h: 3.5 });
  s.addText("UNC LIVE  ·  SESSION " + cfg.n, { x: 0.5, y: 4.1, w: 12.3, h: 0.4, align: "center", fontFace: F, fontSize: 15, color: ORANGE, bold: true, charSpacing: 5, margin: 0 });
  s.addText(cfg.topic.toUpperCase(), { x: 0.5, y: 4.55, w: 12.3, h: 0.9, align: "center", fontFace: F, fontSize: 46, color: WHITE, bold: true, margin: 0 });
  s.addText(cfg.audience, { x: 0.5, y: 5.55, w: 12.3, h: 0.4, align: "center", fontFace: F, fontSize: 14, color: MUTED, bold: true, charSpacing: 2, margin: 0 });
  s.addText("[ DATE ]  ·  [ TIME AEST ]  ·  $10", { x: 0.5, y: 6.25, w: 12.3, h: 0.4, align: "center", fontFace: F, fontSize: 16, color: WHITE, margin: 0 });
  s.addNotes(cfg.notes.title);

  // ── Agenda ──
  s = p.addSlide(); base(s); tag(s); eyebrow(s, "The run of show"); title(s, "Tonight's game plan");
  cfg.agenda.forEach((t, i) => { const y = 2.2 + i * 0.92; numCircle(s, i + 1, 0.75, y, ORANGE, 0.6); s.addText(t, { x: 1.6, y: y - 0.05, w: 8.2, h: 0.7, valign: "middle", fontFace: F, fontSize: 19, color: WHITE, margin: 0 }); });
  card(s, 10.2, 2.3, 2.4, 3.9, PANEL);
  s.addText("45", { x: 10.2, y: 2.75, w: 2.4, h: 1.4, align: "center", fontFace: F, fontSize: 82, color: ORANGE, bold: true, margin: 0 });
  s.addText("MINUTES", { x: 10.2, y: 4.1, w: 2.4, h: 0.4, align: "center", fontFace: F, fontSize: 15, color: MUTED, bold: true, charSpacing: 3, margin: 0 });
  s.addText("Fast.\nInteractive.\nPlay along.", { x: 10.2, y: 4.7, w: 2.4, h: 1.3, align: "center", fontFace: F, fontSize: 14, color: MUTED, margin: 0, lineSpacing: 20 });
  s.addNotes(cfg.notes.agenda);

  // ── Promise ──
  s = p.addSlide(); base(s); tag(s); eyebrow(s, "Why this matters"); title(s, cfg.promise.head);
  card(s, 0.75, 2.35, 11.8, 2.2, PANEL);
  s.addText(cfg.promise.big, { x: 1.2, y: 2.55, w: 10.9, h: 1.8, valign: "middle", fontFace: F, fontSize: 26, color: ORANGE, bold: true, italic: true, margin: 0, lineSpacing: 34 });
  s.addText(cfg.promise.sub, { x: 0.75, y: 4.85, w: 11.8, h: 1.6, fontFace: F, fontSize: 18, color: WHITE, margin: 0, lineSpacing: 26 });
  s.addNotes(cfg.notes.promise);

  // ── House rules (+ safety strip) ──
  s = p.addSlide(); base(s); tag(s); eyebrow(s, "So we all have fun"); title(s, "How tonight works");
  const rules = [["Cameras on if you can", "It's a team, not a webinar."], ["Live in the chat", "Answer, ask, react — loud chat is good."], ["No dumb questions", "If you wonder it, someone else does too."], ["Play along", "We'll do things, not just talk."]];
  rules.forEach((r, i) => { const x = 0.75 + (i % 2) * 6.15, y = 2.2 + Math.floor(i / 2) * 1.75; card(s, x, y, 5.75, 1.55, PANEL); numCircle(s, i + 1, x + 0.32, y + 0.32, ORANGE, 0.5); s.addText(r[0], { x: x + 1.0, y: y + 0.25, w: 4.5, h: 0.5, valign: "middle", fontFace: F, fontSize: 17, color: WHITE, bold: true, margin: 0 }); s.addText(r[1], { x: x + 1.0, y: y + 0.75, w: 4.5, h: 0.6, fontFace: F, fontSize: 13, color: MUTED, margin: 0, lineSpacing: 16 }); });
  card(s, 0.75, 5.9, 11.8, 1.05, PANEL2);
  s.addText(cfg.safetyStrip, { x: 1.1, y: 5.9, w: 11.1, h: 1.05, valign: "middle", fontFace: F, fontSize: 13.5, color: cfg.safety ? AC : DIM, bold: !!cfg.safety, italic: true, margin: 0, lineSpacing: 17 });
  s.addNotes(cfg.notes.rules);

  // ── Content slides (data-driven cards) ──
  cfg.slides.forEach((sl) => {
    s = p.addSlide(); base(s); tag(s);
    if (sl.pill) pill(s, sl.pill[0], sl.pill[1] === "AC" ? AC : ORANGE);
    if (sl.eyebrow) eyebrow(s, sl.eyebrow, sl.eyebrowAC ? AC : ORANGE);
    title(s, sl.title, sl.pill ? 1.25 : 1.0);
    if (sl.sub) s.addText(sl.sub, { x: 0.7, y: sl.pill ? 2.25 : 2.2, w: 11.9, h: 0.8, fontFace: F, fontSize: 18, color: MUTED, margin: 0, lineSpacing: 24 });
    const topY = sl.sub ? (sl.pill ? 3.0 : 2.95) : (sl.pill ? 2.3 : 2.35);
    if (sl.big) { card(s, 0.75, topY, 11.8, 2.4, PANEL); s.addText(sl.big, { x: 1.2, y: topY + 0.2, w: 10.9, h: 2.0, valign: "middle", fontFace: F, fontSize: 27, color: WHITE, bold: true, margin: 0, lineSpacing: 36 }); }
    if (sl.cards) { const n = sl.cards.length, gap = 0.3, cw = (11.8 - gap * (n - 1)) / n; sl.cards.forEach((c, i) => { const x = 0.75 + i * (cw + gap); card(s, x, topY, cw, 3.5, i === n - 1 && sl.hot ? PANEL2 : PANEL); numCircle(s, i + 1, x + 0.32, topY + 0.32, ORANGE, 0.62); s.addText(c[0], { x: x + 0.3, y: topY + 1.15, w: cw - 0.6, h: 0.95, fontFace: F, fontSize: 20, color: WHITE, bold: true, margin: 0, lineSpacing: 23 }); s.addText(c[1], { x: x + 0.3, y: topY + 2.05, w: cw - 0.6, h: 1.25, fontFace: F, fontSize: 14, color: MUTED, margin: 0, lineSpacing: 18 }); }); }
    if (sl.rows) { sl.rows.forEach((r, i) => { const y = topY + i * 1.32; card(s, 0.75, y, 11.8, 1.12, PANEL); numCircle(s, i + 1, 1.05, y + 0.26, ORANGE, 0.6); s.addText(r, { x: 1.95, y: y, w: 10.3, h: 1.12, valign: "middle", fontFace: F, fontSize: 18, color: WHITE, bold: true, margin: 0, lineSpacing: 22 }); }); }
    if (sl.chips) { sl.chips.forEach((c, i) => { const x = 0.75 + (i % 3) * 4.0, y = topY + Math.floor(i / 3) * 1.45; card(s, x, y, 3.6, 1.15, PANEL); s.addText(c, { x, y, w: 3.6, h: 1.15, align: "center", valign: "middle", fontFace: F, fontSize: 20, color: WHITE, bold: true, margin: 0 }); }); }
    if (sl.polls) { sl.polls.forEach((q, i) => { const y = topY + i * 1.4; card(s, 0.75, y, 11.8, 1.15, PANEL); s.addText(q[0], { x: 1.1, y: y + 0.16, w: 10.9, h: 0.4, fontFace: F, fontSize: 15, color: MUTED, bold: true, margin: 0 }); s.addText(q[1], { x: 1.1, y: y + 0.53, w: 10.9, h: 0.5, fontFace: F, fontSize: 19, color: WHITE, bold: true, margin: 0 }); }); }
    if (sl.court) { const cx = 3.9, cy = topY + 0.05, cw = 5.5, ch = 3.5; s.addShape(p.ShapeType.roundRect, { x: cx, y: cy, w: cw, h: ch, rectRadius: 0.06, fill: { color: "23402F" }, line: { color: "3C5C48", width: 1.5 } }); s.addShape(p.ShapeType.rect, { x: cx + cw / 2 - 0.85, y: cy, w: 1.7, h: 1.4, fill: { type: "none" }, line: { color: "6E8C78", width: 1.5 } }); s.addShape(p.ShapeType.ellipse, { x: cx + cw / 2 - 0.28, y: cy - 0.14, w: 0.56, h: 0.28, fill: { color: "D8843C" }, line: { color: WHITE, width: 1 } }); const dpos = [[cx + cw / 2 - 0.25, cy + 0.55, "1"], [cx + 0.6, cy + 1.7, "2"], [cx + cw - 1.1, cy + 1.7, "3"], [cx + 1.4, cy + ch - 1.0, "4"], [cx + cw - 1.9, cy + ch - 1.0, "5"]]; dpos.forEach(([x, y, nn]) => numCircle(s, nn, x, y, AC, 0.5)); }
    if (sl.footer) s.addText(sl.footer, { x: 0.75, y: 6.55, w: 11.8, h: 0.5, align: "center", fontFace: F, fontSize: 17, color: ORANGE, bold: true, italic: true, margin: 0 });
    if (sl.notes) s.addNotes(sl.notes);
  });

  // ── Challenge + app ──
  s = p.addSlide(); base(s); tag(s); eyebrow(s, "Keep it going all week"); title(s, "Your challenge");
  s.addText(cfg.challenge, { x: 0.75, y: 2.25, w: 11.8, h: 0.7, fontFace: F, fontSize: 21, color: WHITE, bold: true, margin: 0, lineSpacing: 27 });
  card(s, 0.75, 3.25, 11.8, 2.6, PANEL);
  s.addText("Ask me anything in the app", { x: 1.2, y: 3.55, w: 10.9, h: 0.6, fontFace: F, fontSize: 22, color: ORANGE, bold: true, margin: 0 });
  s.addText([{ text: "Real questions → real answers from me. Anonymous if you want. Browse the Library of what I've already answered.", options: { color: MUTED, fontSize: 16, breakLine: true, paraSpaceAfter: 12 } }, { text: "uncthoughts.netlify.app", options: { color: WHITE, fontSize: 22, bold: true } }], { x: 1.2, y: 4.2, w: 10.9, h: 1.4, fontFace: F, margin: 0, lineSpacing: 22 });
  s.addNotes("Funnel to the app — their questions there feed the Library and keep you connected between sessions. Paste the link in the chat now.");

  // ── Next / wrap ──
  s = p.addSlide(); base(s); tag(s); eyebrow(s, cfg.next.eyebrow); title(s, cfg.next.title);
  card(s, 0.75, 2.4, 5.75, 3.0, PANEL);
  s.addText(cfg.next.leftHead, { x: 1.1, y: 2.7, w: 5, h: 0.4, fontFace: F, fontSize: 14, color: AC, bold: true, charSpacing: 2, margin: 0 });
  s.addText(cfg.next.leftBody, { x: 1.1, y: 3.25, w: 5, h: 2.0, fontFace: F, fontSize: 17, color: WHITE, margin: 0, lineSpacing: 24 });
  card(s, 6.8, 2.4, 5.75, 3.0, PANEL2);
  s.addText("SEASON PASS", { x: 7.15, y: 2.7, w: 5, h: 0.4, fontFace: F, fontSize: 14, color: ORANGE, bold: true, charSpacing: 2, margin: 0 });
  s.addText("$30", { x: 7.15, y: 3.15, w: 5, h: 1.0, fontFace: F, fontSize: 60, color: WHITE, bold: true, margin: 0 });
  s.addText("All 4 sessions. Best value. Lock your spot.", { x: 7.15, y: 4.35, w: 5, h: 0.9, fontFace: F, fontSize: 16, color: MUTED, margin: 0, lineSpacing: 21 });
  s.addText(cfg.next.foot, { x: 0.75, y: 5.7, w: 11.8, h: 0.5, align: "center", fontFace: F, fontSize: 17, color: WHITE, bold: true, margin: 0 });
  s.addNotes("Sell the next step before energy drops. Pitch the season pass. PayID details ready to paste.");

  // ── Q&A close ──
  s = p.addSlide(); base(s);
  s.addImage({ path: LOGO, x: 5.15, y: 0.55, w: 3.0, h: 3.0 });
  s.addText("ASK UNC — YOUR Q&A", { x: 0.5, y: 3.7, w: 12.3, h: 0.7, align: "center", fontFace: F, fontSize: 34, color: WHITE, bold: true, margin: 0 });
  s.addText("Unmute or drop it in the chat — nothing's off limits.", { x: 0.5, y: 4.5, w: 12.3, h: 0.5, align: "center", fontFace: F, fontSize: 18, color: MUTED, margin: 0 });
  s.addText([{ text: "Keep asking in the app  ·  ", options: { color: MUTED, fontSize: 16 } }, { text: "uncthoughts.netlify.app", options: { color: ORANGE, fontSize: 16, bold: true } }], { x: 0.5, y: 5.35, w: 12.3, h: 0.4, align: "center", fontFace: F, margin: 0 });
  s.addText([{ text: "@uncthoughts", options: { color: WHITE, fontSize: 16, bold: true } }, { text: "     Rate tonight 1–5 in the chat before you go 🙏", options: { color: MUTED, fontSize: 16 } }], { x: 0.5, y: 5.85, w: 12.3, h: 0.4, align: "center", fontFace: F, margin: 0 });
  s.addText(cfg.closeLine, { x: 0.5, y: 6.55, w: 12.3, h: 0.4, align: "center", fontFace: F, fontSize: 15, color: DIM, italic: true, margin: 0 });
  s.addNotes("Leave real time for Q&A — trust is built here and next week's questions come from it. Ask for a 1-5 rating. Thank them by name. End on energy.");

  return p.writeFile({ fileName: __dirname + "/" + cfg.file }).then((f) => console.log("WROTE", cfg.file));
}

// ══════════════ DECK 2 · DEFENCE ══════════════
const STEEL = "5A8FCC";
const defence = {
  n: "2", topic: "Defence", short: "Defence", accent: STEEL, safety: false,
  file: "UNC-LIVE-Session-2-Defence.pptx",
  audience: "JUNIORS 8–13   ·   BALLERS 14+   ·   LIVE ON ZOOM",
  safetyStrip: "Lived-experience coaching and general education — always have fun, always be kind.",
  agenda: ["Why defence wins games", "The stance that stops anyone", "Court Recall — defensive edition", "Position, help & talking on D", "Your 3 defensive habits"],
  promise: { head: "Defence wins games", big: "“Offence sells tickets. Defence wins championships.”", sub: "Here's the good news: defence isn't talent. It's effort + IQ — and anyone can bring both, tonight." },
  challenge: "Get in a proper stance every day this week, sprint back on every possession, and call one thing out loud each game.",
  next: { eyebrow: "Same time next week", title: "Next up — Nutrition 🍎", leftHead: "SPLIT BY AGE", leftBody: "Juniors 8–13\nBallers 14+\n\nSame game, tuned to your level.", foot: "Nutrition · Basketball IQ still to come." },
  closeLine: "Defence is a choice. Make it every night. 🧡",
  notes: {
    title: "Hold as people arrive. 'Welcome back to UNC LIVE — tonight it's DEFENCE, the side of the ball that actually wins. Cameras on, let's lock in.'",
    agenda: "Set the map. Tell them tonight is more MOVEMENT than last week — they'll be up in a stance. 30 seconds.",
    promise: "Sell the reframe hard: defence needs no talent, just want-to. That means everyone here can be elite at it. For Juniors keep it 'effort + heart'; for Ballers add 'IQ + discipline'. 1 min.",
    rules: "Quick and light. 45 seconds.",
  },
  slides: [
    { eyebrow: "The truth about D", title: "What great defence really is", big: "Not blocks and steals. It's being in the right spot, on balance, wanting it more than your man — every single possession." , notes: "Bust the myth that defence = highlight blocks. It's position + effort. Juniors: 'be a pest'. Ballers: 'discipline over gambling'. 1 min." },
    { eyebrow: "Fundamentals", title: "The stance that stops anyone", cards: [["Feet", "Wider than shoulders, weight on the balls of your feet."], ["Low", "Sit down in it — knees bent, chest up, ready to slide."], ["Hands", "Active and out. Mirror the ball, don't reach."]], footer: "Low man wins. Every time.", notes: "Demonstrate the stance on camera. Juniors love this. 1-2 min." },
    { pill: ["🏃 Play along", "AC"], title: "Stance check", sub: "Cameras on. Everyone into a defensive stance — I'm counting. Hold it for 20 seconds. Let's see who's really low.", notes: "MOVEMENT BREAK — this is gold for juniors and for focus. Get everyone up, hold the stance, hype the ones who are low. Do 2-3 rounds. Laugh, have fun." },
    { eyebrow: "Position > speed", title: "Beat them without being faster", big: "Be where the ball is GOING, not where it's been. Beat quick players by reading them early and cutting off the angle.", notes: "Same lesson as IQ week, applied to D: anticipation beats speed. 1 min." },
    { eyebrow: "Off the ball", title: "See your man AND the ball", cards: [["Point it out", "Pistols — one hand at your man, one at the ball."], ["Help & recover", "Help the middle, then sprint back to your man."], ["Talk early", "Warn your teammates before it happens."]], notes: "Ballers: dig into help-side + closeouts. Juniors: just 'see both, be ready to help a mate'. 1-2 min." },
    { pill: ["🧠 Play along · memory", "AC"], eyebrow: null, title: "Court Recall — defence", sub: "Study where these 5 defenders stand for 15 seconds. Then I hide it — you rebuild the setup in the chat.", court: true, notes: "RUN IT: 'Lock in, 15 seconds, just look.' Count down, ADVANCE to the next slide, they type the positions in chat. First to nail all 5 gets a shout-out. Tie it back: reading defensive shape is trained memory — your brain builds the map with reps." },
    { eyebrow: "Rebuild it", title: "Where were they?", sub: "Type it in the chat: which number was where? First to get all 5 right wins the shout-out.", big: "Reading the floor is a trained skill — not a gift. The more reps, the faster you see it live.", eyebrowAC: true, notes: "This is the blank-court reveal. Take answers, reveal the real setup (flip back a slide if needed), crown a winner. Connect to the learning-science: pattern memory = defensive IQ." },
    { eyebrow: "The best defence", title: "Talk is a weapon", sub: "The loudest team usually wins the defensive possession. If nobody hears it, it doesn't help.", chips: ["“Screen left!”", "“Help, help!”", "“Shot!”", "“I got ball!”", "“Switch!”", "“Box out!”"], notes: "Get the room to yell one call together, unmute. Loud = connected. Coaches pick talkers. 1 min." },
    { pill: ["🎮 Play along", "AC"], title: "Read the closeout", sub: "I'll show a moment — shooter in the corner, you're helping. 2 seconds: how do you close out? Type it.", big: "[ SHARE YOUR CLIP OR DIAGRAM HERE ]", notes: "Screen-share a still (grab one first). Count '2…1…', read a few answers, reveal: close out high-to-low, chop the feet, contest without fouling. 2 min." },
    { eyebrow: "Do these and you'll never sit", title: "Your 3 defensive habits", rows: ["Contest every shot — a hand up changes everything.", "Box out first, then go get the ball.", "Sprint back in transition — beat the ball down the floor."], footer: "None of these need talent. Just want-to.", hot: true, notes: "This is what they paid for — slow down, make them screenshot it. Juniors: pick habit 3. Ballers: all three, every rep. 1-2 min." },
  ],
};

// ══════════════ DECK 3 · MINDSET ══════════════
const VIOLET = "45C4C9";
const mindset = {
  n: "1", topic: "Mindset", short: "Mindset", accent: VIOLET, safety: true,
  file: "UNC-LIVE-Session-1-Mindset.pptx",
  audience: "ALL AGES   ·   LIVE ON ZOOM",
  safetyStrip: "This is coaching and lived experience — not therapy. If something feels heavy, we talk to the pros, and I'll show you exactly who.",
  agenda: ["Your mind is your most untrained skill", "Nerves, and the next-play mentality", "A 60-second visualization", "The voice in your head", "When it's bigger than basketball"],
  promise: { head: "Your mind is your best skill", big: "“You don't rise to the occasion. You fall to your training.” — so we train the mind too.", sub: "10+ years in learning and development taught me one thing: the brain is coachable. Confidence, focus, composure — all trainable. Tonight, session one, we start." },
  challenge: "Build one pre-game routine, pick a 'next-play' word to reset after mistakes, and try one 60-second visualization before bed.",
  next: { eyebrow: "Same time next week", title: "Next up — Defence 🔒", leftHead: "FROM NEXT WEEK — SPLIT BY AGE", leftBody: "Juniors 8–13\nBallers 14+\n\nSame game, tuned to your level.", foot: "Defence · Nutrition · Basketball IQ still to come." },
  closeLine: "Be kind to yourself — the best players do. 🧡",
  notes: {
    title: "Hold as people arrive (start ~5 past). Welcome each person by name. 'Welcome to UNC LIVE — session one. We're opening the whole series with the most important skill nobody trains: your MIND. This is my lane after 10+ years in learning and development. Cameras on, let's go.'",
    agenda: "Set the map. Flag that tonight has a calm, honest tone and one quiet activity. 30 sec.",
    promise: "Own your credibility here — the learning-development background is your authority. Juniors: 'your brain is a muscle'. Ballers: 'you fall to your training'. 1-2 min.",
    rules: "Read the safety strip out loud and mean it — you're a coach, not a psychologist, and tonight you'll point them to real help if they need it. This protects them AND you. 1 min.",
  },
  slides: [
    { eyebrow: "The reframe", title: "Nerves mean you care", big: "Nervous isn't weak — it's your body getting ready. The best players feel it too. They just have a routine to channel it.", notes: "Normalise nerves. Juniors: 'butterflies are normal'. Ballers: 'channel it, don't fight it'. 1 min." },
    { pill: ["🧘 Play along", "AC"], title: "60-second visualization", sub: "Eyes closed. I'll guide you. See yourself make the play — feel it before it happens.", big: "[ Read the guided script in the notes — slow, calm voice ]", notes: "RUN IT (slow, calm): 'Close your eyes. Breathe in 4, out 6. Picture the court — the sounds, the ball in your hands. See yourself calm, making the right read, knocking down the shot. Feel it. Now open your eyes — that's the rep your brain just took.' ~60-90 sec. Great for all ages." },
    { eyebrow: "Bounce back faster", title: "The next-play mentality", big: "One mistake is a data point, not your identity. Have a word — 'next' — that resets you instantly. Champions have short memories.", notes: "Give them a reset word. Juniors: 'shake it off, next play'. Ballers: 'flush it, next possession'. 1-2 min." },
    { eyebrow: "Self-talk", title: "Coach the voice in your head", cards: [["Catch it", "Notice the voice — is it helping or hurting?"], ["Flip it", "'I can't' → 'I'm learning'. Talk like a good teammate."], ["Repeat it", "A cue you say every game: 'I belong here.'"]], notes: "Self-talk is trainable. Juniors: 'be your own hype-man'. Ballers: 'a mantra under pressure'. 1-2 min." },
    { pill: ["🧠 Play along · focus", "AC"], title: "Focus under pressure", sub: "I'll show 6 numbers for 10 seconds. Then they're gone — type them back in order. Focus is a muscle too.", big: "7  ·  3  ·  9  ·  2  ·  8  ·  5", notes: "RUN IT: show the numbers 10 sec, ADVANCE, they type from memory. Add mild pressure ('quick, don't scroll up'). Tie it to focus + composure — the same skill that keeps you calm at the line. Keep it fun." },
    { pill: ["⚡ Quick poll", "AC"], title: "What would you do?", polls: [["Missed 3 shots in a row, you're open again:", "Shoot it  vs  pass it off?"], ["Big nerves before tip-off:", "Fight the feeling  vs  breathe and use it?"], ["Coach subs you out after a mistake:", "Sulk  vs  stay locked in for your team?"]], notes: "No wrong answers — the WHY is the lesson. Get them talking. 2-3 min." },
    { eyebrow: "Please read this one", title: "When it's bigger than basketball", eyebrowAC: true, big: "It's okay to not be okay. If something's weighing on you, talk to someone you trust or a professional — that's strength, not weakness.", rows: null, footer: "Kids Helpline 1800 55 1800 · Lifeline 13 11 14 · Emergency 000", notes: "SLOW DOWN and be sincere. You are NOT a therapist — say so warmly, and point to real help. Kids Helpline (under 25) is free 24/7: 1800 55 1800. Lifeline: 13 11 14. Emergency: 000. This slide protects your players and protects you legally. Don't skip it, don't rush it." },
    { eyebrow: "Do these this week", title: "Your 3 mindset takeaways", rows: ["One pre-game routine you do every time.", "A 'next-play' reset word for after mistakes.", "One 60-second visualization before bed."], footer: "A trained mind is your unfair advantage.", hot: true, notes: "What they paid for — screenshot moment. Juniors: pick the routine. Ballers: all three. 1-2 min." },
  ],
};

// ══════════════ DECK 4 · NUTRITION ══════════════
const GREEN = "5FB35F";
const nutrition = {
  n: "3", topic: "Nutrition", short: "Nutrition", accent: GREEN, safety: true,
  file: "UNC-LIVE-Session-3-Nutrition.pptx",
  audience: "JUNIORS 8–13   ·   BALLERS 14+   ·   LIVE ON ZOOM",
  safetyStrip: "I'm not a dietitian or a doctor — this is general education. Allergies or anything medical → your GP or an Accredited Sports Dietitian, always.",
  agenda: ["Food is fuel — the basics", "Game-day fuel & hydration", "Build-your-plate memory game", "Recovery & the real MVP: sleep", "When to see a professional"],
  promise: { head: "Play like you're fuelled", big: "“You can't pour from an empty tank.” Fuel right and everything — energy, focus, recovery — gets easier.", sub: "Keep it simple: this is general, practical stuff any player can use. Nothing extreme, no fad diets — you're growing, so we fuel, we don't restrict." },
  challenge: "Eat a familiar carb before you play, carry a water bottle everywhere this week, and don't skip breakfast.",
  next: { eyebrow: "Same time next week", title: "Next up — Basketball IQ 🏀", leftHead: "SPLIT BY AGE", leftBody: "Juniors 8–13\nBallers 14+\n\nSame game, tuned to your level.", foot: "Basketball IQ closes the series next week." },
  closeLine: "Fuel the work. Your body's the only one you get. 🧡",
  notes: {
    title: "Hold as people arrive. 'Tonight it's NUTRITION — the fuel behind everything. Quick heads up: I'm a coach, not a dietitian, so this is general stuff — I'll tell you when to see a pro. Let's get into it.'",
    agenda: "Set the map. Flag it's practical and simple — no fad diets. 30 sec.",
    promise: "Keep it grounded and honest. For Juniors + parents: 'fuel to grow and play'. For Ballers: 'timing + recovery'. 1 min.",
    rules: "READ THE SAFETY STRIP OUT LOUD — you are not a dietitian, this is general education, and anything medical or allergy-related goes to a GP or Accredited Sports Dietitian. This is the most important disclaimer of the whole series. 1 min.",
  },
  slides: [
    { eyebrow: "Keep it simple", title: "Food is fuel", cards: [["Fuel", "Carbs are your petrol — bread, rice, pasta, fruit."], ["Hydrate", "Water first, all day — not just at the game."], ["Recover", "Refuel + sleep so you're ready to go again."]], footer: "Three basics beat any fad diet.", notes: "Keep it dead simple, especially for juniors + parents. No calorie talk with kids. 1-2 min." },
    { eyebrow: "Before you play", title: "Game-day fuel", big: "A few hours out: carbs you KNOW and trust — rice, pasta, toast, a banana. Nothing new on game day. Ever.", sub: "Familiar food, a bit of protein, not too heavy. Simple wins.", notes: "The golden rule: never try new food on game day. Ballers: add timing (2-3h before). Juniors: 'eat something you know'. 1-2 min." },
    { pill: ["🧠 Play along · memory", "AC"], title: "Build your plate", sub: "I'll show a good game-day plate for 15 seconds. Then it's gone — rebuild it in the chat from memory.", big: "🍚 rice   ·   🍗 chicken   ·   🥦 veg   ·   🍌 banana   ·   💧 water", notes: "RUN IT: show the plate 15 sec, ADVANCE, they rebuild it in chat. Fun + teaches what a balanced game-day plate looks like. Reward the first full recall. Keep it light." },
    { eyebrow: "Drink before you're thirsty", title: "Hydration wins games", big: "If you wait until you're thirsty, you're already behind. Sip all day. Quick check: pale-straw pee = good, dark = drink more.", notes: "Simple, memorable. For cramps that are bad or frequent → that's a GP chat, say so. 1 min." },
    { eyebrow: "After the work", title: "Recovery & the real MVP", cards: [["Refuel", "Carbs + protein within an hour — chocolate milk, a sandwich."], ["Rehydrate", "Top the tank back up with water."], ["Sleep", "The #1 recovery tool — and it's free."]], footer: "Sleep beats every supplement on the shelf.", hot: true, notes: "Hammer sleep as the MVP — free, powerful, no gimmicks. 1-2 min." },
    { pill: ["⚡ Quick poll", "AC"], title: "Fuel this or that", polls: [["2 hours before a game:", "Bowl of pasta  vs  hot chips?"], ["Right after a hard session:", "Chocolate milk  vs  energy drink?"], ["Every single morning:", "Breakfast  vs  skip it?"]], notes: "No shaming — talk through WHY. Keep it fun and judgment-free. 2 min." },
    { eyebrow: "Please read this one", title: "When to see a professional", eyebrowAC: true, big: "This is general education from a coach — not a meal plan or medical advice. For anything real, go to the pros.", rows: ["Allergies or a medical condition → your GP or an Accredited Sports Dietitian. Never guess.", "Supplements as a teenager → talk to a GP or dietitian FIRST. Food comes first.", "Always tired or feeling flat → see your GP — it can be iron or medical, and that's their lane."], notes: "SLOW DOWN. This is the disclaimer that protects your players and you. Say it plainly: you're not a dietitian, food-first, and anything medical/allergy goes to the professionals. Don't skip it." },
    { eyebrow: "Do these this week", title: "Your 3 fuel takeaways", rows: ["Eat a familiar carb before you play — never something new.", "Carry a water bottle everywhere and sip all day.", "Don't skip breakfast — fuel the tank early."], footer: "Simple habits, done daily, beat any diet.", hot: true, notes: "Screenshot moment. Keep it to easy wins — especially for juniors + parents. 1-2 min." },
  ],
};

(async () => { await build(defence); await build(mindset); await build(nutrition); })();
