// Aplica o mapa de espaçamento aprovado (gap e padding do auto layout → variáveis), com modo PREVIEW.
// Rode com figma_execute (figma-console MCP) ou use_figma (Figma MCP oficial). Edite só o bloco de configuração.
//
// Modos:
//   'plano'     → SOMENTE LEITURA. Calcula o destino de cada gap e padding, conta por token, lista valores fora da escala
//                 e quantos nós mudam de verdade. Rode antes de qualquer pergunta ao usuário.
//   'preview'   → cria as coleções (se faltarem), clona o escopo numa página (ANTES | DEPOIS), liga as variáveis só no DEPOIS,
//                 marca em laranja o que muda visualmente e gera o frame '📖 Inventário de espaçamento' (legenda). O original não é tocado.
//   'aplicar'   → liga as variáveis no original (SCOPE) e leva o frame de legenda para a página 'Design System'
//                 (move o do preview, sem a seção de mudanças; se não houver preview, cria). Use DRY_RUN = true antes.
//   'arquivar'  → depois de 'aplicar': renomeia para `_deprecated/<nome>` as variáveis antigas (ARQUIVAR.prefixes) sem nenhum uso.
//   'descartar' → remove a página de preview e as coleções criadas por esta skill, se nada no arquivo usa as variáveis.
// Nunca apaga variável que a skill não criou. Nunca liga zero, negativo nem valor acima de HUGE.

// ── Configuração ────────────────────────────────────────────────────────────
const MODE = 'plano';
const DRY_RUN = false;                  // vale para 'aplicar' e 'arquivar'
const SCOPE = 'page';                   // alvo de 'aplicar': 'page' | 'selection' | 'all-pages'
const SKIP_INSTANCES = true;            // corrija no componente principal, não na instância
const PREVIEW = {
  roots: 'page',                        // 'page' (frames de topo) ou [ids de frames] (amostra)
  components: [],                       // ids de componentes a incluir
  pageName: '🔍 Preview espaçamento',
  gap: 400,
  marcarSoReapontado: false,            // azul nos nós que só trocam de variável (muito ruído; deixe false)
  maxMarcas: 600,
};
const COLLECTIONS = { primitives: 'Primitives', semantic: 'Spacing', mode: 'Default' };
const SCALE = {                         // espelha shared/espacamento.md — lista fechada
  primitives: [2, 4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 128],
  gap:     { '3xs': 2, '2xs': 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, '2xl': 48 },
  padding: { '3xs': 2, '2xs': 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, '2xl': 48 },
  layout:  { sm: 64, md: 80, lg: 96, xl: 128 },
};
const DECISOES = {
  foraDaEscala: 'encaixar',             // 'encaixar' (passo mais próximo, empate sobe) | 'solto'
  valores: {},                          // exceções por valor: { '20': 24, '10': 'solto' }
};
const ARQUIVAR = { prefixes: ['item spacing/'] };
const DOC = {
  projeto: 'meu-projeto',                 // aparece no título do frame
  frameName: '📖 Inventário de espaçamento',
  pageName: 'Design System',               // destino do frame ao aprovar ('aplicar')
  previewSection: 'Preview — mudanças',    // seção só do preview; sai do frame ao aprovar
  width: 1622,
};
const NOISE = 0.5, HUGE = 128;
// ────────────────────────────────────────────────────────────────────────────

const r2 = (n) => Math.round(n * 100) / 100;
const PROPS = ['itemSpacing', 'counterAxisSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
const roleOf = (p) => (p === 'itemSpacing' || p === 'counterAxisSpacing') ? 'gap' : 'padding';
const META_KEY = 'espacamento-skill';
const log = { modo: MODE, dryRun: DRY_RUN, avisos: [], erros: [] };

// ── Escala → token ──────────────────────────────────────────────────────────
function tokenFor(role, px) {
  for (const g of [role, 'layout']) for (const [k, v] of Object.entries(SCALE[g])) if (v === px) return `${g}/${k}`;
  return null;
}
const allPx = [...new Set([...Object.values(SCALE.gap), ...Object.values(SCALE.padding), ...Object.values(SCALE.layout)])].sort((a, b) => a - b);
function nearest(role, val) {
  let best = null;
  for (const px of allPx) {
    if (!tokenFor(role, px)) continue;
    const d = Math.abs(px - val);
    if (!best || d < best.d || (d === best.d && px > best.px)) best = { px, d };
  }
  return best.px;
}
function decide(role, val) {
  if (val === 0) return { acao: 'zero' };
  if (val < 0) return { acao: 'solto', classe: 'negativo' };
  if (val > HUGE) return { acao: 'solto', classe: 'enorme' };
  if (val < 0.5) return { acao: 'zero', classe: 'ruido' };
  if (val < 2) return { acao: 'solto', classe: 'hairline' };   // 1 px: divisória/borda, não é espaçamento
  const n2 = Math.round(val / 2) * 2, d = Math.abs(val - n2);
  const tk = d <= NOISE ? tokenFor(role, n2) : null;
  if (tk) return { acao: 'ligar', token: tk, px: n2, classe: d < 0.005 ? 'escala' : 'ruido', visual: false };
  const ov = DECISOES.valores[String(val)];
  if (ov === 'solto' || (ov == null && DECISOES.foraDaEscala === 'solto')) return { acao: 'solto', classe: 'fora-da-escala' };
  const px = typeof ov === 'number' ? ov : nearest(role, val);
  const t2 = tokenFor(role, px);
  if (!t2) return { acao: 'solto', classe: 'sem-token' };
  return { acao: 'ligar', token: t2, px, classe: 'fora-da-escala', visual: Math.abs(px - val) > NOISE };
}

// ── Nós ─────────────────────────────────────────────────────────────────────
const inInstance = (n) => { let p = n.parent; while (p && p.type !== 'PAGE') { if (p.type === 'INSTANCE') return true; p = p.parent; } return false; };
function layoutNodes(root) {
  const out = [];
  if ('layoutMode' in root && root.layoutMode !== 'NONE') out.push(root);
  if ('findAll' in root) out.push(...root.findAll(n => 'layoutMode' in n && n.layoutMode !== 'NONE'));
  return out;
}
let skippedInstances = 0;
function eligible(n) {
  if (SKIP_INSTANCES && (n.type === 'INSTANCE' || inInstance(n))) { skippedInstances++; return false; }
  return true;
}
function planFor(n) {
  const bv = n.boundVariables || {};
  const items = [];
  for (const p of PROPS) {
    if (p === 'counterAxisSpacing' && n.layoutWrap !== 'WRAP') continue;
    if (p === 'itemSpacing' && n.primaryAxisAlignItems === 'SPACE_BETWEEN') continue;
    const val = r2(n[p] || 0);
    items.push({ p, val, d: decide(roleOf(p), val), boundId: bv[p]?.id || null });
  }
  return items;
}
async function scopeRoots() {
  if (SCOPE === 'selection') return [...figma.currentPage.selection];
  if (SCOPE === 'all-pages') { await figma.loadAllPagesAsync(); return figma.root.children.flatMap(pg => pg.children.filter(c => !/^🔍 Preview/.test(pg.name))); }
  return [...figma.currentPage.children];
}
async function usageMap() {
  await figma.loadAllPagesAsync();
  const m = new Map();
  for (const pg of figma.root.children) {
    for (const n of pg.findAll(() => true)) {
      const bv = n.boundVariables; if (!bv) continue;
      for (const val of Object.values(bv)) for (const a of (Array.isArray(val) ? val : [val])) if (a?.id) m.set(a.id, (m.get(a.id) || 0) + 1);
    }
  }
  return m;
}

// ── Variáveis ───────────────────────────────────────────────────────────────
async function ensureTokens() {
  const meta = JSON.parse(figma.root.getPluginData(META_KEY) || '{"collections":[],"variables":[]}');
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const getCol = (name) => {
    let c = cols.find(x => x.name === name);
    if (!c) { c = figma.variables.createVariableCollection(name); c.renameMode(c.modes[0].modeId, COLLECTIONS.mode); meta.collections.push(c.id); log.colecoesCriadas = [...(log.colecoesCriadas || []), name]; cols.push(c); }
    return c;
  };
  const P = getCol(COLLECTIONS.primitives), S = getCol(COLLECTIONS.semantic);
  const existing = new Map();
  for (const c of [P, S]) for (const id of c.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); existing.set(v.name, v); }
  const make = (c, name, value, scopes, syntax) => {
    let v = existing.get(name);
    if (!v) { v = figma.variables.createVariable(name, c, 'FLOAT'); meta.variables.push(v.id); existing.set(name, v); log.variaveisCriadas = (log.variaveisCriadas || 0) + 1; }
    v.setValueForMode(c.modes[0].modeId, value);
    try { v.scopes = scopes; } catch (e) { log.avisos.push(`escopo ${name}: ${e.message}`); }
    try { v.setVariableCodeSyntax('WEB', syntax); } catch (e) { log.avisos.push(`codeSyntax ${name}: ${e.message}`); }
    return v;
  };
  const prim = new Map();
  for (const px of SCALE.primitives) prim.set(px, make(P, `space/${px}`, px, [], `var(--space-${px})`));
  const tokens = new Map();
  for (const role of ['gap', 'padding', 'layout'])
    for (const [k, px] of Object.entries(SCALE[role])) {
      if (!prim.has(px)) { log.erros.push(`${role}/${k}: sem primitivo space/${px}`); continue; }
      tokens.set(`${role}/${k}`, make(S, `${role}/${k}`, figma.variables.createVariableAlias(prim.get(px)), ['GAP'], `var(--${role}-${k})`));
    }
  figma.root.setPluginData(META_KEY, JSON.stringify(meta));
  return tokens;
}
async function existingTokens() {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const S = cols.find(c => c.name === COLLECTIONS.semantic);
  const m = new Map();
  if (S) for (const id of S.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); m.set(v.name, v); }
  return m;
}

// ── Núcleo: plano e ligação ─────────────────────────────────────────────────
function summarize(nodes, semIds) {
  const s = { nos: 0, ligar: 0, reapontar: 0, jaCorreto: 0, solto: {}, zero: 0, visuais: 0, porToken: {}, foraDaEscala: {} };
  for (const n of nodes) {
    s.nos++;
    for (const it of planFor(n)) {
      const d = it.d;
      if (d.acao === 'zero') { s.zero++; continue; }
      if (d.acao === 'solto') { s.solto[d.classe] = (s.solto[d.classe] || 0) + 1; if (d.classe === 'fora-da-escala') s.foraDaEscala[it.val] = (s.foraDaEscala[it.val] || 0) + 1; continue; }
      if (it.boundId && semIds.has(it.boundId)) { s.jaCorreto++; continue; }
      s.ligar++; if (it.boundId) s.reapontar++;
      s.porToken[d.token] = (s.porToken[d.token] || 0) + 1;
      if (d.visual) s.visuais++;
      if (d.classe === 'fora-da-escala') s.foraDaEscala[it.val] = (s.foraDaEscala[it.val] || 0) + 1;
    }
  }
  return s;
}
function bind(nodes, tokens, semIds) {
  const marks = [], porToken = {}, solto = {}, ch = new Map(); let bound = 0;
  for (const n of nodes) for (const it of planFor(n)) {
    const d = it.d;
    if (d.acao === 'solto') { solto[d.classe] = (solto[d.classe] || 0) + 1; continue; }
    if (d.acao !== 'ligar' || (it.boundId && semIds.has(it.boundId))) continue;
    n.setBoundVariable(it.p, tokens.get(d.token)); bound++; porToken[d.token] = (porToken[d.token] || 0) + 1;
    if (d.visual) { const k = `${it.val}|${d.token}`; const e = ch.get(k) || { from: it.val, to: d.px, token: d.token, n: 0 }; e.n++; ch.set(k, e); }
    if (d.visual || PREVIEW.marcarSoReapontado) marks.push({ n, p: it.p, from: it.val, to: d.px, visual: !!d.visual });
  }
  const changes = [...ch.values()].sort((a, b) => b.n - a.n).slice(0, 14);
  return { bound, marks, porToken, solto, changes };
}

// ── Frame de documentação (legenda do espaçamento) ──────────────────────────
// Mesmo desenho do inventário de tipografia: frame branco, título Inter Bold 56, seções com título Inter Bold 32.
// No preview ele nasce ao lado do ANTES (com a seção "Preview — mudanças"); em 'aplicar' vai para a página DOC.pageName.
const USO = {
  gap: { '3xs': 'ajuste óptico entre ícone e texto', '2xs': 'ícone ↔ texto, itens colados', xs: 'itens de lista compacta, rótulo ↔ campo', sm: 'itens de formulário, botões lado a lado', md: 'padrão entre elementos de um bloco', lg: 'entre blocos e cards', xl: 'entre grupos de conteúdo', '2xl': 'entre seções internas' },
  padding: { '3xs': 'borda óptica', '2xs': 'chip e tag (vertical), ícone com fundo', xs: 'botão e campo compactos', sm: 'botão e campo padrão', md: 'padrão de card e contêiner', lg: 'card largo, modal', xl: 'painel e bloco de seção', '2xl': 'contêiner com respiro' },
  layout: { sm: 'respiro entre seções', md: 'seção de página', lg: 'hero e seção larga', xl: 'limite superior da escala' },
};
const SOLTO_TXT = { hairline: 'divisória de 1 px (traço, não espaço)', enorme: `acima de ${HUGE} px (gutter ou cálculo)`, negativo: 'gap negativo (sobreposição)', 'fora-da-escala': 'valor mantido como exceção', 'sem-token': 'sem token na escala' };
const COR = { preto: { r: 0, g: 0, b: 0 }, cinza: { r: 0.42, g: 0.42, b: 0.42 }, branco: { r: 1, g: 1, b: 1 }, fundo: { r: 0.95, g: 0.95, b: 0.95 }, bloco: { r: 0.6, g: 0.6, b: 0.6 }, escuro: { r: 0.29, g: 0.29, b: 0.29 }, padding: { r: 1, g: 0.85, b: 0.69 }, laranja: { r: 1, g: 0.5, b: 0 } };

async function buildDoc(tokens, ctx) {
  for (const s of ['Regular', 'Bold']) await figma.loadFontAsync({ family: 'Inter', style: s });
  const solid = (c) => [{ type: 'SOLID', color: c }];
  const text = (parent, chars, o = {}) => {
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: o.bold ? 'Bold' : 'Regular' }; t.fontSize = o.size || 16;
    t.fills = solid(o.color || COR.preto); t.characters = chars; parent.appendChild(t);
    if (o.fill) { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; }
    else if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, t.height); }
    return t;
  };
  const frame = (parent, name, o = {}) => {
    const f = figma.createFrame(); f.name = name; f.fills = o.fill ? solid(o.fill) : [];
    f.layoutMode = o.dir || 'VERTICAL'; f.itemSpacing = o.gap || 0;
    f.paddingTop = f.paddingRight = f.paddingBottom = f.paddingLeft = o.pad || 0;
    f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
    if (o.align) f.counterAxisAlignItems = o.align;
    parent.appendChild(f); if (o.fillW) f.layoutSizingHorizontal = 'FILL';
    return f;
  };
  const rect = (parent, w, h, c) => { const r = figma.createRectangle(); r.resize(Math.max(w, 1), h); r.fills = solid(c); r.name = 'bloco'; parent.appendChild(r); return r; };
  const cell = (parent, w) => { const f = frame(parent, 'célula', { dir: 'HORIZONTAL', align: 'CENTER' }); f.resize(w, 10); f.layoutSizingHorizontal = 'FIXED'; f.layoutSizingVertical = 'HUG'; return f; };
  const nameCell = (parent, name, sub) => { const f = frame(parent, 'nome', { gap: 4 }); f.resize(240, 10); f.layoutSizingHorizontal = 'FIXED'; f.layoutSizingVertical = 'HUG'; text(f, name, { size: 18, bold: true, w: 240 }); text(f, sub, { size: 14, color: COR.cinza, w: 240 }); return f; };

  const root = figma.createFrame(); root.name = DOC.frameName; root.fills = solid(COR.branco);
  root.layoutMode = 'VERTICAL'; root.itemSpacing = 64; root.paddingTop = root.paddingRight = root.paddingBottom = root.paddingLeft = 80;
  root.resize(DOC.width, 100); root.primaryAxisSizingMode = 'AUTO'; root.counterAxisSizingMode = 'FIXED';
  root.setPluginData(META_KEY, 'doc');
  text(root, `Espaçamento — ${DOC.projeto}`, { size: 56, bold: true, fill: true });
  const nPrim = SCALE.primitives.length;
  text(root, `${tokens.size} tokens + ${nPrim} primitivos · gap e padding = papel/tamanho (3xs → 2xl) · layout (sm → xl) · base de 4 px`, { size: 20, color: COR.cinza, fill: true });

  const section = (title, desc) => {
    const s = frame(root, title, { gap: 24, fillW: true });
    text(s, title, { size: 32, bold: true, fill: true }); if (desc) text(s, desc, { size: 18, color: COR.cinza, fill: true });
    return frame(s, 'linhas', { gap: 20, fillW: true });
  };
  const row = (parent) => frame(parent, 'linha', { dir: 'HORIZONTAL', gap: 24, align: 'CENTER', fillW: true });

  // Primitivos
  let rs = section(`Primitivos (${nPrim})`, 'Só valores. Escondidos do picker: o auto layout usa os semânticos abaixo.');
  for (const px of SCALE.primitives) {
    const r = row(rs); nameCell(r, `space/${px}`, `var(--space-${px})`); text(r, `${px} px`, { size: 18, w: 80 });
    const c = cell(r, 300); rect(c, px, 12, COR.preto);
    const usado = ['gap', 'padding', 'layout'].flatMap(g => Object.entries(SCALE[g]).filter(([, v]) => v === px).map(([k]) => `${g}/${k}`));
    text(r, usado.length ? usado.join(' · ') : '—', { size: 16, color: COR.cinza, fill: true });
  }
  // Gap
  rs = section('Gap — entre elementos', 'Espaço entre irmãos de um auto layout. O demo abaixo usa o próprio token ligado no itemSpacing.');
  for (const [k, px] of Object.entries(SCALE.gap)) {
    const tok = tokens.get(`gap/${k}`); const r = row(rs);
    nameCell(r, `gap/${k}`, `var(--gap-${k})`); text(r, `${px} px`, { size: 18, w: 80 });
    const c = cell(r, 300); const d = frame(c, 'demo gap', { dir: 'HORIZONTAL', fill: COR.fundo, pad: 8, align: 'CENTER' });
    rect(d, 40, 40, COR.bloco); rect(d, 40, 40, COR.bloco); if (tok) d.setBoundVariable('itemSpacing', tok);
    text(r, USO.gap[k], { size: 16, color: COR.cinza, fill: true });
  }
  // Padding
  rs = section('Padding — dentro do elemento', 'Espaço entre a borda do contêiner e o conteúdo. O demo usa o token nas quatro bordas (a área laranja é o padding).');
  for (const [k, px] of Object.entries(SCALE.padding)) {
    const tok = tokens.get(`padding/${k}`); const r = row(rs);
    nameCell(r, `padding/${k}`, `var(--padding-${k})`); text(r, `${px} px`, { size: 18, w: 80 });
    const c = cell(r, 300); const d = frame(c, 'demo padding', { dir: 'HORIZONTAL', fill: COR.padding });
    rect(d, 80, 32, COR.escuro); if (tok) for (const p of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) d.setBoundVariable(p, tok);
    text(r, USO.padding[k], { size: 16, color: COR.cinza, fill: true });
  }
  // Layout
  rs = section('Layout — respiro de página', 'Serve a gap e a padding de contêineres de página.');
  for (const [k, px] of Object.entries(SCALE.layout)) {
    const r = row(rs); nameCell(r, `layout/${k}`, `var(--layout-${k})`); text(r, `${px} px`, { size: 18, w: 80 });
    const c = cell(r, 300); rect(c, px, 12, COR.preto);
    text(r, USO.layout[k], { size: 16, color: COR.cinza, fill: true });
  }
  // Exceções
  const sol = Object.entries(ctx.soltos || {});
  rs = section('Exceções — ficam sem variável', 'Zero, divisórias de 1 px, valores acima de 128 px e gaps negativos não viram token.');
  if (!sol.length) text(rs, 'Nenhuma no escopo.', { size: 18, color: COR.cinza, fill: true });
  for (const [c, n] of sol) text(rs, `${n} × ${SOLTO_TXT[c] || c}`, { size: 18, fill: true });
  // Regras
  rs = section('Como usar');
  for (const l of ['Gap é o espaço entre irmãos; padding é o espaço dentro do contêiner; layout vale para os dois em contêineres de página.', 'Use sempre o token semântico. Nunca o primitivo, nem o pixel.', 'Precisa de um valor que não está na escala? Peça um passo novo: a lista é fechada.', 'Só gap e padding do auto layout. Raio, traço, largura e altura têm coleções próprias.']) text(rs, '• ' + l, { size: 18, fill: true });
  // Só no preview
  if (ctx.preview) {
    rs = section(DOC.previewSection, `Contorno laranja (camada Mudanças) = muda visualmente. ${ctx.bound} propriedades ligadas; ${ctx.visuais} mudam o visual.`);
    if (!(ctx.changes || []).length) text(rs, 'Nenhuma mudança visual.', { size: 18, color: COR.cinza, fill: true });
    for (const c of ctx.changes || []) { const r = row(rs); text(r, `${c.from} px → ${c.to} px`, { size: 18, bold: true, color: COR.laranja, w: 200 }); text(r, c.token, { size: 18, w: 200 }); text(r, `${c.n} ${c.n === 1 ? 'propriedade' : 'propriedades'}`, { size: 16, color: COR.cinza, fill: true }); }
  }
  return root;
}

async function publishDoc(previewPage, tokens, ctx) {
  let ds = figma.root.children.find(p => p.name === DOC.pageName);
  if (!ds) { ds = figma.createPage(); ds.name = DOC.pageName; log.paginaCriada = DOC.pageName; }
  let doc = previewPage ? previewPage.findOne(n => n.type === 'FRAME' && n.name === DOC.frameName && n.getPluginData(META_KEY) === 'doc') : null;
  if (doc) { const sec = doc.findOne(n => n.name === DOC.previewSection); if (sec) sec.remove(); log.docOrigem = 'frame do preview'; }
  else { doc = await buildDoc(tokens, { ...ctx, preview: false }); log.docOrigem = 'frame novo'; }
  for (const old of [...ds.children]) if (old !== doc && old.name === DOC.frameName && old.getPluginData(META_KEY) === 'doc') old.remove();
  const others = ds.children.filter(c => c !== doc);
  ds.appendChild(doc); doc.x = others.length ? Math.max(...others.map(c => c.x + c.width)) + 200 : 0; doc.y = 0;
  return ds;
}

// ═══ MODOS ═══
if (MODE === 'plano') {
  const tk = await existingTokens(); const semIds = new Set([...tk.values()].map(v => v.id));
  const nodes = (await scopeRoots()).flatMap(layoutNodes).filter(eligible);
  log.plano = summarize(nodes, semIds); log.instanciasPuladas = skippedInstances;
  log.plano.foraDaEscala = Object.entries(log.plano.foraDaEscala).sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ valor: +v, usos: n, destino: decide('padding', +v).px ?? 'solto' }));
  return log;
}

if (MODE === 'preview') {
  const tokens = await ensureTokens(); const semIds = new Set([...tokens.values()].map(v => v.id));
  const old = figma.root.children.find(p => p.name === PREVIEW.pageName);
  if (old) { if (figma.currentPage === old) await figma.setCurrentPageAsync(figma.root.children.find(p => p !== old)); old.remove(); }   // não dá para remover a página aberta
  const page = figma.createPage(); page.name = PREVIEW.pageName;
  let roots = PREVIEW.roots === 'page' ? figma.currentPage.children.filter(c => 'children' in c) : [];
  if (PREVIEW.roots !== 'page') for (const id of PREVIEW.roots) { const n = await figma.getNodeByIdAsync(id); if (n) roots.push(n); }
  for (const id of PREVIEW.components) { const n = await figma.getNodeByIdAsync(id); if (n) roots.push(n); }
  if (!roots.length) { log.erros.push('nenhum root para o preview'); return log; }
  const minX = Math.min(...roots.map(r => r.x)), maxX = Math.max(...roots.map(r => r.x + r.width)), minY = Math.min(...roots.map(r => r.y));
  const W = maxX - minX + PREVIEW.gap;
  const afterRoots = [];
  for (const r of roots) {
    const a = r.clone(); page.appendChild(a); a.x = r.x; a.y = r.y; a.name = `ANTES · ${r.name}`;
    const b = r.clone(); page.appendChild(b); b.x = r.x + W; b.y = r.y; b.name = `DEPOIS · ${r.name}`;
    afterRoots.push(b);
  }
  const nodes = afterRoots.flatMap(layoutNodes).filter(eligible);
  const skipped = skippedInstances;
  const { bound, marks, porToken, solto, changes } = bind(nodes, tokens, semIds);
  // camada de marcações
  const layer = figma.createFrame(); layer.name = '⚑ Mudanças'; layer.fills = []; layer.clipsContent = false; layer.x = 0; layer.y = 0; layer.resize(1, 1); page.appendChild(layer);
  let marked = 0;
  for (const m of marks.slice(0, PREVIEW.maxMarcas)) {
    const bb = m.n.absoluteBoundingBox; if (!bb) continue;
    const rect = figma.createRectangle(); layer.appendChild(rect);
    rect.x = bb.x; rect.y = bb.y; rect.resize(Math.max(bb.width, 2), Math.max(bb.height, 2)); rect.fills = [];
    rect.strokes = [{ type: 'SOLID', color: m.visual ? { r: 1, g: 0.5, b: 0 } : { r: 0.1, g: 0.4, b: 1 } }]; rect.strokeWeight = 2;
    rect.name = `⚑ ${m.p} ${m.from}→${m.to}`; marked++;
  }
  // frame de legenda (documentação), ao lado do ANTES
  const visuais = marks.filter(m => m.visual).length;
  const doc = await buildDoc(tokens, { preview: true, soltos: solto, changes, bound, visuais });
  page.appendChild(doc); doc.x = minX - DOC.width - 400; doc.y = minY;
  Object.assign(log, { bound, marked, visuais, pagina: page.name, doc: DOC.frameName, instanciasPuladas: skipped, depoisNos: nodes.length, porToken, soltos: solto });
  return log;
}

if (MODE === 'aplicar') {
  const tk = DRY_RUN ? await existingTokens() : await ensureTokens(); const semIds = new Set([...tk.values()].map(v => v.id));
  const nodes = (await scopeRoots()).flatMap(layoutNodes).filter(eligible);
  const pv = figma.root.children.find(p => p.name === PREVIEW.pageName);
  if (DRY_RUN) { log.plano = summarize(nodes, semIds); log.instanciasPuladas = skippedInstances; log.docDestino = `${DOC.pageName} (${pv && pv.findOne(n => n.name === DOC.frameName) ? 'move o frame do preview' : 'cria o frame'})`; return log; }
  const { bound, solto, changes } = bind(nodes, tk, semIds);
  const ds = await publishDoc(pv, tk, { soltos: solto, changes, bound, visuais: 0 });
  Object.assign(log, { bound, nos: nodes.length, instanciasPuladas: skippedInstances, docPagina: ds.name });
  return log;
}

if (MODE === 'arquivar') {
  const use = await usageMap();
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const aliasTargets = new Set();
  const all = [];
  for (const c of cols) for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id); all.push(v);
    for (const val of Object.values(v.valuesByMode)) if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') aliasTargets.add(val.id);
  }
  const meta = JSON.parse(figma.root.getPluginData(META_KEY) || '{"variables":[]}');
  const mine = new Set(meta.variables);
  const moved = [], kept = [];
  for (const v of all) {
    if (mine.has(v.id) || v.name.startsWith('_deprecated/') || !ARQUIVAR.prefixes.some(p => v.name.startsWith(p))) continue;
    if ((use.get(v.id) || 0) > 0 || aliasTargets.has(v.id)) { kept.push(`${v.name} (em uso: ${use.get(v.id) || 0})`); continue; }
    moved.push(v.name); if (!DRY_RUN) v.name = `_deprecated/${v.name}`;
  }
  Object.assign(log, { arquivadas: moved.length, nomes: moved, mantidasEmUso: kept });
  return log;
}

if (MODE === 'descartar') {
  const page = figma.root.children.find(p => p.name === PREVIEW.pageName);
  if (page) { if (figma.currentPage === page) await figma.setCurrentPageAsync(figma.root.children.find(p => p !== page)); page.remove(); log.paginaRemovida = true; }
  const meta = JSON.parse(figma.root.getPluginData(META_KEY) || '{"collections":[],"variables":[]}');
  const use = await usageMap();
  const inUse = meta.variables.filter(id => (use.get(id) || 0) > 0);
  if (inUse.length) { log.avisos.push(`${inUse.length} variável(is) criadas pela skill estão em uso; coleções mantidas`); return log; }
  for (const id of meta.collections) { const c = await figma.variables.getVariableCollectionByIdAsync(id); if (c) { c.remove(); (log.colecoesRemovidas = log.colecoesRemovidas || []).push(c.name); } }
  figma.root.setPluginData(META_KEY, '');
  return log;
}

log.erros.push(`MODE desconhecido: ${MODE}`); return log;
