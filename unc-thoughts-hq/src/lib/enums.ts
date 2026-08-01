// Central vocabulary. Modelled as const arrays (SQLite has no native enums) so
// the same lists drive the DB, Zod validation and the UI, and migrate cleanly
// to Postgres enums later if wanted.

export const PILLARS = ["Basketball", "Nutrition", "Mindset", "Community"] as const;
export type Pillar = (typeof PILLARS)[number];

export const AUDIENCES = ["General", "Players13-17", "Parents", "Coaches", "Adults"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const FORMATS = ["Reel", "Story", "Carousel", "Talk", "ReplyReel"] as const;

export const CONTENT_STATUSES = [
  "Idea",
  "Researching",
  "Planned",
  "Script ready",
  "Recording",
  "Editing",
  "Ready",
  "Posted",
  "Analytics due",
  "Complete",
  "Rescheduled",
  "Skipped",
  "Repurpose",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

// The 20 daily checklist steps, in order. `kind` values used across the app.
export const CHECKLIST_STEPS = [
  { kind: "idea_selected", label: "Idea selected", why: "Nothing moves until the one useful idea is chosen." },
  { kind: "hook_written", label: "Hook written", why: "The first second decides whether anyone stays." },
  { kind: "script_prepared", label: "Script prepared", why: "A tight script keeps you under 20 seconds." },
  { kind: "shot_list_prepared", label: "Shot list prepared", why: "Know the shots before you pick up the phone." },
  { kind: "footage_recorded", label: "Footage recorded", why: "Get the takes down while the energy is there." },
  { kind: "best_take_selected", label: "Best take selected", why: "One clean take beats ten average ones." },
  { kind: "reel_edited", label: "Reel edited", why: "Trim to the single idea. Cut the throat-clearing." },
  { kind: "captions_added", label: "Captions added", why: "Most watch on mute — captions carry the message." },
  { kind: "cover_checked", label: "Cover checked", why: "The cover is the promise people tap." },
  { kind: "caption_written", label: "Caption written", why: "The caption sets up the question." },
  { kind: "question_added", label: "Conversation question added", why: "One real question turns views into replies." },
  { kind: "preflight_completed", label: "Preflight completed", why: "Catch the small mistakes before they go out." },
  { kind: "posted", label: "Posted", why: "Shipped beats perfect." },
  { kind: "shared_stories", label: "Shared to Stories", why: "Give the Reel a second front door." },
  { kind: "saved_highlight", label: "Saved to Highlight", why: "Build the evergreen lesson shelf." },
  { kind: "initial_replies", label: "Initial replies completed", why: "Reply early — the first hour of comments matters most." },
  { kind: "later_replies", label: "Later replies completed", why: "Come back and close the loop with the rest." },
  { kind: "analytics_recorded", label: "Analytics recorded", why: "You can only learn from what you measure." },
  { kind: "followup_created", label: "Follow-up content created", why: "A good post earns a part two." },
  { kind: "conversation_logged", label: "Conversation question logged", why: "Turn the best comment into the next idea." },
] as const;
export type ChecklistKind = (typeof CHECKLIST_STEPS)[number]["kind"];

// Weekly short-reel rhythm.
export const WEEKLY_RHYTHM = [
  { day: "Monday", series: "UNC Thought", pillar: "Mindset", seconds: "8–12s", note: "One mindset idea." },
  { day: "Tuesday", series: "For Your Stage", pillar: "Basketball or Nutrition", seconds: "10–15s", note: "Age-specific tip." },
  { day: "Wednesday", series: "UNC Explains", pillar: "Rotating", seconds: "12–20s", note: "Explain one thing well." },
  { day: "Thursday", series: "Comment Reply", pillar: "Community-led", seconds: "7–15s", note: "Answer a real comment." },
  { day: "Friday", series: "Three-Step Fix", pillar: "Rotating", seconds: "12–20s", note: "A simple 3-step routine." },
  { day: "Saturday", series: "Same Principle, Different Stage", pillar: "Rotating", seconds: "8–15s", note: "One idea across ages." },
  { day: "Sunday", series: "Community Reset", pillar: "Community", seconds: "3 Story frames", note: "Reset, not a Reel." },
] as const;

export const RECORDING_TYPES = [
  "Face-to-camera",
  "Basketball demonstration",
  "Court breakdown",
  "Food preparation",
  "Voiceover",
  "Comment Reply Reel",
  "Mindset story",
  "Two-person conversation",
  "Community talk clip",
] as const;
export type RecordingType = (typeof RECORDING_TYPES)[number];

export const EXPERIMENT_TYPES = [
  { key: "two_hooks", label: "Two hooks" },
  { key: "two_lengths", label: "Two Reel lengths" },
  { key: "face_vs_demo", label: "Face-to-camera vs demonstration" },
  { key: "caption", label: "Caption style" },
  { key: "cover", label: "Cover style" },
  { key: "window", label: "Posting window" },
  { key: "question", label: "Question type" },
  { key: "trial_vs_standard", label: "Trial Reel vs standard release" },
  { key: "age_framing", label: "Age-specific vs universal framing" },
] as const;

export const ROLES = ["owner", "admin", "moderator", "contributor", "member", "guest"] as const;
export type Role = (typeof ROLES)[number];

export const SPACES = [
  { key: "basketball", name: "Basketball" },
  { key: "nutrition", name: "Nutrition" },
  { key: "mindset", name: "Mindset" },
  { key: "prep", name: "Prep" },
  { key: "parents_coaches", name: "Parents & Coaches" },
  { key: "questions", name: "Community Questions" },
  { key: "talks", name: "Talks" },
  { key: "challenges", name: "Challenges" },
  { key: "wins", name: "Wins & Lessons" },
] as const;

export const TALK_TEMPLATES = [
  "Ask UNC",
  "Coach Conversation",
  "Nutrition Professional Q&A",
  "Parent and Coach Roundtable",
  "Player Mindset Conversation",
  "Community Review",
  "One Topic, Three Generations",
] as const;

export const HOOK_PATTERNS = [
  "Try this on your next rep.",
  "Most players make this harder than it needs to be.",
  "Before training, keep this simple.",
  "After a mistake, your next job is this.",
  "A coach asked this—here is the short answer.",
  "Same principle. Different stage.",
  "Stop guessing. Use this three-step routine.",
  "For players aged 13–17, remember this.",
] as const;

// Generic openings the Speaking Coach flags and rewrites away from.
export const BANNED_OPENINGS = [
  "hey guys",
  "welcome back",
  "i just wanted to jump on here",
  "this might be controversial",
  "what's going on everyone",
  "whats going on everyone",
] as const;
