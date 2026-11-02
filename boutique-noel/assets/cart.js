/* Noël en Façade — tiroir panier, ajout et modification du panier sans rechargement (Section Rendering API). */
(() => {
  const config = window.themeConfig || {};
  const routes = config.routes || {};
  const strings = config.strings || {};
  const DRAWER_ANIMATION_MS = 250;
  const CHANGE_DEBOUNCE_MS = 300;
  const parser = new DOMParser();
  const pendingChanges = new Map();

  const getDrawer = () => document.querySelector('cart-drawer');
  const parse = (html) => parser.parseFromString(html, 'text/html');

  function sectionsToRender() {
    const ids = [];
    if (getDrawer()) ids.push('cart-drawer');
    ids.push('cart-icon-bubble');
    document.querySelectorAll('[data-main-cart]').forEach((section) => {
      if (section.dataset.sectionId) ids.push(section.dataset.sectionId);
    });
    return ids;
  }

  function replaceInner(container, html, selector) {
    if (!container || !html) return;
    const fresh = parse(html).querySelector(selector);
    const current = container.querySelector(selector);
    if (fresh && current) current.replaceWith(fresh);
  }

  function renderSections(sections) {
    if (!sections) return;
    const drawer = getDrawer();
    if (drawer && sections['cart-drawer']) drawer.renderContents(sections['cart-drawer']);

    if (sections['cart-icon-bubble']) {
      const bubble = document.getElementById('cart-icon-bubble');
      const fresh = parse(sections['cart-icon-bubble']).querySelector('.shopify-section');
      if (bubble && fresh) bubble.innerHTML = fresh.innerHTML;
    }

    document.querySelectorAll('[data-main-cart]').forEach((section) => {
      replaceInner(section, sections[section.dataset.sectionId], '[data-cart-inner]');
    });
  }

  function focusSnapshot() {
    const active = document.activeElement;
    if (!active || active === document.body) return null;
    const line = active.closest('[data-line]');
    return {
      id: active.id,
      line: line ? line.dataset.line : null,
      inDrawer: Boolean(active.closest('cart-drawer'))
    };
  }

  function restoreFocus(snapshot) {
    const active = document.activeElement;
    if (!snapshot || (active && active !== document.body && document.contains(active))) return;
    const scope = snapshot.inDrawer ? getDrawer() : document;
    let target = snapshot.id ? document.getElementById(snapshot.id) : null;
    if (!target && snapshot.line && scope) target = scope.querySelector(`[data-line="${snapshot.line}"] input`);
    if (!target && snapshot.inDrawer) target = document.getElementById('CartDrawerTitle');
    if (target) target.focus({ preventScroll: true });
  }

  function showLineError(key, line, message) {
    const selector = key ? `[data-key="${CSS.escape(key)}"] [data-line-error]` : `[data-line="${line}"] [data-line-error]`;
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = message;
    });
  }

  function setBusy(button, busy) {
    if (!button) return;
    if (busy) {
      button.dataset.labelBackup = button.getAttribute('aria-label') || '';
      button.setAttribute('aria-busy', 'true');
      if (strings.adding) button.setAttribute('aria-label', strings.adding);
      button.disabled = true;
      return;
    }
    button.removeAttribute('aria-busy');
    if (button.dataset.labelBackup) button.setAttribute('aria-label', button.dataset.labelBackup);
    else button.removeAttribute('aria-label');
    delete button.dataset.labelBackup;
    button.disabled = false;
  }

  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.close();
      });
      this.addEventListener('click', (event) => {
        if (event.target.closest('[data-drawer-close]')) this.close();
      });
    }

    isOpen() {
      return this.classList.contains('is-open');
    }

    open(trigger) {
      const title = this.querySelector('#CartDrawerTitle');
      if (this.isOpen()) {
        if (title) title.focus({ preventScroll: true });
        return;
      }
      window.clearTimeout(this.hideTimer);
      this.trigger = trigger || document.activeElement;
      this.hidden = false;
      void this.offsetWidth;
      this.classList.add('is-open');
      window.Theme.lockScroll();
      window.Theme.trapFocus(this, title);
    }

    close() {
      if (!this.isOpen()) return;
      this.classList.remove('is-open');
      window.Theme.unlockScroll();
      const trigger = this.trigger && document.contains(this.trigger) ? this.trigger : document.getElementById('cart-icon-bubble');
      window.Theme.removeTrapFocus(trigger);
      this.hideTimer = window.setTimeout(() => {
        this.hidden = true;
      }, window.Theme.prefersReducedMotion() ? 0 : DRAWER_ANIMATION_MS);
    }

    renderContents(html) {
      replaceInner(this, html, '[data-drawer-inner]');
    }
  }

  if (!customElements.get('cart-drawer')) customElements.define('cart-drawer', CartDrawer);

  async function addToCart(form, submitter) {
    const drawer = getDrawer();
    const button = submitter || form.querySelector('[name="add"]');
    const errorBox = form.querySelector('[data-form-error]');
    const formData = new FormData(form);
    formData.append('sections', sectionsToRender().join(','));
    formData.append('sections_url', window.location.pathname);

    setBusy(button, true);
    if (errorBox) errorBox.textContent = '';

    try {
      const response = await fetch(`${routes.cart_add_url}.js`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      });
      const data = await response.json();
      if (!response.ok || data.status) {
        throw new Error(data.description || data.message || strings.cartError);
      }

      if (config.cartType === 'page' || !drawer) {
        window.location.href = routes.cart_url;
        return;
      }

      const wasOpen = drawer.isOpen();
      renderSections(data.sections);
      drawer.open(button);
      if (wasOpen) window.Theme.showToast(strings.added);
      window.Theme.announce((strings.itemAdded || '').replace('[title]', data.product_title || ''));
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { source: 'add', item: data } }));
    } catch (error) {
      const message = error.message || strings.cartError;
      if (errorBox) errorBox.textContent = message;
      if (!errorBox || (button && !form.contains(button))) window.Theme.showToast(message);
    } finally {
      setBusy(button, false);
    }
  }

  async function changeLine(line, quantity) {
    const lineElement = document.querySelector(`[data-line="${line}"]`);
    const key = lineElement ? lineElement.dataset.key : null;
    const lists = document.querySelectorAll('[data-cart-items]');
    const subtotals = document.querySelectorAll('[data-cart-subtotal]');
    const snapshot = focusSnapshot();

    lists.forEach((list) => list.setAttribute('aria-busy', 'true'));
    subtotals.forEach((subtotal) => subtotal.classList.add('skeleton'));

    try {
      const response = await fetch(`${routes.cart_change_url}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          line,
          quantity,
          sections: sectionsToRender(),
          sections_url: window.location.pathname
        })
      });
      const data = await response.json();
      if (!response.ok || data.status) {
        throw new Error(data.description || data.message || strings.cartError);
      }

      renderSections(data.sections);
      restoreFocus(snapshot);

      const updated = key ? (data.items || []).find((item) => item.key === key) : null;
      if (quantity > 0 && updated && updated.quantity !== quantity) {
        showLineError(key, line, strings.quantityError);
      }
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { source: 'change', cart: data } }));
    } catch (error) {
      showLineError(key, line, error.message || strings.cartError);
    } finally {
      lists.forEach((list) => list.removeAttribute('aria-busy'));
      subtotals.forEach((subtotal) => subtotal.classList.remove('skeleton'));
    }
  }

  function scheduleChange(line, quantity) {
    window.clearTimeout(pendingChanges.get(line));
    pendingChanges.set(
      line,
      window.setTimeout(() => {
        pendingChanges.delete(line);
        changeLine(line, quantity);
      }, CHANGE_DEBOUNCE_MS)
    );
  }

  function onQuantityInput(event) {
    const input = event.target.closest('input[data-index]');
    if (!input || !input.closest('[data-cart-items]')) return;
    const quantity = parseInt(input.value, 10);
    if (Number.isNaN(quantity) || quantity < 0) return;
    if (String(quantity) === input.defaultValue && !pendingChanges.has(Number(input.dataset.index))) return;
    scheduleChange(Number(input.dataset.index), quantity);
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-type="add-to-cart-form"]');
    if (!form || typeof window.fetch !== 'function') return;
    event.preventDefault();
    addToCart(form, event.submitter);
  });

  document.addEventListener('change', onQuantityInput);
  document.addEventListener('input', onQuantityInput);

  document.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-cart-remove]');
    if (remove) {
      event.preventDefault();
      changeLine(Number(remove.dataset.index), 0);
      return;
    }

    const trigger = event.target.closest('[data-cart-trigger]');
    const drawer = getDrawer();
    if (trigger && drawer && config.cartType === 'drawer') {
      event.preventDefault();
      drawer.open(trigger);
    }
  });
})();
