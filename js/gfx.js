/*
 * Éléments graphiques réutilisables (SVG) : silhouettes sans visage, étoiles,
 * ciels, collines. Repère des scènes : 400 × 640, sol vers y = 470.
 */
(function () {
  'use strict';

  var BODY = '#0c1230';

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function defs() {
    return '<defs>' +
      '<filter id="blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '<filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>' +
      '<filter id="blur14" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>' +
      '<radialGradient id="halo"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset=".3" stop-color="#ffd27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="haloCyan"><stop offset="0" stop-color="#e6fdff" stop-opacity=".95"/><stop offset=".3" stop-color="#5fe3ff" stop-opacity=".45"/><stop offset="1" stop-color="#5fe3ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="moonGrad" cx=".42" cy=".4" r=".65"><stop offset="0" stop-color="#fbfbff"/><stop offset=".6" stop-color="#dfe3f5"/><stop offset="1" stop-color="#b9bfdc"/></radialGradient>' +
      '<radialGradient id="moonGlow"><stop offset=".55" stop-color="#e9ecff" stop-opacity=".35"/><stop offset="1" stop-color="#e9ecff" stop-opacity="0"/></radialGradient>' +
      '</defs>';
  }

  /* ---------- Silhouette (vue de profil, tournée vers la droite, pieds en 0,0, hauteur ≈ 100) ----------
   * Squelette articulé : cuisse → tibia → pied, bras → avant-bras → main, tête sur le cou.
   * Chaque segment est un groupe que le CSS fait pivoter autour de son articulation.
   */
  var FAR = '#070a1e';

  function hair(style) {
    switch (style) {
      case 'afro': return '<circle cx="-5" cy="-12" r="6.5"/><circle cx="1" cy="-16" r="7.5"/><circle cx="7" cy="-13" r="6"/><circle cx="-7" cy="-6" r="5.5"/>';
      case 'locks': return '<path d="M-7,-11 C-7,-20 7,-21 9.5,-12 L8,-12 C5,-16 -1,-16 -4,-10 Z"/>' +
        '<g fill="none" stroke-linecap="round" stroke-width="2.6"><path d="M-6,-12 Q-10,-3 -9,6"/><path d="M-3,-15 Q-7,-4 -5,7"/><path d="M-8,-8 Q-12,0 -12,8"/></g>';
      case 'long': return '<path d="M-7.5,-11 C-8,-21 7,-22 9.5,-12 L8,-12 C5,-16 -1,-16 -3,-11 C-4,-4 -4,4 -1,11 L-6,13 C-11,6 -11,-4 -7.5,-11 Z"/>';
      case 'tresses': return '<path d="M-7,-11 C-7,-20 7,-21 9.5,-12 L8,-12 C5,-16 -1,-16 -4,-10 Z"/>' +
        '<g fill="none" stroke-linecap="round" stroke-width="3"><path d="M-6,-10 Q-9,0 -7,12" stroke-dasharray="3 1.2"/><path d="M-3,-12 Q-5,0 -3,13" stroke-dasharray="3 1.2"/></g>';
      case 'chignon': return '<path d="M-7.5,-10 C-8,-20 7,-21 9.5,-12 L8,-12 C5,-16 -1,-16 -4,-10 Z"/><circle cx="-6.5" cy="-17" r="5.2"/>';
      case 'queue': return '<path d="M-7.5,-10 C-8,-20 7,-21 9.5,-12 L8,-12 C5,-16 -1,-16 -4,-10 Z"/><path d="M-6,-14 C-13,-12 -15,-3 -12,4 C-10,-2 -9,-8 -5,-10 Z"/>';
      case 'ras': return '';
      default: return '<path d="M-7,-10 C-8,-20 6,-21.5 9.4,-12.5 C8,-12 6.5,-13.5 5,-14 C2,-15 -2,-14 -4.5,-9.5 Z"/>';
    }
  }

  function headAcc(kind, accent) {
    if (kind === 'casquette') return '<path d="M-8,-13 C-6,-21 8,-21 9,-12.5 L17.5,-11 L9,-9.5 L-8,-10 Z" fill="' + accent + '" stroke="' + accent + '"/>';
    if (kind === 'casque') return '<path d="M-7.5,-9 A8.6,9.4 0 0 1 9.4,-9" fill="none" stroke="' + accent + '" stroke-width="2.4"/><ellipse cx="0" cy="-7" rx="3" ry="3.8" fill="' + accent + '" stroke="none"/>';
    return '';
  }
  function bodyAcc(kind, accent) {
    if (kind === 'echarpe') return '<g fill="none" stroke="' + accent + '" stroke-linecap="round"><path d="M-3.5,-81.5 Q2,-78.5 7.5,-81.5" stroke-width="4.2"/><path class="scarf" d="M-3,-81 Q-9,-77 -12,-68" stroke-width="3.4"/></g>';
    if (kind === 'sac') return '<rect x="-15.5" y="-79" width="9.5" height="21" rx="4" fill="' + accent + '" stroke="none"/><path d="M-6,-79 Q0,-76 1,-66" fill="none" stroke="' + accent + '" stroke-width="1.6"/>';
    return '';
  }

  function arm(side, w, far) {
    var col = far ? ' stroke="' + FAR + '" fill="' + FAR + '"' : '';
    return '<g transform="translate(' + (side === 'b' ? 1.5 : 0) + ',-77)"><g class="uarm uarm-' + side + '"' + col + '>' +
      '<line x1="0" y1="0" x2="0" y2="15" stroke-width="' + (6.4 + w) + '"/>' +
      '<g transform="translate(0,15)"><g class="farm farm-' + side + '">' +
      '<line x1="0" y1="0" x2="0" y2="13" stroke-width="' + (5 + w) + '"/>' +
      '<circle cy="14.2" r="' + (2.9 + w / 2) + '" stroke="none"/></g></g></g></g>';
  }
  function leg(side, w, far) {
    var col = far ? ' stroke="' + FAR + '" fill="' + FAR + '"' : '';
    return '<g transform="translate(' + (side === 'b' ? -1.5 : 1) + ',-47)"><g class="thigh thigh-' + side + '"' + col + '>' +
      '<line x1="0" y1="0" x2="0" y2="23" stroke-width="' + (9 + w) + '"/>' +
      '<g transform="translate(0,23)"><g class="shin shin-' + side + '">' +
      '<line x1="0" y1="0" x2="0" y2="20.5" stroke-width="' + (6.6 + w) + '"/>' +
      '<path d="M-3,19 Q-4.2,24.3 0,24.5 L8.5,24.5 Q10.5,24.5 9.4,22 Q6.5,19.6 2,19.4 Z" stroke-width="' + (1 + w) + '"/>' +
      '</g></g></g></g>';
  }
  function body(w, o) {
    return arm('b', w, !w) + leg('b', w, !w) +
      '<path d="M-5,-82.5 C3,-85.5 9.5,-81.5 9.3,-74 C9,-64 6.5,-56 5.5,-47.5 C3.5,-42.5 -5.5,-42.5 -7.5,-47.5 C-9.5,-57 -11,-71.5 -5,-82.5 Z" stroke-width="' + (1.5 + w) + '"/>' +
      '<path d="M-0.5,-87 L4.2,-87 L4.6,-80 L-1,-80 Z" stroke-width="' + (1 + w) + '"/>' +
      (w ? '' : bodyAcc(o.acc, o.accent)) +
      '<g transform="translate(1.6,-84.5)"><g class="head">' +
      '<ellipse cx="1" cy="-8" rx="' + (8 + w / 2) + '" ry="' + (9.3 + w / 2) + '"/>' +
      '<g' + (w ? ' stroke-width="' + (1 + w) + '"' : '') + '>' + hair(o.hair) + '</g>' +
      (w ? '' : headAcc(o.acc, o.accent)) + '</g></g>' +
      leg('f', w) + arm('f', w);
  }

  /*
   * fig({ id, x, y, h, accent, acc, hair, cls, f })  — f = 1 tourné à droite, -1 à gauche
   */
  function fig(o) {
    var accent = o.accent || '#ffd27a';
    var s = (o.h || 100) / 100;
    var f = o.f || 1;
    var oo = { acc: o.acc, accent: accent, hair: o.hair || 'court' };
    return '<g class="fig ' + (o.cls || '') + '"' + (o.id ? ' id="' + o.id + '"' : '') +
      ' transform="translate(' + (o.x || 0) + ',' + (o.y || 0) + ') scale(' + (s * f) + ',' + s + ')"' +
      ' data-x="' + (o.x || 0) + '" data-y="' + (o.y || 0) + '" data-s="' + s + '" data-f="' + f + '"' +
      (o.opacity != null ? ' opacity="' + o.opacity + '"' : '') + '>' +
      '<ellipse class="shadow" cx="1" cy="1" rx="15" ry="2.6" fill="#000" opacity=".35"/>' +
      '<g class="lean"><g class="pose">' +
      '<g class="rim" fill="' + accent + '" stroke="' + accent + '" stroke-linecap="round" stroke-linejoin="round" filter="url(#blur2)" opacity=".9">' + body(2.6, oo) + '</g>' +
      '<g class="core" fill="' + BODY + '" stroke="' + BODY + '" stroke-linecap="round" stroke-linejoin="round">' + body(0, oo) + '</g>' +
      '</g></g></g>';
  }

  /* Contour plein de la silhouette (pour que la poussière en épouse la forme). */
  function figPath(x, y, h) {
    var s = h / 100;
    function P(px, py) { return (x + px * s).toFixed(1) + ',' + (y + py * s).toFixed(1); }
    var rx = 8 * s, ry = 9.3 * s;
    return [
      'M' + P(-5.4, -92.5) + ' a' + rx + ',' + ry + ' 0 1,0 ' + (2 * rx) + ',0 a' + rx + ',' + ry + ' 0 1,0 ' + (-2 * rx) + ',0 Z',
      'M' + P(-5, -82.5) + ' C' + P(3, -85.5) + ' ' + P(9.5, -81.5) + ' ' + P(9.3, -74) + ' C' + P(9, -64) + ' ' + P(6.5, -56) + ' ' + P(5.5, -47.5) +
        ' L' + P(-7.5, -47.5) + ' C' + P(-9.5, -57) + ' ' + P(-11, -71.5) + ' ' + P(-5, -82.5) + ' Z',
      'M' + P(-5, -48) + ' L' + P(5, -48) + ' L' + P(4, -3) + ' L' + P(9, -3) + ' L' + P(9, 0) + ' L' + P(-4, 0) + ' Z',
      'M' + P(-2.5, -78) + ' L' + P(4, -78) + ' L' + P(3.5, -48) + ' L' + P(-2, -48) + ' Z',
    ].join(' ');
  }

  /* ---------- Étoiles ---------- */
  var SPARK = 'M0,-1 L.18,-.18 L1,0 L.18,.18 L0,1 L-.18,.18 L-1,0 L-.18,-.18 Z';
  function star(o) {
    var r = o.r || 5;
    return '<g class="star ' + (o.cls || '') + '"' + (o.id ? ' id="' + o.id + '"' : '') +
      ' transform="translate(' + o.x + ',' + o.y + ')"' + (o.opacity != null ? ' opacity="' + o.opacity + '"' : '') +
      (o.label ? ' data-label="' + esc(o.label) + '"' : '') + '>' +
      '<circle class="hit" r="24" fill="transparent"/>' +
      '<circle class="halo" r="' + (r * 3.2) + '" fill="url(#' + (o.cyan ? 'haloCyan' : 'halo') + ')"/>' +
      '<path class="spark" d="' + SPARK + '" transform="scale(' + (r * 1.9) + ')" fill="' + (o.color || '#fff4d6') + '"/>' +
      '<circle r="' + (r * 0.45) + '" fill="#fff"/></g>';
  }

  function starfield(n, seed, opts) {
    opts = opts || {};
    var R = rng(seed || 7), out = '<g class="starfield">';
    var y0 = opts.y0 == null ? -320 : opts.y0, y1 = opts.y1 == null ? 430 : opts.y1;
    for (var i = 0; i < n; i++) {
      var x = -360 + R() * 1120, y = y0 + R() * (y1 - y0);
      out += '<circle class="tw" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (0.4 + R() * 1.1).toFixed(2) +
        '" fill="' + (opts.color || '#e9ecff') + '" style="animation-delay:-' + (R() * 6).toFixed(2) + 's" opacity="' + (0.3 + R() * 0.6).toFixed(2) + '"/>';
    }
    return out + '</g>';
  }

  /* Ciel en dégradé, avec des nébuleuses diffuses (dégradés radiaux, pas de filtre : léger sur mobile). */
  function sky(top, bottom, id, glow) {
    id = id || 'skyGrad';
    var R = rng(id.length * 31 + top.length), neb = '';
    var cols = glow || ['#ffffff'];
    for (var i = 0; i < 3; i++) {
      var gid = id + 'N' + i, c = cols[i % cols.length];
      neb += '<radialGradient id="' + gid + '"><stop offset="0" stop-color="' + c + '" stop-opacity="' + (glow ? 0.22 : 0.06) + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>' +
        '<ellipse cx="' + (-40 + R() * 480).toFixed(0) + '" cy="' + (20 + R() * 300).toFixed(0) + '" rx="' + (160 + R() * 160).toFixed(0) + '" ry="' + (90 + R() * 90).toFixed(0) + '" fill="url(#' + gid + ')" transform="rotate(' + (-25 + R() * 50).toFixed(0) + ')"/>';
    }
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bottom + '"/></linearGradient>' +
      '<rect x="-900" y="-700" width="2200" height="2040" fill="url(#' + id + ')"/>' + neb;
  }

  /* Rayons de lumière qui tournent lentement autour d'un point. */
  function rays(x, y, color, n, len, op) {
    n = n || 9; len = len || 520;
    var out = '<g class="rays" style="transform-origin:' + x + 'px ' + y + 'px" opacity="' + (op || 0.5) + '">', gid = 'ray' + Math.round(x) + Math.round(y);
    out += '<radialGradient id="' + gid + '" cx="' + x + '" cy="' + y + '" r="' + len + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="' + color + '" stop-opacity=".55"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient>';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2, w = 0.07 + (i % 3) * 0.03;
      var x1 = x + Math.cos(a - w) * len, y1 = y + Math.sin(a - w) * len, x2 = x + Math.cos(a + w) * len, y2 = y + Math.sin(a + w) * len;
      out += '<path d="M' + x + ',' + y + ' L' + x1.toFixed(0) + ',' + y1.toFixed(0) + ' L' + x2.toFixed(0) + ',' + y2.toFixed(0) + ' Z" fill="url(#' + gid + ')"/>';
    }
    return out + '</g>';
  }

  function hill(yBase, amp, seed, opts) {
    opts = opts || {};
    var R = rng(seed), x0 = opts.x0 == null ? -700 : opts.x0, x1 = opts.x1 == null ? 1100 : opts.x1;
    var step = opts.step || 70, bottom = opts.bottom == null ? 1140 : opts.bottom;
    var d = 'M' + x0 + ',' + bottom + ' L' + x0 + ',' + yBase.toFixed(1);
    var prevX = x0, prevY = yBase;
    for (var x = x0 + step; x <= x1 + step; x += step) {
      var y = yBase - amp * (0.3 + R() * 0.7) * (R() > 0.5 ? 1 : 0.55);
      var cx = (prevX + x) / 2;
      d += ' Q' + cx.toFixed(1) + ',' + (y - amp * 0.35).toFixed(1) + ' ' + x.toFixed(1) + ',' + y.toFixed(1);
      prevX = x; prevY = y;
    }
    d += ' L' + (x1 + step) + ',' + bottom + ' Z';
    return d;
  }

  window.AU = window.AU || {};
  window.AU.gfx = { rng: rng, esc: esc, defs: defs, fig: fig, figPath: figPath, star: star, starfield: starfield, sky: sky, rays: rays, hill: hill, BODY: BODY };
})();
