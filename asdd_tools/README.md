# asdd_tools — Dashboard de specs ASDD

Panel web ligero para visualizar y editar en línea las specs de cualquier
proyecto que siga el flujo
[ASDD](https://github.com/sitomarmohotmail/panel_asdd).

---

## Estructura de archivos

```
asdd_tools/
  config.json        ← configuración del proyecto (editar esto)
  index.html         ← dashboard, solo lectura (no tocar)
  specs.json         ← generado automáticamente por gen-specs-json.sh
  stack.json         ← generado: stack activo y disponibles (para el selector)
  stacks/            ← perfiles de tecnología de la QA (un .json por stack)
    drupal.json
    node.json  …
  running.json       ← estado del agente en curso (gestionado por hooks, no versionado)
  specs/             ← directorio servido estáticamente con los .md de specs
                        (puede ser un enlace simbólico a ../specs)
```

Scripts asociados (en `scripts/`):

```
scripts/
  gen-specs-json.sh  ← genera specs.json y stack.json
  check.sh           ← puerta de QA: runner agnóstico guiado por el perfil de stack
  asdd/init.sh       ← asistente: elige el stack activo
```

---

## Configuración (`config.json`)

```json
{
  "project_name": "mi-proyecto",
  "specs_dir":    "../specs",
  "output_json":  "specs.json",
  "stack":        "drupal"
}
```

| Campo | Descripción | Default |
|---|---|---|
| `project_name` | Nombre que muestra el dashboard en la cabecera | — |
| `specs_dir` | Ruta al directorio de specs, **relativa a `asdd_tools/`** | `../specs` |
| `output_json` | Nombre del JSON generado, dentro de `asdd_tools/` | `specs.json` |
| `stack` | Id del perfil de tecnología (`stacks/<id>.json`) que usa la QA | — |

El campo `stack` se fija con el asistente, no a mano:
`scripts/asdd/init.sh --stack <id>` (ver más abajo).

---

## Tecnología de la QA (perfiles de stack)

La puerta de QA `scripts/check.sh` **no está atada a ninguna tecnología**: es un
*runner* que lee un **perfil de stack** (`asdd_tools/stacks/<id>.json`) y ejecuta
los comandos que el perfil declara. Cambiar de Drupal/PHP a Node, .NET, Java,
Python… es **escribir un fichero** y activarlo; no se toca el panel, los hooks ni
`check.sh`.

### Elegir el stack

```bash
scripts/asdd/init.sh                 # lista los stacks disponibles (id + label)
scripts/asdd/init.sh --stack node    # activa ese stack (escribe config.json y regenera stack.json)
```

El panel muestra el stack activo en un distintivo en la cabecera; desde la vista
**"Stacks"** puedes ver los disponibles y copiar el comando para cambiar (el
panel es de solo lectura: no escribe en disco, solo copia el comando).

### Formato de un perfil `stacks/<id>.json`

```json
{
  "label": "Node / TypeScript",
  "a11y": false,
  "gates": [
    { "id": "types", "label": "tsc --noEmit", "cmd": ["npx", "tsc", "--noEmit"] },
    { "id": "lint",  "label": "eslint",       "cmd": ["npx", "eslint", "."] },
    { "id": "test",  "label": "vitest",
      "cmd":       ["npx", "vitest", "run"],
      "cmd_group": ["npx", "vitest", "run", "-t", "{group}"] }
  ],
  "trace": {
    "pattern": "test:([A-Za-z0-9_]+)",
    "locate":  "grep -rqs '{1}' --include='*.test.js' --include='*.test.ts' ."
  }
}
```

| Clave | Qué es |
|---|---|
| `label` | Nombre legible del stack (lo muestra el panel). |
| `a11y` | `true` si la QA debe ejecutar axe + foco (reflujo 320/1280). Ponlo `false` en proyectos sin interfaz web. |
| `gates` | Lista ordenada de comprobaciones. Cada una: `id`, `label` y `cmd` (array *argv*). Opcional `cmd_group` (plantilla con `{group}`) para `check.sh --group X`. |
| `trace` | Trazabilidad de tests. `pattern`: ERE con 1..N grupos de captura → marcadores posicionales `{1}`,`{2}`,…; `locate`: comando que localiza el test (código 0 = existe). Los valores capturados se **sanean** a `[A-Za-z0-9_]+` antes de interpolarse (anti-inyección). |

### Cómo corre `check.sh`

```bash
scripts/check.sh [--spec specs/NNN-x.md] [--group GRUPO] [--no-a11y] [URL…]
```

Lee el `stack` de `config.json`, **valida** el id contra `stacks/*.json` (lista
blanca: rechaza `/`, `..` e inexistentes) y ejecuta cada `gate`. `--group` solo
afecta a los gates con `cmd_group`; el paso de accesibilidad corre solo si el
perfil tiene `a11y: true` y no se pasó `--no-a11y`.

### Añadir una tecnología nueva

1. Crea `asdd_tools/stacks/mi-stack.json` con el formato de arriba.
2. `scripts/asdd/init.sh --stack mi-stack`.
3. `scripts/check.sh` ya usa tus comandos.

Perfiles incluidos: `drupal` (phpunit/phpstan/phpcs/drush + axe), y como
ejemplos `node` (tsc/eslint/vitest), `dotnet` (build/test/format) y `java`
(Maven: compile/spotbugs/checkstyle/test).

> **Seguridad.** Los `stacks/*.json` contienen comandos que el runner ejecuta:
> versiónalos y trátalos como código en las revisiones; `www-data` no debería
> poder escribir en `asdd_tools/`.

---

## Instalar en un proyecto nuevo

1. **Copia** la carpeta `asdd_tools/` a la raíz de tu proyecto.

2. **Copia** a tu `scripts/`: `gen-specs-json.sh`, `check.sh` y `asdd/init.sh`.

3. **Crea** tu perfil de stack en `asdd_tools/stacks/<id>.json` (ver
   *Tecnología de la QA*) y actívalo con `scripts/asdd/init.sh --stack <id>`.

4. **Edita** `asdd_tools/config.json`:
   - Cambia `project_name`.
   - Ajusta `specs_dir` si tu directorio de specs no es `../specs`.
   - (`stack` lo deja puesto `init.sh`.)

5. **Enlaza** (o copia) tus specs para que Apache pueda servirlas:
   ```bash
   ln -s ../specs asdd_tools/specs
   ```
   Si usas una copia en lugar de un enlace, recuerda mantenerla sincronizada.

6. **Genera los JSON iniciales** (`specs.json` y `stack.json`):
   ```bash
   bash scripts/gen-specs-json.sh
   ```

7. **Configura Apache** para servir `asdd_tools/` (el panel es de solo lectura;
   `www-data` solo necesita permiso de lectura):
   ```apache
   Alias /asdd_tools /ruta/a/tu/proyecto/asdd_tools
   <Directory /ruta/a/tu/proyecto/asdd_tools>
       Options -Indexes
       AllowOverride None
       Require all granted
   </Directory>
   ```

8. Abre `http://tu-proyecto.local/asdd_tools/` en el navegador.

---

## Regenerar `specs.json` / `stack.json` manualmente

```bash
bash scripts/gen-specs-json.sh
```

El script se puede llamar desde cualquier directorio. Lee la configuración de
`asdd_tools/config.json` y vuelca `asdd_tools/specs.json` y `asdd_tools/stack.json`.

Las rutas se pueden sobreescribir con variables de entorno si necesitas un
flujo no estándar:

```bash
SPECS_DIR=/ruta/absoluta/specs OUTPUT=/otra/ruta/out.json \
STACKS_DIR=/ruta/stacks STACK_OUT=/otra/ruta/stack.json \
bash scripts/gen-specs-json.sh
```

---

## Dependencias

| Herramienta | Para qué |
|---|---|
| `jq` | Parsear frontmatter y generar `specs.json` / `stack.json`; cargar perfiles en `check.sh` |
| `bash` | `check.sh`, `init.sh`, hooks |
| Apache (o nginx) | Servir el dashboard y los `.md` de specs |

(Las herramientas de cada stack —phpunit, vitest, dotnet…— las define su perfil
y solo hacen falta en el proyecto que las use.)

---

## Seguridad

- El panel (`index.html`) es **de solo lectura**: no escribe en disco ni expone
  endpoint de escritura.
- Los perfiles `stacks/*.json` contienen comandos que `check.sh` ejecuta:
  versiónalos, revísalos como código y evita que `www-data` pueda escribir en
  `asdd_tools/`.
- `check.sh` e `init.sh` validan el id de stack contra `stacks/*.json` (lista
  blanca) para evitar *path traversal* o ejecución arbitraria.
