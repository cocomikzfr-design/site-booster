/* ==========================================================================
   ChocoCards — cart.js (chargé sur toutes les pages)
   --------------------------------------------------------------------------
   - Ajout au panier en AJAX (Cart API /cart/add.js) pour tous les
     formulaires [data-product-form] : fiches produit, cartes des carrousels…
   - La carte "vole" jusqu'à l'icône du panier, le badge rebondit et le
     tiroir panier s'ouvre (si le type de panier choisi est "tiroir").
   - <cart-items> : quantités / suppression dans le tiroir et sur la page panier
     (/cart/change.js + Section Rendering API pour réafficher le contenu).
   ========================================================================== */
import { theme, motionOK, $, $$, toast, icon, sectionInnerHTML, debounce } from '@theme/utils';

const routes = theme.routes || {};
const strings = theme.strings || {};
const DRAWER_SECTIONS = ['cart-drawer', 'cart-icon-bubble'];

/* Remplace le contenu des sections du panier après une mise à jour */
function renderSections(sections) {
  if (!sections) return;
  if (sections['cart-icon-bubble']) {
    const bubble = document.getElementById('cart-icon-bubble');
    if (bubble) bubble.innerHTML = sectionInnerHTML(sections['cart-icon-bubble']);
  }
  if (sections['cart-drawer']) {
    const target = document.getElementById('CartDrawerContents');
    const doc = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
    const fresh = doc.getElementById('CartDrawerContents');
    if (target && fresh) target.innerHTML = fresh.innerHTML;
  }
  $$('cart-items[data-section]').forEach((el) => {
    const id = el.dataset.section;
    if (!sections[id] || id === 'cart-drawer') return;
    const doc = new DOMParser().parseFromString(sections[id], 'text/html');
    const fresh = doc.querySelector(`cart-items[data-section="${id}"]`);
    if (fresh) el.innerHTML = fresh.innerHTML;
  });
}

function bumpBubble() {
  const btn = $('[data-cart-button]');
  const badge = $('.cart-btn__count', btn || document);
  if (!btn || !motionOK) return;
  [btn, badge].forEach((n) => {
    if (!n) return;
    n.classList.remove('is-bump');
    void n.offsetWidth;
    n.classList.add('is-bump');
  });
}

/* Animation : la carte du produit vole vers l'icône du panier */
function flyToCart(form) {
  return new Promise((resolve) => {
    const target = $('[data-cart-button]');
    const img = form.closest('[data-product-card], product-info, .preorder__product')?.querySelector('img');
    if (!target || !img || !motionOK || !img.getBoundingClientRect().width) { resolve(); return; }
    const s = img.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const size = Math.min(s.width, 160);
    const fly = document.createElement('div');
    fly.className = 'fly-card';
    fly.setAttribute('aria-hidden', 'true');
    Object.assign(fly.style, {
      left: `${s.left + (s.width - size) / 2}px`,
      top: `${s.top + (s.height - size * 1.4) / 2}px`,
      width: `${size}px`,
      height: `${size * 1.4}px`,
      backgroundImage: `url("${img.currentSrc || img.src}")`
    });
    document.body.appendChild(fly);
    const dx = t.left + t.width / 2 - (s.left + s.width / 2);
    const dy = t.top + t.height / 2 - (s.top + s.height / 2);
    const anim = fly.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 140}px) scale(.75) rotate(-14deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.1) rotate(18deg)`, opacity: 0.4 }
    ], { duration: 900, easing: 'cubic-bezier(.55,0,.25,1)' });
    anim.onfinish = () => { fly.remove(); resolve(); };
  });
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer && typeof drawer.open === 'function') drawer.open($('[data-cart-button]'));
}

/* ---------- Ajout au panier ---------- */
async function addToCart(form, submitter) {
  const button = submitter || form.querySelector('[type="submit"]');
  const errorBox = form.querySelector('[data-form-error]');
  if (button?.getAttribute('aria-disabled') === 'true' || button?.disabled) return;
  button?.classList.add('is-loading');
  button?.setAttribute('aria-busy', 'true');
  if (errorBox) errorBox.hidden = true;

  const body = new FormData(form);
  body.append('sections', DRAWER_SECTIONS.join(','));
  body.append('sections_url', window.location.pathname);

  try {
    const response = await fetch(`${routes.cart_add_url}`, {
      method: 'POST',
      headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
      body
    });
    const data = await response.json();
    if (data.status) {
      const message = data.description || data.message || strings.cartError;
      if (errorBox) { errorBox.textContent = message; errorBox.hidden = false; }
      else toast(`${icon('alert')}<span class="toast__text">${message}</span>`);
      return;
    }
    await flyToCart(form);
    renderSections(data.sections);
    bumpBubble();
    if (theme.settings.cartType === 'drawer') openCartDrawer();
    else {
      toast(`${icon('check')}<span class="toast__text"><strong>${strings.added || 'Ajouté au panier'} :</strong> ${data.product_title || ''}</span><a class="btn btn--light btn--sm" href="${routes.cart_url}">${strings.viewCart || 'Voir le panier'}</a>`);
    }
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
  } catch (err) {
    console.error(err);
    toast(`${icon('alert')}<span class="toast__text">${strings.cartError || 'Une erreur est survenue.'}</span>`);
  } finally {
    button?.classList.remove('is-loading');
    button?.removeAttribute('aria-busy');
  }
}

document.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-product-form]');
  if (!form || theme.settings.cartType === 'page') return;
  event.preventDefault();
  addToCart(form, event.submitter);
});

/* ---------- Quantités / suppression ---------- */
class CartItems extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-qty-change]');
      if (btn) {
        const input = this.querySelector(`input[data-line="${btn.dataset.line}"]`);
        const next = Math.max(0, Number(input?.value || 0) + Number(btn.dataset.qtyChange));
        if (input) input.value = next;
        this.update(btn.dataset.line, next, btn);
        return;
      }
      const remove = e.target.closest('[data-line-remove]');
      if (remove) { e.preventDefault(); this.update(remove.dataset.lineRemove, 0, remove); }
    });
    this.onInput = debounce((input) => this.update(input.dataset.line, Number(input.value), input), 400);
    this.addEventListener('change', (e) => {
      if (e.target.matches('input[data-line]')) this.onInput(e.target);
      if (e.target.matches('[name="note"]')) this.saveNote(e.target.value);
    });
  }

  get sections() {
    const own = this.dataset.section;
    return Array.from(new Set([...DRAWER_SECTIONS, ...(own && own !== 'cart-drawer' ? [own] : [])]));
  }

  async update(line, quantity, source) {
    const wrapper = this.querySelector('.cart') || this;
    wrapper.classList.add('is-loading');
    const focusKey = source?.dataset?.focusKey;
    try {
      const response = await fetch(`${routes.cart_change_url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line: Number(line), quantity, sections: this.sections, sections_url: window.location.pathname })
      });
      const data = await response.json();
      if (data.status || data.errors) {
        toast(`${icon('alert')}<span class="toast__text">${data.description || data.errors || strings.cartError}</span>`);
        return;
      }
      renderSections(data.sections);
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
      // Garde le focus clavier au même endroit après le rafraîchissement
      const again = focusKey && document.querySelector(`[data-focus-key="${focusKey}"]`);
      (again || this.querySelector('a, button'))?.focus?.();
    } catch (err) {
      console.error(err);
      toast(`${icon('alert')}<span class="toast__text">${strings.cartError || 'Une erreur est survenue.'}</span>`);
    } finally {
      (this.querySelector('.cart') || this).classList.remove('is-loading');
    }
  }

  saveNote(note) {
    fetch(`${routes.cart_update_url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ note })
    }).catch(() => {});
  }
}
customElements.define('cart-items', CartItems);
