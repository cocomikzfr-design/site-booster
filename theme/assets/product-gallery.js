// assets/product-gallery.js : galerie de la fiche. Inclinaison vers la souris avec reflet glissant,
// cadre laiton qui glisse sur les miniatures, changement d'image par découpe diagonale, zoom plein écran (FLIP),
// scroll-snap sur mobile, vidéo et modèles 3D.
import { subscribe, damp, isReduced, EASE_IO } from 'motion-core';
import { openLayer, t } from 'ui';

const mobile = matchMedia('(max-width: 899px)');
const HIDDEN = 'polygon(0 0, 0 0, -30% 100%, -30% 100%)', FULL = 'polygon(0 0, 130% 0, 100% 100%, -30% 100%)';

function init(g) {
  if (g.__init) return; g.__init = true;
  const main = g.querySelector('.pg__main');
  const slides = [...g.querySelectorAll('.pg__slide')];
  const thumbs = [...g.querySelectorAll('[data-thumb]')];
  const list = g.querySelector('.pg__thumbs'), frame = g.querySelector('.pg__frame');
  let active = slides.find((s) => s.classList.contains('is-active')) || slides[0];

  function placeFrame() {
    if (!frame) return;
    const th = thumbs.find((b) => b.dataset.thumb === active.dataset.mediaId); if (!th) return;
    frame.style.setProperty('--fx', `${th.offsetLeft - list.scrollLeft}px`);
    frame.style.width = `${th.offsetWidth}px`; frame.style.height = `${th.offsetHeight}px`;
  }
  function mark() {
    thumbs.forEach((b) => { if (b.dataset.thumb === active.dataset.mediaId) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    placeFrame();
  }
  // Le nom de transition suit l'image visible (la vitrine et les cartes y arrivent)
  function vtName(slide) {
    g.querySelectorAll('[data-vt-media]').forEach((i) => { i.style.viewTransitionName = ''; i.removeAttribute('data-vt-media'); });
    const img = slide.querySelector('img'); if (img) { img.style.viewTransitionName = 'vt-product-media'; img.setAttribute('data-vt-media', ''); }
  }
  function show(id) {
    const next = slides.find((s) => s.dataset.mediaId === String(id));
    if (!next || next === active) return;
    const prev = active; active = next;
    prev.querySelectorAll('video').forEach((v) => v.pause());
    if (mobile.matches) { main.scrollTo({ left: next.offsetLeft, behavior: isReduced() ? 'auto' : 'smooth' }); mark(); vtName(next); return; }
    prev.style.zIndex = '1'; next.style.zIndex = '2';
    next.classList.add('is-active');
    vtName(next); mark();
    const done = () => { prev.classList.remove('is-active'); prev.style.zIndex = ''; next.style.zIndex = ''; };
    if (isReduced()) { done(); return; }
    next.animate([{ clipPath: HIDDEN }, { clipPath: FULL }], { duration: 800, easing: EASE_IO }).finished.then(done, done);
  }
  thumbs.forEach((b) => b.addEventListener('click', () => show(b.dataset.thumb)));
  if (list) list.addEventListener('scroll', placeFrame, { passive: true });
  new ResizeObserver(placeFrame).observe(g);
  mark();

  // Mobile : la miniature suit l'image visible
  main.addEventListener('scroll', () => {
    if (!mobile.matches) return;
    const i = Math.round(main.scrollLeft / Math.max(1, main.clientWidth));
    if (slides[i] && slides[i] !== active) { slides.forEach((s) => s.classList.toggle('is-active', s === slides[i])); active = slides[i]; mark(); }
  }, { passive: true });

  document.addEventListener('variant:change', (e) => { if (e.detail.root.contains(g)) show(e.detail.mediaId); });

  // Inclinaison vers la souris (±10° / ±6°) et reflet glissant
  if (matchMedia('(pointer: fine)').matches) {
    const stage = g.querySelector('.pg__stage');
    let tx = 0, ty = 0, rx = 0, ry = 0, running = false;
    const tick = (dt) => {
      rx = damp(rx, tx, 7, dt); ry = damp(ry, ty, 7, dt);
      main.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      main.style.setProperty('--g', (ry / 10).toFixed(3));
      if (Math.abs(rx - tx) < 0.01 && Math.abs(ry - ty) < 0.01) { running = false; return false; }
    };
    const wake = () => { if (!running && !isReduced() && !mobile.matches) { running = true; subscribe(tick); } };
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      ty = ((e.clientX - r.left) / r.width - 0.5) * 20; tx = -((e.clientY - r.top) / r.height - 0.5) * 12; wake();
    });
    stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; wake(); });
  }

  // Zoom plein écran : l'image part de sa place et s'agrandit (FLIP)
  const zoomBtn = g.querySelector('[data-zoom]');
  if (zoomBtn) zoomBtn.addEventListener('click', () => {
    const src = active.querySelector('img'); if (!src) return;
    const first = src.getBoundingClientRect();
    const box = document.createElement('div');
    box.className = 'zoom world-dark'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', src.alt || t('close'));
    const big = document.createElement('img'); big.alt = src.alt; big.src = src.currentSrc || src.src;
    if (src.srcset) { big.srcset = src.srcset; big.sizes = '92vw'; }
    const close = document.createElement('button'); close.type = 'button'; close.className = 'btn--icon zoom__close'; close.setAttribute('aria-label', t('close'));
    close.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';
    box.append(big, close); document.body.append(box);
    let layer = null;
    const flip = (reverse) => {
      const last = big.getBoundingClientRect();
      const from = `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`;
      return big.animate(reverse ? [{ transform: 'none' }, { transform: from }] : [{ transform: from }, { transform: 'none' }], { duration: 650, easing: EASE_IO, fill: 'forwards' }).finished;
    };
    const end = async () => {
      if (!isReduced()) { box.animate([{ clipPath: 'inset(0)' }, { clipPath: `inset(${first.top}px ${innerWidth - first.right}px ${innerHeight - first.bottom}px ${first.left}px)` }], { duration: 650, easing: EASE_IO, fill: 'forwards' }); await flip(true).catch(() => {}); }
      layer.close(); box.remove();
    };
    layer = openLayer(box, { opener: zoomBtn, onEsc: end, focus: close });
    close.addEventListener('click', end);
    box.addEventListener('click', (e) => { if (e.target === box) end(); });
    if (!isReduced()) {
      const go = () => { flip(false); box.animate([{ clipPath: `inset(${first.top}px ${innerWidth - first.right}px ${innerHeight - first.bottom}px ${first.left}px)` }, { clipPath: 'inset(0)' }], { duration: 650, easing: EASE_IO }); };
      if (big.complete) go(); else big.addEventListener('load', go, { once: true });
    }
  });

  // Modèles 3D (Shopify XR)
  if (g.querySelector('model-viewer') && window.Shopify && window.Shopify.loadFeatures) {
    window.Shopify.loadFeatures([{ name: 'model-viewer-ui', version: '1.0', onLoad: (err) => {
      if (err) return; g.querySelectorAll('model-viewer').forEach((m) => new window.Shopify.ModelViewerUI(m));
    } }]);
  }
}

document.querySelectorAll('[data-gallery]').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-gallery]').forEach(init));
