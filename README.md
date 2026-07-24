# BuildMaster Elite Tático v29.10.0 — Blocos 12 e 13

Este pacote usa a **v29.00 completa** como base e preserva todas as entregas dos Blocos 1 a 11. A v29.10 fecha dois blocos diretamente ligados à operação real do aplicativo:

- **Bloco 12 — Administração, Contas e Segurança**;
- **Bloco 13 — Atualização Automática Definitiva**.

A administração agora possui visão geral, auditoria, aparelhos individuais, limites de ações e política mínima de segurança. O atualizador passa a trabalhar com canais estável e beta, distribuição gradual, pausa, histórico e rollback seguro sem violar a regra de `versionCode` do Android.

## Bloco 12 — Administração, Contas e Segurança

### Administração completa

- central administrativa integrada ao painel de contas existente;
- visão geral de usuários, aparelhos, auditoria e limites;
- criação, renovação, suspensão, reativação e exclusão de usuários preservadas;
- redefinição de senha com revogação de sessões;
- alteração do limite de aparelhos por conta;
- listagem individual dos aparelhos autorizados;
- revogação de um único aparelho sem desconectar todos os outros;
- consulta do histórico administrativo por usuário;
- estado atual do rate limit por tipo de ação;
- política mínima de versão do aplicativo;
- prazo offline configurável;
- controle de clientes legados.

### Proteções obrigatórias

- MFA administrativo AAL2 validado no servidor;
- prova criptográfica do aparelho obrigatória;
- MFA e prova do aparelho não podem ser desligados pela interface;
- identificação do aplicativo e da versão em cada requisição administrativa;
- bloqueio de APK administrativo abaixo da versão mínima;
- rate limit diferente para consultas e ações sensíveis;
- auditoria de ações aprovadas, negadas e com erro;
- `request_id` único para evitar duplicidade de registros;
- senhas nunca são gravadas nos detalhes da auditoria;
- tabelas de governança protegidas por RLS e sem acesso direto de clientes comuns.

### Migração Supabase

Aplicar a migração:

```text
supabase/migrations/202607240001_blocks12_13_admin_update.sql
```

Depois, publicar novamente a Edge Function:

```bash
supabase db push
supabase functions deploy admin-users
```

A migração mantém inicialmente `min_app_version` em pelo menos **29.00.0**, para não bloquear a base instalada antes da publicação da v29.10. Após validar o novo APK, o administrador pode elevar a versão mínima pelo painel protegido por MFA.

## Bloco 13 — Atualização Automática Definitiva

### Governança de publicação

- canal **stable** para produção;
- canal **beta** para testes controlados;
- preferência de canal salva por aparelho;
- rollout gradual de 1% a 100%;
- seleção determinística por aparelho;
- pausa imediata de uma publicação;
- atualização obrigatória respeitando canal, pausa e rollout;
- histórico separado por canal;
- diagnóstico de saúde das rotas;
- exibição da participação do aparelho no rollout;
- metadados de rollback no manifesto;
- checklist de publicação e recuperação dentro do aplicativo.

### Rollback seguro no Android

O Android não permite instalar uma versão com `versionCode` menor. Por isso, o rollback da v29.10 não tenta reinstalar diretamente um APK antigo. O workflow:

1. recebe o `source_ref` de uma versão conhecida como estável;
2. exige uma **nova versão semântica**, superior à versão problemática;
3. gera um novo `versionCode` monotônico;
4. recompila o código estável com a nova identificação;
5. publica o motivo e a versão substituída no manifesto e no histórico.

Isso permite recuperar uma versão funcional sem o Android rejeitar a instalação.

### Compatibilidade com APKs antigos

APKs anteriores não entendem rollout gradual. Para impedir que eles ignorem a porcentagem de liberação:

- o manifesto principal da v29.10 usa esquema 3;
- a ponte legada usa esquema 2;
- a ponte `buildmaster-latest` só avança quando o canal estável está em **100%** e não está pausado;
- durante rollout parcial, APKs antigos permanecem na última versão totalmente aprovada;
- o canal beta nunca altera a ponte dos APKs antigos.

Essa regra evita que a compatibilidade antiga fure a distribuição gradual.

## Como publicar

No GitHub Actions, execute o workflow:

```text
Gerar APK v29.10 com canais, rollout e rollback seguro
```

Entradas disponíveis:

```text
channel: stable ou beta
rollout_percentage: 1 a 100
mandatory: true ou false
paused: true ou false
source_ref: branch, tag ou commit a compilar
release_version: versão que será publicada
rollback_from_version: versão problemática, quando houver rollback
rollback_reason: motivo obrigatório do rollback
```

### Exemplos operacionais

Publicação estável completa:

```text
channel=stable
rollout_percentage=100
paused=false
```

Teste beta:

```text
channel=beta
rollout_percentage=100
paused=false
```

Rollout estável gradual:

```text
channel=stable
rollout_percentage=10
paused=false
```

Pausa emergencial:

```text
paused=true
```

Rollback seguro:

```text
source_ref=<tag ou commit conhecido como estável>
release_version=<nova versão superior>
rollback_from_version=<versão problemática>
rollback_reason=<motivo>
```

## Arquivos principais da v29.10

```text
src/modules/administration/AdministrationSecurityCenter.tsx
src/modules/updates/DefinitiveUpdateCenter.tsx
src/modules/updates/updateGovernance.ts
src/lib/accountAuth.ts
src/lib/appUpdates.ts
src/lib/updateChannel.ts
src/components/UpdateCenterPanel.tsx
src/components/CardVisionApp.tsx
src/app/design-system-v2910-admin-update.css
supabase/functions/admin-users/index.ts
supabase/migrations/202607240001_blocks12_13_admin_update.sql
.github/workflows/build-apk.yml
tests/v29-10-admin-security-regression.mjs
tests/v29-10-update-governance-regression.cjs
tests/v29-10-integrated-ui-regression.mjs
tests/types-v2910/
```

## Versões

```text
Aplicativo: 29.10.0
Dados e backup: 29.10.0
Esquema de dados: 2910
Cache PWA: buildmaster-v29-10
Blocos 10 e 11 preservados: 29.00.0
Treinos e evolução preservados: 28.80.0
Meu Time profissional preservado: 28.70.0
Fichas avançadas preservadas: 28.60.0
Arquitetura modular preservada: 28.50.0
```

## Validação executada

- regressões próprias dos Blocos 12 e 13 aprovadas;
- **24 de 24 testes MJS** aprovados;
- **3 de 3 regressões CJS** aprovadas;
- helper CJS de carregamento executado sem erro;
- duas checagens TypeScript estritas da v29.10 aprovadas;
- **234 arquivos TypeScript/TSX** verificados sintaticamente;
- workflow YAML validado;
- auditoria obrigatória com **60 verificações aprovadas**;
- nenhum APK, keystore, chave privada ou `node_modules` incluído;
- preservação das regressões dos Blocos 1 a 11.

O `npm ci` integral não pôde ser concluído neste ambiente devido à indisponibilidade do registro externo de pacotes. Por isso, o typecheck integral, o build de produção, a assinatura e a instalação do APK devem ser confirmados pelo GitHub Actions. Os módulos novos foram validados por checagens estritas isoladas, testes funcionais, auditoria e regressões históricas.

## Compilação oficial

```bash
npm ci
npm run typecheck
npm run test:all
npm run build
```

Depois, execute o workflow da v29.10 usando a mesma chave de assinatura das versões anteriores.
