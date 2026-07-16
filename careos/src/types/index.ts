/**
 * CareOS domain model.
 *
 * The participant is the centre of every type in this file. Records exist to
 * tell a person's story — never to reduce them to paperwork.
 */

export type Role =
  | "participant"
  | "parent"
  | "support-worker"
  | "team-leader"
  | "therapist"
  | "provider-admin"
  | "ceo"
  | "system-admin";

export type Mood = "great" | "good" | "okay" | "low" | "distressed";

export type TimelineKind =
  | "milestone"
  | "achievement"
  | "goal"
  | "photo"
  | "report"
  | "appointment"
  | "therapy"
  | "community"
  | "ai-summary"
  | "celebration"
  | "education"
  | "employment";

export interface TimelineEvent {
  id: string;
  participantId: string;
  date: string; // ISO date
  kind: TimelineKind;
  title: string;
  description: string;
  highlight?: boolean;
  author?: string;
  tags?: string[];
}

export type GoalStatus = "on-track" | "achieved" | "needs-attention" | "new";

export interface Goal {
  id: string;
  title: string;
  category: string;
  status: GoalStatus;
  progress: number; // 0–100
  startedAt: string;
  targetDate?: string;
  why: string;
  latestUpdate: string;
  strategies: string[];
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  purpose: string;
  prescriber: string;
  status: "active" | "prn" | "paused";
  lastGiven?: string;
}

export interface RiskAlert {
  id: string;
  level: "info" | "caution" | "important";
  title: string;
  guidance: string;
}

export interface AiInsight {
  id: string;
  title: string;
  summary: string;
  confidence: "emerging" | "moderate" | "strong";
  because: string[]; // AI must always explain its reasoning
  suggestedAction?: string;
}

export interface CommunicationProfile {
  style: string;
  tools: string[];
  processingTime: string;
  successfulStrategies: string[];
  avoid: string[];
  keyPhrases: { phrase: string; meaning: string }[];
}

export interface SensoryPreference {
  sense: string;
  preference: string;
  level: "seeks" | "neutral" | "sensitive";
}

export interface SensoryProfile {
  preferences: SensoryPreference[];
  earlySignsOfOverwhelm: string[];
  regulationStrategies: string[];
  favouriteTools: string[];
}

export interface RoutineStep {
  time: string;
  title: string;
  detail: string;
  supportsGoalId?: string;
}

export interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  title: string;
  with: string;
  location: string;
  kind: "therapy" | "medical" | "community" | "planning";
  sharedWithFamily: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  sharedWithFamily: boolean;
  author: string;
}

export interface FamilyNote {
  id: string;
  from: string;
  relationship: string;
  date: string;
  note: string;
}

export interface MoodPoint {
  date: string;
  score: number; // 1–5
}

export interface TrendSeries {
  label: string;
  unit: string;
  points: { period: string; value: number }[];
  direction: "up" | "down" | "steady";
  positive: boolean; // is the direction a good thing?
}

export interface Participant {
  id: string;
  name: string;
  preferredName: string;
  pronouns: string;
  age: number;
  initials: string;
  gradient: string; // tailwind gradient classes for the fictional avatar
  tagline: string; // person-first — strengths before anything else
  about: string;
  primarySupport: string; // plain-language description, never a label
  supportLevel: "low" | "moderate" | "high";
  location: string;
  mood: Mood;
  moodTrend: MoodPoint[];
  strengths: string[];
  interests: string[];
  dreams: string[];
  importantPeople: { name: string; relationship: string }[];
  favouriteThings: { label: string; value: string }[];
  communication: CommunicationProfile;
  sensory: SensoryProfile;
  health: {
    diagnoses: string[];
    allergies: string[];
    mobility: string;
    sleep: string;
    nutrition: string;
    emergencyContact: string;
  };
  morningRoutine: RoutineStep[];
  eveningRoutine: RoutineStep[];
  goals: Goal[];
  medications: Medication[];
  riskAlerts: RiskAlert[];
  aiInsights: AiInsight[];
  appointments: AppointmentItem[];
  documents: DocumentItem[];
  familyNotes: FamilyNote[];
  trends: TrendSeries[];
  behaviourSupport: {
    proactiveStrategies: string[];
    earlyWarningSigns: string[];
    deescalation: string[];
    thingsThatHelp: string[];
  };
  nutrition: {
    loves: string[];
    avoid: string[];
    textureNotes: string;
    hydrationTarget: string;
    mealtimeSupport: string;
  };
  community: {
    favouritePlaces: string[];
    safePlaces: string[];
    transport: string;
    outingTips: string[];
  };
  todaysWins: string[];
  yearsSupported: number;
}

export interface ChecklistItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  category: "routine" | "medication" | "goal" | "community" | "wellbeing" | "handover";
  done: boolean;
}

export interface Shift {
  id: string;
  participantId: string;
  workerName: string;
  date: string;
  start: string;
  end: string;
  status: "upcoming" | "active" | "complete";
  focus: string;
  checklist: ChecklistItem[];
  briefing: {
    headline: string;
    remember: string[];
    communicationTips: string[];
    sensoryNotes: string[];
    alerts: string[];
  };
}

export interface NotificationItem {
  id: string;
  time: string;
  kind: "milestone" | "family" | "shift" | "alert" | "ai" | "system";
  title: string;
  body: string;
  read: boolean;
  href?: string;
}

export interface LearningTopic {
  slug: string;
  title: string;
  emoji: string;
  gradient: string;
  summary: string;
  minutes: number;
  lessons: number;
  progress: number; // 0–100 for the demo user
  overview: string;
  practicalGuidance: string[];
  learningCards: { title: string; body: string }[];
  scenarios: { situation: string; approach: string }[];
  references: string[];
}

export interface CommunityPlace {
  id: string;
  name: string;
  category: string;
  distanceKm: number;
  travelMinutes: number;
  accessibility: string[];
  sensoryFriendly: boolean;
  notes: string;
  favouriteOf: string[]; // participant ids
}

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  updated: string;
  formats: string[];
}
