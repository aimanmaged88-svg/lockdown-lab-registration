// Emit idempotent SQL to seed the live (Postgres) Library from the same data.
// Each item inserts a brain FAQ (KnowledgeItem) + a Library row (CommunityQuestion),
// guarded by NOT EXISTS so re-running is safe. Ids supplied (schema cuids are
// app-generated). Org resolved by slug at insert time.
import { randomUUID } from "crypto";
import { LIBRARY_SEED } from "./library-seed-data.mjs";

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const ORG = `(SELECT id FROM "Organisation" WHERE slug='unc-thoughts')`;
const out = [];

for (const it of LIBRARY_SEED) {
  const kid = "seedk_" + randomUUID().replace(/-/g, "").slice(0, 20);
  const cid = "seedq_" + randomUUID().replace(/-/g, "").slice(0, 20);
  const body = `DO NOW: ${it.a}\nPRIVATE: What would you add from your own experience?\nWHY: UNC answered this one for the community.`;
  const safety = it.pillar === "Nutrition" ? "nutrition" : "general";
  const tags = JSON.stringify(["reply", "seed", it.pillar.toLowerCase()]);

  out.push(
`INSERT INTO "KnowledgeItem" (id, "orgId", kind, title, pillar, audience, body, tags, source, author, approval, "reviewedAt", "safetyClass", version)
SELECT ${q(kid)}, ${ORG}, 'faq', ${q(it.q.slice(0,110))}, ${q(it.pillar)}, 'General', ${q(body)}, ${q(tags)}, 'UNC starter', 'UNC', 'approved', now(), ${q(safety)}, 1
WHERE NOT EXISTS (SELECT 1 FROM "KnowledgeItem" WHERE source='UNC starter' AND title=${q(it.q.slice(0,110))});`);

  out.push(
`INSERT INTO "CommunityQuestion" (id, "orgId", text, pillar, problem, source, status, "contributorAcknowledged", "answerText", "answeredAt", "inLibrary", frequency, notify)
SELECT ${q(cid)}, ${ORG}, ${q(it.q)}, ${q(it.pillar)}, ${q(it.subcat)}, 'seed', 'answered', true, ${q(it.a)}, now(), true, 1, false
WHERE NOT EXISTS (SELECT 1 FROM "CommunityQuestion" WHERE source='seed' AND text=${q(it.q)});`);
}

console.log(out.join("\n"));
