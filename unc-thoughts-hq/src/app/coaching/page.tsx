import type { Metadata } from "next";
import { EoiForm } from "@/components/eoi/eoi-form";

// Nothing to read from the database before painting — the form is the page.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Online Coaching — Expression of Interest | UNC'S THOUGHTS",
  description:
    "Register your interest in UNC'S THOUGHTS online coaching. Group sessions capped at 10-15, and one-on-ones.",
};

export default function CoachingPage() {
  return (
    <div className="eoi">
      <div className="eoi-wrap">
        <p className="eoi-brand">UNC&apos;S THOUGHTS</p>
        <h1>Online Coaching — Expression of Interest</h1>
        <p className="eoi-intro">
          Skills are everywhere. This is about mindset — reading the play before it happens,
          decision making, and the details most coaches skip. Group sessions (capped at 10–15)
          and one-on-ones. Register your interest and you&apos;ll be first to hear when spots open.
        </p>
        <div className="eoi-rule" />
        <EoiForm />
      </div>
    </div>
  );
}
