// ⚙️ Remplace ce lien par l'URL de ton gig Fiverr.
const FIVERR_URL = "https://www.fiverr.com/";

const section = document.querySelector(".cinema-scroll");
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const sightsTrack = document.querySelector(".sights-track");
const sightsControls = document.querySelector(".sights-controls");
const sightPrev = document.querySelector(".sight-prev");
const sightNext = document.querySelector(".sight-next");
const originalSightCards = Array.from(document.querySelectorAll(".sight-card"));

let targetMouseX = 0;
let targetMouseY = 0;
let mouseX = 0;
let mouseY = 0;
let targetScroll = 0;
let smoothScroll = 0;
let initialized = false;
let rafPending = false;
let sightCards = [];
const originalSightCount = originalSightCards.length;
let activeSight = originalSightCount;

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smoothstep = (e0, e1, v) => {
  const x = clamp((v - e0) / (e1 - e0));
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, t) => a + (b - a) * t;
const segmentInOut = (s, a, b, c, d) => {
  const enter = smoothstep(a, b, s);
  const exit = smoothstep(c, d, s);
  return { enter, exit, active: enter * (1 - exit) };
};
const getScrollDistance = () =>
  clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight);

const setVar = (name, value) => root.style.setProperty(name, String(value));

function update() {
  rafPending = false;

  targetScroll = getScrollDistance();
  if (!initialized || reduceMotion.matches) {
    smoothScroll = targetScroll;
    initialized = true;
  } else {
    smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
  }
  if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

  mouseX = lerp(mouseX, targetMouseX, 0.12);
  mouseY = lerp(mouseY, targetMouseY, 0.12);

  const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
  const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
  const progress = clamp(smoothScroll / 2700);
  const introExit = smoothstep(90, 650, smoothScroll);
  const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
  const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
  const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
  const blurActive = clamp(frame2.active + frame3.active);
  const frame2Opacity = frame2.active * (1 - frame3.enter);
  const splitDrift = Math.pow(frame2.enter, 1.5);
  const panel2Opacity = frame2.active * (1 - frame2.exit);
  const panel3Opacity = frame3.active * (1 - frame3.exit);
  const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
  const sharedHeroY = progress * -74;
  const sharedHeroScale = progress * 0.23;
  const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
  const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

  setVar("--mx", (reduceMotion.matches ? 0 : mouseX).toFixed(4));
  setVar("--my", (reduceMotion.matches ? 0 : mouseY).toFixed(4));

  setVar("--back-opacity", 1 - frame2.active * 0.06);
  setVar("--back-x", `${mouseX * -12}px`);
  setVar("--back-y", `${mouseY * -4}px`);
  setVar("--back-scale", backScale);
  setVar("--four-y", `${10 + progress * 10}vh`);
  setVar("--four-scale", 0.78 + progress * 0.16);
  setVar("--bazaar-y", `${20 - progress * 8}vh`);
  setVar("--blur-px", `${blurActive * 14}px`);
  setVar("--back-brightness", 1 - blurActive * 0.255);
  setVar("--bazaar-blur-px", `${frame2.active * 14}px`);
  setVar("--bazaar-brightness", 1 - frame2.active * 0.255 - frame3.active * 0.06);
  setVar("--bazaar-saturation", 1 + frame3.active * 0.18);
  setVar("--shade-opacity", "1");
  setVar("--shade-z", frame2.active > 0.02 ? "2" : "0");
  setVar("--shade-top-alpha", blurActive * 0.465);
  setVar("--shade-mid-alpha", blurActive * 0.42);
  setVar("--shade-bottom-alpha", blurActive * 0.51);

  setVar("--title-y", `${introExit * -210}px`);
  setVar("--title-scale", 1 - introExit * 0.08);
  setVar("--title-opacity", 1 - introExit);

  setVar("--bridge-x", `calc(-50% + ${mouseX * 18}px)`);
  setVar("--bridge-y", `${mouseY * 8 + sharedHeroY - frame2.exit * 760}px`);
  setVar("--bridge-bottom", `${5 - frame2.enter * 13}vh`);
  setVar("--bridge-width", `${67.2 + frame2.enter * 37.8}vw`);
  setVar("--bridge-scale", 1.02 + sharedHeroScale + frame2.exit * 0.46);

  setVar("--split-left-x", `calc(-50% + ${-splitDrift * 46}vw + ${mouseX * 22}px)`);
  setVar("--split-left-y", `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`);
  setVar("--split-left-scale", 1 + sharedHeroScale + frame2.enter * 0.74);
  setVar("--split-right-x", `calc(-50% + ${splitDrift * 46}vw + ${mouseX * 22}px)`);
  setVar("--split-right-y", `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`);
  setVar("--split-right-scale", 1 + sharedHeroScale + frame2.enter * 0.74);

  setVar("--frame2-opacity", frame2Opacity);
  setVar("--frame2-x", `calc(-50% + ${mouseX * 10}px)`);
  setVar("--frame2-y", `calc(-50% + ${mouseY * 8 - frame2.exit * 150}px)`);
  setVar("--frame2-scale", 1.06 + frame2.enter * 0.08 + frame2.exit * 0.08);

  setVar("--intro-copy-y", `${introExit * 90}px`);
  setVar("--intro-copy-opacity", 1 - introExit);
  setVar("--panel2-opacity", panel2Opacity);
  setVar("--panel2-y", `calc(-50% + ${-frame2.exit * 86 + (1 - frame2.enter) * 58}px)`);
  setVar("--panel3-opacity", panel3Opacity);
  setVar("--panel3-y", `calc(-50% + ${-frame3.exit * 86 + (1 - frame3.enter) * 58}px)`);
  setVar("--note-events", panel3Opacity > 0.5 ? "auto" : "none");

  setVar("--sights-opacity", sightsEnter);
  setVar("--sights-controls-opacity", sightsControlsEnter);
  sightsControls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
  setVar("--sights-visibility", sightsEnter > 0.01 ? "visible" : "hidden");
  setVar("--sights-y", "0px");
  setVar("--sights-enter-x", `${(1 - sightsEnter) * 420}vw`);
  setVar("--sights-scale", 1 / backScale);
  setVar("--sights-top", `${sightsParentTop}px`);
  setVar("--sights-screen-top", `${sightsScreenTop}px`);

  if (
    Math.abs(smoothScroll - targetScroll) > 0.08 ||
    Math.abs(mouseX - targetMouseX) > 0.001 ||
    Math.abs(mouseY - targetMouseY) > 0.001
  ) {
    requestTick();
  }
}

function requestTick() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(update);
}

/* ---------- Infinite slider ---------- */

function setupSightSlider() {
  sightsTrack.replaceChildren();
  for (let setIndex = 0; setIndex < 3; setIndex += 1) {
    originalSightCards.forEach((card, cardIndex) => {
      const clone = card.cloneNode(true);
      clone.dataset.sightIndex = setIndex * originalSightCount + cardIndex;
      sightsTrack.append(clone);
    });
  }
  sightCards = Array.from(sightsTrack.querySelectorAll(".sight-card"));
  activeSight = originalSightCount;

  sightCards.forEach((card) => {
    card.addEventListener("click", () => selectSightCard(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSightCard(card);
      }
    });
  });
  sightsTrack.addEventListener("transitionend", normalizeSightSlider);
  updateSightSlider();
}

function updateSightSlider() {
  if (!sightCards.length) return;
  const cardWidth = sightCards[0].offsetWidth;
  const gap = parseFloat(getComputedStyle(sightsTrack).columnGap || "0") || 0;
  setVar("--sights-shift", `${-(cardWidth + gap) * activeSight}px`);
  sightCards.forEach((card, index) => card.classList.toggle("is-active", index === activeSight));
}

function moveSightSlider(dir) {
  activeSight += dir;
  updateSightSlider();
}

function selectSightCard(card) {
  const index = Number(card.dataset.sightIndex);
  if (Number.isFinite(index)) {
    activeSight = index;
    updateSightSlider();
  }
}

function jumpSightSlider(index) {
  sightsTrack.classList.add("is-jumping");
  activeSight = index;
  updateSightSlider();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => sightsTrack.classList.remove("is-jumping"));
  });
}

function normalizeSightSlider() {
  if (activeSight >= originalSightCount * 2) jumpSightSlider(activeSight - originalSightCount);
  else if (activeSight < originalSightCount) jumpSightSlider(activeSight + originalSightCount);
}

/* ---------- Nav: jump to a point of the scroll story ---------- */

document.querySelectorAll("[data-jump]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const offset = Number(link.dataset.jump);
    const max = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: section.offsetTop + Math.min(offset, max) });
  });
});

/* ---------- FR / EN ---------- */

const translations = {
  en: {
    navIntro: "Home", navWhy: "Why me", navOrder: "Order", navOffers: "Packages",
    hero: "WEBSITES",
    intro: "I build custom, fast and cinematic websites that make visitors stay and turn them into customers.",
    tag1: "Custom design", tag2: "Fast delivery", tag3: "Responsive & SEO",
    p2t: "Your website, your best salesperson.",
    p2p: "A unique design, clean and lightweight code, smooth browsing on mobile and desktop. No generic template: every site is built for your business.",
    f1: "First mockup delivered", f2: "Responsive on mobile and desktop",
    p3t: "Ready to launch your project?",
    p3p: "Tell me your idea, I handle the rest: design, development, launch and revisions until you are happy.",
    cta: "Order on Fiverr",
    c1k: "Basic package", c1t: "Landing page", c1p: "A single elegant, responsive page to present your business.",
    c2k: "Standard package", c2t: "Showcase site", c2p: "Up to 5 pages, contact form and basic SEO setup.",
    c3k: "Premium package", c3t: "Cinematic site", c3p: "Scroll animations, parallax and immersive effects, just like this page.",
    c4k: "Add-on", c4t: "E-commerce", c4p: "Online store with product catalog and secure checkout.",
    c5k: "Support", c5t: "Maintenance", c5p: "Updates, fixes and changes after delivery.",
  },
};
const langButton = document.querySelector(".language-switcher");
const langLabel = document.querySelector(".language-current");
const french = {};
document.querySelectorAll("[data-i18n]").forEach((el) => { french[el.dataset.i18n] = el.textContent; });
translations.fr = french;
let lang = "fr";

function applyLanguage(next) {
  lang = next;
  const dict = translations[lang];
  root.lang = lang;
  langLabel.textContent = lang.toUpperCase();
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    if (dict[el.dataset.i18n]) el.textContent = dict[el.dataset.i18n];
  });
  try { localStorage.setItem("site-booster:lang", lang); } catch (e) { /* storage unavailable */ }
  updateSightSlider();
}

langButton.addEventListener("click", () => applyLanguage(lang === "fr" ? "en" : "fr"));

/* ---------- Listeners ---------- */

window.addEventListener("scroll", requestTick, { passive: true });
window.addEventListener("resize", () => {
  updateSightSlider();
  requestTick();
});
window.addEventListener(
  "pointermove",
  (event) => {
    targetMouseX = event.clientX / window.innerWidth - 0.5;
    targetMouseY = event.clientY / window.innerHeight - 0.5;
    requestTick();
  },
  { passive: true }
);
sightPrev.addEventListener("click", () => moveSightSlider(-1));
sightNext.addEventListener("click", () => moveSightSlider(1));

document.querySelectorAll(".fiverr-link").forEach((link) => { link.href = FIVERR_URL; });

setupSightSlider();
try {
  const saved = localStorage.getItem("site-booster:lang");
  if (saved === "en") applyLanguage("en");
} catch (e) { /* storage unavailable */ }
requestTick();
