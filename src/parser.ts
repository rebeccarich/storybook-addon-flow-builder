import type { FlowPlan, FlowStep } from './types'

export function parseFlowPlan(raw: string, validStoryIds: Set<string>): FlowPlan {
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

  plan.steps = plan.steps.map((step) => validateStep(step, validStoryIds))

  return plan
}

function validateStep(step: FlowStep, validStoryIds: Set<string>): FlowStep {
  if (step.status === 'exists' && step.storyId) {
    if (!validStoryIds.has(step.storyId)) {
      // Try case-insensitive match
      const match = findClosestStoryId(step.storyId, validStoryIds)
      if (match) {
        step.storyId = match
      } else {
        // Downgrade to missing — Claude hallucinated the storyId
        step.status = 'missing'
        step.description =
          step.description ??
          `Component "${step.componentName}" — storyId "${step.storyId}" not found in library`
        delete step.storyId
        delete step.storyVariant
      }
    }
  }

  if (!step.api) {
    step.api = { hasApiCall: false, hasEmptyState: false }
  }

  if (step.api.hasApiCall && (!step.api.endpoint || !step.api.successShape)) {
    step.api.hasApiCall = false
  }

  return step
}

function findClosestStoryId(target: string, validIds: Set<string>): string | null {
  const normalised = target.toLowerCase().replace(/[-_]/g, '')
  for (const id of validIds) {
    if (id.toLowerCase().replace(/[-_]/g, '') === normalised) {
      return id
    }
  }
  return null
}
