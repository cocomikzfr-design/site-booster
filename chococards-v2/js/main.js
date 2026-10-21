/* ==========================================================================
   ChocoCards v2 — point d'entrée (module ES)
   --------------------------------------------------------------------------
   Ordre de démarrage :
     0. préchargeur lancé ; on attend que le visuel du hero soit peint (≤ 1,2 s)
        pour que le JavaScript ne retarde pas le premier affichage (LCP)
     1. render.js remplit tout ce qui vient de data.js (par petites tâches),
        pendant que GSAP / ScrollTrigger / SplitText / Lenis se téléchargent
     2. socle : interface, panier, défilement, mondes de couleur
     3. sections critiques : hero puis chrome (header)
     4. polices prêtes (≤ 3 s) → sections suivantes au premier moment libre
     5. apparitions armées (html.anim-ready), ScrollTrigger rafraîchi
     6. préchargeur terminé → window.__ready = true + événement 'app:ready'
   Une section qui plante est isolée (console.error) : le reste continue.
   Fail-safe : toute erreur non rattrapée rend tout le contenu visible.
   ========================================================================== */

import DATA from './data.js';
import { loadLibs } from './core/libs.js';
import { prefs } from './core/motion.js';
import { emit, onIdle, wait } from './core/utils.js';
import { renderAll } from './core/render.js';
import { initUI } from './core/ui.js';
import { initCart } from './core/cart.js';
import { initScroll, scrollTo, refreshScroll } from './core/scroll.js';
import { initWorlds } from './core/worlds.js';
import { armReveals, disarmReveals } from './core/reveal.js';
import { initTilt } from './core/tilt.js';
import { initMagnetic } from './core/magnetic.js';
import { initCursor } from './core/cursor.js';
import { runPreloader } from './core/preloader.js';

import * as hero from './sections/hero.js';
import * as chrome from './sections/chrome.js';
import * as showcase from './sections/showcase.js';
import * as booster from './sections/booster.js';
import * as univers from './sections/univers.js';

const app = (window.__app = { status: 'boot', errors: [], scrollTo: (t, o) => scrollTo(t, o) });

/* Fail-safe : une erreur non rattrapée ne doit jamais laisser du texte invisible */
const failSafe = (err) => {
  app.errors.push(String(err?.message || err?.reason || err));
  disarmReveals();
  document.querySelector('[data-preloader]')?.remove();
};
addEventListener('error', failSafe);
addEventListener('unhandledrejection', failSafe);

async function initSection(name, mod, ctx) {
  try {
    await mod.init?.(ctx);
  } catch (err) {
    console.error(`[section ${name}]`, err);
    app.errors.push(name);
  }
}

/** Attend que les images clés du hero soient décodées puis peintes (au plus 1,2 s). */
function heroPainted() {
  const imgs = [...document.querySelectorAll('[data-preload]')];
  const decoded = Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
  return Promise.race([decoded, wait(1200)])
    .then(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
}

async function boot() {
  const preloader = runPreloader().catch((err) => console.error('[préchargeur]', err));
  await heroPainted();

  const libsReady = loadLibs();
  await renderAll();
  initUI();
  initCart();
  initWorlds();
  const libs = await libsReady;
  const lenis = initScroll();

  const ctx = { data: DATA, prefs, ...libs, lenis };
  app.ctx = ctx;

  await initSection('hero', hero, ctx);
  await initSection('chrome', chrome, ctx);
  initCursor();

  await Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(3000)]);
  await new Promise((r) => onIdle(r, 500));

  await initSection('showcase', showcase, ctx);
  await initSection('booster', booster, ctx);
  await initSection('univers', univers, ctx);

  // Tilt et magnétisme sur tout ce qui existe maintenant (y compris le contenu ajouté par les sections)
  initTilt();
  initMagnetic();
  armReveals();
  refreshScroll();

  await preloader;
  app.status = 'ready';
  window.__ready = true;
  emit('app:ready', ctx);
}

boot().catch((err) => {
  console.error('[boot]', err);
  failSafe(err);
  window.__ready = true;
});
