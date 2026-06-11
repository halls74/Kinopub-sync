# KinoPUB Sync 0.1.10-alpha

Read-only сборка для проверки чтения KinoPUB и готовности будущего импорта KinoPUB -> Lampa/TMDB.

Версия ничего не импортирует в Lampa и ничего не меняет в KinoPUB.

Главная цель v0.1.10 — проверить гипотезу из HAR веб-портала KinoPUB: HTML-страницы `/favorites/view?id=<folder>&page=<n>` показывают по **48 карточек на страницу**, поэтому основная API-стратегия теперь стартует с `page + perpage=48`. Логика остаётся универсальной: в код не зашиваются пользовательские числа, названия папок, item id, email или конкретная структура чужого аккаунта.

## Что нового в 0.1.10

- Основной размер страницы чтения изменён с `perpage=50` на `perpage=48`, потому что HAR веб-портала KinoPUB показал 48 карточек на HTML-страницу. Это поведение сайта, а не пользовательский счётчик.
- Расширена диагностика чтения папок KinoPUB.
- Для каждой папки плагин сравнивает `countReported` с реально собранными уникальными `item_id`.
- Если основной `page + perpage` неполный, запускаются универсальные fallback-стратегии:
  - `/bookmarks/<folder_id>` и `/bookmarks/view?folder=<folder_id>`;
  - `page + perpage=48` как основной вариант;
  - `page + perpage` с fallback page size `50`, `100`, `25`;
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

1. Установить версию `?v=0110`.
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
https://<host>/docs/kp-sync.js?v=0110
```

или loader:

```text
https://<host>/docs/kp.js?v=0110
```

## Публичный API для консоли

```js
window.KinoPubSync0110.checkToken()
window.KinoPubSync0110.readBookmarks()
window.KinoPubSync0110.report()
window.KinoPubSync0110.reportText()
window.KinoPubSync0110.diagnoseTmdbApi()
window.KinoPubSync0110.tmdbDiag()
window.KinoPubSync0110.runMatchAudit()
window.KinoPubSync0110.runRetryApiErrors()
window.KinoPubSync0110.matchReport()
window.KinoPubSync0110.matchReportText()
```
