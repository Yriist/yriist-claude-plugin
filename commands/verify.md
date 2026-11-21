---
description: Проверить черновик: нормы и их актуальность, цифры, сроки, расчёты
argument-hint: <путь к файлу | document_id | «текст выше»>
allowed-tools: mcp__plugin_yriist_yriist__check_norms, mcp__plugin_yriist_yriist__verify_claims, mcp__plugin_yriist_yriist__law_article, mcp__plugin_yriist_yriist__file_read, mcp__plugin_yriist_yriist__files_list, mcp__plugin_yriist_yriist__document_read, mcp__plugin_yriist_yriist__documents_list
---

Проверь: $ARGUMENTS

1. Возьми текст. Локальный TXT, Markdown или PDF с текстовым слоем читай `Read`. DOCX, DOC и сканы загрузи по навыку `yriist:yriist-files` и прочитай `file_read`. Документ ЮрИИста читай `document_read`. Иначе возьми текст из разговора.
2. `check_norms` с текстом найдёт нормы, которые утратили силу, ещё не вступили, недавно изменились или не существуют.
3. `verify_claims` с ключевыми утверждениями. Передай выводы вида «не вправе», «обязан», «только» вместе с нормой, суммы, сроки с датой начала и последним днём, госпошлины, расчёты и номера дел.
4. Спорную норму прочитай `law_article`.

Документ длиннее 30 страниц поручи агенту `yriist:citation-checker`, он проверит текст частями.

Ответ: таблица «место в тексте · что не так · как исправить» и исправленные формулировки. Замечаний нет: так и напиши. Документ из «Документов» правь `document_edit` только по просьбе пользователя.
