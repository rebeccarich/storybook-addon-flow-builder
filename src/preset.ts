import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import {
  generateFixturesFile,
  generateMocksFile,
  generateStoriesFile,
  toPascalCase
} from './generate'
import type { ComponentLibrary, FlowPlan, LayoutNode } from './types'

/* ── In-memory store for preview data ── */

let storedPlan: FlowPlan | null = null
let storedLibrary: ComponentLibrary | null = null

/* ── Preview HTML generation ── */

function buildImportMap(library: ComponentLibrary): Map<string, string> {
  const map = new Map<string, string>()
  for (const comp of library.components) {
    if (comp.importPath) {
      // Convert story importPath to component importPath
      // e.g. "./src/stories/Button.stories.ts" → "/src/stories/Button.tsx"
      // Try to derive the component file from the story file
      const storyPath = comp.importPath.replace(/^\.\//, '/')
      const componentPath = storyPath.replace(/\.stories\.(ts|tsx|js|jsx)$/, '.tsx')
      map.set(comp.name, componentPath)
    }
  }
  return map
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

function renderLayoutNode(node: LayoutNode | string, importMap: Map<string, string>): string {
  if (typeof node === 'string') {
    return JSON.stringify(node)
  }

  const isHtml = HTML_ELEMENTS.has(node.component)
  const tag = isHtml ? JSON.stringify(node.component) : node.component
  const props = node.props ? JSON.stringify(node.props) : 'null'
  const children = (node.children ?? []).map((c) => renderLayoutNode(c, importMap))

  if (children.length > 0) {
    return `React.createElement(${tag}, ${props}, ${children.join(', ')})`
  }
  return `React.createElement(${tag}, ${props})`
}

function generatePreviewHtml(stepIndex: number): string | null {
  if (!storedPlan || !storedLibrary) return null
  const step = storedPlan.steps[stepIndex]
  if (!step) return null

  const importMap = buildImportMap(storedLibrary)

  // Collect all library components used in this step
  const imports: string[] = []
  for (const compName of step.componentsUsed) {
    const path = importMap.get(compName)
    if (path) {
      imports.push(`import { ${compName} } from '${path}'`)
    }
  }

  // Render the layout tree
  const elements = step.layout.map((node) => renderLayoutNode(node, importMap))
  const rendered =
    elements.length === 1
      ? elements[0]
      : `React.createElement(React.Fragment, null, ${elements.join(', ')})`

  return `<!DOCTYPE html>
<html>
<head>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
  #root { min-height: 100%; padding: 24px; }
</style>
</head>
<body>
<div id="root"></div>
<script type="module">
import React from 'react'
import ReactDOM from 'react-dom/client'
${imports.join('\n')}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(${rendered})
</script>
</body>
</html>`
}

/* ── Middleware helpers ── */

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: string) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export const viteFinal = async (config: Record<string, unknown>) => {
  const plugins = (config.plugins ?? []) as unknown[]
  plugins.push({
    name: 'flowbuilder-middleware',
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void
        ) => void
      }
      transformIndexHtml: (url: string, html: string) => Promise<string>
    }) {
      /* ── POST /__flowbuilder/plan — store plan + library in memory ── */
      server.middlewares.use(
        '/__flowbuilder/plan',
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            jsonResponse(res, 405, { success: false, error: 'Method not allowed' })
            return
          }
          try {
            const body = await readBody(req)
            const { plan, library } = JSON.parse(body) as {
              plan: FlowPlan
              library?: ComponentLibrary
            }
            storedPlan = plan
            storedLibrary = library ?? null
            jsonResponse(res, 200, { success: true })
          } catch (err) {
            jsonResponse(res, 500, {
              success: false,
              error: err instanceof Error ? err.message : String(err)
            })
          }
        }
      )

      /* ── GET /__flowbuilder/preview/:stepIndex — serve composed preview HTML ── */
      server.middlewares.use(
        '/__flowbuilder/preview',
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          // Let Vite handle its internal html-proxy module requests
          const url = req.url ?? ''
          if (url.includes('html-proxy')) {
            next()
            return
          }

          if (req.method !== 'GET') {
            jsonResponse(res, 405, { success: false, error: 'Method not allowed' })
            return
          }

          // Parse step index from URL: /0, /1, etc.
          const match = url.match(/\/(\d+)/)
          if (!match) {
            jsonResponse(res, 400, { success: false, error: 'Missing step index' })
            return
          }

          const stepIndex = parseInt(match[1]!, 10)
          const rawHtml = generatePreviewHtml(stepIndex)

          if (!rawHtml) {
            jsonResponse(res, 404, { success: false, error: 'No plan stored or step not found' })
            return
          }

          // Let Vite transform the HTML so bare imports (react, react-dom/client)
          // get rewritten to pre-bundled paths the browser can resolve
          const html = await server.transformIndexHtml(
            `/__flowbuilder/preview/${stepIndex}`,
            rawHtml
          )

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
        }
      )

      /* ── POST /__flowbuilder/save — save generated files to project ── */
      server.middlewares.use(
        '/__flowbuilder/save',
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            jsonResponse(res, 405, { success: false, error: 'Method not allowed' })
            return
          }

          try {
            const body = await readBody(req)
            const { plan, library, targetDir } = JSON.parse(body) as {
              plan: FlowPlan
              library?: ComponentLibrary
              targetDir?: string
            }
            const dir = join(process.cwd(), targetDir ?? 'src/stories/flows')

            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true })
            }

            const flowName = toPascalCase(plan.flowName)
            const files = [
              { name: `${flowName}.fixtures.ts`, content: generateFixturesFile(plan) },
              { name: `${flowName}.mocks.ts`, content: generateMocksFile(plan) },
              {
                name: `${flowName}.flow.stories.tsx`,
                content: generateStoriesFile(plan, library, targetDir ?? 'src/stories/flows')
              }
            ]

            for (const f of files) {
              writeFileSync(join(dir, f.name), f.content, 'utf-8')
            }

            jsonResponse(res, 200, {
              success: true,
              files: files.map((f) => join(dir, f.name))
            })
          } catch (err) {
            jsonResponse(res, 500, {
              success: false,
              error: err instanceof Error ? err.message : String(err)
            })
          }
        }
      )
    }
  })
  config.plugins = plugins
  return config
}

export const webpack = async (config: unknown) => config
