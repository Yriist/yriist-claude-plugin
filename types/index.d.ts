/** The plugin's `$.state` contract: what the pane, band and status line draw. */

export type YriistLink =
  | { state: 'unknown' }
  | { state: 'connected'; updatedAt: number }
  | { state: 'signed_out'; message: string }
  | { state: 'error'; message: string }

export type YriistAccount = {
  name: string
  contact: string | null
  plan: string
  /** null: no monthly limit. */
  messagesLeft: number | null
  messagesLimit: number
  messagesUsed: number
  chatAllowed: boolean
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
}

export type YriistChat = {
  id: string
  title: string
  date: string
  url: string
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
    }
  }
}
