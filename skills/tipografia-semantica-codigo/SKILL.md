---
name: tipografia-semantica-codigo
description: Guardrail de tipografia no código — confere se tokens e classes de texto (CSS, SCSS, DTCG JSON, HTML/JSX/Vue/Svelte) seguem a taxonomia semântica (type-heading-xl, type-body-md…), usam rem, respeitam pisos de tamanho, entrelinha e a semântica HTML (heading só em hx, sem pular níveis), e se batem com os estilos do Figma. Use ao revisar PR, criar ou migrar tokens de tipografia, gerar CSS a partir do Figma, ou auditar acessibilidade/compliance de texto no código. Para o arquivo Figma use tipografia-semantica-figma.
---

# Tipografia semântica — frente código (guardrail)

Garante que o código fale a mesma língua do Figma e não deixe passar texto inacessível. A taxonomia é a mesma da skill `tipografia-semantica-figma`: [references/taxonomia.md](references/taxonomia.md).

## Nomes no código

| Figma | Classe | Custom properties | DTCG |
|---|---|---|---|
| `heading/xl` | `.type-heading-xl` | `--type-heading-xl-{font-family,font-size,line-height,font-weight,letter-spacing}` | `type.heading.xl` |
| `heading/xl-emphasis` | `.type-heading-xl-emphasis` | `--type-heading-xl-emphasis-*` | `type.heading.xl.emphasis` |

Um prefixo de marca no Figma (`acme/heading/xl`) é descartado no código.

## Scripts (Node ≥ 18, sem dependências)

| Script | Para quê |
|---|---|
| `scripts/gerar-tokens.mjs estilos.json [--out tipografia] [--base 16]` | Gera `tipografia.css` (custom properties + classes, tudo em rem, letter-spacing em em) e `tipografia.tokens.json` (DTCG) a partir dos estilos do Figma. Ignora e lista os estilos fora da taxonomia e os `_deprecated/` |
| `scripts/checar-tipografia.mjs <arquivos\|pastas> [--figma estilos.json] [--faixas faixas.json] [--json]` | Guardrail. Sai com código 1 se houver bloqueante, então serve em CI e em pre-commit |

`estilos.json` é a saída de `figma_get_text_styles` (figma-console) ou um array `[{name, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing, textCase}]`.

## O que o guardrail checa

| ID | Checagem | Severidade |
|---|---|---|
| NOME-01 | Classe ou token `type-*` fora da taxonomia (ex. `type-stat-lg`) | Alerta |
| NOME-02 | Tamanho fora da faixa do nome (use `--faixas` em escala expressiva) | Boa prática |
| NOME-03 | Tamanho fracionado | Boa prática |
| VOL-01 | `font-size` em px ou pt, em token ou regra solta. As técnicas C12, C13 e C14 pedem %, palavra-chave ou em/rem | Alerta |
| VOL-07 | Abaixo de 11 px | Bloqueante |
| VOL-07 | Abaixo do piso do papel: corpo 14, suporte 12 | Alerta |
| SET-01 | `legal/*` abaixo de 16 px (CDC, interpretação) | Bloqueante |
| VOL-02 | `line-height` de body, lead ou legal abaixo de 1,5 | Boa prática |
| VOL-04 | `text-align: justify` | Boa prática |
| VOL-08 | Peso ≥ 600 abaixo de 14 px | Boa prática |
| LEI-07 | `type-heading-*` fora de `h1`–`h6` ou `role="heading"` | Bloqueante |
| LEI-07 | `type-{body,lead,eyebrow,label,caption,code,legal,big-number,index}-*` em `hN` | Bloqueante |
| LEI-07 | Nível de heading pulado, mais de um `h1`, página sem `h1` | Alerta |
| SYNC-01 / 02 | Estilo do Figma sem token no código, ou token sem estilo (com `--figma`) | Alerta |

Os tamanhos são convertidos com base 16: rem e em × 16, e `clamp()` usa o mínimo. `var()` e `calc()` não são resolvidos, então confira esses à mão.

## Fluxo

1. **Localize a tipografia do projeto:** tokens (CSS, SCSS, JSON), Tailwind config, tema. Se usar Tailwind ou CSS-in-JS, os nomes `type-*` vivem como classes utilitárias (`@layer components`) ou objetos de tema. Adapte a leitura e mantenha os nomes.
2. **Rode o guardrail** no escopo pedido: PR (arquivos alterados), pasta de tokens ou projeto. Quando houver acesso ao Figma, exporte `figma_get_text_styles` e passe `--figma`.
3. **Relate por severidade**, na tabela gerada pelo script, com a correção sugerida. Não corrija sem pedido. Quando pedirem correção:
   - px → rem;
   - troque o elemento HTML, não o estilo, quando o erro é semântico;
   - suba o tamanho até o piso;
   - para renomear, siga a taxonomia e atualize os usos.
4. **Migração ou criação de tokens:** gere com `gerar-tokens.mjs` a partir do Figma, em vez de escrever à mão. O Figma é a origem, e o CSS gerado traz o aviso "não edite à mão".
5. **Checagens que o script não faz** (confira manualmente ou com axe/Lighthouse quando houver página rodando):
   - contraste real (LEI-01);
   - zoom de 200% (LEI-03);
   - reflow em 320 px (LEI-04);
   - espaçamento ampliado da WCAG 1.4.12 sem corte (LEI-05): procure `height` fixo ou `overflow: hidden` em blocos de texto;
   - foco visível (LEI-06).

## Auditoria legal (opcional, só quando pedida)

[references/legal/README.md](references/legal/README.md) define os grupos (`lei`, `voluntario`, `setorial`) e o formato do checklist. No código, os itens que ficam 🔍 no Figma passam a ser verificáveis. Marque cada um como ✅, ❌ ou ⚠️, com arquivo e linha como evidência.

## Nunca
- Aceitar `font-size` em px num token novo.
- "Resolver" um estilo de heading num `<p>` trocando só o CSS: o problema é o elemento.
- Diminuir um tamanho para caber no nome: renomeie ou ajuste a faixa do projeto.
- Editar à mão o CSS gerado: edite no Figma e gere de novo.

## References
- [taxonomia.md](references/taxonomia.md): nomes, faixas, HTML, pisos. **Obrigatório.**
- [plataformas.md](references/plataformas.md): equivalência para exportar a iOS/Android/Windows.
- [legal/](references/legal/README.md): auditoria legal BR opcional.
