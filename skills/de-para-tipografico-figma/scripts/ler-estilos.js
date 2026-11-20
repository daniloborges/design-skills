// Lê os estilos de texto de um arquivo, com o PESO REAL de cada um — SOMENTE LEITURA.
// Rode nos dois arquivos: na origem (de onde vem a exploração) e no destino (que recebe o conjunto).
// Rode com figma_execute (figma-console MCP, com o fileKey de cada arquivo) ou use_figma.
//
// Devolve linhas compactas:
//   estilos → nome|fonte do estilo|tamanho/entrelinha|tracking|caixa|peso real medido num texto|usos
//   fontes  → as instâncias disponíveis de cada família usada (para escolher a do peso real)
//   frame   → com `frame`, cada texto do frame: estilo|cor|amostra, na ordem de leitura
//   cores   → as variáveis de cor do arquivo (nome e hex), para o de-para de cor
//
// ARGS: no figma_execute, ponha `const ARGS = { frame: '4:3', semEstilosDe: 'da:chat' };` antes do script;
// no figma-run, `--set frame=4:3` para um valor simples ou `--args arquivo.json` para vários.
// Num arquivo grande a saída passa do limite da ferramenta: `semEstilosDe` tira da lista os estilos de um prefixo
// (eles continuam contados em "conjuntos de componente"), e `semCores: true` tira a lista de cores.

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const FRAME = _A.frame ?? null;                 // id do frame de exploração (na origem)
const SKIP = _A.skip ?? /^(_deprecated\/|novo\/)/; // estilos que não entram

// ── Estilos com peso real ──────────────────────────────────────────────────
await figma.loadAllPagesAsync();
const styles = (await figma.getLocalTextStylesAsync()).filter(s => !SKIP.test(s.name));
const ids = new Set(styles.map(s => s.id));
// Peso real = o mais frequente entre os textos do estilo (com a contagem), nunca só o primeiro
const uso = {}, pesos = {};
for (const t of figma.root.findAll(n => n.type === 'TEXT')) {
  const id = t.textStyleId;
  if (typeof id !== 'string' || !ids.has(id)) continue;
  uso[id] = (uso[id] || 0) + 1;
  if (typeof t.fontWeight === 'number') { pesos[id] ??= {}; pesos[id][t.fontWeight] = (pesos[id][t.fontWeight] || 0) + 1; }
}
const peso = Object.fromEntries(Object.entries(pesos).map(([id, m]) => {
  const ord = Object.entries(m).sort((a, b) => b[1] - a[1]);
  return [id, ord.length > 1 ? `${ord[0][0]} (de ${ord.map(([w, n]) => `${w}×${n}`).join(' ')})` : ord[0][0]];
}));
// Conjuntos de componente que já existem (<marca>:<componente>-<parte>)
const conjuntos = {};
for (const s of styles) { const m = /^([a-z0-9-]+:[a-z0-9]+)-/.exec(s.name); if (m) conjuntos[m[1]] = (conjuntos[m[1]] || 0) + 1; }
const lh = s => (s.lineHeight.unit === 'PIXELS' ? Math.round(s.lineHeight.value * 10) / 10 : s.lineHeight.unit === 'PERCENT' ? `${Math.round(s.lineHeight.value)}%` : 'auto');
const ls = s => (s.letterSpacing.unit === 'PIXELS' ? `${Math.round(s.letterSpacing.value * 100) / 100}px` : `${Math.round(s.letterSpacing.value * 100) / 100}%`);
const SEM = _A.semEstilosDe ?? null;
const linhas = styles.filter(s => !SEM || !s.name.startsWith(SEM + '-')).map(s => `${s.name}|${s.fontName.family} ${s.fontName.style}|${s.fontSize}/${lh(s)}|${ls(s)}|${s.textCase}|${peso[s.id] ?? '—'}|${uso[s.id] || 0}`);

// ── Fontes disponíveis por família ─────────────────────────────────────────
const familias = new Set(styles.map(s => s.fontName.family));
const disponiveis = {};
for (const f of await figma.listAvailableFontsAsync()) if (familias.has(f.fontName.family)) (disponiveis[f.fontName.family] ??= []).push(f.fontName.style);

// ── Frame de exploração ────────────────────────────────────────────────────
const hex = fills => {
  const p = Array.isArray(fills) && fills.find(f => f.type === 'SOLID' && f.visible !== false);
  if (!p) return '—';
  const h = '#' + [p.color.r, p.color.g, p.color.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  return p.opacity != null && p.opacity < 1 ? `${h}@${Math.round(p.opacity * 100)}` : h;
};
const byId = Object.fromEntries(styles.map(s => [s.id, s.name]));
let frame = [];
if (FRAME) {
  const f = await figma.getNodeByIdAsync(FRAME);
  if (!f) throw new Error(`Frame não encontrado: ${FRAME}`);
  frame = f.findAll(n => n.type === 'TEXT').map(t => `${typeof t.textStyleId === 'string' ? byId[t.textStyleId] ?? 'outro estilo' : t.textStyleId === figma.mixed ? 'misto' : 'sem estilo'}|${hex(t.fills)}${t.visible ? '' : '|oculto'}|${t.characters.slice(0, 40).replace(/\n/g, ' ')}`);
}

// ── Cores ──────────────────────────────────────────────────────────────────
const cores = [];
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) for (const id of c.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v.resolvedType !== 'COLOR') continue;
  const x = v.valuesByMode[c.modes[0].modeId];
  if (x?.type === 'VARIABLE_ALIAS') { cores.push(`${v.name}|alias`); continue; }
  cores.push(`${v.name}|#${[x.r, x.g, x.b].map(n => Math.round(n * 255).toString(16).padStart(2, '0')).join('')}${x.a < 1 ? '@' + Math.round(x.a * 100) : ''}`);
}

return [
  `arquivo ${figma.root.name} · estilos ${styles.length} · cores ${cores.length}`,
  `conjuntos de componente: ${Object.entries(conjuntos).map(([k, n]) => `${k} (${n})`).join(', ') || 'nenhum'}`,
  '# estilos: nome|fonte do estilo|tamanho/entrelinha|tracking|caixa|peso real|usos',
  ...linhas,
  '# fontes disponíveis',
  ...Object.entries(disponiveis).map(([f, st]) => `${f}: ${st.join(', ')}`),
  ...(FRAME ? ['# frame: estilo|cor|amostra', ...frame] : []),
  ...(_A.semCores ? [] : ['# cores: variável|hex', ...cores]),
].join('\n');
