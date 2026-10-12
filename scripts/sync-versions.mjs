// SPDX-License-Identifier: Apache-2.0
// Copy the version changesets bumps in package.json into .claude-plugin/plugin.json
// and into the plugin's entry in .claude-plugin/marketplace.json.
import { readFileSync, writeFileSync } from 'node:fs'

const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
const write = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n')

const { version } = read('package.json')

const pluginPath = '.claude-plugin/plugin.json'
const plugin = read(pluginPath)
plugin.version = version
write(pluginPath, plugin)

const marketplacePath = '.claude-plugin/marketplace.json'
const marketplace = read(marketplacePath)
const entry = marketplace.plugins.find((p) => p.name === plugin.name)
if (!entry) throw new Error(`${plugin.name} is not listed in ${marketplacePath}`)
entry.version = version
write(marketplacePath, marketplace)
