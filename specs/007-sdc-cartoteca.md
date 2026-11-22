---
id: 007
titulo: Módulo sdc_cartoteca — bloque buscador de mapas con componentes SDC
version: 1.7
estado: implementada
nivel: L
tipo: modulo
proyecto: sdc_cartoteca
---

# 007 · Módulo sdc_cartoteca — bloque buscador de mapas con componentes SDC

## Contexto

El proyecto necesita un módulo personalizado (`sdc_cartoteca`) que exponga un
bloque Drupal colocable en cualquier región. El bloque contiene un pequeño
formulario de búsqueda por número de control IECA; al enviarlo consulta la API
REST de la Cartoteca de la Junta de Andalucía y presenta los resultados en dos
componentes SDC del propio módulo: un slider de imágenes y una ficha de
metadatos del mapa.

La imagen por defecto (estado inicial, antes de cualquier búsqueda) es
`imagen-no-disponible.jpg`, descargada del tema Terra de la Cartoteca y
empaquetada en el módulo.

> **Nota de la v1.6 (remediación).** La validación del 2026-11-21 dejó la spec
> BLOQUEADA: los tests de interacción eran `markTestIncomplete` y no se
> ejecutaban, el parseo real vive en el JS de los componentes y el servicio PHP
> `CartotecaApiService` era código muerto con cobertura falsa. Esta versión
> reescribe la trazabilidad con tipos de test **ejecutables** (ver leyenda),
> elimina el servicio muerto, declara `inline_form_errors` para el error del
> campo y separa el markup verificable de la interacción viva (verificación
> manual, al no haber WebDriver en el entorno).

## Leyenda de tipos de test

| Tipo | Herramienta | Qué verifica |
|---|---|---|
| **Unit** | PHPUnit `custom-unit` | Lógica PHP aislada. |
| **Kernel** | PHPUnit `custom-kernel` | Estructura estática del Twig/form/SDC, config. |
| **Functional** | PHPUnit `custom-functional` (sin JS) | HTML renderizado, envío de formulario, IFE. |
| **JS-unit** | `node --test` (`npm run test:js`) | Lógica y markup generado por el JS de los componentes (`*.logic.js`). |
| **check.sh** | axe + reflujo + foco | Accesibilidad automática y reflujo a 1280/320 px. |
| **Manual** | Persona (lista del agente) | Interacción viva que requiere WebDriver (teclado, AJAX sin recarga, lector de pantalla). |

## Requisitos

- **R1** *(DEBE)* — El módulo deberá proporcionar un bloque Drupal
  (`plugin_id: sdc_cartoteca`) colocable en cualquier región.
- **R2** *(DEBE)* — El bloque deberá incluir un campo de texto obligatorio de
  máximo 15 caracteres y un botón "Buscar". Si se envía vacío, el sistema deberá
  mostrar el error de validación **inline**, directamente debajo del campo y
  asociado a él, sin notificación en la barra superior de mensajes. El error lo
  gestiona la **Form API de Drupal con el módulo core `inline_form_errors`**
  (dependencia declarada en `info.yml`), que es el **único mecanismo** de
  validación. Con JavaScript, el envío con valor se intercepta en cliente (sin
  recarga); el envío vacío se delega a la validación de servidor, que muestra el
  error inline (mejora progresiva).
- **R3** *(DEBE)* — Al validar correctamente el formulario, el sistema deberá
  convertir el valor a mayúsculas, construir la URL
  `https://ws089.juntadeandalucia.es/institutodeestadisticaycartografia/cartoteca/api/v1/mapa-apitest?_format=json&numero_de_control={VALOR}`
  y pasarla a los componentes SDC mediante el evento personalizado
  `cartoteca:load`. La consulta a la API la realiza el JS de cada componente
  con `fetch`; la URL base se expone al cliente vía
  `drupalSettings.sdc_cartoteca.apiBase`.
- **R4** *(DEBE)* — El módulo deberá proporcionar el componente SDC
  `sdc_cartoteca:cartoteca-image-slider` que muestre: todas las imágenes
  disponibles en la suma de `field_imagen_destacada_media` (un único elemento
  con variantes de tamaño), `field_imagenes_media` (multielemento, cada uno
  con variantes de tamaño) y `field_imagenes_b_n` (multielemento B/N, ídem),
  con slider de flechas y miniaturas cuando haya más de una imagen,
  selector de resolución de descarga (original, grande, mediana, pequeña) y
  botón "Descargar imagen".
- **R5** *(DEBE)* — El módulo deberá proporcionar el componente SDC
  `sdc_cartoteca:cartoteca-mapa-info` que muestre los campos de metadatos
  del mapa (ver lista en *Plan técnico*) como pares etiqueta–valor; los campos
  cuyo valor venga vacío, `null` o array vacío en el JSON no se renderizarán
  (ni etiqueta ni valor).
- **R6** *(DEBE)* — En la carga inicial del bloque, el componente de imágenes
  deberá mostrar `imagen-no-disponible.jpg` y el componente de datos deberá
  mostrar el mensaje "Esperando selección".
- **R7** *(DEBE)* — Tras recibir el evento `cartoteca:load`, cada componente
  SDC deberá hacer `fetch` de la URL, parsear la respuesta y actualizar su
  contenido sin recargar la página.
- **R8** *(DEBE)* — Si la API devuelve un array vacío `[]` (mapa no encontrado),
  el sistema deberá restaurar la imagen por defecto en el componente de imágenes
  y mostrar el mensaje "No se han encontrado datos para ese número de control
  o el mapa no existe" en el componente de datos. Si la API devuelve un código
  HTTP ≠ 200 o falla la red, el sistema deberá restaurar la imagen por defecto y
  mostrar el mensaje "El servicio de la Cartoteca no está disponible en este
  momento".
- **R9** *(DEBE)* — Los componentes deberán usar las clases de utilidad del
  tema hijo `d11asdd_theme` (Bootstrap 5) y ser responsivos a 320 px y 1280 px
  sin desbordamiento horizontal.
- **R10** *(DEBERÍA)* — El bloque debería incluir un botón "Limpiar" que
  restaure el estado inicial (imagen por defecto y "Esperando selección") sin
  recargar la página, despachando `cartoteca:load` con `url=''`.
- **RA** *(DEBE)* — El sistema deberá cumplir WCAG 2.2 nivel AA en todo lo que
  añade o modifica esta spec: semántica HTML correcta (encabezados `<h*>`,
  roles ARIA, `scope` en tablas, `aria-label`/`aria-labelledby`), contraste
  suficiente, foco visible, navegación por teclado y reflujo a 320 px. En el
  contenido dinámico (render por JS tras el `fetch`): anuncio de los cambios de
  estado (cargando / cargado / error) a lectores de pantalla, error del campo
  asociado al campo, texto alternativo en las diapositivas y estado activo
  comunicado en las miniaturas.

## Criterios de aceptación (EARS)

- **CA1** *(R1 · Kernel)* — **Cuando** el módulo `sdc_cartoteca` está
  habilitado, **el sistema deberá** registrar un bloque con `plugin_id`
  `sdc_cartoteca` visible en `/admin/structure/block`.
- **CA2** *(R2 · Kernel)* — **Cuando** el bloque está colocado y se
  renderiza, **el sistema deberá** construir un campo `textfield` con
  `#maxlength` 15, `#required`, con `#title` no vacío, y un botón de envío
  "Buscar".
- **CA2b** *(R2 · Functional)* — **Si** el formulario se envía con el campo
  vacío, **entonces el sistema deberá** mostrar el mensaje de error de
  validación de `inline_form_errors` directamente asociado al campo (inline,
  no en la barra superior de mensajes) y no construir ninguna llamada a la API.
- **CA3** *(R3 · JS-unit)* — **Cuando** se construye la URL con el valor
  `ieca1988118769` (minúsculas), **el sistema deberá** generar la URL con el
  número en mayúsculas (`IECA1988118769`), codificado y sobre `apiBase`.
- **CA3b** *(R3 · Kernel)* — **Cuando** la página carga, **el sistema
  deberá** incluir la URL base de la API en
  `drupalSettings.sdc_cartoteca.apiBase`, no en atributos de valor de campos de
  formulario ni en el HTML renderizado por PHP.
- **CA4** *(R4 · JS-unit)* — **Cuando** la API devuelve datos, **el sistema
  deberá** construir la lista de diapositivas concatenando: primero
  `field_imagen_destacada_media`, luego cada elemento de `field_imagenes_media`
  y finalmente cada elemento de `field_imagenes_b_n`.
- **CA4b** *(R4 · JS-unit)* — **Si** los tres campos de imagen vienen vacíos
  o ausentes en el JSON, **entonces el sistema deberá** mostrar
  `imagen-no-disponible.jpg` como única diapositiva, sin controles de slider.
- **CA5** *(R4 · JS-unit)* — **Cuando** la lista de diapositivas tiene más
  de una imagen, **el sistema deberá** generar controles de slider: flechas
  anterior/siguiente (`<button>` con `aria-label`) y miniaturas (lista de
  `<button>`).
- **CA5m** *(R4 · Manual)* — **Cuando** hay varias diapositivas, **el sistema
  deberá** permitir cambiar de imagen con las flechas y las miniaturas usando
  solo el teclado.
- **CA6** *(R4 · JS-unit)* — **Cuando** se genera el selector de resolución de
  una imagen, **el sistema deberá** incluir una `<option>` por cada clave de
  tamaño disponible en esa imagen y un enlace de descarga apuntando a la
  resolución seleccionada.
- **CA6m** *(R4 · Manual)* — **Cuando** el usuario cambia de diapositiva,
  **el sistema deberá** actualizar el selector de resolución y el enlace de
  descarga a los de la imagen activa.
- **CA7** *(R5 · JS-unit)* — **Cuando** la API devuelve datos, **el sistema
  deberá** producir solo los campos con valor no vacío; los campos vacíos,
  `null` o array vacío no generarán ningún par etiqueta–valor.
- **CA7b** *(R5 · JS-unit)* — **Cuando** se normaliza la respuesta JSON,
  **el sistema deberá** eliminar del resultado toda clave cuyo valor sea `null`,
  cadena vacía `""` o array vacío `[]`.
- **CA7c** *(R5 · JS-unit)* — **Cuando** `cartoteca-mapa-info` genera la tabla
  de metadatos, **el sistema deberá** usar `table` con la clase `table-striped`.
- **CA7d** *(R4 · Kernel)* — **Cuando** se renderiza `cartoteca-image-slider`
  (estado inicial), **el sistema deberá** mostrar el título "Imágenes del mapa"
  dentro de un `<h2>` presente en la plantilla (visible en todo momento).
- **CA8** *(R6 · Kernel)* — **Cuando** el bloque se renderiza sin haber
  realizado ninguna búsqueda, **el sistema deberá** mostrar
  `imagen-no-disponible.jpg` en el componente de imágenes y el texto
  "Esperando selección" en el componente de datos.
- **CA9** *(R7 · Manual)* — **Cuando** el formulario se valida correctamente,
  **el sistema deberá** disparar `cartoteca:load` en cada componente, que hace
  `fetch` y actualiza su contenido sin recargar la página.
- **CA10a** *(R8 · JS-unit)* — **Si** la API devuelve un array vacío `[]`,
  **entonces el sistema deberá** clasificar la respuesta como "mapa no
  encontrado", devolver la imagen por defecto y el mensaje "No se han encontrado
  datos para ese número de control o el mapa no existe".
- **CA10b** *(R8 · JS-unit)* — **Si** la API devuelve un código HTTP ≠ 200 o
  falla la red, **entonces el sistema deberá** devolver la imagen por defecto y
  el mensaje "El servicio de la Cartoteca no está disponible en este momento".
- **CA11** *(R9 · check.sh)* — **Cuando** el bloque se renderiza a 320 px de
  ancho, **el sistema deberá** no producir desbordamiento horizontal.
- **CA11b** *(R9 · Kernel)* — **Cuando** se renderiza el formulario, **el
  sistema deberá** envolver cada componente en una columna de rejilla Bootstrap
  del tema (`col-md-6`).
- **CA12** *(R10 · JS-unit)* — **Cuando** se pulsa "Limpiar", **el sistema
  deberá** despachar `cartoteca:load` con `url=''` (restauración del estado
  inicial), lo que se verifica sobre el constructor de HTML inicial.
- **CA12m** *(R10 · Manual)* — **Cuando** el usuario pulsa "Limpiar" tras una
  búsqueda, **el sistema deberá** volver al estado inicial sin recargar.
- **CA-A1** *(RA · check.sh)* — **Cuando** se ejecute `scripts/check.sh` sobre
  la página que contiene el bloque, **el sistema deberá** dar 0 problemas de
  axe, reflujo y foco a 1280 y 320 px.
- **CA-A2** *(RA · Kernel)* — **Cuando** los componentes se renderizan,
  **el sistema deberá** mostrar el título de cada componente dentro de un
  elemento `<h2>`: "Imágenes del mapa" en `cartoteca-image-slider` y "Datos del
  mapa" en `cartoteca-mapa-info`.
- **CA-A3** *(RA · JS-unit)* — **Cuando** `cartoteca-mapa-info` genera la tabla
  de metadatos, **el sistema deberá** incluir `aria-label="Datos del mapa"` en
  el elemento `<table>` y usar `<th scope="row">` para cada etiqueta de campo.
- **CA-A4** *(RA · JS-unit)* — **Cuando** cada componente genera una
  diapositiva, **el sistema deberá** incluir un `alt` descriptivo en la `<img>`;
  y cuando genera miniaturas, **deberá** marcar la activa con `aria-pressed`.
- **CA-A5** *(RA · Manual)* — **Cuando** cambia el estado del contenido
  dinámico (cargando / cargado / error), **el sistema deberá** anunciarlo a los
  lectores de pantalla (`Drupal.announce`).

## Fuera de alcance

- Almacenamiento local de resultados (caché de búsquedas anteriores).
- Pestañas Marc21 / ISBD / Legal del detalle.
- Formulario de solicitud de mapa.
- Georreferenciación o integración con mapas interactivos.
- Integración con el sistema de autenticación de Drupal.
- Tests Drupal FunctionalJavascript (WebDriver): no hay selenium en el entorno;
  la interacción viva se verifica de forma manual (criterios `· Manual`).

## Plan técnico

### Estructura de archivos

```
web/modules/custom/sdc_cartoteca/
  sdc_cartoteca.info.yml                     ← dependencias: block, inline_form_errors
  sdc_cartoteca.libraries.yml                ← JS de comportamiento como type: module
  src/
    Plugin/Block/CartotecaBlock.php          ← BlockBase + FormInterface
    Form/CartotecaSearchForm.php             ← Form API + inline_form_errors (mejora progresiva)
  components/
    cartoteca-image-slider/
      cartoteca-image-slider.component.yml
      cartoteca-image-slider.twig            ← estructura estática + <h2>
      cartoteca-image-slider.css
      cartoteca-image-slider.logic.js        ← lógica pura + builders (t inyectada)
      cartoteca-image-slider.js              ← behavior: importa logic, fetch, slider
    cartoteca-mapa-info/
      cartoteca-mapa-info.component.yml
      cartoteca-mapa-info.twig               ← estructura estática + <h2>
      cartoteca-mapa-info.css
      cartoteca-mapa-info.logic.js           ← lógica pura + builders (t inyectada)
      cartoteca-mapa-info.js                 ← behavior: importa logic, fetch
  js/
    cartoteca-search-form.logic.js           ← buildApiUrl (mayúsculas + encode)
    cartoteca-search-form.js                 ← behavior: mejora progresiva + URL
  images/
    imagen-no-disponible.jpg                 ← imagen por defecto (Terra / CC)
  templates/
    block--sdc-cartoteca.html.twig
  tests/src/
    Kernel/CartotecaBlockTest.php            ← bloque registrado
    Kernel/CartotecaFormTest.php             ← estructura del formulario + drupalSettings
    Kernel/CartotecaRenderTest.php           ← render de los SDC (h2, estado inicial)
    Functional/CartotecaFormErrorTest.php    ← IFE: error inline del campo vacío
  tests/js/
    search-form.test.mjs                     ← CA3
    image-slider.test.mjs                    ← CA4, CA4b, CA5, CA6, CA10a/b, CA-A4
    mapa-info.test.mjs                       ← CA7, CA7b, CA7c, CA-A3, CA10a/b
```

### Campos mapeados desde el JSON a `cartoteca-mapa-info`

| Etiqueta UI         | Campo JSON                                      |
|---------------------|-------------------------------------------------|
| Nº de control       | `field_001_numero_de_control`                   |
| Título              | `field_245_mencion_del_titulo.a` + `.b`         |
| Mención responsab.  | `field_245_mencion_del_titulo.c`                |
| Autor               | `field_autor`                                   |
| Período             | `field_906_fecha_completa.b` / `field_fecha_inicio`–`field_fecha_fin` |
| Siglo               | `field_siglo_de_inicio`–`field_siglo_de_fin`    |
| Lugar               | `field_lugar`                                   |
| Comunidad autónoma  | `field_comunidad_autonoma`                      |
| Provincia           | `field_provincia`                               |
| Municipio           | `field_municipio`                               |
| País                | `field_pais_web`                                |
| Escala              | `field_escala_numerica` / `field_255_datos_matematicos_cartograficos.a` |
| Descripción física  | `field_300_descripcion_fisica.a` + `.b` + `.c`  |
| Notas generales     | `field_500_notas_generales.a`                   |
| Idioma              | `field_idioma_web`                              |
| Categoría           | `field_categoria`                               |
| Fuente              | `field_fuente_de_adquisicion`                   |

### Imágenes en `cartoteca-image-slider`

Lista de diapositivas (en orden):
1. `field_imagen_destacada_media` — un único objeto con claves `original-view`, `big`, `medium`, `small`
2. Cada elemento de `field_imagenes_media` — mismo esquema de tamaños
3. Cada elemento de `field_imagenes_b_n` — mismo esquema de tamaños

- Imagen activa inicial: primera diapositiva
- Selector de resolución: claves `original-view`, `big`, `medium`, `small`
- Si hay más de una diapositiva → slider con `aria-roledescription="carousel"`,
  flechas con `aria-label` y miniaturas como lista de `<button>` con `aria-pressed`

### Validación del formulario y carga asíncrona

El error del campo obligatorio lo gestiona la **Form API de Drupal** con el
módulo core **`inline_form_errors`** como único mecanismo de validación: el
campo lleva `#required` y el formulario `novalidate` (para que el navegador no
bloquee el envío y la validación la haga el servidor). Un envío vacío renderiza
el error inline junto al campo (no en la barra de mensajes), ya sea sin JS
(envío normal) o porque el JS, al detectar el campo vacío, deja que el
formulario se envíe (CA2b, mejora progresiva). Con JS y valor presente, el
envío se intercepta en cliente y dispara `cartoteca:load` con la URL construida
(`buildApiUrl`: mayúsculas + `encodeURIComponent` sobre
`drupalSettings.sdc_cartoteca.apiBase`), sin recarga.

El parseo del JSON (imágenes y metadatos) y la construcción del HTML residen en
el JS de cada componente, separados en un módulo `*.logic.js` (funciones puras y
builders que reciben la función de traducción `t`), importado por el `*.js` de
comportamiento. Esto permite probar la lógica y el markup con `node --test`
(`npm run test:js`) sin WebDriver.

Cada componente escucha su propio `cartoteca:load`, muestra un spinner, hace
`fetch(url)`, parsea el JSON y vuelca el HTML. El botón "Limpiar" despacha
`cartoteca:load` con `url=''`, restaurando el estado inicial sin recarga.

El servicio `CartotecaApiService.php` se **elimina**: era código muerto (el
formulario no lo usaba) y su cobertura se traslada a los tests JS-unit.

## Tareas

- [x] Imagen por defecto descargada en `images/`
- [x] `CartotecaBlock` (bloque + wrappers)
- [x] SDC `cartoteca-image-slider` (Twig + CSS + JS; loader fetch)
- [x] SDC `cartoteca-mapa-info` (Twig + CSS + JS; loader fetch)
- [x] Eliminar `CartotecaApiService`, su `services.yml` y su test Unit
- [x] `inline_form_errors`: dependencia + validación de servidor con error inline (mejora progresiva)
- [x] Separar `*.logic.js` (funciones puras publicadas en `Drupal.sdcCartoteca.*`)
- [x] Tests JS-unit (`node --test`) + `npm run test:js` + paso en `check.sh`
- [x] Test Functional del error inline (CA2b)
- [x] `scripts/check.sh --spec specs/007-sdc-cartoteca.md http://d11asdd.local/node/1` en verde

## Trazabilidad

| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 | CA1 | `Kernel\CartotecaBlockTest::testBlockExists` |
| R2 | CA2 | `Kernel\CartotecaFormTest::testFieldMaxlengthRequiredAndButton` |
| R2 | CA2b | `Functional\CartotecaFormErrorTest::testEmptyFieldInlineError` (+ servidor: `Kernel\CartotecaFormTest::testRequiredValidationError`) |
| R3 | CA3 | JS-unit `search-form.test.mjs` (`buildApiUrl`) |
| R3 | CA3b | `Kernel\CartotecaFormTest::testApiUrlInDrupalSettings` |
| R4 | CA4 | JS-unit `image-slider.test.mjs` (`normalizeImages` orden) |
| R4 | CA4b | JS-unit `image-slider.test.mjs` (`normalizeImages` por defecto) |
| R4 | CA5 | JS-unit `image-slider.test.mjs` (`buildArrows`/`buildThumbnails`) |
| R4 | CA5m | Manual (teclado) |
| R4 | CA6 | JS-unit `image-slider.test.mjs` (`buildControls`) |
| R4 | CA6m | Manual (cambio de diapositiva en vivo) |
| R4 | CA7d | `Kernel\CartotecaRenderTest::testSliderInitialState` |
| R4 | CA-A4 | JS-unit `image-slider.test.mjs` (`alt`, `aria-pressed`) |
| R5 | CA7 | JS-unit `mapa-info.test.mjs` (`normalizeFields`) |
| R5 | CA7b | JS-unit `mapa-info.test.mjs` (`detectAndExtract` strip) |
| R5 | CA7c | JS-unit `mapa-info.test.mjs` (`buildFieldsHTML` `table-striped`) |
| R5 | CA-A3 | JS-unit `mapa-info.test.mjs` (`aria-label` + `th scope="row"`) |
| R6 | CA8 | `Kernel\CartotecaRenderTest::testSliderInitialState`, `::testInfoInitialState` |
| R7 | CA9 | Manual (AJAX sin recarga) |
| R8 | CA10a | JS-unit (`classifySliderResponse`/`classifyInfoResponse` array vacío) |
| R8 | CA10b | JS-unit (`classifySliderResponse`/`classifyInfoResponse` error HTTP/red) |
| R9 | CA11 | `check.sh` (axe/reflujo 320 px) |
| R9 | CA11b | `Kernel\CartotecaFormTest::testResultsUseBootstrapColumns` |
| R10 | CA12 | JS-unit `image-slider.test.mjs` (`buildInitialHTML`) + `mapa-info.test.mjs` (`buildMessageHTML`) |
| R10 | CA12m | Manual |
| RA | CA-A1 | `check.sh` (axe + reflujo + foco) |
| RA | CA-A2 | `Kernel\CartotecaRenderTest::testSliderInitialState`, `::testInfoInitialState` |
| RA | CA-A3 | JS-unit `mapa-info.test.mjs` |
| RA | CA-A4 | JS-unit `image-slider.test.mjs` |
| RA | CA-A5 | Manual (lector de pantalla) |

## Puertas

- Validación: 2026-11-21 · 1ª pasada BLOQUEADA (TRZ-001 + conflictos) → remediada
  en v1.6 · 2ª pasada **SUPERADA CON AVISOS** (0 BLOQUEANTES · 0 ALTOS · 1 MEDIO
  TRZ-004 corregido · 3 BAJOS → `pendientes.md`). Informe en `007-validacion.md`.
- QA: 2026-11-21 · **SUPERADA** (`007-qa.md`). `scripts/check.sh` 14/14 en verde
  (incluido `js-unit` y axe a 1280/320 px) + 19 tests `node --test`.
- Seguridad: `007-seguridad.md`. La remediación reduce superficie (se elimina el
  servicio) y no añade rutas ni permisos; sin cambios que reabran la puerta.
- Accesibilidad: `007-accesibilidad.md` **re-pasado sobre v1.6** (2026-11-21):
  **SUPERADA CON AVISOS** — axe 0 violaciones a 1280 y 320 px; los 5 hallazgos de
  la v1.5 quedan resueltos. El MEDIO A11Y-001 (los tests JS no asertaban el
  `role="region"`/`tabindex` de la tabla ni el `role="group"` de las diapositivas)
  se corrige en **v1.7**: asserts añadidos en `mapa-info.test.mjs` y
  `image-slider.test.mjs`. 4 BAJOS → `pendientes.md`. Lista manual **confirmada
  por la persona** (2026-11-21).
