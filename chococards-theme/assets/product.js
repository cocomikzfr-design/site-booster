/* ==========================================================================
   ChocoCards — product.js (fiche produit)
   <product-info>             : choix des variantes, prix, statut du bouton
   <media-gallery>            : galerie (glisser, miniatures, effet holo)
   <pickup-availability>      : retrait en boutique (disponibilité Shopify)
   <product-recommendations>  : produits similaires (chargés à la demande)
   ========================================================================== */
import { theme, $, $$, formatMoney, sectionInnerHTML, motionOK } from '@theme/utils';

/* ---------- Galerie ---------- */
class MediaGallery extends HTMLElement {
  connectedCallback() {
    this.track = $('[data-gallery-track]', this);
    this.slides = $$('[data-media-id]', this.track || this);
    this.thumbs = $$('[data-thumb]', this);
    this.thumbs.forEach((btn, i) => btn.addEventListener('click', () => this.show(i)));
    $('[data-gallery-prev]', this)?.addEventListener('click', () => this.show(this.index - 1));
    $('[data-gallery-next]', this)?.addEventListener('click', () => this.show(this.index + 1));
    this.index = 0;
    this.track?.addEventListener('scroll', () => {
      const i = Math.round(this.track.scrollLeft / Math.max(1, this.track.clientWidth));
      if (i !== this.index) { this.index = i; this.mark(); }
    }, { passive: true });
    this.mark();
  }
  show(i) {
    if (!this.slides.length) return;
    this.index = (i + this.slides.length) % this.slides.length;
    this.track.scrollTo({ left: this.index * this.track.clientWidth, behavior: motionOK ? 'smooth' : 'auto' });
    this.mark();
  }
  showMedia(mediaId) {
    const i = this.slides.findIndex((s) => s.dataset.mediaId === String(mediaId));
    if (i >= 0) this.show(i);
  }
  mark() {
    this.thumbs.forEach((t, i) => t.setAttribute('aria-current', String(i === this.index)));
    this.slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== this.index)));
  }
}
customElements.define('media-gallery', MediaGallery);

/* ---------- Variantes + statut ---------- */
class ProductInfo extends HTMLElement {
  connectedCallback() {
    const json = $('script[data-variants]', this);
    this.variants = json ? JSON.parse(json.textContent) : [];
    this.form = $('form[data-product-form]', this);
    this.idInput = this.form ? $('input[name="id"]', this.form) : null;
    this.button = this.form ? $('[data-buy-button]', this.form) : null;
    this.status = this.dataset.status; // disponible | precommande | bientot | rupture | boutique
    this.addEventListener('change', (e) => { if (e.target.closest('[data-variant-picker]')) this.onVariantChange(); });
    $$('[data-qty-step]', this).forEach((btn) => btn.addEventListener('click', () => {
      const input = $('input[name="quantity"]', this);
      if (!input) return;
      const min = Number(input.min) || 1;
      input.value = Math.max(min, (Number(input.value) || min) + Number(btn.dataset.qtyStep));
    }));
    this.markUnavailable();
  }

  selectedOptions() {
    return $$('[data-variant-picker] fieldset', this).map((fs) => $('input:checked', fs)?.value);
  }

  onVariantChange() {
    const selected = this.selectedOptions();
    const variant = this.variants.find((v) => v.options.every((o, i) => o === selected[i]));
    this.markUnavailable();
    $$('[data-option-value]', this).forEach((el) => { el.textContent = selected[Number(el.dataset.optionValue)] || ''; });
    if (!variant) { this.setButton(false, this.dataset.labelUnavailable); return; }
    if (this.idInput) this.idInput.value = variant.id;
    // Prix
    const price = $('[data-price]', this);
    if (price) price.textContent = formatMoney(variant.price);
    const compare = $('[data-compare-price]', this);
    if (compare) {
      compare.hidden = !(variant.compare_at_price > variant.price);
      compare.textContent = variant.compare_at_price ? formatMoney(variant.compare_at_price) : '';
    }
    // Bouton selon le statut du produit et la disponibilité de la variante
    if (this.status === 'boutique') this.setButton(false, this.dataset.labelStore);
    else if (this.status === 'bientot') this.setButton(false, this.dataset.labelSoon);
    else if (!variant.available) this.setButton(false, this.dataset.labelSoldout);
    else this.setButton(true, this.status === 'precommande' ? this.dataset.labelPreorder : this.dataset.labelAdd);
    // Galerie, URL, retrait en boutique
    if (variant.featured_media) $('media-gallery', this.closest('section') || document)?.showMedia(variant.featured_media.id);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    history.replaceState({}, '', url);
    $('pickup-availability', this)?.load(variant.id);
  }

  setButton(enabled, label) {
    if (!this.button) return;
    this.button.disabled = !enabled;
    const span = $('span', this.button);
    if (span && label) span.textContent = label;
  }

  /* Barre les valeurs d'option qui n'existent pas ou sont épuisées */
  markUnavailable() {
    const selected = this.selectedOptions();
    $$('[data-variant-picker] fieldset', this).forEach((fs, index) => {
      $$('input', fs).forEach((input) => {
        const candidate = selected.slice();
        candidate[index] = input.value;
        const match = this.variants.find((v) => v.options.every((o, i) => o === candidate[i]));
        input.classList.toggle('is-unavailable', !match || !match.available);
      });
    });
  }
}
customElements.define('product-info', ProductInfo);

/* ---------- Retrait en boutique ---------- */
class PickupAvailability extends HTMLElement {
  connectedCallback() {
    if (this.dataset.variantId) this.load(this.dataset.variantId);
  }
  async load(variantId) {
    if (!variantId) return;
    const rootUrl = (theme.routes.root_url || '/').replace(/\/?$/, '/');
    try {
      const response = await fetch(`${rootUrl}variants/${variantId}/?section_id=pickup-availability`);
      if (!response.ok) throw new Error(response.status);
      const html = sectionInnerHTML(await response.text());
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const content = $('[data-pickup-content]', doc);
      this.innerHTML = content ? content.innerHTML : '';
      this.hidden = !content || !content.innerHTML.trim();
    } catch {
      this.hidden = true;
    }
  }
}
customElements.define('pickup-availability', PickupAvailability);

/* ---------- Recommandations ---------- */
class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    if (!('IntersectionObserver' in window)) { this.load(); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      this.load();
    }, { rootMargin: '0px 0px 400px 0px' });
    io.observe(this);
  }
  async load() {
    try {
      const response = await fetch(this.dataset.url);
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const fresh = $('product-recommendations', doc);
      if (fresh && fresh.innerHTML.trim()) {
        this.innerHTML = fresh.innerHTML;
        this.dispatchEvent(new CustomEvent('theme:content', { bubbles: true }));
      } else {
        this.closest('.shopify-section')?.setAttribute('hidden', '');
      }
    } catch {
      this.closest('.shopify-section')?.setAttribute('hidden', '');
    }
  }
}
customElements.define('product-recommendations', ProductRecommendations);
