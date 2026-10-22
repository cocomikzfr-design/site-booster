/* ==========================================================================
   Gabarits du constructeur « showcase » (chaînes HTML, données échappées)
   --------------------------------------------------------------------------
   showCard(p)     → carte produit des étagères (Pokémon, One Piece)
   anniRow(p, i)   → ligne de l'index « 30 ans » (desktop, à côté de la vitrine)
   vitrineItem(p)  → objet posé dans la vitrine 3D (décoratif, aria-hidden)
   Les briques viennent de core/templates.js (badges, slot, icônes) : une photo
   réelle (champ « image » de data.js) remplace automatiquement la carte slot.
   ========================================================================== */

import { esc } from '../../core/utils.js';
import { formatPrix, statutInfo } from '../../core/format.js';
import { icon, badgeStatut, badgeLangue, slotVisual, jeuDe } from '../../core/templates.js';

/** « Nom — complément » → { titre, sous } (le complément passe en petite ligne). */
export function splitNom(nom = '') {
  const i = nom.indexOf(' — ');
  return i > 0 ? { titre: nom.slice(0, i), sous: nom.slice(i + 3) } : { titre: nom, sous: '' };
}

/** Masque CSS du reflet holo : la forme exacte du produit détouré.
    URL absolue : dans une variable CSS, une URL relative serait lue depuis css/. */
const absUrl = (u) => { try { return new URL(u, document.baseURI).href; } catch { return u; } };
const maskStyle = (p) => (p.image && p.detoure ? ` style="--photo:url('${esc(absUrl(p.image))}')"` : '');

/** Visuel : photo réelle si elle existe, sinon carte typographique (jamais un faux rendu). */
function visual(p, { size = 800, lazy = true } = {}) {
  if (p.image) {
    const cls = p.detoure ? 'pcard__img' : 'pcard__img pcard__img--fill';
    return `<img class="${cls}" src="${esc(p.image)}" alt="" width="${size}" height="${size}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
  }
  return slotVisual({ code: p.code, format: p.format, couleur: p.couleur, top: `${jeuDe(p)} · ${p.langue}` });
}

/** Zone d'action : bouton panier / précommande, ou état désactivé explicite. */
export function showCta(p, { compact = false } = {}) {
  const s = statutInfo(p.statut);
  const sr = `<span class="sr-only"> : ${esc(p.nom)}</span>`;
  if (s.achat) {
    return `<button class="btn btn--ink btn--sm btn--block show-cta" type="button" data-add-to-cart="${esc(p.id)}" data-cursor="${p.statut === 'precommande' ? 'Réserver' : 'Ajouter'}">`
      + `<span class="show-cta__face" data-cta-face>${icon('bag')}<span data-cta-label>${esc(s.bouton)}</span></span>`
      + `<span class="show-cta__done" aria-hidden="true">${icon('check')}<span>${p.statut === 'precommande' ? 'Réservé' : 'Ajouté'}</span></span>`
      + `${sr}</button>`;
  }
  if (p.statut === 'boutique') {
    return `<p class="pcard__instore show-instore${compact ? ' show-instore--compact' : ''}">${icon('store')}<span>${esc(s.bouton)}</span></p>`;
  }
  return `<button class="btn btn--ghost btn--sm btn--block show-off" type="button" disabled>${icon(p.statut === 'rupture' ? 'minus' : 'clock')}<span>${esc(s.bouton)}</span>${sr}</button>`;
}

/** Carte produit des étagères. */
export function showCard(p, i = 0, { li = 'shelf__item' } = {}) {
  const stamp = p.statut === 'rupture' ? '<span class="pcard__stamp" aria-hidden="true">Rupture</span>'
    : p.statut === 'bientot' ? '<span class="pcard__stamp pcard__stamp--soon" aria-hidden="true">Bientôt</span>' : '';
  const photo = p.image ? ' has-photo' : ' has-slot';
  return `<li class="${li}" style="--i:${i}">`
    + `<article class="pcard pcard--show${photo}" data-product="${esc(p.id)}" data-statut="${esc(p.statut)}" data-couleur="${esc(p.couleur || 'lilas')}">`
    + '<div class="pcard__media" data-tilt="6" data-cursor="cache">'
    + '<span class="pcard__halo" aria-hidden="true"></span>'
    + `<div class="pcard__visual" data-fly>${visual(p)}</div>`
    + '<span class="pcard__shine" aria-hidden="true"></span>'
    + `<span class="foil${p.image && p.detoure ? ' foil--shape' : ''}" aria-hidden="true"${maskStyle(p)}></span>`
    + `<div class="pcard__badges">${badgeStatut(p.statut)}${badgeLangue(p.langue)}</div>`
    + stamp
    + '</div>'
    + '<div class="pcard__body">'
    + `<p class="pcard__code"><span>${esc(jeuDe(p))}</span><span aria-hidden="true">·</span><span class="pcard__set">${esc(p.code)}</span><span aria-hidden="true">·</span><span>${esc(p.format)}</span></p>`
    + `<h3 class="pcard__title">${esc(p.nom)}</h3>`
    + '<div class="pcard__foot">'
    + `<p class="pcard__price"><span class="sr-only">Prix : </span>${formatPrix(p.prix)}</p>`
    + showCta(p)
    + '</div></div></article></li>';
}

/** Ligne de l'index de la vitrine « 30 ans » (contenu complet, toujours lisible). */
export function anniRow(p, i, n) {
  const { titre, sous } = splitNom(p.nom);
  const instore = p.statut === 'boutique';
  const thumb = p.image
    ? `<img src="${esc(p.image)}" alt="" width="96" height="96" loading="lazy" decoding="async">`
    : `<span class="arow__code">${esc(p.code)}</span>`;
  return `<li class="arow" data-product="${esc(p.id)}" data-statut="${esc(p.statut)}" data-couleur="${esc(p.couleur || 'or')}" data-index="${i}" style="--i:${i}">`
    + `<span class="arow__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>`
    + `<span class="arow__thumb" aria-hidden="true" data-fly>${thumb}</span>`
    + '<div class="arow__main">'
    + `<div class="arow__top"><p class="arow__meta">${esc(p.code)} · ${esc(p.format || sous)}</p>`
    + `<p class="arow__price"><span class="sr-only">Prix : </span>${formatPrix(p.prix)}</p></div>`
    + `<h3 class="arow__title"><button class="arow__pick" type="button" data-vitrine-pick="${i}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(titre)}<span class="sr-only"> — afficher dans la vitrine (${i + 1} sur ${n})</span></button></h3>`
    + `<div class="arow__tags">${badgeStatut(p.statut)}${badgeLangue(p.langue)}</div>`
    + (instore ? showCta(p, { compact: true }) : '')
    + (instore ? '' : `<div class="arow__cta">${showCta(p, { compact: true })}</div>`)
    + '</div>'
    + '</li>';
}

/** Objet de la vitrine 3D (purement visuel : l'index porte le texte). */
export function vitrineItem(p, i) {
  const kind = p.image ? (p.detoure ? 'photo' : 'photo-fill') : 'slot';
  const obj = p.image
    ? `<img class="vitrine__img" src="${esc(p.image)}" alt="" width="800" height="800" loading="lazy" decoding="async">`
    : slotVisual({ code: p.code, format: p.format, couleur: p.couleur, top: `${jeuDe(p)} · 30 ans`, cls: 'slot--flat vitrine__slot' });
  return `<div class="vitrine__item vitrine__item--${kind}" data-couleur="${esc(p.couleur || 'or')}" data-i="${i}">`
    + '<div class="vitrine__float">'
    + '<span class="vitrine__halo"></span>'
    + `<div class="vitrine__obj">${obj}`
    + `<span class="vitrine__foil${p.image && p.detoure ? ' vitrine__foil--shape' : ''}"${maskStyle(p)}></span>`
    + '</div></div></div>';
}
