import { describe, expect, it } from 'vitest'
import { parseFlowPlan } from './parser'
import type { ComponentLibrary } from './types'

const library: ComponentLibrary = {
  source: 'auto-discovery',
  components: [
    { name: 'Button', storyId: 'components-button--primary', variants: ['Primary'] },
    { name: 'TextInput', storyId: 'components-textinput--default', variants: ['Default'] },
    { name: 'Alert', storyId: 'components-alert--info', variants: ['Info'] },
    { name: 'FormField', storyId: 'components-formfield--default', variants: ['Default'] }
  ]
}

const storyIds = new Set(library.components.map((c) => c.storyId))

function makePlan(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    flowName: 'TestFlow',
    fixtures: { description: 'test', entities: [] },
    steps: [
      {
        order: 1,
        title: 'Step One',
        layout: [
          {
            component: 'div',
            props: { style: { padding: 16 } },
            children: [
              {
                component: 'FormField',
                props: { label: 'Email' },
                children: [{ component: 'TextInput', props: { type: 'email' } }]
              },
              { component: 'Button', props: { label: 'Submit', primary: true } }
            ]
          }
        ],
        componentsUsed: ['FormField', 'TextInput', 'Button'],
        status: 'complete',
        rationale: 'Test rationale',
        interaction: 'clicks submit',
        api: { hasApiCall: false, hasEmptyState: false }
      }
    ],
    ...overrides
  })
}

describe('parseFlowPlan', () => {
  it('parses a valid plan', () => {
    const plan = parseFlowPlan(makePlan(), storyIds, library)
    expect(plan.flowName).toBe('TestFlow')
    expect(plan.steps).toHaveLength(1)
    expect(plan.steps[0].title).toBe('Step One')
  })

  it('strips markdown code fences', () => {
    const raw = '```json\n' + makePlan() + '\n```'
    const plan = parseFlowPlan(raw, storyIds, library)
    expect(plan.flowName).toBe('TestFlow')
  })

  it('throws on invalid JSON', () => {
    expect(() => parseFlowPlan('not json', storyIds, library)).toThrow('Failed to parse JSON')
  })

  it('throws on missing flowName', () => {
    expect(() =>
      parseFlowPlan(JSON.stringify({ steps: [{ order: 1 }] }), storyIds, library)
    ).toThrow('missing flowName or steps')
  })

  it('throws on empty steps', () => {
    expect(() =>
      parseFlowPlan(JSON.stringify({ flowName: 'X', steps: [] }), storyIds, library)
    ).toThrow('missing flowName or steps')
  })

  it('defaults fixtures when missing', () => {
    const raw = JSON.stringify({
      flowName: 'X',
      steps: [
        {
          order: 1,
          title: 'A',
          layout: [],
          componentsUsed: [],
          status: 'complete',
          rationale: 'r',
          interaction: null,
          api: { hasApiCall: false, hasEmptyState: false }
        }
      ]
    })
    const plan = parseFlowPlan(raw, storyIds, library)
    expect(plan.fixtures).toEqual({ description: '', entities: [] })
  })

  it('extracts componentsUsed from layout tree, excluding HTML elements', () => {
    const plan = parseFlowPlan(makePlan(), storyIds, library)
    const step = plan.steps[0]
    expect(step.componentsUsed).toContain('Button')
    expect(step.componentsUsed).toContain('TextInput')
    expect(step.componentsUsed).toContain('FormField')
    expect(step.componentsUsed).not.toContain('div')
  })

  it('sets status to complete when all components exist', () => {
    const plan = parseFlowPlan(makePlan(), storyIds, library)
    expect(plan.steps[0].status).toBe('complete')
    expect(plan.steps[0].missingComponents).toBeUndefined()
  })

  it('sets status to partial for unknown components', () => {
    const raw = JSON.stringify({
      flowName: 'X',
      fixtures: { description: '', entities: [] },
      steps: [
        {
          order: 1,
          title: 'A',
          layout: [{ component: 'MagicWidget', props: {} }],
          componentsUsed: ['MagicWidget'],
          status: 'complete',
          rationale: 'r',
          interaction: null,
          api: { hasApiCall: false, hasEmptyState: false }
        }
      ]
    })
    const plan = parseFlowPlan(raw, storyIds, library)
    expect(plan.steps[0].status).toBe('partial')
    expect(plan.steps[0].missingComponents).toEqual(['MagicWidget'])
  })

  it('fixes case-insensitive component name mismatches', () => {
    // 'textinput' (lowercase) should match 'TextInput' in the library
    const raw2 = JSON.stringify({
      flowName: 'X',
      fixtures: { description: '', entities: [] },
      steps: [
        {
          order: 1,
          title: 'A',
          layout: [{ component: 'textinput', props: { type: 'email' } }],
          componentsUsed: ['textinput'],
          status: 'complete',
          rationale: 'r',
          interaction: null,
          api: { hasApiCall: false, hasEmptyState: false }
        }
      ]
    })
    const plan = parseFlowPlan(raw2, storyIds, library)
    expect(plan.steps[0].componentsUsed).toContain('TextInput')
    expect(plan.steps[0].status).toBe('complete')
  })

  it('defaults api when missing', () => {
    const raw = JSON.stringify({
      flowName: 'X',
      fixtures: { description: '', entities: [] },
      steps: [
        {
          order: 1,
          title: 'A',
          layout: [],
          componentsUsed: [],
          status: 'complete',
          rationale: 'r',
          interaction: null
        }
      ]
    })
    const plan = parseFlowPlan(raw, storyIds, library)
    expect(plan.steps[0].api).toEqual({ hasApiCall: false, hasEmptyState: false })
  })

  it('disables hasApiCall when endpoint/successShape missing', () => {
    const raw = JSON.stringify({
      flowName: 'X',
      fixtures: { description: '', entities: [] },
      steps: [
        {
          order: 1,
          title: 'A',
          layout: [],
          componentsUsed: [],
          status: 'complete',
          rationale: 'r',
          interaction: null,
          api: { hasApiCall: true, hasEmptyState: false }
        }
      ]
    })
    const plan = parseFlowPlan(raw, storyIds, library)
    expect(plan.steps[0].api.hasApiCall).toBe(false)
  })

  it('defaults layout to empty array when not provided', () => {
    const raw = JSON.stringify({
      flowName: 'X',
      fixtures: { description: '', entities: [] },
      steps: [
        {
          order: 1,
          title: 'A',
          componentsUsed: [],
          status: 'complete',
          rationale: 'r',
          interaction: null,
          api: { hasApiCall: false, hasEmptyState: false }
        }
      ]
    })
    const plan = parseFlowPlan(raw, storyIds, library)
    expect(plan.steps[0].layout).toEqual([])
  })
})
