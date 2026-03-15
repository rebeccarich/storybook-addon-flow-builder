import type { FlowPlan, ComponentLibrary } from './types'
import {
  toPascalCase,
  generateFixturesFile,
  generateMocksFile,
  generateStoriesFile
} from './generate'

export { generateFixturesFile, generateMocksFile, generateStoriesFile } from './generate'

export async function exportFlowAsZip(plan: FlowPlan, library?: ComponentLibrary): Promise<void> {
  const { default: JSZip } = await import(
    'https://cdn.jsdelivr.net/npm/jszip@3/dist/jszip.min.js' as string
  )
  const zip = new JSZip()

  const flowName = toPascalCase(plan.flowName)

  zip.file(`${flowName}.fixtures.ts`, generateFixturesFile(plan))
  zip.file(`${flowName}.mocks.ts`, generateMocksFile(plan))
  zip.file(`${flowName}.flow.stories.tsx`, generateStoriesFile(plan, library))

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${flowName}-flow.zip`
  a.click()
  URL.revokeObjectURL(url)
}
