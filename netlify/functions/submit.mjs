import { SESSIONS, MOMENTS, store, json, clean } from "../lib/shared.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "json" }, 400); }
  const session = clean(b.session, 8), moment = clean(b.moment, 20), client = clean(b.client, 40);
  if (!SESSIONS.includes(session) || !MOMENTS.includes(moment) || !client) return json({ error: "params" }, 400);
  const s = store();
  const entry = { at: Date.now(), group: clean(b.group, 4) };
  let key;
  if (moment === "phase") {
    const phase = Number(b.phase);
    if (![1, 2, 3, 4].includes(phase)) return json({ error: "phase" }, 400);
    entry.phase = phase;
    key = `${session}/phase/${client}`;              // une seule position par personne, modifiable
  } else {
    const items = (Array.isArray(b.items) ? b.items : [b.text]).map((x) => clean(x)).filter(Boolean).slice(0, 3);
    if (!items.length) return json({ error: "empty" }, 400);
    entry.items = items;
    key = `${session}/${moment}/${client}-${Date.now().toString(36)}`;
  }
  await s.setJSON(key, entry);
  return json({ ok: true });
};
export const config = { path: "/api/submit" };
