/* ==========================================================================
   Étagères produits « L'univers Pokémon » et « One Piece Card Game »
   --------------------------------------------------------------------------
   La piste reste un vrai défileur horizontal (scroll-snap natif) : clavier,
   tactile, boutons ← → (core/ui.js) et lecteurs d'écran fonctionnent sans
   rien de ce fichier. On ajoute :
     - cartes « showcase » (gabarit cards.js) : halo, reflet, tampons d'état
     - glisser à la souris avec inertie, arrêt aligné sur une carte
     - inclinaison (skewX) proportionnelle à la vitesse, ±5° maximum
     - barre de progression + compteur « 03 / 08 »
     - retour visuel de l'ajout au panier (« Ajouté ✓ » pendant 1,2 s)
   Mouvement réduit : pas d'inertie ni d'inclinaison, positions finales.
   ========================================================================== */

import { prefs } from '../../core/motion.js';
import { $, $$, clamp, on } from '../../core/utils.js';
import { produitsDe } from '../../core/format.js';
import { setCursor } from '../../core/cursor.js';
import { showCard } from './cards.js';

const easeOut = (t) => 1 - (1 - t) ** 4;

/** Rend la piste (data-render-custom : render.js nous la laisse) en une fois. */
export function renderTrack(track) {
  if (track.dataset.showRendered) return track.children.length;
  const list = produitsDe(track.dataset.categorie);
  track.innerHTML = list.map((p, i) => showCard(p, i)).join('');
  track.dataset.showRendered = '1';
  return list.length;
}

function initShelf(section) {
  const track = $('[data-shelf]', section);
  if (!track) return;
  const total = renderTrack(track) || track.children.length;
  const thumb = $('[data-shelf-thumb]', section);
  const idxEl = $('[data-shelf-index]', section);
  const totEl = $('[data-shelf-total]', section);
  if (totEl) totEl.textContent = String(total).padStart(2, '0');

  /* ---------- Progression + compteur ----------
     Lectures (géométrie) et écritures (styles) séparées : les lectures se font
     dans le rappel du ResizeObserver ou en début d'image, les écritures ensuite.
     Aucune mise en page forcée, même avec deux étagères. */
  const geo = { ratio: 1, step: 1, max: 1, left: 0 };
  let lastIdx = 1;
  let lastStatic = null;
  const readGeo = () => {
    const cw = track.clientWidth;
    const sw = track.scrollWidth;
    geo.ratio = clamp(cw / Math.max(1, sw), 0.08, 1);
    geo.max = Math.max(1, sw - cw);
    const a = track.children[0];
    const b = track.children[1];
    geo.step = a && b ? b.offsetLeft - a.offsetLeft : cw;
    geo.left = track.scrollLeft;
  };
  const paint = () => {
    const p = clamp(geo.left / geo.max, 0, 1);
    if (thumb) thumb.style.transform = `translate3d(${(p * (1 - geo.ratio) * 100).toFixed(2)}%, 0, 0) scaleX(${geo.ratio.toFixed(4)})`;
    const idx = Math.min(total, Math.round(geo.left / Math.max(1, geo.step)) + 1);
    if (idx !== lastIdx && idxEl) { idxEl.textContent = String(idx).padStart(2, '0'); lastIdx = idx; }
    const isStatic = geo.ratio >= 0.999;
    if (isStatic !== lastStatic) { section.classList.toggle('is-static', isStatic); lastStatic = isStatic; }
  };

  /* ---------- Inclinaison selon la vitesse ---------- */
  const skewOn = !prefs.reduced;
  const skewMax = prefs.finePointer ? 5 : 2.5;
  let skew = 0;
  let skewTarget = 0;
  let lastLeft = null;
  let lastT = 0;
  let raf = 0;
  let lastFrame = 0;
  const frame = (now) => {
    raf = 0;
    geo.left = track.scrollLeft;
    paint();
    if (!skewOn) return;
    // Lissage indépendant de la cadence d'affichage (60 ou 120 Hz)
    const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 1 / 60;
    lastFrame = now;
    skew += (skewTarget - skew) * (1 - Math.exp(-dt * 14));
    skewTarget *= Math.exp(-dt * 12); // retour au repos dès que le mouvement ralentit
    if (Math.abs(skew) < 0.02 && Math.abs(skewTarget) < 0.02) { skew = 0; skewTarget = 0; }
    track.style.setProperty('--skew', `${skew.toFixed(3)}deg`);
    if (skew !== 0) raf = requestAnimationFrame(frame);
    else lastFrame = 0;
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
  track.addEventListener('scroll', () => {
    const now = performance.now();
    const left = track.scrollLeft;
    if (lastLeft !== null && skewOn) {
      const v = ((left - lastLeft) / Math.max(1, now - lastT)) * 16.7; // px / image
      skewTarget = clamp(-v * 0.15, -skewMax, skewMax);
    }
    lastLeft = left; lastT = now;
    wake();
  }, { passive: true });

  /* ---------- Glisser à la souris (inertie + alignement) ---------- */
  let anim = 0;
  const stopAnim = () => { cancelAnimationFrame(anim); anim = 0; };
  const snapPoints = () => {
    const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    const tr = track.getBoundingClientRect();
    return [...track.children].map((li) => track.scrollLeft + li.getBoundingClientRect().left - tr.left - pad);
  };
  const glideTo = (x, { duration } = {}) => {
    stopAnim();
    const max = track.scrollWidth - track.clientWidth;
    const to = clamp(x, 0, max);
    const from = track.scrollLeft;
    const dist = to - from;
    if (Math.abs(dist) < 1 || prefs.reduced) { track.scrollLeft = to; track.classList.remove('is-gliding'); return; }
    const dur = duration ?? clamp(Math.abs(dist) * 1.1, 380, 950);
    const t0 = performance.now();
    track.classList.add('is-gliding');
    const stepFn = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      track.scrollLeft = from + dist * easeOut(t);
      if (t < 1) anim = requestAnimationFrame(stepFn);
      else { anim = 0; track.classList.remove('is-gliding'); }
    };
    anim = requestAnimationFrame(stepFn);
  };

  const drag = { down: false, active: false, x0: 0, left0: 0, lastX: 0, lastT: 0, v: 0, id: 0, moved: false };
  track.addEventListener('dragstart', (e) => e.preventDefault());
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    stopAnim();
    track.classList.remove('is-gliding');
    Object.assign(drag, { down: true, active: false, x0: e.clientX, left0: track.scrollLeft, lastX: e.clientX, lastT: performance.now(), v: 0, id: e.pointerId, moved: false });
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag.down) return;
    const dx = e.clientX - drag.x0;
    if (!drag.active) {
      if (Math.abs(dx) < 6) return;
      drag.active = true;
      drag.moved = true;
      try { track.setPointerCapture(drag.id); } catch { /* déjà relâché */ }
      track.classList.add('is-dragging');
      setCursor('Glisser');
    }
    const now = performance.now();
    const v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT); // px / ms
    drag.v = drag.v * 0.5 + v * 0.5;
    drag.lastX = e.clientX; drag.lastT = now;
    track.scrollLeft = drag.left0 - dx;
  });
  const release = () => {
    if (!drag.down) return;
    drag.down = false;
    if (!drag.active) return;
    drag.active = false;
    track.classList.remove('is-dragging');
    setCursor(null);
    // Inertie projetée (≈ 280 ms de glisse) puis arrêt sur la carte la plus proche
    const idle = performance.now() - drag.lastT > 90; // souris arrêtée avant de relâcher
    const proj = track.scrollLeft - (idle ? 0 : drag.v) * 280;
    const pts = snapPoints();
    const near = pts.reduce((a, b) => (Math.abs(b - proj) < Math.abs(a - proj) ? b : a), pts[0] ?? proj);
    glideTo(near);
  };
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', release);
  // Un glisser ne doit pas déclencher le clic du bouton sous la souris
  track.addEventListener('click', (e) => {
    if (drag.moved) { e.preventDefault(); e.stopPropagation(); drag.moved = false; }
  }, true);

  /* ---------- Mesures : lecture dans le rappel du ResizeObserver (mise en page fraîche),
     écriture à l'image suivante ---------- */
  let paintRaf = 0;
  const remeasure = () => {
    readGeo();
    cancelAnimationFrame(paintRaf);
    paintRaf = requestAnimationFrame(paint);
  };
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(track);
  else requestAnimationFrame(() => { readGeo(); paint(); });
}

/* ==========================================================================
   Ajout au panier : micro-état sur le bouton (le vol et le toast viennent
   de core/cart.js). « Ajouté ✓ » pendant 1,2 s puis retour au libellé.
   ========================================================================== */
function initCartFeedback(scope) {
  on('cart:add', ({ source } = {}) => {
    const btn = source && source.closest ? source.closest('.show-cta') : null;
    if (!btn || !scope.some((s) => s.contains(btn))) return;
    clearTimeout(btn.__showT);
    btn.classList.remove('is-done');
    void btn.offsetWidth; // relance l'animation si on clique plusieurs fois
    btn.classList.add('is-done');
    btn.__showT = setTimeout(() => btn.classList.remove('is-done'), 1200);
    const card = btn.closest('.pcard, .arow');
    if (card && card.animate && !prefs.reduced) {
      card.animate([
        { transform: 'translate3d(0,0,0) scale(1)' },
        { transform: 'translate3d(0,-6px,0) scale(1.015)', offset: 0.35 },
        { transform: 'translate3d(0,0,0) scale(1)' },
      ], { duration: 520, easing: 'cubic-bezier(.34,1.56,.64,1)', composite: 'add' });
    }
    if (!prefs.reduced) burst(btn);
  });
}

/** Petite gerbe d'étincelles holo autour du bouton (WAAPI, transform + opacité). */
function burst(btn) {
  if (!btn.animate) return;
  const r = btn.getBoundingClientRect();
  const colors = ['#FFD43B', '#5CF2B5', '#2EE6FF', '#FF8AC8', '#B9A8FF'];
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    s.className = 'show-spark';
    s.setAttribute('aria-hidden', 'true');
    s.style.left = `${r.left + r.width / 2}px`;
    s.style.top = `${r.top + r.height / 2}px`;
    s.style.background = colors[i % colors.length];
    document.body.appendChild(s);
    const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    const d = 38 + Math.random() * 34;
    s.animate([
      { transform: 'translate3d(-50%,-50%,0) scale(1)', opacity: 1 },
      { transform: `translate3d(calc(-50% + ${(Math.cos(a) * d * 1.6).toFixed(1)}px), calc(-50% + ${(Math.sin(a) * d).toFixed(1)}px), 0) scale(.2)`, opacity: 0 },
    ], { duration: 620 + Math.random() * 200, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' })
      .finished.catch(() => {}).then(() => s.remove());
  }
}

/** Une étagère par tâche (rend la main au navigateur entre les deux : pas de tâche longue). */
export async function initShelves(sections) {
  for (const s of sections) {
    try { initShelf(s); } catch (err) { console.error('[showcase] étagère', s.id, err); }
    await new Promise((r) => setTimeout(r, 0));
  }
}

export { initCartFeedback };
