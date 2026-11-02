// assets/faq.js : <details> dont la hauteur est animée en WAAPI ; une seule question ouverte à la fois.
import { isReduced, EASE_IO } from 'motion-core';

function toggle(d, open) {
  const a = d.querySelector('.faq__a');
  if (isReduced() || !a) { d.open = open; return; }
  if (d.__anim) d.__anim.cancel();
  const start = `${d.offsetHeight}px`;
  if (open) d.open = true;
  const sum = d.querySelector('summary').offsetHeight;
  const end = open ? `${sum + a.offsetHeight}px` : `${sum}px`;
  d.classList.toggle('is-open', open);
  d.__anim = d.animate([{ height: start }, { height: end }], { duration: 550, easing: EASE_IO });
  d.__anim.onfinish = () => { d.__anim = null; if (!open) d.open = false; };
}

function init(root) {
  if (root.__faq) return; root.__faq = true;
  const items = [...root.querySelectorAll('details.faq__item')];
  items.forEach((d) => {
    d.classList.toggle('is-open', d.open);
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      const open = !d.classList.contains('is-open');
      if (open) items.forEach((o) => { if (o !== d && o.classList.contains('is-open')) toggle(o, false); });
      toggle(d, open);
    });
  });
}
document.querySelectorAll('[data-faq]').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-faq]').forEach(init));
document.addEventListener('shopify:block:select', (e) => {
  const d = e.target.closest('details.faq__item'); if (d && !d.open) d.querySelector('summary').click();
});
