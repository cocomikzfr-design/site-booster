// assets/chips.js : puces collées dont le bloc laiton glisse et s'étire d'une puce à l'autre.
export function initChips(container, { onSelect } = {}) {
  if (!container || container.__chips) return container && container.__chips;
  let ind = container.querySelector('.chips__ind');
  if (!ind) { ind = document.createElement('span'); ind.className = 'chips__ind'; ind.setAttribute('aria-hidden', 'true'); container.prepend(ind); }
  const chips = () => [...container.querySelectorAll('.chip:not([hidden])')];
  const activeChip = () => chips().find((c) => c.classList.contains('is-active') || c.getAttribute('aria-pressed') === 'true' || c.querySelector('input:checked'));
  function place(chip = activeChip(), recenter = true) {
    if (!chip) { ind.style.setProperty('--w', '0px'); return; }
    ind.style.setProperty('--w', `${chip.offsetWidth}px`);
    ind.style.setProperty('--x', `${chip.offsetLeft}px`);
    ind.style.setProperty('--y', `${chip.offsetTop}px`);
    ind.style.setProperty('--h', `${chip.offsetHeight}px`);
    // Sur mobile, la puce active est recentrée dans la rangée défilante
    if (recenter && container.scrollWidth > container.clientWidth) {
      container.scrollTo({ left: chip.offsetLeft - (container.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
    }
  }
  function setActive(chip) {
    chips().forEach((c) => {
      const on = c === chip; c.classList.toggle('is-active', on);
      if (c.hasAttribute('aria-pressed')) c.setAttribute('aria-pressed', String(on));
    });
    place(chip);
  }
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip'); if (!chip || chip.disabled) return;
    if (chip.querySelector('input')) { requestAnimationFrame(() => place()); return; }
    if (onSelect) onSelect(chip);
  });
  container.addEventListener('change', () => place());
  new ResizeObserver(() => place(undefined, false)).observe(container);
  if (document.fonts) document.fonts.ready.then(() => place(undefined, false));
  place(undefined, false);
  return (container.__chips = { place, setActive });
}
