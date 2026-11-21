# Yriist for Claude Code

**An AI lawyer for Russian law in your terminal.** The plugin connects
[ЮрИИст](https://yriist.ru) (Yriist) to Claude Code: case law, statutes checked
against several sources, counterparty checks, penalty, court-fee and deadline
calculators. You also work with your own Yriist data from the terminal: chats,
matters («Дела»), files, documents, deadlines and memory.

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
| **MCP server `yriist`** | 62 [tools](https://github.com/Yriist/yriist-mcp/blob/main/docs/tools.md): case law, statutes, counterparties, calculators, anonymization, and your personal-space chats, matters, files, documents, templates, deadlines, tracked court cases, review tables and memory (no team data). Chats and documents also come as resources (`yriist://chat/{id}`, `yriist://document/{id}`) via @ |
| **Commands** | ask and research: `/yriist:ask` · `research` · `court` · `law` · `verify` · `company` · `requisites` · `calc`; documents and files: `contract` · `claim` · `documents` · `templates` · `file` · `anonymize` · `review`; matters and account: `projects` · `case` · `deadlines` · `chats` · `memory` · `status` |
| **Subagents** | `legal-researcher` · `contract-reviewer` · `court-prep` · `citation-checker` |
| **Skills** | `russian-legal-research` · `legal-documents-ru` · `procedural-deadlines-ru` · `yriist-files` |
| **Claude Code UI** | status-line entry (plan, usage, urgent deadlines), a band for urgent deadlines, the `/yriist-panel` pane with «Готово»/«Вернуть», labels under tool calls |

Commands pre-approve read, search and calculator tools. `/yriist:ask` spends
one message of your Yriist plan, so only you can run it: Claude does not invoke
it on its own. If the call is cut, the command finds the chat with
`chats_list` and does not ask again. Claude Code asks your permission before
`ask_yriist`, before anything that changes your data (uploading a file,
creating or editing a document, saving a deadline, tracking a case, deleting)
and before the paid `company_check`. The pane's «Готово»/«Вернуть» buttons act
at once because you press them yourself.

Claude Code reads text files and PDFs with a text layer itself. For DOCX, DOC,
RTF and scans, Claude uploads the file to Yriist (`file_upload_begin`, a
`curl` PUT, `file_upload_finish`) and reads it back with `file_read`. The file
stays in your Yriist «Файлы» and counts against your plan's storage.

The plugin raises the per-call limit for this server to 300 s (`timeout` in
`.mcp.json`). It re-reads the account and deadlines hourly through a cache
shared by all sessions, and chats only while the pane is open. `/config` →
yriist turns the status line and the band off, sets the «urgent» threshold and
the refresh interval.

## Scopes

| Scope | Tools |
| --- | --- |
| `yriist:research` | case law, statutes, counterparties, calculators, web search and fetch, `anonymize` |
| `yriist:read` | `whoami` and every list and read: chats, matters, files (`file_read`), documents (`document_export`), templates, deadlines, court cases, review tables, `memory_list`, `memory_search` |
| `yriist:write` | every create, update and delete: `project_*`, `file_upload*`, `document_*`, `deadline_*`, `case_*`, `review_table_create`, `memory_save`, `memory_delete`, `chat_delete` |
| `yriist:agent` | `ask_yriist`, `chat_stop` |

You revoke access in [Account → Connections](https://app.yriist.ru/account/connections).

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
