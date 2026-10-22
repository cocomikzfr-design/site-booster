/* ==========================================================================
   Section « hero » + bandeau défilant — module du constructeur hero
   Périmètre : SECTION:marquee + SECTION:hero (DESIGN.md §8.1 et §8.3)
   Styles : css/s-hero.css · Sous-modules : js/sections/hero/*.js
   --------------------------------------------------------------------------
   Ce qui se passe, dans l'ordre :
   0. Au chargement du module (avant le démarrage de main.js) :
      statut d'ouverture en direct, découpe du mot-symbole en lettres,
      branchement de la sortie du préchargeur (hero/intro.js).
   1. Sortie du préchargeur → entrée du hero : les cartes du paquet volent
      vers l'éventail, les photos se posent, le titre se compose.
   2. init(ctx) : bandeau piloté par le défilement, parallaxe à ressort de
      l'affiche (souris), typographie cinétique, anneau « Défiler ».
   3. Scène WebGL « Le Deck » (hero/scene.js, Three.js chargé à la demande) :
      desktop → après app:ready + temps libre ; tactile → au premier contact.
      Elle reprend l'affiche au pixel près puis l'affiche s'efface.
   Repli : sans WebGL, sans CDN ou en mouvement réduit, l'affiche CSS reste
   (fixe en mouvement réduit). Tout le texte est lisible sans JavaScript.
   ========================================================================== */

import { prefs, onPrefsChange } from '../core/motion.js';
import { $, $$, on, onIdle, wait, whenNear } from '../core/utils.js';
import { onScroll } from '../core/scroll.js';
import { initMarquee } from './hero/marquee.js';
import { initLive } from './hero/live.js';
import { splitWordmark, initKinetic } from './hero/wordmark.js';
import { registerIntro, introDone, noIntro } from './hero/intro.js';
import { createPointer, bindMouse, bindTouch } from './hero/pointer.js';

const section = $('[data-hero]');
const parts = section ? collect(section) : null;

function collect(s) {
  return {
    section: s,
    chip: $('[data-hero-status]', s),
    words: $$('.hero__w', s),
    wordmark: $('[data-hero-wordmark]', s),
    lead: $('[data-hero-lead]', s),
    infos: $$('[data-hero-infos] > li', s),
    ctas: $$('[data-hero-ctas] > *', s),
    ctasWrap: $('[data-hero-ctas]', s),
    feature: $('[data-hero-feature]', s),
    scroll: $('[data-hero-scroll]', s),
    visual: $('[data-hero-visual]', s),
    deck: $('[data-hero-poster]', s),
    canvas: $('[data-hero-canvas]', s),
    photos: $$('.deck__photo', s),
    backs: $$('.deck__back', s),
    glow: $('.deck__glow', s),
    split: null,
  };
}

/* 0. Dès l'évaluation du module ------------------------------------------- */
if (section) {
  try {
    initLive(section);
    if (!prefs.reduced) parts.split = splitWordmark(parts.wordmark);
  } catch (err) {
    console.error('[hero] préparation', err);
  }
  registerIntro(() => parts);
}

/* Parallaxe CSS de l'affiche (avant la 3D ou sans WebGL) : écrit --dx / --dy */
function posterParallax(deck, pointer) {
  let raf = 0;
  let last = 0;
  let stopped = false;
  const loop = (now) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    pointer.step(dt);
    deck.style.setProperty('--dx', pointer.x.toFixed(4));
    deck.style.setProperty('--dy', pointer.y.toFixed(4));
    if (!stopped && !pointer.settled && !document.hidden) raf = requestAnimationFrame(loop);
    else last = 0;
  };
  return {
    wake() { if (!raf && !stopped) raf = requestAnimationFrame(loop); },
    stop() { stopped = true; cancelAnimationFrame(raf); raf = 0; },
    resume() { stopped = false; this.wake(); },
  };
}

/* Anneau « Défiler · Découvrir » : tourne avec le défilement (aucune boucle autonome) */
function initRing(link) {
  const ring = link?.querySelector('.hero__scroll-ring');
  if (!ring) return;
  let last = -1;
  onScroll(({ y }) => {
    if (y > innerHeight * 1.5 && last > innerHeight * 1.5) return;
    last = y;
    ring.style.transform = `rotate(${(y * 0.22).toFixed(1)}deg)`;
  });
}

const appReady = new Promise((r) => {
  if (window.__ready) r();
  else document.addEventListener('app:ready', () => r(), { once: true });
});

/* 3. Scène WebGL -------------------------------------------------------------- */
function scheduleScene(ctx, pointer, poster) {
  const { canvas, deck, visual } = parts;
  if (!canvas || !deck || !visual) return;
  let scene = null;
  let starting = false;
  let mode = null;
  const wantFull = () => prefs.desktop && prefs.finePointer;

  const start = async () => {
    if (starting || scene || prefs.reduced) return;
    starting = true;
    const full = wantFull();
    mode = full;
    if (full) section.classList.add('is-gl-full');
    try {
      const { createScene } = await import('./hero/scene.js');
      const s = await createScene({ section, visual, deck, canvas, pointer, full, gsap: ctx.gsap });
      // On laisse l'entrée se terminer : la reprise se fait sur une affiche au repos
      await Promise.race([introDone, wait(4000)]);
      if (prefs.reduced || wantFull() !== full) { s.dispose(); starting = false; return; }
      poster?.stop();
      s.show();
      scene = s;
      if (full) visual.dataset.cursor = 'Mélanger';
    } catch (err) {
      // Pas de WebGL / CDN indisponible : l’affiche CSS reste en place (cause lisible dans data-gl-error)
      section.dataset.glError = String(err?.message || err).slice(0, 120);
      section.classList.remove('is-gl-full', 'is-gl');
    }
    starting = false;
  };

  // Clic / tap sur le paquet : il se mélange (décoratif, le visuel est aria-hidden)
  visual.addEventListener('pointerdown', () => scene?.shuffle());

  const go = () => whenNear(section, start, '40% 0px');
  if (wantFull()) {
    appReady.then(() => onIdle(go, 1200));
  } else {
    // Tactile : rien avant le premier contact (Lighthouse et batterie), puis scène légère
    const events = ['pointerdown', 'touchstart', 'keydown'];
    const first = () => {
      events.forEach((t) => removeEventListener(t, first));
      appReady.then(go);
    };
    events.forEach((t) => addEventListener(t, first, { passive: true }));
  }

  // Contexte WebGL perdu : l'affiche CSS revient
  on('webgl:lost', ({ canvas: c }) => { if (c === canvas) section.classList.add('is-gl-lost'); });
  canvas.addEventListener('webglcontextrestored', () => section.classList.remove('is-gl-lost'));

  // Changement de gabarit (desktop ↔ tactile) ou de préférence de mouvement : on rend la main à l'affiche
  onPrefsChange(() => {
    if (!scene) return;
    if (prefs.reduced || wantFull() !== mode) {
      scene.dispose();
      scene = null;
      delete visual.dataset.cursor;
      if (!prefs.reduced) { poster?.resume(); go(); }
    }
  });
}

/* 2. init ------------------------------------------------------------------- */
export async function init(ctx) {
  initMarquee($('[data-marquee]'));
  if (!section) return;
  // Pas de préchargeur (visite répétée, mouvement réduit) : pas d'entrée à attendre
  if (!document.querySelector('[data-preloader]')) noIntro();
  if (prefs.reduced) return; // l'affiche reste fixe, aucune 3D en mouvement

  const pointer = createPointer();
  let poster = null;
  if (prefs.finePointer) {
    poster = posterParallax(parts.deck, pointer);
    bindMouse(pointer, () => poster.wake());
  } else {
    bindTouch(pointer, parts.visual);
  }
  // Après l'entrée (les lettres ne doivent pas être prises par GSAP en plein vol)
  introDone.then(() => initKinetic(parts, { gsap: ctx.gsap, full: prefs.desktop && prefs.finePointer }));
  if (prefs.desktop) initRing(parts.scroll);
  scheduleScene(ctx, pointer, poster);
}
