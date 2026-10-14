/* SHA-256 minimal (fonctionne aussi hors HTTPS, là où crypto.subtle est absent). */
(function (global) {
  'use strict';

  function sha256(str) {
    var bytes = Array.from(new TextEncoder().encode(str));
    var K = [], H = [], primes = [], n = 2;
    while (primes.length < 64) {
      var isPrime = true;
      for (var j = 0; j < primes.length && primes[j] * primes[j] <= n; j++) {
        if (n % primes[j] === 0) { isPrime = false; break; }
      }
      if (isPrime) primes.push(n);
      n++;
    }
    var frac = function (x) { return ((x - Math.floor(x)) * 4294967296) >>> 0; };
    for (var i = 0; i < 64; i++) {
      if (i < 8) H.push(frac(Math.pow(primes[i], 1 / 2)));
      K.push(frac(Math.cbrt(primes[i])));
    }

    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
    [hi, lo].forEach(function (w) {
      bytes.push((w >>> 24) & 255, (w >>> 16) & 255, (w >>> 8) & 255, w & 255);
    });

    var rotr = function (x, r) { return (x >>> r) | (x << (32 - r)); };
    for (var off = 0; off < bytes.length; off += 64) {
      var w = new Array(64);
      for (var t = 0; t < 16; t++) {
        var b = off + t * 4;
        w[t] = ((bytes[b] << 24) | (bytes[b + 1] << 16) | (bytes[b + 2] << 8) | bytes[b + 3]) >>> 0;
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & bb) ^ (a & c) ^ (bb & c);
        var t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + bb) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H.map(function (x) { return ('00000000' + x.toString(16)).slice(-8); }).join('');
  }

  /* Normalise le code saisi : majuscules, sans accents, sans espaces ni ponctuation. */
  function normalizeCode(code) {
    return String(code || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function hashCode(code) {
    return sha256('aodtu:' + normalizeCode(code));
  }

  global.AU = global.AU || {};
  global.AU.sha256 = sha256;
  global.AU.normalizeCode = normalizeCode;
  global.AU.hashCode = hashCode;
})(typeof window !== 'undefined' ? window : globalThis);
