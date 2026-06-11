# KinoPUB Sync 0.1.8-alpha

Read-only сборка для проверки чтения KinoPUB и готовности будущего импорта KinoPUB -> Lampa/TMDB.

Версия ничего не импортирует в Lampa и ничего не меняет в KinoPUB.

Будущий импорт должен использовать только элементы из `importCandidates`, где получена настоящая TMDB/Lampa-карточка. `blockedItems` нельзя импортировать автоматически.

## Что нового в 0.1.8

- Запоминается рабочий TMDB-провайдер, например `tmdb_proxy_cub_rip`.
- Если рабочий proxy уже известен, preflight больше не ждёт заведомо нерабочий `Lampa.TMDB.api` 5 секунд.
- По умолчанию диагностика и сопоставление пробуют TMDB Proxy (`apitmdb.cub.rip`) раньше `Lampa.TMDB.api`.
- Добавлен retry временных API-сбоев: 2 повтора с задержками 500 мс и 1500 мс.
- Добавлена кнопка `Повторить только ошибки API` для элементов со статусом `blocked_api_error` из последнего отчёта.
- В отчёт добавлена статистика скорости: общее время, среднее время на элемент, провайдеры, число retry.
- Добавлена совместимость с отчётами v0.1.7: можно использовать последний отчёт чтения/сопоставления без обязательного повторного чтения KinoPUB.

## Рекомендуемый порядок проверки

1. Установить версию `?v=018`.
2. Нажать `Проверить TMDB/Lampa API`.
3. Если провайдер ответа `tmdb_proxy_cub_rip` и результат OK, поставить лимит сопоставления 250.
4. Запустить `Сопоставить карточки с TMDB/Lampa`.
5. Если есть единичные `blocked_api_error`, нажать `Повторить только ошибки API`.
6. После успешного прогона 250 можно запускать лимит `0` для всех доступных уникальных карточек.

## Установка

```text
https://<host>/docs/kp-sync.js?v=018
```

или loader:

```text
https://<host>/docs/kp.js?v=018
```

## Публичный API для консоли

```js
window.KinoPubSync018.checkToken()
window.KinoPubSync018.readBookmarks()
window.KinoPubSync018.diagnoseTmdbApi()
window.KinoPubSync018.tmdbDiag()
window.KinoPubSync018.runMatchAudit()
window.KinoPubSync018.runRetryApiErrors()
window.KinoPubSync018.matchReport()
window.KinoPubSync018.matchReportText()
```
