#!/usr/bin/env bash
# Puerta de QA automática (sustituye al agente asdd-qa). Runner genérico guiado
# por un perfil de stack (asdd_tools/stacks/<id>.json): ejecuta sus `gates`,
# comprueba la trazabilidad con su `trace` y, si el perfil lo pide, axe + foco.
# La tecnología (phpunit/phpstan/… o vitest/tsc/…) vive en el perfil, no aquí.
#
# Uso:
#   scripts/check.sh [--spec specs/NNN-x.md] [--group GRUPO] [--no-a11y] [URL…]
#
#   --spec     comprueba que cada test citado en la trazabilidad existe.
#   --group    limita los tests al grupo (solo gates con `cmd_group`).
#   --no-a11y  omite axe-core.
#   URL…       páginas para axe (por defecto http://localhost/).
#
# Variables de entorno (sobre todo para los tests del arnés):
#   ASDD_CONFIG       config.json a leer (por defecto asdd_tools/config.json).
#   ASDD_STACKS_DIR   directorio de perfiles (por defecto asdd_tools/stacks).
#   ASDD_IN_TEST=1    omite el gate cuyo cmd invoque scripts/asdd/test.sh
#                     (evita recursión cuando el arnés ejecuta el runner).
#
# Sale con 1 si falla cualquier comprobación.
set -u
cd "$(dirname "$0")/.."

CONFIG="${ASDD_CONFIG:-asdd_tools/config.json}"
STACKS_DIR="${ASDD_STACKS_DIR:-asdd_tools/stacks}"

spec="" group="" a11y=1 urls=()
while [ $# -gt 0 ]; do
  case "$1" in
    --spec) spec="$2"; shift 2 ;;
    --group) group="$2"; shift 2 ;;
    --no-a11y) a11y=0; shift ;;
    *) urls+=("$1"); shift ;;
  esac
done
[ ${#urls[@]} -eq 0 ] && urls=("http://localhost/")

# --- Selección y validación del stack (R3) ---------------------------------
stack="$(jq -r '.stack // ""' "$CONFIG" 2>/dev/null)"
if [ -z "$stack" ] || [ "$stack" = "null" ]; then
  echo "check.sh: falta 'stack' en $CONFIG (usa scripts/asdd/init.sh --stack <id>)." >&2
  exit 1
fi
case "$stack" in
  */*|*..*) echo "check.sh: id de stack inválido: $stack" >&2; exit 1 ;;
esac
profile="$STACKS_DIR/$stack.json"
if [ ! -f "$profile" ]; then
  echo "check.sh: no existe el perfil '$stack' en $STACKS_DIR" >&2
  exit 1
fi

# Dashboard asdd_tools: el START lo registra el hook PreToolUse; aquí
# garantizamos el STOP al terminar de verdad con un trap EXIT.
_hook="$(dirname "$0")/agent-hook.sh"
_sid="$(printf '%s' "$spec" | grep -oE '[0-9]{3}' | head -1)"; _sid="${_sid:-__global__}"
[ -x "$_hook" ] && trap '"$_hook" mark-stop "$_sid" tests' EXIT

failed=0
results=()
run() {
  local label="$1"; shift
  local out
  if out=$("$@" 2>&1); then
    results+=("OK    $label")
  else
    results+=("FALLO $label")
    failed=1
    printf '\n--- %s ---\n%s\n' "$label" "$(printf '%s\n' "$out" | tail -25)"
  fi
}

# --- Gates del perfil ------------------------------------------------------
ngates="$(jq '.gates | length' "$profile")"
for i in $(seq 0 $((ngates - 1))); do
  label="$(jq -r ".gates[$i].label" "$profile")"
  has_group="$(jq -r ".gates[$i] | has(\"cmd_group\")" "$profile")"
  if [ -n "$group" ] && [ "$has_group" = "true" ]; then
    key="cmd_group"; label="$label (grupo $group)"
  else
    key="cmd"
  fi
  mapfile -t argv < <(jq -r ".gates[$i].$key[]" "$profile")
  if [ "$key" = "cmd_group" ]; then
    for j in "${!argv[@]}"; do argv[$j]="${argv[$j]//\{group\}/$group}"; done
  fi
  # Guardia anti-recursión: no ejecutar el arnés de tooling dentro del arnés.
  if [ -n "${ASDD_IN_TEST:-}" ] && printf '%s\n' "${argv[@]}" | grep -q 'scripts/asdd/test\.sh'; then
    continue
  fi
  run "$label" "${argv[@]}"
done

# --- Trazabilidad (según el perfil) ----------------------------------------
if [ -n "$spec" ]; then
  pattern="$(jq -r '.trace.pattern // ""' "$profile")"
  locate="$(jq -r '.trace.locate // ""' "$profile")"
  trace() {
    local missing=0 ref out n val bad
    local -a g
    [ -z "$pattern" ] && return 0
    while read -r ref; do
      [ -z "$ref" ] && continue
      [[ "$ref" =~ $pattern ]] || continue
      # Capturar los grupos ANTES del bucle: cualquier [[ … ]] posterior
      # (p. ej. el test de marcador) reescribe BASH_REMATCH.
      g=("" "${BASH_REMATCH[1]-}" "${BASH_REMATCH[2]-}" "${BASH_REMATCH[3]-}")
      out="$locate"; bad=0
      for n in 1 2 3; do
        [[ "$out" == *"{$n}"* ]] || continue
        val="${g[$n]}"
        if [[ "$val" =~ ^[A-Za-z0-9_]+$ ]]; then
          out="${out//\{$n\}/$val}"
        else
          bad=1; break
        fi
      done
      if [ "$bad" = 1 ]; then echo "No existe (valor no saneado): $ref"; missing=1; continue; fi
      bash -c "$out" >/dev/null 2>&1 || { echo "No existe: $ref"; missing=1; }
    done < <(grep -oE "$pattern" "$spec" 2>/dev/null | sort -u)
    return $missing
  }
  run "trazabilidad ($spec)" trace
fi

# --- Accesibilidad (si el perfil la pide) ----------------------------------
prof_a11y="$(jq -r '.a11y // false' "$profile")"
if [ "$a11y" -eq 1 ] && [ "$prof_a11y" = "true" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
  nvm use >/dev/null 2>&1
  run "axe + foco 1280px" npm run --silent a11y -- --focus --menu "${urls[@]}"
  run "axe + foco 320px" npm run --silent a11y -- --focus --menu --width 320 "${urls[@]}"
fi

printf '\n'
printf '%s\n' "${results[@]}"
exit $failed
