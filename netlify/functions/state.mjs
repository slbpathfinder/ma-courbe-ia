import { SESSIONS, store, json, clean } from "../lib/shared.mjs";
export default async (req) => {
  const url = new URL(req.url);
  const session = clean(url.searchParams.get("session"), 8);
  if (!SESSIONS.includes(session)) return json({ error: "params" }, 400);
  const st = (await store().get(`${session}/_state`, { type: "json" })) || { active: null };
  // Cache CDN de 2 s : 100 téléphones qui interrogent toutes les 5 s ne déclenchent qu'un appel toutes les 2 s
  return new Response(JSON.stringify(st), { headers: { "content-type": "application/json", "cache-control": "public, max-age=0, must-revalidate", "netlify-cdn-cache-control": "public, s-maxage=2, durable" } });
};
export const config = { path: "/api/state" };
