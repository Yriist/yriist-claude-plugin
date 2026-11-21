---
description: Память ЮрИИста: что он помнит о вас и о делах, запомнить, забыть
argument-hint: [«что помнишь» | «запомни …» | «забудь …»]
allowed-tools: mcp__plugin_yriist_yriist__memory_list, mcp__plugin_yriist_yriist__memory_search, mcp__plugin_yriist_yriist__projects_list
---

$ARGUMENTS

- Что ЮрИИст помнит: `memory_list`. Факты о пользователе даёт `scope: profile`, факты дела `scope: project` с `project_id`, заметки этого подключения `scope: connection`. Конкретный факт ищи `memory_search`.
- Запомнить: `memory_save`. Пиши каждый факт отдельным утверждением с конкретикой: «Работодатель: ООО «Ромашка», ИНН 7701234567». Факт о пользователе ЮрИИст учтёт во всех чатах, факт дела (с `project_id`) во всех чатах этого дела. Сохраняй только то, что пользователь просил запомнить.
- Забыть: найди факт `memory_list` или `memory_search` и удали его `memory_delete` по `id`. Для фактов дела и чата передай тот же `project_id` или `chat_id`, что при чтении.

Запись и удаление Claude Code подтвердит у пользователя.
