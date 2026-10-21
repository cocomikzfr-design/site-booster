/* ==========================================================================
   ChocoCards — carousels.js
   <coverflow-carousel> : carrousel 3D (collection mise en avant)
   <product-slider>     : carrousel horizontal de produits (scroll-snap)
   ========================================================================== */
import { motionOK, finePointer, isDesignMode, $, $$, clamp } from '@theme/utils';

class CoverflowCarousel extends HTMLElement {
  connectedCallback() {
    this.stage = $('[data-coverflow-stage]', this);
    this.items = $$('.coverflow__item', this.stage);
    this.count = this.items.length;
    if (!this.count) return;
    this.active = 0;
    this.dots = $('[data-coverflow-dots]', this);
    if (this.dots) {
      this.dots.innerHTML = this.items.map((_, i) => `<button type="button" aria-label="${this.dataset.dotLabel || 'Produit'} ${i + 1}"></button>`).join('');
      $$('button', this.dots).forEach((d, i) => d.addEventListener('click', () => this.go(i)));
    }
    $('[data-coverflow-prev]', this)?.addEventListener('click', () => this.go(this.active - 1));
    $('[data-coverflow-next]', this)?.addEventListener('click', () => this.go(this.active + 1));
    this.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.active - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.go(this.active + 1); }
    });
    this.stage.addEventListener('click', (e) => {
      const item = e.target.closest('.coverflow__item');
      if (item && !item.classList.contains('is-active')) { e.preventDefault(); this.go(this.items.indexOf(item)); }
    });
    // Glisser (souris + tactile)
    let startX = null;
    this.stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a.add-btn, input')) return;
      startX = e.clientX;
      this.stage.classList.add('is-dragging');
    });
    this.onUp = (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      this.stage.classList.remove('is-dragging');
      if (Math.abs(dx) > 40) this.go(this.active + (dx < 0 ? 1 : -1));
    };
    window.addEventListener('pointerup', this.onUp);
    // Défilement automatique doux quand visible
    this.hovered = false;
    this.inView = false;
    ['pointerenter', 'focusin'].forEach((ev) => this.addEventListener(ev, () => { this.hovered = true; this.schedule(); }));
    ['pointerleave', 'focusout'].forEach((ev) => this.addEventListener(ev, () => { this.hovered = false; this.schedule(); }));
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(([entry]) => { this.inView = entry.isIntersecting; this.schedule(); }, { threshold: 0.4 });
      this.io.observe(this);
    }
    // Éditeur de thème : afficher le produit du bloc sélectionné
    this.layout();
  }

  disconnectedCallback() {
    clearInterval(this.timer);
    this.io?.disconnect();
    window.removeEventListener('pointerup', this.onUp);
  }

  schedule() {
    clearInterval(this.timer);
    if (this.dataset.autoplay === 'true' && motionOK && !isDesignMode && this.inView && !this.hovered) {
      this.timer = setInterval(() => this.go(this.active + 1), Number(this.dataset.speed || 4.5) * 1000);
    }
  }

  go(i) {
    this.active = (i + this.count) % this.count;
    this.layout();
  }

  layout() {
    const n = this.count;
    this.items.forEach((item, i) => {
      let off = i - this.active;
      if (off > n / 2) off -= n;
      if (off < -n / 2) off += n;
      item.style.setProperty('--offset', off);
      item.style.setProperty('--abs', Math.abs(off));
      item.classList.toggle('is-active', off === 0);
      item.classList.toggle('is-hidden', Math.abs(off) > 2);
      item.setAttribute('aria-hidden', String(off !== 0));
      $$('a, button, input, select', item).forEach((f) => {
        if (off !== 0) f.setAttribute('tabindex', '-1'); else f.removeAttribute('tabindex');
      });
    });
    $$('button', this.dots || document.createElement('div')).forEach((d, i) => d.setAttribute('aria-current', String(i === this.active)));
  }
}
customElements.define('coverflow-carousel', CoverflowCarousel);

class ProductSlider extends HTMLElement {
  connectedCallback() {
    this.track = $('[data-slider-track]', this);
    if (!this.track) return;
    this.prev = $('[data-slider-prev]', this);
    this.next = $('[data-slider-next]', this);
    this.bar = $('[data-slider-progress]', this);
    this.prev?.addEventListener('click', () => this.scrollByPage(-1));
    this.next?.addEventListener('click', () => this.scrollByPage(1));
    this.update = this.update.bind(this);
    this.track.addEventListener('scroll', this.update, { passive: true });
    window.addEventListener('resize', this.update);
    // Première mesure quand le carrousel approche de l'écran (pas de calcul forcé au chargement)
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { this.io.disconnect(); this.update(); } }, { rootMargin: '200px' });
      this.io.observe(this);
    } else {
      this.update();
    }
    if (finePointer) this.enableDrag();
  }

  disconnectedCallback() { window.removeEventListener('resize', this.update); this.io?.disconnect(); }

  scrollByPage(dir) {
    const first = this.track.firstElementChild;
    if (!first) return;
    const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
    const step = first.offsetWidth + gap;
    const page = Math.max(step, Math.floor(this.track.clientWidth / step) * step);
    this.track.scrollBy({ left: dir * page, behavior: motionOK ? 'smooth' : 'auto' });
  }

  update() {
    const t = this.track;
    const max = t.scrollWidth - t.clientWidth;
    if (this.bar) this.bar.style.transform = `scaleX(${clamp(t.scrollWidth ? (t.clientWidth + t.scrollLeft) / t.scrollWidth : 1, 0.05, 1)})`;
    if (this.prev) this.prev.disabled = t.scrollLeft < 4;
    if (this.next) this.next.disabled = t.scrollLeft > max - 4;
  }

  enableDrag() {
    const t = this.track;
    let down = false; let moved = false; let sx = 0; let sl = 0;
    t.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, input, select')) return;
      down = true; moved = false; sx = e.clientX; sl = t.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; t.classList.add('is-dragging'); }
      if (moved) t.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        requestAnimationFrame(() => t.classList.remove('is-dragging'));
        t.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
      }
    });
  }
}
customElements.define('product-slider', ProductSlider);
