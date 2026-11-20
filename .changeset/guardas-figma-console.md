---
"design-skills": minor
---

Guardas das chamadas ao figma-console. Um hook `PreToolUse` barra o `figma_execute` que usa a API síncrona da Plugin API, recusada pelo Figma com `documentAccess: dynamic-page`, e devolve a troca pela versão `Async`. O mod `figma-details` pede `fileKey` quando há mais de um arquivo conectado e mostra o arquivo alvo na linha de status.
