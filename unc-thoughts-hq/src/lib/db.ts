import { PrismaClient } from "@prisma/client";

// Single Prisma instance across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// The single-tenant org slug used by the current UI. The schema is multi-org
// ready; every query funnels through this so adding orgs later is mechanical.
export const DEFAULT_ORG_SLUG = "unc-thoughts";

export async function getOrg() {
  const org = await prisma.organisation.findUnique({ where: { slug: DEFAULT_ORG_SLUG } });
  if (!org) throw new Error("Organisation not seeded. Run `npm run db:seed`.");
  return org;
}

// The org id is immutable for the life of the deployment, but almost every
// page asks for it — memoize per serverless instance so it costs one DB
// round trip per lambda lifetime instead of one per request.
let orgIdCache: string | null = null;
export async function getOrgId() {
  if (orgIdCache) return orgIdCache;
  orgIdCache = (await getOrg()).id;
  return orgIdCache;
}
