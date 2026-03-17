import { describe, expect, it } from 'vitest'
import {
  toPascalCase,
  toVariableName,
  generateFixturesFile,
  generateMocksFile,
  generateStoriesFile
} from './generate'
import type { ComponentLibrary, FlowPlan } from './types'

describe('toPascalCase', () => {
  it('converts hyphenated strings', () => {
    expect(toPascalCase('sign-up-form')).toBe('SignUpForm')
  })

  it('converts space-separated strings', () => {
    expect(toPascalCase('login flow')).toBe('LoginFlow')
  })

  it('handles single word', () => {
    expect(toPascalCase('dashboard')).toBe('Dashboard')
  })

  it('handles already PascalCase', () => {
    expect(toPascalCase('LoginFlow')).toBe('LoginFlow')
  })
})

describe('toVariableName', () => {
  it('converts to camelCase', () => {
    expect(toVariableName('user profile')).toBe('userProfile')
  })

  it('lowercases first character', () => {
    expect(toVariableName('Dashboard')).toBe('dashboard')
  })
})

const makePlan = (overrides: Partial<FlowPlan> = {}): FlowPlan => ({
  flowName: 'TestFlow',
  fixtures: {
    description: 'Test fixtures',
    entities: [{ name: 'user', shape: { id: 'u_1', email: 'test@example.com' } }]
  },
  steps: [
    {
      order: 1,
      title: 'Login Form',
      layout: [
        {
          component: 'div',
          props: { style: { padding: 16 } },
          children: [
            { component: 'TextInput', props: { type: 'email', placeholder: 'Email' } },
            { component: 'Button', props: { label: 'Sign In', primary: true } }
          ]
        }
      ],
      componentsUsed: ['TextInput', 'Button'],
      status: 'complete',
      rationale: 'Test rationale',
      interaction: 'clicks sign in',
      api: {
        hasApiCall: true,
        endpoint: 'POST /api/login',
        successShape: { token: 'jwt' },
        errorShape: { message: 'Invalid credentials' },
        hasEmptyState: false
      }
    },
    {
      order: 2,
      title: 'Welcome Page',
      layout: [{ component: 'h2', children: ['Welcome!'] }],
      componentsUsed: [],
      status: 'complete',
      rationale: 'Test rationale 2',
      interaction: null,
      api: { hasApiCall: false, hasEmptyState: false }
    }
  ],
  ...overrides
})

describe('generateFixturesFile', () => {
  it('generates fixture interfaces and constants', () => {
    const output = generateFixturesFile(makePlan())
    expect(output).toContain('export interface User')
    expect(output).toContain('export const user')
    expect(output).toContain('test@example.com')
  })

  it('includes description comment', () => {
    const output = generateFixturesFile(makePlan())
    expect(output).toContain('Test fixtures')
  })
})

describe('generateMocksFile', () => {
  it('generates MSW handlers for API steps', () => {
    const output = generateMocksFile(makePlan())
    expect(output).toContain("import { http, HttpResponse } from 'msw'")
    expect(output).toContain("http.post('/api/login'")
    expect(output).toContain('success: [')
    expect(output).toContain('error: [')
  })

  it('returns no-op when no API steps', () => {
    const plan = makePlan({
      steps: [
        {
          order: 1,
          title: 'Static',
          layout: [],
          componentsUsed: [],
          status: 'complete',
          rationale: 'r',
          interaction: null,
          api: { hasApiCall: false, hasEmptyState: false }
        }
      ]
    })
    const output = generateMocksFile(plan)
    expect(output).toContain('No API mocks needed')
  })
})

describe('generateStoriesFile', () => {
  const library: ComponentLibrary = {
    source: 'auto-discovery',
    components: [
      {
        name: 'TextInput',
        storyId: 'components-textinput--default',
        variants: ['Default'],
        importPath: './src/stories/TextInput.stories.ts'
      },
      {
        name: 'Button',
        storyId: 'components-button--primary',
        variants: ['Primary'],
        importPath: './src/stories/Button.stories.ts'
      }
    ]
  }

  it('generates a valid stories file with imports', () => {
    const output = generateStoriesFile(makePlan(), library)
    expect(output).toContain("import React from 'react'")
    expect(output).toContain('import { TextInput } from')
    expect(output).toContain('import { Button } from')
    expect(output).toContain("title: 'Flows/TestFlow'")
  })

  it('creates one story per step', () => {
    const output = generateStoriesFile(makePlan(), library)
    expect(output).toContain('export const LoginForm: StoryObj')
    expect(output).toContain('export const WelcomePage: StoryObj')
  })

  it('does not generate _Error or _Empty variants', () => {
    const output = generateStoriesFile(makePlan(), library)
    expect(output).not.toContain('LoginForm_Error')
    expect(output).not.toContain('LoginForm_Empty')
  })

  it('includes render functions with JSX layout', () => {
    const output = generateStoriesFile(makePlan(), library)
    expect(output).toContain('render: () => (')
    expect(output).toContain('<TextInput')
    expect(output).toContain('<Button')
  })

  it('includes play functions for interactive steps', () => {
    const output = generateStoriesFile(makePlan(), library)
    expect(output).toContain('play: async')
    expect(output).toContain('// TODO: clicks sign in')
  })

  it('does not include play function for terminal steps', () => {
    const output = generateStoriesFile(makePlan(), library)
    // WelcomePage has interaction: null, so no play function
    const welcomeSection = output.split('export const WelcomePage')[1]
    expect(welcomeSection).not.toContain('play:')
  })

  it('includes MSW handlers for API steps', () => {
    const output = generateStoriesFile(makePlan(), library)
    expect(output).toContain("import { handlers } from './TestFlow.mocks'")
    expect(output).toContain('msw: { handlers: handlers.success }')
  })
})
