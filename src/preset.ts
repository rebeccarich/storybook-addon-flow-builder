import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import {
  generateFixturesFile,
  generateMocksFile,
  generateStoriesFile,
  toPascalCase
} from './generate'
import type { ComponentLibrary, FlowPlan } from './types'

export const viteFinal = async (config: Record<string, unknown>) => {
  const plugins = (config.plugins ?? []) as unknown[]
  plugins.push({
    name: 'flowbuilder-save',
    configureServer(server: {
      middlewares: {
        use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void
      }
    }) {
      server.middlewares.use(
        '/__flowbuilder/save',
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ success: false, error: 'Method not allowed' }))
            return
          }

          try {
            const body = await new Promise<string>((resolve, reject) => {
              let data = ''
              req.on('data', (chunk: string) => {
                data += chunk
              })
              req.on('end', () => resolve(data))
              req.on('error', reject)
            })

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

            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                success: true,
                files: files.map((f) => join(dir, f.name))
              })
            )
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : String(err)
              })
            )
          }
        }
      )
    }
  })
  config.plugins = plugins
  return config
}

export const webpack = async (config: unknown) => config
