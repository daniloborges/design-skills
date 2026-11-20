// Cria tokens de dimensão, liga nós a eles e aplica a receita "empilhar no mobile". Regras: dimensao.md e modos.md.
// Rode com figma_execute (figma-console MCP) ou use_figma (Figma MCP oficial).
//
// Rode sempre com dryRun: true primeiro. O dry-run não escreve nada e devolve o plano, uma linha por ação.
// ARGS: no figma_execute, ponha `const ARGS = { dryRun: true, ... };` antes do script; no figma-run, `--args plano.json`.
//
//   tokens   → degraus a criar: ['thumb/lg', 'avatar/md']. Valores da tabela de dimensao.md; `valores` sobrepõe:
//              { 'thumb/lg': { width: [192, 128], height: [144, 96], 'max-width': [192, 1200] } } → [Desktop, Mobile]
//   ligar    → [{ node: '<id>', token: 'thumb/lg' }]: liga largura e altura (desfaz a ligação de outra família)
//   empilhar → [{ row: '<id da linha>', media: '<id da mídia>', token: 'thumb/lg', gap: 'gap/lg', textMin: 280 }]
//              a linha quebra, a mídia preenche com proporção travada, min/max ligados ao token, o texto ganha largura mínima

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const DRY_RUN = _A.dryRun ?? true;
const COLLECTION = _A.collection ?? null;   // null = a que já tem size/*; senão a primeira com Desktop/Mobile fora do espaço; senão 'Viewport'
const DESKTOP = _A.desktop ?? 'Desktop';
const MOBILE_MODE = _A.mobileMode ?? 'Mobile';
const TOKENS = _A.tokens ?? [];
const VALORES = _A.valores ?? {};
const LIGAR = _A.ligar ?? [];
const EMPILHAR = _A.empilhar ?? [];

// Tabela de dimensao.md: [largura, altura]; mobile = um degrau abaixo no mesmo papel (o menor fica igual)
const TABELA = {
  icon: { sm: [16, 16], md: [20, 20], lg: [24, 24], xl: [32, 32] },
  avatar: { sm: [24, 24], md: [32, 32], lg: [40, 40], xl: [64, 64] },
  thumb: { sm: [64, 48], md: [128, 96], lg: [192, 144] },
  container: { sm: [640], md: [960], lg: [1280] },
};
function padrao(token) {
  const [papel, degrau] = token.split('/');
  const p = TABELA[papel];
  if (!p || !p[degrau]) return null;
  const ordem = Object.keys(p), i = ordem.indexOf(degrau);
  const mob = p[ordem[Math.max(0, i - 1)]];
  if (papel === 'container') return { 'max-width': [p[degrau][0], mob[0]] };
  return { width: [p[degrau][0], mob[0]], height: [p[degrau][1], mob[1]] };
}

// ── Coleção ─────────────────────────────────────────────────────────────────
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const hasModes = c => [DESKTOP, MOBILE_MODE].every(m => c.modes.some(x => x.name === m));
const sizeCols = new Set(), spaceCols = new Set(), existing = {};
for (const c of cols) for (const id of c.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v.name.startsWith('size/')) { sizeCols.add(c.id); existing[v.name] = v; }
  if (/^(gap|padding|layout|space)\//.test(v.name)) spaceCols.add(c.id);
}
let col = COLLECTION
  ? cols.find(c => c.id === COLLECTION || c.name === COLLECTION)
  : cols.find(c => sizeCols.has(c.id)) ?? cols.find(c => hasModes(c) && !spaceCols.has(c.id));

const plano = [], bloqueios = [];
plano.push(`coleção: ${col ? col.name : 'Viewport (seria criada)'}`);

// ── Tokens ──────────────────────────────────────────────────────────────────
const tokensNec = new Set([...TOKENS, ...LIGAR.map(l => l.token), ...EMPILHAR.map(e => e.token)]);
const defs = [];
for (const t of tokensNec) {
  const base = padrao(t);
  if (!base && !VALORES[t]) { bloqueios.push(`${t}: fora da lista fechada de dimensao.md; pergunte antes de criar`); continue; }
  const vals = { ...(base || {}), ...(VALORES[t] || {}) };
  if (EMPILHAR.some(e => e.token === t) && !vals['max-width']) vals['max-width'] = [vals.width[0], 1200];
  for (const [prop, [d, m]] of Object.entries(vals)) {
    const name = `size/${t}/${prop}`;
    const now = existing[name];
    plano.push(`${name}: Desktop ${d} · Mobile ${m}${now ? ' (já existe: atualiza)' : ''}`);
    defs.push({ name, d, m });
  }
}

// ── Ligações e receita ─────────────────────────────────────────────────────
for (const l of LIGAR) {
  const n = await figma.getNodeByIdAsync(l.node);
  if (!n) { bloqueios.push(`ligar: nó ${l.node} não encontrado`); continue; }
  const antes = ['width', 'height'].map(k => n.boundVariables?.[k] ? `${k} ligado a outra variável` : null).filter(Boolean);
  plano.push(`ligar ${n.name} (${n.id}) ${Math.round(n.width)}×${Math.round(n.height)} → size/${l.token}${antes.length ? ' · desfaz: ' + antes.join(', ') : ''}`);
}
for (const e of EMPILHAR) {
  const row = await figma.getNodeByIdAsync(e.row), media = await figma.getNodeByIdAsync(e.media);
  if (!row || !media) { bloqueios.push(`empilhar: linha ou mídia não encontrada (${e.row}, ${e.media})`); continue; }
  if (row.layoutMode !== 'HORIZONTAL') { bloqueios.push(`empilhar: ${row.name} não é auto layout horizontal`); continue; }
  plano.push(`empilhar ${row.name} (${row.id}): wrap, ${e.gap ?? 'gap/lg'} entre linhas, ${media.name} preenche 4:3 travado, min/max ← size/${e.token}, texto ≥ ${e.textMin ?? 280} px`);
}

if (DRY_RUN) return { dryRun: true, bloqueios, plano };
if (bloqueios.length) throw new Error('Há bloqueios; resolva antes de aplicar:\n' + bloqueios.join('\n'));

// ── Aplicar ─────────────────────────────────────────────────────────────────
if (!col) { col = figma.variables.createVariableCollection('Viewport'); col.renameMode(col.modes[0].modeId, DESKTOP); }
if (!col.modes.some(m => m.name === MOBILE_MODE)) col.addMode(MOBILE_MODE);
const D = col.modes.find(m => m.name === DESKTOP)?.modeId ?? col.modes[0].modeId;
const M = col.modes.find(m => m.name === MOBILE_MODE).modeId;
const V = {};
for (const { name, d, m } of defs) {
  const v = existing[name] ?? figma.variables.createVariable(name, col, 'FLOAT');
  v.scopes = ['WIDTH_HEIGHT'];
  v.setVariableCodeSyntax('WEB', `var(--${name.split('/').join('-')})`);
  v.setValueForMode(D, d);
  v.setValueForMode(M, m);
  V[name] = v;
}
for (const l of LIGAR) {
  const n = await figma.getNodeByIdAsync(l.node);
  n.setBoundVariable('width', V[`size/${l.token}/width`]);
  n.setBoundVariable('height', V[`size/${l.token}/height`]);
}
const spacing = cols.find(c => spaceCols.has(c.id) && c.variableIds.length);
const spaceVar = async name => { for (const c of cols) for (const id of c.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); if (v.name === name) return v; } };
for (const e of EMPILHAR) {
  const row = await figma.getNodeByIdAsync(e.row), media = await figma.getNodeByIdAsync(e.media);
  row.layoutWrap = 'WRAP';
  const g = await spaceVar(e.gap ?? 'gap/lg');
  if (g) row.setBoundVariable('counterAxisSpacing', g); else row.counterAxisSpacing = 24;
  media.setBoundVariable('width', null);
  media.setBoundVariable('height', null);
  media.layoutSizingHorizontal = 'FILL';
  media.setBoundVariable('minWidth', V[`size/${e.token}/width`]);
  media.setBoundVariable('maxWidth', V[`size/${e.token}/max-width`]);
  media.lockAspectRatio();
  for (const k of row.children) if (k !== media && k.layoutSizingHorizontal === 'FILL') k.minWidth = e.textMin ?? 280;
}
return { dryRun: false, colecao: col.name, variaveis: defs.length, ligados: LIGAR.length, empilhados: EMPILHAR.length, spacing: spacing?.name ?? null };
