# Espaçamento — pesquisa e equivalências

Pesquisa de 09/10/2026. Cada linha diz o que a fonte afirma; o que é interpretação está marcado. Páginas JS que o fetch não renderiza foram lidas por resultado de busca, não por leitura integral.

## Design systems

| Sistema | Base | Nomes | O que adotamos |
|---|---|---|---|
| **Atlassian** | 8 px | `space.100 = 8px`; sufixo = % da base; `025 · 050 · 075 · 100 · 150 · 200 · 250 · 300 · 400 · 500 · 600 · 800 · 1000`; negativos só em código | escala com meios-passos e uso por faixa (compacto 0–8, médio 12–24, layout 32–80). Só primitivos para espaço |
| **Shopify Polaris** | 4 px | `space-100 = 4px` … `space-3200 = 128px`; semânticos `space-card-padding`, `space-button-group-gap`, `space-table-cell-padding` | camadas primitivo/semântico; "sempre semântico quando houver"; variáveis acessíveis direto nos campos de gap e padding do auto layout |
| **GitHub Primer** | 4 px | base `base-size-4`; funcionais `stack-gap-condensed/normal/spacious`, `stack-padding-*`; de controle `control-{size}-paddingBlock/Inline-*`, `-gap` | três camadas (base, funcional, componente); `normal` como padrão; densidade por nome |
| **Dialtone (Dialpad)** | 4 px | `space-400` vs `size-400` | espaço (padding, margin, gap) ≠ tamanho (largura, altura). Gap usa `space`, nunca `size` |
| **New York State DS** | — | primitivo → semântico → tema | "não use primitivo direto no CSS" |
| **Master CSS** | 4 px | `4xs … 5xl` | não usar chaves numéricas de índice (`1: 4, 2: 8`) |

Interpretação: não existe convenção única entre percentual da base (Atlassian, Polaris), valor em px (Primer) ou t-shirt (Master CSS). Escolhemos **px no primitivo** (legível no painel do Figma e conferível contra o dado medido) e **t-shirt no semântico** (mesma família da skill de tipografia: `xs … 2xl`). O custo é renomear primitivos se a base mudar; é raro.

## Como os design systems documentam espaçamento
Lido em 10/10/2026 (fetch das páginas; o que é imagem não foi visto).

| Sistema | Formato da página | O que aproveitamos |
|---|---|---|
| **Cloudscape** | texto e tabela de 9 tokens (`xxx-small` 2 px … `xxx-large` 40 px) com colunas unidade, tamanho, preview e exemplos de uso reais ("rótulo → controle", "padding vertical do popover") | exemplo de uso por token; dentro (padding) × entre (margem) em texto |
| **Carbon** | tabela de `$spacing-01…13` com token, rem, px e um SVG de exemplo; seções "aplicando espaçamento" e "stacking"; FAQ sobre valores fora da escala | token + px + exemplo visual; tratar fora da escala como pergunta |
| **Red Hat** | uma escala só (4 a 80 px, base 4); guias por contexto (tipografia, componentes, layout) com valor por breakpoint; exceções anotadas inline ("o espaçador de 6 px não deve ser usado em outro lugar") | agrupar por contexto; exceção explícita |
| **Atlassian** | tokens por faixa de uso (compacto 0–8, médio 12–24, layout 32–80) | faixas no texto de uso |
| **Spectrum** | a página de visão geral só traz princípios (relacional, proporcional, perceptual) e remete a páginas de layout e de componente | nada de token; separar layout e componente, como `layout/*` |

Interpretação: nenhum dos cinco mostra gap e padding com demo vivo ligado ao token. Isso é decisão nossa, e é barato: um auto layout com a variável ligada.
Não verificado: a coluna "preview" do Cloudscape pode ter barras que o fetch não trouxe; as páginas de token do Spectrum não foram lidas.

## Convenções de nome (artigos de referência)
- Hierarquia primitivo → semântico → componente; componente referencia semântico, nunca primitivo (alwaystwisted.com; designsystemscollective.com).
- "Nomeie pelo porquê, não pelo valor" nas camadas semântica e de componente.
- Escala que cresce nos dois sentidos (`100, 200, 300, 420`), sem nomes que dependem de contagem (`spacing-small`, `-smaller`, `-new`, `-new-2`).
- Padrão `categoria/papel/variante` mirrored entre design e código (atomize.tools).
- Semver para tokens: remover ou renomear é major (timgraf.com). Por isso renomeamos para `_deprecated/` em vez de apagar.

## Figma — o que a API permite
- **Escopos de FLOAT:** `ALL_SCOPES · TEXT_CONTENT · CORNER_RADIUS · WIDTH_HEIGHT · GAP · OPACITY · STROKE_FLOAT · EFFECT_FLOAT · FONT_WEIGHT · FONT_SIZE · LINE_HEIGHT · LETTER_SPACING · PARAGRAPH_SPACING · PARAGRAPH_INDENT` (developers.figma.com/docs/plugins/api/VariableScope). **Não existe escopo de padding.** Gap e padding compartilham `GAP`. Há pedidos abertos de escopos separados no fórum do Figma desde 2023.
- Escopo vazio esconde a variável do picker; usamos nos primitivos (prática descrita por uma skill de terceiros, `cc-figma-tokens`; **conferir no arquivo** na primeira execução).
- Escopos só controlam o picker: não impedem ligação por API (documentação secundária, `figma-code-agent`; **confirmado pelo arquivo medido**, onde `itemSpacing` está ligado a variáveis de traço, raio e fonte).
- Cada borda de padding é ligada separadamente: `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`. Gap: `itemSpacing`; com wrap, `counterAxisSpacing`.
- `codeSyntax.WEB` deve existir em todas as variáveis que vão para o código.

## DTCG (formato de intercâmbio)
- Tipo `dimension`, valor `{ "value": 16, "unit": "px" }` na versão 2025.10; `$type` herdado do grupo; `$description` em qualquer token; referências por `{grupo.token}`.
- Style Dictionary v4 lê DTCG nativamente (fonte secundária).

## Não verificado nesta rodada
- Texto oficial da WCAG 2.2 (2.5.8, 1.4.12): descrito de memória em `espacamento.md`.
- Escopo `[]` esconde mesmo a variável no picker: a testar no arquivo.
- Material Design 3 e Apple HIG: não pesquisados (páginas JS); para espaçamento, M3 usa 4 dp como base e HIG não publica tokens.

## Fontes
- Atlassian — https://atlassian.design/foundations/spacing · https://atlassian.design/tokens/design-tokens
- Polaris — https://polaris-react.shopify.com/tokens/space · https://polaris.shopify.com/design/layout/layout-tokens · https://polaris-react.shopify.com/previous-releases/version-12
- Primer — https://primer.style/product/primitives/token-names/ · https://deepwiki.com/primer/primitives/2.3-typography-and-size-tokens
- Dialtone — https://dialtone.dialpad.com/design/space/
- Cloudscape — https://cloudscape.design/foundation/visual-foundation/spacing/
- Carbon — https://carbondesignsystem.com/elements/spacing/overview/
- Red Hat — https://ux.redhat.com/foundations/spacing/
- Spectrum — https://spectrum.adobe.com/page/spacing/
- NYS — https://designsystem.ny.gov/foundations/tokens/
- Master CSS — https://rc.css.master.co/guide/spacing
- Figma VariableScope — https://developers.figma.com/docs/plugins/api/VariableScope
- Fórum Figma — https://forum.figma.com/suggest-a-feature-11/variables-distinguish-between-auto-layout-gap-and-padding-29182 · https://forum.figma.com/t/paddings-as-a-separate-section-in-number-scoping-when-making-variables/49421
- Nomes — https://www.alwaystwisted.com/articles/design-token-naming-conventions · https://www.designsystemscollective.com/design-token-naming-that-scales-how-to-prevent-token-chaos-b92ff4cd55fd · https://timgraf.com/ux-design/design-tokens-demystified-a-complete-guide-to-building-and-scaling-design-token-systems-for-modern-product-teams/ · https://atomize.tools/blog/figma-design-system-best-practices/
- DTCG — https://www.designtokens.org/tr/drafts/format/ · https://designtokens.substack.com/p/dimensional-scales-from-base-value
