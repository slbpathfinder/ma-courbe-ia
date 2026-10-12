import { SESSIONS, store, json, clean } from "../lib/shared.mjs";
export default async (req) => {
  const url = new URL(req.url);
  const session = clean(url.searchParams.get("session"), 8);
  if (!SESSIONS.includes(session)) return json({ error: "params" }, 400);
  const st = (await store().get(`${session}/_state`, { type: "json" })) || { active: null };
  return json(st);
};
export const config = { path: "/api/state" };
