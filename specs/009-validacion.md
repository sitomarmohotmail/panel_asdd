# Validación · spec 009 — QA agnóstica de tecnología (perfiles de stack)

- Fecha: 2026-11-21
- Versión de la spec validada: 1.3 (2ª pasada; la 1ª, sobre v1.0, salió BLOQUEADA)
- Resultado: SUPERADA
- Hallazgos: 0 BLOQUEANTES · 0 ALTOS · 0 MEDIOS · 2 BAJOS

## Resumen
Todos los hallazgos de la 1ª pasada están resueltos. Cada requisito DEBE (R1–R7, RA) tiene al menos un criterio con test en la tabla de Trazabilidad, y los criterios son EARS, de un solo comportamiento y verificables. Los hallazgos ya se habían corregido y verificado contra el arnés `scripts/asdd/test.sh` (66/66).

## Hallazgos previos
| ID | Estado | Comprobación |
|---|---|---|
| TRZ-001 | Resuelto | R7→CA-R7; R4→CA8, CA8b, CA8c; R1→CA1/2/2b/6b; R2→CA2–CA6; R3→CA6b/7/7b; R5→CA9/9b; R6→CA10/11/11m; RA→CA-A1..A4. Todos los CA figuran en `test.sh` (CA11m y CA-A4 son Manual, declarados como tales). |
| DRU-001 | Resuelto | R3 + CA7b; `config.json` ya tiene `"stack": "drupal"`. |
| AMB-001 | Resuelto | R1 define marcadores posicionales `{1}..{N}` y saneo `^[A-Za-z0-9_]+$`; CA6b. |
| VER-001 | Resuelto | `ASDD_CONFIG`, `ASDD_STACKS_DIR` (check.sh:16-17,25-26; init.sh:14-15) y `STACKS_DIR`/`STACK_OUT` (gen-specs-json.sh:113-114). |
| VER-002 | Resuelto | CA9b con stubs; guardia `ASDD_IN_TEST` en check.sh:89; `drupal.json` declara el gate `tooling` (línea 14). |
| A11Y-001 | Resuelto | RA cubre `aria-live`, `aria-current`, Esc con retorno del foco y alternativa sin clipboard; CA-A1..A4. |
| EARS-001 | Resuelto | Criterios divididos (CA3/3b, 4/4b, 5/5b, 8/8b/8c, 9/9b). |
| DRU-002, DRU-003 | Resueltos | CA2b (label+cmd+orden literales); R4 regenera `stack.json` (CA8c). |

- **Verificación:** comprobado (leída la spec y grep de los CA y variables en `test.sh`, `check.sh`, `init.sh`, `gen-specs-json.sh`, `drupal.json`, `config.json`).

## BAJOS (→ `specs/pendientes.md`)
- `test.sh` contiene un CA12 que no figura en la spec ni en la Trazabilidad (criterio huérfano en el arnés).
- Las «Tareas» dejan CA11m y CA-A4 sin marcar: es coherente con la spec en estado `aprobada`, pero la persona debe confirmarlos antes de `implementada`.

## Recomendación
Sin acciones bloqueantes. Queda pendiente la verificación manual (CA11m, CA-A4) por la persona.
