/* ==========================================================================
   « Pokémon fête ses 30 ans » — la vitrine orbitale (desktop ≥ 1024 px)
   --------------------------------------------------------------------------
   À gauche, un index de la collection (texte complet, boutons accessibles).
   À droite, une vitrine sombre où les produits tournent sur un plateau en
   anneau (3D CSS projetée à la main : transform + opacity uniquement).
     - survol / focus / clic d'une ligne de l'index → le produit vient devant
     - glisser la vitrine (souris ou tactile) → rotation avec inertie, puis
       arrêt sur le produit le plus proche (ressort légèrement amorti)
     - flèches précédent / suivant, et ↑ ↓ entre les lignes de l'index
     - parallaxe au pointeur : profondeur des objets, « 30 » et projecteur,
       reflet holo du produit de devant
   Photos réelles quand data.js en fournit (champ « image »), sinon carte slot.
   Mobile, tablette, mouvement réduit ou erreur : la liste de cartes de base
   (.anniv__list) reste affichée, enrichie sur mobile d'un léger « coverflow »
   au défilement (initListFlow).
   ========================================================================== */

import { prefs, onPrefsChange } from '../../core/motion.js';
import { $, $$, clamp, esc } from '../../core/utils.js';
import { produitsDe, formatPrix } from '../../core/format.js';
import { observeReveals } from '../../core/reveal.js';
import { anniRow, vitrineItem, showCard } from './cards.js';

const DEG = Math.PI / 180;
const mqDesk = matchMedia('(min-width: 1024px)');
const mqMobile = matchMedia('(max-width: 767px)');

/* Petites étoiles décoratives (positions fixes : rendu stable d'une visite à l'autre) */
const SPARKS = [[9, 18, 0, 1], [86, 14, 1.4, 0.8], [74, 34, 2.6, 0.6], [16, 62, 0.8, 0.7], [92, 66, 3.1, 1], [28, 9, 2.1, 0.55], [60, 8, 0.4, 0.7], [6, 84, 1.9, 0.6]];

/** Chiffres brouillés puis révélés de gauche à droite (prix ≤ 8 caractères, au changement seulement). */
function scramble(el, text, dur = 420) {
  cancelAnimationFrame(el.__scr || 0);
  if (prefs.reduced || text.length > 8) { el.textContent = text; return; }
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const keep = Math.floor(p * text.length);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      out += i < keep || !/\d/.test(c) ? c : String((Math.random() * 10) | 0);
    }
    el.textContent = out;
    if (p < 1) el.__scr = requestAnimationFrame(step);
  };
  el.__scr = requestAnimationFrame(step);
}

function sceneHTML(products) {
  const sparks = SPARKS.map(([x, y, d, s]) => `<span class="vitrine__spark" style="--x:${x}%;--y:${y}%;--d:${d}s;--s:${s}"></span>`).join('');
  const p0 = products[0];
  return '<div class="vitrine__bg">'
    + '<span class="vitrine__spot" data-v-spot></span>'
    + '<span class="vitrine__num" data-v-num>30</span>'
    + '<span class="vitrine__floor"><span class="vitrine__ring"></span><span class="vitrine__ring vitrine__ring--2"></span><span class="vitrine__pool"></span></span>'
    + sparks
    + '</div>'
    + `<div class="vitrine__orbit" data-orbit>${products.map((p, i) => vitrineItem(p, i)).join('')}</div>`
    + '<div class="vitrine__hud">'
    + '<p class="vitrine__tag vitrine__tag--tl"><span>Vitrine</span><span class="vitrine__tag-sep"></span><span>Pokémon 30 ans</span></p>'
    + '<p class="vitrine__tag vitrine__tag--tr"><span class="vitrine__dot"></span>Exclusivité boutique</p>'
    + '<div class="vitrine__caption">'
    + `<span class="vitrine__counter"><span data-v-index>01</span> / ${String(products.length).padStart(2, '0')}</span>`
    + `<span class="vitrine__name" data-v-name>${esc(p0.court || p0.code)}</span>`
    + `<span class="vitrine__price" data-v-price>${formatPrix(p0.prix)}</span>`
    + '</div>'
    + '<p class="vitrine__drag"><span class="vitrine__drag-line"></span>Glisser pour tourner</p>'
    + '</div>';
}

/** Liste de cartes de base (mobile, tablette, mouvement réduit) : rendue une fois, à la demande. */
export function ensureList(list) {
  if (!list || list.dataset.showRendered) return;
  list.dataset.showRendered = '1';
  const products = produitsDe(list.dataset.categorie || 'pokemon-30-ans');
  list.innerHTML = products.map((p, i) => showCard(p, i, { li: 'anniv__item' })).join('');
  observeReveals(list);
}

export function initVitrine(section) {
  const root = $('[data-vitrine]', section);
  const scene = root && $('[data-vitrine-scene]', root);
  const index = $('[data-anniv-index]', section);
  const list = $('.anniv__list', section);
  const products = produitsDe('pokemon-30-ans');
  if (!root || !scene || !index || !list || products.length < 2) { ensureList(list); return; }

  const n = products.length;
  const STEP = 360 / n;

  // Construction paresseuse : rien n'est créé tant que la vitrine n'est pas utilisée (mobile = 0 coût)
  let built = false;
  let orbit, items, rows, picks, numEl, spot, capIndex, capName, capPrice, caption;
  function build() {
    if (built) return;
    built = true;
    // Chaînes complètes posées en une fois : jamais d'état à moitié rendu
    scene.innerHTML = sceneHTML(products);
    index.innerHTML = products.map((p, i) => anniRow(p, i, n)).join('');
    observeReveals(index);
    orbit = $('[data-orbit]', scene);
    items = $$('.vitrine__item', orbit);
    rows = $$('.arow', index);
    picks = $$('[data-vitrine-pick]', index);
    numEl = $('[data-v-num]', scene);
    spot = $('[data-v-spot]', scene);
    capIndex = $('[data-v-index]', scene);
    capName = $('[data-v-name]', scene);
    capPrice = $('[data-v-price]', scene);
    caption = $('.vitrine__caption', scene);
    bindRows();
  }

  /* ---------- État ---------- */
  let on = false;            // vitrine active (sinon liste de base)
  let visible = false;
  let introduced = false;
  let theta = 0;             // angle courant (degrés) : produit i devant quand theta ≡ i × STEP
  let vel = 0;               // vitesse angulaire (degrés / s)
  let target = 0;
  let active = 0;
  let raf = 0;
  let last = 0;
  let W = 0, H = 0, size = 0;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, mx: 50, my: 40 };
  const drag = { down: false, active: false, x0: 0, th0: 0, lastX: 0, lastT: 0, v: 0, id: 0, item: null };

  const measure = () => {
    W = scene.clientWidth;
    H = scene.clientHeight;
    size = Math.round(Math.min(W * 0.44, H * 0.56));
    scene.style.setProperty('--item', `${size}px`);
  };

  /* ---------- Projection de l'anneau ---------- */
  function layout() {
    if (!W || !built) return;
    const rx = W * 0.34;
    const ry = H * 0.17;
    let front = 0;
    let best = -2;
    for (let i = 0; i < n; i++) {
      const a = (i * STEP - theta) * DEG;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const depth = (c + 1) / 2;              // 1 devant, 0 derrière
      const k = depth ** 1.3;
      const scale = 0.42 + 0.58 * k;
      const x = s * rx + ptr.x * 22 * depth;
      const y = -(1 - depth) * ry + ptr.y * 12 * depth;
      const rot = -s * 34 + ptr.x * 6 * depth;
      const el = items[i];
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)}) perspective(${(size * 3).toFixed(0)}px) rotateY(${rot.toFixed(2)}deg)`;
      el.style.opacity = (0.3 + 0.7 * k).toFixed(3);
      el.style.zIndex = String(Math.round(depth * 100));
      if (c > best) { best = c; front = i; }
    }
    items.forEach((el, i) => el.classList.toggle('is-front', i === front && best > 0.92));
    if (numEl) numEl.style.transform = `translate3d(${(-ptr.x * 26).toFixed(1)}px, ${(-ptr.y * 16).toFixed(1)}px, 0)`;
    if (spot) spot.style.transform = `translate3d(${(ptr.x * 30).toFixed(1)}px, 0, 0)`;
    scene.style.setProperty('--mx', `${ptr.mx.toFixed(1)}%`);
    scene.style.setProperty('--my', `${ptr.my.toFixed(1)}%`);
    const act = ((Math.round(theta / STEP) % n) + n) % n;
    if (act !== active) setActive(act);
  }

  function setActive(i, { force = false } = {}) {
    if (i === active && !force) return;
    active = i;
    const p = products[i];
    rows.forEach((r, j) => r.classList.toggle('is-active', j === i));
    picks.forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
    capIndex.textContent = String(i + 1).padStart(2, '0');
    capName.textContent = p.court || p.code;
    if (force) capPrice.textContent = formatPrix(p.prix);
    else scramble(capPrice, formatPrix(p.prix));
    if (!force && caption.animate && !prefs.reduced) {
      caption.animate([
        { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }

  /* ---------- Boucle (ressort amorti), arrêtée dès que tout est immobile ---------- */
  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (!drag.active) {
      const k = 110;
      const c = 2 * Math.sqrt(k) * 0.8;
      vel += (k * (target - theta) - c * vel) * dt;
      theta += vel * dt;
    }
    const e = 1 - Math.exp(-dt * 7);
    ptr.x += (ptr.tx - ptr.x) * e;
    ptr.y += (ptr.ty - ptr.y) * e;
    layout();
    const still = !drag.active && Math.abs(target - theta) < 0.02 && Math.abs(vel) < 0.05
      && Math.abs(ptr.tx - ptr.x) + Math.abs(ptr.ty - ptr.y) < 0.002;
    if (still) {
      theta = target; vel = 0; ptr.x = ptr.tx; ptr.y = ptr.ty;
      layout();
      last = 0;
      return;
    }
    if (on && visible && !document.hidden) raf = requestAnimationFrame(tick);
    else last = 0;
  }
  const wake = () => { if (!raf && on && visible) raf = requestAnimationFrame(tick); };

  /** Amène le produit i devant par le plus court chemin. */
  function goTo(i) {
    const base = i * STEP;
    const turns = Math.round((target - base) / 360);
    target = base + turns * 360;
    wake();
  }
  const stepBy = (d) => { target = (Math.round(target / STEP) + d) * STEP; wake(); };

  /* ---------- Index : survol (intention 90 ms), focus, clic, flèches ---------- */
  let hoverT = 0;
  function bindRows() {
    rows.forEach((row, i) => {
      row.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || !on) return;
        clearTimeout(hoverT);
        hoverT = setTimeout(() => goTo(i), 90);
      });
      row.addEventListener('pointerleave', () => clearTimeout(hoverT));
      row.addEventListener('focusin', () => { if (on) goTo(i); });
    });
  }
  index.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vitrine-pick]');
    if (b && on) goTo(Number(b.dataset.vitrinePick));
  });
  index.addEventListener('keydown', (e) => {
    const b = e.target.closest('[data-vitrine-pick]');
    if (!b) return;
    const i = Number(b.dataset.vitrinePick);
    let j = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % n;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j === null) return;
    e.preventDefault();
    picks[j].focus();
  });
  $('[data-vitrine-prev]', root)?.addEventListener('click', () => stepBy(-1));
  $('[data-vitrine-next]', root)?.addEventListener('click', () => stepBy(1));

  /* ---------- Glisser pour tourner (souris et tactile) ---------- */
  scene.addEventListener('dragstart', (e) => e.preventDefault());
  scene.addEventListener('pointerdown', (e) => {
    if (!on || (e.pointerType === 'mouse' && e.button !== 0)) return;
    Object.assign(drag, { down: true, active: false, x0: e.clientX, th0: theta, lastX: e.clientX, lastT: performance.now(), v: 0, id: e.pointerId, item: e.target.closest('.vitrine__item') });
  });
  scene.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      const r = scene.getBoundingClientRect();
      ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      ptr.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      ptr.mx = ((e.clientX - r.left) / r.width) * 100;
      ptr.my = ((e.clientY - r.top) / r.height) * 100;
      wake();
    }
    if (!drag.down) return;
    const dx = e.clientX - drag.x0;
    if (!drag.active) {
      if (Math.abs(dx) < 6) return;
      drag.active = true;
      try { scene.setPointerCapture(drag.id); } catch { /* pointeur déjà relâché */ }
      root.classList.add('is-dragging');
    }
    const now = performance.now();
    const perPx = STEP / Math.max(240, W * 0.42);
    const prev = theta;
    theta = drag.th0 - dx * perPx;
    const dtm = Math.max(1, now - drag.lastT);
    drag.v = drag.v * 0.6 + (((theta - prev) / dtm) * 1000) * 0.4;
    drag.lastT = now;
    vel = drag.v;
    wake();
  });
  const release = () => {
    if (!drag.down) return;
    drag.down = false;
    if (drag.active) {
      drag.active = false;
      root.classList.remove('is-dragging');
      // Projection de l'inertie puis arrêt sur un produit (au plus 2 crans d'un coup)
      const proj = theta + clamp(drag.v * 0.22, -STEP * 2, STEP * 2);
      target = Math.round(proj / STEP) * STEP;
      vel = drag.v;
      wake();
    } else if (drag.item) {
      goTo(Number(drag.item.dataset.i));
    }
  };
  scene.addEventListener('pointerup', release);
  scene.addEventListener('pointercancel', release);
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    ptr.tx = 0; ptr.ty = 0;
    wake();
  });

  /* ---------- Visibilité : la boucle ne tourne que si la vitrine est à l'écran ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    visible = entries.some((en) => en.isIntersecting);
    if (visible && on && !introduced) intro();
    else if (visible) wake();
  }, { threshold: 0.2 }) : null;

  /** Entrée : l'anneau arrive en tournant (le ressort fait le reste). */
  function intro() {
    introduced = true;
    if (prefs.reduced) return;
    theta = target - STEP * 1.75;
    vel = 0;
    layout();
    if (orbit.animate) {
      orbit.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
    }
    wake();
  }

  /* ---------- Bascule desktop ↔ liste de base ---------- */
  // Mesures dans le rappel du ResizeObserver (après la mise en page : aucune mise en page forcée)
  const resize = () => { if (on) { measure(); layout(); } };
  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;

  function apply() {
    const want = mqDesk.matches && !prefs.reduced;
    if (want === on && (on || list.dataset.showRendered)) return;
    on = want;
    if (on) build(); else ensureList(list);
    root.hidden = !on;
    index.hidden = !on;
    list.hidden = on;
    section.classList.toggle('is-vitrine', on);
    if (on) {
      setActive(active, { force: true });
      if (ro) ro.observe(scene); else { measure(); layout(); }
      if (io) io.observe(root); else { visible = true; introduced = true; }
    } else {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      ro?.disconnect();
      io?.disconnect();
      visible = false;
    }
  }
  mqDesk.addEventListener('change', apply);
  onPrefsChange(apply);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  apply();
}

/* ==========================================================================
   Mobile : « coverflow » léger de la liste de base au défilement horizontal
   (rotation Y et échelle selon la distance au centre — transform uniquement)
   ========================================================================== */
export function initListFlow(section) {
  const list = $('.anniv__list', section);
  if (!list) return;
  let raf = 0;
  let enabled = false;
  const cards = () => $$('.pcard', list);

  const update = () => {
    raf = 0;
    // Repère : position d'arrêt du scroll-snap (bord gauche + marge de défilement)
    const lr = list.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0;
    cards().forEach((card) => {
      const li = card.parentElement;
      const r = li.getBoundingClientRect();
      const d = clamp((r.left - (lr.left + pad)) / r.width, -1.6, 1.6);
      card.style.transform = `perspective(900px) rotateY(${(-d * 16).toFixed(2)}deg) scale(${(1 - Math.min(1, Math.abs(d)) * 0.07).toFixed(4)})`;
    });
  };
  const onScroll = () => { if (enabled && !raf) raf = requestAnimationFrame(update); };
  const apply = () => {
    enabled = mqMobile.matches && !prefs.reduced;
    if (enabled) ensureList(list);
    list.classList.toggle('is-flow', enabled);
    if (enabled) onScroll(); // première mise à jour à la prochaine image (pas de mise en page forcée)
    else cards().forEach((c) => { c.style.transform = ''; });
  };
  list.addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  mqMobile.addEventListener('change', apply);
  onPrefsChange(apply);
  apply();
}
