"use client";
import { usePathname } from "next/navigation";

// The desk's reading column. The public coaching form is its own full-bleed
// black page, so it opts out of the column and the padding entirely.
export function MainShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  if (path.startsWith("/coaching")) return <main>{children}</main>;
  return (
    // bottom padding clears the phone tab bar
    <main className="mx-auto max-w-app px-4 py-6 pb-24 md:px-8 md:py-8 lg:pb-8">{children}</main>
  );
}
