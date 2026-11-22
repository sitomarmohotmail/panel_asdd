# Accesibilidad · spec 009 — QA agnóstica del stack

- Fecha: 2026-11-21
- Versión de la spec: implementada (revisión retrospectiva)
- Norma: WCAG 2.2 AA
- Resultado: SUPERADA CON AVISOS (pendiente de lista manual de la persona)
- Hallazgos: 0 ALTOS · 3 MEDIOS · 2 BAJOS · 0 OBS

## Alcance
Revisión estática de `asdd_tools/index.html` (CSS 855-887, HTML 895 y 959-970, JS 1559-1652). Panel local fuera del sitio Drupal: axe automático fuera de alcance.

## Hallazgos
### A11Y-001 · MEDIA · 2.5.3 Etiqueta en el nombre · `index.html:895-896`
- **Evidencia:** `<button id="stack-badge" aria-label="Stack activo; abrir selector de tecnología">` con texto visible dinámico (`#stack-badge-label`).
- **Problema:** el nombre accesible no contiene el texto visible (nombre del stack); falla con control por voz.
- **Corrección:** quitar `aria-label` y añadir `<span class="visually-hidden">` o actualizar el `aria-label` desde `renderStackBadge()` como `Stack activo: ${label}; abrir selector`.

### A11Y-002 · MEDIA · 2.4.3 Orden del foco / 2.4.7 Foco visible · `index.html:792-804`
- **Evidencia:** `.ed-modal` cerrado solo usa `opacity:0; pointer-events:none`, sin `visibility:hidden`/`inert`.
- **Problema:** el botón "Cerrar" (`#stk-cancel`) del modal cerrado sigue en el orden de Tab: el foco cae en un control invisible. Afecta a teclado y lector.
- **Corrección:** `.ed-modal:not(.open){visibility:hidden}` (con transición de visibility) o atributo `inert` alternado en open/close.

### A11Y-003 · MEDIA · 2.4.3 Orden del foco · `index.html:1627-1650`
- **Evidencia:** `aria-modal="true"` pero no hay trampa/ciclo de Tab; el fondo no es `inert`. Además `fallbackCopy` hace `ta.focus()` y elimina el textarea: el foco pasa a `body` dentro del modal.
- **Problema:** Tab sale del diálogo hacia el panel de detrás (contenido oculto visualmente por overlay); tras copiar por `execCommand` se pierde el foco.
- **Corrección:** ciclar Tab/Mayús+Tab entre el primer y último foco del modal (o `inert` en el resto) y guardar/restaurar `document.activeElement` en `fallbackCopy`.

## BAJOS
- Sin `@media (prefers-reduced-motion)` para las transiciones de `.ed-modal`/`.ed-overlay` (2.3.3, buena práctica).
- `.stk-note` y `.stk-id` a 12 px con `--fg2`: verificar contraste ≥ 4,5:1 sobre `--surface2`/`--surface` (1.4.3); no medido.

## Comprobación manual (para la persona, CA-A4)
- [ ] Al cargar `/asdd_tools/index.html` el foco no salta al selector ni al modal.
- [ ] Tab llega al distintivo; foco visible (contorno cian) ≥ 3:1 sobre el fondo de cabecera.
- [ ] Intro/Espacio abre el modal; el foco va al primer stack.
- [ ] Tab/Mayús+Tab recorre stacks y "Cerrar"; anota si el foco sale al panel de fondo (A11Y-003).
- [ ] Con el modal cerrado, Tab no se detiene en un control invisible (A11Y-002).
- [ ] Intro sobre un stack no activo: se muestra el comando y Orca anuncia "Comando copiado…" sin mover el foco.
- [ ] Intro sobre el stack activo: Orca anuncia "ya es el stack activo".
- [ ] Orca: el distintivo se lee con el nombre del stack; el diálogo con su título; el activo como "actual/activo", no solo por color verde.
- [ ] Esc cierra el modal y el foco vuelve al distintivo; igual con "Cerrar" y clic en overlay.
- [ ] Zoom 200 % y 320 px: modal usable, sin scroll horizontal; el comando largo se parte.
- [ ] `prefers-reduced-motion: reduce`: aviso de la transición (BAJO).

## Tests permanentes
CA-A1 verificado por test (contraste); CA-A2/A3 son comprobables estáticamente (`aria-current`, `aria-live`, `<button>`): confirmar que existe test sobre el HTML de `index.html`. CA-A4 es manual. Proponer test para A11Y-001 (el nombre accesible contiene el texto visible) tras corregir.
