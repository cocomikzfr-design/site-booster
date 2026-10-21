/* ==========================================================================
   ChocoCards — hero-3d.js
   <hero-scene> : cartes ChocoCards en 3D (Three.js) qui flottent, reflet
   holographique qui suit la souris / le gyroscope, paillettes dorées.
   - Three.js n'est chargé que sur la page qui contient cette section,
     en différé (quand le navigateur est disponible).
   - Mobile : version allégée (moins de cartes / particules, résolution réduite)
     et, par défaut, chargement au premier geste pour préserver la vitesse.
   - Pause automatique hors écran / onglet caché ; rien du tout si l'internaute
     préfère réduire les animations (version CSS à la place).
   Aucune image, aucun personnage ni logo officiel : tout est dessiné ici.
   ========================================================================== */
import { theme, motionOK, isDesignMode, $, clamp, wait } from '@theme/utils';

const root = document.documentElement;

const CARD_VERTEX = /* glsl */`
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

// Reflet holographique : arc-en-ciel qui dépend de l'angle de vue et de la souris
const CARD_FRAGMENT = /* glsl */`
  uniform sampler2D uMap;
  uniform sampler2D uMask;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uIntensity;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  vec3 spectrum(float t) { return 0.55 + 0.45 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec4 base = texture2D(uMap, vUv);
    if (base.a < 0.02) discard;
    float m = texture2D(uMask, vUv).r;
    vec3 n = normalize(vN);
    float facing = clamp(dot(n, normalize(vV)), 0.0, 1.0);
    float fres = pow(1.0 - facing, 2.0);
    float phase = vUv.x * 1.2 + vUv.y * 0.8 + n.x * 1.6 + n.y * 1.1 + uMouse.x * 0.5 - uMouse.y * 0.35 + uTime * 0.05;
    vec3 holo = spectrum(phase);
    float lines = 0.5 + 0.5 * sin((vUv.x + vUv.y) * 220.0 + phase * 6.0);
    float k = clamp(m * uIntensity * (0.42 + 0.55 * fres + 0.22 * lines), 0.0, 1.0);
    vec3 col = mix(base.rgb, base.rgb * 0.35 + holo * 0.95, k);
    vec2 cell = floor(vUv * vec2(70.0, 98.0));
    float h = hash(cell);
    col += step(0.975, h) * pow(0.5 + 0.5 * sin(uTime * 4.0 + h * 50.0), 8.0) * m * 1.2;
    vec2 gp = vec2(0.5 + uMouse.x * 0.45 - n.x * 0.5, 0.5 - uMouse.y * 0.45 + n.y * 0.5);
    float glare = smoothstep(0.6, 0.0, distance(vUv, gp));
    col += glare * glare * 0.32;
    col *= 0.78 + 0.22 * facing;
    gl_FragColor = vec4(col, base.a);
  }`;

const SPARKLE_VERTEX = /* glsl */`
  uniform float uTime;
  uniform float uPR;
  attribute float aSeed;
  attribute float aSize;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec3 p = position;
    p.y = mod(uTime * (0.15 + aSeed * 0.35) + aSeed * 14.0, 14.0) - 7.0;
    p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uPR * (10.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    vAlpha = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 40.0), 3.0);
    vSeed = aSeed;
  }`;

const SPARKLE_FRAGMENT = /* glsl */`
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float core = smoothstep(0.5, 0.0, length(c));
    float star = max(smoothstep(0.07, 0.0, abs(c.x)) * smoothstep(0.5, 0.0, abs(c.y)),
                     smoothstep(0.07, 0.0, abs(c.y)) * smoothstep(0.5, 0.0, abs(c.x)));
    float a = (core * core + star * 0.6) * vAlpha;
    vec3 gold = mix(vec3(1.0, 0.72, 0.28), vec3(1.0, 0.95, 0.8), vSeed);
    gl_FragColor = vec4(gold, a);
  }`;

/* Textures des cartes dessinées en 2D (aucune image externe, aucun logo officiel) */
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function holoStroke(ctx, cx, cy, r) {
  if (ctx.createConicGradient) {
    const g = ctx.createConicGradient(0, cx, cy);
    ['#C4B5FD', '#67E8F9', '#F9A8D4', '#FDE68A', '#C4B5FD'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    return g;
  }
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, '#C4B5FD'); g.addColorStop(0.5, '#67E8F9'); g.addColorStop(1, '#FDE68A');
  return g;
}
function drawStar(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCardBack({ brand, monogram }) {
  const W = 512; const H = 716;
  const color = makeCanvas(W, H); const mask = makeCanvas(W, H);
  const c = color.getContext('2d'); const m = mask.getContext('2d');
  // Cadre doré
  rr(c, 0, 0, W, H, 34); c.save(); c.clip();
  let g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#F3D98B'); g.addColorStop(0.45, '#B8862B'); g.addColorStop(1, '#F6E2A4');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // Fond chocolat
  rr(c, 18, 18, W - 36, H - 36, 22);
  g = c.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, H * 0.62);
  g.addColorStop(0, '#6B4330'); g.addColorStop(1, '#24150E');
  c.fillStyle = g; c.fill();
  // Tablette de chocolat 3 x 4
  const cols = 3; const rows = 4; const pad = 40; const gap = 14;
  const cw = (W - 2 * pad - (cols - 1) * gap) / cols;
  const ch = (H - 2 * pad - (rows - 1) * gap) / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let k = 0; k < cols; k += 1) {
      const x = pad + k * (cw + gap); const y = pad + r * (ch + gap);
      rr(c, x, y, cw, ch, 14); c.fillStyle = 'rgba(30,18,12,.55)'; c.fill();
      rr(c, x + 8, y + 8, cw - 16, ch - 16, 10);
      const sg = c.createLinearGradient(x, y, x + cw, y + ch);
      sg.addColorStop(0, '#7A4A33'); sg.addColorStop(1, '#4A2C1D');
      c.fillStyle = sg; c.fill();
      c.strokeStyle = 'rgba(255,240,220,.08)'; c.lineWidth = 2; c.stroke();
    }
  }
  // Emblème
  const cx = W / 2; const cy = H / 2; const R = 112;
  c.beginPath(); c.arc(cx, cy, R + 18, 0, Math.PI * 2); c.fillStyle = '#1F130D'; c.fill();
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.lineWidth = 12; c.strokeStyle = holoStroke(c, cx, cy, R); c.stroke();
  c.fillStyle = '#FFF6EC'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '800 112px "Bricolage Grotesque", "Arial Black", sans-serif';
  c.fillText(monogram, cx, cy + 8);
  // Plaque du nom
  rr(c, cx - 150, H - 108, 300, 54, 27); c.fillStyle = '#1F130D'; c.fill();
  c.font = '700 24px Inter, Arial, sans-serif';
  if ('letterSpacing' in c) c.letterSpacing = '7px';
  c.fillStyle = '#F3D98B'; c.fillText(brand.toUpperCase().slice(0, 14), cx + 3, H - 80);
  [[cx - 168, cy - 200, 14], [cx + 170, cy - 190, 10], [cx + 150, cy + 196, 16], [cx - 160, cy + 186, 9]].forEach(([x, y, s]) => drawStar(c, x, y, s, '#FDE68A'));
  c.restore();

  // Masque : où le reflet holo s'applique (blanc = fort)
  m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
  rr(m, 0, 0, W, H, 34); m.fillStyle = '#fff'; m.fill();
  rr(m, 18, 18, W - 36, H - 36, 22); m.fillStyle = '#262626'; m.fill();
  m.beginPath(); m.arc(cx, cy, R, 0, Math.PI * 2); m.lineWidth = 16; m.strokeStyle = '#fff'; m.stroke();
  m.fillStyle = '#bbb'; m.textAlign = 'center'; m.textBaseline = 'middle';
  m.font = '800 112px "Bricolage Grotesque", "Arial Black", sans-serif'; m.fillText(monogram, cx, cy + 8);
  return { color, mask };
}

function drawCardFront({ brand, monogram, tagline }) {
  const W = 512; const H = 716;
  const color = makeCanvas(W, H); const mask = makeCanvas(W, H);
  const c = color.getContext('2d'); const m = mask.getContext('2d');
  rr(c, 0, 0, W, H, 34); c.save(); c.clip();
  let g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#FFF6EC'); g.addColorStop(0.5, '#EAD3BA'); g.addColorStop(1, '#F7E8D6');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // Barre du nom
  c.fillStyle = '#2B1A12'; c.textBaseline = 'middle';
  c.font = '800 34px "Bricolage Grotesque", "Arial Black", sans-serif'; c.textAlign = 'left';
  c.fillText(brand.slice(0, 16), 40, 52);
  c.font = '700 22px Inter, Arial, sans-serif'; c.textAlign = 'right';
  c.fillText('HOLO ★', W - 40, 52);
  // Fenêtre d'illustration abstraite (aucun personnage)
  const ax = 34; const ay = 86; const aw = W - 68; const ah = 340;
  rr(c, ax, ay, aw, ah, 18); c.save(); c.clip();
  g = c.createLinearGradient(ax, ay, ax + aw, ay + ah);
  g.addColorStop(0, '#5B21B6'); g.addColorStop(0.5, '#0E7490'); g.addColorStop(1, '#BE185D');
  c.fillStyle = g; c.fillRect(ax, ay, aw, ah);
  [[0.25, 0.3, 160, 'rgba(196,181,253,.7)'], [0.75, 0.7, 180, 'rgba(103,232,249,.55)'], [0.6, 0.2, 120, 'rgba(249,168,212,.6)']].forEach(([px, py, r, col]) => {
    const rg = c.createRadialGradient(ax + aw * px, ay + ah * py, 0, ax + aw * px, ay + ah * py, r);
    rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg; c.fillRect(ax, ay, aw, ah);
  });
  drawStar(c, W / 2, ay + ah / 2, 110, 'rgba(255,246,236,.95)');
  drawStar(c, W / 2, ay + ah / 2, 60, '#FDE68A');
  for (let i = 0; i < 26; i += 1) drawStar(c, ax + Math.random() * aw, ay + Math.random() * ah, 3 + Math.random() * 9, 'rgba(255,255,255,.85)');
  c.restore();
  c.lineWidth = 6; c.strokeStyle = '#B8862B'; rr(c, ax, ay, aw, ah, 18); c.stroke();
  // Ligne de type + zone de texte stylisée
  c.fillStyle = '#4A2C1D'; c.font = 'italic 600 20px Inter, Arial, sans-serif'; c.textAlign = 'center';
  c.fillText(tagline, W / 2, ay + ah + 32);
  rr(c, 40, 486, W - 80, 160, 14); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
  c.fillStyle = 'rgba(74,44,29,.28)';
  [[60, 512, 300], [60, 544, 380], [60, 576, 340], [60, 608, 220]].forEach(([x, y, w]) => { rr(c, x, y, w, 12, 6); c.fill(); });
  c.fillStyle = '#4A2C1D'; c.font = '700 18px Inter, Arial, sans-serif';
  c.textAlign = 'left'; c.fillText('030/030', 40, H - 36);
  c.textAlign = 'right'; c.fillText(`✦ ${monogram}`, W - 40, H - 36);
  c.restore();

  m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
  rr(m, 0, 0, W, H, 34); m.fillStyle = '#7a7a7a'; m.fill();
  rr(m, ax, ay, aw, ah, 18); m.fillStyle = '#fff'; m.fill();
  rr(m, 40, 486, W - 80, 160, 14); m.fillStyle = '#1a1a1a'; m.fill();
  return { color, mask };
}


/* Test léger : on ne crée pas de contexte WebGL « pour voir » (coûteux). Si la
   création du rendu échoue plus tard, la version CSS reste simplement affichée. */
const webglLikely = () => 'WebGLRenderingContext' in window;

class HeroScene extends HTMLElement {
  connectedCallback() {
    this.hero = this.closest('[data-hero]') || this.parentElement;
    this.canvas = $('canvas', this);
    this.cleanup = [];
    if (!theme.settings.hero3d || this.dataset.enabled === 'false' || !motionOK || !this.canvas || !webglLikely()) return;
    const mobile = window.matchMedia('(max-width: 899px)').matches;
    const mode = this.dataset.mobileMode || 'interaction';
    if (mobile && mode === 'never') return;
    const start = () => {
      if (this.started || !this.isConnected) return;
      this.started = true;
      this.build(mobile).catch((err) => console.warn('[ChocoCards] 3D indisponible, version légère conservée.', err));
    };
    if (mobile && mode === 'interaction' && !isDesignMode) {
      // Chargement au premier geste (toucher / scroll) : page plus rapide au premier affichage
      const events = ['touchstart', 'scroll', 'pointerdown', 'keydown'];
      const once = () => { events.forEach((ev) => window.removeEventListener(ev, once)); start(); };
      events.forEach((ev) => window.addEventListener(ev, once, { passive: true, once: true }));
      this.cleanup.push(() => events.forEach((ev) => window.removeEventListener(ev, once)));
      return;
    }
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    const go = () => idle(start, { timeout: 2000 });
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  }

  disconnectedCallback() {
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
  }

  on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this.cleanup.push(() => target.removeEventListener(type, fn, opts));
  }

  async build(mobile) {
    const THREE = await import('three');
    if (!this.isConnected) return;
    try { await Promise.race([document.fonts.load('800 100px "Bricolage Grotesque"'), wait(1500)]); } catch { /* non bloquant */ }

    const hero = this.hero;
    const canvas = this.canvas;
    const lite = mobile || (navigator.hardwareConcurrency || 8) <= 4 || navigator.connection?.saveData === true;
    const brand = this.dataset.brand || 'ChocoCards';
    const monogram = (this.dataset.monogram || 'CC').slice(0, 3);
    const tagline = this.dataset.tagline || '';

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      console.info('[ChocoCards] WebGL indisponible : version légère conservée.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    const shared = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } };
    const textures = [];
    const tex = (cnv) => {
      const t = new THREE.CanvasTexture(cnv);
      t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      textures.push(t);
      return t;
    };
    const makeMaterial = ({ color, mask }, intensity) => new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex(color) }, uMask: { value: tex(mask) }, uIntensity: { value: intensity }, uTime: shared.uTime, uMouse: shared.uMouse },
      vertexShader: CARD_VERTEX, fragmentShader: CARD_FRAGMENT, transparent: true
    });
    const matBack = makeMaterial(drawCardBack({ brand, monogram }), 0.9);
    const matFront = makeMaterial(drawCardFront({ brand, monogram, tagline }), 1.0);

    const CW = 1.5; const CH = CW * (88 / 63);
    const geo = new THREE.PlaneGeometry(CW, CH);
    const group = new THREE.Group();
    scene.add(group);
    const count = clamp(Number(lite ? this.dataset.mobileCards : this.dataset.cards) || (lite ? 5 : 9), 1, 16);
    const cards = [];
    for (let i = 0; i < count; i += 1) {
      const card = new THREE.Group();
      const front = new THREE.Mesh(geo, matFront);
      const back = new THREE.Mesh(geo, matBack);
      back.rotation.y = Math.PI;
      card.add(front, back);
      card.userData = {
        phase: Math.random() * Math.PI * 2,
        speed: (0.18 + Math.random() * 0.22) * (i % 2 ? 1 : -1),
        ry0: Math.random() * Math.PI * 2,
        x: 0, y: 0
      };
      group.add(card);
      cards.push(card);
    }

    // Paillettes dorées
    const N = this.dataset.sparkles === 'false' ? 0 : (lite ? 180 : 560);
    const pos = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    const sizes = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      pos[i * 3] = (Math.random() * 2 - 1) * 12;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = -9 + Math.random() * 11;
      seeds[i] = Math.random();
      sizes[i] = 1.5 + Math.random() * 4.5;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: SPARKLE_VERTEX, fragmentShader: SPARKLE_FRAGMENT,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const sparkles = new THREE.Points(pGeo, pMat);
    scene.add(sparkles);

    // Placement : à droite sur grand écran, dans la zone libre au-dessus du texte sur mobile
    const layout = () => {
      const w = hero.clientWidth; const h = hero.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const halfW = halfH * camera.aspect;
      const wide = w >= 900;
      const toWorldY = (py) => halfH * (1 - (2 * py) / h);
      const headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 80;
      const inner = hero.querySelector('.hero__inner');
      const textTop = inner ? inner.offsetTop : h * 0.5;
      const zoneTop = toWorldY(headerH + 10);
      const zoneBottom = toWorldY(textTop - 10);
      cards.forEach((card, i) => {
        const u = card.userData;
        const t = count > 1 ? i / (count - 1) : 0.5;
        const golden = (i * 0.618 + 0.2) % 1;
        const s = i === Math.floor(count / 2) ? 1.3 : 0.85 + ((i * 0.53) % 1) * 0.3;
        if (wide) {
          u.x = halfW * (0.2 + golden * 0.7);
          u.y = halfH * (0.62 - t * 1.3);
          card.position.z = -3.2 + ((i * 0.37) % 1) * 4.2;
          card.scale.setScalar(s);
        } else {
          const scale = s * 0.72;
          const halfCard = (CH * scale) / 2;
          const top = zoneTop - halfCard;
          const bottom = Math.min(zoneBottom + halfCard, top);
          u.x = halfW * (-0.7 + golden * 1.4);
          u.y = top - (top - bottom) * ((i * 0.43 + 0.15) % 1);
          card.position.z = -1.2 + ((i * 0.37) % 1) * 1.6;
          card.scale.setScalar(scale);
        }
        card.position.x = u.x;
      });
    };
    layout();

    // Souris / gyroscope
    const mouse = new THREE.Vector2();
    const target = new THREE.Vector2();
    this.on(window, 'pointermove', (e) => {
      target.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    this.on(window, 'deviceorientation', (e) => {
      if (e.gamma == null) return;
      target.set(clamp(e.gamma / 25, -1, 1), clamp((e.beta - 45) / 25, -1, 1));
    }, { passive: true });
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      this.on(hero, 'touchend', () => { DeviceOrientationEvent.requestPermission().catch(() => {}); }, { once: true });
    }
    let scrollProgress = 0;
    this.on(window, 'scroll', () => { scrollProgress = clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1); }, { passive: true });

    // Boucle d'animation, en pause hors écran
    let running = false; let raf = 0; let last = performance.now(); let time = 0; let first = true;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      mouse.lerp(target, 0.05);
      shared.uTime.value = time;
      shared.uMouse.value.copy(mouse);
      cards.forEach((card) => {
        const u = card.userData;
        card.rotation.y = u.ry0 + time * u.speed + mouse.x * 0.6;
        card.rotation.x = Math.sin(time * 0.6 + u.phase) * 0.22 + mouse.y * 0.3;
        card.rotation.z = Math.sin(time * 0.4 + u.phase) * 0.12;
        card.position.y = u.y + Math.sin(time * 0.8 + u.phase) * 0.18;
      });
      group.rotation.y = mouse.x * 0.12;
      group.rotation.x = mouse.y * 0.06;
      group.position.y = scrollProgress * 2.6;
      sparkles.rotation.y = time * 0.015 + mouse.x * 0.05;
      sparkles.position.y = scrollProgress * 1.2;
      renderer.render(scene, camera);
      if (first) { first = false; hero.classList.add('is-3d'); }
    };
    const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    });
    io.observe(hero);
    this.on(document, 'visibilitychange', () => { if (document.hidden) stop(); else if (visible) start(); });
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => layout()) : null;
    ro?.observe(hero);
    this.on(canvas, 'webglcontextlost', (e) => { e.preventDefault(); stop(); hero.classList.remove('is-3d'); });
    start();

    // Libération de la mémoire GPU (rechargement de section dans l'éditeur…)
    this.cleanup.push(() => {
      stop();
      io.disconnect();
      ro?.disconnect();
      geo.dispose(); pGeo.dispose(); pMat.dispose(); matBack.dispose(); matFront.dispose();
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      hero.classList.remove('is-3d');
    });
  }
}
customElements.define('hero-scene', HeroScene);
