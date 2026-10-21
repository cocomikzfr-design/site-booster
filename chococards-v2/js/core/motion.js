/* ==========================================================================
   Préférences de mouvement et capacités de l'appareil
   --------------------------------------------------------------------------
   prefs.reduced     : prefers-reduced-motion (ou ?motion=reduce) → pas de 3D
                       en mouvement, pas de défilement doux, états finaux.
   prefs.finePointer : souris / trackpad (curseur, magnétisme, tilt).
   prefs.mobile      : largeur < 768 px.  prefs.desktop : ≥ 1024 px.
   prefs.tier        : 'high' | 'mid' | 'low' → budget WebGL (voir DESIGN.md).
   prefs.webgl       : false si ?gl=0 ou WebGL indisponible (test paresseux).
   Constantes EASE / DUR : miroir des variables CSS --ease-* / --d-*.
   ========================================================================== */

const params = new URLSearchParams(location.search);
const mq = (q) => window.matchMedia(q);

const qReduced = mq('(prefers-reduced-motion: reduce)');
const qFine = mq('(hover: hover) and (pointer: fine)');
const qMobile = mq('(max-width: 767px)');
const qDesktop = mq('(min-width: 1024px)');
const forcedReduced = params.get('motion') === 'reduce';

const nav = navigator;
const saveData = !!(nav.connection && nav.connection.saveData);
const memory = nav.deviceMemory || 8;
const cores = nav.hardwareConcurrency || 8;

let webglSupport = null;
function testWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement('canvas');
    webglSupport = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

export const prefs = {
  get reduced() { return forcedReduced || qReduced.matches; },
  get finePointer() { return qFine.matches; },
  get mobile() { return qMobile.matches; },
  get desktop() { return qDesktop.matches; },
  get touch() { return !qFine.matches; },
  saveData,
  /** Budget de rendu : 'low' (petit appareil / économie de données), 'mid' (mobile, tablette), 'high' (desktop). */
  get tier() {
    if (saveData || memory <= 2 || (cores <= 4 && qMobile.matches)) return 'low';
    if (!qDesktop.matches || !qFine.matches) return 'mid';
    return 'high';
  },
  /** WebGL autorisé et disponible (le test crée un contexte la première fois seulement). */
  get webgl() { return params.get('gl') !== '0' && testWebGL(); },
};

if (forcedReduced) document.documentElement.classList.add('reduced');

const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb(prefs));
[qReduced, qFine, qMobile, qDesktop].forEach((q) => q.addEventListener('change', notify));

/** Appelle cb(prefs) quand une préférence change (mouvement, pointeur, largeur). Renvoie une fonction de désabonnement. */
export function onPrefsChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Courbes d'animation GSAP (miroir des --ease-* CSS). */
export const EASE = {
  out: 'expo.out',        // apparitions, arrivées
  inOut: 'power3.inOut',  // transitions de scène, caméra
  back: 'back.out(1.4)',  // distribution de cartes, rebonds
  soft: 'power2.out',     // survols, petits mouvements
  in: 'power3.in',        // sorties
};

/** Durées en secondes (miroir des --d-* CSS). */
export const DUR = { micro: 0.18, short: 0.35, base: 0.6, reveal: 0.9, scene: 1.4 };

/** Points de rupture (px). */
export const BP = { mobile: 767, tablet: 1023, desktop: 1024, wide: 1440 };
