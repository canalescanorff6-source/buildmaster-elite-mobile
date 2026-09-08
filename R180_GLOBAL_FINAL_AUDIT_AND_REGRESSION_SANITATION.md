# R180 — GLOBAL FINAL AUDIT + REGRESSION SANITATION

## Status
Candidata final promovida após auditoria global de arquitetura, cadeia de autoridade, fichas, habilidades, Ímpetos, OCR, Cofre e infraestrutura de regressão.

## Objetivo da rodada
A R180 não introduz um novo motor de gameplay. Ela fecha a fase de auditoria global iniciada após a R179, removendo resíduos reais, alinhando regressões históricas às autoridades modulares atuais e acrescentando uma auditoria consolidada que protege a arquitetura moderna.

## Mudanças realizadas

### 1. Auditoria global de módulos
Novo teste `tests/v40-80-r180-global-final-audit-regression.mjs`:
- percorre todo `src`;
- resolve imports estáticos, exports, `import()` dinâmico e `require()`;
- trata entrypoints oficiais do Next, inclusive `app/global-error.tsx`;
- exige que todos os módulos de `src` sejam alcançáveis pelo runtime;
- resultado final: **431/431 módulos alcançáveis**;
- nenhum módulo morto real detectado.

### 2. Single writer / autoridade final
A auditoria R180 exige:
- `BM_R119_CLEAN_SLATE_SINGLE_WRITER` no pipeline canônico;
- `BM_R128_OUTPUT_INTEGRITY` depois da autoridade final;
- apenas `src/lib/cleanSlatePerformance2027V4080R119.ts` materializando `cleanSlate2027R119` como writer;
- integridade R128 cobrindo treino, Top 5, Ímpeto e orçamento.

### 3. Ficha adaptável sem trocar identidade da carta
A regressão histórica v35.00 exigia, incorretamente, progressão idêntica ao usar a mesma carta em posições diferentes.

A trava foi atualizada para o contrato atual R125/R138/R119:
- mesma carta => mesmo `cardKey`;
- mesma âncora natural;
- `usagePosition` explícita;
- progressão pode mudar de forma coerente com a função real de uso;
- a trava `usagePositionAffectsBuildNotCardIdentity` deve permanecer ativa.

Novo runtime R180 confirma em SA/SS vs CA/CF:
- identidade permanente igual;
- build diferente quando a função muda;
- orçamento exato de 64 pontos;
- Top 5 oficial, único e sem repetir habilidade já possuída;
- Ímpeto já aplicado não reaparece como recomendação.

### 4. Regressões OCR alinhadas à arquitetura modular
Os testes v30.30, v30.40, v30.50 e v31.40 ainda procuravam lógica diretamente no `CardVisionApp`.

Eles agora verificam as autoridades atuais:
- `readerAnalysisRuntimeR163.ts` para geometria, smart crop, OCR ultrapreciso e evidência final;
- `learnedOcrLexicon.ts` para persistência do léxico aprendido;
- `CardVisionApp` continua responsável apenas pela confirmação humana que alimenta o léxico.

Nenhuma lógica OCR foi alterada para satisfazer os testes.

### 5. Import morto removido
Removido de `src/lib/ocr.ts` o import de `DEFAULT_OCR_ZONES`, que já não era usado após a modularização do Leitor.

### 6. Sanitizador legado tornado idempotente
`sanitize-update-source.mjs` ainda tentava reaplicar patchers r16-r116 contra a árvore moderna R119+ e falhava ao procurar blocos que já foram corretamente extraídos do `CardVisionApp`.

Agora, ao detectar `BM_R119_CLEAN_SLATE_SINGLE_WRITER`:
- remove apenas manifests temporários, quando existirem;
- não reescreve `src` nem `tests`;
- ignora os patchers textuais históricos;
- retorna como árvore moderna já instalada.

Teste de idempotência executado:
- hash agregado de `src/tests` antes = depois;
- resultado: **PASS**.

## Nova cadeia de release
- `typecheck:r180` => R151 whole-source typecheck;
- `test:r180` => auditoria global + runtime final + static closure;
- `test:v4080` termina em `npm run test:r180`;
- `test:all` continua terminando em `npm run test:v4080`.

## Métricas finais R180
- módulos TS/TSX em `src`: **431**;
- módulos `src` alcançáveis: **431/431**;
- startup CardVision: **188 módulos**;
- fonte estática CardVision: **2.686.413 B**;
- `CardVisionApp.tsx`: **2.524 linhas por `wc -l`**;
- `CardVisionApp.tsx`: **189.428 B**;
- fonte TypeScript total: **5.594.840 B**.

## Validações verdes

### R180
- whole-source TypeScript R151;
- auditoria global R180;
- runtime final R180;
- static closure R180.

### Cadeias críticas revalidadas durante a auditoria
- R119 single writer / Clean Slate;
- R122 DNA e desempenho online;
- R125 posição de uso;
- R126 identidade da carta;
- R128 integridade final;
- R131–R134 evidência OCR;
- R138 fachada canônica;
- R140 commit/rollback;
- R153 fila canônica;
- R154 guard;
- R157 sessão/autosave;
- R163/R164 Leitor;
- R179 fronteira de estado derivado.

### Gates sistêmicos finais
- `quality:syntax`: **661 arquivos TS/TSX**;
- `quality:interactive`: **790 botões / 34 imagens com alt**;
- `quality:visual`: aprovado;
- `quality:audit`: **127/127**;
- `release:preflight`: **138/138**, assinatura lógica `d50261b31a802536`;
- `release:play-preflight`: **27/27**.

## Gate conhecido ainda vermelho: quality:bundle
O orçamento não foi alterado para obter falso verde.

Resultado medido:
- orçamento TypeScript: **5.505.024 B**;
- fonte TypeScript atual: **5.594.840 B**;
- excesso: **89.816 B**;
- aproximadamente **1,63% acima do orçamento**.

Portanto, `quality:bundle` permanece explicitamente como dívida técnica real.

## test:all histórico
O `pretest:all` foi saneado e deixou de tentar reaplicar patchers antigos na árvore moderna. A execução histórica avançou além dos bloqueios anteriores.

Ainda existe um gargalo de performance em `v31-72-complementary-skills-regression.ts`: o teste executa o pipeline completo repetidamente para muitas posições e não conclui dentro da janela prática usada nesta auditoria. O typecheck v31.72 e o teste de autorreparo da rota passam; o runtime complementar é o gargalo conhecido.

Esse ponto não foi mascarado nem removido da suíte. A cobertura moderna equivalente permanece reforçada pela nova matriz runtime R180 e pelas regressões R119/R122/R125/R126/R128.

## Escopo não alterado
A R180 não muda pesos, fórmulas ou regras de gameplay do motor final. Não altera:
- Clean Slate R119;
- DNA R122;
- lógica de progressão R125;
- Top 5/Ímpeto do motor final;
- persistência R140/R153/R154;
- OCR R163/R164;
- Backup;
- navegação;
- UI de produção.

A única mudança em `src` é a remoção do import OCR morto.

## Conclusão
A R180 fecha a auditoria global de coerência arquitetural e regressão. O produto mantém autoridade final única, identidade permanente da carta, ficha adaptável à posição de uso, orçamento exato, Top 5 oficial/único, Ímpeto seguro, OCR modular e grafo de runtime sem módulos mortos reais.

Os dois débitos explicitamente conhecidos permanecem:
1. orçamento `quality:bundle` excedido em 89.816 B;
2. teste histórico v31.72 complementar excessivamente pesado para a janela de execução usada.
