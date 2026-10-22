/* ==========================================================================
   Hero · géométrie de l'affiche « Le Deck » (repli CSS)
   --------------------------------------------------------------------------
   La scène WebGL et l'intro (cartes du préchargeur) reprennent EXACTEMENT la
   composition CSS : on lit la boîte de mise en page de chaque élément
   (offsetLeft/Top/Width/Height, sans les transformations animées) et son angle.
   Coordonnées renvoyées : pixels CSS, relatives au coin haut-gauche de .deck.
   ========================================================================== */

const RAD = Math.PI / 180;

/** Lit « 12px 34px » (transform-origin calculé) → [12, 34]. */
function origin(cs) {
  const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
  return [ox || 0, oy || 0];
}

/**
 * Pose d'un dos de carte (.deck__back) : rotate(var(--r)) autour de transform-origin
 * (50 % 130 % : l'éventail pivote sous les cartes).
 * Renvoie le centre tourné, le pivot et le vecteur pivot → centre non tourné
 * (pour ré-ouvrir l'éventail en gardant le même pivot).
 */
export function backPose(el) {
  const cs = getComputedStyle(el);
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const [ox, oy] = origin(cs);
  const deg = parseFloat(cs.getPropertyValue('--r')) || 0;
  const px = el.offsetLeft + ox;
  const py = el.offsetTop + oy;
  const vx = w / 2 - ox;
  const vy = h / 2 - oy;
  const c = rotateAround(px, py, vx, vy, deg);
  return { cx: c.x, cy: c.y, w, h, deg, px, py, vx, vy };
}

/** Centre d'une carte qui tourne de deg autour du pivot (px, py). */
export function rotateAround(px, py, vx, vy, deg) {
  const a = deg * RAD;
  const cos = Math.cos(a), sin = Math.sin(a);
  return { x: px + vx * cos - vy * sin, y: py + vx * sin + vy * cos };
}

/** Pose d'une photo détourée (.deck__photo) : boîte carrée, angle --rot. */
export function photoPose(el) {
  const cs = getComputedStyle(el);
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return {
    cx: el.offsetLeft + w / 2,
    cy: el.offsetTop + h / 2,
    w, h,
    deg: parseFloat(cs.getPropertyValue('--rot')) || 0,
  };
}

/** Halo (.deck__glow) : boîte simple. */
export function boxPose(el) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return { cx: el.offsetLeft + w / 2, cy: el.offsetTop + h / 2, w, h, deg: 0 };
}

/**
 * Courbe cubic-bezier (x1, y1, x2, y2) → fonction t ∈ [0, 1] → valeur.
 * Sert à rejouer en WebGL l'animation CSS cc-float (var(--ease-in-out)).
 */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}

const easeInOut = cubicBezier(0.65, 0, 0.35, 1);

/**
 * Valeurs de l'animation CSS cc-float à la phase f ∈ [0, 1[ :
 * 0 % et 100 % → repos ; 50 % → translateY(-12px) rotate(+1.5deg).
 */
export function floatAt(f) {
  const half = f < 0.5;
  const e = easeInOut(half ? f / 0.5 : (f - 0.5) / 0.5);
  const k = half ? e : 1 - e;
  return { y: -12 * k, deg: 1.5 * k };
}

/** Phase actuelle (0–1) de l'animation CSS cc-float d'un élément, ou null. */
export function cssFloatPhase(el) {
  try {
    const anim = el.getAnimations?.().find((a) => a.animationName === 'cc-float');
    const p = anim?.effect?.getComputedTiming?.().progress;
    return typeof p === 'number' ? p : null;
  } catch {
    return null;
  }
}
