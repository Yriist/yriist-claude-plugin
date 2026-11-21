---
description: Сроки ЮрИИста: что горит, новый срок, отметить выполненным
argument-hint: [событие для расчёта срока | срок с датой]
allowed-tools: mcp__plugin_yriist_yriist__deadlines_list, mcp__plugin_yriist_yriist__cases_list, mcp__plugin_yriist_yriist__calculate_deadline
---

$ARGUMENTS

Передано событие («решение изготовлено 03.11.2026, АС г. Москвы»): рассчитай сроки `calculate_deadline`, назови норму и предложи сохранить. `deadline_save` с `rule` и `event_date` поставит срок, последний день посчитает движок сроков ЮрИИста. Срок с известной датой («оплата по договору до 15.12.2026») сохраняй `deadline_save` с `title` и `due_date`. Сохраняй после согласия пользователя; Claude Code подтвердит запись.

Передан номер судебного дела: открой его через `/yriist:case`.

Иначе вызови `deadlines_list` и `cases_list`. Первыми покажи просроченные сроки и сроки на 7 дней вперёд, у каждого напиши, что сделать до даты. У срока с `needsConfirmation` дата начала не подтверждена: попроси пользователя её проверить. Дата верна: `deadline_update` с `confirmed: true`.

`deadline_update` меняет срок по просьбе пользователя: `status: done` отмечает выполненным, `dismissed` снимает с контроля, `open` возвращает в работу; `trigger_date` задаёт новую дату начала, `due_date` новый последний день. `deadline_delete` удаляет срок. Панель сроков открывает `/yriist-panel`.
