---
id: 002
titulo: Linters de CSS, JS y Twig en la puerta de QA
version: 1.0
estado: implementada
nivel: S
tipo: modulo
proyecto: scripts
---

# 002 · Linters de CSS, JS y Twig en la puerta de QA

## Contexto
`phpcs` solo revisa PHP y YAML. El CSS, el JS y el Twig de `web/modules/custom`
y `web/themes/custom` (tema y componentes SDC) no pasan por ninguna
comprobación de estándares Drupal. Queremos que `scripts/check.sh` los revise
de forma automática, sin agentes ni tokens, con la misma configuración que usa
el core de Drupal.

Esta spec no cambia la salida del sitio: no lleva RA.

## Requisitos
- **R1** *(DEBE)* — `scripts/check.sh` ejecuta Stylelint sobre los `*.css`
  propios con las reglas del core de Drupal 11 (`web/core/.stylelintrc.json`:
  `stylelint-config-standard`, `stylelint-order` y Prettier).
- **R2** *(DEBE)* — `scripts/check.sh` ejecuta ESLint sobre los `*.js` propios
  con las reglas del core de Drupal 11 (`web/core/.eslintrc.json`:
  `airbnb-base`, Prettier y `jsdoc`, con los globales `Drupal`,
  `drupalSettings`, `once`…).
- **R3** *(DEBERÍA)* — `scripts/check.sh` ejecuta un linter de Twig sobre los
  `*.html.twig` propios.
- **R4** *(DEBE)* — El código propio actual pasa los linters (se corrige si no
  pasa).
- **R5** *(DEBE)* — Se excluyen `node_modules`, `dist`, `vendor` y `*.min.js`.
- **R6** *(DEBE)* — Si no hay ficheros de un tipo, el paso de ese linter da OK.
- **R7** *(DEBERÍA)* — Existen los scripts `npm run lint:css`, `lint:js` y
  `lint`, con versiones exactas en `package.json`.
- **R8** *(DEBE)* — `CLAUDE.md` y `.claude/rules/quality-gates.md` recogen los
  nuevos linters.

## Criterios de aceptación (EARS)
Los casos con errores se comprueban con ficheros de ejemplo (fixtures) en
`scripts/lint/fixtures/`, excluidos del lint normal, mediante
`scripts/lint/test.sh`, que `check.sh` ejecuta.

- **CA1** *(R1 · check.sh)* — **Si** un CSS propio incumple una regla del core,
  **entonces el sistema deberá** marcar `FALLO stylelint` e indicar el fichero
  y la línea.
- **CA2** *(R2 · check.sh)* — **Si** un JS propio incumple una regla del core
  (p. ej. `var`), **entonces el sistema deberá** marcar `FALLO eslint` e indicar
  el fichero y la línea.
- **CA3** *(R2 · check.sh)* — **Cuando** un JS propio use `Drupal.behaviors`,
  `drupalSettings` y `once()`, **el sistema deberá** no marcarlos como
  variables no definidas.
- **CA4** *(R3 · check.sh)* — **Si** una plantilla Twig propia incumple el
  estándar (p. ej. `{{foo}}` sin espacios), **entonces el sistema deberá**
  marcar `FALLO twig` e indicar el fichero y la línea.
- **CA5** *(R4 · check.sh)* — **Cuando** se ejecute `scripts/check.sh` sobre
  el código actual, **el sistema deberá** dar OK en stylelint, eslint y twig.
- **CA6** *(R5 · check.sh)* — **El sistema deberá** ignorar los ficheros con
  errores que estén en `node_modules`, `dist`, `vendor` o se llamen `*.min.js`.
- **CA7** *(R6 · check.sh)* — **Si** no hay ficheros JS o Twig propios,
  **entonces el sistema deberá** dar OK en ese paso.
- **CA8** *(R7 · check.sh)* — **Cuando** se ejecute `npm run lint`, **el
  sistema deberá** dar el mismo resultado que los pasos de `check.sh`.
- **CA9** *(R8 · revisión)* — **El sistema deberá** documentar los comandos en
  `CLAUDE.md` y la puerta en `quality-gates.md`.

## Fuera de alcance
- Revisar CSS/JS/Twig de core o contrib.
- `--fix` automático dentro de `check.sh`: solo se usa a mano (`npm run lint -- --fix`).
- Reglas propias además de las del core.

## Plan técnico
- `package.json`: ESLint 8, Stylelint 16, Prettier 3 y los plugins que usa el
  core 11.4, con las mismas versiones.
- `.eslintrc.json`, `.stylelintrc.json`, `.prettierrc.json` en la raíz: copias
  de la configuración del core, que indican de qué fichero vienen (el core no
  se versiona y sus `extends` no se resuelven desde la raíz).
  `.eslintrc.json` quita `plugin:yml` (el YAML lo revisa phpcs).
- Twig: `vincentlanglet/twig-cs-fixer` ^4.1 (`composer require --dev`) con
  su estándar por defecto; no hace falta `.twig-cs-fixer.php`.
- `scripts/lint/lint.sh css|js|twig|all [--fix] [RUTA…]`: busca los ficheros,
  aplica las exclusiones y da salida `fichero:línea:col` en los tres linters.
  Lo usan `check.sh` y `npm run lint*`.
- `scripts/lint/test.sh` + `scripts/lint/fixtures/` para CA1–CA4 y CA6–CA8.
- `scripts/check.sh`: pasos `stylelint`, `eslint`, `twig` y `linters (fixtures)`.
- `style.css`: reordenadas dos propiedades (`order/properties-order`), sin
  cambio visual.

## Tareas
- [x] Tests (rojo: 9 fallos)
- [x] Implementación
- [x] `scripts/check.sh --spec specs/002-linters-front.md` en verde

## Trazabilidad
| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 | CA1 | `scripts/lint/test.sh` (css-ko) |
| R2 | CA2, CA3 | `scripts/lint/test.sh` (js-ko, js-ok) |
| R3 | CA4 | `scripts/lint/test.sh` (twig-ko) |
| R4 | CA5 | `scripts/check.sh` |
| R5 | CA6 | `scripts/lint/test.sh` (excluidos) |
| R6 | CA7 | `scripts/lint/test.sh` (vacío) |
| R7 | CA8 | `scripts/lint/test.sh` (npm) |
| R8 | CA9 | revisión |

## Puertas
- Validación: _(nivel S: no aplica)_
- QA (2026-11-08): `scripts/check.sh --spec specs/002-linters-front.md` todo OK
  (phpunit ×3, phpcs, phpstan, stylelint, eslint, twig, fixtures 9/9,
  config:status, trazabilidad, axe + foco a 1280 y 320 px).
