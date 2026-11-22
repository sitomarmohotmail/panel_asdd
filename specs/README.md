# Especificaciones (ASDD)

Cada funcionalidad nace aquí **antes** de escribir código.

Adopción parcial de [efactory-llc/asdd](https://github.com/efactory-llc/asdd)
(MIT): requisitos EARS, puertas de calidad y agentes de revisión, simplificado
para gastar pocos tokens. Umbrales en `.claude/rules/quality-gates.md`.

## Niveles

| Nivel | Cuándo | Puertas |
|---|---|---|
| **S** | CSS, configuración, textos, correcciones pequeñas, **contrib puro** | `scripts/check.sh`. Sin agentes. Tests solo si hay código propio. |
| **M** | Lo habitual: componentes, plantillas, bloques | 1 pasada de `asdd-validacion` + `scripts/check.sh` |
| **L** | Rutas, formularios, permisos, datos de usuario, JS propio | M + `asdd-seguridad` (si hay superficie de ataque) + `asdd-accesibilidad` (si hay interacción nueva) |

El agente propone el nivel en la cabecera y la persona lo confirma al aprobar.

## Ciclo

```
borrador → [validación, M/L] → aprobada → tests en rojo → implementación
        → scripts/check.sh → [seguridad / accesibilidad, L] → implementada → commit
```

1. **Spec** desde `_plantilla.md`: contexto breve, requisitos con prioridad y
   criterios EARS (uno por comportamiento).
2. **Validación** (M/L): una pasada de `asdd-validacion`. El agente principal
   corrige los BLOQUEANTES y ALTOS comprobándolos en el código; no se repite
   la pasada salvo que un BLOQUEANTE no pueda cubrirse con un test.
3. **Aprobación** de la persona (`estado: aprobada`).
4. **Tests primero** (solo si hay código propio), anotando el rojo en *Tareas*
   (`rojo: N fallos`). Contrib puro: sin tests — la comunidad los mantiene.
   Durante el desarrollo: `vendor/bin/phpunit --group GRUPO`.
5. **Implementación** hasta verde.
6. **QA**: `scripts/check.sh --spec specs/NNN-….md [URL…]` (tests, phpcs,
   phpstan, `config:status`, trazabilidad y, si hay interfaz, axe + reflujo +
   foco a 1280 y 320 px). Resumen en la sección *Puertas* de la spec.
7. **Seguridad / accesibilidad** (L): una pasada; corregir ALTOS con su test.
8. **Cierre**: `estado: implementada` y commit `spec-NNN: …`.

Los hallazgos **BAJOS** no se corrigen en la spec: una línea en
`specs/pendientes.md`. Los agentes solo escriben informe (`NNN-*.md`, máx.
~40 líneas) si hay hallazgos MEDIOS o superiores.

## Estados
`borrador` → `aprobada` → `en-curso` → `implementada`

## Criterios en EARS

| Patrón | Plantilla |
|---|---|
| Siempre | **El sistema deberá** ‹respuesta›. |
| Evento | **Cuando** ‹disparador›, **el sistema deberá** ‹respuesta›. |
| Estado | **Mientras** ‹estado›, **el sistema deberá** ‹respuesta›. |
| Error | **Si** ‹condición no deseada›, **entonces el sistema deberá** ‹respuesta›. |
| Opcional | **Donde** ‹característica›, **el sistema deberá** ‹respuesta›. |

## Accesibilidad
Todo lo que toca HTML, Twig, CSS o JS cumple **WCAG 2.2 AA** (requisito RA,
reglas en `.claude/rules/accesibilidad.md`). Herramienta:

```bash
nvm use && npm ci && npx puppeteer browsers install chrome   # una vez
npm run a11y -- --focus http://d11asdd.local/                 # axe + reflujo + foco
npm run a11y -- --focus --width 320 http://d11asdd.local/
```

La lista manual (teclado, lector de pantalla, zoom) solo se pide en nivel L.

## Buenas prácticas
- Verificar en el código los hallazgos graves de un agente antes de corregir.
- No editar archivos mientras se ejecutan tests largos.
- Recargar la spec en el editor antes de tocarla (una copia antigua guardada
  sobrescribe los cambios).
