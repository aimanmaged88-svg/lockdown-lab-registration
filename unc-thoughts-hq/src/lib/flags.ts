import { prisma, getOrgId } from "./db";
import { env } from "./env";

// Feature flags: env provides the default; a DB row can override per-org at
// runtime (Settings screen). Community beta stays off unless BOTH the env
// default allows it OR an explicit DB override is set.
export type FlagKey = "community_beta" | "video_inspect";

const envDefault: Record<FlagKey, boolean> = {
  community_beta: env.FEATURE_COMMUNITY_BETA,
  video_inspect: env.FEATURE_VIDEO_INSPECT,
};

export async function isEnabled(key: FlagKey): Promise<boolean> {
  try {
    const orgId = await getOrgId();
    const row = await prisma.featureFlag.findUnique({
      where: { orgId_key: { orgId, key } },
    });
    if (row) return row.enabled;
  } catch {
    // DB not ready (e.g. build time) — fall back to env default.
  }
  return envDefault[key];
}

export async function setFlag(key: FlagKey, enabled: boolean): Promise<void> {
  const orgId = await getOrgId();
  await prisma.featureFlag.upsert({
    where: { orgId_key: { orgId, key } },
    update: { enabled },
    create: { orgId, key, enabled },
  });
}

export async function allFlags(): Promise<Record<FlagKey, boolean>> {
  return {
    community_beta: await isEnabled("community_beta"),
    video_inspect: await isEnabled("video_inspect"),
  };
}
