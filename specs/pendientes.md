# Pendientes (hallazgos BAJOS y OBS)

Una línea por pendiente: origen · descripción. Se agrupan en specs futuras.

- 001 · PHPStan a nivel 8: ~10 errores de tipos nulos en los tests (`find()`, `FileStorage::read()`).
- 001 · OBS: textos en inglés sin `|t` en plantillas de Bootstrap5 («Toggle navigation», «Close», «breadcrumb»); comunicar a los mantenedores o sobrescribir plantillas en una spec propia.
- 001 · OBS-10: al cerrar un aviso, el foco vuelve a `<body>` (JS de Bootstrap).
- 001 · OBS: vista `frontpage` con textos en inglés («Welcome!») y RSS sin título de feed.
- 001 v1.2 · CA22 usa el patrón «Si… entonces» para un caso normal (Esc con el menú cerrado).
- 001 v1.2 · CA-A7 se solapa con CA-A3 y CA20.
- 001 v1.2 · CA6 y las tareas no citan ESLint sobre `js/navbar.js` (lo cubre `check.sh` por spec-002).
- 007 · DRU-001: en Drupal 11.4 el módulo `sdc` es obsoleto (integrado en core); la dependencia se eliminó del info.yml — resuelto.
- 007 · DRU-002: eliminar `CartotecaAjaxController.php` del plan técnico (ya resuelto en v1.0); el AJAX va por Form API.
- 007 v1.6 · AMB: R4 «variantes de tamaño» y R5 «Período/Escala» con alternativas `/` en la tabla del plan sin regla de prioridad.
- 007 v1.6 · DUP: R6/CA8 repiten lo mismo que CA4b (imagen por defecto).
- 007 v1.6 · AMB: R7/CA9 «disparar el evento en cada componente» no define el selector (el plan sí: `.sdc-cartoteca__slider`/`__info`).
- tooling · `asdd_tools/gen-specs-json.sh` pinta las puertas val/qa en verde por la mera existencia del fichero `NNN-validacion.md`/`NNN-qa.md`, sin leer el veredicto (`Resultado:`); engaña si el informe está BLOQUEADO. Mejora: leer la primera línea de resultado.
- 007 v1.6 · CA2b: `CartotecaFormErrorTest` usa `user/login` y no comprueba que el error esté ausente de la barra de mensajes (solo que esté inline con `aria-invalid`). Mejora: aserción negativa sobre `[data-drupal-messages]`.
- 008 v1.1 · CA8/CA-A1 no fijan actor ni la vista/navegador concretos de la verificación manual.
- 008 v1.1 · "Mejorar el TTL del hook" sin referencia a su línea (`TTL=1800` en `scripts/agent-hook.sh`).
- 008 v1.3 · CA9/CA11/CA12 son tests de presencia (grep sobre `index.html`) por no haber arnés JS para el dashboard; plantear un arnés `node` mínimo (extraer helpers puros) en spec futura.
- 007 v1.6 a11y · la tabla repite `aria-label "Datos del mapa"` con el `h2` y la región; mejor `aria-labelledby`.
- 007 v1.6 a11y · el cambio de diapositiva (flechas/miniaturas) no se anuncia con `Drupal.announce`/`aria-live`.
- 007 v1.6 a11y · la miniatura activa y la que tiene el foco comparten estilo; distinguirlas.
- 007 v1.6 a11y · "Descargar" sin contexto (añadir el nombre o `aria-label`); flechas con `opacity:.85` y ejemplo repetido en etiqueta+placeholder (heredado de v1.5).
- 009 v1.0 · CA11 acoplaba el test a literales de implementación (`fetch('/asdd_tools/stack.json'`); mejor comprobar comportamiento con ruta relativa (recogido ya en CA11 v1.1).
- 009 v1.0 · la "Decisión pendiente" del Contexto dejaba texto condicional — resuelto en v1.2 (Opción A, movida a Fuera de alcance).
- 009 seg · `--group` no se sanea en `check.sh`; se sustituye en argv sin shell (sin inyección), pero un valor como `--foo` llega como opción. Mejora: sanear a `[A-Za-z0-9_,-]+`.
- 009 seg · `{group}` solo es seguro en argv directo; documentar que no debe usarse dentro de un `cmd` con `bash -c` (ahí sí habría inyección).
- 009 seg · OBS: los perfiles `asdd_tools/stacks/*.json` contienen comandos que ejecuta el runner (ejecución controlada por el repo). Mitigado por versionado/revisión; conviene que `www-data` no pueda escribir en `asdd_tools/` y tratar los cambios de perfil como cambios de código.
- 009 a11y · las transiciones del modal de stacks no respetan `prefers-reduced-motion` (2.3.3, buena práctica).
- 009 a11y · sin medir el contraste de `.stk-note` y `.stk-id` (12 px, `--fg2` sobre fondo del modal); comprobar ≥ 4,5:1.
- 009 val (2ª pasada) · el arnés compartido `scripts/asdd/test.sh` tiene un `CA12` que no está en la spec 009 — es de la spec-008 (filtro TTL); sin acción, solo aclaración de alcance.
