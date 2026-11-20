// figma-details — o mod do plugin: só experiência (UX/DX) em volta das chamadas ao figma-console.
// A barreira de correção (API síncrona) é o hook clássico `api-assincrona.mjs`, que roda em qualquer versão.
import type { EngineInterface, Register } from 'claude-code'

const SERVER = 'figma-console'
const PREFIX = `mcp__${SERVER}__`

type OpenFile = { fileName: string; fileKey: string; isActive?: boolean }

let cache: { at: number; files: OpenFile[] } | undefined

function parseOpen(text: string | undefined): OpenFile[] {
  if (!text) return []
  try {
    const files = JSON.parse(text).files
    return Array.isArray(files) ? files : []
  } catch {
    return []
  }
}

async function openFiles($: EngineInterface, fresh = false): Promise<OpenFile[]> {
  const now = Date.now()
  if (!fresh && cache && now - cache.at < 20_000) return cache.files
  const res = await $.mcp.call(SERVER, 'figma_list_open_files', {})
  const block = res.content?.find((c: { type: string }) => c.type === 'text') as { text?: string } | undefined
  cache = { at: now, files: parseOpen(block?.text) }
  return cache.files
}

export const register: Register = on => {
  on('tool.call', async ($, e, next) => {
    if (!e.tool.startsWith(PREFIX)) return next(e)
    const args = e as unknown as { fileKey?: unknown }

    // Com dois ou mais arquivos abertos, o figma_execute sem fileKey escreve no arquivo ativo,
    // que muda quando a pessoa clica em outra janela.
    if (e.tool === `${PREFIX}figma_execute` && typeof args.fileKey !== 'string') {
      const files = await openFiles($)
      if (files.length > 1)
        return {
          deny: `figma-details: ${files.length} arquivos abertos; passe fileKey para não escrever no arquivo errado:\n${files
            .map(f => `- ${f.fileName} → ${f.fileKey}${f.isActive ? ' (ativo)' : ''}`)
            .join('\n')}`,
        }
    }

    const ran = await next(e)
    const files = await openFiles($, true)
    const key = typeof args.fileKey === 'string' ? args.fileKey : files.find(f => f.isActive)?.fileKey
    const target = files.find(f => f.fileKey === key)?.fileName
    if (target) $.ui.status(`Figma → ${target}${files.length > 1 ? ` (${files.length} abertos)` : ''}`)
    return ran
  }).catch(($, e, next) => next(e)) // falha do mod nunca bloqueia o Figma
}
