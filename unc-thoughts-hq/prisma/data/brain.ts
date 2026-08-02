// Unk's Brain — starter knowledge, seeded as APPROVED so Ask Unk works on day
// one, and fully owner-editable in /brain. Voice: experienced uncle — direct,
// calm, practical, honest about uncertainty, never preachy.
//
// Playbook bodies use labelled sections the composer parses:
//   DO NOW: / FOOD: / MINDSET: / CAREFUL: / PRIVATE: / WHY:
// Nutrition items are GENERAL EDUCATION aligned with AIS guidance — flexible
// examples, no calorie targets, no guarantees, no supplements for juniors.
// reviewed:false = source link could not be re-verified from the build
// environment; the Brain UI badges it for the owner to confirm.

export type BrainSeed = {
  kind: string;
  title: string;
  pillar: string;
  audience?: string;
  body: string;
  tags: string[];
  source?: string;
  sourceUrl?: string;
  safetyClass?: string;
  reviewed?: boolean;
};

const AIS_NUTRITION = { source: "Australian Institute of Sport — Nutrition", sourceUrl: "https://www.ais.gov.au/nutrition", reviewed: true };
const AIS_SUPPS = { source: "Australian Institute of Sport — Supplements", sourceUrl: "https://www.ais.gov.au/supplements", reviewed: true };
const EAT_FOR_HEALTH = { source: "Australian Dietary Guidelines — Eat for Health", sourceUrl: "https://www.eatforhealth.gov.au", reviewed: false };

export const BRAIN_ITEMS: BrainSeed[] = [
  // ── Game day playbooks by time band ────────────────────────────────
  {
    kind: "playbook",
    title: "Game day — 3+ hours out",
    pillar: "Nutrition",
    tags: ["intent:game_day", "band:3h+", "game", "meal"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Eat your main pre-game meal in the next hour, then forget about food and get your gear sorted — bag, boots, bottle, uniform.
FOOD: A normal, familiar meal built on carbs — something like pasta, rice with chicken, sandwiches, or potatoes and eggs — plus water. Nothing fancy. The meal you've played well on before.
MINDSET: Games are won by boring preparation. Do the boring things well.
CAREFUL: Don't experiment today. New foods, big greasy meals or "special" game-day products are how you end up heavy-legged or in the toilet at warm-up.
PRIVATE: What did you eat before the last game you played really well? Why not that again today?
WHY: With 3+ hours, there's time to digest a proper meal, so your muscles are topped up with fuel by tip-off. AIS guidance on fuelling around exercise is built on this: familiar carbohydrate-based meals a few hours out, fluids across the day, nothing new on game day.`,
  },
  {
    kind: "playbook",
    title: "Game day — 2–3 hours out",
    pillar: "Nutrition",
    tags: ["intent:game_day", "band:2-3h", "game", "meal"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: If you haven't eaten a proper meal yet, eat now — this is the deadline for a full meal. Then pack your bag and drink a glass of water.
FOOD: A familiar carb-based meal, medium size — rice or pasta with a bit of protein, or a couple of sandwiches and a banana. Water with it.
MINDSET: You can't rush digestion and you can't rush confidence. Both get built early.
CAREFUL: Going too big this close to a game backfires. Medium meal now beats a huge one you'll still feel at tip-off.
PRIVATE: Is your bag actually packed — or are you planning to do it in a rush and forget something?
WHY: Two to three hours is enough to digest a medium familiar meal. Any later and big meals start competing with your legs for blood flow. That's why the window matters more than the exact minute.`,
  },
  {
    kind: "playbook",
    title: "Game day — 1–2 hours out",
    pillar: "Nutrition",
    tags: ["intent:game_day", "band:1-2h", "game", "snack"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Have a light snack if you're hungry, sip water, and lay out your gear so the next hour is calm, not a scramble.
FOOD: Something light and familiar: a banana, yoghurt, toast with honey or jam, a plain cereal bar, or fruit. Water — steady sips, not a litre in one go.
MINDSET: Calm is a skill. Slow hands packing the bag, slow breath on the drive.
CAREFUL: The window for a full meal has closed. Big or greasy food now will still be sitting there during warm-up.
PRIVATE: What's the one thing you'll focus on in your first two minutes on court — that has nothing to do with the scoreboard?
WHY: Light carbohydrate snacks top up fuel without loading your gut close to game time — the standard AIS approach to eating close to exercise. The gear-and-calm routine is Unk's: rushed players play rushed.`,
  },
  {
    kind: "playbook",
    title: "Game day — 30–60 minutes out",
    pillar: "Nutrition",
    tags: ["intent:game_day", "band:30-60m", "game"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Small top-up only if you need it, get your boots on early, and start switching on — light movement, not sitting in a heap.
FOOD: Only if genuinely hungry: half a banana or a couple of plain crackers. Otherwise just steady sips of water.
MINDSET: Pick ONE job for the first quarter. One. Say it to yourself while you lace up.
CAREFUL: This is not the time to eat much, and definitely not the time for anything new or fizzy.
PRIVATE: What's your one job for the first quarter? Not three things. One.
WHY: Under an hour out, digestion takes a back seat — small familiar top-ups and fluids are all the AIS-style guidance supports here. The one-job cue keeps a busy mind pointed at something you control.`,
  },
  {
    kind: "playbook",
    title: "Game day — under 30 minutes",
    pillar: "Mindset",
    tags: ["intent:game_day", "intent:quick_prep", "band:<30m", "game", "warm-up"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Warm up properly — actually sweat a little. Then find the ball early: catch, pass, one dribble combo, a few shots inside your range.
FOOD: Nothing now except sips of water. You're running on what you've already eaten — that decision's been made.
MINDSET: First touch, first sprint, first contact. Win those three and the game opens up.
CAREFUL: Don't stand around getting cold and don't force up wild shots in warm-up — groove easy makes instead.
PRIVATE: Be honest — did you prepare today, or are you hoping? Either answer is fine. Just know which one it is.
WHY: This close in, food can't help you but a real warm-up absolutely can. The three-firsts cue works because they're all effort-based — you control every one of them regardless of the scoreboard.`,
  },
  {
    kind: "playbook",
    title: "After the game — the next 60–90 minutes",
    pillar: "Nutrition",
    tags: ["intent:game_day", "intent:recovery", "band:after", "recovery", "after"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Drink water, get something with carbs and protein into you within the next hour or so, and get out of your wet gear.
FOOD: Doesn't need to be perfect — flexible options like a chicken or ham sandwich, flavoured milk, yoghurt and fruit, or just getting home to a normal dinner. Fluids first if it was a hot one.
MINDSET: One thing you did well, one thing to work on. Name both, then leave the game alone.
CAREFUL: Skipping food after a late game because you "can't be bothered" is how tomorrow feels rubbish. Something simple beats nothing.
PRIVATE: What's the ONE thing from tonight you'd want back? Not five things. One.
WHY: Recovery eating is about refuelling (carbs), repair (protein) and rehydration — AIS recovery basics. The one-up-one-down review is Unk's rule so the car ride home never becomes a court hearing.`,
  },

  // ── Training playbooks ─────────────────────────────────────────────
  {
    kind: "playbook",
    title: "Before training — an hour or more out",
    pillar: "Nutrition",
    tags: ["intent:training_before", "band:3h+", "band:2-3h", "band:1-2h", "training", "snack"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Eat something sensible now, fill your bottle, and decide what you're working on at training before you get there.
FOOD: With a couple of hours: a normal meal. With about an hour: something lighter — banana, toast with jam, yoghurt, a sandwich. Familiar beats fancy, every time.
MINDSET: Go to training with a plan or you're just attending. One skill, measured.
CAREFUL: Training hungry is a wasted session; training stuffed is a slow one. Aim between.
PRIVATE: What exactly are you working on tonight? "Getting better" doesn't count — name the skill.
WHY: Fuelling before training follows the same AIS logic as games: familiar carbs sized to the time available. The plan question exists because effort without direction is just sweat.`,
  },
  {
    kind: "playbook",
    title: "Before training — less than an hour",
    pillar: "Nutrition",
    tags: ["intent:training_before", "band:30-60m", "band:<30m", "training"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Small top-up only if you're properly hungry, bottle filled, get there early enough to touch a ball before it starts.
FOOD: A banana, a few crackers, or nothing but water if you ate earlier. Keep it small and familiar this close.
MINDSET: First ten minutes set your standard for the session. Arrive switched on.
CAREFUL: A big feed now will still be with you during the first drill. Small or nothing.
PRIVATE: Are you turning up to train, or turning up to be seen training? Only you know.
WHY: Close to a session, small familiar snacks and fluids are the safe play — same fuelling-window principle the AIS teaches. The early-arrival habit is free skill development nobody notices until it shows.`,
  },
  {
    kind: "playbook",
    title: "After training — recovery basics",
    pillar: "Nutrition",
    tags: ["intent:recovery", "band:after", "recovery", "training", "after"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Water first. Then food with carbs and some protein within the next hour or so. Then the least glamorous weapon in sport: an early night.
FOOD: Flexible and real: dinner if it's dinner time, or a sandwich, yoghurt and fruit, or milk. If it was hot or you sweated buckets, keep the fluids coming into the evening.
MINDSET: You don't get better at training. You get better recovering FROM training. Sleep is where the deposit clears.
CAREFUL: Late-night junk scrolling steals the sleep that makes training actually count. One episode, then done.
PRIVATE: What time are the lights actually going out tonight? Say the number.
WHY: Refuel, repair, rehydrate, sleep — that's the AIS recovery picture in four words. None of it is exciting, all of it compounds.`,
  },

  // ── Mindset playbooks ──────────────────────────────────────────────
  {
    kind: "playbook",
    title: "Made a mistake — the next-play reset",
    pillar: "Mindset",
    tags: ["intent:mistake_reset", "mistake", "reset", "turnover"],
    body: `DO NOW: One breath. One physical reset — tap the floor, snap the wristband, squeeze the ball. Then get your eyes up and find your next job: sprint back, find your man, set the screen.
MINDSET: The mistake is over. It exists in the past and you don't play there. Your only move is the next play.
CAREFUL: The second mistake is the dangerous one — it comes from still thinking about the first. That's the whole trap.
PRIVATE: When you stuffed up last game, how long did you carry it? Honestly — seconds, minutes, or the whole game?
WHY: A physical cue works better than self-talk because your body listens faster than your brain argues. Every good player you rate has a reset; most just never told you about it.`,
  },
  {
    kind: "playbook",
    title: "Feeling flat — find one gear, not ten",
    pillar: "Mindset",
    tags: ["intent:mindset_flat", "flat", "tired", "energy", "nervous"],
    body: `DO NOW: Stop waiting to feel good. Pick the smallest useful action — fill your bottle, put your boots on, do one lap, one stretch. Motion first, mood second.
FOOD: If you haven't eaten in 4+ hours, that's probably half the problem. Something simple: fruit, toast, yoghurt. And water — flat and dehydrated feel identical.
MINDSET: You don't need to feel great to do your job. Effort is available on flat days too — that's what makes it valuable.
CAREFUL: Don't confuse flat with unwell. Genuinely sick or dizzy is a rest-and-tell-someone day, not a push-through day.
PRIVATE: Flat because you're tired — or flat because you're avoiding something? Different problems, different fixes. Which is it today?
WHY: Waiting for motivation is a losing game; action generates it more reliably than the other way around. The food line is there because "I feel flat" is very often "I haven't eaten".`,
  },
  {
    kind: "playbook",
    title: "Five minutes — the minimum standard",
    pillar: "Mindset",
    tags: ["intent:quick_prep", "band:<30m", "five", "minutes", "quick"],
    body: `DO NOW: Fill your bottle. Pack the three things that matter: boots, uniform, water. Then sixty seconds with your eyes closed: first touch, first sprint, one job.
FOOD: No time for real food to help now — a few sips of water is the play. Eat properly afterwards.
MINDSET: Five minutes of deliberate beats an hour of scattered. This IS preparation — just the small version.
CAREFUL: Don't sprint out the door instead of walking out prepared. The two minutes you save aren't worth the forgotten mouthguard.
PRIVATE: What's the thing you always forget? Name it — then go put it in the bag right now.
WHY: Under time pressure, routines beat decisions. Bottle-bag-one-job is small enough to run on autopilot, which is exactly what a rushed brain needs.`,
  },

  // ── General nutrition education ────────────────────────────────────
  {
    kind: "nutrition",
    title: "What should I eat? The simple plate",
    pillar: "Nutrition",
    tags: ["intent:nutrition", "eat", "meal", "plate", "food"],
    safetyClass: "nutrition",
    ...EAT_FOR_HEALTH,
    body: `DO NOW: Build the boring plate: carbs for fuel (rice, pasta, bread, potato), protein for repair (chicken, eggs, beef, fish, beans), colour on the side (vegetables or fruit), water to drink.
FOOD: That pattern, most meals, most days. Around training and games, lean a bit more on the carbs. No foods are "banned" — it's about what shows up most often.
MINDSET: Eating well isn't a personality. It's just fuel done consistently.
CAREFUL: This is general education, not a personal plan. Allergies, medical conditions or big questions belong with a parent or guardian and a doctor or Accredited Sports Dietitian.
PRIVATE: What does your usual plate actually look like? Not the ideal one — the real one.
WHY: The pattern mirrors the Australian Dietary Guidelines: mostly whole foods across the food groups, water as the main drink. For a growing athlete the differences are timing and a little more fuel — not magic foods.`,
  },
  {
    kind: "faq",
    title: "Water — the unglamorous edge",
    pillar: "Nutrition",
    tags: ["intent:nutrition", "water", "drink", "hydration", "fluids"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Fill a bottle and keep it where you'll trip over it. Sip across the day, a bit more around training, more again in the heat.
FOOD: Water covers almost everyone for normal training. Sports drinks are for long, hot, hard sessions — not a Tuesday shoot-around.
CAREFUL: Energy drinks are a no for juniors — they're caffeine in a party outfit, not hydration.
PRIVATE: Where's your water bottle right now? If you don't know, that's the answer.
WHY: Even mild dehydration drags on how training feels. Sipping through the day beats trying to fix it in the last hour — that's the boring, correct AIS-style answer.`,
  },
  {
    kind: "teaching_note",
    title: "The familiar-food rule",
    pillar: "Nutrition",
    tags: ["intent:nutrition", "intent:game_day", "familiar", "new", "experiment"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `DO NOW: Before games and hard sessions, eat things your body already knows. Test anything new on a normal day, never a game day.
CAREFUL: This rule has no exceptions worth making. New pre-game food is a gamble where the prize is nothing and the loss is your whole game.
PRIVATE: What's your proven pre-game meal? If you can't name one, that's this week's experiment — on a training day.
WHY: Digestion under nerves is already harder. Familiar food removes one variable on the day you least need surprises — a cornerstone of every credible sports-nutrition playbook, AIS included.`,
  },

  // ── Mindset principles (lessons) ───────────────────────────────────
  {
    kind: "lesson",
    title: "Control the controllables",
    pillar: "Mindset",
    tags: ["intent:mindset_flat", "intent:mistake_reset", "control", "effort", "attitude"],
    body: `MINDSET: You control four things: your effort, your attitude, your preparation and your next action. Refs, teammates, bounces and selections didn't make the list. Spend your energy inside the list.
PRIVATE: Which thing OUTSIDE your control took the most of your energy this week?
WHY: Energy spent on uncontrollables is subtracted from the controllables — it's a straight trade, and it always loses. The list keeps you honest about where the leaks are.`,
  },
  {
    kind: "lesson",
    title: "Standards beat moods",
    pillar: "Mindset",
    tags: ["intent:mindset_flat", "standards", "consistency", "habits"],
    body: `MINDSET: A standard is what you do on the days you don't feel like it. That's the whole definition. Feel-good days take care of themselves.
PRIVATE: What's one standard you hold even on your worst day? If there isn't one yet — what should it be?
WHY: Moods are weather; standards are climate. Players get remembered for their climate.`,
  },

  // ── Owner-facing source links ──────────────────────────────────────
  {
    kind: "source_link",
    title: "AIS — Sports nutrition resources",
    pillar: "Nutrition",
    tags: ["source", "ais"],
    safetyClass: "nutrition",
    ...AIS_NUTRITION,
    body: `WHY: Primary reference for fuelling around training and games, hydration and recovery. Owner: review seasonally and after any AIS update.`,
  },
  {
    kind: "source_link",
    title: "AIS — Supplement framework (position for juniors)",
    pillar: "Nutrition",
    tags: ["source", "ais", "supplements"],
    safetyClass: "nutrition",
    ...AIS_SUPPS,
    body: `WHY: Basis for the app's supplement stance: no supplements recommended to juniors, no individual protocols, involve a sports doctor or Accredited Sports Dietitian because safety, effectiveness and eligibility all matter.`,
  },
  {
    kind: "source_link",
    title: "Australian Dietary Guidelines — Eat for Health",
    pillar: "Nutrition",
    tags: ["source", "guidelines"],
    safetyClass: "nutrition",
    ...EAT_FOR_HEALTH,
    body: `WHY: Basis for general "simple plate" education. Link not re-verified from the build environment — owner to open and confirm, then mark reviewed.`,
  },
];

// Thought of the Day bank — rotates by date. Each carries suggested one-actions.
export const THOUGHT_PROMPTS: Array<{ text: string; pillar: string; actions: string[] }> = [
  { text: "What's one thing you did this week because it was easy, not because it was right?", pillar: "Mindset", actions: ["Do the harder version once tomorrow", "Tell someone what you're changing", "Write down the right version"] },
  { text: "Who on your team gets none of the credit and a lot of the work? What could you say to them?", pillar: "Community", actions: ["Say it to them this week", "Do their unglamorous job once", "Nothing — just notice it every session"] },
  { text: "What did you eat before your best game this month? And before your worst?", pillar: "Nutrition", actions: ["Repeat the good one next game", "Write both down", "Ask a parent to help plan it"] },
  { text: "When the coach corrects you, what's your face doing?", pillar: "Mindset", actions: ["Nod and try it immediately next time", "Ask one follow-up question", "Thank them after training once"] },
  { text: "What's the skill you avoid practising because you're bad at it?", pillar: "Basketball", actions: ["Give it the first 5 minutes of practice", "Do it 20 times before anything fun", "Ask someone better to watch you once"] },
  { text: "How many hours of sleep did you actually get last night — and what stole the rest?", pillar: "Mindset", actions: ["Phone outside the room tonight", "Set a lights-out time and hit it", "Same bedtime three nights straight"] },
  { text: "If your effort at training was filmed with no sound, what would it say about you?", pillar: "Mindset", actions: ["First to every drill next session", "Sprint the transitions once", "Pick one drill to go 100% in"] },
  { text: "What's one thing your parents or guardian do that makes your basketball possible?", pillar: "Community", actions: ["Thank them today, specifically", "Pack your own bag this week", "Be ready 5 minutes early next game"] },
  { text: "Last game, did you talk on defence — or just think about talking?", pillar: "Basketball", actions: ["Call every screen next game", "Be the loudest in one drill", "Ask a teammate if they can hear you"] },
  { text: "What's the excuse you reach for most often?", pillar: "Mindset", actions: ["Catch it once tomorrow and say the truth instead", "Tell someone your excuse so it loses power", "Write it on your bag tag"] },
  { text: "Is your water bottle a habit or a decoration?", pillar: "Nutrition", actions: ["Fill it before you leave, every time", "Finish it by end of training", "Put it with your boots tonight"] },
  { text: "What would the player you want to become do tonight — in the next hour?", pillar: "Mindset", actions: ["Do exactly that for 20 minutes", "Write one sentence about them", "Go to bed like they would"] },
];
