-- Owner-approved public Q&A library flag.
ALTER TABLE "CommunityQuestion" ADD COLUMN "inLibrary" BOOLEAN NOT NULL DEFAULT false;
