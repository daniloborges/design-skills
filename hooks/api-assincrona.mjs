#!/usr/bin/env node
// Hook PreToolUse do figma_execute: recusa as chamadas síncronas da Plugin API que o Figma
// rejeita com `documentAccess: dynamic-page` e devolve a troca que funciona.
// Roda em qualquer versão do Claude Code; não depende do motor de mods.
import { pathToFileURL } from 'node:url'

export const SYNC = [
  [/\bfigma\.getNodeById\(/, 'figma.getNodeById(', 'await figma.getNodeByIdAsync(id)'],
  [/\bfigma\.getStyleById\(/, 'figma.getStyleById(', 'await figma.getStyleByIdAsync(id)'],
  [/\bgetLocal(Text|Paint|Effect|Grid)Styles\(/, 'getLocal<Tipo>Styles(', 'await figma.getLocal<Tipo>StylesAsync()'],
  [/\bfigma\.variables\.getVariableById\(/, 'variables.getVariableById(', 'await figma.variables.getVariableByIdAsync(id)'],
  [/\bfigma\.variables\.getVariableCollectionById\(/, 'variables.getVariableCollectionById(', 'await figma.variables.getVariableCollectionByIdAsync(id)'],
  [/\bfigma\.variables\.getLocalVariables\(/, 'variables.getLocalVariables(', 'await figma.variables.getLocalVariablesAsync()'],
  [/\bfigma\.variables\.getLocalVariableCollections\(/, 'variables.getLocalVariableCollections(', 'await figma.variables.getLocalVariableCollectionsAsync()'],
  [/\.(text|fill|stroke|effect|grid)StyleId\s*=(?!=)/, '.<tipo>StyleId =', 'await node.set<Tipo>StyleIdAsync(id)'],
  [/\bsetRange(Text|Fill)StyleId\(/, 'setRange<Tipo>StyleId(', 'await node.setRange<Tipo>StyleIdAsync(início, fim, id)'],
  [/\.mainComponent\b/, '.mainComponent', 'await instance.getMainComponentAsync()'],
]

/** Lista as trocas necessárias para o código; vazia quando ele só usa a API assíncrona. */
export function findSync(code) {
  return SYNC.filter(([re]) => re.test(code)).map(([, what, fix]) => `${what} → ${fix}`)
}

/** A resposta do hook para a entrada do PreToolUse, ou null para deixar passar. */
export function decide(input) {
  const code = input?.tool_input?.code
  if (typeof code !== 'string') return null
  const hits = findSync(code)
  if (!hits.length) return null
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        'API síncrona recusada pelo Figma (documentAccess: dynamic-page). Troque:\n- ' + hits.join('\n- '),
    },
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let raw = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', chunk => (raw += chunk))
  process.stdin.on('end', () => {
    let out = null
    try {
      out = decide(JSON.parse(raw))
    } catch {
      // entrada ilegível: nunca bloqueia o Figma por falha do próprio hook
    }
    if (out) process.stdout.write(JSON.stringify(out))
    process.exit(0)
  })
}
