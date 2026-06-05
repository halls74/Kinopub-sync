/*
 * KinoPUB Sync v0.5.11 Lite TV bundle
 * Single-file build for Lampa/WebOS/Tizen: no external modules/*.js requests.
 */
(function () {
  if (window.kp_sync_bootstrap_v0511_lite) return;
  window.kp_sync_bootstrap_v0511_lite = true;

  function currentBase() {
    var script = document.currentScript;
    if (!script) {
      var list = document.getElementsByTagName('script');
      script = list[list.length - 1];
    }
    var src = script && script.src || '';
    return src.split('/').slice(0, -1).join('/') + '/';
  }

  var base = currentBase();

/*
 * KinoPUB Sync Core v0.5.11
 * Базовый модуль: хранение, настройки, авторизация, API, лимиты и ленивый запуск модулей.
 * Тяжёлые модули export/cleanup/deep-bridge НЕ загружаются, пока их настройки выключены.
 */
(function () {
  if (window.KinoPubSyncCore && window.KinoPubSyncCore._v0511_core) return;

  var C = window.KinoPubSyncCore || {};
  window.KinoPubSyncCore = C;
  C._v0511_core = true;
  C.modules = C.modules || {};
  C.moduleFactories = C.moduleFactories || {};
  C.loaded = C.loaded || {};

  var API_HOST = 'https://api.service-kp.com';
  var CLIENT_ID = 'xbmc';
  var CLIENT_SECRET = 'cgg3gtifu46urtfp2zp1nqtba0k2ezxh';
  var CUSTOM_FAV_KEY = 'custom_favorite';

  C.KEY = {
    token: 'kp_token',
    refresh: 'kp_refresh',
    syncBookmarks: 'kp_sync_bookmarks',
    syncHistory: 'kp_sync_history',
    syncTimeline: 'kp_sync_timeline',
    syncCustomFolders: 'kp_sync_custom_folders',
    syncTmdbLookup: 'kp_sync_tmdb_lookup',
    syncAuto: 'kp_sync_auto',
    syncInterval: 'kp_sync_interval',
    historyLimit: 'kp_sync_history_limit',
    apiOpLimit: 'kp_sync_api_op_limit',
    apiDelay: 'kp_sync_api_delay',
    identityEnabled: 'kp_sync_identity_enabled',
    identityStrict: 'kp_sync_identity_strict',
    identityMinConfidence: 'kp_sync_identity_min_confidence',
    identityLimit: 'kp_sync_identity_limit',
    identityMap: 'kp_sync_identity_map',
    episodeMap: 'kp_sync_episode_map',
    timelineMap: 'kp_sync_timeline_map',
    cardMap: 'kp_sync_card_map',
    deepIntegration: 'kp_sync_deep_integration',
    pushEnabled: 'kp_sync_push_enabled',
    pushBookmarks: 'kp_sync_push_bookmarks',
    pushTimeline: 'kp_sync_push_timeline',
    pushResolve: 'kp_sync_push_resolve_unmapped',
    pushFolderTitle: 'kp_sync_push_folder_title',
    pushFolderId: 'kp_sync_push_folder_id',
    pushLimit: 'kp_sync_push_limit',
    bookmarkConflict: 'kp_sync_bookmark_conflict',
    timelineConflict: 'kp_sync_timeline_conflict',
    allowDeletes: 'kp_sync_allow_deletes',
    deleteTwoPhase: 'kp_sync_delete_two_phase',
    deleteLimit: 'kp_sync_delete_limit',
    deleteConfirm: 'kp_sync_delete_confirm',
    allowAutoDeletes: 'kp_sync_allow_auto_deletes',
    fullCleanup: 'kp_sync_full_cleanup',
    bookmarkSnapshot: 'kp_sync_bookmark_snapshot',
    timelineSnapshot: 'kp_sync_timeline_snapshot',
    lastRun: 'kp_sync_last_run',
    lastStatus: 'kp_sync_last_status',
    cacheAutoClean: 'kp_sync_cache_auto_clean',
    cacheMaxKb: 'kp_sync_cache_max_kb',
    cacheMaxAgeDays: 'kp_sync_cache_max_age_days',
    debugLog: 'kp_sync_debug_log',
    debugDeviceInfo: 'kp_sync_debug_device_info',
    privateReport: 'kp_sync_private_report',
    debugLogLimit: 'kp_sync_debug_log_limit',
    serviceLog: 'kp_sync_service_log'
  };

  C.opts = C.opts || { version: '0.5.11', edition: 'lite', lite: true, base: '', modules: {}, buildChecksum: '601b57ccbfa14d67e766010ae150e0ad319a1289f0e934ac3d64627ce084330b', buildChecksumMethod: 'sha256(kp-sync.js with checksum placeholder)' };
  C.running = false;
  C.modulePromises = C.modulePromises || {};


  C.redactSecretsText = function (text) {
    text = String(text === undefined || text === null ? '' : text);
    try {
      text = text.replace(/Bearer\s+[A-Za-z0-9._\-+/=]+/gi, 'Bearer [REDACTED]');
      text = text.replace(/(access_token|refresh_token|id_token|token|kp_token|kp_refresh)(["'\s:=]+)([A-Za-z0-9._\-+/=%]+)/gi, '$1$2[REDACTED]');
      text = text.replace(/([?&](?:email|logged|origin|cache|reset)=)[^&\s"']+/gi, '$1[REDACTED]');
      text = text.replace(/("(?:access_token|refresh_token|id_token|kp_token|kp_refresh)"\s*:\s*")[^"]+(")/gi, '$1[REDACTED]$2');
      text = text.replace(/(api\.service-kp\.com[^\s"']*access_token=)[^&\s"']+/gi, '$1[REDACTED]');
    } catch (e) {}
    return text;
  };

  C.redactForLog = function (value) {
    try {
      if (typeof value === 'string') return C.redactSecretsText(value);
      if (value && typeof value === 'object') return C.redactSecretsText(JSON.stringify(value));
      return C.redactSecretsText(String(value));
    } catch (e) { return '[unserializable]'; }
  };

  C.simpleHash = function (text) {
    text = String(text || '');
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  };

  C.safeUrl = function (url, keepPath) {
    url = String(url || '');
    if (!url) return '';
    try {
      var a = document.createElement('a');
      a.href = url;
      return a.protocol + '//' + a.host + (keepPath ? a.pathname : '');
    } catch (e) {
      return C.redactSecretsText(url.split('?')[0]);
    }
  };

  C.log = function () {
    var args = [];
    try {
      for (var i = 0; i < arguments.length && i < 8; i++) args.push(C.redactForLog(arguments[i]));
      if (window.console && console.log) console.log.apply(console, ['[KinoPUB Sync]'].concat(args));
    } catch (e) {}
    try {
      // Постоянный debug-log по умолчанию выключен, чтобы не расходовать память ТВ.
      if (C.appendServiceLog && C.KEY && C.getBool && C.getBool(C.KEY.debugLog, false)) C.appendServiceLog(args);
    } catch (e2) {}
  };

  C.translate = function (key) {
    try { return Lampa.Lang.translate(key); } catch (e) { return key; }
  };

  C.noty = function (text) {
    try { if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(text); else C.log(text); } catch (e) { C.log(text); }
  };

  C.parseJson = function (value) {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch (e) { return value; }
    }
    return value;
  };

  C.storageGet = function (key, fallback) {
    try {
      if (window.Lampa && Lampa.Storage && Lampa.Storage.get) return Lampa.Storage.get(key, fallback);
    } catch (e) {}
    try {
      var raw = localStorage.getItem(key);
      return raw === null || raw === undefined ? fallback : C.parseJson(raw);
    } catch (e2) { return fallback; }
  };

  C.storageSet = function (key, value) {
    try {
      if (window.Lampa && Lampa.Storage && Lampa.Storage.set) { Lampa.Storage.set(key, value); return; }
    } catch (e) {}
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e2) {}
  };

  C.storageRemove = function (key) {
    try {
      if (window.Lampa && Lampa.Storage) {
        if (Lampa.Storage.remove) { Lampa.Storage.remove(key); return; }
        if (Lampa.Storage.set) { Lampa.Storage.set(key, ''); return; }
      }
    } catch (e) {}
    try { localStorage.removeItem(key); } catch (e2) {}
  };

  C.cacheKeys = function () {
    var K = C.KEY;
    return [K.identityMap, K.episodeMap, K.timelineMap, K.cardMap, K.bookmarkSnapshot, K.timelineSnapshot, K.pushFolderId, K.lastRun];
  };

  C.logKeys = function () { return [C.KEY.serviceLog, C.KEY.lastStatus]; };

  C.storageString = function (key) {
    var value = C.storageGet(key, '');
    try {
      if (typeof value === 'string') return value;
      return JSON.stringify(value) || '';
    } catch (e) { return ''; }
  };

  C.storageBytes = function (keys) {
    var total = 0;
    for (var i = 0; keys && i < keys.length; i++) total += C.storageString(keys[i]).length * 2;
    return total;
  };

  C.storageStats = function () {
    var log = C.storageGet(C.KEY.serviceLog, []);
    if (typeof log === 'string') log = C.parseJson(log) || [];
    if (Object.prototype.toString.call(log) !== '[object Array]') log = [];
    var cacheBytes = C.storageBytes(C.cacheKeys());
    var logBytes = C.storageBytes(C.logKeys());
    return {
      cacheBytes: cacheBytes,
      cacheKb: Math.ceil(cacheBytes / 1024),
      logBytes: logBytes,
      logKb: Math.ceil(logBytes / 1024),
      serviceLogEntries: log.length,
      maxKb: C.getInt(C.KEY.cacheMaxKb, C.opts && C.opts.lite ? 300 : 500)
    };
  };


  C.objectCount = function (obj) {
    var n = 0;
    if (!obj || typeof obj !== 'object') return 0;
    for (var k in obj) if (obj.hasOwnProperty(k)) n++;
    return n;
  };

  C.objectKeys = function (obj) {
    var out = [];
    if (!obj || typeof obj !== 'object') return out;
    for (var k in obj) if (obj.hasOwnProperty(k)) out.push(k);
    return out;
  };

  C.isoDate = function (ts) {
    try { return ts ? new Date(parseInt(ts, 10)).toISOString() : ''; } catch (e) { return ''; }
  };

  C.cacheSummary = function () {
    var K = C.KEY;
    var identity = C.storageGet(K.identityMap, {}) || {};
    var episode = C.storageGet(K.episodeMap, {}) || {};
    var timeline = C.storageGet(K.timelineMap, {}) || {};
    var cardMap = C.storageGet(K.cardMap, {}) || {};
    var bookmarkSnapshot = C.storageGet(K.bookmarkSnapshot, {}) || {};
    var timelineSnapshot = C.storageGet(K.timelineSnapshot, {}) || {};
    var log = C.storageGet(K.serviceLog, []) || [];
    if (typeof log === 'string') log = C.parseJson(log) || [];
    if (Object.prototype.toString.call(log) !== '[object Array]') log = [];
    return {
      identityByItem: C.objectCount(identity.byItem),
      identityByTmdb: C.objectCount(identity.byTmdb),
      identityByImdb: C.objectCount(identity.byImdb),
      identityRecent: identity.recent && identity.recent.length || 0,
      episodeByItem: C.objectCount(episode.byItem),
      episodeByHash: C.objectCount(episode.byHash),
      episodeRecent: episode.recent && episode.recent.length || 0,
      timelineMap: C.objectCount(timeline),
      cardMap: C.objectCount(cardMap),
      bookmarkSnapshotItems: bookmarkSnapshot.items ? C.objectCount(bookmarkSnapshot.items) : 0,
      timelineSnapshotItems: timelineSnapshot.items ? C.objectCount(timelineSnapshot.items) : 0,
      serviceLogEntries: log.length
    };
  };

  C.safeSettingsSnapshot = function () {
    var K = C.KEY;
    var skip = {};
    skip[K.token] = true; skip[K.refresh] = true;
    skip[K.identityMap] = true; skip[K.episodeMap] = true; skip[K.timelineMap] = true; skip[K.cardMap] = true;
    skip[K.bookmarkSnapshot] = true; skip[K.timelineSnapshot] = true; skip[K.serviceLog] = true;
    var out = {};
    for (var name in K) if (K.hasOwnProperty(name)) {
      var key = K[name];
      if (!skip[key]) out[key] = C.storageGet(key, '');
    }
    out.kp_token_present = !!C.storageGet(K.token, '');
    out.kp_refresh_present = !!C.storageGet(K.refresh, '');
    return out;
  };

  C.detectBrowser = function (ua) {
    ua = String(ua || '');
    var m;
    if ((m = ua.match(/Edg\/([0-9.]+)/))) return { name: 'Edge', version: m[1] };
    if ((m = ua.match(/OPR\/([0-9.]+)/))) return { name: 'Opera', version: m[1] };
    if ((m = ua.match(/SamsungBrowser\/([0-9.]+)/))) return { name: 'Samsung Internet', version: m[1] };
    if ((m = ua.match(/YaBrowser\/([0-9.]+)/))) return { name: 'Yandex Browser', version: m[1] };
    if ((m = ua.match(/CriOS\/([0-9.]+)/))) return { name: 'Chrome iOS', version: m[1] };
    if ((m = ua.match(/Chrome\/([0-9.]+)/))) return { name: 'Chrome/Chromium', version: m[1] };
    if ((m = ua.match(/Firefox\/([0-9.]+)/))) return { name: 'Firefox', version: m[1] };
    if ((m = ua.match(/Version\/([0-9.]+).*Safari/))) return { name: 'Safari/WebKit', version: m[1] };
    return { name: 'unknown', version: '' };
  };

  C.detectOS = function (ua) {
    ua = String(ua || '');
    var m;
    if ((m = ua.match(/Web0S|WebOS|webOS/i))) {
      var w = ua.match(/(?:Web0S|WebOS|webOS)[\/ ]?([0-9._-]+)?/i);
      return { name: 'webOS', version: (w && w[1]) || '', family: 'tv' };
    }
    if ((m = ua.match(/Tizen[\/ ]([0-9.]+)/i))) return { name: 'Tizen', version: m[1], family: 'tv' };
    if ((m = ua.match(/Android[\/ ]([0-9.]+)/i))) return { name: 'Android', version: m[1], family: 'android' };
    if ((m = ua.match(/Windows NT ([0-9.]+)/i))) return { name: 'Windows', version: m[1], family: 'desktop' };
    if ((m = ua.match(/Mac OS X ([0-9_]+)/i))) return { name: 'macOS/iOS', version: String(m[1]).replace(/_/g, '.'), family: 'apple' };
    if (/Linux/i.test(ua)) return { name: 'Linux', version: '', family: 'desktop' };
    return { name: 'unknown', version: '', family: '' };
  };

  C.detectDevice = function (ua) {
    ua = String(ua || '');
    var type = 'unknown';
    if (/SMART-TV|SmartTV|NetCast|Web0S|WebOS|webOS|Tizen|TV/i.test(ua)) type = 'tv';
    else if (/Mobile|Android|iPhone|iPad|Tablet/i.test(ua)) type = 'mobile/tablet';
    else if (/Windows|Mac OS X|Linux/i.test(ua)) type = 'desktop';
    var vendor = '';
    if (/LG|Web0S|WebOS|webOS/i.test(ua)) vendor = 'LG';
    else if (/Samsung|Tizen/i.test(ua)) vendor = 'Samsung';
    else if (/Android/i.test(ua)) vendor = 'Android device';
    return { type: type, vendor: vendor };
  };

  C.deviceInfo = function () {
    var nav = typeof navigator !== 'undefined' ? navigator : {};
    var ua = nav.userAgent || '';
    var scr = typeof screen !== 'undefined' ? screen : {};
    var win = typeof window !== 'undefined' ? window : {};
    var d = C.detectDevice(ua);
    var out = {
      collectedAt: C.isoDate(Date.now()),
      userAgent: ua,
      platform: nav.platform || '',
      vendor: nav.vendor || d.vendor || '',
      language: nav.language || nav.userLanguage || '',
      languages: nav.languages ? Array.prototype.slice.call(nav.languages, 0, 5) : [],
      online: typeof nav.onLine === 'boolean' ? nav.onLine : null,
      cookieEnabled: typeof nav.cookieEnabled === 'boolean' ? nav.cookieEnabled : null,
      hardwareConcurrency: nav.hardwareConcurrency || '',
      deviceMemory: nav.deviceMemory || '',
      maxTouchPoints: nav.maxTouchPoints || 0,
      browser: C.detectBrowser(ua),
      os: C.detectOS(ua),
      device: d,
      screen: {
        width: scr.width || '',
        height: scr.height || '',
        availWidth: scr.availWidth || '',
        availHeight: scr.availHeight || '',
        colorDepth: scr.colorDepth || '',
        pixelDepth: scr.pixelDepth || '',
        devicePixelRatio: win.devicePixelRatio || 1
      },
      viewport: {
        innerWidth: win.innerWidth || '',
        innerHeight: win.innerHeight || '',
        outerWidth: win.outerWidth || '',
        outerHeight: win.outerHeight || ''
      },
      timezone: (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })(),
      lampaHints: {
        appready: !!win.appready,
        platform: C.safeLampaValue(['Platform', 'name']) || C.safeLampaValue(['Platform', 'platform']) || '',
        appVersion: C.safeLampaValue(['App', 'version']) || C.safeLampaValue(['Manifest', 'version']) || ''
      },
      globals: {
        webOS: !!win.webOS,
        PalmSystem: !!win.PalmSystem,
        tizen: !!win.tizen,
        Android: !!win.Android,
        chrome: !!win.chrome
      }
    };
    return out;
  };

  C.deviceSummary = function () {
    var info = C.deviceInfo();
    return {
      device: info.device.type + (info.device.vendor ? '/' + info.device.vendor : ''),
      os: info.os.name + (info.os.version ? ' ' + info.os.version : ''),
      browser: info.browser.name + (info.browser.version ? ' ' + info.browser.version : ''),
      screen: String(info.screen.width || '?') + 'x' + String(info.screen.height || '?') + '@' + String(info.screen.devicePixelRatio || 1),
      lang: info.language || '',
      tz: info.timezone || ''
    };
  };

  C.safeLampaValue = function (path) {
    try {
      var obj = window.Lampa;
      for (var i = 0; i < path.length; i++) {
        if (!obj || typeof obj[path[i]] === 'undefined') return '';
        obj = obj[path[i]];
      }
      if (typeof obj === 'function') return '';
      return String(obj);
    } catch (e) { return ''; }
  };

  C.environmentInfo = function (full) {
    var dev = C.deviceInfo();
    var privateMode = C.getBool ? C.getBool(C.KEY.privateReport, true) : true;
    var href = (window.location && window.location.href) || '';
    return {
      location: privateMode && !full ? C.safeUrl(href, true) : C.redactSecretsText(href),
      protocol: (window.location && window.location.protocol) || '',
      userAgent: privateMode && !full ? '[hidden:' + C.simpleHash(dev.userAgent) + ']' : C.redactSecretsText(dev.userAgent),
      device: privateMode && !full ? { browser: dev.browser, os: dev.os, device: dev.device, screen: dev.screen, viewport: dev.viewport, language: dev.language, online: dev.online, cookieEnabled: dev.cookieEnabled, lampaHints: dev.lampaHints, globals: dev.globals } : dev,
      language: dev.language,
      appready: !!window.appready,
      localStorage: !!window.localStorage,
      clipboardApi: !!(typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText),
      execCommand: !!document.execCommand,
      lampa: {
        Storage: !!(window.Lampa && Lampa.Storage),
        SettingsApi: !!(window.Lampa && Lampa.SettingsApi),
        Reguest: !!(window.Lampa && Lampa.Reguest),
        Favorite: !!(window.Lampa && Lampa.Favorite),
        Timeline: !!(window.Lampa && Lampa.Timeline),
        TMDB: !!(window.Lampa && Lampa.TMDB),
        Modal: !!(window.Lampa && Lampa.Modal),
        Noty: !!(window.Lampa && Lampa.Noty),
        Listener: !!(window.Lampa && Lampa.Listener)
      }
    };
  };

  C.collectDiagnostics = function () {
    var log = C.storageGet(C.KEY.serviceLog, []);
    if (typeof log === 'string') log = C.parseJson(log) || [];
    if (Object.prototype.toString.call(log) !== '[object Array]') log = [];
    return {
      generatedAt: C.isoDate(Date.now()),
      plugin: { version: C.opts.version, edition: C.opts.edition, lite: !!C.opts.lite, base: C.safeUrl(C.opts.base, true), buildChecksum: C.opts.buildChecksum || '', buildChecksumMethod: C.opts.buildChecksumMethod || '' },
      privacy: { privateReport: C.getBool(C.KEY.privateReport, true), secretsRedacted: true },
      deviceSummary: C.deviceSummary(),
      environment: C.environmentInfo(false),
      modules: { declared: C.opts.modules || {}, loaded: C.objectKeys(C.modules), loading: C.objectKeys(C.modulePromises) },
      auth: { accessTokenPresent: !!C.tokenAccess(), refreshTokenPresent: !!C.tokenRefresh(), tokensIncluded: false },
      settings: C.safeSettingsSnapshot(),
      storageStats: C.storageStats(),
      cacheSummary: C.cacheSummary(),
      lastStatus: C.storageGet(C.KEY.lastStatus, ''),
      lastRun: C.isoDate(C.storageGet(C.KEY.lastRun, '')),
      serviceLogEnabled: C.getBool(C.KEY.debugLog, false),
      serviceLog: log.slice(0, C.getInt(C.KEY.debugLogLimit, 50))
    };
  };

  C.diagnosticReport = function () {
    var obj = C.collectDiagnostics();
    var text = '';
    try { text = JSON.stringify(obj, null, 2); } catch (e) { text = String(obj); }
    text = C.redactSecretsText(text);
    return 'KinoPUB Sync diagnostic report\n' +
      'Do not post publicly if it may contain private titles/history. Tokens are not included. Secrets are redacted.\n\n' + text;
  };

  C.escapeHtml = function (text) {
    return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  C.showReportFallback = function (text) {
    try {
      if (Lampa.Modal && Lampa.Modal.open) {
        Lampa.Modal.open({
          title: C.translate('kp_sync_report_title'),
          html: '<div style="margin-bottom:12px;opacity:.8">' + C.translate('kp_sync_report_manual') + '</div><textarea style="width:100%;height:360px;box-sizing:border-box;font-size:14px">' + C.escapeHtml(text) + '</textarea>',
          size: 'large'
        });
        return true;
      }
    } catch (e) {}
    try { window.prompt(C.translate('kp_sync_report_manual'), text); return true; } catch (e2) {}
    return false;
  };

  C.copyText = function (text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return false; });
    }
    return new Promise(function (resolve) {
      var ok = false;
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'readonly');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand && document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) { ok = false; }
      resolve(!!ok);
    });
  };

  C.copyDiagnosticReport = function () {
    var report = C.diagnosticReport();
    return C.copyText(report).then(function (ok) {
      if (ok) {
        C.noty(C.translate('kp_sync_report_copied'));
        C.log('diagnostic report copied', { bytes: report.length * 2 });
        return true;
      }
      C.showReportFallback(report);
      C.noty(C.translate('kp_sync_report_manual'));
      C.log('diagnostic report copy fallback', { bytes: report.length * 2 });
      return false;
    }).catch(function () {
      C.showReportFallback(report);
      C.noty(C.translate('kp_sync_report_manual'));
      return false;
    });
  };

  C.healthCheck = function () {
    var required = ['Storage','SettingsApi','Reguest','Favorite','Timeline','TMDB'];
    var env = C.environmentInfo(false);
    var missing = [];
    for (var i = 0; i < required.length; i++) if (!env.lampa[required[i]]) missing.push(required[i]);
    var baseInfo = 'version=' + C.opts.version + ' edition=' + C.opts.edition + ' base=' + C.safeUrl(C.opts.base, true) + ' checksum=' + (C.opts.buildChecksum || '') + ' missingLampaApi=' + (missing.join(',') || 'none');
    C.log('healthcheck start', baseInfo);
    if (!C.tokenAccess()) {
      var nt = C.translate('kp_sync_health_no_token') + '; ' + baseInfo;
      C.setStatus(nt);
      C.noty(C.translate('kp_sync_health_no_token'));
      C.log('healthcheck no token', baseInfo);
      return Promise.resolve({ ok: false, reason: 'no_token', missingLampaApi: missing });
    }
    return C.apiGet('/bookmarks', {}).then(function (json) {
      var count = C.asArray(json).length;
      var ok = missing.length === 0;
      var text = (ok ? C.translate('kp_sync_health_ok') : C.translate('kp_sync_health_failed')) + '; folders=' + count + '; ' + baseInfo;
      C.setStatus(text);
      C.noty(ok ? C.translate('kp_sync_health_ok') : C.translate('kp_sync_health_failed'));
      C.log('healthcheck done', text);
      return { ok: ok, folders: count, missingLampaApi: missing };
    }).catch(function (e) {
      var msg = C.translate('kp_sync_health_failed') + ': ' + (e && (e.status || e.reason || e.message) || 'unknown') + '; ' + baseInfo;
      C.setStatus(msg);
      C.noty(C.translate('kp_sync_health_failed'));
      C.log('healthcheck failed', e);
      return { ok: false, error: e, missingLampaApi: missing };
    });
  };

  C.appendServiceLog = function (args) {
    var limit = C.getInt(C.KEY.debugLogLimit, 50);
    if (limit <= 0) return;
    var arr = C.storageGet(C.KEY.serviceLog, []);
    if (typeof arr === 'string') arr = C.parseJson(arr) || [];
    if (Object.prototype.toString.call(arr) !== '[object Array]') arr = [];
    var parts = [];
    for (var i = 0; args && i < args.length && i < 6; i++) {
      var v = args[i], text = '';
      try { text = typeof v === 'string' ? v : JSON.stringify(v); } catch (e) { text = String(v); }
      text = C.redactSecretsText(text);
      if (text && text.length > 220) text = text.slice(0, 220) + '...';
      parts.push(text);
    }
    arr.unshift({ ts: Date.now(), text: parts.join(' ') });
    if (arr.length > limit) arr = arr.slice(0, limit);
    C.storageSet(C.KEY.serviceLog, arr);
  };

  C.clearServiceLogs = function () {
    C.storageSet(C.KEY.serviceLog, []);
    C.storageSet(C.KEY.lastStatus, '');
    C.noty(C.translate('kp_sync_logs_cleared'));
  };

  C.clearServiceCache = function (silent) {
    var K = C.KEY;
    C.storageSet(K.identityMap, { byItem: {}, byTmdb: {}, byImdb: {}, recent: [] });
    C.storageSet(K.episodeMap, { byHash: {}, byItem: {}, recent: [] });
    C.storageSet(K.timelineMap, {});
    C.storageSet(K.cardMap, {});
    C.storageSet(K.bookmarkSnapshot, { items: {} });
    C.storageSet(K.timelineSnapshot, { items: {} });
    C.storageSet(K.pushFolderId, '');
    C.storageSet(K.lastRun, '');
    if (!silent) C.noty(C.translate('kp_sync_cache_cleared'));
  };

  C.trimObjectMap = function (obj, recent, limit) {
    if (!obj || !recent) return;
    while (recent.length > limit) {
      var k = recent.pop();
      delete obj[k];
    }
  };

  C.trimServiceCache = function (maxEntries, cutoff) {
    var K = C.KEY;
    var m = C.storageGet(K.identityMap, { byItem: {}, byTmdb: {}, byImdb: {}, recent: [] });
    if (m && typeof m === 'object') {
      m.byItem = m.byItem || {}; m.byTmdb = m.byTmdb || {}; m.byImdb = m.byImdb || {}; m.recent = m.recent || [];
      for (var i = m.recent.length - 1; i >= 0; i--) {
        var key = m.recent[i], entry = m.byItem[key];
        if (!entry || (cutoff && entry.ts && entry.ts < cutoff)) {
          if (entry) { if (entry.tmdb_id) delete m.byTmdb[String(entry.media_type || 'movie') + ':' + String(entry.tmdb_id)]; if (entry.imdb_id) delete m.byImdb[String(entry.imdb_id)]; }
          delete m.byItem[key]; m.recent.splice(i, 1);
        }
      }
      C.trimObjectMap(m.byItem, m.recent, maxEntries);
      // Перестраиваем индексы, чтобы после обрезки не оставались ссылки на удалённые item.
      m.byTmdb = {}; m.byImdb = {};
      for (var ii in m.byItem) if (m.byItem.hasOwnProperty(ii)) { var it = m.byItem[ii]; if (it.tmdb_id) m.byTmdb[String(it.media_type || 'movie') + ':' + String(it.tmdb_id)] = ii; if (it.imdb_id) m.byImdb[String(it.imdb_id)] = ii; }
      C.storageSet(K.identityMap, m);
    }

    var ep = C.storageGet(K.episodeMap, { byHash: {}, byItem: {}, recent: [] });
    if (ep && typeof ep === 'object') {
      ep.byHash = ep.byHash || {}; ep.byItem = ep.byItem || {}; ep.recent = ep.recent || [];
      for (var e = ep.recent.length - 1; e >= 0; e--) { var ek = ep.recent[e], ev = ep.byItem[ek]; if (!ev || (cutoff && ev.ts && ev.ts < cutoff)) { if (ev && ev.hash) delete ep.byHash[String(ev.hash)]; delete ep.byItem[ek]; ep.recent.splice(e, 1); } }
      C.trimObjectMap(ep.byItem, ep.recent, maxEntries);
      ep.byHash = {};
      for (var ei in ep.byItem) if (ep.byItem.hasOwnProperty(ei) && ep.byItem[ei].hash) ep.byHash[String(ep.byItem[ei].hash)] = ep.byItem[ei];
      C.storageSet(K.episodeMap, ep);
    }

    var tm = C.storageGet(K.timelineMap, {});
    if (tm && typeof tm === 'object') {
      var keys = [];
      for (var tk in tm) if (tm.hasOwnProperty(tk)) { if (cutoff && tm[tk] && tm[tk].ts && tm[tk].ts < cutoff) delete tm[tk]; else keys.push(tk); }
      keys.sort(function (a, b) { return (tm[b].ts || 0) - (tm[a].ts || 0); });
      for (var t = maxEntries; t < keys.length; t++) delete tm[keys[t]];
      C.storageSet(K.timelineMap, tm);
    }

    var snap = C.getBookmarkSnapshot ? C.getBookmarkSnapshot() : C.storageGet(K.bookmarkSnapshot, { items: {} });
    if (snap && snap.items) {
      var skeys = [];
      for (var sid in snap.items) if (snap.items.hasOwnProperty(sid)) { var sv = snap.items[sid]; if (cutoff && sv.lastSeenRemote && sv.lastSeenRemote < cutoff && !sv.pending) delete snap.items[sid]; else skeys.push(sid); }
      skeys.sort(function (a, b) { return ((snap.items[b] && snap.items[b].lastSeenRemote) || 0) - ((snap.items[a] && snap.items[a].lastSeenRemote) || 0); });
      for (var si = maxEntries; si < skeys.length; si++) delete snap.items[skeys[si]];
      C.storageSet(K.bookmarkSnapshot, snap);
    }
  };

  C.autoCleanServiceData = function (reason) {
    if (!C.getBool(C.KEY.cacheAutoClean, true)) return;
    var maxKb = C.getInt(C.KEY.cacheMaxKb, C.opts && C.opts.lite ? 300 : 500);
    var maxAge = C.getInt(C.KEY.cacheMaxAgeDays, 90);
    var limit = C.getInt(C.KEY.identityLimit, C.opts && C.opts.lite ? 500 : 1000);
    var cutoff = maxAge > 0 ? Date.now() - maxAge * 24 * 60 * 60 * 1000 : 0;
    C.trimServiceCache(limit, cutoff);
    var st = C.storageStats();
    if (maxKb > 0 && (st.cacheKb + st.logKb) > maxKb) {
      C.trimServiceCache(Math.max(50, Math.floor(limit / 2)), cutoff);
      var st2 = C.storageStats();
      if ((st2.cacheKb + st2.logKb) > maxKb) C.storageSet(C.KEY.serviceLog, []);
      var st3 = C.storageStats();
      if ((st3.cacheKb + st3.logKb) > maxKb) {
        C.clearServiceCache(true);
        C.storageSet(C.KEY.lastStatus, 'Кэш очищен автоматически: превышен лимит ' + maxKb + ' KB');
      }
      C.log('service cache maintenance', reason || '', C.storageStats());
    }
  };

  C.getBool = function (key, fallback) {
    var v = C.storageGet(key, fallback);
    if (v === true || v === 'true' || v === 1 || v === '1' || v === 'yes') return true;
    if (v === false || v === 'false' || v === 0 || v === '0' || v === 'no') return false;
    return !!fallback;
  };

  C.getInt = function (key, fallback) {
    var n = parseInt(C.storageGet(key, fallback), 10);
    return isNaN(n) ? fallback : n;
  };

  C.encodeParams = function (obj) {
    var parts = [];
    obj = obj || {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k) && obj[k] !== undefined && obj[k] !== null) parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]));
    }
    return parts.join('&');
  };

  C.addUrlParams = function (url, params) {
    var qs = C.encodeParams(params || {});
    return qs ? url + (url.indexOf('?') >= 0 ? '&' : '?') + qs : url;
  };

  C.delay = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms || 0); }); };

  C.eachLimit = function (items, limit, fn, stats) {
    items = items || [];
    var requested = limit || items.length;
    var max = Math.min(items.length, Math.max(0, requested));
    var i = 0;
    var delayMs = C.getInt(C.KEY.apiDelay, C.opts.lite ? 150 : 100);
    function next() {
      if (i >= max) return Promise.resolve();
      var item = items[i++];
      return Promise.resolve().then(function () { return fn(item, i - 1); }).then(function () {
        return delayMs > 0 ? C.delay(delayMs) : true;
      }).then(next);
    }
    return next();
  };

  C.consumeApiBudget = function () {
    var stats = C._currentStats;
    if (!stats) return true;
    var limit = C.getInt(C.KEY.apiOpLimit, C.opts.lite ? 50 : 100);
    if (limit > 0 && (stats.apiOperations || 0) >= limit) { stats.skipped = (stats.skipped || 0) + 1; return false; }
    stats.apiOperations = (stats.apiOperations || 0) + 1;
    return true;
  };

  C.asArray = function (json) {
    json = C.parseJson(json);
    if (!json) return [];
    if (Object.prototype.toString.call(json) === '[object Array]') return json;
    if (json.items && Object.prototype.toString.call(json.items) === '[object Array]') return json.items;
    if (json.results && Object.prototype.toString.call(json.results) === '[object Array]') return json.results;
    if (json.bookmarks && Object.prototype.toString.call(json.bookmarks) === '[object Array]') return json.bookmarks;
    if (json.folders && Object.prototype.toString.call(json.folders) === '[object Array]') return json.folders;
    if (json.data && Object.prototype.toString.call(json.data) === '[object Array]') return json.data;
    if (json.history && Object.prototype.toString.call(json.history) === '[object Array]') return json.history;
    if (json.item && json.item.seasons && Object.prototype.toString.call(json.item.seasons) === '[object Array]') return json.item.seasons;
    if (json.item && json.item.videos && Object.prototype.toString.call(json.item.videos) === '[object Array]') return json.item.videos;
    return [];
  };

  C.request = function (method, url, body, headers, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var net;
      try { net = new Lampa.Reguest(); } catch (e) { reject(e); return; }
      try { net.timeout(timeoutMs || 20000); } catch (e2) {}
      var postData = false;
      if (method === 'POST') postData = body || '';
      try {
        net.silent(url, function (json) { resolve(C.parseJson(json)); }, function (xhr, status) {
          reject({ xhr: xhr || {}, status: status || 'error' });
        }, postData, { headers: headers || {} });
      } catch (e3) { reject(e3); }
    });
  };

  C.tokenAccess = function () { return C.storageGet(C.KEY.token, '') || ''; };
  C.tokenRefresh = function () { return C.storageGet(C.KEY.refresh, '') || ''; };
  C.setTokens = function (access, refresh) { C.storageSet(C.KEY.token, access || ''); if (refresh) C.storageSet(C.KEY.refresh, refresh); };
  C.clearTokens = function () { C.storageSet(C.KEY.token, ''); C.storageSet(C.KEY.refresh, ''); };

  C.refreshToken = function () {
    var rt = C.tokenRefresh();
    if (!rt) return Promise.reject({ status: 'no_refresh_token' });
    return C.request('POST', API_HOST + '/oauth2/token', C.encodeParams({
      grant_type: 'refresh_token', client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: rt
    }), { 'Content-Type': 'application/x-www-form-urlencoded' }, 15000).then(function (json) {
      if (json && json.access_token) { C.setTokens(json.access_token, json.refresh_token); return json; }
      return Promise.reject({ status: 'bad_refresh_response', body: json });
    });
  };

  C.apiGet = function (path, params, retried) {
    var t = C.tokenAccess();
    if (!t) return Promise.reject({ status: 401, reason: 'no_token' });
    if (!retried && !C.consumeApiBudget()) return Promise.resolve({ __kp_sync_limit: true });
    return C.request('GET', C.addUrlParams(API_HOST + '/v1' + path, params || {}), false, { 'Authorization': 'Bearer ' + t }, 25000).catch(function (err) {
      var xhr = err && err.xhr;
      if (xhr && xhr.status === 401 && !retried) return C.refreshToken().then(function () { return C.apiGet(path, params, true); });
      return Promise.reject(err);
    });
  };

  C.apiPostForm = function (path, params, retried) {
    var t = C.tokenAccess();
    if (!t) return Promise.reject({ status: 401, reason: 'no_token' });
    if (!retried && !C.consumeApiBudget()) return Promise.resolve({ __kp_sync_limit: true });
    return C.request('POST', API_HOST + '/v1' + path, C.encodeParams(params || {}), {
      'Authorization': 'Bearer ' + t,
      'Content-Type': 'application/x-www-form-urlencoded'
    }, 25000).catch(function (err) {
      var xhr = err && err.xhr;
      if (xhr && xhr.status === 401 && !retried) return C.refreshToken().then(function () { return C.apiPostForm(path, params, true); });
      return Promise.reject(err);
    });
  };

  C.startDeviceLogin = function () {
    C.noty(C.translate('kp_sync_auth_getting'));
    return C.request('POST', API_HOST + '/oauth2/device', C.encodeParams({
      grant_type: 'device_code', client_id: CLIENT_ID, client_secret: CLIENT_SECRET
    }), { 'Content-Type': 'application/x-www-form-urlencoded' }, 15000).then(function (json) {
      if (!json || !json.user_code) return Promise.reject({ status: 'bad_device_response' });
      try {
        if (Lampa.Modal && Lampa.Modal.open) Lampa.Modal.open({
          title: C.translate('kp_sync_auth_title'),
          html: '<div>' + C.translate('kp_sync_auth_text') + '</div><div style="font-size:2em;margin:.4em 0">' + json.user_code + '</div><div style="opacity:.65">' + C.translate('kp_sync_auth_wait') + '</div>',
          size: 'medium'
        });
      } catch (e) {}
      var expires = Date.now() + ((json.expires_in || 600) * 1000);
      var interval = Math.max(3, json.interval || 5) * 1000;
      function poll() {
        if (Date.now() > expires) { C.noty(C.translate('kp_sync_auth_expired')); return false; }
        return C.request('POST', API_HOST + '/oauth2/device', C.encodeParams({
          grant_type: 'device_token', client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: (json.device_code || json.code)
        }), { 'Content-Type': 'application/x-www-form-urlencoded' }, 15000).then(function (res) {
          if (res && res.access_token) { C.setTokens(res.access_token, res.refresh_token); C.noty(C.translate('kp_sync_auth_ok')); return true; }
          return C.delay(interval).then(poll);
        }).catch(function () { return C.delay(interval).then(poll); });
      }
      return C.delay(interval).then(poll);
    }).catch(function (e) { C.noty(C.translate('kp_sync_auth_error')); C.log('auth error', e); return false; });
  };

  C.cleanCard = function (card) {
    if (!card) return card;
    var keep = ['id','media_type','title','name','original_title','original_name','release_date','first_air_date','poster_path','backdrop_path','overview','vote_average','kp_id','kinopub_id','imdb_id','kinopoisk_id','source','kp_sync_fallback','kp_sync_match_source','kp_sync_match_confidence'];
    var out = {};
    for (var i = 0; i < keep.length; i++) if (card[keep[i]] !== undefined) out[keep[i]] = card[keep[i]];
    return out;
  };

  C.titleFromCard = function (card) { return card && (card.title || card.name || card.original_title || card.original_name) || ''; };
  C.isSerialCard = function (card) { var t = card && (card.media_type || card.type); return t === 'tv' || t === 'serial' || !!(card && card.first_air_date && !card.release_date); };

  C.addFavorite = function (type, card, limit) {
    if (!card || !card.id) return false;
    try { if (Lampa.Favorite && Lampa.Favorite.add) { Lampa.Favorite.add(type, C.cleanCard(card), limit || 100); return true; } } catch (e) {}
    try {
      var fav = C.storageGet('favorite', {});
      if (typeof fav === 'string') fav = C.parseJson(fav) || {};
      fav[type] = fav[type] || [];
      fav.card = fav.card || [];
      var id = card.id;
      for (var i = fav[type].length - 1; i >= 0; i--) if (String(fav[type][i]) === String(id)) fav[type].splice(i, 1);
      fav[type].unshift(id);
      if (fav[type].length > (limit || 100)) fav[type] = fav[type].slice(0, limit || 100);
      var exists = false;
      for (var j = 0; j < fav.card.length; j++) if (fav.card[j] && String(fav.card[j].id) === String(id)) { fav.card[j] = C.cleanCard(card); exists = true; break; }
      if (!exists) fav.card.unshift(C.cleanCard(card));
      C.storageSet('favorite', fav);
      return true;
    } catch (e2) { C.log('favorite add failed', e2); return false; }
  };

  C.ensureCustomFavoriteType = function (typeName) {
    var fav = C.storageGet(CUSTOM_FAV_KEY, {});
    if (typeof fav === 'string') fav = C.parseJson(fav) || {};
    fav.customTypes = fav.customTypes || { card: [] };
    fav.customTypes.card = fav.customTypes.card || [];
    if (!fav.customTypes[typeName]) {
      var uid = 'kp' + Math.random().toString(36).slice(2, 10);
      fav.customTypes[typeName] = uid;
      fav[uid] = [];
    }
    return { favorite: fav, uid: fav.customTypes[typeName] };
  };

  C.addCustomFavorite = function (typeName, card) {
    if (!card || !card.id || !typeName) return false;
    try {
      var obj = C.ensureCustomFavoriteType(typeName), fav = obj.favorite, uid = obj.uid;
      fav[uid] = fav[uid] || [];
      if (fav[uid].indexOf(card.id) === -1) fav[uid].unshift(card.id);
      var cards = fav.customTypes.card || [];
      var exists = false;
      for (var i = 0; i < cards.length; i++) if (cards[i] && String(cards[i].id) === String(card.id)) { cards[i] = C.cleanCard(card); exists = true; break; }
      if (!exists) cards.unshift(C.cleanCard(card));
      fav.customTypes.card = cards;
      C.storageSet(CUSTOM_FAV_KEY, fav);
      return true;
    } catch (e) { C.log('custom favorite add failed', e); return false; }
  };

  C.removeIdFromArray = function (arr, id) {
    if (!arr || !arr.length) return false;
    var changed = false;
    for (var i = arr.length - 1; i >= 0; i--) if (String(arr[i]) === String(id)) { arr.splice(i, 1); changed = true; }
    return changed;
  };

  C.removeLampaFavoriteBookmark = function (card) {
    if (!card || !card.id) return false;
    var fav = C.storageGet('favorite', {});
    if (typeof fav === 'string') fav = C.parseJson(fav) || {};
    var changed = false;
    changed = C.removeIdFromArray(fav.book, card.id) || changed;
    changed = C.removeIdFromArray(fav.book_movie, card.id) || changed;
    changed = C.removeIdFromArray(fav.book_tv, card.id) || changed;
    if (changed) C.storageSet('favorite', fav);
    return changed;
  };

  C.removeCustomFavoriteItem = function (typeName, card) {
    if (!typeName || !card || !card.id) return false;
    var fav = C.storageGet(CUSTOM_FAV_KEY, {});
    if (typeof fav === 'string') fav = C.parseJson(fav) || {};
    var uid = fav.customTypes && fav.customTypes[typeName];
    if (!uid || !fav[uid]) return false;
    var changed = C.removeIdFromArray(fav[uid], card.id);
    if (changed) C.storageSet(CUSTOM_FAV_KEY, fav);
    return changed;
  };

  C.collectFavoriteCards = function () {
    var fav = C.storageGet('favorite', {});
    if (typeof fav === 'string') fav = C.parseJson(fav) || {};
    var cards = fav.card || [];
    var ids = {}, result = [];
    function mark(arr) { for (var i = 0; arr && i < arr.length; i++) ids[String(arr[i])] = true; }
    mark(fav.book); mark(fav.book_movie); mark(fav.book_tv);
    for (var c = 0; c < cards.length; c++) if (cards[c] && ids[String(cards[c].id)]) result.push(cards[c]);
    return result;
  };

  C.getBookmarkSnapshot = function () {
    var s = C.storageGet(C.KEY.bookmarkSnapshot, { items: {} });
    if (!s || typeof s !== 'object') s = { items: {} };
    s.items = s.items || {};
    return s;
  };

  C.setBookmarkSnapshot = function (s) { C.storageSet(C.KEY.bookmarkSnapshot, s || { items: {} }); };
  C.getTimelineSnapshot = function () { var s = C.storageGet(C.KEY.timelineSnapshot, { items: {} }); return s && typeof s === 'object' ? s : { items: {} }; };
  C.setTimelineSnapshot = function (s) { C.storageSet(C.KEY.timelineSnapshot, s || { items: {} }); };
  C.resetSnapshots = function () { C.setBookmarkSnapshot({ items: {} }); C.setTimelineSnapshot({ items: {} }); C.noty(C.translate('kp_sync_snapshots_cleared')); };

  C.snapshotRemoteBookmark = function (item, folder, card) {
    var id = String(item && item.id || item || '');
    if (!id) return;
    var snap = C.getBookmarkSnapshot();
    snap.items[id] = snap.items[id] || { item: parseInt(id, 10) || id, folders: {}, title: '' };
    var fid = String(folder && folder.id || folder || '0');
    snap.items[id].folders[fid] = folder && (folder.title || folder.name) || '';
    snap.items[id].title = C.titleFromCard(card) || snap.items[id].title || (item && (item.title || item.name)) || '';
    snap.items[id].lastSeenRemote = Date.now();
    if (card) snap.items[id].card = C.cleanCard(card);
    C.setBookmarkSnapshot(snap);
  };

  C.setTimeline = function (card, time, duration, item, season, video) {
    if (!card || !card.id || !time || !Lampa.Timeline) return false;
    try {
      var hash = String(card.id);
      if (season || video) hash += '_' + (season || 0) + '_' + (video || 0);
      var data = { hash: hash, time: parseInt(time, 10) || 0, duration: parseInt(duration, 10) || 0, percent: duration ? Math.round((time / duration) * 100) : 0, card: C.cleanCard(card) };
      if (Lampa.Timeline.update) Lampa.Timeline.update(data);
      if (C.modules.identity && C.modules.identity.registerEpisode) C.modules.identity.registerEpisode(item, card, season, video, hash, time, duration);
      return true;
    } catch (e) { C.log('timeline update failed', e); return false; }
  };

  C.loadScript = function (src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { C.log('module loaded', src); resolve(true); };
      s.onerror = function () {
        C.log('module load error', src, 'Проверьте HTTP 200, CORS и путь к файлам modules/*.js');
        reject(new Error(src));
      };
      document.head.appendChild(s);
    });
  };

  C.loadModule = function (name) {
    if (C.modules[name]) return Promise.resolve(C.modules[name]);
    if (C.modulePromises[name]) return C.modulePromises[name];
    if (!C.opts.modules || !C.opts.modules[name]) return Promise.reject(new Error('module disabled: ' + name));

    // TV bundle mode: модули находятся внутри этого же файла как фабрики.
    // Они активируются только тогда, когда реально нужны настройкам/синхронизации.
    C.modulePromises[name] = new Promise(function (resolve, reject) {
      try {
        if (!C.moduleFactories || !C.moduleFactories[name]) throw new Error('module factory missing: ' + name);
        C.moduleFactories[name](C);
        if (!C.modules[name]) throw new Error('module not registered: ' + name);
        C.log('module activated', name);
        resolve(C.modules[name]);
      } catch (e) {
        C.log('module activate error', name, e && (e.message || e));
        delete C.modulePromises[name];
        reject(e);
      }
    });
    return C.modulePromises[name];
  };

  C.maybeLoadIdentity = function () {
    if (!C.getBool(C.KEY.identityEnabled, true)) return Promise.resolve(false);
    if (!C.opts.modules.identity) return Promise.resolve(false);
    return C.loadModule('identity');
  };

  C.exportEnabled = function () {
    if (C.opts.lite) return false;
    return C.getBool(C.KEY.pushEnabled, false) && (C.getBool(C.KEY.pushBookmarks, false) || C.getBool(C.KEY.pushTimeline, false));
  };

  C.cleanupEnabled = function () {
    if (C.opts.lite) return false;
    return C.getBool(C.KEY.fullCleanup, false) || (C.getBool(C.KEY.allowDeletes, false) && String(C.storageGet(C.KEY.bookmarkConflict, 'merge')).indexOf('lampa_') === 0);
  };

  C.importEnabled = function () {
    return C.getBool(C.KEY.syncBookmarks, true) || C.getBool(C.KEY.syncHistory, true) || C.getBool(C.KEY.syncTimeline, true);
  };

  C.emptyStats = function () {
    return { apiOperations: 0, bookmarkFolders: 0, bookmarkItems: 0, bookmarkImported: 0, historyImported: 0, timelineImported: 0, lampaBookmarksFound: 0, lampaBookmarksPushed: 0, lampaProgressFound: 0, lampaProgressPushed: 0, kpResolved: 0, identityResolved: 0, identityMapped: 0, kpBookmarksRemoved: 0, kpBookmarksDeletePending: 0, kpBookmarksDeleteBlockedMass: 0, lampaBookmarksRemovedLocal: 0, errors: 0, skipped: 0 };
  };

  C.statsText = function (s) {
    return 'KinoPUB Sync: импорт ' + (s.bookmarkImported || 0) + ', история ' + (s.historyImported || 0) + ', таймкоды ' + (s.timelineImported || 0) + ', экспорт ' + ((s.lampaBookmarksPushed || 0) + (s.lampaProgressPushed || 0)) + ', удалено ' + ((s.kpBookmarksRemoved || 0) + (s.lampaBookmarksRemovedLocal || 0)) + ', ошибок ' + (s.errors || 0);
  };

  C.setStatus = function (text) { C.storageSet(C.KEY.lastStatus, C.redactSecretsText(text)); };

  C.syncNow = function (silent) {
    if (C.running) { if (!silent) C.noty(C.translate('kp_sync_already_running')); return Promise.resolve(false); }
    if (!C.tokenAccess()) { if (!silent) { C.noty(C.translate('kp_sync_need_auth')); C.startDeviceLogin(); } return Promise.resolve(false); }
    C.running = true;
    if (!silent) C.noty(C.translate('kp_sync_running'));
    C.setStatus('sync started');
    var stats = C.emptyStats();
    stats._silent = !!silent;
    C._currentStats = stats;
    var chain = C.maybeLoadIdentity().then(function () { return stats; });
    if (C.importEnabled()) chain = chain.then(function () { return C.loadModule('importer'); }).then(function (m) { return m && m.run ? m.run(stats) : stats; });
    if (C.cleanupEnabled()) chain = chain.then(function () { return C.loadModule('cleanup'); }).then(function (m) { return m && m.run ? m.run(stats) : stats; });
    if (C.exportEnabled()) chain = chain.then(function () { return C.loadModule('exporter'); }).then(function (m) { return m && m.run ? m.run(stats) : stats; });
    return chain.then(function () {
      C.running = false;
      C._currentStats = null;
      C.storageSet(C.KEY.lastRun, Date.now());
      var text = C.statsText(stats);
      C.setStatus(text);
      C.autoCleanServiceData('after-sync');
      if (!silent) C.noty(text);
      return stats;
    }).catch(function (e) {
      C.running = false;
      C._currentStats = null;
      stats.errors++;
      var msg = 'Ошибка синхронизации: ' + (e && (e.status || e.reason || e.message) || 'unknown');
      C.setStatus(msg);
      C.log('sync failed', e);
      C.autoCleanServiceData('after-sync-error');
      if (!silent) C.noty(msg);
      return false;
    });
  };

  C.maybeAutoSync = function () {
    if (!C.getBool(C.KEY.syncAuto, false)) return;
    var intervalHours = C.getInt(C.KEY.syncInterval, 24);
    var last = parseInt(C.storageGet(C.KEY.lastRun, 0), 10) || 0;
    if (last && (Date.now() - last) < intervalHours * 60 * 60 * 1000) return;
    setTimeout(function () { C.syncNow(true); }, 5000);
  };

  C.addLang = function () {
    if (!Lampa.Lang || !Lampa.Lang.add) return;
    Lampa.Lang.add({
      kp_sync_component: { ru: 'KinoPUB Sync', en: 'KinoPUB Sync', uk: 'KinoPUB Sync' },
      kp_sync_sep_main: { ru: '— Основное —', en: '— Main —', uk: '— Основне —' },
      kp_sync_sep_main_descr: { ru: 'Базовые действия, авторизация и ручной запуск синхронизации.', en: 'Basic actions, authorization and manual sync.', uk: 'Базові дії, авторизація та ручний запуск.' },
      kp_sync_sep_import: { ru: '— Импорт KinoPUB → Lampa —', en: '— Import KinoPUB → Lampa —', uk: '— Імпорт KinoPUB → Lampa —' },
      kp_sync_sep_import_descr: { ru: 'Что читать из KinoPUB и переносить в локальные разделы Lampa.', en: 'What to read from KinoPUB and copy into local Lampa sections.', uk: 'Що читати з KinoPUB і переносити в Lampa.' },
      kp_sync_sep_mapping: { ru: '— Сопоставление и точность —', en: '— Mapping and accuracy —', uk: '— Зіставлення і точність —' },
      kp_sync_sep_mapping_descr: { ru: 'Настройки карты соответствий KinoPUB ↔ TMDB/Lampa.', en: 'KinoPUB ↔ TMDB/Lampa identity map settings.', uk: 'Налаштування карти відповідностей KinoPUB ↔ TMDB/Lampa.' },
      kp_sync_sep_export: { ru: '— Экспорт Lampa → KinoPUB —', en: '— Export Lampa → KinoPUB —', uk: '— Експорт Lampa → KinoPUB —' },
      kp_sync_sep_export_descr: { ru: 'Запись закладок и таймкодов из Lampa обратно в KinoPUB. Доступно только в Standard.', en: 'Writes Lampa bookmarks and timecodes back to KinoPUB. Standard only.', uk: 'Запис закладок і таймкодів з Lampa в KinoPUB. Лише Standard.' },
      kp_sync_sep_conflicts: { ru: '— Конфликты и удаления —', en: '— Conflicts and deletes —', uk: '— Конфлікти і видалення —' },
      kp_sync_sep_conflicts_descr: { ru: 'Политики источника истины, двухфазные удаления и защита от массовой чистки.', en: 'Source-of-truth policies, two-phase deletes and mass-cleanup safeguards.', uk: 'Політики конфліктів, двофазні видалення та захист.' },
      kp_sync_sep_auto: { ru: '— Автосинхронизация —', en: '— Auto sync —', uk: '— Автосинхронізація —' },
      kp_sync_sep_auto_descr: { ru: 'Автоматический запуск синхронизации с заданным интервалом.', en: 'Automatic sync run with a selected interval.', uk: 'Автоматичний запуск синхронізації з інтервалом.' },
      kp_sync_sep_cache: { ru: '— Кэш, логи и диагностика —', en: '— Cache, logs and diagnostics —', uk: '— Кеш, логи і діагностика —' },
      kp_sync_sep_cache_descr: { ru: 'Ограничения служебного кэша, debug-лог, сведения устройства и диагностический отчёт.', en: 'Service cache limits, debug log, device details and diagnostic report.', uk: 'Ліміти кешу, debug-лог, дані пристрою і діагностика.' },
      kp_sync_sep_actions: { ru: '— Действия и обслуживание —', en: '— Actions and maintenance —', uk: '— Дії та обслуговування —' },
      kp_sync_sep_actions_descr: { ru: 'Ручные команды: проверка, очистка, копирование отчёта и управление токенами.', en: 'Manual commands: checks, cleanup, report copy and token management.', uk: 'Ручні команди: перевірка, очищення, звіт і токени.' },
      kp_sync_bookmarks: { ru: 'Импортировать закладки', en: 'Import bookmarks', uk: 'Імпортувати закладки' },
      kp_sync_bookmarks_descr: { ru: 'Читает папки KinoPUB и добавляет фильмы/сериалы в обычные закладки Lampa.', en: 'Reads KinoPUB folders and adds movies/series to Lampa bookmarks.', uk: 'Читає папки KinoPUB і додає фільми/серіали до закладок Lampa.' },
      kp_sync_history: { ru: 'Импортировать историю', en: 'Import history', uk: 'Імпортувати історію' },
      kp_sync_history_descr: { ru: 'Добавляет последние просмотры KinoPUB в раздел истории Lampa.', en: 'Adds recent KinoPUB views to Lampa history.', uk: 'Додає останні перегляди KinoPUB до історії Lampa.' },
      kp_sync_timeline: { ru: 'Импортировать таймкоды', en: 'Import timecodes', uk: 'Імпортувати таймкоди' },
      kp_sync_timeline_descr: { ru: 'Восстанавливает позицию просмотра из KinoPUB, если API отдаёт time/duration.', en: 'Restores watch progress from KinoPUB when time/duration are available.', uk: 'Відновлює позицію перегляду з KinoPUB.' },
      kp_sync_custom_folders: { ru: 'Папки KinoPUB как категории Lampa', en: 'KinoPUB folders as Lampa categories', uk: 'Папки KinoPUB як категорії Lampa' },
      kp_sync_custom_folders_descr: { ru: 'Создаёт локальные категории вида “KinoPUB: Название папки”, чтобы сохранить структуру папок.', en: 'Creates local “KinoPUB: folder” categories to preserve folder structure.', uk: 'Створює локальні категорії “KinoPUB: папка”.' },
      kp_sync_tmdb_lookup: { ru: 'Искать TMDB по IMDb', en: 'Find TMDB by IMDb', uk: 'Шукати TMDB за IMDb' },
      kp_sync_tmdb_lookup_descr: { ru: 'Пробует найти полноценную карточку Lampa/TMDB вместо fallback-карточки KinoPUB.', en: 'Tries to resolve a full Lampa/TMDB card instead of a KinoPUB fallback card.', uk: 'Пробує знайти повну картку Lampa/TMDB.' },
      kp_sync_identity_enabled: { ru: 'Точная карта KinoPUB ↔ TMDB', en: 'Exact KinoPUB ↔ TMDB map', uk: 'Точна карта KinoPUB ↔ TMDB' },
      kp_sync_identity_enabled_descr: { ru: 'Сохраняет устойчивые связи между item KinoPUB, TMDB/IMDb и карточками Lampa для точного экспорта.', en: 'Stores stable links between KinoPUB item, TMDB/IMDb and Lampa cards for accurate export.', uk: 'Зберігає точні зв’язки KinoPUB, TMDB/IMDb та Lampa.' },
      kp_sync_identity_strict: { ru: 'Строгий режим сопоставления', en: 'Strict matching mode', uk: 'Суворий режим зіставлення' },
      kp_sync_identity_strict_descr: { ru: 'Не смешивает фильмы и сериалы с одинаковыми числовыми id. Рекомендуется оставить включённым.', en: 'Does not mix movies and series with the same numeric id. Recommended on.', uk: 'Не змішує фільми та серіали з однаковим id.' },
      kp_sync_identity_min_confidence: { ru: 'Минимальная точность карты', en: 'Minimum map confidence', uk: 'Мінімальна точність карти' },
      kp_sync_identity_min_confidence_descr: { ru: 'Порог доверия для использования сохранённой связи. 70 — баланс, 90 — только самые надёжные совпадения.', en: 'Confidence threshold for using saved mappings. 70 is balanced, 90 is strict.', uk: 'Поріг довіри до збережених відповідностей.' },
      kp_sync_identity_limit: { ru: 'Лимит карты соответствий', en: 'Identity map limit', uk: 'Ліміт карти відповідностей' },
      kp_sync_identity_limit_descr: { ru: 'Максимум записей в локальных картах item/TMDB/episode. Старые записи удаляются, чтобы не раздувать Storage ТВ.', en: 'Maximum local item/TMDB/episode map entries. Old entries are trimmed to protect TV storage.', uk: 'Максимум записів локальної карти.' },
      kp_sync_reset_identity: { ru: 'Очистить карту соответствий', en: 'Reset identity map', uk: 'Очистити карту відповідностей' },
      kp_sync_reset_identity_descr: { ru: 'Удаляет локальные карты сопоставлений, но не трогает закладки, историю и snapshot удалений.', en: 'Clears local mapping tables without touching bookmarks, history or delete snapshots.', uk: 'Очищає локальні карти відповідностей.' },
      kp_sync_deep_integration: { ru: 'Глубокая интеграция с lampa_kinopub', en: 'Deep lampa_kinopub integration', uk: 'Глибока інтеграція з lampa_kinopub' },
      kp_sync_deep_integration_descr: { ru: 'Включает bridge-наблюдение за воспроизведением, чтобы точнее связать KinoPUB item с TMDB. Выключено по умолчанию; отключение полностью применяется после перезапуска Lampa.', en: 'Enables a playback bridge to link KinoPUB item with TMDB more accurately. Disabled by default; turning it off fully applies after restarting Lampa.', uk: 'Завантажує bridge-модуль для точніших зв’язків.' },
      kp_sync_history_limit: { ru: 'Лимит истории', en: 'History limit', uk: 'Ліміт історії' },
      kp_sync_history_limit_descr: { ru: 'Сколько последних записей истории KinoPUB обрабатывать за один запуск.', en: 'How many recent KinoPUB history entries to process per run.', uk: 'Скільки записів історії обробляти за запуск.' },
      kp_sync_api_op_limit: { ru: 'Лимит операций API за запуск', en: 'API operation limit per run', uk: 'Ліміт API-операцій за запуск' },
      kp_sync_api_op_limit_descr: { ru: 'Ограничивает количество сетевых операций за запуск, чтобы не перегружать телевизор и KinoPUB API.', en: 'Limits network operations per run to avoid overloading the TV and KinoPUB API.', uk: 'Обмежує мережеві операції за запуск.' },
      kp_sync_api_delay: { ru: 'Пауза между API-запросами', en: 'Delay between API requests', uk: 'Пауза між API-запитами' },
      kp_sync_api_delay_descr: { ru: 'Небольшая задержка между запросами. Для ТВ безопаснее 100–250 мс.', en: 'Small delay between requests. 100–250 ms is safer for TVs.', uk: 'Невелика затримка між запитами.' },
      kp_sync_push_enabled: { ru: 'Разрешить запись в KinoPUB', en: 'Allow writing to KinoPUB', uk: 'Дозволити запис у KinoPUB' },
      kp_sync_push_enabled_descr: { ru: 'Главный предохранитель экспорта. Пока выключено, модуль export не загружается и ничего не отправляет в KinoPUB.', en: 'Master export switch. When disabled, export module is not loaded and nothing is sent to KinoPUB.', uk: 'Головний запобіжник експорту.' },
      kp_sync_push_bookmarks: { ru: 'Экспортировать закладки Lampa', en: 'Export Lampa bookmarks', uk: 'Експортувати закладки Lampa' },
      kp_sync_push_bookmarks_descr: { ru: 'Добавляет закладки Lampa в выбранную папку KinoPUB через безопасный add, без toggle.', en: 'Adds Lampa bookmarks to the selected KinoPUB folder via safe add, not toggle.', uk: 'Додає закладки Lampa до папки KinoPUB.' },
      kp_sync_push_timeline: { ru: 'Экспортировать таймкоды Lampa', en: 'Export Lampa progress', uk: 'Експортувати таймкоди Lampa' },
      kp_sync_push_timeline_descr: { ru: 'Отправляет известный прогресс Lampa в KinoPUB через marktime; сериалы только при точной связи season/video.', en: 'Sends known Lampa progress to KinoPUB via marktime; series require exact season/video mapping.', uk: 'Надсилає прогрес Lampa через marktime.' },
      kp_sync_push_resolve: { ru: 'Искать KinoPUB для карточек без kp_id', en: 'Resolve cards without kp_id', uk: 'Шукати KinoPUB для карток без kp_id' },
      kp_sync_push_resolve_descr: { ru: 'Опциональный поиск item по названию/году. Выключено по умолчанию, потому что возможны неточные совпадения.', en: 'Optional item lookup by title/year. Disabled by default because matches may be inaccurate.', uk: 'Опційний пошук item за назвою/роком.' },
      kp_sync_push_folder_title: { ru: 'Папка KinoPUB для экспорта', en: 'KinoPUB export folder', uk: 'Папка KinoPUB для експорту' },
      kp_sync_push_folder_title_descr: { ru: 'Название папки, куда будут добавляться закладки Lampa. ID папки сохраняется отдельно для безопасности.', en: 'Folder name where Lampa bookmarks will be added. Folder ID is stored separately for safety.', uk: 'Назва папки для експорту закладок Lampa.' },
      kp_sync_push_limit: { ru: 'Лимит экспорта за запуск', en: 'Export limit per run', uk: 'Ліміт експорту за запуск' },
      kp_sync_push_limit_descr: { ru: 'Максимум закладок/таймкодов, которые export-модуль обработает за один ручной запуск.', en: 'Maximum bookmarks/progress entries export module processes in one manual run.', uk: 'Максимум записів експорту за запуск.' },
      kp_sync_bookmark_conflict: { ru: 'Источник истины для закладок', en: 'Bookmark source of truth', uk: 'Джерело істини для закладок' },
      kp_sync_bookmark_conflict_descr: { ru: 'merge — только объединять; KinoPUB — восстанавливать из KinoPUB; Lampa export — Lampa управляет папкой экспорта; Lampa full — экспертный режим всех синхронизированных папок.', en: 'merge only merges; KinoPUB restores from KinoPUB; Lampa export controls export folder; Lampa full is expert mode for all synced folders.', uk: 'Вибір джерела істини для закладок.' },
      kp_sync_timeline_conflict: { ru: 'Источник истины для таймкодов', en: 'Progress source of truth', uk: 'Джерело істини для таймкодів' },
      kp_sync_timeline_conflict_descr: { ru: 'newest — использовать более дальнюю позицию; no rollback — не отправлять меньший локальный прогресс в KinoPUB; KinoPUB/Lampa — выбранная сторона главная.', en: 'newest uses farther position; no rollback avoids rollback; KinoPUB/Lampa chooses the winning side.', uk: 'Вибір джерела істини для прогресу.' },
      kp_sync_allow_deletes: { ru: 'Разрешить удаления из KinoPUB', en: 'Allow deletes from KinoPUB', uk: 'Дозволити видалення з KinoPUB' },
      kp_sync_allow_deletes_descr: { ru: 'Отдельный предохранитель. Без него cleanup-модуль не удаляет закладки из KinoPUB.', en: 'Extra safety switch. Without it cleanup module never deletes KinoPUB bookmarks.', uk: 'Окремий запобіжник видалень KinoPUB.' },
      kp_sync_delete_two_phase: { ru: 'Двухфазное удаление', en: 'Two-phase delete', uk: 'Двофазне видалення' },
      kp_sync_delete_two_phase_descr: { ru: 'Первый запуск ставит pending-метку, второй запуск удаляет только если запись всё ещё отсутствует.', en: 'First run marks pending; second run deletes only if the item is still missing.', uk: 'Перший запуск ставить pending-мітку.' },
      kp_sync_delete_limit: { ru: 'Лимит удалений за запуск', en: 'Delete limit per run', uk: 'Ліміт видалень за запуск' },
      kp_sync_delete_limit_descr: { ru: 'Если кандидатов больше лимита, удаления полностью блокируются.', en: 'If delete candidates exceed the limit, all deletes are blocked.', uk: 'Якщо кандидатів більше ліміту, видалення блокується.' },
      kp_sync_delete_confirm: { ru: 'Показывать список перед удалением', en: 'Show list before delete', uk: 'Показувати список перед видаленням' },
      kp_sync_delete_confirm_descr: { ru: 'Перед удалением показывает названия и папки; в автосинхронизации удаления без подтверждения блокируются.', en: 'Shows titles and folders before deleting; autosync deletes are blocked without confirmation.', uk: 'Показує список перед видаленням.' },
      kp_sync_allow_auto_deletes: { ru: 'Разрешить удаления при автосинхронизации', en: 'Allow deletes during autosync', uk: 'Дозволити видалення під час автосинхронізації' },
      kp_sync_allow_auto_deletes_descr: { ru: 'По умолчанию выключено: любые удаления в silent/autosync режиме блокируются, даже если отключён показ списка.', en: 'Disabled by default: all deletes in silent/autosync mode are blocked even when delete confirmation is off.', uk: 'За замовчуванням вимкнено: видалення в автосинхронізації блокуються.' },
      kp_sync_warn_deletes: { ru: 'Внимание: включены удаления. Оставьте двухфазное удаление и подтверждение списка включёнными.', en: 'Warning: deletes are enabled. Keep two-phase delete and list confirmation enabled.', uk: 'Увага: видалення увімкнено.' },
      kp_sync_warn_deep: { ru: 'Глубокая интеграция патчит методы Lampa. Полное отключение применится после перезапуска.', en: 'Deep integration patches Lampa methods. Full disable applies after restart.', uk: 'Глибока інтеграція патчить методи Lampa.' },
      kp_sync_full_cleanup: { ru: 'Чистить устаревшее с обеих сторон', en: 'Clean stale items on both sides', uk: 'Чистити застаріле з обох сторін' },
      kp_sync_full_cleanup_descr: { ru: 'Экспертный режим: удалённое в KinoPUB может быть удалено из Lampa. Cleanup-модуль грузится только при включении.', en: 'Expert mode: items deleted in KinoPUB may be removed from Lampa. Cleanup module loads only when enabled.', uk: 'Експертний режим двосторонньої чистки.' },
      kp_sync_reset_snapshots: { ru: 'Очистить snapshot синхронизации', en: 'Reset sync snapshot', uk: 'Очистити snapshot синхронізації' },
      kp_sync_reset_snapshots_descr: { ru: 'Сбрасывает память о прошлых синхронизациях и pending-удалениях.', en: 'Clears sync memory and pending deletes.', uk: 'Скидає пам’ять синхронізації.' },
      kp_sync_auto: { ru: 'Автосинхронизация при запуске', en: 'Auto-sync on startup', uk: 'Автосинхронізація при старті' },
      kp_sync_auto_descr: { ru: 'Запускает синхронизацию после старта Lampa не чаще выбранного интервала. На ТВ лучше включать после ручной проверки.', en: 'Runs sync after Lampa startup no more often than the selected interval. Test manually on TV first.', uk: 'Запускає синхронізацію після старту Lampa.' },
      kp_sync_interval: { ru: 'Интервал автосинхронизации', en: 'Auto-sync interval', uk: 'Інтервал автосинхронізації' },
      kp_sync_interval_descr: { ru: 'Минимальный промежуток между автозапусками синхронизации.', en: 'Minimum interval between automatic sync runs.', uk: 'Мінімальний інтервал автосинхронізації.' },
      kp_sync_run: { ru: 'Запустить синхронизацию сейчас', en: 'Run sync now', uk: 'Запустити синхронізацію зараз' },
      kp_sync_run_descr: { ru: 'Ручной запуск. Подгружает только те модули, чьи функции включены в настройках.', en: 'Manual run. Loads only modules enabled by settings.', uk: 'Ручний запуск синхронізації.' },
      kp_sync_login: { ru: 'Авторизоваться в KinoPUB', en: 'Authorize KinoPUB', uk: 'Авторизуватися в KinoPUB' },
      kp_sync_login_descr: { ru: 'Нужно, если основной KinoPUB-плагин ещё не сохранил kp_token/kp_refresh.', en: 'Needed if the main KinoPUB plugin has not stored kp_token/kp_refresh yet.', uk: 'Потрібно, якщо немає kp_token/kp_refresh.' },
      kp_sync_logout: { ru: 'Очистить токены KinoPUB', en: 'Clear KinoPUB tokens', uk: 'Очистити токени KinoPUB' },
      kp_sync_logout_descr: { ru: 'Удаляет локальные токены KinoPUB из Lampa. Данные аккаунта KinoPUB не меняет.', en: 'Removes local KinoPUB tokens from Lampa. Does not change KinoPUB account data.', uk: 'Видаляє локальні токени KinoPUB.' },
      kp_sync_status: { ru: 'Последний статус', en: 'Last status', uk: 'Останній статус' },
      kp_sync_status_descr: { ru: 'Последний результат синхронизации и номер версии установленной сборки.', en: 'Last sync result and installed build version.', uk: 'Останній результат синхронізації.' },
      kp_sync_running: { ru: 'KinoPUB Sync: синхронизация запущена', en: 'KinoPUB Sync: sync started', uk: 'KinoPUB Sync: синхронізацію запущено' },
      kp_sync_already_running: { ru: 'KinoPUB Sync уже выполняется', en: 'KinoPUB Sync is already running', uk: 'KinoPUB Sync вже виконується' },
      kp_sync_need_auth: { ru: 'KinoPUB Sync: нужна авторизация', en: 'KinoPUB Sync: authorization required', uk: 'KinoPUB Sync: потрібна авторизація' },
      kp_sync_auth_title: { ru: 'Авторизация KinoPUB', en: 'KinoPUB authorization', uk: 'Авторизація KinoPUB' },
      kp_sync_auth_text: { ru: 'Откройте kino.pub/device и введите код:', en: 'Open kino.pub/device and enter this code:', uk: 'Відкрийте kino.pub/device і введіть код:' },
      kp_sync_auth_wait: { ru: 'Ожидаю подтверждения...', en: 'Waiting for confirmation...', uk: 'Очікую підтвердження...' },
      kp_sync_auth_getting: { ru: 'Получаю код KinoPUB...', en: 'Getting KinoPUB code...', uk: 'Отримую код KinoPUB...' },
      kp_sync_auth_ok: { ru: 'KinoPUB авторизован', en: 'KinoPUB authorized', uk: 'KinoPUB авторизовано' },
      kp_sync_auth_error: { ru: 'Ошибка авторизации KinoPUB', en: 'KinoPUB authorization error', uk: 'Помилка авторизації KinoPUB' },
      kp_sync_auth_expired: { ru: 'Код авторизации истёк', en: 'Authorization code expired', uk: 'Код авторизації минув' },
      kp_sync_tokens_cleared: { ru: 'Токены KinoPUB очищены', en: 'KinoPUB tokens cleared', uk: 'Токени KinoPUB очищено' },
      kp_sync_snapshots_cleared: { ru: 'Snapshot синхронизации очищен', en: 'Sync snapshot cleared', uk: 'Snapshot синхронізації очищено' },
      kp_sync_identity_cleared: { ru: 'Карта соответствий очищена', en: 'Identity map cleared', uk: 'Карту відповідностей очищено' },
      kp_sync_cache_auto_clean: { ru: 'Автоочистка служебного кэша', en: 'Auto-clean service cache', uk: 'Автоочищення службового кешу' },
      kp_sync_cache_auto_clean_descr: { ru: 'Обрезает старые карты соответствий, snapshot и служебные данные, если они становятся слишком большими.', en: 'Prunes old identity maps, snapshots and service data when they grow too large.', uk: 'Обрізає старі службові дані, якщо вони завеликі.' },
      kp_sync_cache_max_kb: { ru: 'Максимальный размер кэша', en: 'Maximum cache size', uk: 'Максимальний розмір кешу' },
      kp_sync_cache_max_kb_descr: { ru: 'Примерный лимит для служебных данных плагина. Токены и настройки не очищаются.', en: 'Approximate limit for plugin service data. Tokens and settings are not cleared.', uk: 'Орієнтовний ліміт службових даних.' },
      kp_sync_cache_max_age_days: { ru: 'Удалять кэш старше', en: 'Delete cache older than', uk: 'Видаляти кеш старше' },
      kp_sync_cache_max_age_days_descr: { ru: 'Удаляет старые записи карт и snapshot по возрасту. Значение 0 отключает очистку по возрасту.', en: 'Removes old map and snapshot entries by age. 0 disables age-based cleanup.', uk: 'Видаляє старі записи за віком.' },
      kp_sync_debug_log: { ru: 'Сохранять debug-лог', en: 'Save debug log', uk: 'Зберігати debug-лог' },
      kp_sync_debug_log_descr: { ru: 'Выключено по умолчанию. При включении хранит короткий кольцевой лог для диагностики.', en: 'Off by default. When enabled, keeps a short ring log for diagnostics.', uk: 'Вимкнено типово, зберігає короткий лог.' },
      kp_sync_debug_device_info: { ru: 'Добавлять сведения устройства в лог', en: 'Add device details to log', uk: 'Додавати дані пристрою в лог' },
      kp_sync_debug_device_info_descr: { ru: 'Записывает краткую сводку об устройстве, ОС, браузере, экране и Lampa API в debug-лог и диагностический отчёт. Токены не включаются.', en: 'Adds a short summary about device, OS, browser, screen and Lampa API to debug log and diagnostics. Tokens are not included.', uk: 'Додає дані пристрою, ОС, браузера та Lampa API без токенів.' },
      kp_sync_debug_log_limit: { ru: 'Лимит строк debug-лога', en: 'Debug log line limit', uk: 'Ліміт рядків debug-лога' },
      kp_sync_debug_log_limit_descr: { ru: 'Сколько последних строк debug-лога хранить. 0 фактически отключает постоянный лог.', en: 'How many recent debug log lines to keep. 0 effectively disables persistent logging.', uk: 'Скільки рядків debug-лога зберігати.' },
      kp_sync_clear_cache: { ru: 'Очистить служебный кэш', en: 'Clear service cache', uk: 'Очистити службовий кеш' },
      kp_sync_clear_cache_descr: { ru: 'Очищает карты соответствий, snapshot, timeline-map и ID экспортной папки. Закладки, история, токены и настройки не трогаются.', en: 'Clears identity maps, snapshots, timeline map and export folder ID. Bookmarks, history, tokens and settings stay intact.', uk: 'Очищає службовий кеш, не чіпає закладки.' },
      kp_sync_clear_logs: { ru: 'Очистить логи и статус', en: 'Clear logs and status', uk: 'Очистити логи і статус' },
      kp_sync_clear_logs_descr: { ru: 'Очищает сохранённый debug-лог и строку последнего статуса. Console-лог браузера не хранится плагином.', en: 'Clears saved debug log and last status. Browser console log is not stored by the plugin.', uk: 'Очищає збережений debug-лог і статус.' },
      kp_sync_healthcheck: { ru: 'Проверить готовность плагина', en: 'Check plugin readiness', uk: 'Перевірити готовність плагіна' },
      kp_sync_healthcheck_descr: { ru: 'Проверяет Lampa API, токен KinoPUB и доступность read-only запроса. Полезно после загрузки на VPS/ТВ.', en: 'Checks Lampa API, KinoPUB token and a read-only request. Useful after VPS/TV deployment.', uk: 'Перевіряє Lampa API, токен KinoPUB і read-only запит.' },
      kp_sync_health_ok: { ru: 'Проверка готовности: OK', en: 'Readiness check: OK', uk: 'Перевірка готовності: OK' },
      kp_sync_health_no_token: { ru: 'Проверка: нет токена KinoPUB', en: 'Check: no KinoPUB token', uk: 'Перевірка: немає токена KinoPUB' },
      kp_sync_health_failed: { ru: 'Проверка готовности: ошибка', en: 'Readiness check: failed', uk: 'Перевірка готовності: помилка' },
      kp_sync_copy_report: { ru: 'Скопировать диагностический отчёт', en: 'Copy diagnostic report', uk: 'Скопіювати діагностичний звіт' },
      kp_sync_copy_report_descr: { ru: 'Собирает сведения о версии, настройках, модулях, кэше и debug-логе без токенов и копирует отчёт в буфер обмена.', en: 'Collects version, settings, modules, cache and debug log without tokens and copies the report to clipboard.', uk: 'Збирає дані діагностики без токенів і копіює звіт.' },
      kp_sync_report_title: { ru: 'Диагностика KinoPUB Sync', en: 'KinoPUB Sync diagnostics', uk: 'Діагностика KinoPUB Sync' },
      kp_sync_report_copied: { ru: 'Диагностический отчёт скопирован', en: 'Diagnostic report copied', uk: 'Діагностичний звіт скопійовано' },
      kp_sync_report_manual: { ru: 'Автокопирование недоступно. Выделите и скопируйте текст вручную.', en: 'Auto-copy is unavailable. Select and copy the text manually.', uk: 'Автокопіювання недоступне. Скопіюйте текст вручну.' },
      kp_sync_cache_cleared: { ru: 'Служебный кэш очищен', en: 'Service cache cleared', uk: 'Службовий кеш очищено' },
      kp_sync_logs_cleared: { ru: 'Логи и статус очищены', en: 'Logs and status cleared', uk: 'Логи і статус очищено' }
    });
  };

  C.addParam = function (name, type, def, values, titleKey, descrKey, onChange) {
    if (!Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;

    // Важно для Lampa: у параметра должно быть поле values даже для input/trigger.
    // В предыдущей версии пустая строка values: '' отбрасывалась как falsy, из-за чего меню
    // настроек падало на поле "Последний статус" со значением "—".
    var param = { name: name, type: type, 'default': def };
    if (typeof values !== 'undefined' && values !== null) param.values = values;
    else param.values = '';
    if (type === 'input' && typeof param.values === 'undefined') param.values = '';

    var field = { name: C.translate(titleKey), description: C.translate(descrKey) };
    var obj = { component: 'kp_sync', param: param, field: field };
    if (onChange) obj.onChange = onChange;
    Lampa.SettingsApi.addParam(obj);
  };

  C.injectSettingsSeparatorsCss = function () {
    if (document.getElementById('kp-sync-settings-separators-css')) return;
    var css = '.settings-param[data-name^="kp_sync_sep_"]{pointer-events:none;opacity:.95;margin-top:1.1em;margin-bottom:.25em;border-top:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.035);border-radius:.35em;}' +
      '.settings-param[data-name^="kp_sync_sep_"] .settings-param__name{font-weight:700;letter-spacing:.03em;text-transform:uppercase;opacity:.95;}' +
      '.settings-param[data-name^="kp_sync_sep_"] .settings-param__descr,.settings-param[data-name^="kp_sync_sep_"] .settings-param__description{opacity:.65;}' +
      '.settings-param[data-name^="kp_sync_sep_"] .settings-param__value{display:none!important;}';
    var style = document.createElement('style');
    style.id = 'kp-sync-settings-separators-css';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  };

  C.addSeparator = function (key) {
    // Lampa-плагины используют type: 'title' для визуальных заголовков внутри одного компонента.
    // values: '' оставляем явно, чтобы Settings UI не падал при отрисовке значения.
    C.addParam('kp_sync_sep_' + key, 'title', '', '', 'kp_sync_sep_' + key, 'kp_sync_sep_' + key + '_descr');
  };

  C.addSettings = function () {
    if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent || !Lampa.SettingsApi.addParam) { C.log('SettingsApi unavailable'); return; }
    var K = C.KEY;
    if (C.storageGet(K.historyLimit, '') === '') C.storageSet(K.historyLimit, '50');
    if (C.storageGet(K.apiOpLimit, '') === '') C.storageSet(K.apiOpLimit, C.opts.lite ? '50' : '100');
    if (C.storageGet(K.apiDelay, '') === '') C.storageSet(K.apiDelay, C.opts.lite ? '150' : '100');
    if (C.storageGet(K.identityLimit, '') === '') C.storageSet(K.identityLimit, C.opts.lite ? '500' : '1000');
    if (C.storageGet(K.cacheAutoClean, '') === '') C.storageSet(K.cacheAutoClean, true);
    if (C.storageGet(K.cacheMaxKb, '') === '') C.storageSet(K.cacheMaxKb, C.opts.lite ? '300' : '500');
    if (C.storageGet(K.cacheMaxAgeDays, '') === '') C.storageSet(K.cacheMaxAgeDays, '90');
    if (C.storageGet(K.debugLog, '') === '') C.storageSet(K.debugLog, false);
    if (C.storageGet(K.debugDeviceInfo, '') === '') C.storageSet(K.debugDeviceInfo, true);
    if (C.storageGet(K.privateReport, '') === '') C.storageSet(K.privateReport, true);
    if (C.storageGet(K.debugLogLimit, '') === '') C.storageSet(K.debugLogLimit, '50');
    if (!C.opts.lite) {
      if (C.storageGet(K.pushFolderTitle, '') === '') C.storageSet(K.pushFolderTitle, 'Lampa');
      if (C.storageGet(K.pushLimit, '') === '') C.storageSet(K.pushLimit, '100');
      if (C.storageGet(K.deleteTwoPhase, '') === '') C.storageSet(K.deleteTwoPhase, true);
      if (C.storageGet(K.deleteLimit, '') === '') C.storageSet(K.deleteLimit, '5');
      if (C.storageGet(K.deleteConfirm, '') === '') C.storageSet(K.deleteConfirm, true);
      if (C.storageGet(K.bookmarkConflict, '') === '') C.storageSet(K.bookmarkConflict, 'merge');
      if (C.storageGet(K.timelineConflict, '') === '') C.storageSet(K.timelineConflict, 'newest');
    }

    Lampa.SettingsApi.addComponent({ component: 'kp_sync', name: C.translate('kp_sync_component') + ' ' + (C.opts.lite ? 'Lite' : 'Standard'), icon: '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0-9 9h2a7 7 0 0 1 11.95-4.95L15 9h6V3l-2.62 2.62A8.97 8.97 0 0 0 12 3Zm7 9a7 7 0 0 1-11.95 4.95L9 15H3v6l2.62-2.62A9 9 0 0 0 21 12h-2Z"/></svg>' });
    C.injectSettingsSeparatorsCss();

    C.addSeparator('main');
    C.addParam('kp_sync_action_run', 'button', '', '', 'kp_sync_run', 'kp_sync_run_descr', function () { C.syncNow(false); });
    C.addParam('kp_sync_action_login', 'button', '', '', 'kp_sync_login', 'kp_sync_login_descr', function () { C.startDeviceLogin(); });
    C.addParam('kp_sync_action_logout', 'button', '', '', 'kp_sync_logout', 'kp_sync_logout_descr', function () { C.clearTokens(); C.noty(C.translate('kp_sync_tokens_cleared')); });

    C.addSeparator('import');
    C.addParam(K.syncBookmarks, 'trigger', true, null, 'kp_sync_bookmarks', 'kp_sync_bookmarks_descr');
    C.addParam(K.syncHistory, 'trigger', true, null, 'kp_sync_history', 'kp_sync_history_descr');
    C.addParam(K.syncTimeline, 'trigger', true, null, 'kp_sync_timeline', 'kp_sync_timeline_descr');
    C.addParam(K.syncCustomFolders, 'trigger', true, null, 'kp_sync_custom_folders', 'kp_sync_custom_folders_descr');
    C.addParam(K.historyLimit, 'select', '50', { '20': '20', '50': '50', '100': '100', '200': '200' }, 'kp_sync_history_limit', 'kp_sync_history_limit_descr');

    C.addSeparator('mapping');
    C.addParam(K.syncTmdbLookup, 'trigger', true, null, 'kp_sync_tmdb_lookup', 'kp_sync_tmdb_lookup_descr');
    C.addParam(K.identityEnabled, 'trigger', true, null, 'kp_sync_identity_enabled', 'kp_sync_identity_enabled_descr');
    C.addParam(K.identityStrict, 'trigger', true, null, 'kp_sync_identity_strict', 'kp_sync_identity_strict_descr');
    C.addParam(K.identityMinConfidence, 'select', '70', { '50': '50', '70': '70', '90': '90' }, 'kp_sync_identity_min_confidence', 'kp_sync_identity_min_confidence_descr');
    C.addParam(K.identityLimit, 'select', C.opts.lite ? '500' : '1000', { '200': '200', '500': '500', '1000': '1000', '2000': '2000' }, 'kp_sync_identity_limit', 'kp_sync_identity_limit_descr');
    if (!C.opts.lite) C.addParam(K.deepIntegration, 'trigger', false, null, 'kp_sync_deep_integration', 'kp_sync_deep_integration_descr', function () { if (C.getBool(K.deepIntegration, false)) C.loadModule('deep').then(function (m) { if (m && m.install) m.install(); }); });

    if (!C.opts.lite) {
      C.addSeparator('export');
      C.addParam(K.pushEnabled, 'trigger', false, null, 'kp_sync_push_enabled', 'kp_sync_push_enabled_descr');
      C.addParam(K.pushBookmarks, 'trigger', false, null, 'kp_sync_push_bookmarks', 'kp_sync_push_bookmarks_descr');
      C.addParam(K.pushTimeline, 'trigger', false, null, 'kp_sync_push_timeline', 'kp_sync_push_timeline_descr');
      C.addParam(K.pushResolve, 'trigger', false, null, 'kp_sync_push_resolve', 'kp_sync_push_resolve_descr');
      C.addParam(K.pushFolderTitle, 'input', 'Lampa', '', 'kp_sync_push_folder_title', 'kp_sync_push_folder_title_descr');
      C.addParam(K.pushLimit, 'select', '100', { '20': '20', '50': '50', '100': '100', '200': '200' }, 'kp_sync_push_limit', 'kp_sync_push_limit_descr');

      C.addSeparator('conflicts');
      C.addParam(K.bookmarkConflict, 'select', 'merge', { 'merge': 'Объединять безопасно', 'kinopub': 'KinoPUB главный', 'lampa_export': 'Lampa главная: только папка экспорта', 'lampa_full': 'Lampa главная: все синхронизированные папки' }, 'kp_sync_bookmark_conflict', 'kp_sync_bookmark_conflict_descr');
      C.addParam(K.timelineConflict, 'select', 'newest', { 'newest': 'Более дальний таймкод', 'no_rollback': 'Не откатывать', 'kinopub': 'KinoPUB главный', 'lampa': 'Lampa главная' }, 'kp_sync_timeline_conflict', 'kp_sync_timeline_conflict_descr');
      C.addParam(K.allowDeletes, 'trigger', false, null, 'kp_sync_allow_deletes', 'kp_sync_allow_deletes_descr');
      C.addParam(K.deleteTwoPhase, 'trigger', true, null, 'kp_sync_delete_two_phase', 'kp_sync_delete_two_phase_descr');
      C.addParam(K.deleteLimit, 'select', '5', { '1': '1', '3': '3', '5': '5', '10': '10', '20': '20', '50': '50' }, 'kp_sync_delete_limit', 'kp_sync_delete_limit_descr');
      C.addParam(K.deleteConfirm, 'trigger', true, null, 'kp_sync_delete_confirm', 'kp_sync_delete_confirm_descr');
      C.addParam(K.fullCleanup, 'trigger', false, null, 'kp_sync_full_cleanup', 'kp_sync_full_cleanup_descr');
    }

    C.addSeparator('auto');
    C.addParam(K.syncAuto, 'trigger', false, null, 'kp_sync_auto', 'kp_sync_auto_descr');
    C.addParam(K.syncInterval, 'select', '24', { '6': '6 часов', '12': '12 часов', '24': '24 часа', '72': '3 дня' }, 'kp_sync_interval', 'kp_sync_interval_descr');
    C.addParam(K.apiOpLimit, 'select', C.opts.lite ? '50' : '100', { '20': '20', '50': '50', '100': '100', '200': '200', '500': '500' }, 'kp_sync_api_op_limit', 'kp_sync_api_op_limit_descr');
    C.addParam(K.apiDelay, 'select', C.opts.lite ? '150' : '100', { '0': '0 мс', '100': '100 мс', '150': '150 мс', '250': '250 мс', '500': '500 мс' }, 'kp_sync_api_delay', 'kp_sync_api_delay_descr');

    C.addSeparator('cache');
    C.addParam(K.cacheAutoClean, 'trigger', true, null, 'kp_sync_cache_auto_clean', 'kp_sync_cache_auto_clean_descr');
    C.addParam(K.cacheMaxKb, 'select', C.opts.lite ? '300' : '500', { '100': '100 KB', '300': '300 KB', '500': '500 KB', '1000': '1 MB', '2000': '2 MB' }, 'kp_sync_cache_max_kb', 'kp_sync_cache_max_kb_descr');
    C.addParam(K.cacheMaxAgeDays, 'select', '90', { '0': 'Не чистить по возрасту', '30': '30 дней', '90': '90 дней', '180': '180 дней', '365': '1 год' }, 'kp_sync_cache_max_age_days', 'kp_sync_cache_max_age_days_descr');
    C.addParam(K.debugLog, 'trigger', false, null, 'kp_sync_debug_log', 'kp_sync_debug_log_descr');
    C.addParam(K.debugDeviceInfo, 'trigger', true, null, 'kp_sync_debug_device_info', 'kp_sync_debug_device_info_descr');
    C.addParam(K.privateReport, 'trigger', true, null, 'kp_sync_private_report', 'kp_sync_private_report_descr');
    C.addParam(K.debugLogLimit, 'select', '50', { '0': '0', '20': '20', '50': '50', '100': '100' }, 'kp_sync_debug_log_limit', 'kp_sync_debug_log_limit_descr');

    C.addSeparator('actions');
    if (!C.opts.lite) C.addParam('kp_sync_action_reset_snapshots', 'button', '', '', 'kp_sync_reset_snapshots', 'kp_sync_reset_snapshots_descr', function () { C.resetSnapshots(); });
    C.addParam('kp_sync_action_reset_identity', 'button', '', '', 'kp_sync_reset_identity', 'kp_sync_reset_identity_descr', function () { C.maybeLoadIdentity().then(function () { if (C.modules.identity && C.modules.identity.reset) C.modules.identity.reset(); }); });
    C.addParam('kp_sync_action_clear_cache', 'button', '', '', 'kp_sync_clear_cache', 'kp_sync_clear_cache_descr', function () { C.clearServiceCache(); });
    C.addParam('kp_sync_action_clear_logs', 'button', '', '', 'kp_sync_clear_logs', 'kp_sync_clear_logs_descr', function () { C.clearServiceLogs(); });
    C.addParam('kp_sync_action_healthcheck', 'button', '', '', 'kp_sync_healthcheck', 'kp_sync_healthcheck_descr', function () { C.healthCheck(); });
    C.addParam('kp_sync_action_copy_report', 'button', '', '', 'kp_sync_copy_report', 'kp_sync_copy_report_descr', function () { C.copyDiagnosticReport(); });
    C.addParam(K.lastStatus, 'input', C.storageGet(K.lastStatus, '') || '', '', 'kp_sync_status', 'kp_sync_status_descr');
  };

  C.start = function () {
    if (C._started) return;
    C._started = true;
    try { if (C.getBool(C.KEY.debugDeviceInfo, true)) C.log('device info', C.deviceSummary()); } catch (e) {}
    C.addLang();
    C.addSettings();
    C.autoCleanServiceData('startup');
    if (!C.opts.lite && C.getBool(C.KEY.deepIntegration, false)) C.loadModule('deep').then(function (m) { if (m && m.install) m.install(); });
    C.maybeAutoSync();
    window.KinoPubSync = {
      version: C.opts.version,
      edition: C.opts.edition,
      syncNow: C.syncNow,
      login: C.startDeviceLogin,
      clearTokens: C.clearTokens,
      status: function () { return C.storageGet(C.KEY.lastStatus, ''); },
      loadedModules: function () { var out = []; for (var k in C.modules) if (C.modules.hasOwnProperty(k)) out.push(k); return out; },
      diagnostics: function () { return { version: C.opts.version, edition: C.opts.edition, base: C.safeUrl(C.opts.base, true), buildChecksum: C.opts.buildChecksum || '', modules: C.opts.modules, loaded: this.loadedModules(), device: C.deviceSummary(), lastStatus: C.storageGet(C.KEY.lastStatus, ''), storage: C.storageStats() }; },
      deviceInfo: C.deviceInfo,
      deviceSummary: C.deviceSummary,
      storageStats: C.storageStats,
      clearServiceCache: C.clearServiceCache,
      clearServiceLogs: C.clearServiceLogs,
      serviceLog: function () { return C.storageGet(C.KEY.serviceLog, []); },
      diagnosticReport: C.diagnosticReport,
      collectDiagnostics: C.collectDiagnostics,
      copyDiagnosticReport: C.copyDiagnosticReport,
      healthCheck: C.healthCheck,
      loadModule: C.loadModule,
      resetSnapshots: C.resetSnapshots,
      identityMap: function () { return C.storageGet(C.KEY.identityMap, {}); },
      episodeMap: function () { return C.storageGet(C.KEY.episodeMap, {}); },
      timelineMap: function () { return C.storageGet(C.KEY.timelineMap, {}); }
    };
    if (C.getBool(C.KEY.debugLog, false)) {
      try { window.KinoPubSyncCore = C; } catch (e) {}
    } else {
      try { window.KinoPubSyncCore = { hidden: true, reason: 'Core API is hidden in release mode. Enable debug-log and restart Lampa to expose it for troubleshooting.' }; } catch (e2) {}
    }
    C.log('started v' + C.opts.version + ' ' + C.opts.edition, 'base=' + C.safeUrl(C.opts.base, true), 'checksum=' + (C.opts.buildChecksum || ''));
  };

  C.boot = function (opts) {
    C.opts = opts || C.opts;
    if (window.appready) C.start();
    else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) Lampa.Listener.follow('app', function (event) { if (!event || event.type === 'ready') C.start(); });
    else setTimeout(C.start, 3000);
  };
})();

/* KinoPUB Sync identity-map module. */
(function () {
  var Core = window.KinoPubSyncCore;
  if (!Core) return;
  Core.moduleFactories = Core.moduleFactories || {};
  Core.moduleFactories['identity'] = function (C) {
  if (!C || C.modules.identity) return;
  var K = C.KEY;

  function getMap() {
    var m = C.storageGet(K.identityMap, { byItem: {}, byTmdb: {}, byImdb: {}, recent: [] });
    if (!m || typeof m !== 'object') m = { byItem: {}, byTmdb: {}, byImdb: {}, recent: [] };
    m.byItem = m.byItem || {}; m.byTmdb = m.byTmdb || {}; m.byImdb = m.byImdb || {}; m.recent = m.recent || [];
    return m;
  }
  function setMap(m) { C.storageSet(K.identityMap, m); }
  function getEpisodeMap() { var m = C.storageGet(K.episodeMap, { byHash: {}, byItem: {}, recent: [] }); if (!m || typeof m !== 'object') m = { byHash: {}, byItem: {}, recent: [] }; m.byHash = m.byHash || {}; m.byItem = m.byItem || {}; m.recent = m.recent || []; return m; }
  function setEpisodeMap(m) { C.storageSet(K.episodeMap, m); }
  function tmdbKey(type, id) { return String(type || 'movie') + ':' + String(id || ''); }
  function touch(list, key) { for (var i = list.length - 1; i >= 0; i--) if (list[i] === key) list.splice(i, 1); list.unshift(key); }
  function trimObjectByRecent(obj, recent, limit) { while (recent.length > limit) { var k = recent.pop(); delete obj[k]; } }
  function trim(m) {
    var limit = C.getInt(K.identityLimit, C.opts.lite ? 500 : 1000);
    while (m.recent.length > limit) {
      var k = m.recent.pop();
      var old = m.byItem[k];
      if (old) {
        if (old.tmdb_id) delete m.byTmdb[tmdbKey(old.media_type, old.tmdb_id)];
        if (old.imdb_id) delete m.byImdb[String(old.imdb_id)];
      }
      delete m.byItem[k];
    }
    return m;
  }
  function itemId(item) { return item && (item.id || item.item || item.kp_id || item.kinopub_id) || 0; }
  function isSerialItem(item, card) {
    if (C.isSerialCard(card)) return true;
    return !!(item && (item.type === 'serial' || item.type === 'tv' || item.serial || item.seasons));
  }
  function hasEpisodeIdentity(season, video) {
    return season !== undefined && season !== null && season !== '' || video !== undefined && video !== null && video !== '';
  }

  function registerMapping(item, card, media, hash, opts) {
    var iid = String(itemId(item));
    if (!iid || iid === '0' || !card) return false;
    var type = card.media_type || (item && item.type === 'serial' ? 'tv' : 'movie');
    var confidence = parseInt(opts && opts.confidence || card.kp_sync_match_confidence || 80, 10) || 80;
    var source = opts && opts.source || card.kp_sync_match_source || 'sync';
    var entry = {
      item: parseInt(iid, 10) || iid,
      tmdb_id: card && !card.kp_sync_fallback ? card.id : 0,
      imdb_id: card.imdb_id || item.imdb || item.imdb_id || '',
      media_type: type,
      lampa_card_id: card.id || 0,
      title: C.titleFromCard(card) || item.title || item.name || '',
      source: source,
      confidence: confidence,
      ts: Date.now(),
      card: C.cleanCard(card)
    };
    var m = getMap();
    m.byItem[iid] = entry;
    touch(m.recent, iid);
    if (entry.tmdb_id) m.byTmdb[tmdbKey(type, entry.tmdb_id)] = iid;
    if (entry.imdb_id) m.byImdb[String(entry.imdb_id)] = iid;
    setMap(trim(m));
    if (media || hash) {
      var ms = media && media.season;
      var mv = media && (media.video || media.episode);
      if (hash || hasEpisodeIdentity(ms, mv)) registerEpisode(item, card, ms, mv, hash, media && media.time, media && media.duration);
    }
    return true;
  }

  function resolveCard(card) {
    if (!card) return null;
    var iid = card.kp_id || card.kinopub_id;
    if (iid) return { item: parseInt(iid, 10) || iid, source: 'card', confidence: 100 };
    var m = getMap(), type = card.media_type || (C.isSerialCard(card) ? 'tv' : 'movie');
    var min = C.getInt(K.identityMinConfidence, 70);
    var key = tmdbKey(type, card.id);
    if (m.byTmdb[key] && m.byItem[String(m.byTmdb[key])] && m.byItem[String(m.byTmdb[key])].confidence >= min) return m.byItem[String(m.byTmdb[key])];
    if (!C.getBool(K.identityStrict, true) && card.id) {
      var alt = type === 'tv' ? tmdbKey('movie', card.id) : tmdbKey('tv', card.id);
      if (m.byTmdb[alt] && m.byItem[String(m.byTmdb[alt])] && m.byItem[String(m.byTmdb[alt])].confidence >= min) return m.byItem[String(m.byTmdb[alt])];
    }
    if (card.imdb_id && m.byImdb[String(card.imdb_id)] && m.byItem[String(m.byImdb[String(card.imdb_id)])]) return m.byItem[String(m.byImdb[String(card.imdb_id)])];
    return null;
  }

  function registerEpisode(item, card, season, video, hash, time, duration) {
    var iid = String(itemId(item));
    if (!iid || iid === '0') return false;
    var s = parseInt(season, 10) || 0, v = parseInt(video, 10) || 0;
    var serial = isSerialItem(item, card);
    if (!serial && !v) v = 1;
    var hasEpisode = hasEpisodeIdentity(season, video);
    var entry = { item: parseInt(iid, 10) || iid, season: s, video: v, hash: hash || '', time: parseInt(time, 10) || 0, duration: parseInt(duration, 10) || 0, title: C.titleFromCard(card), media_type: serial ? 'tv' : 'movie', ts: Date.now() };

    // Для фильмов без season/video не создаём episodeMap вида item:0:0.
    // Такой фильм хранится в identityMap и, если есть hash, в timelineMap.
    var tm = C.storageGet(K.timelineMap, {});
    if (!tm || typeof tm !== 'object') tm = {};
    if (hash) tm[String(hash)] = entry;
    C.storageSet(K.timelineMap, tm);

    if (!serial && !hasEpisode) return true;

    // Для сериалов episodeMap создаём только когда известна конкретная серия.
    if (serial && !hasEpisode) return true;

    var e = getEpisodeMap();
    var key = iid + ':' + s + ':' + v;
    e.byItem[key] = entry;
    if (hash) e.byHash[String(hash)] = entry;
    touch(e.recent, key);

    var limit = C.getInt(K.identityLimit, C.opts.lite ? 500 : 1000);
    while (e.recent.length > limit) {
      var oldKey = e.recent.pop();
      var oldEntry = e.byItem[oldKey];
      if (oldEntry && oldEntry.hash && e.byHash[String(oldEntry.hash)] && String(e.byHash[String(oldEntry.hash)].item) === String(oldEntry.item)) delete e.byHash[String(oldEntry.hash)];
      delete e.byItem[oldKey];
    }
    C.storageSet(K.episodeMap, e);
    return true;
  }


  function reset() {
    C.storageSet(K.identityMap, { byItem: {}, byTmdb: {}, byImdb: {}, recent: [] });
    C.storageSet(K.episodeMap, { byHash: {}, byItem: {}, recent: [] });
    C.storageSet(K.timelineMap, {});
    C.noty(C.translate('kp_sync_identity_cleared'));
  }

  C.modules.identity = { getMap: getMap, getEpisodeMap: getEpisodeMap, registerMapping: registerMapping, registerEpisode: registerEpisode, resolveCard: resolveCard, reset: reset };
  C.log('identity module loaded');
  };
})();

/* KinoPUB Sync import module: KinoPUB -> Lampa. */
(function () {
  var Core = window.KinoPubSyncCore;
  if (!Core) return;
  Core.moduleFactories = Core.moduleFactories || {};
  Core.moduleFactories['importer'] = function (C) {
  if (!C || C.modules.importer) return;
  var K = C.KEY;

  function titleFromItem(item) { return item && (item.title || item.name || item.original_title || item.original_name || item.ru_title || item.en_title) || ''; }
  function itemIsSerial(item) { return item && (item.type === 'serial' || item.type === 'tv' || item.serial || item.seasons); }
  function yearFromItem(item) { var s = item && (item.year || item.premiered || item.released || item.release_date || item.first_air_date) || ''; return String(s).slice(0, 4); }
  function itemId(item) { return item && (item.id || item.item || item.kp_id || item.kinopub_id) || 0; }

  function itemToCard(item) {
    var id = itemId(item);
    var serial = itemIsSerial(item);
    var title = titleFromItem(item) || ('KinoPUB ' + id);
    return { id: id ? parseInt(id, 10) || id : Math.floor(Math.random() * 1000000000), media_type: serial ? 'tv' : 'movie', title: serial ? undefined : title, name: serial ? title : undefined, release_date: serial ? undefined : (yearFromItem(item) ? yearFromItem(item) + '-01-01' : undefined), first_air_date: serial ? (yearFromItem(item) ? yearFromItem(item) + '-01-01' : undefined) : undefined, poster_path: item.poster || item.posters && (item.posters.big || item.posters.medium || item.posters.small) || '', kp_id: id, kinopub_id: id, imdb_id: item.imdb || item.imdb_id || '', source: 'kp_sync', kp_sync_fallback: true, kp_sync_match_source: 'kinopub_import', kp_sync_match_confidence: 80 };
  }

  function resolveCard(item) {
    var card = itemToCard(item);
    if (!C.getBool(K.syncTmdbLookup, true) || !card.imdb_id || !Lampa.TMDB || !Lampa.TMDB.api || !Lampa.TMDB.key) return Promise.resolve(card);
    return new Promise(function (resolve) {
      try {
        var lang = (Lampa.Storage && Lampa.Storage.get) ? Lampa.Storage.get('language', 'ru') : 'ru';
        var url = 'find/' + encodeURIComponent(card.imdb_id) + '?api_key=' + encodeURIComponent(Lampa.TMDB.key()) + '&external_source=imdb_id&language=' + encodeURIComponent(lang || 'ru');
        C.request('GET', Lampa.TMDB.api(url), false, {}, 12000).then(function (json) {
          var list = C.asArray(json && (itemIsSerial(item) ? json.tv_results : json.movie_results));
          if (list && list[0]) {
            var found = list[0];
            found.media_type = itemIsSerial(item) ? 'tv' : 'movie';
            found.kp_id = card.kp_id; found.kinopub_id = card.kp_id; found.imdb_id = card.imdb_id; found.kp_sync_match_source = 'tmdb_imdb'; found.kp_sync_match_confidence = 95;
            resolve(found);
          } else resolve(card);
        }).catch(function () { resolve(card); });
      } catch (e) { resolve(card); }
    });
  }

  function addCardToBookmarks(card, folder, item, stats) {
    if (!card) return;
    C.addFavorite('book', card, 300);
    C.addFavorite(C.isSerialCard(card) ? 'book_tv' : 'book_movie', card, 300);
    if (C.getBool(K.syncCustomFolders, true) && folder) C.addCustomFavorite('KinoPUB: ' + (folder.title || folder.name || folder.id), card);
    if (C.modules.identity && C.modules.identity.registerMapping) C.modules.identity.registerMapping(item, card, null, null, { source: card.kp_sync_match_source || 'import', confidence: card.kp_sync_match_confidence || 80 });
    C.snapshotRemoteBookmark(item, folder, card);
    stats.bookmarkImported++;
  }

  function syncBookmarks(stats) {
    if (!C.getBool(K.syncBookmarks, true)) return Promise.resolve(stats);
    return C.apiGet('/bookmarks', {}).then(function (json) {
      var folders = C.asArray(json);
      stats.bookmarkFolders = folders.length;
      var maxOps = C.getInt(K.apiOpLimit, C.opts.lite ? 50 : 100);
      return C.eachLimit(folders, Math.min(folders.length, maxOps), function (folder) {
        var fid = folder && (folder.id || folder.folder || folder.bookmark_id);
        if (!fid) return;
        return C.apiGet('/bookmarks/' + encodeURIComponent(fid), {}).then(function (res) {
          var items = C.asArray(res);
          stats.bookmarkItems += items.length;
          return C.eachLimit(items, Math.min(items.length, maxOps), function (item) {
            return resolveCard(item).then(function (card) { addCardToBookmarks(card, folder, item, stats); });
          }, stats);
        }).catch(function (e) { stats.errors++; C.log('bookmark folder import failed', fid, e); });
      }, stats);
    }).then(function () { return stats; }).catch(function (e) { stats.errors++; C.log('bookmarks import failed', e); return stats; });
  }

  function syncHistory(stats) {
    if (!C.getBool(K.syncHistory, true) && !C.getBool(K.syncTimeline, true)) return Promise.resolve(stats);
    var limit = C.getInt(K.historyLimit, 50);
    var perpage = Math.min(Math.max(1, limit), 50);
    var list = [];
    function page(n) {
      if (list.length >= limit) return Promise.resolve(list);
      return C.apiGet('/history', { page: n, perpage: perpage }).then(function (json) {
        var part = C.asArray(json);
        for (var p = 0; p < part.length && list.length < limit; p++) list.push(part[p]);
        if (!part.length || part.length < perpage || list.length >= limit) return list;
        return page(n + 1);
      });
    }
    return page(1).then(function (rows) {
      return C.eachLimit(rows, rows.length, function (row) {
        var item = row.item || row;
        var media = row.media || row.video || {};
        return resolveCard(item).then(function (card) {
          if (C.getBool(K.syncHistory, true)) { C.addFavorite('history', card, 300); stats.historyImported++; }
          var time = row.time || media.time || row.current_time || 0;
          var duration = media.duration || row.duration || 0;
          if (C.getBool(K.syncTimeline, true) && time) {
            if (C.setTimeline(card, time, duration, item, media.season || row.season, media.video || media.episode || row.video || 1)) stats.timelineImported++;
          }
          if (C.modules.identity && C.modules.identity.registerMapping) C.modules.identity.registerMapping(item, card, media, null, { source: card.kp_sync_match_source || 'history', confidence: card.kp_sync_match_confidence || 80 });
        });
      }, stats);
    }).then(function () { return stats; }).catch(function (e) { stats.errors++; C.log('history import failed', e); return stats; });
  }

  function run(stats) { return syncBookmarks(stats).then(syncHistory); }
  C.modules.importer = { run: run, itemToCard: itemToCard, resolveCard: resolveCard };
  C.log('import module loaded');
  };
})();

  if (window.KinoPubSyncCore && window.KinoPubSyncCore.boot) {
    window.KinoPubSyncCore.boot({
      version: '0.5.11',
      edition: 'lite',
      lite: true,
      base: base,
      modules: {"identity": true, "importer": true},
      bundle: true,
      buildChecksum: '601b57ccbfa14d67e766010ae150e0ad319a1289f0e934ac3d64627ce084330b',
      buildChecksumMethod: 'sha256(kp-sync.js with checksum placeholder)'
    });
  }
})();
