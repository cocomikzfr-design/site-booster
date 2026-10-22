/* ==========================================================================
   Recherche instantanée (palette) — produits, rayons et pages de data.js
   --------------------------------------------------------------------------
   Champ = combobox ; résultats = listbox (#search-listbox), option active
   annoncée par aria-activedescendant. ↑ ↓ choisissent, Entrée ouvre, Échap ferme
   (core/ui.js). Insensible aux accents, à la casse et aux tirets (« op17 » = « OP-17 »).
   Ouvrir un produit : la recherche se ferme, la page défile jusqu'à sa carte
   (étagère horizontale comprise), un repère lumineux l'entoure, le focus s'y pose.
   ========================================================================== */

import DATA from '../../data.js';
import { prefs } from '../../core/motion.js';
import { $, $$, esc, on, debounce, wait } from '../../core/utils.js';
import { formatPrix, statutInfo, dateParts } from '../../core/format.js';
import { jeuDe } from '../../core/templates.js';
import { closeOverlay } from '../../core/ui.js';
import { scrollTo } from '../../core/scroll.js';
import { norm, play, EASE_OUT } from './kit.js';

const SECTION_OF = { 'pokemon-30-ans': 'anniversaire', pokemon: 'pokemon', 'one-piece': 'one-piece' };
const SUGGESTIONS = ['ETB', 'OP-17', 'Japonais', 'Display', 'Précommande', 'Tournoi'];
const FEATURED = ['pk-me06-etb', 'pk-jp-30th', 'op-op17-booster', 'p30-etb'];
const compact = (s) => norm(s).replace(/[^a-z0-9]/g, '');

/* --- Index : produits, rayons (catégories), pages (sections de la page) --- */
function buildIndex() {
  const items = [];
  DATA.produits.forEach((p) => {
    const extra = [jeuDe(p), DATA.langues[p.langue], statutInfo(p.statut).label, p.langue === 'JP' ? 'japonais japon import' : '',
      p.statut === 'precommande' ? 'precommande reservation' : '', p.categorie === 'pokemon-30-ans' ? '30 ans anniversaire exclusif boutique' : ''].join(' ');
    items.push({
      kind: 'produit', id: p.id, p,
      title: p.nom, meta: `${jeuDe(p)} · ${p.code} · ${p.langue}`,
      hay: norm(`${p.nom} ${p.court || ''} ${p.code} ${p.format} ${extra}`),
      code: compact(p.code),
      href: `#${SECTION_OF[p.categorie] || 'explorer'}`,
    });
  });
  DATA.categories.forEach((c) => items.push({
    kind: 'rayon', id: c.id, c, title: c.titre, meta: c.texte, hay: norm(`${c.titre} ${c.texte} ${c.code} rayon categorie`), code: compact(c.code), href: c.lien,
  }));
  const next = DATA.evenements[0];
  const pages = [
    { title: 'Précommandes', meta: `${DATA.precommandeVedette.titre} · sortie le ${DATA.precommandeVedette.sortieTexte}`, href: '#precommande', words: 'precommande reserver me06 regne delta compte a rebours' },
    { title: 'Calendrier des sorties TCG', meta: DATA.sorties.map((s) => `${s.titre} (${dateParts(s.date).jour} ${dateParts(s.date).moisCourt})`).slice(0, 3).join(' · '), href: '#sorties', words: 'calendrier sorties dates prochaines extension' },
    { title: 'Tournois en boutique', meta: next ? `${next.titre} · ${next.heure} · ${next.prix} €` : 'Store Tournaments', href: '#tournois', words: 'tournoi store tournament inscription jouer evenement' },
    { title: 'La boutique à Nivelles', meta: `${DATA.boutique.rue}, ${DATA.boutique.codePostal} ${DATA.boutique.ville} · horaires et accès`, href: '#boutique', words: 'boutique magasin adresse horaires itineraire parking nivelles retrait' },
    { title: 'Accessoires', meta: 'Sleeves, toploaders, classeurs, protections acryliques', href: '#accessoires', words: 'accessoires sleeves protection acrylique classeur deck box playmat' },
    { title: 'Nous contacter', meta: `${DATA.boutique.telephone} · ${DATA.boutique.email}`, href: '#footer', words: 'contact telephone email mail newsletter' },
  ];
  pages.forEach((g, i) => items.push({ kind: 'page', id: `page-${i}`, ...g, hay: norm(`${g.title} ${g.meta} ${g.words}`), code: '' }));
  return items;
}

/** Score d'un élément pour les mots de la requête (0 = exclu : tous les mots doivent correspondre). */
function score(item, tokens) {
  let s = 0;
  const title = norm(item.title);
  for (const t of tokens) {
    const ct = compact(t);
    let hit = 0;
    if (ct && item.code && item.code === ct) hit = 6;
    else if (ct && item.code && item.code.startsWith(ct)) hit = 4;
    else if (title.startsWith(t)) hit = 4;
    else if (new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(item.hay)) hit = 2;
    else if (item.hay.includes(t) || (ct.length > 2 && compact(item.hay).includes(ct))) hit = 1;
    if (!hit) return 0;
    s += hit;
  }
  return s + (item.kind === 'produit' ? 0.5 : item.kind === 'rayon' ? 0.3 : 0);
}

/** Surligne les mots trouvés (texte échappé, comparaison sans accents). */
function highlight(text, tokens) {
  const src = String(text);
  const n = norm(src);
  const marks = new Array(src.length).fill(false);
  tokens.forEach((t) => {
    if (t.length < 2) return;
    let i = n.indexOf(t);
    while (i >= 0) { for (let j = i; j < i + t.length; j++) marks[j] = true; i = n.indexOf(t, i + t.length); }
  });
  let out = '', open = false;
  [...src].forEach((ch, i) => {
    if (marks[i] && !open) { out += '<mark>'; open = true; }
    if (!marks[i] && open) { out += '</mark>'; open = false; }
    out += esc(ch);
  });
  return open ? `${out}</mark>` : out;
}

const KIND_LABEL = { produit: 'Produit', rayon: 'Rayon', page: 'Page' };

function optionHtml(item, i, tokens) {
  let thumb = '', side = '';
  if (item.kind === 'produit') {
    const p = item.p;
    thumb = p.image ? `<img src="${esc(p.image)}" alt="" width="64" height="64" loading="lazy" decoding="async">` : `<span class="sres__code">${esc(p.code)}</span>`;
    side = `<span class="badge badge--${esc(p.statut)}">${esc(statutInfo(p.statut).label)}</span><span class="sres__price">${formatPrix(p.prix)}</span>`;
  } else if (item.kind === 'rayon') {
    const c = item.c;
    thumb = c.image ? `<img src="${esc(c.image)}" alt="" width="64" height="64" loading="lazy" decoding="async">` : `<span class="sres__code">${esc(c.code)}</span>`;
    side = '<span class="sres__go" aria-hidden="true"><svg aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg></span>';
  } else {
    thumb = '<span class="sres__code sres__code--page"><svg aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg></span>';
    side = '<span class="sres__go" aria-hidden="true"><svg aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg></span>';
  }
  const tone = item.p?.couleur || item.c?.couleur || 'lilas';
  return `<li class="sres search__item sres--${item.kind}" role="option" id="sres-${i}" aria-selected="false" data-index="${i}" data-couleur="${esc(tone)}" style="--i:${i}">`
    + `<span class="sres__thumb" aria-hidden="true">${thumb}</span>`
    + '<span class="sres__main">'
    + `<span class="sres__kind">${KIND_LABEL[item.kind]}<span class="sr-only"> : </span></span>`
    + `<span class="sres__name">${highlight(item.title, tokens)}</span>`
    + `<span class="sres__meta">${esc(item.meta)}</span>`
    + '</span>'
    + `<span class="sres__side">${side}</span>`
    + '</li>';
}

/* --- Repère lumineux autour d'un produit trouvé --- */
function locate(el) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  const ring = document.createElement('div');
  ring.className = 'chrome-locator';
  ring.setAttribute('aria-hidden', 'true');
  Object.assign(ring.style, { left: `${r.left - 8}px`, top: `${r.top - 8}px`, width: `${r.width + 16}px`, height: `${r.height + 16}px` });
  document.body.appendChild(ring);
  const a = play(ring, [
    { opacity: 0, transform: 'scale(1.08)' },
    { opacity: 1, transform: 'scale(1)', offset: 0.25 },
    { opacity: 1, transform: 'scale(1)', offset: 0.75 },
    { opacity: 0, transform: 'scale(1.02)' },
  ], { duration: 1900, easing: 'ease-out', fill: 'forwards' });
  const done = () => ring.remove();
  if (a) a.finished.then(done, done); else setTimeout(done, 1600);
  // La page bouge : le repère n'a plus de sens
  addEventListener('scroll', done, { once: true, passive: true });
}

/** Attend la fin du défilement (position stable deux frames de suite, 1,8 s max). */
async function scrollSettled() {
  let last = -1, stable = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < 1800) {
    await new Promise((r) => requestAnimationFrame(r));
    const y = scrollY;
    stable = Math.abs(y - last) < 0.5 ? stable + 1 : 0;
    last = y;
    if (stable > 3) break;
  }
}

function focusTarget(el) {
  if (!el.matches('a, button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

async function goToProduct(item) {
  const card = $$(`[data-product="${CSS.escape(item.id)}"]`).find((c) => c.getClientRects().length > 0 && !c.closest('[data-overlay]'));
  if (!card) return goTo(item.href);
  // Étagère horizontale : on amène la carte au centre de sa piste
  let track = card.parentElement;
  while (track && track !== document.body) {
    const st = getComputedStyle(track);
    if (/(auto|scroll)/.test(st.overflowX) && track.scrollWidth > track.clientWidth + 4) break;
    track = track.parentElement;
  }
  if (track && track !== document.body) {
    const tr = track.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    track.scrollTo({ left: track.scrollLeft + (cr.left - tr.left) - (tr.width - cr.width) / 2, behavior: prefs.reduced ? 'auto' : 'smooth' });
  }
  // Le focus part tout de suite vers le produit (sans défilement natif) : le header,
  // qui avait récupéré le focus à la fermeture de la recherche, peut se replier
  const cta = card.querySelector('button:not([disabled]), a[href]');
  focusTarget(cta || card);
  const r = card.getBoundingClientRect();
  scrollTo(card, { offset: -Math.max(96, (innerHeight - r.height) / 2) });
  await scrollSettled();
  await wait(prefs.reduced ? 0 : 60);
  locate(card);
}

async function goTo(href) {
  const id = decodeURIComponent(String(href).replace(/^#/, ''));
  const el = id && document.getElementById(id);
  if (!el) return;
  scrollTo(el);
  try { history.pushState(null, '', `#${id}`); } catch { /* bac à sable */ }
  focusTarget(el);
}

export function initSearch() {
  const root = $('[data-overlay="search"]');
  const input = root && $('[data-search-input]', root);
  const results = root && $('[data-render="search"][data-render-custom]', root);
  if (!root || !input || !results) return;
  // Compléments utiles seulement avec JavaScript : bouton Effacer, aide, annonce, raccourcis
  $('.search__close', root)?.insertAdjacentHTML('beforebegin', '<button class="search__clear" type="button" data-search-clear hidden>Effacer</button>');
  results.insertAdjacentHTML('beforebegin', '<p class="sr-only" id="search-help">Les résultats s’affichent pendant la saisie. Flèches haut et bas pour choisir, Entrée pour ouvrir.</p>');
  results.insertAdjacentHTML('afterend', '<p class="sr-only" role="status" aria-live="polite" data-search-status></p>'
    + '<p class="search__keys" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span><span><kbd>↵</kbd> ouvrir</span><span><kbd>Échap</kbd> fermer</span></p>');
  input.setAttribute('aria-describedby', 'search-help');
  const status = $('[data-search-status]', root);
  const clear = $('[data-search-clear]', root);
  const index = buildIndex();
  let shown = [];
  let active = -1;

  const announce = debounce((msg) => { if (status) status.textContent = msg; }, 450);

  function setActive(i, { scroll = true } = {}) {
    const opts = $$('.sres', results);
    if (!opts.length) { active = -1; input.removeAttribute('aria-activedescendant'); return; }
    active = (i + opts.length) % opts.length;
    opts.forEach((o, j) => {
      const on = j === active;
      o.classList.toggle('is-active', on);
      o.setAttribute('aria-selected', String(on));
    });
    input.setAttribute('aria-activedescendant', opts[active].id);
    if (scroll) opts[active].scrollIntoView({ block: 'nearest' });
  }

  function chips(title = 'Recherches populaires') {
    return `<div class="search__chips"><p class="search__label">${title}</p><ul class="search__chiplist">${SUGGESTIONS.map((s) => `<li><button class="search__chip" type="button" data-search-chip="${esc(s)}">${esc(s)}</button></li>`).join('')}</ul></div>`;
  }

  function draw({ animate = true } = {}) {
    const raw = input.value.trim();
    const tokens = norm(raw).split(/\s+/).filter(Boolean);
    clear.hidden = !raw;
    let head = '';
    if (!tokens.length) {
      shown = FEATURED.map((id) => index.find((x) => x.id === id)).filter(Boolean);
      head = `${chips()}<p class="search__label" id="search-list-label">À la une en boutique</p>`;
    } else {
      shown = index.map((it) => ({ it, s: score(it, tokens) })).filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s).slice(0, 9).map((x) => x.it);
      head = shown.length
        ? `<p class="search__label" id="search-list-label"><span class="search__count">${shown.length}</span> résultat${shown.length > 1 ? 's' : ''} pour « ${esc(raw)} »</p>`
        : `<div class="search__empty"><p class="search__empty-title">Aucun résultat pour « ${esc(raw)} »</p><p>Vérifiez l’orthographe ou essayez un code de set (ME06, OP-17…).</p></div>${chips('Essayez plutôt')}`;
    }
    const list = shown.length
      ? `<ul class="search__list" id="search-listbox" role="listbox" aria-labelledby="search-list-label">${shown.map((it, i) => optionHtml(it, i, tokens)).join('')}</ul>`
      : '<ul class="search__list" id="search-listbox" role="listbox" aria-label="Résultats" hidden></ul>';
    results.innerHTML = head + list;
    input.setAttribute('aria-expanded', String(shown.length > 0));
    active = -1;
    input.removeAttribute('aria-activedescendant');
    if (tokens.length && shown.length) setActive(0, { scroll: false });
    announce(tokens.length ? (shown.length ? `${shown.length} résultat${shown.length > 1 ? 's' : ''}.` : 'Aucun résultat.') : '');
    if (animate) {
      $$('.sres', results).slice(0, 7).forEach((o, i) => {
        play(o, [{ opacity: 0, transform: 'translate3d(0, 8px, 0)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i * 28, easing: EASE_OUT });
      });
    }
  }

  function activate(i) {
    const item = shown[i];
    if (!item) return;
    closeOverlay('search');
    // Laisse le tiroir se refermer (défilement déverrouillé) avant de naviguer
    requestAnimationFrame(() => (item.kind === 'produit' ? goToProduct(item) : goTo(item.href)));
  }

  input.addEventListener('input', () => draw());
  input.addEventListener('keydown', (e) => {
    const n = shown.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (n) setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) setActive(active - 1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (n) activate(active >= 0 ? active : 0);
    }
  });
  results.addEventListener('pointermove', (e) => {
    const o = e.target.closest('.sres');
    if (o && !o.classList.contains('is-active')) setActive(Number(o.dataset.index), { scroll: false });
  });
  results.addEventListener('click', (e) => {
    const o = e.target.closest('.sres');
    if (o) { activate(Number(o.dataset.index)); return; }
    const chip = e.target.closest('[data-search-chip]');
    if (chip) { input.value = chip.dataset.searchChip; draw(); input.focus(); }
  });
  clear?.addEventListener('click', () => { input.value = ''; draw(); input.focus(); });
  $('[data-search-form]', root)?.addEventListener('submit', (e) => { e.preventDefault(); if (shown.length) activate(active >= 0 ? active : 0); });

  on('overlay:open', ({ id }) => {
    if (id !== 'search') return;
    draw({ animate: true });
    input.select();
  });
  on('overlay:close', ({ id }) => { if (id === 'search') announce(''); });
  draw({ animate: false });
}
