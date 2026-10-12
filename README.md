# design — skills de tipografia e espaçamento semânticos

Skills para mapear estilos de texto em nomes semânticos (`papel/tamanho`) e organizar as variáveis de espaçamento do auto layout (`gap/md`, `padding/lg`), mantendo Figma e código coerentes, com checagens de acessibilidade e compliance opcional para o Brasil.

## Estrutura

```
design/
├── shared/                        ← FONTE ÚNICA DE VERDADE (edite aqui)
│   ├── taxonomia.md               nomes, faixas, HTML, pisos, heurística
│   ├── plataformas.md             equivalência M3 · Apple · Fluent · design systems
│   ├── espacamento.md             escala, lista fechada, regras de encaixe, armadilhas (espaçamento)
│   ├── espacamento-plataformas.md Atlassian · Polaris · Primer · Dialtone · escopos do Figma · DTCG · fontes
│   └── legal/                     auditoria opcional
│       ├── README.md              como escolher grupos e formato do checklist
│       ├── lei.md                 LBI, Lei 10.098, Decreto 5.296, eMAG (federal)
│       ├── voluntario.md          WCAG AA/AAA, NBR 17225, eMAG, gov.br DS
│       └── setorial.md            CDC (contratos), ANVISA (bulas), lacunas
├── skills/                        ← skills no formato Anthropic (pasta + SKILL.md)
│   ├── tipografia-semantica-figma/
│   │   ├── SKILL.md               inventário → mapa → aprovação → aplicação
│   │   ├── scripts/inventario.js  leitura: peso real (fonte variável), duplicatas, sugestão de escopo do preview
│   │   ├── scripts/aplicar.js     modos preview (ANTES × DEPOIS + marcações) · promover · aplicar · descartar
│   │   └── references/            cópia de shared/ (gerada pelo sync.sh)
│   ├── espacamento-semantico-figma/
│   │   ├── SKILL.md               inventário → plano → proposta → preview → aplicar → arquivar
│   │   ├── scripts/inventario.js  leitura: variáveis, escopos, usos, valores soltos por classe, fora de escopo
│   │   ├── scripts/aplicar.js     modos plano (leitura) · preview · aplicar · arquivar · descartar
│   │   └── references/            cópia de shared/espacamento*.md (gerada pelo sync.sh)
│   └── tipografia-semantica-codigo/
│       ├── SKILL.md               guardrail de tokens e HTML
│       ├── scripts/checar-tipografia.mjs   lint (exit 1 em bloqueante → CI)
│       ├── scripts/gerar-tokens.mjs        Figma → CSS (rem) + DTCG
│       └── references/            cópia de shared/
├── figma/
│   ├── tipografia-semantica-agente.md versão condensada, texto único, para o agente do Figma
│   └── espacamento-semantico.md   idem, para espaçamento (~900 palavras)
├── dist/                          pacotes .skill (gerados, fora do git; anexados a cada release)
├── .claude-plugin/               manifesto do plugin e do marketplace
├── .changeset/                    mudanças pendentes de release
└── sync.sh
```

## Fluxo de manutenção
1. Edite em `shared/`.
2. Rode `./sync.sh`. Ele copia `shared/` para as `references/` de cada skill (espaçamento só recebe `espacamento*.md`; tipografia não recebe) e gera `dist/*.skill`. Commite as `references/` (o plugin é instalado do git); o `dist/` não vai para o git.
3. Rode `pnpm changeset` e descreva a mudança. O CI exige um changeset em cada pull request.
4. Se mudou a taxonomia, os pisos ou a escala de espaço, atualize à mão `figma/tipografia-semantica-agente.md` ou `figma/espacamento-semantico.md`. O sync avisa quando a condensada ficar mais velha que a fonte.

## Instalar
- **Plugin (recomendado):**
  ```
  /plugin marketplace add daniloborges/design-skills
  /plugin install design@design-skills
  ```
  Instala as três skills de uma vez.
- **Só uma skill:** baixe o `.skill` correspondente na [página de releases](https://github.com/daniloborges/design-skills/releases) ou copie a pasta de `skills/` para a pasta de skills do Claude.
- **Agente do Figma / Figma Make:** crie uma skill e cole ou envie `figma/tipografia-semantica-agente.md`. O agente in-app aceita um texto único, sem pastas. Chame com `/tipografia-semantica` ou `/espacamento-semantico`.
- **CI:** `node skills/tipografia-semantica-codigo/scripts/checar-tipografia.mjs src/ --figma estilos.json`.

## Por que três superfícies
| Superfície | Formato | Papel |
|---|---|---|
| Skill Claude, frente Figma | Pasta com references e scripts | Auditoria completa e aplicação via MCP |
| Skill Claude, frente código | Pasta com scripts | Guardrail: o código não diverge do Figma |
| Agente do Figma | Texto único (~900 palavras) | Revisão rápida dentro do Figma, sem scripts |

Validado em 2026-09-29: inventário e preview rodaram no arquivo do portfólio (página EN, 9 estilos-alvo, 31 textos marcados); `promover`/`aplicar` testados só com DRY_RUN; scripts de código testados com fixtures.

## Release
Mergear no `main` com changesets pendentes abre o pull request "Version Packages". Mergear esse pull request cria a tag, a GitHub Release e anexa os `.skill`. Mudanças: ver [CHANGELOG.md](CHANGELOG.md).

## Licença
Apache-2.0.

## Ver também
- [AGENTS.md](AGENTS.md) — mapa para agentes.
