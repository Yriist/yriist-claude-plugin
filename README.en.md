# Yriist for Claude Code

**An AI lawyer for Russian law in your terminal.** The plugin connects
[ЮрИИст](https://yriist.ru) (Yriist) to Claude Code: case law, statutes checked
against several sources, counterparty checks, penalty / court-fee / deadline
calculators, and your own chats, documents and deadlines.

[![CI](https://github.com/Yriist/yriist-claude-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/Yriist/yriist-claude-plugin/actions/workflows/ci.yml)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)](.claude-plugin/plugin.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[Русский](README.md) · **English** · [MCP server for other clients](https://github.com/Yriist/yriist-mcp) · [Legal](LEGAL.md)

---

> [!NOTE]
> Commands, tool descriptions and answers are in Russian: the service works
> with Russian law and Russian-language sources.

## Install

You need a [Yriist](https://app.yriist.ru) account.

```
/plugin install yriist --marketplace Yriist/yriist-claude-plugin
```

Then sign in: `/mcp` → **yriist** → **Authenticate**, and check with
`/yriist:status`. From a shell:
`claude plugin install yriist --marketplace Yriist/yriist-claude-plugin`.

## What you get

| | |
| --- | --- |
| **MCP server `yriist`** | 34 tools — [list](https://github.com/Yriist/yriist-mcp/blob/main/docs/tools.md) |
| **Commands** | `/yriist:ask` · `research` · `court` · `law` · `claim` · `contract` · `company` · `deadlines` · `calc` · `status` |
| **Subagents** | `legal-researcher` · `contract-reviewer` · `court-prep` |
| **Skills** | `russian-legal-research` · `legal-documents-ru` · `procedural-deadlines-ru` |
| **Claude Code UI** | status-line entry, a band for urgent deadlines, the `/yriist-panel` pane, labels under tool calls |

Commands pre-approve read and calculator tools only. Anything that changes
your data (saving a deadline, creating a document, tracking a case) goes
through Claude Code's own permission prompt. `/yriist:ask` spends one message
of your Yriist plan.

## Scopes

| Scope | Grants |
| --- | --- |
| `yriist:research` | case law, statutes, counterparties, calculators, search |
| `yriist:read` | your chats, documents, templates, deadlines, cases, account |
| `yriist:write` | create a document, save a deadline, track a case, memory |
| `yriist:agent` | `ask_yriist` |

Access is revoked in [Account → Connections](https://app.yriist.ru/account/connections).

## Development

```sh
sh tests/mcp-headers.test.sh
claude plugin validate .
claude plugin test .
YRIIST_MCP_URL=http://localhost:3000/api/mcp claude --plugin-dir .
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## Legal

The plugin's code is MIT-licensed. The Yriist service is governed by its
[user agreement](https://yriist.ru/offer) and
[privacy policy](https://yriist.ru/privacy) (in Russian). AI output is
informational and is not legal advice. The plugin is an independent work of
ООО «ЮрИИст»; it is not an
Anthropic product and is not affiliated with or endorsed by Anthropic.
Full text: [LEGAL.md](LEGAL.md).
