#!/usr/bin/env sh
# Registra o figma-console MCP no Claude Code. Feito para a PESSOA rodar no terminal dela.
# O padrão é sem token: o plugin Desktop Bridge cobre o trabalho no arquivo aberto.
# Com --com-token, o token é pedido sem eco, não entra no histórico do shell e não passa pela conversa com o Claude.
# Uso: sh registrar.sh <user|local> [--com-token] [caminho-do-npx]
#   user  — vale para todas as pastas (recomendado pelo README do figma-console)
#   local — vale só para a pasta atual
#   caminho-do-npx — opcional, para Node instalado por nvm/fnm/asdf (saída de `command -v npx`)
set -eu

escopo="${1:-}"
[ $# -gt 0 ] && shift
com_token=0
if [ "${1:-}" = "--com-token" ]; then com_token=1; shift; fi
npx_bin="${1:-npx}"
case "$escopo" in
  user|local) ;;
  *) echo "uso: sh registrar.sh <user|local> [--com-token] [caminho-do-npx]" >&2; exit 2 ;;
esac
command -v claude >/dev/null 2>&1 || { echo "CLI claude ausente do PATH" >&2; exit 1; }

token=""
if [ "$com_token" = 1 ]; then
  printf 'Cole o token do Figma (figd_…) e tecle Enter. Ele não aparece na tela: '
  stty -echo 2>/dev/null || true
  IFS= read -r token
  stty echo 2>/dev/null || true
  echo
  case "$token" in
    figd_*) ;;
    *) echo "o token precisa começar com figd_ — nada foi alterado" >&2; exit 1 ;;
  esac
fi

claude mcp remove figma-console -s "$escopo" >/dev/null 2>&1 && echo "registro $escopo anterior removido" || true
if [ -n "$token" ]; then
  claude mcp add figma-console -s "$escopo" -e FIGMA_ACCESS_TOKEN="$token" -e ENABLE_MCP_APPS=true \
    -- "$npx_bin" -y figma-console-mcp@latest >/dev/null
else
  claude mcp add figma-console -s "$escopo" -e ENABLE_MCP_APPS=true \
    -- "$npx_bin" -y figma-console-mcp@latest >/dev/null
fi
unset token

echo "registrado no escopo $escopo:"
claude mcp get figma-console 2>&1 | sed -E 's/(figd_)[A-Za-z0-9_-]+/\1***/g; s/^/  /'
if [ "$escopo" = user ] && claude mcp get figma-console 2>&1 | grep -q 'Scope: Local'; then
  echo "atenção: esta pasta ainda tem um registro local, que vence o user aqui."
  echo "remova com: claude mcp remove figma-console -s local"
fi
echo "Agora reinicie o Claude Code e avise o Claude."
