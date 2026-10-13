// Ma courbe face à l'IA : page participants
// Les étapes, dans l'ordre de l'atelier. chef = pavé réservé au chef de groupe.
const STEPS = [
  { id: "ouverture",   title: "Ce qui m'occupe le plus l'esprit", sub: "La question d'ouverture" },
  { id: "d1",          title: "Discussion 1 · Le déroulé",    sub: "Vos expériences du changement" },
  { id: "ingredients", title: "Discussion 1 · Nos retours",   sub: "Nos 3 ingrédients du changement", chef: true },
  { id: "phase",       title: "Où j'en suis ?", sub: "Face à l'IA et à la transformation du pôle Notaire" },
  { id: "d2",          title: "Discussion 2 · Le déroulé",    sub: "Et nous, face à l'IA et à la transformation ?" },
  { id: "pratiques",   title: "Discussion 2 · Nos retours",   sub: "Nos 2 pratiques les plus utiles", chef: true },
  { id: "pas",         title: "Mon premier petit pas",        sub: "Je le garde pour moi" }
];
const IDS = STEPS.map((x) => x.id);
const PHASES = [
  { id: 1, name: "Choc et déni", quote: "« L'IA, c'est pour les autres. »",
    think: ["« Encore une mode, ça va passer. »", "« Nos clients ne demandent pas d'IA. »", "« L'Intelligence Métier, c'est surtout un slogan. »"] },
  { id: 2, name: "Colère et peur", quote: "« Et moi, dans tout ça ? »",
    think: ["« Si l'IA fait ce que je sais faire, à quoi je sers ? »", "« Peut-on confier les données de nos clients à une IA ? »", "« On nous l'impose sans nous demander notre avis. »"] },
  { id: 3, name: "Le creux", quote: "« J'ai essayé, et maintenant ? »",
    think: ["« Je ne vois pas encore ce que ça m'apporte. »", "« Trop d'outils, trop vite, je sature. »", "« Je ne sais pas quel est mon rôle dans cette stratégie. »"] },
  { id: 4, name: "Rebond et sens", quote: "« Je vois ce que ça change pour moi et pour nos clients. »",
    think: ["« Ça me fait gagner du temps sur une tâche précise. »", "« J'ai des idées pour faire évoluer nos produits. »", "« Je peux expliquer notre direction avec mes mots. »"] }
];
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const saved = LS.get("mc-state") || {};
const st = { view: IDS.includes(saved.view) ? saved.view : "home", phase: saved.phase || null, active: null, group: saved.group || "" };
// Une seule session en direct : l'animatrice exporte puis vide entre deux ateliers
st.session = new URLSearchParams(location.search).get("session") === "TEST" ? "TEST" : "LIVE";
let client = LS.get("mc-client");
if (!client) { client = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); LS.set("mc-client", client); }
const save = () => LS.set("mc-state", { view: st.view, phase: st.phase, group: st.group });
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Navigation par pavés ---------------------------------------------
function renderTiles() {
  $("#tiles").innerHTML = STEPS.map((x, i) =>
    `<button type="button" class="tile${x.chef ? " chef" : ""}${st.active === x.id ? " live" : ""}" data-v="${x.id}">
      <span class="n">${i + 1}</span><span class="t"><b>${x.title}</b><small>${x.chef ? "Chef de groupe · " : ""}${x.sub}</small></span><span class="go">›</span></button>`).join("");
  $$("#tiles .tile").forEach((b) => b.addEventListener("click", () => go(b.dataset.v)));
}
function render() {
  $$("section.panel").forEach((s) => (s.hidden = s.dataset.view !== st.view));
  $("#back").hidden = st.view === "home";
  renderTiles();
}
function go(v) { st.view = v; save(); render(); window.scrollTo({ top: 0 }); }
$("#back").addEventListener("click", () => go("home"));

// Numéro de sous-groupe : liste fermée, mémorisée pour les deux pavés du chef
$$("select.group").forEach((sel) => {
  sel.innerHTML = '<option value="">Choisir</option>' + Array.from({ length: 18 }, (_, i) => `<option>${i + 1}</option>`).join("");
  sel.value = st.group;
  sel.addEventListener("change", () => { st.group = sel.value; save(); $$("select.group").forEach((o) => (o.value = st.group)); });
});

// Envoi ------------------------------------------------------------
async function send(payload) {
  const r = await fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, session: st.session, client }) });
  if (!r.ok) throw new Error("send");
}
$$("form.send").forEach((f) => f.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $(".status", f), btn = $("button", f);
  const items = $$("textarea,input", f).map((x) => x.value.trim()).filter(Boolean);
  const group = $(".group", f)?.value || "";
  if (f.hasAttribute("data-group") && !group) { status.className = "status err"; status.textContent = "Choisissez d'abord le numéro de votre sous-groupe."; return; }
  if (!items.length) { status.className = "status err"; status.textContent = "Écrivez au moins une réponse."; return; }
  btn.disabled = true;
  try {
    await send({ moment: f.dataset.moment, items, group });
    status.className = "status"; status.textContent = "Merci, c'est envoyé.";
    $$("textarea,input", f).forEach((x) => (x.value = ""));
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
  $("#c-pos").textContent = st.phase ? "Ma phase aujourd'hui : " + PHASES[st.phase - 1].name : "Phase à choisir dans « Où j'en suis »";
  drawMini();
}
async function pickPhase(id) {
  const s = $("#phaseStatus");
  st.phase = id; save(); renderPhases();
  try { await send({ moment: "phase", phase: id }); s.className = "status"; s.textContent = "C'est noté. Vous pouvez changer d'avis à tout moment."; }
  catch { s.className = "status err"; s.textContent = "L'envoi n'a pas marché. Touchez à nouveau votre phase."; }
}

// Petit pas (reste sur le téléphone) --------------------------------
const F = ["what", "when"], PH = { what: "Tester l'IA pour préparer la synthèse de mon point d'équipe", when: "Choisissez une date" };
const pad2 = (n) => String(n).padStart(2, "0");
const isoDay = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const frDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); };
$("#f-when").min = isoDay(new Date());
const draft = LS.get("mc-pas") || {};
F.forEach((k) => { const i = $("#f-" + k); if (draft[k] && (k !== "when" || /^\d{4}-\d{2}-\d{2}$/.test(draft[k]))) i.value = draft[k]; i.addEventListener("input", upd); i.addEventListener("change", upd); });
function upd() {
  const d = {};
  F.forEach((k) => { const v = $("#f-" + k).value.trim(); d[k] = v; const dd = $("#c-" + k); dd.textContent = (k === "when" ? frDate(v) : v) || PH[k]; dd.classList.toggle("empty", !v); });
  LS.set("mc-pas", d);
}
// La courbe sur la carte : même tracé, en version claire sur fond bleu nuit
function drawMini() {
  const svg = $("#miniCurve"); if (!svg) return; svg.innerHTML = "";
  PHASES.forEach((p, i) => {
    const pts = CURVE.filter((c) => c[0] >= BOUNDS[i] - 3 && c[0] <= BOUNDS[i + 1] + 3);
    svg.appendChild(el("path", { d: "M" + pts.map((c) => c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" L"), fill: "none", "stroke-linecap": "round",
      stroke: st.phase === p.id ? "#FF6136" : "rgba(185,204,255,.45)", "stroke-width": st.phase === p.id ? 12 : 8 }));
    const t = el("text", { x: (BOUNDS[i] + BOUNDS[i + 1]) / 2, y: 318, "text-anchor": "middle", "font-family": "Poppins, sans-serif", "font-size": 26, "font-weight": 600, fill: st.phase === p.id ? "#FF6136" : "#B9CCFF" });
    t.textContent = ["Choc", "Colère", "Creux", "Rebond"][i]; svg.appendChild(t);
  });
  if (st.phase) {
    const seg = CURVE.filter((c) => c[0] >= BOUNDS[st.phase - 1] && c[0] <= BOUNDS[st.phase]); const m = seg[Math.floor(seg.length / 2)];
    svg.appendChild(el("circle", { cx: m[0], cy: m[1], r: 15, fill: "#FF6136", stroke: "#fff", "stroke-width": 4 }));
    const t = el("text", { x: m[0], y: m[1] - 28, "text-anchor": "middle", "font-family": "Poppins, sans-serif", "font-size": 26, "font-weight": 700, fill: "#fff" });
    t.textContent = "Moi"; svg.appendChild(t);
  }
}
// Garder son petit pas : mail ou image. Rien ne passe par notre serveur.
function cardText() {
  const lines = ["Mon premier petit pas"];
  if (st.phase) lines.push("Ma phase face à l'IA et à la transformation du pôle Notaire : " + PHASES[st.phase - 1].name + " (phase " + st.phase + " sur 4)");
  const w = $("#f-what").value.trim(), q = $("#f-when").value;
  if (w) lines.push("Je vais : " + w);
  if (q) lines.push("Quand : " + frDate(q));
  lines.push("", "Atelier conduite du changement · Septeo Notaires");
  return lines.join("\n");
}
function ready() {
  if ($("#f-what").value.trim()) return true;
  $("#toast").textContent = "Écrivez d'abord votre petit pas dans « Je vais… ».";
  $("#f-what").focus(); return false;
}
$("#mailBtn").addEventListener("click", () => {
  if (!ready()) return;
  location.href = "mailto:?subject=" + encodeURIComponent("Mon premier petit pas") + "&body=" + encodeURIComponent(cardText());
  $("#toast").textContent = "Votre messagerie s'ouvre : mettez votre adresse et envoyez.";
});
// La carte en image (1080 × 1350) : courbe + engagement
function wrap(ctx, text, maxW) {
  const words = text.split(/\s+/), lines = []; let line = "";
  words.forEach((w) => { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line); return lines;
}
async function cardImage() {
  try { await document.fonts.ready; } catch {}
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"), F1 = "Poppins, 'Segoe UI', sans-serif";
  x.fillStyle = "#2E3862"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#B9CCFF"; x.font = `600 30px ${F1}`; x.fillText("MON PREMIER PETIT PAS", 80, 120);
  x.fillStyle = "#fff"; x.font = `700 54px ${F1}`; x.fillText("Ma courbe face à l'IA", 80, 190);
  const ox = 80, oy = 250, sx = (W - 160) / 1000, sy = 1.1;
  PHASES.forEach((p, i) => {
    const pts = CURVE.filter((q) => q[0] >= BOUNDS[i] - 3 && q[0] <= BOUNDS[i + 1] + 3);
    x.beginPath(); pts.forEach((q, k) => { const X = ox + q[0] * sx, Y = oy + q[1] * sy; k ? x.lineTo(X, Y) : x.moveTo(X, Y); });
    x.lineCap = "round"; x.lineWidth = st.phase === p.id ? 14 : 9; x.strokeStyle = st.phase === p.id ? "#FF6136" : "rgba(185,204,255,.45)"; x.stroke();
    x.fillStyle = st.phase === p.id ? "#FF6136" : "#B9CCFF"; x.font = `600 28px ${F1}`; x.textAlign = "center";
    x.fillText(["Choc", "Colère", "Creux", "Rebond"][i], ox + ((BOUNDS[i] + BOUNDS[i + 1]) / 2) * sx, oy + 330 * sy); x.textAlign = "left";
  });
  if (st.phase) {
    const seg = CURVE.filter((q) => q[0] >= BOUNDS[st.phase - 1] && q[0] <= BOUNDS[st.phase]); const m = seg[Math.floor(seg.length / 2)];
    const X = ox + m[0] * sx, Y = oy + m[1] * sy;
    x.beginPath(); x.arc(X, Y, 18, 0, Math.PI * 2); x.fillStyle = "#FF6136"; x.fill(); x.lineWidth = 5; x.strokeStyle = "#fff"; x.stroke();
    x.fillStyle = "#fff"; x.font = `700 30px ${F1}`; x.textAlign = "center"; x.fillText("Moi", X, Y - 34); x.textAlign = "left";
    x.fillStyle = "#FF6136"; x.font = `600 34px ${F1}`; x.fillText("Ma phase aujourd'hui : " + PHASES[st.phase - 1].name, 80, 700);
  }
  let y = 800;
  x.fillStyle = "#B9CCFF"; x.font = `600 26px ${F1}`; x.fillText("JE VAIS", 80, y); y += 56;
  x.fillStyle = "#fff"; x.font = `500 42px ${F1}`;
  wrap(x, $("#f-what").value.trim(), W - 160).slice(0, 5).forEach((l) => { x.fillText(l, 80, y); y += 56; });
  const q = $("#f-when").value;
  if (q) { y += 30; x.fillStyle = "#B9CCFF"; x.font = `600 26px ${F1}`; x.fillText("QUAND", 80, y); y += 56; x.fillStyle = "#fff"; x.font = `500 42px ${F1}`; x.fillText(frDate(q), 80, y); }
  x.fillStyle = "#B9CCFF"; x.font = `400 24px ${F1}`; x.fillText("Atelier conduite du changement · Septeo Notaires", 80, H - 70);
  return new Promise((res) => c.toBlob(res, "image/png"));
}
$("#shareBtn").addEventListener("click", async () => {
  if (!ready()) return;
  const toast = $("#toast"), blob = await cardImage(), file = new File([blob], "mon-petit-pas.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Mon premier petit pas", text: cardText() }); toast.textContent = "Carte partagée."; return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mon-petit-pas.png"; document.body.appendChild(a); a.click(); a.remove();
  toast.textContent = "Image téléchargée : retrouvez-la dans vos photos ou vos téléchargements.";
});
$("#stepForm").addEventListener("submit", (e) => e.preventDefault());

// Étape pilotée par l'animatrice ----------------------------------
const TITLE = Object.fromEntries(STEPS.map((x) => [x.id, x.title]));
async function poll() {
  try {
    const r = await fetch("/api/state?session=" + st.session, { cache: "no-store" });
    if (!r.ok) return;
    const { active } = await r.json();
    if (active && active !== st.active && IDS.includes(active)) {
      st.active = active; go(active);
      const b = $("#banner"); b.hidden = false; b.textContent = "C'est le moment : " + TITLE[active];
    } else if (!active && st.active) { st.active = null; $("#banner").hidden = true; renderTiles(); }
  } catch {}
}
setInterval(poll, 5000);

render(); renderPhases(); upd(); poll();
