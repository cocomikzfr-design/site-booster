// assets/product-form.js : ajout au panier depuis la fiche, les cartes, le kit et la suggestion du panier.
// Vol de l'image vers l'icône du panier, puis événement cart:added (le tiroir se met à jour et s'ouvre).
import { isReduced, EASE_IO } from 'motion-core';
import { announce, t } from 'ui';

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
