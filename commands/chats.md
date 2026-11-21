---
description: Чаты ЮрИИста: найти прошлый разговор, прочитать, продолжить
argument-hint: [что искать]
allowed-tools: mcp__plugin_yriist_yriist__chats_list, mcp__plugin_yriist_yriist__chats_search, mcp__plugin_yriist_yriist__chat_read
---

$ARGUMENTS

Запрос есть: `chats_search` найдёт слова, суммы и стороны в переписке и вернёт фрагменты с `chat_id`. Запроса нет: `chats_list` покажет последние чаты. Чаты одного дела: передай `project_id`.

Прочитай нужный чат `chat_read`. Он отдаёт последние сообщения, документы чата (`document_id`), файлы (`file_id`) и `status: running`, если ответ ещё готовится. Начало длинного чата читай с `from_message`.

Продолжить разговор: по просьбе пользователя вызови `ask_yriist` с `chat_id` (расходует сообщение тарифа) или предложи `/yriist:ask`. `chat_stop` остановит ответ, который ещё готовится. `chat_delete` удалит чат, вызывай его только по прямой просьбе; документы чата останутся в «Документах». Обе операции Claude Code подтвердит у пользователя.
