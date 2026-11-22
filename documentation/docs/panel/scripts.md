---
id: scripts
title: Scripts reference
sidebar_label: Scripts
description: Every script in the ASDD panel tooling — what it does, how to call it and how it stays portable.
---

# Scripts reference

All tooling scripts live in `scripts/`. They are self-contained and portable:
paths are derived from the script's own location, not hard-coded, so the tooling
works wherever you check the project out.

```
scripts/
  gen-specs-json.sh   ← generates specs.json and stack.json
  check.sh            ← QA gate: an agnostic runner driven by the stack profile
  serve-panel.mjs     ← Node static server for the web dashboard
  asdd/init.sh        ← wizard: choose the active stack
  agent-hook.sh       ← keeps running.json in sync (Claude Code hooks)
```

Dependencies: `jq` and `bash` for the shell scripts; `node` for `serve-panel.mjs`;
a static server (Apache, Node or Python) to serve the dashboard. The per-stack
tools (phpunit, vitest, dotnet…) are declared by the stack profile and are only
needed in the project that uses them.

---

## `gen-specs-json.sh`

Reads the YAML frontmatter of every `specs/NNN-*.md`, detects which agent
reports exist and whether their verdict is blocking, and writes
`asdd_tools/specs.json`. It then writes `asdd_tools/stack.json` with the active +
available stacks (for the dashboard's selector) **and the pipeline `states`
array** copied from `config.json` (see
[Customizing the pipeline states](./web-dashboard.md#customizing-the-pipeline-states)),
so the panel and the plugin render whatever stages the project defines.

```bash
bash scripts/gen-specs-json.sh
```

It reads its paths from `asdd_tools/config.json`. You can override them with
environment variables for non-standard layouts:

```bash
SPECS_DIR=/abs/specs OUTPUT=/other/out.json \
STACKS_DIR=/abs/stacks STACK_OUT=/other/stack.json \
bash scripts/gen-specs-json.sh
```

Agent report files (`*-qa.md`, `*-validacion.md`, `*-seguridad.md`,
`*-accesibilidad.md`) are not treated as specs; they contribute the per-document
report summaries and the gate state instead.

---

## `check.sh`

The QA gate. A technology-agnostic runner driven by the active stack profile.
Full details — flags, traceability and accessibility — are in
[Stacks & the QA gate](./stacks-and-qa.md#how-checksh-runs).

```bash
scripts/check.sh [--spec specs/NNN-x.md] [--group GROUP] [--no-a11y] [URL…]
```

---

## `asdd/init.sh`

The stack wizard. Lists the available profiles or activates one by setting the
`stack` field in `config.json` and regenerating `stack.json`.

```bash
scripts/asdd/init.sh                 # list stacks
scripts/asdd/init.sh --stack php     # activate the php profile
```

It validates the stack id (no path separators, no `..`, must exist).

---

## `serve-panel.mjs`

A **zero-dependency Node static server** for the web dashboard — the Node
equivalent of `python3 -m http.server`. It serves the project root (so the
dashboard's absolute `/asdd_tools/...` paths resolve), redirects `/` to the
panel, sets `Cache-Control: no-store`, and guards against path traversal.

```bash
node scripts/serve-panel.mjs            # port 8777, opens your browser
node scripts/serve-panel.mjs 9000       # a different port
PORT=9000 node scripts/serve-panel.mjs  # port via environment variable
node scripts/serve-panel.mjs --no-open  # do not open the browser
```

It reports a clear message if the port is already in use.

While running, it records its live URL in `asdd_tools/.panel-url` (removed on
exit) so the [Claude Code plugin](./claude-code-plugin.md#the-full-panel-link)
can open the panel from wherever it is actually being served. That file is
runtime state and is not versioned.

---

## `agent-hook.sh`

Keeps `asdd_tools/running.json` in sync with the ASDD processes currently running
(agents and QA), so the dashboard can show them live and distinguish foreground
from background work. It is wired through Claude Code hooks in
`.claude/settings.json`:

- **PreToolUse** (`Agent` / `Bash`) → records a *start* (the only place that knows
  whether work runs in the background).
- **SubagentStop** → records a *stop* for subagents (LIFO).
- `check.sh` marks its own *stop* via an `EXIT` trap.
- A TTL purges stale entries on every write, as a safety net.

The hook commands use `$CLAUDE_PROJECT_DIR` instead of an absolute path, so the
configuration is portable:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Agent", "hooks": [{ "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/scripts/agent-hook.sh start", "async": true }] },
      { "matcher": "Bash", "hooks": [{ "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/scripts/agent-hook.sh start", "async": true }] }
    ]
  }
}
```

`running.json` is runtime state and is **not** versioned.
