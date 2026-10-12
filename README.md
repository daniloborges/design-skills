<h1 align="center">design</h1>

<p align="center"><strong>Semantic type styles and spacing variables, in Figma and in code, kept in sync.</strong><br>
A Claude Code plugin that renames <code>Text 14</code> to <code>body/md</code>, <code>item spacing/14_01</code> to <code>gap/md</code>, and checks that your CSS follows the same names.</p>

<p align="center">
  <a href="https://github.com/daniloborges/design-skills/actions/workflows/check.yml"><img alt="check" src="https://github.com/daniloborges/design-skills/actions/workflows/check.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue.svg"></a>
</p>

<p align="center">
  <a href="#why">Why</a> ·
  <a href="#install">Install</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#requirements">Requirements</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

```console
$ node skills/tipografia-semantica-codigo/scripts/checar-tipografia.mjs demo.css
# Tipografia — guardrail

1 arquivos · 1 tokens type-* · 0 bloqueantes · 2 alertas · 0 boas práticas

| ID | Local | Problema | Correção |
|---|---|---|---|
| VOL-01 | demo.css:1 | .type-heading-xl: font-size em px (44px) não escala com a preferência do usuário | use 2.75rem |
| VOL-01 | demo.css:2 | font-size fixo em px (11px) | use rem ou um token --type-* |
```

## Why

Design files drift. Text styles end up named after their looks (`Fraunces/Light wght 380`, `Text 14`), spacing variables come from imports (`14_01`, `341_69`), and the code carries a third set of names. Nobody can tell which style a heading should use, or whether the code still matches the file.

This plugin gives both sides one vocabulary: `role/size` for type (`heading/xl`, `body/md`) and `gap/*`, `padding/*`, `layout/*` for spacing. The names are a closed list, so a new style needs a reason. The same names become CSS classes (`.type-heading-xl`), custom properties and DTCG tokens, and a lint script fails the build when the code leaves the list.

The skills are written in Portuguese, and the optional accessibility audit covers Brazilian law (LBI, Lei 10.098, CDC, ANVISA) next to WCAG.

## Install

```
/plugin marketplace add daniloborges/design-skills
/plugin install design@design-skills
```

To install a single skill, download its `.skill` file from the [releases page](https://github.com/daniloborges/design-skills/releases).

The Figma in-app agent takes one text file instead of a folder. Create a skill there and paste [`figma/tipografia-semantica-agente.md`](figma/tipografia-semantica-agente.md) or [`figma/espacamento-semantico.md`](figma/espacamento-semantico.md). Call them with `/tipografia-semantica` and `/espacamento-semantico`.

## Usage

The plugin ships three skills. Each one asks Claude for a staged flow with a stop before anything changes in your file.

| Skill | Use it to | Flow |
|---|---|---|
| `tipografia-semantica-figma` | Audit text styles, rename and consolidate them into `role/size` names | inventory → map → approval → apply |
| `espacamento-semantico-figma` | Organise auto layout gap and padding variables into `Primitives` → `Spacing` | inventory → plan → proposal → preview → apply → archive |
| `tipografia-semantica-codigo` | Guard code against the type taxonomy and generate tokens from Figma | lint, generate |

Ask Claude in plain words, for example "audit the text styles in this Figma file" or "check src/ against the type taxonomy". Both Figma skills show a before-and-after preview on a separate page and change the original file only after you approve.

The code skill also runs without Claude:

```bash
# Lint CSS, SCSS, JSON, HTML, JSX, Vue or Svelte. Exit code 1 on a blocking finding, so it fits CI.
node skills/tipografia-semantica-codigo/scripts/checar-tipografia.mjs src/ --figma estilos.json

# Generate CSS (rem) and DTCG tokens from the Figma text styles
node skills/tipografia-semantica-codigo/scripts/gerar-tokens.mjs estilos.json --out tipografia
```

`estilos.json` is the output of `figma_get_text_styles` from figma-console, or an array of `{name, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing, textCase}`.

Names carry over between Figma and code:

| Figma | CSS class | Custom properties | DTCG |
|---|---|---|---|
| `heading/xl` | `.type-heading-xl` | `--type-heading-xl-*` | `type.heading.xl` |
| `heading/xl-emphasis` | `.type-heading-xl-emphasis` | `--type-heading-xl-emphasis-*` | `type.heading.xl.emphasis` |

### Known limits

- The spacing modes that bind the original file to the new variables (`aplicar`), archive old ones (`arquivar`) and discard a preview (`descartar`) have not run against a real file yet. `inventario`, `plano` and `preview` have.
- `var()` and `calc()` values are not resolved by the linter. Check those by hand.

## Requirements

- Claude Code with the plugin system.
- A Figma connection for the two Figma skills: [figma-console-mcp](https://github.com/southleft/figma-console-mcp) or another MCP that can run Plugin API code. [`tools/figma-run`](tools/figma-run) is an optional runner for figma-console only.
- Node.js 18 or later for the scripts. They have no dependencies.

## License

Apache-2.0. See [LICENSE](LICENSE).
