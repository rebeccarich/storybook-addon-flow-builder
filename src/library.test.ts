import { describe, expect, it } from 'vitest'
import { discoverFromStoryIndex } from './library'

const makeIndex = (
  entries: Record<string, { type: string; title: string; name: string; importPath?: string }>
) => entries

describe('discoverFromStoryIndex', () => {
  it('discovers components from story entries', () => {
    const index = makeIndex({
      'components-button--primary': {
        type: 'story',
        title: 'Components/Button',
        name: 'Primary',
        importPath: './src/stories/Button.stories.ts'
      },
      'components-button--secondary': {
        type: 'story',
        title: 'Components/Button',
        name: 'Secondary'
      }
    })
    const lib = discoverFromStoryIndex(index)
    expect(lib.components).toHaveLength(1)
    expect(lib.components[0]!.name).toBe('Button')
    expect(lib.components[0]!.variants).toEqual(['Primary', 'Secondary'])
    expect(lib.components[0]!.importPath).toBe('./src/stories/Button.stories.ts')
  })

  it('skips non-story entries', () => {
    const index = makeIndex({
      'components-button--docs': {
        type: 'docs',
        title: 'Components/Button',
        name: 'Docs'
      }
    })
    const lib = discoverFromStoryIndex(index)
    expect(lib.components).toHaveLength(0)
  })

  it('filters out Flows/ stories', () => {
    const index = makeIndex({
      'flows-login--step1': {
        type: 'story',
        title: 'Flows/LoginFlow',
        name: 'Step1'
      }
    })
    const lib = discoverFromStoryIndex(index)
    expect(lib.components).toHaveLength(0)
  })

  it('filters out Example/ stories', () => {
    const index = makeIndex({
      'example-page--default': {
        type: 'story',
        title: 'Example/Page',
        name: 'Default'
      }
    })
    const lib = discoverFromStoryIndex(index)
    expect(lib.components).toHaveLength(0)
  })

  it('filters out Configure stories', () => {
    const index = makeIndex({
      'configure-intro--default': {
        type: 'story',
        title: 'Configure/Introduction',
        name: 'Default'
      }
    })
    const lib = discoverFromStoryIndex(index)
    expect(lib.components).toHaveLength(0)
  })

  it('sets source to auto-discovery', () => {
    const lib = discoverFromStoryIndex({})
    expect(lib.source).toBe('auto-discovery')
  })

  it('groups variants under the same component', () => {
    const index = makeIndex({
      'components-alert--info': {
        type: 'story',
        title: 'Components/Alert',
        name: 'Info'
      },
      'components-alert--error': {
        type: 'story',
        title: 'Components/Alert',
        name: 'Error'
      },
      'components-alert--success': {
        type: 'story',
        title: 'Components/Alert',
        name: 'Success'
      }
    })
    const lib = discoverFromStoryIndex(index)
    expect(lib.components).toHaveLength(1)
    expect(lib.components[0]!.variants).toEqual(['Info', 'Error', 'Success'])
  })

  it('handles deeply nested titles', () => {
    const index = makeIndex({
      'design-system-forms-textinput--default': {
        type: 'story',
        title: 'Design System/Forms/TextInput',
        name: 'Default'
      }
    })
    const lib = discoverFromStoryIndex(index)
    expect(lib.components[0]!.name).toBe('TextInput')
  })
})
