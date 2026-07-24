# Relatório técnico — BuildMaster v29.10.0

## Blocos 12 e 13: Administração, Segurança e Atualização Definitiva

**Data da revisão:** 24 de julho de 2026  
**Base utilizada:** BuildMaster v29.00.0 — Blocos 10 e 11 completos  
**Versão resultante:** BuildMaster v29.10.0

## 1. Objetivo

A v29.10 foi criada para fechar dois riscos de produção que ainda existiam depois da v29.00:

1. a administração possuía ações essenciais, mas não oferecia supervisão completa de aparelhos, auditoria, limites e política mínima do APK;
2. o atualizador possuía rotas e validações fortes, porém ainda não tinha governança completa de canais, rollout gradual, pausa, histórico e rollback compatível com as regras do Android.

Nenhum módulo dos Blocos 1 a 11 foi removido. As novas centrais foram acopladas às áreas administrativas e de atualização já existentes.

## 2. Bloco 12 — Administração, Contas e Segurança

### 2.1 Central administrativa avançada

Foi criado o componente:

```text
src/modules/administration/AdministrationSecurityCenter.tsx
```

A central reúne:

- pontuação de proteção;
- total de usuários e aparelhos;
- aparelhos ativos e revogados;
- ações administrativas recentes;
- estado dos limites de requisição;
- versão mínima aceita;
- prazo máximo de funcionamento offline;
- política de clientes legados;
- listagem de aparelhos por usuário;
- revogação individual de aparelho;
- auditoria com resultado, versão do app e identificador da requisição.

A central complementa, e não substitui, o `AccountAdminPanel` anterior.

### 2.2 Edge Function administrativa

A função `supabase/functions/admin-users/index.ts` foi ampliada com as ações:

```text
overview
list_devices
revoke_device
list_audit
get_security_settings
update_security_settings
rate_limit_status
```

As ações anteriores de criação, renovação, status, senha, limite de aparelhos, revogação geral e exclusão foram preservadas.

### 2.3 Controles obrigatórios no servidor

A função agora valida:

- identificador oficial do aplicativo;
- versão mínima permitida;
- usuário administrador ativo;
- sessão com MFA AAL2;
- limite de requisições por ação;
- dados obrigatórios de cada comando;
- auditoria de sucesso, negação e erro.

As configurações `admin_mfa_required` e `require_device_proof` são forçadas como verdadeiras no servidor e aparecem bloqueadas na interface. Assim, uma configuração incorreta no painel não consegue enfraquecer a proteção.

### 2.4 Auditoria segura

Foram adicionados:

- `outcome`: sucesso, negado ou erro;
- `app_version`;
- `request_id` único;
- índices por data e usuário-alvo;
- deduplicação por requisição.

Em redefinições de senha, a auditoria registra somente que a senha mudou e que as sessões foram revogadas. O valor da senha não é armazenado.

### 2.5 Rate limit

Consultas possuem janela mais ampla, enquanto ações sensíveis têm limite menor. A central mostra o consumo atual por categoria. O controle continua no servidor por meio de `buildmaster_take_admin_rate_limit`.

### 2.6 Migração de banco

Foi criada:

```text
supabase/migrations/202607240001_blocks12_13_admin_update.sql
```

Ela:

- amplia a auditoria administrativa;
- mantém a versão mínima em pelo menos 29.00.0 durante a transição;
- desativa clientes legados por padrão;
- obriga MFA e prova do aparelho;
- cria governança de releases;
- cria histórico de releases;
- ativa RLS;
- remove acesso direto das funções `anon` e `authenticated`.

## 3. Bloco 13 — Atualização Automática Definitiva

### 3.1 Canais estável e beta

O atualizador passa a reconhecer:

```text
buildmaster-update
buildmaster-update-beta
```

A preferência é armazenada por aparelho. No canal beta, o app pode consultar a publicação de testes e manter a versão estável como alternativa. No canal estável, manifestos beta são ignorados.

### 3.2 Rollout determinístico

Cada publicação inclui:

```text
rolloutPercentage
rolloutSalt
```

O aplicativo gera uma faixa determinística por aparelho. O mesmo aparelho permanece dentro ou fora do rollout enquanto o sal da publicação não mudar, evitando comportamento aleatório entre verificações.

### 3.3 Pausa e obrigatoriedade

O manifesto aceita `paused`. Uma publicação pausada não é oferecida, mesmo quando possui número superior. A obrigatoriedade continua sendo respeitada somente quando canal, política e rollout permitem a atualização.

### 3.4 Histórico e diagnóstico

Foi criado:

```text
src/modules/updates/updateGovernance.ts
src/modules/updates/DefinitiveUpdateCenter.tsx
```

A central mostra:

- canal selecionado;
- versão e código publicados;
- percentual de rollout;
- faixa do aparelho;
- estado pausado ou ativo;
- saúde das rotas;
- histórico do canal;
- metadados de rollback;
- checklist operacional.

O workflow publica `release-history.json` separadamente em cada branch de canal.

### 3.5 Rollback correto para Android

Um APK com `versionCode` menor não pode substituir uma versão instalada. A v29.10 trata rollback como uma nova publicação:

- o operador informa o `source_ref` conhecido como estável;
- fornece uma nova versão superior;
- informa a versão problemática e o motivo;
- o workflow recompila o código estável;
- gera `versionCode` maior;
- publica metadados de rollback no manifesto e histórico.

A fórmula de `versionCode` permanece monotônica:

```text
major × 60.000.000
+ minor × 500.000
+ patch × 5.000
+ execução × 10
+ tentativa
```

O workflow também rejeita rollback sem referência de código, nova versão e motivo.

### 3.6 Proteção da ponte legada

Durante a validação foi identificado um risco importante: APKs antigos não conhecem `rolloutPercentage` nem `paused`. Se a rota `buildmaster-latest` fosse atualizada durante um rollout de 10%, esses APKs poderiam instalar a versão imediatamente e furar a distribuição gradual.

A correção aplicada foi:

- manifestos modernos usam `schemaVersion: 3`;
- o manifesto legado usa `schemaVersion: 2`;
- a ponte legada só é promovida quando:
  - o canal é `stable`;
  - o rollout é 100%;
  - a publicação não está pausada;
- o canal beta nunca promove a ponte antiga;
- durante rollout parcial, APKs antigos permanecem na última versão estável totalmente liberada.

Essa foi a principal correção preventiva do Bloco 13.

## 4. Arquivos principais alterados

```text
.env.example
.github/workflows/build-apk.yml
package.json
package-lock.json
public/manifest.webmanifest
public/sw.js
scripts/audit-project.mjs
src/app/design-system-v2910-admin-update.css
src/app/globals.css
src/app/layout.tsx
src/components/CardVisionApp.tsx
src/components/UpdateCenterPanel.tsx
src/lib/accountAuth.ts
src/lib/appUpdates.ts
src/lib/dataSafety.ts
src/lib/updateChannel.ts
src/modules/administration/AdministrationSecurityCenter.tsx
src/modules/administration/index.ts
src/modules/updates/DefinitiveUpdateCenter.tsx
src/modules/updates/updateGovernance.ts
src/modules/updates/index.ts
supabase/functions/admin-users/index.ts
supabase/migrations/202607240001_blocks12_13_admin_update.sql
```

## 5. Testes adicionados

```text
tests/v29-10-admin-security-regression.mjs
tests/v29-10-update-governance-regression.cjs
tests/v29-10-integrated-ui-regression.mjs
tests/types-v2910/tsconfig.json
tests/types-v2910/tsconfig-channel.json
```

## 6. Resultado da validação

| Verificação | Resultado |
|---|---:|
| Testes MJS históricos e atuais | 24/24 aprovados |
| Regressões CJS efetivas | 3/3 aprovadas |
| Helper CJS | Executado sem erro |
| Typecheck estrito v29.10 | 2 configurações aprovadas |
| Sintaxe TypeScript/TSX | 234 arquivos aprovados |
| Workflow GitHub Actions | YAML válido |
| Auditoria do projeto | 60 verificações aprovadas |
| Regressões dos Blocos 1–11 | Preservadas |
| Segredos, keystore e APK no pacote | Nenhum encontrado |

A auditoria manteve dois alertas estruturais já conhecidos:

- `src/components/CardVisionApp.tsx` continua grande;
- `src/lib/analyzer.ts` continua grande.

Eles não impediram os testes e não foram aumentados com a lógica principal dos novos blocos, que permanece em módulos separados.

## 7. Limitação de validação local

O registro externo de pacotes não permitiu concluir novamente o `npm ci` neste ambiente. Em consequência, não foram executados localmente:

- typecheck integral de todo o projeto com todas as dependências instaladas;
- build Next.js de produção;
- sincronização Capacitor;
- compilação e assinatura do APK;
- teste real de atualização entre dois APKs instalados.

Foram executados testes funcionais dos novos motores, checagens TypeScript estritas isoladas, validação sintática do código, regressões históricas, auditoria e validação do workflow. O GitHub Actions permanece responsável pela instalação limpa, typecheck integral, testes, build, assinatura e publicação oficial.

## 8. Implantação recomendada

1. aplicar a migração Supabase;
2. publicar novamente a função `admin-users`;
3. gerar uma versão beta da v29.10;
4. validar login administrativo, MFA, dispositivos e auditoria;
5. validar download e instalação do beta;
6. publicar estável com rollout pequeno;
7. observar o histórico e o diagnóstico;
8. ampliar gradualmente até 100%;
9. somente em 100% a ponte antiga será promovida automaticamente;
10. após confirmação da base instalada, elevar `min_app_version` pelo painel.

## 9. Próximos blocos

Após a v29.10, a sequência planejada é:

- **Bloco 14 — Testes e Estabilidade**;
- **Bloco 15 — Versão Final de Produção**.
