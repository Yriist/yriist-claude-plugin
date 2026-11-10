import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type {
  YriistAccount,
  YriistChat,
  YriistDeadline,
  YriistLink,
} from '../types'

/**
 * ЮрИИст in Claude Code's own interface:
 * - a status line entry: plan, messages left, deadlines that burn;
 * - a band above the prompt when a deadline is overdue or ≤ 3 days away;
 * - a «ЮрИИст» pane (`/yriist-panel`): account, deadlines with «Готово»,
 *   recent chats you can pull into the conversation;
 * - a label under every ЮрИИст tool row («ЮрИИст · Судебная практика»).
 *
 * Every call goes through the plugin's own MCP server with Claude Code's
 * connection and credentials (`$.mcp.call`), so OAuth sign-in is the only
 * sign-in. Nothing is drawn until the server answers.
 */

const PANE = 'yriist'
/** Account and deadlines are re-read this often; chats only when asked for. */
const REFRESH_MS = 30 * 60 * 1000
/** MCP tool names of this server: as a plugin server or added by hand. */
const TOOL_PREFIX = /^mcp__(?:plugin_yriist_)?yriist__/

const link = atom({ plugin: 'yriist', key: 'link' } as const, { state: 'unknown' } as YriistLink, {
  shape: 'link-1',
})
const account = atom({ plugin: 'yriist', key: 'account' } as const, null as YriistAccount | null, {
  shape: 'account-1',
})
const deadlines = atom({ plugin: 'yriist', key: 'deadlines' } as const, [] as YriistDeadline[], {
  shape: 'deadlines-1',
})
const chats = atom({ plugin: 'yriist', key: 'chats' } as const, [] as YriistChat[], {
  shape: 'chats-1',
})
const bandHiddenFor = atom({ plugin: 'yriist', key: 'bandHiddenFor' } as const, '')
const doneIds = atom({ plugin: 'yriist', key: 'doneIds' } as const, [] as string[])

/** Russian titles of the server's tools, for the row label and toasts. */
const TITLES: Record<string, string> = {
  ask_yriist: 'ИИ-юрист',
  whoami: 'Аккаунт',
  chats_list: 'Чаты',
  chat_read: 'Чат',
  chats_search: 'Поиск по чатам',
  documents_list: 'Документы',
  document_read: 'Документ',
  document_create: 'Новый документ',
  templates_search: 'Шаблоны',
  template_read: 'Шаблон',
  document_from_template: 'Документ из шаблона',
  deadlines_list: 'Сроки',
  deadline_complete: 'Срок выполнен',
  deadline_save: 'Сохранить срок',
  cases_list: 'Дела',
  case_track: 'Мониторинг дела',
  web_search: 'Поиск в интернете',
  web_fetch: 'Чтение источника',
  court_search: 'Судебная практика',
  court_case: 'Карточка дела',
  law_article: 'Текст нормы',
  check_norms: 'Актуальность норм',
  verify_claims: 'Проверка ссылок и цифр',
  company_lookup: 'Карточка компании',
  company_check: 'Проверка контрагента',
  requisites_lookup: 'Реквизиты',
  calculate_penalty: 'Неустойка',
  calculate_court_fee: 'Госпошлина',
  calculate_deadline: 'Процессуальный срок',
  calculate: 'Расчёт',
  memory_search: 'Память',
  memory_save: 'Запоминаю',
  memory_delete: 'Забываю',
  skill_read: 'Навык',
}

/** Tools after which the register (deadlines) or the account changed. */
const TOUCHES_DEADLINES = new Set(['deadline_save', 'deadline_complete', 'case_track'])
const TOUCHES_ACCOUNT = new Set(['ask_yriist'])

function shortTool(name: string): string | null {
  return TOOL_PREFIX.test(name) ? name.replace(TOOL_PREFIX, '') : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

function whenText(daysLeft: number): string {
  if (daysLeft < 0) return `просрочен ${-daysLeft} ${plural(-daysLeft, 'день', 'дня', 'дней')}`
  if (daysLeft === 0) return 'сегодня'
  if (daysLeft === 1) return 'завтра'
  return `через ${daysLeft} ${plural(daysLeft, 'день', 'дня', 'дней')}`
}

function ruDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return match ? `${match[3]}.${match[2]}.${match[1]}` : iso
}

const SIGN_IN = 'Войдите в ЮрИИст: /mcp → yriist → Authenticate'

/** Why the server isn't connected, in the person's words. */
const REFUSALS: Record<string, string> = {
  disabled: 'Сервер yriist выключен: включите его в /mcp',
  policy: 'Сервер yriist запрещён политикой организации',
  unapproved: 'Сервер yriist не одобрен: подтвердите его в /mcp',
  failed: 'ЮрИИст недоступен: проверьте сеть и состояние сервера в /mcp',
}

/** The server's name as `$.mcp.call` takes it; null while it isn't connected. */
let serverName: string | null = null

type ServerLookup =
  | { ok: true; name: string }
  | { ok: false; message: string; signedOut: boolean }

async function server($: EngineInterface): Promise<ServerLookup> {
  if (serverName) return { ok: true, name: serverName }
  const connected = await $.mcp.connect('yriist').catch(() => null)
  if (!connected) return { ok: false, signedOut: false, message: REFUSALS.failed! }
  if (connected.isConnected) {
    serverName = connected.server
    return { ok: true, name: serverName }
  }
  if (connected.reason === 'auth') return { ok: false, signedOut: true, message: SIGN_IN }
  return {
    ok: false,
    signedOut: false,
    message: REFUSALS[connected.reason] ?? connected.message,
  }
}

/**
 * The tool's structured result. Claude Code hands it to a plugin as the JSON
 * text of the result's one block; `structuredContent` is read first for
 * builds that pass it as is. Null: the answer carried no data.
 */
function structuredOf(result: {
  content: readonly { type: string; text?: unknown }[]
  structuredContent?: unknown
}): Record<string, unknown> | null {
  const direct = asRecord(result.structuredContent)
  if (typeof direct.kind === 'string') return direct
  for (const block of result.content) {
    if (block.type !== 'text' || typeof block.text !== 'string') continue
    const text = block.text.trim()
    if (!text.startsWith('{')) continue
    try {
      const parsed = asRecord(JSON.parse(text))
      if (typeof parsed.kind === 'string') return parsed
    } catch {
      // Prose that happens to start with a brace.
    }
  }
  return null
}

type CallOutcome =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string; signedOut: boolean }

async function callTool(
  $: EngineInterface,
  tool: string,
  args: Record<string, unknown> = {},
): Promise<CallOutcome> {
  const found = await server($)
  if (!found.ok) return found
  try {
    const result = await $.mcp.call(found.name, tool, args)
    if (result.isError) {
      const text = result.content
        .map((block) => (block.type === 'text' ? str((block as { text?: unknown }).text) : ''))
        .join(' ')
      return { ok: false, signedOut: false, message: text.slice(0, 200) || 'Ошибка ЮрИИста' }
    }
    const data = structuredOf(result)
    if (!data) {
      // Never draw an empty account or «сроков нет» from an answer without data.
      return { ok: false, signedOut: false, message: 'ЮрИИст ответил без данных: обновите плагин' }
    }
    return { ok: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const signedOut = /401|unauthori[sz]ed|auth/i.test(message)
    // Ask the engine again next time: the server may have been reconnected.
    serverName = null
    return {
      ok: false,
      signedOut,
      message: signedOut ? SIGN_IN : message.slice(0, 200),
    }
  }
}

function parseAccount(data: Record<string, unknown>): YriistAccount {
  const user = asRecord(data.user)
  const plan = asRecord(data.plan)
  const links = asRecord(data.links)
  return {
    name: str(user.name),
    contact: str(user.contact) || null,
    plan: str(plan.name) || 'ЮрИИст',
    messagesLeft: typeof data.messagesLeft === 'number' ? data.messagesLeft : null,
    messagesLimit: num(data.messagesLimit, -1),
    messagesUsed: num(data.messagesUsed),
    chatAllowed: data.chatAllowed !== false,
    links: {
      app: str(links.app) || 'https://app.yriist.ru/chat',
      billing: str(links.billing) || 'https://app.yriist.ru/billing',
      connections: str(links.connections) || 'https://app.yriist.ru/account/connections',
    },
  }
}

function parseDeadlines(data: Record<string, unknown>): YriistDeadline[] {
  const items = Array.isArray(data.items) ? data.items : []
  return items.slice(0, 50).map((raw) => {
    const item = asRecord(raw)
    return {
      id: str(item.id),
      title: str(item.title) || 'Срок',
      dueDate: str(item.dueDate),
      daysLeft: num(item.daysLeft),
      legalBasis: str(item.legalBasis) || null,
      caseNumber: str(item.caseNumber) || null,
      status: str(item.status) || 'open',
    }
  })
}

function parseChats(data: Record<string, unknown>): YriistChat[] {
  const items = Array.isArray(data.items) ? data.items : []
  return items.slice(0, 8).map((raw) => {
    const item = asRecord(raw)
    return {
      id: str(item.id),
      title: str(item.title) || 'Без названия',
      date: str(item.date),
      url: str(item.url),
    }
  })
}

function urgent(list: readonly YriistDeadline[]): YriistDeadline[] {
  return list.filter((item) => item.status === 'open' && item.daysLeft <= 3)
}

/**
 * What «Скрыть» hides: these deadlines at this distance. A new urgent
 * deadline, or the same one a day closer, brings the band back.
 */
function bandKey(hot: readonly YriistDeadline[]): string {
  return hot
    .map((item) => `${item.id}:${item.daysLeft}`)
    .sort()
    .join(',')
}

async function paintStatus($: EngineInterface): Promise<void> {
  const state = await read($, link)
  if (state.state === 'signed_out') {
    $.ui.status('ЮрИИст: войдите — /mcp')
    return
  }
  const acc = await read($, account)
  if (!acc) {
    $.ui.status(undefined)
    return
  }
  const parts = [`ЮрИИст · ${acc.plan}`]
  if (acc.messagesLeft !== null) {
    parts.push(`${acc.messagesLeft} ${plural(acc.messagesLeft, 'сообщение', 'сообщения', 'сообщений')}`)
  }
  const hot = urgent(await read($, deadlines))
  const overdue = hot.filter((item) => item.daysLeft < 0).length
  if (overdue > 0) parts.push(`просрочено сроков: ${overdue}`)
  else if (hot.length > 0) parts.push(`сроков ≤3 дн.: ${hot.length}`)
  $.ui.status(parts.join(' · '))
}

async function refreshAccount($: EngineInterface): Promise<void> {
  const outcome = await callTool($, 'whoami')
  if (outcome.ok) {
    await update($, account, () => parseAccount(outcome.data))
    await update($, link, () => ({ state: 'connected', updatedAt: Date.now() }) as YriistLink)
  } else if (outcome.signedOut) {
    await update($, link, () => ({ state: 'signed_out', message: outcome.message }) as YriistLink)
  } else {
    await update($, link, () => ({ state: 'error', message: outcome.message }) as YriistLink)
  }
}

async function refreshDeadlines($: EngineInterface): Promise<void> {
  const outcome = await callTool($, 'deadlines_list', { status: 'open', limit: 50 })
  if (outcome.ok) {
    await update($, deadlines, () => parseDeadlines(outcome.data))
    await update($, doneIds, () => [])
  }
}

async function refreshChats($: EngineInterface): Promise<void> {
  const outcome = await callTool($, 'chats_list', { limit: 6 })
  if (outcome.ok) await update($, chats, () => parseChats(outcome.data))
}

let refreshing: Promise<void> | null = null

function refreshAll($: EngineInterface, withChats = true): Promise<void> {
  refreshing ??= (async () => {
    try {
      await refreshAccount($)
      if ((await read($, link)).state === 'connected') {
        await Promise.all([refreshDeadlines($), withChats ? refreshChats($) : undefined])
      }
      await paintStatus($)
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'yriist-panel',
      description: 'Панель ЮрИИста: аккаунт, сроки, последние чаты',
    })
    void refreshAll($)
    $.clock.every(REFRESH_MS, () => {
      void refreshAll($, false)
    })
    return next(e)
  })

  on('command.run', { command: 'yriist-panel' }, async ($) => {
    await $.ui.open({ id: PANE, title: 'ЮрИИст' })
    void refreshAll($)
    return { text: 'Панель ЮрИИста открыта.' }
  })

  // After a ЮрИИст tool changes the register or spends a message: refresh.
  on('tool.call', async ($, e, next) => {
    const tool = shortTool(String(e.tool))
    const ran = await next(e)
    if (!tool) return ran
    const failed = 'deny' in ran && ran.deny !== undefined ? true : ran.isError === true
    if (!failed && TOUCHES_DEADLINES.has(tool)) {
      void refreshDeadlines($).then(() => paintStatus($))
    }
    if (TOUCHES_ACCOUNT.has(tool)) {
      if (!failed) $.ui.toast('ЮрИИст ответил — чат сохранён в приложении')
      void refreshAccount($).then(() => paintStatus($))
      void refreshChats($)
    }
    if ((await read($, link)).state !== 'connected' && !failed) {
      void refreshAll($)
    }
    return ran
  }).catch(($, e, next) => next(e))

  // A label under every ЮрИИст tool row.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const tool = shortTool(String(e.props.tool))
    if (!tool) return next(e)
    const row = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    const title = TITLES[tool] ?? tool
    const state = e.props.isRunning
      ? 'работает…'
      : e.props.isErrored
        ? 'не получилось'
        : e.props.isInterrupted
          ? 'остановлено'
          : null
    return (
      <Box flexDirection="column">
        {row}
        <Box paddingLeft={2}>
          <Text color="claude">ЮрИИст</Text>
          <Text dimColor>
            {' · '}
            {title}
            {state ? ` · ${state}` : ''}
          </Text>
        </Box>
      </Box>
    )
  })

  // A band above the prompt while a deadline burns.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const done = new Set(await read($, doneIds))
    const hot = urgent(await read($, deadlines)).filter((item) => !done.has(item.id))
    if (hot.length === 0 || (await read($, bandHiddenFor)) === bandKey(hot)) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const first = hot[0]!
    const more = hot.length - 1
    return (
      <Box flexDirection="row" gap={1} flexWrap="wrap">
        <Text color={first.daysLeft < 0 ? 'error' : 'warning'} weight="semibold">
          ЮрИИст · срок {whenText(first.daysLeft)}:
        </Text>
        <Text wrap="truncate-end">
          {first.title} ({ruDate(first.dueDate)})
          {more > 0 ? ` и ещё ${more}` : ''}
        </Text>
        <Button
          key="open"
          label="Сроки"
          onPress={() => {
            void $.ui.open({ id: PANE, title: 'ЮрИИст' })
          }}
        />
        <Button
          key="hide"
          label="Скрыть"
          onPress={() => {
            void update($, bandHiddenFor, () => bandKey(hot))
          }}
        />
      </Box>
    )
  })

  // The «ЮрИИст» pane.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const state = await read($, link)
    const acc = await read($, account)
    const done = new Set(await read($, doneIds))
    const list = (await read($, deadlines)).filter((item) => item.status === 'open')
    const recent = await read($, chats)
    const width = Math.max(20, e.props.bodyColumns)
    const hot = urgent(list).filter((item) => !done.has(item.id))
    const isBandHidden = hot.length > 0 && (await read($, bandHiddenFor)) === bandKey(hot)

    if (state.state === 'signed_out' || !acc) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text weight="semibold">ЮрИИст — ИИ-юрист по праву РФ</Text>
          <Text dimColor={state.state !== 'error'} color={state.state === 'error' ? 'error' : undefined} wrap="wrap">
            {state.state === 'signed_out'
              ? 'Войдите: наберите /mcp, выберите «yriist» → Authenticate и разрешите доступ в окне ЮрИИста.'
              : state.state === 'error'
                ? state.message
                : 'Подключаюсь к ЮрИИсту…'}
          </Text>
          <Button key="retry" label="Проверить снова" onPress={() => void refreshAll($)} />
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1} width={width}>
        <Box flexDirection="column">
          <Box flexDirection="row" justifyContent="space-between">
            <Text weight="semibold">{acc.name || 'ЮрИИст'}</Text>
            <Text color="claude">{acc.plan}</Text>
          </Box>
          {acc && (
            <Text dimColor>
              {acc.messagesLeft === null
                ? 'Сообщения: без лимита'
                : `Сообщений осталось: ${acc.messagesLeft} из ${acc.messagesLimit}`}
              {acc.chatAllowed ? '' : ' · вопросы ИИ-юристу недоступны'}
            </Text>
          )}
          {state.state === 'error' && (
            <Text color="error" wrap="wrap">
              {state.message}
            </Text>
          )}
        </Box>

        <Box flexDirection="column">
          <Text weight="semibold">Сроки</Text>
          {list.length === 0 && <Text dimColor>Открытых сроков нет.</Text>}
          {list.slice(0, 12).map((item) => {
            const isDone = done.has(item.id)
            const color = item.daysLeft < 0 ? 'error' : item.daysLeft <= 3 ? 'warning' : 'success'
            return (
              <Box key={item.id} flexDirection="row" gap={1}>
                <Text color={isDone ? 'inactive' : color}>{ruDate(item.dueDate)}</Text>
                <Box flexDirection="column" flexGrow={1} flexShrink={1}>
                  <Text wrap="truncate-end" dimColor={isDone}>
                    {item.title}
                  </Text>
                  <Text dimColor wrap="truncate-end">
                    {whenText(item.daysLeft)}
                    {item.caseNumber ? ` · дело ${item.caseNumber}` : ''}
                    {item.legalBasis ? ` · ${item.legalBasis}` : ''}
                  </Text>
                </Box>
                {!isDone && (
                  <Button
                    key={`done-${item.id}`}
                    label="Готово"
                    onPress={() => {
                      void (async () => {
                        await update($, doneIds, (ids) => [...ids, item.id])
                        const outcome = await callTool($, 'deadline_complete', {
                          deadline_id: item.id,
                          status: 'done',
                        })
                        if (outcome.ok) {
                          $.ui.toast(`Срок «${item.title}» выполнен`)
                          await refreshDeadlines($)
                          await paintStatus($)
                        } else {
                          await update($, doneIds, (ids) => ids.filter((id) => id !== item.id))
                          $.ui.toast(outcome.message)
                        }
                      })()
                    }}
                  />
                )}
              </Box>
            )
          })}
        </Box>

        <Box flexDirection="column">
          <Text weight="semibold">Последние чаты</Text>
          {recent.length === 0 && <Text dimColor>Чатов пока нет.</Text>}
          {recent.map((chat) => (
            <Button
              key={`chat-${chat.id}`}
              plain
              onPress={() => {
                void $.prompt.fill({
                  text: `Прочитай мой чат ЮрИИста «${chat.title}» (chat_read, chat_id ${chat.id}) и `,
                })
              }}
            >
              {chat.title}
              <Text dimColor> {ruDate(chat.date.slice(0, 10))}</Text>
            </Button>
          ))}
        </Box>

        <Box flexDirection="row" gap={1} flexWrap="wrap">
          <Button key="refresh" label="Обновить" onPress={() => void refreshAll($)} />
          <Button
            key="ask"
            label="Спросить ИИ-юриста"
            variant="primary"
            onPress={() => {
              void $.prompt.fill({ text: '/yriist:ask ' })
            }}
          />
          {isBandHidden && (
            <Button
              key="band"
              label="Показывать срочные сроки"
              onPress={() => {
                void update($, bandHiddenFor, () => '')
              }}
            />
          )}
        </Box>
      </Box>
    )
  })
}
