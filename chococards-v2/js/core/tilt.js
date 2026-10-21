/* ==========================================================================
   Tilt 3D + reflet holo qui suit le pointeur (souris uniquement)
   --------------------------------------------------------------------------
   <div data-tilt>…<span class="foil"></span></div>       → inclinaison max 8°
   <div data-tilt="4">…</div>                               → inclinaison max 4°
   Écrit sur l'élément : --rx, --ry (degrés), --mx, --my (position du reflet,
   en %), et la classe .is-tilting pendant le survol. Le CSS de base.css
   applique transform + reflet (.foil). Sans souris : rien ne bouge.
   initTilt(racine) : branche les [data-tilt] ; tilt(el) : un seul élément.
   ========================================================================== */

import { prefs } from './motion.js';
import { $$ } from './utils.js';

const bound = new WeakSet();

export function tilt(el) {
  if (!el || bound.has(el) || !prefs.finePointer || prefs.reduced) return () => {};
  bound.add(el);
  const max = parseFloat(el.dataset.tilt) || 8;
  let raf = 0, px = 0.5, py = 0.5;
  const write = () => {
    raf = 0;
    el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };
  const move = (e) => {
    const r = el.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width;
    py = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(write);
  };
  const enter = () => el.classList.add('is-tilting');
  const leave = () => {
    el.classList.remove('is-tilting');
    cancelAnimationFrame(raf); raf = 0;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  el.addEventListener('pointerenter', enter);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointerenter', enter);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    leave();
    bound.delete(el);
  };
}

export function initTilt(root = document) {
  if (!prefs.finePointer || prefs.reduced) return;
  $$('[data-tilt]', root).forEach((el) => tilt(el));
}
