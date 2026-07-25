# BuildMaster Elite Tático v29.20

## Blocos 14 e 15 — Testes, estabilidade e produção final

Este pacote usa a v29.10 como base e preserva as funções implementadas nos Blocos 1 a 13.

A v29.20 fecha a preparação do código-fonte para produção com novos portões automáticos de qualidade, estabilidade, acessibilidade, integridade e publicação. O pacote não contém APK, chave de assinatura, `node_modules` nem dados privados.

## O que entrou

### Bloco 14 — Testes e estabilidade

- verificação sintática de todo o código TypeScript/TSX;
- contratos automáticos para botões, imagens e camada visual final;
- correção dos botões que poderiam enviar formulários acidentalmente;
- nomes acessíveis nos controles de ícone e alternância revisados;
- testes dos fluxos de login, licença, aparelhos, OCR, fichas, elenco, partidas, treinos, backup, sincronização e atualização;
- regressões preservadas desde as versões anteriores;
- pré-voo de produção com falhas bloqueantes e alertas não bloqueantes;
- painel local de prontidão e diagnóstico na área Segurança e qualidade.

### Bloco 15 — Versão final de produção

- identidade da versão elevada para 29.20.0;
- esquema de dados elevado para 2920;
- cache do PWA renovado;
- camada visual final carregada por último;
- workflow de APK com sintaxe, interface, pré-voo, testes, typecheck, build release, assinatura e verificação pública;
- manifesto SHA-256 interno do código-fonte;
- verificação de que APK, AAB, keystore, chaves privadas e `service_role` não entraram no pacote;
- preparação de publicação estável/beta, rollout, pausa e rollback preservada da v29.10;
- aprovação final condicionada ao APK assinado instalado e atualizado em Android real.

## Resultados da validação local

- 68/68 testes TypeScript aprovados em lotes controlados;
- 25/25 regressões MJS aprovadas;
- 4/4 regressões CJS aprovadas;
- 241 arquivos TypeScript/TSX com sintaxe aprovada;
- 520 botões com tipo explícito;
- 19 imagens com texto alternativo;
- checagem TypeScript estrita dos módulos v29.20 aprovada;
- pré-voo com 27 verificações aprovadas;
- auditoria com 66 verificações aprovadas;
- nenhum bloqueio técnico encontrado no código-fonte validado.

## Alertas não bloqueantes

- `src/components/CardVisionApp.tsx` permanece grande, com 4.119 linhas;
- `src/lib/analyzer.ts` permanece grande, com 3.677 linhas.

Os módulos adicionados nos Blocos 6 a 15 permanecem separados. Uma divisão adicional desses dois arquivos é recomendada apenas em uma futura versão maior, acompanhada de regressões próprias.

## Limite desta entrega

Este pacote é o código-fonte final preparado para produção. O APK assinado não foi gerado localmente porque a assinatura permanente, os Secrets do GitHub e a instalação completa das dependências externas não estão disponíveis neste ambiente.

Antes do rollout total, o GitHub Actions deve obrigatoriamente:

1. executar `npm ci`;
2. executar typecheck e todos os testes;
3. gerar o build web estático;
4. sincronizar o Capacitor;
5. gerar `assembleRelease`;
6. assinar e verificar o APK com a chave permanente;
7. publicar e validar o APK por SHA-256;
8. instalar sobre uma versão antiga em Android real;
9. confirmar login, dados, backup e atualização após a instalação.

Consulte `RELATORIO_BLOCOS14_15_V29.20.md` para a auditoria completa.
