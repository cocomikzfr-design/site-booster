/* ==========================================================================
   Boutons magnétiques (souris uniquement, jamais en mouvement réduit)
   --------------------------------------------------------------------------
   <a class="btn" data-magnetic>…</a>          → force par défaut 0.35
   <a class="btn" data-magnetic="0.6">…</a>    → force personnalisée
   Un enfant [data-magnetic-inner] (facultatif) suit un peu plus fort (parallaxe).
   initMagnetic(racine) : branche tous les [data-magnetic] de la racine.
   magnetic(el, { strength }) : branche un élément, renvoie une fonction d'arrêt.
   ========================================================================== */

import { gsap } from './libs.js';
import { prefs } from './motion.js';
import { $$ } from './utils.js';

const bound = new WeakSet();

export function magnetic(el, { strength } = {}) {
  if (!el || bound.has(el) || !prefs.finePointer || prefs.reduced) return () => {};
  bound.add(el);
  const k = strength ?? (parseFloat(el.dataset.magnetic) || 0.35);
  const inner = el.querySelector('[data-magnetic-inner]');
  let setX, setY, setIX, setIY;
  if (gsap) {
    setX = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    setY = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    if (inner) {
      setIX = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' });
      setIY = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' });
    }
  } else {
    // Repli sans GSAP : translation CSS directe
    setX = (v) => { el.style.translate = `${v}px ${el._my || 0}px`; el._mx = v; };
    setY = (v) => { el.style.translate = `${el._mx || 0}px ${v}px`; el._my = v; };
  }
  const move = (e) => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    setX(dx * k); setY(dy * k);
    setIX?.(dx * k * 0.5); setIY?.(dy * k * 0.5);
  };
  const leave = () => { setX(0); setY(0); setIX?.(0); setIY?.(0); };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    leave();
    bound.delete(el);
  };
}

export function initMagnetic(root = document) {
  if (!prefs.finePointer || prefs.reduced) return;
  $$('[data-magnetic]', root).forEach((el) => magnetic(el));
}
