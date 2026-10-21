/* ==========================================================================
   Bibliothèques externes (CDN)
   --------------------------------------------------------------------------
   GSAP 3.13.0 (+ ScrollTrigger, SplitText) et Lenis 1.1.13 sont chargés par
   des <script defer> dans index.html : ils sont donc prêts quand les modules
   s'exécutent. Three.js 0.160.0 est chargé à la demande (voir webgl.js).

   RÈGLE : chaque export peut valoir null si un CDN a échoué. Le site doit
   rester lisible et utilisable sans eux (tester avec ?nolibs).
   ========================================================================== */

const w = window;
const off = new URLSearchParams(location.search).has('nolibs');

export const gsap = off ? null : w.gsap || null;
export const ScrollTrigger = gsap && w.ScrollTrigger ? w.ScrollTrigger : null;
export const SplitText = gsap && w.SplitText ? w.SplitText : null;
export const Lenis = off ? null : w.Lenis || null;

if (gsap) {
  gsap.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));
  // Pas d'avertissements console quand une cible est absente (sections optionnelles)
  gsap.config({ nullTargetWarn: false });
  gsap.defaults({ ease: 'expo.out', duration: 0.9 });
}
if (ScrollTrigger) {
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Adresse exacte de Three.js (doit rester identique à l'import map de index.html). */
export const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

export const libs = { gsap, ScrollTrigger, SplitText, Lenis };
