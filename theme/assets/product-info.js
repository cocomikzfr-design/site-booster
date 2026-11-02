// assets/product-info.js : fiche produit. Variantes (étiquettes à indicateur glissant ou select, Section Rendering API),
// livraison estimée, barre d'achat collante, recommandations, titre en lignes masquées, quantité, copie du lien.
import { announce, t, fetchSection } from 'ui';
import { splitLines } from 'masked-text';

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
