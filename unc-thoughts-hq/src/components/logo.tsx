"use client";
import { useState } from "react";

// Renders the OFFICIAL logo from /brand/logo.png if present. If it hasn't been
// dropped in yet, falls back to the text wordmark — never a redrawn logo.
export function Logo({ size = 28 }: { size?: number }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/logo.png"
        alt="UNC Thoughts"
        height={size}
        style={{ height: size, width: "auto" }}
        onError={() => setOk(false)}
        className="object-contain"
      />
    );
  }
  return (
    <span className="font-display font-semibold uppercase tracking-wider leading-none" style={{ fontSize: size * 0.62 }}>
      UNC <span className="text-grey">Thoughts</span>
    </span>
  );
}
