import type { ComponentLibrary, FlowPlan } from './types'

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
    const handlerName = toVariableName(step.componentName)
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
    lines.push(`    ${toVariableName(step.componentName)}Success,`)
  }
  lines.push('  ],')

  lines.push('  error: [')
  for (const step of apiSteps) {
    if (step.api.errorShape) {
      lines.push(`    ${toVariableName(step.componentName)}Error,`)
    }
  }
  lines.push('  ],')

  lines.push('  empty: [')
  for (const step of apiSteps) {
    if (step.api.hasEmptyState) {
      lines.push(`    ${toVariableName(step.componentName)}Empty,`)
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
  // importPath is relative to project root, e.g. "./src/stories/Login.stories.tsx"
  // outputDir is relative to project root, e.g. "src/stories/flows"
  // We need a relative path from outputDir to importPath
  const clean = importPath.replace(/^\.\//, '')
  const outputParts = outputDir.replace(/^\.\//, '').split('/')
  const importParts = clean.split('/')

  // Find common prefix
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

  // Generate imports from existing story files
  const importedStories = new Map<string, string>() // componentName → import alias
  for (const step of plan.steps) {
    if (step.status !== 'exists' || importedStories.has(step.componentName)) continue

    const storyFilePath = importMap.get(step.componentName)
    if (storyFilePath) {
      const alias = `${toPascalCase(step.componentName)}Stories`
      const rel = relativeImportPath(storyFilePath, outputDir)
      lines.push(`import * as ${alias} from '${rel}';`)
      importedStories.set(step.componentName, alias)
    }
  }

  if (importedStories.size > 0) lines.push('')

  lines.push(`const meta: Meta = {`)
  lines.push(`  title: 'Flows/${flowName}',`)
  lines.push(`  parameters: { layout: 'fullscreen' },`)
  lines.push(`};`)
  lines.push(`export default meta;`)
  lines.push('')

  for (const step of plan.steps) {
    const storyName = toPascalCase(step.title)

    if (step.status === 'missing') {
      lines.push(
        `// GAP: ${step.componentName} — ${step.description ?? 'Component not found in library'}`
      )
      lines.push(`export const ${storyName}: StoryObj = {`)
      lines.push(`  render: () => (`)
      lines.push(
        `    <div style={{ padding: 40, textAlign: 'center', border: '2px dashed #ccc', borderRadius: 8 }}>`
      )
      lines.push(`      <h3>${step.componentName}</h3>`)
      lines.push(`      <p>${step.description ?? 'This component needs to be created'}</p>`)
      lines.push(`    </div>`)
      lines.push(`  ),`)
      lines.push(`  parameters: { flowbuilder: { rationale: ${JSON.stringify(step.rationale)} } },`)
      lines.push(`};`)
      lines.push('')
      continue
    }

    const alias = importedStories.get(step.componentName)
    const variantName = step.storyVariant ? toPascalCase(step.storyVariant) : 'Default'

    // Happy path
    lines.push(`export const ${storyName}: StoryObj = {`)

    // Spread from the source story if available
    if (alias) {
      lines.push(`  ...${alias}.${variantName},`)
    }

    // Build parameters
    const params: string[] = []
    if (hasApiSteps && step.api.hasApiCall) {
      params.push(`    msw: { handlers: handlers.success },`)
    }
    params.push(`    flowbuilder: { rationale: ${JSON.stringify(step.rationale)} },`)

    lines.push(`  parameters: {`)
    if (alias) {
      lines.push(`    ...${alias}.${variantName}?.parameters,`)
    }
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

    // Error variant
    if (step.api.hasApiCall && step.api.errorShape) {
      lines.push(`export const ${storyName}_Error: StoryObj = {`)
      if (alias) {
        lines.push(`  ...${alias}.${variantName},`)
      }
      lines.push(`  parameters: {`)
      if (alias) {
        lines.push(`    ...${alias}.${variantName}?.parameters,`)
      }
      lines.push(`    msw: { handlers: handlers.error },`)
      lines.push(`  },`)
      lines.push(`};`)
      lines.push('')
    }

    // Empty variant
    if (step.api.hasApiCall && step.api.hasEmptyState) {
      lines.push(`export const ${storyName}_Empty: StoryObj = {`)
      if (alias) {
        lines.push(`  ...${alias}.${variantName},`)
      }
      lines.push(`  parameters: {`)
      if (alias) {
        lines.push(`    ...${alias}.${variantName}?.parameters,`)
      }
      lines.push(`    msw: { handlers: handlers.empty },`)
      lines.push(`  },`)
      lines.push(`};`)
      lines.push('')
    }
  }

  return lines.join('\n')
}
