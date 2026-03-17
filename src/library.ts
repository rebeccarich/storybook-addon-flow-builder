import { DESIGNSYNC_LIBRARY_KEY } from './constants'
import type { ComponentLibrary, LibraryComponent } from './types'

export function readDesignSyncLibrary(): ComponentLibrary | null {
  try {
    const raw = localStorage.getItem(DESIGNSYNC_LIBRARY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.components) || parsed.components.length === 0) return null
    return { source: 'designsync', components: parsed.components }
  } catch {
    return null
  }
}

export function discoverFromStoryIndex(
  index: Record<string, { type: string; title: string; name: string; importPath?: string }>
): ComponentLibrary {
  const componentMap = new Map<string, LibraryComponent>()

  for (const [id, entry] of Object.entries(index)) {
    if (entry.type !== 'story') continue
    if (entry.title.startsWith('Flows/')) continue
    if (entry.title.startsWith('Example/')) continue
    if (entry.title.startsWith('Configure')) continue

    const parts = entry.title.split('/')
    const componentName = parts[parts.length - 1]

    const existing = componentMap.get(componentName)
    if (existing) {
      existing.variants.push(entry.name)
      if (!existing.storyId) existing.storyId = id
    } else {
      componentMap.set(componentName, {
        name: componentName,
        storyId: id,
        variants: [entry.name],
        importPath: entry.importPath
      })
    }
  }

  return {
    source: 'auto-discovery',
    components: Array.from(componentMap.values())
  }
}

export function getLibrary(
  index: Record<string, { type: string; title: string; name: string; importPath?: string }>
): ComponentLibrary {
  return readDesignSyncLibrary() ?? discoverFromStoryIndex(index)
}
