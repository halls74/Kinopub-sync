/*
 * KinoPUB Sync loader for Lampa.
 * This entry point first loads the original lampa_kinopub plugin, then loads KinoPUB Sync.
 * If original lampa_kinopub is already installed, install docs/kp-sync.js directly instead.
 */
(function () {
  if (window.kp_sync_combo_loader_v0511) return;
  window.kp_sync_combo_loader_v0511 = true;

  var ORIGINAL_KINOPUB = 'https://mainsync-afk.github.io/lampa_kinopub/kp.js';

  function currentBase() {
    var script = document.currentScript;
    if (!script) {
      var list = document.getElementsByTagName('script');
      script = list[list.length - 1];
    }
    var src = script && script.src || '';
    return src.split('/').slice(0, -1).join('/') + '/';
  }

  function loadScript(src, done) {
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = function () { if (done) done(); };
    s.onerror = function () { if (done) done(); };
    document.head.appendChild(s);
  }

  var base = currentBase();
  loadScript(ORIGINAL_KINOPUB, function () {
    loadScript(base + 'kp-sync.js?v=0.5.11');
  });
})();
