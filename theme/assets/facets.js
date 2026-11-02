// assets/facets.js : filtres, tri et « Voir plus » sans rechargement (Section Rendering API + history.replaceState).
// Les anciennes cartes sortent par découpe, les nouvelles entrent en décalé. Panneau de filtres en clip-path.
import { isReduced, EASE, EASE_IO } from 'motion-core';
import { openLayer, announce, fetchSection } from 'ui';

function init(root) {
  if (root.__facets) return; root.__facets = true;
  const sectionId = root.dataset.sectionId;
  const form = root.querySelector('[data-facets-form]');
  const panel = root.querySelector('[data-filters]');
  const openBtn = root.querySelector('[data-filters-open]');
  const grid = () => root.querySelector('[data-facets-grid]');
  let layer = null, ctrl = null, timer = 0, busy = false;

  /* Panneau */
  function open() {
    if (!panel || layer) return;
    panel.classList.add('is-open'); if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    layer = openLayer(panel, { opener: openBtn, onEsc: close });
    if (!isReduced()) panel.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 700, easing: EASE_IO });
  }
  async function close() {
    if (!layer || busy) return;
    busy = true;
    if (!isReduced()) await panel.animate([{ clipPath: 'inset(0 0% 0 0)' }, { clipPath: 'inset(0 100% 0 0)' }], { duration: 500, easing: EASE_IO }).finished.catch(() => {});
    panel.classList.remove('is-open'); if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    layer.close(); layer = null; busy = false;
  }
  if (openBtn) openBtn.addEventListener('click', open);
  if (panel) panel.querySelector('[data-filters-close]').addEventListener('click', close);

  /* URL à partir du formulaire (champs vides ignorés) */
  function formUrl() {
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (String(v).trim() !== '') params.append(k, v);
    return `${form.action.split('?')[0]}?${params}`;
  }

  async function update(url) {
    if (ctrl) ctrl.abort(); ctrl = new AbortController();
    root.setAttribute('aria-busy', 'true');
    try {
      const doc = await fetchSection(url, sectionId, ctrl.signal);
      const fresh = doc.querySelector('[data-facets-root]'); if (!fresh) return;
      const g = grid();
      if (!isReduced()) {
        await Promise.all([...g.children].map((li, i) => li.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
          { duration: 350, delay: Math.min(i, 8) * 25, easing: EASE, fill: 'forwards' }).finished)).catch(() => {});
      }
      g.innerHTML = fresh.querySelector('[data-facets-grid]').innerHTML;
      ['[data-facets-active]', '[data-facets-more]', '[data-facets-count]', '[data-facets-count2]'].forEach((sel) => {
        const a = root.querySelector(sel), b = fresh.querySelector(sel); if (a && b) a.innerHTML = b.innerHTML;
      });
      // Filtres : on met à jour chaque groupe, sauf celui en cours d'utilisation
      const active = document.activeElement;
      const fFresh = fresh.querySelectorAll('[data-facets-form] .filter');
      root.querySelectorAll('[data-facets-form] .filter').forEach((d, i) => {
        if (fFresh[i] && !d.contains(active)) { const open = d.open; d.innerHTML = fFresh[i].innerHTML; d.open = open; }
      });
      initRanges();
      history.replaceState(null, '', url.replace(/[?&]section_id=[^&]*/, ''));
      document.dispatchEvent(new CustomEvent('reveal:scan', { detail: g }));
      const count = root.querySelector('[data-facets-count]'); if (count) announce(count.textContent);
    } catch (e) { /* requête annulée */ } finally { root.removeAttribute('aria-busy'); }
  }

  async function loadMore(btn) {
    btn.setAttribute('aria-busy', 'true');
    try {
      const doc = await fetchSection(btn.href, sectionId);
      const fresh = doc.querySelector('[data-facets-root]');
      const items = [...fresh.querySelector('[data-facets-grid]').children];
      const g = grid(); const first = items[0];
      g.append(...items);
      root.querySelector('[data-facets-more]').innerHTML = fresh.querySelector('[data-facets-more]').innerHTML;
      document.dispatchEvent(new CustomEvent('reveal:scan', { detail: g }));
      const link = first && first.querySelector('a.card__link'); if (link) link.focus({ preventScroll: true });
    } catch (e) { location.href = btn.href; }
  }

  /* Curseur de prix double : les range et les champs numériques restent synchronisés */
  function initRanges() {
    root.querySelectorAll('[data-range]').forEach((r) => {
      if (r.__init) return; r.__init = true;
      const [rMin, rMax] = [r.querySelector('[data-range-min]'), r.querySelector('[data-range-max]')];
      const [nMin, nMax] = [r.querySelector('[data-num-min]'), r.querySelector('[data-num-max]')];
      rMin.addEventListener('input', () => { if (+rMin.value > +rMax.value) rMin.value = rMax.value; nMin.value = rMin.value; });
      rMax.addEventListener('input', () => { if (+rMax.value < +rMin.value) rMax.value = rMin.value; nMax.value = rMax.value; });
      nMin.addEventListener('input', () => { rMin.value = nMin.value || 0; });
      nMax.addEventListener('input', () => { rMax.value = nMax.value || rMax.max; });
    });
  }
  initRanges();

  form.addEventListener('change', () => { clearTimeout(timer); timer = setTimeout(() => update(formUrl()), 350); });
  form.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(timer); update(formUrl()); close(); });
  const sort = root.querySelector('[data-facets-sort]');
  if (sort) sort.addEventListener('change', () => update(formUrl()));
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-facets-link], [data-facets-clear]');
    if (a) { e.preventDefault(); update(a.href); return; }
    const more = e.target.closest('[data-load-more]');
    if (more) { e.preventDefault(); loadMore(more); }
  });
}

document.querySelectorAll('[data-facets-root]').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-facets-root]').forEach(init));
