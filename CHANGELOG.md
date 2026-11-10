# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии —
[SemVer](https://semver.org/lang/ru/).

## [1.0.0] — не выпущено

Первый выпуск.

- MCP-сервер ЮрИИста (`https://app.yriist.ru/api/mcp`) с входом через OAuth
  или по личному токену из файла.
- Команды `/yriist:ask`, `research`, `court`, `law`, `claim`, `contract`,
  `company`, `deadlines`, `calc`, `status`.
- Агенты `legal-researcher`, `contract-reviewer`, `court-prep`; навыки
  `russian-legal-research`, `legal-documents-ru`, `procedural-deadlines-ru`.
- Интерфейс Claude Code: строка состояния, полоса срочных сроков, панель
  `/yriist-panel`, подписи под вызовами инструментов.
