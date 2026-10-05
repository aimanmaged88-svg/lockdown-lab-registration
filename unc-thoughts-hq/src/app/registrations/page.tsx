import { listInterest } from "@/lib/eoi-actions";
import { RegistrationsClient } from "@/components/eoi/registrations-client";
import { SINK, NETLIFY_FORM, type InterestRow } from "@/lib/eoi-shared";

// Desk-locked by the middleware, same as every other owner screen.
export const dynamic = "force-dynamic";

const NETLIFY_FORMS_URL =
  "https://app.netlify.com/projects/uncthoughts/forms";

export default async function RegistrationsPage() {
  // The database is paused, so reading it throws. The page still has to open —
  // it's where he comes looking for the registrations.
  let rows: InterestRow[] = [];
  let dbDown = false;
  try {
    rows = await listInterest();
  } catch {
    dbDown = true;
  }

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

      {SINK === "netlify" && (
        <div className="card p-4 border-warn/40">
          <p className="text-sm font-medium">Registrations are going to Netlify right now.</p>
          <p className="text-xs text-grey mt-1.5 leading-relaxed">
            The app&apos;s database is paused, so the form is saving to Netlify Forms
            instead — the page works, nothing is lost, and every registration is
            downloadable as a CSV from there. Once the database is back, they come
            straight to this table again and the link people have stays the same.
          </p>
          <a
            className="btn btn-primary text-sm mt-3 inline-flex"
            href={NETLIFY_FORMS_URL} target="_blank" rel="noopener noreferrer"
          >
            Open the “{NETLIFY_FORM}” form in Netlify
          </a>
        </div>
      )}

      {dbDown && SINK !== "netlify" && (
        <div className="card p-4 border-warn/40">
          <p className="text-sm font-medium">The database isn&apos;t answering.</p>
          <p className="text-xs text-grey mt-1.5">
            Nothing can be read until it&apos;s back. No registrations have been lost.
          </p>
        </div>
      )}

      <RegistrationsClient rows={rows} />
    </div>
  );
}
