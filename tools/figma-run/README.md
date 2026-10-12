# figma-run (opcional · específico do figma-console)

Executa scripts da Plugin API no Figma **sem passar pelo MCP**. Só funciona com o plugin
**Desktop Bridge do [figma-console-mcp](https://github.com/southleft/figma-console-mcp)**. Quem usa o Figma MCP
oficial ou outro bridge pode ignorar esta pasta: as skills funcionam igual pelas ferramentas do MCP.

## Por que usar
- **Menos chamadas e menos tokens:** o script vai do disco direto para o Figma. O agente não precisa colar
  20 mil caracteres numa chamada `figma_execute`.
- **Sem limite de 30 s:** `--timeout` configurável (ex. 120000) para arquivos grandes.
- **Repetível:** mesmos scripts, mesmos parâmetros (`--args plano.json`), resultado em JSON (`--out`).

## Como funciona
O plugin procura servidores nas portas **9223–9232** (`GET /health` a cada 3–10 s) e se conecta a **todos**.
O `figma-run` abre um servidor temporário numa porta livre dessa faixa (de 9232 para baixo, deixando a 9223 para
o MCP), espera o plugin conectar e mandar `FILE_INFO`, envia `{ id, method: 'EXECUTE_CODE', params: { code, timeout } }`,
imprime a resposta e encerra. Convive com o MCP aberto.

## Instalar e rodar (na mesma máquina do Figma Desktop)
```bash
cd tools/figma-run && npm install
# o plugin Desktop Bridge precisa estar aberto no arquivo
node figma-run.mjs ../../skills/tipografia-semantica-figma/scripts/inventario-tipografia.js \
  --set page="📖 Tipografia" --set frame="📖 Inventário de tipografia" --set title="Tipografia — Meu projeto" \
  --file "Meu arquivo" --timeout 120000
```

| Flag | O quê |
|---|---|
| `--set chave=valor` | vira `ARGS.chave` no script (valor é JSON quando possível: `--set x=120`, `--set stay=true`) |
| `--args arquivo.json` | carrega vários ARGS de uma vez (ex. o PLAN do `aplicar.js`) |
| `--file nome` | escolhe o arquivo quando há vários abertos (nome parcial ou fileKey) |
| `--timeout ms` | limite da execução no plugin (padrão 120000) |
| `--wait ms` | quanto esperar o plugin conectar (padrão 25000) |
| `--out arquivo` | salva o resultado JSON em vez de imprimir |

Saída: JSON no stdout; logs no stderr. Código de saída 0 = ok, 1 = erro no script, 4 = plugin não conectou.

## Scripts prontos (skill tipografia-semantica-figma)
| Script | ARGS principais |
|---|---|
| `inventario.js` | `scope` (`auto` · `page` · `all-pages`) — leitura |
| `inventario-tipografia.js` | `page`, `frame`, `title`, `x`, `y`, `usesScope`, `prefix`, `stay` — cria/recria o inventário |
| `aplicar.js` | `mode` (`preview` · `promover` · `aplicar` · `descartar` · `ordenar`), `dryRun`, `plan`, `preview`, `inventory` |

Exemplo com plano em arquivo:
```bash
node figma-run.mjs ../../skills/tipografia-semantica-figma/scripts/aplicar.js --args plano.json --set mode=preview
node figma-run.mjs ../../skills/tipografia-semantica-figma/scripts/aplicar.js --args plano.json --set mode=promover --set dryRun=true
```

## Limites
- Precisa rodar **no computador onde o Figma Desktop está aberto** (o plugin só enxerga `localhost` dessa máquina).
  Uma sessão do Claude na nuvem, ou o shell isolado do Cowork, não alcança esse `localhost`; o Claude Code local no
  Mac alcança.
- Protocolo lido do código do plugin v1.39 (`figma-desktop-bridge/ui.html`). Se o figma-console mudar o protocolo,
  ajuste `figma-run.mjs`.
- Testado com um plugin simulado (mesmo protocolo); ainda **não testado contra o Figma real**.
