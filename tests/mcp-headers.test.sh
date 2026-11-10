#!/bin/sh
# Tests scripts/mcp-headers.sh: what it prints decides whether Claude Code
# signs in with OAuth ({}) or sends a personal token. Run: sh tests/mcp-headers.test.sh
set -u
script="$(cd "$(dirname "$0")/.." && pwd)/scripts/mcp-headers.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
failed=0

check() { # name, expected, actual
  if [ "$2" = "$3" ]; then
    printf 'ok   %s\n' "$1"
  else
    printf 'FAIL %s\n  expected: %s\n  actual:   %s\n' "$1" "$2" "$3"
    failed=1
  fi
}

token='yrp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR'
mkdir -p "$tmp/yriist"

check 'no token: OAuth' '{}' "$(env -u YRIIST_TOKEN XDG_CONFIG_HOME="$tmp" sh "$script")"

printf '%s\r\n' "$token" > "$tmp/yriist/token"
check 'token file (CRLF): header' "{\"Authorization\":\"Bearer $token\"}" \
  "$(env -u YRIIST_TOKEN XDG_CONFIG_HOME="$tmp" sh "$script")"

printf 'not a token"}, {"x":"y\n' > "$tmp/yriist/token"
check 'malformed file: OAuth, nothing injected' '{}' \
  "$(env -u YRIIST_TOKEN XDG_CONFIG_HOME="$tmp" sh "$script")"

rm "$tmp/yriist/token"
check 'env token: header' "{\"Authorization\":\"Bearer $token\"}" \
  "$(YRIIST_TOKEN="$token" XDG_CONFIG_HOME="$tmp" sh "$script")"

check 'malformed env token: OAuth' '{}' \
  "$(YRIIST_TOKEN='yrp_short' XDG_CONFIG_HOME="$tmp" sh "$script")"

exit "$failed"
