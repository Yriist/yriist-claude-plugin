---
description: Сроки и дела ЮрИИста — что горит, что сделать, поставить новый срок
argument-hint: [событие для расчёта нового срока]
allowed-tools: mcp__plugin_yriist_yriist__deadlines_list, mcp__plugin_yriist_yriist__cases_list, mcp__plugin_yriist_yriist__calculate_deadline
---

$ARGUMENTS

Если выше передано событие («решение изготовлено 03.11.2026, АС г. Москвы») — рассчитай сроки `calculate_deadline`, объясни норму и предложи сохранить (`deadline_save` — только после согласия пользователя).

Иначе: `deadlines_list` и `cases_list`; покажи просроченные и ближайшие 7 дней первыми, для каждого — что нужно сделать до даты. Отметить выполненным — `deadline_complete` по просьбе пользователя. Панель сроков: `/yriist-panel`.
