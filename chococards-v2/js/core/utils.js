/* ==========================================================================
   Petits outils génériques (DOM, maths, timing, événements)
   ========================================================================== */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** Ramène v de [a1, b1] vers [a2, b2]. */
export const mapRange = (v, a1, b1, a2, b2) => a2 + ((v - a1) * (b2 - a2)) / (b1 - a1);

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

export function debounce(fn, ms = 150) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function throttle(fn, ms = 100) {
  let last = 0, t;
  return (...a) => {
    const now = performance.now();
    if (now - last >= ms) { last = now; fn(...a); }
    else { clearTimeout(t); t = setTimeout(() => { last = performance.now(); fn(...a); }, ms - (now - last)); }
  };
}

/** Exécute fn quand le navigateur est libre (ou au plus tard après timeout ms). */
export function onIdle(fn, timeout = 1200) {
  if ('requestIdleCallback' in window) return requestIdleCallback(fn, { timeout });
  return setTimeout(fn, 1);
}

/**
 * Exécute fn(el) une seule fois quand el approche de l'écran (marge par défaut : 1 écran).
 * Idéal pour initialiser une section lourde (WebGL, ScrollTrigger) au dernier moment.
 */
export function whenNear(el, fn, rootMargin = '100% 0px') {
  if (!el) return () => {};
  if (!('IntersectionObserver' in window)) { fn(el); return () => {}; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(el); }
  }, { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}

/** Appelle cb(true|false) quand el entre / sort de l'écran. Renvoie une fonction d'arrêt. */
export function onVisible(el, cb, rootMargin = '0px') {
  if (!el || !('IntersectionObserver' in window)) { cb(true); return () => {}; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting, e)), { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}

/** Émet un événement personnalisé sur document. */
export const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
/** Écoute un événement personnalisé sur document. Renvoie une fonction de désabonnement. */
export function on(name, cb) {
  const h = (e) => cb(e.detail, e);
  document.addEventListener(name, h);
  return () => document.removeEventListener(name, h);
}

/** Échappe une chaîne pour l'insérer dans du HTML. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Précharge et décode une image. Ne rejette jamais (renvoie null en cas d'échec). */
export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Boucle requestAnimationFrame simple : renvoie { start, stop, running }. */
export function rafLoop(fn) {
  let id = 0, last = 0, running = false;
  const tick = (t) => {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
    last = t;
    fn(t / 1000, dt);
    if (running) id = requestAnimationFrame(tick);
  };
  return {
    start() { if (!running) { running = true; last = 0; id = requestAnimationFrame(tick); } },
    stop() { running = false; cancelAnimationFrame(id); },
    get running() { return running; },
  };
}
