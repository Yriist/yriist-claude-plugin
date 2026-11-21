---
description: Судебное дело: карточка, движение, мониторинг в ЮрИИсте
argument-hint: <номер дела А40-12345/2026 | УИД>
allowed-tools: mcp__plugin_yriist_yriist__cases_list, mcp__plugin_yriist_yriist__case_read, mcp__plugin_yriist_yriist__court_case, mcp__plugin_yriist_yriist__web_fetch, mcp__plugin_yriist_yriist__calculate_deadline, mcp__plugin_yriist_yriist__deadlines_list
---

Дело: $ARGUMENTS

1. Вызови `cases_list`. Дело уже на мониторинге: `case_read` с его `case_id` покажет события, заседания и сроки по делу.
2. Дела нет в списке: найди его `court_case` по номеру или УИД. Последний акт прочитай `web_fetch` по номеру [n].
3. Покажи суд, стороны, стадию, ближайшее заседание и что акты значат для пользователя. Срок обжалования посчитай `calculate_deadline`.
4. Предложи поставить дело на мониторинг (`case_track`): ЮрИИст пришлёт уведомление о новом акте или заседании и поставит сроки обжалования в «Сроки». Для суда общей юрисдикции передай суд из `court_case`. Сервер нашёл номер в нескольких судах: спроси, какой суд нужен, и вызови `case_update` с `court`.

`case_check` проверит дело сейчас, вне расписания (до 10 раз в час). Дело закончилось: `case_update` со `status: closed` сохранит историю. `case_delete` удаляет дело вместе с событиями, вызывай его только по прямой просьбе. Изменения Claude Code подтвердит у пользователя.
