# design-skills

Plugin Claude Code `design`: skills de tipografia e espaçamento semânticos para Figma e código.

## Layout

| Caminho | O que é |
|---|---|
| `shared/` | Fonte única de verdade (taxonomia, espaçamento, plataformas, legal). Edite só aqui. |
| `skills/<skill>/` | Uma skill (`SKILL.md`, `scripts/`). `references/` é cópia gerada: não edite. |
| `figma/` | Versões condensadas, texto único, para o agente do Figma. Mantidas à mão. |
| `tools/figma-run/` | Utilitário opcional, fora do plugin. |
| `.claude-plugin/` | `plugin.json` e `marketplace.json`. A versão é sincronizada, não editada à mão. |

## Regras

- Depois de editar `shared/`, rode `./sync.sh` e commite as `references/`. O CI falha se divergirem.
- `dist/*.skill` é gerado (no release) e fica fora do git.
- Todo pull request carrega um `.changeset/*.md` (`pnpm changeset`). A versão sai do changesets; nunca edite `version` nos manifestos.
- Mudou a taxonomia ou a escala de espaço: revise `figma/*.md` à mão (o sync avisa).
