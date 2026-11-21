---
description: Обезличить текст или файл: убрать ФИО, телефоны, адреса, паспорта, ИНН, счета
argument-hint: <путь к файлу | file_id | «текст выше»>
allowed-tools: mcp__plugin_yriist_yriist__anonymize, mcp__plugin_yriist_yriist__file_read, mcp__plugin_yriist_yriist__files_list
---

Обезличь: $ARGUMENTS

- Текст из разговора: `anonymize` с `text`.
- Файл в ЮрИИсте: найди его `files_list` и вызови `anonymize` с `file_id`.
- Локальный файл: загрузи его по навыку `yriist:yriist-files` и вызови `anonymize` с `file_id`. TXT и Markdown можно прочитать `Read` и передать `text`.

ЮрИИст вернёт текст с метками вроде [ФИО-1], [ТЕЛЕФОН-2] и сводку замен, исходных значений в ответе нет. Покажи сводку и обезличенный текст. Предложи сохранить результат в новый локальный файл; исходный не перезаписывай. Вызов расходует лимит анонимайзера на тарифе.
