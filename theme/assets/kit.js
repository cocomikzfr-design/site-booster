// assets/kit.js : vue éclatée du Kit du Collectionneur pilotée par le défilement.
// p (0 → 1) lissé : 0–.15 titre ; .15–.6 les éléments s'écartent du disque ; .4–.75 traits et étiquettes ;
// .75–1 bloc d'achat. Mobile et mouvement réduit : pas de sticky, éléments qui apparaissent un par un.
import { subscribe, damp, span, isReduced, EASE } from 'motion-core';

const desktop = matchMedia('(min-width: 768px)');

function init(root) {
  if (root.__kit) return; root.__kit = true;
  const stage = root.querySelector('[data-kit-stage]');
  const pieces = [...root.querySelectorAll('[data-kit-piece]')].map((el) => ({
    el, line: el.querySelector('.kit__line'), label: el.querySelector('.kit__label'),
    x: +getComputedStyle(el).getPropertyValue('--x'), y: +getComputedStyle(el).getPropertyValue('--y'),
    r: +getComputedStyle(el).getPropertyValue('--r'), left: el.classList.contains('kit__piece--l')
  }));
  const heads = [...root.querySelectorAll('.kit__head .line > span')];
  const extra = [...root.querySelectorAll('.kit__head .lede, .kit__head .box')];
  const buy = root.querySelector('[data-kit-buy]');
  let p = 0, pT = 0, running = false, visible = false, W = 0, H = 0;
  const on = () => desktop.matches && !isReduced() && !window.theme.designMode;

  function measure() {
    W = stage.offsetWidth; H = stage.offsetHeight;
    const r = root.getBoundingClientRect();
    pT = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
  }
  function apply() {
    const k0 = span(p, 0, 0.15), k1 = span(p, 0.15, 0.6), k2 = span(p, 0.4, 0.75), k3 = span(p, 0.75, 1);
    heads.forEach((s, i) => { s.style.transform = `translateY(${((1 - span(p, i * 0.03, 0.12 + i * 0.03)) * 105).toFixed(1)}%)`; });
    extra.forEach((s) => { s.style.clipPath = `inset(0 0 ${((1 - k0) * 100).toFixed(1)}% 0)`; });
    const n = pieces.length;
    pieces.forEach((pc, i) => {
      const dx = ((50 - pc.x) / 100) * W * (1 - k1), dy = ((54 - pc.y) / 100) * H * (1 - k1);
      const rs = (i - (n - 1) / 2) * 7, rot = rs + (pc.r - rs) * k1, sc = 0.86 + 0.14 * k1;
      pc.el.style.transform = `translate(-50%, -50%) translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      pc.el.style.zIndex = String(n - i);
      const kk = span(k2, i * 0.12, 0.7 + i * 0.1);
      if (pc.line) pc.line.style.transform = `scaleX(${kk.toFixed(3)})`;
      if (pc.label) pc.label.style.clipPath = pc.left ? `inset(0 0 0 ${((1 - kk) * 100).toFixed(1)}%)` : `inset(0 ${((1 - kk) * 100).toFixed(1)}% 0 0)`;
    });
    if (buy) { buy.style.clipPath = `inset(0 0 ${((1 - k3) * 100).toFixed(1)}% 0)`; buy.style.transform = `translateY(${((1 - k3) * 30).toFixed(1)}px)`; }
  }
  function clear() {
    [...heads, ...extra, buy, ...pieces.flatMap((pc) => [pc.el, pc.line, pc.label])].forEach((el) => { if (el) { el.style.transform = ''; el.style.clipPath = ''; el.style.zIndex = ''; } });
  }
  function tick(dt) {
    measure();
    p = damp(p, pT, 8, dt);
    if (Math.abs(p - pT) < 0.0005) p = pT;
    apply();
    if (p === pT && !visible) { running = false; return false; }
    if (p === pT) { running = false; return false; }
  }
  const wake = () => { if (!running && on()) { running = true; subscribe(tick); } };

  // Mobile / mouvement réduit : chaque élément apparaît par découpe quand il entre à l'écran
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting || on()) return;
      io.unobserve(e.target);
      if (!isReduced()) e.target.animate([{ clipPath: 'inset(100% 0 0 0)', transform: 'translateY(24px)' }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }], { duration: 800, easing: EASE, fill: 'backwards' });
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  function setup() {
    const enabled = on();
    root.classList.toggle('kit--scroll', enabled);
    if (enabled) { measure(); p = pT; apply(); wake(); }
    else { clear(); pieces.forEach((pc) => io.observe(pc.el)); }
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(root);
  addEventListener('scroll', () => { if (visible) wake(); }, { passive: true });
  addEventListener('resize', () => { if (visible) wake(); });
  desktop.addEventListener('change', setup);
  setup();
}

document.querySelectorAll('[data-kit]').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-kit]').forEach(init));
