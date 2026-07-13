# Scar Tissue — a debugging agent that never repeats a failed fix

**Walrus Session 5 — Walrus Memory Prompt Jam submission**

> Every developer has watched an AI agent confidently retry the exact fix that
> already failed — yesterday, or five minutes ago in another session. The agent
> has no memory of its own dead ends. Scar Tissue is a system prompt that gives
> any coding agent a permanent, cross-session debugging memory on Walrus:
> every error, every failed attempt, every verified fix, and every generalized
> lesson — recalled *before* the agent is allowed to propose anything.

## The prompt

Full copy-pasteable text: **[PROMPT.md](./PROMPT.md)**

Drop it into:

| Client | Where |
|---|---|
| Claude Code | `CLAUDE.md` in your repo (or `~/.claude/CLAUDE.md` globally) |
| Cursor | `.cursor/rules/` or Rules for AI |
| Claude Desktop / any MCP client | System prompt / project instructions |

Requires the Walrus Memory MCP server ([setup below](#setup)).

## Problem statement

AI coding agents forget their debugging history the moment a session ends.
The same `TypeError` gets re-investigated from scratch, the same dead-end fix
gets re-proposed, and the developer pays for the same investigation twice —
daily, on any codebase they touch regularly. Session-local memory doesn't fix
this: the knowledge has to survive the session, the machine, and even the
client.

## What the prompt does

Four rules, enforced in order:

1. **RECALL FIRST.** On any error/failed test, before proposing a fix, the
   agent recalls a normalized error signature against three namespaces:
   `debug-patterns` (general lessons), `debug-fixes` (verified cures),
   `debug-failures` (known dead ends). Fixes on the dead-end list are
   **blacklisted** — the agent may not propose them.
2. **WRITE ON FAILURE.** Every failed fix attempt is written to
   `debug-failures` immediately — before the next idea — as a structured line:
   `ERROR | CONTEXT | TRIED | WHY-FAILED`.
3. **WRITE ON VERIFIED FIX.** Only after proof (test passes, command
   succeeds), the fix is written to `debug-fixes` as
   `ERROR | ROOT-CAUSE | FIX | VERIFIED-BY`. Unverified fixes are never stored.
4. **SYNTHESIZE.** When two or more stored fixes share a root cause, the agent
   writes one generalized `PATTERN | SEEN-IN | CHECK-FIRST` lesson to
   `debug-patterns` — checked first on every future recall.

Because MemWal memories are plain text (no tags/metadata fields), the prompt
also defines **error-signature normalization** (strip paths, line numbers,
hashes, timestamps; keep error class, message core, symbol, tool) so writes
made today are findable by semantic search months from now. Hygiene rules
cover secrets redaction, one-fact-per-blob, and graceful degradation when the
relayer is unreachable.

## It debugged its own setup (true story)

While building this submission, the memwal MCP stdio bridge failed with
`bridge.session_stale: Unknown sessionId … 404`. The fix — connect over
streamable HTTP with `Authorization: Bearer <delegate-key>` headers instead —
was stored to `debug-fixes` the first time it was solved. When a later session
hit the same error and re-registered the broken stdio bridge, **one recall
returned the exact stored fix and it was applied in under a minute.** That
recall is in the demo video. The scar tissue works on itself.

## Proof of writes (Walrus Mainnet)

- **Agent ID (MEMWAL_AGENT_ID):** `a5eabb52488822aebad9adbbdc635854fc3bd8397d393c0dc364d69a169ffad0`
- **Account:** `0xac23fad65dfa42aded1fb422b599c4c0d972f7cfde2d9d95645e6fe490a2f4e7`
- **Blob count:** 18 blobs on Walrus Mainnet, all written by the agent
  following this prompt — zero manual writes (`tools/count.mjs`, 2026-07-13):

  ```
  debug-fixes:     10  (verified fixes: ERROR | ROOT-CAUSE | FIX | VERIFIED-BY)
  debug-failures:   5  (dead ends:      ERROR | CONTEXT | TRIED | WHY-FAILED)
  debug-patterns:   3  (synthesized:    PATTERN | SEEN-IN | CHECK-FIRST)
  ```

Verify yourself (with your own delegate credentials):

```bash
cd tools && pnpm install
MEMWAL_PRIVATE_KEY=... MEMWAL_ACCOUNT_ID=... node count.mjs
```

## How it was proven

We planted four realistic bugs in a small Node project — wrong API envelope
shape, BOM-prefixed JSON, in-place `sort()` mutation, `forEach(async)`
fire-and-forget — and ran one agent session per bug with the prompt installed.
Every session recalled before fixing, wrote failures as they happened, and
stored each verified fix. A final maintenance session recalled all fixes,
grouped them by root cause, and **declined to write** patterns that were
already covered — the prompt's synthesis rule produces no junk blobs.

To try it on your own codebase: install the prompt (below), hit any real
error, then open a fresh session later and hit a similar one — the agent
recalls its own fix and applies it without re-investigating.

## Setup

1. Sign up at [memory.walrus.xyz](https://memory.walrus.xyz) (Sui wallet login).
2. Add the MCP server to your client. Claude Code:

   ```bash
   claude mcp add --scope user memwal -- npx -y @mysten-incubation/memwal-mcp --prod
   ```

   First run opens a browser sign-in and writes `~/.memwal/credentials.json`.

   > If the stdio bridge fails with `bridge.session_stale` (a relayer-side
   > issue we hit and [filed](https://github.com/MystenLabs/MemWal/issues)),
   > connect over HTTP instead:
   >
   > ```bash
   > claude mcp add --scope user --transport http memwal \
   >   https://relayer.memory.walrus.xyz/api/mcp \
   >   --header "Authorization: Bearer <delegate-private-key-hex>" \
   >   --header "X-MemWal-Account-Id: <account-id>"
   > ```

3. Copy [PROMPT.md](./PROMPT.md) into your client's system-prompt location
   (table above).
4. Hit an error. That's it — the agent does the rest.

## Why this belongs in the prompt library

- Solves a pain every agent user has, several times a day.
- Exercises five of the eight MCP tools (`recall`, `remember`,
  `remember_bulk`, `restore`, `health`) with explicit rules for **what** to
  write, **when** to write it, and **how** to structure it — not an
  occasional `memwal_remember`.
- Namespace design (`fixes` / `failures` / `patterns`) turns MemWal's flat,
  metadata-free text blobs into a queryable knowledge base, and the synthesis
  rule mirrors the multi-namespace research direction from the challenge
  brief at a scale a beginner can actually run.
- Generates meaningful writes as a side effect of normal work — no artificial
  activity needed.
