---
name: de-para-tipografico-figma
description: "Leva a tipografia de uma exploração num arquivo Figma para outro arquivo, adaptada às fontes, ao peso real e à escala do destino: um conjunto de estilos de componente (<prefixo>:<componente>-<parte>, ex. da:chat-answer) com o de-para na descrição, ligado às variáveis type/* quando a spec bate, mais o frame de documentação e, se pedirem, uma tela-demo só com tokens. Use quando pedirem um de-para de estilos entre arquivos, adaptar uma exploração à fonte de outro projeto, ou criar os estilos de um componente como chat, player ou editor."
---

# De-para tipográfico — frente Figma

Traduz os estilos de uma exploração (arquivo de origem) para a linguagem tipográfica de outro arquivo (destino), num conjunto de estilos de componente que aponta para os papéis da taxonomia.

**This is a target-state skill.** Existe uma forma correta para o conjunto no destino, e o trabalho é fazer o destino chegar nela. Rodar de novo atualiza os estilos do mesmo prefixo e recria o frame de documentação; a leitura e os dry-runs não escrevem.

**Fonte de verdade:** a seção "Camada de componente" de [references/taxonomia.md](references/taxonomia.md) — nome, formato da descrição, ligação, peso real e pisos. Leia antes de propor o mapa.

## Ferramentas
- **figma-console MCP:** `figma_execute` com o `fileKey` de cada arquivo (são dois, então passe sempre); `figma_take_screenshot` sai do arquivo **ativo**, então troque o alvo com `figma_navigate` antes de cada screenshot.
- **Figma MCP oficial:** `use_figma`. Carregue antes a skill `figma-use`.

A configuração dos scripts vai em `ARGS`: no `figma_execute`, ponha `const ARGS = { … };` antes do texto do script; no `figma-run`, `--args arquivo.json`.

## Fluxo

### 1. Contexto
Nomeie os dois arquivos (origem e destino, com `fileKey`), o componente e o prefixo (`<marca>:<componente>`, ex. `da:chat`). Pergunte pelo frame de exploração que vale, quando a origem tiver vários: o que está em teste, não o primeiro.

### 2. Ler os dois lados (somente leitura)
Rode `scripts/ler-estilos.js` na origem com `{ frame: '<id do frame de exploração>' }` e no destino sem `frame`. Tire um screenshot do frame de origem. Da origem você leva os **papéis** (quem fala, o que é metadado, o que é corpo); do destino, as **fontes**, o **peso real** de cada papel (coluna `peso real`, medida num texto) e as **cores**.

O peso real decide a instância: um estilo do destino chamado "Fraunces Black" com peso real 380 pede `Regular` no conjunto, e um negrito real de 500 pede `SemiBold` quando não há instância 500.

### 3. Mapa (proposta)
Uma linha por estilo do conjunto:

| Parte | Origem | Papel base | Spec no destino | HTML | Cor |
|---|---|---|---|---|---|

- Agrupe por função, não por tamanho: voz de cada participante, corpo, metadados, controles.
- Cada parte aponta para um papel da taxonomia (`base`) ou diz "próprio do componente". Tamanho e entrelinha iguais aos do papel fazem o estilo ligar às variáveis `type/*` desse papel.
- Respeite os pisos: nada abaixo de 11 px; campo de digitação em 16 px ou mais.
- Duas partes com a mesma spec viram uma só, ou mudam de spec: duplicata não entra.

Mostre o mapa e espere a aprovação.

### 4. Criar o conjunto
Rode `scripts/criar-conjunto.js` no destino com `{ dryRun: true, prefixo, estilos }`. Leia `bloqueios` (fonte indisponível, piso, parte fora do kebab-case) e os avisos de `plano` (cor que não é variável, papel base que não existe). Com o plano limpo, rode com `dryRun: false`.

### 5. Documentar
Rode `scripts/frame-de-para.js` com `{ prefixo, pagina, amostras }`. O frame lê as descrições, então rode de novo sempre que o conjunto mudar. Confira com screenshot.

### 6. Tela-demo (só se pedirem)
Monte a tela do componente no destino com o conjunto e os tokens do arquivo, e nada solto:
- todo texto com um estilo do conjunto; todo fill e traço ligado a uma variável de cor; todo gap e padding a `gap/*` ou `padding/*`;
- mostre cada parte do conjunto ao menos uma vez, com conteúdo real do projeto;
- **glifos:** a Plugin API só avisa a fonte inteira ausente (`hasMissingFont`). Um caractere que a fonte não tem (uma seta `↳` numa fonte mono, por exemplo) sai em branco sem erro. Confira cada símbolo fora do alfabeto no screenshot e troque o que faltar.

## Relatório final
```
## De-para — <origem> → <destino> / <prefixo>
Estilos: <n> (<n> ligados a type/*) · peso real usado: <família> <peso> → <instância>
Mapa: Parte | Origem | Base | Spec | HTML | Cor
Frame: 📖 <prefixo> — de-para na página <página>
Pendências: decisões de design em aberto, glifos trocados
```

## Nunca
- Escolher a instância pelo nome do estilo de onde veio; vale o peso real medido no destino.
- Criar um estilo de componente para um papel que a taxonomia já cobre sem diferença de spec.
- Aplicar sem dry-run e sem aprovação, ou mexer em estilos fora do prefixo.
- Tirar screenshot sem conferir qual arquivo está ativo.

## References
- [taxonomia.md](references/taxonomia.md): seção "Camada de componente", pisos, peso real. **Obrigatório.**
- [modos.md](references/modos.md): quando o destino tem modos Desktop × Mobile.
