#!/bin/sh
# Headers for the ЮрИИст MCP server (Claude Code runs this at every connect).
#
# Default: prints {} — no Authorization header, so Claude Code signs in with
# OAuth (/mcp → yriist → Authenticate).
#
# Token mode: a personal token from https://app.yriist.ru/account/connections
# in ~/.config/yriist/token (one line, chmod 600). Claude Code strips
# secret-looking variables (*_TOKEN) from this script's environment, so the
# file is the way; $YRIIST_TOKEN is still read for other runners.
# A configured Authorization header turns Claude Code's OAuth off for this
# server, so set a token only when you want token mode.

token="${YRIIST_TOKEN:-}"
if [ -z "$token" ]; then
  file="${XDG_CONFIG_HOME:-$HOME/.config}/yriist/token"
  if [ -r "$file" ]; then
    token=$(head -n 1 "$file" | tr -d '[:space:]')
  fi
fi

# Only a well-formed token (letters and digits after the prefix) is sent.
if printf '%s' "$token" | grep -Eq '^yr[pt]_[A-Za-z0-9]{20,120}$'; then
  printf '{"Authorization":"Bearer %s"}\n' "$token"
else
  printf '{}\n'
fi
