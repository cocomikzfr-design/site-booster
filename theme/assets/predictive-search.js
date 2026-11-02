// assets/predictive-search.js : recherche instantanée (/search/suggest.json), délai 180 ms, AbortController,
// termes surlignés en laiton, navigation au clavier. Chargé à la première ouverture du panneau.
import { isReduced, EASE_IO, EASE } from 'motion-core';
import { openLayer, t } from 'ui';

const panel = document.querySelector('[data-search-panel]');
const input = panel.querySelector('[data-search-input]');
const out = panel.querySelector('[data-search-results]');
const status = panel.querySelector('[data-search-status]');
let layer = null, timer = 0, ctrl = null, busy = false;
const lang = document.documentElement.lang || 'fr';
const currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'EUR';
const fmt = new Intl.NumberFormat(lang === 'fr' ? 'fr-BE' : lang, { style: 'currency', currency });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Surligne les termes recherchés (texte échappé d'abord)
function mark(text, q) {
  const terms = q.trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const safe = esc(text);
  if (!terms.length) return safe;
  return safe.replace(new RegExp(`(${terms.map(esc).join('|')})`, 'gi'), '<mark>$1</mark>');
}

export function openSearch(opener) {
  if (layer) return;
  panel.hidden = false;
  layer = openLayer(panel, { opener, onEsc: close, focus: input });
  if (!isReduced()) panel.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 700, easing: EASE_IO });
}
async function close() {
  if (!layer || busy) return;
  busy = true;
  if (!isReduced()) await panel.animate([{ clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 500, easing: EASE_IO }).finished.catch(() => {});
  panel.hidden = true; layer.close(); layer = null; busy = false;
}
panel.querySelector('[data-search-close]').addEventListener('click', close);

async function query(q) {
  if (ctrl) ctrl.abort();
  if (!q.trim()) { out.innerHTML = ''; status.textContent = ''; return; }
  ctrl = new AbortController();
  const u = new URL(`${window.theme.routes.predictive}.json`, location.origin);
  u.searchParams.set('q', q);
  u.searchParams.set('resources[type]', 'product,collection,page,query');
  u.searchParams.set('resources[limit]', '6');
  u.searchParams.set('resources[options][unavailable_products]', 'last');
  try {
    const res = await fetch(u, { signal: ctrl.signal });
    const data = await res.json();
    render(q, (data.resources && data.resources.results) || {});
  } catch (e) { if (e.name !== 'AbortError') status.textContent = t('error'); }
}

function render(q, r) {
  const products = r.products || [], cols = r.collections || [], pages = r.pages || [], queries = r.queries || [];
  const total = products.length + cols.length + pages.length;
  if (!total && !queries.length) {
    out.innerHTML = `<p class="sr__empty">${esc(t('searchEmpty', { terms: q }))}</p>`;
    status.textContent = t('searchEmpty', { terms: q });
    return;
  }
  const group = (title, html) => `<div class="sr__group"><h3 class="lbl">${esc(title)}</h3>${html}</div>`;
  let left = '', right = '';
  if (products.length) {
    left = group(t('searchProducts'), products.map((p) => {
      const img = p.featured_image && p.featured_image.url ? `<img src="${esc(p.featured_image.url)}&width=120" alt="" width="56" height="70" loading="lazy">` : '<span></span>';
      const price = p.price ? esc(fmt.format(parseFloat(p.price))) : '';
      return `<a class="sr__item" href="${esc(p.url)}">${img}<span class="sr__title">${mark(p.title, q)}</span><span class="sr__price">${price}</span></a>`;
    }).join('') + `<a class="sr__item sr__item--text sr__all lbl" href="${esc(window.theme.routes.search)}?q=${encodeURIComponent(q)}&options%5Bprefix%5D=last">${esc(t('searchAll', { terms: q }))}</a>`);
  }
  if (queries.length) right += group(t('searchSuggestions'), queries.map((s) => `<a class="sr__item sr__item--text" href="${esc(s.url)}">${mark(s.text, q)}</a>`).join(''));
  if (cols.length) right += group(t('searchCollections'), cols.map((c) => `<a class="sr__item sr__item--text" href="${esc(c.url)}">${mark(c.title, q)}</a>`).join(''));
  if (pages.length) right += group(t('searchPages'), pages.map((c) => `<a class="sr__item sr__item--text" href="${esc(c.url)}">${mark(c.title, q)}</a>`).join(''));
  out.innerHTML = `<div>${left}</div><div style="display:grid;gap:32px;align-content:start">${right}</div>`;
  status.textContent = t('resultsCount', { count: total });
  if (!isReduced()) out.querySelectorAll('.sr__item').forEach((a, i) => a.animate([{ transform: 'translateY(16px)', clipPath: 'inset(100% 0 0 0)' }, { transform: 'none', clipPath: 'inset(0 0 0 0)' }], { duration: 500, delay: i * 35, easing: EASE, fill: 'backwards' }));
}

input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => query(input.value), 180); });
// Clavier : ↓ depuis le champ vers le premier résultat, ↑ ↓ entre les résultats
panel.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const links = [...out.querySelectorAll('a')]; if (!links.length) return;
  const i = links.indexOf(document.activeElement);
  if (document.activeElement === input && e.key === 'ArrowDown') { e.preventDefault(); links[0].focus(); return; }
  if (i < 0) return;
  e.preventDefault();
  if (e.key === 'ArrowDown') (links[i + 1] || links[0]).focus();
  else if (i === 0) input.focus(); else links[i - 1].focus();
});
