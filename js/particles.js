/*
 * La poussière dorée : système de particules sur <canvas>, au-dessus de la scène.
 * Les coordonnées des modes sont exprimées dans le repère SVG des scènes (400 × 640),
 * converties en pixels écran via la matrice fournie par le moteur (setMatrix).
 */
(function () {
  'use strict';

  var canvas, g, W = 0, H = 0, dpr = 1;
  var parts = [];
  var M = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  var mode = 'off', data = {};
  var reduced = false;
  var sprites = {};
  var color = [255, 206, 115];
  var last = performance.now();

  function rand(a, b) { return a + Math.random() * (b - a); }

  function sprite(rgb) {
    var key = rgb.join(',');
    if (sprites[key]) return sprites[key];
    var s = document.createElement('canvas');
    s.width = s.height = 32;
    var c = s.getContext('2d');
    var grd = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,240,1)');
    grd.addColorStop(0.18, 'rgba(' + key + ',0.95)');
    grd.addColorStop(0.45, 'rgba(' + key + ',0.28)');
    grd.addColorStop(1, 'rgba(' + key + ',0)');
    c.fillStyle = grd;
    c.fillRect(0, 0, 32, 32);
    sprites[key] = s;
    return s;
  }

  function targetCount() {
    var small = Math.min(innerWidth, innerHeight) < 520;
    var n = small ? 170 : 280;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) n = Math.round(n * 0.7);
    if (reduced) n = 70;
    return n;
  }

  function makeParticle() {
    return {
      x: 200, y: 320, vx: 0, vy: 0, tx: 200, ty: 320,
      a: 0, ta: 0, s: rand(0.5, 1.6), ph: rand(0, Math.PI * 2), sp: rand(0.4, 1.4),
      u: Math.random(), v: Math.random(), hx: Math.random(), hy: Math.random(),
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }

  function ensureCount() {
    var n = targetCount();
    while (parts.length < n) parts.push(makeParticle());
    if (parts.length > n) parts.length = n;
  }

  // écran -> repère SVG (pour la dérive libre qui couvre tout l'écran)
  function fromScreen(px, py) {
    var det = M.a * M.d - M.b * M.c || 1;
    var x = px - M.e, y = py - M.f;
    return { x: (M.d * x - M.c * y) / det, y: (-M.b * x + M.a * y) / det };
  }

  function computeTargets(t) {
    var n = parts.length, i, p, k;
    var cx = data.x != null ? data.x : 200, cy = data.y != null ? data.y : 320;
    switch (mode) {
      case 'off':
        for (i = 0; i < n; i++) parts[i].ta = 0;
        break;
      case 'single':
        for (i = 0; i < n; i++) {
          p = parts[i];
          p.tx = cx + (i ? 0 : Math.sin(t * 0.8) * 3);
          p.ty = cy + (i ? 0 : Math.cos(t * 0.6) * 3);
          p.ta = i === 0 ? 1 : 0;
          if (i) { p.x = cx; p.y = cy; }
        }
        break;
      case 'galaxy': {
        var R = data.r || 160;
        for (i = 0; i < n; i++) {
          p = parts[i];
          var arm = i % 3;
          var r = Math.pow(p.u, 0.65) * R;
          var ang = arm * 2.094 + r * 0.03 + t * 0.18 + (p.v - 0.5) * 0.6;
          p.tx = cx + Math.cos(ang) * r;
          p.ty = cy + Math.sin(ang) * r * 0.62;
          p.ta = 0.35 + 0.65 * (1 - r / R);
        }
        break;
      }
      case 'shape': {
        var pts = data.pts || [];
        var len = pts.length || 1;
        var prog = data.prog == null ? 1 : data.prog;
        var limit = Math.floor(n * prog);
        var jit = data.jitter == null ? 1.5 : data.jitter;
        for (i = 0; i < n; i++) {
          p = parts[i];
          if (i < limit && pts.length) {
            var q = pts[i % len];
            p.tx = q[0] + Math.sin(t * p.sp + p.ph) * jit;
            p.ty = q[1] + Math.cos(t * p.sp * 0.9 + p.ph) * jit;
            p.ta = data.alpha || 0.9;
          } else {
            var rx = data.restX != null ? data.restX : cx, ry = data.restY != null ? data.restY : cy;
            var rr = (data.restR || 30) * Math.sqrt(p.u);
            p.tx = rx + Math.cos(p.v * 6.283 + t * 0.4) * rr;
            p.ty = ry + Math.sin(p.v * 6.283 + t * 0.4) * rr * 0.5;
            p.ta = data.restAlpha == null ? 0.6 : data.restAlpha;
          }
        }
        break;
      }
      case 'gather': {
        var gr = (data.r || 40) * (1 + 0.08 * Math.sin(t * 2.2));
        for (i = 0; i < n; i++) {
          p = parts[i];
          var rr2 = gr * Math.sqrt(p.u);
          var a2 = p.v * 6.283 + t * (0.3 + p.sp * 0.3);
          p.tx = cx + Math.cos(a2) * rr2;
          p.ty = cy + Math.sin(a2) * rr2;
          p.ta = 0.5 + 0.5 * (1 - p.u);
        }
        break;
      }
      case 'rise': {
        // la poussière monte doucement et se dissipe vers le haut
        for (i = 0; i < n; i++) {
          p = parts[i];
          p.tx = p.x + Math.sin(t + p.ph) * 0.6;
          p.ty = p.y - 0.8 * p.sp;
          p.ta = p.y < (data.top || 0) ? 0 : 0.6;
        }
        break;
      }
      default: { // 'drift' : flottement libre, discret
        var top = fromScreen(0, 0), bot = fromScreen(W, H);
        var amt = data.alpha == null ? 0.35 : data.alpha;
        for (i = 0; i < n; i++) {
          p = parts[i];
          k = i / n;
          p.tx = top.x + (bot.x - top.x) * p.hx + Math.sin(t * 0.2 * p.sp + p.ph) * 30;
          p.ty = top.y + (bot.y - top.y) * p.hy + Math.cos(t * 0.17 * p.sp + p.ph) * 30;
          p.ta = k < (data.fraction == null ? 0.6 : data.fraction) ? amt * (0.4 + p.u * 0.6) : 0;
        }
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(50, now - last) / 16.67;
    last = now;
    if (document.hidden) return;
    var t = now / 1000;
    computeTargets(t);

    var stiff = (data.k || 0.018) * (reduced ? 2.5 : 1);
    var damp = 0.86;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    var img = sprite(color);
    var scale = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)) || 1;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (mode !== 'rise') {
        p.vx = (p.vx + (p.tx - p.x) * stiff * dt) * Math.pow(damp, dt);
        p.vy = (p.vy + (p.ty - p.y) * stiff * dt) * Math.pow(damp, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else {
        p.x = p.tx; p.y = p.ty;
      }
      p.a += (p.ta - p.a) * 0.05 * dt;
      if (p.a < 0.01) continue;
      var sx = M.a * p.x + M.c * p.y + M.e;
      var sy = M.b * p.x + M.d * p.y + M.f;
      var tw = 0.75 + 0.25 * Math.sin(t * 3 * p.sp + p.ph);
      var size = (i === 0 && mode === 'single' ? 7 : 3.2 + p.s * 3) * scale * (data.size || 1);
      g.globalAlpha = Math.min(1, p.a * tw);
      g.drawImage(img, sx - size, sy - size, size * 2, size * 2);
    }
    g.globalAlpha = 1;
  }

  var Dust = {
    init: function (el) {
      canvas = el;
      g = canvas.getContext('2d');
      resize();
      ensureCount();
      addEventListener('resize', function () { resize(); ensureCount(); });
      requestAnimationFrame(frame);
    },
    setMatrix: function (m) { if (m) M = { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f }; },
    setReduced: function (v) { reduced = !!v; if (g) ensureCount(); },
    set: function (m, d) { mode = m; data = d || {}; },
    update: function (d) { for (var k in d) data[k] = d[k]; },
    get data() { return data; },
    color: function (rgb) { color = rgb; },
    // impulsion radiale depuis un point (porte qui s'ouvre, etc.)
    burst: function (x, y, force) {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var ang = Math.random() * Math.PI * 2, sp = (force || 8) * (0.3 + Math.random());
        p.x = x + Math.cos(ang) * 4; p.y = y + Math.sin(ang) * 4;
        p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp;
        p.a = 0.9;
      }
    },
    // place toutes les particules en un point (sans animation)
    snap: function (x, y) {
      for (var i = 0; i < parts.length; i++) { parts[i].x = x; parts[i].y = y; parts[i].vx = parts[i].vy = 0; }
    },
  };

  /* Échantillonne des points à l'intérieur d'un tracé SVG (dans le repère 400 × 640). */
  Dust.samplePath = function (d, count, opts) {
    opts = opts || {};
    var sc = 0.5, w = 400 * sc, h = 640 * sc;
    var oc = document.createElement('canvas');
    oc.width = w; oc.height = h;
    var c = oc.getContext('2d');
    c.setTransform(sc, 0, 0, sc, 0, 0);
    c.fillStyle = '#fff';
    var ds = Array.isArray(d) ? d : [d];
    ds.forEach(function (one) { c.fill(new Path2D(one)); });
    if (opts.stroke) { c.lineWidth = opts.stroke; c.strokeStyle = '#fff'; ds.forEach(function (one) { c.stroke(new Path2D(one)); }); }
    var px = c.getImageData(0, 0, w, h).data, pts = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (px[(y * w + x) * 4 + 3] > 128) pts.push([(x + Math.random()) / sc, (y + Math.random()) / sc]);
      }
    }
    for (var i = pts.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var tmp = pts[i]; pts[i] = pts[j]; pts[j] = tmp; }
    pts = pts.slice(0, count || 400);
    if (opts.sortY) pts.sort(function (p, q) { return q[1] - p[1]; });
    return pts;
  };

  window.AU = window.AU || {};
  window.AU.dust = Dust;
})();
