# Modos de tela (Desktop × Mobile) — regra comum

Vale para tipografia e espaçamento. As skills `tipografia-semantica-figma` e `espacamento-semantico-figma` leem este arquivo antes de criar ou mudar um modo de tela.

## Uma chave de modo só

Um frame mobile troca o modo de cada coleção separadamente. Com a tipografia numa coleção e o espaçamento em outra, cada frame novo precisa do modo certo nas duas, e as duas trocas saem de sincronia.

1. **Procure uma coleção que já tenha os modos de tela** (`Desktop` e `Mobile`, ou `Desktop · Tablet · Mobile`). Se existir, as variáveis novas entram nela.
2. **Se as variáveis já moram em coleções diferentes** (o caso comum do espaçamento, que vive em `Spacing`), mover não é possível sem recriar e religar. Acrescente o modo mesmo assim e **declare as duas chaves** no relatório: quais coleções, e que todo frame mobile precisa das duas em `Mobile`. Configure as duas nos frames mobile que já existem.
3. **Crie uma coleção nova só quando nenhuma tem os modos**, com o nome `Viewport`.

`Desktop` é sempre o **primeiro modo** da coleção. É o padrão, e todo frame sem modo explícito (os importados, os de 1440 ou 1920) cai nele.

## O valor de desktop entra exato

O modo `Desktop` recebe o valor que o estilo ou o nó já tem, fracionado inclusive (206,8). Ligar a variável não muda nada no desktop. Arredondar para a grade é uma mudança visual separada: registre como alerta e pergunte.

## Equilíbrio: o pequeno fica, o grande encolhe mais

O padrão das referências (Utopia, guias de tipografia responsiva, Material) é o mesmo para texto e espaço:

- **Valor pequeno não muda.** Texto até 16 px fica nos pisos; espaçamento até 16 px é o ritmo interno de um componente.
- **Quanto maior o valor, mais ele encolhe.** Um título de 220 px vai a ~80; um de 22 px vai a 20. Uma seção de 128 px vai a 80; um gap de 24 vai a 16.
- **Dois degraus podem colapsar no mobile** (`layout/sm` e `layout/md` em 48). Com menos espaço, a hierarquia comprime; isso é esperado.

As tabelas de cada frente estão em `taxonomia.md` (texto) e `espacamento.md` (espaço).

## Só o que está ligado responde ao modo

Um nó com valor solto, ou um texto sem estilo, fica igual nos dois modos. Antes de prometer o resultado, conte quantos nós do frame mobile estão ligados e liste os soltos como pendência.

## Verificar pelo valor resolvido

O painel de estilos do Figma pode mostrar o valor do modo padrão para uma variável ligada, mesmo dentro de um frame em outro modo (relato recorrente no fórum do Figma). Confira lendo o valor de um nó **dentro** de um frame de cada modo (`node.fontSize`, `node.paddingTop`), e com um screenshot do frame mobile.
