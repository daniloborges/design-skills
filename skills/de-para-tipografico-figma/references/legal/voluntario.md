# Grupo VOL — voluntário / boa prática

Não são obrigatórios por força própria. Viram exigência quando entram em contrato, edital de licitação, perícia ou política interna, ou quando servem para demonstrar o cumprimento da LBI (ver [lei.md](lei.md)).

## Normas

| Norma | Tipo | Observação |
|---|---|---|
| **WCAG 2.1 / 2.2** (W3C) | Recomendação internacional | Nível AA é a referência de fato para a LBI. Nível AAA é boa prática |
| **ABNT NBR 17225:2025** | Norma técnica brasileira (publicada em 11/03/2025) | 96 requisitos obrigatórios (equivalentes a WCAG A/AA) e 50 recomendações (AAA). A versão de WCAG usada não foi confirmada: fontes secundárias falam em 2.2. Não fixa tamanho mínimo de fonte (não verificado no PDF). Nenhuma lei conhecida a referencia |
| **eMAG 3.1** | Modelo do governo | Voluntário fora do SISP. Baseado em WCAG 2.0 |
| **gov.br Design System** | Guia | Base de 14 px na escala CSS, fonte Rawline, entrelinhas 1,15 / 1,45 / 1,85. Mínimos não confirmados |
| **Técnicas WCAG C12 / C13 / C14** | Técnicas suficientes | Tamanho em porcentagem, em palavra-chave nomeada (`xx-small`…`xx-large`, `larger`/`smaller`) e em `em`, para o texto escalar com o usuário |

## Checklist (texto e tipografia)

| ID | Requisito | Nível | Verificar no Figma | Verificar no código |
|---|---|---|---|---|
| VOL-01 | Tamanho relativo: `font-size` em rem, em, % ou palavra-chave, sem px fixo | Técnicas C12/C13/C14 → WCAG 1.4.4 | 🔍 Não verificável; deixar nota de handoff no estilo | Lint: nenhum `font-size: …px` |
| VOL-02 | Entrelinha do texto corrido ≥ 1,5×; parágrafo ≥ 2× | WCAG 1.4.8 (AAA), NBR 17225 (recomendação) | `line-height` de `body/*` e `lead/*` | Tokens de line-height |
| VOL-03 | Linha de texto corrido ≤ 80 caracteres | WCAG 1.4.8 (AAA) | Largura do container ÷ largura média do caractere | `max-width` em `ch` |
| VOL-04 | Sem texto justificado | WCAG 1.4.8 (AAA) | `textAlignHorizontal = JUSTIFIED` | `text-align: justify` |
| VOL-05 | Contraste aprimorado ≥ 7:1 (texto grande ≥ 4,5:1) | WCAG 1.4.6 (AAA) | Mesmo cálculo do LEI-01 | idem |
| VOL-06 | Nada de imagem de texto (títulos rasterizados) | WCAG 1.4.5 (AA) | Título em PNG/vetor em vez de texto | `<img>` com texto |
| VOL-07 | Pisos de tamanho da taxonomia (≥ 11 px absoluto; corpo ≥ 14 px) | Convergência Apple, Windows, M3 | Por estilo | Por token |
| VOL-08 | Texto em peso ≥ 600 com pelo menos 14 px | Windows/Fluent | Por estilo | Por token |
| VOL-09 | Pesos Thin, Ultralight e Light não usados abaixo de 24 px | Apple HIG | Por estilo | Por token |
| VOL-10 | Nomes semânticos coerentes entre Figma e código | Coerência do DS | Estilos no padrão `papel/tamanho` | Tokens `type-papel-tamanho` |

## Fontes

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [Técnica C13](https://www.w3.org/TR/WCAG20-TECHS/C13) · [C12](https://www.w3.org/TR/WCAG20-TECHS/C12) · [C14](https://www.w3.org/TR/WCAG20-TECHS/C14)
- [NBR 17225 – resumo (CTA IFRS)](https://cta.ifrs.edu.br/abnt-nbr-17225-2025-acessibilidade-em-conteudo-e-aplicacoes-web-requisitos/) · [Hand Talk](https://www.handtalk.me/br/blog/nbr-17225-acessibilidade-site/)
- [gov.br DS – tipografia](https://www.gov.br/ds/fundamentos-visuais/tipografia)
