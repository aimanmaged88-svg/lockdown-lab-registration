-- CreateTable
CREATE TABLE "StudioSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT,
    "date" DATETIME,
    "pricePerSeat" INTEGER NOT NULL DEFAULT 10,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "seatsSold" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "StudioSession_orgId_status_idx" ON "StudioSession"("orgId", "status");
