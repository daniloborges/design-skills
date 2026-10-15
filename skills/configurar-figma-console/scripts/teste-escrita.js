// Teste de escrita — cria um frame, lê de volta e apaga, numa única execução.
// Rode com figma_execute (figma-console MCP) só depois da licença da pessoa: o arquivo dela é tocado por um instante.
// Devolve: { ok, criado, lido, apagado, pagina, erro? }. O frame é apagado mesmo quando a leitura falha.

// ── Configuração ────────────────────────────────────────────────────────────
const _A = (typeof ARGS !== 'undefined' && ARGS) || {};
const NOME = _A.nome ?? 'teste figma-console';
const X = Number(_A.x ?? -2000);   // longe do conteúdo
const Y = Number(_A.y ?? -2000);
// ────────────────────────────────────────────────────────────────────────────

const r = { ok: false, criado: false, lido: false, apagado: false, pagina: figma.currentPage.name };
let frame = null;
try {
  frame = figma.createFrame();
  frame.name = NOME;
  frame.resize(100, 100);
  frame.x = X;
  frame.y = Y;
  frame.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 1 } }];
  r.criado = true;
  const lido = await figma.getNodeByIdAsync(frame.id);
  r.lido = !!lido && lido.name === NOME && lido.width === 100;
} catch (e) {
  r.erro = String(e && e.message || e);
} finally {
  if (frame && !frame.removed) frame.remove();
  r.apagado = !frame || frame.removed;
}
r.ok = r.criado && r.lido && r.apagado;
return r;
