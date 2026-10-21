/* ==========================================================================
   Défilement : Lenis (souris uniquement) + GSAP ScrollTrigger
   --------------------------------------------------------------------------
   - Lenis lisse la molette ; au tactile, le défilement natif est conservé.
   - Mouvement réduit ou Lenis absent : défilement natif, rien ne casse.
   - ScrollTrigger est synchronisé sur Lenis (un seul ticker : gsap.ticker).
   API :
     initScroll()            → lance le tout (appelé une fois par main.js)
     scrollTo(cible, opts)   → cible = nombre | sélecteur | élément ; opts.immediate, opts.offset
     lockScroll() / unlockScroll()   → pour les tiroirs et la recherche
     onScroll(cb)            → cb({ y, velocity, direction, progress }) à chaque frame de défilement
     getScroll()             → dernier état connu
     refreshScroll()         → ScrollTrigger.refresh() regroupé (debounce)
     getLenis()              → instance Lenis ou null
   ========================================================================== */

import { gsap, ScrollTrigger, Lenis } from './libs.js';
import { prefs } from './motion.js';
import { debounce } from './utils.js';

let lenis = null;
const listeners = new Set();
const state = { y: 0, velocity: 0, direction: 0, progress: 0 };
let locks = 0;

function headerOffset() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
  return -((parseFloat(v) || 76) + 16);
}

function publish(y, velocity, direction) {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  state.y = y;
  state.velocity = velocity;
  state.direction = direction;
  state.progress = Math.min(1, Math.max(0, y / max));
  listeners.forEach((cb) => cb(state));
}

export function initScroll() {
  const root = document.documentElement;
  if (Lenis && !prefs.reduced && prefs.finePointer) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1, touchMultiplier: 1 });
    lenis.on('scroll', (e) => {
      if (ScrollTrigger) ScrollTrigger.update();
      publish(e.scroll, e.velocity, e.direction);
    });
    if (gsap) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    root.classList.add('smooth-scroll'); // (pas « has-lenis » : Lenis retire toute classe contenant « lenis »)
  } else {
    // Défilement natif : vitesse calculée à la main
    let lastY = scrollY, lastT = performance.now(), ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const now = performance.now();
        const y = scrollY;
        const v = ((y - lastY) / Math.max(1, now - lastT)) * 16.7;
        publish(y, v, Math.sign(y - lastY));
        lastY = y; lastT = now; ticking = false;
      });
    }, { passive: true });
  }

  // Ancres internes : défilement doux avec décalage du header + focus accessible
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    scrollTo(target);
    history.pushState(null, '', `#${id}`);
    focusTarget(target);
  });

  addEventListener('load', () => refreshScroll());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => refreshScroll());
  return lenis;
}

/** Donne le focus à la cible d'une ancre sans faire sauter la page. */
function focusTarget(el) {
  const focusable = el.matches('a, button, input, select, textarea, [tabindex]');
  if (!focusable) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

export function scrollTo(target, { immediate = false, offset } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  const off = offset ?? (typeof target === 'number' ? 0 : headerOffset());
  const instant = immediate || prefs.reduced;
  if (lenis) {
    lenis.scrollTo(el ?? target, { offset: off, immediate: instant, duration: instant ? 0 : 1.2, force: true });
    return;
  }
  const y = typeof target === 'number' ? target : el ? el.getBoundingClientRect().top + scrollY + off : 0;
  window.scrollTo({ top: Math.max(0, y), behavior: instant ? 'auto' : 'smooth' });
}

export function lockScroll() {
  locks++;
  if (locks > 1) return;
  const sbw = innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-w', `${sbw}px`);
  document.documentElement.classList.add('is-locked');
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = sbw ? `${sbw}px` : '';
  lenis?.stop();
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks) return;
  document.documentElement.classList.remove('is-locked');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  lenis?.start();
}

export function onScroll(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const getScroll = () => state;
export const getLenis = () => lenis;

export const refreshScroll = debounce(() => { if (ScrollTrigger) ScrollTrigger.refresh(); }, 120);
