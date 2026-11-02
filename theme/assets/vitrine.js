// assets/vitrine.js : la vitrine. Un plateau tournant, des produits placés en 3D CSS sur un cercle,
// un ressort pour la rotation, une étiquette pendule, des poussières dans le faisceau.
// s = position du plateau en crans (1 cran = 1 produit), T = cible, n = nombre de produits.
import { subscribe, isReduced, damp, smoothstep, wrap, mod } from 'motion-core';
import { swapMaskedText } from 'masked-text';
import { initChips } from 'chips';
import { Dust } from 'dust';
import { PriceTag } from 'price-tag';
import { sheetTo, vtSupported } from 'page-transitions';
import { t } from 'ui';

const DEG = Math.PI / 180;
const html = document.documentElement;
const mobile = matchMedia('(max-width: 767px)');
const pad = (n) => String(n).padStart(2, '0');
const now = () => performance.now() / 1000;
const priceText = (p) => `${p.priceVaries ? `${t('from')} ` : ''}${p.price}${p.available ? '' : ` · ${t('soldOut')}`}`;

class Vitrine {
  constructor(root) {
    this.root = root;
    const json = root.querySelector('script[type="application/json"]');
    this.data = json ? JSON.parse(json.textContent) : { products: [] };
    this.P = this.data.products || []; this.n = this.P.length;
    this.intro();
    if (this.n < 3 || root.classList.contains('vitrine--flat')) return; // pas de 3D : la rangée reste
    this.$ = (s) => root.querySelector(s);
    this.viewport = this.$('.vitrine__viewport');
    this.stripes = this.$('.plate__stripes');
    this.probe = this.$('.vitrine__probe');
    this.items = [...root.querySelectorAll('.vitrine__item')].map((li, i) => ({
      li, i, a: li.querySelector('.item'), front: li.querySelector('.face--front'),
      hover: 0, hoverT: 0, tf: '', shade: '', g: '', z: '', vis: '', lift: '', rise: ''
    }));
    this.nameEl = this.$('.legend__name'); this.lineEl = this.$('.legend__line'); this.priceEl = this.$('.legend__price');
    this.announceEl = this.$('[data-live]'); this.counterEl = this.$('[data-counter]');
    this.see = this.$('[data-see]'); this.pauseBtn = this.$('[data-pause]');
    const start = this.data.startIndex || 0;
    this.T = start; this.s = start; this.active = start; this.vel = 0;
    this.tiltX = 0; this.tiltY = 0; this.onActive = 0;
    this.mx = 0; this.my = 0; this.inside = false; this.hasFocus = false; this.inView = true;
    this.drag = null; this.suppressClick = false; this.paused = false; this.running = false; this.dead = false;
    this.autoplay = Math.max(0, this.data.autoplay || 0);
    this.nextAuto = now() + this.autoplay;
    this.spot = ''; this.seeTf = ''; this.turn = '';
    // Écran d'ouverture : le plateau arrive en tournant (s part de start − 2,5)
    if (html.classList.contains('is-opening') && !isReduced()) {
      this.s = start - 2.5; this.hold = true;
      const go = () => { this.hold = false; this.wake(); };
      document.addEventListener('opening:reveal', go, { once: true });
      setTimeout(go, 1500);
    }
    this.tick = this.tick.bind(this);
    this.measure();
    this.tag = this.$('[data-tag]') ? new PriceTag(this.$('[data-tag]'), () => this.wake()) : null;
    if (this.tag) this.tag.set(this.P[start], 1, true);
    this.setActive(start, 1, true);
    this.chips = initChips(this.$('.vitrine__chips'), { onSelect: (c) => this.selectChip(c) });
    this.syncChips();
    this.bind();
    const canvas = this.$('.vitrine__dust');
    if (canvas && this.data.dust > 0) this.dust = new Dust(canvas, { density: this.data.dust, beam: (x, y) => this.beam(x, y) });
    root.classList.add('is-live');
    this.hint();
    this.wake();
  }

  // Les lignes du titre montent (après l'écran d'ouverture s'il y en a un)
  intro() {
    const show = () => this.root.classList.add('is-intro');
    if (html.classList.contains('is-opening')) {
      document.addEventListener('opening:reveal', show, { once: true }); setTimeout(show, 1500);
    } else requestAnimationFrame(show);
  }

  measure() {
    this.V = this.probe.offsetHeight || 300;
    this.R = (mobile.matches ? 0.95 : 1.15) * this.V;
    const rr = this.root.getBoundingClientRect(), vr = this.viewport.getBoundingClientRect();
    const st = this.$('.vitrine__stage').getBoundingClientRect();
    // Géométrie du faisceau (repère de la section) : sommet au-dessus, demi-largeur 0.75 V au sol
    this.floorX = st.left - rr.left; this.floorY = st.top - rr.top;
    this.apexY = this.floorY - 2.2 * this.V; this.vpTop = vr.top - rr.top;
    this.needMeasure = false;
  }

  beam(x, y) {
    const hw = ((y - this.apexY) / (this.floorY - this.apexY)) * 0.75 * this.V;
    if (hw <= 0) return 0;
    const below = y > this.floorY ? Math.max(0, 1 - (y - this.floorY) / (0.35 * this.V)) : 1;
    return Math.max(0, 1 - Math.abs(x - this.floorX) / hw) * below;
  }

  wake() { if (!this.running && !this.dead) { this.running = true; subscribe(this.tick); } }
  bump() { this.nextAuto = now() + 2 * this.autoplay; }
  go(target, user = true) { this.T = target; if (user) this.bump(); this.wake(); }
  nearest(i) { return Math.round(this.T + wrap(i - this.T, this.n)); }

  setActive(i, dir, initial = false) {
    const prev = this.items[this.active], cur = this.items[i];
    const hadFocus = prev && prev.a === document.activeElement;
    this.items.forEach((it) => { const on = it === cur; it.a.classList.toggle('is-active', on); it.a.tabIndex = on ? 0 : -1; it.a.dataset.cursor = on ? 'view' : 'item'; });
    this.active = i;
    const p = this.P[i];
    if (!initial) {
      swapMaskedText(this.nameEl, p.title, dir, 0);
      swapMaskedText(this.lineEl, p.line || '', dir, 40);
      swapMaskedText(this.priceEl, priceText(p), dir, 80);
      swapMaskedText(this.counterEl, pad(i + 1), dir);
      if (this.tag) this.tag.set(p, dir);
      this.announcePending = true;
      this.syncChips();
      if (hadFocus) cur.a.focus({ preventScroll: true });
      document.dispatchEvent(new Event('cursor:refresh'));
    }
    if (this.see) { this.see.href = p.url; this.see.setAttribute('aria-label', `${t('see')} : ${p.title}`); }
  }

  syncChips() {
    if (!this.chips) return;
    const type = this.P[this.active].type;
    const box = this.$('.vitrine__chips');
    const chip = [...box.querySelectorAll('.chip')].find((c) => c.dataset.type && c.dataset.type === type) || box.querySelector('.chip[data-type=""]');
    this.chips.setActive(chip);
  }

  selectChip(chip) {
    const type = chip.dataset.type;
    const i = type ? this.P.findIndex((p) => p.type === type) : (this.data.startIndex || 0);
    if (i >= 0) this.go(this.nearest(i));
  }

  bind() {
    const { root, viewport } = this;
    // Clic : un produit non actif vient devant ; l'actif s'ouvre (transition de page)
    viewport.addEventListener('click', (e) => {
      const a = e.target.closest('.item'); if (!a) return;
      if (this.suppressClick) { e.preventDefault(); this.suppressClick = false; return; }
      const i = +a.dataset.index;
      if (i !== this.active || Math.abs(this.T - this.s) > 0.5) { e.preventDefault(); this.go(this.nearest(i)); return; }
      this.open(e, a.href);
    });
    if (this.see) this.see.addEventListener('click', (e) => this.open(e, this.see.href));
    viewport.addEventListener('dragstart', (e) => e.preventDefault());
    root.querySelectorAll('.vitrine__arrow').forEach((b) => b.addEventListener('click', () => {
      this.go(Math.round(this.T) + (b.dataset.dir === 'prev' ? -1 : 1));
    }));
    // Clavier : ← → Début Fin ; le focus sur un produit le fait venir devant
    root.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || !e.target.closest('.vitrine__viewport, .vitrine__arrow, .vitrine__see')) return;
      const k = { ArrowRight: Math.round(this.T) + 1, ArrowLeft: Math.round(this.T) - 1, Home: this.nearest(0), End: this.nearest(this.n - 1) }[e.key];
      if (k === undefined) return;
      e.preventDefault(); this.go(k);
    });
    viewport.addEventListener('focusin', (e) => { const a = e.target.closest('.item'); if (a && +a.dataset.index !== this.active) this.go(this.nearest(+a.dataset.index)); });
    root.addEventListener('focusin', () => { this.hasFocus = true; this.bump(); });
    root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) this.hasFocus = false; });
    // Pointeur : inclinaison, survol, sortie
    root.addEventListener('pointermove', (e) => { this.mx = e.clientX; this.my = e.clientY; this.inside = true; this.wake(); }, { passive: true });
    root.addEventListener('pointerleave', () => { this.inside = false; this.items.forEach((it) => { it.hoverT = 0; }); this.wake(); });
    viewport.addEventListener('pointerover', (e) => { const a = e.target.closest('.item'); if (a) this.items[+a.dataset.index].hoverT = 1; });
    viewport.addEventListener('pointerout', (e) => { const a = e.target.closest('.item'); if (a && !a.contains(e.relatedTarget)) this.items[+a.dataset.index].hoverT = 0; });
    // Glissement horizontal (le geste vertical laisse défiler la page)
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, T0: this.T, mode: 'pending', hist: [[e.clientX, e.timeStamp]] };
      this.bump(); this.wake();
    });
    viewport.addEventListener('pointermove', (e) => {
      const d = this.drag; if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (d.mode === 'pending') {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dx) <= 1.2 * Math.abs(dy)) { this.drag = null; return; }
        d.mode = 'drag'; this.suppressClick = true;
        try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ }
        html.classList.add('is-dragging'); document.dispatchEvent(new Event('cursor:refresh'));
      }
      this.T = d.T0 - dx / (0.75 * this.V);
      d.hist.push([e.clientX, e.timeStamp]); if (d.hist.length > 16) d.hist.shift();
      this.wake();
    });
    const end = (e) => {
      const d = this.drag; if (!d || e.pointerId !== d.id) return;
      this.drag = null;
      if (d.mode !== 'drag') return;
      html.classList.remove('is-dragging'); document.dispatchEvent(new Event('cursor:refresh'));
      const pts = d.hist.filter((p) => e.timeStamp - p[1] <= 80);
      let vx = 0;
      if (pts.length > 1) { const a = pts[0], b = pts[pts.length - 1]; vx = ((b[0] - a[0]) / Math.max(1, b[1] - a[1])) * 1000; }
      this.go(Math.round(this.T - (vx / (0.75 * this.V)) * 0.35));
      setTimeout(() => { this.suppressClick = false; }, 350);
    };
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    // Trackpad : seul un geste horizontal fait tourner ; la molette verticale fait défiler la page
    viewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      this.T += e.deltaX / (0.45 * this.V); this.bump(); this.wake();
      clearTimeout(this.wheelT); this.wheelT = setTimeout(() => this.go(Math.round(this.T)), 160);
    }, { passive: false });
    // Pause de la rotation automatique (WCAG 2.2.2)
    if (this.pauseBtn) {
      if (isReduced() || window.theme.designMode) this.pauseBtn.hidden = true;
      this.pauseBtn.addEventListener('click', () => {
        this.paused = !this.paused;
        this.pauseBtn.setAttribute('aria-pressed', String(this.paused));
        this.pauseBtn.setAttribute('aria-label', this.paused ? t('play') : t('pause'));
        this.pauseBtn.querySelector('svg').innerHTML = this.paused ? '<path d="M8 5.5v13l10.5-6.5L8 5.5z"/>' : '<path d="M8.5 5.5v13M15.5 5.5v13"/>';
        this.bump(); this.wake();
      });
    }
    const next = this.$('[data-scroll-next]');
    if (next) next.addEventListener('click', () => {
      const sec = root.closest('.shopify-section'); const target = sec && sec.nextElementSibling;
      if (target) target.scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth' });
    });
    this.ro = new ResizeObserver(() => { this.needMeasure = true; this.wake(); });
    this.ro.observe(root);
    this.io = new IntersectionObserver(([e]) => { this.inView = e.isIntersecting; if (this.inView) { this.bump(); this.wake(); } });
    this.io.observe(root);
    mobile.addEventListener('change', () => { this.needMeasure = true; this.wake(); });
  }

  // Ouverture du produit actif : View Transitions si possible, sinon feuille de papier
  open(e, url) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || vtSupported()) return;
    e.preventDefault();
    sheetTo(url, this.items[this.active].front.getBoundingClientRect());
  }

  hint() {
    const el = this.$('[data-hint]'); if (!el || !mobile.matches) return;
    try { if (sessionStorage.getItem('galerie:hint')) return; sessionStorage.setItem('galerie:hint', '1'); } catch (err) { return; }
    setTimeout(() => this.root.classList.add('show-hint'), 600);
    setTimeout(() => this.root.classList.remove('show-hint'), 3600);
  }

  tick(dt, time) {
    if (this.dead) return false;
    const rm = isReduced(), n = this.n, isMobile = mobile.matches;
    if (this.needMeasure) this.measure();
    // Lectures de mise en page avant les écritures
    const rr = this.root.getBoundingClientRect();
    const fr = this.items[this.active].front.getBoundingClientRect();

    // 1. Ressort : s rejoint T (k = 5, 16 en glissement)
    const prev = this.s;
    if (!this.hold) {
      if (rm) this.s = this.T;
      else {
        this.s = damp(this.s, this.T, this.drag && this.drag.mode === 'drag' ? 16 : 5, dt);
        if (Math.abs(this.T - this.s) < 1e-4) this.s = this.T;
      }
    }
    this.vel = rm ? 0 : damp(this.vel, dt > 0 ? (this.s - prev) / dt : 0, 8, dt);

    // 2. Produit actif
    const act = mod(Math.round(this.s), n);
    if (act !== this.active) this.setActive(act, wrap(act - this.active, n) >= 0 ? 1 : -1);
    if (this.announcePending && this.s === this.T) {
      this.announcePending = false;
      const p = this.P[this.active];
      this.announceEl.textContent = `${p.title}, ${priceText(p)}`;
    }

    // 3. Inclinaison vers la souris
    let ty = 0, tx = 0, on = 0;
    if (this.inside && !rm && !this.drag) {
      const cx = fr.left + fr.width / 2, cy = fr.top + fr.height / 2;
      const dx = this.mx - cx, dy = this.my - cy;
      if (Math.abs(dx) < 0.6 * fr.width && Math.abs(dy) < 0.6 * fr.height && Math.abs(this.T - this.s) < 0.25) {
        ty = (dx / (0.6 * fr.width)) * 14; tx = (-dy / (0.6 * fr.height)) * 8; on = 1;
      } else ty = ((this.mx - rr.left - rr.width / 2) / rr.width) * 6;
    }
    const k7 = 1 - Math.exp(-7 * dt);
    this.tiltY += (ty - this.tiltY) * k7; this.tiltX += (tx - this.tiltX) * k7; this.onActive += (on - this.onActive) * k7;

    // 4. Placement des produits sur le cercle
    const { V, R } = this;
    const idle = rm ? 0 : Math.sin(time * 0.55) * 16 * (1 - this.onActive);
    const kh = 1 - Math.exp(-12 * dt);
    for (const it of this.items) {
      const r = wrap(it.i - this.s, n);
      const phi = (r * 2 * Math.PI) / n;
      const depth = (1 - Math.cos(phi)) / 2;
      const hidden = isMobile ? Math.abs(r) > 2.5 : depth > 0.92;
      const vis = hidden ? 'hidden' : '';
      if (vis !== it.vis) { it.li.style.visibility = vis; it.vis = vis; }
      if (hidden) continue; // calculs sautés pour les produits cachés
      it.hover += ((it.hoverT && it.i !== this.active ? 1 : 0) - it.hover) * kh;
      const o = smoothstep(Math.max(0, 1 - Math.abs(r)));
      const x = R * Math.sin(phi);
      const z = R * Math.cos(phi) - R + o * 0.16 * V;
      const rise = o * 0.1 * V + it.hover * 0.04 * V;
      const rotY = (-phi / DEG) * 0.45 + o * (idle + this.tiltY);
      const rotX = o * this.tiltX, rotZ = o * -2.5, sc = 0.78 + 0.22 * o;
      const tf = `translate3d(${x.toFixed(1)}px,${(-rise).toFixed(1)}px,${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      if (tf !== it.tf) { it.li.style.transform = tf; it.tf = tf; }
      const shade = (0.62 * depth + 0.18 * (1 - o) * (1 - depth)).toFixed(2);
      if (shade !== it.shade) { it.li.style.setProperty('--shade', shade); it.shade = shade; }
      const g = (rotY / 30).toFixed(2);
      if (g !== it.g) { it.li.style.setProperty('--g', g); it.g = g; }
      const zi = String(Math.round(1000 - 900 * depth));
      if (zi !== it.z) { it.li.style.zIndex = zi; it.z = zi; }
      const lift = (o + it.hover * 0.4).toFixed(2);
      if (lift !== it.lift) { it.li.style.setProperty('--lift', lift); it.lift = lift; }
      const rs = `${(rise / sc).toFixed(1)}px`;
      if (rs !== it.rise) { it.li.style.setProperty('--rise', rs); it.rise = rs; }
    }

    // 5. Stries du plateau, projecteur, étiquette, bouton « Voir », vent des particules
    const turn = `rotate(${((-this.s * 360) / n).toFixed(2)}deg)`;
    if (turn !== this.turn) { this.stripes.style.transform = turn; this.turn = turn; }
    const spot = (1 - Math.min(1, Math.abs(this.vel) * 0.35)).toFixed(2);
    if (spot !== this.spot) { this.root.style.setProperty('--spot', spot); this.spot = spot; }
    if (this.tag) this.tag.update(dt, fr.right - rr.left - 8, fr.top - rr.top + 10, this.vel, rm);
    if (this.see) {
      const k = smoothstep(Math.max(0, 1 - Math.abs(this.T - this.s) * 3));
      const tf = `translate(${(fr.right - rr.left - 6).toFixed(1)}px,${(fr.bottom - rr.top - 6).toFixed(1)}px) scale(${k.toFixed(3)})`;
      if (tf !== this.seeTf) { this.see.style.transform = tf; this.seeTf = tf; }
    }
    if (this.dust) this.dust.wind = this.vel;

    // 6. Rotation automatique (pointeur hors section, pas de focus, visible, pas de mouvement réduit)
    const t0 = now();
    const canAuto = this.autoplay > 0 && !this.paused && !this.inside && !this.hasFocus && !this.drag
      && !rm && !window.theme.designMode && this.inView && !document.hidden;
    if (canAuto && t0 >= this.nextAuto) { this.go(Math.round(this.T) + 1, false); this.nextAuto = t0 + this.autoplay; }

    // 7. Sommeil : hors écran, ou plateau arrêté et pendule au repos en mouvement réduit.
    //    (À l'écran, la rotation lente du produit actif garde la boucle éveillée.)
    const settled = this.s === this.T && (!this.tag || this.tag.rest) && !this.drag && Math.abs(this.vel) < 1e-3;
    if (!this.inView || (settled && rm)) {
      if (!this.inView) { this.s = this.T; }
      this.running = false; return false;
    }
  }

  destroy() {
    this.dead = true;
    if (this.ro) this.ro.disconnect();
    if (this.io) this.io.disconnect();
    if (this.dust) this.dust.destroy();
  }
}

const instances = new Map();
function init(root) {
  if (instances.has(root)) return;
  instances.set(root, new Vitrine(root));
}
document.querySelectorAll('[data-vitrine]').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-vitrine]').forEach(init));
document.addEventListener('shopify:section:unload', (e) => {
  e.target.querySelectorAll('[data-vitrine]').forEach((root) => { const v = instances.get(root); if (v && v.destroy) v.destroy(); instances.delete(root); });
});
document.addEventListener('shopify:block:select', (e) => {
  const root = e.target.closest('[data-vitrine]'); const v = root && instances.get(root);
  if (v && v.selectChip && e.target.classList.contains('chip')) v.selectChip(e.target);
});
