// Inventário de tipografia (página de referência) — cria ou recria um frame com:
//   1. Fontes usadas (família, pesos reais, itálico, quantos estilos)
//   2. Estilos por papel (display → … → index), cada grupo com frase de uso
//      e cada estilo com especime, spec, HTML (da descrição) e número de usos.
//
// Roda de três jeitos:
//   • figma-run (figma-console, sem MCP):  node figma-run.mjs inventario-tipografia.js --set page="📖 Tipografia" --set frame="Inventário de tipografia" --set title="Tipografia — Projeto"
//   • figma_execute (figma-console MCP) ou use_figma (Figma MCP): cole o arquivo; sem ARGS, usa os padrões abaixo.
//
// Desempenho: todo nó nasce dentro do pai (col(name, gap, parent) / row.appendChild logo após criar) e o auto layout
// só é ligado no fim. Criar textos grandes soltos e depois mover para dentro de frames levava > 30 s; assim leva ~1 s.
//
// ARGS (todos opcionais):
//   page   página onde o inventário fica (criada se não existir)        padrão '📖 Tipografia'
//   frame  nome do frame (substituído se já existir nessa página)      padrão '📖 Inventário de tipografia'
//   title  título no topo do frame                                     padrão 'Tipografia — <nome do arquivo>'
//   x, y   posição do frame                                            padrão 0, 0
//   usesScope 'all' (todas as páginas) | 'page:<nome>' para contar usos padrão 'all'
//   stay   true = termina com a página do inventário aberta             padrão false
//   prefix  só inclui estilos com este prefixo (ex. 'novo/' no preview) padrão: todos exceto _deprecated/ e novo/

const A = (typeof ARGS !== 'undefined' && ARGS) || {};
const PAGE = A.page || '📖 Tipografia';
const FRAME = A.frame || '📖 Inventário de tipografia';
const TITLE = A.title || `Tipografia — ${figma.root.name}`;
const X = A.x ?? 0, Y = A.y ?? 0;

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
const SIZE_ORDER = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs', '2xs'];
const MOD_ORDER = ['', 'emphasis', 'strong'];
const GREY = { r: 0.42, g: 0.42, b: 0.42 };

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
const txt = (chars, size, bold, color) => { const t = figma.createText(); t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' }; t.fontSize = size; t.characters = chars; if (color) t.fills = [{ type: 'SOLID', color }]; return t; };
// Auto layout só é ligado no fim (layoutAll), num único recálculo.
const frames = [];
const col = (name, gap, parent) => { const f = figma.createFrame(); f.name = name; f.fills = []; f.clipsContent = false; frames.push([f, gap]); if (parent) parent.appendChild(f); return f; };
const layoutAll = () => { for (let i = frames.length - 1; i >= 0; i--) { const [f, gap] = frames[i]; f.layoutMode = 'VERTICAL'; f.itemSpacing = gap; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; } };
// loadFontAsync de fonte variável às vezes fica pendente sem erro: limita cada carregamento a 4 s.
const loadFont = (fn, ms = 4000) => Promise.race([figma.loadFontAsync({ family: fn.family, style: fn.style }).then(() => true), new Promise(r => setTimeout(() => r(false), ms))]);
const skipped = [];
const weightOf = (fn) => Math.round(fn.variationSettings?.wght ?? ({ thin: 100, extralight: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 }[fn.style.toLowerCase().replace(/italic|oblique|\s|-/g, '')] ?? 400));

// Estilos a documentar
const all = await figma.getLocalTextStylesAsync();
const styles = all.filter(s => A.prefix ? s.name.startsWith(A.prefix) : !s.name.startsWith('_deprecated/') && !s.name.startsWith('novo/'));
const roleOf = (s) => s.name.split('/').slice(-2)[0];
const leaf = (s) => { const m = /^([0-9]*x?[a-z]+)(?:-(.+))?$/.exec(s.name.split('/').pop()) || []; return [SIZE_ORDER.indexOf(m[1]), MOD_ORDER.indexOf(m[2] || '')]; };

// Usos por estilo
const uses = new Map();
let scope;
if (!A.usesScope || A.usesScope === 'all') { await figma.loadAllPagesAsync(); scope = figma.root.children.filter(p => p.name !== PAGE); }
else scope = figma.root.children.filter(p => p.name === A.usesScope.replace(/^page:/, ''));
const bump = (id) => { if (id) uses.set(id, (uses.get(id) || 0) + 1); };
for (const p of scope) for (const t of p.findAllWithCriteria({ types: ['TEXT'] })) {
  // rápido: textStyleId do nó; só desce para trechos quando o texto é misto
  if (t.textStyleId !== figma.mixed) bump(t.textStyleId);
  else for (const sg of t.getStyledTextSegments(['textStyleId'])) bump(sg.textStyleId);
}

// Página e frame
let page = figma.root.children.find(p => p.name === PAGE);
if (!page) { page = figma.createPage(); page.name = PAGE; }
await page.loadAsync?.();
const old = page.children.find(n => n.name === FRAME); if (old) old.remove();

// Monta com a página de destino ativa: nós novos nascem nela (mover nós entre páginas é lento e,
// se a execução estourar o tempo, deixaria restos na página de trabalho). Volta para a página original no fim.
const prevPage = figma.currentPage;
await figma.setCurrentPageAsync(page);
const root = col(FRAME, 64);
page.appendChild(root);
root.paddingTop = root.paddingBottom = root.paddingLeft = root.paddingRight = 80;
root.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
root.appendChild(txt(TITLE, 56, true));
root.appendChild(txt(`${styles.length} estilos · nome = papel/tamanho (2xl → 2xs) · -emphasis = itálico · -strong = peso maior · atualizado em ${new Date().toISOString().slice(0, 10)}`, 20, false, GREY));

// 1. Fontes
const fonts = new Map();
for (const s of styles) { const f = fonts.get(s.fontName.family) || { w: new Set(), italic: false, n: 0 }; f.w.add(weightOf(s.fontName)); if (/italic|oblique/i.test(s.fontName.style)) f.italic = true; f.n++; fonts.set(s.fontName.family, f); }
const fsec = col('Fontes', 20, root);
fsec.appendChild(txt(`Fontes (${fonts.size})`, 32, true));
for (const [fam, f] of fonts) {
  const row = col(fam, 4, fsec); const sp = figma.createText(); row.appendChild(sp);
  if (await loadFont({ family: fam, style: 'Regular' }).catch(() => false)) sp.fontName = { family: fam, style: 'Regular' };
  sp.fontSize = 40; sp.characters = `${fam} — Aa Bb 0123`;
  row.appendChild(txt(`pesos ${[...f.w].sort((a, b) => a - b).join(' · ')}${f.italic ? ' · com itálico' : ''} · ${f.n} estilos`, 16, false, GREY));
}

// 2. Estilos por papel
const known = Object.keys(ROLE_INFO);
for (const role of [...known, '__outros']) {
  const list = styles.filter(s => role === '__outros' ? !known.includes(roleOf(s)) : roleOf(s) === role)
    .sort((a, b) => { const ka = leaf(a), kb = leaf(b); return ka[0] - kb[0] || ka[1] - kb[1] || a.name.localeCompare(b.name); });
  if (!list.length) continue;
  const [label, about] = ROLE_INFO[role] || ['Fora da taxonomia', 'Estilos que não seguem papel/tamanho — revisar.'];
  const sec = col(label, 24, root);
  sec.appendChild(txt(`${label} (${list.length})`, 32, true));
  sec.appendChild(txt(about, 18, false, GREY));
  for (const s of list) {
    const row = col(s.name, Math.max(6, Math.round(s.fontSize * 0.18)), sec);
    const sp = figma.createText(); row.appendChild(sp);
    sp.characters = s.name.replace(/^novo\//, '');
    if (await loadFont(s.fontName)) { try { await Promise.race([sp.setTextStyleIdAsync(s.id), new Promise((_, j) => setTimeout(() => j(new Error('timeout')), 4000))]); } catch (e) { skipped.push(s.name); } }
    else { skipped.push(s.name); sp.fontSize = Math.min(s.fontSize, 96); }
    const lh = s.lineHeight.unit === 'PIXELS' ? `${Math.round(s.lineHeight.value * 10) / 10}px` : s.lineHeight.unit === 'PERCENT' ? `${Math.round(s.lineHeight.value)}%` : 'auto';
    row.appendChild(txt(`${s.fontName.family} · ${Math.round(s.fontSize * 10) / 10}px / ${lh} · wght ${weightOf(s.fontName)}${/italic/i.test(s.fontName.style) ? ' itálico' : ''}${s.textCase === 'UPPER' ? ' · caixa alta' : ''} · ${uses.get(s.id) || 0} usos${s.description ? ' — ' + s.description : ''}`, 14, false, GREY));
  }
}
layoutAll();
root.x = X; root.y = Y;
if (!A.stay) await figma.setCurrentPageAsync(prevPage);
return { page: page.name, frame: root.id, semEspecime: skipped, estilos: styles.length, fontes: [...fonts.keys()], usosTotais: [...uses.entries()].filter(([id]) => styles.some(s => s.id === id)).reduce((a, [, n]) => a + n, 0) };
