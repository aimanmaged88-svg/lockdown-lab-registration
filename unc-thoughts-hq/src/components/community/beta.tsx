"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvite, createPost, reportPost, resolveReport, reactUseful, verifyExpert } from "@/lib/community-actions";
import { Card, Badge } from "@/components/ui";
import { Shield, Flag, ThumbsUp, UserPlus } from "lucide-react";

type Space = { id: string; key: string; name: string; readOnly: boolean; locked: boolean };
type Post = { id: string; body: string; authorName: string; usefulCount: number; status: string; spaceId: string; createdAt: string };
type Report = { id: string; reason: string; detail: string | null; postBody: string | null; status: string };
type Invite = { code: string; email: string | null; acceptedAt: string | null };
type Member = { id: string; displayName: string; role: string; verifiedExpert: boolean };

export function CommunityBeta({ spaces, posts, reports, invites, members }: {
  spaces: Space[]; posts: Post[]; reports: Report[]; invites: Invite[]; members: Member[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [lastInvite, setLastInvite] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const run = (fn: () => Promise<unknown>, after?: () => void) =>
    start(async () => { setErr(null); try { await fn(); after?.(); router.refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Error"); } });

  return (
    <div className="space-y-6">
      {err && <div className="card border-bad/40 text-accent-soft p-3 text-sm">{err}</div>}

      {/* Invite adult members */}
      <Card>
        <div className="eyebrow mb-2 flex items-center gap-2"><UserPlus size={14} /> Invite an adult (18+) member</div>
        <div className="flex flex-wrap gap-2">
          <input className="input w-auto flex-1 min-w-[200px]" placeholder="email (optional)" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <button className="btn btn-primary" disabled={pending} onClick={() => run(async () => {
            const inv = await createInvite({ email: inviteEmail || undefined });
            setLastInvite(inv.code);
          }, () => setInviteEmail(""))}>Create invite</button>
        </div>
        {lastInvite && <p className="text-sm mt-2">Invite code: <code className="text-paper">{lastInvite}</code> <span className="text-grey">(14-day, adults only)</span></p>}
        {invites.length > 0 && (
          <div className="mt-3 text-xs text-grey space-y-1">
            {invites.slice(0, 5).map((i) => <div key={i.code}><code>{i.code}</code> {i.email ?? "—"} {i.acceptedAt ? <Badge tone="good">accepted</Badge> : <Badge>pending</Badge>}</div>)}
          </div>
        )}
      </Card>

      {/* Moderation queue */}
      <Card>
        <div className="eyebrow mb-2 flex items-center gap-2"><Shield size={14} /> Moderation queue</div>
        {reports.filter((r) => r.status === "open").length === 0 ? (
          <p className="text-sm text-grey">No open reports. A calm community is the goal.</p>
        ) : (
          <div className="space-y-2">
            {reports.filter((r) => r.status === "open").map((r) => (
              <div key={r.id} className="rounded-lg border border-ink-line p-3">
                <div className="flex items-center gap-2 mb-1"><Flag size={14} className="text-accent-soft" /><span className="text-sm font-medium">{r.reason}</span></div>
                {r.postBody && <p className="text-sm text-grey">&ldquo;{r.postBody.slice(0, 120)}&rdquo;</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button className="btn text-xs" disabled={pending} onClick={() => { const res = window.prompt("Enforcement reason (shown transparently):", "Removed for breaking the useful-first guidelines."); if (res) run(() => resolveReport({ reportId: r.id, action: "remove", resolution: res })); }}>Remove post</button>
                  <button className="btn text-xs" disabled={pending} onClick={() => { const res = window.prompt("Reason for hiding:", "Hidden pending review."); if (res) run(() => resolveReport({ reportId: r.id, action: "hide", resolution: res })); }}>Hide</button>
                  <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => run(() => resolveReport({ reportId: r.id, action: "dismiss", resolution: "No action needed." }))}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Spaces + posts */}
      <Card>
        <div className="eyebrow mb-2">Topic spaces</div>
        <div className="flex flex-wrap gap-1 mb-3">
          {spaces.map((s) => (
            <button key={s.id} onClick={() => setSpaceId(s.id)} className={`chip ${spaceId === s.id ? "text-paper border-paper/40" : "hover:text-paper"}`}>
              {s.name}{s.readOnly && " · announce"}{s.locked && " · locked"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input className="input flex-1" placeholder="Post as owner (useful, not loud)…" value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="btn btn-primary" disabled={pending || !body.trim()} onClick={() => run(() => createPost({ spaceId, body }), () => setBody(""))}>Post</button>
        </div>
        <div className="space-y-2">
          {posts.filter((p) => p.spaceId === spaceId).length === 0 && <p className="text-sm text-grey">No posts here yet. You&apos;re caught up.</p>}
          {posts.filter((p) => p.spaceId === spaceId).map((p) => (
            <div key={p.id} className="rounded-lg border border-ink-line p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.authorName}</span>
                <Badge tone={p.status === "visible" ? "default" : "bad"}>{p.status}</Badge>
              </div>
              <p className="text-sm text-paper-dim mt-1">{p.body}</p>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => run(() => reactUseful(p.id))}><ThumbsUp size={13} /> Useful ({p.usefulCount})</button>
                <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => { const reason = window.prompt("Report reason:", "Off-topic / not useful"); if (reason) run(() => reportPost({ postId: p.id, reason })); }}><Flag size={13} /> Report</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Members / roles / expert verification */}
      <Card>
        <div className="eyebrow mb-2">Members & contributor roles</div>
        <div className="space-y-1.5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span>{m.displayName} <Badge>{m.role}</Badge> {m.verifiedExpert && <Badge tone="good">verified expert</Badge>}</span>
              {!m.verifiedExpert && m.role !== "owner" && (
                <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => { const basis = window.prompt("Basis for verification (recorded):"); if (basis) run(() => verifyExpert(m.id, basis)); }}>Verify expert</button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
