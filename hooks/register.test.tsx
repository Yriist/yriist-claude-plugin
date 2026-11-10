import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
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

const ACCOUNT = {
  kind: 'account',
  user: { name: 'Анна Петрова', contact: 'anna@example.com' },
  plan: { id: 'pro', name: 'Профи' },
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

const deadline = (id: string, title: string, daysLeft: number) => ({
  id,
  title,
  dueDate: '2026-11-12',
  daysLeft,
  legalBasis: 'ч. 1 ст. 259 АПК РФ',
  caseNumber: 'А40-1/2026',
  status: 'open',
})

type Server = {
  calls: { tool: string; args: Record<string, unknown> }[]
  status: (string | undefined)[]
  toasts: string[]
  deadlines: ReturnType<typeof deadline>[]
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
): Server {
  const server: Server = {
    calls: [],
    status: [],
    toasts: [],
    deadlines: [deadline('d1', 'Апелляционная жалоба', 2), deadline('d2', 'Отзыв на иск', 20)],
    relay: (structured) => ({
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      isError: false,
    }),
  }
  mock.clock(on)
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
    // As Claude Code relays a structured result to a plugin: its JSON, as text.
    const answer = (structuredContent: unknown) => ({
      value: server.relay(structuredContent),
    })
    switch (e.tool) {
      case 'whoami':
        return answer(ACCOUNT)
      case 'deadlines_list':
        return answer({ kind: 'deadlines', items: server.deadlines })
      case 'chats_list':
        return answer({
          kind: 'list',
          items: [{ id: 'c1', title: 'Неустойка по поставке', date: '2026-11-09T10:00:00.000Z', url: 'https://app.yriist.ru/chat/c1' }],
        })
      case 'deadline_complete':
        server.deadlines = server.deadlines.filter((item) => item.id !== e.args.deadline_id)
        return answer({ kind: 'deadlines', items: [] })
      default:
        return { value: { content: [{ type: 'text', text: 'нет такого' }], isError: true } }
    }
  })
  return server
}

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
    tool: 'deadline_complete',
    args: { deadline_id: 'd1', status: 'done' },
  })
  expect(server.toasts).toContain('Срок «Апелляционная жалоба» выполнен')
  expect(await ui.find({ type: 'Text', text: 'Апелляционная жалоба' })).toBeUndefined()
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
