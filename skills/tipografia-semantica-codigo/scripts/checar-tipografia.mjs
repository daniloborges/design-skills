#!/usr/bin/env node
// Guardrail de tipografia semântica. Node ≥ 18, sem dependências.
// Uso: node checar-tipografia.mjs <arquivos|pastas…> [--figma estilos.json] [--faixas faixas.json] [--json] [--base 16]
// --faixas: sobrescreve faixas de tamanho por projeto (escala expressiva/editorial), ex. {"heading":{"xl":[72,96]}}
// Sai com código 1 quando há achado bloqueante (bom para CI).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

// ── Taxonomia (espelha shared/taxonomia.md) ─────────────────────────────────
const TAXONOMY = {
  display: { xl: [120, Infinity], lg: [80, 119], md: [57, 79] },
  heading: { xl: [40, 56], lg: [32, 39], md: [24, 31], sm: [20, 23], xs: [16, 19], '2xs': [14, 15] },
  lead: { lg: [24, 32], md: [18, 23] },
  body: { lg: [16, 18], md: [14, 15], sm: [12, 13] },
  label: { md: [13, 14], sm: [12, 12] },
  caption: { md: [12, 13], sm: [11, 11] },
  eyebrow: { md: [12, 12], sm: [11, 11] },
  code: { md: [13, 14], sm: [12, 12] },
  legal: { md: [16, Infinity] },
  'big-number': { lg: [56, 120], md: [20, 55] },
  index: { md: [14, 20] },
};
const MODIFIERS = ['emphasis', 'strong'];
const HEADING_ROLES = new Set(['heading']);             // precisam de h1–h6 / role=heading
const DISPLAY_ROLES = new Set(['display']);             // h1–h6 ou p decorativo
const NEVER_HEADING = new Set(['lead', 'body', 'eyebrow', 'label', 'code', 'legal', 'big-number', 'index', 'caption']);
const FLOOR = (role, size) => {
  if (role === 'legal') return { px: 16, sev: 'bloqueante', why: 'legal/* ≥ 16 px (CDC art. 54 §3º, interpretação de "corpo 12")' };
  if ((role === 'body' && size !== 'sm') || role === 'lead') return { px: 14, sev: 'alerta', why: 'texto corrido ≥ 14 px (16 recomendado)' };
  if (['label', 'code'].includes(role) || (role === 'caption' && size === 'md') || (role === 'eyebrow' && size === 'md') || (role === 'body' && size === 'sm')) return { px: 12, sev: 'alerta', why: 'texto de suporte ≥ 12 px (Windows/Fluent)' };
  return null;
};
const KEYWORDS = { 'xx-small': 9, 'x-small': 10, small: 13, medium: 16, large: 18, 'x-large': 24, 'xx-large': 32, 'xxx-large': 48 };
// ────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const opt = { json: args.includes('--json'), base: 16, figma: null, faixas: null };
const paths = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--figma') opt.figma = args[++i];
  else if (args[i] === '--base') opt.base = Number(args[++i]);
  else if (args[i] === '--faixas') opt.faixas = args[++i];
  else if (!args[i].startsWith('--')) paths.push(args[i]);
}
if (opt.faixas) { const o = JSON.parse(readFileSync(opt.faixas, 'utf8')); for (const [role, sizes] of Object.entries(o)) TAXONOMY[role] = { ...(TAXONOMY[role] || {}), ...Object.fromEntries(Object.entries(sizes).map(([k, [a, b]]) => [k, [a, b ?? Infinity]])) }; }
if (!paths.length) { console.error('uso: node checar-tipografia.mjs <arquivos|pastas…> [--figma estilos.json] [--json]'); process.exit(2); }

const STYLE_EXT = new Set(['.css', '.scss', '.sass', '.less', '.pcss']);
const MARKUP_EXT = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.njk', '.liquid', '.hbs', '.erb', '.php']);
const JSON_EXT = new Set(['.json']);
const SKIP_DIR = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'vendor']);

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isDirectory()) { for (const f of readdirSync(p)) if (!SKIP_DIR.has(f)) walk(join(p, f), out); }
  else out.push(p);
  return out;
}
const files = paths.flatMap(p => walk(p));

const findings = [];
const add = (sev, id, file, line, msg, fix = '') => findings.push({ sev, id, file: relative(process.cwd(), file), line, msg, fix });
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

// nome → { role, size, mod } ou null
function parseName(raw) {
  const m = /^([a-z-]+?)-(2xs|xs|sm|md|lg|xl)(?:-(emphasis|strong))?$/.exec(raw);
  if (!m) return null;
  const [, role, size, mod] = m;
  if (!TAXONOMY[role] || !TAXONOMY[role][size]) return null;
  if (mod && !MODIFIERS.includes(mod)) return null;
  return { role, size, mod };
}

function toPx(value, file, line, ctx) {
  const v = value.trim();
  let m;
  if ((m = /^(-?[\d.]+)px$/.exec(v))) { add('alerta', 'VOL-01', file, line, `${ctx}: font-size em px (${v}) não escala com a preferência do usuário`, `use ${+m[1] / opt.base}rem`); return +m[1]; }
  if ((m = /^(-?[\d.]+)rem$/.exec(v))) return +m[1] * opt.base;
  if ((m = /^(-?[\d.]+)em$/.exec(v))) return +m[1] * opt.base;            // aproximação: assume herança da base
  if ((m = /^(-?[\d.]+)%$/.exec(v))) return +m[1] / 100 * opt.base;
  if ((m = /^(-?[\d.]+)pt$/.exec(v))) { add('alerta', 'VOL-01', file, line, `${ctx}: font-size em pt (${v})`, 'use rem'); return +m[1] * 4 / 3; }
  if (KEYWORDS[v] != null) return KEYWORDS[v];
  if ((m = /^clamp\(\s*([^,]+),/.exec(v))) return toPx(m[1], file, line, ctx + ' (mínimo do clamp)');
  if ((m = /^var\(/.exec(v))) return null;                                 // resolvido em outro lugar
  if ((m = /^calc\(/.exec(v))) return null;
  return null;
}
function lhRatio(value, sizePx) {
  const v = String(value).trim(); let m;
  if ((m = /^[\d.]+$/.exec(v))) return +v;
  if ((m = /^([\d.]+)%$/.exec(v))) return +m[1] / 100;
  if ((m = /^([\d.]+)(px)$/.exec(v)) && sizePx) return +m[1] / sizePx;
  if ((m = /^([\d.]+)rem$/.exec(v)) && sizePx) return +m[1] * opt.base / sizePx;
  if ((m = /^([\d.]+)em$/.exec(v))) return +m[1];
  return null;
}

// Coleta tokens: nome → { size, lh, weight, file, line }
const tokens = new Map();
const getTok = (name, file, line) => { if (!tokens.has(name)) tokens.set(name, { file, line }); return tokens.get(name); };

function checkName(raw, file, line, where) {
  const p = parseName(raw);
  if (!p) add('alerta', 'NOME-01', file, line, `${where} "type-${raw}" fora da taxonomia`, 'use papel-tamanho[-emphasis|-strong], ver references/taxonomia.md');
  return p;
}

// ── CSS ─────────────────────────────────────────────────────────────────────
function scanStyles(file, src) {
  const inTypeBlock = (idx) => { const open = src.lastIndexOf('{', idx), close = src.lastIndexOf('}', idx); return open > close && src.slice(Math.max(close, 0), open).includes('.type-'); };
  // custom properties --type-<nome>-<prop>: valor;
  const propRe = /--type-([a-z0-9-]+?)-(font-size|line-height|font-weight|letter-spacing|font-family|font)\s*:\s*([^;]+);/g;
  let m;
  while ((m = propRe.exec(src))) {
    const line = lineOf(src, m.index), [, name, prop, val] = m;
    if (!checkName(name, file, line, 'token')) continue;
    const t = getTok(name, file, line);
    if (prop === 'font-size') t.size = toPx(val, file, line, `--type-${name}-font-size`);
    if (prop === 'line-height') t.lhRaw = val;
    if (prop === 'font-weight') t.weight = parseInt(val, 10) || null;
  }
  // blocos .type-<nome> { … }
  const blockRe = /\.type-([a-z0-9-]+)\s*(?:,[^{]*)?\{([^}]*)\}/g;
  while ((m = blockRe.exec(src))) {
    const line = lineOf(src, m.index), [, name, body] = m;
    if (!checkName(name, file, line, 'classe')) continue;
    const t = getTok(name, file, line);
    const fs = /font-size\s*:\s*([^;]+);?/.exec(body); if (fs && t.size == null) t.size = toPx(fs[1], file, line, `.type-${name}`);
    const lh = /line-height\s*:\s*([^;]+);?/.exec(body); if (lh && t.lhRaw == null) t.lhRaw = lh[1];
    const fw = /font-weight\s*:\s*([^;]+);?/.exec(body); if (fw && t.weight == null) t.weight = parseInt(fw[1], 10) || null;
    if (/text-align\s*:\s*justify/.test(body)) add('boa prática', 'VOL-04', file, line, `.type-${name} justificado`, 'use text-align: start');
  }
  // font-size em px em qualquer regra (fora de tokens)
  const fsRe = /(^|[;{\s])font-size\s*:\s*(-?[\d.]+px)/g;
  while ((m = fsRe.exec(src))) if (!inTypeBlock(m.index)) add('alerta', 'VOL-01', file, lineOf(src, m.index), `font-size fixo em px (${m[2]})`, `use rem ou um token --type-*`);
  const jRe = /text-align\s*:\s*justify/g;
  while ((m = jRe.exec(src))) if (!inTypeBlock(m.index)) add('boa prática', 'VOL-04', file, lineOf(src, m.index), 'texto justificado', 'use text-align: start');
}

// ── JSON (DTCG ou objeto simples) ───────────────────────────────────────────
function scanJson(file, src) {
  let data; try { data = JSON.parse(src); } catch { return; }
  const root = data.type || data.typography?.type || data.typography;
  if (!root || typeof root !== 'object') return;
  const visit = (node, pathParts) => {
    const v = node.$value ?? node.value ?? node;
    if (v && typeof v === 'object' && (v.fontSize != null || v['font-size'] != null)) {
      const name = pathParts.join('-');
      if (!checkName(name, file, 1, 'token JSON')) return;
      const t = getTok(name, file, 1);
      const fsv = String(v.fontSize ?? v['font-size']);
      t.size = /^[\d.]+$/.test(fsv) ? +fsv : toPx(fsv, file, 1, `type.${pathParts.join('.')}`);
      t.lhRaw = v.lineHeight ?? v['line-height'];
      t.weight = parseInt(v.fontWeight ?? v['font-weight'], 10) || null;
      return;
    }
    for (const [k, child] of Object.entries(node)) if (!k.startsWith('$') && child && typeof child === 'object') visit(child, [...pathParts, k]);
  };
  visit(root, []);
}

// ── Markup ──────────────────────────────────────────────────────────────────
function scanMarkup(file, src) {
  const tagRe = /<([a-zA-Z][\w-]*)\b([^>]*?)>/g;
  const headings = [];
  let m;
  while ((m = tagRe.exec(src))) {
    const [, tagRaw, attrs] = m; const tag = tagRaw.toLowerCase(); const line = lineOf(src, m.index);
    const hm = /^h([1-6])$/.exec(tag);
    const roleHeading = /\brole\s*=\s*["']heading["']/.test(attrs);
    const level = hm ? +hm[1] : roleHeading ? +(/aria-level\s*=\s*["'{]*(\d)/.exec(attrs)?.[1] || 2) : null;
    if (level) headings.push({ level, line });
    const cls = /\b(?:class|className)\s*=\s*(?:["'`{]+)([^"'`}]*)/.exec(attrs)?.[1] || '';
    for (const c of cls.split(/\s+/)) {
      const cm = /^type-([a-z0-9-]+)$/.exec(c); if (!cm) continue;
      const p = checkName(cm[1], file, line, 'classe no markup'); if (!p) continue;
      if (HEADING_ROLES.has(p.role) && !level) add('bloqueante', 'LEI-07', file, line, `type-${cm[1]} em <${tag}>: estilo de heading fora de h1–h6`, 'use <hN> com o nível da estrutura, ou role="heading" aria-level');
      if (NEVER_HEADING.has(p.role) && level) add('bloqueante', 'LEI-07', file, line, `type-${cm[1]} em <${tag}>: ${p.role} não é título`, p.role === 'big-number' ? 'use <p>/<dd> com rótulo em <dt>' : p.role === 'eyebrow' ? 'use <p> antes do heading ou dentro de <hgroup>' : 'use <p>, ou troque para heading/* se for de fato um título');
      if (DISPLAY_ROLES.has(p.role) && !level && !['p', 'span', 'div'].includes(tag)) add('alerta', 'LEI-07', file, line, `type-${cm[1]} em <${tag}>`, 'display é h1–h6 ou <p> decorativo');
    }
  }
  const isPage = /<html|<body|<main/i.test(src);
  const h1s = headings.filter(h => h.level === 1);
  if (isPage && h1s.length === 0 && headings.length) add('alerta', 'LEI-07', file, 1, 'página sem <h1>', 'um único h1 por página');
  if (h1s.length > 1) add('alerta', 'LEI-07', file, h1s[1].line, `${h1s.length} elementos <h1>`, 'um único h1 por página');
  for (let i = 1; i < headings.length; i++) if (headings[i].level > headings[i - 1].level + 1) add('alerta', 'LEI-07', file, headings[i].line, `nível pulado: h${headings[i - 1].level} → h${headings[i].level}`, `use h${headings[i - 1].level + 1}`);
}

for (const f of files) {
  const ext = extname(f).toLowerCase();
  if (!STYLE_EXT.has(ext) && !MARKUP_EXT.has(ext) && !JSON_EXT.has(ext)) continue;
  const src = readFileSync(f, 'utf8');
  if (STYLE_EXT.has(ext) || ext === '.vue' || ext === '.svelte' || ext === '.astro') scanStyles(f, src);
  if (MARKUP_EXT.has(ext)) scanMarkup(f, src);
  if (JSON_EXT.has(ext) && !/package(-lock)?\.json$|tsconfig/.test(f)) scanJson(f, src);
}

// ── Regras por token ────────────────────────────────────────────────────────
for (const [name, t] of tokens) {
  const p = parseName(name); if (!p) continue;
  const where = `type-${name}`;
  if (t.size != null) {
    const px = Math.round(t.size * 100) / 100;
    if (px < 11) add('bloqueante', 'VOL-07', t.file, t.line, `${where}: ${px}px < 11px (mínimo absoluto)`, 'suba para o piso do papel');
    const floor = FLOOR(p.role, p.size);
    if (floor && px < floor.px) add(floor.sev, p.role === 'legal' ? 'SET-01' : 'VOL-07', t.file, t.line, `${where}: ${px}px < ${floor.px}px — ${floor.why}`, `≥ ${floor.px / opt.base}rem`);
    const [lo, hi] = TAXONOMY[p.role][p.size];
    if (px < lo || px > hi) add('boa prática', 'NOME-02', t.file, t.line, `${where}: ${px}px fora da faixa ${lo}–${hi === Infinity ? '∞' : hi}px do nome`, 'renomeie para o tamanho certo ou ajuste o valor');
    if (px % 1 !== 0) add('boa prática', 'NOME-03', t.file, t.line, `${where}: tamanho fracionado ${px}px`, 'use inteiros na grade de 2/4 px');
    if (t.weight >= 600 && px < 14) add('boa prática', 'VOL-08', t.file, t.line, `${where}: peso ${t.weight} com ${px}px`, 'texto em peso ≥ 600 com pelo menos 14 px');
  }
  if (t.lhRaw != null && ['body', 'lead', 'legal'].includes(p.role)) {
    const ratio = lhRatio(t.lhRaw, t.size);
    if (ratio != null && ratio < 1.5) add('boa prática', 'VOL-02', t.file, t.line, `${where}: line-height ${Math.round(ratio * 100) / 100} < 1.5`, 'line-height: 1.5 (WCAG 1.4.8)');
  }
}

// ── Coerência com o Figma ───────────────────────────────────────────────────
if (opt.figma) {
  const raw = JSON.parse(readFileSync(opt.figma, 'utf8'));
  const list = Array.isArray(raw) ? raw : (raw.data?.styles || raw.styles || []);
  const figmaNames = new Set(list.map(s => (typeof s === 'string' ? s : s.name))
    .filter(n => !n.startsWith('_deprecated/'))
    .map(n => { const parts = n.split('/'); const i = parts.findIndex(x => TAXONOMY[x]); return i >= 0 ? parts.slice(i).join('-') : null; })
    .filter(Boolean));
  const codeNames = new Set(tokens.keys());
  for (const n of figmaNames) if (!codeNames.has(n)) add('alerta', 'SYNC-01', opt.figma, 1, `estilo Figma "${n.replace(/-(?=[^-]+$)/, '/')}" sem token type-${n} no código`, 'crie o token ou remova o estilo');
  for (const n of codeNames) if (!figmaNames.has(n)) add('alerta', 'SYNC-02', tokens.get(n).file, tokens.get(n).line, `token type-${n} sem estilo correspondente no Figma`, 'crie o estilo no Figma ou remova o token');
}

// ── Saída ───────────────────────────────────────────────────────────────────
const ORDER = { bloqueante: 0, alerta: 1, 'boa prática': 2 };
findings.sort((a, b) => ORDER[a.sev] - ORDER[b.sev] || a.file.localeCompare(b.file) || a.line - b.line);
const count = s => findings.filter(f => f.sev === s).length;
if (opt.json) console.log(JSON.stringify({ tokens: [...tokens.keys()], findings }, null, 2));
else {
  console.log(`# Tipografia — guardrail\n\n${files.length} arquivos · ${tokens.size} tokens type-* · ${count('bloqueante')} bloqueantes · ${count('alerta')} alertas · ${count('boa prática')} boas práticas\n`);
  for (const sev of Object.keys(ORDER)) {
    const list = findings.filter(f => f.sev === sev); if (!list.length) continue;
    console.log(`## ${sev[0].toUpperCase() + sev.slice(1)}\n\n| ID | Local | Problema | Correção |\n|---|---|---|---|`);
    for (const f of list) console.log(`| ${f.id} | ${f.file}:${f.line} | ${f.msg.replace(/\|/g, '\\|')} | ${f.fix.replace(/\|/g, '\\|')} |`);
    console.log('');
  }
  if (!findings.length) console.log('Nenhum achado.');
}
process.exit(count('bloqueante') ? 1 : 0);
