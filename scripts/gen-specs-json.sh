#!/bin/bash
# Genera asdd_tools/specs.json leyendo el frontmatter de specs/*.md
# Uso: scripts/gen-specs-json.sh
# Las rutas se leen de asdd_tools/config.json (relativas a ese directorio).
# Se pueden sobreescribir con variables de entorno: SPECS_DIR, OUTPUT.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOOLS_DIR="$SCRIPT_DIR/../asdd_tools"
CONFIG="${ASDD_CONFIG:-$TOOLS_DIR/config.json}"

if [ -f "$CONFIG" ] && command -v jq &>/dev/null; then
  SPECS_REL=$(jq -r '.specs_dir  // "../specs"'   "$CONFIG")
  OUT_FILE=$( jq -r '.output_json // "specs.json"' "$CONFIG")
  SPECS_DIR="${SPECS_DIR:-$(cd "$TOOLS_DIR/$SPECS_REL" && pwd)}"
  OUTPUT="${OUTPUT:-$TOOLS_DIR/$OUT_FILE}"
else
  SPECS_DIR="${SPECS_DIR:-$SCRIPT_DIR/../specs}"
  OUTPUT="${OUTPUT:-$TOOLS_DIR/specs.json}"
fi

items=()

# Primer valor de una línea de cabecera "- Etiqueta: valor" (regex tolerante,
# las etiquetas de los informes varían: "Versión de la spec", "…validada",
# "Hallazgos nuevos"…).
hdr() { # fichero regex_etiqueta
  [ -f "$1" ] || return 0
  grep -m1 -iE "$2" "$1" | sed -E 's/^[^:]*:[[:space:]]*//; s/[[:space:]]*$//'
}

# La puerta se mantiene salvo que el valor tras "Resultado:" empiece por BLOQUEAD.
# Sin línea "Resultado:" (p. ej. algunos informes), se mantiene.
gate_ok() { # fichero informe
  case "$(hdr "$1" '^-[[:space:]]*Resultado:')" in
    [Bb][Ll][Oo][Qq][Uu][Ee][Aa][Dd]*) return 1 ;;
    *) return 0 ;;
  esac
}

# Resumen de cabecera de un informe como objeto JSON (solo campos presentes).
report_json() { # fichero
  jq -n \
    --arg fecha     "$(hdr "$1" '^-[[:space:]]*Fecha:')" \
    --arg version   "$(hdr "$1" '^-[[:space:]]*Versi[oó]n')" \
    --arg resultado "$(hdr "$1" '^-[[:space:]]*Resultado:')" \
    --arg hallazgos "$(hdr "$1" '^-[[:space:]]*Hallazgos')" \
    '{fecha:$fecha, version:$version, resultado:$resultado, hallazgos:$hallazgos}
       | with_entries(select(.value != ""))'
}

for f in "$SPECS_DIR"/[0-9][0-9][0-9]-*.md; do
  name=$(basename "$f")
  # Ignorar informes de agentes y ficheros especiales
  case "$name" in *-qa.md|*-validacion.md|*-seguridad.md|*-accesibilidad.md) continue ;; esac

  # Leer solo el bloque frontmatter (entre los dos ---)
  fm=$(awk '/^---/{f=!f; next} f' "$f" | head -20)

  id=$(     echo "$fm" | grep -m1 '^id:'      | sed 's/^id: *//; s/"//g; s/^ *//; s/ *$//')
  titulo=$( echo "$fm" | grep -m1 '^titulo:'  | sed 's/^titulo: *//; s/"//g; s/^ *//; s/ *$//')
  nivel=$(  echo "$fm" | grep -m1 '^nivel:'   | sed 's/^nivel: *//; s/"//g; s/^ *//; s/ *$//')
  tipo=$(   echo "$fm" | grep -m1 '^tipo:'    | sed 's/^tipo: *//; s/"//g; s/^ *//; s/ *$//')
  estado=$( echo "$fm" | grep -m1 '^estado:'  | sed 's/^estado: *//; s/"//g; s/^ *//; s/ *$//')
  version=$(echo "$fm" | grep -m1 '^version:' | sed 's/^version: *//; s/"//g; s/^ *//; s/ *$//')

  [ -z "$id" ] && continue

  # Detectar puertas superadas: existe el informe Y su veredicto no es bloqueante.
  num="${name%%[^0-9]*}"   # primeros 3 dígitos
  val_f="$SPECS_DIR/${num}-validacion.md"
  qa_f="$SPECS_DIR/${num}-qa.md"
  seg_f="$SPECS_DIR/${num}-seguridad.md"
  a11y_f="$SPECS_DIR/${num}-accesibilidad.md"
  gates_arr=()
  [ -f "$val_f" ]  && gate_ok "$val_f"  && gates_arr+=("val")
  [ -f "$qa_f" ]   && gate_ok "$qa_f"   && gates_arr+=("qa")
  [ -f "$seg_f" ]  && gate_ok "$seg_f"  && gates_arr+=("seg")
  [ -f "$a11y_f" ] && gate_ok "$a11y_f" && gates_arr+=("a11y")
  if [ ${#gates_arr[@]} -gt 0 ]; then
    gates_json=$(printf '%s\n' "${gates_arr[@]}" | jq -R . | jq -s .)
  else
    gates_json='[]'
  fi

  # Resumen de cada documento para el desplegable de la tarjeta.
  reports=$(jq -n --arg v "$version" --arg e "$estado" \
    '{spec: ({version:$v, estado:$e} | with_entries(select(.value != "")))}')
  for pair in "validacion:$val_f" "qa:$qa_f" "seguridad:$seg_f" "accesibilidad:$a11y_f"; do
    k="${pair%%:*}"; rf="${pair#*:}"
    [ -f "$rf" ] || continue
    reports=$(jq --arg k "$k" --argjson r "$(report_json "$rf")" '. + {($k): $r}' <<<"$reports")
  done

  item=$(jq -n \
    --arg id      "$id"      \
    --arg titulo  "$titulo"  \
    --arg nivel   "$nivel"   \
    --arg tipo    "$tipo"    \
    --arg estado  "$estado"  \
    --arg version "$version" \
    --arg file    "$name"    \
    --argjson gates "$gates_json" \
    --argjson reports "$reports" \
    '{id:$id,titulo:$titulo,nivel:$nivel,tipo:$tipo,estado:$estado,version:$version,file:$file,gates:$gates,reports:$reports}')

  items+=("$item")
done

printf '%s\n' "${items[@]}" | jq -s 'sort_by(.id)' > "$OUTPUT"
echo "Generado $OUTPUT — $(jq length "$OUTPUT") specs"

# --- stack.json: stack activo y disponibles, para el selector del panel -----
STACKS_DIR="${STACKS_DIR:-$TOOLS_DIR/stacks}"
STACK_OUT="${STACK_OUT:-$TOOLS_DIR/stack.json}"
if command -v jq &>/dev/null; then
  active="$(jq -r '.stack // ""' "$CONFIG" 2>/dev/null)"
  avail=()
  for sf in "$STACKS_DIR"/*.json; do
    [ -e "$sf" ] || continue
    sid="$(basename "$sf" .json)"
    avail+=("$(jq -c --arg id "$sid" '{id:$id, label:(.label // ""), a11y:(.a11y // false)}' "$sf")")
  done
  if [ ${#avail[@]} -gt 0 ]; then
    avail_json=$(printf '%s\n' "${avail[@]}" | jq -s .)
  else
    avail_json='[]'
  fi
  # Pipeline states (dynamic): passed through from config.json for the panel.
  states_json="$(jq -c '.states // []' "$CONFIG" 2>/dev/null)"
  [ -z "$states_json" ] && states_json='[]'
  jq -n --arg a "$active" --argjson av "$avail_json" --argjson st "$states_json" \
    '{active:$a, available:$av, states:$st}' > "$STACK_OUT"
  echo "Generado $STACK_OUT — stack activo: ${active:-(sin definir)} — estados: $(printf '%s' "$states_json" | jq 'length')"
fi
