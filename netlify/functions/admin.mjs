import { SESSIONS, MOMENTS, store, json, isAdmin, clean } from "../lib/shared.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "json" }, 400); }
  if (!isAdmin(b.key)) return json({ error: "key" }, 401);
  const session = clean(b.session, 8);
  if (!SESSIONS.includes(session)) return json({ error: "params" }, 400);
  const s = store();
  if (b.action === "active") {
    const active = b.active === null ? null : clean(b.active, 20);
    await s.setJSON(`${session}/_state`, { active, at: Date.now() });
    return json({ ok: true });
  }
  if (b.action === "hide") {
    const hidden = (await s.get(`${session}/_hidden`, { type: "json" })) || [];
    hidden.push(clean(b.target, 200));
    await s.setJSON(`${session}/_hidden`, hidden);
    return json({ ok: true });
  }
  if (b.action === "reset") {
    if (b.confirm !== session) return json({ error: "confirm" }, 400);
    const { blobs } = await s.list({ prefix: `${session}/` });
    await Promise.all(blobs.map(({ key }) => s.delete(key)));
    return json({ ok: true, deleted: blobs.length });
  }
  return json({ error: "action" }, 400);
};
export const config = { path: "/api/admin" };
