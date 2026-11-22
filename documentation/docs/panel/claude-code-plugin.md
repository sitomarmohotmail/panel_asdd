---
id: claude-code-plugin
title: Claude Code plugin (asdd-pipeline)
sidebar_label: Claude Code plugin
description: The asdd-pipeline Claude Code plugin — a side panel that shows the ASDD pipeline and spec state without leaving your terminal.
---

# Claude Code plugin (`asdd-pipeline`)

`asdd-pipeline` is a **Claude Code plugin** that renders the same ASDD pipeline
as the web dashboard, but as a **side panel inside Claude Code**. It lets you
watch the state of your specs without leaving the terminal.

It lives in [`claude-plugins/asdd-pipeline/`](https://github.com/sitomarmohotmail/panel_asdd/tree/panel/claude-plugins/asdd-pipeline):

```
claude-plugins/asdd-pipeline/
  .claude-plugin/plugin.json   ← manifest + user configuration
  hooks/
    hooks.json                 ← registers the UI module
    register.tsx               ← the panel itself (pipeline + spec cards)
  types/index.d.ts             ← shared Spec / SpecReport types
  tsconfig.json
```

## What it shows

- A **`⬡ ASDD`** button above the prompt that opens and closes the panel.
- An **SVG pipeline diagram** (`Draft → Approved → Implemented`) with live counts.
- **Filter chips** by state and by level (`S` / `M` / `L`).
- A **card per spec** with its id, version, type, level, the quality gates it has
  cleared, a progress track, and an expandable per-document report summary.
- Specs with **unresolved blocking findings** are flagged.
- An **`↺ Refresh specs`** action and a link to the full web dashboard.

It also registers a slash command, **`/asdd_dashboard`**, that opens the panel.

## How it reads your specs

On session start (and on refresh) the plugin:

1. Tries to read `asdd_tools/specs.json` — derived from your configured
   `specsDir` by swapping `…/specs` for `…/asdd_tools/specs.json`. This already
   includes the cleared gates.
2. If that file is missing, it **falls back** to parsing the YAML frontmatter of
   each `specs/NNN-*.md` directly.

That means the panel works even before you have generated `specs.json`, though
generating it gives you the richer gate/report data.

The plugin also reads the **dynamic pipeline states** from `asdd_tools/stack.json`
(falling back to the standard 3-stage workflow if none are defined), so its
pipeline, filters, counts and colours match whatever stages the project configures
— exactly like the web dashboard. See
[Customizing the pipeline states](./web-dashboard.md#customizing-the-pipeline-states).

## Installation & configuration

The plugin ships without a hard-coded path, so it is portable across projects.
It requires **Claude Code ≥ v2.1.287** (UI-module plugins / "mods").

```bash
# 1. register this repo as a local plugin marketplace (user scope = global)
claude plugin marketplace add /home/you/path/to/panel_asdd

# 2. install the plugin (plugin-name@marketplace-name)
claude plugin install asdd-pipeline@sitomarmohotmail --scope user

# 3. (optional) configure — only if your specs are NOT at <project>/specs
claude plugin configure asdd-pipeline@sitomarmohotmail
```

After install, restart Claude Code (or `/reload-plugins`). The **`⬡ ASDD`** button
appears above the prompt on its own, and the panel opens with **`/asdd_dashboard`**.
The first time you open a new directory, accept the **trust** prompt or mods won't
load there.

| Setting | Description |
|---|---|
| `specsDir` | **Absolute** path to your project's `specs/` directory. Optional — see resolution below. |
| `panelUrl` | URL of the full web dashboard. Optional — see [resolution](#the-full-panel-link) below. |

### Which specs it reads

`specsDir` is resolved in this order, so the plugin works per-project with no
configuration:

1. **`specsDir`** from the plugin config, if you set one explicitly (an absolute
   path). This is a single, machine-wide value (plugin config is stored in your
   user settings, not per project), so set it only if you want one fixed specs
   directory everywhere, or if your `specs/` is not at the project root.
2. **Relative paths** (`specs/` and `asdd_tools/…`) — when `specsDir` is unset, the
   plugin uses relative paths, which `$.fs` resolves against the **working
   directory of the session** (where you launched Claude Code). Open any project
   from its root and the panel reads *that* project's specs. No configuration.
3. If nothing is found, the panel shows a *"No specs found"* notice naming where it
   looked.

:::tip Multi-project use
Leave `specsDir` **unset**. The plugin then reads `specs/` and `asdd_tools/`
relative to the project you launched Claude Code in, so each project shows its own
specs with no reconfiguring. Set `specsDir` (absolute) only when your `specs/`
lives somewhere other than the project root.
:::

### The full-panel link

The plugin runs inside Claude Code and **cannot detect** where (or whether) the
web dashboard is being served, so the link's URL is resolved in this order:

1. **`panelUrl`** from the plugin config, if you set one explicitly.
2. The URL **recorded by [`serve-panel.mjs`](./scripts.md#serve-panelmjs)** in
   `asdd_tools/.panel-url` — written with the real host and port each time you
   start the Node server, and removed when it stops. This makes the link follow
   wherever you last served the panel.
3. The Node default, `http://localhost:8777/asdd_tools/index.html`.

So for the common case (serve with `node scripts/serve-panel.mjs`) the link just
works — no configuration needed. Set `panelUrl` only when you serve the panel
some other way, e.g. an Apache virtual host.

:::tip Keeping it in sync automatically
Pair the plugin with the hooks in [`.claude/settings.json`](./scripts.md#agent-hooksh)
so that `specs.json` is regenerated every time a spec file changes, and the
panel reflects in-flight agents in real time.
:::

## Scope — install once, use everywhere

Installing at **user scope** (the default) registers the marketplace and the
plugin under `~/.claude`, so they are **global**: every project on the machine
gets the plugin automatically. **You do not re-register or re-install per
project.**

| Thing | Where it lives (user scope) | Per project? |
|---|---|---|
| Marketplace (`marketplace add`) | `~/.claude` (`extraKnownMarketplaces` / `known_marketplaces.json`) | No — one per user |
| Installed plugin | `~/.claude/plugins/…` (`installed_plugins.json`) | No |
| Enablement (`enabledPlugins`) | `~/.claude/settings.json` | No — inherited by every project |
| Config (`specsDir`, `panelUrl`) | `~/.claude/settings.json` (`pluginConfigs`) | **No — single machine-wide value** |
| Specs it actually reads | — | **Yes — auto-derived from `$CLAUDE_PROJECT_DIR`** |

Because plugin config is machine-wide (not per project), the plugin derives the
specs directory from the **current** project instead — see
[Which specs it reads](#which-specs-it-reads). So in practice, **nothing needs
repeating when you open or create a new project** (beyond accepting the trust
prompt the first time).

**Scopes** (the `--scope` flag on `marketplace add` / `install`):

- `user` *(default)* — global, this machine.
- `project` — writes the enablement to the repo's committed `.claude/settings.json`,
  so collaborators get it; each collaborator still runs the project-scope install
  once in their clone (committing the entry doesn't download the plugin).
- `local` — this repo only (`.claude/settings.local.json`).

Precedence when more than one sets it: **local > project > user**. A project can
set a plugin to `false` to turn it off just for that repo.

**On a new machine** you do repeat the one-time setup: `marketplace add`,
`install`, and any `specsDir`/`panelUrl` config — because those live in
`~/.claude`.

## Updating & development

Because the marketplace points at a **local path**, the plugin loads **in place
from the source directory** — there is no cached copy. Edits to `register.tsx`
take effect at the next session start or `/reload-plugins`; **no version bump is
needed** (that only applies to remote marketplaces).

Useful commands while working on the plugin:

```bash
# validate the manifest, types path and hooks module (lists the events it registers)
claude plugin validate /home/you/path/to/panel_asdd/claude-plugins/asdd-pipeline

# iterate without installing — load the directory for one session (hot-reloads on save)
claude --plugin-dir /home/you/path/to/panel_asdd/claude-plugins/asdd-pipeline
```

If a mod silently fails to load, check: the **trust** prompt was accepted for the
directory, and none of `disableAllHooks`, `--safe-mode`, `--bare` or a managed
`allowManagedModsOnly` policy is active.
