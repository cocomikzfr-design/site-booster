/* ==========================================================================
   Gabarits HTML partagés (chaînes) — utilisés par render.js et les sections
   --------------------------------------------------------------------------
   Toutes les valeurs venant de data.js passent par esc().
   Pour une variante propre à une section : écrivez votre gabarit dans votre
   module de section en réutilisant ces briques (icon, badges, productVisual…).
   ========================================================================== */

import DATA from '../data.js';
import { esc } from './utils.js';
import { formatPrix, statutInfo, dateParts, relativeDays } from './format.js';

/** Icône du sprite SVG de index.html (#i-…). */
export const icon = (id, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;

/** Petit monogramme ChocoCards (symbole #logo-mark). */
export const mark = (cls = 'slot__mark') => `<svg class="${cls}" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><use href="#logo-mark"/></svg>`;

const JEUX = { 'pokemon-30-ans': 'Pokémon', pokemon: 'Pokémon', 'one-piece': 'One Piece' };
export const jeuDe = (p) => JEUX[p.categorie] || 'TCG';

export function badgeStatut(statut) {
  return `<span class="badge badge--${esc(statut)}">${esc(statutInfo(statut).label)}</span>`;
}

export function badgeLangue(langue) {
  const label = DATA.langues[langue] || langue;
  return `<span class="badge badge--lang" data-lang="${esc(langue)}"><span aria-hidden="true">${esc(langue)}</span><span class="sr-only">${esc(label)}</span></span>`;
}

/** Carte typographique « slot » (pas de photo) : code du set + format + reflet holo. Décorative. */
export function slotVisual({ code = '', format = '', couleur = 'lilas', top = '', cls = '' } = {}) {
  const long = String(code).length > 5 ? ' slot__code--long' : '';
  return `<div class="slot${cls ? ` ${cls}` : ''}" data-couleur="${esc(couleur)}" aria-hidden="true">`
    + `<span class="slot__top">${esc(top)}</span>`
    + `<span class="slot__code${long}">${esc(code)}</span>`
    + `<span class="slot__format"><span>${esc(format)}</span>${mark()}</span>`
    + '</div>';
}

/** Image produit si elle existe, sinon carte « slot ». */
export function productVisual(p, { eager = false, alt = '' } = {}) {
  if (p.image) {
    const cls = p.detoure ? 'pcard__img' : 'pcard__img pcard__img--fill';
    const load = eager ? 'fetchpriority="high"' : 'loading="lazy"';
    return `<img class="${cls}" src="${esc(p.image)}" alt="${esc(alt)}" width="800" height="800" ${load} decoding="async">`;
  }
  return slotVisual({ code: p.code, format: p.format, couleur: p.couleur, top: `${jeuDe(p)} · ${p.langue}` });
}

/** Bouton d'achat ou mention « en boutique » selon le statut. */
export function productCta(p, { size = 'sm' } = {}) {
  const s = statutInfo(p.statut);
  const sz = size ? ` btn--${size}` : '';
  if (s.achat) {
    return `<button class="btn btn--ink${sz} btn--block" type="button" data-add-to-cart="${esc(p.id)}" data-cursor="Ajouter">`
      + `${icon('bag')}<span>${esc(s.bouton)}</span><span class="sr-only"> : ${esc(p.nom)}</span></button>`;
  }
  if (p.statut === 'boutique') {
    return `<p class="pcard__instore">${icon('store')}<span>${esc(s.bouton)}</span></p>`;
  }
  return `<button class="btn btn--ghost${sz} btn--block" type="button" disabled>${esc(s.bouton)}<span class="sr-only"> : ${esc(p.nom)}</span></button>`;
}

/**
 * Carte produit de base (.pcard). Options :
 *   eager : image chargée tout de suite (au-dessus de la ligne de flottaison)
 *   tilt  : inclinaison max en degrés (0 = pas de tilt)
 */
export function productCard(p, { eager = false, tilt = 7 } = {}) {
  return `<article class="pcard" data-product="${esc(p.id)}" data-statut="${esc(p.statut)}" data-couleur="${esc(p.couleur || 'lilas')}">`
    + `<div class="pcard__media"${tilt ? ` data-tilt="${tilt}"` : ''}>`
    + `<div class="pcard__visual" data-fly>${productVisual(p, { eager })}</div>`
    + '<span class="foil" aria-hidden="true"></span>'
    + `<div class="pcard__badges">${badgeStatut(p.statut)}${badgeLangue(p.langue)}</div>`
    + '</div>'
    + '<div class="pcard__body">'
    + `<p class="pcard__code">${esc(jeuDe(p))} · ${esc(p.code)}</p>`
    + `<h3 class="pcard__title">${esc(p.nom)}</h3>`
    + '<div class="pcard__foot">'
    + `<p class="pcard__price"><span class="sr-only">Prix : </span>${formatPrix(p.prix)}</p>`
    + productCta(p)
    + '</div></div></article>';
}

/** Tuile de catégorie (Explorez la boutique). */
export function categoryTile(c, i = 0) {
  const media = c.image
    ? `<img class="cat__img" src="${esc(c.image)}" alt="" width="600" height="600" loading="lazy" decoding="async">`
    : slotVisual({ code: c.code, format: c.titre, couleur: c.couleur, top: 'ChocoCards', cls: 'slot--flat cat__slot' });
  return `<li class="bento__item bento__item--${esc(c.id)}" data-couleur="${esc(c.couleur)}" style="--i:${i}">`
    + `<a class="cat" href="${esc(c.lien)}" data-tilt="5" data-cursor="Voir">`
    + `<span class="cat__text"><h3 class="cat__title">${esc(c.titre)}</h3><span class="cat__desc">${esc(c.texte)}</span></span>`
    + `<span class="cat__media" aria-hidden="true">${media}</span>`
    + `<span class="cat__go" aria-hidden="true">${icon('arrow')}</span>`
    + '<span class="foil" aria-hidden="true"></span>'
    + '</a></li>';
}

/** Sortie TCG (timeline). */
export function releaseItem(r, i = 0) {
  const d = dateParts(r.date);
  return `<li class="release" data-couleur="${esc(r.couleur || 'lilas')}" style="--i:${i}">`
    + '<article class="release__card">'
    + `<p class="release__when"><time datetime="${d.iso}"><span class="release__day">${d.jour2}</span><span class="release__month">${d.moisCourt}</span></time>`
    + `<span class="release__weekday">${d.semaine}</span><span class="release__rel">${relativeDays(r.date)}</span></p>`
    + `<p class="release__game">${esc(r.jeu)}</p>`
    + `<h3 class="release__title">${esc(r.titre)}</h3>`
    + `<p class="release__text">${esc(r.texte)}</p>`
    + `<a class="link-arrow release__link" href="${esc(r.lien)}"><span>Voir</span>${icon('arrow')}<span class="sr-only"> : ${esc(r.jeu)} ${esc(r.titre)}</span></a>`
    + '</article></li>';
}

/** Tournoi / événement (billet). */
export function eventItem(e, i = 0) {
  const d = dateParts(e.date);
  const m = /(\d{1,2})\s*h\s*(\d{2})?/.exec(String(e.heure || '')) || [0, '0', '00'];
  const hh = `${m[1].padStart(2, '0')}:${m[2] || '00'}`;
  const ext = /^https?:/.test(e.lien);
  return `<li class="event" style="--i:${i}">`
    + '<article class="ticket">'
    + `<p class="ticket__date"><time datetime="${d.iso}T${hh}"><span class="ticket__day">${d.jour2}</span><span class="ticket__month">${d.moisCourt}</span></time><span class="ticket__weekday">${d.semaine}</span></p>`
    + '<div class="ticket__body">'
    + `<p class="ticket__game">${esc(e.jeu)}</p>`
    + `<h3 class="ticket__title">${esc(e.titre)}</h3>`
    + `<ul class="ticket__meta"><li>${icon('clock')}${esc(e.heure)}</li><li>${icon('ticket')}${esc(e.prix)}&nbsp;€</li><li>${icon('pin')}${esc(DATA.boutique.rue)}</li></ul>`
    + '</div>'
    + `<a class="btn btn--ink btn--sm ticket__cta" href="${esc(e.lien)}"${ext ? ' target="_blank" rel="noopener"' : ''} data-magnetic>S’inscrire<span class="sr-only"> au ${esc(e.titre)} du ${d.long}</span></a>`
    + '</article></li>';
}

/** Carte « autre TCG » : typographique, couleurs du jeu en reflet (aucun logo). */
export function otherTcgItem(t, i = 0) {
  const [c1, c2] = t.couleurs || ['#8B6CFF', '#2EE6FF'];
  const media = t.image ? `<img class="tcg__img" src="${esc(t.image)}" alt="" loading="lazy" decoding="async">` : '';
  return `<li class="tcg" style="--i:${i};--c1:${esc(c1)};--c2:${esc(c2)}">`
    + `<a class="tcg__card" href="${esc(t.lien)}" data-tilt="9" data-cursor="Voir">`
    + media
    + `<span class="tcg__sigle" aria-hidden="true">${esc(t.sigle || t.nom.slice(0, 2))}</span>`
    + `<h3 class="tcg__name">${esc(t.nom)}</h3>`
    + `<p class="tcg__text">${esc(t.texte)}</p>`
    + '<span class="foil" aria-hidden="true"></span>'
    + '</a></li>';
}

/** Vignette Instagram (photo réelle ou vignette typographique). */
export function instaItem(x, i = 0) {
  const media = x.image
    ? `<img class="insta__img${x.detoure ? ' is-cutout' : ''}" src="${esc(x.image)}" alt="${esc(x.alt)}" width="600" height="600" loading="lazy" decoding="async">`
    : `<span class="insta__slot" aria-hidden="true">${icon('instagram')}</span><span class="sr-only">${esc(x.alt)}</span>`;
  return `<li class="insta" data-couleur="${esc(x.couleur || 'violet')}" style="--i:${i}">`
    + `<a class="insta__link" href="${esc(x.lien || DATA.boutique.instagram)}" target="_blank" rel="noopener" data-cursor="Voir">`
    + media
    + `<span class="insta__caption" aria-hidden="true">${esc(x.legende || '')}</span>`
    + '<span class="sr-only"> (Instagram, nouvel onglet)</span>'
    + '</a></li>';
}

/** Ligne d'horaires (lundi → dimanche). */
export function hoursRows(todayIndex) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((i) => {
    const h = DATA.boutique.horaires[i];
    const today = i === todayIndex;
    return `<li class="hours__row${today ? ' is-today' : ''}${h.heures ? '' : ' is-closed'}"${today ? ' aria-current="date"' : ''}>`
      + `<span class="hours__day">${esc(h.jour)}${today ? ' <span class="hours__tag">aujourd’hui</span>' : ''}</span>`
      + `<span class="hours__time">${esc(h.heures || 'Fermé')}</span></li>`;
  }).join('');
}

/** Ligne du panier (tiroir). */
export function cartLine(l) {
  const p = l.product;
  const thumb = p.image
    ? `<img src="${esc(p.image)}" alt="" width="80" height="80" loading="lazy" decoding="async">`
    : `<span class="cart-line__code">${esc(p.code)}</span>`;
  return `<li class="cart-line" data-id="${esc(p.id)}" data-couleur="${esc(p.couleur || 'lilas')}">`
    + `<span class="cart-line__thumb" aria-hidden="true">${thumb}</span>`
    + '<div class="cart-line__info">'
    + `<p class="cart-line__name">${esc(p.nom)}</p>`
    + `<p class="cart-line__price">${formatPrix(p.prix)}${p.statut === 'precommande' ? ' · précommande' : ''}</p>`
    + '<div class="qty">'
    + `<button class="qty__btn" type="button" data-cart-dec aria-label="Retirer un exemplaire : ${esc(p.nom)}">${icon('minus')}</button>`
    + `<span class="qty__value">${l.qty}<span class="sr-only"> exemplaire${l.qty > 1 ? 's' : ''}</span></span>`
    + `<button class="qty__btn" type="button" data-cart-inc aria-label="Ajouter un exemplaire : ${esc(p.nom)}">${icon('plus')}</button>`
    + '</div></div>'
    + `<button class="icon-btn cart-line__remove" type="button" data-cart-remove aria-label="Supprimer du panier : ${esc(p.nom)}">${icon('trash')}</button>`
    + '</li>';
}
