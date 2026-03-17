export interface FlowStepApi {
  hasApiCall: boolean
  endpoint?: string
  successShape?: Record<string, unknown>
  errorShape?: Record<string, unknown>
  hasEmptyState: boolean
}

export interface LayoutNode {
  component: string // component name from library, or "div"/"h2"/"p" for basic HTML
  props?: Record<string, unknown>
  children?: (LayoutNode | string)[] // nested components or text content
}

export interface FlowStep {
  order: number
  title: string
  layout: LayoutNode[]
  componentsUsed: string[]
  status: 'complete' | 'partial'
  missingComponents?: string[]
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
