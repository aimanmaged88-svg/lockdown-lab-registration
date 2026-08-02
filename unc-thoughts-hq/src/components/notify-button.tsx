"use client";
import { useEffect, useState } from "react";
import { savePushSub, removePushSub } from "@/lib/push-actions";
import { Bell, BellOff, Check } from "lucide-react";

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// One-tap phone notifications for the owner. Calm by design: morning brief +
// evening check-in, only when there's something worth saying.
export function NotifyButton({ compact }: { compact?: boolean }) {
  const [state, setState] = useState<"unsupported" | "off" | "busy" | "on" | "denied">("off");
  const [msg, setMsg] = useState<string | null>(null);
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !pubKey) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [pubKey]);

  async function enable() {
    setState("busy"); setMsg(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "denied" : "off"); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(pubKey!) as BufferSource });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await savePushSub(json, navigator.userAgent.includes("iPhone") ? "iPhone" : navigator.userAgent.includes("Android") ? "Android" : "Browser");
      setState("on");
      setMsg("Done — a test ping is on its way.");
    } catch (e) {
      setState("off");
      setMsg(e instanceof Error ? e.message : "Couldn't enable — try installing the app to your home screen first.");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { await removePushSub(sub.endpoint); await sub.unsubscribe(); }
      setState("off"); setMsg("Notifications off.");
    } catch { setState("on"); }
  }

  if (state === "unsupported") {
    return compact ? null : <p className="text-xs text-grey">Phone notifications need the installed app (Add to Home Screen) on iPhone, or Chrome on Android.</p>;
  }
  if (state === "denied") {
    return <p className="text-xs text-warn">Notifications are blocked in your browser settings for this site — allow them there, then try again.</p>;
  }

  return (
    <div className={compact ? "" : "space-y-1.5"}>
      {state === "on" ? (
        <div className="flex items-center gap-2">
          <span className="chip border-good/50 text-good"><Check size={12} /> Phone notifications on</span>
          <button className="btn btn-ghost text-xs" onClick={disable} disabled={false}><BellOff size={13} /> Turn off</button>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={enable} disabled={state === "busy"}>
          <Bell size={15} /> {state === "busy" ? "Setting up…" : "Turn on phone notifications"}
        </button>
      )}
      {msg && <p className="text-xs text-grey">{msg}</p>}
      {!compact && state !== "on" && (
        <p className="text-[11px] text-grey">Two calm pings max: a morning brief (~7:30am) and an evening check-in (~6pm) — and only when there&apos;s actually something to do. iPhone: install to Home Screen first (Share → Add to Home Screen).</p>
      )}
    </div>
  );
}
