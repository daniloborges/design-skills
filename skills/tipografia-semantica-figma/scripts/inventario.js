// Inventário de texto — SOMENTE LEITURA.
// Rode com figma_execute (figma-console MCP) ou use_figma (Figma MCP oficial).
// Devolve: estilos, grupos de spec (com PESO REAL de fontes variáveis), textos mistos, checagens
// e uma sugestão de escopo para o preview (página inteira ou amostra de frames que cobre todos os grupos).

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};   // figma-run: --set scope=page
const SCOPE = _A.scope ?? 'auto';            // 'auto' (seleção, senão página) | 'page' | 'all-pages'
const EXCLUDE = /(^|[\s/_-])(doc|docs|spec|specimen|especime|espécime|annotation|anota|legend|legenda)([\s/_-]|$)|^_/i; // frames de documentação
const EXCLUDE_TEXT = /^(variant|property|state|default|hover|pressed|focus|disabled)\b.*|^(true|false)$/i; // rótulos de variante
const PREVIEW_PAGE_LIMIT = 400;  // acima disso, sugerir amostra em vez de duplicar a página
const SAMPLE_IDS = 5;
const SAMPLE_TEXT = 40;
// ────────────────────────────────────────────────────────────────────────────

const r = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const NAME_WEIGHT = { thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900 };
const nameWeight = (style) => NAME_WEIGHT[style.toLowerCase().replace(/italic|oblique|\s|-/g, '')] ?? 400;
const isItalic = (style) => /italic|oblique/i.test(style);
// Peso REAL: eixo wght da fonte variável > fontWeight do trecho > nome da instância
const realWeight = (fontName, fontWeight) => fontName.variationSettings?.wght ?? fontWeight ?? nameWeight(fontName.style);
const fmtLH = (lh) => lh.unit === 'AUTO' ? 'auto' : lh.unit === 'PERCENT' ? `${r(lh.value)}%` : `${r(lh.value)}px`;
const fmtLS = (ls, size) => ls.unit === 'PERCENT' ? `${r(size * ls.value / 100)}px` : `${r(ls.value)}px`;
const specKey = (s, w) => [s.fontName.family, `${Math.round(w)}${isItalic(s.fontName.style) ? 'i' : ''}`, r(s.fontSize, 1), fmtLH(s.lineHeight), fmtLS(s.letterSpacing, s.fontSize), s.textCase || 'ORIGINAL'].join('|');
const lhRatio = (lh, size) => lh.unit === 'AUTO' ? 1.2 : lh.unit === 'PERCENT' ? lh.value / 100 : lh.value / size;

// Contraste aproximado: fill do texto vs primeiro fill sólido de um ancestral
const lum = ({ r: R, g: G, b: B }) => [R, G, B].map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
const solid = (fills) => Array.isArray(fills) ? fills.find(p => p.type === 'SOLID' && p.visible !== false && (p.opacity ?? 1) > 0.5) : null;
function bgOf(node) { let p = node.parent; while (p && p.type !== 'PAGE') { const f = 'fills' in p ? solid(p.fills) : null; if (f) return f.color; p = p.parent; } return { r: 1, g: 1, b: 1 }; }
function contrast(node) { const f = solid(node.fills); if (!f) return null; const a = lum(f.color), b = lum(bgOf(node)); return r((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), 2); }
function excluded(node) {
  if (EXCLUDE_TEXT.test(node.characters.trim())) return true;
  let p = node.parent;
  while (p && p.type !== 'PAGE') { if (EXCLUDE.test(p.name)) return true; p = p.parent; }
  return false;
}
function topFrame(node) { let p = node; while (p.parent && p.parent.type !== 'PAGE') p = p.parent; return p; }
function mainComponentOf(node) { let p = node.parent; while (p && p.type !== 'PAGE') { if (p.type === 'COMPONENT' || p.type === 'COMPONENT_SET') return p.type === 'COMPONENT' && p.parent?.type === 'COMPONENT_SET' ? p.parent : p; p = p.parent; } return null; }

// Escopo
let roots;
if (SCOPE === 'all-pages') { await figma.loadAllPagesAsync(); roots = figma.root.children; }
else if (SCOPE === 'auto' && figma.currentPage.selection.length) roots = figma.currentPage.selection;
else roots = [figma.currentPage];
const texts = [];
for (const root of roots) {
  if (root.type === 'TEXT') texts.push(root);
  if ('findAllWithCriteria' in root) texts.push(...root.findAllWithCriteria({ types: ['TEXT'] }));
}

const styles = await figma.getLocalTextStylesAsync();
const styleById = Object.fromEntries(styles.map(s => [s.id, s]));
const usage = {}, groups = {}, mixed = [], frameGroups = new Map(), components = new Map(), weightMismatch = new Map();
const checks = { tooSmall: [], small12: [], fractional: new Set(), justified: [], fixedHeight: [], lowContrast: [] };
let total = 0, ignored = 0, styled = 0, inInstances = 0;

for (const t of texts) {
  if (excluded(t)) { ignored++; continue; }
  total++;
  if (t.id.startsWith('I')) inInstances++;
  const segs = t.getStyledTextSegments(['fontName', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'textCase', 'textStyleId']);
  if (segs.length > 1) mixed.push({ id: t.id, text: t.characters.slice(0, SAMPLE_TEXT), segments: segs.length });
  if (segs.every(s => s.textStyleId)) styled++;
  const tf = topFrame(t);
  const comp = mainComponentOf(t);
  for (const s of segs) {
    const w = realWeight(s.fontName, s.fontWeight);
    if (Math.abs(w - nameWeight(s.fontName.style)) >= 200) {
      const k = `${s.fontName.family} "${s.fontName.style}" → wght ${Math.round(w)}`;
      weightMismatch.set(k, (weightMismatch.get(k) || 0) + 1);
    }
    if (s.textStyleId) usage[s.textStyleId] = (usage[s.textStyleId] || 0) + 1;
    const k = specKey(s, w);
    const g = groups[k] ||= { key: k, family: s.fontName.family, instanceName: s.fontName.style, weight: Math.round(w), italic: isItalic(s.fontName.style), size: r(s.fontSize, 1), lineHeight: fmtLH(s.lineHeight), lhRatio: r(lhRatio(s.lineHeight, s.fontSize)), tracking: fmtLS(s.letterSpacing, s.fontSize), textCase: s.textCase, count: 0, styled: 0, styleNames: new Set(), ids: [], samples: [], fontName: s.fontName };
    g.count++;
    if (s.textStyleId) { g.styled++; g.styleNames.add(styleById[s.textStyleId]?.name || '(externo)'); }
    if (g.ids.length < SAMPLE_IDS) g.ids.push(t.id);
    if (g.samples.length < 2) g.samples.push(s.characters.slice(0, SAMPLE_TEXT));
    if (!frameGroups.has(tf.id)) frameGroups.set(tf.id, { id: tf.id, name: tf.name, texts: 0, keys: new Set() });
    frameGroups.get(tf.id).keys.add(k);
    if (comp) { if (!components.has(comp.id)) components.set(comp.id, { id: comp.id, name: comp.name, type: comp.type, keys: new Set() }); components.get(comp.id).keys.add(k); }
    if (s.fontSize < 11) checks.tooSmall.push(t.id); else if (s.fontSize < 12) checks.small12.push(t.id);
    if (s.fontSize % 1 !== 0) checks.fractional.add(r(s.fontSize, 1));
  }
  frameGroups.get(tf.id).texts++;
  if (t.textAlignHorizontal === 'JUSTIFIED') checks.justified.push(t.id);
  if (t.textAutoResize === 'NONE' || t.textAutoResize === 'TRUNCATE') checks.fixedHeight.push(t.id);
  const c = contrast(t);
  if (c !== null) { const fs = t.fontSize === figma.mixed ? 0 : t.fontSize; const large = fs >= 24 || (fs >= 18.66 && typeof t.fontWeight === 'number' && t.fontWeight >= 700); if (c < (large ? 3 : 4.5)) checks.lowContrast.push({ id: t.id, ratio: c, large, text: t.characters.slice(0, 24) }); }
}

// Estilos: duplicados e nomes ambíguos (usando peso real)
const bySpec = {}, byName = {};
for (const s of styles) { const k = specKey(s, realWeight(s.fontName)); (bySpec[k] ||= []).push(s.id); (byName[s.name] ||= new Set()).add(k); }
const duplicateSpecs = Object.entries(bySpec).filter(([, ids]) => ids.length > 1).map(([key, ids]) => ({ key, ids, names: ids.map(i => styleById[i].name) }));
const ambiguousNames = Object.entries(byName).filter(([, ks]) => ks.size > 1).map(([name, ks]) => ({ name, specs: [...ks] }));
const unused = styles.filter(s => !usage[s.id]).map(s => ({ id: s.id, name: s.name }));

// Sugestão de escopo do preview: amostra mínima de frames que cobre todos os grupos (set cover guloso)
const allKeys = new Set(Object.keys(groups));
const frames = [...frameGroups.values()];
const sample = []; const covered = new Set();
while (covered.size < allKeys.size) {
  let best = null, gain = 0;
  for (const f of frames) { const g = [...f.keys].filter(k => !covered.has(k)).length; if (g > gain || (g === gain && best && f.texts < best.texts)) { best = f; gain = g; } }
  if (!best || gain === 0) break;
  sample.push({ id: best.id, name: best.name, texts: best.texts, newGroups: gain });
  best.keys.forEach(k => covered.add(k));
}
const previewSuggestion = total <= PREVIEW_PAGE_LIMIT
  ? { mode: 'page', reason: `${total} textos — dá para duplicar o escopo inteiro` }
  : { mode: 'sample', reason: `${total} textos — amostra de ${sample.length} frames cobre ${covered.size}/${allKeys.size} grupos`, frames: sample };

const rows = Object.values(groups).map(g => ({ ...g, styleNames: [...g.styleNames] })).sort((a, b) => b.size - a.size || b.count - a.count);

return {
  scope: SCOPE === 'auto' && figma.currentPage.selection.length ? 'selection' : SCOPE,
  page: figma.currentPage.name,
  totals: { texts: total, ignoredAsDocs: ignored, styled, unstyled: total - styled, mixed: mixed.length, inInstances, localStyles: styles.length, groups: rows.length },
  variableFontWarning: [...weightMismatch].map(([k, n]) => `${k} (${n} trechos) — o nome da instância não é o peso real`),
  previewSuggestion,
  components: [...components.values()].map(c => ({ id: c.id, name: c.name, type: c.type, groups: c.keys.size })),
  styles: styles.map(s => ({ id: s.id, name: s.name, spec: specKey(s, realWeight(s.fontName)), uses: usage[s.id] || 0 })),
  duplicateSpecs, ambiguousNames, unused,
  groups: rows,
  mixed: mixed.slice(0, 50),
  checks: {
    tooSmall_lt11: checks.tooSmall.length, tooSmallIds: checks.tooSmall.slice(0, 20),
    small_lt12: checks.small12.length,
    fractionalSizes: [...checks.fractional].sort((a, b) => a - b),
    justified: checks.justified.slice(0, 20),
    fixedHeight: checks.fixedHeight.length, fixedHeightIds: checks.fixedHeight.slice(0, 20),
    lowContrast: checks.lowContrast.length, lowContrastSample: checks.lowContrast.slice(0, 20),
    lowContrastNote: 'aproximado: fill do texto vs primeiro fill sólido de ancestral; confira sobre imagens e gradientes',
  },
};
