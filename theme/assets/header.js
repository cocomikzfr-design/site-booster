// assets/header.js : bandeau d'annonce, états du header, menu plein écran, ouverture de la recherche,
// pastille du panier (compteur mécanique + rebond).
import { subscribe, isReduced, EASE, EASE_IO, EASE_BACK } from 'motion-core';
import { openLayer, t } from 'ui';
import { swapMaskedText } from 'masked-text';

const html = document.documentElement;

/* ---------- Bandeau d'annonce : défilement vertical toutes les 5 s ---------- */
function initAnnounce(bar) {
  const msgs = [...bar.querySelectorAll('.announce__msg')];
  const btn = bar.querySelector('[data-announce-pause]');
  if (msgs.length < 2 || isReduced()) { if (btn) btn.hidden = isReduced(); return; }
  let i = 0, hold = false, paused = false;
  bar.addEventListener('pointerenter', () => { hold = true; });
  bar.addEventListener('pointerleave', () => { hold = false; });
  bar.addEventListener('focusin', () => { hold = true; });
  bar.addEventListener('focusout', () => { hold = false; });
  if (btn) btn.addEventListener('click', () => {
    paused = !paused; btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? t('play') : t('pause'));
  });
  setInterval(() => {
    if (hold || paused || document.hidden) return;
    const cur = msgs[i]; i = (i + 1) % msgs.length; const next = msgs[i];
    const o = { duration: 700, easing: EASE_IO, fill: 'forwards' };
    cur.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-105%)' }], o);
    next.animate([{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], o);
    msgs.forEach((m) => m.setAttribute('aria-hidden', String(m !== next)));
    msgs.forEach((m) => { if (m.tagName === 'A') m.tabIndex = m === next ? 0 : -1; });
  }, 5000);
  msgs.forEach((m, k) => { if (k) { m.setAttribute('aria-hidden', 'true'); if (m.tagName === 'A') m.tabIndex = -1; } });
}

/* ---------- Header : transparent sur la vitrine, caché en descendant ailleurs ---------- */
function initHeader(hdr) {
  const sectionEl = hdr.closest('.hdr-section') || hdr.parentElement;
  const first = document.querySelector('main > .shopify-section:first-child .vitrine');
  if (first) {
    // Accueil : le fond papier descend quand on quitte la vitrine
    const io = new IntersectionObserver(([e]) => hdr.classList.toggle('is-solid', !e.isIntersecting),
      { rootMargin: `-${hdr.offsetHeight + 2}px 0px 0px 0px` });
    io.observe(first);
    return;
  }
  let lastY = scrollY, queued = false;
  const check = () => {
    queued = false;
    const y = scrollY, dy = y - lastY;
    if (Math.abs(dy) > 6) {
      const hide = dy > 0 && y > hdr.offsetHeight * 2 && !html.classList.contains('has-layer');
      sectionEl.classList.toggle('is-hidden', hide);
      lastY = y;
    }
    return false;
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; subscribe(check); } }, { passive: true });
  hdr.addEventListener('focusin', () => sectionEl.classList.remove('is-hidden'));
}

/* ---------- Menu plein écran : clip-path circle() depuis le bouton ---------- */
function initMenu() {
  const menu = document.querySelector('[data-menu]');
  const btn = document.querySelector('[data-menu-open]');
  if (!menu || !btn) return;
  let layer = null, busy = false;
  const origin = () => { const r = btn.getBoundingClientRect(); return `${r.left + r.width / 2}px ${r.top + r.height / 2}px`; };
  function open() {
    if (layer || busy) return;
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    layer = openLayer(menu, { opener: btn, onEsc: close });
    if (isReduced()) return;
    const at = origin();
    menu.animate([{ clipPath: `circle(0px at ${at})` }, { clipPath: `circle(150% at ${at})` }], { duration: 800, easing: EASE_IO });
    menu.querySelectorAll('.menu__link .line > span').forEach((s, i) => {
      s.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 800, delay: 200 + i * 60, easing: EASE, fill: 'backwards' });
    });
  }
  async function close() {
    if (!layer || busy) return;
    busy = true;
    if (!isReduced()) {
      const at = origin();
      await menu.animate([{ clipPath: `circle(150% at ${at})` }, { clipPath: `circle(0px at ${at})` }], { duration: 600, easing: EASE_IO }).finished.catch(() => {});
    }
    menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
    layer.close(); layer = null; busy = false;
  }
  btn.addEventListener('click', open);
  menu.querySelector('[data-menu-close]').addEventListener('click', close);
  menu.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) close(); });
}

/* ---------- Recherche : le module de recherche instantanée est chargé à la première ouverture ---------- */
function initSearch() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-search-open]');
    if (!trigger || !document.querySelector('[data-search-panel]')) return;
    e.preventDefault();
    import('predictive-search').then((m) => m.openSearch(trigger));
  });
}

/* ---------- Pastille du panier : compteur mécanique et rebond ---------- */
function updateBubble(count, bump = true) {
  const bubble = document.querySelector('[data-cart-bubble]');
  const label = document.querySelector('[data-cart-label]');
  if (!bubble) return;
  const mask = bubble.querySelector('.mask');
  const old = parseInt(mask.textContent, 10) || 0;
  if (label && window.theme.strings.cartCount) label.textContent = t('cartCount', { count });
  bubble.hidden = count === 0;
  if (count !== old) swapMaskedText(mask, String(count), count > old ? 1 : -1);
  if (bump && count > 0 && !isReduced()) {
    bubble.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 600, easing: EASE_BACK });
  }
}
document.addEventListener('cart:count', (e) => updateBubble(e.detail.count, e.detail.bump !== false));

document.querySelectorAll('[data-announce]').forEach(initAnnounce);
document.querySelectorAll('[data-header]').forEach(initHeader);
initMenu();
initSearch();
document.addEventListener('shopify:section:load', (e) => {
  e.target.querySelectorAll('[data-announce]').forEach(initAnnounce);
  if (e.target.querySelector('[data-header]')) { e.target.querySelectorAll('[data-header]').forEach(initHeader); initMenu(); }
});

/* ---------- Footer : le nom géant monte en parallaxe ---------- */
const giant = document.querySelector('[data-giant]');
if (giant && !isReduced()) {
  let active = false;
  const tick = () => {
    const r = giant.parentElement.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.6)));
    giant.style.setProperty('--py', `${((1 - p) * 60).toFixed(1)}%`);
    return false;
  };
  new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active) subscribe(tick); }).observe(giant.parentElement);
  addEventListener('scroll', () => { if (active) subscribe(tick); }, { passive: true });
}
