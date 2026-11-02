/* Noël en Façade — neige décorative légère, désactivée si le visiteur réduit les animations. */
(() => {
  const layer = document.querySelector('.snow-layer');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!layer || motionQuery.matches) return;

  const random = (min, max) => min + Math.random() * (max - min);

  function createFlakes() {
    const density = parseInt(layer.dataset.density, 10) || 25;
    const count = window.innerWidth < 750 ? Math.round(density / 2) : density;
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < count; index += 1) {
      const flake = document.createElement('span');
      const duration = random(9, 18);
      flake.className = 'snow-layer__flake';
      flake.style.setProperty('--x', `${random(0, 100).toFixed(2)}%`);
      flake.style.setProperty('--size', `${random(2, 6).toFixed(1)}px`);
      flake.style.setProperty('--opacity', random(0.4, 0.9).toFixed(2));
      flake.style.setProperty('--duration', `${duration.toFixed(1)}s`);
      flake.style.setProperty('--delay', `${(-random(0, duration)).toFixed(1)}s`);
      flake.style.setProperty('--drift', `${random(-40, 40).toFixed(0)}px`);
      fragment.appendChild(flake);
    }
    layer.appendChild(fragment);
  }

  function syncVisibility() {
    layer.classList.toggle('is-paused', document.hidden);
  }

  function start() {
    createFlakes();
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
  }

  motionQuery.addEventListener('change', (event) => {
    if (event.matches) layer.replaceChildren();
  });

  if (document.hidden) {
    document.addEventListener('visibilitychange', start, { once: true });
  } else {
    start();
  }
})();
