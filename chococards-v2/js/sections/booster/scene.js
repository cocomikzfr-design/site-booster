/* ==========================================================================
   Booster · scène WebGL « Ouverture » (Three.js 0.160, chargé à la demande)
   --------------------------------------------------------------------------
   Un booster AUX COULEURS DE CHOCOCARDS (matériel de marque : aucune
   illustration de licence) flotte au-dessus de la scène. La progression p
   (0 → 1) raconte l'ouverture :
     0,00 – 0,30  charge     : le paquet se tourne vers nous, tremble, la ligne
                              « Ouvrir ici » s'illumine
     0,26 – 0,42  déchirure  : la bande du haut se déchire et s'envole
     0,30 – 0,85  éclat      : flash, rayons, poussière lumineuse
     0,36 – 0,80  cartes     : 7 dos de cartes jaillissent et s'ouvrent en
                              éventail 3D ; les 3 du centre se retournent
                              (J-…, code, date : cartes typographiques)
     0,55 – 0,94  révélation : le paquet recule et s'efface, la VRAIE photo du coffret
                              (data.precommandeVedette.image) monte au centre
   Desktop : p suit le défilement (section épinglée, voir booster.js).
   Mobile  : p est joué une fois à l'entrée dans l'écran (ou au toucher).
   Le rendu suit p avec un lissage (inertie) : aucun à-coup, même au trackpad.
   Budget : 15 draw calls, < 4 000 triangles, 5 textures (dont 4 dessinées).
   ========================================================================== */

import { createRenderer, loadTexture, loadCardBack, cardGeometry, createFoilMaterial, trackPointer, CARD_BACK_URL } from '../../core/webgl.js';
import { prefs } from '../../core/motion.js';
import { clamp, loadImage } from '../../core/utils.js';
import { ensureFonts, packArt, faceAtlas, glowArt, raysArt, shadowArt } from './textures.js';

/* ---------- Constantes de mise en scène (unités du monde) ---------- */
const FOV = 30;
const PW = 2.15;           // largeur du paquet
const PH = 3.5;            // hauteur du paquet
const TEAR_V = 0.87;       // ligne de déchirure (UV depuis le bas)
const TEAR_Y = (TEAR_V - 0.5) * PH; // même ligne en coordonnées locales du paquet
const PACK_Y = -0.3;
const CW = 1.25, CH = 1.75; // cartes (proportions 5:7 du dos de carte)
const N_CARDS = 7;
const FACE_OF = { 2: 0, 3: 1, 4: 2 }; // index de carte → recto typographique
const BOX = { halfW: 3.15, halfH: 3.75, cy: 0.05 }; // zone à cadrer (caméra)
/* Poses finales (repère du rig) : les 3 cartes typographiques en arc au-dessus du
   coffret, les 4 dos de cartes en ailes derrière. a = angle sur l'arc, R = rayon,
   py = pivot de l'arc, z = profondeur, s = échelle. */
const FINAL = [
  { a: -0.8, R: 2.9, py: -2.8, z: -1.2, s: 0.88 },
  { a: -0.56, R: 3.4, py: -2.8, z: -1.0, s: 0.92 },
  { a: -0.27, R: 4.75, py: -3.4, z: -0.35, s: 1 },
  { a: 0, R: 4.75, py: -3.4, z: -0.45, s: 1 },
  { a: 0.27, R: 4.75, py: -3.4, z: -0.35, s: 1 },
  { a: 0.56, R: 3.4, py: -2.8, z: -1.0, s: 0.92 },
  { a: 0.8, R: 2.9, py: -2.8, z: -1.2, s: 0.88 },
];

/* ---------- Petites fonctions d'animation ---------- */
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const out3 = (t) => 1 - (1 - t) ** 3;
const in2 = (t) => t * t;
const inOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const backOut = (t, s = 1.4) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Shaders ---------- */
const PACK_VERT = /* glsl */`
  uniform float uOpen;
  uniform float uPart;
  uniform float uBulge;
  varying vec2 vUv;
  varying vec3 vViewPos;
  void main() {
    vUv = uv;
    vec3 p = position;
    float ax = abs(uv.x * 2.0 - 1.0);
    float ex = pow(max(1.0 - ax * ax * ax * ax, 0.0), 0.6);
    float env = smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
    float b = uBulge * ex * env;
    float top = smoothstep(0.6, 0.87, uv.y);
    if (uPart > 1.5) {
      // Intérieur (dos du paquet vu de l'intérieur) : s'écarte à l'ouverture
      p.z = -b * 0.7 - 0.012 - uOpen * 0.16 * top * top * ex;
    } else {
      p.z = b;
      // Le bord déchiré du recto se recourbe vers l'avant
      if (uPart < 0.5) { p.z += uOpen * 0.32 * top * top * ex; p.y -= uOpen * 0.05 * top; }
    }
    p.x *= 1.0 - 0.04 * (1.0 - env); // pincement aux soudures
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const PACK_FRAG = /* glsl */`
  uniform sampler2D uMap;
  uniform float uPart;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uCharge;
  uniform float uOpacity;
  uniform float uTearV;
  varying vec2 vUv;
  varying vec3 vViewPos;
  float tri(float x) { return abs(fract(x) - 0.5) * 2.0; }
  void main() {
    // Déchirure en dents de scie : corps (et intérieur) sous la ligne, bande au-dessus
    float edge = uTearV + (tri(vUv.x * 17.0) - 0.5) * 0.016;
    if (uPart < 0.5 || uPart > 1.5) { if (vUv.y > edge) discard; }
    else { if (vUv.y < edge) discard; }
    // Bords sertis dentelés (haut et bas)
    float serr = tri(vUv.x * 30.0) * 0.012;
    if (vUv.y > 1.0 - serr || vUv.y < serr) discard;

    vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
    vec3 v = normalize(-vViewPos);
    if (dot(n, v) < 0.0) n = -n;
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float fres = pow(1.0 - facing, 1.5);
    vec3 L = normalize(vec3(-0.35 + uPointer.x * 0.7, 0.55 - uPointer.y * 0.5, 0.75));
    float diff = 0.8 + 0.3 * max(dot(n, L), 0.0);
    float spec = pow(max(dot(n, normalize(L + v)), 0.0), 36.0);

    vec3 col;
    bool inside = uPart > 1.5 || !gl_FrontFacing;
    if (inside) {
      // Intérieur métallisé (argent + reflets holo), plus sombre vers le fond
      float band = vUv.x * 1.4 + vUv.y * 0.6 + uTime * 0.03;
      vec3 rainbow = 0.55 + 0.45 * cos(6.28318 * (band + vec3(0.0, 0.33, 0.67)));
      col = mix(vec3(0.5, 0.54, 0.62), rainbow, 0.35) * (0.35 + 0.65 * smoothstep(0.45, 0.86, vUv.y)) * diff;
    } else {
      vec3 base = texture2D(uMap, vUv).rgb;
      float luma = dot(base, vec3(0.299, 0.587, 0.114));
      float band = vUv.x * 1.1 + vUv.y * 0.7 + uPointer.x * 0.5 - uPointer.y * 0.3 + fres * 1.7 + uTime * 0.025;
      vec3 rainbow = 0.55 + 0.45 * cos(6.28318 * (band + vec3(0.0, 0.33, 0.67)));
      float stripes = 0.65 + 0.35 * sin((vUv.x - vUv.y) * 90.0 + band * 8.0);
      float mask = smoothstep(0.25, 0.8, luma);
      col = base * diff + rainbow * stripes * mask * (0.12 + 0.42 * fres);
      float crimp = 1.0 - step(0.075, vUv.y) * step(vUv.y, 0.925);
      col *= 1.0 - crimp * 0.12 * (0.5 + 0.5 * sin(vUv.y * 1100.0));
    }
    col += spec * 0.5;
    // Ligne « Ouvrir ici » qui s'illumine pendant la charge
    float line = smoothstep(0.014, 0.0, abs(vUv.y - edge)) * (0.6 + 0.4 * sin(vUv.x * 60.0 - uTime * 8.0));
    col += uCharge * line * vec3(0.36, 0.95, 0.71) * 1.4;
    gl_FragColor = vec4(col * uOpacity, uOpacity);
    #include <colorspace_fragment>
  }
`;

const CARD_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vViewPos;
  varying vec3 vN;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const CARD_FRAG = /* glsl */`
  uniform sampler2D uBack;
  uniform sampler2D uFaces;
  uniform float uFace;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uOpacity;
  uniform float uGlow;
  varying vec2 vUv;
  varying vec3 vViewPos;
  varying vec3 vN;
  void main() {
    vec2 uv = vUv;
    vec3 n = normalize(vN);
    vec4 base;
    float strength = 0.5;
    if (gl_FrontFacing) {
      base = texture2D(uBack, uv);
    } else {
      // Verso vu de dos : on remet le texte à l'endroit
      n = -n;
      uv.x = 1.0 - uv.x;
      if (uFace < -0.5) { base = texture2D(uBack, uv); }
      else { base = texture2D(uFaces, vec2((uv.x + uFace) / 3.0, uv.y)); strength = 0.16; }
    }
    vec3 v = normalize(-vViewPos);
    float facing = clamp(abs(dot(n, v)), 0.0, 1.0);
    float fres = pow(1.0 - facing, 1.5);
    float band = uv.x * 1.1 + uv.y * 0.7 + uPointer.x * 0.55 - uPointer.y * 0.35 + fres * 1.6 + uTime * 0.025;
    vec3 rainbow = 0.55 + 0.45 * cos(6.28318 * (band + vec3(0.0, 0.33, 0.67)));
    float stripes = 0.6 + 0.4 * sin((uv.x - uv.y) * 70.0 + band * 9.0);
    vec2 hot = vec2(0.5) + uPointer * vec2(0.45, -0.45);
    float glare = smoothstep(0.55, 0.0, distance(uv, hot));
    float luma = dot(base.rgb, vec3(0.299, 0.587, 0.114)) / max(base.a, 0.001);
    float mask = smoothstep(0.08, 0.75, luma);
    vec3 foil = rainbow * stripes * (0.25 + 0.7 * fres + 0.5 * glare) * mask;
    vec3 col = base.rgb + (foil * strength + glare * 0.1 * strength) * base.a;
    col += uGlow * vec3(0.36, 0.95, 0.71) * 0.3 * base.a;
    gl_FragColor = vec4(col, base.a) * uOpacity;
    #include <colorspace_fragment>
  }
`;

const DUST_VERT = /* glsl */`
  attribute vec3 aDir;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aSeed;
  uniform float uBurst;
  uniform float uTime;
  uniform float uScale;
  uniform vec3 uOrigin;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    float delay = aSeed * 0.22;
    float t = clamp((uBurst - delay) / (1.0 - delay), 0.0, 1.0);
    float e = 1.0 - pow(1.0 - t, 3.0);
    vec3 p = uOrigin + aDir * aSpeed * e;
    p.y -= 0.9 * t * t;
    p += vec3(sin(uTime * 0.9 + aSeed * 20.0), cos(uTime * 0.7 + aSeed * 13.0), 0.0) * 0.05 * t;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = step(0.0001, t) * (1.0 - t) * smoothstep(0.0, 0.06, t);
    gl_PointSize = aSize * uScale * (1.0 + 0.8 * (1.0 - t)) / -mv.z;
    vSeed = aSeed;
  }
`;

const DUST_FRAG = /* glsl */`
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= a * vAlpha;
    vec3 col = mix(vec3(0.36, 0.95, 0.71), vec3(0.18, 0.9, 1.0), step(0.45, vSeed));
    col = mix(col, vec3(1.0, 0.83, 0.23), step(0.8, vSeed));
    col = mix(col, vec3(1.0), smoothstep(0.15, 0.0, d) * 0.7);
    gl_FragColor = vec4(col * a, a);
    #include <colorspace_fragment>
  }
`;

/** Texture canvas (sRGB). premultiply : alpha prémultiplié (sprites additifs : non). */
function canvasTexture(THREE, renderer, canvas, { premultiply = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.premultiplyAlpha = premultiply;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  return tex;
}

/**
 * Crée la scène dans le canvas. Rejette si WebGL est indisponible (le visuel CSS reste).
 * options : { canvas, section, vedette, faces, lite, onFirstFrame }
 * Renvoie { setTarget(p), jump(p), get progress(), handle }.
 */
export async function createBoosterScene({ canvas, section, vedette, faces, lite = false, onFirstFrame = null }) {
  const state = { target: 0, p: 0, built: false, shown: false };
  let frame = () => {};
  let fit = () => {};
  const handle = await createRenderer(canvas, {
    observe: section,
    antialias: !lite && prefs.tier === 'high',
    onFrame: (t, dt) => frame(t, dt),
    onResize: (size) => fit(size),
  });
  const { THREE, renderer } = handle;

  await ensureFonts();
  const imageUrl = vedette.image || null;
  const [cardBackTex, cardBackImg, etbTex] = await Promise.all([
    loadCardBack(renderer),
    loadImage(CARD_BACK_URL),
    imageUrl ? loadTexture(imageUrl, { renderer }).catch(() => null) : Promise.resolve(null),
  ]);

  /* ---------- Scène, caméra, rig (inclinaison au pointeur) ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, BOX.cy, 14);
  const rig = new THREE.Group();
  scene.add(rig);

  /* ---------- Textures dessinées ---------- */
  // Date lue telle qu'écrite dans data.js (heure belge), sans conversion de fuseau
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(vedette.sortie || ''));
  const dateTxt = m ? `${m[3]}.${m[2]}.${m[1]}` : '';
  const packTex = canvasTexture(THREE, renderer, packArt({ code: vedette.code || 'ME06', dateTxt, cardBack: cardBackImg, tearV: TEAR_V }));
  const faceTex = canvasTexture(THREE, renderer, faceAtlas(faces));
  const glowTex = canvasTexture(THREE, renderer, glowArt(256), { premultiply: false });
  const raysTex = canvasTexture(THREE, renderer, raysArt(lite ? 256 : 512), { premultiply: false });
  const shadowTex = canvasTexture(THREE, renderer, shadowArt(128), { premultiply: false });

  /* ---------- Rayons (derrière tout) ---------- */
  const rays = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: raysTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }),
  );
  rays.position.set(0, 0.8, -1.8);
  rays.renderOrder = 0;
  rig.add(rays);

  /* ---------- Le paquet : intérieur + corps + bande détachable ---------- */
  const shared = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uCharge: { value: 0 },
    uOpacity: { value: 1 },
    uOpen: { value: 0 },
    uTearV: { value: TEAR_V },
    uBulge: { value: 0.2 },
    uMap: { value: packTex },
  };
  const packMat = (part, own = {}) => new THREE.ShaderMaterial({
    uniforms: { ...shared, uPart: { value: part }, ...own },
    vertexShader: PACK_VERT,
    fragmentShader: PACK_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    side: part === 0 ? THREE.FrontSide : THREE.DoubleSide,
  });
  const packGeo = new THREE.PlaneGeometry(PW, PH, lite ? 16 : 24, lite ? 28 : 44);
  const pack = new THREE.Group();
  pack.position.set(0, PACK_Y, 0);
  rig.add(pack);
  const inner = new THREE.Mesh(packGeo, packMat(2));
  const body = new THREE.Mesh(packGeo, packMat(0));
  const stripPivot = new THREE.Group();
  stripPivot.position.set(-PW / 2, TEAR_Y, 0);
  const stripOpacity = { value: 1 };
  const strip = new THREE.Mesh(packGeo, packMat(1, { uOpacity: stripOpacity }));
  strip.position.set(PW / 2, -TEAR_Y, 0);
  stripPivot.add(strip);
  inner.renderOrder = 1;
  body.renderOrder = 4;
  strip.renderOrder = 4;
  pack.add(inner, body, stripPivot);

  /* ---------- Les cartes ---------- */
  const cardGeo = cardGeometry(THREE, { width: CW, height: CH, radius: 0.075 });
  const cards = [];
  for (let i = 0; i < N_CARDS; i++) {
    const k = i - (N_CARDS - 1) / 2;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uBack: { value: cardBackTex },
        uFaces: { value: faceTex },
        uFace: { value: FACE_OF[i] ?? -1 },
        uTime: shared.uTime,
        uPointer: shared.uPointer,
        uOpacity: { value: 1 },
        uGlow: { value: 0 },
      },
      vertexShader: CARD_VERT,
      fragmentShader: CARD_FRAG,
      transparent: true,
      premultipliedAlpha: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(cardGeo, mat);
    mesh.renderOrder = 2;
    mesh.visible = false;
    rig.add(mesh);
    // Pose finale (voir FINAL), légèrement tournée vers le centre
    const f = FINAL[i];
    const final = {
      x: Math.sin(f.a) * f.R, y: f.py + Math.cos(f.a) * f.R, z: f.z, s: f.s,
      rx: 0, ry: -k * 0.09 + (FACE_OF[i] !== undefined ? Math.PI : 0), rz: -f.a,
    };
    const apex = { x: k * 0.45, y: 2.4 + (3 - Math.abs(k)) * 0.1, z: 0.45 + (3 - Math.abs(k)) * 0.06 };
    cards.push({ mesh, mat, k, i, final, apex, delay: [3, 2, 4, 1, 5, 0, 6].indexOf(i) * 0.03 });
  }

  /* ---------- Halo d'ouverture, poussière ---------- */
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }),
  );
  glow.renderOrder = 3;
  rig.add(glow);

  const COUNT = lite ? 70 : 170;
  const dustGeo = new THREE.BufferGeometry();
  const dir = new Float32Array(COUNT * 3);
  const speed = new Float32Array(COUNT);
  const size = new Float32Array(COUNT);
  const seed = new Float32Array(COUNT);
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  for (let i = 0; i < COUNT; i++) {
    const v = new THREE.Vector3((rnd() * 2 - 1) * 1.3, 0.35 + rnd() * 1.2, (rnd() * 2 - 1) * 0.6 + 0.2).normalize();
    dir.set([v.x, v.y, v.z], i * 3);
    speed[i] = 1.2 + rnd() * 2.6;
    size[i] = 0.03 + rnd() * rnd() * 0.09;
    seed[i] = rnd();
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  dustGeo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  dustGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  dustGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 8);
  const dustMat = new THREE.ShaderMaterial({
    uniforms: {
      uBurst: { value: 0 }, uTime: shared.uTime, uScale: { value: 400 },
      uOrigin: { value: new THREE.Vector3(0, PACK_Y + TEAR_Y, 0.1) },
    },
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.renderOrder = 5;
  dust.frustumCulled = false;
  rig.add(dust);

  /* ---------- La vraie photo du coffret + son ombre ---------- */
  let etb = null;
  let etbMat = null;
  const etbShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 }),
  );
  etbShadow.renderOrder = 6;
  etbShadow.visible = false;
  rig.add(etbShadow);
  if (etbTex) {
    etbMat = createFoilMaterial(THREE, { map: etbTex, strength: 0.14, mask: 'luma', opacity: 0 });
    etb = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), etbMat);
    etb.renderOrder = 7;
    etb.visible = false;
    rig.add(etb);
  }

  /* ---------- Pointeur (souris uniquement) ---------- */
  const pointer = prefs.finePointer && !lite ? trackPointer(section) : null;

  /* ---------- Cadrage : la zone BOX tient toujours dans le canvas ---------- */
  fit = (sz) => {
    if (!sz.width || !sz.height) return;
    const aspect = sz.width / sz.height;
    const tan = Math.tan((FOV * Math.PI) / 360);
    camera.aspect = aspect;
    camera.position.z = Math.max(BOX.halfH / tan, BOX.halfW / (tan * aspect));
    camera.updateProjectionMatrix();
    dustMat.uniforms.uScale.value = (sz.height * sz.dpr) / (2 * tan);
  };
  fit(handle.size);

  /* ---------- Image par image ---------- */
  const tmp = new THREE.Vector3();
  frame = (t, dt) => {
    // Lissage de la progression (inertie, indépendant de la fréquence d'images)
    const k = dt > 0 ? 1 - Math.exp(-dt * 9) : 1;
    state.p += (state.target - state.p) * k;
    if (Math.abs(state.target - state.p) < 0.0004) state.p = state.target;
    const p = state.p;
    shared.uTime.value = t;

    // Pointeur
    let px = 0, py = 0;
    if (pointer) { pointer.update(0.06); px = pointer.x; py = pointer.y; }
    else { px = Math.sin(t * 0.35) * 0.35; py = Math.cos(t * 0.27) * 0.2; }
    shared.uPointer.value.set(px, py);
    rig.rotation.y = px * 0.16;
    rig.rotation.x = py * 0.07;

    // Phases
    const charge = seg(p, 0.02, 0.3);
    const tear = seg(p, 0.26, 0.42);
    const flashIn = seg(p, 0.27, 0.4);
    const flashOut = seg(p, 0.4, 0.72);
    const sink = seg(p, 0.55, 0.76);
    const rise = seg(p, 0.66, 0.94);
    const settle = seg(p, 0.85, 1);

    // --- Paquet ---
    const c = inOut(charge);
    const shake = charge ** 3 * (1 - tear) * 0.03;
    pack.position.x = Math.sin(t * 53) * shake;
    // Sortie : le paquet recule dans la lumière en s'effaçant (jamais coupé par le bord)
    pack.position.y = PACK_Y + Math.sin(t * 1.2) * 0.06 * (1 - sink) - in2(sink) * 1.6;
    pack.position.z = c * 0.25 - inOut(sink) * 2.4;
    pack.rotation.y = lerp(-0.42 + Math.sin(t * 0.5) * 0.06, -0.06, c) + sink * 0.2;
    pack.rotation.z = lerp(0.08 + Math.sin(t * 0.7) * 0.02, 0, c) + Math.sin(t * 47) * shake * 0.6 - sink * 0.28;
    pack.rotation.x = -0.05 * c + sink * 0.25;
    pack.scale.setScalar(1.14 - 0.08 * c);
    shared.uCharge.value = c * (1 - tear);
    shared.uOpen.value = out3(seg(p, 0.33, 0.5));
    shared.uOpacity.value = 1 - seg(sink, 0.1, 0.62);
    pack.visible = shared.uOpacity.value > 0.001;

    // Bande déchirée : pivote autour de son extrémité gauche, puis s'envole
    const tr = in2(tear);
    const fly = in2(seg(tear, 0.35, 1));
    stripPivot.rotation.z = tr * 0.55 + fly * 1.4;
    stripPivot.rotation.x = -fly * 2.2;
    stripPivot.position.set(-PW / 2 + fly * 2.6, TEAR_Y + tr * 0.12 + fly * 2.2, fly * 1.2);
    stripOpacity.value = (1 - seg(tear, 0.8, 1)) * shared.uOpacity.value;
    strip.visible = tear < 1;

    // Bouche du paquet (repère du rig) pour le halo
    pack.updateMatrix();
    tmp.set(0, TEAR_Y - 0.05, -0.02).applyMatrix4(pack.matrix);

    // --- Halo, rayons, poussière ---
    const flash = out3(flashIn) * (1 - 0.62 * inOut(flashOut));
    const back = inOut(seg(p, 0.5, 0.86));
    glow.position.set(lerp(tmp.x, 0, back), lerp(tmp.y, 0.9, back), lerp(tmp.z, -1.3, back));
    glow.scale.setScalar(0.6 + c * 0.8 + flashIn * 4.2 + back * 3.2);
    glow.material.opacity = Math.max(c * 0.35 * (1 - tear), flash);
    glow.visible = glow.material.opacity > 0.002;
    rays.scale.setScalar(7.5 + flashIn * 2);
    rays.rotation.z = t * 0.05;
    rays.material.opacity = 0.12 * c * (1 - flashIn) + flash * 0.85;
    rays.visible = rays.material.opacity > 0.002;
    dustMat.uniforms.uBurst.value = seg(p, 0.3, 0.88);
    dust.visible = p > 0.3 && p < 0.88;

    // --- Cartes ---
    for (const card of cards) {
      const u0 = seg(p, 0.36 + card.delay, 0.74 + card.delay * 0.4);
      const u = out3(u0);
      const { mesh, final: F, apex: A, k: kk } = card;
      mesh.visible = u0 > 0;
      if (!mesh.visible) continue;
      // Départ : dans le paquet (repère du paquet → repère du rig)
      tmp.set(kk * 0.03, -0.5, -0.035 - card.i * 0.004).applyMatrix4(pack.matrix);
      const a = 1 - u, b = u;
      mesh.position.set(
        a * a * tmp.x + 2 * a * b * A.x + b * b * F.x,
        a * a * tmp.y + 2 * a * b * A.y + b * b * F.y + Math.sin(t * 0.8 + card.i) * 0.03 * settle,
        a * a * tmp.z + 2 * a * b * A.z + b * b * F.z,
      );
      const spin = Math.sin(u * Math.PI);
      const flip = FACE_OF[card.i] !== undefined ? inOut(seg(p, 0.66 + FACE_OF[card.i] * 0.045, 0.84 + FACE_OF[card.i] * 0.045)) : 0;
      mesh.rotation.set(
        lerp(pack.rotation.x, F.rx, u) - spin * 0.5,
        lerp(pack.rotation.y, F.ry - (FACE_OF[card.i] !== undefined ? Math.PI : 0), u) + flip * Math.PI,
        lerp(pack.rotation.z, F.rz, backOut(u0, 1.2)) + spin * kk * 0.12,
      );
      mesh.scale.setScalar(lerp(0.92, F.s, u));
      card.mat.uniforms.uGlow.value = spin * flash;
    }

    // --- Photo réelle du coffret ---
    if (etb) {
      const r = out3(rise);
      etb.visible = rise > 0;
      etb.position.set(0, lerp(-2.5, -1.45, r) + Math.sin(t * 0.9) * 0.035 * settle, 0.9);
      etb.rotation.set(0, (1 - r) * 0.45 + px * 0.06, (1 - r) * -0.12);
      etb.scale.setScalar(lerp(0.72, 1, backOut(rise, 1.1)));
      etbMat.uniforms.uOpacity.value = in2(seg(rise, 0, 0.5));
      etbMat.uniforms.uTime.value = t;
      etbMat.uniforms.uPointer.value.set(px, py);
      etbShadow.visible = rise > 0;
      etbShadow.position.set(0, -2.95, 0.8);
      etbShadow.scale.set(3.6 * lerp(0.6, 1, r), 0.7, 1);
      etbShadow.material.opacity = 0.75 * r;
    }

    // Caméra : très léger travelling avant à la révélation
    camera.position.y = BOX.cy + inOut(seg(p, 0.55, 1)) * -0.1;
    camera.lookAt(0, BOX.cy, 0);

    if (!state.shown) {
      state.shown = true;
      requestAnimationFrame(() => onFirstFrame?.());
    }
  };

  handle.scene = scene;
  handle.camera = camera;
  state.built = true;
  if (!handle.running) handle.renderOnce();

  return {
    handle,
    /** Cible de progression (0 → 1) : la scène la rejoint avec inertie. */
    setTarget(p) { state.target = clamp(p, 0, 1); if (!handle.running) handle.start(); },
    /** Saute directement à une progression (sans inertie). */
    jump(p) { state.target = state.p = clamp(p, 0, 1); if (!handle.running) handle.renderOnce(); },
    get progress() { return state.p; },
  };
}
