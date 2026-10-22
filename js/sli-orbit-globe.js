/* Lightweight, source-neutral animated 3D globe for the SLI home hero.
   Geometric illustration only: never represents a live map, incident, or market signal.
   No third-party library, tracking, network request, or paid API. */
(() => {
  'use strict';
  let active = null;
  const PI = Math.PI;
  const radians = n => n * PI / 180;
  const isIndonesian = () => document.documentElement.lang.toLowerCase().startsWith('id');
  const tr = (en, id) => isIndonesian() ? id : en;

  function init() {
    const host = document.getElementById('sliOrbitGlobe');
    if (!host || host.dataset.ready === '1') return;
    if (active) active.destroy();
    host.dataset.ready = '1';
    const stage = document.createElement('div');
    stage.className = 'sli-orbit-stage';
    const canvas = document.createElement('canvas');
    canvas.className = 'sli-orbit-canvas';
    canvas.setAttribute('role', 'img');
    stage.append(canvas);
    const meta = document.createElement('div');
    meta.className = 'sli-orbit-meta';
    const kicker = document.createElement('strong');
    const detail = document.createElement('span');
    meta.append(kicker, detail);
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'sli-orbit-toggle';
    const legend = document.createElement('div');
    legend.className = 'sli-orbit-legend';
    ['Energy', 'Trade', 'AI'].forEach(label => {
      const tag = document.createElement('span');
      tag.textContent = label;
      legend.append(tag);
    });
    host.replaceChildren(stage, meta, control, legend);

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      stage.replaceChildren(document.createTextNode(tr('3D globe preview unavailable on this browser.', 'Pratinjau bola dunia 3D tidak tersedia di browser ini.')));
      control.hidden = true;
      return;
    }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = preference.matches;
    let inView = true;
    let pointer = null;
    let angle = radians(-118);
    let tilt = radians(17);
    let frameId = 0;
    let lastTime = 0;
    let lastDraw = 0;
    let width = 320;
    let height = 320;
    let disposed = false;
    let observer;
    let sizeObserver;
    function updateLanguage() {
      kicker.textContent = tr('INDONESIA IN FOCUS', 'FOKUS INDONESIA');
      detail.textContent = tr('Interactive 3D illustration · not live data', 'Ilustrasi 3D interaktif · bukan data langsung');
      canvas.setAttribute('aria-label', tr('Rotating three-dimensional globe with Indonesia marked. Drag horizontally to turn.', 'Bola dunia tiga dimensi yang berputar dengan penanda Indonesia. Geser mendatar untuk memutar.'));
      control.textContent = paused ? tr('▶ Rotate globe', '▶ Putar globe') : tr('Ⅱ Pause animation', 'Ⅱ Jeda animasi');
      control.setAttribute('aria-pressed', String(!paused));
    }
    function project(lat, lon) {
      const a = lon + angle;
      const x = Math.cos(lat) * Math.sin(a);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(a);
      return { x, y: y * Math.cos(tilt) - z * Math.sin(tilt), z: y * Math.sin(tilt) + z * Math.cos(tilt) };
    }
    function line(points, front, color, alpha, cx, cy, r) {
      context.strokeStyle = color;
      context.globalAlpha = alpha;
      context.lineWidth = front ? 1 : 0.65;
      context.beginPath();
      let started = false;
      for (const coordinate of points) {
        const p = project(coordinate[0], coordinate[1]);
        if ((p.z >= 0) !== front) { started = false; continue; }
        const x = cx + p.x * r;
        const y = cy - p.y * r;
        if (!started) context.moveTo(x, y);
        else context.lineTo(x, y);
        started = true;
      }
      context.stroke();
    }
    function draw() {
      if (disposed || !host.isConnected) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth; canvas.height = pixelHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2 - 4, r = Math.min(width, height) * 0.35;
      const glow = context.createRadialGradient(cx, cy, r * .7, cx, cy, r * 1.37);
      glow.addColorStop(0, 'rgba(10,130,180,0.06)');
      glow.addColorStop(.75, 'rgba(29,155,196,0.14)');
      glow.addColorStop(1, 'rgba(29,155,196,0)');
      context.fillStyle = glow;
      context.beginPath(); context.arc(cx, cy, r * 1.37, 0, PI * 2); context.fill();
      context.save();
      context.strokeStyle = 'rgba(217,187,133,0.28)';
      context.lineWidth = 1.2;
      context.beginPath();
      context.ellipse(cx, cy, r * 1.32, r * .42, -.42, 0, PI * 2);
      context.stroke();
      context.setLineDash([3, 9]);
      context.strokeStyle = 'rgba(115,202,222,0.26)';
      context.beginPath();
      context.ellipse(cx, cy, r * 1.23, r * .6, .55, 0, PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.restore();

      const sphere = context.createRadialGradient(cx-r*.3, cy-r*.45, r*.1, cx+r*.25, cy+r*.1, r*1.4);
      sphere.addColorStop(0, '#25536a');
      sphere.addColorStop(.48, '#0e354e');
      sphere.addColorStop(1, '#071a31');
      context.fillStyle = sphere;
      context.beginPath(); context.arc(cx, cy, r, 0, PI * 2); context.fill();
      context.save();
      context.beginPath(); context.arc(cx, cy, r, 0, PI * 2); context.clip();
      const curves = [];
      for (let longitude = -180; longitude < 180; longitude += 20) {
        const points = [];
        for (let latitude = -90; latitude <= 90; latitude += 3) points.push([radians(latitude), radians(longitude)]);
        curves.push(points);
      }
      for (let latitude = -75; latitude <= 75; latitude += 15) {
        const points = [];
        for (let longitude = -180; longitude <= 180; longitude += 3) points.push([radians(latitude), radians(longitude)]);
        curves.push(points);
      }
      for (const curve of curves) line(curve, false, '#7bb5c6', .13, cx, cy, r);
      for (const curve of curves) line(curve, true, '#6ecde0', .42, cx, cy, r);
      const equator = [];
      for (let longitude = -180; longitude <= 180; longitude += 2) equator.push([0, radians(longitude)]);
      line(equator, true, '#e2c78e', .57, cx, cy, r);
      context.restore();
      context.strokeStyle = 'rgba(141,221,226,0.63)';
      context.lineWidth = 1.4;
      context.beginPath(); context.arc(cx, cy, r, 0, PI * 2); context.stroke();

      const indonesia = project(radians(-2.5), radians(118));
      if (indonesia.z > .09) {
        const x = cx + indonesia.x * r, y = cy - indonesia.y * r;
        const halo = context.createRadialGradient(x, y, 1, x, y, 23);
        halo.addColorStop(0, 'rgba(245,206,141,.6)');
        halo.addColorStop(1, 'rgba(245,206,141,0)');
        context.fillStyle = halo; context.beginPath(); context.arc(x,y,23,0,PI*2); context.fill();
        context.fillStyle = '#f6d091'; context.beginPath(); context.arc(x,y,4.3,0,PI*2); context.fill();
        context.strokeStyle = '#f7dba8'; context.lineWidth = 1;
        context.beginPath(); context.arc(x,y,8,0,PI*2); context.stroke();
        context.font = '700 10px system-ui, sans-serif';
        context.fillStyle = '#ffe0a3';
        context.fillText('INDONESIA', Math.min(x+13,width-90), Math.max(13,y-9));
      }
    }
    function render(time) {
      frameId = 0;
      if (disposed || !host.isConnected) { destroy(); return; }
      if (document.hidden || !inView || paused || pointer !== null) return;
      if (!lastTime) lastTime = time;
      const delta = Math.min(80, time - lastTime);
      lastTime = time;
      angle += delta * .00014;
      if (time - lastDraw > 32) { draw(); lastDraw = time; }
      schedule();
    }
    function schedule() {
      if (!frameId && !disposed && !document.hidden && inView && !paused && pointer === null) frameId = requestAnimationFrame(render);
    }
    function halt() {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0; lastTime = 0;
    }
    function resize() {
      const bounds = stage.getBoundingClientRect();
      if (!bounds.width) return;
      width = Math.max(180, Math.min(440, bounds.width));
      height = width;
      draw();
    }
    function onVisibility() { if (document.hidden) halt(); else schedule(); }
    function onLanguage() { updateLanguage(); draw(); }
    function onMotion() { if (preference.matches) { paused = true; halt(); } updateLanguage(); }
    function onDown(event) {
      if (event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX };
      stage.setPointerCapture?.(event.pointerId);
      halt();
    }
    function onMove(event) {
      if (!pointer || event.pointerId !== pointer.id) return;
      angle += (event.clientX - pointer.x) * .008;
      pointer.x = event.clientX;
      draw();
    }
    function onUp(event) {
      if (pointer && event.pointerId === pointer.id) {
        pointer = null;
        schedule();
      }
    }
    function destroy() {
      if (disposed) return;
      disposed = true; halt();
      observer?.disconnect(); sizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('sli:languagechange', onLanguage);
      preference.removeEventListener?.('change', onMotion);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      active = null;
    }
    control.addEventListener('click', () => {
      paused = !paused;
      updateLanguage();
      if (paused) halt(); else { lastTime = 0; schedule(); }
    });
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('sli:languagechange', onLanguage);
    preference.addEventListener?.('change', onMotion);
    if ('ResizeObserver' in window) { sizeObserver = new ResizeObserver(resize); sizeObserver.observe(stage); }
    else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        inView = Boolean(entries[0]?.isIntersecting);
        if (!inView) halt(); else schedule();
      }, { threshold: .1 });
      observer.observe(host);
    }
    active = { destroy };
    updateLanguage();
    resize();
    schedule();
  }

  window.initSLIOrbitGlobe = init;
  document.addEventListener('sli:pagechange', () => {
    if (active && !document.getElementById('sliOrbitGlobe')) active.destroy();
  });
})();
