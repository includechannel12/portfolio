/* ===============================================================
   Andrean Farhantama — portfolio
   1. Clocks   2. Name hover   3. Hero illustrations
   4. Work grid cursor   5. Footer keys   6. Lo-fi → hi-fi intro
================================================================ */

const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// two animation frames, with a timeout fallback so nothing stalls in a background tab
const frame = () => new Promise((r) => {
  let done = false;
  const finish = () => { if (!done) { done = true; r(); } };
  requestAnimationFrame(() => requestAnimationFrame(finish));
  setTimeout(finish, 60);
});

/* 0. Smooth scrolling (Lenis) — skipped for reduced motion or if the CDN fails */
const lenis = !reduced && window.Lenis
  ? new Lenis({
      duration: 1.15,                                     // glide length (s)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    })
  : null;
if (lenis) {
  const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
// smooth scroll to a target (element, selector or y), falling back to native
function smoothTo(target, offset = 0) {
  if (lenis) return lenis.scrollTo(target, { offset });
  const y = typeof target === "number" ? target
    : (typeof target === "string" ? document.querySelector(target) : target).getBoundingClientRect().top + scrollY + offset;
  scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
}
// in-page links (#work, #) glide instead of jumping; offset clears the sticky top bar
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.classList.contains("key")) return;
  const id = a.getAttribute("href");
  e.preventDefault();
  if (id === "#") smoothTo(0);
  else if (document.querySelector(id)) smoothTo(id, -56);
});

/* 1. Live clocks (top bar + footer) ---------------------------- */
const TIMEZONE = "Asia/Jakarta";
function tick() {
  const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE }).format(new Date());
  document.querySelectorAll("[data-clock]").forEach((el) => (el.textContent = t));
}
tick();
setInterval(tick, 15000);

/* 2. Name hover: letter weight follows the cursor --------------- */
const nameEl = document.querySelector(".hero__name");
nameEl.querySelectorAll(".first, .last").forEach((part) => {
  const text = part.textContent;
  part.textContent = "";
  [...text].forEach((c) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = c;
    part.appendChild(s);
  });
});
if (finePointer && !reduced) {
  const chars = [...nameEl.querySelectorAll(".ch")];
  nameEl.addEventListener("mousemove", (e) => {
    chars.forEach((ch) => {
      const r = ch.getBoundingClientRect();
      const t = Math.max(0, 1 - Math.abs(e.clientX - (r.left + r.width / 2)) / 120);
      const isLast = ch.parentElement.classList.contains("last");
      ch.style.setProperty("--w", Math.round(isLast ? 300 + 500 * t : 800 - 600 * t));
      ch.classList.toggle("is-hot", isLast && t > 0.35);
    });
  });
  nameEl.addEventListener("mouseleave", () =>
    chars.forEach((ch) => { ch.style.removeProperty("--w"); ch.classList.remove("is-hot"); })
  );
}

/* 3. Hero illustrations: hairline "design hardware" boards ------ */
const svg = {
  board: () =>
    `<rect x="8" y="8" width="344" height="504" rx="18"/>
     <rect x="18" y="18" width="324" height="484" rx="12" stroke-dasharray="2 5"/>` +
    [[30, 30], [330, 30], [30, 490], [330, 490]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/><path d="M${x - 3.5} ${y - 3.5}l7 7M${x + 3.5} ${y - 3.5}l-7 7"/>`)
      .join(""),
  ticks(cx, cy, r1, r2, from, to, step) {
    let s = "";
    for (let a = from; a <= to; a += step) {
      const rad = (a * Math.PI) / 180, long = (a - from) % (step * 3) === 0;
      const rr = long ? r2 + 4 : r2;
      s += `<line x1="${cx + r1 * Math.cos(rad)}" y1="${cy + r1 * Math.sin(rad)}" x2="${cx + rr * Math.cos(rad)}" y2="${cy + rr * Math.sin(rad)}"/>`;
    }
    return s;
  },
  matrix(x, y, rows, step = 11) {
    let s = `<rect x="${x - 10}" y="${y - 10}" width="${(rows[0].length - 1) * step + 20}" height="${(rows.length - 1) * step + 20}" rx="6"/>`;
    rows.forEach((row, j) => [...row].forEach((c, i) => {
      s += c === "#"
        ? `<circle class="fill-ink" cx="${x + i * step}" cy="${y + j * step}" r="2.4"/>`
        : `<circle cx="${x + i * step}" cy="${y + j * step}" r="2"/>`;
    }));
    return s;
  },
  halftone(x, y, cols, rows, step, fx = 0, fy = 0) {
    let s = "";
    const max = Math.hypot(cols, rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const d = Math.hypot(i - fx * cols, j - fy * rows) / max;
      const r = Math.max(0, step * 0.42 * (1 - d * 1.25));
      if (r > 0.4) s += `<circle class="fill-art" cx="${x + i * step}" cy="${y + j * step}" r="${r.toFixed(2)}"/>`;
    }
    return s;
  },
  barcode(x, y, h, n = 22) {
    let s = "", cx = x;
    for (let i = 0; i < n; i++) { const w = [1, 1, 2, 1, 3][(i * 7) % 5]; s += `<rect class="fill-art" x="${cx}" y="${y}" width="${w}" height="${h}"/>`; cx += w + 2; }
    return s;
  },
  trace(d) {
    const m = d.match(/^M\s*([\d.]+)\s+([\d.]+)/);
    return `<path d="${d}"/><path class="sig" d="${d}"/>${m ? `<circle class="fill-bg" cx="${m[1]}" cy="${m[2]}" r="3.2"/>` : ""}`;
  },
};

const A = [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"];
const F = ["#####", "#....", "#....", "####.", "#....", "#....", "#...."];

function buildLeft() {
  let pins = "";
  for (let i = 0; i < 6; i++) {
    const x = 162 + i * 15;
    pins += `<line x1="${x}" y1="280" x2="${x}" y2="270"/><line x1="${x}" y1="380" x2="${x}" y2="390"/>`;
  }
  let io = "";
  for (let i = 0; i < 12; i++) io += `<rect x="${36 + i * 16}" y="417" width="9" height="12" rx="1.5"/>`;
  let sliderTicks = "";
  for (let y = 96; y <= 218; y += 13) sliderTicks += `<line x1="312" y1="${y}" x2="${(y - 96) % 39 === 0 ? 322 : 318}" y2="${y}"/>`;

  return `
    ${svg.board()}
    <text x="30" y="60">AF—01 · INPUT MODULE</text>
    ${svg.barcode(228, 48, 14)}
    <circle class="fill-accent blink" cx="318" cy="70" r="3"/><text x="292" y="73">PWR</text>

    <!-- rotary knob -->
    <circle cx="118" cy="152" r="62"/>
    <circle cx="118" cy="152" r="48"/>
    ${svg.ticks(118, 152, 66, 72, 135, 405, 10)}
    <g class="knob-dial">
      <circle cx="118" cy="152" r="48" stroke="none"/>
      <line class="stroke-ink" x1="118" y1="152" x2="118" y2="112" stroke-width="2"/>
      <circle class="fill-accent" cx="118" cy="112" r="3.5"/>
    </g>
    <circle class="fill-bg stroke-ink" cx="118" cy="152" r="9"/>
    <text x="102" y="238">HUE</text>

    <!-- faders -->
    ${[230, 262, 294].map((x) => `<rect x="${x - 3}" y="92" width="6" height="130" rx="3"/>`).join("")}
    ${sliderTicks}
    <g class="slide s1"><rect class="fill-bg stroke-ink" x="219" y="176" width="22" height="12" rx="3"/></g>
    <g class="slide s2"><rect class="fill-bg stroke-accent" x="251" y="150" width="22" height="12" rx="3"/></g>
    <g class="slide s3"><rect class="fill-bg stroke-ink" x="283" y="196" width="22" height="12" rx="3"/></g>
    <text x="226" y="240">R</text><text x="258" y="240">G</text><text x="290" y="240">B</text>

    <!-- dot-matrix "A" -->
    ${svg.matrix(42, 290, A)}

    <!-- pen-nib chip -->
    <rect x="150" y="280" width="100" height="100" rx="10"/>
    ${pins}
    <path class="stroke-ink" d="M200 298 L222 328 L209 360 H191 L178 328 Z"/>
    <path d="M200 312 V346"/><circle class="fill-bg stroke-ink" cx="200" cy="328" r="4"/>
    <text x="158" y="374">NIB-02</text>

    <!-- halftone -->
    ${svg.halftone(272, 286, 7, 9, 10, 0, 0)}

    <!-- io strip -->
    <rect x="28" y="410" width="200" height="26" rx="5"/>${io}
    <text x="236" y="427">I/O</text>

    <!-- traces running toward the copy -->
    ${svg.trace("M118 214 V254 H320 L336 270 H360")}
    ${svg.trace("M294 222 V244 H338 L350 232 H360")}
    ${svg.trace("M250 380 V398 H300 L316 414 H360")}
    ${svg.trace("M228 423 H262 L278 440 H360")}
    ${svg.trace("M64 366 V462 H204 L220 478 H360")}
  `;
}

function buildRight() {
  let pins = "";
  for (let i = 0; i < 10; i++) {
    const o = 17.5 + i * 15;
    pins += `<line x1="${130 + o}" y1="80" x2="${130 + o}" y2="70"/><line x1="${130 + o}" y1="250" x2="${130 + o}" y2="260"/>`;
    pins += `<line x1="130" y1="${80 + o}" x2="120" y2="${80 + o}"/><line x1="300" y1="${80 + o}" x2="310" y2="${80 + o}"/>`;
  }
  let conn = "";
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) conn += `<rect x="${270 + c * 10}" y="${420 + r * 16}" width="6" height="10" rx="1"/>`;

  return `
    ${svg.board()}
    <circle class="fill-accent blink" cx="42" cy="56" r="3"/><text x="52" y="59">LIVE</text>
    <text x="196" y="60">AF—02 · OUTPUT</text>

    <!-- main chip with AF badge -->
    <rect x="130" y="80" width="170" height="170" rx="14"/>
    <rect x="140" y="90" width="150" height="150" rx="8" stroke-dasharray="1 4"/>
    ${pins}
    <circle class="fill-art" cx="146" cy="96" r="3"/>
    <circle cx="215" cy="165" r="58"/>
    <path id="ring" d="M215 165 m-47 0 a47 47 0 1 1 94 0 a47 47 0 1 1 -94 0" stroke="none"/>
    <text class="ring"><textPath href="#ring">DESIGN · BUILD · SHIP · ITERATE ·</textPath></text>
    <circle class="fill-ink" cx="215" cy="165" r="34"/>
    <text class="on-ink" x="215" y="173" text-anchor="middle">AF</text>

    <!-- halftone -->
    ${svg.halftone(32, 84, 8, 6, 9, 0, 0)}

    <!-- mini screen with a bezier curve -->
    <rect x="40" y="290" width="190" height="130" rx="10"/>
    <line x1="40" y1="306" x2="230" y2="306"/>
    <circle cx="52" cy="298" r="2"/><circle cx="60" cy="298" r="2"/><circle cx="68" cy="298" r="2"/>
    <line x1="62" y1="400" x2="100" y2="326"/><line x1="210" y1="332" x2="166" y2="410"/>
    <path class="stroke-ink" d="M62 400 C100 326, 166 410, 210 332" stroke-width="1.5"/>
    <circle class="fill-bg stroke-ink" cx="100" cy="326" r="3"/><circle class="fill-bg stroke-ink" cx="166" cy="410" r="3"/>
    <rect class="fill-accent" x="58" y="396" width="8" height="8"/><rect class="fill-accent" x="206" y="328" width="8" height="8"/>
    <g class="cursor-move"><path class="fill-ink" d="M196 356 v17 l4.6 -4 l3.2 7.2 l2.8 -1.2 l-3.2 -7 h6.2 z"/></g>

    <!-- dot-matrix "F" -->
    ${svg.matrix(266, 300, F)}

    <!-- connector -->
    <rect x="262" y="410" width="64" height="44" rx="5"/>${conn}

    <text x="40" y="452">RES 1440 · 60FPS</text>
    ${svg.barcode(40, 462, 12, 26)}

    <!-- traces running toward the copy -->
    ${svg.trace("M130 150 H96 L80 134 H0")}
    ${svg.trace("M130 210 H70 L54 226 H0")}
    ${svg.trace("M215 250 V272 H112 L98 284 H0")}
    ${svg.trace("M40 356 H20 L10 366 H0")}
    ${svg.trace("M294 454 V484 H60 L44 500 H0")}
  `;
}

// AF—03: type specimen + palette (left, traces exit right toward the sheet)
function buildType() {
  const sw = [["fill-art", "#C9C7BF"], ["fill-bg stroke-ink", "#F7F6F2"], ["fill-ink", "#121212"], ["fill-accent", "#262629"], ["fill-select", "#2F6BFF"]];
  let swatches = "";
  sw.forEach(([c, hex], i) => {
    const x = 30 + i * 62;
    swatches += `<rect class="${c}" x="${x}" y="262" width="48" height="48" rx="8"/><text x="${x}" y="326">${hex}</text>`;
  });
  let lattice = "";
  for (let y = 352; y <= 412; y += 12) for (let x = 30; x <= 330; x += 12) lattice += `<circle class="fill-art" cx="${x}" cy="${y}" r="1"/>`;
  let ruler = "";
  for (let x = 30; x <= 330; x += 10) ruler += `<line x1="${x}" y1="470" x2="${x}" y2="${(x - 30) % 50 === 0 ? 482 : 476}"/>`;
  return `
    ${svg.board()}
    <text x="30" y="60">AF—03 · TYPE SPEC</text>
    <circle class="fill-accent blink" cx="318" cy="56" r="3"/>
    <line x1="22" y1="106" x2="338" y2="106" stroke-dasharray="3 4"/>
    <line x1="22" y1="138" x2="338" y2="138" stroke-dasharray="3 4"/>
    <line x1="22" y1="214" x2="338" y2="214"/>
    <text class="t-spec" x="26" y="214">Aa</text>
    <text x="270" y="101">CAP</text><text x="270" y="133">X-HEIGHT</text><text x="270" y="228">BASELINE</text>
    <line x1="252" y1="106" x2="252" y2="214"/><line x1="247" y1="106" x2="257" y2="106"/><line x1="247" y1="214" x2="257" y2="214"/>
    <text x="30" y="240">MANROPE · 200—800</text>
    ${swatches}
    ${lattice}
    <text x="30" y="440">8PT GRID</text>
    <line x1="30" y1="470" x2="330" y2="470"/>${ruler}
    <text x="30" y="496">0</text><text x="126" y="496">96</text><text x="226" y="496">192</text><text x="310" y="496">288</text>
    ${svg.trace("M200 106 H320 L336 90 H360")}
    ${svg.trace("M262 310 V336 H330 L346 320 H360")}
    ${svg.trace("M180 412 V452 H310 L326 436 H360")}
  `;
}

// AF—05: layout grid + breakpoints (left)
function buildLayout() {
  let cols = "";
  for (let i = 0; i < 12; i++) cols += `<rect x="${42 + i * 23.3}" y="92" width="18" height="156" stroke-dasharray="2 3"/>`;
  const bps = [[40, "375"], [120, "768"], [200, "1024"], [300, "1440"]];
  let bp = bps.map(([x, l]) => `<line x1="${x}" y1="290" x2="${x}" y2="304"/><circle class="fill-bg stroke-ink" cx="${x}" cy="297" r="3.5"/><text x="${x - 8}" y="320">${l}</text>`).join("");
  return `
    ${svg.board()}
    <text x="30" y="60">AF—05 · LAYOUT</text>
    <rect x="30" y="80" width="300" height="180" rx="8"/>
    ${cols}
    <rect class="stroke-ink" x="42" y="100" width="274" height="18" rx="4"/>
    <rect class="stroke-ink" x="42" y="126" width="158" height="54" rx="4"/>
    <rect x="42" y="190" width="83" height="50" rx="4"/><rect x="135" y="190" width="83" height="50" rx="4"/><rect x="228" y="190" width="88" height="50" rx="4"/>
    <rect class="fill-accent" x="210" y="126" width="106" height="54" rx="4" opacity=".14"/>
    <rect class="stroke-accent" x="210" y="126" width="106" height="54" rx="4"/>
    <line x1="30" y1="297" x2="330" y2="297"/>${bp}
    <text x="30" y="350">ASPECT</text>
    <rect x="30" y="362" width="70" height="70" rx="4"/><text x="30" y="448">1:1</text>
    <rect x="116" y="379" width="70" height="53" rx="4"/><text x="116" y="448">4:3</text>
    <rect x="202" y="393" width="70" height="39" rx="4"/><text x="202" y="448">16:9</text>
    <rect x="288" y="362" width="40" height="70" rx="4"/><text x="288" y="448">9:16</text>
    ${svg.barcode(30, 470, 14, 30)}
    ${svg.trace("M316 150 H340 L352 162 H360")}
    ${svg.trace("M330 297 H346 L354 305 H360")}
    ${svg.trace("M308 432 V460 H336 L348 448 H360")}
  `;
}

// AF—04: UI components (right, traces exit left toward the sheet)
function buildComponents() {
  return `
    ${svg.board()}
    <circle class="fill-accent blink" cx="42" cy="56" r="3"/>
    <text x="176" y="60">AF—04 · COMPONENTS</text>
    <rect class="fill-ink" x="40" y="86" width="150" height="40" rx="20"/>
    <text class="t-btn" x="115" y="110" text-anchor="middle">Get started →</text>
    <rect class="stroke-ink" x="202" y="86" width="118" height="40" rx="20"/>
    <text class="t-btn-o" x="261" y="110" text-anchor="middle">Preview</text>

    <rect x="40" y="152" width="64" height="34" rx="17"/>
    <circle class="fill-bg stroke-ink toggle-knob" cx="57" cy="169" r="12"/>
    <rect class="fill-ink" x="124" y="158" width="22" height="22" rx="5"/>
    <path class="stroke-bg" d="M129 169 l4 4 l8 -9" stroke-width="2"/>
    <rect x="158" y="158" width="22" height="22" rx="5"/>
    <circle cx="205" cy="169" r="11"/><circle class="fill-accent" cx="205" cy="169" r="5"/>
    <circle cx="282" cy="169" r="26"/>
    <circle class="stroke-accent ring-anim" cx="282" cy="169" r="26" stroke-width="3" transform="rotate(-90 282 169)"/>
    <text class="t-md" x="282" y="173" text-anchor="middle">72%</text>

    <text x="40" y="220">EMAIL</text>
    <rect x="40" y="226" width="280" height="44" rx="10"/>
    <text class="t-md" x="56" y="252">you@company.com</text>
    <line class="stroke-ink blink" x1="160" y1="238" x2="160" y2="258" stroke-width="1.5"/>

    <line x1="40" y1="304" x2="320" y2="304"/>
    <line class="stroke-accent" x1="40" y1="304" x2="210" y2="304" stroke-width="2"/>
    <circle class="fill-bg stroke-ink" cx="210" cy="304" r="8"/>

    <rect x="40" y="334" width="280" height="104" rx="12"/>
    <rect x="54" y="348" width="76" height="76" rx="8"/>
    <line x1="54" y1="348" x2="130" y2="424"/><line x1="130" y1="348" x2="54" y2="424"/>
    <rect class="fill-art" x="144" y="354" width="140" height="8" rx="4"/>
    <rect class="fill-art" x="144" y="370" width="100" height="6" rx="3"/>
    <rect class="fill-art" x="144" y="382" width="120" height="6" rx="3"/>
    <rect class="stroke-accent" x="144" y="402" width="64" height="22" rx="11"/>

    <rect x="40" y="458" width="58" height="22" rx="11"/><rect x="106" y="458" width="72" height="22" rx="11"/><rect x="186" y="458" width="50" height="22" rx="11"/>
    ${svg.trace("M40 106 H22 L12 116 H0")}
    ${svg.trace("M40 248 H24 L14 258 H0")}
    ${svg.trace("M40 386 H22 L12 396 H0")}
    ${svg.trace("M180 438 V448 H30 L18 460 H0")}
  `;
}

// AF—06: ship — terminal, branches, scores (right)
function buildShip() {
  const lines = ["$ npm run build", "✓ compiled 42 modules · 0 errors", "$ deploy --prod", "● live in 1.8s"];
  const term = lines.map((l, i) => `<text class="t-md${i === 3 ? " t-accent" : ""}" x="56" y="${130 + i * 22}">${l}</text>`).join("");
  const scores = [60, 130, 200, 270].map((x) => `<circle cx="${x + 20}" cy="426" r="18"/><circle class="stroke-accent" cx="${x + 20}" cy="426" r="18" stroke-width="2" stroke-dasharray="113 0" transform="rotate(-90 ${x + 20} 426)"/><text class="t-sm" x="${x + 20}" y="429" text-anchor="middle">100</text>`).join("");
  return `
    ${svg.board()}
    <circle class="fill-accent blink" cx="42" cy="56" r="3"/>
    <text x="230" y="60">AF—06 · SHIP</text>
    <rect x="40" y="80" width="280" height="132" rx="10"/>
    <line x1="40" y1="100" x2="320" y2="100"/>
    <circle cx="54" cy="90" r="3"/><circle cx="64" cy="90" r="3"/><circle cx="74" cy="90" r="3"/>
    ${term}
    <line class="stroke-ink blink" x1="56" y1="198" x2="64" y2="198" stroke-width="2"/>

    <text x="40" y="256">MAIN</text>
    <line x1="70" y1="276" x2="320" y2="276"/>
    <path class="stroke-accent" d="M110 276 C130 276, 130 316, 150 316 H230 C250 316, 250 276, 270 276"/>
    ${[70, 110, 190, 270, 320].map((x) => `<circle class="fill-bg stroke-ink" cx="${x}" cy="276" r="5"/>`).join("")}
    ${[150, 190, 230].map((x) => `<circle class="fill-bg stroke-accent" cx="${x}" cy="316" r="5"/>`).join("")}
    <text x="150" y="340">feat/portfolio</text>
    <text x="40" y="390">LIGHTHOUSE</text>
    ${scores}
    ${svg.barcode(40, 470, 14, 24)}
    ${svg.trace("M40 150 H24 L14 160 H0")}
    ${svg.trace("M70 276 H30 L18 288 H0")}
    ${svg.trace("M40 426 H22 L12 436 H0")}
  `;
}

const ART = { "art-a": buildLeft, "art-b": buildType, "art-e": buildLayout, "art-c": buildRight, "art-d": buildComponents, "art-f": buildShip };
Object.entries(ART).forEach(([id, fn]) => { const el = document.getElementById(id); if (el) el.innerHTML = fn(); });

/* Footer reveal: the page lifts away and the footer rises into place */
const foot = document.querySelector(".foot");
const mainEl = document.querySelector("main");
function updateReveal() {
  const fh = foot.offsetHeight;
  const canReveal = !reduced && fh <= innerHeight; // pinned reveal only works if the footer fits on screen
  foot.classList.toggle("is-reveal", canReveal);
  if (!canReveal) { foot.style.removeProperty("--reveal"); return; }
  const shown = innerHeight - mainEl.getBoundingClientRect().bottom; // px of footer uncovered
  foot.style.setProperty("--reveal", Math.min(1, Math.max(0, shown / fh)).toFixed(3));
}
addEventListener("scroll", updateReveal, { passive: true });

// the "Available" seal stamps down once the ticket is mostly in view
const ticketEl = document.querySelector(".ticket");
if (ticketEl) {
  if (reduced || !("IntersectionObserver" in window)) ticketEl.classList.add("is-stamped");
  else new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { setTimeout(() => ticketEl.classList.add("is-stamped"), 250); io.disconnect(); }
  }, { threshold: 0.75 }).observe(ticketEl);
}
addEventListener("resize", updateReveal);
updateReveal();

/* 4. Work grid: follow cursor ----------------------------------- */
const cursor = document.querySelector(".cursor");
if (finePointer && cursor) {
  addEventListener("mousemove", (e) => {
    cursor.style.setProperty("--cx", `${e.clientX}px`);
    cursor.style.setProperty("--cy", `${e.clientY}px`);
  }, { passive: true });
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("mouseenter", () => cursor.classList.add("is-on"));
    tile.addEventListener("mouseleave", () => cursor.classList.remove("is-on"));
  });
}

/* 5. Footer keys: real keyboard shortcuts E / U / L / T ---------- */
const keyMap = { e: 0, u: 1, l: 2, t: 3 };
const keys = [...document.querySelectorAll(".key")];
keys[3]?.addEventListener("click", (e) => { e.preventDefault(); smoothTo(0); });
addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(e.target.tagName)) return;
  const k = keys[keyMap[e.key.toLowerCase()]];
  if (!k) return;
  const foot = document.querySelector(".foot").getBoundingClientRect();
  if (foot.top > innerHeight) return; // only when the footer is on screen
  k.classList.add("is-down");
  setTimeout(() => { k.classList.remove("is-down"); k.click(); }, 140);
});

/* 5b. Scroll timeline: the page as a motion timeline ------------ */
const tl = document.querySelector(".tl");
if (tl) {
  const track = tl.querySelector(".tl__track");
  const segsEl = tl.querySelector(".tl__segs");
  const head = tl.querySelector(".tl__head");
  const view = tl.querySelector(".tl__view");
  const tcEl = tl.querySelector(".tl__tc");
  const frEl = tl.querySelector(".tl__fr");
  const secName = tl.querySelector(".tl__name");
  const pctEl = tl.querySelector(".tl__pct");

  const FPS = 24, SECONDS = 10;                 // the whole page "plays" as 10s at 24fps
  const SECTIONS = [[".hero-band", "Hero"], ["#work", "Work"], [".foot", "Contact"]];
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let marks = [];

  function layout() {
    const max = maxScroll();
    const main = document.querySelector("main");
    marks = SECTIONS.map(([sel, name]) => {
      // the footer is sticky, so its start is where <main> ends
      const top = sel === ".foot"
        ? main.getBoundingClientRect().top + scrollY + main.offsetHeight
        : document.querySelector(sel).getBoundingClientRect().top + scrollY;
      const s = sel === ".hero-band" ? 0 : top - innerHeight * 0.5; // section "starts" mid-screen
      return { name, p: Math.min(1, Math.max(0, s / max)) };
    });
    segsEl.innerHTML = "";
    marks.forEach((m, i) => {
      const end = i < marks.length - 1 ? marks[i + 1].p : 1;
      const seg = document.createElement("div");
      seg.className = "tl__seg";
      seg.style.left = `calc(${m.p * 100}% + 1px)`;
      seg.style.width = `calc(${(end - m.p) * 100}% - 2px)`;
      seg.textContent = m.name;
      segsEl.appendChild(seg);
      const key = document.createElement("button");
      key.className = "tl__key";
      key.type = "button";
      key.title = `Jump to ${m.name}`;
      key.setAttribute("aria-label", `Jump to ${m.name}`);
      key.style.left = `${m.p * 100}%`;
      key.addEventListener("pointerdown", (e) => e.stopPropagation());
      key.addEventListener("click", () => smoothTo(m.p * maxScroll()));
      track.appendChild(key);
      m.seg = seg; m.key = key;
    });
    track.querySelectorAll(".tl__key").forEach((k) => { if (!marks.some((m) => m.key === k)) k.remove(); });
    update();
  }

  let idle;
  function update() {
    const max = maxScroll();
    const docH = document.documentElement.scrollHeight;
    const p = Math.min(1, Math.max(0, scrollY / max));
    head.style.left = `${p * 100}%`;
    view.style.left = `${(scrollY / docH) * 100}%`;
    view.style.width = `${(innerHeight / docH) * 100}%`;

    const frame = Math.round(p * FPS * SECONDS);
    tcEl.textContent = `00:${pad(Math.floor(frame / FPS))}:${pad(frame % FPS)}`;
    frEl.textContent = `F${pad(frame, 3)}`;
    pctEl.textContent = `${Math.round(p * 100)}%`;
    track.setAttribute("aria-valuenow", Math.round(p * 100));

    let active = marks[0];
    marks.forEach((m) => { if (p >= m.p - 0.001) active = m; m.key?.classList.toggle("is-passed", p >= m.p - 0.001); });
    marks.forEach((m) => m.seg?.classList.toggle("is-active", m === active));
    if (active) secName.textContent = active.name;

    tl.classList.add("is-moving");
    clearTimeout(idle);
    idle = setTimeout(() => tl.classList.remove("is-moving"), 350);
  }

  // scrub: drag to scrub instantly, click to glide there
  const toP = (x) => { const r = track.getBoundingClientRect(); return Math.min(1, Math.max(0, (x - r.left) / r.width)); };
  let downX = null, dragged = false;
  track.addEventListener("pointerdown", (e) => { downX = e.clientX; dragged = false; track.setPointerCapture(e.pointerId); });
  track.addEventListener("pointermove", (e) => {
    if (downX === null) return;
    if (Math.abs(e.clientX - downX) > 3) dragged = true;
    if (!dragged) return;
    const y = toP(e.clientX) * maxScroll();
    lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
  });
  track.addEventListener("pointerup", (e) => {
    if (downX !== null && !dragged) smoothTo(toP(e.clientX) * maxScroll());
    downX = null;
  });
  track.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 0.05, ArrowLeft: -0.05, PageDown: 0.2, PageUp: -0.2 }[e.key];
    const max = maxScroll();
    if (step !== undefined) { e.preventDefault(); smoothTo(Math.min(max, Math.max(0, scrollY + step * max))); }
    if (e.key === "Home") { e.preventDefault(); smoothTo(0); }
    if (e.key === "End") { e.preventDefault(); smoothTo(max); }
  });

  // only show while scrolling; stay up while hovered, focused or being dragged
  let hideT, hovering = false;
  const HIDE_AFTER = 1200; // ms of no scrolling before it fades out
  const scheduleHide = () => {
    clearTimeout(hideT);
    hideT = setTimeout(() => {
      if (hovering || downX !== null || tl.contains(document.activeElement)) return scheduleHide();
      tl.classList.remove("is-visible");
    }, HIDE_AFTER);
  };
  tl.addEventListener("pointerenter", () => { hovering = true; });
  tl.addEventListener("pointerleave", () => { hovering = false; scheduleHide(); });
  addEventListener("scroll", () => {
    update();
    if (!document.documentElement.classList.contains("is-intro")) tl.classList.add("is-visible");
    scheduleHide();
  }, { passive: true });
  addEventListener("resize", layout);
  addEventListener("load", layout);
  document.fonts?.ready.then(layout);
  layout();
}

/* 6. Intro: lo-fi wireframe → hi-fi ----------------------------- */
const LOFI = {
  draw: 1100,  // total time for skeleton bars to draw in (ms)
  hold: 450,   // pause on the finished wireframe (ms)
  step: 85,    // gap between each block resolving into the real thing (ms)
  fade: 800,   // how long each block takes to sharpen (matches .lofi-anim)
};

const root = document.documentElement;
const lofi = document.querySelector(".lofi");

function endIntro() {
  root.classList.remove("is-intro");
  document.querySelectorAll(".lofi-hide").forEach((el) => el.classList.remove("lofi-hide"));
  setTimeout(() => document.querySelectorAll(".lofi-anim").forEach((el) => el.classList.remove("lofi-anim")), 900);
  lofi?.remove();
  lenis?.start();
}

if (root.classList.contains("is-intro") && lofi && !reduced) {
  document.addEventListener("visibilitychange", () => { if (document.hidden) endIntro(); }, { once: true });
  runIntro().catch((err) => { console.error("intro:", err); endIntro(); });
} else {
  endIntro();
}

async function runIntro() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  lenis?.scrollTo(0, { immediate: true });
  lenis?.stop(); // no scrolling while the intro plays
  scrollTo(0, 0);
  try { await document.fonts.ready; } catch {}

  const layer = lofi.querySelector(".lofi__layer");
  const vh = innerHeight;

  // [selector, kind, extra] — kind "text" draws one bar per line of text,
  // "box" draws an outlined placeholder with a cross, "none" just hides it.
  const plan = [
    [".brand", "text"],
    [".topbar__right", "text"],
    [".ruler", "text"],
    [".side--left", "box", "ILLUSTRATION"],
    [".hero__hello", "text"],
    [".hero__name", "text"],
    [".hero__role", "text"],
    [".hero__bio p", "text"],
    [".stats", "text", "dt, dd"],
    [".review", "text", ".review__top, blockquote p, .review__by"],
    [".side--right", "box", "ILLUSTRATION"],
    [".work__head", "text", "h2, p, .work__count"],
    [".tile", "box", "IMAGE · 4:3"],
    [".foot", "none"],
  ];

  const groups = [];
  plan.forEach(([sel, kind, extra]) => {
    document.querySelectorAll(sel).forEach((el) => {
      const r = el.getBoundingClientRect();
      const visible = kind !== "none" && r.width > 0 && r.bottom > 0 && r.top < vh;
      const group = { el, sks: [] };
      if (visible && kind === "text") {
        const parts = extra ? el.querySelectorAll(extra) : [el];
        parts.forEach((p) => textLines(p).forEach((ln) => {
          if (ln.cy - ln.h / 2 > vh) return;
          const h = Math.max(6, ln.h * 0.5);
          group.sks.push(sk(layer, "sk", { left: ln.l, top: ln.cy - h / 2, width: ln.r - ln.l, height: h }));
        }));
      } else if (visible && kind === "box") {
        const b = sk(layer, "sk sk--box", { left: r.left, top: r.top, width: r.width, height: Math.min(r.height, vh - r.top) });
        b.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/></svg><em>${extra}</em>`;
        group.sks.push(b);
      }
      el.classList.add("lofi-hide");
      groups.push(group);
    });
  });

  root.classList.add("lofi-ready");
  lofi.classList.add("is-on");

  // 1) skeleton draws in
  const all = groups.flatMap((g) => g.sks);
  const stagger = Math.min(40, LOFI.draw / Math.max(1, all.length));
  all.forEach((s, i) => (s.style.transitionDelay = `${Math.round(i * stagger)}ms`));
  await frame();
  all.forEach((s) => s.classList.add("is-on"));
  await wait(all.length * stagger + 550 + LOFI.hold);

  // 2) each block resolves into the real element, in reading order
  const live = groups.filter((g) => g.sks.length);
  const total = live.length * LOFI.step + LOFI.fade;
  const pct = lofi.querySelector(".lofi__pct");
  lofi.style.setProperty("--resolve", `${total}ms`);
  lofi.classList.add("is-resolving");
  const t0 = performance.now();
  const iv = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / total);
    const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
    pct.textContent = `${Math.round(e * 100)}%`;
    if (p >= 1) clearInterval(iv);
  }, 40);

  live.forEach((g, i) => setTimeout(() => {
    g.sks.forEach((s) => { s.style.transitionDelay = "0ms"; s.classList.add("is-out"); });
    g.el.classList.add("lofi-anim");
    g.el.classList.remove("lofi-hide");
  }, i * LOFI.step));

  await wait(total);
  groups.forEach((g) => g.el.classList.remove("lofi-hide"));
  lofi.classList.add("is-done");
  await wait(450);
  endIntro();
}

// One rectangle per rendered line of text inside `el`
function textLines(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rows = [];
  [...range.getClientRects()].forEach((r) => {
    if (r.width < 2 || r.height < 2) return;
    const cy = r.top + r.height / 2;
    const row = rows.find((o) => Math.abs(o.cy - cy) < Math.max(o.h, r.height) * 0.4);
    if (row) { row.l = Math.min(row.l, r.left); row.r = Math.max(row.r, r.right); row.h = Math.max(row.h, r.height); }
    else rows.push({ l: r.left, r: r.right, cy, h: r.height });
  });
  return rows;
}

function sk(parent, cls, box) {
  const n = document.createElement("div");
  n.className = cls;
  Object.assign(n.style, {
    left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`,
  });
  parent.appendChild(n);
  return n;
}
