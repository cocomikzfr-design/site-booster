/* ==========================================================================
   ChocoCards — scroll-fx.js
   Animations liées au scroll (GSAP + ScrollTrigger, chargés à la demande) :
   <booster-reveal>  : le booster se déchire et les cartes s'éventaillent
   <timeline-track>  : la ligne des prochaines sorties se dessine
   <parallax-media>  : image en parallaxe (bannières)
   <scroll-fade>     : le contenu du hero s'efface doucement
   Mouvement réduit : l'état final est affiché directement, sans animation.
   ========================================================================== */
import { motionOK, isDesignMode, $, $$, loadGsap } from '@theme/utils';

const mq = (q) => window.matchMedia(q).matches;

/* ScrollTrigger "pin" déplace les éléments dans le DOM (pin-spacer) : l'élément
   personnalisé est alors déconnecté puis reconnecté aussitôt. On ignore ces
   allers-retours et on ne nettoie que si l'élément a vraiment quitté la page
   (ex. rechargement de section dans l'éditeur de thème). */
class ScrollElement extends HTMLElement {
  connectedCallback() {
    if (this.started || this.waiting) return;
    // Initialisation quand la section approche de l'écran : GSAP n'est chargé
    // et calculé qu'au moment utile (chargement de page plus léger).
    if (!('IntersectionObserver' in window) || isDesignMode) { this.start(); return; }
    this.waiting = true;
    this.io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      this.io.disconnect();
      this.waiting = false;
      this.start();
    }, { rootMargin: '120% 0px 120% 0px' });
    this.io.observe(this);
  }
  start() {
    if (this.started) return;
    this.started = true;
    this.setup();
  }
  disconnectedCallback() {
    setTimeout(() => {
      if (this.isConnected) return;
      this.io?.disconnect();
      this.waiting = false;
      if (!this.started) return;
      this.started = false;
      this.teardown();
    }, 0);
  }
  setup() {}
  teardown() {
    this.mm?.revert();
    this.tween?.scrollTrigger?.kill();
    this.tween?.kill();
  }
}

/* Booster qui s'ouvre */
class BoosterReveal extends ScrollElement {
  async setup() {
    let gsap;
    try { gsap = await loadGsap(); } catch { this.classList.add('is-static'); return; }
    if (!this.isConnected) return;
    const { ScrollTrigger } = window;
    const section = this.closest('[data-booster-section]') || this;
    const booster = $('[data-booster]', this);
    const top = $('[data-booster-top]', this);
    const cardsWrap = $('[data-booster-cards]', this);
    const cards = $$('.mini-card', this);
    const burst = $('[data-booster-burst]', this);
    const hint = $('[data-booster-hint]', this);
    if (!booster || !cards.length) return;

    const build = () => {
      const h = this.offsetHeight;
      const mobile = mq('(max-width: 899px)');
      const spread = Math.min(window.innerWidth * (mobile ? 0.13 : 0.085), 120);
      const mid = (cards.length - 1) / 2;
      gsap.set(cardsWrap, { zIndex: 2 });
      return gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } })
        .to(hint, { autoAlpha: 0, duration: 0.2 }, 0)
        .to(booster, { keyframes: { rotation: [0, -4, 4, -3, 2, 0] }, y: -12, duration: 0.6, ease: 'none' }, 0)
        .to(top, { y: -h * 0.18, x: h * 0.1, rotation: 24, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0.6)
        .fromTo(burst, { scale: 0.2, autoAlpha: 0 }, { scale: 1.15, autoAlpha: 1, duration: 0.5 }, 0.7)
        .to(cards, { y: -h * 0.3, duration: 0.6, stagger: 0.06 }, 0.85)
        .set(cardsWrap, { zIndex: 4 }, 1.35)
        .to(booster, { y: h * 0.4, scale: 0.85, autoAlpha: 0, duration: 0.7, ease: 'power2.in' }, 1.3)
        .to(burst, { scale: 1.45, autoAlpha: 0.45, duration: 0.7 }, 1.35)
        .to(cards, {
          x: (i) => (i - mid) * spread,
          y: (i) => -h * 0.05 + Math.pow(Math.abs(i - mid), 2) * 9,
          rotation: (i) => (i - mid) * 10,
          duration: 0.9, ease: 'power3.out'
        }, 1.5)
        .to(cards[Math.round(mid)], { rotationY: 360, scale: 1.14, duration: 0.8, ease: 'power2.inOut' }, 2.05);
    };

    if (!motionOK || isDesignMode || this.dataset.animate === 'false') {
      // État final (cartes en éventail) — aussi dans l'éditeur pour voir le résultat
      if (this.dataset.animate === 'false') return;
      build().progress(1);
      return;
    }
    this.mm = gsap.matchMedia();
    this.mm.add('(min-width: 900px)', () => {
      const tl = build();
      ScrollTrigger.create({
        trigger: section, start: 'top top', end: '+=140%',
        pin: section.querySelector('[data-booster-pin]') || section,
        scrub: 0.8, animation: tl, anticipatePin: 1, invalidateOnRefresh: true
      });
    });
    this.mm.add('(max-width: 899px)', () => {
      const tl = build();
      ScrollTrigger.create({ trigger: this, start: 'top 70%', once: true, onEnter: () => tl.play() });
    });
  }

}
customElements.define('booster-reveal', BoosterReveal);

/* Ligne de la timeline */
class TimelineTrack extends ScrollElement {
  async setup() {
    const progress = $('[data-timeline-progress]', this);
    if (!progress) return;
    if (!motionOK || isDesignMode) { progress.style.transform = 'none'; return; }
    let gsap;
    try { gsap = await loadGsap(); } catch { progress.style.transform = 'none'; return; }
    if (!this.isConnected) return;
    this.mm = gsap.matchMedia();
    const make = (prop) => () => {
      gsap.fromTo(progress, { [prop]: 0 }, {
        [prop]: 1, ease: 'none',
        scrollTrigger: { trigger: this, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 }
      });
    };
    this.mm.add('(min-width: 900px)', make('scaleX'));
    this.mm.add('(max-width: 899px)', make('scaleY'));
  }
}
customElements.define('timeline-track', TimelineTrack);

/* Parallaxe d'image */
class ParallaxMedia extends ScrollElement {
  async setup() {
    if (!motionOK || isDesignMode) return;
    const img = $('img, .placeholder-svg', this);
    if (!img) return;
    let gsap;
    try { gsap = await loadGsap(); } catch { return; }
    if (!this.isConnected) return;
    this.tween = gsap.fromTo(img, { yPercent: -5 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: this, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }
}
customElements.define('parallax-media', ParallaxMedia);

/* Fondu au scroll (contenu du hero) : simple écouteur de scroll, sans GSAP */
class ScrollFade extends HTMLElement {
  connectedCallback() {
    if (!motionOK || isDesignMode || this.onScroll) return;
    const section = this.closest('section') || this;
    let ticking = false;
    const update = () => {
      ticking = false;
      const h = section.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      this.style.transform = p ? `translate3d(0, ${(-12 * p).toFixed(2)}%, 0)` : '';
      this.style.opacity = p ? String(1 - 0.85 * p) : '';
    };
    this.onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }
  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
    this.onScroll = null;
  }
}
customElements.define('scroll-fade', ScrollFade);
