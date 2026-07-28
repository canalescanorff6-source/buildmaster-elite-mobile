# Guia de publicação Google Play — BuildMaster v31.30

## 1. Preparar o backend

- Aplique todas as migrações Supabase, incluindo `202607250002_block28_play_publication.sql` e `202607260001_v3010_world_pro_registry.sql`.
- Publique as funções `account-deletion-request`, `play-integrity-verify` e `pro-build-search`.
- Configure os Secrets das funções. Para a busca mundial automática, use `YOUTUBE_DATA_API_KEY` somente no Supabase/GitHub, nunca no APK.
- Teste `/privacidade/` e `/excluir-conta/` em HTTPS sem login.

## 2. Criar o aplicativo no Play Console

Use permanentemente:

- package ID: `com.buildmaster.elitetatico`;
- nome público: `BuildMaster Elite Tático`;
- idioma padrão: Português (Brasil).

Ative o Play App Signing e mantenha a chave de upload fora do repositório.

## 3. Vincular Play Integrity

- Ative a Play Integrity API no projeto Google Cloud.
- Vincule o projeto ao aplicativo no Play Console.
- Copie o número numérico do projeto para a Variable `GOOGLE_PLAY_CLOUD_PROJECT_NUMBER`.
- Configure a conta de serviço no Supabase e, para publicação automatizada, no GitHub.

## 4. Configurar GitHub Actions

Cadastre as Variables e Secrets descritas no README. Execute o workflow **Gerar AAB v31.30 Google Play** primeiro com:

- canal `internal`;
- publicação desativada;
- rollout 100%;
- release draft.

Baixe o artefato e confira o arquivo `.sha256`.

## 5. Primeira publicação interna

Execute novamente com `publish_to_play=true` e status `draft`. Revise no Play Console e depois conclua a release interna. Instale o aplicativo pela Google Play, não por sideload, para validar licenciamento e Play Integrity.

## 6. Testes obrigatórios

- instalação limpa;
- login e sessão persistente;
- licença e aparelhos;
- OCR de prints variados;
- fichas de jogador de linha e goleiro;
- importação de PNG/JPEG;
- Meu Time, Estúdio Tático e Assistente de adversário;
- treino, partidas e anti-delay;
- backup, restauração e sincronização;
- In-App Updates;
- solicitação de exclusão dentro do app e pela página pública;
- funcionamento em aparelho modesto, S20 FE e Moto G56;
- estabilidade, aquecimento, falhas e ANRs.

## 7. Preencher a ficha e políticas

Use `play-store/listing/pt-BR/` como base. Revise e publique contato real, política de privacidade, Segurança dos Dados, classificação, anúncios e acesso para análise. Tire capturas reais do AAB final.

## 8. Avançar pelos canais

Ordem recomendada:

1. interno;
2. fechado (`alpha` no workflow);
3. aberto (`beta` no workflow);
4. produção.

Na produção, comece com rollout gradual e acompanhe Android vitals antes de ampliar o percentual.

## 9. Rollback

Na Google Play não se instala um `versionCode` menor. Para corrigir uma versão problemática, gere uma nova build com código superior, interrompa o rollout afetado e publique a correção. O workflow calcula códigos monotônicos automaticamente.

## Destaque da versão

Motor Supremo de Fichas v31.30 com otimização personalizada, contexto tático e teste A/B.
