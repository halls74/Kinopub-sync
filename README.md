# KinoPUB Sync 0.1.7-alpha

Alpha/read-only сборка для проверки чтения KinoPUB и готовности будущего импорта KinoPUB -> Lampa/TMDB.

## Важно

Версия ничего не импортирует в Lampa и ничего не меняет в KinoPUB.

Будущий импорт должен использовать только элементы из `importCandidates`, где получена настоящая TMDB/Lampa-карточка. `blockedItems` нельзя импортировать автоматически.

## Что нового в 0.1.7

Исправлена ошибка v0.1.6: плагин больше не подставляет `test@mail.ru` как fallback email для TMDB Proxy.

- `email` для proxy URL добавляется только если он явно найден в настройках Lampa/Storage или задан вручную в поле `TMDB Proxy email`.
- Если email не найден и поле пустое, параметр `email` вообще не добавляется.
- В диагностике добавлено поле `TMDB Proxy email: найден/задан` или `не задан`.
- `api_key` и `email` по-прежнему маскируются в копируемом отчёте диагностики.

## Что осталось из 0.1.6

- `Lampa.TMDB.api` вызывается строкой вида `find/tt...?...&api_key=...&language=ru&page=1`.
- Прямой proxy fallback пробует `https://apitmdb.cub.rip/3/...` первым.
- Затем пробует CUB-домен из `Manifest.cub_domain`, например `apitmdb.cub.red`.
- Затем backup `https://lampa.byskaz.ru/tmdb/api/3/...`.
- Запросы proxy выполняются через `Lampa.Reguest`, ближе к тому, как это делает сама Lampa.

## Рекомендуемый порядок проверки

1. Установить версию `?v=017`.
2. Если ваша Lampa требует email для CUB TMDB Proxy, заполнить поле `TMDB Proxy email`; если нет — оставить пустым.
3. Нажать `Проверить TMDB/Lampa API`.
4. Нажать `Скопировать диагностику TMDB/Lampa`.
5. Если провайдер ответа `tmdb_proxy_cub_rip` или `lampa_tmdb_api` и результат OK, поставить лимит сопоставления 10 или 25.
6. Запустить `Сопоставить карточки с TMDB/Lampa`.

## Установка

```text
https://<host>/docs/kp-sync.js?v=017
```

или loader:

```text
https://<host>/docs/kp.js?v=017
```

## Публичный API для консоли

```js
window.KinoPubSync017.checkToken()
window.KinoPubSync017.readBookmarks()
window.KinoPubSync017.diagnoseTmdbApi()
window.KinoPubSync017.tmdbDiag()
window.KinoPubSync017.showTmdbDiag()
window.KinoPubSync017.copyTmdbDiag()
window.KinoPubSync017.runMatchAudit()
window.KinoPubSync017.matchReport()
window.KinoPubSync017.matchReportText()
```
