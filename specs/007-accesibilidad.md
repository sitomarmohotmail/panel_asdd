# Accesibilidad · spec 007 — Módulo sdc_cartoteca

- Fecha: 2026-11-21
- Versión de la spec: 1.6 (estado `implementada`; revisión retrospectiva, sustituye al informe de la v1.5)
- Norma: WCAG 2.2 AA
- Resultado: SUPERADA CON AVISOS (lista manual confirmada por la persona, 2026-11-21)
- Hallazgos: 0 ALTOS · 1 MEDIO · 4 BAJOS · 0 OBS

## Alcance
`http://d11asdd.local/node/1` (bloque colocado) y los archivos `components/*/*.{twig,css,js,logic.js}` del módulo. El HTML dinámico (tras fetch) se ha revisado de forma estática en `*.logic.js`, porque no hay WebDriver.

## Revisión automática (axe-core)
| URL | Violaciones | Criterios WCAG |
|---|---|---|
| /node/1 a 1280 px | 0 (27 reglas superadas); sin scroll horizontal; foco: 9 elementos, 0 insuficientes | — |
| /node/1 a 320 px | 0 (26 reglas superadas); sin scroll horizontal; foco: 8 elementos, 0 insuficientes | — |

## Estado de los hallazgos de la v1.5
- A11Y-001 (revisión automática no ejecutada): **resuelto**. El bloque se renderiza y axe se ejecuta con acceptInsecureCerts.
- A11Y-002 (4.1.3): **resuelto**. `Drupal.announce()` en ambos loaders para cargando, cargado, vacío y error. El slider ahora también anuncia el error.
- A11Y-003 (carrusel): **resuelto en lo esencial**. Con más de una imagen, `buildLoadedHTML` añade `role="group" aria-roledescription="Carrusel" aria-label="Imágenes del mapa"`. Cada diapositiva lleva `role="group" aria-roledescription="Diapositiva" aria-label="N de M"`. Las diapositivas ocultas llevan `aria-hidden`. Ver A11Y-B2.
- A11Y-004 (2.1.1): **resuelto**. `buildFieldsHTML` envuelve la tabla en `div tabindex="0" role="region" aria-label="Datos del mapa"`. El CSS da `overflow-y:auto` a ese contenedor y le pone `:focus-visible` con un contorno de 3 px.
- A11Y-005 (1.4.3): **resuelto**. `th` usa `var(--bs-secondary-color,#495057)`, que supera 7:1 sobre blanco. El fallback es #495057; en el tema real `--bs-secondary-color` es rgba(33,37,41,.75), que compuesto sobre blanco da ≈ 6,3:1 y sobre la fila rayada ≈ 5,7:1. Cumple 4,5:1.
- A11Y-006 (tests): **parcial**. Hay tests Kernel de los `<h2>` y tests `node --test` de `aria-roledescription`, `aria-label` de la tabla, `aria-pressed` y `alt`. Ver A11Y-001.

## Hallazgos
### A11Y-001 · MEDIA · 4.1.2 / 2.1.1 · Estados dinámicos sin verificación en navegador
- **Evidencia:** axe solo cubre la carga inicial (imagen por defecto y "Esperando selección"). Los estados tras buscar (carrusel, tabla, mensajes de error o vacío) solo se han revisado leyendo el código. `tests/js/*.mjs` no comprueba `role="region"` ni `tabindex="0"` de la tabla, ni `role="group"` de las diapositivas.
- **Problema:** una regresión en el HTML generado por JS pasaría la puerta sin que nadie la detecte.
- **Corrección propuesta:** añadir a `mapa-info.test.mjs` un `assert.match(html, /tabindex="0"[^>]*role="region"/)` y a `image-slider.test.mjs` uno para `role="group"` en las diapositivas. La persona hace la lista manual con una búsqueda real.
- **Resuelto (v1.7):** asserts añadidos — `mapa-info.test.mjs` comprueba `tabindex="0"` y `role="region"` de la tabla; `image-slider.test.mjs` comprueba `role="group" aria-roledescription="Diapositiva"` en las diapositivas. 19 tests `node --test` en verde.

## BAJOS (a `specs/pendientes.md`)
- A11Y-B1: la tabla repite `aria-label="Datos del mapa"` dentro de la región con el mismo nombre y bajo un `<h2>` idéntico. Es redundante: el lector lo dice tres veces. Usar `aria-labelledby` al h2 y quitar el `aria-label` de la tabla.
- A11Y-B2: el cambio de diapositiva con flechas o miniaturas no se anuncia (no hay `aria-live` ni `Drupal.announce` en `goToSlide`). Con la posición "N de M" en la diapositiva visible queda cubierto de forma aceptable, pero el anuncio es mejor práctica (WCAG 4.1.3 en sentido amplio).
- A11Y-B3: la miniatura activa y la miniatura con foco comparten el mismo estilo de contorno; distinguir el estado activo con borde o relleno (1.4.11).
- A11Y-B4: el enlace "Descargar" no tiene contexto (usar "Descargar imagen (resolución)"); en cross-origin `download` se ignora. Heredados de la v1.5: contraste del glifo de las flechas con `opacity:.85` (1.4.11) y el ejemplo repetido en la etiqueta y el placeholder del campo.

## Comprobación manual (para la persona)
- [x] Teclado en /node/1: Tab recorre campo → Buscar → Limpiar → flechas → miniaturas → selector → Descargar; Intro y Espacio activan; Mayús+Tab inverso; sin trampas.
- [x] Enviar el formulario vacío: el foco vuelve al campo y Orca lee el error.
- [x] Buscar `IECA1988118769`, un número inexistente y con la red cortada: Orca anuncia "Cargando…", después el resultado, "No se han encontrado…" o el error.
- [x] Con varias imágenes: Orca lee "Carrusel", y en cada diapositiva "Diapositiva, N de M". Cambiar con flechas y miniaturas: el foco no se pierde y las diapositivas ocultas no se leen.
- [x] Tabla: Tab llega a la región "Datos del mapa", con foco visible. Se desplaza con las flechas. Orca lee cabecera de fila y valor.
- [x] Foco visible (≥ 3:1) en todos los controles y sin quedar tapado.
- [x] Zoom al 200 % y 400 % y ancho 320 px (con resultados cargados): sin scroll horizontal ni recortes.
- [x] `prefers-reduced-motion: reduce`: sin transiciones.
- [x] El enlace de salto al contenido sigue funcionando con el bloque en la página.

> Lista manual **confirmada por la persona** el 2026-11-21.
