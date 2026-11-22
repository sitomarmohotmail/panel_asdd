# Validación · spec 007 — Módulo sdc_cartoteca (2ª pasada)

- Fecha: 2026-11-21
- Versión de la spec validada: 1.6 (en-curso)
- Resultado: SUPERADA CON AVISOS
- Hallazgos: 0 BLOQUEANTES · 0 ALTOS · 1 MEDIO · 3 BAJOS

## Resumen
La remediación resuelve el BLOQUEANTE y los ALTOS de la 1ª pasada. La trazabilidad apunta ahora a tests ejecutables. Queda un criterio (CA12) cuyo test citado no existe.

## Hallazgos
### TRZ-004 · MEDIA · R10, CA12
- **Evidencia:** «CA12 (R10 · JS-unit) … se verifica sobre el constructor de HTML inicial»; tabla: «JS-unit `search-form.test.mjs` / `image-slider.test.mjs` (estado inicial)».
- **Problema:** ningún test JS cubre CA12. `search-form.test.mjs` solo prueba `buildApiUrl`. El despacho de `cartoteca:load` con `url=''` está en el behavior `js/cartoteca-search-form.js:59-60`, no en un `*.logic.js`. «Constructor de HTML inicial» no es el comportamiento del criterio.
- **Corrección:** extraer a `search-form.logic.js` una función (p. ej. `buildClearDetail()`) y testearla, o pasar CA12 a Manual y dejar CA12m como único criterio.
- **Verificación:** comprobado (grep de `CA12`/`Limpiar` en `tests/js/*.mjs`: sin resultados; lectura de `cartoteca-search-form.js`).

## Hallazgos previos (1ª pasada, v1.5: BLOQUEADA)
| ID | Estado |
|---|---|
| TRZ-001 (BLOQUEANTE) | Resuelto: sin `markTestIncomplete` ni FunctionalJavascript en `tests/`; `test:js` en `package.json:11` y paso `js-unit` en `scripts/check.sh:63`. |
| CON-001 | Resuelto: `drupal:inline_form_errors` en `info.yml`; `Functional\CartotecaFormErrorTest::testEmptyFieldInlineError` existe. |
| CON-002 | Resuelto: servicio PHP, `services.yml` y test Unit eliminados; CA3/CA4b/CA7b/CA10a/b tienen tests `.test.mjs`. |
| TRZ-002, VER-001, TRZ-003, ALC-001, A11Y-001 | Resueltos (CA7c/CA7d/CA11b/CA12/CA-A* añadidos, tipos alineados). |

## Recomendación
Se puede aprobar. Conviene resolver TRZ-004 antes de `implementada`, porque la comprobación de trazabilidad de `check.sh` podría dar un falso verde con CA12. Las tareas de la spec siguen sin marcar (`[ ]`), aunque el código ya existe: actualizarlas.

## BAJOS (→ pendientes.md)
- VER: CA2b no comprueba que el error esté ausente de la barra de mensajes (`.messages--error`). Solo comprueba `aria-invalid` y `.form-item--error-message`; además el test usa `user/login`, donde el bloque debe estar colocado.
- TRZ: `Kernel\CartotecaFormTest::testRequiredValidationError` existe pero no aparece en la tabla de trazabilidad.
- AMB (heredados): «variantes de tamaño» y alternativas `/` en Período y Escala sin regla de prioridad; R6 y CA8 repiten CA4b.
