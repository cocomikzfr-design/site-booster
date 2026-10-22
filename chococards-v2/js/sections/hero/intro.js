/* ==========================================================================
   Hero · sortie du préchargeur → entrée du hero (une seule chorégraphie)
   --------------------------------------------------------------------------
   « Le paquet devient le deck » : les 5 cartes qui se mélangent dans le
   préchargeur s'envolent exactement à la place des 5 dos de cartes de
   l'affiche du hero, pendant que le rideau se lève. Puis les vraies photos
   (booster japonais, ETB 30 ans, Pikachu-ex) se posent avec un rebond, et le
   titre se compose : « Bienvenue chez » sort du flou, les lettres de
   ChocoCards montent de leur masque, puis texte, pastilles et boutons.

   Web Animations API (element.animate) plutôt que GSAP : transform et opacité
   tournent sur le compositeur, donc restent fluides pendant que main.js
   construit le reste de la page, et l'entrée ne dépend pas du CDN.
   Branché par setPreloaderExit() dès le chargement du module.
   Partie préchargeur ≤ 0,8 s ; l'entrée du hero continue ensuite (≈ 1,9 s).

   FAIL-SAFES (le texte n'est jamais laissé invisible) :
   - aucun style n'est posé en ligne : les états de départ n'existent que
     PENDANT une animation (fill « backwards ») ; quand elle se termine — ou
     si elle est annulée — l'élément retrouve son style normal, visible ;
   - les animations avancent seules (compositeur), même si un script plante ;
   - rien n'est joué en mouvement réduit, lors d'une visite répétée ou si
     element.animate n'existe pas ;
   - au premier geste (molette, doigt, clavier) l'entrée s'accélère ;
   - filet ultime : tout est terminé de force après 6 s.
   ========================================================================== */

import { setPreloaderExit } from '../../core/preloader.js';
import { prefs } from '../../core/motion.js';
import { wait } from '../../core/utils.js';
import { backPose } from './geometry.js';

const EXPO = 'cubic-bezier(.16, 1, .3, 1)';     // expo.out
const BACK = 'cubic-bezier(.34, 1.56, .64, 1)'; // back.out(1.4)
const INOUT = 'cubic-bezier(.65, 0, .35, 1)';   // power3.inOut
const IN = 'cubic-bezier(.55, 0, 1, .45)';      // power2.in

let started = false;
let playing = false;
let resolveDone;
/** Résolue quand l'entrée du hero est terminée (ou n'aura pas lieu). */
export const introDone = new Promise((r) => { resolveDone = r; });
export const introStarted = () => started;
/** Pas de préchargeur (visite répétée, mouvement réduit, erreur) : pas d'entrée. */
export function noIntro() { if (!started) resolveDone(); }

async function defaultExit(el) {
  el.classList.add('is-leaving');
  await wait(600);
}

export function registerIntro(getParts) {
  setPreloaderExit(async (el) => {
    started = true;
    try {
      const parts = getParts();
      if (prefs.reduced || !parts || typeof el.animate !== 'function') { resolveDone(); return defaultExit(el); }
      // Le préchargeur rend la main tout de suite : un rideau identique (le nôtre) prend le relais
      // et joue la distribution à son rythme, même si le fil principal est encore occupé par le démarrage.
      const curtain = takeOver(el);
      afterFrames(() => {
        playing = true;
        choreography(curtain, parts).catch(() => abort(curtain));
      });
    } catch (err) {
      resolveDone();
      return defaultExit(el);
    }
  });
}

/** Copie conforme du préchargeur (cartes au même instant de leur mélange), hors de portée de runPreloader. */
function takeOver(el) {
  const curtain = el.cloneNode(true);
  curtain.removeAttribute('data-preloader');
  curtain.classList.add('hero-curtain');
  const src = [...el.querySelectorAll('.preloader__card')];
  const dst = [...curtain.querySelectorAll('.preloader__card')];
  src.forEach((card, i) => {
    const anim = card.getAnimations?.()[0];
    if (!anim || !dst[i]) return;
    const delay = anim.effect?.getTiming?.().delay || 0;
    dst[i].style.animationDelay = `${(delay - (anim.currentTime || 0)).toFixed(1)}ms`;
  });
  el.after(curtain);
  // Filets : erreur JS → rideau retiré ; jamais plus de 3 s de toute façon
  const kill = () => abort(curtain);
  addEventListener('error', kill, { once: true });
  curtain.__kill = setTimeout(kill, 3000);
  return curtain;
}

function abort(curtain) {
  clearTimeout(curtain.__kill);
  curtain.getAnimations?.({ subtree: true }).forEach((a) => { try { a.finish(); } catch { /* déjà fini */ } });
  curtain.remove();
  // Si l'entrée n'a pas pu démarrer, rien n'est caché : on libère la suite
  if (!playing) resolveDone();
}

/** Attend deux images consécutives (le fil principal respire) avant de lancer les animations. */
function afterFrames(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

/** Transformation qui pose une carte du préchargeur sur un dos de l'affiche. */
function landing(target, card) {
  const deck = target.offsetParent;
  const pdeck = card.offsetParent;
  if (!deck || !pdeck) return null;
  const pose = backPose(target);
  const dr = deck.getBoundingClientRect();
  const pr = pdeck.getBoundingClientRect();
  const cx = pr.left + card.offsetLeft + card.offsetWidth / 2;
  const cy = pr.top + card.offsetTop + card.offsetHeight / 2;
  const x = dr.left + pose.cx - cx;
  const y = dr.top + pose.cy - cy;
  const s = pose.w / (card.offsetWidth || 1);
  return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${pose.deg}deg) scale(${s.toFixed(4)})`;
}

async function choreography(el, p) {
  const anims = [];
  const play = (node, keyframes, opts) => {
    if (!node) return null;
    const a = node.animate(keyframes, { fill: 'backwards', ...opts });
    anims.push(a);
    return a;
  };
  const cards = [...el.querySelectorAll('.preloader__card')];
  const brand = el.querySelector('.preloader__brand');
  const chars = p.split?.chars || [];
  p.section.classList.add('is-intro');

  // 1. Rideau : le fond passe sur un calque à part et fond ; la signature s'efface
  const bg = document.createElement('div');
  bg.className = 'hero-pl-bg';
  el.prepend(bg);
  el.classList.add('hero-pl');
  play(brand, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 250, easing: IN, fill: 'forwards' });
  play(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 560, delay: 100, easing: INOUT, fill: 'forwards' });

  // 2. Les cartes du paquet volent vers l'éventail ; chaque dos de l'affiche apparaît à l'atterrissage
  let lastLanding = null;
  cards.forEach((card, i) => {
    const target = p.backs[i];
    const goal = target ? landing(target, card) : null;
    if (!goal) { play(card, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }); return; }
    const from = getComputedStyle(card).transform;
    card.style.animation = 'none';
    const delay = 40 + i * 30;
    const duration = 620;
    lastLanding = play(card, [
      { transform: from === 'none' ? 'none' : from, opacity: 1, offset: 0 },
      { transform: goal, opacity: 1, offset: 0.995 },
      { transform: goal, opacity: 0, offset: 1 },
    ], { duration, delay, easing: INOUT, fill: 'both' });
    play(target, [{ opacity: 0 }, { opacity: 0, offset: 0.995 }, { opacity: 1 }], { duration: delay + duration, easing: 'linear', fill: 'none' });
  });

  // 3. Halo puis vraies photos (rebond). Propriétés individuelles translate / scale : elles ne
  //    touchent pas « transform », où tourne la flottaison CSS (cc-float) → tout reste sur le compositeur.
  play(p.glow, [{ opacity: 0, scale: '.6' }, { opacity: 1, scale: '1' }], { duration: 1200, delay: 450, easing: EXPO });
  p.photos.forEach((ph, i) => {
    play(ph, [{ translate: '0 70px', scale: '.8' }, { translate: '0 0', scale: '1' }],
      { duration: 1000, delay: 800 + i * 80, easing: BACK });
    play(ph, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 800 + i * 80, easing: 'ease-out' });
  });

  // 4. Le titre se compose, puis le reste du contenu.
  // Propriétés individuelles translate / rotate (jamais « transform ») : GSAP (magnétisme des
  // boutons, typographie cinétique) lit et écrit transform ; les deux ne se gênent donc jamais.
  play(p.chip, [{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 800, delay: 180, easing: EXPO });
  p.words.forEach((w, i) => {
    play(w, [{ opacity: 0, translate: '0 55%', filter: 'blur(10px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0px)' }],
      { duration: 900, delay: 260 + i * 70, easing: EXPO });
  });
  if (chars.length) {
    p.split.box.classList.add('is-masked');
    chars.forEach((c, i) => {
      play(c, [{ translate: '0 112%', rotate: '8deg' }, { translate: '0 0', rotate: '0deg' }],
        { duration: 1150, delay: 340 + i * 35, easing: EXPO });
    });
  }
  // Boutons : on anime leur conteneur, jamais les boutons magnétiques eux-mêmes (GSAP)
  [p.lead, ...p.infos, p.ctasWrap, p.feature, p.scroll].filter(Boolean).forEach((n, i) => {
    play(n, [{ opacity: 0, translate: '0 26px' }, { opacity: 1, translate: '0 0' }],
      { duration: 850, delay: 520 + i * 60, easing: EXPO });
  });

  // Gestes de l’utilisateur : on accélère la fin ; filet ultime à 6 s
  const hurry = () => anims.forEach((a) => { try { a.updatePlaybackRate(2.5); } catch { /* ancien navigateur */ } });
  const events = ['wheel', 'touchstart', 'keydown'];
  events.forEach((t) => addEventListener(t, hurry, { passive: true, once: true }));
  const safety = setTimeout(() => anims.forEach((a) => { try { a.finish(); } catch { /* déjà fini */ } }), 6000);

  Promise.allSettled(anims.map((a) => a.finished)).then(() => {
    clearTimeout(safety);
    events.forEach((t) => removeEventListener(t, hurry));
    p.split?.box.classList.remove('is-masked');
    p.section.classList.remove('is-intro');
    p.section.classList.add('is-intro-done');
    resolveDone();
  });

  // Le rideau est retiré quand la dernière carte a atterri (≈ 0,8 s) ; l'entrée du hero continue
  await Promise.race([lastLanding ? lastLanding.finished.catch(() => {}) : wait(700), wait(1600)]);
  clearTimeout(el.__kill);
  el.remove();
}
