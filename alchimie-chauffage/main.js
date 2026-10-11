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
const isTouch = window.matchMedia('(pointer: coarse)').matches;
const lowPower =
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4);

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
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;
  const mapIframe = document.getElementById('map-iframe');
  if (mapIframe) mapIframe.src = mapSrc;

  // Street View : URL officielle sans clé
  const sv = document.getElementById('streetview-btn');
  if (sv) {
    sv.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${CONFIG.LAT},${CONFIG.LNG}`;
  }

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
   Images : si une photo ne charge pas, on garde un fond chaud en dégradé
   -------------------------------------------------------------------------- */
function initImageFallbacks() {
  document.querySelectorAll('.media img').forEach((img) => {
    const fail = () => img.closest('.media').classList.add('is-fallback');
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
    img.addEventListener('error', fail, { once: true });
  });
}

/* --------------------------------------------------------------------------
   Barre du haut : fond au scroll, masquée en descendant
   -------------------------------------------------------------------------- */
function initTopbar() {
  const bar = document.getElementById('topbar');
  let last = 0;
  const onScroll = () => {
    const y = window.scrollY;
    bar.classList.toggle('is-solid', y > 40);
    bar.classList.toggle('is-hidden', y > last && y > window.innerHeight * 0.9);
    last = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
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
      const offset = id === '#accueil' ? 0 : -70;
      if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
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
      const dur = 1600;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(to * eased, d);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => io.observe(c));
}

/* --------------------------------------------------------------------------
   Animations GSAP + ScrollTrigger
   -------------------------------------------------------------------------- */
function initAnimations() {
  const { gsap, ScrollTrigger } = window;
  if (reducedMotion || !gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Intro du hero
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from('.hero__title .line > span', { yPercent: 110, duration: 1.3, stagger: 0.12 })
    .from('.hero__eyebrow', { y: 16, opacity: 0, duration: 0.9 }, 0.15)
    .from('.hero__sub', { y: 24, opacity: 0, duration: 1 }, 0.35)
    .from('.hero__actions .btn', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.5)
    .from('.hero__rating', { opacity: 0, duration: 1 }, 0.8)
    .from('.header', { opacity: 0, y: -12, duration: 1 }, 0.2);

  // Le contenu du hero s'efface en scrollant
  gsap.to('.hero__content', {
    yPercent: -18, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true },
  });

  // Apparitions génériques
  gsap.utils.toArray('.reveal:not(.card)').forEach((el) => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // Cartes services : légère cascade + inclinaison
  ScrollTrigger.batch('.card', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch,
      { y: 60, rotateX: -8, opacity: 0 },
      { y: 0, rotateX: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: 'power3.out', overwrite: true }),
  });

  // Parallaxe des images
  gsap.to('.why__media img', {
    yPercent: -8, ease: 'none',
    scrollTrigger: { trigger: '.why__media', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.fromTo('.interlude__media', { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.interlude', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // Interlude : les mots passent du froid (bleu) au chaud (ambre) au scroll
  const p = document.getElementById('interlude-text');
  if (p) {
    p.innerHTML = p.textContent.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
    const words = p.querySelectorAll('.w');
    gsap.set(words, { color: 'rgba(58,160,255,0.35)' });
    gsap.to(words, {
      color: (i) => (i >= words.length - 3 ? '#ffb347' : '#f6eee7'),
      stagger: 0.3, ease: 'none',
      scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
    });
  }

  // La carte s'allume
  gsap.from('.map-frame', {
    clipPath: 'inset(12% 12% 12% 12% round 28px)', duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.zone__maps', start: 'top 85%', once: true },
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* --------------------------------------------------------------------------
   Halo qui suit la souris sur les cartes
   -------------------------------------------------------------------------- */
function initCardGlow() {
  if (isTouch) return;
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* --------------------------------------------------------------------------
   Carrousel d'avis
   -------------------------------------------------------------------------- */
function initCarousel() {
  const root = document.getElementById('carousel');
  if (!root) return;
  const slides = [...root.querySelectorAll('.review')];
  const dots = [...root.querySelectorAll('.carousel__dots button')];
  let index = 0;
  let timer = null;

  const go = (i) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === index);
      s.setAttribute('aria-hidden', k === index ? 'false' : 'true');
    });
    dots.forEach((d, k) => {
      d.classList.toggle('is-active', k === index);
      d.setAttribute('aria-selected', k === index ? 'true' : 'false');
    });
  };
  const play = () => {
    if (reducedMotion) return;
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 5500);
  };

  root.querySelectorAll('.carousel__btn').forEach((b) =>
    b.addEventListener('click', () => { go(index + Number(b.dataset.dir)); play(); }));
  dots.forEach((d, k) => d.addEventListener('click', () => { go(k); play(); }));

  // Glisser au doigt
  let x0 = null;
  root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); play(); }
    x0 = null;
  });

  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', play);
  go(0);
  play();
}

/* --------------------------------------------------------------------------
   HERO 3D : flamme + braises qui montent (three.js)
   Chargé à la demande, après le premier affichage, pour rester rapide.
   -------------------------------------------------------------------------- */
async function initHero3D() {
  if (reducedMotion) return;
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js');
  } catch (e) {
    return; // le dégradé CSS reste affiché
  }

  const lite = isSmall || lowPower;
  const EMBERS = lite ? 650 : 2200;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // pas de WebGL : dégradé CSS
  }
  const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const group = new THREE.Group();
  scene.add(group);

  /* --- La flamme : shader de bruit (fbm) sur un plan, base bleue comme un brûleur --- */
  const flameUniforms = {
    uTime: { value: 0 },
    uHeat: { value: 1 },
    uLean: { value: new THREE.Vector2() },
  };
  const flame = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 5.2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      // addition pure : la flamme éclaire sans rendre le fond opaque
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: flameUniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uHeat; uniform vec2 uLean;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
        void main(){
          vec2 p = vUv - vec2(0.5, 0.0);
          float y = p.y;
          // la flamme penche avec la souris, surtout en haut
          p.x -= uLean.x * y * y * 0.4;
          float n = fbm(vec2(p.x * 3.0, y * 2.4 - uTime * 1.5));
          float n2 = fbm(vec2(p.x * 7.0 + 3.1, y * 5.0 - uTime * 2.8));
          p.x += (n - 0.5) * 0.24 * y + (n2 - 0.5) * 0.07 * y;
          // profil en goutte : large en bas, pointe vacillante en haut
          float width = 0.22 * pow(smoothstep(0.0, 0.2, y), 0.55) * (1.0 - smoothstep(0.12, 0.92, y) * 0.96);
          width *= 0.85 + 0.35 * n;
          float d = abs(p.x) / max(width, 0.001);
          float base = smoothstep(0.03, 0.1, y);
          float tip = 1.0 - smoothstep(0.5 + 0.3 * n2, 0.95, y);
          float f = (1.0 - smoothstep(0.5, 1.0, d)) * tip * base;
          float core = (1.0 - smoothstep(0.0, 0.6, d)) * (1.0 - smoothstep(0.12, 0.55, y)) * base;
          vec3 col = mix(vec3(0.7, 0.07, 0.0), vec3(1.0, 0.416, 0.102), smoothstep(0.0, 0.55, f));
          col = mix(col, vec3(1.0, 0.702, 0.278), smoothstep(0.55, 1.0, f));
          col = mix(col, vec3(1.0, 0.95, 0.82), core * 0.85);
          // pied bleu (brûleur) : contraste chaud / froid
          float blue = (1.0 - smoothstep(0.06, 0.2, y)) * (1.0 - smoothstep(0.35, 1.0, d)) * base;
          col = mix(col, vec3(0.227, 0.627, 1.0), blue * 0.8);
          float alpha = clamp(f + blue * 0.5, 0.0, 1.0);
          // halo doux autour de la flamme
          float glow = exp(-abs(p.x) * 7.0) * exp(-abs(y - 0.32) * 3.5) * 0.28;
          col = col * alpha + vec3(1.0, 0.42, 0.12) * glow;
          col *= uHeat;
          gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
        }`,
    })
  );
  flame.position.y = 0.3;
  group.add(flame);

  /* --- Halo lumineux derrière la flamme --- */
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: flameUniforms.uTime, uHeat: flameUniforms.uHeat },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uHeat; varying vec2 vUv;
        void main(){
          float d = length(vUv - 0.5);
          float pulse = 0.92 + 0.08 * sin(uTime * 1.6);
          float a = smoothstep(0.5, 0.0, d);
          vec3 col = mix(vec3(1.0, 0.3, 0.05), vec3(1.0, 0.7, 0.3), smoothstep(0.25, 0.0, d));
          gl_FragColor = vec4(col, a * a * 0.55 * pulse * uHeat);
        }`,
    })
  );
  glow.position.z = -1;
  group.add(glow);

  /* --- Braises (particules) qui montent doucement --- */
  const geo = new THREE.BufferGeometry();
  const seed = new Float32Array(EMBERS);
  const speed = new Float32Array(EMBERS);
  const size = new Float32Array(EMBERS);
  const cold = new Float32Array(EMBERS);
  for (let i = 0; i < EMBERS; i++) {
    seed[i] = Math.random();
    speed[i] = 0.6 + Math.random() * 0.9;
    size[i] = 0.6 + Math.pow(Math.random(), 3) * 2.6;
    cold[i] = Math.random() < 0.06 ? 1 : 0; // quelques étincelles froides
  }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(EMBERS * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aCold', new THREE.BufferAttribute(cold, 1));

  const emberUniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uPR: { value: dpr },
    uScroll: { value: 0 },
  };
  const embers = new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: emberUniforms,
    vertexShader: /* glsl */ `
      attribute float aSeed; attribute float aSpeed; attribute float aSize; attribute float aCold;
      uniform float uTime; uniform vec2 uMouse; uniform float uPR; uniform float uScroll;
      varying float vLife; varying float vCold;
      void main(){
        float t = uTime * aSpeed * (1.0 + uScroll * 1.5);
        float life = fract(t * 0.07 + aSeed * 7.0);
        float H = 9.0;
        float y = -2.2 + life * H;
        float ang = aSeed * 6.2831 * 37.0 + t * 0.25;
        float r0 = 0.3 + 1.5 * fract(aSeed * 13.17);
        // forme de flamme : étroite au milieu, s'élargit en montant
        float r = r0 * (1.0 - smoothstep(0.0, 0.35, life) * 0.55) + life * life * 2.6 * fract(aSeed * 3.7);
        vec3 p = vec3(cos(ang) * r, y, sin(ang) * r * 0.7);
        p.x += sin(t * 0.8 + aSeed * 40.0) * 0.35 * life;
        p.xy += uMouse * vec2(1.4, 0.6) * life;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * (1.0 - life * 0.5) * (22.0 / -mv.z);
        vLife = life; vCold = aCold;
      }`,
    fragmentShader: /* glsl */ `
      varying float vLife; varying float vCold;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.0, d);
        a *= smoothstep(0.0, 0.08, vLife) * (1.0 - smoothstep(0.6, 1.0, vLife));
        vec3 hot = mix(vec3(1.0, 0.85, 0.55), vec3(1.0, 0.416, 0.102), smoothstep(0.0, 0.45, vLife));
        hot = mix(hot, vec3(0.7, 0.12, 0.02), smoothstep(0.5, 1.0, vLife));
        vec3 col = mix(hot, vec3(0.227, 0.627, 1.0), vCold);
        gl_FragColor = vec4(col, a * (vCold > 0.5 ? 0.7 : 0.95));
      }`,
  }));
  group.add(embers);

  /* --- Mise en page selon le format d'écran --- */
  const layout = { x: 0, y: 0, scale: 1 };
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (w / h > 1.1) {
      // paysage : cœur à droite, texte à gauche
      const halfW = camera.position.z * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
      layout.x = halfW * 0.7;
      layout.y = -0.3;
      layout.scale = camera.aspect < 1.45 ? 0.82 : 1;
    } else {
      // portrait (mobile) : cœur en haut, texte en bas
      layout.x = 0;
      layout.y = 2.25;
      layout.scale = 0.6;
    }
  };
  resize();
  window.addEventListener('resize', resize);

  /* --- Interactions : souris / doigt, et scroll --- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  /* --- Boucle (en pause hors écran / onglet caché) --- */
  let visible = true;
  let running = true;
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

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const scroll = Math.min(1, window.scrollY / window.innerHeight);

    flameUniforms.uTime.value = elapsed;
    emberUniforms.uTime.value = elapsed;
    emberUniforms.uMouse.value.set(mouse.x, mouse.y);
    emberUniforms.uScroll.value = scroll;
    flameUniforms.uHeat.value = 1 - scroll * 0.35;

    const s = layout.scale * (1 + scroll * 0.25);
    group.scale.setScalar(s);
    group.position.set(layout.x + mouse.x * 0.25, layout.y + scroll * 1.6 + mouse.y * 0.15, 0);
    flameUniforms.uLean.value.set(mouse.x, mouse.y);
    embers.rotation.y = mouse.x * 0.25;

    renderer.render(scene, camera);
    loop();
  }
  function loop() {
    if (!rafId && visible && running) rafId = requestAnimationFrame(frame);
  }

  renderer.compile(scene, camera);
  loop();
  requestAnimationFrame(() => canvas.classList.add('is-ready'));
}

/* --------------------------------------------------------------------------
   Démarrage
   -------------------------------------------------------------------------- */
injectConfig();
initImageFallbacks();
initTopbar();
initSmoothScroll();
initCounters();
initAnimations();
initCardGlow();
initCarousel();

// La 3D démarre une fois la page affichée (meilleur score Lighthouse)
const start3D = () => {
  const go = () => initHero3D();
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 });
  else setTimeout(go, 300);
};
if (document.readyState === 'complete') start3D();
else window.addEventListener('load', start3D, { once: true });
