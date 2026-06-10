# KinoPUB Sync 0.1.4-alpha

Alpha/read-only сборка для проверки чтения KinoPUB и готовности будущего импорта KinoPUB -> Lampa/TMDB.

## Важно

Версия ничего не импортирует в Lampa и ничего не меняет в KinoPUB.

Будущий импорт должен использовать только элементы из `importCandidates`, где получена настоящая TMDB/Lampa-карточка. `blockedItems` нельзя импортировать автоматически.

## Что нового в 0.1.4

В 0.1.2 сопоставление могло занимать очень долго, если `Lampa.TMDB.api` не отвечал: каждый IMDb-запрос ждал таймаут. В 0.1.4 добавлена защита:

- кнопка `Проверить TMDB/Lampa API`;
- кнопки `Показать диагностику TMDB/Lampa` и `Скопировать диагностику TMDB/Lampa`;
- короткий таймаут на каждый TMDB-метод — 5000 мс;
- preflight перед массовым сопоставлением;
- experimental fallback через TMDB Proxy: `https://apitmdb.<cub_domain>/3/` и backup `https://lampa.byskaz.ru/tmdb/api/3/`;
- досрочная остановка при недоступном TMDB/Lampa API или серии ошибок.

## Рекомендуемый порядок проверки

1. Включить VPN, если без него KinoPUB/TMDB недоступны.
2. `Проверить токен основного KinoPUB`.
3. `Считать папки и закладки KinoPUB`.
4. `Проверить TMDB/Lampa API`.
5. Если диагностика OK, поставить лимит сопоставления 10 или 25.
6. Запустить `Сопоставить карточки с TMDB/Lampa`.
7. Если всё успешно, увеличить лимит.

## Установка

```text
https://<host>/docs/kp-sync.js?v=014
```

или loader:

```text
https://<host>/docs/kp.js?v=014
```

## Публичный API для консоли

```js
window.KinoPubSync014.checkToken()
window.KinoPubSync014.readBookmarks()
window.KinoPubSync014.diagnoseTmdbApi()
window.KinoPubSync014.tmdbDiag()
window.KinoPubSync014.showTmdbDiag()
window.KinoPubSync014.copyTmdbDiag()
window.KinoPubSync014.runMatchAudit()
window.KinoPubSync014.matchReport()
window.KinoPubSync014.matchReportText()
```
