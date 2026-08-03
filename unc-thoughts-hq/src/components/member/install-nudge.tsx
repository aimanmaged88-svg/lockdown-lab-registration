"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// "Save Unk as an app": one-tap install on Android/desktop, a Share→Add hint on
// iOS. Dismissable, remembers the choice, invisible once installed.
export function InstallNudge() {
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return; // already installed
    if (localStorage.getItem("unk_install_dismissed")) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) { setShow(true); return; }
    const onBip = (e: Event) => { e.preventDefault(); setBip(e as BIPEvent); setShow(true); };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem("unk_install_dismissed", "1");
    setShow(false);
  }

  return (
    <div className="card p-4 mt-6 flex items-start gap-3">
      <Download size={18} className="text-paper-dim shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Save Unk as an app</p>
        <p className="text-xs text-grey mt-0.5">
          {ios
            ? "Tap the Share button, then “Add to Home Screen”. Full screen, one tap away, and pings can reach you."
            : "One tap and it lives on your home screen — full screen, faster, and pings can reach you."}
        </p>
        {!ios && bip && (
          <button
            className="btn btn-primary text-xs mt-2"
            onClick={async () => { await bip.prompt(); const c = await bip.userChoice; if (c.outcome === "accepted") setShow(false); }}
          >
            Install
          </button>
        )}
      </div>
      <button className="btn btn-ghost text-xs px-2" onClick={dismiss} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}
