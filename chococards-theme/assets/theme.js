/* ==========================================================================
   ChocoCards — theme.js (chargé sur toutes les pages)
   --------------------------------------------------------------------------
   01. Scroll fluide (Lenis) + ancres
   02. Header : hauteur, état "scrollé", méga-menu, listes pays / langue
   03. Tiroirs (menu mobile, filtres…)
   04. Effets : tilt holo, boutons magnétiques, curseur, bandeau défilant
   05. Apparitions au scroll, compteurs, compte à rebours
   06. Éditeur de thème (rechargement des sections)
   ========================================================================== */
import {
  theme, motionOK, finePointer, isDesignMode, $, $$, clamp,
  loadScript, lockScroll, unlockScroll, focusables, trapFocus, scrollToElement
} from '@theme/utils';

const root = document.documentElement;
const S = theme.settings || {};

/* ---------- 01. Scroll fluide ---------- */

async function initSmoothScroll() {
  // Sur écran tactile, le défilement natif est déjà fluide : Lenis n'est pas chargé
  if (!S.smoothScroll || !motionOK || !finePointer || isDesignMode || !theme.assets.lenis) return;
  try { await loadScript(theme.assets.lenis); } catch { return; }
  if (typeof window.Lenis !== 'function') return;
  const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
  theme.lenis = lenis;
  root.classList.add('lenis');
  if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

function initAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="#"]');
    if (!link || event.defaultPrevented) return;
    const url = new URL(link.href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash || url.hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    document.querySelectorAll('side-drawer[open]').forEach((d) => d.close());
    scrollToElement(target);
    history.replaceState(null, '', url.hash);
  });
}

/* ---------- 02. Header ---------- */

function initHeader() {
  const header = $('[data-header]');
  if (!header) return;
  // ResizeObserver se déclenche après la mise en page : pas de calcul forcé au chargement
  const setHeight = (h) => root.style.setProperty('--header-h', `${Math.round(h)}px`);
  if ('ResizeObserver' in window) {
    new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize?.[0]?.blockSize ?? header.offsetHeight)).observe(header);
  } else {
    setHeight(header.offsetHeight);
  }
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
  requestAnimationFrame(onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* Méga-menu : <details> ouverts au survol (souris) ou au clic / clavier */
class HeaderMenu extends HTMLElement {
  connectedCallback() {
    this.items = $$('details.mega__item', this);
    this.items.forEach((item) => {
      item.addEventListener('toggle', () => { if (item.open) this.items.forEach((o) => { if (o !== item) o.open = false; }); });
      if (!finePointer) return;
      let openTimer; let closeTimer;
      item.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(closeTimer);
        openTimer = setTimeout(() => { item.open = true; item._hoverOpened = performance.now(); }, 80);
      });
      item.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(openTimer);
        closeTimer = setTimeout(() => { item.open = false; }, 180);
      });
      // Un clic juste après l'ouverture au survol ne doit pas refermer le menu
      item.querySelector('summary').addEventListener('click', (e) => {
        if (item.open && performance.now() - (item._hoverOpened || 0) < 450) e.preventDefault();
      });
    });
    this.onDocClick = (e) => { if (!this.contains(e.target)) this.closeAll(); };
    this.onKey = (e) => {
      if (e.key !== 'Escape') return;
      const open = this.items.find((i) => i.open);
      if (open) { open.open = false; open.querySelector('summary').focus(); }
    };
    this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this.closeAll(); });
    document.addEventListener('click', this.onDocClick);
    document.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    document.removeEventListener('click', this.onDocClick);
    document.removeEventListener('keydown', this.onKey);
  }
  closeAll() { this.items.forEach((i) => { i.open = false; }); }
}
customElements.define('header-menu', HeaderMenu);

/* Listes déroulantes <details class="dropdown"> (pays, langue, tri…) */
function initDropdowns() {
  document.addEventListener('click', (e) => {
    $$('details.dropdown[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    $$('details.dropdown[open]').forEach((d) => { d.open = false; d.querySelector('summary')?.focus(); });
  });
}

/* ---------- 03. Tiroirs ---------- */

class SideDrawer extends HTMLElement {
  connectedCallback() {
    this.panel = $('.drawer__panel', this);
    this.addEventListener('click', (e) => { if (e.target.closest('[data-drawer-close]')) this.close(); });
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      trapFocus(this.panel, e);
    });
  }
  get isOpen() { return this.hasAttribute('open'); }
  open(trigger) {
    if (this.isOpen) return;
    this.trigger = trigger || document.activeElement;
    this.hidden = false;
    this.setAttribute('open', '');
    lockScroll();
    requestAnimationFrame(() => requestAnimationFrame(() => this.classList.add('is-open')));
    if (this.trigger?.setAttribute) this.trigger.setAttribute('aria-expanded', 'true');
    setTimeout(() => focusables(this.panel)[0]?.focus(), 80);
    this.dispatchEvent(new CustomEvent('drawer:open', { bubbles: true }));
  }
  close() {
    if (!this.isOpen) return;
    this.removeAttribute('open');
    this.classList.remove('is-open');
    unlockScroll();
    if (this.trigger?.setAttribute) this.trigger.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!this.isOpen) this.hidden = true; }, 560);
    this.trigger?.focus?.();
  }
}
customElements.define('side-drawer', SideDrawer);

function initDrawerTriggers() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-drawer-open]');
    if (!trigger) return;
    const drawer = document.getElementById(trigger.dataset.drawerOpen);
    if (!drawer?.open) return;
    e.preventDefault();
    $$('side-drawer[open]').forEach((d) => { if (d !== drawer) d.close(); });
    drawer.open(trigger);
  });
}

/* ---------- 04. Effets ---------- */

/* Tilt 3D + reflet holographique (délégation : fonctionne aussi après rechargement de section) */
function initTilt() {
  if (!S.holo || !finePointer || !motionOK) return;
  let el = null; let rect = null; let raf = 0; let px = 0; let py = 0;
  const reset = (node) => {
    node.classList.remove('is-tilting');
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
    node.style.setProperty('--o', '0');
  };
  const update = () => {
    raf = 0;
    if (!el || !rect) return;
    const x = clamp((px - rect.left) / rect.width, 0, 1);
    const y = clamp((py - rect.top) / rect.height, 0, 1);
    const max = parseFloat(el.dataset.tiltMax) || 10;
    el.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
    el.style.setProperty('--o', '1');
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const target = e.target.closest?.('[data-tilt]') || null;
    if (target !== el) {
      if (el) reset(el);
      el = target;
      if (el) { rect = el.getBoundingClientRect(); el.classList.add('is-tilting'); }
    }
    if (!el) return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  root.addEventListener('pointerleave', () => { if (el) { reset(el); el = null; } });
  window.addEventListener('scroll', () => { if (el) rect = el.getBoundingClientRect(); }, { passive: true });
}

function initMagnetic() {
  if (!finePointer || !motionOK) return;
  let el = null;
  const release = (node) => {
    node.classList.remove('is-magnet');
    node.style.setProperty('--tx', '0px');
    node.style.setProperty('--ty', '0px');
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const target = e.target.closest?.('[data-magnetic]') || null;
    if (target !== el) { if (el) release(el); el = target; if (el) el.classList.add('is-magnet'); }
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--tx', `${((e.clientX - (r.left + r.width / 2)) * 0.25).toFixed(1)}px`);
    el.style.setProperty('--ty', `${((e.clientY - (r.top + r.height / 2)) * 0.35).toFixed(1)}px`);
  }, { passive: true });
}

function initCursor() {
  if (!S.cursor || !finePointer || !motionOK || isDesignMode) return;
  const cursor = $('[data-cursor]');
  if (!cursor) return;
  const dot = $('.cursor__dot', cursor);
  const ring = $('.cursor__ring', cursor);
  root.classList.add('has-cursor');
  cursor.classList.add('is-hidden');
  let x = -100; let y = -100; let rx = -100; let ry = -100; let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; rx = x; ry = y; cursor.classList.remove('is-hidden'); }
    cursor.classList.toggle('is-hover', Boolean(e.target.closest?.('a, button, summary, label, select, [role="option"]')));
  }, { passive: true });
  root.addEventListener('pointerleave', () => { shown = false; cursor.classList.add('is-hidden'); });
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  const loop = () => {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* Bandeau défilant : duplique le contenu pour une boucle sans couture */
class MarqueeBand extends HTMLElement {
  connectedCallback() {
    // Duplication faite quand le navigateur est libre (évite un calcul de mise en page au chargement)
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    idle(() => this.fill(), { timeout: 1500 });
  }
  fill() {
    if (this.dataset.ready || !this.isConnected) return;
    const track = $('.marquee__track', this);
    if (!track) return;
    this.dataset.ready = '1';
    const originals = Array.from(track.children);
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.2 && guard < 8 && originals.length) {
      originals.forEach((li) => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
      guard += 1;
    }
    const copy = track.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    this.appendChild(copy);
    const speed = Number(this.dataset.speed) || 55;
    this.style.setProperty('--speed', `${Math.round(track.scrollWidth / speed)}s`);
  }
}
customElements.define('marquee-band', MarqueeBand);

/* ---------- 05. Apparitions, compteurs, compte à rebours ---------- */

let revealObserver = null;
function reveal(el) {
  el.classList.add('is-revealed');
  const count = el.hasAttribute('data-reveal-stagger') ? el.children.length : 1;
  setTimeout(() => el.classList.add('reveal-done'), 1300 + count * 90);
}
function initReveal(scope = document) {
  $$('[data-reveal-stagger]', scope).forEach((group) => {
    Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i));
  });
  const els = $$('[data-reveal], [data-reveal-stagger], .release', scope).filter((el) => !el.classList.contains('is-revealed'));
  if (!S.reveal || !motionOK || isDesignMode || !('IntersectionObserver' in window)) { els.forEach(reveal); return; }
  revealObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { reveal(entry.target); revealObserver.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
  els.forEach((el) => revealObserver.observe(el));
}

/* <count-up data-to="100" data-suffix=" %"> : compteur animé à l'apparition */
class CountUp extends HTMLElement {
  connectedCallback() {
    const end = Number(this.dataset.to) || 0;
    const suffix = this.dataset.suffix || '';
    if (!motionOK || isDesignMode || !('IntersectionObserver' in window)) { this.textContent = `${end}${suffix}`; return; }
    this.textContent = `0${suffix}`;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1800);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        this.textContent = `${Math.round(end * eased)}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(this);
  }
}
customElements.define('count-up', CountUp);

/* <count-down data-target="2026-11-06T00:00:00+01:00"> */
class CountDown extends HTMLElement {
  connectedCallback() {
    this.target = new Date(this.dataset.target).getTime();
    if (Number.isNaN(this.target)) return;
    this.nodes = {};
    $$('[data-unit]', this).forEach((n) => { this.nodes[n.dataset.unit] = n; });
    this.prev = {};
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }
  disconnectedCallback() { clearInterval(this.timer); }
  set(unit, value) {
    const node = this.nodes[unit];
    const text = String(value).padStart(2, '0');
    if (!node || this.prev[unit] === text) return;
    node.textContent = text;
    if (this.prev[unit] !== undefined && motionOK && node.animate) {
      node.animate([
        { transform: 'translateY(-40%) rotateX(70deg)', opacity: 0 },
        { transform: 'none', opacity: 1 }
      ], { duration: 500, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    }
    this.prev[unit] = text;
  }
  tick() {
    const diff = this.target - Date.now();
    if (diff <= 0) {
      clearInterval(this.timer);
      this.classList.add('is-done');
      const done = this.dataset.doneText;
      if (done) this.innerHTML = `<p class="countdown__done">${done}</p>`;
      return;
    }
    this.set('days', Math.floor(diff / 864e5));
    this.set('hours', Math.floor(diff / 36e5) % 24);
    this.set('minutes', Math.floor(diff / 6e4) % 60);
    this.set('seconds', Math.floor(diff / 1e3) % 60);
  }
}
customElements.define('count-down', CountDown);

/* Masque les dates passées (pages en cache) et calcule les "J-x" côté navigateur */
function refreshDates(scope = document) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  $$('[data-date]', scope).forEach((el) => {
    const d = new Date(`${el.dataset.date}T12:00:00`); d.setHours(0, 0, 0, 0);
    const days = Math.round((d - today) / 864e5);
    if (days < 0 && el.hasAttribute('data-hide-past')) { el.hidden = true; return; }
    const label = el.querySelector('[data-days-left]');
    if (label) {
      const str = theme.strings || {};
      label.textContent = days <= 0 ? (str.today || 'Aujourd’hui !') : days === 1 ? (str.tomorrow || 'Demain') : `${str.daysPrefix || 'J-'}${days}`;
    }
  });
  $$('[data-today-index]', scope).forEach((list) => {
    $$('[data-weekday]', list).forEach((li) => li.classList.toggle('is-today', Number(li.dataset.weekday) === new Date().getDay()));
  });
}

/* ---------- 06. Démarrage + éditeur de thème ---------- */

function init() {
  if (!S.holo) root.classList.add('no-holo');
  if (!S.reveal) root.classList.add('no-reveal');
  initHeader();
  initDropdowns();
  initDrawerTriggers();
  initAnchors();
  initTilt();
  initMagnetic();
  initCursor();
  initReveal();
  refreshDates();
  initSmoothScroll();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

document.addEventListener('shopify:section:load', (e) => {
  initReveal(e.target);
  refreshDates(e.target);
  window.ScrollTrigger?.refresh();
});
// Contenu ajouté dynamiquement (recommandations, filtres…)
document.addEventListener('theme:content', (e) => initReveal(e.target));
document.addEventListener('facets:updated', () => initReveal());
document.addEventListener('shopify:section:unload', () => {
  setTimeout(() => window.ScrollTrigger?.refresh(), 50);
});
