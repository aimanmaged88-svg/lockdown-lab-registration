const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.3, height: 7.5 });
p.layout = "W";
const W = 13.3, H = 7.5;

// ── UNC brand palette ────────────────────────────────────────────────
const BG = "0B0B0D", PANEL = "17171B", PANEL2 = "23232B";
const WHITE = "F4F4F2", MUTED = "9A9AA2", DIM = "6E6E76";
const ORANGE = "F0622A", TEAL = "45C4C9", COURT = "23402F";
const LOGO = __dirname + "/logo.png";
const F = "Arial"; // safe, QA-reliable

const sh = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 90, opacity: 0.45 });
const base = (s) => s.background = { color: BG };
const tag = (s, t) => s.addText(t.toUpperCase(), { x: 8.6, y: 0.32, w: 4.4, h: 0.3, align: "right", fontFace: F, fontSize: 10, color: DIM, bold: true, charSpacing: 3, margin: 0 });
const eyebrow = (s, t, c = ORANGE, x = 0.7, y = 0.6, w = 9) => s.addText(t.toUpperCase(), { x, y, w, h: 0.35, fontFace: F, fontSize: 13, color: c, bold: true, charSpacing: 4, margin: 0 });
const title = (s, t, y = 1.0, x = 0.7, w = 11.9, size = 40, color = WHITE) => s.addText(t, { x, y, w, h: 1.1, fontFace: F, fontSize: size, color, bold: true, margin: 0, lineSpacing: size * 1.05 });

function numCircle(s, n, x, y, c = ORANGE, d = 0.62) {
  s.addShape(p.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: c }, line: { type: "none" }, shadow: sh() });
  s.addText(String(n), { x, y, w: d, h: d, align: "center", valign: "middle", fontFace: F, fontSize: 22, color: BG, bold: true, margin: 0 });
}
function card(s, x, y, w, h, fill = PANEL) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, shadow: sh() });
}
function pill(s, t, c, x = 0.7, y = 0.55, w = 4.2) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h: 0.5, rectRadius: 0.25, fill: { color: c }, line: { type: "none" }, shadow: sh() });
  s.addText(t.toUpperCase(), { x, y, w, h: 0.5, align: "center", valign: "middle", fontFace: F, fontSize: 14, color: BG, bold: true, charSpacing: 2, margin: 0 });
}

// ═══ S1 · TITLE ═══════════════════════════════════════════════════════
let s = p.addSlide(); base(s);
s.addImage({ path: LOGO, x: 4.9, y: 0.45, w: 3.5, h: 3.5 });
s.addText("UNC LIVE  ·  SESSION 4 · THE FINALE", { x: 0.5, y: 4.15, w: 12.3, h: 0.4, align: "center", fontFace: F, fontSize: 15, color: ORANGE, bold: true, charSpacing: 5, margin: 0 });
s.addText("SESSION 4 — BASKETBALL IQ", { x: 0.5, y: 4.6, w: 12.3, h: 0.9, align: "center", fontFace: F, fontSize: 46, color: WHITE, bold: true, margin: 0 });
s.addText("JUNIORS 8–13  ·  BALLERS 14+  ·  LIVE ON ZOOM", { x: 0.5, y: 5.55, w: 12.3, h: 0.4, align: "center", fontFace: F, fontSize: 14, color: MUTED, bold: true, charSpacing: 2, margin: 0 });
s.addText("[ DATE ]  ·  [ TIME AEST ]  ·  $10", { x: 0.5, y: 6.25, w: 12.3, h: 0.4, align: "center", fontFace: F, fontSize: 16, color: WHITE, margin: 0 });
s.addNotes("HOLD HERE as people join (start ~5 past). Welcome each person by name in the chat. Big energy — it's the finale. When you're ready: 'Welcome to the final session of UNC LIVE — Basketball IQ, where the mind, the effort and the fuel all come together on the court. Cameras on if you can, let's finish this.'");

// ═══ S2 · GAME PLAN ═══════════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "The run of show"); title(s, "Tonight's game plan");
const plan = [
  "What basketball IQ really is (and why it beats speed)",
  "The 3 questions every smart player asks",
  "Court Recall — a live memory game",
  "Scan → Decide → Act, and why talking wins",
  "Your 3 takeaways to use this week",
];
plan.forEach((t, i) => {
  const y = 2.2 + i * 0.92;
  numCircle(s, i + 1, 0.75, y, ORANGE, 0.6);
  s.addText(t, { x: 1.6, y: y - 0.05, w: 8.2, h: 0.7, valign: "middle", fontFace: F, fontSize: 19, color: WHITE, margin: 0 });
});
card(s, 10.2, 2.3, 2.4, 3.9, PANEL);
s.addText("45", { x: 10.2, y: 2.75, w: 2.4, h: 1.4, align: "center", fontFace: F, fontSize: 82, color: ORANGE, bold: true, margin: 0 });
s.addText("MINUTES", { x: 10.2, y: 4.1, w: 2.4, h: 0.4, align: "center", fontFace: F, fontSize: 15, color: MUTED, bold: true, charSpacing: 3, margin: 0 });
s.addText("Fast. Interactive.\nNo boring lecture.", { x: 10.2, y: 4.7, w: 2.4, h: 1.2, align: "center", fontFace: F, fontSize: 14, color: MUTED, margin: 0, lineSpacing: 18 });
s.addNotes("Set the map so nobody wonders what's coming. 'We've got 45 minutes, it's going to move fast, and you're playing along — not just watching.' Keep this to 30 seconds.");

// ═══ S3 · WHO'S UNC ═══════════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "The man behind it");
title(s, "Who's UNC?");
s.addText([
  { text: "10+ years in basketball.", options: { bold: true, color: WHITE, fontSize: 22, breakLine: true, paraSpaceAfter: 6 } },
  { text: "10+ years in autism support & learning development.", options: { bold: true, color: WHITE, fontSize: 22, breakLine: true, paraSpaceAfter: 16 } },
  { text: "That mix is the whole point.", options: { color: MUTED, fontSize: 16, italic: true } },
], { x: 0.75, y: 2.15, w: 6.5, h: 2.2, valign: "top", fontFace: F, margin: 0 });
card(s, 0.75, 4.55, 6.5, 2.3, PANEL);
s.addText("“I don't just teach you the game.\nI teach you how to LEARN it.”", { x: 1.05, y: 4.75, w: 5.9, h: 1.9, valign: "middle", fontFace: F, fontSize: 22, color: ORANGE, bold: true, italic: true, margin: 0, lineSpacing: 30 });
s.addImage({ path: LOGO, x: 7.8, y: 1.9, w: 4.9, h: 4.9 });
s.addNotes("YOUR CREDIBILITY MOMENT — say it plain and confident, 60-90 seconds. [ADD YOUR REAL STORY: where you've coached, the kids/teams you've worked with, why the autism + learning-development background makes you teach the game differently.] The line that lands: most coaches teach WHAT to do — you teach people HOW to learn it and lock it in. That's why they're here and not on YouTube.");

// ═══ S4 · HOUSE RULES ═════════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "So we all have fun"); title(s, "How tonight works");
const rules = [
  ["Cameras on if you can", "I want to see you — it's a team, not a webinar."],
  ["Live in the chat", "Answer, ask, react. Loud chat = good session."],
  ["No dumb questions", "If you're wondering it, someone else is too."],
  ["Move when I say move", "We'll get up and do things. Space ready."],
];
rules.forEach((r, i) => {
  const x = 0.75 + (i % 2) * 6.15, y = 2.3 + Math.floor(i / 2) * 2.1;
  card(s, x, y, 5.75, 1.85, PANEL);
  numCircle(s, i + 1, x + 0.35, y + 0.35, ORANGE, 0.55);
  s.addText(r[0], { x: x + 1.1, y: y + 0.32, w: 4.4, h: 0.5, valign: "middle", fontFace: F, fontSize: 18, color: WHITE, bold: true, margin: 0 });
  s.addText(r[1], { x: x + 1.1, y: y + 0.85, w: 4.4, h: 0.8, fontFace: F, fontSize: 14, color: MUTED, margin: 0, lineSpacing: 17 });
});
s.addText("Tonight is lived-experience coaching and general education — always have fun, always be kind.", { x: 0.75, y: 6.75, w: 11.8, h: 0.4, align: "center", fontFace: F, fontSize: 12, color: DIM, italic: true, margin: 0 });
s.addNotes("Read the four quick, keep it light and funny. The bottom line covers you — you're a coach sharing experience, not a licensed professional. 45 seconds max.");

// ═══ S5 · WHAT IS IQ ══════════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "Definition"); title(s, "What is basketball IQ?");
card(s, 0.75, 2.4, 11.8, 2.5, PANEL);
s.addText("Seeing the game a half-second before it happens — and making the right decision, fast.", { x: 1.2, y: 2.6, w: 10.9, h: 2.1, valign: "middle", fontFace: F, fontSize: 30, color: WHITE, bold: true, margin: 0, lineSpacing: 40 });
s.addText([
  { text: "It's not talent you're born with.  ", options: { color: MUTED, fontSize: 20 } },
  { text: "It's trained.", options: { color: ORANGE, fontSize: 20, bold: true } },
], { x: 0.75, y: 5.4, w: 11.8, h: 0.6, align: "center", fontFace: F, margin: 0 });
s.addNotes("Say the definition slowly, let it sit. Then hit the punchline: IQ is trained, not born — which means everyone on this call can build it. That's the hope you're selling. 1 minute.");

// ═══ S6 · IQ BEATS ATHLETICISM ════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "The big idea"); title(s, "The quickest player doesn't win");
card(s, 0.75, 2.35, 5.75, 3.9, PANEL);
s.addText("JUST ATHLETIC", { x: 1.1, y: 2.65, w: 5, h: 0.4, fontFace: F, fontSize: 15, color: MUTED, bold: true, charSpacing: 2, margin: 0 });
s.addText([
  { text: "Fast, jumps high", options: { color: WHITE, fontSize: 17, bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 10 } },
  { text: "…but arrives a step late", options: { color: WHITE, fontSize: 17, bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 10 } },
  { text: "Runs hard the wrong way", options: { color: WHITE, fontSize: 17, bullet: { code: "2022" } } },
], { x: 1.1, y: 3.3, w: 5, h: 2.6, fontFace: F, margin: 0 });
card(s, 6.8, 2.35, 5.75, 3.9, PANEL2);
s.addText("HIGH IQ", { x: 7.15, y: 2.65, w: 5, h: 0.4, fontFace: F, fontSize: 15, color: ORANGE, bold: true, charSpacing: 2, margin: 0 });
s.addText([
  { text: "Reads it early", options: { color: WHITE, fontSize: 17, bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 10 } },
  { text: "Always in the right spot", options: { color: WHITE, fontSize: 17, bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 10 } },
  { text: "Makes the game look slow", options: { color: WHITE, fontSize: 17, bullet: { code: "2022" } } },
], { x: 7.15, y: 3.3, w: 5, h: 2.6, fontFace: F, margin: 0 });
s.addText("You beat athletes by knowing where to be.", { x: 0.75, y: 6.5, w: 11.8, h: 0.5, align: "center", fontFace: F, fontSize: 18, color: ORANGE, bold: true, italic: true, margin: 0 });
s.addNotes("Ask the room: 'Ever been beaten by someone slower than you? How?' Let a few answer in chat. Then land it: they were smarter, not faster. 1-2 minutes.");

// ═══ S7 · PLAY ALONG · READ THE PLAY ══════════════════════════════════
s = p.addSlide(); base(s); pill(s, "🎮 Play along", ORANGE); tag(s, "UNC LIVE · IQ");
title(s, "Read the play", 1.25);
s.addText("I'll show a moment. You've got 2 seconds. Type in the chat: what do YOU do?", { x: 0.7, y: 2.3, w: 11.9, h: 0.6, fontFace: F, fontSize: 19, color: MUTED, margin: 0 });
card(s, 0.75, 3.05, 11.8, 3.2, PANEL);
s.addText("[ SHARE YOUR GAME SCREENSHOT OR PLAY DIAGRAM HERE ]", { x: 1, y: 3.05, w: 11.3, h: 3.2, align: "center", valign: "middle", fontFace: F, fontSize: 18, color: DIM, bold: true, margin: 0 });
s.addNotes("HOW TO RUN IT: screen-share a paused clip or a still of a game situation (grab one before the session). Count '2… 1…', then read a few chat answers out loud by name. Reveal the smart read and WHY. Do 1-2 of these. This is the heartbeat of the session — make it fun, hype the good answers.");

// ═══ S8 · THE 3 QUESTIONS ═════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "The habit of smart players"); title(s, "3 questions, every possession");
const q3 = [["Where's the ball?", "See the whole floor, not just your man."], ["Where's my man?", "Know your job before the play starts."], ["Where's the help?", "Who's got your back — and who's got theirs."]];
q3.forEach((q, i) => {
  const x = 0.75 + i * 4.0;
  card(s, x, 2.5, 3.7, 3.6, PANEL);
  numCircle(s, i + 1, x + 0.35, 2.85, ORANGE, 0.7);
  s.addText(q[0], { x: x + 0.3, y: 3.75, w: 3.1, h: 0.9, fontFace: F, fontSize: 21, color: WHITE, bold: true, margin: 0, lineSpacing: 24 });
  s.addText(q[1], { x: x + 0.3, y: 4.7, w: 3.1, h: 1.2, fontFace: F, fontSize: 15, color: MUTED, margin: 0, lineSpacing: 19 });
});
s.addText("Offense or defense — same three questions.", { x: 0.75, y: 6.45, w: 11.8, h: 0.5, align: "center", fontFace: F, fontSize: 17, color: ORANGE, bold: true, italic: true, margin: 0 });
s.addNotes("Get them to say the three out loud with you. Repetition = memory. Tell them to literally ask these next game. 1-2 minutes.");

// ═══ S9 · PLAY ALONG · COURT RECALL (memory) ══════════════════════════
s = p.addSlide(); base(s); pill(s, "🧠 Play along · memory", TEAL); tag(s, "UNC LIVE · IQ");
title(s, "Court Recall", 1.25);
s.addText("Study this setup for 15 seconds. Then I hide it — you rebuild it in the chat.", { x: 0.7, y: 2.25, w: 11.9, h: 0.5, fontFace: F, fontSize: 18, color: MUTED, margin: 0 });
// half-court
const cx = 3.9, cy = 2.95, cw = 5.5, ch = 3.9;
s.addShape(p.ShapeType.roundRect, { x: cx, y: cy, w: cw, h: ch, rectRadius: 0.06, fill: { color: COURT }, line: { color: "3C5C48", width: 1.5 } });
s.addShape(p.ShapeType.rect, { x: cx + cw / 2 - 0.85, y: cy, w: 1.7, h: 1.5, fill: { type: "none" }, line: { color: "6E8C78", width: 1.5 } }); // key
s.addShape(p.ShapeType.ellipse, { x: cx + cw / 2 - 0.28, y: cy - 0.14, w: 0.56, h: 0.28, fill: { color: "D8843C" }, line: { color: "F4F4F2", width: 1 } }); // hoop
const spots = [[cx + cw / 2 - 0.25, cy + ch - 0.9, "1"], [cx + 0.5, cy + 1.4, "2"], [cx + cw - 1.05, cy + 1.4, "3"], [cx + 1.3, cy + ch - 1.5, "4"], [cx + cw - 1.85, cy + ch - 1.5, "5"]];
spots.forEach(([x, y, n]) => numCircle(s, n, x, y, ORANGE, 0.5));
s.addText("5 players. Remember the numbers and where they stand.", { x: 0.7, y: 6.95, w: 11.9, h: 0.3, align: "center", fontFace: F, fontSize: 12, color: DIM, italic: true, margin: 0 });
s.addNotes("RUN IT: 'Lock in — 15 seconds. Don't type yet, just look.' Count down out loud, then ADVANCE to the next slide (blank court). They rebuild the positions in chat: 'Player 2 was top-left', etc. First to get all 5 right gets a shout-out (and a free spot next week if you want). This is the memory test — tie it back to how the brain stores patterns.");

// ═══ S10 · WHY THAT MATTERS (learning science) ════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "The learning-science bit", TEAL); title(s, "Why we just did that");
s.addText([
  { text: "Memory + pattern recognition is the engine of IQ.", options: { color: WHITE, fontSize: 24, bold: true, breakLine: true, paraSpaceAfter: 16 } },
  { text: "Every time your brain sees a pattern and stores it, you read the real game faster. That's not a gift — it's reps. The same way I've spent 10+ years helping people learn, we train your basketball brain like a muscle.", options: { color: MUTED, fontSize: 18, breakLine: true } },
], { x: 0.75, y: 2.3, w: 7.4, h: 3, valign: "top", fontFace: F, margin: 0, lineSpacing: 26 });
card(s, 8.5, 2.35, 4.1, 3.9, PANEL);
s.addText("SEE  →  STORE  →  READ  →  REACT", { x: 8.75, y: 2.6, w: 3.6, h: 0.6, align: "center", fontFace: F, fontSize: 14, color: TEAL, bold: true, charSpacing: 1, margin: 0 });
["See the pattern", "Store it (reps)", "Read it live", "React faster"].forEach((t, i) => {
  s.addText(t, { x: 8.9, y: 3.35 + i * 0.68, w: 3.3, h: 0.5, valign: "middle", fontFace: F, fontSize: 16, color: WHITE, bold: i === 3, margin: 0 });
});
s.addNotes("THIS IS YOUR EDGE — own it. Explain that you use real learning-development principles: chunking, repetition, pattern recognition. This is why parents of kids who learn differently should trust you. Don't rush it — 1-2 minutes.");

// ═══ S11 · SCAN DECIDE ACT ════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "The decision loop"); title(s, "Scan → Decide → Act");
const steps = [["SCAN", "Eyes up. Read the floor before the ball gets to you."], ["DECIDE", "Pick the best option — not the first one."], ["ACT", "Commit. No hesitation. Hesitation is the IQ killer."]];
steps.forEach((st, i) => {
  const x = 0.75 + i * 4.15;
  card(s, x, 2.6, 3.55, 3.3, i === 2 ? PANEL2 : PANEL);
  s.addText(st[0], { x: x + 0.3, y: 3.0, w: 3.0, h: 0.6, fontFace: F, fontSize: 26, color: ORANGE, bold: true, margin: 0 });
  s.addText(st[1], { x: x + 0.3, y: 3.75, w: 3.0, h: 1.9, fontFace: F, fontSize: 16, color: WHITE, margin: 0, lineSpacing: 22 });
  if (i < 2) s.addText("→", { x: x + 3.75, y: 3.6, w: 0.5, h: 0.9, align: "center", valign: "middle", fontFace: F, fontSize: 30, color: DIM, bold: true, margin: 0 });
});
s.addNotes("Walk the loop with a real example (a fast break, or a closeout). Emphasise ACT — smart but slow still loses. 1-2 minutes.");

// ═══ S12 · TALK = IQ ══════════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "IQ out loud"); title(s, "The smartest players talk");
s.addText("If nobody hears your IQ, it doesn't count. Communication IS intelligence on the floor.", { x: 0.75, y: 2.3, w: 11.8, h: 0.8, fontFace: F, fontSize: 19, color: MUTED, margin: 0, lineSpacing: 26 });
const calls = ["“Screen left!”", "“Help, help!”", "“Shot!”", "“I got ball!”", "“Switch!”", "“Yours!”"];
calls.forEach((c, i) => {
  const x = 0.75 + (i % 3) * 4.0, y = 3.4 + Math.floor(i / 3) * 1.5;
  card(s, x, y, 3.6, 1.2, PANEL);
  s.addText(c, { x: x, y: y, w: 3.6, h: 1.2, align: "center", valign: "middle", fontFace: F, fontSize: 22, color: WHITE, bold: true, margin: 0 });
});
s.addNotes("Fun one: get everyone to unmute and yell one call together. Loud = engaged. Tell them coaches notice talkers first. 1 minute.");

// ═══ S13 · QUICK POLL ═════════════════════════════════════════════════
s = p.addSlide(); base(s); pill(s, "⚡ Quick poll", ORANGE); tag(s, "UNC LIVE · IQ");
title(s, "This or that", 1.25);
const polls = [["Down 2, 10 seconds left:", "Drive to the rim  vs  kick for three?"], ["Loose ball on the floor:", "Dive for it  vs  stay on your feet?"], ["Fast break, 2-on-1:", "Take it yourself  vs  pass early?"]];
polls.forEach((q, i) => {
  const y = 2.35 + i * 1.45;
  card(s, 0.75, y, 11.8, 1.2, PANEL);
  s.addText(q[0], { x: 1.1, y: y + 0.18, w: 10.9, h: 0.4, fontFace: F, fontSize: 15, color: MUTED, bold: true, margin: 0 });
  s.addText(q[1], { x: 1.1, y: y + 0.55, w: 10.9, h: 0.5, fontFace: F, fontSize: 20, color: WHITE, bold: true, margin: 0 });
});
s.addNotes("Use a Zoom poll if you set one up, or just the chat: type A or B. There's no 'wrong' — the gold is asking WHY. Every answer is IQ in action. 2-3 minutes.");

// ═══ S14 · TAKEAWAYS ══════════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "Do these before next week"); title(s, "Your 3 takeaways");
const tk = ["Eyes up BEFORE you catch — scan the floor first, every time.", "Call one thing out loud, every single game. Just one.", "Watch 10 min of a pro who plays your position — study where they stand."];
tk.forEach((t, i) => {
  const y = 2.35 + i * 1.4;
  card(s, 0.75, y, 11.8, 1.15, PANEL);
  numCircle(s, i + 1, 1.05, y + 0.28, ORANGE, 0.6);
  s.addText(t, { x: 1.95, y: y, w: 10.3, h: 1.15, valign: "middle", fontFace: F, fontSize: 19, color: WHITE, bold: true, margin: 0 });
});
s.addText("Small reps. Every day. That's how IQ is built.", { x: 0.75, y: 6.75, w: 11.8, h: 0.4, align: "center", fontFace: F, fontSize: 16, color: ORANGE, bold: true, italic: true, margin: 0 });
s.addNotes("Slow down here — this is what they PAID for. Make them screenshot this slide. Say 'if you only remember one thing, do number one.' 1-2 minutes.");

// ═══ S15 · CHALLENGE + APP ════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "Keep it going all week"); title(s, "Your challenge");
s.addText("Do the 3 takeaways this week — then tell me how it went.", { x: 0.75, y: 2.25, w: 11.8, h: 0.6, fontFace: F, fontSize: 21, color: WHITE, bold: true, margin: 0 });
card(s, 0.75, 3.2, 11.8, 2.7, PANEL);
s.addText("Ask me anything in the app", { x: 1.2, y: 3.5, w: 10.9, h: 0.6, fontFace: F, fontSize: 22, color: ORANGE, bold: true, margin: 0 });
s.addText([
  { text: "Real questions → real answers from me. Anonymous if you want. Browse the Library of everything I've already answered.", options: { color: MUTED, fontSize: 17, breakLine: true, paraSpaceAfter: 12 } },
  { text: "uncthoughts.netlify.app", options: { color: WHITE, fontSize: 22, bold: true } },
], { x: 1.2, y: 4.2, w: 10.9, h: 1.5, fontFace: F, margin: 0, lineSpacing: 23 });
s.addNotes("Funnel them to the app — this is the ecosystem. Their questions there feed the community Library and keep you connected between sessions. Have the link ready to paste in the chat right now.");

// ═══ S16 · NEXT WEEK ══════════════════════════════════════════════════
s = p.addSlide(); base(s); tag(s, "UNC LIVE · IQ");
eyebrow(s, "You made it"); title(s, "That's the series — respect 🧡");
card(s, 0.75, 2.4, 5.75, 3.0, PANEL);
s.addText("WHAT'S NEXT", { x: 1.1, y: 2.7, w: 5, h: 0.4, fontFace: F, fontSize: 14, color: ORANGE, bold: true, charSpacing: 2, margin: 0 });
s.addText([
  { text: "Keep asking in the app.", options: { color: WHITE, fontSize: 19, bold: true, breakLine: true, paraSpaceAfter: 12 } },
  { text: "More UNC LIVE coming soon.", options: { color: WHITE, fontSize: 19, bold: true, breakLine: true, paraSpaceAfter: 12 } },
  { text: "You built real skills — now go use them.", options: { color: MUTED, fontSize: 15, italic: true } },
], { x: 1.1, y: 3.3, w: 5, h: 2, fontFace: F, margin: 0 });
card(s, 6.8, 2.4, 5.75, 3.0, PANEL2);
s.addText("THE FULL SERIES", { x: 7.15, y: 2.7, w: 5, h: 0.4, fontFace: F, fontSize: 14, color: TEAL, bold: true, charSpacing: 2, margin: 0 });
s.addText([
  { text: "🧠  Mindset", options: { color: WHITE, fontSize: 18, bold: true, breakLine: true, paraSpaceAfter: 8 } },
  { text: "🔒  Defence", options: { color: WHITE, fontSize: 18, bold: true, breakLine: true, paraSpaceAfter: 8 } },
  { text: "🍎  Nutrition", options: { color: WHITE, fontSize: 18, bold: true, breakLine: true, paraSpaceAfter: 8 } },
  { text: "🏀  Basketball IQ", options: { color: ORANGE, fontSize: 18, bold: true } },
], { x: 7.15, y: 3.25, w: 5, h: 2, fontFace: F, margin: 0 });
s.addText("Four weeks. Four skills. One complete player.", { x: 0.75, y: 5.7, w: 11.8, h: 0.5, align: "center", fontFace: F, fontSize: 17, color: WHITE, bold: true, margin: 0 });
s.addNotes("This is the send-off — make them feel it. They came through the whole series. Point them to the app to keep it going, and tease that more UNC LIVE is coming. If anyone's not on a season pass, now's the moment to mention the next series.");

// ═══ S17 · Q&A / CLOSE ════════════════════════════════════════════════
s = p.addSlide(); base(s);
s.addImage({ path: LOGO, x: 5.15, y: 0.55, w: 3.0, h: 3.0 });
s.addText("ASK UNC — YOUR Q&A", { x: 0.5, y: 3.7, w: 12.3, h: 0.7, align: "center", fontFace: F, fontSize: 34, color: WHITE, bold: true, margin: 0 });
s.addText("Unmute or drop it in the chat — nothing's off limits.", { x: 0.5, y: 4.5, w: 12.3, h: 0.5, align: "center", fontFace: F, fontSize: 18, color: MUTED, margin: 0 });
s.addText([
  { text: "Keep asking in the app  ·  ", options: { color: MUTED, fontSize: 16 } },
  { text: "uncthoughts.netlify.app", options: { color: ORANGE, fontSize: 16, bold: true } },
], { x: 0.5, y: 5.35, w: 12.3, h: 0.4, align: "center", fontFace: F, margin: 0 });
s.addText([
  { text: "@uncthoughts", options: { color: WHITE, fontSize: 16, bold: true } },
  { text: "     Rate tonight 1–5 in the chat before you go 🙏", options: { color: MUTED, fontSize: 16 } },
], { x: 0.5, y: 5.85, w: 12.3, h: 0.4, align: "center", fontFace: F, margin: 0 });
s.addText("Thank you for finishing the series with me. This is just the start. 🧡", { x: 0.5, y: 6.55, w: 12.3, h: 0.4, align: "center", fontFace: F, fontSize: 15, color: DIM, italic: true, margin: 0 });
s.addNotes("Leave real time for Q&A — this is where trust is built and where next week's questions come from. Ask for a 1-5 rating in the chat (your feedback loop). Thank them by name. End on energy, not a fade-out.");

p.writeFile({ fileName: __dirname + "/UNC-LIVE-Session-4-Basketball-IQ.pptx" }).then(f => console.log("WROTE", f));
