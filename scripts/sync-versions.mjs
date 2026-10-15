// SPDX-License-Identifier: Apache-2.0
// Copy the version changesets bumps in package.json into the root plugin.json, into
// .claude-plugin/plugin.json and into the plugin's entry in .claude-plugin/marketplace.json, then
// derive the Codex and Cursor catalogs from that marketplace. With --check, write nothing and exit 1
// when any of those files differs from what a run would write.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { CODEX_PATH, CURSOR_PATH, codexCatalog, cursorCatalog } from './marketplaces.mjs'

const check = process.argv.includes('--check')
const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
const text = (v) => JSON.stringify(v, null, 2) + '\n'
const stale = []
const put = (p, v) => {
  const next = text(v)
  if (check) {
    if (!existsSync(p) || readFileSync(p, 'utf8') !== next) stale.push(p)
    return
  }
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, next)
}

const { version } = read('package.json')

const rootPath = 'plugin.json'
const root = read(rootPath)
root.version = version
put(rootPath, root)

const pluginPath = '.claude-plugin/plugin.json'
const plugin = read(pluginPath)
if (plugin.name !== root.name) throw new Error(`${pluginPath} name ${plugin.name} differs from ${rootPath} name ${root.name}`)
plugin.version = version
put(pluginPath, plugin)

const marketplacePath = '.claude-plugin/marketplace.json'
const marketplace = read(marketplacePath)
const entry = marketplace.plugins.find((p) => p.name === plugin.name)
if (!entry) throw new Error(`${plugin.name} is not listed in ${marketplacePath}`)
entry.version = version
put(marketplacePath, marketplace)

put(CODEX_PATH, codexCatalog(marketplace))
put(CURSOR_PATH, cursorCatalog(marketplace))

if (check && stale.length) {
  console.error(`Out of date (run: node scripts/sync-versions.mjs): ${stale.join(', ')}`)
  process.exit(1)
}
