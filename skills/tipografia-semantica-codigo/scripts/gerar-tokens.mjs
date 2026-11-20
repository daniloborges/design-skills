#!/usr/bin/env node
// Gera CSS (custom properties + classes) e DTCG a partir dos estilos de texto do Figma.
// Entrada: JSON do figma_get_text_styles (figma-console) ou array [{name, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing, textCase}].
// Uso: node gerar-tokens.mjs estilos.json [--out tipografia] [--base 16]
// Saída: <out>.css e <out>.tokens.json. Só exporta estilos que seguem a taxonomia; os outros são listados como ignorados.

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const input = args.find(a => !a.startsWith('--'));
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'tipografia';
const base = args.includes('--base') ? Number(args[args.indexOf('--base') + 1]) : 16;
// --modos variaveis.json: { "type/heading/xl/font-size": { "Desktop": 84, "Mobile": 44 }, ... } → font-size em clamp()
const modosPath = args.includes('--modos') ? args[args.indexOf('--modos') + 1] : null;
// --viewport 360,1440: larguras de tela onde o Mobile e o Desktop valem exatos
const [vMin, vMax] = (args.includes('--viewport') ? args[args.indexOf('--viewport') + 1] : '360,1440').split(',').map(Number);
if (!input) { console.error('uso: node gerar-tokens.mjs estilos.json [--out tipografia] [--base 16] [--modos variaveis.json] [--viewport 360,1440]'); process.exit(2); }
const modos = modosPath ? JSON.parse(readFileSync(modosPath, 'utf8')) : {};
// clamp(mobile, interpolação linear entre as duas telas, desktop), em rem e vw
const fluid = (mob, desk) => {
  if (mob === undefined || mob === desk) return rem(desk);
  const slope = (desk - mob) / (vMax - vMin);
  const intercept = mob - slope * vMin;
  return `clamp(${rem(Math.min(mob, desk))}, ${rem(intercept)} + ${+(slope * 100).toFixed(4)}vw, ${rem(Math.max(mob, desk))})`;
};

const ROLES = ['display', 'heading', 'lead', 'body', 'label', 'caption', 'eyebrow', 'code', 'legal', 'big-number', 'index'];
const WEIGHTS = { thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900 };
const weightOf = (style) => { const m = /wght\s*(\d+)/i.exec(style); if (m) return +m[1]; const k = style.toLowerCase().replace(/italic|oblique|\s|-/g, ''); return WEIGHTS[k] ?? 400; };
const rem = (px) => `${+(px / base).toFixed(4)}rem`;

const raw = JSON.parse(readFileSync(input, 'utf8'));
const list = Array.isArray(raw) ? raw : (raw.data?.styles || raw.styles || []);

const css = [':root {'], classes = [], dtcg = { type: {} }, skipped = [];
for (const s of list) {
  if (s.name.startsWith('_deprecated/')) continue;
  // Camada de componente: `<marca>:<componente>-<parte>` → --<marca>-<componente>-<parte>-*, classe .<marca>-<componente>-<parte>
  const comp = /^([a-z0-9-]+):([a-z0-9]+)-([a-z0-9-]+)$/.exec(s.name);
  let role, size, mod, id, prefix;
  if (comp) {
    [, role, size, mod] = [null, comp[1], comp[2], comp[3]];
    id = `${comp[1]}-${comp[2]}-${comp[3]}`; prefix = '';
  } else {
    const parts = s.name.split('/'); const i = parts.findIndex(p => ROLES.includes(p));
    if (i < 0 || parts.length - i !== 2) { skipped.push(s.name); continue; }
    role = parts[i]; [, size, mod] = /^(.+?)(?:-(emphasis|strong))?$/.exec(parts[i + 1]);
    id = [role, size, mod].filter(Boolean).join('-'); prefix = 'type-';
  }
  const px = s.fontSize;
  const fs = comp ? rem(px) : fluid(modos[`type/${role}/${size}/font-size`]?.Mobile, modos[`type/${role}/${size}/font-size`]?.Desktop ?? px);
  const lh = s.lineHeight?.unit === 'PIXELS' ? +(s.lineHeight.value / px).toFixed(3) : s.lineHeight?.unit === 'PERCENT' ? +(s.lineHeight.value / 100).toFixed(3) : 'normal';
  const ls = s.letterSpacing?.unit === 'PIXELS' ? `${+(s.letterSpacing.value / px).toFixed(4)}em` : s.letterSpacing?.unit === 'PERCENT' ? `${+(s.letterSpacing.value / 100).toFixed(4)}em` : '0';
  const w = weightOf(s.fontStyle || 'Regular'); const italic = /italic|oblique/i.test(s.fontStyle || '');
  const v = `--${prefix}${id}`;
  css.push(`  ${v}-font-family: "${s.fontFamily}";`, `  ${v}-font-size: ${fs};`, `  ${v}-line-height: ${lh};`, `  ${v}-font-weight: ${w};`, `  ${v}-letter-spacing: ${ls};`);
  classes.push(`.${prefix}${id} {\n  font-family: var(${v}-font-family);\n  font-size: var(${v}-font-size);\n  line-height: var(${v}-line-height);\n  font-weight: var(${v}-font-weight);\n  letter-spacing: var(${v}-letter-spacing);${italic ? '\n  font-style: italic;' : ''}${s.textCase === 'UPPER' ? '\n  text-transform: uppercase;' : ''}\n}`);
  const tok = { $type: 'typography', $value: { fontFamily: s.fontFamily, fontSize: fs, lineHeight: lh, fontWeight: w, letterSpacing: ls }, $description: s.description || '' };
  if (comp) { (((dtcg.component ||= {})[role] ||= {})[size] ||= {})[mod] = tok; continue; }
  const node = ((dtcg.type[role] ||= {})[size] ||= {});
  if (mod) node[mod] = tok; else Object.assign(node, tok);
}
css.push('}');
writeFileSync(`${out}.css`, `/* Gerado de ${input} por gerar-tokens.mjs — não edite à mão; edite no Figma e gere de novo. */\n${css.join('\n')}\n\n${classes.join('\n\n')}\n`);
writeFileSync(`${out}.tokens.json`, JSON.stringify(dtcg, null, 2) + '\n');
console.log(`${out}.css e ${out}.tokens.json gerados · ${list.length - skipped.length} estilos exportados · ${skipped.length} ignorados (fora da taxonomia)`);
if (skipped.length) console.log('Ignorados:\n  ' + [...new Set(skipped)].join('\n  '));
