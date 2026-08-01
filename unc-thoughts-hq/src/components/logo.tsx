"use client";
import { useState } from "react";

// Shows the OFFICIAL logo from /brand/logo.png the moment it's present. Until
// then it shows the clean text wordmark — never a broken-image icon, and never a
// redrawn logo. The <img> stays hidden until it actually loads.
export function Logo({ size = 28 }: { size?: number }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className="inline-flex items-center leading-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="UNC Thoughts"
        onLoad={() => setLoaded(true)}
        style={{ height: size, width: "auto", display: loaded ? "block" : "none" }}
        className="object-contain"
      />
      {!loaded && (
        <span className="font-display font-semibold uppercase tracking-wider" style={{ fontSize: size * 0.62 }}>
          UNC <span className="text-grey">Thoughts</span>
        </span>
      )}
    </span>
  );
}
