/**
 * Fictional marketplace / discovery data.
 *
 * The CareOS difference vs. keyword-and-postcode marketplaces: every listing
 * is scored against the selected participant's Care DNA, so families see WHY
 * a provider, worker, home or activity fits — not just that it exists nearby.
 */

export type ListingKind = "provider" | "worker" | "accommodation" | "activity";

export interface Listing {
  id: string;
  kind: ListingKind;
  name: string;
  headline: string;
  category: string;
  location: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  verified: boolean;
  availability: string;
  specialties: string[];
  /** Match reasons drawn from the participant's Care DNA (the 10× edge). */
  matchReasons: string[];
  matchScore: number; // 0–100 fit against the selected participant
  gradient: string;
  initials: string;
}

export const marketplaceListings: Listing[] = [
  // ---------------- Allied health / therapy providers ----------------
  {
    id: "mk-p1",
    kind: "provider",
    name: "Northside Speech & AAC",
    headline: "AAC-specialist speech pathology for non-speaking communicators",
    category: "Speech pathology",
    location: "Coburg, VIC",
    distanceKm: 2.1,
    rating: 4.9,
    reviews: 128,
    verified: true,
    availability: "New clients in 2 weeks",
    specialties: ["AAC / talkers", "Key Word Sign", "Non-speaking clients", "Autism"],
    matchReasons: ["Specialises in talker (AAC) users like Zayd", "Runs pool-deck communication programs", "Sees clients in the community, not just clinic"],
    matchScore: 97,
    gradient: "from-cyan-400 to-blue-500",
    initials: "NS",
  },
  {
    id: "mk-p2",
    kind: "provider",
    name: "Rhythm Room Music Therapy",
    headline: "Registered music therapy for regulation and communication",
    category: "Music therapy",
    location: "Brunswick, VIC",
    distanceKm: 3.4,
    rating: 5.0,
    reviews: 74,
    verified: true,
    availability: "Waitlist ~3 weeks",
    specialties: ["Music therapy", "Sensory regulation", "Non-verbal engagement", "Groups"],
    matchReasons: ["Idris's rhythm-first profile is a strong match", "Uses sung transitions — his best strategy", "Sibling / group sessions available"],
    matchScore: 95,
    gradient: "from-fuchsia-400 to-purple-500",
    initials: "RR",
  },
  {
    id: "mk-p3",
    kind: "provider",
    name: "Merri Occupational Therapy",
    headline: "Paediatric OT — sensory, daily living & assistive tech",
    category: "Occupational therapy",
    location: "Northcote, VIC",
    distanceKm: 1.6,
    rating: 4.8,
    reviews: 96,
    verified: true,
    availability: "New clients now",
    specialties: ["Sensory integration", "AT prescription", "Daily living skills", "Autism"],
    matchReasons: ["Sensory-profile expertise matches the boys' needs", "Prescribes weighted / regulation tools", "Home visits available"],
    matchScore: 91,
    gradient: "from-teal-400 to-emerald-500",
    initials: "MO",
  },

  // ---------------- Support workers ----------------
  {
    id: "mk-w1",
    kind: "worker",
    name: "Yusuf A.",
    headline: "Support worker · AAC-confident · water-safety trained",
    category: "Support worker",
    location: "Coburg, VIC",
    distanceKm: 1.2,
    rating: 4.9,
    reviews: 41,
    verified: true,
    availability: "Weekday afternoons, Saturdays",
    specialties: ["AAC modelling", "Water safety", "Autism (level 3)", "Male worker", "Arabic + English"],
    matchReasons: ["Trained in talker modelling like Zayd's", "Pool water-safety certified", "Arabic-speaking — matches family's preference"],
    matchScore: 98,
    gradient: "from-sky-400 to-indigo-500",
    initials: "YA",
  },
  {
    id: "mk-w2",
    kind: "worker",
    name: "Priya S.",
    headline: "Support worker · complex communication · music-led",
    category: "Support worker",
    location: "Brunswick, VIC",
    distanceKm: 2.8,
    rating: 4.8,
    reviews: 33,
    verified: true,
    availability: "Weekday mornings",
    specialties: ["PECS + talkers", "Music engagement", "Sensory regulation", "Non-speaking clients"],
    matchReasons: ["PECS-to-talker transition experience (Idris)", "Uses music to regulate — his top strategy", "Available mornings for his best window"],
    matchScore: 93,
    gradient: "from-rose-400 to-orange-400",
    initials: "PS",
  },

  // ---------------- Accommodation (SIL / STA) ----------------
  {
    id: "mk-a1",
    kind: "accommodation",
    name: "Fenwick House — SIL vacancy",
    headline: "Supported Independent Living · sensory-designed · 1 vacancy",
    category: "SIL accommodation",
    location: "Preston, VIC",
    distanceKm: 4.0,
    rating: 4.7,
    reviews: 22,
    verified: true,
    availability: "1 room available now",
    specialties: ["Sensory-designed rooms", "2:1 support capacity", "Fenced garden", "Awake-night staff"],
    matchReasons: ["Low-arousal sensory design suits autistic residents", "Secure garden — water & road safety managed", "High-support (2:1) capable"],
    matchScore: 88,
    gradient: "from-amber-400 to-orange-500",
    initials: "FH",
  },
  {
    id: "mk-a2",
    kind: "accommodation",
    name: "Coburg STA & Respite",
    headline: "Short-term accommodation & respite · accessible",
    category: "STA / respite",
    location: "Coburg, VIC",
    distanceKm: 1.9,
    rating: 4.6,
    reviews: 38,
    verified: true,
    availability: "Weekends available",
    specialties: ["Respite", "Accessible bathrooms", "Sensory room", "Sibling stays"],
    matchReasons: ["Sibling stays — Zayd & Idris can go together", "Sensory room on site", "Close to home for easy transitions"],
    matchScore: 84,
    gradient: "from-violet-400 to-purple-500",
    initials: "CS",
  },

  // ---------------- Community & activities ----------------
  {
    id: "mk-c1",
    kind: "activity",
    name: "AllAbilities Swim School",
    headline: "1:1 adaptive swimming for autistic & disabled swimmers",
    category: "Swimming",
    location: "Coburg, VIC",
    distanceKm: 1.4,
    rating: 4.9,
    reviews: 210,
    verified: true,
    availability: "Saturday spots open",
    specialties: ["1:1 adaptive swim", "Water safety", "Autism-aware", "Quiet sessions"],
    matchReasons: ["Zayd's #1 love and regulator — water", "Water-safety curriculum matches his goal", "Quiet sessions reduce sensory load"],
    matchScore: 96,
    gradient: "from-cyan-400 to-teal-500",
    initials: "AS",
  },
  {
    id: "mk-c2",
    kind: "activity",
    name: "Sensory Sundays — Bridges Reserve",
    headline: "Calm sensory play sessions for kids & families",
    category: "Community group",
    location: "Coburg, VIC",
    distanceKm: 0.9,
    rating: 4.8,
    reviews: 64,
    verified: true,
    availability: "Weekly, Sunday am",
    specialties: ["Sensory play", "Sandpit & bubbles", "Sibling-friendly", "Low-arousal"],
    matchReasons: ["Sand, bubbles & ducks — Idris's happy place", "Sibling-friendly for both boys", "Sunday wind-down supports calmer Mondays"],
    matchScore: 92,
    gradient: "from-lime-400 to-green-500",
    initials: "SS",
  },
];

export const marketplaceTabs: { key: ListingKind; label: string; blurb: string }[] = [
  { key: "provider", label: "Therapy & providers", blurb: "Allied health matched to the person's goals and communication." },
  { key: "worker", label: "Support workers", blurb: "Workers with the exact skills, language and availability that fit." },
  { key: "accommodation", label: "Accommodation", blurb: "SIL, STA and respite designed for real sensory and safety needs." },
  { key: "activity", label: "Community & activities", blurb: "Programs that fit what the person actually loves." },
];
