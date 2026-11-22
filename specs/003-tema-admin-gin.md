---
id: "003"
titulo: Tema de administración Gin
version: 1.0
estado: implementada
nivel: S
tipo: tema
proyecto: gin
---

# 003 · Tema de administración Gin

## Contexto
El tema de administración actual (`claro`) es funcional pero básico.
Gin ofrece una experiencia de edición moderna con barra lateral de navegación,
búsqueda de contenido mejorada y mejor ergonomía para editores y administradores.
Es el tema admin más adoptado en Drupal 11 y no requiere código propio.

## Requisitos

- **R1** *(DEBE)* — El sistema deberá usar el tema Gin como tema de administración
  de Drupal.
- **R2** *(DEBE)* — El sistema deberá instalar `drupal/gin` y `drupal/gin_toolbar`
  mediante Composer y activarlos correctamente.
- **R3** *(DEBERÍA)* — La configuración del tema deberá exportarse a `config/sync`.

## Criterios de aceptación (EARS)

- **CA1** *(R1 · R2 · check.sh)* — **Cuando** se ejecuta `drush config:status`,
  **el sistema deberá** mostrar 0 diferencias, con `gin` como tema admin en
  `system.theme.yml` y los archivos de configuración de Gin exportados.

## Fuera de alcance
- Personalización de colores o layout de Gin (tema propio basado en Gin).
- Instalación de módulos adicionales de Gin (gin_lb, etc.).

## Plan técnico
_(tras aprobar)_

1. `composer require drupal/gin drupal/gin_toolbar`
2. `vendor/bin/drush theme:enable gin` y `module:enable gin_toolbar`
3. `vendor/bin/drush config:set system.theme admin gin`
4. `vendor/bin/drush config:set gin.settings ... ` (configuración mínima)
5. `vendor/bin/drush cex` → `config/sync`

Archivos modificados/creados:
- `config/sync/system.theme.yml`
- `config/sync/gin.settings.yml`
- `config/sync/gin_toolbar.settings.yml` (si aplica)
- `composer.json` / `composer.lock`

## Tareas
- [x] Implementación (Composer + Drush + config export)
- [x] `drush config:status` → 0 diferencias

## Puertas
- Validación: nivel S — sin pasada de agente
- QA: `config:status` limpio; gin 5.0.16 + gin_toolbar 3.0.3 instalados

## Trazabilidad
| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 · R2 · R3 | CA1 | `check.sh` (`config:status`) |

## Puertas
- Validación: _(nivel S: sin pasada de agente)_
- QA: _(salida resumida de `scripts/check.sh`)_
