# Validación · spec 008 — Fiabilidad del dashboard asdd_tools

- Fecha: 2026-11-21
- Versión de la spec validada: 1.2 (2ª pasada) → corregida en 1.3
- Resultado: SUPERADA CON AVISOS (v1.3)
- Hallazgos: 0 BLOQUEANTES · 3 ALTOS · 3 MEDIOS · 2 BAJOS (todos corregidos en v1.3)

> **Cierre (v1.3).** Los 3 ALTOS y 3 MEDIOS de la 2ª pasada se corrigieron en la
> spec (no había BLOQUEANTES). Cada corrección está cubierta por un caso de
> `scripts/asdd/test.sh`, por lo que —según `quality-gates.md` §1— no se repite la
> pasada. Los 2 BAJOS quedan en `specs/pendientes.md`.

## Resumen
Las correcciones de la 1ª pasada (VER-001..004, TRZ-001, CON-001, ALC-001) siguen bien en v1.2. R5, R6 y R7 introducen ambigüedades que cambian la implementación (R6 y R7) y R3 y el plan no cubren con el arnés todo lo que la traza promete.

## Hallazgos
### AMB-001 · ALTA · R6/CA10
- **Evidencia:** «los campos Fecha, Versión de la spec, Resultado y Hallazgos, tal como figuran en ese documento»; plan: «leyendo … `- Fecha:`, `- Versión de la spec:`, `- Resultado:`, `- Hallazgos:`».
- **Problema:** (a) el documento `NNN-….md` de la spec usa frontmatter YAML (`version:`, `estado:`), sin líneas `- Fecha:`/`- Resultado:`/`- Hallazgos:`: la entrada `spec` queda sin definir. (b) Las etiquetas reales varían: `Versión de la spec` (7), `Versión de la spec validada` (2), `Versión validada` (1, el propio 008-validacion v1.0) y `Hallazgos nuevos` (1); un match literal de `Versión de la spec:` pierde 3 informes.
- **Corrección:** definir para `spec` solo `version` (frontmatter) y `estado`; para informes, regex `^- Versi[oó]n[^:]*:` → `version` y `^- Hallazgos[^:]*:` → `hallazgos` (primera coincidencia), `^- Fecha:`, `^- Resultado:`. CA10 con un fixture por variante.
- **Verificación:** comprobado (grep de cabeceras en `specs/*-{validacion,qa,seguridad,accesibilidad}.md`; frontmatter leído en la spec).

### ALC-001 · ALTA · R2/CA4
- **Evidencia:** «Si el informe no tiene línea `Resultado:`, la puerta se mantiene (… p. ej. accesibilidad)».
- **Problema:** el ejemplo es falso: `specs/007-accesibilidad.md:5` lleva `- Resultado: BLOQUEADA`. Con R2 la puerta a11y de 007 se excluirá (correcto), pero CA4 «sin línea Resultado» debe probarse con un fixture sintético, no con "accesibilidad". Además `gen-specs-json.sh:46` hoy la marca por existencia: R2 y el plan (`gates_arr`) deben incluir `a11y` en `gate_ok`.
- **Corrección:** quitar «p. ej. accesibilidad» de R2; CA3 incluir `a11y` entre los tipos probados; CA4 «fixture sin línea Resultado» con cualquier tipo.
- **Verificación:** comprobado (leído `007-accesibilidad.md:5` y `gen-specs-json.sh:46`).

### AMB-002 · ALTA · R7/CA12
- **Evidencia:** «cuyo `started` sea anterior al TTL»; el TTL y la unidad solo aparecen en el plan («1800 s»).
- **Problema:** `started` es epoch en segundos (`agent-hook.sh:21`); `Date.now()` da ms, error típico que hace purgar todo o nada. No se define qué hacer con entradas sin `started` (cadena suelta o objeto sin campo): el hook las trata distinto (cadena → `$now`, retenida; objeto sin `started` → 0, purgada; `agent-hook.sh:39-40`). El cliente hoy no lee `started` (`index.html:921-922`).
- **Corrección:** en R7: «TTL = 1800 s (el de `agent-hook.sh`), `started` en epoch segundos; las entradas sin `started` se conservan (cadena) o se purgan (objeto), igual que el hook». CA12 comprobar `started` y `1800` y la conversión a segundos.
- **Verificación:** comprobado (leído `index.html:919-923` y `agent-hook.sh:21,27,39-40`).

### TRZ-001 · MEDIA · R3 / Plan / Tareas
- **Evidencia:** R3: «R1, R2, R4 y R5»; plan: «casos CA1–CA7, CA9, CA-A1/A2/A3»; Tareas: «CA1–CA7, CA9–CA12».
- **Problema:** tres listas distintas; R6/R7 (DEBE) tienen CA10–CA12 bash-test en la traza pero R3 y el plan no los cubren. CA8/CA9m no existen en el arnés (correcto, son Manual).
- **Corrección:** R3 «R1, R2, R4, R5, R6 y R7»; plan «CA1–CA7, CA9–CA12, CA-A1/A2/A3».
- **Verificación:** comprobado (lectura de la spec).

### AMB-003 · MEDIA · R5/CA9
- **Evidencia:** «dentro de cada columna y de cualquier listado»; CA9 «comparador verificable».
- **Problema:** «cualquier listado» no enumera (kanban, pipeline, leyenda, filtro). Hoy el orden está en `index.html:1090` (`a.id.localeCompare(b.id)`); CA9 no dice qué se comprueba (si hay un único `sort` o varios). Ids "NNN" de 3 dígitos: `localeCompare` vale, pero con ≥1000 specs no.
- **Corrección:** enumerar los listados y exigir que todos usen la misma lista ordenada (una aserción por `.sort(` de `index.html`: `b.id.localeCompare(a.id)`).
- **Verificación:** comprobado (línea 1090); resto deducido.

### VER-001 · MEDIA · CA11
- **Evidencia:** «verificable por la presencia de la plantilla de `reports`».
- **Problema:** presencia de la cadena es test débil (misma crítica que VER-002 previa); un `reports` mencionado en un comentario pasaría.
- **Corrección:** aserción sobre el cuerpo de `cardHTML`: referencia a `s.reports` y a los cuatro campos `fecha|version|resultado|hallazgos`.
- **Verificación:** deducido.

## BAJOS (→ pendientes.md)
- CA12/CA9 son tests de presencia (sin arnés JS): aceptar o plantear un arnés `node` mínimo en spec futura.
- R6 no dice si los valores de `specs.json` se escapan al renderizar (innerHTML en `cardHTML`).

## Hallazgos previos
Todos los de la 1ª pasada (VER-001..004, ALTOS/MEDIOS) siguen resueltos en v1.2. Corrección a mi nota previa: el contexto decía que accesibilidad no lleva `Resultado:`; sí lo lleva (ver ALC-001).

## Recomendación
Corregir AMB-001, ALC-001 y AMB-002 (ALTOS) y los MEDIOS en la spec; los ALTOS afectan a qué se implementa, no basta pasarlos a pendientes. No hace falta repetir la pasada si cada corrección queda cubierta por un caso del arnés.
