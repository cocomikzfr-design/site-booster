/* ==========================================================================
   Mise en forme fr-BE et règles métier (prix, dates, horaires, statuts)
   ========================================================================== */

import DATA from '../data.js';

const prixFmt = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' });
/** 64.9 → « 64,90 € » */
export const formatPrix = (n) => prixFmt.format(Number(n) || 0).replace(/ | /g, ' ');

const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** '2026-10-30' → Date locale à midi (évite les décalages de fuseau). */
export const parseDay = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

/** Détails d'une date ISO (jour, mois, jour de la semaine…) pour les gabarits. */
export function dateParts(iso) {
  const d = parseDay(iso);
  return {
    jour: d.getDate(),
    jour2: String(d.getDate()).padStart(2, '0'),
    mois: MOIS[d.getMonth()],
    moisCourt: MOIS_COURT[d.getMonth()],
    semaine: JOURS[d.getDay()],
    annee: d.getFullYear(),
    long: `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`,
    iso: String(iso).slice(0, 10),
  };
}

/** Aujourd'hui à minuit (heure locale). Surchargeable pour les tests : ?today=2026-10-24 */
export function today() {
  const forced = new URLSearchParams(location.search).get('today');
  const d = forced ? parseDay(forced) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Nombre de jours entiers entre aujourd'hui et la date ISO (0 = aujourd'hui). */
export function daysUntil(iso) {
  const d = parseDay(iso); d.setHours(0, 0, 0, 0);
  return Math.round((d - today()) / 86400000);
}

/** « aujourd'hui », « demain », « dans 9 jours » */
export function relativeDays(iso) {
  const n = daysUntil(iso);
  if (n <= 0) return 'aujourd’hui';
  if (n === 1) return 'demain';
  return `dans ${n} jours`;
}

/** Garde les éléments dont la date n'est pas passée. */
export const upcoming = (list) => list.filter((x) => daysUntil(x.date) >= 0).sort((a, b) => parseDay(a.date) - parseDay(b.date));

/** Libellés d'un statut produit (voir data.js). */
export const statutInfo = (statut) => DATA.statuts[statut] || DATA.statuts.disponible;

/** Produit par identifiant. */
export const getProduit = (id) => DATA.produits.find((p) => p.id === id) || null;
/** Produits d'une catégorie (ordre de data.js). */
export const produitsDe = (categorie) => DATA.produits.filter((p) => p.categorie === categorie);

/** Temps restant jusqu'à une date ISO complète : { days, hours, minutes, seconds, total } */
export function timeLeft(isoDateTime) {
  const total = Math.max(0, new Date(isoDateTime).getTime() - Date.now());
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total / 3600000) % 24),
    minutes: Math.floor((total / 60000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

/**
 * État d'ouverture de la boutique maintenant.
 * → { open: bool, label: 'Ouvert maintenant · jusqu’à 19h' | 'Fermé · ouvre mardi à 10h', todayIndex }
 */
export function openState(now = new Date()) {
  const h = DATA.boutique.horaires;
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const t = h[day];
  const fmt = (hhmm) => hhmm.replace(/^0/, '').replace(':00', 'h').replace(':', 'h');
  if (t && t.ouverture && mins >= toMin(t.ouverture) && mins < toMin(t.fermeture)) {
    return { open: true, label: `Ouvert maintenant · jusqu’à ${fmt(t.fermeture)}`, todayIndex: day };
  }
  // Prochaine ouverture
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const s = h[d];
    if (!s || !s.ouverture) continue;
    if (i === 0 && mins >= toMin(s.ouverture)) continue;
    const quand = i === 0 ? 'aujourd’hui' : i === 1 ? 'demain' : JOURS[d];
    return { open: false, label: `Fermé · ouvre ${quand} à ${fmt(s.ouverture)}`, todayIndex: day };
  }
  return { open: false, label: 'Fermé', todayIndex: day };
}
