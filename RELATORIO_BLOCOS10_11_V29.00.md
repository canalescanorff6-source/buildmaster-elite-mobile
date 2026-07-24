# Relatório técnico — Blocos 10 e 11

**Aplicativo:** BuildMaster Elite Tático  
**Versão:** 29.00.0  
**Base utilizada:** v28.80 completa — Bloco 9  
**Entrega:** Partidas e Desempenho Competitivo + Nuvem, Backup e Sincronização

## 1. Objetivo da entrega combinada

Os dois blocos foram implementados juntos porque compartilham os mesmos dados críticos. O Bloco 10 transforma partidas registradas em indicadores e ações de melhoria. O Bloco 11 protege essas partidas, junto com fichas, elenco, treinos, formações, imagens e configurações, contra perda, troca de aparelho e conflitos de versão.

A implementação preserva os módulos antigos e adiciona duas camadas próprias:

- um motor competitivo independente;
- um motor de backup integral, comparação, mesclagem e versionamento.

## 2. Bloco 10 — Motor de desempenho competitivo

Arquivo principal:

```text
src/modules/matches/competitivePerformanceEngine.ts
```

Cada partida pode armazenar:

- data e competição;
- divisão;
- formação;
- estilo de jogo;
- técnico;
- perfil do adversário;
- gols marcados e sofridos;
- posse de bola;
- chutes e chutes no alvo;
- erros de passe;
- erros de finalização;
- erros defensivos;
- perdas de bola;
- impacto das substituições;
- qualidade da conexão;
- observações livres.

Os perfis de adversário disponíveis são:

- equilibrado;
- posse de bola;
- contra-ataque rápido;
- bola longa;
- jogo por fora;
- bloco baixo.

## 3. Indicadores competitivos

O resumo por período calcula:

- quantidade de partidas;
- vitórias, empates e derrotas;
- aproveitamento;
- pontos por partida;
- gols marcados, sofridos e saldo;
- jogos sem sofrer gols;
- média de gols;
- eficiência das finalizações;
- posse média;
- erros por partida;
- consistência;
- média de conexão;
- impacto médio das substituições.

Também são gerados rankings separados por:

- formação;
- técnico;
- estilo de jogo;
- perfil do adversário.

Cada combinação recebe número de jogos, vitórias, empates, derrotas, aproveitamento, pontos por partida, saldo e uma nota comparativa.

## 4. Mapa de problemas e correção automática

Os erros são consolidados em quatro grupos:

- passe;
- finalização;
- defesa;
- perda de bola.

O motor calcula total, média por jogo, participação no conjunto de erros e gravidade. A maior dificuldade gera um plano automático com:

- diagnóstico;
- ações imediatas;
- três sessões semanais;
- repetições e metas;
- regras para usar durante partidas;
- critério objetivo de sucesso.

Quando não existe um erro dominante, o sistema trabalha a consistência competitiva.

## 5. Comparação entre períodos

A função de comparação confronta o período atual com o período anterior do mesmo tamanho. São analisados:

- aproveitamento;
- pontos por partida;
- saldo médio;
- erros de passe;
- erros defensivos;
- consistência.

Cada indicador recebe o estado:

- melhor;
- estável;
- pior.

A interface permite trabalhar com 7, 30, 90 dias ou todo o histórico.

## 6. Relatório mensal

O relatório exportável reúne:

- campanha;
- gols;
- consistência;
- conexão;
- mapa de erros;
- melhores formações;
- melhores técnicos;
- comparação com o período anterior;
- prioridade automática;
- regras de correção;
- meta para o próximo ciclo.

## 7. Interface do Bloco 10

Arquivo principal:

```text
src/modules/matches/CompetitivePerformanceCenter.tsx
```

A Central de Desempenho Competitivo foi integrada a:

```text
src/modules/matches/MatchLaboratory.tsx
```

Ela abre como primeira área de Partidas e possui quatro guias:

1. **Painel**;
2. **Registrar**;
3. **Comparar**;
4. **Relatório**.

Treinos e evolução, planejamento, treino guiado anterior e histórico continuam disponíveis.

## 8. Bloco 11 — Estrutura do backup integral

Arquivo principal:

```text
src/modules/backup/syncBackupEngine.ts
```

O esquema de dados foi elevado para:

```text
CURRENT_DATA_SCHEMA = 2900
APP_DATA_VERSION = 29.00.0
```

A nova área `performance` inclui:

- partidas competitivas;
- sessões de treino;
- metas de treino;
- registros guiados antigos;
- meta semanal anterior.

O backup completo continua protegendo as demais áreas já existentes.

## 9. Comparação entre aparelho e nuvem

Cada área é comparada por checksum e classificada como:

- igual;
- somente local;
- somente na nuvem;
- diferente.

O sistema recomenda:

- nenhuma ação;
- manter local;
- trazer a nuvem;
- mesclar.

As áreas comparadas são:

```text
history
settings
calibration
plans
folders
rules
session
evolution
tacticalStudio
customFormations
imageGallery
performance
```

## 10. Mesclagem sem substituição silenciosa

A mesclagem segue regras diferentes conforme o conteúdo:

- listas são unidas pelo identificador estável;
- em registros repetidos, prevalece a atualização mais recente;
- objetos complexos são mesclados recursivamente;
- campos presentes somente no aparelho são preservados;
- campos presentes somente na nuvem são incorporados;
- valores simples usam a versão mais recente do envelope quando não podem ser mesclados.

Antes de baixar, mesclar ou restaurar, o aplicativo cria um ponto de recuperação local.

## 11. Histórico de versões

Cada ponto de restauração registra:

- identificador;
- data;
- rótulo;
- aparelho;
- versão do app;
- checksum;
- tamanho;
- quantidade de registros;
- quantidade de áreas;
- envelope completo.

Limites aplicados:

- até oito versões completas locais;
- até três versões incluídas no pacote de nuvem;
- versões com checksum repetido são deduplicadas.

O armazenamento local usa IndexedDB no novo espaço:

```text
backup-snapshots
```

## 12. Saúde da sincronização

A central calcula uma nota de 0 a 100 considerando:

- integridade dos dados locais;
- quantidade de conflitos;
- idade da última sincronização;
- existência de pontos de restauração.

Estados disponíveis:

- **Protegido**;
- **Atenção**;
- **Risco**.

A recomendação muda conforme conflitos, ausência de sincronização ou cópia desatualizada.

## 13. Interface do Bloco 11

Arquivo principal:

```text
src/modules/backup/CloudSyncCenter.tsx
```

A central foi integrada em **Ajustes › Backup**, abaixo das ferramentas antigas, com três ações principais:

- criar ponto de restauração;
- sincronizar tudo;
- baixar e mesclar.

Também exibe:

- nota de proteção;
- última sincronização;
- diferenças por área;
- recomendação para cada conflito;
- histórico de versões;
- restauração e exclusão manual.

## 14. Compatibilidade com a nuvem existente

As funções antigas do Cofre foram alteradas para preservar o conteúdo completo do cofre remoto. Uma atualização do histórico leve não apaga mais:

- backup integral;
- versões completas;
- metadados de sincronização.

A sincronização completa depende do Supabase configurado para a conta. Sem Supabase, os pontos de restauração locais continuam funcionando.

## 15. Segurança e integridade

Foram preservadas as proteções anteriores:

- validação do envelope;
- checksum;
- limites contra arquivos abusivos;
- bloqueio de chaves usadas em poluição de protótipo;
- isolamento por conta;
- armazenamento protegido;
- cópia de segurança antes de operações destrutivas.

A camada de backup não instala APK, não altera assinatura e não inclui chaves privadas no projeto.

## 16. Atualização automática

Durante a revisão foi encontrada uma falha potencial na fórmula do `versionCode` do Android. A fórmula anterior poderia gerar para a v29.00 um código inferior ao da v28.80.

A fórmula foi corrigida para:

```text
major × 60.000.000
+ minor × 500.000
+ patch × 5.000
+ identificador controlado da execução
```

Validação da transição mínima:

```text
v28.80 anterior: 1.480.000.010
v29.00 nova:     1.740.000.010
limite Android:  2.147.483.647
```

Assim, a atualização permanece crescente e dentro do limite aceito.

## 17. Arquivos adicionados

```text
src/modules/matches/competitivePerformanceEngine.ts
src/modules/matches/CompetitivePerformanceCenter.tsx
src/modules/backup/syncBackupEngine.ts
src/modules/backup/CloudSyncCenter.tsx
src/app/design-system-v2900-competitive-cloud.css
tests/_ts-require.cjs
tests/v29-00-competitive-performance-engine-regression.cjs
tests/v29-00-cloud-sync-engine-regression.cjs
tests/v29-00-integrated-ui-regression.mjs
```

## 18. Arquivos principais alterados

```text
src/modules/matches/MatchLaboratory.tsx
src/components/CardVisionApp.tsx
src/lib/dataSafety.ts
src/lib/localDatabase.ts
src/lib/appUpdates.ts
src/app/globals.css
package.json
package-lock.json
public/manifest.webmanifest
public/sw.js
.github/workflows/build-apk.yml
scripts/audit-project.mjs
```

## 19. Validações executadas

### Regressões da v29.00

- motor competitivo aprovado;
- motor de nuvem e mesclagem aprovado;
- interface integrada aprovada;
- tempo total: **0,76 segundo**.

### Regressões históricas

- **22 de 22 testes estruturais MJS aprovados**;
- atualização;
- Estúdio Tático;
- aplicativo completo;
- ponte nativa;
- correções;
- pesquisa de fichas;
- identidade visual;
- navegação;
- telas principais;
- qualidade final;
- arquitetura e desempenho;
- fichas avançadas;
- Meu Time profissional;
- treinos e evolução;
- integração da v29.00.

### Código

- checagem estrita isolada dos motores aprovada;
- checagem isolada dos dois painéis aprovada;
- **224 arquivos TypeScript/TSX** sem erro sintático;
- auditoria automática com **53 verificações aprovadas**.

### Alertas estruturais preservados

A auditoria mantém dois alertas não bloqueantes:

- `src/components/CardVisionApp.tsx` continua grande;
- `src/lib/analyzer.ts` continua grande.

Os novos recursos foram colocados em módulos separados para não aumentar a lógica central mais do que o necessário.

## 20. Limitação externa registrada

O `npm ci` integral não foi concluído neste ambiente. A tentativa offline encontrou dependência não disponível no cache e as tentativas pelo registro externo não finalizaram. Como consequência, não foram executados localmente:

- typecheck integral de todo o projeto;
- build de produção completo;
- geração do APK.

Essa limitação não foi ocultada. Os módulos novos foram validados por:

- TypeScript estrito isolado;
- checagem sintática geral;
- regressões executáveis;
- auditoria estrutural.

O GitHub Actions permanece responsável por instalar as dependências travadas, executar a bateria completa, gerar, assinar e publicar o APK.

## 21. Resultado

A v29.00 transforma o histórico de partidas em uma ferramenta de evolução competitiva e cria uma camada real de proteção dos dados. O aplicativo agora consegue identificar padrões de desempenho, recomendar correções, comparar períodos e preservar esse progresso em versões locais e na nuvem, sem substituir silenciosamente os dados atuais.
