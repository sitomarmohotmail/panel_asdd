# Seguridad · spec 007 — SDC Cartoteca

- Fecha: 2026-11-21
- Versión de la spec: la vigente en `specs/007-sdc-cartoteca.md`
- Resultado: SUPERADA CON AVISOS (resolver DEP-001 y XSS-001 antes de `implementada`)
- Hallazgos: 0 BLOQUEANTES · 2 ALTOS · 1 MEDIO · 2 BAJOS

## Superficie revisada
`web/modules/custom/sdc_cartoteca` (bloque, `CartotecaSearchForm`, `CartotecaApiService`, JS del formulario, slider y mapa-info, Twig SDC), `config/sync/block.block.d11asdd_theme_cartotecaieca.yml` y `composer audit`.

## Hallazgos
### XSS-001 · ALTA · `components/cartoteca-image-slider/cartoteca-image-slider.js:78-82`
- **Evidencia:** `` ` data-sizes='${sizesJson}'${ariaAttr}>` `` con `JSON.stringify(sizes)` volcado vía `innerHTML` en un atributo entre comillas simples y sin `esc()`.
- **Riesgo:** `JSON.stringify` no escapa `'`. Una URL de imagen de la API con `'` cierra el atributo e inyecta atributos o eventos (`onmouseover=...`) en el DOM de cualquier visitante. Depende de que la API (o una MITM/compromiso) devuelva datos hostiles.
- **Corrección propuesta:** no serializar en el HTML: guardar `sizes` en un array JS indexado por slide, o construir el nodo con `createElement` + `dataset.sizes = JSON.stringify(sizes)` (el DOM escapa solo).

### DEP-001 · ALTA · `composer.lock` (drupal/core 11.4.12)
- **Evidencia:** `composer audit` → SA-CORE-2026-017 (RCE, altamente crítica) y SA-CORE-2026-018 (gadget chain); afectan a `>=11.4.0 <11.4.13`.
- **Riesgo:** afecta al proyecto, no al código de la spec.
- **Corrección propuesta:** `composer update drupal/core-* --with-all-dependencies` a ≥ 11.4.13 y repetir los tests.

### XSS-002 · MEDIA · `cartoteca-image-slider.js:83,94,98,124,163` (src/href) y `cartoteca-mapa-info.js`
- **Evidencia:** `esc()` solo codifica `& " < >`; las URL de imagen de la API van a `<img src>`, `<a href ... download>` y `<option value>` sin validar el esquema.
- **Riesgo:** una URL `javascript:` o `data:` de la API acabaría en el enlace «Descargar» (clic del usuario). El texto de campos sí está bien escapado por `esc()`.
- **Corrección propuesta:** aceptar solo URL `https:` (`new URL(u, location.origin).protocol`) y descartar el resto antes de renderizar. Escapar también `'` en `esc()`.

## Revisado sin hallazgos
- Control de acceso: el bloque no define rutas ni controladores propios; la visibilidad depende de la config del bloque (región `content`). No expone datos privados; la API es pública.
- CSRF: formulario Form API (`getForm`), sin acciones de estado; la búsqueda es JS `fetch` GET de solo lectura. Sin `buildForm` con submit servidor que cambie estado.
- Inyección en la URL: el servidor usa `GuzzleHttp` con `query` (codificada) y base constante; JS usa `encodeURIComponent` y base fija desde `drupalSettings` (solo URL pública de la API). `#maxlength` 15 en el campo.
- Secretos: ninguno en el módulo ni en `config/sync` (la única coincidencia, `system.mail.yml`, es `password: null`).
- Twig: sin `|raw`; sin `Markup::create`/`#markup`. SQL, subidas de archivos: no aplican.

## BAJOS
- BAJA: `API_BASE`/`API_BASE_URL` apunta al endpoint `mapa-apitest` (entorno de pruebas) y está duplicada en dos clases; mover a configuración y confirmar el endpoint de producción.
- BAJA: el `fetch` del navegador va directo al dominio externo; sin CSP no hay restricción `connect-src`/`img-src` (valorar cabecera CSP a nivel de proyecto).
