/* ==========================================================================
   Préchargeur « paquet de cartes » (rideau sur une page déjà rendue)
   --------------------------------------------------------------------------
   - Suit le vrai chargement : polices + images [data-preload] du hero.
   - Durée totale ≤ 1,6 s (attente ≤ 1 s + sortie 0,6 s). Fail-safe CSS à 2,8 s.
   - Absent en mouvement réduit, lors d'une visite répétée (sessionStorage,
     voir le script en tête de index.html) et avec ?nopreload.
   - À la fin : window.__ready = true puis événement 'app:ready' (main.js).

   Personnaliser la sortie (section hero) :
     import { setPreloaderExit } from '../core/preloader.js';
     setPreloaderExit(async (el) => { …animer el… });   // doit se résoudre, durée ≤ 0,8 s
   Suivre la progression : événement 'preloader:progress' (detail { progress 0–1 }).
   ========================================================================== */

import { prefs } from './motion.js';
import { wait, emit, loadImage, $$ } from './utils.js';

const MAX_WAIT = 1000;
const MIN_SHOW = 550;
let customExit = null;

/** Remplace l'animation de sortie par défaut (à appeler pendant init(), avant app:ready). */
export function setPreloaderExit(fn) { customExit = fn; }

function remember() {
  try { sessionStorage.setItem('cc-visite', '1'); } catch { /* stockage indisponible */ }
}

export async function runPreloader() {
  const el = document.querySelector('[data-preloader]');
  const html = document.documentElement;
  const skip = !el || prefs.reduced || html.classList.contains('skip-preloader') || new URLSearchParams(location.search).has('nopreload');
  remember();
  if (skip) { el?.remove(); return; }

  const start = performance.now();
  const tasks = [];
  if (document.fonts?.ready) tasks.push(document.fonts.ready);
  $$('[data-preload]').forEach((img) => tasks.push(img.complete ? Promise.resolve() : loadImage(img.currentSrc || img.src)));
  let done = 0;
  const total = Math.max(1, tasks.length);
  const progress = () => {
    done++;
    const p = Math.min(1, done / total);
    el.style.setProperty('--progress', p.toFixed(2));
    emit('preloader:progress', { progress: p });
  };
  tasks.forEach((t) => t.then(progress, progress));

  await Promise.race([Promise.allSettled(tasks), wait(MAX_WAIT)]);
  const elapsed = performance.now() - start;
  if (elapsed < MIN_SHOW) await wait(MIN_SHOW - elapsed);
  el.style.setProperty('--progress', '1');

  try {
    if (customExit) await Promise.race([customExit(el), wait(900)]);
    else {
      el.classList.add('is-leaving');
      await wait(600);
    }
  } finally {
    el.remove();
  }
}
