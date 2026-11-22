---
id: "009"
titulo: QA agnóstica de tecnología (perfiles de stack) y selector en el panel
version: 1.3
estado: implementada
nivel: L
tipo: panel
proyecto: asdd_tools
---

# 009 · QA agnóstica de tecnología (perfiles de stack)

## Contexto

El flujo ASDD (panel `asdd_tools`, hooks, agentes `asdd-*` y la puerta de QA
`scripts/check.sh`) es casi independiente de la tecnología del proyecto: el
panel solo lee JSON, `gen-specs-json.sh` parsea Markdown y los agentes revisan
texto. El **único** punto cableado a Drupal/PHP es `scripts/check.sh`, que
invoca `phpunit`, `phpstan`, `phpcs`, `drush` y los linters front de forma
literal (`check.sh:50-65`) y usa un patrón de trazabilidad específico de PHPUnit
(`check.sh:80`). Para reutilizar el flujo en proyectos Node, Python, etc., hay
que **externalizar** esos comandos a un perfil declarativo y poder elegirlo.

Esta spec convierte `check.sh` en un *runner* genérico guiado por un **perfil de
stack** (`asdd_tools/stacks/<id>.json`), añade un **asistente CLI**
(`scripts/asdd/init.sh`) que fija el stack activo en `config.json`, un segundo
perfil de ejemplo (`node.json`) que demuestra el cambio de tecnología sin tocar
runner, panel ni hooks, y un **selector en el panel** que muestra el stack activo
y ofrece el comando para cambiarlo. El panel es hoy estático y de solo lectura
(el editor es `readOnly`, no existe `save-spec.php`) y así se mantiene: el
selector no escribe en disco, solo muestra y copia el comando del asistente CLI
(ver *Fuera de alcance*).

## Requisitos

Prioridad: **DEBE**, **DEBERÍA** o **PODRÍA**.

- **R1** *(DEBE)* — Deberá existir un formato de **perfil de stack** en
  `asdd_tools/stacks/<id>.json` con las claves: `label` (texto), `a11y`
  (booleano), `gates` (array de objetos `{id, label, cmd}`, donde `cmd` es un
  array argv; un gate puede añadir `cmd_group` como plantilla con marcador
  `{group}`) y `trace` (`{pattern, locate}`). El contrato de `trace` es:
  - `pattern`: expresión regular ERE con **uno o más grupos de captura**,
    mapeados por posición a los marcadores **posicionales** `{1}`, `{2}`, … `{N}`
    (grupo 1 → `{1}`, etc.); los marcadores sin grupo correspondiente quedan
    vacíos. Nombres neutros, sin suponer una estructura concreta de test: cada
    perfil elige cuántos grupos usa y qué significan (p. ej. Drupal usa tres
    —tipo, clase, método—; un stack .NET, dos —clase, método—).
  - `locate`: plantilla de comando (cadena) con esos marcadores; el runner
    sustituye **solo** valores capturados que casen `^[A-Za-z0-9_]+$` y entonces
    ejecuta la plantilla; código de salida 0 = el test existe. Un valor que no
    case hace que ese test se cuente como inexistente sin ejecutar nada (evita
    inyección: R3 valida el id del stack, este contrato valida los valores de
    trazabilidad).

  Deberá incluirse `asdd_tools/stacks/drupal.json`.
- **R2** *(DEBE)* — `scripts/check.sh` deberá actuar como *runner* genérico: leer
  el campo `stack` de `asdd_tools/config.json` (ruta sobreescribible con la
  variable de entorno `ASDD_CONFIG`; directorio de perfiles con `ASDD_STACKS_DIR`,
  por defecto `asdd_tools/stacks`), cargar `stacks/<stack>.json` y ejecutar cada
  entrada de `gates` con el bucle `run()` actual. Deberá conservar los flags
  `--spec`, `--group`, `--no-a11y` y las URLs; el flag `--group` deberá aplicarse
  **solo** a los gates que definan `cmd_group` (sustituyendo `{group}`); el paso
  de accesibilidad (axe + foco a 1280 y 320 px) deberá ejecutarse **solo** si el
  perfil tiene `a11y: true` y no se pasó `--no-a11y`; la comprobación de
  trazabilidad deberá usar `trace.pattern`/`trace.locate` del perfil (contrato de
  R1). **Guardia anti-recursión:** cuando `ASDD_IN_TEST=1` esté definido, el
  runner deberá omitir el gate cuyo `cmd` invoque `scripts/asdd/test.sh`.
- **R3** *(DEBE, seguridad)* — `scripts/check.sh` y `scripts/asdd/init.sh`
  deberán **validar** el id de stack contra la lista de ficheros
  `<stacks_dir>/*.json` existentes (lista blanca). **Si** `stack` falta en
  `config.json`, contiene `/`, `..`, o no corresponde a un fichero existente,
  **entonces el sistema deberá** abortar con mensaje de error y salida ≠ 0, sin
  ejecutar ningún `cmd` ni modificar `config.json`.
- **R4** *(DEBE)* — `scripts/asdd/init.sh [--stack ID]` deberá, **sin** `--stack`,
  imprimir el `id` y el `label` de cada `<stacks_dir>/*.json`; y **con**
  `--stack ID` válido (R3), fijar `asdd_tools/config.json .stack = ID` con `jq`
  **preservando** el resto de campos, y a continuación **regenerar**
  `asdd_tools/stack.json` invocando `scripts/gen-specs-json.sh` (para que el panel
  refleje el cambio). Rutas sobreescribibles con `ASDD_CONFIG`/`ASDD_STACKS_DIR`.
- **R5** *(DEBE)* — Deberá incluirse un segundo perfil `asdd_tools/stacks/node.json`
  (p. ej. `vitest`/`eslint`/`tsc`) que demuestre el cambio de tecnología. El
  runner deberá poder ejecutar sus `gates` **sin** que se modifiquen `index.html`,
  los hooks ni el propio `check.sh`. (Sus comandos reales no se ejecutan en el QA
  de este repo; se verifican con los comandos sustituidos por *stubs*, R7.)
- **R6** *(DEBE)* — El panel deberá **mostrar el stack activo** y ofrecer el
  cambio: `scripts/gen-specs-json.sh` deberá generar `asdd_tools/stack.json` con
  `{active, available:[{id,label,a11y}]}` (leído de `config.json` y de
  `<stacks_dir>/*.json`; salida sobreescribible con la variable `STACK_OUT` y
  directorio de perfiles con `STACKS_DIR`, igual que los `SPECS_DIR`/`OUTPUT`
  actuales). `asdd_tools/index.html` deberá leer `stack.json`, mostrar un
  distintivo con el `label` del stack activo en la cabecera y una vista "Stacks"
  que liste los disponibles. Al elegir un stack no activo, deberá mostrar y copiar
  al portapapeles el comando `scripts/asdd/init.sh --stack <id>`. El panel **no**
  deberá escribir en disco (sigue estático/solo lectura).
- **R7** *(DEBE)* — El comportamiento de R1–R6 deberá quedar cubierto por el arnés
  `scripts/asdd/test.sh` (patrón bash-test de la spec-008), que salga con código
  ≠ 0 al fallar un caso, invocado como gate de `drupal.json` desde
  `scripts/check.sh`. Los *stack-fixtures* del arnés nunca incluyen el gate de
  tooling (y exportan `ASDD_IN_TEST=1`) para no recursar.
- **RA** *(DEBE)* — El sistema deberá cumplir WCAG 2.2 nivel AA en la UI nueva de
  `index.html` (distintivo de stack y vista "Stacks"): contraste de texto ≥ 4,5:1,
  controles operables con teclado sin trampa de foco, foco visible ≥ 3:1,
  opciones como elementos interactivos reales (`button`/`a`, no `div` clicables),
  el stack activo marcado con `aria-current` **y** texto (no solo color), el
  resultado de copiar anunciado en una región `aria-live` (4.1.3), y cierre de la
  vista con Esc devolviendo el foco al disparador (2.1.2), con alternativa cuando
  no exista `navigator.clipboard`.

## Criterios de aceptación (EARS)

- **CA1** *(R1 · bash-test)* — **El sistema deberá** tener `stacks/drupal.json`
  válido como JSON con las claves `label`, `a11y`, `gates` (no vacío) y `trace`
  con `pattern` y `locate`.
- **CA2** *(R1/R2 · bash-test)* — **El sistema deberá** garantizar que los `id` de
  los `gates` de `stacks/drupal.json` incluyen los pasos actuales de QA (unit,
  kernel, functional, phpcs, phpstan, stylelint, eslint, twig, los dos arneses de
  fixtures, js-unit y drush), que `a11y` es `true` y que el gate functional define
  `cmd_group`.
- **CA2b** *(R1/R2 · bash-test)* — **El sistema deberá** tener, para cada gate de
  `drupal.json`, el `label` y el `cmd` (argv) **literalmente iguales** a los
  actuales de `check.sh:50-65` y en el mismo orden, incluidas las formas
  `bash -c` de js-unit y de `drush config:status` (comparación contra una lista
  esperada en el test).
- **CA3** *(R2 · bash-test)* — **Cuando** se ejecuta `check.sh` con un
  stack-fixture que tiene un gate que pasa (`true`) y otro que falla (`false`),
  **el sistema deberá** ejecutar ambos y salir con ≠ 0.
- **CA3b** *(R2 · bash-test)* — **Cuando** se ejecuta `check.sh` con un
  stack-fixture cuyos gates pasan todos, **el sistema deberá** salir con 0.
- **CA4** *(R2 · bash-test)* — **Cuando** se pasa `--group X` y el perfil define un
  gate con `cmd_group`, **el sistema deberá** ejecutar la variante con `{group}`
  sustituido por `X`.
- **CA4b** *(R2 · bash-test)* — **Mientras** no se pase `--group`, **el sistema
  deberá** ejecutar la variante `cmd` del gate (no `cmd_group`).
- **CA5** *(R2 · bash-test)* — **Mientras** el perfil tenga `a11y: false` o se pase
  `--no-a11y`, **el sistema deberá** omitir el paso de axe/foco.
- **CA5b** *(R2 · bash-test)* — **Mientras** el perfil tenga `a11y: true` y no se
  pase `--no-a11y`, **el sistema deberá** incluir el paso de axe/foco.
- **CA6** *(R2 · bash-test)* — **Cuando** se pasa `--spec` con un stack-fixture,
  **el sistema deberá** usar `trace.pattern`/`trace.locate` del perfil y dar éxito
  si el test referenciado existe y fallo si falta (una spec-fixture por caso).
- **CA6b** *(R1/R3 · bash-test)* — **Si** un valor capturado por `trace.pattern` no
  casa `^[A-Za-z0-9_]+$`, **entonces el sistema deberá** contar ese test como
  inexistente sin ejecutar la plantilla `locate`.
- **CA7** *(R3 · bash-test)* — **Si** `config.json` o `--stack` indican un stack
  con `/`, `..` o inexistente, **entonces** `check.sh` e `init.sh` **deberán**
  abortar con ≠ 0 sin ejecutar ningún `cmd` ni modificar `config.json`.
- **CA7b** *(R3 · bash-test)* — **Si** `config.json` no define `stack`,
  **entonces** `check.sh` **deberá** abortar con ≠ 0.
- **CA8** *(R4 · bash-test)* — **Cuando** se invoca `init.sh --stack <id>` con un
  id válido, **el sistema deberá** dejar `config.json .stack = <id>` conservando
  `project_name`, `specs_dir` y `output_json`.
- **CA8b** *(R4 · bash-test)* — **Cuando** se invoca `init.sh` sin `--stack`, **el
  sistema deberá** imprimir el `id` y el `label` de cada `<stacks_dir>/*.json`.
- **CA8c** *(R4 · bash-test)* — **Cuando** `init.sh --stack <id>` termina, **el
  sistema deberá** haber regenerado `stack.json` con `active = <id>`.
- **CA9** *(R5 · bash-test)* — **El sistema deberá** tener `stacks/node.json`
  válido con `gates` propios (`label`, `cmd`) y `trace`.
- **CA9b** *(R5 · bash-test)* — **Cuando** el runner ejecuta `node.json` con sus
  comandos sustituidos por *stubs* (`true`), **el sistema deberá** completar sin
  requerir cambios en `index.html`, hooks ni `check.sh`.
- **CA10** *(R6 · bash-test)* — **Cuando** `gen-specs-json.sh` se ejecuta (con
  `STACKS_DIR`/`STACK_OUT` a rutas de fixture), **el sistema deberá** generar
  `stack.json` con `active` igual al `stack` de `config.json` y `available` con
  una entrada `{id,label,a11y}` por cada `<stacks_dir>/*.json`.
- **CA11** *(R6 · bash-test)* — **El sistema deberá** leer `stack.json` en
  `index.html` (`fetch` de ruta relativa) y renderizar el `label` del stack activo
  y, por cada stack no activo, el comando `scripts/asdd/init.sh --stack <id>`
  (grep de regresión sobre el render, no sobre literales de ruta absoluta).
- **CA11m** *(R6 · Manual)* — **Cuando** se abre el panel, **el sistema deberá**
  mostrar el distintivo del stack activo y, al elegir otro stack, mostrar/copiar
  el comando `init.sh --stack <id>` (verificación visual en el navegador).
- **CA-R7** *(R7 · bash-test)* — **El sistema deberá** garantizar que
  `scripts/asdd/test.sh` sale con ≠ 0 cuando un caso se fuerza a fallar y que
  `drupal.json` lo declara como gate; **mientras** `ASDD_IN_TEST=1`, el runner
  deberá omitir ese gate (sin recursión).
- **CA-A1** *(RA · bash-test)* — **El sistema deberá** tener contraste ≥ 4,5:1
  entre el texto del distintivo de stack y su fondo, calculado sobre las variables
  CSS concretas que use (se citan en el Plan técnico y en el test).
- **CA-A2** *(RA · bash-test)* — **El sistema deberá** renderizar las opciones de
  stack como elementos interactivos reales (`button`/`a`) y marcar el activo con
  `aria-current` y texto (no solo color).
- **CA-A3** *(RA · bash-test)* — **El sistema deberá** anunciar el resultado de
  copiar el comando en una región `aria-live`, con alternativa cuando no exista
  `navigator.clipboard` (verificable por la presencia de la región y el *fallback*
  en `index.html`).
- **CA-A4** *(RA · Manual)* — **El sistema deberá** permitir operar el selector con
  teclado, con foco visible ≥ 3:1, cierre con Esc y retorno del foco al
  disparador (lista manual de `asdd-accesibilidad`, confirmada por la persona).

## Fuera de alcance

- Persistir el stack con un clic desde el navegador. **Decisión tomada
  (Opción A):** el selector solo muestra y copia el comando
  `scripts/asdd/init.sh --stack <id>`; el panel se mantiene estático y de solo
  lectura. La persistencia con un clic exigiría un endpoint de escritura neutral
  —lo contrario del objetivo "fuera de PHP"— y, si se quisiera, iría en una spec
  aparte sin rehacer la 009.
- Migrar los agentes `asdd-*` (ya son neutrales respecto a la tecnología).
- Perfiles para toda tecnología: solo `drupal.json` (real) y `node.json`
  (ejemplo); el resto se añade después, un fichero por stack.
- Tocar `save-spec.php` (no existe) o añadir edición al panel.
- Cambiar el comportamiento de QA sobre **este** proyecto: `drupal.json` debe
  dejar `check.sh` haciendo exactamente lo que hace hoy (invariante verificada por
  CA2b).

## Dependencias

- `jq` (ya requerido por `gen-specs-json.sh` y `agent-hook.sh`): lo usan el
  runner, el asistente y los fixtures.

## Plan técnico
_(tras aprobar)_

- `asdd_tools/config.json`: añadir `"stack": "drupal"` (entregable de R2/R3).
- `asdd_tools/stacks/drupal.json`: perfil que reproduce `check.sh:50-65` como
  `gates` (argv literal por paso, mismo `label` y orden; el functional con `cmd` y
  `cmd_group`; js-unit y drush como `["bash","-c","…"]`), `a11y: true`, y `trace`
  con `pattern = (FunctionalJavascript|Unit|Kernel|Functional)\\([A-Za-z0-9_]+)::(test[A-Za-z0-9_]+)`
  (grupos 1/2/3 → marcadores `{1}` tipo, `{2}` clase, `{3}` método) y `locate`
  con la búsqueda
  `grep -l 'function {3}(' web/modules/custom/*/tests/src/{1}/{2}.php web/themes/custom/*/tests/src/{1}/{2}.php` (`check.sh:77`). Los valores,
  saneados a `[A-Za-z0-9_]+`, se interpolan en el glob sin riesgo.
- `scripts/check.sh`: sustituir los pasos literales por un bucle que lee
  `ASDD_CONFIG` (`config.json`), valida el `stack` contra `ASDD_STACKS_DIR/*.json`
  (R3), carga el perfil con `jq` y ejecuta cada `gate` con `run()`; conservar
  `--spec/--group/--no-a11y/URL`. `trace()` pasa a usar `trace.pattern`/`locate`
  con el saneo de R1; el paso a11y condicionado a `profile.a11y`; guardia
  `ASDD_IN_TEST` para el gate de tooling. El `trap` del hook no cambia.
- `scripts/asdd/init.sh` (nuevo): sin `--stack` imprime `id` + `label`; con
  `--stack ID` valida (R3), hace `jq '.stack=$id'` sobre `config.json` a temporal
  + `mv`, y llama a `scripts/gen-specs-json.sh` para regenerar `stack.json`.
- `asdd_tools/stacks/node.json`: perfil de ejemplo (`vitest`, `eslint`, `tsc`),
  `a11y` según corresponda, `trace` sencillo con **un** grupo → `{1}` (el nombre
  del test), `locate` = grep de `{1}` en `*.test.{js,ts}`. Solo demostrativo.
- `scripts/gen-specs-json.sh`: tras volcar `specs.json`, generar `stack.json` =
  `{active: <config.stack>, available: [ por cada <stacks_dir>/*.json →
  {id, label, a11y} ]}`, con `STACKS_DIR`/`STACK_OUT` sobreescribibles.
- `asdd_tools/index.html`: `fetch` relativo de `stack.json`; distintivo en la
  cabecera (`.hd`) con el `label` activo (tokens de color a citar en el test de
  contraste CA-A1); vista "Stacks" (modal, patrón del editor) con los `available`
  como `button`s, el activo con `aria-current`; al elegir uno no activo, mostrar y
  copiar `scripts/asdd/init.sh --stack <id>` con anuncio `aria-live` y *fallback*
  sin `navigator.clipboard`; Esc cierra y devuelve foco; no robar foco al cargar.
- `scripts/asdd/test.sh`: añadir CA1–CA11, CA-R7, CA-A1/A2/A3 con fixtures
  temporales (stack-fixtures de gates triviales `true`/`false`, `config.json`
  temporal vía `ASDD_CONFIG`, `STACKS_DIR`/`STACK_OUT` para `gen-specs-json.sh`;
  `ASDD_IN_TEST=1`). CA11/CA-A2/CA-A3 son grep de regresión; CA-A1 usa el helper
  awk de contraste de la spec-008.

## Tareas

- [x] Tests (rojo: 28 fallos) — `scripts/asdd/test.sh` (CA1–CA11, CA-R7, CA-A1/A2/A3)
- [x] Implementación de R1–R7 (arnés 66/66 verde: drupal.json, node.json, runner
  check.sh, init.sh, stack.json en gen-specs-json.sh, distintivo + vista Stacks)
- [x] Visual del distintivo y el selector de stack (CA11m)
- [x] Lista manual de accesibilidad (CA-A4, `asdd-accesibilidad`)
- [x] `scripts/check.sh --spec specs/009-qa-agnostica-stack.md` en verde (15/15)

## Trazabilidad

| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 | CA1 | `scripts/asdd/test.sh` (drupal.json válido) |
| R1/R2 | CA2 | `scripts/asdd/test.sh` (ids de gates presentes) |
| R1/R2 | CA2b | `scripts/asdd/test.sh` (label+cmd+orden literales) |
| R2 | CA3 | `scripts/asdd/test.sh` (gate que falla → ≠0) |
| R2 | CA3b | `scripts/asdd/test.sh` (todos pasan → 0) |
| R2 | CA4 | `scripts/asdd/test.sh` (--group usa cmd_group) |
| R2 | CA4b | `scripts/asdd/test.sh` (sin --group usa cmd) |
| R2 | CA5 | `scripts/asdd/test.sh` (a11y off → omite) |
| R2 | CA5b | `scripts/asdd/test.sh` (a11y on → incluye) |
| R2 | CA6 | `scripts/asdd/test.sh` (trazabilidad por perfil) |
| R1/R3 | CA6b | `scripts/asdd/test.sh` (valor no saneado → inexistente) |
| R3 | CA7 | `scripts/asdd/test.sh` (stack inválido aborta) |
| R3 | CA7b | `scripts/asdd/test.sh` (sin stack aborta) |
| R4 | CA8 | `scripts/asdd/test.sh` (init.sh fija .stack) |
| R4 | CA8b | `scripts/asdd/test.sh` (init.sh lista id+label) |
| R4 | CA8c | `scripts/asdd/test.sh` (init.sh regenera stack.json) |
| R5 | CA9 | `scripts/asdd/test.sh` (node.json válido) |
| R5 | CA9b | `scripts/asdd/test.sh` (runner ejecuta node.json con stubs) |
| R6 | CA10 | `scripts/asdd/test.sh` (gen genera stack.json) |
| R6 | CA11 | `scripts/asdd/test.sh` (render de stack en index.html) |
| R6 | CA11m | Manual (visual del distintivo y el selector) |
| R7 | CA-R7 | `scripts/asdd/test.sh` (arnés ≠0 + gate + guardia recursión) |
| RA | CA-A1 | `scripts/asdd/test.sh` (contraste del distintivo ≥ 4,5:1) |
| RA | CA-A2 | `scripts/asdd/test.sh` (botones + aria-current) |
| RA | CA-A3 | `scripts/asdd/test.sh` (aria-live + fallback copia) |
| RA | CA-A4 | Manual (`asdd-accesibilidad` + persona) |

## Puertas

- Validación: 2026-11-21 · 1ª pasada BLOQUEADA (v1.0): 1 BLOQUEANTE (TRZ-001) +
  5 ALTOS (DRU-001, AMB-001, VER-001, VER-002, A11Y-001) + 3 MEDIOS (EARS-001,
  DRU-002, DRU-003) → corregidos en v1.1. 2 BAJOS → `pendientes.md`. Informe en
  `009-validacion.md`. v1.2: decisión del selector resuelta (Opción A, comando CLI).
  v1.3: marcadores de trazabilidad generalizados a posicionales `{1}`..`{N}`.
  2ª pasada sobre v1.3: **SUPERADA** (0 BLOQUEANTES/ALTOS/MEDIOS; 2 BAJOS →
  `pendientes.md`). TRZ-001 cerrado: R7→CA-R7, R4→CA8b/CA8c.
- QA: 2026-11-21 · **SUPERADA**. `scripts/check.sh --spec specs/009-qa-agnostica-stack.md`
  15/15 gates en verde (phpunit unit/kernel/functional, phpcs, phpstan, linters,
  arnés `scripts/asdd/test.sh` 66/66, js-unit, drush, trazabilidad 009, axe a 1280
  y 320 px). El runner ejecuta `drupal.json` con comportamiento idéntico al previo.
- Seguridad: 2026-11-21 · **SUPERADA** (0 BLOQUEANTES/ALTOS/MEDIOS). Sin vía de
  inyección en `trace.locate` (saneo `[A-Za-z0-9_]+` antes del `bash -c`), id de
  stack validado (sin path traversal), sin secretos, `composer audit` limpio.
  2 BAJOS + 1 OBS (perfiles ejecutables → versionar y no escribibles por `www-data`)
  → `pendientes.md`. Sin informe (sin hallazgos ≥ MEDIO).
- Accesibilidad: 2026-11-21 · **SUPERADA CON AVISOS** (`009-accesibilidad.md`).
  0 ALTOS · 3 MEDIOS corregidos (2.5.3 etiqueta en el nombre del distintivo;
  fondo `inert` y modal `inert` al cerrar → orden de foco y confinamiento;
  foco restaurado en `fallbackCopy`) · 2 BAJOS → `pendientes.md`. Lista manual
  (CA-A4) pendiente de confirmar por la persona.
