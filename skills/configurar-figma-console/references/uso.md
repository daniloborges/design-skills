# Usar o figma-console no dia a dia

Consultado no modo `ajuda`, ou quando a pessoa pergunta o que dá para pedir ao Claude no Figma. As ferramentas chegam
com o prefixo do servidor (`mcp__figma-console__figma_get_status`); abaixo aparecem sem ele.

## Antes de qualquer pedido

- O Figma Desktop está aberto num arquivo, e o plugin **Figma Desktop Bridge** está rodando nele com o selo
  `Local · ready`. Quase tudo passa pelo plugin, sem token.
- As linhas marcadas com **(token)** na tabela usam a API REST do Figma e só funcionam com um token registrado. Sem
  ele, a ferramenta responde "FIGMA_ACCESS_TOKEN not configured"; ofereça o modo `token` desta skill.
- Comece a sessão com `figma_get_status`: ele diz a porta, o arquivo conectado e se o transporte está ativo.
- Para trabalhar sobre algo específico, a pessoa seleciona no Figma antes de pedir; `figma_get_selection` lê a seleção.
- Ids de nó (`123:456`) valem só para a sessão em que foram lidos. Numa sessão nova, busque de novo
  (`figma_search_components`, `figma_get_selection`) em vez de reutilizar um id antigo.

## O que pedir, e a ferramenta que responde

| A pessoa quer… | Exemplo de pedido | Ferramentas |
|---|---|---|
| saber se está ligado | "confere a conexão com o Figma" | `figma_get_status` |
| ver o que está na tela | "tira um print do frame selecionado" | `figma_get_selection`, `figma_take_screenshot` |
| achar e usar componentes | "procura os botões e coloca um primário aqui" | `figma_search_components`, `figma_instantiate_component` |
| ler o design system | "lista as variáveis de cor e os estilos de texto" | `figma_get_variables`, `figma_get_text_styles`, `figma_get_styles` |
| criar ou mudar variáveis | "cria a coleção Spacing com modos light e dark" | `figma_setup_design_tokens`, `figma_batch_create_variables`, `figma_batch_update_variables` |
| exportar tokens para o código | "exporta as variáveis em DTCG" | `figma_export_tokens` |
| criar ou editar desenho | "cria um card com título e botão" | `figma_execute`, depois `figma_take_screenshot` para conferir |
| comparar Figma e código | "esse componente bate com o Button.tsx?" | `figma_check_design_parity` |
| auditar acessibilidade e saúde | "audita o design system" | `figma_audit_design_system`, `figma_audit_component_accessibility`, `figma_lint_design` |
| documentar um componente | "gera a doc do componente Input" | `figma_generate_component_doc` |
| histórico **(token)** | "o que mudou desde a última versão?" | `figma_get_file_versions`, `figma_diff_versions`, `figma_generate_changelog` |
| comentários **(token)** | "lista os comentários abertos" | `figma_get_comments`, `figma_post_comment` |
| FigJam | "cria stickies com estes itens" | `figjam_create_stickies`, `figjam_create_connector` |
| depurar um plugin | "mostra o console do plugin" | `figma_get_console_logs`, `figma_watch_console` |

## Como o Claude deve agir ao escrever no arquivo

- **Escrita muda o arquivo da pessoa.** Diga o que vai criar ou alterar antes de executar, e prefira criar dentro de
  uma Section ou Frame em vez de soltar elementos no canvas.
- **Confira cada escrita com um screenshot.** Crie com `figma_execute`, capture com `figma_take_screenshot`, ajuste
  alinhamento e espaçamento, e repita no máximo três vezes.
- **Várias variáveis vão em lote.** `figma_batch_create_variables` e `figma_batch_update_variables` aceitam até 100
  por chamada; uma chamada por variável é dezenas de vezes mais lenta.
- Antes de criar uma página, confira se ela já existe, para não duplicar.

## Quando algo para de responder no meio do trabalho

| Sintoma | Ação da pessoa |
|---|---|
| "Failed to connect to Figma Desktop" | rodar o plugin de novo no arquivo (Plugins → Development → Figma Desktop Bridge) |
| o plugin foi fechado ou o arquivo trocou | rodar o plugin no arquivo novo; cada arquivo precisa do seu |
| as ferramentas `figma_*` sumiram da sessão | reiniciar o Claude Code; se continuar, rodar esta skill em `auditoria` |
