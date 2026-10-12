# Grupo LEI — obrigatório por lei

## Normas

| Norma | Tipo | Quem precisa cumprir | O que diz |
|---|---|---|---|
| **Lei 13.146/2015 (LBI), art. 63** | Lei federal | Empresas com sede ou representação comercial no Brasil e órgãos de governo, em todos os sites que mantêm, sem porte mínimo | Acessibilidade conforme "as melhores práticas e diretrizes de acessibilidade adotadas internacionalmente" (na prática, WCAG). §1º: símbolo de acessibilidade em destaque. Não traz parâmetros numéricos nem multa própria |
| **Lei 10.098/2000**, arts. 2º e 17–19 | Lei federal | Poder público | Define barreiras na comunicação e na informação e obriga o poder público a eliminá-las |
| **Decreto 5.296/2004, art. 47** | Decreto | Administração pública (portais e sites) | Acessibilidade obrigatória para pessoas com deficiência visual |
| **Portaria SLTI/MP nº 3/2007 + eMAG 3.1** | Portaria + modelo técnico | Obrigatório para o SISP (administração federal direta, autarquias, fundações). Adesão voluntária para os demais | Contraste de 4,5:1, não depender só de cor, foco visível ≥ 2 px, redimensionamento até 200% sem rolagem horizontal |

**Como a lei é cobrada.** A LBI não define multa no art. 63. A cobrança vem por ação civil pública (Ministério Público, Defensoria, associações), Procon/CDC e ações individuais. Como a lei remete a "diretrizes internacionais", **WCAG 2.1/2.2 AA é a forma defensável de demonstrar conformidade**. Os itens abaixo traduzem isso para texto e tipografia.

## Checklist (texto e tipografia)

| ID | Requisito | Base | Verificar no Figma | Verificar no código |
|---|---|---|---|---|
| LEI-01 | Contraste do texto ≥ 4,5:1 (texto grande ≥ 3:1) | LBI → WCAG 1.4.3; eMAG | Cor do texto contra o fundo efetivo, em cada estado | Tokens de cor + teste automático (axe) |
| LEI-02 | Informação não depende só de cor (links, erros, status) | LBI → WCAG 1.4.1; eMAG | Link em `body` tem sublinhado ou outro sinal além da cor | CSS de `a` e dos estados |
| LEI-03 | Texto amplia até 200% sem perda de conteúdo nem rolagem horizontal | LBI → WCAG 1.4.4; eMAG | 🔍 Parcial: containers de texto em hug/auto-layout, sem altura fixa | `font-size` em rem/em; teste com zoom de 200% |
| LEI-04 | Reflow em 320 px de largura sem rolagem em duas direções | LBI → WCAG 1.4.10; eMAG | 🔍 Existe frame mobile? O texto quebra? | Teste em viewport de 320 px |
| LEI-05 | Aguenta espaçamento ampliado (entrelinha 1,5×, parágrafo 2×, letras 0,12×, palavras 0,16×) | LBI → WCAG 1.4.12 | Frames sem altura fixa, sem clip em texto | Sem `height` fixo nem `overflow: hidden` em blocos de texto |
| LEI-06 | Foco visível (borda ≥ 2 px, segundo o eMAG) em `label/*` interativo | LBI → WCAG 2.4.7; eMAG | Existe variante de foco nos componentes com label | `:focus-visible` definido |
| LEI-07 | Estrutura de títulos real: heading é `hx`, sem pular níveis, um único `h1` | LBI → WCAG 1.3.1 e 2.4.6 | Estilos `heading/*` anotados com o nível | Lint de headings (skill de código) |
| LEI-08 | Símbolo de acessibilidade em destaque no site | LBI art. 63 §1º | Presença no rodapé ou cabeçalho | Presença no HTML |
| LEI-09 | *(Só órgão federal)* Conformidade ao eMAG 3.1 como um todo | Portaria 3/2007 | Checklist eMAG completo, fora do escopo de texto | Avaliador ASES |

## Fontes

- [Lei 13.146/2015](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm)
- [Lei 10.098/2000](https://www.planalto.gov.br/ccivil_03/leis/l10098.htm)
- [Decreto 5.296/2004](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/decreto/d5296.htm)
- [eMAG – Apresentação e design](https://emag.governoeletronico.gov.br/cursodesenvolvedor/desenvolvimento-web/praticas-web-acessivel-apresentacao-design.html) · [Modelo de acessibilidade (gov.br)](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/acessibilidade-digital/modelo-de-acessibilidade)

## Incertezas

- Os valores de sanção da LBI e a aplicação do art. 88 e da Lei 7.853/89 a sites não foram verificados. Não cite valores.
- A numeração interna das recomendações do eMAG não foi confirmada. Cite pelo título.
