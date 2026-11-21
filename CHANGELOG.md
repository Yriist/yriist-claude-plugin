# Changelog

Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии:
[SemVer](https://semver.org/lang/ru/).

## [1.1.0] (не выпущено)

### Добавлено

- Команды для данных ЮрИИста: `/yriist:documents` (прочитать, поправить
  `document_edit`, версии, скачать DOCX или PDF), `templates`, `chats`,
  `projects` («Дела»), `case` (карточка и мониторинг судебного дела), `file`
  (загрузка локального файла), `anonymize`, `memory`, `review` (табличный
  анализ), `verify` (нормы, ссылки, цифры в черновике), `requisites`.
- Навык `yriist-files`: загрузка файла через `file_upload_begin`, `curl` PUT и
  `file_upload_finish`, чтение `file_read` с `status: processing`. Теперь
  `/yriist:contract`, `verify`, `anonymize` и `ask` работают с DOCX, DOC и
  сканами.
- Агент `citation-checker`: проверяет ссылки и цифры в длинном тексте частями.
- `.mcp.json`: `timeout: 300000`, и Claude Code больше не обрывает
  `ask_yriist` через 60 секунд.
- Использование для тарифов с бюджетом («использовано 63%») в строке
  состояния, панели и `/yriist:status`; `/yriist:status` показывает
  возможности тарифа и лимиты хранилища.
- «Вернуть» после «Готово»; пометка «дата начала не подтверждена»; «и ещё N»
  в длинном списке сроков; закрытые на бесплатном тарифе чаты панель не
  предлагает читать.
- Настройки (`/config`): строка состояния, полоса, порог «близко», интервал
  обновления.
- Навыки: исковая давность, приказное и упрощённое производство, подсудность,
  приложения по АПК, заявление о выдаче судебного приказа, апелляционная
  жалоба, отзыв, ходатайство, финальная проверка `check_norms` и
  `verify_claims`, редакция нормы на дату фактов, иерархия источников с КС РФ
  и подзаконными актами, предельные сроки восстановления.
- Подписи под вызовами для всех 62 инструментов сервера.

### Изменено

- «Готово» и «Вернуть» в панели вызывают `deadline_update` со `status`
  вместо устаревшего `deadline_complete`; команды и навыки тоже перешли на
  `deadline_update` (`confirmed: true` подтверждает дату начала).
- Панель и строка состояния перечитывают сроки после `deadline_update`,
  `deadline_delete`, `case_update`, `case_check`, `case_delete` и
  `project_delete`.
- `/yriist:ask` вызывает только пользователь (`disable-model-invocation`),
  и `ask_yriist` больше не разрешён заранее: Claude Code спрашивает
  разрешение. Команда передаёт `file_ids`, `document_id`, `project_id`,
  `audience`, `wait_seconds: 100`; после обрыва ищет чат через `chats_list` и
  не задаёт вопрос повторно.
- Длинные ответы читаются частями (`from_message`, `from_paragraph`,
  `from_char`) вместо жёстких `max_chars`.
- `/yriist:deadlines` сохраняет и срок с известной датой (`title` и
  `due_date`); номер судебного дела ведёт `/yriist:case`.
- Агенты читают «Дела», файлы и судебные дела на мониторинге
  (`project_read`, `file_read`, `case_read`). `contract-reviewer` не вызывает
  платную `company_check` без просьбы; `contract-reviewer` и `court-prep`
  проверяют итог `verify_claims`.
- Фоновые запросы: при старте сессии плагин читает только аккаунт и сроки,
  раз в час, через кэш на все сессии; чаты только при открытой панели.

### Удалено

- `skill_read` из агентов и навыков: сервер убрал этот инструмент.

### Исправлено

- Платные тарифы показывались как «Сообщения: без лимита».
- Тост «чат сохранён» при `status: running`; сроки не перечитывались после
  `ask_yriist`.
- Любая ошибка со словом «auth» считалась выходом из аккаунта.
- `/yriist:company` искал споры по ИНН, а `court_search` ищет по названию.

## [1.0.0] (не выпущено)

Первый выпуск.

- MCP-сервер ЮрИИста (`https://app.yriist.ru/api/mcp`) с входом через OAuth
  или по личному токену из файла.
- Команды `/yriist:ask`, `research`, `court`, `law`, `claim`, `contract`,
  `company`, `deadlines`, `calc`, `status`.
- Агенты `legal-researcher`, `contract-reviewer`, `court-prep`; навыки
  `russian-legal-research`, `legal-documents-ru`, `procedural-deadlines-ru`.
- Интерфейс Claude Code: строка состояния, полоса срочных сроков, панель
  `/yriist-panel`, подписи под вызовами инструментов.
