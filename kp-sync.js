(function () {
  'use strict';

  var VERSION = '0.1.4';
  var EDITION = 'alpha-readonly-match';
  var COMPONENT = 'kp_sync_alpha';
  var LOG = '[KinoPUB Sync 0.1.4]';
  var API_HOST = 'https://api.service-kp.com';
  var CLIENT_ID = 'xbmc';
  var CLIENT_SECRET = 'cgg3gtifu46urtfp2zp1nqtba0k2ezxh';
  var MAX_PAGES_PER_FOLDER = 200;
  var PER_PAGE = 50;
  var REPORT_SAMPLE_LIMIT = 12;
  var FALLBACK_MIN_RATIO = 0.8;
  var MATCH_TIMEOUT_MS = 5000;
  var MATCH_CONCURRENCY = 1;
  var MATCH_ABORT_API_ERRORS = 3;

  var KEY = {
    token: 'kp_token',
    refresh: 'kp_refresh',
    lastStatus: 'kp_sync014_last_status',
    report: 'kp_sync014_bookmarks_report',
    tokenStatus: 'kp_sync014_token_status',
    cleanupReport: 'kp_sync014_lampa_cleanup_report',
    matchReport: 'kp_sync014_match_report',
    matchLimit: 'kp_sync014_match_limit',
    tmdbDiag: 'kp_sync014_tmdb_diag'
  };

  if (window.KinoPubSync014 && window.KinoPubSync014.version === VERSION) return;

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
      component: 'KinoPUB Sync 0.1.4',
      sep: '— Проверка и чтение KinoPUB —',
      sep_descr: 'Alpha-сборка: чтение KinoPUB и read-only сопоставление с TMDB/Lampa. Ничего не импортирует в Lampa и ничего не меняет в KinoPUB.',
      cleanup_menu: 'Очистка данных',
      cleanup_menu_descr: 'Открывает внутренний подраздел очистки данных этого плагина: старые закладки, история, продолжение просмотра и служебные карты. KinoPUB не меняется.',
      sep_cleanup: 'Очистка данных',
      sep_cleanup_descr: 'Блок в основных настройках плагина для безопасной локальной очистки следов старого Sync: закладки, история, продолжение просмотра и служебные карты. KinoPUB не меняется.',
      status: 'Последний статус',
      status_descr: 'Краткий результат последнего действия плагина.',
      check_token: 'Проверить токен основного KinoPUB',
      check_token_descr: 'Проверяет, есть ли kp_token/kp_refresh от основного lampa_kinopub, и доступен ли API KinoPUB. Отдельную авторизацию не запускает.',
      read_bookmarks: 'Считать папки и закладки KinoPUB',
      read_bookmarks_descr: 'Читает все доступные папки и элементы закладок авторизованного аккаунта KinoPUB. Ничего не записывает в Lampa.',
      show_report: 'Показать краткий отчёт',
      show_report_descr: 'Открывает краткую сводку последнего чтения папок и закладок, включая повторяющиеся item id.',
      copy_report: 'Скопировать полный отчёт',
      copy_report_descr: 'Копирует JSON-отчёт по папкам/закладкам для анализа. Включает повторяющиеся item id внутри папок. Токены в отчёт не включаются.',
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
      sep_match: '— Сопоставление KinoPUB → Lampa/TMDB —',
      sep_match_descr: 'Read-only проверка готовности к импорту: берёт уникальные KinoPUB item id из последнего отчёта закладок, ищет настоящие TMDB/Lampa-карточки по IMDb через Lampa.TMDB.api или TMDB Proxy fallback и разделяет результат на importCandidates и blockedItems. Перед массовой проверкой выполняется быстрый TMDB preflight; при таймаутах массовая проверка останавливается, чтобы не ждать десятки минут. Ничего не импортирует.',
      match_limit: 'Лимит сопоставления',
      match_limit_descr: '0 = проверить все уникальные карточки из последнего отчёта. Для короткой проверки можно указать 10, 25, 50 или 100. Если TMDB недоступен, v0.1.4 остановится после preflight/серии таймаутов.',
      test_tmdb: 'Проверить TMDB/Lampa API',
      test_tmdb_descr: 'Быстрый preflight: проверяет Lampa.TMDB.api, затем пробует прямой TMDB Proxy fallback через домен CUB и backup. Ничего не импортирует и не открывает alert автоматически.',
      show_tmdb_diag: 'Показать диагностику TMDB/Lampa',
      show_tmdb_diag_descr: 'Показывает последний результат проверки TMDB/Lampa API: доступность Lampa.TMDB.api, прямого TMDB Proxy, время ответа, ошибку или найденные counts.',
      copy_tmdb_diag: 'Скопировать диагностику TMDB/Lampa',
      copy_tmdb_diag_descr: 'Копирует последний результат диагностики TMDB/Lampa. Полезно, если устройство открывает системное окно браузера вместо окна Lampa.',
      run_match: 'Сопоставить карточки с TMDB/Lampa',
      run_match_descr: 'Запускает read-only проверку кандидатов к будущему импорту. Сначала делает TMDB preflight. Если Lampa.TMDB.api не отвечает, пробует TMDB Proxy fallback. Импорт-кандидат появляется только если получена настоящая TMDB/Lampa-карточка по IMDb и тип movie/tv совпал. Kinopoisk-only карточки блокируются до отдельного резолвера.',
      show_match: 'Показать отчёт сопоставления',
      show_match_descr: 'Показывает краткую сводку последнего сопоставления KinoPUB → TMDB/Lampa.',
      copy_match: 'Скопировать отчёт сопоставления',
      copy_match_descr: 'Копирует полный JSON-отчёт сопоставления. Токены и личные данные авторизации не включаются.',
      clear_match: 'Очистить отчёт сопоставления',
      clear_match_descr: 'Удаляет сохранённый отчёт сопоставления. Закладки и история Lampa не меняются.',
      tmdb_checking: 'Проверяю TMDB/Lampa API...',
      tmdb_ok: 'TMDB/Lampa API доступен',
      tmdb_bad: 'TMDB/Lampa API недоступен или не отвечает',
      matching: 'Сопоставляю карточки KinoPUB с TMDB/Lampa...',
      match_done: 'Сопоставление завершено',
      match_missing: 'Отчёт сопоставления ещё не сформирован.',
      match_report_cleared: 'Отчёт сопоставления очищен.',
      tmdb_diag_missing: 'Диагностика TMDB/Lampa ещё не выполнялась.',
      no_bookmark_report: 'Сначала выполните чтение папок и закладок KinoPUB.',
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

  function acceptedDuplicateRowsFromAttempt(attempt) {
    attempt = attempt || {};
    return Math.max(0, (attempt.duplicateRows || 0) - repeatedTailRowsFromAttempt(attempt));
  }

  function acceptedRowEntries(attempt) {
    attempt = attempt || {};
    var rows = attempt.rows || [];
    var accepted = acceptedRowsFromAttempt(attempt);
    if (accepted > rows.length) accepted = rows.length;
    return rows.slice(0, accepted);
  }

  function duplicateItemsFromAttempt(attempt) {
    var rows = acceptedRowEntries(attempt), map = {}, order = [];
    for (var i = 0; i < rows.length; i++) {
      var norm = rows[i] && rows[i].norm || {};
      var id = String(norm.id || '');
      if (!id) continue;
      if (!map[id]) {
        map[id] = { id: id, title: norm.title || '', type: norm.type || '', subtype: norm.subtype || '', normalized_kind: norm.normalized_kind || '', year: norm.year || '', count: 0, source_indexes: [], first_index: 0, last_index: 0 };
        order.push(id);
      }
      map[id].count++;
      map[id].source_indexes.push(norm.source_index || (i + 1));
      if (!map[id].first_index) map[id].first_index = norm.source_index || (i + 1);
      map[id].last_index = norm.source_index || (i + 1);
      if (!map[id].title && norm.title) map[id].title = norm.title;
    }
    var out = [];
    for (var j = 0; j < order.length; j++) {
      var rec = map[order[j]];
      if (rec.count > 1) out.push(rec);
    }
    out.sort(function (a, b) { return (a.first_index || 0) - (b.first_index || 0); });
    return out;
  }

  function attemptsHaveSameResult(attempts) {
    if (!attempts || attempts.length < 2) return false;
    var base = attempts[0];
    for (var i = 1; i < attempts.length; i++) {
      if (acceptedRowsFromAttempt(attempts[i]) !== acceptedRowsFromAttempt(base)) return false;
      if (repeatedTailRowsFromAttempt(attempts[i]) !== repeatedTailRowsFromAttempt(base)) return false;
      if ((attempts[i].uniqueItems || 0) !== (base.uniqueItems || 0)) return false;
      if (acceptedDuplicateRowsFromAttempt(attempts[i]) !== acceptedDuplicateRowsFromAttempt(base)) return false;
      if (missingAcceptedRowsFromAttempt(attempts[i], attempts[i].expectedRows) !== missingAcceptedRowsFromAttempt(base, base.expectedRows)) return false;
    }
    return true;
  }

  function missingAcceptedRowsFromAttempt(attempt, expected) {
    expected = Number(expected) || 0;
    if (!expected) return 0;
    return Math.max(0, expected - acceptedRowsFromAttempt(attempt));
  }

  function shouldRunFallback(best, expected) {
    if (!best || best.error) return true;
    expected = Number(expected) || 0;
    if (!expected) return !(best.rawRowsFetched > 0);
    if (repeatedTailRowsFromAttempt(best) > 0) return true;
    return acceptedRowsFromAttempt(best) < expected;
  }

  function folderId(folder) { return folder && folder.id != null ? String(folder.id) : ''; }
  function folderTitle(folder) { return String((folder && (folder.title || folder.name)) || 'Без названия'); }

  function strategyList(fid) {
    return [
      makeStrategy('path_page_perpage_50', '/bookmarks/' + encodeURIComponent(fid), function (page) { return { page: page, perpage: PER_PAGE }; }, PER_PAGE),
      makeStrategy('view_folder_page_perpage_50', '/bookmarks/view', function (page) { return { folder: fid, page: page, perpage: PER_PAGE }; }, PER_PAGE)
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

        if (page > 1 && newUnique === 0) attempt.noNewPages++;
        else attempt.noNewPages = 0;
        if (attempt.noNewPages >= 1) {
          attempt.stoppedReason = 'no_new_items_page_maybe_ignored';
          continueReason = 'stop_no_new_unique_items';
          attempt.pageTrace.push({ strategy: strategy.name, page: page, requestedPerPage: requestedPerPage, inferredPageSize: attempt.inferredPageSize || items.length, itemsReturned: items.length, newUniqueItems: newUnique, duplicateRows: duplicateRows, rawRowsFetchedTotal: attempt.rawRowsFetched, firstId: firstId, lastId: lastId, continueReason: continueReason });
          return attempt;
        }

        if (expected && attempt.rawRowsFetched >= expected) {
          attempt.stoppedReason = 'reported_raw_count_reached';
          continueReason = 'stop_reported_count_reached';
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
    if (a.error && !b.error) return b;
    if (b.error && !a.error) return a;
    var ar = acceptedRowsFromAttempt(a), br = acceptedRowsFromAttempt(b);
    if (br > ar) return b;
    if (br < ar) return a;
    var am = missingAcceptedRowsFromAttempt(a, a.expectedRows), bm = missingAcceptedRowsFromAttempt(b, b.expectedRows);
    if (bm < am) return b;
    if (bm > am) return a;
    var at = repeatedTailRowsFromAttempt(a), bt = repeatedTailRowsFromAttempt(b);
    if (bt < at) return b;
    if (bt > at) return a;
    if ((b.uniqueItems || 0) > (a.uniqueItems || 0)) return b;
    if ((b.rawRowsFetched || 0) > (a.rawRowsFetched || 0)) return b;
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
            if (!shouldRunFallback(best, expected)) return null;
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
        duplicateRows: acceptedDuplicateRowsFromAttempt(best),
        duplicateRowsTotal: best.duplicateRows,
        missingRawByCount: expected && best.rawRowsFetched < expected ? expected - best.rawRowsFetched : 0,
        missingAcceptedByCount: missingAcceptedRowsFromAttempt(best, expected),
        extraRawOverCount: expected && best.rawRowsFetched > expected ? best.rawRowsFetched - expected : 0,
        stoppedReason: best.stoppedReason,
        error: best.error,
        attempts: [],
        pageTrace: best.pageTrace || [],
        duplicateItemsInFolder: duplicateItemsFromAttempt(best),
        strategiesEquivalent: attemptsHaveSameResult(attempts)
      };
      for (var ai = 0; ai < attempts.length; ai++) folderReport.attempts.push({ strategy: attempts[ai].strategy, requestedPerPage: attempts[ai].requestedPerPage || PER_PAGE, inferredPageSize: attempts[ai].inferredPageSize || 0, pagesRequested: attempts[ai].pagesRequested, rawRowsFetched: attempts[ai].rawRowsFetched, acceptedRawRows: acceptedRowsFromAttempt(attempts[ai]), repeatedTailRows: repeatedTailRowsFromAttempt(attempts[ai]), uniqueItems: attempts[ai].uniqueItems, duplicateRows: acceptedDuplicateRowsFromAttempt(attempts[ai]), duplicateRowsTotal: attempts[ai].duplicateRows, missingAcceptedByCount: missingAcceptedRowsFromAttempt(attempts[ai], expected), stoppedReason: attempts[ai].stoppedReason, error: attempts[ai].error });

      var seenInFolder = {};
      var acceptedEntries = acceptedRowEntries(best);
      for (var r = 0; r < acceptedEntries.length; r++) {
        var norm = acceptedEntries[r].norm;
        if (!seenInFolder[norm.id]) {
          seenInFolder[norm.id] = true;
          report.catalog.push(norm);
          if (!report._globalItems[norm.id]) report._globalItems[norm.id] = { id: norm.id, title: norm.title, type: norm.type, subtype: norm.subtype, normalized_kind: norm.normalized_kind, year: norm.year, imdb_id: norm.imdb_id, kinopoisk_id: norm.kinopoisk_id, tmdb_id: norm.tmdb_id, folders: [] };
          report._globalItems[norm.id].folders.push({ id: fid, title: ftitle });
          addStats(report, norm);
        }
        if (report.rawSamples.length < REPORT_SAMPLE_LIMIT) report.rawSamples.push({ folder_id: fid, folder_title: ftitle, item: sanitizeRawSample(acceptedEntries[r].raw) });
      }
      if (attempts.length > 1 && folderReport.strategiesEquivalent) report.warnings.push('Папка “' + ftitle + '”: fallback-стратегии запускались, но вернули тот же результат, что и основная стратегия. Похоже, API не отдаёт элементы сверх ' + folderReport.acceptedRawRows + ' полезных строк.');
      else if (attempts.length > 1) report.warnings.push('Папка “' + ftitle + '”: основная стратегия была неполной, поэтому запускались fallback-стратегии. Выбрана: ' + folderReport.selectedStrategy + '.');
      if (folderReport.repeatedTailRows) report.warnings.push('Папка “' + ftitle + '”: API повторил последнюю страницу. Полезных строк до повтора: ' + folderReport.acceptedRawRows + ' из счётчика ' + expected + '; повторно пришло строк: ' + folderReport.repeatedTailRows + '. Эти повторы не считаются дублями закладок.');
      if (folderReport.missingRawByCount && !folderReport.repeatedTailRows) report.warnings.push('Папка “' + ftitle + '”: заявлено ' + expected + ', сырых строк получено ' + best.rawRowsFetched + ', не хватает ' + folderReport.missingRawByCount + '.');
      if (folderReport.missingAcceptedByCount) report.warnings.push('Папка “' + ftitle + '”: API не отдал ' + folderReport.missingAcceptedByCount + ' строк до счётчика папки. Это не дубли в папке, а расхождение между счётчиком KinoPUB и пагинацией API.');
      if (folderReport.duplicateRows) report.warnings.push('Папка “' + ftitle + '”: внутри принятых страниц найдено повторяющихся item id: ' + folderReport.duplicateRows + '. Список см. в duplicateItemsInFolder. Повтор хвоста страницы сюда не входит.');
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
    lines.push('Повторно пришедших строк хвоста страниц: ' + (report.totals.repeatedTailRows || 0));
    lines.push('Уникальных строк внутри папок: ' + report.totals.uniqueRowsInFolders);
    lines.push('Уникальных KinoPUB item id глобально: ' + report.totals.uniqueGlobalItems);
    lines.push('Папок с ошибками: ' + report.totals.folderErrors);
    lines.push('Папок с недочётом raw-count: ' + report.totals.foldersWithMissingRawCount);
    lines.push('Повторяющихся item id внутри принятых страниц: ' + report.totals.duplicateRowsInFolders);
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
    var dupLines = [];
    for (var fi = 0; report.folders && fi < report.folders.length; fi++) {
      var folder = report.folders[fi];
      var dups = folder.duplicateItemsInFolder || [];
      for (var di = 0; di < dups.length; di++) {
        var d = dups[di];
        dupLines.push((folder.title || folder.id) + ': ' + d.id + ' ×' + d.count + ' — ' + (d.title || '') + ' [' + (d.source_indexes || []).join(', ') + ']');
      }
    }
    if (dupLines.length) {
      lines.push('Повторяющиеся item id внутри папок:');
      for (var dl = 0; dl < dupLines.length && dl < 20; dl++) lines.push('- ' + dupLines[dl]);
      if (dupLines.length > 20) lines.push('- ... ещё ' + (dupLines.length - 20));
      lines.push('');
    }
    lines.push('Важно: v0.1.4 ничего не импортирует в Lampa и ничего не меняет в KinoPUB. Очистка данных Lampa находится в основных настройках плагина и выполняется только после сканирования и подтверждения.');
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
      api: { host: API_HOST, endpoints: ['/v1/bookmarks', '/v1/bookmarks/<folder_id>', '/v1/bookmarks/view?folder=<folder_id> fallback if accepted rows are incomplete', 'fallback limit=50 removed from normal mode because it is slower and returned the same API tail', 'pagination: page + perpage=50'] },
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
      setStatus(lang('done') + ': папок ' + report.totals.folders + ', accepted ' + report.totals.acceptedRawRows + '/' + report.totals.reportedRows + ', уникальных ' + report.totals.uniqueGlobalItems + ', ошибок ' + report.totals.folderErrors);
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
  function showReport() { var r = getReport(); if (!r) { noty(lang('report_missing')); return; } showText('KinoPUB Sync 0.1.4', r.summaryText || reportText()); }
  function copyReport() { var text = reportText(); return copyText(text).then(function () { noty(lang('copied')); }).catch(function () { noty(lang('copy_failed')); showText('KinoPUB Sync 0.1.4 — отчёт', text); }); }
  function clearReport() { storageRemove(KEY.report); storageRemove(KEY.tokenStatus); storageSet(KEY.lastStatus, ''); noty(lang('report_cleared')); }

  function padImdb(id) {
    var s = String(id || '').replace(/^tt/i, '').replace(/[^0-9]/g, '');
    while (s.length && s.length < 7) s = '0' + s;
    return s ? 'tt' + s : '';
  }

  function uniqueItemsFromBookmarkReport(report) {
    var out = [];
    var seen = {};
    if (report && report.uniqueItems && typeof report.uniqueItems === 'object') {
      for (var k in report.uniqueItems) if (report.uniqueItems.hasOwnProperty(k)) {
        var it = report.uniqueItems[k] || {};
        if (it.id != null && !seen[String(it.id)]) { seen[String(it.id)] = true; out.push(it); }
      }
    }
    if (!out.length && report && isArray(report.catalog)) {
      for (var i = 0; i < report.catalog.length; i++) {
        var c = report.catalog[i] || {};
        if (c.id != null && !seen[String(c.id)]) { seen[String(c.id)] = true; out.push(c); }
      }
    }
    out.sort(function (a, b) { return String(a.id || '').localeCompare(String(b.id || ''), undefined, { numeric: true }); });
    return out;
  }

  function tmdbKindForItem(item) {
    var k = String(item && item.normalized_kind || '').toLowerCase();
    if (k === 'tv' || k === 'serial' || k === 'series') return 'tv';
    if (k === 'movie' || k === 'documovie' || k === 'concert') return 'movie';
    return k || 'unknown';
  }

  function candidateFromTmdb(row, mediaType) {
    row = row || {};
    var date = row.release_date || row.first_air_date || '';
    return {
      id: row.id != null ? String(row.id) : '',
      media_type: mediaType || row.media_type || '',
      title: String(row.title || row.name || ''),
      original_title: String(row.original_title || row.original_name || ''),
      year: date ? String(date).slice(0, 4) : '',
      release_date: String(date || ''),
      poster_path: String(row.poster_path || ''),
      vote_average: row.vote_average != null ? row.vote_average : ''
    };
  }

  function tmdbApiLampa(path, params) {
    return new Promise(function (resolve, reject) {
      if (!window.Lampa || !Lampa.TMDB || !Lampa.TMDB.api) {
        reject({ status: 'no_lampa_tmdb_api', message: 'Lampa.TMDB.api is not available' });
        return;
      }
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; reject({ status: 'timeout', provider: 'lampa_tmdb_api', message: 'TMDB API timeout' }); }
      }, MATCH_TIMEOUT_MS);
      function ok(json) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        var parsed = parseJson(json) || {};
        if (isObject(parsed)) parsed._kp_tmdb_source = 'lampa_tmdb_api';
        resolve(parsed);
      }
      function fail(err) { if (done) return; done = true; clearTimeout(timer); reject(err || { status: 'tmdb_error', provider: 'lampa_tmdb_api' }); }
      var url = addUrlParams(path, params || {});
      try {
        var r = Lampa.TMDB.api(url, ok, fail);
        if (r && typeof r.then === 'function') r.then(ok).catch(fail);
      } catch (e1) {
        try {
          var r2 = Lampa.TMDB.api(path, params || {}, ok, fail);
          if (r2 && typeof r2.then === 'function') r2.then(ok).catch(fail);
        } catch (e2) {
          fail({ status: 'tmdb_exception', provider: 'lampa_tmdb_api', message: String((e2 && e2.message) || (e1 && e1.message) || e2 || e1) });
        }
      }
    });
  }

  function cubDomain() {
    var d = '';
    try { d = window.Manifest && Manifest.cub_domain || ''; } catch (e) {}
    if (!d) {
      try { d = storageGet('cub_domain', '') || storageGet('account_cub_domain', '') || ''; } catch (e2) {}
    }
    d = String(d || 'cub.red').replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    return d || 'cub.red';
  }

  function tmdbProxyUrls(path, params) {
    var cd = cubDomain();
    var cleanPath = String(path || '').replace(/^\/+/, '');
    var qs = encodeParams(params || {});
    var suffix = cleanPath + (qs ? '?' + qs : '');
    var out = [
      { provider: 'tmdb_proxy_cub', url: 'https://apitmdb.' + cd + '/3/' + suffix },
      { provider: 'tmdb_proxy_backup', url: 'https://lampa.byskaz.ru/tmdb/api/3/' + suffix }
    ];
    return out;
  }

  function fetchJsonUrl(url, provider) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; reject({ status: 'timeout', provider: provider, message: 'Proxy timeout', url: url }); }
      }, MATCH_TIMEOUT_MS);
      function ok(json) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        var parsed = parseJson(json) || {};
        if (isObject(parsed)) parsed._kp_tmdb_source = provider;
        resolve(parsed);
      }
      function fail(err) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(err || { status: 'proxy_error', provider: provider, url: url });
      }
      try {
        if (window.fetch) {
          window.fetch(url, { cache: 'no-store' }).then(function (r) {
            if (!r || !r.ok) { fail({ status: 'http_error', provider: provider, http: r && r.status, statusText: r && r.statusText, url: url }); return; }
            r.text().then(function (text) { ok(text); }).catch(fail);
          }).catch(function (e) { fail({ status: 'fetch_error', provider: provider, message: String(e && e.message || e), url: url }); });
          return;
        }
      } catch (e1) {}
      try {
        var net = new Lampa.Reguest();
        try { if (net.timeout) net.timeout(MATCH_TIMEOUT_MS); } catch (e2) {}
        net.silent(url, function (json) { ok(json); }, function (xhr, status) { fail({ status: status || 'request_error', provider: provider, http: xhr && xhr.status, url: url }); }, false, {});
      } catch (e3) { fail({ status: 'request_exception', provider: provider, message: String(e3 && e3.message || e3), url: url }); }
    });
  }

  function tmdbApiProxy(path, params) {
    var urls = tmdbProxyUrls(path, params);
    var errors = [];
    function next(i) {
      if (i >= urls.length) return Promise.reject({ status: 'all_proxy_failed', provider: 'tmdb_proxy', errors: errors });
      return fetchJsonUrl(urls[i].url, urls[i].provider).catch(function (err) { errors.push(errorSummary(err)); return next(i + 1); });
    }
    return next(0);
  }

  function preferredTmdbProvider() {
    var diag = getTmdbDiag && getTmdbDiag();
    var p = diag && diag.provider || '';
    return String(p || '');
  }

  function tmdbApi(path, params) {
    var preferred = preferredTmdbProvider();
    if (preferred.indexOf('tmdb_proxy') === 0) {
      return tmdbApiProxy(path, params).catch(function (proxyErr) {
        return tmdbApiLampa(path, params).catch(function (lampaErr) {
          return Promise.reject({ status: 'all_tmdb_methods_failed', provider: 'auto', proxy: errorSummary(proxyErr), lampa: errorSummary(lampaErr) });
        });
      });
    }
    return tmdbApiLampa(path, params).catch(function (lampaErr) {
      return tmdbApiProxy(path, params).catch(function (proxyErr) {
        return Promise.reject({ status: 'all_tmdb_methods_failed', provider: 'auto', lampa: errorSummary(lampaErr), proxy: errorSummary(proxyErr) });
      });
    });
  }

  function tmdbDiagnosticProbe(imdb) {
    var started = Date.now();
    imdb = imdb || 'tt0111161';
    var diag = {
      version: VERSION,
      checkedAt: nowIso(),
      timeoutMs: MATCH_TIMEOUT_MS,
      lampaPresent: !!window.Lampa,
      tmdbApiPresent: !!(window.Lampa && Lampa.TMDB && Lampa.TMDB.api),
      testImdb: imdb,
      ok: false,
      durationMs: 0,
      error: null,
      rawCounts: null,
      provider: '',
      cubDomain: cubDomain(),
      proxyUrls: tmdbProxyUrls('find/' + encodeURIComponent(imdb), { external_source: 'imdb_id' }).map(function (x) { return { provider: x.provider, url: x.url.replace(/external_source=.*/, 'external_source=imdb_id') }; }),
      recommendation: ''
    };
    if (!diag.tmdbApiPresent) {
      diag.durationMs = 0;
      diag.error = { status: 'no_lampa_tmdb_api', message: 'Lampa.TMDB.api is not available' };
      diag.recommendation = 'Откройте Lampa полностью и проверьте, что TMDB-модуль доступен. Без него сопоставление невозможно.';
      storageSet(KEY.tmdbDiag, diag);
      return Promise.resolve(diag);
    }
    return tmdbFindByImdb(imdb).then(function (json) {
      var j = parseJson(json) || {};
      diag.ok = true;
      diag.durationMs = Date.now() - started;
      diag.provider = String(j._kp_tmdb_source || 'unknown');
      diag.rawCounts = {
        movie_results: isArray(j.movie_results) ? j.movie_results.length : 0,
        tv_results: isArray(j.tv_results) ? j.tv_results.length : 0,
        tv_episode_results: isArray(j.tv_episode_results) ? j.tv_episode_results.length : 0,
        tv_season_results: isArray(j.tv_season_results) ? j.tv_season_results.length : 0
      };
      diag.recommendation = 'TMDB/Lampa API отвечает через ' + diag.provider + '. Можно запускать сопоставление небольшим лимитом.';
      storageSet(KEY.tmdbDiag, diag);
      return diag;
    }).catch(function (err) {
      diag.ok = false;
      diag.durationMs = Date.now() - started;
      diag.error = errorSummary(err);
      diag.recommendation = diag.error && diag.error.status === 'timeout'
        ? 'TMDB/Lampa API не отвечает за ' + MATCH_TIMEOUT_MS + ' мс. Если установлен TMDB Proxy, проверьте, что он загружен первым и что домен CUB/backup доступен.'
        : 'TMDB/Lampa API вернул ошибку. Проверьте сеть/VPN, TMDB Proxy и работоспособность TMDB в Lampa.';
      storageSet(KEY.tmdbDiag, diag);
      return diag;
    });
  }

  function diagnoseTmdbApi() {
    noty(lang('tmdb_checking'));
    setStatus(lang('tmdb_checking'));
    return tmdbDiagnosticProbe('tt0111161').then(function (diag) {
      setStatus((diag.ok ? lang('tmdb_ok') : lang('tmdb_bad')) + ' (' + diag.durationMs + ' ms, ' + (diag.provider || 'no provider') + ')');
      noty(diag.ok ? lang('tmdb_ok') : lang('tmdb_bad'));
      return diag;
    });
  }

  function getTmdbDiag() { return storageGet(KEY.tmdbDiag, null); }

  function buildTmdbDiagText(diag) {
    if (!diag) return lang('tmdb_diag_missing');
    var lines = [];
    lines.push('KinoPUB Sync v' + VERSION + ' — диагностика TMDB/Lampa API');
    lines.push('Дата: ' + (diag.checkedAt || ''));
    lines.push('Lampa есть: ' + (diag.lampaPresent ? 'да' : 'нет'));
    lines.push('Lampa.TMDB.api есть: ' + (diag.tmdbApiPresent ? 'да' : 'нет'));
    lines.push('Тестовый IMDb: ' + (diag.testImdb || ''));
    lines.push('Провайдер ответа: ' + (diag.provider || ''));
    lines.push('CUB домен: ' + (diag.cubDomain || ''));
    if (diag.proxyUrls) lines.push('TMDB Proxy URLs: ' + JSON.stringify(diag.proxyUrls));
    lines.push('Таймаут на метод: ' + (diag.timeoutMs || MATCH_TIMEOUT_MS) + ' ms');
    lines.push('Результат: ' + (diag.ok ? 'OK' : 'ERROR'));
    lines.push('Время ответа: ' + (diag.durationMs || 0) + ' ms');
    if (diag.rawCounts) lines.push('TMDB counts: ' + JSON.stringify(diag.rawCounts));
    if (diag.error) lines.push('Ошибка: ' + JSON.stringify(diag.error));
    if (diag.recommendation) lines.push('Рекомендация: ' + diag.recommendation);
    return lines.join('\n');
  }

  function showTmdbDiag() { showText('KinoPUB Sync ' + VERSION + ' — диагностика TMDB/Lampa', buildTmdbDiagText(getTmdbDiag())); }

  function copyTmdbDiag() {
    var text = buildTmdbDiagText(getTmdbDiag());
    return copyText(text).then(function () { noty(lang('copied')); }).catch(function () { noty(lang('copy_failed')); });
  }

  function tmdbFindByImdb(imdb) {
    return tmdbApi('find/' + encodeURIComponent(imdb), { external_source: 'imdb_id' });
  }

  function markBlocked(result, status, reason, candidates) {
    result.status = status;
    result.reason = reason || '';
    result.import_allowed = false;
    result.blocked = true;
    result.block_reason = status;
    if (candidates) result.candidates = candidates;
    return result;
  }

  function markImportCandidate(result, tmdbCandidate, item) {
    result.status = 'matched_import_candidate';
    result.reason = item && item.kinopoisk_id ? 'matched_by_imdb_with_kinopoisk_reference' : 'matched_by_imdb_only';
    result.match_source = result.provider || 'tmdb_find_imdb';
    result.confidence = 'exact_imdb_external_id_and_expected_media_type';
    result.import_allowed = true;
    result.blocked = false;
    result.block_reason = '';
    result.external_id_set = item && item.kinopoisk_id ? 'imdb_kinopoisk' : 'imdb_only';
    result.tmdb = tmdbCandidate;
    result.import_card = {
      source: 'tmdb',
      id: tmdbCandidate && tmdbCandidate.id || '',
      media_type: tmdbCandidate && tmdbCandidate.media_type || '',
      note: 'Future import must add this resolved TMDB/Lampa card, not the KinoPUB item_id.'
    };
    return result;
  }

  function analyzeTmdbFind(json, item, imdb) {
    json = parseJson(json) || {};
    var provider = String(json._kp_tmdb_source || '');
    var movieResults = isArray(json.movie_results) ? json.movie_results : [];
    var tvResults = isArray(json.tv_results) ? json.tv_results : [];
    var kind = tmdbKindForItem(item);
    var preferred = kind === 'tv' ? tvResults : (kind === 'movie' ? movieResults : movieResults.concat(tvResults));
    var other = kind === 'tv' ? movieResults : (kind === 'movie' ? tvResults : []);
    var result = baseMatchResult(item, imdb);
    result.provider = provider;
    result.tmdb_raw_counts = { movie_results: movieResults.length, tv_results: tvResults.length };
    result.tmdb_expected_media_type = kind;
    if (preferred.length === 1) {
      var mediaType = kind === 'tv' ? 'tv' : (kind === 'movie' ? 'movie' : (preferred[0].media_type || ''));
      return markImportCandidate(result, candidateFromTmdb(preferred[0], mediaType), item);
    }
    if (preferred.length > 1) {
      var pc = [];
      for (var i = 0; i < preferred.length && i < 10; i++) pc.push(candidateFromTmdb(preferred[i], kind === 'tv' ? 'tv' : 'movie'));
      return markBlocked(result, 'blocked_ambiguous', 'tmdb_find_returned_multiple_preferred_results', pc);
    }
    if (other.length === 1) {
      return markBlocked(result, 'blocked_kind_mismatch', 'tmdb_find_returned_only_other_media_type', [candidateFromTmdb(other[0], kind === 'tv' ? 'movie' : 'tv')]);
    }
    if (other.length > 1) {
      var oc = [];
      for (var j = 0; j < other.length && j < 10; j++) oc.push(candidateFromTmdb(other[j], kind === 'tv' ? 'movie' : 'tv'));
      return markBlocked(result, 'blocked_kind_mismatch', 'tmdb_find_returned_multiple_other_media_type_results', oc);
    }
    return markBlocked(result, 'blocked_no_tmdb_result', 'tmdb_find_returned_no_movie_or_tv_results');
  }

  function baseMatchResult(item, imdb) {
    return {
      kinopub: {
        id: String(item && item.id || ''),
        title: String(item && item.title || ''),
        type: String(item && item.type || ''),
        subtype: String(item && item.subtype || ''),
        normalized_kind: String(item && item.normalized_kind || ''),
        year: String(item && item.year || ''),
        imdb_id: String(item && item.imdb_id || ''),
        kinopoisk_id: String(item && item.kinopoisk_id || ''),
        tmdb_id: String(item && item.tmdb_id || ''),
        folders: item && item.folders ? item.folders : []
      },
      imdb_query: imdb || '',
      status: 'unknown',
      reason: '',
      match_source: '',
      confidence: '',
      external_id_set: '',
      import_allowed: false,
      blocked: true,
      block_reason: '',
      tmdb: null,
      import_card: null
    };
  }

  function matchOneItem(item) {
    var imdb = padImdb(item && item.imdb_id);
    var kp = String(item && item.kinopoisk_id || '');
    if (!imdb) {
      var skipped = baseMatchResult(item, '');
      if (kp) {
        skipped.match_source = 'none_kinopoisk_only';
        skipped.external_id_set = 'kinopoisk_only';
        return Promise.resolve(markBlocked(skipped, 'blocked_kinopoisk_only', 'kinopub_item_has_kinopoisk_id_but_no_imdb_id; no reliable Kinopoisk->TMDB/Lampa resolver is available in this build'));
      }
      skipped.match_source = 'none_no_external_id';
      skipped.external_id_set = 'none';
      return Promise.resolve(markBlocked(skipped, 'blocked_no_external_id', 'kinopub_item_has_no_imdb_id_and_no_kinopoisk_id'));
    }
    return tmdbFindByImdb(imdb).then(function (json) { return analyzeTmdbFind(json, item, imdb); }).catch(function (err) {
      var failed = baseMatchResult(item, imdb);
      failed.error = errorSummary(err);
      return markBlocked(failed, 'blocked_api_error', failed.error.message);
    });
  }

  function updateMatchStats(stats, res) {
    stats.checked++;
    var st = String(res && res.status || 'unknown');
    stats.byStatus[st] = (stats.byStatus[st] || 0) + 1;
    if (res && res.import_allowed) {
      stats.importCandidates++;
      stats.matched++;
      var mt = res && res.tmdb && res.tmdb.media_type || '';
      if (mt === 'movie') stats.movieMatched++;
      else if (mt === 'tv') stats.tvMatched++;
      if (res.external_id_set === 'imdb_kinopoisk') stats.importCandidatesWithKinopoisk++;
      else stats.importCandidatesImdbOnly++;
      return;
    }
    stats.blocked++;
    if (st === 'blocked_kinopoisk_only') { stats.blockedKinopoiskOnly++; stats.skippedNoImdb++; stats.skippedKinopoiskOnly++; }
    else if (st === 'blocked_no_external_id') { stats.blockedNoExternalId++; stats.skippedNoImdb++; stats.skippedNoExternalId++; }
    else if (st === 'blocked_no_tmdb_result') { stats.blockedNoTmdbResult++; stats.noResult++; }
    else if (st === 'blocked_ambiguous') { stats.blockedAmbiguous++; stats.ambiguous++; }
    else if (st === 'blocked_kind_mismatch') { stats.blockedKindMismatch++; stats.kindMismatch++; }
    else if (st === 'blocked_api_error') { stats.blockedApiError++; stats.apiError++; }
  }

  function runPool(items, concurrency, worker) {
    concurrency = Math.max(1, concurrency || 1);
    return new Promise(function (resolve) {
      var next = 0, active = 0, done = 0;
      if (!items.length) { resolve(); return; }
      function pump() {
        while (active < concurrency && next < items.length) {
          (function (idx) {
            active++;
            Promise.resolve(worker(items[idx], idx)).catch(function () {}).then(function () {
              active--; done++;
              if (done >= items.length) resolve(); else pump();
            });
          })(next++);
        }
      }
      pump();
    });
  }

  function buildMatchSummary(report) {
    var lines = [];
    lines.push('KinoPUB Sync v' + VERSION + ' — отчёт готовности импорта KinoPUB → TMDB/Lampa');
    lines.push('Дата: ' + report.generatedAt);
    lines.push('Источник: отчёт закладок от ' + (report.basedOnBookmarksReportAt || 'unknown'));
    lines.push('Режим: read-only. Импорт-кандидатом считается только карточка, для которой по IMDb получена настоящая TMDB/Lampa card и тип movie/tv совпал. Kinopoisk ID хранится как диагностический внешний ID; Kinopoisk-only не импортируется без отдельного резолвера.');
    if (report.aborted) {
      lines.push('ВНИМАНИЕ: проверка остановлена досрочно: ' + (report.abortReason || 'unknown'));
      if (report.abortRecommendation) lines.push('Рекомендация: ' + report.abortRecommendation);
    }
    if (report.tmdbPreflight) lines.push('TMDB preflight: ' + (report.tmdbPreflight.ok ? 'OK' : 'ERROR') + ', ' + (report.tmdbPreflight.durationMs || 0) + ' ms');
    lines.push('Проверено: ' + report.stats.checked + ' из ' + report.stats.total);
    lines.push('Кандидатов к будущему импорту: ' + report.stats.importCandidates + ' (movie: ' + report.stats.movieMatched + ', tv: ' + report.stats.tvMatched + ')');
    lines.push('  - с IMDb + Kinopoisk reference: ' + (report.stats.importCandidatesWithKinopoisk || 0));
    lines.push('  - только IMDb: ' + (report.stats.importCandidatesImdbOnly || 0));
    lines.push('Заблокировано: ' + report.stats.blocked);
    lines.push('  - только Kinopoisk ID, без IMDb: ' + (report.stats.blockedKinopoiskOnly || 0));
    lines.push('  - нет IMDb/Kinopoisk: ' + (report.stats.blockedNoExternalId || 0));
    lines.push('  - TMDB не нашёл результат по IMDb: ' + (report.stats.blockedNoTmdbResult || 0));
    lines.push('  - несовпадение типа movie/tv: ' + (report.stats.blockedKindMismatch || 0));
    lines.push('  - неоднозначно: ' + (report.stats.blockedAmbiguous || 0));
    lines.push('  - ошибок API: ' + (report.stats.blockedApiError || 0));
    lines.push('Статусы: ' + JSON.stringify(report.stats.byStatus));
    if (report.blockedItems && report.blockedItems.length) {
      lines.push('');
      lines.push('Первые заблокированные элементы:');
      for (var i = 0; i < report.blockedItems.length && i < 20; i++) {
        var p = report.blockedItems[i];
        lines.push('- ' + p.status + ': ' + p.kinopub.id + ' — ' + p.kinopub.title + ' (' + (p.kinopub.year || '') + '), IMDb: ' + (p.imdb_query || p.kinopub.imdb_id || 'нет') + ', Kinopoisk: ' + (p.kinopub.kinopoisk_id || 'нет'));
      }
      if (report.blockedItems.length > 20) lines.push('- ... ещё ' + (report.blockedItems.length - 20));
    }
    lines.push('');
    lines.push('Важно: v' + VERSION + ' ничего не добавляет в Lampa и ничего не меняет в KinoPUB. В будущем импорте можно использовать только importCandidates; blockedItems нельзя импортировать автоматически.');
    return lines.join('\n');
  }

  function runMatchAudit() {
    var bm = getReport();
    if (!bm || !bm.generatedAt) { noty(lang('no_bookmark_report')); return Promise.resolve(false); }
    var items = uniqueItemsFromBookmarkReport(bm);
    var limit = getInt(KEY.matchLimit, 0);
    var selected = limit > 0 ? items.slice(0, limit) : items.slice(0);
    var report = {
      version: VERSION,
      edition: EDITION,
      generatedAt: nowIso(),
      source: 'KinoPUB -> TMDB/Lampa read-only import readiness audit',
      basedOnBookmarksReportAt: bm.generatedAt || '',
      tokensIncluded: false,
      mode: { requestedTotal: items.length, checkedTotal: selected.length, limit: limit, timeoutMs: MATCH_TIMEOUT_MS, concurrency: MATCH_CONCURRENCY, abortApiErrors: MATCH_ABORT_API_ERRORS, note: 'Only resolved TMDB/Lampa cards found by IMDb are import candidates. Kinopoisk ID is diagnostic unless a reliable Kinopoisk->TMDB/Lampa resolver is implemented. No import. v0.1.4 uses TMDB preflight, tries Lampa.TMDB.api and TMDB Proxy fallback, and stops early on repeated API timeouts/errors.' },
      tmdbPreflight: null,
      aborted: false,
      abortReason: '',
      abortRecommendation: '',
      stats: {
        total: selected.length,
        checked: 0,
        matched: 0,
        importCandidates: 0,
        importCandidatesWithKinopoisk: 0,
        importCandidatesImdbOnly: 0,
        movieMatched: 0,
        tvMatched: 0,
        blocked: 0,
        blockedKinopoiskOnly: 0,
        blockedNoExternalId: 0,
        blockedNoTmdbResult: 0,
        blockedKindMismatch: 0,
        blockedAmbiguous: 0,
        blockedApiError: 0,
        skippedNoImdb: 0,
        skippedKinopoiskOnly: 0,
        skippedNoExternalId: 0,
        noResult: 0,
        ambiguous: 0,
        kindMismatch: 0,
        apiError: 0,
        byStatus: {}
      },
      results: [],
      importCandidates: [],
      blockedItems: [],
      problemItems: []
    };
    if (!selected.length) { report.summaryText = buildMatchSummary(report); storageSet(KEY.matchReport, report); return Promise.resolve(report); }
    noty(lang('tmdb_checking'));
    setStatus(lang('tmdb_checking'));
    var results = new Array(selected.length);
    var progress = 0;
    var apiErrorStreak = 0;
    function finishMatchReport(message) {
      report.results = results.filter(function (v) { return !!v; });
      report.summaryText = buildMatchSummary(report);
      storageSet(KEY.matchReport, report);
      setStatus(message || (lang('match_done') + ': import candidates ' + report.stats.importCandidates + '/' + report.stats.checked + ', blocked ' + report.stats.blocked));
      noty(lang('match_done'));
      return report;
    }
    return tmdbDiagnosticProbe('tt0111161').then(function (diag) {
      report.tmdbPreflight = diag;
      if (!diag.ok) {
        report.aborted = true;
        report.abortReason = 'tmdb_preflight_failed';
        report.abortRecommendation = diag.recommendation || 'Проверьте доступность TMDB/Lampa API перед массовым сопоставлением.';
        return finishMatchReport('Сопоставление остановлено: TMDB/Lampa API недоступен (' + (diag.error && diag.error.message || 'error') + ')');
      }
      noty(lang('matching'));
      setStatus(lang('matching'));
      return runPool(selected, MATCH_CONCURRENCY, function (item, idx) {
        if (report.aborted) return Promise.resolve();
        return matchOneItem(item).then(function (res) {
          if (report.aborted) return;
          results[idx] = res;
          updateMatchStats(report.stats, res);
          if (res.import_allowed) report.importCandidates.push(res);
          else { report.blockedItems.push(res); report.problemItems.push(res); }
          progress++;
          if (String(res && res.status || '') === 'blocked_api_error') apiErrorStreak++; else apiErrorStreak = 0;
          if (apiErrorStreak >= MATCH_ABORT_API_ERRORS) {
            report.aborted = true;
            report.abortReason = 'too_many_consecutive_api_errors';
            report.abortRecommendation = 'Получено ' + apiErrorStreak + ' подряд ошибок TMDB/Lampa API. Проверка остановлена, чтобы не ждать десятки минут. Проверьте VPN/доступ к TMDB или выполните диагностику TMDB.';
          }
          if (progress === 1 || progress % 10 === 0 || progress === selected.length || report.aborted) setStatus(lang('matching') + ' ' + progress + '/' + selected.length + (report.aborted ? ' — остановлено' : ''));
        });
      }).then(function () {
        return finishMatchReport();
      });
    }).catch(function (err) {
      report.error = errorSummary(err);
      report.aborted = true;
      report.abortReason = 'match_exception';
      report.abortRecommendation = 'Проверка завершилась исключением. Скопируйте полный отчёт.';
      return finishMatchReport('Ошибка сопоставления: ' + report.error.message);
    });
  }

  function getMatchReport() { return storageGet(KEY.matchReport, null); }
  function matchReportText() { var r = getMatchReport(); return r ? JSON.stringify(r, null, 2) : lang('match_missing'); }
  function showMatchReport() { var r = getMatchReport(); if (!r) { noty(lang('match_missing')); return; } showText('KinoPUB Sync 0.1.4 — готовность импорта', r.summaryText || matchReportText()); }
  function copyMatchReport() { var text = matchReportText(); return copyText(text).then(function () { noty(lang('copied')); }).catch(function () { noty(lang('copy_failed')); showText('KinoPUB Sync 0.1.4 — отчёт готовности импорта', text); }); }
  function clearMatchReport() { storageRemove(KEY.matchReport); noty(lang('match_report_cleared')); }

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
  function showCleanupReport() { var r = cleanupReport(); if (!r) { noty(lang('cleanup_missing')); return; } showText('KinoPUB Sync 0.1.4 — очистка Lampa', JSON.stringify(r, null, 2)); }
  function copyCleanupReport() { var text = cleanupReportText(); return copyText(text).then(function () { noty(lang('copied')); }).catch(function () { noty(lang('copy_failed')); showText('KinoPUB Sync 0.1.4 — очистка Lampa', text); }); }

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
    var apiName = 'KinoPubSync014';
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
      addParam('kp_sync014_sep_main', 'title', '', '', lang('sep'), lang('sep_descr'));
      addParam(KEY.lastStatus, 'input', storageGet(KEY.lastStatus, '') || '', '', lang('status'), lang('status_descr'));
      addParam('kp_sync014_action_check_token', 'button', '', '', lang('check_token'), lang('check_token_descr'), function () { checkToken(); });
      addParam('kp_sync014_action_read_bookmarks', 'button', '', '', lang('read_bookmarks'), lang('read_bookmarks_descr'), function () { readBookmarks(); });
      addParam('kp_sync014_action_show_report', 'button', '', '', lang('show_report'), lang('show_report_descr'), function () { showReport(); });
      addParam('kp_sync014_action_copy_report', 'button', '', '', lang('copy_report'), lang('copy_report_descr'), function () { copyReport(); });
      addParam('kp_sync014_action_clear_report', 'button', '', '', lang('clear_report'), lang('clear_report_descr'), function () { clearReport(); });
      addParam('kp_sync014_sep_match', 'title', '', '', lang('sep_match'), lang('sep_match_descr'));
      addParam(KEY.matchLimit, 'input', storageGet(KEY.matchLimit, '0') || '0', '', lang('match_limit'), lang('match_limit_descr'));
      addParam('kp_sync014_action_test_tmdb', 'button', '', '', lang('test_tmdb'), lang('test_tmdb_descr'), function () { diagnoseTmdbApi(); });
      addParam('kp_sync014_action_show_tmdb_diag', 'button', '', '', lang('show_tmdb_diag'), lang('show_tmdb_diag_descr'), function () { showTmdbDiag(); });
      addParam('kp_sync014_action_copy_tmdb_diag', 'button', '', '', lang('copy_tmdb_diag'), lang('copy_tmdb_diag_descr'), function () { copyTmdbDiag(); });
      addParam('kp_sync014_action_run_match', 'button', '', '', lang('run_match'), lang('run_match_descr'), function () { runMatchAudit(); });
      addParam('kp_sync014_action_show_match', 'button', '', '', lang('show_match'), lang('show_match_descr'), function () { showMatchReport(); });
      addParam('kp_sync014_action_copy_match', 'button', '', '', lang('copy_match'), lang('copy_match_descr'), function () { copyMatchReport(); });
      addParam('kp_sync014_action_clear_match', 'button', '', '', lang('clear_match'), lang('clear_match_descr'), function () { clearMatchReport(); });
      addParam('kp_sync014_sep_cleanup', 'title', '', '', lang('sep_cleanup'), lang('sep_cleanup_descr'));
      addParam('kp_sync014_action_scan_cleanup', 'button', '', '', lang('scan_bad_lampa'), lang('scan_bad_lampa_descr'), function () { scanOldLampaBookmarks(); });
      addParam('kp_sync014_action_show_cleanup', 'button', '', '', lang('show_cleanup'), lang('show_cleanup_descr'), function () { showCleanupReport(); });
      addParam('kp_sync014_action_copy_cleanup', 'button', '', '', lang('copy_cleanup'), lang('copy_cleanup_descr'), function () { copyCleanupReport(); });
      addParam('kp_sync014_action_apply_cleanup', 'button', '', '', lang('clear_bad_lampa'), lang('clear_bad_lampa_descr'), function () { applyOldLampaCleanup(); });
    } catch (e) { log('settings failed', e && e.message); }
  }

  function start() {
    if (window.KinoPubSync014 && window.KinoPubSync014._started) return;
    window.KinoPubSync014 = {
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
      runMatchAudit: runMatchAudit,
      matchReport: getMatchReport,
      matchReportText: matchReportText,
      showMatchReport: showMatchReport,
      copyMatchReport: copyMatchReport,
      clearMatchReport: clearMatchReport,
      diagnoseTmdbApi: diagnoseTmdbApi,
      tmdbDiag: getTmdbDiag,
      copyTmdbDiag: copyTmdbDiag,
      showTmdbDiag: showTmdbDiag,
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
    log('started', 'alpha read-only audit + import readiness with TMDB preflight and timeout guard');
  }

  if (window.appready) start();
  else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
    try { Lampa.Listener.follow('app', function (e) { if (!e || e.type === 'ready') start(); }); } catch (e2) { setTimeout(start, 3000); }
  } else setTimeout(start, 3000);
})();
