/* ==========================================================================
   Section « booster » — module du constructeur booster (voir DESIGN.md §10)
   Périmètre : SECTION:precommande, SECTION:sorties — ouverture de booster 3D avec la vraie photo, compte à rebours, timeline.
   Styles : css/s-booster.css
   init(ctx) est appelé une fois par main.js, après le rendu de base (render.js).
   ctx = { data, prefs, gsap, ScrollTrigger, SplitText, Lenis, lenis } (chacun peut valoir null : DESIGN.md §10.4)
   --------------------------------------------------------------------------
   1. Compte à rebours « compteur mécanique » (booster/countdown.js)
   2. Frise des prochaines sorties qui se dessine (booster/timeline.js)
   3. Ouverture du booster (booster/scene.js, Three.js chargé à la demande) :
      - desktop (≥ 1024 px de large et ≥ 680 px de haut) : la section est
        épinglée sur 120 vh et le défilement pilote l'ouverture (p de 0 à 1) ;
      - téléphone / tablette / petit écran : pas d'épinglage, l'ouverture se
        joue une fois quand la scène entre dans l'écran, bouton « Rejouer » ;
      - mouvement réduit : aucune 3D, l'affiche CSS (état final) reste ;
      - pas de WebGL : l'affiche CSS suit quand même la progression
        (variable --boost-p) en mode épinglé.
   ========================================================================== */

import { whenNear, onIdle, on, onVisible } from '../core/utils.js';
import { prefs } from '../core/motion.js';
import { refreshScroll } from '../core/scroll.js';
import { timeLeft } from '../core/format.js';

/** Isole chaque partie : une erreur n'empêche pas les autres de fonctionner. */
function run(name, fn) {
  try { fn(); } catch (err) { console.error(`[booster] ${name}`, err); }
}

export async function init(ctx) {
  const pre = document.getElementById('precommande');
  const sorties = document.getElementById('sorties');
  // L'épinglage est posé tout de suite (avant le rafraîchissement de ScrollTrigger par main.js)
  run('ouverture du booster', () => initOpening(pre, ctx));
  // Modules chargés à la demande : ils n'alourdissent pas le démarrage de la page (LCP)
  const [cd, tl] = await Promise.all([
    import('./booster/countdown.js').catch((err) => { console.error('[booster] compte à rebours', err); return null; }),
    import('./booster/timeline.js').catch((err) => { console.error('[booster] frise des sorties', err); return null; }),
  ]);
  if (cd) run('compte à rebours', () => cd.initCountdown(pre));
  if (tl) run('frise des sorties', () => tl.initTimeline(sorties, ctx));
}

/* --------------------------------------------------------------------------
   Lecture de la progression (texte mono + barre) sous la scène
   -------------------------------------------------------------------------- */
const STEPS = [
  { from: 0.3, text: '01/03 · Déchirer' },
  { from: 0.62, text: '02/03 · Libérer les cartes' },
  { from: 0.97, text: '03/03 · Révéler' },
  { from: Infinity, text: 'Ouvert · Précommandez !' },
];

/** Recto des 3 cartes typographiques qui se retournent (données de data.js). */
function buildFaces(v) {
  const t = timeLeft(v.sortie);
  // Date lue telle qu'écrite dans data.js (heure belge), sans conversion de fuseau
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v.sortie || ''));
  const days = Math.ceil(t.total / 86400000);
  return [
    t.total > 0
      ? { kicker: 'Compte à rebours', big: `J-${days}`, line: 'avant la sortie', foot: 'Réservez le vôtre' }
      : { kicker: 'C’est sorti', big: 'DISPO', line: 'en boutique', foot: 'Rue du Géant 15' },
    { kicker: v.jeu || 'Extension', big: v.code || 'ME06', line: v.titreAccent || '', foot: 'Précommande ouverte' },
    { kicker: 'Date de sortie', big: m ? `${m[3]}.${m[2]}` : '—', line: m ? m[1] : '', foot: 'Retrait gratuit' },
  ];
}

function initOpening(section, ctx) {
  const visual = section?.querySelector('[data-booster-visual]');
  const stage = section?.querySelector('[data-booster-stage]');
  const canvas = stage?.querySelector('[data-booster-canvas]');
  if (!visual || !stage || !canvas) return;
  if (prefs.reduced) return; // affiche finale CSS, aucune 3D en mouvement

  const hud = visual.querySelector('[data-booster-hud]');
  const hudText = hud?.querySelector('.booster-hud__text');
  const replay = visual.querySelector('[data-booster-replay]');
  const replayLabel = replay?.querySelector('span');
  const { gsap, ScrollTrigger } = ctx;
  const pinQuery = matchMedia('(min-width: 1024px) and (min-height: 680px)');

  let mode = null;      // 'pin' | 'play'
  let scene = null;     // scène WebGL (quand elle est prête)
  let st = null;        // ScrollTrigger de l'épinglage
  let progress = 1;
  let lastHud = '';
  let playing = 0;      // identifiant rAF de la lecture automatique
  let played = false;
  let stopVisible = null;

  /** Applique une progression : variable CSS (affiche de repli + barre), texte, scène 3D. */
  const apply = (p) => {
    progress = p;
    visual.style.setProperty('--boost-p', p.toFixed(4));
    if (hudText) {
      let text = STEPS.find((s) => p < s.from)?.text || '';
      if (p < 0.015) text = mode === 'pin' ? 'Défilez pour ouvrir le booster' : 'Booster ChocoCards · ME06';
      if (text !== lastHud) { hudText.textContent = text; lastHud = text; }
    }
    scene?.setTarget(p);
  };

  /* ----- Mode « épinglé » : le défilement pilote l'ouverture ----- */
  const setupPin = () => {
    section.classList.add('is-pin');
    apply(0);
    st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${Math.round(innerHeight * 1.2)}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    // Les déclencheurs créés plus tôt mais situés plus bas (étagères…) doivent
    // être recalculés après cet épinglage : ordre de rafraîchissement = ordre de la page
    ScrollTrigger.sort?.();
  };

  /* ----- Mode « lecture » : une fois à l'arrivée, puis bouton Rejouer ----- */
  const play = () => {
    if (!scene) return;
    cancelAnimationFrame(playing);
    played = true;
    scene.jump(0);
    apply(0);
    const t0 = performance.now();
    const DURATION = 3400;
    const step = (now) => {
      const f = Math.min(1, (now - t0) / DURATION);
      apply(f);
      if (f < 1) playing = requestAnimationFrame(step);
      else {
        playing = 0;
        if (replayLabel) replayLabel.textContent = 'Rejouer l’ouverture';
      }
    };
    playing = requestAnimationFrame(step);
  };
  const setupPlay = () => {
    section.classList.add('is-play');
    apply(1);
  };
  const armPlay = () => {
    if (mode !== 'play' || !scene) return;
    if (!played) { scene.jump(0); apply(0); }
    if (hud) hud.hidden = false;
    if (replay) {
      replay.hidden = false;
      if (replayLabel) replayLabel.textContent = played ? 'Rejouer l’ouverture' : 'Ouvrir le booster';
    }
    stopVisible?.();
    // Joue une seule fois quand la scène est bien visible (≥ 55 %)
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.intersectionRatio >= 0.55) && !played) { io.disconnect(); play(); }
    }, { threshold: [0, 0.55, 1] });
    io.observe(stage);
    stopVisible = () => io.disconnect();
  };

  const teardown = () => {
    st?.kill(true);
    st = null;
    cancelAnimationFrame(playing);
    playing = 0;
    stopVisible?.();
    stopVisible = null;
    section.classList.remove('is-pin', 'is-play');
    if (replay) replay.hidden = true;
  };

  const setup = () => {
    teardown();
    mode = pinQuery.matches && gsap && ScrollTrigger ? 'pin' : 'play';
    if (mode === 'pin') setupPin(); else setupPlay();
    if (scene) {
      if (mode === 'pin') scene.jump(progress);
      else armPlay();
    }
    // En mode lecture, la barre n'a de sens qu'avec la scène 3D
    if (hud) hud.hidden = mode === 'play' && !scene;
  };

  setup();
  pinQuery.addEventListener('change', () => { setup(); refreshScroll(); });
  replay?.addEventListener('click', play);

  /* ----- Scène WebGL : après app:ready, quand la section approche -----
     (prefs.webgl crée un contexte de test : on ne l'interroge qu'à ce moment-là) */
  const startGL = () => {
    if (!prefs.webgl) return;
    import('./booster/scene.js')
      .then(({ createBoosterScene }) => createBoosterScene({
        canvas,
        section,
        vedette: ctx.data.precommandeVedette,
        faces: buildFaces(ctx.data.precommandeVedette),
        lite: !prefs.desktop || prefs.tier !== 'high',
        onFirstFrame: () => stage.classList.add('is-gl'),
      }))
      .then((sc) => {
        scene = sc;
        if (mode === 'pin') scene.jump(progress);
        else armPlay();
      })
      .catch((err) => {
        // Pas de WebGL / CDN indisponible : l'affiche CSS reste (aucune boîte vide)
        stage.classList.add('is-gl-off');
        if (new URLSearchParams(location.search).has('debug')) console.info('[booster] repli CSS', err);
      });
  };
  const near = () => whenNear(section, () => onIdle(startGL, 1500), '120% 0px');
  if (window.__ready) near(); else on('app:ready', near);
  // Scène sortie de l'écran pendant la lecture : on termine directement (état final)
  onVisible(section, (vis) => { if (!vis && playing) { cancelAnimationFrame(playing); playing = 0; apply(1); } });
}
