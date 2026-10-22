/* ==========================================================================
   Petite boîte à outils du constructeur « chrome » (header, menus, recherche,
   panier, confiance, footer). Rien ici ne dépend de GSAP : tout fonctionne
   aussi quand le CDN est indisponible (?nolibs).
   ========================================================================== */

import { prefs } from '../../core/motion.js';

/** Courbes (miroir des --ease-* de base.css). */
export const EASE_OUT = 'cubic-bezier(.16, 1, .3, 1)';
export const EASE_BACK = 'cubic-bezier(.34, 1.56, .64, 1)';
export const EASE_SOFT = 'cubic-bezier(.25, .8, .25, 1)';

/**
 * Animation Web Animations « sûre » : rien en mouvement réduit, ne lève jamais.
 * Par défaut fill: 'backwards' → l'état final reste celui du CSS (rien ne reste caché
 * si l'animation est annulée ou si l'onglet est en arrière-plan).
 */
export function play(el, keyframes, opts = {}) {
  if (!el || prefs.reduced || typeof el.animate !== 'function') return null;
  try {
    return el.animate(keyframes, { duration: 600, easing: EASE_OUT, fill: 'backwards', ...opts });
  } catch {
    return null;
  }
}

/** Normalise une chaîne pour la recherche : minuscules, sans accents. */
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Affiche un élément [hidden] puis pose la classe d'état à la frame suivante
 * (les transitions CSS partent de l'état fermé).
 */
export function showEl(el, cls = 'is-open') {
  if (!el) return;
  clearTimeout(el._ccHide);
  el.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => { if (!el.hidden) el.classList.add(cls); }));
}

/** Retire la classe d'état puis remet [hidden] après la transition de sortie. */
export function hideEl(el, cls = 'is-open', ms = 320) {
  if (!el) return;
  el.classList.remove(cls);
  clearTimeout(el._ccHide);
  el._ccHide = setTimeout(() => { if (!el.classList.contains(cls)) el.hidden = true; }, prefs.reduced ? 0 : ms);
}

/** Ferme tout de suite (sans transition). */
export function hideNow(el, cls = 'is-open') {
  if (!el) return;
  clearTimeout(el._ccHide);
  el.classList.remove(cls);
  el.hidden = true;
}

/** Interpolation d'un nombre (rAF) : onUpdate(valeur) jusqu'à la cible. Renvoie une fonction d'arrêt. */
export function tweenNumber(from, to, onUpdate, { duration = 520 } = {}) {
  if (prefs.reduced || from === to) { onUpdate(to); return () => {}; }
  let raf = 0;
  const t0 = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    const e = 1 - Math.pow(1 - t, 4);
    onUpdate(from + (to - from) * e);
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Vrai si l'élément est affiché (taille non nulle). */
export const isShown = (el) => !!el && el.getClientRects().length > 0;

/** Liste des éléments focusables visibles dans root. */
export function focusables(root) {
  if (!root) return [];
  return [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), summary')]
    .filter((el) => isShown(el) && !el.closest('[hidden], [inert]'));
}
