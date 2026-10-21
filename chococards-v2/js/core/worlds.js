/* ==========================================================================
   Moteur des « mondes de couleur » (scène fixe derrière tout le contenu)
   --------------------------------------------------------------------------
   Chaque section porte data-world="nom". Quand une section passe la ligne
   médiane de l'écran, la scène fond (opacité seule) vers le calque de ce
   monde. Chaque calque = une couleur de base + 3 nappes lumineuses qui
   dérivent lentement (transform seul, CSS). Les calques inactifs sont en
   display:none (pas de coût GPU). Couleurs : base.css §3 (.stage__world[data-w]).

   API :
     initWorlds()            → crée les calques et observe les sections
     setWorld(nom)           → force un monde (ex. scène 3D qui change d'ambiance)
     getWorld()              → monde actif
     onWorldChange(cb)       → cb(nom, ancien) ; renvoie une fonction de désabonnement
   html[data-world-active] reflète le monde actif (crochet CSS non critique).
   ========================================================================== */

import { prefs } from './motion.js';
import { $, $$ } from './utils.js';

const layers = new Map();
const listeners = new Set();
let current = null;
let stage = null;
let z = 1;
let hideTimer = 0;

function makeLayer(name) {
  const d = document.createElement('div');
  d.className = 'stage__world';
  d.dataset.w = name;
  d.innerHTML = '<i class="stage__blob stage__blob--1"></i><i class="stage__blob stage__blob--2"></i><i class="stage__blob stage__blob--3"></i>';
  return d;
}

export function setWorld(name, { immediate = false } = {}) {
  if (!stage || !name || name === current) return;
  let next = layers.get(name);
  if (!next) {
    next = makeLayer(name);
    stage.insertBefore(next, $('.stage__grain', stage));
    layers.set(name, next);
  }
  const prev = current;
  current = name;
  document.documentElement.dataset.worldActive = name;
  next.style.zIndex = String(++z);
  next.classList.add('is-visible');
  if (immediate) {
    next.classList.add('is-on');
  } else {
    next.classList.remove('is-on');
    // Deux frames : display:block appliqué avant la transition d'opacité
    requestAnimationFrame(() => requestAnimationFrame(() => { if (current === name) next.classList.add('is-on'); }));
  }
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    layers.forEach((l, n) => { if (n !== current) l.classList.remove('is-visible', 'is-on'); });
  }, immediate ? 0 : 1100);
  listeners.forEach((cb) => cb(name, prev));
}

export const getWorld = () => current;

export function onWorldChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function initWorlds() {
  stage = $('[data-stage]');
  if (!stage) return;
  // Calques déjà présents dans le HTML (monde de départ)
  $$('.stage__world', stage).forEach((l) => layers.set(l.dataset.w, l));
  const sections = $$('[data-world]').filter((s) => !s.classList.contains('stage__world'));
  if (!sections.length) return;

  // Monde de départ : celui de la section au centre de l'écran (rechargement en milieu de page)
  const mid = innerHeight / 2;
  const first = sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; }) || sections[0];
  const initial = $('.stage__world.is-on', stage);
  if (initial) { current = initial.dataset.w; z = 1; }
  setWorld(first.dataset.world, { immediate: true });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setWorld(e.target.dataset.world); });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => io.observe(s));
  }

  // Parallaxe douce des nappes au pointeur (souris, hors mouvement réduit)
  if (prefs.finePointer && !prefs.reduced) {
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0;
    const loop = () => {
      x += (tx - x) * 0.04; y += (ty - y) * 0.04;
      stage.style.setProperty('--px', x.toFixed(3));
      stage.style.setProperty('--py', y.toFixed(3));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', (e) => {
      tx = e.clientX / innerWidth - 0.5;
      ty = e.clientY / innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }
}
