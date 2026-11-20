import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { decide, findSync } from '../hooks/api-assincrona.mjs'

const HOOK = fileURLToPath(new URL('../hooks/api-assincrona.mjs', import.meta.url))
const input = code => ({ tool_name: 'mcp__figma-console__figma_execute', tool_input: { code } })

test('cada chamada síncrona vira a troca assíncrona', () => {
  const hits = findSync('const n = figma.getNodeById("1:2"); t.textStyleId = s.id; await t.setRangeTextStyleId(0, 3, s.id)')
  assert.equal(hits.length, 3)
  assert.match(hits.join('\n'), /getNodeByIdAsync/)
  assert.match(hits.join('\n'), /setRange<Tipo>StyleIdAsync/)
})

test('a API assíncrona e as comparações passam', () => {
  assert.deepEqual(
    findSync('await figma.getNodeByIdAsync(id); await t.setTextStyleIdAsync(s.id); if (t.textStyleId === s.id) {}; await i.getMainComponentAsync(); await figma.getLocalTextStylesAsync()'),
    [],
  )
})

test('decide recusa com o motivo, ou deixa passar', () => {
  assert.equal(decide(input('return 1')), null)
  assert.equal(decide({}), null)
  const out = decide(input('figma.variables.getVariableById(id)'))
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny')
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /getVariableByIdAsync/)
})

test('como processo: lê a entrada padrão e nunca falha', () => {
  const deny = spawnSync('node', [HOOK], { input: JSON.stringify(input('figma.getNodeById(x)')) })
  assert.equal(deny.status, 0)
  assert.equal(JSON.parse(deny.stdout).hookSpecificOutput.permissionDecision, 'deny')

  const pass = spawnSync('node', [HOOK], { input: JSON.stringify(input('return 1')) })
  assert.equal(pass.status, 0)
  assert.equal(pass.stdout.length, 0)

  const broken = spawnSync('node', [HOOK], { input: 'não é json' })
  assert.equal(broken.status, 0)
})
