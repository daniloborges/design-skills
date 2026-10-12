# Equivalência com plataformas e design systems

Use para explicar ou justificar um nome, e para exportar para plataformas nativas. Não use para decidir o nome: quem decide é [taxonomia.md](taxonomia.md).

Pesquisado em setembro de 2026. Valores marcados com `~` não foram verificados na página oficial.

## Equivalência de papéis

| Nosso nome | Material 3 | Apple iOS (Dynamic Type) | Fluent 2 web | Windows |
|---|---|---|---|---|
| `display/*` | display-large 57 · medium 45 · small 36 | Large Title 34 | display 68 · largeTitle 40 | Display 68 · Title Large 40 |
| `heading/xl`–`md` | headline-large 32 · medium 28 · small 24 | Title 1 28 · Title 2 22 | title1 32 · title2 28 · title3 24 | Title 28 |
| `heading/sm` | title-large 22 | Title 3 20 | subtitle1 20 | Subtitle 20 |
| `heading/xs` | title-medium 16/500 | Headline 17 semibold | subtitle2 16 semibold | — |
| `heading/2xs` | title-small 14/500 | — | body1Strong 14 | Body Strong 14 |
| `lead/*` | — | — | — | Body Large 18 |
| `body/lg` | body-large 16 | Body 17 | — | Body Large 18 |
| `body/md` | body-medium 14 | Callout 16 | body1 14 | Body 14 |
| `body/sm` | body-small 12 | Footnote 13 | caption1 12 | Caption 12 |
| `label/md` | label-large 14/500 | Subheadline 15 | body1Strong 14 | Body Strong 14 |
| `label/sm` | label-medium 12/500 | Caption 1 12 | caption1Strong 12 | — |
| `caption/md` | body-small 12 | Caption 1 12 | caption1 12 | Caption 12 |
| `caption/sm` | label-small 11 | Caption 2 11 | caption2 10 | — |
| `eyebrow/*` | não existe (label-small + caixa alta) | não existe | não existe | não existe |
| `code/*` | não existe | não existe (SF Mono) | `fontFamilyMonospace` | — |
| `big-number/*` | não existe | não existe | não existe | não existe |
| Modificador `-strong` | `*-emphasized` (M3 Expressive) | "emphasized weight" (`.bold()`) | `*Strong` / `*Stronger` | `*Strong` |

## Mínimos por plataforma

| Plataforma | Corpo padrão | Mínimo |
|---|---|---|
| iOS / iPadOS | 17 pt | 11 pt |
| macOS | 13 pt | 10 pt |
| watchOS | 16 pt | 12 pt |
| visionOS | 17 pt | 12 pt |
| tvOS | 29 pt | 23 pt |
| Windows | 14 px | 12 px (Regular) · 14 px (Semibold) |
| Material 3 | 14–16 sp | 11 sp (label-small) |

Recomendações das plataformas:
- **Apple:** evitar os pesos Ultralight, Thin e Light em texto pequeno, e testar em todos os tamanhos do Dynamic Type (até AX5).
- **Windows:** usar Regular para o texto e Semibold para títulos; linha de 50–60 caracteres; sentence case.

## Convenções de nome em design systems públicos

| Sistema | Padrão | Exemplo | Ênfase |
|---|---|---|---|
| Atlassian | `font.papel.tamanho`; o padrão fica sem sufixo | `font.heading.large`, `font.body`, `font.metric.large` | Peso separado |
| Shopify Polaris | `papelTamanho` | `headingXl`, `bodyMd` | Prop `fontWeight` |
| GitHub Primer | `papel-tamanho` | `title-large`, `body-small`, `caption` | Peso fixo por estilo |
| GOV.UK | `govuk-papel-tamanho`; o padrão fica sem sufixo | `govuk-heading-l`, `govuk-body` | Classe utilitária `bold` |
| IBM Carbon | `papel-número`, `-compact`, prefixo `fluid-` | `heading-03`, `body-compact-01` | Peso embutido |
| Adobe Spectrum | `papel-size-tamanho` | `heading-size-xl`, `detail-size-s` | Tokens `strong` / `emphasized` |
| gov.br DS | Escala numérica sem papéis (`up-01`…`up-11`, `down-01`…`down-03`), base 14 px, Rawline | `--font-size-scale-up-02` | Tokens de peso |
| Tailwind | Utilitário, sem papéis | `text-sm`, `text-2xl` | `font-*` |

Tendências:
- **`papel/tamanho` com t-shirt é o padrão mais comum.** Nenhum dos sistemas nomeia por família ou por pixel.
- **Eyebrow/overline quase nunca vira token.** No Salesforce aparece como utilitário (`title_caps`).
- **Link e emphasis quase nunca têm estilo próprio.**
- **Responsivo mantém o nome.** GOV.UK e Polaris trocam o tamanho por breakpoint.

## Fontes

- Material 3: [material-web type scale tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-typescale.scss) · [Typography Android](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Typography.md)
- [Apple HIG – Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Fluent 2 – Typography](https://fluent2.microsoft.design/typography) · [Windows – Typography](https://learn.microsoft.com/en-us/windows/apps/design/style/typography)
- [Atlassian](https://atlassian.design/foundations/typography) · [Primer](https://primer.style/product/primitives/typography/) · [GOV.UK](https://design-system.service.gov.uk/styles/type-scale/) · [Carbon](https://carbondesignsystem.com/elements/typography/type-sets/) · [Polaris tokens](https://polaris-react.shopify.com/tokens/font) · [gov.br DS core](https://cdn.jsdelivr.net/npm/@govbr-ds/core/dist/core.css)
