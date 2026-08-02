// Hourly heartbeat: asks the app whether any owner notification is due.
// The app-side dispatcher (src/lib/push.ts) owns all timing/dedupe logic —
// this function is deliberately dumb.
export default async () => {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.URL;
  const token = process.env.AUTH_SECRET;
  if (!base || !token) return new Response("missing config", { status: 500 });
  const res = await fetch(`${base}/api/notify/dispatch?token=${encodeURIComponent(token)}`);
  const body = await res.text();
  console.log("push-cron:", res.status, body.slice(0, 300));
  return new Response(body, { status: res.status });
};

export const config = { schedule: "@hourly" };
