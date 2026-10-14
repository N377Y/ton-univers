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

  /* ---------- Silhouette (vue de profil, tournée vers la droite, pieds en 0,0, hauteur 100) ---------- */
  function limbs(widen) {
    var w = widen || 0;
    return '' +
      '<g transform="translate(1,-72)"><line class="arm arm-b" x1="0" y1="0" x2="0" y2="27" stroke-width="' + (6.5 + w) + '"/></g>' +
      '<g transform="translate(-1,-43)"><line class="leg leg-b" x1="0" y1="0" x2="0" y2="40" stroke-width="' + (8 + w) + '"/></g>' +
      '<path d="M-8,-77 Q0,-81 9,-76 L8,-44 Q0,-39 -8,-44 Z" stroke-width="' + (1 + w) + '"/>' +
      '<circle class="head" cx="1" cy="-88" r="' + (10 + w / 2) + '"/>' +
      '<g transform="translate(1,-43)"><line class="leg leg-f" x1="0" y1="0" x2="0" y2="40" stroke-width="' + (8 + w) + '"/></g>' +
      '<g transform="translate(0,-72)"><line class="arm arm-f" x1="0" y1="0" x2="0" y2="27" stroke-width="' + (6.5 + w) + '"/></g>';
  }

  function accessory(kind, accent) {
    switch (kind) {
      case 'casquette': return '<path class="head" d="M-9,-91 Q1,-102 11,-92 L20,-90 L11,-88 L-9,-88 Z" fill="' + accent + '"/>';
      case 'echarpe': return '<g fill="none" stroke="' + accent + '" stroke-linecap="round"><path d="M-8,-76 Q1,-73 9,-76" stroke-width="5"/><path d="M-6,-75 L-13,-60" stroke-width="4"/></g>';
      case 'sac': return '<rect x="-19" y="-73" width="11" height="22" rx="4" fill="' + accent + '"/>';
      case 'casque': return '<path class="head" d="M-10,-89 A11,11 0 0 1 12,-89" fill="none" stroke="' + accent + '" stroke-width="3"/><circle class="head" cx="1" cy="-86" r="4" fill="' + accent + '"/>';
      case 'chignon': return '<circle class="head" cx="-8" cy="-95" r="6.5" fill="' + BODY + '"/>';
      default: return '';
    }
  }

  /*
   * fig({ id, x, y, h, accent, acc, cls, f })  — f = 1 tourné à droite, -1 à gauche
   */
  function fig(o) {
    var accent = o.accent || '#ffd27a';
    var s = (o.h || 100) / 100;
    var f = o.f || 1;
    var rimAcc = o.acc === 'chignon' ? '<circle class="head" cx="-8" cy="-95" r="8"/>' : '';
    return '<g class="fig ' + (o.cls || '') + '"' + (o.id ? ' id="' + o.id + '"' : '') +
      ' transform="translate(' + (o.x || 0) + ',' + (o.y || 0) + ') scale(' + (s * f) + ',' + s + ')"' +
      ' data-x="' + (o.x || 0) + '" data-y="' + (o.y || 0) + '" data-s="' + s + '" data-f="' + f + '"' +
      (o.opacity != null ? ' opacity="' + o.opacity + '"' : '') + '>' +
      '<g class="pose">' +
      '<g class="rim" fill="' + accent + '" stroke="' + accent + '" stroke-linecap="round" filter="url(#blur2)" opacity=".85">' + rimAcc + limbs(3) + '</g>' +
      '<g class="core" fill="' + BODY + '" stroke="' + BODY + '" stroke-linecap="round" stroke-linejoin="round">' + limbs(0) + accessory(o.acc, accent) + '</g>' +
      '</g></g>';
  }

  /* Contour plein de la silhouette (pour que la poussière en épouse la forme). */
  function figPath(x, y, h) {
    var s = h / 100;
    function P(px, py) { return (x + px * s).toFixed(1) + ',' + (y + py * s).toFixed(1); }
    var r = 10 * s;
    return [
      'M' + P(-9, -88) + ' a' + r + ',' + r + ' 0 1,0 ' + (2 * r) + ',0 a' + r + ',' + r + ' 0 1,0 ' + (-2 * r) + ',0 Z',
      'M' + P(-8, -77) + ' L' + P(9, -76) + ' L' + P(8, -44) + ' L' + P(-8, -44) + ' Z',
      'M' + P(-5, -45) + ' L' + P(5, -45) + ' L' + P(5, 0) + ' L' + P(-5, 0) + ' Z',
      'M' + P(-3, -74) + ' L' + P(4, -74) + ' L' + P(4, -45) + ' L' + P(-3, -45) + ' Z',
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

  function sky(top, bottom, id) {
    id = id || 'skyGrad';
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bottom + '"/></linearGradient>' +
      '<rect x="-700" y="-500" width="1800" height="1640" fill="url(#' + id + ')"/>';
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
  window.AU.gfx = { rng: rng, esc: esc, defs: defs, fig: fig, figPath: figPath, star: star, starfield: starfield, sky: sky, hill: hill, BODY: BODY };
})();
