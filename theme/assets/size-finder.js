// assets/size-finder.js : « Trouve le bon boîtier ». Au choix d'un format, les autres cartes sortent du masque,
// la choisie se range en étiquette ; à l'étape 2, le contour du format se dessine et le produit tombe (rebond).
import { isReduced, EASE, EASE_IO, EASE_BACK } from 'motion-core';
import { initChips } from 'chips';

function init(root) {
  if (root.__sf) return; root.__sf = true;
  const form = root.querySelector('[data-sf-form]');
  const fan = root.querySelector('.sf__fan');
  const cards = [...root.querySelectorAll('[data-sf-card]')];
  const step1 = root.querySelector('[data-sf-step1]');
  const step2 = root.querySelector('[data-sf-step2]');
  const summary = root.querySelector('[data-sf-summary]');
  const chosen = root.querySelector('[data-sf-chosen]');
  const result = root.querySelector('[data-sf-result]');
  const results = [...root.querySelectorAll('.sf__res')];
  const chips = initChips(root.querySelector('.sf__who'));
  const rm = isReduced();
  form.addEventListener('submit', (e) => e.preventDefault());

  const fmt = () => (form.querySelector('.sf__radio:checked') || {}).value;
  const who = () => (step2.querySelector('input:checked') || {}).value;

  async function pick(card) {
    const first = card.getBoundingClientRect();
    if (!rm) {
      await Promise.all(cards.filter((c) => c !== card).map((c, i) => c.animate(
        [{ transform: getComputedStyle(c).transform, clipPath: 'inset(0 0 0 0)' }, { transform: 'translateY(110%)', clipPath: 'inset(0 0 100% 0)' }],
        { duration: 450, delay: i * 40, easing: EASE_IO, fill: 'forwards' }).finished)).catch(() => {});
    }
    chosen.textContent = card.querySelector('.sf__card-label').textContent;
    step1.hidden = true; summary.hidden = false; step2.classList.add('is-on');
    cards.forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
    if (!rm) {
      // La carte choisie se range dans l'étiquette (FLIP)
      const last = chosen.getBoundingClientRect();
      chosen.animate([{ transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: 650, easing: EASE_IO });
      step2.animate([{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(20px)' }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }], { duration: 700, delay: 200, easing: EASE, fill: 'backwards' });
    }
    if (who()) show();
    chips.place();
  }

  function show() {
    const id = fmt(); if (!id) return;
    result.classList.add('has-result');
    results.forEach((r) => {
      const on = r.dataset.format === id; r.classList.toggle('is-on', on);
      r.classList.toggle('is-gift', who() === 'gift');
      if (!on) return;
      if (rm) return;
      // Le contour du format se dessine, le produit recommandé tombe avec un rebond
      r.classList.add('is-drawing'); void r.offsetWidth; requestAnimationFrame(() => r.classList.remove('is-drawing'));
      r.querySelectorAll('.sf__pick:not([hidden])').forEach((el, i) => el.animate(
        [{ transform: 'translateY(-48px)', clipPath: 'inset(0 0 100% 0)' }, { transform: 'none', clipPath: 'inset(-40px)' }],
        { duration: 800, delay: 300 + i * 120, easing: EASE_BACK, fill: 'backwards' }));
    });
  }

  function reset() {
    form.querySelectorAll('.sf__radio').forEach((r) => { r.checked = false; });
    step1.hidden = false; summary.hidden = true; step2.classList.remove('is-on'); result.classList.remove('has-result');
    results.forEach((r) => r.classList.remove('is-on'));
    if (!rm) cards.forEach((c, i) => c.animate([{ transform: 'translateY(110%)', clipPath: 'inset(0 0 100% 0)' }, { transform: getComputedStyle(c).transform, clipPath: 'inset(0 0 0 0)' }], { duration: 600, delay: i * 50, easing: EASE, fill: 'backwards' }));
    const first = form.querySelector('.sf__radio'); if (first) first.focus();
  }

  fan.addEventListener('change', (e) => { const card = e.target.closest('[data-sf-card]'); if (card) pick(card); });
  step2.addEventListener('change', show);
  root.querySelector('[data-sf-reset]').addEventListener('click', reset);
}

document.querySelectorAll('[data-size-finder]').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-size-finder]').forEach(init));
