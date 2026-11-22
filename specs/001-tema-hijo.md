---
id: 001
titulo: Tema hijo de Bootstrap5
version: 1.4
estado: implementada
nivel: L
tipo: tema
proyecto: d11asdd_theme
---

# 001 · Tema hijo de Bootstrap5

## Historial
| Versión | Fecha | Estado | Cambios |
|---|---|---|---|
| 1.0 | 2026-11-08 | implementada (`84bb516`) | Versión inicial, criterios en Dado/Cuando/Entonces. |
| 1.1 | 2026-11-08 | implementada (aprobada por la persona tras validación SUPERADA CON AVISOS en la 3.ª pasada; QA, seguridad y accesibilidad superadas) | Migración a EARS y prioridades. Nuevos R10 (ajustes de Bootstrap5 propios del tema hijo) y RA (WCAG 2.2 AA). Criterios para todos los requisitos. Corregida tras `001-validacion.md` (pasadas 1 y 2: BLOQUEADA). Tras la primera puerta de accesibilidad (BLOQUEADA) se añaden, dentro de RA y con el visto bueno de la persona, CA-A1d, CA-A4d, CA-A4e y CA-A6. |
| 1.2 | 2026-11-08 | implementada (QA y accesibilidad superados; lista manual CA-A8 confirmada por la persona) | Responsive: menú plegable operable con teclado (R11), objetivos táctiles ≥ 24 × 24 px (R12) y cierre con Esc (R13). Comprobación dinámica con Puppeteer (`--menu` en `axe-check.mjs`), no con Selenium. R5 se reformula para admitir JS propio sin compilar. |
| 1.4 | 2026-11-21 | implementada (tests verdes, phpcs y trazabilidad OK) | Refactor de tests (sin cambios de comportamiento del tema): las 11 pruebas de portada de `FrontendTest` se consolidan en 4 métodos por afinidad (assets/branding, regiones/bloques, clases Bootstrap, accesibilidad) para compartir la instalación del sitio; la suite funcional del tema pasa de ~15 a 8 instalaciones conservando las 82 aserciones. Trazabilidad actualizada en `001-qa.md` y `001-accesibilidad.md`; corregida la referencia obsoleta `testAdminUsesClaro`→`testAdminUsesGin`. |

## Contexto
El sitio usa ahora Olivero como tema público. Queremos un tema propio que
herede de Bootstrap5 (contrib). Así podremos personalizar el aspecto y las
plantillas sin modificar el tema contribuido, que se actualiza con Composer. El
tema servirá también de base para mostrar los componentes SDC de los módulos
propios.

## Requisitos
- **R1** *(DEBE)* — Existe el tema `d11asdd_theme` en
  `web/themes/custom/d11asdd_theme`, con nombre visible "D11asdd" y
  `base theme: bootstrap5`.
- **R2** *(DEBE)* — El tema es compatible con Drupal `^11` y declara su
  dependencia del tema base para que Drupal lo exija al instalarlo.
- **R3** *(DEBE)* — Hereda las regiones de Bootstrap5 (header, nav_branding,
  nav_main, nav_additional, breadcrumb, content, sidebar_first,
  sidebar_second, footer) y las declara en su `.info.yml`.
- **R4** *(DEBE)* — Añade una librería propia `d11asdd_theme/global-styling`
  con `css/style.css`. Se carga en todas las páginas que se renderizan con
  `d11asdd_theme`, además de las librerías de Bootstrap5.
- **R5** *(DEBE)* — El tema usa CSS y JS sin compilar: sin SCSS ni
  dependencias de Node.js dentro de `web/themes/custom/d11asdd_theme`.
  *(v1.2: antes decía «solo CSS»; se amplía por R13.)*
- **R6** *(DEBE)* — Es el tema por defecto del sitio. Claro sigue siendo el
  tema de administración.
- **R7** *(DEBE)* — Los bloques del tema (`config/optional/block.block.d11asdd_theme_*.yml`)
  se colocan en las regiones de Bootstrap5, para que la portada muestre la
  marca del sitio, el menú principal, los mensajes y el contenido. Los bloques
  de Olivero y Bootstrap5 se mantienen; desinstalar esos temas queda fuera de
  alcance.
- **R8** *(DEBERÍA)* — Incluye `logo.svg` y `screenshot.png` propios,
  distintos de los de Bootstrap5, y el sitio usa ese logo.
- **R9** *(DEBE)* — La configuración resultante (tema activo, bloques y
  ajustes del tema) se exporta a `config/sync`.
- **R10** *(DEBE)* — El tema hijo tiene sus propios ajustes de Bootstrap5
  (`d11asdd_theme.settings`) con su esquema
  (`config/schema/d11asdd_theme.schema.yml`, tipo `theme_settings`). Motivo:
  Drupal no hereda los ajustes del tema base; sin ellos las plantillas de
  Bootstrap5 generan clases vacías (`navbar-`, `bg-`, `footer-`) y el contenido
  pierde el `container`. Los valores parten de los de Bootstrap5, con dos
  desviaciones deliberadas:

  | Clave | Valor | Bootstrap5 | Motivo de la desviación |
  |---|---|---|---|
  | `b5_body_schema` | `none` | `''` | Valor explícito de "no aplicar" |
  | `b5_body_bg_schema` | `none` | `''` | Con `''` la plantilla genera `bg-` vacía en `<body>` |
  | `b5_navbar_schema` | `dark` | `dark` | |
  | `b5_navbar_bg_schema` | `dark` | `dark` | |
  | `b5_footer_schema` | `dark` | `dark` | |
  | `b5_footer_bg_schema` | `dark` | `secondary` | `#f8f9fa` sobre `#6c757d` da 4,45:1 (< 4,5:1, falla AA); sobre `#212529` da 14,6:1 |
  | `b5_top_container` | `container` | `container` | |
  | `b5_top_container_config` | `''` | `''` | |
  | `b5_theme_mode` | `light` | `light` | |

  Los valores se pueden cambiar desde `/admin/appearance/settings/d11asdd_theme`
  (formulario heredado de Bootstrap5) y los cambios se aplican sin tocar código.

  El esquema declara, además de las claves de core (`theme_settings`) y las
  nueve `b5_*`, las tres claves `subtheme_folder`, `subtheme_name` y
  `subtheme_machine_name` (tipo `string`). Las añade al guardar el formulario
  el generador de subtemas de Bootstrap5 (`SettingsManager.php`), y core las
  guarda en `d11asdd_theme.settings` (`theme_settings_convert_to_config()`).
  No se incluyen en `config/install`.
- **R11** *(DEBE, v1.2)* — Por debajo del punto de ruptura de la barra
  (`navbar-expand-lg`, < 992 px), el menú plegable de Bootstrap5 se abre y se
  cierra con teclado (Intro y Espacio) desde su botón, y el botón informa de
  su estado con `aria-expanded` y del elemento que controla con
  `aria-controls`. Por encima del punto de ruptura, el menú se muestra
  desplegado y el botón no se ve.
- **R12** *(DEBE, v1.2)* — El botón del menú, los enlaces de la barra
  (marca, menú principal y menú de la cuenta) y los enlaces del pie tienen un
  objetivo de al menos 24 × 24 px CSS, o cumplen la excepción de espaciado de
  WCAG 2.5.8 (un círculo de 24 px de diámetro centrado en el objetivo no
  corta a ningún otro objetivo). Se aplica a 320 px y a 1280 px. Los enlaces
  dentro de una frase quedan exentos (excepción «en línea» de 2.5.8).
- **R13** *(DEBERÍA, v1.2 · incluido por decisión de la persona)* — Con el menú plegable
  abierto, la tecla Esc lo cierra y devuelve el foco a su botón. Bootstrap5
  no lo hace; requiere JS propio (`js/navbar.js`, `Drupal.behaviors` y
  `once()`) en una librería distinta de `global-styling`. WCAG 2.2 AA no lo
  exige para un menú que se abre con clic, pero es el comportamiento
  esperado (patrón *disclosure* de ARIA APG) y lo detectó la puerta de
  accesibilidad de la v1.1.
- **RA** *(DEBE)* — El sistema deberá cumplir WCAG 2.2 nivel AA en todo lo que
  añade o modifica esta spec: CSS propio, JS propio (`js/navbar.js`, v1.2),
  ajustes de R10, logo y colocación de bloques (ver `.claude/rules/accesibilidad.md`). Las violaciones que provienen
  de plantillas o CSS de core o Bootstrap5:
  - se corrigen en el tema hijo si incumplen AA y se pueden corregir con CSS
    o ajustes, **sin sobrescribir plantillas**;
  - si no, se registran como observación (OBS) en `001-accesibilidad.md`, no
    bloquean la spec y la persona decide si se comunican a los mantenedores o
    se abre una spec específica para sobrescribir la plantilla.

## Criterios de aceptación (EARS)
Los criterios de tipo *accesibilidad* y *manual* los verifica la puerta de
accesibilidad (`asdd-accesibilidad`, informe `001-accesibilidad.md`), no la de
QA.

### Tema y librerías
- **CA1** *(R1, R2 · Kernel)* — **Cuando** Drupal liste los temas
  disponibles, **el sistema deberá** incluir `d11asdd_theme` con nombre
  "D11asdd", `bootstrap5` como tema base y un `core_version_requirement` que
  incluya `^11`.
- **CA2** *(R2, R3 · Kernel)* — **Cuando** se instale `d11asdd_theme` en un
  sitio que no lo tiene, **el sistema deberá** instalar también `bootstrap5` y
  exponer en el tema hijo las nueve regiones de R3.
- **CA3** *(R4 · Kernel)* — **El sistema deberá** definir la librería
  `d11asdd_theme/global-styling` con el archivo `css/style.css`.
- **CA4** *(R4, R6 · Functional)* — **Mientras** `d11asdd_theme` sea el tema
  por defecto, **cuando** un visitante anónimo abra la portada, **el sistema
  deberá** responder 200, cargar `themes/contrib/bootstrap5/css/style.css` y
  `themes/custom/d11asdd_theme/css/style.css`, y mostrar el nombre del sitio.
- **CA9** *(R5 · Unit)* — **El sistema deberá** no contener en
  `web/themes/custom/d11asdd_theme` archivos `.scss` ni `.sass`, ni
  `package.json`, ni un directorio `node_modules`.
- **CA9b** *(R5 · Unit)* — **El sistema deberá** declarar en
  `d11asdd_theme.libraries.yml` solo archivos con extensión `.css` en la
  librería `global-styling`.

### Temas activos y configuración exportada
- **CA5a** *(R6 · Functional)* — **Cuando** un usuario autenticado con los
  permisos `access content overview` y `view the administration theme` abra
  `/admin/content`, **el sistema deberá** renderizar la página con Claro y no
  cargar `themes/custom/d11asdd_theme/css/style.css`.
- **CA5b** *(R6, R9 · Kernel)* — **El sistema deberá** tener en
  `config/sync/system.theme.yml` `default: d11asdd_theme` y `admin: claro`.
- **CA10** *(R9 · Kernel)* — **El sistema deberá** tener en `config/sync` un
  `block.block.d11asdd_theme_*.yml` por cada bloque de `config/optional` del
  tema cuyas dependencias de módulo estén activas en
  `config/sync/core.extension.yml`.

### Bloques
- **CA11** *(R7 · Kernel)* — **Cuando** se instale `d11asdd_theme`, **el
  sistema deberá** crear los bloques `d11asdd_theme_branding` en
  `nav_branding`, `d11asdd_theme_main_navigation` en `nav_main`,
  `d11asdd_theme_account_menu` en `nav_additional`,
  `d11asdd_theme_breadcrumbs` en `breadcrumb`, `d11asdd_theme_messages`,
  `d11asdd_theme_page_title`, `d11asdd_theme_local_tasks`,
  `d11asdd_theme_local_actions` y `d11asdd_theme_content` en `content`, y
  `d11asdd_theme_footer` y `d11asdd_theme_powered_by_drupal` en `footer`.
  `d11asdd_theme_help` (en `content`) y `d11asdd_theme_search_form` (en
  `nav_additional`) solo se crean si su módulo (Help y Search,
  respectivamente) está activo.
- **CA12** *(R7 · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** mostrar el bloque
  `#block-d11asdd-theme-branding` dentro de `<nav class="navbar">`, el menú
  principal `#block-d11asdd-theme-main-navigation` dentro de
  `<nav class="navbar">` y el bloque `#block-d11asdd-theme-content` dentro de
  `<main>`.
- **CA13** *(R7 · Functional)* — **Cuando** un visitante anónimo envíe en
  `/user/login` un usuario o una contraseña incorrectos, **el sistema
  deberá** mostrar el mensaje de error dentro de `<main>`, en el bloque
  `d11asdd_theme_messages`.

### Logo y captura
- **CA14** *(R8 · Kernel)* — **El sistema deberá** incluir en el tema
  `logo.svg` y `screenshot.png` con un contenido (hash) distinto del de los
  archivos homónimos de `web/themes/contrib/bootstrap5`.
- **CA15** *(R8 · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** mostrar como logo
  `/themes/custom/d11asdd_theme/logo.svg`.

### Ajustes de Bootstrap5 (R10)
- **CA7a** *(R10 · Functional)* — **Mientras** `d11asdd_theme.settings`
  tenga los valores de R10, **cuando** un visitante anónimo abra la portada,
  **el sistema deberá** generar `navbar-dark`, `text-light` y `bg-dark` en
  `<nav class="navbar">`; `footer-dark`, `text-light` y `bg-dark` en
  `<footer>`; la clase `container` en el `div` hijo directo de
  `<nav class="navbar">`, de `<main>` y de `<footer>`; y
  `data-bs-theme="light"` en `<html>`.
- **CA7b** *(R10 · Functional)* — **Mientras** `d11asdd_theme.settings`
  tenga los valores de R10, **cuando** un visitante anónimo abra la portada,
  **el sistema deberá** no generar ningún token de clase exactamente igual a
  `navbar-`, `footer-` o `bg-` en `<body>`, `<nav class="navbar">` ni
  `<footer>`.
- **CA7c** *(R9, R10 · Kernel)* — **El sistema deberá** incluir
  `d11asdd_theme.settings` en `config/install` del tema y en `config/sync`,
  ambos con los valores de R10 para las nueve claves `b5_*`.
- **CA7d** *(R10 · Kernel)* — **Cuando** se instale `d11asdd_theme` con la
  comprobación estricta de esquema activa, **el sistema deberá** validar
  `d11asdd_theme.settings` contra su esquema sin errores.
- **CA7e** *(R10 · Functional)* — **Cuando** un usuario autenticado con el
  permiso `administer themes` guarde sin cambios el formulario
  `/admin/appearance/settings/d11asdd_theme`, con la comprobación estricta de
  esquema activa, **el sistema deberá** guardar `d11asdd_theme.settings` sin
  errores de esquema, incluidas las claves `subtheme_*`.
- **CA8** *(R10 · Functional)* — **Mientras** `page_cache` y
  `dynamic_page_cache` estén activos y la portada esté en caché para el
  visitante anónimo, **cuando** un usuario autenticado con el permiso
  `administer themes` guarde en `/admin/appearance/settings/d11asdd_theme`
  `b5_body_bg_schema: light`, `b5_navbar_bg_schema: primary`,
  `b5_footer_bg_schema: secondary` y
  `b5_top_container: container-fluid m-0 p-0`, **el sistema deberá** mostrar
  al visitante anónimo, en la siguiente petición a la portada, `bg-light` en
  `<body>`, `bg-primary` en `<nav class="navbar">`, `bg-secondary` en
  `<footer>` y `container-fluid`
  en el `div` hijo directo de `<nav class="navbar">`, de `<main>` y de
  `<footer>`.

### Calidad
- **CA6** *(calidad)* — **Cuando** se ejecuten `vendor/bin/phpcs` y
  `vendor/bin/phpstan analyse web/themes/custom`, **el sistema deberá**
  informar 0 errores en el código del tema.

### Accesibilidad (RA)
- **CA-A1** *(RA · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** incluir en `<html>` un atributo `lang` igual
  al idioma por defecto del sitio.
- **CA-A1b** *(RA · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** incluir, como primer enlace de `<body>`, un
  enlace con `href="#main-content"`, y un elemento con `id="main-content"`
  dentro de `<main>`.
- **CA-A1c** *(RA · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** generar exactamente un elemento `<main>`.
- **CA-A1d** *(RA · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** generar exactamente un elemento `<h1>`.
- **CA-A2** *(RA, R8 · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** mostrar el logo dentro de un enlace a la
  portada (`rel="home"`) con atributo `alt` no vacío.
- **CA-A6** *(RA, R7 · Kernel)* — **El sistema deberá** declarar los bloques
  del tema con `langcode: es` y etiqueta en español, en `config/optional` y
  en `config/sync`, para que los nombres de las regiones de navegación
  («Navegación principal», «Menú de la cuenta de usuario») estén en el idioma
  de la página (WCAG 3.1.2).
- **CA-A3** *(RA · accesibilidad)* — **Mientras** `d11asdd_theme.settings`
  tenga los valores de R10, **cuando** se ejecuten como visitante anónimo
  `npm run a11y -- http://d11asdd.local/` y
  `npm run a11y -- --width 320 http://d11asdd.local/`, **el sistema deberá**
  informar 0 violaciones WCAG 2.2 A/AA, salvo las clasificadas como OBS
  según RA.
- **CA-A4** *(RA, R10 · accesibilidad)* — **Donde** `css/style.css` o los
  valores de R10 definan colores, **el sistema deberá** mantener un contraste
  de al menos 4,5:1 en texto normal y 3:1 en texto grande para cada par
  texto/fondo de la barra, el pie y el contenido, incluidos los enlaces.
- **CA-A4c** *(RA · accesibilidad)* — **Mientras** `d11asdd_theme.settings`
  tenga los valores de R10, **el sistema deberá** mostrar subrayados
  (`text-decoration: underline`) los enlaces de `<footer>`, aunque la regla
  `footer.footer-dark a` de Bootstrap5 quite el subrayado (WCAG 1.4.1).
- **CA-A4d** *(RA · Unit, accesibilidad)* — **Cuando** un enlace, botón o
  campo de formulario reciba el foco por teclado, **el sistema deberá**
  mostrar un contorno (`outline`) de al menos 2 px con contraste de al menos
  3:1 frente al fondo, también en la barra y el pie oscuros de R10 (WCAG
  2.4.7, 1.4.11). Bootstrap5 sustituye el contorno por un anillo de 1,29:1–1,75:1.
- **CA-A4e** *(RA · Unit, accesibilidad)* — **Donde** un mensaje de estado
  contenga enlaces, **el sistema deberá** mostrarlos con un contraste de al
  menos 4,5:1 frente al fondo del aviso (WCAG 1.4.3).
- **CA-A4b** *(RA · accesibilidad)* — **El sistema deberá** no contener en
  `css/style.css` `outline: none` ni `outline: 0` sin un indicador de foco
  alternativo con contraste de al menos 3:1.
- **CA-A5** *(RA · manual)* — **Cuando** la persona recorra la portada solo
  con teclado, **el sistema deberá** mostrar el foco visible en cada elemento
  interactivo, en un orden lógico y sin que quede tapado.

### Responsive (v1.2)
Los criterios *check.sh* los comprueba `scripts/a11y/axe-check.mjs --menu`
(Puppeteer), que `scripts/check.sh` ejecuta a 320 px y 1280 px sobre la
portada. No forman parte de PHPUnit.

- **CA16** *(R11 · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** generar dentro de `<nav class="navbar">` un
  `<button>` con la clase `navbar-toggler`, `type="button"`,
  `aria-expanded="false"` y un `aria-controls` igual al `id` de un elemento
  existente que contenga `#block-d11asdd-theme-main-navigation` y
  `#block-d11asdd-theme-account-menu`.
- **CA17** *(R11 · check.sh)* — **Mientras** el ancho de la ventana sea
  320 px y el menú esté cerrado, **cuando** el botón del menú tenga el foco y
  se pulse Intro, **el sistema deberá** poner `aria-expanded="true"` en el
  botón y mostrar el elemento controlado.
- **CA17b** *(R11 · check.sh)* — **Mientras** el ancho sea 320 px y el menú
  esté abierto, **cuando** el botón del menú tenga el foco y se pulse Tab,
  **el sistema deberá** poner el foco en el primer enlace de
  `#block-d11asdd-theme-main-navigation`.
- **CA18** *(R11 · check.sh)* — **Mientras** el ancho sea 320 px y el menú
  esté abierto, **cuando** el botón del menú tenga el foco y se pulse
  Espacio, **el sistema deberá** poner `aria-expanded="false"` y ocultar el
  elemento controlado.
- **CA18b** *(R11 · check.sh)* — **Mientras** el ancho sea 320 px y el menú
  esté cerrado, **cuando** el botón del menú tenga el foco y se pulse Tab,
  **el sistema deberá** poner el foco en un elemento que no esté dentro del
  elemento controlado.
- **CA19** *(R11 · check.sh)* — **Mientras** el ancho sea 1280 px, **el
  sistema deberá** no mostrar el botón del menú y mostrar visibles los enlaces
  del menú principal y del menú de la cuenta.
- **CA20** *(R12 · check.sh)* — **Cuando** se mida la portada a 320 px (con
  el menú abierto) y a 1280 px, **el sistema deberá** dar al botón del menú,
  a cada enlace de `<nav class="navbar">` y a cada enlace de `<footer>` que
  no esté dentro de una frase (exención «en línea» de R12; hoy, el enlace
  «Drupal» del bloque `d11asdd_theme_powered_by_drupal`) un área de al menos 24 × 24 px CSS, o una
  separación tal que un círculo de 24 px centrado en él no corte a otro
  objetivo.
- **CA21** *(R13 · check.sh)* — **Mientras** el ancho sea 320 px y el menú
  esté abierto, **cuando** el foco esté en el botón o en un enlace del menú y
  se pulse Esc, **el sistema deberá** cerrar el menú
  (`aria-expanded="false"`) y poner el foco en el botón del menú.
- **CA22** *(R13 · check.sh)* — **Si** se pulsa Esc con el menú cerrado o con
  el botón no visible (1280 px), **entonces el sistema deberá** dejar el foco
  donde estaba.
- **CA23** *(R13, R5 · Kernel)* — **El sistema deberá** definir la librería
  `d11asdd_theme/navbar` con un único archivo `js/navbar.js` y las
  dependencias `core/drupal`, `core/once` y `bootstrap5/bootstrap5-js-latest`
  (aporta el global `bootstrap` que usa la decisión 8), y declararla en
  `libraries` de `d11asdd_theme.info.yml`.
- **CA23b** *(R13 · Functional)* — **Cuando** un visitante anónimo abra la
  portada, **el sistema deberá** cargar
  `themes/custom/d11asdd_theme/js/navbar.js`.
- **CA-A7** *(RA · check.sh)* — **Cuando** se ejecute `scripts/check.sh`
  sobre la portada a 320 px con el menú abierto, **el sistema deberá** dar 0
  violaciones de axe (incluida `target-size`), sin scroll horizontal y con
  foco visible ≥ 3:1 en el botón y en los enlaces del menú.
- **CA-A8** *(RA · manual)* — **Cuando** la persona abra y cierre el menú a
  320 px con teclado y con Orca, **el sistema deberá** anunciar el botón como
  «contraído» o «expandido» según su estado y mantener el orden de foco
  botón → enlaces del menú → contenido.

## Fuera de alcance
- Compilación de SCSS y personalización de variables de Bootstrap (spec futura).
- Plantillas Twig propias y sobrescritura de plantillas de Bootstrap5,
  incluidas las de accesibilidad (ver RA), y componentes SDC (specs de
  módulos).
- Formulario de ajustes propio (`theme-settings.php`): se usa el heredado de
  Bootstrap5 (R10). Tipografías y colores propios fuera de las opciones de
  Bootstrap5.
- Restringir en el formulario las combinaciones de colores con poco contraste.
- Desinstalar Olivero o Bootstrap5 y borrar sus bloques.
- Despliegue en Docker.
- Accesibilidad de las páginas de administración (Claro, core).
- v1.2: tests FunctionalJavascript con Selenium (se usa Puppeteer, decisión 6).
- v1.2: traducir `aria-label="Toggle navigation"` del botón (OBS-01): exige
  sobrescribir `page.html.twig` de Bootstrap5.
- v1.2: devolver el foco al cerrar un aviso (OBS-10).
- v1.2: cerrar el menú al hacer clic fuera o al salir el foco con Tab.

## Decisiones
1. Nombre de máquina: `d11asdd_theme`.
2. Solo CSS y JS sin compilar en el tema, sin SCSS (R5). Node.js se usa únicamente como
   herramienta de desarrollo en la raíz del proyecto (`npm run a11y`, CA-A3),
   nunca dentro del tema.
3. El tema se escribe a mano, sin el generador de Bootstrap5. Por eso hay que
   añadir a mano los ajustes y el esquema que el generador copiaría (R10).
4. El contraste WCAG AA se garantiza para los valores de R10 (CA-A4); por eso
   el pie usa `bg-dark` y no `bg-secondary`. Si un administrador elige otra
   combinación en el formulario, es responsabilidad suya comprobarla con
   `npm run a11y`; el propio formulario de Bootstrap5 avisa del riesgo.
5. Los problemas de accesibilidad heredados de core o Bootstrap5 que solo se
   podrían corregir sobrescribiendo plantillas se registran como OBS (RA). Por
   ejemplo, `aria-label="Toggle navigation"` en inglés en `page.html.twig` de
   Bootstrap5.
6. *(v1.2)* El comportamiento dinámico del menú (CA17–CA22) se comprueba con
   Puppeteer, ampliando `scripts/a11y/axe-check.mjs` con la opción `--menu`,
   y no con tests FunctionalJavascript de PHPUnit. Es más barato porque
   Puppeteer ya está instalado; a cambio, esos criterios quedan fuera de
   PHPUnit y la trazabilidad los cita como `check.sh`. Selenium se valorará
   cuando haya JS propio con lógica de servidor.
7. *(v1.2)* El reflujo a 320 px ya lo cubre `check.sh` (CA-A3); no se añade
   nada. La regla `target-size` de axe (WCAG 2.5.8) ya se ejecuta, pero solo
   sobre lo visible: por eso CA20 mide también con el menú abierto.
8. *(v1.2)* El JS de R13 escucha `keydown` en el botón y en el elemento
   controlado y cierra el menú con la API de Bootstrap
   (`bootstrap.Collapse.getOrCreateInstance(el).hide()`), sin duplicar la
   lógica de apertura ni tocar `aria-expanded` a mano.

## Plan técnico
Archivos en `web/themes/custom/d11asdd_theme/`:

| Archivo | Para qué |
|---------|----------|
| `d11asdd_theme.info.yml` | Declara el tema: `base theme: bootstrap5`, `dependencies`, regiones (R1–R3) y librería (R4). |
| `d11asdd_theme.libraries.yml` | Librería `global-styling` con `css/style.css` (R4). |
| `css/style.css` | Estilos propios: ajustes mínimos (R5), subrayado de los enlaces del pie (CA-A4c), foco visible (CA-A4d) y enlaces de los mensajes (CA-A4e). |
| `config/optional/block.block.d11asdd_theme_*.yml` | Bloques del tema en las regiones de Bootstrap5, copiados de los de Bootstrap5, con etiqueta en español y `langcode: es` (CA-A6). Se crean solos al instalar el tema (R7). |
| `logo.svg`, `screenshot.png` | Identidad propia (R8). |
| `config/install/d11asdd_theme.settings.yml` | Ajustes de Bootstrap5 del tema hijo con los valores de R10. |
| `config/schema/d11asdd_theme.schema.yml` | Esquema `d11asdd_theme.settings` de tipo `theme_settings` con las nueve claves `b5_*` y las tres `subtheme_*` (R10). |
| `tests/src/Unit/ThemeFilesTest.php` | CA9, CA9b. |
| `tests/src/Unit/ThemeCssTest.php` | CA-A4d, CA-A4e (reglas de `css/style.css`). |
| `tests/src/Kernel/ThemeTest.php` | CA1, CA2, CA3, CA11, CA14, CA7d. |
| `tests/src/Kernel/ConfigSyncTest.php` | CA5b, CA10, CA7c, CA-A6. |
| `tests/src/Functional/FrontendTest.php` | CA4, CA5a, CA12, CA13, CA15, CA7a, CA7b, CA8, CA-A1, CA-A1b, CA-A1c, CA-A1d, CA-A2. |
| `tests/src/Functional/ThemeSettingsFormTest.php` | CA7e. |

Y en la raíz del proyecto: `config/sync/d11asdd_theme.settings.yml` (R9, R10).

v1.2 (propuesta, se concreta tras aprobar):

| Archivo | Para qué |
|---------|----------|
| `d11asdd_theme.libraries.yml` | Nueva librería `navbar` con `js/navbar.js` (CA23). |
| `d11asdd_theme.info.yml` | Añade `d11asdd_theme/navbar` a `libraries`. |
| `js/navbar.js` | Cierre con Esc y retorno del foco (R13). |
| `css/style.css` | Solo si la medición de CA20 falla: tamaño mínimo de los objetivos. |
| `tests/src/Kernel/ThemeTest.php` | CA23. |
| `tests/src/Functional/FrontendTest.php` | CA16. |
| `scripts/a11y/axe-check.mjs` | Opción `--menu`: CA17–CA22 y axe con el menú abierto (CA-A7). |
| `scripts/check.sh` | Añade `--menu` a las pasadas de 320 y 1280 px. |

Activación: `drush theme:install d11asdd_theme`, se define como tema por
defecto en `system.theme` y después `drush cex`. Para R10 en este sitio: crear
la configuración (`drush cim` parcial o `drush cset`) y `drush cex`.

## Tareas
### v1.0
- [x] Tests para CA1–CA3 (Kernel)
- [x] Tests para CA4–CA5 (Functional)
- [x] Implementación del tema
- [x] Activación, bloques y `drush cex`
- [x] `phpcs` limpio (CA6)

### v1.1
- [x] Validación (`asdd-validacion`) sin hallazgos BLOQUEANTES ni ALTOS
- [x] Aprobación de la persona
- [x] Puerta de deuda técnica: suites `custom-*` en verde
- [x] Ampliar tests de criterios ya implementados (CA1, CA5b, CA9–CA15, CA-A1–CA-A2)
- [x] Tests para CA7a–CA7e y CA8 (en rojo)
- [x] Subrayado de enlaces del pie en `css/style.css` (CA-A4c)
- [x] Esquema y ajustes `d11asdd_theme.settings` en `config/install` y `config/sync` (R10)
- [x] Correcciones en el tema hasta que pasen todos los tests
- [x] Correcciones de la puerta de accesibilidad (A11Y-001 a A11Y-007): tests en rojo y después CSS y etiquetas
- [x] QA (`asdd-qa`) superado
- [x] Seguridad (`asdd-seguridad`) superada
- [x] Accesibilidad (`asdd-accesibilidad`) superada y lista manual confirmada por la persona (CA-A3–CA-A5, 2026-11-08)

### v1.2
- [x] Decisión de la persona: R13 (Esc) incluido; OBS-01 fuera de alcance
- [x] Validación (`asdd-validacion`), una pasada: 1 ALTO y 5 MEDIOS corregidos en el texto
- [x] Aprobación de la persona
- [x] Suites `custom-*` en verde antes de empezar
- [x] Tests CA16, CA23, CA23b y opción `--menu` del script (rojo: N fallos)
- [x] Implementación (`js/navbar.js`, librería y, si hace falta, CSS)
- [x] `scripts/check.sh --spec specs/001-tema-hijo.md` en verde
- [x] Accesibilidad (`asdd-accesibilidad`) superada y lista manual CA-A8 confirmada por la persona (2026-11-08)

## Trazabilidad (requisito → criterio → test)
| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 | CA1 | `Kernel\ThemeTest::testThemeIsDiscovered` |
| R2 | CA1, CA2 | `Kernel\ThemeTest::testThemeIsDiscovered`, `Kernel\ThemeTest::testInstallRequiresBaseThemeAndHasRegions` |
| R3 | CA2 | `Kernel\ThemeTest::testInstallRequiresBaseThemeAndHasRegions` |
| R4 | CA3, CA4 | `Kernel\ThemeTest::testGlobalStylingLibrary`, `Functional\FrontendTest::testFrontPageAssetsAndBranding` |
| R5 | CA9, CA9b | `Unit\ThemeFilesTest::testNoScssOrNodeFiles`, `Unit\ThemeFilesTest::testGlobalStylingOnlyDeclaresCss` |
| R6 | CA4, CA5a, CA5b | `Functional\FrontendTest::testFrontPageAssetsAndBranding`, `Functional\FrontendTest::testAdminUsesGin`, `Kernel\ConfigSyncTest::testExportedThemeConfiguration` |
| R7 | CA11, CA12, CA13, CA-A6 | `Kernel\ThemeTest::testInstallPlacesBlocks`, `Functional\FrontendTest::testFrontPageRegionsAndBlocks`, `Functional\FrontendTest::testMessagesInMain`, `Kernel\ConfigSyncTest::testBlockLabelsInSpanish` |
| R8 | CA14, CA15, CA-A2 | `Kernel\ThemeTest::testOwnLogoAndScreenshot`, `Functional\FrontendTest::testFrontPageAssetsAndBranding` |
| R9 | CA5b, CA10, CA7c | `Kernel\ConfigSyncTest::testExportedThemeConfiguration`, `Kernel\ConfigSyncTest::testExportedBlocks`, `Kernel\ConfigSyncTest::testThemeSettingsExported` |
| R10 | CA7a | `Functional\FrontendTest::testFrontPageBootstrapClasses` |
| R10 | CA7b | `Functional\FrontendTest::testFrontPageBootstrapClasses` |
| R10 | CA7c | `Kernel\ConfigSyncTest::testThemeSettingsExported` |
| R10 | CA7d | `Kernel\ThemeTest::testThemeSettingsInstalledWithSchema` |
| R10 | CA7e | `Functional\ThemeSettingsFormTest::testSaveFormKeepsValidSchema` |
| R10 | CA8 | `Functional\FrontendTest::testSettingsChangeAppliesToCachedPage` |
| RA | CA-A1, CA-A1b, CA-A1c, CA-A1d | `Functional\FrontendTest::testFrontPageAccessibility` |
| RA | CA-A2 | `Functional\FrontendTest::testFrontPageAssetsAndBranding` |
| RA | CA-A4d, CA-A4e | `Unit\ThemeCssTest::testFocusIndicators`, `Unit\ThemeCssTest::testAlertLinks`, y medición en `001-accesibilidad.md` |
| RA | CA-A6 | `Kernel\ConfigSyncTest::testBlockLabelsInSpanish` |
| RA | CA-A3, CA-A4, CA-A4b, CA-A4c | `npm run a11y` y revisión estática (informe `001-accesibilidad.md`) |
| RA | CA-A5 | comprobación manual (informe `001-accesibilidad.md`) |
| R11 | CA16 | `Functional\FrontendTest::testFrontPageRegionsAndBlocks` |
| R11 | CA17, CA17b, CA18, CA18b, CA19 | `check.sh` (`axe-check.mjs --menu`) |
| R12 | CA20 | `check.sh` (`axe-check.mjs --menu`) |
| R13 | CA21, CA22 | `check.sh` (`axe-check.mjs --menu`) |
| R13, R5 | CA23 | `Kernel\ThemeTest::testNavbarLibrary` |
| R13 | CA23b | `Functional\FrontendTest::testFrontPageAssetsAndBranding` |
| RA | CA-A7 | `check.sh` (`axe-check.mjs --menu`) |
| RA | CA-A8 | comprobación manual |
| — | CA6 | `vendor/bin/phpcs`, `vendor/bin/phpstan` |

## Informes
- Validación: `specs/001-validacion.md`
- QA: `specs/001-qa.md`
- Seguridad: `specs/001-seguridad.md`
- Accesibilidad: `specs/001-accesibilidad.md`

## Notas de implementación
- El bloque de búsqueda (`search_form_block`) está en `config/optional` y solo
  se crea si se activa el módulo Search, que ahora no está activo.
- v1.1: la plantilla `status-messages.html.twig` de Bootstrap5 pinta cada
  mensaje como `div role="alert"` sin `data-drupal-messages`; el bloque de
  mensajes se identifica por `data-drupal-messages-fallback` (CA13).
- v1.1: en el sitio, `d11asdd_theme.settings` se creó con
  `drush config:import --partial --source=<ruta absoluta>/config/install` y
  `drush cex` (la ruta relativa falla porque Drush se ejecuta desde `web/`).
- v1.1: Bootstrap5 tiene más textos en inglés sin `|t` en plantillas
  heredadas: `aria-label="Toggle navigation"` (barra) y `aria-label="Close"`
  (mensajes). Candidatos a OBS según RA.
- v1.3: corregida la errata del **nombre máquina del tema**: el directorio y
  los ficheros estaban como `d11assd_theme` (doble «s») mientras que todo el
  contenido (config, `system.theme`, `core.extension`, namespaces de tests,
  specs) ya usaba `d11asdd_theme` (doble «d»). Esta divergencia dejaba
  `config:status` permanentemente sucio (activo `d11assd_theme` ≠ sync
  `d11asdd_theme`). Se renombraron directorio y ficheros a `d11asdd_theme` y se
  reconcilió el sitio con `drush cim` (bloques migrados como *rename*,
  conservando su colocación). No cambia el nombre de la BD local (`d11assd`),
  que es un recurso del sistema. Tras la corrección `config:status` queda en 0
  diferencias.
