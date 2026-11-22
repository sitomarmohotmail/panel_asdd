# Validación · spec 001 — Tema hijo de Bootstrap5

- Fecha: 2026-11-08
- Versión de la spec validada: 1.1 (tercera pasada)
- Resultado: SUPERADA CON AVISOS
- Hallazgos: 0 BLOQUEANTES · 0 ALTOS · 0 MEDIOS · 1 BAJO

## Resumen
La spec ya no tiene hallazgos BLOQUEANTES ni ALTOS. Los nueve hallazgos de la
segunda pasada están resueltos. AMB-007 lo está en lo esencial: se fijan las
regiones y solo queda un matiz de forma. DRU-002, el que bloqueaba, queda
cerrado. R10 y el plan técnico declaran ya `subtheme_folder`, `subtheme_name`
y `subtheme_machine_name` en el esquema. Lo he comprobado en el código:
`SettingsManager.php`, líneas 218–239, añade esos campos al formulario, y
`theme_settings_convert_to_config()` los guarda, como confirma el agente
principal. Además, todos los valores de la tabla de R10 (incluido `none`) son
opciones válidas de los `select` del formulario, así que CA7e («guardar sin
cambios») no fallará por una opción no permitida.

He vuelto a revisar la spec entera y solo he encontrado un defecto menor
nuevo, en CA-A4c. La validación sigue siendo en parte retrospectiva: R1–R9
están implementados en la v1.0 (`84bb516`), y lo que se valida es la v1.1, en
borrador.

## Hallazgos

### AMB-010 · BAJA · CA-A4c
- **Evidencia:** «**el sistema deberá** distinguir los enlaces del pie del texto que los rodea por algo más que el color (subrayado), aunque la regla `footer.footer-dark a` de Bootstrap5 lo quite (WCAG 1.4.1). Se corrige en `css/style.css`.»
- **Problema:** el paréntesis «(subrayado)» se puede leer de dos formas: como el único rasgo aceptado o como un ejemplo. Según cómo se lea, valdría o no otro rasgo (por ejemplo, negrita con un contraste de 3:1 respecto al texto). Además, la última frase es una instrucción de implementación metida en el criterio, no parte del comportamiento. No impide verificarlo, porque el plan técnico concreta el subrayado.
- **Corrección propuesta:** «**Mientras** `d11asdd_theme.settings` tenga los valores de R10, **el sistema deberá** mostrar subrayados los enlaces de `<footer>` (`text-decoration: underline`), aunque la regla `footer.footer-dark a` de Bootstrap5 lo quite (WCAG 1.4.1).» Si se quiere que valga otro rasgo, escribirlo de forma explícita. La frase «Se corrige en `css/style.css`» ya está en el plan técnico y se puede quitar del criterio.

## Hallazgos previos

### Segunda pasada (BLOQUEADA)
| ID | Estado |
|---|---|
| DRU-002 (ALTA) | Resuelto: R10 y el plan técnico añaden al esquema `subtheme_folder`, `subtheme_name` y `subtheme_machine_name` (`string`) y explican por qué se guardan. No se incluyen en `config/install`. CA7e lo verifica en un test Functional con el esquema estricto. Comprobado en `SettingsManager.php` (líneas 218–239). |
| A11Y-001 (MEDIA) | Resuelto: hay un CA-A4c nuevo, y el plan técnico añade el subrayado de los enlaces del pie a `css/style.css`. Matiz de redacción en AMB-010. |
| EARS-004 (MEDIA) | Resuelto: CA7d (Kernel, instalación) y CA7e (Functional, guardado del formulario) están separados. La trazabilidad y el plan están actualizados. |
| ACT-002 (MEDIA) | Resuelto: CA13 fija el actor (visitante anónimo) y el disparador (credenciales incorrectas en `/user/login`). Sin `inline_form_errors` activo, el error se muestra con Messenger en el bloque de mensajes. |
| AMB-007 (BAJA) | Resuelto en lo esencial: se fijan las regiones de `d11asdd_theme_help` (`content`) y `d11asdd_theme_search_form` (`nav_additional`). La condición sigue escrita como «solo se crean si…» en lugar de *Donde*, pero no es ambigua. |
| AMB-008 (BAJA) | Resuelto: CA12 usa selectores concretos. La spec coloca bien el menú principal dentro de `<nav class="navbar">`; la corrección propuesta en el informe anterior lo ponía por error dentro de `<main>`. |
| AMB-009 (BAJA) | Resuelto: CA8 dice qué contenedores son (el `div` hijo directo de la barra, de `<main>` y de `<footer>`), igual que CA7a. Comprobado en `page.html.twig`. |
| CON-004 (BAJA) | Resuelto: RA dice que la persona decide si se comunican a los mantenedores o se abre una spec específica. Encaja con `.claude/rules/accesibilidad.md`. |
| VER-004 (BAJA) | Resuelto: se divide en CA9 (archivos prohibidos) y CA9b (solo `.css` en la librería), los dos Unit. La suite `custom-unit` incluye `web/themes/custom/*/tests/src/Unit`. |

### Primera pasada (BLOQUEADA)
| ID | Estado |
|---|---|
| TRZ-001 (BLOQUEANTE) | Resuelto: CA9 y CA9b cubren R5. |
| TRZ-002 (BLOQUEANTE) | Resuelto: CA11, CA12 y CA13 cubren R7. |
| CON-001 (ALTA) | Resuelto: `b5_body_schema` y `b5_body_bg_schema` pasan a `none`. |
| CON-002 (ALTA) | Resuelto: el pie usa `bg-dark` (decisión de la persona). |
| DRU-001 (ALTA) | Resuelto, junto con DRU-002. |
| VER-001 (ALTA) | Resuelto: CA-A1, CA-A1b y CA-A1c. |
| CON-003 (ALTA) | Resuelto: RA fija el tratamiento de lo heredado (decisión de la persona). |
| EARS-001 (ALTA) | Resuelto: CA5a y CA5b. |
| EARS-002 (ALTA) | Resuelto: CA7c. |
| AMB-001 (MEDIA) | Resuelto. |
| AMB-002 (MEDIA) | Resuelto. |
| AMB-003 (MEDIA) | Resuelto. |
| ACT-001 (MEDIA) | Resuelto. |
| VER-002 (MEDIA) | Resuelto. |
| TRZ-003 (MEDIA) | Resuelto: CA10. |
| TRZ-004 (MEDIA) | Resuelto: CA14 y CA15. |
| EARS-003 (MEDIA) | Resuelto: CA-A4 y CA-A4b. |
| VER-003 (MEDIA) | Resuelto: puerta 5 en `quality-gates.md` y `asdd-accesibilidad` en `CLAUDE.md`. |
| AMB-004 (MEDIA) | Resuelto. |
| TRZ-005 (BAJA) | Resuelto. |
| TRZ-006 (BAJA) | Resuelto. |
| AMB-005 (BAJA) | Resuelto. |
| AMB-006 (BAJA) | Resuelto. |

## Recomendación
La spec cumple la puerta de validación: no hay hallazgos BLOQUEANTES ni ALTOS,
y todos los requisitos DEBE tienen al menos un criterio EARS con su tipo de
test. La persona puede aprobarla tal como está. Si quiere, antes puede
concretar la redacción de CA-A4c (AMB-010, BAJA) o dejarlo para la próxima
revisión.

La aprobación la da la persona: este informe no cambia el `estado` de la spec.

---

# Validación v1.2 (borrador, nivel L) — solo lo nuevo

- Fecha: 2026-11-08 · Resultado: BLOQUEADA · 0 BLOQUEANTES · 1 ALTO · 5 MEDIOS · 3 BAJOS
- La v1.2 es clara y cada DEBE (R11, R12) tiene criterio. R13 y CA16–CA23 se leen bien. Hay un defecto de dependencias (DRU-003) y una contradicción heredada (CON-005). Los criterios dinámicos con Puppeteer son aceptables por decisión de la persona.

## Hallazgos
### DRU-003 · ALTA · CA23, decisión 8, R13
- **Evidencia:** «librería `d11asdd_theme/navbar` con un único archivo `js/navbar.js` y las dependencias `core/drupal` y `core/once`» y «`bootstrap.Collapse.getOrCreateInstance(el).hide()`».
- **Problema:** el JS usa el global `bootstrap`, que viene de `bootstrap5/bootstrap5-js-latest` (`bootstrap.bundle.js`). CA23 fija las dependencias exactas y no la incluye, así que el test exigiría una librería sin garantía de orden de carga.
- **Corrección:** añadir `bootstrap5/bootstrap5-js-latest` a las dependencias de CA23 y de la librería.
- **Verificación:** comprobado (`bootstrap5.libraries.yml` l.107–110 y `bootstrap5.info.yml` l.13).

### CON-005 · MEDIA · R5 / decisión 2
- **Evidencia:** decisión 2 «Solo CSS en el tema, sin SCSS (R5)»; R5 v1.2 «CSS y JS sin compilar».
- **Problema:** la decisión 2 contradice R5 y R13 (JS propio); también el plan dice «ajustes mínimos (R5)» solo para CSS.
- **Corrección:** decisión 2: «Solo CSS y JS sin compilar, sin SCSS (R5)».
- **Verificación:** comprobado (lectura de la spec).

### EARS-005 · MEDIA · CA17
- **Evidencia:** «poner `aria-expanded="true"`, mostrar el elemento controlado y llevar el foco, con el siguiente Tab, al primer enlace del menú».
- **Problema:** mezcla tres comportamientos; «primer enlace del menú» es ambiguo (menú principal o cuenta). CA18 tiene el mismo patrón.
- **Corrección:** separar estado/visibilidad de orden de foco y nombrar el enlace: «primer enlace de `#block-d11asdd-theme-main-navigation`» (o el que siga al botón en el DOM).
- **Verificación:** deducido (`page.html.twig` l.68–80: el menú va tras el botón).

### AMB-011 · MEDIA · R12 / CA20
- **Evidencia:** R12 «dentro de una frase quedan exentos»; CA20 «que no esté dentro de un párrafo».
- **Problema:** dos reglas de exención distintas; el script no sabría cuál aplicar (p. ej. enlace «Powered by Drupal» en un `<span>` o `<div>`).
- **Corrección:** unificar, p. ej. «exentos los enlaces con texto circundante dentro de `<p>`»; listar en CA20 los enlaces de pie esperados.
- **Verificación:** deducido (texto de R12 y CA20).

### A11Y-008 · MEDIA · RA
- **Evidencia:** RA: «CSS propio, ajustes de R10, logo y colocación de bloques».
- **Problema:** v1.2 añade JS propio (`js/navbar.js`) y el alcance de RA no lo cubre; CA-A7 sí lo mide, pero RA debería decirlo.
- **Corrección:** añadir «JS propio (`js/navbar.js`)» a RA.
- **Verificación:** comprobado.

### TRZ-007 · MEDIA · CA23
- **Evidencia:** «y cargarla en las páginas que se renderizan con `d11asdd_theme`» (test solo Kernel, `ThemeTest::testNavbarLibrary`).
- **Problema:** un Kernel puede comprobar `info.yml`, no que la página sirva `js/navbar.js`; si falla la carga, CA21 solo lo detecta en `check.sh`.
- **Corrección:** dividir: CA23 (Kernel: definición) y añadir a CA16 o a `FrontendTest` que la portada incluye `themes/custom/d11asdd_theme/js/navbar.js`.
- **Verificación:** deducido.

## BAJOS (a `specs/pendientes.md`)
- CA22 usa «Si… entonces» (patrón de comportamiento no deseado) para un caso normal; mejor *Mientras*/*Cuando*.
- CA-A7 solapa con CA-A3 y CA20 (target-size); aclarar que CA-A7 solo añade el estado «menú abierto».
- La spec no cita ESLint sobre `js/navbar.js` (spec-002) en CA6 ni en las tareas; `scripts/check.sh` ya lo cubre.

## Recomendación
Corregir DRU-003 antes de aprobar; CON-005, EARS-005, AMB-011, A11Y-008 y TRZ-007 en la misma edición (son cambios de texto). No hace falta repetir la pasada. Sin conflicto real CA9/CA9b frente a CA23: CA9b limita solo `global-styling`.
