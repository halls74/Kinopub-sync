# Changelog

## v0.1.2-alpha

- Уточнена модель сопоставления: отчёт теперь называется проверкой готовности импорта, а не просто match audit.
- Успешный результат переименован в `matched_import_candidate`; только такие элементы имеют `import_allowed: true`.
- Добавлены явные массивы `importCandidates` и `blockedItems`.
- Kinopoisk-only карточки получают `blocked_kinopoisk_only` и не считаются кандидатами, пока нет надёжного Kinopoisk → TMDB/Lampa resolver.
- Не найденные, неоднозначные, с неверным типом или ошибкой API карточки получают `blocked_*` статусы и не могут импортироваться автоматически.

## v0.1.1-alpha

- Убран отдельный статус `matched_existing_tmdb_id`, потому что в реальных отчётах KinoPUB `tmdb_id` отсутствует и такой статус вводил в заблуждение.
- Сопоставление сделано честнее: точное TMDB/Lampa-сопоставление выполняется по IMDb через TMDB Find.
- Добавлен статус `skipped_kinopoisk_only` для карточек, где нет IMDb, но есть Kinopoisk ID.
- Добавлен статус `skipped_no_external_id` для карточек без IMDb и без Kinopoisk ID.
- В отчёт сопоставления добавлены отдельные счётчики `skippedKinopoiskOnly` и `skippedNoExternalId`.
- README уточняет, что Kinopoisk ID пока используется как диагностический резерв, а не как ложный точный TMDB match.

## v0.1.0-alpha

- Добавлен read-only отчёт сопоставления KinoPUB → TMDB/Lampa.
- Основной путь сопоставления: IMDb → TMDB Find через `Lampa.TMDB.api`.
- Импорт в Lampa не выполняется.

## v0.0.9-alpha

- Добавлен список `duplicateItemsInFolder` с повторяющимися `item id` внутри папки.
- Медленный fallback `limit=50` убран из обычного чтения.
- Улучшены предупреждения о повторе хвоста API.
