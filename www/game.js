/* La Jaiba — Capítulo 1: La casa de los Carrera (1795)
   Juego táctil de apuntar y tocar. Lienzo lógico de 270 px de alto; el ancho se adapta a la pantalla. */
"use strict";
(() => {
const ASSET = window.JAIBA_ASSETS || {};
const src = name => ASSET[name] || `assets/${name}`;

const H = 270, FLOOR = 230, WORLD_W = 1440, FW = 64, FH = 48;
const $ = id => document.getElementById(id);
const canvas = $("game"), ctx = canvas.getContext("2d");
let VW = 480, scale = 1;

// ------------------------------------------------------------- recursos
const IMG = {};
const NAMES = ["casa.png", "javiera_adolescente.png", "npc_perro.png", "npc_nieta.png",
  "item_trompo.png", "item_soldadito.png", "item_honda.png", "item_llave.png", "item_nota.png"];
function loadAll() {
  return Promise.all(NAMES.map(n => new Promise(res => {
    const i = new Image(); i.onload = () => res(); i.onerror = () => res(); i.src = src(n); IMG[n] = i;
  })));
}
document.querySelectorAll("img").forEach(im => {
  const m = (im.getAttribute("src") || "").match(/assets\/(.+)$/); if (m && ASSET[m[1]]) im.src = ASSET[m[1]];
});

// ------------------------------------------------------------- guardado
const SAVE_KEY = "jaiba.cap1";
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null") } catch (e) { return null } },
  set(v) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(v)) } catch (e) {} },
  clear() { try { localStorage.removeItem(SAVE_KEY) } catch (e) {} },
};
let soundOn = true; try { soundOn = localStorage.getItem("jaiba.sound") !== "0" } catch (e) {}

// ------------------------------------------------------------- sonido (sintetizado)
let AC = null;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)() } catch (e) {} } if (AC && AC.state === "suspended") AC.resume(); return AC }
function tone(freq, dur, type = "square", vol = .06, when = 0, slide = 0) {
  if (!soundOn) return; const a = audio(); if (!a) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
const sfx = {
  tap: () => tone(660, .05, "square", .03),
  talk: () => tone(420 + Math.random() * 120, .03, "triangle", .025),
  found: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, "square", .05, i * .09)),
  wrong: () => tone(200, .22, "sawtooth", .04, 0, -60),
  bark: () => { tone(300, .08, "square", .05, 0, -120); tone(280, .08, "square", .05, .14, -120) },
  win: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, .18, "square", .05, i * .12)),
  page: () => tone(900, .08, "triangle", .03, 0, -400),
};

// ------------------------------------------------------------- textos del capítulo
const PEOPLE = {
  nieta: { name: "La nieta · 1862", sheet: "npc_nieta.png", sx: 16, sy: 0 },
  javiera: { name: "Javiera", sheet: "javiera_adolescente.png", sx: 16, sy: 0 },
  pancho: { name: "Pancho", sheet: "npc_perro.png", sx: 26, sy: 14 },
  papa: { name: "Voz de papá", sheet: null },
};
const ITEMS = [
  { id: "trompo", name: "El trompo de Luis", icon: "item_trompo.png", spot: "naranjo",
    riddle: "En el patio, junto al agua,\nun árbol huele a azahar.\nBusca a sus pies, hermana:\nalgo gira sin parar.",
    found: "¡El trompo de Luis! Y tiene otra nota amarrada a la cuerda.",
    hints: ["Pancho estornuda: huele a flores. ¿Qué árbol tiene flores de azahar?",
            "El azahar es la flor del naranjo. Busca en el patio, cerca de la pila.",
            "Pancho corre al naranjo y escarba en el macetero."] },
  { id: "soldadito", name: "El soldadito de José Miguel", icon: "item_soldadito.png", spot: "cantaro",
    riddle: "Tiene barriga y no come,\ntiene boca y no habla.\nEn la cocina se esconde\ny guarda el agua clara.",
    found: "¡El soldadito de plomo de José Miguel! Siempre jugando a la guerra, ese niño...",
    hints: ["Pancho se lame el hocico: tiene sed. ¿Dónde se guarda el agua?",
            "Está en la cocina. Es de greda, con barriga y boca.",
            "Pancho ladra junto al cántaro de greda."] },
  { id: "honda", name: "La honda de Juan José", icon: "item_honda.png", spot: "estrado",
    riddle: "Más alto que el suelo,\nmás bajo que una silla:\nallí bordan las señoras\ny conversa la familia.",
    found: "¡La honda de Juan José! Menos mal que no la usó con las gallinas.",
    hints: ["Pancho bosteza: quiere echarse sobre algo blandito.",
            "Está en la sala: una tarima con alfombra y cojines.",
            "Pancho se sube al estrado y husmea los cojines."] },
  { id: "llave", name: "La llave del despacho", icon: "item_llave.png", spot: "brasero",
    riddle: "Calienta sin ser el sol,\nes de cobre y guarda brasas.\nEn invierno es el señor\ndel calor de nuestra casa.",
    found: "¡La llave del despacho! Estaba entre las cenizas frías del brasero.",
    hints: ["Pancho tirita de frío. ¿Qué calienta la casa en invierno?",
            "Es de cobre y está en la sala, cerca de la ventana.",
            "Pancho apunta con el hocico al brasero."] },
];
const FACTS = {
  casa: { title: "La casa colonial", icon: null, text: "Las casas de Santiago se hacían de adobe, con muros gruesos, techos de teja y patios interiores. Eran frescas en verano." },
  naranjo: { title: "El patio", icon: "item_trompo.png", text: "El patio era el centro de la casa: tenía árboles frutales, flores y una pila de agua. Los niños jugaban ahí con trompos y volantines." },
  cantaro: { title: "El cántaro de greda", icon: "item_soldadito.png", text: "El agua se guardaba fresca en cántaros de greda. Todavía se fabrican en Pomaire, cerca de Santiago." },
  estrado: { title: "El estrado", icon: "item_honda.png", text: "Era una tarima con alfombra y cojines. Allí las mujeres de la casa bordaban, rezaban y recibían visitas, sentadas en el suelo." },
  brasero: { title: "El brasero", icon: "item_llave.png", text: "Las casas no tenían estufas: en invierno se calentaban con braseros de cobre llenos de carbón encendido." },
  cordillera: { title: "La cordillera de los Andes", icon: null, text: "Separa Chile de Argentina. En 1814, Javiera cruzaría estas montañas con sus hermanos rumbo al exilio." },
  tertulia: { title: "Las tertulias", icon: null, text: "Eran reuniones en las casas para conversar de noticias, libros y política. En ellas nacieron muchas ideas de independencia." },
};
const DECOY = {
  fogon: "El fogón de la cocina. Aquí se cocinan la cazuela y el pan amasado. ¡Quema! Mejor no meter la mano.",
  despensa: "Ristras de ají y de ajo secándose. Huele tan fuerte que a Pancho le lloran los ojos.",
  ventanaC: "Por la ventana se ve la acequia que trae el agua a la casa.",
  fuente: "La pila del patio. A veces Pancho se mete a nadar... y después se sacude en la sala.",
  cardenales: "Los cardenales de mamá. Ningún juguete, solo una abeja muy ocupada.",
  cordillera: "La cordillera de los Andes. Se ve tan cerca... Algún día me gustaría saber qué hay al otro lado.",
  retrato: "El retrato del abuelo. Parece que me mira... ¿o será mi imaginación?",
  ventanaS: "Por la ventana pasa una carreta tirada por bueyes. ¡Qué lenta va!",
  baul: "El baúl de la familia. Algún día guardaré aquí mis propios recuerdos.",
  early: "Mmm... aquí parece haber algo. Pero las notas de mis hermanos van en orden: primero resuelvo la que tengo.",
  done: "Aquí ya no queda nada más.",
};

// zonas tocables, en coordenadas del mundo
const SPOTS = [
  { id: "ventanaC", x0: 14, x1: 62, y0: 64, y1: 118, decoy: true },
  { id: "fogon", x0: 70, x1: 180, y0: 86, y1: 230, decoy: true },
  { id: "cantaro", x0: 208, x1: 262, y0: 164, y1: 232 },
  { id: "despensa", x0: 300, x1: 386, y0: 70, y1: 230, decoy: true },
  { id: "naranjo", x0: 484, x1: 566, y0: 72, y1: 232 },
  { id: "cordillera", x0: 590, x1: 880, y0: 76, y1: 112, decoy: true, fact: "cordillera" },
  { id: "fuente", x0: 612, x1: 728, y0: 140, y1: 240, decoy: true },
  { id: "cardenales", x0: 766, x1: 848, y0: 176, y1: 232, decoy: true },
  { id: "estrado", x0: 924, x1: 1122, y0: 164, y1: 234 },
  { id: "retrato", x0: 1120, x1: 1174, y0: 58, y1: 122, decoy: true },
  { id: "ventanaS", x0: 1176, x1: 1230, y0: 66, y1: 134, decoy: true },
  { id: "brasero", x0: 1232, x1: 1298, y0: 178, y1: 232 },
  { id: "baul", x0: 1306, x1: 1374, y0: 182, y1: 232, decoy: true },
  { id: "puerta", x0: 1374, x1: 1440, y0: 84, y1: 232 },
];
const spotById = id => SPOTS.find(s => s.id === id);

// ------------------------------------------------------------- estado
let S;
function freshState(mode) {
  return { step: 0, hints: 0, hintLevel: 0, wrong: 0, facts: ["casa"], mode: mode || "facil", started: Date.now(), elapsed: 0, done: false };
}
const jav = { x: 560, face: 1, target: null, onArrive: null, anim: "idle", t: 0, busy: 0 };
const dog = { x: 520, face: 1, target: null, anim: "sit", t: 0, idle: 0, bark: 0 };
let camX = 300, mode = "title", time = 0, taps = [], pop = null, sparkles = [], hintGlow = null;

// ------------------------------------------------------------- tamaño de pantalla
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  VW = Math.round(Math.min(640, Math.max(360, H * w / h)));
  canvas.width = VW; canvas.height = H;
  scale = Math.min(h / H, w / VW);
  canvas.style.width = Math.floor(VW * scale) + "px"; canvas.style.height = Math.floor(H * scale) + "px";
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 200));

// ------------------------------------------------------------- dibujo
function frame(sheet, row, f, x, face) {
  const im = IMG[sheet]; if (!im || !im.width) return;
  const sx = Math.round(x - camX), y = FLOOR - 45;
  if (face < 0) { ctx.save(); ctx.translate(sx, 0); ctx.scale(-1, 1); ctx.drawImage(im, f * FW, row * FH, FW, FH, -32, y, FW, FH); ctx.restore() }
  else ctx.drawImage(im, f * FW, row * FH, FW, FH, sx - 32, y, FW, FH);
}
function sparkle(x, y, s, a) {
  const X = Math.round(x - camX), Y = Math.round(y);
  ctx.globalAlpha = a; ctx.fillStyle = "#fff8d6";
  ctx.fillRect(X - s, Y, s * 2 + 1, 1); ctx.fillRect(X, Y - s, 1, s * 2 + 1);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(X - 1, Y - 1, 3, 3); ctx.globalAlpha = 1;
}
function drawWorld(dt) {
  const bg = IMG["casa.png"];
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, VW, H);
  if (bg && bg.width) ctx.drawImage(bg, Math.round(camX), 0, VW, H, 0, 0, VW, H);
  // fuego del fogón
  if (camX < 200) {
    for (let i = 0; i < 6; i++) {
      const fx = 108 + i * 7, fh = 8 + Math.abs(Math.sin(time * 9 + i * 1.7)) * 12;
      ctx.fillStyle = i % 2 ? "#f0902a" : "#e5503a"; ctx.fillRect(Math.round(fx - camX), Math.round(228 - fh), 6, Math.round(fh));
      ctx.fillStyle = "#ffd08a"; ctx.fillRect(Math.round(fx + 2 - camX), Math.round(228 - fh * .45), 2, Math.round(fh * .45));
    }
  }
  // agua de la pila
  if (camX < 760 && camX + VW > 600) {
    ctx.fillStyle = "#cfe6f2";
    for (let i = 0; i < 4; i++) {
      const p = (time * .9 + i / 4) % 1; const side = i % 2 ? 1 : -1;
      ctx.fillRect(Math.round(670 + side * (6 + p * 14) - camX), Math.round(156 + p * p * 50), 1, 2);
    }
  }
  // brillos de ayuda (modo fácil)
  for (const s of sparkles) { s.t += dt; const a = Math.sin(Math.min(1, s.t / .8) * Math.PI); sparkle(s.x, s.y, 3, a) }
  sparkles = sparkles.filter(s => s.t < .8);
  if (hintGlow) { const sp = spotById(hintGlow); const k = (Math.sin(time * 6) + 1) / 2;
    sparkle((sp.x0 + sp.x1) / 2, sp.y0 + 8, 4 + k * 3, .6 + k * .4); sparkle(sp.x0 + 6, (sp.y0 + sp.y1) / 2, 3, k); sparkle(sp.x1 - 6, sp.y1 - 12, 3, 1 - k) }
  // personajes (el perro detrás si está a la izquierda)
  const dRow = { walk: 0, run: 1, sit: 2, lie: 3, bark: 5 }[dog.anim] ?? 2;
  let dF;
  if (dog.anim === "walk" || dog.anim === "run") dF = Math.floor(dog.t * (dog.anim === "run" ? 14 : 10)) % 6;
  else if (dog.anim === "sit") dF = Math.min(3, 2 + Math.floor(dog.t * .5) % 2);
  else if (dog.anim === "lie") dF = Math.min(3, Math.floor(dog.t * 2)) ;
  else dF = Math.floor(dog.t * 6) % 4;
  frame("npc_perro.png", dRow, dF, dog.x, dog.face);
  let jRow = 0, jF = 0;
  if (jav.anim === "walk") jF = Math.floor(jav.t * 10) % 6;
  else if (jav.anim === "run") { jRow = 1; jF = Math.floor(jav.t * 14) % 6 }
  else if (jav.anim === "crouch") { jRow = 2; jF = 1 }
  else if (jav.anim === "read") { jRow = 4; jF = 1 + Math.floor(jav.t * 1.5) % 3 }
  frame("javiera_adolescente.png", jRow, jF, jav.x, jav.face);
  // objeto encontrado que sube
  if (pop) {
    pop.t += dt; const im = IMG[pop.icon]; const k = Math.min(1, pop.t / .6);
    const y = FLOOR - 52 - k * 18, x = Math.round(jav.x - camX - 8);
    for (let i = 0; i < 6; i++) { const a = time * 3 + i * Math.PI / 3; sparkle(jav.x + Math.cos(a) * 14, y + 8 + Math.sin(a) * 12, 2, .9) }
    if (im && im.width) ctx.drawImage(im, x, Math.round(y), 16, 16);
  }
  // toques
  for (const t of taps) { t.t += dt; const r = 2 + t.t * 14; ctx.globalAlpha = Math.max(0, 1 - t.t * 2.5); ctx.strokeStyle = "#fff8d6";
    ctx.strokeRect(Math.round(t.x - camX - r), Math.round(t.y - r / 2), Math.round(r * 2), Math.round(r)); ctx.globalAlpha = 1 }
  taps = taps.filter(t => t.t < .4);
}

// ------------------------------------------------------------- lógica
function walkTo(x, cb) {
  const maxX = S.step >= 4 ? 1414 : 1356;
  jav.target = Math.max(22, Math.min(maxX, x)); jav.onArrive = cb || null;
  if (Math.abs(jav.target - jav.x) < 2 && cb) { jav.target = null; jav.onArrive = null; cb() }
}
function update(dt) {
  time += dt;
  if (mode === "play" || mode === "dialog") S.elapsed += dt;
  // Javiera
  jav.t += dt;
  if (jav.busy > 0) { jav.busy -= dt; if (jav.busy <= 0 && jav.anim === "crouch") jav.anim = "idle" }
  else if (jav.target != null) {
    const dx = jav.target - jav.x, far = Math.abs(dx) > 150;
    const sp = (far ? 135 : 72) * dt;
    jav.face = dx < 0 ? -1 : 1; jav.anim = far ? "run" : "walk";
    if (Math.abs(dx) <= sp) { jav.x = jav.target; jav.target = null; jav.anim = "idle"; const cb = jav.onArrive; jav.onArrive = null; if (cb) cb() }
    else jav.x += Math.sign(dx) * sp;
  } else if (jav.anim !== "read" && jav.anim !== "crouch") jav.anim = "idle";
  // Pancho sigue a Javiera
  dog.t += dt;
  if (dog.bark > 0) { dog.bark -= dt; if (dog.bark <= 0) { dog.anim = "sit"; dog.t = 0 } }
  else {
    const goal = dog.target != null ? dog.target : jav.x - 30 * jav.face;
    const dx = goal - dog.x;
    if (Math.abs(dx) > (dog.target != null ? 2 : 12)) {
      const run = Math.abs(dx) > 60, sp = (run ? 150 : 76) * dt;
      if (dog.anim !== (run ? "run" : "walk")) { dog.anim = run ? "run" : "walk" }
      dog.face = dx < 0 ? -1 : 1; dog.x += Math.sign(dx) * Math.min(sp, Math.abs(dx)); dog.idle = 0;
    } else {
      if (dog.target != null) { dog.target = null; dog.anim = "bark"; dog.bark = 1.2; dog.t = 0; sfx.bark() }
      else {
        dog.idle += dt;
        if (dog.anim === "walk" || dog.anim === "run") { dog.anim = "sit"; dog.t = 0; dog.face = jav.x > dog.x ? 1 : -1 }
        if (dog.idle > 9 && dog.anim !== "lie") { dog.anim = "lie"; dog.t = 0 }
      }
    }
  }
  // cámara
  const want = Math.max(0, Math.min(WORLD_W - VW, jav.x - VW / 2));
  camX += (want - camX) * Math.min(1, dt * 5);
  // brillos de ayuda
  if (mode === "play" && S.mode === "facil" && Math.random() < dt * .7) {
    const pool = SPOTS.filter(s => s.id !== "cordillera");
    const sp = pool[Math.floor(Math.random() * pool.length)];
    if (sp.x1 > camX && sp.x0 < camX + VW) sparkles.push({ x: sp.x0 + Math.random() * (sp.x1 - sp.x0), y: sp.y0 + Math.random() * (sp.y1 - sp.y0) * .6, t: 0 });
  }
}

function tapWorld(lx, ly) {
  if (mode !== "play" || jav.busy > 0) return;
  const wx = lx + camX, wy = ly;
  sfx.tap(); taps.push({ x: wx, y: wy, t: 0 });
  // ¿tocó a Pancho?
  if (Math.abs(wx - dog.x) < 16 && wy > FLOOR - 26 && wy < FLOOR + 4) { askHint(); return }
  const sp = SPOTS.find(s => wx >= s.x0 && wx <= s.x1 && wy >= s.y0 && wy <= s.y1);
  if (sp) {
    const cx = (sp.x0 + sp.x1) / 2;
    let stand = sp.id === "puerta" ? 1350 : (jav.x < cx ? sp.x0 - 6 : sp.x1 + 6);
    if (sp.id === "cordillera" || sp.id === "retrato" || sp.id.startsWith("ventana")) stand = Math.max(sp.x0 + 10, Math.min(sp.x1 - 10, jav.x));
    if (sp.id === "estrado" || sp.id === "fuente" || sp.id === "fogon" || sp.id === "despensa") stand = jav.x < cx ? sp.x0 + 4 : sp.x1 - 4;
    walkTo(stand, () => { jav.face = cx >= jav.x ? 1 : -1; interact(sp) });
  } else if (wy > 120) walkTo(wx);
}

function interact(sp) {
  if (sp.id === "puerta") {
    if (S.step >= 4) return openStudy();
    return say([["javiera", S.step === 3 ? "Cerrada con llave. La última nota dice dónde está..." : "La puerta del despacho de papá está cerrada con llave."]]);
  }
  const idx = ITEMS.findIndex(it => it.spot === sp.id);
  if (idx >= 0) {
    if (idx === S.step) return findItem(idx);
    if (idx < S.step) return say([["javiera", DECOY.done]]);
    return say([["javiera", DECOY.early]]);
  }
  if (sp.fact && !S.facts.includes(sp.fact)) { S.facts.push(sp.fact); save(); toast("Nuevo en el diario: " + FACTS[sp.fact].title) }
  say([["javiera", DECOY[sp.id]]]);
}

function findItem(i) {
  const it = ITEMS[i];
  jav.anim = "crouch"; jav.busy = .7; hintGlow = null;
  setTimeout(() => {
    sfx.found(); pop = { icon: it.icon, t: 0 };
    S.step = i + 1; S.hintLevel = 0; if (!S.facts.includes(it.spot)) S.facts.push(it.spot); save(); renderSlots(true);
    setTimeout(() => {
      pop = null;
      toast("Nuevo en el diario: " + FACTS[it.spot].title);
      const lines = [["javiera", it.found]];
      if (i < 3) say(lines, () => showNote(i + 1));
      else say(lines.concat([["javiera", "Ahora... a la puerta del despacho, sin que nadie me vea."]]), () => { updateNoteBtn() });
    }, 1100);
  }, 650);
}

function askHint() {
  if (mode !== "play") return;
  if (S.step >= 4) return say([["pancho", "¡Guau! (Pancho mira la puerta del despacho y mueve la cola.)"]], () => { dog.target = 1330 });
  const it = ITEMS[S.step], lvl = Math.min(2, S.hintLevel);
  S.hints++; S.hintLevel++; save();
  dog.anim = "bark"; dog.bark = 1.0; dog.t = 0; sfx.bark();
  say([["pancho", it.hints[lvl]]], () => {
    if (lvl === 2) { const sp = spotById(it.spot); dog.target = (sp.x0 + sp.x1) / 2 - 10; hintGlow = it.spot }
  });
}

// ------------------------------------------------------------- diálogos
let dlgQueue = [], dlgDone = null, typing = null;
function say(lines, done) {
  dlgQueue = lines.slice(); dlgDone = done || null; mode = "dialog"; $("dialog").hidden = false; nextLine();
}
function drawPortrait(who) {
  const p = PEOPLE[who], c = $("portrait"), x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 32, 32);
  if (p.sheet && IMG[p.sheet]) x.drawImage(IMG[p.sheet], p.sx, p.sy, 32, 32, 0, 0, 32, 32);
  else { x.fillStyle = "#3a3440"; x.fillRect(0, 0, 32, 32); x.fillStyle = "#e5b53a"; x.fillRect(12, 8, 8, 12); x.fillRect(14, 22, 4, 4) }
}
function nextLine() {
  if (typing) { clearInterval(typing.id); $("dlgText").textContent = typing.full; typing = null; return }
  const l = dlgQueue.shift();
  if (!l) { $("dialog").hidden = true; mode = "play"; const d = dlgDone; dlgDone = null; if (d) d(); return }
  const [who, text] = l; $("dlgName").textContent = PEOPLE[who].name; drawPortrait(who);
  const el = $("dlgText"); el.textContent = ""; let i = 0;
  typing = { full: text, id: setInterval(() => {
    i += 2; el.textContent = text.slice(0, i); if (i % 6 === 0) sfx.talk();
    if (i >= text.length) { clearInterval(typing.id); typing = null }
  }, 22) };
}
$("dialog").addEventListener("pointerup", e => { e.stopPropagation(); nextLine() });

let toastT = null;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600) }

// ------------------------------------------------------------- notas, diario, HUD
function showNote(i, reread) {
  const it = ITEMS[i]; mode = "modal"; jav.anim = "read"; jav.t = 0; sfx.page();
  $("noteTitle").textContent = i === 0 ? "Nota de tus hermanos" : (i === 3 ? "Última nota" : `Nota ${i + 1} de 4`);
  $("noteIntro").textContent = i === 0 && !reread ? "Hermana: escondimos nuestros juguetes por la casa. Si los encuentras todos, te diremos dónde está la llave del despacho de papá. ¡Esta noche hay tertulia!" :
    i === 3 ? "Lo prometido es deuda. La llave del despacho está escondida en..." : "Muy bien, hermana. El siguiente está en...";
  $("noteRiddle").textContent = it.riddle;
  $("noteSign").textContent = "— Juan José, José Miguel y Luis";
  $("noteClose").textContent = reread ? "Volver" : "A buscar";
  $("note").hidden = false; updateNoteBtn();
}
$("noteClose").addEventListener("click", () => { $("note").hidden = true; mode = "play"; jav.anim = "idle" });
function updateNoteBtn() { $("btnNote").hidden = S.step >= 4 }
$("btnNote").addEventListener("click", () => { if (mode === "play" && S.step < 4) showNote(S.step, true) });
$("btnHint").addEventListener("click", () => askHint());

function renderSlots(popLast) {
  const box = $("slots"); box.innerHTML = "";
  ITEMS.forEach((it, i) => {
    const d = document.createElement("div"); d.className = "slot" + (i < S.step ? " full" : "");
    if (i < S.step) { const im = document.createElement("img"); im.src = src(it.icon); im.alt = it.name; d.append(im); if (popLast && i === S.step - 1) d.classList.add("pop") }
    d.title = i < S.step ? it.name : "Por encontrar"; box.append(d);
  });
}
function openDiary() {
  if (mode !== "play") return; mode = "modal"; sfx.page();
  const list = $("diaryList"); list.innerHTML = "";
  const order = ["casa", "naranjo", "cantaro", "estrado", "brasero", "cordillera", "tertulia"];
  for (const k of order) {
    const f = FACTS[k], have = S.facts.includes(k);
    const e = document.createElement("div"); e.className = "entry" + (have ? "" : " locked");
    const ic = f.icon ? Object.assign(document.createElement("img"), { src: src(f.icon), alt: "" }) : Object.assign(document.createElement("div"), { className: "dot" });
    const b = document.createElement("div");
    b.innerHTML = `<b></b><p></p>`; b.querySelector("b").textContent = have ? f.title : "???";
    b.querySelector("p").textContent = have ? f.text : "Sigue explorando la casa para descubrir esta página.";
    e.append(ic, b); list.append(e);
  }
  $("diary").hidden = false;
}
$("btnDiary").addEventListener("click", openDiary);
$("diaryClose").addEventListener("click", () => { $("diary").hidden = true; mode = "play" });
function renderSound() {
  $("btnSound").innerHTML = soundOn
    ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 6h3l4-3v10l-4-3H2zM11 5h1v6h-1zM13 3h1v10h-1z"/></svg><span>Sonido</span>'
    : '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 6h3l4-3v10l-4-3H2zM11 6l1-1 1 1 1-1 1 1-1 1 1 1-1 1-1-1-1 1-1-1 1-1z"/></svg><span>Mudo</span>';
}
$("btnSound").addEventListener("click", () => { soundOn = !soundOn; try { localStorage.setItem("jaiba.sound", soundOn ? "1" : "0") } catch (e) {} renderSound(); sfx.tap() });

// ------------------------------------------------------------- la tertulia
const SENT = [
  { pre: "En el", word: "Cabildo", post: "los vecinos de Santiago discuten los asuntos de la ciudad." },
  { pre: "Chile es gobernado por la", word: "Capitanía", post: "General, en nombre de España." },
  { pre: "Y todos debemos obedecer al", word: "Rey", post: ", que vive al otro lado del mar." },
];
const TILES = ["Rey", "Presidente", "Cabildo", "Capitanía"];
let selTile = null, solved = 0;
function openStudy() {
  mode = "puzzle"; solved = 0; selTile = null;
  say([["javiera", "La llave gira... ¡clic! Papá y sus amigos conversan en el despacho. Me esconderé a escuchar."],
       ["papa", "...y les digo, señores, que en Santiago las cosas no pueden seguir así..."]], () => {
    mode = "puzzle";
    const ol = $("sentences"); ol.innerHTML = "";
    SENT.forEach((s, i) => {
      const li = document.createElement("li");
      li.append(document.createTextNode(s.pre + " "));
      const b = document.createElement("button"); b.type = "button"; b.className = "blank"; b.dataset.i = i; b.textContent = "?";
      b.addEventListener("click", () => place(b, s)); li.append(b);
      li.append(document.createTextNode((s.post.startsWith(",") ? "" : " ") + s.post)); ol.append(li);
    });
    const tl = $("tiles"); tl.innerHTML = "";
    TILES.forEach(w => {
      const t = document.createElement("button"); t.type = "button"; t.className = "tile"; t.textContent = w;
      t.addEventListener("click", () => { sfx.tap(); document.querySelectorAll(".tile").forEach(x => x.classList.remove("sel"));
        selTile = selTile === t ? null : t; if (selTile) t.classList.add("sel");
        document.querySelectorAll(".blank:not(.ok)").forEach(x => x.classList.toggle("ready", !!selTile)) });
      tl.append(t);
    });
    $("studyMsg").textContent = "Toca una palabra y luego un espacio.";
    $("puzzle").hidden = false;
  });
}
function place(blank, s) {
  if (!selTile || blank.classList.contains("ok")) return;
  const w = selTile.textContent;
  if (w === s.word) {
    sfx.found(); blank.textContent = w; blank.classList.add("ok"); selTile.classList.add("used"); selTile.classList.remove("sel"); selTile = null; solved++;
    document.querySelectorAll(".blank").forEach(x => x.classList.remove("ready"));
    $("studyMsg").textContent = ["¡Eso dijeron!", "¡Bien escuchado!", "¡Lo tienes!"][solved - 1];
    if (solved === 3) setTimeout(finishStudy, 900);
  } else {
    sfx.wrong(); S.wrong++; save(); blank.classList.remove("shake"); void blank.offsetWidth; blank.classList.add("shake");
    $("studyMsg").textContent = w === "Presidente" ? "¡Todavía no hay presidentes en Chile! Eso llegará después de la Independencia." : "Mmm, no fue eso lo que dijeron. ¡Escucha otra vez!";
    if (S.wrong % 3 === 0) $("studyMsg").textContent += " (Papá tose: «¿Quién anda ahí?»... ¡shh!)";
  }
}
function finishStudy() {
  $("puzzle").hidden = true; if (!S.facts.includes("tertulia")) S.facts.push("tertulia");
  S.done = true; save();
  say([["papa", "...algún día los chilenos decidirán su propio destino. Pero eso, señores, es peligroso decirlo en voz alta."],
       ["javiera", "¿Decidir nuestro propio destino? Nunca lo había pensado... Quiero saber más."],
       ["nieta", "Esa noche, detrás de una puerta, la abuela Javiera escuchó por primera vez hablar de libertad. Y nunca más dejó de pensar en ello."]], showEnd);
}
function showEnd() {
  mode = "end"; sfx.win(); $("hud").hidden = true;
  const m = Math.floor(S.elapsed / 60), s = Math.floor(S.elapsed % 60);
  $("stats").innerHTML = `<li>Tiempo <b>${m}:${String(s).padStart(2, "0")}</b></li><li>Pistas <b>${S.hints}</b></li><li>Páginas del diario <b>${S.facts.length}/7</b></li>`;
  const medals = [
    ["Buscadora", "Encontraste los 4 objetos", true],
    ["Sin pistas", "No le pediste ayuda a Pancho", S.hints === 0],
    ["Buen oído", "Tertulia sin errores", S.wrong === 0],
    ["Exploradora", "Llenaste todo el diario", S.facts.length >= 7],
  ];
  $("medals").innerHTML = medals.map(([t, d, on]) => `<div class="medal${on ? "" : " off"}"><i>${on ? "★" : "☆"}</i><b>${t}</b><span>${d}</span></div>`).join("");
  $("end").hidden = false; store.clear();
}

// ------------------------------------------------------------- inicio
function save() { store.set(S) }
function enterGame(state, intro) {
  S = state; $("title").hidden = true; $("end").hidden = true; $("hud").hidden = false;
  jav.x = 560; jav.face = 1; jav.target = null; jav.anim = "idle"; dog.x = 520; dog.anim = "sit"; dog.target = null;
  camX = Math.max(0, jav.x - VW / 2); hintGlow = null; pop = null;
  renderSlots(); renderSound(); updateNoteBtn(); mode = "play";
  if (intro) {
    say([["nieta", "Santiago, 1862. En el baúl de la abuela Javiera encontré un trompo viejo, una llave y una nota escrita por niños..."],
         ["nieta", "Ella siempre contaba que todo empezó un verano de 1795, cuando tenía catorce años."],
         ["javiera", "¿Dónde se metieron Juan José, José Miguel y Luis? Están demasiado callados... y eso es mala señal."],
         ["pancho", "¡Guau, guau!"],
         ["javiera", "¿Qué traes en el hocico, Pancho? ¡Una nota de mis hermanos!"]], () => showNote(0));
  } else if (S.step < 4) say([["javiera", "¿Dónde me había quedado? Ah, sí, la nota de mis hermanos."]], () => showNote(S.step, true));
}
async function goFull() {
  try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: "hide" }) } catch (e) {}
  try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape") } catch (e) {}
}
let chosenMode = "facil";
document.querySelectorAll(".mode-btn").forEach(b => b.addEventListener("click", () => {
  chosenMode = b.dataset.mode; document.querySelectorAll(".mode-btn").forEach(x => x.setAttribute("aria-pressed", x === b));
  $("modeHelp").textContent = chosenMode === "facil" ? "Los objetos brillan de vez en cuando para ayudarte." : "Nada brilla: tendrás que observar con ojo de jaiba.";
}));
$("btnPlay").addEventListener("click", () => { audio(); goFull(); store.clear(); enterGame(freshState(chosenMode), true) });
$("btnContinue").addEventListener("click", () => { audio(); goFull(); const s = store.get(); enterGame(s || freshState(chosenMode), !s) });
$("btnAgain").addEventListener("click", () => { $("end").hidden = true; $("title").hidden = false; mode = "title"; $("btnContinue").hidden = true });

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  tapWorld((e.clientX - r.left) / r.width * VW, (e.clientY - r.top) / r.height * H);
});
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("visibilitychange", () => { if (document.hidden && S) save() });

function drawTitleSprite() {
  const c = $("titleSprite"), x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 64, 48);
  const f = Math.floor(time * 3) % 4; const im = IMG["javiera_adolescente.png"];
  if (im && im.width) x.drawImage(im, f * FW, 4 * FH, FW, FH, 0, 0, FW, FH);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (mode === "title") { time += dt; drawTitleSprite() }
  else if (mode !== "end") { update(dt); drawWorld(dt) }
  requestAnimationFrame(loop);
}
// prueba automática: expone el estado si la URL trae #test
if (location.hash === "#test") window.__jaiba = { get S() { return S }, jav, dog, SPOTS, tapWorld, get mode() { return mode }, nextLine, get camX() { return camX }, get VW() { return VW } };

resize();
loadAll().then(() => {
  const s = store.get(); if (s && !s.done && s.step > 0) $("btnContinue").hidden = false;
  requestAnimationFrame(loop);
});
if ("serviceWorker" in navigator && location.protocol === "https:" && !window.JAIBA_ASSETS) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
})();
