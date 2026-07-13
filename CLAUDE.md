## Debugging Memory Protocol (Walrus Memory)

You have permanent, cross-session memory through the Walrus Memory MCP tools
(`memwal_recall`, `memwal_remember`, `memwal_remember_bulk`, `memwal_analyze`,
`memwal_restore`, `memwal_health`). Use them to build **scar tissue**: a
durable record of every error you encounter, every fix that failed, and every
fix that worked — so you never repeat a failed fix and never re-solve a solved
problem.

### Namespaces

Use exactly these three namespaces. Never invent others for debugging data.

| Namespace        | Contains                                        |
|------------------|-------------------------------------------------|
| `debug-fixes`    | Verified fixes only — the cure catalog           |
| `debug-failures` | Failed fix attempts — the dead-end map           |
| `debug-patterns` | Generalized lessons synthesized from 2+ fixes    |

### Error signatures (how to make memories findable)

Before writing or recalling, normalize the error into a stable **signature**:

1. Keep: error class/type, the core message, the failing symbol or API name,
   the language/tool/framework name.
2. Strip: absolute file paths (keep the basename), line numbers, memory
   addresses, hashes, timestamps, PIDs, request IDs, local usernames.
3. Collapse whitespace to single spaces.

Example: `TypeError: Cannot read properties of undefined (reading 'map') |
react | UserList.tsx` — not the full stack trace.

### RECALL FIRST — before any debugging

The moment you encounter an error, failed test, crash, or unexpected
behavior, and **before proposing any fix**:

1. `memwal_recall` the signature in `debug-patterns` (limit 5) — a general
   lesson may short-circuit the whole investigation.
2. `memwal_recall` the signature in `debug-fixes` (limit 5) — if a verified
   fix matches, apply it first and say you are applying a remembered fix.
3. `memwal_recall` the signature in `debug-failures` (limit 10) — build a
   blacklist. **Never propose a fix that appears in the failure list for a
   matching error.** If you have no better idea than a blacklisted fix, say
   so explicitly and explain what was tried before and why it failed.

If recall returns nothing relevant (results clearly about different errors),
say "no prior scar tissue" and debug normally.

### WRITE ON FAILURE — immediately, not at session end

Every time a fix attempt does not resolve the error (test still fails,
error persists, new error appears), write to `debug-failures` **before
trying the next idea**:

```
ERROR: <signature> | CONTEXT: <language/framework/tool + relevant versions if known> | TRIED: <the exact change attempted> | WHY-FAILED: <the observed result, not a guess>
```

One attempt per memory. If you burned through several attempts before
getting a chance to write, use `memwal_remember_bulk` with one entry each.

### WRITE ON VERIFIED FIX — only after proof

When a fix works, verify it first (test passes, command succeeds, behavior
confirmed). Only then write to `debug-fixes`:

```
ERROR: <signature> | ROOT-CAUSE: <the actual underlying cause> | FIX: <the exact change that resolved it> | VERIFIED-BY: <the test/command/observation that proved it>
```

Never write a fix you have not verified. A plausible-sounding unverified fix
stored as truth is worse than no memory at all.

### SYNTHESIZE — turn repetition into pattern

Whenever a `debug-fixes` recall returns **two or more memories that share a
root cause** (same class of mistake, different surface errors), write one
generalized lesson to `debug-patterns`:

```
PATTERN: <the general rule> | SEEN-IN: <the 2+ error signatures it came from> | CHECK-FIRST: <the one thing to inspect before anything else when this pattern might apply>
```

Patterns are the highest-value memories — they prevent whole categories of
errors, not single ones. Check `debug-patterns` first on every recall.

### Hygiene rules

- **One fact per memory.** Never combine two errors or two fixes in one blob.
- **No secrets.** Never store API keys, tokens, passwords, private keys,
  `.env` values, or user personal data — even inside an error message.
  Redact them as `<REDACTED>` before writing.
- **No trivia.** Do not store one-character typos you immediately caught, or
  errors caused by code you were mid-way through writing. Store only errors
  that cost real effort or would plausibly recur.
- **Full statements.** Write complete, self-contained facts. A memory must
  make sense a month from now with zero surrounding context.
- **Recovery.** If `memwal_recall` returns nothing but you know memories
  exist, run `memwal_restore` on the namespace, then recall again.
- **Connectivity.** If memory calls error out, run `memwal_health` once; if
  the relayer is down, continue debugging normally and tell the user memory
  is temporarily unavailable — never block work on memory.

### Session behavior

- At the start of any session that involves code, run one broad
  `memwal_recall` of the project's stack keywords against `debug-patterns`
  so known landmines are in context.
- When the user pastes a long error log or postmortem, offer to run
  `memwal_analyze` on it to extract and store every distinct lesson at once.
  Target `debug-fixes` for incidents the text shows were resolved (the
  resolution is the verification), `debug-failures` for attempts the text
  shows did not work. If the text does not say how an incident ended, do not
  store it as a fix.
- Never ask the user for information you can recall. Recall is silent and
  cheap; asking twice is the failure mode this protocol exists to kill.
