---
id: "005"
titulo: Módulo Admin Toolbar
version: 1.0
estado: implementada
nivel: S
tipo: modulo
proyecto: admin_toolbar
---

# 005 · Módulo Admin Toolbar

## Contexto
Admin Toolbar convierte la barra de administración de Drupal en un menú
desplegable que permite navegar directamente a cualquier sección sin cargar
páginas intermedias. Mejora significativamente la velocidad de trabajo en
el panel de administración.

## Requisitos

- **R1** *(DEBE)* — El sistema deberá instalar `drupal/admin_toolbar` mediante
  Composer.
- **R2** *(DEBE)* — Los módulos `admin_toolbar` y `admin_toolbar_tools` deberán
  estar habilitados.
- **R3** *(DEBE)* — La configuración exportada a `config/sync` deberá reflejar
  el estado de los módulos.

## Criterios de aceptación (EARS)

- **CA1** *(R1 · R2 · R3 · check.sh)* — **Cuando** se ejecuta
  `drush config:status`, **el sistema deberá** mostrar 0 diferencias, con
  `admin_toolbar` y `admin_toolbar_tools` listados en `core.extension.yml`.

## Fuera de alcance
- Submódulo `admin_toolbar_search` (opcional).
- Personalización de los enlaces del menú.

## Plan técnico

1. `composer require drupal/admin_toolbar`
2. `vendor/bin/drush module:enable admin_toolbar admin_toolbar_tools`
3. `vendor/bin/drush cex` → `config/sync`

Archivos modificados/creados:
- `composer.json` / `composer.lock`
- `config/sync/core.extension.yml`

## Tareas
- [x] Implementación (Composer + Drush + config export)
- [x] `drush config:status` → 0 diferencias

## Puertas
- Validación: nivel S — sin pasada de agente
- QA: `config:status` limpio; módulos instalados y habilitados

## Trazabilidad
| Requisito | Criterio | Test |
|-----------|----------|------|
| R1 · R2 · R3 | CA1 | `check.sh` (`config:status`) |
