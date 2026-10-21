/* ==========================================================================
   Apparitions au défilement (reveal) — avec fail-safes
   --------------------------------------------------------------------------
   Attributs (sur un élément ENVELOPPE, pas sur un composant animé ailleurs) :
     data-reveal            → monte + fondu (défaut « up »)
     data-reveal="fade"     → fondu seul
     data-reveal="scale"    → léger zoom
     data-reveal="blur"     → flou + fondu (titres courts, style « movento »)
     data-reveal="lines"    → titre découpé en lignes masquées (SplitText)
     data-reveal-stagger    → les enfants directs apparaissent l'un après l'autre
     style="--delay: 120ms" → décalage manuel
   Le CSS (base.css §10) ne cache rien tant que html.anim-ready n'est pas posé.

   FAIL-SAFES (le texte ne reste jamais invisible) :
   1. html.anim-ready n'est posé qu'après la mise en place complète (armReveals).
   2. Ce qui est déjà à l'écran au moment d'armer est affiché sans animation.
   3. Filet de sécurité : au défilement, au redimensionnement et toutes les
      1,5 s pendant 30 s, tout élément au-dessus du bas de l'écran est révélé
      (couvre un IntersectionObserver muet, un saut d'ancre, un onglet caché).
   4. beforeprint → tout est révélé.
   5. Erreur JS non rattrapée → html.anim-ready est retiré : tout s'affiche.
   ========================================================================== */

import { prefs } from './motion.js';
import { splitText } from './split.js';
import { $$, throttle } from './utils.js';

const SEL = '[data-reveal], [data-reveal-stagger]';
let io = null;
let armed = false;
const splits = new Map();

function markDone(el) {
  // Après l'animation : on retire les transitions et on rend le texte d'origine (re-coupe au redimensionnement inutile)
  const total = 1400 + (parseFloat(getComputedStyle(el).getPropertyValue('--delay')) || 0);
  setTimeout(() => {
    el.classList.add('is-done');
    const s = splits.get(el);
    if (s) { s.revert(); splits.delete(el); }
  }, total);
}

/** Révèle un élément (idempotent). */
export function reveal(el) {
  if (!el || el.classList.contains('is-in')) return;
  el.classList.add('is-in');
  io?.unobserve(el);
  markDone(el);
}

/** Révèle tout (impression, erreur, mouvement réduit). */
export function revealAll(root = document) {
  $$(SEL, root).forEach((el) => { el.classList.add('is-in', 'is-done'); io?.unobserve(el); });
}

function prepare(root) {
  $$(SEL, root).forEach((el) => {
    if (el.hasAttribute('data-reveal-stagger')) {
      [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
    }
    if (el.getAttribute('data-reveal') === 'lines' && !splits.has(el) && !el.classList.contains('is-in')) {
      const s = splitText(el, { type: 'lines', mask: true });
      s.lines.forEach((l, i) => l.style.setProperty('--line', i));
      splits.set(el, s);
    }
  });
}

/** Révèle ce qui est déjà au-dessus du bas de l'écran (filet de sécurité). */
function sweep(root = document) {
  const limit = innerHeight * 1.02;
  $$(SEL, root).forEach((el) => {
    if (el.classList.contains('is-in')) return;
    const r = el.getBoundingClientRect();
    if (r.top < limit && (r.bottom > -innerHeight * 4 || r.top < 0)) reveal(el);
  });
}

/**
 * Observe les éléments à révéler. À appeler une fois au démarrage (et après
 * l'ajout dynamique de contenu : observeReveals(conteneur)).
 */
export function observeReveals(root = document) {
  if (!io) return;
  $$(SEL, root).forEach((el) => { if (!el.classList.contains('is-in')) io.observe(el); });
}

/**
 * Arme le système : découpe les titres, révèle ce qui est déjà visible, puis
 * pose html.anim-ready. Ne cache rien en mouvement réduit.
 */
export function armReveals(root = document) {
  if (armed) return;
  armed = true;
  const html = document.documentElement;
  if (prefs.reduced || !('IntersectionObserver' in window)) { revealAll(root); return; }

  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) reveal(e.target); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  prepare(root);
  // Ce qui est déjà à l'écran : affiché tout de suite, sans animation
  const limit = innerHeight;
  $$(SEL, root).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < limit) el.classList.add('is-in', 'is-done');
  });
  splits.forEach((s, el) => { if (el.classList.contains('is-in')) { s.revert(); splits.delete(el); } });
  observeReveals(root);
  html.classList.add('anim-ready');

  // Filets de sécurité
  const sweepT = throttle(() => sweep(root), 200);
  addEventListener('scroll', sweepT, { passive: true });
  addEventListener('resize', sweepT);
  let n = 0;
  const iv = setInterval(() => { sweep(root); if (++n > 20) clearInterval(iv); }, 1500);
  addEventListener('beforeprint', () => revealAll(root));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sweep(root); });
}

/** Retire le mode « animations prêtes » : tout le contenu redevient visible. */
export function disarmReveals() {
  document.documentElement.classList.remove('anim-ready');
  splits.forEach((s) => s.revert());
  splits.clear();
}
