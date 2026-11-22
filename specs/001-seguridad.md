# Seguridad · spec 001 — Tema hijo de Bootstrap5

- Fecha: 2026-11-08
- Versión de la spec: 1.1
- Resultado: SUPERADA CON AVISOS
- Hallazgos: 0 BLOQUEANTES · 0 ALTOS · 1 MEDIO · 1 BAJO

La v1.0 ya está implementada (commit `84bb516`), así que su parte es una
revisión retrospectiva. Los cambios de la v1.1 están en el árbol de trabajo,
sin commit, y se revisan como trabajo en curso. Cuando se hizo esta revisión
todavía no existía el informe de QA (`specs/001-qa.md`).

## Superficie revisada
Tema `web/themes/custom/d11asdd_theme`:
- `d11asdd_theme.info.yml` y `d11asdd_theme.libraries.yml`: una sola librería
  local (`css/style.css`), sin JavaScript y sin recursos externos ni CDN.
- `css/style.css`: solo reglas de estilo. No tiene `url()`, `@import` ni
  recursos remotos.
- `logo.svg`: un `rect` y un `text` estáticos. No tiene `<script>`, atributos
  `on*`, `href`/`xlink:href` ni `foreignObject`. `screenshot.png` es binario y
  no se sirve con datos del usuario.
- `config/install/d11asdd_theme.settings.yml` y
  `config/schema/d11asdd_theme.schema.yml` (R10).
- `config/optional/block.block.d11asdd_theme_*.yml`: los 13 bloques.
- Tests `tests/src/{Unit,Kernel,Functional,Traits}`.

Configuración exportada en `config/sync`: `system.theme.yml`,
`system.theme.global.yml`, `d11asdd_theme.settings.yml` y los 12
`block.block.d11asdd_theme_*.yml`. Para el contexto también se miró
`core.extension.yml`, `user.settings.yml`, `system.logging.yml` y
`user.role.anonymous.yml`.

Herramientas de la raíz (solo dependencias): `package.json`,
`package-lock.json` y `scripts/a11y/axe-check.mjs`.

Qué superficie aporta la spec: ninguna ruta, controlador, formulario, servicio,
plantilla Twig ni JavaScript propios. La superficie se reduce a:
- una hoja CSS y un SVG estáticos;
- la colocación de bloques de core;
- la configuración del tema, que se edita desde el formulario heredado de
  Bootstrap5 (`/admin/appearance/settings/d11asdd_theme`).

## Hallazgos

### DEP-001 · MEDIA · `package.json:12-15` / `package-lock.json`
- **Evidencia:** `npm audit` (Node v24.22.2 de nvm) informa de
  `10 high severity vulnerabilities`, todas en la cadena de
  `"puppeteer": "24.10.0"`:
  - `extract-zip`: GHSA-jmr9-qjv8-65gv y GHSA-7pqw-9j4j-h8q3 (escritura de
    archivos arbitrarios por enlaces simbólicos);
  - `basic-ftp` <=6.2.0: GHSA-c475-qrg2-pj4r (denegación de servicio);
  - `zod` <4.6.6: GHSA-mrhx-c7xc-m3w5 (agotamiento de memoria);
  - las dependencias que arrastran: `@puppeteer/browsers`, `puppeteer-core`,
    `chromium-bidi`, `get-uri`, `pac-proxy-agent` y `proxy-agent`.

  `npm audit` propone corregirlo instalando `puppeteer@25.16.0`, que es un
  cambio con ruptura. Con `npm audit --omit=dev` sale
  `found 0 vulnerabilities`.
- **Riesgo:** solo afecta a la máquina de desarrollo. `extract-zip` se usa al
  descargar y descomprimir Chrome durante `npm install`, de modo que alguien
  capaz de manipular esa descarga podría escribir archivos fuera del
  directorio de destino. Los otros avisos son de denegación de servicio en
  código que este script no usa con entrada no fiable. Hay controles
  compensatorios:
  - son `devDependencies`;
  - `/node_modules/` no se versiona y no forma parte del sitio ni del
    despliegue;
  - las versiones están fijadas en `package-lock.json`, todas desde
    `registry.npmjs.org`.

  No afecta al Drupal servido. Las herramientas llegaron en el commit
  `86e73f0`, pero la spec las usa en CA-A3.
- **Corrección propuesta:** subir `puppeteer` a `>=25.16.0`, con una versión
  de `@axe-core/puppeteer` compatible, y regenerar `package-lock.json`. Luego
  comprobar que `npm run a11y` sigue funcionando y que `npm audit` sale limpio.
  Si la actualización se aplaza, la persona puede aceptar el riesgo de forma
  explícita.

### DEP-002 · BAJA · `scripts/a11y/axe-check.mjs:40`
- **Evidencia:** `const browser = await puppeteer.launch({ args: ['--no-sandbox'] });`
  con URLs que vienen sin filtrar de la línea de comandos (`opts.urls`, líneas
  22-30).
- **Riesgo:** Chrome se ejecuta sin sandbox. Si alguien pasara al script una
  URL externa o comprometida, un exploit del navegador correría con los
  permisos del usuario de desarrollo. El comentario del script limita su uso
  al sitio local, pero el código no lo impone.
- **Corrección propuesta:** rechazar las URLs cuyo host no sea `d11asdd.local`
  ni `localhost`, o habilitar el sandbox con un perfil AppArmor para Chrome
  (por ejemplo, `kernel.apparmor_restrict_unprivileged_userns`) y quitar
  `--no-sandbox`.

## Revisado sin hallazgos
- **XSS:** el tema no tiene plantillas Twig, JavaScript ni código PHP propios.
  No hay `|raw`, `Markup::create()`, `#markup`, `innerHTML` ni `.html()` en
  `web/themes/custom` ni en `web/modules/custom` (este último está vacío). Los
  ajustes de R10 llegan a atributos `class` de las plantillas de Bootstrap5
  (`html.html.twig:33`, `page.html.twig:49,56,64,101,126`) con autoescape de
  Twig, y solo los puede cambiar quien tiene `administer themes`. El SVG del
  logo no tiene contenido activo.
- **ACC:** la spec no crea rutas ni permisos. Los bloques son de core
  (marca, menús, migas, mensajes, título, pestañas, acciones, contenido
  principal, "Powered by") y no exponen nada nuevo: las pestañas, las acciones
  y los enlaces de menú aplican sus propios controles de acceso, y el menú de
  cuenta solo muestra a los anónimos "Iniciar sesión". El formulario de
  ajustes (CA7e y CA8) es el de core y Bootstrap5. Exige `administer themes`,
  que es un permiso `restrict access: true` y ningún rol exportado en
  `config/sync` lo tiene. La salida de errores del login (CA13) es el mensaje
  genérico de core y no revela si el usuario existe.
- **SQL:** no aplica; no hay código PHP de producción ni consultas.
- **CSRF:** no aplica; no hay acciones ni formularios propios. El formulario
  heredado usa la Form API, que lleva token.
- **SEC:** no hay credenciales ni claves en el tema ni en la configuración de
  la spec. El grep de patrones solo encuentra `password: null` en
  `config/sync/system.mail.yml:9`, que no es de esta spec y no tiene valor.
  En los tests, `FrontendTest.php:114` envía al login unas credenciales
  ficticias a propósito, y los usuarios de prueba se crean con
  `drupalCreateUser()` y contraseña aleatoria. `settings.php` lee
  `hash_salt` y la contraseña de la base de datos de variables de entorno, y
  `phpunit.xml` y `settings.local.php` están en `.gitignore`.
- **CFG:** `d11asdd_theme.settings` solo contiene clases de presentación.
  Las claves `subtheme_*` del esquema no traen valores en `config/install` ni
  en `config/sync`. El generador de subtemas de Bootstrap5, que escribe
  archivos en el servidor, es contrib y solo lo puede usar quien tiene
  `administer themes`. `system.theme.yml` mantiene Claro para la
  administración. Para el contexto: `register: admin_only`,
  `error_level: hide`, el rol anónimo solo tiene `access content` y
  `restricted_html`, y no hay módulos de desarrollo activos en
  `core.extension.yml`.
- **DEP (Composer):** `composer audit --no-interaction` responde
  `No security vulnerability advisories found.` (incluye
  `drupal/bootstrap5` 4.0.8). El tema no carga librerías desde CDN.
- **FIL:** no aplica; no hay subidas ni rutas de archivo construidas con
  entrada del usuario. El logo usa el predeterminado del tema
  (`system.theme.global.yml`, `logo.use_default: true`).
