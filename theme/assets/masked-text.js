// assets/masked-text.js : textes qui glissent dans un masque (légende, compteurs, totaux).
import { isReduced, EASE } from 'motion-core';

// Remplace le texte de el (.mask) : le nouveau arrive de dir × 105 %, l'ancien part à −dir × 105 %.
export function swapMaskedText(el, text, dir = 1, delay = 0) {
  if (!el) return;
  const cur = el.lastElementChild;
  if (cur && cur.textContent === String(text)) return;
  if (isReduced() || !cur) { el.innerHTML = ''; const s = document.createElement('span'); s.textContent = text; el.append(s); return; }
  const next = document.createElement('span');
  next.textContent = text; next.style.position = 'absolute'; next.style.inset = '0';
  next.style.transform = `translateY(${dir * 105}%)`;
  el.append(next);
  const opts = { duration: 650, easing: EASE, delay, fill: 'both' };
  cur.animate([{ transform: 'none' }, { transform: `translateY(${-dir * 105}%)` }], opts).finished
    .then(() => { cur.remove(); settle(el); }).catch(() => {});
  next.animate([{ transform: `translateY(${dir * 105}%)` }, { transform: 'none' }], opts).finished
    .then((a) => { next.style.transform = ''; a.cancel(); settle(el); }).catch(() => {});
}

// Le dernier survivant repasse en position statique (il redonne sa hauteur au masque)
function settle(el) {
  if (el.children.length !== 1) return;
  const s = el.firstElementChild;
  s.style.position = ''; s.style.inset = ''; s.style.transform = '';
}

// Fait monter des lignes (.line > span) une par une
export function revealLines(lines, { baseDelay = 0, step = 75, duration = 900 } = {}) {
  if (isReduced()) return Promise.resolve();
  const anims = [...lines].map((line, i) => {
    const s = line.firstElementChild || line;
    return s.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }],
      { duration, easing: EASE, delay: baseDelay + i * step, fill: 'backwards' }).finished;
  });
  return Promise.all(anims).catch(() => {});
}

// Découpe un titre en lignes masquées selon son rendu réel (après chargement des polices)
export function splitLines(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${w.replace(/</g, '&lt;')}</span>`).join(' ');
  const groups = []; let top = null;
  el.querySelectorAll('.w').forEach((w) => {
    if (w.offsetTop !== top) { groups.push([]); top = w.offsetTop; }
    groups[groups.length - 1].push(w.textContent);
  });
  el.innerHTML = groups.map((g, i) => `<span class="line" style="--i:${i}"><span>${g.join(' ')}</span></span>`).join('');
  return el.querySelectorAll('.line');
}
