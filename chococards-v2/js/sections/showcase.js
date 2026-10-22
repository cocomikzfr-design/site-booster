/* ==========================================================================
   Section « showcase » — module du constructeur showcase (voir DESIGN.md §10)
   Périmètre : SECTION:anniversaire, SECTION:pokemon, SECTION:one-piece
   Styles : css/s-showcase.css · Sous-modules : js/sections/showcase/*.js
   --------------------------------------------------------------------------
   1. « Pokémon fête ses 30 ans » : vitrine orbitale 3D (desktop) + index de
      la collection ; liste de cartes en « coverflow » au défilement (mobile).
   2. Étagères Pokémon / One Piece : cartes showcase, glisser avec inertie,
      inclinaison selon la vitesse, progression, retour « Ajouté ✓ ».
   3. Survol WebGL des vraies photos (un seul canvas partagé, desktop souris),
      chargé à la demande après app:ready.
   Les 3 listes produits portent data-render-custom : ce module les rend lui-même
   (une tâche par liste). Chaque partie est isolée (try/catch) et une liste restée
   vide reçoit les cartes de base du socle (fallbackRender). Mouvement réduit :
   positions finales, pas de 3D en mouvement. init(ctx) est appelé une fois par
   main.js, après render.js.
   ========================================================================== */

import { prefs } from '../core/motion.js';
import { $, $$, on, onIdle } from '../core/utils.js';
import { onScroll } from '../core/scroll.js';
import { produitsDe } from '../core/format.js';
import { productCard } from '../core/templates.js';
import { initVitrine, initListFlow } from './showcase/vitrine.js';
import { initShelves, initCartFeedback } from './showcase/shelves.js';

const guard = (name, fn) => {
  try { return fn(); } catch (err) { console.error(`[showcase] ${name}`, err); return null; }
};
const nextTask = () => new Promise((r) => setTimeout(r, 0));

/** Filet de sécurité : un conteneur resté vide reçoit les cartes de base du socle. */
function fallbackRender(ul, li) {
  if (!ul || ul.children.length) return;
  ul.innerHTML = produitsDe(ul.dataset.categorie).map((p, i) => `<li class="${li}" style="--i:${i}">${productCard(p)}</li>`).join('');
}

/** Parallaxe douce du grand « 30 » de la feuille (mobile / tablette). */
function numParallax(section) {
  const num = $('.anniv__num', section);
  if (!num || prefs.reduced) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = section.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (innerHeight - r.top) / (innerHeight + r.height); // 0 → 1 pendant la traversée
    num.style.transform = `translate3d(0, ${((p - 0.5) * -90).toFixed(1)}px, 0)`;
  };
  onScroll(() => { if (!raf) raf = requestAnimationFrame(update); });
  raf = requestAnimationFrame(update);
}

export async function init() {
  const anniv = $('#anniversaire');
  const shelves = $$('#pokemon, #one-piece');

  if (anniv) {
    guard('vitrine', () => initVitrine(anniv));
    guard('liste mobile', () => initListFlow(anniv));
    guard('30', () => numParallax(anniv));
    // Desktop : la liste reste vide et cachée (la vitrine + l'index la remplacent)
    if (!anniv.classList.contains('is-vitrine')) fallbackRender($('.anniv__list', anniv), 'anniv__item');
    await nextTask();
  }
  try { await initShelves(shelves); } catch (err) { console.error('[showcase] étagères', err); }
  shelves.forEach((s) => fallbackRender($('[data-shelf]', s), 'shelf__item'));
  guard('panier', () => initCartFeedback([anniv, ...shelves].filter(Boolean)));

  // Survol WebGL : seulement desktop + souris + WebGL, après le démarrage complet
  if (!prefs.reduced && prefs.finePointer && prefs.desktop && prefs.webgl) {
    const tracks = shelves.map((s) => $('[data-shelf]', s)).filter(Boolean);
    on('app:ready', () => onIdle(() => {
      import('./showcase/hover-gl.js')
        .then((m) => m.initHoverGL(tracks))
        .catch((err) => console.warn('[showcase] survol WebGL indisponible', err));
    }, 1500));
  }
}
