// assets/ui.js : calques modaux (menu, tiroir, recherche, zoom, filtres), annonces, requêtes de sections.
const html = document.documentElement;
const stack = [];

// Rend inerte tout ce qui n'est pas el (frères de chaque ancêtre) ; renvoie la fonction de restauration
export function inertOthers(el) {
  const list = [];
  for (let n = el; n && n.parentElement && n !== document.body; n = n.parentElement) {
    for (const s of n.parentElement.children) {
      if (s === n || s.inert || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(s.tagName) || s.id === 'a11y-announcer') continue;
      s.inert = true; list.push(s);
    }
  }
  return () => list.forEach((s) => { s.inert = false; });
}

// Ouvre un calque : inert derrière, Échap, défilement bloqué, focus ; close() restaure tout
export function openLayer(el, { opener, onEsc, focus } = {}) {
  const restore = inertOthers(el);
  const prev = opener || document.activeElement;
  const layer = {
    close() {
      restore(); document.removeEventListener('keydown', key);
      stack.splice(stack.indexOf(layer), 1);
      if (!stack.length) html.classList.remove('has-layer');
      if (prev && prev.isConnected) prev.focus({ preventScroll: true });
    }
  };
  const key = (e) => { if (e.key === 'Escape' && stack[stack.length - 1] === layer) { e.preventDefault(); onEsc ? onEsc() : layer.close(); } };
  document.addEventListener('keydown', key);
  stack.push(layer); html.classList.add('has-layer');
  const target = focus || el.querySelector('[autofocus], input:not([type=hidden]), button, [href], select, textarea');
  if (target) requestAnimationFrame(() => target.focus({ preventScroll: true }));
  return layer;
}

// Annonce pour les lecteurs d'écran (#a11y-announcer, aria-live)
export function announce(msg) {
  const el = document.getElementById('a11y-announcer'); if (!el) return;
  el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 60);
}

export const t = (key, vars = {}) => {
  let s = (window.theme && window.theme.strings[key]) || key;
  for (const k in vars) s = s.split(`[${k}]`).join(vars[k]);
  return s;
};

// Section Rendering API : renvoie un Document à partir d'une URL et d'un id de section
export async function fetchSection(url, sectionId, signal) {
  const u = new URL(url, location.href); u.searchParams.set('section_id', sectionId);
  const res = await fetch(u, { signal }); if (!res.ok) throw new Error(res.status);
  return new DOMParser().parseFromString(await res.text(), 'text/html');
}
export const parse = (str) => new DOMParser().parseFromString(str, 'text/html');
