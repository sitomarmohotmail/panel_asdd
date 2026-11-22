---
id: "006"
titulo: Navigation Extra Tools 1.3.2
version: 1.0
estado: borrador
nivel: S
tipo: contrib
proyecto: navigation_extra_tools
---

# 006 · Navigation Extra Tools 1.3.2

## Contexto
El módulo Navigation Extra Tools amplía la barra de navegación de Drupal 11
añadiendo accesos directos útiles (shortcut links, herramientas de admin)
dentro del menú Navigation. Facilita el flujo de trabajo editorial sin
necesidad de módulos adicionales.

## Requisitos

- **R1** *(DEBE)* — El sistema deberá tener instalado y habilitado
  `drupal/navigation_extra_tools` 1.3.2.
- **R2** *(DEBE)* — El sistema deberá gestionar el módulo mediante Composer y
  exportar la configuración habilitada a `config/sync`.

## Criterios de aceptación (EARS)

- **CA1** *(R1 · check.sh)* — **Cuando** se ejecute `drush pm:list --status=enabled`,
  **el sistema deberá** mostrar `navigation_extra_tools` en la lista.
- **CA2** *(R2 · check.sh)* — **Cuando** se ejecute `drush config:status`,
  **el sistema deberá** reportar sin diferencias entre código y base de datos.

## Decisión pendiente
`navigation_extra_tools` requiere el módulo core `navigation`, que es
incompatible con `admin_toolbar` + `gin_toolbar` (ambos requieren `toolbar`).
Antes de aprobar esta spec hay que decidir:
- **Opción A** — Descartar esta spec y mantener `admin_toolbar` + `gin_toolbar`.
- **Opción B** — Desinstalar `admin_toolbar`, `admin_toolbar_tools` y `gin_toolbar`
  y migrar a `navigation` + `navigation_extra_tools`.

## Fuera de alcance
- Configuración avanzada de los elementos que expone el módulo.
- Integración con otros módulos de navegación.

## Plan técnico
_(tras aprobar)_
1. `composer require drupal/navigation_extra_tools:^1.3.2`
2. `vendor/bin/drush en navigation_extra_tools -y`
3. `vendor/bin/drush cex -y`

## Tareas
- [ ] Implementación
- [ ] `scripts/check.sh --spec specs/006-navigation-extra-tools.md` en verde

## Trazabilidad
| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 | CA1 | `check.sh` |
| R2 | CA2 | `check.sh` |

## Puertas
- Validación: _(nivel S: sin agente)_
- QA: _(salida resumida de `scripts/check.sh`)_
