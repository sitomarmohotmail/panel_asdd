#!/bin/bash
# Mantiene asdd_tools/running.json con los procesos ASDD en curso (agentes y QA)
# para que el dashboard los muestre en vivo, diferenciando primer/segundo plano.
#
# El problema que resuelve: PostToolUse dispara cuando la LLAMADA devuelve el
# control, que para trabajo en background es el instante del lanzamiento, no el
# final real. Por eso aquí:
#   - START se captura en PreToolUse (único sitio que conoce run_in_background).
#   - STOP se captura al terminar de verdad:
#       · subagentes  -> hook SubagentStop (desapila LIFO).
#       · check.sh    -> trap EXIT del propio script (acción directa mark-stop).
#   - TTL como red de seguridad: purga entradas caducadas en cada escritura.
#
# Modos de uso:
#   hook PreToolUse (Agent|Bash):  cat input.json | agent-hook.sh start
#   hook SubagentStop:             cat input.json | agent-hook.sh subagent-stop
#   directo (trap de check.sh):    agent-hook.sh mark-stop  <sid> <agente>
#                                  agent-hook.sh mark-start <sid> <agente> <modo>
#
# Estructura de running.json:
#   { "001": [ { "agent": "tests", "mode": "background", "started": 1764... } ] }

set -u

_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNNING_JSON="${ASDD_RUNNING_JSON:-$_ROOT/asdd_tools/running.json}"
STACK="${ASDD_STACK:-$_ROOT/asdd_tools/.running.stack}"
TTL=1800  # segundos; entradas más antiguas se consideran colgadas y se purgan.

# ¿El comando *ejecuta* scripts/check.sh, o solo lo *menciona*?
# check.sh debe ir en posición de comando: al inicio o tras ; & | (, con bash/sh
# y ruta opcionales. Se descartan las menciones entre comillas (p. ej. el mensaje
# de un commit) y como argumento de otro programa (grep, ps…). Evita el falso
# positivo que marcaba "tests en ejecución" con cualquier comando que citara check.sh.
ejecuta_check() {
  local c
  c=$(printf '%s' "$1" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")
  printf '%s' "$c" | grep -qE \
    '(^|[;&(|])[[:space:]]*((bash|sh)[[:space:]]+)?([^;&(|[:space:]]*/)?check\.sh([[:space:]]|$)'
}

now=$(date +%s)

ensure_json() {
  [ -f "$RUNNING_JSON" ] || echo '{}' > "$RUNNING_JSON"
  jq empty "$RUNNING_JSON" 2>/dev/null || echo '{}' > "$RUNNING_JSON"
}

# Purga por TTL y elimina specs sin agentes. Recibe/entrega JSON por la tubería jq.
PRUNE='
  with_entries(.value |= [ .[]
    | (if type == "string" then { agent: ., mode: "foreground", started: $now } else . end)
    | select((.started // 0) > ($now - $ttl)) ])
  | with_entries(select(.value | length > 0))
'

add_entry() { # sid agent mode
  ensure_json
  jq --arg sid "$1" --arg agent "$2" --arg mode "$3" --argjson now "$now" --argjson ttl "$TTL" "
    .[\$sid] = (((.[\$sid] // []) | map(select(.agent != \$agent)))
                 + [{ agent: \$agent, mode: \$mode, started: \$now }])
    | $PRUNE
  " "$RUNNING_JSON" > "$RUNNING_JSON.tmp" && mv "$RUNNING_JSON.tmp" "$RUNNING_JSON"
}

del_entry() { # sid agent
  ensure_json
  jq --arg sid "$1" --arg agent "$2" --argjson now "$now" --argjson ttl "$TTL" "
    .[\$sid] = ((.[\$sid] // []) | map(select(.agent != \$agent)))
    | $PRUNE
  " "$RUNNING_JSON" > "$RUNNING_JSON.tmp" && mv "$RUNNING_JSON.tmp" "$RUNNING_JSON"
}

action="${1:-start}"

# --- Acciones directas (trap de check.sh u otros scripts) ---
case "$action" in
  mark-start) add_entry "${2:-__global__}" "${3:-tests}" "${4:-foreground}"; exit 0 ;;
  mark-stop)  del_entry "${2:-__global__}" "${3:-tests}";                     exit 0 ;;
esac

# --- Acciones de hook (leen el JSON del evento por stdin) ---
input=$(cat)

if [ "$action" = "subagent-stop" ]; then
  # SubagentStop no identifica al subagente: desapilamos el último que marcamos.
  [ -f "$STACK" ] || exit 0
  last=$(tail -n 1 "$STACK" 2>/dev/null)
  [ -z "$last" ] && exit 0
  sed -i '$d' "$STACK" 2>/dev/null
  del_entry "${last%%:*}" "${last#*:}"
  exit 0
fi

# action = start (PreToolUse)
tool_name=$(echo "$input" | jq -r '.tool_name // ""')

if [ "$tool_name" = "Agent" ]; then
  subagent=$(echo "$input" | jq -r '.tool_input.subagent_type // ""')
  case "$subagent" in
    asdd-validacion|asdd-seguridad|asdd-accesibilidad) ;;
    *) exit 0 ;;
  esac
  prompt=$(echo "$input" | jq -r '.tool_input.prompt // ""')
  spec_id=$(echo "$prompt" | grep -oE 'specs/[0-9]{3}-' | grep -oE '[0-9]{3}' | head -1)
  [ -z "$spec_id" ] && exit 0
  # Los subagentes de este entorno siempre corren en segundo plano.
  add_entry "$spec_id" "$subagent" "background"
  echo "${spec_id}:${subagent}" >> "$STACK"

elif [ "$tool_name" = "Bash" ]; then
  command=$(echo "$input" | jq -r '.tool_input.command // ""')
  # Solo seguimos check.sh (la puerta de QA): se autodetiene con su trap EXIT.
  ejecuta_check "$command" || exit 0
  bg=$(echo "$input" | jq -r '.tool_input.run_in_background // false')
  [ "$bg" = "true" ] && mode="background" || mode="foreground"
  spec_id=$(echo "$command" | grep -oE 'specs/[0-9]{3}-' | grep -oE '[0-9]{3}' | head -1)
  [ -z "$spec_id" ] && spec_id="__global__"
  add_entry "$spec_id" "tests" "$mode"
fi

exit 0
