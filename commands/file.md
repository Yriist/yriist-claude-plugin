---
description: Загрузить локальный файл в ЮрИИст и прочитать его текст (PDF, DOCX, сканы)
argument-hint: <путь к файлу> [дело]
allowed-tools: mcp__plugin_yriist_yriist__files_list, mcp__plugin_yriist_yriist__file_read, mcp__plugin_yriist_yriist__projects_list
---

Файл: $ARGUMENTS

Загрузи файл по навыку `yriist:yriist-files`. Пользователь назвал дело: найди его `projects_list` и передай `project_id`. Затем прочитай текст `file_read` и в двух-трёх предложениях скажи, что это за документ.

Пути нет: покажи файлы пользователя в ЮрИИсте (`files_list`) и спроси, какой нужен.

Что можно сделать с файлом дальше: задать вопрос ИИ-юристу (`ask_yriist` с `file_ids`), проверить нормы (`/yriist:verify`), обезличить (`/yriist:anonymize`), свести несколько файлов в таблицу (`/yriist:review`).
