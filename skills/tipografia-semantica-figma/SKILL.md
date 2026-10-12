---
name: tipografia-semantica-figma
description: Audita estilos de texto de um arquivo Figma, propõe nomes semânticos (papel/tamanho, ex. heading/xl, body/md, big-number/lg), mostra o impacto num preview ANTES × DEPOIS numa página separada e aplica depois de aprovado, com checagens de acessibilidade. Use para revisar, renomear, consolidar ou criar estilos de texto, achar textos sem estilo, ou quando pedirem auditoria de tipografia, type scale ou compliance de texto (WCAG, LBI, CDC) no Figma. Não use para código — para isso existe tipografia-semantica-codigo.
---

# Tipografia semântica — frente Figma

Transforma estilos de texto nomeados por aparência (`Fraunces/Light wght 380`, `Text 14`) em nomes semânticos coerentes com HTML e com o código, e sinaliza os problemas de acessibilidade pelo caminho.

**Fonte de verdade:** [references/taxonomia.md](references/taxonomia.md). Leia antes de propor qualquer nome, em especial a lista fechada, o peso real, as duplicatas suspeitas e a heurística. A skill `tipografia-semantica-codigo` usa a mesma taxonomia.

## Ferramentas

- **figma-console MCP** (Desktop Bridge): `figma_execute` para rodar os scripts; `figma_take_screenshot` para conferir.
- **Figma MCP oficial**: `use_figma`. Carregue antes a skill `figma-use`.

Os scripts em `scripts/` são JavaScript da Plugin API e funcionam nos dois. Passe o conteúdo do arquivo como código, editando só o bloco de configuração no topo.

## Fluxo

### 1. Contexto
Confirme o arquivo e a página ativos. Se houver mais de um arquivo aberto, diga qual vai usar. Pergunte só o que não dá para inferir:
- **Prefixo de marca:** manter ou tirar (padrão: sem prefixo).
- **Escala:** produto/UI (faixas padrão) ou expressiva/editorial. No caso editorial, a escala do projeto vira `tipografia.faixas.json`; os pisos não mudam.
- **Biblioteca publicada?** Se os estilos são consumidos por outros arquivos, use `reuse` nos alvos: renomear mantém a chave e não quebra os consumidores.
- **Auditoria legal:** só se pedirem (passo 7).

### 2. Inventário (somente leitura)
Rode `scripts/inventario.js`. Ele devolve:
- **Estilos:** spec e usos, duplicados (`duplicateSpecs`, comparados pelo **peso real**) e nomes ambíguos.
- **Grupos de spec:** a chave é `família|peso real[i]|tamanho|entrelinha|tracking|caixa`. Cada grupo traz `fontName` completo (com `variationSettings`), amostras e ids.
- **`variableFontWarning`:** nomes de instância que não batem com o eixo `wght`. Se aparecer, resolva com **uma pergunta global** antes do mapa (ver "Duplicatas suspeitas" na taxonomia).
- **`previewSuggestion`:** página inteira (até 400 textos) ou uma amostra mínima de frames que cobre todos os grupos.
- **`components`:** componentes com texto, que podem entrar no preview.
- **Checagens:** menores que 11 e que 12 px, fracionados, justificado, altura fixa, contraste aproximado.

### 3. Escala + mapa (proposta)
Mostre, nesta ordem:
1. **Escala do projeto:** uma tabela "degrau → tamanho", um tamanho por degrau, tirada dos tamanhos reais.
2. **Mapa:** uma linha por estilo de destino, não por grupo de origem.

   | Nome | Spec final | HTML | Origens (estilos + grupos) | Usos | Muda visual? |
   |---|---|---|---|---|---|

3. **Estilos antes → depois**, com a meta de consolidação da taxonomia.
4. **Achados** por nível (bloqueante, alerta, boa prática) e as **perguntas**: no máximo 3, globais.

Regras:
- **Lista fechada**, com no máximo um modificador.
- **Corrija subindo** até o piso, nunca descendo.
- **Um único estilo com `h1` padrão.**
- **Link herda o estilo do contexto.**
- **Chip ou tag é `label/sm`.**

### 4. Escolher o escopo do preview
Proponha o escopo a partir de `previewSuggestion` e deixe o usuário ajustar:
- **Página inteira**, quando é pequena.
- **Amostra de frames** que cobre todos os grupos, quando é grande.
- **Seleção atual.**
- **Componentes** (`PREVIEW.components`), quando o texto vive neles.

### 5. Preview (ANTES × DEPOIS)
Traduza o mapa para `PLAN.targets` em `scripts/aplicar.js`:
- `name`
- `spec`, com o `fontName` do grupo, incluindo `variationSettings`
- `from.styles` e `from.specs`
- `description`: `HTML: … · faixa …`
- `reuse`, quando for o caso

Rode com `MODE = 'preview'`. O script:
- cria estilos `novo/<nome>`;
- clona o escopo numa página **🔍 Preview tipografia**, com as colunas ANTES (intocado) e DEPOIS (estilos novos, inclusive em instâncias);
- monta o **📖 Inventário de tipografia** ao lado: primeiro as **fontes** (família, pesos, itálico, quantos estilos), depois os **estilos por papel**, cada grupo com uma frase de uso e cada estilo com especime, spec, HTML e número de usos. Serve de referência para quem chega ao arquivo;
- desenha a camada **⚑ Mudanças**: azul quando só o estilo foi reapontado, laranja quando tamanho ou entrelinha mudam.

**O original não é tocado.** Tire um screenshot da página e mostre ao usuário junto com a contagem (`marked`).

Se ele quiser ajustar, edite o PLAN e rode `preview` de novo (a página é recriada).

### 6. Promover ou descartar
- **Aprovado:** volte para a página original e rode `MODE = 'promover'`, primeiro com `DRY_RUN = true`. O script:
  - renomeia `novo/<nome>` para `<nome>`, ou atualiza o estilo `reuse`;
  - aplica no original (instâncias: `SKIP_INSTANCES = true`, corrigindo o componente principal; use `SCOPE = 'all-pages'` se ele estiver em outra página);
  - marca as origens como `_deprecated/`;
  - recria a página **📖 Tipografia** com o inventário final (fontes → estilos por papel, com legenda);
  - **ordena a lista de estilos** pela taxonomia (papel → tamanho → base/-emphasis/-strong; `_deprecated/` no fim);
  - remove o preview.
- **Só ordenar** (a lista ficou fora de ordem ou foi editada à mão): `MODE = 'ordenar'`, primeiro com `DRY_RUN = true` para mostrar a ordem proposta.
- **Recusado:** `MODE = 'descartar'` remove a página e os estilos `novo/*`.
- **Sem preview** (arquivo pequeno, pedido explícito): `MODE = 'aplicar'`, com `DRY_RUN` primeiro.

Depois, rode o inventário de novo e compare antes × depois: textos sem estilo, nomes ambíguos, duplicados e textos menores que 11 px.

### 7. Auditoria legal (opcional, só quando pedida)
Siga [references/legal/README.md](references/legal/README.md):
- escolha os grupos (`lei`, `voluntario`, `setorial`);
- devolva um checklist ✅ / ❌ / ⚠️ / 🔍;
- encaminhe os itens 🔍 para a skill de código.

## Execução sem MCP (opcional, só figma-console)

Se o arquivo usa o plugin **Desktop Bridge do figma-console** e a sessão roda **no mesmo computador do Figma**
(ex. Claude Code local), prefira o runner `figma-run` (pasta `tools/figma-run` do repositório `design`) em vez de colar
scripts em `figma_execute`: menos tokens, sem limite de 30 s, e o PLAN fica num arquivo (`--args plano.json`).

```bash
node figma-run.mjs scripts/inventario.js --set scope=page --out inventario.json
node figma-run.mjs scripts/aplicar.js --args plano.json --set mode=preview
node figma-run.mjs scripts/inventario-tipografia.js --set page="📖 Tipografia" --set title="Tipografia — Projeto"
```

Em sessão na nuvem ou sem figma-console, use as ferramentas do MCP normalmente. Todos os scripts aceitam `ARGS`
opcional e rodam iguais nos dois caminhos.

Para recriar só o inventário (página de referência) a qualquer momento: `scripts/inventario-tipografia.js`
(página, nome do frame e título por ARGS).

## Relatório final

```
## Tipografia — <arquivo> / <escopo>
Estilos: <n> → <n> · sem estilo: <n> → <n> · nomes ambíguos: <n> → 0 · mudanças visuais: <n>
Escala do projeto: …
Mapa aplicado: Nome | Spec | HTML | Usos
Pendências: Bloqueante / Alerta / Boa prática
Para o código: nomes type-*, itens 🔍 → tipografia-semantica-codigo
```

## Nunca
- Aplicar no original sem aprovação. Na dúvida, faça o preview.
- Apagar estilos que você não criou (só os `novo/*` do próprio preview).
- Nomear por família, peso ou pixel, ou inventar nomes fora da lista.
- Confiar no nome da instância da fonte em vez do peso real.
- Usar `heading/*` em eyebrow, big-number, index ou link.
- Descer um tamanho para caber na escala quando isso fura um piso.

## References
- [taxonomia.md](references/taxonomia.md): nomes, faixas, HTML, pisos, heurística, duplicatas, contraste. **Obrigatório.**
- [plataformas.md](references/plataformas.md): equivalência com M3, Apple, Fluent e design systems.
- [legal/](references/legal/README.md): auditoria legal BR opcional.
