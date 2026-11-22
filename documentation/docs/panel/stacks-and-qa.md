---
id: stacks-and-qa
title: Stacks & the QA gate
sidebar_label: Stacks & QA gate
description: How the ASDD panel stays technology agnostic — stack profiles and the check.sh QA runner that reads them.
---

# Stacks & the QA gate

The ASDD tooling is **not tied to any technology**. The QA gate
(`scripts/check.sh`) is a *runner* that reads a **stack profile**
(`asdd_tools/stacks/<id>.json`) and executes whatever commands that profile
declares. Switching from PHP to Node, .NET, Java, Python… means **writing one
file** and activating it — you never touch the panel, the hooks or `check.sh`.

## Choosing the active stack

```bash
scripts/asdd/init.sh                 # list the available stacks (id + label)
scripts/asdd/init.sh --stack node    # activate one (writes config.json, regenerates stack.json)
```

The dashboard shows the active stack as a badge in the header. From its
**"Stacks"** view you can see the available ones and copy the command to switch
(the panel is read-only: it only copies the command, it never writes to disk).

## Stack profile format — `stacks/<id>.json`

```json
{
  "label": "Node / TypeScript",
  "a11y": false,
  "gates": [
    { "id": "types", "label": "tsc --noEmit", "cmd": ["npx", "tsc", "--noEmit"] },
    { "id": "lint",  "label": "eslint",       "cmd": ["npx", "eslint", "."] },
    { "id": "test",  "label": "vitest",
      "cmd":       ["npx", "vitest", "run"],
      "cmd_group": ["npx", "vitest", "run", "-t", "{group}"] }
  ],
  "trace": {
    "pattern": "test:([A-Za-z0-9_]+)",
    "locate":  "grep -rqs '{1}' --include='*.test.js' --include='*.test.ts' ."
  }
}
```

| Key | What it is |
|---|---|
| `label` | Human-readable name of the stack (shown by the panel). |
| `a11y` | `true` if QA should run axe + focus checks (reflow 320/1280). Set `false` for projects with no web UI. |
| `gates` | Ordered list of checks. Each has `id`, `label` and `cmd` (an argv array). Optional `cmd_group` (a template with `{group}`) powers `check.sh --group X`. |
| `trace` | Test traceability. `pattern`: an ERE with 1..N capture groups → positional markers `{1}`, `{2}`, …; `locate`: a command that locates the test (exit code 0 = it exists). Captured values are **sanitized** to `[A-Za-z0-9_]+` before interpolation (anti-injection). |

## How `check.sh` runs

```bash
scripts/check.sh [--spec specs/NNN-x.md] [--group GROUP] [--no-a11y] [URL…]
```

It reads the `stack` from `config.json`, **validates** the id against
`stacks/*.json` (an allowlist: it rejects `/`, `..` and unknown ids) and runs
each `gate` in order. `--group` only affects gates that define `cmd_group`. The
accessibility step runs only when the profile has `a11y: true` and `--no-a11y`
was not passed.

| Flag | Effect |
|---|---|
| `--spec` | Check that every test cited in the spec's traceability section exists. |
| `--group` | Limit tests to a group (only gates with `cmd_group`). |
| `--no-a11y` | Skip axe-core. |
| `URL…` | Pages for axe (default `http://localhost/`). |

## Adding a new technology

1. Create `asdd_tools/stacks/my-stack.json` using the format above.
2. Run `scripts/asdd/init.sh --stack my-stack`.
3. `scripts/check.sh` now uses your commands — nothing else changes.

### Bundled profiles

| Id | Stack | a11y |
|---|---|---|
| `php` | PHP / Composer (phpunit / phpcs / phpstan) | no |
| `node` | Node / TypeScript (tsc / eslint / vitest) | no |
| `dotnet` | .NET 8 / ASP.NET (build / test / format) | no |
| `java` | Java 21 / Maven (compile / spotbugs / checkstyle / test) | no |

:::warning Treat profiles as code
`stacks/*.json` contain commands the runner executes. Version them and review
them as code, and make sure the web server user cannot write to `asdd_tools/`.
:::
