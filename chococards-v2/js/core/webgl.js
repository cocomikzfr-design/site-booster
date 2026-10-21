/* ==========================================================================
   Outils WebGL partagés (Three.js 0.160.0 chargé à la demande)
   --------------------------------------------------------------------------
   Règles (DESIGN.md §7) :
   - UN renderer par canvas au plus (createRenderer refuse les doublons et
     renvoie le même objet) ; jamais de contexte créé avant d'en avoir besoin.
   - Pixel ratio plafonné : 1,5 desktop, 1,25 tablette, 1 mobile.
   - La boucle s'arrête hors écran (IntersectionObserver), onglet caché
     (visibilitychange) et en mouvement réduit (une seule image fixe).
   - Si WebGL échoue (pas de support, ?gl=0, contexte perdu) : le canvas reçoit
     .is-gl-off / .is-gl-lost et la section garde son visuel CSS de repli.

   API :
     loadThree()                                → Promise<THREE> (import map « three »)
     createRenderer(canvas, options)            → Promise<handle>
        options : { alpha, antialias, dprMax, observe, rootMargin, onFrame(t, dt, handle), onResize(size, handle) }
        handle  : { THREE, renderer, scene?, camera?, size, start(), stop(), renderOnce(), setLoop(fn), dispose(), running, visible }
        Si handle.scene et handle.camera sont définis, le rendu est fait après onFrame ;
        sinon onFrame doit appeler renderer.render() lui-même.
     loadTexture(url, { renderer, premultiply })  → Promise<Texture> (sRGB, en cache)
     loadCardBack(renderer)                     → texture du dos de carte ChocoCards
     createFoilMaterial(THREE, options)         → ShaderMaterial holographique (voir plus bas)
     cardGeometry(THREE, { width, height, radius }) → plan à coins arrondis, UV 0–1
     trackPointer(el)                           → { x, y, tx, ty, update(k) } dans [-1, 1]
   ========================================================================== */

import { prefs } from './motion.js';
import { emit } from './utils.js';

let threePromise = null;

/** Charge Three.js une seule fois (via l'import map de index.html). */
export function loadThree() {
  if (!threePromise) {
    threePromise = import('three').catch((err) => {
      threePromise = null;
      throw err;
    });
  }
  return threePromise;
}

function dprCap() {
  if (prefs.mobile) return 1;
  return prefs.tier === 'high' ? 1.5 : 1.25;
}

/**
 * Crée (ou retrouve) le renderer d'un canvas. Rejette si WebGL est indisponible :
 * prévoir un catch qui laisse le visuel CSS en place.
 */
export async function createRenderer(canvas, {
  alpha = true,
  antialias = null,
  dprMax = null,
  powerPreference = 'high-performance',
  observe = null,
  rootMargin = '15% 0px',
  onFrame = null,
  onResize = null,
} = {}) {
  if (!canvas) throw new Error('createRenderer : canvas manquant');
  if (canvas.__ccGL) return canvas.__ccGL;
  if (!prefs.webgl) {
    canvas.classList.add('is-gl-off');
    throw new Error('WebGL indisponible ou désactivé');
  }
  const THREE = await loadThree();
  if (canvas.__ccGL) return canvas.__ccGL;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha,
      antialias: antialias ?? prefs.tier === 'high',
      powerPreference,
      stencil: false,
      premultipliedAlpha: true,
    });
  } catch (err) {
    canvas.classList.add('is-gl-off');
    throw err;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const cap = dprMax ?? dprCap();
  const size = { width: 0, height: 0, dpr: 1 };
  let loopFn = onFrame;
  let running = false;
  let visible = false;
  let t0 = performance.now();
  let last = 0;

  const handle = {
    THREE,
    renderer,
    canvas,
    scene: null,
    camera: null,
    size,
    lost: false,
    get running() { return running; },
    get visible() { return visible; },
    setLoop(fn) { loopFn = fn; },
    renderOnce() {
      if (handle.lost || !size.width) return;
      loopFn?.((performance.now() - t0) / 1000, 0, handle);
      if (handle.scene && handle.camera) renderer.render(handle.scene, handle.camera);
    },
    start() {
      if (handle.lost) return;
      if (prefs.reduced) { handle.renderOnce(); return; }
      if (running || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      renderer.setAnimationLoop((now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        loopFn?.((now - t0) / 1000, dt, handle);
        if (handle.scene && handle.camera) renderer.render(handle.scene, handle.camera);
      });
    },
    stop() {
      running = false;
      renderer.setAnimationLoop(null);
    },
    dispose() {
      handle.stop();
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      renderer.dispose();
      delete canvas.__ccGL;
    },
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    if (w === size.width && h === size.height && dpr === size.dpr) return;
    size.width = w; size.height = h; size.dpr = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    if (handle.camera && handle.camera.isPerspectiveCamera) {
      handle.camera.aspect = w / h;
      handle.camera.updateProjectionMatrix();
    }
    onResize?.(size, handle);
    if (!running) handle.renderOnce();
  };
  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  resize();

  const target = observe || canvas;
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) handle.start(); else handle.stop();
    }, { rootMargin })
    : null;
  if (io) io.observe(target); else { visible = true; }

  const onVis = () => { if (document.hidden) handle.stop(); else if (visible) handle.start(); };
  document.addEventListener('visibilitychange', onVis);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    handle.lost = true;
    handle.stop();
    canvas.classList.add('is-gl-lost');
    emit('webgl:lost', { canvas });
  });
  canvas.addEventListener('webglcontextrestored', () => {
    handle.lost = false;
    canvas.classList.remove('is-gl-lost');
    if (visible) handle.start();
  });

  canvas.__ccGL = handle;
  canvas.classList.add('is-gl');
  return handle;
}

/* ---------- Textures ---------- */
const textures = new Map();

/**
 * Charge une texture (photo réelle de la boutique, détourée ou non). En cache par URL.
 * premultiply : true pour les détourés (évite le liseré sombre des bords).
 */
export async function loadTexture(url, { renderer = null, premultiply = true, anisotropy = 4 } = {}) {
  const key = `${url}|${premultiply}`;
  if (!textures.has(key)) {
    textures.set(key, loadThree().then((THREE) => new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.premultiplyAlpha = premultiply;
        tex.anisotropy = renderer ? Math.min(anisotropy, renderer.capabilities.getMaxAnisotropy()) : 1;
        tex.needsUpdate = true;
        resolve(tex);
      }, undefined, () => { textures.delete(key); reject(new Error(`Texture introuvable : ${url}`)); });
    })));
  }
  return textures.get(key);
}

/** Dos de carte ChocoCards (matériel de marque). */
export const CARD_BACK_URL = 'assets/img/marque/dos-de-carte.webp';
export const loadCardBack = (renderer) => loadTexture(CARD_BACK_URL, { renderer, premultiply: true });

/* ---------- Géométrie : carte à coins arrondis ---------- */
export function cardGeometry(THREE, { width = 1, height = 1.4, radius = 0.06, segments = 6 } = {}) {
  const w = width / 2, h = height / 2, r = Math.min(radius, w, h);
  const s = new THREE.Shape();
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  const g = new THREE.ShapeGeometry(s, segments);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + w) / width, (pos.getY(i) + h) / height);
  }
  uv.needsUpdate = true;
  return g;
}

/* ---------- Matériau holographique (foil) ----------
   createFoilMaterial(THREE, {
     map,          // texture (photo, dos de carte) ou null → couleur unie tint
     tint,         // couleur de base sans texture (THREE.Color ou '#hex')
     strength,     // intensité du reflet 0–1 (0.55 par défaut)
     mask,         // 'full' : tout l'objet brille ; 'luma' : surtout les zones claires
     opacity,      // 0–1
     side,         // THREE.FrontSide (défaut) | THREE.DoubleSide
   })
   Uniformes à animer : material.uniforms.uTime.value (s), uPointer.value (Vector2 dans [-1, 1]). */
const FOIL_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;
const FOIL_FRAG = /* glsl */`
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform vec3 uTint;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uStrength;
  uniform float uMaskLuma;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewPos;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec4 base = uHasMap > 0.5 ? texture2D(uMap, vUv) : vec4(uTint, 1.0);
    vec3 n = normalize(vNormalV);
    vec3 v = normalize(vViewPos);
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float fres = pow(1.0 - facing, 1.5);

    // Arc-en-ciel qui glisse avec l'angle de vue et le pointeur
    float band = vUv.x * 1.1 + vUv.y * 0.7 + uPointer.x * 0.55 - uPointer.y * 0.35 + fres * 1.6 + uTime * 0.025;
    vec3 rainbow = 0.55 + 0.45 * cos(6.28318 * (band + vec3(0.0, 0.33, 0.67)));
    // Stries diagonales et paillettes
    float stripes = 0.6 + 0.4 * sin((vUv.x - vUv.y) * 70.0 + band * 9.0);
    vec2 cell = floor(vUv * 160.0);
    float sparkle = pow(hash(cell), 40.0) * (0.5 + 0.5 * sin(uTime * 3.0 + hash(cell + 7.0) * 6.2831));
    // Reflet principal qui suit le pointeur
    vec2 hot = vec2(0.5) + uPointer * vec2(0.45, -0.45);
    float glare = smoothstep(0.55, 0.0, distance(vUv, hot));

    float luma = dot(base.rgb, vec3(0.299, 0.587, 0.114));
    float mask = mix(1.0, smoothstep(0.08, 0.75, luma / max(base.a, 0.001)), uMaskLuma);
    vec3 foil = rainbow * stripes * (0.28 + 0.72 * fres + 0.6 * glare) * mask;
    vec3 col = base.rgb + (foil * uStrength + glare * 0.18 * uStrength + sparkle * uStrength) * base.a;

    gl_FragColor = vec4(col, base.a) * uOpacity;
    #include <colorspace_fragment>
  }
`;

export function createFoilMaterial(THREE, { map = null, tint = '#17123A', strength = 0.55, mask = 'full', opacity = 1, side = THREE.FrontSide } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uHasMap: { value: map ? 1 : 0 },
      uTint: { value: new THREE.Color(tint) },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uStrength: { value: strength },
      uMaskLuma: { value: mask === 'luma' ? 1 : 0 },
      uOpacity: { value: opacity },
    },
    vertexShader: FOIL_VERT,
    fragmentShader: FOIL_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    side,
    depthWrite: true,
  });
}

/* ---------- Pointeur normalisé ([-1, 1]) avec lissage ---------- */
export function trackPointer(el = window) {
  const p = { x: 0, y: 0, tx: 0, ty: 0, active: false,
    update(k = 0.08) { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; return p; } };
  const target = el === window ? window : el;
  target.addEventListener('pointermove', (e) => {
    const r = el === window ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : el.getBoundingClientRect();
    p.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    p.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    p.active = true;
  }, { passive: true });
  target.addEventListener('pointerleave', () => { p.tx = 0; p.ty = 0; p.active = false; });
  return p;
}
