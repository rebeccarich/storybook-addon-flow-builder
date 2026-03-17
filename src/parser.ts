import type { ComponentLibrary, FlowPlan, FlowStep, LayoutNode } from './types'

const HTML_ELEMENTS = new Set([
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'form',
  'section',
  'header',
  'footer',
  'main',
  'nav',
  'ul',
  'ol',
  'li',
  'hr',
  'br',
  'img',
  'a',
  'label',
  'input',
  'button',
  'textarea',
  'select',
  'option'
])

export function parseFlowPlan(
  raw: string,
  validStoryIds: Set<string>,
  library?: ComponentLibrary
): FlowPlan {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Failed to parse JSON response: ${cleaned.slice(0, 200)}...`)
  }

  const plan = parsed as FlowPlan

  if (!plan.flowName || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    throw new Error('Invalid flow plan: missing flowName or steps')
  }

  if (!plan.fixtures) {
    plan.fixtures = { description: '', entities: [] }
  }

  const libraryNames = new Set(library?.components.map((c) => c.name) ?? [])

  plan.steps = plan.steps.map((step) => validateStep(step, validStoryIds, libraryNames))

  return plan
}

function validateStep(
  step: FlowStep,
  validStoryIds: Set<string>,
  libraryNames: Set<string>
): FlowStep {
  // Ensure layout is an array
  if (!Array.isArray(step.layout)) {
    step.layout = []
  }

  // Walk the layout tree to collect actual components used
  const foundComponents = new Set<string>()
  walkLayoutTree(step.layout, foundComponents)

  // Build accurate componentsUsed (only library components, no HTML elements)
  step.componentsUsed = Array.from(foundComponents)

  // Determine missing components — those in the layout but not in the library
  const missing: string[] = []
  for (const name of foundComponents) {
    if (!libraryNames.has(name)) {
      // Try fuzzy match against library names
      const match = findClosestName(name, libraryNames)
      if (match) {
        // Fix the name in the layout tree
        renameInLayoutTree(step.layout, name, match)
        // Update the found set
        foundComponents.delete(name)
        foundComponents.add(match)
      } else {
        missing.push(name)
      }
    }
  }

  // Rebuild componentsUsed after potential renames
  step.componentsUsed = Array.from(foundComponents)

  // Set status and missingComponents
  if (missing.length > 0) {
    step.status = 'partial'
    step.missingComponents = missing
  } else {
    step.status = 'complete'
    delete step.missingComponents
  }

  if (!step.api) {
    step.api = { hasApiCall: false, hasEmptyState: false }
  }

  if (step.api.hasApiCall && (!step.api.endpoint || !step.api.successShape)) {
    step.api.hasApiCall = false
  }

  return step
}

function walkLayoutTree(nodes: (LayoutNode | string)[], found: Set<string>): void {
  for (const node of nodes) {
    if (typeof node === 'string') continue
    if (!HTML_ELEMENTS.has(node.component)) {
      found.add(node.component)
    }
    if (Array.isArray(node.children)) {
      walkLayoutTree(node.children, found)
    }
  }
}

function renameInLayoutTree(
  nodes: (LayoutNode | string)[],
  oldName: string,
  newName: string
): void {
  for (const node of nodes) {
    if (typeof node === 'string') continue
    if (node.component === oldName) {
      node.component = newName
    }
    if (Array.isArray(node.children)) {
      renameInLayoutTree(node.children, oldName, newName)
    }
  }
}

function findClosestName(target: string, validNames: Set<string>): string | null {
  const normalised = target.toLowerCase()
  for (const name of validNames) {
    if (name.toLowerCase() === normalised) {
      return name
    }
  }
  return null
}
