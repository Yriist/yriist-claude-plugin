---
description: «Дела» ЮрИИста: папки клиентских дел с чатами, файлами, документами и сроками
argument-hint: [название дела | «новое дело …»]
allowed-tools: mcp__plugin_yriist_yriist__projects_list, mcp__plugin_yriist_yriist__project_read, mcp__plugin_yriist_yriist__files_list, mcp__plugin_yriist_yriist__file_read, mcp__plugin_yriist_yriist__documents_list, mcp__plugin_yriist_yriist__chats_list, mcp__plugin_yriist_yriist__deadlines_list, mcp__plugin_yriist_yriist__memory_list
---

$ARGUMENTS

Найди дело `projects_list` (по названию `query`, следующая страница по `cursor`) и открой `project_read`: «О деле» (номер, суд, стороны, описание), чаты, файлы, документы, сроки и судебные дела. Коротко покажи, что лежит в деле и что горит.

- Новое дело: `project_create` с `name`, `description` и `details`. «Дела» открыты на платных тарифах.
- `project_update` меняет название и «О деле»: заменяет переданные поля и не трогает остальные.
- Файл в дело: загрузи его по навыку `yriist:yriist-files` с `project_id`. Вопрос по делу: `ask_yriist` с `project_id`, и ЮрИИст учтёт «О деле», файлы и факты дела.
- Удалить: `project_delete` с `confirm_name`, точным названием из `projects_list`. Удаление сотрёт файлы и память дела безвозвратно. Чаты останутся без дела, `chats: delete` удалит и их. Вызывай только по прямой просьбе и перед вызовом перечисли пользователю, что пропадёт.

Запись и удаление Claude Code подтвердит у пользователя. Команда видит только личное пространство.
