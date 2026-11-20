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
  if (v.name.startsWith('size/')) {
    const vals = c.modes.map(m => { const x = v.valuesByMode[m.modeId]; return `${m.name} ${typeof x === 'number' ? x : 'alias'}`; }).join(' · ');
    linhasVars.push(`${v.name}|${c.name}|${v.scopes.join(',')}|${vals}`);
  }
}
const isSize = v => v.name.startsWith('size/') && v.scopes.length === 1 && v.scopes[0] === 'WIDTH_HEIGHT';

// ── Varredura ───────────────────────────────────────────────────────────────
const pg = PAGE ? figma.root.children.find(p => p.name === PAGE) : figma.currentPage;
if (!pg) throw new Error(`Página não encontrada: ${PAGE}`);
await pg.loadAsync();
const roots = ROOTS ? (await Promise.all(ROOTS.map(id => figma.getNodeByIdAsync(id)))).filter(Boolean) : [pg];
const nodes = roots.flatMap(r => [r, ...(('findAll' in r) ? r.findAll(() => true) : [])]);

const PROPS = ['width', 'height', 'minWidth', 'maxWidth'];
const errados = [];
const midias = {};
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
    if (!isSize(v)) errados.push(`${n.name} (${n.id}).${k} → ${col.name} :: ${v.name} [${v.scopes.join(',')}]`);
  }
  const fills = 'fills' in n && Array.isArray(n.fills) ? n.fills : [];
  if (fills.some(f => f.type === 'IMAGE' && f.visible !== false)) {
    const w = Math.round(n.width), h = Math.round(n.height);
    const ligado = PROPS.some(k => b[k] && vars[b[k].id] && isSize(vars[b[k].id].v));
    const key = `${w}×${h} (${ratio(w, h)})|${ligado ? 'ligado' : 'solto'}`;
    midias[key] = midias[key] || { n: 0, ex: n.id };
    midias[key].n++;
  }
  if (n.type === 'FRAME' && n.layoutMode !== 'NONE' && n.layoutSizingHorizontal === 'FIXED' && n.width > 480 && !b.maxWidth && n.parent?.type === 'FRAME')
    conteiner.push(`${n.name} (${n.id}) ${Math.round(n.width)} px`);
}

return [
  `página ${pg.name} · nós ${nodes.length} · variáveis size/* ${linhasVars.length} · ligações erradas ${errados.length} · mídias ${Object.values(midias).reduce((a, x) => a + x.n, 0)}`,
  '# variáveis: nome|coleção|escopo|valor por modo',
  ...linhasVars,
  '# errados (bloqueante): nó.propriedade → coleção :: variável [escopo]',
  ...errados.slice(0, 40),
  '# mídias: tamanho (proporção)|ligado/solto|quantas|exemplo',
  ...Object.entries(midias).sort((a, b) => b[1].n - a[1].n).map(([k, x]) => `${k}|${x.n}|${x.ex}`),
  '# contêiner: frames com largura fixa > 480 px (candidatos a max-width)',
  ...conteiner.slice(0, 20),
].join('\n');
