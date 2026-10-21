/* ==========================================================================
   Curseur suiveur à états (souris uniquement, jamais en mouvement réduit)
   --------------------------------------------------------------------------
   Le curseur système reste visible ; un anneau le suit avec inertie.
   États via l'attribut data-cursor sur l'élément survolé (ou un parent) :
     data-cursor="Voir" | "Glisser" | "Ajouter" | tout texte court → bulle citron avec le texte
     data-cursor="lien"   → anneau grossi
     data-cursor="cache"  → curseur suiveur masqué (champs, canvas interactifs…)
   Les liens et boutons sans data-cursor prennent l'état « lien ».
   API : initCursor(), setCursor(etat, texte) pour forcer un état depuis le code
         (setCursor(null) rend la main à la détection automatique).
   ========================================================================== */

import { prefs } from './motion.js';
import { lerp } from './utils.js';

let el, ring, label;
let forced = null;

export function initCursor() {
  if (!prefs.finePointer || prefs.reduced || el) return;
  el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="cursor__ring"></span><span class="cursor__label"></span>';
  document.body.appendChild(el);
  ring = el.firstElementChild;
  label = el.lastElementChild;

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  let raf = 0, idle = 0;

  const loop = () => {
    ringPos.x = lerp(ringPos.x, pos.x, 0.2);
    ringPos.y = lerp(ringPos.y, pos.y, 0.2);
    const t = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    el.style.transform = t;
    // Arrêt de la boucle quand l'anneau a rejoint la souris (économie d'énergie)
    if (Math.abs(ringPos.x - pos.x) + Math.abs(ringPos.y - pos.y) < 0.1) { idle++; } else idle = 0;
    raf = idle > 10 ? 0 : requestAnimationFrame(loop);
  };
  const wake = () => { if (!raf) { idle = 0; raf = requestAnimationFrame(loop); } };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pos.x = e.clientX; pos.y = e.clientY;
    el.classList.add('is-active');
    if (!forced) applyState(e.target);
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', () => el.classList.remove('is-active'));
  addEventListener('blur', () => el.classList.remove('is-active'));
  addEventListener('pointerdown', () => el.classList.add('is-down'));
  addEventListener('pointerup', () => el.classList.remove('is-down'));
}

function applyState(target) {
  const host = target.closest ? target.closest('[data-cursor], a, button, [role="button"], label, summary') : null;
  let state = host ? host.getAttribute('data-cursor') : null;
  if (host && !state) state = 'lien';
  if (host && host.matches('input, textarea, select')) state = 'cache';
  render(state);
}

function render(state, text) {
  if (!el) return;
  el.classList.toggle('is-hidden', state === 'cache');
  el.classList.toggle('is-link', state === 'lien');
  const lbl = text || (state && !['lien', 'cache'].includes(state) ? state : '');
  el.classList.toggle('has-label', !!lbl);
  if (lbl && label.textContent !== lbl) label.textContent = lbl;
}

/** Force un état (ex. pendant un glisser) ; setCursor(null) rend la main. */
export function setCursor(state, text) {
  forced = state;
  render(state, text);
}
