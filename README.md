# KinoPUB Sync v0.0.9-alpha

Read-only диагностическая сборка плагина для Lampa.

## Что делает

- Проверяет наличие токенов основного KinoPUB-плагина.
- Читает папки и закладки KinoPUB через API.
- Ничего не импортирует в Lampa.
- Ничего не меняет в KinoPUB.
- Показывает диагностику пагинации и дубликатов.
- Даёт безопасную локальную очистку старых данных Sync в Lampa после сканирования и подтверждения.

## Что изменено в v0.0.9

- Обычный fallback теперь использует только:
  - `/v1/bookmarks/<folder_id>?page=N&perpage=50`
  - `/v1/bookmarks/view?folder=<folder_id>&page=N&perpage=50`
- Медленный `limit=50` убран из обычного режима, потому что возвращал тот же результат, но требовал больше страниц.
- В отчёт добавлено поле `folders[].duplicateItemsInFolder[]`.
- Повтор хвоста API не считается дублем закладок.

## Важные поля отчёта

- `countReported` — счётчик папки, который вернул KinoPUB.
- `acceptedRawRows` — полезные строки до повторного хвоста API.
- `repeatedTailRows` — строки, которые пришли повтором последней страницы.
- `missingAcceptedByCount` — разница между счётчиком папки и `acceptedRawRows`.
- `duplicateRows` — реальные повторы `item id` внутри принятых строк.
- `duplicateItemsInFolder` — список повторяющихся `item id` внутри папки.
- `strategiesEquivalent` — все fallback-стратегии дали одинаковый итог.

## Установка

Прямой файл:

```text
https://<host>/docs/kp-sync.js?v=009
```

Loader вместе с основным KinoPUB-плагином:

```text
https://<host>/docs/kp.js?v=009
```

## Ограничения

- Проверки доступности карточек через `/v1/items/<id>` нет.
- WEB-проверки `kino.pub/item/view/...` нет.
- Импорта в Lampa нет.
- Обратной синхронизации нет.
