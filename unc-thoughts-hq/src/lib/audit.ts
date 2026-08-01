import { prisma, getOrgId } from "./db";

// Every consequential action leaves a trail. Used by moderation + admin review.
export async function audit(
  action: string,
  opts: { actorId?: string; entity?: string; entityId?: string; detail?: unknown } = {},
) {
  try {
    const orgId = await getOrgId();
    await prisma.auditEvent.create({
      data: {
        orgId,
        action,
        actorId: opts.actorId,
        entity: opts.entity,
        entityId: opts.entityId,
        detail: opts.detail ? JSON.stringify(opts.detail) : null,
      },
    });
  } catch {
    // Audit must never break the primary action.
  }
}
