import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(new URL('../skills/tipografia-semantica-codigo/scripts/gerar-tokens.mjs', import.meta.url))
const px = (v) => ({ unit: 'PIXELS', value: v })
const estilos = [
  { name: 'heading/xl', fontFamily: 'Fraunces', fontStyle: 'Regular', fontSize: 84, lineHeight: px(84), letterSpacing: px(0), textCase: 'ORIGINAL' },
  { name: 'body/md', fontFamily: 'Inter', fontStyle: 'Regular', fontSize: 14, lineHeight: px(22), letterSpacing: px(0), textCase: 'ORIGINAL' },
  { name: 'da:chat-answer', fontFamily: 'Fraunces', fontStyle: 'Regular', fontSize: 18, lineHeight: px(28), letterSpacing: px(0), textCase: 'ORIGINAL' },
  { name: 'Text 14', fontFamily: 'Inter', fontStyle: 'Regular', fontSize: 14, lineHeight: px(20), letterSpacing: px(0), textCase: 'ORIGINAL' },
]

function gerar(extra = []) {
  const dir = mkdtempSync(join(tmpdir(), 'gerar-tokens-'))
  writeFileSync(join(dir, 'estilos.json'), JSON.stringify(estilos))
  writeFileSync(join(dir, 'modos.json'), JSON.stringify({ 'type/heading/xl/font-size': { Desktop: 84, Mobile: 44 } }))
  const r = spawnSync('node', [SCRIPT, 'estilos.json', '--out', 'tipo', ...extra], { cwd: dir, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  return { css: readFileSync(join(dir, 'tipo.css'), 'utf8'), json: JSON.parse(readFileSync(join(dir, 'tipo.tokens.json'), 'utf8')), out: r.stdout }
}

test('sem --modos, o tamanho é rem fixo', () => {
  const { css } = gerar()
  assert.match(css, /--type-heading-xl-font-size: 5\.25rem;/)
})

test('com --modos, o tamanho vira clamp entre o Mobile e o Desktop', () => {
  const { css } = gerar(['--modos', 'modos.json', '--viewport', '360,1440'])
  // 44 px em 360 e 84 px em 1440: inclinação 40/1080 → 3.7037vw; intercepto 44 − 0.037037×360 = 30.667 px
  assert.match(css, /--type-heading-xl-font-size: clamp\(2\.75rem, 1\.9167rem \+ 3\.7037vw, 5\.25rem\);/)
  assert.match(css, /--type-body-md-font-size: 0\.875rem;/)
})

test('a camada de componente vira --<marca>-<componente>-<parte>', () => {
  const { css, json, out } = gerar()
  assert.match(css, /--da-chat-answer-font-size: 1\.125rem;/)
  assert.match(css, /\.da-chat-answer \{/)
  assert.equal(json.component.da.chat.answer.$value.fontFamily, 'Fraunces')
  assert.match(out, /Text 14/)
})
