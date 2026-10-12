---
name: espacamento-semantico
description: Organiza as variáveis de espaçamento do arquivo (gap e padding do auto layout) em Primitives → Spacing, com nomes semânticos como gap/md e padding/lg, e mostra o impacto numa página de preview antes de aplicar. Use com /espacamento-semantico para auditar, renomear, consolidar ou criar variáveis de espaço.
---

# Espaçamento semântico

**Use quando:** for organizar, renomear, consolidar ou criar variáveis de gap e padding, ou achar auto layouts com valor solto ou ligado à variável errada.
**Não use:** para cor, raio, traço, largura/altura ou texto.

## Estrutura
Duas coleções, cada uma com um modo chamado `Default`:
- **Primitives** — grupo `space/<px>`: `2 4 8 12 16 24 32 48 64 80 96 128`. Valor inteiro, escopo vazio (escondido do picker). Zero não vira variável.
- **Spacing** — escopo `GAP`, cada variável é alias de um primitivo.

## Nomes (lista fechada)
Não invente passo, grupo ou nome. Se um valor não couber, pergunte.

| Passo | px | Passo | px |
|---|---|---|---|
| 3xs | 2 | lg | 24 |
| 2xs | 4 | xl | 32 |
| xs | 8 | 2xl | 48 |
| sm | 12 | layout/sm · md · lg · xl | 64 · 80 · 96 · 128 |
| md | 16 | | |

- Grupos `gap/<passo>` e `padding/<passo>` usam os passos 3xs a 2xl. `layout/<passo>` serve a gap e padding de contêineres de página.
- Gap e padding ficam em grupos separados porque o Figma só tem o escopo `GAP` para os dois. O grupo é a única barreira.
- O nome diz o papel: `gap/md`, nunca `gap/16`. Só o primitivo leva o valor no nome.
- Nada de `none`, `small`, `new`, `tmp` nem decimais no nome (`14_01`).

## Como cada valor vira token
Meça o valor no nó (gap, gap de wrap, os quatro paddings); não confie no nome da variável.

| Valor medido | Destino |
|---|---|
| 0, ou menos de 0,5 | fica solto |
| de 0,5 a menos de 2 (divisória de 1 px) | fica solto |
| negativo | fica solto, avise |
| maior que 128 | fica solto (gutter ou cálculo) |
| a até 0,5 px de um passo (7,99 · 14,01) | liga ao passo; não é mudança visual |
| fora da escala (6 · 10 · 18 · 20 · 56 · 5,05) | pergunta global |

Auto layout com **space-between** ignora o gap: não ligue.

**Pergunta global (uma só, com a tabela valor × usos):** encaixar no passo mais próximo (empate sobe; muda o visual, é o padrão), manter solto como exceção, ou acrescentar um passo que o usuário nomeia.

## Variáveis que já existem
- **Nunca apague.** Reaponte os nós e renomeie a antiga para `_deprecated/<nome>`.
- **Bloqueante:** gap ligado a variável de raio, traço ou tamanho de fonte (`corner radius/4`, `stroke weight/1`). Mudar o raio mexeria no layout.
- **Alerta:** variável com escopo `ALL_SCOPES` usada como gap (ex.: `r/md`); ruído de importação (`14_01`, `0_01`, `341_69`); duas variáveis com o mesmo valor; variável sem uso.
- **Boa prática:** `codeSyntax` Web em todas (`gap/md → var(--gap-md)`), modo `Mode 1` renomeado para `Default`, coleção que mistura espaço com raio, traço e cor.

## Fluxo
1. **Contexto.** Confirme o arquivo e a página. Pergunte no máximo 3 coisas, todas globais: uma ou duas camadas, modos, e se há biblioteca publicada.
2. **Inventário (só leitura).** Liste coleções, grupos e variáveis numéricas com valor, escopo e quantos nós usam. Liste os nós de auto layout: ligados, soltos, zero. Ignore a página de preview e as instâncias.
3. **Proposta.** Mostre, nesta ordem: a estrutura e a tabela de tokens; os valores fora da escala com usos e destino; o que vira `_deprecated/`; os achados por nível (bloqueante, alerta, boa prática); a meta variáveis antes → depois.
4. **Preview.** Crie as coleções se faltarem. Duplique o escopo numa página **🔍 Preview espaçamento**, em duas colunas: ANTES (intocado) e DEPOIS (variáveis ligadas). Marque com contorno laranja o que muda visualmente. Mostre a contagem. Não toque no original. Na mesma página, ao lado, monte o frame **📖 Inventário de espaçamento** (veja "Frame de legenda").
5. **Aprovado:** ligue no original e **mova o frame de legenda para a página `Design System`** (crie a página se faltar; tire a seção "Preview — mudanças"). Em instâncias, corrija o componente principal. Depois renomeie para `_deprecated/` só as variáveis antigas **sem nenhum uso** (nos nós, em aliases e em estilos). **Recusado:** apague a página de preview e as coleções que você criou, se nada as usa.
6. **Verificação.** Repita o inventário: nós soltos, variáveis fora de escopo (deve ser 0), variáveis sem uso.

## Frame de legenda
Frame vertical branco de 1622 px, padding 80, gap 64. Título "Espaçamento — <projeto>" em Inter Bold 56; subtítulo cinza em Inter Regular 20; seções com título em Inter Bold 32 e descrição cinza em 18. Seções, nesta ordem:
1. **Primitivos:** `space/<px>`, px, uma barra preta proporcional e os semânticos que apontam para ele.
2. **Gap:** uma linha por token com nome, `var(--gap-md)`, px, demo e uso. O demo é um auto layout com dois quadrados cinza e o gap **ligado ao token**.
3. **Padding:** idem, com um bloco escuro dentro de um contêiner laranja claro e o padding ligado ao token nas quatro bordas.
4. **Layout:** barras e uso.
5. **Exceções:** o que ficou solto (1 px, acima de 128 px, negativo), com contagem.
6. **Como usar:** quatro regras curtas.
7. **Preview — mudanças** (só no preview): `10 px → 12 px`, token e quantidade de propriedades.

## Relatório final
```
Variáveis de espaço: <n> → <n> · fora de escopo: <n> → 0 · nós soltos: <n> → <n>
Mudanças visuais: <n> · Arquivadas em _deprecated/: <n> · Mantidas em uso: <n>
Pendências: Bloqueante / Alerta / Boa prática
```

## Nunca
- Alterar o original sem aprovação. Na dúvida, faça o preview.
- Apagar o que você não criou.
- Inventar nome fora da lista ou nomear pelo pixel no semântico.
- Usar `ALL_SCOPES` em variável de espaço.
- Mexer em raio, traço, largura, altura ou fonte: só aponte onde estão misturados.

## Acessibilidade
Alerta quando dois controles menores que 24 px (ícones, chips clicáveis) ficam com gap menor que 24 menos o tamanho do alvo (ícone de 16 px pede 8 px ou mais): o alvo mínimo da WCAG 2.2 (2.5.8, AA) é 24 × 24 px, ou espaçamento que evite sobreposição de um círculo de 24 px. Frame de altura fixa com padding apertado e texto dentro corta o conteúdo quando o usuário aumenta a entrelinha (1.4.12). Espaçamento não tem regra legal própria; não cite lei.
