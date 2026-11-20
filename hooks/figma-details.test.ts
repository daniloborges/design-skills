import { expect, test } from 'claude-code/testing'

const EXEC = 'mcp__figma-console__figma_execute'
const open = (n: number) => ({
  value: {
    isError: false,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          files: Array.from({ length: n }, (_, i) => ({ fileName: `Arquivo ${i}`, fileKey: `k${i}`, isActive: i === 0 })),
        }),
      },
    ],
  },
})

test('sem fileKey e com dois arquivos abertos, pede o alvo', async ($, on) => {
  on('mcp.call', () => open(2))
  const r = await $.tool.call({ tool: EXEC, code: 'return 1' })
  expect(r.deny).toContain('k1')
})

test('com fileKey passa', async ($, on) => {
  on('mcp.call', () => open(2))
  on('tool.call', () => ({ result: { text: 'ok' } }))
  const r = await $.tool.call({ tool: EXEC, code: 'return 1', fileKey: 'k1' })
  expect(r.deny).toBeUndefined()
})

test('com um arquivo só, passa sem fileKey', async ($, on) => {
  on('mcp.call', () => open(1))
  on('tool.call', () => ({ result: { text: 'ok' } }))
  const r = await $.tool.call({ tool: EXEC, code: 'return 1' })
  expect(r.deny).toBeUndefined()
})
