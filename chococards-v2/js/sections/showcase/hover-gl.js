/* ==========================================================================
   Survol WebGL des photos produits (étagères) — UN seul canvas partagé
   --------------------------------------------------------------------------
   Desktop + souris uniquement, jamais en mouvement réduit ni sans WebGL.
   Au survol d'une carte qui a une vraie photo détourée, le canvas unique est
   déplacé DANS la carte (il suit donc le défilement et l'inclinaison sans
   calcul) et redessine la photo avec :
     - une loupe douce qui suit le pointeur + une onde à l'entrée
     - une aberration chromatique liée à la vitesse du pointeur
     - un reflet holographique en bande diagonale
     - l'ombre portée (identique au drop-shadow CSS) pour un échange invisible
   L'image HTML est masquée pendant le survol puis réaffichée : sans WebGL,
   le survol CSS (lift + reflet) reste. Le rendu s'arrête dès que l'effet
   est retombé (aucune boucle au repos).
   ========================================================================== */

import { prefs } from '../../core/motion.js';
import { createRenderer, loadTexture } from '../../core/webgl.js';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */`
  uniform sampler2D uTex;
  uniform vec2 uPointer;
  uniform vec2 uVel;
  uniform float uHover;
  uniform float uTime;
  uniform float uRipple;
  uniform float uBox;
  uniform float uPad;
  varying vec2 vUv;

  // Cadre de la photo : même marge (padding 9 %) et même « lift » que le CSS
  vec2 toImg(vec2 uv, float lift) {
    float sc = 1.0 + 0.04 * lift;
    vec2 off = vec2(0.0, 4.0 / uBox) * lift;
    vec2 p = (uv - 0.5 - off) / sc + 0.5;
    return (p - uPad) / (1.0 - 2.0 * uPad);
  }
  vec4 tex(vec2 p) {
    if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) return vec4(0.0);
    return texture2D(uTex, p);
  }
  // Lecture floue via les mipmaps (biais de niveau) : ombre douce sans dizaines d'échantillons
  float alphaBlur(vec2 p, float bias) {
    if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) return 0.0;
    return texture2D(uTex, p, bias).a;
  }

  void main() {
    float h = uHover;
    vec2 d = vUv - uPointer;
    float r = length(d);

    // Loupe douce + onde d'entrée
    float lens = smoothstep(0.34, 0.0, r) * h;
    vec2 uv = vUv - d * lens * 0.16;
    float t = uRipple;
    float ring = exp(-pow((r - t * 0.6) / 0.06, 2.0)) * exp(-t * 2.4) * h;
    uv += (r > 0.0001 ? d / r : vec2(0.0)) * ring * 0.02;

    // Aberration chromatique : vitesse du pointeur + bord de la loupe
    vec2 ca = clamp(uVel * 0.010, vec2(-0.014), vec2(0.014)) + d * lens * 0.035;
    vec4 cg = tex(toImg(uv, h));
    vec4 cr = tex(toImg(uv + ca, h));
    vec4 cb = tex(toImg(uv - ca, h));
    float a = max(cg.a, max(cr.a, cb.a));
    vec3 col = vec3(cr.r, cg.g, cb.b);

    // Reflet holographique (bande diagonale qui passe par le pointeur)
    vec2 dir = normalize(vec2(0.8, -0.6));
    float band = smoothstep(0.42, 0.0, abs(dot(d, dir)));
    float hue = dot(vUv, vec2(0.9, 0.6)) * 1.4 + uPointer.x * 0.9 + uTime * 0.04;
    vec3 rainbow = 0.55 + 0.45 * cos(6.28318 * (hue + vec3(0.0, 0.33, 0.67)));
    float luma = dot(cg.rgb, vec3(0.299, 0.587, 0.114)) / max(cg.a, 0.001);
    vec3 holo = rainbow * band * (0.25 + 0.5 * smoothstep(0.2, 0.9, luma)) * 0.42 * h;
    col = col + holo * (vec3(a) - col);

    // Ombre portée : drop-shadow(0 18px 22px rgb(14 10 36 / .35)), un peu plus haute au survol
    vec2 so = vec2(0.0, (18.0 + 10.0 * h) / uBox);
    float sr = (11.0 + 5.0 * h) / uBox;
    vec2 sp = vUv + so;
    float bias = 4.0;
    float sa = alphaBlur(toImg(sp, h), bias) * 0.36
      + (alphaBlur(toImg(sp + vec2(sr, 0.0), h), bias) + alphaBlur(toImg(sp - vec2(sr, 0.0), h), bias)
      + alphaBlur(toImg(sp + vec2(0.0, sr), h), bias) + alphaBlur(toImg(sp - vec2(0.0, sr), h), bias)) * 0.16;
    sa *= 0.35 + 0.08 * h;
    vec3 shadow = vec3(0.0044, 0.0030, 0.0176); // #0E0A24 en linéaire

    gl_FragColor = vec4(col, a) + vec4(shadow * sa, sa) * (1.0 - a);
    #include <colorspace_fragment>
  }
`;

export function initHoverGL(tracks) {
  if (!tracks.length || prefs.reduced || !prefs.finePointer || !prefs.desktop) return;

  let canvas = null;
  let handle = null;
  let uniforms = null;
  let booting = null;
  let failed = false;
  let current = null;       // carte qui porte le canvas
  let hoverTarget = 0;
  let hover = 0;
  const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0 };

  function onFrame(t, dt) {
    if (!uniforms) return;
    const k = 1 - Math.exp(-dt * 7);
    hover += (hoverTarget - hover) * k;
    const px = ptr.x;
    const py = ptr.y;
    const kp = 1 - Math.exp(-dt * 14);
    ptr.x += (ptr.tx - ptr.x) * kp;
    ptr.y += (ptr.ty - ptr.y) * kp;
    if (dt > 0) {
      ptr.vx += ((ptr.x - px) / dt - ptr.vx) * 0.2;
      ptr.vy += ((ptr.y - py) / dt - ptr.vy) * 0.2;
    }
    uniforms.uHover.value = hover;
    uniforms.uTime.value = t;
    uniforms.uRipple.value += dt;
    uniforms.uPointer.value.set(ptr.x, ptr.y);
    uniforms.uVel.value.set(ptr.vx, ptr.vy);
    // Effet retombé : on rend la main à l'image HTML et on coupe la boucle
    if (hoverTarget === 0 && hover < 0.004) {
      hover = 0;
      uniforms.uHover.value = 0;
      current?.classList.remove('is-gl');
      handle?.stop();
    }
  }

  function boot() {
    if (booting || failed) return booting;
    canvas = document.createElement('canvas');
    canvas.className = 'show-gl';
    canvas.setAttribute('aria-hidden', 'true');
    booting = createRenderer(canvas, { dprMax: 1.5, antialias: false, onFrame })
      .then((h) => {
        const { THREE } = h;
        uniforms = {
          uTex: { value: null },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uVel: { value: new THREE.Vector2(0, 0) },
          uHover: { value: 0 },
          uTime: { value: 0 },
          uRipple: { value: 0 },
          uBox: { value: 280 },
          uPad: { value: 0.09 },
        };
        const mat = new THREE.ShaderMaterial({
          uniforms, vertexShader: VERT, fragmentShader: FRAG,
          transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
        });
        const scene = new THREE.Scene();
        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
        h.scene = scene;
        h.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        h.stop();
        handle = h;
        return h;
      })
      .catch(() => { failed = true; canvas?.remove(); return null; });
    return booting;
  }

  const photoOf = (card) => card.querySelector('.pcard__img:not(.pcard__img--fill)');

  /** Position du pointeur dans le cadre de la photo (0–1, y vers le haut). */
  function aim(card, e, jump = false) {
    const r = card.querySelector('.pcard__visual').getBoundingClientRect();
    ptr.tx = (e.clientX - r.left) / r.width;
    ptr.ty = 1 - (e.clientY - r.top) / r.height;
    if (jump) { ptr.x = ptr.tx; ptr.y = ptr.ty; ptr.vx = 0; ptr.vy = 0; }
  }

  async function enter(card, e) {
    const img = photoOf(card);
    if (!img || failed) return;
    if (current && current !== card) current.classList.remove('is-gl');
    const fresh = current !== card || hover < 0.05;
    current = card;
    aim(card, e, fresh);
    hoverTarget = 1;
    const h = await boot();
    if (!h || current !== card || hoverTarget === 0) return;
    let tex;
    try {
      tex = await loadTexture(img.currentSrc || img.src, { renderer: h.renderer, premultiply: true });
    } catch { return; }
    if (current !== card || hoverTarget === 0) return;
    const visual = card.querySelector('.pcard__visual');
    if (canvas.parentElement !== visual) visual.appendChild(canvas);
    uniforms.uTex.value = tex;
    uniforms.uBox.value = visual.clientWidth || 280;
    uniforms.uRipple.value = 0;
    hover = Math.min(hover, 0.05);
    card.classList.add('is-gl');
    requestAnimationFrame(() => h.start());
  }

  function leave(card) {
    if (current !== card) return;
    hoverTarget = 0;
    handle?.start();
  }

  tracks.forEach((track) => {
    // Three.js se prépare dès que la souris approche de l'étagère
    track.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') boot(); });
    track.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const media = e.target.closest('.pcard__media');
      const card = media && media.closest('.pcard.has-photo:not([data-statut="rupture"])');
      if (card && !media.contains(e.relatedTarget)) enter(card, e);
    });
    track.addEventListener('pointerout', (e) => {
      const media = e.target.closest('.pcard__media');
      const card = media && media.closest('.pcard.has-photo:not([data-statut="rupture"])');
      if (card && !media.contains(e.relatedTarget)) leave(card);
    });
    track.addEventListener('pointermove', (e) => {
      if (!current || e.pointerType !== 'mouse') return;
      aim(current, e);
    }, { passive: true });
  });
}
