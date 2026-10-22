/* ==========================================================================
   Hero · scène WebGL « Le Deck » (Three.js 0.160, chargé à la demande)
   --------------------------------------------------------------------------
   Reprend à l'identique l'affiche CSS (.deck) : 5 dos de cartes ChocoCards en
   éventail + les 3 vraies photos de la boutique (booster japonais 30th,
   ETB 30 ans, carte Pikachu-ex), le halo et les ombres portées. La caméra est
   réglée pour qu'un pixel CSS = une unité au plan z = 0 ; chaque objet est
   placé en profondeur puis ré-agrandi (× (D - z) / D) : la première image est
   identique à l'affiche, mais la parallaxe et l'inclinaison sont en vraie 3D.

   Deux modes :
   - « full » (desktop, souris) : canvas FIXE plein écran sous le contenu,
     rendu dans gsap.ticker APRÈS Lenis (aucun décalage avec le défilement).
     + 2 dos de cartes en profondeur, poussière holo, sortie au défilement :
     les photos s'envolent, l'éventail s'ouvre, la carte centrale se retourne
     (recto « 30 ans ») pendant que la caméra avance ; la feuille de la section
     suivante glisse par-dessus.
   - « compact » (tablette, téléphone) : canvas dans le visuel, définition
     plafonnée, sans antialias, sans extras ni défilement piloté ; gyroscope /
     doigt / mouvement automatique doux.

   Interactions (décoratives, le visuel est aria-hidden) : parallaxe à ressort,
   reflet holo qui suit le pointeur (uLight par objet = vraie source de
   lumière), carte survolée qui se soulève, clic / tap = le paquet se mélange.
   Budget : ≤ 30 draw calls, quelques centaines de triangles, 4 textures.
   ========================================================================== */

import { createRenderer, loadTexture, loadCardBack, cardGeometry } from '../../core/webgl.js';
import { prefs } from '../../core/motion.js';
import { clamp, debounce } from '../../core/utils.js';
import { backPose, photoPose, boxPose, rotateAround, floatAt, cssFloatPhase } from './geometry.js';
import { photoShadow, cardShadow, glow as glowCanvas, faceTrente, sparkle } from './textures.js';

const FOV = 30;
const RAD = Math.PI / 180;
const FLOAT_PERIOD = 7; // s, comme cc-float
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Ressort amorti (inertie des cartes). */
function spring(s, target, dt, k = 140, ratio = 0.55) {
  const c = 2 * Math.sqrt(k) * ratio;
  s.v += (k * (target - s.x) - c * s.v) * dt;
  s.x += s.v * dt;
}

/** Matériau « sprite » (ombres, halo) : compositing sRGB comme le navigateur, alpha prémultiplié. */
function spriteMaterial(THREE, map, { black = false, opacity = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: map }, uOpacity: { value: opacity }, uBlack: { value: black ? 1 : 0 } },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uOpacity; uniform float uBlack;
      varying vec2 vUv;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        float a = t.a * uOpacity;
        gl_FragColor = vec4(mix(t.rgb, vec3(0.0), uBlack) * a, a);
      }`,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
}

/**
 * Matériau holographique du hero (inspiré de core/webgl.js createFoilMaterial, réglé pour ce visuel) :
 * - l'arc-en-ciel ne se pose que sur les zones claires (bordure holo du dos de carte, parties
 *   métallisées des photos) : les fonds sombres restent propres, aucune « poussière » ;
 * - un reflet doux suit la lumière (= le pointeur, exprimé dans le repère de l'objet) ;
 * - quelques paillettes rares, seulement dans le reflet.
 * Uniformes : uMap, uTime, uLight (vec2 ~[-1.4, 1.4]), uStrength, uGlint, uOpacity.
 */
function holoMaterial(THREE, map, { strength = 0.5, glint = 0.6 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uTime: { value: 0 },
      uLight: { value: new THREE.Vector2(0, 0) },
      uStrength: { value: strength },
      uGlint: { value: glint },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = -mv.xyz;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap;
      uniform float uTime;
      uniform vec2 uLight;
      uniform float uStrength;
      uniform float uGlint;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec4 tex = texture2D(uMap, vUv);           // texture prémultipliée
        if (tex.a < 0.003) discard;
        vec3 rgb = tex.rgb / tex.a;                 // couleur « droite » (linéaire)
        vec3 n = normalize(vN);
        vec3 v = normalize(vV);
        float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.0);
        vec2 hot = vec2(0.5) + uLight * vec2(0.5, -0.5);
        float d = distance(vUv * vec2(1.0, 1.25), hot * vec2(1.0, 1.25));
        float glare = exp(-d * d * 6.0);
        float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
        float mask = smoothstep(0.12, 0.6, luma);
        float band = vUv.x * 0.9 + vUv.y * 0.6 + uLight.x * 0.35 - uLight.y * 0.25 + fres * 1.6 + uTime * 0.02;
        vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (band + vec3(0.0, 0.33, 0.67)));
        float stripes = 0.8 + 0.2 * sin((vUv.x - vUv.y) * 80.0 + band * 7.0);
        vec3 foil = rainbow * stripes * (0.3 + 0.7 * glare + fres) * mask * uStrength;
        vec2 cell = floor(vUv * vec2(60.0, 84.0));
        float g = step(0.982, hash(cell)) * (0.5 + 0.5 * sin(uTime * 2.4 + hash(cell + 3.0) * 6.2831));
        float glints = g * mask * glare * uGlint;
        vec3 sheen = vec3(glare) * 0.1 * uStrength;
        // Mélange « écran » : la lumière éclaircit sans brûler les blancs
        vec3 add = foil + sheen + glints;
        vec3 col = 1.0 - (1.0 - rgb) * (1.0 - clamp(add, 0.0, 1.0));
        vec4 o = linearToOutputTexel(vec4(col, 1.0));
        gl_FragColor = vec4(o.rgb * tex.a, tex.a) * uOpacity;
      }`,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
}

/** Poussière holographique (un seul appel de dessin, mélange additif). */
function dustMaterial(THREE, map) {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: map }, uTime: { value: 0 }, uOpacity: { value: 1 }, uScale: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed;
      attribute vec3 aColor;
      uniform float uTime; uniform float uScale;
      varying float vAlpha; varying vec3 vColor;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.5 + 0.5 * sin(uTime * (0.8 + aSeed * 1.7) + aSeed * 40.0);
        vAlpha = tw * tw;
        vColor = aColor;
        gl_PointSize = (2.5 + aSeed * 5.5) * uScale * (1200.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uOpacity;
      varying float vAlpha; varying vec3 vColor;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a * vAlpha * uOpacity * 0.85;
        gl_FragColor = vec4(vColor * a, a);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function canvasTexture(THREE, c, raw = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = raw ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

async function fontsForCanvas() {
  if (!document.fonts?.load) return;
  await Promise.race([
    Promise.all([document.fonts.load("800 100px 'Unbounded'"), document.fonts.load("600 20px 'Geist Mono'")]).catch(() => {}),
    new Promise((r) => setTimeout(r, 900)),
  ]);
}

/**
 * Crée la scène. Rejette si WebGL / Three.js est indisponible (l'affiche CSS reste).
 * opts : { section, visual, deck, canvas, pointer, full, gsap, introDone }
 * Renvoie { show(), dispose(), shuffle() }.
 */
export async function createScene({ section, visual, deck, canvas, pointer, full, gsap }) {
  const backsEl = [...deck.querySelectorAll('.deck__back')];
  const photoEls = [...deck.querySelectorAll('.deck__photo')];
  const glowEl = deck.querySelector('.deck__glow');
  if (backsEl.length < 3 || !photoEls.length) throw new Error('affiche hero incomplète');

  let ready = false;
  let alive = true;
  let shown = false; // rien n’est calculé ni rendu avant show() (createRenderer rend une image dès sa création)
  const handle = await createRenderer(canvas, {
    // full : boucle pilotée ici (gsap.ticker) → observateur factice qui ne démarre jamais la boucle interne
    observe: full ? document.createElement('div') : visual,
    rootMargin: '10% 0px',
    dprMax: full ? undefined : (prefs.tier === 'low' ? 1 : 2),
    antialias: full ? undefined : false,
    onResize: () => { if (ready) relayout(); },
    onFrame: full ? null : (t, dt) => frame(t, dt),
  });
  const { THREE, renderer } = handle;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 20000);

  /* ---------- Textures (photos déjà en cache : mêmes fichiers que l'affiche) ---------- */
  const [backTex, ...photoTex] = await Promise.all([
    loadCardBack(renderer),
    ...photoEls.map((img) => loadTexture(img.currentSrc || img.src, { renderer })),
  ]);
  await fontsForCanvas();
  const faceTex = canvasTexture(THREE, faceTrente(), false);
  faceTex.premultiplyAlpha = true;
  faceTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const cardShadowData = cardShadow({ w: 100 });
  const cardShadowTex = canvasTexture(THREE, cardShadowData.canvas);
  const glowTex = canvasTexture(THREE, glowCanvas(256));

  /* ---------- Objets ---------- */
  const unit = new THREE.PlaneGeometry(1, 1);
  const cardGeo = cardGeometry(THREE, { width: 1, height: 1.4, radius: 0.06 });
  const objs = [];
  let order = 0;

  const addShadow = (tex, sx, sy, opacity) => {
    const mat = spriteMaterial(THREE, tex, { black: true, opacity });
    const mesh = new THREE.Mesh(unit, mat);
    mesh.renderOrder = order++;
    scene.add(mesh);
    return { mesh, mat, sx, sy, base: opacity };
  };

  // Halo
  const glow = {
    kind: 'glow', el: glowEl, z: -160, k: -10,
    holder: new THREE.Mesh(unit, spriteMaterial(THREE, glowTex)),
  };
  glow.holder.renderOrder = order++;
  scene.add(glow.holder);
  objs.push(glow);

  // Dos de cartes supplémentaires (desktop) : loin derrière, distribués après la reprise
  const extras = [];
  if (full) {
    [
      { u: 0.05, v: 0.3, deg: -30, s: 0.52, z: -420, k: 5, delay: 0.25 },
      { u: 0.96, v: 0.58, deg: 26, s: 0.48, z: -520, k: 4, delay: 0.4 },
    ].forEach((x) => {
      const o = { kind: 'extra', ...x, holder: new THREE.Object3D(), deal: { x: 0, v: 0 }, target: 0 };
      o.shadow = addShadow(cardShadowTex, cardShadowData.scaleX, cardShadowData.scaleY, 0.5);
      o.mat = holoMaterial(THREE, backTex, { strength: 0.55 });
      o.mesh = new THREE.Mesh(cardGeo, o.mat);
      o.mesh.renderOrder = order++;
      o.holder.add(o.mesh);
      scene.add(o.holder);
      extras.push(o);
      objs.push(o);
    });
  }

  // Les 5 dos de l'éventail (le 3e, au centre, a un recto « 30 ans » pour la sortie)
  const backs = backsEl.map((el, i) => {
    const o = {
      kind: 'back', el, i, z: -90 + i * 10, k: 9,
      holder: new THREE.Object3D(),
      lift: { x: 0, v: 0 }, spin: { x: 0, v: 0 },
      flip: i === Math.floor(backsEl.length / 2),
    };
    o.shadow = addShadow(cardShadowTex, cardShadowData.scaleX, cardShadowData.scaleY, 0.65);
    o.mat = holoMaterial(THREE, backTex, { strength: 0.6 });
    o.mesh = new THREE.Mesh(cardGeo, o.mat);
    o.mesh.renderOrder = order++;
    o.holder.add(o.mesh);
    if (o.flip) {
      o.faceMat = holoMaterial(THREE, faceTex, { strength: 0.45, glint: 0.9 });
      o.face = new THREE.Mesh(cardGeo, o.faceMat);
      o.face.rotation.y = Math.PI;
      o.face.renderOrder = order++;
      o.holder.add(o.face);
    }
    scene.add(o.holder);
    objs.push(o);
    return o;
  });

  // Photos réelles : booster (arrière), ETB, carte (avant) — ordre du DOM = ordre d'empilement
  const PHOTO = {
    booster: { z: 30, k: 16, foil: 0.2, exit: { dx: 0.0, dy: 0.62, dz: 200, rz: -26, ry: -0.5, rx: -0.2 } },
    etb: { z: 60, k: 22, foil: 0.12, exit: { dx: 0.03, dy: 0.5, dz: 280, rz: -9, ry: 0.15, rx: -0.4 } },
    card: { z: 95, k: 30, foil: 0.42, exit: { dx: 0.07, dy: 0.72, dz: 360, rz: 32, ry: 0.75, rx: -0.15 } },
  };
  const photos = photoEls.map((el, i) => {
    const key = el.classList.contains('deck__photo--etb') ? 'etb' : el.classList.contains('deck__photo--card') ? 'card' : 'booster';
    const cfg = PHOTO[key];
    const sh = photoShadow(photoTex[i].image, { size: 128 });
    const o = {
      kind: 'photo', key, el, ...cfg,
      holder: new THREE.Object3D(),
      lift: { x: 0, v: 0 }, jump: { x: 0, v: 0 }, phase: 0,
    };
    o.shadow = addShadow(canvasTexture(THREE, sh.canvas), sh.scale, sh.scale, 0.55);
    o.mat = holoMaterial(THREE, photoTex[i], { strength: cfg.foil, glint: key === 'card' ? 0.8 : 0.25 });
    o.mesh = new THREE.Mesh(unit, o.mat);
    o.mesh.renderOrder = order++;
    o.holder.add(o.mesh);
    scene.add(o.holder);
    objs.push(o);
    return o;
  });

  // Poussière holo (desktop)
  let dust = null;
  if (full) {
    const N = 90;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const col = new Float32Array(N * 3);
    const palette = [[0.73, 0.66, 1], [0.18, 0.9, 1], [0.36, 0.95, 0.71], [1, 0.83, 0.23], [1, 0.54, 0.78]];
    const data = [];
    for (let i = 0; i < N; i++) {
      seed[i] = Math.random();
      const c = palette[i % palette.length];
      col.set(c, i * 3);
      data.push({ u: -0.12 + Math.random() * 1.2, v: -0.15 + Math.random() * 1.3, z: -500 + Math.random() * 640, sp: 6 + Math.random() * 16, ph: Math.random() * 6.28 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    const mat = dustMaterial(THREE, canvasTexture(THREE, sparkle(64)));
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = order++;
    scene.add(points);
    dust = { points, geo, mat, data, pos };
  }

  /* ---------- Mise en page : lit l'affiche CSS ---------- */
  // deckX, deckY : coin haut-gauche du deck (repère du canvas). En mode full, relu à chaque image
  // (getBoundingClientRect) : la scène suit le DOM au pixel près, même si le header change de hauteur.
  let W = 1, H = 1, D0 = 1, deckX = 0, deckY = 0, DW = 1, heroEnd = 1;
  function relayout() {
    W = handle.size.width || canvas.clientWidth || 1;
    H = handle.size.height || canvas.clientHeight || 1;
    D0 = H / 2 / Math.tan((FOV / 2) * RAD);
    camera.aspect = W / H;
    camera.near = D0 * 0.05;
    camera.far = D0 * 6;
    camera.updateProjectionMatrix();
    const dr = deck.getBoundingClientRect();
    DW = dr.width || 1;
    if (full) {
      deckX = dr.left;
      deckY = dr.top;
      const sr = section.getBoundingClientRect();
      heroEnd = Math.max(1, sr.bottom + scrollY);
    } else {
      const cr = canvas.getBoundingClientRect();
      deckX = dr.left - cr.left;
      deckY = dr.top - cr.top;
    }
    backs.forEach((o) => { o.pose = backPose(o.el); });
    photos.forEach((o) => { o.pose = photoPose(o.el); });
    glow.pose = glowEl ? boxPose(glowEl) : { cx: DW / 2, cy: DW / 2, w: DW * 0.88, h: DW * 0.88, deg: 0 };
    if (dust) dust.mat.uniforms.uScale.value = (handle.size.dpr || 1) * (DW / 560);
  }

  /** Recale la flottaison WebGL sur l'animation CSS en cours (reprise sans saut). */
  let clock = 0;
  function syncPhases() {
    photos.forEach((o) => {
      const f = cssFloatPhase(o.el);
      o.phase = (f ?? 0) * FLOAT_PERIOD - clock;
    });
  }

  /* ---------- Placement d'un objet : pixels écran → monde ---------- */
  const place = (holder, sx, sy, z, w, h) => {
    const s = (D0 - z) / D0;
    holder.position.set((sx - W / 2) * s, (H / 2 - sy) * s, z);
    holder.scale.set(w * s, h * s, 1);
  };
  const placeShadow = (sh, sx, sy, z, w, h, deg, ox, oy, opacity) => {
    const a = deg * RAD;
    const x = sx + ox * Math.cos(a) - oy * Math.sin(a);
    const y = sy + ox * Math.sin(a) + oy * Math.cos(a);
    place(sh.mesh, x, y, z - 1, w * sh.sx, h * sh.sy);
    sh.mesh.rotation.z = -a;
    sh.mat.uniforms.uOpacity.value = opacity;
  };
  /** Point lumineux = pointeur, exprimé dans le repère de chaque objet (reflet cohérent). */
  const lightFor = (mat, sx, sy, w) => {
    const u = mat.uniforms.uLight.value;
    if (!full || pointer.cx < -9000) { u.set(pointer.x * 0.9, -pointer.y * 0.9); return; }
    const px = pointer.cx;
    const py = pointer.cy;
    u.set(clamp((px - sx) / (w * 0.75), -1.4, 1.4), clamp((py - sy) / (w * 0.75), -1.4, 1.4));
  };

  /* ---------- Survol (desktop) : quelle carte est sous le pointeur ? ---------- */
  const screen = new Map();
  function hitTest() {
    if (!full || pointer.cx < -9000) return null;
    const list = [...photos].reverse().concat([...backs].reverse());
    for (const o of list) {
      const s = screen.get(o);
      if (!s || s.alpha < 0.5) continue;
      const a = -s.deg * RAD;
      const dx = pointer.cx - s.x, dy = pointer.cy - s.y;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      const hw = s.w * (o.kind === 'photo' ? 0.36 : 0.5), hh = s.h * (o.kind === 'photo' ? 0.4 : 0.5);
      if (Math.abs(lx) < hw && Math.abs(ly) < hh) return o;
    }
    return null;
  }

  /* ---------- Image ---------- */
  let gain = 0;          // montée en puissance de l'inclinaison et de la respiration après la reprise
  let auto = 0;
  function frame(t, dt) {
    if (!alive || !shown) return;
    clock = t;
    pointer.step(dt);
    if (!full && performance.now() - pointer.lastInput > 2500) {
      // Pas d'entrée depuis un moment (téléphone sans gyroscope) : balayage doux et lent
      auto += dt;
      pointer.tx = Math.sin(auto * 0.42) * 0.55;
      pointer.ty = Math.sin(auto * 0.31 + 1) * 0.4;
    }
    gain = Math.min(1, gain + dt * 0.7);
    const g = inOut(gain);

    const sy = full ? scrollY : 0;
    const e = full ? clamp(sy / heroEnd, 0, 1) : 0;
    // Origine du deck à l'écran ; un objet « collé » (glue 1) suit le contenu, glue < 1 = il traîne
    let ox0 = deckX, oy0 = deckY;
    if (full) { const dr = deck.getBoundingClientRect(); ox0 = dr.left; oy0 = dr.top; }
    const lag = (glue) => (1 - glue) * sy;
    camera.position.set(0, 0, D0 * (1 - 0.14 * inOut(e)));

    const px = pointer.x, py = pointer.y;
    const hovered = hitTest();

    // Halo
    {
      const p = glow.pose;
      const x = ox0 + p.cx + px * glow.k;
      const y = oy0 + p.cy + py * glow.k * 0.75;
      place(glow.holder, x, y, glow.z, p.w, p.h);
      glow.holder.material.uniforms.uOpacity.value = 1 - smooth(0, 0.45, e);
    }

    // Éventail
    const sp = smooth(0, 0.75, e);
    backs.forEach((o) => {
      const p = o.pose;
      spring(o.lift, hovered === o ? 1 : 0, dt);
      spring(o.spin, 0, dt, 90, 0.35);
      const side = p.deg === 0 ? 0 : Math.sign(p.deg);
      const breath = g * Math.sin(t * 0.55 + o.i * 1.3) * 1.2;
      let deg = p.deg * (1 + 1.3 * sp) + breath + o.spin.x * (side || (o.i % 2 ? 1 : -1)) * (Math.abs(p.deg) / 30 + 0.35);
      let glue = 1 - 0.55 * sp;
      let dz = -140 * sp;
      let scale = 1 + 0.04 * o.lift.x;
      let ry = 0;
      let alpha = 1 - smooth(0.72, 0.96, e);
      let lift = 0;
      if (o.flip) {
        const f = smooth(0.12, 0.6, e);
        deg = p.deg + breath * (1 - f);
        ry = Math.PI * inOut(f);
        dz = 230 * f;
        scale *= 1 + 0.4 * f;
        // Elle « tient » à l'écran (glue faible) : la feuille de la section suivante vient la recouvrir
        glue = 1 - 0.86 * smooth(0, 0.65, e);
        lift = 30 * f;
        alpha = 1 - smooth(0.88, 1, e);
      }
      const c = rotateAround(p.px, p.py, p.vx, p.vy, deg);
      const x = ox0 + c.x + px * o.k;
      const y = oy0 + c.y + lag(glue) + py * o.k * 0.75 + lift;
      const z = o.z + dz + 70 * o.lift.x;
      place(o.holder, x, y, z, p.w * scale, p.w * scale);
      o.holder.rotation.set(py * 0.12 * g, ry + px * 0.16 * g, -deg * RAD);
      o.mat.uniforms.uOpacity.value = alpha;
      o.mat.uniforms.uTime.value = t;
      o.mat.uniforms.uStrength.value = 0.6 + 0.3 * o.lift.x;
      lightFor(o.mat, x, y, p.w);
      if (o.faceMat) {
        o.faceMat.uniforms.uOpacity.value = alpha;
        o.faceMat.uniforms.uTime.value = t;
        o.faceMat.uniforms.uLight.value.set(-o.mat.uniforms.uLight.value.x, o.mat.uniforms.uLight.value.y);
      }
      const shy = 24 + 16 * o.lift.x + 40 * (dz > 0 ? dz / 230 : 0);
      placeShadow(o.shadow, x, y, z, p.w * scale, p.h * scale, deg, 0, shy, o.shadow.base * alpha * (1 - 0.25 * o.lift.x) * (1 - 0.6 * smooth(0, 0.4, e)));
      screen.set(o, { x, y, w: p.w * scale, h: p.h * scale, deg, alpha });
    });

    // Cartes lointaines (desktop)
    extras.forEach((o) => {
      spring(o.deal, o.target, dt, 70, 0.6);
      const d = clamp(o.deal.x, 0, 1.3);
      const w = DW * 0.34 * o.s * Math.max(0.001, d);
      const piv = backs[Math.floor(backs.length / 2)].pose;
      // Distribuées depuis le centre de l'éventail jusqu'à leur place
      const tx = ox0 + o.u * DW, ty = oy0 + o.v * DW;
      const fx = ox0 + piv.cx, fy = oy0 + piv.cy;
      const x = fx + (tx - fx) * d + px * o.k + Math.sin(t * 0.3 + o.u * 9) * 6;
      const y = fy + (ty - fy) * d + lag(1 - 0.3 * e) + py * o.k * 0.75 + Math.cos(t * 0.27 + o.v * 7) * 8;
      const z = o.z - 300 * e;
      const deg = o.deg * d + Math.sin(t * 0.21 + o.u) * 3;
      place(o.holder, x, y, z, w, w);
      o.holder.rotation.set(py * 0.1 * g, px * 0.14 * g, -deg * RAD);
      const alpha = Math.min(1, d) * 0.9 * (1 - smooth(0.25, 0.6, e));
      o.mat.uniforms.uOpacity.value = alpha;
      o.mat.uniforms.uTime.value = t;
      lightFor(o.mat, x, y, w);
      placeShadow(o.shadow, x, y, z, w, w * 1.4, deg, 0, 20 * (w / 120), o.shadow.base * alpha);
    });

    // Photos réelles
    const up = smooth(0, 0.5, e);
    photos.forEach((o) => {
      const p = o.pose;
      spring(o.lift, hovered === o ? 1 : 0, dt);
      spring(o.jump, 0, dt, 120, 0.4);
      const fl = floatAt((((t + o.phase) % FLOAT_PERIOD) + FLOAT_PERIOD) % FLOAT_PERIOD / FLOAT_PERIOD);
      const ex = o.exit;
      const deg = p.deg + fl.deg + ex.rz * up;
      const x = ox0 + p.cx + px * o.k + ex.dx * W * up;
      const y = oy0 + p.cy + py * o.k * 0.75 + fl.y + o.jump.x - ex.dy * H * up;
      const z = o.z + 60 * o.lift.x + ex.dz * up;
      const scale = 1 + 0.035 * o.lift.x;
      place(o.holder, x, y, z, p.w * scale, p.h * scale);
      o.holder.rotation.set(py * 0.1 * g + ex.rx * up, px * 0.14 * g + ex.ry * up, -deg * RAD);
      const alpha = 1 - smooth(0.16, 0.44, e);
      o.mat.uniforms.uOpacity.value = alpha;
      o.mat.uniforms.uTime.value = t;
      o.mat.uniforms.uStrength.value = o.foil + 0.12 * o.lift.x;
      lightFor(o.mat, x, y, p.w);
      const lifted = o.lift.x + Math.max(0, -o.jump.x / 60);
      placeShadow(o.shadow, x, y - o.jump.x, z, p.w * scale, p.h * scale, deg, 0, 28 + 18 * lifted + 60 * up,
        o.shadow.base * alpha * (1 - 0.3 * Math.min(1, lifted)));
      screen.set(o, { x, y, w: p.w * scale, h: p.h * scale, deg, alpha });
    });

    // Poussière
    if (dust) {
      const { data, pos, geo, mat } = dust;
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const yy = ((d.v * DW - t * d.sp) % (DW * 1.3) + DW * 1.3) % (DW * 1.3) - DW * 0.15;
        const sx = ox0 + d.u * DW + Math.sin(t * 0.4 + d.ph) * 10 + px * 12;
        const syy = oy0 + yy + lag(1 - 0.5 * e) + py * 9;
        const s = (D0 - d.z) / D0;
        pos[i * 3] = (sx - W / 2) * s;
        pos[i * 3 + 1] = (H / 2 - syy) * s;
        pos[i * 3 + 2] = d.z;
      }
      geo.attributes.position.needsUpdate = true;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uOpacity.value = g * (1 - smooth(0.15, 0.55, e));
    }

    // Fin de la sortie : plus rien à montrer
    section.classList.toggle('is-gl-away', full && e >= 0.995);
  }

  /* ---------- Boucle ---------- */
  let active = false;
  let tickerFn = null;
  let io = null;
  let t0 = performance.now();
  const renderNow = (dt) => {
    if (handle.lost || !alive) return;
    frame((performance.now() - t0) / 1000, dt);
    renderer.render(scene, camera);
  };
  if (full) {
    tickerFn = (time, deltaMs) => {
      if (!active || document.hidden) return;
      renderNow(Math.min(0.05, (deltaMs || 16.7) / 1000));
    };
    io = new IntersectionObserver(([en]) => {
      active = en.isIntersecting;
      section.classList.toggle('is-gl-away', !active);
    }, { rootMargin: '0px' });
    io.observe(section);
  }

  const onResize = debounce(() => { if (ready) relayout(); }, 120);
  addEventListener('resize', onResize);

  relayout();
  ready = true;

  /* ---------- Interface ---------- */
  const api = {
    handle,
    /** Première image identique à l'affiche, puis fondu de l'affiche (classe .is-gl). */
    show() {
      shown = true;
      relayout();
      syncPhases();
      gain = 0;
      t0 = performance.now() - clock * 1000;
      if (full) {
        renderNow(0);
        if (gsap) gsap.ticker.add(tickerFn);
        else {
          const loop = () => { if (!alive) return; tickerFn(0, 16.7); requestAnimationFrame(loop); };
          requestAnimationFrame(loop);
        }
      } else {
        handle.scene = scene;
        handle.camera = camera;
        handle.renderOnce();
        handle.start();
      }
      requestAnimationFrame(() => {
        section.classList.add('is-gl');
        setTimeout(() => {
          if (!alive) return;
          section.classList.add('is-gl-done');
          extras.forEach((o) => { setTimeout(() => { o.target = 1; }, o.delay * 1000); });
        }, 700);
      });
    },
    /** Clic / tap : le paquet se mélange (ressorts). */
    shuffle() {
      backs.forEach((o, i) => { o.spin.v += 260 + i * 12; });
      photos.forEach((o, i) => { setTimeout(() => { o.jump.v -= 520; }, i * 70); });
      extras.forEach((o) => { o.deal.v -= 3; });
    },
    dispose() {
      alive = false;
      if (tickerFn && gsap) gsap.ticker.remove(tickerFn);
      io?.disconnect();
      removeEventListener('resize', onResize);
      section.classList.remove('is-gl', 'is-gl-done', 'is-gl-away', 'is-gl-full');
      scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      handle.dispose();
    },
  };
  return api;
}
