/* ==========================================================================
   Header : états au défilement, teinte du monde actif, reflet, raccourcis
   --------------------------------------------------------------------------
   États (classes sur [data-header]) :
     .is-compact   → au-delà de 80 px : la rangée du méga-menu se replie sous la barre
     .is-expanded  → header compact déplié (survol, focus clavier, onglet « Menu »)
     .is-hidden    → défilement vers le bas : le header glisse hors de l'écran
                     (il revient dès que l'on remonte, ou au focus clavier)
   html.hdr-hidden → le panier « satellite » prend le relais en haut à droite
                     (cible du vol des cartes quand le header est caché).
   Mouvement réduit : jamais caché (pas de glissement), le repli reste instantané.
   Tout est en transform / opacity ; une seule écriture de style par frame.
   ========================================================================== */

import { prefs } from '../../core/motion.js';
import { $, $$, on } from '../../core/utils.js';
import { onWorldChange, getWorld } from '../../core/worlds.js';
import { openOverlay, closeOverlay, isOverlayOpen } from '../../core/ui.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
const COMPACT_AT = 80;   // px avant repli de la rangée de navigation
const HIDE_AFTER = 320;  // px avant de pouvoir cacher le header
const HIDE_DELTA = 28;   // descente cumulée qui cache le header
const SHOW_DELTA = 14;   // remontée cumulée qui le fait revenir

const state = {
  header: null,
  compact: false,
  hidden: false,
  expanded: false,
  hover: false,
  pinnedOpen: false, // déplié par l'onglet « Menu » (tactile ou clic)
  holds: new Set(),  // raisons de garder le header visible et déplié (méga-menu ouvert, sélecteur…)
};

/** Garde le header visible et déplié tant qu'une raison est active (ex. 'mega', 'locale'). */
export function holdHeader(reason, on = true) {
  if (on) state.holds.add(reason); else state.holds.delete(reason);
  applyState();
}

export const headerState = state;

const listeners = new Set();
/** cb({ compact, hidden, expanded }) à chaque changement d'état. */
export function onHeaderState(cb) { listeners.add(cb); return () => listeners.delete(cb); }

/** Focus clavier dans le header (un focus rendu après un toucher ne bloque pas le masquage). */
function keyboardFocusIn(h) {
  const a = document.activeElement;
  if (!a || !h.contains(a)) return false;
  try { return a.matches(':focus-visible'); } catch { return true; }
}

function applyState() {
  const h = state.header;
  if (!h) return;
  const held = state.holds.size > 0;
  const focusIn = keyboardFocusIn(h);
  const hidden = state.hidden && !held && !focusIn && !state.hover;
  const expanded = !state.compact || held || focusIn || state.hover || state.pinnedOpen;
  const changed = h.classList.contains('is-hidden') !== hidden || h.classList.contains('is-expanded') !== expanded
    || h.classList.contains('is-compact') !== state.compact;
  h.classList.toggle('is-compact', state.compact);
  h.classList.toggle('is-expanded', state.compact && expanded);
  h.classList.toggle('is-hidden', hidden);
  document.documentElement.classList.toggle('hdr-hidden', hidden);
  const tab = $('[data-hdr-tab]', h);
  tab?.setAttribute('aria-expanded', String(state.compact ? expanded : true));
  if (changed) listeners.forEach((cb) => cb({ compact: state.compact, hidden, expanded: !state.compact || expanded }));
}

/** Défilement : repli, masquage, barre de progression (une lecture + une écriture par frame). */
function initScrollStates(h) {
  const progress = $('[data-hdr-progress]', h);
  let lastY = scrollY;
  let acc = 0;
  let raf = 0;
  let maxY = 1;
  // Hauteur de page : jamais lue dans un gestionnaire d'événement (ce qui forcerait un
  // recalcul de style au démarrage) ; on marque « à remesurer » et la lecture se fait
  // dans la frame de défilement suivante, quand la mise en page est déjà à jour.
  let dirty = true;
  const invalidate = () => { dirty = true; };
  addEventListener('resize', () => { invalidate(); request(); }, { passive: true });
  addEventListener('load', invalidate);

  const frame = () => {
    raf = 0;
    const y = Math.max(0, scrollY);
    const dy = y - lastY;
    lastY = y;
    if (progress && (y > 0 || !dirty)) {
      if (dirty) { maxY = Math.max(1, document.documentElement.scrollHeight - innerHeight); dirty = false; }
      progress.style.transform = `scaleX(${Math.min(1, y / maxY).toFixed(4)})`;
    }
    if (document.documentElement.classList.contains('is-locked')) return; // tiroir ouvert : on ne touche à rien
    const compact = y > COMPACT_AT;
    let hidden = state.hidden;
    if (prefs.reduced || y < HIDE_AFTER) {
      hidden = false;
      acc = 0;
    } else if (dy) {
      if (Math.sign(dy) !== Math.sign(acc)) acc = 0;
      acc += dy;
      if (acc > HIDE_DELTA) hidden = true;
      else if (acc < -SHOW_DELTA) hidden = false;
    }
    // Un header déplié à la main se replie dès que l'on défile franchement
    if (state.pinnedOpen && Math.abs(dy) > 24) state.pinnedOpen = false;
    if (compact !== state.compact || hidden !== state.hidden) {
      state.compact = compact;
      state.hidden = hidden;
      applyState();
    }
  };
  function request() { if (!raf) raf = requestAnimationFrame(frame); }
  addEventListener('scroll', request, { passive: true });
  // Hauteur de page changeante (contenu rendu plus tard, épinglages) : on remesure de temps en temps
  on('app:ready', invalidate); // pas de lecture ici : la prochaine frame de défilement s'en charge
  setTimeout(invalidate, 3000);
  frame();
}

/** Survol (souris) et focus clavier : le header compact se déplie, le header caché revient. */
function initPresence(h) {
  let leaveT = 0;
  let enterT = 0;
  h.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(leaveT);
    clearTimeout(enterT);
    enterT = setTimeout(() => { state.hover = true; applyState(); }, 90);
  });
  h.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(enterT);
    clearTimeout(leaveT);
    leaveT = setTimeout(() => { state.hover = false; applyState(); }, 260);
  });
  // focusin / focusout : le header suit le focus (navigation au clavier)
  // Header caché : il revient sans transition, sinon le navigateur ferait défiler la page
  // pour montrer l'élément qui reçoit le focus (encore hors de l'écran pendant la transition)
  const revealNow = () => {
    state.hidden = false; // révélé ; un nouveau défilement vers le bas pourra le recacher
    h.classList.add('is-instant');
    applyState();
    void h.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.remove('is-instant')));
  };
  h.addEventListener('focusin', () => {
    if (h.classList.contains('is-hidden')) revealNow(); else applyState();
  });
  // Tabulation vers le header : le header est collant (sticky) et, au focus, Chrome fait
  // défiler la page de façon imprévisible (de 18 à 400 px selon la position). On devine donc
  // la prochaine cible (ordre du DOM) ; si elle est dans le header, on révèle celui-ci au
  // besoin et on y place le focus nous-mêmes, sans défilement. Ailleurs : comportement natif.
  const tabbable = (el) => el.tabIndex >= 0 && !el.closest('[hidden], [inert]')
    && (el.checkVisibility ? el.checkVisibility({ visibilityProperty: true }) : el.getClientRects().length > 0);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || $('[data-overlay]:not([hidden])')) return; // tiroir ouvert : piège du socle
    const list = $$(FOCUSABLE).filter(tabbable);
    const i = list.indexOf(document.activeElement);
    if (i < 0) return; // point de départ inconnu (clic, élément non tabulable) : on laisse faire
    const next = list[i + (e.shiftKey ? -1 : 1)];
    if (!next || !h.contains(next)) return;
    if (h.classList.contains('is-hidden')) revealNow();
    e.preventDefault();
    next.focus({ preventScroll: true });
  }, true);
  h.addEventListener('focusout', () => requestAnimationFrame(applyState));

  // Onglet « Menu » (visible quand la navigation est repliée)
  const tab = $('[data-hdr-tab]', h);
  tab?.addEventListener('click', () => {
    state.pinnedOpen = !state.pinnedOpen || !h.classList.contains('is-expanded');
    applyState();
    if (state.pinnedOpen) $('.mega__link', h)?.focus({ preventScroll: true });
  });
  // Clic hors du header : on replie ce qui a été déplié à la main
  document.addEventListener('pointerdown', (e) => {
    if (state.pinnedOpen && !h.contains(e.target)) { state.pinnedOpen = false; applyState(); }
  });
}

/** Teinte du verre selon le monde de couleur actif (CSS : .header[data-hdr-world]). */
function initWorldTint(h) {
  const set = (name) => { if (name) h.dataset.hdrWorld = name; };
  set(getWorld() || document.documentElement.dataset.worldActive || 'nuit');
  onWorldChange((name) => set(name));
}

/** Reflet qui suit la souris dans la barre (transform seul, rAF). */
function initLight(h) {
  const light = $('[data-hdr-light]', h);
  const bar = $('.header__bar', h);
  if (!light || !bar || !prefs.finePointer || prefs.reduced) return;
  let x = 0, tx = 0, raf = 0, w = 1;
  const loop = () => {
    x += (tx - x) * 0.16;
    light.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    raf = Math.abs(tx - x) > 0.4 ? requestAnimationFrame(loop) : 0;
  };
  bar.addEventListener('pointerenter', () => { w = bar.offsetWidth; light.classList.add('is-on'); });
  bar.addEventListener('pointermove', (e) => {
    const r = bar.getBoundingClientRect();
    w = r.width;
    tx = e.clientX - r.left - light.offsetWidth / 2;
    tx = Math.max(-light.offsetWidth / 3, Math.min(w - (light.offsetWidth * 2) / 3, tx));
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  bar.addEventListener('pointerleave', () => light.classList.remove('is-on'));
}

/** Panier satellite (cible du vol quand le header est caché) + rebond de la pastille. */
function initCartFeedback(h) {
  const sat = $('[data-cart-satellite]');
  const headerCart = $('.cart-btn', h);
  sat?.addEventListener('click', () => openOverlay('cart', headerCart || sat));

  const pop = () => {
    $$('[data-cart-count]').forEach((badge) => {
      if (badge.hidden) return;
      badge.classList.remove('is-pop');
      void badge.offsetWidth;
      badge.classList.add('is-pop');
    });
  };
  // La carte met ~0,8 s à voler jusqu'au panier : la pastille réagit à l'atterrissage
  on('cart:add', () => {
    document.documentElement.classList.add('cart-filled');
    setTimeout(pop, prefs.reduced ? 0 : 760);
  });
  const sync = (snap) => document.documentElement.classList.toggle('cart-filled', (snap?.count ?? 0) > 0);
  on('cart:change', sync);
  const first = $('[data-cart-count]');
  sync({ count: first && !first.hidden ? Number(first.textContent) || 0 : 0 });
}

/** « / » et Ctrl/⌘ K ouvrent la recherche (sauf pendant une saisie). */
function initShortcuts(h) {
  const opener = $('.header__search', h);
  const iconOpener = $('.header__search-icon', h);
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const k = e.key;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (k === 'k' || k === 'K')) {
      e.preventDefault();
      if (isOverlayOpen('search')) closeOverlay('search');
      else if (!document.querySelector('[data-overlay].is-open')) openOverlay('search', visible(opener) ? opener : iconOpener);
      return;
    }
    if (k === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !document.querySelector('[data-overlay].is-open')) {
      e.preventDefault();
      openOverlay('search', visible(opener) ? opener : iconOpener);
    }
  });
}
const visible = (el) => !!el && el.getClientRects().length > 0;

/**
 * Décors du header créés par JavaScript (inutiles sans lui, donc absents du HTML) :
 *   voile sous le méga-menu, panier « satellite », onglet « Menu » de la barre compacte.
 * Appelé tôt (à l'évaluation du module) : de simples insertions DOM, sans mesure.
 */
export function buildHeaderDecor() {
  const h = $('[data-header]');
  if (!h || $('[data-hdr-scrim]')) return;
  const scrim = document.createElement('div');
  scrim.className = 'hdr-scrim';
  scrim.setAttribute('data-hdr-scrim', '');
  scrim.setAttribute('aria-hidden', 'true');
  h.before(scrim);
  // Satellite : cible du vol des cartes quand le header est caché (le bouton accessible reste celui du header)
  const sat = document.createElement('button');
  sat.type = 'button';
  sat.className = 'cart-satellite';
  sat.setAttribute('data-cart-satellite', '');
  sat.setAttribute('data-cart-target', '');
  sat.setAttribute('aria-hidden', 'true');
  sat.tabIndex = -1;
  const count = $('.cart-btn [data-cart-count]', h);
  const n = count && !count.hidden ? count.textContent : '0';
  sat.innerHTML = '<svg aria-hidden="true" focusable="false"><use href="#i-bag"/></svg>'
    + `<span class="cart-btn__count" data-cart-count${n === '0' ? ' hidden' : ''}>${n}</span>`;
  h.after(sat);
  // Onglet « Menu » (souris / tactile) : au clavier, le header se déplie dès qu'il a le focus
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'header__tab';
  tab.setAttribute('data-hdr-tab', '');
  tab.setAttribute('aria-hidden', 'true');
  tab.tabIndex = -1;
  tab.innerHTML = '<span>Menu</span><svg aria-hidden="true" focusable="false"><use href="#i-chevron"/></svg>';
  $('.header__bar', h)?.after(tab);
}

export function initHeader() {
  const h = $('[data-header]');
  if (!h || state.header) return;
  state.header = h;
  initScrollStates(h);
  initPresence(h);
  initWorldTint(h);
  initLight(h);
  initCartFeedback(h);
  initShortcuts(h);
  // Un tiroir s'ouvre : on referme les menus du header (le header reste tel quel derrière)
  on('overlay:open', () => { state.pinnedOpen = false; state.hover = false; applyState(); });
  applyState();
}
