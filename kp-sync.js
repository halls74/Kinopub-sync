(function () {
  'use strict';

  var VERSION = '0.0.6';
  var EDITION = 'alpha-readonly';
  var COMPONENT = 'kp_sync_alpha';
  var LOG = '[KinoPUB Sync 0.0.6]';
  var API_HOST = 'https://api.service-kp.com';
  var CLIENT_ID = 'xbmc';
  var CLIENT_SECRET = 'cgg3gtifu46urtfp2zp1nqtba0k2ezxh';
  var MAX_PAGES_PER_FOLDER = 200;
  var PER_PAGE = 50;
  var REPORT_SAMPLE_LIMIT = 12;
  var FALLBACK_MIN_RATIO = 0.8;

  var KEY = {
    token: 'kp_token',
    refresh: 'kp_refresh',
    lastStatus: 'kp_sync006_last_status',
    report: 'kp_sync006_bookmarks_report',
    tokenStatus: 'kp_sync006_token_status',
    cleanupReport: 'kp_sync006_lampa_cleanup_report'
  };

  if (window.KinoPubSync006 && window.KinoPubSync006.version === VERSION) return;

  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return String(Date.now()); }
  }

  function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }
  function isObject(v) { return v && typeof v === 'object' && !isArray(v); }

  function parseJson(v) {
    if (!v) return v;
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch (e) { return v; }
    }
    return v;
  }

  function redactSecrets(text) {
    text = String(text == null ? '' : text);
    text = text.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [REDACTED]');
    text = text.replace(/(access_token|refresh_token|id_token|kp_token|kp_refresh|token)=([^&\s]+)/gi, '$1=[REDACTED]');
    text = text.replace(/("(?:access_token|refresh_token|id_token|kp_token|kp_refresh|token)"\s*:\s*")[^"]+(")/gi, '$1[REDACTED]$2');
    return text;
  }

  function log() {
    try {
      var args = [LOG];
      for (var i = 0; i < arguments.length; i++) args.push(redactSecrets(arguments[i]));
      console.log.apply(console, args);
    } catch (e) {}
  }

  function lang(key) {
    var ru = {
      component: 'KinoPUB Sync 0.0.6',
      sep: '— Проверка и чтение KinoPUB —',
      sep_descr: 'Тестовая read-only сборка. Ничего не импортирует в Lampa и ничего не меняет в KinoPUB.',
      cleanup_menu: 'Очистка данных',
      cleanup_menu_descr: 'Открывает внутренний подраздел очистки данных этого плагина: старые закладки, история, продолжение просмотра и служебные карты. KinoPUB не меняется.',
      sep_cleanup: 'Очистка данных',
      sep_cleanup_descr: 'Внутренний подраздел для безопасной локальной очистки следов старого Sync: закладки, история, продолжение просмотра и служебные карты. KinoPUB не меняется.',
      status: 'Последний статус',
      status_descr: 'Краткий результат последнего действия плагина.',
      check_token: 'Проверить токен основного KinoPUB',
      check_token_descr: 'Проверяет, есть ли kp_token/kp_refresh от основного lampa_kinopub, и доступен ли API KinoPUB. Отдельную авторизацию не запускает.',
      read_bookmarks: 'Считать папки и закладки KinoPUB',
      read_bookmarks_descr: 'Читает все доступные папки и элементы закладок авторизованного аккаунта KinoPUB. Ничего не записывает в Lampa.',
      show_report: 'Показать краткий отчёт',
      show_report_descr: 'Открывает краткую сводку последнего чтения папок и закладок.',
      copy_report: 'Скопировать полный отчёт',
      copy_report_descr: 'Копирует JSON-отчёт по папкам/закладкам для анализа. Токены в отчёт не включаются.',
      clear_report: 'Очистить отчёт',
      clear_report_descr: 'Удаляет сохранённый отчёт и статус этой тестовой сборки. Закладки Lampa и токены KinoPUB не трогаются.',
      scan_bad_lampa: 'Найти старые данные Sync в Lampa',
      scan_bad_lampa_descr: 'Ищет локальные следы старого Sync: некорректные закладки, папки KinoPUB: ..., историю, продолжение просмотра и служебные карты. Ничего не удаляет.',
      show_cleanup: 'Показать отчёт очистки Lampa',
      show_cleanup_descr: 'Показывает, какие локальные записи Lampa будут затронуты при очистке.',
      copy_cleanup: 'Скопировать отчёт очистки Lampa',
      copy_cleanup_descr: 'Копирует JSON-отчёт по найденным локальным следам старого Sync: закладки, история, timeline и служебные карты.',
      clear_bad_lampa: 'Очистить найденные старые данные Sync',
      clear_bad_lampa_descr: 'Удаляет только найденные локальные следы старого Sync: закладки, историю, продолжение просмотра и служебные карты. Перед удалением показывает подтверждение.',
      no_token: 'Токен KinoPUB не найден. Сначала авторизуйтесь в основном KinoPUB-плагине.',
      token_ok: 'Токен найден, API доступен',
      token_refresh_ok: 'Токен обновлён через refresh_token, API доступен',
      token_bad: 'Токен найден, но API недоступен',
      reading: 'Читаю папки и закладки KinoPUB...',
      report_missing: 'Отчёт ещё не сформирован.',
      cleanup_missing: 'Отчёт очистки ещё не сформирован.',
      report_cleared: 'Отчёт очищен.',
      copied: 'Отчёт скопирован.',
      copy_failed: 'Не удалось скопировать автоматически. Открыл текст отчёта.',
      done: 'Чтение завершено',
      cleanup_scanned: 'Анализ данных Lampa завершён',
      cleanup_done: 'Очистка данных Lampa завершена',
      cleanup_cancelled: 'Очистка отменена'
    };
    return ru[key] || key;
  }

  function storageGet(key, def) {
    try { if (window.Lampa && Lampa.Storage && Lampa.Storage.get) return Lampa.Storage.get(key, def); } catch (e) {}
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return def;
      return JSON.parse(raw);
    } catch (e2) { return def; }
  }

  function storageSet(key, value) {
    try { if (window.Lampa && Lampa.Storage && Lampa.Storage.set) { Lampa.Storage.set(key, value); return; } } catch (e) {}
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e2) {}
  }

  function storageRemove(key) {
    try { if (window.Lampa && Lampa.Storage && Lampa.Storage.set) { Lampa.Storage.set(key, ''); return; } } catch (e) {}
    try { localStorage.removeItem(key); } catch (e2) {}
  }

  function getInt(key, def) {
    var v = storageGet(key, def);
    var n = parseInt(v, 10);
    return isNaN(n) ? def : n;
  }

  function setStatus(text) {
    text = String(text || '');
    storageSet(KEY.lastStatus, text);
    log(text);
  }

  function noty(text) {
    try { if (window.Lampa && Lampa.Noty && Lampa.Noty.show) { Lampa.Noty.show(String(text)); return; } } catch (e) {}
    try { if (window.Lampa && Lampa.Noty) { Lampa.Noty(String(text)); return; } } catch (e2) {}
    log(text);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function showText(title, text) {
    text = String(text || '');
    try {
      if (window.Lampa && Lampa.Modal && Lampa.Modal.open) {
        Lampa.Modal.open({
          title: title,
          html: '<div style="white-space:pre-wrap;max-height:70vh;overflow:auto;font-size:.9em;line-height:1.35">' + escapeHtml(text) + '</div>',
          size: 'large'
        });
        return;
      }
    } catch (e) {}
    try { alert(title + '\n\n' + text); } catch (e2) {}
  }

  function confirmText(text) {
    try { return window.confirm(String(text || '')); } catch (e) { return false; }
  }

  function copyText(text) {
    text = String(text || '');
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area;
      try {
        area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.focus();
        area.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(area);
        if (ok) resolve(true); else reject(new Error('copy failed'));
      } catch (e) {
        try { if (area && area.parentNode) area.parentNode.removeChild(area); } catch (e2) {}
        reject(e);
      }
    });
  }

  function encodeParams(obj) {
    var out = [];
    for (var k in obj) if (obj.hasOwnProperty(k) && obj[k] !== undefined && obj[k] !== null) out.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(obj[k])));
    return out.join('&');
  }

  function addUrlParams(url, params) {
    var qs = encodeParams(params || {});
    if (!qs) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + qs;
  }

  function request(method, url, body, headers, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var net;
      try { net = new Lampa.Reguest(); } catch (e) { reject({ status: 'no_reguest', error: String(e && e.message || e) }); return; }
      try { if (net.timeout) net.timeout(timeoutMs || 25000); } catch (e2) {}
      try {
        net.silent(url, function (json) { resolve(parseJson(json)); }, function (xhr, status) {
          reject({ xhr: xhr || {}, status: status || 'error', http: xhr && xhr.status });
        }, method === 'POST' ? (body || '') : false, { headers: headers || {} });
      } catch (e3) { reject({ status: 'request_exception', error: String(e3 && e3.message || e3) }); }
    });
  }

  function tokenAccess() { return storageGet(KEY.token, '') || ''; }
  function tokenRefresh() { return storageGet(KEY.refresh, '') || ''; }
  function setTokens(access, refresh) { if (access) storageSet(KEY.token, access); if (refresh) storageSet(KEY.refresh, refresh); }

  function refreshToken() {
    var rt = tokenRefresh();
    if (!rt) return Promise.reject({ status: 'no_refresh_token' });
    return request('POST', API_HOST + '/oauth2/token', encodeParams({ grant_type: 'refresh_token', client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: rt }), { 'Content-Type': 'application/x-www-form-urlencoded' }, 20000).then(function (json) {
      if (json && json.access_token) { setTokens(json.access_token, json.refresh_token); return json; }
      return Promise.reject({ status: 'bad_refresh_response', body: json });
    });
  }

  function apiGet(path, params, retried) {
    var t = tokenAccess();
    if (!t) return Promise.reject({ status: 401, reason: 'no_token' });
    return request('GET', addUrlParams(API_HOST + '/v1' + path, params || {}), false, { 'Authorization': 'Bearer ' + t }, 30000).catch(function (err) {
      var http = err && (err.http || (err.xhr && err.xhr.status));
      if (http === 401 && !retried && tokenRefresh()) return refreshToken().then(function () { return apiGet(path, params, true); });
      return Promise.reject(err);
    });
  }

  function asArray(json) {
    json = parseJson(json);
    if (!json) return [];
    if (isArray(json)) return json;
    if (isArray(json.items)) return json.items;
    if (isArray(json.bookmarks)) return json.bookmarks;
    if (isArray(json.folders)) return json.folders;
    if (isArray(json.data)) return json.data;
    if (isArray(json.results)) return json.results;
    return [];
  }

  function itemId(item) {
    if (!item) return '';
    if (item.id != null) return String(item.id);
    if (item.item_id != null) return String(item.item_id);
    if (item.kinopub_id != null) return String(item.kinopub_id);
    if (item.item && item.item.id != null) return String(item.item.id);
    return '';
  }

  function firstValue(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    }
    return '';
  }

  function externalValue(item, keys) {
    var v = firstValue(item, keys);
    if (v) return v;
    var ext = item && (item.externals || item.external_ids || item.external || item.ids);
    if (ext) v = firstValue(ext, keys);
    return v || '';
  }

  function normalizeContentKind(type, subtype) {
    var raw = String(type || '').toLowerCase();
    var sub = String(subtype || '').toLowerCase();
    if (raw === 'movie' || raw === 'documovie') return 'movie';
    if (raw === 'serial' || raw === 'docuserial' || raw === 'tvshow' || raw === 'show' || raw === 'series' || raw === 'tv' || raw === 'anime') return 'tv';
    if (sub === 'movie') return 'movie';
    if (sub === 'serial' || sub === 'tv' || sub === 'series') return 'tv';
    return raw || 'unknown';
  }

  function normalizeItem(item, folder, sourceIndex) {
    item = item || {};
    var id = itemId(item);
    var title = firstValue(item, ['title', 'name', 'ru_title', 'original_title', 'original_name', 'imdb_title']);
    var type = firstValue(item, ['type', 'media_type', 'kind', 'category']);
    var subtype = firstValue(item, ['subtype', 'sub_type']);
    var year = firstValue(item, ['year', 'release_year', 'released', 'premiered']);
    return {
      id: id,
      title: String(title || ''),
      type: String(type || ''),
      subtype: String(subtype || ''),
      normalized_kind: normalizeContentKind(type, subtype),
      year: String(year || ''),
      imdb_id: String(externalValue(item, ['imdb', 'imdb_id', 'imdbid']) || ''),
      tmdb_id: String(externalValue(item, ['tmdb', 'tmdb_id', 'tmdbid']) || ''),
      kinopoisk_id: String(externalValue(item, ['kinopoisk', 'kinopoisk_id', 'kp_id', 'kp']) || ''),
      folder_id: folder ? String(folder.id) : '',
      folder_title: folder ? String(folder.title || '') : '',
      source_index: sourceIndex || 0,
      raw_keys: item && typeof item === 'object' ? Object.keys(item).sort() : []
    };
  }

  function sanitizeRawSample(item) {
    item = parseJson(item) || {};
    var out = {};
    var keys = Object.keys(item).sort();
    for (var i = 0; i < keys.length && i < 80; i++) {
      var k = keys[i], v = item[k];
      if (/token|secret|password/i.test(k)) out[k] = '[REDACTED]';
      else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v;
      else if (isArray(v)) out[k] = '[Array:' + v.length + ']';
      else if (typeof v === 'object') out[k] = '[Object keys:' + Object.keys(v).slice(0, 20).join(',') + ']';
    }
    return out;
  }

  function errorSummary(err) {
    var http = err && (err.http || (err.xhr && err.xhr.status));
    var status = err && err.status;
    var msg = '';
    try { msg = err && err.xhr && (err.xhr.responseText || err.xhr.statusText); } catch (e) {}
    if (!msg && err && err.error) msg = err.error;
    if (!msg && status) msg = status;
    if (!msg && http) msg = 'HTTP ' + http;
    if (!msg) msg = 'network/error';
    return { http: http || 0, status: status || '', message: redactSecrets(msg).slice(0, 500) };
  }

  function checkToken() {
    var access = tokenAccess();
    var refresh = tokenRefresh();
    var base = { checkedAt: nowIso(), accessTokenPresent: !!access, refreshTokenPresent: !!refresh, verified: false, refreshed: false, error: null };
    if (!access) { storageSet(KEY.tokenStatus, base); setStatus(lang('no_token')); noty(lang('no_token')); return Promise.resolve(base); }
    return apiGet('/bookmarks', {}).then(function (json) {
      base.verified = true; base.foldersCount = asArray(json).length; storageSet(KEY.tokenStatus, base); setStatus(lang('token_ok') + '. Папок: ' + base.foldersCount); noty(lang('token_ok')); return base;
    }).catch(function (err) {
      var http = err && (err.http || (err.xhr && err.xhr.status));
      if (http === 401 && refresh) return refreshToken().then(function () {
        base.refreshed = true;
        return apiGet('/bookmarks', {}).then(function (json) { base.verified = true; base.foldersCount = asArray(json).length; storageSet(KEY.tokenStatus, base); setStatus(lang('token_refresh_ok') + '. Папок: ' + base.foldersCount); noty(lang('token_refresh_ok')); return base; });
      }).catch(function (err2) { base.error = errorSummary(err2); storageSet(KEY.tokenStatus, base); setStatus(lang('token_bad') + ': ' + base.error.message); noty(lang('token_bad')); return base; });
      base.error = errorSummary(err); storageSet(KEY.tokenStatus, base); setStatus(lang('token_bad') + ': ' + base.error.message); noty(lang('token_bad')); return base;
    });
  }

  function repeatedTailRowsFromAttempt(attempt) {
    var trace = attempt && attempt.pageTrace || [];
    if (!trace.length) return 0;
    var last = trace[trace.length - 1] || {};
    if (last.continueReason === 'stop_no_new_unique_items' && (last.newUniqueItems || 0) === 0) return last.itemsReturned || 0;
    return 0;
  }

  function acceptedRowsFromAttempt(attempt) {
    attempt = attempt || {};
    var raw = attempt.rawRowsFetched || 0;
    var repeated = repeatedTailRowsFromAttempt(attempt);
    return Math.max(0, raw - repeated);
  }

  function folderId(folder) { return folder && folder.id != null ? String(folder.id) : ''; }
  function folderTitle(folder) { return String((folder && (folder.title || folder.name)) || 'Без названия'); }

  function strategyList(fid) {
    return [
      makeStrategy('path_page_perpage_50', '/bookmarks/' + encodeURIComponent(fid), function (page) { return { page: page, perpage: PER_PAGE }; }, PER_PAGE),
      makeStrategy('view_folder_page_perpage_50', '/bookmarks/view', function (page) { return { folder: fid, page: page, perpage: PER_PAGE }; }, PER_PAGE),
      makeStrategy('path_page_limit_50', '/bookmarks/' + encodeURIComponent(fid), function (page) { return { page: page, limit: PER_PAGE }; }, PER_PAGE)
    ];
  }

  function makeStrategy(name, path, paramsBuilder, requestedPerPage) { return { name: name, path: path, paramsBuilder: paramsBuilder, requestedPerPage: requestedPerPage || PER_PAGE }; }

  function readFolderAttempt(folder, strategy) {
    var fid = folderId(folder), ftitle = folderTitle(folder), expected = Number(folder && folder.count) || 0;
    var requestedPerPage = Number(strategy.requestedPerPage || PER_PAGE) || PER_PAGE;
    var attempt = { strategy: strategy.name, expectedRows: expected, requestedPerPage: requestedPerPage, inferredPageSize: 0, pagesRequested: 0, rawRowsFetched: 0, uniqueItems: 0, duplicateRows: 0, stoppedReason: '', error: null, pageTrace: [], rows: [], seen: {}, noNewPages: 0 };
    var page = 1;
    function readNext() {
      if (page > MAX_PAGES_PER_FOLDER) { attempt.stoppedReason = 'max_pages_guard'; return Promise.resolve(attempt); }
      attempt.pagesRequested++;
      return apiGet(strategy.path, strategy.paramsBuilder(page)).then(function (json) {
        var items = asArray(json), newUnique = 0, duplicateRows = 0, firstId = '', lastId = '', continueReason = '';
        if (!attempt.inferredPageSize && items.length) attempt.inferredPageSize = items.length;
        for (var i = 0; i < items.length; i++) {
          var rawId = itemId(items[i]) || ('no_id:' + fid + ':' + strategy.name + ':' + page + ':' + i);
          if (!firstId) firstId = rawId;
          lastId = rawId;
          var norm = normalizeItem(items[i], { id: fid, title: ftitle }, attempt.rawRowsFetched + 1);
          if (!norm.id) norm.id = rawId;
          attempt.rows.push({ norm: norm, raw: items[i] });
          attempt.rawRowsFetched++;
          if (!attempt.seen[norm.id]) { attempt.seen[norm.id] = true; attempt.uniqueItems++; newUnique++; }
          else { attempt.duplicateRows++; duplicateRows++; }
        }

        if (!items.length) {
          attempt.stoppedReason = page === 1 ? 'empty_folder' : 'empty_page';
          continueReason = 'stop_empty_page';
          attempt.pageTrace.push({ strategy: strategy.name, page: page, requestedPerPage: requestedPerPage, inferredPageSize: attempt.inferredPageSize || 0, itemsReturned: items.length, newUniqueItems: newUnique, duplicateRows: duplicateRows, rawRowsFetchedTotal: attempt.rawRowsFetched, firstId: firstId, lastId: lastId, continueReason: continueReason });
          return attempt;
        }

        if (expected && attempt.rawRowsFetched >= expected) {
          attempt.stoppedReason = 'reported_raw_count_reached';
          continueReason = 'stop_reported_count_reached';
          attempt.pageTrace.push({ strategy: strategy.name, page: page, requestedPerPage: requestedPerPage, inferredPageSize: attempt.inferredPageSize || items.length, itemsReturned: items.length, newUniqueItems: newUnique, duplicateRows: duplicateRows, rawRowsFetchedTotal: attempt.rawRowsFetched, firstId: firstId, lastId: lastId, continueReason: continueReason });
          return attempt;
        }

        if (page > 1 && newUnique === 0) attempt.noNewPages++;
        else attempt.noNewPages = 0;
        if (attempt.noNewPages >= 1) {
          attempt.stoppedReason = 'no_new_items_page_maybe_ignored';
          continueReason = 'stop_no_new_unique_items';
          attempt.pageTrace.push({ strategy: strategy.name, page: page, requestedPerPage: requestedPerPage, inferredPageSize: attempt.inferredPageSize || items.length, itemsReturned: items.length, newUniqueItems: newUnique, duplicateRows: duplicateRows, rawRowsFetchedTotal: attempt.rawRowsFetched, firstId: firstId, lastId: lastId, continueReason: continueReason });
          return attempt;
        }

        if (!expected && items.length < requestedPerPage) {
          attempt.stoppedReason = 'short_page_no_reported_count';
          continueReason = 'stop_short_page_without_reported_count';
          attempt.pageTrace.push({ strategy: strategy.name, page: page, requestedPerPage: requestedPerPage, inferredPageSize: attempt.inferredPageSize || items.length, itemsReturned: items.length, newUniqueItems: newUnique, duplicateRows: duplicateRows, rawRowsFetchedTotal: attempt.rawRowsFetched, firstId: firstId, lastId: lastId, continueReason: continueReason });
          return attempt;
        }

        continueReason = expected ? 'continue_until_reported_count_or_empty_page' : 'continue_until_short_or_empty_page';
        attempt.pageTrace.push({ strategy: strategy.name, page: page, requestedPerPage: requestedPerPage, inferredPageSize: attempt.inferredPageSize || items.length, itemsReturned: items.length, newUniqueItems: newUnique, duplicateRows: duplicateRows, rawRowsFetchedTotal: attempt.rawRowsFetched, firstId: firstId, lastId: lastId, continueReason: continueReason });
        page++;
        return readNext();
      }).catch(function (err) { attempt.error = errorSummary(err); attempt.stoppedReason = 'error'; return attempt; });
    }
    return readNext().then(function (a) { delete a.seen; delete a.noNewPages; return a; });
  }

  function betterAttempt(a, b) {
    if (!a) return b;
    if (!b) return a;
    if ((b.rawRowsFetched || 0) > (a.rawRowsFetched || 0)) return b;
    if ((b.rawRowsFetched || 0) === (a.rawRowsFetched || 0) && (b.uniqueItems || 0) > (a.uniqueItems || 0)) return b;
    if (a.error && !b.error) return b;
    return a;
  }

  function readFolder(folder, report) {
    var fid = folderId(folder), ftitle = folderTitle(folder), expected = Number(folder && folder.count) || 0;
    var strategies = strategyList(fid), attempts = [], best = null;
    var chain = Promise.resolve();
    for (var si = 0; si < strategies.length; si++) {
      (function (strategy, index) {
        chain = chain.then(function () {
          if (index > 0 && best && !best.error) {
            if (expected && best.rawRowsFetched >= Math.max(1, Math.floor(expected * FALLBACK_MIN_RATIO))) return null;
            if (!expected && best.rawRowsFetched > 0) return null;
          }
          return readFolderAttempt(folder, strategy).then(function (attempt) { attempts.push(attempt); best = betterAttempt(best, attempt); });
        });
      })(strategies[si], si);
    }
    return chain.then(function () {
      best = best || { strategy: '', pagesRequested: 0, rawRowsFetched: 0, uniqueItems: 0, duplicateRows: 0, stoppedReason: 'no_attempt', error: null, rows: [] };
      var folderReport = {
        id: fid,
        title: ftitle,
        countReported: expected,
        selectedStrategy: best.strategy,
        requestedPerPage: best.requestedPerPage || PER_PAGE,
        inferredPageSize: best.inferredPageSize || 0,
        pagesRequested: best.pagesRequested,
        rawRowsFetched: best.rawRowsFetched,
        itemsFetched: best.rawRowsFetched,
        acceptedRawRows: acceptedRowsFromAttempt(best),
        repeatedTailRows: repeatedTailRowsFromAttempt(best),
        uniqueItems: best.uniqueItems,
        duplicateRows: best.duplicateRows,
        missingRawByCount: expected && best.rawRowsFetched < expected ? expected - best.rawRowsFetched : 0,
        missingAcceptedByCount: expected && acceptedRowsFromAttempt(best) < expected ? expected - acceptedRowsFromAttempt(best) : 0,
        extraRawOverCount: expected && best.rawRowsFetched > expected ? best.rawRowsFetched - expected : 0,
        stoppedReason: best.stoppedReason,
        error: best.error,
        attempts: [],
        pageTrace: best.pageTrace || []
      };
      for (var ai = 0; ai < attempts.length; ai++) folderReport.attempts.push({ strategy: attempts[ai].strategy, requestedPerPage: attempts[ai].requestedPerPage || PER_PAGE, inferredPageSize: attempts[ai].inferredPageSize || 0, pagesRequested: attempts[ai].pagesRequested, rawRowsFetched: attempts[ai].rawRowsFetched, uniqueItems: attempts[ai].uniqueItems, duplicateRows: attempts[ai].duplicateRows, stoppedReason: attempts[ai].stoppedReason, error: attempts[ai].error });

      var seenInFolder = {};
      for (var r = 0; r < best.rows.length; r++) {
        var norm = best.rows[r].norm;
        if (!seenInFolder[norm.id]) {
          seenInFolder[norm.id] = true;
          report.catalog.push(norm);
          if (!report._globalItems[norm.id]) report._globalItems[norm.id] = { id: norm.id, title: norm.title, type: norm.type, subtype: norm.subtype, normalized_kind: norm.normalized_kind, year: norm.year, imdb_id: norm.imdb_id, kinopoisk_id: norm.kinopoisk_id, tmdb_id: norm.tmdb_id, folders: [] };
          report._globalItems[norm.id].folders.push({ id: fid, title: ftitle });
          addStats(report, norm);
        }
        if (report.rawSamples.length < REPORT_SAMPLE_LIMIT) report.rawSamples.push({ folder_id: fid, folder_title: ftitle, item: sanitizeRawSample(best.rows[r].raw) });
      }
      if (folderReport.repeatedTailRows) report.warnings.push('Папка “' + ftitle + '”: API начал повторять последнюю страницу. Принято неповторных строк ' + folderReport.acceptedRawRows + ' из ' + expected + ', повтор хвоста: ' + folderReport.repeatedTailRows + '.');
      if (folderReport.missingRawByCount && !folderReport.repeatedTailRows) report.warnings.push('Папка “' + ftitle + '”: заявлено ' + expected + ', сырых строк получено ' + best.rawRowsFetched + ', не хватает ' + folderReport.missingRawByCount + '.');
      if (folderReport.missingAcceptedByCount && folderReport.repeatedTailRows) report.warnings.push('Папка “' + ftitle + '”: по неповторным страницам не хватает ' + folderReport.missingAcceptedByCount + ' строк. Это может быть ограничение/рассинхрон API или скрытые/битые записи.');
      if (folderReport.duplicateRows) report.warnings.push('Папка “' + ftitle + '”: найдено повторяющихся строк item id: ' + folderReport.duplicateRows + '. Это не обязательно ошибка, но важно для будущего импорта.');
      return folderReport;
    });
  }

  function inc(obj, key, n) { key = key || 'unknown'; obj[key] = (obj[key] || 0) + (n || 1); }

  function addMissingSample(arr, norm) {
    if (arr.length >= 50) return;
    arr.push({ id: norm.id, title: norm.title, type: norm.type, subtype: norm.subtype, normalized_kind: norm.normalized_kind, year: norm.year, folder_id: norm.folder_id, folder_title: norm.folder_title });
  }

  function addStats(report, norm) {
    inc(report.stats.typeStats, norm.type || 'unknown', 1);
    inc(report.stats.subtypeStats, norm.subtype || 'empty', 1);
    inc(report.stats.normalizedKindStats, norm.normalized_kind || 'unknown', 1);
    if (norm.imdb_id) report.stats.withImdb++; else { report.stats.withoutImdb++; addMissingSample(report.stats.missingImdbSamples, norm); }
    if (norm.kinopoisk_id) report.stats.withKinopoisk++; else { report.stats.withoutKinopoisk++; addMissingSample(report.stats.missingKinopoiskSamples, norm); }
    if (norm.tmdb_id) report.stats.withTmdb++; else report.stats.withoutTmdb++;
    var known = { movie: true, documovie: true, serial: true, docuserial: true, tvshow: true, show: true, series: true, tv: true, anime: true };
    var t = String(norm.type || '').toLowerCase();
    if (!known[t] && !report.stats.unknownRawTypes[t || 'unknown']) report.stats.unknownRawTypes[t || 'unknown'] = 1;
    else if (!known[t]) report.stats.unknownRawTypes[t || 'unknown']++;
  }

  function buildReportSummary(report) {
    var lines = [];
    lines.push('KinoPUB Sync v' + VERSION + ' — отчёт чтения закладок');
    lines.push('Дата: ' + report.generatedAt);
    lines.push('Папок: ' + report.totals.folders);
    lines.push('Элементов по счётчикам папок: ' + report.totals.reportedRows);
    lines.push('Сырых строк получено: ' + report.totals.rawRowsFetched);
    lines.push('Принято неповторных строк: ' + (report.totals.acceptedRawRows || report.totals.rawRowsFetched));
    lines.push('Повтор хвоста страниц: ' + (report.totals.repeatedTailRows || 0));
    lines.push('Уникальных строк внутри папок: ' + report.totals.uniqueRowsInFolders);
    lines.push('Уникальных KinoPUB item id глобально: ' + report.totals.uniqueGlobalItems);
    lines.push('Папок с ошибками: ' + report.totals.folderErrors);
    lines.push('Папок с недочётом raw-count: ' + report.totals.foldersWithMissingRawCount);
    lines.push('Повторяющихся строк item id в папках: ' + report.totals.duplicateRowsInFolders);
    lines.push('');
    lines.push('Типы контента: ' + JSON.stringify(report.stats.typeStats));
    lines.push('Нормализованные типы: ' + JSON.stringify(report.stats.normalizedKindStats));
    lines.push('IMDb есть/нет: ' + report.stats.withImdb + ' / ' + report.stats.withoutImdb);
    lines.push('Kinopoisk есть/нет: ' + report.stats.withKinopoisk + ' / ' + report.stats.withoutKinopoisk);
    lines.push('TMDB есть/нет: ' + report.stats.withTmdb + ' / ' + report.stats.withoutTmdb);
    lines.push('');
    if (report.warnings && report.warnings.length) {
      lines.push('Предупреждения:');
      for (var i = 0; i < report.warnings.length && i < 12; i++) lines.push('- ' + report.warnings[i]);
      if (report.warnings.length > 12) lines.push('- ... ещё ' + (report.warnings.length - 12));
      lines.push('');
    }
    lines.push('Важно: v0.0.6 ничего не импортирует в Lampa и ничего не меняет в KinoPUB. Очистка данных Lampa выполняется только через отдельный внутренний подраздел и подтверждение.');
    return lines.join('\n');
  }

  function readBookmarks() {
    if (!tokenAccess()) { setStatus(lang('no_token')); noty(lang('no_token')); return Promise.resolve(false); }
    noty(lang('reading'));
    setStatus(lang('reading'));
    var report = {
      version: VERSION,
      edition: EDITION,
      generatedAt: nowIso(),
      source: 'KinoPUB API bookmarks read-only audit',
      warnings: [],
      token: { accessTokenPresent: !!tokenAccess(), refreshTokenPresent: !!tokenRefresh(), tokensIncluded: false },
      api: { host: API_HOST, endpoints: ['/v1/bookmarks', '/v1/bookmarks/<folder_id>', '/v1/bookmarks/view?folder=<folder_id> fallback only if main read is incomplete', 'pagination: page + perpage=50'] },
      folders: [],
      catalog: [],
      rawSamples: [],
      stats: { typeStats: {}, subtypeStats: {}, normalizedKindStats: {}, unknownRawTypes: {}, withImdb: 0, withoutImdb: 0, withKinopoisk: 0, withoutKinopoisk: 0, withTmdb: 0, withoutTmdb: 0, missingImdbSamples: [], missingKinopoiskSamples: [] },
      totals: { folders: 0, reportedRows: 0, rawRowsFetched: 0, acceptedRawRows: 0, repeatedTailRows: 0, uniqueRowsInFolders: 0, uniqueGlobalItems: 0, folderErrors: 0, foldersWithMissingRawCount: 0, foldersWithMissingAcceptedCount: 0, duplicateRowsInFolders: 0 },
      _globalItems: {}
    };
    return apiGet('/bookmarks', {}).then(function (json) {
      var folders = asArray(json);
      report.totals.folders = folders.length;
      var chain = Promise.resolve();
      for (var i = 0; i < folders.length; i++) (function (folder) { chain = chain.then(function () { return readFolder(folder, report).then(function (fr) { report.folders.push(fr); }); }); })(folders[i]);
      return chain;
    }).then(function () {
      var uniqueCount = 0;
      for (var k in report._globalItems) if (report._globalItems.hasOwnProperty(k)) uniqueCount++;
      report.totals.uniqueGlobalItems = uniqueCount;
      for (var i = 0; i < report.folders.length; i++) {
        report.totals.reportedRows += report.folders[i].countReported || 0;
        report.totals.rawRowsFetched += report.folders[i].rawRowsFetched || 0;
        report.totals.acceptedRawRows += report.folders[i].acceptedRawRows || report.folders[i].rawRowsFetched || 0;
        report.totals.repeatedTailRows += report.folders[i].repeatedTailRows || 0;
        report.totals.uniqueRowsInFolders += report.folders[i].uniqueItems || 0;
        report.totals.duplicateRowsInFolders += report.folders[i].duplicateRows || 0;
        if (report.folders[i].error) report.totals.folderErrors++;
        if (report.folders[i].missingRawByCount) report.totals.foldersWithMissingRawCount++;
        if (report.folders[i].missingAcceptedByCount) report.totals.foldersWithMissingAcceptedCount++;
      }
      report.uniqueItems = report._globalItems;
      delete report._globalItems;
      if (!report.warnings.length) report.warnings.push('Критичных предупреждений нет. Проверьте totals и pageTrace для больших папок.');
      report.summaryText = buildReportSummary(report);
      storageSet(KEY.report, report);
      setStatus(lang('done') + ': папок ' + report.totals.folders + ', raw ' + report.totals.rawRowsFetched + '/' + report.totals.reportedRows + ', уникальных ' + report.totals.uniqueGlobalItems + ', ошибок ' + report.totals.folderErrors);
      noty(lang('done'));
      return report;
    }).catch(function (err) {
      report.error = errorSummary(err);
      storageSet(KEY.report, report);
      setStatus('Ошибка чтения KinoPUB: ' + report.error.message);
      noty('Ошибка чтения KinoPUB');
      return report;
    });
  }

  function getReport() { return storageGet(KEY.report, null); }
  function reportText() { var r = getReport(); return r ? JSON.stringify(r, null, 2) : lang('report_missing'); }
  function showReport() { var r = getReport(); if (!r) { noty(lang('report_missing')); return; } showText('KinoPUB Sync 0.0.6', r.summaryText || reportText()); }
  function copyReport() { var text = reportText(); return copyText(text).then(function () { noty(lang('copied')); }).catch(function () { noty(lang('copy_failed')); showText('KinoPUB Sync 0.0.6 — отчёт', text); }); }
  function clearReport() { storageRemove(KEY.report); storageRemove(KEY.tokenStatus); storageSet(KEY.lastStatus, ''); noty(lang('report_cleared')); }

  function padImdb(id) {
    var s = String(id || '').replace(/^tt/i, '').replace(/[^0-9]/g, '');
    while (s.length && s.length < 7) s = '0' + s;
    return s ? 'tt' + s : '';
  }

  function favoriteStorage() { var fav = storageGet('favorite', {}) || {}; if (typeof fav === 'string') fav = parseJson(fav) || {}; return fav && typeof fav === 'object' ? fav : {}; }
  function customFavoriteStorage() { var fav = storageGet('custom_favorite', {}) || {}; if (typeof fav === 'string') fav = parseJson(fav) || {}; return fav && typeof fav === 'object' ? fav : {}; }

  function cardTitle(card) { return String(card && (card.title || card.name || card.original_title || card.original_name) || ''); }

  function isOldSyncCard(card) {
    if (!card || typeof card !== 'object') return false;
    if (card.kp_sync_fallback !== undefined) return true;
    if (card.kp_sync_match_source !== undefined) return true;
    if (card.kp_sync_match_confidence !== undefined) return true;
    if (card.kinopub_id !== undefined) return true;
    if (card.kp_id !== undefined && (card.source === 'kinopub_sync' || card.source === 'KinoPUB Sync' || card.source === 'kinopub')) return true;
    if (card.source === 'kinopub_sync' || card.source === 'KinoPUB Sync') return true;
    return false;
  }

  function mapCardsById(cards) {
    var out = {};
    for (var i = 0; cards && i < cards.length; i++) if (cards[i] && cards[i].id != null) out[String(cards[i].id)] = cards[i];
    return out;
  }

  function removeIdsFromArray(arr, ids) {
    if (!arr || !arr.length) return 0;
    var removed = 0;
    for (var i = arr.length - 1; i >= 0; i--) if (ids[String(arr[i])]) { arr.splice(i, 1); removed++; }
    return removed;
  }

  var OLD_SERVICE_KEYS = ['kp_sync_identity_map','kp_sync_episode_map','kp_sync_timeline_map','kp_sync_card_map','kp_sync_bookmark_snapshot','kp_sync_timeline_snapshot','kp_sync_push_folder_id','kp_sync_bookmark_snapshot_pending','kp_sync_delete_pending'];

  function countObjectKeys(obj) { var n = 0; for (var k in obj) if (obj && obj.hasOwnProperty(k)) n++; return n; }

  function addId(ids, id) { if (id !== undefined && id !== null && id !== '') ids[String(id)] = true; }

  function collectOldSyncMaps() {
    var ids = {}, hashes = {}, service = [];
    function addHash(h) { if (h !== undefined && h !== null && h !== '') hashes[String(h)] = true; }
    var identity = storageGet('kp_sync_identity_map', {}) || {};
    if (identity && typeof identity === 'object') {
      if (identity.byItem) {
        for (var iid in identity.byItem) if (identity.byItem.hasOwnProperty(iid)) {
          var e = identity.byItem[iid] || {};
          addId(ids, e.lampa_card_id);
          if (e.card) addId(ids, e.card.id);
        }
      }
    }
    var tm = storageGet('kp_sync_timeline_map', {}) || {};
    if (tm && typeof tm === 'object') for (var th in tm) if (tm.hasOwnProperty(th)) addHash(th);
    var ep = storageGet('kp_sync_episode_map', {}) || {};
    if (ep && typeof ep === 'object' && ep.byHash) for (var eh in ep.byHash) if (ep.byHash.hasOwnProperty(eh)) addHash(eh);
    var bm = storageGet('kp_sync_bookmark_snapshot', {}) || {};
    if (bm && bm.items) for (var bi in bm.items) if (bm.items.hasOwnProperty(bi)) { var b = bm.items[bi] || {}; if (b.card) addId(ids, b.card.id); }
    var ts = storageGet('kp_sync_timeline_snapshot', {}) || {};
    if (ts && ts.items) for (var ti in ts.items) if (ts.items.hasOwnProperty(ti)) { var t = ts.items[ti] || {}; if (t.card) addId(ids, t.card.id); if (t.hash) addHash(t.hash); }
    for (var i = 0; i < OLD_SERVICE_KEYS.length; i++) {
      var key = OLD_SERVICE_KEYS[i];
      var val = storageGet(key, null);
      if (val !== null && val !== undefined && val !== '') service.push({ key: key, kind: typeof val, items: isObject(val) ? countObjectKeys(val) : (isArray(val) ? val.length : 1) });
    }
    return { ids: ids, hashes: hashes, serviceKeys: service };
  }

  function knownTimelineStorageKeys() {
    var keys = {}, out = [];
    function add(k) { if (!keys[k]) { keys[k] = true; out.push(k); } }
    add('file_view');
    add('timeline');
    add('viewed');
    for (var i = 0; i <= 20; i++) add('file_view_' + i);
    try {
      for (var j = 0; j < localStorage.length; j++) {
        var k = localStorage.key(j);
        if (k && k.indexOf('kp_sync_') !== 0 && (k.indexOf('file_view') === 0 || k.indexOf('timeline') >= 0)) add(k);
      }
    } catch (e) {}
    return out;
  }

  function scanTimelineData(ids, hashes) {
    var keys = knownTimelineStorageKeys();
    var result = [];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var obj = storageGet(key, null);
      if (!obj || typeof obj !== 'object' || isArray(obj)) continue;
      var total = 0, matches = 0, sample = [];
      for (var h in obj) if (obj.hasOwnProperty(h)) {
        total++;
        var entry = obj[h] || {};
        var card = entry.card || entry.data && entry.data.card;
        var match = !!hashes[String(h)] || isOldSyncCard(card) || (card && ids[String(card.id)] && isOldSyncCard(card));
        if (match) { matches++; if (sample.length < 20) sample.push({ hash: String(h), title: cardTitle(card), id: card && card.id }); }
      }
      if (matches) result.push({ key: key, total: total, matches: matches, sample: sample });
    }
    return result;
  }

  function removeTimelineData(ids, hashes) {
    var keys = knownTimelineStorageKeys();
    var removed = { timelineKeys: 0, timelineEntries: 0, byKey: [] };
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var obj = storageGet(key, null);
      if (!obj || typeof obj !== 'object' || isArray(obj)) continue;
      var local = 0;
      for (var h in obj) if (obj.hasOwnProperty(h)) {
        var entry = obj[h] || {};
        var card = entry.card || entry.data && entry.data.card;
        var match = !!hashes[String(h)] || isOldSyncCard(card) || (card && ids[String(card.id)] && isOldSyncCard(card));
        if (match) { delete obj[h]; local++; }
      }
      if (local) { storageSet(key, obj); removed.timelineKeys++; removed.timelineEntries += local; removed.byKey.push({ key: key, removed: local }); }
    }
    return removed;
  }

  function scanOldLampaBookmarks() {
    var fav = favoriteStorage();
    var custom = customFavoriteStorage();
    var cards = fav.card || [];
    var customCards = custom.customTypes && custom.customTypes.card || [];
    var cardMap = mapCardsById(cards);
    var customCardMap = mapCardsById(customCards);
    var mapInfo = collectOldSyncMaps();
    var suspectIds = {}, suspectCards = [], customTypes = [], arrays = { book: 0, book_movie: 0, book_tv: 0, history: 0, custom: 0, timeline: 0, serviceKeys: 0 };
    function markId(id, reason, card) {
      if (id == null || id === '') return;
      var sid = String(id);
      if (!suspectIds[sid]) { suspectIds[sid] = { id: sid, reason: reason, title: cardTitle(card || cardMap[sid] || customCardMap[sid]) }; suspectCards.push(suspectIds[sid]); }
    }
    for (var i = 0; i < cards.length; i++) if (isOldSyncCard(cards[i])) markId(cards[i].id, 'card_marker_in_favorite.card', cards[i]);
    for (var j = 0; j < customCards.length; j++) if (isOldSyncCard(customCards[j])) markId(customCards[j].id, 'card_marker_in_custom_favorite.card', customCards[j]);
    for (var mid in mapInfo.ids) if (mapInfo.ids.hasOwnProperty(mid)) markId(mid, 'old_sync_service_map', cardMap[mid] || customCardMap[mid]);
    var types = custom.customTypes || {};
    for (var typeName in types) if (types.hasOwnProperty(typeName) && typeName !== 'card') {
      if (String(typeName).indexOf('KinoPUB:') === 0) {
        var uid = types[typeName];
        var arr = custom[uid] || [];
        customTypes.push({ name: typeName, uid: uid, items: arr.length });
        for (var a = 0; a < arr.length; a++) markId(arr[a], 'custom_folder_' + typeName, customCardMap[String(arr[a])] || cardMap[String(arr[a])]);
      }
    }
    arrays.book = countIdsInArray(fav.book, suspectIds);
    arrays.book_movie = countIdsInArray(fav.book_movie, suspectIds);
    arrays.book_tv = countIdsInArray(fav.book_tv, suspectIds);
    arrays.history = countIdsInArray(fav.history, suspectIds);
    for (var ct = 0; ct < customTypes.length; ct++) arrays.custom += customTypes[ct].items;
    var timelineMatches = scanTimelineData(suspectIds, mapInfo.hashes);
    for (var tm_i = 0; tm_i < timelineMatches.length; tm_i++) arrays.timeline += timelineMatches[tm_i].matches || 0;
    arrays.serviceKeys = mapInfo.serviceKeys.length;
    var report = { version: VERSION, generatedAt: nowIso(), source: 'local Lampa cleanup scan for old KinoPUB Sync data', safeMode: 'only old Sync markers, KinoPUB:* custom folders, old kp_sync_* maps and timeline hashes linked by old maps', tokensIncluded: false, suspectIdsCount: suspectCards.length, suspectIds: suspectCards.slice(0, 500), customTypesToRemove: customTypes, timelineToRemove: timelineMatches, serviceKeysToRemove: mapInfo.serviceKeys, arraysAffected: arrays, applied: false };
    storageSet(KEY.cleanupReport, report);
    setStatus(lang('cleanup_scanned') + ': id ' + report.suspectIdsCount + ', папок ' + customTypes.length + ', history ' + arrays.history + ', timeline ' + arrays.timeline);
    noty(lang('cleanup_scanned'));
    return report;
  }

  function countIdsInArray(arr, ids) { var n = 0; for (var i = 0; arr && i < arr.length; i++) if (ids[String(arr[i])]) n++; return n; }
  function cleanupReport() { return storageGet(KEY.cleanupReport, null); }
  function cleanupReportText() { var r = cleanupReport(); return r ? JSON.stringify(r, null, 2) : lang('cleanup_missing'); }
  function showCleanupReport() { var r = cleanupReport(); if (!r) { noty(lang('cleanup_missing')); return; } showText('KinoPUB Sync 0.0.6 — очистка Lampa', JSON.stringify(r, null, 2)); }
  function copyCleanupReport() { var text = cleanupReportText(); return copyText(text).then(function () { noty(lang('copied')); }).catch(function () { noty(lang('copy_failed')); showText('KinoPUB Sync 0.0.6 — очистка Lampa', text); }); }

  function applyOldLampaCleanup() {
    var report = cleanupReport();
    if (!report) report = scanOldLampaBookmarks();
    if (!report || (!report.suspectIdsCount && (!report.customTypesToRemove || !report.customTypesToRemove.length))) { noty('Нечего очищать.'); return false; }
    var text = 'Будут удалены только локальные следы старого Sync-импорта в Lampa.\n\n' +
      'ID к удалению из book/book_movie/book_tv: ' + report.suspectIdsCount + '\n' +
      'Папок custom_favorite “KinoPUB: ...”: ' + (report.customTypesToRemove ? report.customTypesToRemove.length : 0) + '\n\n' +
      'KinoPUB не изменяется. Продолжить?';
    if (!confirmText(text)) { noty(lang('cleanup_cancelled')); return false; }
    var ids = {}, i;
    for (i = 0; i < report.suspectIds.length; i++) ids[String(report.suspectIds[i].id)] = true;
    var fav = favoriteStorage();
    var custom = customFavoriteStorage();
    var mapInfo = collectOldSyncMaps();
    var removed = { book: 0, book_movie: 0, book_tv: 0, history: 0, customFolders: 0, customItems: 0, favoriteCards: 0, customCards: 0, timelineKeys: 0, timelineEntries: 0, timelineByKey: [], serviceKeys: [] };
    removed.book = removeIdsFromArray(fav.book, ids);
    removed.book_movie = removeIdsFromArray(fav.book_movie, ids);
    removed.book_tv = removeIdsFromArray(fav.book_tv, ids);
    removed.history = removeIdsFromArray(fav.history, ids);
    var types = custom.customTypes || {};
    for (var typeName in types) if (types.hasOwnProperty(typeName) && typeName !== 'card' && String(typeName).indexOf('KinoPUB:') === 0) {
      var uid = types[typeName];
      if (custom[uid] && custom[uid].length) removed.customItems += custom[uid].length;
      delete custom[uid];
      delete types[typeName];
      removed.customFolders++;
    }
    custom.customTypes = types;
    if (fav.card && fav.card.length) {
      for (i = fav.card.length - 1; i >= 0; i--) if (fav.card[i] && ids[String(fav.card[i].id)] && isOldSyncCard(fav.card[i])) { fav.card.splice(i, 1); removed.favoriteCards++; }
    }
    if (custom.customTypes && custom.customTypes.card && custom.customTypes.card.length) {
      for (i = custom.customTypes.card.length - 1; i >= 0; i--) if (custom.customTypes.card[i] && ids[String(custom.customTypes.card[i].id)] && isOldSyncCard(custom.customTypes.card[i])) { custom.customTypes.card.splice(i, 1); removed.customCards++; }
    }
    storageSet('favorite', fav);
    storageSet('custom_favorite', custom);
    var tr = removeTimelineData(ids, mapInfo.hashes);
    removed.timelineKeys = tr.timelineKeys; removed.timelineEntries = tr.timelineEntries; removed.timelineByKey = tr.byKey;
    for (var sk = 0; sk < OLD_SERVICE_KEYS.length; sk++) {
      var k = OLD_SERVICE_KEYS[sk];
      var val = storageGet(k, null);
      if (val !== null && val !== undefined && val !== '') { storageRemove(k); removed.serviceKeys.push(k); }
    }
    report.applied = true; report.appliedAt = nowIso(); report.removed = removed;
    storageSet(KEY.cleanupReport, report);
    setStatus(lang('cleanup_done') + ': book ' + removed.book + ', movie ' + removed.book_movie + ', tv ' + removed.book_tv + ', history ' + removed.history + ', timeline ' + removed.timelineEntries + ', custom folders ' + removed.customFolders);
    noty(lang('cleanup_done'));
    return report;
  }


  function showCleanupMenu() {
    var apiName = 'KinoPubSync006';
    var btnStyle = 'display:block;width:100%;margin:.45em 0;padding:.65em .75em;border-radius:.45em;border:0;background:#3f51b5;color:#fff;text-align:left;font-size:1em;';
    var smallStyle = 'font-size:.85em;opacity:.75;margin:.25em 0 .75em 0;line-height:1.35';
    function action(fn) {
      return "try{if(window.Lampa&&Lampa.Modal&&Lampa.Modal.close)Lampa.Modal.close();}catch(e){};window." + apiName + "." + fn + "();return false;";
    }
    try {
      if (window.Lampa && Lampa.Modal && Lampa.Modal.open) {
        var html = '';
        html += '<div style="line-height:1.4">';
        html += '<div style="margin-bottom:.75em">' + escapeHtml(lang('sep_cleanup_descr')) + '</div>';
        html += '<button style="' + btnStyle + '" onclick="' + action('scanOldLampaBookmarks') + '">' + escapeHtml(lang('scan_bad_lampa')) + '</button>';
        html += '<div style="' + smallStyle + '">' + escapeHtml(lang('scan_bad_lampa_descr')) + '</div>';
        html += '<button style="' + btnStyle + '" onclick="' + action('showCleanupReport') + '">' + escapeHtml(lang('show_cleanup')) + '</button>';
        html += '<button style="' + btnStyle + '" onclick="' + action('copyCleanupReport') + '">' + escapeHtml(lang('copy_cleanup')) + '</button>';
        html += '<button style="' + btnStyle + 'background:#8b2d2d;" onclick="' + action('applyOldLampaCleanup') + '">' + escapeHtml(lang('clear_bad_lampa')) + '</button>';
        html += '<div style="' + smallStyle + '">' + escapeHtml(lang('clear_bad_lampa_descr')) + '</div>';
        html += '</div>';
        Lampa.Modal.open({ title: lang('cleanup_menu'), html: html, size: 'medium' });
        return;
      }
    } catch (e) { log('cleanup menu failed', e && e.message); }
    showText(lang('cleanup_menu'), [
      lang('scan_bad_lampa') + ': ' + apiName + '.scanOldLampaBookmarks()',
      lang('show_cleanup') + ': ' + apiName + '.showCleanupReport()',
      lang('copy_cleanup') + ': ' + apiName + '.copyCleanupReport()',
      lang('clear_bad_lampa') + ': ' + apiName + '.applyOldLampaCleanup()'
    ].join('\n'));
  }

  function addParamTo(component, name, type, def, values, title, descr, onChange) {
    try {
      if (!window.Lampa || !Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;
      var param = { component: component, name: name, type: type, 'default': def == null ? '' : def, values: values == null ? '' : values };
      Lampa.SettingsApi.addParam({ component: component, param: param, field: { name: title, description: descr || '' }, onChange: onChange || function () {} });
    } catch (e) { log('settings param failed', name, e && e.message); }
  }

  function addParam(name, type, def, values, title, descr, onChange) { return addParamTo(COMPONENT, name, type, def, values, title, descr, onChange); }
  function addSettings() {
    try {
      if (!window.Lampa || !Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;
      var icon = '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0-9 9h2a7 7 0 0 1 11.95-4.95L15 9h6V3l-2.62 2.62A8.97 8.97 0 0 0 12 3Zm7 9a7 7 0 0 1-11.95 4.95L9 15H3v6l2.62-2.62A9 9 0 0 0 21 12h-2Z"/></svg>';
      Lampa.SettingsApi.addComponent({ component: COMPONENT, name: lang('component'), icon: icon });
      addParam('kp_sync006_sep_main', 'title', '', '', lang('sep'), lang('sep_descr'));
      addParam(KEY.lastStatus, 'input', storageGet(KEY.lastStatus, '') || '', '', lang('status'), lang('status_descr'));
      addParam('kp_sync006_action_check_token', 'button', '', '', lang('check_token'), lang('check_token_descr'), function () { checkToken(); });
      addParam('kp_sync006_action_read_bookmarks', 'button', '', '', lang('read_bookmarks'), lang('read_bookmarks_descr'), function () { readBookmarks(); });
      addParam('kp_sync006_action_show_report', 'button', '', '', lang('show_report'), lang('show_report_descr'), function () { showReport(); });
      addParam('kp_sync006_action_copy_report', 'button', '', '', lang('copy_report'), lang('copy_report_descr'), function () { copyReport(); });
      addParam('kp_sync006_action_clear_report', 'button', '', '', lang('clear_report'), lang('clear_report_descr'), function () { clearReport(); });
      addParam('kp_sync006_action_cleanup_menu', 'button', '', '', lang('cleanup_menu'), lang('cleanup_menu_descr'), function () { showCleanupMenu(); });
    } catch (e) { log('settings failed', e && e.message); }
  }

  function start() {
    if (window.KinoPubSync006 && window.KinoPubSync006._started) return;
    window.KinoPubSync006 = {
      _started: true,
      version: VERSION,
      edition: EDITION,
      checkToken: checkToken,
      readBookmarks: readBookmarks,
      report: getReport,
      reportText: reportText,
      showReport: showReport,
      copyReport: copyReport,
      clearReport: clearReport,
      scanOldLampaBookmarks: scanOldLampaBookmarks,
      cleanupReport: cleanupReport,
      cleanupReportText: cleanupReportText,
      showCleanupReport: showCleanupReport,
      copyCleanupReport: copyCleanupReport,
      applyOldLampaCleanup: applyOldLampaCleanup,
      status: function () { return storageGet(KEY.lastStatus, ''); },
      tokenStatus: function () { return storageGet(KEY.tokenStatus, null); }
    };
    addSettings();
    log('started', 'alpha read-only audit build with internal cleanup menu');
  }

  if (window.appready) start();
  else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
    try { Lampa.Listener.follow('app', function (e) { if (!e || e.type === 'ready') start(); }); } catch (e2) { setTimeout(start, 3000); }
  } else setTimeout(start, 3000);
})();
