import type { ComponentLibrary, FlowPlan, LayoutNode } from './types'

export function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase())
}

export function toVariableName(s: string): string {
  const pascal = toPascalCase(s)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function generateFixturesFile(plan: FlowPlan): string {
  const lines: string[] = [`// ${plan.flowName} — Fixtures`, `// ${plan.fixtures.description}`, '']

  for (const entity of plan.fixtures.entities) {
    const name = toVariableName(entity.name)
    const type = toPascalCase(entity.name)
    lines.push(
      `export interface ${type} ${JSON.stringify(entity.shape, null, 2)
        .replace(/"([^"]+)":/g, '$1:')
        .replace(/: "([^"]+)"/g, ': $1')};`
    )
    lines.push('')
    lines.push(`export const ${name}: ${type} = ${JSON.stringify(entity.shape, null, 2)};`)
    lines.push('')
  }

  return lines.join('\n')
}

export function generateMocksFile(plan: FlowPlan): string {
  const apiSteps = plan.steps.filter((s) => s.api.hasApiCall)

  if (apiSteps.length === 0) {
    return `// ${plan.flowName} — No API mocks needed\nexport const handlers = { success: [], error: [], empty: [] };\n`
  }

  const lines: string[] = [
    `// ${plan.flowName} — MSW Handlers`,
    `import { http, HttpResponse } from 'msw';`,
    ''
  ]

  for (const step of apiSteps) {
    const handlerName = toVariableName(step.title)
    const endpoint = step.api.endpoint!
    const method = endpoint.startsWith('POST')
      ? 'post'
      : endpoint.startsWith('PUT')
        ? 'put'
        : endpoint.startsWith('PATCH')
          ? 'patch'
          : endpoint.startsWith('DELETE')
            ? 'delete'
            : 'get'
    const path = endpoint.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/, '')

    lines.push(`const ${handlerName}Success = http.${method}('${path}', () => {`)
    lines.push(`  return HttpResponse.json(${JSON.stringify(step.api.successShape, null, 2)});`)
    lines.push(`});`)
    lines.push('')

    if (step.api.errorShape) {
      lines.push(`const ${handlerName}Error = http.${method}('${path}', () => {`)
      lines.push(
        `  return HttpResponse.json(${JSON.stringify(step.api.errorShape, null, 2)}, { status: 500 });`
      )
      lines.push(`});`)
      lines.push('')
    }

    if (step.api.hasEmptyState) {
      lines.push(`const ${handlerName}Empty = http.${method}('${path}', () => {`)
      lines.push(`  return HttpResponse.json([]);`)
      lines.push(`});`)
      lines.push('')
    }
  }

  lines.push('export const handlers = {')

  lines.push('  success: [')
  for (const step of apiSteps) {
    lines.push(`    ${toVariableName(step.title)}Success,`)
  }
  lines.push('  ],')

  lines.push('  error: [')
  for (const step of apiSteps) {
    if (step.api.errorShape) {
      lines.push(`    ${toVariableName(step.title)}Error,`)
    }
  }
  lines.push('  ],')

  lines.push('  empty: [')
  for (const step of apiSteps) {
    if (step.api.hasEmptyState) {
      lines.push(`    ${toVariableName(step.title)}Empty,`)
    }
  }
  lines.push('  ],')

  lines.push('};')

  return lines.join('\n')
}

/**
 * Build a lookup from componentName → importPath using the library.
 */
function buildImportMap(library?: ComponentLibrary): Map<string, string> {
  const map = new Map<string, string>()
  if (!library) return map
  for (const comp of library.components) {
    if (comp.importPath) {
      map.set(comp.name, comp.importPath)
    }
  }
  return map
}

/**
 * Convert a Storybook importPath (e.g. "./src/stories/Login.stories.tsx")
 * into a relative import from the output directory (e.g. "src/stories/flows/").
 */
function relativeImportPath(importPath: string, outputDir: string): string {
  const clean = importPath.replace(/^\.\//, '')
  const outputParts = outputDir.replace(/^\.\//, '').split('/')
  const importParts = clean.split('/')

  let common = 0
  while (
    common < outputParts.length &&
    common < importParts.length &&
    outputParts[common] === importParts[common]
  ) {
    common++
  }

  const ups = outputParts.length - common
  const remaining = importParts.slice(common).join('/')
  const prefix = ups > 0 ? '../'.repeat(ups) : './'
  return prefix + remaining
}

/**
 * Derive the component source file import from a story importPath.
 * e.g. "./src/stories/Button.stories.ts" → "./src/stories/Button"
 */
function componentImportFromStory(storyImportPath: string): string {
  return storyImportPath.replace(/\.stories\.(ts|tsx|js|jsx)$/, '')
}

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

/**
 * Render a LayoutNode tree as JSX string for generated story files.
 */
function renderLayoutAsJsx(node: LayoutNode | string, indent: number): string {
  const pad = '  '.repeat(indent)

  if (typeof node === 'string') {
    return `${pad}${node}`
  }

  const isHtml = HTML_ELEMENTS.has(node.component)
  const tag = isHtml ? node.component : node.component

  // Build props string
  const propsStr = node.props
    ? ' ' +
      Object.entries(node.props)
        .map(([key, val]) => {
          if (typeof val === 'string') return `${key}=${JSON.stringify(val)}`
          return `${key}={${JSON.stringify(val)}}`
        })
        .join(' ')
    : ''

  const children = node.children ?? []
  if (children.length === 0) {
    return `${pad}<${tag}${propsStr} />`
  }

  // If only one text child, inline it
  if (children.length === 1 && typeof children[0] === 'string') {
    return `${pad}<${tag}${propsStr}>${children[0]}</${tag}>`
  }

  const childrenJsx = children.map((c) => renderLayoutAsJsx(c, indent + 1)).join('\n')
  return `${pad}<${tag}${propsStr}>\n${childrenJsx}\n${pad}</${tag}>`
}

export interface GenerateStoriesOptions {
  plan: FlowPlan
  library?: ComponentLibrary
  outputDir?: string
}

export function generateStoriesFile(
  plan: FlowPlan,
  library?: ComponentLibrary,
  outputDir = 'src/stories/flows'
): string {
  const flowName = toPascalCase(plan.flowName)
  const importMap = buildImportMap(library)
  const hasApiSteps = plan.steps.some((s) => s.api.hasApiCall)
  const hasInteractions = plan.steps.some((s) => s.interaction)

  const lines: string[] = [
    `// ${plan.flowName} — Flow Stories`,
    `import React from 'react';`,
    `import type { Meta, StoryObj } from '@storybook/react';`
  ]

  if (hasInteractions) {
    lines.push(`import { userEvent, within } from '@storybook/test';`)
  }

  if (hasApiSteps) {
    lines.push(`import { handlers } from './${flowName}.mocks';`)
  }

  lines.push('')

  // Collect all unique library components used across all steps
  const allComponents = new Set<string>()
  for (const step of plan.steps) {
    for (const comp of step.componentsUsed) {
      allComponents.add(comp)
    }
  }

  // Generate imports from component source files
  for (const compName of allComponents) {
    const storyFilePath = importMap.get(compName)
    if (storyFilePath) {
      const componentPath = componentImportFromStory(storyFilePath)
      const rel = relativeImportPath(componentPath, outputDir)
      lines.push(`import { ${compName} } from '${rel}';`)
    }
  }

  if (allComponents.size > 0) lines.push('')

  lines.push(`const meta: Meta = {`)
  lines.push(`  title: 'Flows/${flowName}',`)
  lines.push(`  parameters: { layout: 'fullscreen' },`)
  lines.push(`};`)
  lines.push(`export default meta;`)
  lines.push('')

  for (const step of plan.steps) {
    const storyName = toPascalCase(step.title)

    // Render the layout tree as JSX
    const layoutJsx = step.layout.map((node) => renderLayoutAsJsx(node, 2)).join('\n')

    // Happy path
    lines.push(`export const ${storyName}: StoryObj = {`)
    lines.push(`  render: () => (`)
    if (step.layout.length === 1) {
      lines.push(layoutJsx)
    } else {
      lines.push(`    <>`)
      lines.push(layoutJsx)
      lines.push(`    </>`)
    }
    lines.push(`  ),`)

    // Build parameters
    const params: string[] = []
    if (hasApiSteps && step.api.hasApiCall) {
      params.push(`    msw: { handlers: handlers.success },`)
    }
    params.push(`    flowbuilder: { rationale: ${JSON.stringify(step.rationale)} },`)

    lines.push(`  parameters: {`)
    for (const p of params) lines.push(p)
    lines.push(`  },`)

    if (step.interaction) {
      lines.push(`  play: async ({ canvasElement }) => {`)
      lines.push(`    const canvas = within(canvasElement);`)
      lines.push(`    // TODO: ${step.interaction}`)
      lines.push(`  },`)
    }
    lines.push(`};`)
    lines.push('')

    // Note: error/empty variants are not generated because Claude composes
    // separate flow steps for each UI state (e.g. a "Login Error" step with
    // an Alert already in the layout tree). Generating _Error/_Empty variants
    // with the same layout but different MSW handlers would be redundant.
  }

  return lines.join('\n')
}
