// Aplica o mapa semântico aprovado, com modo PREVIEW.
// Rode com figma_execute (figma-console MCP) ou use_figma (Figma MCP oficial).
//
// Modos:
//   'preview'   → cria estilos `novo/<nome>`, clona o escopo numa página de preview (ANTES | DEPOIS),
//                 aplica os estilos novos só no DEPOIS e monta uma legenda. O original não é tocado.
//   'promover'  → aprovado o preview: `novo/<nome>` vira `<nome>` (ou atualiza o estilo `reuse`),
//                 aplica no original, marca os estilos de origem como `_deprecated/` e remove a página de preview.
//   'aplicar'   → sem preview: cria ou reusa `<nome>` e aplica direto no original.
//   'descartar' → remove a página de preview e todos os estilos `novo/*`.
//   'ordenar'   → só reordena a lista de estilos (também roda no fim de 'promover' e 'aplicar'). Respeita DRY_RUN.
//                 Ordem: papel (display → heading → lead → body → label → caption → eyebrow → code → legal → big-number → index),
//                 tamanho (2xl → 2xs), base → -emphasis → -strong; depois novo/*, depois fora da taxonomia, por último _deprecated/*.
// Nunca apaga estilos que não foram criados por este script. Use DRY_RUN = true em 'promover' e 'aplicar' antes de valer.

// ── Configuração ────────────────────────────────────────────────────────────
// Com figma-run, tudo abaixo pode vir de ARGS (--args plano.json): { mode, dryRun, scope, skipInstances, preview, inventory, plan }
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const MODE = _A.mode ?? 'preview';
const DRY_RUN = _A.dryRun ?? false;                 // vale para 'promover', 'aplicar' e 'ordenar'
const SCOPE = _A.scope ?? 'page';                  // alvo de 'promover'/'aplicar': 'page' | 'selection' | 'all-pages'
const SKIP_INSTANCES = _A.skipInstances ?? true;           // em 'promover'/'aplicar': textos em instâncias são corrigidos no componente principal
const PREVIEW = _A.preview ?? {
  roots: 'page',                       // 'page' (todos os frames da página) ou [ids de frames] (amostra do inventário)
  components: [],                      // ids de componentes/component sets para incluir no preview
  pageName: '🔍 Preview tipografia',
  beforeAfter: true,                   // clona duas vezes: ANTES (intocado) e DEPOIS (com estilos novos)
  gap: 400,
};
const INVENTORY = _A.inventory ?? { pageName: '📖 Tipografia', title: 'Tipografia' };   // promover/aplicar recriam esta página de referência
const PLAN = _A.plan ?? {
  targets: [
    // {
    //   name: 'heading/xl',
    //   description: 'HTML: h2 · faixa 72–96 px (escala do projeto)',
    //   spec: { fontName: { family: 'Fraunces', style: 'Light', variationSettings: { wght: 360, opsz: 84 } }, fontSize: 84,
    //           lineHeight: { unit: 'PIXELS', value: 84 }, letterSpacing: { unit: 'PIXELS', value: -1.85 }, textCase: 'ORIGINAL' },
    //   from: { styles: ['S:…,'], specs: ['Fraunces|360|84|84px|-1.85px|ORIGINAL'] },  // chaves do inventario.js
    //   reuse: 'S:…,',   // opcional: renomeia este estilo em vez de criar outro (mantém a chave → bibliotecas publicadas não quebram)
    // },
    // Atalho: spec: { copyFrom: '<chave do inventário>', fontSize: 14, lineHeight: {...} } copia fontName (com variationSettings),
    // tamanho, entrelinha, tracking e caixa de um trecho real daquele grupo; os campos informados sobrescrevem.
  ],
  deprecateOthers: false,   // true: no promover/aplicar, todo estilo local fora do mapa vira _deprecated/ (limpeza completa)
};
// ────────────────────────────────────────────────────────────────────────────

const r = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const NAME_WEIGHT = { thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900 };
const nameWeight = (style) => NAME_WEIGHT[style.toLowerCase().replace(/italic|oblique|\s|-/g, '')] ?? 400;
const isItalic = (style) => /italic|oblique/i.test(style);
const realWeight = (fontName, fontWeight) => fontName.variationSettings?.wght ?? fontWeight ?? nameWeight(fontName.style);
const fmtLH = (lh) => lh.unit === 'AUTO' ? 'auto' : lh.unit === 'PERCENT' ? `${r(lh.value)}%` : `${r(lh.value)}px`;
const fmtLS = (ls, size) => ls.unit === 'PERCENT' ? `${r(size * ls.value / 100)}px` : `${r(ls.value)}px`;
const specKey = (s, w) => [s.fontName.family, `${Math.round(w)}${isItalic(s.fontName.style) ? 'i' : ''}`, r(s.fontSize, 1), fmtLH(s.lineHeight), fmtLS(s.letterSpacing, s.fontSize), s.textCase || 'ORIGINAL'].join('|');

const log = { mode: MODE, dryRun: DRY_RUN, styles: [], deprecated: [], applied: 0, nodesTouched: 0, skippedInstances: 0, skippedMissingFont: 0, errors: [] };
const loaded = new Set();
async function load(fn) { const k = fn.family + '|' + fn.style; if (!loaded.has(k)) { await figma.loadFontAsync({ family: fn.family, style: fn.style }); loaded.add(k); } }
async function setSpec(style, t) {
  if (t.spec.fontName) { await load(t.spec.fontName); style.fontName = t.spec.fontName; }
  if (t.spec.fontSize != null) style.fontSize = t.spec.fontSize;
  if (t.spec.lineHeight) style.lineHeight = t.spec.lineHeight;
  if (t.spec.letterSpacing) style.letterSpacing = t.spec.letterSpacing;
  if (t.spec.textCase) style.textCase = t.spec.textCase;
  if (t.description != null) style.description = t.description;
}

let styles = await figma.getLocalTextStylesAsync();
const byId = new Map(styles.map(s => [s.id, s]));
const byName = (n) => styles.find(s => s.name === n);
const fromStyleIds = new Set(PLAN.targets.flatMap(t => t.from?.styles || []));

// spec.copyFrom → copia de um trecho real do grupo (preserva variationSettings de fontes variáveis)
const needKeys = new Set(PLAN.targets.map(t => t.spec?.copyFrom).filter(Boolean));
if (needKeys.size && MODE !== 'descartar' && MODE !== 'ordenar') {
  await figma.loadAllPagesAsync();
  const found = new Map();
  for (const tx of figma.root.findAllWithCriteria({ types: ['TEXT'] })) {
    if (found.size === needKeys.size) break;
    for (const sg of tx.getStyledTextSegments(['fontName', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'textCase'])) {
      const k = specKey(sg, realWeight(sg.fontName, sg.fontWeight));
      if (needKeys.has(k) && !found.has(k)) found.set(k, sg);
    }
  }
  for (const t of PLAN.targets) {
    const k = t.spec?.copyFrom; if (!k) continue;
    const sg = found.get(k); if (!sg) { log.errors.push(`copyFrom: grupo "${k}" não encontrado`); continue; }
    const { copyFrom, ...over } = t.spec;
    t.spec = { fontName: sg.fontName, fontSize: sg.fontSize, lineHeight: sg.lineHeight, letterSpacing: sg.letterSpacing, textCase: sg.textCase, ...over };
    if (over.fontWeight != null) { t.spec.fontName = { ...sg.fontName, variationSettings: { ...(sg.fontName.variationSettings || {}), wght: over.fontWeight } }; delete t.spec.fontWeight; }
  }
}

// Validação da lista fechada (espelha taxonomia.md)
const VALID = /^(?:[^/]+\/)?(display\/(xl|lg|md)|heading\/(xl|lg|md|sm|xs|2xs)|lead\/(lg|md)|body\/(lg|md|sm)|label\/(md|sm)|caption\/(md|sm)|eyebrow\/(md|sm)|code\/(md|sm)|legal\/md|big-number\/(lg|md)|index\/md)(-(emphasis|strong))?$/;
for (const t of PLAN.targets) if (!VALID.test(t.name)) log.errors.push(`nome fora da taxonomia: "${t.name}"`);
if (log.errors.length && MODE !== 'descartar') return log;

// Mapa origem → destino (preenchido com os estilos de destino de cada modo)
function buildMaps(targetStyle) {
  const byStyle = new Map(), bySpec = new Map();
  for (const t of PLAN.targets) {
    const dst = targetStyle.get(t.name); if (!dst) continue;
    for (const id of t.from?.styles || []) byStyle.set(id, dst);
    for (const k of t.from?.specs || []) bySpec.set(k, dst);
    if (t.reuse) byStyle.set(t.reuse, dst);
  }
  return { byStyle, bySpec };
}
async function applyTo(texts, maps, { skipInstances, dry }) {
  for (const tx of texts) {
    if (skipInstances && tx.id.startsWith('I')) { log.skippedInstances++; continue; }
    const segs = tx.getStyledTextSegments(['fontName', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'textCase', 'textStyleId']);
    let touched = false;
    for (const s of segs) {
      const dst = maps.bySpec.get(specKey(s, realWeight(s.fontName, s.fontWeight))) || (s.textStyleId && maps.byStyle.get(s.textStyleId));  // spec real primeiro: um estilo antigo pode cobrir vários papéis
      if (!dst || dst.id === s.textStyleId) continue;
      if (tx.hasMissingFont) { log.skippedMissingFont++; break; }
      touched = true; log.applied++;
      const lhv = (lh) => lh.unit === 'PIXELS' ? lh.value : lh.unit === 'PERCENT' ? lh.value * s.fontSize / 100 : 1.2 * s.fontSize;
      const visual = Math.abs(s.fontSize - dst.fontSize) >= 0.5 || Math.abs(lhv(s.lineHeight) - lhv(dst.lineHeight || s.lineHeight)) >= 0.5 || Math.abs(realWeight(s.fontName, s.fontWeight) - realWeight(dst.fontName)) >= 50;
      const prev = touchedNodes.get(tx); touchedNodes.set(tx, prev || visual);
      if (!dry) { try { await load(s.fontName); await load(dst.fontName); await tx.setRangeTextStyleIdAsync(s.start, s.end, dst.id); } catch (e) { log.errors.push(`${tx.id}: ${e.message}`); } }
    }
    if (touched) log.nodesTouched++;
  }
}
const touchedNodes = new Map(); // nó → true se o visual muda (tamanho/entrelinha)
function markChanges(page) {
  const marks = [];
  for (const [n, visual] of touchedNodes) {
    const b = n.absoluteBoundingBox; if (!b) continue;
    const rc = figma.createRectangle(); rc.name = visual ? 'muda visual' : 'só estilo';
    rc.x = b.x - 4; rc.y = b.y - 4; rc.resize(Math.max(b.width + 8, 1), Math.max(b.height + 8, 1));
    rc.fills = []; rc.strokes = [{ type: 'SOLID', color: visual ? { r: 0.96, g: 0.45, b: 0.05 } : { r: 0.15, g: 0.45, b: 0.95 } }]; rc.strokeWeight = visual ? 4 : 2;
    page.appendChild(rc); marks.push(rc);
  }
  if (marks.length) { const g = figma.group(marks, page); g.name = '⚑ Mudanças (azul = só estilo · laranja = muda visual)'; g.locked = true; }
  log.marked = { soEstilo: [...touchedNodes.values()].filter(v => !v).length, mudaVisual: [...touchedNodes.values()].filter(Boolean).length };
}
function textsIn(nodes) { const out = []; for (const n of nodes) { if (n.type === 'TEXT') out.push(n); if ('findAllWithCriteria' in n) out.push(...n.findAllWithCriteria({ types: ['TEXT'] })); } return out; }
async function scopeRoots() {
  if (SCOPE === 'all-pages') { await figma.loadAllPagesAsync(); return figma.root.children; }
  if (SCOPE === 'selection') return figma.currentPage.selection;
  return [figma.currentPage];
}
function deprecate(dry) {
  if (PLAN.deprecateOthers) for (const st of styles) if (!st.name.startsWith('novo/') && !PLAN.targets.some(t => t.name === st.name || t.reuse === st.id)) fromStyleIds.add(st.id);
  for (const id of fromStyleIds) {
    const s = byId.get(id); if (!s || s.name.startsWith('_deprecated/') || PLAN.targets.some(t => t.reuse === id)) continue;
    log.deprecated.push(s.name);
    if (!dry) s.name = `_deprecated/${s.name}`;
  }
}

// ── ordenação da lista de estilos ───────────────────────────────────────────
const ROLE_ORDER = ['display', 'heading', 'lead', 'body', 'label', 'caption', 'eyebrow', 'code', 'legal', 'big-number', 'index'];
const SIZE_ORDER = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs', '2xs'];
const MOD_ORDER = ['', 'emphasis', 'strong'];
function orderKey(name) {
  if (name.startsWith('_deprecated/')) return [3, 0, 0, 0, name];
  const isNovo = name.startsWith('novo/');
  const m = /(?:^|\/)(display|heading|lead|body|label|caption|eyebrow|code|legal|big-number|index)\/([0-9]*x?[a-z]+)(?:-(.+))?$/.exec(name);
  if (!m) return [2, 0, 0, 0, name];
  const mi = MOD_ORDER.indexOf(m[3] || '');
  return [isNovo ? 1 : 0, ROLE_ORDER.indexOf(m[1]), SIZE_ORDER.indexOf(m[2]) < 0 ? 99 : SIZE_ORDER.indexOf(m[2]), mi < 0 ? 9 : mi, name];
}
async function ordenar(dry) {
  // O Figma só reordena estilos dentro da mesma pasta (moveLocalTextStyleAfter) e pastas entre si (moveLocalTextFolderAfter).
  const list = await figma.getLocalTextStylesAsync();
  const folderOf = n => n.split('/').slice(0, -1).join('/');
  const leafKey = n => { const m = /^([0-9]*x?[a-z]+)(?:-(.+))?$/.exec(n.split('/').pop()); if (!m) return [99, 9, n]; const si = SIZE_ORDER.indexOf(m[1]), mi = MOD_ORDER.indexOf(m[2] || ''); return [si < 0 ? 99 : si, mi < 0 ? 9 : mi, n]; };
  const folders = new Map();
  for (const s of list) { const f = folderOf(s.name); if (!folders.has(f)) folders.set(f, []); folders.get(f).push(s); }
  let moved = 0;
  for (const arr of folders.values()) {
    const sorted = [...arr].sort((a, b) => { const ka = leafKey(a.name), kb = leafKey(b.name); return ka[0] - kb[0] || ka[1] - kb[1] || ka[2].localeCompare(kb[2]); });
    moved += sorted.filter((s, i) => arr[i] !== s).length;
    if (!dry) for (let i = 1; i < sorted.length; i++) figma.moveLocalTextStyleAfter(sorted[i], sorted[i - 1]);
  }
  const rank = (top) => top === '_deprecated' ? 99 : top === 'novo' ? 60 : ROLE_ORDER.indexOf(top) < 0 ? 50 : ROLE_ORDER.indexOf(top);
  const tops = [...new Set(list.filter(s => s.name.includes('/')).map(s => s.name.split('/')[0]))].sort((a, b) => rank(a) - rank(b));
  if (!dry && tops.length) { try { figma.moveLocalTextFolderAfter(tops[0], null); for (let i = 1; i < tops.length; i++) figma.moveLocalTextFolderAfter(tops[i], tops[i - 1]); } catch (e) { log.errors.push(`ordenar pastas: ${e.message}`); } }
  // com prefixo de marca (acme/heading/xl) as pastas de papel ficam um nível abaixo: ordenar dentro da marca
  if (!dry) for (const top of tops) {
    const subs = [...new Set(list.filter(s => s.name.startsWith(top + '/') && s.name.split('/').length > 2).map(s => s.name.split('/').slice(0, 2).join('/')))].sort((a, b) => rank(a.split('/')[1]) - rank(b.split('/')[1]));
    try { for (let i = 1; i < subs.length; i++) figma.moveLocalTextFolderAfter(subs[i], subs[i - 1]); } catch (e) {}
  }
  const after = dry ? list : await figma.getLocalTextStylesAsync();
  log.ordenacao = { fora_de_ordem: moved, pastas: tops, ordem: after.map(s => s.name).filter(n => !n.startsWith('_deprecated/')) };
}
if (MODE === 'ordenar') { await ordenar(DRY_RUN); return log; }

// ── Inventário de tipografia (legenda) ──────────────────────────────────────
// Mesmo layout de scripts/inventario-tipografia.js (fontes → estilos por papel), em forma de função.
// Desempenho: nós nascem dentro do pai e o auto layout é ligado só no fim (ver inventario-tipografia.js).
const ROLE_INFO = {
  display: ['Display', 'Textos de impacto: hero e chamadas finais. Poucos por página. h1/h2, ou p decorativo.'],
  heading: ['Heading', 'Títulos de seção, bloco e card. Sempre h1–h6; o nível vem da estrutura, não do tamanho.'],
  lead: ['Lead', 'Parágrafos de abertura e bio, maiores que o corpo. Sempre p.'],
  body: ['Body', 'Texto corrido, descrições e listas. p, li, dd.'],
  label: ['Label', 'Navegação, botões, tags e chips: rótulos curtos, geralmente interativos. Mínimo 12 px.'],
  caption: ['Caption', 'Legendas e notas abaixo de métricas ou mídia. figcaption, small.'],
  eyebrow: ['Eyebrow', 'Kicker em caixa alta acima de um título. Não é título: p ou hgroup.'],
  code: ['Code', 'Datas, idioma e dados técnicos em fonte mono. code, time.'],
  legal: ['Legal', 'Termos, contratos e consentimento. Mínimo 16 px (CDC).'],
  'big-number': ['Big number', 'Números de destaque (métricas, KPIs). Não é título: dd/p com o rótulo em dt.'],
  index: ['Index', 'Numeração editorial "(01)". Decorativa: span aria-hidden.'],
};
async function buildInventory(page, entries, title, x, y) {
  // entries: [{ name, style, description, uses }]
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  const GREY = { r: 0.42, g: 0.42, b: 0.42 };
  const txt = (parent, chars, size, bold, color) => { const t = figma.createText(); parent.appendChild(t); t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' }; t.fontSize = size; t.characters = chars; if (color) t.fills = [{ type: 'SOLID', color }]; return t; };
  const frames = [];
  const col = (parent, name, gap) => { const f = figma.createFrame(); parent.appendChild(f); f.name = name; f.fills = []; f.clipsContent = false; frames.push([f, gap]); return f; };
  const prev = figma.currentPage; if (prev !== page) await figma.setCurrentPageAsync(page);
  const root = col(page, '📖 Inventário de tipografia', 64);
  root.paddingTop = root.paddingBottom = root.paddingLeft = root.paddingRight = 80; root.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  txt(root, title, 56, true);
  txt(root, `${entries.length} estilos · nome = papel/tamanho (2xl → 2xs) · -emphasis = itálico · -strong = peso maior`, 20, false, GREY);
  const wOf = (fn) => Math.round(fn.variationSettings?.wght ?? 400);
  const fonts = new Map();
  for (const e of entries) { const fn = e.style.fontName; const f = fonts.get(fn.family) || { w: new Set(), italic: false, n: 0 }; f.w.add(wOf(fn)); if (/italic/i.test(fn.style)) f.italic = true; f.n++; fonts.set(fn.family, f); }
  const fsec = col(root, 'Fontes', 20); txt(fsec, `Fontes (${fonts.size})`, 32, true);
  for (const [fam, f] of fonts) {
    const row = col(fsec, fam, 4); const sp = figma.createText(); row.appendChild(sp);
    try { await figma.loadFontAsync({ family: fam, style: 'Regular' }); sp.fontName = { family: fam, style: 'Regular' }; } catch (e) { /* fica em Inter */ }
    sp.fontSize = 40; sp.characters = `${fam} — Aa Bb 0123`;
    txt(row, `pesos ${[...f.w].sort((a, b) => a - b).join(' · ')}${f.italic ? ' · com itálico' : ''} · ${f.n} estilos`, 16, false, GREY);
  }
  for (const role of Object.keys(ROLE_INFO)) {
    const list = entries.filter(e => e.name.split('/').slice(-2)[0] === role); if (!list.length) continue;
    const sec = col(root, ROLE_INFO[role][0], 24);
    txt(sec, `${ROLE_INFO[role][0]} (${list.length})`, 32, true); txt(sec, ROLE_INFO[role][1], 18, false, GREY);
    for (const e of list) {
      const row = col(sec, e.name, Math.max(6, Math.round(e.style.fontSize * 0.18)));
      const sp = figma.createText(); row.appendChild(sp); sp.characters = e.name.replace(/^novo\//, '');
      await figma.loadFontAsync({ family: e.style.fontName.family, style: e.style.fontName.style }); await sp.setTextStyleIdAsync(e.style.id);
      const lh = e.style.lineHeight.unit === 'PIXELS' ? `${Math.round(e.style.lineHeight.value * 10) / 10}px` : e.style.lineHeight.unit === 'PERCENT' ? `${Math.round(e.style.lineHeight.value)}%` : 'auto';
      txt(row, `${e.style.fontName.family} · ${Math.round(e.style.fontSize * 10) / 10}px / ${lh} · wght ${wOf(e.style.fontName)}${/italic/i.test(e.style.fontName.style) ? ' itálico' : ''}${e.style.textCase === 'UPPER' ? ' · caixa alta' : ''} · ${e.uses ?? 0} usos — ${e.description || ''}`, 14, false, GREY);
    }
  }
  for (let i = frames.length - 1; i >= 0; i--) { const [f, gap] = frames[i]; f.layoutMode = 'VERTICAL'; f.itemSpacing = gap; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; }
  root.x = x; root.y = y;
  if (prev !== page) await figma.setCurrentPageAsync(prev);
  return root;
}

// ── descartar ───────────────────────────────────────────────────────────────
if (MODE === 'descartar') {
  const page = figma.root.children.find(p => p.name === PREVIEW.pageName);
  if (page) { if (figma.currentPage === page) await figma.setCurrentPageAsync(figma.root.children.find(p => p !== page)); page.remove(); log.styles.push('página de preview removida'); }
  for (const s of styles.filter(s => s.name.startsWith('novo/'))) { log.styles.push(`removido ${s.name}`); s.remove(); }
  return log;
}

// ── preview ─────────────────────────────────────────────────────────────────
if (MODE === 'preview') {
  const origin = figma.currentPage;
  const targetStyle = new Map();
  for (const t of PLAN.targets) {
    const nm = `novo/${t.name}`;
    const s = byName(nm) || figma.createTextStyle();
    s.name = nm; await setSpec(s, t);
    targetStyle.set(t.name, s); log.styles.push(nm);
  }
  let page = figma.root.children.find(p => p.name === PREVIEW.pageName);
  if (page) for (const c of [...page.children]) c.remove(); else { page = figma.createPage(); page.name = PREVIEW.pageName; }

  const ids = PREVIEW.roots === 'page' ? origin.children.map(n => n.id) : PREVIEW.roots;
  const roots = [];
  for (const id of [...ids, ...PREVIEW.components]) { const n = await figma.getNodeByIdAsync(id); if (n && 'clone' in n) roots.push(n); }
  if (!roots.length) { log.errors.push('nenhum nó para o preview'); return log; }
  const minX = Math.min(...roots.map(n => n.x)), maxX = Math.max(...roots.map(n => n.x + n.width)), minY = Math.min(...roots.map(n => n.y));
  const shift = PREVIEW.beforeAfter ? (maxX - minX) + PREVIEW.gap : 0;

  const after = [];
  for (const n of roots) {
    if (PREVIEW.beforeAfter) { const a = n.clone(); page.appendChild(a); a.x = n.x; a.y = n.y; }
    const b = n.clone(); page.appendChild(b); b.x = n.x + shift; b.y = n.y; after.push(b);
  }
  // Rótulos ANTES/DEPOIS
  await load({ family: 'Inter', style: 'Bold' });
  for (const [txt, x] of (PREVIEW.beforeAfter ? [['ANTES', minX], ['DEPOIS', minX + shift]] : [['DEPOIS', minX]])) { const t = figma.createText(); t.fontName = { family: 'Inter', style: 'Bold' }; t.fontSize = 160; t.characters = txt; t.x = x; t.y = minY - 320; page.appendChild(t); }
  await applyTo(textsIn(after), buildMaps(targetStyle), { skipInstances: false, dry: false });
  markChanges(page);
  try {
    const uses = new Map();
    for (const tx of textsIn(after)) for (const sg of tx.getStyledTextSegments(['textStyleId'])) if (sg.textStyleId) uses.set(sg.textStyleId, (uses.get(sg.textStyleId) || 0) + 1);
    await buildInventory(page, PLAN.targets.map(t => ({ name: t.name, style: targetStyle.get(t.name), description: t.description, uses: uses.get(targetStyle.get(t.name).id) })), `${INVENTORY.title} (preview)`, minX + shift * (PREVIEW.beforeAfter ? 2 : 1), minY);
  } catch (e) { log.errors.push(`inventário: ${e.message}`); }
  await figma.setCurrentPageAsync(page);
  figma.viewport.scrollAndZoomIntoView(page.children);
  log.previewPage = page.id;
  log.next = 'Revise ANTES × DEPOIS. Aprovado → MODE="promover" (com DRY_RUN primeiro). Recusado → ajuste o PLAN e rode "preview" de novo, ou MODE="descartar".';
  return log;
}

// ── promover / aplicar ──────────────────────────────────────────────────────
if (figma.currentPage.name === PREVIEW.pageName) { log.errors.push('você está na página de preview — volte para a página original antes de promover/aplicar'); return log; }
const targetStyle = new Map();
for (const t of PLAN.targets) {
  const staged = byName(`novo/${t.name}`);
  const existing = byName(t.name);
  if (MODE === 'promover' && !staged) { log.errors.push(`"novo/${t.name}" não existe — rode o preview antes`); continue; }
  if (existing && !fromStyleIds.has(existing.id) && existing.id !== t.reuse) { log.errors.push(`já existe outro estilo "${t.name}" fora do mapa — resolva antes`); continue; }
  if (t.reuse) {
    const s = byId.get(t.reuse); if (!s) { log.errors.push(`reuse ${t.reuse} não encontrado`); continue; }
    log.styles.push(`${s.name} → ${t.name} (mantém a chave)`);
    if (!DRY_RUN) { s.name = t.name; await setSpec(s, t); if (staged) staged.remove(); }
    targetStyle.set(t.name, s);
  } else if (MODE === 'promover') {
    log.styles.push(`novo/${t.name} → ${t.name}`);
    if (!DRY_RUN) { if (existing) existing.name = `_deprecated/${existing.name}`; staged.name = t.name; await setSpec(staged, t); }
    targetStyle.set(t.name, staged);
  } else {
    const s = existing && fromStyleIds.has(existing.id) ? null : existing;
    if (s) { targetStyle.set(t.name, s); log.styles.push(`${t.name} (reusado)`); continue; }
    log.styles.push(`${t.name} (criado)`);
    if (DRY_RUN) { targetStyle.set(t.name, { id: `(novo) ${t.name}`, fontName: t.spec.fontName }); continue; }
    if (existing) existing.name = `_deprecated/${existing.name}`;
    const n = figma.createTextStyle(); n.name = t.name; await setSpec(n, t); targetStyle.set(t.name, n);
  }
}
if (log.errors.length) return log;
await applyTo(textsIn(await scopeRoots()), buildMaps(targetStyle), { skipInstances: SKIP_INSTANCES, dry: DRY_RUN });
deprecate(DRY_RUN);
if (MODE === 'promover' && !DRY_RUN) {
  const page = figma.root.children.find(p => p.name === PREVIEW.pageName);
  if (page) { if (figma.currentPage === page) await figma.setCurrentPageAsync(figma.root.children.find(p => p !== page)); page.remove(); }
}
await ordenar(DRY_RUN);
if (!DRY_RUN) {
  try {
    let ip = figma.root.children.find(p => p.name === INVENTORY.pageName);
    if (ip) for (const c of [...ip.children]) c.remove(); else { ip = figma.createPage(); ip.name = INVENTORY.pageName; }
    const uses = new Map();
    for (const tx of textsIn(await scopeRoots())) for (const sg of tx.getStyledTextSegments(['textStyleId'])) if (sg.textStyleId) uses.set(sg.textStyleId, (uses.get(sg.textStyleId) || 0) + 1);
    await buildInventory(ip, PLAN.targets.map(t => ({ name: t.name, style: targetStyle.get(t.name), description: t.description, uses: uses.get(targetStyle.get(t.name).id) })), INVENTORY.title, 0, 0);
    log.inventoryPage = ip.id;
  } catch (e) { log.errors.push(`inventário: ${e.message}`); }
}
log.deprecated = [...new Set(log.deprecated)];
return log;
