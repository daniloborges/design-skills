# Grupo SET — adicionais por setor

Só entram quando o conteúdo é do tipo regulado. São as únicas regras brasileiras com **número explícito de tamanho de fonte**, e todas nasceram para papel. A aplicação ao digital é interpretação, salvo onde está indicado.

## Normas

| Norma | Tipo | Quando aplica | O que exige |
|---|---|---|---|
| **CDC (Lei 8.078/90), art. 54 §3º** (redação da Lei 11.785/2008) | Lei | Contratos de adesão escritos | Caracteres ostensivos e legíveis, com fonte não inferior ao **corpo 12** |
| **CDC, art. 54 §4º** | Lei | idem | Cláusulas que limitam direitos do consumidor redigidas **com destaque** |
| **CDC, art. 46** | Lei | Qualquer contrato de consumo | O contrato não obriga se o consumidor não teve oportunidade de conhecer o conteúdo antes |
| **STJ, REsp 1.602.678/RJ (2017)** | Jurisprudência | — | Recusou estender o corpo 12 a anúncios publicitários. A regra vale para contrato, não para UI em geral |
| **ANVISA RDC 47/2009, art. 5º** | Regulamento | Bulas de medicamento | Bula padrão ≥ 10 pt (Times New Roman). Versão ampliada para deficiência visual ≥ 24 pt (Verdana), em texto corrido, sem colunas. Bula eletrônica: texto corrido e sem colunas, sem tamanho próprio definido |
| **Banco Central, ANS, ANATEL** | — | — | **Nenhuma regra explícita de fonte para produtos digitais foi encontrada** (busca superficial). Não afirme que existe |

**Como tratar o "corpo 12" no digital.** Corpo 12 é medida tipográfica de impresso (12 pt). No CSS, 12 pt equivale a 16 px. A skill trata **16 px como piso defensável** para termos de uso, contratos e consentimentos em telas, mas sempre como interpretação. Nenhum precedente confirmado estende o art. 54 §3º a T&C digitais.

## Checklist

| ID | Requisito | Aplica quando | Verificar no Figma | Verificar no código |
|---|---|---|---|---|
| SET-01 | Texto de contrato, termos ou consentimento em `legal/md` com ≥ 16 px | Contrato de adesão, termos de uso, checkout com cláusulas | Estilo `legal/*` e tamanho efetivo; nenhum `caption` ou `body/sm` em texto contratual | Token `type-legal-*` ≥ 1rem |
| SET-02 | Cláusulas restritivas em destaque (`-strong` ou equivalente) | idem | Trechos de limitação, multa ou fidelidade com modificador | `strong` na marcação |
| SET-03 | Contrato acessível antes do aceite (não escondido em modal minúsculo) | idem | Fluxo mostra ou linka o texto completo antes do botão de aceite | Link ou âncora antes do aceite |
| SET-04 | Bula em texto corrido, sem colunas | Bula eletrônica | Layout de uma coluna | CSS sem `column-count` ou grid de colunas |
| SET-05 | Bula ampliada disponível (≥ 24 pt ≈ 32 px) | Bula para deficiência visual | Existe variante ampliada | Modo ou página ampliada |
| SET-06 | *(Lacuna)* Regras de BACEN, ANS e ANATEL | Fintech, saúde suplementar, telecom | Marcar 🔍 e recomendar consulta jurídica | — |

## Fontes

- [CDC – Lei 8.078/90](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm)
- [STJ REsp 1.602.678 (comentário Dizer o Direito)](https://www.dizerodireito.com.br/2017/08/a-fonte-utilizada-nas-ofertas.html)
- [ANVISA RDC 47/2009](https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2009/rdc0047_08_09_2009.html)
