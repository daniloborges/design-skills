# Changelog

## 0.4.0

### Minor Changes

- 472300d: Duas skills novas e dois complementos.

  - **`dimensao-semantica-figma`**: tokens `size/<papel>/<degrau>` para thumbs, avatares, ícones e contêineres, com a regra de harmonia (a mídia acompanha N linhas do título ao lado), a receita de empilhar mídia + texto no mobile só com variáveis, e a detecção de largura ou altura ligada a variável de outra família. Fonte de verdade em `shared/dimensao.md`.
  - **`de-para-tipografico-figma`**: leva a tipografia de uma exploração para outro arquivo como um conjunto `<marca>:<componente>-<parte>`, escolhendo a instância pelo peso real medido no destino, com o de-para na descrição de cada estilo e um frame de documentação. A taxonomia ganha a seção "Camada de componente".
  - **`tipografia-semantica-codigo`**: `gerar-tokens.mjs --modos` gera `font-size` em `clamp()` a partir dos valores Desktop e Mobile, e os estilos da camada de componente saem como `--<marca>-<componente>-<parte>-*`.
  - **`tipografia-semantica-figma`**: o inventário aceita `compact: true`, uma linha por estilo e por grupo, para arquivos cujo JSON completo passa do limite da ferramenta.

- 7a5a678: Guardas das chamadas ao figma-console. Um hook `PreToolUse` barra o `figma_execute` que usa a API síncrona da Plugin API, recusada pelo Figma com `documentAccess: dynamic-page`, e devolve a troca pela versão `Async`. O mod `figma-details` pede `fileKey` quando há mais de um arquivo conectado e mostra o arquivo alvo na linha de status.
- 6f3072b: Modo responsivo (Desktop × Mobile). A tipografia ganha o passo 8 e o script `responsivo.js`: liga tamanho, entrelinha e tracking dos estilos a variáveis com um valor por modo, com dry-run, bloqueio de variantes divergentes e verificação pelo valor resolvido dentro dos frames. O espaçamento ganha o passo 8 e o script `modo-breakpoint.js`: o modo `Mobile` em `Spacing` reaponta cada semântico para outro primitivo e conta os nós ligados × soltos. A regra comum (uma chave de modo só, valor de desktop exato, o pequeno fica e o grande encolhe mais) mora em `shared/modos.md`. As duas skills passam a declarar o tipo (target-state).

  O `figma-run` sai com o código 3 e uma mensagem clara quando as 10 portas 9223–9232 estão ocupadas por sessões com o figma-console MCP; antes, o erro de porta ocupada derrubava o processo com o código 1.

## 0.3.0

### Minor Changes

- b9bcdf9: O plugin passa a instalar também no Codex, Cursor, Copilot CLI e Antigravity: `plugin.json` na raiz (Agent Plugins 1.0) e catálogos do Codex e do Cursor gerados a partir de `.claude-plugin/marketplace.json`. Todas as três skills viajam; o Copilot CLI passa a preferir o manifesto da raiz.

## 0.2.0

### Minor Changes

- bf7ea4c: Nova skill `configurar-figma-console`: instala, diagnostica e ensina a usar a ligação do Claude Code com o Figma Desktop pelo figma-console MCP. A instalação padrão dispensa o token do Figma, porque o plugin Desktop Bridge cobre o trabalho no arquivo aberto; o modo `token` liga comentários, histórico de versões e biblioteca publicada quando a pessoa precisa.

## 0.1.0

### Minor Changes

- 63e49ed: Primeira release do plugin: skills de tipografia semântica (Figma e código) e de espaçamento semântico (Figma).

O changesets escreve as próximas releases acima desta linha. O histórico abaixo vem do README original, anterior à `0.1.0`.

## Histórico anterior à 0.1.0

- **v2 (29/09):** modo preview ANTES × DEPOIS com marcações; peso real de fonte variável; lista fechada (1 modificador); escala do projeto antes do mapa; duplicatas suspeitas; chip → label; link herda contexto; 1 estilo h1; método de contraste; meta de consolidação. Motivo: primeira rodada no agente do Figma confiou no nome "Black" (wght 360) e inflou o mapa com variantes -strong.
- **tipografia v2.1 (09/10):** ordenação da lista de estilos pela taxonomia (modo `ordenar` e passo final de promover/aplicar). Motivo: estilos gerados fora de ordem na rodada do agente do Figma.
- **tipografia v2.2 (09/10):** inventário de tipografia (fontes → estilos por papel com legenda de uso, especime, spec, HTML e usos) no preview e como página 📖 Tipografia após promover; spec.copyFrom; casamento pela spec real; deprecateOthers; marcação laranja também para mudança de peso.
- **tipografia v2.3 (09/10):** ordenação respeita pastas do Figma (estilos dentro da pasta + moveLocalTextFolderAfter). Primeira aplicação completa validada num arquivo real: 95 estilos → 30, 758 trechos, página 📖 Tipografia criada, layout intacto.
- **tipografia v2.4 (09/10):** tools/figma-run (opcional, figma-console): executa scripts direto no plugin sem MCP; inventario-tipografia.js standalone (página/frame/título por ARGS); scripts aceitam ARGS; inventário ~30× mais rápido.
- **tipografia agente v3 (09/10):** versão do agente renomeada para `figma/tipografia-semantica-agente.md` (`/tipografia-semantica`); protocolo de status ao fim de cada resposta (etapa N/6, concluída/aguardando/bloqueada, o que precisa, próximo); 6 etapas com paradas explícitas; armadilhas (peso real, duplicatas, idiomas, spec real); inventário e ordenação por pastas.
- **tipografia agente v4 (09/10):** blocos de JS embutidos (A inventário · B preview/promover/descartar/ordenar · C inventário de tipografia), testados no arquivo real; perguntas numeradas, uma por mensagem, com padrão; status ao fim de cada resposta; checklist final. Inspirada na skill "Make a type scale" do Figma Community.
- **espaçamento v1.1 (10/10):** o preview passa a gerar o frame `📖 Inventário de espaçamento` (legenda: primitivos, gap e padding com demo vivo, layout, exceções, como usar, mudanças do preview) no desenho do inventário de tipografia; `aplicar` leva o frame para a página `Design System`. Pesquisa de como Cloudscape, Carbon, Red Hat, Atlassian e Spectrum documentam espaçamento. Corrigido: não dá para remover a página de preview quando ela está aberta (o script troca de página antes).
- **espaçamento v1 (09/10):** skill nova `espacamento-semantico-figma` + versão condensada. Duas camadas (`Primitives` → `Spacing`), lista fechada (`gap/*`, `padding/*`, `layout/*`), regras de encaixe por valor medido, modo `plano` somente leitura, `_deprecated/` em vez de apagar. Motivo: arquivo real com 20 variáveis `item spacing/*` geradas por importação (`14_01`, `341_69`), gap ligado a variáveis de raio, traço e fonte, e nenhum padding ligado a variável.

### Espaçamento — o que foi e o que não foi testado

- **Testado num arquivo real (2007 auto layouts):** `inventario.js` (leitura) e `aplicar.js` em `MODE = 'plano'` (leitura). Em 10/10, num segundo arquivo: `preview` com o frame de legenda (393 propriedades ligadas, 271 marcadas) e o caminho de aprovação do frame para a página `Design System`, testado num clone em página temporária (removida). O plano achou e corrigiu um erro de regra (1 px virava 2 px; hoje fica solto como `hairline`).
- **Não testado:** `aplicar` (ligar o original), `arquivar` e `descartar` (aguardam aprovação). Não confirmado: `scopes = []` esconde a variável do picker; `createVariable(name, collection, 'FLOAT')` na versão do plugin instalada; texto oficial da WCAG 2.5.8 e 1.4.12 (descrito de memória).
- **Fora do escopo da v1:** skill-irmã de código (guardrail + gerador Figma → CSS/DTCG) e tokens de componente (`card/padding`).
