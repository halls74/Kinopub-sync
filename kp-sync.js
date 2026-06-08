(function () {
  'use strict';

  var VERSION = '0.0.1';
  var EDITION = 'alpha-readonly';
  var COMPONENT = 'kp_sync001';
  var LOG = '[KinoPUB Sync 0.0.1]';
  var API_HOST = 'https://api.service-kp.com';
  var CLIENT_ID = 'xbmc';
  var CLIENT_SECRET = 'cgg3gtifu46urtfp2zp1nqtba0k2ezxh';
  var MAX_PAGES_PER_FOLDER = 50;
  var PER_PAGE = 100;
  var REPORT_SAMPLE_LIMIT = 10;

  var KEY = {
    token: 'kp_token',
    refresh: 'kp_refresh',
    lastStatus: 'kp_sync001_last_status',
    report: 'kp_sync001_bookmarks_report',
    tokenStatus: 'kp_sync001_token_status'
  };

  if (window.KinoPubSync001 && window.KinoPubSync001.version === VERSION) return;

  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return String(Date.now()); }
  }

  function isArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
  }

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
      component: 'KinoPUB Sync 0.0.1',
      sep: '— Проверка и чтение KinoPUB —',
      sep_descr: 'Тестовая read-only сборка. Ничего не импортирует в Lampa и ничего не меняет в KinoPUB.',
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
      no_token: 'Токен KinoPUB не найден. Сначала авторизуйтесь в основном KinoPUB-плагине.',
      token_ok: 'Токен найден, API доступен',
      token_refresh_ok: 'Токен обновлён через refresh_token, API доступен',
      token_bad: 'Токен найден, но API недоступен',
      reading: 'Читаю папки и закладки KinoPUB...',
      report_missing: 'Отчёт ещё не сформирован.',
      report_cleared: 'Отчёт очищен.',
      copied: 'Отчёт скопирован.',
      copy_failed: 'Не удалось скопировать автоматически. Открыл текст отчёта.',
      done: 'Чтение завершено'
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

  function setStatus(text) {
    text = String(text || '');
    storageSet(KEY.lastStatus, text);
    log(text);
    try { if (window.Lampa && Lampa.Storage && Lampa.Storage.set) Lampa.Storage.set(KEY.lastStatus, text); } catch (e) {}
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

  function copyText(text) {
    text = String(text || '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
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
    for (var k in obj) if (obj.hasOwnProperty(k) && obj[k] !== undefined && obj[k] !== null) {
      out.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(obj[k])));
    }
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
  function setTokens(access, refresh) {
    if (access) storageSet(KEY.token, access);
    if (refresh) storageSet(KEY.refresh, refresh);
  }

  function refreshToken() {
    var rt = tokenRefresh();
    if (!rt) return Promise.reject({ status: 'no_refresh_token' });
    return request('POST', API_HOST + '/oauth2/token', encodeParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: rt
    }), { 'Content-Type': 'application/x-www-form-urlencoded' }, 20000).then(function (json) {
      if (json && json.access_token) {
        setTokens(json.access_token, json.refresh_token);
        return json;
      }
      return Promise.reject({ status: 'bad_refresh_response', body: json });
    });
  }

  function apiGet(path, params, retried) {
    var t = tokenAccess();
    if (!t) return Promise.reject({ status: 401, reason: 'no_token' });
    return request('GET', addUrlParams(API_HOST + '/v1' + path, params || {}), false, { 'Authorization': 'Bearer ' + t }, 30000).catch(function (err) {
      var http = err && (err.http || (err.xhr && err.xhr.status));
      if (http === 401 && !retried && tokenRefresh()) {
        return refreshToken().then(function () { return apiGet(path, params, true); });
      }
      return Promise.reject(err);
    });
  }

  function asArray(json) {
    json = parseJson(json);
    if (!json) return [];
    if (isArray(json)) return json;
    if (isArray(json.items)) return json.items;
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

  function normalizeItem(item, folder) {
    item = item || {};
    var id = itemId(item);
    var title = firstValue(item, ['title', 'name', 'ru_title', 'original_title', 'original_name', 'imdb_title']);
    var type = firstValue(item, ['type', 'media_type', 'kind', 'category']);
    var year = firstValue(item, ['year', 'release_year', 'released', 'premiered']);
    return {
      id: id,
      title: String(title || ''),
      type: String(type || ''),
      year: String(year || ''),
      imdb_id: String(externalValue(item, ['imdb', 'imdb_id', 'imdbid']) || ''),
      tmdb_id: String(externalValue(item, ['tmdb', 'tmdb_id', 'tmdbid']) || ''),
      kinopoisk_id: String(externalValue(item, ['kinopoisk', 'kinopoisk_id', 'kp_id', 'kp']) || ''),
      folder_id: folder ? String(folder.id) : '',
      folder_title: folder ? String(folder.title || '') : '',
      raw_keys: item && typeof item === 'object' ? Object.keys(item).sort() : []
    };
  }

  function sanitizeRawSample(item) {
    item = parseJson(item) || {};
    var out = {};
    var keys = Object.keys(item).sort();
    for (var i = 0; i < keys.length && i < 80; i++) {
      var k = keys[i];
      var v = item[k];
      if (/token|secret|password/i.test(k)) out[k] = '[REDACTED]';
      else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v;
      else if (isArray(v)) out[k] = '[Array:' + v.length + ']';
      else if (typeof v === 'object') out[k] = '[Object keys:' + Object.keys(v).slice(0, 20).join(',') + ']';
    }
    return out;
  }

  function checkToken() {
    var access = tokenAccess();
    var refresh = tokenRefresh();
    var base = { checkedAt: nowIso(), accessTokenPresent: !!access, refreshTokenPresent: !!refresh, verified: false, refreshed: false, error: null };
    if (!access) {
      storageSet(KEY.tokenStatus, base);
      setStatus(lang('no_token'));
      noty(lang('no_token'));
      return Promise.resolve(base);
    }
    return apiGet('/bookmarks', {}).then(function (json) {
      base.verified = true;
      base.foldersCount = asArray(json).length;
      storageSet(KEY.tokenStatus, base);
      setStatus(lang('token_ok') + '. Папок: ' + base.foldersCount);
      noty(lang('token_ok'));
      return base;
    }).catch(function (err) {
      var http = err && (err.http || (err.xhr && err.xhr.status));
      if (http === 401 && refresh) {
        return refreshToken().then(function () {
          base.refreshed = true;
          return apiGet('/bookmarks', {}).then(function (json) {
            base.verified = true;
            base.foldersCount = asArray(json).length;
            storageSet(KEY.tokenStatus, base);
            setStatus(lang('token_refresh_ok') + '. Папок: ' + base.foldersCount);
            noty(lang('token_refresh_ok'));
            return base;
          });
        }).catch(function (err2) {
          base.error = errorSummary(err2);
          storageSet(KEY.tokenStatus, base);
          setStatus(lang('token_bad') + ': ' + base.error.message);
          noty(lang('token_bad'));
          return base;
        });
      }
      base.error = errorSummary(err);
      storageSet(KEY.tokenStatus, base);
      setStatus(lang('token_bad') + ': ' + base.error.message);
      noty(lang('token_bad'));
      return base;
    });
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

  function folderId(folder) {
    return folder && folder.id != null ? String(folder.id) : '';
  }

  function folderTitle(folder) {
    return String((folder && (folder.title || folder.name)) || 'Без названия');
  }

  function readFolder(folder, report) {
    var fid = folderId(folder);
    var ftitle = folderTitle(folder);
    var expected = Number(folder && folder.count) || 0;
    var folderReport = {
      id: fid,
      title: ftitle,
      countReported: expected,
      pagesRequested: 0,
      itemsFetched: 0,
      uniqueItems: 0,
      missingByCount: 0,
      stoppedReason: '',
      error: null
    };
    var seen = {};
    var page = 1;

    function readNext() {
      if (page > MAX_PAGES_PER_FOLDER) { folderReport.stoppedReason = 'max_pages_guard'; return Promise.resolve(folderReport); }
      folderReport.pagesRequested++;
      return apiGet('/bookmarks/' + encodeURIComponent(fid), { page: page, perpage: PER_PAGE }).then(function (json) {
        var items = asArray(json);
        var newCount = 0;
        for (var i = 0; i < items.length; i++) {
          var norm = normalizeItem(items[i], { id: fid, title: ftitle });
          if (!norm.id) norm.id = 'no_id:' + fid + ':' + page + ':' + i;
          if (!seen[norm.id]) {
            seen[norm.id] = true;
            newCount++;
            folderReport.uniqueItems++;
            report.catalog.push(norm);
            if (!report._globalItems[norm.id]) report._globalItems[norm.id] = { id: norm.id, title: norm.title, type: norm.type, year: norm.year, folders: [] };
            report._globalItems[norm.id].folders.push({ id: fid, title: ftitle });
            if (report.rawSamples.length < REPORT_SAMPLE_LIMIT) report.rawSamples.push({ folder_id: fid, folder_title: ftitle, item: sanitizeRawSample(items[i]) });
          }
        }
        folderReport.itemsFetched += items.length;

        if (!items.length) { folderReport.stoppedReason = page === 1 ? 'empty_folder' : 'empty_page'; return folderReport; }
        if (expected && folderReport.uniqueItems >= expected) { folderReport.stoppedReason = 'reported_count_reached'; return folderReport; }
        if (page > 1 && newCount === 0) { folderReport.stoppedReason = 'no_new_items_page_maybe_ignored'; return folderReport; }
        if (!expected) { folderReport.stoppedReason = 'single_page_no_reported_count'; return folderReport; }
        if (items.length < PER_PAGE && !expected) { folderReport.stoppedReason = 'short_page'; return folderReport; }
        page++;
        return readNext();
      }).catch(function (err) {
        folderReport.error = errorSummary(err);
        folderReport.stoppedReason = 'error';
        return folderReport;
      });
    }

    return readNext().then(function (fr) {
      if (fr.countReported && fr.uniqueItems < fr.countReported) fr.missingByCount = fr.countReported - fr.uniqueItems;
      return fr;
    });
  }

  function buildReportSummary(report) {
    var lines = [];
    lines.push('KinoPUB Sync v' + VERSION + ' — отчёт чтения закладок');
    lines.push('Дата: ' + report.generatedAt);
    lines.push('Папок: ' + report.totals.folders);
    lines.push('Элементов по счётчикам папок: ' + report.totals.reportedItems);
    lines.push('Считано элементов в папках: ' + report.totals.fetchedItems);
    lines.push('Уникальных item id: ' + report.totals.uniqueItems);
    lines.push('Папок с ошибками: ' + report.totals.folderErrors);
    lines.push('Папок с недочётом по count: ' + report.totals.foldersWithMissingCount);
    lines.push('');
    lines.push('Важно: v0.0.1 ничего не импортирует в Lampa и ничего не меняет в KinoPUB.');
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
      api: { host: API_HOST, endpoints: ['/v1/bookmarks', '/v1/bookmarks/<folder_id>'] },
      folders: [],
      catalog: [],
      rawSamples: [],
      totals: { folders: 0, reportedItems: 0, fetchedItems: 0, uniqueItems: 0, folderErrors: 0, foldersWithMissingCount: 0 },
      _globalItems: {}
    };

    return apiGet('/bookmarks', {}).then(function (json) {
      var folders = asArray(json);
      report.totals.folders = folders.length;
      var chain = Promise.resolve();
      for (var i = 0; i < folders.length; i++) {
        (function (folder) {
          chain = chain.then(function () { return readFolder(folder, report).then(function (fr) { report.folders.push(fr); }); });
        })(folders[i]);
      }
      return chain;
    }).then(function () {
      var uniqueCount = 0;
      for (var k in report._globalItems) if (report._globalItems.hasOwnProperty(k)) uniqueCount++;
      report.totals.uniqueItems = uniqueCount;
      for (var i = 0; i < report.folders.length; i++) {
        report.totals.reportedItems += report.folders[i].countReported || 0;
        report.totals.fetchedItems += report.folders[i].uniqueItems || 0;
        if (report.folders[i].error) report.totals.folderErrors++;
        if (report.folders[i].missingByCount) report.totals.foldersWithMissingCount++;
      }
      report.uniqueItems = report._globalItems;
      delete report._globalItems;
      report.summaryText = buildReportSummary(report);
      storageSet(KEY.report, report);
      setStatus(lang('done') + ': папок ' + report.totals.folders + ', считано ' + report.totals.fetchedItems + ', уникальных ' + report.totals.uniqueItems + ', ошибок ' + report.totals.folderErrors);
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

  function getReport() {
    return storageGet(KEY.report, null);
  }

  function reportText() {
    var r = getReport();
    if (!r) return lang('report_missing');
    return JSON.stringify(r, null, 2);
  }

  function showReport() {
    var r = getReport();
    if (!r) { noty(lang('report_missing')); return; }
    showText('KinoPUB Sync 0.0.1', r.summaryText || reportText());
  }

  function copyReport() {
    var text = reportText();
    return copyText(text).then(function () { noty(lang('copied')); }).catch(function () {
      noty(lang('copy_failed'));
      showText('KinoPUB Sync 0.0.1 — отчёт', text);
    });
  }

  function clearReport() {
    storageRemove(KEY.report);
    storageRemove(KEY.tokenStatus);
    storageSet(KEY.lastStatus, '');
    noty(lang('report_cleared'));
  }

  function addParam(name, type, def, values, title, descr, onChange) {
    try {
      if (!window.Lampa || !Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;
      var param = { component: COMPONENT, name: name, type: type, 'default': def == null ? '' : def, values: values == null ? '' : values };
      Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: param,
        field: { name: title, description: descr || '' },
        onChange: onChange || function () {}
      });
    } catch (e) { log('settings param failed', name, e && e.message); }
  }

  function addSettings() {
    try {
      if (!window.Lampa || !Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;
      Lampa.SettingsApi.addComponent({
        component: COMPONENT,
        name: lang('component'),
        icon: '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0-9 9h2a7 7 0 0 1 11.95-4.95L15 9h6V3l-2.62 2.62A8.97 8.97 0 0 0 12 3Zm7 9a7 7 0 0 1-11.95 4.95L9 15H3v6l2.62-2.62A9 9 0 0 0 21 12h-2Z"/></svg>'
      });
      addParam('kp_sync001_sep_main', 'title', '', '', lang('sep'), lang('sep_descr'));
      addParam(KEY.lastStatus, 'input', storageGet(KEY.lastStatus, '') || '', '', lang('status'), lang('status_descr'));
      addParam('kp_sync001_action_check_token', 'button', '', '', lang('check_token'), lang('check_token_descr'), function () { checkToken(); });
      addParam('kp_sync001_action_read_bookmarks', 'button', '', '', lang('read_bookmarks'), lang('read_bookmarks_descr'), function () { readBookmarks(); });
      addParam('kp_sync001_action_show_report', 'button', '', '', lang('show_report'), lang('show_report_descr'), function () { showReport(); });
      addParam('kp_sync001_action_copy_report', 'button', '', '', lang('copy_report'), lang('copy_report_descr'), function () { copyReport(); });
      addParam('kp_sync001_action_clear_report', 'button', '', '', lang('clear_report'), lang('clear_report_descr'), function () { clearReport(); });
    } catch (e) { log('settings failed', e && e.message); }
  }

  function start() {
    if (window.KinoPubSync001 && window.KinoPubSync001._started) return;
    window.KinoPubSync001 = {
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
      status: function () { return storageGet(KEY.lastStatus, ''); },
      tokenStatus: function () { return storageGet(KEY.tokenStatus, null); }
    };
    addSettings();
    log('started', 'read-only audit build');
  }

  if (window.appready) start();
  else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
    try { Lampa.Listener.follow('app', function (e) { if (!e || e.type === 'ready') start(); }); } catch (e2) { setTimeout(start, 3000); }
  } else setTimeout(start, 3000);
})();
