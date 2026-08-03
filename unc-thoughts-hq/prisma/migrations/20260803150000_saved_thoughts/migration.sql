-- Personal thought library.
CREATE TABLE "SavedThought" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "promptId" TEXT,
    "text" TEXT NOT NULL,
    "pillar" TEXT NOT NULL DEFAULT 'Mindset',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedThought_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SavedThought_memberId_promptId_key" ON "SavedThought"("memberId", "promptId");
