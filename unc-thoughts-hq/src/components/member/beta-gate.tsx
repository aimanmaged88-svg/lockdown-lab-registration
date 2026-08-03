"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { acceptTerms, type GateAge } from "@/lib/gate-actions";
import { FlaskConical, ShieldCheck } from "lucide-react";

const KEY = "unc_gate_v1"; // bump with TERMS_VERSION to re-prompt everyone

// Full-screen first-open gate: beta disclaimer, age check, explicit accept.
// Under 13 can't proceed alone — only a parent/guardian can accept for them.
// No close button by design: accepting is the only way in.
export function BetaGate() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [age, setAge] = useState<"16+" | "13-15" | "u13" | null>(null);
  const [parentOk, setParentOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  // The terms must be readable before accepting.
  if (!show || pathname === "/member/terms") return null;

  const canAccept = age === "16+" || age === "13-15" || (age === "u13" && parentOk);

  function accept() {
    if (!canAccept || !age) return;
    setErr(null);
    start(async () => {
      try {
        const serverAge: GateAge = age === "u13" ? "u13_parent" : age;
        const r = await acceptTerms({ age: serverAge, parentConfirmed: parentOk });
        if (!r.ok) { setErr("Couldn't record that — try again."); return; }
        localStorage.setItem(KEY, JSON.stringify({ at: new Date().toISOString(), age }));
        setShow(false);
      } catch {
        setErr("Couldn't record that — check your connection and try again.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Welcome — beta notice and terms">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card p-5 max-w-md w-full space-y-4 border-paper/20">
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-warn" />
            <span className="chip pointer-events-none border-warn/50 text-warn text-[11px]">BETA</span>
            <h2 className="text-lg font-semibold normal-case tracking-normal">Before you jump in</h2>
          </div>

          <div className="text-sm text-paper-dim space-y-2">
            <p><strong className="text-paper">This app is in beta</strong> — we&apos;re building it with the community. If anything looks off, wrong or broken, please tell us: use &quot;Ask UNC himself&quot; or DM <span className="text-paper">@uncthoughts</span>. You help make it better.</p>
            <p>It shares lived experience and general education — <strong className="text-paper">not medical, dietary or professional advice</strong>. The heavy stuff gets pointed to real help.</p>
          </div>

          <div className="space-y-2">
            <span className="label">How old are you?</span>
            <div className="flex gap-2">
              <button type="button" className={`btn flex-1 text-sm ${age === "16+" ? "btn-primary" : ""}`} onClick={() => { setAge("16+"); setParentOk(false); }}>16 or over</button>
              <button type="button" className={`btn flex-1 text-sm ${age === "13-15" ? "btn-primary" : ""}`} onClick={() => { setAge("13-15"); setParentOk(false); }}>13–15</button>
              <button type="button" className={`btn flex-1 text-sm ${age === "u13" ? "btn-primary" : ""}`} onClick={() => setAge("u13")}>Under 13</button>
            </div>
          </div>

          {age === "u13" && (
            <div className="rounded-xl border border-warn/40 bg-ink-soft p-3 space-y-2">
              <p className="text-sm text-paper"><strong>Under 13? You can&apos;t continue on your own.</strong></p>
              <p className="text-xs text-grey">Hand the phone to a parent or guardian. If they accept the terms, you use the app together with them.</p>
              <label className="flex items-start gap-2 text-sm text-paper-dim cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={parentOk} onChange={(e) => setParentOk(e.target.checked)} />
                <span>I am this child&apos;s parent or guardian, I&apos;m 18 or over, and I accept the terms on our behalf. We&apos;ll use the app together.</span>
              </label>
            </div>
          )}

          <p className="text-xs text-grey">
            By continuing you confirm your age above and agree to the{" "}
            <a href="/member/terms" target="_blank" rel="noreferrer" className="underline text-paper-dim">House Rules, Terms &amp; Privacy</a>{" "}
            (New South Wales, Australia) — including zero tolerance for abuse and human review of everything before it&apos;s shown publicly.
          </p>

          {err && <p className="text-sm text-accent-soft">{err}</p>}
          <button className="btn btn-primary w-full" disabled={!canAccept || pending} onClick={accept}>
            <ShieldCheck size={15} /> {pending ? "Saving…" : "Yes — I accept. Let me in."}
          </button>
          {age === "u13" && !parentOk && <p className="text-[11px] text-warn text-center">Waiting on a parent or guardian to accept.</p>}
        </div>
      </div>
    </div>
  );
}
