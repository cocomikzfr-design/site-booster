/* ==========================================================================
   Bibliothèques externes (CDN, versions exactes)
   --------------------------------------------------------------------------
   GSAP 3.13.0 (+ ScrollTrigger, SplitText) et Lenis 1.1.13 sont chargés par
   loadLibs() APRÈS le premier affichage (main.js), pour ne pas retarder le
   rendu du hero. Three.js 0.160.0 est chargé à la demande (voir webgl.js).

   Les exports sont des liaisons « vivantes » : importez-les normalement
   (import { gsap } from '../core/libs.js') et utilisez-les dans init() ou
   plus tard — ils sont remplis avant l'appel des init() de sections.

   RÈGLE : chaque export peut valoir null si un CDN a échoué. Le site doit
   rester lisible et utilisable sans eux (tester avec ?nolibs).
   ========================================================================== */

export const LIB_URLS = [
  'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js',
  'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js',
];

/** Adresse exacte de Three.js (doit rester identique à l'import map de index.html). */
export const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

export let gsap = null;
export let ScrollTrigger = null;
export let SplitText = null;
export let Lenis = null;

const off = new URLSearchParams(location.search).has('nolibs');
let promise = null;

/** Insère un script classique ; l'ordre d'exécution est garanti (async = false). Ne rejette jamais. */
function addScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

/** Charge GSAP, ScrollTrigger, SplitText et Lenis (une seule fois). Résout toujours, avec getLibs(). */
export function loadLibs() {
  if (!promise) {
    promise = (async () => {
      if (!off) {
        await Promise.race([
          Promise.all(LIB_URLS.map(addScript)),
          new Promise((r) => setTimeout(r, 8000)),
        ]);
      }
      const w = window;
      gsap = off ? null : w.gsap || null;
      ScrollTrigger = gsap && w.ScrollTrigger ? w.ScrollTrigger : null;
      SplitText = gsap && w.SplitText ? w.SplitText : null;
      Lenis = off ? null : w.Lenis || null;
      if (gsap) {
        gsap.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));
        // Pas d'avertissements console quand une cible est absente (sections optionnelles)
        gsap.config({ nullTargetWarn: false });
        gsap.defaults({ ease: 'expo.out', duration: 0.9 });
      }
      if (ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });
      return getLibs();
    })();
  }
  return promise;
}

/** Instantané { gsap, ScrollTrigger, SplitText, Lenis } (null pour ce qui manque). */
export const getLibs = () => ({ gsap, ScrollTrigger, SplitText, Lenis });
