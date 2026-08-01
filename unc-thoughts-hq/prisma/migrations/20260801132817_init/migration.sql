-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "handle" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "passwordHash" TEXT,
    "isAdult" BOOLEAN NOT NULL DEFAULT true,
    "adultConfirmedAt" DATETIME,
    "verifiedExpert" BOOLEAN NOT NULL DEFAULT false,
    "verificationBasis" TEXT,
    "bio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME,
    CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "series" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'General',
    "format" TEXT NOT NULL DEFAULT 'Reel',
    "reelSeconds" INTEGER,
    "hook" TEXT,
    "script" TEXT,
    "teachingPoints" TEXT,
    "shotList" TEXT,
    "caption" TEXT,
    "question" TEXT,
    "highlight" TEXT,
    "plannedDate" DATETIME,
    "postedAt" DATETIME,
    "instagramUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Idea',
    "notes" TEXT,
    "inspirationSource" TEXT,
    "collaboratorId" TEXT,
    "recordingLocation" TEXT,
    "equipmentUsed" TEXT,
    "isExperiment" BOOLEAN NOT NULL DEFAULT false,
    "isTrialReel" BOOLEAN NOT NULL DEFAULT false,
    "followUpOfId" TEXT,
    "repurposedFromId" TEXT,
    "importKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sourceQuestionId" TEXT,
    CONSTRAINT "Content_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Content_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Content_followUpOfId_fkey" FOREIGN KEY ("followUpOfId") REFERENCES "Content" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Content_repurposedFromId_fkey" FOREIGN KEY ("repurposedFromId") REFERENCES "Content" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Content_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "CommunityQuestion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DayTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "contentId" TEXT,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" DATETIME,
    "dueDate" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DayTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DayTask_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT,
    "kind" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT,
    "bytes" INTEGER,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "window" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER,
    "reach" INTEGER,
    "plays" INTEGER,
    "avgWatchSec" REAL,
    "reelSeconds" INTEGER,
    "completionPct" REAL,
    "skipPct" REAL,
    "likes" INTEGER,
    "comments" INTEGER,
    "saves" INTEGER,
    "shares" INTEGER,
    "profileVisits" INTEGER,
    "follows" INTEGER,
    "storyShares" INTEGER,
    "wasTrialReel" BOOLEAN NOT NULL DEFAULT false,
    "sharedToAll" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "screenshotPath" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AnalyticsSnapshot_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "dateChecked" DATETIME NOT NULL,
    "ruleType" TEXT NOT NULL,
    "whyForUnc" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "reviewBy" DATETIME NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "supersededById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResearchEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeLesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quickVersion" TEXT NOT NULL,
    "deep" TEXT NOT NULL,
    "whyMatters" TEXT NOT NULL,
    "checklist" TEXT NOT NULL,
    "exercise" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "dateChecked" DATETIME,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeLesson_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "askedBy" TEXT,
    "pillar" TEXT,
    "audience" TEXT,
    "problem" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'comment',
    "status" TEXT NOT NULL DEFAULT 'open',
    "answeredContentId" TEXT,
    "contributorAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityQuestion_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "snoozeUntil" DATETIME,
    "assigneeId" TEXT,
    "refId" TEXT,
    "questionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InboxItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InboxItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CommunityQuestion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Talk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT,
    "pillar" TEXT,
    "guestName" TEXT,
    "guestCredentials" TEXT,
    "scheduledAt" DATETIME,
    "externalLink" TEXT,
    "runSheet" TEXT,
    "recordingConsent" BOOLEAN NOT NULL DEFAULT false,
    "attendance" INTEGER,
    "recordingPath" TEXT,
    "transcript" TEXT,
    "chapters" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "isMedicalDisclaimer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Talk_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TalkQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talkId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TalkQuestion_talkId_fkey" FOREIGN KEY ("talkId") REFERENCES "Talk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TalkClip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talkId" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "script" TEXT,
    "caption" TEXT,
    "turnedIntoContentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TalkClip_talkId_fkey" FOREIGN KEY ("talkId") REFERENCES "Talk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 7,
    "safetyNote" TEXT NOT NULL,
    "conversationPrompt" TEXT NOT NULL,
    "optIn" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Challenge_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collaborator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expertise" TEXT NOT NULL,
    "topic" TEXT,
    "proposed" TEXT,
    "contactStatus" TEXT NOT NULL DEFAULT 'prospect',
    "contactPrivate" TEXT,
    "permission" BOOLEAN NOT NULL DEFAULT false,
    "recordingDate" DATETIME,
    "releaseForm" BOOLEAN NOT NULL DEFAULT false,
    "clipsCreated" INTEGER NOT NULL DEFAULT 0,
    "followUp" TEXT,
    "communityResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Collaborator_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "contentId" TEXT,
    "type" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "variable" TEXT NOT NULL,
    "heldConstant" TEXT NOT NULL,
    "minSample" INTEGER NOT NULL DEFAULT 3,
    "result" TEXT,
    "confidence" TEXT,
    "decision" TEXT,
    "nextTest" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Experiment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Experiment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WinningPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "audience" TEXT NOT NULL,
    "evidence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WinningPattern_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "posted" INTEGER NOT NULL DEFAULT 0,
    "planned" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "highlights" TEXT,
    "learnings" TEXT,
    "nextFocus" TEXT,
    "markdown" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyReview_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BatchSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 60,
    "groupBy" TEXT NOT NULL DEFAULT 'location',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BatchSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BatchItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "BatchItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BatchSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BatchItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreflightResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreflightResult_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slowModeSec" INTEGER NOT NULL DEFAULT 0,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "readOnly" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Space_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpaceMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT "SpaceMembership_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SpaceMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "tags" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "usefulCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "removalReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "postId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "handlerId" TEXT,
    "resolution" TEXT,
    "moderatorNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Report_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "adultOnly" BOOLEAN NOT NULL DEFAULT true,
    "invitedById" TEXT NOT NULL,
    "acceptedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeatureFlag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "added" INTEGER NOT NULL DEFAULT 0,
    "changed" INTEGER NOT NULL DEFAULT 0,
    "conflicts" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportRun_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Content_importKey_key" ON "Content"("importKey");

-- CreateIndex
CREATE INDEX "Content_orgId_plannedDate_idx" ON "Content"("orgId", "plannedDate");

-- CreateIndex
CREATE INDEX "Content_orgId_status_idx" ON "Content"("orgId", "status");

-- CreateIndex
CREATE INDEX "Content_orgId_pillar_idx" ON "Content"("orgId", "pillar");

-- CreateIndex
CREATE INDEX "DayTask_orgId_dueDate_idx" ON "DayTask"("orgId", "dueDate");

-- CreateIndex
CREATE INDEX "DayTask_contentId_idx" ON "DayTask"("contentId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_contentId_window_idx" ON "AnalyticsSnapshot"("contentId", "window");

-- CreateIndex
CREATE INDEX "ResearchEntry_orgId_category_idx" ON "ResearchEntry"("orgId", "category");

-- CreateIndex
CREATE INDEX "PracticeLesson_orgId_topic_idx" ON "PracticeLesson"("orgId", "topic");

-- CreateIndex
CREATE INDEX "CommunityQuestion_orgId_status_idx" ON "CommunityQuestion"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InboxItem_questionId_key" ON "InboxItem"("questionId");

-- CreateIndex
CREATE INDEX "InboxItem_orgId_status_idx" ON "InboxItem"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_contentId_key" ON "Experiment"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_orgId_weekStart_key" ON "WeeklyReview"("orgId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "PreflightResult_contentId_key" ON "PreflightResult"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Space_orgId_key_key" ON "Space"("orgId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceMembership_spaceId_userId_key" ON "SpaceMembership"("spaceId", "userId");

-- CreateIndex
CREATE INDEX "Post_spaceId_createdAt_idx" ON "Post"("spaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_orgId_status_idx" ON "Report"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- CreateIndex
CREATE INDEX "AuditEvent_orgId_createdAt_idx" ON "AuditEvent"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_orgId_key_key" ON "FeatureFlag"("orgId", "key");
