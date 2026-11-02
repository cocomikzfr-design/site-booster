// assets/page-transitions.js : transitions entre documents, feuille de papier de secours, écran d'ouverture.
import { isReduced, EASE_IO, EASE } from 'motion-core';

const html = document.documentElement;
const on = () => window.theme && window.theme.anim.transitions && !isReduced() && !window.theme.designMode;
export const vtSupported = () => 'onpagereveal' in window && CSS.supports('view-transition-name: a');

// 1. View Transitions : l'image du lien cliqué devient celle de la fiche (même view-transition-name)
let lastLink = null;
document.addEventListener('click', (e) => { lastLink = e.target.closest('a[href]'); }, true);
window.addEventListener('pageswap', (e) => {
  if (!e.viewTransition) return;
  if (!on()) { e.viewTransition.skipTransition(); return; }
  const url = e.activation && e.activation.entry && e.activation.entry.url;
  if (!url || !lastLink) return;
  const target = new URL(url).pathname;
  // Vitrine : le lien actif ; ailleurs : le lien cliqué (carte produit)
  const link = lastLink.closest('.vitrine') ? lastLink.closest('.vitrine').querySelector('.item.is-active') || lastLink : lastLink;
  if (new URL(link.href).pathname !== target) return;
  const media = link.querySelector('[data-vt-media]') || link.closest('.card')?.querySelector('[data-vt-media]');
  if (media) media.style.viewTransitionName = 'vt-product-media';
});

// 2. Secours sans View Transitions : une feuille de papier sort du rectangle du produit puis on navigue
export function sheetTo(url, rect) {
  const s = document.getElementById('sheet-transition');
  if (!s || !on() || vtSupported()) { location.href = url; return; }
  const W = innerWidth, H = innerHeight;
  const from = `inset(${rect.top}px ${W - rect.right}px ${H - rect.bottom}px ${rect.left}px round 6px)`;
  s.style.visibility = 'visible';
  s.animate([
    { clipPath: from, transform: 'rotate(-2.5deg)' },
    { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' }
  ], { duration: 900, easing: EASE_IO, fill: 'forwards' }).finished.then(() => { location.href = url; });
}
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  const s = document.getElementById('sheet-transition');
  if (s) { s.getAnimations().forEach((a) => a.cancel()); s.style.visibility = 'hidden'; }
});

// 3. Écran d'ouverture : cadran qui tourne de 90°, puis deux moitiés qui s'écartent (≤ 1,2 s, sautable)
function opening() {
  window.__opening = 1;
  if (!html.classList.contains('is-opening')) return;
  try { sessionStorage.setItem('galerie:opened', '1'); } catch (e) { /* stockage indisponible */ }
  const el = document.querySelector('.opening');
  if (!el) { html.classList.remove('is-opening'); return; }
  const [top, bottom] = el.querySelectorAll('.opening__half');
  const dials = el.querySelectorAll('.opening__dial');
  const anims = [];
  dials.forEach((d) => anims.push(d.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }], { duration: 450, easing: EASE, fill: 'forwards' })));
  const open = { duration: 650, delay: 450, easing: EASE_IO, fill: 'forwards' };
  anims.push(top.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }], open));
  anims.push(bottom.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(101%)' }], open));
  const reveal = setTimeout(() => document.dispatchEvent(new Event('opening:reveal')), 420);
  const skip = () => { clearTimeout(reveal); document.dispatchEvent(new Event('opening:reveal')); anims.forEach((a) => a.finish()); };
  el.addEventListener('pointerdown', skip, { once: true });
  window.addEventListener('keydown', skip, { once: true });
  Promise.all(anims.map((a) => a.finished)).then(() => {
    html.classList.remove('is-opening');
    window.removeEventListener('keydown', skip);
    document.dispatchEvent(new Event('opening:done'));
  });
}
opening();
