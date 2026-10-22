/* ==========================================================================
   Hero · pointeur partagé (souris, gyroscope, doigt) avec ressort et inertie
   --------------------------------------------------------------------------
   Les événements ne font qu'écrire une CIBLE (tx, ty dans [-1, 1]) ; la boucle
   active (parallaxe CSS de l'affiche, puis scène WebGL) appelle step(dt) qui
   fait suivre (x, y) avec un ressort légèrement sous-amorti : le paquet
   « traîne » derrière la souris puis se pose (inertie, façon Lusion).
   ========================================================================== */

import { clamp } from '../../core/utils.js';

export function createPointer() {
  const p = {
    tx: 0, ty: 0,          // cible normalisée
    x: 0, y: 0,            // valeur lissée
    vx: 0, vy: 0,          // vitesse du ressort
    cx: -9999, cy: -9999,  // position écran brute (px), -9999 = inconnue
    lastInput: 0,          // horodatage de la dernière entrée réelle
    step(dt, stiffness = 64, ratio = 0.68) {
      const h = Math.min(dt, 1 / 30);
      const c = 2 * Math.sqrt(stiffness) * ratio;
      p.vx += (stiffness * (p.tx - p.x) - c * p.vx) * h;
      p.vy += (stiffness * (p.ty - p.y) - c * p.vy) * h;
      p.x += p.vx * h;
      p.y += p.vy * h;
      return p;
    },
    get settled() {
      return Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) + Math.abs(p.vx) + Math.abs(p.vy) < 0.002;
    },
  };
  return p;
}

/** Souris (pointeur fin) : position dans la fenêtre. */
export function bindMouse(p, onMove) {
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    p.cx = e.clientX;
    p.cy = e.clientY;
    p.tx = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1);
    p.ty = clamp((e.clientY / innerHeight) * 2 - 1, -1, 1);
    p.lastInput = performance.now();
    onMove?.(e);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => {
    p.tx = 0; p.ty = 0; p.cx = -9999; p.cy = -9999;
  });
}

/**
 * Tactile : gyroscope quand il est disponible SANS demande d'autorisation
 * (Android ; sur iOS on ne déclenche pas de boîte de dialogue système),
 * sinon glisser le doigt sur le visuel.
 */
export function bindTouch(p, el) {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission !== 'function') {
    let beta0 = null;
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null || e.beta == null) return;
      if (beta0 === null) beta0 = e.beta;
      beta0 += (e.beta - beta0) * 0.01; // la position de tenue dérive lentement vers le neutre
      p.tx = clamp(e.gamma / 28, -1, 1);
      p.ty = clamp((e.beta - beta0) / 22, -1, 1);
      p.lastInput = performance.now();
    }, { passive: true });
  }
  if (!el) return;
  const move = (e) => {
    const r = el.getBoundingClientRect();
    p.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    p.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    p.cx = e.clientX;
    p.cy = e.clientY;
    p.lastInput = performance.now();
  };
  el.addEventListener('pointerdown', move, { passive: true });
  el.addEventListener('pointermove', move, { passive: true });
}
