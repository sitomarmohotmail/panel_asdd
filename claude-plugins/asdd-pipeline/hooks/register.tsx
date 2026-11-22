import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import type { Spec, SpecReport } from '../types'

const PANE = 'asdd-pipeline'
// Sin ruta por defecto: el plugin es portable. Configúralo con
//   claude plugin configure asdd-pipeline
// e indica la ruta absoluta a tu directorio specs/.
const DEFAULT_SPECS_DIR = ''

// Resumen por documento de la spec (igual que el panel web: mismo orden y campos).
const DOC_LABELS: Record<string, string> = {
  spec: 'spec', validacion: 'validación', qa: 'qa', seguridad: 'seguridad', accesibilidad: 'accesibilidad',
}
const DOC_ORDER = ['spec', 'validacion', 'qa', 'seguridad', 'accesibilidad'] as const
const FIELD_LABELS: Record<string, string> = {
  fecha: 'Fecha', version: 'Versión de la spec', resultado: 'Resultado', hallazgos: 'Hallazgos',
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

function gate(x: number, y: number, w: number, h: number, lines: string[]): string {
  const mid = x + w / 2
  const lineH = 11
  const startY = y + (h - lines.length * lineH) / 2 + lineH - 2
  const textEls = lines
    .map((l, i) => `<text x="${mid}" y="${startY + i * lineH}" text-anchor="middle"
      font-family="system-ui,sans-serif" font-size="8.5" fill="#4d5a7a">${l}</text>`)
    .join('\n')
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.round(h / 2)}"
    fill="none" stroke="#262f47" stroke-width="1" stroke-dasharray="4,3"/>
  ${textEls}`
}

function arrow(x1: number, x2: number, y: number): string {
  return `<line x1="${x1}" y1="${y}" x2="${x2 - 1}" y2="${y}"
    stroke="#2a3448" stroke-width="1.5" marker-end="url(#arr)"/>`
}

function makePipelineSvg(
  counts: { borrador: number; aprobada: number; implementada: number },
  filter: string | null,
): string {
  // Layout constants
  const W = 700, H = 92
  const ny = 16, nh = 60       // node y, height
  const gy = 28, gh = 36       // gate y, height
  const ay = ny + nh / 2       // arrow y (node center)

  // Node x positions
  const n1x = 10,  n1w = 118
  const g1x = 148, g1w = 82
  const n2x = 250, n2w = 124
  const g2x = 394, g2w = 94
  const n3x = 508, n3w = 182

  const aFill  = (s: string) => filter === s ? '0.22' : '0.08'
  const aSW    = (s: string) => filter === s ? '2.5' : '1.5'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5"
      markerWidth="5" markerHeight="5" orient="auto">
      <path d="M0,0 L10,5 L0,10" fill="none" stroke="#2a3448" stroke-width="2"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" rx="12" fill="#090d1b"/>

  ${node(n1x, ny, n1w, nh, 'BORRADOR', counts.borrador,
    '#5a6888', `rgba(90,106,136,${aFill('borrador')})`,
    filter === 'borrador' ? '#c8d8f8' : '#8898bc', filter === 'borrador')}

  ${arrow(n1x + n1w, g1x, ay)}
  ${gate(g1x, gy, g1w, gh, ['val · M/L'])}
  ${arrow(g1x + g1w, n2x, ay)}

  ${node(n2x, ny, n2w, nh, 'APROBADA', counts.aprobada,
    '#d4910f', `rgba(212,145,15,${aFill('aprobada')})`,
    filter === 'aprobada' ? '#ffd070' : '#d4910f', filter === 'aprobada')}

  ${arrow(n2x + n2w, g2x, ay)}
  ${gate(g2x, gy - 6, g2w, gh + 12, ['tests · qa', 'seg · a11y L'])}
  ${arrow(g2x + g2w, n3x, ay)}

  ${node(n3x, ny, n3w, nh, 'IMPLEMENTADA', counts.implementada,
    '#0ea567', `rgba(14,163,104,${aFill('implementada')})`,
    filter === 'implementada' ? '#6eebc4' : '#0ea567', filter === 'implementada')}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSpecs($: any, specsDir: string): Promise<Spec[]> {
  // Intentar leer specs.json (ya incluye gates) desde asdd_tools/
  try {
    const jsonPath = specsDir.replace(/\/specs$/, '/asdd_tools/specs.json')
    const raw = await $.fs.read(jsonPath)
    const data = JSON.parse(typeof raw === 'string' ? raw : '[]')
    if (Array.isArray(data) && data.length > 0) {
      return data.map((s: Spec) => ({ ...s, gates: s.gates || [] }))
    }
  } catch { /* fallback a parseo de frontmatter */ }

  // Fallback: parsear frontmatter de cada spec
  try {
    const entries: Array<{ name: string; kind: string }> = await $.fs.list(specsDir)
    const specs: Spec[] = []
    for (const entry of entries) {
      const { name } = entry
      if (entry.kind !== 'file') continue
      if (!name.match(/^\d{3}-/)) continue
      if (!name.endsWith('.md')) continue
      if (name.match(/-(qa|validacion|seguridad|accesibilidad)\.md$/)) continue
      const raw = await $.fs.read(`${specsDir}/${name}`)
      const text = typeof raw === 'string' ? raw : ''
      const fm = parseFm(text)
      if (!fm.id || !fm.estado) continue
      specs.push({
        id: fm.id,
        titulo: fm.titulo || name.replace(/^\d{3}-/, '').replace(/\.md$/, ''),
        nivel: (fm.nivel as 'S' | 'M' | 'L') || 'S',
        tipo: fm.tipo || '',
        estado: fm.estado as 'borrador' | 'aprobada' | 'implementada',
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configuredDir: string = (options?.userConfig as any)?.specsDir || ''
  const specsDir: string = configuredDir || DEFAULT_SPECS_DIR
  const isConfigured: boolean = Boolean(configuredDir)
  const projectName: string = specsDir.replace(/\/specs\/?$/, '').split('/').filter(Boolean).pop() || 'panel_asdd'
  const rootDir: string = specsDir.replace(/\/specs\/?$/, '')
  const defaultPanelUrl: string = `https://${projectName}.local/asdd_tools/index.html`
  const panelUrl: string = (options?.userConfig as any)?.panelUrl || defaultPanelUrl

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'asdd_dashboard',
      description: 'Abrir el panel visual de specs ASDD',
    })
    const specs = await loadSpecs($, specsDir)
    await update($, specsAtom, () => specs)
    return next(e)
  })

  on('command.run', { command: 'asdd_dashboard' }, async ($) => {
    const specs = await loadSpecs($, specsDir)
    await update($, specsAtom, () => specs)
    await $.ui.open({ id: PANE, title: 'ASDD Dashboard' })
    return { text: 'Panel ASDD abierto.' }
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
              const specs = await loadSpecs($, specsDir)
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

    const counts = {
      borrador:     specs.filter(s => s.estado === 'borrador').length,
      aprobada:     specs.filter(s => s.estado === 'aprobada').length,
      implementada: specs.filter(s => s.estado === 'implementada').length,
    }
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

    const sc = (s: string) => STATE[s as Estado] ?? STATE.borrador
    const lc = (n: string) => LEVEL[n as Nivel]  ?? LEVEL.S

    return (
      <Box flexDirection="column" gap={2} paddingX={1} paddingY={1}>

        {/* ── Header ── */}
        <Box flexDirection="row" gap={2} alignItems="center">
          <Text bold color="#dce3f4">ASDD Dashboard</Text>
          <Text dimColor>{projectName} · {specs.length} specs</Text>
          {filter      && <Text color="#d4910f">· {filter}</Text>}
          {levelFilter && <Text color={LEVEL[levelFilter as keyof typeof LEVEL]?.fg ?? '#dce3f4'}>· nivel {levelFilter}</Text>}
        </Box>

        {/* ── Aviso de configuración pendiente (solo si no cargó specs) ── */}
        {!isConfigured && specs.length === 0 && (
          <Box flexDirection="column" gap={1} borderStyle="round" borderColor="#d4910f" paddingX={2} paddingY={1}>
            <Text color="#d4910f" bold>⚠ Plugin sin configurar</Text>
            <Text color="#8898bc">Ejecuta en la terminal:</Text>
            <Text color="#f8f8f2">  claude plugin configure asdd-pipeline</Text>
            <Text color="#8898bc">e introduce la ruta a tu directorio specs/.</Text>
          </Box>
        )}

        {/* ── SVG pipeline diagram ── */}
        <Svg
          source={makePipelineSvg(counts, filter)}
          alt="Pipeline ASDD: Borrador → Aprobada → Implementada"
        />

        {/* ── Filter chips: estado ── */}
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            {(['borrador', 'aprobada', 'implementada'] as Estado[]).map(s => (
              <Button
                key={`f-${s}`}
                label={`${s} ${counts[s]}`}
                variant={filter === s ? 'primary' : 'secondary'}
                onPress={() => setFilter(s)}
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
            <Text dimColor>  S=sin agentes · M=validación · L=seg+a11y</Text>
          </Box>

          {/* ── Limpiar filtros ── */}
          {(filter || levelFilter) && (
            <Box flexDirection="row" gap={1}>
              <Button
                key="f-clear"
                label="Limpiar filtros"
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
            label="↺ Actualizar specs"
            onPress={async () => {
              const fresh = await loadSpecs($, specsDir)
              await update($, specsAtom, () => fresh)
            }}
          />
          {panelUrl && (
            <Link href={panelUrl}>
              <Text color="#5a86fa">⬡ Panel completo</Text>
            </Link>
          )}
        </Box>

      </Box>
    )
  })
}
