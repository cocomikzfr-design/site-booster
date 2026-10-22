/* ==========================================================================
   Section « chrome » — module du constructeur chrome (voir DESIGN.md §10)
   Périmètre : SECTION:header (méga-menu, tiroir mobile, recherche, panier),
               SECTION:confiance, SECTION:footer.
   Styles : css/s-chrome.css · Sous-modules : js/sections/chrome/*.js
     header.js  états au défilement, teinte du monde, reflet, raccourcis « / » et Ctrl/⌘ K
     menus.js   méga-menu, tiroir mobile, sélecteurs pays / langue
     search.js  recherche instantanée (palette clavier)
     panier.js  tiroir panier (quantités, suppression, sous-total)
     footer.js  engagements, newsletter, mot-symbole cinétique, retour en haut
     kit.js     petits outils partagés (animations sûres, normalisation…)

   Rien ici n'a besoin de GSAP ni de Lenis : tout marche avec ?nolibs.
   init(ctx) est appelé par main.js après le rendu de base. Filet de sécurité :
   si les bibliothèques tardent (CDN lent, jusqu'à 8 s), le header est branché
   de toute façon après 2,5 s pour que menus, recherche et panier répondent.
   ========================================================================== */

import { renderMega, renderMobileNav, decorateLocale, initMega, initMobileDrawer, initLocale } from './chrome/menus.js';
import { initHeader, buildHeaderDecor } from './chrome/header.js';
import { initSearch } from './chrome/search.js';
import { initCartDrawer } from './chrome/panier.js';
import { initFooter } from './chrome/footer.js';

let done = false;

/**
 * Rendu immédiat (à l'évaluation du module, avant le démarrage) : rangée du méga-menu,
 * tiroir mobile et petits décors du header. Simples insertions DOM, sans mesure : la
 * rangée de navigation a sa forme définitive dès le premier affichage (pas de saut).
 */
function renderEarly() {
  const steps = [['méga-menu', renderMega], ['tiroir', renderMobileNav], ['décors', buildHeaderDecor], ['langues', decorateLocale]];
  for (const [name, fn] of steps) {
    try { fn(); } catch (err) { console.error(`[chrome] ${name}`, err); }
  }
}
renderEarly();

function setup() {
  if (done) return;
  done = true;
  const steps = [
    ['header', initHeader],
    ['mega', initMega],
    ['tiroir', initMobileDrawer],
    ['langues', initLocale],
    ['recherche', initSearch],
    ['panier', initCartDrawer],
    ['footer', initFooter],
  ];
  for (const [name, fn] of steps) {
    try { fn(); } catch (err) { console.error(`[chrome] ${name}`, err); }
  }
  document.documentElement.classList.add('chrome-ready');
}

// Filet de sécurité : CDN lent → on n'attend pas init() pour brancher le header
setTimeout(setup, 2500);

/**
 * Feuille différée (css/s-chrome-plus.css) : tant qu'elle n'est pas appliquée, ses
 * transitions sont coupées (sinon chaque bordure ou fond « transiterait » depuis le
 * style de base à son arrivée). html.chrome-css est posé deux frames après son chargement.
 */
(function watchDeferredCss() {
  const html = document.documentElement;
  let done = false;
  const ready = () => {
    if (done) return;
    done = true;
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('chrome-css')));
  };
  const link = document.querySelector('link[href$="s-chrome-plus.css"]');
  if (!link || (link.sheet && link.media !== 'print')) ready();
  else link.addEventListener('load', () => setTimeout(ready, 0));
  setTimeout(ready, 4000);
}());

export function init() {
  setup();
}
