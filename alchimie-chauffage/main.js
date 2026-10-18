/* ==========================================================================
   L'Alchimie du Chauffage — démo
   ========================================================================== */

/* --------------------------------------------------------------------------
   CONFIG : toutes les infos à compléter sont ici. Elles sont injectées
   dans la page au chargement (attributs data-cfg / data-cfg-href).
   -------------------------------------------------------------------------- */
const CONFIG = {
  name: "L'Alchimie du Chauffage SPRL",
  phone: '0479 53 55 03',
  phoneHref: 'tel:+32479535503',

  address: '[ADRESSE À COMPLÉTER]', // ex. "Rue de Namur 12, 1400 Nivelles"
  hours: '[HORAIRES À COMPLÉTER]', // ex. "Lun–ven 8h–18h · Sam sur rendez-vous"
  bce: '[À COMPLÉTER]', // ex. "BE 0123.456.789"

  // Coordonnées GPS de l'adresse (pour Street View). À COMPLÉTER.
  // Valeurs provisoires : centre de Nivelles (Grand-Place).
  LAT: 50.5983,
  LNG: 4.3285,

  // Bonus : clé API Google (Maps Embed API). Si renseignée, Street View est
  // intégré directement dans la page. Sinon, on garde seulement le bouton.
  GOOGLE_MAPS_KEY: '',

  // Lien vers la fiche Google (avis). À remplacer par le lien exact de la fiche.
  googleReviewsUrl: 'https://www.google.com/search?q=L%27Alchimie+du+Chauffage+Nivelles+avis',

  legalUrl: '#', // [MENTIONS LÉGALES À COMPLÉTER]
  privacyUrl: '#', // [POLITIQUE VIE PRIVÉE À COMPLÉTER]
};

const isPlaceholder = (v) => !v || /COMPLÉTER/i.test(String(v));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = window.matchMedia('(max-width: 860px)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const lowPower =
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* --------------------------------------------------------------------------
   Injection de la config
   -------------------------------------------------------------------------- */
function injectConfig() {
  document.querySelectorAll('[data-cfg]').forEach((el) => {
    const v = CONFIG[el.dataset.cfg];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-cfg-href]').forEach((el) => {
    const v = CONFIG[el.dataset.cfgHref];
    if (v) el.setAttribute('href', v);
  });

  // Carte (sans clé API). Tant que l'adresse n'est pas renseignée : Nivelles.
  const mapQuery = isPlaceholder(CONFIG.address) ? 'Nivelles, Belgique' : CONFIG.address;
  const mapIframe = document.getElementById('map-iframe');
  if (mapIframe) mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=12&output=embed`;

  // Street View : URL officielle sans clé
  const sv = document.getElementById('streetview-btn');
  if (sv) sv.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${CONFIG.LAT},${CONFIG.LNG}`;

  // Bonus : Street View intégré si clé API fournie
  if (CONFIG.GOOGLE_MAPS_KEY) {
    const frame = document.getElementById('sv-frame');
    const ifr = document.getElementById('sv-iframe');
    ifr.src = `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(CONFIG.GOOGLE_MAPS_KEY)}&location=${CONFIG.LAT},${CONFIG.LNG}&heading=0&pitch=0&fov=80`;
    frame.hidden = false;
  }

  // Données structurées : compléter avec l'adresse, les coordonnées et les horaires
  const ld = document.getElementById('ld-business');
  if (ld) {
    try {
      const data = JSON.parse(ld.textContent);
      if (!isPlaceholder(CONFIG.address)) data.address.streetAddress = CONFIG.address;
      data.geo = { '@type': 'GeoCoordinates', latitude: CONFIG.LAT, longitude: CONFIG.LNG };
      if (!isPlaceholder(CONFIG.hours)) data.openingHours = CONFIG.hours;
      if (!isPlaceholder(CONFIG.bce)) data.vatID = CONFIG.bce;
      ld.textContent = JSON.stringify(data);
    } catch (e) { /* JSON-LD statique conservé */ }
  }

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

/* --------------------------------------------------------------------------
   Une seule boucle de scroll pour tout ce qui en dépend (barre, thermostat…)
   -------------------------------------------------------------------------- */
const scrollHandlers = [];
function onScrollFrame(fn) { scrollHandlers.push(fn); }
function initScrollLoop() {
  let ticking = false;
  const run = () => {
    ticking = false;
    const y = window.scrollY;
    for (const fn of scrollHandlers) fn(y);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(run); }
  }, { passive: true });
  window.addEventListener('resize', run);
  run();
}

/* --------------------------------------------------------------------------
   Barre du haut : fond au scroll, masquée en descendant, progression
   -------------------------------------------------------------------------- */
function initTopbar() {
  const bar = document.getElementById('topbar');
  const progress = document.getElementById('progress-bar');
  let last = 0;
  onScrollFrame((y) => {
    bar.classList.toggle('is-solid', y > 40);
    bar.classList.toggle('is-hidden', y > last + 2 && y > window.innerHeight * 0.9);
    if (y < last - 2) bar.classList.remove('is-hidden');
    last = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  });
}

/* --------------------------------------------------------------------------
   Défilement doux (Lenis) + liens d'ancre
   -------------------------------------------------------------------------- */
let lenis = null;
function initSmoothScroll() {
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (!reducedMotion && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = id === '#accueil' ? 0 : -60;
      if (lenis) lenis.scrollTo(target, { offset, duration: 1.6 });
      else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });
}

/* --------------------------------------------------------------------------
   Compteurs animés (format belge : 4,4)
   -------------------------------------------------------------------------- */
const fmt = (n, d) => n.toLocaleString('fr-BE', { minimumFractionDigits: d, maximumFractionDigits: d });

function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (reducedMotion || !('IntersectionObserver' in window)) return; // valeurs finales déjà dans le HTML
  counters.forEach((el) => { el.textContent = fmt(0, +el.dataset.decimals); });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const to = parseFloat(el.dataset.to);
      const d = +el.dataset.decimals;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1800);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)), d);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => io.observe(c));
}

/* --------------------------------------------------------------------------
   Titres découpés en mots (pour l'apparition mot à mot)
   -------------------------------------------------------------------------- */
function splitWords(el) {
  let wi = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const isGrad = node.classList && node.classList.contains('grad');
        const frag = document.createDocumentFragment();
        child.textContent.split(/([ \t\n]+)/).forEach((part) => {
          if (!part) return;
          if (/^[ \t\n]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.style.setProperty('--wi', wi++);
          const inner = document.createElement('span');
          if (isGrad) inner.className = 'grad';
          inner.textContent = part;
          w.appendChild(inner);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
        if (isGrad) node.classList.replace('grad', 'grad-wrap');
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
}

/* --------------------------------------------------------------------------
   Apparitions au scroll : IntersectionObserver + transitions CSS (léger)
   -------------------------------------------------------------------------- */
function initReveals() {
  if (reducedMotion) return;
  document.querySelectorAll('.split').forEach(splitWords);

  // Icônes des services : préparation du tracé au trait
  document.querySelectorAll('.draw').forEach((svg) => {
    [...svg.querySelectorAll('path, rect, circle')]
      .filter((el) => !el.classList.contains('flame-mini'))
      .forEach((el, k) => {
        const len = el.getTotalLength ? Math.ceil(el.getTotalLength()) + 1 : 400;
        el.classList.add('ln');
        el.style.setProperty('--len', len);
        el.style.setProperty('--k', k);
      });
  });

  const targets = document.querySelectorAll('.reveal, .split, .svc, [data-inview]');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  targets.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------------------
   Effets liés au scroll (GSAP + ScrollTrigger)
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  const { gsap, ScrollTrigger } = window;
  if (reducedMotion || !gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Le contenu du hero s'éloigne en scrollant
  gsap.to('.hero__content', {
    yPercent: -14, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% top', scrub: true },
  });

  // Sortie du hero : les deux lignes du titre s'écartent
  [['.hero__title .line:nth-child(1)', -16], ['.hero__title .line:nth-child(2)', 16]].forEach(([sel, x]) => {
    gsap.to(sel, {
      xPercent: x, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true },
    });
  });

  // Services : la carte du dessous recule quand la suivante arrive
  const cards = isSmall ? [] : gsap.utils.toArray('.svc');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card.querySelector('.svc__inner'), {
      scale: 0.93, '--shade': 0.55, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true },
    });
  });

  // Bande de confiance : inclinaison selon la vitesse de scroll
  const skew = gsap.quickTo(gsap.utils.toArray('.trust__track'), 'skewX', { duration: 0.5, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '.trust', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => skew(clamp(self.getVelocity() / -250, -8, 8)),
    onLeave: () => skew(0), onLeaveBack: () => skew(0),
  });

  // Appel final : la flamme grandit en approchant
  gsap.fromTo('.cta__flame', { scale: 0.5, y: 40 }, {
    scale: 1, y: 0, ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'top 30%', scrub: true },
  });
}

/* --------------------------------------------------------------------------
   Pourquoi nous : thermostat piloté par le scroll (4 °C → 21 °C)
   -------------------------------------------------------------------------- */
function initThermostat() {
  const section = document.querySelector('.thermo');
  if (!section) return;
  const dial = section.querySelector('.dial');
  const temp = document.getElementById('dial-temp');
  const label = document.getElementById('dial-label');
  const steps = [...section.querySelectorAll('.step')];
  const cold = section.querySelector('.thermo__cold');
  const warm = section.querySelector('.thermo__warm');
  const labels = ['Panne', 'Diagnostic', 'Réparation', 'Confort'];

  const coldC = [140, 200, 255];
  const midC = [255, 236, 214];
  const hotC = [255, 150, 60];
  const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const colorAt = (p) => (p < 0.5 ? mix(coldC, midC, p * 2) : mix(midC, hotC, (p - 0.5) * 2));

  const set = (p) => {
    dial.style.setProperty('--p', p.toFixed(4));
    const [r, g, b] = colorAt(p);
    dial.style.setProperty('--tc', `rgb(${r},${g},${b})`);
    dial.style.setProperty('--tglow', `rgba(${r},${g},${b},0.5)`);
    dial.style.setProperty('--knob', `rgb(${r},${g},${b})`);
    temp.textContent = Math.round(4 + p * 17);
    const idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    label.textContent = labels[idx];
    cold.style.opacity = (1 - p).toFixed(3);
    warm.style.opacity = p.toFixed(3);
  };

  if (reducedMotion) {
    set(1);
    steps.forEach((s) => s.classList.add('is-active'));
    return;
  }

  let current = 0;
  let target = 0;
  let raf = 0;
  const animate = () => {
    current += (target - current) * 0.18;
    if (Math.abs(target - current) < 0.0005) current = target;
    set(current);
    raf = current !== target ? requestAnimationFrame(animate) : 0;
  };
  onScrollFrame(() => {
    const r = section.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    // petite marge en début et en fin pour laisser respirer
    target = clamp((-r.top / span - 0.06) / 0.86);
    if (!raf) raf = requestAnimationFrame(animate);
  });
  set(0);
}

/* --------------------------------------------------------------------------
   Carrousel d'avis (barres de progression)
   -------------------------------------------------------------------------- */
function initCarousel() {
  const root = document.getElementById('carousel');
  if (!root) return;
  const slides = [...root.querySelectorAll('.review')];
  const bars = [...root.querySelectorAll('.carousel__bars button')];
  const DUR = 6500;
  root.style.setProperty('--dur', `${DUR}ms`);
  let index = 0;
  let timer = null;

  const go = (i) => {
    const prev = index;
    index = (i + slides.length) % slides.length;
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === index);
      s.classList.toggle('is-leaving', k === prev && k !== index);
      s.setAttribute('aria-hidden', k === index ? 'false' : 'true');
    });
    bars.forEach((b, k) => {
      b.classList.remove('is-active');
      b.classList.toggle('is-done', k < index);
    });
    void root.offsetWidth; // relance l'animation de la barre
    bars[index].classList.add('is-active');
  };
  const play = () => {
    if (reducedMotion) return;
    clearTimeout(timer);
    timer = setTimeout(() => { go(index + 1); play(); }, DUR);
  };

  root.querySelectorAll('.carousel__btn').forEach((b) =>
    b.addEventListener('click', () => { go(index + Number(b.dataset.dir)); play(); }));
  bars.forEach((b, k) => b.addEventListener('click', () => { go(k); play(); }));

  let x0 = null;
  root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); play(); }
    x0 = null;
  });

  // Démarre quand le carrousel devient visible
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { go(index); play(); io.disconnect(); }
  }, { threshold: 0.4 });
  io.observe(root);
  if (reducedMotion) bars[0].classList.add('is-done');
}

/* --------------------------------------------------------------------------
   Radar de la zone d'intervention + mot géant du footer
   -------------------------------------------------------------------------- */
function initInView() {
  const radar = document.querySelector('.radar');
  const word = document.querySelector('.footer__word');
  if (reducedMotion) {
    radar && radar.classList.add('is-in');
    word && word.classList.add('is-lit');
    const svg = document.getElementById('radar-svg');
    if (svg && svg.pauseAnimations) svg.pauseAnimations();
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add(e.target === word ? 'is-lit' : 'is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  radar && io.observe(radar);
  word && io.observe(word);
}

/* Balayage et pulsations du radar (SMIL, ajoutés en JS pour garder le HTML lisible) */
function initRadarMotion() {
  if (reducedMotion) return;
  const ns = 'http://www.w3.org/2000/svg';
  const sweep = document.querySelector('.radar .sweep');
  if (sweep) {
    const a = document.createElementNS(ns, 'animateTransform');
    a.setAttribute('attributeName', 'transform');
    a.setAttribute('type', 'rotate');
    a.setAttribute('from', '0');
    a.setAttribute('to', '360');
    a.setAttribute('dur', '6s');
    a.setAttribute('repeatCount', 'indefinite');
    sweep.appendChild(a);
  }
  document.querySelectorAll('.radar .home__pulse').forEach((c, i) => {
    [['r', '8', '60'], ['opacity', '0.9', '0']].forEach(([attr, from, to]) => {
      const a = document.createElementNS(ns, 'animate');
      a.setAttribute('attributeName', attr);
      a.setAttribute('from', from);
      a.setAttribute('to', to);
      a.setAttribute('dur', '2.8s');
      a.setAttribute('begin', `${i * 1.4}s`);
      a.setAttribute('repeatCount', 'indefinite');
      c.appendChild(a);
    });
  });
}

/* --------------------------------------------------------------------------
   Bouton d'appel flottant : caché quand un gros bouton d'appel est déjà visible
   -------------------------------------------------------------------------- */
function initFab() {
  const fab = document.querySelector('.fab-call');
  const zones = document.querySelectorAll('.hero__actions, .cta__actions');
  if (!fab || !zones.length || !('IntersectionObserver' in window)) return;
  const shown = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? shown.add(e.target) : shown.delete(e.target)));
    fab.classList.toggle('is-hidden', shown.size > 0);
  });
  zones.forEach((z) => io.observe(z));
}

/* --------------------------------------------------------------------------
   Toucher la flamme : elle s'emballe (version CSS ; la 3D a son propre effet)
   -------------------------------------------------------------------------- */
function initFlameTouch() {
  const hero = document.querySelector('.hero');
  const hint = document.querySelector('.hero__hint');
  let t = 0;
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    if (hint) hint.classList.add('is-done');
    hero.classList.add('is-boost');
    clearTimeout(t);
    t = setTimeout(() => hero.classList.remove('is-boost'), 380);
  });
}

/* --------------------------------------------------------------------------
   Curseur « braise » et boutons magnétiques (ordinateur uniquement)
   -------------------------------------------------------------------------- */
function initCursor() {
  if (!finePointer || reducedMotion) return;
  document.documentElement.classList.add('has-cursor');
  const cursor = document.querySelector('.cursor');
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  let x = -100, y = -100, rx = -100, ry = -100;
  window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const tick = () => {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(tick);
  };
  tick();
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button'));
  });

  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* --------------------------------------------------------------------------
   HERO 3D : flamme (shader) + braises qui montent (three.js)
   Chargé à la demande, après le premier affichage, pour rester rapide.
   -------------------------------------------------------------------------- */
/* Vrai GPU ? Sur un rendu logiciel (SwiftShader, llvmpipe…), la 3D ramerait :
   on garde alors la flamme CSS. Forcer la 3D : ajouter ?3d=1 à l'adresse. */
function hasRealGPU() {
  if (/[?&]3d=1/.test(location.search)) return true;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render|offscreen/i.test(name);
  } catch (e) {
    return false;
  }
}

let gpuCache = null;
const useGPU = () => (gpuCache ??= !reducedMotion && hasRealGPU());
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

async function initHero3D() {
  if (!useGPU()) return;
  const canvas = document.getElementById('hero-canvas');
  const hero = document.querySelector('.hero');
  const light = document.getElementById('hero-light');
  if (!canvas) return;

  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (e) {
    return; // le dégradé CSS reste affiché
  }

  const lite = isSmall || lowPower;
  const EMBERS = lite ? 700 : 2200;
  const BOKEH = lite ? 18 : 40;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // pas de WebGL : dégradé CSS
  }
  const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const group = new THREE.Group();
  scene.add(group);

  // Addition pure : la lumière s'ajoute sans rendre le fond opaque
  const additive = {
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
  };
  const quadVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';

  /* --- La flamme : bruit fbm déformé (domain warping), plusieurs couches --- */
  const flameUniforms = {
    uTime: { value: 0 },
    uHeat: { value: 1 },
    uBoost: { value: 0 },
    uLean: { value: new THREE.Vector2() },
  };
  const flame = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 6),
    new THREE.ShaderMaterial({
      ...additive,
      uniforms: flameUniforms,
      vertexShader: quadVS,
      fragmentShader: /* glsl */ `
        #define OCT ${lite ? 4 : 5}
        uniform float uTime; uniform float uHeat; uniform float uBoost; uniform vec2 uLean;
        varying vec2 vUv;
        float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < OCT; i++){ v += a * noise(p); p = p * 2.03 + 1.7; a *= 0.5; } return v; }
        vec3 ramp(float t){
          vec3 c = mix(vec3(0.0), vec3(0.55, 0.06, 0.0), smoothstep(0.0, 0.18, t));
          c = mix(c, vec3(1.0, 0.36, 0.06), smoothstep(0.15, 0.42, t));
          c = mix(c, vec3(1.0, 0.62, 0.2), smoothstep(0.4, 0.66, t));
          c = mix(c, vec3(1.0, 0.86, 0.55), smoothstep(0.62, 0.86, t));
          return mix(c, vec3(1.0, 0.98, 0.92), smoothstep(0.86, 1.0, t));
        }
        void main(){
          vec2 p = vUv - vec2(0.5, 0.0);
          float y = p.y;
          // hors de la zone de la flamme : rien à calculer
          float reach = min(0.49, 0.4 + y * 0.1 + abs(uLean.x) * y * y * 0.45);
          if (abs(p.x) > reach || y > 1.0) { gl_FragColor = vec4(0.0); return; }
          float edgeFade = 1.0 - smoothstep(reach - 0.12, reach, abs(p.x));
          float t = uTime * (1.0 + uBoost * 0.8);
          // la flamme penche avec la souris, surtout en haut
          p.x -= uLean.x * y * y * 0.45;
          // turbulence : bruit déformé par du bruit
          vec2 q = vec2(fbm(vec2(p.x * 2.4, y * 1.6 - t * 1.1)), fbm(vec2(p.x * 2.4 + 5.2, y * 1.6 - t * 1.1 + 1.3)));
          float n = fbm(vec2(p.x * 3.2, y * 2.6 - t * 1.8) + q * 1.4);
          float n2 = fbm(vec2(p.x * 7.0 + 3.1, y * 5.5 - t * 3.0) + q);
          p.x += (n - 0.5) * 0.3 * y + (n2 - 0.5) * 0.08 * y;
          float H = 0.74 + 0.04 * sin(t * 3.1) + 0.03 * sin(t * 7.7 + 1.0) + uBoost * 0.16;
          float yy = y / H;
          // profil en goutte : base ronde et large, pointe fine qui vacille
          float w = 0.25 * pow(smoothstep(0.0, 0.24, yy), 0.45) * pow(max(1.0 - yy, 0.0), 1.15);
          w *= 0.8 + 0.5 * n + uBoost * 0.15;
          float d = abs(p.x) / max(w, 0.001);
          float base = smoothstep(0.035, 0.11, y);
          float shape = 1.0 - smoothstep(0.45, 1.0, d + (n - 0.5) * 0.7 * yy);
          float tip = 1.0 - smoothstep(0.45, 1.0, yy + (n2 - 0.5) * 0.45);
          float body = shape * tip * base;
          // langues de feu qui se détachent en haut
          float tongues = smoothstep(0.62, 0.95, n2 + n * 0.35) * smoothstep(0.35, 0.7, yy) * (1.0 - smoothstep(0.95, 1.25, yy)) * (1.0 - smoothstep(0.5, 1.4, d));
          // cœur jaune-blanc, court et bas (comme un vrai feu)
          float core = (1.0 - smoothstep(0.0, 0.55, d)) * (1.0 - smoothstep(0.05, 0.34, yy)) * base;
          // plus on monte, plus la flamme refroidit : jaune → orange → rouge
          float cool = mix(1.0, 0.38, smoothstep(0.12, 0.9, yy));
          float heat = clamp((body * (0.5 + 0.5 * n) + tongues * 0.45) * cool + core * 0.42, 0.0, 0.93);
          // bords plus sombres et irréguliers
          float rim = smoothstep(1.0, 0.55, d);
          vec3 col = ramp(heat) * (body * (0.55 + 0.45 * rim) + tongues * 0.8);
          // pied bleu (brûleur) : contraste chaud / froid
          float blue = (1.0 - smoothstep(0.05, 0.19, y)) * (1.0 - smoothstep(0.3, 1.0, d)) * smoothstep(0.02, 0.07, y);
          col += vec3(0.16, 0.48, 1.0) * blue * 1.25;
          // halo doux
          float glow = exp(-abs(p.x) * 6.5) * exp(-abs(y - 0.3) * 3.2);
          col += vec3(1.0, 0.38, 0.1) * glow * edgeFade * (0.22 + uBoost * 0.25);
          col *= uHeat;
          gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
        }`,
    })
  );
  flame.position.y = 0.35;
  group.add(flame);

  /* --- Braises (particules étirées) qui montent --- */
  const makeAttr = (n, fn) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = fn(i); return a; };
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(EMBERS * 3), 3));
  emberGeo.setAttribute('aSeed', new THREE.BufferAttribute(makeAttr(EMBERS, Math.random), 1));
  emberGeo.setAttribute('aSpeed', new THREE.BufferAttribute(makeAttr(EMBERS, () => 0.6 + Math.random() * 0.9), 1));
  emberGeo.setAttribute('aSize', new THREE.BufferAttribute(makeAttr(EMBERS, () => 0.5 + Math.pow(Math.random(), 3) * 2.8), 1));
  emberGeo.setAttribute('aCold', new THREE.BufferAttribute(makeAttr(EMBERS, () => (Math.random() < 0.05 ? 1 : 0)), 1));

  const emberUniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uPR: { value: dpr },
    uScroll: { value: 0 },
    uBoost: flameUniforms.uBoost,
  };
  const embers = new THREE.Points(emberGeo, new THREE.ShaderMaterial({
    ...additive,
    uniforms: emberUniforms,
    vertexShader: /* glsl */ `
      attribute float aSeed; attribute float aSpeed; attribute float aSize; attribute float aCold;
      uniform float uTime; uniform vec2 uMouse; uniform float uPR; uniform float uScroll; uniform float uBoost;
      varying float vLife; varying float vCold;
      void main(){
        float t = uTime * aSpeed * (1.0 + uScroll * 1.5);
        float life = fract(t * 0.075 + aSeed * 7.0);
        float H = 9.0;
        float y = -1.6 + life * H;
        float ang = aSeed * 6.2831 * 37.0 + t * 0.25;
        float r0 = 0.15 + 1.1 * fract(aSeed * 13.17);
        float r = r0 * (1.0 - smoothstep(0.0, 0.3, life) * 0.6) + life * life * (2.4 + uBoost * 2.0) * fract(aSeed * 3.7);
        vec3 p = vec3(cos(ang) * r, y, sin(ang) * r * 0.7);
        p.x += sin(t * 0.8 + aSeed * 40.0) * 0.35 * life;
        p.xy += uMouse * vec2(1.6, 0.6) * life;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * (1.0 - life * 0.5) * (1.0 + uBoost * 0.6) * (24.0 / -mv.z);
        vLife = life; vCold = aCold;
      }`,
    fragmentShader: /* glsl */ `
      varying float vLife; varying float vCold;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        c.x *= 2.4; // étirée verticalement : effet de traînée
        float a = smoothstep(0.5, 0.0, length(c));
        a *= smoothstep(0.0, 0.08, vLife) * (1.0 - smoothstep(0.55, 1.0, vLife));
        vec3 hot = mix(vec3(1.0, 0.88, 0.6), vec3(1.0, 0.42, 0.1), smoothstep(0.0, 0.4, vLife));
        hot = mix(hot, vec3(0.75, 0.12, 0.02), smoothstep(0.45, 1.0, vLife));
        vec3 col = mix(hot, vec3(0.23, 0.63, 1.0), vCold) * a * (vCold > 0.5 ? 0.75 : 1.0);
        gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
      }`,
  }));
  group.add(embers);

  /* --- Braises floues au premier plan (profondeur de champ) --- */
  const bokehGeo = new THREE.BufferGeometry();
  const bpos = new Float32Array(BOKEH * 3);
  for (let i = 0; i < BOKEH; i++) {
    bpos[i * 3] = (Math.random() - 0.5) * 9;
    bpos[i * 3 + 1] = (Math.random() - 0.5) * 7;
    bpos[i * 3 + 2] = 2.5 + Math.random() * 3;
  }
  bokehGeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
  bokehGeo.setAttribute('aSeed', new THREE.BufferAttribute(makeAttr(BOKEH, Math.random), 1));
  const bokeh = new THREE.Points(bokehGeo, new THREE.ShaderMaterial({
    ...additive,
    uniforms: { uTime: emberUniforms.uTime, uPR: emberUniforms.uPR },
    vertexShader: /* glsl */ `
      attribute float aSeed; uniform float uTime; uniform float uPR; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.12 + aSeed * 0.2) + 3.5, 7.0) - 3.5;
        p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (40.0 + aSeed * 60.0) * uPR / -mv.z;
        vA = (0.5 + 0.5 * sin(uTime * (0.8 + aSeed) + aSeed * 10.0)) * smoothstep(3.5, 2.0, abs(p.y));
      }`,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.32, d) * 0.12 + smoothstep(0.5, 0.0, d) * 0.06;
        vec3 col = vec3(1.0, 0.55, 0.2) * a * vA;
        gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
      }`,
  }));
  scene.add(bokeh);

  /* --- Mise en page selon le format d'écran --- */
  const layout = { x: 0, y: 0, scale: 1 };
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (camera.aspect > 1.1) {
      // paysage : flamme à droite, texte à gauche
      const halfW = camera.position.z * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
      layout.x = halfW * 0.64;
      layout.y = -0.1;
      layout.scale = camera.aspect < 1.45 ? 0.95 : 1.12;
    } else {
      // portrait (mobile) : flamme en haut, texte en bas
      layout.x = 0;
      layout.y = 1.96;
      layout.scale = 0.56;
    }
  };
  resize();
  window.addEventListener('resize', resize);

  /* --- Interactions : souris / doigt, clic (la flamme s'emballe), scroll --- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    if (tilted) return;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
  let tilted = false;
  const onTilt = (e) => {
    if (e.gamma == null) return;
    tilted = true;
    mouse.tx = clamp(e.gamma / 28, -1, 1);
    mouse.ty = clamp((45 - e.beta) / 35, -1, 1);
  };
  const askTilt = () => {
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then((r) => { if (r === 'granted') window.addEventListener('deviceorientation', onTilt); }).catch(() => {});
    }
  };
  if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', onTilt);
  }
  let boost = 0;
  let asked = false;
  const hint = document.querySelector('.hero__hint');
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    if (!asked) { asked = true; askTilt(); }
    boost = 1;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    if (hint) hint.classList.add('is-done');
  });

  /* --- Boucle (en pause hors écran / onglet caché) --- */
  let ready = false;
  let visible = true;
  let running = !document.hidden;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; loop(); });

  const clock = new THREE.Clock();
  let rafId = 0;
  let elapsed = 0;
  function frame() {
    rafId = 0;
    if (!visible || !running) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    boost *= Math.exp(-dt * 1.6);

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const scroll = clamp(window.scrollY / window.innerHeight);

    flameUniforms.uTime.value = elapsed;
    flameUniforms.uBoost.value = boost;
    flameUniforms.uHeat.value = 1 - scroll * 0.4;
    flameUniforms.uLean.value.set(mouse.x, mouse.y);
    emberUniforms.uTime.value = elapsed;
    emberUniforms.uMouse.value.set(mouse.x, mouse.y);
    emberUniforms.uScroll.value = scroll;

    const s = layout.scale * (1 + scroll * 0.2 + boost * 0.08);
    group.scale.setScalar(s);
    group.position.set(layout.x + mouse.x * 0.2, layout.y + scroll * 1.4 + mouse.y * 0.12, 0);
    embers.rotation.y = mouse.x * 0.25;
    camera.position.x = mouse.x * 0.25;
    camera.lookAt(0, 0, 0);

    // la flamme éclaire la page : le halo CSS vacille avec elle
    const flick = 0.82 + 0.1 * Math.sin(elapsed * 7.3) + 0.06 * Math.sin(elapsed * 13.1 + 1.3) + 0.04 * Math.sin(elapsed * 2.1);
    light.style.opacity = clamp((flick + boost * 0.5) * (1 - scroll * 0.6), 0, 1.2).toFixed(3);

    renderer.render(scene, camera);
    loop();
  }
  function loop() {
    if (ready && !rafId && visible && running) rafId = requestAnimationFrame(frame);
  }

  // compilation des shaders sans bloquer la page quand c'est possible
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);
  ready = true;
  loop();
  requestAnimationFrame(() => {
    canvas.classList.add('is-ready');
    hero.classList.add('is-3d');
  });
}

/* --------------------------------------------------------------------------
   Manifeste : les mots s'allument au fil du scroll
   -------------------------------------------------------------------------- */
function initManifesto() {
  const el = document.getElementById('manifesto');
  if (!el || reducedMotion) return;
  // découpe en mots (en gardant les <em>)
  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/([ \t\n]+)/).forEach((part) => {
          if (!part) return;
          if (/^[ \t\n]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'mw';
          w.textContent = part;
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrap(child);
      }
    });
  };
  wrap(el);
  const words = [...el.querySelectorAll('.mw')];
  let lit = -1;
  onScrollFrame(() => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3));
    const n = Math.round(p * words.length);
    if (n === lit) return;
    lit = n;
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  });
}

/* --------------------------------------------------------------------------
   SERVICES : morphing de particules 3D
   Des braises dessinent chaque service (chaudière → calendrier → clé → maison),
   explosent en tourbillon entre deux formes, et fuient le doigt / la souris.
   -------------------------------------------------------------------------- */
const MORPH_SHAPES = [
  // chaudière
  { stroke: ['M38 10h44a8 8 0 0 1 8 8v68a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z', 'M42 26h36M42 36h20', 'M74 62a14 14 0 1 1-28 0a14 14 0 1 1 28 0z', 'M44 94v14M76 94v14M36 108h48'],
    fill: ['M60 52c3 4 7 6 7 11a7 7 0 0 1-14 0c0-3 2-5 4-7 0 2 1 3 2 4-1-3 0-6 1-8z'] },
  // calendrier d'entretien
  { stroke: ['M26 22h68a10 10 0 0 1 10 10v60a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10V32a10 10 0 0 1 10-10z', 'M16 44h88M40 12v20M80 12v20'],
    hot: ['M42 72l12 12 26-28'] },
  // clé de dépannage (étincelles froides)
  { stroke: ['M76 18a22 22 0 0 0-27 28L18 77a9 9 0 0 0 13 13l31-31a22 22 0 0 0 28-27l-14 14-12-3-3-12z'],
    cold: ['M86 82l14 14M96 72l10 10'] },
  // maison chauffée
  { stroke: ['M14 56 60 18l46 38', 'M24 48v56h72V48'],
    fill: ['M60 58c5 6 10 9 10 16a10 10 0 0 1-20 0c0-5 3-8 6-10 0 3 1 5 3 6-1-5 0-8 1-12z'] },
];

// Échantillonne une forme : renvoie des points (x, y dans -1..1) et leur type (0 braise, 1 cœur chaud, 2 froid)
function sampleShape(shape, count) {
  const S = 180;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.scale(S / 120, S / 120);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const draw = (paths, color, mode) => (paths || []).forEach((d) => {
    const p = new Path2D(d);
    if (mode === 'fill') { ctx.fillStyle = color; ctx.fill(p); }
    ctx.strokeStyle = color; ctx.lineWidth = mode === 'fill' ? 2 : 6.5; ctx.stroke(p);
  });
  draw(shape.stroke, '#ff0000', 'stroke');
  draw(shape.hot, '#00ff00', 'stroke');
  draw(shape.fill, '#00ff00', 'fill');
  draw(shape.cold, '#0000ff', 'stroke');
  const data = ctx.getImageData(0, 0, S, S).data;
  const pts = [];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      if (data[i + 3] < 120) continue;
      const type = data[i + 2] > 128 ? 2 : data[i + 1] > 128 ? 1 : 0;
      pts.push([x / S * 2 - 1, 1 - y / S * 2, type]);
    }
  }
  const out = new Float32Array(count * 4);
  for (let k = 0; k < count; k++) {
    const q = pts[(Math.random() * pts.length) | 0];
    out[k * 4] = q[0] + (Math.random() - 0.5) * 0.012;
    out[k * 4 + 1] = q[1] + (Math.random() - 0.5) * 0.012;
    out[k * 4 + 2] = (Math.random() - 0.5) * 0.22; // un peu d'épaisseur pour la profondeur
    out[k * 4 + 3] = q[2];
  }
  return out;
}

function prepareMorph() {
  const section = document.querySelector('.services');
  const morph = document.getElementById('morph');
  if (!section || !morph || !useGPU()) return false;
  // le texte de chaque étape est repris des cartes (aucune duplication dans le HTML)
  const box = document.getElementById('morph-text');
  section.querySelectorAll('.svc').forEach((card, i) => {
    const step = document.createElement('div');
    step.className = 'morph__step' + (i === 0 ? ' is-active' : '');
    const num = document.createElement('p');
    num.className = 'morph__num';
    num.textContent = card.querySelector('.svc__num').textContent;
    step.append(num,
      card.querySelector('h3').cloneNode(true),
      card.querySelector('.svc__text > p:not(.svc__num)').cloneNode(true),
      card.querySelector('.svc__list').cloneNode(true));
    box.appendChild(step);
  });
  morph.hidden = false;
  section.classList.add('has-morph');
  return true;
}

async function initMorph3D() {
  const morph = document.getElementById('morph');
  const canvas = document.getElementById('morph-canvas');
  if (!morph || morph.hidden) return;

  let THREE;
  try { THREE = await import(THREE_URL); } catch (e) { return; }

  const lite = isSmall || lowPower;
  const COUNT = lite ? 4200 : 12000;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0, 6);
  const group = new THREE.Group();
  scene.add(group);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  ['aA', 'aB', 'aC', 'aD'].forEach((name, i) => geo.setAttribute(name, new THREE.BufferAttribute(sampleShape(MORPH_SHAPES[i], COUNT), 4)));
  const rand = new Float32Array(COUNT * 3);
  for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));

  const uniforms = {
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uPR: { value: dpr },
    uPointer: { value: new THREE.Vector2(9, 9) },
    uPush: { value: 0 },
    uSize: { value: lite ? 1 : 1.3 },
  };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */ `
      attribute vec4 aA; attribute vec4 aB; attribute vec4 aC; attribute vec4 aD; attribute vec3 aRand;
      uniform float uMorph; uniform float uTime; uniform float uPR; uniform vec2 uPointer; uniform float uPush; uniform float uSize;
      varying vec3 vColor; varying float vGlow;
      void main(){
        float w0 = clamp(1.0 - abs(uMorph - 0.0), 0.0, 1.0);
        float w1 = clamp(1.0 - abs(uMorph - 1.0), 0.0, 1.0);
        float w2 = clamp(1.0 - abs(uMorph - 2.0), 0.0, 1.0);
        float w3 = clamp(1.0 - abs(uMorph - 3.0), 0.0, 1.0);
        vec4 s = aA * w0 + aB * w1 + aC * w2 + aD * w3;
        vec3 p = s.xyz;
        // entre deux formes : explosion en tourbillon
        float burst = sin(fract(uMorph) * 3.14159);
        burst *= burst;
        vec3 dir = normalize(aRand - 0.5 + 0.0001);
        p += dir * burst * (0.9 + aRand.y * 1.8);
        float ang = burst * (aRand.x - 0.5) * 5.0 + burst * uTime * 0.6;
        float ca = cos(ang), sa = sin(ang);
        p.xz = mat2(ca, -sa, sa, ca) * p.xz;
        p.y += burst * (aRand.z - 0.3) * 0.8;
        // respiration au repos
        p += 0.018 * vec3(sin(uTime * 1.3 + aRand.x * 40.0), cos(uTime * 1.1 + aRand.y * 40.0), sin(uTime * 0.9 + aRand.z * 40.0));
        // le doigt / la souris repousse les braises
        vec2 d = p.xy - uPointer;
        float dl = length(d);
        p.xy += normalize(d + 0.0001) * uPush * 0.35 * exp(-dl * dl * 9.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float twinkle = 0.7 + 0.3 * sin(uTime * (2.0 + aRand.z * 3.0) + aRand.x * 60.0);
        gl_PointSize = (1.6 + aRand.z * 2.6) * uSize * uPR * (1.0 + burst * 0.8) * (5.5 / -mv.z);
        float type = s.w;
        vec3 ember = mix(vec3(1.0, 0.36, 0.08), vec3(1.0, 0.6, 0.2), aRand.x);
        vec3 col = mix(ember, vec3(1.0, 0.86, 0.55), clamp(type, 0.0, 1.0));
        col = mix(col, vec3(0.25, 0.65, 1.0), clamp(type - 1.0, 0.0, 1.0));
        vColor = col * twinkle * (1.0 - burst * 0.35);
        vGlow = 1.0 + burst;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor; varying float vGlow;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a = a * a * 1.4;
        vec3 col = vColor * a;
        gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
      }`,
  }));
  group.add(points);

  /* Mise en page : forme en haut (mobile) ou à droite (ordinateur) */
  const layout = { x: 0, y: 0, s: 1 };
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const halfH = camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    if (camera.aspect > 1.1) {
      layout.s = Math.min(halfH * 0.62, halfW * 0.4);
      layout.x = halfW * 0.42;
      layout.y = -0.05;
    } else {
      layout.s = Math.min(halfW * 0.78, halfH * 0.36);
      layout.x = 0;
      layout.y = halfH * 0.36;
    }
  };
  resize();
  window.addEventListener('resize', resize);

  /* Doigt / souris → coordonnées locales de la forme */
  const pointer = { x: 9, y: 9, on: 0, target: 0 };
  const toLocal = (cx, cy) => {
    const r = canvas.getBoundingClientRect();
    const halfH = camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    const wx = ((cx - r.left) / r.width * 2 - 1) * halfW;
    const wy = -((cy - r.top) / r.height * 2 - 1) * halfH;
    pointer.x = (wx - group.position.x) / group.scale.x;
    pointer.y = (wy - group.position.y) / group.scale.y;
    pointer.target = 1;
  };
  const sticky = morph.querySelector('.morph__sticky');
  sticky.addEventListener('pointermove', (e) => toLocal(e.clientX, e.clientY), { passive: true });
  sticky.addEventListener('pointerdown', (e) => toLocal(e.clientX, e.clientY), { passive: true });
  sticky.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) toLocal(t.clientX, t.clientY); }, { passive: true });
  ['pointerleave', 'pointerup', 'touchend'].forEach((ev) => sticky.addEventListener(ev, () => { pointer.target = 0; }));

  /* Scroll → forme ; chaque forme « tient » avant d'exploser vers la suivante */
  const steps = [...morph.querySelectorAll('.morph__step')];
  const count = document.getElementById('morph-count');
  const bar = document.getElementById('morph-bar');
  let target = 0;
  let current = 0;
  let activeIdx = 0;
  const onScroll = () => {
    const r = morph.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - window.innerHeight));
    const raw = p * 3;
    const k = Math.min(2, Math.floor(raw));
    const f = raw - k;
    const ss = (t) => t * t * (3 - 2 * t);
    target = k + ss(clamp((f - 0.3) / 0.4));
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  onScrollFrame(onScroll);
  onScroll();

  let visible = false;
  let running = !document.hidden;
  let rafId = 0;
  const clock = new THREE.Clock();
  let t = 0;
  function frame() {
    rafId = 0;
    if (!visible || !running) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    current += (target - current) * Math.min(1, dt * 6);
    uniforms.uMorph.value = current;
    uniforms.uTime.value = t;
    pointer.on += (pointer.target - pointer.on) * 0.12;
    uniforms.uPush.value = pointer.on;
    uniforms.uPointer.value.set(pointer.x, pointer.y);

    const idx = Math.round(current);
    if (idx !== activeIdx) {
      steps.forEach((st, i) => {
        st.classList.toggle('is-active', i === idx);
        st.classList.toggle('is-past', i < idx);
      });
      count.textContent = String(idx + 1).padStart(2, '0');
      activeIdx = idx;
    }

    group.scale.setScalar(layout.s);
    group.position.set(layout.x, layout.y, 0);
    group.rotation.y = Math.sin(t * 0.45) * 0.32;
    group.rotation.x = Math.sin(t * 0.3) * 0.08;
    renderer.render(scene, camera);
    loop();
  }
  function loop() {
    if (!rafId && visible && running) rafId = requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; loop(); });
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  loop();
  requestAnimationFrame(() => canvas.classList.add('is-ready'));
}

/* --------------------------------------------------------------------------
   Démarrage
   -------------------------------------------------------------------------- */
injectConfig();
prepareMorph();
initTopbar();
initSmoothScroll();
initCounters();
initReveals();
initThermostat();
initManifesto();
initScrollLoop();
initCarousel();
initInView();
initRadarMotion();
initCursor();
initFlameTouch();
initFab();

// GSAP et la 3D démarrent une fois la page affichée (meilleur score Lighthouse)
const start3D = () => {
  const go = () => { initScrollEffects(); initHero3D().catch(() => {}).then(initMorph3D); };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1200 });
  else setTimeout(go, 300);
};
if (document.readyState === 'complete') start3D();
else window.addEventListener('load', start3D, { once: true });
