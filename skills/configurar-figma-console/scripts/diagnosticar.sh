#!/usr/bin/env sh
# Diagnóstico somente-leitura da ligação Claude Code → figma-console MCP → plugin Desktop Bridge.
# Não escreve nada e nunca imprime o token. Sai sempre com código 0: quem decide é a última linha, o veredito.
# Uso: sh diagnosticar.sh   (rode na pasta do projeto onde o Figma vai ser usado)

ok() { printf '  ok    %s\n' "$1"; }
falha() { printf '  FALHA %s\n' "$1"; }
aviso() { printf '  aviso %s\n' "$1"; }
VEREDITO=""
OUTROS=""
marca() { if [ -z "$VEREDITO" ]; then VEREDITO="$1"; else OUTROS="$OUTROS $1"; fi; }

echo "# figma-console — diagnóstico em $(pwd)"

# 1. Node 18+
if command -v node >/dev/null 2>&1; then
  major=$(node -p 'process.versions.node.split(".")[0]')
  if [ "$major" -ge 18 ]; then ok "node $(node --version)"; else falha "node $(node --version) — precisa de 18+"; marca "NODE"; fi
else
  falha "node ausente do PATH"; marca "NODE"
fi

# 2. Servidor registrado no Claude Code para ESTA pasta (token mascarado)
if command -v claude >/dev/null 2>&1; then
  saida=$(claude mcp get figma-console 2>&1)
  if printf '%s' "$saida" | grep -q 'No MCP server named'; then
    falha "figma-console não está registrado para esta pasta"; marca "SEM-REGISTRO"
  elif printf '%s' "$saida" | grep -q 'figma-console:'; then
    printf '%s\n' "$saida" | sed -E 's/(figd_)[A-Za-z0-9_-]+/\1***/g; s/^/        /'
    escopo=$(printf '%s' "$saida" | sed -n -E 's/.*Scope: *([A-Za-z]+).*/\1/p' | head -1)
    if [ -n "$escopo" ]; then ok "escopo: $escopo"; else falha "escopo ilegível — a saída da CLI mudou; leia o bloco acima"; fi
    token=$(printf '%s' "$saida" | sed -n -E 's/.*FIGMA_ACCESS_TOKEN=(figd_[A-Za-z0-9_-]+).*/\1/p' | head -1)
    if [ -z "$token" ] && printf '%s' "$saida" | grep -q 'FIGMA_ACCESS_TOKEN='; then
      falha "FIGMA_ACCESS_TOKEN sem o prefixo figd_"; marca "TOKEN"
    elif [ -z "$token" ]; then
      ok "sem token (padrão): o plugin funciona; comentários, versões e biblioteca publicada ficam de fora"
    elif command -v curl >/dev/null 2>&1; then
      # Prova o token na API REST do Figma. O valor vai só no cabeçalho, nunca na saída.
      resp=$(curl -s -m 10 -w '\n%{http_code}' -H "X-Figma-Token: $token" https://api.figma.com/v1/me 2>/dev/null)
      codigo=$(printf '%s' "$resp" | tail -1)
      case "$codigo" in
        200) ok "token aceito pela API do Figma" ;;
        401|403) msg=$(printf '%s' "$resp" | sed -n -E 's/.*"err":"([^"]*)".*/\1/p' | head -1)
                 falha "token recusado pela API do Figma ($codigo${msg:+: $msg}) — gere outro ou registre sem token"; marca "TOKEN" ;;
        *) aviso "não consegui testar o token na API do Figma (HTTP ${codigo:-sem resposta})" ;;
      esac
    else
      ok "FIGMA_ACCESS_TOKEN presente (figd_…); curl ausente, token não testado"
    fi
    unset token resp
    printf '%s' "$saida" | grep -q 'ENABLE_MCP_APPS' || aviso "ENABLE_MCP_APPS ausente (opcional, liga as telas interativas)"
  else
    falha "claude mcp get respondeu algo inesperado:"; printf '%s\n' "$saida" | sed -E 's/(figd_)[A-Za-z0-9_-]+/\1***/g; s/^/        /'
    marca "CLI-INESPERADA"
  fi
else
  falha "CLI claude ausente do PATH — confira o registro pelo /mcp numa sessão"
fi

# 3. Onde mais o servidor está registrado (só caminhos, nunca o env)
if [ -f "$HOME/.claude.json" ]; then
  node -e '
    const c = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const out = [];
    if (c.mcpServers && c.mcpServers["figma-console"]) out.push("user (todas as pastas)");
    for (const [p, v] of Object.entries(c.projects || {}))
      if (v.mcpServers && v.mcpServers["figma-console"]) out.push("local: " + p);
    console.log(out.length ? out.map(s => "        registrado em " + s).join("\n") : "        nenhum registro em ~/.claude.json");
  ' "$HOME/.claude.json" 2>/dev/null || aviso "não consegui ler ~/.claude.json"
fi

# 4. Arquivos do plugin, copiados pelo servidor quando ele sobe
if [ -f "$HOME/.figma-console-mcp/plugin/manifest.json" ]; then ok "manifesto do plugin em ~/.figma-console-mcp/plugin/manifest.json"
else falha "manifesto do plugin ausente — o servidor ainda não rodou nesta máquina"; marca "SERVIDOR-PARADO"; fi

# 5. Servidores escutando em 9223–9232. Vale para a MÁQUINA inteira, de qualquer sessão ou cliente.
n=$(lsof -nP -iTCP:9223-9232 -sTCP:LISTEN 2>/dev/null | awk 'NR>1' | wc -l | tr -d ' ')
portas=$(lsof -nP -iTCP:9223-9232 -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {split($9,a,":"); print a[length(a)]}' | sort -u | tr '\n' ' ')
if [ -n "$portas" ]; then
  ok "servidores na máquina: $portas(qualquer sessão; a porta desta sessão sai do figma_get_status)"
  [ "$n" -gt 2 ] && aviso "$n servidores de pé — sessões antigas também contam; o plugin conecta a todos"
else
  falha "nenhum servidor escutando em 9223–9232"; marca "SERVIDOR-PARADO"
fi

# 6. Versão publicada (o registro usa @latest, então o npx resolve esta)
ultima=$(npm view figma-console-mcp version 2>/dev/null)
[ -n "$ultima" ] && ok "versão publicada: $ultima"

echo
[ -n "$OUTROS" ] && echo "também falhou:$OUTROS"
echo "VEREDITO: ${VEREDITO:-PRONTO-PARA-PLUGIN}"
