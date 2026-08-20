// Keep the serverless functions warm so the app stops feeling sluggish on
// first open. Pings the hot member + desk routes every 5 minutes; a warm
// lambda answers in ~300ms where a cold one takes 2–4s.
export default async () => {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.URL;
  if (!base) return new Response("missing config", { status: 500 });
  const paths = ["/member", "/member/question", "/member/library", "/inbox"];
  const results = await Promise.all(
    paths.map((p) =>
      fetch(`${base}${p}`, { redirect: "manual" })
        .then((r) => `${p}:${r.status}`)
        .catch((e) => `${p}:ERR ${e.message}`),
    ),
  );
  console.log("keep-warm:", results.join(" "));
  return new Response(results.join("\n"), { status: 200 });
};

export const config = { schedule: "*/5 * * * *" };
