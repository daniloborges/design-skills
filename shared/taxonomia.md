# Taxonomia semântica de estilos de texto

Fonte única de verdade. As skills de Figma e de código leem este arquivo, e a versão condensada do agente do Figma é gerada a partir dele. Qualquer mudança começa aqui.

## Princípios

1. **O nome indica o papel, não a aparência.** Família, peso e pixel ficam dentro do estilo, nunca no nome. `Fraunces/Light wght 380` e `Text 14` são proibidos.
2. **O papel define o elemento HTML.** Um `heading/*` é sempre `h1`–`h6` (ou `role="heading"`). Um parágrafo com cara de título continua sendo `body` ou `lead`.
3. **O tamanho define só o visual.** O nível do heading vem da estrutura do documento. Um `heading/xl` pode estar num `h2`.
4. **Escala t-shirt:** `2xs` · `xs` · `sm` · `md` · `lg` · `xl`. `md` é o padrão de cada papel.
5. **Ênfase é modificador, não papel.** Existem dois sufixos, `-emphasis` e `-strong`. Um estilo novo só se justifica quando também mudam o tamanho ou a entrelinha.
6. **Responsivo não entra no nome.** Mobile e desktop usam o mesmo nome; a diferença vai para modos de variável.
7. **Tamanho e entrelinha andam juntos**, em valores inteiros e numa grade de 2 ou 4 px.
8. **A lista é fechada.** Só existem os nomes das tabelas abaixo, com **no máximo um** modificador. `label/lg`, `-emphasis-strong` e `display/xl-strong` sem variação real de peso não existem. Se algo não couber, pergunte, não invente.
9. **Vale o peso real, não o nome da instância.** Em fonte variável, o peso é o eixo `wght` (`fontName.variationSettings.wght` / `fontWeight`). Um "Fraunces Black" com `wght 360` é Light. Importações de site (html.to.design e parecidos) costumam deixar o nome errado.
10. **Um único estilo tem `h1` como padrão** no arquivo: em geral `display/xl`, ou `heading/xl` se não houver display.

## Formato do nome em cada meio

| Meio | Formato | Exemplo |
|---|---|---|
| Estilo no Figma | `papel/tamanho[-modificador]` | `heading/xl-emphasis` |
| Classe CSS | `.type-papel-tamanho[-modificador]` | `.type-heading-xl-emphasis` |
| Custom properties | `--type-papel-tamanho-{font-size,line-height,font-weight,letter-spacing,font-family}` | `--type-body-md-line-height` |
| Tokens DTCG / JSON | `type.papel.tamanho[.modificador]` | `type.heading.xl.emphasis` |

Um prefixo de marca (`acme/heading/xl`) é opcional e fica sempre antes do papel.

## Lista de nomes

As faixas de tamanho (px) servem para **sugerir** o nome. O papel é decidido pelo contexto: um texto de 22 px pode ser `heading/sm`, `lead/md` ou `big-number/md`, conforme a função. Quando o contexto não resolve, a skill pergunta.

### Títulos

| Nome | Faixa (px) | Uso | HTML padrão | Aceito | Nunca |
|---|---|---|---|---|---|
| `display/xl` | ≥ 120 | Hero de página | `h1` | `p` decorativo, com o `h1` real em outro lugar | `div` sem papel |
| `display/lg` | 80–119 | CTA de fechamento, hero secundário | `h1` / `h2` | `p` decorativo | `div` sem papel |
| `display/md` | 57–79 | Frase de destaque | `h2` | `p` decorativo | `div` sem papel |
| `heading/xl` | 40–56 | Título de seção | `h2` | `h1`–`h6`, `role="heading"` | `p`/`span`/`div` |
| `heading/lg` | 32–39 | Título de bloco | `h2` / `h3` | idem | idem |
| `heading/md` | 24–31 | Subseção | `h3` | idem | idem |
| `heading/sm` | 20–23 | Título de card | `h3` / `h4` | idem | idem |
| `heading/xs` | 16–19, peso ≥ 500 | Título de item, lista, aba | `h4` | idem | idem |
| `heading/2xs` | 14–15, peso ≥ 500 | Título pequeno | `h5` / `h6` | idem | idem |

### Leitura

| Nome | Faixa (px) | Uso | HTML padrão | Aceito | Nunca |
|---|---|---|---|---|---|
| `lead/lg` | 24–32 | Parágrafo de abertura grande | `p` | — | `h*` |
| `lead/md` | 18–23 | Introdução de seção | `p` | — | `h*` |
| `body/lg` | 16–18 | Texto longo | `p` | `li`, `dd`, `td`, `blockquote` | `h*` |
| `body/md` | 14–15 | Texto padrão | `p` | `li`, `dd`, `td` | `h*` |
| `body/sm` | 12–13 | Texto secundário | `p` | `li`, `dd`, `td`, `small` | `h*` |

### Suporte

| Nome | Faixa (px) | Uso | HTML padrão | Aceito | Nunca |
|---|---|---|---|---|---|
| `label/md` | 13–14, peso ≥ 500 | Botão, navegação, campo | `button`, `a`, `label` | `span` | `h*` |
| `label/sm` | 12, peso ≥ 500 | Chip, tag, badge | `span` | `a`, `button` | `h*` |
| `caption/md` | 12–13 | Legenda de métrica, nota | `figcaption` | `p`, `small` | — |
| `caption/sm` | 11 | Menor texto permitido | `small` | `p`, `span` | — |
| `eyebrow/md` | 12, caixa alta, tracking ≥ 0,1em | Kicker acima do título | `p` antes do `h*`, ou dentro de `hgroup` | `span` | `h*` |
| `eyebrow/sm` | 11, caixa alta | Kicker compacto | idem | idem | `h*` |
| `code/md` | 13–14, mono | Código, dado técnico | `code` | `time`, `kbd`, `samp`, `pre` | `h*` |
| `code/sm` | 12, mono | Metadado, idioma, rodapé | `code` | `time`, `span` | `h*` |
| `legal/md` | ≥ 16 | Termos, contrato, consentimento | `small` (o HTML define `small` para letras miúdas e texto legal) | `p` | `h*` |

### Editorial (extensões opcionais)

| Nome | Faixa (px) | Uso | HTML padrão | Aceito | Nunca |
|---|---|---|---|---|---|
| `big-number/lg` | 56–120 | Número de destaque grande (big number, metric, KPI) | `p` ou `dd` (rótulo em `dt`) | `data value="…"` | `h*` |
| `big-number/md` | 20–55 | Número de destaque em card | idem | idem | `h*` |
| `index/md` | 14–20, geralmente itálico | Numeração editorial "(01)" | `span aria-hidden="true"` | marcador de `ol` via CSS | `h*` |

`big-number` equivale ao `metric` do Atlassian, ao "Big Number" do Apache Superset e aos "BANs" do Tableau. Mesmo quando o número é o maior texto da tela, ele não é heading: o rótulo dá o sentido. A forma recomendada é `<dl><dt>clientes</dt><dd class="type-big-number-lg">24M</dd></dl>`.

## Ordem na lista de estilos

A lista de estilos do arquivo segue a ordem da taxonomia, não a ordem de criação:
1. **Papel:** display → heading → lead → body → label → caption → eyebrow → code → legal → big-number → index.
2. **Tamanho:** 2xl → xl → lg → md → sm → xs → 2xs.
3. **Variante:** base → `-emphasis` → `-strong`.
4. **Depois:** os `novo/*` do preview, os estilos fora da taxonomia e, por último, os `_deprecated/*`.

Ordenar faz parte de toda aplicação e também pode ser pedido isoladamente.

## Modificadores

| Sufixo | O que muda | Quando usar | Exemplo |
|---|---|---|---|
| `-emphasis` | Estilo (itálico ou variação expressiva), mesmo tamanho e entrelinha | Trecho expressivo dentro de um título ou número | `heading/xl-emphasis` |
| `-strong` | Peso maior, mesmo tamanho e entrelinha | Destaque de peso | `body/md-strong` |

Um trecho com ênfase dentro de um texto **não** justifica um estilo de texto misto. O texto base recebe o estilo do papel e o trecho recebe o estilo com modificador. No HTML, `-emphasis` vira `em` e `-strong` vira `strong`, só quando a ênfase tem sentido; se for puramente visual, vira `span`.

Link não é estilo. É o estilo do papel (`body/md`) mais decoração e cor, porque nenhum dos design systems de referência trata link como estilo de texto.

## Pisos e limites

| Regra | Limite | Severidade | Base |
|---|---|---|---|
| Qualquer texto | ≥ 11 px | Bloqueante | Apple (mínimo de 11 pt no iOS) |
| `label/*`, `caption/md`, `code/*`, `eyebrow/md`, `body/sm` | ≥ 12 px | Alerta | Windows/Fluent (12 px Regular) |
| `body/md` e maiores | ≥ 14 px (16 recomendado) | Alerta | Windows, M3, GOV.UK |
| Texto em peso ≥ 600 abaixo de 14 px | evitar | Boa prática | Windows (14 px para Semibold) |
| `legal/*` | ≥ 16 px | Bloqueante quando o texto é contrato de adesão | CDC art. 54 §3º, lido como "corpo 12 ≈ 16 px" (é interpretação) |
| Entrelinha de `body/*` e `lead/*` | ≥ 1,5× | Boa prática (AAA) | WCAG 1.4.8 |
| Entrelinha de `heading/*` e `display/*` | 0,9–1,3× | Boa prática | Convergência entre os design systems |
| Tamanhos fracionados (13,6 px) | usar inteiros na grade | Alerta | Coerência da escala |
| Contraste do texto | ≥ 4,5:1; texto grande (≥ 24 px, ou ≥ 18,66 px com peso ≥ 700) ≥ 3:1 | Bloqueante | WCAG 1.4.3, eMAG, NBR 17225 |
| Frame de texto com altura fixa | usar hug / auto-layout | Alerta | WCAG 1.4.12 (o texto precisa aguentar espaçamento ampliado) |
| Unidade no código | rem, em ou % (nunca px fixo em `font-size`) | Alerta (só no código) | WCAG 1.4.4, técnicas C12, C13 e C14 |
| Texto justificado | evitar | Boa prática | WCAG 1.4.8 |
| Medida (comprimento da linha) de `body` | ≤ 80 caracteres | Boa prática | WCAG 1.4.8; o Windows recomenda 50–60 |

## Faixas por projeto (escala expressiva)

As faixas acima valem para produto e UI. Sites editoriais e portfólios costumam ter uma escala maior: um título de seção de 84 px continua sendo `heading/xl`, não `display/lg`. Nesses casos:
- As faixas do projeto ficam em `tipografia.faixas.json`, na raiz do repositório ou junto do arquivo Figma documentado. Só as diferenças: `{"heading": {"xl": [72, 96], "lg": [44, 71]}}`.
- As duas skills leem esse arquivo. No código, passe `--faixas tipografia.faixas.json`.
- **Os pisos mínimos não mudam com as faixas.** Faixa é convenção de escala; piso é acessibilidade.

## Heurística de mapeamento (ordem)

0. **Defina a escala do projeto primeiro**: uma tabela "degrau → tamanho", com um tamanho por degrau, montada a partir dos tamanhos reais do arquivo. Ela é aprovada junto com o mapa, e todas as linhas do mapa usam essa tabela. Nunca decida o degrau linha a linha, porque isso gera 84 px como `display` numa linha e como `heading` na outra.
1. **Ignore texto de documentação**: rótulos de especimes, anotações, frames de documentação e rótulos de variante de componente ("variant", "default", "hover"…).
2. **Família monoespaçada** → `code/*`.
3. **Caixa alta com tracking positivo** → `eyebrow/*`, ou `label/*` se for interativo.
3b. **Texto curto dentro de pílula ou chip** (frame pai com fill ou stroke e padding: tags, badges) → `label/sm`, com piso de 12 px. Não é `caption`.
3c. **Link não é papel.** Um link herda o estilo do contexto (`body/md`, `heading/sm`…) e ganha decoração ou cor. Nunca vira `heading/*` só por ser link.
4. **Número curto** (≤ 6 caracteres, só dígitos e símbolos como `+ × % M k`), grande e isolado → `big-number/*`.
5. **Padrão `(01)`, `01.` ou `№`** → `index/md`.
6. **Pela faixa de tamanho e pelo contexto:**
   - Texto que abre seção → `display` ou `heading`.
   - Parágrafo de várias linhas → `lead` (≥ 18 px) ou `body`.
   - Texto interativo → `label`.
   - Texto abaixo de uma mídia ou métrica → `caption`.
7. **Variação de estilo ou peso** de um estilo base de mesmo tamanho → modificador (`-emphasis`, `-strong`).
8. **Empate** → pergunte, mostrando 2 ou 3 exemplos reais do texto.

## Duplicatas suspeitas

Grupos que parecem diferentes, mas visualmente são o mesmo estilo.

**Sinais:**
- Mesmo tamanho, entrelinha e tracking, diferindo só no nome da instância da fonte ("Black" × "Light").
- Diferença de peso real menor que 100.
- Tamanhos que diferem menos de 0,5 px (13,1 × 13,4).
- Mesmo texto em versões de idioma (EN/PT) com specs levemente diferentes.

**Antes de criar estilos:**
- Faça **uma pergunta global**, não uma por linha. Exemplo: "Os textos 'Fraunces Black' estão com wght 360–380, mesmo peso dos estilos Light. Trato como o mesmo estilo?"
- Nunca crie `-strong` só porque o nome da instância diz Black ou Bold.

**Se já foram criados** (numa rodada anterior ou por outra ferramenta):
- O inventário os mostra como `duplicateSpecs`, porque a comparação usa o peso real.
- Proponha a fusão: o estilo com nome da taxonomia fica, e os outros entram em `from.styles` do alvo e viram `_deprecated/`. Mostre no preview antes.

**Meta de consolidação:** mostre "estilos antes → depois" na proposta. Um portfólio ou site médio costuma caber em 20–30 estilos, e um produto em 15–25. Se a proposta passar muito disso, revise antes de pedir aprovação.

## Contraste (método no Figma)

1. Pegue a cor do primeiro fill sólido do texto.
2. Compare com o primeiro fill sólido de um ancestral (se não houver, branco), usando a luminância relativa da WCAG.
3. Aplique o limite: ≥ 4,5:1, ou ≥ 3:1 para texto grande.
4. Sobre imagem, gradiente ou transparência, o resultado é aproximado: marque ⚠️ e peça conferência visual.

Nunca responda "não é possível checar contraste" sem ter tentado.
