-- The Huddle: pre-moderated topic conversation.
CREATE TABLE "HuddlePost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "parentId" TEXT,
    "topic" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HuddlePost_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "HuddlePost_orgId_status_topic_idx" ON "HuddlePost"("orgId", "status", "topic");
