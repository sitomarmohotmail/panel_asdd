---
id: 002
titulo: Sample feature — request rate limiting
version: 1.0
estado: approved
nivel: L
tipo: feature
proyecto: panel_asdd
---

# 002 · Sample feature — request rate limiting

## Context
A second neutral demo spec, in the **Approved** stage and level **L**, so the
panel shows a different pipeline stage and the full set of quality gates
(validation + QA + security + accessibility).

## Requirements
Priority: **MUST**, **SHOULD** or **COULD**.

- **R1** *(MUST)* — The API limits each client to 100 requests per minute.
- **R2** *(MUST)* — Over the limit, the system responds with HTTP `429`.
- **R3** *(SHOULD)* — Responses include a `Retry-After` header when throttled.

## Acceptance criteria (EARS)

- **CA1** *(R1, R2)* — **While** a client has exceeded 100 requests in the current
  minute, **the system shall** respond with status `429`.
- **CA2** *(R3)* — **When** a request is throttled, **the system shall** include a
  `Retry-After` header with the seconds until reset.

## Traceability

- `test:rate_limit_blocks_over_quota`
- `test:rate_limit_sets_retry_after`

## Notes
Demo content — remove once you have your own specs.
