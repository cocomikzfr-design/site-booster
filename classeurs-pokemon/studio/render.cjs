// Génère les visuels du site à partir de studio.html, puis les convertit en WebP dans public/images.
// Usage : node studio/render.cjs            (toutes les scènes)
//         node studio/render.cjs tile- p1-  (seulement les scènes qui commencent par ces préfixes)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const studio = path.join(__dirname, 'studio.html');
const tmp = path.join(__dirname, 'out');
const dest = path.join(__dirname, '..', 'public', 'images');
const only = process.argv.slice(2);

(async () => {
  fs.mkdirSync(tmp, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await (await browser.newContext({ deviceScaleFactor: 2 })).newPage();
  // Noms des vraies cartes et choix par couleur, lus par studio.html
  const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards', 'index.json'), 'utf8'));
  const picks = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
  await page.addInitScript(([c, p]) => { window.CARDS = c; window.PICKS = p; }, [cards, picks]);
  await page.goto('file://' + studio + '#none');
  const scenes = await page.evaluate(() => window.SCENES);
  for (const [name, s] of Object.entries(scenes)) {
    if (only.length && !only.some((o) => name.startsWith(o))) continue;
    await page.setViewportSize({ width: s.w, height: s.h });
    await page.goto('file://' + studio + '#' + name);
    await page.reload();
    await page.evaluate(() => window.READY);
    await page.waitForTimeout(150);
    await (await page.$('#stage')).screenshot({ path: path.join(tmp, name + '.png'), omitBackground: s.transparent });
    console.log('ok', name);
  }
  await browser.close();
  execFileSync('python3', [path.join(__dirname, 'export.py'), tmp, dest, path.join(__dirname, 'art')], { stdio: 'inherit' });
})();
