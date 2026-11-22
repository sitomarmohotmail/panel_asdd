# Accesibilidad · spec 001 — Tema hijo de Bootstrap5

- Fecha: 2026-11-08 (tercera pasada)
- Versión de la spec: 1.1 (estado `en-curso`; las correcciones de las pasadas 1 y 2 están aplicadas en el sitio y aún no tienen commit)
- Norma: WCAG 2.2 AA
- Resultado: **PENDIENTE DE REVISIÓN MANUAL**
- Hallazgos: 0 ALTOS · 0 MEDIOS · 0 BAJOS · 10 OBS

> No es una revisión retrospectiva: la spec está en curso (v1.1). En esta
> pasada se comprueban las correcciones de A11Y-006 y A11Y-007 (y de QA-008,
> que también toca el foco). Se repiten todas las mediciones y se buscan
> problemas nuevos. No quedan hallazgos en código propio. Solo falta que la
> persona haga la lista manual de CA-A5.

## Historial de pasadas
| Pasada | Fecha | Resultado | Hallazgos |
|---|---|---|---|
| 1 | 2026-11-08 | BLOQUEADA | 3 ALTOS (A11Y-001, A11Y-002, A11Y-003) · 1 MEDIO (A11Y-004) · 1 BAJO (A11Y-005) · 9 OBS |
| 2 | 2026-11-08 | BLOQUEADA | 1 ALTO (A11Y-006) · 1 BAJO (A11Y-007) · 10 OBS. A11Y-001 a A11Y-005 corregidos |
| 3 | 2026-11-08 | PENDIENTE DE REVISIÓN MANUAL | 0 ALTOS · 0 MEDIOS · 0 BAJOS · 10 OBS. A11Y-006 y A11Y-007 corregidos |

### Estado de todos los hallazgos
| Hallazgo | Sev. | Criterio WCAG | Corrección aplicada | Comprobación en la 3.ª pasada | Estado |
|---|---|---|---|---|---|
| A11Y-001 · Regiones de navegación con nombre en inglés | ALTA | 3.1.2 Idioma de las partes | `langcode: es` y etiquetas en español en los bloques de `config/optional` y `config/sync` (CA-A6) | Sin cambios desde la 2.ª pasada: `nav` «Navegación principal» y «Menú de la cuenta de usuario» | **Corregido** (pasada 2) |
| A11Y-002 · Foco casi invisible en la barra oscura | ALTA | 2.4.7 · 1.4.11 | Contorno `currentColor` en la barra y el pie (CA-A4d) | Medido otra vez a 1280 y 320 px: de 5,66:1 a 15,43:1 frente a `#212529`, sin anillo de Bootstrap | **Corregido** (pasada 2) |
| A11Y-003 · Enlace del mensaje de error a 3,37:1 | ALTA | 1.4.3 Contraste (mínimo) | `.alert a:not(.btn) { color: inherit; font-weight: 700 }` (CA-A4e) | axe tras login fallido, a 1280 y 320 px: 0 violaciones. 10,22:1 | **Corregido** (pasada 2) |
| A11Y-004 · Foco de poco contraste en campos, botones y pestañas | MEDIA | 1.4.11 | Contorno de 2 px `#0a58ca` | De 4,82:1 a 6,44:1 en todos los elementos medidos | **Corregido** (pasada 2) |
| A11Y-005 · Tests más débiles que CA-A1 y CA-A2 | BAJA | 3.1.1 · 2.4.4 | Tests reforzados | Sin cambios | **Corregido** (pasada 2) |
| A11Y-006 · Botón de cerrar de los mensajes sin contorno (1,36:1) | ALTA | 1.4.11 · 2.4.7 | `.btn-close:focus-visible` y `.form-check-input:focus-visible` añadidos a la regla general (`style.css:42-43`) | Login fallido, Mayús+Tab hasta la X, a 1280 y a 320 px: `outline: 2px solid #0a58ca`, `outline-offset: 2px`, **4,82:1** sobre `#f8d7da` (antes 1,36:1). Con clic de ratón no aparece el contorno (`:focus-visible` = false). Ningún antecesor lo recorta. Sobre los otros fondos de aviso: 4,96:1 (estado `#d1e7dd`), 5,81:1 (advertencia `#fff3cd`), 5,52:1 (info `#cff4fc`). Casilla `.form-check-input` insertada en el DOM para probar: contorno de 2 px `#0a58ca`, 6,44:1 | **Corregido** |
| A11Y-007 · Contorno del logo a 3,43:1 (`#0d6efd` heredado) | BAJA | 1.4.11 (margen) | `.navbar .navbar-brand a.site-logo { color: inherit; }` (`style.css:68-70`) | El logo toma `#fff` en reposo y con foco: contorno de 2 px `#fff`, **15,43:1** sobre `#212529` a 1280 y a 320 px (antes 3,43:1). Con otros fondos de barra (cambiados solo en el DOM del navegador): `bg-primary` 4,50:1, `bg-secondary` 4,69:1 y `bg-light` + `navbar-light` 19,92:1 (antes, con `bg-primary`, 1:1). El logo es una imagen, así que el cambio de `color` no se ve; solo afecta al contorno | **Corregido** |
| QA-008 (de QA, afecta a CA-A4d) · `footer .nav-link` vencía a `footer a:focus-visible` | — | 2.4.7 | `footer .nav-link:focus-visible` añadido a la regla de `currentColor` (`style.css:57`) | Hoy el pie no tiene enlaces `.nav-link` (solo «Drupal», que es un `a` y da 14,63:1). La regla está y el test la cubre | Correcto |

## Alcance
**URL revisadas** (visitante anónimo, `d11asdd_theme.settings` con los valores de R10). `style.css?to728f` cargado, con las reglas nuevas:
- `http://d11asdd.local/`, a 1280 px y a 320 px (también con el menú desplegado).
- `http://d11asdd.local/user/login`, a 1280 px y a 320 px.
- `http://d11asdd.local/user/login` después de un login fallido (`nadie` / `incorrecta`, enviado con Intro), a 1280 px y a 320 px.
- Pruebas extra con Puppeteer (scripts temporales en el scratchpad): recorrido con Tab y Mayús+Tab midiendo el estilo de foco, recorte del contorno por antecesores con `overflow`, clic de ratón en el botón de cerrar, cierre del aviso con Intro, fondos de barra alternativos (solo en el DOM), casilla `.form-check-input` insertada en el DOM, reflujo a 640 y 320 px y `forced-colors: active`.

**Archivos analizados**
- `web/themes/custom/d11asdd_theme/css/style.css` (versión actual, 80 líneas).
- `web/themes/custom/d11asdd_theme/tests/src/Unit/ThemeCssTest.php` (ejecutado: OK, 2 tests, 19 aserciones).
- `specs/001-tema-hijo.md` (CA-A4d, CA-A4e, *Archivos afectados* y trazabilidad).
- Heredados: `web/themes/contrib/bootstrap5/css/style.css` (`.btn-close:focus`, `.form-check-input:focus`, `.nav-link:focus-visible`).

**Búsquedas estáticas** (`outline: none|0`, `tabindex` > 0, `<img` en Twig, `innerHTML` / `.focus()` en JS) en `web/themes/custom` y `web/modules/custom`. Única coincidencia: un comentario de `ThemeCssTest.php:73` que cita la regla de Bootstrap5. No es CSS. El tema sigue sin Twig ni JS propios. CA-A4b se cumple.

## Revisión automática (axe-core)
Comandos: `npm run --silent a11y -- --json specs/001-axe.json http://d11asdd.local/ http://d11asdd.local/user/login`, lo mismo con `--width 320`, y Puppeteer con axe (etiquetas WCAG 2.0/2.1/2.2 A y AA) en la página del login fallido. Los JSON temporales ya están borrados.

| URL | Ancho | HTTP | Violaciones | A revisar | Reglas superadas | Criterios WCAG |
|---|---|---|---|---|---|---|
| `/` | 1280 | 200 | 0 | 0 | 23 | — |
| `/` | 320 | 200 | 0 | 0 | 22 | — |
| `/user/login` | 1280 | 200 | 0 | 0 | 27 | — |
| `/user/login` | 320 | 200 | 0 | 0 | 28 | — |
| `/user/login` tras login fallido | 1280 | 200 | 0 | 0 | 28 | — |
| `/user/login` tras login fallido | 320 | 200 | 0 | 0 | 28 | — |

**CA-A3 se cumple.** axe no evalúa los estilos de foco: se han medido aparte (tabla siguiente).

### Contraste medido (CA-A4, CA-A4d, CA-A4e)
**Texto (1.4.3)**: sin cambios desde la 2.ª pasada. El único par sin margen sigue siendo `#0d6efd` / `#fff` (4,50:1, enlaces subrayados del contenido, color de Bootstrap5 que da justo el umbral). Todos los demás superan 4,5:1: barra y pie de 5,66:1 a 15,43:1, botón «Iniciar sesión» 4,69:1, texto y enlace del aviso 10,22:1.

**Indicadores de foco (2.4.7, 1.4.11, CA-A4d)**: contorno frente al fondo que lo rodea, medido en esta pasada.

| Elemento | Página | Ancho | Indicador | Relación | Resultado |
|---|---|---|---|---|---|
| Enlace de salto | `/` | 1280 / 320 | 2 px `#0a58ca` | 6,44:1 | Cumple |
| **Logo (`a.site-logo`)** | `/` | 1280 / 320 | **2 px `#fff`** | **15,43:1** (antes 3,43:1) | **Cumple** (A11Y-007 corregido) |
| «D11 ASDD» | `/` | 1280 / 320 | 2 px `#f8f9fa` | 14,63:1 | Cumple |
| «Inicio» (barra, activo) | `/` | 1280 / 320 desplegado | 2 px `#fff` | 15,43:1 | Cumple |
| «Iniciar sesión» (barra) | `/` | 1280 / 320 desplegado | 2 px `rgba(255,255,255,.75)` | 9,25:1 | Cumple |
| Botón del menú | `/` | 320 | 2 px `rgba(255,255,255,.55)` | 5,66:1 | Cumple |
| «User Guide», RSS | `/` | 1280 / 320 | 2 px `#0a58ca` | 6,44:1 | Cumple |
| «Drupal» (pie) | `/` | 1280 / 320 | 2 px `#f8f9fa` | 14,63:1 | Cumple |
| Ruta de navegación «Inicio» | login fallido | 1280 / 320 | 2 px `#0a58ca` | 6,44:1 | Cumple |
| Pestañas | login fallido | 1280 / 320 | 2 px `#0a58ca` | 6,44:1 / 4,94:1 sobre `#dee2e6` | Cumple |
| «Toggle tabs as a menu» | login fallido | 320 | 2 px `#0a58ca` | 4,94:1 | Cumple |
| «¿Olvidaste tu contraseña?» | login fallido | 1280 / 320 | 2 px `#0a58ca` | 4,82:1 sobre `#f8d7da` | Cumple |
| **Botón de cerrar del aviso (`.btn-close`)** | login fallido | 1280 / 320 | **2 px `#0a58ca`**, separado 2 px (el anillo de Bootstrap queda debajo) | **4,82:1** (antes 1,36:1) | **Cumple** (A11Y-006 corregido) |
| `.form-check-input` (insertada en el DOM para probar) | `/user/login` | 1280 | 2 px `#0a58ca` | 6,44:1 | Cumple |

Evidencia del botón de cerrar (Mayús+Tab desde «Nombre de usuario»):
```
1280 px: BUTTON btn-close "Close" fv true outline solid 2px rgb(10, 88, 202) off 2px fondo rgb(248, 215, 218) = 4.82 | 48x56 clip null
 320 px: BUTTON btn-close "Close" fv true outline solid 2px rgb(10, 88, 202) off 2px fondo rgb(248, 215, 218) = 4.82 | 48x56 clip null
clic ratón: BUTTON btn-close "Close" fv false outline none 0px
forced-colors: BUTTON "Close" outline solid 2px (color del sistema)
```

### Otras comprobaciones automáticas
- Reflujo (1.4.10): no hay scroll horizontal en `/` ni en `/user/login` a 640 y 320 px, tampoco con el menú desplegado ni en el login fallido a 320 px. A 320 px el botón de cerrar (x 251–299) y su contorno caben en la ventana.
- Colores forzados: el contorno del botón de cerrar se mantiene (el anillo con `box-shadow` desaparece, como estaba previsto).
- Orden del foco: igual que en las pasadas anteriores. Portada: enlace de salto → logo → «D11 ASDD» → «Inicio» → «Iniciar sesión» → «User Guide» → RSS → «Drupal». Login fallido con Mayús+Tab: pestañas → botón de cerrar → enlace del aviso → ruta de navegación.
- Al cerrar el aviso con Intro el foco sigue pasando a `<body>` (OBS-10, sin cambios).
- **Problemas nuevos:** ninguno. `color: inherit` en el logo no cambia nada visible (el enlace solo contiene una imagen) y no afecta a «D11 ASDD», que es otro enlace (`a.site-title`).

## Hallazgos
No hay hallazgos abiertos en código propio. A11Y-001 a A11Y-007 están corregidos (ver *Estado de todos los hallazgos*).

## Observaciones (core/contrib)
Se mantienen las diez de las pasadas anteriores, comprobadas de nuevo en la tercera (sin cambios en core ni en Bootstrap5). Ninguna bloquea la spec (RA). La persona decide si se comunican a los mantenedores o si se abre una spec para sobrescribir plantillas.

- **OBS-01 · 4.1.2 / 3.1.2** · `bootstrap5/templates/layout/page.html.twig:70`: `aria-label="Toggle navigation"` en el botón del menú, en inglés y sin `|t`. Se ha vuelto a confirmar a 320 px.
- **OBS-02 · 4.1.2 / 3.1.2** · `bootstrap5/templates/misc/status-messages.html.twig:51`: `aria-label="Close"` en el botón de cerrar de cada mensaje, sin `|t`. Se ha vuelto a confirmar. Su foco era A11Y-006, ya corregido.
- **OBS-03 · 3.1.2** · `bootstrap5/templates/navigation/breadcrumb.html.twig:11`: `<nav aria-label="breadcrumb">` en inglés y sin `|t`; tiene prioridad sobre el `<h2>` «Ruta de navegación». El bloque ya se llama «Ruta de navegación» (A11Y-001), pero la plantilla no usa ese nombre.
- **OBS-04 · 3.1.2** · `bootstrap5/templates/navigation/menu-local-task.html.twig:27`: «Toggle tabs as a menu» (`|t` sin traducción española). Se ve a 320 px en `/user/login`. Se arregla con la traducción de la interfaz, fuera de esta spec.
- **OBS-05 · 2.4.4** · Vista `frontpage` y `feed-icon.html.twig` (core): el enlace RSS se llama «Suscribirse a », sin nada detrás. Icono de 16 × 16 px que cumple 2.5.8 por la excepción de espaciado.
- **OBS-06 · 3.1.2** · Vista `frontpage` (core): «Welcome!», el texto de bienvenida y «User Guide» en inglés. «User Guide» abre otra ventana (`target="_blank"`) sin avisar; es la técnica G201, que AA no exige.
- **OBS-07 · 3.3.1 / 3.2.1** · Formulario de login (core): `autofocus` en «Nombre de usuario». Tras el error, solo `#edit-name` lleva `aria-invalid="true"` y ningún campo lleva `aria-describedby` hacia el mensaje (confirmado de nuevo). 3.3.1 se cumple por el texto en `role="alert"`.
- **OBS-08 · 2.4.4** · Plantilla del bloque de marca (Bootstrap5): el logo (`alt="Inicio"`) y el nombre del sitio son dos enlaces seguidos a `/`.
- **OBS-09 · 1.3.1** · `menu-local-tasks` (core/Bootstrap5): `<nav aria-label="Pestañas">` dentro de `<nav aria-labelledby="primary-tabs-title">` («Solapas principales»), con `role="navigation"` redundante.
- **OBS-10 · 2.4.3 Orden del foco** *(2.ª pasada)* · Bootstrap5 (`alert.js`, `data-bs-dismiss="alert"`): al cerrar el aviso con Intro, el aviso se elimina del DOM y el foco pasa a `<body>`, así que el siguiente Tab empieza desde el principio de la página. AA no lo prohíbe expresamente, pero desorienta a quien usa teclado o lector de pantalla. Para corregirlo haría falta JS propio (devolver el foco a `#main-content` o al primer campo), que la spec deja fuera de alcance.

## Comprobación manual (para la persona)
Esta lista es la verificación de **CA-A5**. Hazla en Firefox o Chrome, sin sesión iniciada (ventana privada) y con los valores de R10. Puppeteer ya ha medido los colores; aquí confirmas lo que se percibe. Si algo falla, anótalo junto al punto y avisa para una 4.ª pasada.

**Teclado y foco**
- [ ] En `/`, pulsa Tab una vez: arriba aparece «Pasar al contenido principal» con un contorno azul visible que no tapa nada. Pulsa Intro: el foco salta al contenido y el siguiente Tab va a «User Guide», no a la barra.
- [ ] En `/` a 1280 px, recorre con Tab y luego con Mayús+Tab: enlace de salto → logo → «D11 ASDD» → «Inicio» → «Iniciar sesión» → «User Guide» → RSS → «Drupal». Cada elemento muestra un **contorno de 2 px que se ve sin esfuerzo**: blanco o gris claro en la barra y el pie, azul en el contenido. **El contorno del logo ahora debe ser blanco** (A11Y-007), no azul.
- [ ] Con el ratón, haz clic en «Inicio» de la barra, en un botón y en la X del aviso: **no** debe aparecer el contorno (`:focus-visible`).
- [ ] Ningún elemento con foco queda tapado por la barra ni por otro bloque (2.4.11). Haz scroll para confirmar que la barra no es fija.
- [ ] A unos 320 px (o en el modo responsive de las DevTools): Tab hasta el botón del menú (contorno gris claro). Intro o Espacio lo abre (`aria-expanded="true"`). Tab recorre «Inicio» e «Iniciar sesión» con contorno claro. Otro Intro sobre el botón lo cierra. Esc no lo cierra (es el comportamiento de Bootstrap); anótalo si te parece un problema.
- [ ] En `/user/login`, al cargar, el foco está en «Nombre de usuario» **con el contorno azul visible** (`autofocus`). Tab: Contraseña → «Iniciar sesión» → «Drupal». Mayús+Tab desde el usuario: pestañas → «Inicio» de la ruta de navegación → barra. Todos con contorno visible y sin trampas de foco.
- [ ] Envía el login con datos falsos, a 1280 px y a 320 px. El aviso rojo aparece dentro del contenido principal y «¿Olvidaste tu contraseña?» se ve oscuro, en negrita y subrayado. Con Mayús+Tab desde el usuario llegas a la X de cerrar: **debe verse un contorno azul de 2 px alrededor, separado del botón** (A11Y-006 corregido). Intro cierra el aviso. Anota a dónde va el foco después (hoy vuelve al principio de la página: OBS-10).

**Lector de pantalla (Orca + Firefox)**
- [ ] En `/`, abre la lista de regiones (Orca: tecla `m` en modo navegación, o Insert+F7 → regiones). Debes oír «Navegación principal» y «Menú de la cuenta de usuario» **pronunciados en español**, además de banner, principal y pie (contentinfo).
- [ ] En `/user/login`, la ruta de navegación se anuncia como «breadcrumb» (OBS-03) y las pestañas como «Pestañas» dentro de «Solapas principales» (OBS-09). Solo anótalo.
- [ ] El logo se lee como «Inicio, enlace» y luego «D11 ASDD, enlace» (OBS-08). A 320 px, el botón del menú se lee como «Toggle navigation, botón, contraído» (OBS-01).
- [ ] Tras el login fallido, Orca anuncia «Usuario o contraseña no reconocidos» sin mover el foco (`role="alert"`). El campo de usuario se lee como «no válido» y el botón de cerrar como «Close, botón» (OBS-02).
- [ ] Recorre con flecha abajo: enlace de salto → barra → título → contenido → pie, igual que el orden visual. Ningún enlace se lee dos veces.

**Zoom, reflujo y movimiento**
- [ ] Zoom del navegador al 200 % (Ctrl++) a 1280 px, en `/`, `/user/login` y el login fallido: no hay scroll horizontal, no se pierde texto, el menú pasa al botón sin solaparse y el contorno de foco (también el de la X) no se corta en los bordes.
- [ ] Con zoom solo de texto al 200 % (Firefox: Ver → Zoom → Solo texto), el texto de la barra, del aviso y del pie no se corta ni se solapa.
- [ ] Con `prefers-reduced-motion: reduce` (DevTools → Rendering), el despliegue del menú y el cierre del aviso son instantáneos o casi. `style.css` no añade animaciones ni transiciones.
- [ ] Con colores forzados (Windows en alto contraste, o DevTools → Rendering → Emulate `forced-colors: active`), los enlaces de la barra, el contorno de foco (incluido el de la X) y el borde del aviso siguen viéndose.

## Tests permanentes
| Criterio | Test | Estado |
|---|---|---|
| CA-A1 (`lang` igual al idioma por defecto) | `Functional\FrontendTest::testFrontPageAccessibility` | Correcto |
| CA-A1b (enlace de salto como primer enlace, `#main-content` dentro de `<main>`) | `Functional\FrontendTest::testFrontPageAccessibility` | Correcto |
| CA-A1c (un único `<main>`) | `Functional\FrontendTest::testFrontPageAccessibility` | Correcto |
| CA-A1d (un único `<h1>`) | `Functional\FrontendTest::testFrontPageAccessibility` | Correcto |
| CA-A2 (logo en un enlace a la portada con `rel="home"` y `alt` no vacío) | `Functional\FrontendTest::testFrontPageAssetsAndBranding` | Correcto |
| CA-A6 (bloques con `langcode: es` y etiqueta en español) | `Kernel\ConfigSyncTest::testBlockLabelsInSpanish` | Correcto |
| CA-A4d (contorno de foco de 2 px y al menos 3:1) | `Unit\ThemeCssTest::testFocusIndicators` y la medición de este informe | **Correcto** (antes incompleto): cubre `.btn-close:focus-visible`, `.form-check-input:focus-visible`, `footer .nav-link:focus-visible` y `color: inherit` en `a.site-logo`. Ejecutado: OK |
| CA-A4e (enlaces de los mensajes con al menos 4,5:1) | `Unit\ThemeCssTest::testAlertLinks` y la medición de este informe | Correcto |
| CA-A3, CA-A4, CA-A4b, CA-A4c | `npm run a11y` y la revisión estática de este informe | Cumplen |
| CA-A5 | Lista manual | **Pendiente de la persona** |

El aviso de la 2.ª pasada para QA sobre *Archivos afectados* ya está resuelto: la fila de `css/style.css` de la spec cita R5, CA-A4c, CA-A4d y CA-A4e. Los tests solo comprueban que las reglas existen; el contraste depende de los colores de Bootstrap5 y de R10, y se vigila con este informe. No se propone ningún test nuevo.

---
**Resultado: PENDIENTE DE REVISIÓN MANUAL** · 0 ALTOS · 0 MEDIOS · 0 BAJOS · 10 OBS. A11Y-001 a A11Y-007 están corregidos. La spec podrá considerarse SUPERADA (o SUPERADA CON AVISOS, si la persona decide anotar alguna OBS) cuando la persona confirme la lista de CA-A5.

## Confirmación manual
- 2026-11-08: la persona confirma la lista de comprobación manual (CA-A5).
  Con 0 hallazgos ALTOS, MEDIOS y BAJOS en código propio, la puerta de
  accesibilidad queda **SUPERADA** (las 10 OBS no bloquean, según RA).

---

## v1.2 · Revisión de accesibilidad (R11, R12, R13 — 2026-11-08)

- Versión de la spec: 1.2
- Norma: WCAG 2.2 AA
- Resultado: **PENDIENTE DE REVISIÓN MANUAL**
- Hallazgos nuevos: 0 ALTOS · 0 MEDIOS · 0 BAJOS · 0 OBS nuevas

> Revisión centrada en lo nuevo de la v1.2: menú plegable operable con teclado
> (R11), objetivos táctiles ≥ 24×24 px (R12), cierre con Esc (R13) y la
> librería `d11asdd_theme/navbar`. Los criterios CA17–CA22, CA20 y CA-A7 los
> comprueba `check.sh --menu`. La lista anterior (v1.1) y sus OBS siguen en pie.

### Alcance
- URL: `http://d11asdd.local/` a 320 px y 1280 px con `--menu --focus`.
- Archivos: `js/navbar.js`, `d11asdd_theme.libraries.yml`, `d11asdd_theme.info.yml`.

### Revisión automática (axe-core + --menu)
| URL | Ancho | Violaciones | Menú: problemas | Foco: sin indicador | Reflujo |
|---|---|---|---|---|---|
| `/` | 320 px | 0 | 0 | 0 / 7 elementos | sin scroll horizontal |
| `/` | 1280 px | 0 | 0 | 0 / 8 elementos | sin scroll horizontal |

CA17, CA17b, CA18, CA18b, CA19, CA20, CA21, CA22 y CA-A7: **todos superados**.

### Revisión estática de js/navbar.js
- `Drupal.behaviors` y `once()` correctamente usados (no roba el foco al cargar).
- `aria-expanded` gestionado por `bootstrap.Collapse.getOrCreateInstance().hide()`, no a mano (decisión 8).
- `toggler.focus()` en línea 42: correcto (devuelve foco al botón tras Esc, CA21).
- No hay `outline: none`, `tabindex > 0` ni `innerHTML`.
- Librería `navbar` declarada con `core/drupal`, `core/once` y `bootstrap5/bootstrap5-js-latest`; añadida a `libraries` en `.info.yml`.
- `event.stopPropagation()` en Esc: no interfiere con otros manejadores. No hay `preventDefault()`, por lo que Esc sigue funcionando para otros componentes.

### Hallazgos
Ninguno en código propio.

### Comprobación manual (CA-A8)
Haz esta lista a 320 px (modo responsive de las DevTools o pantalla real), sin sesión iniciada, con teclado y con Orca + Firefox.

**Teclado**
- [x] Pulsa Tab hasta el botón del menú. Pulsa **Intro**: el menú se despliega, el botón muestra `aria-expanded="true"` y el siguiente Tab lleva al primer enlace del menú principal («Inicio»).
- [x] Con el menú abierto, pulsa **Tab** desde «Inicio» hasta el último enlace («Iniciar sesión»). Foco visible en cada enlace; el orden es botón → «Inicio» → «Iniciar sesión».
- [x] Con el foco en el botón y el menú abierto, pulsa **Esc**: el menú se cierra, el botón recupera el foco y `aria-expanded` vuelve a `"false"`.
- [x] Con el foco en un enlace del menú abierto («Inicio» o «Iniciar sesión»), pulsa **Esc**: el menú se cierra y el foco vuelve al botón.
- [x] Con el menú **cerrado**, pulsa Esc: el foco permanece donde estaba (CA22).
- [x] A 1280 px el botón del menú no se ve; pulsa Esc con el foco en un enlace de la barra: el foco permanece donde estaba (CA22).

**Lector de pantalla (Orca + Firefox, 320 px)**
- [x] Navega con Tab hasta el botón del menú. Orca debe anunciar algo como «Toggle navigation, botón, **contraído**» (el `aria-expanded="false"` se traduce como «contraído»; el texto del atributo lo lee el lector de pantalla, no el JS propio).
- [x] Pulsa Intro para abrir el menú. Orca debe anunciar el botón como «**expandido**» o indicar el cambio de estado.
- [x] Pulsa Esc para cerrar. Orca debe anunciar el botón de nuevo como «contraído» y el foco debe seguir en él (no hay desplazamiento inesperado de la lectura).
- [x] Recorre el menú desplegado con flecha abajo: «Inicio, enlace» → «Iniciar sesión, enlace». El orden coincide con el visual.

> Nota: «Toggle navigation» sigue en inglés (OBS-01, Bootstrap5, ya registrada). No bloquea.

### Tests permanentes (v1.2)
| Criterio | Test | Estado |
|---|---|---|
| CA16 (botón con `aria-expanded` y `aria-controls`) | `Functional\FrontendTest::testFrontPageRegionsAndBlocks` | Correcto |
| CA23 (librería `navbar` con `js/navbar.js` y dependencias) | `Kernel\ThemeTest::testNavbarLibrary` | Correcto |
| CA23b (`js/navbar.js` cargado en la portada) | `Functional\FrontendTest::testFrontPageAssetsAndBranding` | Correcto |
| CA17–CA22, CA20, CA-A7 | `check.sh` (`axe-check.mjs --menu`) | Superados (ver tabla) |
| CA-A8 | Lista manual | Confirmada por la persona (2026-11-08) |

**Resultado v1.2: SUPERADA** · 0 ALTOS · 0 MEDIOS · 0 BAJOS · 0 OBS nuevas. Lista manual CA-A8 confirmada por la persona (2026-11-08).
