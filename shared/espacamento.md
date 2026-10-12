# Espaçamento semântico — taxonomia (fonte única)

Variáveis de **gap** e **padding** do auto layout, em duas camadas: primitivos (valores) e semânticos (intenção). Esta página é a fonte de verdade das skills `espacamento-semantico-figma` e da versão condensada do agente do Figma. Pesquisa e fontes: [espacamento-plataformas.md](espacamento-plataformas.md).

## Princípios (resumo)
1. **Duas camadas.** `Primitives` guarda o valor (`space/16`), escondido do picker. `Spacing` guarda a intenção (`gap/md`) e é a única que aparece em gap e padding. Auto layout só usa a camada semântica.
2. **Grade de 4 px**, com passos de 2 e 6 e saltos maiores no fim. É a mesma base de Polaris e Primer; Atlassian usa 8 com meios-passos e chega aos mesmos valores.
3. **Lista fechada de nomes.** O modelo não inventa passo, grupo nem nome. Valor que não cabe vira pergunta, não nome novo.
4. **O nome diz o papel, não o pixel.** `gap/md`, nunca `gap/16` nem `item spacing/14_01`. Só o primitivo leva o valor no nome, e sempre inteiro e exato.
5. **Gap e padding são grupos separados**, porque o Figma só tem o escopo `GAP` para os dois (não existe escopo de padding). O grupo é a única barreira contra aplicar um no outro.
6. **Dado real, não rótulo.** Classifique pelo valor medido no nó, não pelo nome da variável.

## Estrutura de coleções

| Coleção | Grupos | Escopos | Modos |
|---|---|---|---|
| `Primitives` | `space/<px>` | `[]` (escondido do picker) | `Default` |
| `Spacing` | `gap/*` · `padding/*` · `layout/*` | `['GAP']` | `Default` (ver "Modos") |

Se o arquivo é pequeno e não terá tema nem densidade, uma única coleção `Spacing` com valores diretos é aceitável (é o caso do Atlassian, só com a escala). Pergunte; o padrão é duas camadas.

Outras famílias numéricas (raio, largura/altura, traço, opacidade) **não pertencem** a `Spacing`: cada uma tem seu escopo (`CORNER_RADIUS`, `WIDTH_HEIGHT`, `STROKE_FLOAT`, `OPACITY`). A skill só aponta onde estão misturadas; mover é outra tarefa.

## Primitivos (`Primitives` → `space/<px>`)

`2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 80 · 96 · 128`

Cada um com `scopes = []`, `codeSyntax.WEB = var(--space-<px>)` e valor inteiro.
Zero não é variável: gap 0 e padding 0 ficam soltos.

## Semânticos (`Spacing`) — lista fechada

| Nome | px | Primitivo | Papel típico |
|---|---|---|---|
| `gap/3xs` · `padding/3xs` | 2 | `space/2` | hairline, ajuste óptico entre ícone e texto |
| `gap/2xs` · `padding/2xs` | 4 | `space/4` | ícone ↔ texto, chip, itens colados |
| `gap/xs` · `padding/xs` | 8 | `space/8` | itens de lista compacta, rótulo ↔ campo |
| `gap/sm` · `padding/sm` | 12 | `space/12` | itens de formulário, botão |
| `gap/md` · `padding/md` | 16 | `space/16` | **padrão** entre elementos de um bloco; padding de card |
| `gap/lg` · `padding/lg` | 24 | `space/24` | entre blocos e cards |
| `gap/xl` · `padding/xl` | 32 | `space/32` | entre grupos |
| `gap/2xl` · `padding/2xl` | 48 | `space/48` | entre seções internas |
| `layout/sm` | 64 | `space/64` | respiro de seção |
| `layout/md` | 80 | `space/80` | seção de página |
| `layout/lg` | 96 | `space/96` | hero, seção larga |
| `layout/xl` | 128 | `space/128` | limite superior da escala |

- `layout/*` serve a gap e a padding de contêineres de página; os demais grupos servem só à sua propriedade.
- `padding/*` vale para as quatro bordas, cada uma ligada separadamente (o Figma liga um lado por vez). Token por lado (`padding-inline`, `padding-block`) só se justifica por padrão repetido; fica fora da v1.
- Nada de `none`, `0` ou `auto`. Nada de `small`, `smaller`, `new`, `tmp`.
- Tamanho de componente (`card/padding`, `button/padding-x`) é uma terceira camada. Só proponha quando o mesmo conjunto de gap e padding se repetir 5 vezes ou mais num componente, e sempre apontando para `Spacing`.

## Como cada valor vira token (regras de encaixe)

Medido em cada nó (`itemSpacing`, `counterAxisSpacing` só com wrap, `paddingTop/Right/Bottom/Left`):

| Classe | Critério | Destino |
|---|---|---|
| zero | = 0, ou < 0,5 (ruído como 0,14 · 0,008) | fica solto |
| grade | múltiplo de 4 e na escala | token da escala |
| ruído | a até 0,5 px de um múltiplo de 2 (7,99 · 14,01 · 0,008) | token do valor arredondado; **não** conta como mudança visual |
| fora da escala | 6 · 10 · 14 · 18 · 20 · 28 · 36 · 40 · 56 · 5,05 · 9,2 | **pergunta global** (abaixo) |
| hairline | de 0,5 a menos de 2 px (1 px de divisória) | fica solto: é traço, não espaço |
| negativo | < 0 (sobreposição) | fica solto, aviso |
| enorme | > 128 | fica solto: é gutter ou cálculo, não token |
| space-between | `primaryAxisAlignItems = SPACE_BETWEEN` | ignora o `itemSpacing` (o valor não age) |

**Pergunta global para valores fora da escala** (uma só, com a tabela valor × usos):
- **Encaixar** no passo mais próximo (empate sobe). Muda o visual: laranja no preview. Padrão.
- **Manter solto** como exceção documentada (microajuste óptico). Sem token.
- **Acrescentar passo**: o usuário diz o nome; a lista é fechada para o modelo, não para ele.

## Variáveis que já existem

- **Nunca apagar.** Variável antiga, depois de reapontar os nós, vira `_deprecated/<nome original>` (mantém a chave; nada quebra). Só o usuário apaga.
- **Fora de escopo = bloqueante.** `itemSpacing` ligado a variável de raio, traço ou tamanho de fonte (`corner radius/4`, `stroke weight/1`, `font size/32`) faz o layout mudar quando alguém muda o raio. O Figma não impede isso por API, só esconde no picker.
- **Escopo amplo = alerta.** Variável `ALL_SCOPES` (ex.: `r/md`) aparece em todo picker, inclusive no de gap, e é usada como gap por engano. Reaponte para o token de espaçamento de mesmo valor e restrinja o escopo.
- **Ruído no nome** (`14_01`, `0_01`, `341_69`, `1112_51`): lixo de importação (html.to.design). Funda no token da grade; os de valor enorme ficam soltos.
- **Duplicata de valor:** duas variáveis com o mesmo número viram um só token; o resto vai para `_deprecated/`.
- **Sem uso:** vai para `_deprecated/`, não é apagada.

## Modos
Comece com um modo chamado `Default` (renomeie `Mode 1`). Só crie mais de um com necessidade real:
- **Densidade:** `Compact · Default · Comfortable` (Primer `condensed/normal/spacious`; WordPress `density`).
- **Breakpoint:** `Desktop · Tablet · Mobile`, quando o espaçamento muda por tela.
Os nomes dos tokens não mudam entre modos; só os valores dos primitivos referenciados.

## Frame de legenda (documentação)
Todo preview gera o frame **📖 Inventário de espaçamento**, no mesmo desenho do inventário de tipografia (frame branco de 1622 px, padding 80, gap 64, título Inter Bold 56, seções Inter Bold 32). Ao aprovar, ele vai para a página **`Design System`** (criada se faltar).

Seções, nesta ordem:
1. **Primitivos:** nome, `var(--space-N)`, px, barra proporcional e quais semânticos apontam para ele.
2. **Gap:** nome, css, px, demo e uso. O demo é um auto layout real com o token ligado em `itemSpacing`.
3. **Padding:** idem, com o token ligado nas quatro bordas; a área laranja é o padding.
4. **Layout:** barras e uso.
5. **Exceções:** o que ficou sem variável, por classe, com contagem.
6. **Como usar:** quatro regras curtas.
7. **Preview — mudanças** (só no preview): `valor → valor`, token e usos. Sai do frame ao aprovar.

Por que esse desenho: as páginas de espaçamento de Cloudscape e Carbon usam tabela com token, px e exemplo; Red Hat agrupa por contexto de uso e anota exceções inline; Atlassian divide por faixa de uso. O frame junta os três: tabela com demo vivo, uso por token e exceções explícitas. Detalhes em [espacamento-plataformas.md](espacamento-plataformas.md).

Regras: uma instância por arquivo (aprovar de novo substitui o frame que a skill criou, nunca um que o usuário fez); o demo usa os tokens de verdade, então muda junto com eles; texto de uso é guia, o usuário pode editar no preview.

## Código
`codeSyntax.WEB` em todos: `gap/md → var(--gap-md)`, `padding/md → var(--padding-md)`, `layout/lg → var(--layout-lg)`, `space/16 → var(--space-16)`. Exportável em DTCG como `dimension` com `{ "value": 16, "unit": "px" }`, e `rem` só na camada de código.

## Acessibilidade (conhecimento prévio; conferir no texto oficial antes de citar em auditoria)
- **WCAG 2.2, 2.5.8 Alvo mínimo (AA):** alvo de 24 × 24 px, ou espaçamento que mantenha um círculo de 24 px sem tocar outro alvo. Entre dois controles menores que 24 px (ícones, chips clicáveis), o gap precisa ser de pelo menos 24 menos o tamanho do alvo (ícone de 16 px pede 8 px ou mais). Abaixo disso, alerta.
- **1.4.12 Espaçamento de texto:** altura fixa em contêiner com padding apertado corta texto quando o usuário aumenta entrelinha. Alerta em frames com `layoutSizingVertical = FIXED` e texto dentro.
- Gap entre blocos de texto não é regra legal; é ritmo. Não cite lei para espaçamento.

## Armadilhas conhecidas
- **Padding não tem escopo próprio.** `GAP` cobre os dois. Separe por grupo e por nome.
- **Escopo não bloqueia API.** Importadores e scripts ligam qualquer variável a qualquer propriedade.
- **html.to.design** gera `item spacing/<valor>` por valor medido, inclusive fracionado, e compensa entrelinha com padding quebrado (5,05 · 0,14 · 9,2). Trate como ruído de importação, não como decisão de design.
- **`itemSpacing` com SPACE_BETWEEN** guarda um valor que não tem efeito.
- **Instâncias:** corrija no componente principal, não na instância.
- **Preview e original contam em dobro.** Exclua a página de preview das contagens.
