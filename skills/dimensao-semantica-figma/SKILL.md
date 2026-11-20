---
name: dimensao-semantica-figma
description: "Organiza as variáveis de largura e altura de um arquivo Figma (thumbs, avatares, ícones, largura máxima de contêiner) em tokens size/<papel>/<degrau>, liga as mídias a eles, harmoniza o tamanho da imagem com o texto ao lado e empilha mídia + texto no mobile só com variáveis. Use para dimensionar thumbs ou imagens de um componente, criar variáveis de tamanho, achar largura ou altura ligada à variável errada (raio, espaço), ou fazer uma imagem ocupar a largura toda no mobile. Não use para gap e padding (espacamento-semantico-figma) nem para texto."
---

# Dimensão semântica — frente Figma

Transforma tamanhos soltos de mídia (`64×64`, uma largura ligada a `r/xl`) em variáveis com papel (`size/thumb/lg/width`) ligadas aos nós, com um valor por modo Desktop × Mobile.

**This is a target-state skill.** Existe uma forma correta para as dimensões do arquivo, e o trabalho é fazer o arquivo chegar nela. Rodar de novo repara o que saiu da forma; o inventário e os dry-runs leem sem escrever.

**Fonte de verdade:** [references/dimensao.md](references/dimensao.md) — lista fechada de papéis e degraus, proporções, regra de harmonia, receita de empilhar e regras de encaixe. Leia antes de propor qualquer nome ou valor. Os modos seguem [references/modos.md](references/modos.md).

## Ferramentas
- **figma-console MCP:** `figma_execute` roda os scripts; `figma_take_screenshot` confere.
- **Figma MCP oficial:** `use_figma`. Carregue antes a skill `figma-use`.

`scripts/` é JavaScript da Plugin API e vale nos dois. A configuração vai em `ARGS`: no `figma_execute`, ponha `const ARGS = { … };` antes do texto do script; no `figma-run`, `--args arquivo.json`. O cabeçalho de cada script lista as chaves.

## Fluxo

### 1. Contexto
Confirme o arquivo e a página. Com mais de um arquivo conectado, passe o `fileKey` em toda chamada. Descubra o que não se infere, em no máximo duas perguntas globais: qual componente ou tela está em foco, e se o arquivo tem frames mobile (com eles, os tokens ganham valor Mobile e a receita de empilhar entra em cena).

### 2. Inventário (somente leitura)
Rode `scripts/inventario.js` com `{ page }` (e `roots: [ids]` para olhar só um componente). Ele devolve linhas compactas:
- **variáveis** `size/*` que já existem, com coleção, escopo e valores por modo;
- **errados** — largura/altura ligadas a variável de outra família: bloqueante, entra no plano como religação;
- **mídias** — nós com imagem por tamanho e proporção, ligados ou soltos, com um id de exemplo;
- **contêiner** — frames de conteúdo com largura fixa acima de 480 px.

### 3. Proposta
Mostre, nesta ordem:
1. **Degrau por mídia**, aplicando a harmonia: some a entrelinha do título ao lado vezes 2 ou 3 linhas e escolha o degrau cuja altura mais se aproxima, nos dois modos. Diga a conta ("3 × 50,4 ≈ 151 → `thumb/lg`, 144").
2. **Mobile:** encolher (só o valor Mobile do token) ou empilhar (receita de `dimensao.md`). Empilhar é o padrão para uma linha mídia + texto quando a tela mobile tem menos de ~480 px.
3. **Religações** dos itens em `errados`, e os valores fora da tabela com a pergunta global (encaixar, manter solto, acrescentar degrau).

Espere a aprovação: degrau maior e empilhar mudam o visual.

### 4. Aplicar
Rode `scripts/aplicar.js` com `dryRun: true` e as chaves `tokens`, `ligar` e `empilhar` montadas da proposta. Leia `bloqueios` (degrau fora da lista, nó não encontrado, linha que não é auto layout horizontal) e o `plano`. Com o plano aprovado, rode de novo com `dryRun: false`. Num componente com variantes, passe cada variante: as instâncias herdam.

### 5. Verificação
- Leia `width`/`height` da mídia numa instância dentro de um frame desktop e de um mobile: no desktop o valor do degrau, no mobile o valor Mobile (ou a largura da linha, quando empilhada).
- Screenshot do componente e do frame mobile: a mídia acompanha o bloco de texto, e nada estoura a largura.
- Rode o inventário de novo: `errados` vazio.

## Relatório final
```
## Dimensão — <arquivo> / <escopo>
Tokens: <lista> · ligações erradas: <n> → 0 · mídias ligadas: <n> → <n>
Harmonia: <mídia> <altura> ≈ <N> × <entrelinha> do <estilo>
Mobile: <encolher | empilhar> em <componentes>
Pendências: Bloqueante / Alerta / Boa prática
```

## Nunca
- Ligar largura ou altura a variável que não seja `size/*` com escopo `WIDTH_HEIGHT`.
- Nomear pelo pixel (`size/192`) ou inventar papel ou degrau fora da lista.
- Aplicar sem dry-run e sem aprovação.
- Ligar ilustração, forma ou ícone vetorial desenhado: eles ficam soltos.
- Mexer em gap, padding ou texto: são das skills irmãs.

## References
- [dimensao.md](references/dimensao.md): papéis, degraus, proporções, harmonia, empilhar, encaixe. **Obrigatório.**
- [modos.md](references/modos.md): modos Desktop × Mobile, comuns a texto, espaço e dimensão.
