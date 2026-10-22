/* ==========================================================================
   Bandeau défilant (SECTION:marquee) — vitesse pilotée par le défilement
   --------------------------------------------------------------------------
   - Bouton pause (WCAG 2.2.2) sur tous les écrans : fige la boucle.
   - Souris : la boucle CSS est remplacée par une boucle JS. La vitesse
     s'emballe avec la vitesse de défilement, le sens suit le sens du
     défilement (vers le haut = le bandeau repart à l'envers) et le texte
     s'incline légèrement (skewX), puis tout revient au calme. Le survol
     freine le bandeau jusqu'à l'arrêt (lecture confortable).
   - Tactile : simple boucle CSS (sections.css), comme prévu au DESIGN.
   - Mouvement réduit : liste fixe et centrée (sections.css), pas de bouton.
   La boucle JS ne tourne que si le bandeau est à l'écran et l'onglet visible.
   ========================================================================== */

import { prefs } from '../../core/motion.js';
import { onScroll } from '../../core/scroll.js';
import { clamp } from '../../core/utils.js';

export function initMarquee(el) {
  if (!el) return;
  const vp = el.querySelector('[data-marquee-viewport]');
  const track = el.querySelector('[data-marquee-track]');
  const btn = el.querySelector('[data-marquee-toggle]');
  let paused = false;
  let wake = () => {};

  btn?.addEventListener('click', () => {
    paused = !paused;
    el.classList.toggle('is-paused', paused);
    btn.setAttribute('aria-pressed', String(paused));
    if (!paused) wake();
  });

  if (prefs.reduced || !prefs.finePointer || !vp || !track) return;

  document.documentElement.classList.add('hero-mq-js');
  let half = track.getBoundingClientRect().width; // une piste = la moitié de la boucle
  let x = 0;
  let v = 0;
  let vTarget = 0;
  let lastScroll = 0;
  let skew = 0;
  let dir = 1;
  let brake = 1;
  let hovering = false;
  let visible = true;
  let raf = 0;
  let last = 0;

  const loop = (now) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (performance.now() - lastScroll > 120) vTarget = 0;
    v += (vTarget - v) * Math.min(1, dt * 8);
    brake += ((hovering ? 0 : 1) - brake) * Math.min(1, dt * 4);
    // Vitesse de base identique à la boucle CSS (une piste en 38 s), + élan du défilement
    const speed = (half / 38 + Math.min(1600, Math.abs(v) * 42)) * dir * brake;
    x -= speed * dt;
    if (half > 0) {
      x %= half;
      if (x > 0) x -= half;
    }
    skew += (clamp(v * 0.3, -9, 9) * brake - skew) * Math.min(1, dt * 10);
    vp.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
    if (!paused && visible && !document.hidden) raf = requestAnimationFrame(loop);
    else last = 0;
  };
  const start = () => {
    if (raf || paused || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  };
  wake = start;

  onScroll(({ velocity }) => {
    vTarget = velocity || 0;
    lastScroll = performance.now();
    if (Math.abs(vTarget) > 0.5) dir = vTarget > 0 ? 1 : -1;
    start();
  });
  el.addEventListener('pointerenter', () => { hovering = true; });
  el.addEventListener('pointerleave', () => { hovering = false; start(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; start(); }).observe(el);
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { half = track.getBoundingClientRect().width; }).observe(track);
  }
  document.addEventListener('visibilitychange', start);
  start();
}
