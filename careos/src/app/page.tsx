"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/logo";

/**
 * Root route — hands off to the welcome experience.
 * Client-side redirect keeps the app compatible with static export hosting.
 */
export default function RootPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/welcome");
  }, [router]);

  return (
    <main className="surface-gradient flex min-h-screen flex-col items-center justify-center gap-4">
      <Logo />
      <p className="text-sm text-muted-foreground">
        Opening CareOS… <Link href="/welcome" className="font-medium text-primary hover:underline">continue</Link>
      </p>
    </main>
  );
}
