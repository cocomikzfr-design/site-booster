/* ==========================================================================
   Hero · textures dessinées à la volée (canvas 2D, aucune image en plus)
   --------------------------------------------------------------------------
   - photoShadow(img)  : ombre portée floue d'un détouré (reprend son alpha),
                         équivalent de filter: drop-shadow(0 28px 34px …) du poster CSS.
   - cardShadow()      : ombre d'un dos de carte (box-shadow 0 24px 40px -18px).
   - glow()            : halo violet → cyan derrière le paquet (comme .deck__glow).
   - faceTrente()      : recto de la carte centrale qui se retourne à la sortie
                         du hero : « 30 ans » typographique, matériel de marque
                         ChocoCards (aucun logo ni personnage de licence).
   Le flou est un flou gaussien approché (3 passes de flou boîte sur l'alpha) :
   pas besoin de ctx.filter (absent de Safari < 18).
   ========================================================================== */

/** Flou boîte séparable (3 passes ≈ gaussien) sur un tableau d'alpha w×h. */
function blurAlpha(a, w, h, sigma) {
  const passes = 3;
  // Rayon de boîte équivalent pour 3 passes : σ² = n (r² + r) / 3
  const r = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / passes + 1) / 2 - 0.5));
  const tmp = new Float32Array(w * h);
  const line = (src, dst, len, stride, offset) => {
    let acc = 0;
    const norm = 1 / (2 * r + 1);
    for (let i = -r; i <= r; i++) acc += src[offset + Math.min(len - 1, Math.max(0, i)) * stride];
    for (let i = 0; i < len; i++) {
      dst[offset + i * stride] = acc * norm;
      const add = Math.min(len - 1, i + r + 1);
      const sub = Math.max(0, i - r);
      acc += src[offset + add * stride] - src[offset + sub * stride];
    }
  };
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) line(a, tmp, w, 1, y * w);
    for (let x = 0; x < w; x++) line(tmp, a, h, w, x);
  }
  return a;
}

/** Convertit un tableau d'alpha en canvas noir semi-transparent. */
function alphaToCanvas(a, w, h, strength = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    img.data[i * 4 + 3] = Math.min(255, Math.round(a[i] * 255 * strength));
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Ombre d'un détouré. La texture renvoyée couvre (1 + 2·pad) fois la boîte de l'image :
 * le plan d'ombre doit être agrandi d'autant (scale = 1 + 2·pad).
 * sigmaRatio : écart-type du flou rapporté à la largeur de la boîte (34 px de flou CSS ≈ σ 17 px).
 */
export function photoShadow(img, { size = 128, pad = 0.25, sigmaRatio = 0.046 } = {}) {
  const full = Math.round(size * (1 + 2 * pad));
  const off = Math.round(size * pad);
  const c = document.createElement('canvas');
  c.width = full; c.height = full;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, off, off, size, size);
  const data = ctx.getImageData(0, 0, full, full).data;
  const a = new Float32Array(full * full);
  for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3] / 255;
  blurAlpha(a, full, full, Math.max(1, sigmaRatio * size));
  return { canvas: alphaToCanvas(a, full, full), scale: 1 + 2 * pad };
}

/** Ombre d'un dos de carte (rectangle arrondi rétréci puis flou). */
export function cardShadow({ w = 100, pad = 0.42 } = {}) {
  const h = Math.round(w * 1.4);
  const fw = Math.round(w * (1 + 2 * pad));
  const fh = Math.round(h + w * 2 * pad);
  const c = document.createElement('canvas');
  c.width = fw; c.height = fh;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const spread = w * 0.095; // -18 px sur une carte de ~190 px
  const x = w * pad + spread, y = w * pad + spread;
  const rw = w - 2 * spread, rh = h - 2 * spread;
  const r = w * 0.06;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + rw, y, x + rw, y + rh, r);
  ctx.arcTo(x + rw, y + rh, x, y + rh, r);
  ctx.arcTo(x, y + rh, x, y, r);
  ctx.arcTo(x, y, x + rw, y, r);
  ctx.fill();
  const data = ctx.getImageData(0, 0, fw, fh).data;
  const a = new Float32Array(fw * fh);
  for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3] / 255;
  blurAlpha(a, fw, fh, w * 0.105);
  return { canvas: alphaToCanvas(a, fw, fh), scaleX: fw / w, scaleY: fh / h };
}

/** Halo radial (même dégradé que .deck__glow, en couleurs prémultipliées). */
export function glow(size = 256) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(139,108,255,.55)');
  g.addColorStop(0.55, 'rgba(46,230,255,.18)');
  g.addColorStop(0.75, 'rgba(46,230,255,0)');
  g.addColorStop(1, 'rgba(46,230,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/** Petite étincelle douce pour les particules (disque flou blanc). */
export function sparkle(size = 64) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Recto « 30 ans » (500 × 700, mêmes proportions que le dos de carte).
 * Fond encre (sombre : un texte qui passe devant garde son contraste),
 * bordure holo, grand « 30 » doré, mentions en mono. Matériel de marque uniquement.
 */
export function faceTrente() {
  const W = 500, H = 700;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Bordure holographique
  const holo = ctx.createLinearGradient(0, 0, W, H);
  [['#B9A8FF', 0], ['#2EE6FF', 0.22], ['#5CF2B5', 0.42], ['#FFD43B', 0.6], ['#FF8AC8', 0.8], ['#B9A8FF', 1]]
    .forEach(([col, o]) => holo.addColorStop(o, col));
  roundRect(ctx, 0, 0, W, H, 30);
  ctx.fillStyle = holo;
  ctx.fill();

  // Fond encre
  const fond = ctx.createLinearGradient(0, 0, W, H);
  fond.addColorStop(0, '#241D52');
  fond.addColorStop(0.55, '#140F36');
  fond.addColorStop(1, '#0B0820');
  roundRect(ctx, 14, 14, W - 28, H - 28, 22);
  ctx.fillStyle = fond;
  ctx.fill();

  // Filet intérieur doré
  roundRect(ctx, 34, 34, W - 68, H - 68, 16);
  ctx.strokeStyle = 'rgba(240,190,78,.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Rayons fins (texture « foil » gravée)
  ctx.save();
  roundRect(ctx, 34, 34, W - 68, H - 68, 16);
  ctx.clip();
  ctx.translate(W / 2, H * 0.44);
  ctx.strokeStyle = 'rgba(255,212,59,.08)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 48; i++) {
    ctx.rotate((Math.PI * 2) / 48);
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(0, 520);
    ctx.stroke();
  }
  ctx.restore();

  // Mentions mono
  const mono = "'Geist Mono', ui-monospace, Menlo, monospace";
  const display = "'Unbounded', 'Arial Black', Arial, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#DDD8F3';
  ctx.font = `600 22px ${mono}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
  ctx.fillText('ÉDITION ANNIVERSAIRE', W / 2, 92);

  // Grand « 30 » doré en contour (comme le chiffre de la section anniversaire) : peu de pixels
  // clairs, le mot-symbole holo qui passe devant pendant la sortie garde son contraste
  const or = ctx.createLinearGradient(0, 170, 0, 470);
  or.addColorStop(0, '#FFE9A3');
  or.addColorStop(0.45, '#F0BE4E');
  or.addColorStop(1, '#C08A1E');
  if ('letterSpacing' in ctx) ctx.letterSpacing = '-10px';
  ctx.font = `800 268px ${display}`;
  ctx.fillStyle = 'rgba(240,190,78,.1)';
  ctx.fillText('30', W / 2 - 4, 440);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = or;
  ctx.strokeText('30', W / 2 - 4, 440);

  if ('letterSpacing' in ctx) ctx.letterSpacing = '22px';
  ctx.font = `700 54px ${display}`;
  ctx.fillStyle = '#FBF7EE';
  ctx.fillText('ANS', W / 2 + 11, 530);

  // Pied : signature ChocoCards
  if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
  ctx.font = `600 20px ${mono}`;
  ctx.fillStyle = '#DDD8F3';
  ctx.fillText('CHOCOCARDS · NIVELLES', W / 2, 628);
  ctx.fillStyle = 'rgba(240,190,78,.9)';
  ctx.beginPath();
  ctx.arc(W / 2, 584, 5, 0, Math.PI * 2);
  ctx.fill();
  return c;
}
