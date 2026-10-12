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
├── claude/                        ← skills no formato Anthropic (pasta + SKILL.md)
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
├── dist/                          pacotes .skill (gerados pelo sync.sh)
└── sync.sh
```

## Fluxo de manutenção
1. Edite em `shared/`.
2. Rode `./sync.sh`. Ele copia `shared/` para as `references/` de cada skill (espaçamento só recebe `espacamento*.md`; tipografia não recebe) e gera `dist/*.skill`.
3. Se mudou a taxonomia, os pisos ou a escala de espaço, atualize à mão `figma/tipografia-semantica-agente.md` ou `figma/espacamento-semantico.md`. O sync avisa quando a condensada ficar mais velha que a fonte.

## Instalar
- **Claude:** instale `dist/tipografia-semantica-figma.skill`, `dist/tipografia-semantica-codigo.skill` e `dist/espacamento-semantico-figma.skill`, ou copie as pastas de `claude/` para a pasta de skills.
- **Agente do Figma / Figma Make:** crie uma skill e cole ou envie `figma/tipografia-semantica-agente.md`. O agente in-app aceita um texto único, sem pastas. Chame com `/tipografia-semantica` ou `/espacamento-semantico`.
- **CI:** `node claude/tipografia-semantica-codigo/scripts/checar-tipografia.mjs src/ --figma estilos.json`.

## Por que três superfícies
| Superfície | Formato | Papel |
|---|---|---|
| Skill Claude, frente Figma | Pasta com references e scripts | Auditoria completa e aplicação via MCP |
| Skill Claude, frente código | Pasta com scripts | Guardrail: o código não diverge do Figma |
| Agente do Figma | Texto único (~900 palavras) | Revisão rápida dentro do Figma, sem scripts |

Validado em 2026-09-29: inventário e preview rodaram no arquivo do portfólio (página EN, 9 estilos-alvo, 31 textos marcados); `promover`/`aplicar` testados só com DRY_RUN; scripts de código testados com fixtures.

## Changelog
- **v2 (29/09):** modo preview ANTES × DEPOIS com marcações; peso real de fonte variável; lista fechada (1 modificador); escala do projeto antes do mapa; duplicatas suspeitas; chip → label; link herda contexto; 1 estilo h1; método de contraste; meta de consolidação. Motivo: primeira rodada no agente do Figma confiou no nome "Black" (wght 360) e inflou o mapa com variantes -strong.
- **tipografia v2.1 (09/10):** ordenação da lista de estilos pela taxonomia (modo `ordenar` e passo final de promover/aplicar). Motivo: estilos gerados fora de ordem na rodada do agente do Figma.
- **tipografia v2.2 (09/10):** inventário de tipografia (fontes → estilos por papel com legenda de uso, especime, spec, HTML e usos) no preview e como página 📖 Tipografia após promover; spec.copyFrom; casamento pela spec real; deprecateOthers; marcação laranja também para mudança de peso.
- **tipografia v2.3 (09/10):** ordenação respeita pastas do Figma (estilos dentro da pasta + moveLocalTextFolderAfter). Primeira aplicação completa validada no arquivo "Portifolio v1": 95 estilos → 30, 758 trechos, página 📖 Tipografia criada, layout intacto.
- **tipografia v2.4 (09/10):** tools/figma-run (opcional, figma-console): executa scripts direto no plugin sem MCP; inventario-tipografia.js standalone (página/frame/título por ARGS); scripts aceitam ARGS; inventário ~30× mais rápido.
- **tipografia agente v3 (09/10):** versão do agente renomeada para `figma/tipografia-semantica-agente.md` (`/tipografia-semantica`); protocolo de status ao fim de cada resposta (etapa N/6, concluída/aguardando/bloqueada, o que precisa, próximo); 6 etapas com paradas explícitas; armadilhas (peso real, duplicatas, idiomas, spec real); inventário e ordenação por pastas.
- **tipografia agente v4 (09/10):** blocos de JS embutidos (A inventário · B preview/promover/descartar/ordenar · C inventário de tipografia), testados no arquivo real; perguntas numeradas, uma por mensagem, com padrão; status ao fim de cada resposta; checklist final. Inspirada na skill "Make a type scale" do Figma Community.
- **espaçamento v1.1 (10/10):** o preview passa a gerar o frame `📖 Inventário de espaçamento` (legenda: primitivos, gap e padding com demo vivo, layout, exceções, como usar, mudanças do preview) no desenho do inventário de tipografia; `aplicar` leva o frame para a página `Design System`. Pesquisa de como Cloudscape, Carbon, Red Hat, Atlassian e Spectrum documentam espaçamento. Corrigido: não dá para remover a página de preview quando ela está aberta (o script troca de página antes).
- **espaçamento v1 (09/10):** skill nova `espacamento-semantico-figma` + versão condensada. Duas camadas (`Primitives` → `Spacing`), lista fechada (`gap/*`, `padding/*`, `layout/*`), regras de encaixe por valor medido, modo `plano` somente leitura, `_deprecated/` em vez de apagar. Motivo: arquivo do portfólio com 20 variáveis `item spacing/*` geradas por importação (`14_01`, `341_69`), gap ligado a variáveis de raio, traço e fonte, e nenhum padding ligado a variável.

### Espaçamento — o que foi e o que não foi testado
- **Testado no arquivo do portfólio (Page 1, 2007 auto layouts):** `inventario.js` (leitura) e `aplicar.js` em `MODE = 'plano'` (leitura). Em 10/10, no arquivo novo (Portifolio v1): `preview` com o frame de legenda (393 propriedades ligadas, 271 marcadas) e o caminho de aprovação do frame para a página `Design System`, testado num clone em página temporária (removida). O plano achou e corrigiu um erro de regra (1 px virava 2 px; hoje fica solto como `hairline`).
- **Não testado:** `aplicar` (ligar o original), `arquivar` e `descartar` (aguardam aprovação). Não confirmado: `scopes = []` esconde a variável do picker; `createVariable(name, collection, 'FLOAT')` na versão do plugin instalada; texto oficial da WCAG 2.5.8 e 1.4.12 (descrito de memória).
- **Fora do escopo da v1:** skill-irmã de código (guardrail + gerador Figma → CSS/DTCG) e tokens de componente (`card/padding`).
