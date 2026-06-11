# Changelog

## 0.1.9-alpha

- Добавлен универсальный multi-strategy audit чтения закладок KinoPUB.
- Для каждой папки сравнивается `countReported` с количеством реально полученных уникальных `item_id`.
- При неполном чтении запускаются fallback-стратегии пагинации: `page/perpage`, `page/limit`, `page/per_page`, `page/page_size`, `offset/limit`, `skip/limit`, а также базовые `sort=id&order=asc/desc` варианты.
- Выбор лучшей стратегии теперь приоритетно основан на максимальном числе уникальных `item_id`.
- В отчёт добавлены `missingUniqueByCount`, `retrievalComplete`, `attemptsRun`, `extendedAttemptsRun`, `compactPageTrace`, `firstAcceptedId` и `lastAcceptedId`.
- В плагин не зашиваются пользовательские счётчики, названия папок, item id, email или данные конкретного аккаунта; все выводы строятся из текущего ответа API.
- Read-only режим сохранён: импорта в Lampa нет, изменений в KinoPUB нет.
- Логика TMDB-сопоставления из v0.1.8 сохранена.

## 0.1.8-alpha

- Запоминается рабочий TMDB provider (`kp_sync018_preferred_tmdb_provider`).
- Preflight начинает с сохранённого/наиболее вероятного proxy provider и не тратит 5 секунд на `Lampa.TMDB.api`, если рабочий proxy уже известен.
- Добавлены 2 retry для временных ошибок TMDB/API: 500 мс и 1500 мс.
- Добавлена кнопка `Повторить только ошибки API` для `blocked_api_error` из последнего отчёта.
- В отчёт сопоставления добавлены `performance`, `retry_count`, `attempts`, статистика провайдеров и среднее время на элемент.

## 0.1.7-alpha

- Убран hardcoded fallback `test@mail.ru` из логики TMDB Proxy.
- Добавлено необязательное поле настроек `TMDB Proxy email`.
- Параметр `email` добавляется в proxy URL только если найден/задан реальный email.
- Диагностика показывает, был ли найден/задан email для proxy, не раскрывая его значение.
