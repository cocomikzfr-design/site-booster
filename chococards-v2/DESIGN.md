# ChocoCards v2 — « Atelier Holo » · Design & build bible

Homepage of **ChocoCards**, a trading-card shop (TCG) at Rue du Géant 15, 1400 Nivelles, Belgium.
This document is the contract for the 5 section builders who work in parallel.
**Read it all before touching a file.** Visible text is always French, and code comments are in French.

---

## 0. TL;DR for builders

1. **Your files:** `css/s-<you>.css`, `js/sections/<you>.js` and the HTML between your own `<!-- ===== SECTION:<id> START/END ===== -->` markers (see §10).
2. **Shared files:** `base.css`, `sections.css`, `js/core/*`, `js/data.js`, `js/main.js`, the `<head>` and the CORE blocks of `index.html`. **Do not edit them.** If something there blocks you, write the workaround in your own file (see §10.3).
3. Your module exports `init(ctx)`. It is called once, after `render.js` has built every data-driven list and after GSAP and Lenis have loaded.
4. Your CSS is **outside every cascade layer**, so it always wins over the foundation. **Scope every selector** to your sections.
5. Text is **visible at rest**. Hide something only through the reveal system (`data-reveal…`) or a GSAP tween that is guaranteed to finish. Never leave text at opacity 0 waiting for an observer.
6. Every effect needs 3 behaviours:
   - desktop with a mouse;
   - phone (lighter, no hover, no pin unless trivial);
   - `prefers-reduced-motion` (no 3D motion and no scrubbing; show the final state).
7. Test with the tools in §12 at 360, 390, 1440 and 1920 px:
   - no horizontal overflow;
   - no console errors;
   - Lighthouse mobile performance ≥ 85 and accessibility 100 for the whole page.

---

## 1. Concept

**« Atelier Holo »**: a holographic-foil lab at night, with the on-screen details of a Tokyo card shop (Néon Akiba) on top.

The page is a dark **stage** whose colour changes with each section: ink violet, gala plum, deep emerald, cobalt, crimson and so on. Living light blobs drift across it.

On this stage sit:

- **Real product cut-outs**, lit like objects on a table.
- **Paper sheets**: big rounded panels in Papier, Citron, Menthe, Rose or Lilas that carry the editorial sections. They give the light, colourful moments and fix the old flat-brown problem.
- **ChocoCards card backs** (`assets/img/marque/dos-de-carte.svg|webp`). The design is:
  - a holo border;
  - a 2×3 "chocolate tablet" of plum squares;
  - a CC monogram.

  This is the brand device used in 3D, in the preloader and on placeholders.
- **Mono read-outs**: Geist Mono for set codes, prices, the countdown and badges.

The polish of the AI-template look ("movento") is kept:

- a glass pill header;
- an Instrument Serif *italic* accent word in each heading;
- blur and line reveals;
- bento grids;
- grain.

We go further with real 3D, card physics and holo foil that follows the pointer.

### Hard rules (from the brief)
- **No Pokémon, One Piece or Bandai characters or logos drawn by us.** The shop's real photos are fine. Decoration is generic ChocoCards material only: card backs, foil, typography, abstract 3D.
- **No fake product renders.** A product without a photo uses the typographic **slot card**, driven by data:
  - `slotVisual()`: set code + format + holo;
  - `data.js`: setting `image` to a real path or URL swaps in the photo.

  Never put a real photo of one product on another product.
- **Allowed external hosts** (exact versions only):
  - `cdn.jsdelivr.net/npm` for `gsap@3.13.0` (+ ScrollTrigger and SplitText), `lenis@1.1.13` and `three@0.160.0`. They are loaded by `js/core/libs.js` and the import map.
  - unpkg and cdnjs are allowed but not used.
  - Fonts are self-hosted. **No other host at runtime.**
- Total size < 16 MB. The foundation is currently about 1.6 MB.

---

## 2. Non-negotiables (quality bar)

| Topic | Rule |
|---|---|
| Contrast | WCAG AA **at every moment**: during cross-fades, on hover, mid-animation and over photos. Text on the stage is Papier `#FBF7EE` or Brume `#DDD8F3`. Coloured text on the stage is only Citron, Menthe or Cyan (`--accent-text`). Text on sheets is Encre. Gradient (holo) text is **only for type ≥ 24 px**. |
| Visible at rest | Content is readable without JS, without CDN, without WebGL and with JS errors (§6.4). |
| Motion | Animate only `transform` and `opacity` (plus `filter: blur` on short headings). Never animate `background-position`, `width`, `top` or `clip-path` in loops. One-off clip reveals are OK if short. |
| WebGL | At most **one renderer per canvas**, created lazily. It pauses off-screen and when the tab is hidden. DPR caps are 1.5 desktop, 1.25 tablet and 1 phone. Phones get a lighter scene. A CSS fallback is always present. |
| Performance | 60 fps desktop and smooth on a mid-range phone. Lighthouse mobile performance ≥ 85 (the foundation measures 0.88–0.90) and TBT < 200 ms. Nothing heavy before `app:ready`. Three.js is imported **after** `app:ready` plus idle time (or on first interaction on a phone). |
| A11y | Lighthouse accessibility 100. Every interaction works with the keyboard. Focus is always visible (`--focus`). Skip link, ARIA dialogs, `aria-live` for the cart and toast. `prefers-reduced-motion` means no 3D motion, no smooth scroll and final states shown. |
| Layout | No horizontal overflow from 360 to 1920 px. Touch targets ≥ 44 px. |
| Console | Zero errors or warnings in the console (network failures in tests excepted). |

---

## 3. Palette & tokens (`css/base.css` §1–3)

| Token | Hex | Use |
|---|---|---|
| `--c-encre` | `#0E0A24` | Night ink. Text on sheets and stage base. |
| `--c-encre-2` / `-3` | `#17123A` / `#241D52` | Raised dark surfaces (drawers, slots). |
| `--c-papier` | `#FBF7EE` | Text on the stage; Papier sheet. |
| `--c-brume` | `#DDD8F3` | Secondary text on the stage (≥ 5:1 measured everywhere). |
| `--c-violet` | `#8B6CFF` | Fills and badge « Précommande » (Encre on it 5.2:1). **Never text on the stage.** |
| `--c-cyan` `--c-menthe` `--c-citron` | `#2EE6FF` `#5CF2B5` `#FFD43B` | Accents. **The only colours allowed as text on the stage.** |
| `--c-rose` `--c-rose-clair` `--c-corail` | `#FF5DB1` `#FF8AC8` `#FF7A59` | Fills and glows only (never small text on the stage). |
| `--c-lilas` `--c-lilas-vif` `--c-ciel` `--c-peche` `--c-or` | `#D9CEFF` `#B9A8FF` `#BDEBFF` `#FFC9A8` `#F0BE4E` | Sheets, tiles, card halos. |
| `--c-violet-ink` `--c-bleu-ink` `--c-teal-ink` `--c-rose-ink` `--c-or-ink` | `#5A3FE0` `#1D4ED8` `#0A7470` `#C0177A` `#8A5A00` | Coloured text on Papier (≥ 4.8:1). |
| `--holo` | lilas → cyan → menthe → citron → rose | Foil text on the stage (≥ 24 px) and holo buttons (Encre text). |
| `--holo-ink` | violet-ink → bleu-ink → teal-ink → rose-ink | Foil text on the Papier sheet. |

**Surface variables.** Use these instead of hard-coded colours. They switch automatically with the surface:

- `--fg`, `--fg-2`, `--line`, `--line-strong`;
- `--focus`, `--accent`, `--accent-text`, `--holo-text`;
- `--glass`, `--glass-strong`, `--glass-line`;
- `--btn-ink-bg`, `--btn-ink-fg`.

**Named tones** (`data-couleur="citron|menthe|cyan|rose|violet|lilas|corail|peche|ciel|or"`) set `--tone` and `--tone-2` for product halos, tiles and slots.

**Measured contrast on the stage.** The tool is `scratchpad/v2/tools/worlds-phase.js`: 12 worlds × 7 drift phases × desktop and phone. The worst luminance is **0.096**. That gives these minimum ratios:

- Papier ≥ 6.7:1;
- Brume ≥ 5.1:1;
- Cyan ≥ 4.75:1;
- Citron ≥ 5:1;
- Menthe ≥ 5:1.

During a cross-fade, the mix of two dark worlds is never lighter than the lighter of the two, because luminance is convex in sRGB. **If you add glows or light on the stage behind text, re-run that tool.**

---

## 4. Typography

| Role | Font (self-hosted woff2, latin subset) | Notes |
|---|---|---|
| Display (h1–h3, wordmark, codes in slots) | **Unbounded Variable** 200–900 | Weights 600–800, tracking −0.025em (wordmark −0.055em). Its zero looks like an O: put set codes in mono where legibility matters. |
| Accent word (one per heading) | **Instrument Serif Italic** | `<em class="accent">`, 1.14em, holo fill. Also used for « Bienvenue chez ». |
| Body / UI | **Inter Variable** | 16–17 px body, 600–650 for UI labels. |
| Read-outs (codes, prices, dates, countdown, badges, eyebrows) | **Geist Mono Variable** | Uppercase, tracking 0.06–0.14em, `tnum` + `zero`. |

The fluid scale:

- `--fs-2xs` 12 px;
- `--fs-xs` 13;
- `--fs-sm` 15;
- `--fs-base` 16 → 17;
- `--fs-lead` 17 → 21;
- `--fs-h4` 17 → 20;
- `--fs-h3` 20 → 28;
- `--fs-h2` 34 → 76;
- `--fs-h1` 44 → 104.

The hero and footer wordmark fit the container width exactly: `calc(min(100vw - 2*gutter, 1440px) / 7.75)`, measured ratio 7.5em.

Classes: `.h1 .h2 .h3 .h4 .eyebrow .lead .mono .accent .holo-text`.

---

## 5. Grid & layout

- `.container`: max 1440 px with gutters `clamp(16px, 4.2vw, 64px)`. Gap is `clamp(12px, 1.6vw, 24px)`. A 12-column helper is available as `.grid-12`.
- Breakpoints: phone < 768 · tablet 768–1023 · desktop ≥ 1024 · wide ≥ 1440 (wide tweaks ≥ 1600).
- **Section rhythm:** `.section` padding is `clamp(88px, 11vw, 176px)`. Section heads use `.section-head` (`--center`, `--split`) and stay under 68rem.
- **Sheets:** `.sheet[data-surface="papier|citron|menthe|rose|lilas|…"]`:
  - radius `--r-xl`;
  - inner padding `clamp(28,5vw,80) / clamp(20,4.6vw,72)`;
  - optional `.sheet--cut` for the angled card corner.
- **Header:** sticky glass pill. `--header-h` is 72 px on phones and 124 px from 1024 px (2 rows: bar + nav). Anchor offsets use it.
- Radii: `--r-xs 8`, `--r-sm 12`, `--r-md 18`, `--r-lg 26`, `--r-xl 28–48`, `--r-card 22`.

---

## 6. Motion

### 6.1 Eases & durations (CSS ↔ JS mirrors in `js/core/motion.js`)
| Name | CSS | GSAP | For |
|---|---|---|---|
| out | `--ease-out` cubic-bezier(.16,1,.3,1) | `expo.out` | reveals, arrivals |
| inOut | `--ease-in-out` (.65,0,.35,1) | `power3.inOut` | scene changes, camera |
| back | `--ease-back` (.34,1.56,.64,1) | `back.out(1.4)` | card deal, bumps |
| soft | `--ease-soft` (.25,.8,.25,1) | `power2.out` | hovers |

Durations:

- micro .18 s (hover colour);
- short .35 s (hover transforms);
- base .6 s;
- reveal .9 s;
- scene 1.2–1.6 s.

Staggers:

- characters .02 s;
- words .04 s;
- lines .09 s;
- cards .07–.08 s.

### 6.2 Choreography per section (default)
1. The eyebrow appears.
2. The h2 lines rise from their masks (`data-reveal="lines"`).
3. The lead fades up.
4. The CTAs follow.
5. Then the media and cards stagger in.

The whole entrance takes ≤ 1.2 s. Media never waits more than 0.4 s behind its title. **Scroll-scrubbed scenes are reserved for 3 moments:**

- hero exit;
- précommande booster;
- sorties horizontal track.

Each scene is pinned at most 150 vh, on desktop only. Never stack two pins back to back.

### 6.3 Interaction vocabulary
| Interaction | Where it lives | Notes |
|---|---|---|
| Tilt + foil highlight | `[data-tilt]` (core/tilt.js) | Mouse only. Use the `.foil` child for the sheen. |
| Magnetic buttons | `[data-magnetic]` (core/magnetic.js) | GSAP drives the transform, so CSS has no transform transition. |
| Cursor states | `data-cursor="Voir"`, `"Glisser"`, `"Ajouter"`, `"lien"`, `"cache"` (core/cursor.js) | The system cursor stays visible. |
| Card physics | each section builder | Deal (`back.out(1.4)`), flip, fan, flick. |
| Velocity skew on drag tracks | showcase | clamp(v × 0.15, ±5°) via `gsap.quickTo`. |
| Scramble text | any builder | For codes, prices, countdown. Only ≤ 8 characters and only on change. |

### 6.4 Reveal system (core/reveal.js) and its fail-safes

**Attributes.** Put them on **wrappers**, never on an element that has its own transform or transition:

- `data-reveal`, with the values `up` (default), `fade`, `scale`, `blur` and `lines`;
- `data-reveal-stagger`, which reveals the direct children one by one;
- `style="--delay:120ms"`.

**What happens on arm:**

- `lines` headings are split lazily, about 60 % of a screen before they enter.
- The split is reverted after the animation, so resizing is safe.

**Fail-safes:**

- `html.anim-ready` is set only after setup succeeds.
- Whatever is already in view at arm time is shown without animation.
- A sweep runs on scroll, on resize and every 1.5 s for 30 s, and reveals anything above the viewport bottom.
- `beforeprint` reveals everything.
- Any uncaught error or rejection removes `anim-ready`, so everything shows.
- Under reduced motion nothing is ever hidden.

**After adding content dynamically**, call `observeReveals(container)`.

### 6.5 Reduced motion
`prefers-reduced-motion` (or `?motion=reduce`, which adds `html.reduced`) does the following:

- no preloader;
- no Lenis;
- no cursor, magnetism or tilt;
- CSS animations and transitions are cut by an `!important` rule in a layer, which your unlayered CSS cannot override;
- WebGL `start()` renders **one still frame**.

Use `gsap.matchMedia()` with a `reduce` condition and show final states.

---

## 7. The colour-world system

### 7.1 Stage (fixed background), `core/worlds.js` + `base.css` §3
- `<div class="stage" data-stage>` is fixed with `z-index: -1` and sits under all content (do not put a background on `<body>`).
- There is one layer per world. A layer is a base colour plus 3 radial blobs (`--w-1/2/3`) that drift in CSS (34–46 s) and follow the mouse slightly. A grain tile sits on top.
- When a `[data-world]` section crosses the **middle of the viewport**, the new layer fades in (opacity only, 0.9 s). Inactive layers are `display:none`.
- API:
  - `setWorld(name)`, for example when a 3D scene wants another mood;
  - `getWorld()`;
  - `onWorldChange(cb)`;
  - `html[data-world-active]` for non-critical CSS hooks.
- Each section also gets world tokens: `--accent`, `--accent-2` and `--accent-text`.

### 7.2 World map
| Section | data-world | Stage mood | Sheet on top |
|---|---|---|---|
| hero | `nuit` | ink + violet/cyan glow | — |
| anniversaire | `gala` | plum + gold/rose | **Papier** (gold-ink accents, giant « 30 ») |
| explorer | `prisme` | indigo + rose/menthe/citron | colourful bento tiles |
| precommande | `delta` | deep emerald + menthe/cyan | — (dramatic) |
| sorties | `cobalt` | cobalt + cyan/violet | **Citron** |
| pokemon | `foudre` | night blue + electric yellow | Papier product cards |
| one-piece | `corsaire` | crimson-wine + coral/gold | Papier product cards |
| autres-tcg | `arcade` | violet + cyan/rose/menthe | dark game cards |
| bannieres | `lagon` | deep teal | **Lilas** + **Menthe** banners |
| communaute | `rose` | magenta | **Rose** sheet |
| tournois | `violet` | royal violet + citron | Papier tickets |
| boutique | `menthe` | dark mint + citron | **Papier** |
| confiance, footer | `nuit` | back to ink | glass cards |

The rhythm is dark → light → dark …, which makes the page **dynamic and colourful, never flat brown**.

### 7.3 Rules
- A section is transparent. Use a **sheet** to make it light.
- Never put `data-world` and `data-surface` on the same element.
- To add a world: give it a stage rule and a `[data-world]` rule in `base.css` (foundation owner). Then check that its max luminance stays ≤ 0.10 with `worlds-phase.js`.

---

## 8. Section storyboard (15 blocks, in order)

The **baseline** is already built: layout, real photos, data, working cart, search, drawers and reveals.
Each builder **adds** the motion described below and owns the polish.

### 1. marquee (hero builder)
- **Baseline:** a Citron strip with 4 mono messages. A CSS loop moves via transform. An `aria-hidden` copy makes the loop seamless. It pauses on hover. Under reduced motion it becomes a static, centred list.
- **Add:**
  - speed and a slight skew driven by scroll velocity (`onScroll` → `velocity`);
  - the sparkle icon spins on hover.
  - On phones: just the loop.

### 2. header (chrome builder)
- **Baseline:**
  - a glass pill with the logo, a search field ("/" hint), BE/FR and FR/EN toggles, account and cart with a count;
  - a mega-menu row (data-driven, panels `hidden`);
  - drawers and search through core/ui.js (focus trap, Esc, inert, scroll lock).
- **Add:**
  - hide the header on scroll down and show it on scroll up (transform);
  - compact state after 80 px (the nav row folds);
  - mega-menu: hover intent of 120 ms, click and keyboard (arrows, Esc); the panel scales from the top with its featured card;
  - locale listboxes, with full keyboard support;
  - `/` and Ctrl/⌘K open the search, and the result list supports arrow keys;
  - the cart badge bumps on `cart:add`;
  - the mobile drawer staggers its links.

### 3. hero (hero builder): « Le Deck »
- **Baseline:**
  - chip « Notre magasin est ouvert ! »;
  - h1 « *Bienvenue chez* » + a giant **ChocoCards** holo wordmark at the bottom on desktop and in the flow on phones;
  - lead, hours pill with live open/closed status (Brussels time), address pill, CTAs (Instagram holo + « Explorer la boutique »);
  - CSS poster `.deck`: 5 card backs fanned behind the **real** ETB 30 ans, the Japanese 30th Celebration booster and the Pikachu-ex 30 card;
  - an empty `canvas[data-hero-canvas]`.
- **Add on desktop (WebGL):**
  - 7 card backs (`cardGeometry` + `createFoilMaterial` with `loadCardBack`) plus the 3 photos as textured planes (`loadTexture`, 480/800 px files), layered in depth;
  - pointer parallax with spring and inertia (lusion style), with the foil following the pointer;
  - intro on `app:ready`: cards deal from the deck (`back.out(1.4)`, stagger .06) and the wordmark letters rise (SplitText chars, mask);
  - scroll exit (scrub over the hero height): the cards spread outward, the camera dollies in, the centre card flips, then hand over to « 30 ans »;
  - the poster cross-fades out on the first rendered frame (`.hero.is-gl .deck{opacity:0}`).
- **Phone:**
  - 4 cards + 3 photos, DPR 1, no antialiasing;
  - start after `app:ready` + idle, or on first touch;
  - gentle idle motion, no scroll scrub.
- **Reduced motion or no WebGL:** keep the CSS poster with static float.
- **Preloader:** the hero builder may refine it with `setPreloaderExit(fn)` (≤ 0.8 s). The deck could literally become the hero deck.

### 4. anniversaire (showcase builder): Pokémon fête ses 30 ans
- **Baseline:**
  - Papier sheet with a gold « 30 » outline numeral;
  - head + lead (« vendue exclusivement en boutique physique »);
  - 4 product cards: ETB with its real photo; UPC, Mini Tin and Bundle as slots;
  - the exclusive note pill.
  - Phones get a horizontal snap list.
- **Add on desktop:**
  - **stacking cards** (sticky): the card underneath scales to .92 and dims;
  - or a 3D coverflow;
  - plus a **graded slab** moment: the real Pikachu-ex photo in a CSS-3D acrylic case that turns with the scroll or pointer;
  - « 30 » parallax.
- **Phone:** snap carousel with a light tilt-on-scroll.

### 5. explorer (univers builder): Explorez la boutique
- **Baseline:**
  - a 9-tile bento, 4 columns on desktop and 2 on phones;
  - 5 real composition photos;
  - 4 slot tiles: Cartes gradées, Goodies, Accessoires, Autres TCG;
  - each tile has its own tone; tilt and foil come from core;
  - tiles that are menu anchors (`#japonais`, `#cartes-unite`, `#cartes-gradees`, `#goodies`) get that id automatically.
- **Add:**
  - Zentry-style hover: the photo lifts in z, the colour wash grows and the arrow turns;
  - a staggered deal-in reveal;
  - a « Glisser » cursor is not needed here.

### 6. precommande (booster builder): ME06 — Règne Delta
- **Baseline:**
  - title, date, text and countdown, all bound to `data.precommandeVedette`. The countdown ticks every second in render.js;
  - 2 mini product rows with Précommander buttons;
  - stage: the **real ME06 ETB photo**, 3 fanned card backs, an outlined « ME06 » and an empty `canvas[data-booster-canvas]`.
- **Add on desktop:**
  - a pinned (≤ 150 vh) scroll-scrubbed **booster opening**: a **ChocoCards-branded pack** (generic brand material; never print franchise art on it) tears open at the top, card backs burst out in a fan, then the real ETB photo rises;
  - countdown digits scramble or flip on change. Add `data-render-custom` on `.countdown` to take over the ticking.
- **Phone:** the pack opens once when it enters (IntersectionObserver) or on tap. No pin.

### 7. sorties (booster builder): Prochaines sorties TCG
- **Baseline:**
  - Citron sheet;
  - 4 dark release cards with a big date, weekday, « dans N jours », game, code, text and a « Voir » link;
  - past dates disappear automatically.
- **Add:**
  - ≥ 1024 px: pinned horizontal track with a progress line;
  - < 1024 px: a vertical timeline whose line draws through `scaleY`;
  - cards flip in.

### 8–9. pokemon / one-piece (showcase builder): product shelves
- **Baseline:**
  - horizontal scroll-snap tracks (`#piste-pokemon`, `#piste-one-piece`) with prev/next buttons (core/ui.js) and keyboard scrolling;
  - 8 cards each, with real photos where they exist and slots elsewhere;
  - status badges (disponible, précommande, bientôt, rupture, non disponible en ligne) and FR/JP/EN language badges;
  - add-to-cart flies to the cart.
- **Add:**
  - drag with inertia and a velocity skew, using the « Glisser » cursor;
  - card hover with tilt and foil (already there) and the image lifting;
  - optional **single shared WebGL hover canvas** (desktop, one for both shelves) for a holo or ripple on photos;
  - a micro state on the add button (« Ajouté ✓ » for 1.2 s).
  - Keep the buttons and the keyboard working.

### 10. autres-tcg (univers builder)
- **Baseline:**
  - 5 typographic game cards (Dragon Ball, Digimon, Gundam, Lorcana, Riftbound): a big two-letter sigle in the game's two colours, then name and tagline;
  - desktop: a fanned hand;
  - phone: a snap row.
- **Add:**
  - hovering a card pulls it up and spreads its neighbours;
  - a deal-in from a deck on reveal.

### 11. bannieres (univers builder)
- **Baseline:**
  - Lilas « Protégez vos trésors » banner (`id="accessoires"`) with CSS sleeves and a card back;
  - Menthe « Retrait gratuit en boutique » banner with a perforated pickup ticket (« 0,00 € »).
- **Add:**
  - the sleeves fan out on hover or reveal;
  - the ticket gets stamped « Prêt ✓ »;
  - magnetic CTAs (already there).

### 12. communaute (univers builder)
- **Baseline:**
  - Rose sheet with the text, the « Suivre @chococards.be » CTA and 6 tiles;
  - 2 tiles use real shop compositions: Arrivage One Piece and Import Japon;
  - 4 are typographic Instagram tiles until the owner supplies post photos.
- **Add:** tiles float at different scroll speeds (parallax, transform), tilt on hover and a caption slide.

### 13. tournois (univers builder)
- **Baseline:**
  - 3 ticket cards: 24, 25 and 31 Oct, 14h, 8 €, « S'inscrire » (a pre-filled mailto);
  - a static lanyard badge « Store Tournament · One Piece » on desktop.
- **Add on desktop:** a **draggable lanyard badge** (8-point verlet rope, plain JS + transforms, or a tiny canvas) that you can grab and fling (Vercel Ship style). Keep it `aria-hidden` and keyboard-irrelevant.
- **Add on all sizes:** the ticket perforation « tears » on hover.

### 14. boutique (univers builder)
- **Baseline:**
  - Papier sheet: address, live open/closed status, weekly hours with **today highlighted**, parking, pickup, next tournament;
  - CTAs (Itinéraire, Voir les tournois, Contact);
  - a stylised SVG map (illustration) with a pin;
  - a typographic poster « Rue du Géant 15 » standing in for the shop photo;
  - 4 stats (`data-count-to`).
- **Add:** the map route draws once (`stroke-dashoffset` on reveal), the pin drops with a bounce, and the stats count up.

### 15. confiance + footer (chrome builder)
- **Baseline:**
  - 5 glass trust cards with tone icons;
  - footer: brand + contact, Boutique and Infos columns (`id="guides"`), newsletter (demo validation in core/ui.js), payments, giant holo wordmark, legal links.
- **Add:**
  - icons animate in (line draw or bounce);
  - the footer wordmark reacts to the pointer through transform or a mask, never a looping `background-position`;
  - a back-to-top button.
  - To fully own the newsletter form, add `data-render-custom` on it.

---

## 9. WebGL plan

| Canvas | Owner | When created | Budget |
|---|---|---|---|
| `canvas[data-hero-canvas]` (« Le Deck ») | hero | Desktop: right after `app:ready`. Phone: on idle after `app:ready` or first touch. Never under reduced motion (keep the poster), or render 1 still frame at most. | ≤ 40 draw calls, ≤ 60k tris, textures: 3 photos (480/800 px) + 1 card back. Desktop DPR ≤ 1.5, phone 1. |
| `canvas[data-booster-canvas]` | booster | When precommande is near (`whenNear`). | ≤ 25 draw calls. Pause off-screen (automatic). |
| Shelf hover canvas (optional) | showcase | Desktop with mouse, on first card hover. | 1 plane per hovered card. Destroy or idle when the pointer leaves the shelves. |
| Graded slab / lanyard | showcase / univers | **CSS 3D preferred.** A canvas only if justified. | — |

**At most 2 canvases render at the same time.** Visibility pausing in `createRenderer` makes this automatic as long as you pass `observe: sectionEl`.

**Shared helpers** (`js/core/webgl.js`):

- `loadThree()`, through the import map. Bare `import('three')` and `three/addons/…` work.
- `createRenderer(canvas, { observe, onFrame, onResize, dprMax, antialias })`, which returns `handle`:
  - set `handle.scene` and `handle.camera`, then the helper renders after `onFrame(t, dt, handle)`;
  - `start`, `stop` and `renderOnce` are available;
  - pausing on IntersectionObserver and `visibilitychange` is automatic;
  - under reduced motion it renders one frame;
  - on context loss the canvas gets `.is-gl-lost`;
  - a duplicate call on the same canvas returns the same handle.
- `loadTexture(url, { renderer, premultiply })`: sRGB, cached, premultiplied for cut-outs (no dark fringes).
- `loadCardBack(renderer)`.
- `createFoilMaterial(THREE, { map, tint, strength, mask: 'full'|'luma', opacity, side })`:
  - the uniforms to animate are `uTime` and `uPointer` (a Vector2 in −1..1);
  - it works on photos (use `mask:'luma'` so dark areas stay clean) and on card backs.
- `cardGeometry(THREE, { width, height, radius })`: a rounded card with UVs 0–1.
- `trackPointer(el)`: a smoothed pointer in −1..1.

**Failure path:** if `createRenderer` rejects (no WebGL, `?gl=0`), catch it and keep the CSS visual. Never show an empty box.

---

## 10. Files, contracts & ownership

### 10.1 Layout
```
chococards-v2/
  index.html            15 blocks, SECTION markers, CORE blocks (stage, preloader, sprite, toast)
  DESIGN.md             this file
  css/base.css          @layer reset/base/components/utilities: tokens, fonts, surfaces, worlds, components
  css/sections.css      @layer baseline: zero-risk baseline layout of every section (one block per section)
  css/s-hero.css s-chrome.css s-showcase.css s-booster.css s-univers.css   ← builders (UNLAYERED: they win)
  js/data.js            ALL business content (owner-editable, French comments)
  js/main.js            boot sequence (§10.4)
  js/core/libs.js       loadLibs() + live exports gsap / ScrollTrigger / SplitText / Lenis (null if CDN failed)
  js/core/motion.js     prefs (reduced, finePointer, mobile, desktop, tier, webgl), EASE, DUR, BP, onPrefsChange
  js/core/utils.js      $, $$, clamp, lerp, mapRange, debounce, throttle, wait, nextFrame, onIdle, whenNear, onVisible, emit, on, esc, loadImage, rafLoop
  js/core/format.js     formatPrix, dateParts, today, daysUntil, relativeDays, upcoming, statutInfo, getProduit, produitsDe, timeLeft, openState
  js/core/templates.js  icon, mark, badgeStatut, badgeLangue, slotVisual, productVisual, productCta, productCard, categoryTile, releaseItem, eventItem, otherTcgItem, instaItem, hoursRows, cartLine
  js/core/render.js     renderAll(): fills every [data-render] + [data-bind] + [data-countdown]
  js/core/scroll.js     initScroll, scrollTo, lockScroll/unlockScroll, onScroll, getScroll, getLenis, refreshScroll
  js/core/split.js      splitText(el, { type, mask }) → { lines, words, chars, revert }
  js/core/reveal.js     armReveals, observeReveals, reveal, revealAll, disarmReveals
  js/core/worlds.js     initWorlds, setWorld, getWorld, onWorldChange
  js/core/tilt.js       initTilt, tilt(el)
  js/core/magnetic.js   initMagnetic, magnetic(el)
  js/core/cursor.js     initCursor, setCursor(state, text)
  js/core/cart.js       cart (lines/count/total/add/setQty/remove/clear/has), flyToCart(imageEl), initCart
  js/core/ui.js         toast, openOverlay/closeOverlay/isOverlayOpen, initScrollers, initUI
  js/core/webgl.js      §9
  js/core/preloader.js  runPreloader, setPreloaderExit
  js/sections/hero.js chrome.js showcase.js booster.js univers.js   ← builders: export function init(ctx)
  assets/fonts/         4 woff2 + OFL licences
  assets/img/produits/  6 real cut-outs (800 px) + 480 px versions of the 3 hero photos
  assets/img/categories/  5 real compositions (600 px)
  assets/img/marque/    dos-de-carte.svg/.webp (brand card back), grain.png
```

### 10.2 HTML contract
- Every block sits between `<!-- ===== SECTION:<id> START ===== -->` and `<!-- ===== SECTION:<id> END ===== -->`.
- The ids are: `marquee, header, hero, anniversaire, explorer, precommande, sorties, pokemon, one-piece, autres-tcg, bannieres, communaute, tournois, boutique, confiance, footer`.
- **Keep:**
  - section ids;
  - `data-world`;
  - `aria-labelledby` and heading ids;
  - the heading order: one h1 in the hero, h2 per section, h3 per card;
  - every `data-render` container, unless you take it over (below);
  - the `data-add-to-cart`, `data-product` and `data-fly` hooks;
  - `data-cart-target` and `data-cart-count`;
  - `data-overlay*`.
- **Data-driven containers** (`data-render="…"`) are filled by `render.js` before your `init`. To take one over:
  1. add `data-render-custom` in your markup;
  2. render it yourself with `templates.js` building blocks (`productCard`, `slotVisual`, …), reading `ctx.data`;
  3. call `observeReveals(container)`, `initTilt(container)` and `initMagnetic(container)` for new nodes.
- Icons: use `<svg><use href="#i-…"/></svg>` from the CORE sprite. For a new icon, inline it in your section.
- Overlays (inside SECTION:header):
  - `[data-overlay="menu|search|cart"]` contains `.overlay__backdrop` and `.overlay__panel[role=dialog]`;
  - openers carry `[data-overlay-open="id"]` and closers `[data-overlay-close]`;
  - style the `.is-open` state and listen to `overlay:open` / `overlay:close`.

### 10.3 CSS contract
- The foundation is fully inside `@layer reset, base, components, baseline, utilities`. **Your files are unlayered** and beat it whatever the specificity.
- That means:
  - scope everything (`.hero …`, `#tournois …`), never bare `button {}` or `h2 {}`;
  - to restyle a baseline element, write the same class in your file;
  - to drop a baseline rule, override the property (for example `animation: none`).
- Use the tokens:
  - colours: `var(--c-*)`, `--fg`, `--tone`;
  - eases and durations: `--ease-*`, `--d-*`;
  - radii: `--r-*`;
  - spacing: `--gutter`, `--section-y`.
- Name your keyframes with your prefix: `hero-…`, `chrome-…`, `show-…`, `boost-…`, `univ-…`. `cc-…` is reserved for the foundation.
- The reduced-motion kill switch is a layered `!important`, so you cannot re-enable animations under reduced motion.

### 10.4 Boot sequence & JS contract (`js/main.js`)
1. The preloader starts. The boot waits until the hero images are decoded and painted (≤ 1.2 s), so the LCP is not delayed by JS.
2. `loadLibs()` starts (GSAP 3.13 + ScrollTrigger + SplitText, Lenis 1.1.13). At the same time `renderAll()` fills the data in small tasks. Then `initUI`, `initCart` and `initWorlds` run.
3. Libraries are ready (or null). `initScroll()` runs: Lenis with a mouse only, synced on `gsap.ticker`.
4. `hero.init(ctx)` → `chrome.init(ctx)` → cursor.
5. Fonts are ready (≤ 3 s), then idle → `showcase.init` → `booster.init` → `univers.init`.
6. `initTilt`, `initMagnetic`, `armReveals`, `refreshScroll`.
7. The preloader ends → `window.__ready = true` → `document` event **`app:ready`** (detail = ctx).

`ctx = { data, prefs, gsap, ScrollTrigger, SplitText, Lenis, lenis }`. Any of them can be `null`, so always guard:

```js
const { gsap, ScrollTrigger } = ctx;
if (!gsap || ctx.prefs.reduced) return; // the baseline already looks finished
```

Further rules:

- `init` may be `async`. Wrap risky parts in try/catch. An error is isolated (`console.error`) but must never happen in the final page.
- Heavy work (ScrollTrigger pins, WebGL) goes inside `whenNear(sectionEl, fn)` or `app:ready`. After creating pins, call `refreshScroll()`.
- Use `gsap.matchMedia()` for desktop, phone and reduced variants, and clean up on breakpoint change.
- **Events:**
  - `app:ready`;
  - `preloader:progress` {progress};
  - `cart:change` {lines,count,total};
  - `cart:add` {product,qty,source};
  - `overlay:open` / `overlay:close` {id,el};
  - `webgl:lost` {canvas}.
- `window.__app = { status, errors, scrollTo(target, {immediate, offset}), ctx }`. The tooling uses it; do not remove it.
- Debug URL params:
  - `?nopreload`;
  - `?motion=reduce`;
  - `?gl=0`;
  - `?nolibs` (simulates a CDN failure);
  - `?today=2026-10-24` (date-based lists).

### 10.5 Ownership table
| Builder | HTML (between markers) | CSS | JS | Signature work |
|---|---|---|---|---|
| **hero** | `SECTION:marquee`, `SECTION:hero` | `css/s-hero.css` | `js/sections/hero.js` (+ may call `setPreloaderExit`) | WebGL « Le Deck » with the real photos + holo card backs, intro, scroll exit, marquee velocity |
| **chrome** | `SECTION:header` (header, mega-menu, mobile drawer, search, cart drawer), `SECTION:confiance`, `SECTION:footer` | `css/s-chrome.css` | `js/sections/chrome.js` | Header states, mega-menu, search UX, cart drawer polish, trust icons, footer wordmark |
| **showcase** | `SECTION:anniversaire`, `SECTION:pokemon`, `SECTION:one-piece` | `css/s-showcase.css` | `js/sections/showcase.js` | Product cards, stacking / 3D carousel, graded slab, drag shelves, WebGL hover on photos, add-to-cart feel |
| **booster** | `SECTION:precommande`, `SECTION:sorties` | `css/s-booster.css` | `js/sections/booster.js` | 3D booster opening with the real ME06 photo, countdown, pinned horizontal timeline |
| **univers** | `SECTION:explorer`, `SECTION:autres-tcg`, `SECTION:bannieres`, `SECTION:communaute`, `SECTION:tournois`, `SECTION:boutique` | `css/s-univers.css` | `js/sections/univers.js` | Bento hover, hand of cards, banners, Instagram parallax, draggable lanyard badge, map and stats |
| **foundation** (art director) | `<head>`, CORE blocks (stage, preloader, sprite, toast) | `base.css`, `sections.css` | `main.js`, `data.js`, `core/*` | Tokens, worlds, reveal, cart, WebGL helpers, tooling |

Shared files are owned by the foundation. If a change there is **unavoidable**, append a clearly delimited block at the end of the file, nothing else:

```
/* >>> <builder> : <reason> */ … /* <<< <builder> */
```

Never reformat or reorder shared files. Never edit another builder's markers or files. Never `git add` outside `chococards-v2/`.

---

## 11. Content & data (`js/data.js`)

- `boutique`: address, phone, e-mail, Instagram, directions, parking, pickup. `horaires[0..6]` (0 = Sunday) with `ouverture` and `fermeture` gives the live status in Brussels time.
- `statuts`: disponible, precommande, bientot, rupture, boutique. These are the labels, the button text and whether the product can be bought.
- `langues`: FR, JP, EN.
- `produits[]`: `{ id, nom, court?, prix, statut, categorie: 'pokemon-30-ans'|'pokemon'|'one-piece', langue, code, format, couleur, image|null, detoure }`.
- `precommandeVedette`:
  - `produitId`, `autresIds`, title parts;
  - `image` (real ME06 ETB);
  - `sortie` (ISO), `sortieTexte`, `texte`.
- `categories[9]`, `sorties[]`, `autresTcg[5]`, `evenements[]` (mailto registration) and `instagram[6]`. Each item has `image|null` and `couleur`.
- `menu[]`: mega-menu columns plus a featured card.

**Real photos in use:**

- products: ETB 30 ans, ME06 ETB, booster JP 30th, Pikachu-ex 30, OP-16, OP-17;
- categories: pokemon, one-piece, japonais, cartes-à-l'unité, précommandes.

**Everything else is a slot card on purpose.** The owner can drop their own or official distributor photos (that the shop is entitled to use) into `image`.

---

## 12. Tooling & testing

The scratchpad is `/tmp/claude-0/-home-user-site-booster/d4131a4e-77f5-5eb9-9950-f2948fd7b46d/scratchpad`, called `$SP` below. **Always use the IP 192.0.2.2. Kill only your own PIDs.**

| Tool | Command |
|---|---|
| Static server (MIME woff2/webp/png/json/glb, gzip) | `node $SP/v2/static-server-v2.js /home/user/site-booster/chococards-v2 <PORT> > /dev/null 2>&1 & echo $! > $SP/v2/<you>.pid` |
| Same, with CDN served locally (for Lighthouse) | add `--local-cdn` (rewrites jsdelivr, unpkg and cdnjs URLs to `/__cdn/…`, served from `$SP/libs/node_modules`, exact versions installed on demand) |
| Screenshots + overflow + console report | `timeout 200 node $SP/v2/shoot-v2.js http://192.0.2.2:<PORT>/ <OUTDIR> desktop\|wide\|mobile\|small\|tablet\|reduced\|reduced-mobile [#id \| y=px \| full] [--wait=ms] [--no-ready]`. It waits for `window.__ready` and prints `overflow`, `offenders` and console errors. |
| Lighthouse mobile, 4 categories | `node $SP/v2/tools/lh-v2.js http://192.0.2.2:<LH_PORT>/ <OUTDIR> 1` against a `--local-cdn` server. `is-on-https` / `redirects-http` failures are sandbox-only. |
| Foundation interaction test | `node $SP/v2/tools/interact.js http://192.0.2.2:<PORT>/ <OUTDIR> desktop\|mobile` (cart, fly, drawer focus trap, Esc, search, scroller, newsletter, WebGL helper) |
| Reveal fail-safe test | `node $SP/v2/tools/reveal-test.js http://192.0.2.2:<PORT>/ desktop\|mobile` (nothing may stay hidden) |
| Stage contrast audit | `node $SP/v2/tools/worlds-phase.js <OUTDIR> 1440 900` then measure (see §3) |

Ports used by the foundation: 8710 (plain), 8711 (`--local-cdn`).
Suggested ports for builders: hero 8721/8731, chrome 8722/8732, showcase 8723/8733, booster 8724/8734, univers 8725/8735.

**Foundation results** (21 Oct 2026):

- no console errors and no overflow at 360, 390, 820, 1440 and 1920 px, including in reduced-motion modes;
- Lighthouse mobile: performance 0.88–0.90 (TBT 10–20 ms, CLS 0), accessibility 1.00, SEO 1.00 (best practices 0.79 only because of HTTP in the sandbox);
- the page keeps working with the CDN blocked.

---

## 13. Known gaps (deliberately left to builders or the owner)
- **No WebGL scene is built yet.** Only helpers and CSS posters exist (hero, précommande).
- **Missing photos, shown as slot cards:**
  - products: UPC, Mini Tin, Booster Bundle 30 ans, ME06 / ME05 / OP displays, ME05 booster, Tripack, Premium, Starter, Double Pack;
  - categories: gradées, goodies, accessoires, autres TCG;
  - 4 Instagram posts;
  - the shop photo (typographic poster);
  - banner photos (CSS art).
- **Dropdown behaviour** (country, language), mega-menu panels, the "/" shortcut, a ticking countdown with style, drag shelves, stacking cards, pinned tracks, the lanyard badge and count-ups are builder work. The baseline markup and states are ready.
- **Demo-only:** the cart is local and checkout shows a toast; the newsletter only validates; links to pages that do not exist yet (`#compte`, legal pages) are placeholders, and in Shopify they become collection and page URLs.
