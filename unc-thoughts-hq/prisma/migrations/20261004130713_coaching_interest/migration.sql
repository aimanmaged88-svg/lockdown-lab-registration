-- CreateTable
CREATE TABLE "CoachingInterest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "mobile" TEXT NOT NULL,
    "mobileNorm" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNorm" TEXT NOT NULL,
    "instagram" TEXT,
    "suburb" TEXT,
    "level" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "focusOther" TEXT,
    "bestTime" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateIndex
CREATE INDEX "CoachingInterest_orgId_createdAt_idx" ON "CoachingInterest"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingInterest_orgId_emailNorm_key" ON "CoachingInterest"("orgId", "emailNorm");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingInterest_orgId_mobileNorm_key" ON "CoachingInterest"("orgId", "mobileNorm");
