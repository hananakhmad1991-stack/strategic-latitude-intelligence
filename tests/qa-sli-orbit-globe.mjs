import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const index = source('index.html');
const javascript = source('js/sli-orbit-globe.js');
const styles = source('css/sli-orbit-globe.css');

test('home globe is mounted and initialized only on the landing page', () => {
  assert.match(index, /id="sliOrbitGlobe" class="sli-orbit-globe"/);
  assert.match(index, /js\/sli-orbit-globe\.js\?v=/);
  assert.match(index, /css\/sli-orbit-globe\.css\?v=/);
  assert.match(index, /page==='home'&&typeof window\.initSLIOrbitGlobe/);
  assert.match(javascript, /window\.initSLIOrbitGlobe\s*=\s*init/);
});

test('animated globe is valid JavaScript without third party runtime or source claims', () => {
  assert.doesNotThrow(() => new Script(javascript, { filename: 'sli-orbit-globe.js' }));
  assert.doesNotMatch(javascript, /import\(|fetch\(|XMLHttpRequest|WebSocket|THREE|script\.src/);
  assert.match(javascript, /not live data/);
  assert.match(javascript, /radians\(-2\.5\).*radians\(118\)/);
});

test('mobile and accessible motion safeguards exist', () => {
  assert.match(javascript, /prefers-reduced-motion:\s*reduce/);
  assert.match(javascript, /IntersectionObserver/);
  assert.match(javascript, /visibilitychange/);
  assert.match(javascript, /pointermove/);
  assert.match(javascript, /aria-pressed/);
  assert.match(javascript, /cancelAnimationFrame/);
  assert.match(styles, /@media\(max-width:1100px\)/);
  assert.match(styles, /@media\(max-width:520px\)/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(styles, /body\.sli-home-active/);
});
