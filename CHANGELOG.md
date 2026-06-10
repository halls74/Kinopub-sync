# Changelog

## 0.1.7-alpha

- Убран hardcoded fallback `test@mail.ru` из логики TMDB Proxy.
- Добавлено необязательное поле настроек `TMDB Proxy email`.
- Параметр `email` добавляется в proxy URL только если найден/задан реальный email.
- Диагностика показывает, был ли найден/задан email для proxy, не раскрывая его значение.
- Сохранена read-only логика: импорта в Lampa нет, изменений в KinoPUB нет.

## 0.1.6-alpha

- Добавлен приоритет `apitmdb.cub.rip` по логам живой Lampa.
- Формат вызова TMDB приведён ближе к штатным вызовам Lampa.
