// Recria o frame "📖 <prefixo> — de-para": uma linha por estilo do conjunto, com especime, spec, origem, HTML e cor.
// Lê tudo da descrição de cada estilo (formato fixo da "Camada de componente" em taxonomia.md), então roda de novo
// sempre que o conjunto mudar. Rode no DESTINO, com figma_execute (fileKey do destino) ou use_figma.
// ARGS: no figma_execute, ponha `const ARGS = { prefixo: 'da:chat', pagina: '💬 Chat', amostras: { answer: 'Liderei o design…' } };`
// antes do script; no figma-run, `--args frame.json`. Remove e recria só o frame com o mesmo nome que ele mesmo cria.

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const PREFIXO = _A.prefixo;
const PAGINA = _A.pagina ?? null;      // nome da página; null = a página aberta
const AMOSTRAS = _A.amostras ?? {};    // { parte: 'texto do especime' }; sem amostra, o especime é o nome da parte
const TITULO = _A.titulo ?? `${PREFIXO} — de-para`;
if (!PREFIXO) throw new Error('Passe prefixo, ex. da:chat');

// ── Dados ───────────────────────────────────────────────────────────────────
const pg = PAGINA ? figma.root.children.find(p => p.name === PAGINA) : figma.currentPage;
if (!pg) throw new Error(`Página não encontrada: ${PAGINA}`);
await pg.loadAsync();
const estilos = (await figma.getLocalTextStylesAsync()).filter(s => s.name.startsWith(PREFIXO + '-'));
if (!estilos.length) throw new Error(`Nenhum estilo ${PREFIXO}-*`);
const C = {};
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) for (const id of c.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v.resolvedType === 'COLOR') C[v.name] = v;
}
const DESC = /De-para · (.*) → (.*) · HTML (.*) · cor (.*)$/;
const paint = (nome, fallback = '#222222') =>
  C[nome] ? figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', C[nome]) : figma.util.solidPaint(fallback);
for (const s of estilos) await figma.loadFontAsync(s.fontName);
for (const st of ['Regular', 'Bold']) await figma.loadFontAsync({ family: 'Inter', style: st });

// ── Frame ───────────────────────────────────────────────────────────────────
const nome = `📖 ${TITULO}`;
for (const n of pg.children.filter(n => n.name === nome)) n.remove();
const auto = dir => { const f = figma.createFrame(); f.layoutMode = dir; f.fills = []; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; return f; };
const texto = async (chars, opt, parent, w) => {
  const t = figma.createText();
  if (opt.style) await t.setTextStyleIdAsync(opt.style);
  else { t.fontName = { family: 'Inter', style: opt.bold ? 'Bold' : 'Regular' }; t.fontSize = opt.size ?? 12; t.lineHeight = { unit: 'PIXELS', value: Math.round((opt.size ?? 12) * 1.5) }; }
  t.characters = chars;
  t.fills = [paint(opt.cor ?? 'ink')];
  parent.appendChild(t);
  if (w) { t.resize(w, t.height); t.textAutoResize = 'HEIGHT'; }
  return t;
};
const F = auto('VERTICAL');
F.name = nome;
pg.appendChild(F);
F.fills = [figma.util.solidPaint('#ffffff')];
F.paddingTop = F.paddingBottom = F.paddingLeft = F.paddingRight = 64;
F.itemSpacing = 0;
const direita = pg.children.filter(n => n !== F).reduce((m, n) => Math.max(m, n.x + n.width), 0);
F.x = direita + 120; F.y = 0;
await texto(TITULO, { size: 40, bold: true }, F);
const cols = [['Estilo', 220], ['Especime', 360], ['Spec', 220], ['Origem', 300], ['HTML · cor', 200]];
const linha = async (cells) => {
  const r = auto('HORIZONTAL');
  F.appendChild(r);
  r.itemSpacing = 16; r.paddingTop = r.paddingBottom = 12; r.counterAxisAlignItems = 'CENTER';
  r.strokes = [paint('line/soft', '#e9e0d5')]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1;
  for (const [i, c] of cells.entries()) await texto(c.text, c, r, cols[i][1]);
};
await linha(cols.map(([c]) => ({ text: c, bold: true, size: 12, cor: 'ink/mute' })));
for (const s of estilos) {
  const m = (s.description || '').match(DESC) || [null, '—', '—', '—', 'ink'];
  const parte = s.name.slice(PREFIXO.length + 1);
  const ligado = Object.keys(s.boundVariables || {}).length ? ' ←' : '';
  await linha([
    { text: s.name, bold: true, size: 13 },
    { text: AMOSTRAS[parte] ?? parte, style: s.id, cor: m[4] },
    { text: `${s.fontName.family} ${s.fontName.style} ${s.fontSize}/${s.lineHeight.unit === 'PIXELS' ? s.lineHeight.value : s.lineHeight.unit}${s.textCase === 'UPPER' ? ' · caixa alta' : ''}${ligado}`, size: 12, cor: 'ink/soft' },
    { text: `${m[1]} → ${m[2]}`, size: 12, cor: 'ink/soft' },
    { text: `${m[3]} · ${m[4]}`, size: 12, cor: 'ink/soft' },
  ]);
}
return { frame: F.id, pagina: pg.name, estilos: estilos.length };
