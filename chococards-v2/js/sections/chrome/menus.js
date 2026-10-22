/* ==========================================================================
   Menus : méga-menu (desktop), tiroir mobile, sélecteurs pays / langue
   --------------------------------------------------------------------------
   MÉGA-MENU (data.menu) — motif « navigation à volets » accessible :
     lien de rubrique + bouton ▾ (aria-expanded / aria-controls) + volet.
     Souris : intention de survol 120 ms ; d'un volet à l'autre : bascule immédiate.
     Clic sur ▾ : volet épinglé (jusqu'à Échap, clic extérieur ou sortie du focus).
     Clavier : ← → (rubriques), ↓ (ouvre le volet et entre dedans), ↑ ↓ Début Fin
               dans le volet, Échap (ferme et rend le focus au bouton).
     Le volet occupe toute la largeur du header : colonnes de liens + carte « À la une »
     (vraie photo de la boutique quand elle existe, sinon carte typographique).
   TIROIR MOBILE : rubriques numérotées en accordéon (<details>), apparition en cascade.
   SÉLECTEURS : listbox clavier complète (↑ ↓ Début Fin, lettre, Entrée, Échap, Tab),
     synchronisés avec les <select> du tiroir mobile, mémorisés (localStorage).
   ========================================================================== */

import DATA from '../../data.js';
import { prefs } from '../../core/motion.js';
import { $, $$, esc, on, loadImage } from '../../core/utils.js';
import { icon, mark, slotVisual } from '../../core/templates.js';
import { upcoming, dateParts, openState } from '../../core/format.js';
import { closeOverlay, openOverlay, toast } from '../../core/ui.js';
import { holdHeader, onHeaderState } from './header.js';
import { play, showEl, hideEl, hideNow, EASE_OUT } from './kit.js';

const pad2 = (n) => String(n).padStart(2, '0');
const OPEN_DELAY = 120;
const CLOSE_DELAY = 220;

/* ---------------------------------------------------------------- Rendu --- */

function featureCard(v, item) {
  if (!v) return '';
  const media = v.image
    ? `<img src="${esc(v.image)}" alt="" width="600" height="600" loading="lazy" decoding="async">`
    : slotVisual({ code: v.code, format: v.titre, couleur: v.couleur, top: 'ChocoCards', cls: 'slot--flat mega__slot' });
  return `<a class="mega__feature${v.image ? ' has-photo' : ''}" href="${esc(v.lien)}" data-couleur="${esc(v.couleur || 'lilas')}">`
    + `<span class="mega__feature-media" aria-hidden="true">${media}</span>`
    + '<span class="mega__feature-body">'
    + '<span class="mega__feature-kicker">À la une</span>'
    + `<span class="mega__feature-title">${esc(v.titre)}</span>`
    + `<span class="mega__feature-text">${esc(v.texte)}</span>`
    + '</span>'
    + `<span class="mega__feature-go" aria-hidden="true">${icon('arrow')}</span>`
    + `<span class="sr-only"> (${esc(item.titre)})</span>`
    + '</a>';
}

function panelItem(item, i, n) {
  const id = `mega-panel-${i}`;
  const cols = item.colonnes.map((c, j) => {
    const hid = `mega-${i}-h${j}`;
    return `<div class="mega__col"><p class="mega__heading" id="${hid}">${esc(c.titre)}</p>`
      + `<ul aria-labelledby="${hid}">${c.liens.map((l) => `<li><a class="mega__sub" href="${esc(item.lien)}">${esc(l)}</a></li>`).join('')}</ul></div>`;
  }).join('');
  return `<li class="mega__item has-panel" data-mega-item>`
    + `<a class="mega__link" href="${esc(item.lien)}">${esc(item.titre)}</a>`
    + `<button class="mega__toggle" type="button" aria-expanded="false" aria-controls="${id}" data-mega-toggle>${icon('chevron')}<span class="sr-only">Sous-menu ${esc(item.titre)}</span></button>`
    + `<div class="mega__panel" id="${id}" data-couleur="${esc(item.vedette?.couleur || 'lilas')}" hidden>`
    + '<div class="mega__grid">'
    + '<div class="mega__intro">'
    + `<p class="mega__kicker" aria-hidden="true"><span>Rayon</span><span>${pad2(i + 1)} / ${pad2(n)}</span></p>`
    + `<p class="mega__name">${esc(item.titre)}</p>`
    + `<a class="mega__all" href="${esc(item.lien)}"><span>Tout voir</span>${icon('arrow')}<span class="sr-only"> : ${esc(item.titre)}</span></a>`
    + '</div>'
    + `<div class="mega__cols" data-cols="${item.colonnes.length}">${cols}</div>`
    + featureCard(item.vedette, item)
    + '</div></div></li>';
}

/**
 * Rubrique « Plus » (écrans 1024–1279 px seulement, CSS) : les liens simples du menu
 * (Précommandes, Tournois…) y sont regroupés quand la rangée manque de place.
 * Carte « À la une » : le prochain tournoi (data.evenements).
 */
function moreItem(simple, i) {
  const id = 'mega-panel-plus';
  const ev = upcoming(DATA.evenements)[0];
  const feat = ev ? featureCard({
    titre: `Prochain tournoi : ${dateParts(ev.date).long}`,
    texte: `${ev.titre} · ${ev.heure} · ${ev.prix} €`,
    lien: '#tournois', couleur: 'violet', code: ev.heure.toUpperCase(), image: null,
  }, { titre: 'Plus' }) : '';
  return '<li class="mega__item mega__item--more has-panel" data-mega-item>'
    + `<button class="mega__link mega__more" type="button" aria-expanded="false" aria-controls="${id}" data-mega-toggle>Plus${icon('chevron')}</button>`
    + `<div class="mega__panel" id="${id}" data-couleur="violet" hidden>`
    + '<div class="mega__grid">'
    + `<div class="mega__intro"><p class="mega__kicker" aria-hidden="true"><span>Raccourcis</span><span>${pad2(i)} / ${pad2(i)}</span></p><p class="mega__name">Et aussi</p></div>`
    + '<div class="mega__cols" data-cols="1"><div class="mega__col"><p class="mega__heading" id="mega-plus-h">Agenda &amp; infos</p>'
    + `<ul aria-labelledby="mega-plus-h">${simple.map((m) => `<li><a class="mega__sub" href="${esc(m.lien)}">${esc(m.titre)}</a></li>`).join('')}</ul></div></div>`
    + feat
    + '</div></div></li>';
}

export function renderMega() {
  const ul = $('[data-render="mega"][data-render-custom]');
  if (!ul) return null;
  const n = DATA.menu.filter((m) => m.colonnes).length;
  const simple = DATA.menu.filter((m) => !m.colonnes);
  let k = 0;
  ul.innerHTML = DATA.menu.map((item) => (item.colonnes
    ? panelItem(item, k++, n)
    : `<li class="mega__item mega__item--simple"><a class="mega__link" href="${esc(item.lien)}">${esc(item.titre)}</a></li>`)).join('')
    + (simple.length ? moreItem(simple, n + 1) : '');
  return ul;
}

/** Habillage du tiroir mobile : halo, monogramme, statut d'ouverture, recherche, contacts. */
function decorateDrawer(nav) {
  const panel = nav.closest('.drawer__panel');
  if (!panel || panel.querySelector('.mdrawer__quick')) return;
  const b = DATA.boutique;
  panel.insertAdjacentHTML('afterbegin', '<span class="mdrawer__glow" aria-hidden="true"></span>');
  $('.drawer__title', panel)?.insertAdjacentHTML('afterbegin', mark('mdrawer__mark'));
  const st = openState();
  nav.insertAdjacentHTML('beforebegin', '<div class="mdrawer__quick">'
    + `<p class="mdrawer__status"><span class="open-status${st.open ? ' is-open' : ''}">${esc(st.label)}</span></p>`
    + `<button class="mdrawer__search" type="button" data-mdrawer-search>${icon('search')}<span>Rechercher un produit</span></button></div>`);
  $('.drawer__foot', panel)?.insertAdjacentHTML('afterbegin', '<div class="mdrawer__contact">'
    + `<a class="mdrawer__chip" href="${esc(b.telephoneLien)}">${icon('phone')}<span>Appeler</span></a>`
    + `<a class="mdrawer__chip" href="${esc(b.instagram)}" target="_blank" rel="noopener">${icon('instagram')}<span>Instagram</span><span class="sr-only"> (nouvel onglet)</span></a>`
    + `<a class="mdrawer__chip" href="#compte">${icon('user')}<span>Mon compte</span></a></div>`);
}

/** Options des sélecteurs pays / langue : pastille de code + coche (le HTML ne porte que le texte). */
export function decorateLocale() {
  $$('[data-dropdown] [role="option"]').forEach((o) => {
    if (o.querySelector('.locale__code')) return;
    const name = o.innerHTML;
    o.innerHTML = `<span class="locale__code" aria-hidden="true">${esc(o.dataset.value)}</span><span class="locale__name">${name}</span>${icon('check', 'locale__check')}`;
  });
}

export function renderMobileNav() {
  const nav = $('[data-render="mobile-nav"][data-render-custom]');
  if (!nav) return null;
  decorateDrawer(nav);
  nav.innerHTML = `<ul class="mnav">${DATA.menu.map((item, i) => {
    const idx = `<span class="mnav__idx" aria-hidden="true">${pad2(i + 1)}</span>`;
    if (!item.colonnes) {
      return `<li class="mnav__item"><a class="mnav__link" href="${esc(item.lien)}">${idx}<span class="mnav__label">${esc(item.titre)}</span>${icon('arrow', 'mnav__go')}</a></li>`;
    }
    const groups = item.colonnes.map((c) => `<div class="mnav__block"><p class="mnav__heading">${esc(c.titre)}</p>`
      + `<ul class="mnav__subs">${c.liens.map((l) => `<li><a class="mnav__sub" href="${esc(item.lien)}">${esc(l)}</a></li>`).join('')}</ul></div>`).join('');
    const v = item.vedette;
    const feat = v ? `<a class="mnav__feature" href="${esc(v.lien)}" data-couleur="${esc(v.couleur || 'lilas')}"><span class="mnav__feature-kicker">À la une</span><span class="mnav__feature-title">${esc(v.titre)}</span><span class="mnav__feature-text">${esc(v.texte)}</span></a>` : '';
    return `<li class="mnav__item"><details class="mnav__group">`
      + `<summary class="mnav__link">${idx}<span class="mnav__label">${esc(item.titre)}</span>${icon('chevron', 'mnav__chev')}</summary>`
      + `<div class="mnav__panel"><a class="mnav__all" href="${esc(item.lien)}">Tout voir<span class="sr-only"> : ${esc(item.titre)}</span>${icon('arrow')}</a>${groups}${feat}</div>`
      + '</details></li>';
  }).join('')}</ul>`;
  return nav;
}

/* ----------------------------------------------------------- Méga-menu --- */

export function initMega() {
  const ul = $('[data-render="mega"][data-render-custom]');
  const header = $('[data-header]');
  const scrim = $('[data-hdr-scrim]');
  if (!ul || !header) return;
  const items = $$('[data-mega-item]', ul);
  const topLinks = $$('.mega__link', ul);
  let current = null;     // <li> ouvert
  let pinned = false;     // ouvert au clic / clavier
  let openT = 0, closeT = 0;
  let warmed = false;

  const parts = (li) => ({ btn: $('[data-mega-toggle]', li), panel: $('.mega__panel', li) });

  // Photos « À la une » préchargées au premier signe d'intérêt pour le menu
  const warm = () => {
    if (warmed) return;
    warmed = true;
    $$('.mega__feature-media img', ul).forEach((img) => { img.loading = 'eager'; loadImage(img.src); });
  };
  ul.addEventListener('pointerenter', warm, { once: true });
  ul.addEventListener('focusin', warm, { once: true });

  function open(li, { pin = false, swap = false } = {}) {
    clearTimeout(closeT); clearTimeout(openT);
    if (current === li) { pinned = pinned || pin; return; }
    const prev = current;
    if (prev) close(prev, { instant: true, keepScrim: true });
    current = li;
    pinned = pin;
    const { btn, panel } = parts(li);
    btn.setAttribute('aria-expanded', 'true');
    li.classList.add('is-active');
    holdHeader('mega', true);
    scrim?.classList.add('is-on');
    if (prev || swap) {
      // Bascule d'un volet à l'autre : pas de « chute », juste un fondu glissé du contenu
      panel.hidden = false;
      panel.classList.add('is-open', 'is-swap');
      const dir = prev && items.indexOf(prev) > items.indexOf(li) ? -1 : 1;
      play($('.mega__grid', panel), [
        { opacity: 0, transform: `translate3d(${dir * 22}px, 0, 0)` },
        { opacity: 1, transform: 'none' },
      ], { duration: 420, easing: EASE_OUT });
    } else {
      showEl(panel);
      // Cascade des colonnes et de la carte « À la une »
      $$('.mega__intro, .mega__col, .mega__feature', panel).forEach((el, i) => {
        play(el, [{ opacity: 0, transform: 'translate3d(0, 12px, 0)' }, { opacity: 1, transform: 'none' }],
          { duration: 560, delay: 70 + i * 55, easing: EASE_OUT });
      });
    }
  }

  function close(li = current, { instant = false, keepScrim = false } = {}) {
    if (!li) return;
    const { btn, panel } = parts(li);
    btn.setAttribute('aria-expanded', 'false');
    li.classList.remove('is-active');
    panel.classList.remove('is-swap');
    if (instant) hideNow(panel); else hideEl(panel, 'is-open', 360);
    if (current === li) {
      current = null;
      pinned = false;
      if (!keepScrim) {
        scrim?.classList.remove('is-on');
        holdHeader('mega', false);
      }
    }
  }

  const closeAll = () => { clearTimeout(openT); clearTimeout(closeT); if (current) close(current); };

  // --- Souris : intention de survol ---
  items.forEach((li) => {
    li.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(closeT);
      clearTimeout(openT);
      if (current && current !== li) openT = setTimeout(() => open(li), 40);
      else if (!current) openT = setTimeout(() => open(li), OPEN_DELAY);
    });
    li.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(openT);
      if (pinned) return;
      closeT = setTimeout(() => { if (current === li) close(li); }, CLOSE_DELAY);
    });
  });
  // Survol d'une rubrique sans volet : on ferme le volet ouvert (s'il n'est pas épinglé)
  $$('.mega__item:not([data-mega-item])', ul).forEach((li) => {
    li.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || pinned) return;
      clearTimeout(openT);
      closeT = setTimeout(() => current && close(current), 80);
    });
  });

  // --- Clic ---
  ul.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mega-toggle]');
    if (btn) {
      const li = btn.closest('[data-mega-item]');
      if (current === li && pinned) close(li);
      else open(li, { pin: true });
      return;
    }
    // Un lien suivi dans le menu : on referme
    if (e.target.closest('a[href]')) closeAll();
  });
  scrim?.addEventListener('click', closeAll);
  document.addEventListener('pointerdown', (e) => {
    if (current && pinned && !header.contains(e.target)) closeAll();
  });

  // --- Clavier ---
  const focusables = (panel) => $$('a[href]', panel);
  ul.addEventListener('keydown', (e) => {
    const t = e.target;
    const li = t.closest('.mega__item');
    const inPanel = !!t.closest('.mega__panel');
    const k = e.key;
    if (k === 'Escape' && current) {
      e.preventDefault();
      e.stopPropagation();
      const { btn } = parts(current);
      close(current);
      btn.focus({ preventScroll: true });
      return;
    }
    if (inPanel) {
      const list = focusables(t.closest('.mega__panel'));
      const i = list.indexOf(t);
      let next = null;
      if (k === 'ArrowDown') next = list[Math.min(list.length - 1, i + 1)];
      else if (k === 'ArrowUp') next = i <= 0 ? parts(li).btn : list[i - 1];
      else if (k === 'Home') next = list[0];
      else if (k === 'End') next = list[list.length - 1];
      if (next) { e.preventDefault(); next.focus({ preventScroll: true }); }
      return;
    }
    // Rangée principale : liens et boutons ▾
    const top = t.closest('.mega__link, [data-mega-toggle]');
    if (!top) return;
    const shown = topLinks.filter((a) => a.getClientRects().length > 0);
    const idx = shown.indexOf(li.querySelector('.mega__link'));
    if (k === 'ArrowRight' || k === 'ArrowLeft') {
      e.preventDefault();
      const d = k === 'ArrowRight' ? 1 : -1;
      shown[(idx + d + shown.length) % shown.length].focus({ preventScroll: true });
    } else if (k === 'Home' || k === 'End') {
      e.preventDefault();
      shown[k === 'Home' ? 0 : shown.length - 1].focus({ preventScroll: true });
    } else if (k === 'ArrowDown' && li.matches('[data-mega-item]')) {
      e.preventDefault();
      open(li, { pin: true });
      requestAnimationFrame(() => focusables(parts(li).panel)[0]?.focus({ preventScroll: true }));
    } else if (k === 'ArrowUp' && current === li) {
      e.preventDefault();
      close(li);
    }
  });
  // Le focus quitte la rubrique ouverte → on ferme
  ul.addEventListener('focusout', (e) => {
    if (!current) return;
    const to = e.relatedTarget;
    if (!to || !current.contains(to)) {
      // Laisse le clic sur un autre ▾ ou un survol décider ; sinon on ferme
      requestAnimationFrame(() => { if (current && !current.contains(document.activeElement) && pinned) close(current); });
    }
  });

  // Le header se cache ou se replie : le volet se ferme
  onHeaderState(({ hidden, expanded }) => { if ((hidden || !expanded) && current) close(current, { instant: true }); });
  on('overlay:open', () => current && close(current, { instant: true }));
  addEventListener('resize', () => current && close(current, { instant: true }));
}

/* ---------------------------------------------------------- Tiroir mobile --- */

export function initMobileDrawer() {
  const drawer = $('[data-overlay="menu"]');
  if (!drawer) return;
  // Tout lien suivi depuis le tiroir le referme d'abord (la navigation se fait ensuite :
  // le défilement doux et le focus de la cible sont gérés par core/scroll.js)
  drawer.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (a && !a.matches('[data-overlay-close]')) closeOverlay('menu');
    const s = e.target.closest('[data-mdrawer-search]');
    if (s) {
      closeOverlay('menu');
      const burger = $('.header__burger');
      setTimeout(() => openOverlay('search', burger), prefs.reduced ? 0 : 60);
    }
  });
  // Ouverture d'un groupe : ses liens arrivent en cascade
  drawer.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d.matches?.('.mnav__group') || !d.open) return;
    // Un seul groupe ouvert à la fois (accordéon)
    $$('.mnav__group[open]', drawer).forEach((o) => { if (o !== d) o.open = false; });
    $$('.mnav__all, .mnav__block, .mnav__feature', d).forEach((el, i) => {
      play(el, [{ opacity: 0, transform: 'translate3d(0, 10px, 0)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: i * 50 });
    });
  }, true);
  // Ouverture du tiroir : cascade des rubriques
  on('overlay:open', ({ id }) => {
    if (id !== 'menu') return;
    // Le socle donne le focus au premier champ (le <select> « Pays », tout en bas) :
    // on le place plutôt sur le bouton Fermer, en haut du tiroir
    setTimeout(() => $('.drawer__close', drawer)?.focus({ preventScroll: true }), prefs.reduced ? 10 : 90);
    const els = [$('.mdrawer__quick', drawer), ...$$('.mnav__item', drawer), $('.drawer__foot', drawer)].filter(Boolean);
    els.forEach((el, i) => {
      play(el, [{ opacity: 0, transform: 'translate3d(-26px, 0, 0)' }, { opacity: 1, transform: 'none' }],
        { duration: 620, delay: 110 + i * 38, easing: EASE_OUT });
    });
  });
  on('overlay:close', ({ id }) => {
    if (id !== 'menu') return;
    // On referme les groupes après la sortie du tiroir (prochaine ouverture : liste compacte)
    setTimeout(() => $$('.mnav__group[open]', drawer).forEach((d) => { d.open = false; }), 480);
  });
}

/* ------------------------------------------------- Sélecteurs pays / langue --- */

const LOCALE_KEY = 'chococards:v2:locale';
const NAMES = {
  pays: { BE: 'Belgique', FR: 'France' },
  langue: { FR: 'français', EN: 'English' },
};
const LABEL = { pays: 'Pays', langue: 'Langue' };

function readLocale() {
  try { return JSON.parse(localStorage.getItem(LOCALE_KEY) || '{}') || {}; } catch { return {}; }
}
function writeLocale(v) {
  try { localStorage.setItem(LOCALE_KEY, JSON.stringify(v)); } catch { /* stockage indisponible */ }
}

export function initLocale() {
  const boxes = $$('[data-dropdown]');
  const prefsLocale = readLocale();
  const api = {};

  boxes.forEach((box) => {
    const kind = box.dataset.dropdown;
    const btn = $('.locale__toggle', box);
    const list = $('.locale__menu', box);
    const valueEl = $('[data-dropdown-value]', box);
    const options = $$('[role="option"]', list);
    if (!btn || !list || !options.length) return;
    let active = 0;
    let typed = '', typedT = 0;

    const selectedIndex = () => Math.max(0, options.findIndex((o) => o.getAttribute('aria-selected') === 'true'));
    const setActive = (i) => {
      active = (i + options.length) % options.length;
      options.forEach((o, j) => o.classList.toggle('is-active', j === active));
      options[active].focus({ preventScroll: true });
    };
    const isOpen = () => !list.hidden;

    function openList() {
      if (isOpen()) return;
      // Un seul sélecteur ouvert
      boxes.forEach((b) => b !== box && api[b.dataset.dropdown]?.close(false));
      btn.setAttribute('aria-expanded', 'true');
      box.classList.add('is-open');
      holdHeader(`locale-${kind}`, true);
      showEl(list);
      setActive(selectedIndex());
    }
    function closeList(focusBtn = true) {
      if (!isOpen()) return;
      btn.setAttribute('aria-expanded', 'false');
      box.classList.remove('is-open');
      holdHeader(`locale-${kind}`, false);
      hideEl(list, 'is-open', 220);
      if (focusBtn) btn.focus({ preventScroll: true });
    }
    function select(value, { silent = false } = {}) {
      const opt = options.find((o) => o.dataset.value === value);
      if (!opt) return;
      options.forEach((o) => o.setAttribute('aria-selected', String(o === opt)));
      valueEl.textContent = value;
      btn.setAttribute('aria-label', `${LABEL[kind]} : ${value} (${NAMES[kind][value] || opt.dataset.label})`);
      $$(`select[data-locale="${kind}"]`).forEach((s) => { s.value = value; });
      const changed = prefsLocale[kind] !== value;
      prefsLocale[kind] = value;
      if (!silent && changed) {
        writeLocale(prefsLocale);
        if (kind === 'pays') toast(value === 'FR' ? 'Livraison en France : frais calculés à la commande.' : 'Livraison en Belgique sélectionnée.');
        else toast(value === 'EN' ? 'La version anglaise arrive bientôt : le site reste en français pour l’instant.' : 'Langue : français.');
      }
    }
    api[kind] = { close: closeList, select };

    btn.addEventListener('click', () => (isOpen() ? closeList() : openList()));
    btn.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
        if (e.key === 'ArrowUp') setActive(options.length - 1);
      }
    });
    list.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (k === 'Home') { e.preventDefault(); setActive(0); }
      else if (k === 'End') { e.preventDefault(); setActive(options.length - 1); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); select(options[active].dataset.value); closeList(); }
      else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closeList(); }
      else if (k === 'Tab') { closeList(false); }
      else if (k.length === 1 && /\S/.test(k)) {
        // Recherche par lettre
        clearTimeout(typedT);
        typed += k.toLowerCase();
        typedT = setTimeout(() => { typed = ''; }, 600);
        const i = options.findIndex((o) => o.textContent.trim().toLowerCase().startsWith(typed));
        if (i >= 0) setActive(i);
      }
    });
    list.addEventListener('click', (e) => {
      const o = e.target.closest('[role="option"]');
      if (!o) return;
      select(o.dataset.value);
      closeList();
    });
    list.addEventListener('pointermove', (e) => {
      const o = e.target.closest('[role="option"]');
      if (o) options.forEach((x) => x.classList.toggle('is-active', x === o));
    });
    document.addEventListener('pointerdown', (e) => { if (isOpen() && !box.contains(e.target)) closeList(false); });
    box.addEventListener('focusout', (e) => { if (isOpen() && !box.contains(e.relatedTarget)) closeList(false); });

    // Préférence mémorisée (sans notification)
    if (prefsLocale[kind]) select(prefsLocale[kind], { silent: true });
  });

  // <select> du tiroir mobile ↔ sélecteurs du header
  $$('select[data-locale]').forEach((s) => {
    s.addEventListener('change', () => api[s.dataset.locale]?.select(s.value));
  });
  onHeaderState(({ hidden }) => { if (hidden) Object.values(api).forEach((a) => a.close(false)); });
}
