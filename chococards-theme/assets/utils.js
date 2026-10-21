/* ==========================================================================
   ChocoCards — utils.js
   Petites fonctions partagées par tous les modules du thème.
   Importé via la carte d'import : import { … } from '@theme/utils';
   ========================================================================== */

export const theme = window.ChocoTheme || { routes: {}, settings: {}, assets: {}, strings: {} };
export const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isDesignMode = Boolean(window.Shopify && window.Shopify.designMode);

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function debounce(fn, ms = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* Charge un script classique une seule fois (GSAP, Lenis…) */
const loadedScripts = new Map();
export function loadScript(src) {
  if (!src) return Promise.reject(new Error('Script introuvable'));
  if (!loadedScripts.has(src)) {
    loadedScripts.set(src, new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Impossible de charger ${src}`));
      document.head.appendChild(s);
    }));
  }
  return loadedScripts.get(src);
}

/* GSAP + ScrollTrigger, chargés uniquement par les sections qui en ont besoin */
export async function loadGsap() {
  if (!window.gsap || !window.ScrollTrigger) {
    await loadScript(theme.assets.gsap);
    await loadScript(theme.assets.scrollTrigger);
  }
  const { gsap, ScrollTrigger } = window;
  if (!loadGsap.ready) {
    gsap.registerPlugin(ScrollTrigger);
    // Synchronise ScrollTrigger avec le scroll fluide Lenis s'il est actif
    if (theme.lenis) theme.lenis.on('scroll', ScrollTrigger.update);
    window.addEventListener('load', () => ScrollTrigger.refresh());
    loadGsap.ready = true;
  }
  return gsap;
}

/* Notification en bas de l'écran */
export function toast(html, ms = 3600) {
  const el = document.querySelector('[data-toast]');
  if (!el) return;
  el.innerHTML = html;
  el.classList.add('is-visible');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('is-visible'), ms);
}

export const icon = (name) => `<svg aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`;

/* Blocage du scroll quand un tiroir est ouvert */
let locks = 0;
export function lockScroll() {
  locks += 1;
  if (locks === 1) {
    theme.lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
  }
}
export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    theme.lenis?.start();
    document.documentElement.style.overflow = '';
  }
}

export function focusables(container) {
  return $$('a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/* Garde le focus clavier dans un tiroir / une fenêtre */
export function trapFocus(container, event) {
  if (event.key !== 'Tab') return;
  const items = focusables(container);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

/* Extrait le contenu d'une section renvoyée par la Section Rendering API */
export function sectionInnerHTML(html, selector = '.shopify-section') {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const node = doc.querySelector(selector);
  return node ? node.innerHTML : html;
}

/* Défilement vers un élément (compatible Lenis) */
export function scrollToElement(target) {
  const offset = (document.querySelector('[data-header]')?.offsetHeight || 0) + 8;
  if (theme.lenis) theme.lenis.scrollTo(target, { offset: -offset, duration: 1.3 });
  else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: motionOK ? 'smooth' : 'auto' });
}

/* Format monétaire Shopify (ex. "{{amount_with_comma_separator}} €") */
export function formatMoney(cents, format = theme.moneyFormat || '{{amount_with_comma_separator}} €') {
  const value = Number(cents) / 100;
  const withSep = (n, dec, thousands, decimal) => {
    const [int, frac] = n.toFixed(dec).split('.');
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (frac ? decimal + frac : '');
  };
  return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
    switch (key) {
      case 'amount': return withSep(value, 2, ',', '.');
      case 'amount_no_decimals': return withSep(value, 0, ',', '.');
      case 'amount_no_decimals_with_comma_separator': return withSep(value, 0, '.', ',');
      case 'amount_with_apostrophe_separator': return withSep(value, 2, "'", '.');
      case 'amount_with_comma_separator':
      default: return withSep(value, 2, '.', ',');
    }
  });
}
