// Inventário de espaçamento do auto layout (SOMENTE LEITURA).
// Rode com figma_execute (figma-console MCP) ou use_figma (Figma MCP oficial). Edite só o bloco de configuração.
//
// Devolve: coleções e grupos, variáveis candidatas a espaçamento (valor, escopo, usos, sinalizadores),
// variáveis usadas FORA do escopo, e a distribuição de gap/padding por nó (ligado a variável × valor solto).

// ── Configuração ────────────────────────────────────────────────────────────
const CONFIG = {
  grid: 4,                       // base da grade em px
  noise: 0.5,                    // |valor − múltiplo de 2| ≤ noise → ruído de arredondamento
  huge: 128,                     // acima disso não é token de espaçamento
  pages: 'all',                  // 'all' | 'current' | ['Page 1', …]
  skipPages: [/^🔍 Preview/],    // páginas de preview da própria skill não entram na conta
  topN: 12,
};
// ────────────────────────────────────────────────────────────────────────────

const r2 = (n) => Math.round(n * 100) / 100;
const PROPS = ['itemSpacing', 'counterAxisSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];

function classify(v) {
  if (v < 0) return { c: 'negativo' };
  if (v > CONFIG.huge) return { c: 'enorme' };
  const n2 = Math.round(v / 2) * 2;
  const d = Math.abs(v - n2);
  if (d > CONFIG.noise) return { c: 'fora-da-grade', alvo: Math.round(v / CONFIG.grid) * CONFIG.grid };
  if (v === 0) return { c: 'zero', alvo: 0 };
  if (d >= 0.005) return { c: 'ruido', alvo: n2 };
  return { c: n2 % CONFIG.grid === 0 ? 'grade' : 'meia-grade', alvo: n2 };
}

// ── Variáveis ───────────────────────────────────────────────────────────────
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const vars = new Map();      // id → { v, col }
const colSummary = [];
for (const col of collections) {
  const byType = {}, groups = {};
  for (const id of col.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    vars.set(id, { v, col });
    byType[v.resolvedType] = (byType[v.resolvedType] || 0) + 1;
    const g = v.name.includes('/') ? v.name.split('/').slice(0, -1).join('/') : '(raiz)';
    groups[g] = (groups[g] || 0) + 1;
  }
  colSummary.push({ colecao: col.name, id: col.id, modos: col.modes.map(m => m.name), total: col.variableIds.length, porTipo: byType, grupos: groups });
}
async function resolveValue(v, col) {
  let val = v.valuesByMode[col.defaultModeId], alias = null, guard = 0;
  while (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS' && guard++ < 8) {
    const t = vars.get(val.id)?.v || await figma.variables.getVariableByIdAsync(val.id);
    alias = alias ? alias + ' → ' + t.name : t.name;
    const tc = vars.get(val.id)?.col || col;
    val = t.valuesByMode[tc.defaultModeId] ?? Object.values(t.valuesByMode)[0];
  }
  return { val, alias };
}

// ── Nós ─────────────────────────────────────────────────────────────────────
await figma.loadAllPagesAsync();
const pages = figma.root.children.filter(p =>
  (CONFIG.pages === 'all' || (CONFIG.pages === 'current' ? p === figma.currentPage : CONFIG.pages.includes(p.name))) &&
  !CONFIG.skipPages.some(rx => rx.test(p.name)));

const stats = Object.fromEntries(PROPS.map(p => [p, { ligado: 0, solto: 0, zero: 0, porClasse: {}, valores: {} }]));
const useByVar = new Map();   // id → { prop: n }
const outOfScope = new Map(); // `${prop}|${varId}` → n
const pageCounts = [];
let autoLayouts = 0, instances = 0, wraps = 0, spaceBetween = 0;

for (const page of pages) {
  const nodes = page.findAll(n => 'layoutMode' in n && n.layoutMode !== 'NONE');
  pageCounts.push({ pagina: page.name, autoLayouts: nodes.length });
  for (const n of nodes) {
    autoLayouts++;
    if (n.type === 'INSTANCE') instances++;
    if (n.layoutWrap === 'WRAP') wraps++;
    if (n.primaryAxisAlignItems === 'SPACE_BETWEEN') spaceBetween++;
    const bv = n.boundVariables || {};
    for (const p of PROPS) {
      if (p === 'counterAxisSpacing' && n.layoutWrap !== 'WRAP') continue;
      if (p === 'itemSpacing' && n.primaryAxisAlignItems === 'SPACE_BETWEEN') continue; // valor irrelevante
      const s = stats[p];
      if (bv[p]) {
        s.ligado++;
        const id = bv[p].id;
        const u = useByVar.get(id) || {}; u[p] = (u[p] || 0) + 1; useByVar.set(id, u);
        const rec = vars.get(id);
        if (rec) {
          const sc = rec.v.scopes;
          if (!(sc.includes('ALL_SCOPES') || sc.includes('GAP'))) {
            const k = p + '|' + id; outOfScope.set(k, (outOfScope.get(k) || 0) + 1);
          }
        }
      } else {
        const val = r2(n[p] || 0);
        if (val === 0) { s.zero++; continue; }
        s.solto++;
        const cl = classify(val);
        s.porClasse[cl.c] = (s.porClasse[cl.c] || 0) + 1;
        const key = String(val);
        const e = s.valores[key] || (s.valores[key] = { n: 0, classe: cl.c, alvo: cl.alvo });
        e.n++;
      }
    }
  }
}

// ── Variáveis candidatas ────────────────────────────────────────────────────
const nameHint = /gap|padding|space|spacing|inset|stack/i;
const notSpace = /letter|paragraph|line height|font|kerning/i;   // 'letter spacing' não é espaçamento de layout
const cand = [];
const others = {};
const valueIndex = {};
for (const [id, { v, col }] of vars) {
  if (v.resolvedType !== 'FLOAT') continue;
  const sc = v.scopes;
  const used = useByVar.get(id);
  const isCand = sc.includes('GAP') || sc.includes('ALL_SCOPES') || !!used || (nameHint.test(v.name) && !notSpace.test(v.name));
  if (!isCand) { const g = v.name.split('/')[0]; others[g] = (others[g] || 0) + 1; continue; }
  const { val, alias } = await resolveValue(v, col);
  const num = typeof val === 'number' ? r2(val) : null;
  const flags = [];
  if (num != null) {
    const cl = classify(num);
    if (cl.c === 'ruido') flags.push('ruido');
    if (cl.c === 'negativo') flags.push('negativo');
    if (cl.c === 'enorme') flags.push('enorme');
    if (cl.c === 'fora-da-grade') flags.push('fora-da-grade');
    if (cl.c === 'meia-grade') flags.push('meia-grade');
  }
  if (sc.includes('ALL_SCOPES')) flags.push('escopo-amplo');
  if (!used) flags.push('sem-uso');
  if (/_\d{2,}$/.test(v.name)) flags.push('nome-com-decimal');
  if (!v.codeSyntax || !Object.keys(v.codeSyntax).length) flags.push('sem-codeSyntax');
  cand.push({ id, nome: v.name, colecao: col.name, valor: num, alias, escopos: sc, usos: used || {}, flags });
  if (num != null) (valueIndex[num] = valueIndex[num] || []).push(v.name);
}
for (const c of cand) if (c.valor != null && valueIndex[c.valor].length > 1) c.flags.push('valor-duplicado');

const violacoes = [];
for (const [k, n] of outOfScope) {
  const [prop, id] = k.split('|');
  const v = vars.get(id).v;
  violacoes.push({ prop, variavel: v.name, escopos: v.scopes, valor: r2(Object.values(v.valuesByMode)[0]), nos: n });
}

const top = (o) => Object.entries(o).sort((a, b) => b[1].n - a[1].n).slice(0, CONFIG.topN)
  .map(([val, e]) => ({ valor: +val, n: e.n, classe: e.classe, alvo: e.alvo }));
const nodeSummary = {};
for (const p of PROPS) {
  const s = stats[p];
  nodeSummary[p] = { ligado: s.ligado, solto: s.solto, zero: s.zero, porClasse: s.porClasse, distintos: Object.keys(s.valores).length, top: top(s.valores) };
}

return {
  config: { grid: CONFIG.grid, noise: CONFIG.noise, huge: CONFIG.huge, paginas: pages.map(p => p.name) },
  colecoes: colSummary,
  autoLayouts, instancias: instances, comWrap: wraps, comSpaceBetween: spaceBetween, porPagina: pageCounts,
  variaveisCandidatas: cand,
  outrasFloat: others,
  foraDeEscopo: violacoes,
  nos: nodeSummary,
};
