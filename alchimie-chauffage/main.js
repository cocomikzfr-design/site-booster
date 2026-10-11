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

  // Formulaire : laisser vide pour la démo (aucun envoi).
  // Plus tard : "https://formspree.io/f/VOTRE_ID"
  FORM_ENDPOINT: '',
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

  // Les cartes du formulaire et de la carte s'allument
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
   Formulaire de devis (démo : pas de backend)
   -------------------------------------------------------------------------- */
function initForm() {
  const form = document.getElementById('quote-form');
  if (!form) return;

  const validate = () => {
    let ok = true;
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-invalid'));
    ['nom', 'telephone', 'commune'].forEach((name) => {
      const input = form.elements[name];
      const valid = name === 'telephone'
        ? input.value.replace(/\D/g, '').length >= 9
        : input.value.trim().length >= 2;
      if (!valid) { input.closest('.field').classList.add('is-invalid'); ok = false; }
    });
    if (!form.querySelector('input[name="type"]:checked')) {
      form.querySelector('.field--choices').classList.add('is-invalid');
      ok = false;
    }
    if (!ok) {
      const first = form.querySelector('.is-invalid input');
      if (first) first.focus();
      if (window.gsap && !reducedMotion) {
        window.gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      }
    }
    return ok;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    form.classList.add('is-sending');

    try {
      if (CONFIG.FORM_ENDPOINT) {
        // Branchement Formspree (ou autre) : envoi réel
        await fetch(CONFIG.FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
      } else {
        // DÉMO : on simule un envoi
        await new Promise((r) => setTimeout(r, 700));
      }
    } finally {
      form.classList.remove('is-sending');
      form.classList.add('is-sent');
      document.getElementById('form-reset').focus({ preventScroll: true });
    }
  });

  document.getElementById('form-reset').addEventListener('click', () => {
    form.reset();
    form.classList.remove('is-sent');
  });
}

/* --------------------------------------------------------------------------
   HERO 3D : « cœur de chaleur » + braises qui montent (three.js)
   Chargé à la demande, après le premier affichage, pour rester rapide.
   -------------------------------------------------------------------------- */
const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

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
  const CORE_DETAIL = lite ? 24 : 64;

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

  /* --- Cœur de chaleur : sphère en fusion déformée par du bruit --- */
  const coreUniforms = {
    uTime: { value: 0 },
    uHeat: { value: 1 },
  };
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, CORE_DETAIL),
    new THREE.ShaderMaterial({
      uniforms: coreUniforms,
      vertexShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        varying float vDisp;
        varying vec3 vNormal;
        varying vec3 vView;
        void main(){
          vec3 p = position;
          float n = snoise(p * 1.1 + vec3(0.0, -uTime * 0.45, uTime * 0.12));
          float n2 = snoise(p * 2.6 + vec3(uTime * 0.2, -uTime * 0.7, 0.0)) * 0.35;
          float d = (n + n2) * 0.16;
          // la matière « monte » comme une flamme
          float lift = max(0.0, normal.y) * (0.25 + 0.25 * snoise(vec3(p.xz * 1.4, uTime * 0.6)));
          p += normal * (d + lift * 0.28);
          vDisp = d + lift * 0.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uHeat;
        varying float vDisp;
        varying vec3 vNormal;
        varying vec3 vView;
        void main(){
          float t = clamp(vDisp * 1.8 + 0.38, 0.0, 1.0);
          vec3 deep = vec3(0.22, 0.03, 0.0);
          vec3 ember = vec3(1.0, 0.416, 0.102);
          vec3 amber = vec3(1.0, 0.702, 0.278);
          vec3 white = vec3(1.0, 0.93, 0.8);
          vec3 col = mix(deep, ember, smoothstep(0.0, 0.5, t));
          col = mix(col, amber, smoothstep(0.45, 0.8, t));
          col = mix(col, white, smoothstep(0.88, 1.0, t) * 0.5);
          float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.5);
          col = col * 0.82 + vec3(1.0, 0.42, 0.12) * fres * 0.6;
          // reflet froid discret : contraste chaud / froid
          col += vec3(0.227, 0.627, 1.0) * pow(fres, 4.0) * 0.35 * max(0.0, -vNormal.y + 0.3);
          gl_FragColor = vec4(col * uHeat, 1.0);
        }`,
    })
  );
  group.add(core);

  /* --- Halo lumineux derrière le cœur --- */
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: coreUniforms.uTime, uHeat: coreUniforms.uHeat },
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
      layout.y = 2.35;
      layout.scale = 0.62;
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

    coreUniforms.uTime.value = elapsed;
    emberUniforms.uTime.value = elapsed;
    emberUniforms.uMouse.value.set(mouse.x, mouse.y);
    emberUniforms.uScroll.value = scroll;
    coreUniforms.uHeat.value = 1 - scroll * 0.35;

    const s = layout.scale * (1 + scroll * 0.25);
    group.scale.setScalar(s);
    group.position.set(layout.x + mouse.x * 0.25, layout.y + scroll * 1.6 + mouse.y * 0.15, 0);
    core.rotation.y = elapsed * 0.15 + mouse.x * 0.5;
    core.rotation.x = -mouse.y * 0.35;
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
initForm();

// La 3D démarre une fois la page affichée (meilleur score Lighthouse)
const start3D = () => {
  const go = () => initHero3D();
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 });
  else setTimeout(go, 300);
};
if (document.readyState === 'complete') start3D();
else window.addEventListener('load', start3D, { once: true });
