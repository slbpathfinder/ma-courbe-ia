import { SESSIONS, MOMENTS, store, json, isAdmin, clean } from "../lib/shared.mjs";
export default async (req) => {
  const url = new URL(req.url);
  if (!isAdmin(url.searchParams.get("key"))) return json({ error: "key" }, 401);
  const session = clean(url.searchParams.get("session"), 8), moment = clean(url.searchParams.get("moment"), 20);
  if (!SESSIONS.includes(session) || !MOMENTS.includes(moment)) return json({ error: "params" }, 400);
  const s = store();
  const { blobs } = await s.list({ prefix: `${session}/${moment}/` });
  const hidden = (await s.get(`${session}/_hidden`, { type: "json" })) || [];
  const rows = await Promise.all(blobs.map(async ({ key }) => ({ key, ...(await s.get(key, { type: "json" })) })));
  return json({ rows: rows.filter((r) => !hidden.includes(r.key)).sort((a, b) => a.at - b.at) });
};
export const config = { path: "/api/results" };
