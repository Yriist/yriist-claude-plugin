---
description: Шаблоны ЮрИИста: 230+ проверенных договоров, исков, претензий, доверенностей
argument-hint: <что нужно: «договор аренды квартиры»>
allowed-tools: mcp__plugin_yriist_yriist__templates_search, mcp__plugin_yriist_yriist__template_read, mcp__plugin_yriist_yriist__document_read
---

Нужен шаблон: $ARGUMENTS

1. Найди шаблоны `templates_search` по смыслу запроса. Запроса нет: покажи категории или шаблоны нужной категории (`category`).
2. Покажи 3–5 подходящих шаблонов, по строке о каждом, и спроси, какой взять. Текст шаблона читает `template_read`.
3. Пользователь выбрал: `document_from_template` положит копию в «Документы» (с `project_id`, если документ для дела). Факты есть в разговоре: заполни копию через `document_edit` по абзацам из `document_read`. Фактов нет: предложи заполнить копию в редакторе ЮрИИста.

Копию и правки Claude Code подтвердит у пользователя.
