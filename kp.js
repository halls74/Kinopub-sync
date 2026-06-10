(function () {
  'use strict';
  var LOG = '[KinoPUB Sync 0.1.2 loader]';
  var ORIGINAL = 'https://mainsync-afk.github.io/lampa_kinopub/kp.js';
  function baseUrl() {
    try {
      var scripts = document.getElementsByTagName('script');
      var src = scripts[scripts.length - 1].src || '';
      return src.split('?')[0].replace(/\/kp\.js$/, '/');
    } catch (e) { return './'; }
  }
  function load(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = function () { try { console.log(LOG, 'loaded', src); } catch (e) {} if (cb) cb(); };
    s.onerror = function () { try { console.error(LOG, 'failed', src); } catch (e) {} if (cb) cb(); };
    document.head.appendChild(s);
  }
  var base = baseUrl();
  try { console.log(LOG, 'starting'); } catch (e) {}
  load(ORIGINAL, function () { load(base + 'kp-sync.js'); });
})();
