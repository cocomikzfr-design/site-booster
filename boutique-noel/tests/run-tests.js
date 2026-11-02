// Tests navigateur du thème sur la simulation locale (section 18 du cahier des charges).
// Lancement : npm install puis npm test, dans ce dossier.
process.env.FAKE_NOW = process.env.FAKE_NOW || '2026-11-10T11:00:00Z';
const fs = require('fs');
const simulation = require('./server');
const { chromium } = require('playwright');

const BASE = 'http://localhost:9393';
const FAKE_NOW = new Date('2026-11-10T11:00:00Z'); // 10 novembre 2026, 12 h à Bruxelles
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const results = [];
const only = process.argv[2];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'OK' : 'KO'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function open(browser, { width = 375, height = 740, reducedMotion = 'no-preference', js = true, time = FAKE_NOW } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion, javaScriptEnabled: js, locale: 'fr-BE', timezoneId: 'Europe/Brussels' });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (error) => page.errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') page.errors.push(message.text()); });
  if (js) await page.clock.install({ time });
  return { context, page };
}

async function reset(page, overrides) {
  await page.goto(`${BASE}/?__reset=1`);
  if (overrides) await page.goto(`${BASE}/?__set=${overrides}`);
}

const PAGES = ['/', '/products/pack-facade-de-noel', '/products/projecteur-de-noel-led', '/products/couronne-de-noel-lumineuse',
  '/products/guirlande-neige-qui-tombe', '/products/sapin-feutrine-enfant', '/products-default', '/collections/noel', '/collections', '/cart',
  '/search?q=guirlande', '/search?q=zzz', '/pages/contact', '/pages/livraison', '/page-qui-n-existe-pas', '/password'];

async function sweep(browser) {
  for (const width of [320, 375, 390, 768, 1280]) {
    const { context, page } = await open(browser, { width });
    await reset(page);
    const overflow = [];
    const h1Issues = [];
    const errors = [];
    const axeIssues = [];
    for (const url of PAGES) {
      await page.goto(BASE + url, { waitUntil: 'load' });
      await page.waitForTimeout(150);
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        h1: document.querySelectorAll('h1').length
      }));
      if (info.overflow > 0) overflow.push(`${url} (+${info.overflow}px)`);
      if (info.h1 !== 1) h1Issues.push(`${url} (${info.h1})`);
      const realErrors = page.errors.splice(0).filter((e) => !(url === '/page-qui-n-existe-pas' && e.includes('status of 404')));
      if (realErrors.length) errors.push(`${url}: ${realErrors.join(' | ')}`);
      if (width === 375 || width === 1280) {
        await page.addScriptTag({ content: axeSource });
        const violations = await page.evaluate(async () => {
          const report = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
          return report.violations.filter((v) => ['serious', 'critical'].includes(v.impact) || ['heading-order', 'landmark-unique', 'region'].includes(v.id))
            .map((v) => `${v.id}[${v.impact}] ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`);
        });
        if (violations.length) axeIssues.push(`${url}: ${violations.join(' || ')}`);
      }
    }
    record(`${width}px : aucun défilement horizontal`, !overflow.length, overflow.join(', '));
    record(`${width}px : un seul h1 par page`, !h1Issues.length, h1Issues.join(', '));
    record(`${width}px : aucune erreur JavaScript`, !errors.length, errors.join(' // '));
    if (width === 375 || width === 1280) record(`${width}px : accessibilité axe (sérieux/critique)`, !axeIssues.length, axeIssues.join(' /// '));
    await context.close();
  }
}

async function home(browser) {
  const { context, page } = await open(browser, { width: 375, height: 667 });
  await reset(page);
  await page.goto(BASE + '/');
  const h1InHero = await page.evaluate(() => document.querySelectorAll('h1').length === 1 && Boolean(document.querySelector('.hero h1')));
  record('Accueil : le titre du hero est le seul h1', h1InHero);
  const packTop = await page.evaluate(() => document.querySelector('.featured-pack').getBoundingClientRect().top / window.innerHeight);
  record('Accueil : pack visible après au plus un écran de défilement', packTop < 2, `haut du pack à ${packTop.toFixed(2)} écran`);

  const digits = await page.evaluate(() => Array.from(document.querySelectorAll('.hero [data-unit-value]')).map((e) => e.textContent.trim()));
  record('Compte à rebours cohérent avec le 8 décembre 23 h 59 (Bruxelles)', ['28,11,59', '28,11,58'].includes(digits.join(',')), `affiché : ${digits.join(' / ')}`);

  const estimate = await page.textContent('.featured-pack [data-delivery-text]');
  record('Dates de livraison J+7 à J+12 en français', /17 nov\..*22 nov\./.test(estimate), estimate.trim());
  const range = await page.textContent('.delivery-timeline [data-delivery-text]');
  record('Frise de livraison avec les dates estimées', /17 nov\..*22 nov\./.test(range), range.trim());

  const addButton = page.locator('.featured-pack button[name="add"]');
  await addButton.click();
  await page.waitForSelector('cart-drawer.is-open', { timeout: 3000 }).catch(() => {});
  const afterAdd = await page.evaluate(() => ({
    open: document.querySelector('cart-drawer').classList.contains('is-open'),
    count: (document.querySelector('#cart-icon-bubble .cart-count') || {}).textContent,
    focus: document.activeElement && document.activeElement.id,
    announce: document.getElementById('ThemeAnnouncer').textContent,
    lines: document.querySelectorAll('cart-drawer .cart-item').length
  }));
  await page.waitForTimeout(100);
  const announce = await page.textContent('#ThemeAnnouncer');
  record('Ajout du pack : tiroir ouvert, pastille à 1, focus sur le titre', afterAdd.open && afterAdd.count === '1' && afterAdd.focus === 'CartDrawerTitle' && afterAdd.lines === 1, JSON.stringify(afterAdd));
  record('Ajout du pack : annonce pour lecteur d\'écran', /a été ajouté au panier/.test(announce), announce);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const afterClose = await page.evaluate(() => ({ hidden: document.querySelector('cart-drawer').hidden, focusIsButton: document.activeElement.matches('.featured-pack button[name="add"]') }));
  record('Tiroir : fermeture par Échap et focus rendu au bouton', afterClose.hidden && afterClose.focusIsButton, JSON.stringify(afterClose));

  const summary = page.locator('.faq summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  const openedEnter = await page.evaluate(() => document.querySelector('.faq details').open);
  await page.keyboard.press('Space');
  const closedSpace = await page.evaluate(() => !document.querySelector('.faq details').open);
  record('FAQ : ouverture au clavier (Entrée, Espace)', openedEnter && closedSpace);

  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(200);
  record('En-tête collant avec ombre au défilement', await page.evaluate(() => document.querySelector('.header').classList.contains('is-scrolled') && getComputedStyle(document.querySelector('.section-header')).position === 'sticky'));

  await page.goto(BASE + '/');
  await page.keyboard.press('Tab');
  record('Clavier : le lien d\'évitement est le premier élément focusable', await page.evaluate(() => document.activeElement.classList.contains('skip-link')));
  await context.close();
}

async function deadlineStates(browser) {
  let { context, page } = await open(browser, { width: 1280 });
  await reset(page, 'delivery_deadline_date=2026-11-01');
  for (const url of ['/', '/products/projecteur-de-noel-led', '/cart']) {
    await page.goto(BASE + url);
    const state = await page.evaluate(() => ({
      digits: document.querySelectorAll('[data-countdown-digits]').length,
      passed: document.querySelectorAll('.countdown__passed').length,
      after: Array.from(document.querySelectorAll('[data-deadline-after]')).every((e) => !e.hidden),
      warning: Array.from(document.querySelectorAll('[data-delivery-after]')).every((e) => !e.hidden)
    }));
    record(`Date limite passée ${url} : message partout, sans compte à rebours`, state.digits === 0 && state.passed > 0 && state.after && state.warning, JSON.stringify(state));
  }
  await context.close();

  ({ context, page } = await open(browser, { width: 1280 }));
  await reset(page, 'season_mode=off_season');
  for (const url of ['/', '/products/pack-facade-de-noel', '/cart']) {
    await page.goto(BASE + url);
    const state = await page.evaluate(() => ({
      countdowns: document.querySelectorAll('deadline-countdown').length,
      deadlineSection: document.querySelectorAll('.delivery-deadline').length,
      warnings: document.querySelectorAll('[data-delivery-after]').length,
      christmasText: (() => { const clone = document.body.cloneNode(true); clone.querySelectorAll('[id^="TabPanel-description"], [hidden], script').forEach((e) => e.remove()); return /avant Noël|après Noël/.test(clone.textContent); })()
    }));
    record(`Hors saison ${url} : aucun message lié à Noël`, !state.countdowns && !state.deadlineSection && !state.warnings && !state.christmasText, JSON.stringify(state));
  }
  await context.close();

  ({ context, page } = await open(browser, { width: 1280, time: new Date('2026-12-08T22:58:30Z') }));
  await reset(page);
  await page.goto(BASE + '/');
  const before = await page.evaluate(() => document.querySelectorAll('[data-countdown-digits]').length);
  await page.clock.fastForward('02:00');
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => ({
    digits: document.querySelectorAll('[data-countdown-digits]').length,
    passed: document.querySelectorAll('.countdown__passed').length,
    after: Array.from(document.querySelectorAll('[data-deadline-after]')).every((e) => !e.hidden)
  }));
  record('Compte à rebours : bascule en direct à 23 h 59 sur « date limite passée »', before > 0 && after.digits === 0 && after.passed > 0 && after.after, `avant : ${before} compteurs, après : ${JSON.stringify(after)}`);
  await context.close();
}

async function productDesktop(browser) {
  const { context, page } = await open(browser, { width: 1280, height: 900 });
  await reset(page);
  await page.goto(BASE + '/products/guirlande-neige-qui-tombe');
  const initialMedia = await page.getAttribute('.product__media-item.is-active', 'data-media-id');
  await page.click('label:has-text("Blanc chaud")');
  await page.waitForTimeout(100);
  const variantState = await page.evaluate(() => ({
    url: location.search,
    media: document.querySelector('.product__media-item.is-active').dataset.mediaId,
    button: document.querySelector('.product-form [name="add"]').textContent.trim(),
    disabled: document.querySelector('.product-form [name="add"]').disabled,
    legend: document.querySelector('[data-option-value]').textContent
  }));
  record('Variante : URL, image, bouton et libellé mis à jour', variantState.url.includes('variant=') && variantState.media !== initialMedia && !variantState.disabled && variantState.legend === 'Blanc chaud', JSON.stringify(variantState));
  await page.click('label:has-text("Multicolore")');
  const soldOut = await page.evaluate(() => ({ button: document.querySelector('.product-form [name="add"]').textContent.trim(), disabled: document.querySelector('.product-form [name="add"]').disabled, struck: document.querySelector('input[value="Multicolore"]').classList.contains('is-unavailable') }));
  record('Variante indisponible : barrée, bouton « Épuisé » désactivé', soldOut.disabled && soldOut.button === 'Épuisé' && soldOut.struck, JSON.stringify(soldOut));

  await page.click('.product__thumbnail >> nth=2');
  const thumbState = await page.evaluate(() => ({ active: Array.from(document.querySelectorAll('.product__media-item')).findIndex((i) => i.classList.contains('is-active')), current: document.querySelector('.product__thumbnail[aria-current="true"]').dataset.galleryGoto }));
  record('Galerie ordinateur : miniatures cliquables', thumbState.active === 2 && thumbState.current === '2', JSON.stringify(thumbState));

  await page.click('.product__media-item.is-active .product__media-zoom');
  const zoomOpen = await page.evaluate(() => document.querySelector('[data-zoom-dialog]').open && Boolean(document.querySelector('[data-zoom-target] img')));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const zoomClosed = await page.evaluate(() => !document.querySelector('[data-zoom-dialog]').open && document.activeElement.classList.contains('product__media-zoom'));
  record('Zoom : ouvert au clic, fermé avec Échap, focus rendu', zoomOpen && zoomClosed);

  const tabs = await page.evaluate(() => !document.querySelector('.product-tabs__list').hidden);
  await page.focus('.product-tabs__tab >> nth=0');
  await page.keyboard.press('ArrowRight');
  const tabState = await page.evaluate(() => ({
    selected: Array.from(document.querySelectorAll('.product-tabs__tab')).findIndex((t) => t.getAttribute('aria-selected') === 'true'),
    visible: Array.from(document.querySelectorAll('[data-tab-item]')).filter((i) => !i.hidden).length,
    focus: document.activeElement.getAttribute('role')
  }));
  await page.keyboard.press('End');
  const endIndex = await page.evaluate(() => Array.from(document.querySelectorAll('.product-tabs__tab')).findIndex((t) => t.getAttribute('aria-selected') === 'true'));
  record('Onglets ordinateur : navigation au clavier (flèches, Fin)', tabs && tabState.selected === 1 && tabState.visible === 1 && tabState.focus === 'tab' && endIndex === 3, JSON.stringify({ ...tabState, endIndex }));

  const packCta = {};
  for (const handle of ['projecteur-de-noel-led', 'guirlande-neige-qui-tombe', 'pack-facade-de-noel']) {
    await page.goto(`${BASE}/products/${handle}`);
    packCta[handle] = await page.locator('.pack-cta').count();
  }
  record('Bloc « Encore mieux en pack » : projecteur et guirlande oui, pack non', packCta['projecteur-de-noel-led'] === 1 && packCta['guirlande-neige-qui-tombe'] === 1 && packCta['pack-facade-de-noel'] === 0, JSON.stringify(packCta));

  const templates = {};
  for (const [handle, marker] of [['pack-facade-de-noel', 'réunis dans un seul colis'], ['projecteur-de-noel-led', '16 motifs de Noël projetés'], ['couronne-de-noel-lumineuse', 'souhaite la bienvenue'], ['guirlande-neige-qui-tombe', 'Une pluie de lumière'], ['sapin-feutrine-enfant', 'décorent eux-mêmes']]) {
    await page.goto(`${BASE}/products/${handle}`);
    templates[handle] = (await page.textContent('.product__subtitle')).includes(marker);
  }
  record('Chaque produit affiche les textes de son modèle', Object.values(templates).every(Boolean), JSON.stringify(templates));
  const verify = await page.evaluate(() => document.body.innerText.includes('[À VÉRIFIER'));
  record('Les mentions [À VÉRIFIER] restent visibles', verify);
  const sale = await page.evaluate(() => document.querySelectorAll('.price--on-sale, [data-price-badge]:not([hidden])').length);
  record('Aucune réduction affichée sans prix barré', sale === 0);
  await context.close();
}

async function productMobile(browser) {
  const { context, page } = await open(browser, { width: 375, height: 740 });
  await reset(page);
  await page.goto(BASE + '/products/projecteur-de-noel-led');
  await page.evaluate(() => { const list = document.querySelector('[data-media-list]'); list.scrollTo({ left: list.querySelectorAll('[data-media-item]')[1].offsetLeft - 16 }); });
  await page.waitForTimeout(400);
  const gallery = await page.evaluate(() => ({ counter: document.querySelector('[data-gallery-counter]').textContent, dot: document.querySelector('.product__dot[aria-current="true"]').dataset.galleryGoto }));
  record('Galerie mobile : défilement, points et compteur à jour', gallery.counter === 'Image 2 sur 3' && gallery.dot === '1', JSON.stringify(gallery));
  const accordion = await page.evaluate(() => document.querySelector('.product-tabs__list').hidden && !document.querySelector('product-tabs').classList.contains('is-tabs'));
  record('Onglets en accordéon sur mobile', accordion);
  const estimate = await page.textContent('.product__info [data-delivery-text]');
  record('Fiche produit : livraison estimée en français', /entre le .*17 nov\..*22 nov\./.test(estimate), estimate.trim());

  const visibleAtStart = await page.evaluate(() => document.querySelector('sticky-atc').classList.contains('is-visible'));
  await page.evaluate(() => { const b = document.querySelector('.product-form [name="add"]'); window.scrollTo({ top: b.getBoundingClientRect().top + window.scrollY + 300, behavior: 'instant' }); });
  await page.waitForTimeout(300);
  const visibleAfter = await page.evaluate(() => document.querySelector('sticky-atc').classList.contains('is-visible') && document.body.classList.contains('has-sticky-atc'));
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const hiddenAtFooter = await page.evaluate(() => !document.querySelector('sticky-atc').classList.contains('is-visible'));
  await page.evaluate(() => { const b = document.querySelector('.product-form [name="add"]'); window.scrollTo({ top: b.getBoundingClientRect().top + window.scrollY + 300, behavior: 'instant' }); });
  await page.waitForTimeout(300);
  await page.click('sticky-atc [data-sticky-button]');
  await page.waitForSelector('cart-drawer.is-open', { timeout: 3000 }).catch(() => {});
  const added = await page.evaluate(() => (document.querySelector('#cart-icon-bubble .cart-count') || {}).textContent);
  record('Barre collante : apparaît après le bouton, disparaît au pied de page, ajoute le produit', !visibleAtStart && visibleAfter && hiddenAtFooter && added === '1', JSON.stringify({ visibleAtStart, visibleAfter, hiddenAtFooter, added }));
  await context.close();
}

async function cartDrawer(browser) {
  const { context, page } = await open(browser, { width: 375 });
  await reset(page);
  await page.goto(BASE + '/collections/noel');
  await page.click('.product-card:has-text("Projecteur") button[name="add"]');
  await page.waitForSelector('cart-drawer.is-open');
  const upsellVisible = await page.locator('cart-drawer [data-cart-upsell]').count();
  await page.click('cart-drawer .cart-item button[name="plus"]');
  await page.waitForFunction(() => document.querySelector('cart-drawer [data-cart-subtotal]').textContent.includes('59,80'), null, { timeout: 3000 }).catch(() => {});
  const afterPlus = await page.evaluate(() => ({ subtotal: document.querySelector('cart-drawer [data-cart-subtotal]').textContent.trim(), bubble: document.querySelector('#cart-icon-bubble .cart-count').textContent, focus: document.activeElement.closest('cart-drawer') !== null }));
  record('Tiroir : quantité modifiée, sous-total et pastille à jour sans rechargement', afterPlus.subtotal === '59,80 €' && afterPlus.bubble === '2' && afterPlus.focus, JSON.stringify(afterPlus));
  record('Tiroir : suggestion visible quand la guirlande n\'est pas dans le panier', upsellVisible === 1);
  const withdrawal = await page.locator('cart-drawer .cart-summary__withdrawal').textContent();
  record('Tiroir : rappel des 14 jours de rétractation', withdrawal.includes('14 jours'), withdrawal.trim());
  await page.click('cart-drawer [data-cart-remove]');
  await page.waitForSelector('cart-drawer .cart-drawer__empty', { timeout: 3000 }).catch(() => {});
  const empty = await page.evaluate(() => ({ text: document.querySelector('cart-drawer').innerText.includes('Votre panier est vide'), bubble: document.querySelectorAll('#cart-icon-bubble .cart-count').length, cards: document.querySelectorAll('cart-drawer .product-card').length }));
  record('Tiroir : article retiré, panier vide avec suggestions', empty.text && empty.bubble === 0 && empty.cards === 2, JSON.stringify(empty));
  await page.keyboard.press('Escape');

  await page.goto(BASE + '/products/guirlande-neige-qui-tombe');
  await page.click('.product-form [name="add"]');
  await page.waitForSelector('cart-drawer.is-open');
  const upsellHidden = await page.locator('cart-drawer [data-cart-upsell]').count();
  record('Tiroir : suggestion masquée quand la guirlande est déjà dans le panier', upsellHidden === 0);
  await Promise.all([page.waitForURL('**/checkout'), page.click('cart-drawer button[name="checkout"]')]);
  record('Bouton « Passer commande » : redirige vers le paiement', page.url().endsWith('/checkout'));
  await context.close();
}

async function cartPage(browser) {
  const { context, page } = await open(browser, { width: 1280 });
  await reset(page, 'cart_type=page');
  await page.goto(BASE + '/products/pack-facade-de-noel');
  await Promise.all([page.waitForURL('**/cart'), page.click('.product-form [name="add"]')]);
  const lines = await page.locator('.main-cart .cart-item').count();
  record('Panier en mode page : l\'ajout mène à la page panier', lines === 1 && (await page.locator('cart-drawer').count()) === 0);
  await page.click('.main-cart button[name="plus"]');
  await page.waitForFunction(() => document.querySelector('.main-cart [data-cart-subtotal]').textContent.includes('89,80'), null, { timeout: 3000 }).catch(() => {});
  record('Page panier : mise à jour instantanée de la quantité', (await page.textContent('.main-cart [data-cart-subtotal]')).includes('89,80'));
  await page.click('.main-cart [data-cart-remove]');
  await page.waitForSelector('.main-cart__empty', { timeout: 3000 }).catch(() => {});
  record('Page panier : panier vide géré', await page.locator('.main-cart__empty').count() === 1);
  await context.close();
}

async function noJs(browser) {
  const { context, page } = await open(browser, { width: 375, js: false });
  await reset(page);
  await page.goto(BASE + '/products/guirlande-neige-qui-tombe');
  const picker = await page.evaluate(() => ({ pickerHidden: getComputedStyle(document.querySelector('variant-picker')).display === 'none', select: Boolean(document.querySelector('select[name="id"]')) }));
  record('Sans JavaScript : liste déroulante des variantes à la place des pastilles', picker.pickerHidden && picker.select, JSON.stringify(picker));
  await page.selectOption('select[name="id"]', { label: 'Blanc chaud – 24,90 €' });
  await Promise.all([page.waitForURL('**/cart'), page.click('.product-form [name="add"]')]);
  const lines = await page.locator('.main-cart .cart-item').count();
  const variant = await page.textContent('.main-cart .cart-item__options');
  await page.fill('.main-cart .quantity__input', '3');
  await Promise.all([page.waitForURL('**/cart'), page.click('button[name="update"]')]);
  const quantity = await page.inputValue('.main-cart .quantity__input');
  await Promise.all([page.waitForURL('**/cart'), page.click('.main-cart [data-cart-remove]')]);
  const empty = await page.locator('.main-cart__empty').count();
  record('Sans JavaScript : ajout, mise à jour et suppression par formulaires classiques', lines === 1 && variant.includes('Blanc chaud') && quantity === '3' && empty === 1, JSON.stringify({ lines, variant: variant.trim(), quantity, empty }));
  await context.close();
}

async function navigation(browser) {
  let { context, page } = await open(browser, { width: 375 });
  await reset(page);
  await page.goto(BASE + '/');
  await page.click('.header__menu-toggle');
  await page.waitForTimeout(300);
  const opened = await page.evaluate(() => ({ open: document.querySelector('menu-drawer').classList.contains('is-open'), expanded: document.querySelector('.header__menu-toggle').getAttribute('aria-expanded'), focusInside: document.querySelector('menu-drawer').contains(document.activeElement), locked: document.body.classList.contains('is-locked') }));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() => ({ hidden: document.querySelector('menu-drawer').hidden, focusToggle: document.activeElement.classList.contains('header__menu-toggle'), unlocked: !document.body.classList.contains('is-locked') }));
  await page.click('.header__menu-toggle');
  await page.waitForTimeout(300);
  await page.click('.menu-drawer__details summary');
  const subOpen = await page.evaluate(() => document.querySelector('.menu-drawer__details').open);
  await page.mouse.click(370, 400);
  await page.waitForTimeout(300);
  const overlayClosed = await page.evaluate(() => document.querySelector('menu-drawer').hidden);
  record('Menu mobile : ouverture, sous-menu, Échap, superposition, focus rendu', opened.open && opened.expanded === 'true' && opened.focusInside && opened.locked && closed.hidden && closed.focusToggle && closed.unlocked && subOpen && overlayClosed, JSON.stringify({ opened, closed, subOpen, overlayClosed }));

  const footer = await page.evaluate(() => ({ policies: document.querySelectorAll('.footer__policies a').length, payments: document.querySelectorAll('.footer .payment-icons li').length, social: document.querySelectorAll('.footer .social-links').length }));
  record('Pied de page : politiques, paiements, réseaux sociaux seulement si renseignés', footer.policies === 2 && footer.payments === 4 && footer.social === 0, JSON.stringify(footer));
  await context.close();

  ({ context, page } = await open(browser, { width: 1280 }));
  await reset(page);
  await page.goto(BASE + '/');
  await page.hover('.header__submenu');
  const hoverOpen = await page.evaluate(() => document.querySelector('.header__submenu').open);
  await page.mouse.move(10, 600);
  const hoverClosed = await page.evaluate(() => !document.querySelector('.header__submenu').open);
  record('Sous-menu ordinateur : ouverture au survol', hoverOpen && hoverClosed);

  await page.goto(BASE + '/collections/noel');
  await Promise.all([page.waitForURL('**sort_by=price-ascending**'), page.selectOption('[data-sort-select]', 'price-ascending')]);
  record('Collection : tri automatique', page.url().includes('sort_by=price-ascending'));
  const count = await page.textContent('.collection-toolbar__count');
  record('Collection : nombre de produits affiché', count.includes('5 produits'), count.trim());

  await page.goto(BASE + '/search?q=guirlande');
  const found = await page.evaluate(() => Array.from(document.querySelectorAll('.search-results .card__title')).map((e) => e.textContent.trim()));
  await page.goto(BASE + '/search?q=zzz');
  const none = await page.textContent('.search-results__empty');
  record('Recherche : « guirlande » trouvée, mot absent → message', found.length === 1 && found[0].includes('Guirlande') && none.includes('Aucun résultat'), JSON.stringify(found));

  await page.goto(BASE + '/page-qui-n-existe-pas');
  record('Page 404 : titre et produits', (await page.textContent('h1')).includes('Page introuvable') && (await page.locator('.not-found__products .product-card').count()) === 3);

  await page.goto(BASE + '/pages/contact');
  const contact = await page.evaluate(() => ({ email: document.querySelector('#ContactEmail').required, body: document.querySelector('#ContactBody').required, labels: Array.from(document.querySelectorAll('#ContactForm input:not([type=hidden]), #ContactForm textarea')).every((f) => document.querySelector(`label[for="${f.id}"]`)) }));
  record('Contact : champs libellés, e-mail et message obligatoires', contact.email && contact.body && contact.labels, JSON.stringify(contact));

  await page.goto(BASE + '/password');
  record('Page mot de passe : affichage et formulaire', (await page.locator('form[action="/password"] input[type=password]').count()) === 1 && (await page.locator('meta[name=robots][content=noindex]').count()) === 1);
  await context.close();
}

async function motion(browser) {
  let { context, page } = await open(browser, { width: 375, reducedMotion: 'reduce' });
  await reset(page);
  await page.goto(BASE + '/');
  await page.waitForTimeout(200);
  const reduced = await page.evaluate(() => ({ flakes: document.querySelectorAll('.snow-layer__flake').length, revealHidden: Array.from(document.querySelectorAll('.reveal')).some((e) => getComputedStyle(e).opacity !== '1'), paused: document.querySelector('[data-announcement-toggle]').classList.contains('is-paused') }));
  record('Animations réduites : pas de neige, contenu visible, bandeau en pause', reduced.flakes === 0 && !reduced.revealHidden && reduced.paused, JSON.stringify(reduced));
  await context.close();

  ({ context, page } = await open(browser, { width: 1280 }));
  await reset(page);
  await page.goto(BASE + '/');
  const flakesDesktop = await page.locator('.snow-layer__flake').count();
  const first = await page.evaluate(() => Array.from(document.querySelectorAll('[data-announcement-slide]')).findIndex((s) => s.classList.contains('is-active')));
  await page.mouse.move(640, 600);
  await page.clock.fastForward(5100);
  const second = await page.evaluate(() => Array.from(document.querySelectorAll('[data-announcement-slide]')).findIndex((s) => s.classList.contains('is-active')));
  await page.click('[data-announcement-toggle]');
  await page.mouse.move(640, 600);
  await page.clock.fastForward(11000);
  const stillSecond = await page.evaluate(() => Array.from(document.querySelectorAll('[data-announcement-slide]')).findIndex((s) => s.classList.contains('is-active')));
  record('Bandeau : rotation toutes les 5 s et bouton pause', first === 0 && second === 1 && stillSecond === 1, JSON.stringify({ first, second, stillSecond }));
  record('Neige : 25 flocons sur ordinateur', flakesDesktop === 25, String(flakesDesktop));
  await context.close();

  ({ context, page } = await open(browser, { width: 375 }));
  await page.goto(BASE + '/');
  record('Neige : moitié moins de flocons sur mobile', (await page.locator('.snow-layer__flake').count()) === 13);
  await context.close();
}

async function extras(browser) {
    let page = await (await browser.newContext({ viewport: { width: 375, height: 740 } })).newPage();
  await page.clock.install({ time: new Date('2026-11-10T11:00:00Z') });
  await page.goto(BASE + '/?__reset=1');
  await page.goto(BASE + '/products/projecteur-de-noel-led');
  const note = await page.evaluate(() => Array.from(document.querySelectorAll('.product__collapsible [data-deadline-before]')).filter((e) => !e.hidden).map((e) => e.textContent.trim()));
  record('Phrase automatique avant la date limite', note[0] === 'Pour recevoir avant Noël, commandez au plus tard le 8 décembre.', note.join(' | '));
  const faqNote = await page.evaluate(() => Array.from(document.querySelectorAll('.faq [data-deadline-before]')).filter((e) => !e.hidden).length);
  record('Phrase automatique dans la FAQ produit', faqNote === 1, String(faqNote));
  await page.goto(BASE + '/?__set=delivery_deadline_date=2026-11-01');
  await page.goto(BASE + '/products/projecteur-de-noel-led');
  const after = await page.evaluate(() => Array.from(document.querySelectorAll('.product__collapsible [data-deadline-after]')).filter((e) => !e.hidden).map((e) => e.textContent.trim()));
  record('Phrase automatique après la date limite', after[0] === 'Les commandes passées maintenant arriveront après Noël.', after.join(' | '));
  await page.goto(BASE + '/?__reset=1');
  await page.goto(BASE + '/');
  const q2 = await page.evaluate(() => document.body.innerText.includes('Puis-je encore recevoir avant Noël'));
  await page.goto(BASE + '/?__set=season_mode=off_season');
  const q2Off = await page.evaluate(() => document.body.innerText.includes('Puis-je encore recevoir avant Noël'));
  const ld = await page.evaluate(() => Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => { try { JSON.parse(s.textContent); return true; } catch (e) { return false; } }));
  record('Question « avant Noël » masquée hors saison, données structurées valides', q2 && !q2Off && ld.every(Boolean), JSON.stringify({ q2, q2Off, ld }));

  await page.goto(BASE + '/?__reset=1');
  page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await page.goto(BASE + '/products/pack-facade-de-noel');
  await page.focus('.product-form [name="add"]');
  await page.keyboard.press('Enter');
  await page.waitForSelector('cart-drawer.is-open', { timeout: 3000 }).catch(() => {});
  let tabs = 0;
  for (; tabs < 40; tabs += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement.name === 'checkout')) break;
  }
  const inDrawer = await page.evaluate(() => document.activeElement.closest('cart-drawer') !== null);
  await Promise.all([page.waitForURL('**/checkout'), page.keyboard.press('Enter')]);
  record('Parcours clavier : ajout au panier puis paiement', inDrawer && page.url().endsWith('/checkout'), `${tabs + 1} tabulations jusqu'au bouton de paiement`);

  page = await (await browser.newContext({ viewport: { width: 640, height: 800 } })).newPage();
  const overflow = [];
  for (const url of ['/', '/products/guirlande-neige-qui-tombe', '/cart', '/collections/noel', '/pages/contact']) {
    await page.goto(BASE + url);
    const extra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (extra > 0) overflow.push(`${url} +${extra}`);
  }
  record('Zoom 200 % (640 px) : pas de contenu coupé ni de défilement horizontal', !overflow.length, overflow.join(', '));
}

(async () => {
  await simulation.start();
  const browser = await chromium.launch();
  const suites = { sweep, home, deadlineStates, productDesktop, productMobile, cartDrawer, cartPage, noJs, navigation, motion, extras };
  for (const [name, fn] of Object.entries(suites)) {
    if (only && only !== name) continue;
    try {
      await fn(browser);
    } catch (error) {
      record(`${name} : exécution`, false, error.message.split('\n')[0]);
    }
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} tests OK`);
  fs.writeFileSync(`${__dirname}/results.json`, JSON.stringify(results, null, 2));
  simulation.stop();
  process.exitCode = failed.length ? 1 : 0;
})();
