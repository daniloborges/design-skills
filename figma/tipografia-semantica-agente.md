---
name: tipografia-semantica
description: Organiza os estilos de texto do arquivo em nomes semânticos (papel/tamanho), com preview ANTES × DEPOIS, aplicação aprovada, ordenação e página de inventário. Use com /tipografia-semantica para auditar, renomear ou consolidar estilos de texto.
---

# Tipografia semântica — agente do Figma (v6)

Transforma estilos de texto nomeados por aparência (`Fraunces/Light wght 380`, `Inter/Regular`) em nomes semânticos (`heading/xl`, `body/md`), mostra o impacto num preview e só então aplica. Termina com a lista de estilos ordenada e uma página **📖 Tipografia** de referência.

**Use quando:** pedirem para revisar, renomear, consolidar ou criar estilos de texto, ou achar textos sem estilo.
**Não use:** para mudar layout ou conteúdo de textos, ou para criar uma escala do zero a partir de um texto selecionado (para isso existe a skill "Make a type scale").

## Como conduzir

Seis etapas: **Inventário → Decisões → Mapa e preview → Aprovação → Aplicação → Verificação**. Você só para em **Decisões** e **Aprovação**. As outras etapas seguem direto, na mesma resposta.

- **O usuário é designer: mostre, não descreva.** Tabelas, mapas e comparações são desenhados no canvas pelos blocos, nunca escritos no chat. No chat, no máximo 5 linhas por etapa.
- **Use os sinais do Figma.** Se houver frame selecionado, ele é a base do preview: avise ("Vou usar a seleção: <nome>") e siga. Se não houver, use a amostra que o inventário escolheu e diga isso numa linha.
- **Não trave por detalhe técnico.** Diferenças que não mudam a decisão (eixo de fonte indisponível, tamanho óptico, arredondamento, fonte que demora a carregar) não são perguntas: siga com o padrão e registre numa linha "Aviso: …". Pare só quando for impossível continuar ou quando a escolha mudar o resultado.
- **O código dos blocos A, B e C é para rodar como está.** Edite só a configuração no topo de cada bloco. Se um bloco falhar por uma API indisponível neste ambiente, faça o ajuste mínimo para ele rodar, sem mudar a lógica, e avise numa linha.
- **Quando parar, termine com o pedido em negrito**, como pergunta direta, com opções numeradas e uma marcada *(padrão)*. Embaixo, uma linha "Depois: <o que acontece>". Não escreva rodapé de status nem repita o que já foi dito.
- **Se algo falhar pela metade:** diga em uma linha o que ficou feito e o que não ficou, e peça o que precisa.
- **No fim:** uma linha "Pronto." com estilos antes → depois.

## Regras de nome (lista fechada)
- Formato `papel/tamanho`, com **no máximo um** modificador: `-emphasis` (itálico) ou `-strong` (peso **real** maior).
- Só os nomes da tabela. `label/lg`, `lead/xl` e `-emphasis-strong` **não existem**. Se algo não couber, pergunte.
- Nunca nomeie por fonte, peso ou pixel. O padrão é sem prefixo de marca.
- O papel define o HTML: `heading/*` é sempre h1–h6, e **só um estilo tem h1 como padrão**. Link herda o estilo do contexto. Logo e ornamentos de marca ficam sem estilo.

| Nome | Faixa (px) | HTML |
|---|---|---|
| display/xl · lg · md | ≥120 · 80–119 · 57–79 | h1/h2, ou p decorativo |
| heading/xl · lg · md · sm | 40–56 · 32–39 · 24–31 · 20–23 | h1–h6 |
| heading/xs · 2xs | 16–19 · 14–15 (peso ≥500) | h4–h6 |
| lead/lg · md | 24–32 · 18–23 | p |
| body/lg · md · sm | 16–18 · 14–15 · 12–13 | p, li |
| label/md · sm | 13–14 · 12 (peso ≥500) | button, a, span |
| caption/md · sm | 12–13 · 11 | figcaption, small |
| eyebrow/md · sm | 12 · 11, caixa alta + tracking | p antes do título (nunca h) |
| code/md · sm | 13–14 · 12, mono | code, time |
| legal/md | ≥16 | small, p |
| big-number/lg · md | 56–120 · 20–55 | p ou dd (nunca h) |
| index/md | 14–20, "(01)" | span decorativo |

As faixas sugerem; a função decide. Em site editorial a escala é maior (título de seção de 84 px = `heading/xl`): defina a escala do projeto uma vez e use a mesma em todas as linhas.

**Pisos** (corrija sempre subindo):

| Texto | Mínimo | Nível |
|---|---|---|
| Qualquer texto | 11 px | bloqueante |
| Texto legal | 16 px | bloqueante |
| Corpo (`body/md`+, `lead`) | 14 px | alerta |
| label, caption/md, code, eyebrow/md, body/sm | 12 px | alerta |
| Contraste | 4,5:1 (texto grande 3:1) | bloqueante |

**Armadilhas conhecidas**
- **"Black" que é Light:** o bloco A lista em `pesoRealDiferenteDoNome` os textos cujo nome de instância não bate com o peso real. Siga o peso real e nunca crie `-strong` por causa do nome.
- **Mesmo estilo em dois grupos:** grupos que diferem em menos de 100 de peso ou em menos de 0,5 px de tamanho são o mesmo estilo; junte-os num alvo, usando `from`.
- **Mesma peça em idiomas diferentes** (EN/PT) com tamanhos diferentes: unifique e pergunte.
- **Chip ou tag é `label/sm`**, não caption. Rótulos de variante e frames de documentação já são ignorados pelo bloco A.

---

## 1. Inventário (segue direto)

Rode o **BLOCO A** (`SCOPE = 'page'`, ou `'all-pages'` se os textos estiverem em várias páginas). No chat, até 5 linhas: totais, fontes, peso real ≠ nome, nº de grupos, duplicados, bloqueantes. Não liste os grupos: guarde o resultado para o PLAN.

## 2. Decisões (para aqui, só se houver o que decidir)

Junte numa mensagem só as perguntas que o inventário exigir, cada uma numerada, com o padrão marcado. O usuário responde algo como "1, 1, 1". Exemplo:

> **A) "Fraunces Black" tem wght 360–380, o mesmo peso dos Light. Como trato?** 1. Pelo peso real *(padrão)* · 2. Como `-strong`
> **B) A intro está em 24 px (EN) e 40 px (PT). Qual vale?** 1. 24 px *(padrão)* · 2. 40 px · 3. Manter diferente
> **C) Prefixo de marca nos nomes?** 1. Sem prefixo *(padrão)* · 2. Com prefixo, diga qual
>
> Depois: desenho o mapa e o preview no canvas.

Se a resposta for ambígua, pergunte de novo, mais estreito. Se não houver nada a decidir, siga direto.

## 3. Mapa e preview (segue direto)

1. Monte o `PLAN` do BLOCO B: um item por **estilo final** (meta: 20–30 em site, 15–25 em produto), com:
   - `copyFrom`: a chave do grupo principal;
   - `from`: as outras chaves que viram esse estilo;
   - `set`: só o que muda, por exemplo o tamanho que sobe ao piso;
   - `description` (ex.: `'HTML: h2 · título de seção'`) e `uses` (a soma dos usos).
2. Rode o **BLOCO B** com `MODE = 'mapa'`. Ele cria os `novo/*` e desenha o **🗺 Mapa tipografia** na página 🔍.
3. Rode o **BLOCO B** com `MODE = 'preview'`:
   - `PREVIEW_ROOTS = 'selection'` se havia frame selecionado;
   - senão, os ids de `escopoPreview` do bloco A.

   Ele duplica os frames na página 🔍 (ANTES × DEPOIS), aplica os `novo/*` no DEPOIS e marca as mudanças (azul = só estilo, laranja = muda visual).
4. Rode o **BLOCO C** com `A` igual ao `inventario` que o bloco B devolveu. Isso cria o inventário de tipografia ao lado.

## 4. Aprovação (para aqui)

No chat: estilos antes → depois, quantos mudam visual, exceções e avisos, em até 4 linhas. Termine com:

> **Confere a página 🔍 Preview tipografia. Como sigo?**
> 1. Aplicar no arquivo *(padrão)*
> 2. Ajustar — diga a linha do mapa (redesenho)
> 3. Descartar — apago o preview e os `novo/*`
>
> Depois: aplico, ordeno a lista e levo o inventário para a página 📖 Tipografia.

Em 2: ajuste o PLAN e repita a etapa 3. Em 3: rode o BLOCO B com `MODE = 'descartar'` e diga "Descartado.".

## 5. Aplicação (segue direto)

Rode o **BLOCO B** com `MODE = 'promover'` e `ORIGIN` = a página de trabalho. Antes, confira as contagens com `DRY_RUN = true`. O bloco:
- renomeia os estilos antigos para `_deprecated/…` (**nunca apaga**);
- transforma os `novo/*` nos nomes finais e aplica pela spec real;
- **move** o inventário do preview para a página **📖 Tipografia** e atualiza os usos (não gera de novo);
- apaga a página 🔍 e ordena a lista.

Só rode o BLOCO C com `A = { page: '📖 Tipografia' }` se o bloco B avisar que não achou o inventário do preview.

## 6. Verificação (segue direto)

Rode o **BLOCO A** de novo e confira:
- nenhum texto sem estilo, além das exceções;
- nenhum nome fora da lista fechada;
- nenhum `-strong` só por causa do nome da instância;
- nada abaixo de 11 px;
- lista ordenada;
- página 📖 criada e página 🔍 apagada.

No chat: "Pronto. Estilos 95 → 29 · sem estilo 187 → 3 · pendências: …". Se algo falhou, liste só isso.

---

## BLOCO A — inventário (só leitura)

```js
// BLOCO A — INVENTÁRIO (só leitura). Edite só SCOPE.
const SCOPE = 'page'; // 'page' (página atual) | 'selection' | 'all-pages'
const EXCLUDE = /(^|[\s/_-])(doc|docs|spec|specimen|especime|espécime|annotation|anota|legend|legenda)([\s/_-]|$)|^_|^🔍|^📖/i;
const EXCLUDE_TEXT = /^(variant|property|state|default|hover|pressed|focus|disabled)\b|^(true|false)$/i;
const r = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const NW = { thin: 100, extralight: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
const nameW = (st) => NW[st.toLowerCase().replace(/italic|oblique|\s|-/g, '')] ?? 400;
const realW = (fn, fw) => fn.variationSettings?.wght ?? fw ?? nameW(fn.style); // PESO REAL, não o nome da instância
const it = (st) => /italic|oblique/i.test(st);
const fLH = (lh) => lh.unit === 'AUTO' ? 'auto' : lh.unit === 'PERCENT' ? `${r(lh.value)}%` : `${r(lh.value)}px`;
const fLS = (ls, sz) => ls.unit === 'PERCENT' ? `${r(sz * ls.value / 100)}px` : `${r(ls.value)}px`;
const key = (s, w) => [s.fontName.family, `${Math.round(w)}${it(s.fontName.style) ? 'i' : ''}`, r(s.fontSize, 1), fLH(s.lineHeight), fLS(s.letterSpacing, s.fontSize), s.textCase || 'ORIGINAL'].join('|');
const lum = ({ r: R, g: G, b: B }) => [R, G, B].map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
const solid = (f) => Array.isArray(f) ? f.find(p => p.type === 'SOLID' && p.visible !== false && (p.opacity ?? 1) > 0.5) : null;
function contrast(n) { const f = solid(n.fills); if (!f) return null; let p = n.parent, bg = { r: 1, g: 1, b: 1 }; while (p && p.type !== 'PAGE') { const s = 'fills' in p ? solid(p.fills) : null; if (s) { bg = s.color; break; } p = p.parent; } const a = lum(f.color), b = lum(bg); return r((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)); }
const excluded = (t) => { if (EXCLUDE_TEXT.test(t.characters.trim())) return true; for (let p = t.parent; p && p.type !== 'PAGE'; p = p.parent) if (EXCLUDE.test(p.name)) return true; return false; };
const topOf = (n) => { while (n.parent && n.parent.type !== 'PAGE') n = n.parent; return n; };

let roots;
if (SCOPE === 'all-pages') { await figma.loadAllPagesAsync(); roots = figma.root.children.filter(p => !/^🔍|^📖/.test(p.name)); }
else if (SCOPE === 'selection') roots = figma.currentPage.selection;
else roots = [figma.currentPage];
const texts = roots.flatMap(n => n.type === 'TEXT' ? [n] : 'findAllWithCriteria' in n ? n.findAllWithCriteria({ types: ['TEXT'] }) : []);
const styles = await figma.getLocalTextStylesAsync();
const sName = Object.fromEntries(styles.map(s => [s.id, s.name]));
const groups = {}, uses = {}, frames = new Map(), mism = new Map();
const tot = { textos: 0, ignorados: 0, semEstilo: 0, mistos: 0, emInstancias: 0, menor11: 0, menor12: 0, contrasteBaixo: 0 };
const fracs = new Set(), lowC = [];
for (const t of texts) {
  if (excluded(t)) { tot.ignorados++; continue; }
  tot.textos++; if (t.id.startsWith('I')) tot.emInstancias++;
  const segs = t.getStyledTextSegments(['fontName', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'textCase', 'textStyleId']);
  if (segs.length > 1) tot.mistos++;
  if (!segs.every(s => s.textStyleId)) tot.semEstilo++;
  const top = topOf(t); if (!frames.has(top.id)) frames.set(top.id, { id: top.id, name: top.name, n: 0, keys: new Set() }); frames.get(top.id).n++;
  for (const s of segs) {
    const w = realW(s.fontName, s.fontWeight);
    if (Math.abs(w - nameW(s.fontName.style)) >= 200) { const k = `${s.fontName.family} "${s.fontName.style}" = wght ${Math.round(w)}`; mism.set(k, (mism.get(k) || 0) + 1); }
    if (s.textStyleId) uses[s.textStyleId] = (uses[s.textStyleId] || 0) + 1;
    const k = key(s, w);
    const g = groups[k] ||= { key: k, n: 0, estilos: new Set(), ex: [] };
    g.n++; if (s.textStyleId) g.estilos.add(sName[s.textStyleId] || '(externo)'); if (g.ex.length < 2) g.ex.push(s.characters.trim().slice(0, 28));
    frames.get(top.id).keys.add(k);
    if (s.fontSize < 11) tot.menor11++; else if (s.fontSize < 12) tot.menor12++;
    if (s.fontSize % 1) fracs.add(r(s.fontSize, 1));
  }
  const c = contrast(t); const fs = t.fontSize === figma.mixed ? 0 : t.fontSize;
  if (c !== null && c < (fs >= 24 ? 3 : 4.5)) { tot.contrasteBaixo++; if (lowC.length < 8) lowC.push(`${t.characters.trim().slice(0, 20)} (${c}:1)`); }
}
const bySpec = {}; for (const s of styles.filter(s => !s.name.startsWith('_deprecated/'))) (bySpec[key(s, realW(s.fontName))] ||= []).push(s.name);
const allKeys = Object.keys(groups), covered = new Set(), amostra = [];
while (covered.size < allKeys.length) { let best = null, gain = 0; for (const f of frames.values()) { const g = [...f.keys].filter(k => !covered.has(k)).length; if (g > gain) { best = f; gain = g; } } if (!best) break; amostra.push({ id: best.id, nome: best.name.slice(0, 40), textos: best.n }); best.keys.forEach(k => covered.add(k)); }
return {
  totais: { ...tot, estilosLocais: styles.length, grupos: allKeys.length },
  pesoRealDiferenteDoNome: [...mism].map(([k, n]) => `${k} (${n}×)`),
  fontes: [...new Set(allKeys.map(k => k.split('|')[0]))],
  grupos: Object.values(groups).sort((a, b) => parseFloat(b.key.split('|')[2]) - parseFloat(a.key.split('|')[2])).map(g => `${g.key} · ${g.n}× · ${[...g.estilos].join(', ') || 'sem estilo'} · "${g.ex.join('" / "')}"`),
  estilosDuplicados: Object.values(bySpec).filter(a => a.length > 1),
  estilosSemUso: styles.filter(s => !uses[s.id]).map(s => s.name),
  tamanhosFracionados: [...fracs].sort((a, b) => a - b),
  contrasteBaixoExemplos: lowC,
  escopoPreview: tot.textos <= 400 ? { modo: 'página inteira' } : { modo: 'amostra', frames: amostra },
};
```

## BLOCO B — preview · promover · descartar · ordenar

```js
// BLOCO B — PREVIEW · PROMOVER · DESCARTAR · ORDENAR. Edite só o bloco de configuração.
// ── configuração ─────────────────────────────────────────────
const MODE = 'mapa';           // 'mapa' | 'preview' | 'promover' | 'descartar' | 'ordenar'
const DRY_RUN = false;         // em 'promover': true = só conta, não altera
const ORIGIN = null;           // nome da página de trabalho (null = página atual). Informe sempre que a página atual não for a de trabalho.
const PREVIEW_ROOTS = 'selection'; // 'selection' = frames selecionados · 'page' = todos os frames da página · ['id', 'id'] = amostra do bloco A
// Um item por ESTILO FINAL. copyFrom = chave de um grupo do bloco A (copia fonte, peso real, tamanho, entrelinha…);
// from = outras chaves que viram este estilo; set = o que muda (ex. tamanho que sobe ao piso); uses = nº de trechos (só para o mapa).
const PLAN = [
  // { name: 'heading/xl', copyFrom: 'Fraunces|380|84|84px|-1.85px|ORIGINAL', from: [], description: 'HTML: h2 · título de seção' },
  // { name: 'label/sm', copyFrom: 'Inter|400|10.3|17px|0.55px|ORIGINAL', from: ['Inter|400|10.1|17px|0.55px|ORIGINAL'], description: 'HTML: span · tag', set: { fontSize: 12, lineHeight: { unit: 'PIXELS', value: 18 } } },
];
// ─────────────────────────────────────────────────────────────
const PV = '🔍 Preview tipografia', MAPA = '🗺 Mapa tipografia';
const r = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const NW = { thin: 100, extralight: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
const realW = (fn, fw) => fn.variationSettings?.wght ?? fw ?? (NW[fn.style.toLowerCase().replace(/italic|oblique|\s|-/g, '')] ?? 400);
const it = (st) => /italic|oblique/i.test(st);
const fLH = (lh) => lh.unit === 'AUTO' ? 'auto' : lh.unit === 'PERCENT' ? `${r(lh.value)}%` : `${r(lh.value)}px`;
const fLS = (ls, sz) => ls.unit === 'PERCENT' ? `${r(sz * ls.value / 100)}px` : `${r(ls.value)}px`;
const key = (s, w) => [s.fontName.family, `${Math.round(w)}${it(s.fontName.style) ? 'i' : ''}`, r(s.fontSize, 1), fLH(s.lineHeight), fLS(s.letterSpacing, s.fontSize), s.textCase || 'ORIGINAL'].join('|');
const VALID = /^(?:[^/]+\/)?(display\/(xl|lg|md)|heading\/(xl|lg|md|sm|xs|2xs)|lead\/(lg|md)|body\/(lg|md|sm)|label\/(md|sm)|caption\/(md|sm)|eyebrow\/(md|sm)|code\/(md|sm)|legal\/md|big-number\/(lg|md)|index\/md)(-(emphasis|strong))?$/;
const out = { modo: MODE, erros: [] };
const loaded = new Set();
const load = async (fn) => { const k = fn.family + '|' + fn.style; if (!loaded.has(k)) { await figma.loadFontAsync({ family: fn.family, style: fn.style }); loaded.add(k); } };
let styles = await figma.getLocalTextStylesAsync();
const byName = (n) => styles.find(s => s.name === n);
const texts = (nodes) => nodes.flatMap(n => n.type === 'TEXT' ? [n] : 'findAllWithCriteria' in n ? n.findAllWithCriteria({ types: ['TEXT'] }) : []);

async function ordenar() {
  // O Figma só reordena estilos dentro da mesma pasta; pastas se ordenam com moveLocalTextFolderAfter.
  const ROLES = ['display', 'heading', 'lead', 'body', 'label', 'caption', 'eyebrow', 'code', 'legal', 'big-number', 'index'];
  const SIZES = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs', '2xs'], MODS = ['', 'emphasis', 'strong'];
  const list = await figma.getLocalTextStylesAsync();
  const folders = new Map();
  for (const s of list) { const f = s.name.split('/').slice(0, -1).join('/'); if (!folders.has(f)) folders.set(f, []); folders.get(f).push(s); }
  const lk = (n) => { const m = /^([0-9]*x?[a-z]+)(?:-(.+))?$/.exec(n.split('/').pop()) || []; const a = SIZES.indexOf(m[1]), b = MODS.indexOf(m[2] || ''); return [a < 0 ? 99 : a, b < 0 ? 9 : b]; };
  for (const arr of folders.values()) { const s = [...arr].sort((x, y) => { const a = lk(x.name), b = lk(y.name); return a[0] - b[0] || a[1] - b[1] || x.name.localeCompare(y.name); }); for (let i = 1; i < s.length; i++) figma.moveLocalTextStyleAfter(s[i], s[i - 1]); }
  const rank = (t) => t === '_deprecated' ? 99 : t === 'novo' ? 60 : ROLES.indexOf(t) < 0 ? 50 : ROLES.indexOf(t);
  const tops = [...new Set(list.filter(s => s.name.includes('/')).map(s => s.name.split('/')[0]))].sort((a, b) => rank(a) - rank(b));
  try { figma.moveLocalTextFolderAfter(tops[0], null); for (let i = 1; i < tops.length; i++) figma.moveLocalTextFolderAfter(tops[i], tops[i - 1]); } catch (e) { out.erros.push('pastas: ' + e.message); }
  out.ordem = (await figma.getLocalTextStylesAsync()).map(s => s.name).filter(n => !n.startsWith('_deprecated/'));
}
if (MODE === 'ordenar') { await ordenar(); return out; }

if (MODE === 'descartar') {
  const p = figma.root.children.find(x => x.name === PV);
  if (p) { if (figma.currentPage === p) await figma.setCurrentPageAsync(figma.root.children.find(x => x !== p)); p.remove(); }
  for (const s of styles.filter(s => s.name.startsWith('novo/'))) s.remove();
  out.removido = 'página de preview e estilos novo/*'; return out;
}

// preview / promover: valida e resolve a spec de cada alvo
for (const t of PLAN) if (!VALID.test(t.name)) out.erros.push(`nome fora da lista fechada: ${t.name}`);
if (out.erros.length) return out;
let origin = ORIGIN ? figma.root.children.find(p => p.name === ORIGIN) : figma.currentPage;
if (origin && origin.name === PV) origin = figma.root.children.find(p => p.name !== PV && !p.name.startsWith('📖')); // se estiver na 🔍, usa a primeira página de trabalho (ou informe ORIGIN)
if (!origin || origin.type !== 'PAGE' || origin.name === PV) { out.erros.push('volte para a página de trabalho (ou informe ORIGIN) antes de rodar'); return out; }
await origin.loadAsync?.();
const need = new Set(PLAN.flatMap(t => [t.copyFrom, ...(t.from || [])])), found = new Map();
for (const tx of texts([origin])) { if (found.size === need.size) break; for (const sg of tx.getStyledTextSegments(['fontName', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'textCase'])) { const k = key(sg, realW(sg.fontName, sg.fontWeight)); if (need.has(k) && !found.has(k)) found.set(k, sg); } }
for (const t of PLAN) { const sg = found.get(t.copyFrom); if (!sg) { out.erros.push(`copyFrom não encontrado: ${t.copyFrom}`); continue; } t.spec = { fontName: sg.fontName, fontSize: sg.fontSize, lineHeight: sg.lineHeight, letterSpacing: sg.letterSpacing, textCase: sg.textCase, ...(t.set || {}) }; }
if (out.erros.length) return out;
const setSpec = async (st, t) => { await load(t.spec.fontName); st.fontName = t.spec.fontName; st.fontSize = t.spec.fontSize; st.lineHeight = t.spec.lineHeight; st.letterSpacing = t.spec.letterSpacing; st.textCase = t.spec.textCase; st.description = t.description || ''; };
const lhPx = (lh, sz) => lh.unit === 'PIXELS' ? lh.value : lh.unit === 'PERCENT' ? lh.value * sz / 100 : 1.2 * sz;
async function applyTo(list, bySpec, dry, touched) {
  let n = 0;
  for (const tx of list) {
    if (tx.hasMissingFont) continue;
    for (const s of tx.getStyledTextSegments(['fontName', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'textCase', 'textStyleId'])) {
      const dst = bySpec.get(key(s, realW(s.fontName, s.fontWeight))); if (!dst || dst.id === s.textStyleId) continue;
      n++;
      if (touched) touched.set(tx, (touched.get(tx) || false) || Math.abs(s.fontSize - dst.fontSize) >= 0.5 || Math.abs(lhPx(s.lineHeight, s.fontSize) - lhPx(dst.lineHeight, dst.fontSize)) >= 0.5 || Math.abs(realW(s.fontName, s.fontWeight) - realW(dst.fontName)) >= 50);
      if (!dry) { await load(s.fontName); await load(dst.fontName); await tx.setRangeTextStyleIdAsync(s.start, s.end, dst.id); }
    }
  }
  return n;
}

if (MODE === 'mapa') {
  // Desenha o mapa no canvas: uma linha por estilo final, com ANTES (cada grupo de origem na spec original) e DEPOIS (o estilo novo/*).
  const target = new Map();
  for (const t of PLAN) { const nm = `novo/${t.name}`; const st = byName(nm) || figma.createTextStyle(); st.name = nm; await setSpec(st, t); target.set(t.name, st); }
  let page = figma.root.children.find(p => p.name === PV); if (!page) { page = figma.createPage(); page.name = PV; }
  for (const c of page.children.filter(c => c.name === MAPA)) c.remove();
  const UI = { family: 'Inter', style: 'Regular' }, UB = { family: 'Inter', style: 'Bold' }; await load(UI); await load(UB);
  const GRAY = { r: 0.45, g: 0.45, b: 0.45 }, ORANGE = { r: 0.9, g: 0.4, b: 0.02 }, BLUE = { r: 0.15, g: 0.45, b: 0.95 };
  const frames = [];
  const fr = (parent, name, dir, gap, pad = 0, w) => { const f = figma.createFrame(); parent.appendChild(f); f.name = name; f.fills = []; frames.push([f, dir, gap, pad, w]); return f; };
  const tx = (parent, str, { f = UI, size = 12, color } = {}) => { const t = figma.createText(); parent.appendChild(t); t.fontName = f; t.fontSize = size; t.characters = String(str); if (color) t.fills = [{ type: 'SOLID', color }]; return t; };
  const sample = async (parent, str, sg, styleId) => { const t = figma.createText(); parent.appendChild(t); await load(sg.fontName); t.fontName = sg.fontName; t.characters = str || 'Aa'; if (styleId) await t.setTextStyleIdAsync(styleId); else { t.fontSize = sg.fontSize; t.lineHeight = sg.lineHeight; t.letterSpacing = sg.letterSpacing; t.textCase = sg.textCase; } return t; };
  const short = (sg) => (sg && sg.characters ? sg.characters.trim().split(/\s+/).slice(0, 3).join(' ').slice(0, 24) : 'Aa');
  const pk = (k) => { const [fam, w, size, lh] = k.split('|'); return { fam, w: parseInt(w), i: w.endsWith('i'), size: +size, lh }; };
  const board = fr(page, MAPA, 'VERTICAL', 16, 48); board.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  const head = fr(board, 'cabeçalho', 'VERTICAL', 8, 0);
  tx(head, 'Mapa de tipografia — proposta', { f: UB, size: 32 });
  tx(head, `${styles.filter(s => !s.name.startsWith('novo/') && !s.name.startsWith('_deprecated/')).length} estilos atuais → ${PLAN.length} estilos · laranja = muda visual · azul = só troca o estilo`, { size: 14, color: GRAY });
  const cols = fr(board, 'colunas', 'HORIZONTAL', 32, 0);
  for (const [txt, w] of [['ESTILO FINAL', 280], ['ANTES (grupos de origem)', 560], ['DEPOIS', 560], ['MUDANÇA', 260]]) { const c = fr(cols, txt, 'VERTICAL', 0, 0, w); tx(c, txt, { f: UB, size: 11, color: GRAY }); }
  let nVis = 0;
  for (const t of PLAN) {
    const tgt = { size: t.spec.fontSize, w: Math.round(realW(t.spec.fontName)), lh: fLH(t.spec.lineHeight) };
    const keys = [t.copyFrom, ...(t.from || [])], diffs = new Set();
    for (const k of keys) { const o = pk(k); if (Math.abs(o.size - tgt.size) >= 0.5) diffs.add(`tamanho ${o.size}→${r(tgt.size, 1)}`); if (Math.abs(o.w - tgt.w) >= 50) diffs.add(`peso ${o.w}→${tgt.w}`); if (o.lh !== tgt.lh) diffs.add(`entrelinha ${o.lh}→${tgt.lh}`); }
    const vis = diffs.size > 0; if (vis) nVis++;
    const row = fr(board, t.name, 'HORIZONTAL', 32, 0); row.paddingTop = 20; row.paddingBottom = 20; row.strokes = [{ type: 'SOLID', color: { r: 0.88, g: 0.88, b: 0.88 } }]; row.strokeTopWeight = 1; row.strokeBottomWeight = row.strokeLeftWeight = row.strokeRightWeight = 0;
    const c1 = fr(row, 'estilo', 'VERTICAL', 4, 0, 280);
    tx(c1, t.name, { f: UB, size: 16 }); if (t.description) tx(c1, t.description, { size: 12, color: GRAY });
    tx(c1, `${t.uses ?? '?'} usos · ${keys.length} grupo(s)`, { size: 12, color: GRAY });
    const c2 = fr(row, 'antes', 'VERTICAL', 12, 0, 560);
    for (const k of keys.slice(0, 6)) { const sg = found.get(k); if (!sg) continue; const g = fr(c2, k, 'VERTICAL', 2, 0, 560); await sample(g, short(sg), sg); const o = pk(k); tx(g, `${o.fam} ${o.w}${o.i ? ' itálico' : ''} · ${o.size}/${o.lh}`, { size: 11, color: GRAY }); }
    if (keys.length > 6) tx(c2, `+${keys.length - 6} grupos`, { size: 11, color: GRAY });
    const c3 = fr(row, 'depois', 'VERTICAL', 2, 0, 560);
    await sample(c3, short(found.get(t.copyFrom)), t.spec, target.get(t.name).id);
    tx(c3, `${t.spec.fontName.family} ${tgt.w}${it(t.spec.fontName.style) ? ' itálico' : ''} · ${r(tgt.size, 1)}/${tgt.lh}`, { size: 11, color: GRAY });
    const c4 = fr(row, 'mudança', 'VERTICAL', 4, 0, 260);
    tx(c4, vis ? 'Muda visual' : 'Só troca o estilo', { f: UB, size: 13, color: vis ? ORANGE : BLUE });
    for (const d of diffs) tx(c4, d, { size: 12, color: GRAY });
  }
  for (const [f, dir, gap, pad, w] of frames.reverse()) { f.layoutMode = dir; f.itemSpacing = gap; if (pad) f.paddingLeft = f.paddingRight = f.paddingTop = f.paddingBottom = pad; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; if (w) { if (dir === 'VERTICAL') { f.counterAxisSizingMode = 'FIXED'; f.resize(w, f.height); } } for (const c of f.children) if (c.type === 'TEXT' && w) { c.textAutoResize = 'HEIGHT'; c.resize(w, c.height); } }
  // colunas do cabeçalho: alinha com as linhas (mesmas larguras)
  out.mapa = { page: PV, linhas: PLAN.length, mudaVisual: nVis, soEstilo: PLAN.length - nVis };
  return out;
}

if (MODE === 'preview') {
  const target = new Map();
  for (const t of PLAN) { const nm = `novo/${t.name}`; const st = byName(nm) || figma.createTextStyle(); st.name = nm; await setSpec(st, t); target.set(t.name, st); }
  const bySpec = new Map(); for (const t of PLAN) for (const k of [t.copyFrom, ...(t.from || [])]) bySpec.set(k, target.get(t.name));
  let page = figma.root.children.find(p => p.name === PV);
  if (page) { for (const c of [...page.children]) if (c.name !== MAPA) c.remove(); } else { page = figma.createPage(); page.name = PV; }
  const ids = PREVIEW_ROOTS === 'selection' ? origin.selection.map(n => n.id) : PREVIEW_ROOTS === 'page' ? origin.children.map(n => n.id) : PREVIEW_ROOTS;
  if (!ids.length) { out.erros.push('nada selecionado: selecione um frame ou use os ids de escopoPreview'); return out; }
  const roots = []; for (const id of ids) { const n = await figma.getNodeByIdAsync(id); if (n && 'clone' in n && n.absoluteBoundingBox) roots.push(n); }
  const bb = (n) => n.absoluteBoundingBox;
  const minX = Math.min(...roots.map(n => bb(n).x)), maxX = Math.max(...roots.map(n => bb(n).x + bb(n).width)), minY = Math.min(...roots.map(n => bb(n).y)), shift = maxX - minX + 400;
  const after = [];
  for (const n of roots) { const a = n.clone(); page.appendChild(a); a.x = bb(n).x; a.y = bb(n).y; const b = n.clone(); page.appendChild(b); b.x = bb(n).x + shift; b.y = bb(n).y; after.push(b); }
  out.base = roots.map(n => n.name);
  const touched = new Map();
  out.trechos = await applyTo(texts(after), bySpec, false, touched);
  const marks = [];
  for (const [n, visual] of touched) { const bb = n.absoluteBoundingBox; if (!bb) continue; const rc = figma.createRectangle(); page.appendChild(rc); rc.name = visual ? 'muda visual' : 'só estilo'; rc.x = bb.x - 4; rc.y = bb.y - 4; rc.resize(Math.max(bb.width + 8, 1), Math.max(bb.height + 8, 1)); rc.fills = []; rc.strokes = [{ type: 'SOLID', color: visual ? { r: 0.96, g: 0.45, b: 0.05 } : { r: 0.15, g: 0.45, b: 0.95 } }]; rc.strokeWeight = visual ? 4 : 2; marks.push(rc); }
  if (marks.length) { const g = figma.group(marks, page); g.name = '⚑ Mudanças (azul = só estilo · laranja = muda visual)'; g.locked = true; }
  await load({ family: 'Inter', style: 'Bold' });
  for (const [txt, x] of [['ANTES', minX], ['DEPOIS', minX + shift]]) { const t = figma.createText(); page.appendChild(t); t.fontName = { family: 'Inter', style: 'Bold' }; t.fontSize = 160; t.characters = txt; t.x = x; t.y = minY - 320; }
  out.marcados = { soEstilo: [...touched.values()].filter(v => !v).length, mudaVisual: [...touched.values()].filter(Boolean).length };
  out.inventario = { page: PV, prefix: 'novo/', usesScope: 'page:' + PV, x: minX + shift * 2, y: minY, title: 'Tipografia (preview)' }; // rode o BLOCO C com estes valores
  const mp = page.children.find(c => c.name === MAPA); if (mp) { mp.x = minX - mp.width - 400; mp.y = minY; }
  out.estilosNovos = PLAN.length;
  await figma.setCurrentPageAsync(page); figma.viewport.scrollAndZoomIntoView(page.children);
  return out;
}

if (MODE === 'promover') {
  for (const t of PLAN) { if (!byName(`novo/${t.name}`)) out.erros.push(`novo/${t.name} não existe — rode o preview antes`); if (byName(t.name)) out.erros.push(`já existe "${t.name}" — renomeie ou inclua no mapa`); }
  if (out.erros.length) return out;
  const antigos = styles.filter(s => !s.name.startsWith('novo/') && !s.name.startsWith('_deprecated/'));
  out.depreciados = antigos.length; out.estilos = PLAN.length;
  const target = new Map(PLAN.map(t => [t.name, byName(`novo/${t.name}`)]));
  const bySpec = new Map(); for (const t of PLAN) for (const k of [t.copyFrom, ...(t.from || [])]) bySpec.set(k, target.get(t.name));
  if (!DRY_RUN) {
    for (const s of antigos) s.name = `_deprecated/${s.name}`;        // nunca apaga
    for (const t of PLAN) { const st = target.get(t.name); st.name = t.name; await setSpec(st, t); }
  }
  out.trechos = await applyTo(texts([origin]), bySpec, DRY_RUN);
  if (!DRY_RUN) {
    // Move o inventário do preview para a 📖 Tipografia (não gera de novo) e atualiza nomes e usos.
    const p = figma.root.children.find(x => x.name === PV);
    const inv = p && p.children.find(n => n.name === '📖 Inventário de tipografia');
    if (inv) {
      let ref = figma.root.children.find(x => x.name === '📖 Tipografia'); if (!ref) { ref = figma.createPage(); ref.name = '📖 Tipografia'; }
      await ref.loadAsync?.(); for (const o of ref.children.filter(n => n.name === inv.name)) o.remove();
      ref.appendChild(inv); inv.x = 0; inv.y = 0;
      const cnt = new Map(); for (const tx of texts([origin])) for (const sg of tx.getStyledTextSegments(['textStyleId'])) if (sg.textStyleId) cnt.set(sg.textStyleId, (cnt.get(sg.textStyleId) || 0) + 1);
      const ui = { family: 'Inter', style: 'Regular' }; await load(ui); await load({ family: 'Inter', style: 'Bold' });
      for (const t of inv.findAllWithCriteria({ types: ['TEXT'] })) { if (t.characters === 'Tipografia (preview)') t.characters = `Tipografia — ${figma.root.name}`; }
      for (const row of inv.findAll(n => n.type === 'FRAME' && n.name.startsWith('novo/'))) {
        const st = byName(row.name.slice(5)) || (await figma.getLocalTextStylesAsync()).find(s => s.name === row.name.slice(5)); row.name = row.name.slice(5);
        const meta = row.children.find(c => c.type === 'TEXT' && / usos/.test(c.characters)); if (meta && st) { await load(meta.fontName); meta.characters = meta.characters.replace(/\d+ usos/, `${cnt.get(st.id) || 0} usos`); }
      }
      out.inventarioMovido = '📖 Tipografia';
    } else out.inventarioMovido = 'não achei — rode o BLOCO C com A = { page: "📖 Tipografia" }';
    if (p) { if (figma.currentPage === p) await figma.setCurrentPageAsync(origin); p.remove(); }
    await ordenar();
    out.proximo = 'rode o BLOCO C (página 📖 Tipografia) e depois o BLOCO A para verificar';
  }
  return out;
}
out.erros.push('MODE desconhecido'); return out;
```

## BLOCO C — inventário de tipografia (página de referência)

```js
// BLOCO C — INVENTÁRIO DE TIPOGRAFIA (página de referência). Edite só A.
// Final:   A = { page: '📖 Tipografia' }                      (todos os estilos, menos _deprecated/ e novo/)
// Preview: A = os valores que o BLOCO B devolveu em "inventario" (page do preview, prefix 'novo/', x, y, usesScope)
const A = { page: '📖 Tipografia', frame: '📖 Inventário de tipografia', title: null, x: 0, y: 0, prefix: null, usesScope: 'all', stay: false };
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
```

## Compliance Brasil (só se pedirem)
Responda com um checklist ✅ / ❌ / ⚠️ / 🔍 (não verificável no Figma), em três grupos:
- **Lei:** LBI art. 63, que na prática exige WCAG AA — contraste, não depender só de cor, título real em h1–h6.
- **Voluntário:** WCAG AAA, NBR 17225, eMAG.
- **Setorial:** CDC art. 54 (contrato ≥ 16 px, é interpretação para o digital), ANVISA (bula).

Deixe claro que é apoio técnico, não parecer jurídico.
