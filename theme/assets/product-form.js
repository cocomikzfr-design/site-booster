// assets/product-form.js : ajout au panier (fiche, cartes, kit, suggestion du panier), variantes,
// livraison estimée, copie du lien, barre d'achat collante, recommandations, titre en lignes masquées.
import { isReduced, EASE_IO } from 'motion-core';
import { announce, t, fetchSection } from 'ui';
import { splitLines } from 'masked-text';

const R = () => window.theme.routes;
const cartIds = () => [...document.querySelectorAll('[data-cart-root]')].map((r) => r.dataset.sectionId);

/* ---------- Vol de l'image vers l'icône du panier (courbe de Bézier, 30 images clés) ---------- */
function fly(img) {
  const icon = document.querySelector('.hdr [data-cart-open]');
  if (!img || !icon || isReduced()) return Promise.resolve();
  const hs = icon.closest('.hdr-section'); if (hs) hs.classList.remove('is-hidden');
  const a = img.getBoundingClientRect(); let b = icon.getBoundingClientRect();
  if (hs && getComputedStyle(hs).transform !== 'none') b = { left: b.left, top: b.top + hs.offsetHeight, width: b.width, height: b.height };
  if (!a.width || a.bottom < 0 || a.top > innerHeight) return Promise.resolve();
  const clone = img.cloneNode(); clone.removeAttribute('srcset'); clone.src = img.currentSrc || img.src;
  Object.assign(clone.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: 0, zIndex: 300, pointerEvents: 'none', objectFit: 'contain', transformOrigin: '50% 50%', viewTransitionName: 'none' });
  document.body.append(clone);
  const s = { x: a.left + a.width / 2, y: a.top + a.height / 2 }, e = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  const c = { x: (s.x + e.x) / 2, y: Math.min(s.y, e.y) - Math.max(120, Math.abs(e.x - s.x) * 0.3) };
  const frames = [];
  for (let i = 0; i <= 29; i++) {
    const tt = i / 29, u = 1 - tt;
    const x = u * u * s.x + 2 * u * tt * c.x + tt * tt * e.x, y = u * u * s.y + 2 * u * tt * c.y + tt * tt * e.y;
    frames.push({ transform: `translate(${(x - s.x).toFixed(1)}px, ${(y - s.y).toFixed(1)}px) scale(${(1 - 0.88 * tt).toFixed(3)})` });
  }
  return clone.animate(frames, { duration: 850, easing: EASE_IO, fill: 'forwards' }).finished.catch(() => {}).then(() => clone.remove());
}

function showError(form, msg) {
  let el = form.querySelector('[data-form-error]');
  if (!el) { el = document.createElement('p'); el.className = 'form-msg form-msg--error'; el.setAttribute('role', 'alert'); el.dataset.formError = ''; form.append(el); }
  el.textContent = msg; el.hidden = false;
  const btn = form.querySelector('[type=submit]');
  if (btn && !isReduced()) btn.animate([0, -6, 6, -4, 4, -2, 0].map((x) => ({ transform: `translateX(${x}px)` })), { duration: 420, easing: 'ease-out' });
}

/* ---------- Ajout au panier : délégué, pour tous les formulaires [data-product-form] ---------- */
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('form[data-product-form]');
  if (!form) return;
  e.preventDefault();
  const btn = e.submitter && e.submitter.matches('[type=submit]') ? e.submitter : form.querySelector('[type=submit]');
  if (!btn || btn.getAttribute('aria-busy') === 'true' || btn.getAttribute('aria-disabled') === 'true') return;
  const err = form.querySelector('[data-form-error]'); if (err) err.hidden = true;
  btn.setAttribute('aria-busy', 'true');
  const fd = new FormData(form);
  const ids = cartIds();
  if (ids.length) { fd.append('sections', ids.join(',')); fd.append('sections_url', location.pathname); }
  try {
    const res = await fetch(`${R().cartAdd}.js`, { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: fd });
    const data = await res.json();
    if (!res.ok || data.status) throw new Error(data.description || data.message || t('error'));
    const inDrawer = form.closest('[data-cart-drawer]');
    const root = form.closest('[data-product-root], .card, .upsell');
    const img = !inDrawer && root && (root.querySelector('[data-fly-src].is-active img, [data-fly-src] img, [data-vt-media]') || root.querySelector('img'));
    await fly(img);
    announce(t('added', { title: data.product_title || data.title || '' }));
    if (data.sections) {
      document.dispatchEvent(new CustomEvent('cart:added', { detail: { sections: data.sections, item: data, open: !inDrawer, opener: btn } }));
    } else {
      const cart = await (await fetch(`${R().cart}.js`)).json();
      document.dispatchEvent(new CustomEvent('cart:count', { detail: { count: cart.item_count } }));
      if (window.theme.cartType === 'page') location.href = R().cart;
    }
  } catch (ex) {
    showError(form, ex.message || t('error'));
  } finally {
    btn.removeAttribute('aria-busy');
  }
});

/* ---------- Variantes (fiche produit) : étiquettes à indicateur glissant ou select, mise à jour par Section Rendering API ---------- */
function initPicker(root) {
  const picker = root.querySelector('[data-variant-picker]'); if (!picker || picker.__init) return; picker.__init = true;
  const variants = JSON.parse(root.querySelector('[data-variants]').textContent);
  const idInputs = root.querySelectorAll('[data-variant-id]');
  const sectionId = root.dataset.sectionId, baseUrl = root.dataset.url;
  let ctrl = null;
  import('chips').then(({ initChips }) => picker.querySelectorAll('.chips').forEach((c) => initChips(c)));
  const selected = () => [...picker.querySelectorAll('[data-option]')].map((g) => {
    const sel = g.querySelector('select'); if (sel) return sel.value;
    const r = g.querySelector('input:checked'); return r ? r.value : null;
  });
  picker.addEventListener('change', async () => {
    const opts = selected();
    picker.querySelectorAll('[data-option]').forEach((g, i) => { const l = g.querySelector('[data-option-value]'); if (l) l.textContent = opts[i] || ''; });
    const v = variants.find((x) => x.options.every((o, i) => o === opts[i]));
    // Disponibilité de chaque valeur, selon les autres options choisies
    picker.querySelectorAll('[data-option]').forEach((g, gi) => {
      g.querySelectorAll('input, option').forEach((inp) => {
        const ok = variants.some((x) => x.available && x.options[gi] === inp.value && x.options.every((o, i) => i === gi || o === opts[i]));
        const chip = inp.closest('.chip'); if (chip) chip.classList.toggle('is-disabled', !ok);
      });
    });
    const add = root.querySelector('[data-add]');
    if (!v) {
      idInputs.forEach((i) => { i.disabled = true; });
      if (add) { add.setAttribute('aria-disabled', 'true'); add.querySelectorAll('.btn__l > span').forEach((s) => { s.textContent = t('unavailable'); }); }
      return;
    }
    idInputs.forEach((i) => { i.disabled = false; i.value = v.id; });
    history.replaceState(null, '', `${baseUrl}?variant=${v.id}`);
    if (v.media) document.dispatchEvent(new CustomEvent('variant:change', { detail: { root, mediaId: v.media } }));
    if (ctrl) ctrl.abort(); ctrl = new AbortController();
    try {
      const doc = await fetchSection(`${baseUrl}?variant=${v.id}`, sectionId, ctrl.signal);
      ['[data-pdp-price]', '[data-sku]', '[data-add-wrap]', '[data-sticky-price]', '[data-sticky-add]'].forEach((sel) => {
        const fresh = doc.querySelector(sel), cur = root.querySelector(sel);
        if (fresh && cur) cur.innerHTML = fresh.innerHTML;
      });
    } catch (ex) { /* requête annulée */ }
  });
}

/* ---------- Livraison estimée : N jours ouvrés, dates formatées ---------- */
function addBusinessDays(d, n) {
  const r = new Date(d); let k = 0;
  while (k < n) { r.setDate(r.getDate() + 1); const w = r.getDay(); if (w !== 0 && w !== 6) k++; }
  return r;
}
function initDelivery(el) {
  if (el.__init) return; el.__init = true;
  const lang = document.documentElement.lang || 'fr';
  const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-BE' : lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const now = new Date();
  const from = fmt.format(addBusinessDays(now, +el.dataset.min)), to = fmt.format(addBusinessDays(now, +el.dataset.max));
  el.querySelector('[data-delivery-text]').textContent = t('deliveryRange', { from, to });
}

/* ---------- Barre d'achat collante (mobile) ---------- */
function initSticky(root) {
  const bar = root.querySelector('[data-sticky-buy]'); const main = root.querySelector('[data-add-wrap]');
  if (!bar || !main || bar.__init) return; bar.__init = true;
  new IntersectionObserver(([e]) => {
    bar.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0);
  }).observe(main);
}

/* ---------- Recommandations : complémentaires, puis similaires ---------- */
async function initRecos(el) {
  if (el.__init) return; el.__init = true;
  const load = async (intent) => {
    const u = new URL(el.dataset.url, location.origin); u.searchParams.set('intent', intent);
    const doc = await fetchSection(u.toString(), el.dataset.sectionId);
    return doc.querySelector('[data-recos]');
  };
  try {
    let fresh = await load('complementary');
    if (!fresh || !fresh.querySelector('.card')) fresh = await load('related');
    if (fresh && fresh.querySelector('.card')) {
      el.innerHTML = fresh.innerHTML; el.hidden = false;
      document.dispatchEvent(new CustomEvent('reveal:scan', { detail: el }));
    }
  } catch (ex) { /* pas de recommandations */ }
}

/* ---------- Titre découpé en lignes masquées après le chargement des polices ---------- */
function initTitle(h) {
  if (h.__init) return; h.__init = true;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    splitLines(h); h.classList.add('is-split');
    h.setAttribute('data-reveal', 'lines'); h.setAttribute('data-reveal-wait', '');
    document.dispatchEvent(new CustomEvent('reveal:scan', { detail: h.parentElement }));
  });
}

function init(scope = document) {
  scope.querySelectorAll('[data-product-root]').forEach((root) => { initPicker(root); initSticky(root); });
  scope.querySelectorAll('[data-delivery]').forEach(initDelivery);
  scope.querySelectorAll('[data-split-lines]').forEach(initTitle);
  scope.querySelectorAll('[data-recos]').forEach((el) => {
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); initRecos(el); } }, { rootMargin: '400px' }).observe(el);
  });
}
init();
document.addEventListener('shopify:section:load', (e) => init(e.target));

// Quantité de la fiche : boutons − / +
document.addEventListener('click', (e) => {
  const b = e.target.closest('.pi--qty [data-step]'); if (!b) return;
  const input = b.parentElement.querySelector('input');
  input.value = Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(b.dataset.step, 10));
});

// Copier le lien du produit
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy-link]'); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.url || location.href); announce(t('copied')); b.classList.add('is-done'); setTimeout(() => b.classList.remove('is-done'), 1600); } catch (ex) { /* presse-papiers indisponible */ }
});
