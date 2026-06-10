# KinoPUB Sync 0.1.5-alpha

Alpha/read-only сборка для проверки чтения KinoPUB и готовности будущего импорта KinoPUB -> Lampa/TMDB.

## Важно

Версия ничего не импортирует в Lampa и ничего не меняет в KinoPUB.

Будущий импорт должен использовать только элементы из `importCandidates`, где получена настоящая TMDB/Lampa-карточка. `blockedItems` нельзя импортировать автоматически.

## Что нового в 0.1.5

В 0.1.5 усилена диагностика TMDB/Lampa: теперь видно, какой именно метод не отвечает (`Lampa.TMDB.api`, `tmdb_proxy_cub` или `tmdb_proxy_backup`), и массовое сопоставление не запускается, если preflight не прошёл.

- кнопка `Проверить TMDB/Lampa API`;
- кнопки `Показать диагностику TMDB/Lampa` и `Скопировать диагностику TMDB/Lampa`;
- короткий таймаут на каждый TMDB-метод — 5000 мс;
- preflight перед массовым сопоставлением;
- experimental fallback через TMDB Proxy: `https://apitmdb.<cub_domain>/3/` и backup `https://lampa.byskaz.ru/tmdb/api/3/`;
- в диагностике сохраняются подробности по каждому методу: статус, время, URL и ошибка;
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
https://<host>/docs/kp-sync.js?v=015
```

или loader:

```text
https://<host>/docs/kp.js?v=015
```

## Публичный API для консоли

```js
window.KinoPubSync015.checkToken()
window.KinoPubSync015.readBookmarks()
window.KinoPubSync015.diagnoseTmdbApi()
window.KinoPubSync015.tmdbDiag()
window.KinoPubSync015.showTmdbDiag()
window.KinoPubSync015.copyTmdbDiag()
window.KinoPubSync015.runMatchAudit()
window.KinoPubSync015.matchReport()
window.KinoPubSync015.matchReportText()
```
