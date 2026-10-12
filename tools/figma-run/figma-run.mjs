#!/usr/bin/env node
// figma-run — executa um script da Plugin API no Figma Desktop sem passar pelo MCP.
//
// Como funciona: o plugin "Desktop Bridge" do figma-console procura servidores nas portas 9223–9232
// (GET /health a cada 3–10 s) e se conecta a TODOS que responderem. Este script sobe um servidor
// temporário numa porta livre dessa faixa, espera o plugin conectar, envia o código (EXECUTE_CODE),
// imprime o resultado e encerra. Convive com o MCP aberto — cada um usa sua porta.
//
// Uso:
//   node figma-run.mjs <script.js> [--args args.json] [--set chave=valor ...] [--file "nome ou fileKey"]
//                      [--timeout 120000] [--wait 25000] [--out resultado.json]
//
//   --args / --set  viram `const ARGS = {...}` no topo do script (valores de --set são JSON quando possível)
//   --file          escolhe o arquivo quando há mais de um com o plugin aberto (nome parcial ou fileKey)
//
// Requisitos: Node ≥ 18, `npm install` nesta pasta (dependência: ws), Figma Desktop com o plugin
// Desktop Bridge do figma-console aberto no arquivo. Precisa rodar NA MESMA MÁQUINA do Figma.

import http from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';

const argv = process.argv.slice(2);
const opt = { script: null, args: {}, file: null, timeout: 120000, wait: 25000, out: null };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--args') Object.assign(opt.args, JSON.parse(readFileSync(argv[++i], 'utf8')));
  else if (a === '--set') { const [k, ...v] = argv[++i].split('='); const raw = v.join('='); try { opt.args[k] = JSON.parse(raw); } catch { opt.args[k] = raw; } }
  else if (a === '--file') opt.file = argv[++i];
  else if (a === '--timeout') opt.timeout = Number(argv[++i]);
  else if (a === '--wait') opt.wait = Number(argv[++i]);
  else if (a === '--out') opt.out = argv[++i];
  else if (!a.startsWith('--')) opt.script = a;
}
if (!opt.script) { console.error('uso: node figma-run.mjs <script.js> [--args args.json] [--set k=v] [--file nome] [--timeout ms] [--wait ms] [--out arquivo]'); process.exit(2); }

const code = `const ARGS = ${JSON.stringify(opt.args)};\n` + readFileSync(opt.script, 'utf8');
const log = (...m) => console.error('[figma-run]', ...m);

const clients = new Map(); // ws → fileInfo
let nextId = 1;
const pending = new Map();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', version: 'figma-run-1.0.0', clients: clients.size, connectedClients: clients.size, uptime: 0 }));
  }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server });
let port = null;

wss.on('connection', (ws) => {
  clients.set(ws, null);
  ws.send(JSON.stringify({ type: 'SERVER_HELLO', data: { port, pid: process.pid, serverVersion: 'figma-run-1.0.0' } }));
  ws.on('message', (buf) => {
    let msg; try { msg = JSON.parse(buf.toString()); } catch { return; }
    if (msg.type === 'FILE_INFO' && msg.data) { clients.set(ws, msg.data); log(`plugin conectado: "${msg.data.fileName}" (${msg.data.fileKey})`); return; }
    if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error)) : p.resolve(msg.result); }
  });
  ws.on('close', () => clients.delete(ws));
});

function listen(p) { return new Promise((ok, fail) => { server.once('error', fail); server.listen(p, 'localhost', () => { server.off('error', fail); ok(p); }); }); }
// de cima para baixo: deixa 9223 (porta preferida do MCP) livre
for (let p = 9232; p >= 9223; p--) { try { port = await listen(p); break; } catch { /* ocupada */ } }
if (!port) { log('nenhuma porta livre entre 9223 e 9232'); process.exit(3); }
log(`aguardando o plugin na porta ${port} (até ${opt.wait / 1000}s)…`);

const match = (fi) => !opt.file || fi.fileKey === opt.file || (fi.fileName || '').toLowerCase().includes(opt.file.toLowerCase());
const target = await new Promise((resolve) => {
  const t0 = Date.now();
  const tick = setInterval(() => {
    const hit = [...clients].find(([, fi]) => fi && match(fi));
    if (hit) { clearInterval(tick); resolve(hit); }
    else if (Date.now() - t0 > opt.wait) { clearInterval(tick); resolve(null); }
  }, 200);
});
if (!target) {
  const seen = [...clients.values()].filter(Boolean).map(f => f.fileName);
  log(seen.length ? `nenhum arquivo bate com --file "${opt.file}". Conectados: ${seen.join(', ')}` : 'o plugin não conectou. Abra o Desktop Bridge do figma-console no arquivo e tente de novo.');
  server.close(); process.exit(4);
}
const [ws, fileInfo] = target;
log(`executando ${opt.script} em "${fileInfo.fileName}"…`);

const id = `run_${Date.now()}_${nextId++}`;
const result = await new Promise((resolve, reject) => {
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method: 'EXECUTE_CODE', params: { code, timeout: opt.timeout } }));
  setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error(`sem resposta em ${opt.timeout + 5000} ms`)); } }, opt.timeout + 5000);
}).catch(e => ({ success: false, error: e.message }));

const ok = result && result.success !== false && !result.error;
const output = JSON.stringify(result && 'result' in result ? result.result : result, null, 2);
if (opt.out) writeFileSync(opt.out, output); else console.log(output);
if (!ok) log('erro:', result.error || 'falhou');
for (const c of wss.clients) c.close(1000, 'figma-run done');
server.close();
process.exit(ok ? 0 : 1);
