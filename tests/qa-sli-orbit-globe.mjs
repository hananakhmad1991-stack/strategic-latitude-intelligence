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
  assert.match(javascript, /drawIndonesia\(cx, cy, r\)/);
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


test('globe uses source-backed archipelago coastlines, not a single location marker', () => {
  const found = javascript.match(/const INDONESIA_RINGS = (\[[^\n]+\]);/);
  assert.ok(found, 'Missing bundled Indonesian polygon geometry');
  const polygons = JSON.parse(found[1]);
  assert.ok(polygons.length >= 150, 'At least 150 island/coastline polygons expected');
  const coords = polygons.flat();
  assert.ok(coords.length > 1700, 'Simplified coastline must preserve complex island shapes');
  const longitudes = coords.map(([lon]) => lon);
  const latitudes = coords.map(([, lat]) => lat);
  assert.ok(Math.min(...longitudes) < 97, 'Sumatra is covered');
  assert.ok(Math.max(...longitudes) > 140, 'Papua is covered');
  assert.ok(Math.min(...latitudes) < -10 && Math.max(...latitudes) > 5, 'Nusa Tenggara and northern islands are covered');
  assert.match(javascript, /sli-indonesia-province-38-ATTRIBUTION\.txt/, 'Coastline provenance link retained');
  assert.match(javascript, /Math\.sin\(phase\) \* radians\(16\)/, 'Auto orbit must keep archipelago facing forward');
  assert.match(index, /sli-orbit-globe\.js\?v=20261022-islands2/, 'Release cache bust expected');
});

test('real canvas renderer paints archipelago on initial reduced-motion frame', () => {
  let goldenFills = 0, paths = 0;
  let currentFill = '';
  const drawing = {
    createRadialGradient: () => ({ addColorStop() {} }),
    setTransform() {}, clearRect() {}, beginPath() {}, arc() {}, stroke() {},
    save() {}, restore() {}, ellipse() {}, setLineDash() {}, clip() {},
    moveTo() { paths++ }, lineTo() { paths++ }, closePath() {}, fillText() {},
    fill() { if (String(currentFill).includes('240, 180, 75')) goldenFills++ }
  };
  Object.defineProperty(drawing, 'fillStyle', {
    get: () => currentFill, set: value => { currentFill = value }
  });
  const node = tag => ({
    tag, children: [], dataset: {}, isConnected: true,
    append(...children) { this.children.push(...children) },
    replaceChildren(...children) { this.children = children },
    setAttribute() {}, addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ width: 365 }),
    getContext: () => drawing
  });
  const root = node('host');
  const fakeWindow = {
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
    devicePixelRatio: 1,
    addEventListener() {}, removeEventListener() {}
  };
  const fakeDocument = {
    documentElement: { lang: 'id' },
    createElement: node,
    getElementById: id => id === 'sliOrbitGlobe' ? root : null,
    addEventListener() {}, removeEventListener() {}
  };
  assert.doesNotThrow(() => {
    new Function('window', 'document', javascript)(fakeWindow, fakeDocument);
    fakeWindow.initSLIOrbitGlobe();
  });
  assert.ok(goldenFills >= 1, 'Indonesian landmass painted in gold');
  assert.ok(paths >= 150, 'Multiple island geometry paths rendered');
  assert.ok(root.children.some(child => child.className === 'sli-orbit-source'), 'Attribution link mounted');
});
