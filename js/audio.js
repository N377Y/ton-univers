/*
 * Ambiance sonore générée en direct (Web Audio) : aucune musique sous licence,
 * aucun fichier à charger. Coupée par défaut ; activée uniquement par l'utilisateur.
 */
(function () {
  'use strict';

  var ac = null, master = null, padBus = null;
  var padVoices = [];
  var currentPad = null;
  var noiseBuf = null;

  var A = { on: false };

  function ctx() {
    if (!ac) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ac = new C();
      master = ac.createGain();
      master.gain.value = 0;
      master.connect(ac.destination);
      padBus = ac.createGain();
      padBus.gain.value = 0.9;
      var lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      padBus.connect(lp);
      lp.connect(master);
    }
    return ac;
  }

  function startPad(freqs) {
    var c = ctx();
    if (!c) return;
    var now = c.currentTime;
    padVoices.forEach(function (v) {
      v.g.gain.cancelScheduledValues(now);
      v.g.gain.setTargetAtTime(0, now, 0.8);
      v.o.stop(now + 4);
    });
    padVoices = [];
    (freqs || []).forEach(function (f, i) {
      [0, 1].forEach(function (k) {
        var o = c.createOscillator();
        o.type = k ? 'triangle' : 'sine';
        o.frequency.value = f * (k ? 1.003 : 1);
        var gn = c.createGain();
        gn.gain.value = 0;
        gn.gain.setTargetAtTime(0.045 / (1 + i * 0.4) / (k ? 2.2 : 1), now + 0.1, 1.4);
        o.connect(gn); gn.connect(padBus);
        o.start(now);
        padVoices.push({ o: o, g: gn });
      });
    });
  }

  A.enable = function () {
    var c = ctx();
    if (!c) return false;
    if (c.state === 'suspended') c.resume();
    A.on = true;
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setTargetAtTime(0.7, c.currentTime, 0.4);
    if (currentPad) startPad(currentPad);
    return true;
  };

  A.disable = function () {
    A.on = false;
    if (!ac) return;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(0, ac.currentTime, 0.2);
    var voices = padVoices;
    padVoices = [];
    setTimeout(function () { voices.forEach(function (v) { try { v.o.stop(); } catch (e) {} }); }, 1500);
  };

  A.pad = function (freqs) {
    var same = currentPad && freqs && currentPad.join() === freqs.join();
    currentPad = freqs;
    if (A.on && !same) startPad(freqs);
  };

  function tone(f, opts) {
    if (!A.on || !ctx()) return;
    opts = opts || {};
    var now = ac.currentTime + (opts.delay || 0);
    var o = ac.createOscillator();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(f, now);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(f * opts.slide, now + (opts.dur || 1));
    var gn = ac.createGain();
    gn.gain.setValueAtTime(0, now);
    gn.gain.linearRampToValueAtTime(opts.vol || 0.12, now + (opts.attack || 0.01));
    gn.gain.exponentialRampToValueAtTime(0.0001, now + (opts.dur || 1.2));
    o.connect(gn); gn.connect(master);
    o.start(now);
    o.stop(now + (opts.dur || 1.2) + 0.05);
  }

  A.chime = function (f) {
    f = f || 880;
    tone(f, { vol: 0.09, dur: 1.8 });
    tone(f * 2.01, { vol: 0.03, dur: 1.2 });
  };
  A.blip = function (f) { tone(f || 660, { type: 'triangle', vol: 0.06, dur: 0.35 }); };
  A.piano = function (f, delay) {
    tone(f, { type: 'triangle', vol: 0.11, dur: 2.6, delay: delay });
    tone(f * 2, { vol: 0.025, dur: 1.6, delay: delay });
  };
  A.low = function () { tone(55, { vol: 0.12, dur: 3, attack: 0.6 }); };

  A.wind = function (dur) {
    if (!A.on || !ctx()) return;
    dur = dur || 4;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var src = ac.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7;
    var gn = ac.createGain();
    var now = ac.currentTime;
    gn.gain.setValueAtTime(0, now);
    gn.gain.linearRampToValueAtTime(0.05, now + dur * 0.4);
    gn.gain.linearRampToValueAtTime(0, now + dur);
    bp.frequency.linearRampToValueAtTime(900, now + dur);
    src.connect(bp); bp.connect(gn); gn.connect(master);
    src.start(now); src.stop(now + dur + 0.1);
  };

  // nappes par acte
  A.PADS = {
    sas: [110, 164.8],
    heritage: [110, 164.8, 220],
    balance: [130.8, 196, 261.6, 329.6],
    ink: [146.8, 220, 293.7],
    moon: [98, 146.8],
    code: [123.5, 185, 246.9, 370],
    converge: [110, 164.8, 220, 277.2],
  };

  window.AU = window.AU || {};
  window.AU.audio = A;
})();
