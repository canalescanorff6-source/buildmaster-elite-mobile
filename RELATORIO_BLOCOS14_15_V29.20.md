# Relatório técnico — BuildMaster Elite Tático v29.20

## Blocos 14 e 15: Testes, estabilidade e versão final de produção

**Base utilizada:** v29.10 completa  
**Versão resultante:** 29.20.0  
**Esquema local de dados:** 2920  
**Objetivo:** fechar os portões técnicos de estabilidade e preparar um pacote limpo para build, assinatura, teste Android e publicação pelo workflow oficial.

---

## 1. Preservação dos blocos anteriores

A versão mantém as camadas e motores das versões anteriores, incluindo:

- identidade premium e navegação;
- arquitetura modular e carregamento sob demanda;
- OCR e leitura de carta;
- inteligência avançada das fichas;
- Meu Time e escalação profissional;
- treinos e evolução;
- partidas e desempenho competitivo;
- backup, nuvem e sincronização;
- administração, contas, MFA e segurança;
- canais estável/beta, rollout, pausa e rollback.

As regressões antigas foram mantidas. As verificações que ainda esperavam números ou estruturas de versões anteriores foram atualizadas para exigir a arquitetura final, sem remover os critérios funcionais originais.

---

## 2. Bloco 14 — Testes e estabilidade

### 2.1 Portões automáticos novos

Foram adicionados:

- `scripts/check-source-syntax.mjs`;
- `scripts/check-interactive-contracts.mjs`;
- `scripts/production-preflight.mjs`;
- `tests/v29-20-production-readiness-engine-regression.cjs`;
- `tests/v29-20-ui-production-regression.mjs`;
- `tests/types-v2920/` para checagem estrita isolada.

### 2.2 Contratos de interface

A revisão encontrou 20 botões antigos sem `type="button"`. Todos foram corrigidos para impedir submissões acidentais quando renderizados dentro de formulários.

O verificador final confirmou:

- **520 botões com tipo explícito**;
- **19 imagens com atributo `alt`**;
- camada `design-system-v2920-production.css` carregada por último;
- controles finais de ícone e alternância com identificação acessível.

### 2.3 Central de prontidão

Foi criado o motor `src/lib/productionReadiness.ts` e o painel `src/modules/quality/ProductionReadinessCenter.tsx`.

A central verifica localmente:

- versão instalada e versão esperada;
- contexto seguro;
- gravação no armazenamento;
- IndexedDB;
- criptografia disponível;
- service worker;
- integridade dos dados;
- problemas de execução registrados;
- tarefas longas;
- tamanho de tela;
- canal de atualização.

O painel não declara produção aprovada apenas com verificações web. A liberação completa continua condicionada a APK assinado e atualização em Android real.

### 2.4 Cobertura das regressões

Os testes cobrem, entre outros:

- contas, licença, prazos, MFA e aparelhos;
- backup, criptografia, restauração e sincronização;
- atualização, manifesto, download, SHA-256 e assinatura;
- OCR e casos críticos de leitura;
- fichas, cartas únicas, habilidades e evolução;
- formações, entrosamento, banco e planos A/B/C;
- adversários e Estúdio Tático;
- treinos, partidas e desempenho competitivo;
- navegação, telas, acessibilidade e qualidade visual.

---

## 3. Bloco 15 — Versão final de produção

### 3.1 Identidade e dados

- `package.json`: 29.20.0;
- `package-lock.json`: sincronizado em 29.20.0;
- `APP_RELEASE_VERSION`: 29.20.0;
- `APP_NATIVE_VERSION`: 29.20.0;
- `APP_DATA_VERSION`: 29.20.0;
- `CURRENT_DATA_SCHEMA`: 2920;
- manifesto PWA: v29.20;
- cache do service worker: `buildmaster-v29-20`.

### 3.2 Workflow de produção

O workflow `.github/workflows/build-apk.yml` foi preparado para executar, antes da publicação:

1. limpeza do manifesto remoto local;
2. validação dos Secrets e variáveis;
3. cálculo de versão e `versionCode` monotônico;
4. `npm ci`;
5. verificação sintática;
6. contratos interativos;
7. pré-voo de produção;
8. typecheck integral;
9. regressões v29.20 e bateria histórica;
10. geração e verificação do manifesto SHA-256 do código;
11. build web estático;
12. sincronização Capacitor;
13. `assembleRelease`;
14. alinhamento, assinatura e validação com `apksigner`;
15. publicação em ativo imutável;
16. verificação pública antes da ativação;
17. atualização dos canais e da ponte legada somente quando permitido.

Os recursos de canal beta, rollout gradual, pausa e rollback seguro da v29.10 foram preservados.

### 3.3 Limpeza e proteção

A auditoria bloqueia ou acusa:

- APK/AAB dentro do código-fonte;
- keystore e chaves privadas;
- credenciais `service_role` fixas;
- manifesto remoto antigo empacotado no app;
- uso direto disperso de `localStorage`;
- HTML dinâmico perigoso;
- execução dinâmica de código;
- poluição de protótipo na restauração;
- backups acima dos limites definidos.

---

## 4. Resultados obtidos

### 4.1 Testes executáveis

- **68/68 regressões TypeScript funcionais aprovadas**, executadas em lotes controlados;
- **26/26 testes MJS aprovados** após o hotfix;
- **4/4 testes CJS funcionais aprovados**;
- **3/3 typechecks isolados aprovados**;
- o typecheck integral com dependências reais permanece pendente de nova execução no GitHub Actions.

### 4.2 Código e interface

- **241 arquivos TypeScript/TSX** com sintaxe aprovada;
- **520 botões** com tipo explícito;
- **19 imagens** com texto alternativo;
- **29 verificações de pré-voo aprovadas**;
- **66 verificações de auditoria aprovadas**.

### 4.3 Alertas restantes

Somente dois alertas estruturais não bloqueantes:

- `CardVisionApp.tsx`: 4.119 linhas;
- `analyzer.ts`: 3.677 linhas.

Esses arquivos já têm partes importantes extraídas para módulos. Uma nova divisão deve ser tratada como mudança arquitetural futura, não como alteração de última hora na release final.

---

## 5. O que não foi afirmado como concluído

Não foi gerado nem entregue um APK assinado neste ambiente.

Motivos objetivos:

- ausência da chave permanente de assinatura;
- ausência dos Secrets e variáveis privados do repositório;
- instalação integral das dependências externas não disponível localmente;
- impossibilidade de executar teste de atualização sobre um Android físico neste ambiente.

Portanto, “produção final” nesta entrega significa **código-fonte, testes, auditoria, workflow e pacote de release preparados**. O lançamento somente deve ser considerado aprovado depois que o workflow gerar o APK assinado e os testes Android reais forem concluídos.

---

## 6. Checklist obrigatório antes do rollout de 100%

- [ ] GitHub Actions concluiu `npm ci` sem erro;
- [ ] typecheck integral aprovado;
- [ ] todos os testes do workflow aprovados;
- [ ] APK `release` assinado com a chave permanente;
- [ ] `apksigner verify` aprovado;
- [ ] SHA-256 público coincide com o APK baixado;
- [ ] instalação limpa aprovada em Android;
- [ ] atualização sobre uma versão antiga aprovada;
- [ ] login e sessão persistente aprovados;
- [ ] fichas, OCR e Estúdio Tático aprovados no aparelho;
- [ ] backup antes da atualização e restauração aprovados;
- [ ] painel administrativo e MFA aprovados;
- [ ] rollout inicial pequeno observado sem regressão;
- [ ] somente depois elevar o canal estável para 100%.

---

## 7. Conclusão

Os Blocos 14 e 15 fecham a linha planejada de evolução do BuildMaster com uma camada verificável de estabilidade e produção. A falha encontrada pelo primeiro typecheck remoto foi corrigida no código-fonte, mas a confirmação integral ainda depende de uma nova execução do GitHub Actions. Depois disso, continuam obrigatórios o build, a assinatura, a instalação e o teste de atualização em Android real.


---

## Hotfix posterior — falha do TypeScript no GitHub Actions

A primeira execução integral do workflow encontrou erros no passo **Validar TypeScript**. A análise do log mostrou que a maior parte não vinha dos componentes nem da versão instalada do `lucide-react`: os arquivos `tests/types-v2910/stubs.d.ts` e `tests/types-v2920/stubs.d.ts` estavam entrando no `tsconfig.json` principal por causa do padrão `**/*.ts`/`**/*.tsx`.

Esses stubs foram criados para typechecks isolados e exportavam apenas uma lista reduzida de ícones, além de simplificarem o evento JSX para `{ value: string; checked: boolean }`. Isso explica simultaneamente:

- os erros “module lucide-react has no exported member”;
- os erros de `event.target.files`;
- o erro de `event.currentTarget`;
- a grande quantidade de mensagens concentradas nos painéis novos.

### Correções aplicadas

1. `tsconfig.json` agora exclui `tests/types-v2910` e `tests/types-v2920` do typecheck principal.
2. Os typechecks isolados continuam usando seus próprios arquivos `tsconfig.json` e seus stubs locais.
3. `tests/v28-60-advanced-build-intelligence-regression.ts` converte `undefined` para `null` em `maxOverall`.
4. Foi criada `tests/v29-20-typecheck-isolation-regression.mjs`.
5. O pré-voo de produção passou a verificar automaticamente o isolamento dos stubs.

### Validação do hotfix neste ambiente

- 26/26 regressões MJS aprovadas;
- 4/4 regressões CJS funcionais aprovadas;
- 3/3 typechecks isolados aprovados;
- 241 arquivos TypeScript/TSX com sintaxe aprovada;
- 520 botões e 19 imagens aprovados nos contratos de interface;
- 29 verificações de pré-voo aprovadas;
- 66 verificações de auditoria aprovadas.

O `typecheck` integral com os pacotes reais deve ser confirmado por uma nova execução do GitHub Actions. A instalação integral das dependências não estava disponível neste ambiente, portanto este relatório não declara a nova execução remota como concluída.
