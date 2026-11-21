---
description: Табличный анализ: ЮрИИст читает много документов и сводит их в таблицу
argument-hint: <файлы или папка> [шаблон: поставка, аренда, NDA…]
allowed-tools: mcp__plugin_yriist_yriist__review_tables_list, mcp__plugin_yriist_yriist__review_table_read, mcp__plugin_yriist_yriist__files_list
---

$ARGUMENTS

В табличном анализе строка соответствует документу, колонка вопросу (стороны, сроки, суммы, риски). ЮрИИст сам читает каждый файл. Функция открыта на тарифе «Премиум», до 10 таблиц в час.

- Готовые таблицы покажет `review_tables_list`, содержимое `review_table_read`. Только ячейки на проверку: `only_flagged: true`; с цитатами: `quotes: true`.
- Новой таблице нужны `file_ids`. Файлы в ЮрИИсте найди `files_list`; локальные файлы загрузи по навыку `yriist:yriist-files`, по одному. Выбери `template` по виду документов (`contract_key_terms`, `contract_playbook`, `supply`, `lease`, `employment`, `nda`, `due_diligence`, `primary_docs`, `court_acts`, `procurement`, `incoming`) или задай свои `columns` (`label` и `prompt`). Запусти `review_table_create`; Claude Code подтвердит запуск.
- ЮрИИст заполняет таблицу в фоне несколько минут и сразу возвращает `review_id`. Прочитай `review_table_read`, когда пользователь вернётся; недоделанные документы помечены.

Ответ: сводка по таблице и строки с ячейками на проверку.
