/*
 * Moteur du récit : enchaînement des scènes, sas du code, carte finale,
 * sauvegarde locale de la progression, son et accessibilité.
 */
(function () {
  'use strict';

  var AU = window.AU, cfg = AU.config, dust = AU.dust, audio = AU.audio, scenes = AU.scenes, G = AU.gfx;
  var $ = function (s) { return document.querySelector(s); };

  var ACTS = [
    { num: '', name: 'Le portail', sub: '' },
    { num: 'I', name: 'L’Héritage', sub: 'avant lui' },
    { num: 'II', name: 'L’Équilibre', sub: 'apprendre à être' },
    { num: 'III', name: 'La Persévérance', sub: 'passions et rencontres' },
    { num: 'IV', name: 'L’Architecte', sub: 'construire demain' },
    { num: 'V', name: 'La Convergence', sub: 'son univers' },
  ];

  var ZONES = [
    { id: 'horizon', name: 'Horizon ouvert', scene: 'V.3', x: 200, y: 110,
      info: function () { return [cfg.finalMessage || 'Ton univers ne s’arrête pas ici. La suite reste à écrire.']; } },
    { id: 'colline', name: 'Colline sous la Lune', scene: 'III.4', x: 315, y: 215,
      info: function () { return [cfg.companion.star]; } },
    { id: 'choix', name: 'Chemin des choix', scene: 'II.1', x: 90, y: 250,
      info: function () { return cfg.thoughts; } },
    { id: 'compagnons', name: 'Village des compagnons', scene: 'III.3', x: 215, y: 330,
      info: function () { return cfg.friends.map(function (f) { return (f.name ? f.name + ' — ' : '') + (f.memory || ''); }); } },
    { id: 'origines', name: 'Arbre des origines', scene: 'I.2', x: 95, y: 430,
      info: function () {
        var o = cfg.origins;
        return o.tableaux.map(function (t) { return t.title; })
          .concat(o.symbols.map(function (s) { return s.label + ' : ' + s.legend; }))
          .concat((o.sources || []).map(function (s) { return 'Source : ' + s; }));
      } },
    { id: 'cite', name: 'Cité de demain', scene: 'IV.2', x: 300, y: 440,
      info: function () { return cfg.tech.interests; } },
  ];

  /* ---------------- état sauvegardé ---------------- */
  var KEY = 'aux-origines-de-ton-univers';
  var state = { unlocked: false, idx: 1, finished: false, sound: false, reduced: null };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  if (state.reduced == null) state.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------------- éléments ---------------- */
  var stage = $('#stage'), caption = $('#caption-text'), hintEl = $('#hint'), actions = $('#actions');
  var nextBtn = $('#next'), prevBtn = $('#prev'), controls = $('#controls');
  var cur = -1, ctx = null, mode = 'story', currentZone = null;

  function sceneIndex(id) { for (var i = 0; i < scenes.length; i++) if (scenes[i].id === id) return i; return -1; }

  var EASE = {
    linear: function (t) { return t; },
    inout: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  };

  /* ---------------- contexte d'une scène ---------------- */
  function makeCtx(scene) {
    var c = { alive: true, cfg: cfg, dust: dust, audio: audio, zone: mode === 'zone', scene: scene };
    var timers = [], anims = [], cleanups = [];
    var k = function (ms) { return state.reduced ? ms * 0.5 : ms; };

    c.html = function (markup) {
      stage.innerHTML = '<svg class="scene" viewBox="0 0 400 640" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' +
        G.esc(ACTS[scene.act].name) + '">' + G.defs() + markup + '</svg>';
      c.svg = stage.firstChild;
      fitViewBox();
      updateMatrix();
      return c.svg;
    };
    c.$ = function (s) { return c.svg.querySelector(s); };
    c.$$ = function (s) { return Array.prototype.slice.call(c.svg.querySelectorAll(s)); };
    c.say = function (t) { if (c.alive) say(t); };
    c.hint = function (t) { if (c.alive) hintEl.textContent = t || ''; };
    c.ready = function () { if (c.alive) nextBtn.classList.add('pulse'); };
    c.after = function (ms, fn) {
      var id = setTimeout(function () { if (c.alive) fn(); }, ms);
      timers.push(id);
      return id;
    };
    c.wait = function (ms) { return new Promise(function (res) { c.after(ms, res); }); };
    c.tween = function (ms, fn, ease) {
      var dur = k(ms), e = EASE[ease || 'inout'], t0 = performance.now();
      return new Promise(function (res) {
        function step(now) {
          if (!c.alive) return;
          var t = Math.min(1, (now - t0) / dur);
          fn(e(t));
          if (t < 1) requestAnimationFrame(step); else res();
        }
        requestAnimationFrame(step);
      });
    };
    c.anim = function (el, kf, opts) {
      opts = Object.assign({}, opts);
      opts.duration = k(opts.duration || 600);
      if (opts.delay) opts.delay = k(opts.delay);
      if (!el.animate) {
        var last = kf[kf.length - 1];
        for (var p in last) if (p === 'opacity') el.setAttribute('opacity', last[p]); else el.style[p] = last[p];
        return Promise.resolve();
      }
      var a = el.animate(kf, opts);
      anims.push(a);
      return new Promise(function (res) {
        a.finished.then(function () { if (c.alive) res(); }).catch(function () {});
      });
    };
    c.pos = function (el, x, y, s, f) {
      var d = el.dataset;
      if (x != null) d.x = x;
      if (y != null) d.y = y;
      if (s != null) d.s = s;
      if (f != null) d.f = f;
      el.setAttribute('transform', 'translate(' + (+d.x).toFixed(2) + ',' + (+d.y).toFixed(2) + ') scale(' + (d.s * d.f) + ',' + d.s + ')');
    };
    c.walk = function (el, path, ms, o) {
      o = o || {};
      var pointAt;
      if (Array.isArray(path)) {
        var segs = [], total = 0;
        for (var i = 1; i < path.length; i++) {
          var l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
          segs.push(l); total += l;
        }
        pointAt = function (t) {
          var dist = t * total;
          for (var i = 0; i < segs.length; i++) {
            if (dist <= segs[i] || i === segs.length - 1) {
              var u = segs[i] ? Math.min(1, dist / segs[i]) : 1;
              return [path[i][0] + (path[i + 1][0] - path[i][0]) * u, path[i][1] + (path[i + 1][1] - path[i][1]) * u];
            }
            dist -= segs[i];
          }
        };
      } else {
        var len = path.getTotalLength();
        pointAt = function (t) { var p = path.getPointAtLength(t * len); return [p.x, p.y]; };
      }
      var px = null;
      return c.tween(ms, function (t) {
        var p = pointAt(t);
        var f = null;
        if (px != null && Math.abs(p[0] - px) > 0.05) f = p[0] > px ? 1 : -1;
        px = p[0];
        var s = o.s0 != null ? o.s0 + (o.s1 - o.s0) * t : null;
        c.pos(el, p[0], p[1], s, f);
      }, 'linear');
    };
    c.draw = function (el, ms) {
      var len = el.getTotalLength ? el.getTotalLength() : 1000;
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      return c.anim(el, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: ms, fill: 'forwards', easing: 'ease-in-out' });
    };
    c.on = function (target, ev, fn, opt) {
      target.addEventListener(ev, fn, opt);
      cleanups.push(function () { target.removeEventListener(ev, fn, opt); });
    };
    c.tap = function (el, fn, label, o) {
      o = o || {};
      var once = o.once !== false;
      el.classList.add('tappable');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      if (label) el.setAttribute('aria-label', label);
      var fired = false;
      function fire(e) {
        if (el._dragged) { el._dragged = false; return; }
        if (once && fired) return;
        if (e) e.stopPropagation();
        fired = true;
        if (once) { el.classList.remove('tappable'); el.removeAttribute('tabindex'); }
        fn();
      }
      c.on(el, 'click', fire);
      c.on(el, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(e); } });
    };
    c.swipe = function (fn) {
      var x0 = null, y0 = 0;
      c.on(stage, 'pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; });
      c.on(stage, 'pointerup', function (e) {
        if (x0 == null) return;
        var dx = e.clientX - x0, dy = e.clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) fn(dx < 0 ? 1 : -1);
      });
    };
    c.drag = function (el, move, end) {
      var x0 = null, id = null;
      var sc = function () { var m = c.svg.getScreenCTM(); return m ? m.a : 1; };
      c.on(el, 'pointerdown', function (e) {
        x0 = e.clientX; id = e.pointerId;
        try { el.setPointerCapture(id); } catch (err) {}
      });
      c.on(el, 'pointermove', function (e) {
        if (x0 == null) return;
        var dx = (e.clientX - x0) / sc();
        if (Math.abs(dx) > 6) el._dragged = true;
        if (el._dragged) move(dx);
      });
      var up = function (e) {
        if (x0 == null) return;
        var dx = (e.clientX - x0) / sc();
        x0 = null;
        if (el._dragged) end(dx);
        setTimeout(function () { el._dragged = false; }, 0);
      };
      c.on(el, 'pointerup', up);
      c.on(el, 'pointercancel', up);
    };
    c.unlocked = function () { if (c.alive) afterUnlock(); };
    c.finale = function () {
      if (!c.alive) return;
      if (mode === 'zone') { c.ready(); return; }
      state.finished = true; save();
      showFinale();
    };
    c.leave = function () {
      c.alive = false;
      timers.forEach(clearTimeout);
      cleanups.forEach(function (f) { f(); });
      return function () { anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); };
    };
    return c;
  }

  // en paysage sur téléphone, on recadre la scène pour qu'elle reste au-dessus du texte
  function fitViewBox() {
    var land = innerWidth > innerHeight * 1.15 && innerHeight < 620;
    document.body.classList.toggle('land', land);
    if (ctx && ctx.svg) ctx.svg.setAttribute('viewBox', land ? '0 40 400 500' : '0 0 400 640');
  }

  function updateMatrix() {
    if (ctx && ctx.svg && ctx.svg.getScreenCTM) dust.setMatrix(ctx.svg.getScreenCTM());
  }
  addEventListener('resize', function () { fitViewBox(); updateMatrix(); });

  /* ---------------- texte à l'écran ---------------- */
  var sayTimer = null;
  function say(t) {
    clearTimeout(sayTimer);
    caption.classList.add('out');
    sayTimer = setTimeout(function () {
      caption.textContent = t || '';
      caption.classList.remove('out');
    }, 260);
  }

  /* ---------------- navigation ---------------- */
  var transitioning = false;
  function goTo(i) {
    if (i < 0 || i >= scenes.length) return;
    var sc = scenes[i];
    var prevAct = cur >= 0 && scenes[cur] ? scenes[cur].act : -1;
    var finishOld = ctx ? ctx.leave() : null;
    hideOverlays();
    nextBtn.classList.remove('pulse');
    hintEl.textContent = '';
    actions.innerHTML = '';
    actions.hidden = true;
    document.body.classList.remove('finale');
    transitioning = true;
    stage.classList.add('fading');
    setTimeout(function () {
      if (finishOld) finishOld();
      cur = i;
      document.body.dataset.theme = sc.theme;
      audio.pad(audio.PADS[sc.pad]);
      if (mode === 'story' && !sc.lock) { state.idx = i; save(); }
      updateHud(sc);
      updateControls(sc);
      if (sc.lock) { $('#lockform').hidden = false; } else { $('#lockform').hidden = true; }
      $('#zonecard').hidden = !(mode === 'zone' && currentZone);
      ctx = makeCtx(sc);
      var p = sc.build(ctx);
      if (p && p.catch) p.catch(function (e) { console.error(e); });
      stage.classList.remove('fading');
      transitioning = false;
      if (mode === 'story' && sc.act !== prevAct && sc.act > 0) showActCard(sc.act);
    }, ctx ? 420 : 0);
  }

  function next() {
    if (transitioning) return;
    if (mode === 'zone') { openMap(); return; }
    var sc = scenes[cur];
    if (!sc || sc.lock) return;
    if (cur < scenes.length - 1) goTo(cur + 1);
  }
  function prev() {
    if (transitioning || mode !== 'story') return;
    if (cur > 1) goTo(cur - 1);
  }

  function updateHud(sc) {
    var a = ACTS[sc.act];
    $('#actlabel').textContent = sc.act ? a.num + ' · ' + a.name : '';
    var dots = $('#progress').children;
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('done', mode === 'story' && i + 1 < sc.act);
      dots[i].classList.toggle('now', mode === 'story' && i + 1 === sc.act);
    }
    $('#progress').hidden = mode !== 'story' || !sc.act;
  }

  function updateControls(sc) {
    controls.hidden = !!sc.lock || mode === 'map';
    prevBtn.hidden = mode !== 'story' || cur <= 1;
    nextBtn.hidden = mode === 'story' && !!sc.final;
    nextBtn.querySelector('span').textContent = mode === 'zone' ? 'Retour à la carte' : 'Continuer';
  }

  function showActCard(act) {
    var a = ACTS[act], el = $('#actcard');
    el.innerHTML = '<span class="num">Acte ' + a.num + '</span><span class="name">' + a.name + '</span><span class="sub">' + a.sub + '</span>';
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  /* ---------------- le sas ---------------- */
  $('#lockform').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#code');
    var ok = AU.hashCode(input.value) === cfg.codeHash;
    if (!ctx || !ctx.scene.lock) return;
    if (ok) {
      input.blur();
      $('#lockform').classList.add('done');
      $('#lockform').querySelectorAll('input,button').forEach(function (el) { el.disabled = true; });
      ctx.onLockSuccess && ctx.onLockSuccess();
    } else {
      ctx.onLockError && ctx.onLockError();
      input.select();
    }
  });
  $('#code').addEventListener('input', function (e) {
    if (ctx && ctx.onLockInput) ctx.onLockInput(AU.normalizeCode(e.target.value).length);
  });

  function afterUnlock() {
    state.unlocked = true;
    state.idx = 1;
    state.finished = state.finished || false;
    save();
    $('#lockform').hidden = true;
    showOverlay('#soundask');
  }

  $('#sound-on').addEventListener('click', function () { setSound(true); hideOverlays(); startStory(1); });
  $('#sound-off').addEventListener('click', function () { setSound(false); hideOverlays(); startStory(1); });

  function startStory(i) {
    mode = 'story';
    currentZone = null;
    $('#map').hidden = true;
    goTo(i);
  }

  /* ---------------- fin & carte ---------------- */
  function showFinale() {
    actions.innerHTML = '';
    var b1 = button('Explorer mon univers', 'primary', openMap);
    var b2 = button('Revoir l’histoire', '', function () { startStory(1); });
    actions.appendChild(b1); actions.appendChild(b2);
    actions.hidden = false;
    controls.hidden = true;
    document.body.classList.add('finale');
    b1.focus({ preventScroll: true });
  }

  function button(label, cls, fn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + (cls || '');
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }

  function buildMap() {
    var svg = $('#mapsvg');
    var lines = [[0, 1], [0, 2], [2, 3], [1, 3], [3, 4], [3, 5], [4, 5]];
    var html = G.defs() + G.starfield(120, 401, { y0: -300, y1: 900 }) +
      '<g stroke="#ffe9b8" stroke-opacity=".3" stroke-dasharray="2 5">' + lines.map(function (l) {
        return '<line x1="' + ZONES[l[0]].x + '" y1="' + ZONES[l[0]].y + '" x2="' + ZONES[l[1]].x + '" y2="' + ZONES[l[1]].y + '"/>';
      }).join('') + '</g>' +
      '<g opacity=".7">' + G.star({ x: 365, y: 60, r: 2 }) + G.star({ x: 30, y: 90, r: 1.6 }) + G.star({ x: 370, y: 330, r: 1.8 }) + '</g>';
    ZONES.forEach(function (z, i) {
      html += '<g class="zone" data-i="' + i + '" role="button" tabindex="0" aria-label="' + G.esc(z.name) + '" transform="translate(' + z.x + ',' + z.y + ')">' +
        '<circle r="44" fill="transparent"/>' +
        '<circle class="halo" r="26" fill="url(#halo)"/>' +
        '<path d="M0,-1 L.18,-.18 L1,0 L.18,.18 L0,1 L-.18,.18 L-1,0 L-.18,-.18 Z" transform="scale(11)" fill="#fff4d6"/>' +
        '<text y="34" text-anchor="middle" class="svg-label" fill="#fff4d6">' + G.esc(z.name) + '</text></g>';
    });
    svg.innerHTML = html;
    svg.querySelectorAll('.zone').forEach(function (el) {
      var open = function () { openZone(ZONES[+el.dataset.i]); };
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function openMap() {
    if (ctx) { var fin = ctx.leave(); ctx = null; setTimeout(fin, 400); }
    mode = 'map';
    currentZone = null;
    hideOverlays();
    stage.classList.add('fading');
    setTimeout(function () { stage.innerHTML = ''; }, 420);
    controls.hidden = true;
    actions.hidden = true;
    document.body.classList.remove('finale');
    hintEl.textContent = '';
    caption.textContent = '';
    $('#zonecard').hidden = true;
    $('#progress').hidden = true;
    $('#actlabel').textContent = 'Ton univers';
    document.body.dataset.theme = 'converge';
    audio.pad(audio.PADS.converge);
    dust.color([255, 206, 115]);
    dust.set('drift', { alpha: 0.3, fraction: 0.5 });
    if (!$('#mapsvg').childElementCount) buildMap();
    $('#map').hidden = false;
    cur = -1;
  }

  function openZone(z) {
    $('#map').hidden = true;
    mode = 'zone';
    currentZone = z;
    var card = $('#zonecard');
    card.querySelector('h2').textContent = z.name;
    var ul = card.querySelector('ul');
    ul.innerHTML = '';
    z.info().filter(Boolean).forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    card.classList.remove('collapsed');
    goTo(sceneIndex(z.scene));
  }
  $('#zonecard-toggle').addEventListener('click', function () { $('#zonecard').classList.toggle('collapsed'); });
  $('#map-replay').addEventListener('click', function () { startStory(1); });

  /* ---------------- reprise ---------------- */
  function showResume() {
    document.body.dataset.theme = 'sas';
    dust.set('drift', { alpha: 0.3, fraction: 0.5 });
    var box = $('#resume-actions');
    box.innerHTML = '';
    var withSound = function (fn) { return function () { if (state.sound) setSound(true); fn(); }; };
    if (state.finished) {
      box.appendChild(button('Explorer mon univers', 'primary', withSound(openMap)));
      box.appendChild(button('Revoir l’histoire', '', withSound(function () { startStory(1); })));
    } else if (state.idx > 1 && state.idx < scenes.length) {
      box.appendChild(button('Reprendre — ' + ACTS[scenes[state.idx].act].name, 'primary', withSound(function () { startStory(state.idx); })));
      box.appendChild(button('Recommencer l’histoire', '', withSound(function () { startStory(1); })));
    } else {
      box.appendChild(button('Commencer', 'primary', withSound(function () { startStory(1); })));
    }
    showOverlay('#resume');
  }

  /* ---------------- réglages ---------------- */
  function setSound(on) {
    if (on) on = audio.enable(); else audio.disable();
    state.sound = !!on;
    save();
    var b = $('#soundbtn');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Couper le son' : 'Activer le son');
    b.classList.toggle('on', !!on);
    $('#opt-sound').checked = !!on;
  }
  function setReduced(on) {
    state.reduced = !!on;
    save();
    document.body.classList.toggle('reduced', state.reduced);
    dust.setReduced(state.reduced);
    $('#opt-reduced').checked = state.reduced;
  }

  $('#soundbtn').addEventListener('click', function () { setSound(!state.sound || !audio.on); });
  $('#menubtn').addEventListener('click', function () {
    var m = $('#menu');
    $('#menu-map').hidden = !state.finished;
    $('#menu-restart').hidden = !state.unlocked;
    m.hidden = !m.hidden;
    if (!m.hidden) $('#menu-close').focus();
  });
  $('#menu-close').addEventListener('click', function () { $('#menu').hidden = true; });
  $('#opt-sound').addEventListener('change', function (e) { setSound(e.target.checked); });
  $('#opt-reduced').addEventListener('change', function (e) { setReduced(e.target.checked); });
  $('#menu-restart').addEventListener('click', function () { $('#menu').hidden = true; startStory(1); });
  $('#menu-map').addEventListener('click', function () { $('#menu').hidden = true; openMap(); });

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'Escape') { $('#menu').hidden = true; return; }
    if (!$('#menu').hidden || mode === 'map') return;
    if (e.key === 'ArrowRight' && !controls.hidden && !nextBtn.hidden) next();
    if (e.key === 'ArrowLeft' && !controls.hidden) prev();
  });

  function showOverlay(sel) { hideOverlays(); $(sel).hidden = false; var f = $(sel).querySelector('button'); if (f) f.focus({ preventScroll: true }); }
  function hideOverlays() { ['#resume', '#soundask'].forEach(function (s) { $(s).hidden = true; }); }

  /* ---------------- démarrage ---------------- */
  dust.init($('#dust'));
  setReduced(state.reduced);
  setSound(false);
  state.sound = (function () { try { return !!JSON.parse(localStorage.getItem(KEY) || '{}').sound; } catch (e) { return false; } })();

  if (!state.unlocked || cfg.askCodeOnReturn) {
    mode = 'story';
    goTo(0);
  } else {
    showResume();
  }

  // outil de relecture : ?scene=III.4 ouvre directement une scène (une fois le sas franchi)
  var q = new URLSearchParams(location.search).get('scene');
  if (q && state.unlocked && sceneIndex(q) > 0) { hideOverlays(); mode = 'story'; goTo(sceneIndex(q)); }
})();
