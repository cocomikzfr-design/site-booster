/* ==========================================================================
   Découpe de texte (lignes / mots / lettres)
   --------------------------------------------------------------------------
   Utilise GSAP SplitText 3.13 quand il est là (masques de lignes, aria
   automatique), sinon un repli maison (mots + lettres, sans lignes).
   Accessibilité : sur un titre (h1–h6) → aria-label sur le titre ; ailleurs
   (p, span… où aria-label est interdit) → copie .sr-only + morceaux aria-hidden.

   const s = splitText(el, { type: 'lines' | 'words' | 'chars' | 'lines,words', mask: true });
   s.lines / s.words / s.chars : tableaux d'éléments ; s.revert() rend le HTML d'origine.
   ========================================================================== */

import { SplitText } from './libs.js';

const canLabel = (el) => /^H[1-6]$/.test(el.tagName) || el.hasAttribute('role');

export function splitText(el, { type = 'lines', mask = true, linesClass = 'split-line', wordsClass = 'split-word', charsClass = 'split-char' } = {}) {
  if (!el) return { lines: [], words: [], chars: [], revert() {} };
  const labelled = canLabel(el);
  if (SplitText) {
    const maskType = mask ? (type.includes('lines') ? 'lines' : type.includes('words') ? 'words' : 'chars') : undefined;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const s = SplitText.create(el, {
      type,
      mask: maskType,
      linesClass,
      wordsClass,
      charsClass,
      aria: labelled ? 'auto' : 'none',
      autoSplit: false,
      propIndex: true,
    });
    // Le masque reçoit la classe split-mask (overflow: clip, voir base.css)
    (s.masks || []).forEach((m) => m.classList.add('split-mask'));
    let sr = null;
    if (!labelled && type.includes('chars')) sr = hideForScreenReaders(el, text);
    return {
      lines: s.lines || [], words: s.words || [], chars: s.chars || [],
      revert: () => { sr?.remove(); s.revert(); },
      native: s,
    };
  }
  return fallbackSplit(el, type, { wordsClass, charsClass, labelled });
}

/** Lettres découpées hors titre : copie lisible .sr-only, morceaux cachés aux lecteurs d'écran. */
function hideForScreenReaders(el, text) {
  [...el.children].forEach((c) => c.setAttribute('aria-hidden', 'true'));
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  el.prepend(sr);
  return sr;
}

/** Repli sans SplitText : découpe en mots (et lettres) en gardant les balises internes. */
function fallbackSplit(el, type, { wordsClass, charsClass, labelled }) {
  const original = el.innerHTML;
  const label = el.textContent.replace(/\s+/g, ' ').trim();
  const words = [];
  const chars = [];
  const wantChars = type.includes('chars');
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span');
          w.className = wordsClass;
          w.style.display = 'inline-block';
          if (wantChars) {
            [...part].forEach((ch) => {
              const c = document.createElement('span');
              c.className = charsClass;
              c.style.display = 'inline-block';
              c.textContent = ch;
              w.appendChild(c);
              chars.push(c);
            });
          } else {
            w.textContent = part;
          }
          words.push(w);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) {
        walk(child);
      }
    });
  };
  walk(el);
  if (wantChars) {
    if (labelled) { el.setAttribute('aria-label', label); words.forEach((w) => w.setAttribute('aria-hidden', 'true')); }
    else hideForScreenReaders(el, label);
  }
  return {
    lines: [],
    words,
    chars,
    revert() { el.innerHTML = original; if (wantChars && labelled) el.removeAttribute('aria-label'); },
  };
}
