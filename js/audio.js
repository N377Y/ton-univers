/*
 * Musique et effets sonores, entièrement synthétisés en direct (Web Audio) :
 * aucune musique sous licence, aucun fichier à charger.
 * Un petit séquenceur joue une piste par acte :
 *   mystere (sas) · aventure (Afrique) · reflexion (philosophie) · opening (manga)
 *   lune (la rencontre) · scifi (informatique) · finale (convergence)
 * Coupé par défaut ; activé uniquement par l'utilisateur.
 */
(function () {
  'use strict';

  var ac = null, master, musicBus, sfxBus, revIn, delIn, noiseBuf, distCurve;
  var cur = null, timer = null, wanted = null, duckLevel = 1;
  var A = { on: false };

  /* ---------- notes ---------- */
  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function N(s) {
    var m = /^([A-G])(#|b)?(-?\d)$/.exec(s);
    var midi = 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function NS(list) { return list.map(N); }

  /* ---------- graphe audio ---------- */
  function init() {
    if (ac) return ac;
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ac = new C();
    var comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.01; comp.release.value = 0.25;
    master = ac.createGain(); master.gain.value = 0;
    master.connect(comp); comp.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 1; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);

    // réverbération (réponse impulsionnelle générée)
    var conv = ac.createConvolver();
    var len = Math.floor(ac.sampleRate * 2.6), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    conv.buffer = ir;
    revIn = ac.createGain(); revIn.connect(conv);
    var revOut = ac.createGain(); revOut.gain.value = 0.5; conv.connect(revOut); revOut.connect(master);
    sfxBus.connect(revIn);

    // écho
    var dl = ac.createDelay(1.5); dl.delayTime.value = 0.33;
    var fb = ac.createGain(); fb.gain.value = 0.32;
    var dlf = ac.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 2400;
    delIn = ac.createGain();
    delIn.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl);
    var dlOut = ac.createGain(); dlOut.gain.value = 0.3; dlf.connect(dlOut); dlOut.connect(master); dlOut.connect(revIn);

    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;

    distCurve = new Float32Array(1024);
    for (var j = 0; j < 1024; j++) { var x = j / 512 - 1; distCurve[j] = Math.tanh(x * 4.5); }
    return ac;
  }

  /* ---------- briques ---------- */
  function osc(type, f, t) { var o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; }
  function noise(t) { var s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.loopStart = Math.random() * 0.5; return s; }
  function filt(type, f, q) { var b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; }
  // enveloppe : attaque, maintien, chute exponentielle
  function env(t, a, peak, hold, dec) {
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    if (hold) g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + dec);
    return g;
  }
  function play(src, t, end) { src.start(t); src.stop(end + 0.05); }
  function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); }

  var I = {};
  I.kick = function (t, v, out) {
    var o = osc('sine', 150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    var g = env(t, 0.002, v, 0, 0.34); chain(o, g, out); play(o, t, t + 0.4);
  };
  I.snare = function (t, v, out) {
    var n = noise(t), hp = filt('highpass', 900), g = env(t, 0.001, v, 0, 0.17); chain(n, hp, g, out); play(n, t, t + 0.2);
    var o = osc('triangle', 190, t), g2 = env(t, 0.001, v * 0.7, 0, 0.08); chain(o, g2, out); play(o, t, t + 0.1);
  };
  I.hat = function (t, v, out, open) {
    var n = noise(t), hp = filt('highpass', 7200), g = env(t, 0.001, v, 0, open ? 0.25 : 0.045); chain(n, hp, g, out); play(n, t, t + 0.3);
  };
  I.clap = function (t, v, out) {
    var n = noise(t), bp = filt('bandpass', 1300, 0.8), g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    [0, 0.011, 0.022].forEach(function (d) { g.gain.setValueAtTime(v, t + d); g.gain.exponentialRampToValueAtTime(v * 0.2, t + d + 0.009); });
    g.gain.setValueAtTime(v, t + 0.032); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    chain(n, bp, g, out); play(n, t, t + 0.25);
  };
  I.crash = function (t, v, out) {
    var n = noise(t), hp = filt('highpass', 3500), g = env(t, 0.002, v, 0, 1.8); chain(n, hp, g, out); play(n, t, t + 1.9);
  };
  I.tom = function (t, f, v, out) {
    var o = osc('sine', f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.3);
    var g = env(t, 0.002, v, 0, 0.32); chain(o, g, out); play(o, t, t + 0.35);
  };
  I.shaker = function (t, v, out) {
    var n = noise(t), hp = filt('highpass', 6000), g = env(t, 0.012, v, 0, 0.05); chain(n, hp, g, out); play(n, t, t + 0.08);
  };
  I.djembe = function (t, type, v, out) {
    var o, g;
    if (type === 'bass') {
      o = osc('sine', 96, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.18);
      g = env(t, 0.002, v, 0, 0.3); chain(o, g, out); play(o, t, t + 0.35);
    } else if (type === 'tone') {
      o = osc('sine', 270, t); o.frequency.exponentialRampToValueAtTime(205, t + 0.1);
      g = env(t, 0.001, v * 0.8, 0, 0.17); chain(o, g, out); play(o, t, t + 0.2);
      var n0 = noise(t), lp = filt('lowpass', 1800), g0 = env(t, 0.001, v * 0.25, 0, 0.03); chain(n0, lp, g0, out); play(n0, t, t + 0.05);
    } else {
      var n = noise(t), bp = filt('bandpass', 2300, 1.3), g1 = env(t, 0.001, v * 0.9, 0, 0.07); chain(n, bp, g1, out); play(n, t, t + 0.1);
      o = osc('sine', 430, t); g = env(t, 0.001, v * 0.4, 0, 0.04); chain(o, g, out); play(o, t, t + 0.06);
    }
  };
  I.kalimba = function (t, f, v, out, send) {
    var o = osc('sine', f, t), g = env(t, 0.002, v, 0, 1.1); chain(o, g, out); play(o, t, t + 1.15);
    var o2 = osc('sine', f * 5.4, t), g2 = env(t, 0.001, v * 0.3, 0, 0.07); chain(o2, g2, out); play(o2, t, t + 0.1);
    var o3 = osc('triangle', f * 2, t), g3 = env(t, 0.002, v * 0.18, 0, 0.35); chain(o3, g3, out); play(o3, t, t + 0.4);
    if (send) g.connect(send);
  };
  I.piano = function (t, f, v, out, dec) {
    dec = dec || 2.4;
    var lp = filt('lowpass', 2800); lp.connect(out);
    var o = osc('triangle', f, t), g = env(t, 0.004, v, 0, dec); chain(o, g, lp); play(o, t, t + dec);
    var o2 = osc('sine', f * 2, t), g2 = env(t, 0.003, v * 0.35, 0, dec * 0.5); chain(o2, g2, lp); play(o2, t, t + dec);
    var o3 = osc('sine', f * 3, t), g3 = env(t, 0.002, v * 0.1, 0, 0.5); chain(o3, g3, lp); play(o3, t, t + 0.6);
  };
  I.bell = function (t, f, v, out) {
    var o = osc('sine', f, t), g = env(t, 0.002, v, 0, 2.4); chain(o, g, out); play(o, t, t + 2.5);
    var o2 = osc('sine', f * 2.76, t), g2 = env(t, 0.002, v * 0.4, 0, 0.8); chain(o2, g2, out); play(o2, t, t + 0.9);
    var o3 = osc('sine', f * 5.4, t), g3 = env(t, 0.001, v * 0.15, 0, 0.25); chain(o3, g3, out); play(o3, t, t + 0.3);
  };
  I.pad = function (t, fs, dur, v, out, type, cut, vib) {
    var lp = filt('lowpass', cut || 900, 0.4), g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + Math.min(0.9, dur * 0.4));
    g.gain.setValueAtTime(v, t + dur);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.9);
    chain(lp, g, out);
    var lfo = null;
    if (vib) { lfo = osc('sine', 5, t); var lg = ac.createGain(); lg.gain.value = vib; lfo.connect(lg); lfo._g = lg; play(lfo, t, t + dur + 1); }
    fs.forEach(function (f) {
      [-7, 7].forEach(function (det) {
        var o = osc(type || 'sawtooth', f, t); o.detune.value = det;
        if (lfo) lfo._g.connect(o.detune);
        var og = ac.createGain(); og.gain.value = 1 / fs.length;
        chain(o, og, lp); play(o, t, t + dur + 1);
      });
    });
  };
  I.brass = function (t, f, dur, v, out) {
    var lp = filt('lowpass', 350, 1.5);
    lp.frequency.setValueAtTime(350, t);
    lp.frequency.linearRampToValueAtTime(2000, t + 0.12);
    lp.frequency.linearRampToValueAtTime(1200, t + 0.4);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.09);
    g.gain.setValueAtTime(v * 0.85, t + dur);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
    chain(lp, g, out);
    var lfo = osc('sine', 5.2, t), lg = ac.createGain(); lg.gain.value = 9; lfo.connect(lg); play(lfo, t, t + dur + 0.3);
    [1, 1.004, 0.5].forEach(function (m, i) {
      var o = osc(i === 2 ? 'square' : 'sawtooth', f * m, t); lg.connect(o.detune);
      var og = ac.createGain(); og.gain.value = i === 2 ? 0.25 : 0.5; chain(o, og, lp); play(o, t, t + dur + 0.3);
    });
  };
  I.bass = function (t, f, dur, v, out) {
    var lp = filt('lowpass', 1500, 2); lp.frequency.setValueAtTime(1500, t); lp.frequency.exponentialRampToValueAtTime(420, t + 0.15);
    var g = env(t, 0.004, v, dur * 0.7, 0.09); chain(lp, g, out);
    var o = osc('sawtooth', f, t), o2 = osc('square', f / 2, t), g2 = ac.createGain(); g2.gain.value = 0.5;
    o.connect(lp); chain(o2, g2, lp); play(o, t, t + dur + 0.1); play(o2, t, t + dur + 0.1);
  };
  I.guitar = function (t, root, dur, v, out) {
    var ws = ac.createWaveShaper(); ws.curve = distCurve;
    var pre = ac.createGain(); pre.gain.value = 0.9;
    var lp = filt('lowpass', 3000, 0.7), g = env(t, 0.004, v, dur, 0.08);
    chain(pre, ws, lp, g, out);
    [1, 1.4983, 2].forEach(function (m) {
      [-9, 9].forEach(function (det) { var o = osc('sawtooth', root * m, t); o.detune.value = det; o.connect(pre); play(o, t, t + dur + 0.12); });
    });
  };
  I.lead = function (t, f, dur, v, out, send) {
    var lp = filt('lowpass', 2600), g = env(t, 0.012, v, dur * 0.85, 0.12);
    chain(lp, g, out); if (send) g.connect(send);
    var o = osc('square', f, t), o2 = osc('sawtooth', f * 1.003, t), m = ac.createGain(); m.gain.value = 0.5;
    var lfo = osc('sine', 5.6, t), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(12, t + Math.min(dur, 0.3));
    lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune);
    o.connect(lp); chain(o2, m, lp);
    play(o, t, t + dur + 0.15); play(o2, t, t + dur + 0.15); play(lfo, t, t + dur + 0.15);
  };
  I.arp = function (t, f, v, out, cut, send) {
    var lp = filt('lowpass', cut, 7); lp.frequency.setValueAtTime(cut, t); lp.frequency.exponentialRampToValueAtTime(320, t + 0.16);
    var g = env(t, 0.003, v, 0, 0.2); chain(lp, g, out); if (send) g.connect(send);
    var o = osc('sawtooth', f, t); o.connect(lp); play(o, t, t + 0.25);
  };
  I.sub = function (t, f, dur, v, out) {
    var o = osc('sine', f, t), g = env(t, 0.01, v, dur, 0.1); chain(o, g, out); play(o, t, t + dur + 0.12);
  };

  /* ---------- pistes ---------- */
  function bars(o) { return o; }
  var T = {};

  T.mystere = {
    bpm: 66, bars: 4, rev: 0.7, gain: 1.4,
    chords: [NS(['A2', 'E3', 'B3', 'C4']), NS(['F2', 'C3', 'G3', 'A3']), NS(['A2', 'E3', 'B3', 'C4']), NS(['G2', 'D3', 'A3', 'B3'])],
    step: function (s, b, t, P) {
      var bar = P.bar;
      if (s === 0) { I.pad(t, this.chords[b], bar, 0.07, P.out, 'sawtooth', 650, 4); I.sub(t, this.chords[b][0] / 2, bar, 0.1, P.out); }
      if (s === 0 && b % 2 === 0) I.bell(t, N('E6'), 0.035, P.out);
      if (s === 10 && b % 2 === 1) I.bell(t, N('B5'), 0.03, P.out);
    },
  };

  T.aventure = bars({
    bpm: 98, bars: 8, swing: 0.1, rev: 0.35, gain: 1.3,
    roots: NS(['A1', 'A1', 'F1', 'G1', 'A1', 'A1', 'C2', 'G1']),
    pads: [NS(['A3', 'C4', 'E4']), NS(['A3', 'C4', 'E4']), NS(['F3', 'A3', 'C4']), NS(['G3', 'B3', 'D4']), NS(['A3', 'C4', 'E4']), NS(['A3', 'C4', 'E4']), NS(['G3', 'C4', 'E4']), NS(['G3', 'B3', 'D4'])],
    kal: {
      A: NS(['A4', 'C5', 'E5', 'G5', 'A5', 'C6']), F: NS(['F4', 'A4', 'C5', 'E5', 'F5', 'A5']),
      G: NS(['G4', 'B4', 'D5', 'G5', 'B5', 'D6']), C: NS(['C5', 'E5', 'G5', 'C6', 'E6', 'G5']),
    },
    kalSeq: 'AAFGAACG',
    pat: [0, 2, 1, 3, 2, 4, 3, 1, 0, 2, 1, 3, 4, 5, 3, 2],
    drum: { 0: 'bass', 3: 'tone', 4: 'slap', 6: 'tone', 7: 'tone', 8: 'bass', 10: 'slap', 11: 'tone', 12: 'slap', 14: 'tone', 15: 'slap' },
    horn: [
      [['A4', 0, 8], ['C5', 8, 4], ['E5', 12, 4]], [['D5', 0, 12], ['C5', 12, 4]], [['C5', 0, 8], ['A4', 8, 8]], [['B4', 0, 16]],
      [['A4', 0, 8], ['C5', 8, 4], ['E5', 12, 4]], [['G5', 0, 12], ['E5', 12, 4]], [['E5', 0, 8], ['D5', 8, 4], ['C5', 12, 4]], [['A4', 0, 16]],
    ],
    step: function (s, b, t, P) {
      var st = P.st;
      if (s === 0) { I.pad(t, this.pads[b], P.bar, 0.05, P.out, 'sawtooth', 1100, 6); }
      if (s === 0 || s === 10) I.bass(t, this.roots[b] * 2, st * (s ? 4 : 6), 0.13, P.out);
      var d = this.drum[s];
      if (d) I.djembe(t, d, d === 'bass' ? 0.42 : 0.24 + Math.random() * 0.06, P.out);
      I.shaker(t, s % 4 === 2 ? 0.05 : 0.025, P.out);
      if (b % 4 === 3 && (s === 12 || s === 14)) I.tom(t, s === 12 ? 160 : 120, 0.25, P.out);
      var kn = this.kal[this.kalSeq[b]];
      if (s % 2 === 0 || P.cycle > 0) I.kalimba(t, kn[this.pat[s]], s % 4 === 0 ? 0.11 : 0.07, P.out, P.del);
      if (P.cycle > 0) this.horn[b].forEach(function (h) { if (h[1] === s) I.brass(t, N(h[0]), h[2] * st, 0.075, P.out); });
    },
  });

  T.reflexion = {
    bpm: 72, bars: 4, rev: 0.6, gain: 2,
    pads: [NS(['C3', 'G3', 'B3', 'E4']), NS(['A2', 'E3', 'G3', 'C4']), NS(['F2', 'C3', 'E3', 'A3']), NS(['G2', 'D3', 'G3', 'B3'])],
    arps: [
      NS(['C3', 'G3', 'D4', 'E4', 'B4', 'E4', 'D4', 'G3']), NS(['A2', 'E3', 'B3', 'C4', 'G4', 'C4', 'B3', 'E3']),
      NS(['F2', 'C3', 'G3', 'A3', 'E4', 'A3', 'G3', 'C3']), NS(['G2', 'D3', 'A3', 'B3', 'D4', 'B3', 'A3', 'D3']),
    ],
    mel: [[['E5', 0], ['D5', 8]], [['C5', 0], ['E5', 12]], [['A4', 0], ['C5', 8]], [['B4', 0], ['D5', 12]]],
    step: function (s, b, t, P) {
      if (s === 0) I.pad(t, this.pads[b], P.bar, 0.045, P.out, 'sawtooth', 700, 5);
      if (s % 2 === 0) I.piano(t, this.arps[b][s / 2], s === 0 ? 0.11 : 0.07, P.out, 2.6);
      if (P.cycle > 0) this.mel[b].forEach(function (m) { if (m[1] === s) I.piano(t, N(m[0]), 0.09, P.out, 3.2); });
      if (P.cycle > 1 && s === 0) I.sub(t, this.pads[b][0] / 2, P.bar * 0.9, 0.08, P.out);
    },
  };

  T.opening = {
    bpm: 168, bars: 8, rev: 0.22,
    roots: NS(['F2', 'G2', 'E2', 'A2', 'F2', 'G2', 'C3', 'C3']),
    pads: [NS(['A4', 'C5', 'E5']), NS(['B4', 'D5', 'F5']), NS(['G4', 'B4', 'D5']), NS(['A4', 'C5', 'E5']), NS(['A4', 'C5', 'F5']), NS(['B4', 'D5', 'G5']), NS(['C5', 'E5', 'G5']), NS(['C5', 'E5', 'G5'])],
    lead: [
      [['E5', 0, 2], ['F5', 2, 2], ['G5', 4, 4], ['A5', 8, 4], ['G5', 12, 4]],
      [['F5', 0, 2], ['E5', 2, 2], ['D5', 4, 4], ['G5', 8, 8]],
      [['E5', 0, 2], ['G5', 2, 2], ['B5', 4, 4], ['A5', 8, 2], ['G5', 10, 2], ['E5', 12, 4]],
      [['C6', 0, 6], ['B5', 6, 2], ['A5', 8, 8]],
      [['A5', 0, 2], ['G5', 2, 2], ['F5', 4, 4], ['A5', 8, 4], ['C6', 12, 4]],
      [['B5', 0, 4], ['A5', 4, 2], ['G5', 6, 2], ['D5', 8, 8]],
      [['E5', 0, 4], ['G5', 4, 4], ['C6', 8, 8]],
      [],
    ],
    gtr: [0, 3, 6, 8, 11, 14],
    step: function (s, b, t, P) {
      var st = P.st, r = this.roots[b];
      // batterie
      if (s === 0 || s === 8 || (b % 2 === 1 && s === 10)) I.kick(t, 0.6, P.out);
      if (s === 4 || s === 12) I.snare(t, 0.32, P.out);
      if (s % 2 === 0) I.hat(t, s === 14 ? 0.07 : 0.045, P.out, s === 14);
      if (s === 0 && b % 4 === 0) I.crash(t, 0.12, P.out);
      if (b === 7 && s >= 8) I.snare(t, 0.12 + (s - 8) * 0.03, P.out);
      // basse
      if (s % 2 === 0) I.bass(t, s % 4 === 2 ? r * 2 : r, st * 1.6, 0.14, P.out);
      // guitare saturée
      if (b >= 6) { if (s === 0) I.guitar(t, r, st * 15, 0.06, P.out); }
      else if (this.gtr.indexOf(s) >= 0) I.guitar(t, r, st * (s === 0 ? 2.6 : 1.4), 0.055, P.out);
      if (s === 0) I.pad(t, this.pads[b], P.bar, 0.025, P.out, 'square', 1800);
      // mélodie
      this.lead[b].forEach(function (n) { if (n[1] === s) I.lead(t, N(n[0]), n[2] * st, 0.06, P.out, P.del); });
    },
  };

  T.lune = {
    bpm: 60, bars: 4, rev: 0.8, gain: 2.3,
    pads: [NS(['F3', 'A3', 'C4', 'E4']), NS(['G3', 'B3', 'D4']), NS(['E3', 'G3', 'B3', 'D4']), NS(['A3', 'C4', 'E4', 'G4'])],
    bass: NS(['F2', 'G2', 'E2', 'A2']),
    top: NS(['A5', 'B5', 'G5', 'E5']),
    step: function (s, b, t, P) {
      var p = this.pads[b];
      if (s === 0) { I.pad(t, p, P.bar, 0.03, P.out, 'triangle', 1200, 3); I.piano(t, this.bass[b], 0.08, P.out, 3.5); }
      if (s === 4) I.piano(t, p[0], 0.045, P.out, 3);
      if (s === 6) I.piano(t, p[1], 0.04, P.out, 3);
      if (s === 8) I.piano(t, p[2], 0.04, P.out, 3);
      if (s === 12 && b % 2 === 0) I.piano(t, this.top[b], 0.06, P.out, 4);
    },
  };

  T.scifi = {
    bpm: 118, bars: 4, rev: 0.4,
    pads: [NS(['A3', 'C4', 'E4']), NS(['F3', 'A3', 'C4', 'E4']), NS(['D3', 'F3', 'A3']), NS(['E3', 'G#3', 'B3'])],
    roots: NS(['A1', 'F1', 'D2', 'E1']),
    arps: [
      NS(['A3', 'C4', 'E4', 'A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'A4', 'E4', 'C4', 'A3', 'E4', 'A4', 'C5']),
      NS(['F3', 'A3', 'C4', 'E4', 'F4', 'A4', 'C5', 'E5', 'C5', 'A4', 'F4', 'E4', 'C4', 'A3', 'C4', 'E4']),
      NS(['D3', 'F3', 'A3', 'D4', 'F4', 'A4', 'D5', 'A4', 'F4', 'D4', 'A3', 'F3', 'D4', 'F4', 'A4', 'D5']),
      NS(['E3', 'G#3', 'B3', 'E4', 'G#4', 'B4', 'E5', 'B4', 'G#4', 'E4', 'B3', 'G#3', 'E4', 'G#4', 'B4', 'E5']),
    ],
    bell: [['E6', 0], ['C6', 0], ['D6', 0], ['B5', 8]],
    step: function (s, b, t, P) {
      var phase = (P.i % 64) / 64;
      var cut = 900 + 2600 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
      I.arp(t, this.arps[b][s], 0.05, P.out, cut, P.del);
      if (s % 2 === 0) I.sub(t, this.roots[b] * 2, P.st * 0.9, 0.16, P.out);
      if (s % 4 === 0) I.kick(t, 0.45, P.out);
      if (s % 4 === 2) I.hat(t, 0.05, P.out, false);
      if (P.cycle > 0 && (s === 4 || s === 12)) I.clap(t, 0.16, P.out);
      if (s === 0) I.pad(t, this.pads[b], P.bar, 0.035, P.out, 'sawtooth', 1300, 5);
      if (P.cycle > 0 && this.bell[b][1] === s) I.bell(t, N(this.bell[b][0]), 0.05, P.out);
    },
  };

  T.finale = {
    bpm: 84, bars: 8, rev: 0.6, gain: 1.2,
    pads: [NS(['C3', 'G3', 'C4', 'E4']), NS(['G2', 'D3', 'G3', 'B3']), NS(['A2', 'E3', 'A3', 'C4']), NS(['F2', 'C3', 'F3', 'A3']),
      NS(['C3', 'G3', 'C4', 'E4']), NS(['G2', 'D3', 'G3', 'B3']), NS(['F2', 'C3', 'F3', 'A3']), NS(['C3', 'G3', 'C4', 'E4'])],
    kal: [NS(['C5', 'E5', 'G5', 'C6']), NS(['B4', 'D5', 'G5', 'B5']), NS(['A4', 'C5', 'E5', 'A5']), NS(['A4', 'C5', 'F5', 'A5']),
      NS(['C5', 'E5', 'G5', 'C6']), NS(['B4', 'D5', 'G5', 'B5']), NS(['A4', 'C5', 'F5', 'A5']), NS(['C5', 'E5', 'G5', 'C6'])],
    mel: [
      [['E5', 0, 4], ['G5', 4, 4], ['C6', 8, 8]], [['B5', 0, 8], ['A5', 8, 4], ['G5', 12, 4]], [['A5', 0, 12], ['E5', 12, 4]], [['F5', 0, 8], ['A5', 8, 8]],
      [['G5', 0, 8], ['E5', 8, 8]], [['D5', 0, 8], ['G5', 8, 8]], [['A5', 0, 8], ['F5', 8, 8]], [['E5', 0, 4], ['D5', 4, 4], ['C5', 8, 8]],
    ],
    pat: [0, 1, 2, 3, 2, 1, 2, 3],
    step: function (s, b, t, P) {
      var st = P.st, p = this.pads[b];
      if (s === 0) { I.pad(t, p, P.bar, 0.05, P.out, 'sawtooth', 1000, 6); I.sub(t, p[0] / 2, P.bar * 0.9, 0.1, P.out); }
      if (s % 2 === 0) I.kalimba(t, this.kal[b][this.pat[s / 2]], 0.06, P.out, P.del);
      if (s % 4 === 2) I.piano(t, p[1 + (s % 3)] * 2, 0.04, P.out, 2);
      if (P.cycle > 0) {
        if (s === 0 || s === 10) I.kick(t, 0.4, P.out);
        if (s === 8) I.snare(t, 0.18, P.out);
        if (s % 4 === 2) I.shaker(t, 0.03, P.out);
        if (s === 0 && b === 0) I.crash(t, 0.08, P.out);
      }
      if (b === 7 && (s === 12 || s === 14)) I.tom(t, s === 12 ? 150 : 110, 0.22, P.out);
      this.mel[b].forEach(function (m) { if (m[1] === s) I.brass(t, N(m[0]), m[2] * st, 0.06, P.out); });
    },
  };

  /* ---------- séquenceur ---------- */
  function startTrack(name) {
    var def = T[name];
    if (!def || !ac) return;
    if (cur && cur.name === name) return;
    stopTrack(1.6);
    var out = ac.createGain();
    out.gain.setValueAtTime(0.0001, ac.currentTime);
    out.gain.linearRampToValueAtTime(def.gain || 1, ac.currentTime + 1.2);
    out.connect(musicBus);
    var rs = ac.createGain(); rs.gain.value = def.rev || 0.4; out.connect(rs); rs.connect(revIn);
    var del = ac.createGain(); del.gain.value = 0.6; del.connect(delIn);
    var st = 60 / def.bpm / 4;
    cur = { name: name, def: def, out: out, del: del, i: 0, next: ac.currentTime + 0.08, st: st, bar: st * 16, cycle: 0 };
    if (!timer) timer = setInterval(tick, 25);
  }
  function stopTrack(fade) {
    if (!cur) return;
    var g = cur.out, now = ac.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0.0001, now + (fade || 0.3));
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, ((fade || 0.3) + 4) * 1000);
    cur = null;
  }
  function tick() {
    if (!cur || !A.on) return;
    var d = cur.def;
    while (cur.next < ac.currentTime + 0.15) {
      var s = cur.i % 16, b = Math.floor(cur.i / 16) % d.bars;
      cur.cycle = Math.floor(cur.i / (16 * d.bars));
      var t = cur.next + (Math.random() - 0.5) * 0.004;
      try { d.step(s, b, t, cur); } catch (e) { console.error(e); }
      var sw = d.swing || 0;
      cur.next += cur.st * (s % 2 === 0 ? 1 + sw : 1 - sw);
      cur.i++;
    }
  }

  /* ---------- API ---------- */
  A.enable = function () {
    if (!init()) return false;
    if (ac.state === 'suspended') ac.resume();
    A.on = true;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(0.85, ac.currentTime, 0.3);
    if (wanted) startTrack(wanted);
    return true;
  };
  A.disable = function () {
    A.on = false;
    if (!ac) return;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(0, ac.currentTime, 0.15);
    stopTrack(0.3);
  };
  A.track = function (name) {
    wanted = name;
    if (A.on) startTrack(name);
  };
  // baisse la musique (suspension), 1 = volume normal
  A.duck = function (level, secs) {
    duckLevel = level;
    if (!ac) return;
    musicBus.gain.cancelScheduledValues(ac.currentTime);
    musicBus.gain.setTargetAtTime(1 * level, ac.currentTime, (secs || 1) / 3);
  };

  function sfx(fn) { return function () { if (!A.on || !init()) return; var args = [].slice.call(arguments); fn.apply(null, args); }; }
  A.chime = sfx(function (f) { var t = ac.currentTime; I.bell(t, f || 880, 0.07, sfxBus); });
  A.blip = sfx(function (f) { var t = ac.currentTime; I.kalimba(t, f || 660, 0.06, sfxBus); });
  A.piano = sfx(function (f, delay) { I.piano(ac.currentTime + (delay || 0), f, 0.12, sfxBus, 3.5); });
  A.low = sfx(function () { var t = ac.currentTime; I.tom(t, 70, 0.35, sfxBus); I.sub(t, 49, 1.2, 0.12, sfxBus); });
  A.hit = sfx(function () { var t = ac.currentTime; I.kick(t, 0.7, sfxBus); I.crash(t, 0.12, sfxBus); });
  A.whoosh = sfx(function (dur) {
    dur = dur || 1.2;
    var t = ac.currentTime, n = noise(t), bp = filt('bandpass', 300, 1.2);
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(3500, t + dur);
    var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    chain(n, bp, g, sfxBus); play(n, t, t + dur);
  });
  A.wind = sfx(function (dur) {
    dur = dur || 4;
    var t = ac.currentTime, n = noise(t), bp = filt('bandpass', 500, 0.7);
    bp.frequency.linearRampToValueAtTime(900, t + dur);
    var g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + dur * 0.4); g.gain.linearRampToValueAtTime(0, t + dur);
    chain(n, bp, g, sfxBus); play(n, t, t + dur);
  });

  // pour les tests : niveau de sortie
  A.meter = function () {
    if (!ac) return null;
    if (!A._an) { A._an = ac.createAnalyser(); A._an.fftSize = 2048; master.connect(A._an); }
    var d = new Float32Array(2048); A._an.getFloatTimeDomainData(d);
    var m = 0, pk = 0; for (var i = 0; i < d.length; i++) { m += d[i] * d[i]; pk = Math.max(pk, Math.abs(d[i])); }
    return { rms: Math.sqrt(m / d.length), peak: pk };
  };

  window.AU = window.AU || {};
  window.AU.audio = A;
})();
