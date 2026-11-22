---
id: overview
title: The ASDD Panel
sidebar_label: Overview
description: How the ASDD panel works — a read-only web dashboard plus a Claude Code side panel that visualize the state of your specs.
---

# The ASDD Panel

The **ASDD panel** is a lightweight tooling layer that lets you *see* the state
of your specs at a glance — which are drafts, which are approved, which are
implemented, and which quality gates each one has cleared. It is technology
agnostic: it works for any project that follows the ASDD spec flow, whatever
language or framework you build in.

It ships as **two complementary surfaces** backed by the **same data**:

| Surface | What it is | Where it lives |
|---|---|---|
| **Web dashboard** | A single, read-only HTML page served over HTTP. | [`asdd_tools/`](./web-dashboard.md) |
| **Claude Code plugin** | A side panel inside Claude Code (`asdd-pipeline`). | [`claude-plugins/asdd-pipeline/`](./claude-code-plugin.md) |

Both read the specs in your `specs/` directory and render the same pipeline. The
default workflow has three stages:

```
Draft  ──▶  Approved  ──▶  Implemented
```

This workflow is **dynamic** — see [The pipeline states](#the-pipeline-states).

---

## How the data flows

Everything derives from the Markdown files in `specs/`. Each spec carries a
small YAML frontmatter block (`id`, `estado`, `nivel`, …), and the agent reports
next to it (`NNN-qa.md`, `NNN-validacion.md`, …) record which gates passed.

```
specs/NNN-*.md  ──(scripts/gen-specs-json.sh)──▶  asdd_tools/specs.json
                                                  asdd_tools/stack.json
                                                        │
                        ┌───────────────────────────────┴───────────────┐
                        ▼                                                 ▼
             Web dashboard (index.html)                   Claude Code plugin (asdd-pipeline)
             reads /asdd_tools/specs.json                 reads asdd_tools/specs.json
                                                          (or parses the frontmatter directly)
```

- **`specs.json`** — the full list of specs with their state, level, type and the
  gates they have cleared. Generated from the spec frontmatter.
- **`stack.json`** — the active technology profile and the ones available, used by
  the dashboard's stack selector.

Both JSON files are **generated artifacts**. You never edit them by hand — run
[`scripts/gen-specs-json.sh`](./scripts.md#gen-specs-jsonsh) (or let the Claude
Code hooks do it automatically whenever a spec changes).

---

## The pipeline states

The panel reads the `estado` field of each spec and groups specs into pipeline
stages. The **default** ASDD workflow has three stages:

| Stage | `estado` value | Meaning | Colour |
|---|---|---|---|
| **Draft** | `draft` | Not yet approved by a human. | Grey |
| **Approved** | `approved` | Approved — ready to implement. | Amber |
| **Implemented** | `implemented` | Code merged and gates green. | Green |

:::info The workflow is dynamic
These three stages are the **default, not a fixed rule**. The pipeline is defined
by the `states` array in `config.json` — both the web dashboard and the Claude
Code plugin build their pipeline, filters, counts and colours from it. Rename a
stage, recolour it, or add a `review` or `blocked` stage by editing that array and
regenerating; nothing in the code changes. See
[Customizing the pipeline states](./web-dashboard.md#customizing-the-pipeline-states).

This mirrors the [Maturity Model](/for-leaders/maturity-model): each organization
progresses through the stages it has implemented, rather than a single rigid path.
:::

Each spec also has a **level** (`nivel`) that controls how many quality gates
apply:

| `nivel` | Gates | Rationale |
|---|---|---|
| `S` | QA only | Small change, no agents. |
| `M` | validation + QA | One validation pass. |
| `L` | validation + QA + security + accessibility | Attack surface or new UI. |

---

## Where to go next

- **[Web dashboard](./web-dashboard.md)** — the `asdd_tools/` page: files,
  configuration and how to serve it (Apache, Python or Node).
- **[Claude Code plugin](./claude-code-plugin.md)** — the `asdd-pipeline` side
  panel: install, configure and what it shows.
- **[Stacks & the QA gate](./stacks-and-qa.md)** — technology profiles and the
  agnostic `check.sh` runner.
- **[Scripts](./scripts.md)** — every script in the tooling and what it does.
- **[Install in a new project](./installation.md)** — step-by-step setup.
