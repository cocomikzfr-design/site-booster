// Simulation locale d'une boutique Shopify pour tester le thème (rendu Liquid + panier AJAX).
// Ce n'est pas Shopify : les filtres et objets sont imités au plus près pour vérifier le HTML et le JavaScript.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { Liquid, Tag, Hash } = require('liquidjs');

const THEME = process.env.THEME || path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 9393);
const ORIGIN = `http://localhost:${PORT}`;
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(THEME, file), 'utf8'));
const locale = readJSON('locales/fr.default.json');

// ---------- Catalogue factice ----------
let mediaId = 1000;
function makeMedia(alt) {
  mediaId += 1;
  const preview = { id: mediaId, src: `/img/${mediaId}.svg`, width: 1200, height: 1200, aspect_ratio: 1, alt };
  return { ...preview, media_type: 'image', preview_image: preview };
}
let variantId = 5000;
function makeProduct(id, handle, title, price, suffix, options) {
  const media = [makeMedia(`${title} 1`), makeMedia(`${title} 2`), makeMedia(`${title} 3`)];
  let variants;
  let optionNames = ['Title'];
  if (options) {
    optionNames = [options.name];
    variants = options.values.map((value, index) => ({
      id: ++variantId, title: value, price, compare_at_price: null, available: value !== options.unavailable,
      options: [value], option1: value, featured_media: { id: media[index % media.length].id, preview_image: media[index % media.length].preview_image }
    }));
  } else {
    variants = [{ id: ++variantId, title: 'Default Title', price, compare_at_price: null, available: true, options: ['Default Title'], option1: 'Default Title', featured_media: null }];
  }
  const descriptionFile = path.join(THEME, 'content/produits', `${handle}.html`);
  const description = fs.existsSync(descriptionFile) ? fs.readFileSync(descriptionFile, 'utf8').replace(/<!--[\s\S]*?-->/, '') : '';
  return {
    id, handle, title, price, compare_at_price: null, price_varies: false, available: true, template_suffix: suffix,
    url: `/products/${handle}`, media, featured_media: media[0], variants, description,
    has_only_default_variant: !options, options: optionNames
  };
}
const products = {};
[
  makeProduct(1, 'pack-facade-de-noel', 'Pack Façade de Noël', 4490, 'pack'),
  makeProduct(2, 'projecteur-de-noel-led', 'Projecteur de Noël LED 16 motifs', 2990, 'projecteur'),
  makeProduct(3, 'couronne-de-noel-lumineuse', 'Couronne de Noël lumineuse 40 cm', 3490, 'couronne'),
  makeProduct(4, 'guirlande-neige-qui-tombe', 'Guirlande « neige qui tombe » 8 tubes', 2490, 'guirlande', { name: 'Couleur', values: ['Blanc froid', 'Blanc chaud', 'Multicolore'], unavailable: 'Multicolore' }),
  makeProduct(5, 'sapin-feutrine-enfant', 'Sapin de Noël en feutrine pour enfant, 100 cm', 1790, 'sapin')
].forEach((product) => { products[product.handle] = product; });

function productView(product, selectedVariantId) {
  const selected = product.variants.find((v) => String(v.id) === String(selectedVariantId)) || product.variants.find((v) => v.available) || product.variants[0];
  const optionsWithValues = product.has_only_default_variant ? [] : [{
    name: product.options[0], position: 1, selected_value: selected.options[0],
    values: product.variants.map((v) => ({ name: v.options[0], selected: v.id === selected.id, available: v.available, toString() { return v.options[0]; } }))
  }];
  const featured = selected.featured_media ? product.media.find((m) => m.id === selected.featured_media.id) : product.media[0];
  return { ...product, selected_or_first_available_variant: { ...selected, featured_media: featured }, options_with_values: optionsWithValues };
}
const allProducts = Object.values(products).map((p) => productView(p));
const collectionNoel = { id: 77, handle: 'noel', title: 'Décorations lumineuses de Noël', url: '/collections/noel', description: '<p>Projecteurs, guirlandes et décorations lumineuses.</p>', image: null, featured_image: null, products: allProducts, products_count: allProducts.length, all_products_count: allProducts.length, sort_by: null, default_sort_by: 'manual', sort_options: [{ value: 'manual', name: 'En vedette' }, { value: 'price-ascending', name: 'Prix croissant' }, { value: 'price-descending', name: 'Prix décroissant' }] };
const collections = { noel: collectionNoel, all: { ...collectionNoel, handle: 'all', title: 'Tous les produits', url: '/collections/all' } };
const menus = {
  'main-menu': { title: 'Menu principal', links: [
    { title: 'Accueil', url: '/', links: [] },
    { title: 'Le pack Façade de Noël', url: '/products/pack-facade-de-noel', links: [] },
    { title: 'Toutes les décorations', url: '/collections/noel', links: [{ title: 'Projecteur', url: '/products/projecteur-de-noel-led', links: [] }, { title: 'Guirlande', url: '/products/guirlande-neige-qui-tombe', links: [] }] },
    { title: 'Livraison', url: '/pages/livraison', links: [] },
    { title: 'Contact', url: '/pages/contact', links: [] }
  ] },
  footer: { title: 'Pied de page', links: [{ title: 'Livraison', url: '/pages/livraison', links: [] }, { title: 'Contact', url: '/pages/contact', links: [] }] }
};
const pages = {
  livraison: { title: 'Livraison', handle: 'livraison', url: '/pages/livraison', content: '<p>La livraison est offerte en France et en Belgique.</p><p>Vos décorations arrivent en 7 à 12 jours après votre commande.</p>' },
  contact: { title: 'Contact', handle: 'contact', url: '/pages/contact', content: '<p>Une question sur un produit, une commande ou une livraison ? Écrivez-nous.</p>' }
};

// ---------- Panier ----------
let cartLines = [];
function cartView() {
  const items = cartLines.map((line, index) => {
    const product = products[line.handle];
    const variant = product.variants.find((v) => v.id === line.variantId);
    return {
      key: `${variant.id}:k${index}`, id: variant.id, variant_id: variant.id, product_id: product.id, quantity: line.quantity,
      title: product.title, url: `${product.url}?variant=${variant.id}`, image: product.media[0].preview_image,
      product: { title: product.title, has_only_default_variant: product.has_only_default_variant },
      options_with_values: product.has_only_default_variant ? [] : [{ name: product.options[0], value: variant.options[0] }],
      final_price: variant.price, final_line_price: variant.price * line.quantity, original_line_price: variant.price * line.quantity,
      line_level_discount_allocations: [], url_to_remove: `/cart/change?line=${index + 1}&quantity=0`, product_title: product.title
    };
  });
  return {
    items, item_count: items.reduce((s, i) => s + i.quantity, 0), total_price: items.reduce((s, i) => s + i.final_line_price, 0),
    cart_level_discount_applications: [], note: '', currency: { iso_code: 'EUR' }
  };
}
function addVariant(variantIdValue, quantity) {
  const product = Object.values(products).find((p) => p.variants.some((v) => String(v.id) === String(variantIdValue)));
  if (!product) return null;
  const variant = product.variants.find((v) => String(v.id) === String(variantIdValue));
  if (!variant.available) return { error: 'Ce produit est épuisé.' };
  const existing = cartLines.find((l) => l.variantId === variant.id);
  if (existing) existing.quantity += quantity; else cartLines.push({ handle: product.handle, variantId: variant.id, quantity });
  return { product, variant };
}

// ---------- Moteur Liquid ----------
const imageRegistry = new Map();
const engine = new Liquid({
  root: [path.join(THEME, 'snippets')], partials: [path.join(THEME, 'snippets')], extname: '.liquid',
  strictFilters: true, dynamicPartials: true, cache: false
});
const isBlankValue = (v) => v === null || v === undefined || v === '';

function translate(key, args) {
  const params = Object.fromEntries(args.filter(Array.isArray));
  let value = key.split('.').reduce((node, part) => (node ? node[part] : undefined), locale);
  if (value === undefined) throw new Error(`Clé de traduction absente : ${key}`);
  if (typeof value === 'object') value = Number(params.count) === 1 ? value.one : value.other;
  return value.replace(/{{\s*(\w+)\s*}}/g, (m, name) => (params[name] !== undefined ? params[name] : m));
}
const formatAmount = (cents) => (Number(cents || 0) / 100).toFixed(2).replace('.', ',');
const kw = (args) => Object.fromEntries(args.filter(Array.isArray));

// Date à la manière de Shopify : chaînes interprétées à l'heure de la boutique (Bruxelles).
function brusselsOffsetMinutes(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]));
  return (Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - Math.floor(date.getTime() / 60000) * 60000) / 60000;
}
function toDate(value) {
  if (value instanceof Date) return value;
  if (value === 'now' || value === 'today') return process.env.FAKE_NOW ? new Date(process.env.FAKE_NOW) : new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?$/.exec(String(value).trim());
  if (!m) return null;
  const guess = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)));
  return new Date(guess.getTime() - brusselsOffsetMinutes(guess) * 60000);
}
function shopDate(value, format) {
  const date = toDate(value);
  if (!date) return value;
  const local = new Date(date.getTime() + brusselsOffsetMinutes(date) * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return format.replace(/%(-?)([sYmdeHM])/g, (m, flag, code) => {
    switch (code) {
      case 's': return String(Math.floor(date.getTime() / 1000));
      case 'Y': return String(local.getUTCFullYear());
      case 'm': return flag ? String(local.getUTCMonth() + 1) : pad(local.getUTCMonth() + 1);
      case 'd': return flag ? String(local.getUTCDate()) : pad(local.getUTCDate());
      case 'e': return String(local.getUTCDate()).padStart(2, ' ');
      case 'H': return pad(local.getUTCHours());
      case 'M': return pad(local.getUTCMinutes());
      default: return m;
    }
  });
}

const filters = {
  t: (key, ...args) => translate(key, args),
  money: (cents) => `${formatAmount(cents)} €`,
  money_without_currency: (cents) => formatAmount(cents),
  date: (value, format) => shopDate(value, format),
  divided_by: (v, arg) => (Number.isInteger(Number(v)) && Number.isInteger(Number(arg)) ? Math.floor(v / arg) : v / arg),
  divided_by_f: (v, arg) => Number(v) / Number(arg),
  times_f: (v, arg) => Number(v) * Number(arg),
  image_url: (image, ...args) => {
    if (!image) return '';
    const src = typeof image === 'string' ? image : (image.src || `/img/${image.id}.svg`);
    const url = `${src}?width=${kw(args).width || ''}`;
    imageRegistry.set(url, typeof image === 'string' ? {} : image);
    return url;
  },
  image_tag: (url, ...args) => {
    const o = kw(args);
    const image = imageRegistry.get(url) || {};
    const width = image.width || 1200;
    const height = image.height || 1200;
    const base = url.split('?')[0];
    const srcset = o.widths ? String(o.widths).split(',').map((w) => `${base}?width=${w.trim()} ${w.trim()}w`).join(', ') : '';
    const attrs = [`src="${url}"`, srcset && `srcset="${srcset}"`, o.sizes && `sizes="${o.sizes}"`, `width="${width}"`, `height="${height}"`,
      `alt="${o.alt === undefined ? (image.alt || '') : o.alt}"`, o.class && `class="${o.class}"`, o.loading && `loading="${o.loading}"`, o.fetchpriority && `fetchpriority="${o.fetchpriority}"`].filter(Boolean);
    return `<img ${attrs.join(' ')}>`;
  },
  placeholder_svg_tag: (name, cls) => `<svg class="${cls || ''}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100"></rect></svg>`,
  asset_url: (name) => `/assets/${name}`,
  shopify_asset_url: (name) => `/shopify-assets/${name}`,
  stylesheet_tag: (url) => `<link href="${url}" rel="stylesheet" type="text/css" media="all">`,
  preload_tag: (url, ...args) => { const o = kw(args); return `<link rel="preload" href="${url}" as="${o.as}" type="${o.type}" crossorigin="${o.crossorigin}">`; },
  font_face: () => '',
  font_url: () => '/fonts/body.woff2',
  font_modify: (font) => (font ? { ...font, weight: 700 } : font),
  payment_type_svg_tag: (type, ...args) => `<svg class="${kw(args).class || ''}" role="img" aria-label="${type}" viewBox="0 0 38 24"><rect width="38" height="24" rx="3"></rect></svg>`,
  video_tag: () => '<video muted playsinline></video>',
  media_tag: () => '',
  external_video_url: (v) => v,
  external_video_tag: () => '',
  structured_data: (product) => JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: product.title }),
  format_code: (code) => String(code).replace(/(.{4})/g, '$1 ').trim(),
  payment_button: () => ''
};
Object.entries(filters).forEach(([name, fn]) => engine.registerFilter(name, fn));

// Balises propres à Shopify
function blockTag(name, renderFn) {
  engine.registerTag(name, class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      this.args = token.args;
      this.templates = [];
      const stream = liquid.parser.parseStream(remain)
        .on(`tag:end${name}`, () => stream.stop())
        .on('template', (tpl) => this.templates.push(tpl))
        .on('end', () => { throw new Error(`tag ${name} non fermé`); });
      stream.start();
    }
    * render(ctx, emitter) { yield* renderFn.call(this, ctx, emitter); }
  });
}
engine.registerTag('schema', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    while (remain.length) { const t = remain.shift(); if (t.name === 'endschema') return; }
    throw new Error('schema non fermé');
  }
  render() { return ''; }
});
blockTag('style', function* (ctx, emitter) { emitter.write('<style>'); yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter); emitter.write('</style>'); });
blockTag('form', function* (ctx, emitter) {
  const match = /^\s*'([\w_]+)'\s*(?:,\s*([\w.]+)(?=\s*(?:,|$)))?\s*,?\s*(.*)$/s.exec(this.args);
  const type = match[1];
  const attrs = yield new Hash(match[3] || '').render(ctx);
  const actions = { product: '/cart/add', customer: '/contact#contact_form', contact: '/contact#contact_form', storefront_password: '/password' };
  const attrString = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
  emitter.write(`<form method="post" action="${actions[type] || '/'}" accept-charset="UTF-8" ${type === 'product' ? 'enctype="multipart/form-data"' : ''} ${attrString}><input type="hidden" name="form_type" value="${type}">`);
  ctx.push({ form: { 'posted_successfully?': false, errors: null, name: '', email: '', body: '', phone: '' } });
  yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
  ctx.pop();
  emitter.write('</form>');
});
blockTag('paginate', function* (ctx, emitter) {
  ctx.push({ paginate: { pages: 1, current_page: 1, parts: [], previous: null, next: null } });
  yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
  ctx.pop();
});
engine.registerTag('layout', class extends Tag { render() { return ''; } });
engine.registerTag('section', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.trim().replace(/['"]/g, ''); }
  * render(ctx, emitter) { const data = readJSON('config/settings_data.json'); const stored = (data.presets[data.current].sections || {})[this.name] || {}; emitter.write(yield renderSection(this.name, this.name, stored, ctx.globals)); }
});
engine.registerTag('sections', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.trim().replace(/['"]/g, ''); }
  * render(ctx, emitter) {
    const group = readJSON(`sections/${this.name}.json`);
    for (const key of group.order) {
      emitter.write(yield renderSection(group.sections[key].type, `sections--${this.name}__${key}`, group.sections[key], ctx.globals, `shopify-section-group-${this.name}`));
    }
  }
});

function preprocess(source) {
  return source.replace(/\b(divided_by|times):\s*(\d+)\.0\b/g, '$1_f: $2');
}
function schemaOf(source) {
  const m = /{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/.exec(source);
  return m ? JSON.parse(m[1]) : {};
}
const FONTS = { playfair_display_n4: { family: 'Playfair Display', fallback_families: 'serif', weight: 400 }, assistant_n4: { family: 'Assistant', fallback_families: 'sans-serif', weight: 400 } };
function resolveValue(def, raw) {
  const value = raw === undefined ? def.default : raw;
  switch (def.type) {
    case 'product': return value ? productView(products[value]) || null : null;
    case 'product_list': return (value || []).map((h) => products[h]).filter(Boolean).map((p) => productView(p));
    case 'collection': return value ? collections[value] || null : null;
    case 'link_list': return value ? menus[value] || null : null;
    case 'url': return value ? String(value).replace(/^shopify:\/\/(products|collections|pages)\//, '/$1/') : null;
    case 'font_picker': return FONTS[value] || FONTS.assistant_n4;
    case 'image_picker': case 'video': case 'page': return null;
    default: return value === undefined ? null : value;
  }
}
function resolveSettings(defs, raw) {
  const out = {};
  (defs || []).forEach((def) => { if (def.id) out[def.id] = resolveValue(def, raw[def.id]); });
  return out;
}

let requestState = {};
async function renderSection(type, id, data, globals, groupClass = '') {
  const source = fs.readFileSync(path.join(THEME, 'sections', `${type}.liquid`), 'utf8');
  const schema = schemaOf(source);
  const settings = resolveSettings(schema.settings, data.settings || {});
  const order = data.block_order || Object.keys(data.blocks || {});
  const blocks = order.map((blockId) => {
    const block = data.blocks[blockId];
    const def = (schema.blocks || []).find((b) => b.type === block.type) || {};
    return { id: blockId, type: block.type, settings: resolveSettings(def.settings, block.settings || {}), shopify_attributes: '' };
  });
  const html = await engine.parseAndRender(preprocess(source), { section: { id, settings, blocks } }, { globals });
  return `<div id="shopify-section-${id}" class="shopify-section ${groupClass} ${schema.class || ''}">${html}</div>`;
}

function themeSettings(overrides) {
  const schema = readJSON('config/settings_schema.json');
  const data = readJSON('config/settings_data.json');
  const raw = { ...data.presets[data.current], ...overrides };
  const defs = schema.flatMap((group) => group.settings || []);
  return resolveSettings(defs, raw);
}

function globalsFor(pageType, extra, overrides) {
  return {
    settings: themeSettings(overrides),
    shop: { name: 'Noël en Façade', description: 'Décorations lumineuses de Noël', money_format: '{{amount_with_comma_separator}} €', taxes_included: true,
      enabled_payment_types: ['visa', 'master', 'bancontact', 'apple_pay'], password_message: 'Ouverture le 10 novembre.',
      policies: [{ title: 'Politique de remboursement', url: '/policies/refund-policy' }, { title: "Conditions d'utilisation", url: '/policies/terms-of-service' }] },
    routes: { cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', cart_update_url: '/cart/update', root_url: '/', search_url: '/search', all_products_collection_url: '/collections/all' },
    request: { locale: { iso_code: 'fr' }, page_type: pageType, origin: ORIGIN, design_mode: false },
    cart: cartView(), collections, pages, all_products: products,
    content_for_header: '', canonical_url: ORIGIN, page_description: '', page_title: 'Noël en Façade', current_page: 1, page_image: null,
    ...extra
  };
}

async function renderPage(templateName, pageType, extra, overrides) {
  const globals = globalsFor(pageType, extra, overrides);
  const template = readJSON(`templates/${templateName}.json`);
  globals.template = { name: pageType, suffix: templateName.includes('.') ? templateName.split('.')[1] : null };
  let content = '';
  for (const key of template.order) {
    content += await renderSection(template.sections[key].type, `template--${templateName}__${key}`, template.sections[key], globals);
  }
  const layout = fs.readFileSync(path.join(THEME, 'layout', `${template.layout || 'theme'}.liquid`), 'utf8');
  return engine.parseAndRender(preprocess(layout), { content_for_layout: content }, { globals });
}

// ---------- Serveur ----------
function parseOverrides(url) {
  const raw = url.searchParams.get('__set');
  if (raw) requestState.overrides = Object.fromEntries(raw.split(',').map((pair) => pair.split('=')).map(([k, v]) => [k, v === 'true' ? true : v === 'false' ? false : v]));
  if (url.searchParams.has('__reset')) { requestState.overrides = {}; cartLines = []; }
  return requestState.overrides || {};
}
function readBody(req) { return new Promise((resolve) => { const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8'))); }); }
function parseMultipart(body, contentType) {
  const boundary = /boundary=(.+)$/.exec(contentType)[1];
  const fields = {};
  body.split(`--${boundary}`).forEach((part) => {
    const m = /name="([^"]+)"\r\n\r\n([\s\S]*)\r\n$/.exec(part);
    if (m) fields[m[1]] = m[2];
  });
  return fields;
}
async function renderSectionsFor(ids, sectionsUrl, overrides) {
  const out = {};
  const pageType = sectionsUrl.startsWith('/products') ? 'product' : sectionsUrl.startsWith('/cart') ? 'cart' : 'index';
  const globals = globalsFor(pageType, {}, overrides);
  for (const id of ids) {
    if (id === 'cart-drawer' || id === 'cart-icon-bubble') { const data = readJSON('config/settings_data.json'); out[id] = await renderSection(id, id, (data.presets[data.current].sections || {})[id] || {}, globals); }
    else if (id.startsWith('template--cart__')) { const key = id.split('__')[1]; out[id] = await renderSection(readJSON('templates/cart.json').sections[key].type, id, readJSON('templates/cart.json').sections[key], globals); }
  }
  return out;
}
const send = (res, status, body, type = 'text/html; charset=utf-8', headers = {}) => { res.writeHead(status, { 'Content-Type': type, ...headers }); res.end(body); };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, ORIGIN);
  const overrides = parseOverrides(url);
  const p = url.pathname;
  try {
    if (p.startsWith('/assets/')) {
      const file = path.join(THEME, 'assets', path.basename(p));
      return send(res, 200, fs.readFileSync(file), p.endsWith('.css') ? 'text/css' : 'application/javascript');
    }
    if (p.startsWith('/shopify-assets/') || p.startsWith('/fonts/')) return send(res, 200, '', 'application/javascript');
    if (p.startsWith('/img/')) {
      const hue = (parseInt(path.basename(p), 10) * 47) % 360;
      return send(res, 200, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="hsl(${hue},40%,30%)"/><circle cx="600" cy="600" r="300" fill="hsl(${hue},70%,70%)"/></svg>`, 'image/svg+xml');
    }
    if (p === '/cart/add.js' && req.method === 'POST') {
      const fields = parseMultipart(await readBody(req), req.headers['content-type']);
      const result = addVariant(fields.id, Number(fields.quantity || 1));
      if (!result || result.error) return send(res, 422, JSON.stringify({ status: 422, message: 'Cart Error', description: result ? result.error : 'Produit introuvable' }), 'application/json');
      const sections = await renderSectionsFor((fields.sections || '').split(','), fields.sections_url || '/', overrides);
      return send(res, 200, JSON.stringify({ id: result.variant.id, product_title: result.product.title, quantity: 1, sections }), 'application/json');
    }
    if (p === '/cart/change.js' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req));
      const index = Number(body.line) - 1;
      if (cartLines[index]) { if (Number(body.quantity) === 0) cartLines.splice(index, 1); else cartLines[index].quantity = Number(body.quantity); }
      const sections = await renderSectionsFor(body.sections || [], body.sections_url || '/', overrides);
      return send(res, 200, JSON.stringify({ ...cartView(), sections }), 'application/json');
    }
    if (p === '/cart/add' && req.method === 'POST') {
      const body = await readBody(req);
      const fields = req.headers['content-type'].includes('multipart') ? parseMultipart(body, req.headers['content-type']) : Object.fromEntries(new URLSearchParams(body));
      addVariant(fields.id, Number(fields.quantity || 1));
      return send(res, 302, '', 'text/plain', { Location: '/cart' });
    }
    if (p === '/cart/change' && req.method === 'GET') {
      const index = Number(url.searchParams.get('line')) - 1;
      if (cartLines[index] && Number(url.searchParams.get('quantity')) === 0) cartLines.splice(index, 1);
      return send(res, 302, '', 'text/plain', { Location: '/cart' });
    }
    if (p === '/cart' && req.method === 'POST') {
      const params = new URLSearchParams(await readBody(req));
      const updates = params.getAll('updates[]').map(Number);
      updates.forEach((quantity, index) => { if (cartLines[index]) cartLines[index].quantity = quantity; });
      cartLines = cartLines.filter((line) => line.quantity > 0);
      return send(res, 302, '', 'text/plain', { Location: params.has('checkout') ? '/checkout' : '/cart' });
    }
    if (p === '/checkout') return send(res, 200, '<!doctype html><title>Checkout</title><h1>Paiement Shopify (simulation)</h1>');
    if (p === '/') return send(res, 200, await renderPage('index', 'index', {}, overrides));
    if (p.startsWith('/products/')) {
      const product = products[path.basename(p)];
      if (product) {
        const view = productView(product, url.searchParams.get('variant'));
        return send(res, 200, await renderPage(`product.${product.template_suffix}`, 'product', { product: view, page_title: product.title }, overrides));
      }
    }
    if (p === '/products-default') return send(res, 200, await renderPage('product', 'product', { product: productView(products['projecteur-de-noel-led']) }, overrides));
    if (p === '/collections/noel' || p === '/collections/all') return send(res, 200, await renderPage('collection', 'collection', { collection: collections[path.basename(p)] }, overrides));
    if (p === '/collections') return send(res, 200, await renderPage('list-collections', 'list-collections', {}, overrides));
    if (p === '/cart') return send(res, 200, await renderPage('cart', 'cart', {}, overrides));
    if (p === '/search') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const results = q ? allProducts.filter((pr) => pr.title.toLowerCase().includes(q)).map((pr) => ({ ...pr, object_type: 'product' })) : [];
      return send(res, 200, await renderPage('search', 'search', { search: { performed: Boolean(q), terms: url.searchParams.get('q') || '', results, results_count: results.length } }, overrides));
    }
    if (p === '/pages/contact') return send(res, 200, await renderPage('page.contact', 'page', { page: pages.contact }, overrides));
    if (p.startsWith('/pages/')) return send(res, 200, await renderPage('page', 'page', { page: pages.livraison }, overrides));
    if (p === '/password') return send(res, 200, await renderPage('password', 'password', {}, overrides));
    return send(res, 404, await renderPage('404', '404', {}, overrides));
  } catch (error) {
    console.error(p, error);
    return send(res, 500, `<pre>${String(error.stack || error).replace(/</g, '&lt;')}</pre>`);
  }
});

module.exports = { start: () => new Promise((resolve) => server.listen(PORT, resolve)), stop: () => server.close(), ORIGIN };
if (require.main === module) module.exports.start().then(() => console.log(`Simulation prête sur ${ORIGIN}`));
