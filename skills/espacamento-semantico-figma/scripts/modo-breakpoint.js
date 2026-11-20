// Modo de breakpoint: acrescenta o modo Mobile à coleção `Spacing`, com cada semântico apontando para outro primitivo.
// Rode com figma_execute (figma-console MCP) ou use_figma (Figma MCP oficial). Regras: espacamento.md
// ("Modo de breakpoint") e modos.md.
//
// Rode sempre com dryRun: true primeiro. O dry-run não escreve nada e devolve:
//   plano     → uma linha por token: primitivo no Desktop → primitivo no Mobile
//   outras    → outras coleções com modos de tela: com elas, cada frame mobile precisa de duas chaves
//   frames    → por frame em `frames`: quantos gap/padding estão ligados a `Spacing` e quantos estão soltos
//   bloqueios → token sem primitivo correspondente, ou Desktop fora do primeiro lugar
// Com dryRun: false, renomeia o primeiro modo para Desktop (se for `Default` ou `Mode 1`), cria o modo Mobile
// (se faltar), reaponta os tokens e aplica `setMode`. Rodar de novo repara: reaponta para os mesmos valores.
//
// ARGS: no figma_execute, ponha `const ARGS = { dryRun: true, ... };` antes do script; no figma-run, `--args arquivo.json`.
// Aqui `collection` é a coleção semântica de espaço (padrão 'Spacing'), diferente do `collection` do responsivo.js.

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const DRY_RUN = _A.dryRun ?? true;
const SPACING = _A.collection ?? 'Spacing';
const PRIMITIVES = _A.primitives ?? 'Primitives';
const DESKTOP = _A.desktop ?? 'Desktop';
const MOBILE_MODE = _A.mobileMode ?? 'Mobile';
// px no Mobile por token; o padrão é a tabela de espacamento.md
const MOBILE = Object.assign(
  { '3xs': 2, '2xs': 4, xs: 8, sm: 12, md: 16, lg: 16, xl: 24, '2xl': 32, 'layout/sm': 48, 'layout/md': 48, 'layout/lg': 64, 'layout/xl': 80 },
  _A.mobile ?? {},
);
const FRAMES = _A.frames ?? 'auto'; // ids de frames mobile para contar ligados × soltos; 'auto' = telas em pé de 320 a 480 px de largura, ou com um modo 'Mobile' explícito
const SET_MODE = _A.setMode ?? {};  // { '<id do frame>': 'Mobile' }
const PAGE = _A.page ?? null;       // nome da página onde procurar os frames; null = a página aberta

// ── Coleções ────────────────────────────────────────────────────────────────
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const sp = cols.find(c => c.name === SPACING || c.id === SPACING);
const pr = cols.find(c => c.name === PRIMITIVES || c.id === PRIMITIVES);
if (!sp || !pr) throw new Error(`Coleção não encontrada: ${!sp ? SPACING : PRIMITIVES}. Rode o fluxo principal da skill antes.`);
const isViewport = c => c !== sp && [DESKTOP, MOBILE_MODE].every(m => c.modes.some(x => x.name === m));
const outras = cols.filter(isViewport).map(c => c.name);
const bloqueios = [];
const first = sp.modes[0].name;
if (first !== DESKTOP && first !== 'Default' && first !== 'Mode 1') bloqueios.push(`o primeiro modo de ${SPACING} é "${first}"; renomeie para ${DESKTOP}`);

const P = {};
for (const id of pr.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); P[v.name] = v; }
const tokens = [];
for (const id of sp.variableIds) tokens.push(await figma.variables.getVariableByIdAsync(id));

const plano = [], jobs = [];
const deskModeId = sp.modes[0].modeId;
const mobExisting = sp.modes.find(m => m.name === MOBILE_MODE);
if (first !== DESKTOP) plano.push(`modo "${first}" de ${SPACING} → renomeado para ${DESKTOP} (valores intocados)`);
if (mobExisting) plano.push(`${SPACING} já tem o modo ${MOBILE_MODE}: rodar de novo reaponta cada token para o valor abaixo (repara o que mudou à mão)`);
const aliasName = async val => (val?.type === 'VARIABLE_ALIAS' ? (await figma.variables.getVariableByIdAsync(val.id))?.name : String(val));
for (const v of tokens) {
  const [grupo, passo] = v.name.split('/');
  const px = grupo === 'layout' ? MOBILE[v.name] : MOBILE[passo];
  const alvo = P[`space/${px}`];
  const deskName = await aliasName(v.valuesByMode[deskModeId]);
  if (px === undefined || !alvo) { bloqueios.push(`${v.name}: sem primitivo space/${px ?? '?'}`); continue; }
  const hoje = mobExisting ? await aliasName(v.valuesByMode[mobExisting.modeId]) : null;
  plano.push(`${v.name}: ${deskName} → space/${px}${hoje && hoje !== `space/${px}` ? ` (hoje ${hoje})` : ''}`);
  jobs.push({ v, alvo });
}

// ── Ligados × soltos ────────────────────────────────────────────────────────
const PROPS = ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
const ids = new Set(sp.variableIds);
const frames = [];
const modeNames = Object.fromEntries(cols.flatMap(c => c.modes.map(m => [m.modeId, m.name])));
const pg = PAGE ? figma.root.children.find(p => p.name === PAGE) : figma.currentPage;
if (!pg) throw new Error(`Página não encontrada: ${PAGE}`);
await pg.loadAsync();
const tops = pg.children.flatMap(n => (n.type === 'SECTION' ? n.children : [n])).filter(n => n.type === 'FRAME');
const isMobile = f => (f.width >= 320 && f.width <= 480 && f.height >= 1.2 * f.width) || Object.values(f.explicitVariableModes || {}).some(id => modeNames[id] === MOBILE_MODE);
const alvos = FRAMES === 'auto' ? tops.filter(isMobile) : (await Promise.all(FRAMES.map(id => figma.getNodeByIdAsync(id)))).filter(Boolean);
if (FRAMES === 'auto' && !tops.some(f => !isMobile(f))) bloqueios.push(`a página "${pg.name}" não tem frame de desktop: confira page antes de criar um breakpoint`);
if (FRAMES === 'auto' && !alvos.length) bloqueios.push(`nenhum frame mobile na página "${pg.name}": passe page ou frames`);
for (const f of alvos) {
  let ligados = 0, soltos = 0;
  for (const n of [f, ...f.findAll(n => 'layoutMode' in n && n.layoutMode !== 'NONE')]) {
    if (!('layoutMode' in n) || n.layoutMode === 'NONE') continue;
    for (const k of PROPS) {
      if (k === 'itemSpacing' && n.primaryAxisAlignItems === 'SPACE_BETWEEN') continue;
      const b = n.boundVariables?.[k];
      if (b && ids.has(b.id)) ligados++;
      else if (n[k] >= 2) soltos++;
    }
  }
  frames.push(`${f.name} (${f.id}, ${Math.round(f.width)} px): ${ligados} ligados · ${soltos} soltos (só os ligados respondem ao modo)`);
}

if (DRY_RUN) return { dryRun: true, pagina: pg.name, colecao: SPACING, modo: MOBILE_MODE, outras, bloqueios, frames, plano };
if (bloqueios.length) throw new Error('Há bloqueios; resolva antes de aplicar:\n' + bloqueios.join('\n'));

// ── Aplicar ─────────────────────────────────────────────────────────────────
if (sp.modes[0].name !== DESKTOP) sp.renameMode(sp.modes[0].modeId, DESKTOP);
let mob = sp.modes.find(m => m.name === MOBILE_MODE);
const mobId = mob ? mob.modeId : sp.addMode(MOBILE_MODE);
for (const { v, alvo } of jobs) v.setValueForMode(mobId, figma.variables.createVariableAlias(alvo));
for (const [id, modo] of Object.entries(SET_MODE)) {
  const n = await figma.getNodeByIdAsync(id);
  const m = sp.modes.find(x => x.name === modo);
  if (n && m) n.setExplicitVariableModeForCollection(sp, m.modeId);
}
return { dryRun: false, colecao: SPACING, modo: MOBILE_MODE, reapontados: jobs.length, outras, frames };
