/* ==========================================================================
   Hero · mot-symbole « ChocoCards » découpé en lettres (typographie cinétique)
   --------------------------------------------------------------------------
   splitWordmark(el) : chaque lettre devient un <span> qui porte le MÊME
   dégradé holo que le mot entier, décalé de sa position (variables en em :
   --wm-bg = 2 × largeur du mot, --wm-x = -position de la lettre). Le dégradé
   reste donc continu d'une lettre à l'autre, quelle que soit la taille.
   Accessibilité : texte complet dans un .sr-only, lettres en aria-hidden
   (le nom du titre reste « Bienvenue chez ChocoCards »).

   initKinetic(…) (souris, hors mouvement réduit) :
   - survol : les lettres proches du pointeur se soulèvent (vague) ;
   - défilement (desktop) : les lettres s'écartent, le mot remonte puis les
     lettres s'envolent et se dissolvent en vague pendant la sortie du hero
     (transform + opacité ; au repos tout est net et opaque).
   ========================================================================== */

import { prefs } from '../../core/motion.js';
import { onScroll } from '../../core/scroll.js';
import { clamp, debounce } from '../../core/utils.js';

export function splitWordmark(wm) {
  if (!wm || wm.classList.contains('is-split')) return null;
  const text = wm.textContent.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  const box = document.createElement('span');
  box.className = 'hero__chars';
  box.setAttribute('aria-hidden', 'true');
  const chars = [...text].map((ch) => {
    const s = document.createElement('span');
    s.className = 'hero__char';
    s.textContent = ch;
    box.appendChild(s);
    return s;
  });
  wm.replaceChildren(sr, box);
  wm.classList.add('is-split');

  const rel = []; // centre de chaque lettre (px) depuis le bord gauche du mot
  const measure = () => {
    const fs = parseFloat(getComputedStyle(wm).fontSize) || 1;
    const W = box.offsetWidth;
    if (!W) return;
    box.style.setProperty('--wm-bg', `${((2 * W) / fs).toFixed(4)}em`);
    chars.forEach((c, i) => {
      // .hero__chars est positionné (CSS) : c'est le parent de décalage des lettres.
      // Repli si ce n'est pas le cas (CSS absente) : on retranche la position de la boîte.
      const left = c.offsetParent === box ? c.offsetLeft : c.offsetLeft - box.offsetLeft;
      c.style.setProperty('--wm-x', `${(-left / fs).toFixed(4)}em`);
      rel[i] = left + c.offsetWidth / 2;
    });
  };
  measure();
  document.fonts?.ready?.then(measure);
  addEventListener('resize', debounce(measure, 150));
  return { chars, box, rel, measure };
}

export async function initKinetic({ section, split }, { gsap, full }) {
  if (!gsap || !split || prefs.reduced || !prefs.finePointer) return;
  const { chars, box, rel } = split;
  // GSAP lit translate / rotate en cours d'animation : on attend la fin de l'entrée des lettres
  const running = chars.flatMap((c) => c.getAnimations?.() || []);
  if (running.length) await Promise.allSettled(running.map((a) => a.finished));
  const n = chars.length;

  // Vague au survol
  const setY = chars.map((c) => gsap.quickTo(c, 'y', { duration: 0.7, ease: 'power3.out' }));
  const setS = chars.map((c) => gsap.quickTo(c, 'scaleY', { duration: 0.7, ease: 'power3.out' }));
  let lifted = false;
  const relax = () => {
    if (!lifted) return;
    lifted = false;
    chars.forEach((_, i) => { setY[i](0); setS[i](1); });
  };
  section.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = box.getBoundingClientRect();
    const fs = r.height || 1;
    const near = e.clientY > r.top - fs * 0.9 && e.clientY < r.bottom + fs * 0.35;
    if (!near) { relax(); return; }
    lifted = true;
    for (let i = 0; i < n; i++) {
      const d = (e.clientX - (r.left + rel[i])) / (fs * 0.95);
      const f = Math.exp(-d * d);
      setY[i](-f * fs * 0.1);
      setS[i](1 + f * 0.07);
    }
  }, { passive: true });
  section.addEventListener('pointerleave', relax);

  // Écartement au défilement (desktop, scène pleine fenêtre uniquement)
  if (!full) return;
  const setX = chars.map((c) => gsap.quickSetter(c, 'x', 'px'));
  const setYP = chars.map((c) => gsap.quickSetter(c, 'yPercent'));
  const setO = chars.map((c) => gsap.quickSetter(c, 'opacity'));
  const setBox = gsap.quickSetter(box, 'y', 'px');
  const fade = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let end = 1;
  let bh = 100;
  const measureEnd = () => {
    end = Math.max(1, section.offsetTop + section.offsetHeight);
    bh = box.offsetHeight || 100;
    lastE = -1;
  };
  let lastE = -1;
  measureEnd();
  addEventListener('resize', debounce(() => { measureEnd(); apply(scrollY); }, 150));
  const apply = (y) => {
    const e = clamp(y / end, 0, 1);
    if (Math.abs(e - lastE) < 0.0005) return;
    lastE = e;
    const k = e * e * (3 - 2 * e); // lissage doux
    const spread = bh * 0.12 * k;
    for (let i = 0; i < n; i++) {
      // Vague de gauche à droite : chaque lettre s'envole et se dissout (la carte « 30 ans »
      // qui se retourne derrière apparaît ainsi dégagée avant que la feuille suivante la recouvre)
      const f = fade(0.2 + i * 0.024, 0.34 + i * 0.024, e);
      setX[i]((i - (n - 1) / 2) * spread);
      setYP[i](-f * 70);
      setO[i](1 - f);
    }
    setBox(-k * bh * 0.28);
  };
  onScroll(({ y }) => apply(y));
  apply(scrollY);
}
