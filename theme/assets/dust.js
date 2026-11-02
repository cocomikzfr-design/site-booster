// assets/dust.js : poussières dans le faisceau. Canvas au-dessus des produits, sprite pré-rendu,
// mouvement brownien lent, visibles seulement dans le cône de lumière. Instanciable (classe Dust).
// Usage automatique : <canvas data-dust="0.4"> (densité 0–1) dans n'importe quelle section.
import { subscribe, isReduced } from 'motion-core';

function makeSprite() {
  const s = document.createElement('canvas'); s.width = s.height = 32;
  const g = s.getContext('2d'); const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,244,220,1)'); grd.addColorStop(.35, 'rgba(255,236,200,.55)'); grd.addColorStop(1, 'rgba(255,236,200,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 32, 32); return s;
}
let sprite = null;

// Faisceau par défaut : cône centré qui part du haut et s'élargit vers le bas
const defaultBeam = (x, y, W, H) => {
  const hw = Math.max(1, (y + H * 0.1) * 0.42);
  return Math.max(0, 1 - Math.abs(x - W / 2) / hw);
};

export class Dust {
  constructor(canvas, { density = 1, beam = defaultBeam } = {}) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.density = density; this.beam = beam;
    this.wind = 0; this.mx = -1e4; this.my = -1e4; this.ps = []; this.visible = false; this.running = false;
    sprite = sprite || makeSprite();
    this.tick = this.tick.bind(this);
    this.ro = new ResizeObserver(() => { this.resize(); this.start(); }); this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.start(); }); this.io.observe(canvas);
    const host = canvas.parentElement;
    host.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); this.mx = e.clientX - r.left; this.my = e.clientY - r.top; }, { passive: true });
    host.addEventListener('pointerleave', () => { this.mx = this.my = -1e4; });
  }
  resize() {
    const W = this.c.clientWidth, H = this.c.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (!W || !H) return;
    this.W = W; this.H = H; this.c.width = Math.round(W * dpr); this.c.height = Math.round(H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = isReduced() ? 25 : Math.round(Math.min(90, (W * H) / 14000) * this.density);
    while (this.ps.length < n) this.ps.push(this.spawn());
    this.ps.length = n;
  }
  spawn() {
    return { x: Math.random() * this.W, y: Math.random() * this.H, r: 0.6 + Math.random() * 1.6, v: 4 + Math.random() * 10, a: Math.random() * Math.PI * 2 };
  }
  start() { if (!this.running && this.visible && this.ps.length) { this.running = true; subscribe(this.tick); } }
  destroy() { this.ro.disconnect(); this.io.disconnect(); this.visible = false; }
  tick(dt) {
    if (!this.visible) { this.running = false; return false; }
    const rm = isReduced();
    if (!rm) {
      const { W, H } = this;
      for (const p of this.ps) {
        p.a += (Math.random() - 0.5) * 1.2 * dt;
        p.x += Math.cos(p.a) * p.v * dt - this.wind * 60 * dt;
        p.y += Math.sin(p.a) * p.v * dt + 1.5 * dt;
        // Le curseur écarte doucement les particules (rayon 80px)
        const dx = p.x - this.mx, dy = p.y - this.my, d = Math.hypot(dx, dy);
        if (d < 80 && d > 0.1) { const f = (1 - d / 80) * 90 * dt; p.x += (dx / d) * f; p.y += (dy / d) * f; }
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      }
    }
    this.draw();
    if (rm) { this.running = false; return false; }
  }
  draw() {
    const { ctx, W, H } = this; if (!W) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of this.ps) {
      const a = 0.7 * this.beam(p.x, p.y, W, H);
      if (a < 0.01) continue;
      ctx.globalAlpha = a; const s = p.r * 4;
      ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
}

function auto(root) {
  root.querySelectorAll('canvas[data-dust]').forEach((c) => {
    if (!c.__dust) c.__dust = new Dust(c, { density: parseFloat(c.dataset.dust) || 0.5 });
  });
}
auto(document);
document.addEventListener('shopify:section:load', (e) => auto(e.target));
