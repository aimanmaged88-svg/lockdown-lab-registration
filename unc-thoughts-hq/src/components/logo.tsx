"use client";
import { useEffect, useRef, useState } from "react";

// Shows the OFFICIAL logo from /brand/logo.png. Falls back to the clean text
// wordmark only if the file is missing — never a broken-image icon, and never
// a redrawn logo. The effect covers the hydration race where the image
// finishes loading before React attaches onLoad.
export function Logo({ size = 28 }: { size?: number }) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"pending" | "ok" | "missing">("pending");

  useEffect(() => {
    const img = ref.current;
    if (img?.complete) setState(img.naturalWidth > 0 ? "ok" : "missing");
  }, []);

  return (
    <span className="inline-flex items-center leading-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src="/brand/logo.png"
        alt="UNC Thoughts"
        onLoad={() => setState("ok")}
        onError={() => setState("missing")}
        style={{ height: size, width: "auto", display: state === "ok" ? "block" : "none" }}
        className="object-contain"
      />
      {state === "missing" && (
        <span className="font-display font-semibold uppercase tracking-wider" style={{ fontSize: size * 0.62 }}>
          UNC <span className="text-grey">Thoughts</span>
        </span>
      )}
    </span>
  );
}
