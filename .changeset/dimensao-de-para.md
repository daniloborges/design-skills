---
"design-skills": minor
---

Duas skills novas e dois complementos.

- **`dimensao-semantica-figma`**: tokens `size/<papel>/<degrau>` para thumbs, avatares, ícones e contêineres, com a regra de harmonia (a mídia acompanha N linhas do título ao lado), a receita de empilhar mídia + texto no mobile só com variáveis, e a detecção de largura ou altura ligada a variável de outra família. Fonte de verdade em `shared/dimensao.md`.
- **`de-para-tipografico-figma`**: leva a tipografia de uma exploração para outro arquivo como um conjunto `<marca>:<componente>-<parte>`, escolhendo a instância pelo peso real medido no destino, com o de-para na descrição de cada estilo e um frame de documentação. A taxonomia ganha a seção "Camada de componente".
- **`tipografia-semantica-codigo`**: `gerar-tokens.mjs --modos` gera `font-size` em `clamp()` a partir dos valores Desktop e Mobile, e os estilos da camada de componente saem como `--<marca>-<componente>-<parte>-*`.
- **`tipografia-semantica-figma`**: o inventário aceita `compact: true`, uma linha por estilo e por grupo, para arquivos cujo JSON completo passa do limite da ferramenta.
