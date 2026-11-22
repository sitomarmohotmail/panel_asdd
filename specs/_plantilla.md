---
id: NNN
titulo: Título corto
version: 1.0
estado: borrador
nivel: S | M | L
tipo: modulo | tema | contrib
proyecto: nombre_maquina
---

# NNN · Título corto

## Contexto
¿Qué problema resuelve y para quién? (2–4 frases)

## Requisitos
Prioridad: **DEBE**, **DEBERÍA** o **PODRÍA**.

- **R1** *(DEBE)* —
- **RA** *(DEBE)* — Cumple WCAG 2.2 AA en lo que añade o modifica.
  *(Solo si toca HTML, Twig, CSS o JS; ver `.claude/rules/accesibilidad.md`.)*

## Criterios de aceptación (EARS)
Un criterio por comportamiento verificable, con los requisitos que cubre y el
tipo de test (Unit, Kernel, Functional o check.sh).

- **CA1** *(R1 · Kernel)* — **Cuando** …, **el sistema deberá** …
- **CA-A1** *(RA · check.sh)* — **Cuando** se ejecute `scripts/check.sh` sobre
  ‹páginas›, **el sistema deberá** dar 0 problemas de axe, reflujo y foco.

## Fuera de alcance
-

## Plan técnico
_(tras aprobar)_ Archivos y para qué.

## Tareas
<!-- contrib puro: eliminar la línea de Tests -->
- [ ] Tests (rojo: N fallos)
- [ ] Implementación
- [ ] `scripts/check.sh --spec specs/NNN-….md` en verde

## Trazabilidad
| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 | CA1 | `Kernel\FooTest::testBar` _(contrib: `check.sh`)_ |

## Puertas
- Validación: _(nivel M/L: resultado de `asdd-validacion`)_
- QA: _(salida resumida de `scripts/check.sh`)_
