import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const browserPath = process.env.CHROME_BIN;
assert.ok(browserPath, 'Use the Chrome already installed on the GitHub runner');
const url = process.env.SLI_BROWSER_URL || 'http://127.0.0.1:8765/index.html#home';
const browser = await chromium.launch({
  executablePath: browserPath, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
let failed = 0;
try {
  for (const width of [1440, 1180, 1024, 430, 360]) {
    const page = await browser.newPage({viewport: {width, height: 920}, reducedMotion: 'reduce'});
    try {
      await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 25000});
      await page.locator('#sliOrbitGlobe .sli-orbit-controls').waitFor({state: 'visible', timeout: 25000});
      await page.evaluate(() => document.fonts.ready);
      const boxes = await page.evaluate(() => {
        const bounds = sel => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height};
        };
        return {
          hero: bounds('body.sli-home-active .sli-portal-hero'),
          globe: bounds('#sliOrbitGlobe'),
          stage: bounds('#sliOrbitGlobe .sli-orbit-stage'),
          controls: bounds('#sliOrbitGlobe .sli-orbit-controls'),
          pause: bounds('#sliOrbitGlobe .sli-orbit-toggle'),
          credits: bounds('#sliOrbitGlobe .sli-orbit-credits'),
          mode: document.querySelector('#sliOrbitGlobe .sli-orbit-view[aria-pressed="true"]')?.textContent
        };
      });
      console.log(JSON.stringify({viewport:width,...boxes}));
      assert.ok(boxes.hero && boxes.controls && boxes.pause && boxes.credits, 'Visible globe UI is mounted');
      for (const [name, b] of Object.entries({globe:boxes.globe,stage:boxes.stage,controls:boxes.controls,pause:boxes.pause,credits:boxes.credits})) {
        assert.ok(b.left>=boxes.hero.left-2 && b.right<=boxes.hero.right+2,
          width+'px: '+name+' must fit inside hero horizontally');
      }
      assert.ok(boxes.controls.bottom <= boxes.hero.bottom - 12,
        width+'px: World View / Focus Indonesia / zoom controls must NOT be clipped');
      assert.ok(boxes.pause.bottom <= boxes.hero.bottom - 12,
        width+'px: Pause/Play button must NOT be clipped');
      assert.ok(boxes.credits.bottom <= boxes.hero.bottom - 10,
        width+'px: source links must NOT be clipped');
      assert.ok(boxes.stage.bottom < boxes.controls.top + 36, 'Stage must precede mode controls');
      assert.match(boxes.mode || '', /Indonesia/i, 'Indonesia is the initial geographic focus');
      const buttons=page.locator('#sliOrbitGlobe .sli-orbit-view');
      await buttons.nth(1).scrollIntoViewIfNeeded();
      const hit = await page.evaluate(() => {
        const b = document.querySelector('#sliOrbitGlobe .sli-orbit-view:nth-child(2)');
        const r = b.getBoundingClientRect();
        const hits = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hits.slice(0,5).map(el => el.tagName.toLowerCase() + '.' + el.className);
      });
      console.log('Pointer hit stack '+width+'px: '+JSON.stringify(hit));
      assert.match(hit[0] || '', /button.sli-orbit-view/, 'Mode control must receive pointer events');
      await buttons.nth(1).click({timeout: 3500});
      assert.equal(await page.locator('#sliOrbitGlobe .sli-orbit-range').inputValue(), '2.2');
      await buttons.nth(0).click({timeout: 3500});
      assert.equal(await page.locator('#sliOrbitGlobe .sli-orbit-range').inputValue(), '1');
      console.log('PASS '+width+'px layout: all controls visible and mode switches work');
    } catch (error) {
      failed++;
      console.error('FAIL '+width+'px '+String(error));
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
assert.equal(failed, 0, failed+' responsive globe layout failures');
