---
id: installation
title: Install in a new project
sidebar_label: Installation
description: Step-by-step setup for adding the ASDD panel and plugin to any project.
---

# Install in a new project

The panel is portable. These steps add it to any project that follows the ASDD
spec flow, in any language.

## 1. Copy the tooling

- Copy the `asdd_tools/` folder to the root of your project.
- Copy these scripts into your `scripts/`: `gen-specs-json.sh`, `check.sh`,
  `serve-panel.mjs` and `asdd/init.sh`.

## 2. Create your stack profile

Create `asdd_tools/stacks/<id>.json` for your technology (see
[Stacks & the QA gate](./stacks-and-qa.md#stack-profile-format--stacksidjson))
and activate it:

```bash
scripts/asdd/init.sh --stack <id>
```

Four example profiles ship with the tooling: `php`, `node`, `dotnet` and `java`.

## 3. Edit `config.json`

```json
{
  "project_name": "my-project",
  "specs_dir":    "../specs",
  "output_json":  "specs.json",
  "stack":        "php"
}
```

- Set `project_name`.
- Adjust `specs_dir` if your specs directory is not `../specs`.
- `stack` is left in place by `init.sh`.

## 4. Link your specs

So the web server can serve the spec Markdown:

```bash
ln -s ../specs asdd_tools/specs
```

If you copy instead of linking, remember to keep the copy in sync.

## 5. Generate the initial JSON

```bash
bash scripts/gen-specs-json.sh
```

This writes `asdd_tools/specs.json` and `asdd_tools/stack.json`.

## 6. Serve the dashboard

If the project is **not** a web app, serve it with **Node** (no web server
needed). If it is already a web app, reuse Apache/nginx with an alias. See
[Web dashboard → Serving](./web-dashboard.md#serving-the-dashboard):

```bash
node scripts/serve-panel.mjs        # non-web projects — Node, opens the browser
# or
python3 -m http.server 8777         # from the project root
# or an Apache/nginx alias when the project is already a web app
```

Open `http://localhost:8777/asdd_tools/index.html`.

## 7. (Optional) Install the Claude Code plugin

Install `asdd-pipeline` in Claude Code and point it at your specs:

```bash
claude plugin configure asdd-pipeline
# set specsDir to the absolute path of your project's specs/ directory
```

See [Claude Code plugin](./claude-code-plugin.md).

## 8. (Optional) Wire the hooks

Add `.claude/settings.json` (using `$CLAUDE_PROJECT_DIR`) so `specs.json` is
regenerated whenever a spec changes and the panel reflects in-flight agents live.
See [`agent-hook.sh`](./scripts.md#agent-hooksh).

---

## Requirements

| Tool | For |
|---|---|
| `jq`, `bash` | `gen-specs-json.sh`, `check.sh`, `init.sh`, hooks |
| `node` | `serve-panel.mjs` (and the Claude Code plugin) |
| A static server | Apache, Node or Python — to serve the dashboard |

The per-stack tools (phpunit, vitest, dotnet…) are defined by your stack profile
and are only needed in the project that uses them.
