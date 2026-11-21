---
description: Аккаунт ЮрИИста: тариф, сколько использовано, что открыто, права подключения
allowed-tools: mcp__plugin_yriist_yriist__whoami
---

Вызови `whoami` и коротко покажи аккаунт, тариф, использование и возможности тарифа.

Использование читай по `meter.kind`. При `messages` назови остаток сообщений (`messagesLeft` из `messagesLimit`), при `budget` или `tokens` процент месячного лимита (`usagePercent`), при `none` скажи, что лимита нет. `chatAllowed: false`: назови причину (`chatReason`) и дай ссылку на тарифы. Перечисли открытые возможности из `features` (документы, дела, табличный анализ, глубокий поиск) и лимиты хранилища из `storage`.

Инструмент недоступен: объясни, как подключиться. В Claude Code это `/mcp` → yriist → Authenticate или личный токен в файле `~/.config/yriist/token` (README плагина).
