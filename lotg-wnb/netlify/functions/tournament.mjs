import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore({ name: "lotg-wnb", consistency: "strong" });
  if (req.method === "GET") {
    const data = (await store.get("tournament", { type: "json" })) || { tournament: null, previousTeams: [] };
    return Response.json(data);
  }
  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    if (!body?.tournament || typeof body.tournament !== "object") {
      return Response.json({ error: "tournament required" }, { status: 400 });
    }
    const data = { tournament: body.tournament, previousTeams: Array.isArray(body.previousTeams) ? body.previousTeams : [] };
    await store.setJSON("tournament", data);
    return Response.json(data);
  }
  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/tournament" };
