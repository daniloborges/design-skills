# design-skills

Plugin `design` do Claude Code: três skills de estilos de texto e variáveis de espaçamento semânticos, no Figma e no código. Skills, scripts e documentação ficam em português.

## Estrutura

| Caminho | Papel |
|---|---|
| `shared/` | Único lugar onde se editam regras e taxonomia. Tudo em `skills/*/references/` é cópia gerada. |
| `figma/*.md` | Versões condensadas para o agente do Figma. Mantidas à mão, então ficam velhas quando `shared/` muda. |
| `tools/figma-run/` | Executor opcional, com `package.json` próprio. Fora do plugin. |

## Como este repositório funciona

- Depois de editar `shared/`, rode `./sync.sh` e commite as `references/` geradas. O CI falha em qualquer diferença. Nunca edite um arquivo de `references/` direto.
- `dist/*.skill` é gerado pelo `sync.sh` e fica fora do git. O workflow de release o anexa à GitHub Release.
- As versões vêm do changesets. Nunca edite `version` em `package.json`, `.claude-plugin/plugin.json` ou `.claude-plugin/marketplace.json`; o `scripts/sync-versions.mjs` copia.
- Todo pull request precisa de um `.changeset/*.md` (`pnpm changeset`). O gerenciador de pacotes é o pnpm.
- A taxonomia é uma lista fechada, com no máximo um modificador por nome. Um nome novo exige justificativa em `shared/taxonomia.md` antes.
- As skills do Figma só alteram o arquivo do usuário depois de uma aprovação explícita. Um modo novo que escreve no Figma mantém essa parada e um dry-run.

## Fonte de verdade

| O quê | Onde |
|---|---|
| Nomes de texto, faixas de tamanho, pisos | `shared/taxonomia.md` |
| Escala de espaçamento e regras de encaixe | `shared/espacamento.md` |
| Auditoria opcional de compliance brasileiro | `shared/legal/` |
| Checagens do lint e seus IDs | tabela em `skills/tipografia-semantica-codigo/SKILL.md`, implementadas em `scripts/checar-tipografia.mjs` |
| Fluxo de release | `.github/workflows/release.yml`; passos humanos em `CONTRIBUTING.md` |

## Manter este arquivo atualizado

Atualize a linha afetada na mesma mudança quando: uma pasta de primeiro nível entrar ou sair; um arquivo de `figma/` ou `tools/` mudar de papel; o fluxo de release ou de sync mudar; uma regra acima deixar de valer.
