---
description: Проверить договор на риски: локальный файл, документ ЮрИИста или текст
argument-hint: <путь к файлу | document_id | название | «текст выше»> [сторона]
allowed-tools: mcp__plugin_yriist_yriist__law_article, mcp__plugin_yriist_yriist__check_norms, mcp__plugin_yriist_yriist__verify_claims, mcp__plugin_yriist_yriist__court_search, mcp__plugin_yriist_yriist__court_case, mcp__plugin_yriist_yriist__web_search, mcp__plugin_yriist_yriist__web_fetch, mcp__plugin_yriist_yriist__calculate_penalty, mcp__plugin_yriist_yriist__calculate_court_fee, mcp__plugin_yriist_yriist__calculate_deadline, mcp__plugin_yriist_yriist__calculate, mcp__plugin_yriist_yriist__company_lookup, mcp__plugin_yriist_yriist__requisites_lookup, mcp__plugin_yriist_yriist__document_read, mcp__plugin_yriist_yriist__documents_list, mcp__plugin_yriist_yriist__file_read, mcp__plugin_yriist_yriist__files_list, mcp__plugin_yriist_yriist__templates_search, mcp__plugin_yriist_yriist__template_read
---

Проверь договор: $ARGUMENTS

Где взять текст:
- путь к локальному файлу: загрузи его в ЮрИИст по навыку `yriist:yriist-files` и прочитай `file_read`. Так ты прочитаешь DOCX, DOC, RTF и сканы, которые Claude Code сам не откроет. TXT, Markdown и PDF с текстовым слоем читай `Read` без загрузки;
- файл уже в ЮрИИсте: найди его `files_list` по имени и прочитай `file_read`;
- документ из «Документов»: найди его `documents_list` по названию и прочитай `document_read`;
- иначе возьми текст из разговора.

Длинный текст приходит частями: `file_read` продолжай с `from_char`, `document_read` с `from_paragraph` из ответа.

Сторона не указана: спроси или проверь нейтрально. Длинный договор поручи агенту `yriist:contract-reviewer`. Результат: таблица рисков (пункт, проблема, норма, правка) по убыванию важности и готовые формулировки правок. Карточку контрагента по ИНН найдёт `company_lookup`; платную `company_check` вызывай, только если пользователь просит.

Договор лежит в «Документах», и пользователь просит внести правки: `document_edit` с операциями по номерам абзацев и цитатам из `document_read` и `base_revision` оттуда же. Claude Code спросит разрешение.
