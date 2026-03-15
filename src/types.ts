export interface FlowStepApi {
  hasApiCall: boolean
  endpoint?: string
  successShape?: Record<string, unknown>
  errorShape?: Record<string, unknown>
  hasEmptyState: boolean
}

export interface FlowStep {
  order: number
  title: string
  componentName: string
  status: 'exists' | 'missing'
  storyId?: string
  storyVariant?: string
  description?: string
  suggestedComponentName?: string
  suggestedProps?: string[]
  rationale: string
  interaction: string | null
  api: FlowStepApi
}

export interface FixtureEntity {
  name: string
  shape: Record<string, unknown>
}

export interface FlowPlan {
  flowName: string
  fixtures: {
    description: string
    entities: FixtureEntity[]
  }
  steps: FlowStep[]
}

export interface LibraryComponent {
  name: string
  storyId: string
  variants: string[]
  description?: string
  props?: string
  importPath?: string
}

export interface ComponentLibrary {
  source: 'designsync' | 'auto-discovery'
  components: LibraryComponent[]
}

export type PanelState = 'idle' | 'generating' | 'viewing' | 'error'

export type GeneratingPhase = 'analysing-library' | 'decomposing-flow' | 'applying-ux-principles'

export interface PanelError {
  type: 'no-api-key' | 'empty-library' | 'timeout' | 'parse-error' | 'api-error'
  message: string
}
