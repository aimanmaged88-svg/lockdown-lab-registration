-- Ask UNC directly: anonymous member questions with optional answered-ping.
ALTER TABLE "CommunityQuestion" ADD COLUMN "memberId" TEXT;
ALTER TABLE "CommunityQuestion" ADD COLUMN "notify" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CommunityQuestion" ADD COLUMN "answerText" TEXT;
ALTER TABLE "CommunityQuestion" ADD COLUMN "answeredAt" DATETIME;
ALTER TABLE "PushSub" ADD COLUMN "memberId" TEXT;
