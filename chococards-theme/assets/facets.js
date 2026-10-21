/* ==========================================================================
   ChocoCards — facets.js
   <facets-form> : filtres (Search & Discovery), tri et pagination sans
   rechargement de page, grâce à la Section Rendering API.
   Sans JavaScript, le formulaire fonctionne normalement (bouton "Appliquer").
   ========================================================================== */
import { $, $$, debounce, scrollToElement } from '@theme/utils';

class FacetsForm extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.cache = new Map();
    this.onChange = debounce(() => this.submit(), 350);
    this.addEventListener('change', (e) => { if (e.target.closest('form[data-facets]')) this.onChange(); });
    this.addEventListener('submit', (e) => { if (e.target.matches('form[data-facets]')) { e.preventDefault(); this.submit(); } });
    this.addEventListener('click', (e) => {
      const link = e.target.closest('[data-facet-link], .pagination a');
      if (!link) return;
      e.preventDefault();
      this.render(new URL(link.href, window.location.href).searchParams.toString(), link.closest('.pagination'));
    });
    this.onPop = () => this.render(window.location.search.slice(1), false, false);
    window.addEventListener('popstate', this.onPop);
  }

  disconnectedCallback() { window.removeEventListener('popstate', this.onPop); }

  params() {
    const forms = $$('form[data-facets]', this);
    const params = new URLSearchParams();
    forms.forEach((form) => {
      new FormData(form).forEach((value, key) => {
        if (value === '' && /price/.test(key)) return;
        params.append(key, value);
      });
    });
    // Une seule valeur de tri
    const sort = params.getAll('sort_by').pop();
    params.delete('sort_by');
    if (sort) params.set('sort_by', sort);
    // Une seule fois chaque filtre (formulaire mobile + desktop)
    const unique = new URLSearchParams();
    const seen = new Set();
    params.forEach((v, k) => { const id = `${k}=${v}`; if (!seen.has(id)) { seen.add(id); unique.append(k, v); } });
    return unique.toString();
  }

  submit() { this.render(this.params()); }

  async render(query, scrollUp = false, push = true) {
    const url = `${window.location.pathname}?section_id=${this.sectionId}${query ? `&${query}` : ''}`;
    this.classList.add('is-loading-results');
    try {
      let html = this.cache.get(url);
      if (!html) {
        const response = await fetch(url);
        html = await response.text();
        this.cache.set(url, html);
      }
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // On garde ouverts les groupes de filtres que l'internaute avait dépliés
      const opened = $$('details[data-facet-id][open]', this).map((d) => d.dataset.facetId);
      ['[data-facets-results]', '[data-facets-active]', '[data-facets-count]', '[data-facets-filters]'].forEach((sel) => {
        $$(sel, doc).forEach((fresh, i) => {
          const current = $$(sel, this)[i];
          if (current) current.innerHTML = fresh.innerHTML;
        });
      });
      $$('details[data-facet-id]', this).forEach((d) => { if (opened.includes(d.dataset.facetId)) d.open = true; });
      if (push) history.pushState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
      if (scrollUp) scrollToElement(this);
      document.dispatchEvent(new CustomEvent('facets:updated'));
    } catch (err) {
      console.error(err);
      window.location.search = query;
    } finally {
      this.classList.remove('is-loading-results');
    }
  }
}
customElements.define('facets-form', FacetsForm);
