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
  assert.match(index, /sli-orbit-globe\.js\?v=20261022-globefit4/, 'Release cache bust expected');
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
  assert.ok(root.children.some(child => child.className === 'sli-orbit-credits' && child.children.some(credit => credit.className === 'sli-orbit-source')), 'Attributed map sources mounted');
});


test('low-detail world geography contains every major continent and keeps Indonesia detailed', () => {
  const sourcePolys = javascript.match(/const WORLD_RINGS = (\[[^\n]+\]);/);
  assert.ok(sourcePolys, 'Natural Earth world silhouettes must be bundled');
  const polygons = JSON.parse(sourcePolys[1]);
  assert.ok(polygons.length >= 75 && polygons.length <= 125, 'Low-detail world ring count');
  assert.ok(polygons.flat().length >= 1000 && polygons.flat().length <= 2000, 'Low-detail world vertices');
  const points = polygons.flat();
  const hasLand = (minLon, maxLon, minLat, maxLat) => points.some(([lon,lat]) =>
    lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat
  );
  assert.ok(hasLand(-165,-85,10,70), 'North America');
  assert.ok(hasLand(-80,-40,-55,10), 'South America');
  assert.ok(hasLand(-20,50,-35,35), 'Africa');
  assert.ok(hasLand(-5,30,35,70), 'Europe');
  assert.ok(hasLand(30,145,10,65), 'Asia');
  assert.ok(hasLand(112,155,-45,-10), 'Australia');
  assert.ok(hasLand(95,141,-11,6), 'Indonesia at global scale');
  assert.match(javascript, /naturalearthdata.com\/about\/terms-of-use/);
  assert.match(javascript, /drawWorld\(cx, cy, r\);\s*drawIndonesia\(cx, cy, r\);/, 'Gold Indonesia must layer on top of continents');
  assert.match(index, /globefit4/, 'Versioned assets cache-busted');
});

test('zoom and focus controls are active and actually change canvas geometry', () => {
  let currentFill = '';
  let coords = [];
  const earthWidths = [];
  const contexts = {
    createRadialGradient: () => ({ addColorStop() {} }),
    setTransform() {}, clearRect() {}, beginPath() { coords=[] }, arc() {},
    stroke() {}, save() {}, restore() {}, ellipse() {}, setLineDash() {}, clip() {},
    closePath() {}, fillText() {},
    moveTo(x,y) { coords.push([x,y]); }, lineTo(x,y) { coords.push([x,y]); },
    fill() {
      if(String(currentFill).includes('74, 124, 146') && coords.length)
        earthWidths.push(Math.max(...coords.map(x=>x[0])) - Math.min(...coords.map(x=>x[0])));
    }
  };
  Object.defineProperty(contexts,'fillStyle',{get:()=>currentFill,set:v=>currentFill=v});
  const el=tag=>{
    const node={
      tag, children:[], dataset:{}, isConnected:true, className:'', textContent:'', listeners:new Map(),
      append(...a){this.children.push(...a)},
      replaceChildren(...a){this.children=a},
      setAttribute(){},
      addEventListener(name,fn){ this.listeners.set(name,fn); },
      removeEventListener(){},
      getBoundingClientRect(){return {width:365}},
      getContext(){return contexts}
    };
    return node;
  };
  const host = el('host');
  const win={matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}}),
    devicePixelRatio:1,addEventListener(){},removeEventListener(){}};
  const doc={documentElement:{lang:'id'},createElement:el,getElementById:id=>id==='sliOrbitGlobe'?host:null,
    addEventListener(){},removeEventListener(){}};
  new Function('window','document',javascript)(win,doc);
  win.initSLIOrbitGlobe();
  assert.ok(earthWidths.length, 'Natural Earth must be painted on initial frame');
  const controls = host.children.find(x=>x.className==='sli-orbit-controls');
  assert.ok(controls, 'World / Focus + zoom controls mounted');
  assert.equal(controls.children.length,5, 'World button, Indonesia button, minus, slider, plus');
  assert.equal(controls.children[0].textContent, 'Tampilan Dunia');
  assert.equal(controls.children[1].textContent, 'Fokus Indonesia');
  const worldWidth = earthWidths.at(-1);
  controls.children[1].listeners.get('click')();
  const indonesiaWidth = earthWidths.at(-1);
  assert.ok(indonesiaWidth > worldWidth * 1.5, 'Focus Indonesia must truly zoom into geography');
  assert.equal(controls.children[1].value, undefined);
  assert.equal(controls.children[3].value, '2.2', 'Slider shows zoomed focus');
  controls.children[0].listeners.get('click')();
  const restoredWidth = earthWidths.at(-1);
  assert.ok(restoredWidth < indonesiaWidth * .75, 'World view must zoom back out');
  const stage = host.children.find(x=>x.className==='sli-orbit-stage');
  let wheelPrevented = false;
  stage.listeners.get('wheel')({deltaY:-100, preventDefault(){wheelPrevented=true;}});
  assert.ok(wheelPrevented, 'wheel over globe zooms in');
  assert.ok(earthWidths.at(-1) > restoredWidth, 'wheel zoom changes rendered globe size');
  assert.match(javascript, /focusView\.addEventListener\('click', \(\) => switchView\('indonesia'\)\)/);
  assert.match(javascript, /worldView\.addEventListener\('click', \(\) => switchView\('world'\)\)/);
  assert.match(javascript, /zoomInput\.addEventListener\('input'/);
  assert.match(javascript, /stage\.addEventListener\('wheel', onWheel, \{ passive: false \}\)/);
  assert.match(javascript, /stage\.addEventListener\('touchmove', onTouchMove, \{ passive: false \}\)/);
  assert.match(javascript, /stage\.addEventListener\('pointermove', onMove\)/);
  assert.ok(worldWidth>0);
});


test('globe hero reserves room for the full interactive stack at desktop widths', () => {
  assert.match(styles, /body\.sli-home-active \.sli-portal-hero\s*\{[^}]*min-height:\s*595px/s);
  assert.match(styles, /@media\(max-width:1100px\)[\s\S]*?min-height:\s*0;/);
  assert.match(javascript, /let mode = 'indonesia'/, 'Default Indonesia-facing position');
  assert.match(index, /globefit4/, 'Updated asset URLs evade stale CSS cache');
});
