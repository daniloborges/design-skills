#!/usr/bin/env bash
# Copia shared/ para references/ de cada skill do Claude e empacota as skills.
# Rode sempre que editar algo em shared/. As references dentro das skills são cópias: não edite lá.
set -euo pipefail
cd "$(dirname "$0")"

for skill in skills/*/; do
  case "$skill" in *configurar-figma-console*) continue ;; esac  # não usa a taxonomia
  rm -rf "${skill}references"
  mkdir -p "${skill}references"
  cp -R shared/. "${skill}references/"
  case "$skill" in
    *espacamento*)  # só os arquivos de espaçamento, mais a regra comum de modos
      find "${skill}references" -mindepth 1 -maxdepth 1 ! -name 'espacamento*' ! -name 'modos*' -exec rm -rf {} + ;;
    *dimensao*)     # só os arquivos de dimensão, mais a regra comum de modos
      find "${skill}references" -mindepth 1 -maxdepth 1 ! -name 'dimensao*' ! -name 'modos*' -exec rm -rf {} + ;;
    *)              # tipografia não recebe os arquivos de espaçamento nem de dimensão
      rm -f "${skill}references"/espacamento*.md "${skill}references"/dimensao*.md ;;
  esac
  echo "✓ ${skill}references ← shared/"
done

# Pacotes .skill (zip) para instalar no Claude
mkdir -p dist
for skill in skills/*/; do
  name="$(basename "$skill")"
  (cd skills && rm -f "../dist/${name}.skill" && zip -qr "../dist/${name}.skill" "$name" -x '*.DS_Store')
  echo "✓ dist/${name}.skill"
done

# Aviso de coerência: a versão condensada do Figma é mantida à mão
if [ shared/taxonomia.md -nt figma/tipografia-semantica-agente.md ]; then
  echo "⚠ shared/taxonomia.md é mais nova que figma/tipografia-semantica-agente.md — revise a versão condensada."
fi
if [ shared/espacamento.md -nt figma/espacamento-semantico.md ]; then
  echo "⚠ shared/espacamento.md é mais nova que figma/espacamento-semantico.md — revise a versão condensada."
fi
