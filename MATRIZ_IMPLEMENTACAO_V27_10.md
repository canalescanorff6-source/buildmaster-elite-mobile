# Matriz de implementação — v27.10

| Item da auditoria | Situação | Implementação principal |
|---|---|---|
| Separar nível do GER | Concluído | `singlePrintPro.ts`, `pointBudget.ts` |
| Aceitar nível 27/30/31/32/48 | Concluído | parser e casos críticos de teste |
| Regiões próprias por campo | Concluído | templates adaptativos e `zoneBoxes` |
| GER somente na área correta | Concluído | pontuação por zona e rótulo |
| Evidência visual da leitura | Concluído | `SinglePrintEvidencePanel.tsx` |
| Recorte adaptativo da arte | Concluído | `imageProcessing.ts` |
| OCR por campo | Concluído | whitelist e especialização por tipo |
| Worker único e reutilizável | Concluído | `ocrWorkerManager.ts` |
| Segunda passagem seletiva | Concluído | baixa confiança בלבד |
| Cache por imagem | Concluído | IndexedDB `ocr-cache` |
| Cancelamento e progresso | Concluído | worker/fluxo do leitor |
| Fila local de OCR | Concluído | `ocrQueue.ts` e store `ocr-queue` |
| Memória de correções | Concluído | store `ocr-corrections` |
| Comparação com leitura anterior | Concluído | histórico e painel de confiança |
| Armazenamento estruturado | Concluído | `localDatabase.ts`, `structuredRepository.ts` |
| Miniaturas separadas | Concluído | store `image-thumbnails` |
| Paginação | Concluído na camada de dados | helpers do repositório estruturado |
| CSS unificado | Concluído | `globals.css`, `legacy-compat.css`, `design-system-v2710.css` |
| Tipografia e toque acessíveis | Concluído | Design System v27.10 |
| Animações discretas | Concluído | transições curtas e `prefers-reduced-motion` |
| Ícone maskable dedicado | Concluído | `public/icons/icon-maskable-*` |
| Explicar investimento de pontos | Concluído | `InvestmentTracePanel.tsx` |
| Detectar lacunas do elenco | Concluído | `squadGapDetector.ts`, `SquadGapPanel.tsx` |
| Planos ligados ao banco | Concluído | Central Inteligente e Laboratório da Partida |
| Registro de fonte da carta | Concluído | `VerifiedCardRegistryPanel.tsx` |
| Diagnóstico sem segredos | Concluído | `safeDiagnostics.ts` |
| Compartilhamento compacto | Concluído | `CompactSharePanel.tsx` |
| Modularizar analisador | Parcial seguro | domínio e orçamento extraídos; motor legado preservado |
| Modularizar tela principal | Parcial seguro | painéis dinâmicos e módulos extraídos; coordenador legado mantido |
| Remover código não utilizado | Concluído | TypeScript estrito passa |
| Testes com casos reais conhecidos | Concluído para casos críticos estruturados | fixture de níveis/GER/pontos |
| Teste visual em aparelhos reais | Pendente de aparelho | checklist incluído |
| APK Android assinado | Pendente do GitHub Actions | workflow preservado |
| Manifesto local obsoleto | Removido | somente exemplo fica no código; publicação gera o real |
| Documentação antiga desorganizada | Concluído | histórico movido para `docs/archive/` |
| Dependências de produção | Concluído | override seguro do PostCSS; audit sem vulnerabilidades conhecidas |

## Observação

“Parcial seguro” significa que a melhoria foi aplicada sem uma reescrita destrutiva. Os pontos restantes exigem migração incremental para reduzir o risco de quebrar recursos e dados já utilizados.
