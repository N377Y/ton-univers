/*
 * Les scènes, dans l'ordre du storyboard.
 * Chaque scène reçoit « c », le contexte fourni par le moteur (js/app.js) :
 *   c.html(svg)          dessine la scène            c.$ / c.$$   sélecteurs dans la scène
 *   c.say(texte)         texte à l'écran             c.hint(txt)  consigne discrète
 *   c.tap(el, fn, nom)   élément touchable           c.ready()    met « Continuer » en valeur
 *   c.wait(ms)           pause                       c.after(ms, fn)
 *   c.tween(ms, fn)      animation pas à pas         c.anim(el, keyframes, opts)
 *   c.walk(fig, path, ms, {s0, s1})                  c.pos(fig, x, y, s, f)
 *   c.draw(path, ms)     tracé progressif d'une ligne
 *   c.dust, c.audio, c.cfg, c.zone (true si rejoué depuis la carte)
 * Une promesse de c.wait/c.tween/c.walk ne se résout jamais si l'on a quitté la scène :
 * les enchaînements async s'arrêtent donc d'eux-mêmes.
 */
(function () {
  'use strict';

  var G = window.AU.gfx;
  var fig = G.fig, star = G.star, esc = G.esc;
  var S = [];

  // remplit un <text> SVG en coupant les lignes trop longues
  function wrapText(el, text, max) {
    max = max || 46;
    el.textContent = '';
    var words = String(text || '').split(' '), lines = [], line = '';
    words.forEach(function (w) { if ((line + ' ' + w).trim().length > max && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim(); });
    if (line) lines.push(line);
    var x = el.getAttribute('x');
    lines.forEach(function (l, k) {
      var ts = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      ts.setAttribute('x', x); ts.setAttribute('dy', k ? '1.3em' : '0');
      ts.textContent = l;
      el.appendChild(ts);
    });
  }

  function add(o) { S.push(o); }

  var GOLD = [240, 200, 120], CYAN = [120, 180, 255], SILVER = [225, 230, 255];

  /* ============================== SAS ============================== */
  add({
    id: 'S0.2', act: 0, theme: 'sas', pad: 'mystere', lock: true,
    build: async function (c) {
      var marks = [
        // héritage : cercle doré, équilibre : losange/boussole, persévérance : croissant, architecte : pixel
        '<circle r="9" fill="none" stroke-width="2.5"/><circle r="3"/>',
        '<path d="M0,-11 L7,0 L0,11 L-7,0 Z" fill="none" stroke-width="2.5"/><circle r="2"/>',
        '<path d="M4,-10 A10.5,10.5 0 1 0 4,10 A8,8 0 1 1 4,-10 Z"/>',
        '<rect x="-8" y="-8" width="16" height="16" fill="none" stroke-width="2.5"/><rect x="-3" y="-3" width="6" height="6"/>',
      ];
      var pos = [[150, 205], [250, 205], [150, 330], [250, 330]];
      c.html(
        G.sky('#0e0a07', '#2a1d12') + G.starfield(60, 3) +
        '<g id="door">' +
        '<rect x="100" y="120" width="200" height="330" rx="100" ry="100" fill="#1c1610" stroke="#8c6b2f" stroke-width="2"/>' +
        '<rect x="112" y="132" width="176" height="306" rx="88" ry="88" fill="none" stroke="#5a4219" stroke-width="1.5"/>' +
        '<line x1="200" y1="132" x2="200" y2="438" stroke="#5a4219" stroke-width="1.5"/>' +
        '<circle id="door-core" cx="200" cy="268" r="6" fill="#ffd27a" opacity=".25"/>' +
        pos.map(function (p, i) {
          return '<g class="mark" id="mark' + i + '" transform="translate(' + p[0] + ',' + p[1] + ')" fill="#5a4a30" stroke="#5a4a30">' + marks[i] + '</g>';
        }).join('') +
        '</g>'
      );
      c.dust.color(GOLD);
      c.dust.set('off');
      c.say('Entre la clé trouvée au terme de ton voyage.');

      c.onLockInput = function (len) {
        for (var i = 0; i < 4; i++) c.$('#mark' + i).classList.toggle('lit', i < len);
      };
      c.onLockError = function () {
        c.anim(c.$('#door'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 420 });
        c.say('Ce sceau ne s’ouvre pas encore.');
      };
      c.onLockSuccess = async function () {
        c.audio.chime(988);
        for (var i = 0; i < 4; i++) c.$('#mark' + i).classList.add('lit');
        // les marques s'alignent sur l'axe de la porte
        var targets = [[200, 180], [200, 235], [200, 300], [200, 355]];
        var from = pos.map(function (p) { return p.slice(); });
        await c.tween(1200, function (t) {
          for (var i = 0; i < 4; i++) {
            var x = from[i][0] + (targets[i][0] - from[i][0]) * t, y = from[i][1] + (targets[i][1] - from[i][1]) * t;
            c.$('#mark' + i).setAttribute('transform', 'translate(' + x + ',' + y + ')');
          }
        });
        c.anim(c.$('#door-core'), [{ opacity: 0.25, r: 6 }, { opacity: 1, r: 14 }], { duration: 600, fill: 'forwards' });
        c.cam(200, 268, 2.4, 2600, 'in');
        await c.wait(500);
        // la porte s'ouvre en particules
        var pts = c.dust.samplePath('M100,220 A100,100 0 0 1 300,220 L300,450 L100,450 Z', 400);
        c.dust.snap(200, 268);
        c.dust.set('shape', { pts: pts, alpha: 0.8, k: 0.05, jitter: 0.5 });
        c.anim(c.$('#door'), [{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: 'forwards' });
        c.audio.wind(3);
        await c.wait(1100);
        c.dust.burst(200, 285, 9);
        c.dust.set('drift', { alpha: 0.5, fraction: 1 });
        c.say('');
        await c.wait(1600);
        c.dust.set('single', { x: 200, y: 300 });
        await c.wait(900);
        c.unlocked();
      };
    },
  });

  /* ============================== ACTE I — L'HÉRITAGE ============================== */
  add({
    id: 'I.1', act: 1, theme: 'heritage', pad: 'aventure',
    build: async function (c) {
      c.html(G.sky('#020308', '#0a0f22', 's11', ['#3a2a6a', '#7a3a12']) + G.starfield(30, 11, { color: '#ffe9b8' }) +
        '<circle id="hit" cx="200" cy="300" r="70" fill="transparent"/>');
      c.dust.color(GOLD);
      c.camSet(200, 300, 3);
      c.dust.set('single', { x: 200, y: 300 });
      c.say('Avant chaque histoire, il y en a d’autres.');
      c.hint('Touche la lumière');
      var done = false;
      function expand() {
        if (done) return;
        done = true;
        c.hint('');
        c.audio.wind(5);
        c.audio.low();
        c.dust.set('galaxy', { x: 200, y: 300, r: 175, k: 0.012 });
        c.cam(200, 300, 1, 7000, 'out');
        c.after(4500, c.ready);
      }
      c.tap(c.$('#hit'), expand, 'La lumière');
      c.after(5000, expand);
    },
  });

  var AFRICA = (function () {
    var p = [[20, 5], [30, 2], [41, 2], [46, 6], [55, 7], [63, 9], [72, 8], [76, 13], [79, 22], [83, 30], [88, 37], [99, 38], [96, 46],
      [89, 55], [82, 64], [81, 73], [76, 80], [73, 87], [64, 96], [56, 98], [51, 94], [48, 85], [45, 74], [42, 63], [41, 54], [37, 48],
      [29, 46], [21, 47], [12, 44], [5, 37], [1, 29], [3, 21], [9, 13]];
    function X(v) { return 70 + v * 2.6; }
    function Y(v) { return 150 + v * 2.8; }
    var d = 'M' + p.map(function (q) { return X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1); }).join(' L') + ' Z';
    var mad = 'M' + X(86) + ',' + Y(70) + ' Q' + X(92) + ',' + Y(73) + ' ' + X(89) + ',' + Y(84) + ' Q' + X(84) + ',' + Y(83) + ' ' + X(86) + ',' + Y(70) + ' Z';
    return { d: d, mad: mad, X: X, Y: Y };
  })();

  /* Dessins des tableaux de l'acte I. Repère local : cadre x 40→360, y 130→440. */
  var MOTIFS = {
    pyramides: function (pal, R, P) {
      function pyr(cx, top, hw, base) {
        return '<path d="M' + (cx - hw) + ',' + base + ' L' + cx + ',' + top + ' L' + (cx + hw) + ',' + base + ' Z" fill="' + pal[1] + '"/>' +
          '<path d="M' + cx + ',' + top + ' L' + (cx + hw) + ',' + base + ' L' + (cx + hw * 0.35) + ',' + base + ' Z" fill="' + pal[2] + '"/>';
      }
      return P(0.85, '<circle cx="262" cy="262" r="70" fill="#fff3d0" opacity=".25"/><circle cx="262" cy="262" r="40" fill="#fff6dc" opacity=".9"/>') +
        P(0.55, '<path d="' + G.hill(345, 16, 7, { x0: -80, x1: 500, step: 90, bottom: 600 }) + '" fill="' + pal[1] + '" opacity=".75"/>') +
        P(0.3, pyr(305, 292, 52, 372) + pyr(200, 238, 92, 372) + pyr(105, 318, 34, 372)) +
        P(0.08, '<path d="' + G.hill(392, 14, 9, { x0: -80, x1: 500, step: 110, bottom: 600 }) + '" fill="' + pal[3] + '"/>');
    },
    chefferie: function (pal, R, P) {
      function cas(cx, base, w, h, roofH) {
        var x = cx - w / 2, lines = '';
        for (var k = 1; k < 7; k++) lines += '<line x1="' + (x + k * w / 7).toFixed(1) + '" y1="' + (base - h) + '" x2="' + (x + k * w / 7).toFixed(1) + '" y2="' + base + '"/>';
        var straw = '';
        for (var j = -3; j <= 3; j++) straw += '<line x1="' + cx + '" y1="' + (base - h - roofH + 6) + '" x2="' + (cx + j * w * 0.16).toFixed(1) + '" y2="' + (base - h + 2) + '"/>';
        return '<rect x="' + x + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '" fill="#6a4128"/>' +
          '<g stroke="#2a1a10" stroke-width="1.2" opacity=".7">' + lines + '</g>' +
          '<rect x="' + (cx - w * 0.13) + '" y="' + (base - h * 0.72) + '" width="' + (w * 0.26) + '" height="' + (h * 0.72) + '" fill="#2a1a10"/>' +
          '<g fill="none" stroke="#e2c27e" stroke-width="1.1"><rect x="' + (cx - w * 0.19) + '" y="' + (base - h * 0.8) + '" width="' + (w * 0.38) + '" height="' + (h * 0.8) + '"/>' +
          '<path d="M' + (cx - w * 0.19) + ',' + (base - h * 0.55) + ' l' + (w * 0.095) + ',-5 l' + (w * 0.095) + ',5 l' + (w * 0.095) + ',-5 l' + (w * 0.095) + ',5"/></g>' +
          '<path d="M' + (cx - w * 0.68) + ',' + (base - h + 4) + ' L' + cx + ',' + (base - h - roofH) + ' L' + (cx + w * 0.68) + ',' + (base - h + 4) + ' Q' + cx + ',' + (base - h + 14) + ' ' + (cx - w * 0.68) + ',' + (base - h + 4) + ' Z" fill="#c8963e"/>' +
          '<g stroke="#8a5f22" stroke-width="1" opacity=".8">' + straw + '</g>';
      }
      return P(0.85, '<circle cx="110" cy="230" r="58" fill="#fff3d0" opacity=".2"/><circle cx="110" cy="230" r="28" fill="#fff6dc" opacity=".85"/>') +
        P(0.55, '<path d="' + G.hill(300, 34, 21, { x0: -80, x1: 500, step: 80, bottom: 600 }) + '" fill="' + pal[1] + '"/>') +
        P(0.3, '<path d="' + G.hill(342, 18, 22, { x0: -80, x1: 500, step: 70, bottom: 600 }) + '" fill="' + pal[2] + '"/>') +
        P(0.08, '<rect x="-80" y="388" width="580" height="220" fill="' + pal[3] + '"/>' + cas(92, 392, 46, 36, 70) + cas(310, 392, 50, 38, 74) + cas(200, 394, 76, 56, 120));
    },
    volcan: function (pal, R, P) {
      return P(0.85, '<circle cx="300" cy="200" r="24" fill="#fff6dc" opacity=".85"/>') +
        P(0.55, '<g fill="#fff" opacity=".28"><ellipse cx="90" cy="300" rx="90" ry="10"/><ellipse cx="320" cy="285" rx="110" ry="9"/></g>') +
        P(0.3, '<path d="M-40,410 C60,370 130,290 178,236 L200,229 L224,236 C272,290 340,370 440,410 Z" fill="' + pal[1] + '"/>' +
          '<path d="M178,236 L200,229 L224,236 C232,246 222,252 214,248 C206,256 194,252 188,248 C180,252 172,246 178,236 Z" fill="#efe3f0" opacity=".7"/>' +
          '<path d="M201,226 C196,206 214,196 206,176 C200,160 214,150 210,136" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="7" stroke-linecap="round"/>') +
        P(0.08, '<path d="' + G.hill(378, 22, 31, { x0: -80, x1: 500, step: 26, bottom: 600 }) + '" fill="' + pal[2] + '"/><path d="' + G.hill(404, 14, 32, { x0: -80, x1: 500, step: 20, bottom: 600 }) + '" fill="' + pal[3] + '"/>');
    },
    foret: function (pal, R, P) {
      var trees = function (x0, x1, y, col, n) {
        var s = '';
        for (var k = 0; k < n; k++) { var x = x0 + R() * (x1 - x0), r = 12 + R() * 14; s += '<circle cx="' + x.toFixed(0) + '" cy="' + (y - r * 0.6 - R() * 18).toFixed(0) + '" r="' + r.toFixed(0) + '" fill="' + col + '"/>'; }
        return s;
      };
      var roots = '';
      for (var k = 0; k < 9; k++) { var rx = 30 + k * 14; roots += '<path d="M' + rx + ',360 q4,22 ' + (8 + (k % 3) * 3) + ',36" fill="none" stroke="' + pal[3] + '" stroke-width="2"/>'; }
      return P(0.85, '<circle cx="250" cy="215" r="60" fill="#fff3d0" opacity=".2"/><circle cx="250" cy="215" r="26" fill="#fff6dc" opacity=".85"/>') +
        P(0.55, '<path d="' + G.hill(300, 22, 41, { x0: -80, x1: 500, step: 24, bottom: 600 }) + '" fill="' + pal[1] + '"/>') +
        P(0.3, '<path d="M-80,330 C80,318 160,342 260,330 S420,322 500,330 L500,600 L-80,600 Z" fill="#9fc2ad" opacity=".85"/>' +
          '<g stroke="#fff" stroke-opacity=".45" stroke-width="1.5"><line x1="60" y1="350" x2="120" y2="350"/><line x1="200" y1="365" x2="290" y2="365"/><line x1="120" y1="388" x2="170" y2="388"/></g>') +
        P(0.08, trees(-20, 150, 378, pal[2], 9) + trees(270, 430, 384, pal[2], 9) + trees(-20, 120, 410, pal[3], 6) + trees(300, 420, 414, pal[3], 6) + roots +
          '<path d="M-80,412 C60,404 140,420 240,410 S400,402 500,412 L500,600 L-80,600 Z" fill="' + pal[3] + '"/>');
    },
    ville: function (pal, R, P) {
      var far = '', near = '';
      for (var k = 0; k < 40; k++) far += '<circle cx="' + (-20 + R() * 460).toFixed(0) + '" cy="' + (300 + R() * 40).toFixed(0) + '" r="1.2" fill="#ffd98a" opacity="' + (0.4 + R() * 0.6).toFixed(2) + '"/>';
      for (var j = 0; j < 9; j++) {
        var x = -10 + j * 50 + R() * 10, w = 30 + R() * 14, h = 22 + R() * 22, b = 410;
        near += '<rect x="' + x.toFixed(0) + '" y="' + (b - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + pal[3] + '"/>' +
          '<path d="M' + (x - 3).toFixed(0) + ',' + (b - h).toFixed(0) + ' L' + (x + w / 2).toFixed(0) + ',' + (b - h - 12).toFixed(0) + ' L' + (x + w + 3).toFixed(0) + ',' + (b - h).toFixed(0) + ' Z" fill="' + pal[2] + '"/>' +
          '<rect x="' + (x + 6).toFixed(0) + '" y="' + (b - h + 8).toFixed(0) + '" width="6" height="6" fill="#ffd98a" opacity="' + (R() > 0.3 ? 0.9 : 0.25) + '"/>' +
          '<rect x="' + (x + w - 12).toFixed(0) + '" y="' + (b - h + 8).toFixed(0) + '" width="6" height="6" fill="#ffd98a" opacity="' + (R() > 0.4 ? 0.9 : 0.25) + '"/>';
      }
      var lights = '';
      [130, 270].forEach(function (x) { lights += '<line x1="' + x + '" y1="372" x2="' + x + '" y2="300" stroke="#2a160c" stroke-width="3"/><rect x="' + (x - 9) + '" y="294" width="18" height="7" fill="#fff6dc"/><path d="M' + (x - 9) + ',301 L' + (x - 40) + ',372 L' + (x + 40) + ',372 L' + (x + 9) + ',301 Z" fill="#fff6dc" opacity=".12"/>'; });
      return P(0.85, '<circle cx="320" cy="225" r="54" fill="#fff3d0" opacity=".2"/><circle cx="320" cy="225" r="24" fill="#fff6dc" opacity=".85"/>') +
        P(0.55, '<path d="' + G.hill(305, 34, 51, { x0: -80, x1: 500, step: 75, bottom: 600 }) + '" fill="' + pal[1] + '"/>' + far) +
        P(0.3, lights + '<path d="M110,376 Q200,346 290,376 L290,384 Q200,368 110,384 Z" fill="' + pal[2] + '"/><ellipse cx="200" cy="378" rx="96" ry="10" fill="#2a160c"/>') +
        P(0.08, near + '<rect x="-80" y="408" width="580" height="200" fill="' + pal[3] + '"/>');
    },
  };

  function tableau(t, i) {
    var R = G.rng(31 + i * 17), pal = t.palette || ['#f2b25c', '#c9743a', '#7a3b22', '#3b1d17'];
    var id = 'tb' + i, x0 = 40, x1 = 360, y0 = 130, y1 = 440;
    function P(k, inner) { return '<g class="par" data-i="' + i + '" data-k="' + k + '">' + inner + '</g>'; }
    var art;
    if (t.photo) {
      art = '<image href="' + esc(t.photo) + '" x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" preserveAspectRatio="xMidYMid slice"/>';
    } else if (MOTIFS[t.motif]) {
      art = '<rect x="0" y="0" width="460" height="600" fill="' + pal[0] + '"/>' + MOTIFS[t.motif](pal, R, P);
    } else {
      var hills = '';
      for (var L = 0; L < 3; L++) {
        var base = y0 + 150 + L * 55, amp = 40 - L * 8;
        if (t.motif === 'plateau' && L === 0) {
          hills += P([0.55, 0.3, 0.08][L], '<path d="M0,' + (base + 20) + ' L60,' + (base + 20) + ' L85,' + (base - 40) + ' L190,' + (base - 40) + ' L215,' + (base + 20) + ' L260,' + (base + 10) + ' L280,' + (base - 15) + ' L340,' + (base - 15) + ' L360,' + (base + 20) + ' L460,' + (base + 20) + ' L460,600 L0,600 Z" fill="' + pal[1] + '"/>');
        } else {
          hills += P([0.55, 0.3, 0.08][L], '<path d="' + G.hill(base, amp, 100 + i * 7 + L, { x0: -80, x1: 500, step: 60 + L * 15, bottom: 600 }) + '" fill="' + pal[Math.min(L + 1, pal.length - 1)] + '"/>');
        }
        if (L === 1 && t.motif === 'fleuve') hills += '<path d="M140,600 C170,470 260,440 220,' + (base + 10) + ' S300,' + (base - 10) + ' 340,' + (base - 12) + '" fill="none" stroke="#ffe9b8" stroke-opacity=".7" stroke-width="10" stroke-linecap="round"/>';
        if (L === 1 && t.motif === 'cote') hills += '<rect x="0" y="' + (base - 10) + '" width="460" height="40" fill="#8fd3e6" opacity=".5"/>';
      }
      var sx = 130 + R() * 140;
      art = '<rect x="0" y="0" width="460" height="600" fill="' + pal[0] + '"/>' + P(0.85, '<circle cx="' + sx + '" cy="' + (y0 + 80) + '" r="34" fill="#fff3d0" opacity=".85"/>') + hills;
    }
    return '<g transform="translate(' + (i * 400) + ',0)">' +
      '<clipPath id="' + id + '"><rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '"/></clipPath>' +
      '<rect x="' + (x0 + 6) + '" y="' + (y0 + 8) + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" fill="#000" opacity=".4"/>' +
      '<g clip-path="url(#' + id + ')">' + art +
      '<rect x="' + x0 + '" y="' + (y1 - 54) + '" width="' + (x1 - x0) + '" height="54" fill="#1c1610" opacity=".72"/>' +
      '<text x="200" y="' + (y1 - 31) + '" text-anchor="middle" class="svg-title" fill="#e2c27e">' + esc(t.title) + '</text>' +
      (t.sub ? '<text x="200" y="' + (y1 - 13) + '" text-anchor="middle" class="svg-legend small" fill="#f3e3bf">' + esc(t.sub) + '</text>' : '') +
      '</g>' +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" fill="none" stroke="#c9a45c" stroke-width="2"/>' +
      '<rect x="' + (x0 + 5) + '" y="' + (y0 + 5) + '" width="' + (x1 - x0 - 10) + '" height="' + (y1 - y0 - 10) + '" fill="none" stroke="#c9a45c" stroke-opacity=".6" stroke-width=".8"/>' +
      [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(function (q) { return '<rect x="' + (q[0] - 3.5) + '" y="' + (q[1] - 3.5) + '" width="7" height="7" fill="#c9a45c" transform="rotate(45 ' + q[0] + ' ' + q[1] + ')"/>'; }).join('') +
      '</g>';
  }

  add({
    id: 'I.2', act: 1, theme: 'heritage', pad: 'aventure',
    build: async function (c) {
      var tabs = c.cfg.origins.tableaux.slice(0, 5);
      var n = tabs.length;
      var mp = c.cfg.origins.mapPoint;
      c.html(G.sky('#04060f', '#141026', 's12', ['#7a3a12', '#3a2a6a']) + G.starfield(40, 12, { color: '#ffe9b8' }) +
        '<g id="map" opacity="0"><path d="' + AFRICA.d + '" fill="#ffd27a" fill-opacity=".05" stroke="#ffd27a" stroke-opacity=".55" stroke-width="1.2"/>' +
        '<path d="' + AFRICA.mad + '" fill="none" stroke="#ffd27a" stroke-opacity=".55"/>' +
        (mp ? '<circle cx="' + AFRICA.X(mp.x) + '" cy="' + AFRICA.Y(mp.y) + '" r="16" fill="url(#halo)" class="pulse"/><circle cx="' + AFRICA.X(mp.x) + '" cy="' + AFRICA.Y(mp.y) + '" r="4.5" fill="#fff3d0"/>' +
          (mp.label ? '<line x1="' + AFRICA.X(mp.x) + '" y1="' + AFRICA.Y(mp.y) + '" x2="' + (AFRICA.X(mp.x) - 40) + '" y2="' + (AFRICA.Y(mp.y) + 38) + '" stroke="#e2c27e" stroke-width="1"/><text x="' + (AFRICA.X(mp.x) - 44) + '" y="' + (AFRICA.Y(mp.y) + 54) + '" text-anchor="middle" class="svg-title" fill="#e2c27e">' + esc(mp.label) + '</text>' : '') : '') + '</g>' +
        '<g id="strip" opacity="0">' +
        '<path id="thread" d="M-400,470 ' + tabs.map(function (_, i) { return 'Q' + (i * 400 + 100) + ',' + (490 + (i % 2) * 6) + ' ' + (i * 400 + 200) + ',468 T' + (i * 400 + 400) + ',470'; }).join(' ') + ' L' + (n * 400 + 400) + ',470" fill="none" stroke="#ffd27a" stroke-width="2" stroke-opacity=".9"/>' +
        tabs.map(tableau).join('') + '</g>' +
        '<g id="nav" opacity="0">' +
        '<g id="prevT" class="chev" transform="translate(22,285)"><circle r="20" fill="#000" fill-opacity=".25"/><path d="M5,-10 L-5,0 L5,10" fill="none" stroke="#ffd27a" stroke-width="2.5"/></g>' +
        '<g id="nextT" class="chev" transform="translate(378,285)"><circle r="20" fill="#000" fill-opacity=".25"/><path d="M-5,-10 L5,0 L-5,10" fill="none" stroke="#ffd27a" stroke-width="2.5"/></g>' +
        '<g id="dots" transform="translate(200,505)">' + tabs.map(function (_, i) { return '<circle cx="' + ((i - (n - 1) / 2) * 16) + '" r="3.5" fill="#ffd27a" opacity="' + (i ? 0.3 : 1) + '"/>'; }).join('') + '</g>' +
        '</g>');
      c.dust.color(GOLD);
      var pts = c.dust.samplePath([AFRICA.d, AFRICA.mad], 400);
      c.dust.set('shape', { pts: pts, alpha: 0.85, k: 0.014 });
      c.camSet(170, 230, 1.6);
      c.cam(215, 330, 1.15, 6500, 'inout');
      c.say('Des terres, des langues, des savoirs et des histoires se transmettent bien avant nous.');
      await c.wait(c.zone ? 1200 : 3200);
      c.anim(c.$('#map'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1500, fill: 'forwards' });
      await c.wait(c.zone ? 800 : 2200);
      c.dust.set('drift', { alpha: 0.3, fraction: 0.5 });
      c.anim(c.$('#map'), [{ opacity: 1 }, { opacity: 0 }], { duration: 1200, fill: 'forwards' });
      c.anim(c.$('#strip'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1400, fill: 'forwards' });
      c.camReset(1800);
      if (n > 1) c.anim(c.$('#nav'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1400, fill: 'forwards' });
      else c.ready();
      if (n > 1) c.hint('Fais glisser pour découvrir la suite');

      var idx = 0, cur = 0, seen = 1;
      var strip = c.$('#strip');
      function go(d) {
        var to = Math.max(0, Math.min(n - 1, idx + d));
        if (to === idx) return;
        idx = to;
        c.audio.blip(440 + idx * 110);
        var from = cur;
        c.tween(800, function (t) {
          cur = from + (idx - from) * t;
          strip.setAttribute('transform', 'translate(' + (-cur * 400) + ',0)');
          c.$$('.par').forEach(function (el) { el.setAttribute('transform', 'translate(' + ((cur - el.dataset.i) * el.dataset.k * 90).toFixed(1) + ',0)'); });
        });
        c.$$('#dots circle').forEach(function (d, i) { d.setAttribute('opacity', i === idx ? 1 : 0.3); });
        seen = Math.max(seen, idx + 1);
        if (seen >= n) { c.hint(''); c.ready(); }
      }
      c.tap(c.$('#prevT'), function () { go(-1); }, 'Tableau précédent', { once: false });
      c.tap(c.$('#nextT'), function () { go(1); }, 'Tableau suivant', { once: false });
      c.swipe(function (dir) { go(dir); });
    },
  });

  function symbolShape(forme) {
    switch (forme) {
      case 'triangle': return '<path d="M0,-20 L18,13 L-18,13 Z"/><path d="M0,-8 L8,7 L-8,7 Z"/>';
      case 'losange': return '<path d="M0,-22 L16,0 L0,22 L-16,0 Z"/><path d="M0,-10 L7,0 L0,10 L-7,0 Z"/>';
      case 'vague': return '<path d="M-20,-6 q5,-8 10,0 t10,0 t10,0 t10,0"/><path d="M-20,6 q5,-8 10,0 t10,0 t10,0 t10,0"/>';
      case 'ankh': return '<ellipse cx="0" cy="-13" rx="7.5" ry="9.5"/><line x1="0" y1="-3.5" x2="0" y2="24"/><line x1="-14" y1="0" x2="14" y2="0"/>';
      case 'sept': return '<path d="M-12,-19 L13,-19 L-1,22" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><line x1="-5" y1="2" x2="9" y2="2" stroke-width="2.5"/>';
      case 'lion': return '<path d="' + (function () { var d = ''; for (var k = 0; k < 16; k++) { var a = k / 16 * Math.PI * 2, r = k % 2 ? 16 : 23; d += (k ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1); } return d + 'Z'; })() + '"/>' +
        '<circle r="11.5"/><path d="M-3.5,2 L3.5,2 L0,6 Z"/><path d="M0,6 Q-4,10 -7,8 M0,6 Q4,10 7,8"/><circle cx="-4.5" cy="-3" r="1.3"/><circle cx="4.5" cy="-3" r="1.3"/>';
      case 'crane': return '<path d="M-14,4 C-16,-17 16,-17 14,4 L9,8 L9,15 L-9,15 L-9,8 Z"/><circle cx="-5.5" cy="-1" r="3.8"/><circle cx="5.5" cy="-1" r="3.8"/><path d="M0,4 L-2.2,8 L2.2,8 Z"/><line x1="-4" y1="11" x2="-4" y2="15"/><line x1="0" y1="11" x2="0" y2="15"/><line x1="4" y1="11" x2="4" y2="15"/>';
      case 'spirale': return '<path d="M0,0 m-2,0 a2,2 0 1,1 4,0 a5,5 0 1,1 -10,0 a9,9 0 1,1 18,0 a13,13 0 1,1 -26,0"/>';
      default: return '<circle r="18"/><circle r="9"/><circle r="2.5"/>';
    }
  }

  add({
    id: 'I.3', act: 1, theme: 'heritage', pad: 'aventure',
    build: async function (c) {
      var sy = c.cfg.origins.symbols.slice(0, 5);
      var n = sy.length;
      var P = sy.map(function (_, i) {
        var a = Math.PI * (0.85 - 0.7 * (n === 1 ? 0.5 : i / (n - 1)));
        return [200 + Math.cos(a) * 140, 330 - Math.sin(a) * 120];
      });
      c.html(G.sky('#03040c', '#120d24', 's13', ['#6a3a12', '#2a2a6a']) + G.starfield(90, 13, { color: '#ffe9b8' }) +
        '<path id="link" d="M' + P.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + '" fill="none" stroke="#ffd27a" stroke-opacity=".35" stroke-dasharray="2 6"/>' +
        sy.map(function (s, i) {
          return '<g class="sym" id="sym' + i + '" transform="translate(' + P[i][0].toFixed(1) + ',' + P[i][1].toFixed(1) + ')" opacity="0">' +
            '<circle r="30" fill="transparent"/>' +
            '<g class="sym-shape" fill="none" stroke="#c8a466" stroke-width="2">' + symbolShape(s.forme) + '</g></g>';
        }).join('') +
        '<g id="orb" opacity="0"><circle r="16" fill="url(#halo)"/><circle r="4" fill="#fff6d8"/></g>' +
        '<text id="legend" x="200" y="420" text-anchor="middle" class="svg-legend" fill="#ffe9b8"></text>' +
        '<text id="legend2" x="200" y="442" text-anchor="middle" class="svg-legend small" fill="#ffe9b8" opacity=".8"></text>');
      c.dust.set('drift', { alpha: 0.25, fraction: 0.4 });
      c.say('On ne naît jamais de rien. On arrive au milieu d’une histoire déjà commencée.');

      function showLegend(i) {
        // légende affichée à l'écran (hors caméra) pour rester lisible pendant les zooms
        c.hint((sy[i].label ? sy[i].label + ' — ' : '') + (sy[i].legend || ''));
        c.audio.chime(660 + i * 90);
      }
      for (var i = 0; i < n; i++) {
        (function (i) {
          c.anim(c.$('#sym' + i), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 300 + i * 350, fill: 'forwards' });
          c.tap(c.$('#sym' + i), function () { showLegend(i); }, sy[i].label || 'Symbole', { once: false });
        })(i);
      }
      await c.wait(1200 + n * 350);
      c.hint('Touche un symbole pour lire sa légende');
      var orb = c.$('#orb');
      orb.setAttribute('opacity', 1);
      for (var k = 0; k < n; k++) {
        var a = k ? P[k - 1] : [P[0][0] - 60, P[0][1] + 30], b = P[k];
        c.cam(b[0] * 0.3 + 140, b[1] + 40, 1.1, 1100);
        await c.tween(1100, function (t) {
          orb.setAttribute('transform', 'translate(' + (a[0] + (b[0] - a[0]) * t) + ',' + (a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 25) + ')');
        });
        c.$('#sym' + k).classList.add('lit');
        c.audio.blip(330 * Math.pow(1.122, k * 2));
      }
      c.camReset(2200);
      await c.wait(2000);
      c.ready();
      await c.wait(3500);
      // les éléments deviennent poussière
      c.hint('');
      var circles = P.map(function (p) { return 'M' + (p[0] - 22) + ',' + p[1] + ' a22,22 0 1,0 44,0 a22,22 0 1,0 -44,0 Z'; });
      c.dust.set('shape', { pts: c.dust.samplePath(circles, 300), alpha: 0.9, k: 0.03 });
      c.$$('.sym, #orb, #link').forEach(function (el) { c.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500, fill: 'forwards' }); });
    },
  });

  add({
    id: 'I.4', act: 1, theme: 'heritage', pad: 'aventure',
    build: async function (c) {
      c.html(G.sky('#0b0a12', '#2a1e1a') +
        '<path d="' + G.hill(520, 18, 5, { step: 120 }) + '" fill="#3a2a20" opacity=".6"/>' +
        '<path d="' + G.hill(560, 10, 6, { step: 160 }) + '" fill="#241a16"/>' +
        G.rays(200, 320, '#ffd27a', 11, 560, 0.35) +
        '<circle id="heart" cx="200" cy="320" r="60" fill="url(#halo)" opacity="0" class="beat"/>');
      c.cam(200, 320, 1.6, 7000, 'inout');
      c.dust.set('gather', { x: 200, y: 320, r: 46, k: 0.016 });
      c.audio.duck(0.35, 3);
      c.say('Et puis, un jour, une histoire nouvelle commence.');
      await c.wait(1500);
      c.anim(c.$('#heart'), [{ opacity: 0 }, { opacity: 0.9 }], { duration: 2500, fill: 'forwards' });
      await c.wait(2000);
      c.ready();
    },
  });

  /* ============================== ACTE II — L'ÉQUILIBRE ============================== */
  function indigoSky(c) {
    return G.sky('#060b06', '#1e2c1a', 'indigo', ['#56732f', '#2a4a2a']) + G.starfield(60, 21, { y1: 380 });
  }

  add({
    id: 'II.1', act: 2, theme: 'balance', pad: 'reflexion',
    build: async function (c) {
      var X = 200, Y = 470, Hh = 120;
      c.html(indigoSky(c) +
        '<ellipse cx="200" cy="480" rx="260" ry="34" fill="#17240f" opacity=".9"/>' +
        '<ellipse cx="200" cy="474" rx="70" ry="9" fill="#000" opacity=".35"/>' +
        fig({ id: 'hero', x: X, y: Y, h: Hh, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair, opacity: 0 }) +
        '<circle id="hit" cx="200" cy="400" r="90" fill="transparent"/>');
      c.dust.color(GOLD);
      var pts = c.dust.samplePath(G.figPath(X, Y, Hh), 300, { sortY: true });
      c.dust.set('shape', { pts: pts, prog: 0, restX: X, restY: Y + 6, restR: 40, alpha: 0.95, k: 0.03, jitter: 0.6 });
      c.camSet(200, 445, 2.1);
      c.cam(200, 420, 1.6, 5000, 'inout');
      c.say('Il y a mille façons de commencer à devenir soi.');
      c.audio.chime(523);
      await c.tween(4200, function (t) { c.dust.update({ prog: t * 0.82 }); }, 'linear');
      c.hint('Touche la nuée');
      var done = false;
      async function finish() {
        if (done) return;
        done = true;
        c.hint('');
        c.audio.chime(784);
        await c.tween(900, function (t) { c.dust.update({ prog: 0.82 + t * 0.18 }); });
        var hero = c.$('#hero');
        c.cam(200, 400, 1.2, 4000);
        await c.anim(hero, [{ opacity: 0 }, { opacity: 1 }], { duration: 1400, fill: 'forwards' });
        c.dust.set('drift', { alpha: 0.25, fraction: 0.35 });
        hero.classList.add('wobble');
        await c.wait(1600);
        hero.classList.remove('wobble');
        hero.classList.add('hands');
        var q = c.cfg.quotes || {};
        if (q.connais) c.say(q.connais.text, q.connais.by);
        await c.wait(2600);
        hero.classList.remove('hands');
        c.ready();
        await c.wait(600);
        hero.classList.add('walking');
        await c.walk(hero, [[X, Y], [X + 26, Y]], 900);
        hero.classList.remove('walking');
      }
      c.tap(c.$('#hit'), finish, 'La nuée de poussière');
      c.after(4200 + 5000, finish);
    },
  });

  add({
    id: 'II.2', act: 2, theme: 'balance', pad: 'reflexion',
    build: async function (c) {
      var L = 'M200,520 C120,500 70,420 120,360 S200,300 200,265';
      var R = 'M200,520 C290,505 340,440 300,380 S210,320 200,265';
      c.html(indigoSky(c) +
        G.rays(200, 215, '#b9d38a', 9, 420, 0.3) +
        '<g id="tree" transform="translate(200,265)" opacity=".55">' +
        '<circle cy="-50" r="70" fill="url(#halo)" opacity=".5"/>' +
        '<path d="M-3,0 L-2,-40 L-16,-58 M-2,-40 L0,-70 M0,-46 L15,-60" stroke="#eef3d8" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="-18" cy="-66" r="16" fill="#8fb35a" opacity=".5"/><circle cx="2" cy="-80" r="20" fill="#b9d38a" opacity=".55"/><circle cx="18" cy="-64" r="15" fill="#8fb35a" opacity=".5"/>' +
        '</g>' +
        '<g class="paths" fill="none" stroke-linecap="round">' +
        '<path id="pL" d="' + L + '" stroke="#6f8f3e" stroke-width="16" opacity=".55"/>' +
        '<path id="pR" d="' + R + '" stroke="#6f8f3e" stroke-width="16" opacity=".55"/>' +
        '<path d="' + L + '" stroke="#dfeac0" stroke-width="1.5" stroke-dasharray="3 7"/>' +
        '<path d="' + R + '" stroke="#dfeac0" stroke-width="1.5" stroke-dasharray="3 7"/>' +
        '<path id="hitL" d="' + L + '" stroke="transparent" stroke-width="50"/>' +
        '<path id="hitR" d="' + R + '" stroke="transparent" stroke-width="50"/>' +
        '</g>' +
        fig({ id: 'hero', x: 200, y: 522, h: 70, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair }));
      c.dust.set('drift', { alpha: 0.2, fraction: 0.3 });
      c.camSet(200, 300, 1);
      c.cam(200, 460, 1.55, 3000);
      var q = c.cfg.quotes || {};
      if (q.controle) c.say(q.controle.text, q.controle.by);
      else c.say('On ne choisit pas toujours ce qui arrive. On peut apprendre à choisir comment avancer.');
      var hero = c.$('#hero');
      await c.wait(1000);
      c.pos(hero, null, null, null, -1);
      await c.wait(1100);
      c.pos(hero, null, null, null, 1);
      await c.wait(1100);
      hero.classList.add('think');
      c.hint('Choisis un chemin — tous deux mènent quelque part');
      var chosen = false;
      async function choose(side) {
        if (chosen) return;
        chosen = true;
        c.hint('');
        hero.classList.remove('think');
        var path = c.$(side === 'L' ? '#pL' : '#pR');
        c.anim(path, [{ opacity: 0.55 }, { opacity: 0.95 }], { duration: 600, fill: 'forwards' });
        c.audio.chime(side === 'L' ? 587 : 659);
        hero.classList.add('walking');
        c.follow(hero, { dy: -30, z: 1.6, k: 0.04 });
        await c.walk(hero, path, 5600, { s0: 0.7, s1: 0.42 });
        hero.classList.remove('walking');
        c.follow(null);
        c.cam(200, 290, 1.05, 2600);
        c.audio.chime(880);
        c.anim(c.$('#tree'), [{ opacity: 0.55 }, { opacity: 1 }], { duration: 1500, fill: 'forwards' });
        c.ready();
      }
      c.tap(c.$('#hitL'), function () { choose('L'); }, 'Le chemin de gauche');
      c.tap(c.$('#hitR'), function () { choose('R'); }, 'Le chemin de droite');
      c.after(11000, function () { choose(Math.random() < 0.5 ? 'L' : 'R'); });
    },
  });

  add({
    id: 'II.3', act: 2, theme: 'balance', pad: 'reflexion',
    build: async function (c) {
      c.html(indigoSky(c) +
        '<rect x="-700" y="470" width="1800" height="700" fill="#111b0d"/>' +
        '<line x1="-700" y1="470" x2="1100" y2="470" stroke="#56732f" stroke-width="1.5"/>' +
        '<g fill="#070c05"><ellipse cx="236" cy="468" rx="16" ry="9"/><ellipse cx="256" cy="470" rx="9" ry="6"/><ellipse cx="120" cy="471" rx="7" ry="4"/></g>' +
        '<g opacity=".4" fill="#000"><ellipse cx="300" cy="476" rx="120" ry="6"/></g>' +
        '<rect id="step" x="250" y="452" width="56" height="18" rx="4" fill="#ffd27a" opacity="0"/>' +
        '<path id="trail" d="M290,470 L1100,470" stroke="#ffd27a" stroke-width="3" opacity="0"/>' +
        '<circle id="glow" cx="0" cy="0" r="50" fill="url(#halo)" opacity="0"/>' +
        '<rect id="ground" x="-700" y="440" width="1800" height="200" fill="transparent"/>' +
        fig({ id: 'hero', x: 40, y: 470, h: 85, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair }));
      c.say('Avancer n’a jamais voulu dire ne jamais tomber.');
      var hero = c.$('#hero');
      c.camSet(60, 420, 1.4);
      c.follow(hero, { dy: -40, z: 1.4, k: 0.05 });
      hero.classList.add('walking');
      await c.walk(hero, [[40, 470], [222, 470]], 3400);
      hero.classList.remove('walking');
      c.follow(hero, { dx: 30, dy: -10, z: 2, k: 0.03 });
      hero.classList.add('stumble');
      c.audio.low();
      await c.wait(1800);
      c.hint('Touche le sol, si tu veux');
      var stepped = false;
      function step() {
        if (stepped) return;
        stepped = true;
        c.hint('');
        c.audio.chime(698);
        c.anim(c.$('#step'), [{ opacity: 0 }, { opacity: 0.9 }], { duration: 700, fill: 'forwards' });
      }
      c.tap(c.$('#ground'), step, 'Le sol');
      await c.wait(3000);
      // il se relève, à son rythme, avec ou sans aide
      c.hint('');
      hero.classList.remove('stumble');
      await c.wait(900);
      var gl = c.$('#glow');
      gl.setAttribute('cx', 222); gl.setAttribute('cy', 420);
      c.anim(gl, [{ opacity: 0 }, { opacity: 0.8 }, { opacity: 0.25 }], { duration: 2000, fill: 'forwards' });
      c.audio.chime(880);
      await c.wait(900);
      c.follow(hero, { dy: -45, z: 1.3, k: 0.04 });
      hero.classList.add('walking');
      var lift = stepped ? 18 : 0;
      await c.walk(hero, [[222, 470], [262, 470 - lift], [300, 470 - lift], [340, 470]], 2600);
      hero.classList.remove('walking');
      var q = c.cfg.quotes || {};
      if (q.itachi) c.say(q.itachi.text, q.itachi.by);
      c.follow(null);
      c.cam(260, 380, 1, 2500);
      c.draw(c.$('#trail'), 2000);
      c.$('#trail').setAttribute('opacity', 0.7);
      c.ready();
    },
  });

  add({
    id: 'II.4', act: 2, theme: 'balance', pad: 'reflexion',
    build: async function (c) {
      var cx = 200, cy = 270, r = 100, words = ['Réfléchir', 'Choisir', 'Apprendre', 'Recommencer'];
      var ring = '';
      for (var i = 0; i < 12; i++) {
        var a = i / 12 * Math.PI * 2 - Math.PI / 2;
        ring += star({ x: (cx + Math.cos(a) * r).toFixed(1), y: (cy + Math.sin(a) * r).toFixed(1), r: i % 3 ? 2.2 : 3.6, cls: 'ring-star dim' });
      }
      var wpos = [[cx - 72, cy - r - 22], [cx + 72, cy - r - 22], [cx + 72, cy + r + 34], [cx - 72, cy + r + 34]];
      c.html(indigoSky(c) +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#8fb35a" stroke-opacity=".35" stroke-dasharray="1 5"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 30) + '" fill="none" stroke="#8fb35a" stroke-opacity=".2"/>' +
        ring +
        words.map(function (w, i) { return '<text class="word svg-legend" style="font-size:16px" x="' + wpos[i][0] + '" y="' + wpos[i][1] + '" text-anchor="middle" fill="#f3f6e4" opacity="0">' + w + '</text>'; }).join('') +
        '<g id="needle" transform="translate(' + cx + ',' + cy + ')"><g class="needle-rot"><path d="M0,-78 L9,0 L0,78 L-9,0 Z" fill="#dfeac0" opacity=".85"/><path d="M0,-78 L9,0 L-9,0 Z" fill="#ffd27a"/></g>' +
        '<circle r="22" fill="transparent" class="hitc"/><circle r="7" fill="#fff" id="hub" opacity=".5"/></g>' +
        '<path id="ink" d="M200,192 L200,70 L1100,70" fill="none" stroke="#ff9a3c" stroke-width="3" opacity="0"/>' +
        '<rect x="-700" y="500" width="1800" height="600" fill="#111b0d"/>' +
        fig({ id: 'hero', x: 70, y: 500, h: 60, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair }));
      var tw = c.$$('.word');
      c.camSet(200, 270, 1.45);
      c.say('Réfléchir. Choisir. Apprendre. Recommencer.');
      c.hint('Touche le centre de la boussole');
      var on = false;
      async function light() {
        if (on) return;
        on = true;
        c.hint('');
        c.$('#hub').setAttribute('opacity', 1);
        c.audio.chime(523);
        c.cam(200, 300, 1, 3500);
        var rot = c.$('.needle-rot');
        c.anim(rot, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(760deg)' }], { duration: 3200, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
        c.$$('.ring-star').forEach(function (s, i) { c.after(i * 180, function () { s.classList.remove('dim'); }); });
        for (var i = 0; i < 4; i++) {
          await c.wait(750);
          c.anim(tw[i], [{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: 'forwards' });
          c.audio.blip([392, 494, 587, 784][i]);
        }
        var hero = c.$('#hero');
        hero.classList.add('walking', 'brisk');
        c.walk(hero, [[70, 500], [330, 500]], 2600).then(function () { hero.classList.remove('walking'); });
        await c.wait(1200);
        c.$('#ink').setAttribute('opacity', 1);
        c.draw(c.$('#ink'), 1800);
        var q = c.cfg.quotes || {};
        await c.wait(1600);
        if (q.fanon) c.say(q.fanon.text, q.fanon.by);
        c.ready();
        await c.wait(4200);
        c.cam(330, 70, 1.8, 2600, 'in');
      }
      c.tap(c.$('#needle'), light, 'Le centre de la boussole');
      c.after(9000, light);
    },
  });

  /* ============================== ACTE III — LA PERSÉVÉRANCE ============================== */
  function inkSky() {
    return G.sky('#f08a45', '#b8321f', 'inkSky') +
      '<g stroke="#3a1608" stroke-opacity=".12" stroke-width="2">' + (function () {
        var s = '';
        for (var i = 0; i < 26; i++) { var a = i / 26 * Math.PI * 2; s += '<line x1="200" y1="260" x2="' + (200 + Math.cos(a) * 900).toFixed(0) + '" y2="' + (260 + Math.sin(a) * 900).toFixed(0) + '"/>'; }
        return s;
      })() + '</g>';
  }

  // pages de manga : des symboles génériques en clin d'œil, sans personnage recopié
  function inkPanel(i, motif, label) {
    var K = '#2a1206', inner = '';
    switch (motif % 5) {
      case 0: // spirale
        inner = '<path d="M50,14 C76,14 86,46 60,56 C40,63 29,40 47,35 C60,31 63,45 54,47" fill="none" stroke="' + K + '" stroke-width="3.2" stroke-linecap="round"/>' +
          '<g stroke="' + K + '" stroke-width="1.2" opacity=".5">' + [0, 1, 2, 3, 4].map(function (k) { return '<line x1="6" y1="' + (16 + k * 12) + '" x2="' + (24 - k * 2) + '" y2="' + (16 + k * 12) + '"/>'; }).join('') + '</g>';
        break;
      case 1: // chapeau de paille sur la mer
        inner = '<g fill="none" stroke="' + K + '" stroke-width="1.4" opacity=".6"><path d="M4,68 q8,-5 16,0 t16,0 t16,0 t16,0 t16,0 t16,0"/><path d="M4,75 q8,-5 16,0 t16,0 t16,0 t16,0 t16,0 t16,0"/></g>' +
          '<ellipse cx="50" cy="46" rx="34" ry="8" fill="#e8c27a" stroke="' + K + '" stroke-width="2.4"/>' +
          '<path d="M30,45 C30,22 70,22 70,45 Z" fill="#e8c27a" stroke="' + K + '" stroke-width="2.4"/><path d="M30.5,40 C40,43 60,43 69.5,40 L70,45 C60,48 40,48 30,45 Z" fill="#a8231b"/>';
        break;
      case 2: // une constellation
        var st = [[18, 58], [34, 40], [52, 46], [66, 24], [84, 34], [74, 60]];
        inner = '<rect x="3" y="3" width="94" height="74" fill="#1c1430"/><path d="M' + st.map(function (q) { return q.join(','); }).join(' L') + '" fill="none" stroke="#e2c27e" stroke-width="1.2"/>' +
          st.map(function (q, k) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (k === 3 ? 3.4 : 2.3) + '" fill="#fff6dc"/>'; }).join('');
        break;
      case 3: // cercle de transmutation
        inner = '<g fill="none" stroke="' + K + '" stroke-width="1.8"><circle cx="50" cy="40" r="30"/><circle cx="50" cy="40" r="24"/>' +
          '<path d="M50,16 L71,52 L29,52 Z"/><path d="M50,64 L29,28 L71,28 Z"/><circle cx="50" cy="40" r="6"/></g>';
        break;
      default: // les quatre éléments
        inner = '<circle cx="50" cy="40" r="30" fill="none" stroke="' + K + '" stroke-width="1.6"/>' +
          '<path d="M50,14 c-6,8 -8,12 0,20 c8,-8 6,-12 0,-20 Z" fill="#a8231b"/>' +
          '<path d="M30,44 q5,-5 10,0 t10,0" fill="none" stroke="#2c62a8" stroke-width="3" stroke-linecap="round"/>' +
          '<rect x="56" y="38" width="14" height="12" fill="#6b5a2a"/>' +
          '<path d="M50,58 c6,0 8,6 2,8 c-6,1 -9,-6 -3,-9" fill="none" stroke="' + K + '" stroke-width="2.2" stroke-linecap="round"/>';
    }
    return '<rect width="100" height="80" fill="#fff6e8" stroke="' + K + '" stroke-width="3"/>' + inner +
      (label ? '<text x="50" y="97" text-anchor="middle" class="svg-legend small" fill="#fff6e8" style="font-size:11.5px;paint-order:stroke;stroke:#2a1206;stroke-width:3px">' + esc(label) + '</text>' : '');
  }

  add({
    id: 'III.1', act: 3, theme: 'ink', pad: 'opening',
    build: async function (c) {
      var pages = [[52, 138, -8], [250, 118, 7], [150, 240, -3], [50, 356, 5], [250, 344, -6]];
      var mangas = c.cfg.mangas || [];
      var fr = c.cfg.friends.slice(0, 3);
      var hero = c.cfg.hero;
      function zoomLines(cx, cy, col, op) {
        var s = '<g class="zoomlines" stroke="' + col + '" stroke-opacity="' + op + '" stroke-width="3" stroke-dasharray="60 420">';
        for (var i = 0; i < 44; i++) {
          var a = i / 44 * Math.PI * 2 + (i % 3) * 0.02;
          s += '<line x1="' + (cx + Math.cos(a) * 40).toFixed(0) + '" y1="' + (cy + Math.sin(a) * 40).toFixed(0) + '" x2="' + (cx + Math.cos(a) * 760).toFixed(0) + '" y2="' + (cy + Math.sin(a) * 760).toFixed(0) + '" style="animation-delay:-' + ((i * 37) % 40) / 100 + 's"/>';
        }
        return s + '</g>';
      }
      // plan A : la course
      var shotA = '<g class="shot" id="shotA" display="none">' +
        '<rect x="-900" y="-700" width="2200" height="2040" fill="#b8321f"/>' +
        '<circle cx="200" cy="330" r="420" fill="url(#halo)" opacity=".9"/>' +
        zoomLines(200, 330, '#3a1004', 0.35) +
        '<g class="streaks" fill="#fff6e8" opacity=".75">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return '<rect x="' + (-200 + k * 90) + '" y="' + (380 + (k % 4) * 45) + '" width="' + (120 + (k % 3) * 60) + '" height="3" rx="1.5"/>'; }).join('') + '</g>' +
        '<rect x="-900" y="560" width="2200" height="900" fill="#2a0c04"/>' +
        fig({ id: 'runA', x: 190, y: 562, h: 290, accent: '#fff3e0', hair: hero.hair, cls: 'walking run' }) +
        '</g>';
      // plan B : les compagnons, en cases de manga
      var polys = [[[-80, -200], [125, -200], [85, 900], [-120, 900]], [[135, -200], [285, -200], [245, 900], [95, 900]], [[295, -200], [500, -200], [460, 900], [255, 900]]];
      var shotB = '<g class="shot" id="shotB" display="none"><rect x="-900" y="-700" width="2200" height="2040" fill="#1a0a04"/>' +
        polys.map(function (p, i) {
          // moins de trois amis : le héros et sa compagne complètent les cases
          var cast = fr.length >= 3 ? fr : [{ accent: hero.accent, hair: hero.hair }].concat(fr, [{ accent: c.cfg.companion.accent, hair: c.cfg.companion.hair, hairColor: c.cfg.companion.hairColor }]);
          var f = cast[i] || { accent: '#e2c27e' };
          var d = 'M' + p.map(function (q) { return q.join(','); }).join(' L') + ' Z';
          var cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4;
          return '<g class="panel" id="pan' + i + '"><clipPath id="clipP' + i + '"><path d="' + d + '"/></clipPath>' +
            '<g clip-path="url(#clipP' + i + ')"><rect x="-900" y="-700" width="2200" height="2040" fill="' + f.accent + '"/>' +
            zoomLines(cx, 260, '#1a0a04', 0.18) +
            fig({ x: cx, y: 600, h: 250, accent: '#fff8ea', acc: f.accessoire, hair: f.hair, hairColor: f.hairColor, f: i % 2 ? -1 : 1, cls: i === 1 ? 'wave' : '' }) + '</g>' +
            '<path d="' + d + '" fill="none" stroke="#1a0a04" stroke-width="7"/></g>';
        }).join('') + '</g>';
      // plan C : sous la lune
      var shotC = '<g class="shot" id="shotC" display="none">' + G.sky('#120a33', '#4a2266', 'shotCsky', ['#ff8ac0', '#7a5aff']) + G.starfield(60, 77, { y1: 520 }) +
        '<circle cx="235" cy="250" r="230" fill="url(#moonGlow)"/><circle cx="235" cy="250" r="150" fill="url(#moonGrad)"/>' +
        '<path d="M-900,1400 L-900,560 L60,560 L80,548 L230,548 L250,560 L1300,560 L1300,1400 Z" fill="#0b0820"/>' +
        '<g stroke="#fff" stroke-opacity=".5" stroke-width="1.5" class="streaks">' + [0, 1, 2, 3, 4].map(function (k) { return '<line x1="' + (-100 + k * 110) + '" y1="' + (300 + k * 40) + '" x2="' + (-20 + k * 110) + '" y2="' + (296 + k * 40) + '"/>'; }).join('') + '</g>' +
        fig({ x: 135, y: 549, h: 200, accent: hero.accent, hair: hero.hair, cls: 'look-up' }) +
        fig({ x: 300, y: 561, h: 160, accent: c.cfg.companion.accent, hair: c.cfg.companion.hair || 'chignon', hairColor: c.cfg.companion.hairColor, f: -1 }) +
        '</g>';
      // plan D : le titre
      var splash = '', R = G.rng(404);
      for (var k = 0; k < 16; k++) splash += '<circle cx="' + (R() * 420 - 10).toFixed(0) + '" cy="' + (140 + R() * 380).toFixed(0) + '" r="' + (2 + R() * 9).toFixed(1) + '"/>';
      var shotD = '<g class="shot" id="shotD" display="none"><rect x="-900" y="-700" width="2200" height="2040" fill="#fff6e8"/>' +
        zoomLines(200, 320, '#1a0a04', 0.22) +
        '<g fill="#1a0a04" opacity=".85">' + splash + '</g>' +
        '<g id="title" style="transform-origin:200px 320px">' +
        '<path d="M-40,350 C80,300 230,330 450,270 L460,330 C250,380 90,360 -30,410 Z" fill="#a8231b"/>' +
        '<text x="200" y="262" text-anchor="middle" class="manga-kicker" fill="#1a0a04">ACTE III</text>' +
        '<text x="200" y="345" text-anchor="middle" class="manga-title" fill="#1a0a04" textLength="372" lengthAdjust="spacingAndGlyphs" transform="rotate(-6 200 330)">PERSÉVÉRANCE</text>' +
        '<text x="200" y="420" text-anchor="middle" class="manga-sub" fill="#1a0a04" transform="rotate(-6 200 410)">passions · amitiés · rencontres</text>' +
        '</g></g>';

      c.html(inkSky() +
        '<path d="' + G.hill(470, 30, 41, { step: 90 }) + '" fill="#9a3b16"/>' +
        '<path d="' + G.hill(510, 18, 42, { step: 120 }) + '" fill="#3a1608"/>' +
        '<path id="road" d="M-700,560 C-200,548 100,572 400,556 S900,560 1100,556" fill="none" stroke="#fff3e0" stroke-opacity=".9" stroke-width="9" stroke-linecap="round" opacity="0"/>' +
        fig({ id: 'runner', x: -60, y: 557, h: 95, accent: '#fff4e0', hair: hero.hair, opacity: 0 }) +
        pages.map(function (p, i) {
          return '<g class="page" id="page' + i + '" transform="translate(' + p[0] + ',' + p[1] + ') rotate(' + p[2] + ')"><g class="float" style="animation-delay:-' + i * 1.3 + 's">' + inkPanel(i, i, mangas[i]) + '</g></g>';
        }).join('') +
        '<g pointer-events="none">' + shotA + shotB + shotC + shotD + '</g>');
      c.dust.set('off');
      c.camSet(200, 260, 1.2);
      c.say('Certains mondes imaginaires nous accompagnent bien après la dernière page.');
      c.hint('Touche une page');
      var opened = false;
      function show(id) {
        c.$$('.shot').forEach(function (s) { s.setAttribute('display', s.id === id ? 'inline' : 'none'); });
      }
      async function open(i) {
        if (opened) return;
        opened = true;
        c.hint('');
        var p = pages[i];
        c.say('');
        c.audio.whoosh(0.9);
        await c.cam(p[0] + 50, p[1] + 40, 4.2, 900, 'in');
        c.flash('#fff', 380);
        c.audio.hit();
        c.$$('.page').forEach(function (pg) { pg.setAttribute('display', 'none'); });
        // générique d'ouverture : plans rapides, calés sur le tempo
        var beat = 60 / 168 * 1000;
        show('shotA');
        c.camSet(200, 330, 1);
        c.cam(200, 380, 1.18, beat * 4, 'linear');
        await c.wait(beat * 4);
        c.flash('#fff', 260);
        show('shotB');
        c.camSet(200, 330, 1.08);
        c.$$('.panel').forEach(function (pn, k) {
          c.anim(pn, [{ transform: 'translateY(' + (k % 2 ? -720 : 720) + 'px)' }, { transform: 'translateY(0)' }], { duration: 380, delay: k * 110, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'backwards' });
        });
        c.cam(200, 330, 1, beat * 4, 'linear');
        await c.wait(beat * 4);
        c.flash('#fff', 260);
        show('shotC');
        c.camSet(220, 330, 1);
        c.cam(200, 400, 1.2, beat * 4, 'linear');
        await c.wait(beat * 4);
        c.flash('#fff', 300);
        show('shotD');
        c.camSet(200, 330, 1);
        c.audio.hit();
        c.anim(c.$('#title'), [{ transform: 'scale(2.6)', opacity: 0 }, { transform: 'scale(.94)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
        c.anim(c.$('#shotD'), [{ transform: 'translate(0,0)' }, { transform: 'translate(-7px,5px)' }, { transform: 'translate(6px,-4px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }], { duration: 360, delay: 300 });
        c.cam(200, 330, 1.1, beat * 7, 'linear');
        await c.wait(beat * 7);
        c.flash('#fff', 500);
        show('');
        // la page devient un chemin
        c.camSet(120, 470, 1.5);
        c.say('Une page devient un chemin.');
        var road = c.$('#road');
        road.setAttribute('opacity', 1);
        c.draw(road, 1600);
        var runner = c.$('#runner');
        runner.setAttribute('opacity', 1);
        runner.classList.add('walking', 'run');
        c.follow(runner, { dy: -60, z: 1.5, k: 0.05 });
        c.walk(runner, [[-60, 557], [180, 556], [330, 558]], 3200).then(function () {
          runner.classList.remove('walking', 'run');
          c.follow(null);
          c.cam(240, 380, 1.05, 2200);
          c.ready();
        });
      }
      for (var i = 0; i < pages.length; i++) (function (i) { c.tap(c.$('#page' + i), function () { open(i); }, mangas[i] || 'Une page flottante'); })(i);
      c.after(8000, function () { open(2); });
    },
  });

  add({
    id: 'III.2', act: 3, theme: 'ink', pad: 'opening',
    build: async function (c) {
      c.html(G.sky('#1a0b12', '#4a1c1a', 'duskSky') + G.starfield(30, 51, { y1: 300 }) +
        '<circle cx="360" cy="240" r="90" fill="url(#halo)" opacity=".7"/>' +
        '<path d="M-700,470 L180,470 L180,700 L-700,700 Z" fill="#2a1206"/>' +
        '<path d="M250,470 L1100,470 L1100,700 L250,700 Z" fill="#2a1206"/>' +
        '<rect x="180" y="470" width="70" height="300" fill="#0b0406"/>' +
        '<g id="edges" opacity="0"><line x1="-700" y1="470" x2="180" y2="470" stroke="#ffd27a" stroke-width="3"/><line x1="250" y1="470" x2="1100" y2="470" stroke="#ffd27a" stroke-width="3"/><circle cx="215" cy="470" r="60" fill="url(#halo)"/></g>' +
        star({ id: 'edgeStar', x: 165, y: 395, r: 5 }) +
        fig({ id: 'hero', x: 30, y: 470, h: 95, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair }));
      c.say('La persévérance, ce n’est pas ne jamais douter. C’est trouver une raison de continuer.');
      c.hint('Touche l’étoile, si tu veux éclairer le passage');
      c.tap(c.$('#edgeStar'), function () {
        c.hint('');
        c.audio.chime(880);
        c.anim(c.$('#edges'), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards' });
      }, 'Une étoile au bord du chemin');
      var hero = c.$('#hero');
      function jump(x0, x1, hgt, dur) {
        return c.tween(dur, function (t) { c.pos(hero, x0 + (x1 - x0) * t, 470 - Math.sin(t * Math.PI) * hgt); }, 'linear');
      }
      c.camSet(60, 420, 1.35);
      c.follow(hero, { dy: -45, z: 1.35, k: 0.06 });
      hero.classList.add('walking', 'run');
      await c.walk(hero, [[30, 470], [168, 470]], 1800);
      hero.classList.remove('walking');
      hero.classList.add('crouch');
      await c.wait(300);
      hero.classList.remove('crouch');
      // essai raté : trop court, il revient sur le bord
      hero.classList.add('air');
      await jump(168, 196, 26, 420);
      await jump(196, 160, 14, 380);
      hero.classList.remove('air');
      hero.classList.add('crouch');
      c.audio.low();
      await c.wait(300);
      hero.classList.remove('crouch');
      await c.wait(400);
      hero.classList.add('shrug');
      await c.wait(1100);
      hero.classList.remove('shrug');
      await c.wait(700);
      // il recule pour prendre de l'élan
      c.pos(hero, null, null, null, -1);
      hero.classList.add('walking');
      await c.walk(hero, [[160, 470], [100, 470]], 900);
      c.pos(hero, null, null, null, 1);
      hero.classList.add('run');
      await c.walk(hero, [[100, 470], [170, 470]], 600);
      hero.classList.remove('walking');
      // le saut réussi, au ralenti
      hero.classList.remove('walking');
      hero.classList.add('air');
      c.follow(hero, { dx: 10, dy: -50, z: 1.9, k: 0.05 });
      c.audio.whoosh(1.4);
      await jump(170, 280, 60, 1500);
      hero.classList.remove('air');
      c.follow(hero, { dy: -45, z: 1.2, k: 0.04 });
      c.audio.hit();
      c.audio.chime(988);
      c.anim(c.$('#edges'), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards' });
      hero.classList.add('walking');
      await c.walk(hero, [[280, 470], [330, 470]], 900);
      hero.classList.remove('walking', 'run');
      c.follow(null);
      c.cam(280, 360, 1, 2000);
      c.hint('');
      c.ready();
    },
  });

  function friendsLayout(c) {
    var fr = c.cfg.friends.slice(0, 4);
    return fr.map(function (f, i) {
      return { f: f, x: 175 + i * 48, sx: 70 + i * 90 + (i % 2) * 20, sy: 120 + (i % 2) * 50 };
    });
  }

  add({
    id: 'III.3', act: 3, theme: 'night', pad: 'opening',
    build: async function (c) {
      var L = friendsLayout(c);
      c.html(G.sky('#0b0a26', '#2b1840') + G.starfield(70, 61, { y1: 400 }) +
        '<g id="bg" class="parallax"><path d="' + G.hill(450, 35, 62, { step: 110 }) + '" fill="#1d1236"/></g>' +
        '<rect x="-700" y="470" width="1800" height="600" fill="#120b24"/>' +
        '<path id="route" d="M' + L.map(function (l) { return l.sx + ',' + l.sy; }).join(' L') + ' L420,90" fill="none" stroke="#ffd27a" stroke-opacity=".5" stroke-dasharray="2 6" opacity="0"/>' +
        L.map(function (l, i) { return star({ id: 'fs' + i, x: l.sx, y: l.sy, r: 4.5, opacity: 0, color: l.f.accent }); }).join('') +
        L.map(function (l, i) { return fig({ id: 'friend' + i, x: 460 + i * 40, y: 470, h: 80 + (i % 2) * 8, accent: l.f.accent, acc: l.f.accessoire, hair: l.f.hair, f: -1 }); }).join('') +
        fig({ id: 'hero', x: 120, y: 470, h: 95, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair }) +
        '<text id="memo" x="200" y="300" text-anchor="middle" class="svg-legend" fill="#fff4d6"></text>' +
        '<text id="memo2" x="200" y="322" text-anchor="middle" class="svg-legend small" fill="#fff4d6" opacity=".85"></text>');
      c.dust.set('off');
      c.camSet(170, 400, 1.3);
      c.say('Et sur le chemin, il y a ceux qui nous rejoignent.');
      var hero = c.$('#hero');
      function showMemo(i) {
        var f = L[i].f;
        c.$('#memo').textContent = f.name || '';
        wrapText(c.$('#memo2'), f.memory);
        c.audio.chime(659 + i * 70);
      }
      for (var i = 0; i < L.length; i++) {
        var fEl = c.$('#friend' + i);
        fEl.classList.add('walking');
        await c.walk(fEl, [[460, 470], [L[i].x, 470]], 2200);
        fEl.classList.remove('walking');
        c.pos(fEl, null, null, null, -1);
        fEl.classList.add('wave');
        if (i === 0) hero.classList.add('wave');
        // une étoile monte au ciel
        var st = c.$('#fs' + i);
        st.setAttribute('opacity', 1);
        c.audio.chime(523 * Math.pow(1.26, i));
        (function (st, l, i) {
          c.tween(1600, function (t) { st.setAttribute('transform', 'translate(' + (l.x + (l.sx - l.x) * t) + ',' + (400 + (l.sy - 400) * t) + ')'); });
          c.tap(st, function () { showMemo(i); }, (l.f.name || 'Une étoile'), { once: false });
        })(st, L[i], i);
        await c.wait(900);
        fEl.classList.remove('wave');
        hero.classList.remove('wave');
      }
      c.hint('Touche une étoile pour un souvenir');
      await c.wait(1200);
      // ils marchent ensemble (le décor défile)
      c.$$('.fig').forEach(function (f) { f.classList.add('walking'); });
      L.forEach(function (_, i) { c.pos(c.$('#friend' + i), null, null, null, 1); });
      c.anim(c.$('#bg'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-160px)' }], { duration: 5000, fill: 'forwards' });
      c.cam(220, 300, 1, 5000);
      await c.wait(2400);
      c.$$('.fig').forEach(function (f) { f.classList.remove('walking'); });
      c.$('#route').setAttribute('opacity', 1);
      c.draw(c.$('#route'), 2000);
      c.ready();
    },
  });

  add({
    id: 'III.4', act: 3, theme: 'moon', pad: 'lune',
    build: async function (c) {
      var hillD = 'M-700,640 L-700,540 Q-150,520 40,480 Q130,446 200,444 Q270,446 350,478 Q520,530 1100,540 L1100,1140 L-700,1140 Z';
      c.html(G.sky('#1a1240', '#4a2f7a', 'violetSky', ['#9a6aff', '#ff8ac0']) + G.starfield(80, 71, { y1: 380 }) +
        G.rays(268, 220, '#e9ecff', 12, 600, 0.22) +
        '<circle cx="268" cy="220" r="170" fill="url(#moonGlow)"/>' +
        '<circle cx="268" cy="220" r="108" fill="url(#moonGrad)"/>' +
        '<g fill="#c7cce6" opacity=".35"><circle cx="235" cy="195" r="14"/><circle cx="300" cy="250" r="20"/><circle cx="290" cy="180" r="8"/><circle cx="250" cy="268" r="7"/></g>' +
        '<g id="pair-stars">' + star({ id: 'sA', x: 120, y: 110, r: 4 }) + star({ id: 'sB', x: 345, y: 90, r: 4, color: '#ffe0ee' }) + '</g>' +
        '<path d="' + hillD + '" fill="#18204a"/>' +
        '<g stroke="#5b6fb8" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round">' + (function () {
          var s = '', R = G.rng(9);
          for (var i = 0; i < 70; i++) { var x = -60 + R() * 520; var y = 470 + R() * 120 + Math.abs(x - 200) * 0.18; s += '<line x1="' + x.toFixed(0) + '" y1="' + y.toFixed(0) + '" x2="' + (x + 2 - R() * 4).toFixed(0) + '" y2="' + (y - 5 - R() * 6).toFixed(0) + '" class="grass" style="animation-delay:-' + (R() * 4).toFixed(1) + 's"/>'; }
          return s;
        })() + '</g>' +
        fig({ id: 'hero', x: -20, y: 470, h: 80, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair }) +
        fig({ id: 'her', x: 430, y: 486, h: 74, accent: c.cfg.companion.accent, hair: c.cfg.companion.hair || 'chignon', hairColor: c.cfg.companion.hairColor, f: -1, opacity: 0 }) +
        '<g id="fall" opacity="0">' + star({ x: 0, y: 0, r: 4.5 }) + '</g>');
      c.dust.set('off');
      var hero = c.$('#hero'), her = c.$('#her');
      c.camSet(60, 380, 1.5);
      c.follow(hero, { dy: -70, z: 1.4, k: 0.035 });
      hero.classList.add('walking');
      await c.walk(hero, [[-20, 486], [60, 470], [130, 450], [178, 445]], 4400);
      hero.classList.remove('walking');
      c.follow(null);
      c.cam(230, 330, 1.05, 3500);
      hero.classList.add('sit');
      await c.wait(1200);
      c.say('Et parfois, un chemin en croise un autre.');
      // elle apparaît au loin, hésite, s'approche
      c.anim(her, [{ opacity: 0 }, { opacity: 1 }], { duration: 1500, fill: 'forwards' });
      await c.wait(1200);
      her.classList.add('walking');
      await c.walk(her, [[430, 486], [340, 476]], 2400);
      her.classList.remove('walking');
      await c.wait(1100);
      c.pos(her, null, null, null, 1);
      await c.wait(500);
      c.pos(her, null, null, null, -1);
      await c.wait(700);
      her.classList.add('walking');
      await c.walk(her, [[340, 476], [280, 452], [214, 445]], 3000);
      her.classList.remove('walking');
      c.pos(her, null, null, null, 1);
      await c.wait(400);
      her.classList.add('sit');
      c.audio.piano(392, 0.6); c.audio.piano(523, 1.6);
      c.cam(200, 365, 1.45, 10000, 'inout');
      await c.wait(2800);
      // les étoiles au-dessus se rapprochent
      // les deux étoiles descendent et se rapprochent, en restant dans le cadre
      c.anim(c.$('#sA'), [{ transform: 'translate(120px,110px)' }, { transform: 'translate(186px,292px)' }], { duration: 5000, fill: 'forwards', easing: 'ease-in-out' });
      c.anim(c.$('#sB'), [{ transform: 'translate(345px,90px)' }, { transform: 'translate(214px,298px)' }], { duration: 5000, fill: 'forwards', easing: 'ease-in-out' });
      c.hint('Touche une étoile, si tu veux');
      var fell = false;
      async function fall() {
        if (fell) return;
        fell = true;
        c.hint('');
        c.audio.chime(1046);
        var f = c.$('#fall');
        f.setAttribute('opacity', 1);
        await c.tween(3000, function (t) { f.setAttribute('transform', 'translate(' + (200 - 4 * t) + ',' + (296 + (404 - 296) * t) + ')'); });
        c.audio.piano(659);
        if (c.cfg.companion.star) c.say(c.cfg.companion.star);
      }
      c.tap(c.$('#sA'), fall, 'Une étoile');
      c.tap(c.$('#sB'), fall, 'Une étoile');
      await c.wait(7000);
      c.ready();
      await c.wait(fell ? 6500 : 4500);
      if (!fell) { fall(); await c.wait(5500); }
      // ils se lèvent et poursuivent le chemin ensemble
      hero.classList.remove('sit'); her.classList.remove('sit');
      c.cam(260, 340, 1, 5000);
      await c.wait(700);
      hero.classList.add('walking'); her.classList.add('walking');
      c.walk(her, [[214, 445], [280, 452], [360, 478], [470, 500]], 5000);
      await c.walk(hero, [[178, 445], [250, 447], [330, 472], [440, 500]], 5000);
    },
  });

  add({
    id: 'III.5', act: 3, theme: 'night', pad: 'lune',
    build: async function (c) {
      var L = friendsLayout(c);
      var people = L.map(function (l, i) { return { name: l.f.name, text: l.f.memory, accent: l.f.accent, acc: l.f.accessoire, hair: l.f.hair, sx: 40 + i * 70, sy: 120 + (i % 2) * 60, x: -10 + i * 85 } ; });
      people.push({ name: '', text: c.cfg.companion.star, accent: c.cfg.companion.accent, hair: c.cfg.companion.hair || 'chignon', hairColor: c.cfg.companion.hairColor, sx: 330, sy: 150, x: 330 });
      c.html(G.sky('#080a22', '#251a46') + G.starfield(110, 81, { y1: 420 }) +
        '<path d="' + G.hill(468, 22, 83, { step: 130 }) + '" fill="#141034"/>' +
        people.map(function (p, i) { return star({ id: 'ps' + i, x: p.sx, y: p.sy, r: 4.5, color: p.accent, opacity: 0 }); }).join('') +
        people.map(function (p, i) { return fig({ id: 'p' + i, x: p.x + 30, y: 480 + (i % 2) * 6, h: 70, accent: p.accent, acc: p.acc, hair: p.hair, hairColor: p.hairColor, f: i % 2 ? -1 : 1 }); }).join('') +
        fig({ id: 'hero', x: 220, y: 488, h: 82, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair }) +
        '<text id="memo" x="200" y="300" text-anchor="middle" class="svg-legend" fill="#fff4d6"></text>' +
        '<text id="memo2" x="200" y="322" text-anchor="middle" class="svg-legend small" fill="#fff4d6" opacity=".85"></text>');
      c.camSet(200, 440, 1.5);
      c.cam(200, 280, 1, 8000, 'inout');
      c.say('Certaines rencontres deviennent des repères.');
      people.forEach(function (p, i) {
        var st = c.$('#ps' + i);
        c.anim(st, [{ opacity: 0 }, { opacity: 1 }], { duration: 1000, delay: 400 + i * 500, fill: 'forwards' });
        c.after(400 + i * 500, function () { c.audio.blip(523 + i * 66); });
        c.tap(st, function () {
          c.$('#memo').textContent = p.name || '';
          wrapText(c.$('#memo2'), p.text);
          c.audio.chime(700 + i * 60);
        }, p.name || 'Une étoile', { once: false });
      });
      await c.wait(1500 + people.length * 500);
      c.hint('Touche les étoiles, si tu veux');
      // les silhouettes quittent le cadre, les étoiles demeurent
      people.forEach(function (p, i) {
        var el = c.$('#p' + i);
        el.classList.add('walking');
        var f = i % 2 ? -1 : 1;
        c.walk(el, [[p.x + 30, 480 + (i % 2) * 6], [p.x + 30 + f * 420, 480 + (i % 2) * 6]], 6000);
      });
      c.ready();
      await c.wait(4000);
      c.$$('.starfield').forEach(function (s) { s.classList.add('pixelate'); });
    },
  });

  /* ============================== ACTE IV — L'ARCHITECTE ============================== */
  function codeSky(seed) {
    return G.sky('#040a18', '#0c1a34', 'codeSky', ['#2c62a8', '#1a3a7a']) + G.starfield(40, seed || 91, { color: '#a9f3ff', y1: 380 });
  }

  add({
    id: 'IV.1', act: 4, theme: 'code', pad: 'scifi',
    build: async function (c) {
      var cols = 8, rows = 9, x0 = 80, y0 = 120, cw = 30, ch = 30;
      var cells = '';
      for (var r = 0; r < rows; r++) for (var k = 0; k < cols; k++) {
        cells += '<rect class="px" x="' + (x0 + k * cw + 1) + '" y="' + (y0 + r * ch + 1) + '" width="' + (cw - 2) + '" height="' + (ch - 2) + '" fill="#2fd3ff" opacity="0" data-d="' + ((r + k) * 60 + Math.random() * 200).toFixed(0) + '"/>';
      }
      var circuits = '', R = G.rng(5);
      for (var i = 0; i < 9; i++) {
        var sx = x0 + Math.floor(R() * cols) * cw + 15, sy = y0 + Math.floor(R() * rows) * ch + 15;
        var mx = sx + (R() > 0.5 ? 1 : -1) * (30 + R() * 60), my = sy + (R() > 0.5 ? 1 : -1) * (30 + R() * 60);
        circuits += '<path class="circ" d="M' + sx + ',' + sy + ' L' + mx + ',' + sy + ' L' + mx + ',' + my + '" fill="none" stroke="#6cb8ff" stroke-width="2" opacity="0"/><circle class="circ-dot" cx="' + mx + '" cy="' + my + '" r="3.5" fill="#cfe6ff" opacity="0"/>';
      }
      var code = '';
      for (var j = 0; j < 9; j++) {
        var ind = (j % 3) * 10;
        code += '<rect class="codeline" x="' + (x0 + 14 + ind) + '" y="' + (y0 + 20 + j * 26) + '" width="' + (40 + R() * 120).toFixed(0) + '" height="6" rx="3" fill="' + (j % 4 ? '#8fc4f0' : '#ffd27a') + '" opacity="0"/>';
      }
      c.html(codeSky() +
        '<g id="panel"><rect x="' + x0 + '" y="' + y0 + '" width="' + cols * cw + '" height="' + rows * ch + '" fill="#ffcf8f" stroke="#2a1206" stroke-width="4"/>' +
        '<path d="M' + x0 + ',330 L130,260 L170,300 L230,220 L290,300 L' + (x0 + cols * cw) + ',270 L' + (x0 + cols * cw) + ',' + (y0 + rows * ch) + ' L' + x0 + ',' + (y0 + rows * ch) + ' Z" fill="#2a1206"/></g>' +
        cells + circuits + code +
        '<g id="pixel" transform="translate(' + (x0 + cols * cw - 15) + ',' + (y0 + 15) + ')"><circle r="26" fill="url(#haloCyan)" class="pulse"/><rect x="-7" y="-7" width="14" height="14" fill="#cfe6ff"/></g>' +
        '<rect x="-700" y="470" width="1800" height="700" fill="#041824"/>' +
        fig({ id: 'hero', x: 60, y: 490, h: 125, accent: '#8fc4f0', hair: c.cfg.hero.hair }));
      c.dust.color(CYAN);
      c.dust.set('drift', { alpha: 0.2, fraction: 0.3 });
      c.camSet(290, 160, 2.6);
      c.say('Et peu à peu, imaginer ne suffit plus : il apprend à construire.');
      c.hint('Touche le pixel lumineux');
      var go = false;
      async function transform() {
        if (go) return;
        go = true;
        c.hint('');
        c.audio.blip(880);
        c.anim(c.$('#pixel'), [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
        c.audio.whoosh(1.5);
        c.cam(190, 330, 1, 3600, 'inout');
        c.$$('.px').forEach(function (p) {
          var d = +p.getAttribute('data-d');
          c.anim(p, [{ opacity: 0 }, { opacity: 0.95 }, { opacity: 0.15 + Math.random() * 0.25 }], { duration: 1600, delay: d, fill: 'forwards' });
        });
        c.anim(c.$('#panel'), [{ opacity: 1 }, { opacity: 0 }], { duration: 1200, delay: 700, fill: 'forwards' });
        for (var b = 0; b < 4; b++) c.after(300 + b * 380, (function (b) { return function () { c.audio.blip(660 + b * 120); }; })(b));
        await c.wait(2200);
        c.$$('.circ').forEach(function (p, i) { p.setAttribute('opacity', 0.9); c.after(i * 120, function () { c.draw(p, 900); }); });
        c.$$('.circ-dot').forEach(function (p, i) { c.anim(p, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 800 + i * 120, fill: 'forwards' }); });
        await c.wait(1400);
        c.$$('.codeline').forEach(function (p, i) { c.anim(p, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 0.85, transform: 'translateX(0)' }], { duration: 500, delay: i * 140, fill: 'forwards' }); });
        await c.wait(1500);
        c.ready();
      }
      c.tap(c.$('#pixel'), transform, 'Le pixel lumineux');
      c.after(8000, transform);
    },
  });

  add({
    id: 'IV.2', act: 4, theme: 'code', pad: 'scifi',
    build: async function (c) {
      var labels = c.cfg.tech.nodes.slice(0, 3);
      var R = G.rng(17), skyline = '', windows = '';
      for (var i = 0; i < 14; i++) {
        var w = 22 + R() * 30, h = 60 + R() * 140, x = -120 + i * 48 + R() * 10;
        skyline += '<rect x="' + x.toFixed(0) + '" y="' + (440 - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="#06202e" stroke="#1b6a86" stroke-opacity=".5"/>';
        for (var k = 0; k < 5; k++) windows += '<rect class="win" x="' + (x + 5 + (k % 2) * (w / 2 - 2)).toFixed(0) + '" y="' + (440 - h + 10 + k * (h / 6)).toFixed(0) + '" width="5" height="4" fill="#cfe6ff" opacity=".08"/>';
      }
      var nodes = [[90, 190], [200, 140], [310, 190]];
      c.html(codeSky(93) +
        '<g id="city">' + skyline + windows + '</g>' +
        '<g id="net" opacity=".15" stroke="#6cb8ff" fill="none" stroke-width="1.5"><path d="M90,190 L200,140 L310,190 M90,190 L60,330 M310,190 L330,320 M200,140 L200,260"/></g>' +
        '<rect x="-700" y="470" width="830" height="20" fill="#0b3a50"/><rect x="270" y="470" width="830" height="20" fill="#0b3a50"/>' +
        '<rect x="-700" y="490" width="1800" height="700" fill="#031520"/>' +
        '<g id="bridge" opacity="0"><rect x="130" y="472" width="140" height="8" fill="#6cb8ff"/><path d="M130,472 Q200,430 270,472" fill="none" stroke="#6cb8ff" stroke-width="2"/></g>' +
        '<g id="tower" class="grow"><rect x="215" y="260" width="44" height="210" fill="#0b3a50" stroke="#6cb8ff" stroke-width="2"/><rect x="225" y="240" width="24" height="20" fill="#0b3a50" stroke="#6cb8ff" stroke-width="2"/><line x1="237" y1="210" x2="237" y2="240" stroke="#6cb8ff" stroke-width="2"/><circle cx="237" cy="207" r="4" fill="#cfe6ff"/></g>' +
        nodes.map(function (n, i) {
          return '<g class="node" id="node' + i + '" transform="translate(' + n[0] + ',' + n[1] + ')"><circle r="30" fill="transparent"/><circle class="halo" r="34" fill="url(#haloCyan)" opacity=".35"/><circle r="11" fill="#062a3a" stroke="#6cb8ff" stroke-width="2.5"/><circle class="core" r="4.5" fill="#6cb8ff"/>' +
            '<text y="-22" text-anchor="middle" class="svg-legend small" fill="#cfe6ff">' + esc(labels[i] || '') + '</text></g>';
        }).join('') +
        fig({ id: 'hero', x: 70, y: 470, h: 110, accent: '#8fc4f0', hair: c.cfg.hero.hair }));
      c.camSet(200, 330, 1.25);
      c.say('Comprendre les systèmes. Relier les idées. Faire naître des possibilités.');
      c.hint('Touche les trois nœuds, dans l’ordre que tu veux');
      var lit = 0;
      var effects = [
        function () { c.anim(c.$('#bridge'), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards' }); },
        function () { c.$('#tower').classList.add('up'); },
        function () {
          c.anim(c.$('#net'), [{ opacity: 0.15 }, { opacity: 1 }], { duration: 900, fill: 'forwards' });
          c.$$('.win').forEach(function (w, i) { c.after(i * 25, function () { w.setAttribute('opacity', Math.random() > 0.3 ? 0.9 : 0.3); }); });
        },
      ];
      var tones = [523, 659, 784];
      nodes.forEach(function (_, i) {
        c.tap(c.$('#node' + i), function () {
          c.$('#node' + i).classList.add('on');
          c.audio.chime(tones[i]);
          effects[i]();
          lit++;
          if (lit === 3) {
            c.hint('');
            c.after(1200, function () {
              c.$$('.win').forEach(function (w) { w.setAttribute('opacity', 0.9); });
              c.dust.set('drift', { alpha: 0.35, fraction: 0.6 });
              c.cam(200, 300, 0.92, 3000);
              c.audio.chime(1046);
              var hero = c.$('#hero');
              hero.classList.add('walking');
              c.walk(hero, [[70, 470], [200, 470]], 2200).then(function () { hero.classList.remove('walking'); c.ready(); });
            });
          }
        }, labels[i] || 'Un nœud');
      });
    },
  });

  add({
    id: 'IV.3', act: 4, theme: 'code', pad: 'scifi',
    build: async function (c) {
      var titles = c.cfg.tech.learning.slice(0, 3);
      var n = titles.length;
      function win(i) {
        var R = G.rng(200 + i), g = '';
        for (var k = 0; k < 5; k++) {
          var x = 40 + R() * 200, y = 60 + R() * 120;
          g += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="6" fill="none" stroke="#6cb8ff" stroke-width="2"/>';
          if (k) g += '<line x1="' + x.toFixed(0) + '" y1="' + y.toFixed(0) + '" x2="' + (40 + R() * 200).toFixed(0) + '" y2="' + (60 + R() * 120).toFixed(0) + '" stroke="#6cb8ff" stroke-opacity=".4"/>';
        }
        var dx = 60 + (n - 1 - i) * 10, dy = 150 + (n - 1 - i) * 14;
        return '<g class="window" id="w' + i + '" transform="translate(' + dx + ',' + dy + ')" data-x="' + dx + '" data-y="' + dy + '">' +
          '<rect width="280" height="210" rx="10" fill="#06202e" stroke="#6cb8ff" stroke-opacity=".7" stroke-width="1.5"/>' +
          '<rect width="280" height="30" rx="10" fill="#0b3a50"/><rect y="20" width="280" height="10" fill="#0b3a50"/>' +
          '<circle cx="16" cy="15" r="4" fill="#ffd27a"/><circle cx="30" cy="15" r="4" fill="#6cb8ff" opacity=".6"/>' +
          '<text x="44" y="20" class="svg-legend small" fill="#cfe6ff">' + esc(titles[i]) + '</text>' +
          '<g transform="translate(0,10)">' + g + '</g></g>';
      }
      c.html(codeSky(97) +
        '<g id="land"><path d="' + G.hill(420, 40, 98, { step: 100 }) + '" fill="#0a3346"/><path d="' + G.hill(450, 25, 99, { step: 140 }) + '" fill="#06202e"/>' +
        '<circle cx="290" cy="230" r="40" fill="url(#haloCyan)"/></g>' +
        '<rect x="-700" y="480" width="1800" height="700" fill="#031520"/>' +
        titles.map(function (_, i) { return win(i); }).join('') +
        fig({ id: 'hero', x: 50, y: 480, h: 110, accent: '#8fc4f0', hair: c.cfg.hero.hair }));
      c.say('Même aujourd’hui, il reste curieux de ce qu’il ne connaît pas encore.');
      c.hint('Fais glisser une fenêtre');
      var hero = c.$('#hero');
      var gone = 0;
      for (var i = n - 1; i >= 0; i--) {
        (function (i) {
          var w = c.$('#w' + i);
          var bx = +w.getAttribute('data-x'), by = +w.getAttribute('data-y');
          function away(dir) {
            if (w._gone) return;
            w._gone = true;
            c.audio.blip(587 + gone * 120);
            var from = w._dx || 0;
            c.tween(700, function (t) { w.setAttribute('transform', 'translate(' + (bx + from + (dir * 520 - from) * t) + ',' + (by - 20 * t) + ')'); });
            gone++;
            if (gone === 1) {
              hero.classList.add('look-up');
              c.ready();
            }
            if (gone === n) c.hint('');
          }
          c.drag(w, function (dx) {
            w._dx = dx;
            w.setAttribute('transform', 'translate(' + (bx + dx) + ',' + by + ')');
          }, function (dx) {
            if (Math.abs(dx) > 50) away(dx > 0 ? 1 : -1);
            else { w._dx = 0; w.setAttribute('transform', 'translate(' + bx + ',' + by + ')'); }
          });
          c.tap(w, function () { if (i === topIndex()) away(1); }, 'Fenêtre : ' + titles[i], { once: false });
        })(i);
      }
      function topIndex() {
        for (var k = 0; k < n; k++) if (!c.$('#w' + k)._gone) return k;
        return -1;
      }
      // w0 doit être au premier plan : on le place en dernier dans le SVG
      var svg = c.$('#w0').parentNode;
      for (var k = n - 1; k >= 0; k--) svg.insertBefore(c.$('#w' + k), c.$('#hero'));
    },
  });

  add({
    id: 'IV.4', act: 4, theme: 'code', pad: 'scifi',
    build: async function (c) {
      var L = friendsLayout(c);
      c.html(codeSky(101) +
        '<g fill="#06202e" stroke="#1b6a86">' +
        '<rect x="-60" y="300" width="50" height="170"/><rect x="0" y="340" width="40" height="130"/><rect x="50" y="260" width="34" height="210"/>' +
        '</g>' +
        '<g fill="none" stroke="#6cb8ff" stroke-opacity=".6" stroke-dasharray="5 5">' +
        '<rect x="300" y="330" width="40" height="140"/><path d="M350,470 L350,380 L390,360 L390,470"/><path d="M420,470 L420,300"/>' +
        '</g>' +
        '<g id="horizon" opacity=".5">' + (c.cfg.tech.horizon || []).slice(0, 2).map(function (h, k) {
          return '<text x="' + [318, 348][k] + '" y="' + [318, 290][k] + '" text-anchor="middle" class="svg-legend small" fill="#cfe6ff">' + esc(h) + '</text>';
        }).join('') + '</g>' +
        L.map(function (l, i) { return star({ id: 'ms' + i, x: 60 + i * 80, y: 110 + (i % 2) * 40, r: 3.5, color: l.f.accent, opacity: 0 }); }).join('') +
        star({ id: 'msC', x: 330, y: 120, r: 3.5, color: c.cfg.companion.accent, opacity: 0 }) +
        G.rays(200, 355, '#8fc4f0', 10, 520, 0.3) +
        '<g id="door"><rect x="168" y="240" width="64" height="230" rx="4" fill="url(#haloCyan)" opacity=".35" filter="url(#blur6)"/>' +
        '<rect x="176" y="250" width="48" height="220" rx="3" fill="#cfe6ff" opacity=".2" stroke="#e8f2ff" stroke-width="2"/>' +
        '<rect id="doorL" x="176" y="250" width="24" height="220" fill="#0b3a50" stroke="#6cb8ff"/><rect id="doorR" x="200" y="250" width="24" height="220" fill="#0b3a50" stroke="#6cb8ff"/></g>' +
        '<rect x="-700" y="470" width="1800" height="700" fill="#031520"/>' +
        fig({ id: 'hero', x: 20, y: 470, h: 100, accent: '#8fc4f0', hair: c.cfg.hero.hair }));
      c.say('Ce qu’il construit ne s’arrête pas à ce qu’il sait déjà faire.');
      var hero = c.$('#hero');
      c.camSet(80, 400, 1.35);
      c.cam(180, 340, 1.1, 3000);
      hero.classList.add('walking');
      await c.walk(hero, [[20, 470], [140, 470]], 2600);
      hero.classList.remove('walking');
      c.$$('[id^="ms"]').forEach(function (s, i) { c.anim(s, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: i * 250, fill: 'forwards' }); });
      c.hint('Touche la porte');
      c.audio.duck(0.3, 2);
      var opened = false;
      async function open() {
        if (opened) return;
        opened = true;
        c.hint('');
        c.audio.duck(1, 0.5);
        c.audio.whoosh(1.6);
        c.audio.chime(659); c.audio.chime(988);
        c.anim(c.$('#horizon'), [{ opacity: 0.5 }, { opacity: 1 }], { duration: 800, fill: 'forwards' });
        c.anim(c.$('#doorL'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-22px)' }], { duration: 1400, fill: 'forwards' });
        c.anim(c.$('#doorR'), [{ transform: 'translateX(0)' }, { transform: 'translateX(22px)' }], { duration: 1400, fill: 'forwards' });
        await c.wait(700);
        c.cam(200, 360, 7, 1700, 'in');
        await c.wait(1300);
        c.flash('#e8f2ff', 1400);
        c.audio.hit();
        await c.wait(500);
        c.camSet(200, 330, 1.25);
        c.cam(200, 320, 1, 3000, 'out');
        c.ready();
      }
      c.tap(c.$('#door'), open, 'La porte de lumière');
      c.after(9000, open);
    },
  });

  /* ============================== ACTE V — LA CONVERGENCE ============================== */
  function island(x, y, inner, id) {
    return '<g class="island" id="' + id + '" transform="translate(' + x + ',' + y + ')"><g class="float">' +
      '<path d="M-62,0 Q-40,60 0,78 Q40,60 62,0 Z" fill="#141a3a"/>' +
      '<ellipse rx="62" ry="14" fill="#232b5c"/>' + inner + '</g></g>';
  }

  add({
    id: 'V.1', act: 5, theme: 'converge', pad: 'finale',
    build: async function (c) {
      var isl = [
        [105, 190, '<path d="M-50,0 Q-30,-28 -8,-10 Q10,-30 50,0 Z" fill="#c9743a"/><circle cx="20" cy="-34" r="9" fill="#ffd27a"/>'],
        [295, 175, '<path d="M-40,0 Q-10,-8 0,-30" fill="none" stroke="#8fb35a" stroke-width="5" stroke-linecap="round"/><circle cy="-44" r="14" fill="#b9d38a" opacity=".8"/><line x1="0" y1="-30" x2="0" y2="-10" stroke="#eef3d8" stroke-width="2"/>'],
        [105, 375, '<circle cx="18" cy="-42" r="18" fill="url(#moonGrad)"/><path d="M-50,0 Q-10,-24 40,0 Z" fill="#18204a"/>'],
        [295, 360, '<g fill="#0b3a50" stroke="#6cb8ff" stroke-width="1.2"><rect x="-30" y="-36" width="14" height="36"/><rect x="-12" y="-52" width="16" height="52"/><rect x="8" y="-30" width="14" height="30"/></g>'],
      ];
      var thread = 'M40,110 C120,120 60,170 105,180 S260,150 295,165 S330,260 200,270 S70,330 105,365 S260,330 295,350 S360,440 300,470';
      c.html(G.sky('#050717', '#1a1440', 'v1', ['#5a3aaa', '#aa6a2a']) + G.starfield(110, 111, { y1: 460 }) +
        '<g id="isles">' + isl.map(function (s, i) { return island(s[0], s[1], s[2], 'is' + i); }).join('') + '</g>' +
        '<path id="thread" d="' + thread + '" fill="none" stroke="#ffd27a" stroke-width="2" stroke-opacity=".25"/>' +
        '<path id="threadOn" d="' + thread + '" fill="none" stroke="#ffd27a" stroke-width="3" opacity="0"/>' +
        '<path id="threadHit" d="' + thread + '" fill="none" stroke="transparent" stroke-width="44"/>');
      c.dust.color(GOLD);
      c.dust.set('drift', { alpha: 0.3, fraction: 0.5 });
      c.camSet(200, 300, 2.8);
      c.cam(200, 290, 1, 5500, 'out');
      c.say('Des origines. Des choix. Des passions. Des rencontres. Des horizons.');
      c.$$('.island .float').forEach(function (el, i) { el.style.animationDelay = (-i * 1.1) + 's'; });
      c.hint('Touche le fil lumineux');
      var joined = false;
      async function join() {
        if (joined) return;
        joined = true;
        c.hint('');
        c.audio.chime(523); c.after(400, function () { c.audio.chime(659); }); c.after(800, function () { c.audio.chime(784); });
        var t = c.$('#threadOn');
        t.setAttribute('opacity', 1);
        c.draw(t, 2200);
        await c.wait(1600);
        isl.forEach(function (s, i) {
          var el = c.$('#is' + i);
          c.tween(1600, function (k) {
            el.setAttribute('transform', 'translate(' + (s[0] + (200 - s[0]) * 0.18 * k) + ',' + (s[1] + (280 - s[1]) * 0.18 * k) + ')');
          });
        });
        await c.wait(1800);
        // les étoiles montent
        c.dust.set('rise', { top: -300 });
        c.ready();
      }
      c.tap(c.$('#threadHit'), join, 'Le fil lumineux');
      c.after(9000, join);
    },
  });

  function constellation(c) {
    var fr = c.cfg.friends.slice(0, 4), fg = c.cfg.fragments;
    var pts = [
      { k: 'origines', x: 60, y: 330, r: 5, text: fg.origines },
      { k: 'choix', x: 120, y: 240, r: 4.5, text: fg.choix },
      { k: 'passions', x: 205, y: 275, r: 5.5, text: fg.passions },
    ];
    var fpos = [[170, 175], [250, 200], [215, 120], [140, 120]];
    fr.forEach(function (f, i) { pts.push({ k: 'f' + i, x: fpos[i][0], y: fpos[i][1], r: 3.8, name: f.name, text: f.memory, color: f.accent, parent: 2 }); });
    pts.push({ k: 'elle', x: 290, y: 285, r: 4.5, text: c.cfg.companion.star, color: c.cfg.companion.accent });
    pts.push({ k: 'horizons', x: 335, y: 175, r: 5, text: fg.horizons });
    return pts;
  }

  add({
    id: 'V.2', act: 5, theme: 'converge', pad: 'finale',
    build: async function (c) {
      var pts = constellation(c);
      var main = ['origines', 'choix', 'passions', 'elle', 'horizons'];
      function P(k) { return pts.filter(function (p) { return p.k === k; })[0]; }
      var lines = [];
      for (var i = 0; i < main.length - 1; i++) lines.push([P(main[i]), P(main[i + 1])]);
      pts.forEach(function (p) { if (p.parent != null) lines.push([pts[p.parent], p]); });
      c.html(G.sky('#03040f', '#141238', 'v2', ['#4a3aaa', '#2a6aaa']) + G.starfield(130, 121, { y1: 470 }) +
        '<g id="lines" stroke="#ffe9b8" stroke-opacity=".55" stroke-width="1.2">' + lines.map(function (l, i) { return '<path class="cl" d="M' + l[0].x + ',' + l[0].y + ' L' + l[1].x + ',' + l[1].y + '" opacity="0"/>'; }).join('') + '</g>' +
        '<g opacity=".5">' + star({ x: 372, y: 120, r: 2 }) + star({ x: 360, y: 80, r: 1.6 }) + '</g>' +
        pts.map(function (p, i) { return star({ id: 'cs' + i, x: p.x, y: p.y, r: p.r, color: p.color, opacity: 0 }); }).join('') +
        '<text id="memo" x="200" y="400" text-anchor="middle" class="svg-legend" fill="#fff4d6"></text>' +
        '<text id="memo2" x="200" y="422" text-anchor="middle" class="svg-legend small" fill="#fff4d6" opacity=".85"></text>' +
        '<rect x="-700" y="500" width="1800" height="700" fill="#07081a"/>' +
        fig({ id: 'hero', x: 70, y: 500, h: 120, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair, cls: 'look-up' }));
      c.dust.set('off');
      c.camSet(100, 420, 1.8);
      c.cam(200, 250, 1, 6000, 'inout');
      c.say('Aucun de ces fragments ne raconte tout. Ensemble, ils dessinent un univers.');
      pts.forEach(function (p, i) {
        c.anim(c.$('#cs' + i), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: i * 300, fill: 'forwards' });
        c.after(i * 300, function () { c.audio.blip(392 * Math.pow(1.122, i)); });
        c.tap(c.$('#cs' + i), function () {
          if (p.name) c.$('#memo').textContent = p.name; else { c.$('#memo').textContent = ''; wrapText(c.$('#memo'), p.text, 34); }
          wrapText(c.$('#memo2'), p.name ? p.text : '');
          c.audio.chime(660 + i * 40);
        }, p.name || p.text || 'Une étoile', { once: false });
      });
      await c.wait(pts.length * 300 + 600);
      var cl = c.$$('.cl');
      for (var k = 0; k < cl.length; k++) {
        cl[k].setAttribute('opacity', 1);
        c.draw(cl[k], 700);
        await c.wait(350);
      }
      c.hint('Touche une étoile pour un fragment de souvenir');
      c.ready();
    },
  });

  add({
    id: 'V.3', act: 5, theme: 'converge', pad: 'finale', final: true,
    build: async function (c) {
      var far = '', R = G.rng(131);
      for (var i = 0; i < 9; i++) far += star({ x: (30 + R() * 340).toFixed(0), y: (60 + R() * 220).toFixed(0), r: 1.5 + R() * 2, cls: 'far', opacity: 0 });
      c.html(G.sky('#04051a', '#25205a', 'v3', ['#6a4aba', '#ba7a3a']) + G.starfield(140, 141, { y1: 440 }) +
        far +
        '<path d="M-700,640 L-700,500 Q200,440 1100,500 L1100,1140 L-700,1140 Z" fill="#0d0f2c"/>' +
        '<path d="M-700,500 Q200,440 1100,500" fill="none" stroke="#ffd27a" stroke-opacity=".35"/>' +
        fig({ id: 'hero', x: 200, y: 472, h: 120, accent: c.cfg.hero.accent, hair: c.cfg.hero.hair }));
      c.dust.set('drift', { alpha: 0.3, fraction: 0.5 });
      var hero = c.$('#hero');
      c.camSet(200, 430, 1.7);
      c.cam(200, 365, 1, 7000, 'inout');
      await c.wait(1200);
      hero.classList.add('look-up');
      c.say('Ton univers ne s’arrête pas ici. La suite reste à écrire.');
      c.$$('.far').forEach(function (s, i) {
        c.anim(s, [{ opacity: 0 }, { opacity: 1 }], { duration: 1600, delay: 600 + i * 450, fill: 'forwards' });
        c.after(600 + i * 450, function () { c.audio.blip(523 * Math.pow(1.06, i * 2)); });
      });
      if (c.zone && c.cfg.finalMessage) {
        await c.wait(4000);
        c.say(c.cfg.finalMessage);
      }
      await c.wait(3200);
      if (c.cfg.birthday) {
        // feux d'artifice d'étoiles, puis le vœu
        var bursts = [[110, 170, '#ffd27a'], [300, 130, c.cfg.companion.accent], [205, 95, '#8fc4f0'], [200, 200, '#ffd27a']];
        bursts.forEach(function (b, k) {
          c.after(k * 650, function () {
            var ring = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            ring.innerHTML = [0, 1].map(function (j) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="4" fill="none" stroke="' + b[2] + '" stroke-width="' + (2 - j) + '"/>'; }).join('') +
              Array.apply(null, Array(12)).map(function (_, j) { var a = j / 12 * Math.PI * 2; return '<line x1="' + b[0] + '" y1="' + b[1] + '" x2="' + (b[0] + Math.cos(a) * 46).toFixed(1) + '" y2="' + (b[1] + Math.sin(a) * 46).toFixed(1) + '" stroke="' + b[2] + '" stroke-width="2" stroke-linecap="round"/>'; }).join('');
            c.camEl.appendChild(ring);
            ring.style.transformOrigin = b[0] + 'px ' + b[1] + 'px';
            c.anim(ring, [{ transform: 'scale(.1)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0.9, offset: 0.4 }, { transform: 'scale(1.9)', opacity: 0 }], { duration: 1600, easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' });
            c.dust.burst(b[0], b[1], 5);
            c.audio.chime([784, 988, 1175, 1568][k]);
          });
        });
        c.after(bursts.length * 650 + 200, function () { c.dust.set('drift', { alpha: 0.5, fraction: 1 }); });
        await c.wait(900);
        c.wish(c.cfg.birthday);
        await c.wait(2600);
      }
      c.finale();
    },
  });

  window.AU.scenes = S;
})();
