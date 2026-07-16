import type { LearningTopic } from "@/types";

/**
 * Learning Hub content. Educational summaries are intentionally practical and
 * strengths-based. External reference sections are placeholders in the demo.
 */
export const learningTopics: LearningTopic[] = [
  {
    slug: "autism",
    title: "Autism",
    emoji: "🧩",
    gradient: "from-sky-400 to-indigo-500",
    summary: "Understanding autistic experience: communication, sensory processing and strengths-based support.",
    minutes: 45,
    lessons: 8,
    progress: 75,
    overview:
      "Autism is a lifelong neurodevelopmental difference in how people experience the world, communicate and process sensory information. Autistic people are enormously diverse — the saying goes: if you've met one autistic person, you've met one autistic person. Great support starts with curiosity about the individual, not assumptions about the label.",
    practicalGuidance: [
      "Presume competence. Understanding usually outstrips expressive communication.",
      "Make the invisible visible: schedules, changes and expectations work best shown, not just said.",
      "Allow processing time after questions — silence is thinking, not ignoring.",
      "Treat special interests as bridges to connection and learning, never as bargaining chips.",
      "Behaviour is communication. Ask what the environment is doing before asking what the person is doing.",
    ],
    learningCards: [
      { title: "Sensory first", body: "Many escalations begin as sensory events. Check light, noise, crowding and clothing before anything else." },
      { title: "Transitions are cliffs", body: "Moving between activities is often the hardest moment of the day. Preview, countdown, and use visual cues." },
      { title: "Stimming is regulation", body: "Flapping, rocking and repeating phrases usually help a person stay regulated. Don't suppress what isn't harmful." },
      { title: "Masking has a cost", body: "Many autistic people camouflage to fit in. A calm home meltdown after a 'perfect' school day often means the day was exhausting, not fine." },
    ],
    scenarios: [
      {
        situation: "You arrive for a shift and the regular route to the park is closed for roadworks.",
        approach: "Pause before leaving. Show the change visually — a quick map sketch or photos. Offer two alternatives so the person keeps control. Build in extra time and expect the day to need a lighter plan.",
      },
      {
        situation: "A teenager stops using their AAC device mid-outing and covers their ears.",
        approach: "That's an early overwhelm signal, not defiance. Reduce your language to single words, move toward the pre-agreed quiet spot, and wait. Re-engage through the device only after regulation returns.",
      },
    ],
    references: ["Placeholder: national autism peak body", "Placeholder: AAC clinical guidelines", "Placeholder: sensory processing research summary"],
  },
  {
    slug: "cerebral-palsy",
    title: "Cerebral Palsy",
    emoji: "🌟",
    gradient: "from-rose-400 to-orange-400",
    summary: "Physical support, assistive technology and the golden rule: the person directs their own support.",
    minutes: 40,
    lessons: 7,
    progress: 40,
    overview:
      "Cerebral palsy (CP) is a group of lifelong conditions affecting movement and posture, caused by early brain development differences. CP affects every person differently — from subtle to significant physical support needs. Crucially: CP affects muscles, not intellect by default. Never infer someone's understanding from their speech or movement.",
    practicalGuidance: [
      "Speak to the person, at eye level, at their age — never to their support worker over their head.",
      "Ask before touching the person, their wheelchair or their equipment. The chair is personal space.",
      "Learn each person's communication method properly — eye-gaze, boards, devices — and wait for their words.",
      "Follow positioning and mealtime plans exactly; they prevent pain, pressure injuries and aspiration.",
      "Support choice and control: the person is the expert on their own body.",
    ],
    learningCards: [
      { title: "The wheelchair is not furniture", body: "Never lean on, move, or hang things from someone's wheelchair without permission. It's an extension of their body." },
      { title: "Pain is common, undertreated", body: "Chronic pain affects many adults with CP. Take reports seriously and watch for non-verbal pain signs." },
      { title: "Mealtime plans save lives", body: "Texture modifications and positioning rules aren't preferences — they prevent choking and aspiration pneumonia." },
      { title: "AT is a voice, not a gadget", body: "A communication device battery at 20% is urgent. Imagine your voice on 20% battery." },
    ],
    scenarios: [
      {
        situation: "At a café, the waiter asks you what the person you support would like to order.",
        approach: "Redirect warmly: 'She'll order for herself — give us a moment.' Position yourself out of the sightline, let them compose on their device, and let them own the interaction.",
      },
      {
        situation: "During lunch, the person coughs twice while eating.",
        approach: "Stop the meal calmly. Check positioning against the mealtime plan. Note exactly what was eaten and how. Report same-day — patterns of coughing at meals need speech pathology review.",
      },
    ],
    references: ["Placeholder: CP support organisation", "Placeholder: mealtime management guidelines", "Placeholder: pressure care standards"],
  },
  {
    slug: "down-syndrome",
    title: "Down Syndrome",
    emoji: "💛",
    gradient: "from-amber-400 to-yellow-500",
    summary: "Health literacy, clear communication and high expectations.",
    minutes: 30,
    lessons: 6,
    progress: 0,
    overview:
      "Down syndrome is a genetic condition associated with intellectual disability and some distinctive health considerations. People with Down syndrome study, work, create and lead rich lives — the strongest predictor of outcomes is the expectations and opportunities around them.",
    practicalGuidance: [
      "Use clear, concrete language and check understanding — don't infantilise.",
      "Support health appointments actively: several conditions (thyroid, hearing, heart, sleep apnoea) need regular review.",
      "Break new skills into small steps and celebrate each one.",
      "Watch for change: skills regression is never 'just the disability' and always warrants clinical review.",
      "Champion inclusion — real jobs, real friendships, real choices.",
    ],
    learningCards: [
      { title: "High expectations work", body: "Presume capability first. Adjust support based on evidence, not stereotype." },
      { title: "Health vigilance matters", body: "Annual health checks catch treatable conditions early — hearing and thyroid issues often masquerade as behaviour change." },
      { title: "Concrete beats abstract", body: "Demonstrations, photos and doing-together teach better than verbal explanations alone." },
    ],
    scenarios: [
      {
        situation: "A person who loved their supermarket job starts refusing to go, seeming withdrawn.",
        approach: "Rule out health first — hearing, thyroid, pain, sleep. Then investigate the workplace: a changed roster, a departed workmate or a new noisy machine can all be the real story. Behaviour change is data.",
      },
    ],
    references: ["Placeholder: Down syndrome association", "Placeholder: annual health check guidelines"],
  },
  {
    slug: "intellectual-disability",
    title: "Intellectual Disability",
    emoji: "🌱",
    gradient: "from-emerald-400 to-green-500",
    summary: "Dignity of risk, skill-building and communication that respects adulthood.",
    minutes: 35,
    lessons: 6,
    progress: 10,
    overview:
      "Intellectual disability affects learning, reasoning and adaptive skills — it does not affect the human need for purpose, relationships and choice. The core skill for supporters is calibrating: enough support to succeed, never so much that it replaces the person's own capability.",
    practicalGuidance: [
      "Do with, not for. Every task done 'for' someone is a learning opportunity spent.",
      "Honour dignity of risk — adults are entitled to make choices others might not make.",
      "Give information in accessible formats: plain language, pictures, real examples.",
      "Allow much more time for decisions and never pressure a quick answer.",
      "Adapt tasks, not expectations, for the life the person wants.",
    ],
    learningCards: [
      { title: "The least-support rule", body: "Always try the least intrusive support first: gesture before words, words before demonstration, demonstration before hand-over-hand." },
      { title: "Consent is ongoing", body: "Check in continuously. Yes to a plan yesterday isn't yes today." },
      { title: "Teach in the real place", body: "Skills learned in real kitchens, real shops and real buses stick. Simulated settings transfer poorly." },
    ],
    scenarios: [
      {
        situation: "A person wants to spend most of their weekly budget on concert tickets.",
        approach: "This is dignity of risk in action. Support them to see the trade-offs concretely (what's left for the week, in real terms), explore options — and then respect the decision. A budgeting lesson from a real choice beats a hundred worksheets.",
      },
    ],
    references: ["Placeholder: supported decision-making framework", "Placeholder: easy-read resource library"],
  },
  {
    slug: "acquired-brain-injury",
    title: "Acquired Brain Injury",
    emoji: "🧠",
    gradient: "from-violet-400 to-purple-500",
    summary: "Fatigue, memory and identity — supporting the person someone is now, and the one they remember being.",
    minutes: 40,
    lessons: 7,
    progress: 60,
    overview:
      "An acquired brain injury (ABI) is damage to the brain after birth — from trauma, stroke, hypoxia, infection or illness. ABI often creates an 'invisible disability': the person looks unchanged while living with profound changes in fatigue, memory, emotional regulation and identity. Grief for the pre-injury self is real and deserves respect.",
    practicalGuidance: [
      "Take cognitive fatigue seriously — it's neurological, not motivational. Plan demanding tasks early.",
      "Build external memory systems: phones, whiteboards, photos, routines. Consistency is everything.",
      "One instruction at a time. Write down anything with steps.",
      "Expect grief and frustration; acknowledge it rather than rushing to silver linings.",
      "Measure against last month, not against the pre-injury person.",
    ],
    learningCards: [
      { title: "The fatigue wall is real", body: "Cognitive fatigue arrives suddenly and cascades. Respect the person's early-warning language and adjust the plan without drama." },
      { title: "Memory ≠ intelligence", body: "Forgetting the plan doesn't mean not caring about it. Externalise memory and stop re-testing it." },
      { title: "Identity work is support work", body: "Reconnecting with pre-injury passions — adapted — is often the most powerful goal on the plan." },
    ],
    scenarios: [
      {
        situation: "Mid-afternoon, the person becomes irritable and calls themselves 'useless' after forgetting a step in a task they used to do professionally.",
        approach: "Lower demands immediately — the fatigue wall has landed on top of grief. Acknowledge plainly ('this is the hard part'), don't problem-solve tonight, and revisit in the morning when capacity returns. Log the time of day; patterns inform pacing plans.",
      },
    ],
    references: ["Placeholder: brain injury association", "Placeholder: fatigue management clinical guide"],
  },
  {
    slug: "adhd",
    title: "ADHD",
    emoji: "⚡",
    gradient: "from-orange-400 to-red-400",
    summary: "Executive function, interest-driven attention and designing environments that work with the brain.",
    minutes: 25,
    lessons: 5,
    progress: 0,
    overview:
      "ADHD is a neurodevelopmental difference in attention regulation, impulse control and executive function. The ADHD brain isn't short of attention — it allocates it by interest, urgency and novelty rather than importance. Support that fights this loses; support that designs around it wins.",
    practicalGuidance: [
      "Externalise executive function: visible timers, checklists, body-doubling.",
      "Break tasks to the 'next physical action', not the project.",
      "Use interest and urgency as fuel — gamify, race the timer, pair boring tasks with engaging ones.",
      "Never shame lateness or forgetfulness; build systems instead.",
      "Movement is medicine — build it into the day, don't schedule it out.",
    ],
    learningCards: [
      { title: "Out of sight, out of existence", body: "ADHD memory is visual and environmental. Important things live where they'll be seen, not in drawers." },
      { title: "Transitions burn fuel", body: "Task-switching costs are enormous. Batch similar activities and protect hyperfocus when it's working." },
      { title: "The wall of awful", body: "Repeated failure builds emotional barriers to simple tasks. Lower the barrier, don't raise the pressure." },
    ],
    scenarios: [
      {
        situation: "Someone keeps abandoning their laundry mid-cycle and getting distressed about 'failing at basic adulting'.",
        approach: "Design, don't lecture: a loud timer that travels with them, laundry paired with a favourite podcast (only-while-folding rule), and one basket instead of a multi-step sorting system. Celebrate the system working, not willpower.",
      },
    ],
    references: ["Placeholder: ADHD professional association", "Placeholder: executive function strategies guide"],
  },
  {
    slug: "aac",
    title: "AAC — Augmentative & Alternative Communication",
    emoji: "💬",
    gradient: "from-cyan-400 to-blue-500",
    summary: "Devices, boards, signs and the etiquette of listening to non-speaking voices.",
    minutes: 35,
    lessons: 6,
    progress: 85,
    overview:
      "AAC covers every way people communicate beyond speech: picture boards, sign, gesture, speech-generating devices and eye-gaze systems. AAC users are communicating constantly — the question is whether the people around them are listening. Access to AAC is access to a voice; treat it with the same gravity.",
    practicalGuidance: [
      "Presume competence. Model language on the device without demanding performance.",
      "WAIT. Composition takes time. Never finish sentences or guess ahead.",
      "The device is always available — never out of reach, never removed as a consequence.",
      "Keep devices charged like they're life support for communication — because they are.",
      "Respond to all communication attempts: gesture, vocalisation, eye-gaze, behaviour.",
    ],
    learningCards: [
      { title: "Silence is composing", body: "12 words a minute is a common AAC rate. Your patience is the accessibility feature." },
      { title: "Model, don't test", body: "Use the person's device yourself to show language ('we're going OUT'). Avoid quizzing ('show me the dog!')." },
      { title: "Multi-modal is normal", body: "A person might sign, vocalise, gesture AND use a device in one conversation. All of it counts." },
    ],
    scenarios: [
      {
        situation: "In a group conversation, people keep moving on before the AAC user finishes composing their contribution.",
        approach: "Hold the floor for them: 'Hang on — Ava's got something coming.' Then genuinely wait. Afterwards, talk with the group about pacing. The conversation should adapt to include the person, never the reverse.",
      },
    ],
    references: ["Placeholder: AAC clinical body", "Placeholder: communication access standards"],
  },
  {
    slug: "sensory-processing",
    title: "Sensory Processing",
    emoji: "🎧",
    gradient: "from-teal-400 to-emerald-500",
    summary: "Reading sensory signals, designing calmer environments and supporting regulation.",
    minutes: 30,
    lessons: 5,
    progress: 30,
    overview:
      "Everyone processes sensory information differently; for many people with disability the differences are intense enough to shape every day. Sensory sensitivity (too much, too bright, too loud) and sensory seeking (craving movement, pressure, texture) often co-exist in one person. Environments — not people — are usually what need fixing.",
    practicalGuidance: [
      "Learn each person's profile: what overwhelms, what regulates, what they seek.",
      "Audit environments before activities: light, noise, crowds, smells, seating.",
      "Watch for early signals — going quiet, fidgeting, ear-covering — and act early.",
      "Offer regulation tools proactively, not as a last resort.",
      "After overwhelm, allow full recovery time. Rushing back guarantees a repeat.",
    ],
    learningCards: [
      { title: "The sensory cup", body: "Sensory load accumulates all day. The supermarket meltdown at 4pm started filling at breakfast." },
      { title: "Seek and avoid coexist", body: "The same person can crave deep pressure and be overwhelmed by light touch. Profiles beat assumptions." },
      { title: "Environment first", body: "Before any behaviour plan, ask: what would make this room easier to be in?" },
    ],
    scenarios: [
      {
        situation: "A person starts rocking and humming loudly in a busy waiting room.",
        approach: "That's regulation, not a problem — the environment is the problem. Ask staff for a quieter spot or wait outside with a buzzer. Offer their preferred tools. Advocate for the first appointment of the day next time.",
      },
    ],
    references: ["Placeholder: OT sensory integration resources", "Placeholder: sensory-friendly venue directory"],
  },
  {
    slug: "positive-behaviour-support",
    title: "Positive Behaviour Support",
    emoji: "🌈",
    gradient: "from-pink-400 to-rose-500",
    summary: "Understanding behaviour as communication and building lives where challenging behaviour isn't needed.",
    minutes: 50,
    lessons: 9,
    progress: 55,
    overview:
      "Positive Behaviour Support (PBS) is an evidence-based framework that treats behaviours of concern as communication about unmet needs. PBS looks for the function behind behaviour — escape, connection, sensory needs, tangibles — and changes environments, skills and responses so the behaviour becomes unnecessary. Its goal is quality of life, never compliance.",
    practicalGuidance: [
      "Always ask 'what is this behaviour achieving for the person?' before 'how do we stop it?'",
      "Invest in the green zone: most PBS work happens when everything is calm.",
      "Teach replacement skills that meet the same need more easily.",
      "Record objectively: what happened before, during, after — free of judgement words.",
      "Restrictive practices are a last resort, heavily regulated, and always paired with a reduction plan.",
    ],
    learningCards: [
      { title: "Function over form", body: "Two identical behaviours can have opposite functions. Hitting to escape noise ≠ hitting to get attention. The response must match the function." },
      { title: "The iceberg", body: "The visible behaviour is the tip. Below the surface: pain, sensory load, communication barriers, boredom, grief, fear." },
      { title: "Escalation has stages", body: "Anxiety → agitation → escalation → recovery. The earlier the stage, the more effective (and gentler) the support." },
      { title: "Recovery is fragile", body: "Post-incident, the person is depleted, not 'fine now'. No debriefs, no demands, no lessons — just safety and calm." },
    ],
    scenarios: [
      {
        situation: "Every day at 11:50am, a person tips their chair and shouts, and is then taken for an early lunch.",
        approach: "The behaviour works — it reliably produces early lunch. PBS response: honour the need (hunger at 11:50 is legitimate), move lunch earlier or teach an easier signal (a 'lunch please' card), and respond to that signal instantly so it out-competes the old behaviour.",
      },
    ],
    references: ["Placeholder: PBS capability framework", "Placeholder: restrictive practices regulations"],
  },
  {
    slug: "supported-decision-making",
    title: "Supported Decision Making",
    emoji: "🤝",
    gradient: "from-indigo-400 to-violet-500",
    summary: "Every person has the right to make decisions about their own life — with support, not substitution.",
    minutes: 30,
    lessons: 5,
    progress: 20,
    overview:
      "Supported decision making means providing whatever assistance a person needs to make their own decisions — rather than having others decide 'in their best interests'. It's a legal and human-rights shift: from substitute decision-making toward supported autonomy. The presumption is always capacity, with support tailored to each decision.",
    practicalGuidance: [
      "Presume capacity for every decision, every time — capacity is decision-specific, not global.",
      "Provide information in the person's best format: plain language, pictures, lived examples, trusted explainers.",
      "Give real options, real consequences, real time. Rushed consent isn't consent.",
      "Separate 'unwise' from 'incapable' — adults are allowed decisions others disagree with.",
      "Record how the person was supported to decide, not just what was decided.",
    ],
    learningCards: [
      { title: "Will and preference", body: "The standard isn't 'best interests' — it's the person's own will and preferences, found through whatever communication works." },
      { title: "Capacity fluctuates", body: "Fatigue, medication, time of day and stress all affect decision-making. Pick the moment as carefully as the words." },
      { title: "Risk is a right", body: "Dignity of risk means supported exposure to life's normal chances — not wrapped-in-cotton-wool safety." },
    ],
    scenarios: [
      {
        situation: "A person wants to move out of the family home; their parents believe they aren't ready and ask staff to 'talk them out of it'.",
        approach: "Your duty is to the person's will and preference. Support them to explore what moving involves — visits, trial stays, budgeting with real numbers — and to communicate their decision to family. Facilitate the family conversation; never become the instrument of someone else's preference.",
      },
    ],
    references: ["Placeholder: supported decision-making legal framework", "Placeholder: capacity assessment guidance"],
  },
];

export function getTopic(slug: string): LearningTopic | undefined {
  return learningTopics.find((t) => t.slug === slug);
}
