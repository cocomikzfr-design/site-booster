/* ==========================================================================
   Booster · compte à rebours « compteur mécanique »
   --------------------------------------------------------------------------
   Reprend le compte à rebours de base (render.js) sans attribut à ajouter :
   on retire data-unit des valeurs, render.js ne les touche donc plus, et
   chaque chiffre devient un rouleau (0 → 9) qui glisse vers le bas quand il
   change (transform uniquement). Si ce module échoue, le compte à rebours de
   base continue de tourner : rien n'est perdu.
   Sobriété : la conversion n'a lieu qu'à l'approche de la section, et les
   rouleaux ne tournent que lorsqu'elle est à l'écran (aucune écriture DOM
   sinon). Aucune lecture de mise en page forcée (pas d'offsetHeight).
   Accessibilité : les rouleaux sont aria-hidden ; un texte masqué (.sr-only)
   porte la valeur lue (role="timer" n'annonce pas chaque seconde).
   Mouvement réduit : les transitions sont coupées par le socle (saut direct).
   ========================================================================== */

import { timeLeft } from '../../core/format.js';

const UNITS = ['days', 'hours', 'minutes', 'seconds'];

/** Exécute fn après le prochain rendu (2 images) : réactive une transition sans forcer la mise en page. */
const afterPaint = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

/** Construit un rouleau : [9] 0 1 2 … 9 (le 9 du haut sert au passage 0 → 9). */
function reel() {
  const col = document.createElement('span');
  col.className = 'odo__col';
  const strip = document.createElement('span');
  strip.className = 'odo__strip';
  strip.innerHTML = ['9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => `<span>${d}</span>`).join('');
  col.appendChild(strip);
  return { col, strip, digit: null, token: 0 };
}

/** Place le rouleau sur un chiffre ; animate = false pour un placement sec. */
function setDigit(r, d, animate) {
  if (r.digit === d) return;
  const prev = r.digit;
  r.digit = d;
  const token = ++r.token;
  // Passage 0 → 9 (le compte descend) : on glisse vers le « 9 » du haut, puis on recale
  const wrap = animate && prev === 0 && d === 9;
  if (!animate) {
    r.strip.style.transition = 'none';
    r.strip.style.setProperty('--i', String(d + 1));
    afterPaint(() => { if (r.token === token) r.strip.style.transition = ''; });
    return;
  }
  r.strip.style.transition = '';
  r.strip.style.setProperty('--i', String(wrap ? 0 : d + 1));
  if (wrap) {
    setTimeout(() => {
      if (r.token !== token) return;
      r.strip.style.transition = 'none';
      r.strip.style.setProperty('--i', '10'); // même chiffre « 9 », en bas du rouleau
      afterPaint(() => { if (r.token === token) r.strip.style.transition = ''; });
    }, 760);
  }
}

/**
 * Prend en charge le compte à rebours de la section (si présent).
 * Renvoie une fonction d'arrêt.
 */
export function initCountdown(section) {
  const el = section?.querySelector('[data-countdown]');
  if (!el || !('IntersectionObserver' in window)) return () => {};
  const iso = el.dataset.countdown;
  const over = section.querySelector('[data-countdown-over]');
  const units = {};
  let built = false;
  let timer = 0;
  let visible = false;
  let first = true;

  const build = () => {
    built = true;
    UNITS.forEach((u) => {
      const node = el.querySelector(`[data-unit="${u}"]`);
      if (!node) return;
      node.removeAttribute('data-unit'); // render.js n'y touche plus
      node.classList.add('odo');
      node.setAttribute('aria-hidden', 'true');
      node.textContent = '';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      node.parentElement.insertBefore(sr, node);
      units[u] = { node, sr, reels: [] };
    });
    el.classList.add('is-odo');
  };

  const tick = () => {
    const t = timeLeft(iso);
    UNITS.forEach((u) => {
      const unit = units[u];
      if (!unit) return;
      const str = String(t[u]).padStart(2, '0');
      // Nombre de rouleaux = nombre de chiffres (3 pour ≥ 100 jours)
      while (unit.reels.length < str.length) {
        const r = reel();
        unit.node.prepend(r.col);
        unit.reels.unshift(r);
      }
      while (unit.reels.length > str.length) unit.reels.shift().col.remove();
      [...str].forEach((ch, i) => setDigit(unit.reels[i], Number(ch), !first));
      // Le libellé visible (« jours »…) suit : le lecteur d'écran lit « 15 jours »
      const label = String(t[u]);
      if (unit.sr.textContent !== label) unit.sr.textContent = label;
    });
    const isOver = t.total === 0;
    el.classList.toggle('is-over', isOver);
    if (over) over.hidden = !isOver;
    first = false;
    return isOver;
  };

  // Aligné sur la seconde pleine pour que les rouleaux tournent ensemble
  const loop = () => {
    if (!visible || tick()) { timer = 0; return; }
    timer = setTimeout(loop, 1000 - (Date.now() % 1000) + 8);
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    clearTimeout(timer);
    timer = 0;
    if (!visible) return;
    if (!built) build();
    first = true; // retour à l'écran : placement sec, puis rouleaux animés
    loop();
  }, { rootMargin: '200px 0px' });
  io.observe(el);
  return () => { io.disconnect(); clearTimeout(timer); };
}
