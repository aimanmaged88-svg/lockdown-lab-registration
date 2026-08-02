import { ComposeClient } from "@/components/compose/compose-client";
import { prisma, getOrgId } from "@/lib/db";
import { LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const orgId = await getOrgId();
  const [ready, ideas] = await Promise.all([
    prisma.content.count({ where: { orgId, status: "Ready", postedAt: null } }),
    prisma.content.count({ where: { orgId, status: "Idea" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Always have something ready to post</p>
          <h1>Compose</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-grey">
          <span className="chip">{ready} ready</span>
          <span className="chip">{ideas} ideas</span>
          <LinkButton href="/content?status=Ready">Open the bank</LinkButton>
        </div>
      </div>
      <ComposeClient />
    </div>
  );
}
