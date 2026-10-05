import { listInterest } from "@/lib/eoi-actions";
import { RegistrationsClient } from "@/components/eoi/registrations-client";

// Desk-locked by the middleware, same as every other owner screen.
export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const rows = await listInterest();
  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">UNC&apos;S THOUGHTS — private</p>
        <h1>Coaching registrations</h1>
        <p className="text-sm text-grey mt-1">
          Everyone who has registered interest in online coaching, newest first. Nobody
          else can see this page.
        </p>
      </div>
      <RegistrationsClient rows={rows} />
    </div>
  );
}
