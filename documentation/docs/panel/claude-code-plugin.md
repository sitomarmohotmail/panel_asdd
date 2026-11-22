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
After installing it in Claude Code, point it at your project's `specs/`
directory:

```bash
claude plugin configure asdd-pipeline
```

| Setting | Description |
|---|---|
| `specsDir` | **Absolute** path to your project's `specs/` directory (e.g. `/home/user/my-project/specs`). |
| `panelUrl` | URL of the full web dashboard. Optional — see resolution below. |

If `specsDir` is left empty the panel shows a *"plugin not configured"* notice
with the command to run.

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
