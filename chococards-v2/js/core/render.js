/* ==========================================================================
   Rendu de base des parties pilotées par data.js
   --------------------------------------------------------------------------
   Tout conteneur [data-render="…"] est rempli au démarrage par renderAll()
   (avant les init() des sections). Valeurs reconnues :
     mega, mobile-nav, products (+ data-categorie), categories, preorder-products,
     sorties, autres-tcg, instagram, events, hours, open-status, next-event,
     stat-tcg, stat-events, cart (mis à jour en direct), search (résultats), year
   [data-bind="chemin.dans.data"] reçoit le texte correspondant (ex. boutique.parking).
   [data-countdown="ISO"] : valeurs [data-unit] calculées et mises à jour chaque seconde.

   PRENDRE LA MAIN : ajoutez data-render-custom sur le conteneur (dans le HTML
   de votre section) → render.js l'ignore complètement ; vous le remplissez dans
   votre init() avec les gabarits de templates.js.
   ========================================================================== */

import DATA from '../data.js';
import { $, $$, esc, on } from './utils.js';
import { upcoming, produitsDe, getProduit, timeLeft, openState, dateParts, formatPrix } from './format.js';
import {
  icon, productCard, categoryTile, releaseItem, eventItem, otherTcgItem, instaItem,
  hoursRows, cartLine, slotVisual, jeuDe, badgeStatut, productCta,
} from './templates.js';
import { cart } from './cart.js';
import { toast, closeOverlay } from './ui.js';

const targets = (name) => $$(`[data-render="${name}"]:not([data-render-custom])`);

/* ---------- Menu ---------- */
function renderMega() {
  targets('mega').forEach((ul) => {
    ul.innerHTML = DATA.menu.map((item, i) => {
      if (!item.colonnes) {
        return `<li class="mega__item"><a class="mega__link" href="${esc(item.lien)}">${esc(item.titre)}</a></li>`;
      }
      const id = `mega-panel-${i}`;
      const cols = item.colonnes.map((c) => `<div class="mega__col"><p class="mega__heading">${esc(c.titre)}</p><ul>${c.liens.map((l) => `<li><a href="${esc(item.lien)}">${esc(l)}</a></li>`).join('')}</ul></div>`).join('');
      const v = item.vedette;
      const vis = v ? (v.image
        ? `<img src="${esc(v.image)}" alt="" width="600" height="600" loading="lazy" decoding="async">`
        : slotVisual({ code: v.code, format: v.titre, couleur: v.couleur, top: 'ChocoCards', cls: 'slot--flat' })) : '';
      const feat = v ? `<a class="mega__feature" href="${esc(v.lien)}" data-couleur="${esc(v.couleur || 'lilas')}"><span class="mega__feature-media" aria-hidden="true">${vis}</span><span class="mega__feature-title">${esc(v.titre)}</span><span class="mega__feature-text">${esc(v.texte)}</span></a>` : '';
      return `<li class="mega__item has-panel">`
        + `<a class="mega__link" href="${esc(item.lien)}">${esc(item.titre)}</a>`
        + `<button class="mega__toggle" type="button" aria-expanded="false" aria-controls="${id}">${icon('chevron')}<span class="sr-only">Sous-menu ${esc(item.titre)}</span></button>`
        + `<div class="mega__panel" id="${id}" hidden><div class="mega__cols">${cols}</div>${feat}</div>`
        + '</li>';
    }).join('');
  });
}

function renderMobileNav() {
  targets('mobile-nav').forEach((nav) => {
    nav.innerHTML = `<ul class="mnav">${DATA.menu.map((item) => {
      if (!item.colonnes) return `<li><a class="mnav__link" href="${esc(item.lien)}" data-overlay-close>${esc(item.titre)}</a></li>`;
      const links = item.colonnes.map((c) => `<p class="mnav__heading">${esc(c.titre)}</p><ul>${c.liens.map((l) => `<li><a href="${esc(item.lien)}" data-overlay-close>${esc(l)}</a></li>`).join('')}</ul>`).join('');
      return `<li><details class="mnav__group"><summary class="mnav__link">${esc(item.titre)}${icon('chevron')}</summary><div class="mnav__panel"><a class="mnav__all" href="${esc(item.lien)}" data-overlay-close>Tout ${esc(item.titre)}</a>${links}</div></details></li>`;
    }).join('')}</ul>`;
  });
}

/* ---------- Produits ---------- */
function renderProducts() {
  targets('products').forEach((ul) => {
    const list = produitsDe(ul.dataset.categorie);
    ul.innerHTML = list.map((p, i) => `<li class="shelf__item" style="--i:${i}">${productCard(p)}</li>`).join('');
  });
}

function renderPreorder() {
  const v = DATA.precommandeVedette;
  targets('preorder-products').forEach((ul) => {
    const ids = [v.produitId, ...(v.autresIds || [])];
    ul.innerHTML = ids.map(getProduit).filter(Boolean).map((p) => {
      const vis = p.image
        ? `<img src="${esc(p.image)}" alt="" width="160" height="160" loading="lazy" decoding="async">`
        : `<span class="mini__code">${esc(p.code)}</span>`;
      return `<li class="mini" data-product="${esc(p.id)}" data-couleur="${esc(p.couleur || 'menthe')}">`
        + `<span class="mini__media" data-fly aria-hidden="true">${vis}</span>`
        + `<div class="mini__info"><p class="mini__name">${esc(p.nom)}</p><p class="mini__meta">${badgeStatut(p.statut)}<span class="mini__price">${formatPrix(p.prix)}</span></p></div>`
        + `<div class="mini__cta">${productCta(p)}</div>`
        + '</li>';
    }).join('');
  });
}

/* ---------- Catégories, sorties, autres TCG, Instagram, événements ---------- */
function renderCategories() {
  targets('categories').forEach((ul) => {
    ul.innerHTML = DATA.categories.map(categoryTile).join('');
    // Ancres du menu (#japonais, #goodies…) : si aucune section ne porte cet id, la tuile le prend
    DATA.categories.forEach((c, i) => {
      const id = c.lien.startsWith('#') ? c.lien.slice(1) : '';
      if (id && !document.getElementById(id)) ul.children[i].id = id;
    });
  });
}

function renderSorties() {
  targets('sorties').forEach((ol) => {
    const list = upcoming(DATA.sorties);
    ol.innerHTML = list.length
      ? list.map(releaseItem).join('')
      : '<li class="release release--empty"><p>Le calendrier des prochaines sorties arrive très bientôt.</p></li>';
  });
}

function renderOthers() {
  targets('autres-tcg').forEach((ul) => { ul.innerHTML = DATA.autresTcg.map(otherTcgItem).join(''); });
}

function renderInstagram() {
  targets('instagram').forEach((ul) => { ul.innerHTML = DATA.instagram.map(instaItem).join(''); });
}

function renderEvents() {
  const list = upcoming(DATA.evenements);
  targets('events').forEach((ul) => {
    ul.innerHTML = list.length
      ? list.map(eventItem).join('')
      : '<li class="event event--empty"><p>Les prochains tournois seront annoncés très bientôt sur Instagram.</p></li>';
  });
  targets('next-event').forEach((el) => {
    const e = list[0];
    el.textContent = e ? `${e.titre} — ${dateParts(e.date).long} à ${e.heure} · ${e.prix} €` : 'Prochaines dates annoncées sur Instagram.';
  });
  targets('stat-events').forEach((el) => { el.textContent = String(list.length); el.dataset.countTo = String(list.length); });
  targets('stat-tcg').forEach((el) => { const n = 2 + DATA.autresTcg.length; el.textContent = String(n); el.dataset.countTo = String(n); });
}

/* ---------- Boutique : horaires, ouverture ---------- */
function renderStore() {
  const st = openState();
  targets('hours').forEach((ul) => { ul.innerHTML = hoursRows(st.todayIndex); });
  targets('open-status').forEach((el) => {
    el.textContent = st.label;
    el.classList.add('open-status');
    el.classList.toggle('is-open', st.open);
  });
}

/* ---------- Textes liés et compte à rebours ---------- */
function get(path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), DATA);
}
function renderBinds() {
  $$('[data-bind]:not([data-render-custom])').forEach((el) => {
    const v = get(el.dataset.bind);
    if (v != null && typeof v !== 'object') el.textContent = String(v);
  });
  targets('year').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}

let countdownTimer = 0;
function renderCountdowns() {
  const els = $$('[data-countdown]:not([data-render-custom])');
  if (!els.length) return;
  const tick = () => {
    els.forEach((el) => {
      const t = timeLeft(el.dataset.countdown);
      ['days', 'hours', 'minutes', 'seconds'].forEach((u) => {
        const node = el.querySelector(`[data-unit="${u}"]`);
        const val = String(t[u]).padStart(2, '0');
        if (node && node.textContent !== val) node.textContent = val;
      });
      el.classList.toggle('is-over', t.total === 0);
    });
  };
  tick();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(tick, 1000);
}

/* ---------- Panier (tiroir) ---------- */
function renderCart() {
  const box = targets('cart');
  if (!box.length) return;
  const draw = () => {
    const lines = cart.lines;
    const html = lines.length
      ? `<ul class="cart__lines">${lines.map(cartLine).join('')}</ul>`
        + '<div class="cart__foot">'
        + `<p class="cart__total"><span>Sous-total</span><strong>${formatPrix(cart.total)}</strong></p>`
        + `<p class="cart__note">${icon('store')}<span>Retrait gratuit en boutique à Nivelles, ou livraison rapide en Belgique.</span></p>`
        + '<button class="btn btn--holo btn--block" type="button" data-checkout>Passer commande</button>'
        + '</div>'
      : `<div class="cart__empty">${icon('bag')}<p>Votre panier est vide.</p><a class="btn btn--light btn--sm" href="#pokemon" data-overlay-close>Découvrir les nouveautés</a></div>`;
    box.forEach((el) => { if (!el.hasAttribute('data-render-custom')) el.innerHTML = html; });
  };
  draw();
  on('cart:change', draw);
  document.addEventListener('click', (e) => {
    const line = e.target.closest('.cart-line');
    if (line) {
      const id = line.dataset.id;
      const qty = cart.lines.find((l) => l.id === id)?.qty || 0;
      if (e.target.closest('[data-cart-inc]')) cart.setQty(id, qty + 1);
      else if (e.target.closest('[data-cart-dec]')) cart.setQty(id, qty - 1);
      else if (e.target.closest('[data-cart-remove]')) cart.remove(id);
    }
    if (e.target.closest('[data-checkout]')) {
      toast('Démonstration : le paiement sera branché sur la boutique en ligne.');
      closeOverlay('cart');
    }
  });
}

/* ---------- Recherche instantanée (résultats de base) ---------- */
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function renderSearch() {
  const box = targets('search')[0];
  const input = $('[data-search-input]');
  if (!box || !input) return;
  const draw = () => {
    const q = norm(input.value.trim());
    if (!q) { box.innerHTML = '<p class="search__hint">Essayez « ETB », « OP-17 », « japonais » ou « display ».</p>'; return; }
    const res = DATA.produits.filter((p) => norm(`${p.nom} ${p.code} ${p.format} ${jeuDe(p)} ${p.langue === 'JP' ? 'japonais' : ''}`).includes(q)).slice(0, 8);
    box.innerHTML = res.length
      ? `<p class="search__count" role="status">${res.length} résultat${res.length > 1 ? 's' : ''}</p><ul class="search__list">${res.map((p) => `<li class="search__item" data-couleur="${esc(p.couleur || 'lilas')}"><span class="search__thumb" aria-hidden="true">${p.image ? `<img src="${esc(p.image)}" alt="" width="64" height="64" loading="lazy">` : `<span>${esc(p.code)}</span>`}</span><span class="search__name">${esc(p.nom)}</span><span class="search__price">${formatPrix(p.prix)}</span></li>`).join('')}</ul>`
      : `<p class="search__count" role="status">Aucun résultat pour « ${esc(input.value.trim())} ».</p>`;
  };
  input.addEventListener('input', draw);
  draw();
}

/** Rend la main au navigateur entre deux rendus (évite les tâches longues > 50 ms). */
const yieldToMain = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((r) => setTimeout(r, 0)));

/**
 * Remplit tous les conteneurs pilotés par data.js. Appelé une fois par main.js
 * (await renderAll()) : le travail est découpé en petites tâches.
 */
export async function renderAll() {
  const jobs = [renderStore, renderBinds, renderCountdowns, renderMega, renderMobileNav, renderCategories, renderProducts,
    renderPreorder, renderSorties, renderOthers, renderInstagram, renderEvents, renderCart, renderSearch];
  for (const job of jobs) {
    try { job(); } catch (err) { console.error(`[render] ${job.name}`, err); }
    await yieldToMain();
  }
}
