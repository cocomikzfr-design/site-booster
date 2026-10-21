/* ==========================================================================
   ChocoCards — predictive-search.js
   Fenêtre de recherche + résultats instantanés (Predictive Search API).
   Les résultats sont rendus par la section "predictive-search".
   ========================================================================== */
import { theme, $, $$, lockScroll, unlockScroll, trapFocus, sectionInnerHTML, debounce } from '@theme/utils';

class SearchOverlay extends HTMLElement {
  connectedCallback() {
    this.input = $('input[type="search"]', this);
    this.results = $('[data-search-results]', this);
    this.idle = this.results?.innerHTML || '';
    this.cache = new Map();
    this.controller = null;

    this.addEventListener('click', (e) => {
      if (e.target.closest('[data-search-close]')) this.close();
      const chip = e.target.closest('[data-suggest]');
      if (chip) { this.input.value = chip.dataset.suggest; this.search(this.input.value); this.input.focus(); }
    });
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      trapFocus($('.search-overlay__panel', this), e);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') this.moveFocus(e);
    });
    this.input?.addEventListener('input', debounce(() => this.search(this.input.value), 180));

    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-search-open]');
      if (opener) { e.preventDefault(); this.open(opener); }
    });
    document.addEventListener('keydown', (e) => {
      const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
      if (e.key === '/' && !typing && this.hidden) { e.preventDefault(); this.open(); }
    });
  }

  open(trigger) {
    if (!this.hidden) return;
    this.trigger = trigger || document.activeElement;
    this.hidden = false;
    lockScroll();
    requestAnimationFrame(() => requestAnimationFrame(() => this.classList.add('is-open')));
    setTimeout(() => this.input?.focus(), 60);
  }

  close() {
    if (this.hidden) return;
    this.classList.remove('is-open');
    unlockScroll();
    setTimeout(() => { if (!this.classList.contains('is-open')) this.hidden = true; }, 400);
    this.trigger?.focus?.();
  }

  moveFocus(e) {
    const links = $$('a, button', this.results);
    if (!links.length) return;
    e.preventDefault();
    const i = links.indexOf(document.activeElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % links.length : (i <= 0 ? links.length - 1 : i - 1);
    links[next].focus();
  }

  async search(raw) {
    const q = raw.trim();
    if (!q) { this.results.innerHTML = this.idle; return; }
    if (this.cache.has(q)) { this.results.innerHTML = this.cache.get(q); return; }
    this.controller?.abort();
    this.controller = new AbortController();
    this.setAttribute('aria-busy', 'true');
    const params = new URLSearchParams({
      q,
      section_id: 'predictive-search',
      'resources[type]': 'product,collection,article,page',
      'resources[limit]': '6',
      'resources[limit_scope]': 'each'
    });
    try {
      const response = await fetch(`${theme.routes.predictive_search_url}?${params}`, { signal: this.controller.signal });
      if (!response.ok) throw new Error(response.status);
      const html = sectionInnerHTML(await response.text(), '#shopify-section-predictive-search');
      this.cache.set(q, html);
      this.results.innerHTML = html;
    } catch (err) {
      if (err.name !== 'AbortError') this.results.innerHTML = this.idle;
    } finally {
      this.removeAttribute('aria-busy');
    }
  }
}
customElements.define('search-overlay', SearchOverlay);
