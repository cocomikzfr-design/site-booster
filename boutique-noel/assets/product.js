/* Noël en Façade — fiche produit : choix de variante, galerie, barre d'achat collante. */
(() => {
  const config = window.themeConfig || {};
  const strings = config.strings || {};

  const formatMoney = (cents) => (window.Theme ? window.Theme.formatMoney(cents) : String(cents / 100));
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setButtonState(button, enabled, label) {
    if (!button) return;
    button.disabled = !enabled;
    const text = button.querySelector('[data-button-label], [data-sticky-label]') || button;
    text.textContent = label;
  }

  function discountLabel(variant) {
    const saving = variant.compare_at_price - variant.price;
    if (config.discountBadge && config.discountBadge.style === 'amount') {
      return (strings.saveAmount || '').replace('[amount]', formatMoney(saving));
    }
    return (strings.savePercent || '').replace('[percent]', Math.round((saving * 100) / variant.compare_at_price));
  }

  function pauseMedia(container) {
    container.querySelectorAll('video').forEach((video) => {
      if (!video.paused) video.pause();
    });
  }

  class VariantPicker extends HTMLElement {
    connectedCallback() {
      const data = this.querySelector('[data-variants]');
      if (!data) return;
      try {
        this.variants = JSON.parse(data.textContent);
      } catch (error) {
        return;
      }
      this.sectionId = this.dataset.section;
      this.fieldsets = Array.from(this.querySelectorAll('fieldset'));
      this.addEventListener('change', () => this.onOptionChange());
      this.updateAvailability(this.selectedOptions());
    }

    selectedOptions() {
      return this.fieldsets.map((fieldset) => {
        const checked = fieldset.querySelector('input:checked');
        return checked ? checked.value : null;
      });
    }

    updateAvailability(options) {
      this.fieldsets.forEach((fieldset, position) => {
        fieldset.querySelectorAll('input').forEach((input) => {
          const available = this.variants.some(
            (variant) =>
              variant.available &&
              variant.options[position] === input.value &&
              variant.options.every((value, index) => index === position || value === options[index])
          );
          input.classList.toggle('is-unavailable', !available);
          const label = input.nextElementSibling && input.nextElementSibling.querySelector('[data-unavailable-label]');
          if (label) label.hidden = available;
        });
        const legendValue = fieldset.querySelector('[data-option-value]');
        if (legendValue) legendValue.textContent = options[position] || '';
      });
    }

    onOptionChange() {
      const options = this.selectedOptions();
      this.updateAvailability(options);
      const variant = this.variants.find((candidate) =>
        candidate.options.every((value, index) => value === options[index])
      );
      const form = document.getElementById(`ProductForm-${this.sectionId}`);
      const button = form ? form.querySelector('[name="add"]') : null;

      if (!variant) {
        setButtonState(button, false, strings.unavailable);
        this.emit(null);
        return;
      }

      const idInput = form && form.querySelector('[data-variant-id]');
      if (idInput) idInput.value = variant.id;
      setButtonState(button, variant.available, variant.available ? strings.addToCart : strings.soldOut);

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());

      this.updatePrice(variant);
      this.emit(variant);
    }

    emit(variant) {
      document.dispatchEvent(new CustomEvent('variant:change', { detail: { sectionId: this.sectionId, variant } }));
    }

    updatePrice(variant) {
      const section = document.getElementById(`MainProduct-${this.sectionId}`);
      if (!section) return;
      const onSale = Boolean(variant.compare_at_price) && variant.compare_at_price > variant.price;

      section.querySelectorAll('[data-price]').forEach((price) => {
        price.classList.toggle('price--on-sale', onSale);
        const label = price.querySelector('[data-price-label]');
        if (label) label.textContent = onSale ? strings.salePriceLabel : strings.priceLabel;
        const current = price.querySelector('[data-price-current]');
        if (current) current.textContent = formatMoney(variant.price);
        const compare = price.querySelector('[data-price-compare]');
        if (compare) {
          compare.hidden = !onSale;
          const value = compare.querySelector('[data-price-compare-value]');
          if (value) value.textContent = onSale ? formatMoney(variant.compare_at_price) : '';
        }
        const badge = price.querySelector('[data-price-badge]');
        if (badge) {
          badge.hidden = !onSale;
          if (onSale) badge.textContent = discountLabel(variant);
        }
      });
    }
  }

  class ProductGallery extends HTMLElement {
    connectedCallback() {
      this.sectionId = this.dataset.section;
      this.list = this.querySelector('[data-media-list]');
      this.items = Array.from(this.querySelectorAll('[data-media-item]'));
      if (!this.list || !this.items.length) return;

      this.navButtons = Array.from(this.querySelectorAll('[data-gallery-goto]'));
      this.counter = this.querySelector('[data-gallery-counter]');
      this.dialog = this.querySelector('[data-zoom-dialog]');

      this.navButtons.forEach((button) => {
        button.addEventListener('click', () => this.setActive(Number(button.dataset.galleryGoto), true));
      });
      this.querySelectorAll('[data-zoom-open]').forEach((button) => {
        button.addEventListener('click', () => this.openZoom(button));
      });

      if (this.dialog) {
        this.dialog.addEventListener('click', (event) => {
          if (event.target === this.dialog || event.target.closest('[data-zoom-close]')) this.dialog.close();
        });
        this.dialog.addEventListener('close', () => {
          if (window.Theme) window.Theme.unlockScroll();
          if (this.zoomTrigger) this.zoomTrigger.focus();
        });
      }

      this.onVariantChange = (event) => {
        const { sectionId, variant } = event.detail || {};
        if (sectionId !== this.sectionId || !variant || !variant.featured_media) return;
        const index = this.items.findIndex((item) => item.dataset.mediaId === String(variant.featured_media.id));
        if (index >= 0) this.setActive(index, true);
      };
      document.addEventListener('variant:change', this.onVariantChange);

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.intersectionRatio >= 0.6) {
                if (this.isCarousel()) this.setActive(this.items.indexOf(entry.target), false);
              } else if (!entry.isIntersecting) {
                pauseMedia(entry.target);
              }
            });
          },
          { threshold: [0, 0.6] }
        );
        this.items.forEach((item) => this.observer.observe(item));
      }
    }

    disconnectedCallback() {
      document.removeEventListener('variant:change', this.onVariantChange);
      if (this.observer) this.observer.disconnect();
    }

    isCarousel() {
      return this.list.scrollWidth > this.list.clientWidth + 1;
    }

    setActive(index, scroll) {
      const item = this.items[index];
      if (!item) return;
      const carousel = this.isCarousel();

      this.items.forEach((candidate, position) => {
        const active = position === index;
        candidate.classList.toggle('is-active', active);
        if (!active && !carousel) pauseMedia(candidate);
      });
      this.navButtons.forEach((button) => {
        if (Number(button.dataset.galleryGoto) === index) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
      if (this.counter && strings.imageOf) {
        this.counter.textContent = strings.imageOf.replace('[index]', index + 1).replace('[count]', this.items.length);
      }
      if (scroll && carousel) {
        const padding = parseFloat(window.getComputedStyle(this.list).paddingLeft) || 0;
        this.list.scrollTo({ left: item.offsetLeft - padding, behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }

    openZoom(button) {
      if (!this.dialog || typeof this.dialog.showModal !== 'function') return;
      const target = this.dialog.querySelector('[data-zoom-target]');
      const image = document.createElement('img');
      image.src = button.dataset.zoomSrc;
      image.alt = button.dataset.zoomAlt || '';
      image.decoding = 'async';
      target.replaceChildren(image);
      this.zoomTrigger = button;
      this.dialog.showModal();
      if (window.Theme) window.Theme.lockScroll();
      const close = this.dialog.querySelector('[data-zoom-close]');
      if (close) close.focus();
    }
  }

  class StickyAtc extends HTMLElement {
    connectedCallback() {
      this.form = document.getElementById(this.dataset.formId);
      this.mainButton = this.form ? this.form.querySelector('[name="add"]') : null;
      this.button = this.querySelector('[data-sticky-button]');
      if (!this.mainButton || !this.button || !('IntersectionObserver' in window)) return;

      this.footer = document.querySelector('.footer');

      // L'observateur signale les passages à l'écran ; le défilement couvre les sauts par-dessus le bouton.
      this.observer = new IntersectionObserver(() => this.measure());
      this.observer.observe(this.mainButton);
      if (this.footer) this.observer.observe(this.footer);
      this.onScroll = () => {
        if (this.ticking) return;
        this.ticking = true;
        window.requestAnimationFrame(() => {
          this.ticking = false;
          this.measure();
        });
      };
      window.addEventListener('scroll', this.onScroll, { passive: true });

      this.onVariantChange = (event) => {
        const { sectionId, variant } = event.detail || {};
        if (sectionId !== this.dataset.section) return;
        if (!variant) {
          setButtonState(this.button, false, strings.unavailable);
        } else if (!variant.available) {
          setButtonState(this.button, false, strings.soldOut);
        } else {
          setButtonState(this.button, true, (strings.stickyAdd || '').replace('[price]', formatMoney(variant.price)));
        }
      };
      document.addEventListener('variant:change', this.onVariantChange);
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
      window.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('variant:change', this.onVariantChange);
      document.body.classList.remove('has-sticky-atc');
    }

    measure() {
      const buttonGone = this.mainButton.getBoundingClientRect().bottom < 0;
      const footerVisible = this.footer ? this.footer.getBoundingClientRect().top < window.innerHeight : false;
      const visible = buttonGone && !footerVisible;
      this.classList.toggle('is-visible', visible);
      document.body.classList.toggle('has-sticky-atc', visible);
    }
  }

  function loadModelViewer() {
    const viewers = document.querySelectorAll('.product__gallery model-viewer');
    const shopify = window.Shopify;
    if (!viewers.length || !shopify || typeof shopify.loadFeatures !== 'function') return;
    shopify.loadFeatures([
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: (errors) => {
          if (errors || !shopify.ModelViewerUI) return;
          viewers.forEach((viewer) => new shopify.ModelViewerUI(viewer));
        }
      }
    ]);
  }

  if (!customElements.get('variant-picker')) customElements.define('variant-picker', VariantPicker);
  if (!customElements.get('product-gallery')) customElements.define('product-gallery', ProductGallery);
  if (!customElements.get('sticky-atc')) customElements.define('sticky-atc', StickyAtc);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModelViewer);
  } else {
    loadModelViewer();
  }
})();
