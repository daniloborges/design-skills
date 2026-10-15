---
name: configurar-figma-console
description: Instala, confere, repara ou ensina a usar a ligação do Claude Code com o Figma Desktop pelo figma-console MCP — registro do servidor, plugin Desktop Bridge, token opcional e o que pedir depois. Use ao configurar o figma-console numa máquina nova, quando as ferramentas figma_* não aparecem, quando figma_get_status diz que não há conexão, quando o plugin mostra "MCP scanning" ou "No MCP server found", quando o token expirou ou a pessoa quer comentários, histórico de versões ou biblioteca publicada, quando o servidor só aparece num projeto, ou quando a pessoa não sabe ligar o plugin no Figma ou o que pedir. Modos `instalar` (padrão, sem token), `ajuda`, `token` e `auditoria`.
argument-hint: "[instalar|ajuda|token|auditoria]"
allowed-tools:
  - Bash(sh *diagnosticar.sh)
  - Bash(claude mcp get figma-console)
  - Bash(lsof -nP *)
  - Bash(npm view figma-console-mcp *)
  - mcp__figma-console__figma_get_status
  - mcp__figma-console__figma_get_selection
  - mcp__figma-console__figma_search_components
  - mcp__figma-console__figma_take_screenshot
  - mcp__figma-console__figma_get_comments
---

# Configurar o figma-console MCP

Liga o Claude Code ao Figma Desktop pelo [figma-console-mcp](https://github.com/southleft/figma-console-mcp), no modo NPX: o
servidor roda localmente via `npx`, e o plugin **Desktop Bridge**, aberto no arquivo do Figma, se conecta a ele por
WebSocket. Ao final, `figma_get_status` mostra o plugin conectado e a pessoa sabe o que pedir.

**This is a target-state skill.** Existe uma forma correta da ligação, e o trabalho é fazer a máquina chegar nela. Uma
segunda execução repara o que saiu do lugar. O modo `auditoria` só diagnostica e não escreve nada.

As skills de Figma deste plugin (`tipografia-semantica-figma`, `espacamento-semantico-figma`) dependem desta ligação.

## Modos

| Modo | Quando | Passos |
|---|---|---|
| `instalar` (padrão) | máquina nova, algo quebrou | 1 → 3 → 4 → 5 → 6 → 7, sem token, pulando o que o veredito do Passo 1 já mostra pronto |
| `token` | a pessoa pede o token, ou uma ferramenta da API REST falhou | 2 → 3 com `--com-token` → 6 |
| `ajuda` | a ligação existe, mas a pessoa não sabe ligar o plugin no Figma ou o que pedir | 1, depois 5 e 6, depois [references/uso.md](references/uso.md) |
| `auditoria` | só saber o estado | 1, e o relato descrito nele |

O modo chega como argumento (`/design:configurar-figma-console ajuda`). Sem argumento, escolha pelo pedido: "como uso", "como ligo no Figma", "o que posso pedir" é `ajuda`; comentários,
histórico de versões, biblioteca publicada ou um erro 401/403 é `token`; o resto é
`instalar`.

## A forma correta

| Camada | Estado esperado |
|---|---|
| Node | 18 ou superior no `PATH` que o Claude Code usa |
| Token | **opcional, e ausente por padrão.** Quando existe: personal access token do Figma, prefixo `figd_`, aceito pela API, com os escopos **File content** (Read), **File versions** (Read), **Variables** (Read) e **Comments** (Read and write) |
| Registro | servidor `figma-console`, comando `npx -y figma-console-mcp@latest`, env `ENABLE_MCP_APPS=true`, e `FIGMA_ACCESS_TOKEN` só no modo `token` |
| Servidor | escutando numa porta entre 9223 e 9232; ele tenta a 9223 e passa para a seguinte quando ela está ocupada |
| Plugin | Desktop Bridge importado de `~/.figma-console-mcp/plugin/manifest.json` e rodando no arquivo aberto; o selo mostra `Local · ready` |

## Regras durante toda a execução

- **O token nunca aparece na saída.** Toda saída que pode conter o token passa por
  `sed -E 's/(figd_)[A-Za-z0-9_-]+/\1***/g'`. O token nunca entra num arquivo versionado: nem num `.mcp.json`
  commitado, nem em script, nem em documento.
- **Ação humana é uma parada.** Onde um passo diz **⏸ Ação da pessoa**, escreva as instruções numeradas, diga o que ela
  deve ver no final e espere a resposta antes de seguir. Nunca afirme que algo feito pela pessoa deu certo sem conferir
  pelo diagnóstico ou por `figma_get_status`.
- **Mudar o registro só vale depois de reiniciar o cliente.** As ferramentas `figma_*` da sessão atual continuam as
  mesmas até o Claude Code reiniciar. Depois de mudar o registro, peça o reinício e só então teste.

## Passo 1 — Diagnóstico feito, com veredito

Rode o script na pasta do projeto onde o Figma vai ser usado. O registro depende da pasta; se a pessoa usa o Figma em
mais de um projeto, rode uma vez em cada.

```sh
sh ${CLAUDE_SKILL_DIR}/scripts/diagnosticar.sh
```

Se a variável chegar vazia, o script fica em `scripts/diagnosticar.sh` dentro da pasta desta skill.

O script é somente-leitura, mascara o token e sai sempre com código 0. Quem decide é a última linha, o veredito. Uma
linha `também falhou:` lista os vereditos que o primeiro esconde; trate-os na ordem.

| Veredito | Vá para |
|---|---|
| `NODE` | instale o Node 18+ (ou aponte o registro para o binário certo, ver Passo 3) e rode o Passo 1 de novo |
| `SEM-REGISTRO` | leia a linha `registrado em` e depois o Passo 3 |
| `TOKEN` | há um token registrado e a API do Figma o recusou (o script testa em `api.figma.com/v1/me`). Pergunte: registrar de novo sem token (Passo 3, o padrão) ou gerar outro (Passo 2, modo `token`) |
| `CLI-INESPERADA` | leia a saída crua impressa; a CLI mudou o texto, então use `/mcp` numa sessão para decidir |
| `SERVIDOR-PARADO` | Passo 4 |
| `PRONTO-PARA-PLUGIN` | Passo 5 |

**`registrado em` diz onde mais o servidor existe.** Com `SEM-REGISTRO` aqui e `registrado em local: <outra pasta>`, o
servidor funciona naquela pasta e a correção é um registro de escopo `user` (Passo 3). Pergunte antes: nunca mude o
escopo sem a resposta da pessoa.

**A linha de portas vale para a máquina inteira.** Ela lista servidores de qualquer sessão ou cliente, então um `ok`
ali convive com `SEM-REGISTRO` nesta pasta. A porta desta sessão sai do `figma_get_status`. Vários servidores de pé
são normais: sessões antigas podem deixar o processo vivo, e o plugin se conecta a todos.

**Em `auditoria`, pare aqui** e relate: o veredito e o `também falhou`, o escopo (ou "sem registro nesta pasta"), as
linhas `registrado em`, cada `FALHA` e cada `aviso`. Se o escopo é `local` e existe trabalho em outras pastas, diga
que um registro `user` resolveria, sem fazer a mudança.

## Passo 2 — Token do Figma em mãos (só no modo `token`)

**O token é opcional, e a instalação padrão pula este passo.** O plugin Desktop Bridge trabalha no arquivo aberto com
a sessão do Figma da pessoa, sem token: ler seleção, estilos e variáveis, criar e editar, screenshot. O token liga só
a API REST do Figma, que cobre o que fica fora do arquivo aberto:

- comentários (`figma_get_comments`, `figma_post_comment`);
- histórico de versões e o que depende dele (`figma_get_file_versions`, `figma_diff_versions`, `figma_generate_changelog`,
  `figma_blame_node`);
- componentes e variáveis de uma biblioteca publicada em outro arquivo;
- ler um arquivo que não está aberto com o plugin.

Ofereça o token quando a pessoa pedir uma dessas coisas, ou quando uma ferramenta falhar com "FIGMA_ACCESS_TOKEN not
configured", 401 ou 403. Fora disso, siga sem ele.

**⏸ Ação da pessoa.** Escreva para ela, em passos numerados:

1. No Figma (desktop ou web), clique no avatar → **Settings** → aba **Security** → **Personal access tokens** →
   **Generate new token**.
2. Descrição: `Figma Console MCP`.
3. Escopos: **File content** = Read, **File versions** = Read, **Variables** = Read, **Comments** = Read and write.
4. Copie o token na hora. O Figma mostra o valor uma única vez, e ele começa com `figd_`.
5. Guarde o token num gerenciador de senhas; ele não deve ir para chat, e-mail nem arquivo do projeto.

Diga o que vem a seguir: no Passo 3, com `--com-token`, ela mesma vai colar o token no terminal dela, num script que o pede sem mostrar
na tela, para que o token não passe pela conversa. Se ela colar o token aqui assim mesmo, use-o só no comando manual
do Passo 3, não o repita em nenhuma resposta e sugira gerar outro depois.

Se o Figma recusar escopos (plano ou permissão de organização), registre quais ficaram de fora e siga: sem
**Variables**, as ferramentas de variáveis pela API REST falham; o plugin continua lendo variáveis pelo arquivo aberto.

## Passo 3 — Servidor registrado no Claude Code

Pergunte o escopo antes de escrever:

| Escopo | Onde fica | Quando usar |
|---|---|---|
| `user` | `~/.claude.json`, para todas as pastas | a pessoa usa o Figma em vários projetos; é o que o README do figma-console recomenda |
| `local` | `~/.claude.json`, só nesta pasta | o servidor deve existir só neste projeto |
| `project` | `.mcp.json` versionado | **nunca** com o token dentro; só se o token vier de variável de ambiente fora do git |

**Sem token (padrão), o Claude registra.** O comando não leva segredo, então rode-o na pasta do projeto, depois da
resposta sobre o escopo:

```sh
sh ${CLAUDE_SKILL_DIR}/scripts/registrar.sh <user|local>
```

**⏸ Ação da pessoa, só no modo `token`.** Entregue o comando pronto para colar no terminal dela, na pasta do projeto,
com o caminho absoluto do script:

```sh
sh ${CLAUDE_SKILL_DIR}/scripts/registrar.sh <user|local> --com-token
```

Com `--com-token`, o script pede o token sem eco e recusa o que não começa com `figd_`, sem alterar nada. Nos dois
casos ele remove o registro anterior do mesmo escopo, registra o servidor e mostra o resultado com o token mascarado.
No modo `token`, peça para ela colar aqui a saída, que é segura.

O script avisa quando sobra um registro `local` depois de um `user`. Os dois juntos funcionam, mas o `local` vence o
`user` naquela pasta e esconde uma troca de token feita só no `user`; a remoção dele é decisão da pessoa, e o script
imprime o comando.

**Node instalado por gerenciador de versões (nvm, fnm, asdf).** O Claude Code pode não herdar o `PATH` do shell. O
sintoma é `Command not found: node` ou `parseArgs not exported from 'node:util'` (Node velho). Passe o caminho
absoluto do `npx` de um Node 18+ como último argumento: `registrar.sh user /caminho/do/node/bin/npx`. O caminho sai
de `command -v npx` no shell da pessoa.

**Sem acesso a um terminal**, ou com o token já colado na conversa, o registro manual é este. Sem token, tire o
`-e FIGMA_ACCESS_TOKEN=…`; com token, ponha o valor no lugar de `figd_SEU_TOKEN`:

```sh
claude mcp remove figma-console -s <escopo>     # só se já existir nesse escopo
claude mcp add figma-console -s <escopo> -e FIGMA_ACCESS_TOKEN=figd_SEU_TOKEN -e ENABLE_MCP_APPS=true -- npx -y figma-console-mcp@latest
```

**⏸ Ação da pessoa:** reiniciar o Claude Code (sair e abrir de novo; na extensão do VS Code, recarregar a janela).
Depois do reinício, rode o Passo 1 de novo.

## Passo 4 — Servidor de pé

Com o registro certo e o veredito `SERVIDOR-PARADO`, o servidor não subiu. Confira nesta ordem:

1. `claude mcp get figma-console` mostra `Status: ✔ Connected`. Com outro status, o cliente não conseguiu iniciar o
   processo: confira o Node (Passo 3) e peça o reinício do cliente.
2. `/mcp` numa sessão nova lista `figma-console` com as ferramentas. Sem ele, o cliente não recarregou: reinicie.
3. O manifesto `~/.figma-console-mcp/plugin/manifest.json` existe. O servidor copia os arquivos do plugin para essa
   pasta quando sobe. Sem a pasta, o servidor ainda não rodou nesta máquina. O caminho também sai de
   `npx figma-console-mcp@latest --print-path`.

Com as dez portas 9223–9232 ocupadas, um servidor novo não acha porta livre. Liste os processos com
`lsof -nP -iTCP:9223-9232 -sTCP:LISTEN` e peça licença à pessoa antes de encerrar os de sessões que já fechou.

Rode o Passo 1 de novo até o veredito ser `PRONTO-PARA-PLUGIN`.

## Passo 5 — Plugin Desktop Bridge rodando no arquivo

**⏸ Ação da pessoa.** O app web do Figma não serve; precisa ser o Figma Desktop. Escreva para ela:

1. Abra o Figma Desktop e abra o arquivo em que vai trabalhar (o plugin roda dentro de um arquivo).
2. Confira se o plugin já foi importado: menu **Plugins → Development**. Se **Figma Desktop Bridge** aparece na lista,
   pule para o item 4.
3. Importe uma vez: **Plugins → Development → Import plugin from manifest…** e escolha
   `~/.figma-console-mcp/plugin/manifest.json`. A pasta começa com ponto e fica oculta: no seletor do macOS,
   `Cmd+Shift+G` aceita o caminho digitado, e `Cmd+Shift+.` mostra pastas ocultas.
4. Rode **Plugins → Development → Figma Desktop Bridge**. Uma janelinha do plugin abre.
5. Espere o selo da janelinha mostrar `Local · ready` e me avise.

Deixe a janelinha aberta enquanto trabalha; fechar o plugin corta a ligação. Cada arquivo aberto precisa do plugin
rodando nele.

O selo diz o que falta:

| Selo | Causa | Ação |
|---|---|---|
| `MCP scanning` | o servidor ainda não está de pé | volte ao Passo 4; o plugin tenta de novo a cada poucos segundos |
| `No MCP server found` | o plugin desistiu de procurar | com o servidor de pé, feche e rode o plugin de novo |
| aviso de atualização, ou comportamento velho | o Figma guarda uma cópia própria do plugin e usa a cópia antiga até um novo import | **Plugins → Manage plugins**, importe o manifesto de novo |

Fora o aviso de atualização, ou as notas de versão do figma-console pedindo, o import é feito uma vez só.

## Passo 6 — Leitura e escrita provadas

Chame `figma_get_status`. Ele deve mostrar o transporte WebSocket ativo, a porta desta sessão e o arquivo conectado.
Depois prove a leitura com `figma_get_selection` (peça para a pessoa selecionar algo) ou `figma_search_components`.

**Com token registrado, ele se prova à parte.** `Status: ✔ Connected` no `claude mcp get` diz só que o processo
subiu: um token falso dá o mesmo status. Sem token, pule este parágrafo. Prove o token com uma ferramenta que chama a API REST do Figma,
como `figma_get_comments` ou `figma_get_file_versions` no arquivo aberto. Um erro 401 (`Token has expired`) ou 403
leva à pergunta do veredito `TOKEN` no Passo 1. O Passo 1 já testa o token, então esta prova confirma o que o diagnóstico disse.

A escrita de teste altera o arquivo da pessoa por um instante, então peça licença antes. Com o sim, passe o conteúdo
de `${CLAUDE_SKILL_DIR}/scripts/teste-escrita.js` como código ao `figma_execute`. O script cria um frame de 100×100
longe do conteúdo, lê de volta e apaga, tudo na mesma execução e mesmo quando a leitura falha. A escrita passou quando
o resultado traz `ok: true`; com `apagado: false`, peça à pessoa para apagar o frame `teste figma-console`. Sem
licença, relate a escrita como não testada.

Relate à pessoa: o escopo do registro, a porta, o arquivo conectado, se há token (e se ele foi provado) e se a escrita foi testada. Sem token, diga em uma linha o que fica de fora e
que o modo `token` liga essas ferramentas depois.

## Passo 7 — Pessoa orientada sobre o uso (modo `ajuda`, ou ao fim de `instalar`)

Leia [references/uso.md](references/uso.md) e apresente à pessoa, em poucas linhas: o que precisa estar aberto antes
de pedir, três ou quatro pedidos de exemplo da tabela que combinem com o que ela disse querer fazer, e os sintomas de
"parou de responder" com a ação de cada um. Ofereça as skills de tipografia e espaçamento deste plugin quando o pedido
for sobre estilos de texto ou espaçamento.

## Checklist

- [ ] O modo foi escolhido, e o diagnóstico rodou na pasta (ou pastas) onde o Figma vai ser usado
- [ ] O token não apareceu em nenhuma saída nem em nenhum arquivo versionado
- [ ] Cada **⏸ Ação da pessoa** virou instruções numeradas, com o resultado esperado, e a execução esperou a resposta
- [ ] O escopo do registro foi decidido pela pessoa, e o registro antigo do mesmo nome foi removido
- [ ] O cliente foi reiniciado depois de cada mudança de registro, antes de qualquer teste
- [ ] `figma_get_status` confirmou a conexão com o arquivo; com token, uma chamada à API REST o provou
- [ ] A escrita de teste foi feita com licença e desfeita, ou relatada como não testada
- [ ] A pessoa recebeu os pedidos de exemplo e os sintomas de falha (`ajuda`, e fim de `instalar`)

## ⟳ Depois de cada uso: revise esta skill

O ponto mais frágil é o parse do `claude mcp get` no script: ele depende do texto em inglês da CLI (`Scope:`,
`No MCP server named`). Quando o texto mudar, o veredito vira `CLI-INESPERADA` ou o escopo sai `FALHA escopo
ilegível`; corrija o padrão no script.

O Passo 6 já rodou contra um Figma real, e os Passos 2 e 5 ainda não: os nomes de menu (avatar → Settings → Security,
Plugins → Development) e o texto do selo vêm da documentação do figma-console. Corrija o passo que errar na primeira
instalação do zero.

Verificado em: figma-console-mcp 1.40.9, Claude Code 2.1.x, macOS, 2026-10-14.
