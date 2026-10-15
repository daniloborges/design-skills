#!/usr/bin/env sh
# Registra o figma-console MCP no Claude Code. Feito para a PESSOA rodar no terminal dela:
# o token é pedido sem eco, não entra no histórico do shell e não passa pela conversa com o Claude.
# Uso: sh registrar.sh <user|local> [caminho-do-npx]
#   user  — vale para todas as pastas (recomendado pelo README do figma-console)
#   local — vale só para a pasta atual
#   caminho-do-npx — opcional, para Node instalado por nvm/fnm/asdf (saída de `command -v npx`)
set -eu

escopo="${1:-}"
npx_bin="${2:-npx}"
case "$escopo" in
  user|local) ;;
  *) echo "uso: sh registrar.sh <user|local> [caminho-do-npx]" >&2; exit 2 ;;
esac
command -v claude >/dev/null 2>&1 || { echo "CLI claude ausente do PATH" >&2; exit 1; }

printf 'Cole o token do Figma (figd_…) e tecle Enter. Ele não aparece na tela: '
stty -echo 2>/dev/null || true
IFS= read -r token
stty echo 2>/dev/null || true
echo
case "$token" in
  figd_*) ;;
  *) echo "o token precisa começar com figd_ — nada foi alterado" >&2; exit 1 ;;
esac

claude mcp remove figma-console -s "$escopo" >/dev/null 2>&1 && echo "registro $escopo anterior removido" || true
claude mcp add figma-console -s "$escopo" \
  -e FIGMA_ACCESS_TOKEN="$token" -e ENABLE_MCP_APPS=true \
  -- "$npx_bin" -y figma-console-mcp@latest >/dev/null
unset token

echo "registrado no escopo $escopo:"
claude mcp get figma-console 2>&1 | sed -E 's/(figd_)[A-Za-z0-9_-]+/\1***/g; s/^/  /'
if [ "$escopo" = user ] && claude mcp get figma-console 2>&1 | grep -q 'Scope: Local'; then
  echo "atenção: esta pasta ainda tem um registro local, que vence o user aqui."
  echo "remova com: claude mcp remove figma-console -s local"
fi
echo "Agora reinicie o Claude Code e avise o Claude."
