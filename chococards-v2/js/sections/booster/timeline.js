/* ==========================================================================
   Booster · « Prochaines sorties TCG » : frise qui se dessine
   --------------------------------------------------------------------------
   - Les cartes sont re-rendues ici (gabarit enrichi : pastille du jeu, nœud
     sur la frise, badge « Précommande ouverte »). Les dates passées
     disparaissent (format.upcoming). Si ce module échoue, la liste de base
     de render.js reste affichée.
   - ≥ 1024 px : frise horizontale au-dessus des cartes (repère « Aujourd'hui »
     à gauche, un nœud par sortie). < 1024 px : frise verticale à gauche.
   - Animation unique à l'arrivée (jouée dans le temps, jamais suspendue au
     défilement : le texte n'est jamais caché au repos) : la ligne se trace,
     chaque nœud s'allume quand elle passe, la carte se retourne et se pose.
   - Pas d'épinglage ici : la section précommande, juste avant, l'est déjà
     (règle « jamais deux épinglages à la suite », DESIGN.md §6.2).
   ========================================================================== */

import { dateParts, relativeDays, upcoming, daysUntil } from '../../core/format.js';
import { icon } from '../../core/templates.js';
import { esc } from '../../core/utils.js';
import { prefs } from '../../core/motion.js';

const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Carte d'une sortie (même contenu que releaseItem du socle, + nœud de frise et pastille du jeu). */
function item(r, i) {
  const d = dateParts(r.date);
  const n = daysUntil(r.date);
  const soon = n <= 7;
  const preco = r.lien === '#precommande';
  return `<li class="release${soon ? ' is-soon' : ''}" data-couleur="${esc(r.couleur || 'lilas')}" style="--i:${i}">`
    + '<span class="release__node" aria-hidden="true"><span class="release__pulse"></span></span>'
    + '<article class="release__card">'
    + `<p class="release__when"><time datetime="${d.iso}"><span class="release__day">${d.jour2}</span><span class="release__month">${esc(d.moisCourt)}</span></time>`
    + `<span class="release__weekday">${esc(d.semaine)}</span></p>`
    + `<p class="release__rel">${esc(relativeDays(r.date))}</p>`
    + `<p class="release__tag"><span class="release__game">${esc(r.jeu)}</span>${preco ? '<span class="release__preco">Précommande ouverte</span>' : ''}</p>`
    + `<h3 class="release__title">${esc(r.titre)}</h3>`
    + `<p class="release__text">${esc(r.texte)}</p>`
    + `<a class="link-arrow release__link" href="${esc(r.lien)}"><span>${preco ? 'Précommander' : 'Voir'}</span>${icon('arrow')}<span class="sr-only"> : ${esc(r.jeu)} ${esc(r.titre)}</span></a>`
    + '</article></li>';
}

/** Texte du repère « Aujourd'hui » (date locale, ?today= respecté via daysUntil). */
function todayLabel() {
  const forced = new URLSearchParams(location.search).get('today');
  const t = forced ? new Date(`${forced}T12:00:00`) : new Date();
  return `${JOURS_COURTS[t.getDay()]} ${t.getDate()} ${MOIS_COURTS[t.getMonth()]}`;
}

/**
 * Rend la frise et prépare son animation.
 * ctx : { data, gsap }
 */
export function initTimeline(section, ctx) {
  const ol = section?.querySelector('.timeline');
  if (!ol) return;
  const list = upcoming(ctx.data.sorties || []);
  if (!list.length) return; // le message « calendrier bientôt » du socle reste
  ol.innerHTML = list.map(item).join('');
  ol.style.setProperty('--n', String(list.length));
  const track = section.querySelector('[data-releases-track]');
  const today = section.querySelector('[data-today]');
  if (today) today.textContent = todayLabel();
  track?.classList.add('is-ready');

  const items = [...ol.children];
  // État final : nœud allumé, survol actif (classe posée après l'entrée pour ne pas gêner GSAP)
  const settle = (li) => li.classList.add('is-lit', 'is-settled');
  const { gsap } = ctx;
  if (!gsap || prefs.reduced || !track || !('IntersectionObserver' in window)) { items.forEach(settle); return; }

  const line = track.querySelector('.releases__line');
  let played = false;

  const play = () => {
    if (played) return;
    played = true;
    const horizontal = matchMedia('(min-width: 1024px)').matches;
    const D = 1.1; // durée du tracé
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    if (line) {
      tl.fromTo(line, horizontal ? { scaleX: 0 } : { scaleY: 0 },
        { ...(horizontal ? { scaleX: 1 } : { scaleY: 1 }), duration: D, ease: 'power2.inOut', clearProps: 'transform' }, 0);
    }
    items.forEach((li, i) => {
      const at = 0.12 + (i / Math.max(1, items.length)) * D * 0.85;
      const node = li.querySelector('.release__node');
      const card = li.querySelector('.release__card');
      if (node) {
        tl.fromTo(node, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2.2)', clearProps: 'transform' }, at);
        tl.add(() => li.classList.add('is-lit'), at + 0.05);
      }
      if (card) {
        tl.fromTo(card,
          horizontal
            ? { opacity: 0, rotateX: -78, y: 36, transformOrigin: '50% 0%' }
            : { opacity: 0, rotateY: -32, x: 28, transformOrigin: '0% 50%' },
          { opacity: 1, rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.95, ease: 'back.out(1.4)', clearProps: 'opacity,transform' },
          at + 0.04);
      }
      tl.add(() => settle(li), at + 1.02);
    });
  };

  // Simple IntersectionObserver (pas de ScrollTrigger ni de lecture de mise en page forcée).
  // Premier rappel : si la frise est déjà à l'écran (lien direct, rechargement plus bas),
  // on montre tout sans animation ; sinon on joue l'entrée à son arrivée.
  let firstCall = true;
  const io = new IntersectionObserver((entries) => {
    const hit = entries.some((e) => e.isIntersecting);
    if (firstCall) {
      firstCall = false;
      if (hit) { io.disconnect(); items.forEach(settle); }
      return;
    }
    if (hit) { io.disconnect(); play(); }
  }, { rootMargin: '0px 0px -18% 0px' });
  io.observe(track);
}
