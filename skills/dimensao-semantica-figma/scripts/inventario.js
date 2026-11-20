// Inventário de dimensões — SOMENTE LEITURA.
// Rode com figma_execute (figma-console MCP) ou use_figma (Figma MCP oficial). Regras: dimensao.md.
// Devolve, em linhas compactas:
//   variáveis → as `size/*` que já existem, com coleção, escopo e valor por modo
//   errados   → largura/altura/min/max ligadas a uma variável de outra família (bloqueante)
//   mídias    → nós com imagem, agrupados por tamanho e proporção, ligados ou soltos, com um id de exemplo
//   contêiner → frames de conteúdo com largura fixa acima de 480 px (candidatos a max-width)
//
// ARGS: no figma_execute, ponha `const ARGS = { page: 'Home' };` antes do script; no figma-run, `--set page=Home`.

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const PAGE = _A.page ?? null;      // nome da página; null = a página aberta
const ROOTS = _A.roots ?? null;    // ids de nós para limitar a varredura; null = a página inteira

// ── Variáveis ───────────────────────────────────────────────────────────────
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = {};
const linhasVars = [];
for (const c of cols) for (const id of c.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  vars[v.id] = { v, col: c };
  // Toda variável de largura/altura, com nome size/* ou não: as paralelas (`mobile-max-width`, `max=1280`) aparecem aqui
  if (v.resolvedType === 'FLOAT' && (v.name.startsWith('size/') || v.scopes.includes('WIDTH_HEIGHT'))) {
    const vals = c.modes.map(m => { const x = v.valuesByMode[m.modeId]; return `${m.name} ${typeof x === 'number' ? x : 'alias'}`; }).join(' · ');
    linhasVars.push(`${v.name}|${c.name}|${v.scopes.join(',')}|${vals}`);
  }
}
// Família pelo escopo: WIDTH_HEIGHT é dimensão; ALL_SCOPES é alerta; qualquer outro escopo (raio, espaço, fonte) é bloqueante
const familia = v => (v.scopes.includes('WIDTH_HEIGHT') ? (v.name.startsWith('size/') ? 'ok' : 'nome') : v.scopes.includes('ALL_SCOPES') ? 'amplo' : 'errado');
const isSize = v => familia(v) === 'ok' || familia(v) === 'nome';

// ── Varredura ───────────────────────────────────────────────────────────────
const pg = PAGE ? figma.root.children.find(p => p.name === PAGE) : figma.currentPage;
if (!pg) throw new Error(`Página não encontrada: ${PAGE}`);
await pg.loadAsync();
const roots = ROOTS ? (await Promise.all(ROOTS.map(id => figma.getNodeByIdAsync(id)))).filter(Boolean) : [pg];
const nodes = roots.flatMap(r => [r, ...(('findAll' in r) ? r.findAll(() => true) : [])]);

const PROPS = ['width', 'height', 'minWidth', 'maxWidth'];
const errados = [], amplos = [], foraDoNome = new Set();
const midias = {};
// O título ao lado de uma mídia: o maior texto entre os irmãos da mídia e os filhos deles (dado da regra de harmonia)
const estilos = Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s => [s.id, s.name]));
function tituloAoLado(n) {
  const row = n.parent;
  if (!row || !('children' in row)) return null;
  const textos = row.children.filter(k => k !== n).flatMap(k => (k.type === 'TEXT' ? [k] : 'findAll' in k ? k.findAll(x => x.type === 'TEXT') : []));
  const t = textos.filter(x => typeof x.fontSize === 'number').sort((a, b) => b.fontSize - a.fontSize)[0];
  if (!t) return null;
  const lh = t.lineHeight.unit === 'PIXELS' ? t.lineHeight.value : t.fontSize * 1.2;
  return `${estilos[t.textStyleId] ?? 'sem estilo'} ${t.fontSize}/${Math.round(lh * 10) / 10} · ${Math.round(t.height / lh)} linhas`;
}
const conteiner = [];
const ratio = (w, h) => {
  const r = w / h;
  for (const [n, x] of [['1:1', 1], ['4:3', 4 / 3], ['3:4', 3 / 4], ['16:9', 16 / 9], ['3:2', 3 / 2]]) if (Math.abs(r - x) < 0.02) return n;
  return r.toFixed(2);
};
for (const n of nodes) {
  const b = n.boundVariables || {};
  for (const k of PROPS) {
    const id = b[k]?.id;
    if (!id || !vars[id]) continue;
    const { v, col } = vars[id];
    const linha = `${n.name} (${n.id}).${k} → ${col.name} :: ${v.name} [${v.scopes.join(',')}]`;
    const f = familia(v);
    if (f === 'errado') errados.push(linha);
    else if (f === 'amplo') amplos.push(linha);
    else if (f === 'nome') foraDoNome.add(v.name);
  }
  const fills = 'fills' in n && Array.isArray(n.fills) ? n.fills : [];
  if (fills.some(f => f.type === 'IMAGE' && f.visible !== false)) {
    const w = Math.round(n.width), h = Math.round(n.height);
    const ligado = PROPS.some(k => b[k] && vars[b[k].id] && isSize(vars[b[k].id].v));
    const key = `${w}×${h} (${ratio(w, h)})|${ligado ? 'ligado' : 'solto'}`;
    midias[key] = midias[key] || { n: 0, ex: n.id, titulo: tituloAoLado(n) };
    midias[key].n++;
  }
  if (n.type === 'FRAME' && n.layoutMode !== 'NONE' && n.layoutSizingHorizontal === 'FIXED' && n.width > 480 && !b.maxWidth && n.parent?.type === 'FRAME')
    conteiner.push(`${n.name} (${n.id}) ${Math.round(n.width)} px`);
}

const corta = (arr, n) => (arr.length > n ? [...arr.slice(0, n), `… +${arr.length - n} omitidos`] : arr);
const escopo = ROOTS ? `${roots.map(r => r.name).join(', ')} (na página ${pg.name})` : `página ${pg.name}`;
const nMidias = Object.values(midias).reduce((a, x) => a + x.n, 0);
return [
  `${escopo} · nós ${nodes.length} · variáveis de dimensão ${linhasVars.length} · erradas ${errados.length} · amplas ${amplos.length} · mídias ${nMidias}`,
  ...(nMidias ? [] : ['nenhuma mídia (nó com imagem) no escopo: confira o alvo com o usuário antes de propor']),
  '# variáveis de dimensão: nome|coleção|escopo|valor por modo',
  ...linhasVars,
  ...(foraDoNome.size ? [`# fora do padrão de nome (escopo certo, nome sem size/<papel>/<degrau>): ${[...foraDoNome].join(', ')}`] : []),
  '# erradas (bloqueante: escopo de raio, espaço ou fonte): nó.propriedade → coleção :: variável [escopo]',
  ...corta(errados, 40),
  '# amplas (alerta: ALL_SCOPES): nó.propriedade → coleção :: variável',
  ...corta(amplos, 20),
  '# mídias: tamanho (proporção)|ligado/solto|quantas|exemplo|título ao lado',
  ...Object.entries(midias).sort((a, b) => b[1].n - a[1].n).map(([k, x]) => `${k}|${x.n}|${x.ex}|${x.titulo ?? '—'}`),
  '# contêiner: frames com largura fixa > 480 px (candidatos a max-width)',
  ...corta(conteiner, 20),
].join('\n');
