---
description: Проверка контрагента — карточка, реквизиты, риски, суды
argument-hint: <ИНН | ОГРН | название>
allowed-tools: mcp__plugin_yriist_yriist__company_lookup, mcp__plugin_yriist_yriist__company_check, mcp__plugin_yriist_yriist__requisites_lookup, mcp__plugin_yriist_yriist__court_search
---

Проверь контрагента «$ARGUMENTS»: `company_lookup` (карточка), `company_check` (риски; если недоступно на тарифе — скажи об этом), `court_search` по названию или ИНН (споры). Итог: можно ли работать, красные флаги, что запросить у контрагента.
