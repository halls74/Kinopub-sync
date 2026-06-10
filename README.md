# KinoPUB Sync 0.1.3-alpha

Alpha/read-only сборка для проверки чтения KinoPUB и готовности будущего импорта KinoPUB -> Lampa/TMDB.

## Важно

Версия ничего не импортирует в Lampa и ничего не меняет в KinoPUB.

Будущий импорт должен использовать только элементы из `importCandidates`, где получена настоящая TMDB/Lampa-карточка. `blockedItems` нельзя импортировать автоматически.

## Что нового в 0.1.3

В 0.1.2 сопоставление могло занимать очень долго, если `Lampa.TMDB.api` не отвечал: каждый IMDb-запрос ждал таймаут. В 0.1.3 добавлена защита:

- кнопка `Проверить TMDB/Lampa API`;
- кнопка `Показать диагностику TMDB/Lampa`;
- короткий таймаут TMDB-запроса — 8000 мс;
- preflight перед массовым сопоставлением;
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
https://<host>/docs/kp-sync.js?v=013
```

или loader:

```text
https://<host>/docs/kp.js?v=013
```

## Публичный API для консоли

```js
window.KinoPubSync013.checkToken()
window.KinoPubSync013.readBookmarks()
window.KinoPubSync013.diagnoseTmdbApi()
window.KinoPubSync013.tmdbDiag()
window.KinoPubSync013.showTmdbDiag()
window.KinoPubSync013.runMatchAudit()
window.KinoPubSync013.matchReport()
window.KinoPubSync013.matchReportText()
```
