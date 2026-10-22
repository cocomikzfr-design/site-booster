/* ==========================================================================
   Booster · textures dessinées à la volée (canvas 2D)
   --------------------------------------------------------------------------
   Tout est du MATÉRIEL DE MARQUE ChocoCards (aucun logo ni personnage de licence) :
   - packArt()   : recto du booster ChocoCards (feuille holo, fenêtre avec le dos
                   de carte, pastille du code d'extension, ligne « Ouvrir ici »).
   - faceAtlas() : 3 cartes typographiques qui se retournent (J-…, date, code).
   - glowArt(), raysArt(), shadowArt() : halo, rayons et ombre douce.
   Les polices viennent du site (Unbounded, Geist Mono, Instrument Serif) :
   ensureFonts() attend qu'elles soient prêtes avant de dessiner.
   ========================================================================== */

const C = {
  encre: '#0E0A24', encre2: '#17123A', encre3: '#241D52', papier: '#FBF7EE', brume: '#DDD8F3',
  violet: '#8B6CFF', violetInk: '#5A3FE0', cyan: '#2EE6FF', menthe: '#5CF2B5', citron: '#FFD43B',
  rose: '#FF5DB1', roseClair: '#FF8AC8', lilas: '#D9CEFF', lilasVif: '#B9A8FF', tealInk: '#0A7470',
};
const F = {
  display: '"Unbounded", "Arial Black", Arial, sans-serif',
  mono: '"Geist Mono", ui-monospace, Menlo, Consolas, monospace',
  serif: '"Instrument Serif", "Times New Roman", serif',
};

/** Attend les polices utilisées dans les textures (au plus 2,5 s). */
export async function ensureFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const loads = [
    '800 100px "Unbounded"', '700 40px "Unbounded"', '600 30px "Geist Mono"', 'italic 400 60px "Instrument Serif"',
  ].map((f) => document.fonts.load(f).catch(() => null));
  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]);
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

/** Rectangle arrondi (repli si roundRect n'existe pas). */
function roundRect(x, X, Y, W, H, r) {
  x.beginPath();
  if (x.roundRect) { x.roundRect(X, Y, W, H, r); return; }
  x.moveTo(X + r, Y);
  x.arcTo(X + W, Y, X + W, Y + H, r);
  x.arcTo(X + W, Y + H, X, Y + H, r);
  x.arcTo(X, Y + H, X, Y, r);
  x.arcTo(X, Y, X + W, Y, r);
  x.closePath();
}

function holoGradient(x, x0, y0, x1, y1, stops = [C.lilasVif, C.cyan, C.menthe, C.citron, C.roseClair]) {
  const g = x.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
  return g;
}

/** Texte ajusté à une largeur maximale (réduit la taille si besoin). */
function fitText(x, text, maxW, size, font, weight = 800, style = '') {
  let s = size;
  do {
    x.font = `${style} ${weight} ${s}px ${font}`.trim();
    if (x.measureText(text).width <= maxW) break;
    s -= 2;
  } while (s > 10);
  return s;
}

/** Espacement des lettres (letterSpacing si disponible, sinon rien). */
function tracking(x, px) {
  if ('letterSpacing' in x) x.letterSpacing = `${px}px`;
}

/* --------------------------------------------------------------------------
   Recto du booster ChocoCards — 512 × 832 (proportions du paquet 1,9 × 3,1).
   Le haut du canvas = le haut du paquet. La ligne de déchirure est à v = tearV
   (coordonnée UV depuis le bas), soit y = (1 - tearV) × 832.
   -------------------------------------------------------------------------- */
export function packArt({ code = 'ME06', dateTxt = '', cardBack = null, tearV = 0.87 } = {}) {
  const W = 512, H = 832;
  const [c, x] = makeCanvas(W, H);
  const tearY = Math.round((1 - tearV) * H);

  // 1. Feuille holographique (base claire : le shader ajoute l'arc-en-ciel)
  x.fillStyle = holoGradient(x, 0, 0, W, H);
  x.fillRect(0, 0, W, H);
  // Voile nacré + fines diagonales (grain de feuille métallisée)
  const sheen = x.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, 'rgba(255,255,255,.28)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
  sheen.addColorStop(1, 'rgba(14,10,36,.18)');
  x.fillStyle = sheen; x.fillRect(0, 0, W, H);
  x.save();
  x.globalAlpha = 0.07; x.strokeStyle = C.encre; x.lineWidth = 1;
  for (let i = -H; i < W; i += 9) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); }
  x.restore();

  // 2. Bandes serties (haut et bas) : stries horizontales
  const crimp = (y0, y1) => {
    x.save();
    x.fillStyle = 'rgba(14,10,36,.16)'; x.fillRect(0, y0, W, y1 - y0);
    for (let y = y0 + 2; y < y1; y += 6) {
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, y, W, 2);
      x.fillStyle = 'rgba(14,10,36,.22)'; x.fillRect(0, y + 2, W, 1.5);
    }
    x.restore();
  };
  crimp(0, 62);
  crimp(H - 62, H);

  // 3. Bandeau au-dessus de la déchirure + ligne pointillée « Ouvrir ici »
  x.save();
  x.fillStyle = C.encre;
  x.font = `600 15px ${F.mono}`; tracking(x, 3);
  x.textBaseline = 'middle';
  x.fillText('CHOCOCARDS · BOOSTER', 30, tearY - 22);
  x.textAlign = 'right';
  x.fillText('OUVRIR ICI ›', W - 30, tearY - 22);
  x.setLineDash([10, 7]); x.lineWidth = 2.5; x.strokeStyle = 'rgba(14,10,36,.75)';
  x.beginPath(); x.moveTo(14, tearY); x.lineTo(W - 14, tearY); x.stroke();
  x.restore();

  // 4. Wordmark ChocoCards
  x.save();
  x.fillStyle = C.encre; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  tracking(x, -2);
  fitText(x, 'ChocoCards', W - 70, 58, F.display, 800);
  x.fillText('ChocoCards', W / 2, tearY + 78);
  x.restore();

  // 5. Fenêtre encre avec le dos de carte (et une deuxième carte qui dépasse)
  const wx = 56, wy = tearY + 104, ww = W - 112, wh = 392;
  x.save();
  roundRect(x, wx, wy, ww, wh, 28);
  x.fillStyle = C.encre; x.fill();
  x.clip();
  const glow = x.createRadialGradient(W / 2, wy + wh * 0.45, 10, W / 2, wy + wh * 0.45, wh * 0.7);
  glow.addColorStop(0, 'rgba(92,242,181,.55)');
  glow.addColorStop(0.5, 'rgba(46,230,255,.16)');
  glow.addColorStop(1, 'rgba(46,230,255,0)');
  x.fillStyle = glow; x.fillRect(wx, wy, ww, wh);
  // Petits carrés de la « tablette » en fond (2 × 3)
  x.globalAlpha = 0.22;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
    roundRect(x, wx + 24 + i * (ww - 48) / 2 + 6, wy + 22 + j * (wh - 44) / 3 + 6, (ww - 48) / 2 - 12, (wh - 44) / 3 - 12, 14);
    x.fillStyle = C.encre3; x.fill();
  }
  x.globalAlpha = 1;
  const drawCard = (cx, cy, rot, scale, alpha) => {
    const cw = 190 * scale, ch = 266 * scale;
    x.save();
    x.translate(cx, cy); x.rotate(rot); x.globalAlpha = alpha;
    x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 24; x.shadowOffsetY = 12;
    if (cardBack) {
      roundRect(x, -cw / 2, -ch / 2, cw, ch, 12 * scale);
      x.fillStyle = C.encre2; x.fill();
      x.shadowColor = 'transparent';
      x.save(); roundRect(x, -cw / 2, -ch / 2, cw, ch, 12 * scale); x.clip();
      x.drawImage(cardBack, -cw / 2, -ch / 2, cw, ch);
      x.restore();
    } else {
      roundRect(x, -cw / 2, -ch / 2, cw, ch, 12 * scale);
      x.fillStyle = holoGradient(x, -cw / 2, -ch / 2, cw / 2, ch / 2); x.fill();
    }
    x.restore();
  };
  drawCard(W / 2 + 62, wy + wh / 2 + 6, 0.16, 0.92, 0.85);
  drawCard(W / 2 - 18, wy + wh / 2 + 4, -0.07, 1, 1);
  x.restore();
  // Liseré holo de la fenêtre
  x.save();
  roundRect(x, wx, wy, ww, wh, 28);
  x.lineWidth = 4; x.strokeStyle = 'rgba(251,247,238,.85)'; x.stroke();
  x.restore();

  // 6. Pastille du code d'extension (citron, légèrement tournée)
  x.save();
  x.translate(W - 92, wy + 64);
  x.rotate(0.2);
  x.beginPath(); x.arc(0, 0, 56, 0, Math.PI * 2);
  x.fillStyle = C.citron; x.fill();
  x.lineWidth = 3; x.strokeStyle = C.encre; x.stroke();
  x.fillStyle = C.encre; x.textAlign = 'center'; x.textBaseline = 'middle';
  tracking(x, -1);
  fitText(x, code, 86, 26, F.display, 800);
  x.fillText(code, 0, -6);
  tracking(x, 2);
  x.font = `600 12px ${F.mono}`;
  x.fillText('PRÉCO', 0, 20);
  x.restore();

  // 7. Mentions en bas (mono)
  x.save();
  x.fillStyle = C.encre; x.textAlign = 'center'; x.textBaseline = 'middle';
  tracking(x, 4);
  x.font = `600 17px ${F.mono}`;
  x.fillText('ÉDITION PRÉCOMMANDE', W / 2, wy + wh + 40);
  tracking(x, 3);
  x.font = `500 15px ${F.mono}`;
  if (dateTxt) x.fillText(`SORTIE ${dateTxt}`, W / 2, wy + wh + 68);
  x.restore();
  return c;
}

/* --------------------------------------------------------------------------
   Cartes typographiques (recto) — atlas de 3 cartes 512 × 716 côte à côte.
   faces : [{ big, line, foot, kicker }]
   -------------------------------------------------------------------------- */
export function faceAtlas(faces) {
  const W = 512, H = 716;
  const [c, x] = makeCanvas(W * 3, H);
  faces.slice(0, 3).forEach((f, i) => {
    x.save();
    x.translate(i * W, 0);
    // Cadre holo + fond papier
    roundRect(x, 0, 0, W, H, 34);
    x.fillStyle = holoGradient(x, 0, 0, W, H);
    x.fill();
    roundRect(x, 16, 16, W - 32, H - 32, 22);
    x.fillStyle = C.papier; x.fill();
    // Papier millimétré (atelier)
    x.save();
    roundRect(x, 16, 16, W - 32, H - 32, 22); x.clip();
    x.strokeStyle = 'rgba(90,63,224,.12)'; x.lineWidth = 1;
    for (let gx = 16; gx < W; gx += 31) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
    for (let gy = 16; gy < H; gy += 31) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
    // Bande holo diagonale douce
    x.globalAlpha = 0.35;
    x.fillStyle = holoGradient(x, 0, H * 0.3, W, H * 0.7);
    x.beginPath(); x.moveTo(0, H * 0.58); x.lineTo(W, H * 0.34); x.lineTo(W, H * 0.5); x.lineTo(0, H * 0.74); x.closePath(); x.fill();
    x.restore();

    // En-tête mono
    x.fillStyle = C.encre; x.textBaseline = 'middle';
    tracking(x, 3);
    x.font = `600 18px ${F.mono}`;
    x.textAlign = 'left';
    x.fillText('CHOCOCARDS', 44, 62);
    x.textAlign = 'right';
    x.fillText(`0${i + 1}/03`, W - 44, 62);
    x.fillRect(44, 86, W - 88, 2);

    // Kicker
    if (f.kicker) {
      x.textAlign = 'left';
      tracking(x, 3);
      x.font = `600 17px ${F.mono}`;
      x.fillStyle = C.violetInk;
      x.fillText(f.kicker.toUpperCase(), 44, 128);
    }

    // Grand texte
    x.fillStyle = C.encre; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    tracking(x, -4);
    fitText(x, f.big, W - 80, 150, F.display, 800);
    x.fillText(f.big, W / 2, H * 0.52);

    // Ligne d'accent (serif italique)
    if (f.line) {
      tracking(x, 0);
      fitText(x, f.line, W - 100, 60, F.serif, 400, 'italic');
      x.fillStyle = C.violetInk;
      x.fillText(f.line, W / 2, H * 0.52 + 74);
    }

    // Pied : pastille encre + texte papier
    if (f.foot) {
      x.textBaseline = 'middle';
      tracking(x, 3);
      x.font = `600 17px ${F.mono}`;
      const tw = Math.min(W - 88, x.measureText(f.foot.toUpperCase()).width + 48);
      roundRect(x, (W - tw) / 2, H - 116, tw, 52, 26);
      x.fillStyle = C.encre; x.fill();
      x.fillStyle = C.papier; x.textAlign = 'center';
      x.fillText(f.foot.toUpperCase(), W / 2, H - 89);
    }
    // Monogramme CC (coin)
    x.fillStyle = C.encre; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    tracking(x, -2);
    x.font = `800 22px ${F.display}`;
    x.fillText('CC', 44, H - 140);
    x.restore();
  });
  return c;
}

/** Halo radial (blanc → menthe → cyan → transparent). */
export function glowArt(size = 256) {
  const [c, x] = makeCanvas(size, size);
  const r = size / 2;
  const g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(225,255,240,.9)');
  g.addColorStop(0.3, 'rgba(92,242,181,.45)');
  g.addColorStop(0.6, 'rgba(46,230,255,.12)');
  g.addColorStop(1, 'rgba(46,230,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return c;
}

/** Rayons lumineux (éventail conique qui s'estompe vers l'extérieur). */
export function raysArt(size = 512, count = 22) {
  const [c, x] = makeCanvas(size, size);
  const r = size / 2;
  x.translate(r, r);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (i % 3) * 0.05;
    const w = 0.035 + ((i * 37) % 7) * 0.012;
    const g = x.createLinearGradient(0, 0, Math.cos(a) * r, Math.sin(a) * r);
    const tint = i % 3 === 0 ? '92,242,181' : i % 3 === 1 ? '46,230,255' : '255,212,59';
    g.addColorStop(0, `rgba(${tint},.0)`);
    g.addColorStop(0.12, `rgba(${tint},.55)`);
    g.addColorStop(1, `rgba(${tint},0)`);
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, 0);
    x.arc(0, 0, r, a - w, a + w);
    x.closePath();
    x.fill();
  }
  return c;
}

/** Ombre portée douce (ellipse sombre). */
export function shadowArt(size = 128) {
  const [c, x] = makeCanvas(size, size);
  const r = size / 2;
  const g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(0,0,0,.62)');
  g.addColorStop(0.5, 'rgba(0,0,0,.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return c;
}
