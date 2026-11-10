# ЮрИИст для Claude Code

[![CI](https://github.com/Yriist/yriist-claude-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/Yriist/yriist-claude-plugin/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Плагин подключает к Claude Code [ЮрИИст](https://yriist.ru) — ИИ-юриста по
праву РФ: судебная практика, нормы со сверкой и проверкой актуальности,
контрагенты, расчёты неустойки, госпошлины и процессуальных сроков, ваши чаты,
документы и «Сроки и дела» из приложения ЮрИИста.

> **In English.** A Claude Code plugin for [ЮрИИст](https://yriist.ru)
> (Yriist), an AI lawyer for Russian law: the remote MCP server
> (`https://app.yriist.ru/api/mcp`, OAuth), ten slash commands, three
> subagents, three skills, and a panel with your account, deadlines and
> recent chats. Commands, tool descriptions and answers are in Russian.

Сам MCP-сервер не привязан к Claude — его можно подключить к Cursor, VS Code,
ChatGPT и любому MCP-клиенту: см. [yriist-mcp](https://github.com/Yriist/yriist-mcp).

## Установка

Нужен аккаунт [ЮрИИста](https://app.yriist.ru). В сессии Claude Code в
терминале:

```
/plugin install yriist --marketplace Yriist/yriist-claude-plugin
```

Или из оболочки:

```sh
claude plugin install yriist --marketplace Yriist/yriist-claude-plugin
```

Claude Code спросит, добавить ли источник (`y`), и предложит область
установки. В приложении Claude для компьютера: «+» у поля ввода → Plugins →
Add marketplace `Yriist/yriist-claude-plugin` → Add plugin.

Затем войдите: `/mcp` → **yriist** → **Authenticate** — откроется окно
ЮрИИста, разрешите доступ. Проверить: `/yriist:status`. Отключить можно в
[Аккаунт → Подключения](https://app.yriist.ru/account/connections).

### Вход по токену вместо OAuth

Создайте личный токен в «Подключениях» и положите его в файл:

```sh
mkdir -p ~/.config/yriist && (umask 077 && printf '%s\n' 'yrp_…' > ~/.config/yriist/token)
```

Скрипт `scripts/mcp-headers.sh` добавит заголовок `Authorization` при
подключении. Пока файл есть, OAuth для этого сервера не используется; чтобы
вернуться к OAuth, удалите файл. Переменная окружения здесь не годится:
Claude Code не передаёт скрипту заголовков переменные с секретами (`*_TOKEN`).

## Что внутри

**MCP-сервер `yriist`** — 34 инструмента: `ask_yriist` (полный ИИ-юрист,
ответ сохраняется чатом в ЮрИИсте), `court_search`, `court_case`,
`law_article`, `check_norms`, `verify_claims`, `company_lookup`,
`company_check`, `calculate_penalty`, `calculate_court_fee`,
`calculate_deadline`, `web_search`, `web_fetch`, чаты, документы, шаблоны,
сроки, дела, память. Список с параметрами — в
[yriist-mcp/docs/tools.md](https://github.com/Yriist/yriist-mcp/blob/main/docs/tools.md).

**Команды**

| Команда | Что делает |
| --- | --- |
| `/yriist:ask <вопрос>` | вопрос ИИ-юристу ЮрИИста (расходует сообщение тарифа) |
| `/yriist:research <вопрос>` | исследование: нормы, практика, расчёты, вывод |
| `/yriist:court <вопрос или № дела>` | судебная практика / карточка дела |
| `/yriist:law <ст. 333 ГК РФ>` | текст нормы со сверкой |
| `/yriist:claim <ситуация>` | претензия или иск → «Документы» ЮрИИста |
| `/yriist:contract <id или файл>` | проверка договора на риски |
| `/yriist:company <ИНН>` | проверка контрагента |
| `/yriist:deadlines [событие]` | сроки и дела: что горит, новый срок |
| `/yriist:calc <что посчитать>` | неустойка, госпошлина, срок |
| `/yriist:status` | тариф и остаток сообщений |
| `/yriist-panel` | панель ЮрИИста |

Команды заранее разрешают только чтение и расчёты. Всё, что меняет ваши
данные (сохранить срок, создать документ, поставить дело на мониторинг),
Claude Code подтверждает у вас обычным запросом разрешения.

Сервер также отдаёт MCP-промпты: `/mcp__plugin_yriist_yriist__legal_research`,
`…__draft_claim`, `…__contract_review`, `…__deadline_check`,
`…__counterparty_check`, `…__court_prep`.

**Агенты**: `yriist:legal-researcher` (справка с нормами и практикой),
`yriist:contract-reviewer` (таблица рисков и правки), `yriist:court-prep`
(подготовка к заседанию).

**Навыки**: `russian-legal-research` (какой инструмент когда, иерархия
источников, правила цифр), `legal-documents-ru` (претензия, иск —
структура и реквизиты), `procedural-deadlines-ru` (сроки).

**Интерфейс Claude Code**

- строка состояния: тариф, остаток сообщений, горящие сроки;
- полоса над полем ввода, когда срок просрочен или наступает в ближайшие
  3 дня; «Скрыть» убирает её до следующего срочного срока;
- панель `/yriist-panel`: аккаунт, сроки с кнопкой «Готово», последние чаты
  (клик — подтянуть чат в разговор), «Спросить ИИ-юриста»;
- подпись «ЮрИИст · Судебная практика» под каждым вызовом инструмента.

В Claude Desktop и claude.ai результаты рисуются интерактивными карточками
(MCP Apps): источники с исходами дел, сроки, ответ ИИ-юриста с полем для
уточнения.

## Права

| Право | Что даёт |
| --- | --- |
| `yriist:read` | чаты, документы, шаблоны, сроки, дела, аккаунт |
| `yriist:research` | практика, нормы, контрагенты, расчёты, поиск |
| `yriist:write` | создать документ, сохранить срок, мониторинг дела, память |
| `yriist:agent` | `ask_yriist` (расходует сообщение тарифа) |

## Если что-то не так

| Симптом | Что сделать |
| --- | --- |
| Строка состояния «ЮрИИст: войдите — /mcp» | `/mcp` → yriist → Authenticate |
| Панель: «Сервер yriist выключен» | включите сервер в `/mcp` |
| Панель: «ЮрИИст недоступен» | проверьте сеть; состояние сервера — в `/mcp` |
| Токен в файле, а сервер просит войти | токен удалён или истёк: создайте новый в «Подключениях» или удалите файл и войдите через OAuth |
| Нет `ask_yriist` или действий | при входе не выдано право: отключите приложение в «Подключениях» и войдите снова |
| После смены способа входа сервер не подключается | перезапустите Claude Code |

## Разработка

```sh
sh tests/mcp-headers.test.sh     # скрипт заголовков
claude plugin validate .         # манифест, hooks-модуль, контракт состояния
claude plugin test .             # тесты hooks/register.test.tsx
YRIIST_MCP_URL=http://localhost:3000/api/mcp claude --plugin-dir .
```

`YRIIST_MCP_URL` направляет плагин на локальный или тестовый сервер.
Подробнее — [CONTRIBUTING.md](CONTRIBUTING.md); об уязвимостях —
[SECURITY.md](SECURITY.md).

## Конфиденциальность

Запросы обрабатывает ЮрИИст по [политике конфиденциальности](https://yriist.ru/privacy).
Плагин ничего не собирает сам. Лицензия [MIT](LICENSE).
