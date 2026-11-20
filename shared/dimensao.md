# Dimensão semântica — tamanhos de mídia e de contêiner (fonte única)

Variáveis de **largura e altura**: thumbs, avatares, ícones e a largura máxima de contêineres. A skill `dimensao-semantica-figma` lê este arquivo. Modos Desktop × Mobile seguem `modos.md`.

## Princípios

1. **O nome diz o papel e o degrau, nunca o pixel.** `size/thumb/lg/width`, nunca `size/192` nem `r/xl`.
2. **Uma família por variável.** Largura e altura só se ligam a variáveis de dimensão. Uma largura ligada a uma variável de raio (`r/xl`), de espaço ou de fonte muda quando alguém ajusta o raio: é **bloqueante**, o mesmo erro que a skill de espaçamento aponta em gap.
3. **Proporção declarada.** Toda mídia tem uma proporção (`4:3`, `1:1`, `16:9`), e largura e altura do mesmo degrau a respeitam.
4. **Grade de 8 px** para mídia e contêiner; ícones seguem a grade de 4.

## Lista fechada

| Papel | Degraus (largura × altura) | Proporção | Uso |
|---|---|---|---|
| `icon` | `sm` 16 · `md` 20 · `lg` 24 · `xl` 32 | 1:1 | ícone de interface |
| `avatar` | `sm` 24 · `md` 32 · `lg` 40 · `xl` 64 | 1:1 | foto de pessoa, logo de conta |
| `thumb` | `sm` 64 × 48 · `md` 128 × 96 · `lg` 192 × 144 | 4:3 | imagem ao lado de texto numa lista ou card |
| `container` | `sm` 640 · `md` 960 · `lg` 1280 (só `max-width`) | — | largura máxima de uma coluna de leitura ou de página |

Propriedades: `width`, `height`, `min-width`, `max-width`. Escopo `WIDTH_HEIGHT`. `codeSyntax.WEB` = `var(--size-<papel>-<degrau>-<prop>)`.
Um degrau fora da tabela é pergunta, não nome novo, como na taxonomia de texto.

## Harmonia: a mídia acompanha as linhas do texto ao lado

A altura de uma mídia ao lado de um título fica perto de **N linhas desse título** (N = 2 ou 3): `altura ≈ N × entrelinha`, arredondada para a grade. Um thumb de 144 px ao lado de um título de 3 linhas com entrelinha 50,4 (151 px) lê como um bloco; um de 64 px fica perdido. Escolha o degrau cuja altura mais se aproxima de N linhas, nos dois modos: no mobile, a entrelinha muda, e o degrau também.

## Mobile: empilhar em vez de encolher

Uma linha "mídia + texto" que no desktop fica lado a lado costuma ficar melhor empilhada no mobile: a mídia ocupa a largura toda e o texto desce. Variável não muda a direção do auto layout, mas o mesmo efeito sai só com variáveis, sem variante nova, como `flex-wrap` no CSS:

1. A linha passa a quebrar (`layoutWrap = WRAP`), com o espaço entre linhas ligado a um `gap/*`.
2. A mídia preenche (`layoutSizingHorizontal = FILL`) com a proporção travada (`lockAspectRatio`).
3. `min-width` da mídia ligado a `size/<papel>/<degrau>/width` e `max-width` a `size/<papel>/<degrau>/max-width`.
4. O texto ganha uma largura mínima (280 px é um bom ponto de partida).

| Variável | Desktop | Mobile | Efeito |
|---|---|---|---|
| `…/width` (mínima) | igual à máxima | um degrau abaixo | no mobile, mínima da mídia + mínima do texto não cabem na linha, e o texto quebra |
| `…/max-width` | a largura do degrau | sem teto prático (1200) | no desktop trava o degrau; no mobile a mídia cresce até a largura da linha |

A altura deixa de ser variável nesse caso: a proporção travada a deriva da largura. A variável `…/height` do degrau continua valendo para quem não empilha.

## Regras de encaixe

| Classe | Critério | Destino |
|---|---|---|
| ligado a outra família | largura/altura ligada a variável de raio, espaço, fonte ou `ALL_SCOPES` | **bloqueante**: religar a `size/*` do mesmo valor |
| no degrau | valor e proporção batem com um degrau do papel | ligar |
| fora do degrau | mídia com valor que não existe na tabela | pergunta global: encaixar no degrau mais próximo (muda o visual), manter solto, ou acrescentar degrau |
| contêiner | frame de conteúdo com largura fixa > 480 px | sugerir `max-width` com `container/*` |
| decorativo | ilustração, forma, ícone vetorial desenhado | fica solto |
