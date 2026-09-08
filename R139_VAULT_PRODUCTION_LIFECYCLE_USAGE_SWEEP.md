# R139 — Vault Production Lifecycle + Canonical Usage Sweep

## Objetivo

Fechar a migração iniciada na R138 para que **posição real de uso** seja a referência funcional em toda a aplicação e para que o Cofre não conheça diretamente as implementações históricas da autoridade de produção.

A regra central permanece:

- `bestPosition` = melhor posição **estimada/diagnóstica** do analisador;
- `usagePosition` = posição **real escolhida** para esta ficha;
- persistência, experimentos, elenco, correções e relatórios funcionais devem usar `usagePosition`;
- o escritor final da ficha continua sendo o Clean Slate, acessado pela fachada oficial de produção.

## 1. Lifecycle único do Cofre

Novo módulo:

`src/modules/vault/vaultProductionLifecycleR139.ts`

Responsabilidades extraídas do `CardVisionApp`:

- abrir ficha salva;
- atualizar ficha antiga para a autoridade vigente;
- preparar salvamento/atualização do registro;
- evitar duplicata canônica;
- recalcular/validar qualidade antes do save;
- marcar/desmarcar Top 5 sem ganhar autoridade sobre a build;
- reaplicar selo de identidade/evidência antes de persistir.

A UI não monta mais manualmente `SavedAnalysis` e não chama diretamente os mecanismos internos R128 de upgrade.

## 2. Migração off-position segura

Uma ficha antiga pode ter:

- posição natural: `CF`;
- `bestPosition`: `CF`;
- uso real: `CB`.

R139 preserva `usagePosition=CB` durante migração/reconstrução. A ficha não volta silenciosamente para a posição diagnóstica do analisador.

## 3. Selo persistido após mudança no Top 5

Ao marcar que uma habilidade recomendada já foi adquirida:

- progressão oficial não é reescrita;
- Top 5 oficial não é recalculado por uma autoridade paralela;
- Ímpeto oficial não é alterado;
- metadado `skillProgress` é atualizado;
- identidade/evidência do registro é selada novamente antes da persistência.

Isso evita uma situação em que a tela está correta, mas o registro salvo permanece com selo obsoleto.

## 4. Varredura de posição real

R139 substitui usos funcionais restantes de `bestPosition` por `analysisUsagePositionR138()` nas áreas em que a posição representa função atual/destino/experimento.

Áreas cobertas:

- Cofre e filtros;
- Result Workspace;
- painel de precisão;
- compartilhamento compacto;
- relatórios de build;
- DNA/diagnósticos de utilização;
- correções dinâmicas;
- assinaturas de experimento;
- auditorias de confiança;
- otimização de time;
- rotação e banco;
- química/entrosamento;
- motor profissional de elenco;
- Formation Role Engine;
- Mapa Completo do Time.

`bestPosition` permanece disponível apenas quando o significado explícito for **melhor posição estimada**.

## 5. Correções por função não vazam entre posições

A mesma carta usada como `CB` e `DMF` mantém a mesma identidade intrínseca, mas possui identidades funcionais diferentes.

Logo:

- correção aprendida no `CB` não é automaticamente aplicada ao `DMF`;
- experimentos não colidem;
- relatórios não confundem função real com posição diagnóstica;
- planejamento do elenco conta a função real da ficha.

## 6. Elenco respeita a ficha realmente criada

Caso de proteção:

- carta natural `CF`;
- `bestPosition=CF`;
- ficha criada para `CB`.

O planejador deve contabilizar esse jogador como cobertura/zagueiro, e não como finalizador, quando a ficha utilizada no elenco é a variante `CB`.

Isso foi aplicado em Team Optimizer, Squad Rotation, Squad Chemistry, Professional Squad Engine, Formation Role Engine e Team Full Map.

## 7. Fachada de análise pública endurecida

Módulos de UI/produção usam a fachada R138. Entradas históricas de produção não são reexportadas como API pública comum.

O Cofre também passa pela fachada atual, em vez de depender diretamente de `productionAnalysisR128`/`productionAuthorityR128`.

## 8. Compatibilidade de testes históricos

Dois contratos antigos foram atualizados porque verificavam **localização física da implementação** dentro de `CardVisionApp` em vez do comportamento público:

- integração do Cofre v38;
- R128 output-integrity/vault transaction.

A garantia funcional permanece, mas o teste agora acompanha o lifecycle modular R139.

## 9. Validação R139

Teste novo:

`tests/v40-80-r139-vault-production-lifecycle-usage-sweep-regression.ts`

Protege:

- `bestPosition=CF` + `usagePosition=CB` continua sendo `CB`;
- `CB` e `DMF` da mesma carta geram chaves funcionais distintas;
- Team Optimizer conta a função real;
- Rotation preserva a posição real;
- Cofre salva pela fachada oficial;
- Top 5 não reescreve progressão/Ímpeto;
- output adulterado é reconstruído ao abrir;
- migração preserva `usagePosition`;
- UI não volta a chamar APIs históricas do Cofre;
- módulos sensíveis não voltam a usar `bestPosition` como posição real.

## 10. Resultado estrutural

`CardVisionApp.tsx` fica em aproximadamente **4.059 linhas** e deixa de construir manualmente registros do Cofre.

R139 não cria novo motor competitivo. Ela reduz caminhos paralelos e reforça a cadeia:

**Evidência → Fachada de Produção R138 → Clean Slate → Selo → Lifecycle do Cofre R139**

A posição funcional usada em persistência, aprendizado, experimentos e elenco passa a ser a mesma posição escolhida para a ficha.
