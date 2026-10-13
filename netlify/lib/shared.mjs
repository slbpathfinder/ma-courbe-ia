import { getStore } from "@netlify/blobs";
export const SESSIONS = ["LIVE", "TEST", "S1", "S2", "S3"];
export const MOMENTS = ["ouverture", "ingredients", "phase", "pratiques", "conclusion"];
export const store = () => getStore({ name: "atelier-courbe", consistency: "strong" });
export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export const isAdmin = (key) => !!process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
export const clean = (s, max = 280) => String(s ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
