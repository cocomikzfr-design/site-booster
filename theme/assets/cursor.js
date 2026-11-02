// assets/cursor.js : curseur sur mesure (pointeur fin uniquement). Anneau + point + libellé « VOIR ».
// États : is-item, is-link, is-view, is-drag, is-text. Couleur ivoire sur la salle, encre sur le catalogue.
import { subscribe, damp, isReduced } from 'motion-core';

const html = document.documentElement;
const el = document.querySelector('.cursor');
if (el && matchMedia('(pointer: fine)').matches && window.theme.anim.cursor && !isReduced()) init();

function init() {
  const pos = el.querySelector('.cursor__pos');
  const text = el.querySelector('[data-cursor-text]');
  const defLabel = text.textContent;
  const magnetic = window.theme.anim.magnetic;
  let x = -100, y = -100, cx = x, cy = y, running = false, state = '', lastWorld = 0;
  let mag = null; let magX = 0, magY = 0;

  function stateFor(t) {
    if (html.classList.contains('is-dragging')) return 'drag';
    if (!t || !t.closest) return '';
    const c = t.closest('[data-cursor]');
    if (c) { text.textContent = c.dataset.cursorLabel || defLabel; return c.dataset.cursor; }
    if (t.closest('input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select, [contenteditable]')) return 'text';
    if (t.closest('a, button, label, summary, [role=button]')) return 'link';
    return '';
  }
  function setState(s) {
    if (s === state) return;
    if (state) el.classList.remove(`is-${state}`);
    if (s) el.classList.add(`is-${s}`);
    if (s === 'drag') text.textContent = '← →';
    state = s;
  }
  function tick(dt, t) {
    let tx = x, ty = y;
    // Bouton aimanté : le curseur est attiré vers le centre (35 %), l'élément vers le curseur (18 %)
    if (mag) {
      const r = mag.getBoundingClientRect(); const mx = r.left + r.width / 2, my = r.top + r.height / 2;
      tx = x + (mx - x) * 0.35; ty = y + (my - y) * 0.35;
      magX = damp(magX, (x - mx) * 0.18, 10, dt); magY = damp(magY, (y - my) * 0.18, 10, dt);
      mag.style.transform = `translate(${magX.toFixed(2)}px, ${magY.toFixed(2)}px)`;
    }
    cx = damp(cx, tx, 16, dt); cy = damp(cy, ty, 16, dt);
    pos.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    // Couleur selon la zone sous le pointeur (toutes les 120 ms)
    if (t - lastWorld > 0.12) {
      lastWorld = t;
      const under = document.elementFromPoint(x, y);
      el.classList.toggle('is-light', !!(under && under.closest('.world-dark, .is-dark')));
    }
    const still = Math.abs(cx - tx) < 0.1 && Math.abs(cy - ty) < 0.1 && !mag;
    if (still) { running = false; return false; }
  }
  function wake() { if (!running) { running = true; subscribe(tick); } }

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!html.classList.contains('has-cursor')) { html.classList.add('has-cursor'); cx = x; cy = y; }
    setState(stateFor(e.target));
    wake();
  }, { passive: true });
  document.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') setState(stateFor(e.target)); });
  document.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') setState(stateFor(e.target)); });
  document.addEventListener('mouseleave', () => { html.classList.remove('has-cursor'); });
  document.addEventListener('cursor:refresh', () => setState(stateFor(document.elementFromPoint(x, y))));

  if (magnetic) {
    document.addEventListener('pointerover', (e) => {
      const m = e.target.closest && e.target.closest('[data-magnetic]');
      if (m && m !== mag) { release(); mag = m; wake(); }
    });
    document.addEventListener('pointerout', (e) => {
      if (mag && !mag.contains(e.relatedTarget)) release();
    });
  }
  function release() {
    if (!mag) return;
    const m = mag; mag = null; magX = magY = 0;
    m.animate([{ transform: m.style.transform || 'none' }, { transform: 'translate(0, 0)' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    m.style.transform = '';
  }
}
