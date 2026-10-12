# Contribuir

## Estrutura

| Caminho | Papel |
|---|---|
| `shared/` | Fonte única de verdade: taxonomia, espaçamento, plataformas, auditoria legal. Edite só aqui. |
| `skills/<skill>/` | Uma skill: `SKILL.md` e `scripts/`. `references/` é cópia gerada de `shared/`. |
| `figma/` | Versões condensadas, em texto único, para o agente do Figma. Mantidas à mão. |
| `tools/figma-run/` | Executor opcional para o figma-console, fora do plugin. |
| `.claude-plugin/` | Manifestos do plugin e do marketplace. A versão é sincronizada, nunca editada à mão. |

## Fluxo

1. Edite `shared/`.
2. Rode `./sync.sh`. Ele copia `shared/` para as `references/` de cada skill (as de espaçamento recebem só `espacamento*.md`; as de tipografia não recebem nenhum) e gera `dist/*.skill`. Commite as `references/`, porque o plugin é instalado a partir do git. O `dist/` fica fora do git.
3. Se mudou a taxonomia, os pisos de tamanho ou a escala de espaço, atualize à mão `figma/tipografia-semantica-agente.md` ou `figma/espacamento-semantico.md`. O sync avisa quando a versão condensada fica mais velha que a fonte.
4. Rode `pnpm changeset` e descreva a mudança. Todo pull request precisa de um; o CI confere.

O CI também roda `./sync.sh` e falha quando `skills/*/references` diverge de `shared/`.

## Release

Um merge no `main` com changesets pendentes abre o pull request "Version Packages". Mergear esse pull request sobe a versão em `package.json`, `.claude-plugin/plugin.json` e `.claude-plugin/marketplace.json`, cria a tag e a GitHub Release e anexa os três arquivos `.skill`.

Valide os manifestos localmente com `claude plugin validate .`. Ele avisa que o `CLAUDE.md` na raiz do plugin não é carregado como contexto. Isso é esperado: o arquivo serve a quem trabalha neste repositório, e quem instala o plugin nunca o vê.
