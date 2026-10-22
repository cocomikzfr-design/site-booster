/* ==========================================================================
   Confiance + footer : icônes qui se dessinent, newsletter, mot-symbole cinétique,
   bouton « retour en haut »
   --------------------------------------------------------------------------
   - Engagements : les traits des icônes se dessinent à l'apparition (CSS, piloté par
     la classe .is-in du système d'apparitions du socle → fail-safes inclus).
   - Newsletter (démo) : validation, message annoncé, secousse en cas d'erreur,
     bouton qui se transforme en coche en cas de succès.
   - Mot-symbole géant : une lettre par <span> ; à la souris, les lettres proches du
     pointeur se soulèvent et s'inclinent (transform uniquement, boucle rAF qui
     s'arrête d'elle-même). Le dégradé holo reste continu sur tout le mot.
   - Retour en haut : défilement doux (core/scroll.js) puis focus sur le logo.
   ========================================================================== */

import { prefs } from '../../core/motion.js';
import { $, $$, onVisible, debounce } from '../../core/utils.js';
import { toast } from '../../core/ui.js';
import { scrollTo } from '../../core/scroll.js';
import { play, EASE_OUT } from './kit.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function initNewsletter() {
  const form = $('[data-newsletter][data-render-custom]');
  if (!form) return;
  const input = $('input[type="email"]', form);
  const msg = $('.newsletter__msg', form);
  const field = $('.newsletter__field', form);
  const btn = $('.newsletter__btn', form);
  let doneT = 0;

  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true' && EMAIL.test(input.value.trim())) {
      input.setAttribute('aria-invalid', 'false');
      form.classList.remove('is-error');
      msg.textContent = '';
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = EMAIL.test(input.value.trim());
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    form.classList.toggle('is-error', !ok);
    if (!ok) {
      msg.textContent = input.value.trim()
        ? 'Adresse e-mail invalide : vérifiez-la (par exemple nom@domaine.be).'
        : 'Indiquez votre adresse e-mail pour vous inscrire.';
      play(field, [
        { transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(-8px,0,0)' }, { transform: 'translate3d(7px,0,0)' },
        { transform: 'translate3d(-4px,0,0)' }, { transform: 'translate3d(2px,0,0)' }, { transform: 'translate3d(0,0,0)' },
      ], { duration: 420, easing: 'ease-out' });
      input.focus();
      return;
    }
    msg.textContent = 'Merci ! Vous recevrez nos prochaines infos (sorties, précommandes, tournois).';
    form.classList.add('is-done');
    btn.setAttribute('aria-label', 'Inscription enregistrée');
    form.reset();
    toast('Inscription à la newsletter enregistrée.');
    clearTimeout(doneT);
    doneT = setTimeout(() => { form.classList.remove('is-done'); btn.removeAttribute('aria-label'); }, 3200);
  });
}

/* --- Mot-symbole géant --- */
function initWordmark() {
  const wrap = $('[data-footer-mark]');
  const word = wrap && $('[data-wordmark]', wrap);
  if (!word || word.dataset.split) return;
  word.dataset.split = '1';
  const text = word.textContent.trim();
  word.textContent = '';
  const chars = [...text].map((ch, i) => {
    const s = document.createElement('span');
    s.className = 'wm__c';
    s.style.setProperty('--i', i);
    s.textContent = ch;
    word.appendChild(s);
    return s;
  });
  word.classList.add('is-split');

  // Dégradé continu : chaque lettre reçoit la largeur du mot et son propre décalage
  const layout = () => {
    const wr = word.getBoundingClientRect();
    if (!wr.width) return;
    word.style.setProperty('--wm-w', `${wr.width.toFixed(1)}px`);
    chars.forEach((c) => {
      c.style.setProperty('--wm-x', `${(-(c.offsetLeft)).toFixed(1)}px`);
    });
  };
  layout();
  document.fonts?.ready.then(layout);
  addEventListener('resize', debounce(layout, 150));

  if (!prefs.finePointer || prefs.reduced) return;

  // Réaction au pointeur : soulèvement + inclinaison, lissés (transform uniquement)
  const n = chars.length;
  const cur = new Float32Array(n);
  const tgt = new Float32Array(n);
  const rot = new Float32Array(n);
  const rotT = new Float32Array(n);
  let centers = [];
  let fs = 100;
  let raf = 0;
  let inView = false;

  const measure = () => {
    centers = chars.map((c) => c.offsetLeft + c.offsetWidth / 2);
    fs = parseFloat(getComputedStyle(word).fontSize) || 100;
  };
  const loop = () => {
    let moving = false;
    for (let i = 0; i < n; i++) {
      cur[i] += (tgt[i] - cur[i]) * 0.14;
      rot[i] += (rotT[i] - rot[i]) * 0.14;
      if (Math.abs(tgt[i] - cur[i]) > 0.002 || Math.abs(rotT[i] - rot[i]) > 0.01) moving = true;
      const lift = cur[i] * fs * 0.16;
      chars[i].style.transform = `translate3d(0, ${(-lift).toFixed(2)}px, 0) rotate(${rot[i].toFixed(2)}deg) scale(${(1 + cur[i] * 0.05).toFixed(4)})`;
    }
    raf = moving ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  wrap.addEventListener('pointerenter', measure);
  wrap.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !inView) return;
    const r = word.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    // Influence verticale : maximale sur le mot, s'éteint au-dessus / en dessous
    const vy = Math.max(0, 1 - Math.max(0, Math.abs(y - r.height / 2) - r.height / 2) / (r.height * 0.9));
    const sigma = r.width / n * 1.15;
    for (let i = 0; i < n; i++) {
      const dx = x - centers[i];
      const g = Math.exp(-(dx * dx) / (2 * sigma * sigma)) * vy;
      tgt[i] = g;
      rotT[i] = Math.max(-1, Math.min(1, dx / (sigma * 2))) * g * -5;
    }
    kick();
  }, { passive: true });
  wrap.addEventListener('pointerleave', () => { tgt.fill(0); rotT.fill(0); kick(); });
  onVisible(wrap, (v) => { inView = v; if (!v) { tgt.fill(0); rotT.fill(0); kick(); } });
  addEventListener('resize', debounce(measure, 150));
  measure();
}

function initToTop() {
  const btn = $('[data-totop]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    scrollTo(0);
    const logo = $('.header__logo');
    // Le focus revient en haut de page (le header réapparaît au focus)
    setTimeout(() => logo?.focus({ preventScroll: true }), prefs.reduced ? 0 : 900);
  });
  // Anneau de texte décoratif (hors du bouton : le nom accessible reste « Retour en haut de page »)
  const wrap = btn.closest('[data-totop-wrap]') || btn;
  if (wrap !== btn && !$('.footer__totop-ring', wrap)) {
    wrap.insertAdjacentHTML('beforeend', '<svg class="footer__totop-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'
      + '<defs><path id="totop-circle" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0"/></defs>'
      + '<text><textPath href="#totop-circle" textLength="236" lengthAdjust="spacing">Retour en haut · ChocoCards · Retour en haut · ChocoCards · </textPath></text></svg>');
  }
  // L'anneau ne tourne que lorsqu'il est visible
  onVisible(wrap, (v) => wrap.classList.toggle('is-live', v));
}

/* Icônes des engagements, en traits « dessinables » (pathLength = 1).
   Le HTML porte les icônes du sprite (#i-truck…) : elles restent en place sans JavaScript. */
const TICONS = {
  truck: '<g class="ticon__speed"><path pathLength="1" d="M1 18h-4M2 24h-7M1 30h-4"/></g><g class="ticon__body"><path pathLength="1" d="M4 14h24v18H4z"/><path pathLength="1" d="M28 20h8l6 6v6H28z"/><circle class="ticon__wheel" pathLength="1" cx="12" cy="34" r="4"/><circle class="ticon__wheel" pathLength="1" cx="35" cy="34" r="4"/></g>',
  shield: '<path pathLength="1" d="M24 4 8 10v12c0 10 7 18 16 22 9-4 16-12 16-22V10L24 4Z"/><path class="ticon__check" pathLength="1" d="m16 24 6 6 11-12"/>',
  lock: '<path class="ticon__shackle" pathLength="1" d="M15 21v-6a9 9 0 0 1 18 0v6"/><rect pathLength="1" x="10" y="21" width="28" height="21" rx="5"/><circle class="ticon__dot" cx="24" cy="31" r="2.6"/>',
  shop: '<path class="ticon__awning" pathLength="1" d="M6 18 9 8h30l3 10a5 5 0 0 1-9 2 5 5 0 0 1-9 0 5 5 0 0 1-9 0 5 5 0 0 1-9-2Z"/><path pathLength="1" d="M9 22v18h30V22M20 40v-9h8v9"/>',
  chat: '<path pathLength="1" d="M8 10h32v22H22l-8 7v-7H8z"/><circle class="ticon__dot" cx="17" cy="21" r="2.2"/><circle class="ticon__dot" cx="24" cy="21" r="2.2"/><circle class="ticon__dot" cx="31" cy="21" r="2.2"/>',
};

/** Engagements : icônes dessinables, numéros, brillance au survol (transform). */
function initTrust() {
  const grid = $('#confiance .trust__grid');
  if (!grid) return;
  const cards = $$('.trust__card', grid);
  cards.forEach((card, i) => {
    const ic = $('.trust__icon[data-ticon]', card);
    const paths = ic && TICONS[ic.dataset.ticon];
    if (paths) ic.innerHTML = `<svg class="ticon ticon--${ic.dataset.ticon}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${paths}</svg>`;
    if (!$('.trust__index', card)) {
      card.insertAdjacentHTML('afterbegin', `<span class="trust__sheen" aria-hidden="true"></span><span class="trust__index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>`);
    }
  });
  if (prefs.reduced) return;
  cards.forEach((card) => {
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      const sheen = $('.trust__sheen', card);
      play(sheen, [{ transform: 'translate3d(-120%, 0, 0) skewX(-18deg)' }, { transform: 'translate3d(260%, 0, 0) skewX(-18deg)' }], { duration: 900, easing: EASE_OUT });
    });
  });
}

export function initFooter() {
  initNewsletter();
  initWordmark();
  initToTop();
  initTrust();
}
