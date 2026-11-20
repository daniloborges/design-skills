// Cria ou atualiza o conjunto de estilos de um componente (`<prefixo>-<parte>`) no arquivo de destino.
// Regras: "Camada de componente" em taxonomia.md. Rode no DESTINO, com figma_execute (fileKey do destino) ou use_figma.
//
// Rode sempre com dryRun: true primeiro. O dry-run não escreve nada e devolve, por estilo: spec, papel base,
// se liga às variáveis type/* do papel e o que muda num estilo que já existe.
// ARGS: no figma_execute, ponha `const ARGS = { dryRun: true, prefixo: 'da:chat', estilos: [...] };` antes do script;
// no figma-run, `--args plano.json`.
//
// Cada item de `estilos`:
//   { parte: 'answer', familia: 'Fraunces', estilo: 'Regular', tamanho: 18, entrelinha: 28, tracking: 0,
//     caixa: 'ORIGINAL', base: 'body/lg' | null, origem: 'body/lg (SF Pro 17/24)', html: 'p', cor: 'ink' }
// `base` é o papel da taxonomia de que o estilo deriva; com tamanho e entrelinha iguais aos do estilo do papel,
// o estilo liga às variáveis type/<base>/font-size e line-height. `cor` é o nome de uma variável de cor do destino.

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const DRY_RUN = _A.dryRun ?? true;
const PREFIXO = _A.prefixo;
const ESTILOS = _A.estilos ?? [];
if (!PREFIXO || !/^[a-z0-9-]+:[a-z0-9-]+$/.test(PREFIXO)) throw new Error('prefixo no formato <marca>:<componente>, ex. da:chat');

// ── Contexto do destino ────────────────────────────────────────────────────
const existentes = Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s => [s.name, s]));
const vars = {}, cores = new Set();
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) for (const id of c.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v.name.startsWith('type/')) vars[v.name] = v;
  if (v.resolvedType === 'COLOR') cores.add(v.name);
}
const disponiveis = new Set((await figma.listAvailableFontsAsync()).map(f => `${f.fontName.family}|${f.fontName.style}`));

const plano = [], bloqueios = [];
for (const e of ESTILOS) {
  const nome = `${PREFIXO}-${e.parte}`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.parte)) bloqueios.push(`${nome}: parte fora do kebab-case`);
  if (!disponiveis.has(`${e.familia}|${e.estilo}`)) bloqueios.push(`${nome}: fonte ${e.familia} ${e.estilo} não está disponível`);
  if (e.tamanho < 11) bloqueios.push(`${nome}: ${e.tamanho} px abaixo do piso de 11`);
  if (e.html === 'textarea' || e.html === 'input') { if (e.tamanho < 16) bloqueios.push(`${nome}: campo de digitação com ${e.tamanho} px; o iOS dá zoom abaixo de 16`); }
  if (e.cor && !cores.has(e.cor)) plano.push(`aviso: ${nome} cita a cor "${e.cor}", que não é variável deste arquivo`);
  const baseStyle = e.base ? existentes[e.base] : null;
  const liga = !!(baseStyle && baseStyle.fontSize === e.tamanho && baseStyle.lineHeight.unit === 'PIXELS' && Math.abs(baseStyle.lineHeight.value - e.entrelinha) < 0.01
    && vars[`type/${e.base}/font-size`]);
  if (e.base && !baseStyle) plano.push(`aviso: ${nome} aponta para o papel ${e.base}, que não existe como estilo neste arquivo`);
  const antes = existentes[nome];
  const mudou = antes ? [
    antes.fontName.family !== e.familia || antes.fontName.style !== e.estilo ? `fonte ${antes.fontName.family} ${antes.fontName.style}` : null,
    antes.fontSize !== e.tamanho ? `tamanho ${antes.fontSize}` : null,
  ].filter(Boolean) : [];
  plano.push(`${nome}: ${e.familia} ${e.estilo} ${e.tamanho}/${e.entrelinha}${e.tracking ? ` · ${e.tracking}px` : ''}${e.caixa === 'UPPER' ? ' · caixa alta' : ''}`
    + ` · base ${e.base ?? 'própria'}${liga ? ' ← type/' + e.base : ''} · ${antes ? (mudou.length ? 'atualiza (era ' + mudou.join(', ') + ')' : 'já existe') : 'novo'}`);
  e._liga = liga;
}

if (DRY_RUN) return { dryRun: true, bloqueios, plano };
if (bloqueios.length) throw new Error('Há bloqueios; resolva antes de aplicar:\n' + bloqueios.join('\n'));

// ── Aplicar ─────────────────────────────────────────────────────────────────
const feitos = [];
for (const e of ESTILOS) {
  await figma.loadFontAsync({ family: e.familia, style: e.estilo });
  const nome = `${PREFIXO}-${e.parte}`;
  const s = existentes[nome] ?? figma.createTextStyle();
  s.name = nome;
  s.fontName = { family: e.familia, style: e.estilo };
  s.fontSize = e.tamanho;
  s.lineHeight = { unit: 'PIXELS', value: e.entrelinha };
  s.letterSpacing = { unit: 'PIXELS', value: e.tracking ?? 0 };
  s.textCase = e.caixa ?? 'ORIGINAL';
  s.description = `De-para · ${e.origem ?? '—'} → ${e.base ?? 'próprio do componente'} · HTML ${e.html ?? '—'} · cor ${e.cor ?? '—'}`;
  if (e._liga) {
    s.setBoundVariable('fontSize', vars[`type/${e.base}/font-size`]);
    if (vars[`type/${e.base}/line-height`]) s.setBoundVariable('lineHeight', vars[`type/${e.base}/line-height`]);
  }
  feitos.push(`${nome}${e._liga ? ' ← type/' + e.base : ''}`);
}
return { dryRun: false, estilos: feitos.length, feitos };
