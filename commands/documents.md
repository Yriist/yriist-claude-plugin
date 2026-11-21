---
description: Документы ЮрИИста: найти, прочитать, поправить, скачать DOCX или PDF
argument-hint: [название или что сделать]
allowed-tools: mcp__plugin_yriist_yriist__documents_list, mcp__plugin_yriist_yriist__document_read, mcp__plugin_yriist_yriist__document_versions, mcp__plugin_yriist_yriist__document_export
---

$ARGUMENTS

Найди документ `documents_list` (по названию `query`, таблицы `kind: sheet`) и прочитай `document_read`. Абзацы приходят с номерами [n]; длинный документ продолжай с `from_paragraph`.

- Скачать: `document_export` с `format` `docx` или `pdf` (таблицу: `xlsx` или `csv`). Ссылка действует 7 дней и открывает файл без входа, поэтому отдай её только пользователю.
- Поправить как написано: `document_edit` с операциями по номерам абзацев и цитатам из `document_read` и `base_revision` оттуда же. Операция не подошла: сервер вернёт причину и текущий абзац, повтори только её. Правку по смыслу («смягчи ответственность») сделает `ask_yriist` с `document_id`, она расходует сообщение тарифа.
- Переименовать или перенести в дело: `document_update`.
- Отменить правку: найди версию `document_versions` и верни её `document_restore`. История останется.
- Удалить: `document_delete`, только по прямой просьбе. Документ пропадёт со всеми версиями.

Правку, восстановление и удаление Claude Code подтвердит у пользователя. Список показывает личное пространство, документов команды в нём нет.
