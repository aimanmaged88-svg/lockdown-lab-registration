import { PrismaClient } from "@prisma/client";
import { seed } from "../src/lib/seed-core";

// CLI seed (local dev). The reusable logic lives in src/lib/seed-core.ts so the
// same idempotent seed can run from the app (guarded /api/admin/seed) after a
// hosted deploy where this sandbox can't reach the database directly.
const prisma = new PrismaClient();

seed(prisma)
  .then((r) => console.log("Seed complete:", r))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
