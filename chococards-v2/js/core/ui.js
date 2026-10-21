/* ==========================================================================
   Interface générique : toast, overlays (tiroirs / recherche), défileurs
   --------------------------------------------------------------------------
   OVERLAYS — marquage :
     <div data-overlay="cart" hidden>
       <div class="overlay__backdrop" data-overlay-close></div>
       <div class="overlay__panel" role="dialog" aria-modal="true" aria-label="…">
         … <button data-overlay-close>…</button>
       </div>
     </div>
     Bouton d'ouverture : <button data-overlay-open="cart" aria-controls="…">
   Ouverture : hidden retiré, .is-open posé à la frame suivante (transitions CSS),
   focus piégé, Échap ferme, défilement verrouillé, reste de la page « inert ».
   Événements : 'overlay:open' / 'overlay:close' (detail { id, el }).
   API : openOverlay(id, opener?) / closeOverlay(id?) / isOverlayOpen(id)

   DÉFILEURS — boutons précédent / suivant d'une piste horizontale :
     <button data-scroll-prev="track-id"> / <button data-scroll-next="track-id">
     La piste défile de 85 % de sa largeur ; les boutons se désactivent aux bouts.

   TOAST — toast('Message') : annonce polie (role=status) + bulle visuelle.
   ========================================================================== */

import { prefs } from './motion.js';
import { lockScroll, unlockScroll } from './scroll.js';
import { $, $$, emit } from './utils.js';

/* ---------- Toast ---------- */
let toastTimer = 0;
export function toast(message, { duration = 3200 } = {}) {
  const el = $('[data-toast]');
  if (!el) return;
  el.innerHTML = '<svg aria-hidden="true"><use href="#i-check"/></svg><span></span>';
  el.lastElementChild.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), duration);
}

/* ---------- Overlays ---------- */
const stack = [];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary';

function setInert(on, except) {
  [...document.body.children].forEach((el) => {
    if (el === except || el.matches('script, .stage, .cursor, [data-toast], .skip-link')) return;
    if (on) { if (!el.inert) { el.inert = true; el.dataset.ccInert = '1'; } }
    else if (el.dataset.ccInert) { el.inert = false; delete el.dataset.ccInert; }
  });
}

/** Remonte l'overlay au niveau de <body> pour pouvoir rendre le reste « inert ». */
function hoist(el) {
  if (el.parentElement !== document.body) document.body.appendChild(el);
}

export function isOverlayOpen(id) {
  return stack.some((s) => s.id === id);
}

export function openOverlay(id, opener = document.activeElement) {
  const el = $(`[data-overlay="${id}"]`);
  if (!el || isOverlayOpen(id)) return;
  hoist(el);
  el.hidden = false;
  stack.push({ id, el, opener });
  setInert(true, el);
  lockScroll();
  $$(`[data-overlay-open="${id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
  const first = el.querySelector('[autofocus]') || el.querySelector('input, select, textarea') || el.querySelector(FOCUSABLE);
  setTimeout(() => first?.focus({ preventScroll: true }), prefs.reduced ? 0 : 60);
  emit('overlay:open', { id, el });
}

export function closeOverlay(id) {
  const entry = id ? stack.find((s) => s.id === id) : stack[stack.length - 1];
  if (!entry) return;
  stack.splice(stack.indexOf(entry), 1);
  const { el, opener } = entry;
  el.classList.remove('is-open');
  $$(`[data-overlay-open="${entry.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
  const done = () => { if (!el.classList.contains('is-open')) el.hidden = true; };
  setTimeout(done, prefs.reduced ? 0 : 450);
  if (!stack.length) setInert(false);
  unlockScroll();
  if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  emit('overlay:close', { id: entry.id, el });
}

function trapFocus(e) {
  const top = stack[stack.length - 1];
  if (!top || e.key !== 'Tab') return;
  const items = $$(FOCUSABLE, top.el).filter((n) => n.offsetParent !== null || n === document.activeElement);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------- Défileurs horizontaux ---------- */
function updateScroller(track) {
  const id = track.id;
  const max = track.scrollWidth - track.clientWidth - 2;
  $$(`[data-scroll-prev="${id}"]`).forEach((b) => { b.disabled = track.scrollLeft <= 2; });
  $$(`[data-scroll-next="${id}"]`).forEach((b) => { b.disabled = track.scrollLeft >= max; });
}

export function initScrollers(root = document) {
  const ids = new Set($$('[data-scroll-prev], [data-scroll-next]', root).map((b) => b.dataset.scrollPrev || b.dataset.scrollNext));
  ids.forEach((id) => {
    const track = document.getElementById(id);
    if (!track || track.dataset.ccScroller) return;
    track.dataset.ccScroller = '1';
    track.addEventListener('scroll', () => updateScroller(track), { passive: true });
    addEventListener('resize', () => updateScroller(track));
    updateScroller(track);
  });
}

export function initUI() {
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-overlay-open]');
    if (open) { e.preventDefault(); openOverlay(open.dataset.overlayOpen, open); return; }
    const close = e.target.closest('[data-overlay-close]');
    if (close) { e.preventDefault(); closeOverlay(close.closest('[data-overlay]')?.dataset.overlay); return; }
    const prev = e.target.closest('[data-scroll-prev]');
    const next = e.target.closest('[data-scroll-next]');
    if (prev || next) {
      const track = document.getElementById((prev || next).dataset.scrollPrev || (prev || next).dataset.scrollNext);
      if (track) track.scrollBy({ left: (next ? 1 : -1) * track.clientWidth * 0.85, behavior: prefs.reduced ? 'auto' : 'smooth' });
    }
  });
  // Formulaires : la recherche ne recharge pas la page ; newsletter de démonstration (validation + message)
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.matches('[data-search-form]')) { e.preventDefault(); return; }
    if (f.matches('[data-newsletter]:not([data-render-custom])')) {
      e.preventDefault();
      const input = f.querySelector('input[type="email"]');
      const msg = f.querySelector('.newsletter__msg');
      const ok = !!input && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      input?.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (msg) msg.textContent = ok ? 'Merci ! Vous recevrez nos prochaines infos.' : 'Adresse e-mail invalide : vérifiez-la (par exemple nom@domaine.be).';
      if (ok) { f.reset(); toast('Inscription à la newsletter enregistrée.'); }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length) { e.preventDefault(); closeOverlay(); }
    trapFocus(e);
  });
  initScrollers();
}
