// assets/motion-core.js : une seule boucle rAF pour tout le site.
// Chaque abonné reçoit (dt, t) ; il renvoie false pour se désabonner. La boucle s'arrête quand
// plus personne n'écoute et quand l'onglet est caché.
const subs = new Set(); let raf = 0, last = 0;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
reduceMotion.addEventListener('change', (e) => root.classList.toggle('reduce-motion', e.matches));
export const isReduced = () => reduceMotion.matches || root.classList.contains('reduce-motion');

function frame(now) {
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
  for (const fn of subs) if (fn(dt, now / 1000) === false) subs.delete(fn);
  raf = subs.size ? requestAnimationFrame(frame) : 0; if (!raf) last = 0;
}
export function subscribe(fn) { subs.add(fn); if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }
export function unsubscribe(fn) { subs.delete(fn); }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; last = 0; }
  else if (subs.size && !raf) raf = requestAnimationFrame(frame);
});

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const damp = (c, t, k, dt) => c + (t - c) * (1 - Math.exp(-k * dt));
export const smoothstep = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
export const wrap = (v, n) => { const m = ((v % n) + n) % n; return m > n / 2 ? m - n : m; };
export const mod = (v, n) => ((v % n) + n) % n;
// Progression locale d'un intervalle [a, b] de p, lissée
export const span = (p, a, b) => smoothstep((p - a) / (b - a));

export const EASE = 'cubic-bezier(.2,.8,.2,1)';
export const EASE_IO = 'cubic-bezier(.76,0,.18,1)';
export const EASE_BACK = 'cubic-bezier(.34,1.45,.64,1)';

// Lance fn(el) sur chaque élément correspondant, au chargement et quand l'éditeur recharge une section
export function onSections(selector, fn) {
  document.querySelectorAll(selector).forEach(fn);
  document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll(selector).forEach(fn));
}
