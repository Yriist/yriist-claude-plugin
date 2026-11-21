import { expect, mock, test } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'
import type { On } from 'claude-code'

/**
 * `claude plugin test .` — the hooks module against the engine itself. The
 * hooks registered here stand for the engine and for the ЮрИИст MCP server:
 * what they answer is what the server's tools return in `structuredContent`.
 */

const PANE = {
  plugin: 'yriist',
  component: 'Pane',
  requestId: 'yriist',
  props: {
    title: 'ЮрИИст',
    isFocused: false,
    bodyColumns: 48,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const BAND = {
  plugin: 'yriist',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 4,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 4 },
    view: {},
  },
} as const

/** A plan with a message allowance (free plans). */
const ACCOUNT: Record<string, unknown> = {
  kind: 'account',
  user: { name: 'Анна Петрова', contact: 'anna@example.com' },
  plan: { id: 'pro', name: 'Профи' },
  meter: { kind: 'messages', used: 58, limit: 100, percent: 58 },
  usagePercent: 58,
  messagesUsed: 58,
  messagesLimit: 100,
  messagesLeft: 42,
  chatAllowed: true,
  links: {
    app: 'https://app.yriist.ru/chat',
    billing: 'https://app.yriist.ru/billing',
    connections: 'https://app.yriist.ru/account/connections',
  },
}

/** A paid plan: metered by the month's AI budget, no message cap. */
const PAID_ACCOUNT: Record<string, unknown> = {
  ...ACCOUNT,
  meter: { kind: 'budget', used: 63.4, limit: 100, percent: 63.4 },
  usagePercent: 63.4,
  messagesUsed: 210,
  messagesLimit: -1,
  messagesLeft: null,
}

const deadline = (id: string, title: string, daysLeft: number, extra: Record<string, unknown> = {}) => ({
  id,
  title,
  dueDate: '2026-11-12',
  daysLeft,
  legalBasis: 'ч. 1 ст. 259 АПК РФ',
  caseNumber: 'А40-1/2026',
  status: 'open',
  needsConfirmation: false,
  ...extra,
})

type Server = {
  calls: { tool: string; args: Record<string, unknown> }[]
  status: (string | undefined)[]
  toasts: string[]
  clock: MockClock
  account: Record<string, unknown>
  deadlines: ReturnType<typeof deadline>[]
  chats: Record<string, unknown>[]
  /** Thrown by every call when set: a transport failure. */
  failWith: Error | null
  relay: (structured: unknown) => {
    content: { type: string; text: string }[]
    isError: boolean
    structuredContent?: unknown
  }
}

/** The engine and a signed-in ЮрИИст server beneath the plugin. */
type Connect =
  | { isConnected: true; server: string }
  | { isConnected: false; reason: 'auth' | 'disabled'; message: string }

function world(
  on: On,
  connect: Connect = { isConnected: true, server: 'plugin:yriist:yriist' },
  store: Record<string, unknown> = {},
): Server {
  const server: Server = {
    calls: [],
    status: [],
    toasts: [],
    clock: mock.clock(on, { now: NOW }),
    account: ACCOUNT,
    deadlines: [deadline('d1', 'Апелляционная жалоба', 2), deadline('d2', 'Отзыв на иск', 20)],
    chats: [
      { id: 'c1', title: 'Неустойка по поставке', date: '2026-11-09T10:00:00.000Z', url: 'https://app.yriist.ru/chat/c1', actions: [{ label: 'Открыть здесь', tool: 'chat_read', args: { chat_id: 'c1' } }] },
    ],
    failWith: null,
    relay: (structured) => ({
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      isError: false,
    }),
  }
  mock.store(on, store)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', (_, e) => {
    server.status.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', (_, e) => {
    server.toasts.push(e.text)
    return { value: undefined }
  })
  on('mcp.connect', () => ({ value: connect }))
  on('mcp.call', (_, e) => {
    server.calls.push({ tool: e.tool, args: e.args })
    // A refused call: `$.mcp.call` rejects with this text, as on a transport failure.
    if (server.failWith) return { deny: server.failWith.message }
    // As Claude Code relays a structured result to a plugin: its JSON, as text.
    const answer = (structuredContent: unknown) => ({
      value: server.relay(structuredContent),
    })
    switch (e.tool) {
      case 'whoami':
        return answer(server.account)
      case 'deadlines_list':
        return answer({ kind: 'deadlines', items: server.deadlines.filter((d) => d.status === 'open') })
      case 'chats_list':
        return answer({ kind: 'list', title: 'Чаты', entity: 'chat', items: server.chats })
      case 'deadline_update': {
        const item = server.deadlines.find((d) => d.id === e.args.deadline_id)
        if (item) item.status = e.args.status === 'open' ? 'open' : 'done'
        return answer({ kind: 'deadlines', items: [] })
      }
      default:
        return { value: { content: [{ type: 'text', text: 'нет такого' }], isError: true } }
    }
  })
  return server
}

const NOW = Date.UTC(2026, 10, 10, 9, 0, 0)

/**
 * Starts the session and waits for the plugin's first read of the server: it
 * runs unawaited at session start, and a press resolves only once the read
 * it joins has settled.
 */
async function start($: Engine): Promise<void> {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: (await ui.find({ key: 'refresh' })) ? 'refresh' : 'retry' })
  await ui.unmount()
}

test('the pane shows the account, deadlines and chats on every surface', async ($, on) => {
  const server = world(on)
  await start($)

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: 'Анна Петрова' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Сообщений осталось: 42 из 100' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Апелляционная жалоба' })).toBeDefined()
    expect(await ui.find({ text: 'Неустойка по поставке' })).toBeDefined()
    await ui.unmount()
  }
  expect(server.status.at(-1)).toBe('ЮрИИст · Профи · 42 сообщения · сроков ≤3 дн.: 1')
})

test('«Готово» marks the deadline done on the server', async ($, on) => {
  const server = world(on)
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'done-d1' })
  expect(server.calls).toContainEqual({
    tool: 'deadline_update',
    args: { deadline_id: 'd1', status: 'done' },
  })
  expect(server.toasts).toContain('Срок «Апелляционная жалоба» выполнен')
  expect(await ui.find({ type: 'Text', text: /^Апелляционная жалоба$/ })).toBeUndefined()

  // «Вернуть» puts it back in work.
  await ui.press({ key: 'undo-d1' })
  expect(server.calls).toContainEqual({
    tool: 'deadline_update',
    args: { deadline_id: 'd1', status: 'open' },
  })
  expect(server.toasts).toContain('Срок «Апелляционная жалоба» снова в работе')
  expect(await ui.find({ type: 'Text', text: /^Апелляционная жалоба$/ })).toBeDefined()
  expect(await ui.find({ key: 'undo-d1' })).toBeUndefined()
  await ui.unmount()
})

test('the band shows an urgent deadline; «Скрыть» hides it until another one burns', async ($, on) => {
  const server = world(on)
  await start($)

  let band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ type: 'Text', text: /срок через 2 дня/ })).toBeDefined()
  await band.press({ key: 'hide' })
  await band.unmount()

  band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ type: 'Text', text: /срок/ })).toBeUndefined()
  await band.unmount()

  // Another deadline becomes urgent: the band is back.
  server.deadlines = [...server.deadlines, deadline('d3', 'Кассационная жалоба', 1)]
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'refresh' })
  await pane.unmount()
  band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ type: 'Text', text: /и ещё 1/ })).toBeDefined()
  await band.unmount()
})

test('signed out: the pane says how to sign in and nothing is called', async ($, on) => {
  const server = world(on, { isConnected: false, reason: 'auth', message: 'needs sign-in' })
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Authenticate/ })).toBeDefined()
  expect(server.calls).toEqual([])
  expect(server.status.at(-1)).toBe('ЮрИИст: войдите — /mcp')
  await ui.unmount()
})

test('a server that is off is not reported as signed out', async ($, on) => {
  world(on, { isConnected: false, reason: 'disabled', message: 'disabled' })
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /выключен/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Authenticate/ })).toBeUndefined()
  await ui.unmount()
})

test('a ЮрИИст tool row carries its Russian label', async ($, on) => {
  world(on)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>row</Text>
  })
  await start($)

  const ui = await $.ui.mount({
    plugin: 'yriist',
    component: 'ToolUse',
    surface: 'terminal',
    props: {
      tool: 'mcp__plugin_yriist_yriist__court_search',
      isRunning: true,
      isErrored: false,
      isInterrupted: false,
    },
  } as never)
  expect(await ui.find({ type: 'Text', text: /Судебная практика · работает…/ })).toBeDefined()
  await ui.unmount()
})

test('a host that passes structuredContent as is works too', async ($, on) => {
  const server = world(on)
  server.relay = (structuredContent) => ({
    content: [{ type: 'text', text: 'Аккаунт: …' }],
    isError: false,
    structuredContent,
  })
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'Анна Петрова' })).toBeDefined()
  await ui.unmount()
})

test('an answer without data is an error, not an empty account', async ($, on) => {
  const server = world(on)
  server.relay = () => ({ content: [{ type: 'text', text: 'Аккаунт: Анна' }], isError: false })
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /без данных/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Открытых сроков нет/ })).toBeUndefined()
  await ui.unmount()
})

test('a paid plan shows how much of the month is used, not «без лимита»', async ($, on) => {
  const server = world(on)
  server.account = PAID_ACCOUNT
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Использовано в этом месяце: 63% лимита тарифа/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /без лимита/ })).toBeUndefined()
  await ui.unmount()
  expect(server.status.at(-1)).toBe('ЮрИИст · Профи · использовано 63% · сроков ≤3 дн.: 1')
})

test('a session reads account and deadlines once at start; chats wait for the pane', async ($, on) => {
  const server = world(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await server.clock.settle()
  expect(server.calls.map((call) => call.tool).sort()).toEqual(['deadlines_list', 'whoami'])

  await $.command.run({ command: 'yriist-panel', args: '' } as never)
  await server.clock.settle()
  expect(server.calls.map((call) => call.tool)).toContain('chats_list')
})

test('another session\'s fresh read is used instead of asking the server', async ($, on) => {
  const snapshot = {
    at: NOW - 5 * 60 * 1000,
    account: {
      name: 'Анна Петрова',
      plan: 'Профи',
      meter: { kind: 'messages', percent: 58 },
      messagesLeft: 42,
      messagesLimit: 100,
      messagesUsed: 58,
      chatAllowed: true,
      chatReason: null,
      links: { app: 'a', billing: 'b', connections: 'c' },
    },
    deadlines: [deadline('d1', 'Апелляционная жалоба', 2)],
  }
  const server = world(on, undefined, { 'snapshot-2': snapshot })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await server.clock.settle()
  expect(server.calls).toEqual([])
  expect(server.status.at(-1)).toBe('ЮрИИст · Профи · 42 сообщения · сроков ≤3 дн.: 1')

  // An hour on, the cache is stale: the server is asked again.
  await server.clock.advance(60 * 60 * 1000)
  expect(server.calls.map((call) => call.tool).sort()).toEqual(['deadlines_list', 'whoami'])
})

test('a deadline whose start is unconfirmed says so; a long list says how many more', async ($, on) => {
  const server = world(on)
  server.deadlines = [
    deadline('d0', 'Кассационная жалоба', 5, { needsConfirmation: true }),
    ...Array.from({ length: 14 }, (_, i) => deadline(`x${i}`, `Срок ${i}`, 10 + i)),
  ]
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /дата начала не подтверждена/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /и ещё 3/ })).toBeDefined()
  await ui.unmount()
})

test('a chat closed on the free plan is listed, but not offered to read', async ($, on) => {
  const server = world(on)
  server.chats = [
    ...server.chats,
    { id: 'c2', title: 'Старый договор', date: '2026-10-01T10:00:00.000Z', url: 'u', subtitle: 'Закрыт на бесплатном тарифе', actions: [] },
  ]
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Старый договор · закрыт на бесплатном тарифе/ })).toBeDefined()
  expect(await ui.find({ key: 'chat-c2', type: 'Button' })).toBeUndefined()
  expect(await ui.find({ key: 'chat-c1' })).toBeDefined()
  await ui.unmount()
})

test('a chat pulled into the conversation is read with chat_read', async ($, on) => {
  world(on)
  const fills: string[] = []
  on('prompt.fill', (_, e) => {
    fills.push(String((e as { text?: unknown }).text))
    return { isFilled: true } as never
  })
  await start($)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'chat-c1' })
  expect(fills.at(-1)).toMatch(/chat_read, chat_id c1\) и /)
  await ui.unmount()
})

test('an answer still being prepared is not announced as saved', async ($, on) => {
  const server = world(on)
  on('tool.call', () =>
    ({
      result: { content: [{ type: 'text', text: '{}' }] },
      text: JSON.stringify({ kind: 'answer', status: 'running', chatId: 'c9' }),
    }) as never,
  )
  await start($)
  await $.tool.call({ tool: 'mcp__plugin_yriist_yriist__ask_yriist', question: 'Вопрос' } as never)
  await server.clock.settle()
  expect(server.toasts).toContain('ЮрИИст ещё отвечает — ответ появится в чате приложения')
  expect(server.toasts).not.toContain('ЮрИИст ответил — чат сохранён в приложении')
  // The agent may have saved deadlines: the register is read again.
  expect(server.calls.filter((call) => call.tool === 'deadlines_list').length).toBeGreaterThan(1)
})

test('only a sign-in failure reads as signed out', async ($, on) => {
  const server = world(on)
  server.failWith = new Error('Author field missing in response')
  await start($)
  let ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Author field missing/ })).toBeDefined()
  await ui.unmount()

  server.failWith = new Error('HTTP 401 from server')
  ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'retry' })
  expect(await ui.find({ type: 'Text', text: /Authenticate/ })).toBeDefined()
  await ui.unmount()
  expect(server.status.at(-1)).toBe('ЮрИИст: войдите — /mcp')
})

test('options turn the status line and the band off', { options: { status_line: false, deadline_band: false } }, async ($, on) => {
  const server = world(on)
  await start($)
  expect(server.status.filter((text) => text !== undefined)).toEqual([])
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ type: 'Text', text: /срок/ })).toBeUndefined()
  await band.unmount()
})

test('«близко» follows the option', { options: { band_days: 1 } }, async ($, on) => {
  const server = world(on)
  await start($)
  expect(server.status.at(-1)).toBe('ЮрИИст · Профи · 42 сообщения')
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ type: 'Text', text: /срок/ })).toBeUndefined()
  await band.unmount()
})
