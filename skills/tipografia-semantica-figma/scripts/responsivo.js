// Modo responsivo: liga tamanho, entrelinha e tracking dos estilos de texto a variáveis com modos Desktop × Mobile.
// Rode com figma_execute (figma-console MCP) ou use_figma (Figma MCP oficial). Regras: taxonomia.md
// ("Escala responsiva") e modos.md.
//
// Rode sempre com dryRun: true primeiro. O dry-run não escreve nada e devolve:
//   colecao   → onde as variáveis vão morar (existente com os modos, ou a 'Viewport' que seria criada)
//   outras    → outras coleções com modos de tela: cada uma é uma segunda chave a declarar
//   bloqueios → grupos cujas variantes divergem em tamanho/entrelinha, ou entrelinha em % / AUTO
//   frames    → os frames mobile, com quantos textos têm estilo, quantos não têm e quantos são mistos
//   plano     → uma linha por variável: desktop → mobile, e a sugestão quando `mobile` não define o grupo
// Com dryRun: false, cria ou reusa as variáveis, liga os estilos, aplica `setMode` e lê o valor resolvido
// de um texto por estilo dentro de cada frame de `verify` (por padrão, os mesmos de `frames`).
//
// ARGS: no figma_execute, ponha `const ARGS = { dryRun: true, ... };` antes do script; no figma-run, `--args arquivo.json`.
// As chaves de `mobile` são o grupo do estilo, com o prefixo de marca quando houver: 'heading/xl', 'acme/heading/xl'.

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const DRY_RUN = _A.dryRun ?? true;
const COLLECTION = _A.collection ?? null;   // nome ou id; null = a que já tem type/*, senão a primeira com os dois modos fora do espaço, senão cria 'Viewport'
const DESKTOP = _A.desktop ?? 'Desktop';
const MOBILE_MODE = _A.mobileMode ?? 'Mobile';
const MOBILE = _A.mobile ?? {};             // { 'heading/xl': [44, 44] } → [tamanho, entrelinha] mobile; ausente = igual ao desktop
const SET_MODE = _A.setMode ?? {};          // { '<id do frame>': 'Mobile' } → modo explícito nesses frames
const FRAMES = _A.frames ?? 'auto';         // ids de frames para contar textos e conferir; 'auto' = telas em pé de 320 a 480 px de largura, ou com um modo 'Mobile' explícito
const PAGE = _A.page ?? null;               // nome da página onde procurar os frames; null = a página aberta
const VERIFY = _A.verify ?? null;           // ids de frames para conferir o valor resolvido depois de aplicar; null = os de FRAMES

// ── Auxiliares ──────────────────────────────────────────────────────────────
// papel/tamanho[-modificador], com prefixo de marca opcional (acme/heading/xl); `novo/*` e `_deprecated/*` ficam de fora
const NAME = /^(?:([a-z0-9-]+)\/)?([a-z-]+)\/(2xs|xs|sm|md|lg|xl|2xl)(-(emphasis|strong))?$/;
const r2 = x => Math.round(x * 100) / 100;
const even = x => Math.round(x / 2) * 2;
const suggest = (fs, lh) => {
  if (fs <= 16) return [fs, lh];
  const m = Math.min(even(16 + Math.pow(fs - 16, 0.8)), fs);  // o arredondamento para par nunca sobe acima do desktop
  return [m, Math.min(Math.max(even(m * (lh / fs)), m), lh)];
};
const px = (s, k) => {
  const v = s[k];
  if (v.unit === 'PIXELS') return v.value;
  if (k === 'letterSpacing' && v.unit === 'PERCENT') return (v.value * s.fontSize) / 100;
  return null; // entrelinha em % ou AUTO
};

// ── Coleção ─────────────────────────────────────────────────────────────────
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const hasModes = c => [DESKTOP, MOBILE_MODE].every(m => c.modes.some(x => x.name === m));
// Sem `collection`: primeiro a coleção que já guarda variáveis type/*; senão a primeira com os dois modos que não seja
// de espaço (Spacing/Primitives, ou só com gap/padding/layout), porque o espaçamento também ganha Desktop/Mobile.
const typeCols = new Set(), spaceCols = new Set();
for (const c of cols) for (const id of c.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v.name.startsWith('type/')) typeCols.add(c.id);
  if (/^(gap|padding|layout|space)\//.test(v.name)) spaceCols.add(c.id);
}
let col = COLLECTION
  ? cols.find(c => c.id === COLLECTION || c.name === COLLECTION)
  : cols.find(c => typeCols.has(c.id)) ?? cols.find(c => hasModes(c) && !spaceCols.has(c.id));
const outras = cols.filter(c => c !== col && hasModes(c)).map(c => c.name);
const avisos = [];
if (col && col.modes[0].name !== DESKTOP) avisos.push(`"${col.name}": o primeiro modo é "${col.modes[0].name}", não ${DESKTOP}; frames sem modo explícito cairão nele`);
if (col && !hasModes(col)) avisos.push(`"${col.name}" não tem os modos ${DESKTOP} e ${MOBILE_MODE}; eles serão acrescentados`);

// ── Grupos ──────────────────────────────────────────────────────────────────
const styles = (await figma.getLocalTextStylesAsync()).filter(s => !s.name.startsWith('novo/') && NAME.test(s.name));
const groups = {};
for (const s of styles) {
  const [, marca, papel, tam] = s.name.match(NAME);
  const g = `${marca ? marca + '/' : ''}${papel}/${tam}`;
  if (!groups[g]) groups[g] = [];
  groups[g].push(s);
}
// Numa coleção que já tem o modo Mobile, o valor de partida é o Mobile de hoje, nunca o de desktop:
// rodar de novo sem `mobile` repara as ligações e mantém os valores.
const existentes = {};
const mobId = col?.modes.find(m => m.name === MOBILE_MODE)?.modeId;
if (col) for (const id of col.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); existentes[v.name] = v; }
const hoje = name => { const val = mobId && existentes[name]?.valuesByMode[mobId]; return typeof val === 'number' ? val : undefined; };
const bloqueios = [], plano = [], jobs = [];
for (const [g, ss] of Object.entries(groups)) {
  const fs = ss[0].fontSize, lh = px(ss[0], 'lineHeight');
  if (lh === null) { bloqueios.push(`${g}: entrelinha em ${ss[0].lineHeight.unit}; converta para px antes`); continue; }
  if (ss.some(s => s.fontSize !== fs || px(s, 'lineHeight') !== lh)) {
    bloqueios.push(`${g}: variantes divergem (${ss.map(s => `${s.name} ${s.fontSize}/${r2(px(s, 'lineHeight') ?? 0)}`).join(' · ')})`);
    continue;
  }
  const lss = ss.map(s => r2(px(s, 'letterSpacing')));
  const lsShared = lss.every(x => x === lss[0]) && lss[0] !== 0;
  const sug = suggest(fs, lh);
  const [mfs, mlh] = MOBILE[g] ?? [hoje(`type/${g}/font-size`) ?? fs, hoje(`type/${g}/line-height`) ?? lh];
  const props = [['font-size', 'fontSize', 'FONT_SIZE', fs, mfs], ['line-height', 'lineHeight', 'LINE_HEIGHT', lh, mlh]];
  const lsMob = MOBILE[g] ? undefined : hoje(`type/${g}/letter-spacing`);
  if (lsShared) props.push(['letter-spacing', 'letterSpacing', 'LETTER_SPACING', px(ss[0], 'letterSpacing'), lsMob ?? r2((px(ss[0], 'letterSpacing') * mfs) / fs)]);
  else if (lss.some(x => x !== 0) && ss.length > 1) avisos.push(`${g}: tracking diferente entre variantes (${lss.join(' / ')}); sem variável de tracking`);
  for (const [suf, field, scope, dv, mv] of props) {
    const sugTxt = !MOBILE[g] && suf !== 'letter-spacing' && (suf === 'font-size' ? sug[0] : sug[1]) !== dv ? ` (sugestão ${suf === 'font-size' ? sug[0] : sug[1]})` : '';
    const atual = !MOBILE[g] && hoje(`type/${g}/${suf}`) !== undefined ? ' (Mobile de hoje)' : '';
    plano.push(`type/${g}/${suf}: ${r2(dv)} → ${r2(mv)}${atual}${sugTxt} [${ss.length}]`);
    jobs.push({ g, suf, field, scope, dv, mv, ss });
  }
}

// ── Frames mobile: textos com estilo × sem estilo ──────────────────────────
const modeNames = Object.fromEntries(cols.flatMap(c => c.modes.map(m => [m.modeId, m.name])));
const pg = PAGE ? figma.root.children.find(p => p.name === PAGE) : figma.currentPage;
if (!pg) throw new Error(`Página não encontrada: ${PAGE}`);
await pg.loadAsync();
const tops = pg.children.flatMap(n => (n.type === 'SECTION' ? n.children : [n])).filter(n => n.type === 'FRAME');
const isMobile = f => (f.width >= 320 && f.width <= 480 && f.height >= 1.2 * f.width) || Object.values(f.explicitVariableModes || {}).some(id => modeNames[id] === MOBILE_MODE);
const alvos = FRAMES === 'auto' ? tops.filter(isMobile) : (await Promise.all(FRAMES.map(id => figma.getNodeByIdAsync(id)))).filter(Boolean);
const desktops = tops.filter(f => !isMobile(f)).length;
if (FRAMES === 'auto' && !desktops) avisos.push(`a página "${pg.name}" não tem frame de desktop: se o arquivo é só mobile, o modo responsivo não tem o que equilibrar`);
if (FRAMES === 'auto' && !alvos.length) avisos.push(`nenhum frame mobile na página "${pg.name}": passe page ou frames`);
const styleIds = new Set(styles.map(s => s.id));
const frames = alvos.map(f => {
  const texts = f.findAll(n => n.type === 'TEXT');
  const com = texts.filter(t => typeof t.textStyleId === 'string' && styleIds.has(t.textStyleId)).length;
  const misto = texts.filter(t => t.textStyleId === figma.mixed).length;
  return `${f.name} (${f.id}, ${Math.round(f.width)} px): ${com} com estilo · ${texts.length - com - misto} sem estilo · ${misto} misto (só o que tem estilo responde ao modo)`;
});

if (DRY_RUN) {
  return { dryRun: true, pagina: pg.name, colecao: col ? col.name : 'Viewport (seria criada)', outras, avisos, bloqueios, frames, plano };
}
if (bloqueios.length) throw new Error('Há bloqueios; resolva antes de aplicar:\n' + bloqueios.join('\n'));

// ── Aplicar ─────────────────────────────────────────────────────────────────
if (!col) { col = figma.variables.createVariableCollection('Viewport'); col.renameMode(col.modes[0].modeId, DESKTOP); }
if (!col.modes.some(m => m.name === DESKTOP)) col.addMode(DESKTOP);
if (!col.modes.some(m => m.name === MOBILE_MODE)) col.addMode(MOBILE_MODE);
const D = col.modes.find(m => m.name === DESKTOP).modeId, M = col.modes.find(m => m.name === MOBILE_MODE).modeId;
const existing = {};
for (const id of col.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); existing[v.name] = v; }
let created = 0, bound = 0;
for (const { g, suf, field, scope, dv, mv, ss } of jobs) {
  const name = `type/${g}/${suf}`;
  let v = existing[name];
  if (!v) { v = figma.variables.createVariable(name, col, 'FLOAT'); created++; }
  v.scopes = [scope];
  v.setVariableCodeSyntax('WEB', `var(--type-${g.split('/').join('-')}-${suf})`);
  v.setValueForMode(D, dv);
  v.setValueForMode(M, mv);
  for (const s of ss) { s.setBoundVariable(field, v); bound++; }
}
for (const [id, modo] of Object.entries(SET_MODE)) {
  const n = await figma.getNodeByIdAsync(id);
  const m = col.modes.find(x => x.name === modo);
  if (n && m) n.setExplicitVariableModeForCollection(col, m.modeId);
}

// ── Verificar pelo valor resolvido ─────────────────────────────────────────
const byId = Object.fromEntries(styles.map(s => [s.id, s.name]));
const expect = Object.fromEntries(jobs.filter(j => j.suf === 'font-size').flatMap(j => j.ss.map(s => [s.name, { [DESKTOP]: j.dv, [MOBILE_MODE]: j.mv }])));
const verificacao = [];
for (const id of VERIFY ?? alvos.map(f => f.id)) {
  const f = await figma.getNodeByIdAsync(id);
  if (!f) { verificacao.push(`${id}: não encontrado`); continue; }
  const modeId = f.resolvedVariableModes?.[col.id];
  const modo = col.modes.find(m => m.modeId === modeId)?.name ?? DESKTOP;
  const seen = new Set(); let ok = 0; const erros = [];
  for (const t of f.findAll(n => n.type === 'TEXT' && typeof n.textStyleId === 'string' && byId[n.textStyleId])) {
    const nome = byId[t.textStyleId];
    if (seen.has(nome)) continue; seen.add(nome);
    const want = expect[nome]?.[modo];
    if (want === undefined) continue;
    if (Math.abs(t.fontSize - want) < 0.01) ok++; else erros.push(`${nome} ${t.fontSize}≠${want}`);
  }
  verificacao.push(`${f.name} [${modo}]: ${ok} estilos conferem${erros.length ? ' · divergem: ' + erros.join(', ') : ''}`);
}
return { dryRun: false, colecao: col.name, outras, avisos, criadas: created, ligacoes: bound, verificacao };
