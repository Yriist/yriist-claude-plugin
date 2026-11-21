---
description: Составить претензию или иск и сохранить в «Документы» ЮрИИста
argument-hint: <ситуация: кто, что нарушил, суммы, даты>
allowed-tools: mcp__plugin_yriist_yriist__law_article, mcp__plugin_yriist_yriist__check_norms, mcp__plugin_yriist_yriist__verify_claims, mcp__plugin_yriist_yriist__court_search, mcp__plugin_yriist_yriist__court_case, mcp__plugin_yriist_yriist__web_search, mcp__plugin_yriist_yriist__web_fetch, mcp__plugin_yriist_yriist__calculate_penalty, mcp__plugin_yriist_yriist__calculate_court_fee, mcp__plugin_yriist_yriist__calculate_deadline, mcp__plugin_yriist_yriist__calculate, mcp__plugin_yriist_yriist__company_lookup, mcp__plugin_yriist_yriist__requisites_lookup, mcp__plugin_yriist_yriist__templates_search, mcp__plugin_yriist_yriist__template_read, mcp__plugin_yriist_yriist__projects_list, mcp__plugin_yriist_yriist__project_read, mcp__plugin_yriist_yriist__files_list, mcp__plugin_yriist_yriist__file_read, mcp__plugin_yriist_yriist__memory_search
---

Составь документ по ситуации, следуя навыку `yriist:legal-documents-ru`:

$ARGUMENTS


По умолчанию составь досудебную претензию. Иск составляй, если пользователь просит иск или уже соблюл досудебный порядок. До текста проверь по навыку исковую давность, досудебный порядок, приказное производство и подсудность. Пользователь назвал дело из «Дел»: прочитай `project_read` и нужные файлы `file_read`.

Перед сохранением прогони текст через `check_norms` и `verify_claims` и исправь найденное. Покажи пользователю итоговый текст. Сохрани его `document_create` после согласия (или сразу, если пользователь просил сохранить); Claude Code подтвердит запись. Передай `request_id`, новый UUID: повтор вызова с ним не создаст второй документ. Документ для дела: добавь `project_id`.

Пользователю нужен файл: `document_export` с `format: docx` или `pdf` вернёт ссылку на 7 дней. Ссылка открывает файл без входа, отдай её только пользователю.
