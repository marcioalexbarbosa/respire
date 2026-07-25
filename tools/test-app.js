// Roda o script do index.html num DOM falso com relógio virtual,
// pra validar a lógica de tempo (start/pause/resume/stall) sem browser.
const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync(process.argv[2] || "index.html", "utf8");
const code = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

// ---- relógio virtual ----
let now = 0;
const frames = [];
function raf(cb) { frames.push(cb); return frames.length; }
function caf(id) { frames[id - 1] = null; }
function tick(ms) {
  // avança em passos de 16ms executando os rAF pendentes
  const target = now + ms;
  while (now < target) {
    now = Math.min(target, now + 16);
    const due = frames.splice(0, frames.length);
    due.forEach((cb) => cb && cb(now));
  }
}
function jump(ms) { now += ms; } // congela: tempo passa sem frames

// ---- DOM falso ----
const handlers = new Map();
function El(tag = "div") {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    _attrs: {},
    _on: {},
    textContent: "",
    innerHTML: "",
    value: "",
    checked: false,
    hidden: false,
    title: "",
    type: "",
    className: "",
    style: {
      _p: {},
      setProperty(k, v) { this._p[k] = String(v); },
      getPropertyValue(k) { return this._p[k] || ""; },
    },
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
    },
    setAttribute(k, v) { el._attrs[k] = String(v); },
    getAttribute(k) { return el._attrs[k]; },
    addEventListener(t, fn) { (el._on[t] = el._on[t] || []).push(fn); },
    appendChild(c) { el.children.push(c); return c; },
    querySelectorAll() { return el.children.filter((c) => c.className === "swatch"); },
    click() { (el._on.click || []).forEach((fn) => fn({ target: el, preventDefault() {} })); },
    dispatch(t, ev) { (el._on[t] || []).forEach((fn) => fn(ev || { target: el })); },
  };
  el.classList = { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } };
  el.style = { _p: {}, setProperty(k, v) { this._p[k] = String(v); }, getPropertyValue(k) { return this._p[k] || ""; } };
  return el;
}

const ids = ["orb", "phase", "count", "hint", "cycles", "startBtn", "resetBtn", "goalSelect", "soundToggle", "installBtn", "themes"];
const els = {};
ids.forEach((id) => (els[id] = El(id === "goalSelect" ? "select" : id === "soundToggle" ? "input" : "div")));
els.goalSelect.value = "4";
els.goalSelect.options = ["1", "2", "4", "8", "0"].map((v) => ({ value: v }));
const progEl = El("circle");

const document = {
  documentElement: { style: { setProperty() {} } },
  hidden: false,
  visibilityState: "visible",
  getElementById: (id) => els[id],
  querySelector: () => progEl,
  createElement: (t) => El(t),
  addEventListener: (t, fn) => (handlers.set(t, [...(handlers.get(t) || []), fn])),
  dispatch: (t, ev) => (handlers.get(t) || []).forEach((fn) => fn(ev || {})),
};

const store = {};
const sandbox = {
  document,
  window: { addEventListener() {}, AudioContext: undefined },
  navigator: {},
  location: { search: "", protocol: "http:", reload() { sandbox.__reloaded = true; } },
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => (store[k] = String(v)),
  },
  performance: { now: () => now },
  requestAnimationFrame: raf,
  cancelAnimationFrame: caf,
  getComputedStyle: () => ({ transform: "matrix(0.7,0,0,0.7,0,0)" }),
  URLSearchParams,
  Math, JSON, String, Number, Array, Object, Promise, console,
};
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

// ---- asserts ----
let failures = 0;
function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${actual}${ok ? "" : ` (esperado ${expected})`}`);
}
const phase = () => els.phase.textContent;
const count = () => els.count.textContent;
const btn = () => els.startBtn.textContent;
const scale = () => els.orb.style._p["--scale"];
const dur = () => els.orb.style._p["--phase-dur"];

console.log("\n== sessão normal ==");
els.startBtn.click();
tick(16);
check("fase inicial", phase(), "Inspire");
check("contagem em 4s", count(), 4);
check("orb infla", scale(), "1");
check("duração = 4s", dur(), "4s");
tick(2000);
check("t=2s ainda Inspire", phase(), "Inspire");
check("t=2s contagem", count(), 2);
tick(2100);
check("t=4.1s vira Segure", phase(), "Segure");
check("Segure conta 7", count(), 7);
tick(7100);
check("t=11.2s vira Expire", phase(), "Expire");
check("orb desinfla", scale(), "0.5");
tick(8100);
check("volta pra Inspire (ciclo 2)", phase(), "Inspire");
check("contador de ciclos", els.cycles.innerHTML, "Ciclo <b>2</b> de <b>4</b>");

console.log("\n== pausa e retomada ==");
els.resetBtn.click();
els.startBtn.click();
tick(2000);
check("antes de pausar", count(), 2);
els.startBtn.click();
check("pausado", phase(), "Pausado");
check("botão vira Continuar", btn(), "Continuar");
tick(5000); // tempo passa parado
check("continua pausado", phase(), "Pausado");
els.startBtn.click();
tick(16);
check("retoma de onde parou (não do 4)", count(), 2);
check("duração restante = 2s", dur(), "2s");
tick(2100);
check("termina a fase certa", phase(), "Segure");

console.log("\n== tela apaga / aparelho dorme (rAF congela) ==");
els.resetBtn.click();
els.startBtn.click();
tick(1000);
jump(60000); // 1 minuto sem frames
tick(16);
check("pausa em vez de correr as fases", phase(), "Pausado");
check("não avançou ciclos", els.cycles.innerHTML.includes("Ciclo <b>1</b>"), true);
els.startBtn.click();
tick(16);
check("retoma no ponto certo", count(), 3);

console.log("\n== aba escondida ==");
els.resetBtn.click();
els.startBtn.click();
tick(500);
document.hidden = true;
document.dispatch("visibilitychange");
check("pausa ao esconder", phase(), "Pausado");
document.hidden = false;
document.dispatch("visibilitychange");
check("não retoma sozinho", phase(), "Pausado");

console.log("\n== sessão até o fim (1 ciclo) ==");
els.resetBtn.click();
els.goalSelect.value = "1";
els.goalSelect.dispatch("change");
els.startBtn.click();
tick(19000 + 200);
check("concluído", phase(), "Concluído");
check("marca ✓", count(), "✓");
check("resumo", els.cycles.innerHTML, "Você completou <b>1</b> ciclo");
check("botão volta a Iniciar", btn(), "Iniciar");
check("preferência de ciclos salva", store["breathe-goal"], "1");

console.log("\n== atalhos de teclado ==");
els.resetBtn.click();
document.dispatch("keydown", { code: "Space", key: " ", target: { tagName: "BODY" }, preventDefault() {} });
tick(16);
check("espaço inicia", phase(), "Inspire");
document.dispatch("keydown", { code: "Space", key: " ", target: { tagName: "BUTTON" }, preventDefault() {} });
check("espaço em botão é ignorado (evita clique duplo)", phase(), "Inspire");
document.dispatch("keydown", { key: "r", code: "KeyR", target: { tagName: "BODY" }, preventDefault() {} });
check("R reinicia", phase(), "Pronto");
document.dispatch("keydown", { key: "R", code: "KeyR", target: { tagName: "SELECT" }, preventDefault() {} });
check("teclas no select são ignoradas", phase(), "Pronto");

console.log(failures ? `\n${failures} falha(s)` : "\nTudo passou");
process.exit(failures ? 1 : 0);
