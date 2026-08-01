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

export async function getOrgId() {
  return (await getOrg()).id;
}
