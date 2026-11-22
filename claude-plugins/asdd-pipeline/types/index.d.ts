export type SpecReport = {
  fecha?: string
  version?: string
  resultado?: string
  hallazgos?: string
  estado?: string
}

export type Spec = {
  id: string
  titulo: string
  nivel: 'S' | 'M' | 'L'
  tipo: string
  estado: 'borrador' | 'aprobada' | 'implementada'
  version: string
  gates: string[]
  reports?: Record<string, SpecReport>
}

declare module 'claude-code' {
  interface PluginState {
    'asdd-pipeline': {
      specs: Shaped<Spec[]>
      filter: Shaped<string | null>
      expanded: Shaped<string[]>
      levelFilter: Shaped<string | null>
    }
  }
}
