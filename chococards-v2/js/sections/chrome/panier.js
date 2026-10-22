/* ==========================================================================
   Tiroir panier — branché sur le magasin du socle (core/cart.js)
   --------------------------------------------------------------------------
   Rendu « à clés » : chaque ligne garde son élément d'un rendu à l'autre, ce qui
   permet des animations propres (transform / opacity uniquement) :
     ajout → la ligne glisse depuis la droite ; quantité → le chiffre roule ;
     suppression → la ligne s'efface puis les suivantes remontent (FLIP) ;
     sous-total → le montant défile jusqu'à la nouvelle valeur.
   Accessibilité : chaque changement est annoncé (aria-live), le focus ne se perd
   jamais quand une ligne disparaît (il passe à la ligne voisine ou au bouton Fermer).
   Panier vide : suggestions de vrais produits (photos de la boutique) à ajouter.
   ========================================================================== */

import { prefs } from '../../core/motion.js';
import { $, $$, esc, on } from '../../core/utils.js';
import { cart } from '../../core/cart.js';
import { formatPrix, getProduit, statutInfo } from '../../core/format.js';
import { icon, mark } from '../../core/templates.js';
import { toast, closeOverlay } from '../../core/ui.js';
import { play, tweenNumber, EASE_OUT, EASE_SOFT } from './kit.js';

const SUGGEST = ['pk-jp-30th', 'op-op17-booster', 'pk-me06-etb'];
const MAX = 99;

function lineHtml(l) {
  const p = l.product;
  const thumb = p.image
    ? `<img src="${esc(p.image)}" alt="" width="80" height="80" loading="lazy" decoding="async">`
    : `<span class="cline__code">${esc(p.code)}</span>`;
  const pre = p.statut === 'precommande' ? '<span class="cline__tag">Précommande</span>' : '';
  return `<li class="cline" data-id="${esc(p.id)}" data-couleur="${esc(p.couleur || 'lilas')}">`
    + `<span class="cline__thumb" aria-hidden="true">${thumb}</span>`
    + '<div class="cline__info">'
    + `<p class="cline__name">${esc(p.nom)}</p>`
    + `<p class="cline__meta"><span class="cline__unit">${formatPrix(p.prix)}</span><span class="sr-only"> l’unité</span>${pre}</p>`
    + `<div class="cline__qty" role="group" aria-label="Quantité : ${esc(p.nom)}">`
    + `<button class="cline__btn" type="button" data-cart-dec aria-label="Retirer un exemplaire : ${esc(p.nom)}">${icon('minus')}</button>`
    + `<span class="cline__val"><span class="cline__num qty__value" data-cd-num>${l.qty}</span><span class="sr-only"> exemplaire(s)</span></span>`
    + `<button class="cline__btn" type="button" data-cart-inc aria-label="Ajouter un exemplaire : ${esc(p.nom)}"${l.qty >= MAX ? ' disabled' : ''}>${icon('plus')}</button>`
    + '</div></div>'
    + '<div class="cline__end">'
    + `<p class="cline__total" data-cd-line-total>${formatPrix(l.qty * p.prix)}</p>`
    + `<button class="cline__remove" type="button" data-cart-remove aria-label="Supprimer du panier : ${esc(p.nom)}">${icon('trash')}</button>`
    + '</div></li>';
}

function suggestionsHtml() {
  const list = SUGGEST.map(getProduit).filter((p) => p && statutInfo(p.statut).achat);
  if (!list.length) return '';
  return '<div class="cdrawer__suggest"><p class="cdrawer__label">À découvrir</p><ul class="cdrawer__slist">'
    + list.map((p) => `<li class="csug" data-couleur="${esc(p.couleur || 'lilas')}">`
      + `<span class="csug__thumb" aria-hidden="true">${p.image ? `<img src="${esc(p.image)}" alt="" width="80" height="80" loading="lazy" decoding="async">` : `<span class="cline__code">${esc(p.code)}</span>`}</span>`
      + `<span class="csug__info"><span class="csug__name">${esc(p.court || p.nom)}</span><span class="csug__price">${formatPrix(p.prix)}</span></span>`
      + `<button class="csug__add" type="button" data-cd-add="${esc(p.id)}"><span>${p.statut === 'precommande' ? 'Précommander' : 'Ajouter'}</span><span class="sr-only"> : ${esc(p.nom)}</span>${icon('plus')}</button>`
      + '</li>').join('')
    + '</ul></div>';
}

export function initCartDrawer() {
  const root = $('[data-overlay="cart"]');
  const box = root && $('[data-render="cart"][data-render-custom]', root);
  if (!box) return;
  // Pastille « N articles » dans le titre + zone d'annonce (lecteurs d'écran)
  $('#panier-title', root)?.insertAdjacentHTML('beforeend', ' <span class="cdrawer__count" data-cdrawer-count></span>');
  box.insertAdjacentHTML('afterend', '<p class="sr-only" role="status" aria-live="polite" data-cart-live></p>');
  const live = $('[data-cart-live]', root);
  const countEl = $('[data-cdrawer-count]', root);

  box.innerHTML = '<div class="cdrawer__body">'
    + '<ul class="cdrawer__lines" data-cd-lines aria-label="Articles du panier"></ul>'
    + '<div class="cdrawer__empty" data-cd-empty hidden>'
    + `<div class="cdrawer__fan" aria-hidden="true"><span class="card-back"></span><span class="card-back"></span><span class="card-back"></span>${mark('cdrawer__mark')}</div>`
    + '<p class="cdrawer__empty-title">Votre panier est vide.</p>'
    + '<p class="cdrawer__empty-text">Boosters, displays, cartes japonaises : il y a forcément une carte qui vous attend.</p>'
    + '<a class="btn btn--light btn--sm" href="#pokemon" data-cd-browse>Voir les nouveautés</a>'
    + suggestionsHtml()
    + '</div></div>'
    + '<div class="cdrawer__foot" data-cd-foot hidden>'
    + `<p class="cdrawer__perk">${icon('store')}<span><strong>Retrait gratuit</strong> en boutique à Nivelles, ou expédition rapide en Belgique.</span></p>`
    + '<p class="cdrawer__sub"><span>Sous-total</span><strong data-cd-total>0,00 €</strong></p>'
    + '<button class="btn btn--holo btn--block cdrawer__checkout" type="button" data-checkout><span>Passer commande</span>' + icon('arrow') + '</button>'
    + `<p class="cdrawer__secure">${icon('check')}<span>Paiement 100&nbsp;% sécurisé · Bancontact, cartes, Apple Pay, Google Pay</span></p>`
    + '</div>';

  const list = $('[data-cd-lines]', box);
  const empty = $('[data-cd-empty]', box);
  const foot = $('[data-cd-foot]', box);
  const totalEl = $('[data-cd-total]', box);
  const els = new Map();
  let shownTotal = 0;
  let stopTween = () => {};
  let lastQty = new Map();

  const say = (msg) => { if (live) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = msg; }); } };

  function setTotal(total, animate) {
    stopTween();
    if (!animate) { shownTotal = total; totalEl.textContent = formatPrix(total); return; }
    stopTween = tweenNumber(shownTotal, total, (v) => { shownTotal = v; totalEl.textContent = formatPrix(v); }, { duration: 560 });
  }

  function rollNumber(el, value, dir) {
    if (el.textContent === String(value)) return;
    el.textContent = String(value);
    play(el, [{ opacity: 0, transform: `translate3d(0, ${dir > 0 ? 70 : -70}%, 0)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE_OUT });
  }

  function removeLine(id, li) {
    els.delete(id);
    const hadFocus = li.contains(document.activeElement);
    const role = document.activeElement?.matches?.('[data-cart-dec]') ? '[data-cart-dec]' : '[data-cart-remove]';
    const neighbour = li.nextElementSibling || li.previousElementSibling;
    li.classList.add('is-leaving');
    const finish = () => {
      const others = $$('.cline', list).filter((x) => x !== li);
      const before = new Map(others.map((o) => [o, o.getBoundingClientRect().top]));
      li.remove();
      others.forEach((o) => {
        const d = before.get(o) - o.getBoundingClientRect().top;
        if (Math.abs(d) > 1) play(o, [{ transform: `translate3d(0, ${d}px, 0)` }, { transform: 'none' }], { duration: 420, easing: EASE_OUT });
      });
      if (hadFocus) {
        const target = (neighbour && neighbour.isConnected && $(role, neighbour)) || $('[data-cd-browse]', box) || $('.drawer__close', root);
        if (target && !target.closest('[hidden]')) target.focus({ preventScroll: true });
        else $('.drawer__close', root)?.focus({ preventScroll: true });
      }
    };
    const a = play(li, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(48px, 0, 0)' }], { duration: 260, easing: EASE_SOFT, fill: 'forwards' });
    if (a) a.finished.then(finish, finish); else finish();
  }

  function sync(snap, { animate = true } = {}) {
    const ids = snap.lines.map((l) => l.id);
    els.forEach((li, id) => { if (!ids.includes(id)) removeLine(id, li); });
    snap.lines.forEach((l, i) => {
      let li = els.get(l.id);
      if (!li) {
        const tmp = document.createElement('ul');
        tmp.innerHTML = lineHtml(l);
        li = tmp.firstElementChild;
        const ref = list.children[i] || null;
        list.insertBefore(li, ref);
        els.set(l.id, li);
        if (animate) play(li, [{ opacity: 0, transform: 'translate3d(36px, 0, 0)' }, { opacity: 1, transform: 'none' }], { duration: 560, easing: EASE_OUT });
      } else {
        const prev = lastQty.get(l.id) || l.qty;
        rollNumber($('[data-cd-num]', li), l.qty, l.qty > prev ? 1 : -1);
        $('[data-cd-line-total]', li).textContent = formatPrix(l.qty * l.product.prix);
        const inc = $('[data-cart-inc]', li);
        inc.disabled = l.qty >= MAX;
      }
    });
    lastQty = new Map(snap.lines.map((l) => [l.id, l.qty]));
    const has = snap.count > 0;
    empty.hidden = has;
    foot.hidden = !has;
    if (countEl) countEl.textContent = has ? `${snap.count} article${snap.count > 1 ? 's' : ''}` : '';
    setTotal(snap.total, animate && !prefs.reduced);
  }

  // Interactions (délégation dans le tiroir)
  box.addEventListener('click', (e) => {
    const li = e.target.closest('.cline');
    if (li) {
      const id = li.dataset.id;
      const p = getProduit(id);
      const qty = cart.lines.find((l) => l.id === id)?.qty || 0;
      if (e.target.closest('[data-cart-inc]')) {
        cart.setQty(id, Math.min(MAX, qty + 1));
        say(`${p.nom} : quantité ${Math.min(MAX, qty + 1)}. Sous-total ${formatPrix(cart.total)}.`);
      } else if (e.target.closest('[data-cart-dec]')) {
        cart.setQty(id, qty - 1);
        say(qty - 1 > 0 ? `${p.nom} : quantité ${qty - 1}. Sous-total ${formatPrix(cart.total)}.` : `${p.nom} retiré du panier.`);
      } else if (e.target.closest('[data-cart-remove]')) {
        cart.remove(id);
        say(`${p.nom} retiré du panier.${cart.count ? ` Sous-total ${formatPrix(cart.total)}.` : ' Le panier est vide.'}`);
      }
      return;
    }
    const add = e.target.closest('[data-cd-add]');
    if (add) {
      const p = getProduit(add.dataset.cdAdd);
      if (p && cart.add(p.id, 1, { source: add })) {
        say(`${p.nom} ajouté au panier. Sous-total ${formatPrix(cart.total)}.`);
        requestAnimationFrame(() => $('.cline [data-cart-inc]', list)?.focus({ preventScroll: true }));
      }
      return;
    }
    if (e.target.closest('[data-cd-browse]')) closeOverlay('cart');
    if (e.target.closest('[data-checkout]')) {
      toast('Démonstration : le paiement sera branché sur la boutique en ligne.');
      closeOverlay('cart');
    }
  });

  on('cart:change', (snap) => sync(snap));
  // Ouverture : cascade des lignes puis du pied
  on('overlay:open', ({ id }) => {
    if (id !== 'cart') return;
    $$('.cline', list).slice(0, 6).forEach((li, i) => {
      play(li, [{ opacity: 0, transform: 'translate3d(32px, 0, 0)' }, { opacity: 1, transform: 'none' }], { duration: 620, delay: 120 + i * 60, easing: EASE_OUT });
    });
    const tail = empty.hidden ? foot : empty;
    play(tail, [{ opacity: 0, transform: 'translate3d(0, 16px, 0)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 200, easing: EASE_OUT });
  });
  sync({ lines: cart.lines, count: cart.count, total: cart.total }, { animate: false });
}
