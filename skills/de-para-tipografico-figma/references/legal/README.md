# Auditoria legal e normativa (opcional)

Só rode quando alguém pedir compliance, auditoria legal ou conformidade no Brasil. Não faz parte da revisão padrão.

**Isto não é parecer jurídico.** A auditoria mostra, item a item, se o design ou o código atende a cada requisito, para apoiar a decisão de quem tem responsabilidade legal.

## Grupos

| Arquivo | Grupo | O que entra |
|---|---|---|
| [lei.md](lei.md) | **Obrigatório por lei** | LBI (Lei 13.146/2015), Lei 10.098/2000, Decreto 5.296/2004; para órgãos federais, eMAG via Portaria 3/2007 |
| [voluntario.md](voluntario.md) | **Voluntário / boa prática** | WCAG 2.x AA e AAA, ABNT NBR 17225:2025, eMAG fora do governo federal, gov.br DS |
| [setorial.md](setorial.md) | **Adicionais por setor** | CDC (contratos de adesão), ANVISA (bulas), lacunas conhecidas em outros setores |

## Como escolher o que auditar

Antes de começar, pergunte ou infira três coisas:
1. **Quem publica:** empresa com sede ou representação no Brasil, órgão federal (SISP), outro ente público ou empresa estrangeira.
2. **Tipo de conteúdo:** produto ou site comum, contrato de adesão ou termos, bula, outro regulado.
3. **Escopo:** arquivo Figma, página ou código.

| Situação | Grupos a auditar |
|---|---|
| Empresa privada brasileira, site ou app | `lei` (LBI) + `voluntario` (WCAG AA como forma de cumprir a LBI) |
| Órgão federal | `lei` completo (inclui eMAG) + `voluntario` |
| Tem contrato de adesão, termos de uso ou checkout com cláusulas | + `setorial` (CDC) |
| Farmacêutico, com bula digital | + `setorial` (ANVISA) |

## Formato do resultado

Uma tabela por grupo:

| ID | Requisito | Resultado | Evidência | Correção |
|---|---|---|---|---|
| LEI-01 | … | ✅ Atende · ❌ Não atende · ⚠️ Parcial · 🔍 Não verificável no Figma | nó, estilo ou arquivo:linha | o que mudar |

- Use 🔍 sempre que o requisito depender de implementação: unidade em rem, zoom, reflow, ordem de leitura. A skill de código cobre esses pontos.
- No final, faça um resumo por grupo com contagem e o item mais crítico.
