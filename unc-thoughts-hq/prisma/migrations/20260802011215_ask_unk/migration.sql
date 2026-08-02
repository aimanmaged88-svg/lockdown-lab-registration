-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "ageBand" TEXT,
    "allergies" TEXT,
    "dietaryNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME,
    CONSTRAINT "Member_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "answerEnc" TEXT,
    "voicePath" TEXT,
    "actionChosen" TEXT,
    "reminderAt" DATETIME,
    "followUp" TEXT,
    "followUpAt" DATETIME,
    "shareStatus" TEXT NOT NULL DEFAULT 'none',
    "sharedText" TEXT,
    "sharedPostId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reflection_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThoughtPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "pillar" TEXT NOT NULL DEFAULT 'Mindset',
    "actions" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ThoughtPrompt_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'General',
    "body" TEXT NOT NULL,
    "tags" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "author" TEXT NOT NULL DEFAULT 'UNC',
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "approval" TEXT NOT NULL DEFAULT 'draft',
    "safetyClass" TEXT NOT NULL DEFAULT 'general',
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "KnowledgeItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "note" TEXT,
    "editedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeVersion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "KnowledgeItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AskLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "memberId" TEXT,
    "question" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "timeBand" TEXT,
    "usedItemIds" TEXT,
    "supported" BOOLEAN NOT NULL DEFAULT true,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "guardianNote" BOOLEAN NOT NULL DEFAULT false,
    "useful" BOOLEAN,
    "unclear" BOOLEAN,
    "followed" BOOLEAN,
    "hadAvailable" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AskLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AskLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Reflection_memberId_createdAt_idx" ON "Reflection"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeItem_orgId_approval_idx" ON "KnowledgeItem"("orgId", "approval");

-- CreateIndex
CREATE INDEX "AskLog_orgId_createdAt_idx" ON "AskLog"("orgId", "createdAt");
