// assets/reveal.js : apparitions au défilement, un seul IntersectionObserver, une seule fois par élément.
// Attributs : data-reveal="lines" | "clip-up" | "rule" | "drop" | "rise" ; data-reveal-wait attend la fin
// de la transition de page. Les états initiaux ne sont posés que sous html.rv (voir theme.css).
window.__reveal = 1;
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    io.unobserve(e.target);
    const el = e.target;
    if (el.hasAttribute('data-reveal-wait')) (window.__pageReady || Promise.resolve()).then(() => el.classList.add('is-in'));
    else el.classList.add('is-in');
  }
}, { rootMargin: '0px 0px -8% 0px' });

export function observe(root = document) {
  root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
}
observe();
document.addEventListener('shopify:section:load', (e) => observe(e.target));
document.addEventListener('reveal:scan', (e) => observe(e.detail || document));
