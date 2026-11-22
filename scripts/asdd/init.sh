#!/usr/bin/env bash
# Asistente de configuración del stack (spec-009). Elige qué tecnología usa la
# puerta de QA (scripts/check.sh) sin tocar código: fija el campo `stack` de
# asdd_tools/config.json y regenera asdd_tools/stack.json para el panel.
#
# Uso:
#   scripts/asdd/init.sh                 lista los stacks disponibles (id + label)
#   scripts/asdd/init.sh --stack <id>    activa ese stack
#
# Variables de entorno (tests): ASDD_CONFIG, ASDD_STACKS_DIR.
set -u
cd "$(dirname "$0")/../.."

CONFIG="${ASDD_CONFIG:-asdd_tools/config.json}"
STACKS_DIR="${ASDD_STACKS_DIR:-asdd_tools/stacks}"
GEN="scripts/gen-specs-json.sh"

stack=""
while [ $# -gt 0 ]; do
  case "$1" in
    --stack) stack="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) shift ;;
  esac
done

list() {
  local f id label
  for f in "$STACKS_DIR"/*.json; do
    [ -e "$f" ] || continue
    id="$(basename "$f" .json)"
    label="$(jq -r '.label // ""' "$f" 2>/dev/null)"
    printf '  %-12s %s\n' "$id" "$label"
  done
}

if [ -z "$stack" ]; then
  echo "Stacks disponibles:"
  list
  echo
  echo "Activar uno: scripts/asdd/init.sh --stack <id>"
  exit 0
fi

# Validación del id (R3): sin separadores ni recorridos de ruta y debe existir.
case "$stack" in
  */*|*..*) echo "init.sh: id de stack inválido: $stack" >&2; exit 1 ;;
esac
if [ ! -f "$STACKS_DIR/$stack.json" ]; then
  echo "init.sh: no existe el stack '$stack' en $STACKS_DIR" >&2
  echo "Disponibles:" >&2; list >&2
  exit 1
fi

tmp="$(mktemp)"
if jq --arg s "$stack" '.stack = $s' "$CONFIG" > "$tmp" 2>/dev/null; then
  mv "$tmp" "$CONFIG"
else
  rm -f "$tmp"; echo "init.sh: no se pudo escribir $CONFIG" >&2; exit 1
fi

# Regenerar stack.json (y specs.json) para que el panel refleje el cambio.
bash "$GEN" >/dev/null 2>&1 || true

echo "Stack activo: $stack ($(jq -r '.label // ""' "$STACKS_DIR/$stack.json"))"
