import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="surface-gradient flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="rounded-3xl bg-primary-soft p-5 text-primary">
        <Compass className="h-10 w-10" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">This page wandered off</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you're looking for doesn't exist — but everyone's story is still exactly where you left it.
      </p>
      <Button asChild className="mt-6" size="lg">
        <Link href="/dashboard">Back to the dashboard</Link>
      </Button>
    </main>
  );
}
