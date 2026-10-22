/* ==========================================================================
   Hero · statut d'ouverture en direct (heure de Bruxelles)
   --------------------------------------------------------------------------
   - Puce « Notre magasin est ouvert ! » : point menthe qui respire quand la
     boutique est ouverte en ce moment, icône boutique sinon.
   - Pastille des horaires : « Ouvert maintenant · jusqu'à 19h » ou
     « Fermé · ouvre demain à 10h » (calculé par core/format.js depuis data.js).
   Mis à jour à chaque minute pile. Le conteneur porte data-render-custom :
   render.js n'y touche pas, ce module le remplit dès son chargement.
   ========================================================================== */

import { openState } from '../../core/format.js';

export function initLive(section) {
  const chip = section.querySelector('[data-hero-status]');
  const live = section.querySelector('[data-hero-live]');
  let timer = 0;

  const update = () => {
    let st;
    try { st = openState(); } catch { return; }
    chip?.classList.toggle('is-open-now', st.open);
    if (live) {
      live.textContent = st.label;
      live.classList.add('open-status');
      live.classList.toggle('is-open', st.open);
    }
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { update(); schedule(); }, 60000 - (Date.now() % 60000) + 80);
  };

  update();
  schedule();
  // Retour sur l'onglet après une longue absence : mise à jour immédiate
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { update(); schedule(); } });
}
