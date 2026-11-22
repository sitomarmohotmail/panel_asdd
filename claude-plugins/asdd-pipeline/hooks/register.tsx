import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import type { Spec, SpecReport } from '../types'

const PANE = 'asdd-pipeline'

// Resumen por documento de la spec (igual que el panel web: mismo orden y campos).
const DOC_LABELS: Record<string, string> = {
  spec: 'spec', validacion: 'validation', qa: 'qa', seguridad: 'security', accesibilidad: 'accessibility',
}
const DOC_ORDER = ['spec', 'validacion', 'qa', 'seguridad', 'accesibilidad'] as const
const FIELD_LABELS: Record<string, string> = {
  fecha: 'Date', version: 'Spec version', resultado: 'Result', hallazgos: 'Findings',
}
const FIELD_ORDER = ['fecha', 'version', 'resultado', 'hallazgos'] as const

const specsAtom = atom({ plugin: 'asdd-pipeline', key: 'specs' } as const, [] as Spec[], {
  shape: 'specs-2',
})
const filterAtom = atom({ plugin: 'asdd-pipeline', key: 'filter' } as const, null as string | null, {
  shape: 'filter-2',
})
const expandedAtom = atom({ plugin: 'asdd-pipeline', key: 'expanded' } as const, [] as string[], {
  shape: 'expanded-1',
})
const levelFilterAtom = atom({ plugin: 'asdd-pipeline', key: 'levelFilter' } as const, null as string | null, {
  shape: 'levelFilter-1',
})

// ── SVG pipeline diagram ──────────────────────────────────────────────────────

function node(
  x: number, y: number, w: number, h: number,
  label: string, count: number,
  stroke: string, fill: string, textColor: string,
  active: boolean,
): string {
  const sw = active ? '2.5' : '1.5'
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"
    fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
  <text x="${x + w / 2}" y="${y + 20}" text-anchor="middle"
    font-family="system-ui,sans-serif" font-size="9" font-weight="700"
    fill="${textColor}" letter-spacing="0.07em">${label}</text>
  <text x="${x + w / 2}" y="${y + h - 10}" text-anchor="middle"
    font-family="monospace,system-ui" font-size="20" font-weight="700"
    fill="${active ? textColor : stroke}">${count}</text>`
}

// A pipeline state (dynamic): comes from the project's config.json / stack.json.
type PipelineGate = { label: string; note?: string }
type PipelineState = { id: string; label: string; color?: string; gates?: PipelineGate[] }

// Standard ASDD workflow — used when the project defines no `states`.
const DEFAULT_STATES: PipelineState[] = [
  { id: 'draft',       label: 'Draft',       color: '#8898bc' },
  { id: 'approved',    label: 'Approved',    color: '#ffb86c', gates: [{ label: 'validation' }] },
  { id: 'implemented', label: 'Implemented', color: '#50fa7b',
    gates: [{ label: 'tests · qa' }, { label: 'sec · a11y' }] },
]

function arrow(x1: number, x2: number, y: number): string {
  return `<line x1="${x1}" y1="${y}" x2="${x2 - 1}" y2="${y}"
    stroke="#2a3448" stroke-width="1.5" marker-end="url(#arr)"/>`
}

function hexToRgba(hex: string, a: number): string {
  const m = String(hex || '').replace('#', '')
  const n = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const r = parseInt(n.slice(0, 2), 16) || 0
  const g = parseInt(n.slice(2, 4), 16) || 0
  const b = parseInt(n.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}

// Dynamic pipeline: lays out one node per configured state, evenly, with arrows
// (and any declared gate labels) between them. Works for any number of states.
function makePipelineSvg(
  states: PipelineState[],
  counts: Record<string, number>,
  filter: string | null,
): string {
  const W = 700, H = 92
  const ny = 16, nh = 60
  const ay = ny + nh / 2
  const gap = 16
  const n = states.length || 1
  const nw = Math.max(60, (W - 20 - gap * (n - 1)) / n)

  let x = 10
  const parts: string[] = []
  states.forEach((s, i) => {
    const active = filter === s.id
    const fg = s.color || '#5a6888'
    parts.push(node(
      x, ny, nw, nh, (s.label || s.id).toUpperCase(), counts[s.id] || 0,
      fg, hexToRgba(fg, active ? 0.22 : 0.08),
      active ? '#dce3f4' : fg, active,
    ))
    if (i < n - 1) {
      const gates = states[i + 1].gates || []
      parts.push(arrow(x + nw, x + nw + gap, ay))
      if (gates.length) {
        parts.push(`<text x="${x + nw + gap / 2}" y="${ay - 6}" text-anchor="middle"
          font-family="system-ui,sans-serif" font-size="7" fill="#4d5a7a">${
            gates.map(g => g.label).join(' · ')}</text>`)
      }
    }
    x += nw + gap
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5"
      markerWidth="5" markerHeight="5" orient="auto">
      <path d="M0,0 L10,5 L0,10" fill="none" stroke="#2a3448" stroke-width="2"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" rx="12" fill="#090d1b"/>
  ${parts.join('\n')}
</svg>`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseFm(content: string): Record<string, string> {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  const result: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*"?([^"\n]*)"?\s*$/)
    if (kv) result[kv[1].trim()] = kv[2].trim()
  }
  return result
}

// Load the dynamic pipeline states from stack.json (generated from config.json).
// Falls back to the standard ASDD workflow when none are configured.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadStates($: any, stackPath: string): Promise<PipelineState[]> {
  try {
    const raw = await $.fs.read(stackPath)
    const data = JSON.parse(typeof raw === 'string' ? raw : '{}')
    if (Array.isArray(data.states) && data.states.length > 0) {
      return data.states
        .filter((s: PipelineState) => s && s.id)
        .map((s: PipelineState) => ({
          id: String(s.id), label: s.label || String(s.id),
          color: s.color || '', gates: Array.isArray(s.gates) ? s.gates : [],
        }))
    }
  } catch { /* fall back to defaults */ }
  return DEFAULT_STATES
}

// Read the URL recorded by serve-panel.mjs (asdd_tools/.panel-url), i.e. where
// the panel is actually being served. Empty string if not running / not found.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPanelUrl($: any, urlPath: string): Promise<string> {
  try {
    const raw = await $.fs.read(urlPath)
    const data = JSON.parse(typeof raw === 'string' ? raw : '{}')
    return typeof data.url === 'string' ? data.url : ''
  } catch {
    return ''
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSpecs($: any, specsJsonPath: string, specsDirPath: string): Promise<Spec[]> {
  // Intentar leer specs.json (ya incluye gates) desde asdd_tools/
  try {
    const raw = await $.fs.read(specsJsonPath)
    const data = JSON.parse(typeof raw === 'string' ? raw : '[]')
    if (Array.isArray(data) && data.length > 0) {
      return data.map((s: Spec) => ({ ...s, gates: s.gates || [] }))
    }
  } catch { /* fallback a parseo de frontmatter */ }

  // Fallback: parsear frontmatter de cada spec
  try {
    const entries: Array<{ name: string; kind: string }> = await $.fs.list(specsDirPath)
    const specs: Spec[] = []
    for (const entry of entries) {
      const { name } = entry
      if (entry.kind !== 'file') continue
      if (!name.match(/^\d{3}-/)) continue
      if (!name.endsWith('.md')) continue
      if (name.match(/-(qa|validacion|seguridad|accesibilidad)\.md$/)) continue
      const raw = await $.fs.read(`${specsDirPath}/${name}`)
      const text = typeof raw === 'string' ? raw : ''
      const fm = parseFm(text)
      if (!fm.id || !fm.estado) continue
      specs.push({
        id: fm.id,
        titulo: fm.titulo || name.replace(/^\d{3}-/, '').replace(/\.md$/, ''),
        nivel: (fm.nivel as 'S' | 'M' | 'L') || 'S',
        tipo: fm.tipo || '',
        estado: fm.estado,
        version: fm.version || '1.0',
        gates: [],
      })
    }
    return specs.sort((a, b) => a.id.localeCompare(b.id))
  } catch {
    return []
  }
}

// ¿Un texto de hallazgos declara BLOQUEANTES sin resolver?
// Los hallazgos son texto libre tipo "0 BLOQUEANTES · 2 ALTOS · …".
function hallazgoBloqueante(h?: string): boolean {
  const m = String(h || '').match(/(\d+)\s*BLOQUEANTE/i)
  return Boolean(m && Number(m[1]) > 0)
}

// ¿Algún documento de la spec tiene hallazgos BLOQUEANTES sin resolver?
function specBloqueada(spec: Spec): boolean {
  const reports = spec.reports || {}
  return Object.keys(reports).some(k => hallazgoBloqueante(reports[k]?.hallazgos))
}

// ── Colors ────────────────────────────────────────────────────────────────────

const STATE = {
  borrador:     { fg: '#8898bc', bg: '#181d2e', bd: '#44475a' },
  aprobada:     { fg: '#ffb86c', bg: '#1e1a0e', bd: '#7a5428' },
  implementada: { fg: '#50fa7b', bg: '#0d1f16', bd: '#236638' },
} as const

const LEVEL = {
  S: { fg: '#a07aec', bg: '#1a1030', bd: '#3a2558' },
  M: { fg: '#5a86fa', bg: '#0c1428', bd: '#1a2e50' },
  L: { fg: '#f05888', bg: '#220d16', bd: '#481428' },
} as const

// ── Register ──────────────────────────────────────────────────────────────────

export const register: Register = (on, options) => {
  // Specs/paths resolution. The mod runtime has no process.env, but $.fs resolves
  // RELATIVE paths against the current session's working directory (the open
  // project). So:
  //   - If userConfig.specsDir is set (absolute), use absolute paths from it.
  //   - Otherwise use relative paths (specs, asdd_tools/…) → the current project,
  //     with no configuration needed, per-project automatically.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configuredDir: string = (options?.userConfig as any)?.specsDir || ''
  const base: string = configuredDir.replace(/\/specs\/?$/, '') // absolute root, or '' if not configured
  const specsDirPath: string = configuredDir || 'specs'
  const specsJsonPath: string = base ? `${base}/asdd_tools/specs.json` : 'asdd_tools/specs.json'
  const stackJsonPath: string = base ? `${base}/asdd_tools/stack.json` : 'asdd_tools/stack.json'
  const panelUrlPath: string = base ? `${base}/asdd_tools/.panel-url` : 'asdd_tools/.panel-url'
  // Panel URL resolution (the plugin cannot probe the server, so):
  //   1. userConfig.panelUrl, if set explicitly;
  //   2. the URL recorded by serve-panel.mjs in asdd_tools/.panel-url (where it
  //      was last served — follows the running Node server and its port);
  //   3. the Node default below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userPanelUrl: string = (options?.userConfig as any)?.panelUrl || ''
  const defaultPanelUrl = 'http://localhost:8777/asdd_tools/index.html'

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'asdd_dashboard',
      description: 'Open the visual ASDD specs panel',
    })
    const specs = await loadSpecs($, specsJsonPath, specsDirPath)
    await update($, specsAtom, () => specs)
    return next(e)
  })

  on('command.run', { command: 'asdd_dashboard' }, async ($) => {
    const specs = await loadSpecs($, specsJsonPath, specsDirPath)
    await update($, specsAtom, () => specs)
    await $.ui.open({ id: PANE, title: 'ASDD Dashboard' })
    return { text: 'ASDD panel opened.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const panes = await $.ui.panes()
    const isOpen = panes.some(p => p.id === PANE)
    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Button
          label={isOpen ? '⬡ ASDD ▼' : '⬡ ASDD'}
          variant={isOpen ? 'primary' : 'secondary'}
          onPress={async () => {
            if (isOpen) {
              await $.ui.close({ id: PANE })
            } else {
              const specs = await loadSpecs($, specsJsonPath, specsDirPath)
              await update($, specsAtom, () => specs)
              await $.ui.open({ id: PANE, title: 'ASDD Dashboard' })
            }
          }}
        />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    // specsDir captured from closure
    const { Box, Text, Button, Svg, Link } = $.ui.resolve(e)
    const specs = await read($, specsAtom)
    const filter = await read($, filterAtom)
    const levelFilter = await read($, levelFilterAtom)
    const expandedList = await read($, expandedAtom)
    const expanded = new Set(expandedList)
    const toggleCollapse = (id: string) =>
      update($, expandedAtom, list =>
        list.includes(id) ? list.filter(x => x !== id) : [...list, id]
      )

    // Dynamic states: from the project's config.json (via stack.json).
    const states = await loadStates($, stackJsonPath)
    // Where to open the full panel: explicit config > last served (Node) > default.
    const recordedUrl = await loadPanelUrl($, panelUrlPath)
    const panelUrl = userPanelUrl || recordedUrl || defaultPanelUrl

    // Header label: derived from the configured path when set, else generic
    // (the mod runtime exposes no cwd value to read; files use relative paths).
    const projectName = base.split('/').filter(Boolean).pop() || 'project'

    const counts: Record<string, number> = {}
    for (const st of states) counts[st.id] = specs.filter(s => s.estado === st.id).length

    const levelCounts: Record<string, number> = { S: 0, M: 0, L: 0 }
    for (const s of specs) levelCounts[s.nivel] = (levelCounts[s.nivel] ?? 0) + 1

    const filtered = specs
      .filter(s => !filter      || s.estado === filter)
      .filter(s => !levelFilter || s.nivel  === levelFilter)
      .sort((a: Spec, b: Spec) => b.id.localeCompare(a.id)) // id descendente: la más reciente primero
    const setFilter      = (s: string) => update($, filterAtom,      f => (f === s ? null : s))
    const setLevelFilter = (n: string) => update($, levelFilterAtom, f => (f === n ? null : n))

    type Estado = keyof typeof STATE
    type Nivel  = keyof typeof LEVEL

    // Card colours: use the configured state colour, falling back to the built-in palette.
    const sc = (id: string) => {
      const st = states.find(x => x.id === id)
      if (st && st.color) return { fg: st.color, bg: hexToRgba(st.color, 0.12), bd: hexToRgba(st.color, 0.4) }
      return STATE[id as Estado] ?? STATE.borrador
    }
    const lc = (n: string) => LEVEL[n as Nivel]  ?? LEVEL.S

    return (
      <Box flexDirection="column" gap={2} paddingX={1} paddingY={1}>

        {/* ── Header ── */}
        <Box flexDirection="row" gap={2} alignItems="center">
          <Text bold color="#dce3f4">ASDD Dashboard</Text>
          <Text dimColor>{projectName} · {specs.length} specs</Text>
          {filter      && <Text color="#d4910f">· {states.find(s => s.id === filter)?.label ?? filter}</Text>}
          {levelFilter && <Text color={LEVEL[levelFilter as keyof typeof LEVEL]?.fg ?? '#dce3f4'}>· level {levelFilter}</Text>}
        </Box>

        {/* ── Aviso: no se encontraron specs ── */}
        {specs.length === 0 && (
          <Box flexDirection="column" gap={1} borderStyle="round" borderColor="#d4910f" paddingX={2} paddingY={1}>
            <Text color="#d4910f" bold>⚠ No specs found</Text>
            <Text color="#8898bc">Looked in: {specsDirPath}/ (relative to the open project)</Text>
            <Text color="#8898bc">Add a spec (NNN-*.md) there, or point elsewhere with:</Text>
            <Text color="#f8f8f2">  claude plugin configure asdd-pipeline@sitomarmohotmail</Text>
          </Box>
        )}

        {/* ── SVG pipeline diagram (dynamic states) ── */}
        <Svg
          source={makePipelineSvg(states, counts, filter)}
          alt={`ASDD pipeline: ${states.map(s => s.label).join(' → ')}`}
        />

        {/* ── Filter chips: estado ── */}
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            {states.map(st => (
              <Button
                key={`f-${st.id}`}
                label={`${st.label} ${counts[st.id] ?? 0}`}
                variant={filter === st.id ? 'primary' : 'secondary'}
                onPress={() => setFilter(st.id)}
              />
            ))}
          </Box>

          {/* ── Filter chips: nivel ── */}
          <Box flexDirection="row" gap={1} alignItems="center" flexWrap="wrap">
            {(['S', 'M', 'L'] as Nivel[]).map(n => {
              const lc2 = LEVEL[n]
              return (
                <Button
                  key={`fn-${n}`}
                  label={`${n} ${levelCounts[n] ?? 0}`}
                  variant={levelFilter === n ? 'primary' : 'secondary'}
                  onPress={() => setLevelFilter(n)}
                />
              )
            })}
            <Text dimColor>  S=no agents · M=validation · L=sec+a11y</Text>
          </Box>

          {/* ── Limpiar filtros ── */}
          {(filter || levelFilter) && (
            <Box flexDirection="row" gap={1}>
              <Button
                key="f-clear"
                label="Clear filters"
                onPress={() => {
                  void update($, filterAtom,      () => null)
                  void update($, levelFilterAtom, () => null)
                }}
              />
            </Box>
          )}
        </Box>

        {/* ── Spec cards ── */}
        {filtered.length === 0 && (
          <Text dimColor>  (sin specs en este estado)</Text>
        )}
        {filtered.map(spec => {
          const s = sc(spec.estado)
          const l = lc(spec.nivel)
          const blocked = specBloqueada(spec)

          // Puertas de calidad que aplican a esta spec
          const allGates: Array<{ key: string; label: string }> = []
          if (spec.nivel !== 'S') allGates.push({ key: 'val',  label: 'val' })
          allGates.push({ key: 'qa', label: 'qa' })
          if (spec.nivel === 'L') allGates.push({ key: 'seg',  label: 'seg' })
          if (spec.nivel === 'L') allGates.push({ key: 'a11y', label: 'a11y' })
          const doneGates = new Set(spec.gates || [])

          // Track steps: borrador=1, aprobada=2, implementada=3
          const step = spec.estado === 'implementada' ? 3 : spec.estado === 'aprobada' ? 2 : 1
          const stepChar = (n: number) => n <= step ? '█' : '░'
          const stepColor = (n: number) => n <= step ? '#0ea567' : '#c8d0e0'

          const isCollapsed = !expanded.has(spec.id)

          return (
            <Box
              key={spec.id}
              flexDirection="column"
              gap={1}
              borderStyle="round"
              borderColor={blocked ? '#ff5555' : s.bd}
              backgroundColor={s.bg}
              paddingX={2}
              paddingY={1}
            >
              {/* ── card-top: id — version — tipo  |  nivel  toggle ── */}
              <Box flexDirection="column" gap={0}>
                <Box flexDirection="row" alignItems="center" gap={1} flexWrap="wrap">
                  {blocked && <Text bold color="#ff5555">⛔</Text>}
                  <Text bold color="#dce3f4">{spec.id} — v{spec.version}</Text>
                  {spec.tipo ? <Text bold color="#dce3f4">— {spec.tipo}</Text> : null}
                  <Box flexGrow={1} />
                  {/* Nivel badge */}
                  <Box borderStyle="single" borderColor={l.bd} backgroundColor={l.bg} paddingX={1}>
                    <Text bold color={l.fg}>{spec.nivel}</Text>
                  </Box>
                  {/* Toggle */}
                  <Button
                    key={`toggle-${spec.id}`}
                    label={isCollapsed ? '▶' : '▼'}
                    variant="secondary"
                    onPress={() => toggleCollapse(spec.id)}
                  />
                </Box>
                {/* Puertas de calidad */}
                <Box flexDirection="row" gap={1} flexWrap="wrap">
                  {allGates.map(g => (
                    <Text key={g.key} bold color={doneGates.has(g.key) ? '#50fa7b' : '#dce3f4'}>
                      {doneGates.has(g.key) ? '✓' : '○'}{g.label}
                    </Text>
                  ))}
                </Box>
              </Box>

              {/* ── card-title + progress (ocultos si contraído) ── */}
              {!isCollapsed && (
                <>
                  <Text color="#dce3f4">{spec.titulo}</Text>

                  {/* ── card-track: pipeline progress bar ── */}
                  <Box flexDirection="row" alignItems="center" gap={0}>
                    <Text color={stepColor(1)}>{stepChar(1)}</Text>
                    <Text color="#c8d0e0">─</Text>
                    <Text color={stepColor(2)}>{stepChar(2)}</Text>
                    <Text color="#c8d0e0">─</Text>
                    <Text color={stepColor(3)}>{stepChar(3)}</Text>
                    <Text color="#c8d0e0">   </Text>
                    <Text color={s.fg}>● {spec.estado}</Text>
                  </Box>

                  {/* ── card-meta: resumen por documento (Fecha · Versión · Resultado · Hallazgos) ── */}
                  {(() => {
                    const reports = spec.reports || {}
                    const docs = DOC_ORDER.filter(k => reports[k])
                    if (docs.length === 0) return null
                    return (
                      <Box flexDirection="column" gap={1} marginTop={1}>
                        {docs.map(k => {
                          const r: SpecReport = reports[k]
                          const fields = FIELD_ORDER.filter(f => r[f])
                          const docBlocked = hallazgoBloqueante(r.hallazgos)
                          return (
                            <Box key={k} flexDirection="column" gap={0}>
                              <Text bold color={docBlocked ? '#ff5555' : '#8fa3c8'}>
                                {docBlocked ? '⛔ ' : ''}{DOC_LABELS[k]}
                              </Text>
                              {fields.map(f => (
                                <Box key={f} flexDirection="row" gap={1}>
                                  <Text dimColor>{FIELD_LABELS[f]}:</Text>
                                  <Text color={f === 'hallazgos' && docBlocked ? '#ff5555' : '#c8d0e0'}>
                                    {r[f]}
                                  </Text>
                                </Box>
                              ))}
                            </Box>
                          )
                        })}
                      </Box>
                    )
                  })()}
                </>
              )}
            </Box>
          )
        })}

        {/* ── Acciones ── */}
        <Box flexDirection="row" gap={2} alignItems="center" marginTop={1}>
          <Button
            key="refresh"
            label="↺ Refresh specs"
            onPress={async () => {
              const fresh = await loadSpecs($, specsJsonPath, specsDirPath)
              await update($, specsAtom, () => fresh)
            }}
          />
          {panelUrl && (
            <Link href={panelUrl}>
              <Text color="#5a86fa">⬡ Full panel</Text>
            </Link>
          )}
        </Box>

      </Box>
    )
  })
}
