---
id: 001
titulo: Sample feature — health-check endpoint
version: 1.0
estado: draft
nivel: M
tipo: feature
proyecto: panel_asdd
---

# 001 · Sample feature — health-check endpoint

## Context
A neutral demo spec to show the ASDD panel populated. It describes a small,
technology-agnostic feature so the dashboard has data in the **Draft** stage.

## Requirements
Priority: **MUST**, **SHOULD** or **COULD**.

- **R1** *(MUST)* — The service exposes a `GET /health` endpoint.
- **R2** *(MUST)* — The endpoint returns HTTP `200` with a JSON body `{ "status": "ok" }`.
- **R3** *(SHOULD)* — The response includes the application version.

## Acceptance criteria (EARS)

- **CA1** *(R1, R2)* — **When** a client sends `GET /health`, **the system shall**
  respond with status `200` and body `{ "status": "ok" }`.
- **CA2** *(R3)* — **Where** a version is configured, **the system shall** include
  it in the response as a `version` field.

## Traceability

- `test:health_returns_ok`
- `test:health_includes_version`

## Notes
This file is demo content. Delete it (and `002-sample2.md`) once you have your
own specs.
