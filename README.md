# KinoPUB Sync 0.1.9-alpha

Read-only сборка для проверки чтения KinoPUB и готовности будущего импорта KinoPUB -> Lampa/TMDB.

Версия ничего не импортирует в Lampa и ничего не меняет в KinoPUB.

Главная цель v0.1.9 — проверить, что плагин получает **все доступные через API закладки**, а не только первый удачный вариант пагинации. Логика универсальная: в код не зашиваются пользовательские числа, названия папок, item id, email или конкретная структура чужого аккаунта.

## Что нового в 0.1.9

- Расширена диагностика чтения папок KinoPUB.
- Для каждой папки плагин сравнивает `countReported` с реально собранными уникальными `item_id`.
- Если основной `page + perpage` неполный, запускаются универсальные fallback-стратегии:
  - `/bookmarks/<folder_id>` и `/bookmarks/view?folder=<folder_id>`;
  - `page + perpage` с разными page size;
  - `page + limit`;
  - `page + per_page`;
  - `page + page_size`;
  - `offset + limit`;
  - `skip + limit`;
  - базовые `sort=id&order=asc/desc` варианты.
- Выбирается стратегия, которая дала максимум уникальных `item_id`, а не максимум сырых строк.
- В отчёт добавлены:
  - `missingUniqueByCount`;
  - `retrievalComplete`;
  - `attemptsRun`;
  - `extendedAttemptsRun`;
  - `compactPageTrace` по каждой стратегии;
  - `firstAcceptedId` / `lastAcceptedId`.
- Сопоставление TMDB из v0.1.8 сохранено: `tmdb_proxy_cub_rip`, retry API-сбоев, повтор только `blocked_api_error`.

## Рекомендуемый порядок проверки

1. Установить версию `?v=019`.
2. Нажать `Считать папки и закладки KinoPUB`.
3. Скопировать полный отчёт чтения.
4. Проверить в отчёте:
   - `totals.missingUniqueByCount`;
   - `folders[].missingUniqueByCount`;
   - `folders[].attempts`;
   - выбранную `selectedStrategy`.
5. Если `missingUniqueByCount = 0`, можно снова запускать сопоставление лимитом `0`.
6. Если `missingUniqueByCount > 0`, импорт пока не запускать: нужно анализировать, какие стратегии API отдали неполный набор.

## Установка

```text
https://<host>/docs/kp-sync.js?v=019
```

или loader:

```text
https://<host>/docs/kp.js?v=019
```

## Публичный API для консоли

```js
window.KinoPubSync019.checkToken()
window.KinoPubSync019.readBookmarks()
window.KinoPubSync019.report()
window.KinoPubSync019.reportText()
window.KinoPubSync019.diagnoseTmdbApi()
window.KinoPubSync019.tmdbDiag()
window.KinoPubSync019.runMatchAudit()
window.KinoPubSync019.runRetryApiErrors()
window.KinoPubSync019.matchReport()
window.KinoPubSync019.matchReportText()
```
