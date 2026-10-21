/* ==========================================================================
   ChocoCards — main.js
   --------------------------------------------------------------------------
   Script principal de la page d'accueil (sans étape de build).
   Les données (produits, sorties, tournois…) viennent de data.js.

   Sommaire
   01. Réglages & utilitaires
   02. Rendu des contenus depuis data.js
   03. Scroll fluide (Lenis) + ancres
   04. Header : méga-menu, pays/langue, menu mobile, tiroirs
   05. Recherche instantanée
   06. Panier (localStorage) + carte qui vole vers le panier
   07. Effets : tilt holo, boutons magnétiques, curseur, bandeau défilant
   08. Apparitions au scroll, compteurs, compte à rebours
   09. Carrousel 3D (coverflow) et carrousels produits
   10. Animations GSAP : booster, timeline, parallaxe
   11. Hero Three.js (cartes 3D holographiques + paillettes)
   12. Démarrage
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- 01. Réglages & utilitaires ---------- */

  // Options d'effets (équivalent des réglages on/off du thème Shopify)
  const OPTIONS = {
    hero3d: true,        // scène Three.js du hero
    holo: true,          // reflet holographique sur les cartes
    curseur: true,       // curseur personnalisé (desktop)
    scrollFluide: true   // scroll fluide Lenis
  };

  // Three.js est chargé à la demande (module ES) uniquement si la 3D est utile
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

  const D = window.CHOCO_DATA || {};
  const root = document.documentElement;
  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mqMobile = window.matchMedia('(max-width: 899px)');

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const normalize = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

  const euro = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' });
  const prix = (n) => euro.format(n);

  // Dates : "2026-10-30" est lu comme une date locale (midi, pour éviter les décalages)
  const parseDate = (iso) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  const startOfDay = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };
  const daysUntil = (iso) => Math.round((startOfDay(parseDate(iso)) - startOfDay(new Date())) / 864e5);
  const fmt = (d, opts) => new Intl.DateTimeFormat('fr-BE', opts).format(d);
  const upcoming = (list) => (list || [])
    .filter((x) => daysUntil(x.date) >= 0)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));

  const STATUTS = D.statuts || {};
  const PRODUITS = D.produits || [];
  const productById = (id) => PRODUITS.find((p) => p.id === id);
  const CAT_LABELS = { 'pokemon-30-ans': 'Pokémon 30 ans', pokemon: 'Pokémon', 'one-piece': 'One Piece' };

  let lenis = null;      // instance du scroll fluide
  let scrollLocks = 0;   // nombre de tiroirs/overlays ouverts

  /* Petite notification en bas de l'écran */
  function toast(html, ms = 3400) {
    const el = $('[data-toast]');
    if (!el) return;
    el.innerHTML = html;
    el.classList.add('is-visible');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('is-visible'), ms);
  }

  /* ---------- 02. Rendu des contenus ---------- */

  /* Fiche produit réutilisable (carrousels, coverflow, recherche…) */
  function productCard(p, { light = false, label = false } = {}) {
    const st = STATUTS[p.statut] || { label: p.statut, achat: false };
    const short = { precommande: 'Précommander', disponible: 'Ajouter' };
    const disabledLabel = { rupture: 'Épuisé', bientot: 'Bientôt', boutique: 'En boutique' };
    const button = st.achat
      ? `<button class="add-btn" type="button" data-add="${esc(p.id)}" aria-label="${esc(st.bouton)} : ${esc(p.nom)}">${icon('plus')}<span>${short[p.statut] || 'Ajouter'}</span></button>`
      : `<button class="add-btn" type="button" disabled>${disabledLabel[p.statut] || st.label}</button>`;
    return `
      <article class="product-card holo-card${light ? ' product-card--light' : ''}" data-tilt data-tilt-max="9" data-product="${esc(p.id)}">
        <div class="product-card__media">
          <img src="${esc(p.image)}" alt="${esc(p.nom)}" width="600" height="600" loading="lazy" decoding="async">
          <span class="product-card__badges">
            <span class="badge badge--${esc(p.statut)}">${esc(st.label)}</span>
            ${p.langue ? `<span class="badge badge--lang" title="Langue des cartes">${esc(p.langue)}</span>` : ''}
          </span>
        </div>
        <div class="product-card__body">
          ${label && p.court ? `<span class="product-card__label">${esc(p.court)}</span>` : `<p class="product-card__cat">${esc(CAT_LABELS[p.categorie] || '')}</p>`}
          <h3 class="product-card__title"><a href="#${esc(p.categorie === 'pokemon-30-ans' ? 'pokemon-30-ans' : p.categorie)}">${esc(p.nom)}</a></h3>
          <div class="product-card__foot">
            <span class="price">${prix(p.prix)}</span>
            ${button}
          </div>
          ${p.statut === 'boutique' ? `<p class="product-card__note">${icon('store')}Disponible en boutique à Nivelles</p>` : ''}
        </div>
      </article>`;
  }

  function renderMenus() {
    const list = $('[data-mega-list]');
    const mobile = $('[data-mobile-nav]');
    const menu = D.menu || [];
    if (list) {
      list.innerHTML = menu.map((m, i) => {
        if (!m.colonnes) {
          const hot = /précommande/i.test(m.titre) ? ' mega__trigger--hot' : '';
          return `<li class="mega__item"><a class="mega__trigger${hot}" href="${esc(m.lien)}">${esc(m.titre)}</a></li>`;
        }
        const cols = m.colonnes.map((c) => `
          <div class="mega__col"><h3>${esc(c.titre)}</h3>
            <ul>${c.liens.map((l) => `<li><a href="${esc(m.lien)}">${esc(l)}</a></li>`).join('')}</ul>
          </div>`).join('');
        const feat = m.vedette ? `
          <a class="mega__feature holo-card" data-tilt data-tilt-max="6" href="${esc(m.vedette.lien)}">
            <img src="${esc(m.vedette.image)}" alt="" width="800" height="600" loading="lazy" decoding="async">
            <span class="mega__feature-text"><strong>${esc(m.vedette.titre)}</strong><span>${esc(m.vedette.texte)}</span></span>
          </a>` : '';
        return `
          <li class="mega__item" data-mega-item>
            <button class="mega__trigger" type="button" aria-expanded="false" aria-controls="mega-${i}">${esc(m.titre)}${icon('chevron')}</button>
            <div class="mega__panel" id="mega-${i}">
              <div><div class="mega__cols">${cols}</div>
                <a class="mega__all" href="${esc(m.lien)}">Voir tout ${esc(m.titre)}${icon('arrow')}</a></div>
              ${feat}
            </div>
          </li>`;
      }).join('');
    }
    if (mobile) {
      mobile.innerHTML = menu.map((m) => {
        if (!m.colonnes) return `<a href="${esc(m.lien)}">${esc(m.titre)}${icon('arrow')}</a>`;
        return `
          <details>
            <summary>${esc(m.titre)}${icon('chevron')}</summary>
            <div class="mobile-nav__sub">
              ${m.colonnes.map((c) => `<div><h3>${esc(c.titre)}</h3>${c.liens.map((l) => `<a href="${esc(m.lien)}">${esc(l)}</a>`).join('')}</div>`).join('')}
              <a class="mega__all" href="${esc(m.lien)}">Voir tout ${esc(m.titre)}${icon('arrow')}</a>
            </div>
          </details>`;
      }).join('');
      $$('a', mobile).forEach((a) => { const svg = a.querySelector(':scope > svg'); if (svg) svg.style.cssText = 'width:18px;height:18px;opacity:.6'; });
    }
  }

  function renderAnniversary() {
    const stage = $('[data-coverflow-stage]');
    if (!stage) return;
    const items = PRODUITS.filter((p) => p.categorie === 'pokemon-30-ans');
    stage.innerHTML = items.map((p, i) => `
      <div class="coverflow__item" data-index="${i}" role="group" aria-roledescription="diapositive" aria-label="${i + 1} sur ${items.length}">
        ${productCard(p, { light: true, label: true })}
      </div>`).join('');
  }

  function renderCategories() {
    const grid = $('[data-categories]');
    if (!grid) return;
    grid.innerHTML = (D.categories || []).map((c, i) => `
      <a class="cat-card holo-card" href="${esc(c.lien)}" data-tilt data-tilt-max="10" style="--h:${Number(c.teinte) || 30}">
        <img src="${esc(c.image)}" alt="" width="800" height="1000" loading="lazy" decoding="async">
        <span class="cat-card__shade" aria-hidden="true"></span>
        <span class="cat-card__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="cat-card__arrow" aria-hidden="true">${icon('arrow')}</span>
        <div class="cat-card__body">
          <h3 class="cat-card__title">${esc(c.titre)}</h3>
          <p class="cat-card__text">${esc(c.texte)}</p>
        </div>
      </a>`).join('');
  }

  function renderPreorder() {
    const conf = D.precommandeVedette;
    if (!conf) return;
    const text = $('[data-preorder-text]');
    if (text) text.textContent = conf.texte;
    const box = $('[data-preorder-product]');
    const p = productById(conf.produitId);
    if (box && p) {
      box.innerHTML = `
        <img src="${esc(p.image)}" alt="${esc(p.nom)}" width="160" height="160" loading="lazy" decoding="async">
        <div>
          <p class="preorder__product-name">${esc(p.nom)}</p>
          <div class="preorder__product-row">
            <span class="preorder__product-price">${prix(p.prix)}</span>
            <button class="btn btn--holo btn--sm" type="button" data-add="${esc(p.id)}" data-magnetic>${icon('plus')}<span>Précommander</span></button>
          </div>
        </div>`;
    }
  }

  function daysLeftLabel(n) {
    if (n <= 0) return 'Aujourd’hui !';
    if (n === 1) return 'Demain';
    return `J-${n}`;
  }

  function renderReleases() {
    const list = $('[data-timeline]');
    if (!list) return;
    const items = upcoming(D.sorties);
    list.innerHTML = items.map((s, i) => {
      const d = parseDate(s.date);
      return `
        <li class="release" style="--i:${i}">
          <span class="release__dot" aria-hidden="true"></span>
          <a class="release__card" href="${esc(s.lien)}">
            <span class="release__date">
              <span class="release__day">${d.getDate()}</span>
              <span class="release__month">${fmt(d, { month: 'short' })}</span>
              <span class="release__weekday">${fmt(d, { weekday: 'long' })}</span>
            </span>
            <span class="release__meta"><span class="game-tag" data-game="${esc(s.jeu)}">${esc(s.jeu)}</span><span class="days-left">${daysLeftLabel(daysUntil(s.date))}</span></span>
            <h3 class="release__title">${esc(s.titre)}</h3>
            <p class="release__text">${esc(s.texte)}</p>
            <span class="release__link">Voir les produits${icon('arrow')}</span>
          </a>
        </li>`;
    }).join('') || '<li class="release is-revealed"><p>Les prochaines sorties arrivent bientôt !</p></li>';
  }

  function renderProductSliders() {
    $$('[data-products]').forEach((track) => {
      const cat = track.dataset.products;
      track.innerHTML = PRODUITS.filter((p) => p.categorie === cat).map((p) => productCard(p)).join('');
    });
  }

  function renderOtherTcg() {
    const grid = $('[data-other-tcg]');
    if (!grid) return;
    grid.innerHTML = (D.autresTcg || []).map((t) => `
      <a class="tcg-card holo-card" href="${esc(t.lien)}" data-tilt data-tilt-max="10" style="--c1:${esc(t.couleurs[0])};--c2:${esc(t.couleurs[1])}">
        <img src="${esc(t.image)}" alt="" width="600" height="800" loading="lazy" decoding="async">
        <span class="tcg-card__shade" aria-hidden="true"></span>
        <span class="tcg-card__arrow" aria-hidden="true">${icon('arrow')}</span>
        <h3 class="tcg-card__name">${esc(t.nom)}</h3>
        <p class="tcg-card__text">${esc(t.texte)}</p>
      </a>`).join('');
  }

  function renderInstagram() {
    const grid = $('[data-instagram]');
    if (!grid) return;
    const url = D.boutique?.instagram || 'https://www.instagram.com/chococards.be/';
    grid.innerHTML = (D.instagram || []).map((post) => `
      <a class="insta-post holo-card" href="${esc(url)}" target="_blank" rel="noopener" data-tilt data-tilt-max="8">
        <img src="${esc(post.image)}" alt="${esc(post.alt)}" width="600" height="600" loading="lazy" decoding="async">
        <span class="insta-post__over" aria-hidden="true">${icon('instagram')}</span>
      </a>`).join('');
  }

  function eventDateParts(e) {
    const d = parseDate(e.date);
    return { d, weekday: fmt(d, { weekday: 'long' }), day: d.getDate(), month: fmt(d, { month: 'short' }), long: fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) };
  }

  function renderEvents() {
    const grid = $('[data-events]');
    if (!grid) return;
    const items = upcoming(D.evenements);
    grid.innerHTML = items.map((e) => {
      const p = eventDateParts(e);
      return `
        <article class="event holo-card" data-tilt data-tilt-max="6">
          <div class="event__date" aria-hidden="true">
            <span class="event__weekday">${p.weekday.slice(0, 3)}.</span>
            <span class="event__day">${p.day}</span>
            <span class="event__month">${p.month}</span>
          </div>
          <div class="event__body">
            <span class="game-tag" data-game="${esc(e.jeu)}">${esc(e.jeu)}</span>
            <h3 class="event__title">${esc(e.titre)}</h3>
            <p class="event__details"><span>${icon('calendar')}<span>${p.long}</span></span><span>${icon('clock')}${esc(e.heure)}</span></p>
            <div class="event__foot">
              <span class="event__price">${prix(e.prix).replace(',00', '')}<small>l’inscription</small></span>
              <a class="btn btn--holo btn--sm" href="${esc(e.lien)}" data-magnetic aria-label="S’inscrire au ${esc(e.titre)} du ${p.long}"><span>S’inscrire</span>${icon('arrow')}</a>
            </div>
          </div>
        </article>`;
    }).join('') || '<p>Aucun tournoi prévu pour le moment : suivez-nous sur Instagram pour ne rien rater !</p>';
  }

  function renderStoreInfo() {
    const b = D.boutique || {};
    const hours = $('[data-hours]');
    if (hours && b.horaires) {
      const today = new Date().getDay();
      // Affichage du lundi au dimanche
      const order = [1, 2, 3, 4, 5, 6, 0];
      hours.innerHTML = order.map((i) => {
        const h = b.horaires[i];
        const cls = [i === today ? 'is-today' : '', !h.heures ? 'is-closed' : ''].join(' ').trim();
        return `<li${cls ? ` class="${cls}"` : ''}><span>${esc(h.jour)}</span><span>${h.heures ? esc(h.heures) : 'Fermé'}</span></li>`;
      }).join('');
    }
    const parking = $('[data-store-parking]');
    if (parking) parking.textContent = b.parking || '';
    const pickup = $('[data-store-pickup]');
    if (pickup) pickup.textContent = b.retrait || '';
    const next = $('[data-next-event]');
    if (next) {
      const e = upcoming(D.evenements)[0];
      if (e) {
        const p = eventDateParts(e);
        next.innerHTML = `<a href="#tournois">${esc(e.titre)}</a><br><span style="font-weight:500;text-transform:capitalize">${p.long} · ${esc(e.heure)} · ${prix(e.prix).replace(',00', '')}</span>`;
      } else {
        next.textContent = 'Bientôt annoncé : restez connectés !';
      }
    }
    // Sources des compteurs animés
    const autres = (D.menu || []).find((m) => /autres tcg/i.test(m.titre));
    const nbTcg = 2 + (autres?.colonnes?.[0]?.liens.length || (D.autresTcg || []).length);
    $$('[data-count-source]').forEach((el) => {
      if (el.dataset.countSource === 'tcg') el.dataset.countTo = nbTcg;
      if (el.dataset.countSource === 'events') el.dataset.countTo = upcoming(D.evenements).length;
    });
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- 03. Scroll fluide + ancres ---------- */

  function initSmoothScroll() {
    // Sur écran tactile le défilement natif est déjà fluide : pas de Lenis
    if (!OPTIONS.scrollFluide || !motionOK || !finePointer || typeof window.Lenis !== 'function') return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    root.classList.add('lenis');
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const headerOffset = () => ($('[data-header]')?.offsetHeight || 0) + 8;

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: -headerOffset(), duration: 1.4 });
    else {
      const y = target.getBoundingClientRect().top + window.scrollY - headerOffset();
      window.scrollTo({ top: y, behavior: motionOK ? 'smooth' : 'auto' });
    }
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      closeAllOverlays();
      scrollToTarget(target);
      history.replaceState(null, '', `#${id}`);
    });
  }

  function lockScroll() {
    scrollLocks += 1;
    if (scrollLocks === 1) {
      lenis?.stop();
      root.style.overflow = 'hidden';
    }
  }
  function unlockScroll() {
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0) {
      lenis?.start();
      root.style.overflow = '';
    }
  }

  /* ---------- 04. Header ---------- */

  function initHeader() {
    const header = $('[data-header]');
    if (!header) return;
    // ResizeObserver se déclenche après la mise en page : pas de calcul forcé au chargement
    const setHeight = (h) => root.style.setProperty('--header-h', `${Math.round(h)}px`);
    if ('ResizeObserver' in window) new ResizeObserver(([e]) => setHeight(e.borderBoxSize?.[0]?.blockSize ?? header.offsetHeight)).observe(header);
    else setHeight(header.offsetHeight);
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
    requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initMegaMenu() {
    const items = $$('[data-mega-item]');
    let openTimer;
    let closeTimer;
    const setOpen = (li, open) => {
      li.classList.toggle('is-open', open);
      li.querySelector('.mega__trigger').setAttribute('aria-expanded', String(open));
      if (open) li._openedAt = performance.now();
    };
    const openOnly = (li) => items.forEach((o) => setOpen(o, o === li));
    items.forEach((li) => {
      const btn = li.querySelector('.mega__trigger');
      btn.addEventListener('click', () => {
        const isOpen = li.classList.contains('is-open');
        // Si le menu vient d'être ouvert au survol, le clic ne le referme pas
        if (isOpen && performance.now() - (li._openedAt || 0) > 400) setOpen(li, false);
        else openOnly(li);
      });
      if (finePointer) {
        li.addEventListener('pointerenter', (e) => {
          if (e.pointerType !== 'mouse') return;
          clearTimeout(closeTimer);
          openTimer = setTimeout(() => openOnly(li), 80);
        });
        li.addEventListener('pointerleave', (e) => {
          if (e.pointerType !== 'mouse') return;
          clearTimeout(openTimer);
          closeTimer = setTimeout(() => setOpen(li, false), 180);
        });
      }
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && li.classList.contains('is-open')) { setOpen(li, false); btn.focus(); }
      });
      li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) setOpen(li, false); });
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-mega-item]')) items.forEach((li) => setOpen(li, false));
    });
  }

  function initDropdowns() {
    $$('[data-dropdown]').forEach((dd, index) => {
      const btn = $('.dropdown__toggle', dd);
      const opts = $$('[role="option"]', dd);
      const valueEl = $('[data-dropdown-value]', dd);
      const sync = $(`[data-sync-dropdown="${index}"]`);
      const isCountry = index === 0;
      const toggle = (open, focus = false) => {
        dd.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        if (open && focus) (opts.find((o) => o.getAttribute('aria-selected') === 'true') || opts[0]).focus();
      };
      const select = (value, announce) => {
        opts.forEach((o) => o.setAttribute('aria-selected', String(o.dataset.value === value)));
        valueEl.textContent = value;
        if (sync) sync.value = value;
        if (!announce) return;
        const name = opts.find((o) => o.dataset.value === value)?.firstChild.textContent.trim();
        toast(`${icon('check')}<span class="toast__text">${isCountry ? `Livraison : ${esc(name)}` : `Langue : ${esc(name)}`}</span>`);
      };
      btn.addEventListener('click', () => toggle(!dd.classList.contains('is-open'), true));
      opts.forEach((o, i) => {
        o.addEventListener('click', () => { select(o.dataset.value, true); toggle(false); btn.focus(); });
        o.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
          if (e.key === 'ArrowUp') { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.click(); }
          if (e.key === 'Escape' || e.key === 'Tab') { toggle(false); if (e.key === 'Escape') btn.focus(); }
        });
      });
      document.addEventListener('click', (e) => { if (!dd.contains(e.target)) toggle(false); });
      sync?.addEventListener('change', () => select(sync.value, true));
    });
  }

  /* Tiroirs (menu mobile, panier) avec piège du focus */
  let lastFocus = null;
  function focusables(el) {
    return $$('a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])', el)
      .filter((n) => n.offsetParent !== null);
  }
  function openDrawer(name) {
    const drawer = $(`[data-drawer="${name}"]`);
    if (!drawer || drawer.classList.contains('is-open')) return;
    closeAllOverlays();
    lastFocus = document.activeElement;
    drawer.hidden = false;
    lockScroll();
    requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('is-open')));
    if (name === 'mobile-nav') $('[data-open-mobile-nav]')?.setAttribute('aria-expanded', 'true');
    setTimeout(() => focusables($('.drawer__panel', drawer))[0]?.focus(), 60);
  }
  function closeDrawer(drawer) {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    unlockScroll();
    if (drawer.dataset.drawer === 'mobile-nav') $('[data-open-mobile-nav]')?.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 560);
    lastFocus?.focus?.();
  }
  function closeAllOverlays() {
    $$('[data-drawer]').forEach((d) => { if (!d.hidden) closeDrawer(d); });
    closeSearch();
  }

  function initDrawers() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-mobile-nav]')) openDrawer('mobile-nav');
      if (e.target.closest('[data-open-cart]')) openDrawer('cart');
      const closer = e.target.closest('[data-close-drawer]');
      if (closer) closeDrawer(closer.closest('[data-drawer]'));
    });
    document.addEventListener('keydown', (e) => {
      const open = $$('[data-drawer]').find((d) => d.classList.contains('is-open'));
      if (!open) return;
      if (e.key === 'Escape') closeDrawer(open);
      if (e.key === 'Tab') {
        const f = focusables($('.drawer__panel', open));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ---------- 05. Recherche instantanée ---------- */

  let closeSearch = () => {};

  function initSearch() {
    const overlay = $('[data-search]');
    const input = $('[data-search-input]');
    const results = $('[data-search-results]');
    if (!overlay || !input || !results) return;
    const suggestions = ['Pokémon 30 ans', 'Display', 'ETB', 'One Piece', 'Japonais', 'Précommande'];

    const productRow = (p) => {
      const st = STATUTS[p.statut] || {};
      return `<a class="search-item" href="#${esc(p.categorie)}">
        <img src="${esc(p.image)}" alt="" width="56" height="56" loading="lazy">
        <span><span class="search-item__name">${esc(p.nom)}</span><br><span class="search-item__meta">${esc(CAT_LABELS[p.categorie] || '')} · ${esc(st.label || '')}${p.langue ? ` · ${esc(p.langue)}` : ''}</span></span>
        <span class="search-item__price">${prix(p.prix)}</span>
      </a>`;
    };

    const render = (q) => {
      const terms = normalize(q).split(/\s+/).filter(Boolean);
      if (!terms.length) {
        results.innerHTML = `
          <div class="search-group"><h3>Suggestions</h3><div class="search-chips">${suggestions.map((s) => `<button type="button" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
          <div class="search-group"><h3>Populaire en ce moment</h3>${PRODUITS.slice(4, 8).map(productRow).join('')}</div>`;
        return;
      }
      const match = (text) => terms.every((t) => normalize(text).includes(t));
      const prods = PRODUITS.filter((p) => match(`${p.nom} ${CAT_LABELS[p.categorie] || ''} ${p.langue} ${STATUTS[p.statut]?.label || ''} ${p.court || ''}`)).slice(0, 8);
      const cats = (D.categories || []).filter((c) => match(`${c.titre} ${c.texte}`)).slice(0, 4);
      if (!prods.length && !cats.length) {
        results.innerHTML = `<p class="search-empty">Aucun résultat pour « ${esc(q)} ». Essayez « display », « ETB » ou « One Piece ».</p>`;
        return;
      }
      results.innerHTML = `
        ${cats.length ? `<div class="search-group"><h3>Catégories</h3><div class="search-chips">${cats.map((c) => `<a class="btn btn--ghost btn--sm" href="${esc(c.lien)}">${esc(c.titre)}</a>`).join('')}</div></div>` : ''}
        ${prods.length ? `<div class="search-group"><h3>Produits (${prods.length})</h3>${prods.map(productRow).join('')}</div>` : ''}`;
    };

    const open = () => {
      if (!overlay.hidden) return;
      closeAllOverlays();
      lastFocus = document.activeElement;
      overlay.hidden = false;
      lockScroll();
      render(input.value);
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-open')));
      setTimeout(() => input.focus(), 50);
    };
    closeSearch = () => {
      if (overlay.hidden) return;
      overlay.classList.remove('is-open');
      unlockScroll();
      setTimeout(() => { if (!overlay.classList.contains('is-open')) overlay.hidden = true; }, 400);
      lastFocus?.focus?.();
    };

    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => render(input.value), 80); });
    $('[data-search-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const first = $('.search-item', results);
      if (first) first.click();
    });
    results.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-suggest]');
      if (chip) { input.value = chip.dataset.suggest; render(input.value); input.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-search]')) open();
      if (e.target.closest('[data-close-search]')) closeSearch();
    });
    document.addEventListener('keydown', (e) => {
      const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '');
      if (e.key === '/' && !typing && overlay.hidden) { e.preventDefault(); open(); }
      if (e.key === 'Escape' && !overlay.hidden) closeSearch();
    });
  }

  /* ---------- 06. Panier ---------- */

  const CART_KEY = 'chococards:panier';
  let cart = [];

  function loadCart() {
    try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]').filter((l) => productById(l.id)); }
    catch { cart = []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* navigation privée */ }
  }
  const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);

  function updateBadge(bump = false) {
    const count = cartCount();
    const badge = $('[data-cart-count]');
    const btn = $('[data-open-cart]');
    if (badge) {
      badge.textContent = count;
      badge.hidden = count === 0;
      if (bump && motionOK) {
        badge.classList.remove('is-bump'); btn.classList.remove('is-bump');
        void badge.offsetWidth;
        badge.classList.add('is-bump'); btn.classList.add('is-bump');
      }
    }
    btn?.setAttribute('aria-label', `Ouvrir le panier, ${count} article${count > 1 ? 's' : ''}`);
  }

  function renderCart() {
    const box = $('[data-cart]');
    if (!box) return;
    if (!cart.length) {
      box.innerHTML = `
        <div class="cart__empty">
          <div class="cart__empty-cards" aria-hidden="true"><span></span><span></span></div>
          <h3>Votre panier est vide</h3>
          <p>Un booster, un display, une petite carte à l’unité ? Faites-vous plaisir !</p>
          <a class="btn btn--holo" href="#explorer" data-close-drawer><span>Explorer la boutique</span></a>
        </div>`;
      return;
    }
    const total = cart.reduce((s, l) => s + productById(l.id).prix * l.qty, 0);
    box.innerHTML = `
      <ul class="cart__items" data-lenis-prevent>
        ${cart.map((l) => {
          const p = productById(l.id);
          return `<li class="cart-line">
            <img src="${esc(p.image)}" alt="" width="72" height="72" loading="lazy">
            <div>
              <p class="cart-line__name">${esc(p.nom)}</p>
              <p class="cart-line__price">${prix(p.prix)}${p.statut === 'precommande' ? ' · Précommande' : ''}</p>
              <div class="qty" role="group" aria-label="Quantité">
                <button type="button" data-qty="${esc(p.id)}" data-delta="-1" aria-label="Retirer un exemplaire">${icon('minus')}</button>
                <span aria-live="polite">${l.qty}</span>
                <button type="button" data-qty="${esc(p.id)}" data-delta="1" aria-label="Ajouter un exemplaire">${icon('plus')}</button>
              </div>
            </div>
            <div class="cart-line__end">
              <button class="cart-line__remove" type="button" data-remove="${esc(p.id)}" aria-label="Supprimer ${esc(p.nom)}">${icon('trash')}</button>
              <span class="cart-line__total">${prix(p.prix * l.qty)}</span>
            </div>
          </li>`;
        }).join('')}
      </ul>
      <div class="cart__foot">
        <div class="cart__subtotal"><span>Sous-total</span><strong>${prix(total)}</strong></div>
        <p class="cart__note">${icon('store')}Retrait gratuit en boutique à Nivelles, ou livraison rapide en Belgique.</p>
        <button class="btn btn--holo" type="button" data-checkout><span>Passer commande</span>${icon('arrow')}</button>
      </div>`;
  }

  /* La carte "vole" de la fiche produit jusqu'à l'icône du panier */
  function flyToCart(fromEl, done) {
    const target = $('[data-open-cart]');
    const img = fromEl?.closest('.product-card, .preorder__product')?.querySelector('img');
    if (!target || !img || !motionOK || !img.getBoundingClientRect().width) { done(); return; }
    const s = img.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const size = Math.min(s.width, 160);
    const fly = document.createElement('div');
    fly.className = 'fly-card';
    fly.setAttribute('aria-hidden', 'true');
    Object.assign(fly.style, {
      left: `${s.left + (s.width - size) / 2}px`, top: `${s.top + (s.height - size * 1.4) / 2}px`,
      width: `${size}px`, height: `${size * 1.4}px`,
      backgroundImage: `url("${img.currentSrc || img.src}")`
    });
    document.body.appendChild(fly);
    const dx = t.left + t.width / 2 - (s.left + s.width / 2);
    const dy = t.top + t.height / 2 - (s.top + s.height / 2);
    const anim = fly.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 140}px) scale(.75) rotate(-14deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.1) rotate(18deg)`, opacity: 0.4 }
    ], { duration: 950, easing: 'cubic-bezier(.55,0,.25,1)' });
    anim.onfinish = () => { fly.remove(); done(); };
  }

  function addToCart(id, sourceEl) {
    const p = productById(id);
    if (!p || !STATUTS[p.statut]?.achat) return;
    const line = cart.find((l) => l.id === id);
    if (line) line.qty += 1; else cart.push({ id, qty: 1 });
    saveCart();
    renderCart();
    if (sourceEl?.classList.contains('add-btn')) {
      sourceEl.classList.add('is-added');
      setTimeout(() => sourceEl.classList.remove('is-added'), 1200);
    }
    flyToCart(sourceEl, () => {
      updateBadge(true);
      toast(`${icon('check')}<span class="toast__text"><strong>${p.statut === 'precommande' ? 'Précommandé' : 'Ajouté au panier'} :</strong> ${esc(p.nom)}</span><button type="button" data-open-cart>Voir le panier</button>`);
    });
  }

  function initCart() {
    loadCart();
    renderCart();
    updateBadge();
    document.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); addToCart(add.dataset.add, add); return; }
      const qty = e.target.closest('[data-qty]');
      if (qty) {
        const line = cart.find((l) => l.id === qty.dataset.qty);
        if (line) {
          line.qty += Number(qty.dataset.delta);
          if (line.qty <= 0) cart = cart.filter((l) => l !== line);
          saveCart(); renderCart(); updateBadge();
          $(`[data-qty="${CSS.escape(qty.dataset.qty)}"][data-delta="${qty.dataset.delta}"]`)?.focus();
        }
        return;
      }
      const rm = e.target.closest('[data-remove]');
      if (rm) {
        cart = cart.filter((l) => l.id !== rm.dataset.remove);
        saveCart(); renderCart(); updateBadge();
        focusables($('[data-drawer="cart"] .drawer__panel'))[0]?.focus();
        return;
      }
      if (e.target.closest('[data-checkout]')) {
        toast(`${icon('check')}<span class="toast__text">Paiement sécurisé : ici s’ouvrira le checkout Shopify.</span>`);
      }
    });
  }

  /* ---------- 07. Effets ---------- */

  /* Tilt 3D + reflet holo qui suit la souris (délégation : marche aussi pour le contenu ajouté) */
  function initTilt() {
    if (!OPTIONS.holo) root.classList.add('no-holo');
    if (!finePointer || !motionOK) return;
    let el = null;
    let rect = null;
    let raf = 0;
    let px = 0;
    let py = 0;
    const reset = (node) => {
      node.classList.remove('is-tilting');
      ['--rx', '--ry'].forEach((v) => node.style.setProperty(v, '0deg'));
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
      const t = e.target.closest?.('[data-tilt]') || null;
      if (t !== el) {
        if (el) reset(el);
        el = t;
        if (el) { rect = el.getBoundingClientRect(); el.classList.add('is-tilting'); }
      }
      if (!el) return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { if (el) { reset(el); el = null; } });
    window.addEventListener('scroll', () => { if (el) rect = el.getBoundingClientRect(); }, { passive: true });
  }

  /* Boutons magnétiques : ils suivent légèrement le curseur */
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
      const t = e.target.closest?.('[data-magnetic]') || null;
      if (t !== el) { if (el) release(el); el = t; if (el) el.classList.add('is-magnet'); }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.setProperty('--tx', `${(dx * 0.25).toFixed(1)}px`);
      el.style.setProperty('--ty', `${(dy * 0.35).toFixed(1)}px`);
    }, { passive: true });
  }

  /* Curseur personnalisé discret (desktop uniquement) */
  function initCursor() {
    if (!OPTIONS.curseur || !finePointer || !motionOK) return;
    const cursor = $('.cursor');
    if (!cursor) return;
    const dot = $('.cursor__dot', cursor);
    const ring = $('.cursor__ring', cursor);
    root.classList.add('has-cursor');
    cursor.classList.add('is-hidden');
    let x = -100; let y = -100; let rx = -100; let ry = -100;
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; rx = x; ry = y; cursor.classList.remove('is-hidden'); }
      const hover = e.target.closest?.('a, button, [role="option"], summary, label, select, [data-cursor]');
      cursor.classList.toggle('is-hover', !!hover);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { shown = false; cursor.classList.add('is-hidden'); });
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

  /* Bandeau défilant infini : on duplique le contenu pour une boucle sans couture */
  function initMarquee() {
    // Fait quand le navigateur est libre (évite un calcul de mise en page au chargement)
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    idle(fillMarquees, { timeout: 1500 });
  }
  function fillMarquees() {
    $$('[data-marquee]').forEach((marquee) => {
      const track = $('.marquee__track', marquee);
      if (!track || marquee.dataset.ready) return;
      marquee.dataset.ready = '1';
      const originals = Array.from(track.children);
      let guard = 0;
      while (track.scrollWidth < window.innerWidth * 1.2 && guard < 8) {
        originals.forEach((li) => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
        guard += 1;
      }
      const copy = track.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      marquee.appendChild(copy);
      // Vitesse constante (~55 px/s) quelle que soit la longueur du texte
      marquee.style.setProperty('--speed', `${Math.round(track.scrollWidth / 55)}s`);
    });
  }

  /* ---------- 08. Apparitions, compteurs, compte à rebours ---------- */

  function initReveal() {
    $$('[data-reveal-stagger]').forEach((group) => {
      Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i));
    });
    const els = $$('[data-reveal], [data-reveal-stagger], .release');
    const reveal = (el) => {
      el.classList.add('is-revealed');
      const count = el.hasAttribute('data-reveal-stagger') ? el.children.length : 1;
      setTimeout(() => el.classList.add('reveal-done'), 1300 + count * 90);
    };
    if (!('IntersectionObserver' in window) || !motionOK) { els.forEach(reveal); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    els.forEach((el) => io.observe(el));
  }

  function initCounters() {
    const els = $$('[data-count-to]');
    const run = (el) => {
      const end = Number(el.dataset.countTo) || 0;
      const suffix = el.dataset.countSuffix || '';
      if (!motionOK) { el.textContent = `${end}${suffix}`; return; }
      const t0 = performance.now();
      const dur = 1800;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = `${Math.round(end * eased)}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  function initCountdowns() {
    $$('[data-countdown]').forEach((el) => {
      const target = new Date(el.dataset.countdown).getTime();
      if (Number.isNaN(target)) return;
      const nodes = {};
      $$('[data-unit]', el).forEach((n) => { nodes[n.dataset.unit] = n; });
      const prev = {};
      let timer = 0;
      const set = (unit, value) => {
        const node = nodes[unit];
        const text = String(value).padStart(2, '0');
        if (!node || prev[unit] === text) return;
        node.textContent = text;
        if (prev[unit] !== undefined && motionOK) {
          node.classList.remove('tick');
          void node.offsetWidth;
          node.classList.add('tick');
        }
        prev[unit] = text;
      };
      const tick = () => {
        const diff = target - Date.now();
        if (diff <= 0) {
          clearInterval(timer);
          el.classList.add('is-done');
          el.textContent = 'C’est le grand jour : disponible maintenant en boutique et en ligne !';
          return;
        }
        set('days', Math.floor(diff / 864e5));
        set('hours', Math.floor(diff / 36e5) % 24);
        set('minutes', Math.floor(diff / 6e4) % 60);
        set('seconds', Math.floor(diff / 1e3) % 60);
      };
      tick();
      timer = setInterval(tick, 1000);
    });
  }

  /* ---------- 09. Carrousels ---------- */

  /* Carrousel 3D "coverflow" (Pokémon 30 ans) */
  function initCoverflow() {
    const box = $('[data-coverflow]');
    const stage = $('[data-coverflow-stage]', box || document);
    if (!box || !stage) return;
    const items = $$('.coverflow__item', stage);
    const n = items.length;
    if (!n) return;
    const dots = $('[data-coverflow-dots]', box);
    let active = 0;
    let autoplay = 0;
    let inView = false;
    let hovered = false;

    dots.innerHTML = items.map((_, i) => `<button type="button" aria-label="Afficher le produit ${i + 1}"></button>`).join('');
    const dotBtns = $$('button', dots);

    const layout = () => {
      items.forEach((item, i) => {
        let off = i - active;
        if (off > n / 2) off -= n;
        if (off < -n / 2) off += n;
        item.style.setProperty('--offset', off);
        item.style.setProperty('--abs', Math.abs(off));
        item.classList.toggle('is-active', off === 0);
        item.classList.toggle('is-hidden', Math.abs(off) > 2);
        item.setAttribute('aria-hidden', String(off !== 0));
        $$('a, button', item).forEach((f) => { if (off !== 0) f.setAttribute('tabindex', '-1'); else f.removeAttribute('tabindex'); });
      });
      dotBtns.forEach((d, i) => d.setAttribute('aria-current', String(i === active)));
    };
    const go = (i) => { active = (i + n) % n; layout(); };

    $('[data-coverflow-prev]', box)?.addEventListener('click', () => go(active - 1));
    $('[data-coverflow-next]', box)?.addEventListener('click', () => go(active + 1));
    dotBtns.forEach((d, i) => d.addEventListener('click', () => go(i)));
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    });
    stage.addEventListener('click', (e) => {
      const item = e.target.closest('.coverflow__item');
      if (item && !item.classList.contains('is-active')) go(Number(item.dataset.index));
    });

    // Glisser (souris + tactile)
    let startX = null;
    stage.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; startX = e.clientX; stage.classList.add('is-dragging'); });
    window.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      stage.classList.remove('is-dragging');
      if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
    });

    // Défilement automatique doux quand le carrousel est visible
    const schedule = () => {
      clearInterval(autoplay);
      if (motionOK && inView && !hovered) autoplay = setInterval(() => go(active + 1), 4500);
    };
    box.addEventListener('pointerenter', () => { hovered = true; schedule(); });
    box.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    box.addEventListener('focusin', () => { hovered = true; schedule(); });
    box.addEventListener('focusout', () => { hovered = false; schedule(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; schedule(); }, { threshold: 0.4 }).observe(box);
    }
    layout();
  }

  /* Carrousels produits horizontaux (scroll-snap + boutons + glisser) */
  function initSliders() {
    $$('[data-slider]').forEach((track) => {
      const name = track.dataset.slider;
      const prev = $(`[data-slider-prev="${name}"]`);
      const next = $(`[data-slider-next="${name}"]`);
      const bar = $(`[data-slider-progress="${name}"]`);
      const step = () => {
        const first = track.firstElementChild;
        if (!first) return track.clientWidth;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return Math.max(first.offsetWidth + gap, Math.floor(track.clientWidth / (first.offsetWidth + gap)) * (first.offsetWidth + gap));
      };
      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        const ratio = track.scrollWidth ? (track.clientWidth + track.scrollLeft) / track.scrollWidth : 1;
        if (bar) bar.style.transform = `scaleX(${clamp(ratio, 0.05, 1)})`;
        if (prev) prev.disabled = track.scrollLeft < 4;
        if (next) next.disabled = track.scrollLeft > max - 4;
      };
      prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: motionOK ? 'smooth' : 'auto' }));
      next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: motionOK ? 'smooth' : 'auto' }));
      track.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      // Première mesure quand le carrousel approche de l'écran
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); update(); } }, { rootMargin: '200px' });
        io.observe(track);
      } else update();

      // Glisser à la souris
      if (!finePointer) return;
      let down = false; let moved = false; let sx = 0; let sl = 0;
      track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.target.closest('button')) return;
        down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
      });
      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - sx;
        if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('is-dragging'); }
        if (moved) track.scrollLeft = sl - dx;
      });
      window.addEventListener('pointerup', () => {
        if (!down) return;
        down = false;
        if (moved) {
          // On laisse le snap se recaler après le glisser
          requestAnimationFrame(() => track.classList.remove('is-dragging'));
          track.addEventListener('click', (ev) => ev.preventDefault(), { capture: true, once: true });
        }
      });
    });
  }

  /* ---------- 10. Animations GSAP ---------- */

  function initGsapAnimations() {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) {
      // Sans GSAP : on affiche directement l'état final des animations
      $('[data-timeline-progress]')?.style.setProperty('transform', 'none');
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Chaque animation n'est créée que lorsque sa section approche de l'écran :
    // le chargement de la page reste léger (pas de calculs ScrollTrigger inutiles).
    const whenNear = (el, fn) => {
      if (!el) return;
      if (!('IntersectionObserver' in window)) { fn(); return; }
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        fn();
      }, { rootMargin: '120% 0px 120% 0px' });
      io.observe(el);
    };

    // --- Booster qui se déchire et cartes en éventail ---
    const section = $('[data-booster-section]');
    if (section) whenNear(section, () => {
      const booster = $('[data-booster]', section);
      const top = $('[data-booster-top]', section);
      const cardsWrap = $('[data-booster-cards]', section);
      const cards = $$('.mini-card', section);
      const burst = $('[data-booster-burst]', section);
      const hint = $('[data-booster-hint]', section);
      const stage = $('.booster-stage', section);

      const build = () => {
        const h = stage.offsetHeight;
        const spread = Math.min(window.innerWidth * (mqMobile.matches ? 0.13 : 0.085), 120);
        const mid = (cards.length - 1) / 2;
        gsap.set(cardsWrap, { zIndex: 2 });
        return gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } })
          .to(hint, { autoAlpha: 0, duration: 0.2 }, 0)
          .to(booster, { keyframes: { rotation: [0, -4, 4, -3, 2, 0] }, y: -12, duration: 0.6, ease: 'none' }, 0)
          .to(top, { y: -h * 0.18, x: h * 0.1, rotation: 24, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0.6)
          .fromTo(burst, { scale: 0.2, autoAlpha: 0 }, { scale: 1.15, autoAlpha: 1, duration: 0.5 }, 0.7)
          .to(cards, { y: -h * 0.3, duration: 0.6, stagger: 0.06 }, 0.85)
          .set(cardsWrap, { zIndex: 4 }, 1.35)
          .to(booster, { y: h * 0.4, scale: 0.85, autoAlpha: 0, duration: 0.7, ease: 'power2.in' }, 1.3)
          .to(burst, { scale: 1.45, autoAlpha: 0.45, duration: 0.7 }, 1.35)
          .to(cards, {
            x: (i) => (i - mid) * spread,
            y: (i) => -h * 0.05 + Math.pow(Math.abs(i - mid), 2) * 9,
            rotation: (i) => (i - mid) * 10,
            duration: 0.9, ease: 'power3.out'
          }, 1.5)
          .to(cards[Math.round(mid)], { rotationY: 360, scale: 1.14, duration: 0.8, ease: 'power2.inOut' }, 2.05);
      };

      if (!motionOK) {
        build().progress(1);
      } else {
        const mm = gsap.matchMedia();
        mm.add('(min-width: 900px)', () => {
          const tl = build();
          ScrollTrigger.create({
            trigger: section, start: 'top top', end: '+=140%',
            pin: $('[data-booster-pin]', section), scrub: 0.8, animation: tl,
            anticipatePin: 1, invalidateOnRefresh: true
          });
          // gsap.matchMedia annule tout seul animations et ScrollTriggers au changement de format
        });
        mm.add('(max-width: 899px)', () => {
          const tl = build();
          ScrollTrigger.create({ trigger: stage, start: 'top 70%', once: true, onEnter: () => tl.play() });
        });
      }
    });

    // --- Ligne de la timeline qui se dessine au scroll ---
    const progress = $('[data-timeline-progress]');
    if (progress) {
      if (!motionOK) progress.style.transform = 'none';
      else whenNear($('.timeline-wrap'), () => {
        const mm = gsap.matchMedia();
        const make = (prop) => () => {
          gsap.fromTo(progress, { [prop]: 0 }, {
            [prop]: 1, ease: 'none',
            scrollTrigger: { trigger: '.timeline-wrap', start: 'top 80%', end: 'bottom 55%', scrub: 0.6 }
          });
        };
        mm.add('(min-width: 900px)', make('scaleX'));
        mm.add('(max-width: 899px)', make('scaleY'));
      });
    }

    if (!motionOK) return;

    // --- Parallaxe des bannières ---
    $$('[data-parallax]').forEach((img) => whenNear(img.parentElement, () => {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }));

    // --- Le contenu du hero s'efface doucement en scrollant (sans GSAP, simple écouteur) ---
    const hero = $('[data-hero]');
    const heroInner = $('.hero__inner');
    if (hero && heroInner) {
      let ticking = false;
      const update = () => {
        ticking = false;
        const p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight || 1)));
        heroInner.style.transform = p ? `translate3d(0, ${(-12 * p).toFixed(2)}%, 0)` : '';
        heroInner.style.opacity = p ? String(1 - 0.85 * p) : '';
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    }

    // --- Le grand "30" glisse légèrement ---
    const thirty = $('.anniversary__bg');
    if (thirty) whenNear(thirty.closest('section'), () => {
      gsap.fromTo(thirty, { xPercent: -8 }, {
        xPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '.anniversary', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Recalcul après chargement complet (images, polices)
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* Newsletter (validation simple) */
  function initNewsletter() {
    $$('[data-newsletter]').forEach((form) => {
      const input = $('input[type="email"]', form);
      const msg = $('.newsletter__msg', form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        msg.className = `newsletter__msg ${ok ? 'is-ok' : 'is-error'}`;
        msg.textContent = ok
          ? 'Merci ! Vous recevrez nos prochaines sorties et tournois en avant-première.'
          : 'Oups, cette adresse e-mail ne semble pas valide.';
        input.setAttribute('aria-invalid', String(!ok));
        if (ok) form.reset();
      });
    });
  }

  /* ---------- 11. Hero Three.js ---------- */

  const CARD_VERTEX = /* glsl */`
    varying vec2 vUv;
    varying vec3 vN;
    varying vec3 vV;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vN = normalize(mat3(modelMatrix) * normal);
      vV = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;

  // Reflet holographique : arc-en-ciel qui dépend de l'angle de vue et de la souris
  const CARD_FRAGMENT = /* glsl */`
    uniform sampler2D uMap;
    uniform sampler2D uMask;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uIntensity;
    varying vec2 vUv;
    varying vec3 vN;
    varying vec3 vV;
    vec3 spectrum(float t) { return 0.55 + 0.45 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec4 base = texture2D(uMap, vUv);
      if (base.a < 0.02) discard;
      float m = texture2D(uMask, vUv).r;
      vec3 n = normalize(vN);
      float facing = clamp(dot(n, normalize(vV)), 0.0, 1.0);
      float fres = pow(1.0 - facing, 2.0);
      float phase = vUv.x * 1.2 + vUv.y * 0.8 + n.x * 1.6 + n.y * 1.1 + uMouse.x * 0.5 - uMouse.y * 0.35 + uTime * 0.05;
      vec3 holo = spectrum(phase);
      float lines = 0.5 + 0.5 * sin((vUv.x + vUv.y) * 220.0 + phase * 6.0);
      float k = clamp(m * uIntensity * (0.42 + 0.55 * fres + 0.22 * lines), 0.0, 1.0);
      vec3 col = mix(base.rgb, base.rgb * 0.35 + holo * 0.95, k);
      vec2 cell = floor(vUv * vec2(70.0, 98.0));
      float h = hash(cell);
      col += step(0.975, h) * pow(0.5 + 0.5 * sin(uTime * 4.0 + h * 50.0), 8.0) * m * 1.2;
      vec2 gp = vec2(0.5 + uMouse.x * 0.45 - n.x * 0.5, 0.5 - uMouse.y * 0.45 + n.y * 0.5);
      float glare = smoothstep(0.6, 0.0, distance(vUv, gp));
      col += glare * glare * 0.32;
      col *= 0.78 + 0.22 * facing;
      gl_FragColor = vec4(col, base.a);
    }`;

  const SPARKLE_VERTEX = /* glsl */`
    uniform float uTime;
    uniform float uPR;
    attribute float aSeed;
    attribute float aSize;
    varying float vAlpha;
    varying float vSeed;
    void main() {
      vec3 p = position;
      p.y = mod(uTime * (0.15 + aSeed * 0.35) + aSeed * 14.0, 14.0) - 7.0;
      p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.3;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = aSize * uPR * (10.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
      vAlpha = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 40.0), 3.0);
      vSeed = aSeed;
    }`;

  const SPARKLE_FRAGMENT = /* glsl */`
    varying float vAlpha;
    varying float vSeed;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float core = smoothstep(0.5, 0.0, length(c));
      float star = max(smoothstep(0.07, 0.0, abs(c.x)) * smoothstep(0.5, 0.0, abs(c.y)),
                       smoothstep(0.07, 0.0, abs(c.y)) * smoothstep(0.5, 0.0, abs(c.x)));
      float a = (core * core + star * 0.6) * vAlpha;
      vec3 gold = mix(vec3(1.0, 0.72, 0.28), vec3(1.0, 0.95, 0.8), vSeed);
      gl_FragColor = vec4(gold, a);
    }`;

  /* Textures des cartes dessinées en 2D (aucune image externe, aucun logo officiel) */
  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function holoStroke(ctx, cx, cy, r) {
    if (ctx.createConicGradient) {
      const g = ctx.createConicGradient(0, cx, cy);
      ['#C4B5FD', '#67E8F9', '#F9A8D4', '#FDE68A', '#C4B5FD'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
      return g;
    }
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, '#C4B5FD'); g.addColorStop(0.5, '#67E8F9'); g.addColorStop(1, '#FDE68A');
    return g;
  }
  function drawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.28;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCardBack() {
    const W = 512; const H = 716;
    const color = makeCanvas(W, H); const mask = makeCanvas(W, H);
    const c = color.getContext('2d'); const m = mask.getContext('2d');
    // Cadre doré
    rr(c, 0, 0, W, H, 34); c.save(); c.clip();
    let g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#F3D98B'); g.addColorStop(0.45, '#B8862B'); g.addColorStop(1, '#F6E2A4');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Fond chocolat
    rr(c, 18, 18, W - 36, H - 36, 22);
    g = c.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, H * 0.62);
    g.addColorStop(0, '#6B4330'); g.addColorStop(1, '#24150E');
    c.fillStyle = g; c.fill();
    // Tablette de chocolat 3 x 4
    const cols = 3; const rows = 4; const pad = 40; const gap = 14;
    const cw = (W - 2 * pad - (cols - 1) * gap) / cols;
    const ch = (H - 2 * pad - (rows - 1) * gap) / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let k = 0; k < cols; k += 1) {
        const x = pad + k * (cw + gap); const y = pad + r * (ch + gap);
        rr(c, x, y, cw, ch, 14); c.fillStyle = 'rgba(30,18,12,.55)'; c.fill();
        rr(c, x + 8, y + 8, cw - 16, ch - 16, 10);
        const sg = c.createLinearGradient(x, y, x + cw, y + ch);
        sg.addColorStop(0, '#7A4A33'); sg.addColorStop(1, '#4A2C1D');
        c.fillStyle = sg; c.fill();
        c.strokeStyle = 'rgba(255,240,220,.08)'; c.lineWidth = 2; c.stroke();
      }
    }
    // Emblème
    const cx = W / 2; const cy = H / 2; const R = 112;
    c.beginPath(); c.arc(cx, cy, R + 18, 0, Math.PI * 2); c.fillStyle = '#1F130D'; c.fill();
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.lineWidth = 12; c.strokeStyle = holoStroke(c, cx, cy, R); c.stroke();
    c.fillStyle = '#FFF6EC'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '800 112px "Bricolage Grotesque", "Arial Black", sans-serif';
    c.fillText('CC', cx, cy + 8);
    // Plaque du nom
    rr(c, cx - 150, H - 108, 300, 54, 27); c.fillStyle = '#1F130D'; c.fill();
    c.font = '700 24px Inter, Arial, sans-serif';
    if ('letterSpacing' in c) c.letterSpacing = '7px';
    c.fillStyle = '#F3D98B'; c.fillText('CHOCOCARDS', cx + 3, H - 80);
    [[cx - 168, cy - 200, 14], [cx + 170, cy - 190, 10], [cx + 150, cy + 196, 16], [cx - 160, cy + 186, 9]].forEach(([x, y, s]) => drawStar(c, x, y, s, '#FDE68A'));
    c.restore();

    // Masque : où le reflet holo s'applique (blanc = fort)
    m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
    rr(m, 0, 0, W, H, 34); m.fillStyle = '#fff'; m.fill();
    rr(m, 18, 18, W - 36, H - 36, 22); m.fillStyle = '#262626'; m.fill();
    m.beginPath(); m.arc(cx, cy, R, 0, Math.PI * 2); m.lineWidth = 16; m.strokeStyle = '#fff'; m.stroke();
    m.fillStyle = '#bbb'; m.textAlign = 'center'; m.textBaseline = 'middle';
    m.font = '800 112px "Bricolage Grotesque", "Arial Black", sans-serif'; m.fillText('CC', cx, cy + 8);
    return { color, mask };
  }

  function drawCardFront() {
    const W = 512; const H = 716;
    const color = makeCanvas(W, H); const mask = makeCanvas(W, H);
    const c = color.getContext('2d'); const m = mask.getContext('2d');
    rr(c, 0, 0, W, H, 34); c.save(); c.clip();
    let g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#FFF6EC'); g.addColorStop(0.5, '#EAD3BA'); g.addColorStop(1, '#F7E8D6');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Barre du nom
    c.fillStyle = '#2B1A12'; c.textBaseline = 'middle';
    c.font = '800 34px "Bricolage Grotesque", "Arial Black", sans-serif'; c.textAlign = 'left';
    c.fillText('ChocoCards', 40, 52);
    c.font = '700 22px Inter, Arial, sans-serif'; c.textAlign = 'right';
    c.fillText('HOLO ★', W - 40, 52);
    // Fenêtre d'illustration abstraite (aucun personnage)
    const ax = 34; const ay = 86; const aw = W - 68; const ah = 340;
    rr(c, ax, ay, aw, ah, 18); c.save(); c.clip();
    g = c.createLinearGradient(ax, ay, ax + aw, ay + ah);
    g.addColorStop(0, '#5B21B6'); g.addColorStop(0.5, '#0E7490'); g.addColorStop(1, '#BE185D');
    c.fillStyle = g; c.fillRect(ax, ay, aw, ah);
    [[0.25, 0.3, 160, 'rgba(196,181,253,.7)'], [0.75, 0.7, 180, 'rgba(103,232,249,.55)'], [0.6, 0.2, 120, 'rgba(249,168,212,.6)']].forEach(([px, py, r, col]) => {
      const rg = c.createRadialGradient(ax + aw * px, ay + ah * py, 0, ax + aw * px, ay + ah * py, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg; c.fillRect(ax, ay, aw, ah);
    });
    drawStar(c, W / 2, ay + ah / 2, 110, 'rgba(255,246,236,.95)');
    drawStar(c, W / 2, ay + ah / 2, 60, '#FDE68A');
    for (let i = 0; i < 26; i += 1) drawStar(c, ax + Math.random() * aw, ay + Math.random() * ah, 3 + Math.random() * 9, 'rgba(255,255,255,.85)');
    c.restore();
    c.lineWidth = 6; c.strokeStyle = '#B8862B'; rr(c, ax, ay, aw, ah, 18); c.stroke();
    // Ligne de type + zone de texte stylisée
    c.fillStyle = '#4A2C1D'; c.font = 'italic 600 20px Inter, Arial, sans-serif'; c.textAlign = 'center';
    c.fillText('Carte collector · Nivelles', W / 2, ay + ah + 32);
    rr(c, 40, 486, W - 80, 160, 14); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    c.fillStyle = 'rgba(74,44,29,.28)';
    [[60, 512, 300], [60, 544, 380], [60, 576, 340], [60, 608, 220]].forEach(([x, y, w]) => { rr(c, x, y, w, 12, 6); c.fill(); });
    c.fillStyle = '#4A2C1D'; c.font = '700 18px Inter, Arial, sans-serif';
    c.textAlign = 'left'; c.fillText('030/030', 40, H - 36);
    c.textAlign = 'right'; c.fillText('✦ CC', W - 40, H - 36);
    c.restore();

    m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
    rr(m, 0, 0, W, H, 34); m.fillStyle = '#7a7a7a'; m.fill();
    rr(m, ax, ay, aw, ah, 18); m.fillStyle = '#fff'; m.fill();
    rr(m, 40, 486, W - 80, 160, 14); m.fillStyle = '#1a1a1a'; m.fill();
    return { color, mask };
  }


  async function initHero3D() {
    const hero = $('[data-hero]');
    const canvas = $('[data-hero-canvas]');
    if (!hero || !canvas || !OPTIONS.hero3d || !motionOK || !('WebGLRenderingContext' in window)) return;
    const lite = mqMobile.matches || (navigator.hardwareConcurrency || 8) <= 4 || navigator.connection?.saveData === true;

    let THREE;
    try { THREE = await import(THREE_URL); }
    catch (err) { console.warn('[ChocoCards] Three.js n’a pas pu être chargé, on garde la version légère.', err); return; }
    try { await Promise.race([document.fonts.load('800 100px "Bricolage Grotesque"'), wait(1500)]); } catch { /* police non bloquante */ }

    // Pas de test WebGL préalable (coûteux) : si la création échoue, la version CSS reste affichée
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      console.info('[ChocoCards] WebGL indisponible : version légère conservée.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    // Matériaux holographiques
    const shared = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } };
    const tex = (cnv) => { const t = new THREE.CanvasTexture(cnv); t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); return t; };
    const makeMaterial = ({ color, mask }, intensity) => new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex(color) }, uMask: { value: tex(mask) }, uIntensity: { value: intensity }, uTime: shared.uTime, uMouse: shared.uMouse },
      vertexShader: CARD_VERTEX, fragmentShader: CARD_FRAGMENT, transparent: true
    });
    const matBack = makeMaterial(drawCardBack(), 0.9);
    const matFront = makeMaterial(drawCardFront(), 1.0);

    // Cartes (recto + verso dos à dos)
    const CW = 1.5; const CH = CW * (88 / 63);
    const geo = new THREE.PlaneGeometry(CW, CH);
    const group = new THREE.Group();
    scene.add(group);
    const count = lite ? 5 : 9;
    const cards = [];
    for (let i = 0; i < count; i += 1) {
      const card = new THREE.Group();
      const front = new THREE.Mesh(geo, matFront);
      const back = new THREE.Mesh(geo, matBack);
      back.rotation.y = Math.PI;
      card.add(front, back);
      card.userData = {
        phase: Math.random() * Math.PI * 2,
        speed: (0.18 + Math.random() * 0.22) * (i % 2 ? 1 : -1),
        ry0: Math.random() * Math.PI * 2,
        x: 0, y: 0
      };
      group.add(card);
      cards.push(card);
    }

    // Paillettes dorées
    const N = lite ? 180 : 560;
    const pos = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    const sizes = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      pos[i * 3] = (Math.random() * 2 - 1) * 12;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = -9 + Math.random() * 11;
      seeds[i] = Math.random();
      sizes[i] = 1.5 + Math.random() * 4.5;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: SPARKLE_VERTEX, fragmentShader: SPARKLE_FRAGMENT,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const sparkles = new THREE.Points(pGeo, pMat);
    scene.add(sparkles);

    // Placement des cartes selon le format de l'écran
    const layout = () => {
      const w = hero.clientWidth; const h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const halfW = halfH * camera.aspect;
      const wide = w >= 900;
      // Sur mobile, les cartes restent dans la zone libre entre le header et le texte
      const toWorldY = (py) => halfH * (1 - (2 * py) / h);
      const headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 80;
      const textTop = $('.hero__inner', hero)?.offsetTop || h * 0.5;
      const zoneTop = toWorldY(headerH + 10);
      const zoneBottom = toWorldY(textTop - 10);
      cards.forEach((card, i) => {
        const u = card.userData;
        const t = count > 1 ? i / (count - 1) : 0.5;
        const golden = (i * 0.618 + 0.2) % 1;
        const s = i === Math.floor(count / 2) ? 1.3 : 0.85 + ((i * 0.53) % 1) * 0.3;
        if (wide) {
          u.x = halfW * (0.2 + golden * 0.7);
          u.y = halfH * (0.62 - t * 1.3);
          card.position.z = -3.2 + ((i * 0.37) % 1) * 4.2;
          card.scale.setScalar(s);
        } else {
          const scale = s * 0.72;
          const halfCard = (CH * scale) / 2;
          const top = zoneTop - halfCard;
          const bottom = Math.min(zoneBottom + halfCard, top);
          u.x = halfW * (-0.7 + golden * 1.4);
          u.y = top - (top - bottom) * ((i * 0.43 + 0.15) % 1);
          card.position.z = -1.2 + ((i * 0.37) % 1) * 1.6;
          card.scale.setScalar(scale);
        }
        card.position.x = u.x;
      });
    };
    layout();

    // Souris / gyroscope
    const mouse = new THREE.Vector2();
    const target = new THREE.Vector2();
    window.addEventListener('pointermove', (e) => {
      target.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    const onOrientation = (e) => {
      if (e.gamma == null) return;
      target.set(clamp(e.gamma / 25, -1, 1), clamp((e.beta - 45) / 25, -1, 1));
    };
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    // iOS : autorisation du gyroscope au premier toucher
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      hero.addEventListener('touchend', () => { DeviceOrientationEvent.requestPermission().catch(() => {}); }, { once: true });
    }

    let scrollProgress = 0;
    window.addEventListener('scroll', () => { scrollProgress = clamp(window.scrollY / hero.offsetHeight, 0, 1); }, { passive: true });

    // Boucle d'animation (en pause hors écran)
    let running = false;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let firstFrame = true;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      mouse.lerp(target, 0.05);
      shared.uTime.value = time;
      shared.uMouse.value.copy(mouse);
      cards.forEach((card) => {
        const u = card.userData;
        card.rotation.y = u.ry0 + time * u.speed + mouse.x * 0.6;
        card.rotation.x = Math.sin(time * 0.6 + u.phase) * 0.22 + mouse.y * 0.3;
        card.rotation.z = Math.sin(time * 0.4 + u.phase) * 0.12;
        card.position.y = u.y + Math.sin(time * 0.8 + u.phase) * 0.18;
      });
      group.rotation.y = mouse.x * 0.12;
      group.rotation.x = mouse.y * 0.06;
      group.position.y = scrollProgress * 2.6;
      sparkles.rotation.y = time * 0.015 + mouse.x * 0.05;
      sparkles.position.y = scrollProgress * 1.2;
      renderer.render(scene, camera);
      if (firstFrame) { firstFrame = false; hero.classList.add('is-3d'); }
    };
    const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    let visible = true;
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0 }).observe(hero);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible) start(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(hero);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); hero.classList.remove('is-3d'); });
    start();
  }

  /* ---------- 12. Démarrage ---------- */

  function init() {
    // 1. Contenus
    renderMenus();
    renderAnniversary();
    renderCategories();
    renderPreorder();
    renderReleases();
    renderProductSliders();
    renderOtherTcg();
    renderInstagram();
    renderEvents();
    renderStoreInfo();

    // 2. Interface
    initHeader();
    initMegaMenu();
    initDropdowns();
    initDrawers();
    initSearch();
    initCart();
    initAnchors();
    initNewsletter();

    // 3. Effets
    initSmoothScroll();
    initMarquee();
    initTilt();
    initMagnetic();
    initCursor();
    initReveal();
    initCounters();
    initCountdowns();
    initCoverflow();
    initSliders();
    initGsapAnimations();

    // Ordre d'entrée des éléments du hero (animation CSS)
    $$('[data-hero-item]').forEach((el, i) => el.style.setProperty('--i', i));

    // 4. La 3D arrive en dernier : quand le navigateur est disponible (ordinateur)
    //    ou au premier geste sur mobile (affichage initial plus rapide ; les cartes CSS
    //    sont visibles en attendant).
    let heroStarted = false;
    const startHero = () => { if (heroStarted) return; heroStarted = true; initHero3D(); };
    if (mqMobile.matches) {
      const events = ['touchstart', 'scroll', 'pointerdown', 'keydown'];
      const once = () => { events.forEach((ev) => window.removeEventListener(ev, once)); startHero(); };
      events.forEach((ev) => window.addEventListener(ev, once, { passive: true }));
    } else {
      const idle = () => (window.requestIdleCallback || ((cb) => setTimeout(cb, 300)))(startHero, { timeout: 2000 });
      if (document.readyState === 'complete') idle();
      else window.addEventListener('load', idle, { once: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
