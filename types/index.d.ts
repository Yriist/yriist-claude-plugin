/** The plugin's `$.state` contract: what the pane, band and status line draw. */

export type YriistLink =
  | { state: 'unknown' }
  | { state: 'connected'; updatedAt: number }
  | { state: 'signed_out'; message: string }
  | { state: 'error'; message: string }

/**
 * How the plan is metered, as the server's `whoami` reports it: a message
 * allowance (free plans), a monthly AI budget or token cap in percent (paid
 * plans), or nothing.
 */
export type YriistMeter = {
  kind: 'messages' | 'budget' | 'tokens' | 'none'
  /** 0-100, how much of the month's allowance is used. */
  percent: number
}

export type YriistAccount = {
  name: string
  plan: string
  meter: YriistMeter
  /** Messages left this month; null when the plan has no message cap. */
  messagesLeft: number | null
  messagesLimit: number
  messagesUsed: number
  chatAllowed: boolean
  chatReason: string | null
  links: { app: string; billing: string; connections: string }
}

export type YriistDeadline = {
  id: string
  title: string
  dueDate: string
  daysLeft: number
  legalBasis: string | null
  caseNumber: string | null
  status: string
  /** The start of the term (the event it runs from) isn't confirmed. */
  needsConfirmation: boolean
}

export type YriistChat = {
  id: string
  title: string
  date: string
  url: string
  /** Hidden on the free plan: listed, but can't be read. */
  locked: boolean
}

declare module 'claude-code' {
  interface PluginState {
    yriist: {
      link: Shaped<YriistLink>
      account: Shaped<YriistAccount | null>
      deadlines: Shaped<YriistDeadline[]>
      chats: Shaped<YriistChat[]>
      /** The set of urgent deadlines the person hid the band for ('' — shown). */
      bandHiddenFor: string
      /** Ids of deadlines marked done from the pane while the list refreshes. */
      doneIds: string[]
      /** The deadline last marked done from the pane, for «Вернуть». */
      lastDone: Shaped<{ id: string; title: string } | null>
    }
  }
}
