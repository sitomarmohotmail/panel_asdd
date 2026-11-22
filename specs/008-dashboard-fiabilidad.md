---
id: "008"
titulo: Fiabilidad del dashboard asdd_tools (hook, veredicto, estado en-curso y orden)
version: 1.3
estado: implementada
nivel: M
tipo: modulo
proyecto: asdd_tools
---

# 008 · Fiabilidad del dashboard asdd_tools

## Contexto

El dashboard `asdd_tools` tiene varios defectos detectados durante la spec-007
(los dos primeros anotados en `specs/pendientes.md`):

1. **Falso positivo del hook.** `scripts/agent-hook.sh` registra "tests en
   ejecución" en `running.json` con **cualquier** comando Bash que contenga la
   cadena `check.sh` (`grep -qE 'check\.sh'`), incluidos los que solo la
   *mencionan* (un `grep`, un `ps`, o el mensaje de un commit).
2. **Puerta verde sin veredicto.** `scripts/gen-specs-json.sh` marca una puerta
   (`val`/`qa`/`seg`/`a11y`) como superada por la **mera existencia** del
   informe, sin leer su veredicto; un `Resultado: BLOQUEADA` pinta el chip verde.
3. **Estado `en-curso` no contemplado.** El ciclo es
   `borrador → aprobada → en-curso → implementada`, pero el panel solo conoce
   tres estados; una spec `en-curso` no aparece en ninguna columna (le pasó a la
   007).
4. **Orden poco útil.** Las specs no se ordenan con las recientes arriba.
5. **Falta resumen de documentos.** Al desplegar una tarjeta no se ve el resumen
   (Fecha, Versión, Resultado, Hallazgos) de cada documento de la spec.
6. **Mensaje de "tests" colgado.** El panel muestra "tests en ejecución" (global)
   que no desaparece: lee `running.json` sin filtrar por antigüedad, así que una
   entrada obsoleta (sin STOP) se queda hasta que el hook vuelva a escribir.

## Requisitos

- **R1** *(DEBE)* — `scripts/agent-hook.sh` deberá registrar el proceso `tests`
  solo cuando el comando **ejecute** `scripts/check.sh`. Se considera que lo
  *ejecuta* cuando `check.sh` (con ruta `scripts/`, `./scripts/` o `./`, o tras
  `bash`/`sh`) aparece en **posición de comando**: al inicio del comando o tras
  `&&`, `;`, `|` o `(`, opcionalmente precedido de `cd … &&`. **No** cuenta como
  ejecución cuando aparece como argumento de otro programa (p. ej. `grep`, `ps`)
  ni dentro de comillas (p. ej. en el mensaje de un commit).
- **R2** *(DEBE)* — `scripts/gen-specs-json.sh` deberá excluir una puerta del
  array `gates` de una spec (las cuatro: `val`, `qa`, `seg` y **`a11y`**) cuando
  el valor que sigue a la primera línea `Resultado:` del informe **empiece** por
  `BLOQUEAD`. Si el informe no tiene línea `Resultado:`, la puerta se mantiene.
- **R3** *(DEBE)* — El comportamiento de R1, R2, R4, R5, R6 y R7 deberá quedar
  cubierto por un arnés de tests propio `scripts/asdd/test.sh` (patrón de
  `scripts/lint/test.sh`, spec-002) que salga con código ≠ 0 al fallar un caso,
  integrado como un paso de `scripts/check.sh`.
- **R4** *(DEBE)* — `asdd_tools/index.html` deberá contemplar `en-curso` como un
  estado de primer nivel en **todas** sus estructuras de estado: columnas del
  kanban (`cols`), etiquetas de columna (`labels`), `STATE_LABELS`, `FILTER_ES`,
  `STEP_POS`, el array de la leyenda/recuento y los nodos del pipeline; y con
  estilo propio: tokens `--en-curso-*` y reglas `.card[data-estado="en-curso"]`,
  `.dp-estado.en-curso`, `.stat.en-curso`, `.pn-box.en-curso`, `.kol-hd.en-curso`.
  La columna "En curso" se sitúa entre "Aprobada" e "Implementada". Una spec
  `en-curso` deberá mostrarse (no quedar oculta).
- **R5** *(DEBE)* — El panel deberá ordenar las specs de mayor a menor `id`
  (las más recientes arriba). El orden descendente deberá aplicarse en **todos**
  los listados que hoy ordenan (kanban, leyenda/recuento y cualquier `.sort(` de
  `index.html`), usando el mismo comparador `b.id.localeCompare(a.id)`.
- **R6** *(DEBE)* — La sección desplegable de la tarjeta (botón ▾ / `card-toggle`)
  deberá mostrar, por cada uno de los cinco documentos de la spec que exista —el
  propio documento de la spec (`NNN-….md`) y los informes de validación, QA,
  seguridad y accesibilidad—, los campos **Fecha**, **Versión de la spec**,
  **Resultado** y **Hallazgos**, tal como figuran en ese documento (los campos
  ausentes no se muestran). Para el documento de la spec, que usa frontmatter YAML
  sin esas líneas, la entrada expone solo `version` (frontmatter) y `estado`. Las
  etiquetas de los informes varían ("Versión de la spec", "…validada", "Versión
  validada", "Hallazgos nuevos"), así que se leen con regex tolerante
  (`^- Versi[oó]n[^:]*:`, `^- Hallazgos[^:]*:`, `^- Fecha:`, `^- Resultado:`,
  primera coincidencia). Los extrae `scripts/gen-specs-json.sh` a `specs.json`
  (objeto `reports`); el panel los renderiza **escapados** (`esc()`), sin fetch.
- **R7** *(DEBE)* — El panel no deberá mostrar el indicador de "tests/agente en
  ejecución" para una entrada de `running.json` cuyo `started` (epoch en
  **segundos**, como lo escribe `agent-hook.sh`) sea anterior a `now − TTL`, con
  `TTL = 1800 s` (el mismo del hook). Debe purgarlas **en cliente** al leer
  (`updateAgentIcons`/`normAgent`), convirtiendo `Date.now()` (ms) a segundos; las
  entradas **sin** `started` se tratan igual que en el hook (cadena suelta → se
  conserva; objeto sin `started` → se purga). Así una entrada obsoleta desaparece
  en el siguiente sondeo (≤ 2 s) sin depender de una escritura del hook. (R1 evita
  crearlas; R7 garantiza que, si una queda, no se muestre colgada.)
- **RA** *(DEBE)* — El sistema deberá cumplir WCAG 2.2 nivel AA en los cambios de
  `index.html`: contraste del texto del chip/columna `en-curso` ≥ 4,5:1, borde
  del estado ≥ 3:1 (1.4.11), y el estado no transmitido solo por color (etiqueta
  de texto visible).

## Criterios de aceptación (EARS)

- **CA1** *(R1 · bash-test)* — **Cuando** se pasa a `agent-hook.sh start` un
  comando donde `check.sh` aparece solo como mención, **el sistema deberá** dejar
  `running.json` sin añadir entrada. Casos: `grep -E 'check.sh'`,
  `grep scripts/check.sh`, `ps aux | grep check.sh`,
  `git commit -m "… scripts/check.sh …"`.
- **CA2** *(R1 · bash-test)* — **Cuando** se pasa un comando que ejecuta
  `scripts/check.sh`, **el sistema deberá** añadir una entrada `tests`. Casos:
  `scripts/check.sh --spec specs/007-….md`, `cd /ruta && scripts/check.sh`,
  `bash scripts/check.sh`, `./scripts/check.sh`.
- **CA3** *(R2 · bash-test)* — **Si** un informe con `Resultado: BLOQUEADA`,
  probado al menos con los tipos `qa` y `a11y`, **entonces** `gen-specs-json.sh`
  **deberá** no incluir esa puerta en `gates`.
- **CA4** *(R2 · bash-test)* — **Cuando** el informe tiene veredicto no bloqueante
  (`Resultado: SUPERADA…`) **o un fixture sintético sin línea `Resultado:`**,
  **el sistema deberá** incluir la puerta.
- **CA5** *(R3 · bash-test)* — **El sistema deberá** garantizar que
  `scripts/check.sh` invoca `scripts/asdd/test.sh` y que el arnés sale con código
  ≠ 0 cuando un caso falla (comprobado con un caso forzado a fallar).
- **CA6** *(R4 · bash-test)* — **El sistema deberá** declarar `en-curso` en cada
  estructura de estado de `index.html`, con una aserción por estructura (regex
  sobre la línea de `cols`, `labels`, `STATE_LABELS`, `FILTER_ES`, `STEP_POS`,
  el array de leyenda y los nodos del pipeline).
- **CA7** *(R4 · bash-test)* — **El sistema deberá** definir los tokens
  `--en-curso-fg/bg/bd` y las reglas `.card[data-estado="en-curso"]`,
  `.dp-estado.en-curso`, `.stat.en-curso`, `.pn-box.en-curso` y `.kol-hd.en-curso`.
- **CA8** *(R4 · Manual)* — **Cuando** una spec está en `en-curso`, **el sistema
  deberá** mostrar su tarjeta en la columna "En curso" del kanban con su chip
  estilado (verificación visual en el navegador, en `http://d11asdd.local` del
  panel o el fichero servido).
- **CA9** *(R5 · bash-test)* — **El sistema deberá** usar el comparador
  descendente `b.id.localeCompare(a.id)` en cada `.sort(` de `index.html` (una
  aserción por ordenación; no debe quedar ninguna ascendente
  `a.id.localeCompare(b.id)`).
- **CA9m** *(R5 · Manual)* — **Cuando** hay varias specs en una columna, **el
  sistema deberá** mostrar la de `id` mayor arriba.
- **CA-A1** *(RA · bash-test)* — **El sistema deberá** tener un contraste
  texto/fondo del estado `en-curso` ≥ 4,5:1 (luminancia de `--en-curso-fg` sobre
  `--en-curso-bg`).
- **CA-A2** *(RA · bash-test)* — **El sistema deberá** rotular el estado con texto
  visible: "En curso" en la columna del kanban y "en curso" en la leyenda
  (`.stat`) y el detalle (`.dp-estado`), no solo por color.
- **CA-A3** *(RA · bash-test)* — **El sistema deberá** tener un contraste del
  borde del estado (`--en-curso-bd`) frente al fondo ≥ 3:1 (WCAG 1.4.11).
- **CA10** *(R6 · bash-test)* — **Cuando** `gen-specs-json.sh` procesa una spec,
  **el sistema deberá** incluir en `specs.json` un objeto `reports` con una
  entrada por documento existente: `spec` con `version` (frontmatter) y `estado`;
  y `validacion`/`qa`/`seguridad`/`accesibilidad` con los campos presentes de
  `fecha`, `version`, `resultado` y `hallazgos`, leídos con la regex tolerante de
  R6 (probado con un fixture por variante de etiqueta: "Versión de la spec",
  "Versión de la spec validada", "Hallazgos nuevos").
- **CA11** *(R6 · bash-test)* — **El sistema deberá** renderizar la sección
  desplegable desde `reports`: el cuerpo de `cardHTML` referencia `s.reports` y
  los cuatro campos (`fecha`, `version`, `resultado`, `hallazgos`), no solo la
  cadena `reports`.
- **CA11m** *(R6 · Manual)* — **Cuando** se despliega una tarjeta, **el sistema
  deberá** mostrar, por documento, Fecha / Versión / Resultado / Hallazgos tal
  como figuran (verificación visual).
- **CA12** *(R7 · bash-test)* — **El sistema deberá** filtrar en el cliente por
  antigüedad: el código de `updateAgentIcons`/`normAgent` de `index.html` compara
  `started` contra `now − 1800` en **segundos** (convirtiendo `Date.now()/1000`),
  verificable por la presencia de `started`, `1800` y la conversión a segundos.
- **CA12m** *(R7 · Manual)* — **Si** `running.json` contiene una entrada con
  `started` anterior al TTL, **entonces el sistema deberá** no mostrar su
  indicador en el siguiente sondeo (verificación visual).

## Fuera de alcance

- Un tercer estado visual "bloqueada" en los chips de puerta (el chip gris ya
  refleja el bloqueo).
- Automatizar axe sobre `asdd_tools/index.html`: es una herramienta local fuera
  del sitio Drupal y no está en las URLs de `scripts/check.sh`; la RA se verifica
  con los tests de contraste/etiqueta (CA-A1/A2/A3) y la visual CA8.
- Revisar el contraste de los estados ya existentes (borrador/aprobada/
  implementada); solo se añade `en-curso`.
- Mejorar el TTL o el mecanismo de parada del hook (sigue como red de seguridad).

## Dependencias

- `jq` (ya requerido por `agent-hook.sh`): lo usan el hook y los fixtures del
  arnés.

## Plan técnico
_(tras aprobar)_

- `scripts/agent-hook.sh`: en la rama `Bash` de `start`, sustituir
  `grep -qE 'check\.sh'` por un patrón que exija `check.sh` en posición de
  comando (ancla de inicio o tras `&&`/`;`/`|`/`(`, con `cd … &&`, `bash`, `sh`,
  `./` o `scripts/` opcionales) y que no case dentro de comillas ni como
  argumento. El `mark-start`/`mark-stop` directos no cambian.
- `scripts/gen-specs-json.sh`: función `gate_ok <fichero>` que lea la primera
  línea `Resultado:`, recorte el valor y devuelva falso solo si empieza por
  `BLOQUEAD`; si no hay línea, verdadero. Aplicarla a las **cuatro** puertas
  (incluida `a11y`, hoy marcada por existencia en `gen-specs-json.sh:46`).
- `asdd_tools/index.html`: tokens `--en-curso-fg/bg/bd`; reglas `.card`,
  `.dp-estado`, `.stat`, `.pn-box`, `.kol-hd` para `en-curso`; añadir `en-curso` a
  `cols`, `labels`, `STATE_LABELS`, `FILTER_ES`, `STEP_POS`, leyenda y pipeline;
  columna entre "Aprobada" e "Implementada". Cambiar **todos** los `.sort(` a
  descendente (`b.id.localeCompare(a.id)`; hoy `index.html:1090` es ascendente).
- `scripts/gen-specs-json.sh`: por cada spec, construir un objeto `reports`:
  entrada `spec` con `version` (frontmatter) y `estado`; entradas `validacion`,
  `qa`, `seguridad`, `accesibilidad` (las que existan) leyendo con regex tolerante
  `^- Fecha:`, `^- Versi[oó]n[^:]*:`, `^- Resultado:`, `^- Hallazgos[^:]*:`
  (primera coincidencia de cada una). Reutiliza el parseo de `Resultado:` de R2.
- `asdd_tools/index.html` (`cardHTML`): en la sección desplegable (`card-toggle`
  ▾), renderizar un bloque por entrada de `reports` con sus cuatro campos,
  **escapando** los valores con `esc()` (van por `innerHTML`).
- `asdd_tools/index.html` (`updateAgentIcons`/`normAgent`): descartar las entradas
  de `running.json` con `started < (Date.now()/1000) − 1800` (segundos; mismo TTL
  que `agent-hook.sh`) antes de pintar iconos y leyenda; las entradas sin
  `started` se tratan como el hook (cadena → se conserva; objeto → se purga).
- `scripts/asdd/test.sh` (nuevo): casos CA1–CA7, CA9–CA12, CA-A1/A2/A3 con fixtures
  temporales. El hook se prueba con JSON por stdin y un `running.json` temporal;
  `gen-specs-json.sh` con `SPECS_DIR`/`OUTPUT` sobrescritos a un directorio temporal
  (`gen-specs-json.sh:14-15` lo admite), con informes-fixture por variante de
  etiqueta y uno sin `Resultado:`. El contraste (CA-A1/A3) se calcula con un helper
  awk sobre los tokens; CA9/CA11/CA12 son `grep` de regresión sobre `index.html`.
- `scripts/check.sh`: nuevo paso `run "tooling (fixtures)" scripts/asdd/test.sh`.

## Tareas

- [ ] Tests (rojo: N fallos) — `scripts/asdd/test.sh` (CA1–CA7, CA9–CA12, CA-A1/A2/A3)
- [ ] Implementación de R1, R2, R4, R5, R6, R7
- [ ] Paso en `scripts/check.sh`
- [ ] Visual del estado `en-curso`, del orden y del desplegable (CA8, CA9m, CA11m)
- [ ] `scripts/check.sh --spec specs/008-dashboard-fiabilidad.md` en verde

## Trazabilidad

| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 | CA1 | `scripts/asdd/test.sh` (hook: menciones) |
| R1 | CA2 | `scripts/asdd/test.sh` (hook: invocaciones reales) |
| R2 | CA3 | `scripts/asdd/test.sh` (BLOQUEADA → sin puerta, val y qa) |
| R2 | CA4 | `scripts/asdd/test.sh` (SUPERADA / sin Resultado → con puerta) |
| R3 | CA5 | `scripts/asdd/test.sh` (check.sh invoca el arnés; sale ≠ 0 al fallar) |
| R4 | CA6 | `scripts/asdd/test.sh` (cableado por estructura) |
| R4 | CA7 | `scripts/asdd/test.sh` (tokens y reglas CSS) |
| R4 | CA8 | Manual (visual en el navegador) |
| R5 | CA9 | `scripts/asdd/test.sh` (comparador `id` descendente) |
| R5 | CA9m | Manual (visual: id mayor arriba) |
| R6 | CA10 | `scripts/asdd/test.sh` (specs.json con `reports` y sus campos) |
| R6 | CA11 | `scripts/asdd/test.sh` (plantilla `reports` en `index.html`) |
| R6 | CA11m | Manual (visual del desplegable) |
| R7 | CA12 | `scripts/asdd/test.sh` (filtro por `started`/TTL en `index.html`) |
| R7 | CA12m | Manual (entrada obsoleta no se muestra) |
| RA | CA-A1 | `scripts/asdd/test.sh` (contraste fg/bg ≥ 4,5:1) |
| RA | CA-A2 | `scripts/asdd/test.sh` (etiqueta de texto visible) |
| RA | CA-A3 | `scripts/asdd/test.sh` (borde ≥ 3:1) |

## Puertas

- Validación: 2026-11-21 · 1ª pasada BLOQUEADA (v1.0) → corregida en v1.1 ·
  2ª pasada BLOQUEADA (v1.2): 3 ALTOS (AMB-001, ALC-001, AMB-002) + 3 MEDIOS
  (TRZ-001, AMB-003, VER-001) → corregidos en v1.3. 2 BAJOS → `pendientes.md`.
  Informe en `008-validacion.md`.
- QA: 2026-11-21 · **SUPERADA** (`008-qa.md`). `scripts/check.sh --no-a11y` 13/13
  en verde, incluido el arnés `scripts/asdd/test.sh` (37 casos). Kanban a 4
  columnas verificado con puppeteer.
