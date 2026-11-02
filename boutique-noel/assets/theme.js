/* Noël en Façade — utilitaires communs (window.Theme) et comportements de base. */
(() => {
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'summary',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  const DRAWER_ANIMATION_MS = 250;
  const ANNOUNCEMENT_ROTATION_MS = 5000;
  const desktopQuery = window.matchMedia('(min-width: 990px)');
  const hoverQuery = window.matchMedia('(hover: hover)');
  const strings = (window.themeConfig && window.themeConfig.strings) || {};

  let trapHandler = null;
  let scrollLocks = 0;

  const Theme = {
    debounce(fn, wait = 300) {
      let timer;
      return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), wait);
      };
    },

    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    trapFocus(container, elementToFocus = container) {
      Theme.removeTrapFocus();
      trapHandler = (event) => {
        if (event.key !== 'Tab') return;
        const elements = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
          (element) => element.offsetParent !== null
        );
        if (!elements.length) {
          event.preventDefault();
          return;
        }
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!container.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener('keydown', trapHandler);
      if (elementToFocus) {
        if (!elementToFocus.matches(FOCUSABLE) && !elementToFocus.hasAttribute('tabindex')) {
          elementToFocus.setAttribute('tabindex', '-1');
        }
        elementToFocus.focus({ preventScroll: true });
      }
    },

    removeTrapFocus(elementToFocus = null) {
      if (trapHandler) document.removeEventListener('keydown', trapHandler);
      trapHandler = null;
      if (elementToFocus) elementToFocus.focus({ preventScroll: true });
    },

    lockScroll() {
      scrollLocks += 1;
      if (scrollLocks > 1) return;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
      document.body.classList.add('is-locked');
    },

    unlockScroll() {
      scrollLocks = Math.max(0, scrollLocks - 1);
      if (scrollLocks > 0) return;
      document.body.classList.remove('is-locked');
      document.body.style.paddingRight = '';
    },

    formatMoney(cents, format = (window.themeConfig && window.themeConfig.moneyFormat) || '{{amount}}') {
      const value = Number(cents) / 100;
      const delimit = (decimals, thousands, decimal) => {
        const [integer, fraction] = value.toFixed(decimals).split('.');
        const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
        return fraction ? `${grouped}${decimal}${fraction}` : grouped;
      };
      return format.replace(/\{\{\s*(\w+)\s*\}\}/, (match, key) => {
        switch (key) {
          case 'amount':
            return delimit(2, ',', '.');
          case 'amount_no_decimals':
            return delimit(0, ',', '.');
          case 'amount_with_comma_separator':
            return delimit(2, '.', ',');
          case 'amount_no_decimals_with_comma_separator':
            return delimit(0, '.', ',');
          case 'amount_with_space_separator':
            return delimit(2, ' ', ',');
          case 'amount_with_period_and_space_separator':
            return delimit(2, ' ', '.');
          default:
            return match;
        }
      });
    },

    announce(message) {
      const region = document.getElementById('ThemeAnnouncer');
      if (!region || !message) return;
      region.textContent = '';
      window.setTimeout(() => {
        region.textContent = message;
      }, 50);
    },

    showToast(message) {
      const toast = document.querySelector('.toast');
      if (!toast || !message) return;
      toast.textContent = message;
      toast.hidden = false;
      window.clearTimeout(Theme.toastTimer);
      Theme.toastTimer = window.setTimeout(() => {
        toast.hidden = true;
      }, 4000);
    },

    async copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.className = 'visually-hidden';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        return copied;
      }
    }
  };

  window.Theme = Theme;

  class QuantityInput extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input');
      if (!this.input) return;
      this.querySelectorAll('button[name="plus"], button[name="minus"]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          const previous = this.input.value;
          if (button.name === 'plus') this.input.stepUp();
          else this.input.stepDown();
          if (previous !== this.input.value) {
            this.input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    }
  }

  class MenuDrawer extends HTMLElement {
    connectedCallback() {
      this.toggle = document.querySelector(`[aria-controls="${this.id}"]`);
      if (!this.toggle) return;
      this.onToggleClick = () => (this.classList.contains('is-open') ? this.close() : this.open());
      this.toggle.addEventListener('click', this.onToggleClick);
      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.close();
      });
      this.addEventListener('click', (event) => {
        if (event.target.closest('[data-menu-close]')) this.close();
      });
    }

    disconnectedCallback() {
      if (this.toggle) this.toggle.removeEventListener('click', this.onToggleClick);
      if (this.classList.contains('is-open')) Theme.unlockScroll();
    }

    open() {
      window.clearTimeout(this.hideTimer);
      this.hidden = false;
      void this.offsetWidth;
      this.classList.add('is-open');
      this.toggle.setAttribute('aria-expanded', 'true');
      Theme.lockScroll();
      Theme.trapFocus(this, this.querySelector('.menu-drawer__nav a, .menu-drawer__nav summary, button'));
    }

    close() {
      if (!this.classList.contains('is-open')) return;
      this.classList.remove('is-open');
      this.toggle.setAttribute('aria-expanded', 'false');
      Theme.unlockScroll();
      Theme.removeTrapFocus(this.toggle);
      this.hideTimer = window.setTimeout(() => {
        this.hidden = true;
      }, Theme.prefersReducedMotion() ? 0 : DRAWER_ANIMATION_MS);
    }
  }

  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll('[data-announcement-slide]'));
      this.toggle = this.querySelector('[data-announcement-toggle]');
      if (this.slides.length < 2) return;
      this.index = 0;
      this.userPaused = Theme.prefersReducedMotion();
      this.hoverPaused = false;

      this.addEventListener('mouseenter', () => {
        this.hoverPaused = true;
      });
      this.addEventListener('mouseleave', () => {
        this.hoverPaused = false;
      });
      this.addEventListener('focusin', () => {
        this.hoverPaused = true;
      });
      this.addEventListener('focusout', (event) => {
        if (!this.contains(event.relatedTarget)) this.hoverPaused = false;
      });
      if (this.toggle) {
        this.toggle.addEventListener('click', () => {
          this.userPaused = !this.userPaused;
          this.updateToggle();
        });
      }

      this.updateToggle();
      this.timer = window.setInterval(() => {
        if (!this.userPaused && !this.hoverPaused && !document.hidden) this.next();
      }, ANNOUNCEMENT_ROTATION_MS);
    }

    disconnectedCallback() {
      window.clearInterval(this.timer);
    }

    next() {
      const current = this.slides[this.index];
      current.classList.remove('is-active');
      current.setAttribute('aria-hidden', 'true');
      this.index = (this.index + 1) % this.slides.length;
      const upcoming = this.slides[this.index];
      upcoming.classList.add('is-active');
      upcoming.removeAttribute('aria-hidden');
    }

    updateToggle() {
      if (!this.toggle) return;
      this.toggle.classList.toggle('is-paused', this.userPaused);
      this.toggle.setAttribute('aria-label', this.userPaused ? this.toggle.dataset.labelPlay : this.toggle.dataset.labelPause);
    }
  }

  class ProductTabs extends HTMLElement {
    connectedCallback() {
      this.tablist = this.querySelector('[role="tablist"]');
      this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
      this.items = Array.from(this.querySelectorAll('[data-tab-item]'));
      if (!this.tablist || this.tabs.length !== this.items.length) return;
      this.current = 0;
      this.tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => this.select(index, false));
        tab.addEventListener('keydown', (event) => this.onKeydown(event, index));
      });
      this.onMediaChange = () => this.setMode(desktopQuery.matches);
      desktopQuery.addEventListener('change', this.onMediaChange);
      this.setMode(desktopQuery.matches);
    }

    disconnectedCallback() {
      if (this.onMediaChange) desktopQuery.removeEventListener('change', this.onMediaChange);
    }

    setMode(useTabs) {
      this.classList.toggle('is-tabs', useTabs);
      this.tablist.hidden = !useTabs;
      this.items.forEach((item, index) => {
        const panel = item.querySelector('[data-tab-panel]');
        if (useTabs) {
          item.open = true;
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', this.tabs[index].id);
          panel.setAttribute('tabindex', '0');
        } else {
          item.hidden = false;
          item.open = index === this.current;
          panel.removeAttribute('role');
          panel.removeAttribute('aria-labelledby');
          panel.removeAttribute('tabindex');
        }
      });
      if (useTabs) this.select(this.current, false);
    }

    select(index, moveFocus) {
      this.current = index;
      this.tabs.forEach((tab, position) => {
        const selected = position === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      this.items.forEach((item, position) => {
        item.hidden = position !== index;
      });
      if (moveFocus) this.tabs[index].focus();
    }

    onKeydown(event, index) {
      const last = this.tabs.length - 1;
      const targets = {
        ArrowRight: index === last ? 0 : index + 1,
        ArrowLeft: index === 0 ? last : index - 1,
        Home: 0,
        End: last
      };
      if (!(event.key in targets)) return;
      event.preventDefault();
      this.select(targets[event.key], true);
    }
  }

  if (!customElements.get('quantity-input')) customElements.define('quantity-input', QuantityInput);
  if (!customElements.get('menu-drawer')) customElements.define('menu-drawer', MenuDrawer);
  if (!customElements.get('announcement-bar')) customElements.define('announcement-bar', AnnouncementBar);
  if (!customElements.get('product-tabs')) customElements.define('product-tabs', ProductTabs);

  function initReveal(root = document) {
    const items = root.querySelectorAll('.reveal:not(.is-visible)');
    if (!items.length) return;
    if (Theme.prefersReducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    items.forEach((item) => observer.observe(item));
  }

  function initHeaderShadow() {
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const header = document.querySelector('.header');
          if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  function initHeaderSubmenus(root = document) {
    root.querySelectorAll('[data-header-submenu]').forEach((details) => {
      if (details.dataset.ready) return;
      details.dataset.ready = 'true';
      const summary = details.querySelector('summary');
      details.addEventListener('mouseenter', () => {
        if (!hoverQuery.matches || details.open) return;
        details.open = true;
        details.dataset.hoverOpen = 'true';
      });
      details.addEventListener('mouseleave', () => {
        if (!hoverQuery.matches) return;
        details.open = false;
        delete details.dataset.hoverOpen;
      });
      summary.addEventListener('click', (event) => {
        if (details.dataset.hoverOpen) {
          event.preventDefault();
          delete details.dataset.hoverOpen;
        }
      });
      details.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !details.open) return;
        details.open = false;
        summary.focus();
      });
      details.addEventListener('focusout', (event) => {
        if (!details.contains(event.relatedTarget)) details.open = false;
      });
    });
  }

  function syncFooterDetails() {
    document.querySelectorAll('[data-footer-details]').forEach((details) => {
      details.open = desktopQuery.matches;
    });
  }

  function initVideos(root = document) {
    root.querySelectorAll('[data-autoplay-video]').forEach((wrapper) => {
      const video = wrapper.querySelector('video');
      if (!video || wrapper.dataset.videoReady) return;
      wrapper.dataset.videoReady = 'true';
      const toggle = document.querySelector(`[data-video-toggle][aria-controls="${wrapper.id}"]`);
      let userPaused = Theme.prefersReducedMotion();

      video.muted = true;
      video.loop = true;
      video.playsInline = true;

      const setState = (playing) => {
        if (playing) wrapper.classList.add('is-playing');
        if (!toggle) return;
        toggle.classList.toggle('is-paused', !playing);
        toggle.setAttribute('aria-label', playing ? toggle.dataset.labelPause : toggle.dataset.labelPlay);
      };
      const play = () => {
        const attempt = video.play();
        if (attempt && attempt.catch) attempt.catch(() => setState(false));
      };

      video.addEventListener('playing', () => setState(true));
      video.addEventListener('pause', () => setState(false));
      setState(false);

      if (toggle) {
        toggle.addEventListener('click', () => {
          if (video.paused) {
            userPaused = false;
            play();
          } else {
            userPaused = true;
            video.pause();
          }
        });
      }

      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!userPaused) play();
            } else if (!video.paused) {
              video.pause();
            }
          });
        }).observe(wrapper);
      } else if (!userPaused) {
        play();
      }
    });
  }

  function initQrCodes() {
    document.querySelectorAll('[data-qr-identifier]').forEach((element) => {
      if (element.dataset.ready || typeof window.QRCode !== 'function') return;
      element.dataset.ready = 'true';
      new window.QRCode(element, { text: element.dataset.qrIdentifier, width: 120, height: 120 });
    });
  }

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-sort-select]');
    if (!select || !select.form) return;
    if (typeof select.form.requestSubmit === 'function') select.form.requestSubmit();
    else select.form.submit();
  });

  document.addEventListener('click', async (event) => {
    const share = event.target.closest('[data-share]');
    if (share) {
      const url = share.dataset.shareUrl || window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({ title: share.dataset.shareTitle || document.title, url });
        } catch (error) {
          /* Partage annulé par le visiteur : rien à faire. */
        }
        return;
      }
      if (await Theme.copyText(url)) Theme.showToast(share.dataset.copiedLabel || strings.linkCopied);
      return;
    }

    const copy = event.target.closest('[data-copy-text]');
    if (copy) {
      if (await Theme.copyText(copy.dataset.copyText)) Theme.showToast(copy.dataset.copiedLabel);
      return;
    }

    if (event.target.closest('[data-print]')) window.print();

    document.querySelectorAll('[data-header-submenu][open]').forEach((details) => {
      if (!details.contains(event.target)) details.open = false;
    });
  });

  desktopQuery.addEventListener('change', syncFooterDetails);

  function init() {
    initReveal();
    initHeaderShadow();
    initHeaderSubmenus();
    syncFooterDetails();
    initVideos();
    initQrCodes();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('shopify:section:load', (event) => {
    initReveal(event.target);
    initHeaderSubmenus(event.target);
    initVideos(event.target);
    syncFooterDetails();
  });
})();
