---
name: espacamento-semantico-figma
description: Audita as variáveis de espaçamento de um arquivo Figma (gap e padding do auto layout), organiza em duas camadas (Primitives → Spacing com gap/md, padding/lg, layout/xl) e liga os nós às variáveis depois de aprovado. Use para organizar, renomear, consolidar ou criar variáveis de espaçamento, achar auto layouts com valor solto ou ligado à variável errada, montar a escala de espaço do projeto, ou equilibrar o espaçamento entre desktop e mobile com um modo de breakpoint. Não use para cor, raio, tipografia (existe tipografia-semantica-figma) nem para código.
---

# Espaçamento semântico — frente Figma

Transforma `item spacing/14_01`, `r/md` usado como gap e paddings soltos em variáveis com papel (`gap/md`, `padding/sm`, `layout/lg`) ligadas ao auto layout.

**This is a target-state skill.** Existe uma forma correta para as variáveis de espaço e suas ligações, e o trabalho é fazer o arquivo chegar nela. Rodar de novo repara o que saiu da forma; o inventário, o plano e os dry-runs leem sem escrever.

**Fonte de verdade:** [references/espacamento.md](references/espacamento.md). Leia antes de propor qualquer nome ou valor: escala, lista fechada, regras de encaixe, armadilhas. Pesquisa e fontes em [espacamento-plataformas.md](references/espacamento-plataformas.md).

## Ferramentas
- **figma-console MCP:** `figma_execute` roda os scripts; `figma_take_screenshot` confere.
- **Figma MCP oficial:** `use_figma`. Carregue antes a skill `figma-use`.

`scripts/` é JavaScript da Plugin API e vale nos dois. Passe o arquivo como código, editando só o bloco de configuração do topo.

## Fluxo

### 1. Contexto
Confirme o arquivo e a página ativos. Se houver mais de um arquivo aberto, diga qual vai usar. Pergunte só o que não se infere (no máximo 3, todas globais):
- **Camadas:** duas (`Primitives` + `Spacing`, padrão) ou uma só `Spacing`.
- **Modos:** só `Default` (padrão) ou densidade / breakpoint. Com frames mobile no arquivo, ou pedido de equilibrar desktop e mobile, o breakpoint é o passo 8.
- **Biblioteca publicada?** Se outros arquivos consomem as variáveis, não renomeie as antigas, só reaponte e arquive.

### 2. Inventário (somente leitura)
Rode `scripts/inventario.js`. Ele devolve:
- **Coleções e grupos:** mistura de tipos (cor, fonte, raio e espaço na mesma coleção é achado).
- **Variáveis candidatas:** valor, escopo, usos por propriedade e sinalizadores (`ruido`, `fora-da-grade`, `meia-grade`, `escopo-amplo`, `sem-uso`, `nome-com-decimal`, `valor-duplicado`).
- **`foraDeEscopo`:** gap ligado a variável de raio, traço ou fonte. É bloqueante.
- **Nós:** por propriedade, quantos estão ligados, soltos ou zero, e a distribuição dos valores soltos por classe.

A página de preview da própria skill fica de fora das contagens.

### 3. Plano (somente leitura)
Rode `scripts/aplicar.js` com `MODE = 'plano'`. Devolve quantos nós vão para cada token, quantos mudam o visual (`visuais`), os soltos por motivo (`enorme`, `negativo`, `hairline`) e a tabela de **valores fora da escala** com o destino sugerido.

### 4. Proposta
Mostre, nesta ordem:
1. **Estrutura:** coleções, modos, escopos e a tabela de tokens da lista fechada (`shared/espacamento.md`).
2. **Valores fora da escala:** `valor × usos → destino`, e a **pergunta global** com as três saídas (encaixar, manter solto, acrescentar passo). Ponha no PLAN em `DECISOES.valores` o que o usuário decidir por valor.
3. **Variáveis antigas:** o que vira `_deprecated/`, o que fica (em uso, ou alias de outra).
4. **Achados** por nível: bloqueante (variável fora de escopo), alerta (valor solto, escopo amplo, ruído, duplicata, sem uso), boa prática (sem `codeSyntax`, modo `Mode 1`, coleção misturada).
5. **Meta:** variáveis de espaço antes → depois; nós ligados antes → depois.

### 5. Preview (ANTES × DEPOIS)
Com `MODE = 'preview'` o script cria as coleções se faltarem (isso é a única escrita fora da página de preview), clona o escopo numa página **🔍 Preview espaçamento** e liga as variáveis só no DEPOIS. **Laranja** marca o que muda visualmente; o resto é só troca de variável. A mesma página ganha o frame **📖 Inventário de espaçamento** (a legenda, no mesmo desenho do inventário de tipografia: primitivos, gap, padding, layout, exceções, como usar), com uma seção extra "Preview — mudanças" (valor → token, usos). Escopo: `PREVIEW.roots = 'page'` em página pequena, ou uma amostra de ids de frames. Tire um screenshot do frame e da página e mostre com a contagem (`marked`, `visuais`). O original não é tocado. Edições manuais no frame de legenda valem: ele é o que vai para o Design System.

### 6. Aplicar, arquivar ou descartar
- **Aprovado:** `MODE = 'aplicar'`, primeiro com `DRY_RUN = true`. Além de ligar os nós, ele **leva o frame de legenda para a página `Design System`** (cria a página se faltar, tira a seção "Preview — mudanças" e preserva as edições feitas no preview; sem preview, cria o frame). Instâncias são puladas (`SKIP_INSTANCES`): corrija no componente principal. Depois `MODE = 'arquivar'` (também com `DRY_RUN` primeiro): renomeia para `_deprecated/<nome>` as variáveis antigas sem nenhum uso.
- **Recusado:** `MODE = 'descartar'` remove a página e as coleções criadas pela skill, se nada as usa.

### 7. Verificação
Rode o inventário de novo e compare: nós soltos, variáveis fora de escopo (deve ser 0), variáveis sem uso, tokens por papel. Confira um frame com screenshot.

### 8. Modo de breakpoint (Desktop × Mobile)
Acrescenta o modo `Mobile` a `Spacing`, com cada semântico apontando para outro primitivo. Pré-requisito: `Primitives` e `Spacing` existem (passos 2–6). Leia antes [references/modos.md](references/modos.md) (uma chave de modo só, desktop exato, verificação) e "Modo de breakpoint" em [references/espacamento.md](references/espacamento.md) (a tabela mobile).

A configuração vai em `ARGS`: no `figma_execute`, ponha `const ARGS = { dryRun: true };` antes do texto do script; no `figma-run`, `--args arquivo.json`. Aqui `collection` é a coleção semântica de espaço (padrão `Spacing`); as outras chaves estão no cabeçalho do script.

1. **Rode `scripts/modo-breakpoint.js` com `{ dryRun: true }`** na página que tem os frames mobile. O script acha sozinho os frames mobile (até 480 px de largura, ou com um modo `Mobile` explícito); passe `frames: [ids]` só quando a detecção errar. Leia a saída nesta ordem:
   - `bloqueios` não vazio → pare: falta primitivo para algum token, ou o primeiro modo de `Spacing` tem um nome que não é `Desktop`, `Default` nem `Mode 1`. Esses dois últimos o script renomeia para `Desktop`, e o plano mostra a renomeação.
   - `outras` não vazio → outra coleção já alterna Desktop/Mobile (a da tipografia, por exemplo). Diga ao usuário que cada frame mobile vai precisar de `Mobile` nas duas.
   - `frames` → quantos gap/padding estão ligados × soltos. Só os ligados respondem; se a maioria está solta, diga isso antes de prometer o resultado e ofereça os passos 3–6 para ligá-los.
   - `plano` → token → primitivo no Mobile. Quando `Spacing` já tem `Mobile`, cada linha mostra também o valor de hoje, se for outro; rodar de novo reaponta para o valor do plano. Ajuste por `mobile` se o arquivo pedir outro valor.
2. **Mostre o plano** e espere a aprovação. É uma mudança visual no mobile.
3. **Rode com `dryRun: false`** e `setMode` nos frames mobile que ainda não têm modo explícito em `Spacing`.
4. **Confira:** leia `paddingTop`/`itemSpacing` de um nó ligado dentro do frame mobile e do desktop (valores diferentes, desktop igual ao de antes) e tire um screenshot do frame mobile.

## Relatório final
```
## Espaçamento — <arquivo> / <escopo>
Variáveis de espaço: <n> → <n> · fora de escopo: <n> → 0 · nós com gap/padding solto: <n> → <n>
Mudanças visuais: <n> nós (laranja no preview)
Estrutura: Primitives (<n>) → Spacing: gap <n> · padding <n> · layout <n>
Legenda: frame "📖 Inventário de espaçamento" na página Design System
Arquivadas em _deprecated/: <n> · mantidas em uso: <n>
Pendências: Bloqueante / Alerta / Boa prática
```

## Nunca
- Ligar ou alterar nós do original sem aprovação. Na dúvida, faça o preview.
- Apagar variável que você não criou (renomeie para `_deprecated/`).
- Nomear pelo pixel no semântico (`gap/16`) ou inventar nome fora da lista.
- Ligar zero, negativo, 1 px de divisória ou valor acima de 128 px.
- Confiar no nome da variável em vez do valor medido no nó.
- Mexer em raio, traço, largura/altura ou fonte: só aponte onde estão misturados.
- Usar `ALL_SCOPES` em variável de espaço (use `GAP`; primitivos com `[]`).

## References
- [espacamento.md](references/espacamento.md): escala, lista fechada, regras de encaixe, variáveis existentes, modos, frame de legenda, acessibilidade, armadilhas. **Obrigatório.**
- [modos.md](references/modos.md): modos Desktop × Mobile, comuns a espaçamento e tipografia. Leia no passo 8.
- [espacamento-plataformas.md](references/espacamento-plataformas.md): Atlassian, Polaris, Primer, Dialtone, como Cloudscape, Carbon, Red Hat e Spectrum documentam espaçamento, escopos do Figma, DTCG, fontes e o que não foi verificado.
