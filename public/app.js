// Ma courbe face à l'IA : page participants
const TABS = [
  ["ouverture", "Mon changement"], ["ingredients", "Nos ingrédients"], ["phase", "Ma courbe"],
  ["parler", "On en parle"], ["pratiques", "Nos pratiques"], ["pas", "Mon petit pas"], ["apres", "Après l'atelier"]
];
const PHASES = [
  { id: 1, name: "Choc et déni", quote: "« L'IA, c'est pour les autres. »",
    think: ["« Encore une mode, ça va passer. »", "« Nos clients ne demandent pas d'IA. »", "« L'Intelligence Métier, c'est surtout un slogan. »"],
    team: { k: "Kotter : créer l'urgence, former l'équipe de pilotage",
      ideas: ["Organiser un temps d'équipe sur le pourquoi : relire ensemble la vision IA du pôle et lister nos questions",
              "Faire une démo croisée de 15 minutes : un collègue montre un usage réel de l'IA dans notre métier",
              "Écrire ensemble ce qui change et ce qui ne change pas pour l'équipe"] } },
  { id: 2, name: "Colère et peur", quote: "« Et moi, dans tout ça ? »",
    think: ["« Si l'IA fait ce que je sais faire, à quoi je sers ? »", "« Peut-on confier les données de nos clients à une IA ? »", "« On nous l'impose sans nous demander notre avis. »"],
    team: { k: "Kotter : construire la vision, dialoguer",
      ideas: ["Ouvrir avec le manager un temps de questions sans tabou, avec la possibilité de poser des questions anonymes",
              "Recenser nos inquiétudes (métier, clients, données) et les remonter avec des faits",
              "Identifier ensemble ce qui fait notre valeur et que l'IA ne remplace pas"] } },
  { id: 3, name: "Le creux", quote: "« J'ai essayé, et maintenant ? »",
    think: ["« Je ne vois pas encore ce que ça m'apporte. »", "« Trop d'outils, trop vite, je sature. »", "« Je ne sais pas quel est mon rôle dans cette stratégie. »"],
    team: { k: "Kotter : donner les moyens d'agir, obtenir des victoires rapides",
      ideas: ["Choisir en équipe un cas d'usage prioritaire et le tester pendant trois semaines",
              "Créer des binômes d'entraide qui mêlent générations et métiers",
              "Lever chaque mois un obstacle concret : un accès, un outil, du temps"] } },
  { id: 4, name: "Rebond et sens", quote: "« Je vois ce que ça change pour moi et pour nos clients. »",
    think: ["« Ça me fait gagner du temps sur une tâche précise. »", "« J'ai des idées pour faire évoluer nos produits. »", "« Je peux expliquer notre direction avec mes mots. »"],
    team: { k: "Kotter : persévérer, ancrer dans la culture",
      ideas: ["Instaurer un rituel de cinq minutes par semaine pour partager un usage qui marche",
              "Mesurer et célébrer les gains, pour nous et pour nos clients",
              "Accueillir les nouveaux arrivants avec nos bonnes pratiques"] } }
];
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
let st = Object.assign({ session: null, tab: "ouverture", phase: null, active: null }, LS.get("mc-state") || {});
let client = LS.get("mc-client");
if (!client) { client = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)) ; LS.set("mc-client", client); }
const save = () => LS.set("mc-state", { session: st.session, tab: st.tab, phase: st.phase });
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Session : une seule session en direct, l'animatrice exporte puis vide entre deux ateliers
st.session = new URLSearchParams(location.search).get("session") === "TEST" ? "TEST" : "LIVE";

// Tabs -------------------------------------------------------------
function renderTabs() {
  $("#tabs").innerHTML = TABS.map(([id, label], i) =>
    `<button type="button" role="tab" data-t="${id}" aria-selected="${st.tab === id}" class="${st.active === id ? "live" : ""}"><span>${i + 1}</span>${label}</button>`).join("");
  $$("#tabs button").forEach((b) => b.addEventListener("click", () => go(b.dataset.t)));
  $$("section.panel").forEach((s) => (s.hidden = s.dataset.tab !== st.tab));
  $("#tabs button[aria-selected=\"true\"]")?.scrollIntoView({ inline: "center", block: "nearest" });
}
function go(t) { st.tab = t; save(); renderTabs(); window.scrollTo({ top: 0, behavior: "smooth" }); }

// Envoi ------------------------------------------------------------
async function send(payload) {
  if (!st.session) throw new Error("session");
  const r = await fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, session: st.session, client }) });
  if (!r.ok) throw new Error("send");
}
$$("form.send").forEach((f) => f.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $(".status", f), btn = $("button", f);
  const items = $$("textarea,input:not(.group)", f).map((x) => x.value.trim()).filter(Boolean);
  const group = $(".group", f)?.value.trim() || "";
  if (!st.session) { status.className = "status err"; status.textContent = "Choisissez d'abord votre session, en haut de la page."; return; }
  if (!items.length) { status.className = "status err"; status.textContent = "Écrivez au moins une réponse."; return; }
  if (f.hasAttribute("data-group") && !group) { status.className = "status err"; status.textContent = "Indiquez le numéro de votre sous-groupe."; return; }
  btn.disabled = true;
  try {
    await send({ moment: f.dataset.moment, items, group });
    status.className = "status"; status.textContent = "Merci, c'est envoyé.";
    $$("textarea,input:not(.group)", f).forEach((x) => (x.value = ""));
  } catch {
    status.className = "status err"; status.textContent = "L'envoi n'a pas marché. Vérifiez votre connexion et réessayez.";
  } finally { btn.disabled = false; }
}));

// Courbe -----------------------------------------------------------
const BOUNDS = [0, 210, 415, 565, 1000];
const PTS = [[15,98],[90,62],[190,89],[300,164],[400,224],[485,252],[570,221],[650,140],[730,71],[840,41],[990,35]];
function sampleCurve() {
  const P = [PTS[0], ...PTS, PTS[PTS.length - 1]], o = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [a, b, c, d] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let s = 0; s < 20; s++) { const t = s / 20, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map((k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3))); }
  }
  o.push(PTS[PTS.length - 1]); return o;
}
const CURVE = sampleCurve(), NS = "http://www.w3.org/2000/svg";
const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
function drawCurve() {
  const svg = $("#curve"); svg.innerHTML = "";
  PHASES.forEach((p, i) => {
    const g = el("g", { class: "zone" + (st.phase === p.id ? " sel" : ""), tabindex: 0, role: "button", "aria-label": p.name });
    g.appendChild(el("rect", { x: BOUNDS[i], y: 0, width: BOUNDS[i + 1] - BOUNDS[i], height: 330, rx: 14 }));
    const t = el("text", { x: (BOUNDS[i] + BOUNDS[i + 1]) / 2, y: 314, "text-anchor": "middle" });
    t.textContent = ["Choc", "Colère", "Creux", "Rebond"][i]; g.appendChild(t);
    g.addEventListener("click", () => pickPhase(p.id));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickPhase(p.id); } });
    svg.appendChild(g);
  });
  BOUNDS.slice(1, 4).forEach((x) => svg.appendChild(el("line", { x1: x, y1: 10, x2: x, y2: 280, class: "divider" })));
  PHASES.forEach((p, i) => {
    const pts = CURVE.filter((c) => c[0] >= BOUNDS[i] - 3 && c[0] <= BOUNDS[i + 1] + 3);
    svg.appendChild(el("path", { d: "M" + pts.map((c) => c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" L"), class: "seg" + (st.phase === p.id ? " sel" : "") }));
  });
  if (st.phase) {
    const seg = CURVE.filter((c) => c[0] >= BOUNDS[st.phase - 1] && c[0] <= BOUNDS[st.phase]); const m = seg[Math.floor(seg.length / 2)];
    svg.appendChild(el("circle", { cx: m[0], cy: m[1], r: 14, fill: "#FF6136", stroke: "#fff", "stroke-width": 4 }));
    const t = el("text", { x: m[0], y: m[1] - 26, "text-anchor": "middle", "font-family": "Poppins, sans-serif", "font-size": 24, "font-weight": 700, fill: "#FF6136" });
    t.textContent = "Moi"; svg.appendChild(t);
  }
}
function renderPhases() {
  drawCurve();
  $("#phases").innerHTML = PHASES.map((p) => `<button type="button" class="phase" data-id="${p.id}" aria-pressed="${st.phase === p.id}">
    <div class="top"><h3>${p.name}</h3><span class="num">Phase ${p.id}</span></div><p class="quote">${p.quote}</p>
    <ul>${p.think.map((x) => `<li>${x}</li>`).join("")}</ul>${st.phase === p.id ? '<p class="pick">C\'est plutôt moi</p>' : ""}</button>`).join("");
  $$(".phase").forEach((b) => b.addEventListener("click", () => pickPhase(+b.dataset.id)));
  $("#c-pos").textContent = st.phase ? "Je suis plutôt en " + PHASES[st.phase - 1].name.toLowerCase() : "Phase à choisir dans « Ma courbe »";
  $("#apres").innerHTML = (st.phase ? [PHASES[st.phase - 1], ...PHASES.filter((p) => p.id !== st.phase)] : PHASES).map((p) =>
    `<div class="team${st.phase === p.id ? " mine" : ""}"><h3>${p.name}${st.phase === p.id ? " · ma phase" : ""}</h3><div class="k">${p.team.k}</div>
     <ul>${p.team.ideas.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("");
}
async function pickPhase(id) {
  const s = $("#phaseStatus");
  st.phase = id; save(); renderPhases();
  if (!st.session) { s.className = "status err"; s.textContent = "Choisissez votre session en haut de la page pour que votre choix compte dans le total."; return; }
  try { await send({ moment: "phase", phase: id }); s.className = "status"; s.textContent = "C'est noté. Vous pouvez changer d'avis à tout moment."; }
  catch { s.className = "status err"; s.textContent = "L'envoi n'a pas marché. Touchez à nouveau votre phase."; }
}

// Petit pas (reste sur le téléphone) --------------------------------
const F = ["what", "when", "who"], PH = { what: "Tester l'IA pour préparer la synthèse de mon point d'équipe", when: "Jeudi matin", who: "Mon binôme du sous-groupe" };
const draft = LS.get("mc-pas") || {};
F.forEach((k) => { const i = $("#f-" + k); if (draft[k]) i.value = draft[k]; i.addEventListener("input", upd); });
function upd() {
  const d = {};
  F.forEach((k) => { const v = $("#f-" + k).value.trim(); d[k] = v; const dd = $("#c-" + k); dd.textContent = v || PH[k]; dd.classList.toggle("empty", !v); });
  LS.set("mc-pas", d);
}
$("#copyBtn").addEventListener("click", () => {
  const L = { what: "Je vais", when: "Quand", who: "Avec" }, lines = ["Mon premier petit pas", $("#c-pos").textContent];
  F.forEach((k) => { const v = $("#f-" + k).value.trim(); if (v) lines.push(L[k] + " : " + v); });
  const txt = lines.join("\n"), toast = $("#toast");
  const fb = () => { const ta = $("#copySrc"); ta.value = txt; ta.select(); toast.textContent = "Texte sélectionné : utilisez Copier de votre téléphone."; };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(() => (toast.textContent = "Carte copiée. Envoyez-la à votre binôme ou gardez-la dans vos notes."), fb); else fb();
});
$("#stepForm").addEventListener("submit", (e) => e.preventDefault());

// Moment piloté par l'animatrice ------------------------------------
const LABEL = Object.fromEntries(TABS);
async function poll() {
  if (!st.session) return;
  try {
    const r = await fetch("/api/state?session=" + st.session, { cache: "no-store" });
    if (!r.ok) return;
    const { active } = await r.json();
    if (active && active !== st.active) {
      st.active = active; go(active);
      const b = $("#banner"); b.hidden = false; b.textContent = "C'est le moment : " + (LABEL[active] || active);
    } else if (!active && st.active) { st.active = null; $("#banner").hidden = true; renderTabs(); }
  } catch {}
}
setInterval(poll, 5000);

renderTabs(); renderPhases(); upd(); poll();
