// assets/price-tag.js : étiquette ivoire pendue au produit actif par un fil de laiton.
// Pendule amorti : ω += (−38ψ − 3.2ω − vitesse × 22)·dt ; ψ += ω·dt ; |ψ| ≤ 35°.
// Au changement de produit : demi-tour rotateY (700 ms), le nouveau prix est écrit sur la face cachée.
import { EASE_IO, isReduced } from 'motion-core';
import { t } from 'ui';

const DEG = Math.PI / 180, LIM = 35 * DEG;

export class PriceTag {
  constructor(el, onWake) {
    this.el = el; this.card = el.querySelector('.tag__card'); this.faces = [...el.querySelectorAll('.tag__face')];
    this.psi = 0; this.omega = 0; this.side = 0; this.target = 0; this.angle = 0; this.flip = null; this.rest = true; this.tf = '';
    el.addEventListener('pointerenter', () => { this.omega += 2.5; this.rest = false; if (onWake) onWake(); });
  }
  fill(face, p) {
    face.querySelector('.tag__from').textContent = p.priceVaries ? t('from') : '';
    face.querySelector('.tag__amount').textContent = p.price;
    face.classList.toggle('is-sold', !p.available);
  }
  set(p, dir = 1, instant = false) {
    if (instant || isReduced()) { this.fill(this.faces[this.side], p); return; }
    if (this.flip) { this.fill(this.faces[this.target], p); return; } // demi-tour en cours : face d'arrivée
    this.target = 1 - this.side;
    this.fill(this.faces[this.target], p);
    const from = this.angle, to = from + 180 * (dir < 0 ? -1 : 1);
    this.flip = this.card.animate([{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }], { duration: 700, easing: EASE_IO, fill: 'forwards' });
    this.flip.finished.then(() => {
      this.angle = to; this.side = this.target; this.card.style.transform = `rotateY(${to}deg)`;
      this.flip.cancel(); this.flip = null;
    }).catch(() => { this.flip = null; });
  }
  // x, y : point d'accroche dans la section ; vel : vitesse lissée du plateau (crans/s)
  update(dt, x, y, vel, reduced) {
    if (reduced) { this.psi = 0; this.omega = 0; }
    else {
      this.omega += (-38 * this.psi - 3.2 * this.omega - vel * 22) * dt;
      this.psi += this.omega * dt;
      if (this.psi > LIM) { this.psi = LIM; this.omega = Math.min(0, this.omega); }
      if (this.psi < -LIM) { this.psi = -LIM; this.omega = Math.max(0, this.omega); }
    }
    this.rest = Math.abs(this.psi) < 1e-3 && Math.abs(this.omega) < 1e-3;
    const tf = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(this.psi / DEG).toFixed(2)}deg)`;
    if (tf !== this.tf) { this.el.style.transform = tf; this.tf = tf; }
  }
}
