import type { RecordingType } from "./enums";

// Static coaching reference — the Recording Studio, Speaking Coach and Preflight
// read from here. Kept as data (not prose in components) so it can be surfaced,
// tested and exported. Sources for technical claims live in the Research Library.

export type RecordingGuide = {
  type: RecordingType;
  quickSetup: string[];
  proSetup: string[];
  shotList: string[];
  cameraPosition: string;
  lighting: string;
  audio: string;
  structure: string[];
  mistakes: string[];
  safety: string[];
  preflight: string[];
};

export const RECORDING_GUIDES: RecordingGuide[] = [
  {
    type: "Face-to-camera",
    quickSetup: ["Phone vertical, propped at eye level", "Face a window for soft light", "Notifications off / Do Not Disturb"],
    proSetup: ["Tripod at eye level", "Key light 45° soft, small fill opposite", "External/lav mic within ~30cm", "Plain, uncluttered background"],
    shotList: ["One clean take, front-on", "Optional close-up for the key line"],
    cameraPosition: "Eye level, arm's length. Lens at your eyeline so you look INTO it, not down.",
    lighting: "Soft light on your face, source in front. Never sit with a bright window behind you (backlighting hides your face).",
    audio: "Get the mic close (RØDE: proximity is the key). Turn off Automatic Gain Control; aim peaks near -10dB.",
    structure: ["Hook (first second)", "Answer", "One example", "One action", "One real question"],
    mistakes: ["Long intro ('hey guys…')", "Looking at your own image not the lens", "Talking too slow", "Too many ideas in one Reel"],
    safety: ["No private info on screen (address, docs)", "Check the background for anything personal"],
    preflight: ["Vertical 9:16", "Hook lands in the first second", "One idea only", "Ends on a question"],
  },
  {
    type: "Basketball demonstration",
    quickSetup: ["Phone vertical on the ground or a bag, stable", "Frame the whole move", "Film with the sun/light in front of you"],
    proSetup: ["Tripod, rear camera", "Second angle for the key rep", "Windshield on the mic outdoors", "Mark your spot with tape"],
    shotList: ["Wide: whole move", "Tight: hands/feet detail", "Slow-mo option for the rep"],
    cameraPosition: "Low-to-mid, wide enough to see feet AND ball. Rear camera for quality.",
    lighting: "Outdoors: shoot with light in front, avoid harsh midday shadows on your face. Indoors: face the brightest source.",
    audio: "Wind is the enemy — use a windshield and get the mic close. Record a clean voiceover after if needed.",
    structure: ["Hook: the mistake or the promise", "Show the move", "The one cue that fixes it", "Ask: what do you struggle with here?"],
    mistakes: ["Framing too tight (feet cut off)", "Filming into the sun (you go dark)", "No single clear coaching cue"],
    safety: ["Clear the area of bystanders", "Don't reveal the exact court location if it's a regular spot", "Bystanders/kids need permission to appear"],
    preflight: ["Whole move is in frame", "One clear cue", "Audio understandable over ambient noise"],
  },
  {
    type: "Court breakdown",
    quickSetup: ["Phone vertical, elevated if possible", "Whiteboard or telestrator app ready"],
    proSetup: ["Elevated tripod / high angle", "Screen-record for tactic diagrams", "Lav mic for narration"],
    shotList: ["Wide court context", "Zoom on the key spacing/action"],
    cameraPosition: "High and wide for spacing; switch to tight for the detail.",
    lighting: "Even gym light; avoid mixed colour temperatures if you can.",
    audio: "Narrate close to the mic; keep it calm and clear.",
    structure: ["Hook: the situation", "The read", "The one principle", "Ask: what would you do here?"],
    mistakes: ["Too much jargon", "Explaining three reads instead of one", "No clear takeaway"],
    safety: ["No identifying player info without consent", "Blur faces of minors if not consented"],
    preflight: ["One principle only", "Diagram/action is readable", "Ends on a question"],
  },
  {
    type: "Food preparation",
    quickSetup: ["Phone on an overhead stand or propped facing down", "Clean bench, good top light", "Ingredients laid out"],
    proSetup: ["Overhead rig", "Soft key light to the side", "Lav mic for voiceover"],
    shotList: ["Overhead prep steps", "Close-up of the finished plate", "Talking-head intro (optional)"],
    cameraPosition: "Overhead for the prep, eye-level for the talking bits.",
    lighting: "Soft, from the side; avoid your own shadow over the food.",
    audio: "Voiceover after is easiest for kitchens (extractor fans are noisy).",
    structure: ["Hook: the game-day fuel problem", "Simple prep", "Why it helps performance", "Ask: what's your pre-game meal?"],
    mistakes: ["Restriction/diet language", "Guaranteed-result claims", "Too many steps"],
    safety: ["General education only — not individual medical advice", "No weight-loss framing", "Keep food neutral (no 'good/bad')"],
    preflight: ["Language is neutral and non-restrictive", "No medical/guaranteed claims", "General audience, not one child"],
  },
  {
    type: "Voiceover",
    quickSetup: ["Quiet room, soft furnishings", "Phone/mic close", "Script bullets in front of you"],
    proSetup: ["Treated space or blanket fort", "Cardioid mic close", "Record in a quiet part of the day"],
    shotList: ["Record b-roll separately", "Match VO to the strongest visuals"],
    cameraPosition: "N/A — this is audio-led; pair with your best footage.",
    lighting: "N/A",
    audio: "Proximity + no AGC. Aim peaks near -10dB, never touch 0dB. Do a test line first.",
    structure: ["Hook line", "The point", "The action", "The question"],
    mistakes: ["Reading in a flat 'radio' voice", "Rushing the hook", "Filler words ('um', 'like', 'so')"],
    safety: ["No private info in the audio"],
    preflight: ["Clean levels (no clipping)", "No long silences", "Hook in the first line"],
  },
  {
    type: "Comment Reply Reel",
    quickSetup: ["Screenshot the comment", "Phone vertical, eye level", "Notifications off"],
    proSetup: ["Tripod + key light", "Lav mic", "Comment graphic ready to overlay"],
    shotList: ["You reading/answering", "Optional demo of the answer"],
    cameraPosition: "Eye level, front-on. Put the comment on screen early.",
    lighting: "Soft front light.",
    audio: "Close mic, clear voice.",
    structure: ["Show the comment", "Short direct answer", "One example", "Ask a follow-up question"],
    mistakes: ["Rambling before the answer", "Not showing the actual comment", "Answering more than one thing"],
    safety: ["Don't expose the commenter's private details", "Ask permission if you name them"],
    preflight: ["Comment visible early", "Answer is direct and short", "One question at the end"],
  },
  {
    type: "Mindset story",
    quickSetup: ["Quiet, calm setting", "Eye level", "One story, one lesson"],
    proSetup: ["Key light for mood", "Lav mic", "Simple background"],
    shotList: ["Close, personal framing"],
    cameraPosition: "Slightly closer than usual — this is intimate. Eye level.",
    lighting: "A touch moodier is fine, but your face stays lit.",
    audio: "Close and clear; let pauses breathe.",
    structure: ["Hook: the moment", "What happened", "The lesson", "Ask: when has this happened to you?"],
    mistakes: ["Preaching", "Trying too hard to be inspirational", "Burying the lesson"],
    safety: ["Don't share others' private stories without consent"],
    preflight: ["One clear lesson", "Not preachy", "Ends on a real question"],
  },
  {
    type: "Two-person conversation",
    quickSetup: ["Both in frame, vertical", "One mic between you or two lavs", "Quiet room"],
    proSetup: ["Two lav mics", "Two-shot + singles if you can", "Even light on both faces"],
    shotList: ["Two-shot wide", "Singles for reactions", "Cutaways"],
    cameraPosition: "Two-shot at eye level; keep both faces lit evenly.",
    lighting: "Balance light across both people.",
    audio: "Two lavs beat one shared mic. Watch for one person being quieter.",
    structure: ["Hook: the question you're settling", "Two views", "The shared takeaway", "Ask the audience to weigh in"],
    mistakes: ["Talking over each other", "No clear question", "One person dominating"],
    safety: ["Guest consent to appear + to be clipped", "Record a release note"],
    preflight: ["Both audible", "One clear question", "Guest consented"],
  },
  {
    type: "Community talk clip",
    quickSetup: ["Pull the strongest 10–20s from the talk recording", "Add captions", "Add a title card"],
    proSetup: ["Multi-cam talk recording", "Editor for clean cuts", "Branded title/subtitle template"],
    shotList: ["The single best moment", "A reaction if you have it"],
    cameraPosition: "Use the clearest angle of the speaker.",
    lighting: "Whatever the talk had — grade lightly if needed.",
    audio: "Clean up the talk audio; captions are essential.",
    structure: ["Hook: the punchy line", "The insight", "Credit the guest", "Ask: agree or not?"],
    mistakes: ["Clip too long", "No captions", "Not crediting the contributor (Loop Closer)"],
    safety: ["Everyone in the clip consented to be clipped", "No minors without guardian consent"],
    preflight: ["Under ~20s", "Captions present", "Contributor credited"],
  },
];

// Speaking Coach structure & the three take modes.
export const SPEAKING = {
  structure: ["Hook", "Answer", "Demonstration or example", "One action", "One real question"],
  shortForm: [
    "Hook in the opening moment",
    "Immediate value",
    "Short sentences — one per breath",
    "One core idea",
    "A direct ending",
    "No unnecessary introduction",
  ],
  takeModes: [
    { key: "calm", name: "Calm and direct", note: "Even pace, low and steady. Let the useful word land." },
    { key: "energy", name: "Higher energy", note: "Lift the pace and the volume on the hook. Don't rush the action." },
    { key: "shortest", name: "Shortest possible version", note: "Cut to hook → one line → question. Under 8 seconds." },
  ],
  techniques: [
    "Look into the camera lens, not your own image",
    "Speak to one person, not 'an audience'",
    "Use bullet points, don't memorise paragraphs",
    "Pause instead of filling space",
    "Remove throat-clearing and unnecessary setup",
    "Emphasise the single most useful word",
    "Finish cleanly — stop when you're done",
    "Ask a question people can answer from experience",
  ],
};

// The five hook variants generated for every Reel.
export const HOOK_VARIANTS = [
  { key: "plain", label: "Plain", template: (topic: string) => `Here's a simple way to ${topic.toLowerCase()}.` },
  { key: "curiosity", label: "Curiosity", template: (topic: string) => `Most people get ${topic.toLowerCase()} wrong. Here's why.` },
  { key: "problem", label: "Direct problem", template: (topic: string) => `Struggling with ${topic.toLowerCase()}? Do this.` },
  { key: "reply", label: "Community reply", template: (topic: string) => `A coach asked about ${topic.toLowerCase()} — here's the short answer.` },
  { key: "age", label: "Age-specific", template: (topic: string) => `For players aged 13–17: remember this about ${topic.toLowerCase()}.` },
];

// Reel preflight checklist (overridable per item, with a recorded reason).
export const PREFLIGHT_CHECKS = [
  { key: "orientation", label: "Correct orientation (vertical 9:16)" },
  { key: "duration", label: "Suitable duration (short — aim sub-20s)" },
  { key: "first_frame", label: "Strong first frame" },
  { key: "hook_immediate", label: "Hook appears immediately" },
  { key: "audio_clear", label: "Audio is understandable" },
  { key: "captions", label: "Captions are present" },
  { key: "caption_safe", label: "Caption placement is safe (inside safe zone)" },
  { key: "one_point", label: "One teaching point" },
  { key: "one_question", label: "One question" },
  { key: "no_private", label: "No accidental private information" },
  { key: "nutrition_safe", label: "Nutrition safety language where relevant" },
  { key: "permission", label: "Permission for identifiable people" },
  { key: "highlight", label: "Correct Highlight destination" },
  { key: "cover", label: "Cover frame selected" },
  { key: "licensed", label: "No unlicensed asset warning" },
];

// Recording setup coach — the pre-shoot check.
export const SETUP_COACH = [
  "Phone lens is clean",
  "Vertical framing is correct",
  "Camera is stable",
  "Camera is near eye level",
  "Face is not hidden by backlighting",
  "Main light is soft and intentional",
  "Background is uncluttered",
  "Audio source is close enough",
  "Court echo or wind has been considered",
  "Notifications are disabled",
  "Personal information is not visible",
  "Children or bystanders have permission to appear",
  "No exact live location is accidentally revealed",
  "Captions remain inside current Instagram-safe areas",
];

// Batch Day plans.
export const BATCH_PLANS = {
  30: { reels: 3, blocks: ["Setup (5m)", "Record 3 hooks + points (18m)", "Reset & notes (7m)"] },
  60: { reels: 6, blocks: ["Setup (8m)", "Record block A ×3 (22m)", "Break (5m)", "Record block B ×3 (20m)", "Wrap & label takes (5m)"] },
  90: { reels: 6, blocks: ["Setup (10m)", "Record talking-head set (25m)", "Break (5m)", "Record demo set (30m)", "Break (5m)", "Pickups + covers (10m)", "Label & back up (5m)"] },
};

export const GROUP_BY_OPTIONS = ["location", "clothing", "equipment", "camera", "pillar", "demo", "collaborator"] as const;

// Repurpose Map — one idea, many surfaces.
export const REPURPOSE_TARGETS = [
  { key: "short_reel", label: "Short Reel", note: "The core sub-20s hit." },
  { key: "reply_reel", label: "Reply Reel", note: "Answer the top comment it earned." },
  { key: "story_poll", label: "Story poll", note: "Ask the two-option version." },
  { key: "highlight", label: "Highlight lesson", note: "Save it to the evergreen shelf." },
  { key: "talk", label: "Talk topic", note: "Go deeper live with a guest." },
  { key: "parent_prompt", label: "Parent/coach prompt", note: "A conversation starter for adults." },
  { key: "challenge", label: "Community challenge", note: "Turn the action into a week-long habit." },
  { key: "followup", label: "Follow-up post", note: "Part two while it's warm." },
];

// Challenge templates (safe, positive, opt-in).
export const CHALLENGE_TEMPLATES = [
  { title: "Seven-Day Preparation Reset", days: 7, safetyNote: "About routine, not restriction. No body measurements.", conversationPrompt: "What's one thing you'll prepare the night before?" },
  { title: "Hydration Awareness Week", days: 7, safetyNote: "General education. Not medical advice.", conversationPrompt: "When do you forget to drink water?" },
  { title: "Next-Play Mindset Challenge", days: 7, safetyNote: "Focus on response, not perfection.", conversationPrompt: "What's your reset after a mistake?" },
  { title: "Five-Minute Ball-Handling Week", days: 7, safetyNote: "Warm up first. Stop if anything hurts.", conversationPrompt: "Which move are you drilling this week?" },
  { title: "Pack-Your-Bag-The-Night-Before", days: 7, safetyNote: "A simple habit, no pressure.", conversationPrompt: "What always gets forgotten in your bag?" },
  { title: "Parent Conversation Challenge", days: 7, safetyNote: "Supportive talk only. No performance pressure on kids.", conversationPrompt: "What's one question to ask your player after a game?" },
];
