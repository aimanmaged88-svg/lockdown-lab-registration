-- CreateTable
CREATE TABLE "SeatBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'held',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    CONSTRAINT "SeatBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudioSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudioSession" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listed" BOOLEAN NOT NULL DEFAULT false,
    "timeText" TEXT,
    "blurb" TEXT,
    "ageBand" TEXT,
    "joinUrl" TEXT
);
INSERT INTO "new_StudioSession" ("capacity", "createdAt", "date", "id", "notes", "orgId", "pricePerSeat", "seatsSold", "status", "title", "topic") SELECT "capacity", "createdAt", "date", "id", "notes", "orgId", "pricePerSeat", "seatsSold", "status", "title", "topic" FROM "StudioSession";
DROP TABLE "StudioSession";
ALTER TABLE "new_StudioSession" RENAME TO "StudioSession";
CREATE INDEX "StudioSession_orgId_status_idx" ON "StudioSession"("orgId", "status");
CREATE INDEX "StudioSession_orgId_listed_idx" ON "StudioSession"("orgId", "listed");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SeatBooking_orgId_status_idx" ON "SeatBooking"("orgId", "status");

-- CreateIndex
CREATE INDEX "SeatBooking_sessionId_status_idx" ON "SeatBooking"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_orgId_key_key" ON "Setting"("orgId", "key");
